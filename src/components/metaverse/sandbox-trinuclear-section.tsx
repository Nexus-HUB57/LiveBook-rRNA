'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, Zap, RefreshCw, ArrowLeftRight, Shield, Thermometer, Activity, Layers, AlertTriangle, Link2 } from 'lucide-react';
import TrinuclearSandboxCanvas from './trinuclear-sandbox-canvas';

type SandboxPhase = 'offline' | 'booting' | 'synchronizing' | 'active' | 'stress-test';
type CoreId = 'ollama' | 'llama4' | 'openai';
type StressTestSubPhase = 'ramp-up' | 'peak-load' | 'error-injection' | 'none';

interface CoreStatus {
  id: CoreId;
  name: string;
  engine: string;
  version: string;
  status: 'offline' | 'loading' | 'ready' | 'processing' | 'error';
  temperature: number;
  tokensPerSec: number;
  memoryGB: number;
  model: string;
  latency: number;
  color: string;
  uptime: number;
  requests: number;
  accuracy: number;
}

const INITIAL_CORES: CoreStatus[] = [
  {
    id: 'ollama', name: 'Ollama', engine: 'llama.cpp', version: '0.5.4',
    status: 'offline', temperature: 0.7, tokensPerSec: 0, memoryGB: 0,
    model: 'Llama 4 Maverick (Local)', latency: 0, color: '#06d6a0', uptime: 0, requests: 0, accuracy: 0,
  },
  {
    id: 'llama4', name: 'Llama 4 Maverick', engine: 'PyTorch', version: '4.0-maverick',
    status: 'offline', temperature: 0.5, tokensPerSec: 0, memoryGB: 0,
    model: 'Meta Llama 4 Maverick 128E', latency: 0, color: '#fbbf24', uptime: 0, requests: 0, accuracy: 0,
  },
  {
    id: 'openai', name: 'OpenAI', engine: 'Native API', version: 'v1.84',
    status: 'offline', temperature: 0.3, tokensPerSec: 0, memoryGB: 0,
    model: 'GPT-4o / o3-mini', latency: 0, color: '#e040a0', uptime: 0, requests: 0, accuracy: 0,
  },
];

interface InferenceLog {
  id: number;
  core: CoreId;
  prompt: string;
  response: string;
  tokens: number;
  latency: number;
  timestamp: string;
}

const SAMPLE_INFERENCE: Record<CoreId, { prompt: string; response: string }[]> = {
  ollama: [
    { prompt: 'Analise a integridade do vault...', response: 'Vault integrity verified: 7/7 sealed. SHA-512 hash confirmado.' },
    { prompt: 'Gere embedding RAG para artefato 2026...', response: 'Embedding gerado: 4096 dims, cosine_sim=0.947. Indexado no VectorDB.' },
    { prompt: 'Simbiose quantica status...', response: 'Pares EPR ativos: 128/128. Coerencia: 99.97%. Camada rRNA sincronizada.' },
  ],
  llama4: [
    { prompt: 'Navegue no knowledge graph...', response: '15 nos mapeados. Caminho critico: MetaTempo -> RAG -> Claude -> Fable. Profundidade: 4.' },
    { prompt: 'Gere arco narrativo Fable 5...', response: 'Arco gerado: "O Legado" com 7 capitulos. Coerencia: 0.94. Branches: 12.' },
    { prompt: 'Valide zettascale metrics...', response: 'Throughput: 1.18 ZB/s. Latencia: 0.047ns. Todos os nucleos certificados.' },
  ],
  openai: [
    { prompt: 'Claude: analyze temporal artifacts...', response: 'Analysis complete. 2026 artifacts show 97.3% coherence with 2077 projections.' },
    { prompt: 'Optimize RAG retrieval pipeline...', response: 'Pipeline optimized. Top-K: 128 -> 256. Recall improved 23%. Latency -18ms.' },
    { prompt: 'Sandbox sync verification...', response: 'All 3 cores synchronized via OpenClaw. Entanglement verified. System stable.' },
  ],
};

const STRESS_PHASE_LABELS: Record<StressTestSubPhase, string> = {
  none: '',
  'ramp-up': 'Phase 1: Ramp Up',
  'peak-load': 'Phase 2: Peak Load',
  'error-injection': 'Phase 3: Error Injection',
};

const STRESS_PHASE_COLORS: Record<StressTestSubPhase, string> = {
  none: '#8888aa',
  'ramp-up': '#fbbf24',
  'peak-load': '#e040a0',
  'error-injection': '#ef4444',
};

function LatencyChart({ cores }: { cores: CoreStatus[] }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const historyRef = useRef<Record<CoreId, number[]>>({
    ollama: [],
    llama4: [],
    openai: [],
  });

  useEffect(() => {
    cores.forEach(c => {
      if (c.status !== 'offline' && c.status !== 'loading' && c.latency > 0) {
        historyRef.current[c.id].push(c.latency);
        if (historyRef.current[c.id].length > 30) {
          historyRef.current[c.id] = historyRef.current[c.id].slice(-30);
        }
      }
    });

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
    const padX = 2;
    const padY = 2;
    const chartW = w - padX * 2;
    const chartH = h - padY * 2;

    ctx.clearRect(0, 0, w, h);

    // Find max value across all histories
    let maxVal = 50;
    Object.values(historyRef.current).forEach(hist => {
      hist.forEach(v => { if (v > maxVal) maxVal = v; });
    });
    maxVal = Math.ceil(maxVal / 20) * 20;

    const coreColors: Record<CoreId, string> = {
      ollama: '#06d6a0',
      llama4: '#fbbf24',
      openai: '#e040a0',
    };

    (Object.keys(historyRef.current) as CoreId[]).forEach(coreId => {
      const data = historyRef.current[coreId];
      if (data.length < 2) return;

      ctx.beginPath();
      data.forEach((val, i) => {
        const x = padX + (i / 29) * chartW;
        const y = padY + chartH - (val / maxVal) * chartH;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      });
      ctx.strokeStyle = coreColors[coreId];
      ctx.lineWidth = 1.2;
      ctx.globalAlpha = 0.8;
      ctx.stroke();
      ctx.globalAlpha = 1;
    });

    // Y-axis labels
    ctx.font = '7px monospace';
    ctx.fillStyle = '#555577';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'top';
    ctx.fillText(`${maxVal}`, w - 2, padY);
    ctx.fillText('0', w - 2, padY + chartH - 8);
  }, [cores]);

  return (
    <div className="col-span-2 sm:col-span-2">
      <canvas
        ref={canvasRef}
        className="block w-full"
        style={{ height: '40px' }}
      />
    </div>
  );
}

export default function SandboxTrinuclearSection() {
  const [phase, setPhase] = useState<SandboxPhase>('offline');
  const [cores, setCores] = useState<CoreStatus[]>(INITIAL_CORES);
  const [logs, setLogs] = useState<InferenceLog[]>([]);
  const [syncIntensity, setSyncIntensity] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [stressSubPhase, setStressSubPhase] = useState<StressTestSubPhase>('none');
  const [crossCoreActive, setCrossCoreActive] = useState<CoreId[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [errorFlashCore, setErrorFlashCore] = useState<CoreId | null>(null);
  const logIdRef = useRef(0);
  const intervalRefs = useRef<ReturnType<typeof setInterval>[]>([]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedSec(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Live metric fluctuation
  useEffect(() => {
    if (phase !== 'active' && phase !== 'stress-test') return;
    const interval = setInterval(() => {
      setCores(prev => prev.map(c => {
        if (c.status === 'offline' || c.status === 'loading') return c;
        return {
          ...c,
          tokensPerSec: Math.max(0, c.tokensPerSec + (Math.random() - 0.45) * 5),
          latency: Math.max(1, c.latency + (Math.random() - 0.5) * 2),
          requests: c.requests + (phase === 'stress-test' ? Math.floor(Math.random() * 3) : Math.random() > 0.7 ? 1 : 0),
          uptime: c.uptime + 1,
        };
      }));
    }, 1000);
    intervalRefs.current.push(interval);
    return () => clearInterval(interval);
  }, [phase]);

  const clearIntervals = useCallback(() => {
    intervalRefs.current.forEach(clearInterval);
    intervalRefs.current = [];
  }, []);

  const addLog = useCallback((core: CoreId, sample: { prompt: string; response: string }, tokens: number, latency: number) => {
    const s = elapsedSec;
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const timestamp = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
    setLogs(prev => [...prev.slice(-49), {
      id: logIdRef.current++,
      core,
      prompt: sample.prompt,
      response: sample.response,
      tokens,
      latency,
      timestamp,
    }]);
  }, [elapsedSec]);

  const bootSequence = useCallback(() => {
    if (phase !== 'offline') return;
    setPhase('booting');
    clearIntervals();
    setCores(INITIAL_CORES.map(c => ({ ...c, status: 'loading' as const })));
    setSyncIntensity(0);
    setStressSubPhase('none');
    setCrossCoreActive([]);
    setErrorCount(0);
    setErrorFlashCore(null);

    const bootTargets = [
      { idx: 0, delay: 800 },
      { idx: 1, delay: 2200 },
      { idx: 2, delay: 3600 },
    ];

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    bootTargets.forEach(({ idx, delay }) => {
      timeouts.push(setTimeout(() => {
        setCores(prev => {
          const next = [...prev];
          next[idx] = {
            ...next[idx],
            status: 'ready',
            tokensPerSec: 45 + Math.random() * 30,
            memoryGB: 8 + Math.random() * 12,
            latency: 15 + Math.random() * 25,
            accuracy: 0.92 + Math.random() * 0.07,
          };
          return next;
        });
      }, delay));
    });

    timeouts.push(setTimeout(() => {
      setPhase('synchronizing');
      let syncProg = 0;
      const syncInterval = setInterval(() => {
        syncProg += 0.03 + Math.random() * 0.04;
        setSyncIntensity(Math.min(1, syncProg));
        if (syncProg >= 1) {
          clearInterval(syncInterval);
          setPhase('active');
          setSyncIntensity(1);
        }
      }, 200);
      intervalRefs.current.push(syncInterval);
    }, 5000));

    return () => timeouts.forEach(clearTimeout);
  }, [phase, clearIntervals]);

  // Auto inference during active/stress-test
  useEffect(() => {
    if (phase !== 'active' && phase !== 'stress-test') return;

    const interval = setInterval(() => {
      const coreId = ['ollama', 'llama4', 'openai'][Math.floor(Math.random() * 3)] as CoreId;
      const samples = SAMPLE_INFERENCE[coreId];
      const sample = samples[Math.floor(Math.random() * samples.length)];
      const tokens = 120 + Math.floor(Math.random() * 380);
      const latency = 20 + Math.floor(Math.random() * 180);

      setCores(prev => prev.map(c =>
        c.id === coreId ? { ...c, status: 'processing' as const } : c
      ));

      // Cross-core inference during stress test peak-load phase
      if (phase === 'stress-test' && stressSubPhase === 'peak-load' && Math.random() > 0.6) {
        const otherCores = ['ollama', 'llama4', 'openai'].filter(c => c !== coreId);
        const numCollaborators = 1 + Math.floor(Math.random() * 2);
        const collaborators = otherCores.sort(() => Math.random() - 0.5).slice(0, numCollaborators);
        setCrossCoreActive([coreId, ...collaborators] as CoreId[]);
        setTimeout(() => setCrossCoreActive([]), 1500);

        collaborators.forEach(cc => {
          setCores(prev => prev.map(c =>
            c.id === cc ? { ...c, status: 'processing' as const } : c
          ));
        });

        setTimeout(() => {
          collaborators.forEach(cc => {
            setCores(prev => prev.map(c =>
              c.id === cc ? { ...c, status: 'ready' as const } : c
            ));
          });
        }, 600);
      }

      setTimeout(() => {
        addLog(coreId, sample, tokens, latency);
        setCores(prev => prev.map(c =>
          c.id === coreId ? { ...c, status: 'ready' as const, requests: c.requests + 1 } : c
        ));
      }, 200);
    }, phase === 'stress-test' ? 800 : 2500);

    intervalRefs.current.push(interval);
    return () => clearInterval(interval);
  }, [phase, stressSubPhase, addLog]);

  const shutdown = useCallback(() => {
    clearIntervals();
    setPhase('offline');
    setSyncIntensity(0);
    setCores(INITIAL_CORES);
    setStressSubPhase('none');
    setCrossCoreActive([]);
  }, [clearIntervals]);

  const runStressTest = useCallback(() => {
    if (phase === 'offline' || phase === 'booting') return;
    setPhase('stress-test');
    setSyncIntensity(1);
    setErrorCount(0);

    let stressTime = 0;
    const interval = setInterval(() => {
      stressTime++;

      // Phase 1: Gradual ramp up (0-5s)
      if (stressTime <= 5) {
        setStressSubPhase('ramp-up');
        const rampFactor = stressTime / 5;
        setCores(prev => prev.map(c => ({
          ...c,
          temperature: Math.min(1.2, c.temperature + 0.003 * rampFactor),
          tokensPerSec: Math.max(20, c.tokensPerSec + (Math.random() - 0.4) * 8 * rampFactor),
        })));
      }
      // Phase 2: Peak load with cross-core (5-10s)
      else if (stressTime <= 10) {
        setStressSubPhase('peak-load');
        setCores(prev => prev.map(c => ({
          ...c,
          temperature: Math.min(1.8, c.temperature + 0.008 + Math.random() * 0.01),
          tokensPerSec: Math.max(30, c.tokensPerSec + (Math.random() - 0.35) * 15),
        })));
      }
      // Phase 3: Error injection and recovery (10-15s)
      else if (stressTime <= 15) {
        setStressSubPhase('error-injection');

        // Occasionally inject an error
        if (stressTime === 11 || stressTime === 13) {
          const errorCore = INITIAL_CORES[Math.floor(Math.random() * 3)];
          setErrorCount(prev => prev + 1);
          setErrorFlashCore(errorCore.id);
          setCores(prev => prev.map(c =>
            c.id === errorCore.id ? { ...c, status: 'error' as const, latency: c.latency * 3 } : c
          ));
          // Recover after 800ms
          setTimeout(() => {
            setErrorFlashCore(null);
            setCores(prev => prev.map(c =>
              c.id === errorCore.id ? { ...c, status: 'ready' as const, latency: 20 + Math.random() * 15 } : c
            ));
          }, 800);
        }

        setCores(prev => prev.map(c => ({
          ...c,
          temperature: Math.max(0.5, c.temperature - 0.005),
          tokensPerSec: Math.max(40, c.tokensPerSec + (Math.random() - 0.5) * 10),
        })));
      }

      if (stressTime >= 15) {
        clearInterval(interval);
        setPhase('active');
        setStressSubPhase('none');
        setCrossCoreActive([]);
        setCores(prev => prev.map(c => ({
          ...c,
          status: 'ready' as const,
          temperature: 0.5 + Math.random() * 0.3,
          tokensPerSec: 50 + Math.random() * 30,
        })));
      }
    }, 1000);
    intervalRefs.current.push(interval);
  }, [phase]);

  const resetCores = useCallback(() => {
    shutdown();
    setTimeout(() => bootSequence(), 500);
    setCycleCount(prev => prev + 1);
  }, [shutdown, bootSequence]);

  const corePower: Record<string, number> = {};
  cores.forEach(c => {
    corePower[c.id] = c.status === 'offline' ? 0 : c.status === 'loading' ? 0.3 : Math.min(1, (c.tokensPerSec / 80));
  });

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const phaseLabel: Record<SandboxPhase, string> = {
    offline: 'OFFLINE', booting: 'BOOTING', synchronizing: 'SYNCING', active: 'ACTIVE', 'stress-test': 'STRESS TEST',
  };
  const phaseColor: Record<SandboxPhase, string> = {
    offline: '#8888aa', booting: '#fbbf24', synchronizing: '#a855f7', active: '#06d6a0', 'stress-test': '#e040a0',
  };

  const totalTPS = cores.reduce((s, c) => s + c.tokensPerSec, 0);
  const totalReqs = cores.reduce((s, c) => s + c.requests, 0);
  const avgAccuracy = cores.reduce((s, c) => s + c.accuracy, 0) / 3;
  const avgLatency = cores.reduce((s, c) => s + c.latency, 0) / 3;

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, #a855f7 0%, transparent 60%)', filter: 'blur(100px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-[#a855f7] mb-4 border border-[#a855f7]/20 px-4 py-2 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Shield className="w-3 h-3" />
            OpenClaw Native
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="text-white">Sandbox </span>
            <span className="bg-gradient-to-r from-[#06d6a0] via-[#fbbf24] to-[#e040a0] bg-clip-text text-transparent">
              Trinuclear
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 text-[#8888aa] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Tres nucleos de inferencia nativos sincronizados via OpenClaw:
            Ollama (runtime local), Llama 4 Maverick (Meta), e OpenAI (API nativa).
            Sandbox isolado com validacao de estresse em tempo real.
          </motion.p>
        </div>

        {/* Live stats bar (6 stats) */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          {[
            { label: 'Throughput', value: `${totalTPS.toFixed(0)} tok/s`, color: '#06d6a0', icon: <Zap className="w-4 h-4" /> },
            { label: 'Requests', value: totalReqs.toLocaleString(), color: '#fbbf24', icon: <Activity className="w-4 h-4" /> },
            { label: 'Latencia Media', value: `${avgLatency.toFixed(1)}ms`, color: '#a855f7', icon: <Cpu className="w-4 h-4" /> },
            { label: 'Uptime', value: formatTime(elapsedSec), color: '#e040a0', icon: <Layers className="w-4 h-4" /> },
            { label: 'Acuracia Media', value: `${(avgAccuracy * 100).toFixed(1)}%`, color: '#8b5cf6', icon: <Shield className="w-4 h-4" /> },
            { label: 'Ciclos', value: String(cycleCount), color: '#06b6d4', icon: <RefreshCw className="w-4 h-4" /> },
          ].map(stat => (
            <div key={stat.label} className="glass rounded-xl p-3 flex items-center gap-3 border border-white/5">
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <div>
                <div className="text-[10px] text-[#8888aa] uppercase tracking-wider">{stat.label}</div>
                <div className="text-sm font-bold font-mono text-white">{stat.value}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Live Latency Chart */}
        {(phase === 'active' || phase === 'stress-test') && (
          <motion.div
            className="glass rounded-xl p-3 border border-white/5 mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-[9px] font-mono text-[#8888aa] uppercase tracking-wider">Latencia por Core (30 samples)</span>
              <div className="flex items-center gap-3">
                {cores.map(c => (
                  <span key={c.id} className="flex items-center gap-1">
                    <span className="w-2 h-0.5 rounded-full" style={{ backgroundColor: c.color }} />
                    <span className="text-[7px] font-mono" style={{ color: c.color }}>{c.name}</span>
                  </span>
                ))}
              </div>
            </div>
            <LatencyChart cores={cores} />
          </motion.div>
        )}

        {/* Cross-Core Inference Protocol Indicator */}
        <AnimatePresence>
          {crossCoreActive.length > 0 && (
            <motion.div
              className="mb-4 flex items-center justify-center gap-2"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#fbbf24]/30 bg-[#fbbf24]/10">
                <Link2 className="w-3.5 h-3.5 text-[#fbbf24]" />
                <span className="text-[10px] font-mono font-bold text-[#fbbf24]">CROSS-CORE</span>
                <span className="text-[8px] font-mono text-[#fbbf24]/70">
                  {crossCoreActive.map(id => cores.find(c => c.id === id)?.name).join(' + ')}
                </span>
                {/* Animated connection lines visual */}
                <div className="flex items-center gap-1">
                  {crossCoreActive.map((id, i) => (
                    <span key={id}>
                      <motion.span
                        className="inline-block w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: cores.find(c => c.id === id)?.color }}
                        animate={{ scale: [0.8, 1.4, 0.8] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.2 }}
                      />
                      {i < crossCoreActive.length - 1 && (
                        <motion.span
                          className="inline-block w-4 h-[1px] mx-0.5"
                          style={{ backgroundColor: '#fbbf24' }}
                          animate={{ opacity: [0.3, 1, 0.3] }}
                          transition={{ duration: 0.4, repeat: Infinity }}
                        />
                      )}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Recovery Visualization */}
        <AnimatePresence>
          {errorFlashCore && (
            <motion.div
              className="mb-4 flex items-center justify-center gap-2"
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.3 }}
            >
              <div
                className="flex items-center gap-2 px-4 py-2 rounded-xl border bg-[#ef4444]/10 animate-pulse"
                style={{ borderColor: '#ef444440' }}
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[#ef4444]" />
                <span className="text-[10px] font-mono font-bold text-[#ef4444]">
                  ERROR: {cores.find(c => c.id === errorFlashCore)?.name}
                </span>
                <span className="text-[8px] font-mono text-[#ef4444]/70">Recovering...</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Grid: Canvas + Core Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 mb-6">
          {/* Trinuclear Canvas */}
          <motion.div
            className="lg:col-span-7 relative rounded-2xl overflow-hidden glass gradient-border"
            style={{ minHeight: '420px' }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                phase === 'active' ? 'bg-[#06d6a0]' :
                phase === 'stress-test' ? 'bg-[#e040a0] animate-pulse' :
                phase === 'booting' || phase === 'synchronizing' ? 'bg-[#fbbf24] animate-pulse' :
                'bg-[#8888aa]'
              }`} />
              <span className="text-[10px] font-mono text-[#8888aa] tracking-wider uppercase">
                {phaseLabel[phase]}
              </span>
              {phase === 'stress-test' && stressSubPhase !== 'none' && (
                <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full ml-1"
                  style={{
                    color: STRESS_PHASE_COLORS[stressSubPhase],
                    backgroundColor: STRESS_PHASE_COLORS[stressSubPhase] + '15',
                    border: `1px solid ${STRESS_PHASE_COLORS[stressSubPhase]}30`,
                  }}
                >
                  {STRESS_PHASE_LABELS[stressSubPhase]}
                </span>
              )}
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="text-[9px] font-mono border px-2 py-0.5 rounded-full"
                style={{ color: phaseColor[phase], borderColor: phaseColor[phase] + '33', backgroundColor: phaseColor[phase] + '11' }}
              >
                OPENCLAW SANDBOX
              </span>
            </div>
            <TrinuclearSandboxCanvas
              isActive={phase !== 'offline' && phase !== 'booting'}
              corePower={corePower}
              syncIntensity={syncIntensity}
            />
          </motion.div>

          {/* Core Status Cards */}
          <div className="lg:col-span-5 space-y-3">
            {cores.map((core, i) => (
              <motion.div
                key={core.id}
                className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors relative overflow-hidden"
                style={{
                  borderColor: core.status !== 'offline' ? core.color + '22' : undefined,
                  boxShadow: errorFlashCore === core.id ? '0 0 20px rgba(239,68,68,0.3), inset 0 0 30px rgba(239,68,68,0.1)' : undefined,
                }}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
              >
                {/* Error flash overlay */}
                <AnimatePresence>
                  {errorFlashCore === core.id && (
                    <motion.div
                      className="absolute inset-0 bg-[#ef4444] pointer-events-none"
                      initial={{ opacity: 0.3 }}
                      animate={{ opacity: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.8 }}
                    />
                  )}
                </AnimatePresence>

                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      core.status === 'offline' ? 'bg-[#555577]' :
                      core.status === 'loading' ? 'bg-[#fbbf24] animate-pulse' :
                      core.status === 'processing' ? 'bg-[#e040a0] animate-pulse' :
                      core.status === 'error' ? 'bg-[#ef4444] animate-pulse' :
                      'bg-[#06d6a0]'
                    }`} />
                    <span className="text-sm font-bold text-white">{core.name}</span>
                    <span className="text-[9px] font-mono text-[#8888aa]">{core.engine} {core.version}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {crossCoreActive.includes(core.id) && (
                      <span className="text-[7px] font-mono text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/25 px-1.5 py-0.5 rounded-full">
                        CROSS
                      </span>
                    )}
                    <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                      style={{
                        color: core.status === 'offline' ? '#8888aa' : core.status === 'error' ? '#ef4444' : core.color,
                        borderColor: core.status === 'offline' ? '#8888aa33' : core.status === 'error' ? '#ef444433' : core.color + '33',
                        backgroundColor: core.status === 'offline' ? '#8888aa11' : core.status === 'error' ? '#ef444411' : core.color + '11',
                        border: '1px solid',
                      }}
                    >
                      {core.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                <div className="text-[10px] font-mono text-[#8888aa] mb-3">{core.model}</div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'tok/s', value: core.tokensPerSec > 0 ? core.tokensPerSec.toFixed(0) : '--', color: core.color },
                    { label: 'Memory', value: core.memoryGB > 0 ? `${core.memoryGB.toFixed(1)}GB` : '--', color: core.color },
                    { label: 'Lat.', value: core.latency > 0 ? `${core.latency.toFixed(0)}ms` : '--', color: core.color },
                    { label: 'Acc.', value: core.accuracy > 0 ? `${(core.accuracy * 100).toFixed(1)}%` : '--', color: core.color },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-[8px] text-[#555577] uppercase">{m.label}</div>
                      <div className="text-[11px] font-bold font-mono" style={{ color: m.value !== '--' ? m.color : '#555577' }}>
                        {m.value}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Temperature bar */}
                {core.status !== 'offline' && (
                  <div className="mt-3 flex items-center gap-2">
                    <Thermometer className="w-3 h-3 text-[#8888aa]" />
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full transition-colors duration-300"
                        style={{
                          backgroundColor: core.temperature > 1.2 ? '#ef4444' : core.temperature > 0.8 ? '#fbbf24' : core.color,
                        }}
                        animate={{ width: `${Math.min(100, (core.temperature / 2) * 100)}%` }}
                      />
                    </div>
                    <span className="text-[8px] font-mono text-[#8888aa]">{core.temperature.toFixed(2)}</span>
                  </div>
                )}
              </motion.div>
            ))}

            {/* Error count metric during stress test */}
            {phase === 'stress-test' && (
              <motion.div
                className="glass rounded-xl p-3 border border-[#ef4444]/15 flex items-center gap-3"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <AlertTriangle className="w-4 h-4 text-[#ef4444]" />
                <div>
                  <div className="text-[10px] text-[#8888aa] uppercase tracking-wider">Erros Injetados</div>
                  <div className="text-sm font-bold font-mono text-[#ef4444]">{errorCount}</div>
                </div>
                <div className="ml-auto text-[8px] font-mono text-[#8888aa]">Recovered: {errorCount}</div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Inference Log */}
        <motion.div
          className="glass rounded-xl overflow-hidden border border-white/5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a1a]">
            <div className="flex items-center gap-2">
              <ArrowLeftRight className="w-3.5 h-3.5 text-[#a855f7]" />
              <span className="text-[10px] font-mono text-[#8888aa] tracking-wider uppercase">Inference Log</span>
            </div>
            <div className="flex items-center gap-3">
              {phase === 'active' && <span className="text-[8px] text-[#06d6a0] font-mono animate-pulse">LIVE</span>}
              {phase === 'stress-test' && <span className="text-[8px] text-[#e040a0] font-mono animate-pulse">STRESS</span>}
              <span className="text-[9px] font-mono text-[#8888aa]">{logs.length} entries</span>
            </div>
          </div>
          <div className="max-h-[180px] overflow-y-auto p-2 space-y-1">
            {logs.length === 0 && (
              <div className="text-center text-[10px] text-[#555577] py-6 font-mono">
                Aguardando inicializacao do sandbox...
              </div>
            )}
            {logs.slice().reverse().map(log => {
              const coreColor = cores.find(c => c.id === log.core)?.color || '#8888aa';
              return (
                <div key={log.id} className="flex items-start gap-2 px-2 py-1.5 rounded-lg hover:bg-white/[0.02] text-[10px] font-mono">
                  <span className="text-[#555577] shrink-0 pt-0.5">{log.timestamp}</span>
                  <span className="shrink-0 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                    style={{ color: coreColor, backgroundColor: coreColor + '15' }}
                  >
                    {log.core}
                  </span>
                  <span className="text-[#c0b8d0] flex-1 min-w-0 truncate">{log.prompt}</span>
                  <span className="text-[#8888aa] shrink-0">{log.latency}ms</span>
                  <span className="text-[#555577] shrink-0">{log.tokens}t</span>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* Control Bar */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center gap-4 flex-wrap justify-center">
            <div className="flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#a855f7]" />
              <span className="text-sm font-semibold text-white">Sandbox Trinuclear</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border"
              style={{
                color: phaseColor[phase],
                borderColor: phaseColor[phase] + '33',
                backgroundColor: phaseColor[phase] + '11',
              }}
            >
              {phaseLabel[phase]}
            </span>
            {cycleCount > 0 && (
              <span className="text-[9px] text-[#8888aa] font-mono">{cycleCount} ciclo(s)</span>
            )}
            {phase !== 'offline' && (
              <span className="text-[9px] text-[#8888aa] font-mono">
                Sync: {(syncIntensity * 100).toFixed(0)}% · Acc: {(avgAccuracy * 100).toFixed(1)}%
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {phase === 'offline' && (
              <motion.button
                onClick={bootSequence}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#06d6a0] via-[#fbbf24] to-[#e040a0] text-[#050510] hover:shadow-[0_0_20px_rgba(6,214,160,0.4)] transition-shadow"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
              >
                <Zap className="w-4 h-4" />
                Iniciar Sandbox
              </motion.button>
            )}
            {(phase === 'active' || phase === 'stress-test') && (
              <>
                <motion.button
                  onClick={runStressTest}
                  disabled={phase === 'stress-test'}
                  className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer border border-[#e040a0]/30 text-[#e040a0] hover:bg-[#e040a0]/10 transition-colors disabled:opacity-40"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Activity className="w-3.5 h-3.5" />
                  Stress Test
                </motion.button>
                <motion.button
                  onClick={resetCores}
                  className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer border border-[#fbbf24]/30 text-[#fbbf24] hover:bg-[#fbbf24]/10 transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  Reset
                </motion.button>
                <motion.button
                  onClick={shutdown}
                  className="px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer border border-[#8888aa]/30 text-[#8888aa] hover:bg-white/5 transition-colors"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Shutdown
                </motion.button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}