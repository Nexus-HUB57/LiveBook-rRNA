'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import ZettaScaleGauge from './zettascale-gauge';
import ValidationProtocol from './validation-protocol';
import { Shield, Activity, TrendingUp, HardDrive, Gauge } from 'lucide-react';

interface MetricData {
  label: string;
  value: number;
  color: string;
  glowColor: string;
  unit: string;
  maxLabel: string;
}

const INITIAL_METRICS: MetricData[] = [
  { label: 'rRNA I/O', value: 0.82, color: '#06d6a0', glowColor: 'rgba(6,214,160,0.5)', unit: 'ZB/s', maxLabel: '1.2 ZB/s' },
  { label: 'Quantum', value: 0.71, color: '#a855f7', glowColor: 'rgba(168,85,247,0.5)', unit: 'YB/s', maxLabel: '890 YB/s' },
  { label: 'Latencia', value: 0.93, color: '#fbbf24', glowColor: 'rgba(251,191,36,0.5)', unit: 'ns', maxLabel: '<0.3ns' },
  { label: 'Coerencia', value: 0.65, color: '#e040a0', glowColor: 'rgba(224,64,160,0.5)', unit: '%', maxLabel: '99.999%' },
  { label: 'Replicas', value: 0.88, color: '#8b5cf6', glowColor: 'rgba(139,92,246,0.5)', unit: 'D', maxLabel: '7 Dim' },
];

interface LiveStat {
  label: string;
  getValue: () => string;
  color: string;
  icon: React.ReactNode;
  decimals?: number;
}

export default function ZettaScaleDashboard() {
  const [isValidating, setIsValidating] = useState(false);
  const [validationComplete, setValidationComplete] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [validationIntensity, setValidationIntensity] = useState(0);
  const [metrics, setMetrics] = useState<MetricData[]>(INITIAL_METRICS);
  const [uptimeSeconds, setUptimeSeconds] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Live stat fluctuation
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => {
        const fluctuation = (Math.random() - 0.5) * 0.02;
        const baseValue = isValidating ? Math.min(1, m.value + 0.001) : m.value;
        return { ...m, value: Math.max(0, Math.min(1, baseValue + fluctuation)) };
      }));
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isValidating]);

  // Metric values during validation
  useEffect(() => {
    if (!isValidating) return;
    const interval = setInterval(() => {
      setMetrics(prev => prev.map(m => ({
        ...m,
        value: Math.min(1, m.value + Math.random() * 0.008),
      })));
    }, 300);
    return () => clearInterval(interval);
  }, [isValidating]);

  const startValidation = useCallback(() => {
    setIsValidating(true);
    setValidationComplete(false);
    setCurrentStageIndex(0);
    setValidationIntensity(0);
    setMetrics(prev => prev.map(m => ({ ...m, value: Math.max(0.3, m.value * 0.6) })));
  }, []);

  const handleValidationComplete = useCallback(() => {
    setIsValidating(false);
    setValidationComplete(true);
    setValidationIntensity(1);
    setMetrics(INITIAL_METRICS.map(m => ({
      ...m,
      value: 0.92 + Math.random() * 0.08,
    })));
  }, []);

  const formatUptime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  const liveStats: LiveStat[] = [
    { label: 'Throughput', getValue: () => `${(metrics[0].value * 1.2).toFixed(2)} ZB/s`, color: '#06d6a0', icon: <TrendingUp className="w-4 h-4" /> },
    { label: 'Quantum Ch.', getValue: () => `${(metrics[1].value * 890).toFixed(0)} YB/s`, color: '#a855f7', icon: <Activity className="w-4 h-4" /> },
    { label: 'Latencia', getValue: () => `${(0.5 - metrics[2].value * 0.45).toFixed(3)}ns`, color: '#fbbf24', icon: <Gauge className="w-4 h-4" /> },
    { label: 'Uptime', getValue: () => formatUptime(uptimeSeconds), color: '#e040a0', icon: <HardDrive className="w-4 h-4" /> },
  ];

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, #06d6a0 0%, transparent 60%)', filter: 'blur(100px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-16">
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-[#fbbf24] mb-4 border border-[#fbbf24]/20 px-4 py-2 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Shield className="w-3 h-3" />
            Zettascale Validation
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="text-white">Validacao em Nivel </span>
            <span className="bg-gradient-to-r from-[#fbbf24] via-[#06d6a0] to-[#a855f7] bg-clip-text text-transparent">
              Zettascale
            </span>
          </motion.h2>
          <motion.p
            className="mt-4 text-[#8888aa] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Protocolo de validacao de 5 estagios que certifica a operacao do sistema
            em escala de zettabytes. Cada nucleo rRNA e verificado contra metricas
            de throughput, latencia, coerencia quantica e redundancia dimensional.
          </motion.p>
        </div>

        {/* Live stats bar */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 sm:mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {liveStats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl p-3 sm:p-4 flex items-center gap-3 border border-white/5"
            >
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <div>
                <div className="text-[10px] text-[#8888aa] uppercase tracking-wider">{stat.label}</div>
                <div className="text-sm sm:text-base font-bold font-mono text-white">{stat.getValue()}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Main layout: Gauge + Validation */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">
          {/* Left: ZettaScale Gauge */}
          <motion.div
            className="lg:col-span-5 relative rounded-2xl overflow-hidden glass gradient-border"
            style={{ minHeight: '420px' }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="absolute top-4 left-4 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                isValidating ? 'bg-[#fbbf24] animate-pulse' : validationComplete ? 'bg-[#06d6a0]' : 'bg-[#8888aa]'
              }`} />
              <span className="text-xs font-mono text-[#fbbf24] tracking-wider uppercase">Gauge</span>
            </div>
            {validationComplete && (
              <div className="absolute top-4 right-4 z-10">
                <span className="text-[10px] font-mono text-[#06d6a0] border border-[#06d6a0]/30 px-2 py-1 rounded-full">
                  ZETTASCALE CERTIFICADO
                </span>
              </div>
            )}
            <ZettaScaleGauge
              metrics={metrics}
              isValidating={isValidating}
              validationIntensity={validationIntensity}
            />
          </motion.div>

          {/* Right: Validation Protocol + Controls */}
          <div className="lg:col-span-7 space-y-4">
            {/* Control */}
            <motion.div
              className="flex items-center justify-between"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <div>
                <h3 className="text-sm font-semibold text-white">Protocolo de Validacao</h3>
                <p className="text-[10px] text-[#8888aa]">
                  5 estagios &bull; 15 verificacoes &bull; Nivel Zettascale
                </p>
              </div>
              {!isValidating && (
                <motion.button
                  onClick={startValidation}
                  className="px-5 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#fbbf24] to-[#e040a0] text-[#050510] hover:shadow-[0_0_20px_rgba(251,191,36,0.4)] transition-shadow"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.97 }}
                >
                  <Shield className="w-4 h-4" />
                  {validationComplete ? 'Revalidar' : 'Iniciar Validacao'}
                </motion.button>
              )}
            </motion.div>

            {/* Validation Protocol */}
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, delay: 0.3 }}
            >
              <ValidationProtocol
                isValidating={isValidating}
                onComplete={handleValidationComplete}
                currentStageIndex={currentStageIndex}
                setCurrentStageIndex={setCurrentStageIndex}
                validationIntensity={validationIntensity}
                setValidationIntensity={setValidationIntensity}
              />
            </motion.div>
          </div>
        </div>

        {/* Bottom metrics strip */}
        <motion.div
          className="mt-6 sm:mt-8 grid grid-cols-5 gap-3"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          {metrics.map(m => (
            <div key={m.label} className="text-center p-2.5 rounded-xl bg-[#0a0a1a]/40 border border-white/5">
              <div className="text-[9px] text-[#8888aa] uppercase tracking-wider mb-1">{m.label}</div>
              <div className="text-sm font-bold font-mono" style={{ color: m.color }}>
                {(m.value * 100).toFixed(1)}%
              </div>
              <div className="text-[8px] text-[#8888aa]/60 mt-0.5">{m.maxLabel}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}