'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Activity, Cpu, MemoryStick, Clock, Zap, Server,
  Radio, Globe, FileJson, Brain, CpuIcon, BarChart3,
  TrendingUp, TrendingDown, Circle, ChevronRight
} from 'lucide-react';
import Link from 'next/link';

// ─── Sparkline Component (CSS-only bars) ────────────────────────────────────
function Sparkline({ values, color }: { values: number[]; color: string }) {
  const max = Math.max(...values);
  return (
    <div className="flex items-end gap-[3px] h-6">
      {values.map((v, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(v / max) * 100}%` }}
          transition={{ delay: i * 0.05, duration: 0.3 }}
          className="w-[4px] rounded-sm min-h-[2px]"
          style={{ backgroundColor: color, opacity: 0.7 }}
        />
      ))}
    </div>
  );
}

// ─── Status Dot ─────────────────────────────────────────────────────────────
function StatusDot({ status }: { status: 'online' | 'degraded' | 'offline' }) {
  const color = status === 'online' ? '#06d6a0' : status === 'degraded' ? '#fbbf24' : '#ef4444';
  return (
    <span className="relative flex h-2.5 w-2.5">
      <span
        className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
        style={{ backgroundColor: color }}
      />
      <span
        className="relative inline-flex rounded-full h-2.5 w-2.5"
        style={{ backgroundColor: color }}
      />
    </span>
  );
}

// ─── Pipeline Stage ─────────────────────────────────────────────────────────
function PipelineStage({
  label, sublabel, color, active, metrics
}: {
  label: string; sublabel: string; color: string; active: boolean;
  metrics: { k: string; v: string }[];
}) {
  return (
    <motion.div
      className="flex-1 min-w-0"
      animate={{
        borderColor: active ? color : 'rgba(255,255,255,0.06)',
        boxShadow: active ? `0 0 20px ${color}33, inset 0 0 20px ${color}0a` : 'none',
      }}
      style={{ border: `1px solid rgba(255,255,255,0.06)` }}
    >
      <div className="glass rounded-lg p-3 h-full">
        <div className="flex items-center gap-2 mb-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color, opacity: active ? 1 : 0.3 }} />
          <span className="font-mono text-xs font-bold" style={{ color }}>{label}</span>
        </div>
        <p className="text-[10px] text-[#555577] font-mono mb-2">{sublabel}</p>
        {metrics.map((m, i) => (
          <div key={i} className="flex justify-between text-[10px] font-mono">
            <span className="text-[#8888aa]">{m.k}</span>
            <span className="text-[#e8e0f0]">{m.v}</span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

// ─── Metric Card ────────────────────────────────────────────────────────────
function MetricCard({
  label, value, color, children
}: {
  label: string; value: string; color: string; children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-lg p-4"
    >
      <p className="text-[10px] font-mono text-[#555577] uppercase tracking-wider mb-1">{label}</p>
      <p className="text-lg font-bold font-mono" style={{ color }}>{value}</p>
      <div className="mt-2">{children}</div>
    </motion.div>
  );
}

// ─── Agent Card ─────────────────────────────────────────────────────────────
function AgentCard({
  name, role, color, status, contextUsed, contextTotal, lastAction
}: {
  name: string; role: string; color: string; status: 'active' | 'idle';
  contextUsed: number; contextTotal: number; lastAction: string;
}) {
  const pct = (contextUsed / contextTotal) * 100;
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="glass rounded-lg p-4"
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
          <span className="font-mono text-sm font-bold" style={{ color }}>{name}</span>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: status === 'active' ? '#06d6a020' : '#55557720',
            color: status === 'active' ? '#06d6a0' : '#8888aa',
          }}
        >
          {status === 'active' ? 'ATIVO' : 'OCIOSO'}
        </span>
      </div>
      <p className="text-xs text-[#8888aa] font-mono mb-3">{role}</p>
      <div className="mb-2">
        <div className="flex justify-between text-[10px] font-mono mb-1">
          <span className="text-[#555577]">Contexto</span>
          <span className="text-[#8888aa]">{contextUsed}K / {contextTotal}K</span>
        </div>
        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ backgroundColor: color }}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>
      <p className="text-[10px] font-mono text-[#555577]">Última ação: {lastAction}</p>
    </motion.div>
  );
}

// ─── Circular Progress (SVG) ────────────────────────────────────────────────
function CircularProgress({ pct, color, size = 48 }: { pct: number; color: string; size?: number }) {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={3} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={3}
        strokeLinecap="round"
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.5, ease: 'easeOut' }}
        strokeDasharray={circ}
      />
    </svg>
  );
}

// ─── Language Node Card ─────────────────────────────────────────────────────
function LanguageNodeCard({
  name, color, status, metrics, sparkValues
}: {
  name: string; color: string; status: 'ONLINE' | 'DEGRADED';
  metrics: { label: string; value: string }[]; sparkValues: number[];
}) {
  const statusColor = status === 'ONLINE' ? '#06d6a0' : '#fbbf24';
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-lg p-4 flex flex-col gap-3"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center font-mono text-xs font-bold"
            style={{ backgroundColor: `${color}20`, color, border: `1px solid ${color}40` }}
          >
            {name === 'Python' ? 'Py' : name === 'C++' ? 'C++' : name === 'C#' ? 'C#' : 'Jv'}
          </div>
          <div>
            <p className="font-mono text-sm font-bold text-[#e8e0f0]">{name}</p>
          </div>
        </div>
        <span
          className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold"
          style={{
            backgroundColor: `${statusColor}15`,
            color: statusColor,
            border: `1px solid ${statusColor}30`,
          }}
        >
          {status}
        </span>
      </div>
      <div className="flex flex-col gap-1.5">
        {metrics.map((m, i) => (
          <div key={i} className="flex justify-between items-center">
            <span className="text-[10px] font-mono text-[#555577]">{m.label}</span>
            <span className="text-xs font-mono text-[#e8e0f0]">{m.value}</span>
          </div>
        ))}
      </div>
      <Sparkline values={sparkValues} color={color} />
    </motion.div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════
export default function RRNADashboard() {
  // ── Log state ────────────────────────────────────────────────────────────
  const [logEntries, setLogEntries] = useState<string[]>([
    '[19:48:12] Crawl4AI: Fetching https://arxiv.org/abs/2401.00001...',
    '[19:48:13] Crawl4AI: HTML parsed, 24KB raw → 8KB structured markdown',
    '[19:48:13] LangChain: Embedding query (dim=1536, model=text-embedding-3-small)',
    '[19:48:14] LangChain: RAG retrieval: top_k=10, cosine_sim threshold=0.82',
    '[19:48:14] Claude 3.5: Processing context (128K window, 47K used)',
    '[19:48:15] Claude 3.5: Generated 847 tokens in 2.3s (368 tok/s)',
    '[19:48:15] Output: Structured JSON delivered via gRPC to C# client',
  ]);
  const logRef = useRef<HTMLDivElement>(null);

  // ── Pipeline state ───────────────────────────────────────────────────────
  const [activeStage, setActiveStage] = useState(0);

  // ── Metric animation state ───────────────────────────────────────────────
  const [tick, setTick] = useState(0);

  // ── Helix canvas ref ─────────────────────────────────────────────────────
  const helixCanvasRef = useRef<HTMLCanvasElement>(null);

  // ── Auto-scroll log ──────────────────────────────────────────────────────
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [logEntries]);

  // ── Add new log entries every 3 seconds ──────────────────────────────────
  const extraLogs = [
    '[19:48:18] Crawl4AI: Fetching https://pubmed.ncbi.nlm.nih.gov/38452190/...',
    '[19:48:19] Crawl4AI: PDF parsed, 156KB → 12KB structured text',
    '[19:48:19] LangChain: Embedding query (dim=1536, model=text-embedding-3-small)',
    '[19:48:20] LangChain: RAG retrieval: top_k=5, cosine_sim threshold=0.88',
    '[19:48:20] Llama 4: Processing context (128K window, 23K used)',
    '[19:48:21] Llama 4: Generated 412 tokens in 1.1s (374 tok/s)',
    '[19:48:21] Output: Summary delivered via gRPC to Python client',
    '[19:48:24] Crawl4AI: Fetching https://arxiv.org/abs/2402.12345/...',
    '[19:48:25] Crawl4AI: HTML parsed, 31KB raw → 11KB structured markdown',
    '[19:48:25] LangChain: Embedding query (dim=1536, model=text-embedding-3-small)',
    '[19:48:26] Hermes 3: Tool call: web_search("latest rRNA modifications")',
    '[19:48:27] Hermes 3: Generated 223 tokens in 0.8s (279 tok/s)',
    '[19:48:27] Output: Function result cached (TTL=3600s)',
  ];
  const logIdx = useRef(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setLogEntries(prev => {
        const next = [...prev, extraLogs[logIdx.current % extraLogs.length]];
        if (next.length > 30) next.shift();
        return next;
      });
      logIdx.current += 1;
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // ── Pipeline animation (cycle through stages) ───────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStage(prev => (prev + 1) % 5);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  // ── Metric tick ─────────────────────────────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 2000);
    return () => clearInterval(interval);
  }, []);

  // ── rRNA Helix Canvas ────────────────────────────────────────────────────
  const drawHelix = useCallback(() => {
    const canvas = helixCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const time = Date.now() * 0.002;
    const steps = 30;
    const amplitude = H * 0.3;
    const centerY = H / 2;
    const freq = 3;

    for (let i = 0; i < steps; i++) {
      const x = (i / steps) * W;
      const angle = (i / steps) * Math.PI * 2 * freq + time;

      // Strand 1
      const y1 = centerY + Math.sin(angle) * amplitude;
      // Strand 2
      const y2 = centerY + Math.sin(angle + Math.PI) * amplitude;

      // Draw base pairs (connecting lines)
      if (i % 3 === 0) {
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.strokeStyle = `rgba(168, 85, 247, ${0.15 + 0.1 * Math.sin(angle)})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      }

      // Nucleotide dots
      ctx.beginPath();
      ctx.arc(x, y1, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(6, 214, 160, ${0.5 + 0.5 * Math.cos(angle)})`;
      ctx.fill();

      ctx.beginPath();
      ctx.arc(x, y2, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(224, 64, 160, ${0.5 + 0.5 * Math.cos(angle + Math.PI)})`;
      ctx.fill();
    }
  }, []);

  useEffect(() => {
    let raf: number;
    const loop = () => {
      drawHelix();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [drawHelix]);

  // ── Pipeline data ────────────────────────────────────────────────────────
  const pipelineStages = [
    {
      label: 'Input URL', sublabel: 'gRPC', color: '#8888aa',
      metrics: [
        { k: 'URL', v: 'arxiv.org/abs/2401.00001' },
        { k: 'Protocolo', v: 'HTTPS' },
        { k: 'Método', v: 'GET' },
      ],
    },
    {
      label: 'Crawl4AI', sublabel: 'Python', color: '#06d6a0',
      metrics: [
        { k: 'Status', v: 'Extraindo...' },
        { k: 'Tokens', v: '2,847' },
        { k: 'Tempo', v: '0.8s' },
      ],
    },
    {
      label: 'LangChain', sublabel: 'Python Orchest.', color: '#a855f7',
      metrics: [
        { k: 'Chain', v: 'RAG' },
        { k: 'Contexto', v: '47K/128K' },
        { k: 'Memória', v: '12 slots' },
      ],
    },
    {
      label: 'LLM', sublabel: 'Multi Model', color: '#e040a0',
      metrics: [
        { k: 'Modelo', v: 'Claude 3.5' },
        { k: 'Tokens/s', v: '368' },
        { k: 'Temperatura', v: '0.7' },
      ],
    },
    {
      label: 'Output', sublabel: 'gRPC', color: '#fbbf24',
      metrics: [
        { k: 'Tipo', v: 'JSON' },
        { k: 'Resposta', v: '2.3s' },
        { k: 'Tokens', v: '847' },
      ],
    },
  ];

  // ── Language nodes data ──────────────────────────────────────────────────
  const languageNodes = [
    {
      name: 'Python', color: '#fbbf24', status: 'ONLINE' as const,
      metrics: [
        { label: 'CPU', value: `${67 + (tick % 3)}%` },
        { label: 'Memória', value: '4.2 GB' },
        { label: 'Uptime', value: '47h 23m' },
      ],
      sparkValues: [60, 72, 55, 80, 67],
    },
    {
      name: 'C++', color: '#06d6a0', status: 'ONLINE' as const,
      metrics: [
        { label: 'CPU', value: `${23 + (tick % 2)}%` },
        { label: 'Memória', value: '1.8 GB' },
        { label: 'Latência', value: '0.04ms' },
      ],
      sparkValues: [20, 25, 18, 30, 23],
    },
    {
      name: 'C#', color: '#a855f7', status: 'ONLINE' as const,
      metrics: [
        { label: 'CPU', value: `${45 + (tick % 4)}%` },
        { label: 'Memória', value: '3.1 GB' },
        { label: 'Threads', value: '128' },
      ],
      sparkValues: [40, 50, 42, 55, 45],
    },
    {
      name: 'Java', color: '#f97316', status: 'DEGRADED' as const,
      metrics: [
        { label: 'CPU', value: `${89 + (tick % 2)}%` },
        { label: 'Memória', value: '7.8 GB' },
        { label: 'Partições', value: '12' },
      ],
      sparkValues: [75, 82, 90, 95, 89],
    },
  ];

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050510] text-[#e8e0f0]">
      {/* ── 1. TOP BAR ──────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 glass-strong">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <Link
            href="/rRNA"
            className="flex items-center gap-2 text-sm font-mono text-[#8888aa] hover:text-[#a855f7] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>rRNA Dashboard</span>
          </Link>
          <h1 className="text-sm sm:text-base font-mono font-bold text-center hidden sm:block">
            Motor rRNA — Painel de Controle
          </h1>
          <div className="flex items-center gap-2">
            <StatusDot status="online" />
            <span className="text-xs font-mono text-[#06d6a0] font-bold">OPERACIONAL</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col gap-6">
        {/* ── 2. LANGUAGE STATUS PANEL ─────────────────────────────────── */}
        <section>
          <h2 className="font-mono text-xs text-[#555577] uppercase tracking-widest mb-4">
            Status dos Nós de Integração
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {languageNodes.map((node) => (
              <LanguageNodeCard key={node.name} {...node} />
            ))}
          </div>
        </section>

        {/* ── 3. PIPELINE VISUALIZATION ────────────────────────────────── */}
        <section>
          <h2 className="font-mono text-xs text-[#555577] uppercase tracking-widest mb-4">
            Pipeline rRNA — Crawl4AI → LangChain → LLM
          </h2>

          {/* Pipeline stages */}
          <div className="flex items-stretch gap-2 overflow-x-auto pb-2">
            {pipelineStages.map((stage, i) => (
              <div key={stage.label} className="flex items-center gap-2 flex-1 min-w-[140px]">
                <PipelineStage {...stage} active={activeStage === i} />
                {i < pipelineStages.length - 1 && (
                  <div className="flex-shrink-0 flex items-center relative w-8 h-8">
                    <div className="w-full h-[1px] bg-white/10" />
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                      style={{
                        backgroundColor: pipelineStages[i].color,
                        boxShadow: `0 0 8px ${pipelineStages[i].color}`,
                      }}
                      animate={{
                        left: activeStage === i ? '100%' : '0%',
                        opacity: activeStage === i ? 1 : 0.3,
                      }}
                      transition={{ duration: 0.6, ease: 'easeInOut' }}
                    />
                    <ChevronRight className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 text-[#555577]" />
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Data packet animation bar */}
          <div className="glass rounded-lg mt-4 p-1 relative overflow-hidden h-8">
            <div className="absolute inset-0 flex items-center">
              {pipelineStages.map((stage, i) => (
                <motion.div
                  key={stage.label}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    left: `${(i / (pipelineStages.length - 1)) * 100}%`,
                    backgroundColor: stage.color,
                    boxShadow: `0 0 12px ${stage.color}`,
                  }}
                  animate={{
                    scale: activeStage === i ? [1, 1.8, 1] : 1,
                    opacity: activeStage === i ? 1 : 0.2,
                  }}
                  transition={{ duration: 0.4 }}
                />
              ))}
            </div>
            {/* Traveling packet */}
            <motion.div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 rounded-full"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #06d6a0)',
                boxShadow: '0 0 16px #a855f7, 0 0 32px #06d6a044',
              }}
              animate={{
                left: ['2%', '98%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'linear',
              }}
            />
          </div>

          {/* Extraction Log */}
          <div className="glass rounded-lg mt-3 overflow-hidden">
            <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.06]">
              <Activity className="w-3 h-3 text-[#06d6a0]" />
              <span className="text-[10px] font-mono text-[#555577] uppercase tracking-wider">
                Log de Extração — Tempo Real
              </span>
            </div>
            <div
              ref={logRef}
              className="p-3 h-40 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-0.5"
            >
              <AnimatePresence>
                {logEntries.map((entry, i) => (
                  <motion.div
                    key={`${i}-${entry.slice(0, 20)}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[#8888aa]"
                  >
                    <span className="text-[#555577]">{entry.slice(0, 10)}</span>
                    {entry.slice(10).includes('Crawl4AI') && (
                      <span className="text-[#06d6a0]">{entry.slice(10)}</span>
                    )}
                    {entry.slice(10).includes('LangChain') && (
                      <span className="text-[#a855f7]">{entry.slice(10)}</span>
                    )}
                    {entry.slice(10).includes('Claude') && (
                      <span className="text-[#fbbf24]">{entry.slice(10)}</span>
                    )}
                    {entry.slice(10).includes('Llama') && (
                      <span className="text-[#06d6a0]">{entry.slice(10)}</span>
                    )}
                    {entry.slice(10).includes('Hermes') && (
                      <span className="text-[#e040a0]">{entry.slice(10)}</span>
                    )}
                    {entry.slice(10).includes('Output') && (
                      <span className="text-[#f97316]">{entry.slice(10)}</span>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        </section>

        {/* ── 4. BOTTOM SECTION: Metrics + Agents + Helix ──────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 4a. Metrics Grid */}
          <div className="lg:col-span-2">
            <h2 className="font-mono text-xs text-[#555577] uppercase tracking-widest mb-4">
              Métricas do Motor
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <MetricCard label="Throughput" value="2,847 extracões/hr" color="#06d6a0">
                <div className="flex items-end gap-[2px] h-8">
                  {[45, 62, 38, 71, 55, 80, 67, 73, 50, 85].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${v}%`,
                        backgroundColor: `rgba(6, 214, 160, ${0.2 + (v / 100) * 0.6})`,
                      }}
                    />
                  ))}
                </div>
              </MetricCard>

              <MetricCard label="Latência Média" value="47ms p95" color="#a855f7">
                <div className="flex items-center gap-1 text-[10px] font-mono">
                  <span className="text-[#555577]">p50:</span>
                  <span className="text-[#e8e0f0]">12ms</span>
                  <span className="text-[#555577] ml-2">p99:</span>
                  <span className="text-[#e8e0f0]">89ms</span>
                </div>
                <div className="flex items-end gap-[1px] h-4 mt-1">
                  {[10, 15, 25, 20, 35, 30, 18, 22, 40, 28].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${v}%`,
                        backgroundColor: `rgba(168, 85, 247, ${0.2 + (v / 50) * 0.6})`,
                      }}
                    />
                  ))}
                </div>
              </MetricCard>

              <MetricCard label="Cache Hit Rate" value="94.2%" color="#06b6d4">
                <div className="flex items-center gap-3">
                  <CircularProgress pct={94.2} color="#06b6d4" size={44} />
                  <div className="text-[10px] font-mono text-[#555577]">
                    <p>Hits: 48,291</p>
                    <p>Misses: 2,967</p>
                  </div>
                </div>
              </MetricCard>

              <MetricCard label="Modelos Ativos" value="3" color="#fbbf24">
                <div className="flex flex-col gap-1 mt-1">
                  {['Claude 3.5 Sonnet', 'Llama 4 Maverick', 'Hermes 3 Pro'].map((m, i) => {
                    const colors = ['#fbbf24', '#06d6a0', '#e040a0'];
                    return (
                      <div key={m} className="flex items-center gap-2">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors[i] }} />
                        <span className="text-[10px] font-mono text-[#8888aa]">{m}</span>
                      </div>
                    );
                  })}
                </div>
              </MetricCard>

              <MetricCard label="Chamadas gRPC" value="12,847/s" color="#e040a0">
                <div className="flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-[#06d6a0]" />
                  <span className="text-[10px] font-mono text-[#06d6a0]">+12.3% vs hora anterior</span>
                </div>
                <div className="flex items-end gap-[1px] h-4 mt-1">
                  {[60, 65, 58, 72, 68, 75, 70, 78, 73, 80].map((v, i) => (
                    <div
                      key={i}
                      className="flex-1 rounded-t-sm"
                      style={{
                        height: `${v}%`,
                        backgroundColor: `rgba(224, 64, 160, ${0.2 + (v / 100) * 0.6})`,
                      }}
                    />
                  ))}
                </div>
              </MetricCard>

              <MetricCard label="Taxa de Erro" value="0.03%" color="#06d6a0">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#06d6a0]" />
                  <span className="text-[10px] font-mono text-[#06d6a0]">Saudável</span>
                </div>
                <p className="text-[10px] font-mono text-[#555577] mt-1">
                  4 erros em 12,847 requisições
                </p>
              </MetricCard>
            </div>
          </div>

          {/* 4b. Agent Activity Monitor */}
          <div className="flex flex-col gap-6">
            <div>
              <h2 className="font-mono text-xs text-[#555577] uppercase tracking-widest mb-4">
                Monitor de Agentes
              </h2>
              <div className="flex flex-col gap-3">
                <AgentCard
                  name="Claude"
                  role="Raciocínio complexo"
                  color="#fbbf24"
                  status="active"
                  contextUsed={47}
                  contextTotal={128}
                  lastAction="há 2s"
                />
                <AgentCard
                  name="Llama 4"
                  role="Processamento local"
                  color="#06d6a0"
                  status="active"
                  contextUsed={23}
                  contextTotal={128}
                  lastAction="há 5s"
                />
                <AgentCard
                  name="Hermes 3"
                  role="Function calling"
                  color="#e040a0"
                  status="idle"
                  contextUsed={8}
                  contextTotal={32}
                  lastAction="há 45s"
                />
              </div>
            </div>

            {/* 4c. rRNA Helix Monitor */}
            <div>
              <h2 className="font-mono text-xs text-[#555577] uppercase tracking-widest mb-4">
                Monitor de Helix rRNA
              </h2>
              <div className="glass rounded-lg p-3 flex items-center justify-center">
                <canvas
                  ref={helixCanvasRef}
                  width={240}
                  height={150}
                  className="w-full max-w-[240px] h-auto rounded"
                />
              </div>
              <div className="flex items-center justify-center gap-4 mt-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#06d6a0]" />
                  <span className="text-[9px] font-mono text-[#555577]">Fita 5&apos;</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#e040a0]" />
                  <span className="text-[9px] font-mono text-[#555577]">Fita 3&apos;</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-[#a855f7] opacity-40" />
                  <span className="text-[9px] font-mono text-[#555577]">Pares de Base</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}