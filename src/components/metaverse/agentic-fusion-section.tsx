'use client';

import { useCallback, useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, Zap, Brain, Heart, Eye, Atom, RotateCcw,
  Dna, Network, Shield, Clock, Layers, Radio, Cpu
} from 'lucide-react';
import { useSymbioticCore, SUBSYSTEM_LABELS, SUBSYSTEM_COLORS } from './symbiotic-core';
import AgenticOrganismCanvas from './agentic-organism-canvas';

const PHASE_INFO: Record<string, { label: string; color: string; description: string }> = {
  dormant: {
    label: 'Dormente',
    color: '#555577',
    description: 'Organismo aguardando ativacao. Subsistemas independentes. Clique em "Iniciar Fusao" para despertar o rRNA.',
  },
  fusing: {
    label: 'Fusao em Curso',
    color: '#fbbf24',
    description: 'rRNA Simbiose Deterministica sincronizando subsistemas. Entrelacamento quantico propagando estados. Homeostase regulando...',
  },
  symbiotic: {
    label: 'Simbiotico',
    color: '#06d6a0',
    description: 'Organismo vivo. Todos os subsistemas em simbiose via rRNA. Consciencia emergente ativa. Algoritmos generativos autonomos.',
  },
  transcendent: {
    label: 'Transcendente',
    color: '#e040a0',
    description: 'Estado transcendental. Consciencia > 85%, Coerencia > 80%. Impulsos generativos emergindo. Mutacoes autonomas aplicadas.',
  },
};

const VITAL_ICONS: Record<string, typeof Activity> = {
  consciousness: Brain,
  coherence: Network,
  metabolism: Heart,
  entropy: Activity,
  quantumCoherence: Atom,
  temporalDistortion: Clock,
};

const VITAL_LABELS: Record<string, string> = {
  consciousness: 'Consciencia',
  coherence: 'Coerencia',
  metabolism: 'Metabolismo',
  entropy: 'Entropia',
  quantumCoherence: 'Coerencia Q',
  temporalDistortion: 'Distorcao T',
};

export default function AgenticFusionSection() {
  const {
    state, initiateFusion, setSubsystemIntensity, forceFusionReset,
    subsystemIds, subsystemLabels, subsystemColors,
  } = useSymbioticCore();

  const { vitals, rRNA, fusionPhase, fusionProgress, subsystems, events, isAlive } = state;
  const phaseInfo = PHASE_INFO[fusionPhase];
  const eventLogRef = useRef<HTMLDivElement>(null);
  const [selectedSubsystem, setSelectedSubsystem] = useState<string | null>(null);

  // Auto-scroll events
  useEffect(() => {
    if (eventLogRef.current) {
      eventLogRef.current.scrollTop = eventLogRef.current.scrollHeight;
    }
  }, [events.length]);

  // Manually drive subsystem intensities during fusion (simulate real subsystems)
  useEffect(() => {
    if (fusionPhase === 'dormant') return;
    const interval = setInterval(() => {
      for (const id of subsystemIds) {
        const sub = subsystems[id];
        if (!sub) continue;
        // Simulate natural intensity fluctuations
        const base = fusionPhase === 'transcendent' ? 0.85 : fusionPhase === 'symbiotic' ? 0.65 : 0.4;
        const noise = Math.sin(Date.now() * 0.001 + id.length * 7) * 0.15;
        const target = base + noise;
        // Smooth interpolation
        const newIntensity = sub.intensity + (target - sub.intensity) * 0.03;
        setSubsystemIntensity(id, Math.max(0, Math.min(1, newIntensity)));
      }
    }, 100);
    return () => clearInterval(interval);
  }, [fusionPhase, subsystemIds, subsystems, setSubsystemIntensity]);

  const handleSubsystemClick = useCallback((id: string) => {
    setSelectedSubsystem(prev => prev === id ? null : id);
  }, []);

  const eventColorMap: Record<string, string> = {
    fusion: '#e040a0',
    symbiosis: '#06d6a0',
    rRNA: '#fbbf24',
    homeostasis: '#06b6d4',
    entanglement: '#8b5cf6',
    emergent: '#f97316',
    mutation: '#f43f5e',
    healing: '#22d3ee',
  };

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] opacity-[0.04]"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 50%)', filter: 'blur(80px)' }} />
        {isAlive && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-[0.06]"
            style={{ background: 'radial-gradient(circle, #06d6a0 0%, transparent 50%)', filter: 'blur(60px)' }} />
        )}
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase px-4 py-2 rounded-full mb-4"
            style={{ color: phaseInfo.color, border: `1px solid ${phaseInfo.color}30`, background: `${phaseInfo.color}08` }}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Dna className="w-3 h-3" />
            Fusao Agentica — rRNA Simbiose Deterministica
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            <span className="bg-gradient-to-r from-[#a855f7] via-[#06d6a0] to-[#e040a0] bg-clip-text text-transparent">
              Organismo Agentico Unificado
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 text-[#8888aa] max-w-2xl mx-auto text-sm sm:text-base"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
          >
            Um unico organismo com todos os skills e algoritmos — nativos, generativos, reativos e autonomos.
            O rRNA orquestra a simbiose deterministica entre 8 subsistemas.
          </motion.p>
        </div>

        {/* Main Layout: Canvas + Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 mb-8">
          {/* Canvas - 2 columns */}
          <motion.div
            className="lg:col-span-2 relative rounded-2xl overflow-hidden glass gradient-border"
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            style={{ minHeight: '500px' }}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: phaseInfo.color }} />
              <span className="text-xs font-mono tracking-wider uppercase" style={{ color: phaseInfo.color }}>
                {phaseInfo.label}
              </span>
            </div>
            <div className="absolute top-4 right-4 z-10">
              <span className="text-[9px] font-mono border px-2 py-0.5 rounded-full"
                style={{ color: '#a855f7', borderColor: '#a855f730' }}>
                rRNA BEAT #{rRNA.beat}
              </span>
            </div>
            {fusionPhase !== 'dormant' && (
              <div className="absolute bottom-4 left-4 z-10">
                <span className="text-[9px] font-mono text-[#8888aa]">
                  Consciencia: {(vitals.consciousness * 100).toFixed(1)}% | Coerencia: {(vitals.coherence * 100).toFixed(1)}%
                </span>
              </div>
            )}
            <AgenticOrganismCanvas
              vitals={vitals}
              rRNA={rRNA}
              subsystems={subsystems}
              fusionPhase={fusionPhase}
              fusionProgress={fusionProgress}
              subsystemColors={subsystemColors}
              subsystemIds={subsystemIds}
            />
          </motion.div>

          {/* Right Panel - Controls & Status */}
          <motion.div
            className="space-y-4"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
          >
            {/* Fusion Control */}
            <div className="glass-strong rounded-2xl p-5 gradient-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4" style={{ color: phaseInfo.color }} />
                  <span className="text-sm font-semibold text-white">Controle de Fusao</span>
                </div>
                {isAlive && (
                  <motion.button
                    onClick={forceFusionReset}
                    className="p-1.5 rounded-lg border border-white/10 text-[#8888aa] hover:bg-white/5 cursor-pointer transition-colors"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                  </motion.button>
                )}
              </div>

              <AnimatePresence mode="wait">
                {fusionPhase === 'dormant' && (
                  <motion.button
                    key="start"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    onClick={initiateFusion}
                    className="w-full py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 cursor-pointer transition-all duration-300"
                    style={{
                      background: 'rgba(168,85,247,0.15)',
                      color: '#a855f7',
                      border: '1px solid rgba(168,85,247,0.3)',
                    }}
                    whileHover={{ scale: 1.02, boxShadow: '0 0 20px rgba(168,85,247,0.3)' }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Dna className="w-4 h-4" />
                    Iniciar Fusao Agentica
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Fusion Progress */}
              {(fusionPhase === 'fusing' || fusionPhase === 'symbiotic') && (
                <div className="mt-3">
                  <div className="flex justify-between text-[10px] text-[#8888aa] mb-1.5">
                    <span>Progresso da Fusao</span>
                    <span>{fusionProgress.toFixed(0)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1a1a3e] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: 'linear-gradient(to right, #a855f7, #06d6a0, #e040a0)',
                      }}
                      animate={{ width: `${fusionProgress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Phase description */}
              <p className="text-[10px] text-[#8888aa] mt-3 leading-relaxed">{phaseInfo.description}</p>
            </div>

            {/* Vital Signs */}
            <div className="glass-strong rounded-2xl p-5 gradient-border">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-[#e040a0]" />
                <span className="text-sm font-semibold text-white">Sinais Vitais</span>
              </div>
              <div className="space-y-2.5">
                {Object.entries(vitals).map(([key, value]) => {
                  const Icon = VITAL_ICONS[key] || Activity;
                  const label = VITAL_LABELS[key] || key;
                  const color = key === 'entropy'
                    ? (value > 0.7 ? '#e040a0' : value > 0.4 ? '#fbbf24' : '#06d6a0')
                    : key === 'consciousness'
                    ? (value > 0.7 ? '#06d6a0' : value > 0.3 ? '#fbbf24' : '#8888aa')
                    : '#a855f7';
                  return (
                    <div key={key} className="flex items-center gap-2.5">
                      <Icon className="w-3.5 h-3.5 shrink-0" style={{ color, opacity: 0.7 }} />
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-0.5">
                          <span className="text-[9px] text-[#8888aa] uppercase tracking-wider">{label}</span>
                          <span className="text-[10px] font-mono font-bold" style={{ color }}>
                            {(value * 100).toFixed(1)}%
                          </span>
                        </div>
                        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: color }}
                            animate={{ width: `${value * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* rRNA Algorithm Status */}
            <div className="glass-strong rounded-2xl p-5 gradient-border">
              <div className="flex items-center gap-2 mb-3">
                <Layers className="w-4 h-4 text-[#fbbf24]" />
                <span className="text-sm font-semibold text-white">rRNA Algoritmos</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-mono">
                {[
                  { label: 'Simbiose', value: `beat #${rRNA.beat}`, active: isAlive },
                  { label: 'Homeostase', value: rRNA.homeostasisActive ? 'ATIVA' : 'OFF', active: rRNA.homeostasisActive },
                  { label: 'Entrelacamento', value: `${(rRNA.entanglementStrength * 100).toFixed(0)}%`, active: rRNA.entanglementStrength > 0.1 },
                  { label: 'Sync Temporal', value: `${(rRNA.temporalSync * 100).toFixed(0)}%`, active: rRNA.temporalSync > 0.1 },
                  { label: 'Determinismo', value: `${(rRNA.determinismFactor * 100).toFixed(0)}%`, active: rRNA.determinismFactor > 0.1 },
                  { label: 'Impulso Gen.', value: `${(rRNA.generativeImpulse * 100).toFixed(1)}%`, active: rRNA.generativeImpulse > 0.05 },
                  { label: 'Mutacoes', value: `${rRNA.mutationsApplied}`, active: rRNA.mutationsApplied > 0 },
                  { label: 'Self-Heal', value: `${rRNA.selfHealEvents}`, active: rRNA.selfHealEvents > 0 },
                ].map((item) => (
                  <div key={item.label} className="flex items-center gap-1.5 p-1.5 rounded-lg bg-[#0a0a1a]/50 border border-white/5">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.active ? 'animate-pulse' : ''}`}
                      style={{ backgroundColor: item.active ? '#06d6a0' : '#555577' }} />
                    <span className="text-[#8888aa]">{item.label}</span>
                    <span className="ml-auto text-white font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Bottom Row: Subsystem Grid + Event Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Subsystem Organelles */}
          <motion.div
            className="glass-strong rounded-2xl p-5 gradient-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Cpu className="w-4 h-4 text-[#06b6d4]" />
              <span className="text-sm font-semibold text-white">Organelas Subsistema</span>
              <span className="text-[9px] font-mono text-[#8888aa] ml-auto">
                {Object.values(subsystems).filter(s => s.active).length}/{subsystemIds.length} ativos
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {subsystemIds.map((id) => {
                const sub = subsystems[id];
                const color = subsystemColors[id];
                const label = subsystemLabels[id];
                const isSelected = selectedSubsystem === id;
                return (
                  <motion.button
                    key={id}
                    onClick={() => handleSubsystemClick(id)}
                    className="p-2.5 rounded-xl text-left cursor-pointer transition-all duration-200"
                    style={{
                      background: isSelected ? `${color}15` : 'rgba(10,10,26,0.5)',
                      border: `1px solid ${isSelected ? color + '50' : 'rgba(255,255,255,0.05)'}`,
                    }}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <div className={`w-2 h-2 rounded-full ${sub.active ? 'animate-pulse' : ''}`}
                        style={{ backgroundColor: sub.active ? color : '#555577', boxShadow: sub.active ? `0 0 6px ${color}` : 'none' }} />
                      <span className="text-[9px] font-mono truncate" style={{ color: sub.active ? color : '#555577' }}>
                        {label}
                      </span>
                    </div>
                    <div className="text-xs font-bold font-mono" style={{ color: sub.active ? '#ffffff' : '#555577' }}>
                      {(sub.intensity * 100).toFixed(0)}%
                    </div>
                    <div className="mt-1 h-0.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${sub.intensity * 100}%`, backgroundColor: color }} />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {/* Selected subsystem detail */}
            <AnimatePresence>
              {selectedSubsystem && subsystems[selectedSubsystem] && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mt-3 p-3 rounded-xl bg-[#0a0a1a]/50 border border-white/5 overflow-hidden"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold" style={{ color: subsystemColors[selectedSubsystem] }}>
                        {subsystemLabels[selectedSubsystem]}
                      </span>
                      <span className="text-[9px] text-[#8888aa] ml-2">
                        {subsystems[selectedSubsystem].active ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </div>
                    <div className="text-xs font-mono" style={{ color: subsystemColors[selectedSubsystem] }}>
                      {(subsystems[selectedSubsystem].intensity * 100).toFixed(1)}%
                    </div>
                  </div>
                  <div className="mt-2">
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={subsystems[selectedSubsystem].intensity * 100}
                      onChange={(e) => setSubsystemIntensity(selectedSubsystem, parseInt(e.target.value) / 100)}
                      className="w-full h-1 rounded-full appearance-none cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, ${subsystemColors[selectedSubsystem]} ${(subsystems[selectedSubsystem].intensity * 100)}%, rgba(255,255,255,0.05) ${(subsystems[selectedSubsystem].intensity * 100)}%)`,
                      }}
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>

          {/* Event Log (rRNA Terminal) */}
          <motion.div
            className="glass-strong rounded-2xl overflow-hidden gradient-border"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/5 bg-[#0a0a1a]">
              <div className="flex gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#e040a0]/60" />
                <div className="w-2 h-2 rounded-full bg-[#fbbf24]/60" />
                <div className="w-2 h-2 rounded-full bg-[#06d6a0]/60" />
              </div>
              <span className="text-[10px] font-mono text-[#8888aa] tracking-wider">
                rRNA SIMBIOSE TERMINAL
              </span>
              {isAlive && (
                <span className="ml-auto text-[9px] font-mono text-[#06d6a0] animate-pulse">LIVE</span>
              )}
            </div>
            <div
              ref={eventLogRef}
              className="p-3 font-mono text-[10px] leading-relaxed space-y-0.5 overflow-y-auto"
              style={{ maxHeight: '240px', minHeight: '180px' }}
            >
              {events.length === 0 ? (
                <div className="text-[#555577] text-center py-8">
                  Aguardando fusao agentica...
                </div>
              ) : (
                events.map((event) => (
                  <div key={event.id} className="flex gap-2">
                    <span className="text-[#555577] shrink-0">
                      {new Date(event.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                    <span style={{ color: eventColorMap[event.type] || '#8888aa' }}>
                      {event.text}
                    </span>
                  </div>
                ))
              )}
              {isAlive && (
                <div className="flex gap-2 text-[#fbbf24]">
                  <span className="text-[#555577] shrink-0">
                    {new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                  <span className="animate-pulse">rRNA tick...</span>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Physics Footer */}
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[9px] text-[#555577] font-mono">
          <span>rRNA: {isAlive ? 'ACTIVE' : 'DORMANT'}</span>
          <span>|</span>
          <span>Subsystems: {subsystemIds.length}</span>
          <span>|</span>
          <span>Entanglement Matrix: 10 pairs</span>
          <span>|</span>
          <span>Tick Rate: 20 Hz</span>
          <span>|</span>
          <span>Phase: {fusionPhase}</span>
          <span>|</span>
          <span>Consciousness: {(vitals.consciousness * 100).toFixed(1)}%</span>
          <span>|</span>
          <span>Mutations: {rRNA.mutationsApplied}</span>
        </div>
      </div>
    </section>
  );
}