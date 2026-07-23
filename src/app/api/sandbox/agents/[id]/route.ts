/**
 * GET    /api/sandbox/agents/[id] — Get agent details
 * DELETE /api/sandbox/agents/[id] — Delete agent
 * PATCH  /api/sandbox/agents/[id] — Agent actions (promote, demote, recycle, heal, learn, execute)
 */
import { NextRequest, NextResponse } from 'next/server';
import { getAgent } from '@/lib/sandbox/memory-store';
import {
  promoteAgent, demoteAgent, recycleAgent, healAgent,
  agentLearn, executeAgentTask,
} from '@/lib/sandbox/agent-lifecycle';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });
  return NextResponse.json({ agent });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  try {
    const body = await req.json();
    const { action, code, language, lesson, lessonType } = body;

    switch (action) {
      case 'promote': {
        const result = promoteAgent(id);
        return NextResponse.json(result);
      }
      case 'demote': {
        const result = demoteAgent(id);
        return NextResponse.json(result);
      }
      case 'recycle': {
        const result = recycleAgent(id);
        return NextResponse.json(result);
      }
      case 'heal': {
        const result = healAgent(id);
        return NextResponse.json(result);
      }
      case 'learn': {
        if (!lesson) return NextResponse.json({ error: 'Lesson content required' }, { status: 400 });
        agentLearn(id, lesson, lessonType ?? 'semantic');
        return NextResponse.json({ success: true, message: 'Lesson stored' });
      }
      case 'execute': {
        if (!code) return NextResponse.json({ error: 'Code required' }, { status: 400 });
        const result = await executeAgentTask(id, { code, language: language ?? 'javascript' });
        return NextResponse.json(result);
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const agent = getAgent(id);
  if (!agent) return NextResponse.json({ error: 'Agent not found' }, { status: 404 });

  // Recycle before delete
  recycleAgent(id);
  return NextResponse.json({ success: true, message: `Agent ${id} recycled` });
}