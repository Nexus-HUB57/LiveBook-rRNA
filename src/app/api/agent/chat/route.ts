import { NextRequest, NextResponse } from "next/server";

// LLM chat with graceful degradation — no crash if SDK is unconfigured
async function llmChat(messages: Array<{ role: string; content: string }>, systemPrompt?: string): Promise<string> {
  try {
    // Check if SDK env vars are available before importing
    if (!process.env.ZAI_API_BASE_URL && !process.env.ZAI_API_KEY) {
      return "O Agente AI esta configurado mas o servico LLM nao esta disponivel neste ambiente. Os dados do dashboard (2.402 projetos, analises e metricas) continuam funcionando normalmente.";
    }
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const client = new ZAI({
      baseUrl: process.env.ZAI_API_BASE_URL,
      apiKey: process.env.ZAI_API_KEY,
    });
    const allMessages = [
      { role: "system", content: systemPrompt || "You are a helpful AI assistant." },
      ...messages,
    ];
    const result = await client.createChatCompletion({
      model: "glm-4-flash",
      messages: allMessages,
      thinking: "disabled",
    });
    return result?.choices?.[0]?.message?.content || "Sem resposta do LLM.";
  } catch (err) {
    console.error("[LLM Chat Error]", err);
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