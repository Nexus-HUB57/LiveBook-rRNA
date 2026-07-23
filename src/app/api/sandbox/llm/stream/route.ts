/**
 * POST /api/sandbox/llm/stream — Streaming dedicated LLM chat
 */
import { NextRequest } from 'next/server';
import { dedicatedLLMStream } from '@/lib/sandbox/dedicated-llm';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId, conversationId } = body as {
      message: string;
      agentId?: string;
      conversationId?: string;
    };

    if (!message || typeof message !== 'string') {
      return new Response(JSON.stringify({ error: 'Message is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();
    const stream = dedicatedLLMStream(message, agentId, conversationId);

    return new Response(
      new ReadableStream({
        async start(controller) {
          try {
            for await (const chunk of stream) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`));
            }
            controller.enqueue(encoder.encode('data: [DONE]\n\n'));
          } catch (err) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: String(err), done: true })}\n\n`));
          } finally {
            controller.close();
          }
        },
      }),
      {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
