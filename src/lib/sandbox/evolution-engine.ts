/**
 * ═══════════════════════════════════════════════════════════════
 * SANDBOX NATIVO — Evolution Engine
 * ═══════════════════════════════════════════════════════════════
 * Digital natural selection: promote high-performers,
 * recycle failures, trigger autonomous evolution cycles.
 */

import type { EvolutionConfig, EvolutionEvent, AgentTier } from './types';
import { getAllAgents, getEvolutionEvents, addEvolutionEvent } from './memory-store';
import { promoteAgent, demoteAgent, recycleAgent, spawnAgent } from './agent-lifecycle';

// ─── Default Evolution Config ─────────────────────────
const DEFAULT_CONFIG: EvolutionConfig = {
  promotionThreshold: 0.8,
  demotionThreshold: 0.3,
  recycleThreshold: 0.1,
  inactivityTimeoutMs: 300_000, // 5 minutes
  maxGenerations: 10,
  elitePreserveCount: 3,
};

let evoConfig = { ...DEFAULT_CONFIG };

export function getEvolutionConfig(): EvolutionConfig { return { ...evoConfig }; }

export function updateEvolutionConfig(partial: Partial<EvolutionConfig>): EvolutionConfig {
  evoConfig = { ...evoConfig, ...partial };
  return evoConfig;
}

// ═══ EVOLUTION CYCLE ══════════════════════════════════

export interface EvolutionCycleResult {
  promoted: string[];
  demoted: string[];
  recycled: string[];
  spawned: string[];
  summary: string;
}

export function runEvolutionCycle(): EvolutionCycleResult {
  const agents = getAllAgents().filter(a => a.status !== 'recycled' && a.status !== 'dead');
  const result: EvolutionCycleResult = { promoted: [], demoted: [], recycled: [], spawned: [], summary: '' };

  for (const agent of agents) {
    const score = agent.metrics.performanceScore;
    const minExecs = 3; // Need at least 3 tasks to evaluate
    if (agent.metrics.tasksCompleted < minExecs) continue;

    // ── RECYCLE: Consistently failing agents ──
    if (score < evoConfig.recycleThreshold && agent.metrics.tasksFailed > 5) {
      const r = recycleAgent(agent.id);
      if (r.recycled) result.recycled.push(agent.id);
      continue;
    }

    // ── DEMOTE: Underperforming agents ──
    if (score < evoConfig.demotionThreshold) {
      const d = demoteAgent(agent.id);
      if (d.demoted) result.demoted.push(agent.id);
      continue;
    }

    // ── PROMOTE: High-performing agents ──
    if (score >= evoConfig.promotionThreshold && agent.metrics.tasksCompleted >= 5) {
      const p = promoteAgent(agent.id);
      if (p.promoted) result.promoted.push(agent.id);
      continue;
    }
  }

  // ── SPAWN: If too few active agents, spawn new scouts ──
  const activeCount = agents.filter(a => ['idle', 'executing'].includes(a.status)).length;
  if (activeCount < 2) {
    const newAgent = spawnAgent(`Auto-Spawn ${Date.now().toString(36)}`, 'scout');
    result.spawned.push(newAgent.id);
  }

  result.summary = [
    result.promoted.length > 0 ? `Promoted ${result.promoted.length} agents` : '',
    result.demoted.length > 0 ? `Demoted ${result.demoted.length} agents` : '',
    result.recycled.length > 0 ? `Recycled ${result.recycled.length} agents` : '',
    result.spawned.length > 0 ? `Spawned ${result.spawned.length} agents` : '',
  ].filter(Boolean).join('. ') || 'No changes needed';

  return result;
}

// ═══ EVOLUTION STATS ══════════════════════════════════

export function getEvolutionStats() {
  const recentEvents = getEvolutionEvents(undefined, 100);
  const now = Date.now();
  const lastHour = recentEvents.filter(e => (now - new Date(e.timestamp).getTime()) < 3600000);

  const typeCounts: Record<string, number> = {};
  for (const e of lastHour) {
    typeCounts[e.type] = (typeCounts[e.type] || 0) + 1;
  }

  return {
    totalEvents: recentEvents.length,
    eventsLastHour: lastHour.length,
    byType: typeCounts,
    recentEvents: recentEvents.slice(-10),
    config: evoConfig,
    naturalSelectionPressure: Math.min(1, lastHour.length / 20),
  };
}
