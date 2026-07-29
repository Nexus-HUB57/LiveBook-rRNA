/**
 * CHIMERA v4.0 — Agent Loop
 * The core ReAct / Plan-and-Execute loop that drives agent cognition.
 * Supports streaming, tool execution, memory integration, and handoffs.
 */

import type {
  AgentConfig, AgentLoopConfig, AgentLoopResult, LoopStep,
  ExecutionContext, Task, ToolCall, HandoffRequest, HandoffResult,
} from './types';
import { v4 as uuid } from 'uuid';
import { getToolRegistry } from './tool-registry';
import { getMemoryManager } from './memory-manager';
import { getPlanningEngine } from './planning-engine';
import { AgentEventBus } from './event-bus';

const DEFAULT_LOOP_CONFIG: AgentLoopConfig = {
  maxIterations: 15,
  maxTokensPerStep: 4096,
  reasoningEffort: 'medium',
  strategy: 'react',
  verbose: false,
};

export class AgentLoop {
  private config: AgentLoopConfig;
  private steps: LoopStep[] = [];
  private totalTokens = 0;
  private totalToolCalls = 0;
  private totalCost = 0;
  private startTime = 0;
  private eventBus: AgentEventBus;

  constructor(config?: Partial<AgentLoopConfig>) {
    this.config = { ...DEFAULT_LOOP_CONFIG, ...config };
    this.eventBus = AgentEventBus.getInstance();
  }

  /** Run the agent loop to completion */
  async run(ctx: ExecutionContext): Promise<AgentLoopResult> {
    this.startTime = Date.now();
    this.steps = [];
    this.totalTokens = 0;
    this.totalToolCalls = 0;
    this.totalCost = 0;

    const { agent, task, loopConfig } = ctx;
    const memory = getMemoryManager(agent.id);
    const toolRegistry = getToolRegistry();
    const tools = toolRegistry.getToolsForAgent(agent.tools);

    // Emit start event
    this.eventBus.emit({
      type: 'agent.status_change',
      agentId: agent.id,
      taskId: task.id,
      payload: { status: 'thinking' },
      timestamp: new Date().toISOString(),
    });

    // Build initial messages with system prompt + memory context
    const memoryContext = memory.buildContext(agent.id, task.id);
    const systemPrompt = this.buildSystemPrompt(agent, tools, memoryContext);
    const messages: Array<Record<string, unknown>> = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: task.description },
    ];

    let finalAnswer = '';
    let iteration = 0;

    // Plan-and-Execute strategy: generate plan first
    if (this.config.strategy === 'plan-and-execute' || this.config.strategy === 'hybrid') {
      const planner = getPlanningEngine();
      const plan = await planner.generatePlan({
        taskTitle: task.title,
        taskDescription: task.description,
        priority: task.priority,
        availableTools: tools.map(t => t.name),
        context: memoryContext || undefined,
      });

      this.addStep({
        iteration: 0,
        type: 'thinking',
        content: `Generated plan with ${plan.steps.length} steps (strategy: ${plan.strategy})\n${plan.steps.map(s => `  [${s.status}] ${s.id}: ${s.action}`).join('\n')}`,
        agentId: agent.id,
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
      });

      // Execute plan steps
      for (const step of plan.steps) {
        iteration++;
        if (iteration > this.config.maxIterations) break;

        const stepResult = await this.executePlanStep(step, messages, agent, task, tools, toolRegistry, memory);
        if (stepResult.isFinal) {
          finalAnswer = stepResult.content;
          break;
        }
      }
    } else {
      // ReAct loop
      while (iteration < this.config.maxIterations) {
        iteration++;

        // Call LLM
        const llmResult = await this.callLLM(agent, messages, tools);
        this.totalTokens += llmResult.tokensUsed || 0;
        this.totalCost += llmResult.costUsd || 0;

        const message = llmResult.message;
        messages.push(message);

        // Check for tool calls
        if (llmResult.toolCalls && llmResult.toolCalls.length > 0) {
          for (const tc of llmResult.toolCalls) {
            this.totalToolCalls++;
            const toolResult = await this.executeToolCall(tc, tools, toolRegistry, agent, task);

            messages.push({
              role: 'tool',
              tool_call_id: tc.id,
              content: JSON.stringify(toolResult),
            });

            // Store in memory
            memory.create({
              agentId: agent.id,
              taskId: task.id,
              type: 'episodic',
              content: `Tool ${tc.name} returned: ${JSON.stringify(toolResult).slice(0, 500)}`,
              importance: 0.6,
            });
          }
        } else {
          // Final answer (no more tool calls)
          finalAnswer = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
          this.addStep({
            iteration,
            type: 'final_answer',
            content: finalAnswer,
            agentId: agent.id,
            tokensUsed: llmResult.tokensUsed,
            timestamp: new Date().toISOString(),
          });
          break;
        }
      }
    }

    // Store result in memory
    if (finalAnswer) {
      memory.create({
        agentId: agent.id,
        taskId: task.id,
        type: 'semantic',
        content: `Task result: ${finalAnswer.slice(0, 1000)}`,
        importance: 0.9,
        metadata: { taskId: task.id, tokensUsed: this.totalTokens },
      });
    }

    const duration = Date.now() - this.startTime;

    this.eventBus.emit({
      type: 'agent.completed',
      agentId: agent.id,
      taskId: task.id,
      payload: { success: !!finalAnswer, duration, tokens: this.totalTokens },
      timestamp: new Date().toISOString(),
    });

    return {
      success: !!finalAnswer,
      finalAnswer: finalAnswer || 'Agent loop exhausted iterations without producing a final answer.',
      steps: this.steps,
      totalTokensUsed: this.totalTokens,
      totalDurationMs: duration,
      totalToolCalls: this.totalToolCalls,
      agentId: agent.id,
      taskId: task.id,
      costUsd: this.totalCost,
    };
  }

  /** Build system prompt with tool definitions and memory */
  private buildSystemPrompt(agent: AgentConfig, tools: ReturnType<typeof getToolRegistry>['getToolsForAgent'] extends Array<infer T> ? T[] : never, memoryContext: string): string {
    let prompt = agent.systemPrompt;

    if (tools.length > 0) {
      const toolDescriptions = tools.map(t => `- ${t.name}: ${t.description}`).join('\n');
      prompt += `\n\n## Available Tools\n${toolDescriptions}\n\nUse tools when needed. Call tools by name with appropriate arguments. When you have enough information to answer the user, respond directly without calling more tools.`;
    }

    if (memoryContext) {
      prompt += `\n\n${memoryContext}`;
    }

    prompt += `\n\n## Instructions\n- Think step by step.
- Use tools when you need external information or actions.
- When done, provide a clear, complete answer.
- If you need to hand off to another agent, say "HANDOFF: <agent_name>" with context.`;

    return prompt;
  }

  /** Call the LLM via 9router bridge */
  private async callLLM(
    agent: AgentConfig,
    messages: Array<Record<string, unknown>>,
    tools: unknown[],
  ): Promise<{ message: Record<string, unknown>; toolCalls: Array<{ id: string; name: string; arguments: string }>; tokensUsed: number; costUsd: number }> {
    try {
      const { call9Router } = await import('@/lib/9router-bridge');
      const toolDefs = tools.length > 0 ? getToolRegistry().getToolsAsFunctions() : undefined;

      const response = await call9Router({
        model: agent.model,
        provider: agent.provider,
        messages,
        tools: toolDefs,
        temperature: agent.temperature ?? 0.7,
        max_tokens: this.config.maxTokensPerStep,
      });

      const resp = response as Record<string, unknown>;
      const choice = (resp.choices as Array<Record<string, unknown>>)?.[0];
      const msg = (choice?.message as Record<string, unknown>) ?? {};

      return {
        message: msg,
        toolCalls: (msg.tool_calls as Array<Record<string, unknown>>)?.map(tc => ({
          id: String(tc.id),
          name: String(tc.function?.name ?? tc.name),
          arguments: String(tc.function?.arguments ?? '{}'),
        })) ?? [],
        tokensUsed: (resp.usage as Record<string, unknown>)?.total_tokens as number ?? 0,
        costUsd: 0,
      };
    } catch (err) {
      this.addStep({
        iteration: this.steps.length,
        type: 'error',
        content: `LLM call failed: ${err instanceof Error ? err.message : String(err)}`,
        agentId: agent.id,
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
      });
      return { message: { role: 'assistant', content: 'Error calling LLM.' }, toolCalls: [], tokensUsed: 0, costUsd: 0 };
    }
  }

  /** Execute a tool call and return the result */
  private async executeToolCall(
    tc: { id: string; name: string; arguments: string },
    tools: unknown[],
    registry: ReturnType<typeof getToolRegistry>,
    agent: AgentConfig,
    task: Task,
  ): Promise<unknown> {
    const startTime = Date.now();
    const toolDef = tools.find((t: { name: string }) => t.name === tc.name);
    const toolId = (toolDef as { id: string } | undefined)?.id;

    this.addStep({
      iteration: this.steps.length,
      type: 'tool_call',
      content: `Calling tool: ${tc.name}(${tc.arguments})`,
      toolCall: {
        id: tc.id,
        toolId: toolId ?? tc.name,
        agentId: agent.id,
        taskId: task.id,
        arguments: JSON.parse(tc.arguments),
        status: 'running',
        startedAt: new Date().toISOString(),
      },
      agentId: agent.id,
      tokensUsed: 0,
      timestamp: new Date().toISOString(),
    });

    try {
      const args = JSON.parse(tc.arguments);
      const result = toolId ? await registry.executeTool(toolId, args) : { error: `Tool ${tc.name} not found` };
      const duration = Date.now() - startTime;

      this.addStep({
        iteration: this.steps.length,
        type: 'tool_result',
        content: typeof result === 'string' ? result.slice(0, 1000) : JSON.stringify(result).slice(0, 1000),
        agentId: agent.id,
        tokensUsed: 0,
        timestamp: new Date().toISOString(),
      });

      return result;
    } catch (err) {
      return { error: err instanceof Error ? err.message : String(err) };
    }
  }

  /** Execute a single plan step */
  private async executePlanStep(
    step: { id: string; action: string; tool?: string; reasoning: string },
    messages: Array<Record<string, unknown>>,
    agent: AgentConfig,
    task: Task,
    tools: unknown[],
    registry: ReturnType<typeof getToolRegistry>,
    memory: ReturnType<typeof getMemoryManager>,
  ): Promise<{ isFinal: boolean; content: string }> {
    // Add step as user message
    messages.push({
      role: 'user',
      content: `Execute step: ${step.action}\nReasoning: ${step.reasoning}${step.tool ? `\nSuggested tool: ${step.tool}` : ''}`,
    });

    const llmResult = await this.callLLM(agent, messages, step.tool ? tools : []);
    this.totalTokens += llmResult.tokensUsed || 0;

    const content = typeof llmResult.message.content === 'string'
      ? llmResult.message.content
      : JSON.stringify(llmResult.message.content);

    messages.push(llmResult.message);

    this.addStep({
      iteration: this.steps.length,
      type: 'observation',
      content: `[Step ${step.id}] ${content.slice(0, 500)}`,
      agentId: agent.id,
      tokensUsed: llmResult.tokensUsed,
      timestamp: new Date().toISOString(),
    });

    // Check if this looks like a final answer
    const isFinal = !llmResult.toolCalls || llmResult.toolCalls.length === 0;
    return { isFinal, content };
  }

  /** Add a step to the trace */
  private addStep(step: LoopStep): void {
    this.steps.push(step);
    this.config.onStep?.(step);
  }
}
