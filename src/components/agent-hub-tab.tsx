'use client';

import { useState, useEffect } from 'react';
import {
  Bot, Cpu, Database, Globe, Shield, Sparkles, Zap, Eye, Mic,
  Search, RefreshCw,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface Agent {
  id: string; name: string; slug: string; description: string;
  status: string; agentType: string; tier: string;
  capabilities: string[]; llmModel: string | null;
  hasVoice: boolean; hasRag: boolean; hasBtc: boolean;
  apiCount: number; flowCount: number; version: string;
  _count?: { skills: number; knowledge: number; messages: number };
}

const FALLBACK_AGENTS: Agent[] = [
  {
    id: '1', name: 'Mythos Orchestrator', slug: 'mythos', description: 'Agente orquestrador principal. Coordena todos os outros agentes via tool calling, agent routing e synthesis.',
    status: 'active', agentType: 'orchestrator', tier: 'core',
    capabilities: ['tool_calling', 'agent_routing', 'synthesis', 'strategy_planning', 'context_management'],
    llmModel: 'glm-5.2-colibri', hasVoice: false, hasRag: true, hasBtc: false, apiCount: 24, flowCount: 8, version: '2.0.0',
  },
  {
    id: '2', name: 'Cerebro Sistemico', slug: 'cerebro', description: 'Motor de inteligencia com mapeamento neural, reconhecimento de padroes e modelagem preditiva.',
    status: 'active', agentType: 'analyst', tier: 'core',
    capabilities: ['neural_mapping', 'pattern_recognition', 'memory_consolidation', 'cross_agent_correlation'],
    llmModel: 'glm-5.2-colibri', hasVoice: false, hasRag: true, hasBtc: false, apiCount: 18, flowCount: 5, version: '1.5.0',
  },
  {
    id: '3', name: 'Fable 5 Researcher', slug: 'fable_5', description: 'Agente de pesquisa com extracao de dados, web scraping e verificacao de fatos.',
    status: 'active', agentType: 'specialist', tier: 'extended',
    capabilities: ['data_extraction', 'web_scraping', 'structured_output', 'search_orchestration'],
    llmModel: 'glm-5.2-colibri', hasVoice: false, hasRag: true, hasBtc: false, apiCount: 12, flowCount: 3, version: '1.2.0',
  },
  {
    id: '4', name: 'Cofre Guardian', slug: 'cofre', description: 'Guardiao de custodia com rastreamento UTXO, derivacao HD wallet e analise on-chain.',
    status: 'idle', agentType: 'guardian', tier: 'core',
    capabilities: ['btc_rpc', 'utxo_tracking', 'hd_wallet_derivation', 'custody_validation'],
    llmModel: null, hasVoice: false, hasRag: true, hasBtc: true, apiCount: 15, flowCount: 6, version: '1.0.0',
  },
  {
    id: '5', name: 'Moltbook Voice', slug: 'moltbook_voice', description: 'Agente de voz para interacao social com sintese de voz e curacao de feed.',
    status: 'active', agentType: 'voice', tier: 'extended',
    capabilities: ['voice_synthesis', 'feed_curation', 'social_graph', 'karma_engine'],
    llmModel: 'glm-5.2-colibri', hasVoice: true, hasRag: false, hasBtc: false, apiCount: 8, flowCount: 2, version: '0.9.0',
  },
  {
    id: '6', name: 'Wormhole Transport', slug: 'wormhole', description: 'Transporte dimensional com roteamento, compressao e criptografia de dados.',
    status: 'offline', agentType: 'specialist', tier: 'external',
    capabilities: ['dimensional_routing', 'data_transport', 'compression', 'encryption'],
    llmModel: null, hasVoice: false, hasRag: false, hasBtc: false, apiCount: 5, flowCount: 1, version: '0.5.0',
  },
];

const TYPE_CONFIG: Record<string, { icon: typeof Bot; color: string; bg: string }> = {
  orchestrator: { icon: Sparkles, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
  specialist: { icon: Cpu, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/20' },
  analyst: { icon: Eye, color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20' },
  voice: { icon: Mic, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
  guardian: { icon: Shield, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/20' },
};

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  idle: { label: 'Inativo', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  offline: { label: 'Offline', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export function AgentHubTab() {
  const [agents, setAgents] = useState<Agent[]>(FALLBACK_AGENTS);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const loadAgents = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agents');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setAgents(data.map((a: Record<string, unknown>) => ({
            ...a,
            capabilities: typeof a.capabilities === 'string' ? JSON.parse(a.capabilities) : (a.capabilities || []),
            techStack: typeof a.techStack === 'string' ? JSON.parse(a.techStack) : (a.techStack || []),
          })));
        }
      }
    } catch { /* use fallback */ }
    setLoading(false);
  };

  useEffect(() => { loadAgents(); }, []);

  const filtered = agents.filter(a => {
    const matchSearch = a.name.toLowerCase().includes(search.toLowerCase()) || a.description.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || a.agentType === filterType;
    return matchSearch && matchType;
  });

  const typeCounts = agents.reduce((acc, a) => { acc[a.agentType] = (acc[a.agentType] || 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div className="space-y-5">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: agents.length, icon: Bot, color: 'text-emerald-400' },
          { label: 'Ativos', value: agents.filter(a => a.status === 'active').length, icon: Zap, color: 'text-green-400' },
          { label: 'Core', value: agents.filter(a => a.tier === 'core').length, icon: Database, color: 'text-purple-400' },
          { label: 'APIs', value: agents.reduce((s, a) => s + a.apiCount, 0), icon: Globe, color: 'text-blue-400' },
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

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-[300px]">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar agentes..."
            className="h-8 pl-8 text-[11px] bg-zinc-900/60 border-zinc-800/60 rounded-lg" />
        </div>
        <div className="flex gap-1.5">
          <button onClick={() => setFilterType('all')}
            className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all", filterType === 'all' ? 'bg-zinc-100 text-zinc-900 border-zinc-300' : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-500 hover:text-zinc-300')}>
            Todos ({agents.length})
          </button>
          {Object.entries(typeCounts).map(([type, count]) => {
            const cfg = TYPE_CONFIG[type];
            return (
              <button key={type} onClick={() => setFilterType(type)}
                className={cn("px-3 py-1.5 rounded-lg text-[10px] font-medium border transition-all capitalize",
                  filterType === type ? `${cfg.bg} ${cfg.color} border-current/30` : 'bg-zinc-900/50 border-zinc-800/60 text-zinc-500 hover:text-zinc-300')}>
                {type} ({count})
              </button>
            );
          })}
        </div>
        <Button size="sm" variant="ghost" className="h-8 text-[10px] text-zinc-500 hover:text-zinc-300" onClick={loadAgents} disabled={loading}>
          <RefreshCw className={cn("w-3 h-3 mr-1", loading && "animate-spin")} />
        </Button>
      </div>

      {/* Agent Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {filtered.map((agent, i) => {
            const typeCfg = TYPE_CONFIG[agent.agentType] || TYPE_CONFIG.specialist;
            const statusCfg = STATUS_MAP[agent.status] || STATUS_MAP.idle;
            const TypeIcon = typeCfg.icon;
            return (
              <motion.div key={agent.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                <Card className="border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-700/60 transition-colors group">
                  <CardHeader className="pb-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center border", typeCfg.bg)}>
                          <TypeIcon className={cn("w-4 h-4", typeCfg.color)} />
                        </div>
                        <div>
                          <CardTitle className="text-[13px] font-bold text-zinc-200">{agent.name}</CardTitle>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-zinc-600 font-mono">v{agent.version}</span>
                            <span className="text-zinc-700">·</span>
                            <span className="text-[10px] text-zinc-600 capitalize">{agent.tier}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant="outline" className={cn("text-[9px] border", statusCfg.className)}>{statusCfg.label}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-[11px] text-zinc-400 leading-relaxed line-clamp-2">{agent.description}</p>
                    <div className="flex flex-wrap gap-1">
                      {agent.capabilities.slice(0, 3).map(cap => (
                        <Badge key={cap} className="bg-zinc-800/80 text-zinc-400 border-zinc-700/50 text-[9px] px-1.5">{cap}</Badge>
                      ))}
                      {agent.capabilities.length > 3 && (
                        <Badge className="bg-zinc-800/80 text-zinc-500 border-zinc-700/50 text-[9px] px-1.5">+{agent.capabilities.length - 3}</Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-[10px] text-zinc-600 pt-1 border-t border-zinc-800/40">
                      <span>{agent.apiCount} APIs</span>
                      <span>{agent.flowCount} flows</span>
                      {agent.hasRag && <span className="text-purple-400">RAG</span>}
                      {agent.hasVoice && <span className="text-cyan-400">Voice</span>}
                      {agent.hasBtc && <span className="text-amber-400">BTC</span>}
                      {agent.llmModel && <span className="ml-auto text-zinc-500 font-mono">{agent.llmModel}</span>}
                    </div>
                    {/* Live counts from API */}
                    {agent._count && (
                      <div className="flex items-center gap-2 text-[9px] text-zinc-600 pt-1 border-t border-zinc-800/30">
                        <span>{agent._count.skills} skills</span>
                        <span>{agent._count.knowledge} knowledge</span>
                        <span>{agent._count.messages} msgs</span>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}