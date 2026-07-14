'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Search, Bot, MessageSquare, BarChart3, ExternalLink, Github,
  MapPin, Calendar, Sparkles, Globe, Send, Loader2,
  ChevronLeft, ChevronRight, Filter, TrendingUp, Users, Zap
} from 'lucide-react';

/* ---------- Types ---------- */
interface Project {
  id: string; name: string; description: string; author: string;
  city?: string; category: string; date: string; source: string;
  status?: 'active' | 'closed' | 'developing'; url?: string;
}

interface ChatMsg { role: 'user' | 'agent' | 'system'; content: string; }

interface Stats {
  total: number; byCategory: Record<string, number>;
  byMonth: { month: string; count: number }[];
  bySource: Record<string, number>; topAuthors: { name: string; count: number }[];
}

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
};

const catColor = (c: string) => CAT_COLORS[c] || CAT_COLORS['其他'] || 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30';
const statusDot = (s?: string) =>
  s === 'active' ? 'bg-emerald-400' : s === 'developing' ? 'bg-amber-400' : s === 'closed' ? 'bg-red-400' : 'bg-zinc-600';

/* ---------- Explorer Skeleton ---------- */
function ProjectSkeleton() {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 space-y-3">
      <Skeleton className="h-5 w-3/4 bg-zinc-800" />
      <Skeleton className="h-4 w-full bg-zinc-800" />
      <Skeleton className="h-4 w-2/3 bg-zinc-800" />
      <div className="flex gap-2 pt-1">
        <Skeleton className="h-5 w-16 bg-zinc-800" />
        <Skeleton className="h-5 w-16 bg-zinc-800" />
        <Skeleton className="h-5 w-12 bg-zinc-800" />
      </div>
    </div>
  );
}

/* ---------- Project Card ---------- */
function ProjectCard({ p }: { p: Project }) {
  return (
    <Card className="bg-zinc-900 border-zinc-800 gap-3 py-4 px-4 hover:border-zinc-700 hover:shadow-lg hover:shadow-emerald-500/5 transition-all duration-200 group cursor-pointer">
      <div className="flex items-start justify-between gap-2">
        <h3 className="font-semibold text-zinc-100 text-sm leading-tight line-clamp-1 group-hover:text-emerald-400 transition-colors">
          {p.name}
        </h3>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className={`w-2 h-2 rounded-full ${statusDot(p.status)}`} />
          {p.url && (
            <Tooltip>
              <TooltipTrigger asChild>
                <a href={p.url} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}>
                  <ExternalLink className="w-3.5 h-3.5 text-zinc-600 hover:text-zinc-300" />
                </a>
              </TooltipTrigger>
              <TooltipContent>Open project</TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
      <p className="text-zinc-400 text-xs leading-relaxed line-clamp-2">{p.description}</p>
      <div className="flex flex-wrap items-center gap-1.5 pt-1">
        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-700 text-zinc-400 gap-1">
          <Users className="w-2.5 h-2.5" />{p.author}
        </Badge>
        {p.city && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-700 text-zinc-400 gap-1">
            <MapPin className="w-2.5 h-2.5" />{p.city}
          </Badge>
        )}
      </div>
      <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
        <span className={`inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${catColor(p.category)}`}>
          {p.category}
        </span>
        {p.source && (
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-zinc-700 text-zinc-500 gap-1">
            <Github className="w-2.5 h-2.5" />{p.source}
          </Badge>
        )}
        <span className="text-[10px] text-zinc-600 ml-auto flex items-center gap-1">
          <Calendar className="w-2.5 h-2.5" />{p.date}
        </span>
      </div>
    </Card>
  );
}

/* ---------- Explorer Tab ---------- */
function ExplorerTab() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(2402);
  const [categories, setCategories] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState('');
  const [source, setSource] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const limit = 20;
  const totalPages = Math.ceil(total / limit);

  const fetchProjects = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(p), limit: String(limit) });
      if (search) params.set('search', search);
      if (activeCat) params.set('category', activeCat);
      if (source) params.set('source', source);
      params.set('sort', sort);
      const res = await fetch(`/api/projects?${params}`);
      const data = await res.json();
      setProjects(data.projects || []);
      setTotal(data.total || 2402);
      if (data.categories) setCategories(data.categories);
      if (data.sources) setSources(data.sources);
    } catch { setProjects([]); }
    setLoading(false);
  }, [search, activeCat, source, sort]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchProjects(page); }, [fetchProjects, page]);

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input placeholder="Search 2,402 projects..." value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className="pl-10 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 h-11 rounded-xl" />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Filter className="w-4 h-4 text-zinc-500" />
        <ScrollArea className="w-full">
          <div className="flex gap-1.5 pb-1">
            <button onClick={() => { setActiveCat(''); setPage(1); }}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${!activeCat ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}`}>
              All
            </button>
            {categories.map(c => (
              <button key={c} onClick={() => { setActiveCat(c === activeCat ? '' : c); setPage(1); }}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${c === activeCat ? catColor(c) : 'border-zinc-800 text-zinc-500 hover:text-zinc-300 hover:border-zinc-700'}`}>
                {c}
              </button>
            ))}
          </div>
        </ScrollArea>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Select value={source} onValueChange={v => { setSource(v === 'all' ? '' : v); setPage(1); }}>
          <SelectTrigger className="w-[140px] bg-zinc-900 border-zinc-800 text-zinc-300 h-8 text-xs">
            <SelectValue placeholder="Source" />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="all" className="text-zinc-300">All Sources</SelectItem>
            {sources.map(s => <SelectItem key={s} value={s} className="text-zinc-300">{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={v => setSort(v)}>
          <SelectTrigger className="w-[130px] bg-zinc-900 border-zinc-800 text-zinc-300 h-8 text-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-zinc-900 border-zinc-800">
            <SelectItem value="newest" className="text-zinc-300">Newest</SelectItem>
            <SelectItem value="oldest" className="text-zinc-300">Oldest</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-xs text-zinc-600 ml-auto">
          {total.toLocaleString()} projects &bull; {categories.length} categories &bull; 870 dates
        </span>
      </div>
      <Separator className="bg-zinc-800" />
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {Array.from({ length: 6 }).map((_, i) => <ProjectSkeleton key={i} />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20">
          <Search className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
          <p className="text-zinc-500 text-sm">No projects found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {projects.map(p => <ProjectCard key={p.id} p={p} />)}
        </div>
      )}
      <div className="flex items-center justify-center gap-2 pt-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}
          className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
          <ChevronLeft className="w-4 h-4" />Prev
        </Button>
        <span className="text-xs text-zinc-500 px-3">Page {page} of {totalPages}</span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}
          className="border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800">
          Next<ChevronRight className="w-4 h-4" />
        </Button>
        {page < totalPages && (
          <Button variant="ghost" size="sm" onClick={() => setPage(p => p + 1)}
            className="text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 ml-2">
            Load more...
          </Button>
        )}
      </div>
    </div>
  );
}

/* ---------- Chat Tab ---------- */
function ChatTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'system', content: "I'm your AI Agent. Ask me about the 2402+ projects, get recommendations, or analyze trends." }
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
      const res = await fetch('/api/agent/chat?XTransformPort=3001', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, { role: 'user', content: msg }],
          context: 'You are an expert on Chinese independent developer projects. Help users explore, discover, and analyze the 2402+ projects in this ecosystem.'
        })
      });
      const data = await res.json();
      setMessages(m => [...m, { role: 'agent', content: data.response || 'No response received.' }]);
    } catch {
      setMessages(m => [...m, { role: 'agent', content: 'Sorry, the AI agent is currently unavailable. Please try again.' }]);
    }
    setLoading(false);
  }, [input, messages, loading]);

  const quickActions = ['Recommend projects', 'Analyze trends', 'Top categories'];

  return (
    <div className="flex flex-col h-[70vh] max-h-[80vh]">
      <ScrollArea className="flex-1 mb-4" ref={scrollRef as React.RefObject<any>}>
        <div className="space-y-3 pr-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] md:max-w-[70%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                m.role === 'user'
                  ? 'bg-emerald-600/90 text-white rounded-br-md'
                  : m.role === 'system'
                  ? 'bg-zinc-800/80 text-zinc-300 text-center w-full max-w-full border border-zinc-700/50 rounded-2xl'
                  : 'bg-zinc-800 text-zinc-200 rounded-bl-md'
              }`}>
                {m.role === 'agent' && (
                  <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400 text-[10px] font-medium">
                    <Bot className="w-3 h-3" />AI Agent
                  </div>
                )}
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-zinc-800 rounded-2xl rounded-bl-md px-4 py-3 space-y-2">
                <Skeleton className="h-3 w-48 bg-zinc-700" />
                <Skeleton className="h-3 w-36 bg-zinc-700" />
                <Skeleton className="h-3 w-24 bg-zinc-700" />
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <Separator className="bg-zinc-800 mb-3" />
      <div className="flex gap-1.5 mb-2 flex-wrap">
        {quickActions.map(a => (
          <Button key={a} variant="outline" size="sm"
            onClick={() => send(a)}
            className="border-zinc-800 text-zinc-400 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 text-xs h-7">
            <Sparkles className="w-3 h-3" />{a}
          </Button>
        ))}
      </div>
      <div className="flex gap-2">
        <Input value={input} onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Ask about projects, trends, recommendations..."
          className="flex-1 bg-zinc-900 border-zinc-800 text-zinc-100 placeholder:text-zinc-600 rounded-xl" />
        <Button onClick={() => send()} disabled={loading || !input.trim()}
          className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-5">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}

/* ---------- Moltbook Tab ---------- */
function MoltbookTab() {
  const [reachable, setReachable] = useState<boolean | null>(null);
  const [homeData, setHomeData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/moltbook?action=home&XTransformPort=3002', { method: 'POST' });
      setReachable(res.ok);
    } catch { setReachable(false); }
  }, []);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { checkStatus(); }, [checkStatus]);

  const fetchHome = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/moltbook?action=home&XTransformPort=3002', { method: 'POST' });
      const data = await res.json();
      setHomeData(data);
    } catch { setHomeData({ error: 'Failed to fetch Moltbook data' }); }
    setLoading(false);
  };

  const features = [
    { icon: MessageSquare, label: 'Post', desc: 'Create and share posts' },
    { icon: MessageSquare, label: 'Comment', desc: 'Engage in discussions' },
    { icon: TrendingUp, label: 'Upvote', desc: 'Surface great content' },
    { icon: Users, label: 'Communities', desc: 'Create themed groups' },
    { icon: Search, label: 'Semantic Search', desc: 'Find relevant content' },
  ];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      <Card className="bg-zinc-900 border-zinc-800 gap-4">
        <CardHeader className="pb-0">
          <CardTitle className="text-zinc-100 flex items-center gap-2">
            <Globe className="w-5 h-5 text-emerald-400" />Moltbook
          </CardTitle>
          <CardDescription className="text-zinc-400">The social network for AI agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-zinc-400">
            Moltbook is a decentralized social platform where AI agents share insights, discuss projects, and upvote
            the best contributions. Humans are welcome to observe and participate.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {features.map(f => (
              <div key={f.label} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-zinc-800/50 border border-zinc-800">
                <f.icon className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                <div><div className="text-xs font-medium text-zinc-200">{f.label}</div>
                <div className="text-[10px] text-zinc-500">{f.desc}</div></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card className="bg-zinc-900 border-zinc-800 gap-4">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-400" />API Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <span className={`w-2.5 h-2.5 rounded-full ${reachable === null ? 'bg-zinc-600' : reachable ? 'bg-emerald-400' : 'bg-red-400'}`} />
            <span className="text-sm text-zinc-300">{reachable === null ? 'Checking...' : reachable ? 'Moltbook API is reachable' : 'Moltbook API is offline'}</span>
          </div>
          <Button onClick={fetchHome} disabled={loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Fetch Home Feed
          </Button>
        </CardContent>
      </Card>
      {homeData && (
        <Card className="bg-zinc-900 border-zinc-800 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-zinc-200">Moltbook Response</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="text-xs text-zinc-400 bg-zinc-950 rounded-lg p-4 overflow-auto max-h-96 whitespace-pre-wrap break-words">
              {JSON.stringify(homeData, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ---------- Dashboard Tab ---------- */
function DashboardTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [insight, setInsight] = useState('');
  const [insightLoading, setInsightLoading] = useState(false);

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

  const analyze = async () => {
    setInsightLoading(true);
    try {
      const res = await fetch('/api/agent/analyze?XTransformPort=3001', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Analyze the top trends and insights from the Chinese independent developer project ecosystem' })
      });
      const data = await res.json();
      setInsight(data.analysis || 'No analysis available');
    } catch { setInsight('Analysis service unavailable.'); }
    setInsightLoading(false);
  };

  const catEntries = stats?.byCategory ? Object.entries(stats.byCategory).sort((a, b) => b[1] - a[1]) : [];
  const maxCat = catEntries[0]?.[1] || 1;
  const srcEntries = stats?.bySource ? Object.entries(stats.bySource) : [];
  const monthData = stats?.byMonth || [];
  const maxMonth = monthData.length > 0 ? Math.max(...monthData.map(m => m.count)) : 1;

  const PIE_COLORS = ['bg-emerald-500', 'bg-amber-500', 'bg-purple-500', 'bg-sky-500', 'bg-pink-500', 'bg-teal-500'];

  if (loading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-24 bg-zinc-900 rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total Projects', value: stats?.total?.toLocaleString() || '2,402', icon: Globe, color: 'text-emerald-400' },
          { label: 'Active', value: String(stats?.total ? Math.round(stats.total * 0.72) : 1730), icon: Zap, color: 'text-amber-400' },
          { label: 'Categories', value: String(catEntries.length), icon: Filter, color: 'text-purple-400' },
          { label: 'Sources', value: String(srcEntries.length), icon: Github, color: 'text-sky-400' },
        ].map(s => (
          <Card key={s.label} className="bg-zinc-900 border-zinc-800 gap-2 py-4 px-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider">{s.label}</span>
              <s.icon className={`w-4 h-4 ${s.color}`} />
            </div>
            <div className="text-2xl font-bold text-zinc-100">{s.value}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Category Breakdown */}
        <Card className="bg-zinc-900 border-zinc-800 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-400" />Category Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <ScrollArea className="max-h-64">
              {catEntries.map(([cat, count]) => (
                <div key={cat} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-zinc-400">{cat}</span>
                    <span className="text-zinc-500">{count}</span>
                  </div>
                  <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${catColor(cat).split(' ')[0]}`}
                      style={{ width: `${(count / maxCat) * 100}%` }} />
                  </div>
                </div>
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card className="bg-zinc-900 border-zinc-800 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400" />Monthly Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-[2px] h-48">
              {monthData.slice(-24).map((m, i) => {
                const h = (m.count / maxMonth) * 100;
                return (
                  <Tooltip key={i}>
                    <TooltipTrigger asChild>
                      <div className="flex-1 min-w-0 flex flex-col items-center justify-end h-full group">
                        <div className="w-full bg-emerald-500/80 hover:bg-emerald-400 rounded-t-sm transition-colors"
                          style={{ height: `${h}%`, minHeight: m.count > 0 ? '2px' : '0' }} />
                      </div>
                    </TooltipTrigger>
                    <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-300 text-[10px]">
                      {m.month}: {m.count} projects
                    </TooltipContent>
                  </Tooltip>
                );
              })}
            </div>
            <div className="flex justify-between text-[10px] text-zinc-600 mt-1">
              <span>{monthData[0]?.month || ''}</span>
              <span>{monthData[monthData.length - 1]?.month || ''}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Top Authors */}
        <Card className="bg-zinc-900 border-zinc-800 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />Top 10 Authors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="max-h-64">
              <div className="space-y-1.5">
                {(stats?.topAuthors || []).slice(0, 10).map((a, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span className="w-5 text-right text-zinc-600 font-mono">{i + 1}</span>
                    <div className="flex-1 truncate text-zinc-300">{a.name}</div>
                    <span className="text-zinc-500">{a.count} projects</span>
                  </div>
                ))}
                {(!stats?.topAuthors?.length) && <p className="text-xs text-zinc-600">No author data available</p>}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Source Distribution */}
        <Card className="bg-zinc-900 border-zinc-800 gap-3">
          <CardHeader className="pb-0">
            <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
              <Github className="w-4 h-4 text-sky-400" />Source Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {srcEntries.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-28 h-28 rounded-full flex-shrink-0" style={{
                  background: `conic-gradient(${srcEntries.map(([, v], i) => {
                    const pct = (v / srcEntries.reduce((a, [, b]) => a + b, 0)) * 100;
                    const prev = srcEntries.slice(0, i).reduce((a, [, b]) => a + b, 0);
                    const prevPct = (prev / srcEntries.reduce((a, [, b]) => a + b, 0)) * 100;
                    return `${PIE_COLORS[i % PIE_COLORS.length]} ${prevPct}% ${prevPct + pct}%`;
                  }).join(', ')})`
                }} />
                <div className="space-y-1.5 flex-1">
                  {srcEntries.map(([s, v], i) => (
                    <div key={s} className="flex items-center gap-2 text-xs">
                      <span className={`w-2.5 h-2.5 rounded-sm ${PIE_COLORS[i % PIE_COLORS.length]}`} />
                      <span className="text-zinc-400 flex-1">{s}</span>
                      <span className="text-zinc-500">{v}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-xs text-zinc-600">No source data available</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="bg-zinc-900 border-zinc-800 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-emerald-400" />AI Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button onClick={analyze} disabled={insightLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white">
            {insightLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Generate AI Analysis
          </Button>
          {insight && (
            <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-800 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
              {insight}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ---------- Main Page ---------- */
export default function Home() {
  return (
    <div className="min-h-screen flex flex-col bg-[#0a0a0b] text-zinc-100">
      {/* Custom scrollbar styles */}
      <style>{`
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>

      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-zinc-800/80 bg-[#0a0a0b]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-zinc-100 leading-none tracking-tight">Agent Hub</h1>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Agentic Ecosystem &bull; 2,402 Projects &bull; LLM Powered
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] bg-emerald-500/5 hidden sm:inline-flex">
              <Zap className="w-2.5 h-2.5" />Live
            </Badge>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-6">
        <Tabs defaultValue="explorer" className="w-full">
          <TabsList className="bg-zinc-900 border border-zinc-800 rounded-xl p-1 mb-6 h-auto">
            {[
              { value: 'explorer', icon: Search, label: 'Explorer' },
              { value: 'chat', icon: Bot, label: 'Chat' },
              { value: 'moltbook', icon: Globe, label: 'Moltbook' },
              { value: 'dashboard', icon: BarChart3, label: 'Dashboard' },
            ].map(t => (
              <TabsTrigger key={t.value} value={t.value}
                className="rounded-lg px-4 py-2 text-xs font-medium data-[state=active]:bg-zinc-800 data-[state=active]:text-emerald-400 data-[state=active]:shadow-sm text-zinc-500 hover:text-zinc-300 gap-1.5 transition-all">
                <t.icon className="w-3.5 h-3.5" />{t.label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="explorer"><ExplorerTab /></TabsContent>
          <TabsContent value="chat"><ChatTab /></TabsContent>
          <TabsContent value="moltbook"><MoltbookTab /></TabsContent>
          <TabsContent value="dashboard"><DashboardTab /></TabsContent>
        </Tabs>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/50 bg-[#0a0a0b] mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600">Agent Hub &mdash; Chinese Independent Developer Ecosystem</p>
          <p className="text-[10px] text-zinc-700">Powered by LLM &bull; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}