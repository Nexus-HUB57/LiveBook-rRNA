/**
 * CHIMERA v4.0 — Memory Manager
 * Manages 4-type agent memory: episodic, semantic, procedural, working.
 * Uses importance scoring, LRU eviction, and relevance ranking.
 */

import type { MemoryEntry, MemoryQuery, MemoryType } from './types';
import { v4 as uuid } from 'uuid';

const MAX_WORKING_MEMORY = 20;
const DEFAULT_MEMORY_LIMIT = 500;
const IMPORTANCE_DECAY = 0.95;

export class MemoryManager {
  private store: Map<string, MemoryEntry> = new Map();
  private limit: number;

  constructor(limit = DEFAULT_MEMORY_LIMIT) {
    this.limit = limit;
  }

  /** Store a new memory entry */
  create(params: {
    agentId: string;
    taskId?: string;
    type: MemoryType;
    content: string;
    importance?: number;
    metadata?: Record<string, unknown>;
    expiresAt?: string;
  }): MemoryEntry {
    const entry: MemoryEntry = {
      id: uuid(),
      agentId: params.agentId,
      taskId: params.taskId,
      type: params.type,
      content: params.content,
      importance: params.importance ?? this.calculateImportance(params.type, params.content),
      accessCount: 0,
      lastAccessedAt: new Date().toISOString(),
      expiresAt: params.expiresAt,
      createdAt: new Date().toISOString(),
      metadata: params.metadata,
    };
    this.store.set(entry.id, entry);
    this.evictIfNeeded();
    return entry;
  }

  /** Retrieve a single memory by ID */
  get(id: string): MemoryEntry | undefined {
    const entry = this.store.get(id);
    if (entry) {
      entry.accessCount++;
      entry.lastAccessedAt = new Date().toISOString();
    }
    return entry;
  }

  /** Query memories with filters */
  query(q: MemoryQuery): MemoryEntry[] {
    let results = Array.from(this.store.values());

    if (q.agentId) results = results.filter(m => m.agentId === q.agentId);
    if (q.taskId) results = results.filter(m => m.taskId === q.taskId);
    if (q.type) results = results.filter(m => m.type === q.type);
    if (q.minImportance) results = results.filter(m => m.importance >= q.minImportance);

    // Filter expired
    const now = Date.now();
    results = results.filter(m => !m.expiresAt || new Date(m.expiresAt).getTime() > now);

    // If there's a text query, do simple keyword relevance ranking
    if (q.query) {
      const keywords = q.query.toLowerCase().split(/\s+/);
      results = results.map(m => {
        const text = m.content.toLowerCase();
        const score = keywords.reduce((sum, kw) => sum + (text.includes(kw) ? 1 : 0), 0);
        return { memory: m, relevance: score };
      }).filter(r => r.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance)
        .map(r => r.memory);
    } else {
      // Default: sort by importance desc, then recency
      results.sort((a, b) => b.importance - a.importance || new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
    }

    return results.slice(0, q.limit ?? 20);
  }

  /** Get working memory for an agent (recent, high-importance, limited) */
  getWorkingMemory(agentId: string, taskId?: string): MemoryEntry[] {
    let memories = this.query({
      agentId,
      taskId,
      limit: MAX_WORKING_MEMORY * 3, // get more, then trim
    });
    // Working memory: recent + high importance, with LRU for working type
    const working = memories.filter(m => m.type === 'working');
    const nonWorking = memories.filter(m => m.type !== 'working');
    working.sort((a, b) => new Date(b.lastAccessedAt).getTime() - new Date(a.lastAccessedAt).getTime());
    nonWorking.sort((a, b) => b.importance - a.importance);
    return [...working.slice(0, MAX_WORKING_MEMORY / 2), ...nonWorking.slice(0, MAX_WORKING_MEMORY - working.length / 2)];
  }

  /** Build a memory context string for LLM injection */
  buildContext(agentId: string, taskId?: string, maxTokens = 2000): string {
    const memories = this.getWorkingMemory(agentId, taskId);
    if (memories.length === 0) return '';

    const sections: string[] = ['# Relevant Memory'];
    let currentTokens = 0;
    const tokensPerChar = 0.25; // rough estimate

    for (const m of memories) {
      const entryText = `## [${m.type.toUpperCase()}] ${m.content}`;
      const estTokens = entryText.length * tokensPerChar;
      if (currentTokens + estTokens > maxTokens) break;
      sections.push(entryText);
      currentTokens += estTokens;
      m.accessCount++;
      m.lastAccessedAt = new Date().toISOString();
    }

    return sections.join('\n');
  }

  /** Decay importance of old memories */
  decay(): number {
    let decayed = 0;
    for (const entry of this.store.values()) {
      if (entry.type !== 'semantic') { // semantic memories don't decay
        entry.importance *= IMPORTANCE_DECAY;
        decayed++;
      }
    }
    return decayed;
  }

  /** Delete a memory */
  delete(id: string): boolean {
    return this.store.delete(id);
  }

  /** Clear all memories for an agent */
  clearAgent(agentId: string): number {
    let count = 0;
    for (const [id, m] of this.store) {
      if (m.agentId === agentId) {
        this.store.delete(id);
        count++;
      }
    }
    return count;
  }

  /** Get stats */
  getStats() {
    const byType: Record<string, number> = {};
    const byAgent: Record<string, number> = {};
    for (const m of this.store.values()) {
      byType[m.type] = (byType[m.type] || 0) + 1;
      byAgent[m.agentId] = (byAgent[m.agentId] || 0) + 1;
    }
    return {
      total: this.store.size,
      limit: this.limit,
      byType,
      byAgent,
    };
  }

  /** Calculate importance score for a memory based on type and content */
  private calculateImportance(type: MemoryType, content: string): number {
    const baseScores: Record<MemoryType, number> = {
      working: 0.9,
      episodic: 0.7,
      procedural: 0.6,
      semantic: 0.5,
    };
    let score = baseScores[type];
    // Boost for longer, more detailed content
    if (content.length > 500) score += 0.1;
    if (content.length > 1000) score += 0.1;
    // Boost for content that looks like a result or conclusion
    if (/result|conclusion|answer|solution|found/i.test(content)) score += 0.1;
    return Math.min(score, 1.0);
  }

  /** Evict lowest-importance memories when at capacity */
  private evictIfNeeded(): void {
    if (this.store.size <= this.limit) return;
    const entries = Array.from(this.store.values())
      .sort((a, b) => a.importance - b.importance || new Date(a.lastAccessedAt).getTime() - new Date(b.lastAccessedAt).getTime());
    const toRemove = entries.length - this.limit;
    for (let i = 0; i < toRemove; i++) {
      this.store.delete(entries[i].id);
    }
  }
}

// Per-agent singleton map
const managers: Map<string, MemoryManager> = new Map();
export function getMemoryManager(agentId?: string, limit?: number): MemoryManager {
  if (!agentId) {
    // Global shared manager
    const key = '__global__';
    if (!managers.has(key)) managers.set(key, new MemoryManager(limit));
    return managers.get(key)!;
  }
  if (!managers.has(agentId)) managers.set(agentId, new MemoryManager(limit));
  return managers.get(agentId)!;
}
