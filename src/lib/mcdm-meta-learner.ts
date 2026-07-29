/**
 * CHIMERA — MCDM Meta-Learner
 *
 * Learns optimal MCDM weights per intent type from routing feedback.
 * Uses exponentially weighted moving averages of successful samples
 * to blend with default weights.
 *
 * Zero external dependencies — pure TypeScript.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface WeightSample {
  intentType: string;            // coarse category (e.g. 'code', 'math', 'reasoning', 'multimodal')
  pesos: Record<string, number>; // current weights used
  modeloSelecionado: string;
  feedbackScore: number;         // 0-1 user satisfaction or accuracy
  timestamp: number;
}

// ---------------------------------------------------------------------------
// Intent classification rules (keyword → coarse type)
// ---------------------------------------------------------------------------

const INTENT_RULES: Array<{ pattern: RegExp; type: string }> = [
  { pattern: /code|debug|codigo|programar|typescript|javascript|python|refactor|codigo_fonte/i, type: 'code' },
  { pattern: /math|calculo|equacao|formula|estatistica|probabilidade|algebra/i, type: 'math' },
  { pattern: /reasoning|raciocinio|logica|arquitetura|estrategia|planejamento|analise/i, type: 'reasoning' },
  { pattern: /image|imagem|video|audio|multimodal|visionamento|foto/i, type: 'multimodal' },
  { pattern: /seguranca|security|vulnerabilidade|audit|pentest/i, type: 'security' },
  { pattern: /deploy|devops|cloud|infra|kubernetes|docker|ci\/cd/i, type: 'devops' },
];

const DEFAULT_INTENT_TYPE = 'general';

const DEFAULT_WEIGHTS: Record<string, number> = {
  qualidade: 0.35,
  velocidade: 0.20,
  custo: 0.15,
  disponibilidade: 0.10,
  especializacao: 0.10,
  contexto: 0.10,
};

// ---------------------------------------------------------------------------
// McdmMetaLearner
// ---------------------------------------------------------------------------

export class McdmMetaLearner {
  private samples: WeightSample[];
  private defaultWeights: Record<string, number>;
  private learningRate: number;
  private maxSamples: number;

  constructor(opts?: { learningRate?: number; maxSamples?: number }) {
    this.samples = [];
    this.defaultWeights = { ...DEFAULT_WEIGHTS };
    this.learningRate = opts?.learningRate ?? 0.15;
    this.maxSamples = opts?.maxSamples ?? 5000;
  }

  // -----------------------------------------------------------------------
  // classifyIntent — maps a free-form intent string to a coarse type
  // -----------------------------------------------------------------------

  classifyIntent(intent: string): string {
    for (const rule of INTENT_RULES) {
      if (rule.pattern.test(intent)) {
        return rule.type;
      }
    }
    return DEFAULT_INTENT_TYPE;
  }

  // -----------------------------------------------------------------------
  // recordFeedback — store a routing feedback sample
  // -----------------------------------------------------------------------

  recordFeedback(
    intent: string,
    pesos: Record<string, number>,
    modelo: string,
    score: number,
  ): void {
    const intentType = this.classifyIntent(intent);
    const sample: WeightSample = {
      intentType,
      pesos: { ...pesos },
      modeloSelecionado: modelo,
      feedbackScore: Math.max(0, Math.min(1, score)),
      timestamp: Date.now(),
    };

    this.samples.push(sample);

    // Evict oldest samples if over limit
    if (this.samples.length > this.maxSamples) {
      this.samples = this.samples.slice(this.samples.length - this.maxSamples);
    }

    // Fire-and-forget persistence
    this.persistSample(sample);
  }

  // -----------------------------------------------------------------------
  // getWeights — learned weights blended with defaults
  // -----------------------------------------------------------------------

  getWeights(intentType: string): Record<string, number> {
    // Gather successful samples (score >= 0.5) for this intent type
    const relevant = this.samples.filter(
      (s) => s.intentType === intentType && s.feedbackScore >= 0.5,
    );

    if (relevant.length === 0) {
      return { ...this.defaultWeights };
    }

    // Compute exponentially weighted moving average of weights
    // Recent samples get higher weight (decay factor)
    const decay = 0.95;
    const weights = { ...this.defaultWeights };
    const keys = Object.keys(weights);
    const weightSums: Record<string, number> = {};
    const weightCounts: Record<string, number> = {};

    for (const key of keys) {
      weightSums[key] = 0;
      weightCounts[key] = 0;
    }

    // Process from oldest to newest, applying increasing weight
    for (let i = 0; i < relevant.length; i++) {
      const age = relevant.length - 1 - i; // 0 = most recent
      const factor = Math.pow(decay, age);

      for (const key of keys) {
        if (key in relevant[i].pesos) {
          weightSums[key] += relevant[i].pesos[key] * factor;
          weightCounts[key] += factor;
        }
      }
    }

    // Compute average feedback weights
    const avgWeights: Record<string, number> = {};
    for (const key of keys) {
      avgWeights[key] = weightCounts[key] > 0
        ? weightSums[key] / weightCounts[key]
        : this.defaultWeights[key];
    }

    // Blend: learned = default + learningRate * (avg - default)
    const blended: Record<string, number> = {};
    for (const key of keys) {
      blended[key] = this.defaultWeights[key]
        + this.learningRate * (avgWeights[key] - this.defaultWeights[key]);
      // Clamp to [0, 1]
      blended[key] = Math.max(0, Math.min(1, blended[key]));
    }

    // Normalize to sum to 1
    const sum = Object.values(blended).reduce((a, b) => a + b, 0);
    if (sum > 0) {
      for (const key of keys) {
        blended[key] = blended[key] / sum;
      }
    }

    return blended;
  }

  // -----------------------------------------------------------------------
  // getStats — diagnostic information
  // -----------------------------------------------------------------------

  getStats(): {
    totalSamples: number;
    intentTypes: string[];
    weightDeltas: Record<string, Record<string, number>>;
  } {
    const intentTypes = Array.from(new Set(this.samples.map((s) => s.intentType)));
    const weightDeltas: Record<string, Record<string, number>> = {};

    for (const type of intentTypes) {
      const learned = this.getWeights(type);
      weightDeltas[type] = {};

      for (const key of Object.keys(this.defaultWeights)) {
        weightDeltas[type][key] = learned[key] - this.defaultWeights[key];
      }
    }

    return {
      totalSamples: this.samples.length,
      intentTypes,
      weightDeltas,
    };
  }

  // -----------------------------------------------------------------------
  // persistSample — fire-and-forget write to Prisma McdmWeightHistory
  // -----------------------------------------------------------------------

  private persistSample(sample: WeightSample): void {
    // Fire-and-forget — intentionally not awaited
    (async () => {
      try {
        const { db } = await import('@/lib/db');
        await db.mcdmWeightHistory.create({
          data: {
            intentType: sample.intentType,
            pesos: JSON.stringify(sample.pesos),
            feedbackScore: sample.feedbackScore,
            sampleSize: 1,
          },
        });
      } catch {
        // Swallow errors to keep the learner non-blocking
      }
    })();
  }

  // -----------------------------------------------------------------------
  // loadHistory — rehydrate samples from Prisma on startup
  // -----------------------------------------------------------------------

  async loadHistory(): Promise<void> {
    try {
      const { db } = await import('@/lib/db');
      const rows = await db.mcdmWeightHistory.findMany({
        orderBy: { createdAt: 'asc' },
        take: this.maxSamples,
      });

      for (const row of rows) {
        let pesos: Record<string, number> = {};
        try {
          pesos = JSON.parse(row.pesos);
        } catch {
          // Skip malformed JSON
          continue;
        }

        this.samples.push({
          intentType: row.intentType,
          pesos,
          modeloSelecionado: '',
          feedbackScore: row.feedbackScore,
          timestamp: row.createdAt.getTime(),
        });
      }
    } catch {
      // Swallow — learner works fine without history
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const mcdmLearner = new McdmMetaLearner();
