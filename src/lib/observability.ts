/**
 * CHIMERA Observability Module
 * ============================
 * Structured JSON logging, in-memory metrics, and in-process tracing.
 * Zero external dependencies — pure TypeScript for MVP.
 */

// ────────────────────────────────────────────────────────────────────────────
// A. Structured JSON Logger
// ────────────────────────────────────────────────────────────────────────────

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  module: string;
  correlationId?: string;
  requestId?: string;
  meta?: Record<string, unknown>;
}

/** Optional context that can be passed via headers or explicit args. */
export interface LogContext {
  correlationId?: string;
  requestId?: string;
}

export class ChimeraLogger {
  private readonly module: string;

  constructor(module: string) {
    this.module = module;
  }

  /** Extract correlationId / requestId from a Headers-like object. */
  private static extractContext(
    headers?: { get: (name: string) => string | null } | LogContext,
  ): LogContext {
    if (!headers) return {};
    // If it already looks like a plain context object (no `get` function), return it
    if (
      typeof (headers as LogContext).correlationId === 'string' ||
      typeof (headers as LogContext).requestId === 'string'
    ) {
      return headers as LogContext;
    }
    // Treat as Headers-like
    const h = headers as { get: (name: string) => string | null };
    return {
      correlationId: h.get('x-correlation-id') ?? undefined,
      requestId: h.get('x-request-id') ?? undefined,
    };
  }

  private emit(
    level: LogLevel,
    message: string,
    metaOrHeaders?: Record<string, unknown> | LogContext | { get: (name: string) => string | null },
  ): void {
    // Detect if the last arg is a Headers-like object (context extraction)
    let context: LogContext = {};
    let meta: Record<string, unknown> | undefined;

    if (metaOrHeaders !== undefined) {
      if (metaOrHeaders && typeof (metaOrHeaders as { get: unknown }).get === 'function') {
        // Headers-like
        context = ChimeraLogger.extractContext(
          metaOrHeaders as { get: (name: string) => string | null },
        );
      } else if (
        (metaOrHeaders as LogContext).correlationId !== undefined ||
        (metaOrHeaders as LogContext).requestId !== undefined
      ) {
        // Plain context with correlationId/requestId but no `get`
        const ctx = metaOrHeaders as LogContext;
        context = { correlationId: ctx.correlationId, requestId: ctx.requestId };
        // Any extra keys become meta
        meta = { ...(metaOrHeaders as Record<string, unknown>) };
        delete (meta as Record<string, unknown>).correlationId;
        delete (meta as Record<string, unknown>).requestId;
        if (Object.keys(meta).length === 0) meta = undefined;
      } else {
        meta = metaOrHeaders as Record<string, unknown>;
      }
    }

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      module: this.module,
      ...(context.correlationId ? { correlationId: context.correlationId } : {}),
      ...(context.requestId ? { requestId: context.requestId } : {}),
      ...(meta ? { meta } : {}),
    };

    // Output as JSON to stdout (structured logging)
    // error goes to stderr for log aggregation
    const out = level === 'error' ? console.error : console.log;
    out(JSON.stringify(entry));
  }

  info(msg: string, meta?: Record<string, unknown> | LogContext): void {
    this.emit('info', msg, meta);
  }

  warn(msg: string, meta?: Record<string, unknown> | LogContext): void {
    this.emit('warn', msg, meta);
  }

  error(msg: string, meta?: Record<string, unknown> | LogContext): void {
    this.emit('error', msg, meta);
  }

  debug(msg: string, meta?: Record<string, unknown> | LogContext): void {
    this.emit('debug', msg, meta);
  }
}

/** Singleton root logger */
export const logger = new ChimeraLogger('chimera');

/** Factory for module-scoped loggers */
export function createLogger(module: string): ChimeraLogger {
  return new ChimeraLogger(module);
}

// ────────────────────────────────────────────────────────────────────────────
// B. In-Memory Metrics Collector
// ────────────────────────────────────────────────────────────────────────────

const HISTOGRAM_BUCKETS = [10, 50, 100, 250, 500, 1000, 2500, 5000, 10000];

interface MetricCounter {
  type: 'counter';
  value: number;
  labels: Record<string, string>;
}

interface MetricGauge {
  type: 'gauge';
  value: number;
  labels: Record<string, string>;
}

interface MetricHistogram {
  type: 'histogram';
  values: number[];
  labels: Record<string, string>;
}

type MetricEntry = MetricCounter | MetricGauge | MetricHistogram;

/** Help text registry for Prometheus output */
const METRIC_HELP: Record<string, string> = {
  chimera_routing_total: 'Total routing decisions',
  chimera_skill_execution_duration_ms: 'Duration of skill executions in milliseconds',
  chimera_tokens_total: 'Total tokens consumed',
  chimera_cost_usd_total: 'Total cost in USD',
  chimera_fallback_total: 'Total provider fallback events',
  chimera_llm_request_duration_ms: 'Duration of LLM requests in milliseconds',
};

/** Sort label keys and produce Prometheus label string like {k1="v1",k2="v2"} */
function formatLabels(labels: Record<string, string>): string {
  const keys = Object.keys(labels).sort();
  if (keys.length === 0) return '';
  const inner = keys.map(k => `${k}="${labels[k]}"`).join(',');
  return `{${inner}}`;
}

/** Escape Prometheus help text */
function escapeHelp(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n');
}

export class ChimeraMetrics {
  private metrics: Map<string, MetricEntry[]> = new Map();

  private getOrCreate(
    name: string,
    type: 'counter' | 'gauge' | 'histogram',
    labels: Record<string, string>,
  ): MetricEntry {
    let entries = this.metrics.get(name);
    if (!entries) {
      entries = [];
      this.metrics.set(name, entries);
    }
    let entry: MetricEntry | undefined = entries.find(
      e => JSON.stringify(e.labels) === JSON.stringify(labels),
    );
    if (!entry) {
      const newEntry: MetricEntry =
        type === 'histogram'
          ? { type: 'histogram', values: [], labels }
          : { type, value: 0, labels };
      entries.push(newEntry);
      entry = newEntry;
    }
    return entry;
  }

  /** Increment a counter by 1 (or a given amount). */
  incCounter(
    name: string,
    labels?: Record<string, string>,
    amount: number = 1,
  ): void {
    const entry = this.getOrCreate(name, 'counter', labels ?? {});
    (entry as MetricCounter).value += amount;
  }

  /** Record a value in a histogram. */
  observeHistogram(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    const entry = this.getOrCreate(name, 'histogram', labels ?? {});
    (entry as MetricHistogram).values.push(value);
  }

  /** Set a gauge value. */
  setGauge(
    name: string,
    value: number,
    labels?: Record<string, string>,
  ): void {
    const entry = this.getOrCreate(name, 'gauge', labels ?? {});
    (entry as MetricGauge).value = value;
  }

  /** Return all metrics as a flat object keyed by name+labels. */
  getMetrics(): Record<string, number> {
    const result: Record<string, number> = {};
    for (const [name, entries] of this.metrics) {
      for (const entry of entries) {
        const labelStr = formatLabels(entry.labels);
        const key = `${name}${labelStr}`;
        if (entry.type === 'histogram') {
          const vals = (entry as MetricHistogram).values;
          if (vals.length > 0) {
            const sorted = [...vals].sort((a, b) => a - b);
            result[`${key}_count`] = sorted.length;
            result[`${key}_sum`] = sorted.reduce((a, b) => a + b, 0);
            result[`${key}_min`] = sorted[0];
            result[`${key}_max`] = sorted[sorted.length - 1];
            result[`${key}_p50`] = sorted[Math.floor(sorted.length * 0.5)];
            result[`${key}_p90`] = sorted[Math.floor(sorted.length * 0.9)];
            result[`${key}_p99`] = sorted[Math.floor(sorted.length * 0.99)];
          }
        } else {
          result[key] = (entry as MetricCounter | MetricGauge).value;
        }
      }
    }
    return result;
  }

  /** Return Prometheus exposition text format. */
  getMetricsPrometheus(): string {
    const lines: string[] = [];

    for (const [name, entries] of this.metrics) {
      const help = METRIC_HELP[name];
      if (help) {
        lines.push(`# HELP ${name} ${escapeHelp(help)}`);
      }

      for (const entry of entries) {
        const labelStr = formatLabels(entry.labels);

        if (entry.type === 'counter') {
          if (help) lines.push(`# TYPE ${name} counter`);
          lines.push(`${name}${labelStr} ${(entry as MetricCounter).value}`);
        } else if (entry.type === 'gauge') {
          if (help) lines.push(`# TYPE ${name} gauge`);
          lines.push(`${name}${labelStr} ${(entry as MetricGauge).value}`);
        } else if (entry.type === 'histogram') {
          if (help) lines.push(`# TYPE ${name} histogram`);
          const vals = (entry as MetricHistogram).values;
          if (vals.length === 0) continue;
          const sorted = [...vals].sort((a, b) => a - b);
          const sum = sorted.reduce((a, b) => a + b, 0);
          // Bucket counts
          for (const bucket of HISTOGRAM_BUCKETS) {
            const count = sorted.filter(v => v <= bucket).length;
            const bucketLabel = labelStr
              ? `${labelStr.slice(0, -1)},le="${bucket}"}`
              : `{le="${bucket}"}`;
            lines.push(`${name}_bucket${bucketLabel} ${count}`);
          }
          // +Inf bucket
          const infLabel = labelStr
            ? `${labelStr.slice(0, -1)},le="+Inf"}`
            : `{le="+Inf"}`;
          lines.push(`${name}_bucket${infLabel} ${sorted.length}`);
          lines.push(`${name}_sum${labelStr} ${sum}`);
          lines.push(`${name}_count${labelStr} ${sorted.length}`);
        }
      }
    }

    return lines.join('\n') + '\n';
  }

  /** Reset all metrics (useful for tests). */
  reset(): void {
    this.metrics.clear();
  }
}

/** Singleton metrics instance */
export const metrics = new ChimeraMetrics();

// ────────────────────────────────────────────────────────────────────────────
// C. In-Process Tracer
// ────────────────────────────────────────────────────────────────────────────

export interface SpanData {
  id: string;
  name: string;
  startTime: number;
  endTime?: number;
  durationMs?: number;
  tags: Record<string, string | number | boolean>;
  error?: string;
  meta?: Record<string, unknown>;
  parentId?: string;
}

export class ChimeraSpan {
  private readonly tracer: ChimeraTracer;
  readonly data: SpanData;
  private _ended = false;

  constructor(
    tracer: ChimeraTracer,
    name: string,
    meta?: Record<string, unknown>,
    parentId?: string,
  ) {
    this.tracer = tracer;
    this.data = {
      id: crypto.randomUUID(),
      name,
      startTime: performance.now(),
      tags: {},
      ...(meta ? { meta } : {}),
      ...(parentId ? { parentId } : {}),
    };
  }

  /** Set a tag on this span. */
  setTag(key: string, value: string | number | boolean): ChimeraSpan {
    this.data.tags[key] = value;
    return this;
  }

  /** Mark the span as errored. */
  setError(error: unknown): ChimeraSpan {
    this.data.error =
      error instanceof Error ? error.message : String(error);
    return this;
  }

  /** End the span and record its duration. */
  end(): void {
    if (this._ended) return;
    this._ended = true;
    this.data.endTime = performance.now();
    this.data.durationMs =
      Math.round((this.data.endTime - this.data.startTime) * 100) / 100;
    this.tracer._finishSpan(this);
  }

  get ended(): boolean {
    return this._ended;
  }
}

export class ChimeraTracer {
  private activeSpans: ChimeraSpan[] = [];
  private completedSpans: SpanData[] = [];
  private readonly maxCompleted = 1000;

  /** Start a new span. */
  startSpan(name: string, meta?: Record<string, unknown>): ChimeraSpan {
    const span = new ChimeraSpan(this, name, meta);
    this.activeSpans.push(span);
    return span;
  }

  /** Start a child span nested under a parent. */
  startChildSpan(
    parent: ChimeraSpan,
    name: string,
    meta?: Record<string, unknown>,
  ): ChimeraSpan {
    const span = new ChimeraSpan(this, name, meta, parent.data.id);
    this.activeSpans.push(span);
    return span;
  }

  /** Internal: called when a span ends. */
  _finishSpan(span: ChimeraSpan): void {
    this.activeSpans = this.activeSpans.filter(s => s !== span);
    this.completedSpans.push({ ...span.data });
    // Evict oldest if over limit
    if (this.completedSpans.length > this.maxCompleted) {
      this.completedSpans = this.completedSpans.slice(-this.maxCompleted);
    }
  }

  /** Get all currently active (not yet ended) spans. */
  getActiveSpans(): ChimeraSpan[] {
    return [...this.activeSpans];
  }

  /** Get recently completed spans. */
  getCompletedSpans(limit = 50): SpanData[] {
    return this.completedSpans.slice(-limit);
  }

  /** Reset tracer state (useful for tests). */
  reset(): void {
    this.activeSpans = [];
    this.completedSpans = [];
  }
}

/** Singleton tracer instance */
export const tracer = new ChimeraTracer();
