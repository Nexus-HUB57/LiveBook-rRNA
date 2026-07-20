import { NextRequest, NextResponse } from "next/server";
import { fableJudge } from "@/lib/fable-method-engine";
import type { MethodContext } from "@/lib/fable-method-engine";

/** POST /api/fable/judge — Adversarial verification of finished work */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { work } = body as { work: MethodContext };

    if (!work || !work.task || !work.phases) {
      return NextResponse.json(
        { error: "Campo 'work' obrigatorio com {task, phases, plan, evidence}." },
        { status: 400 },
      );
    }

    const report = await fableJudge(work);

    return NextResponse.json({
      success: true,
      report,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Fable Judge] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}