'use client';
import { useState, useEffect, useRef, useCallback } from 'react';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from '@/components/ui/tooltip';
import {
  Search, Bot, BarChart3, ExternalLink, Github,
  MapPin, Calendar, Sparkles, Globe, Send, Loader2,
  Filter, TrendingUp, Users, Zap, Activity, Layers,
  Building2, Clock, Eye, ChevronRight,
  ArrowUpRight, Cpu, BrainCircuit,
  Mic, Database, Bitcoin, Wrench, LayoutDashboard,
  ShieldCheck, Workflow, Code2, BookOpen,
  Radio, Server, Network, AlertCircle, RefreshCw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { trpc } from '@/lib/trpc';

/* ================================================================
   TYPES
   ================================================================ */
interface RetrievedSource {
  id?: string; title: string; source: string; agent: string;
  agentSlug?: string; score: number; chunkType?: string;
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
   ANIMATION VARIANTS
   ================================================================ */
const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] } },
};

/* ================================================================
   ANIMATED CARD WRAPPER
   ================================================================ */
function AnimatedCard({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ================================================================
   PANEL 1-4: KPI STAT CARDS
   ================================================================ */
function KpiCard({ label, value, icon: Icon, color, sub, pulse, index = 0 }: {
  label: string; value: string | number; icon: React.ElementType; color: string; sub?: string; pulse?: boolean; index?: number;
}) {
  return (
    <AnimatedCard delay={index * 0.08}>
      <Card className="bg-zinc-900/80 border-zinc-800/80 gap-0 py-4 px-4 hover:border-zinc-700 transition-all group relative overflow-hidden">
        {pulse && (
          <div className="absolute top-2 right-2">
            <motion.div
              animate={{ scale: [1, 1.4, 1], opacity: [1, 0.5, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-2 h-2 rounded-full bg-emerald-400"
            />
          </div>
        )}
        <div className="flex items-center justify-between mb-2">
          <span className="text-[10px] text-zinc-500 uppercase tracking-widest font-medium">{label}</span>
          <motion.div
            whileHover={{ rotate: 12, scale: 1.1 }}
            className={`p-1.5 rounded-lg ${color}`}
          >
            <Icon className="w-3.5 h-3.5" />
          </motion.div>
        </div>
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: index * 0.08 + 0.2 }}
          className="text-2xl font-bold text-zinc-100 tracking-tight"
        >
          {value}
        </motion.div>
        {sub && <p className="text-[10px] text-zinc-500 mt-1">{sub}</p>}
      </Card>
    </AnimatedCard>
  );
}

/* ================================================================
   PANEL 5: STATUS BREAKDOWN
   ================================================================ */
function StatusPanel({ stats }: { stats: DashboardStats }) {
  const total = stats.total || 1;
  const items = [
    { label: 'Ativos', count: stats.active, color: 'bg-emerald-500', textColor: 'text-emerald-400', icon: Activity },
    { label: 'Em Desenvolvimento', count: stats.developing, color: 'bg-amber-500', textColor: 'text-amber-400', icon: Clock },
    { label: 'Encerrados', count: stats.closed, color: 'bg-red-500/80', textColor: 'text-red-400', icon: Eye },
  ];
  return (
    <AnimatedCard>
      <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-emerald-400" />Status dos Projetos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex h-4 rounded-full overflow-hidden bg-zinc-800">
            {items.map((item) => (
              <motion.div
                key={item.label}
                className={`${item.color}`}
                initial={{ width: 0 }}
                animate={{ width: `${(item.count / total) * 100}%`, minWidth: item.count > 0 ? '4px' : '0' }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-2">
            {items.map((item) => (
              <div key={item.label} className="flex items-center gap-2">
                <item.icon className={`w-3.5 h-3.5 ${item.textColor}`} />
                <div>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-lg font-bold text-zinc-100"
                  >
                    {item.count.toLocaleString()}
                  </motion.div>
                  <div className="text-[10px] text-zinc-500">{item.label}</div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ================================================================
   PANEL 6: CATEGORY DISTRIBUTION
   ================================================================ */
function CategoryPanel({ stats }: { stats: DashboardStats }) {
  const entries = Object.entries(stats.byCategory || {}).sort((a, b) => b[1] - a[1]);
  const max = entries[0]?.[1] || 1;
  const total = entries.reduce((s, [, c]) => s + c, 0) || 1;
  return (
    <AnimatedCard delay={0.1}>
      <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-purple-400" />Distribuicao por Categoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="max-h-72">
            <div className="space-y-2 pr-2">
              {entries.map(([cat, count], i) => (
                <motion.div
                  key={cat}
                  className="group"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-zinc-300 font-medium group-hover:text-emerald-400 transition-colors">{cat}</span>
                    <span className="text-zinc-500 font-mono">{count} ({Math.round((count / total) * 100)}%)</span>
                  </div>
                  <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
                    <motion.div
                      className={`h-full rounded-full ${catColor(cat).split(' ')[0]}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${(count / max) * 100}%` }}
                      transition={{ duration: 0.6, delay: i * 0.03, ease: 'easeOut' }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ================================================================
   PANEL 7: MONTHLY TREND
   ================================================================ */
function TrendPanel({ stats }: { stats: DashboardStats }) {
  const data = stats.byMonth || [];
  const maxM = data.length > 0 ? Math.max(...data.map(m => m.count)) : 1;
  return (
    <AnimatedCard delay={0.15}>
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
                    <motion.div
                      className="flex-1 min-w-0 flex flex-col items-center justify-end h-full"
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ duration: 0.5, delay: i * 0.02, ease: 'easeOut' }}
                      style={{ transformOrigin: 'bottom' }}
                    >
                      <div
                        className="w-full bg-gradient-to-t from-emerald-600 to-emerald-400 hover:from-emerald-500 hover:to-emerald-300 rounded-t-sm transition-all cursor-pointer"
                        style={{ height: `${h}%`, minHeight: m.count > 0 ? '2px' : '0' }}
                      />
                    </motion.div>
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
    </AnimatedCard>
  );
}

/* ================================================================
   PANEL 8: TOP 10 AUTHORS
   ================================================================ */
function AuthorsPanel({ stats }: { stats: DashboardStats }) {
  const authors = stats.topAuthors || [];
  const maxA = authors[0]?.count || 1;
  return (
    <AnimatedCard delay={0.2}>
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
                <motion.div
                  key={i}
                  className="flex items-center gap-2.5 text-xs group"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04, duration: 0.3 }}
                >
                  <span className="w-5 text-right text-zinc-600 font-mono text-[10px]">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <span className="text-zinc-300 truncate font-medium group-hover:text-emerald-400 transition-colors">{a.name}</span>
                      <span className="text-zinc-500 font-mono ml-2">{a.count}</span>
                    </div>
                    <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                      <motion.div
                        className="h-full bg-purple-500/60 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${(a.count / maxA) * 100}%` }}
                        transition={{ duration: 0.5, delay: i * 0.04 }}
                      />
                    </div>
                  </div>
                </motion.div>
              ))}
              {!authors.length && <p className="text-xs text-zinc-600">Sem dados</p>}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ================================================================
   PANEL 9: SOURCE DISTRIBUTION
   ================================================================ */
function SourcePanel({ stats }: { stats: DashboardStats }) {
  const entries = Object.entries(stats.bySource || {});
  const total = entries.reduce((a, [, b]) => a + b, 0) || 1;
  return (
    <AnimatedCard delay={0.25}>
      <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
            <Github className="w-4 h-4 text-sky-400" />Distribuicao por Fonte
          </CardTitle>
        </CardHeader>
        <CardContent>
          {entries.length > 0 ? (
            <div className="flex items-center gap-6">
              <motion.div
                className="w-32 h-32 rounded-full flex-shrink-0 relative"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.6 }}
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
              </motion.div>
              <div className="space-y-2 flex-1">
                {entries.map(([s, v], i) => (
                  <motion.div
                    key={s}
                    className="flex items-center gap-2.5 text-xs"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }} />
                    <span className="text-zinc-300 flex-1 capitalize">{s}</span>
                    <span className="text-zinc-500 font-mono">{v}</span>
                    <span className="text-zinc-600 text-[10px]">{Math.round((v / total) * 100)}%</span>
                  </motion.div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-zinc-600">Sem dados de fonte</p>
          )}
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ================================================================
   PANEL 10: TOP CITIES
   ================================================================ */
function CitiesPanel({ stats }: { stats: DashboardStats }) {
  const cities = stats.topCities || [];
  const maxC = cities[0]?.count || 1;
  return (
    <AnimatedCard delay={0.3}>
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
              <motion.div
                key={i}
                className="flex items-center gap-2 text-xs"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <span className="w-5 text-right text-zinc-600 font-mono text-[10px]">{i + 1}</span>
                <span className="text-zinc-300 flex-1">{c.city || 'Desconhecida'}</span>
                <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-cyan-500/60 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(c.count / maxC) * 100}%` }}
                    transition={{ duration: 0.5, delay: i * 0.04 }}
                  />
                </div>
                <span className="text-zinc-500 font-mono w-8 text-right">{c.count}</span>
              </motion.div>
            ))}
            {!cities.length && <p className="text-xs text-zinc-600">Dados de cidades indisponiveis</p>}
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
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
    <AnimatedCard delay={0.35}>
      <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
            <BrainCircuit className="w-4 h-4 text-emerald-400" />AI Insights
          </CardTitle>
          <CardDescription className="text-[10px] text-zinc-500">Analise inteligente do ecossistema via LLM</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <motion.div whileTap={{ scale: 0.97 }}>
            <Button onClick={analyze} disabled={loading} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-2">
              {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Gerar Analise AI
            </Button>
          </motion.div>
          <AnimatePresence>
            {insight && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 bg-zinc-800/50 rounded-lg border border-zinc-700/50 text-sm text-zinc-300 whitespace-pre-wrap leading-relaxed">
                  {insight}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ================================================================
   RECENT PROJECTS STRIP
   ================================================================ */
function RecentStrip({ projects }: { projects: Array<{ name: string; author: string; category: string; dateAdded: string; url?: string }> }) {
  if (!projects?.length) return null;
  return (
    <AnimatedCard delay={0.4}>
      <Card className="bg-zinc-900/80 border-zinc-800/80 gap-3">
        <CardHeader className="pb-0">
          <CardTitle className="text-sm text-zinc-200 flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-400" />Projetos Recentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1.5">
            {projects.map((p, i) => (
              <motion.a
                key={i}
                href={p.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs p-2 rounded-lg hover:bg-zinc-800/50 transition-colors group"
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                whileHover={{ x: 4 }}
              >
                <ArrowUpRight className="w-3 h-3 text-zinc-600 group-hover:text-emerald-400 flex-shrink-0" />
                <span className="text-zinc-200 font-medium truncate group-hover:text-emerald-400 transition-colors">{p.name}</span>
                <span className="text-zinc-600 mx-1">by</span>
                <span className="text-zinc-400 truncate">{p.author}</span>
                <span className="ml-auto">
                  <span className={catColor(p.category)}>{p.category}</span>
                </span>
              </motion.a>
            ))}
          </div>
        </CardContent>
      </Card>
    </AnimatedCard>
  );
}

/* ================================================================
   QUICK PROJECT SEARCH
   ================================================================ */
export function QuickSearch() {
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
      <AnimatePresence>
        {open && results.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full mt-1 w-full bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 z-50 max-h-80 overflow-hidden"
          >
            <ScrollArea className="max-h-80">
              {results.map((p, i) => (
                <motion.a
                  key={p.id}
                  href={p.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 px-4 py-2.5 hover:bg-zinc-800/50 transition-colors border-b border-zinc-800/50 last:border-0"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${statusDot(p.status)}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-zinc-200 truncate">{p.name}</div>
                    <div className="text-[10px] text-zinc-500 truncate">{p.description}</div>
                  </div>
                  <span className="text-zinc-600 text-[10px] flex-shrink-0">{p.author}</span>
                </motion.a>
              ))}
            </ScrollArea>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/* ================================================================
   DASHBOARD TAB CONTENT
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

export function DashboardTab() {
  const stats = useDashboardStats();

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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-5"
    >
      {stats.hasError && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl"
        >
          <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
          <span className="text-xs text-red-300 flex-1">Erro ao carregar dados do dashboard. Exibindo dados em cache.</span>
          <Button onClick={() => stats.refetch()} size="sm" variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-500/10 gap-1.5 text-xs h-7">
            <RefreshCw className="w-3 h-3" />Retentar
          </Button>
        </motion.div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <KpiCard label="Total Projetos" value={stats.total?.toLocaleString() || '—'} icon={Globe} color="text-emerald-400 bg-emerald-500/10" sub="Ecosistema completo" pulse={!stats.hasError} index={0} />
        <KpiCard label="Desenvolvedores" value={stats.uniqueAuthors?.toLocaleString() || '—'} icon={Users} color="text-purple-400 bg-purple-500/10" sub="Autores unicos" index={1} />
        <KpiCard label="Categorias" value={Object.keys(stats.byCategory || {}).length || '—'} icon={Layers} color="text-amber-400 bg-amber-500/10" sub="Classificacoes ativas" index={2} />
        <KpiCard label="Fontes" value={Object.keys(stats.bySource || {}).length || '—'} icon={Github} color="text-sky-400 bg-sky-500/10" sub="Repositories monitorados" index={3} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <StatusPanel stats={stats} />
        <CategoryPanel stats={stats} />
        <TrendPanel stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <AuthorsPanel stats={stats} />
        <SourcePanel stats={stats} />
        <CitiesPanel stats={stats} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AiInsightsPanel />
        <RecentStrip projects={stats.recentProjects || []} />
      </div>
    </motion.div>
  );
}