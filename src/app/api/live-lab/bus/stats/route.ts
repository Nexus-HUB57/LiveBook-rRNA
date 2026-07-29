import { NextResponse } from "next/server";
import { agentBus } from "@/lib/agent-message-bus";

/**
 * GET /api/live-lab/bus/stats
 * Returns agent message bus statistics as JSON.
 */
export async function GET() {
  const stats = agentBus.getStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
