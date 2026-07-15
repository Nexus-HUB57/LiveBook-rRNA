"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ─── Types ───────────────────────────────────────────────
type TaskStatus = "pending" | "spawning" | "executing" | "completed" | "failed" | "timeout";
type Tab = "os" | "tasks" | "terminal";
type TaskFilter = "all" | "active" | "completed" | "failed";

interface FableExecution {
  id: string;
  attempt: number;
  agentKey: string;
  inputPrompt: string;
  output: string | null;
  stderr: string | null;
  success: boolean;
  durationMs: number | null;
  createdAt: string;
}

interface FableTask {
  id: string;
  taskId: string;
  taskDescription: string;
  status: TaskStatus;
  capability: string;
  subAgentId: string | null;
  sandboxId: string | null;
  codeGenerated: string | null;
  executionOutput: string | null;
  executionStderr: string | null;
  executionMs: number | null;
  karmaGenerated: number;
  correctionCount: number;
  maxCorrections: number;
  createdAt: string;
  updatedAt: string;
  executions: FableExecution[];
}

interface FableStats {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  totalKarma: number;
  activeSandboxes: number;
  totalExecutions: number;
  avgExecutionMs: number;
  sandboxesCleaned?: number;
}

// ─── Constants ───────────────────────────────────────────
const ACCENT = "#06d6a0";
const ACCENT_DIM = "rgba(6,214,160,0.12)";
const ACCENT_MID = "rgba(6,214,160,0.35)";
const BRAND_RED = "#e01b24";
const BG_DEEP = "#0d0d0f";
const BG_BASE = "#1a1a1b";
const BG_CARD = "#272729";
const BG_ELEVATED = "#343536";
const TXT_PRIMARY = "#ffffff";
const TXT_SECONDARY = "#cccccc";
const TXT_MUTED = "#888888";
const TXT_DIM = "#666666";
const TXT_FAINT = "#555555";
const BORDER = "#343536";
const BORDER_HOVER = "#555555";

const STATUS_CONFIG: Record<TaskStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  pending:    { label: "Pendente",        color: "text-zinc-400",  bg: "bg-zinc-400/10",  border: "border-zinc-400/20",  dot: "#a1a1aa" },
  spawning:   { label: "Criando",         color: "text-cyan-400",  bg: "bg-cyan-400/10",  border: "border-cyan-400/20",  dot: "#22d3ee" },
  executing:  { label: "Executando",      color: "text-amber-400", bg: "bg-amber-400/10", border: "border-amber-400/20", dot: "#fbbf24" },
  completed:  { label: "Concluido",       color: "text-emerald-400",bg: "bg-emerald-400/10",border: "border-emerald-400/20",dot: "#06d6a0" },
  failed:     { label: "Falhou",          color: "text-red-400",   bg: "bg-red-400/10",   border: "border-red-400/20",   dot: "#ef4444" },
  timeout:    { label: "Timeout",         color: "text-orange-400",bg: "bg-orange-400/10",border: "border-orange-400/20",dot: "#f97316" },
};

// ─── Utility ─────────────────────────────────────────────
function formatMs(ms: number): string {
  if (ms < 1000) return ms + "ms";
  return (ms / 1000).toFixed(1) + "s";
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 5000) return "agora";
  if (diff < 60000) return Math.floor(diff / 1000) + "s atras";
  if (diff < 3600000) return Math.floor(diff / 60000) + "m atras";
  return Math.floor(diff / 3600000) + "h atras";
}

// ─── Skeleton Loader ─────────────────────────────────────
function Skeleton({ className }: { className?: string }) {
  return (
    <div className={"animate-pulse rounded " + (className || "")}
      style={{ background: "linear-gradient(90deg, " + BG_CARD + " 25%, " + BG_ELEVATED + " 50%, " + BG_CARD + " 75%)", backgroundSize: "200% 100%", animation: "skeleton-shimmer 1.5s infinite" }} />
  );
}

// ─── Sparkline ───────────────────────────────────────────
function Sparkline({ data, color, height = 28 }: { data: number[]; color: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 80;
  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return x + "," + y;
  }).join(" ");

  return (
    <svg width={w} height={height} className="flex-shrink-0" style={{ opacity: 0.7 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Micro Components ────────────────────────────────────
function Timestamp({ ts }: { ts: string }) {
  const d = new Date(ts);
  return (
    <span className="text-[10px] font-mono tabular-nums" style={{ color: TXT_DIM }}>
      {d.toLocaleTimeString("pt-BR")}.{d.getMilliseconds().toString().padStart(3, "0")}
    </span>
  );
}

function TimeAgo({ ts }: { ts: string }) {
  const [ago, setAgo] = useState(timeAgo(ts));
  useEffect(() => {
    const id = setInterval(() => setAgo(timeAgo(ts)), 5000);
    return () => clearInterval(id);
  }, [ts]);
  return <span className="text-[10px] font-mono" style={{ color: TXT_FAINT }}>{ago}</span>;
}

function ProgressBar({ value, color, animated = false }: { value: number; color: string; animated?: boolean }) {
  return (
    <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: BG_DEEP }}>
      <div
        className={"h-full rounded-full" + (animated ? " relative overflow-hidden" : "")}
        style={{
          width: Math.min(100, value * 100) + "%",
          backgroundColor: color,
          transition: "width 0.8s cubic-bezier(0.4,0,0.2,1)",
        }}
      >
        {animated && (
          <div className="absolute inset-0"
            style={{
              background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.25), transparent)",
              animation: "shimmer-slide 1.5s infinite",
            }} />
        )}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span className={"text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 border " + cfg.color + " " + cfg.bg + " " + cfg.border + (status === "executing" || status === "spawning" ? " animate-live-pulse" : "")}
      style={{ letterSpacing: "0.02em" }}>
      {cfg.label}
    </span>
  );
}

function KarmaBadge({ amount }: { amount: number }) {
  if (amount <= 0) return null;
  return (
    <span className="text-[10px] px-1.5 py-0.5 rounded font-medium flex-shrink-0 border border-amber-400/20 bg-amber-400/10 text-amber-400 tabular-nums">
      +{amount} karma
    </span>
  );
}

// ─── Stat Card ───────────────────────────────────────────
function StatCard({ label, value, color, sparkData, icon }: { label: string; value: string | number; color: string; sparkData?: number[]; icon: string }) {
  return (
    <div className="rounded-xl p-3 border transition-colors duration-200 group hover:border-opacity-60"
      style={{ background: BG_CARD, borderColor: BORDER }}>
      <div className="flex items-start justify-between">
        <div>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-1.5" style={{ color: TXT_DIM, letterSpacing: "0.08em" }}>{label}</div>
          <div className="text-xl font-bold font-mono tabular-nums" style={{ color }}>{value}</div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className="text-base">{icon}</span>
          {sparkData && <Sparkline data={sparkData} color={color} />}
        </div>
      </div>
    </div>
  );
}

// ─── Execution Timeline Dot ──────────────────────────────
function ExecDot({ exec, isLast }: { exec: FableExecution; isLast: boolean }) {
  const color = exec.success ? "#06d6a0" : "#ef4444";
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center">
        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 transition-all duration-300" style={{ backgroundColor: color, boxShadow: "0 0 6px " + color + "60" }} />
        {!isLast && <div className="w-px flex-1 min-h-[12px]" style={{ backgroundColor: BORDER }} />}
      </div>
      <div className="flex-1 min-w-0 pb-2">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="text-[10px] font-medium" style={{ color: TXT_SECONDARY }}>Tentativa {exec.attempt}</span>
          <span className="text-[10px]" style={{ color: TXT_FAINT }}>via {exec.agentKey}</span>
          {exec.durationMs !== null && (
            <span className="text-[10px] font-mono tabular-nums" style={{ color: TXT_DIM }}>{formatMs(exec.durationMs)}</span>
          )}
          <span className="text-[10px] px-1 py-0 rounded font-medium"
            style={{ color: exec.success ? "#06d6a0" : "#ef4444", background: exec.success ? "rgba(6,214,160,0.1)" : "rgba(239,68,68,0.1)" }}>
            {exec.success ? "OK" : "FAIL"}
          </span>
        </div>
        {exec.stderr && (
          <div className="text-[10px] rounded p-1.5 font-mono mb-1" style={{ color: "#fca5a5", background: "rgba(239,68,68,0.06)", borderLeft: "2px solid rgba(239,68,68,0.3)" }}>
            {exec.stderr}
          </div>
        )}
        {exec.output && (
          <pre className="text-[10px] rounded p-2 overflow-x-auto max-h-32 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed"
            style={{ color: TXT_MUTED, background: BG_DEEP }}>
            {exec.output}
          </pre>
        )}
      </div>
    </div>
  );
}

// ─── Task Card ───────────────────────────────────────────
function TaskCard({ task, expanded, onToggle, index }: { task: FableTask; expanded: boolean; onToggle: () => void; index: number }) {
  const progressMap: Record<TaskStatus, number> = {
    pending: 0, spawning: 0.15, executing: 0.6, completed: 1, failed: 0.8, timeout: 0.7,
  };
  const progress = progressMap[task.status] ?? 0;
  const progressColor = task.status === "completed" ? ACCENT : task.status === "failed" ? "#ef4444" : "#22d3ee";
  const isActive = task.status === "executing" || task.status === "spawning";
  const dotColor = STATUS_CONFIG[task.status].dot;

  return (
    <div
      className="rounded-xl overflow-hidden transition-all duration-300 animate-fade-in-up"
      style={{
        background: expanded ? BG_CARD : "transparent",
        border: "1px solid " + (expanded ? BORDER_HOVER : BORDER),
        animationDelay: (index * 30) + "ms",
        animationFillMode: "both",
      }}
    >
      <button onClick={onToggle}
        className="w-full p-3 text-left cursor-pointer group transition-colors duration-150 hover:bg-white/[0.02]">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="w-2 h-2 rounded-full flex-shrink-0 transition-colors duration-500"
                style={{ backgroundColor: dotColor, boxShadow: isActive ? "0 0 8px " + dotColor + "80" : "none" }} />
              <span className="text-xs font-medium truncate transition-colors duration-150 group-hover:text-white"
                style={{ color: TXT_SECONDARY }}>{task.taskDescription}</span>
            </div>
            <div className="flex items-center gap-2 text-[10px] flex-wrap">
              <span className="font-mono tabular-nums" style={{ color: TXT_FAINT }}>{task.taskId}</span>
              <span style={{ color: TXT_FAINT }}>-</span>
              <span style={{ color: TXT_DIM }}>{task.capability}</span>
              {task.executionMs !== null && (
                <>
                  <span style={{ color: TXT_FAINT }}>-</span>
                  <span className="font-mono tabular-nums" style={{ color: TXT_DIM }}>{formatMs(task.executionMs)}</span>
                </>
              )}
              <KarmaBadge amount={task.karmaGenerated} />
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <StatusBadge status={task.status} />
            <svg className="w-3 h-3 transition-transform duration-200" style={{ color: TXT_DIM, transform: expanded ? "rotate(180deg)" : "rotate(0)" }}
              fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
        {isActive && (
          <div className="mt-2.5">
            <ProgressBar value={progress} color={progressColor} animated />
          </div>
        )}
      </button>

      {expanded && (
        <div className="border-t p-3.5 animate-fade-in-up" style={{ borderColor: BORDER, background: BG_BASE }}>
          {/* Meta grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3">
            {[
              { label: "Sandbox", value: task.sandboxId || "---", color: "#22d3ee" },
              { label: "SubAgente", value: task.subAgentId || "---", color: ACCENT },
              { label: "Correcoes", value: task.correctionCount + "/" + task.maxCorrections, color: "#fbbf24" },
              { label: "Criado", value: "", color: TXT_DIM, ts: task.createdAt },
            ].map((item, i) => (
              <div key={i} className="rounded-lg p-2" style={{ background: BG_CARD }}>
                <div className="text-[10px] uppercase tracking-wider font-medium" style={{ color: TXT_FAINT, letterSpacing: "0.06em" }}>{item.label}</div>
                <div className="text-[10px] font-mono truncate mt-0.5" style={{ color: item.color }}>
                  {item.ts ? <Timestamp ts={item.ts} /> : item.value}
                </div>
              </div>
            ))}
          </div>

          {/* Execution timeline */}
          {task.executions.length > 0 && (
            <div className="mb-3">
              <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: TXT_DIM, letterSpacing: "0.06em" }}>
                Pipeline de Execucao ({task.executions.length})
              </div>
              <div className="pl-1">
                {task.executions.map((exec, i) => (
                  <ExecDot key={exec.id} exec={exec} isLast={i === task.executions.length - 1} />
                ))}
              </div>
            </div>
          )}

          {/* Final error */}
          {task.executionStderr && (
            <div className="rounded-lg p-2.5 mb-2" style={{ background: "rgba(239,68,68,0.06)", border: "1px solid rgba(239,68,68,0.15)" }}>
              <div className="text-[10px] font-medium mb-1" style={{ color: "#fca5a5" }}>Erro Final</div>
              <p className="text-[11px] font-mono" style={{ color: "#fca5a5" }}>{task.executionStderr}</p>
            </div>
          )}

          {/* Generated code preview */}
          {task.codeGenerated && (
            <div className="rounded-lg overflow-hidden">
              <div className="flex items-center gap-2 px-3 py-1.5" style={{ background: BG_CARD, borderBottom: "1px solid " + BORDER }}>
                <span className="text-[10px] font-medium" style={{ color: TXT_MUTED }}>Codigo Gerado</span>
              </div>
              <pre className="text-[10px] p-3 overflow-x-auto max-h-48 overflow-y-auto whitespace-pre-wrap font-mono leading-relaxed"
                style={{ color: TXT_MUTED, background: BG_DEEP }}>
                {task.codeGenerated.slice(0, 2000)}{task.codeGenerated.length > 2000 ? "\n... (truncado)" : ""}
              </pre>
            </div>
          )}

          <div className="flex justify-end mt-2">
            <TimeAgo ts={task.updatedAt} />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Terminal ────────────────────────────────────────────
function Terminal({ entries }: { entries: string[] }) {
  const endRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    if (autoScroll) endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [entries.length, autoScroll]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 40;
    setAutoScroll(atBottom);
  }, []);

  const getEntryStyle = (entry: string): { color: string; prefix?: string } => {
    if (entry.startsWith("[Fable 5 OS]")) return { color: ACCENT };
    if (entry.startsWith("[Sandbox]")) return { color: "#22d3ee" };
    if (entry.startsWith("[Agente]")) return { color: "#fbbf24" };
    if (entry.startsWith("[Erro")) return { color: "#ef4444" };
    if (entry.startsWith("[Tool]")) return { color: "#a78bfa" };
    if (entry.startsWith("[Result")) return { color: "#06d6a0" };
    if (entry.startsWith("[Texto]")) return { color: TXT_MUTED };
    return { color: TXT_MUTED };
  };

  return (
    <div className="rounded-xl overflow-hidden border" style={{ borderColor: BORDER }}>
      {/* Title bar */}
      <div className="flex items-center gap-2 px-3 py-2" style={{ background: BG_CARD, borderBottom: "1px solid " + BORDER }}>
        <div className="flex gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#ef4444", opacity: 0.8 }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#fbbf24", opacity: 0.8 }} />
          <div className="w-2.5 h-2.5 rounded-full" style={{ background: "#22c55e", opacity: 0.8 }} />
        </div>
        <span className="text-[10px] font-mono ml-1" style={{ color: TXT_DIM }}>fable-5-os://terminal</span>
        <div className="flex-1" />
        {!autoScroll && (
          <button onClick={() => { setAutoScroll(true); endRef.current?.scrollIntoView({ behavior: "smooth" }); }}
            className="text-[10px] px-2 py-0.5 rounded cursor-pointer transition-colors duration-150"
            style={{ color: ACCENT, background: ACCENT_DIM }}>
            Scroll to bottom
          </button>
        )}
      </div>
      {/* Log area */}
      <div ref={containerRef} onScroll={handleScroll}
        className="p-3 max-h-[520px] overflow-y-auto font-mono text-[11px] leading-relaxed"
        style={{ background: BG_DEEP }}>
        {entries.map((entry, i) => {
          const style = getEntryStyle(entry);
          return (
            <div key={i} className="whitespace-pre-wrap break-all animate-fade-in-up"
              style={{ color: style.color, animationDuration: "0.15s" }}>
              {entry}
            </div>
          );
        })}
        {entries.length === 0 && (
          <div style={{ color: TXT_FAINT }}>Aguardando inicializacao do sistema...</div>
        )}
        {/* Blinking cursor */}
        <div className="flex items-center gap-1 mt-1">
          <span style={{ color: TXT_FAINT }}>fable-os $</span>
          <span className="inline-block w-1.5 h-3.5 animate-pulse" style={{ background: ACCENT }} />
        </div>
        <div ref={endRef} />
      </div>
    </div>
  );
}

// ─── Architecture Diagram ────────────────────────────────
function ArchDiagram({ stats, activeTaskCount }: { stats: FableStats | null; activeTaskCount: number }) {
  const nodes = [
    { id: "orchestrator", label: "Fable5OSOrchestrator", color: ACCENT, desc: "Core do OS. Gerencia subagentes e sandboxes. Pipeline completo: spawn, generate, validate, correct, persist.", tags: ["primario", "coordenador"] },
    { id: "sandbox", label: "FableSandbox", color: "#22d3ee", desc: "Ambiente isolado nativo. Cada tarefa recebe sandbox dedicado com timeout e validacao.", tags: ["isolado", "persistente"] },
    { id: "agent", label: "FableSubAgent", color: "#fbbf24", desc: "Subagente recursivo. Gera solucoes One-Shot via LLM real (glm-4-flash). Capacidade configuravel.", tags: ["one-shot", "LLM"] },
    { id: "corrector", label: "Auto-Correcao", color: "#ef4444", desc: "Loop de auto-correcao (ate 3x). Filtro de seguranca + validacao estatica. Re-analise de erros.", tags: ["max 3x", "validacao"] },
  ];

  return (
    <div className="h-full rounded-xl border p-4 overflow-y-auto"
      style={{ background: BG_CARD, borderColor: BORDER }}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: TXT_PRIMARY, letterSpacing: "0.08em" }}>
          Arquitetura
        </h3>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full animate-live-pulse" style={{ background: ACCENT }} />
          <span className="text-[10px] font-mono" style={{ color: ACCENT }}>LIVE</span>
        </div>
      </div>

      <div className="space-y-2">
        {nodes.map((node, i) => {
          const isActive = (i === 0) || (i === 1 && (stats?.activeSandboxes ?? 0) > 0) || (i === 2 && activeTaskCount > 0);
          return (
            <div key={node.id}>
              <div className="rounded-lg p-3 transition-all duration-300 border"
                style={{
                  background: BG_BASE,
                  borderColor: isActive ? node.color + "40" : BORDER,
                  boxShadow: isActive ? "0 0 20px " + node.color + "08" : "none",
                }}>
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="w-3 h-3 rounded-full flex-shrink-0 transition-all duration-500"
                    style={{
                      backgroundColor: node.color,
                      boxShadow: isActive ? "0 0 8px " + node.color + "80" : "none",
                      animation: isActive ? "live-pulse 2s ease-in-out infinite" : "none",
                    }} />
                  <span className="text-xs font-bold" style={{ color: node.color }}>{node.label}</span>
                </div>
                <p className="text-[10px] leading-relaxed mb-2" style={{ color: TXT_MUTED }}>{node.desc}</p>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {node.tags.map((tag, j) => (
                    <span key={j} className="text-[9px] px-1.5 py-0.5 rounded font-medium border"
                      style={{ color: node.color, background: node.color + "10", borderColor: node.color + "20" }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              {i < nodes.length - 1 && (
                <div className="flex justify-center py-1">
                  <svg className="w-3.5 h-3.5" style={{ color: TXT_FAINT }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Live pipeline status */}
      {stats && (
        <div className="mt-4 pt-3 border-t" style={{ borderColor: BORDER }}>
          <div className="text-[10px] uppercase tracking-wider font-medium mb-2" style={{ color: TXT_DIM, letterSpacing: "0.06em" }}>Pipeline em Tempo Real</div>
          <div className="space-y-1.5">
            {[
              { label: "Tasks na fila", value: stats.pendingTasks, color: "#a1a1aa" },
              { label: "Sandboxes ativos", value: stats.activeSandboxes, color: "#22d3ee" },
              { label: "Karma total gerado", value: stats.totalKarma, color: "#fbbf24" },
              { label: "Execucoes totais", value: stats.totalExecutions, color: ACCENT },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between text-[10px]">
                <span style={{ color: TXT_MUTED }}>{item.label}</span>
                <span className="font-mono font-bold tabular-nums" style={{ color: item.color }}>{item.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Toast Notification ──────────────────────────────────
function Toast({ message, type, onDone }: { message: string; type: "success" | "error"; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3500);
    return () => clearTimeout(t);
  }, [onDone]);

  const color = type === "success" ? ACCENT : "#ef4444";
  const bg = type === "success" ? "rgba(6,214,160,0.12)" : "rgba(239,68,68,0.12)";

  return (
    <div className="fixed top-4 right-4 z-50 animate-fade-in-up rounded-lg px-4 py-3 border flex items-center gap-2 shadow-lg"
      style={{ background: bg, borderColor: color + "30", backdropFilter: "blur(12px)" }}>
      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      <span className="text-xs font-medium" style={{ color }}>{message}</span>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────
export default function Fable5OSPanel() {
  const [activeTab, setActiveTab] = useState<Tab>("os");
  const [tasks, setTasks] = useState<FableTask[]>([]);
  const [stats, setStats] = useState<FableStats | null>(null);
  const [terminalLog, setTerminalLog] = useState<string[]>([]);
  const [taskInput, setTaskInput] = useState("");
  const [isSpawning, setIsSpawning] = useState(false);
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [taskFilter, setTaskFilter] = useState<TaskFilter>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [sparkHistory, setSparkHistory] = useState<{ total: number[]; karma: number[]; execs: number[] }>({ total: [], karma: [], execs: [] });
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Boot log
  useEffect(() => {
    const bootLog = [
      "[Fable 5 OS] Inicializando Sistema Operacional Sandbox Nativo...",
      "[Fable 5 OS] Core v1.0.0 — Subagente Recursivo One-Shot",
      "[Fable 5 OS] Registro de agentes: fable_5 (primario)",
      "[Sandbox] Motor de sandbox isolado ativo",
      "[Fable 5 OS] Pipeline: spawn -> generate -> validate -> correct -> persist",
      "[Fable 5 OS] Karma tracking habilitado — proporcional ao trabalho real",
      "[Fable 5 OS] Auto-correcao: ate 3 tentativas com re-analise de erro",
      "[Fable 5 OS] Sistema pronto. Ctrl+Enter para spawn rapido.",
    ];
    // Stagger boot messages
    bootLog.forEach((msg, i) => {
      setTimeout(() => setTerminalLog(prev => [...prev, msg]), i * 80);
    });
  }, []);

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [tasksRes, statsRes] = await Promise.all([
        fetch("/api/fable/tasks?limit=50"),
        fetch("/api/fable/stats"),
      ]);
      const tasksData = await tasksRes.json();
      const statsData = await statsRes.json();

      if (tasksData.success) setTasks(tasksData.tasks);
      if (statsData.success) {
        setStats(statsData.stats);
        setSparkHistory(prev => ({
          total: [...prev.total.slice(-19), statsData.stats.totalTasks],
          karma: [...prev.karma.slice(-19), statsData.stats.totalKarma],
          execs: [...prev.execs.slice(-19), statsData.stats.totalExecutions],
        }));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    pollRef.current = setInterval(fetchData, 5000);
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, [fetchData]);

  // Spawn
  const handleSpawn = useCallback(async () => {
    if (!taskInput.trim() || isSpawning) return;
    setIsSpawning(true);
    const taskDesc = taskInput.trim();
    setTaskInput("");
    setActiveTab("terminal");

    const newLog = [
      "[Fable 5 OS] Spawn solicitado: \"" + taskDesc.slice(0, 80) + (taskDesc.length > 80 ? "..." : "") + "\"",
      "[Sandbox] Preparando ambiente isolado...",
      "[Agente] Instanciando subagente recursivo...",
    ];
    setTerminalLog(prev => [...prev, ...newLog]);

    try {
      const res = await fetch("/api/fable/spawn", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ task: taskDesc }),
      });
      const data = await res.json();

      if (data.success) {
        setTerminalLog(prev => [...prev,
          "[Sandbox] Sandbox criado: " + data.sandboxId,
          "[Agente] Subagente instanciado: " + data.subAgentId,
          "[Fable 5 OS] Executando pipeline de geracao...",
        ]);
        setToast({ message: "Subagente spawnado com sucesso", type: "success" });
      } else {
        setTerminalLog(prev => [...prev, "[Erro] Falha no spawn: " + (data.error || "desconhecido")]);
        setToast({ message: "Falha no spawn: " + (data.error || "erro desconhecido"), type: "error" });
      }
      await fetchData();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Falha na comunicacao";
      setTerminalLog(prev => [...prev, "[Erro] " + msg]);
      setToast({ message: msg, type: "error" });
    }

    setIsSpawning(false);
    inputRef.current?.focus();
  }, [taskInput, isSpawning, fetchData]);

  // Keyboard shortcut
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        handleSpawn();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleSpawn]);

  const toggleExpand = useCallback((taskId: string) => {
    setExpandedTask(prev => prev === taskId ? null : taskId);
  }, []);

  // Filtered tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (taskFilter === "active") result = result.filter(t => t.status === "executing" || t.status === "spawning" || t.status === "pending");
    else if (taskFilter === "completed") result = result.filter(t => t.status === "completed");
    else if (taskFilter === "failed") result = result.filter(t => t.status === "failed" || t.status === "timeout");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(t => t.taskDescription.toLowerCase().includes(q) || t.taskId.toLowerCase().includes(q));
    }
    return result;
  }, [tasks, taskFilter, searchQuery]);

  const activeTaskCount = tasks.filter(t => t.status === "executing" || t.status === "spawning").length;

  const tabs: { key: Tab; label: string; icon: string; count?: number }[] = [
    { key: "os", label: "Painel OS", icon: "monitor" },
    { key: "tasks", label: "Tarefas", icon: "list", count: tasks.length },
    { key: "terminal", label: "Terminal", icon: "terminal" },
  ];

  const filters: { key: TaskFilter; label: string }[] = [
    { key: "all", label: "Todas" },
    { key: "active", label: "Ativas" },
    { key: "completed", label: "Concluidas" },
    { key: "failed", label: "Falharam" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG_BASE }}>
      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onDone={() => setToast(null)} />}

      {/* Header */}
      <div className="px-4 pt-4 pb-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* OS icon with glow */}
            <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ background: "linear-gradient(135deg, " + ACCENT + "20, " + ACCENT + "05)", border: "1px solid " + ACCENT + "30" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={ACCENT} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </div>
            <div>
              <h1 className="text-sm font-bold flex items-center gap-2" style={{ color: TXT_PRIMARY, letterSpacing: "0.02em" }}>
                Fable 5 OS
                {activeTaskCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-bold animate-live-pulse"
                    style={{ color: "#0d0d0f", background: ACCENT }}>
                    {activeTaskCount} ativo{activeTaskCount > 1 ? "s" : ""}
                  </span>
                )}
              </h1>
              <p className="text-[10px] mt-0.5" style={{ color: TXT_DIM }}>
                Sandbox OS · Subagentes Recursivos · One-Shot Generation
              </p>
            </div>
          </div>

          {/* Quick stats pills */}
          {stats && (
            <div className="flex items-center gap-1.5">
              {[
                { label: stats.completedTasks + " ok", color: ACCENT, bg: "rgba(6,214,160,0.1)" },
                { label: stats.pendingTasks + " ativas", color: "#22d3ee", bg: "rgba(34,211,238,0.1)" },
                { label: stats.totalKarma + " karma", color: "#fbbf24", bg: "rgba(251,191,36,0.1)" },
              ].map((pill, i) => (
                <span key={i} className="text-[10px] px-2 py-1 rounded-md font-mono tabular-nums border"
                  style={{ color: pill.color, background: pill.bg, borderColor: pill.color + "20" }}>
                  {pill.label}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      {stats && (
        <div className="px-4 pb-3 grid grid-cols-2 lg:grid-cols-4 gap-2">
          <StatCard label="Total Tarefas" value={stats.totalTasks} color={TXT_PRIMARY} sparkData={sparkHistory.total} icon="📦" />
          <StatCard label="Execucoes" value={stats.totalExecutions} color="#22d3ee" sparkData={sparkHistory.execs} icon="⚡" />
          <StatCard label="Tempo Medio" value={formatMs(stats.avgExecutionMs)} color="#fbbf24" icon="⏱️" />
          <StatCard label="Sandboxes" value={stats.activeSandboxes} color="#a78bfa" icon="Containment" />
        </div>
      )}

      {/* Tab bar */}
      <div className="px-4 pb-1">
        <div className="flex items-center gap-1 rounded-lg p-0.5 w-fit" style={{ background: BG_CARD }}>
          {tabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="relative px-3 py-1.5 text-[11px] font-medium rounded-md transition-all duration-200 cursor-pointer whitespace-nowrap flex items-center gap-1.5"
              style={{
                color: activeTab === tab.key ? TXT_PRIMARY : TXT_MUTED,
                background: activeTab === tab.key ? BG_ELEVATED : "transparent",
              }}>
              {/* Inline SVG icons to avoid emoji inconsistency */}
              {tab.icon === "monitor" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                </svg>
              )}
              {tab.icon === "list" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" /><circle cx="4" cy="6" r="1" fill="currentColor" /><circle cx="4" cy="12" r="1" fill="currentColor" /><circle cx="4" cy="18" r="1" fill="currentColor" />
                </svg>
              )}
              {tab.icon === "terminal" && (
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="4 17 10 11 4 5" /><line x1="12" y1="19" x2="20" y2="19" />
                </svg>
              )}
              {tab.label}
              {tab.count !== undefined && (
                <span className="text-[9px] font-mono tabular-nums px-1 py-0 rounded"
                  style={{ color: TXT_DIM, background: "rgba(255,255,255,0.05)" }}>
                  {tab.count}
                </span>
              )}
              {/* Active indicator */}
              {activeTab === tab.key && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 rounded-full"
                  style={{ background: ACCENT }} />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {loading ? (
          /* Skeleton loading */
          <div className="space-y-3 animate-pulse">
            <div className="h-20 rounded-xl" style={{ background: BG_CARD }} />
            <div className="h-20 rounded-xl" style={{ background: BG_CARD }} />
            <div className="h-20 rounded-xl" style={{ background: BG_CARD }} />
          </div>
        ) : (
          <>
            {/* OS Tab */}
            {activeTab === "os" && (
              <div className="flex flex-col lg:flex-row gap-4 h-full animate-fade-in-up">
                <div className="w-full lg:w-5/12 h-[340px] lg:h-full flex-shrink-0">
                  <ArchDiagram stats={stats} activeTaskCount={activeTaskCount} />
                </div>
                <div className="flex-1 min-w-0 max-h-[520px] lg:max-h-full overflow-y-auto space-y-1.5 pr-1">
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] font-medium uppercase tracking-wider" style={{ color: TXT_DIM, letterSpacing: "0.06em" }}>
                      Tarefas Recentes
                    </span>
                    {tasks.length > 0 && (
                      <span className="text-[10px] font-mono tabular-nums" style={{ color: TXT_FAINT }}>
                        {tasks.length} registro{tasks.length !== 1 ? "s" : ""}
                      </span>
                    )}
                  </div>
                  {tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16" style={{ color: TXT_DIM }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={TXT_FAINT} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mb-3 opacity-40">
                        <rect x="2" y="3" width="20" height="14" rx="2" /><line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
                      </svg>
                      <span className="text-xs font-medium mb-1">Nenhuma tarefa registrada</span>
                      <span className="text-[10px]">Use o campo abaixo para spawnar um subagente</span>
                    </div>
                  ) : (
                    tasks.slice(0, 12).map((t, i) => (
                      <TaskCard key={t.id} task={t} expanded={expandedTask === t.id} onToggle={() => toggleExpand(t.id)} index={i} />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Tasks Tab */}
            {activeTab === "tasks" && (
              <div className="max-w-4xl mx-auto animate-fade-in-up">
                {/* Filters + Search */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: BG_CARD }}>
                    {filters.map(f => {
                      const count = f.key === "all" ? tasks.length
                        : f.key === "active" ? tasks.filter(t => t.status === "executing" || t.status === "spawning" || t.status === "pending").length
                        : f.key === "completed" ? tasks.filter(t => t.status === "completed").length
                        : tasks.filter(t => t.status === "failed" || t.status === "timeout").length;
                      return (
                        <button key={f.key} onClick={() => setTaskFilter(f.key)}
                          className="px-2.5 py-1 text-[10px] font-medium rounded-md cursor-pointer transition-all duration-200 flex items-center gap-1"
                          style={{
                            color: taskFilter === f.key ? TXT_PRIMARY : TXT_MUTED,
                            background: taskFilter === f.key ? BG_ELEVATED : "transparent",
                          }}>
                          {f.label}
                          <span className="font-mono tabular-nums" style={{ color: taskFilter === f.key ? ACCENT : TXT_FAINT }}>{count}</span>
                        </button>
                      );
                    })}
                  </div>
                  <div className="relative w-full sm:w-56">
                    <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: TXT_FAINT }}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Buscar tarefas..."
                      className="w-full rounded-lg pl-8 pr-3 py-1.5 text-[11px] font-mono focus:outline-none transition-colors duration-200"
                      style={{ background: BG_CARD, border: "1px solid " + BORDER, color: TXT_PRIMARY }}
                    />
                  </div>
                </div>

                {/* Task list */}
                <div className="max-h-[520px] overflow-y-auto space-y-1.5 pr-1">
                  {filteredTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16" style={{ color: TXT_DIM }}>
                      <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={TXT_FAINT} strokeWidth="1.5" className="mb-3 opacity-40">
                        <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
                      </svg>
                      <span className="text-xs font-medium mb-1">
                        {searchQuery ? "Nenhum resultado para \"" + searchQuery + "\"" : "Nenhuma tarefa neste filtro"}
                      </span>
                      <span className="text-[10px]">Spawne um subagente para comecar</span>
                    </div>
                  ) : (
                    filteredTasks.map((t, i) => (
                      <TaskCard key={t.id} task={t} expanded={expandedTask === t.id} onToggle={() => toggleExpand(t.id)} index={i} />
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Terminal Tab */}
            {activeTab === "terminal" && (
              <div className="max-w-4xl mx-auto animate-fade-in-up">
                <Terminal entries={terminalLog} />
              </div>
            )}
          </>
        )}
      </div>

      {/* Spawn Input */}
      <div className="p-4 border-t" style={{ borderColor: BORDER, background: BG_CARD }}>
        <form onSubmit={e => { e.preventDefault(); handleSpawn(); }} className="flex items-center gap-2">
          <div className="flex-1 relative">
            <input ref={inputRef}
              type="text"
              value={taskInput}
              onChange={e => setTaskInput(e.target.value)}
              placeholder="Descreva uma tarefa para o Fable 5 OS executar..."
              disabled={isSpawning}
              className="w-full rounded-xl pl-4 pr-12 py-2.5 text-sm font-mono focus:outline-none transition-all duration-200 disabled:opacity-50"
              style={{
                background: BG_BASE,
                border: "1px solid " + (taskInput.trim() ? ACCENT + "50" : BORDER),
                color: TXT_PRIMARY,
                boxShadow: taskInput.trim() ? "0 0 0 2px " + ACCENT + "10" : "none",
              }} />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 text-[9px] px-1.5 py-0.5 rounded border font-mono pointer-events-none"
              style={{ color: TXT_FAINT, background: BG_CARD, borderColor: BORDER }}>
              Ctrl+Enter
            </kbd>
          </div>
          <button type="submit" disabled={!taskInput.trim() || isSpawning}
            className="px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: taskInput.trim() && !isSpawning ? "linear-gradient(135deg, " + ACCENT + ", #22d3ee)" : BG_ELEVATED,
              color: taskInput.trim() && !isSpawning ? "#0d0d0f" : TXT_DIM,
              boxShadow: taskInput.trim() && !isSpawning ? "0 4px 12px " + ACCENT + "30" : "none",
            }}>
            {isSpawning ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
              </svg>
            )}
            <span className="hidden sm:inline">{isSpawning ? "Spawnando..." : "Spawn"}</span>
          </button>
        </form>
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="text-[10px]" style={{ color: TXT_FAINT }}>Fable 5 OS</span>
          <span style={{ color: TXT_FAINT }}>·</span>
          <span className="text-[10px] flex items-center gap-1" style={{ color: ACCENT }}>
            <span className="w-1 h-1 rounded-full" style={{ background: ACCENT }} />
            Sandbox ativo
          </span>
          <span style={{ color: TXT_FAINT }}>·</span>
          <span className="text-[10px] font-mono tabular-nums" style={{ color: TXT_DIM }}>
            {stats?.totalTasks ?? 0} tarefas processadas
          </span>
        </div>
      </div>
    </div>
  );
}