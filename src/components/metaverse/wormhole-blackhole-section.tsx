'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import BlackHoleCanvas from './black-hole-canvas';
import WormholeCanvas from './wormhole-canvas';
import { Activity, Radio, Zap, Orbit } from 'lucide-react';

type SyncState = 'idle' | 'syncing' | 'synchronized' | 'traversing';

const stateInfo: Record<SyncState, { label: string; color: string; description: string }> = {
  idle: {
    label: 'Em Espera',
    color: '#8888aa',
    description: 'Sistemas em modo standby. Clique no buraco negro ou ative o wormhole para iniciar sincronização.',
  },
  syncing: {
    label: 'Sincronizando',
    color: '#fbbf24',
    description: 'Wormhole e Black Hole estão se alinhando. Entropia convergindo...',
  },
  synchronized: {
    label: 'Sincronizado',
    color: '#06d6a0',
    description: 'Pontos de Einstein conectados. O túnel está estável e pronto para travessia.',
  },
  traversing: {
    label: 'Travessia',
    color: '#e040a0',
    description: 'Viajando através do wormhole! Dobra espaço-temporal ativa — destino: outro universo.',
  },
};

export default function WormholeBlackholeSection() {
  const [wormholeActive, setWormholeActive] = useState(false);
  const [syncState, setSyncState] = useState<SyncState>('idle');
  const [syncPhase, setSyncPhase] = useState(0);
  const [syncProgress, setSyncProgress] = useState(0);
  const syncTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleWormholeTrigger = useCallback(() => {
    if (syncState === 'idle') {
      setSyncState('syncing');
      setWormholeActive(true);
      // Syncing phase
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
      // Traversal: burst of sync
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

  useEffect(() => {
    return () => {
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
    };
  }, []);

  const currentInfo = stateInfo[syncState];

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
              Dobra Espaço-Temporal
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 text-[#8888aa] max-w-xl mx-auto text-sm sm:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Dois fenômenos cósmicos conectados. O wormhole emerge do buraco negro, criando uma ponte entre dimensões.
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
            style={{ minHeight: '400px' }}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#a855f7] animate-pulse" />
              <span className="text-xs font-mono text-[#a855f7] tracking-wider uppercase">Black Hole</span>
            </div>
            <div className="absolute bottom-4 left-4 z-10">
              <span className="text-[10px] text-[#8888aa]/60 font-mono">Clique para ativar sincronização</span>
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
            style={{ minHeight: '400px' }}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${wormholeActive ? 'bg-[#06d6a0] animate-pulse' : 'bg-[#8888aa]'}`} />
              <span className="text-xs font-mono text-[#06d6a0] tracking-wider uppercase">Wormhole</span>
            </div>
            <div className="absolute bottom-4 left-4 z-10">
              <span className="text-[10px] text-[#8888aa]/60 font-mono">Túnel Einstein-Rosen</span>
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
          className="max-w-3xl mx-auto"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
        >
          <div className="glass-strong rounded-2xl p-6 sm:p-8 gradient-border">
            {/* Status bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <div
                  className="w-3 h-3 rounded-full animate-pulse"
                  style={{ backgroundColor: currentInfo.color }}
                />
                <div>
                  <span className="text-sm font-semibold text-white">{currentInfo.label}</span>
                  <p className="text-xs text-[#8888aa] mt-0.5 max-w-md">{currentInfo.description}</p>
                </div>
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
            </div>

            {/* Progress bar */}
            {(syncState === 'syncing' || syncState === 'traversing') && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-6"
              >
                <div className="flex justify-between text-xs text-[#8888aa] mb-2">
                  <span>Entropia</span>
                  <span>{syncProgress}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-[#1a1a3e] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
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
                  />
                </div>
              </motion.div>
            )}

            {/* Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Massa', value: syncState === 'traversing' ? '∞' : '4.3M☉', icon: '⬤' },
                { label: 'Raio de Schwarzschild', value: syncState === 'traversing' ? '~∞' : '12.7M km', icon: '◎' },
                { label: 'Estabilidade', value: `${syncState === 'synchronized' || syncState === 'traversing' ? '99.7' : syncState === 'syncing' ? syncProgress.toFixed(0) : '0'}%`, icon: '◈' },
                { label: 'Distorção Temporal', value: syncState === 'traversing' ? 'Extrema' : syncState === 'synchronized' ? 'Alta' : syncState === 'syncing' ? 'Moderada' : 'Mínima', icon: '⟲' },
              ].map((metric) => (
                <div
                  key={metric.label}
                  className="text-center p-3 rounded-xl bg-[#0a0a1a]/50 border border-[#a855f7]/10"
                >
                  <div className="text-lg mb-1 opacity-50">{metric.icon}</div>
                  <div className="text-sm font-bold text-white">{metric.value}</div>
                  <div className="text-[10px] text-[#8888aa] mt-1">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}