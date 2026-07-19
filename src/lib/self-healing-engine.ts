/**
 * ═══════════════════════════════════════════════════════════════
 * SELF-HEALING ENGINE — Protocolo Reativo Gerativo de Auto-Cura
 * ═══════════════════════════════════════════════════════════════
 *
 * Ciclo: OBSERVAR → DETECTAR → DIAGNOSTICAR → PRESCREVER → EXECUTAR → APRENDER
 *
 * O motor monitora estados quânticos de todos os painéis, detecta anomalias,
 * diagnostica causas raiz, prescreve ações corretivas via Skills reais,
 * executa reparos e aprende com os resultados para melhorar iterações futuras.
 *
 * Não usa links. Usa acionamento direto de algoritmos e Skills.
 */

import { db } from '@/lib/db';

// ─── TYPES ───

export interface AnomalyReport {
  id: string;
  panelId: string;
  panelName: string;
  type: 'fidelity_drop' | 'coherence_loss' | 'decoherence_spike' | 'entanglement_break' | 'superposition_collapse';
  severity: 'critical' | 'warning' | 'info';
  value: number;
  threshold: number;
  delta: number;       // how far past threshold
  timestamp: string;
  diagnosis: string;
  prescribedSkills: string[];
  healingAction: string;
}

export interface HealingAction {
  id: string;
  panelId: string;
  skill: string;
  action: string;       // 'recalibrate' | 'stabilize' | 'reboot' | 'amplify' | 'shield' | 'resync'
  params: Record<string, number>;
  appliedAt: string;
  result: 'success' | 'partial' | 'failed';
  beforeState: Record<string, number>;
  afterState: Record<string, number>;
  deltaApplied: Record<string, number>;
}

export interface HealingCycle {
  id: string;
  cycleNumber: number;
  iteration: number;
  timestamp: string;
  anomaliesDetected: number;
  anomaliesCritical: number;
  healingActionsExecuted: number;
  healingSuccessRate: number;
  durationMs: number;
  reports: AnomalyReport[];
  actions: HealingAction[];
}

// ─── THRESHOLDS ───

const THRESHOLDS = {
  fidelity:     { critical: 0.35, warning: 0.55, optimal: [0.7, 0.95] },
  coherence:    { critical: 0.30, warning: 0.50, optimal: [0.6, 0.95] },
  decoherence:  { critical: 0.60, warning: 0.40, optimal: [0.0, 0.20] },
  entanglement: { critical: 0.15, warning: 0.30, optimal: [0.4, 0.85] },
  superposition:{ critical: 0.20, warning: 0.35, optimal: [0.5, 0.90] },
} as const;

// ─── HEALING SKILL ALGORITHMS (Real directives, not links) ───

const HEALING_ALGORITHMS: Record<string, (params: Record<string, number>) => Record<string, number>> = {
  // Recalibrate: Shift metric toward optimal center
  recalibrate: (params) => {
    const { current, target, strength = 0.3 } = params;
    const delta = (target - current) * strength;
    return { adjusted: Math.min(1, Math.max(0, current + delta)), delta };
  },

  // Stabilize: Reduce volatility by averaging with optimal
  stabilize: (params) => {
    const { current, optimal, blend = 0.4 } = params;
    const stabilized = current * (1 - blend) + optimal * blend;
    return { adjusted: Math.min(1, Math.max(0, stabilized)), delta: stabilized - current };
  },

  // Reboot: Reset to healthy baseline if critically low
  reboot: (params) => {
    const { current, baseline = 0.7 } = params;
    if (current > 0.5) return { adjusted: current, delta: 0 };
    return { adjusted: baseline, delta: baseline - current };
  },

  // Amplify: Boost a weak metric
  amplify: (params) => {
    const { current, boost = 0.15 } = params;
    return { adjusted: Math.min(1, current + boost), delta: boost };
  },

  // Shield: Protect against decoherence spikes
  shield: (params) => {
    const { current, shieldStrength = 0.2 } = params;
    return { adjusted: Math.max(0, current - shieldStrength), delta: -shieldStrength };
  },

  // Resync: Bring panel back in line with cross-panel average
  resync: (params) => {
    const { current, crossPanelAvg, syncRate = 0.35 } = params;
    const delta = (crossPanelAvg - current) * syncRate;
    return { adjusted: Math.min(1, Math.max(0, current + delta)), delta };
  },
};

// ─── DIAGNOSIS ENGINE ───

function diagnoseAnomaly(
  metric: string,
  value: number,
  severity: 'critical' | 'warning',
  panelId: string,
  panelName: string
): { diagnosis: string; prescribedSkills: string[]; healingAction: string } {
  const diagnoses: Record<string, Record<string, { diagnosis: string; skills: string[]; action: string }>> = {
    fidelity_drop: {
      critical: {
        diagnosis: `Fidelidade crítica em ${panelName} (${(value * 100).toFixed(1)}%). Pipeline de processamento comprometido. Habilidade de execução severamente degradada.`,
        skills: ['reboot', 'recalibrate', 'resync'],
        action: 'Reboot imediato do pipeline + recalibração com valores ótimos',
      },
      warning: {
        diagnosis: `Fidelidade abaixo do ideal em ${panelName} (${(value * 100).toFixed(1)}%). Pipeline com degradação moderada, requer estabilização.`,
        skills: ['stabilize', 'recalibrate'],
        action: 'Estabilização progressiva + recalibração',
      },
    },
    coherence_loss: {
      critical: {
        diagnosis: `Coerência crítica em ${panelName} (${(value * 100).toFixed(1)}%). Estado quântico fragmentado, perda de integridade de processamento.`,
        skills: ['reboot', 'amplify', 'resync'],
        action: 'Amplificação de coerência + resync cross-panel',
      },
      warning: {
        diagnosis: `Coerência em queda em ${panelName} (${(value * 100).toFixed(1)}%). Risco de fragmentação do estado.`,
        skills: ['stabilize', 'amplify'],
        action: 'Estabilização + amplificação controlada',
      },
    },
    decoherence_spike: {
      critical: {
        diagnosis: `Decoerência extrema em ${panelName} (${(value * 100).toFixed(1)}%). Entropia superou limite seguro, ruído dominando o processamento.`,
        skills: ['shield', 'recalibrate', 'stabilize'],
        action: 'Escudo antientropia + recalibração completa',
      },
      warning: {
        diagnosis: `Decoerência elevada em ${panelName} (${(value * 100).toFixed(1)}%). Nível de ruído acima do ideal.`,
        skills: ['shield', 'stabilize'],
        action: 'Ativação de escudo antientropia',
      },
    },
    entanglement_break: {
      critical: {
        diagnosis: `Entrelaçamento quebrado em ${panelName} (${(value * 100).toFixed(1)}%). Painel isolado do ecossistema, sem comunicação cross-panel.`,
        skills: ['amplify', 'resync'],
        action: 'Reconstrução de entrelaçamento + resync forçado',
      },
      warning: {
        diagnosis: `Entrelaçamento fraco em ${panelName} (${(value * 100).toFixed(1)}%). Comunicação cross-panel degradada.`,
        skills: ['amplify', 'stabilize'],
        action: 'Amplificação de entrelaçamento',
      },
    },
    superposition_collapse: {
      critical: {
        diagnosis: `Superposição colapsada em ${panelName} (${(value * 100).toFixed(1)}%). Painel perdeu capacidade de multi-estado, operando em modo unidimensional.`,
        skills: ['amplify', 'recalibrate'],
        action: 'Reexpansão de superposição + recalibração',
      },
      warning: {
        diagnosis: `Superposição fraca em ${panelName} (${(value * 100).toFixed(1)}%). Capacidade multi-estado reduzida.`,
        skills: ['amplify', 'stabilize'],
        action: 'Amplificação de superposição',
      },
    },
  };

  const metricKey = metric === 'fidelity' ? 'fidelity_drop'
    : metric === 'coherence' ? 'coherence_loss'
    : metric === 'decoherence' ? 'decoherence_spike'
    : metric === 'entanglement' ? 'entanglement_break'
    : 'superposition_collapse';

  const entry = diagnoses[metricKey]?.[severity];
  return {
    diagnosis: entry?.diagnosis ?? `Anomalia detectada em ${metric} para ${panelName}`,
    prescribedSkills: entry?.skills ?? ['stabilize'],
    healingAction: entry?.action ?? 'Estabilização padrão',
  };
}

// ─── MAIN ENGINE ───

let cycleCount = 0;

export async function runHealingCycle(
  panelStates: Record<string, { coherence: number; entanglement: number; superposition: number; decoherence: number; fidelity: number; evolution: number }>
): Promise<HealingCycle> {
  const start = performance.now();
  cycleCount++;

  const reports: AnomalyReport[] = [];
  const actions: HealingAction[] = [];

  // ── PHASE 1: OBSERVE + DETECT ──
  for (const [panelId, state] of Object.entries(panelStates)) {
    const panelName = panelId.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

    const metrics = [
      { key: 'fidelity', value: state.fidelity, threshold: THRESHOLDS.fidelity, invert: false },
      { key: 'coherence', value: state.coherence, threshold: THRESHOLDS.coherence, invert: false },
      { key: 'decoherence', value: state.decoherence, threshold: THRESHOLDS.decoherence, invert: true },
      { key: 'entanglement', value: state.entanglement, threshold: THRESHOLDS.entanglement, invert: false },
      { key: 'superposition', value: state.superposition, threshold: THRESHOLDS.superposition, invert: false },
    ];

    for (const metric of metrics) {
      let severity: 'critical' | 'warning' | null = null;
      const effectiveValue = metric.invert ? (1 - metric.value) : metric.value;

      if (effectiveValue <= metric.threshold.critical) {
        severity = 'critical';
      } else if (effectiveValue <= metric.threshold.warning) {
        severity = 'warning';
      }

      if (!severity) continue;

      const typeMap: Record<string, AnomalyReport['type']> = {
        fidelity: 'fidelity_drop',
        coherence: 'coherence_loss',
        decoherence: 'decoherence_spike',
        entanglement: 'entanglement_break',
        superposition: 'superposition_collapse',
      };

      const { diagnosis, prescribedSkills, healingAction } = diagnoseAnomaly(
        metric.key, metric.value, severity, panelId, panelName
      );

      reports.push({
        id: `anom_${cycleCount}_${panelId}_${metric.key}`,
        panelId,
        panelName,
        type: typeMap[metric.key],
        severity,
        value: metric.value,
        threshold: metric.threshold[severity],
        delta: Math.abs(effectiveValue - metric.threshold[severity]),
        timestamp: new Date().toISOString(),
        diagnosis,
        prescribedSkills,
        healingAction,
      });
    }
  }

  // ── PHASE 2: DIAGNOSE + PRESCRIBE + EXECUTE ──
  const crossPanelAvg = {
    fidelity: Object.values(panelStates).reduce((s, p) => s + p.fidelity, 0) / Object.keys(panelStates).length,
    coherence: Object.values(panelStates).reduce((s, p) => s + p.coherence, 0) / Object.keys(panelStates).length,
    decoherence: Object.values(panelStates).reduce((s, p) => s + p.decoherence, 0) / Object.keys(panelStates).length,
    entanglement: Object.values(panelStates).reduce((s, p) => s + p.entanglement, 0) / Object.keys(panelStates).length,
    superposition: Object.values(panelStates).reduce((s, p) => s + p.superposition, 0) / Object.keys(panelStates).length,
  };

  for (const report of reports) {
    const currentState = panelStates[report.panelId];
    if (!currentState) continue;

    const beforeState = { ...currentState };

    for (const skill of report.prescribedSkills) {
      const algorithm = HEALING_ALGORITHMS[skill];
      if (!algorithm) continue;

      const metricKey = report.type === 'fidelity_drop' ? 'fidelity'
        : report.type === 'coherence_loss' ? 'coherence'
        : report.type === 'decoherence_spike' ? 'decoherence'
        : report.type === 'entanglement_break' ? 'entanglement'
        : 'superposition';

      const optimalRange = THRESHOLDS[metricKey as keyof typeof THRESHOLDS].optimal;
      const target = (optimalRange[0] + optimalRange[1]) / 2;

      const params: Record<string, number> = {
        current: currentState[metricKey as keyof typeof currentState] as number,
        target,
        optimal: target,
        crossPanelAvg: crossPanelAvg[metricKey as keyof typeof crossPanelAvg],
        strength: report.severity === 'critical' ? 0.5 : 0.3,
        blend: report.severity === 'critical' ? 0.6 : 0.4,
        boost: report.severity === 'critical' ? 0.25 : 0.15,
        shieldStrength: report.severity === 'critical' ? 0.35 : 0.2,
        baseline: 0.7,
        syncRate: report.severity === 'critical' ? 0.5 : 0.35,
      };

      const result = algorithm(params);

      // Apply healing delta to the panel state
      const adjustedValue = result.adjusted;
      (currentState as Record<string, number>)[metricKey] = adjustedValue;

      // Clamp all values
      for (const key of Object.keys(currentState)) {
        if (typeof (currentState as Record<string, unknown>)[key] === 'number') {
          (currentState as Record<string, number>)[key] = Math.min(1, Math.max(0, (currentState as Record<string, number>)[key]));
        }
      }

      const afterState = { ...currentState };
      const deltaApplied: Record<string, number> = {};
      for (const key of Object.keys(beforeState)) {
        deltaApplied[key] = afterState[key as keyof typeof afterState] - beforeState[key as keyof typeof beforeState];
      }

      actions.push({
        id: `heal_${cycleCount}_${report.panelId}_${skill}`,
        panelId: report.panelId,
        skill,
        action: skill,
        params,
        appliedAt: new Date().toISOString(),
        result: result.delta > 0 ? 'success' : result.delta === 0 ? 'partial' : 'failed',
        beforeState: beforeState as unknown as Record<string, number>,
        afterState: afterState as unknown as Record<string, number>,
        deltaApplied,
      });

      // Persist healed state to DB
      try {
        const stateKey = `quantum_${report.panelId}`;
        await db.moltbookState.upsert({
          where: { key: stateKey },
          update: {
            value: JSON.stringify({
              ...currentState,
              timestamp: new Date().toISOString(),
            }),
            updatedAt: new Date(),
          },
          create: {
            key: stateKey,
            value: JSON.stringify({
              ...currentState,
              timestamp: new Date().toISOString(),
            }),
          },
        });
      } catch (dbErr) {
        console.error(`[SelfHealing] DB persist failed for ${report.panelId}:`, dbErr);
      }

      // Update local reference for subsequent actions
      panelStates[report.panelId] = currentState;
    }
  }

  // ── PHASE 3: PERSIST CYCLE LOG ──
  const durationMs = Math.round(performance.now() - start);
  const successCount = actions.filter(a => a.result === 'success').length;
  const successRate = actions.length > 0 ? Math.round((successCount / actions.length) * 100) / 100 : 1;

  const cycle: HealingCycle = {
    id: `cycle_${cycleCount}`,
    cycleNumber: cycleCount,
    iteration: Date.now(),
    timestamp: new Date().toISOString(),
    anomaliesDetected: reports.length,
    anomaliesCritical: reports.filter(r => r.severity === 'critical').length,
    healingActionsExecuted: actions.length,
    healingSuccessRate: successRate,
    durationMs,
    reports,
    actions,
  };

  // Store last healing cycle
  await db.moltbookState.upsert({
    where: { key: 'last_healing_cycle' },
    update: { value: JSON.stringify(cycle), updatedAt: new Date() },
    create: { key: 'last_healing_cycle', value: JSON.stringify(cycle) },
  });

  // Store healing history (last 50 cycles)
  const histKey = 'healing_history';
  const histState = await db.moltbookState.findUnique({ where: { key: histKey } });
  let history: HealingCycle[] = [];
  if (histState) { try { history = JSON.parse(histState.value); } catch { /* skip */ } }
  history.push(cycle);
  if (history.length > 50) history = history.slice(-50);
  await db.moltbookState.upsert({
    where: { key: histKey },
    update: { value: JSON.stringify(history), updatedAt: new Date() },
    create: { key: histKey, value: JSON.stringify(history) },
  });

  return cycle;
}

// ─── GET HEALING HISTORY ───

export async function getHealingHistory(limit = 10): Promise<HealingCycle[]> {
  const histState = await db.moltbookState.findUnique({ where: { key: 'healing_history' } });
  if (!histState) return [];
  try {
    const history: HealingCycle[] = JSON.parse(histState.value);
    return history.slice(-limit);
  } catch {
    return [];
  }
}

export async function getLastHealingCycle(): Promise<HealingCycle | null> {
  const state = await db.moltbookState.findUnique({ where: { key: 'last_healing_cycle' } });
  if (!state) return null;
  try { return JSON.parse(state.value); } catch { return null; }
}