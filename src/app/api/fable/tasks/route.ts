import { NextRequest, NextResponse } from "next/server";
import { listTasks } from "@/lib/fable-5-orchestrator";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "50", 10)));

    const tasks = await listTasks(limit);

    return NextResponse.json({
      success: true,
      tasks,
      count: tasks.length,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}