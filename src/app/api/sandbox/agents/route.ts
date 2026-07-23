/**
 * GET  /api/sandbox/agents — List all agents
 * POST /api/sandbox/agents — Spawn new agent
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAllAgents, getAgentsByStatus, getSandboxHealth } from '@/lib/sandbox/memory-store';
import { spawnAgent, purgeRecycled } from '@/lib/sandbox/agent-lifecycle';
import type { AgentTier } from '@/lib/sandbox/types';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');
  const health = getSandboxHealth();

  const agents = status
    ? getAgentsByStatus(status as AgentStatus)
    : getAllAgents();

  return NextResponse.json({ agents, health });
}

type AgentStatus = 'spawning' | 'idle' | 'executing' | 'learning' | 'promoted' | 'degraded' | 'recycled' | 'dead';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, tier, action } = body as { name?: string; tier?: AgentTier; action?: string };

    if (action === 'purge-recycled') {
      const count = purgeRecycled();
      return NextResponse.json({ purged: count });
    }

    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Agent name is required' }, { status: 400 });
    }

    const agent = spawnAgent(name, tier ?? 'scout');
    return NextResponse.json({ agent }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
