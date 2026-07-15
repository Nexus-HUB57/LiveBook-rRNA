import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * POST /api/webhook/invoke — External webhook trigger for agent invocation.
 * Allows external systems to trigger invocation cycles via HTTP POST.
 * 
 * Body: { "secret"?: string, "panels"?: string[], "iteration"?: number }
 * Response: { invoked: true, timestamp, iteration, panelsProcessed }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || "";

    if (WEBHOOK_SECRET && body.secret !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const iteration = body.iteration ?? Date.now();
    const panels = body.panels as string[] | undefined;

    const PANEL_REGISTRY = [
      'moltbook', 'cerebro', 'cofre', 'mythos', 'fable_5', 'wormhole', 'blackhole',
    ];

    const targetPanels = panels && panels.length > 0
      ? panels.filter((p: string) => PANEL_REGISTRY.includes(p))
      : PANEL_REGISTRY;

    const results: Array<{ panel: string; status: string; generation: number }> = [];

    for (const panelId of targetPanels) {
      const stateKey = `quantum_${panelId}`;
      const existing = await db.moltbookState.findUnique({ where: { key: stateKey } });
      let prevEvolution = 0;
      if (existing) {
        try {
          const parsed = JSON.parse(existing.value);
          prevEvolution = parsed.evolution ?? 0;
        } catch { /* skip */ }
      }

      const newState = {
        coherence:    Math.min(1, 0.5 + Math.random() * 0.4),
        entanglement: Math.min(1, 0.3 + Math.random() * 0.5),
        superposition: Math.min(1, 0.6 + Math.random() * 0.3),
        decoherence:  Math.min(0.3, Math.random() * 0.1),
        fidelity:     Math.min(1, 0.7 + Math.random() * 0.25),
        evolution:    prevEvolution + 1,
        timestamp:    new Date().toISOString(),
      };

      await db.moltbookState.upsert({
        where: { key: stateKey },
        update: { value: JSON.stringify(newState), updatedAt: new Date() },
        create: { key: stateKey, value: JSON.stringify(newState) },
      });

      results.push({ panel: panelId, status: 'processed', generation: newState.evolution });
    }

    await db.moltbookState.upsert({
      where: { key: 'webhook_invocation_log' },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          source: 'external_webhook',
          iteration,
          panelsProcessed: targetPanels.length,
          results,
        }),
        updatedAt: new Date(),
      },
      create: {
        key: 'webhook_invocation_log',
        value: JSON.stringify({ timestamp: new Date().toISOString(), source: 'external_webhook', iteration, panelsProcessed: targetPanels.length, results: [] }),
      },
    });

    return NextResponse.json({
      invoked: true,
      timestamp: new Date().toISOString(),
      iteration,
      panelsProcessed: targetPanels.length,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function GET() {
  const PANEL_REGISTRY = ['moltbook', 'cerebro', 'cofre', 'mythos', 'fable_5', 'wormhole', 'blackhole'];
  const states: Record<string, { evolution: number; timestamp: string } | null> = {};
  for (const panel of PANEL_REGISTRY) {
    const state = await db.moltbookState.findUnique({ where: { key: `quantum_${panel}` } });
    if (state) {
      try { states[panel] = JSON.parse(state.value); } catch { states[panel] = null; }
    } else {
      states[panel] = null;
    }
  }

  return NextResponse.json({
    endpoint: "/api/webhook/invoke",
    method: "POST",
    description: "External webhook trigger for agent invocation cycles",
    panels: PANEL_REGISTRY,
    states,
    secretConfigured: !!process.env.WEBHOOK_SECRET,
    timestamp: new Date().toISOString(),
  });
}