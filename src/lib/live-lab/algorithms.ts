/**
 * LIVE LAB — Algorithms v2.0
 * Routing, scoring, rate-limiting, budget tracking, PII masking, RBAC
 */

import type {
  MCDMScore,
  LiveLabModel,
  Skill,
  TokenBucketState,
  BudgetState,
  RoutingResult,
} from './types';

// ---------------------------------------------------------------------------
// 1. cascadeMatch
// ---------------------------------------------------------------------------

export function cascadeMatch(
  intent: string,
  cascata: Array<{
    regra: string;
    modelo_primario: string;
    fallback?: string[];
    latencia_maxima_ms?: number;
  }>,
): { rule: typeof cascata[0]; keyword: string } | null {
  const lowered = intent.toLowerCase();
  for (const rule of cascata) {
    const keywords = rule.regra.split('|').map((k) => k.trim().toLowerCase());
    for (const kw of keywords) {
      if (kw && lowered.includes(kw)) {
        return { rule, keyword: kw };
      }
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// 2. minMaxNormalize
// ---------------------------------------------------------------------------

export function minMaxNormalize(values: number[]): number[] {
  if (values.length === 0) return [];
  if (values.length === 1) return [0.5];

  const min = Math.min(...values);
  const max = Math.max(...values);

  if (min === max) return values.map(() => 0.5);

  return values.map((v) => (v - min) / (max - min));
}

// ---------------------------------------------------------------------------
// 3. computeMCDMScores
// ---------------------------------------------------------------------------

export function computeMCDMScores(
  candidates: LiveLabModel[],
  pesos: Record<string, number>,
): MCDMScore[] {
  if (candidates.length === 0) return [];

  const custoRaw = candidates.map(
    (c) => (c.custo_por_1m_tokens.entrada_usd + c.custo_por_1m_tokens.saida_usd) / 2,
  );
  const latenciaRaw = candidates.map((c) => c.latencia_media_ms);
  const qualidadeRaw = candidates.map(
    (c) => c.qualidade_normalizada ?? 0.5,
  );
  const contextoRaw = candidates.map((c) => c.contexto_tokens);

  const custoNorm = minMaxNormalize(custoRaw);
  const latenciaNorm = minMaxNormalize(latenciaRaw);
  const qualidadeNorm = minMaxNormalize(qualidadeRaw);
  const contextoNorm = minMaxNormalize(contextoRaw);

  const scores: MCDMScore[] = candidates.map((c, i) => {
    const isLocal = c.is_local === true;
    const custo_n = 1 - custoNorm[i];
    const latencia_n = 1 - latenciaNorm[i];
    const qualidade_n = qualidadeNorm[i];
    const contexto_n = contextoNorm[i];
    const disponibilidade_n = isLocal ? 1.0 : 0.8;

    const score_total =
      custo_n * (pesos['custo'] ?? 0) +
      latencia_n * (pesos['latencia'] ?? 0) +
      qualidade_n * (pesos['qualidade'] ?? 0) +
      contexto_n * (pesos['contexto'] ?? 0) +
      disponibilidade_n * (pesos['disponibilidade'] ?? 0);

    return {
      modelo_id: c.id,
      score_total,
      rank: 0,
      detalhes: {
        custo_norm: custo_n,
        latencia_norm: latencia_n,
        qualidade_norm: qualidade_n,
        contexto_norm: contexto_n,
        disponibilidade_norm: disponibilidade_n,
      },
    };
  });

  scores.sort((a, b) => b.score_total - a.score_total);
  scores.forEach((s, i) => {
    s.rank = i + 1;
  });

  return scores;
}

// ---------------------------------------------------------------------------
// 4. routeIntent
// ---------------------------------------------------------------------------

export function routeIntent(
  intent: string,
  modelos: LiveLabModel[],
  algo: {
    tipo: string;
    cascata: Array<{
      regra: string;
      modelo_primario: string;
      fallback?: string[];
      latencia_maxima_ms?: number;
    }>;
    pesos_mcdm: Record<string, number>;
  },
): RoutingResult {
  // Phase 1 — cascade match
  const match = cascadeMatch(intent, algo.cascata);
  let candidates: LiveLabModel[] = [];
  let cascadeKeyword: string | null = null;
  let primaryModelId: string | null = null;

  if (match) {
    cascadeKeyword = match.keyword;
    primaryModelId = match.rule.modelo_primario;

    // Phase 2 — build candidate list: primary first, then fallbacks, then all others
    const fallbackIds = new Set(match.rule.fallback ?? []);
    const seen = new Set<string>();

    const primary = modelos.find((m) => m.id === primaryModelId);
    if (primary) {
      candidates.push(primary);
      seen.add(primary.id);
    }

    for (const fid of fallbackIds) {
      const fb = modelos.find((m) => m.id === fid && !seen.has(m.id));
      if (fb) {
        candidates.push(fb);
        seen.add(fb.id);
      }
    }

    for (const m of modelos) {
      if (!seen.has(m.id)) {
        candidates.push(m);
        seen.add(m.id);
      }
    }
  } else {
    candidates = [...modelos];
  }

  // Phase 3 — MCDM scoring
  const scores = computeMCDMScores(candidates, algo.pesos_mcdm);

  // Phase 4 — pick top within latency constraint
  const maxLat = match?.rule.latencia_maxima_ms ?? Infinity;
  let selected = scores[0];
  for (const s of scores) {
    const model = candidates.find((c) => c.id === s.modelo_id);
    if (model && model.latencia_media_ms <= maxLat) {
      selected = s;
      break;
    }
  }

  const selectedModel =
    candidates.find((c) => c.id === selected.modelo_id) ?? candidates[0];

  return {
    agente: selectedModel.id,
    intencao: intent,
    modelo_selecionado: selectedModel.id,
    provedor: selectedModel.provedor,
    score_mcdm: selected,
    latencia_estimada_ms: selectedModel.latencia_media_ms,
    custo_estimado_usd:
      (selectedModel.custo_por_1m_tokens.entrada_usd +
        selectedModel.custo_por_1m_tokens.saida_usd) /
      2,
    is_local: selectedModel.is_local === true,
    cascade_match: cascadeKeyword,
    timestamp: new Date().toISOString(),
  };
}

// ---------------------------------------------------------------------------
// 5. matchSkill
// ---------------------------------------------------------------------------

export function matchSkill(
  intent: string,
  skills: Array<{
    id: string;
    dominio: string;
    trigger: string;
    tokens_estimados?: number;
  }>,
): Skill | null {
  const intentLower = intent.toLowerCase();
  const intentWords = intentLower.split(/\s+/);

  let best: { skill: Skill; matches: number; tokens: number } | null = null;

  for (const s of skills) {
    const keywords = s.trigger
      .split('|')
      .map((k) => k.trim().toLowerCase());
    let matches = 0;
    for (const kw of keywords) {
      if (!kw) continue;
      if (intentLower.includes(kw)) {
        matches++;
      } else {
        for (const w of intentWords) {
          if (w === kw || w.includes(kw) || kw.includes(w)) {
            matches++;
            break;
          }
        }
      }
    }
    if (matches >= 1) {
      if (
        !best ||
        matches > best.matches ||
        (matches === best.matches && (s.tokens_estimados ?? Infinity) < best.tokens)
      ) {
        best = {
          skill: s as unknown as Skill,
          matches,
          tokens: s.tokens_estimados ?? Infinity,
        };
      }
    }
  }

  return best ? best.skill : null;
}

// ---------------------------------------------------------------------------
// 6. TokenBucket
// ---------------------------------------------------------------------------

export class TokenBucket {
  private state: Map<string, TokenBucketState> = new Map();

  constructor(private refillRateMs: number = 6000) {}

  consume(
    key: string,
    limit: number,
  ): { allowed: boolean; remaining: number; resetMs: number } {
    const now = Date.now();
    let bucket = this.state.get(key);

    if (!bucket) {
      bucket = { tokens: limit, last_refill: now };
      this.state.set(key, bucket);
    }

    // Refill based on elapsed time
    const elapsed = now - bucket.last_refill;
    const refillCount = Math.floor(elapsed / this.refillRateMs);
    if (refillCount > 0) {
      bucket.tokens = Math.min(limit, bucket.tokens + refillCount);
      bucket.last_refill = now;
    }

    if (bucket.tokens >= 1) {
      bucket.tokens -= 1;
      return {
        allowed: true,
        remaining: bucket.tokens,
        resetMs: this.refillRateMs,
      };
    }

    return {
      allowed: false,
      remaining: 0,
      resetMs: this.refillRateMs - (elapsed % this.refillRateMs),
    };
  }

  getState(key: string): TokenBucketState | null {
    const s = this.state.get(key);
    if (!s) return null;
    return { tokens: s.tokens, last_refill: s.last_refill };
  }
}

// ---------------------------------------------------------------------------
// 7. BudgetTracker
// ---------------------------------------------------------------------------

export class BudgetTracker {
  private budgets: Map<string, BudgetState> = new Map();

  recordUsage(
    personaId: string,
    costUsd: number,
    limitUsd: number,
  ): { remaining: number; pctUsed: number; alerts: string[] } {
    let budget = this.budgets.get(personaId);
    if (!budget) {
      budget = {
        usado_usd: 0,
        alerta_50_fired: false,
        alerta_80_fired: false,
        alerta_95_fired: false,
      };
      this.budgets.set(personaId, budget);
    }

    budget.usado_usd += costUsd;
    const pctUsed = limitUsd > 0 ? (budget.usado_usd / limitUsd) * 100 : 0;
    const remaining = Math.max(0, limitUsd - budget.usado_usd);
    const alerts: string[] = [];

    if (pctUsed >= 50 && !budget.alerta_50_fired) {
      budget.alerta_50_fired = true;
      alerts.push('ALERTA_ORCAMENTO_50');
    }
    if (pctUsed >= 80 && !budget.alerta_80_fired) {
      budget.alerta_80_fired = true;
      alerts.push('ALERTA_ORCAMENTO_80');
    }
    if (pctUsed >= 95 && !budget.alerta_95_fired) {
      budget.alerta_95_fired = true;
      alerts.push('ALERTA_ORCAMENTO_95');
    }

    return { remaining, pctUsed, alerts };
  }

  getUsage(personaId: string): BudgetState | null {
    const b = this.budgets.get(personaId);
    if (!b) return null;
    return { ...b };
  }
}

// ---------------------------------------------------------------------------
// 8. maskPII
// ---------------------------------------------------------------------------

export function maskPII(text: string, patterns: string[]): string {
  let result = text;
  for (const p of patterns) {
    result = result.replace(new RegExp(p, 'g'), '[REDACTED]');
  }
  return result;
}

// ---------------------------------------------------------------------------
// 9. rbacCheck
// ---------------------------------------------------------------------------

export function rbacCheck(
  personaLevel: string,
  requiredLevel: string,
  levels: string[],
): boolean {
  const personaIdx = levels.indexOf(personaLevel);
  const requiredIdx = levels.indexOf(requiredLevel);
  if (personaIdx === -1 || requiredIdx === -1) return false;
  return personaIdx >= requiredIdx;
}
