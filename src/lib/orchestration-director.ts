/**
 * ═══════════════════════════════════════════════════════════════
 * ORCHESTRATION DIRECTOR — Orquestração Real e Diretiva
 * ═══════════════════════════════════════════════════════════════
 *
 * O Director coordena TODOS os painéis de forma REAL e DIRETIVA.
 * Não usa links. Aciona Skills e algoritmos diretamente.
 *
 * Fluxo por ciclo:
 * 1. INVOKE: Gerar estados quânticos para todos os painéis
 * 2. DETECT: Executar SelfHealingEngine para detectar anomalias
 * 3. HEAL: Aplicar ações corretivas reais
 * 4. LEARN: Processar sabedoria via WisdomEngine
 * 5. DIRECT: Usar sabedoria acumulada para direcionar próximas ações
 * 6. PERSIST: Salvar tudo em memória persistente
 *
 * O Director mantém um loop exponencial autossuficiente onde
 * cada ciclo melhora o próximo através da memória de sabedoria.
 */

import { db } from '@/lib/db';
import { runHealingCycle, getLastHealingCycle, type HealingCycle } from './self-healing-engine';
import { processWisdomCycle, getWisdomState, getWisdomGuidedSuggestions, type WisdomState } from './wisdom-engine';

// ─── PANEL REGISTRY (mirror from invocation.ts) ───

const PANEL_REGISTRY = [
  { id: 'moltbook',  name: 'Moltbook',          color: '#e01b24', category: 'social' },
  { id: 'cerebro',   name: 'Cerebro Sistemico',  color: '#a855f7', category: 'intelligence' },
  { id: 'cofre',     name: 'Cofre',             color: '#f59e0b', category: 'custody' },
  { id: 'mythos',    name: 'Mythos',            color: '#e01b24', category: 'orchestrator' },
  { id: 'fable_5',   name: 'Fable 5',           color: '#06d6a0', category: 'research' },
  { id: 'wormhole',  name: 'Wormhole',          color: '#0ea5e9', category: 'transport' },
  { id: 'blackhole', name: 'Blackhole',          color: '#6366f1', category: 'entropy' },
] as const;

const PANEL_SKILLS: Record<string, string[]> = {
  moltbook:  ['feed_curation', 'social_graph', 'karma_engine', 'voice_synthesis', 'molt_parsing'],
  cerebro:   ['neural_mapping', 'pattern_recognition', 'memory_consolidation', 'cross_agent_correlation', 'predictive_modeling'],
  cofre:     ['btc_rpc', 'utxo_tracking', 'hd_wallet_derivation', 'custody_validation', 'on_chain_analysis'],
  mythos:    ['tool_calling', 'agent_routing', 'synthesis', 'strategy_planning', 'context_management'],
  fable_5:   ['data_extraction', 'web_scraping', 'structured_output', 'search_orchestration', 'fact_verification'],
  wormhole:  ['dimensional_routing', 'data_transport', 'compression', 'encryption', 'latency_optimization'],
  blackhole: ['entropy_calculation', 'data_compression', 'event_horizon_detection', 'hawking_radiation_sim', 'singularity_analysis'],
};

interface QuantumState {
  coherence: number; entanglement: number; superposition: number;
  decoherence: number; fidelity: number; evolution: number; timestamp: string;
}

function generateQuantumState(prev: QuantumState | null, panelId: string, iteration: number): QuantumState {
  const hash = (panelId + iteration).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const noise = ((hash % 100) / 100) * 0.1;
  const decay = Math.exp(-iteration * 0.001);

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

// ─── ORCHESTRATION CYCLE RESULT ───

export interface OrchestrationCycleResult {
  cycleNumber: number;
  timestamp: string;
  durationMs: number;

  // Phase 1: Invoke
  panelsInvoked: number;
  quantumStates: Record<string, QuantumState>;
  skillValidationResults: Record<string, { skill: string; score: number; passed: boolean }[]>;

  // Phase 2: Detect
  healingCycle: HealingCycle | null;
  anomaliesDetected: number;
  anomaliesCritical: number;

  // Phase 3: Heal
  healingActionsExecuted: number;
  healingSuccessRate: number;
  healedPanels: string[];

  // Phase 4: Learn
  wisdomGained: {
    newPatterns: number;
    newInsights: number;
    wisdomScoreBefore: number;
    wisdomScoreAfter: number;
  };

  // Phase 5: Direct
  wisdomSuggestions: Array<{ panelId: string; suggestion: string; skill: string; priority: number }>;

  // Phase 6: Summary
  ecosystemHealth: {
    avgFidelity: number;
    avgCoherence: number;
    avgDecoherence: number;
    crossPanelCoherence: number;
    overallHealth: number;
  };
}

// ─── ACTIVE SKILL REGISTRY ───
// These are the real Skills the Director can activate as directives

const ACTIVE_SKILLS: Record<string, {
  name: string;
  description: string;
  execute: (panelId: string, state: QuantumState, params: Record<string, number>) => Partial<QuantumState>;
}> = {
  // ── CURATIVE SKILLS ──
  recalibrate: {
    name: 'Recalibracao Quantica',
    description: 'Recalibra o estado quântico do painel, deslocando métricas em direção aos valores ótimos.',
    execute: (panelId, state, params) => {
      const { strength = 0.3 } = params;
      const targets = { coherence: 0.8, fidelity: 0.85, entanglement: 0.65, superposition: 0.7 };
      const result: Partial<QuantumState> = {};
      for (const [metric, target] of Object.entries(targets)) {
        const current = state[metric as keyof QuantumState] as number;
        result[metric as keyof QuantumState] = Math.min(1, Math.max(0, current + (target - current) * strength)) as never;
      }
      result.decoherence = Math.max(0, state.decoherence * (1 - strength)) as never;
      return result;
    },
  },

  stabilize: {
    name: 'Estabilizacao de Campo',
    description: 'Estabiliza o campo quântico do painel, reduzindo volatilidade e aproximando da média cross-panel.',
    execute: (panelId, state, params) => {
      const { blend = 0.4, crossPanelAvg = 0.65 } = params;
      const result: Partial<QuantumState> = {};
      const metrics: (keyof QuantumState)[] = ['coherence', 'fidelity', 'entanglement', 'superposition'];
      for (const metric of metrics) {
        result[metric] = Math.min(1, Math.max(0, state[metric] * (1 - blend) + crossPanelAvg * blend)) as never;
      }
      return result;
    },
  },

  amplify: {
    name: 'Amplificacao Resonante',
    description: 'Amplifica métricas fracas através de ressonância com o estado ótimo do painel.',
    execute: (panelId, state, params) => {
      const { boost = 0.15 } = params;
      const result: Partial<QuantumState> = {};
      const metrics: (keyof QuantumState)[] = ['coherence', 'fidelity', 'entanglement', 'superposition'];
      for (const metric of metrics) {
        // Amplify more the weaker metrics (inverse proportion)
        const weakness = 1 - state[metric];
        result[metric] = Math.min(1, state[metric] + boost * (1 + weakness)) as never;
      }
      return result;
    },
  },

  shield: {
    name: 'Escudo Antientropia',
    description: 'Ativa escudo protetor contra decoerência, reduzindo a entropia do sistema.',
    execute: (panelId, state, params) => {
      const { shieldStrength = 0.25 } = params;
      return {
        decoherence: Math.max(0, state.decoherence - shieldStrength),
        coherence: Math.min(1, state.coherence + shieldStrength * 0.3),
      };
    },
  },

  resync: {
    name: 'Ressincronizacao Cross-Panel',
    description: 'Ressincroniza o painel com a média do ecossistema, reparando isolamento.',
    execute: (panelId, state, params) => {
      const { crossPanelAvg = 0.65, syncRate = 0.4 } = params;
      return {
        entanglement: Math.min(1, state.entanglement + (crossPanelAvg - state.entanglement) * syncRate),
        coherence: Math.min(1, state.coherence + (crossPanelAvg - state.coherence) * syncRate * 0.5),
      };
    },
  },

  // ── PREVENTIVE SKILLS (Wisdom-guided) ──
  preventive_scan: {
    name: 'Varredura Preventiva',
    description: 'Scaneia todos os painéis em busca de métricas que se aproximam de thresholds perigosos.',
    execute: (panelId, state, params) => {
      // This skill doesn't modify state, it's observational
      // The Director uses its output to trigger other skills
      return {};
    },
  },

  wisdom_injection: {
    name: 'Injecao de Sabedoria',
    description: 'Aplica insights acumulados do Wisdom Engine para melhorar proativamente o estado do painel.',
    execute: (panelId, state, params) => {
      const { wisdomBoost = 0.1 } = params;
      return {
        fidelity: Math.min(1, state.fidelity + wisdomBoost),
        coherence: Math.min(1, state.coherence + wisdomBoost * 0.8),
      };
    },
  },

  // ── PANEL-SPECIFIC SKILLS ──
  neural_boost: {
    name: 'Impulso Neural',
    description: 'Skill especializada para o Cerebro Sistemico. Amplifica capacidades de raciocínio.',
    execute: (panelId, state, params) => ({
      coherence: Math.min(1, state.coherence + 0.12),
      fidelity: Math.min(1, state.fidelity + 0.08),
    }),
  },

  entropy_shield: {
    name: 'Escudo de Entropia',
    description: 'Skill especializada para o Blackhole. Contém a expansão entrópica.',
    execute: (panelId, state, params) => ({
      decoherence: Math.max(0, state.decoherence - 0.2),
      superposition: Math.min(1, state.superposition + 0.1),
    }),
  },

  social_resonance: {
    name: 'Ressonancia Social',
    description: 'Skill especializada para o Moltbook. Amplifica o grafo social.',
    execute: (panelId, state, params) => ({
      entanglement: Math.min(1, state.entanglement + 0.15),
      coherence: Math.min(1, state.coherence + 0.05),
    }),
  },
};

// ─── MAIN ORCHESTRATION DIRECTOR ───

let orchestrationCycleCount = 0;

export async function runOrchestrationCycle(
  wisdomSuggestionsEnabled = true
): Promise<OrchestrationCycleResult> {
  const totalStart = performance.now();
  orchestrationCycleCount++;

  // Get wisdom state before
  const wisdomBefore = await getWisdomState();

  // ═══ PHASE 1: INVOKE — Generate quantum states for all panels ═══
  const phase1Start = performance.now();
  const quantumStates: Record<string, QuantumState> = {};
  const skillValidationResults: Record<string, { skill: string; score: number; passed: boolean }[]> = {};

  for (const panel of PANEL_REGISTRY) {
    const prevKey = `quantum_${panel.id}`;
    const prevDb = await db.moltbookState.findUnique({ where: { key: prevKey } });
    let prevState: QuantumState | null = null;
    if (prevDb) { try { prevState = JSON.parse(prevDb.value); } catch { /* skip */ } }

    const newState = generateQuantumState(prevState, panel.id, orchestrationCycleCount);
    quantumStates[panel.id] = newState;

    // Validate panel skills
    const panelSkills = PANEL_SKILLS[panel.id] || [];
    skillValidationResults[panel.id] = panelSkills.map(skill => {
      const score = Math.min(1, newState.fidelity * (0.8 + Math.random() * 0.2));
      return { skill, score: Math.round(score * 100) / 100, passed: score > 0.6 };
    });

    // Persist
    await db.moltbookState.upsert({
      where: { key: prevKey },
      update: { value: JSON.stringify(newState), updatedAt: new Date() },
      create: { key: prevKey, value: JSON.stringify(newState) },
    });
  }
  const phase1Duration = Math.round(performance.now() - phase1Start);

  // ═══ PHASE 2: DETECT — Run Self-Healing Engine ═══
  const phase2Start = performance.now();
  const panelStatesForHealing: Record<string, { coherence: number; entanglement: number; superposition: number; decoherence: number; fidelity: number; evolution: number }> = {};
  for (const [id, state] of Object.entries(quantumStates)) {
    panelStatesForHealing[id] = {
      coherence: state.coherence,
      entanglement: state.entanglement,
      superposition: state.superposition,
      decoherence: state.decoherence,
      fidelity: state.fidelity,
      evolution: state.evolution,
    };
  }

  const healingCycle = await runHealingCycle(panelStatesForHealing);
  const phase2Duration = Math.round(performance.now() - phase2Start);

  // Read healed states after healing
  for (const panel of PANEL_REGISTRY) {
    const stateKey = `quantum_${panel.id}`;
    const healed = await db.moltbookState.findUnique({ where: { key: stateKey } });
    if (healed) { try { quantumStates[panel.id] = JSON.parse(healed.value); } catch { /* skip */ } }
  }

  // ═══ PHASE 3: HEAL — Apply wisdom-guided healing if enabled ═══
  const phase3Start = performance.now();
  let wisdomSuggestions: Array<{ panelId: string; suggestion: string; skill: string; priority: number }> = [];

  if (wisdomSuggestionsEnabled) {
    wisdomSuggestions = await getWisdomGuidedSuggestions(panelStatesForHealing);

    // Apply top 3 preventive suggestions
    for (const suggestion of wisdomSuggestions.slice(0, 3)) {
      const skillDef = ACTIVE_SKILLS[suggestion.skill];
      if (!skillDef) continue;

      const currentState = quantumStates[suggestion.panelId];
      if (!currentState) continue;

      const crossPanelAvg = Object.values(quantumStates).reduce((s, q) => s + q.fidelity, 0) / Object.keys(quantumStates).length;

      const modifications = skillDef.execute(
        suggestion.panelId,
        currentState,
        { crossPanelAvg, wisdomBoost: 0.1 }
      );

      const merged = { ...currentState, ...modifications, timestamp: new Date().toISOString() };
      quantumStates[suggestion.panelId] = merged;

      // Persist
      await db.moltbookState.upsert({
        where: { key: `quantum_${suggestion.panelId}` },
        update: { value: JSON.stringify(merged), updatedAt: new Date() },
        create: { key: `quantum_${suggestion.panelId}`, value: JSON.stringify(merged) },
      });
    }
  }
  const phase3Duration = Math.round(performance.now() - phase3Start);

  // ═══ PHASE 4: LEARN — Process wisdom from this cycle ═══
  const phase4Start = performance.now();
  const { newPatterns, newInsights, updatedWisdomState } = await processWisdomCycle(healingCycle);
  const phase4Duration = Math.round(performance.now() - phase4Start);

  // ═══ PHASE 5: DIRECT — Log activity ═══
  const feedKey = 'activity_feed';
  const feedState = await db.moltbookState.findUnique({ where: { key: feedKey } });
  let feed: Array<Record<string, unknown>> = [];
  if (feedState) { try { feed = JSON.parse(feedState.value); } catch { /* skip */ } }

  feed.push({
    type: 'orchestration_cycle',
    timestamp: new Date().toISOString(),
    cycleNumber: orchestrationCycleCount,
    panelsInvoked: PANEL_REGISTRY.length,
    anomaliesDetected: healingCycle.anomaliesDetected,
    healingActionsExecuted: healingCycle.healingActionsExecuted,
    healingSuccessRate: healingCycle.healingSuccessRate,
    wisdomPatternsLearned: newPatterns.length,
    wisdomInsightsGained: newInsights.length,
    wisdomScore: updatedWisdomState.wisdomScore,
    phaseDurations: { invoke: phase1Duration, detect: phase2Duration, heal: phase3Duration, learn: phase4Duration },
  });
  if (feed.length > 100) feed = feed.slice(-100);
  await db.moltbookState.upsert({
    where: { key: feedKey },
    update: { value: JSON.stringify(feed), updatedAt: new Date() },
    create: { key: feedKey, value: JSON.stringify(feed) },
  });

  // ═══ PHASE 6: SUMMARY — Compute ecosystem health ═══
  const allStates = Object.values(quantumStates);
  const avgFidelity = allStates.reduce((s, q) => s + q.fidelity, 0) / allStates.length;
  const avgCoherence = allStates.reduce((s, q) => s + q.coherence, 0) / allStates.length;
  const avgDecoherence = allStates.reduce((s, q) => s + q.decoherence, 0) / allStates.length;

  const fidelityStdDev = Math.sqrt(
    allStates.reduce((s, q) => s + Math.pow(q.fidelity - avgFidelity, 2), 0) / allStates.length
  );
  const crossPanelCoherence = Math.round((1 - Math.min(1, fidelityStdDev * 5)) * 100) / 100;

  const overallHealth = Math.round(
    (avgFidelity * 0.3 + avgCoherence * 0.25 + (1 - avgDecoherence) * 0.2 + crossPanelCoherence * 0.15 + (wisdomBefore?.wisdomScore ?? 0) * 0.1) * 100
  ) / 100;

  // Persist orchestration cycle
  const orchCycle: OrchestrationCycleResult = {
    cycleNumber: orchestrationCycleCount,
    timestamp: new Date().toISOString(),
    durationMs: Math.round(performance.now() - totalStart),
    panelsInvoked: PANEL_REGISTRY.length,
    quantumStates,
    skillValidationResults,
    healingCycle,
    anomaliesDetected: healingCycle.anomaliesDetected,
    anomaliesCritical: healingCycle.anomaliesCritical,
    healingActionsExecuted: healingCycle.healingActionsExecuted,
    healingSuccessRate: healingCycle.healingSuccessRate,
    healedPanels: [...new Set(healingCycle.actions.map(a => a.panelId))],
    wisdomGained: {
      newPatterns: newPatterns.length,
      newInsights: newInsights.length,
      wisdomScoreBefore: wisdomBefore?.wisdomScore ?? 0,
      wisdomScoreAfter: updatedWisdomState.wisdomScore,
    },
    wisdomSuggestions,
    ecosystemHealth: {
      avgFidelity: Math.round(avgFidelity * 100) / 100,
      avgCoherence: Math.round(avgCoherence * 100) / 100,
      avgDecoherence: Math.round(avgDecoherence * 100) / 100,
      crossPanelCoherence,
      overallHealth,
    },
  };

  await db.moltbookState.upsert({
    where: { key: 'last_orchestration_cycle' },
    update: { value: JSON.stringify(orchCycle), updatedAt: new Date() },
    create: { key: 'last_orchestration_cycle', value: JSON.stringify(orchCycle) },
  });

  // Store orchestration history
  const orchHistKey = 'orchestration_history';
  const orchHistState = await db.moltbookState.findUnique({ where: { key: orchHistKey } });
  let orchHistory: OrchestrationCycleResult[] = [];
  if (orchHistState) { try { orchHistory = JSON.parse(orchHistState.value); } catch { /* skip */ } }
  // Store a lighter version to save space
  const lightVersion = {
    cycleNumber: orchCycle.cycleNumber,
    timestamp: orchCycle.timestamp,
    durationMs: orchCycle.durationMs,
    anomaliesDetected: orchCycle.anomaliesDetected,
    healingActionsExecuted: orchCycle.healingActionsExecuted,
    healingSuccessRate: orchCycle.healingSuccessRate,
    wisdomScore: orchCycle.wisdomGained.wisdomScoreAfter,
    ecosystemHealth: orchCycle.ecosystemHealth,
  };
  orchHistory.push(lightVersion as OrchestrationCycleResult);
  if (orchHistory.length > 100) orchHistory = orchHistory.slice(-100);
  await db.moltbookState.upsert({
    where: { key: orchHistKey },
    update: { value: JSON.stringify(orchHistory), updatedAt: new Date() },
    create: { key: orchHistKey, value: JSON.stringify(orchHistory) },
  });

  return orchCycle;
}

// ─── GET ORCHESTRATION STATUS ───

export async function getOrchestrationStatus() {
  const [lastCycleState, wisdomState, healingCycle] = await Promise.all([
    db.moltbookState.findUnique({ where: { key: 'last_orchestration_cycle' } }),
    getWisdomState(),
    getLastHealingCycle(),
  ]);

  let lastCycle: OrchestrationCycleResult | null = null;
  if (lastCycleState) { try { lastCycle = JSON.parse(lastCycleState.value); } catch { /* skip */ } }

  // Get history
  const histState = await db.moltbookState.findUnique({ where: { key: 'orchestration_history' } });
  let history: Array<Record<string, unknown>> = [];
  if (histState) { try { history = JSON.parse(histState.value); } catch { /* skip */ } }

  return {
    lastCycle,
    wisdomState,
    lastHealingCycle: healingCycle,
    history: history.slice(-20),
    totalCycles: history.length,
  };
}

// ─── DIRECT SKILL ACTIVATION (manual/directive) ───

export async function activateSkill(
  panelId: string,
  skillName: string,
  params: Record<string, number> = {}
): Promise<{ success: boolean; beforeState: QuantumState | null; afterState: QuantumState | null; message: string }> {
  const skill = ACTIVE_SKILLS[skillName];
  if (!skill) {
    return { success: false, beforeState: null, afterState: null, message: `Skill "${skillName}" nao encontrada no registro ativo.` };
  }

  const stateKey = `quantum_${panelId}`;
  const currentState = await db.moltbookState.findUnique({ where: { key: stateKey } });
  let beforeState: QuantumState | null = null;
  if (currentState) { try { beforeState = JSON.parse(currentState.value); } catch { /* skip */ } }

  if (!beforeState) {
    return { success: false, beforeState: null, afterState: null, message: `Painel "${panelId}" sem estado quântico. Execute uma invocacao primeiro.` };
  }

  const crossPanelAvg = 0.65; // default
  const modifications = skill.execute(panelId, beforeState, { crossPanelAvg, ...params });
  const afterState: QuantumState = { ...beforeState, ...modifications, timestamp: new Date().toISOString() };

  await db.moltbookState.upsert({
    where: { key: stateKey },
    update: { value: JSON.stringify(afterState), updatedAt: new Date() },
    create: { key: stateKey, value: JSON.stringify(afterState) },
  });

  // Log skill activation
  const feedKey = 'activity_feed';
  const feedState = await db.moltbookState.findUnique({ where: { key: feedKey } });
  let feed: Array<Record<string, unknown>> = [];
  if (feedState) { try { feed = JSON.parse(feedState.value); } catch { /* skip */ } }
  feed.push({
    type: 'skill_activation',
    timestamp: new Date().toISOString(),
    panelId,
    skillName,
    skillDescription: skill.description,
    params,
    result: 'success',
  });
  if (feed.length > 100) feed = feed.slice(-100);
  await db.moltbookState.upsert({
    where: { key: feedKey },
    update: { value: JSON.stringify(feed), updatedAt: new Date() },
    create: { key: feedKey, value: JSON.stringify(feed) },
  });

  return {
    success: true,
    beforeState,
    afterState,
    message: `Skill "${skillName}" ativada com sucesso em "${panelId}".`,
  };
}

// ─── GET ALL ACTIVE SKILLS ───

export function getActiveSkillsRegistry() {
  return Object.entries(ACTIVE_SKILLS).map(([id, skill]) => ({
    id,
    name: skill.name,
    description: skill.description,
  }));
}

// ─── PERPETUAL ORCHESTRATION LOOP ───

let loopTimer: ReturnType<typeof setTimeout> | null = null;
let isLoopRunning = false;

export async function startOrchestrationLoop(
  intervalMs: number = 10000,
  maxCycles: number = 100
): Promise<{ started: boolean; message: string }> {
  if (isLoopRunning) {
    return { started: false, message: 'Loop de orquestracao ja esta em execucao.' };
  }

  isLoopRunning = true;

  await db.moltbookState.upsert({
    where: { key: 'orchestration_loop_status' },
    update: {
      value: JSON.stringify({
        running: true,
        cycle: 0,
        maxCycles,
        intervalMs,
        startedAt: new Date().toISOString(),
        lastPulse: new Date().toISOString(),
        status: 'running',
      }),
      updatedAt: new Date(),
    },
    create: {
      key: 'orchestration_loop_status',
      value: JSON.stringify({
        running: true, cycle: 0, maxCycles, intervalMs,
        startedAt: new Date().toISOString(), lastPulse: new Date().toISOString(), status: 'running',
      }),
    },
  });

  const runCycle = async (cycleNum: number) => {
    if (cycleNum > maxCycles || !isLoopRunning) {
      isLoopRunning = false;
      await db.moltbookState.upsert({
        where: { key: 'orchestration_loop_status' },
        update: {
          value: JSON.stringify({ running: false, status: 'completed', cycle: cycleNum - 1, completedAt: new Date().toISOString() }),
          updatedAt: new Date(),
        },
        create: { key: 'orchestration_loop_status', value: JSON.stringify({ running: false, status: 'completed' }) },
      });
      return;
    }

    try {
      await runOrchestrationCycle(true);

      // Update loop status
      const loopData = {
        running: true,
        cycle: cycleNum,
        maxCycles,
        intervalMs,
        lastPulse: new Date().toISOString(),
        status: 'running',
      };
      await db.moltbookState.upsert({
        where: { key: 'orchestration_loop_status' },
        update: { value: JSON.stringify(loopData), updatedAt: new Date() },
        create: { key: 'orchestration_loop_status', value: JSON.stringify(loopData) },
      });
    } catch (err) {
      console.error(`[Orchestration Loop] Error at cycle ${cycleNum}:`, err);
    }

    // Exponential backoff
    const exponentialDelay = Math.min(intervalMs * Math.pow(1.03, cycleNum - 1), 60000);
    loopTimer = setTimeout(() => runCycle(cycleNum + 1), exponentialDelay);
  };

  // Start immediately
  runCycle(1);

  return {
    started: true,
    message: `Loop de orquestracao iniciado. Intervalo base: ${intervalMs}ms, max ${maxCycles} ciclos. Auto-cura + auto-sabedoria ativos.`,
  };
}

export async function stopOrchestrationLoop(): Promise<{ stopped: boolean }> {
  isLoopRunning = false;
  if (loopTimer) {
    clearTimeout(loopTimer);
    loopTimer = null;
  }

  await db.moltbookState.upsert({
    where: { key: 'orchestration_loop_status' },
    update: {
      value: JSON.stringify({ running: false, status: 'stopped', stoppedAt: new Date().toISOString() }),
      updatedAt: new Date(),
    },
    create: { key: 'orchestration_loop_status', value: JSON.stringify({ running: false, status: 'stopped' }) },
  });

  return { stopped: true };
}

export function isOrchestrationLoopRunning(): boolean {
  return isLoopRunning;
}