import { NextRequest, NextResponse } from 'next/server';
import { agentMemory } from '@/lib/agent-memory';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const agentId = searchParams.get('agentId') ?? undefined;

  const stats = agentMemory.getStats(agentId);

  return NextResponse.json({
    agentId: agentId ?? null,
    agentCount: agentMemory.agentCount,
    ...stats,
  });
}
