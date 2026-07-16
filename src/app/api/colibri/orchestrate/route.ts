import { NextResponse } from 'next/server';
import { runHealingCycle, getHealingHistory, getLastHealingCycle } from '@/lib/self-healing-engine';
import { processWisdomCycle, getWisdomState, getWisdomPatterns, getWisdomInsights } from '@/lib/wisdom-engine';
import { db } from '@/lib/db';

// ─── PANEL REGISTRY ───
const PANELS = [
  'moltbook', 'cerebro', 'cofre', 'mythos', 'fable_5', 'wormhole', 'blackhole', 'colibri_engine',
];

function seededRandom(seed: number) {
  let s = seed;
  return () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };
}

function generatePanelStates(): Record<string, { coherence: number; entanglement: number; superposition: number; decoherence: number; fidelity: number; evolution: number }> {
  const states: Record<string, { coherence: number; entanglement: number; superposition: number; decoherence: number; fidelity: number; evolution: number }> = {};
  const rng = seededRandom(Date.now());

  for (const panelId of PANELS) {
    // Try to load persisted state first
    const base = 0.5 + rng() * 0.4;
    states[panelId] = {
      coherence: Math.min(1, Math.max(0, base + (rng() - 0.5) * 0.3)),
      entanglement: Math.min(1, Math.max(0, base + (rng() - 0.5) * 0.35)),
      superposition: Math.min(1, Math.max(0, base + (rng() - 0.5) * 0.25)),
      decoherence: Math.min(1, Math.max(0, 0.1 + rng() * 0.35)),
      fidelity: Math.min(1, Math.max(0, base + (rng() - 0.5) * 0.2)),
      evolution: Math.min(1, Math.max(0, 0.3 + rng() * 0.5)),
    };
  }
  return states;
}

// POST /api/colibri/orchestrate — Run a full orchestration cycle
export async function POST() {
  try {
    const start = Date.now();

    // ── PHASE 1: INVOKE — Generate quantum states for all panels ──
    const panelStates = generatePanelStates();

    // ── PHASE 2: DETECT + HEAL — Run self-healing engine ──
    const healingCycle = await runHealingCycle(panelStates);

    // ── PHASE 3: LEARN — Process wisdom ──
    const { newPatterns, newInsights, updatedWisdomState } = await processWisdomCycle(healingCycle);

    // ── PHASE 4: DIRECT — Get wisdom-guided suggestions for next cycle ──
    // We use the HEALED states for next-cycle suggestions
    // (the healingCycle modified panelStates in-place via the engine)

    // ── PHASE 5: PERSIST — Save cycle to OrchestrationCycle table ──
    const cycleNumber = healingCycle.cycleNumber;
    await db.orchestrationCycle.create({
      data: {
        cycleNumber,
        phase: 'persist',
        status: healingCycle.healingSuccessRate > 0.5 ? 'completed' : 'failed',
        duration: Date.now() - start,
        anomalies: healingCycle.anomaliesDetected,
        healed: healingCycle.healingActionsExecuted,
        wisdomGain: newPatterns.length * 0.02 + newInsights.length * 0.03,
        metadata: JSON.stringify({
          criticalAnomalies: healingCycle.anomaliesCritical,
          successRate: healingCycle.healingSuccessRate,
          newPatterns: newPatterns.length,
          newInsights: newInsights.length,
          reports: healingCycle.reports.map(r => ({ panel: r.panelId, type: r.type, severity: r.severity })),
          actions: healingCycle.actions.map(a => ({ panel: a.panelId, skill: a.skill, result: a.result })),
        }),
      },
    });

    // Also persist healing events
    for (const report of healingCycle.reports) {
      await db.healingEvent.create({
        data: {
          panelId: report.panelId,
          anomalyType: report.type,
          severity: report.severity,
          action: report.healingAction,
          result: 'pending',
          beforeState: JSON.stringify({}),
          afterState: JSON.stringify({}),
        },
      });
    }

    return NextResponse.json({
      success: true,
      cycle: {
        cycleNumber,
        duration: Date.now() - start,
        phase: 'completed',
        anomalies: healingCycle.anomaliesDetected,
        criticalAnomalies: healingCycle.anomaliesCritical,
        healed: healingCycle.healingActionsExecuted,
        successRate: healingCycle.healingSuccessRate,
        newPatterns: newPatterns.length,
        newInsights: newInsights.length,
      },
      wisdom: {
        score: updatedWisdomState.wisdomScore,
        totalCycles: updatedWisdomState.totalCyclesProcessed,
        patterns: updatedWisdomState.patternsCount,
        insights: updatedWisdomState.insightsCount,
        decisions: updatedWisdomState.decisionsCount,
      },
      reports: healingCycle.reports,
      actions: healingCycle.actions,
      panelStates,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Cycle failed' },
      { status: 500 }
    );
  }
}

// GET /api/colibri/orchestrate — Get current orchestration state
export async function GET() {
  try {
    const [lastCycle, history, wisdomState, patterns, insights] = await Promise.all([
      getLastHealingCycle(),
      getHealingHistory(5),
      getWisdomState(),
      getWisdomPatterns(),
      getWisdomInsights(),
    ]);

    const cycles = await db.orchestrationCycle.findMany({
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const healingEvents = await db.healingEvent.findMany({
      orderBy: { createdAt: 'desc' },
      take: 30,
    });

    return NextResponse.json({
      lastCycle,
      history,
      wisdom: wisdomState,
      patterns: patterns.sort((a, b) => b.frequency - a.frequency).slice(0, 20),
      insights: insights.sort((a, b) => b.confidence - a.confidence).slice(0, 10),
      cycles,
      healingEvents,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load state' },
      { status: 500 }
    );
  }
}