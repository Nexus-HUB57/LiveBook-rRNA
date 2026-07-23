/**
 * ═══════════════════════════════════════════════════════════════
 * SANDBOX NATIVO — Main Orchestrator (Barrel Export)
 * ═══════════════════════════════════════════════════════════════
 * Unified entry point for the CHIMERA Sandbox Nativo.
 */

// ─── Types ──────────────────────────────────────────────
export type {
  AgentStatus, AgentTier, ExecutionLanguage,
  SandboxAgent, AgentPermissions, ResourceLimits, AgentMetrics,
  ExecutionRequest, ExecutionResult,
  DedicatedLLMConfig, LLMInteraction, LLMConversation,
  MemoryEntry, Snapshot, EvolutionEvent, AuditEntry,
  SandboxHealth, EvolutionConfig,
} from './types';

// ─── Execution Engine ───────────────────────────────────
export { executeInSandbox, validateCodeSafety } from './execution-engine';

// ─── Agent Lifecycle ────────────────────────────────────
export {
  spawnAgent, executeAgentTask, agentLearn, healAgent,
  recycleAgent, promoteAgent, demoteAgent, purgeRecycled,
} from './agent-lifecycle';

// ─── Dedicated LLM ──────────────────────────────────────
export {
  dedicatedLLMChat, dedicatedLLMStream,
  getLLMConfig, updateLLMConfig, getDedicatedLLMStatus,
} from './dedicated-llm';

// ─── Evolution Engine ───────────────────────────────────
export {
  runEvolutionCycle, getEvolutionStats,
  getEvolutionConfig, updateEvolutionConfig,
} from './evolution-engine';

// ─── Memory Store ───────────────────────────────────────
export {
  getAllAgents, getAgent, getAgentsByStatus,
  getAllConversations, getConversation,
  getMemoryEntries, getSnapshots,
  getEvolutionEvents, getAuditLog,
  runGarbageCollection, getSandboxHealth,
} from './memory-store';
