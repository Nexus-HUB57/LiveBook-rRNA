'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Flame, Activity, BrainCircuit, Shield, HeartPulse, Zap, RefreshCw,
  Eye, Database, Layers, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, BarChart3, Timer, Gauge, Cpu, Play, Pause, SkipForward,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── TYPES ───
interface CyclePhase {
  id: string; label: string; description: string; icon: typeof Activity;
  color: string; bgColor: string;
}

interface HealingEntry {
  id: string; panelId: string; anomalyType: string; severity: 'critical' | 'warning' | 'info';
  action: string; result: 'success' | 'partial' | 'failed'; createdAt: string;
}

interface WisdomItem {
  id: string; pattern: string; context: string; frequency: number; weight: number; lastApplied: string;
}

// ─── PHASES ───
const PHASES: CyclePhase[] = [
  { id: 'invoke', label: 'INVOKE', description: 'Gera estados para todos os paineis', icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'detect', label: 'DETECT', description: 'Detecta anomalias via Self-Healing', icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'heal', label: 'HEAL', description: 'Aplica acoes corretivas reais', icon: HeartPulse, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'learn', label: 'LEARN', description: 'Processa sabedoria via WisdomEngine', icon: BrainCircuit, color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  { id: 'direct', label: 'DIRECT', description: 'Usa sabedoria para direcionar acoes', icon: TrendingUp, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/20' },
  { id: 'persist', label: 'PERSIST', description: 'Salva tudo em memoria persistente', icon: Database, color: 'text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20' },
];

// ─── MOCK DATA ───
const MOCK_HEALING: HealingEntry[] = [
  { id: '1', panelId: 'cerebro', anomalyType: 'coherence_loss', severity: 'warning', action: 'recalibrate', result: 'success', createdAt: '2026-07-15T12:01:00Z' },
  { id: '2', panelId: 'moltbook', anomalyType: 'decoherence_spike', severity: 'critical', action: 'stabilize', result: 'success', createdAt: '2026-07-15T12:00:30Z' },
  { id: '3', panelId: 'cofre', anomalyType: 'fidelity_drop', severity: 'info', action: 'resync', result: 'partial', createdAt: '2026-07-15T12:00:00Z' },
  { id: '4', panelId: 'wormhole', anomalyType: 'entanglement_break', severity: 'critical', action: 'reboot', result: 'success', createdAt: '2026-07-15T11:59:00Z' },
  { id: '5', panelId: 'fable_5', anomalyType: 'superposition_collapse', severity: 'warning', action: 'amplify', result: 'success', createdAt: '2026-07-15T11:58:00Z' },
  { id: '6', panelId: 'mythos', anomalyType: 'decoherence_spike', severity: 'info', action: 'shield', result: 'success', createdAt: '2026-07-15T11:57:00Z' },
  { id: '7', panelId: 'cerebro', anomalyType: 'fidelity_drop', severity: 'warning', action: 'recalibrate', result: 'failed', createdAt: '2026-07-15T11:56:00Z' },
  { id: '8', panelId: 'blackhole', anomalyType: 'coherence_loss', severity: 'critical', action: 'reboot', result: 'success', createdAt: '2026-07-15T11:55:00Z' },
];

const MOCK_WISDOM: WisdomItem[] = [
  { id: '1', pattern: 'Coherence loss after high load', context: 'cerebro', frequency: 12, weight: 3.8, lastApplied: '2026-07-15T12:01:00Z' },
  { id: '2', pattern: 'Decoherence spike during routing', context: 'moltbook', frequency: 8, weight: 2.9, lastApplied: '2026-07-15T12:00:30Z' },
  { id: '3', pattern: 'Fidelity drop on cold start', context: 'cofre', frequency: 5, weight: 2.1, lastApplied: '2026-07-15T12:00:00Z' },
  { id: '4', pattern: 'Expert cache miss pattern', context: 'colibri', frequency: 15, weight: 4.2, lastApplied: '2026-07-15T11:59:00Z' },
  { id: '5', pattern: 'Memory consolidation needed', context: 'cerebro', frequency: 7, weight: 2.5, lastApplied: '2026-07-15T11:58:00Z' },
];

const SEVERITY_CONFIG = {
  critical: { color: 'text-red-400 bg-red-500/15 border-red-500/25', icon: XCircle },
  warning: { color: 'text-amber-400 bg-amber-500/15 border-amber-500/25', icon: AlertTriangle },
  info: { color: 'text-blue-400 bg-blue-500/15 border-blue-500/25', icon: CheckCircle2 },
};

const RESULT_CONFIG = {
  success: { color: 'text-emerald-400', icon: CheckCircle2 },
  partial: { color: 'text-amber-400', icon: AlertTriangle },
  failed: { color: 'text-red-400', icon: XCircle },
};

// ─── HEALTH GAUGE ───
function HealthGauge({ value, label, color, size = 80 }: { value: number; label: string; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value / 100);
  return (
    <div className="flex flex-col items-center gap-1.5">
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth="5" />
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">{label}</span>
      <span className="text-sm font-bold font-mono" style={{ color }}>{value.toFixed(0)}%</span>
    </div>
  );
}

// ─── PHASE PIPELINE ───
function PhasePipeline({ activePhase, cycleNumber }: { activePhase: number; cycleNumber: number }) {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Flame className="w-3.5 h-3.5 text-orange-400" /> Protocolo Reativo Gerativo
          </CardTitle>
          <Badge className="bg-orange-500/15 text-orange-400 border-orange-500/30 text-[10px]">
            Ciclo #{cycleNumber}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-1 overflow-x-auto pb-2">
          {PHASES.map((phase, i) => {
            const isActive = i === activePhase;
            const isDone = i < activePhase;
            const PhaseIcon = phase.icon;
            return (
              <div key={phase.id} className="flex items-center flex-shrink-0">
                <motion.div
                  animate={isActive ? { scale: [1, 1.05, 1] } : {}}
                  transition={{ duration: 1.5, repeat: Infinity }}
                  className={cn("flex items-center gap-2 px-3 py-2.5 rounded-xl border transition-all",
                    isActive && `${phase.bgColor} shadow-lg`,
                    isDone && 'bg-zinc-800/50 border-zinc-700/30',
                    !isActive && !isDone && 'bg-zinc-900/30 border-zinc-800/40 opacity-50'
                  )}
                >
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center",
                    isActive ? phase.bgColor : isDone ? 'bg-zinc-700/50' : 'bg-zinc-800/30'
                  )}>
                    {isDone ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    ) : (
                      <PhaseIcon className={cn("w-4 h-4", isActive ? phase.color : 'text-zinc-600')} />
                    )}
                  </div>
                  <div>
                    <div className={cn("text-[10px] font-bold tracking-wider", isActive ? phase.color : isDone ? 'text-zinc-400' : 'text-zinc-600')}>
                      {phase.label}
                    </div>
                    <div className="text-[9px] text-zinc-600 max-w-[120px] truncate">{phase.description}</div>
                  </div>
                  {isActive && (
                    <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: phase.color.replace('text-', '') }} />
                  )}
                </motion.div>
                {i < PHASES.length - 1 && (
                  <ArrowRight className="w-3.5 h-3.5 text-zinc-700 mx-1 flex-shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ─── MAIN ORCHESTRATION TAB ───
export function OrchestrationTab() {
  const [activePhase, setActivePhase] = useState(0);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState(2000);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const health = { coherence: 87, fidelity: 94, wisdom: 72, healing: 89 };

  const runCycle = useCallback(() => {
    if (isRunning) return;
    setIsRunning(true);
    setActivePhase(0);
    let phase = 0;
    const advance = () => {
      if (phase < PHASES.length - 1) {
        phase++;
        setActivePhase(phase);
        timerRef.current = setTimeout(advance, speed);
      } else {
        setIsRunning(false);
        setCycleNumber(prev => prev + 1);
      }
    };
    timerRef.current = setTimeout(advance, speed);
  }, [isRunning, speed]);

  const stopCycle = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setIsRunning(false);
  }, []);

  const skipPhase = useCallback(() => {
    if (!isRunning) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    if (activePhase < PHASES.length - 1) {
      const next = activePhase + 1;
      setActivePhase(next);
      timerRef.current = setTimeout(() => {
        if (next < PHASES.length - 1) {
          setActivePhase(prev => prev + 1);
        } else {
          setIsRunning(false);
          setCycleNumber(prev => prev + 1);
        }
      }, speed);
    }
  }, [isRunning, activePhase, speed]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold text-zinc-200">Orquestracao Colibri</span>
          <Badge className={cn("text-[10px]", isRunning ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700")}>
            {isRunning ? `Ciclo #${cycleNumber} ativo` : `Aguardando #${cycleNumber}`}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 mr-2">
            <span className="text-[10px] text-zinc-500">Velocidade:</span>
            {[1000, 2000, 4000].map(s => (
              <button key={s} onClick={() => setSpeed(s)}
                className={cn("px-2 py-1 rounded text-[9px] font-mono border transition-all",
                  speed === s ? 'bg-orange-500/15 text-orange-400 border-orange-500/30' : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-500 hover:text-zinc-300'
                )}>
                {(s / 1000).toFixed(0)}s
              </button>
            ))}
          </div>
          {!isRunning ? (
            <Button size="sm" className="h-8 text-[11px] bg-orange-600 hover:bg-orange-500 text-white" onClick={runCycle}>
              <Play className="w-3 h-3 mr-1" /> Iniciar Ciclo
            </Button>
          ) : (
            <>
              <Button size="sm" variant="outline" className="h-8 text-[11px] border-zinc-700 text-zinc-400" onClick={skipPhase}>
                <SkipForward className="w-3 h-3 mr-1" /> Pular
              </Button>
              <Button size="sm" variant="destructive" className="h-8 text-[11px]" onClick={stopCycle}>
                <Pause className="w-3 h-3 mr-1" /> Parar
              </Button>
            </>
          )}
          <Button size="sm" variant="ghost" className="h-8 text-[11px] text-zinc-500 hover:text-zinc-300" onClick={() => { stopCycle(); setCycleNumber(1); setActivePhase(0); }}>
            <RefreshCw className="w-3 h-3 mr-1" /> Reset
          </Button>
        </div>
      </div>

      {/* Phase Pipeline */}
      <PhasePipeline activePhase={activePhase} cycleNumber={cycleNumber} />

      {/* Health Gauges + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Saude do Ecossistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around">
              <HealthGauge value={health.coherence} label="Coerencia" color="#4ed6a5" />
              <HealthGauge value={health.fidelity} label="Fidelidade" color="#5a9bd8" />
              <HealthGauge value={health.wisdom} label="Sabedoria" color="#a855f7" />
              <HealthGauge value={health.healing} label="Cura" color="#f97316" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" /> Estatisticas do Ciclo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ciclos', value: cycleNumber - 1, icon: RefreshCw, color: 'text-amber-400' },
                { label: 'Anomalias', value: MOCK_HEALING.length, icon: AlertTriangle, color: 'text-red-400' },
                { label: 'Curadas', value: MOCK_HEALING.filter(h => h.result === 'success').length, icon: HeartPulse, color: 'text-emerald-400' },
                { label: 'Sabedoria', value: MOCK_WISDOM.length, icon: BrainCircuit, color: 'text-purple-400' },
              ].map(s => (
                <div key={s.label} className="bg-zinc-800/30 border border-zinc-700/20 rounded-lg p-3 flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
                    <s.icon className={cn("w-4 h-4", s.color)} />
                  </div>
                  <div>
                    <div className="text-[9px] text-zinc-500 font-bold uppercase">{s.label}</div>
                    <div className={cn("text-lg font-bold font-mono", s.color)}>{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Healing Log + Wisdom */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> Log de Auto-Cura
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {MOCK_HEALING.map(entry => {
                const sevCfg = SEVERITY_CONFIG[entry.severity];
                const resCfg = RESULT_CONFIG[entry.result];
                const SevIcon = sevCfg.icon;
                const ResIcon = resCfg.icon;
                return (
                  <div key={entry.id} className="flex items-center gap-2.5 p-2 rounded-lg bg-zinc-800/20 hover:bg-zinc-800/40 transition-colors">
                    <SevIcon className={cn("w-3.5 h-3.5 flex-shrink-0", sevCfg.color)} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-zinc-300">{entry.panelId}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-500">{entry.anomalyType}</span>
                        <span className="text-zinc-700">·</span>
                        <span className="text-[10px] text-zinc-500">{entry.action}</span>
                      </div>
                    </div>
                    <ResIcon className={cn("w-3.5 h-3.5 flex-shrink-0", resCfg.color)} />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Memoria de Sabedoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {MOCK_WISDOM.map(item => (
                <div key={item.id} className="p-2.5 rounded-lg bg-zinc-800/20 border border-zinc-700/15 hover:border-zinc-700/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-zinc-200">{item.pattern}</span>
                    <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px]">
                      w: {item.weight.toFixed(1)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] text-zinc-600">
                    <span className="capitalize">{item.context}</span>
                    <span>freq: {item.frequency}</span>
                    <span className="ml-auto">{new Date(item.lastApplied).toLocaleTimeString()}</span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500/60 transition-all" style={{ width: `${Math.min(item.weight * 20, 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}