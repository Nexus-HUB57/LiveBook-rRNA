import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, context } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "messages array required" }, { status: 400 });
    }

    const systemMsg = {
      role: "system",
      content:
        context ||
        `You are an expert AI Agent specializing in Chinese independent developer projects. You have knowledge of 2400+ projects across categories like AI, developer tools, content creation, education, and more. Help users discover projects, analyze trends, and provide recommendations. Respond in the same language as the user's question. Be concise and insightful.`,
    };

    const res = await fetch("http://localhost:3001/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ messages: [systemMsg, ...messages] }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}