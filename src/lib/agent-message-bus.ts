/**
 * Agent Message Bus — Bidirectional agent communication module.
 *
 * Provides a lightweight in-process message bus for multi-agent coordination:
 * point-to-point messaging, broadcast, request/reply with timeout, handoff
 * protocol, and a shared blackboard key-value store.
 *
 * Zero external dependencies — pure TypeScript.
 */

// ─── Message Types ──────────────────────────────────────────────────────────

export type MessageType =
  | 'task_request'
  | 'task_result'
  | 'handoff'
  | 'query'
  | 'answer'
  | 'event'
  | 'heartbeat'
  | 'negotiation'
  | 'blackboard_write'
  | 'blackboard_read';

export interface AgentMessage {
  id: string;
  from: string;
  to: string;
  type: MessageType;
  payload: unknown;
  replyTo?: string;
  correlationId?: string;
  createdAt: number;
  ttl: number;
}

export type MessageHandler = (msg: AgentMessage) => void | Promise<void>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function isExpired(msg: AgentMessage): boolean {
  return Date.now() - msg.createdAt > msg.ttl;
}

// ─── AgentMessageBus ────────────────────────────────────────────────────────

export class AgentMessageBus {
  private inbox: Map<string, AgentMessage[]>;
  private handlers: Map<string, MessageHandler[]>;
  private blackboard: Map<string, unknown>;
  private pendingReplies: Map<string, {
    resolve: (msg: AgentMessage) => void;
    reject: (err: Error) => void;
    timer: ReturnType<typeof setTimeout>;
  }>;
  private maxInboxSize: number;
  private maxBlackboardSize: number;

  constructor(opts?: { maxInboxPerAgent?: number; maxBlackboardEntries?: number }) {
    this.inbox = new Map();
    this.handlers = new Map();
    this.blackboard = new Map();
    this.pendingReplies = new Map();
    this.maxInboxSize = opts?.maxInboxPerAgent ?? 100;
    this.maxBlackboardSize = opts?.maxBlackboardEntries ?? 500;
  }

  // ── send ──────────────────────────────────────────────────────────────────

  /**
   * Send a message. Returns the generated message ID.
   * Immediately dispatches to any registered handler for the target agent.
   */
  send(msg: Omit<AgentMessage, 'id' | 'createdAt'>): string {
    const id = generateMessageId();
    const fullMsg: AgentMessage = {
      ...msg,
      id,
      createdAt: Date.now(),
      ttl: msg.ttl ?? 300_000,
    };

    // Queue in target inbox ( '*' is a special broadcast target, skip inbox )
    if (fullMsg.to !== '*') {
      if (!this.inbox.has(fullMsg.to)) {
        this.inbox.set(fullMsg.to, []);
      }
      const agentInbox = this.inbox.get(fullMsg.to)!;
      agentInbox.push(fullMsg);

      // Enforce per-agent inbox size limit — drop oldest
      while (agentInbox.length > this.maxInboxSize) {
        agentInbox.shift();
      }
    }

    // Dispatch to registered handlers immediately
    const targets = fullMsg.to === '*' ? this.getRegisteredAgentIds() : [fullMsg.to];
    for (const agentId of targets) {
      if (agentId === fullMsg.from) continue; // don't deliver to self
      this.dispatchToHandler(agentId, fullMsg);
    }

    // Check if this message is a reply to a pending sendAndWait
    if (fullMsg.replyTo) {
      this.resolvePendingReply(fullMsg);
    }

    return id;
  }

  // ── sendAndWait ───────────────────────────────────────────────────────────

  /**
   * Send a message and return a Promise that resolves with the first reply
   * whose `replyTo` matches the sent message's ID, or rejects on timeout.
   */
  sendAndWait(
    msg: Omit<AgentMessage, 'id' | 'createdAt'>,
    timeoutMs: number = 30_000,
  ): Promise<AgentMessage> {
    const id = this.send(msg);

    return new Promise<AgentMessage>((resolve, reject) => {
      const timer = setTimeout(() => {
        this.pendingReplies.delete(id);
        reject(new Error(`AgentMessageBus: sendAndWait timed out after ${timeoutMs}ms (msg=${id})`));
      }, timeoutMs);

      this.pendingReplies.set(id, { resolve, reject, timer });
    });
  }

  // ── receive ──────────────────────────────────────────────────────────────

  /**
   * Pull messages from an agent's inbox.
   * Optionally filter by `type` and limit the number returned.
   * Auto-prunes expired messages before returning.
   */
  receive(agentId: string, type?: MessageType, limit?: number): AgentMessage[] {
    // Auto-prune
    this.prune();

    const agentInbox = this.inbox.get(agentId);
    if (!agentInbox || agentInbox.length === 0) return [];

    // Filter
    let msgs = type
      ? agentInbox.filter((m) => m.type === type)
      : [...agentInbox];

    // Apply limit
    if (limit !== undefined && limit >= 0) {
      msgs = msgs.slice(0, limit);
    }

    return msgs;
  }

  // ── on ────────────────────────────────────────────────────────────────────

  /**
   * Register a handler for an agent. The handler is invoked synchronously
   * (in the send() call stack) whenever a message is dispatched to that agent.
   * Returns an unsubscribe function.
   */
  on(agentId: string, handler: MessageHandler): () => void {
    if (!this.handlers.has(agentId)) {
      this.handlers.set(agentId, []);
    }
    const list = this.handlers.get(agentId)!;
    list.push(handler);

    // Return unsubscribe
    return () => {
      const idx = list.indexOf(handler);
      if (idx !== -1) list.splice(idx, 1);
      if (list.length === 0) this.handlers.delete(agentId);
    };
  }

  // ── broadcast ─────────────────────────────────────────────────────────────

  /**
   * Broadcast a message to all registered agents (except the sender).
   * Returns an array of message IDs (one per recipient).
   */
  broadcast(from: string, type: MessageType, payload: unknown): string[] {
    const targets = this.getRegisteredAgentIds().filter((id) => id !== from);
    const ids: string[] = [];

    for (const to of targets) {
      const id = this.send({
        from,
        to,
        type,
        payload,
        ttl: 300_000,
      });
      ids.push(id);
    }

    return ids;
  }

  // ── handoff ────────────────────────────────────────────────────────────────

  /**
   * Handoff protocol: transfer task context from one agent to another.
   * Sends a `handoff` message to the target agent with the task context.
   */
  handoff(from: string, to: string, taskContext: unknown, reason?: string): string {
    return this.send({
      from,
      to,
      type: 'handoff',
      payload: {
        taskContext,
        reason: reason ?? 'task handoff',
        handedOverAt: Date.now(),
      },
      ttl: 300_000,
    });
  }

  // ── Blackboard ─────────────────────────────────────────────────────────────

  /**
   * Write a value to the shared blackboard.
   * When capacity is exceeded, the oldest entry (insertion order) is evicted (LRU-like).
   */
  blackboardWrite(key: string, value: unknown): void {
    // If key already exists, delete + re-insert to move to end (LRU touch)
    if (this.blackboard.has(key)) {
      this.blackboard.delete(key);
    }

    this.blackboard.set(key, value);

    // Evict oldest entries if over capacity
    while (this.blackboard.size > this.maxBlackboardSize) {
      const oldestKey = this.blackboard.keys().next().value;
      if (oldestKey !== undefined) {
        this.blackboard.delete(oldestKey);
      }
    }
  }

  /**
   * Read a value from the shared blackboard.
   */
  blackboardRead(key: string): unknown {
    if (!this.blackboard.has(key)) return undefined;
    // LRU touch — re-insert to move to end
    const value = this.blackboard.get(key);
    this.blackboard.delete(key);
    this.blackboard.set(key, value);
    return value;
  }

  /**
   * Get all keys currently in the blackboard.
   */
  blackboardKeys(): string[] {
    return Array.from(this.blackboard.keys());
  }

  /**
   * Clear the entire blackboard.
   */
  blackboardClear(): void {
    this.blackboard.clear();
  }

  // ── getStats ──────────────────────────────────────────────────────────────

  /**
   * Return bus statistics.
   */
  getStats(): {
    registeredAgents: number;
    totalMessages: number;
    inboxSizes: Record<string, number>;
    blackboardSize: number;
  } {
    const inboxSizes: Record<string, number> = {};
    let totalMessages = 0;

    for (const [agentId, msgs] of this.inbox) {
      inboxSizes[agentId] = msgs.length;
      totalMessages += msgs.length;
    }

    return {
      registeredAgents: this.handlers.size,
      totalMessages,
      inboxSizes,
      blackboardSize: this.blackboard.size,
    };
  }

  // ── prune ──────────────────────────────────────────────────────────────────

  /**
   * Remove all expired messages from every inbox.
   * Returns the number of pruned messages.
   */
  prune(): number {
    let pruned = 0;

    for (const [, msgs] of this.inbox) {
      const before = msgs.length;
      const filtered = msgs.filter((m) => !isExpired(m));
      pruned += before - filtered.length;
      msgs.length = 0;
      msgs.push(...filtered);
    }

    // Clean up empty inboxes
    for (const [agentId, msgs] of this.inbox) {
      if (msgs.length === 0) {
        this.inbox.delete(agentId);
      }
    }

    return pruned;
  }

  // ── clear ─────────────────────────────────────────────────────────────────

  /**
   * Clear everything: inboxes, handlers, blackboard, and pending replies.
   */
  clear(): void {
    // Reject all pending replies
    for (const [, pending] of this.pendingReplies) {
      clearTimeout(pending.timer);
      pending.reject(new Error('AgentMessageBus: bus cleared'));
    }
    this.pendingReplies.clear();

    this.inbox.clear();
    this.handlers.clear();
    this.blackboard.clear();
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private getRegisteredAgentIds(): string[] {
    return Array.from(this.handlers.keys());
  }

  private async dispatchToHandler(agentId: string, msg: AgentMessage): Promise<void> {
    const list = this.handlers.get(agentId);
    if (!list || list.length === 0) return;

    for (const handler of list) {
      try {
        await handler(msg);
      } catch {
        // Swallow handler errors to keep the bus operational
      }
    }
  }

  private resolvePendingReply(msg: AgentMessage): void {
    const pending = this.pendingReplies.get(msg.replyTo!);
    if (!pending) return;

    clearTimeout(pending.timer);
    this.pendingReplies.delete(msg.replyTo!);
    pending.resolve(msg);
  }
}

// ─── Singleton ───────────────────────────────────────────────────────────────

export const agentBus = new AgentMessageBus({
  maxInboxPerAgent: 100,
  maxBlackboardEntries: 500,
});
