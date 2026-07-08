'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, RefreshCw, ArrowLeftRight, Shield, Thermometer, Activity, Layers } from 'lucide-react';
import TrinuclearSandboxCanvas from './trinuclear-sandbox-canvas';

type SandboxPhase = 'offline' | 'booting' | 'synchronizing' | 'active' | 'stress-test';
type CoreId = 'ollama' | 'llama4' | 'openai';

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
    { prompt: 'Navegue no knowledge graph...', response: '15 nos mapeados. Caminho critico: MetaTempo → RAG → Claude → Fable. Profundidade: 4.' },
    { prompt: 'Gere arco narrativo Fable 5...', response: 'Arco gerado: "O Legado" com 7 capítulos. Coerencia: 0.94. Branches: 12.' },
    { prompt: 'Valide zettascale metrics...', response: 'Throughput: 1.18 ZB/s. Latencia: 0.047ns. Todos os nucleos certificados.' },
  ],
  openai: [
    { prompt: 'Claude: analyze temporal artifacts...', response: 'Analysis complete. 2026 artifacts show 97.3% coherence with 2077 projections.' },
    { prompt: 'Optimize RAG retrieval pipeline...', response: 'Pipeline optimized. Top-K: 128 → 256. Recall improved 23%. Latency -18ms.' },
    { prompt: 'Sandbox sync verification...', response: 'All 3 cores synchronized via OpenClaw. Entanglement verified. System stable.' },
  ],
};

export default function SandboxTrinuclearSection() {
  const [phase, setPhase] = useState<SandboxPhase>('offline');
  const [cores, setCores] = useState<CoreStatus[]>(INITIAL_CORES);
  const [logs, setLogs] = useState<InferenceLog[]>([]);
  const [syncIntensity, setSyncIntensity] = useState(0);
  const [cycleCount, setCycleCount] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);
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

    // Boot each core with stagger
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

    // After all booted, start sync
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

      setTimeout(() => {
        addLog(coreId, sample, tokens, latency);
        setCores(prev => prev.map(c =>
          c.id === coreId ? { ...c, status: 'ready' as const, requests: c.requests + 1 } : c
        ));
      }, 200);
    }, phase === 'stress-test' ? 800 : 2500);

    intervalRefs.current.push(interval);
    return () => clearInterval(interval);
  }, [phase, addLog]);

  const shutdown = useCallback(() => {
    clearIntervals();
    setPhase('offline');
    setSyncIntensity(0);
    setCores(INITIAL_CORES);
  }, [clearIntervals]);

  const runStressTest = useCallback(() => {
    if (phase === 'offline' || phase === 'booting') return;
    setPhase('stress-test');
    setSyncIntensity(1);

    let stressTime = 0;
    const interval = setInterval(() => {
      stressTime++;
      setCores(prev => prev.map(c => ({
        ...c,
        temperature: Math.min(2.0, c.temperature + 0.005 + Math.random() * 0.01),
        tokensPerSec: Math.max(20, c.tokensPerSec + (Math.random() - 0.4) * 15),
      })));
      if (stressTime >= 15) {
        clearInterval(interval);
        setPhase('active');
        setCores(prev => prev.map(c => ({
          ...c,
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

        {/* Live stats bar */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8"
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
                className="glass rounded-xl p-4 border border-white/5 hover:border-white/10 transition-colors"
                style={{ borderColor: core.status !== 'offline' ? core.color + '22' : undefined }}
                initial={{ opacity: 0, x: 30 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 * i }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-3 h-3 rounded-full transition-colors duration-300 ${
                      core.status === 'offline' ? 'bg-[#555577]' :
                      core.status === 'loading' ? 'bg-[#fbbf24] animate-pulse' :
                      core.status === 'processing' ? 'bg-[#e040a0] animate-pulse' :
                      'bg-[#06d6a0]'
                    }`} />
                    <span className="text-sm font-bold text-white">{core.name}</span>
                    <span className="text-[9px] font-mono text-[#8888aa]">{core.engine} {core.version}</span>
                  </div>
                  <span className="text-[8px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full"
                    style={{
                      color: core.status === 'offline' ? '#8888aa' : core.color,
                      borderColor: core.status === 'offline' ? '#8888aa33' : core.color + '33',
                      backgroundColor: core.status === 'offline' ? '#8888aa11' : core.color + '11',
                      border: '1px solid',
                    }}
                  >
                    {core.status.toUpperCase()}
                  </span>
                </div>

                <div className="text-[10px] font-mono text-[#8888aa] mb-3">{core.model}</div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'tok/s', value: core.tokensPerSec > 0 ? core.tokensPerSec.toFixed(0) : '—', color: core.color },
                    { label: 'Memory', value: core.memoryGB > 0 ? `${core.memoryGB.toFixed(1)}GB` : '—', color: core.color },
                    { label: 'Lat.', value: core.latency > 0 ? `${core.latency.toFixed(0)}ms` : '—', color: core.color },
                    { label: 'Acc.', value: core.accuracy > 0 ? `${(core.accuracy * 100).toFixed(1)}%` : '—', color: core.color },
                  ].map(m => (
                    <div key={m.label} className="text-center">
                      <div className="text-[8px] text-[#555577] uppercase">{m.label}</div>
                      <div className="text-[11px] font-bold font-mono" style={{ color: m.value !== '—' ? m.color : '#555577' }}>
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
          <div className="flex items-center gap-4">
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