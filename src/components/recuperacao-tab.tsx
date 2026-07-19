'use client';

import { useState, useEffect, useCallback } from 'react';
import { Dna, Activity, Heart, Zap, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Clock, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface HealingCycle {
  id: string;
  cycleNumber: number;
  anomaliesDetected: number;
  anomaliesCritical: number;
  healingActionsExecuted: number;
  healingSuccessRate: number;
  durationMs: number;
  timestamp: string;
}

const METRIC_LABELS: Record<string, { label: string; color: string }> = {
  fidelity: { label: 'Fidelidade', color: 'text-emerald-400' },
  coherence: { label: 'Coerencia', color: 'text-purple-400' },
  decoherence: { label: 'Decoerencia', color: 'text-rose-400' },
  entanglement: { label: 'Entrelacamento', color: 'text-cyan-400' },
  superposition: { label: 'Superposicao', color: 'text-amber-400' },
};

const PANELS = ['nexus_core', 'cerebro', 'fable_5', 'cofre', 'moltbook_voice', 'wormhole'];

function generateMockQuantumState() {
  const state: Record<string, Record<string, number>> = {};
  for (const panel of PANELS) {
    state[panel] = {
      fidelity: 0.5 + Math.random() * 0.45,
      coherence: 0.4 + Math.random() * 0.5,
      decoherence: Math.random() * 0.4,
      entanglement: 0.3 + Math.random() * 0.5,
      superposition: 0.4 + Math.random() * 0.5,
      evolution: Math.random(),
    };
  }
  return state;
}

export default function RecuperacaoTab() {
  const [quantumStates, setQuantumStates] = useState<Record<string, Record<string, number>>>({});
  const [cycles, setCycles] = useState<HealingCycle[]>([]);
  const [isHealing, setIsHealing] = useState(false);
  const [lastRun, setLastRun] = useState<string | null>(null);

  const loadState = useCallback(async () => {
    try {
      const res = await fetch('/api/orchestration?type=healing');
      if (res.ok) {
        const data = await res.json();
        if (data.cycle) {
          setCycles(prev => [data.cycle, ...prev].slice(0, 10));
          setLastRun(data.cycle.timestamp);
        }
      }
    } catch { /* offline fallback */ }
    setQuantumStates(generateMockQuantumState());
  }, []);

  useEffect(() => { loadState(); }, [loadState]);

  const triggerHealing = async () => {
    setIsHealing(true);
    try {
      const res = await fetch('/api/colibri/orchestrate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ trigger: 'healing' }) });
      if (res.ok) {
        const data = await res.json();
        if (data.cycle) setCycles(prev => [data.cycle, ...prev].slice(0, 10));
      }
    } catch { /* fallback */ }
    // Update states visually
    setQuantumStates(prev => {
      const next = { ...prev };
      for (const panel of Object.keys(next)) {
        next[panel] = { ...next[panel] };
        for (const metric of Object.keys(next[panel])) {
          next[panel][metric] = Math.min(1, Math.max(0, next[panel][metric] + (Math.random() * 0.1 - 0.03)));
        }
      }
      return next;
    });
    setLastRun(new Date().toISOString());
    setIsHealing(false);
  };

  const panelEntries = Object.entries(quantumStates);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Dna className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-zinc-200">Auto-Cura Reativa</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">6 Fases</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-7 text-[10px] border-zinc-700 text-zinc-400" onClick={loadState}>
            <RefreshCw className="w-3 h-3 mr-1" /> Atualizar
          </Button>
          <Button size="sm" className="h-7 text-[10px] bg-emerald-600 hover:bg-emerald-500 text-white" onClick={triggerHealing} disabled={isHealing}>
            {isHealing ? <Activity className="w-3 h-3 mr-1 animate-pulse" /> : <Heart className="w-3 h-3 mr-1" />}
            {isHealing ? 'Curando...' : 'Ciclo de Cura'}
          </Button>
        </div>
      </div>

      {/* Healing Phases Pipeline */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Zap className="w-3.5 h-3.5 text-emerald-400" /> Pipeline 6 Fases
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
            {['Observar', 'Detectar', 'Diagnosticar', 'Prescrever', 'Executar', 'Aprender'].map((phase, i) => (
              <div key={phase} className="flex items-center gap-1 flex-shrink-0">
                <div className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] text-emerald-400 font-medium">
                  {i + 1}. {phase}
                </div>
                {i < 5 && <span className="text-zinc-700 mx-0.5">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quantum States Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {panelEntries.map(([panel, metrics], i) => (
          <motion.div key={panel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3 space-y-2">
              <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider truncate">
                {panel.replace(/_/g, ' ')}
              </div>
              {Object.entries(METRIC_LABELS).map(([key, cfg]) => {
                const val = metrics[key] || 0;
                const pct = Math.round(val * 100);
                const barColor = val > 0.7 ? 'bg-emerald-500' : val > 0.4 ? 'bg-amber-500' : 'bg-red-500';
                return (
                  <div key={key} className="space-y-0.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] text-zinc-600">{cfg.label}</span>
                      <span className={cn("text-[9px] font-mono", cfg.color)}>{pct}%</span>
                    </div>
                    <div className="h-1 bg-zinc-800 rounded-full overflow-hidden">
                      <div className={cn("h-full rounded-full transition-all duration-500", barColor)} style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Healing History */}
      {cycles.length > 0 && (
        <Card className="border-zinc-800/60 bg-zinc-900/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" /> Historico de Ciclos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {cycles.map((cycle) => (
              <div key={cycle.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/20">
                <div className={cn("w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold",
                  cycle.healingSuccessRate > 0.8 ? 'bg-emerald-500/20 text-emerald-400' : cycle.healingSuccessRate > 0.5 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                )}>
                  {Math.round(cycle.healingSuccessRate * 100)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] text-zinc-300 font-medium">Ciclo #{cycle.cycleNumber}</div>
                  <div className="text-[10px] text-zinc-600">{cycle.anomaliesDetected} anomalias · {cycle.healingActionsExecuted} acoes · {(cycle.durationMs / 1000).toFixed(2)}s</div>
                </div>
                <div className="flex items-center gap-1 text-[9px] text-zinc-600">
                  <Clock className="w-3 h-3" />
                  {new Date(cycle.timestamp).toLocaleTimeString('pt-BR')}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {lastRun && (
        <p className="text-[10px] text-zinc-600 text-center">Ultima execucao: {new Date(lastRun).toLocaleString('pt-BR')}</p>
      )}
    </div>
  );
}