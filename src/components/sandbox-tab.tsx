'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Play, Square, Plus, Brain, RefreshCw, Trash2, Shield, Activity,
  Terminal, Cpu, MemoryStick, Zap, ArrowUp, ArrowDown, RotateCcw,
  Heart, Dna, Skull, Sparkles, Send, ChevronRight, Code2, Box,
  Network, Eye, Clock, BarChart3, TrendingUp, AlertTriangle, CheckCircle2,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────
interface SandboxAgent {
  id: string; name: string; tier: string; status: string;
  capabilities: string[]; metrics: {
    performanceScore: number; successRate: number; avgLatencyMs: number;
    tasksCompleted: number; tasksFailed: number;
  };
  createdAt: string; lastActiveAt: string; generation: number;
  totalExecutions: number; totalErrors: number;
}

interface ExecutionResult {
  success: boolean; output: string; error?: string; exitCode: number;
  executionTimeMs: number; memoryUsedMB: number; sandboxId: string;
  timestamp: string; logs: string[];
}

interface SandboxHealth {
  status: string; uptimeMs: number; totalAgents: number; activeAgents: number;
  totalExecutions: number; totalErrors: number; llmInteractions: number;
  memoryUsageMB: number; memoryLimitMB: number;
  agentsByStatus: Record<string, number>;
  agentsByTier: Record<string, number>;
  evolutionEvents: number; snapshots: number; gcRuns: number;
}

interface LLMStatus {
  config: { provider: string; model: string; temperature: number; systemPrompt: string };
  providerStatus: unknown;
  fallbackChain: string[];
  mode: string;
}

interface EvolutionEvent {
  id: string; agentId: string; type: string; reason: string;
  timestamp: string;
}

// ─── Tier Colors ────────────────────────────────────────
const TIER_COLORS: Record<string, string> = {
  scout: '#60a5fa',
  worker: '#4ed6a5',
  expert: '#a855f7',
  elite: '#f97316',
  architect: '#fbbf24',
};

const STATUS_COLORS: Record<string, { bg: string; text: string; icon: typeof Activity }> = {
  idle: { bg: 'bg-emerald-500/15', text: 'text-emerald-400', icon: Activity },
  executing: { bg: 'bg-cyan-500/15', text: 'text-cyan-400', icon: Play },
  learning: { bg: 'bg-purple-500/15', text: 'text-purple-400', icon: Brain },
  promoted: { bg: 'bg-yellow-500/15', text: 'text-yellow-400', icon: ArrowUp },
  degraded: { bg: 'bg-orange-500/15', text: 'text-orange-400', icon: AlertTriangle },
  recycled: { bg: 'bg-red-500/15', text: 'text-red-400', icon: Skull },
  spawning: { bg: 'bg-blue-500/15', text: 'text-blue-400', icon: Sparkles },
  dead: { bg: 'bg-zinc-500/15', text: 'text-zinc-400', icon: Square },
};

// ─── Helpers ────────────────────────────────────────────
function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${s % 60}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${m % 60}m`;
}

function shortId(id: string): string {
  return id.slice(0, 8);
}

const SAMPLE_CODE = `// Sandbox Nativo CHIMERA — Execução Isolada
// Agentes podem executar JavaScript/TypeScript com segurança

function fibonacci(n) {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

// Gerar sequência Fibonacci
const results = [];
for (let i = 0; i < 15; i++) {
  results.push(fibonacci(i));
}
console.log('Fibonacci sequence:', results.join(', '));
console.log('Sum:', results.reduce((a, b) => a + b, 0));

// Análise de dados
const data = results.map(v => ({ value: v, isPrime: !results.slice(2, v).some(d => v % d === 0) }));
console.log('Prime numbers in sequence:', data.filter(d => d.isPrime).map(d => d.value));

'Fibonacci(0..14) processed. Total primes found: ' + data.filter(d => d.isPrime).length;`;

// ═══════════════════════════════════════════════════════════
// SANDBOX TAB COMPONENT
// ═══════════════════════════════════════════════════════════

export function SandboxTab() {
  // ─── State ────────────────────────────────────────────
  const [health, setHealth] = useState<SandboxHealth | null>(null);
  const [agents, setAgents] = useState<SandboxAgent[]>([]);
  const [llmStatus, setLlmStatus] = useState<LLMStatus | null>(null);
  const [evoEvents, setEvoEvents] = useState<EvolutionEvent[]>([]);
  const [code, setCode] = useState(SAMPLE_CODE);
  const [execResult, setExecResult] = useState<ExecutionResult | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(null);
  const [llmInput, setLlmInput] = useState('');
  const [llmChat, setLlmChat] = useState<Array<{ role: string; content: string }>>([]);
  const [llmLoading, setLlmLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [newAgentName, setNewAgentName] = useState('');
  const [newAgentTier, setNewAgentTier] = useState('scout');
  const [activeSubTab, setActiveSubTab] = useState<'execute' | 'agents' | 'llm' | 'evolution'>('execute');
  const chatEndRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Data ───────────────────────────────────────
  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/sandbox/status');
      const data = await res.json();
      setHealth(data.health);
      setLlmStatus(data.llm);
      setEvoEvents(data.recentEvo ?? []);
    } catch { /* silent */ }
  }, []);

  const fetchAgents = useCallback(async () => {
    try {
      const res = await fetch('/api/sandbox/agents');
      const data = await res.json();
      setAgents(data.agents ?? []);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchAgents();
    const interval = setInterval(() => { fetchStatus(); fetchAgents(); }, 5000);
    return () => clearInterval(interval);
  }, [fetchStatus, fetchAgents]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [llmChat]);

  // ─── Actions ──────────────────────────────────────────
  const handleExecute = async () => {
    if (!code.trim()) return;
    setIsExecuting(true);
    setExecResult(null);
    try {
      const res = await fetch('/api/sandbox/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, language: 'javascript', agentId: selectedAgent ?? undefined }),
      });
      const result = await res.json();
      setExecResult(result);
      fetchStatus();
      fetchAgents();
    } catch (err) {
      setExecResult({ success: false, output: '', error: String(err), exitCode: 500, executionTimeMs: 0, memoryUsedMB: 0, sandboxId: '', timestamp: new Date().toISOString(), logs: [] });
    }
    setIsExecuting(false);
  };

  const handleSpawnAgent = async () => {
    if (!newAgentName.trim()) return;
    try {
      await fetch('/api/sandbox/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newAgentName, tier: newAgentTier }),
      });
      setNewAgentName('');
      fetchAgents();
      fetchStatus();
    } catch { /* silent */ }
  };

  const handleAgentAction = async (agentId: string, action: string, extra?: Record<string, string>) => {
    try {
      await fetch(`/api/sandbox/agents/${agentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...extra }),
      });
      fetchAgents();
      fetchStatus();
    } catch { /* silent */ }
  };

  const handleLLMSend = async () => {
    if (!llmInput.trim()) return;
    const userMsg = llmInput;
    setLlmChat(prev => [...prev, { role: 'user', content: userMsg }]);
    setLlmInput('');
    setLlmLoading(true);
    try {
      const res = await fetch('/api/sandbox/llm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          agentId: selectedAgent ?? undefined,
          conversationId: conversationId ?? undefined,
        }),
      });
      const data = await res.json();
      setLlmChat(prev => [...prev, { role: 'assistant', content: data.response }]);
      if (data.conversationId) setConversationId(data.conversationId);
      fetchStatus();
    } catch (err) {
      setLlmChat(prev => [...prev, { role: 'assistant', content: `Erro: ${err}` }]);
    }
    setLlmLoading(false);
  };

  const handleEvolutionCycle = async () => {
    try {
      await fetch('/api/sandbox/evolution', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      fetchStatus();
      fetchAgents();
    } catch { /* silent */ }
  };

  const handleGC = async () => {
    try {
      await fetch('/api/sandbox/status', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
      fetchStatus();
      fetchAgents();
    } catch { /* silent */ }
  };

  // ─── Sub-tab config ──────────────────────────────────
  const subTabs = [
    { key: 'execute' as const, label: 'Execucao', icon: Terminal },
    { key: 'agents' as const, label: 'Agentes', icon: Box },
    { key: 'llm' as const, label: 'LLM Dedicado', icon: Brain },
    { key: 'evolution' as const, label: 'Evolucao', icon: Dna },
  ];

  // ═══ RENDER ═══════════════════════════════════════════
  return (
    <div className="space-y-5">
      {/* ═══ QUICK STATS ROW ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total Agentes', value: health?.totalAgents ?? 0, icon: Box, color: '#00ff88' },
          { label: 'Ativos', value: health?.activeAgents ?? 0, icon: Activity, color: '#22d3ee' },
          { label: 'Execucoes', value: health?.totalExecutions ?? 0, icon: Terminal, color: '#a855f7' },
          { label: 'LLM Calls', value: health?.llmInteractions ?? 0, icon: Brain, color: '#f97316' },
          { label: 'Memoria (MB)', value: health?.memoryUsageMB ?? 0, icon: MemoryStick, color: '#4ed6a5' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl backdrop-blur-sm">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: stat.color + '15', border: `1px solid ${stat.color}30` }}>
                  <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-lg font-bold text-zinc-100 leading-none">{stat.value}</p>
                  <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ═══ SUB-TAB NAVIGATION ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-zinc-900/40 rounded-lg p-1 border border-zinc-800/30">
          {subTabs.map(tab => {
            const isActive = activeSubTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveSubTab(tab.key)}
                className={cn(
                  'flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer',
                  isActive
                    ? 'bg-[#00ff88]/10 text-[#00ff88] shadow-sm'
                    : 'text-zinc-500 hover:text-zinc-300'
                )}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 ml-auto">
          <Badge variant="outline" className={cn('text-[10px] border',
            health?.status === 'healthy' ? 'border-emerald-500/30 text-emerald-400' :
            health?.status === 'degraded' ? 'border-orange-500/30 text-orange-400' :
            'border-red-500/30 text-red-400'
          )}>
            <Activity className="w-2.5 h-2.5 mr-1" />
            {health?.status ?? '...'}
          </Badge>
          <Badge variant="outline" className="border-zinc-700 text-zinc-400 text-[10px]">
            <Clock className="w-2.5 h-2.5 mr-1" />
            {health ? formatUptime(health.uptimeMs) : '...'}
          </Badge>
        </div>
      </div>

      {/* ═══ SUB-TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        <motion.div key={activeSubTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}>

          {/* ──── EXECUTE TAB ──── */}
          {activeSubTab === 'execute' && (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
              {/* Code Editor */}
              <Card className="lg:col-span-3 bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      <Terminal className="w-4 h-4 text-[#00ff88]" />
                      Sandbox de Execucao
                      {selectedAgent && (
                        <Badge className="bg-purple-500/15 text-purple-400 text-[9px] border-purple-500/20 ml-2">
                          Agente: {agents.find(a => a.id === selectedAgent)?.name ?? shortId(selectedAgent)}
                        </Badge>
                      )}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500">JavaScript</Badge>
                      <Button
                        size="sm"
                        onClick={handleExecute}
                        disabled={isExecuting || !code.trim()}
                        className="bg-[#00ff88]/15 text-[#00ff88] hover:bg-[#00ff88]/25 border border-[#00ff88]/30 text-xs h-7 px-3"
                      >
                        {isExecuting ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                        {isExecuting ? 'Executando...' : 'Executar'}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <Textarea
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="font-mono text-xs bg-zinc-950/80 border-zinc-800/60 text-emerald-300 min-h-[320px] resize-y focus:border-[#00ff88]/30"
                    placeholder="// Escreva codigo JavaScript aqui..."
                    spellCheck={false}
                  />
                </CardContent>
              </Card>

              {/* Output Panel */}
              <div className="lg:col-span-2 space-y-4">
                <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                  <CardHeader className="pb-3 px-4 pt-4">
                    <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      {execResult?.success ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      ) : execResult ? (
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                      ) : (
                        <Eye className="w-4 h-4 text-zinc-500" />
                      )}
                      Resultado
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-4">
                    {execResult ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-zinc-950/60 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-zinc-500">Tempo</p>
                            <p className="text-xs font-bold text-cyan-400">{execResult.executionTimeMs}ms</p>
                          </div>
                          <div className="bg-zinc-950/60 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-zinc-500">Memoria</p>
                            <p className="text-xs font-bold text-purple-400">{execResult.memoryUsedMB}MB</p>
                          </div>
                          <div className="bg-zinc-950/60 rounded-lg p-2 text-center">
                            <p className="text-[9px] text-zinc-500">Status</p>
                            <p className={cn('text-xs font-bold', execResult.success ? 'text-emerald-400' : 'text-red-400')}>
                              {execResult.success ? 'OK' : 'ERR'}
                            </p>
                          </div>
                        </div>
                        <div className="bg-zinc-950/80 rounded-lg p-3 max-h-[200px] overflow-auto">
                          <pre className="text-[11px] text-zinc-300 whitespace-pre-wrap font-mono">
                            {execResult.output || execResult.error || '(sem saida)'}
                          </pre>
                        </div>
                        <div className="flex items-center gap-2 text-[9px] text-zinc-600">
                          <span>Sandbox: {shortId(execResult.sandboxId)}</span>
                          <span>|</span>
                          <span>Logs: {execResult.logs.length}</span>
                          <span>|</span>
                          <span>Exit: {execResult.exitCode}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <Terminal className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-xs text-zinc-600">Execute codigo para ver resultado</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Agent selector for execution */}
                <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                  <CardHeader className="pb-2 px-4 pt-3">
                    <CardTitle className="text-xs font-medium text-zinc-400 flex items-center gap-2">
                      <Box className="w-3.5 h-3.5" />
                      Agente Executor
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3">
                    <div className="flex gap-2 flex-wrap">
                      <Button
                        size="sm"
                        variant={selectedAgent === null ? 'default' : 'outline'}
                        className={cn('text-[10px] h-7',
                          selectedAgent === null
                            ? 'bg-zinc-800 text-zinc-200 border-zinc-700'
                            : 'border-zinc-800 text-zinc-500'
                        )}
                        onClick={() => setSelectedAgent(null)}
                      >
                        Sistema
                      </Button>
                      {agents.filter(a => ['idle', 'executing'].includes(a.status)).slice(0, 4).map(a => (
                        <Button
                          key={a.id}
                          size="sm"
                          variant={selectedAgent === a.id ? 'default' : 'outline'}
                          className={cn('text-[10px] h-7',
                            selectedAgent === a.id
                              ? 'bg-purple-500/15 text-purple-400 border-purple-500/30'
                              : 'border-zinc-800 text-zinc-500'
                          )}
                          onClick={() => setSelectedAgent(a.id)}
                        >
                          {a.name}
                        </Button>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ──── AGENTS TAB ──── */}
          {activeSubTab === 'agents' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Spawn New Agent */}
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Plus className="w-4 h-4 text-[#00ff88]" />
                    Spawn Agente
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <Input
                    value={newAgentName}
                    onChange={e => setNewAgentName(e.target.value)}
                    placeholder="Nome do agente..."
                    className="bg-zinc-950/60 border-zinc-800/60 text-xs h-9"
                    onKeyDown={e => e.key === 'Enter' && handleSpawnAgent()}
                  />
                  <div className="flex gap-2">
                    {(['scout', 'worker', 'expert', 'elite', 'architect'] as const).map(tier => (
                      <button
                        key={tier}
                        onClick={() => setNewAgentTier(tier)}
                        className={cn(
                          'flex-1 py-1.5 rounded-md text-[10px] font-medium transition-all cursor-pointer border',
                          newAgentTier === tier
                            ? 'text-white shadow-sm'
                            : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                        )}
                        style={newAgentTier === tier ? {
                          background: TIER_COLORS[tier] + '20',
                          borderColor: TIER_COLORS[tier] + '50',
                          color: TIER_COLORS[tier],
                        } : {}}
                      >
                        {tier}
                      </button>
                    ))}
                  </div>
                  <Button
                    onClick={handleSpawnAgent}
                    disabled={!newAgentName.trim()}
                    className="w-full bg-[#00ff88]/15 text-[#00ff88] hover:bg-[#00ff88]/25 border border-[#00ff88]/30 text-xs h-9"
                  >
                    <Plus className="w-3.5 h-3.5 mr-1.5" />
                    Spawn
                  </Button>

                  {/* Agent Tiers Legend */}
                  <div className="pt-3 border-t border-zinc-800/30 space-y-2">
                    <p className="text-[10px] text-zinc-500 font-medium">Tiers — Capacidades</p>
                    {([
                      ['scout', 'Exec basica, 64MB, 5s'],
                      ['worker', 'Exec + LLM, 128MB, 15s'],
                      ['expert', 'Tools + CodeGen, 256MB, 30s'],
                      ['elite', 'Full access, 512MB, 60s, Spawn'],
                      ['architect', 'Governance, 1GB, 120s, 10 tasks'],
                    ] as const).map(([tier, desc]) => (
                      <div key={tier} className="flex items-center gap-2 text-[10px]">
                        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: TIER_COLORS[tier] }} />
                        <span className="text-zinc-400 font-medium w-14">{tier}</span>
                        <span className="text-zinc-600">{desc}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Agents List */}
              <Card className="lg:col-span-2 bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      <Network className="w-4 h-4 text-cyan-400" />
                      Agentes ({agents.length})
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" className="h-7 text-[10px] text-zinc-500 hover:text-red-400" onClick={() => {
                        fetch('/api/sandbox/agents', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'purge-recycled' }) }).then(fetchAgents);
                      }}>
                        <Trash2 className="w-3 h-3 mr-1" />Purge
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {agents.length === 0 ? (
                      <div className="text-center py-10">
                        <Box className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-xs text-zinc-600">Nenhum agente spawnado</p>
                        <p className="text-[10px] text-zinc-700 mt-1">Use o painel ao lado para criar agentes</p>
                      </div>
                    ) : (
                      agents.map((agent, i) => {
                        const statusCfg = STATUS_COLORS[agent.status] ?? STATUS_COLORS.idle;
                        return (
                          <motion.div
                            key={agent.id}
                            initial={{ opacity: 0, x: -8 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/30 hover:border-zinc-700/40 transition-all"
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                  style={{ background: TIER_COLORS[agent.tier] + '15', border: `1px solid ${TIER_COLORS[agent.tier]}30` }}>
                                  <Box className="w-3.5 h-3.5" style={{ color: TIER_COLORS[agent.tier] }} />
                                </div>
                                <div className="min-w-0">
                                  <div className="flex items-center gap-2">
                                    <p className="text-xs font-semibold text-zinc-200 truncate">{agent.name}</p>
                                    <Badge className="text-[8px] px-1.5 py-0 h-4" style={{
                                      background: TIER_COLORS[agent.tier] + '15',
                                      color: TIER_COLORS[agent.tier],
                                      border: `1px solid ${TIER_COLORS[agent.tier]}30`,
                                    }}>{agent.tier}</Badge>
                                  </div>
                                  <p className="text-[10px] text-zinc-600 mt-0.5">{shortId(agent.id)} &middot; Gen {agent.generation}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <Badge className={cn('text-[9px] px-1.5 py-0 h-4', statusCfg.bg, statusCfg.text)}>
                                  <statusCfg.icon className="w-2.5 h-2.5 mr-1" />
                                  {agent.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2 mt-2.5">
                              <div className="text-center">
                                <p className="text-[9px] text-zinc-600">Score</p>
                                <p className="text-[11px] font-bold" style={{ color: agent.metrics.performanceScore >= 0.7 ? '#4ed6a5' : agent.metrics.performanceScore >= 0.4 ? '#fbbf24' : '#e01b24' }}>
                                  {(agent.metrics.performanceScore * 100).toFixed(0)}%
                                </p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-zinc-600">Tasks</p>
                                <p className="text-[11px] font-bold text-zinc-300">{agent.metrics.tasksCompleted}/{agent.metrics.tasksFailed}</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-zinc-600">Latencia</p>
                                <p className="text-[11px] font-bold text-cyan-400">{agent.metrics.avgLatencyMs}ms</p>
                              </div>
                              <div className="text-center">
                                <p className="text-[9px] text-zinc-600">Execs</p>
                                <p className="text-[11px] font-bold text-purple-400">{agent.totalExecutions}</p>
                              </div>
                            </div>
                            {/* Action Buttons */}
                            <div className="flex items-center gap-1.5 mt-2.5 pt-2.5 border-t border-zinc-800/20">
                              {agent.status !== 'recycled' && agent.status !== 'dead' && (
                                <>
                                  <Button size="sm" variant="ghost" className="h-6 text-[9px] text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 px-2"
                                    onClick={() => handleAgentAction(agent.id, 'promote')}>
                                    <ArrowUp className="w-2.5 h-2.5 mr-1" />Promote
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-[9px] text-orange-500 hover:text-orange-400 hover:bg-orange-500/10 px-2"
                                    onClick={() => handleAgentAction(agent.id, 'demote')}>
                                    <ArrowDown className="w-2.5 h-2.5 mr-1" />Demote
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-[9px] text-blue-500 hover:text-blue-400 hover:bg-blue-500/10 px-2"
                                    onClick={() => handleAgentAction(agent.id, 'heal')}>
                                    <Heart className="w-2.5 h-2.5 mr-1" />Heal
                                  </Button>
                                  <Button size="sm" variant="ghost" className="h-6 text-[9px] text-red-500 hover:text-red-400 hover:bg-red-500/10 px-2"
                                    onClick={() => handleAgentAction(agent.id, 'recycle')}>
                                    <Skull className="w-2.5 h-2.5 mr-1" />Recycle
                                  </Button>
                                </>
                              )}
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──── LLM DEDICADO TAB ──── */}
          {activeSubTab === 'llm' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              {/* LLM Status */}
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    LLM Dedicado
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="bg-zinc-950/60 rounded-lg p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Provider</span>
                      <Badge className="text-[9px] bg-purple-500/15 text-purple-400 border-purple-500/20">
                        {llmStatus?.config.provider ?? 'ollama'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Modelo</span>
                      <span className="text-[10px] text-zinc-300 font-mono">{llmStatus?.config.model ?? 'llama3.1:8b'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Temperatura</span>
                      <span className="text-[10px] text-zinc-300">{llmStatus?.config.temperature ?? 0.7}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] text-zinc-500">Modo</span>
                      <span className="text-[9px] text-cyan-400 font-medium">Local-First</span>
                    </div>
                  </div>

                  {/* Fallback Chain */}
                  <div className="space-y-1.5">
                    <p className="text-[10px] text-zinc-500 font-medium">Fallback Chain</p>
                    <div className="flex flex-col gap-1">
                      {(llmStatus?.fallbackChain ?? ['ollama', 'deepseek', 'groq', 'openai', 'anthropic', 'gemini']).map((p, i) => (
                        <div key={p} className="flex items-center gap-2 text-[10px]">
                          <ChevronRight className="w-2.5 h-2.5 text-zinc-700" />
                          <span className={i === 0 ? 'text-[#00ff88] font-medium' : 'text-zinc-500'}>{p}</span>
                          {i === 0 && <Badge className="text-[8px] h-3 px-1 bg-[#00ff88]/10 text-[#00ff88] border-[#00ff88]/20 ml-auto">primary</Badge>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {selectedAgent && (
                    <div className="pt-3 border-t border-zinc-800/30">
                      <p className="text-[10px] text-zinc-500">Agente vinculado</p>
                      <p className="text-xs text-purple-400 font-medium mt-0.5">
                        {agents.find(a => a.id === selectedAgent)?.name ?? shortId(selectedAgent)}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* LLM Chat */}
              <Card className="lg:col-span-3 bg-zinc-900/60 border-zinc-800/40 rounded-xl flex flex-col">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#00ff88]" />
                    Chat com LLM Dedicado
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 flex-1 flex flex-col">
                  <div className="flex-1 bg-zinc-950/60 rounded-lg p-4 min-h-[300px] max-h-[400px] overflow-y-auto space-y-3">
                    {llmChat.length === 0 ? (
                      <div className="text-center py-16">
                        <Brain className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-xs text-zinc-600">Converse com o LLM Dedicado do Sandbox</p>
                        <p className="text-[10px] text-zinc-700 mt-1">Raciocinio, geracao de codigo, analise de agentes</p>
                      </div>
                    ) : (
                      llmChat.map((msg, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={cn(
                            'rounded-lg p-3 text-xs',
                            msg.role === 'user'
                              ? 'bg-purple-500/10 border border-purple-500/20 ml-8'
                              : 'bg-zinc-800/40 border border-zinc-800/30 mr-8'
                          )}
                        >
                          <p className={cn('text-[9px] font-medium mb-1.5',
                            msg.role === 'user' ? 'text-purple-400' : 'text-[#00ff88]'
                          )}>
                            {msg.role === 'user' ? 'Voce' : 'LLM Dedicado'}
                          </p>
                          <p className="text-zinc-300 whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        </motion.div>
                      ))
                    )}
                    {llmLoading && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-lg p-3 bg-zinc-800/40 border border-zinc-800/30 mr-8"
                      >
                        <p className="text-[9px] font-medium text-[#00ff88] mb-1.5">LLM Dedicado</p>
                        <div className="flex items-center gap-1.5">
                          <RefreshCw className="w-3 h-3 text-[#00ff88] animate-spin" />
                          <span className="text-zinc-500 text-[10px]">Pensando...</span>
                        </div>
                      </motion.div>
                    )}
                    <div ref={chatEndRef} />
                  </div>
                  <div className="flex items-center gap-2 mt-3">
                    <Input
                      value={llmInput}
                      onChange={e => setLlmInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && !e.shiftKey && handleLLMSend()}
                      placeholder="Pergunte ao LLM Dedicado..."
                      className="flex-1 bg-zinc-950/60 border-zinc-800/60 text-xs h-9"
                      disabled={llmLoading}
                    />
                    <Button
                      onClick={handleLLMSend}
                      disabled={llmLoading || !llmInput.trim()}
                      className="bg-[#00ff88]/15 text-[#00ff88] hover:bg-[#00ff88]/25 border border-[#00ff88]/30 text-xs h-9 px-3"
                    >
                      {llmLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──── EVOLUTION TAB ──── */}
          {activeSubTab === 'evolution' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Evolution Controls */}
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Dna className="w-4 h-4 text-[#00ff88]" />
                    Selecao Natural Digital
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <p className="text-[10px] text-zinc-500 leading-relaxed">
                    Agentes com score acima de 80% sao promovidos. Abaixo de 30%,
                    sao rebaixados. Abaixo de 10% com mais de 5 falhas, sao reciclados.
                  </p>
                  <Button
                    onClick={handleEvolutionCycle}
                    className="w-full bg-[#00ff88]/15 text-[#00ff88] hover:bg-[#00ff88]/25 border border-[#00ff88]/30 text-xs h-9"
                  >
                    <Dna className="w-3.5 h-3.5 mr-1.5" />
                    Executar Ciclo Evolutivo
                  </Button>
                  <Button
                    onClick={handleGC}
                    variant="outline"
                    className="w-full border-zinc-800 text-zinc-400 hover:text-zinc-200 text-xs h-9"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                    Garbage Collection
                  </Button>

                  {/* Agents by Tier */}
                  <div className="pt-3 border-t border-zinc-800/30 space-y-2">
                    <p className="text-[10px] text-zinc-500 font-medium">Distribuicao por Tier</p>
                    {Object.entries(health?.agentsByTier ?? {}).map(([tier, count]) => (
                      <div key={tier} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ background: TIER_COLORS[tier] }} />
                        <span className="text-[10px] text-zinc-400 w-16">{tier}</span>
                        <div className="flex-1 bg-zinc-800/50 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full transition-all"
                            style={{
                              width: agents.length > 0 ? `${(count / agents.length) * 100}%` : '0%',
                              background: TIER_COLORS[tier],
                            }}
                          />
                        </div>
                        <span className="text-[10px] text-zinc-500 w-4 text-right">{count}</span>
                      </div>
                    ))}
                  </div>

                  {/* Agents by Status */}
                  <div className="pt-3 border-t border-zinc-800/30 space-y-1.5">
                    <p className="text-[10px] text-zinc-500 font-medium">Distribuicao por Status</p>
                    {Object.entries(health?.agentsByStatus ?? {}).filter(([, v]) => v > 0).map(([status, count]) => {
                      const cfg = STATUS_COLORS[status] ?? STATUS_COLORS.idle;
                      return (
                        <div key={status} className="flex items-center gap-2 text-[10px]">
                          <cfg.icon className="w-2.5 h-2.5" style={{ color: undefined }} />
                          <span className={cfg.text}>{status}</span>
                          <span className="text-zinc-600 ml-auto">{count}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              {/* Evolution Events Timeline */}
              <Card className="lg:col-span-2 bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-cyan-400" />
                      Eventos de Evolucao
                    </CardTitle>
                    <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500">
                      {health?.evolutionEvents ?? 0} total
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {evoEvents.length === 0 ? (
                      <div className="text-center py-10">
                        <Dna className="w-8 h-8 text-zinc-800 mx-auto mb-2" />
                        <p className="text-xs text-zinc-600">Nenhum evento de evolucao</p>
                        <p className="text-[10px] text-zinc-700 mt-1">Execute um ciclo evolutivo para gerar eventos</p>
                      </div>
                    ) : (
                      evoEvents.map((evt, i) => {
                        const typeColors: Record<string, string> = {
                          spawn: '#60a5fa', promote: '#00ff88', demote: '#f97316',
                          recycle: '#e01b24', learn: '#a855f7', heal: '#22d3ee', mutate: '#fbbf24',
                        };
                        const color = typeColors[evt.type] ?? '#71717a';
                        const agent = agents.find(a => a.id === evt.agentId);
                        return (
                          <motion.div
                            key={evt.id}
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.03 }}
                            className="flex items-start gap-3 bg-zinc-950/40 rounded-lg p-3 border border-zinc-800/20"
                          >
                            <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                              style={{ background: color + '15', border: `1px solid ${color}30` }}>
                              <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] font-medium" style={{ color }}>{evt.type.toUpperCase()}</span>
                                <span className="text-[9px] text-zinc-600">
                                  {agent?.name ?? shortId(evt.agentId)}
                                </span>
                              </div>
                              <p className="text-[10px] text-zinc-500 mt-0.5 truncate">{evt.reason}</p>
                              <p className="text-[9px] text-zinc-700 mt-0.5">
                                {new Date(evt.timestamp).toLocaleTimeString('pt-BR')}
                              </p>
                            </div>
                          </motion.div>
                        );
                      })
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ═══ SECURITY FOOTER ═══ */}
      <div className="flex items-center justify-between text-[9px] text-zinc-700 border-t border-zinc-800/20 pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" />VM Isolation</span>
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />Resource Limits</span>
          <span className="flex items-center gap-1"><Eye className="w-3 h-3" />Audit Logging</span>
        </div>
        <span>CHIMERA Sandbox Nativo v1.0 &bull; {new Date().getFullYear()}</span>
      </div>
    </div>
  );
}
