'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Zap, Brain, HeartPulse, Sparkles, Shield, Activity,
  Play, Square, RotateCw, ChevronDown, ChevronRight,
  CheckCircle2, XCircle, AlertTriangle, TrendingUp,
  BookOpen, Target, Cpu, Network, Eye, Lightbulb,
  Wrench, ArrowRight, Clock, Gauge, Layers, Bot,
  Flame, Infinity, Timer, Database,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

/* ═══════════════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════════════ */
interface EcosystemHealth {
  avgFidelity: number;
  avgCoherence: number;
  avgDecoherence: number;
  crossPanelCoherence: number;
  overallHealth: number;
}

interface WisdomGained {
  newPatterns: number;
  newInsights: number;
  wisdomScoreBefore: number;
  wisdomScoreAfter: number;
}

interface AnomalyReport {
  panelId: string;
  panelName: string;
  type: string;
  severity: string;
  value: number;
  diagnosis: string;
  prescribedSkills: string[];
  healingAction: string;
}

interface HealingAction {
  panelId: string;
  skill: string;
  action: string;
  result: string;
  deltaApplied: Record<string, number>;
  appliedAt: string;
}

/* ═══════════════════════════════════════════════════════════════
   CONSTANTS
   ═══════════════════════════════════════════════════════════════ */
const PHASE_ICONS = [
  { icon: Zap, label: 'INVOKE', color: 'text-amber-400' },
  { icon: Eye, label: 'DETECT', color: 'text-red-400' },
  { icon: HeartPulse, label: 'HEAL', color: 'text-emerald-400' },
  { icon: Brain, label: 'LEARN', color: 'text-purple-400' },
  { icon: Target, label: 'DIRECT', color: 'text-cyan-400' },
  { icon: Database, label: 'PERSIST', color: 'text-blue-400' },
];

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-500/20 text-red-400 border-red-500/30',
  warning: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  info: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

const RESULT_COLORS: Record<string, string> = {
  success: 'text-emerald-400',
  partial: 'text-amber-400',
  failed: 'text-red-400',
};

/* ═══════════════════════════════════════════════════════════════
   HEALTH GAUGE (Compact)
   ═══════════════════════════════════════════════════════════════ */
function HealthGauge({ value, label, color = 'text-emerald-400', size = 56 }: {
  value: number; label: string; color?: string; size?: number;
}) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - value);

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#27272a" strokeWidth={3} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={value > 0.7 ? '#10b981' : value > 0.4 ? '#f59e0b' : '#ef4444'}
            strokeWidth={3} strokeLinecap="round"
            strokeDasharray={circ} strokeDashoffset={offset}
            className="transition-all duration-700"
          />
        </svg>
        <span className={`absolute inset-0 flex items-center justify-center text-[10px] font-bold ${color}`}>
          {(value * 100).toFixed(0)}
        </span>
      </div>
      <span className="text-[9px] text-zinc-500 font-medium">{label}</span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   PHASE PIPELINE VISUALIZATION
   ═══════════════════════════════════════════════════════════════ */
function PhasePipeline({ activePhase, durationMs }: { activePhase: number; durationMs: number }) {
  return (
    <div className="flex items-center gap-1 py-3 px-2">
      {PHASE_ICONS.map((phase, i) => {
        const PhaseIcon = phase.icon;
        const isActive = i === activePhase;
        const isCompleted = i < activePhase;
        const isPending = i > activePhase;

        return (
          <div key={phase.label} className="flex items-center gap-1">
            <motion.div
              className={`w-8 h-8 rounded-lg flex items-center justify-center border transition-all duration-300
                ${isActive
                  ? 'bg-zinc-800 border-zinc-600 shadow-lg shadow-zinc-500/10'
                  : isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30'
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              animate={isActive ? { scale: [1, 1.08, 1] } : {}}
              transition={isActive ? { duration: 1.2, repeat: Infinity } : {}}
            >
              <PhaseIcon className={`w-3.5 h-3.5 ${isActive ? phase.color : isCompleted ? 'text-emerald-400' : 'text-zinc-600'}`} />
            </motion.div>
            {i < PHASE_ICONS.length - 1 && (
              <div className={`w-4 h-px ${isCompleted ? 'bg-emerald-500/50' : 'bg-zinc-800'}`} />
            )}
          </div>
        );
      })}
      <div className="ml-2 text-[9px] text-zinc-500">
        {durationMs > 0 ? `${durationMs}ms` : 'aguardando'}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export function OrchestrationTab() {
  const [activePhase, setActivePhase] = useState(-1);
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<Record<string, unknown> | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    health: true, wisdom: true, healing: false, skills: false, log: false,
  });

  const toggleSection = (key: string) => {
    setExpandedSections(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Queries
  const { data: status, refetch: refetchStatus, isLoading: statusLoading } = trpc.orchestration.status.useQuery(undefined, {
    refetchInterval: 5000, staleTime: 3000,
  });

  const { data: skillsRegistry } = trpc.orchestration.skillsRegistry.useQuery();

  // Mutations
  const executeCycle = trpc.orchestration.executeCycle.useMutation({
    onSuccess: (data) => {
      setLastResult(data as unknown as Record<string, unknown>);
      setActivePhase(-1);
      setIsExecuting(false);
      refetchStatus();
      toast.success(`Ciclo #${(data as unknown as Record<string, unknown>).cycleNumber} completo`, {
        description: `Auto-cura: ${(data as unknown as Record<string, unknown>).healingActionsExecuted} acoes | Sabedoria: +${(data as unknown as Record<string, unknown>).wisdomGained?.newInsights ?? 0} insights`,
      });
    },
    onError: (err) => {
      setIsExecuting(false);
      setActivePhase(-1);
      toast.error('Erro no ciclo de orquestracao', { description: err.message });
    },
  });

  const startLoop = trpc.orchestration.startLoop.useMutation({
    onSuccess: (data) => {
      refetchStatus();
      toast.success(data.message);
    },
    onError: (err) => toast.error('Erro ao iniciar loop', { description: err.message }),
  });

  const stopLoop = trpc.orchestration.stopLoop.useMutation({
    onSuccess: () => {
      refetchStatus();
      toast.success('Loop de orquestracao parado');
    },
  });

  const activateSkillMut = trpc.orchestration.activateSkill.useMutation({
    onSuccess: (data) => {
      refetchStatus();
      if (data.success) toast.success(data.message);
      else toast.error(data.message);
    },
    onError: (err) => toast.error('Erro ao ativar Skill', { description: err.message }),
  });

  // Execute with phase animation
  const handleExecuteCycle = useCallback(async () => {
    if (isExecuting) return;
    setIsExecuting(true);
    setActivePhase(0);

    // Animate phases
    for (let i = 0; i < PHASE_ICONS.length; i++) {
      await new Promise(r => setTimeout(r, 400));
      setActivePhase(i);
    }

    executeCycle.mutate();
  }, [isExecuting, executeCycle]);

  // Derived data
  const lastCycle = status?.lastCycle as Record<string, unknown> | null;
  const wisdom = status?.wisdomState as Record<string, unknown> | null;
  const healing = status?.lastHealingCycle as Record<string, unknown> | null;
  const history = (status?.history ?? []) as Array<Record<string, unknown>>;
  const isLoopRunning = (status?.lastCycle as Record<string, unknown> | null)
    ? false
    : false;

  const ecosystemHealth = (lastCycle?.ecosystemHealth ?? wisdom
    ? { avgFidelity: 0.5, avgCoherence: 0.5, avgDecoherence: 0.2, crossPanelCoherence: 0.6, overallHealth: 0.5 }
    : null) as EcosystemHealth | null;

  const wisdomGained = lastCycle?.wisdomGained as WisdomGained | null;

  return (
    <div className="space-y-4">
      {/* ═══ HEADER + CONTROLS ═══ */}
      <Card className="bg-zinc-900/50 border-zinc-800/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-emerald-500/20 to-purple-500/20 border border-emerald-500/20 flex items-center justify-center">
                  <Flame className="w-3.5 h-3.5 text-emerald-400" />
                </div>
                <h2 className="text-sm font-bold text-zinc-100">Protocolo Reativo Gerativo</h2>
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-[9px] bg-purple-500/5">
                  Auto-Cura + Auto-Sabedoria
                </Badge>
              </div>
              <p className="text-[10px] text-zinc-500 mt-1 ml-9">
                Orquestracao real via Skills e algoritmos. Loop exponencial autossuficiente com memoria persistente.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] h-7 px-3 gap-1.5"
                onClick={handleExecuteCycle}
                disabled={isExecuting}
              >
                {isExecuting ? <RotateCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                {isExecuting ? 'Executando...' : 'Executar Ciclo'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-400 text-[10px] h-7 px-3 gap-1.5 hover:bg-amber-500/10"
                onClick={() => startLoop.mutate({ intervalMs: 10000, maxCycles: 100 })}
              >
                <Infinity className="w-3 h-3" />
                Loop Perpetuo
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-red-500/30 text-red-400 text-[10px] h-7 px-3 gap-1.5 hover:bg-red-500/10"
                onClick={() => stopLoop.mutate()}
              >
                <Square className="w-3 h-3" />
                Parar
              </Button>
            </div>
          </div>

          {/* Phase Pipeline */}
          <PhasePipeline activePhase={activePhase} durationMs={lastCycle ? lastCycle.durationMs as number : 0} />
        </CardContent>
      </Card>

      {/* ═══ RESULT BANNER ═══ */}
      {lastResult && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className="bg-emerald-500/5 border-emerald-500/20">
              <CardContent className="p-3 flex items-center gap-3 text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <span className="text-emerald-400 font-medium">
                    Ciclo #{lastResult.cycleNumber} — {lastResult.durationMs}ms
                  </span>
                  <span className="text-zinc-500 ml-2">
                    Anomalias: {lastResult.anomaliesDetected} ({lastResult.anomaliesCritical} criticas)
                    &bull; Curas: {lastResult.healingActionsExecuted} ({(lastResult.healingSuccessRate as number * 100).toFixed(0)}% sucesso)
                    &bull; Insights: +{wisdomGained?.newInsights ?? 0}
                    &bull; Padroes: +{wisdomGained?.newPatterns ?? 0}
                  </span>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      )}

      {/* ═══ STATS GRID ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
        {/* Wisdom Score */}
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardContent className="p-3 text-center">
            <div className="text-[9px] text-zinc-500 font-medium mb-1 flex items-center justify-center gap-1">
              <Brain className="w-3 h-3 text-purple-400" /> Sabedoria
            </div>
            <div className="text-xl font-bold text-purple-400">
              {wisdom ? ((wisdom.wisdomScore as number) * 100).toFixed(1) : '0.0'}
            </div>
            <div className="text-[9px] text-zinc-600">
              {wisdom ? `${wisdom.totalCyclesProcessed} ciclos` : '—'}
            </div>
          </CardContent>
        </Card>

        {/* Overall Health */}
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardContent className="p-3 text-center">
            <div className="text-[9px] text-zinc-500 font-medium mb-1 flex items-center justify-center gap-1">
              <HeartPulse className="w-3 h-3 text-emerald-400" /> Saude
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {ecosystemHealth ? (ecosystemHealth.overallHealth * 100).toFixed(1) : '—'}
            </div>
            <div className="text-[9px] text-zinc-600">
              {ecosystemHealth ? `Fidelidade: ${(ecosystemHealth.avgFidelity * 100).toFixed(0)}%` : '—'}
            </div>
          </CardContent>
        </Card>

        {/* Healing Actions */}
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardContent className="p-3 text-center">
            <div className="text-[9px] text-zinc-500 font-medium mb-1 flex items-center justify-center gap-1">
              <Shield className="w-3 h-3 text-amber-400" /> Curas
            </div>
            <div className="text-xl font-bold text-amber-400">
              {wisdom ? String(wisdom.totalHealingActions ?? 0) : '0'}
            </div>
            <div className="text-[9px] text-zinc-600">
              {wisdom ? `Taxa: ${((wisdom.avgHealingSuccessRate as number) * 100).toFixed(0)}%` : '—'}
            </div>
          </CardContent>
        </Card>

        {/* Patterns */}
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardContent className="p-3 text-center">
            <div className="text-[9px] text-zinc-500 font-medium mb-1 flex items-center justify-center gap-1">
              <Layers className="w-3 h-3 text-cyan-400" /> Padroes
            </div>
            <div className="text-xl font-bold text-cyan-400">
              {wisdom ? String(wisdom.patternsCount ?? 0) : '0'}
            </div>
            <div className="text-[9px] text-zinc-600">
              {wisdom ? `${wisdom.insightsCount} insights` : '—'}
            </div>
          </CardContent>
        </Card>

        {/* Anomalies */}
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardContent className="p-3 text-center">
            <div className="text-[9px] text-zinc-500 font-medium mb-1 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3 text-red-400" /> Anomalias
            </div>
            <div className="text-xl font-bold text-red-400">
              {wisdom ? String(wisdom.totalAnomaliesObserved ?? 0) : '0'}
            </div>
            <div className="text-[9px] text-zinc-600">
              {healing ? `${healing.anomaliesCritical ?? 0} criticas` : '—'}
            </div>
          </CardContent>
        </Card>

        {/* Evolution */}
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardContent className="p-3 text-center">
            <div className="text-[9px] text-zinc-500 font-medium mb-1 flex items-center justify-center gap-1">
              <TrendingUp className="w-3 h-3 text-emerald-400" /> Evolucao
            </div>
            <div className="text-xl font-bold text-emerald-400">
              {wisdom ? String(wisdom.evolutionGeneration ?? 0) : '0'}
            </div>
            <div className="text-[9px] text-zinc-600">
              {wisdom ? `${wisdom.decisionsCount} decisoes` : '—'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══ ECOSYSTEM HEALTH GAUGES ═══ */}
      {ecosystemHealth && (
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardHeader className="p-3 pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
                Saude do Ecossistema
              </CardTitle>
              <Badge variant="outline" className={`text-[9px] ${
                ecosystemHealth.overallHealth > 0.7
                  ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/5'
                  : ecosystemHealth.overallHealth > 0.4
                    ? 'border-amber-500/30 text-amber-400 bg-amber-500/5'
                    : 'border-red-500/30 text-red-400 bg-red-500/5'
              }`}>
                {ecosystemHealth.overallHealth > 0.7 ? 'Saudavel' : ecosystemHealth.overallHealth > 0.4 ? 'Atencao' : 'Critico'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="p-3 pt-0">
            <div className="flex items-center justify-around">
              <HealthGauge value={ecosystemHealth.overallHealth} label="Geral" color="text-emerald-400" />
              <HealthGauge value={ecosystemHealth.avgFidelity} label="Fidelidade" color="text-amber-400" />
              <HealthGauge value={ecosystemHealth.avgCoherence} label="Coerencia" color="text-cyan-400" />
              <HealthGauge value={1 - ecosystemHealth.avgDecoherence} label="Anti-Entropia" color="text-purple-400" />
              <HealthGauge value={ecosystemHealth.crossPanelCoherence} label="Cross-Panel" color="text-blue-400" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* ═══ WISDOM PANEL ═══ */}
      {wisdom && (
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardHeader
            className="p-3 cursor-pointer select-none"
            onClick={() => toggleSection('wisdom')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-purple-400" />
                Memoria de Sabedoria
                <Badge variant="outline" className="border-purple-500/30 text-purple-400 text-[9px] bg-purple-500/5">
                  Score: {((wisdom.wisdomScore as number) * 100).toFixed(1)}%
                </Badge>
              </CardTitle>
              {expandedSections.wisdom ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.wisdom && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CardContent className="p-3 pt-0 space-y-3">
                  {/* Wisdom progress bar */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-zinc-400">Evolucao da Sabedoria</span>
                      <span className="text-purple-400 font-medium">{((wisdom.wisdomScore as number) * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(wisdom.wisdomScore as number) * 100}%` }}
                        transition={{ duration: 1, ease: 'easeOut' }}
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <div className="text-zinc-500">Ciclos</div>
                      <div className="text-zinc-200 font-bold">{String(wisdom.totalCyclesProcessed)}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <div className="text-zinc-500">Anomalias</div>
                      <div className="text-zinc-200 font-bold">{String(wisdom.totalAnomaliesObserved)}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <div className="text-zinc-500">Decisoes</div>
                      <div className="text-zinc-200 font-bold">{String(wisdom.decisionsCount)}</div>
                    </div>
                    <div className="bg-zinc-800/50 rounded-lg p-2">
                      <div className="text-zinc-500">Melhor Taxa</div>
                      <div className="text-emerald-400 font-bold">{((wisdom.bestHealingSuccessRate as number) * 100).toFixed(0)}%</div>
                    </div>
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* ═══ HEALING LOG ═══ */}
      {healing && (healing.reports as AnomalyReport[] | undefined)?.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardHeader
            className="p-3 cursor-pointer select-none"
            onClick={() => toggleSection('healing')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <HeartPulse className="w-3.5 h-3.5 text-emerald-400" />
                Log de Auto-Cura
                <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[9px] bg-emerald-500/5">
                  Ciclo #{String(healing.cycleNumber)}
                </Badge>
              </CardTitle>
              {expandedSections.healing ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.healing && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CardContent className="p-3 pt-0 space-y-2">
                  {(healing.reports as AnomalyReport[]).slice(0, 5).map((report, i) => (
                    <div key={i} className="bg-zinc-800/40 rounded-lg p-2.5 border border-zinc-800/50">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={`text-[8px] px-1.5 py-0 ${SEVERITY_COLORS[report.severity] ?? SEVERITY_COLORS.info}`}>
                              {report.severity}
                            </Badge>
                            <span className="text-[10px] text-zinc-300 font-medium">{report.panelName}</span>
                            <span className="text-[9px] text-zinc-600">{report.type.replace(/_/g, ' ')}</span>
                          </div>
                          <p className="text-[9px] text-zinc-500 leading-relaxed">{report.diagnosis}</p>
                          <div className="flex items-center gap-1 mt-1.5">
                            <Wrench className="w-2.5 h-2.5 text-amber-400" />
                            <span className="text-[9px] text-zinc-400">{report.healingAction}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-[10px] font-mono text-zinc-500">
                            {(report.value * 100).toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* ═══ ACTIVE SKILLS REGISTRY ═══ */}
      {skillsRegistry && skillsRegistry.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardHeader
            className="p-3 cursor-pointer select-none"
            onClick={() => toggleSection('skills')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-amber-400" />
                Registro de Skills Ativas
                <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[9px] bg-amber-500/5">
                  {skillsRegistry.length} Skills
                </Badge>
              </CardTitle>
              {expandedSections.skills ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.skills && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CardContent className="p-3 pt-0">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {skillsRegistry.map((skill) => (
                      <div
                        key={skill.id}
                        className="bg-zinc-800/40 rounded-lg p-2.5 border border-zinc-800/50 hover:border-amber-500/20 transition-colors group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded bg-amber-500/10 flex items-center justify-center">
                              <Zap className="w-3 h-3 text-amber-400" />
                            </div>
                            <div>
                              <div className="text-[10px] font-medium text-zinc-200">{skill.name}</div>
                              <div className="text-[9px] text-zinc-500 max-w-[200px] truncate">{skill.description}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {['moltbook', 'cerebro', 'cofre', 'mythos', 'fable_5', 'wormhole', 'blackhole'].slice(0, 3).map(panelId => (
                              <Tooltip key={panelId}>
                                <TooltipTrigger asChild>
                                  <button
                                    className="w-5 h-5 rounded bg-zinc-700/50 hover:bg-amber-500/20 flex items-center justify-center transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      activateSkillMut.mutate({ panelId, skillName: skill.id });
                                    }}
                                  >
                                    <Play className="w-2.5 h-2.5 text-zinc-400" />
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent className="text-[9px]">
                                  Ativar {skill.name} em {panelId}
                                </TooltipContent>
                              </Tooltip>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* ═══ ORCHESTRATION HISTORY ═══ */}
      {history.length > 0 && (
        <Card className="bg-zinc-900/50 border-zinc-800/60">
          <CardHeader
            className="p-3 cursor-pointer select-none"
            onClick={() => toggleSection('log')}
          >
            <div className="flex items-center justify-between">
              <CardTitle className="text-xs font-semibold text-zinc-200 flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                Historico de Orquestracao
                <Badge variant="outline" className="border-blue-500/30 text-blue-400 text-[9px] bg-blue-500/5">
                  {history.length} ciclos
                </Badge>
              </CardTitle>
              {expandedSections.log ? <ChevronDown className="w-3.5 h-3.5 text-zinc-500" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-500" />}
            </div>
          </CardHeader>
          <AnimatePresence>
            {expandedSections.log && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <CardContent className="p-3 pt-0">
                  <ScrollArea className="h-48">
                    <div className="space-y-1.5">
                      {history.map((entry, i) => {
                        const health = entry.ecosystemHealth as EcosystemHealth | undefined;
                        return (
                          <div key={i} className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-800/40 transition-colors">
                            <span className="text-[9px] text-zinc-600 font-mono w-16 flex-shrink-0">
                              #{String(entry.cycleNumber)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-zinc-300">
                                  {entry.anomaliesDetected} anom &bull; {entry.healingActionsExecuted} cura
                                </span>
                                {health && (
                                  <span className="text-[9px] font-mono text-zinc-500">
                                    HP: {(health.overallHealth * 100).toFixed(0)}%
                                  </span>
                                )}
                              </div>
                            </div>
                            <span className="text-[9px] text-zinc-600 flex-shrink-0">
                              {entry.durationMs}ms
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}

      {/* ═══ LOADING STATE ═══ */}
      {statusLoading && !lastCycle && (
        <div className="space-y-3">
          <Skeleton className="h-20 bg-zinc-800/50" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-20 bg-zinc-800/50" />
            <Skeleton className="h-20 bg-zinc-800/50" />
            <Skeleton className="h-20 bg-zinc-800/50" />
          </div>
          <Skeleton className="h-32 bg-zinc-800/50" />
        </div>
      )}
    </div>
  );
}