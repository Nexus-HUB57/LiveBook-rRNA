import { NextRequest, NextResponse } from "next/server";
import { fableLoop } from "@/lib/fable-method-engine";

/** POST /api/fable/loop — Full orchestrated run: evidence → plan → execute → judge */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task } = body;

    if (!task || typeof task !== "string") {
      return NextResponse.json(
        { error: "Campo 'task' obrigatorio." },
        { status: 400 },
      );
    }

    if (task.length > 4000) {
      return NextResponse.json(
        { error: "Tarefa nao pode exceder 4000 caracteres." },
        { status: 400 },
      );
    }

    const result = await fableLoop(task);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Fable Loop] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}