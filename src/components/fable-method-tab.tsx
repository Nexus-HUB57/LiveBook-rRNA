'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  BrainCircuit, Play, CheckCircle2, AlertTriangle, XCircle, Shield,
  ChevronRight, Zap, Globe, Gavel, Layers, RefreshCw, Clock, LoaderCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Types (mirror of backend) ───
type FableSkill = 'fable-method' | 'fable-loop' | 'fable-judge' | 'fable-domain';
type MethodPhase = 'think' | 'act' | 'prove' | 'done' | 'failed';
type JudgeVerdict = 'VERIFIED' | 'CAVEATS' | 'REFUTED';

interface PhaseRecord { phase: MethodPhase; output?: string; completedAt?: string; }
interface PlanStep { index: number; action: string; status: string; }
interface JudgeCheck { name: string; passed: boolean; detail: string; }
interface MethodResult {
  skill: FableSkill;
  mode: string;
  task: string;
  phases: PhaseRecord[];
  plan: PlanStep[];
  verdict?: JudgeVerdict;
  score?: number;
  caveats?: string[];
  startedAt: string;
  completedAt?: string;
}

const SKILLS = [
  { value: 'fable-method' as FableSkill, label: 'Fable Method', desc: 'Think/Act/Prove inline', icon: BrainCircuit, color: '#00ff88', modes: ['inline', 'plan', 'audit', 'report'] },
  { value: 'fable-loop' as FableSkill, label: 'Fable Loop', desc: 'Orquestracao completa com subagentes', icon: Play, color: '#22d3ee', modes: ['loop'] },
  { value: 'fable-judge' as FableSkill, label: 'Fable Judge', desc: 'Verificacao adversarial', icon: Gavel, color: '#fbbf24', modes: ['judge'] },
  { value: 'fable-domain' as FableSkill, label: 'Fable Domain', desc: 'Adaptadores de setor com traps', icon: Globe, color: '#a855f7', modes: ['domain'] },
];

const PHASE_COLORS: Record<MethodPhase, string> = {
  think: 'text-blue-400',
  act: 'text-amber-400',
  prove: 'text-emerald-400',
  done: 'text-emerald-300',
  failed: 'text-red-400',
};

const PHASE_LABELS: Record<MethodPhase, string> = {
  think: 'THINK',
  act: 'ACT',
  prove: 'PROVE',
  done: 'DONE',
  failed: 'FAILED',
};

const VERDICT_STYLES: Record<JudgeVerdict, { label: string; className: string }> = {
  VERIFIED: { label: 'VERIFIED', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  CAVEATS: { label: 'CAVEATS', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  REFUTED: { label: 'REFUTED', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function FableMethodTab() {
  const [task, setTask] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<FableSkill>('fable-method');
  const [mode, setMode] = useState('inline');
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<MethodResult | null>(null);
  const [history, setHistory] = useState<MethodResult[]>([]);
  const [domains, setDomains] = useState<{ sector: string; description: string }[]>([]);
  const [expandedHistory, setExpandedHistory] = useState<string | null>(null);

  // Fetch history and domains on mount
  useEffect(() => {
    fetch('/api/fable/method')
      .then(r => r.json())
      .then(d => { if (d.history) setHistory(d.history); })
      .catch(() => {});
    fetch('/api/fable/domain')
      .then(r => r.json())
      .then(d => { if (d.adapters) setDomains(d.adapters.map((a: any) => ({ sector: a.sector, description: a.description }))); })
      .catch(() => {});
  }, []);

  const currentSkill = SKILLS.find(s => s.value === selectedSkill)!;

  const execute = useCallback(async () => {
    if (!task.trim() || running) return;
    setRunning(true);
    setResult(null);

    try {
      let endpoint = `/api/fable/${selectedSkill}`;
      let body: any = {};

      if (selectedSkill === 'fable-method') {
        body = { task, mode };
        endpoint = '/api/fable/method';
      } else if (selectedSkill === 'fable-loop') {
        body = { task };
        endpoint = '/api/fable/loop';
      } else if (selectedSkill === 'fable-judge') {
        body = { work: { task, phases: [], plan: [], evidence: [], skill: 'fable-method', mode: 'inline', startedAt: new Date().toISOString() } };
        endpoint = '/api/fable/judge';
      } else if (selectedSkill === 'fable-domain') {
        body = { sector: task.trim() };
        endpoint = '/api/fable/domain';
      }

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (selectedSkill === 'fable-judge') {
        setResult({
          skill: 'fable-judge',
          mode: 'judge',
          task,
          phases: [],
          plan: [],
          verdict: data.report?.verdict,
          score: data.report?.score,
          caveats: data.report?.caveats,
          startedAt: new Date().toISOString(),
          completedAt: data.timestamp,
        });
      } else if (selectedSkill === 'fable-domain') {
        setResult({
          skill: 'fable-domain',
          mode: 'domain',
          task: data.adapter?.sector || task,
          phases: [],
          plan: (data.adapter?.trapFixtures || []).map((t: any, i: number) => ({
            index: i + 1,
            action: t.name,
            status: 'done',
          })),
          startedAt: new Date().toISOString(),
          completedAt: data.timestamp,
        });
      } else {
        setResult(data.data || null);
      }

      // Refresh history
      fetch('/api/fable/method').then(r => r.json()).then(d => { if (d.history) setHistory(d.history); }).catch(() => {});
    } catch (err) {
      setResult({
        skill: selectedSkill,
        mode,
        task,
        phases: [{ phase: 'failed', output: err instanceof Error ? err.message : 'Erro desconhecido' }],
        plan: [],
        startedAt: new Date().toISOString(),
      });
    } finally {
      setRunning(false);
    }
  }, [task, selectedSkill, mode, running]);

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />
          <span className="text-sm font-bold text-zinc-200">Fable Method Engine</span>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
            Think / Act / Prove
          </Badge>
          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">
            4 Skills
          </Badge>
        </div>
      </div>

      {/* Skill selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {SKILLS.map(skill => {
          const Icon = skill.icon;
          const isActive = selectedSkill === skill.value;
          return (
            <button
              key={skill.value}
              onClick={() => { setSelectedSkill(skill.value); setMode(skill.modes[0]); setResult(null); }}
              className={cn(
                'text-left p-3 rounded-xl border transition-all',
                isActive
                  ? 'border-zinc-600 bg-zinc-900/60'
                  : 'border-zinc-800/40 bg-zinc-900/20 hover:border-zinc-700/40',
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <Icon className="w-3.5 h-3.5" style={{ color: isActive ? skill.color : '#71717a' }} />
                <span className="text-[11px] font-bold" style={{ color: isActive ? skill.color : '#a1a1aa' }}>
                  {skill.label}
                </span>
              </div>
              <p className="text-[10px] text-zinc-500">{skill.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Input area */}
      <Card className="border-zinc-800/60 bg-zinc-900/30">
        <CardContent className="p-4 space-y-3">
          {selectedSkill === 'fable-method' && (
            <div className="flex gap-2 flex-wrap">
              {currentSkill.modes.map(m => (
                <button
                  key={m}
                  onClick={() => setMode(m)}
                  className={cn(
                    'px-3 py-1 rounded-lg text-[10px] font-medium border transition-all',
                    mode === m
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'border-zinc-700/40 text-zinc-500 hover:text-zinc-300',
                  )}
                >
                  /{m}
                </button>
              ))}
            </div>
          )}

          <div className="flex gap-2">
            <Input
              value={task}
              onChange={e => setTask(e.target.value)}
              placeholder={
                selectedSkill === 'fable-domain'
                  ? 'Nome do setor (ex: chimera-dashboard, bitcoin-vault, rag-rrna)'
                  : 'Descreva a tarefa...'
              }
              className="bg-zinc-800/40 border-zinc-700/40 text-[13px] text-zinc-200 placeholder:text-zinc-600"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); void execute(); } }}
              disabled={running}
            />
            <Button
              onClick={() => void execute()}
              disabled={!task.trim() || running}
              className="bg-emerald-600 hover:bg-emerald-500 text-white flex-shrink-0"
              style={running ? {} : { backgroundColor: currentSkill.color + 'cc' }}
            >
              {running ? <LoaderCircle className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Active result */}
      <AnimatePresence>
        {result && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="space-y-3">
            {/* Verdict */}
            {result.verdict && (
              <Card className="border-zinc-800/60 bg-zinc-900/30">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <Shield className="w-5 h-5" style={{ color: result.verdict === 'VERIFIED' ? '#00ff88' : result.verdict === 'CAVEATS' ? '#fbbf24' : '#ef4444' }} />
                      <div>
                        <p className="text-sm font-bold text-zinc-200">Judge Verdict</p>
                        <p className="text-[10px] text-zinc-500">
                          Score: {result.score ?? 'N/A'}/100
                        </p>
                      </div>
                    </div>
                    <Badge className={cn('text-[11px] font-bold', VERDICT_STYLES[result.verdict]?.className)}>
                      {VERDICT_STYLES[result.verdict]?.label}
                    </Badge>
                  </div>
                  {result.caveats && result.caveats.length > 0 && (
                    <div className="mt-3 space-y-1">
                      {result.caveats.map((c, i) => (
                        <p key={i} className="text-[11px] text-amber-400/80 flex items-start gap-1.5">
                          <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />{c}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Phase pipeline */}
            {result.phases.length > 0 && (
              <Card className="border-zinc-800/60 bg-zinc-900/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <Zap className="w-3.5 h-3.5 text-emerald-400" />
                    Pipeline: {result.skill} ({result.mode})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="flex items-center gap-2 flex-wrap">
                    {['think', 'act', 'prove'].map(phase => {
                      const phaseRec = result.phases.find(p => p.phase === phase);
                      const isDone = !!phaseRec?.completedAt;
                      const isActive = !phaseRec?.completedAt && result.phases.some((p, i) => {
                        const idx = ['think', 'act', 'prove'].indexOf(phase);
                        const pIdx = ['think', 'act', 'prove'].indexOf(p.phase);
                        return pIdx >= idx && p.completedAt;
                      });
                      return (
                        <div key={phase} className="flex items-center gap-2">
                          <div className={cn(
                            'px-3 py-1.5 rounded-lg text-[10px] font-bold border',
                            isDone ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : isActive ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 animate-pulse'
                              : 'bg-zinc-800/40 border-zinc-700/30 text-zinc-600',
                          )}>
                            {PHASE_LABELS[phase as MethodPhase]}
                          </div>
                          {phase !== 'prove' && <ChevronRight className="w-3 h-3 text-zinc-700" />}
                        </div>
                      );
                    })}
                  </div>
                  {result.phases.map((p, i) => (
                    p.output && (
                      <div key={i} className="mt-3 p-3 bg-zinc-800/30 rounded-lg border border-zinc-800/40">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn('text-[10px] font-bold', PHASE_COLORS[p.phase])}>
                            {PHASE_LABELS[p.phase]}
                          </span>
                          {p.completedAt && (
                            <span className="text-[9px] text-zinc-600">
                              <Clock className="w-2.5 h-2.5 inline mr-0.5" />
                              {new Date(p.completedAt).toLocaleTimeString('pt-BR')}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 leading-relaxed">{p.output}</p>
                      </div>
                    )
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Plan steps */}
            {result.plan.length > 0 && (
              <Card className="border-zinc-800/60 bg-zinc-900/30">
                <CardHeader className="pb-2 px-4 pt-4">
                  <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5 text-cyan-400" />
                    Plano ({result.plan.filter(s => s.status === 'done').length}/{result.plan.length})
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2">
                  {result.plan.map(step => (
                    <div key={step.index} className="flex items-start gap-2.5 p-2 rounded-lg bg-zinc-800/20">
                      {step.status === 'done' ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                      ) : step.status === 'failed' ? (
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-zinc-600 mt-0.5 flex-shrink-0" />
                      )}
                      <div>
                        <p className="text-[11px] text-zinc-300">{step.action}</p>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Duration */}
            {result.startedAt && result.completedAt && (
              <p className="text-[10px] text-zinc-600 text-right">
                {((new Date(result.completedAt).getTime() - new Date(result.startedAt).getTime()) / 1000).toFixed(1)}s
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Domain adapters */}
      {selectedSkill === 'fable-domain' && (
        <Card className="border-zinc-800/60 bg-zinc-900/30">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <Globe className="w-3.5 h-3.5 text-purple-400" />
              Domain Adapters Disponiveis ({domains.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-2">
            {domains.map(d => (
              <button
                key={d.sector}
                onClick={() => setTask(d.sector)}
                className="w-full text-left p-3 rounded-lg border border-zinc-800/40 bg-zinc-800/20 hover:border-purple-500/30 transition-all"
              >
                <p className="text-[11px] font-bold text-purple-300">{d.sector}</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">{d.description.slice(0, 80)}</p>
              </button>
            ))}
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history.length > 0 && (
        <Card className="border-zinc-800/60 bg-zinc-900/30">
          <CardHeader className="pb-2 px-4 pt-4">
            <CardTitle className="text-xs font-bold text-zinc-300 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 text-zinc-500" />
              Historico ({history.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-1.5">
            {history.slice(0, 8).map((h, i) => (
              <div
                key={i}
                onClick={() => setExpandedHistory(expandedHistory === i ? null : i)}
                className="cursor-pointer p-2.5 rounded-lg border border-zinc-800/30 bg-zinc-800/15 hover:border-zinc-700/40 transition-all"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="text-[9px] bg-zinc-800 text-zinc-400 border-zinc-700/40">
                      {h.skill}
                    </Badge>
                    <span className="text-[11px] text-zinc-300">{h.task.slice(0, 50)}{h.task.length > 50 ? '...' : ''}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {h.verdict && (
                      <Badge className={cn('text-[9px]', VERDICT_STYLES[h.verdict]?.className)}>
                        {h.verdict}
                      </Badge>
                    )}
                    {h.score !== undefined && (
                      <span className="text-[10px] text-zinc-500">{h.score}pts</span>
                    )}
                  </div>
                </div>
                <AnimatePresence>
                  {expandedHistory === i && h.phases?.length > 0 && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-2 ml-4 space-y-1 overflow-hidden"
                    >
                      {h.phases.map((p, j) => (
                        <p key={j} className="text-[10px] text-zinc-500">
                          <span className={cn('font-bold', PHASE_COLORS[p.phase as MethodPhase])}>
                            {PHASE_LABELS[p.phase as MethodPhase]}
                          </span>
                          {p.output ? `: ${p.output.slice(0, 80)}` : ''}
                        </p>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}