import { NextRequest, NextResponse } from 'next/server';
import { streamChat, type ChatMessage } from '@/lib/9router-bridge';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, agentSlug, sessionId, provider, model } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query vazia' }, { status: 400 });
    }

    // Build system prompt based on agent context
    let systemPrompt = 'Voce e o assistente CHIMERA, um motor de fusao multi-agente. Responda em portugues com precisao tecnica.';
    if (agentSlug && agentSlug !== 'chimera-default') {
      systemPrompt = `Voce e o agente "${agentSlug}" do ecossistema CHIMERA. Responda em portugues com expertise no seu dominio.`;
    }

    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: query },
    ];

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          const chunkGenerator = streamChat({
            provider: provider || undefined,
            model: model || undefined,
            messages,
            stream: true,
            maxTokens: 2048,
            fallbackChain: provider
              ? [provider, 'glm', 'deepseek', 'groq']
              : ['glm', 'deepseek', 'groq', 'openai'],
            timeoutMs: 30000,
            metadata: { agent: agentSlug, sessionId },
          });

          for await (const chunk of chunkGenerator) {
            if (chunk.error) {
              controller.enqueue(encoder.encode(JSON.stringify({ error: chunk.error }) + '\n'));
              break;
            }
            if (chunk.token) {
              controller.enqueue(encoder.encode(JSON.stringify({ token: chunk.token }) + '\n'));
            }
            if (chunk.done) {
              controller.enqueue(encoder.encode(JSON.stringify({
                done: true,
                usage: chunk.usage,
                provider: '9router-bridge',
              }) + '\n'));
              break;
            }
          }
        } catch (err) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: 'Erro no stream LLM' }) + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Expose-Headers': 'X-Session-Id',
        'X-Session-Id': sessionId || `sess_${Date.now()}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}
