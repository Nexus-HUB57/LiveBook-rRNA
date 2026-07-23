/**
 * ═══════════════════════════════════════════════════════════════
 * SANDBOX NATIVO — Agent Lifecycle Manager
 * ═══════════════════════════════════════════════════════════════
 * Manages agent spawn, execution, learning, healing,
 * recycling, and the full biological lifecycle.
 */

import { randomUUID } from 'crypto';
import type {
  SandboxAgent, AgentTier, AgentStatus, AgentPermissions,
  ResourceLimits, AgentMetrics, ExecutionRequest, ExecutionResult,
} from './types';
import { executeInSandbox } from './execution-engine';
import {
  saveAgent, getAgent, deleteAgent, getAllAgents,
  createSnapshot, addMemory, getMemoryEntries,
  addEvolutionEvent, addAuditEntry, incrementExecutions, incrementErrors,
} from './memory-store';

// ─── Default configs per tier ───────────────────────────
const TIER_DEFAULTS: Record<AgentTier, {
  resources: ResourceLimits;
  permissions: AgentPermissions;
  capabilities: string[];
}> = {
  scout: {
    resources: { cpuMs: 2000, memoryMB: 64, timeoutMs: 5000, maxOutputChars: 10000 },
    permissions: { network: false, filesystem: false, llmAccess: false, toolCalling: false, agentSpawn: false, maxConcurrentTasks: 1 },
    capabilities: ['basic-execution', 'javascript', 'math'],
  },
  worker: {
    resources: { cpuMs: 5000, memoryMB: 128, timeoutMs: 15000, maxOutputChars: 30000 },
    permissions: { network: false, filesystem: false, llmAccess: true, toolCalling: false, agentSpawn: false, maxConcurrentTasks: 2 },
    capabilities: ['basic-execution', 'javascript', 'typescript', 'math', 'json', 'llm-assisted'],
  },
  expert: {
    resources: { cpuMs: 10000, memoryMB: 256, timeoutMs: 30000, maxOutputChars: 50000 },
    permissions: { network: false, filesystem: true, llmAccess: true, toolCalling: true, agentSpawn: false, maxConcurrentTasks: 3 },
    capabilities: ['basic-execution', 'javascript', 'typescript', 'python-emu', 'math', 'json', 'llm-assisted', 'tool-calling', 'code-gen'],
  },
  elite: {
    resources: { cpuMs: 20000, memoryMB: 512, timeoutMs: 60000, maxOutputChars: 100000 },
    permissions: { network: true, filesystem: true, llmAccess: true, toolCalling: true, agentSpawn: true, maxConcurrentTasks: 5 },
    capabilities: ['full-execution', 'all-languages', 'math', 'json', 'llm-assisted', 'tool-calling', 'code-gen', 'agent-spawn', 'network'],
  },
  architect: {
    resources: { cpuMs: 30000, memoryMB: 1024, timeoutMs: 120000, maxOutputChars: 200000 },
    permissions: { network: true, filesystem: true, llmAccess: true, toolCalling: true, agentSpawn: true, maxConcurrentTasks: 10 },
    capabilities: ['full-execution', 'all-languages', 'math', 'json', 'llm-assisted', 'tool-calling', 'code-gen', 'agent-spawn', 'network', 'governance'],
  },
};

// ═══ SPAWN ═════════════════════════════════════════════

export function spawnAgent(
  name: string,
  tier: AgentTier = 'scout',
  parentId?: string,
): SandboxAgent {
  const id = randomUUID();
  const now = new Date().toISOString();
  const defaults = TIER_DEFAULTS[tier];

  const agent: SandboxAgent = {
    id,
    name,
    tier,
    status: 'spawning',
    capabilities: [...defaults.capabilities],
    permissions: { ...defaults.permissions },
    resources: { ...defaults.resources },
    metrics: {
      performanceScore: 0.5,
      successRate: 1.0,
      avgLatencyMs: 0,
      tasksCompleted: 0,
      tasksFailed: 0,
      promotionCount: 0,
      recycleCount: 0,
    },
    createdAt: now,
    lastActiveAt: now,
    parentId,
    generation: parentId ? (getAgent(parentId)?.generation ?? 0) + 1 : 1,
    memorySize: 0,
    totalExecutions: 0,
    totalErrors: 0,
  };

  // Transition to idle after "spawn"
  agent.status = 'idle';
  saveAgent(agent);

  addEvolutionEvent({
    agentId: id,
    type: 'spawn',
    reason: `Agent spawned as ${tier}` + (parentId ? ` from parent ${parentId}` : ''),
  });

  addAuditEntry({
    action: 'spawn',
    agentId: id,
    resource: `agent://${id}`,
    result: 'success',
    details: `Spawned ${name} (${tier})`,
  });

  return agent;
}

// ═══ EXECUTE ════════════════════════════════════════════

export async function executeAgentTask(
  agentId: string,
  request: ExecutionRequest,
): Promise<ExecutionResult> {
  const agent = getAgent(agentId);
  if (!agent) {
    return {
      success: false, output: '', error: `Agent ${agentId} not found`,
      exitCode: 404, executionTimeMs: 0, memoryUsedMB: 0,
      sandboxId: '', timestamp: new Date().toISOString(), logs: [],
    };
  }

  // Check permissions
  if (!agent.capabilities.includes('basic-execution') && !agent.capabilities.includes('full-execution')) {
    return {
      success: false, output: '', error: 'Agent lacks execution capability',
      exitCode: 403, executionTimeMs: 0, memoryUsedMB: 0,
      sandboxId: '', timestamp: new Date().toISOString(), logs: [],
    };
  }

  // Update status
  agent.status = 'executing';
  agent.lastActiveAt = new Date().toISOString();
  saveAgent(agent);

  // Apply resource limits from agent tier
  request.timeoutMs = Math.min(request.timeoutMs ?? 5000, agent.resources.timeoutMs);
  request.agentId = agentId;

  const result = await executeInSandbox(request);

  // Update metrics
  agent.lastActiveAt = new Date().toISOString();
  agent.totalExecutions++;
  agent.status = result.success ? 'idle' : 'degraded';

  if (result.success) {
    agent.metrics.tasksCompleted++;
    incrementExecutions();
  } else {
    agent.metrics.tasksFailed++;
    agent.totalErrors++;
    incrementErrors();
  }

  // Recalculate performance score (exponential moving average)
  const alpha = 0.3;
  const taskScore = result.success ? 1.0 : 0.0;
  const latencyPenalty = Math.min(result.executionTimeMs / agent.resources.timeoutMs, 1.0) * 0.2;
  const newScore = taskScore * (1 - latencyPenalty);
  agent.metrics.performanceScore =
    alpha * newScore + (1 - alpha) * agent.metrics.performanceScore;
  agent.metrics.avgLatencyMs =
    (agent.metrics.avgLatencyMs * agent.metrics.tasksCompleted + result.executionTimeMs) / (agent.metrics.tasksCompleted + 1);
  agent.metrics.successRate =
    agent.metrics.tasksCompleted / (agent.metrics.tasksCompleted + agent.metrics.tasksFailed);

  // Store execution memory
  addMemory({
    agentId,
    type: 'episodic',
    key: `exec:${result.sandboxId}`,
    value: { code: request.code.slice(0, 500), result: result.success, timeMs: result.executionTimeMs },
    accessedAt: new Date().toISOString(),
  });

  saveAgent(agent);
  return result;
}

// ═══ LEARN ═════════════════════════════════════════════

export function agentLearn(agentId: string, lesson: string, type: 'semantic' | 'episodic' = 'semantic'): void {
  const agent = getAgent(agentId);
  if (!agent) return;

  agent.status = 'learning';
  agent.lastActiveAt = new Date().toISOString();

  addMemory({
    agentId,
    type,
    key: `lesson:${Date.now()}`,
    value: lesson,
    accessedAt: new Date().toISOString(),
  });

  agent.memorySize = getMemoryEntries(agentId).length;
  agent.status = 'idle';
  saveAgent(agent);

  addEvolutionEvent({
    agentId,
    type: 'learn',
    reason: `Stored ${type} memory: ${lesson.slice(0, 80)}...`,
  });
}

// ═══ HEAL ═════════════════════════════════════════════

export function healAgent(agentId: string): { healed: boolean; actions: string[] } {
  const agent = getAgent(agentId);
  if (!agent) return { healed: false, actions: ['Agent not found'] };

  const actions: string[] = [];

  if (agent.status === 'degraded' || agent.status === 'dead') {
    // Reset to idle
    agent.status = 'idle';
    actions.push(`Status reset: ${agent.status} → idle`);

    // Create snapshot before healing
    const snap = createSnapshot(agentId, agent);
    agent.snapshotId = snap.id;
    actions.push(`Snapshot ${snap.id.slice(0, 8)} created`);

    // Reset degraded metrics slightly
    if (agent.metrics.performanceScore < 0.3) {
      agent.metrics.performanceScore = 0.3;
      actions.push('Performance score elevated to 0.3');
    }
  }

  agent.lastActiveAt = new Date().toISOString();
  saveAgent(agent);

  addEvolutionEvent({
    agentId,
    type: 'heal',
    reason: actions.join('; '),
  });

  return { healed: actions.length > 0, actions };
}

// ═══ RECYCLE ══════════════════════════════════════════

export function recycleAgent(agentId: string): { recycled: boolean; reason: string } {
  const agent = getAgent(agentId);
  if (!agent) return { recycled: false, reason: 'Agent not found' };

  // Create final snapshot
  createSnapshot(agentId, agent);

  agent.status = 'recycled';
  agent.metrics.recycleCount++;
  agent.lastActiveAt = new Date().toISOString();
  saveAgent(agent);

  addEvolutionEvent({
    agentId,
    type: 'recycle',
    reason: `Agent recycled. Total execs: ${agent.totalExecutions}, Score: ${agent.metrics.performanceScore.toFixed(2)}`,
  });

  return { recycled: true, reason: `Agent ${agent.name} recycled successfully` };
}

// ═══ PROMOTE ══════════════════════════════════════════

const TIER_ORDER: AgentTier[] = ['scout', 'worker', 'expert', 'elite', 'architect'];

export function promoteAgent(agentId: string): { promoted: boolean; newTier?: AgentTier; reason: string } {
  const agent = getAgent(agentId);
  if (!agent) return { promoted: false, reason: 'Agent not found' };

  const currentIdx = TIER_ORDER.indexOf(agent.tier);
  if (currentIdx >= TIER_ORDER.length - 1) {
    return { promoted: false, reason: `Already at max tier: ${agent.tier}` };
  }

  const prevTier = agent.tier;
  const newTier = TIER_ORDER[currentIdx + 1];
  const defaults = TIER_DEFAULTS[newTier];

  // Create snapshot before promotion
  createSnapshot(agentId, agent);

  // Apply new tier
  agent.tier = newTier;
  agent.status = 'promoted';
  agent.capabilities = [...defaults.capabilities];
  agent.permissions = { ...defaults.permissions };
  agent.resources = { ...defaults.resources };
  agent.metrics.promotionCount++;
  agent.lastActiveAt = new Date().toISOString();

  // After a brief moment, return to idle
  setTimeout(() => {
    const a = getAgent(agentId);
    if (a && a.status === 'promoted') a.status = 'idle';
    if (a) saveAgent(a);
  }, 3000);

  saveAgent(agent);

  addEvolutionEvent({
    agentId,
    type: 'promote',
    previousTier: prevTier,
    newTier,
    reason: `Promoted from ${prevTier} to ${newTier}. Score: ${agent.metrics.performanceScore.toFixed(2)}`,
  });

  return { promoted: true, newTier, reason: `Promoted to ${newTier}` };
}

// ═══ DEMOTE ═══════════════════════════════════════════

export function demoteAgent(agentId: string): { demoted: boolean; newTier?: AgentTier; reason: string } {
  const agent = getAgent(agentId);
  if (!agent) return { demoted: false, reason: 'Agent not found' };

  const currentIdx = TIER_ORDER.indexOf(agent.tier);
  if (currentIdx <= 0) {
    return { demoted: false, reason: `Already at minimum tier: ${agent.tier}` };
  }

  const prevTier = agent.tier;
  const newTier = TIER_ORDER[currentIdx - 1];
  const defaults = TIER_DEFAULTS[newTier];

  agent.tier = newTier;
  agent.capabilities = [...defaults.capabilities];
  agent.permissions = { ...defaults.permissions };
  agent.resources = { ...defaults.resources };
  agent.lastActiveAt = new Date().toISOString();
  saveAgent(agent);

  addEvolutionEvent({
    agentId,
    type: 'demote',
    previousTier: prevTier,
    newTier,
    reason: `Demoted from ${prevTier} to ${newTier}. Score: ${agent.metrics.performanceScore.toFixed(2)}`,
  });

  return { demoted: true, newTier, reason: `Demoted to ${newTier}` };
}

// ═══ LIST / PURGE ══════════════════════════════════════

export function purgeRecycled(): number {
  let count = 0;
  for (const [id, agent] of getAllAgents().entries()) {
    if (agent.status === 'recycled' || agent.status === 'dead') {
      deleteAgent(id);
      count++;
    }
  }
  return count;
}
