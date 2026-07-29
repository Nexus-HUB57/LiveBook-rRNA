import { NextRequest, NextResponse } from 'next/server';
import { BUILTIN_AGENTS, AgentLoop, AgentEventBus } from '@/lib/agentic';
import { persistFullExecution } from '@/lib/agentic/persistence';
import { registerAllToolHandlers } from '@/lib/agentic/tool-handlers';
import { registerDemoMCPServer } from '@/lib/agentic/mcp-demo-bridge';
import { v4 as uuid } from 'uuid';
import { getToolRegistry } from '@/lib/agentic';
import { getMemoryManager } from '@/lib/agentic';
import type { Task, ExecutionContext, AgentLoopConfig } from '@/lib/agentic';

// Ensure all tool handlers and MCP demo are registered on first request
let _initialized = false;
function ensureInitialized() {
  if (_initialized) return;
  _initialized = true;
  try { registerAllToolHandlers(); } catch { /* handlers may fail in some envs */ }
  try { registerDemoMCPServer(); } catch { /* demo may fail */ }
}

/** GET /api/agentic/agents — List all available agents */
export async function GET() {
  ensureInitialized();
  return NextResponse.json({
    agents: BUILTIN_AGENTS.map(a => ({
      ...a,
      status: 'idle',
      toolDetails: getToolRegistry().getToolsForAgent(a.tools).map(t => ({
        id: t.id, name: t.name, category: t.category,
      })),
    })),
  });
}

/** POST /api/agentic/agents — Execute an agent with a prompt */
export async function POST(req: NextRequest) {
  try {
    ensureInitialized();
    const body = await req.json();
    const { agentId, prompt, title, strategy, maxIterations } = body;

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const agent = BUILTIN_AGENTS.find(a => a.id === (agentId ?? 'agentica-orchestrator')) ?? BUILTIN_AGENTS[0];
    const tools = getToolRegistry().getToolsForAgent(agent.tools);
    const memory = getMemoryManager(agent.id);

    const task: Task = {
      id: uuid(),
      agentId: agent.id,
      title: title || prompt.slice(0, 80),
      description: prompt,
      priority: 'medium',
      status: 'in_progress',
      assignedModel: agent.model,
      assignedProvider: agent.provider,
      steps: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    AgentEventBus.getInstance().emit({
      type: 'task.created',
      agentId: agent.id,
      taskId: task.id,
      payload: { title: task.title, strategy },
      timestamp: new Date().toISOString(),
    });

    const ctx: ExecutionContext = {
      agent,
      task,
      memory: memory.query({ agentId: agent.id }),
      availableTools: tools,
      mcpServers: [],
      loopConfig: {
        maxIterations: maxIterations ?? agent.maxSteps ?? 10,
        maxTokensPerStep: agent.maxTokens ?? 4096,
        strategy: strategy ?? 'react',
      },
    };

    const loop = new AgentLoop(ctx.loopConfig);
    const result = await loop.run(ctx);

    // Fire-and-forget persistence — errors must not break the response
    persistFullExecution(task, result).catch(() => {});

    return NextResponse.json({
      success: result.success,
      task: task.id,
      agent: agent.id,
      answer: result.finalAnswer,
      stats: {
        steps: result.steps.length,
        toolCalls: result.totalToolCalls,
        tokensUsed: result.totalTokensUsed,
        durationMs: result.totalDurationMs,
        costUsd: result.costUsd,
      },
      trace: result.steps.map(s => ({
        iteration: s.iteration,
        type: s.type,
        content: s.content.slice(0, 300),
        toolCall: s.toolCall ? { name: s.toolCall.toolId } : undefined,
      })),
    });
  } catch (err) {
    return NextResponse.json({
      error: 'Agent execution failed',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
