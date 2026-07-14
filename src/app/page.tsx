'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import {
  Search, Bot, BarChart3, ExternalLink, Github,
  MapPin, Calendar, Sparkles, Globe, Send, Loader2,
  Filter, TrendingUp, Users, Zap, Activity, Layers,
  Building2, Clock, Eye, MessageSquare, ChevronRight,
  ArrowUpRight, Cpu, BrainCircuit
} from 'lucide-react';

/* ================================================================
   TYPES
   ================================================================ */
interface Project {
  id: string; name: string; description: string; author: string;
  authorCity?: string | null; category: string; dateAdded: string; source: string;
  status?: string | null; url?: string;
}

interface ChatMsg { role: 'user' | 'agent' | 'system'; content: string; }

interface Stats {
  total: number; active: number; closed: number; developing: number;
  byCategory: Record<string, number>;
  byMonth: { month: string; count: number }[];
  bySource: Record<string, number>;
  topAuthors: { name: string; count: number }[];
  uniqueAuthors: number;
  topCities: { city: string; count: number }[];
  recentProjects: { name: string; author: string; category: string; dateAdded: string; url?: string }[];
}

/* ================================================================
   CONSTANTS
   ================================================================ */
const CAT_COLORS: Record<string, string> = {
  'AI': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  '开发者工具': 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  '内容创作': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  '设计工具': 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  '效率工具': 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  '游戏': 'bg-red-500/20 text-red-400 border-red-500/30',
  '社交': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  '金融': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  '教育': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  '健康': 'bg-lime-500/20 text-lime-400 border-lime-500/30',
  '其他': 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30',
  'SaaS': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  '数据分析': 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30',
  '社交媒体': 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  '写作': 'bg-rose-500/20 text-rose-400 border-rose-500/30',
};
const catColor = (c: string) => CAT_COLORS[c] || CAT_COLORS['其他'] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
const statusDot = (s?: string | null) =>
  s === 'active' ? 'bg-emerald-400' : s === 'developing' ? 'bg-amber-400' : s === 'closed' ? 'bg-red-400' : 'bg-zinc-600';

const PIE_COLORS = ['bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-sky-500', 'bg-pink-500', 'bg-teal-500', 'bg-orange-500', 'bg-indigo-500'];

/* ================================================================
   PANEL 1-4: KPI STAT CARDS
   ================================================================ */
function KpiCard({ label, value, icon: Icon, color, sub }: {
  label: string; value: string | number; icon: any; color: string; sub?: string;
}) {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-0 py-4 px-4 hover:border-zinc-700 transition-all group">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">{label}</span>
        <div className={`p-1.5 rounded-lg ${color} bg-opacity-10`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</div>
      {sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}
    </Card>
  );
}

/* ================================================================
   PANEL 5: STATUS BREAKDOWN
   ================================================================ */
function StatusPanel({ stats }: { stats: Stats }) {
  const total = stats.total || 1;
  const items = [
    { label: 'Ativos', count: stats.active, color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: Activity },
    { label: 'Em Desenvolvimento', count: stats.developing, color: 'bg-amber-500', textColor: 'text-amber-400', icon: Clock },
    { label: 'Encerrados', count: stats.closed, color: 'bg-red-500/80', textColor: 'text-red-400', icon: Eye },
  ];
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <Activity className="w-4 h-4 text-emerald-400" />Status dos Projetos
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* Stacked bar */}
        <div className="flex h-4 rounded-full overflow-hidden bg-zinc-800">
          {items.map((item) => (
            <div
              key={item.label}
              className={`${item.color} transition-all duration-700`}
              style={{ width: `${(item.count / total) * 100}%`, minWidth: item.count > 0 ? '4px' : '0' }}
            />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-2">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2">
              <item.icon className={`w-3.5 h-3.5 ${item.textColor}`} />
              <div>
                <div className="text-lg font-bold text-zinc-100">{item.count.toLocaleString()}</div>
                <div className="text-[10px] text-zinc-500">{item.label}</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   PANEL 6: CATEGORY BREAKDOWN
   ================================================================ */
function CategoryPanel({ stats }: { stats: Stats }) {
  const entries = Object.entries(stats.byCategory || {}).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <Layers className="w-4 h-4 text-purple-400" />Distribuicao por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-72">
          <div className="space-y-2 pr-2">
            {entries.map(([cat, count]) => (
              <div key={cat} className="group">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-zinc-300 font-medium group-hover:text-emerald-400 transition-colors">{cat}</span>
                  <span className="text-zinc-500 font-mono">{count}</span>
                </div>
                <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${catColor(cat).split(' ')[0]}`}
                    style={{ width: `${(count / max) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   PANEL 7: MONTHLY TREND
   ================================================================ */
function TrendPanel({ stats }: { stats: Stats }) {
  const data = stats.byMonth || [];
  const maxM = data.length > 0 ? Math.max(...data.map(m => m.count)) : 1;
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-amber-400" />Tendencia Mensal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-[2px] h-44">
          {data.slice(-24).map((m, i) => {
            const h = (m.count / maxM) * 100;
            return (
              <Tooltip key={i}>
                <TooltipTrigger asChild>
                  <div className="flex-1 min-w-0 flex flex-col items-center justify-end h-full">
                    <div
                      className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 rounded-t-sm transition-all"
                      style={{ height: `${h}%`, minHeight: m.count > 0 ? '2px' : '0' }}
                    />
                  </div>
                </TooltipTrigger>
                <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-300 text-[10px]">
                  {m.month}: {m.count} projetos
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <div className="flex justify-between text-[10px] text-zinc-600 mt-1.5 px-0.5">
          <span>{data[0]?.month || ''}</span>
          <span>{data[data.length - 1]?.month || ''}</span>
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   PANEL 8: TOP AUTHORS
   ================================================================ */
function AuthorsPanel({ stats }: { stats: Stats }) {
  const authors = stats.topAuthors || [];
  const maxA = authors[0]?.count || 1;
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <Users className="w-4 h-4 text-purple-400" />Top 10 Desenvolvedores
        </CardTitle>
        <CardDescription className="text-[10px] text-zinc-500">Maior numero de projetos independentes</CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="max-h-72">
          <div className="space-y-1.5 pr-2">
            {authors.map((a, i) => (
              <div key={i} className="flex items-center gap-2.5 text-xs group">
                <span className="w-5 text-right text-zinc-600 font-mono text-[10px]">{i + 1}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-zinc-300 truncate font-medium group-hover:text-emerald-400 transition-colors">{a.name}</span>
                    <span className="text-zinc-500 font-mono ml-2">{a.count}</span>
                  </div>
                  <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500/60 rounded-full transition-all duration-500" style={{ width: `${(a.count / maxA) * 100}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {!authors.length && <p className="text-xs text-zinc-600">Sem dados</p>}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   PANEL 9: SOURCE DISTRIBUTION
   ================================================================ */
function SourcePanel({ stats }: { stats: Stats }) {
  const entries = Object.entries(stats.bySource || {});
  const total = entries.reduce((a, [, b]) => a + b, 0) || 1;
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <Github className="w-4 h-4 text-sky-400" />Distribuicao por Fonte
        </CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length > 0 ? (
          <div className="flex items-center gap-6">
            <div className="w-32 h-32 rounded-full flex-shrink-0 relative" style={{
              background: `conic-gradient(${entries.map(([, v], i) => {
                const pct = (v / total) * 100;
                const prev = entries.slice(0, i).reduce((a, [, b]) => a + b, 0);
                const prevPct = (prev / total) * 100;
                return `${PIE_COLORS[i % PIE_COLORS.length].replace('bg-', '#')} ${prevPct}% ${prevPct + pct}%`;
              }).join(', ')})`
            }}>
              <div className="absolute inset-3 rounded-full bg-zinc-900" />
            </div>
            <div className="space-y-2 flex-1">
              {entries.map(([s, v], i) => (
                <div key={s} className="flex items-center gap-2.5 text-xs">
                  <span className={`w-3 h-3 rounded-sm ${PIE_COLORS[i % PIE_COLORS.length]}`} />
                  <span className="text-zinc-300 flex-1 capitalize">{s}</span>
                  <span className="text-zinc-500 font-mono">{v}</span>
                  <span className="text-zinc-600 text-[10px]">{Math.round((v / total) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <p className="text-xs text-zinc-600">Sem dados de fonte</p>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================
   PANEL 10: AI INSIGHTS (LLM Analysis)
   ================================================================ */
function AiInsightsPanel() {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'analyze' })
      });
      const data = await res.json();
      setInsight(data.analysis || 'Analise indisponivel.');
    } catch { setInsight('Servico de analise indisponivel.'); }
    setLoading(false);
  };

  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-emerald-400" />AI Insights — Analise LLM
        </CardTitle>
        <CardDescription className="text-[10px] text-zinc-500">Analise inteligente do ecossistema via LLM</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <Button onClick={analyze} disabled={loading} size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
          Gerar Analise AI
        </Button>
        {insight && (
          <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
            {insight}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/* ================================================================
   EXTRA: TOP CITIES PANEL (bonus data from stats)
   ================================================================ */
function CitiesPanel({ stats }: { stats: Stats }) {
  const cities = stats.topCities || [];
  const maxC = cities[0]?.count || 1;
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <Building2 className="w-4 h-4 text-cyan-400" />Top Cidades
        </CardTitle>
        <CardDescription className="text-[10px] text-zinc-500">Localizacao dos desenvolvedores independentes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {cities.slice(0, 8).map((c, i) => (
            <div key={i} className="flex items-center gap-2 text-xs">
              <span className="w-5 text-right text-zinc-600 font-mono text-[10px]">{i + 1}</span>
              <span className="text-zinc-300 flex-1">{c.city || 'Desconhecida'}</span>
              <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div className="h-full bg-cyan-500/60 rounded-full" style={{ width: `${(c.count / maxC) * 100}%` }} />
              </div>
              <span className="text-zinc-500 font-mono w-8 text-right">{c.count}</span>
            </div>
          ))}
          {!cities.length && <p className="text-xs text-zinc-600">Dados de cidades indisponiveis</p>}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   RECENT PROJECTS STRIP
   ================================================================ */
function RecentStrip({ projects }: { projects: Stats['recentProjects'] }) {
  if (!projects?.length) return null;
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
          <Clock className="w-4 h-4 text-amber-400" />Projetos Recentes
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-1.5">
          {projects.map((p, i) => (
            <a key={i} href={p.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group">
              <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-emerald-400 flex-shrink-0" />
              <span className="text-zinc-200 font-medium truncate group-hover:text-emerald-400 transition-colors">{p.name}</span>
              <span className="text-zinc-600 mx-1">by</span>
              <span className="text-zinc-400 truncate">{p.author}</span>
              <span className={`ml-auto inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium ${catColor(p.category)}`}>
                {p.category}
              </span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   QUICK PROJECT SEARCH (embedded)
   ================================================================ */
function QuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Project[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<NodeJS.Timeout>();

  const search = useCallback((q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!q.trim()) { setResults([]); setOpen(false); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ search: q, page: '1', limit: '8' });
        const res = await fetch(`/api/projects?${params}`);
        const data = await res.json();
        setResults(data.projects || []);
        setOpen(true);
      } catch { setResults([]); }
      setLoading(false);
    }, 300);
  }, []);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input placeholder="Buscar nos 2.402 projetos..." value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          onFocus={() => query.trim() && setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-11 rounded-xl w-full" />
        {loading && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 animate-spin" />}
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 z-50 max-h-80 overflow-hidden">
          <ScrollArea className="max-h-80">
            {results.map(p => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0">
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(p.status)}`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-zinc-200 truncate">{p.name}</div>
                  <div className="text-[10px] text-zinc-500 truncate">{p.description}</div>
                </div>
                <span className="text-zinc-600 text-[10px] flex-shrink-0">{p.author}</span>
              </a>
            ))}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   LLM CHAT PANEL (slide-in)
   ================================================================ */
function AgentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'system', content: 'Agente AI ativo. Pergunte sobre os 2.402 projetos, tendencias, ou pecas recomendacoes.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const send = useCallback(async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setMessages(m => [...m, { role: 'user', content: msg }]);
    setInput(''); setLoading(true);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: msg }],
          context: 'Voce e um Agente AI especialista em projetos de desenvolvedores independentes chineses. Responda em Portugues. Seja conciso e util.'
        })
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'agent', content: data.response || 'Sem resposta.' }]);
    } catch {
      setMessages(m => [...m, { role: 'agent', content: 'Agente indisponivel no momento.' }]);
    }
    setLoading(false);
  }, [input, messages, loading]);

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all hover:scale-105 group">
        <MessageSquare className="w-6 h-6" />
        <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full animate-pulse" />
        <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700">
          Chat com Agente AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[480px] max-h-[70vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-emerald-500/20 flex items-center justify-center">
            <Bot className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div>
            <div className="text-xs font-semibold text-zinc-100">Agente AI</div>
            <div className="text-[9px] text-emerald-400">LLM Ativo</div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400">
            <Cpu className="w-2.5 h-2.5 mr-1" />2401
          </Badge>
          <Button variant="ghost" size="sm" onClick={() => setOpen(false)}
            className="text-zinc-500 hover:text-zinc-200 h-7 w-7 p-0">
            &times;
          </Button>
        </div>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef as React.RefObject<any>}>
        <div className="space-y-2.5">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600/90 text-white rounded-br-sm'
                  : m.role === 'system'
                  ? 'bg-zinc-800/50 text-zinc-400 text-center w-full rounded-xl border border-zinc-800'
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-sm'
              }`}>
                {m.role === 'agent' && (
                  <div className="flex items-center gap-1 mb-1 text-emerald-400 text-[9px] font-medium">
                    <Bot className="w-2.5 h-2.5" />AI Agent
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-xl rounded-bl-sm px-3 py-2 space-y-1.5">
                <Skeleton className="h-2 w-36 bg-zinc-700" />
                <Skeleton className="h-2 w-28 bg-zinc-700" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Quick actions */}
      <div className="px-3 pb-1 flex gap-1 flex-wrap">
        {['Recomendar projetos', 'Top categorias', 'Tendencias AI'].map(a => (
          <button key={a} onClick={() => send(a)}
            className="px-2 py-0.5 rounded-md text-[10px] text-zinc-400 border border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors">
            {a}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 pt-1 border-t border-zinc-800">
        <div className="flex gap-2">
          <Input value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
            placeholder="Pergunte ao Agente AI..."
            className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg h-9 text-xs" />
          <Button onClick={() => send()} disabled={loading || !input.trim()}
            className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 h-9">
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MAIN PAGE — FUSÃO LLM 2401 AGENTIC AI DASHBOARD
   ================================================================ */
export default function Home() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/projects/stats');
        const data = await res.json();
        setStats(data);
      } catch { setStats(null); }
      setLoading(false);
    })();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      {/* Scrollbar */}
      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#09090b]/85 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10">
              <BrainCircuit className="w-4.5 h-4.5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 leading-none tracking-tight flex items-center gap-2">
                Fusão LLM 2401
                <span className="text-[9px] font-medium bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/20">Agentic AI</span>
              </h1>
              <p className="text-[10px] text-zinc-500 mt-0.5">Ecosystem Dashboard &bull; 2,402 Projetos &bull; LLM Powered</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block w-72">
              <QuickSearch />
            </div>
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] bg-emerald-500/5">
              <Zap className="w-2.5 h-2.5 mr-1" />Live
            </Badge>
          </div>
        </div>
        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <QuickSearch />
        </div>
      </header>

      {/* ═══ MAIN DASHBOARD — 10 PANELS ═══ */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6 space-y-5">

        {/* ─── ROW 1: 4 KPI Cards (Panels 1-4) ─── */}
        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 bg-zinc-900 rounded-xl" />
            ))}
          </div>
        ) : stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <KpiCard label="Total Projetos" value={stats.total?.toLocaleString()} icon={Globe} color="text-emerald-400 bg-emerald-500/10" sub="Ecosistema completo" />
            <KpiCard label="Desenvolvedores" value={stats.uniqueAuthors?.toLocaleString()} icon={Users} color="text-purple-400 bg-purple-500/10" sub="Autores unicos" />
            <KpiCard label="Categorias" value={Object.keys(stats.byCategory || {}).length} icon={Layers} color="text-amber-400 bg-amber-500/10" sub="Classificacoes ativas" />
            <KpiCard label="Fontes" value={Object.keys(stats.bySource || {}).length} icon={Github} color="text-sky-400 bg-sky-500/10" sub="Repositories monitorados" />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-zinc-900 rounded-xl" />
            ))}
          </div>
        ) : stats && (
          <>
            {/* ─── ROW 2: Status + Category + Trend (Panels 5-7) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <StatusPanel stats={stats} />
              <CategoryPanel stats={stats} />
              <TrendPanel stats={stats} />
            </div>

            {/* ─── ROW 3: Authors + Source + Cities (Panels 8-9 + bonus) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <AuthorsPanel stats={stats} />
              <SourcePanel stats={stats} />
              <CitiesPanel stats={stats} />
            </div>

            {/* ─── ROW 4: AI Insights + Recent Projects (Panel 10 + bonus) ─── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <AiInsightsPanel />
              <RecentStrip projects={stats.recentProjects || []} />
            </div>
          </>
        )}
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-zinc-800/40 bg-[#09090b] mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600">
            Fusao LLM 2401 &mdash; Agentic AI Ecosystem Dashboard
          </p>
          <p className="text-[10px] text-zinc-700 flex items-center gap-1.5">
            <Cpu className="w-3 h-3" />Powered by LLM &bull; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* ═══ FLOATING AGENT CHAT ═══ */}
      <AgentChat />
    </div>
  );
}