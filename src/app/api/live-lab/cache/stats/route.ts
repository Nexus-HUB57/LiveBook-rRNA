import { NextResponse } from "next/server";
import { semanticCache } from "@/lib/semantic-cache";

/**
 * GET /api/live-lab/cache/stats
 * Returns semantic cache statistics as JSON.
 */
export async function GET() {
  const stats = semanticCache.getStats();
  return NextResponse.json(stats, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
