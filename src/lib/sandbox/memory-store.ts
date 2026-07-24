/**
 * ═══════════════════════════════════════════════════════════════
 * SANDBOX NATIVO — Memory Store (In-Memory Persistence)
 * ═══════════════════════════════════════════════════════════════
 * In-memory store for agents, conversations, memory entries,
 * evolution events, audit logs, and snapshots.
 * Designed for single-process Next.js deployment.
 */

import { randomUUID } from 'crypto';
import type {
  SandboxAgent, LLMConversation, LLMInteraction, MemoryEntry,
  Snapshot, EvolutionEvent, AuditEntry, SandboxHealth, AgentStatus, AgentTier,
} from './types';

// ─── In-Memory Stores ───────────────────────────────────
const agents = new Map<string, SandboxAgent>();
const conversations = new Map<string, LLMConversation>();
const memoryEntries = new Map<string, MemoryEntry>();
const snapshots = new Map<string, Snapshot>();
const evolutionEvents: EvolutionEvent[] = [];
const auditLog: AuditEntry[] = [];

// ─── Counters ────────────────────────────────────────────
let totalExecutions = 0;
let totalErrors = 0;
let llmInteractions = 0;
let gcRuns = 0;
let startTime = Date.now();

// ═══ AGENTS ═════════════════════════════════════════════

export function getAllAgents(): SandboxAgent[] {
  return Array.from(agents.values());
}

export function getAgent(id: string): SandboxAgent | undefined {
  return agents.get(id);
}

export function getAgentsByStatus(status: AgentStatus): SandboxAgent[] {
  return getAllAgents().filter(a => a.status === status);
}

export function saveAgent(agent: SandboxAgent): void {
  agents.set(agent.id, agent);
}

export function deleteAgent(id: string): boolean {
  return agents.delete(id);
}

export function agentCount(): number {
  return agents.size;
}

// ═══ CONVERSATIONS ══════════════════════════════════════

export function createConversation(agentId?: string): LLMConversation {
  const conv: LLMConversation = {
    id: randomUUID(),
    agentId,
    messages: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  conversations.set(conv.id, conv);
  return conv;
}

export function getConversation(id: string): LLMConversation | undefined {
  return conversations.get(id);
}

export function addMessageToConversation(convId: string, msg: Omit<LLMInteraction, 'id' | 'timestamp'>): LLMInteraction | null {
  const conv = conversations.get(convId);
  if (!conv) return null;
  const fullMsg: LLMInteraction = {
    ...msg,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };
  conv.messages.push(fullMsg);
  conv.updatedAt = new Date().toISOString();
  llmInteractions++;
  return fullMsg;
}

export function deleteConversation(id: string): boolean {
  return conversations.delete(id);
}

export function getAllConversations(): LLMConversation[] {
  return Array.from(conversations.values());
}

// ═══ MEMORY ENTRIES ═════════════════════════════════════

export function addMemory(entry: Omit<MemoryEntry, 'id' | 'createdAt' | 'accessCount'>): MemoryEntry {
  const full: MemoryEntry = {
    ...entry,
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    accessCount: 1,
  };
  memoryEntries.set(full.id, full);
  return full;
}

export function getMemoryEntries(agentId?: string): MemoryEntry[] {
  const all = Array.from(memoryEntries.values());
  if (!agentId) return all;
  return all.filter(m => m.agentId === agentId);
}

export function clearExpiredMemory(): number {
  const now = Date.now();
  let cleared = 0;
  for (const [id, entry] of memoryEntries) {
    if (entry.ttl && (now - new Date(entry.createdAt).getTime()) > entry.ttl) {
      memoryEntries.delete(id);
      cleared++;
    }
  }
  return cleared;
}

// ═══ SNAPSHOTS ══════════════════════════════════════════

export function createSnapshot(agentId: string, agent: SandboxAgent): Snapshot {
  const snap: Snapshot = {
    id: randomUUID(),
    agentId,
    state: { status: agent.status, tier: agent.tier, generation: agent.generation },
    memory: getMemoryEntries(agentId),
    metrics: { ...agent.metrics },
    createdAt: new Date().toISOString(),
    sizeBytes: JSON.stringify(agent).length,
  };
  snapshots.set(snap.id, snap);
  return snap;
}

export function getSnapshots(agentId?: string): Snapshot[] {
  const all = Array.from(snapshots.values());
  if (!agentId) return all;
  return all.filter(s => s.agentId === agentId);
}

// ═══ EVOLUTION EVENTS ══════════════════════════════════

export function addEvolutionEvent(event: Omit<EvolutionEvent, 'id' | 'timestamp'>): EvolutionEvent {
  const full: EvolutionEvent = {
    ...event,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  };
  evolutionEvents.push(full);
  return full;
}

export function getEvolutionEvents(agentId?: string, limit = 50): EvolutionEvent[] {
  const events = agentId
    ? evolutionEvents.filter(e => e.agentId === agentId)
    : evolutionEvents;
  return events.slice(-limit);
}

// ═══ AUDIT LOG ══════════════════════════════════════════

export function addAuditEntry(entry: Omit<AuditEntry, 'id' | 'timestamp'>): void {
  auditLog.push({
    ...entry,
    id: randomUUID(),
    timestamp: new Date().toISOString(),
  });
  // Keep audit log bounded
  if (auditLog.length > 10000) {
    auditLog.splice(0, auditLog.length - 10000);
  }
}

export function getAuditLog(limit = 100): AuditEntry[] {
  return auditLog.slice(-limit);
}

// ═══ COUNTERS ══════════════════════════════════════════

export function incrementExecutions(): void { totalExecutions++; }
export function incrementErrors(): void { totalErrors++; }
export function incrementGcRuns(): void { gcRuns++; }

// ═══ GARBAGE COLLECTION ════════════════════════════════

export function runGarbageCollection(inactivityMs = 300_000): { recycled: number; cleared: number } {
  const now = Date.now();
  let recycled = 0;
  let cleared = 0;

  // Recycle inactive agents
  for (const [id, agent] of agents) {
    const lastActive = new Date(agent.lastActiveAt).getTime();
    if (agent.status !== 'recycled' && agent.status !== 'dead' && (now - lastActive) > inactivityMs) {
      agent.status = 'recycled';
      agent.lastActiveAt = new Date().toISOString();
      addEvolutionEvent({
        agentId: id,
        type: 'recycle',
        reason: `Inactivity timeout (${Math.round(inactivityMs / 1000)}s)`,
      });
      recycled++;
    }
  }

  // Clear expired memory
  cleared = clearExpiredMemory();

  // Clear old conversations (keep last 100)
  if (conversations.size > 100) {
    const sorted = Array.from(conversations.entries()).sort(
      (a, b) => new Date(a[1].updatedAt).getTime() - new Date(b[1].updatedAt).getTime()
    );
    const toRemove = sorted.length - 100;
    for (let i = 0; i < toRemove; i++) {
      conversations.delete(sorted[i][0]);
    }
  }

  gcRuns++;
  return { recycled, cleared };
}

// ═══ HEALTH CHECK ═══════════════════════════════════════

export function getSandboxHealth(): SandboxHealth {
  const allAgents = getAllAgents();
  const agentsByStatus = {} as Record<AgentStatus, number>;
  const agentsByTier = {} as Record<AgentTier, number>;

  const statuses: AgentStatus[] = ['spawning', 'idle', 'executing', 'learning', 'promoted', 'degraded', 'recycled', 'dead'];
  const tiers: AgentTier[] = ['scout', 'worker', 'expert', 'elite', 'architect'];
  statuses.forEach(s => agentsByStatus[s] = 0);
  tiers.forEach(t => agentsByTier[t] = 0);

  for (const a of allAgents) {
    agentsByStatus[a.status]++;
    agentsByTier[a.tier]++;
  }

  const memUsage = process.memoryUsage();
  const memoryUsageMB = Math.round((memUsage.heapUsed + memUsage.external) / (1024 * 1024) * 10) / 10;

  const errorRate = totalExecutions > 0 ? totalErrors / totalExecutions : 0;
  const status: SandboxHealth['status'] =
    errorRate > 0.2 ? 'critical' : errorRate > 0.05 ? 'degraded' : 'healthy';

  return {
    status,
    uptimeMs: Date.now() - startTime,
    totalAgents: allAgents.length,
    activeAgents: allAgents.filter(a => ['idle', 'executing', 'learning'].includes(a.status)).length,
    totalExecutions,
    totalErrors,
    llmInteractions,
    memoryUsageMB: memoryUsageMB,
    memoryLimitMB: 512,
    agentsByStatus,
    agentsByTier,
    evolutionEvents: evolutionEvents.length,
    snapshots: snapshots.size,
    gcRuns,
  };
}
