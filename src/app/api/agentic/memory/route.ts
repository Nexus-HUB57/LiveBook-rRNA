import { NextRequest, NextResponse } from 'next/server';
import { getMemoryManager } from '@/lib/agentic';
import type { MemoryType } from '@/lib/agentic';

/** GET /api/agentic/memory — Query agent memories */
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId') || undefined;
  const taskId = searchParams.get('taskId') || undefined;
  const type = searchParams.get('type') as MemoryType | null;
  const query = searchParams.get('query') || undefined;
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const minImportance = parseFloat(searchParams.get('minImportance') || '0');

  const memory = getMemoryManager(agentId);
  const results = memory.query({
    agentId, taskId, type: type || undefined,
    query: query || undefined, limit, minImportance: minImportance || undefined,
  });

  return NextResponse.json({ memories: results, total: results.length });
}

/** POST /api/agentic/memory — Create a new memory entry */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agentId, taskId, type, content, importance, metadata } = body;

    if (!agentId || !content) {
      return NextResponse.json({ error: 'agentId and content are required' }, { status: 400 });
    }

    const memory = getMemoryManager(agentId);
    const entry = memory.create({
      agentId, taskId, type: type || 'episodic', content,
      importance, metadata,
    });

    return NextResponse.json({ memory: entry }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

/** DELETE /api/agentic/memory — Clear agent memories */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const agentId = searchParams.get('agentId');
  if (!agentId) return NextResponse.json({ error: 'agentId is required' }, { status: 400 });

  const memory = getMemoryManager(agentId);
  const deleted = memory.clearAgent(agentId);
  return NextResponse.json({ deleted });
}