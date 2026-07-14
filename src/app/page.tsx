'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Search, Bot, BarChart3, ExternalLink, Github,
  MapPin, Calendar, Sparkles, Globe, Send, Loader2,
  Filter, TrendingUp, Users, Zap, Activity, Layers,
  Building2, Clock, Eye, MessageSquare, ChevronRight,
  ArrowUpRight, Cpu, BrainCircuit, ChevronDown,
  Mic, Database, Bitcoin, Wrench, LayoutDashboard,
  CpuIcon, ShieldCheck, Workflow, Code2, BookOpen,
  Radio, Server, Network, AlertCircle, RefreshCw,
  GitBranch, GitFork, Star, CircleDot,
} from 'lucide-react';
import { trpc } from '@/lib/trpc';

/* ================================================================
   TYPES
   ================================================================ */
interface ChatMsg { role: 'user' | 'agent' | 'system'; content: string; }

interface RetrievedSource {
  id?: string;
  title: string;
  source: string;
  agent: string;
  agentSlug?: string;
  score: number;
  chunkType?: string;
}

interface RagResponse {
  query: string;
  answer: string;
  retrieved: RetrievedSource[];
  contextLength: number;
  pipeline?: {
    documentsScanned: number;
    retrieved: number;
    reranked: number;
    contextChars: number;
  };
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

const PIE_COLORS = ['#10b981', '#f59e0b', '#a855f7', '#0ea5e9', '#ec4899', '#14b8a6', '#f97316', '#6366f1'];

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
   PANEL 1-4: KPI STAT CARDS
   ================================================================ */
function KpiCard({ label, value, icon: Icon, color, sub, pulse }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string; pulse?: boolean;
}) {
  return (
    <Card className="bg-zinc-900/80 border-zinc-800/80 gap-0 py-4 px-4 hover:border-zinc-700 transition-all group relative overflow-hidden">
      {pulse && (
        <div className="absolute top-2 right-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">{label}</span>
        <div className={`p-1.5 rounded-lg ${color}`}>
          <Icon className="w-3.5 h-3.5" />
        </div>
      </div>
      <div className="text-2xl font-bold text-zinc-100 tracking-tight">{value}</div>
      {sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}
    </Card>
  );
}

/* ================================================================
   PANEL 5: STATUS BREAKDOWN (Stacked Bar)
   ================================================================ */
function StatusPanel({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>> }) {
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
   PANEL 6: CATEGORY DISTRIBUTION (Horizontal Bars)
   ================================================================ */
function CategoryPanel({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>> }) {
  const entries = Object.entries(stats.byCategory || {}).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
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
                  <span className="text-zinc-500 font-mono">{count} ({Math.round((count / total) * 100)}%)</span>
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
   PANEL 7: MONTHLY TREND (Bar Chart)
   ================================================================ */
function TrendPanel({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>> }) {
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
   PANEL 8: TOP 10 AUTHORS
   ================================================================ */
function AuthorsPanel({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>> }) {
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
   PANEL 9: SOURCE DISTRIBUTION (Donut)
   ================================================================ */
function SourcePanel({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>> }) {
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
            <div
              className="w-32 h-32 rounded-full flex-shrink-0 relative"
              style={{
                background: `conic-gradient(${entries.map(([, v], i) => {
                  const pct = (v / total) * 100;
                  const prev = entries.slice(0, i).reduce((a, [, b]) => a + b, 0);
                  const prevPct = (prev / total) * 100;
                  return `${PIE_COLORS[i % PIE_COLORS.length]} ${prevPct}% ${prevPct + pct}%`;
                }).join(', ')})`,
              }}
            >
              <div className="absolute inset-3 rounded-full bg-zinc-900" />
            </div>
            <div className="space-y-2 flex-1">
              {entries.map(([s, v], i) => (
                <div key={s} className="flex items-center gap-2.5 text-xs">
                  <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
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
   PANEL 10: TOP CITIES
   ================================================================ */
function CitiesPanel({ stats }: { stats: NonNullable<ReturnType<typeof useDashboardStats>> }) {
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
   AI INSIGHTS PANEL
   ================================================================ */
function AiInsightsPanel() {
  const [insight, setInsight] = useState('');
  const [loading, setLoading] = useState(false);

  const analyze = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/agent/analyze', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'analyze' }),
      });
      const data = await res.json();
      setInsight(data.analysis || 'Analise indisponivel.');
    } catch {
      setInsight('Servico de analise indisponivel.');
    }
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
        <Button onClick={analyze} disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
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
   RECENT PROJECTS STRIP
   ================================================================ */
function RecentStrip({ projects }: { projects: Array<{ name: string; author: string; category: string; dateAdded: string; url?: string }> }) {
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
              <span className="ml-auto">
                <span className={catColor(p.category)}>{p.category}</span>
              </span>
            </a>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* ================================================================
   QUICK PROJECT SEARCH
   ================================================================ */
function QuickSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Array<{ id: string; name: string; description: string; author: string; status?: string | null; url?: string }>>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

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
        <Input placeholder="Buscar nos projetos..." value={query}
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
   DASHBOARD TAB CONTENT — 10 NUCLEOS/PANEIS (tRPC powered)
   CRITICAL: Always renders panels, NEVER returns null.
   ================================================================ */
type DashboardStats = {
  total: number; active: number; closed: number; developing: number;
  byCategory: Record<string, number>;
  byMonth: { month: string; count: number }[];
  bySource: Record<string, number>;
  topAuthors: { name: string; count: number }[];
  uniqueAuthors: number;
  topCities: { city: string; count: number }[];
  recentProjects: { name: string; author: string; category: string; dateAdded: string; url?: string }[];
};

// Fallback data — ensures panels ALWAYS render even if API fails
const FALLBACK_STATS: DashboardStats = {
  total: 0, active: 0, closed: 0, developing: 0,
  byCategory: {}, byMonth: [], bySource: {},
  topAuthors: [], uniqueAuthors: 0, topCities: [], recentProjects: [],
};

function useDashboardStats() {
  const { data, isLoading, error, refetch } = trpc.dashboard.stats.useQuery(undefined, {
    staleTime: 60 * 1000,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  const stats: DashboardStats = data
    ? {
        total: data.total ?? 0,
        active: data.active ?? 0,
        closed: data.closed ?? 0,
        developing: data.developing ?? 0,
        byCategory: (data.byCategory as Record<string, number>) ?? {},
        byMonth: (data.byMonth as { month: string; count: number }[]) ?? [],
        bySource: (data.bySource as Record<string, number>) ?? {},
        topAuthors: (data.topAuthors as { name: string; count: number }[]) ?? [],
        uniqueAuthors: data.uniqueAuthors ?? 0,
        topCities: (data.topCities as { city: string; count: number }[]) ?? [],
        recentProjects: (data.recentProjects as DashboardStats['recentProjects']) ?? [],
      }
    : FALLBACK_STATS;

  return { ...stats, isLoading, hasError: !!error, refetch };
}

function DashboardTab() {
  const stats = useDashboardStats();

  // LOADING STATE — show skeleton but maintain the 10-panel structure
  if (stats.isLoading) {
    return (
      <div className="space-y-5">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 bg-zinc-900 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-zinc-900 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-64 bg-zinc-900 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} className="h-48 bg-zinc-900 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  // CRITICAL FIX: NEVER return null. Always render all 10 panels.
  // If API failed, show fallback data with error banner + retry.

  return (
    <div className="space-y-5">
      {/* Error Banner — only shown when API fails, panels still render */}
      {stats.hasError && (
        <div className="flex items-center gap-3 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl">
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300 flex-1">Erro ao carregar dados do dashboard. Exibindo dados em cache.</span>
          <Button onClick={() => stats.refetch()} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5 text-xs h-7">
            <RefreshCw className="w-3 h-3" />Retentar
          </Button>
        </div>
      )}

      {/* Row 1: 4 KPI Cards (Panel 1-4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Projetos" value={stats.total?.toLocaleString() || '—'} icon={Globe} color="text-emerald-400 bg-emerald-500/10" sub="Ecosistema completo" pulse={!stats.hasError} />
        <KpiCard label="Desenvolvedores" value={stats.uniqueAuthors?.toLocaleString() || '—'} icon={Users} color="text-purple-400 bg-purple-500/10" sub="Autores unicos" />
        <KpiCard label="Categorias" value={Object.keys(stats.byCategory || {}).length || '—'} icon={Layers} color="text-amber-400 bg-amber-500/10" sub="Classificacoes ativas" />
        <KpiCard label="Fontes" value={Object.keys(stats.bySource || {}).length || '—'} icon={Github} color="text-sky-400 bg-sky-500/10" sub="Repositories monitorados" />
      </div>

      {/* Row 2: Status + Category + Trend (Panel 5-7) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatusPanel stats={stats} />
        <CategoryPanel stats={stats} />
        <TrendPanel stats={stats} />
      </div>

      {/* Row 3: Authors + Source + Cities (Panel 8-10) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AuthorsPanel stats={stats} />
        <SourcePanel stats={stats} />
        <CitiesPanel stats={stats} />
      </div>

      {/* Row 4: AI Insights + Recent Projects (Bonus panels) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AiInsightsPanel />
        <RecentStrip projects={stats.recentProjects || []} />
      </div>
    </div>
  );
}

/* ================================================================
   AGENT HUB TAB — DYNAMIC with Live GitHub Sync (tRPC powered)
   ================================================================ */
interface AgentSkill {
  name: string;
  category: string;
  description?: string;
  enabled: boolean;
}

interface AgentData {
  id: string;
  name: string;
  slug: string;
  description: string;
  version: string;
  status: string;
  agentType: string;
  tier: string;
  repoUrl?: string;
  techStack: string;
  capabilities: string;
  llmModel?: string;
  apiCount: number;
  flowCount: number;
  hasVoice: boolean;
  hasRag: boolean;
  hasBtc: boolean;
  architecture?: string;
  skills: AgentSkill[];
  _count: { knowledge: number; messages: number };
}

interface AgentSummary {
  total: number;
  core: number;
  withVoice: number;
  withRag: number;
  withBtc: number;
  totalSkills: number;
  totalFlows: number;
  totalApis: number;
  totalKnowledge: number;
  types: string[];
}

interface SyncData {
  stars: number;
  forks: number;
  openIssues: number;
  lastPush: string;
  language: string | null;
  repoSize: number;
  recentCommits: number;
  description?: string;
  topics?: string[];
  visibility?: string;
}

function AgentHubTab() {
  const [expandedAgent, setExpandedAgent] = useState<string | null>(null);

  // tRPC queries — type-safe, auto-caching, auto-revalidation
  const { data: agentsData, isLoading: agentsLoading, refetch: refetchAgents } = trpc.agents.list.useQuery(undefined, {
    staleTime: 15 * 1000,
    refetchOnWindowFocus: true,
  });

  const syncMutation = trpc.agents.sync.useMutation({
    onSuccess: () => {
      refetchAgents();
    },
  });

  const { data: syncStatus } = trpc.agents.syncStatus.useQuery(undefined, {
    staleTime: 10 * 1000,
    refetchInterval: 60 * 1000, // Auto-poll every 60s
  });

  const agents: AgentData[] = agentsData?.agents ?? [];
  const summary: AgentSummary | undefined = agentsData?.summary;
  const syncDataMap: Record<string, SyncData | null> = agentsData?.syncData ?? {};
  const lastSync = agentsData?.lastSync ?? syncStatus?.lastSync ?? null;

  const parseJson = (str: string): string[] => {
    try { return JSON.parse(str); } catch { return [str]; }
  };

  const formatTimeAgo = (isoString: string | null): string => {
    if (!isoString) return 'Nunca';
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Agora';
    if (mins < 60) return `${mins}m atras`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h atras`;
    const days = Math.floor(hours / 24);
    return `${days}d atras`;
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
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 bg-zinc-900 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 bg-zinc-900 rounded-xl" />
          ))}
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
    <div className="space-y-5">
      {/* Sync Status Banner — LIVE indicator */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-900/60 border border-zinc-800/60 rounded-xl">
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
        <Button
          onClick={() => syncMutation.mutate()}
          disabled={syncMutation.isPending}
          size="sm"
          className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2 text-xs h-8"
        >
          {syncMutation.isPending ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <RefreshCw className="w-3.5 h-3.5" />
          )}
          Sync GitHub Live
        </Button>
      </div>

      {/* Summary Row */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {summaryCards.map((s) => (
          <Card key={s.label} className="bg-zinc-900/80 border-zinc-800/80 gap-0 py-3 px-3 hover:border-zinc-700 transition-all">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[9px] text-zinc-500 uppercase tracking-widest font-medium">{s.label}</span>
              <div className={`p-1 rounded-md ${s.color}`}>
                <s.icon className="w-3 h-3" />
              </div>
            </div>
            <div className="text-xl font-bold text-zinc-100 tracking-tight">{s.value}</div>
          </Card>
        ))}
      </div>

      {/* Agent Cards — Dynamic with Live Sync Data */}
      <div className="space-y-4">
        {agents.map((agent) => {
          const techStack = parseJson(agent.techStack);
          const capabilities = parseJson(agent.capabilities);
          const isExpanded = expandedAgent === agent.id;
          const typeColor = TYPE_COLORS[agent.agentType] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
          const tierColor = TIER_COLORS[agent.tier] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
          const syncData = syncDataMap[agent.slug] as SyncData | null;
          const isSyncing = syncMutation.isPending;

          return (
            <Card key={agent.id} className="bg-zinc-900/80 border-zinc-800/80 gap-0 overflow-hidden hover:border-zinc-700 transition-all">
              {/* Agent Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedAgent(isExpanded ? null : agent.id)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1.5">
                      {/* Live Status Dot */}
                      <div className={`w-2 h-2 rounded-full ${liveStatusColor(agent.status)}`} />
                      <h3 className="text-base font-bold text-zinc-100">{agent.name}</h3>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium border ${typeColor}`}>
                        {agent.agentType}
                      </span>
                      <span className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-medium border ${tierColor}`}>
                        {agent.tier}
                      </span>
                      <span className="inline-flex items-center text-[9px] text-zinc-500">
                        v{agent.version}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-400 leading-relaxed line-clamp-2">{agent.description}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <div className="flex items-center gap-1.5">
                      {agent.hasVoice && (
                        <Tooltip>
                          <TooltipTrigger><Badge variant="outline" className="text-[9px] px-1.5 py-0 border-pink-500/30 text-pink-400 bg-pink-500/5"><Mic className="w-2.5 h-2.5 mr-0.5" />Voz</Badge></TooltipTrigger>
                          <TooltipContent className="text-[10px] bg-zinc-800 border-zinc-700">Voice Ativo</TooltipContent>
                        </Tooltip>
                      )}
                      {agent.hasRag && (
                        <Tooltip>
                          <TooltipTrigger><Badge variant="outline" className="text-[9px] px-1.5 py-0 border-emerald-500/30 text-emerald-400 bg-emerald-500/5"><Database className="w-2.5 h-2.5 mr-0.5" />RAG</Badge></TooltipTrigger>
                          <TooltipContent className="text-[10px] bg-zinc-800 border-zinc-700">RAG Ativo</TooltipContent>
                        </Tooltip>
                      )}
                      {agent.hasBtc && (
                        <Tooltip>
                          <TooltipTrigger><Badge variant="outline" className="text-[9px] px-1.5 py-0 border-yellow-500/30 text-yellow-400 bg-yellow-500/5"><Bitcoin className="w-2.5 h-2.5 mr-0.5" />BTC</Badge></TooltipTrigger>
                          <TooltipContent className="text-[10px] bg-zinc-800 border-zinc-700">Bitcoin Integrado</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-zinc-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>
                </div>

                {/* Quick Stats Row — STATIC seed data */}
                <div className="flex items-center gap-4 mt-3 text-[10px] text-zinc-500">
                  {agent.llmModel && (
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-emerald-400/60" />{agent.llmModel}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Workflow className="w-3 h-3 text-sky-400/60" />{agent.flowCount} flows
                  </span>
                  <span className="flex items-center gap-1">
                    <Server className="w-3 h-3 text-cyan-400/60" />{agent.apiCount} APIs
                  </span>
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3 text-rose-400/60" />{agent._count.knowledge} docs
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-purple-400/60" />{agent.skills.length} skills
                  </span>
                </div>

                {/* Live GitHub Stats — DYNAMIC real-time data */}
                {syncData && (
                  <div className="flex items-center gap-4 mt-2 pt-2 border-t border-zinc-800/40 text-[10px]">
                    <span className="flex items-center gap-1 text-amber-400">
                      <Star className="w-3 h-3" />{syncData.stars} stars
                    </span>
                    <span className="flex items-center gap-1 text-sky-400">
                      <GitFork className="w-3 h-3" />{syncData.forks} forks
                    </span>
                    <span className="flex items-center gap-1 text-orange-400">
                      <CircleDot className="w-3 h-3" />{syncData.openIssues} issues
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400">
                      <GitBranch className="w-3 h-3" />{syncData.recentCommits} commits/30d
                    </span>
                    {syncData.language && (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Code2 className="w-3 h-3" />{syncData.language}
                      </span>
                    )}
                    {syncData.lastPush && (
                      <span className="flex items-center gap-1 text-zinc-500 ml-auto">
                        <Clock className="w-3 h-3" />Push: {formatTimeAgo(syncData.lastPush)}
                      </span>
                    )}
                  </div>
                )}
                {!syncData && !isSyncing && (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-zinc-800/40 text-[10px] text-zinc-600">
                    <Network className="w-3 h-3" />
                    <span>Dados do repositorio nao sincronizados. Clique &quot;Sync GitHub Live&quot; acima.</span>
                  </div>
                )}
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <div className="border-t border-zinc-800/60">
                  <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Skills */}
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5 text-purple-400" />Skills ({agent.skills.length})
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {agent.skills.map((skill, i) => (
                          <Tooltip key={i}>
                            <TooltipTrigger>
                              <span className={`inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium border ${skillCatColor(skill.category)} ${!skill.enabled ? 'opacity-40' : ''}`}>
                                {skill.name}
                              </span>
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

                    {/* Tech Stack */}
                    <div>
                      <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                        <Code2 className="w-3.5 h-3.5 text-sky-400" />Tech Stack
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {techStack.map((tech, i) => (
                          <span key={i} className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {tech}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Capabilities */}
                    <div className="md:col-span-2">
                      <h4 className="text-xs font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                        <Wrench className="w-3.5 h-3.5 text-amber-400" />Capacidades
                      </h4>
                      <div className="flex flex-wrap gap-1.5">
                        {capabilities.map((cap, i) => (
                          <span key={i} className="inline-flex items-center rounded px-2 py-0.5 text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            {cap}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Architecture & Repo */}
                  <div className="px-4 pb-4 flex items-center gap-4 text-[10px] text-zinc-500">
                    {agent.architecture && (
                      <span className="flex items-center gap-1">
                        <LayoutDashboard className="w-3 h-3" />{agent.architecture}
                      </span>
                    )}
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
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}

/* ================================================================
   RAG CHAT TAB
   ================================================================ */
function RagChatTab() {
  // Get agents for filter dropdown via tRPC
  const { data: agentsData } = trpc.agents.list.useQuery(undefined, { staleTime: 60_000 });
  const agents: AgentData[] = agentsData?.agents ?? [];

  const [messages, setMessages] = useState<Array<{ role: 'user' | 'assistant'; content: string; retrieved?: RetrievedSource[]; contextLength?: number; pipeline?: RagResponse['pipeline'] }>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<string>('all');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const sendQuery = useCallback(async (text?: string) => {
    const query = text || input.trim();
    if (!query || loading) return;

    setMessages(prev => [...prev, { role: 'user', content: query }]);
    setInput('');
    setLoading(true);

    try {
      const body: { query: string; agentSlug?: string } = { query };
      if (selectedAgent !== 'all') body.agentSlug = selectedAgent;

      const res = await fetch('/api/rag/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data: RagResponse = await res.json();

      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.answer || 'Sem resposta disponivel.',
        retrieved: data.retrieved || [],
        contextLength: data.contextLength || 0,
        pipeline: data.pipeline,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Erro ao processar consulta. Tente novamente.',
      }]);
    }
    setLoading(false);
  }, [input, loading, selectedAgent]);

  const quickActions = [
    'O que e OODA?',
    'Como funciona o RAG?',
    'Capacidades Bitcoin',
    'Arquitetura Sabio Heroi',
  ];

  const agentOptions = [
    { value: 'all', label: 'Todos os Agentes' },
    ...agents.map(a => ({ value: a.slug, label: a.name })),
  ];

  return (
    <div className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]">
      {/* Top bar: Agent Filter */}
      <div className="flex items-center gap-3 mb-4 flex-shrink-0">
        <span className="text-xs text-zinc-500 flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5" />Filtrar por Agente:
        </span>
        <Select value={selectedAgent} onValueChange={setSelectedAgent}>
          <SelectTrigger className="w-[220px] bg-zinc-900 border-zinc-800 text-zinc-200 text-xs h-9 rounded-lg">
            <SelectValue placeholder="Selecionar agente" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            {agentOptions.map(opt => (
              <SelectItem key={opt.value} value={opt.value} className="text-xs text-zinc-200 focus:bg-zinc-800 focus:text-zinc-100">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 bg-zinc-900/80 border-zinc-800/80 flex flex-col overflow-hidden gap-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4">
                <BrainCircuit className="w-7 h-7 text-emerald-400" />
              </div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">RAG rRNA — Pergunte ao Ecossistema</h3>
              <p className="text-xs text-zinc-500 max-w-md">
                Pipeline: RecursiveChunk → TF-IDF → BM25 → Cross-Encoder Rerank → LLM. Base de conhecimento com 40+ entradas extraidas dos 5 agentes Nexus.
              </p>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%]`}>
                {msg.role === 'assistant' && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400 text-[10px] font-medium pl-1">
                    <Bot className="w-3 h-3" />RAG rRNA Agent
                    {msg.contextLength !== undefined && msg.contextLength > 0 && (
                      <span className="text-zinc-600 ml-2">{msg.contextLength} chars contexto</span>
                    )}
                    {msg.pipeline && (
                      <span className="text-zinc-600 ml-1">
                        | {msg.pipeline.documentsScanned} docs → {msg.pipeline.retrieved} retrieved → {msg.pipeline.reranked} reranked
                      </span>
                    )}
                  </div>
                )}
                <div className={`rounded-xl px-4 py-2.5 text-xs leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-emerald-600/90 text-white rounded-br-sm'
                    : 'bg-zinc-800 text-zinc-200 rounded-bl-sm border border-zinc-700/50'
                }`}>
                  {msg.content}
                </div>

                {/* Retrieved Sources */}
                {msg.retrieved && msg.retrieved.length > 0 && (
                  <Collapsible className="mt-2">
                    <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors pl-1 py-1">
                      <ChevronRight className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-90" />
                      <Database className="w-3 h-3" />
                      {msg.retrieved.length} fonte{msg.retrieved.length > 1 ? 's' : ''} recuperada{msg.retrieved.length > 1 ? 's' : ''}
                    </CollapsibleTrigger>
                    <CollapsibleContent>
                      <div className="mt-1.5 space-y-1 pl-1">
                        {msg.retrieved.map((src, j) => (
                          <div key={j} className="flex items-center gap-2 text-[10px] p-2 rounded-lg bg-zinc-800/50 border border-zinc-800">
                            <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-[9px] font-bold flex-shrink-0">
                              {j + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <div className="text-zinc-300 font-medium truncate">{src.title}</div>
                              <div className="text-zinc-600 truncate">{src.source}</div>
                            </div>
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-zinc-700 text-zinc-500 flex-shrink-0">
                              {src.agent}
                            </Badge>
                            <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/30 text-amber-400 flex-shrink-0">
                              {src.score}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-xl rounded-bl-sm px-4 py-2.5 border border-zinc-700/50">
                <div className="flex items-center gap-2 text-xs text-zinc-400">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-400" />
                  Buscando no conhecimento...
                </div>
                <div className="mt-2 space-y-1.5">
                  <Skeleton className="h-2 w-48 bg-zinc-700" />
                  <Skeleton className="h-2 w-36 bg-zinc-700" />
                  <Skeleton className="h-2 w-40 bg-zinc-700" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        {messages.length === 0 && (
          <div className="px-4 py-2 border-t border-zinc-800/60 flex gap-2 flex-wrap flex-shrink-0">
            {quickActions.map(action => (
              <button key={action} onClick={() => sendQuery(action)}
                className="px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 border border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all">
                {action}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-zinc-800/60 flex-shrink-0">
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendQuery()}
              placeholder="Pergunte sobre OODA, RAG, Bitcoin, arquitetura dos agentes..."
              className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg h-10 text-xs" />
            <Button onClick={() => sendQuery()} disabled={loading || !input.trim()}
              className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 h-10 gap-2">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">Consultar</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

/* ================================================================
   FLOATING AGENT CHAT (LLM Chat)
   ================================================================ */
function AgentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'system', content: 'Agente AI ativo. Pergunte sobre os projetos, tendencias, ou peca recomendacoes.' },
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
    setInput('');
    setLoading(true);
    try {
      const res = await fetch('/api/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: msg }],
          context: 'Voce e um Agente AI especialista em projetos de desenvolvedores independentes. Responda em Portugues. Seja conciso e util.',
        }),
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
   Agente Generativo Orquestrador Ativo — tRPC Nativo, Live Sync
   ================================================================ */
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      {/* Custom Scrollbar */}
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
                <span className="text-[9px] font-medium bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20">tRPC</span>
              </h1>
              <p className="text-[10px] text-zinc-500 mt-0.5">Agente Generativo Orquestrador Ativo &bull; Live Sync</p>
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

      {/* ═══ MAIN CONTENT WITH TABS ═══ */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        <TooltipProvider delayDuration={200}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            {/* Tab Navigation */}
            <div className="flex items-center gap-4 flex-wrap">
              <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl h-auto">
                <TabsTrigger value="dashboard"
                  className="rounded-lg px-4 py-2 text-xs font-medium data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 data-[state=active]:shadow-none text-zinc-400 hover:text-zinc-200 transition-all gap-2">
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="agents"
                  className="rounded-lg px-4 py-2 text-xs font-medium data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 data-[state=active]:shadow-none text-zinc-400 hover:text-zinc-200 transition-all gap-2">
                  <Bot className="w-3.5 h-3.5" />
                  Agent Hub
                </TabsTrigger>
                <TabsTrigger value="rag"
                  className="rounded-lg px-4 py-2 text-xs font-medium data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30 data-[state=active]:shadow-none text-zinc-400 hover:text-zinc-200 transition-all gap-2">
                  <Database className="w-3.5 h-3.5" />
                  RAG Chat
                </TabsTrigger>
              </TabsList>
            </div>

            {/* Dashboard Tab — 10 Nucleos/Paineis ALWAYS visible */}
            <TabsContent value="dashboard">
              <DashboardTab />
            </TabsContent>

            {/* Agent Hub Tab — Dynamic with Live GitHub Sync */}
            <TabsContent value="agents">
              <AgentHubTab />
            </TabsContent>

            {/* RAG Chat Tab */}
            <TabsContent value="rag">
              <RagChatTab />
            </TabsContent>
          </Tabs>
        </TooltipProvider>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-zinc-800/40 bg-[#09090b] mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600">
            Fusao LLM 2401 &mdash; Agente Generativo Orquestrador Ativo
          </p>
          <p className="text-[10px] text-zinc-700 flex items-center gap-1.5">
            <Cpu className="w-3 h-3" />tRPC Nativo &bull; Live Sync &bull; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* ═══ FLOATING AGENT CHAT ═══ */}
      <AgentChat />
    </div>
  );
}