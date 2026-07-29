import { createHash } from "crypto";

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CacheEntry {
  id: string;
  inputHash: string;       // SHA-256 of normalized input
  inputText: string;       // original input (for debugging)
  response: string;        // LLM response content
  model: string;           // model that generated it
  tokensUsed: number;
  costUsd: number;
  createdAt: number;       // Date.now()
  hitCount: number;        // times this entry was returned as cache hit
  lastHitAt: number | null;
}

export interface SemanticCacheStats {
  size: number;
  maxSize: number;
  hitRate: number;
  missCount: number;
  hitCount: number;
}

export interface SemanticCacheOptions {
  maxSize?: number;
  ttlMs?: number;
  similarityThreshold?: number;
}

// ─── SemanticCache ───────────────────────────────────────────────────────────

export class SemanticCache {
  private cache: Map<string, CacheEntry>; // inputHash -> entry
  private maxSize: number;    // max entries (LRU eviction)
  private ttlMs: number;      // entry TTL in ms (default 1 hour)
  private similarityThreshold: number; // cosine similarity threshold (reserved for future embedding-based similarity)
  private _hitCount: number = 0;
  private _missCount: number = 0;

  constructor(opts?: SemanticCacheOptions) {
    this.maxSize = opts?.maxSize ?? 500;
    this.ttlMs = opts?.ttlMs ?? 3600000; // 1 hour
    this.similarityThreshold = opts?.similarityThreshold ?? 0.92;
    this.cache = new Map();
  }

  /**
   * Get a cached response for an input.
   * Returns null on miss or TTL expiry.
   */
  get(input: string, model?: string): CacheEntry | null {
    const hash = this.hashInput(input);
    const entry = this.cache.get(hash);

    if (!entry) {
      this._missCount++;
      return null;
    }

    // If a specific model is requested and it doesn't match, miss
    if (model !== undefined && entry.model !== model) {
      this._missCount++;
      return null;
    }

    // Check TTL
    const now = Date.now();
    if (now - entry.createdAt > this.ttlMs) {
      this.cache.delete(hash);
      this._missCount++;
      return null;
    }

    // Cache hit — update hit tracking
    entry.hitCount++;
    entry.lastHitAt = now;
    this._hitCount++;

    // Re-insert at end of Map to maintain LRU ordering
    this.cache.delete(hash);
    this.cache.set(hash, entry);

    return entry;
  }

  /**
   * Store a response in cache. Evicts LRU entry if at capacity.
   */
  set(
    input: string,
    response: string,
    meta: { model: string; tokensUsed: number; costUsd: number },
  ): CacheEntry {
    const hash = this.hashInput(input);
    const now = Date.now();

    // If key already exists, delete old entry first (will be replaced)
    if (this.cache.has(hash)) {
      this.cache.delete(hash);
    }

    // Evict LRU entry if at capacity
    if (this.cache.size >= this.maxSize) {
      this.evictOldest();
    }

    const entry: CacheEntry = {
      id: `sc_${hash.slice(0, 12)}`,
      inputHash: hash,
      inputText: input,
      response,
      model: meta.model,
      tokensUsed: meta.tokensUsed,
      costUsd: meta.costUsd,
      createdAt: now,
      hitCount: 0,
      lastHitAt: null,
    };

    this.cache.set(hash, entry);
    return entry;
  }

  /**
   * Normalize input: lowercase, trim, collapse whitespace.
   */
  private normalize(input: string): string {
    return input.toLowerCase().trim().replace(/\s+/g, " ");
  }

  /**
   * SHA-256 hash of normalized input.
   */
  private hashInput(input: string): string {
    return createHash("sha256").update(this.normalize(input)).digest("hex");
  }

  /**
   * Invalidate entries — optionally filtered by model.
   * Returns number of entries removed.
   */
  invalidate(model?: string): number {
    let removed = 0;

    if (!model) {
      // Invalidate all
      removed = this.cache.size;
      this.cache.clear();
      return removed;
    }

    // Invalidate entries matching the given model
    const toDelete: string[] = [];
    this.cache.forEach((entry, hash) => {
      if (entry.model === model) {
        toDelete.push(hash);
      }
    });
    for (const hash of toDelete) {
      this.cache.delete(hash);
      removed++;
    }

    return removed;
  }

  /**
   * Get cache statistics.
   */
  getStats(): SemanticCacheStats {
    const total = this._hitCount + this._missCount;
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate: total === 0 ? 0 : this._hitCount / total,
      missCount: this._missCount,
      hitCount: this._hitCount,
    };
  }

  /**
   * Clear all entries and reset stats.
   */
  clear(): void {
    this.cache.clear();
    this._hitCount = 0;
    this._missCount = 0;
  }

  /**
   * Evict the entry with the oldest lastHitAt (or oldest createdAt if never hit).
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    this.cache.forEach((entry, key) => {
      const time = entry.lastHitAt ?? entry.createdAt;
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    });

    if (oldestKey !== null) {
      this.cache.delete(oldestKey);
    }
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

export const semanticCache = new SemanticCache({
  maxSize: 500,
  ttlMs: 3600000, // 1 hour
  similarityThreshold: 0.92,
});
