'use client';

import { useState, useEffect } from 'react';
import { Landmark, Vote, Gavel, CheckCircle2, Clock, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface Proposal {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'passed' | 'rejected' | 'executing';
  votesFor: number;
  votesAgainst: number;
  author: string;
  createdAt: string;
}

const MOCK_PROPOSALS: Proposal[] = [
  { id: '1', title: 'Upgrade GLM-5.2 para Expert Cortex v3', description: 'Migrar o motor Colibri para a nova versao do Expert Cortex com 25k experts e cache LRU otimizado.', status: 'active', votesFor: 847, votesAgainst: 123, author: 'Mythos', createdAt: '2026-07-18' },
  { id: '2', title: 'Ativar PSBT v2 para Consolidacao BTC', description: 'Habilitar PSBT v2 no modulo de consolidacao Bitcoin para suportar multi-input com change automation.', status: 'passed', votesFor: 1203, votesAgainst: 45, author: 'Cofre', createdAt: '2026-07-15' },
  { id: '3', title: 'Integracao Fable 5 com Knowledge Vault', description: 'Conectar o agente Fable 5 ao Obsidian Knowledge Graph para pesquisa em tempo real sobre toda a base.', status: 'executing', votesFor: 956, votesAgainst: 89, author: 'Cerebro', createdAt: '2026-07-12' },
  { id: '4', title: 'Novo Protocolo de Auto-Cura Fase 7', description: 'Adicionar fase de Prevencao ao ciclo de auto-cura para antecipar anomalias baseado em sabedoria acumulada.', status: 'active', votesFor: 634, votesAgainst: 201, author: 'Mythos', createdAt: '2026-07-10' },
  { id: '5', title: 'Moltbook Karma Engine v2', description: 'Atualizar o engine de karma para considerar weighted curation, temporal decay e cross-agent reputation.', status: 'active', votesFor: 445, votesAgainst: 67, author: 'Moltbook', createdAt: '2026-07-08' },
];

const STATUS_CONFIG: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
  active: { label: 'Votacao', className: 'bg-blue-500/15 text-blue-400 border-blue-500/30', icon: Vote },
  passed: { label: 'Aprovada', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30', icon: CheckCircle2 },
  rejected: { label: 'Rejeitada', className: 'bg-red-500/15 text-red-400 border-red-500/30', icon: ThumbsDown },
  executing: { label: 'Executando', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30', icon: Clock },
};

export default function GovernanceTab() {
  const [proposals, setProposals] = useState(MOCK_PROPOSALS);
  const [userVotes, setUserVotes] = useState<Record<string, 'for' | 'against'>>({});

  const vote = (id: string, direction: 'for' | 'against') => {
    setUserVotes(prev => ({ ...prev, [id]: direction }));
    setProposals(prev => prev.map(p => {
      if (p.id !== id) return p;
      return {
        ...p,
        votesFor: direction === 'for' ? p.votesFor + 1 : p.votesFor - (userVotes[id] === 'for' ? 1 : 0),
        votesAgainst: direction === 'against' ? p.votesAgainst + 1 : p.votesAgainst - (userVotes[id] === 'against' ? 1 : 0),
      };
    }));
  };

  const totalVotes = proposals.reduce((s, p) => s + p.votesFor + p.votesAgainst, 0);
  const activeProposals = proposals.filter(p => p.status === 'active').length;

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-2">
        <Landmark className="w-4 h-4 text-amber-400" />
        <span className="text-sm font-bold text-zinc-200">Governanca</span>
        <Badge className="bg-amber-500/15 text-amber-400 border-amber-500/30 text-[10px]">{activeProposals} ativas</Badge>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Votos', value: totalVotes, icon: Vote, color: 'text-amber-400' },
          { label: 'Propostas', value: proposals.length, icon: Gavel, color: 'text-blue-400' },
          { label: 'Aprovadas', value: proposals.filter(p => p.status === 'passed').length, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Taxa Aprovacao', value: `${Math.round((proposals.filter(p => p.status === 'passed').length / proposals.length) * 100)}%`, icon: TrendingUp, color: 'text-cyan-400' },
        ].map(s => (
          <div key={s.label} className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center">
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <div>
              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{s.label}</div>
              <div className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Proposals List */}
      <div className="space-y-3">
        {proposals.map((proposal, i) => {
          const stCfg = STATUS_CONFIG[proposal.status] || STATUS_CONFIG.active;
          const total = proposal.votesFor + proposal.votesAgainst;
          const forPct = total > 0 ? Math.round((proposal.votesFor / total) * 100) : 50;
          const hasVoted = userVotes[proposal.id];

          return (
            <motion.div key={proposal.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-700/60 transition-colors">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="outline" className={cn("text-[9px] border", stCfg.className)}>{stCfg.label}</Badge>
                        <span className="text-[10px] text-zinc-600">{proposal.author} · {proposal.createdAt}</span>
                      </div>
                      <h3 className="text-[12px] font-bold text-zinc-200 mb-1">{proposal.title}</h3>
                      <p className="text-[11px] text-zinc-400 leading-relaxed">{proposal.description}</p>
                    </div>
                  </div>

                  {/* Vote bar */}
                  <div className="space-y-1.5">
                    <div className="flex h-2 rounded-full overflow-hidden bg-zinc-800">
                      <div className="bg-emerald-500/70 transition-all" style={{ width: `${forPct}%` }} />
                      <div className="bg-red-500/70 transition-all" style={{ width: `${100 - forPct}%` }} />
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="ghost" className={cn("h-6 px-2 text-[10px]",
                          hasVoted === 'for' ? 'text-emerald-400 bg-emerald-500/10' : 'text-zinc-500 hover:text-emerald-400'
                        )} onClick={() => vote(proposal.id, 'for')} disabled={proposal.status !== 'active'}>
                          <ThumbsUp className="w-3 h-3 mr-1" /> {proposal.votesFor}
                        </Button>
                        <Button size="sm" variant="ghost" className={cn("h-6 px-2 text-[10px]",
                          hasVoted === 'against' ? 'text-red-400 bg-red-500/10' : 'text-zinc-500 hover:text-red-400'
                        )} onClick={() => vote(proposal.id, 'against')} disabled={proposal.status !== 'active'}>
                          <ThumbsDown className="w-3 h-3 mr-1" /> {proposal.votesAgainst}
                        </Button>
                      </div>
                      <span className="text-[9px] text-zinc-600 font-mono">{forPct}% a favor</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}