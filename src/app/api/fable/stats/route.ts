import { NextResponse } from "next/server";
import { getFableStats, cleanupSandboxes } from "@/lib/fable-5-orchestrator";

export async function GET() {
  try {
    const [stats, cleaned] = await Promise.all([
      getFableStats(),
      cleanupSandboxes(3600000), // cleanup sandboxes older than 1h
    ]);

    return NextResponse.json({
      success: true,
      stats: { ...stats, sandboxesCleaned: cleaned },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}