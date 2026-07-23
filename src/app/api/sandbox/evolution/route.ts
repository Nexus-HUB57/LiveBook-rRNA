/**
 * GET  /api/sandbox/evolution — Evolution stats
 * POST /api/sandbox/evolution — Trigger evolution cycle or update config
 */
import { NextRequest, NextResponse } from 'next/server';
import { runEvolutionCycle, getEvolutionStats, getEvolutionConfig, updateEvolutionConfig } from '@/lib/sandbox/evolution-engine';

export async function GET() {
  const stats = getEvolutionStats();
  const config = getEvolutionConfig();
  return NextResponse.json({ stats, config });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    if (action === 'update-config') {
      const { promotionThreshold, demotionThreshold, recycleThreshold, inactivityTimeoutMs } = body;
      const updated = updateEvolutionConfig({
        promotionThreshold,
        demotionThreshold,
        recycleThreshold,
        inactivityTimeoutMs,
      });
      return NextResponse.json({ config: updated });
    }

    // Default: run evolution cycle
    const result = runEvolutionCycle();
    return NextResponse.json({ result });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
