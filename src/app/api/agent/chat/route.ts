import { NextRequest, NextResponse } from "next/server";
import { routeChat } from "@/lib/9router-bridge";

// LLM chat via 9router bridge with automatic fallback across 100+ providers
async function llmChat(messages: Array<{ role: string; content: string }>, systemPrompt?: string): Promise<string> {
  try {
    const allMessages = [
      { role: "system", content: systemPrompt || "You are a helpful AI assistant." },
      ...messages,
    ];
    const result = await routeChat({
      provider: 'glm',
      fallbackChain: ['glm', 'deepseek', 'groq', 'openai'],
      messages: allMessages as any,
      maxTokens: 2048,
      timeoutMs: 25000,
      metadata: { source: 'agent-chat' },
    });
    return result.content || "Sem resposta do LLM.";
  } catch (err) {
    console.error('[LLM Chat Error]', err);
    return "Agente AI temporariamente indisponivel. O servico LLM nao pode ser alcancado neste ambiente. Tente novamente mais tarde.";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const systemMsg = context ||
      `You are an expert AI Agent specializing in Chinese independent developer projects. You have knowledge of 2400+ projects across categories like AI, developer tools, content creation, education, SaaS, gaming, and more. Help users discover projects, analyze trends, and provide recommendations. Respond in the same language as the user's question. Be concise and insightful.`;

    const response = await llmChat(messages, systemMsg);
    return NextResponse.json({ response });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}