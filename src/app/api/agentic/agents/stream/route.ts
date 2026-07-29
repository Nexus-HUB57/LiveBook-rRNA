import { NextRequest } from 'next/server';
import { BUILTIN_AGENTS, AgentLoop } from '@/lib/agentic';
import { persistFullExecution } from '@/lib/agentic/persistence';
import { v4 as uuid } from 'uuid';
import { getToolRegistry, getMemoryManager } from '@/lib/agentic';
import type { Task, ExecutionContext } from '@/lib/agentic';

/** POST /api/agentic/agents/stream — SSE streaming agent execution */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { agentId, prompt, title, strategy, maxIterations } = body;

  if (!prompt || typeof prompt !== 'string') {
    return new Response(JSON.stringify({ error: 'prompt is required' }), {
      status: 400, headers: { 'Content-Type': 'application/json' },
    });
  }

  const agent = BUILTIN_AGENTS.find(a => a.id === (agentId ?? 'agentica-orchestrator')) ?? BUILTIN_AGENTS[0];
  const tools = getToolRegistry().getToolsForAgent(agent.tools);
  const memory = getMemoryManager(agent.id);

  const task: Task = {
    id: uuid(), agentId: agent.id,
    title: title || prompt.slice(0, 80),
    description: prompt, priority: 'medium',
    status: 'in_progress', assignedModel: agent.model,
    assignedProvider: agent.provider, steps: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(data));

      send(`data: ${JSON.stringify({ type: 'start', task: task.id, agent: agent.id })}\n\n`);

      const ctx: ExecutionContext = {
        agent, task,
        memory: memory.query({ agentId: agent.id }),
        availableTools: tools, mcpServers: [],
        loopConfig: {
          maxIterations: maxIterations ?? agent.maxSteps ?? 10,
          maxTokensPerStep: agent.maxTokens ?? 4096,
          strategy: strategy ?? 'react',
          onStep(step) {
            send(`data: ${JSON.stringify({ type: 'step', ...step })}\n\n`);
          },
        },
      };

      try {
        const loop = new AgentLoop(ctx.loopConfig);
        const result = await loop.run(ctx);

        // Fire-and-forget persistence — errors must not break the stream
        persistFullExecution(task, result).catch(() => {});

        send(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`);
      } catch (err) {
        send(`data: ${JSON.stringify({ type: 'error', message: err instanceof Error ? err.message : String(err) })}\n\n`);
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}