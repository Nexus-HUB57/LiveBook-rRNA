/**
 * LIVE LAB — Algorithms v3.0 (Kriya-Cognitivo)
 *
 * Inspirado nos principios da Autobiografia de um Iogue (Paramahansa Yogananda):
 * - MCDM PROMETHEE: "Intuicao Direcionada" — pesos conscientes, preferencia sobre dominancia bruta
 * - Cascade: "Parampara" — cadeia guru-discipulo de fallbacks, o conhecimento flui sem interrupcao
 * - Token Bucket + Priority: "Equilibrio de Forcas" — a energia flui onde e necessaria
 * - Budget Forecast: "Dharma do Recurso" — usar com sabedoria, projetar com consciencia
 * - PII Audit: "Santuario Interior" — proteger o que e sagrado, registrar o que foi tocado
 * - Skill Graph: "Caminho do Discipulo" — cada skill e um passo, cada meta-skill e uma tecnica
 * - RBAC: "Protecao Consciente" — o acesso e concedido conforme a maturidade do buscador
 */

import type {
  MCDMScore,
  LiveLabModel,
  Skill,
  MetaSkill,
  TokenBucketState,
  BudgetState,
  RoutingResult,
  CascadeMatchResult,
  PIIMaskResult,
  PIIAuditEntry,
  SkillCompositionPlan,
  CascataRegra,
  AlgoritmoRoteamento,
  BudgetForecast,
} from './types';

// ─────────────────────────────────────────────────────────────────────────────
// 1. minMaxNormalize — Normalizacao Min-Max (0 a 1)
//    Se todos os valores forem iguais, retorna 0.5 para cada (indiferenca).
// ─────────────────────────────────────────────────────────────────────────────

export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (max === min) {
    return values.map(() => 0.5);
  }

  return values.map((v) => (v - min) / (max - min));
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. cascadeMatch — "Parampara": Correspondencia ponderada de palavras-chave
//    Formato de keyword: "palavra" ou "palavra:peso" (padrao peso=1.0).
//    Pontuacao = soma(pesos_matched) / soma(pesos_total).
//    Retorna null se score < 0.3.
//    Suporta correspondencia parcial em limites de palavras (0.5x boost).
// ─────────────────────────────────────────────────────────────────────────────

export function cascadeMatch(
  intent: string,
  cascata: CascataRegra[],
): CascadeMatchResult | null {
  const intentLower = intent.toLowerCase();

  let bestResult: CascadeMatchResult | null = null;
  let bestScore = 0;

  for (const rule of cascata) {
    const { score: ruleScore, matchedKeyword } = matchRuleKeywords(
      intentLower,
      rule.regra,
    );

    if (ruleScore > bestScore) {
      bestScore = ruleScore;
      bestResult = {
        rule,
        keyword: matchedKeyword,
        score: ruleScore,
      };
    }
  }

  if (bestResult && bestResult.score >= 0.3) {
    return bestResult;
  }

  return null;
}

/**
 * Helper: match keywords within a single rule string.
 * Parses space-separated keywords, supports "keyword:weight" format.
 */
function matchRuleKeywords(
  intentLower: string,
  ruleStr: string,
): { score: number; matchedKeyword: string } {
  const keywordSpecs = ruleStr
    .toLowerCase()
    .split(/[|\s]+/)
    .filter(k => k.length > 0);
  let totalWeight = 0;
  let matchedWeight = 0;
  let bestMatchedKeyword = '';

  for (const spec of keywordSpecs) {
    const colonIdx = spec.lastIndexOf(':');
    let keyword: string;
    let weight = 1.0;

    if (colonIdx > 0) {
      keyword = spec.substring(0, colonIdx);
      const parsed = parseFloat(spec.substring(colonIdx + 1));
      if (!isNaN(parsed) && parsed > 0) {
        weight = parsed;
      }
    } else {
      keyword = spec;
    }

    totalWeight += weight;

    if (intentLower.includes(keyword)) {
      matchedWeight += weight;
      if (keyword.length > bestMatchedKeyword.length) {
        bestMatchedKeyword = keyword;
      }
    } else if (checkPartialWordBoundary(intentLower, keyword)) {
      // Partial word boundary match: 0.5x boost
      matchedWeight += weight * 0.5;
      if (keyword.length > bestMatchedKeyword.length) {
        bestMatchedKeyword = keyword;
      }
    }
  }

  const score = totalWeight > 0 ? matchedWeight / totalWeight : 0;
  return { score, matchedKeyword: bestMatchedKeyword };
}

/**
 * Partial word boundary: check if keyword appears as a prefix/suffix of
 * any word in the intent, or if at least 60% of the keyword characters
 * appear in order within a single word of the intent.
 */
function checkPartialWordBoundary(intent: string, keyword: string): boolean {
  if (keyword.length < 3) return false;

  const words = intent.split(/\s+/);
  for (const word of words) {
    // Prefix match: keyword is start of word
    if (word.length >= keyword.length && word.startsWith(keyword)) {
      return true;
    }
    // Suffix match: keyword is end of word
    if (word.length >= keyword.length && word.endsWith(keyword)) {
      return true;
    }
    // Substring with >= 60% of keyword chars matching
    if (keyword.length <= word.length) {
      let matchCount = 0;
      let wi = 0;
      for (let ki = 0; ki < keyword.length; ki++) {
        const idx = word.indexOf(keyword[ki], wi);
        if (idx !== -1) {
          matchCount++;
          wi = idx + 1;
        }
      }
      if (matchCount / keyword.length >= 0.6) {
        return true;
      }
    }
  }
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. computeMCDMScores — PROMETHEE II: "Intuicao Direcionada"
//
//    6 criterios: custo, latencia, qualidade, contexto, disponibilidade, estabilidade
//    - custo & latencia: MENOR e melhor (diff invertido)
//    - qualidade, contexto, disponibilidade, estabilidade: MAIOR e melhor
//    - Funcao de preferencia Tipo V (linear):
//        Se |diff| > threshold => p = 1
//        Senao => p = |diff| / threshold
//    - phi_positivo[a] = SUM_b SUM_j ( w_j * p_j(a,b) )
//    - phi_negativo[a] = SUM_b SUM_j ( w_j * p_j(b,a) )
//    - Net flow = phi_positivo - phi_negativo
//    - Ranking por net flow descendente
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_PROMETHEE_THRESHOLDS: Record<string, number> = {
  custo: 2.0,
  latencia: 300,
  qualidade: 0.15,
  contexto: 100000,
  disponibilidade: 0.3,
  estabilidade: 0.2,
};

const PROMETHEE_CRITERIA = [
  'custo',
  'latencia',
  'qualidade',
  'contexto',
  'disponibilidade',
  'estabilidade',
] as const;

/** Criteria where LOWER value is better */
const LOWER_IS_BETTER = new Set(['custo', 'latencia']);

function getCriterionValue(model: LiveLabModel, criterion: string): number {
  switch (criterion) {
    case 'custo':
      return (model.custo_por_1m_tokens.entrada_usd +
        model.custo_por_1m_tokens.saida_usd) / 2;
    case 'latencia':
      return model.latencia_media_ms;
    case 'qualidade':
      return model.qualidade_normalizada ?? 0.5;
    case 'contexto':
      return model.contexto_tokens;
    case 'disponibilidade':
      return model.peso_roteamento;
    case 'estabilidade':
      return model.is_local ? 1.0 : 0.7 + (model.qualidade_normalizada ?? 0.5) * 0.3;
    default:
      return 0;
  }
}

function preferenceFunctionTypeV(
  diff: number,
  threshold: number,
): number {
  const absDiff = Math.abs(diff);
  if (absDiff >= threshold) return 1.0;
  return absDiff / threshold;
}

export function computeMCDMScores(
  candidates: LiveLabModel[],
  pesos: Record<string, number>,
  thresholds?: Record<string, number>,
): MCDMScore[] {
  if (candidates.length === 0) return [];

  const t = { ...DEFAULT_PROMETHEE_THRESHOLDS, ...thresholds };
  const n = candidates.length;

  // Compute raw criterion values for each candidate
  const rawValues: Record<string, number[]> = {};
  for (const crit of PROMETHEE_CRITERIA) {
    rawValues[crit] = candidates.map((m) => getCriterionValue(m, crit));
  }

  // Normalize each criterion to [0, 1] for display in detalhes
  const normValues: Record<string, number[]> = {};
  for (const crit of PROMETHEE_CRITERIA) {
    if (LOWER_IS_BETTER.has(crit)) {
      // For lower-is-better, invert before normalizing so higher norm = better
      const maxVal = Math.max(...rawValues[crit]);
      const inverted = rawValues[crit].map((v) => (maxVal > 0 ? maxVal - v : 0));
      normValues[crit] = minMaxNormalize(inverted);
    } else {
      normValues[crit] = minMaxNormalize(rawValues[crit]);
    }
  }

  // PROMETHEE II: compute phi_positivo and phi_negativo for each candidate
  const phiPos: number[] = new Array(n).fill(0);
  const phiNeg: number[] = new Array(n).fill(0);

  for (let a = 0; a < n; a++) {
    for (let b = 0; b < n; b++) {
      if (a === b) continue;

      for (const crit of PROMETHEE_CRITERIA) {
        const weight = pesos[crit] ?? 0;
        if (weight === 0) continue;

        const valA = rawValues[crit][a];
        const valB = rawValues[crit][b];
        const threshold = t[crit] ?? 1;

        // diff = performance advantage of a over b
        let diff: number;
        if (LOWER_IS_BETTER.has(crit)) {
          // Lower is better: a is better if valA < valB
          // diff = valB - valA (positive when a is better)
          diff = valB - valA;
        } else {
          // Higher is better: a is better if valA > valB
          diff = valA - valB;
        }

        const p = preferenceFunctionTypeV(diff, threshold);

        // phi_positivo: how much a outranks b
        phiPos[a] += weight * p;

        // phi_negativo: how much b outranks a
        phiNeg[a] += weight * preferenceFunctionTypeV(-diff, threshold);
      }
    }
  }

  // Compute net flow and rank
  const netFlows = candidates.map((_, i) => phiPos[i] - phiNeg[i]);

  // Create indices sorted by net flow descending
  const rankedIndices = Array.from({ length: n }, (_, i) => i)
    .sort((a, b) => netFlows[b] - netFlows[a]);

  // Assign ranks (ties share the same rank)
  const ranks = new Array(n).fill(0);
  let currentRank = 1;
  for (let i = 0; i < rankedIndices.length; i++) {
    if (i > 0 && netFlows[rankedIndices[i]] < netFlows[rankedIndices[i - 1]]) {
      currentRank = i + 1;
    }
    ranks[rankedIndices[i]] = currentRank;
  }

  // Build MCDMScore array in ranked order
  return rankedIndices.map((idx) => ({
    modelo_id: candidates[idx].id,
    score_total: Math.round(netFlows[idx] * 1000) / 1000,
    rank: ranks[idx],
    phi_positivo: Math.round(phiPos[idx] * 1000) / 1000,
    phi_negativo: Math.round(phiNeg[idx] * 1000) / 1000,
    detalhes: {
      custo_norm: Math.round(normValues['custo'][idx] * 1000) / 1000,
      latencia_norm: Math.round(normValues['latencia'][idx] * 1000) / 1000,
      qualidade_norm: Math.round(normValues['qualidade'][idx] * 1000) / 1000,
      contexto_norm: Math.round(normValues['contexto'][idx] * 1000) / 1000,
      disponibilidade_norm:
        Math.round(normValues['disponibilidade'][idx] * 1000) / 1000,
      estabilidade_norm:
        Math.round(normValues['estabilidade'][idx] * 1000) / 1000,
    },
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. routeIntent — Orquestracao de roteamento em 4 fases
//    Fase 1: cascadeMatch para determinar intencoes especificas
//    Fase 2: construir lista de candidatos (primario, fallbacks, outros)
//    Fase 3: scoring MCDM PROMETHEE sobre os candidatos
//    Fase 4: selecionar o melhor dentro da restricao de latencia
// ─────────────────────────────────────────────────────────────────────────────

export function routeIntent(
  intent: string,
  modelos: LiveLabModel[],
  algo: AlgoritmoRoteamento,
): RoutingResult {
  // Phase 1: Cascade matching
  const cascadeResult = cascadeMatch(intent, algo.cascata);

  // Phase 2: Build candidate list
  const primaryIds = new Set<string>();
  const fallbackIds = new Set<string>();

  if (cascadeResult) {
    primaryIds.add(cascadeResult.rule.modelo_primario);
    if (cascadeResult.rule.fallback) {
      for (const fb of cascadeResult.rule.fallback) {
        fallbackIds.add(fb);
      }
    }
  }

  // Filter to models we actually have
  const primaryCandidates = modelos.filter((m) => primaryIds.has(m.id));
  const fallbackCandidates = modelos.filter(
    (m) => fallbackIds.has(m.id) && !primaryIds.has(m.id),
  );
  const otherCandidates = modelos.filter(
    (m) => !primaryIds.has(m.id) && !fallbackIds.has(m.id),
  );

  // Combine: primary first, then fallbacks, then others
  const candidates = [
    ...primaryCandidates,
    ...fallbackCandidates,
    ...otherCandidates,
  ];

  // If no candidates, return a fallback result with first available model
  if (candidates.length === 0) {
    return {
      agente: 'agentica-ai',
      intencao: intent,
      modelo_selecionado: 'unknown',
      provedor: 'unknown',
      score_mcdm: {
        modelo_id: 'unknown',
        score_total: 0,
        rank: 1,
        phi_positivo: 0,
        phi_negativo: 0,
        detalhes: {
          custo_norm: 0,
          latencia_norm: 0,
          qualidade_norm: 0,
          contexto_norm: 0,
          disponibilidade_norm: 0,
          estabilidade_norm: 0,
        },
      },
      latencia_estimada_ms: 0,
      custo_estimado_usd: 0,
      is_local: false,
      cascade_match: cascadeResult ? cascadeResult.keyword : null,
      timestamp: new Date().toISOString(),
    };
  }

  // Phase 3: MCDM scoring
  const scores = computeMCDMScores(
    candidates,
    algo.pesos_mcdm,
    algo.promethee_thresholds,
  );

  // Phase 4: Pick top within latency constraint
  const maxLatency = cascadeResult?.rule.latencia_maxima_ms ?? Infinity;

  let selected: MCDMScore | null = null;
  let selectedModel: LiveLabModel | null = null;

  for (const score of scores) {
    const model = candidates.find((m) => m.id === score.modelo_id);
    if (!model) continue;

    if (model.latencia_media_ms <= maxLatency) {
      selected = score;
      selectedModel = model;
      break; // Already ranked by net flow descending
    }

    // Keep first candidate as fallback even if over latency
    if (!selected) {
      selected = score;
      selectedModel = model;
    }
  }

  if (!selected || !selectedModel) {
    // Should never happen, but safety fallback
    selectedModel = candidates[0];
    selected = scores[0];
  }

  // Estimate cost (average of input + output per 1M tokens)
  const estimatedCost =
    (selectedModel.custo_por_1m_tokens.entrada_usd +
      selectedModel.custo_por_1m_tokens.saida_usd) /
    2;

  return {
    agente: 'agentica-ai',
    intencao: intent,
    modelo_selecionado: selectedModel.id,
    provedor: selectedModel.provedor,
    score_mcdm: selected,
    latencia_estimada_ms: selectedModel.latencia_media_ms,
    custo_estimado_usd: estimatedCost,
    is_local: selectedModel.is_local ?? false,
    cascade_match: cascadeResult ? cascadeResult.keyword : null,
    timestamp: new Date().toISOString(),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. matchSkill — "Caminho do Discipulo": Melhor skill por overlap de palavras
//    Primeiro criterio: maior quantidade de palavras-chave coincidentes
//    Segundo criterio (desempate): melhor eficiencia de tokens
// ─────────────────────────────────────────────────────────────────────────────

export function matchSkill(
  intent: string,
  skills: Skill[],
): Skill | null {
  if (skills.length === 0) return null;

  const intentWords = new Set(
    intent.toLowerCase().split(/\s+/).filter((w) => w.length > 1),
  );

  let bestSkill: Skill | null = null;
  let bestOverlap = -1;
  let bestTokenEfficiency = Infinity;

  for (const skill of skills) {
    // Combine trigger, nome, dominio, descricao, and rbac_permissoes for matching
    const matchText = [
      skill.trigger,
      skill.nome,
      skill.dominio,
      skill.descricao ?? '',
      ...skill.rbac_permissoes,
    ]
      .join(' ')
      .toLowerCase();

    const skillWords = new Set(
      matchText.split(/\s+/).filter((w) => w.length > 1),
    );

    let overlap = 0;
    for (const word of intentWords) {
      if (skillWords.has(word)) {
        overlap++;
      } else if (checkPartialWordBoundary(matchText, word)) {
        overlap += 0.5;
      }
    }

    const tokenEfficiency = skill.tokens_estimados ?? 1000;

    if (
      overlap > bestOverlap ||
      (overlap === bestOverlap && tokenEfficiency < bestTokenEfficiency)
    ) {
      bestOverlap = overlap;
      bestTokenEfficiency = tokenEfficiency;
      bestSkill = skill;
    }
  }

  return bestSkill && bestOverlap > 0 ? bestSkill : null;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. composeMetaSkill — Composicao de meta-skill com grafo de dependencias
//    Sequencial: ordenacao topologica (respeita ordem_execucao)
//    Paralelo: todas no mesmo grupo (grupo 0)
//    Detecta ciclos no grafo
// ─────────────────────────────────────────────────────────────────────────────

export function composeMetaSkill(
  metaSkill: MetaSkill,
  allSkills: Skill[],
): SkillCompositionPlan {
  const { skills_compostas, ordem_execucao } = metaSkill;

  // Build a lookup map for skills
  const skillMap = new Map<string, Skill>();
  for (const s of allSkills) {
    skillMap.set(s.id, s);
  }

  // Filter to only skills that exist and are part of this meta-skill
  const availableSkills = skills_compostas.filter((id) => skillMap.has(id));

  if (availableSkills.length === 0) {
    return {
      orderedSkills: [],
      hasCycle: false,
      executionPlan: [],
    };
  }

  // Build adjacency list for dependency graph
  // For sequential: each skill depends on the previous one in the list
  // For parallel: no dependencies
  const adj: Map<string, string[]> = new Map(); // node -> dependencies (nodes it depends on)
  for (const id of availableSkills) {
    adj.set(id, []);
  }

  if (ordem_execucao === 'sequencial') {
    for (let i = 1; i < availableSkills.length; i++) {
      const curr = availableSkills[i - 1];
      const prev = availableSkills[i + 1];
      // prev depends on curr (prev precisa esperar curr terminar)
      const deps = adj.get(prev);
      if (deps) {
        deps.push(curr);
      }
    }
  }
  // Parallel: no edges added, all nodes are independent

  // Detect cycles using DFS
  const hasCycle = detectCycle(adj);

  if (hasCycle) {
    // Return ordered skills as-is when cycle detected
    return {
      orderedSkills: availableSkills,
      hasCycle: true,
      executionPlan: availableSkills.map((id, idx) => ({
        skillId: id,
        order: idx,
        parallelGroup: idx,
      })),
    };
  }

  // Topological sort for sequential, or simple grouping for parallel
  if (ordem_execucao === 'paralelo') {
    const executionPlan = availableSkills.map((id, idx) => ({
      skillId: id,
      order: 0,
      parallelGroup: 0,
    }));
    return {
      orderedSkills: availableSkills,
      hasCycle: false,
      executionPlan,
    };
  }

  // Sequential: topological sort
  const sorted = topologicalSort(adj);
  const executionPlan = sorted.map((id, order) => ({
    skillId: id,
    order,
    parallelGroup: order,
  }));

  return {
    orderedSkills: sorted,
    hasCycle: false,
    executionPlan,
  };
}

/**
 * Detect cycle in directed graph using DFS with three states.
 */
function detectCycle(adj: Map<string, string[]>): boolean {
  const WHITE = 0;
  const GRAY = 1;
  const BLACK = 2;
  const color = new Map<string, number>();

  for (const node of adj.keys()) {
    color.set(node, WHITE);
  }

  function dfs(node: string): boolean {
    color.set(node, GRAY);
    const neighbors = adj.get(node) ?? [];
    for (const neighbor of neighbors) {
      const c = color.get(neighbor) ?? WHITE;
      if (c === GRAY) return true;
      if (c === WHITE && dfs(neighbor)) return true;
    }
    color.set(node, BLACK);
    return false;
  }

  for (const node of adj.keys()) {
    if (color.get(node) === WHITE) {
      if (dfs(node)) return true;
    }
  }
  return false;
}

/**
 * Kahn's algorithm for topological sort.
 */
function topologicalSort(adj: Map<string, string[]>): string[] {
  const inDegree = new Map<string, number>();
  const allNodes = Array.from(adj.keys());

  // In-degree = number of dependencies this node has
  for (const node of allNodes) {
    const deps = adj.get(node) ?? [];
    inDegree.set(node, deps.length);
  }

  // Queue of nodes with no dependencies (in-degree = 0)
  const queue: string[] = [];
  for (const node of allNodes) {
    if ((inDegree.get(node) ?? 0) === 0) {
      queue.push(node);
    }
  }

  const sorted: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift()!;
    sorted.push(node);

    // For each node that depends on this node
    for (const other of allNodes) {
      const deps = adj.get(other) ?? [];
      if (deps.includes(node)) {
        const newDeg = (inDegree.get(other) ?? 1) - 1;
        inDegree.set(other, newDeg);
        if (newDeg === 0) {
          queue.push(other);
        }
      }
    }
  }

  return sorted;
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. TokenBucket — "Equilibrio de Forcas"
//    Controle de fluxo com burst allowance e consumo prioritario.
//    Prioridade 5 pode ir negativo ate -burstAllowance.
//    Consumo normal segue algoritmo padrao de token bucket.
// ─────────────────────────────────────────────────────────────────────────────

export class TokenBucket {
  private buckets: Map<string, TokenBucketState> = new Map();
  private burstAllowance: number;
  private readonly refillRatePerMs: number;
  private readonly maxTokens: number;

  /**
   * @param maxTokens Maximum token count per bucket
   * @param refillRatePerMs Tokens refilled per millisecond (e.g., 10/1000 = 10 per second)
   * @param burstAllowance How many negative tokens priority-5 can consume (default 5)
   */
  constructor(
    maxTokens: number,
    refillRatePerMs: number,
    burstAllowance = 5,
  ) {
    this.maxTokens = maxTokens;
    this.refillRatePerMs = refillRatePerMs;
    this.burstAllowance = burstAllowance;
  }

  /** Refill tokens based on elapsed time */
  private refill(key: string): void {
    const state = this.buckets.get(key);
    if (!state) return;

    const now = Date.now();
    const elapsed = now - state.last_refill;
    const tokensToAdd = elapsed * this.refillRatePerMs;

    state.tokens = Math.min(this.maxTokens, state.tokens + tokensToAdd);
    state.last_refill = now;
  }

  /** Get or create bucket state */
  private getOrCreate(key: string): TokenBucketState {
    if (!this.buckets.has(key)) {
      this.buckets.set(key, {
        tokens: this.maxTokens,
        last_refill: Date.now(),
      });
    }
    return this.buckets.get(key)!;
  }

  /** Standard consume: returns true if tokens were available */
  consume(key: string, amount = 1): boolean {
    this.refill(key);
    const state = this.getOrCreate(key);

    if (state.tokens >= amount) {
      state.tokens -= amount;
      return true;
    }
    return false;
  }

  /**
   * Priority consume: priority 1 (low) to 5 (critical).
   * Priority 5 can burst into negative tokens up to -burstAllowance.
   * Lower priorities have stricter requirements:
   *   - Priority 1-2: require full amount
   *   - Priority 3: can borrow up to 1 token
   *   - Priority 4: can borrow up to burstAllowance / 2 tokens
   *   - Priority 5: can borrow up to burstAllowance tokens
   */
  priorityConsume(key: string, amount = 1, priority = 1): boolean {
    this.refill(key);
    const state = this.getOrCreate(key);

    if (state.tokens >= amount) {
      state.tokens -= amount;
      return true;
    }

    // Calculate borrow limit based on priority
    let borrowLimit = 0;
    switch (priority) {
      case 5:
        borrowLimit = this.burstAllowance;
        break;
      case 4:
        borrowLimit = Math.floor(this.burstAllowance / 2);
        break;
      case 3:
        borrowLimit = 1;
        break;
      default:
        borrowLimit = 0;
    }

    const deficit = amount - state.tokens;
    if (deficit <= borrowLimit) {
      state.tokens -= amount; // Go negative
      return true;
    }

    return false;
  }

  /** Get current token count */
  getTokens(key: string): number {
    this.refill(key);
    return this.buckets.get(key)?.tokens ?? this.maxTokens;
  }

  /** Get full state snapshot */
  getState(key: string): TokenBucketState {
    this.refill(key);
    return (
      this.buckets.get(key) ?? {
        tokens: this.maxTokens,
        last_refill: Date.now(),
      }
    );
  }

  /** Reset a bucket to full */
  reset(key: string): void {
    this.buckets.set(key, {
      tokens: this.maxTokens,
      last_refill: Date.now(),
    });
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. BudgetTracker — "Dharma do Recurso"
//    Rastreamento de uso com projecao de exaustao e recomendacoes.
// ─────────────────────────────────────────────────────────────────────────────

export class BudgetTracker {
  private budgets: Map<string, BudgetState> = new Map();
  private usageHistory: Map<string, Array<{ amount: number; date: Date }>> =
    new Map();

  /** Record usage in USD */
  recordUsage(personaId: string, amountUsd: number): void {
    const state = this.getOrCreate(personaId);
    state.usado_usd += amountUsd;

    // Check alert thresholds
    const pctUsed = amountUsd > 0 ? 1 : 0; // We need the limit to compute pct
    // Alerts are checked relative to the limit when getForecast is called

    if (!this.usageHistory.has(personaId)) {
      this.usageHistory.set(personaId, []);
    }
    this.usageHistory.get(personaId)!.push({
      amount: amountUsd,
      date: new Date(),
    });
  }

  /** Get current usage state */
  getUsage(personaId: string): BudgetState {
    return this.getOrCreate(personaId);
  }

  /**
   * Forecast: project if budget will exhaust based on current spending pattern.
   * Analyzes recent usage history to compute daily average, then projects forward.
   */
  getForecast(
    personaId: string,
    limitUsd: number,
    daysRemaining: number,
  ): BudgetForecast {
    const state = this.getOrCreate(personaId);
    const history = this.usageHistory.get(personaId) ?? [];

    const usedSoFar = state.usado_usd;
    const remaining = limitUsd - usedSoFar;
    const pctUsed = limitUsd > 0 ? usedSoFar / limitUsd : 0;

    // Check alert thresholds
    if (pctUsed >= 0.95 && !state.alerta_95_fired) {
      state.alerta_95_fired = true;
    }
    if (pctUsed >= 0.8 && !state.alerta_80_fired) {
      state.alerta_80_fired = true;
    }
    if (pctUsed >= 0.5 && !state.alerta_50_fired) {
      state.alerta_50_fired = true;
    }

    // Compute daily average from history
    let dailyAvg = 0;
    if (history.length > 0) {
      const now = new Date();
      const oldest = history[0].date;
      const daysElapsed = Math.max(
        1,
        (now.getTime() - oldest.getTime()) / (1000 * 60 * 60 * 24),
      );
      dailyAvg = usedSoFar / daysElapsed;
    }

    // Project exhaustion
    let daysUntilExhaustion: number | null = null;
    let willExhaust = false;

    if (dailyAvg > 0 && remaining > 0) {
      daysUntilExhaustion = Math.floor(remaining / dailyAvg);
      willExhaust = daysUntilExhaustion < daysRemaining;
    } else if (remaining <= 0) {
      willExhaust = true;
      daysUntilExhaustion = 0;
    } else if (dailyAvg === 0) {
      willExhaust = false;
    }

    // Generate recommendation
    let recommendation: string;
    if (remaining <= 0) {
      recommendation =
        '⚠️ Orcamento esgotado. Reduza imediatamente o uso ou solicite aumento do limite.';
    } else if (willExhaust) {
      const daysOver = (daysUntilExhaustion ?? 0) - daysRemaining;
      recommendation =
        `⚡ Orcamento projetado para exaurir em ${daysUntilExhaustion} dias, ` +
        `${Math.abs(daysOver)} dias antes do fim do periodo. ` +
        'Considere reduzir o uso de modelos premium ou habilitar fallbacks locais.';
    } else if (pctUsed >= 0.8) {
      recommendation =
        '🔵 Orcamento acima de 80%. Monitore de perto e priorize modelos de menor custo.';
    } else if (pctUsed >= 0.5) {
      recommendation =
        '🟡 Orcamento acima de 50%. Mantenha consumo moderado para o restante do periodo.';
    } else {
      recommendation =
        '🟢 Orcamento saudavel. Uso dentro dos parametros esperados.';
    }

    return {
      willExhaust,
      projectedDailyAvg: Math.round(dailyAvg * 100) / 100,
      daysUntilExhaustion,
      recommendation,
    };
  }

  /** Reset monthly budget for a persona */
  resetMonth(personaId: string): void {
    this.budgets.set(personaId, {
      usado_usd: 0,
      alerta_50_fired: false,
      alerta_80_fired: false,
      alerta_95_fired: false,
    });
    this.usageHistory.set(personaId, []);
  }

  private getOrCreate(personaId: string): BudgetState {
    if (!this.budgets.has(personaId)) {
      this.budgets.set(personaId, {
        usado_usd: 0,
        alerta_50_fired: false,
        alerta_80_fired: false,
        alerta_95_fired: false,
      });
    }
    return this.budgets.get(personaId)!;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// 9. maskPII — "Santuario Interior": Mascaramento simples com regex
//    Substitui ocorrencias por [REDACTED].
// ─────────────────────────────────────────────────────────────────────────────

export function maskPII(text: string, patterns: string[]): string {
  let masked = text;
  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, 'gi');
      masked = masked.replace(regex, '[REDACTED]');
    } catch {
      // Invalid regex, skip
    }
  }
  return masked;
}

// ─────────────────────────────────────────────────────────────────────────────
// 10. maskPIIWithAudit — Mascaramento com registro de auditoria detalhado
//     Retorna texto mascarado + array de entradas PII detectadas com
//     tipo (baseado no indice do regex), posicao, valor original.
// ─────────────────────────────────────────────────────────────────────────────

const PII_TYPE_MAP: Record<number, string> = {
  0: 'email',
  1: 'cpf',
  2: 'telefone',
  3: 'cartao',
  4: 'outro',
};

export function maskPIIWithAudit(
  text: string,
  patterns: string[],
): PIIMaskResult {
  const detectedPii: PIIAuditEntry[] = [];
  let masked = text;
  let offset = 0; // Track character offset from previous replacements

  for (let patIdx = 0; patIdx < patterns.length; patIdx++) {
    const pattern = patterns[patIdx];
    try {
      const regex = new RegExp(pattern, 'gi');
      let match: RegExpExecArray | null;

      while ((match = regex.exec(text)) !== null) {
        const original = match[0];
        const position = match.index;
        const piiType = PII_TYPE_MAP[patIdx] ?? 'outro';

        detectedPii.push({
          type: piiType,
          position,
          original,
        });
      }
    } catch {
      // Invalid regex, skip
    }
  }

  // Apply masking (replace all at once from original text)
  for (const pattern of patterns) {
    try {
      const regex = new RegExp(pattern, 'gi');
      masked = masked.replace(regex, '[REDACTED]');
    } catch {
      // Invalid regex, skip
    }
  }

  // Sort by position
  detectedPii.sort((a, b) => a.position - b.position);

  void offset; // Used conceptually for offset tracking

  return {
    maskedText: masked,
    detectedPii,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// 11. rbacCheck — "Protecao Consciente": Verificacao de nivel RBAC
//    Compara indices no array de niveis. Acesso concedido se
//    o nivel da persona for >= ao nivel requerido.
// ─────────────────────────────────────────────────────────────────────────────

export function rbacCheck(
  personaLevel: string,
  requiredLevel: string,
  levels: string[],
): boolean {
  const personaIdx = levels.indexOf(personaLevel);
  const requiredIdx = levels.indexOf(requiredLevel);

  // If either level is not found, deny access
  if (personaIdx === -1 || requiredIdx === -1) {
    return false;
  }

  return personaIdx >= requiredIdx;
}
