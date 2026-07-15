/**
 * Chat History Endpoint — Retrieve session messages.
 * Also supports listing all sessions for the sidebar.
 */
import { NextRequest } from 'next/server';
import { db } from '@/lib/db';

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');

  // If sessionId provided, return messages for that session
  if (sessionId) {
    const messages = await db.chatSessionMessage.findMany({
      where: { sessionId },
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        content: true,
        sources: true,
        createdAt: true,
      },
    });

    // Parse sources JSON for each message
    const parsed = messages.map(m => ({
      ...m,
      sources: m.sources ? JSON.parse(m.sources) : null,
    }));

    return Response.json({ messages: parsed });
  }

  // Otherwise, list recent sessions (for sidebar)
  const sessions = await db.chatSession.findMany({
    orderBy: { updatedAt: 'desc' },
    take: 30,
    select: {
      id: true,
      agentSlug: true,
      title: true,
      createdAt: true,
      updatedAt: true,
      _count: { select: { messages: true } },
    },
  });

  return Response.json({ sessions });
}

export async function DELETE(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get('sessionId');
  if (!sessionId) {
    return Response.json({ error: 'sessionId obrigatorio' }, { status: 400 });
  }

  try {
    // Delete all messages first (cascade should handle this, but be explicit)
    await db.chatSessionMessage.deleteMany({ where: { sessionId } });
    await db.chatSession.delete({ where: { id: sessionId } });

    return Response.json({ deleted: true });
  } catch {
    return Response.json({ error: 'Sessao nao encontrada' }, { status: 404 });
  }
}