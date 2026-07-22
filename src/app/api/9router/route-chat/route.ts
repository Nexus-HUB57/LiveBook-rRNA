import { NextRequest, NextResponse } from 'next/server';
import { routeChat, type RouteChatOptions } from '@/lib/9router-bridge';

/** POST /api/9router/route-chat — Direct chat routing via 9router bridge */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, provider, model, stream, tools, maxTokens, temperature, fallbackChain, timeoutMs } = body;

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 });
    }

    const options: RouteChatOptions = {
      messages,
      provider,
      model,
      stream: stream || false,
      tools,
      maxTokens,
      temperature,
      fallbackChain,
      timeoutMs,
    };

    const result = await routeChat(options);

    return NextResponse.json({
      success: result.success,
      content: result.content,
      toolCalls: result.toolCalls,
      finishReason: result.finishReason,
      provider: result.provider,
      model: result.model,
      format: result.format,
      usage: result.usage,
      latencyMs: result.latencyMs,
      fallbackUsed: result.fallbackUsed,
      error: result.error,
      engine: '9router-bridge',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
