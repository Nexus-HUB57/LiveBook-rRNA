/**
 * ═══════════════════════════════════════════════════════════════
 * WISDOM ENGINE — Memória Persistente e Auto-Sabedoria
 * ═══════════════════════════════════════════════════════════════
 *
 * O Wisdom Engine acumula padrões, insights e aprendizados de cada
 * ciclo de iteração e cura. Ele mantém memória persistente que
 * melhora exponencialmente as decisões futuras do sistema.
 *
 * Conceitos-chave:
 * - Wisdom Patterns: Padrões recorrentes identificados em anomalias
 * - Insight Bank: Insights gerados pela análise de ciclos de cura
 * - Decision Memory: Memória de decisões e seus resultados
 * - Exponential Wisdom Score: Quanto mais aprende, mais sábio fica
 */

import { db } from '@/lib/db';
import type { HealingCycle, AnomalyReport, HealingAction } from './self-healing-engine';

// ─── TYPES ───

export interface WisdomPattern {
  id: string;
  pattern: string;           // e.g. "fidelity_drop_cerebro_after_iteration_10"
  frequency: number;         // how many times observed
  lastObserved: string;
  avgSeverity: number;       // 0-1 (critical=1, warning=0.5)
  associatedPanels: string[];
  rootCauseHypothesis: string;
  recommendedPrevention: string;
  confidence: number;        // 0-1 — how confident the engine is
}

export interface WisdomInsight {
  id: string;
  category: 'prevention' | 'optimization' | 'pattern' | 'correlation' | 'prediction';
  title: string;
  description: string;
  relatedPanels: string[];
  relatedSkills: string[];
  impact: number;            // 0-1 — estimated impact if applied
  confidence: number;        // 0-1
  discoveredAt: string;
  lastValidated: string;
  validationCount: number;
}

export interface DecisionMemory {
  id: string;
  context: string;           // what triggered the decision
  action: string;            // what was decided
  skill: string;
  panelId: string;
  outcome: 'positive' | 'neutral' | 'negative';
  outcomeScore: number;      // -1 to 1
  timestamp: string;
}

export interface WisdomState {
  totalCyclesProcessed: number;
  totalAnomaliesObserved: number;
  totalHealingActions: number;
  wisdomScore: number;       // 0-1, grows exponentially with learning
  patternsCount: number;
  insightsCount: number;
  decisionsCount: number;
  avgHealingSuccessRate: number;
  bestHealingSuccessRate: number;
  evolutionGeneration: number;
  lastUpdated: string;
}

// ─── PATTERN RECOGNITION ───

function extractPatternKey(report: AnomalyReport): string {
  const panel = report.panelId;
  const type = report.type;
  const severityBand = report.severity;
  // Group by panel + type for pattern detection
  return `${type}_${panel}_${severityBand}`;
}

function generateRootCauseHypothesis(pattern: WisdomPattern, recentReports: AnomalyReport[]): string {
  const panelName = pattern.associatedPanels[0]?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) ?? 'painel';
  const hypotheses: Record<string, string> = {
    fidelity_drop: `A fidelidade de ${panelName} degrada ciclicamente, possivelmente por acumulação de decoerência não tratada nas iterações anteriores. O pipeline de processamento apresenta fadiga iterativa.`,
    coherence_loss: `A coerência de ${panelName} oscila em padrão recorrente, indicando instabilidade estrutural no algoritmo de geração de estados quânticos.`,
    decoherence_spike: `Picos de decoerência em ${panelName} sugerem que o mecanismo de contenção de entropia é insuficiente para a carga de processamento atual.`,
    entanglement_break: `O entrelaçamento de ${panelName} se degrada ciclicamente, indicando desalinhamento com a média cross-panel. Possível isolamento progressivo.`,
    superposition_collapse: `A superposição de ${panelName} colapsa recorrentemente, indicando que o algoritmo de expansão multi-estado perde eficácia ao longo das iterações.`,
  };
  const typeKey = pattern.pattern.split('_')[0] + '_' + pattern.pattern.split('_')[1];
  return hypotheses[typeKey] ?? `Anomalia recorrente detectada em ${panelName}.`;
}

function generatePrevention(pattern: WisdomPattern): string {
  const preventions: Record<string, string> = {
    fidelity_drop: 'Pré-ativar recalibração preventiva quando fidelidade cair abaixo de 0.65 (antes do threshold de warning).',
    coherence_loss: 'Implementar estabilização proativa a cada 5 iterações para manter coerência acima de 0.6.',
    decoherence_spike: 'Ativar escudo antientropia preventivo quando decoerência ultrapassar 0.3.',
    entanglement_break: 'Forçar resync cross-panel a cada 3 iterações para manter entrelaçamento saudável.',
    superposition_collapse: 'Amplificar superposição preventivamente quando valor cair abaixo de 0.45.',
  };
  const typeKey = pattern.pattern.split('_')[0] + '_' + pattern.pattern.split('_')[1];
  return preventions[typeKey] ?? 'Monitorar e aplicar estabilização preventiva.';
}

// ─── MAIN WISDOM ENGINE ───

export async function processWisdomCycle(healingCycle: HealingCycle): Promise<{
  newPatterns: WisdomPattern[];
  newInsights: WisdomInsight[];
  updatedWisdomState: WisdomState;
}> {
  // Load current wisdom state
  const wsKey = 'wisdom_state';
  const wsState = await db.moltbookState.findUnique({ where: { key: wsKey } });
  let wisdomState: WisdomState = {
    totalCyclesProcessed: 0,
    totalAnomaliesObserved: 0,
    totalHealingActions: 0,
    wisdomScore: 0.1,
    patternsCount: 0,
    insightsCount: 0,
    decisionsCount: 0,
    avgHealingSuccessRate: 0,
    bestHealingSuccessRate: 0,
    evolutionGeneration: 0,
    lastUpdated: new Date().toISOString(),
  };
  if (wsState) { try { wisdomState = JSON.parse(wsState.value); } catch { /* skip */ } }

  // Load existing patterns
  const patKey = 'wisdom_patterns';
  const patState = await db.moltbookState.findUnique({ where: { key: patKey } });
  let patterns: WisdomPattern[] = [];
  if (patState) { try { patterns = JSON.parse(patState.value); } catch { /* skip */ } }

  // Load existing insights
  const insKey = 'wisdom_insights';
  const insState = await db.moltbookState.findUnique({ where: { key: insKey } });
  let insights: WisdomInsight[] = [];
  if (insState) { try { insights = JSON.parse(insState.value); } catch { /* skip */ } }

  // Load existing decisions
  const decKey = 'wisdom_decisions';
  const decState = await db.moltbookState.findUnique({ where: { key: decKey } });
  let decisions: DecisionMemory[] = [];
  if (decState) { try { decisions = JSON.parse(decState.value); } catch { /* skip */ } }

  const newPatterns: WisdomPattern[] = [];
  const newInsights: WisdomInsight[] = [];

  // ── STEP 1: Update patterns from this cycle's reports ──
  for (const report of healingCycle.reports) {
    const patternKey = extractPatternKey(report);
    const existing = patterns.find(p => p.pattern === patternKey);

    if (existing) {
      existing.frequency++;
      existing.lastObserved = report.timestamp;
      existing.avgSeverity = (existing.avgSeverity * (existing.frequency - 1) + (report.severity === 'critical' ? 1 : 0.5)) / existing.frequency;
      existing.confidence = Math.min(0.99, existing.confidence + 0.05);
      if (!existing.associatedPanels.includes(report.panelId)) {
        existing.associatedPanels.push(report.panelId);
      }
    } else {
      const newPattern: WisdomPattern = {
        id: `pat_${Date.now()}_${report.panelId}_${Math.random().toString(36).slice(2, 6)}`,
        pattern: patternKey,
        frequency: 1,
        lastObserved: report.timestamp,
        avgSeverity: report.severity === 'critical' ? 1 : 0.5,
        associatedPanels: [report.panelId],
        rootCauseHypothesis: '',
        recommendedPrevention: '',
        confidence: 0.3,
      };
      // Only generate hypothesis after 2+ observations
      patterns.push(newPattern);
      newPatterns.push(newPattern);
    }
  }

  // Update hypotheses for patterns with frequency >= 2
  for (const pattern of patterns) {
    if (pattern.frequency >= 2 && !pattern.rootCauseHypothesis) {
      const relatedReports = healingCycle.reports.filter(r =>
        extractPatternKey(r) === pattern.pattern
      );
      pattern.rootCauseHypothesis = generateRootCauseHypothesis(pattern, relatedReports);
      pattern.recommendedPrevention = generatePrevention(pattern);
      pattern.confidence = Math.min(0.95, pattern.confidence + 0.2);
    }
  }

  // ── STEP 2: Generate insights from healing actions ──
  for (const action of healingCycle.actions) {
    // Record decision
    const decision: DecisionMemory = {
      id: `dec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      context: `Healing action for ${action.panelId} via skill ${action.skill}`,
      action: action.action,
      skill: action.skill,
      panelId: action.panelId,
      outcome: action.result === 'success' ? 'positive' : action.result === 'partial' ? 'neutral' : 'negative',
      outcomeScore: action.result === 'success' ? 0.8 : action.result === 'partial' ? 0.3 : -0.5,
      timestamp: action.appliedAt,
    };
    decisions.push(decision);

    // Generate insights from successful healing
    if (action.result === 'success' && action.deltaApplied) {
      const improvedMetric = Object.entries(action.deltaApplied)
        .find(([key, val]) => key !== 'evolution' && Math.abs(val) > 0.01);

      if (improvedMetric && !insights.find(i =>
        i.category === 'optimization' &&
        i.relatedSkills.includes(action.skill) &&
        i.relatedPanels.includes(action.panelId)
      )) {
        const metricName = improvedMetric[0].charAt(0).toUpperCase() + improvedMetric[0].slice(1);
        const insight: WisdomInsight = {
          id: `ins_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
          category: 'optimization',
          title: `Skill ${action.skill} eficaz para ${metricName} em ${action.panelId}`,
          description: `A aplicação do algoritmo ${action.skill} produziu melhoria de ${Math.abs(improvedMetric[1] * 100).toFixed(1)}% em ${metricName} para o painel ${action.panelId}. Esta correlação positiva pode ser usada para cura preventiva.`,
          relatedPanels: [action.panelId],
          relatedSkills: [action.skill],
          impact: Math.min(1, Math.abs(improvedMetric[1]) * 5),
          confidence: 0.6,
          discoveredAt: new Date().toISOString(),
          lastValidated: new Date().toISOString(),
          validationCount: 1,
        };
        insights.push(insight);
        newInsights.push(insight);
      }
    }
  }

  // ── STEP 3: Generate correlation insights ──
  if (healingCycle.reports.length >= 2) {
    const panelAnomalies = healingCycle.reports.reduce((acc, r) => {
      acc[r.panelId] = (acc[r.panelId] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const multiAnomalyPanels = Object.entries(panelAnomalies).filter(([, count]) => count >= 2);
    if (multiAnomalyPanels.length > 0 && !insights.find(i => i.category === 'correlation' && i.title.includes('Multi-anomalia'))) {
      const panelNames = multiAnomalyPanels.map(([id]) => id.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()));
      const insight: WisdomInsight = {
        id: `ins_corr_${Date.now()}`,
        category: 'correlation',
        title: `Correlação multi-anomalia detectada`,
        description: `Painéis ${panelNames.join(', ')} apresentaram múltiplas anomalias simultâneas. Isso sugere uma causa sistêmica compartilhada — possivelmente decoerência cross-panel ou falha no mecanismo de sincronização. Recomenda-se investigar o loop de orquestração.`,
        relatedPanels: multiAnomalyPanels.map(([id]) => id),
        relatedSkills: ['resync', 'stabilize'],
        impact: 0.8,
        confidence: 0.5,
        discoveredAt: new Date().toISOString(),
        lastValidated: new Date().toISOString(),
        validationCount: 1,
      };
      insights.push(insight);
      newInsights.push(insight);
    }
  }

  // ── STEP 4: Update wisdom state (exponential growth) ──
  wisdomState.totalCyclesProcessed++;
  wisdomState.totalAnomaliesObserved += healingCycle.anomaliesDetected;
  wisdomState.totalHealingActions += healingCycle.healingActionsExecuted;
  wisdomState.evolutionGeneration = Math.max(
    wisdomState.evolutionGeneration,
    healingCycle.cycleNumber
  );

  // Exponential wisdom: each cycle adds wisdom proportional to learnings
  const learningFactor = 1 + (newPatterns.length * 0.02 + newInsights.length * 0.03 + healingCycle.healingSuccessRate * 0.01);
  wisdomState.wisdomScore = Math.min(1, wisdomState.wisdomScore * Math.pow(learningFactor, 0.1) + 0.005);

  wisdomState.patternsCount = patterns.length;
  wisdomState.insightsCount = insights.length;
  wisdomState.decisionsCount = decisions.length;
  wisdomState.avgHealingSuccessRate = healingCycle.healingSuccessRate;
  wisdomState.bestHealingSuccessRate = Math.max(wisdomState.bestHealingSuccessRate, healingCycle.healingSuccessRate);
  wisdomState.lastUpdated = new Date().toISOString();

  // ── STEP 5: Persist everything ──
  // Trim to prevent unbounded growth
  if (patterns.length > 100) {
    patterns.sort((a, b) => b.frequency - a.frequency);
    patterns.splice(100);
  }
  if (insights.length > 100) {
    insights.sort((a, b) => b.confidence - a.confidence);
    insights.splice(100);
  }
  if (decisions.length > 500) {
    decisions = decisions.slice(-500);
  }

  await Promise.all([
    db.moltbookState.upsert({
      where: { key: wsKey },
      update: { value: JSON.stringify(wisdomState), updatedAt: new Date() },
      create: { key: wsKey, value: JSON.stringify(wisdomState) },
    }),
    db.moltbookState.upsert({
      where: { key: patKey },
      update: { value: JSON.stringify(patterns), updatedAt: new Date() },
      create: { key: patKey, value: JSON.stringify(patterns) },
    }),
    db.moltbookState.upsert({
      where: { key: insKey },
      update: { value: JSON.stringify(insights), updatedAt: new Date() },
      create: { key: insKey, value: JSON.stringify(insights) },
    }),
    db.moltbookState.upsert({
      where: { key: decKey },
      update: { value: JSON.stringify(decisions), updatedAt: new Date() },
      create: { key: decKey, value: JSON.stringify(decisions) },
    }),
  ]);

  return { newPatterns, newInsights, updatedWisdomState: wisdomState };
}

// ─── GET WISDOM STATE ───

export async function getWisdomState(): Promise<WisdomState | null> {
  const state = await db.moltbookState.findUnique({ where: { key: 'wisdom_state' } });
  if (!state) return null;
  try { return JSON.parse(state.value); } catch { return null; }
}

export async function getWisdomPatterns(): Promise<WisdomPattern[]> {
  const state = await db.moltbookState.findUnique({ where: { key: 'wisdom_patterns' } });
  if (!state) return [];
  try { return JSON.parse(state.value); } catch { return []; }
}

export async function getWisdomInsights(): Promise<WisdomInsight[]> {
  const state = await db.moltbookState.findUnique({ where: { key: 'wisdom_insights' } });
  if (!state) return [];
  try { return JSON.parse(state.value); } catch { return []; }
}

export async function getDecisionMemory(limit = 20): Promise<DecisionMemory[]> {
  const state = await db.moltbookState.findUnique({ where: { key: 'wisdom_decisions' } });
  if (!state) return [];
  try { return (JSON.parse(state.value) as DecisionMemory[]).slice(-limit); } catch { return []; }
}

// ─── WISDOM-GUIDED HEALING SUGGESTIONS ───
// Uses accumulated wisdom to suggest preventive actions

export async function getWisdomGuidedSuggestions(
  panelStates: Record<string, { coherence: number; entanglement: number; superposition: number; decoherence: number; fidelity: number }>
): Promise<Array<{ panelId: string; suggestion: string; skill: string; priority: number }>> {
  const patterns = await getWisdomPatterns();
  const insights = await getWisdomInsights();
  const suggestions: Array<{ panelId: string; suggestion: string; skill: string; priority: number }> = [];

  // Check known patterns against current state
  for (const pattern of patterns) {
    if (pattern.frequency < 2 || pattern.confidence < 0.4) continue;

    for (const panelId of pattern.associatedPanels) {
      const state = panelStates[panelId];
      if (!state) continue;

      // If the pattern's metric is approaching the warning threshold
      const metricKey = pattern.pattern.split('_')[0];
      const warningThresholds: Record<string, number> = {
        fidelity: 0.55, coherence: 0.50, decoherence: 0.40, entanglement: 0.30, superposition: 0.35,
      };

      const threshold = warningThresholds[metricKey];
      if (threshold === undefined) continue;

      const value = (state as Record<string, number>)[metricKey];
      if (value === undefined) continue;

      // For decoherence, higher is worse; for others, lower is worse
      const isApproachingWarning = metricKey === 'decoherence'
        ? value > threshold * 0.85
        : value < threshold * 1.15;

      if (isApproachingWarning && pattern.recommendedPrevention) {
        const skillMap: Record<string, string> = {
          fidelity_drop: 'recalibrate',
          coherence_loss: 'stabilize',
          decoherence_spike: 'shield',
          entanglement_break: 'amplify',
          superposition_collapse: 'amplify',
        };
        const fullType = metricKey + '_' + (metricKey === 'decoherence' ? 'spike' : metricKey === 'fidelity' ? 'drop' : metricKey === 'coherence' ? 'loss' : metricKey === 'entanglement' ? 'break' : 'collapse');
        const skill = skillMap[fullType] ?? 'stabilize';

        suggestions.push({
          panelId,
          suggestion: `[Sabedoria #${pattern.frequency}] ${pattern.recommendedPrevention}`,
          skill,
          priority: pattern.confidence * pattern.frequency * (metricKey === 'decoherence' ? value : (1 - value)),
        });
      }
    }
  }

  // Also add insight-based suggestions
  for (const insight of insights) {
    if (insight.category !== 'optimization' || insight.confidence < 0.5) continue;
    for (const panelId of insight.relatedPanels) {
      suggestions.push({
        panelId,
        suggestion: `[Insight] ${insight.description}`,
        skill: insight.relatedSkills[0] ?? 'stabilize',
        priority: insight.impact * insight.confidence,
      });
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority);
}