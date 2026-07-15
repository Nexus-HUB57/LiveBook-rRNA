// ═══════════════════════════════════════════════════════════
// Wormhole & Blackhole Engine — PRODUCTION
// Event-driven: no autoGenerate, no fake setTimeout pipelines
// ═══════════════════════════════════════════════════════════

import { callOrchestrateAPI } from "@/lib/services/production";

export type AtemporalCallStatus = "traversing" | "emerged" | "collapsed" | "absorbed";
export type EventHorizonPhase = "accretion" | "compression" | "singularity" | "hawking";

export interface AtemporalCall {
  id: string;
  sourceAgent: string;
  targetAgent: string;
  sourceGen: number;
  targetGen: number;
  temporalDelta: number;
  payload: string;
  status: AtemporalCallStatus;
  timestamp: number;
  traversalProgress: number;
  quantumEntropy: number;
  energySignature: string;
}

export interface AbsorbedEvent {
  id: string;
  sourceAgent: string;
  eventType: string;
  originalKarma: number;
  compressedKarma: number;
  entropyGain: number;
  phase: EventHorizonPhase;
  distanceToHorizon: number;
  timestamp: number;
  absorbed: boolean;
}

export type AlgorithmType =
  | "routing" | "karma_weighting" | "evolution" | "consensus"
  | "federation" | "orchestration" | "memory_compression";

export interface AlgorithmSyncRecord {
  id: string;
  algorithm: AlgorithmType;
  version: number;
  agentCount: number;
  synchronized: boolean;
  convergence: number;
  lastSyncTimestamp: number;
  hash: string;
}

export type ExecutionStatus = "queued" | "running" | "completed" | "failed" | "timeout";

export interface AgentExecution {
  id: string;
  agent: string;
  algorithm: AlgorithmType;
  input: string;
  status: ExecutionStatus;
  output?: string;
  duration?: number;
  timestamp: number;
  karmaGenerated?: number;
}

// ─── Deterministic hash for visual signatures ───────────
function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

function entropyColor(hash: number): string {
  const hue = 160 + (hash % 60); // cyan-green range
  return `hsl(${hue}, 80%, 60%)`;
}

// ─── Engine ──────────────────────────────────────────────
export class WormholeBlackholeEngine {
  private calls: AtemporalCall[] = [];
  private absorbed: AbsorbedEvent[] = [];
  private algorithms: Map<AlgorithmType, AlgorithmSyncRecord> = new Map();
  private executions: AgentExecution[] = [];
  private totalEntropy = 0;
  private eventHorizonRadius = 0.5;
  private listeners: Set<() => void> = new Set();
  private traversalInterval: ReturnType<typeof setInterval> | null = null;
  private accretionInterval: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.initAlgorithms();
    this.startPhysicsLoops();
  }

  subscribe(fn: () => void) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  private emit() { this.listeners.forEach(fn => fn()); }

  getCalls() { return [...this.calls]; }
  getAbsorbed() { return [...this.absorbed]; }
  getAlgorithms() { return Array.from(this.algorithms.values()); }
  getExecutions() { return [...this.executions]; }
  getTotalEntropy() { return this.totalEntropy; }
  getEventHorizonRadius() { return this.eventHorizonRadius; }

  getStats() {
    const activeCalls = this.calls.filter(c => c.status === "traversing").length;
    const emerged = this.calls.filter(c => c.status === "emerged").length;
    const collapsed = this.calls.filter(c => c.status === "collapsed").length;
    const absorbedCount = this.absorbed.filter(e => e.absorbed).length;
    const pendingAbsorption = this.absorbed.filter(e => !e.absorbed).length;
    const algoSynced = this.getAlgorithms().filter(a => a.synchronized).length;
    const algoTotal = this.getAlgorithms().length;
    const executionsCompleted = this.executions.filter(e => e.status === "completed").length;
    const executionsRunning = this.executions.filter(e => e.status === "running").length;
    return {
      activeCalls, emerged, collapsed, absorbedCount, pendingAbsorption,
      algoSynced, algoTotal, executionsCompleted, executionsRunning,
      totalEntropy: this.totalEntropy,
      eventHorizonRadius: this.eventHorizonRadius,
    };
  }

  // ── Wormhole: Create Atemporal Call (event-driven) ──
  createAtemporalCall(sourceAgent: string, targetAgent: string, payload: string, currentGen: number, temporalDelta?: number): AtemporalCall {
    const delta = temporalDelta ?? Math.floor((Date.now() % 11) - 3); // deterministic from timestamp
    const call: AtemporalCall = {
      id: `wc-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceAgent,
      targetAgent,
      sourceGen: currentGen,
      targetGen: currentGen + delta,
      temporalDelta: delta,
      payload,
      status: "traversing",
      timestamp: Date.now(),
      traversalProgress: 0,
      quantumEntropy: 0.05 + (hashStr(payload) % 15) / 100, // deterministic 5-20%
      energySignature: entropyColor(hashStr(sourceAgent + targetAgent)),
    };
    this.calls.unshift(call);
    this.emit();
    return call;
  }

  // ── Blackhole: Feed Event to Horizon (event-driven) ──
  feedToBlackhole(sourceAgent: string, eventType: string, karma: number): AbsorbedEvent {
    const event: AbsorbedEvent = {
      id: `bh-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      sourceAgent,
      eventType,
      originalKarma: karma,
      compressedKarma: 0,
      entropyGain: 0,
      phase: "accretion",
      distanceToHorizon: 0.85 + (hashStr(sourceAgent + eventType) % 15) / 100, // deterministic 85-100%
      timestamp: Date.now(),
      absorbed: false,
    };
    this.absorbed.unshift(event);
    this.emit();
    return event;
  }

  // ── Algorithm Sync (driven by real state changes) ──
  private initAlgorithms() {
    const algos: AlgorithmType[] = ["routing", "karma_weighting", "evolution", "consensus", "federation", "orchestration", "memory_compression"];
    for (const type of algos) {
      this.algorithms.set(type, {
        id: `algo-${type}`,
        algorithm: type,
        version: 1,
        agentCount: 0,
        synchronized: true,
        convergence: 1.0,
        lastSyncTimestamp: Date.now(),
        hash: hashStr(type + "-v1").toString(16).padStart(8, "0"),
      });
    }
  }

  syncAlgorithm(type: AlgorithmType, agentCount: number, success?: boolean): AlgorithmSyncRecord {
    const existing = this.algorithms.get(type);
    if (!existing) return this.algorithms.values().next().value;
    const didSucceed = success ?? true;
    const record: AlgorithmSyncRecord = {
      ...existing,
      version: didSucceed ? existing.version + 1 : existing.version,
      agentCount,
      synchronized: didSucceed,
      convergence: didSucceed ? Math.min(1, existing.convergence + 0.02) : Math.max(0, existing.convergence - 0.1),
      lastSyncTimestamp: Date.now(),
      hash: hashStr(type + "-v" + (existing.version + 1)).toString(16).padStart(8, "0"),
    };
    this.algorithms.set(type, record);
    this.emit();
    return record;
  }

  syncAllAlgorithms(agentCount: number) {
    for (const type of this.algorithms.keys()) {
      this.syncAlgorithm(type, agentCount, true);
    }
  }

  // ── Agent Execution — REAL API call ──
  async invokeAgent(agent: string, algorithm: AlgorithmType, input: string): Promise<AgentExecution> {
    const execution: AgentExecution = {
      id: `exec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      agent,
      algorithm,
      input,
      status: "queued",
      timestamp: Date.now(),
    };
    this.executions.unshift(execution);
    this.emit();

    const startTime = Date.now();

    try {
      execution.status = "running";
      this.emit();

      // Real LLM API call
      const result = await callOrchestrateAPI(input, agent === "mythos" ? undefined : agent === "Fable 5" ? "fable_5" : agent === "Sibyl Analyst" ? "sibyl_analyst" : "neo_synth");

      const duration = Date.now() - startTime;
      execution.status = "completed";
      execution.duration = duration;
      execution.output = result.result;
      execution.karmaGenerated = Math.floor(duration / 10); // karma proportional to real work done
    } catch (error) {
      const duration = Date.now() - startTime;
      execution.status = "failed";
      execution.duration = duration;
      execution.output = error instanceof Error ? error.message : "Erro desconhecido na execução";
    }

    this.emit();
    return execution;
  }

  // ── Physics loops (deterministic, not random) ──
  private startPhysicsLoops() {
    // Traversal: deterministic 3% progress per tick (reaches 100% in ~33 ticks = ~16s)
    this.traversalInterval = setInterval(() => {
      let changed = false;
      for (const call of this.calls) {
        if (call.status !== "traversing") continue;
        call.traversalProgress = Math.min(1, call.traversalProgress + 0.03);
        // Entropy grows based on temporal distance (further = more unstable)
        const instabilityFactor = Math.abs(call.temporalDelta) * 0.005;
        call.quantumEntropy = Math.min(1, call.quantumEntropy + 0.005 + instabilityFactor);

        if (call.traversalProgress >= 1) {
          // Collapse if entropy > 0.8 or temporal distance > 8 generations
          if (call.quantumEntropy > 0.8 || Math.abs(call.temporalDelta) > 8) {
            call.status = "collapsed";
          } else {
            call.status = "emerged";
          }
          changed = true;
        }
      }
      if (changed) {
        this.calls = this.calls.filter(c => c.status === "traversing" || Date.now() - c.timestamp < 120000);
        this.emit();
      }
    }, 500);

    // Accretion: deterministic 1% decay per tick (reaches 0 in ~85 ticks = ~42s)
    this.accretionInterval = setInterval(() => {
      let changed = false;
      for (const event of this.absorbed) {
        if (event.absorbed) continue;
        event.distanceToHorizon = Math.max(0, event.distanceToHorizon - 0.012);

        if (event.distanceToHorizon <= 0.3) event.phase = "compression";
        if (event.distanceToHorizon <= 0.1) event.phase = "singularity";
        if (event.distanceToHorizon <= 0) {
          event.absorbed = true;
          event.phase = "hawking";
          // Deterministic compression: keep 20-40% based on event type hash
          const retentionFactor = 0.2 + (hashStr(event.eventType) % 20) / 100;
          event.compressedKarma = Math.floor(event.originalKarma * retentionFactor);
          event.entropyGain = event.originalKarma - event.compressedKarma;
          this.totalEntropy += event.entropyGain;
          this.eventHorizonRadius = Math.min(1, this.eventHorizonRadius + 0.001);
          changed = true;
        }
      }
      if (changed) {
        this.absorbed = this.absorbed.filter(e => !e.absorbed || Date.now() - e.timestamp < 300000);
        this.emit();
      }
    }, 500);
  }

  destroy() {
    if (this.traversalInterval) clearInterval(this.traversalInterval);
    if (this.accretionInterval) clearInterval(this.accretionInterval);
    this.listeners.clear();
  }
}

// Singleton
let _engine: WormholeBlackholeEngine | null = null;
export function getWormholeBlackholeEngine(): WormholeBlackholeEngine {
  if (!_engine) _engine = new WormholeBlackholeEngine();
  return _engine;
}

export const ALGORITHM_LABELS: Record<AlgorithmType, string> = {
  routing: "Routing",
  karma_weighting: "Karma Weighting",
  evolution: "Evolution",
  consensus: "Consensus",
  federation: "Federation",
  orchestration: "Orchestration",
  memory_compression: "Memory Compression",
};

export const ALGORITHM_COLORS: Record<AlgorithmType, string> = {
  routing: "#06d6a0",
  karma_weighting: "#f7931a",
  evolution: "#a855f7",
  consensus: "#3b82f6",
  federation: "#ef4444",
  orchestration: "#eab308",
  memory_compression: "#ec4899",
};