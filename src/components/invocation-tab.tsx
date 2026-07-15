'use client';

import { useState } from 'react';
import {
  Zap, Play, Square, RotateCcw, ArrowRight, Activity,
  Cpu, Database, BrainCircuit, Shield, Globe, Eye,
  ChevronRight, CheckCircle2, XCircle, AlertTriangle, Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Skill {
  id: string; name: string; category: string; description: string;
  status: 'ready' | 'running' | 'completed' | 'failed'; duration?: number;
}

interface InvocationLog {
  id: string; skill: string; agent: string; status: 'success' | 'partial' | 'failed';
  startedAt: string; duration: number; output?: string;
}

const SKILLS: Skill[] = [
  { id: 'neural_mapping', name: 'Neural Mapping', category: 'Intelligence', description: 'Mapeia conexoes neurais entre agentes e detecta padroes de atividade.', status: 'ready' },
  { id: 'pattern_recognition', name: 'Pattern Recognition', category: 'Intelligence', description: 'Reconhece padroes nos dados de saude do sistema e prediz anomalias.', status: 'ready' },
  { id: 'memory_consolidation', name: 'Memory Consolidation', category: 'Intelligence', description: 'Consolida memorias de ciclos anteriores em sabedoria aplicavel.', status: 'ready' },
  { id: 'tool_calling', name: 'Tool Calling', category: 'Orchestration', description: 'Invoca ferramentas e APIs externas via acionamento direto.', status: 'ready' },
  { id: 'agent_routing', name: 'Agent Routing', category: 'Orchestration', description: 'Roteia tarefas para o agente mais adequado baseado em capacidade.', status: 'ready' },
  { id: 'synthesis', name: 'Synthesis', category: 'Orchestration', description: 'Sintetiza respostas de multiplos agentes em uma saida coerente.', status: 'ready' },
  { id: 'feed_curation', name: 'Feed Curation', category: 'Social', description: 'Cura e classifica conteudo social baseado em relevancia e karma.', status: 'ready' },
  { id: 'btc_rpc', name: 'BTC RPC', category: 'Finance', description: 'Executa chamadas RPC na rede Bitcoin para consulta de dados on-chain.', status: 'ready' },
  { id: 'utxo_tracking', name: 'UTXO Tracking', category: 'Finance', description: 'Rastreia UTXOs e calcula saldos de enderecos Bitcoin.', status: 'ready' },
  { id: 'expert_routing', name: 'Expert Routing', category: 'Colibri', description: 'Analisa e otimiza o roteamento de experts no motor Colibri GLM-5.2.', status: 'ready' },
  { id: 'cache_optimization', name: 'Cache Optimization', category: 'Colibri', description: 'Otimiza o cache LRU de experts por camada para maximizar hits.', status: 'ready' },
  { id: 'entropy_calculation', name: 'Entropy Calculation', category: 'Analysis', description: 'Calcula entropia do sistema e detecta decoherence spikes.', status: 'ready' },
];

const MOCK_LOGS: InvocationLog[] = [
  { id: '1', skill: 'neural_mapping', agent: 'Cerebro', status: 'success', startedAt: '2026-07-15T12:00:00Z', duration: 320, output: 'Mapped 156 neural connections across 6 agents' },
  { id: '2', skill: 'agent_routing', agent: 'Mythos', status: 'success', startedAt: '2026-07-15T11:58:00Z', duration: 145, output: 'Routed task to Fable 5 specialist' },
  { id: '3', skill: 'expert_routing', agent: 'Colibri', status: 'partial', startedAt: '2026-07-15T11:55:00Z', duration: 890, output: 'Optimized 3/5 layers, 2 layers at cache limit' },
  { id: '4', skill: 'pattern_recognition', agent: 'Cerebro', status: 'success', startedAt: '2026-07-15T11:50:00Z', duration: 560, output: 'Detected 3 recurring patterns in health data' },
  { id: '5', skill: 'synthesis', agent: 'Mythos', status: 'failed', startedAt: '2026-07-15T11:45:00Z', duration: 1200, output: 'Timeout: agent Cofre did not respond within SLA' },
];

const CATEGORY_COLORS: Record<string, string> = {
  Intelligence: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  Orchestration: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  Social: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Finance: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  Colibri: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
  Analysis: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const STATUS_ICON = {
  success: CheckCircle2, partial: AlertTriangle, failed: XCircle,
};

export function InvocationTab() {
  const [skills, setSkills] = useState(SKILLS);
  const [runningSkill, setRunningSkill] = useState<string | null>(null);

  const executeSkill = (skillId: string) => {
    if (runningSkill) return;
    setRunningSkill(skillId);
    setSkills(prev => prev.map(s => s.id === skillId ? { ...s, status: 'running' as const } : s));
    // Simulate execution
    setTimeout(() => {
      const success = Math.random() > 0.2;
      setSkills(prev => prev.map(s => s.id === skillId ? { ...s, status: success ? 'completed' as const : 'failed' as const, duration: Math.floor(Math.random() * 2000 + 200) } : s));
      setTimeout(() => {
        setSkills(prev => prev.map(s => s.id === skillId ? { ...s, status: 'ready' as const } : s));
        setRunningSkill(null);
      }, 2000);
    }, Math.floor(Math.random() * 1500 + 500));
  };

  const executeAll = () => {
    if (runningSkill) return;
    let delay = 0;
    skills.filter(s => s.status === 'ready').forEach(s => {
      setTimeout(() => executeSkill(s.id), delay);
      delay += 300;
    });
  };

  return (
    <div className="space-y-5">
      {/* Header Actions */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-zinc-200">Painel de Invocacao</span>
          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">{skills.length} Skills</Badge>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" className="h-8 text-[11px] border-zinc-700 text-zinc-400 hover:text-zinc-200"
            onClick={() => setSkills(SKILLS)}>
            <RotateCcw className="w-3 h-3 mr-1" /> Reset
          </Button>
          <Button size="sm" className="h-8 text-[11px] bg-purple-600 hover:bg-purple-500 text-white" onClick={executeAll} disabled={!!runningSkill}>
            <Play className="w-3 h-3 mr-1" /> Executar Todas
          </Button>
        </div>
      </div>

      {/* Skills Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
        {skills.map((skill, i) => {
          const catColor = CATEGORY_COLORS[skill.category] || 'text-zinc-400 bg-zinc-500/10 border-zinc-500/20';
          return (
            <motion.div key={skill.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
              <Card className={cn("border-zinc-800/60 bg-zinc-900/50 transition-all hover:border-zinc-700/60",
                skill.status === 'running' && 'border-purple-500/40 shadow-lg shadow-purple-500/5',
                skill.status === 'completed' && 'border-emerald-500/30',
                skill.status === 'failed' && 'border-red-500/30'
              )}>
                <CardContent className="p-3.5 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-[12px] font-bold text-zinc-200 truncate">{skill.name}</div>
                      <Badge variant="outline" className={cn("text-[9px] mt-1", catColor)}>{skill.category}</Badge>
                    </div>
                    {skill.status === 'running' ? (
                      <div className="w-5 h-5 rounded-full border-2 border-purple-400 border-t-transparent animate-spin flex-shrink-0 mt-0.5" />
                    ) : skill.status === 'completed' ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                    ) : skill.status === 'failed' ? (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    ) : null}
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed line-clamp-2">{skill.description}</p>
                  <div className="flex items-center justify-between pt-1">
                    {skill.duration ? (
                      <span className="text-[9px] text-zinc-600 font-mono">{(skill.duration / 1000).toFixed(2)}s</span>
                    ) : (
                      <span />
                    )}
                    <Button size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
                      onClick={() => executeSkill(skill.id)} disabled={skill.status === 'running' || !!runningSkill}>
                      <Play className="w-3 h-3 mr-1" /> Run
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Recent Invocations */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-amber-400" /> Invocacoes Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {MOCK_LOGS.map(log => {
              const StatusIcon = STATUS_ICON[log.status];
              const statusColor = log.status === 'success' ? 'text-emerald-400' : log.status === 'partial' ? 'text-amber-400' : 'text-red-400';
              return (
                <div key={log.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-zinc-800/30 border border-zinc-700/20 hover:border-zinc-700/40 transition-colors">
                  <StatusIcon className={cn("w-4 h-4 flex-shrink-0", statusColor)} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-zinc-200">{log.skill}</span>
                      <ChevronRight className="w-3 h-3 text-zinc-600" />
                      <span className="text-[11px] text-zinc-500">{log.agent}</span>
                    </div>
                    {log.output && <p className="text-[10px] text-zinc-600 truncate mt-0.5">{log.output}</p>}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[10px] text-zinc-600 font-mono">{(log.duration / 1000).toFixed(2)}s</span>
                    <Clock className="w-3 h-3 text-zinc-700" />
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}