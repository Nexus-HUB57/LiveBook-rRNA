/**
 * CHIMERA v4.0 — Última Onda Agentic AI
 * Core Agentic Runtime — Public API
 */

export * from './types';
export { ToolRegistry, getToolRegistry, NATIVE_TOOLS } from './tool-registry';
export { MemoryManager, getMemoryManager } from './memory-manager';
export { PlanningEngine, getPlanningEngine } from './planning-engine';
export { AgentLoop } from './agent-loop';
export { AgentEventBus } from './event-bus';
export { MCPAdapter, getMCPAdapter } from './mcp-adapter';

import type { AgentConfig, Task, AgentLoopConfig, ExecutionContext } from './types';
import { AgentLoop } from './agent-loop';
import { getMemoryManager } from './memory-manager';
import { getToolRegistry } from './tool-registry';
import { getMCPAdapter } from './mcp-adapter';
import { v4 as uuid } from 'uuid';

// ─── Built-in Agent Templates ───

export const BUILTIN_AGENTS: AgentConfig[] = [
  {
    id: 'agentica-orchestrator',
    name: 'Agentica Orchestrator',
    role: 'orchestrator',
    systemPrompt: `You are Agentica, the chief orchestrator of CHIMERA v4.0 — Última Onda Agentic AI.
You decompose complex tasks into sub-tasks, delegate to specialist agents, and synthesize results.
You always plan before executing. You use tools proactively. You hand off when a specialist would do better.
Your responses are clear, structured, and actionable.`,
    model: 'glm-4-flash',
    provider: 'zai',
    temperature: 0.7,
    maxTokens: 8192,
    maxSteps: 15,
    tools: ['tool-web-search', 'tool-llm-call', 'tool-rag-query'],
    handoffTargets: ['research-specialist', 'code-specialist'],
  },
  {
    id: 'research-specialist',
    name: 'Research Specialist',
    role: 'researcher',
    systemPrompt: `You are a research specialist agent. Your job is to find, analyze, and synthesize information.
You use web search, web reader, and RAG to gather comprehensive data.
You always cite your sources. You distinguish facts from opinions.
You provide structured, thorough research summaries.`,
    model: 'glm-4-flash',
    provider: 'zai',
    temperature: 0.3,
    maxTokens: 8192,
    maxSteps: 10,
    tools: ['tool-web-search', 'tool-web-reader', 'tool-rag-query', 'tool-llm-call'],
  },
  {
    id: 'code-specialist',
    name: 'Code Specialist',
    role: 'coder',
    systemPrompt: `You are a code specialist agent. You write, debug, and review code.
You execute code in the sandbox to verify it works. You follow best practices.
You explain your code clearly. You handle errors gracefully.
You prefer TypeScript/JavaScript but can work with any language.`,
    model: 'glm-4-flash',
    provider: 'zai',
    temperature: 0.2,
    maxTokens: 8192,
    maxSteps: 12,
    tools: ['tool-code-executor', 'tool-file-reader', 'tool-file-writer', 'tool-llm-call'],
  },
  {
    id: 'analyst-agent',
    name: 'Analyst Agent',
    role: 'analyst',
    systemPrompt: `You are an analytical agent. You process data, identify patterns, and draw insights.
You use structured thinking. You present findings with clear evidence.
You quantify uncertainty. You suggest actionable next steps.`,
    model: 'glm-4-flash',
    provider: 'zai',
    temperature: 0.4,
    maxTokens: 4096,
    maxSteps: 8,
    tools: ['tool-code-executor', 'tool-llm-call'],
  },
];

// ─── Convenience: Create and execute a task ───

export async function executeAgentTask(params: {
  agentId?: string;
  prompt: string;
  title?: string;
  strategy?: AgentLoopConfig['strategy'];
}): Promise<import('./types').AgentLoopResult> {
  const agentId = params.agentId ?? 'agentica-orchestrator';
  const agent = BUILTIN_AGENTS.find(a => a.id === agentId) ?? BUILTIN_AGENTS[0];

  const task: Task = {
    id: uuid(),
    agentId: agent.id,
    title: params.title ?? params.prompt.slice(0, 80),
    description: params.prompt,
    priority: 'medium',
    status: 'in_progress',
    assignedModel: agent.model,
    assignedProvider: agent.provider,
    steps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const ctx: ExecutionContext = {
    agent,
    task,
    memory: getMemoryManager(agent.id).query({ agentId: agent.id }),
    availableTools: getToolRegistry().getToolsForAgent(agent.tools),
    mcpServers: getMCPAdapter().listServers(),
    loopConfig: {
      maxIterations: agent.maxSteps ?? 10,
      maxTokensPerStep: agent.maxTokens ?? 4096,
      strategy: params.strategy ?? 'react',
    },
  };

  const loop = new AgentLoop(ctx.loopConfig);
  return loop.run(ctx);
}

// ─── Version info ───
export const CHIMERA_VERSION = '4.0.0';
export const CHIMERA_CODENAME = 'Última Onda Agentic AI';
