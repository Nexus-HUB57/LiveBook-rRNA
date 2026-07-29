/**
 * CHIMERA — Distributed Rate Limiting Layer (Sticky Session)
 *
 * Since CHIMERA uses SQLite (not Redis), this module implements a
 * "sticky session" guarantee approach:
 *   - Single-instance: this IS the source of truth
 *   - Multi-instance: best-effort with sticky-session routing
 *
 * API-compatible with the existing TokenBucket from algorithms.ts.
 * Zero external dependencies — pure TypeScript.
 */

import { LIVE_LAB_MANIFESTO } from './live-lab/manifesto';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

interface RateLimitState {
  /** Current token count (can be fractional after refill) */
  tokens: number;
  /** Timestamp (ms) of last token refill */
  lastRefill: number;
  /** Timestamp (ms) of last access (read or write) — drives LRU + TTL */
  lastRequest: number;
}

export interface ConsumeResult {
  allowed: boolean;
  remaining: number;
  resetMs: number;
}

export interface TieredConsumeResult extends ConsumeResult {
  tier: string;
}

export interface StateSnapshot {
  tokens: number;
  remaining: number;
}

export interface LimiterStatus {
  entries: number;
  maxEntries: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Entries not accessed for this duration are considered expired */
const DEFAULT_TTL_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Tier definitions from the manifesto. These are the authoritative
 * per-minute rate limits extracted from politicas_governanca.rate_limiting.
 *
 *   basic:        10 req/min
 *   intermediate: 30 req/min
 *   advanced:     60 req/min
 *   admin:        120 req/min
 */
const DEFAULT_TIERS: Record<string, { reqPerMin: number }> = {
  basic: { reqPerMin: 10 },
  intermediate: { reqPerMin: 30 },
  advanced: { reqPerMin: 60 },
  admin: { reqPerMin: 120 },
};

// ─────────────────────────────────────────────────────────────────────────────
// A. StickySessionRateLimiter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * In-memory token-bucket rate limiter with LRU eviction and TTL.
 *
 * Per-identity state is stored in a Map which preserves insertion order.
 * Every access (read or write) moves the entry to the end of the Map,
 * making the first entry the least-recently-used — ready for O(1) eviction.
 *
 * On single-instance deployment this is the source of truth.
 * On multi-instance deployments this provides best-effort rate limiting
 * when combined with sticky-session routing.
 */
export class StickySessionRateLimiter {
  /** Per-identity state: Map<identity, RateLimitState> */
  private state: Map<string, RateLimitState> = new Map();

  /** Maximum number of entries before LRU eviction kicks in */
  private maxSize: number;

  /** Maximum token count (bucket capacity) */
  private defaultMaxTokens: number;

  /** Tokens refilled per millisecond */
  private defaultRefillRate: number;

  /** TTL in ms — entries idle longer than this are pruned */
  private ttlMs: number;

  constructor(
    maxTokens = 60,
    refillPerSecond = 1,
    maxEntries = 10_000,
    ttlMs = DEFAULT_TTL_MS,
  ) {
    this.defaultMaxTokens = maxTokens;
    this.defaultRefillRate = refillPerSecond / 1000; // convert to per-ms
    this.maxSize = maxEntries;
    this.ttlMs = ttlMs;
  }

  // ── Internal helpers ───────────────────────────────────────────────────

  /** Refill tokens for a given identity based on elapsed time */
  private refill(entry: RateLimitState): void {
    const now = Date.now();
    const elapsed = now - entry.lastRefill;
    if (elapsed <= 0) return;

    const tokensToAdd = elapsed * this.defaultRefillRate;
    entry.tokens = Math.min(this.defaultMaxTokens, entry.tokens + tokensToAdd);
    entry.lastRefill = now;
  }

  /**
   * Touch an entry: update lastRequest and move to end of Map for LRU.
   * This is the core of the LRU strategy — Map preserves insertion order,
   * so re-inserting makes this the most-recently-used.
   */
  private touch(identity: string, entry: RateLimitState): void {
    const now = Date.now();
    entry.lastRequest = now;
    // Re-insert to move to end (most recently used)
    this.state.delete(identity);
    this.state.set(identity, entry);
  }

  /**
   * Get or create state for an identity. Creates at full capacity.
   * Triggers LRU eviction if adding would exceed maxSize.
   */
  private getOrCreate(identity: string): RateLimitState {
    const existing = this.state.get(identity);
    if (existing) return existing;

    // Evict LRU entries if at capacity
    while (this.state.size >= this.maxSize) {
      // First key in Map iteration order is the least recently used
      const firstKey = this.state.keys().next().value;
      if (firstKey !== undefined) {
        this.state.delete(firstKey);
      } else {
        break;
      }
    }

    const now = Date.now();
    const entry: RateLimitState = {
      tokens: this.defaultMaxTokens,
      lastRefill: now,
      lastRequest: now,
    };
    this.state.set(identity, entry);
    return entry;
  }

  // ── Public API ─────────────────────────────────────────────────────────

  /**
   * Attempt to consume tokens for a given identity.
   *
   * @param identity  Unique identifier (API key, user ID, IP, etc.)
   * @param cost      Number of tokens to consume (default 1)
   * @returns Object with allowed status, remaining tokens, and reset time
   */
  consume(identity: string, cost = 1): ConsumeResult {
    const entry = this.getOrCreate(identity);
    this.refill(entry);

    const now = Date.now();
    const allowed = entry.tokens >= cost;

    if (allowed) {
      entry.tokens -= cost;
    }

    // Touch to update LRU position
    this.touch(identity, entry);

    // Calculate when the bucket will be fully refilled
    const deficit = this.defaultMaxTokens - entry.tokens;
    const refillMsNeeded =
      this.defaultRefillRate > 0
        ? Math.ceil(deficit / this.defaultRefillRate)
        : 0;
    const resetMs = now + refillMsNeeded;

    return {
      allowed,
      remaining: Math.max(0, Math.floor(entry.tokens)),
      resetMs,
    };
  }

  /**
   * Get current state snapshot for an identity.
   * Triggers refill and LRU touch but does not consume tokens.
   */
  getState(identity: string): StateSnapshot {
    const entry = this.getOrCreate(identity);
    this.refill(entry);
    this.touch(identity, entry);

    return {
      tokens: entry.tokens,
      remaining: Math.max(0, Math.floor(entry.tokens)),
    };
  }

  /**
   * Reset an identity's bucket to full capacity.
   * Useful for admin overrides or testing.
   */
  reset(identity: string): void {
    const now = Date.now();
    const entry: RateLimitState = {
      tokens: this.defaultMaxTokens,
      lastRefill: now,
      lastRequest: now,
    };
    // Delete then re-set to update LRU position
    this.state.delete(identity);
    this.state.set(identity, entry);
  }

  /**
   * Prune expired entries (not accessed for longer than TTL).
   *
   * @returns Number of entries removed
   */
  prune(): number {
    const now = Date.now();
    const cutoff = now - this.ttlMs;
    let removed = 0;

    // Collect keys to delete (can't delete during iteration)
    const toDelete: string[] = [];
    this.state.forEach((entry, key) => {
      if (entry.lastRequest < cutoff) {
        toDelete.push(key);
      }
    });

    for (const key of toDelete) {
      this.state.delete(key);
      removed++;
    }

    return removed;
  }

  /**
   * Get limiter status (current entry count vs. max).
   */
  getStatus(): LimiterStatus {
    return {
      entries: this.state.size,
      maxEntries: this.maxSize,
    };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// B. TieredRateLimiter
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Rate limiter that applies different limits based on persona RBAC tier.
 *
 * Each tier gets its own StickySessionRateLimiter instance with
 * the appropriate token bucket size and refill rate derived from
 * the tier's reqPerMin value.
 *
 * Tier lookup is O(1) via a pre-built Map.
 */
export class TieredRateLimiter {
  /** One StickySessionRateLimiter per tier */
  private limiters: Map<string, StickySessionRateLimiter> = new Map();

  /** Tier configuration (reqPerMin per tier name) */
  private tiers: Record<string, { reqPerMin: number }>;

  /** Default tier used when an unknown tier is requested */
  private defaultTier: string;

  /** Max entries per underlying limiter */
  private maxEntriesPerLimiter: number;

  constructor(
    tiers: Record<string, { reqPerMin: number }>,
    defaultTier = 'basic',
    maxEntriesPerLimiter = 10_000,
  ) {
    this.tiers = { ...tiers };
    this.defaultTier = defaultTier;
    this.maxEntriesPerLimiter = maxEntriesPerLimiter;

    // Create a StickySessionRateLimiter for each tier
    for (const [tierName, config] of Object.entries(this.tiers)) {
      this.limiters.set(
        tierName,
        new StickySessionRateLimiter(
          config.reqPerMin,      // maxTokens = reqPerMin (full burst)
          config.reqPerMin / 60, // refillPerSecond = reqPerMin / 60
          maxEntriesPerLimiter,
        ),
      );
    }

    // Ensure default tier exists
    if (!this.limiters.has(defaultTier)) {
      const fallbackConfig = this.tiers['basic'] ?? { reqPerMin: 10 };
      this.limiters.set(
        defaultTier,
        new StickySessionRateLimiter(
          fallbackConfig.reqPerMin,
          fallbackConfig.reqPerMin / 60,
          maxEntriesPerLimiter,
        ),
      );
      this.tiers[defaultTier] = fallbackConfig;
    }
  }

  /**
   * Check rate limit for an identity at a given tier.
   *
   * If the tier is not recognized, falls back to the default tier.
   *
   * @param identity  Unique identifier for the client
   * @param tier      RBAC tier name (e.g., 'basic', 'admin')
   * @returns Rate limit result including the effective tier used
   */
  check(identity: string, tier: string): TieredConsumeResult {
    // Resolve to effective tier (fall back to default if unknown)
    const effectiveTier = this.limiters.has(tier) ? tier : this.defaultTier;
    const limiter = this.limiters.get(effectiveTier)!;

    const result = limiter.consume(identity);

    return {
      ...result,
      tier: effectiveTier,
    };
  }

  /**
   * Get the state for a specific identity at a given tier.
   */
  getState(identity: string, tier: string): StateSnapshot {
    const effectiveTier = this.limiters.has(tier) ? tier : this.defaultTier;
    return this.limiters.get(effectiveTier)!.getState(identity);
  }

  /**
   * Reset rate limit state for a specific identity at a given tier.
   */
  reset(identity: string, tier: string): void {
    const effectiveTier = this.limiters.has(tier) ? tier : this.defaultTier;
    this.limiters.get(effectiveTier)!.reset(identity);
  }

  /**
   * Prune expired entries across all tier limiters.
   *
   * @returns Total number of entries pruned across all tiers
   */
  pruneAll(): number {
    let total = 0;
    this.limiters.forEach((limiter) => {
      total += limiter.prune();
    });
    return total;
  }

  /**
   * Get combined status across all tier limiters.
   */
  getStatus(): Record<string, LimiterStatus> {
    const result: Record<string, LimiterStatus> = {};
    this.limiters.forEach((limiter, tierName) => {
      result[tierName] = limiter.getStatus();
    });
    return result;
  }

  /** Get the list of configured tier names */
  getTiers(): string[] {
    return Object.keys(this.tiers);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// C. Integration Helper — Singleton pre-configured with manifesto tiers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Extract rate limit tiers from the Live Lab manifesto's governance policies.
 * Falls back to DEFAULT_TIERS if the manifesto data is unavailable.
 */
function extractTiersFromManifesto(): Record<string, { reqPerMin: number }> {
  try {
    const rateLimiting = LIVE_LAB_MANIFESTO?.politicas_governanca?.rate_limiting;
    if (!rateLimiting || typeof rateLimiting !== 'object') {
      return { ...DEFAULT_TIERS };
    }

    const tiers: Record<string, { reqPerMin: number }> = {};
    for (const [tierName, config] of Object.entries(rateLimiting)) {
      const cfg = config as { req_per_min?: number };
      if (typeof cfg.req_per_min === 'number' && cfg.req_per_min > 0) {
        tiers[tierName] = { reqPerMin: cfg.req_per_min };
      }
    }

    // Ensure we have at least the default tier
    if (Object.keys(tiers).length === 0) {
      return { ...DEFAULT_TIERS };
    }

    return tiers;
  } catch {
    return { ...DEFAULT_TIERS };
  }
}

/**
 * Singleton TieredRateLimiter pre-configured with manifesto RBAC tiers.
 *
 * Usage:
 * ```ts
 * import { tieredRateLimiter } from '@/lib/distributed-rate-limit';
 *
 * const result = tieredRateLimiter.check('user-123', 'advanced');
 * if (!result.allowed) {
 *   // Return 429 with result.remaining and result.resetMs
 * }
 * ```
 */
export const tieredRateLimiter: TieredRateLimiter = new TieredRateLimiter(
  extractTiersFromManifesto(),
  'basic', // default tier for unknown/unrecognized tiers
);
