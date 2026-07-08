'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlackHoleCanvas from './black-hole-canvas';
import WormholeCanvas from './wormhole-canvas';
import { Activity, Radio, Zap, Orbit, Waves, Thermometer, Gauge, RotateCcw, Link2, Shield, Clock } from 'lucide-react';

type SyncState = 'idle' | 'syncing' | 'synchronized' | 'traversing';

const stateInfo: Record<SyncState, { label: string; color: string; description: string }> = {
  idle: {
    label: 'Em Espera',
    color: '#8888aa',
    description: 'Sistemas em modo standby. Clique no buraco negro ou ative o wormhole para iniciar sincronizacao.',
  },
  syncing: {
    label: 'Sincronizando',
    color: '#fbbf24',
    description: 'Wormhole e Black Hole estao se alinhando. Entropia convergindo, metricas Kerr estabilizando...',
  },
  synchronized: {
    label: 'Sincronizado',
    color: '#06d6a0',
    description: 'Pontos de Einstein conectados. O tunel esta estavel e pronto para travessia. Ergosfera alinhada.',
  },
  traversing: {
    label: 'Travessia',
    color: '#e040a0',
    description: 'Viajando atraves do wormhole! Dobra espaco-temporal ativa -- destino: outro universo. Penrose process ativo.',
  },
};

const SPARKLINE_DATA = Array.from({ length: 30 }, (_, i) => {
  const base = Math.sin(i * 0.4) * 0.3;
  const noise = (Math.random() - 0.5) * 0.2;
  return Math.max(0, Math.min(1, 0.5 + base + noise));
});

export default function WormholeBlackholeSection() {
  const [wormholeActive, setWormholeActive] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncPhase, setSyncPhase] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const [traversalCount, setTraversalCount] = useState(0);
  const [entropy, setEntropy] = useState(0.73);
  const [frameDragRate, setFrameDragRate] = useState(0);
  const [tidalForce, setTidalForce] = useState(0);
  const [hawkingFlux, setHawkingFlux] = useState(0);
  const [eprPairs, setEprPairs] = useState(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const sparklineRef = useRef<HTMLCanvasElement>(null);
  const sparklineDataRef = useRef<number[]>(SPARKLINE_DATA);

  const drawSparkline = () => {
    const canvas = sparklineRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const data = sparklineDataRef.current;
    const w = rect.width;
    const h = rect.height;
    ctx.clearRect(0, 0, w, h);

    if (data.length < 2) return;

    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(168, 85, 247, 0.3)');
    grad.addColorStop(1, 'rgba(168, 85, 247, 0)');

    // Fill area
    ctx.beginPath();
    ctx.moveTo(0, h);
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - v * h;
      if (i === 0) ctx.lineTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Line
    ctx.beginPath();
    data.forEach((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - v * h;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Current value dot
    const lastVal = data[data.length - 1];
    const lastX = w;
    const lastY = h - lastVal * h;
    ctx.beginPath();
    ctx.arc(lastX - 1, lastY, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = '#a855f7';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(lastX - 1, lastY, 5, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(168, 85, 247, 0.25)';
    ctx.fill();
  };

  // Animate metrics during active states
  useEffect(() => {
    if (syncState === 'idle') {
      drawSparkline();
      return;
    }
    const interval = setInterval(() => {
      const phase = syncState === 'traversing' ? 1 : syncProgress / 100;
      setEntropy(0.73 - phase * 0.45 + (Math.random() - 0.5) * 0.02);
      setFrameDragRate(phase * (0.85 + Math.random() * 0.14));
      setTidalForce(phase * (2.1 + Math.random() * 0.8));
      setHawkingFlux(phase * (0.01 + Math.random() * 0.09));
      setEprPairs(128 + Math.floor(phase * 128));

      // Update sparkline
      sparklineDataRef.current.push(phase + (Math.random() - 0.5) * 0.15);
      if (sparklineDataRef.current.length > 30) sparklineDataRef.current.shift();
      drawSparkline();
    }, 200);
    return () => clearInterval(interval);
  }, [syncState, syncProgress]);

  // Initial sparkline draw
  useEffect(() => {
    drawSparkline();
  }, []);


  const handleWormholeTrigger = useCallback(() => {
    if (syncState === 'idle') {
      setSyncState('syncing');
      setWormholeActive(true);
      let progress = 0;
      const interval = setInterval(() => {
        progress += 2;
        setSyncProgress(Math.min(100, progress));
        setSyncPhase(progress / 100);
        if (progress >= 100) {
          clearInterval(interval);
          setSyncState('synchronized');
        }
      }, 50);
      syncTimerRef.current = interval as unknown as ReturnType<typeof setTimeout>;
    } else if (syncState === 'synchronized') {
      setSyncState('traversing');
      let burstPhase = 0;
      const burst = setInterval(() => {
        burstPhase += 5;
        setSyncPhase(0.5 + Math.sin(burstPhase * 0.1) * 0.5);
        if (burstPhase > 300) {
          clearInterval(burst);
          setSyncState('idle');
          setWormholeActive(false);
          setSyncPhase(0);
          setSyncProgress(0);
          setTraversalCount(prev => prev + 1);
        }
      }, 50);
      syncTimerRef.current = burst as unknown as ReturnType<typeof setTimeout>;
    }
  }, [syncState]);

  const handleSyncPulse = useCallback((phase: number) => {
    if (syncState === 'syncing' || syncState === 'synchronized') {
      setSyncPhase(phase);
    }
  }, [syncState]);

  const toggleWormhole = useCallback(() => {
    if (!wormholeActive) {
      setWormholeActive(true);
      if (syncState === 'idle') {
        setSyncState('syncing');
        let progress = 0;
        const interval = setInterval(() => {
          progress += 2;
          setSyncProgress(Math.min(100, progress));
          setSyncPhase(progress / 100);
          if (progress >= 100) {
            clearInterval(interval);
            setSyncState('synchronized');
          }
        }, 50);
        syncTimerRef.current = interval as unknown as ReturnType<typeof setTimeout>;
      }
    } else if (syncState === 'synchronized') {
      handleWormholeTrigger();
    } else if (syncState === 'idle') {
      setWormholeActive(false);
      setSyncPhase(0);
    }
  }, [wormholeActive, syncState, handleWormholeTrigger]);

  const forceReset = useCallback(() => {
    if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    setSyncState('idle');
    setWormholeActive(false);
    setSyncPhase(0);
    setSyncProgress(0);
  }, []);

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, []);

  const currentInfo = stateInfo[syncState];
  const isActive = syncState !== 'idle';

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Section background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div
          className="absolute top-0 left-1/4 w-[600px] h-[600px] opacity-5"
          style={{
            background: 'radial-gradient(circle, #a855f7 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="absolute bottom-0 right-1/4 w-[500px] h-[500px] opacity-5"
          style={{
            background: 'radial-gradient(circle, #06d6a0 0%, transparent 60%)',
            filter: 'blur(100px)',
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] opacity-[0.02]"
          style={{
            background: 'radial-gradient(circle, #e040a0 0%, transparent 60%)',
            filter: 'blur(80px)',
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-[#a855f7] mb-4 border border-[#a855f7]/20 px-4 py-2 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Activity className="w-3 h-3" />
            Sistema Wormhole + Black Hole
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="bg-gradient-to-r from-[#a855f7] via-[#e040a0] to-[#06d6a0] bg-clip-text text-transparent">
              Dobra Espaco-Temporal
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 text-[#8888aa] max-w-2xl mx-auto text-sm sm:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Dois fenomenos cosmicos conectados. O wormhole emerge do buraco negro com frame-dragging,
            ergosfera e anéis de fotons multi-camada. Clique no buraco negro para ativar.
          </motion.p>
        </div>

        {/* Main visualization area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
          {/* Black Hole */}
          <motion.div
            className="relative rounded-2xl overflow-hidden glass gradient-border"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            style={{ minHeight: '420px' }}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
              <span className="text-xs font-mono text-[#a855f7] tracking-wider uppercase">Black Hole</span>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[9px] font-mono text-[#fbbf24] border border-[#fbbf24]/20 px-2 py-0.5 rounded-full">
                KERR METRIC
              </span>
            </div>
            <div className="absolute bottom-4 left-4 z-10">
              <span className="text-[10px] text-[#8888aa]/60 font-mono">Clique para ativar sincronizacao</span>
            </div>
            <BlackHoleCanvas
              onWormholeTrigger={handleWormholeTrigger}
              isWormholeActive={wormholeActive}
              syncPhase={syncPhase}
            />
          </motion.div>

          {/* Wormhole */}
          <motion.div
            className="relative rounded-2xl overflow-hidden glass gradient-border"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.15 }}
            style={{ minHeight: '420px' }}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${wormholeActive ? 'bg-[#06d6a0] animate-pulse' : 'bg-[#8888aa]'}`} />
              <span className="text-xs font-mono text-[#06d6a0] tracking-wider uppercase">Wormhole</span>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[9px] font-mono text-[#06d6a0] border border-[#06d6a0]/20 px-2 py-0.5 rounded-full">
                EINSTEIN-ROSEN
              </span>
            </div>
            <div className="absolute bottom-4 left-4 z-10">
              <span className="text-[10px] text-[#8888aa]/60 font-mono">Tunel com frame-dragging e ergosfera</span>
            </div>
            <WormholeCanvas
              isActive={wormholeActive}
              onSyncPulse={handleSyncPulse}
              syncPhase={syncPhase}
            />
          </motion.div>
        </div>

        {/* Control Panel */}
        <motion.div
          className="max-w-4xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="glass-strong rounded-2xl p-6 sm:p-8 gradient-border">
            {/* Status bar with sparkline */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: currentInfo.color }}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{currentInfo.label}</span>
                    {traversalCount > 0 && (
                      <span className="text-[9px] font-mono text-[#8888aa] border border-white/10 px-1.5 py-0.5 rounded">
                        {traversalCount} traversal(s)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#8888aa] mt-0.5 max-w-md">{currentInfo.description}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {/* Sparkline */}
                <div className="hidden sm:block w-24 h-8 rounded-lg bg-[#0a0a1a]/50 border border-white/5 overflow-hidden">
                  <canvas ref={sparklineRef} className="w-full h-full" />
                </div>
                <AnimatePresence mode="wait">
                  {syncState !== 'traversing' && (
                    <motion.button
                      key={syncState}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      onClick={toggleWormhole}
                      className="px-6 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 cursor-pointer transition-all duration-300 hover:shadow-[0_0_20px_rgba(168,85,247,0.3)]"
                      style={{
                        background: syncState === 'idle'
                          ? 'rgba(168,85,247,0.15)'
                          : syncState === 'syncing'
                          ? 'rgba(251,191,36,0.15)'
                          : 'rgba(6,214,160,0.15)',
                        color: currentInfo.color,
                        border: `1px solid ${currentInfo.color}30`,
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      {syncState === 'idle' && <><Zap className="w-4 h-4" /> Ativar Wormhole</>}
                      {syncState === 'syncing' && <><Radio className="w-4 h-4 animate-spin" /> Sincronizando...</>}
                      {syncState === 'synchronized' && <><Orbit className="w-4 h-4" /> Iniciar Travessia</>}
                    </motion.button>
                  )}
                </AnimatePresence>
                {isActive && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={forceReset}
                    className="px-3 py-3 rounded-xl text-sm cursor-pointer border border-[#8888aa]/20 text-[#8888aa] hover:bg-white/5 transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <RotateCcw className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Progress bar with dual track */}
            {(syncState === 'syncing' || syncState === 'traversing') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="flex justify-between text-xs text-[#8888aa] mb-2">
                  <span>Entropia</span>
                  <div className="flex items-center gap-3">
                    <span>{syncProgress}%</span>
                    <span className="text-[9px]">Frame-drag: {(frameDragRate * 100).toFixed(0)}%</span>
                  </div>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#1a1a3e] overflow-hidden relative">
                  {/* Background entropy track */}
                  <div
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: syncState === 'syncing'
                        ? 'linear-gradient(to right, #a855f7, #fbbf24)'
                        : 'linear-gradient(to right, #06d6a0, #e040a0, #a855f7)',
                      width: `${syncState === 'traversing' ? 100 : syncProgress}%`,
                      opacity: 0.3,
                    }}
                  />
                  {/* Main progress */}
                  <motion.div
                    className="h-full rounded-full relative"
                    style={{
                      background: syncState === 'syncing'
                        ? 'linear-gradient(to right, #a855f7, #fbbf24)'
                        : 'linear-gradient(to right, #06d6a0, #e040a0, #a855f7)',
                      width: `${syncState === 'traversing' ? 100 : syncProgress}%`,
                    }}
                    animate={syncState === 'traversing' ? {
                      backgroundPosition: ['0% 50%', '200% 50%'],
                    } : {}}
                    transition={syncState === 'traversing' ? {
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    } : {}}
                  >
                    {/* Glowing tip */}
                    <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]" />
                  </motion.div>
                </div>
              </motion.div>
            )}

            {/* Primary Metrics - 4 columns */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                { label: 'Massa', value: syncState === 'traversing' ? '4.3M x inf' : '4.3M', unit: syncState === 'traversing' ? '' : 'M\u2609', color: '#a855f7', Icon: Activity },
                { label: 'Raio Schwarzschild', value: syncState === 'traversing' ? 'exp' : '12.7M', unit: syncState === 'traversing' ? '' : 'km', color: '#fbbf24', Icon: Waves },
                { label: 'Estabilidade', value: `${syncState === 'synchronized' || syncState === 'traversing' ? '99.7' : syncState === 'syncing' ? syncProgress.toFixed(0) : '0'}`, unit: '%', color: '#06d6a0', Icon: Gauge },
                { label: 'Distorcao Temporal', value: syncState === 'traversing' ? 'Extrema' : syncState === 'synchronized' ? 'Alta' : syncState === 'syncing' ? 'Moderada' : 'Minima', unit: '', color: '#e040a0', Icon: Orbit },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="text-center p-3 rounded-xl bg-[#0a0a1a]/50 border border-white/5 hover:border-white/10 transition-colors"
                >
                  <metric.Icon className="w-3.5 h-3.5 mx-auto mb-1.5 opacity-40" style={{ color: metric.color }} />
                  <div className="text-sm font-bold text-white font-mono">
                    {metric.value}
                    {metric.unit && <span className="text-[10px] text-[#8888aa] ml-0.5">{metric.unit}</span>}
                  </div>
                  <div className="text-[10px] text-[#8888aa] mt-1">{metric.label}</div>
                </div>
              ))}
            </div>

            {/* Secondary Metrics - 4 columns (evolved) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
              {[
                {
                  label: 'Entropia BH',
                  value: entropy.toFixed(3),
                  color: entropy < 0.5 ? '#06d6a0' : entropy < 0.7 ? '#fbbf24' : '#e040a0',
                  Icon: Thermometer,
                  bar: entropy / 1.2,
                },
                {
                  label: 'Frame-Drag Rate',
                  value: `${(frameDragRate * 100).toFixed(1)}%`,
                  color: frameDragRate > 0.7 ? '#e040a0' : frameDragRate > 0.3 ? '#fbbf24' : '#8888aa',
                  Icon: RotateCcw,
                  bar: frameDragRate,
                },
                {
                  label: 'Forca Tidal',
                  value: tidalForce > 0 ? `${tidalForce.toFixed(2)}` : '--',
                  unit: tidalForce > 0 ? 'GN/m' : '',
                  color: tidalForce > 2.5 ? '#e040a0' : tidalForce > 1 ? '#fbbf24' : '#8888aa',
                  Icon: Waves,
                  bar: Math.min(1, tidalForce / 3),
                },
                {
                  label: 'Ergosfera',
                  value: isActive ? 'Ativa' : 'Inativa',
                  color: isActive ? '#06d6a0' : '#555577',
                  Icon: Orbit,
                  bar: isActive ? 1 : 0,
                },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="p-2.5 rounded-xl bg-[#0a0a1a]/30 border border-white/5"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <metric.Icon className="w-3 h-3" style={{ color: metric.color }} />
                    <span className="text-[9px] text-[#8888aa] uppercase tracking-wider">{metric.label}</span>
                  </div>
                  <div className="text-xs font-bold font-mono" style={{ color: metric.color }}>
                    {metric.value}
                    {'unit' in metric && metric.unit && (
                      <span className="text-[9px] text-[#8888aa] ml-0.5">{metric.unit}</span>
                    )}
                  </div>
                  {/* Mini progress bar */}
                  <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: metric.color }}
                      animate={{ width: `${(metric.bar ?? 0) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Tertiary Metrics - Entanglement & Temporal */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                {
                  label: 'Pares EPR',
                  value: isActive ? `${128 + Math.floor(syncPhase * 128)}` : '0',
                  color: '#06b6d4',
                  Icon: Link2,
                  bar: isActive ? syncPhase : 0,
                },
                {
                  label: 'Fluxo Hawking',
                  value: isActive ? `${(0.01 + syncPhase * 0.09).toFixed(3)}` : '0.000',
                  unit: 'J/s',
                  color: '#f97316',
                  Icon: Thermometer,
                  bar: isActive ? syncPhase * 0.8 : 0,
                },
                {
                  label: 'Materia Exotica',
                  value: isActive ? (syncPhase > 0.7 ? 'Estavel' : syncPhase > 0.3 ? 'Formando' : 'Instavel') : 'N/A',
                  color: isActive ? (syncPhase > 0.7 ? '#06d6a0' : syncPhase > 0.3 ? '#fbbf24' : '#e040a0') : '#555577',
                  Icon: Shield,
                  bar: isActive ? Math.min(1, syncPhase * 1.2) : 0,
                },
                {
                  label: 'Distorcao Temporal',
                  value: isActive ? `${(syncPhase * 3.7).toFixed(1)}` : '0.0',
                  unit: isActive ? 'tau' : '',
                  color: isActive ? '#a855f7' : '#555577',
                  Icon: Clock,
                  bar: isActive ? syncPhase : 0,
                },
              ].map((metric) => (
                <div key={metric.label} className="p-2.5 rounded-xl bg-[#0a0a1a]/30 border border-white/5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <metric.Icon className="w-3 h-3" style={{ color: metric.color }} />
                    <span className="text-[9px] text-[#8888aa] uppercase tracking-wider">{metric.label}</span>
                  </div>
                  <div className="text-xs font-bold font-mono" style={{ color: metric.color }}>
                    {metric.value}
                    {'unit' in metric && metric.unit && (
                      <span className="text-[9px] text-[#8888aa] ml-0.5">{metric.unit}</span>
                    )}
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-white/5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{ backgroundColor: metric.color }}
                      animate={{ width: `${(metric.bar ?? 0) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Physics info footer */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] text-[#555577] font-mono">
              <span>Kerr: a/M = 0.998</span>
              <span>|</span>
              <span>Photon spheres: 3</span>
              <span>|</span>
              <span>ISCO: 3R_s</span>
              <span>|</span>
              <span>Penrose process: {isActive ? 'ACTIVE' : 'STANDBY'}</span>
              <span>|</span>
              <span>Jet precession: 20s</span>
              <span>|</span>
              <span>EPR pairs: {isActive ? `${128 + Math.floor(syncPhase * 128)}` : '0'}</span>
              <span>|</span>
              <span>Exotic matter: {isActive ? 'STABLE' : 'UNSTABLE'}</span>
              <span>|</span>
              <span>Temporal tau: {isActive ? `${(syncPhase * 3.7).toFixed(1)}` : '0.0'}</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}