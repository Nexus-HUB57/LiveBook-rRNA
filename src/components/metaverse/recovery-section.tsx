'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import RecoveryCoreCanvas from './recovery-core-canvas';
import ArtifactsRecovery from './artifacts-recovery';
import { Play, Square, Atom, Dna, Zap, RotateCcw, Activity } from 'lucide-react';

type RecoveryPhase = 'idle' | 'scanning' | 'decoding' | 'symbiosis' | 'complete';

const phaseInfo: Record<RecoveryPhase, { label: string; color: string; icon: React.ReactNode; desc: string }> = {
  idle: { label: 'Em Espera', color: '#8888aa', icon: <Activity className="w-4 h-4" />, desc: 'Nucleos ribossomicos em standby. Prontos para iniciar a recuperacao de artefatos.' },
  scanning: { label: 'Escaneando rRNA', color: '#06d6a0', icon: <Dna className="w-4 h-4" />, desc: 'Varredura das sequencias rRNA em busca de artefatos degradados nas eras 2026 e 2077.' },
  decoding: { label: 'Decodificando', color: '#a855f7', icon: <RotateCcw className="w-4 h-4" />, desc: 'Processamento ribossomico ativo. Traduzindo sequencias geneticas de dados digitais.' },
  symbiosis: { label: 'Simbiose Quântica', color: '#e040a0', icon: <Atom className="w-4 h-4" />, desc: 'Entrelaçamento quantico-biologico ativado. Dados sendo reconstruidos em multiplas dimensoes simultaneamente.' },
  complete: { label: 'Ciclo Completo', color: '#fbbf24', icon: <Zap className="w-4 h-4" />, desc: 'Todos os artefatos recuperáveis foram processados. Inicie um novo ciclo para continuar.' },
};

export default function RecoverySection() {
  const [phase, setPhase] = useState<RecoveryPhase>('idle');
  const [progress, setProgress] = useState(0);
  const [quantumSymbiosis, setQuantumSymbiosis] = useState(false);
  const [selectedArtifact, setSelectedArtifact] = useState<string | null>(null);
  const [nucleoStats, setNucleoStats] = useState({
    codonsProcessed: 0,
    quantumPairs: 0,
    rnaThroughput: '0 kb/s',
  });

  const startRecovery = useCallback(() => {
    if (phase !== 'idle' && phase !== 'complete') return;

    setProgress(0);
    setQuantumSymbiosis(false);
    setSelectedArtifact(null);
    setPhase('scanning');
    setNucleoStats({ codonsProcessed: 0, quantumPairs: 0, rnaThroughput: '0 kb/s' });

    let p = 0;
    let phase2Triggered = false;
    let phase3Triggered = false;

    const interval = setInterval(() => {
      p += 0.8 + Math.random() * 0.7;
      setProgress(Math.min(100, p));

      // Phase transitions
      if (p >= 25 && !phase2Triggered) {
        phase2Triggered = true;
        setPhase('decoding');
      }
      if (p >= 55 && !phase3Triggered) {
        phase3Triggered = true;
        setQuantumSymbiosis(true);
        setPhase('symbiosis');
      }

      // Stats
      const codons = Math.floor(p * 42);
      const qp = p > 55 ? Math.floor((p - 55) * 3.6) : 0;
      const throughput = (120 + Math.random() * 80).toFixed(0);
      setNucleoStats({
        codonsProcessed: codons,
        quantumPairs: qp,
        rnaThroughput: p > 25 ? `${throughput} kb/s` : '0 kb/s',
      });

      if (p >= 100) {
        clearInterval(interval);
        setPhase('complete');
        setQuantumSymbiosis(false);
      }
    }, 100);
  }, [phase]);

  const stopRecovery = useCallback(() => {
    setPhase('idle');
    setProgress(0);
    setQuantumSymbiosis(false);
  }, []);

  const currentInfo = phaseInfo[phase];
  const isActive = phase !== 'idle' && phase !== 'complete';

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-0 w-[500px] h-[500px] opacity-5"
          style={{ background: 'radial-gradient(circle, #06d6a0 0%, transparent 60%)', filter: 'blur(80px)' }}
        />
        <div className="absolute bottom-1/3 right-0 w-[400px] h-[400px] opacity-5"
          style={{ background: 'radial-gradient(circle, #a855f7 0%, transparent 60%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-[#06d6a0] mb-4 border border-[#06d6a0]/20 px-4 py-2 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Dna className="w-3 h-3" />
            Nucleo de Processamento rRNA
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="text-white">Recuperacao de </span>
            <span className="bg-gradient-to-r from-[#06d6a0] via-[#a855f7] to-[#e040a0] bg-clip-text text-transparent">
              Artefatos
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 text-[#8888aa] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Nucleos de processamento ribossomico decodificam artefatos das eras 2026 e 2077
            utilizando sequencias rRNA e simbiose quantica para reconstruir dados perdidos
            no espaco-tempo do metaverso.
          </motion.p>
        </div>

        {/* Main layout: Canvas + Controls + Artifacts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left: rRNA Canvas */}
          <motion.div
            className="lg:col-span-5 relative rounded-2xl overflow-hidden glass gradient-border"
            style={{ minHeight: '500px' }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${isActive ? 'bg-[#06d6a0] animate-pulse' : 'bg-[#8888aa]'}`} />
              <span className="text-xs font-mono text-[#06d6a0] tracking-wider uppercase">rRNA Core</span>
            </div>
            {quantumSymbiosis && (
              <div className="absolute top-4 right-4 z-10">
                <span className="text-[10px] font-mono text-[#e040a0] border border-[#e040a0]/30 px-2 py-1 rounded-full animate-pulse">
                  SIMBIOSE QUANTICA ATIVA
                </span>
              </div>
            )}
            <div className="absolute bottom-4 left-4 z-10">
              <span className="text-[10px] text-[#8888aa]/60 font-mono">
                Dupla helice rRNA {quantumSymbiosis ? '+ Entrelaçamento' : ''}
              </span>
            </div>
            <RecoveryCoreCanvas
              recoveryActive={isActive}
              recoveryProgress={progress}
              quantumSymbiosis={quantumSymbiosis}
            />
          </motion.div>

          {/* Right: Controls + Artifacts */}
          <div className="lg:col-span-7 space-y-6">
            {/* Control Panel */}
            <motion.div
              className="glass-strong rounded-2xl p-5 sm:p-6 gradient-border"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.15 }}
            >
              {/* Phase status */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div style={{ color: currentInfo.color }}>{currentInfo.icon}</div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{currentInfo.label}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border" style={{ color: currentInfo.color, borderColor: `${currentInfo.color}30` }}>
                        {phase.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#8888aa] mt-0.5 max-w-sm">{currentInfo.desc}</p>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2">
                  {isActive ? (
                    <motion.button
                      onClick={stopRecovery}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer border border-[#e040a0]/30 text-[#e040a0] hover:bg-[#e040a0]/10 transition-colors"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Square className="w-4 h-4" />
                      <span className="hidden sm:inline">Parar</span>
                    </motion.button>
                  ) : (
                    <motion.button
                      onClick={startRecovery}
                      className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#06d6a0] to-[#a855f7] text-white hover:shadow-[0_0_20px_rgba(6,214,160,0.4)] transition-shadow"
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <Play className="w-4 h-4" />
                      Iniciar Recuperacao
                    </motion.button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {(isActive || phase === 'complete') && (
                <div className="mb-4">
                  <div className="flex justify-between text-[10px] text-[#8888aa] mb-1.5">
                    <span>Progresso do Nucleo</span>
                    <span>{Math.floor(progress)}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[#1a1a3e] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full"
                      style={{
                        background: phase === 'symbiosis'
                          ? 'linear-gradient(to right, #06d6a0, #a855f7, #e040a0)'
                          : phase === 'complete'
                          ? 'linear-gradient(to right, #06d6a0, #fbbf24)'
                          : 'linear-gradient(to right, #06d6a0, #a855f7)',
                      }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                </div>
              )}

              {/* Phase timeline */}
              <div className="flex items-center gap-1 mb-4">
                {(['scanning', 'decoding', 'symbiosis', 'complete'] as const).map((p, i) => {
                  const phaseOrder = ['scanning', 'decoding', 'symbiosis', 'complete'];
                  const currentIndex = phaseOrder.indexOf(phase);
                  const thisIndex = i;
                  const isDone = currentIndex > thisIndex || phase === 'complete';
                  const isCurrent = phase === p;
                  return (
                    <div key={p} className="flex-1 flex items-center gap-1">
                      <div className="flex-1 flex flex-col items-center gap-1">
                        <div
                          className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                            isDone ? 'bg-[#06d6a0]' : isCurrent ? 'bg-[#a855f7] animate-pulse' : 'bg-[#1a1a3e]'
                          }`}
                        />
                        <span className={`text-[9px] font-mono transition-colors ${
                          isDone || isCurrent ? 'text-white' : 'text-[#8888aa]/50'
                        }`}>
                          {p === 'scanning' ? 'SCAN' : p === 'decoding' ? 'DECODE' : p === 'symbiosis' ? 'SIMBIOSE' : 'DONE'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nucleo stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2.5 rounded-xl bg-[#0a0a1a]/50 border border-[#06d6a0]/10">
                  <Dna className="w-4 h-4 mx-auto mb-1 text-[#06d6a0]" />
                  <div className="text-sm font-bold text-white font-mono">{nucleoStats.codonsProcessed}</div>
                  <div className="text-[9px] text-[#8888aa]">Codons</div>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-[#0a0a1a]/50 border border-[#a855f7]/10">
                  <Atom className="w-4 h-4 mx-auto mb-1 text-[#a855f7]" />
                  <div className="text-sm font-bold text-white font-mono">{nucleoStats.quantumPairs}</div>
                  <div className="text-[9px] text-[#8888aa]">Pares Q</div>
                </div>
                <div className="text-center p-2.5 rounded-xl bg-[#0a0a1a]/50 border border-[#e040a0]/10">
                  <Activity className="w-4 h-4 mx-auto mb-1 text-[#e040a0]" />
                  <div className="text-sm font-bold text-white font-mono">{nucleoStats.rnaThroughput}</div>
                  <div className="text-[9px] text-[#8888aa]">rRNA/s</div>
                </div>
              </div>
            </motion.div>

            {/* Artifacts Database */}
            <motion.div
              className="glass-strong rounded-2xl p-5 sm:p-6 gradient-border"
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <span className="w-1.5 h-5 rounded-full bg-gradient-to-b from-[#06d6a0] to-[#a855f7]" />
                  Banco de Artefatos
                </h3>
                <span className="text-[10px] font-mono text-[#8888aa]">ERAS 2026 / 2077</span>
              </div>
              <ArtifactsRecovery
                recoveryActive={isActive}
                onArtifactSelect={setSelectedArtifact}
                selectedArtifactId={selectedArtifact}
              />
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}