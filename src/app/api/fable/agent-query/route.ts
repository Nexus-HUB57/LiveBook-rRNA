import { NextRequest, NextResponse } from "next/server";
import { queryAgentWithTools } from "@/lib/fable-5-orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, allowedTools, maxIterations } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json(
        { error: "Campo 'prompt' e obrigatorio e deve ser uma string." },
        { status: 400 }
      );
    }

    if (prompt.length > 4000) {
      return NextResponse.json(
        { error: "O prompt nao pode exceder 4000 caracteres." },
        { status: 400 }
      );
    }

    const result = await queryAgentWithTools(prompt, {
      allowedTools: allowedTools || ["Read", "Edit", "Bash", "Glob", "Grep"],
      maxIterations: maxIterations || 10,
    });

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Fable 5 OS] Agent query error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}