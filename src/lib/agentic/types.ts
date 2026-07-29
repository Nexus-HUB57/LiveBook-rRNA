/**
 * CHIMERA v4.0 — Última Onda Agentic AI
 * Core Type Definitions for the Agentic Runtime
 */

export type AgentRole = 'orchestrator' | 'specialist' | 'analyst' | 'researcher' | 'coder' | 'reviewer' | 'guardian';
export type AgentStatus = 'idle' | 'thinking' | 'executing' | 'waiting' | 'error' | 'completed';
export type ToolExecutionStatus = 'pending' | 'running' | 'success' | 'error' | 'cancelled';
export type TaskPriority = 'critical' | 'high' | 'medium' | 'low';
export type TaskStatus = 'pending' | 'planning' | 'in_progress' | 'blocked' | 'review' | 'done' | 'failed' | 'cancelled';
export type MemoryType = 'episodic' | 'semantic' | 'procedural' | 'working';
export type MCPTransport = 'stdio' | 'sse' | 'streamable-http';

export interface AgentConfig {
  id: string;
  name: string;
  role: AgentRole;
  systemPrompt: string;
  model: string;
  provider: string;
  temperature?: number;
  maxTokens?: number;
  tools?: string[];
  maxSteps?: number;
  handoffTargets?: string[];
}

export interface AgentState {
  agentId: string;
  status: AgentStatus;
  currentTaskId: string | null;
  memoryCount: number;
  toolCallCount: number;
  totalTokensUsed: number;
  lastActivityAt: string;
  createdAt: string;
}

export interface ToolDefinition {
  id: string;
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  handler: string;
  category?: string;
  requiresAuth?: boolean;
  rbacRoles?: string[];
  timeoutMs?: number;
  isMCP?: boolean;
  mcpServer?: string;
}

export interface ToolCall {
  id: string;
  toolId: string;
  agentId: string;
  taskId: string;
  arguments: Record<string, unknown>;
  status: ToolExecutionStatus;
  result?: unknown;
  error?: string;
  startedAt?: string;
  completedAt?: string;
  durationMs?: number;
  tokensUsed?: number;
}

export interface Task {
  id: string;
  parentId?: string;
  agentId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  status: TaskStatus;
  assignedModel: string;
  assignedProvider: string;
  plan?: Plan;
  steps: TaskStep[];
  result?: unknown;
  error?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface Plan {
  steps: PlanStep[];
  strategy: 'sequential' | 'parallel' | 'adaptive' | 'branching';
  estimatedTokens?: number;
  estimatedCostUsd?: number;
}

export interface PlanStep {
  id: string;
  action: string;
  tool?: string;
  reasoning: string;
  dependencies: string[];
  status: TaskStatus;
  result?: unknown;
}

export interface TaskStep {
  id: string;
  taskId: string;
  stepNumber: number;
  action: string;
  toolCallId?: string;
  reasoning: string;
  observation?: string;
  status: ToolExecutionStatus;
  tokensUsed?: number;
  createdAt: string;
}

export interface MemoryEntry {
  id: string;
  agentId: string;
  taskId?: string;
  type: MemoryType;
  content: string;
  embedding?: number[];
  importance: number;
  accessCount: number;
  lastAccessedAt: string;
  expiresAt?: string;
  createdAt: string;
  metadata?: Record<string, unknown>;
}

export interface MemoryQuery {
  agentId?: string;
  taskId?: string;
  type?: MemoryType;
  query?: string;
  limit?: number;
  minImportance?: number;
}

export interface MCPServerConfig {
  id: string;
  name: string;
  transport: MCPTransport;
  command?: string;
  url?: string;
  env?: Record<string, string>;
  headers?: Record<string, string>;
  enabled: boolean;
  tools?: MCPToolInfo[];
  connected: boolean;
  lastPing?: string;
}

export interface MCPToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  serverId: string;
}

export interface MCPToolCall {
  serverId: string;
  toolName: string;
  arguments: Record<string, unknown>;
}

export interface AgentLoopConfig {
  maxIterations: number;
  maxTokensPerStep: number;
  reasoningEffort?: 'low' | 'medium' | 'high';
  strategy: 'react' | 'plan-and-execute' | 'multi-agent' | 'hybrid';
  verbose?: boolean;
  onStep?: (step: LoopStep) => void;
}

export interface LoopStep {
  iteration: number;
  type: 'thinking' | 'tool_call' | 'tool_result' | 'observation' | 'handoff' | 'final_answer';
  content: string;
  toolCall?: ToolCall;
  agentId?: string;
  targetAgentId?: string;
  tokensUsed?: number;
  timestamp: string;
}

export interface AgentLoopResult {
  success: boolean;
  finalAnswer: string;
  steps: LoopStep[];
  totalTokensUsed: number;
  totalDurationMs: number;
  totalToolCalls: number;
  agentId: string;
  taskId: string;
  costUsd: number;
}

export type AgentEventType = 
  | 'agent.status_change' | 'agent.thinking' | 'agent.tool_call'
  | 'agent.tool_result' | 'agent.handoff' | 'agent.error'
  | 'agent.completed' | 'task.created' | 'task.status_change'
  | 'task.completed' | 'memory.created' | 'memory.retrieved'
  | 'mcp.server_connected' | 'mcp.server_disconnected' | 'mcp.tool_registered';

export interface AgentEvent {
  id: string;
  type: AgentEventType;
  agentId?: string;
  taskId?: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface ExecutionContext {
  agent: AgentConfig;
  task: Task;
  memory: MemoryEntry[];
  availableTools: ToolDefinition[];
  mcpServers: MCPServerConfig[];
  loopConfig: AgentLoopConfig;
}

export interface HandoffRequest {
  fromAgentId: string;
  toAgentId: string;
  taskId: string;
  reason: string;
  context: string;
  priority: TaskPriority;
}

export interface HandoffResult {
  accepted: boolean;
  fromAgentId: string;
  toAgentId: string;
  taskId: string;
  message?: string;
}
