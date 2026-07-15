/**
 * Streaming Chat Endpoint — Token-by-token SSE with RAG + LLM.
 *
 * Flow:
 * 1. Create/recover ChatSession
 * 2. Save user message
 * 3. Retrieve documents via RAG rRNA pipeline
 * 4. Stream LLM response token by token
 * 5. Save complete agent response
 * 6. Send { done, sources, sessionId } final event
 */
import { NextRequest } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { streamLLM, type LLMMessage } from '@/lib/llm-synthesis';
import { rragPipeline, type RAGQueryResult } from '@/lib/rag-engine';

const schema = z.object({
  query: z.string().min(1).max(4000),
  agentSlug: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, agentSlug, sessionId } = schema.parse(body);

    // 1. Create or recover session
    let session = sessionId
      ? await db.chatSession.findUnique({ where: { id: sessionId } })
      : null;

    if (!session) {
      // Generate a smart title from the first query
      const title = query.length > 50 ? query.slice(0, 50) + '...' : query;
      session = await db.chatSession.create({
        data: { agentSlug: agentSlug || null, title },
      });
    }

    // 2. Save user message
    await db.chatSessionMessage.create({
      data: {
        sessionId: session.id,
        role: 'user',
        content: query,
      },
    });

    // 3. Retrieve recent history for context (last 8 messages)
    const recentMessages = await db.chatSessionMessage.findMany({
      where: { sessionId: session.id },
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: { role: true, content: true },
    });
    const history: LLMMessage[] = recentMessages
      .reverse()
      .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

    // 4. RAG retrieval
    let ragResult: RAGQueryResult | null = null;
    let sources: Array<{ title: string; content: string; score: number; agent: string; source: string }> = [];

    try {
      // Load knowledge entries for RAG
      const entries = await db.knowledgeEntry.findMany({
        select: {
          id: true,
          title: true,
          content: true,
          source: true,
          chunkType: true,
          agent: { select: { name: true, slug: true } },
        },
      });

      // Filter by agent if specified
      const filteredEntries = agentSlug
        ? entries.filter(e => e.agent?.slug === agentSlug || e.source.includes(agentSlug))
        : entries;

      if (filteredEntries.length > 0) {
        const documents = filteredEntries.map(e => ({
          id: e.id,
          title: e.title,
          content: e.content,
          source: e.source,
          agentName: e.agent?.name,
          agentSlug: e.agent?.slug,
          chunkType: e.chunkType,
        }));

        ragResult = await rragPipeline(query, documents, {
          topK: 5,
          agentName: agentSlug,
        });

        sources = ragResult.retrieved.map(r => ({
          title: r.title,
          content: `Fonte: ${r.agent} — ${r.source}`,
          score: r.score,
          agent: r.agent,
          source: r.source,
        }));
      }
    } catch (ragErr) {
      console.warn('[Chat Stream] RAG retrieval failed, continuing without sources:', ragErr);
    }

    // 5. Stream LLM response
    const stream = new ReadableStream({
      async start(controller) {
        const encoder = new TextEncoder();
        let fullText = '';

        try {
          const llmStream = streamLLM(query, {
            agentSlug,
            context: ragResult ? `${ragResult.answer}\n\nFontes: ${sources.map((s, i) => `[${i + 1}] ${s.title} (${s.agent})`).join(', ')}` : undefined,
            history: history.slice(0, -1), // exclude current user msg (already added by streamLLM)
          });

          for await (const token of llmStream) {
            fullText += token;
            controller.enqueue(
              encoder.encode(JSON.stringify({ token }) + '\n')
            );
          }

          // 6. Save complete agent response
          const agentMessage = await db.chatSessionMessage.create({
            data: {
              sessionId: session.id,
              role: 'agent',
              content: fullText,
              sources: sources.length > 0 ? JSON.stringify(sources) : null,
            },
          });

          // Update session title if it's the first exchange
          if (history.length <= 1) {
            await db.chatSession.update({
              where: { id: session.id },
              data: {
                title: query.length > 60 ? query.slice(0, 60) + '...' : query,
              },
            });
          }

          // Send final event
          controller.enqueue(
            encoder.encode(
              JSON.stringify({
                done: true,
                messageId: agentMessage.id,
                sessionId: session.id,
                sources: sources.length > 0 ? sources : undefined,
                ragPipeline: ragResult ? {
                  documentsScanned: ragResult.pipeline.documentsScanned,
                  retrieved: ragResult.pipeline.retrieved,
                  reranked: ragResult.pipeline.reranked,
                  contextChars: ragResult.pipeline.contextChars,
                } : undefined,
              }) + '\n'
            )
          );
          controller.close();
        } catch (error) {
          console.error('[Chat Stream] Error during streaming:', error);
          controller.enqueue(
            encoder.encode(JSON.stringify({ error: 'Falha ao processar a resposta.' }) + '\n')
          );
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
        'X-Session-Id': session.id,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(
        JSON.stringify({ error: 'Requisicao invalida', details: error.issues }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }
    console.error('[Chat Stream] Unhandled error:', error);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
}