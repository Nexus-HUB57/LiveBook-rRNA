'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  Flame, Activity, BrainCircuit, Shield, HeartPulse, Zap, RefreshCw,
  Eye, Database, Layers, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  TrendingUp, BarChart3, Play, Pause, SkipForward, Lightbulb, Sparkles,
  LoaderCircle, History, Target,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── TYPES ───
interface PhaseDef {
  id: string; label: string; description: string; icon: typeof Activity;
  color: string; bgColor: string;
}

interface HealingReport {
  panelId: string; panelName: string; type: string; severity: string;
  diagnosis: string; prescribedSkills: string[];
}

interface HealingAction {
  panelId: string; skill: string; action: string; result: string;
  deltaApplied: Record<string, number>;
}

interface WisdomPattern {
  pattern: string; frequency: number; confidence: number;
  associatedPanels: string[]; rootCauseHypothesis: string; recommendedPrevention: string;
}

interface WisdomInsight {
  category: string; title: string; description: string;
  relatedPanels: string[]; impact: number; confidence: number;
}

interface WisdomState {
  wisdomScore: number; totalCyclesProcessed: number; totalAnomaliesObserved: number;
  totalHealingActions: number; patternsCount: number; insightsCount: number;
  avgHealingSuccessRate: number; bestHealingSuccessRate: number; evolutionGeneration: number;
}

interface CycleResult {
  success: boolean; cycle: {
    cycleNumber: number; duration: number; phase: string;
    anomalies: number; criticalAnomalies: number; healed: number;
    successRate: number; newPatterns: number; newInsights: number;
  }; wisdom: {
    score: number; totalCycles: number; patterns: number;
    insights: number; decisions: number;
  };
  reports: HealingReport[];
  actions: HealingAction[];
}

interface OrchestrationState {
  lastCycle: null | { cycleNumber: number; anomaliesDetected: number; healingSuccessRate: number; durationMs: number };
  history: null | Array<{ cycleNumber: number; anomaliesDetected: number; healingSuccessRate: number }>;
  wisdom: WisdomState | null;
  patterns: WisdomPattern[];
  insights: WisdomInsight[];
  cycles: Array<{ id: string; cycleNumber: number; phase: string; status: string; duration: number; anomalies: number; healed: number; wisdomGain: number; createdAt: string }>;
  healingEvents: Array<{ id: string; panelId: string; anomalyType: string; severity: string; action: string; result: string; createdAt: string }>;
}

// ─── PHASES ───
const PHASES: PhaseDef[] = [
  { id: 'invoke', label: 'INVOKE', description: 'Gera estados quânticos para todos os painéis', icon: Zap, color: 'text-amber-400', bgColor: 'bg-amber-500/10 border-amber-500/20' },
  { id: 'detect', label: 'DETECT', description: 'Detecta anomalias via Self-Healing Engine', icon: Eye, color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/20' },
  { id: 'heal', label: 'HEAL', description: 'Executa 6 algoritmos de cura reais', icon: HeartPulse, color: 'text-emerald-400', bgColor: 'bg-emerald-500/10 border-emerald-500/20' },
  { id: 'learn', label: 'LEARN', description: 'Processa sabedoria via Wisdom Engine', icon: BrainCircuit, color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/20' },
  { id: 'direct', label: 'DIRECT', description: 'Usa sabedoria para direcionar próximas ações', icon: TrendingUp, color: 'text-cyan-400', bgColor: 'bg-cyan-500/10 border-cyan-500/20' },
  { id: 'persist', label: 'PERSIST', description: 'Persiste tudo em memória (DB + MoltbookState)', icon: Database, color: 'text-rose-400', bgColor: 'bg-rose-500/10 border-rose-500/20' },
];

const SEVERITY_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  critical: { color: 'text-red-400', icon: XCircle },
  warning: { color: 'text-amber-400', icon: AlertTriangle },
  info: { color: 'text-blue-400', icon: CheckCircle2 },
};

const RESULT_CONFIG: Record<string, { color: string; icon: typeof CheckCircle2 }> = {
  success: { color: 'text-emerald-400', icon: CheckCircle2 },
  partial: { color: 'text-amber-400', icon: AlertTriangle },
  failed: { color: 'text-red-400', icon: XCircle },
  pending: { color: 'text-zinc-400', icon: LoaderCircle },
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
  const [activePhase, setActivePhase] = useState(-1);
  const [cycleNumber, setCycleNumber] = useState(1);
  const [isRunning, setIsRunning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CycleResult | null>(null);
  const [state, setState] = useState<OrchestrationState | null>(null);
  const [error, setError] = useState('');
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial state
  const loadState = useCallback(async () => {
    try {
      const res = await fetch('/api/colibri/orchestrate');
      const data = await res.json();
      if (data.error) return;
      setState(data);

      // Derive cycle number from data
      if (data.cycles?.length > 0) {
        const maxCycle = Math.max(...data.cycles.map((c: { cycleNumber: number }) => c.cycleNumber));
        setCycleNumber(maxCycle + 1);
      }
    } catch { /* first load, no data yet */ }
  }, []);

  useEffect(() => {
    loadState();
    const interval = setInterval(loadState, 15000);
    return () => clearInterval(interval);
  }, [loadState]);

  // Run a real orchestration cycle
  const runCycle = useCallback(async () => {
    if (isRunning || isLoading) return;
    setIsRunning(true);
    setIsLoading(true);
    setError('');
    setLastResult(null);

    // Animate through phases
    let phase = 0;
    setActivePhase(0);

    const advancePhase = () => {
      if (phase < PHASES.length - 1) {
        phase++;
        setActivePhase(phase);
        timerRef.current = setTimeout(advancePhase, 800);
      }
    };
    timerRef.current = setTimeout(advancePhase, 600);

    try {
      const res = await fetch('/api/colibri/orchestrate', { method: 'POST' });
      const data: CycleResult = await res.json();

      if (data.success) {
        setLastResult(data);
        setCycleNumber(data.cycle.cycleNumber + 1);
        // Reload state after cycle
        setTimeout(loadState, 500);
      } else {
        setError(data.error || 'Falha no ciclo');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro na execução');
    } finally {
      setActivePhase(PHASES.length - 1);
      setTimeout(() => {
        setActivePhase(-1);
        setIsRunning(false);
        setIsLoading(false);
      }, 800);
    }
  }, [isRunning, isLoading, loadState]);

  // Derived health values from wisdom state
  const wisdom = state?.wisdom;
  const health = {
    coherence: wisdom ? Math.min(100, 50 + wisdom.avgHealingSuccessRate * 50) : 60,
    fidelity: wisdom ? Math.min(100, 40 + wisdom.bestHealingSuccessRate * 60) : 55,
    wisdom: wisdom ? Math.min(100, wisdom.wisdomScore * 100) : 10,
    healing: wisdom ? Math.min(100, wisdom.avgHealingSuccessRate * 100) : 50,
  };

  return (
    <div className="space-y-5">
      {/* Controls */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Flame className="w-4 h-4 text-orange-400" />
          <span className="text-sm font-bold text-zinc-200">Orquestração Real</span>
          <Badge className={cn("text-[10px]", isRunning ? "bg-orange-500/15 text-orange-400 border-orange-500/30" : "bg-zinc-800 text-zinc-400 border-zinc-700")}>
            {isRunning ? `Ciclo #${cycleNumber - 1} executando...` : `Pronto #${cycleNumber}`}
          </Badge>
          {wisdom && (
            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">
              <Sparkles className="w-2.5 h-2.5 mr-1" /> Wisd. {(wisdom.wisdomScore * 100).toFixed(0)}%
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2">
          {!isRunning ? (
            <Button size="sm" className="h-8 text-[11px] bg-orange-600 hover:bg-orange-500 text-white" onClick={runCycle}>
              <Play className="w-3 h-3 mr-1" /> Executar Ciclo Real
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <LoaderCircle className="w-4 h-4 text-orange-400 animate-spin" />
              <span className="text-[11px] text-orange-400">Executando Self-Healing + Wisdom...</span>
            </div>
          )}
          <Button size="sm" variant="ghost" className="h-8 text-[11px] text-zinc-500 hover:text-zinc-300" onClick={loadState}>
            <RefreshCw className="w-3 h-3 mr-1" />
          </Button>
        </div>
      </div>

      {/* Phase Pipeline */}
      <PhasePipeline activePhase={activePhase >= 0 ? activePhase : (isRunning ? 0 : -1)} cycleNumber={cycleNumber - 1} />

      {/* Error */}
      {error && (
        <Card className="border-red-500/30 bg-red-500/5">
          <CardContent className="py-3 flex items-center gap-2">
            <XCircle className="w-4 h-4 text-red-400" />
            <span className="text-[11px] text-red-300">{error}</span>
          </CardContent>
        </Card>
      )}

      {/* Last Cycle Result */}
      {lastResult && (
        <Card className="border-emerald-500/20 bg-emerald-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5" /> Ciclo #{lastResult.cycle.cycleNumber} Completo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Duração', value: `${lastResult.cycle.duration}ms`, color: 'text-zinc-200' },
                { label: 'Anomalias', value: `${lastResult.cycle.anomalies} (${lastResult.cycle.criticalAnomalies} críticas)`, color: lastResult.cycle.criticalAnomalies > 0 ? 'text-red-400' : 'text-zinc-200' },
                { label: 'Curadas', value: `${lastResult.cycle.healed} ações`, color: 'text-emerald-400' },
                { label: 'Sucesso', value: `${(lastResult.cycle.successRate * 100).toFixed(0)}%`, color: lastResult.cycle.successRate > 0.7 ? 'text-emerald-400' : 'text-amber-400' },
                { label: 'Novos Padrões', value: String(lastResult.cycle.newPatterns), color: 'text-purple-400' },
                { label: 'Novos Insights', value: String(lastResult.cycle.newInsights), color: 'text-cyan-400' },
                { label: 'Wisdom Score', value: `${(lastResult.wisdom.score * 100).toFixed(1)}%`, color: 'text-amber-400' },
                { label: 'Total Ciclos', value: String(lastResult.wisdom.totalCycles), color: 'text-zinc-300' },
              ].map(item => (
                <div key={item.label} className="bg-zinc-800/30 rounded-lg p-2.5">
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{item.label}</div>
                  <div className={cn("text-sm font-bold font-mono mt-0.5", item.color)}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Anomaly reports from cycle */}
            {lastResult.reports.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-700/30">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Anomalias Detectadas</div>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {lastResult.reports.map((r, i) => {
                    const sevCfg = SEVERITY_CONFIG[r.severity] || SEVERITY_CONFIG.info;
                    const SevIcon = sevCfg.icon;
                    return (
                      <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-zinc-800/20">
                        <SevIcon className={cn("w-3 h-3 flex-shrink-0", sevCfg.color)} />
                        <span className="font-bold text-zinc-300">{r.panelName}</span>
                        <span className="text-zinc-500">{r.type}</span>
                        <span className="text-zinc-600 ml-auto">{r.severity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Healing actions */}
            {lastResult.actions.length > 0 && (
              <div className="mt-3 pt-3 border-t border-zinc-700/30">
                <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mb-2">Ações de Cura</div>
                <div className="space-y-1 max-h-[150px] overflow-y-auto">
                  {lastResult.actions.map((a, i) => {
                    const resCfg = RESULT_CONFIG[a.result] || RESULT_CONFIG.pending;
                    const ResIcon = resCfg.icon;
                    return (
                      <div key={i} className="flex items-center gap-2 text-[10px] p-1.5 rounded bg-zinc-800/20">
                        <ResIcon className={cn("w-3 h-3 flex-shrink-0", resCfg.color)} />
                        <span className="font-bold text-zinc-300">{a.panelId}</span>
                        <span className="text-zinc-500">→ {a.skill}</span>
                        <Badge className={cn("text-[9px] ml-auto", a.result === 'success' ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-amber-500/15 text-amber-400 border-amber-500/20")}>
                          {a.result}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Health Gauges + Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> Saúde do Ecossistema
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around">
              <HealthGauge value={health.coherence} label="Coerência" color="#4ed6a5" />
              <HealthGauge value={health.fidelity} label="Fidelidade" color="#5a9bd8" />
              <HealthGauge value={health.wisdom} label="Sabedoria" color="#a855f7" />
              <HealthGauge value={health.healing} label="Cura" color="#f97316" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <BarChart3 className="w-3.5 h-3.5 text-amber-400" /> Estatísticas Acumuladas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Ciclos', value: wisdom?.totalCyclesProcessed ?? state?.cycles?.length ?? 0, icon: History, color: 'text-amber-400' },
                { label: 'Anomalias', value: wisdom?.totalAnomaliesObserved ?? state?.healingEvents?.length ?? 0, icon: AlertTriangle, color: 'text-red-400' },
                { label: 'Curas', value: wisdom?.totalHealingActions ?? 0, icon: HeartPulse, color: 'text-emerald-400' },
                { label: 'Padrões', value: wisdom?.patternsCount ?? state?.patterns?.length ?? 0, icon: Target, color: 'text-purple-400' },
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

      {/* Healing History + Wisdom Memory */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Healing Log from DB */}
        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <HeartPulse className="w-3.5 h-3.5 text-emerald-400" /> Log de Auto-Cura (Persistido)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
              {state?.healingEvents && state.healingEvents.length > 0 ? state.healingEvents.map(entry => {
                const sevCfg = SEVERITY_CONFIG[entry.severity] || SEVERITY_CONFIG.info;
                const resCfg = RESULT_CONFIG[entry.result] || RESULT_CONFIG.pending;
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
              }) : (
                <p className="text-[11px] text-zinc-600 text-center py-6">Execute um ciclo para gerar dados de cura reais.</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Wisdom Memory */}
        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <BrainCircuit className="w-3.5 h-3.5 text-purple-400" /> Memória de Sabedoria
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {state?.patterns && state.patterns.length > 0 ? state.patterns.map((pat, i) => (
                <div key={i} className="p-2.5 rounded-lg bg-zinc-800/20 border border-zinc-700/15 hover:border-zinc-700/30 transition-colors">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-bold text-zinc-200 truncate max-w-[200px]">{pat.pattern}</span>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <Badge className="bg-purple-500/10 text-purple-400 border-purple-500/20 text-[9px]">
                        freq: {pat.frequency}
                      </Badge>
                      <Badge className="bg-cyan-500/10 text-cyan-400 border-cyan-500/20 text-[9px]">
                        {(pat.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                  </div>
                  {pat.rootCauseHypothesis && (
                    <p className="text-[9px] text-zinc-500 leading-relaxed mt-1 line-clamp-2">{pat.rootCauseHypothesis}</p>
                  )}
                  {pat.recommendedPrevention && (
                    <div className="mt-1.5 flex items-start gap-1.5">
                      <Lightbulb className="w-3 h-3 text-amber-400 flex-shrink-0 mt-0.5" />
                      <span className="text-[9px] text-amber-400/80 leading-relaxed">{pat.recommendedPrevention}</span>
                    </div>
                  )}
                  <div className="mt-1.5 h-1 rounded-full bg-zinc-800 overflow-hidden">
                    <div className="h-full rounded-full bg-purple-500/60 transition-all" style={{ width: `${Math.min(pat.confidence * 100, 100)}%` }} />
                  </div>
                </div>
              )) : (
                <p className="text-[11px] text-zinc-600 text-center py-6">Execute ciclos para acumular padrões de sabedoria.</p>
              )}

              {/* Insights section */}
              {state?.insights && state.insights.length > 0 && (
                <div className="mt-3 pt-3 border-t border-zinc-700/30">
                  <div className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" /> Insights
                  </div>
                  {state.insights.slice(0, 3).map((ins, i) => (
                    <div key={i} className="p-2 rounded-lg bg-cyan-500/5 border border-cyan-500/10 mb-1.5">
                      <div className="text-[10px] font-bold text-cyan-300">{ins.title}</div>
                      <div className="text-[9px] text-zinc-500 mt-0.5 line-clamp-1">{ins.description}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cycle History Table */}
      {state?.cycles && state.cycles.length > 0 && (
        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <History className="w-3.5 h-3.5 text-blue-400" /> Histórico de Ciclos (Persistido no DB)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="border-b border-zinc-800/40">
                    <th className="text-left py-2 px-2 text-zinc-500 font-bold uppercase">#</th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-bold uppercase">Status</th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-bold uppercase">Duração</th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-bold uppercase">Anomalias</th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-bold uppercase">Curadas</th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-bold uppercase">Wisdom</th>
                    <th className="text-left py-2 px-2 text-zinc-500 font-bold uppercase">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {state.cycles.map(cycle => (
                    <tr key={cycle.id} className="border-b border-zinc-800/20 hover:bg-zinc-800/20">
                      <td className="py-2 px-2 font-mono font-bold text-zinc-300">{cycle.cycleNumber}</td>
                      <td className="py-2 px-2">
                        <Badge className={cn("text-[9px]",
                          cycle.status === 'completed' ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/20" : "bg-red-500/15 text-red-400 border-red-500/20"
                        )}>
                          {cycle.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-2 font-mono text-zinc-400">{cycle.duration}ms</td>
                      <td className="py-2 px-2 font-mono text-zinc-400">{cycle.anomalies}</td>
                      <td className="py-2 px-2 font-mono text-emerald-400">{cycle.healed}</td>
                      <td className="py-2 px-2 font-mono text-purple-400">+{(cycle.wisdomGain * 100).toFixed(1)}%</td>
                      <td className="py-2 px-2 text-zinc-600">{new Date(cycle.createdAt).toLocaleTimeString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}