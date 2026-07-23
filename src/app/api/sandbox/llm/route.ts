/**
 * POST /api/sandbox/llm — Non-streaming dedicated LLM chat
 * GET  /api/sandbox/llm — Get LLM config and status
 */
import { NextRequest, NextResponse } from 'next/server';
import { dedicatedLLMChat, getLLMConfig, getDedicatedLLMStatus } from '@/lib/sandbox/dedicated-llm';

export async function GET() {
  return NextResponse.json({
    config: getLLMConfig(),
    status: getDedicatedLLMStatus(),
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, agentId, conversationId } = body as {
      message: string;
      agentId?: string;
      conversationId?: string;
    };

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const result = await dedicatedLLMChat(message, agentId, conversationId);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'LLM error',
      response: '',
      conversationId: '',
    }, { status: 500 });
  }
}
