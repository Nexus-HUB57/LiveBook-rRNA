/**
 * ═══════════════════════════════════════════════════════════════
 * SANDBOX NATIVO — Type Definitions
 * ═══════════════════════════════════════════════════════════════
 * Core types for the CHIMERA Sandbox: agents, execution,
 * LLM, memory, evolution, and security.
 */

// ─── Agent States ──────────────────────────────────────
export type AgentStatus =
  | 'spawning'
  | 'idle'
  | 'executing'
  | 'learning'
  | 'promoted'
  | 'degraded'
  | 'recycled'
  | 'dead';

export type AgentTier = 'scout' | 'worker' | 'expert' | 'elite' | 'architect';

export type ExecutionLanguage = 'javascript' | 'typescript' | 'python' | 'shell';

// ─── Agent Definition ──────────────────────────────────
export interface SandboxAgent {
  id: string;
  name: string;
  tier: AgentTier;
  status: AgentStatus;
  capabilities: string[];
  permissions: AgentPermissions;
  resources: ResourceLimits;
  metrics: AgentMetrics;
  createdAt: string;
  lastActiveAt: string;
  parentId?: string;
  generation: number;
  snapshotId?: string;
  memorySize: number;
  totalExecutions: number;
  totalErrors: number;
}

export interface AgentPermissions {
  network: boolean;
  filesystem: boolean;
  llmAccess: boolean;
  toolCalling: boolean;
  agentSpawn: boolean;
  maxConcurrentTasks: number;
}

export interface ResourceLimits {
  cpuMs: number;
  memoryMB: number;
  timeoutMs: number;
  maxOutputChars: number;
}

export interface AgentMetrics {
  performanceScore: number;
  successRate: number;
  avgLatencyMs: number;
  tasksCompleted: number;
  tasksFailed: number;
  promotionCount: number;
  recycleCount: number;
}

// ─── Execution ──────────────────────────────────────────
export interface ExecutionRequest {
  code: string;
  language: ExecutionLanguage;
  agentId?: string;
  timeoutMs?: number;
  memoryLimitMB?: number;
  env?: Record<string, string>;
  context?: Record<string, unknown>;
}

export interface ExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  exitCode: number;
  executionTimeMs: number;
  memoryUsedMB: number;
  agentId?: string;
  sandboxId: string;
  timestamp: string;
  logs: string[];
}

// ─── Dedicated LLM ──────────────────────────────────────
export interface DedicatedLLMConfig {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  systemPrompt: string;
  enableMemory: boolean;
  enableToolCalling: boolean;
  enableStreaming: boolean;
}

export interface LLMInteraction {
  id: string;
  agentId?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  model: string;
  provider: string;
  tokens?: { prompt: number; completion: number; total: number };
  latencyMs: number;
}

export interface LLMConversation {
  id: string;
  agentId?: string;
  messages: LLMInteraction[];
  createdAt: string;
  updatedAt: string;
  summary?: string;
}

// ─── Memory & Persistence ───────────────────────────────
export interface MemoryEntry {
  id: string;
  agentId?: string;
  type: 'short_term' | 'long_term' | 'episodic' | 'semantic';
  key: string;
  value: unknown;
  embedding?: number[];
  createdAt: string;
  accessedAt: string;
  accessCount: number;
  ttl?: number;
}

export interface Snapshot {
  id: string;
  agentId: string;
  state: Record<string, unknown>;
  memory: MemoryEntry[];
  metrics: AgentMetrics;
  createdAt: string;
  sizeBytes: number;
}

// ─── Evolution ──────────────────────────────────────────
export interface EvolutionEvent {
  id: string;
  agentId: string;
  type: 'spawn' | 'promote' | 'demote' | 'recycle' | 'mutate' | 'learn' | 'heal';
  reason: string;
  previousTier?: AgentTier;
  newTier?: AgentTier;
  metricsBefore?: AgentMetrics;
  metricsAfter?: AgentMetrics;
  timestamp: string;
}

export interface EvolutionConfig {
  promotionThreshold: number;
  demotionThreshold: number;
  recycleThreshold: number;
  inactivityTimeoutMs: number;
  maxGenerations: number;
  elitePreserveCount: number;
}

// ─── Sandbox Health ─────────────────────────────────────
export interface SandboxHealth {
  status: 'healthy' | 'degraded' | 'critical';
  uptimeMs: number;
  totalAgents: number;
  activeAgents: number;
  totalExecutions: number;
  totalErrors: number;
  llmInteractions: number;
  memoryUsageMB: number;
  memoryLimitMB: number;
  agentsByStatus: Record<AgentStatus, number>;
  agentsByTier: Record<AgentTier, number>;
  evolutionEvents: number;
  snapshots: number;
  gcRuns: number;
}

// ─── Security Audit ─────────────────────────────────────
export interface AuditEntry {
  id: string;
  agentId?: string;
  action: 'execute' | 'llm_call' | 'spawn' | 'recycle' | 'promote' | 'access_memory' | 'snapshot' | 'rollback';
  resource: string;
  result: 'success' | 'denied' | 'error';
  details: string;
  timestamp: string;
}
