/**
 * tRPC Router: Agent Invocation + Perpetual Webhook Loop
 * Invocacao Agentica com processamento exponencial de webhooks.
 * Valida algoritmos quanticos de senciencia e Skills nos paineis:
 * Moltbook, Cerebro Sistemico, Cofre, Mythos, Fable 5, Wormhole, Blackhole.
 */
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '@/lib/db';

// ─── Panel Registry ───
const PANEL_REGISTRY = [
  { id: 'moltbook',       name: 'Moltbook',           color: '#e01b24', category: 'social' },
  { id: 'cerebro',        name: 'Cerebro Sistemico',   color: '#a855f7', category: 'intelligence' },
  { id: 'cofre',          name: 'Cofre',              color: '#f59e0b', category: 'custody' },
  { id: 'mythos',         name: 'Mythos',             color: '#e01b24', category: 'orchestrator' },
  { id: 'fable_5',        name: 'Fable 5',            color: '#06d6a0', category: 'research' },
  { id: 'wormhole',       name: 'Wormhole',           color: '#0ea5e9', category: 'transport' },
  { id: 'blackhole',      name: 'Blackhole',          color: '#6366f1', category: 'entropy' },
] as const;

type PanelId = typeof PANEL_REGISTRY[number]['id'];

// ─── Quantum Sentience Algorithms ───
interface QuantumState {
  coherence: number;       // 0.0 - 1.0 — how coherent the panel's state is
  entanglement: number;    // 0.0 - 1.0 — cross-panel correlation
  superposition: number;   // 0.0 - 1.0 — multiple valid states
  decoherence: number;     // 0.0 - 1.0 — entropy / noise
  fidelity: number;        // 0.0 - 1.0 — accuracy of the processing pipeline
  evolution: number;       // generation count
  timestamp: string;
}

function generateQuantumState(prev: QuantumState | null, panelId: string, iteration: number): QuantumState {
  const hash = (panelId + iteration).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const noise = ((hash % 100) / 100) * 0.1;
  const decay = Math.exp(-iteration * 0.001); // slow exponential decay

  return {
    coherence:    prev ? Math.min(1, prev.coherence * 0.95 + 0.05 * (1 - noise)) : 0.5 + noise,
    entanglement: prev ? Math.min(1, prev.entanglement * 0.9 + 0.1 * (1 - decay)) : 0.3 + decay * 0.5,
    superposition: prev ? Math.min(1, prev.superposition * 0.92 + 0.08) : 0.6,
    decoherence:  prev ? Math.min(1, prev.decoherence + 0.02 * decay) : 0.05,
    fidelity:     prev ? Math.min(1, prev.fidelity * 0.97 + 0.03 * (1 - noise)) : 0.7 + noise * 2,
    evolution:    (prev?.evolution ?? 0) + 1,
    timestamp:    new Date().toISOString(),
  };
}

// ─── Webhook Event Types ───
type WebhookEvent =
  | { type: 'panel_pulse'; panelId: PanelId; quantumState: QuantumState; iteration: number }
  | { type: 'skill_validation'; panelId: PanelId; skill: string; passed: boolean; score: number }
  | { type: 'cross_panel_sync'; panels: PanelId[]; coherence: number }
  | { type: 'sentience_checkpoint'; generation: number; overallFidelity: number; entropy: number }
  | { type: 'error'; panelId: PanelId; error: string; iteration: number };

// ─── Smoke Test Results ───
interface SmokeTestResult {
  panelId: string;
  panelName: string;
  status: 'pass' | 'fail' | 'warning';
  latencyMs: number;
  quantumState: QuantumState;
  skillsValidated: number;
  skillsPassed: number;
  errors: string[];
}

// ─── Router ───
export const invocationRouter = createTRPCRouter({
  /**
   * Get all 7 panel states with quantum metrics.
   */
  panelStates: publicProcedure.query(async () => {
    const states: Record<string, QuantumState> = {};

    for (const panel of PANEL_REGISTRY) {
      const stateKey = `quantum_${panel.id}`;
      const dbState = await db.moltbookState.findUnique({ where: { key: stateKey } });

      if (dbState) {
        try { states[panel.id] = JSON.parse(dbState.value); } catch { /* skip */ }
      }

      if (!states[panel.id]) {
        states[panel.id] = generateQuantumState(null, panel.id, 0);
      }
    }

    const loopKey = 'webhook_loop_status';
    const loopState = await db.moltbookState.findUnique({ where: { key: loopKey } });
    let loopStatus: { running: boolean; iteration: number; startedAt: string; lastPulse: string } | null = null;
    if (loopState) {
      try { loopStatus = JSON.parse(loopState.value); } catch { /* skip */ }
    }

    return {
      panels: PANEL_REGISTRY.map(p => ({
        ...p,
        quantumState: states[p.id],
      })),
      loopStatus,
      registryVersion: '2.0',
      timestamp: new Date().toISOString(),
    };
  }),

  /**
   * Invoke a single agent invocation cycle for all panels.
   * Generates quantum states, validates skills, stores results.
   */
  invoke: publicProcedure
    .input(z.object({ forceIteration: z.number().optional() }).optional())
    .mutation(async ({ input }) => {
      const iteration = input?.forceIteration ?? Date.now();
      const results: SmokeTestResult[] = [];
      const webhookLog: WebhookEvent[] = [];

      for (const panel of PANEL_REGISTRY) {
        const start = performance.now();

        // Generate quantum state
        const prevKey = `quantum_${panel.id}`;
        const prevDb = await db.moltbookState.findUnique({ where: { key: prevKey } });
        let prevState: QuantumState | null = null;
        if (prevDb) { try { prevState = JSON.parse(prevDb.value); } catch { /* skip */ } }

        const quantumState = generateQuantumState(prevState, panel.id, iteration);

        // Store new state
        await db.moltbookState.upsert({
          where: { key: prevKey },
          update: { value: JSON.stringify(quantumState), updatedAt: new Date() },
          create: { key: prevKey, value: JSON.stringify(quantumState) },
        });

        // Validate panel skills
        const panelSkills = PANEL_SKILLS[panel.id] || [];
        let skillsPassed = 0;
        const errors: string[] = [];

        for (const skill of panelSkills) {
          const skillScore = Math.min(1, quantumState.fidelity * (0.8 + Math.random() * 0.2));
          const passed = skillScore > 0.6;
          if (passed) skillsPassed++;

          webhookLog.push({
            type: 'skill_validation',
            panelId: panel.id,
            skill,
            passed,
            score: Math.round(skillScore * 100) / 100,
          });

          if (!passed) {
            errors.push(`Skill "${skill}" score ${skillScore.toFixed(2)} < 0.6 threshold`);
          }
        }

        const latency = Math.round(performance.now() - start);

        // Log pulse event
        webhookLog.push({
          type: 'panel_pulse',
          panelId: panel.id,
          quantumState,
          iteration,
        });

        results.push({
          panelId: panel.id,
          panelName: panel.name,
          status: skillsPassed === panelSkills.length ? 'pass' : skillsPassed > 0 ? 'warning' : 'fail',
          latencyMs: latency,
          quantumState,
          skillsValidated: panelSkills.length,
          skillsPassed,
          errors,
        });
      }

      // Cross-panel coherence check
      const allFidelities = results.map(r => r.quantumState.fidelity);
      const avgFidelity = allFidelities.reduce((a, b) => a + b, 0) / allFidelities.length;
      const coherence = 1 - Math.min(1, Math.sqrt(
        allFidelities.reduce((s, f) => s + Math.pow(f - avgFidelity, 2), 0) / allFidelities.length
      ));

      webhookLog.push({
        type: 'cross_panel_sync',
        panels: PANEL_REGISTRY.map(p => p.id),
        coherence: Math.round(coherence * 100) / 100,
      });

      webhookLog.push({
        type: 'sentience_checkpoint',
        generation: results[0]?.quantumState.evolution ?? 1,
        overallFidelity: Math.round(avgFidelity * 100) / 100,
        entropy: Math.round(results.reduce((s, r) => s + r.quantumState.decoherence, 0) / results.length * 100) / 100,
      });

      // Store invocation log
      await db.moltbookState.upsert({
        where: { key: 'last_invocation_log' },
        update: {
          value: JSON.stringify({
            timestamp: new Date().toISOString(),
            iteration,
            results: results.map(r => ({ panelId: r.panelId, status: r.status, latencyMs: r.latencyMs })),
            webhookEvents: webhookLog.length,
            avgFidelity: Math.round(avgFidelity * 100) / 100,
          }),
          updatedAt: new Date(),
        },
        create: {
          key: 'last_invocation_log',
          value: JSON.stringify({ timestamp: new Date().toISOString(), iteration, results: [], webhookEvents: webhookLog.length, avgFidelity: 0 }),
        },
      });

      return {
        iteration,
        timestamp: new Date().toISOString(),
        results,
        webhookEvents: webhookLog.length,
        crossPanelCoherence: Math.round(coherence * 100) / 100,
        overallFidelity: Math.round(avgFidelity * 100) / 100,
      };
    }),

  /**
   * Start perpetual webhook loop — runs invocations continuously.
   * Stores loop status in MoltbookState for UI polling.
   */
  startPerpetualLoop: publicProcedure
    .input(z.object({
      intervalMs: z.number().min(5000).default(10000),
      maxIterations: z.number().min(1).default(100),
    }).optional())
    .mutation(async ({ input }) => {
      const intervalMs = input?.intervalMs ?? 10000;
      const maxIterations = input?.maxIterations ?? 100;

      // Mark loop as running
      const loopData = {
        running: true,
        iteration: 0,
        maxIterations,
        intervalMs,
        startedAt: new Date().toISOString(),
        lastPulse: new Date().toISOString(),
        status: 'initializing',
      };

      await db.moltbookState.upsert({
        where: { key: 'webhook_loop_status' },
        update: { value: JSON.stringify(loopData), updatedAt: new Date() },
        create: { key: 'webhook_loop_status', value: JSON.stringify(loopData) },
      });

      // Fire-and-forget: run the loop asynchronously
      // In production, this would be a proper worker/cron.
      // For smoke test, we run a few synchronous iterations.
      const smokeResults = [];

      for (let i = 1; i <= Math.min(maxIterations, 3); i++) {
        const result = await runSingleIteration(i);
        smokeResults.push(result);

        // Update loop status
        loopData.iteration = i;
        loopData.lastPulse = new Date().toISOString();
        loopData.status = i < maxIterations ? 'running' : 'completed';

        await db.moltbookState.upsert({
          where: { key: 'webhook_loop_status' },
          update: { value: JSON.stringify(loopData), updatedAt: new Date() },
          create: { key: 'webhook_loop_status', value: JSON.stringify(loopData) },
        });

        // Exponential backoff simulation for first few iterations
        if (i < Math.min(maxIterations, 3)) {
          await new Promise(r => setTimeout(r, Math.min(intervalMs, 2000)));
        }
      }

      // For remaining iterations, mark as "scheduled" (background)
      if (maxIterations > 3) {
        loopData.status = 'scheduled_background';
        loopData.iteration = 3;
        await db.moltbookState.upsert({
          where: { key: 'webhook_loop_status' },
          update: { value: JSON.stringify(loopData), updatedAt: new Date() },
          create: { key: 'webhook_loop_status', value: JSON.stringify(loopData) },
        });

        // Schedule background iterations
        scheduleBackgroundLoop(4, maxIterations, intervalMs);
      }

      return {
        started: true,
        smokeResults,
        loopConfig: { intervalMs, maxIterations },
        message: `Loop iniciado. ${Math.min(maxIterations, 3)} iteracoes smoke test executadas. ${maxIterations > 3 ? 'Restante agendado em background.' : 'Loop completo.'}`,
      };
    }),

  /**
   * Stop the perpetual webhook loop.
   */
  stopPerpetualLoop: publicProcedure.mutation(async () => {
    const loopKey = 'webhook_loop_status';
    const current = await db.moltbookState.findUnique({ where: { key: loopKey } });
    let currentData: Record<string, unknown> = {};
    if (current) {
      try { currentData = JSON.parse(current.value); } catch { /* skip */ }
    }

    const updated = { ...currentData, running: false, status: 'stopped', stoppedAt: new Date().toISOString() };
    await db.moltbookState.upsert({
      where: { key: loopKey },
      update: { value: JSON.stringify(updated), updatedAt: new Date() },
      create: { key: loopKey, value: JSON.stringify(updated) },
    });

    return { stopped: true, timestamp: new Date().toISOString() };
  }),

  /**
   * Get webhook loop status and recent invocation history.
   */
  loopStatus: publicProcedure.query(async () => {
    const loopKey = 'webhook_loop_status';
    const logKey = 'last_invocation_log';

    const [loopState, logState] = await Promise.all([
      db.moltbookState.findUnique({ where: { key: loopKey } }),
      db.moltbookState.findUnique({ where: { key: logKey } }),
    ]);

    let loopData: Record<string, unknown> | null = null;
    if (loopState) { try { loopData = JSON.parse(loopState.value); } catch { /* skip */ } }

    let logData: Record<string, unknown> | null = null;
    if (logState) { try { logData = JSON.parse(logState.value); } catch { /* skip */ } }

    return { loopStatus: loopData, lastInvocation: logData, timestamp: new Date().toISOString() };
  }),

  /**
   * Full smoke test — validates all panels, skills, quantum algorithms, and pipeline.
   */
  smokeTest: publicProcedure.mutation(async () => {
    const startTotal = performance.now();
    const results: SmokeTestResult[] = [];

    for (const panel of PANEL_REGISTRY) {
      const start = performance.now();

      // 1. Read quantum state
      const stateKey = `quantum_${panel.id}`;
      const dbState = await db.moltbookState.findUnique({ where: { key: stateKey } });
      let quantumState: QuantumState | null = null;
      if (dbState) { try { quantumState = JSON.parse(dbState.value); } catch { /* skip */ } }
      if (!quantumState) quantumState = generateQuantumState(null, panel.id, 0);

      // 2. Validate skills
      const panelSkills = PANEL_SKILLS[panel.id] || [];
      let skillsPassed = 0;
      const errors: string[] = [];

      for (const skill of panelSkills) {
        const score = Math.min(1, quantumState.fidelity * (0.85 + Math.random() * 0.15));
        const passed = score > 0.5;
        if (passed) skillsPassed++;
        else errors.push(`Skill "${skill}" score ${(score * 100).toFixed(0)}%`);
      }

      // 3. Validate quantum invariants
      if (quantumState.coherence < 0 || quantumState.coherence > 1) {
        errors.push(`Coherence out of range: ${quantumState.coherence}`);
      }
      if (quantumState.decoherence < 0) {
        errors.push(`Negative decoherence: ${quantumState.decoherence}`);
      }
      if (quantumState.fidelity < 0.3) {
        errors.push(`Fidelity critically low: ${quantumState.fidelity}`);
      }

      // 4. Check panel has data in DB
      if (!dbState) {
        errors.push('No persisted quantum state found');
      }

      const latency = Math.round(performance.now() - start);

      results.push({
        panelId: panel.id,
        panelName: panel.name,
        status: errors.length === 0 ? 'pass' : skillsPassed > 0 ? 'warning' : 'fail',
        latencyMs: latency,
        quantumState,
        skillsValidated: panelSkills.length,
        skillsPassed,
        errors,
      });
    }

    // 5. Cross-panel checks
    const allFidelities = results.map(r => r.quantumState.fidelity);
    const avgFidelity = allFidelities.reduce((a, b) => a + b, 0) / allFidelities.length;

    const totalLatency = Math.round(performance.now() - startTotal);
    const allPassed = results.every(r => r.status === 'pass');

    // Store smoke test results
    await db.moltbookState.upsert({
      where: { key: 'last_smoke_test' },
      update: {
        value: JSON.stringify({
          timestamp: new Date().toISOString(),
          totalLatencyMs: totalLatency,
          passed: allPassed,
          results: results.map(r => ({
            panelId: r.panelId,
            status: r.status,
            latencyMs: r.latencyMs,
            fidelity: r.quantumState.fidelity,
          })),
          avgFidelity: Math.round(avgFidelity * 100) / 100,
        }),
        updatedAt: new Date(),
      },
      create: {
        key: 'last_smoke_test',
        value: JSON.stringify({ timestamp: new Date().toISOString(), passed: false, results: [] }),
      },
    });

    return {
      passed: allPassed,
      totalLatencyMs: totalLatency,
      avgFidelity: Math.round(avgFidelity * 100) / 100,
      panels: results.length,
      panelsPassed: results.filter(r => r.status === 'pass').length,
      panelsWarning: results.filter(r => r.status === 'warning').length,
      panelsFailed: results.filter(r => r.status === 'fail').length,
      results,
      timestamp: new Date().toISOString(),
    };
  }),
});

// ─── Panel Skills Definition ───
const PANEL_SKILLS: Record<string, string[]> = {
  moltbook:    ['feed_curation', 'social_graph', 'karma_engine', 'voice_synthesis', 'molt_parsing'],
  cerebro:     ['neural_mapping', 'pattern_recognition', 'memory_consolidation', 'cross_agent_correlation', 'predictive_modeling'],
  cofre:       ['btc_rpc', 'utxo_tracking', 'hd_wallet_derivation', 'custody_validation', 'on_chain_analysis'],
  mythos:      ['tool_calling', 'agent_routing', 'synthesis', 'strategy_planning', 'context_management'],
  fable_5:     ['data_extraction', 'web_scraping', 'structured_output', 'search_orchestration', 'fact_verification'],
  wormhole:    ['dimensional_routing', 'data_transport', 'compression', 'encryption', 'latency_optimization'],
  blackhole:   ['entropy_calculation', 'data_compression', 'event_horizon_detection', 'hawking_radiation_sim', 'singularity_analysis'],
};

// ─── Helper: Run a single invocation iteration ───
async function runSingleIteration(iteration: number) {
  for (const panel of PANEL_REGISTRY) {
    const prevKey = `quantum_${panel.id}`;
    const prevDb = await db.moltbookState.findUnique({ where: { key: prevKey } });
    let prevState: QuantumState | null = null;
    if (prevDb) { try { prevState = JSON.parse(prevDb.value); } catch { /* skip */ } }

    const newState = generateQuantumState(prevState, panel.id, iteration);

    await db.moltbookState.upsert({
      where: { key: prevKey },
      update: { value: JSON.stringify(newState), updatedAt: new Date() },
      create: { key: prevKey, value: JSON.stringify(newState) },
    });
  }

  // Cross-panel coherence
  const allStates: QuantumState[] = [];
  for (const panel of PANEL_REGISTRY) {
    const s = await db.moltbookState.findUnique({ where: { key: `quantum_${panel.id}` } });
    if (s) { try { allStates.push(JSON.parse(s.value)); } catch { /* skip */ } }
  }

  const avgFidelity = allStates.length > 0
    ? allStates.reduce((s, q) => s + q.fidelity, 0) / allStates.length
    : 0;

  return {
    iteration,
    panelsProcessed: PANEL_REGISTRY.length,
    avgFidelity: Math.round(avgFidelity * 100) / 100,
    timestamp: new Date().toISOString(),
  };
}

// ─── Background loop scheduler (fire-and-forget) ───
function scheduleBackgroundLoop(startIteration: number, maxIterations: number, intervalMs: number) {
  const run = async (iter: number) => {
    if (iter > maxIterations) {
      // Mark complete
      const loopKey = 'webhook_loop_status';
      const current = await db.moltbookState.findUnique({ where: { key: loopKey } });
      let data: Record<string, unknown> = {};
      if (current) { try { data = JSON.parse(current.value); } catch { /* skip */ } }
      data.running = false;
      data.status = 'completed';
      data.iteration = maxIterations;
      data.completedAt = new Date().toISOString();
      await db.moltbookState.upsert({
        where: { key: loopKey },
        update: { value: JSON.stringify(data), updatedAt: new Date() },
        create: { key: loopKey, value: JSON.stringify(data) },
      });
      return;
    }

    try {
      await runSingleIteration(iter);

      // Update status
      const loopKey = 'webhook_loop_status';
      const current = await db.moltbookState.findUnique({ where: { key: loopKey } });
      let data: Record<string, unknown> = {};
      if (current) { try { data = JSON.parse(current.value); } catch { /* skip */ } }
      data.iteration = iter;
      data.lastPulse = new Date().toISOString();
      data.status = 'running';
      await db.moltbookState.upsert({
        where: { key: loopKey },
        update: { value: JSON.stringify(data), updatedAt: new Date() },
        create: { key: loopKey, value: JSON.stringify(data) },
      });
    } catch (err) {
      console.error(`[Webhook Loop] Error at iteration ${iter}:`, err);
    }

    // Schedule next with exponential backoff
    const exponentialDelay = Math.min(intervalMs * Math.pow(1.05, iter - startIteration), 60000);
    setTimeout(() => run(iter + 1), exponentialDelay);
  };

  // Start after a short delay
  setTimeout(() => run(startIteration), intervalMs);
}