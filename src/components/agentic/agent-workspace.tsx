'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bot, Play, Square, Wrench, Brain, Radio, Server,
  Clock, Zap, DollarSign, MessageSquare, Loader2, CheckCircle2,
  AlertCircle, XCircle, ChevronDown, ChevronRight,
} from 'lucide-react';

type StepType = 'thinking' | 'tool_call' | 'tool_result' | 'observation' | 'handoff' | 'final_answer' | 'error';

interface Step {
  iteration: number;
  type: StepType;
  content: string;
  toolCall?: { name: string };
  agentId?: string;
  targetAgentId?: string;
}

interface AgentInfo {
  id: string;
  name: string;
  role: string;
  model: string;
  provider: string;
  status: string;
  toolDetails: Array<{ id: string; name: string; category: string }>;
}

interface AgentResult {
  success: boolean;
  answer: string;
  stats: {
    steps: number;
    toolCalls: number;
    tokensUsed: number;
    durationMs: number;
    costUsd: number;
  };
  trace: Step[];
}

const STEP_ICONS: Record<StepType, typeof Bot> = {
  thinking: Brain,
  tool_call: Wrench,
  tool_result: Wrench,
  observation: MessageSquare,
  handoff: Radio,
  final_answer: CheckCircle2,
  error: AlertCircle,
};

const STEP_COLORS: Record<StepType, string> = {
  thinking: 'text-blue-400',
  tool_call: 'text-amber-400',
  tool_result: 'text-emerald-400',
  observation: 'text-purple-400',
  handoff: 'text-cyan-400',
  final_answer: 'text-green-400',
  error: 'text-red-400',
};

export function AgentWorkspace() {
  const [agents, setAgents] = useState<AgentInfo[]>([]);
  const [selectedAgent, setSelectedAgent] = useState('agentica-orchestrator');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AgentResult | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamSteps, setStreamSteps] = useState<Step[]>([]);
  const [dashData, setDashData] = useState<Record<string, unknown> | null>(null);
  const traceRef = useRef<HTMLDivElement>(null);

  // Load dashboard data
  useEffect(() => {
    fetch('/api/agentic').then(r => r.json()).then(setDashData).catch(() => {});
  }, []);

  // Load agents
  useEffect(() => {
    fetch('/api/agentic/agents').then(r => r.json()).then(d => setAgents(d.agents || [])).catch(() => {});
  }, []);

  // Auto-scroll trace
  useEffect(() => {
    if (traceRef.current) traceRef.current.scrollTop = traceRef.current.scrollHeight;
  }, [streamSteps, result?.trace]);

  const execute = useCallback(async () => {
    if (!prompt.trim() || loading) return;
    setLoading(true);
    setResult(null);
    setStreamSteps([]);

    try {
      const res = await fetch('/api/agentic/agents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ agentId: selectedAgent, prompt, strategy: 'react' }),
      });
      const data = await res.json();
      setResult(data);
    } catch {
      setResult({ success: false, answer: 'Network error', stats: { steps: 0, toolCalls: 0, tokensUsed: 0, durationMs: 0, costUsd: 0 }, trace: [] });
    } finally {
      setLoading(false);
    }
  }, [prompt, selectedAgent, loading]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 h-full">
      {/* Left Panel: Agent Selection & Config */}
      <div className="space-y-4">
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Bot className="w-4 h-4 text-blue-400" /> Agentes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {agents.map(a => (
              <button
                key={a.id}
                onClick={() => setSelectedAgent(a.id)}
                className={`w-full text-left p-2 rounded-lg transition-colors text-sm ${
                  selectedAgent === a.id
                    ? 'bg-blue-500/20 border border-blue-500/40'
                    : 'bg-zinc-800/50 border border-transparent hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-medium">{a.name}</span>
                  <Badge variant="outline" className="text-[10px] h-5">{a.role}</Badge>
                </div>
                <div className="text-xs text-zinc-500 mt-1">{a.model} / {a.provider}</div>
                <div className="text-xs text-zinc-600 mt-0.5">{a.toolDetails?.length ?? 0} tools</div>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Runtime Stats */}
        {dashData && (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Runtime
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-1 text-xs text-zinc-400">
              <div className="flex justify-between"><span>Version</span><span className="text-zinc-300">{dashData.version as string}</span></div>
              <div className="flex justify-between"><span>Native Tools</span><span className="text-zinc-300">{(dashData.tools as Record<string, unknown>)?.nativeTools as number}</span></div>
              <div className="flex justify-between"><span>MCP Servers</span><span className="text-zinc-300">{(dashData.mcp as Record<string, unknown>)?.servers as number}</span></div>
              <div className="flex justify-between"><span>Memory Entries</span><span className="text-zinc-300">{(dashData.memory as Record<string, unknown>)?.total as number}</span></div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Center Panel: Prompt & Execution */}
      <div className="space-y-4">
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-emerald-400" /> Executar
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Descreva a tarefa para o agente..."
              className="min-h-[120px] bg-zinc-800 border-zinc-700 text-sm resize-none"
              onKeyDown={e => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) execute();
              }}
            />
            <div className="flex gap-2">
              <Button
                onClick={execute}
                disabled={loading || !prompt.trim()}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Play className="w-4 h-4 mr-1" />}
                {loading ? 'Pensando...' : 'Executar'}
              </Button>
              <Button variant="outline" size="sm" onClick={() => { setResult(null); setStreamSteps([]); setPrompt(''); }}>
                <Square className="w-4 h-4 mr-1" /> Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Result */}
        {result && (
          <Card className="bg-zinc-900/80 border-zinc-800">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                {result.success ? (
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-red-400" />
                )}
                Resultado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-2 mb-3">
                <div className="bg-zinc-800 rounded p-2 text-center">
                  <div className="text-lg font-mono font-bold text-blue-400">{result.stats.steps}</div>
                  <div className="text-[10px] text-zinc-500">Steps</div>
                </div>
                <div className="bg-zinc-800 rounded p-2 text-center">
                  <div className="text-lg font-mono font-bold text-amber-400">{result.stats.toolCalls}</div>
                  <div className="text-[10px] text-zinc-500">Tools</div>
                </div>
                <div className="bg-zinc-800 rounded p-2 text-center">
                  <div className="text-lg font-mono font-bold text-purple-400">{result.stats.tokensUsed}</div>
                  <div className="text-[10px] text-zinc-500">Tokens</div>
                </div>
                <div className="bg-zinc-800 rounded p-2 text-center">
                  <div className="text-lg font-mono font-bold text-emerald-400">{result.stats.durationMs}ms</div>
                  <div className="text-[10px] text-zinc-500">Latency</div>
                </div>
              </div>
              <div className="bg-zinc-800/50 rounded p-3 text-sm text-zinc-300 max-h-[200px] overflow-y-auto whitespace-pre-wrap">
                {result.answer}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Right Panel: Trace & Tools */}
      <div className="space-y-4">
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-purple-400" /> Trace de Execucao
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px]" ref={traceRef}>
              <div className="space-y-1">
                {(result?.trace || streamSteps).map((step, i) => {
                  const Icon = STEP_ICONS[step.type] || Bot;
                  const color = STEP_COLORS[step.type] || 'text-zinc-400';
                  return (
                    <div key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-zinc-800/50">
                      <Icon className={`w-3.5 h-3.5 mt-0.5 ${color} shrink-0`} />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px] h-4 px-1.5">
                            #{step.iteration} {step.type}
                          </Badge>
                          {step.toolCall && (
                            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 bg-amber-500/20 text-amber-400">
                              {step.toolCall.name}
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400 mt-0.5 truncate">{step.content}</p>
                      </div>
                    </div>
                  );
                })}
                {(result?.trace || streamSteps).length === 0 && !loading && (
                  <p className="text-xs text-zinc-600 text-center py-8">Nenhum trace ainda. Execute um agente.</p>
                )}
                {loading && (result?.trace || streamSteps).length === 0 && (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                    <span className="text-xs text-zinc-500 ml-2">Iniciando agente...</span>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Tools Palette */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Wrench className="w-4 h-4 text-amber-400" /> Tools
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-1">
                {agents.find(a => a.id === selectedAgent)?.toolDetails?.map(t => (
                  <div key={t.id} className="flex items-center justify-between p-1.5 rounded bg-zinc-800/50">
                    <div className="flex items-center gap-2">
                      <Wrench className="w-3 h-3 text-amber-400" />
                      <span className="text-xs font-mono">{t.name}</span>
                    </div>
                    <Badge variant="outline" className="text-[9px] h-4">{t.category}</Badge>
                  </div>
                )) || <p className="text-xs text-zinc-600">Selecione um agente</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
