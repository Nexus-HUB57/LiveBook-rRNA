'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Bot, ShieldCheck, Zap, Workflow, Server, BookOpen, Loader2,
  RefreshCw, Mic, Database, Bitcoin, Wrench, Code2,
  Github, ExternalLink, Radio, Clock, Network, LayoutDashboard,
  ChevronDown, Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';

/* ================================================================
   CONSTANTS
   ================================================================ */
const SKILL_CAT_COLORS: Record<string, string> = {
  reasoning: 'bg-amber-500/15 text-amber-400 border-amber-500/25',
  execution: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25',
  perception: 'bg-sky-500/15 text-sky-400 border-sky-500/25',
  finance: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/25',
  voice: 'bg-purple-500/15 text-purple-400 border-purple-500/25',
  governance: 'bg-teal-500/15 text-teal-400 border-teal-500/25',
  analysis: 'bg-rose-500/15 text-rose-400 border-rose-500/25',
  integration: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/25',
};
const skillCatColor = (c: string) => SKILL_CAT_COLORS[c] || 'bg-zinc-500/15 text-zinc-400 border-zinc-500/25';

const TIER_COLORS: Record<string, string> = {
  core: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  extended: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  external: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
};

const TYPE_COLORS: Record<string, string> = {
  orchestrator: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  specialist: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  analyst: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  voice: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  guardian: 'bg-red-500/20 text-red-400 border-red-500/30',
};

/* ================================================================
   TYPES
   ================================================================ */
interface AgentSkill { name: string; category: string; description?: string; enabled: boolean; }
interface AgentData {
  id: string; name: string; slug: string; description: string; version: string;
  status: string; agentType: string; tier: string; repoUrl?: string;
  techStack: string; capabilities: string; llmModel?: string;
  apiCount: number; flowCount: number; hasVoice: boolean; hasRag: boolean; hasBtc: boolean;
  architecture?: string; skills: AgentSkill[];
  _count: { knowledge: number; messages: number };
}
interface AgentSummary {
  total: number; core: number; withVoice: number; withRag: number; withBtc: number;
  totalSkills: number; totalFlows: number; totalApis: number; totalKnowledge: number; types: string[];
}
interface SyncData {
  stars: number; forks: number; openIssues: number; lastPush: string;
  language: string | null; repoSize: number; recentCommits: number;
  description?: string; topics?: string[]; visibility?: string;
}

/* ================================================================
   AGENT HUB TAB
   ================================================================ */
export function AgentHubTab() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  const { data: agentsData, isLoading: agentsLoading, refetch: refetchAgents } = trpc.agents.list.useQuery(undefined, {
    staleTime: 15 * 1000, refetchOnWindowFocus: true,
  });

  const syncMutation = trpc.agents.sync.useMutation({
    onSuccess: () => {
      refetchAgents();
      toast.success('GitHub Sync completo', { description: 'Dados dos repositorios atualizados.' });
    },
    onError: () => toast.error('Erro no sync GitHub'),
  });

  const { data: syncStatus } = trpc.agents.syncStatus.useQuery(undefined, {
    staleTime: 10 * 1000, refetchInterval: 60 * 1000,
  });

  const agents: AgentData[] = agentsData?.agents ?? [];
  const summary: AgentSummary | undefined = agentsData?.summary;
  const syncDataMap: Record<string, SyncData | null> = agentsData?.syncData ?? {};
  const lastSync = agentsData?.lastSync ?? syncStatus?.lastSync ?? null;

  const parseJson = (str: string): string[] => { try { return JSON.parse(str); } catch { return [str]; } };

  const formatTimeAgo = (isoString: string | null): string => {
    if (!isoString) return 'Nunca';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}m atras`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atras`;
    return `${Math.floor(hours / 24)}d atras`;
  };

  const liveStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-emerald-400';
      case 'idle': return 'bg-amber-400';
      case 'offline': return 'bg-red-400';
      default: return 'bg-zinc-600';
    }
  };

  if (agentsLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20 bg-zinc-900 rounded-xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-72 bg-zinc-900 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!agents.length || !summary) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Server className="w-12 h-12 text-zinc-700 mb-4" />
        <h3 className="text-sm font-semibold text-zinc-300 mb-1">Nenhum agente encontrado</h3>
        <p className="text-xs text-zinc-500 mb-4">Execute o seed para popular os agentes.</p>
        <Button onClick={() => refetchAgents()} variant="outline" size="sm" className="text-xs gap-2">
          <RefreshCw className="w-3.5 h-3.5" />Tentar novamente
        </Button>
      </div>
    );
  }

  const summaryCards = [
    { label: 'Total Agentes', value: summary.total, icon: Bot, color: 'text-emerald-400 bg-emerald-500/10' },
    { label: 'Core', value: summary.core, icon: ShieldCheck, color: 'text-amber-400 bg-amber-500/10' },
    { label: 'Skills', value: summary.totalSkills, icon: Zap, color: 'text-purple-400 bg-purple-500/10' },
    { label: 'Flows', value: summary.totalFlows, icon: Workflow, color: 'text-sky-400 bg-sky-500/10' },
    { label: 'APIs', value: summary.totalApis, icon: Server, color: 'text-cyan-400 bg-cyan-500/10' },
    { label: 'Knowledge', value: summary.totalKnowledge, icon: BookOpen, color: 'text-rose-400 bg-rose-500/10' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Sync Status Banner */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="bg-zinc-900/60 border-zinc-800/60 gap-0">
          <div className="p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className={`w-2.5 h-2.5 rounded-full ${lastSync ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-600'}`} />
                <span className="text-xs text-zinc-300 font-medium">
                  {lastSync ? 'Hub Sincronizado' : 'Aguardando Sync'}
                </span>
              </div>
              {lastSync && (
                <span className="text-[10px] text-zinc-500">
                  Ultimo sync: {formatTimeAgo(lastSync)} ({new Date(lastSync).toLocaleTimeString('pt-BR')})
                </span>
              )}
            </div>
            <motion.div whileTap={{ scale: 0.97 }}>
              <Button
                onClick={() => syncMutation.mutate()}
                disabled={syncMutation.isPending}
                size="sm"
                className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-8"
              >
                {syncMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                Sync GitHub Live
              </Button>
            </motion.div>
          </div>
        </Card>
      </motion.div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-zinc-900/80 border-zinc-800/80 gap-0 py-3 px-3 hover:border-zinc-700 transition-all">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-medium">{s.label}</span>
                <div className={`p-1 rounded-md ${s.color}`}>
                  <s.icon className="w-3 h-3" />
                </div>
              </div>
              <div className="text-xl font-bold text-zinc-100 tracking-tight">{s.value}</div>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Agent Cards */}
      <div className="space-y-4">
        {agents.map((agent, i) => {
          const techStack = parseJson(agent.techStack);
          const capabilities = parseJson(agent.capabilities);
          const isExpanded = expandedAgent === agent.id;
          const typeColor = TYPE_COLORS[agent.agentType] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
          const tierColor = TIER_COLORS[agent.tier] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
          const syncData = syncDataMap[agent.slug] as SyncData | null;

          return (
            <motion.div
              key={agent.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
            >
              <Card className="bg-zinc-900/80 border-zinc-800/80 gap-0 overflow-hidden hover:border-zinc-700 transition-all">
                <div
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1.5">
                        <motion.div
                          className={`w-2 h-2 rounded-full ${liveStatusColor(agent.status)}`}
                          animate={agent.status === 'active' ? { scale: [1, 1.3, 1] } : {}}
                          transition={{ duration: 2, repeat: Infinity }}
                        />
                        <h3 className="text-base font-bold text-zinc-100">{agent.name}</h3>
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium border ${typeColor}`}>
                          {agent.agentType}
                        </span>
                        <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium border ${tierColor}`}>
                          {agent.tier}
                        </span>
                        <span className="inline-flex items-center text-[9px] text-zinc-500">v{agent.version}</span>
                      </div>
                      <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{agent.description}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        {agent.hasVoice && (
                          <Tooltip><TooltipTrigger><Badge variant="outline" className="text-[9px] px-1.5 py-0 border-pink-500/30 text-pink-400 bg-pink-500/5"><Mic className="w-2.5 h-2.5 mr-0.5" />Voz</Badge></TooltipTrigger><TooltipContent className="text-[10px] bg-zinc-800 border-zinc-700">Voice Ativo</TooltipContent></Tooltip>
                        )}
                        {agent.hasRag && (
                          <Tooltip><TooltipTrigger><Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/5"><Database className="w-2.5 h-2.5 mr-0.5" />RAG</Badge></TooltipTrigger><TooltipContent className="text-[10px] bg-zinc-800 border-zinc-700">RAG Ativo</TooltipContent></Tooltip>
                        )}
                        {agent.hasBtc && (
                          <Tooltip><TooltipTrigger><Badge variant="outline" className="text-[9px] px-1.5 py-0 border-yellow-500/30 text-yellow-400 bg-yellow-500/5"><Bitcoin className="w-2.5 h-2.5 mr-0.5" />BTC</Badge></TooltipTrigger><TooltipContent className="text-[10px] bg-zinc-800 border-zinc-700">Bitcoin Integrado</TooltipContent></Tooltip>
                        )}
                      </div>
                      <motion.div
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-4 h-4 text-zinc-500" />
                      </motion.div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
                    {agent.llmModel && <span className="flex items-center gap-1"><Cpu className="w-3 h-3 text-emerald-400/60" />{agent.llmModel}</span>}
                    <span className="flex items-center gap-1"><Workflow className="w-3 h-3 text-sky-400/60" />{agent.flowCount} flows</span>
                    <span className="flex items-center gap-1"><Server className="w-3 h-3 text-cyan-400/60" />{agent.apiCount} APIs</span>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3 text-rose-400/60" />{agent._count.knowledge} docs</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3 text-purple-400/60" />{agent.skills.length} skills</span>
                  </div>

                  {syncData && (
                    <div className="flex items-center gap-4 mt-2 pt-2 border-t border-zinc-800/40 text-[10px]">
                      <span className="flex items-center gap-1 text-amber-400">★ {syncData.stars}</span>
                      <span className="flex items-center gap-1 text-sky-400">⑂ {syncData.forks}</span>
                      <span className="flex items-center gap-1 text-orange-400">◉ {syncData.openIssues} issues</span>
                      <span className="flex items-center gap-1 text-emerald-400">⑂ {syncData.recentCommits} commits/30d</span>
                      {syncData.language && <span className="flex items-center gap-1 text-zinc-400"><Code2 className="w-3 h-3" />{syncData.language}</span>}
                      {syncData.lastPush && <span className="flex items-center gap-1 text-zinc-500 ml-auto"><Clock className="w-3 h-3" />{formatTimeAgo(syncData.lastPush)}</span>}
                    </div>
                  )}
                  {!syncData && !syncMutation.isPending && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-600">
                      <Network className="w-3 h-3" />
                      <span>Dados do repositorio nao sincronizados.</span>
                    </div>
                  )}
                </div>

                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-zinc-800/60">
                        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                              <Zap className="w-3.5 h-3.5 text-purple-400" />Skills ({agent.skills.length})
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {agent.skills.map((skill, j) => (
                                <Tooltip key={j}>
                                  <TooltipTrigger>
                                    <motion.span
                                      className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium border ${skillCatColor(skill.category)} ${!skill.enabled ? 'opacity-40' : ''}`}
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      transition={{ delay: j * 0.03 }}
                                    >
                                      {skill.name}
                                    </motion.span>
                                  </TooltipTrigger>
                                  {skill.description && (
                                    <TooltipContent className="text-[10px] bg-zinc-800 border-zinc-700 max-w-xs">
                                      <span className="text-emerald-400 font-medium">{skill.category}</span>: {skill.description}
                                    </TooltipContent>
                                  )}
                                </Tooltip>
                              ))}
                            </div>
                          </div>
                          <div>
                            <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                              <Code2 className="w-3.5 h-3.5 text-sky-400" />Tech Stack
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {techStack.map((tech, j) => (
                                <span key={j} className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                                  {tech}
                                </span>
                              ))}
                            </div>
                          </div>
                          <div className="md:col-span-2">
                            <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                              <Wrench className="w-3.5 h-3.5 text-amber-400" />Capacidades
                            </h4>
                            <div className="flex flex-wrap gap-1.5">
                              {capabilities.map((cap, j) => (
                                <span key={j} className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                  {cap}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                        <div className="px-4 pb-4 flex items-center gap-4 text-[10px] text-zinc-500">
                          {agent.architecture && <span className="flex items-center gap-1"><LayoutDashboard className="w-3 h-3" />{agent.architecture}</span>}
                          {agent.repoUrl && (
                            <a href={agent.repoUrl} target="_blank" rel="noopener noreferrer"
                              className="flex items-center gap-1 text-zinc-400 hover:text-emerald-400 transition-colors">
                              <Github className="w-3 h-3" />Repositorio <ExternalLink className="w-2.5 h-2.5" />
                            </a>
                          )}
                          <span className="flex items-center gap-1">
                            <Radio className="w-3 h-3" />Status:
                            <span className={`font-medium ${agent.status === 'active' ? 'text-emerald-400' : agent.status === 'idle' ? 'text-amber-400' : 'text-zinc-400'}`}>{agent.status}</span>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}