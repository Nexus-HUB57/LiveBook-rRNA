'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Zap, Server, Cpu, Network, CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';

interface ValidationStage {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  checks: ValidationCheck[];
}

interface ValidationCheck {
  id: string;
  label: string;
  target: string;
  status: 'pending' | 'running' | 'passed' | 'failed';
  value: number; // 0-1
  unit: string;
}

const STAGES: ValidationStage[] = [
  {
    id: 'integrity',
    name: 'Integridade Zettascale',
    description: 'Verificacao de integridade dos dados em escala ZB. Cada bloco e validado contra seu hash rRNA.',
    icon: <Shield className="w-5 h-5" />,
    checks: [
      { id: 'hash-integrity', label: 'Hash rRNA', target: '10^21 blocos', status: 'pending', value: 0, unit: '%' },
      { id: 'quantum-signature', label: 'Assinatura Quantica', target: 'Fidelidade > 99.99%', status: 'pending', value: 0, unit: '%' },
      { id: 'temporal-coherence', label: 'Coerencia Temporal', target: 'Desvio < 0.001ns', status: 'pending', value: 0, unit: '%' },
    ],
  },
  {
    id: 'throughput',
    name: 'Throughput de Dados',
    description: 'Medicao do fluxo de dados atraves dos nucleos de processamento. Meta: 1+ ZB/s sustentavel.',
    icon: <Zap className="w-5 h-5" />,
    checks: [
      { id: 'rRNA-throughput', label: 'rRNA Core I/O', target: '1.2 ZB/s', status: 'pending', value: 0, unit: 'ZB/s' },
      { id: 'quantum-channel', label: 'Canal Quantico', target: '890 YB/s', status: 'pending', value: 0, unit: 'YB/s' },
      { id: 'latency', label: 'Latencia', target: '< 0.3ns', status: 'pending', value: 0, unit: '%' },
    ],
  },
  {
    id: 'symbiosis',
    name: 'Simbiose Quântica',
    description: 'Validacao da estabilidade do emparelhamento quantico-biologico em todos os nucleos rRNA.',
    icon: <Server className="w-5 h-5" />,
    checks: [
      { id: 'entangle-stability', label: 'Estabilidade EPR', target: '99.999%', status: 'pending', value: 0, unit: '%' },
      { id: 'decoherence-resist', label: 'Resistencia a Decoerencia', target: 'T2 > 10ms', status: 'pending', value: 0, unit: '%' },
      { id: 'bio-quantum-sync', label: 'Sync Bio-Quantico', target: 'Delta < 0.01fs', status: 'pending', value: 0, unit: '%' },
    ],
  },
  {
    id: 'redundancy',
    name: 'Redundancia Dimensional',
    description: 'Verificacao da replicacao de dados entre multiplas dimensoes do metaverso.',
    icon: <Cpu className="w-5 h-5" />,
    checks: [
      { id: 'dimension-replication', label: 'Replicacao Inter-D', target: '7 dimensoes', status: 'pending', value: 0, unit: 'D' },
      { id: 'consensus', label: 'Consenso Quorum', target: '2/3 + 1', status: 'pending', value: 0, unit: '%' },
      { id: 'failover', label: 'Failover Latencia', target: '< 0.01ns', status: 'pending', value: 0, unit: '%' },
    ],
  },
  {
    id: 'certification',
    name: 'Certificacao Final',
    description: 'Certificacao de que todo o sistema opera em nivel zettascale com margem de seguranca.',
    icon: <Network className="w-5 h-5" />,
    checks: [
      { id: 'stress-test', label: 'Stress Test 120%', target: '1.2x capacidade', status: 'pending', value: 0, unit: '%' },
      { id: 'sustained-24h', label: 'Sustentacao 24h', target: 'Zero falhas', status: 'pending', value: 0, unit: '%' },
      { id: 'entropy-balance', label: 'Balanco de Entropia', target: 'Equilibrio', status: 'pending', value: 0, unit: '%' },
    ],
  },
];

export default function ValidationProtocol({
  isValidating,
  onComplete,
  currentStageIndex,
  setCurrentStageIndex,
  validationIntensity,
  setValidationIntensity,
}: {
  isValidating: boolean;
  onComplete: () => void;
  currentStageIndex: number;
  setCurrentStageIndex: (i: number) => void;
  validationIntensity: number;
  setValidationIntensity: (v: number) => void;
}) {
  const [checksState, setChecksState] = useState<ValidationCheck[][]>(
    STAGES.map(s => s.checks.map(c => ({ ...c })))
  );
  const [log, setLog] = useState<{ time: string; message: string; type: 'info' | 'success' | 'warn' | 'error' }[]>([]);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((message: string, type: 'info' | 'success' | 'warn' | 'error' = 'info') => {
    const now = new Date();
    const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}.${String(now.getMilliseconds()).padStart(3, '0')}`;
    setLog(prev => [...prev.slice(-50), { time, message, type }]);
  }, []);

  // Run validation
  const stageIdxRef = useRef(currentStageIndex);
  const intensityRef = useRef(validationIntensity);

  useEffect(() => {
    if (!isValidating) return;

    stageIdxRef.current = 0;
    intensityRef.current = 0;
    let checkIdx = 0;
    let value = 0;

    addLog(`[ZETTASCALE] Iniciando validacao em nivel Zettascale...`, 'info');
    addLog(`[STAGE 1] ${STAGES[0].name}`, 'info');

    const interval = setInterval(() => {
      const stageIdx = stageIdxRef.current;

      if (stageIdx >= STAGES.length) {
        clearInterval(interval);
        addLog(`[CERTIFIED] Sistema validado com sucesso em nivel Zettascale.`, 'success');
        setValidationIntensity(1);
        setCurrentStageIndex(STAGES.length);
        onComplete();
        return;
      }

      setChecksState(prev => {
        const next = prev.map(s => s.map(c => ({ ...c })));
        const stage = next[stageIdx];
        if (!stage || checkIdx >= stage.length) return prev;

        value += 3 + Math.random() * 5;
        const clampedValue = Math.min(100, value);
        stage[checkIdx].value = clampedValue / 100;
        stage[checkIdx].status = clampedValue >= 100 ? 'passed' : 'running';

        if (clampedValue >= 100) {
          addLog(`  [PASS] ${stage[checkIdx].label}: ${stage[checkIdx].target}`, 'success');
          checkIdx++;
          value = 0;

          if (checkIdx >= stage.length) {
            addLog(`[STAGE ${stageIdx + 1}] Completo — todos os checks passaram.`, 'success');
            stageIdxRef.current = stageIdx + 1;
            checkIdx = 0;
            value = 0;
            setCurrentStageIndex(stageIdxRef.current);

            if (stageIdxRef.current < STAGES.length) {
              addLog(`[STAGE ${stageIdxRef.current + 1}] ${STAGES[stageIdxRef.current].name}`, 'info');
            }

            const progress = stageIdxRef.current / STAGES.length;
            intensityRef.current = progress;
            setValidationIntensity(progress);
          }
        } else if (Math.random() < 0.08) {
          addLog(`  ...${stage[checkIdx].label}: ${clampedValue.toFixed(0)}%`, 'info');
        }

        return next;
      });
    }, 80);

    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isValidating]);

  // Auto-scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [log]);

  const allChecks = checksState.flat();
  const passed = allChecks.filter(c => c.status === 'passed').length;
  const total = allChecks.length;
  const currentStage = STAGES[currentStageIndex] || STAGES[STAGES.length - 1];

  return (
    <div className="space-y-4">
      {/* Stage navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
        {STAGES.map((stage, i) => {
          const stagePassed = checksState[i]?.every(c => c.status === 'passed');
          const stageActive = i === currentStageIndex && isValidating;
          const stagePending = i > currentStageIndex || !isValidating;

          return (
            <button
              key={stage.id}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-[10px] font-mono whitespace-nowrap transition-all duration-300 flex-shrink-0 cursor-pointer ${
                stagePassed
                  ? 'bg-[#06d6a0]/10 border border-[#06d6a0]/30 text-[#06d6a0]'
                  : stageActive
                  ? 'bg-[#a855f7]/10 border border-[#a855f7]/30 text-[#a855f7]'
                  : 'bg-[#0a0a1a]/40 border border-white/5 text-[#8888aa]/50'
              }`}
            >
              {stagePassed ? (
                <CheckCircle2 className="w-3 h-3" />
              ) : stageActive ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Clock className="w-3 h-3" />
              )}
              <span className="hidden sm:inline">{stage.name.split(' ')[0]}</span>
              <span className="sm:hidden">S{i + 1}</span>
            </button>
          );
        })}
      </div>

      {/* Current stage checks */}
      <div className="glass-strong rounded-xl p-4 gradient-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="text-[#a855f7]">{currentStage.icon}</div>
          <div>
            <h4 className="text-sm font-semibold text-white">{currentStage.name}</h4>
            <p className="text-[10px] text-[#8888aa]">{currentStage.description}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {checksState[currentStageIndex]?.map((check) => {
            const statusColor = check.status === 'passed' ? '#06d6a0'
              : check.status === 'running' ? '#a855f7'
              : check.status === 'failed' ? '#e040a0' : '#8888aa';
            const StatusIcon = check.status === 'passed' ? CheckCircle2
              : check.status === 'running' ? Loader2
              : check.status === 'failed' ? XCircle : Clock;

            return (
              <div key={check.id} className="flex items-center gap-3">
                <StatusIcon
                  className="w-4 h-4 flex-shrink-0"
                  style={{ color: statusColor }}
                  {...(check.status === 'running' ? { className: 'w-4 h-4 flex-shrink-0 animate-spin' } : {})}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-white truncate">{check.label}</span>
                    <span className="text-[10px] font-mono" style={{ color: statusColor }}>
                      {check.status === 'passed' ? check.target : `${(check.value * 100).toFixed(0)}%`}
                    </span>
                  </div>
                  <div className="h-1 rounded-full bg-[#1a1a3e] overflow-hidden">
                    <motion.div
                      className="h-full rounded-full transition-colors duration-300"
                      style={{
                        background: check.status === 'passed' ? '#06d6a0' : `linear-gradient(to right, #a855f7, ${statusColor})`,
                      }}
                      animate={{ width: `${check.value * 100}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* System log */}
      <div className="glass-strong rounded-xl overflow-hidden gradient-border">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-white/5">
          <span className="text-[10px] font-mono text-[#8888aa] tracking-wider uppercase">System Log — Zettascale</span>
          <span className="text-[10px] font-mono text-[#8888aa]">
            {passed}/{total} checks
          </span>
        </div>
        <div
          ref={logRef}
          className="h-40 overflow-y-auto p-3 space-y-0.5 font-mono text-[10px] leading-relaxed"
          style={{ scrollbarWidth: 'thin', scrollbarColor: '#a855f730 transparent' }}
        >
          <AnimatePresence mode="popLayout">
            {log.map((entry, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex gap-2"
              >
                <span className="text-[#8888aa]/40 flex-shrink-0">{entry.time}</span>
                <span
                  style={{
                    color: entry.type === 'success' ? '#06d6a0'
                      : entry.type === 'error' ? '#e040a0'
                      : entry.type === 'warn' ? '#fbbf24'
                      : '#8888aa',
                  }}
                >
                  {entry.message}
                </span>
              </motion.div>
            ))}
          </AnimatePresence>
          {log.length === 0 && (
            <div className="text-[#8888aa]/30 text-center py-8">Aguardando inicializacao do protocolo...</div>
          )}
        </div>
      </div>
    </div>
  );
}