'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import {
  Zap, Activity, BrainCircuit, BookOpen, Layers, ShieldCheck,
  Radio, Server, Network, CircleDot, Sparkles, Loader2,
  RefreshCw, ChevronDown, ChevronRight, CheckCircle2,
  XCircle, AlertTriangle, Wave, Timer, TrendingUp,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

/* ================================================================
   TYPES
   ================================================================ */
interface PanelQuantumState {
  coherence: number; entanglement: number; superposition: number;
  decoherence: number; fidelity: number; evolution: number; timestamp: string;
}
interface PanelData {
  id: string; name: string; color: string; category: string; quantumState: PanelQuantumState;
}

interface ActivityEvent {
  type: string;
  timestamp: string;
  panelId?: string;
  panelName?: string;
  [key: string]: unknown;
}

/* ================================================================
   ANIMATED GAUGE
   ================================================================ */
function QuantumGauge({ value, label, color, size = 'sm' }: { value: number; label: string; color: string; size?: 'sm' | 'md' }) {
  const pct = Math.round(value * 100);
  const r = size === 'sm' ? 16 : 24;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value * circ);
  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={r * 2 + 4} height={r * 2 + 4} className="-rotate-90">
        <circle cx={r + 2} cy={r + 2} r={r} fill="none" stroke="#27272a" strokeWidth="3" />
        <motion.circle
          cx={r + 2} cy={r + 2} r={r} fill="none" stroke={color} strokeWidth="3"
          strokeLinecap="round"
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: 'easeOut' }}
          strokeDasharray={circ}
        />
      </svg>
      <motion.span
        className="text-[10px] font-mono font-bold"
        style={{ color }}
        key={pct}
        initial={{ scale: 1.2 }}
        animate={{ scale: 1 }}
      >
        {pct}%
      </motion.span>
      <span className="text-[8px] text-zinc-600 uppercase tracking-wider">{label}</span>
    </div>
  );
}

/* ================================================================
   PANEL CARD — Enhanced with invoke button and animations
   ================================================================ */
const PANEL_ICONS: Record<string, React.ElementType> = {
  moltbook: BookOpen, cerebro: BrainCircuit, cofre: ShieldCheck,
  mythos: Sparkles, fable_5: Layers, wormhole: Radio, blackhole: CircleDot,
};

function PanelCard({ panel, onInvoke, isInvoking }: { panel: PanelData; onInvoke: (id: string) => void; isInvoking: boolean }) {
  const qs = panel.quantumState;
  const healthScore = Math.round((qs.coherence * 0.3 + qs.fidelity * 0.3 + (1 - qs.decoherence) * 0.2 + qs.entanglement * 0.2) * 100);
  const healthColor = healthScore > 80 ? 'text-emerald-400' : healthScore > 50 ? 'text-amber-400' : 'text-red-400';
  const healthBg = healthScore > 80 ? 'bg-emerald-500/10 border-emerald-500/20' : healthScore > 50 ? 'bg-amber-500/10 border-amber-500/20' : 'bg-red-500/10 border-red-500/20';
  const Icon = PANEL_ICONS[panel.id] || Activity;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      whileHover={{ y: -2, borderColor: 'rgba(63,63,70,1)' }}
      transition={{ duration: 0.4 }}
    >
      <Card className="bg-zinc-900/80 border-zinc-800/80 gap-0 overflow-hidden hover:border-zinc-700 transition-all group h-full">
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <motion.div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: panel.color + '15', border: `1px solid ${panel.color}30` }}
                whileHover={{ rotate: 8, scale: 1.1 }}
              >
                <Icon className="w-4 h-4" style={{ color: panel.color }} />
              </motion.div>
              <div>
                <h4 className="text-sm font-bold text-zinc-100">{panel.name}</h4>
                <span className="text-[9px] text-zinc-600 uppercase tracking-wider">{panel.category}</span>
              </div>
            </div>
            <motion.div
              className={`px-2 py-1 rounded-lg border text-xs font-bold ${healthBg} ${healthColor}`}
              key={healthScore}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
            >
              {healthScore}%
            </motion.div>
          </div>

          {/* Quantum Metrics Grid */}
          <div className="grid grid-cols-5 gap-2 mt-3">
            <QuantumGauge value={qs.coherence} label="Coherence" color="#10b981" />
            <QuantumGauge value={qs.entanglement} label="Entangle" color="#a855f7" />
            <QuantumGauge value={qs.superposition} label="Superpos" color="#0ea5e9" />
            <QuantumGauge value={1 - qs.decoherence} label="Stability" color="#f59e0b" />
            <QuantumGauge value={qs.fidelity} label="Fidelity" color="#ec4899" />
          </div>

          {/* Evolution Bar */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-[9px] text-zinc-600 w-16">Gen {qs.evolution}</span>
            <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: panel.color }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, qs.evolution * 2)}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
              />
            </div>
            <span className="text-[9px] text-zinc-600 font-mono">{qs.evolution}x</span>
          </div>

          {/* Invoke Button */}
          <motion.div className="mt-3" whileTap={{ scale: 0.97 }}>
            <Button
              onClick={() => onInvoke(panel.id)}
              disabled={isInvoking}
              size="sm"
              variant="outline"
              className="w-full border-zinc-700 hover:border-emerald-500/30 hover:bg-emerald-500/5 hover:text-emerald-400 text-zinc-400 text-[11px] h-8 gap-1.5 transition-all"
            >
              {isInvoking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
              Invocar Agente
            </Button>
          </motion.div>
        </div>

        {/* Bottom accent line */}
        <motion.div
          className="h-0.5"
          style={{ background: `linear-gradient(90deg, transparent, ${panel.color}, transparent)` }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        />
      </Card>
    </motion.div>
  );
}

/* ================================================================
   ECOSYSTEM HEALTH BAR
   ================================================================ */
function EcosystemHealthBar({ health }: { health: NonNullable<ReturnType<typeof useEcosystemHealth>> }) {
  const score = health.healthScore;
  const scoreColor = score > 0.8 ? 'text-emerald-400' : score > 0.6 ? 'text-amber-400' : 'text-red-400';
  const scoreBg = score > 0.8 ? 'from-emerald-500/20 to-emerald-500/5 border-emerald-500/20' :
                   score > 0.6 ? 'from-amber-500/20 to-amber-500/5 border-amber-500/20' :
                   'from-red-500/20 to-red-500/5 border-red-500/20';

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className={`bg-gradient-to-r ${scoreBg} border gap-0 overflow-hidden`}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              >
                <Activity className="w-5 h-5 text-emerald-400" />
              </motion.div>
              <div>
                <h3 className="text-sm font-bold text-zinc-100">Ecosystem Health</h3>
                <p className="text-[10px] text-zinc-500">Saude global dos 7 nucleos quanticos</p>
              </div>
            </div>
            <motion.div
              className={`text-3xl font-bold ${scoreColor} tabular-nums`}
              key={score}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
            >
              {Math.round(score * 100)}%
            </motion.div>
          </div>

          {/* Health Bar */}
          <div className="h-2 bg-zinc-800/60 rounded-full overflow-hidden mb-3">
            <motion.div
              className={`h-full rounded-full ${score > 0.8 ? 'bg-emerald-500' : score > 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
              initial={{ width: 0 }}
              animate={{ width: `${score * 100}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </div>

          {/* Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {health.panelHealth?.map((p, i) => (
              <motion.div
                key={p.id}
                className="flex items-center gap-2"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.06 }}
              >
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                <div className="flex-1 min-w-0">
                  <div className="text-[9px] text-zinc-500 truncate">{p.name}</div>
                  <div className={`text-xs font-bold tabular-nums ${p.healthScore > 0.7 ? 'text-emerald-400' : p.healthScore > 0.5 ? 'text-amber-400' : 'text-red-400'}`}>
                    {Math.round(p.healthScore * 100)}%
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Stats Row */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-zinc-800/40 text-[10px] text-zinc-500 flex-wrap">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-400" />Fidelity: {(health.avgFidelity * 100).toFixed(1)}%</span>
            <span className="flex items-center gap-1"><Network className="w-3 h-3 text-cyan-400" />Coerencia: {(health.crossPanelCoherence * 100).toFixed(1)}%</span>
            <span className="flex items-center gap-1"><Activity className="w-3 h-3 text-emerald-400" />Ativos: {health.activePanels}/{health.totalPanels}</span>
            <span className="flex items-center gap-1"><Timer className="w-3 h-3 text-amber-400" />Geracao: {health.maxEvolution}</span>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

/* ================================================================
   ACTIVITY FEED
   ================================================================ */
function ActivityFeed({ events }: { events: ActivityEvent[] }) {
  const formatTime = (iso: string) => {
    const diff = Date.now() - new Date(iso).getTime();
    const secs = Math.floor(diff / 1000);
    if (secs < 5) return 'agora';
    if (secs < 60) return `${secs}s`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m`;
    return `${Math.floor(mins / 60)}h`;
  };

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'bulk_invocation': return <Zap className="w-3 h-3 text-purple-400" />;
      case 'agent_invocation': return <Sparkles className="w-3 h-3 text-emerald-400" />;
      case 'smoke_test': return <ShieldCheck className="w-3 h-3 text-amber-400" />;
      default: return <Activity className="w-3 h-3 text-zinc-500" />;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'bulk_invocation': return 'border-purple-500/20 bg-purple-500/5';
      case 'agent_invocation': return 'border-emerald-500/20 bg-emerald-500/5';
      case 'smoke_test': return 'border-amber-500/20 bg-amber-500/5';
      default: return 'border-zinc-800 bg-zinc-800/30';
    }
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-rose-400" />Activity Feed
        </CardTitle>
        <CardDescription className="text-[10px] text-zinc-500">Eventos em tempo real do processamento exponencial</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-64">
          {events.length > 0 ? (
            <div className="space-y-1.5 pr-2">
              {[...events].reverse().map((event, i) => (
                <motion.div
                  key={`${event.timestamp}-${i}`}
                  className={`flex items-start gap-2.5 p-2 rounded-lg border text-[10px] ${getEventColor(event.type)}`}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  layout
                >
                  <div className="mt-0.5">{getEventIcon(event.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-zinc-300">
                      {event.type === 'bulk_invocation' && (
                        <>Invocacao em massa — <span className="text-zinc-500">{event.panelsProcessed} paineis</span></>
                      )}
                      {event.type === 'agent_invocation' && (
                        <>Agente <span className="font-medium">{event.panelName}</span> invocado — <span className="text-zinc-500">{event.skillsPassed}/{event.skillsTotal} skills</span></>
                      )}
                      {event.type === 'smoke_test' && (
                        <>Smoke Test — <span className={event.passed ? 'text-emerald-400' : 'text-red-400'}>{event.passed ? 'PASSED' : 'FAILED'}</span></>
                      )}
                    </div>
                    <div className="text-zinc-600 mt-0.5 flex items-center gap-2">
                      <span>{formatTime(String(event.timestamp))}</span>
                      {event.avgFidelity !== undefined && <span>F: {(Number(event.avgFidelity) * 100).toFixed(0)}%</span>}
                      {event.latencyMs !== undefined && <span>{event.latencyMs}ms</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <Activity className="w-8 h-8 text-zinc-700 mb-2" />
              <p className="text-xs text-zinc-600">Nenhum evento ainda. Clique &quot;Invocar Ciclo&quot; para iniciar.</p>
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   HOOKS
   ================================================================ */
function useEcosystemHealth() {
  const { data, isLoading } = trpc.invocation.ecosystemHealth.useQuery(undefined, {
    staleTime: 5 * 1000,
    refetchInterval: 8 * 1000,
  });
  return {
    ...data,
    isLoading,
    healthScore: data?.healthScore ?? 0,
    avgFidelity: data?.avgFidelity ?? 0,
    crossPanelCoherence: data?.crossPanelCoherence ?? 0,
    activePanels: data?.activePanels ?? 0,
    totalPanels: data?.totalPanels ?? 7,
    maxEvolution: data?.maxEvolution ?? 0,
    panelHealth: data?.panelHealth ?? [],
  };
}

/* ================================================================
   INVOCATION TAB — MAIN
   ================================================================ */
export function InvocationTab() {
  const [invokingAgent, setInvokingAgent] = useState<string | null>(null);

  // tRPC queries
  const { data: panelData, isLoading: panelsLoading, refetch: refetchPanels } = trpc.invocation.panelStates.useQuery(undefined, {
    staleTime: 5 * 1000,
    refetchInterval: 10 * 1000,
  });

  const { data: loopStatus, refetch: refetchLoop } = trpc.invocation.loopStatus.useQuery(undefined, {
    staleTime: 3 * 1000,
    refetchInterval: 5 * 1000,
  });

  const { data: activityData, refetch: refetchActivity } = trpc.invocation.activityFeed.useQuery(undefined, {
    staleTime: 3 * 1000,
    refetchInterval: 5 * 1000,
  });

  const ecosystemHealth = useEcosystemHealth();

  const invokeMutation = trpc.invocation.invoke.useMutation({
    onSuccess: (data) => {
      refetchPanels(); refetchLoop(); refetchActivity();
      toast.success('Ciclo invocado com sucesso', {
        description: `${data.results?.length ?? 0} paineis processados | Fidelity: ${data.overallFidelity} | Coerencia: ${data.crossPanelCoherence}`,
        duration: 5000,
      });
    },
    onError: () => toast.error('Erro na invocacao', { description: 'Tente novamente.' }),
  });

  const invokeAgentMutation = trpc.invocation.invokeAgent.useMutation({
    onMutate: (vars) => { setInvokingAgent(vars.panelId); },
    onSettled: () => { setInvokingAgent(null); },
    onSuccess: (data) => {
      refetchPanels(); refetchActivity();
      toast.success(`${data.panel.name} invocado`, {
        description: `Skills: ${data.skillsPassed}/${data.skillsTotal} | Fidelity: ${(data.quantumState.fidelity * 100).toFixed(1)}% | ${data.latencyMs}ms`,
        duration: 4000,
      });
    },
    onError: () => toast.error('Erro na invocacao do agente'),
  });

  const startLoopMutation = trpc.invocation.startPerpetualLoop.useMutation({
    onSuccess: (data) => {
      refetchPanels(); refetchLoop(); refetchActivity();
      toast.success('Loop Perpetuo iniciado', {
        description: data.message,
        duration: 6000,
      });
    },
    onError: () => toast.error('Erro ao iniciar loop'),
  });

  const stopLoopMutation = trpc.invocation.stopPerpetualLoop.useMutation({
    onSuccess: () => {
      refetchLoop();
      toast.info('Loop parado', { description: 'O loop perpetuo foi interrompido.' });
    },
    onError: () => toast.error('Erro ao parar loop'),
  });

  const smokeMutation = trpc.invocation.smokeTest.useMutation({
    onSuccess: (data) => {
      refetchPanels(); refetchLoop(); refetchActivity();
      if (data.passed) {
        toast.success('SMOKE TEST PASSED', {
          description: `${data.panelsPassed}/${data.panels} pass | ${data.totalLatencyMs}ms | Fidelity: ${data.avgFidelity}`,
          duration: 6000,
        });
      } else {
        toast.warning('SMOKE TEST COM WARNINGS', {
          description: `${data.panelsPassed} pass, ${data.panelsWarning} warning, ${data.panelsFailed} failed | Fidelity: ${data.avgFidelity}`,
          duration: 8000,
        });
      }
    },
    onError: () => toast.error('Erro no smoke test'),
  });

  const panels: PanelData[] = panelData?.panels ?? [];
  const events: ActivityEvent[] = (activityData?.events ?? []) as ActivityEvent[];
  const loop = loopStatus?.loopStatus as Record<string, unknown> | null;
  const isLoopRunning = loop?.running === true;
  const loopIteration = typeof loop?.iteration === 'number' ? loop.iteration : 0;

  if (panelsLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Skeleton key={i} className="h-72 bg-zinc-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* ─── ECOSYSTEM HEALTH BAR ─── */}
      {!ecosystemHealth.isLoading && <EcosystemHealthBar health={ecosystemHealth} />}

      {/* ─── CONTROL BAR ─── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        <Card className="bg-zinc-900/80 border-zinc-800/80 gap-0">
          <div className="p-4 flex flex-wrap items-center gap-3">
            {/* Loop Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${isLoopRunning ? 'bg-emerald-400' : 'bg-zinc-600'}`}>
                {isLoopRunning && (
                  <motion.div
                    className="w-2.5 h-2.5 rounded-full bg-emerald-400 absolute"
                    animate={{ scale: [1, 1.8, 1], opacity: [1, 0, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                )}
              </div>
              <span className="text-xs text-zinc-300 font-medium">
                {isLoopRunning ? `Loop Ativo — Iteracao ${loopIteration}` : 'Loop Parado'}
              </span>
              {loop?.lastPulse && (
                <span className="text-[10px] text-zinc-600">
                  Ultimo pulso: {new Date(String(loop.lastPulse)).toLocaleTimeString('pt-BR')}
                </span>
              )}
            </div>

            <div className="flex-1" />

            {/* Action Buttons */}
            <motion.div whileTap={{ scale: 0.97 }} className="inline-flex">
              <Button
                onClick={() => invokeMutation.mutate()}
                disabled={invokeMutation.isPending}
                size="sm"
                className="bg-purple-600 hover:bg-purple-500 text-white gap-2 text-xs h-8"
              >
                {invokeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />}
                Invocar Ciclo
              </Button>
            </motion.div>

            <motion.div whileTap={{ scale: 0.97 }} className="inline-flex">
              {!isLoopRunning ? (
                <Button
                  onClick={() => startLoopMutation.mutate({ intervalMs: 10000, maxIterations: 50 })}
                  disabled={startLoopMutation.isPending}
                  size="sm"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white gap-2 text-xs h-8"
                >
                  {startLoopMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
                  Iniciar Loop
                </Button>
              ) : (
                <Button
                  onClick={() => stopLoopMutation.mutate()}
                  disabled={stopLoopMutation.isPending}
                  size="sm"
                  className="bg-red-600 hover:bg-red-500 text-white gap-2 text-xs h-8"
                >
                  <CircleDot className="w-3.5 h-3.5" />
                  Parar Loop
                </Button>
              )}
            </motion.div>

            <motion.div whileTap={{ scale: 0.97 }} className="inline-flex">
              <Button
                onClick={() => smokeMutation.mutate()}
                disabled={smokeMutation.isPending}
                size="sm"
                variant="outline"
                className="border-amber-500/30 text-amber-400 hover:bg-amber-500/10 gap-2 text-xs h-8"
              >
                {smokeMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                Smoke Test
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* ─── 7 QUANTUM PANELS GRID ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {panels.map((panel, i) => (
          <PanelCard
            key={panel.id}
            panel={panel}
            onInvoke={(id) => invokeAgentMutation.mutate({ panelId: id })}
            isInvoking={invokingAgent === panel.id}
          />
        ))}
      </div>

      {/* ─── BOTTOM ROW: Correlation + Activity Feed ─── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cross-Panel Correlation Matrix */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3 h-full">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
                <Network className="w-4 h-4 text-cyan-400" />Matriz de Correlacao
              </CardTitle>
              <CardDescription className="text-[10px] text-zinc-500">Cross-panel quantum coherence</CardDescription>
            </CardHeader>
            <CardContent>
              {panels.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-[10px]">
                    <thead>
                      <tr>
                        <th className="text-left text-zinc-600 pb-2 pr-3 font-medium">Nucleo</th>
                        <th className="text-right text-zinc-600 pb-2 px-2 font-medium">Coh</th>
                        <th className="text-right text-zinc-600 pb-2 px-2 font-medium">Ent</th>
                        <th className="text-right text-zinc-600 pb-2 px-2 font-medium">Sup</th>
                        <th className="text-right text-zinc-600 pb-2 px-2 font-medium">Stab</th>
                        <th className="text-right text-zinc-600 pb-2 pl-3 font-medium">Fid</th>
                      </tr>
                    </thead>
                    <tbody>
                      {panels.map((p) => (
                        <motion.tr
                          key={p.id}
                          className="border-t border-zinc-800/40 hover:bg-zinc-800/20 transition-colors"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                        >
                          <td className="py-2 pr-3">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color }} />
                              <span className="text-zinc-300 font-medium">{p.name}</span>
                            </div>
                          </td>
                          <td className="text-right py-2 px-2 font-mono text-emerald-400">{(p.quantumState.coherence * 100).toFixed(1)}%</td>
                          <td className="text-right py-2 px-2 font-mono text-purple-400">{(p.quantumState.entanglement * 100).toFixed(1)}%</td>
                          <td className="text-right py-2 px-2 font-mono text-sky-400">{(p.quantumState.superposition * 100).toFixed(1)}%</td>
                          <td className="text-right py-2 px-2 font-mono text-amber-400">{((1 - p.quantumState.decoherence) * 100).toFixed(1)}%</td>
                          <td className="text-right py-2 pl-3 font-mono text-pink-400">{(p.quantumState.fidelity * 100).toFixed(1)}%</td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-xs text-zinc-600">Clique &quot;Invocar Ciclo&quot; para inicializar.</p>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Activity Feed */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <ActivityFeed events={events} />
        </motion.div>
      </div>
    </motion.div>
  );
}