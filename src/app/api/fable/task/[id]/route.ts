import { NextRequest, NextResponse } from "next/server";
import { getTask } from "@/lib/fable-5-orchestrator";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: "Parâmetro 'id' é obrigatório." },
        { status: 400 }
      );
    }

    const task = await getTask(id);

    if (!task) {
      return NextResponse.json(
        { error: `Tarefa "${id}" não encontrada.` },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      task,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}