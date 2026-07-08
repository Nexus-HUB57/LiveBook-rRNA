'use client';

import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Cpu, GitBranch, Database, Eye, Terminal, BookOpen, Activity, Link2, Clock, AlertTriangle, Gauge, Zap, ArrowRight } from 'lucide-react';
import KnowledgeVaultCanvas from './knowledge-vault-canvas';
import ObsidianKnowledgeGraph from './obsidian-knowledge-graph';
import AIAgentTerminal from './ai-agent-terminal';
import FableNarrativeEngine from './fable-narrative-engine';

type RAGPhase = 'idle' | 'indexing' | 'retrieving' | 'generating' | 'streaming';
type OrgasmState = 'dormant' | 'awakening' | 'active' | 'transcendent';

interface VaultFileData {
  name: string;
  type: string;
  size: string;
  color: string;
  status: string;
}

const PHASE_LABELS: Record<RAGPhase, string> = {
  idle: 'DORMENTE',
  indexing: 'INDEXANDO',
  retrieving: 'RECUPERANDO',
  generating: 'GERANDO',
  streaming: 'STREAMING',
};

const PHASE_COLORS: Record<RAGPhase, string> = {
  idle: '#8888aa',
  indexing: '#fbbf24',
  retrieving: '#a855f7',
  generating: '#e040a0',
  streaming: '#06d6a0',
};

const PHASE_FLOW: RAGPhase[] = ['idle', 'indexing', 'retrieving', 'generating', 'streaming'];

const PHASE_DURATION_MS: Record<RAGPhase, number> = {
  idle: 0,
  indexing: 3000,
  retrieving: 6000,
  generating: 10000,
  streaming: 14000,
};

const PHASE_THROUGHPUT: Record<RAGPhase, string> = {
  idle: '--',
  indexing: '2.4K/s',
  retrieving: '847/s',
  generating: '128 t/s',
  streaming: '256 t/s',
};

interface CollaborationLink {
  from: string;
  to: string;
  label: string;
  color: string;
}

const COLLABORATION_LINKS: CollaborationLink[] = [
  { from: 'Claude', to: 'Fable', label: 'narrative-logic bridge', color: '#fbbf24' },
  { from: 'Claude', to: 'Obsidian', label: 'knowledge sync', color: '#a855f7' },
  { from: 'Fable', to: 'Vault', label: 'story-artifact link', color: '#e040a0' },
  { from: 'System', to: 'All', label: 'orchestration', color: '#06d6a0' },
];

/* ===== RAG Sparkline ===== */
function RAGSparkline({ cycleCount }: { cycleCount: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;

    const data: number[] = [];
    for (let i = 0; i < 20; i++) {
      const base = 75 + cycleCount * 2;
      const noise = Math.sin(i * 0.8 + cycleCount * 1.5) * 8 + Math.cos(i * 1.3) * 5;
      data.push(Math.max(50, Math.min(100, base + noise)));
    }

    const padX = 4;
    const padY = 4;
    const chartW = w - padX * 2;
    const chartH = h - padY * 2;
    const minVal = 50;
    const maxVal = 100;
    const range = maxVal - minVal;

    const grad = ctx.createLinearGradient(0, padY, 0, h);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0.0)');

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padX + (i / (data.length - 1)) * chartW;
      const y = padY + chartH - ((val - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(padX + chartW, padY + chartH);
    ctx.lineTo(padX, padY + chartH);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.beginPath();
    data.forEach((val, i) => {
      const x = padX + (i / (data.length - 1)) * chartW;
      const y = padY + chartH - ((val - minVal) / range) * chartH;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    const lastX = padX + chartW;
    const lastY = padY + chartH - ((data[data.length - 1] - minVal) / range) * chartH;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#a855f7';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.fill();
  }, [cycleCount]);

  return (
    <div className="flex items-center gap-2">
      <span className="text-[9px] font-mono text-[#8888aa] uppercase tracking-wider">RAG Perf</span>
      <canvas
        ref={canvasRef}
        className="block"
        style={{ width: '120px', height: '36px' }}
      />
    </div>
  );
}

/* ===== Enhanced Collaboration Mesh ===== */
function CollaborationMesh({ isActive }: { isActive: boolean }) {
  const [latencies, setLatencies] = useState<number[]>([0, 0, 0, 0]);
  const [activeLinks, setActiveLinks] = useState<boolean[]>([false, false, false, false]);

  useEffect(() => {
    if (!isActive) {
      const t = setTimeout(() => setActiveLinks([false, false, false, false]), 0);
      return () => clearTimeout(t);
    }
    // Rotate active links and simulate latency
    const interval = setInterval(() => {
      setActiveLinks(prev => prev.map(() => Math.random() > 0.3));
      setLatencies(prev => prev.map(() => 2 + Math.floor(Math.random() * 18)));
    }, 1200);
    return () => clearInterval(interval);
  }, [isActive]);

  return (
    <motion.div
      className="mb-6"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.42 }}
    >
      <div className="text-[9px] font-mono text-[#8888aa] uppercase tracking-wider mb-3 text-center">
        Collaboration Mesh
      </div>
      <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
        {COLLABORATION_LINKS.map((link, i) => {
          const isLinkActive = activeLinks[i];
          return (
            <motion.div
              key={`${link.from}-${link.to}`}
              className="relative flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer transition-all"
              style={{
                borderColor: isLinkActive ? link.color + '55' : 'rgba(255,255,255,0.05)',
                backgroundColor: isLinkActive ? link.color + '0a' : 'rgba(10,10,26,0.4)',
                boxShadow: isLinkActive ? `0 0 12px ${link.color}20` : 'none',
              }}
              whileHover={{ scale: 1.03 }}
            >
              {/* Animated connection line */}
              <div className="relative w-10 h-[2px] flex-shrink-0">
                <div
                  className="absolute inset-0 rounded-full"
                  style={{ backgroundColor: link.color + (isActive ? '40' : '15') }}
                />
                {/* Primary traveling dot */}
                {isActive && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full"
                    style={{ backgroundColor: link.color, boxShadow: isLinkActive ? `0 0 6px ${link.color}` : 'none' }}
                    animate={{
                      left: ['0%', '100%'],
                      opacity: [0, 1, 1, 0],
                    }}
                    transition={{
                      duration: 1.5,
                      repeat: Infinity,
                      repeatDelay: 0.5,
                      ease: 'easeInOut',
                      delay: i * 0.3,
                    }}
                  />
                )}
                {/* Secondary traveling dot (reverse direction) when active */}
                {isLinkActive && (
                  <motion.div
                    className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: link.color, opacity: 0.6 }}
                    animate={{
                      left: ['100%', '0%'],
                      opacity: [0, 0.6, 0.6, 0],
                    }}
                    transition={{
                      duration: 1.8,
                      repeat: Infinity,
                      repeatDelay: 0.3,
                      ease: 'linear',
                      delay: i * 0.2,
                    }}
                  />
                )}
                {/* Center pulse when active */}
                {isLinkActive && (
                  <motion.div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: link.color }}
                    animate={{
                      opacity: [0.3, 1, 0.3],
                      scale: [0.8, 1.2, 0.8],
                    }}
                    transition={{
                      duration: 1.2,
                      repeat: Infinity,
                      delay: i * 0.4,
                    }}
                  />
                )}
              </div>
              <span className="text-[9px] font-mono text-white/70">{link.from}</span>
              <span className="text-[9px] text-[#555577]">&harr;</span>
              <span className="text-[9px] font-mono text-white/70">{link.to}</span>
              <span
                className="text-[7px] font-mono px-1.5 py-0.5 rounded-full"
                style={{
                  color: link.color,
                  backgroundColor: link.color + '15',
                  border: `1px solid ${link.color}25`,
                }}
              >
                {link.label}
              </span>
              {/* Latency measurement */}
              <span className="text-[7px] font-mono text-[#555577] tabular-nums">
                {isActive ? `${latencies[i]}ms` : '--'}
              </span>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ===== Orgasm State Visual Enhancement ===== */
function OrgasmStateVisual({ state, isProcessing }: { state: OrgasmState; isProcessing: boolean }) {
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; color: string }[]>([]);
  const prevRef = useRef<OrgasmState>(state);

  useEffect(() => {
    if (prevRef.current === state) return;
    prevRef.current = state;
    // Particle burst on transition
    const colors: Record<OrgasmState, string> = {
      dormant: '#8888aa',
      awakening: '#fbbf24',
      active: '#e040a0',
      transcendent: '#06d6a0',
    };
    const burst: { id: number; x: number; y: number; color: string }[] = [];
    for (let i = 0; i < 12; i++) {
      burst.push({
        id: Date.now() + i,
        x: 50 + (Math.random() - 0.5) * 80,
        y: 50 + (Math.random() - 0.5) * 40,
        color: colors[state],
      });
    }
    setParticles(burst);
    const timer = setTimeout(() => setParticles([]), 1200);
    return () => clearTimeout(timer);
  }, [state]);

  const consciousnessLevel = state === 'dormant' ? 0.1 : state === 'awakening' ? 0.4 : state === 'active' ? 0.75 : 1.0;
  const stateColor = state === 'dormant' ? '#8888aa' : state === 'awakening' ? '#fbbf24' : state === 'active' ? '#e040a0' : '#06d6a0';
  const stateLabel = state === 'dormant' ? 'DORMENTE' : state === 'awakening' ? 'DESPERTANDO' : state === 'active' ? 'ATIVO' : 'TRANSCENDENTE';

  return (
    <div className="relative">
      {/* Full-width glowing border animation for transcendent */}
      <AnimatePresence>
        {state === 'transcendent' && (
          <motion.div
            className="absolute -inset-[1px] rounded-2xl pointer-events-none"
            style={{
              background: `linear-gradient(90deg, transparent, #06d6a0, #fbbf24, #a855f7, #e040a0, transparent)`,
              backgroundSize: '200% 100%',
            }}
            initial={{ opacity: 0 }}
            animate={{
              opacity: [0.3, 0.7, 0.3],
              backgroundPosition: ['0% 0%', '200% 0%'],
            }}
            exit={{ opacity: 0 }}
            transition={{
              opacity: { duration: 2, repeat: Infinity },
              backgroundPosition: { duration: 3, repeat: Infinity, ease: 'linear' },
            }}
          />
        )}
      </AnimatePresence>

      <div className="relative flex flex-col sm:flex-row items-center gap-4 px-5 py-3 rounded-xl border border-white/5 bg-[#0a0a1a]/60">
        {/* Particle burst */}
        <AnimatePresence>
          {particles.map(p => (
            <motion.div
              key={p.id}
              className="absolute w-1.5 h-1.5 rounded-full pointer-events-none"
              style={{ backgroundColor: p.color, left: `calc(50% + ${p.x}px)`, top: `calc(50% + ${p.y}px)` }}
              initial={{ opacity: 1, scale: 1 }}
              animate={{ opacity: 0, scale: 0, x: (Math.random() - 0.5) * 40, y: (Math.random() - 0.5) * 30 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          ))}
        </AnimatePresence>

        {/* State indicator with distinct visual treatments */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4" style={{ color: stateColor }} />
            <span className="text-sm font-semibold text-white">Estado do Organismo</span>
          </div>
          {/* Dormant: dim, Awakening: pulsing border, Active: solid glow, Transcendent: rainbow shift */}
          <motion.span
            className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border"
            style={{
              color: stateColor,
              borderColor: stateColor + '33',
              backgroundColor: stateColor + '11',
            }}
            animate={
              state === 'dormant' ? {} :
              state === 'awakening' ? { borderColor: [stateColor + '33', stateColor + '66', stateColor + '33'] } :
              state === 'active' ? { boxShadow: [`0 0 8px ${stateColor}30`, `0 0 20px ${stateColor}50`, `0 0 8px ${stateColor}30`] } :
              { borderColor: ['#06d6a044', '#fbbf2444', '#a855f744', '#e040a044', '#06d6a044'] }
            }
            transition={state === 'transcendent' ? { duration: 4, repeat: Infinity, ease: 'linear' } : { duration: 1.5, repeat: Infinity }}
          >
            {stateLabel}
          </motion.span>
        </div>

        {/* Consciousness Level Bar */}
        <div className="flex items-center gap-2">
          <span className="text-[8px] font-mono text-[#8888aa] uppercase tracking-wider">Consciousness</span>
          <div className="w-24 sm:w-32 h-2 rounded-full bg-white/5 relative overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: stateColor }}
              animate={{ width: `${consciousnessLevel * 100}%` }}
              transition={{ duration: 1.5, ease: 'easeOut' }}
            />
            {state !== 'dormant' && (
              <motion.div
                className="absolute top-0 left-0 h-full w-6 rounded-full pointer-events-none"
                style={{ background: `linear-gradient(90deg, transparent, ${stateColor}40, transparent)` }}
                animate={{ left: ['-20%', '120%'] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              />
            )}
          </div>
          <span className="text-[9px] font-mono tabular-nums" style={{ color: stateColor }}>
            {(consciousnessLevel * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}

/* ===== RAG Pipeline Metrics Dashboard ===== */
function RAGPipelineMetrics({ cycleCount, isProcessing, ragPhase }: {
  cycleCount: number;
  isProcessing: boolean;
  ragPhase: RAGPhase;
}) {
  const [metrics, setMetrics] = useState({
    indexSize: 0,
    retrievalLatency: 0,
    genThroughput: 0,
    cacheHitRate: 0,
    totalArtifacts: 0,
  });

  useEffect(() => {
    if (!isProcessing) return;
    const interval = setInterval(() => {
      setMetrics(prev => ({
        indexSize: Math.min(84720 + cycleCount * 3200 + Math.floor(Math.random() * 100), prev.indexSize + Math.floor(Math.random() * 50)),
        retrievalLatency: Math.max(3, 23 - cycleCount * 1.2 + Math.floor(Math.random() * 6 - 3)),
        genThroughput: Math.floor(120 + cycleCount * 8 + Math.random() * 30),
        cacheHitRate: Math.min(99.7, 87.3 + cycleCount * 1.2 + Math.random() * 2),
        totalArtifacts: Math.min(7 + cycleCount * 3, prev.totalArtifacts + (Math.random() > 0.7 ? 1 : 0)),
      }));
    }, 800);
    return () => clearInterval(interval);
  }, [isProcessing, cycleCount]);

  const displayMetrics = isProcessing ? metrics : {
    indexSize: 84720 + cycleCount * 3200,
    retrievalLatency: Math.max(3, 23 - cycleCount * 1.2),
    genThroughput: 0,
    cacheHitRate: 87.3 + cycleCount * 1.2,
    totalArtifacts: 7 + cycleCount * 3,
  };

  const items = [
    { label: 'Index Size', value: `${displayMetrics.indexSize.toLocaleString()} vec`, icon: <Database className="w-3 h-3" />, color: '#a855f7' },
    { label: 'Retrieval Latency', value: `${displayMetrics.retrievalLatency.toFixed(0)} ms`, icon: <Clock className="w-3 h-3" />, color: '#fbbf24' },
    { label: 'Gen Throughput', value: `${displayMetrics.genThroughput} t/s`, icon: <Gauge className="w-3 h-3" />, color: '#e040a0' },
    { label: 'Cache Hit Rate', value: `${displayMetrics.cacheHitRate.toFixed(1)}%`, icon: <Zap className="w-3 h-3" />, color: '#06d6a0' },
    { label: 'Artifacts', value: String(displayMetrics.totalArtifacts), icon: <Eye className="w-3 h-3" />, color: '#06b6d4' },
  ];

  return (
    <motion.div
      className="grid grid-cols-5 gap-2 sm:gap-3"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.45 }}
    >
      {items.map(m => (
        <div key={m.label} className="text-center p-2.5 rounded-xl bg-[#0a0a1a]/40 border border-white/5 hover:border-white/10 transition-colors">
          <div className="flex items-center justify-center gap-1 mb-1">
            <div style={{ color: m.color }}>{m.icon}</div>
            <span className="text-[7px] sm:text-[8px] text-[#8888aa] uppercase tracking-wider">{m.label}</span>
          </div>
          <div className="text-[10px] sm:text-xs font-bold font-mono" style={{ color: m.color }}>
            {m.value}
          </div>
        </div>
      ))}
    </motion.div>
  );
}

/* ===== Enhanced Phase Flow ===== */
function EnhancedPhaseFlow({ ragPhase, phaseElapsed }: { ragPhase: RAGPhase; phaseElapsed: number }) {
  const currentPhaseIndex = PHASE_FLOW.indexOf(ragPhase);
  const [flowProgress, setFlowProgress] = useState(0);
  const prevPhaseRef = useRef<RAGPhase>(ragPhase);

  const flowProgressRef = useRef(0);

  useEffect(() => {
    if (ragPhase !== prevPhaseRef.current) {
      prevPhaseRef.current = ragPhase;
      flowProgressRef.current = 0;
    }
    if (ragPhase === 'idle') return;
    const duration = PHASE_DURATION_MS[ragPhase];
    if (!duration) return;
    const startTime = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(1, elapsed / duration);
      flowProgressRef.current = progress;
      setFlowProgress(progress);
    }, 100);
    return () => clearInterval(interval);
  }, [ragPhase]);

  const formatPhaseElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  return (
    <motion.div
      className="mb-4"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.4 }}
    >
      <div className="flex items-center justify-center gap-1 sm:gap-1.5 flex-wrap">
        {PHASE_FLOW.map((phase, i) => {
          const isActive = i === currentPhaseIndex;
          const isPast = i < currentPhaseIndex;
          const isFuture = i > currentPhaseIndex;

          return (
            <div key={phase} className="flex items-center gap-1 sm:gap-1.5">
              <motion.div
                className="relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] sm:text-[10px] font-mono uppercase tracking-wider border transition-all"
                style={isActive ? {
                  color: PHASE_COLORS[phase],
                  borderColor: PHASE_COLORS[phase] + '55',
                  backgroundColor: PHASE_COLORS[phase] + '11',
                  boxShadow: `0 0 16px ${PHASE_COLORS[phase]}25`,
                } : {
                  borderColor: isPast ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.03)',
                  backgroundColor: isPast ? 'rgba(255,255,255,0.03)' : 'transparent',
                }}
                animate={isActive ? { boxShadow: [`0 0 12px ${PHASE_COLORS[phase]}20`, `0 0 24px ${PHASE_COLORS[phase]}40`, `0 0 12px ${PHASE_COLORS[phase]}20`] } : {}}
                transition={isActive ? { duration: 1.5, repeat: Infinity } : {}}
              >
                {/* Status dot */}
                <div className="relative">
                  <div className="w-1.5 h-1.5 rounded-full" style={{
                    backgroundColor: isActive ? PHASE_COLORS[phase] : isPast ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.1)',
                  }} />
                  {isActive && (
                    <motion.div
                      className="absolute inset-0 w-1.5 h-1.5 rounded-full"
                      style={{ backgroundColor: PHASE_COLORS[phase] }}
                      animate={{ scale: [1, 1.8, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                  )}
                </div>
                <span className={isFuture ? 'text-[#555577]' : isPast ? 'text-[#8888aa]' : ''}>{PHASE_LABELS[phase]}</span>
                {/* Phase duration timer */}
                {isActive && ragPhase !== 'idle' && (
                  <span className="ml-1 flex items-center gap-0.5" style={{ color: PHASE_COLORS[phase] }}>
                    <Clock className="w-2.5 h-2.5" />
                    {formatPhaseElapsed(phaseElapsed)}
                  </span>
                )}
                {/* Throughput counter */}
                {isActive && ragPhase !== 'idle' && (
                  <span className="text-[7px] ml-1 opacity-60" style={{ color: PHASE_COLORS[phase] }}>
                    {PHASE_THROUGHPUT[ragPhase]}
                  </span>
                )}
                {/* Active phase progress bar */}
                {isActive && (
                  <div className="absolute bottom-0 left-1 h-0.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase], width: `${flowProgress * 100}%` }} />
                )}
              </motion.div>

              {/* Animated data flow connector between phases */}
              {i < PHASE_FLOW.length - 1 && (
                <div className="relative w-6 sm:w-8 h-[2px] flex-shrink-0">
                  <div className="absolute inset-0 bg-white/[0.06] rounded-full" />
                  {/* Data flow line traveling between phases */}
                  {(isPast || (isActive && flowProgress > 0.3)) && (
                    <motion.div
                      className="absolute top-1/2 -translate-y-1/2 w-3 h-0.5 rounded-full"
                      style={{ backgroundColor: isPast ? '#06d6a0' : PHASE_COLORS[phase] }}
                      animate={{ left: ['0%', '100%'], opacity: [0, 1, 1, 0] }}
                      transition={{
                        duration: 0.8,
                        repeat: Infinity,
                        repeatDelay: 0.6,
                        ease: 'easeInOut',
                        delay: i * 0.15,
                      }}
                    />
                  )}
                  {/* Arrow indicator */}
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 text-[#555577] text-[8px]">&rarr;</div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}

/* ===== Main Component ===== */
export default function AgenticRAGSection() {
  const [ragPhase, setRagPhase] = useState<RAGPhase>('idle');
  const [orgasmState, setOrgasmState] = useState<OrgasmState>('dormant');
  const [selectedGraphNode, setSelectedGraphNode] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<VaultFileData | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [phaseElapsed, setPhaseElapsed] = useState<number>(0);
  const phaseStartTimeRef = useRef<number>(0);
  const phaseTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startRAGCycle = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    setOrgasmState('awakening');
    setRagPhase('indexing');
    setPhaseElapsed(0);
    phaseStartTimeRef.current = Date.now();
    phaseTimerRef.current = setInterval(() => {
      setPhaseElapsed(Math.floor((Date.now() - phaseStartTimeRef.current) / 1000));
    }, 1000);

    const timings: { phase: RAGPhase; delay: number; state?: OrgasmState }[] = [
      { phase: 'retrieving', delay: 3000, state: 'active' },
      { phase: 'generating', delay: 6000 },
      { phase: 'streaming', delay: 10000 },
    ];

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    timings.forEach(({ phase, delay, state }) => {
      timeouts.push(setTimeout(() => {
        setRagPhase(phase);
        phaseStartTimeRef.current = Date.now();
        if (state) setOrgasmState(state);
      }, delay));
    });

    timeouts.push(setTimeout(() => {
      if (phaseTimerRef.current) {
        clearInterval(phaseTimerRef.current);
        phaseTimerRef.current = null;
      }
      setRagPhase('idle');
      setOrgasmState('transcendent');
      setIsProcessing(false);
      setPhaseElapsed(0);
      setCycleCount(prev => prev + 1);

      setTimeout(() => setOrgasmState('dormant'), 3000);
    }, 14000));

    return () => timeouts.forEach(clearTimeout);
  }, [isProcessing]);

  const handleFileActivate = useCallback((file: VaultFileData) => {
    setActiveFile(file);
    setTimeout(() => setActiveFile(null), 4000);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedGraphNode(nodeId === selectedGraphNode ? null : nodeId);
  }, [selectedGraphNode]);

  const handleCommandSent = useCallback((cmd: string) => {
    if (cmd.includes('/rag') && ragPhase === 'idle' && !isProcessing) {
      startRAGCycle();
    }
  }, [ragPhase, isProcessing, startRAGCycle]);

  const organismStats = [
    { label: 'Claude', value: 'v3.7', sub: 'Anthropic', icon: <Brain className="w-3.5 h-3.5" />, color: '#fbbf24' },
    { label: 'Fable 5', value: 'beta.3', sub: 'Narrative', icon: <BookOpen className="w-3.5 h-3.5" />, color: '#e040a0' },
    { label: 'Obsidian', value: '2,847', sub: 'notes', icon: <Eye className="w-3.5 h-3.5" />, color: '#8b5cf6' },
    { label: 'Git Clone', value: '3', sub: 'repos', icon: <GitBranch className="w-3.5 h-3.5" />, color: '#06d6a0' },
    { label: 'RAG Pipeline', value: '5-stage', sub: 'Index->Stream', icon: <GitBranch className="w-3.5 h-3.5" />, color: '#a855f7' },
    { label: 'Memory', value: `${(2.4 + cycleCount * 0.3).toFixed(1)} ZB`, sub: 'context buffer', icon: <Database className="w-3.5 h-3.5" />, color: '#06b6d4' },
  ];

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #e040a0 0%, transparent 60%)', filter: 'blur(80px)' }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[350px] opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, #fbbf24 0%, transparent 60%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-[#e040a0] mb-4 border border-[#e040a0]/20 px-4 py-2 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Cpu className="w-3 h-3" />
            AI Agentic Atemporal
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="text-white">Organismo </span>
            <span className="bg-gradient-to-r from-[#e040a0] via-[#fbbf24] to-[#a855f7] bg-clip-text text-transparent">
              RAG LLM
            </span>
            <span className="text-white"> Atemporal</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-[#8888aa] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Claude Anthropic + Fable 5 Narrative Engine + Obsidian Knowledge Graph + Git Clone.
            Um organismo AI agentic que indexa, recupera e gera narrativas a partir de artefatos
            temporais em escala Zettascale.
          </motion.p>
        </div>

        {/* Organism stats (6 total) */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          {organismStats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl p-3 flex items-center gap-3 border border-white/5 group hover:border-white/10 transition-colors"
            >
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <div>
                <div className="text-[10px] text-[#8888aa] uppercase tracking-wider">{stat.label}</div>
                <div className="text-sm font-bold font-mono text-white">{stat.value}</div>
                <div className="text-[8px] text-[#8888aa]/60">{stat.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Enhanced Phase Flow */}
        <EnhancedPhaseFlow ragPhase={ragPhase} phaseElapsed={phaseElapsed} />

        {/* Collaboration Mesh */}
        <CollaborationMesh isActive={ragPhase !== 'idle'} />

        {/* Active file notification */}
        {activeFile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 max-w-md mx-auto glass rounded-lg p-2.5 border border-white/10 flex items-center gap-2"
          >
            <Database className="w-3.5 h-3.5 shrink-0" style={{ color: activeFile.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono text-white truncate">{activeFile.name}</div>
              <div className="text-[8px] text-[#8888aa]">{activeFile.size} · {activeFile.status}</div>
            </div>
            <div className="text-[8px] font-mono text-[#06d6a0]">INDEXED</div>
          </motion.div>
        )}

        {/* RAG Pipeline Metrics Dashboard */}
        <div className="mb-6">
          <RAGPipelineMetrics cycleCount={cycleCount} isProcessing={isProcessing} ragPhase={ragPhase} />
        </div>

        {/* Main Grid: Vault + Graph (top) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Knowledge Vault Canvas */}
          <motion.div
            className="relative rounded-2xl overflow-hidden glass gradient-border"
            style={{ minHeight: '380px' }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                isProcessing ? 'bg-[#fbbf24] animate-pulse' : ragPhase === 'idle' ? 'bg-[#8888aa]' : 'bg-[#06d6a0]'
              }`} />
              <span className="text-[10px] font-mono text-[#8888aa] tracking-wider uppercase">Knowledge Vault</span>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="text-[9px] font-mono text-[#fbbf24] border border-[#fbbf24]/20 px-2 py-0.5 rounded-full">
                7 ARTEFATOS SEALED
              </span>
            </div>
            <KnowledgeVaultCanvas
              isActive={ragPhase !== 'idle'}
              ragPhase={ragPhase}
              onFileActivate={handleFileActivate}
            />
          </motion.div>

          {/* Obsidian Knowledge Graph */}
          <motion.div
            className="relative rounded-2xl overflow-hidden glass gradient-border"
            style={{ minHeight: '380px' }}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                selectedGraphNode ? 'bg-[#a855f7]' : 'bg-[#8888aa]'
              }`} />
              <span className="text-[10px] font-mono text-[#8888aa] tracking-wider uppercase">Obsidian Knowledge Graph</span>
            </div>
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#a855f7] border border-[#a855f7]/20 px-2 py-0.5 rounded-full">
                15 NOS · 42 ARESTAS
              </span>
            </div>
            <ObsidianKnowledgeGraph
              isActive={ragPhase !== 'idle'}
              activeNode={selectedGraphNode || undefined}
              onNodeClick={handleNodeClick}
            />
          </motion.div>
        </div>

        {/* Bottom Grid: Terminal + Fable (bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* AI Agent Terminal */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <AIAgentTerminal
              isProcessing={isProcessing}
              onCommandSent={handleCommandSent}
            />
          </motion.div>

          {/* Fable 5 Narrative Engine */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="glass rounded-xl p-4 border border-[#e040a0]/15 h-full" style={{ minHeight: '460px' }}>
              <FableNarrativeEngine
                isActive={ragPhase !== 'idle'}
                ragPhase={ragPhase}
              />
            </div>
          </motion.div>
        </div>

        {/* Control Bar with Sparkline and Orgasm State */}
        <motion.div
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center gap-4 flex-wrap justify-center">
            {cycleCount > 0 && (
              <span className="text-[9px] text-[#8888aa] font-mono">{cycleCount} ciclo(s) completo(s)</span>
            )}
            <RAGSparkline cycleCount={cycleCount} />
          </div>

          <div className="flex items-center gap-2">
            {!isProcessing && (
              <motion.button
                onClick={startRAGCycle}
                className="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#e040a0] to-[#a855f7] text-white hover:shadow-[0_0_25px_rgba(224,64,160,0.4)] transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <Brain className="w-4 h-4" />
                Ativar Ciclo RAG Completo
              </motion.button>
            )}
            {isProcessing && (
              <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e040a0]/10 border border-[#e040a0]/20">
                <div className="w-2 h-2 rounded-full bg-[#e040a0] animate-pulse" />
                <span className="text-sm font-mono text-[#e040a0]">Processamento em andamento...</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* Orgasm State Visual */}
        <div className="mt-4">
          <OrgasmStateVisual state={orgasmState} isProcessing={isProcessing} />
        </div>

        {/* Footer Metrics (10 total) */}
        <motion.div
          className="mt-6 grid grid-cols-5 sm:grid-cols-10 gap-2 sm:gap-3"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          {[
            { label: 'Embeddings', value: `${(2.4 + cycleCount * 0.3).toFixed(1)} ZB`, color: '#a855f7' },
            { label: 'Claude Tokens', value: `${(847 + cycleCount * 123).toLocaleString()}K`, color: '#fbbf24' },
            { label: 'Fable Arcos', value: `${3 + cycleCount}`, color: '#e040a0' },
            { label: 'Graph Nodes', value: `${15 + cycleCount * 2}`, color: '#8b5cf6' },
            { label: 'Vault I/O', value: `${(7.3 + cycleCount * 1.1).toFixed(1)} ZB/s`, color: '#06d6a0' },
            { label: 'Ciclos', value: String(cycleCount), color: '#fbbf24' },
            { label: 'Retrieval Recall', value: `${(94.2 + cycleCount * 0.8).toFixed(1)}%`, color: '#06d6a0' },
            { label: 'Context Window', value: `${(128 + cycleCount * 16)}K`, color: '#06b6d4' },
            { label: 'Latencia RAG', value: `${(23 - cycleCount * 1.2).toFixed(0)}ms`, color: '#fbbf24' },
            { label: 'Coerencia', value: `${(96.1 + cycleCount * 0.5).toFixed(1)}%`, color: '#e040a0' },
          ].map(m => (
            <div key={m.label} className="text-center p-2.5 rounded-xl bg-[#0a0a1a]/40 border border-white/5">
              <div className="text-[7px] sm:text-[8px] text-[#8888aa] uppercase tracking-wider mb-1">{m.label}</div>
              <div className="text-[10px] sm:text-xs font-bold font-mono" style={{ color: m.color }}>
                {m.value}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}