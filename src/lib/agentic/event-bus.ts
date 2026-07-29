/**
 * CHIMERA v4.0 — Agent Event Bus
 * In-process pub/sub with SSE streaming support.
 * Supports backpressure via buffer limit.
 */

import type { AgentEvent, AgentEventType } from './types';
import { v4 as uuid } from 'uuid';

const MAX_BUFFER_SIZE = 1000;

type EventHandler = (event: AgentEvent) => void;

class AgentEventBusSingleton {
  private subscribers: Map<string, Set<EventHandler>> = new Map();
  private globalHandlers: Set<EventHandler> = new Set();
  private buffer: AgentEvent[] = [];
  private sseClients: Map<string, (data: string) => void> = new Map();
  private sseClientId = 0;

  /** Subscribe to a specific event type */
  on(type: AgentEventType, handler: EventHandler): () => void {
    if (!this.subscribers.has(type)) this.subscribers.set(type, new Set());
    this.subscribers.get(type)!.add(handler);
    return () => this.subscribers.get(type)?.delete(handler);
  }

  /** Subscribe to all events */
  onAny(handler: EventHandler): () => void {
    this.globalHandlers.add(handler);
    return () => this.globalHandlers.delete(handler);
  }

  /** Emit an event to all subscribers */
  emit(event: AgentEvent): void {
    event.id = event.id || uuid();
    event.timestamp = event.timestamp || new Date().toISOString();

    // Buffer for late subscribers
    this.buffer.push(event);
    if (this.buffer.length > MAX_BUFFER_SIZE) {
      this.buffer.shift();
    }

    // Type-specific handlers
    const handlers = this.subscribers.get(event.type);
    if (handlers) {
      for (const h of handlers) {
        try { h(event); } catch { /* swallow handler errors */ }
      }
    }

    // Global handlers
    for (const h of this.globalHandlers) {
      try { h(event); } catch { /* swallow handler errors */ }
    }

    // SSE broadcast
    const data = `data: ${JSON.stringify(event)}\n\n`;
    for (const [, send] of this.sseClients) {
      try { send(data); } catch { /* client disconnected */ }
    }
  }

  /** Register an SSE client, returns unsubscribe function */
  registerSSE(send: (data: string) => void): string {
    const id = `sse_${++this.sseClientId}`;
    this.sseClients.set(id, send);
    return id;
  }

  /** Remove an SSE client */
  unregisterSSE(id: string): void {
    this.sseClients.delete(id);
  }

  /** Get recent events from buffer */
  getRecent(limit = 50, type?: AgentEventType): AgentEvent[] {
    let events = this.buffer;
    if (type) events = events.filter(e => e.type === type);
    return events.slice(-limit);
  }

  /** Get stats */
  getStats() {
    return {
      subscriberTypes: this.subscribers.size,
      globalHandlers: this.globalHandlers.size,
      sseClients: this.sseClients.size,
      bufferSize: this.buffer.length,
      maxBufferSize: MAX_BUFFER_SIZE,
    };
  }
}

// Singleton
let _bus: AgentEventBusSingleton | null = null;
export const AgentEventBus = {
  getInstance(): AgentEventBusSingleton {
    if (!_bus) _bus = new AgentEventBusSingleton();
    return _bus;
  },
};
