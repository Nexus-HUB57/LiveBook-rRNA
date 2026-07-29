/**
 * CHIMERA — Skill Learner
 *
 * Continuous skill learning with rolling performance tracking.
 * Records execution outcomes, computes rolling stats, detects missing skills,
 * suggests token adjustments, and identifies skills needing attention.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface SkillPerformance {
  skillId: string;
  totalExecutions: number;
  successRate: number;
  avgLatencyMs: number;
  avgTokensUsed: number;
  avgCostUsd: number;
  lastExecutedAt: number;
  suggestedTokenAdjustment: number; // multiplier (e.g. 1.2 = increase 20%)
}

interface ExecutionRecord {
  success: boolean;
  latencyMs: number;
  tokensUsed: number;
  costUsd: number;
  model: string;
  timestamp: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// SkillLearner
// ─────────────────────────────────────────────────────────────────────────────

export class SkillLearner {
  private performance: Map<string, ExecutionRecord[]>;
  private maxHistoryPerSkill: number;

  constructor(opts?: { maxHistoryPerSkill?: number }) {
    this.performance = new Map();
    this.maxHistoryPerSkill = opts?.maxHistoryPerSkill ?? 100;
  }

  /**
   * Record an execution outcome for a skill.
   * Keeps only the last N records per skill (rolling window).
   */
  recordExecution(
    skillId: string,
    outcome: {
      success: boolean;
      latencyMs: number;
      tokensUsed: number;
      costUsd: number;
      model: string;
    },
  ): void {
    let history = this.performance.get(skillId);
    if (!history) {
      history = [];
      this.performance.set(skillId, history);
    }

    history.push({
      ...outcome,
      timestamp: Date.now(),
    });

    // Evict oldest if over limit
    if (history.length > this.maxHistoryPerSkill) {
      history.splice(0, history.length - this.maxHistoryPerSkill);
    }
  }

  /**
   * Get performance summary for a single skill.
   */
  getPerformance(skillId: string): SkillPerformance | null {
    const history = this.performance.get(skillId);
    if (!history || history.length === 0) return null;

    return this.computeSummary(skillId, history);
  }

  /**
   * Get performance summary for all skills.
   */
  getAllPerformance(): SkillPerformance[] {
    const results: SkillPerformance[] = [];
    for (const [skillId, history] of this.performance) {
      if (history.length > 0) {
        results.push(this.computeSummary(skillId, history));
      }
    }
    return results;
  }

  /**
   * Detect skills that might be missing based on failed intent routing.
   * Returns intent strings that failed and don't match any existing skill trigger.
   * In practice, checks if the intent was served by a model but failed,
   * and no known skill has that intent in its trigger patterns.
   */
  detectMissingSkills(
    recentIntents: Array<{ intent: string; modelo: string; success: boolean }>,
  ): string[] {
    // Collect known skill IDs (these represent known triggers/skills)
    const knownSkillIds = new Set(this.performance.keys());

    const missing: string[] = [];
    const seen = new Set<string>();

    for (const entry of recentIntents) {
      if (!entry.success && !seen.has(entry.intent)) {
        seen.add(entry.intent);
        // If we have no history for this intent (treated as skill ID) or the model,
        // it might indicate a missing skill. We return the raw intent string.
        const intentKey = entry.intent.toLowerCase().trim();
        let matchesKnown = false;
        for (const skillId of knownSkillIds) {
          if (intentKey.includes(skillId.toLowerCase()) || skillId.toLowerCase().includes(intentKey)) {
            matchesKnown = true;
            break;
          }
        }
        if (!matchesKnown) {
          missing.push(entry.intent);
        }
      }
    }

    return missing;
  }

  /**
   * Suggest token adjustment multiplier based on recent performance.
   * - successRate < 0.7 → suggest 1.5x (give more tokens)
   * - successRate > 0.95 → suggest 0.8x (save cost)
   * - Otherwise → suggest 1.0 (no change)
   */
  suggestTokenAdjustment(skillId: string): number {
    const perf = this.getPerformance(skillId);
    if (!perf || perf.totalExecutions === 0) return 1.0;

    if (perf.successRate < 0.7) return 1.5;
    if (perf.successRate > 0.95) return 0.8;
    return 1.0;
  }

  /**
   * Get skills that need attention.
   * Returns skills with successRate < 0.7 or avgLatencyMs > 5000.
   */
  getSkillsNeedingAttention(): Array<{
    skillId: string;
    reason: string;
    performance: SkillPerformance;
  }> {
    const results: Array<{ skillId: string; reason: string; performance: SkillPerformance }> = [];

    for (const [skillId, history] of this.performance) {
      if (history.length === 0) continue;

      const perf = this.computeSummary(skillId, history);
      const reasons: string[] = [];

      if (perf.successRate < 0.7) {
        reasons.push(`low success rate (${(perf.successRate * 100).toFixed(1)}%)`);
      }

      if (perf.avgLatencyMs > 5000) {
        reasons.push(`high latency (${perf.avgLatencyMs.toFixed(0)}ms avg)`);
      }

      if (reasons.length > 0) {
        results.push({
          skillId,
          reason: reasons.join('; '),
          performance: perf,
        });
      }
    }

    return results;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // Private helpers
  // ───────────────────────────────────────────────────────────────────────────

  private computeSummary(skillId: string, history: ExecutionRecord[]): SkillPerformance {
    const n = history.length;
    const successes = history.filter(r => r.success).length;
    const totalLatency = history.reduce((s, r) => s + r.latencyMs, 0);
    const totalTokens = history.reduce((s, r) => s + r.tokensUsed, 0);
    const totalCost = history.reduce((s, r) => s + r.costUsd, 0);
    const lastTimestamp = history[n - 1].timestamp;

    // Compute suggested token adjustment
    const successRate = n > 0 ? successes / n : 0;
    let suggestedTokenAdjustment: number;
    if (successRate < 0.7) {
      suggestedTokenAdjustment = 1.5;
    } else if (successRate > 0.95) {
      suggestedTokenAdjustment = 0.8;
    } else {
      suggestedTokenAdjustment = 1.0;
    }

    return {
      skillId,
      totalExecutions: n,
      successRate,
      avgLatencyMs: n > 0 ? totalLatency / n : 0,
      avgTokensUsed: n > 0 ? totalTokens / n : 0,
      avgCostUsd: n > 0 ? totalCost / n : 0,
      lastExecutedAt: lastTimestamp,
      suggestedTokenAdjustment,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Singleton
// ─────────────────────────────────────────────────────────────────────────────

export const skillLearner = new SkillLearner();
