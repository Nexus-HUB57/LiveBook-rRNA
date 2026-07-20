import { NextRequest, NextResponse } from "next/server";
import { fableMethod, getMethodHistory } from "@/lib/fable-method-engine";

/** POST /api/fable/method — Execute a fable-method skill */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, mode } = body;

    if (!task || typeof task !== "string") {
      return NextResponse.json(
        { error: "Campo 'task' obrigatorio." },
        { status: 400 },
      );
    }

    const validModes = ["inline", "plan", "audit", "report"];
    const selectedMode = validModes.includes(mode) ? mode : "inline";

    const result = await fableMethod(task, selectedMode);

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Fable Method] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** GET /api/fable/method — List recent method runs */
export async function GET() {
  try {
    const history = await getMethodHistory(20);
    return NextResponse.json({ success: true, history, timestamp: new Date().toISOString() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}