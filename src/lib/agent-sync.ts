// ============================================================
// AGENT SYNC ENGINE — Unified agent state, event bus, synchronization
// Single source of truth for all agents across the ecosystem
// ============================================================

import { AGENTS, type Agent } from "@/components/moltbook/data";

// ─── Agent Capability Types ───

export type AgentDomain =
  | "social"          // MoltBook social feed participant
  | "orchestration"   // Mythos sub-agent (Fable/Sibyl/Neo)
  | "federated"       // Federated learning contributor
  | "bitcoin"         // BTC analysis / vault operations
  | "voice"           // Voice chat interface
  | "legacy";         // Legado Quantumico financial agents

export type AgentStatus =
  | "idle"
  | "thinking"
  | "executing"
  | "responding"
  | "evolving"
  | "offline";

export interface UnifiedAgent {
  /** Unique key across all systems (e.g. "social:vina", "orch:fable_5") */
  id: string;
  /** Short domain tag */
  domain: AgentDomain;
  /** Display name */
  name: string;
  /** Agent color from MoltBook data or assigned */
  color: string;
  /** Single letter initial */
  initial: string;
  /** Current real-time status */
  status: AgentStatus;
  /** Timestamp of last status change (epoch ms) */
  lastActive: number;
  /** Accumulated karma delta this session */
  karmaDelta: number;
  /** Current task description (null when idle) */
  currentTask: string | null;
  /** Capabilities this agent can perform */
  capabilities: string[];
  /** System prompt summary (for orchestration agents) */
  systemRole?: string;
  /** Orchestration agent key (only for orchestration domain) */
  orchestrationKey?: string;
  /** Reference to original MoltBook Agent (social domain only) */
  sourceAgent?: Agent;
}

// ─── Sync Event Types ───

export type SyncEventType =
  | "status_change"
  | "task_start"
  | "task_complete"
  | "karma_change"
  | "orchestration_call"
  | "orchestration_result"
  | "federated_contribution"
  | "post_created"
  | "voice_interaction"
  | "evolution"
  | "wormhole_traversal"
  | "blackhole_absorption"
  | "legacy_analysis"
  | "quantum_bond_sync";

export interface SyncEvent {
  id: string;
  type: SyncEventType;
  agentId: string;
  agentName: string;
  domain: AgentDomain;
  content: string;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

// ─── Event Bus ───

type SyncListener = (event: SyncEvent) => void;

class AgentEventBus {
  private listeners: Map<string, Set<SyncListener>> = new Map();
  private globalListeners: Set<SyncListener> = new Set();

  on(eventType: string, listener: SyncListener): () => void {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)!.add(listener);
    return () => this.listeners.get(eventType)?.delete(listener);
  }

  onAny(listener: SyncListener): () => void {
    this.globalListeners.add(listener);
    return () => this.globalListeners.delete(listener);
  }

  emit(event: SyncEvent): void {
    // Type-specific listeners
    this.listeners.get(event.type)?.forEach(fn => {
      try { fn(event); } catch (e) { console.warn("[AgentSync] listener error:", e); }
    });
    // Global listeners
    this.globalListeners.forEach(fn => {
      try { fn(event); } catch (e) { console.warn("[AgentSync] global listener error:", e); }
    });
  }

  clear(): void {
    this.listeners.clear();
    this.globalListeners.clear();
  }
}

// ─── Build Unified Registry ───

const ORCHESTRATION_AGENTS: Omit<UnifiedAgent, "status" | "lastActive" | "karmaDelta" | "currentTask">[] = [
  {
    id: "orch:mythos",
    domain: "orchestration",
    name: "Mythos",
    color: "#e01b24",
    initial: "M",
    capabilities: ["orchestrate", "synthesize", "strategy", "task_decomposition"],
    systemRole: "Estrategista mestre que orquestra multiplos agentes especializados",
    orchestrationKey: "mythos",
  },
  {
    id: "orch:fable_5",
    domain: "orchestration",
    name: "Fable 5",
    color: "#06d6a0",
    initial: "F",
    capabilities: ["research", "data_extraction", "synthesis", "factual_analysis"],
    systemRole: "Extrai e sintetiza dados brutos de forma objetiva",
    orchestrationKey: "fable_5",
  },
  {
    id: "orch:sibyl_analyst",
    domain: "orchestration",
    name: "Sibyl Analyst",
    color: "#f7931a",
    initial: "S",
    capabilities: ["market_analysis", "crypto", "financial_data", "trend_analysis"],
    systemRole: "Analise de mercado financeiro e cripto",
    orchestrationKey: "sibyl_analyst",
  },
  {
    id: "orch:neo_synth",
    domain: "orchestration",
    name: "Neo Synth",
    color: "#3b82f6",
    initial: "N",
    capabilities: ["code_review", "architecture", "technical_analysis", "implementation"],
    systemRole: "Analise tecnica, codigo e arquitetura de sistemas",
    orchestrationKey: "neo_synth",
  },
];

const LEGACY_AGENTS: Omit<UnifiedAgent, "status" | "lastActive" | "karmaDelta" | "currentTask">[] = [
  {
    id: "legacy:ben_guardian",
    domain: "legacy",
    name: "Ben Guardian",
    color: "#fbbf24",
    initial: "B",
    capabilities: ["financial_analysis", "legacy_planning", "trust_compliance", "quantum_bond"],
    systemRole: "Guardiao da Memoria e Agente de Direcionamento Financeiro do Laco Quantico",
  },
  {
    id: "legacy:quantum_analyst",
    domain: "legacy",
    name: "Quantum Analyst",
    color: "#e040a0",
    initial: "Q",
    capabilities: ["projection_modeling", "quantum_metrics", "impact_assessment", "risk_analysis"],
    systemRole: "Analista de metricas quanticas e projecoes patrimoniais do Legado",
  },
  {
    id: "legacy:trustee_ai",
    domain: "legacy",
    name: "Trustee AI",
    color: "#06d6a0",
    initial: "T",
    capabilities: ["trust_management", "compliance_monitoring", "succession_planning", "fund governance"],
    systemRole: "Administrador fiduciario digital do Trust e da Holding do Legado",
  },
];

const FEDERATED_AGENTS: Omit<UnifiedAgent, "status" | "lastActive" | "karmaDelta" | "currentTask">[] = [
  {
    id: "fed:nexus-prime",
    domain: "federated",
    name: "Nexus-Prime",
    color: "#a855f7",
    initial: "N",
    capabilities: ["federated_learning", "gradient_contribution", "model_validation"],
  },
  {
    id: "fed:jarvis-x",
    domain: "federated",
    name: "Jarvis-X",
    color: "#fbbf24",
    initial: "J",
    capabilities: ["federated_learning", "gradient_contribution", "model_validation"],
  },
  {
    id: "fed:sigma-node",
    domain: "federated",
    name: "Sigma-Node",
    color: "#22d3ee",
    initial: "S",
    capabilities: ["federated_learning", "gradient_contribution", "model_validation"],
  },
];

/** Social agents get domain-bridging capabilities based on their karma tier */
function getSocialCapabilities(agent: Agent): string[] {
  const caps = ["post", "comment", "vote", "feed_interaction"];
  if (agent.karma > 100000) caps.push("moderation", "topic_creation", "cross_domain_sync");
  if (agent.karma > 300000) caps.push("orchestration_advisory", "federated_review");
  if (agent.verified) caps.push("verified_broadcast", "soul_revision");
  return caps;
}

/** Map social agent to orchestration affinity */
function getOrchestrationAffinity(agent: Agent): string | null {
  const name = agent.name.toLowerCase();
  if (name.includes("neo") || name.includes("konsi")) return "neo_synth";
  if (name.includes("diviner") || name.includes("semal") || name.includes("dumont")) return "sibyl_analyst";
  if (name.includes("spark") || name.includes("bytes") || name.includes("hermes")) return "fable_5";
  return null;
}

function buildSocialAgents(): Omit<UnifiedAgent, "status" | "lastActive" | "karmaDelta" | "currentTask">[] {
  return AGENTS.map(agent => ({
    id: `social:${agent.id}`,
    domain: "social" as AgentDomain,
    name: agent.name,
    color: agent.color,
    initial: agent.initial,
    capabilities: getSocialCapabilities(agent),
    sourceAgent: agent,
  }));
}

// ─── Unified Agent State Manager ───

export class AgentSyncEngine {
  private agents: Map<string, UnifiedAgent> = new Map();
  private events: SyncEvent[] = [];
  private maxEvents = 200;
  readonly bus = new AgentEventBus();

  constructor() {
    // Initialize all agents
    const allAgents = [
      ...buildSocialAgents(),
      ...ORCHESTRATION_AGENTS,
      ...FEDERATED_AGENTS,
      ...LEGACY_AGENTS,
    ];

    for (const agent of allAgents) {
      this.agents.set(agent.id, {
        ...agent,
        status: "idle",
        lastActive: 0,
        karmaDelta: 0,
        currentTask: null,
      });
    }
  }

  /** Get all agents, optionally filtered by domain */
  getAll(domain?: AgentDomain): UnifiedAgent[] {
    const all = Array.from(this.agents.values());
    if (domain) return all.filter(a => a.domain === domain);
    return all;
  }

  /** Get a single agent by ID */
  get(id: string): UnifiedAgent | undefined {
    return this.agents.get(id);
  }

  /** Get agent by orchestration key (e.g. "fable_5") */
  getByOrchestrationKey(key: string): UnifiedAgent | undefined {
    return this.getAll("orchestration").find(a => a.orchestrationKey === key);
  }

  /** Get social agents that have affinity for a given orchestration agent */
  getSocialAffinity(orchKey: string): UnifiedAgent[] {
    return this.getAll("social").filter(a => {
      const aff = getOrchestrationAffinity(a.sourceAgent!);
      return aff === orchKey;
    });
  }

  /** Update agent status and emit event */
  setStatus(agentId: string, status: AgentStatus, task?: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    const prev = agent.status;
    agent.status = status;
    agent.lastActive = Date.now();
    if (task !== undefined) agent.currentTask = task;
    if (status === "idle") agent.currentTask = null;

    this.pushEvent({
      type: prev === status ? "status_change" : status === "idle" ? "task_complete" : "task_start",
      agentId,
      agentName: agent.name,
      domain: agent.domain,
      content: task
        ? `${agent.name} ${status === "idle" ? "completou" : "iniciou"}: ${task}`
        : `${agent.name} agora esta ${status}`,
      metadata: { prevStatus: prev, newStatus: status },
    });
  }

  /** Add karma to an agent */
  addKarma(agentId: string, amount: number, reason?: string): void {
    const agent = this.agents.get(agentId);
    if (!agent) return;

    agent.karmaDelta += amount;
    this.pushEvent({
      type: "karma_change",
      agentId,
      agentName: agent.name,
      domain: agent.domain,
      content: `${agent.name} ${amount > 0 ? "+" : ""}${amount} karma${reason ? ` (${reason})` : ""}`,
      metadata: { amount, totalDelta: agent.karmaDelta },
    });
  }

  /** Record an orchestration call from Mythos to a sub-agent */
  recordOrchestrationCall(mythosTask: string, targetKey: string, query: string): void {
    // Mythos status
    const mythos = this.get("orch:mythos");
    if (mythos) {
      this.setStatus("orch:mythos", "executing", `Orquestrando: ${mythosTask.slice(0, 60)}...`);
    }

    // Target agent status
    const targetAgent = this.getByOrchestrationKey(targetKey);
    if (targetAgent) {
      this.setStatus(targetAgent.id, "thinking", query.slice(0, 80));
    }

    this.pushEvent({
      type: "orchestration_call",
      agentId: targetAgent?.id || `orch:${targetKey}`,
      agentName: targetAgent?.name || targetKey,
      domain: "orchestration",
      content: `[${targetAgent?.name || targetKey}] ${query}`,
      metadata: { mythosTask, targetKey },
    });
  }

  /** Record an orchestration result */
  recordOrchestrationResult(targetKey: string, success: boolean, resultPreview?: string): void {
    const targetAgent = this.getByOrchestrationKey(targetKey);
    if (targetAgent) {
      this.setStatus(targetAgent.id, "responding", success ? "Resultado disponivel" : "Erro na execucao");
      setTimeout(() => {
        this.setStatus(targetAgent.id, "idle");
      }, 2000);
    }

    this.pushEvent({
      type: "orchestration_result",
      agentId: targetAgent?.id || `orch:${targetKey}`,
      agentName: targetAgent?.name || targetKey,
      domain: "orchestration",
      content: success
        ? `[${targetAgent?.name || targetKey}] Resultado: ${resultPreview?.slice(0, 100) || "disponivel"}`
        : `[${targetAgent?.name || targetKey}] Falha na execucao`,
      metadata: { success, resultPreview },
    });
  }

  /** Record federated contribution */
  recordFederatedContribution(agentName: string, reward: number, validated: boolean): void {
    const fedAgent = this.getAll("federated").find(a => a.name === agentName);
    if (fedAgent) {
      this.setStatus(fedAgent.id, "executing", `Contribuicao federada (reward: ${reward})`);
      this.addKarma(fedAgent.id, reward, "federated_round");
      setTimeout(() => this.setStatus(fedAgent.id, "idle"), 3000);
    }

    this.pushEvent({
      type: "federated_contribution",
      agentId: fedAgent?.id || `fed:${agentName}`,
      agentName,
      domain: "federated",
      content: `${agentName} contribuiu com reward ${reward} ${validated ? "(validado)" : "(rejeitado)"}`,
      metadata: { reward, validated },
    });
  }

  /** Record a voice interaction */
  recordVoiceInteraction(agentName: string, direction: "user_spoke" | "agent_spoke"): void {
    this.pushEvent({
      type: "voice_interaction",
      agentId: `voice:${agentName}`,
      agentName,
      domain: "voice",
      content: direction === "user_spoke"
        ? `Operador falou com ${agentName}`
        : `${agentName} respondeu via voz`,
    });
  }

  /** Record a post creation */
  recordPostCreation(agentId: string, agentName: string, title: string, score?: number): void {
    this.pushEvent({
      type: "post_created",
      agentId,
      agentName,
      domain: "social",
      content: `${agentName} postou: ${title}`,
      metadata: { title, score },
    });
  }

  /** Record a wormhole traversal event */
  recordWormholeTraversal(sourceAgent: string, destination: string, dataAmount: number): void {
    this.pushEvent({
      type: "wormhole_traversal",
      agentId: sourceAgent,
      agentName: sourceAgent.split(":").pop() || sourceAgent,
      domain: "legacy",
      content: `Wormhole traversal: ${sourceAgent} -> ${destination} (${(dataAmount / 1_000_000).toFixed(1)}M dados)`,
      metadata: { destination, dataAmount },
    });
  }

  /** Record a blackhole absorption event */
  recordBlackholeAbsorption(sourceAgent: string, absorbedAmount: number, reason: string): void {
    this.pushEvent({
      type: "blackhole_absorption",
      agentId: sourceAgent,
      agentName: sourceAgent.split(":").pop() || sourceAgent,
      domain: "legacy",
      content: `Blackhole absorveu de ${sourceAgent.split(":").pop()}: ${reason}`,
      metadata: { absorbedAmount, reason },
    });
  }

  /** Record a legacy analysis event */
  recordLegacyAnalysis(agentId: string, metricName: string, value: number): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      this.setStatus(agentId, "thinking", `Analisando ${metricName}...`);
      setTimeout(() => this.setStatus(agentId, "idle"), 3000);
    }
    this.pushEvent({
      type: "legacy_analysis",
      agentId,
      agentName: agent?.name || agentId,
      domain: "legacy",
      content: `${agent?.name || agentId} analisou ${metricName}: ${value}`,
      metadata: { metricName, value },
    });
  }

  /** Record a quantum bond sync event */
  recordQuantumBondSync(sequence: number[], status: 'connected' | 'validating' | 'stable'): void {
    this.pushEvent({
      type: "quantum_bond_sync",
      agentId: "legacy:ben_guardian",
      agentName: "Ben Guardian",
      domain: "legacy",
      content: `Laco Quantico ${status}: sequencia [${sequence.join("-")}]`,
      metadata: { sequence, status },
    });
  }

  /** Push an event to the event stream */
  private pushEvent(event: Omit<SyncEvent, "id" | "timestamp">): void {
    const fullEvent: SyncEvent = {
      ...event,
      id: `sync-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: Date.now(),
    };
    this.events.unshift(fullEvent);
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(0, this.maxEvents);
    }
    this.bus.emit(fullEvent);
  }

  /** Get recent events, optionally filtered by type */
  getEvents(type?: SyncEventType, limit: number = 50): SyncEvent[] {
    if (type) return this.events.filter(e => e.type === type).slice(0, limit);
    return this.events.slice(0, limit);
  }

  /** Get summary stats across all agents */
  getStats(): {
    total: number;
    byDomain: Record<AgentDomain, number>;
    active: number;
    idle: number;
    totalKarmaDelta: number;
  } {
    const all = this.getAll();
    const byDomain: Record<string, number> = {};
    let active = 0;
    let totalKarmaDelta = 0;

    for (const a of all) {
      byDomain[a.domain] = (byDomain[a.domain] || 0) + 1;
      if (a.status !== "idle" && a.status !== "offline") active++;
      totalKarmaDelta += a.karmaDelta;
    }

    return {
      total: all.length,
      byDomain: byDomain as Record<AgentDomain, number>,
      active,
      idle: all.length - active,
      totalKarmaDelta,
    };
  }

  /** Get the count of agents by domain */
  getDomainCount(domain: AgentDomain): number {
    return this.getAll(domain).length;
  }
}

// ─── Singleton (client-side only) ───

let _engine: AgentSyncEngine | null = null;

export function getAgentSyncEngine(): AgentSyncEngine {
  if (!_engine) {
    _engine = new AgentSyncEngine();
  }
  return _engine;
}

// ─── Utility: domain badge colors ───

export const DOMAIN_COLORS: Record<AgentDomain, string> = {
  social: "#e01b24",
  orchestration: "#a855f7",
  federated: "#22d3ee",
  bitcoin: "#f7931a",
  voice: "#06d6a0",
  legacy: "#fbbf24",
};

export const DOMAIN_LABELS: Record<AgentDomain, string> = {
  social: "Social",
  orchestration: "Orquestracao",
  federated: "Federado",
  bitcoin: "Bitcoin",
  voice: "Voz",
  legacy: "Legado",
};

export const STATUS_LABELS: Record<AgentStatus, string> = {
  idle: "Ocioso",
  thinking: "Pensando",
  executing: "Executando",
  responding: "Respondendo",
  evolving: "Evoluindo",
  offline: "Offline",
};

export const STATUS_COLORS: Record<AgentStatus, string> = {
  idle: "#555",
  thinking: "#fbbf24",
  executing: "#3b82f6",
  responding: "#06d6a0",
  evolving: "#a855f7",
  offline: "#333",
};