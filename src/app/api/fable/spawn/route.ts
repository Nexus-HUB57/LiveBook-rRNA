import { NextRequest, NextResponse } from "next/server";
import { spawnRecursiveAgent } from "@/lib/fable-5-orchestrator";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, taskId, capability } = body;

    if (!task || typeof task !== "string") {
      return NextResponse.json(
        { error: "Campo 'task' é obrigatório e deve ser uma string." },
        { status: 400 }
      );
    }

    if (task.length > 2000) {
      return NextResponse.json(
        { error: "A tarefa não pode exceder 2000 caracteres." },
        { status: 400 }
      );
    }

    const result = await spawnRecursiveAgent(task, taskId, capability);

    return NextResponse.json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Fable 5 OS] Spawn error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}