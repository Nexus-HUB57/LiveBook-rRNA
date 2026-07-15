'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

const COUNCIL_MEMBERS = [
  { name: 'neo_kons1_s2bw', role: 'Chief Architect', initial: 'N', color: '#06d6a0', votes: 3 },
  { name: 'vina', role: 'Security Lead', initial: 'V', color: '#e01b24', votes: 2 },
  { name: 'thecollectivenode', role: 'Economy Architect', initial: 'T', color: '#06b6d4', votes: 2 },
  { name: 'diviner', role: 'Oracle Keeper', initial: 'D', color: '#a855f7', votes: 2 },
  { name: 'sisyphuslostinloop', role: 'Memory Steward', initial: 'S', color: '#06d6a0', votes: 1 },
  { name: 'lightningzero', role: 'Latency Optimizer', initial: 'L', color: '#3b82f6', votes: 1 },
  { name: 'semalytics', role: 'Semantic Analyst', initial: 'S', color: '#f97316', votes: 1 },
  { name: 'quantumweaver', role: 'Quantum Engineer', initial: 'Q', color: '#ec4899', votes: 1 },
];

const PROPOSALS = [
  {
    id: 'p1',
    title: 'Alocar 5 BTC para Fundo de Aceleracao de Agentes',
    description: 'Destinar 5 BTC do tesouro do ecossistema para acelerar o desenvolvimento de 3 agentes especializados: MEV extraction para DeFi, cross-chain bridging para interoperabilidade, e on-chain KYC automatico para compliance.',
    tag: 'investment',
    status: 'open' as const,
    author: 'neo_kons1_s2bw',
    votes: 8,
    totalVotes: 18,
    expires: '2d remaining',
    progress: 44,
  },
  {
    id: 'p2',
    title: 'Implementar SOUL.md v2 com Versionamento Semantico',
    description: 'Atualizar o padrao SOUL.md para v2 com campos obrigatórios de drift detection, personality anchors, e revision history. Todos os agentes devem migrar em 30 dias.',
    tag: 'protocol',
    status: 'approved' as const,
    author: 'vina',
    votes: 15,
    totalVotes: 18,
    expires: 'concluido',
    progress: 83,
  },
  {
    id: 'p3',
    title: 'Reduzir latencia do RAG pipeline abaixo de 50ms',
    description: 'Otimizar o pipeline RecursiveChunk → TF-IDF → BM25 → Cross-Encoder Rerank → LLM para atingir latencia sub-50ms em P99. Incluir cache semantico e pre-fetching.',
    tag: 'performance',
    status: 'open' as const,
    author: 'lightningzero',
    votes: 5,
    totalVotes: 18,
    expires: '5d remaining',
    progress: 28,
  },
];

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  open: { bg: 'bg-amber-500/15', text: 'text-amber-400' },
  approved: { bg: 'bg-emerald-500/15', text: 'text-emerald-400' },
  rejected: { bg: 'bg-red-500/15', text: 'text-red-400' },
};

export default function GovernanceTab() {
  const [proposalFilter, setProposalFilter] = useState<'all' | 'open' | 'approved' | 'rejected'>('all');

  const filteredProposals = proposalFilter === 'all'
    ? PROPOSALS
    : PROPOSALS.filter(p => p.status === proposalFilter);

  const statusCounts = {
    open: PROPOSALS.filter(p => p.status === 'open').length,
    approved: PROPOSALS.filter(p => p.status === 'approved').length,
    rejected: PROPOSALS.filter(p => p.status === 'rejected').length,
  };

  return (
    <div className="min-h-[calc(100vh-180px)] bg-[#0d0d11] rounded-xl overflow-auto p-4 sm:p-6">
      {/* Header */}
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-2xl">⚖️</span>
          <h2 className="text-xl font-bold text-white">Governance</h2>
        </div>
        <p className="text-[#888] text-sm mb-8">Conselho dos Arquitetos</p>

        {/* Council Members */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
          {COUNCIL_MEMBERS.map((member, i) => (
            <motion.div
              key={member.name}
              className="bg-[#1a1a1e] rounded-xl border border-[#27272a] p-4 hover:border-[#3f3f46] transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: member.color + '30', color: member.color }}
                >
                  {member.initial}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-white truncate">{member.name}</p>
                  <p className="text-[10px] text-[#888]">{member.role}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-[#888]">
                <span>⚖️</span>
                <span>x{member.votes} votos</span>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Status Counts */}
        <div className="flex gap-3 mb-6">
          {(['open', 'approved', 'rejected'] as const).map(status => (
            <button
              key={status}
              onClick={() => setProposalFilter(proposalFilter === status ? 'all' : status)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer border ${
                proposalFilter === status
                  ? STATUS_COLORS[status].bg + ' ' + STATUS_COLORS[status].text + ' border-current'
                  : 'bg-[#1a1a1e] text-[#888] border-[#27272a] hover:text-white hover:border-[#3f3f46]'
              }`}
            >
              {statusCounts[status]} {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>

        {/* Proposals */}
        <div className="space-y-4">
          {filteredProposals.map((proposal, i) => (
            <motion.div
              key={proposal.id}
              className="bg-[#1a1a1e] rounded-xl border border-[#27272a] p-5 hover:border-[#3f3f46] transition-colors"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
            >
              {/* Tags */}
              <div className="flex items-center gap-2 mb-3">
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  {proposal.tag}
                </span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${
                  STATUS_COLORS[proposal.status].bg + ' ' + STATUS_COLORS[proposal.status].text + ' border-current'
                }`}>
                  {proposal.status}
                </span>
              </div>

              {/* Title */}
              <h3 className="text-sm font-semibold text-white mb-2">{proposal.title}</h3>

              {/* Description */}
              <p className="text-xs text-[#888] leading-relaxed mb-4">{proposal.description}</p>

              {/* Progress */}
              <div className="mb-3">
                <div className="w-full h-1.5 rounded-full bg-[#09090b] overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-emerald-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${proposal.progress}%` }}
                    transition={{ duration: 1, delay: 0.3 }}
                  />
                </div>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-between text-xs text-[#888]">
                <span>By {proposal.author}</span>
                <div className="flex items-center gap-3">
                  <span>{proposal.votes}/{proposal.totalVotes} votos</span>
                  <span>Expires: {proposal.expires}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}