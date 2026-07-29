/**
 * CHIMERA — Routing Evaluator
 *
 * Evaluates routing quality against ground truth data.
 * Computes Accuracy@1, Accuracy@3, MRR, per-model/per-intent-type accuracy,
 * cost efficiency, and cascade hit rate. Supports A/B testing of weight variants.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface GroundTruthEntry {
  intent: string;
  expectedModel: string;
  expectedProvider?: string;
  intentType?: string; // coarse category
}

export interface RoutingEvalResult {
  accuracyAt1: number;   // % where top-1 match
  accuracyAt3: number;   // % where top-3 match
  mrr: number;           // Mean Reciprocal Rank
  totalSamples: number;
  perModelAccuracy: Record<string, { correct: number; total: number; accuracy: number }>;
  perIntentTypeAccuracy: Record<string, { correct: number; total: number; accuracy: number }>;
  costEfficiency: { totalEstimatedCost: number; avgCostPerQuery: number };
  cascadeHitRate: number; // % routed via cascade vs MCDM fallback
}

export interface RouteResult {
  modelo_selecionado: string;
  provedor: string;
  cascade_match: string | null;
  custo_estimado_usd: number;
  score_mcdm: { rank: number; score_total: number };
  allRanked?: Array<{ modelo_id: string; rank: number }>;
}

// ─────────────────────────────────────────────────────────────────────────────
// RoutingEvaluator
// ─────────────────────────────────────────────────────────────────────────────

export class RoutingEvaluator {
  private groundTruth: GroundTruthEntry[];
  private abTestVariants: Map<string, { weights: Record<string, number>; samples: number }>;

  constructor() {
    this.groundTruth = [];
    this.abTestVariants = new Map();
  }

  // Add ground truth entries (for evaluation dataset)
  addGroundTruth(entries: GroundTruthEntry[]): void {
    this.groundTruth.push(...entries);
  }

  // Run evaluation against current routing
  evaluate(
    routeFn: (intent: string) => RouteResult,
  ): RoutingEvalResult {
    if (this.groundTruth.length === 0) {
      return this.emptyResult();
    }

    let correctAt1 = 0;
    let correctAt3 = 0;
    let reciprocalRankSum = 0;
    let totalCost = 0;
    let cascadeHits = 0;

    const perModelCounts: Record<string, { correct: number; total: number }> = {};
    const perIntentTypeCounts: Record<string, { correct: number; total: number }> = {};

    for (const entry of this.groundTruth) {
      const result = routeFn(entry.intent);
      const expected = entry.expectedModel;
      const selected = result.modelo_selecionado;
      const intentType = entry.intentType ?? 'general';

      // Ensure counters exist
      if (!perModelCounts[expected]) perModelCounts[expected] = { correct: 0, total: 0 };
      perModelCounts[expected].total++;

      if (!perIntentTypeCounts[intentType]) perIntentTypeCounts[intentType] = { correct: 0, total: 0 };
      perIntentTypeCounts[intentType].total++;

      // Accuracy@1
      const isTop1 = selected === expected;
      if (isTop1) {
        correctAt1++;
        perModelCounts[expected].correct++;
        perIntentTypeCounts[intentType].correct++;
      }

      // Accuracy@3
      const isTop3 = result.allRanked && result.allRanked.length > 0
        ? result.allRanked.slice(0, 3).some(r => r.modelo_id === expected)
        : isTop1;
      if (isTop3) correctAt3++;

      // MRR
      if (result.allRanked && result.allRanked.length > 0) {
        const found = result.allRanked.find(r => r.modelo_id === expected);
        reciprocalRankSum += found ? 1 / found.rank : 0;
      } else {
        reciprocalRankSum += isTop1 ? 1 : 0;
      }

      // Cascade hit rate
      if (result.cascade_match !== null) cascadeHits++;

      // Cost
      totalCost += result.custo_estimado_usd;
    }

    const n = this.groundTruth.length;

    // Build perModelAccuracy
    const perModelAccuracy: Record<string, { correct: number; total: number; accuracy: number }> = {};
    for (const [model, counts] of Object.entries(perModelCounts)) {
      perModelAccuracy[model] = {
        correct: counts.correct,
        total: counts.total,
        accuracy: counts.total > 0 ? counts.correct / counts.total : 0,
      };
    }

    // Build perIntentTypeAccuracy
    const perIntentTypeAccuracy: Record<string, { correct: number; total: number; accuracy: number }> = {};
    for (const [type, counts] of Object.entries(perIntentTypeCounts)) {
      perIntentTypeAccuracy[type] = {
        correct: counts.correct,
        total: counts.total,
        accuracy: counts.total > 0 ? counts.correct / counts.total : 0,
      };
    }

    return {
      accuracyAt1: n > 0 ? correctAt1 / n : 0,
      accuracyAt3: n > 0 ? correctAt3 / n : 0,
      mrr: n > 0 ? reciprocalRankSum / n : 0,
      totalSamples: n,
      perModelAccuracy,
      perIntentTypeAccuracy,
      costEfficiency: {
        totalEstimatedCost: totalCost,
        avgCostPerQuery: n > 0 ? totalCost / n : 0,
      },
      cascadeHitRate: n > 0 ? cascadeHits / n : 0,
    };
  }

  // A/B test: register a variant with modified weights
  registerVariant(variantId: string, weights: Record<string, number>): void {
    this.abTestVariants.set(variantId, { weights, samples: 0 });
  }

  // Record which variant served a request
  recordVariantServing(variantId: string): void {
    const variant = this.abTestVariants.get(variantId);
    if (variant) {
      variant.samples++;
    }
  }

  // Get A/B test results
  getVariantStats(): Record<string, { samples: number; pctShare: number }> {
    const totalSamples = Array.from(this.abTestVariants.values()).reduce(
      (sum, v) => sum + v.samples, 0,
    );

    const stats: Record<string, { samples: number; pctShare: number }> = {};
    for (const [id, variant] of this.abTestVariants) {
      stats[id] = {
        samples: variant.samples,
        pctShare: totalSamples > 0 ? variant.samples / totalSamples : 0,
      };
    }
    return stats;
  }

  // Get built-in ground truth dataset (25 entries covering all cascade rules)
  getBuiltinGroundTruth(): GroundTruthEntry[] {
    return BUILTIN_GROUND_TRUTH;
  }

  private emptyResult(): RoutingEvalResult {
    return {
      accuracyAt1: 0,
      accuracyAt3: 0,
      mrr: 0,
      totalSamples: 0,
      perModelAccuracy: {},
      perIntentTypeAccuracy: {},
      costEfficiency: { totalEstimatedCost: 0, avgCostPerQuery: 0 },
      cascadeHitRate: 0,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Built-in Ground Truth (25 entries covering all 9 cascade rules)
// ─────────────────────────────────────────────────────────────────────────────

const BUILTIN_GROUND_TRUTH: GroundTruthEntry[] = [
  // Cascade Rule 1: codigo|programar|debug|refactor|code review → claude-4-sonnet
  {
    intent: 'revisar codigo',
    expectedModel: 'claude-4-sonnet',
    expectedProvider: 'Anthropic',
    intentType: 'code',
  },
  {
    intent: 'fazer code review deste pull request',
    expectedModel: 'claude-4-sonnet',
    expectedProvider: 'Anthropic',
    intentType: 'code',
  },
  {
    intent: 'programar uma API REST em TypeScript',
    expectedModel: 'claude-4-sonnet',
    expectedProvider: 'Anthropic',
    intentType: 'code',
  },
  {
    intent: 'debug esse erro de typescript',
    expectedModel: 'claude-4-sonnet',
    expectedProvider: 'Anthropic',
    intentType: 'code',
  },

  // Cascade Rule 2: matematica|calculo|prova|deduzir|formal → deepseek-r1
  {
    intent: 'calcular integral de x ao quadrado',
    expectedModel: 'deepseek-r1',
    expectedProvider: 'DeepSeek',
    intentType: 'math',
  },
  {
    intent: 'provar que a raiz de 2 e irracional',
    expectedModel: 'deepseek-r1',
    expectedProvider: 'DeepSeek',
    intentType: 'math',
  },
  {
    intent: 'deduzir a formula da distancia entre dois pontos',
    expectedModel: 'deepseek-r1',
    expectedProvider: 'DeepSeek',
    intentType: 'math',
  },

  // Cascade Rule 3: rapido|urgente|batch|etl|processar → llama-4-maverick
  {
    intent: 'resposta rapida para classificar este texto',
    expectedModel: 'llama-4-maverick',
    expectedProvider: 'Meta / Groq',
    intentType: 'fast',
  },
  {
    intent: 'processar batch de 1000 registros',
    expectedModel: 'llama-4-maverick',
    expectedProvider: 'Meta / Groq',
    intentType: 'fast',
  },
  {
    intent: 'etl urgente para transformar dados',
    expectedModel: 'llama-4-maverick',
    expectedProvider: 'Meta / Groq',
    intentType: 'fast',
  },

  // Cascade Rule 4: documento longo|repo completo|ingestao|arquivo grande → gemini-2.5-pro
  {
    intent: 'analisar documento longo de 500 paginas',
    expectedModel: 'gemini-2.5-pro',
    expectedProvider: 'Google',
    intentType: 'long-doc',
  },
  {
    intent: 'ingestao de repo completo com 200 arquivos',
    expectedModel: 'gemini-2.5-pro',
    expectedProvider: 'Google',
    intentType: 'long-doc',
  },

  // Cascade Rule 5: multimodal|imagem|video|audio|vision → gpt-4o
  {
    intent: 'gerar imagem a partir de descricao',
    expectedModel: 'gpt-4o',
    expectedProvider: 'OpenAI',
    intentType: 'multimodal',
  },
  {
    intent: 'analisar video de 5 minutos',
    expectedModel: 'gpt-4o',
    expectedProvider: 'OpenAI',
    intentType: 'multimodal',
  },
  {
    intent: 'transcrever audio e resumir',
    expectedModel: 'gpt-4o',
    expectedProvider: 'OpenAI',
    intentType: 'multimodal',
  },

  // Cascade Rule 6: multilingue|traduzir|idioma|internacional → mistral-large-2
  {
    intent: 'traduzir texto do portugues para japones',
    expectedModel: 'mistral-large-2',
    expectedProvider: 'Mistral AI',
    intentType: 'multilingual',
  },
  {
    intent: 'gerar conteudo em 5 idiomas diferentes',
    expectedModel: 'mistral-large-2',
    expectedProvider: 'Mistral AI',
    intentType: 'multilingual',
  },

  // Cascade Rule 7: gerar codigo|autocompletar|sintaxe|codegen → codegeex4-9b
  {
    intent: 'gerar codigo python para web scraper',
    expectedModel: 'codegeex4-9b',
    expectedProvider: 'CodeGeeX Native',
    intentType: 'codegen',
  },
  {
    intent: 'autocompletar a funcao de ordenacao',
    expectedModel: 'codegeex4-9b',
    expectedProvider: 'CodeGeeX Native',
    intentType: 'codegen',
  },

  // Cascade Rule 8: classificar|categorizar|sentimento|intent → glm-4-flash
  {
    intent: 'classificar sentimento deste texto',
    expectedModel: 'glm-4-flash',
    expectedProvider: 'Zhipu AI',
    intentType: 'classification',
  },
  {
    intent: 'categorizar produtos em 10 classes',
    expectedModel: 'glm-4-flash',
    expectedProvider: 'Zhipu AI',
    intentType: 'classification',
  },
  {
    intent: 'detectar intent do usuario na mensagem',
    expectedModel: 'glm-4-flash',
    expectedProvider: 'Zhipu AI',
    intentType: 'classification',
  },

  // Cascade Rule 9: raciocinario avancado|arquitetura|estrategia|solucao complexa|planejamento → glm-5.2
  {
    intent: 'raciocinario avancado sobre estrategia de microservicos',
    expectedModel: 'glm-5.2',
    expectedProvider: 'Zhipu AI',
    intentType: 'reasoning',
  },
  {
    intent: 'projetar arquitetura de sistema distribuido',
    expectedModel: 'glm-5.2',
    expectedProvider: 'Zhipu AI',
    intentType: 'reasoning',
  },
  {
    intent: 'planejamento de migracao para nuvem multi-cloud',
    expectedModel: 'glm-5.2',
    expectedProvider: 'Zhipu AI',
    intentType: 'reasoning',
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

export const routingEvaluator = new RoutingEvaluator();
