// CHIMERA Long-Term Agent Memory Module — Task 8: Front 8
// Pure TypeScript, zero external dependencies

export type MemoryType =
  | 'episodic'    // Specific past experiences/events
  | 'semantic'    // General knowledge/facts
  | 'working'     // Short-term task context (auto-expires faster)
  | 'procedural'; // How-to knowledge (skills, procedures)

export interface MemoryEntry {
  id: string;
  agentId: string;
  type: MemoryType;
  content: string;
  metadata: Record<string, unknown>;
  importance: number;       // 0-1, used for eviction
  accessCount: number;
  createdAt: number;
  lastAccessedAt: number;
  expiresAt: number | null; // null = never expires
}

export interface AgentMemoryOptions {
  maxPerAgent?: number;
  workingTtlMs?: number;
  episodicTtlMs?: number;
  semanticTtlMs?: number;
  proceduralTtlMs?: number;
}

export interface RecallOptions {
  type?: MemoryType;
  query?: string;
  limit?: number;
  minImportance?: number;
}

export interface MemoryStats {
  total: number;
  byType: Record<MemoryType, number>;
  avgImportance: number;
}

function generateRandomSuffix(): string {
  return Math.random().toString(36).substring(2, 10);
}

export class AgentMemory {
  private memories: Map<string, MemoryEntry[]>; // agentId -> entries
  private maxPerAgent: number;
  private workingTtlMs: number;
  private episodicTtlMs: number;
  private semanticTtlMs: number;
  private proceduralTtlMs: number;

  constructor(opts: AgentMemoryOptions = {}) {
    this.memories = new Map();
    this.maxPerAgent = opts.maxPerAgent ?? 1000;
    this.workingTtlMs = opts.workingTtlMs ?? 10 * 60 * 1000;       // 10 minutes
    this.episodicTtlMs = opts.episodicTtlMs ?? 24 * 60 * 60 * 1000; // 24 hours
    this.semanticTtlMs = opts.semanticTtlMs ?? 30 * 24 * 60 * 60 * 1000;  // 30 days
    this.proceduralTtlMs = opts.proceduralTtlMs ?? 90 * 24 * 60 * 60 * 1000; // 90 days
   }

  /**
   * Compute the default TTL for a given memory type.
   */
  private getTtlForType(type: MemoryType): number {
    switch (type) {
      case 'working':    return this.workingTtlMs;
      case 'episodic':   return this.episodicTtlMs;
      case 'semantic':   return this.semanticTtlMs;
      case 'procedural': return this.proceduralTtlMs;
    }
  }

  /**
   * Get or create the memory array for an agent.
   */
  private getOrCreateAgentEntries(agentId: string): MemoryEntry[] {
    let entries = this.memories.get(agentId);
    if (!entries) {
      entries = [];
      this.memories.set(agentId, entries);
    }
    return entries;
  }

  /**
   * Store a memory entry for an agent.
   */
  store(
    agentId: string,
    type: MemoryType,
    content: string,
    metadata: Record<string, unknown> = {},
    importance: number = 0.5,
  ): MemoryEntry {
    const now = Date.now();
    const entry: MemoryEntry = {
      id: `mem_${agentId}_${now}_${generateRandomSuffix()}`,
      agentId,
      type,
      content,
      metadata,
      importance: Math.max(0, Math.min(1, importance)),
      accessCount: 0,
      createdAt: now,
      lastAccessedAt: now,
      expiresAt: now + this.getTtlForType(type),
    };

    const entries = this.getOrCreateAgentEntries(agentId);
    entries.push(entry);

    // Evict if over limit
    this.evictIfNeeded(agentId, entries);

    return entry;
  }

  /**
   * Recall memories for an agent, with optional filters.
   */
  recall(agentId: string, opts: RecallOptions = {}): MemoryEntry[] {
    const entries = this.memories.get(agentId);
    if (!entries || entries.length === 0) return [];

    const now = Date.now();

    let results = entries.filter((entry) => {
      // Skip expired
      if (entry.expiresAt !== null && entry.expiresAt <= now) return false;
      // Filter by type
      if (opts.type !== undefined && entry.type !== opts.type) return false;
      // Filter by minimum importance
      if (opts.minImportance !== undefined && entry.importance < opts.minImportance) return false;
      // Filter by content query (simple substring search)
      if (opts.query !== undefined && !entry.content.includes(opts.query)) return false;
      return true;
    });

    // Update access stats
    for (const entry of results) {
      entry.accessCount++;
      entry.lastAccessedAt = now;
    }

    // Sort by importance descending, then by lastAccessedAt descending
    results.sort((a, b) => {
      if (b.importance !== a.importance) return b.importance - a.importance;
      return b.lastAccessedAt - a.lastAccessedAt;
    });

    // Apply limit
    if (opts.limit !== undefined && opts.limit > 0) {
      results = results.slice(0, opts.limit);
    }

    return results;
  }

  /**
   * Forget (delete) specific memory by ID, or all memories of a given type for an agent.
   * Returns the number of memories deleted.
   */
  forget(agentId: string, memoryId?: string, type?: MemoryType): number {
    const entries = this.memories.get(agentId);
    if (!entries || entries.length === 0) return 0;

    const beforeLen = entries.length;

    if (memoryId !== undefined) {
      // Delete specific memory by ID
      const idx = entries.findIndex((e) => e.id === memoryId);
      if (idx !== -1) {
        entries.splice(idx, 1);
      }
    } else if (type !== undefined) {
      // Delete all memories of a given type
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].type === type) {
          entries.splice(i, 1);
        }
      }
    }
    // If neither memoryId nor type provided, no-op (use clear() instead)

    return beforeLen - entries.length;
  }

  /**
   * Consolidate working memories: promote working memories with importance >= 0.5
   * to episodic with refreshed TTL. Returns count of consolidated memories.
   */
  consolidateWorking(agentId: string): number {
    const entries = this.memories.get(agentId);
    if (!entries || entries.length === 0) return 0;

    const now = Date.now();
    let consolidated = 0;

    for (const entry of entries) {
      if (
        entry.type === 'working' &&
        entry.importance >= 0.5 &&
        (entry.expiresAt === null || entry.expiresAt > now)
      ) {
        entry.type = 'episodic';
        entry.expiresAt = now + this.episodicTtlMs;
        consolidated++;
      }
    }

    return consolidated;
  }

  /**
   * Get memory stats for a specific agent or overall.
   */
  getStats(agentId?: string): MemoryStats {
    const now = Date.now();
    const byType: Record<MemoryType, number> = {
      episodic: 0,
      semantic: 0,
      working: 0,
      procedural: 0,
    };

    let total = 0;
    let totalImportance = 0;

    if (agentId !== undefined) {
      // Stats for a single agent
      const entries = this.memories.get(agentId);
      if (entries) {
        for (const entry of entries) {
          // Count only non-expired
          if (entry.expiresAt === null || entry.expiresAt > now) {
            byType[entry.type]++;
            total++;
            totalImportance += entry.importance;
          }
        }
      }
    } else {
      // Stats across all agents
      for (const entries of Array.from(this.memories.values())) {
        for (const entry of entries) {
          if (entry.expiresAt === null || entry.expiresAt > now) {
            byType[entry.type]++;
            total++;
            totalImportance += entry.importance;
          }
        }
      }
    }

    return {
      total,
      byType,
      avgImportance: total > 0 ? totalImportance / total : 0,
    };
  }

  /**
   * Prune expired and (if over limit) low-importance memories.
   * Returns count of pruned memories.
   */
  prune(): number {
    const now = Date.now();
    let pruned = 0;

    for (const [agentId, entries] of Array.from(this.memories.entries())) {
      // Remove expired memories
      const beforeLen = entries.length;
      for (let i = entries.length - 1; i >= 0; i--) {
        if (entries[i].expiresAt !== null && entries[i].expiresAt <= now) {
          entries.splice(i, 1);
        }
      }
      pruned += beforeLen - entries.length;

      // Evict if still over limit
      pruned += this.evictIfNeeded(agentId, entries);
    }

    return pruned;
  }

  /**
   * Clear all memories for a specific agent or all agents.
   */
  clear(agentId?: string): void {
    if (agentId !== undefined) {
      this.memories.delete(agentId);
    } else {
      this.memories.clear();
    }
  }

  /**
   * Get the total number of agents with memories.
   */
  get agentCount(): number {
    return this.memories.size;
  }

  /**
   * Get all agent IDs that have memories.
   */
  getAgentIds(): string[] {
    return Array.from(this.memories.keys());
  }

  /**
   * Evict memories if an agent is over the per-agent limit.
   * Strategy: delete lowest importance first, then oldest on tie.
   * Returns number of evicted entries.
   */
  private evictIfNeeded(agentId: string, entries: MemoryEntry[]): number {
    let evicted = 0;

    while (entries.length > this.maxPerAgent) {
      // Find the entry with the lowest importance; on tie, oldest createdAt
      let worstIdx = 0;
      for (let i = 1; i < entries.length; i++) {
        if (entries[i].importance < entries[worstIdx].importance) {
          worstIdx = i;
        } else if (entries[i].importance === entries[worstIdx].importance) {
          if (entries[i].createdAt < entries[worstIdx].createdAt) {
            worstIdx = i;
          }
        }
      }
      entries.splice(worstIdx, 1);
      evicted++;
    }

    // Clean up empty agent entries
    if (entries.length === 0) {
      this.memories.delete(agentId);
    }

    return evicted;
  }
}

// Singleton export
export const agentMemory = new AgentMemory();
