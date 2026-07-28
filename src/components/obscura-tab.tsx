'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Globe, Search, Copy, Zap, Shield, Eye, Code2, Link2, FileText,
  ArrowRight, RefreshCw, CheckCircle2, AlertTriangle, Radio, Cpu,
  Network, MousePointer, Type, Keyboard, Camera, Terminal,
  ChevronRight, BarChart3, Activity, Clock, Play, Server,
  Wifi, ShieldOff, Shuffle, Plus, Trash2, ToggleLeft, ToggleRight,
  ListFilter, Hash, MonitorSmartphone, Gauge, Users,
} from 'lucide-react';

// ─── Types ──────────────────────────────────────────────
interface ObscuraStatus {
  running: boolean; version: string; cdpUrl: string; userAgent: string;
  v8Version: string; protocolVersion: string; stealth: boolean;
}
interface MCPTool { name: string; description: string; }
interface NavigateResult {
  success: boolean; url: string; title: string; text: string; html: string;
  markdown?: string; links: Array<{ href: string; text: string }>;
  executionTimeMs: number; error?: string; timestamp: string;
}
interface ServeState { running: boolean; port: number; stealth: boolean; workers: number; uptimeSeconds: number; pid?: number; }
interface InterceptRule { id: string; name: string; pattern: string; action: string; enabled: boolean; hitCount: number; createdAt: string; }
interface InterceptState { enabled: boolean; rules: InterceptRule[]; totalBlocked: number; totalIntercepted: number; }
interface TrackerStats {
  enabled: boolean; totalBlockedDomains: number;
  categories: Record<string, number>;
  topBlocked: Array<{ domain: string; count: number; category: string }>;
  sessionBlocked: number; sessionRequests: number;
}
interface ProxyEntry { url: string; type: string; label?: string; successCount: number; failCount: number; active: boolean; lastUsed?: string; }
interface ProxyConfig { strategy: string; currentIndex: number; proxies: ProxyEntry[]; totalRequests: number; totalFailures: number; }

const TOOL_ICONS: Record<string, typeof Globe> = {
  browser_navigate: Globe, browser_snapshot: Eye, browser_click: MousePointer,
  browser_fill: Type, browser_type: Keyboard, browser_press_key: Keyboard,
  browser_scroll: FileText, browser_select_option: ListFilter, browser_hover: MousePointer,
  browser_wait_for: Clock, browser_evaluate: Code2, browser_get_attributes: Search,
  browser_screenshot: Camera,
};

const CAT_COLORS: Record<string, string> = {
  analytics: '#22d3ee', ads: '#f97316', telemetry: '#a855f7', fingerprinting: '#e01b24', social: '#3b82f6', other: '#71717a',
};

// ═══════════════════════════════════════════════════════════
export function ObscuraTab() {
  const [status, setStatus] = useState<ObscuraStatus | null>(null);
  const [mcpTools, setMcpTools] = useState<MCPTool[]>([]);
  const [serve, setServe] = useState<ServeState | null>(null);
  const [interception, setInterception] = useState<InterceptState | null>(null);
  const [trackers, setTrackers] = useState<TrackerStats | null>(null);
  const [proxy, setProxy] = useState<ProxyConfig | null>(null);
  const [url, setUrl] = useState('https://example.com');
  const [activeSubTab, setActiveSubTab] = useState<'browser' | 'scrape' | 'tools' | 'network' | 'stealth' | 'info'>('browser');
  const [navResult, setNavResult] = useState<NavigateResult | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);
  const [evalExpr, setEvalExpr] = useState('document.title');
  const [evalResult, setEvalResult] = useState('');
  const [isEvaling, setIsEvaling] = useState(false);
  const [scrapeUrls, setScrapeUrls] = useState('');
  const [scrapeResult, setScrapeResult] = useState('');
  const [isScraping, setIsScraping] = useState(false);
  const [dumpFormat, setDumpFormat] = useState<'text' | 'html' | 'markdown' | 'links'>('text');

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch('/api/obscura/status');
      const data = await res.json();
      setStatus(data.status);
      setMcpTools(data.mcpTools ?? []);
      setServe(data.serve);
      setInterception(data.interception);
      setTrackers(data.trackers);
      setProxy(data.proxy);
    } catch { /* silent */ }
  }, []);

  useEffect(() => { fetchStatus(); const t = setInterval(fetchStatus, 5000); return () => clearInterval(t); }, [fetchStatus]);

  const handleNavigate = useCallback(async (navUrl?: string) => {
    const target = navUrl ?? url;
    if (!target.trim()) return;
    setIsNavigating(true); setNavResult(null);
    try {
      const res = await fetch('/api/obscura/navigate', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: target, dump: dumpFormat, waitUntil: 'networkidle0' }),
      });
      const data = await res.json(); setNavResult(data); if (navUrl) setUrl(navUrl);
    } catch (err) { setNavResult({ success: false, url: target, title: '', text: '', html: '', links: [], executionTimeMs: 0, timestamp: '', error: String(err) }); }
    setIsNavigating(false); fetchStatus();
  }, [url, dumpFormat, fetchStatus]);

  const handleEval = useCallback(async () => {
    if (!url.trim() || !evalExpr.trim()) return;
    setIsEvaling(true); setEvalResult('');
    try {
      const res = await fetch('/api/obscura/eval', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, expression: evalExpr }),
      });
      const data = await res.json(); setEvalResult(data.success ? data.result : `Error: ${data.error}`);
    } catch (err) { setEvalResult(`Error: ${err}`); }
    setIsEvaling(false);
  }, [url, evalExpr]);

  const handleScrape = useCallback(async () => {
    const urls = scrapeUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (!urls.length) return;
    setIsScraping(true); setScrapeResult('');
    try {
      const res = await fetch('/api/obscura/scrape', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ urls, eval: 'document.title' }),
      });
      const data = await res.json();
      setScrapeResult([
        `Scrape: ${data.totalTimeMs}ms | Total: ${data.total} | OK: ${data.succeeded} | ERR: ${data.failed}`, '',
        ...data.results.map((r: { url: string; success: boolean; result?: string; error?: string }) =>
          `[${r.success ? 'OK' : 'ERR'}] ${r.url}${r.result ? ` -> ${r.result.slice(0, 80)}` : ''}${r.error ? ` -> ${r.error}` : ''}`
        ),
      ].join('\n'));
    } catch (err) { setScrapeResult(`Error: ${err}`); }
    setIsScraping(false); fetchStatus();
  }, [scrapeUrls, fetchStatus]);

  const handleServe = useCallback(async (action: 'start' | 'stop') => {
    try {
      await fetch('/api/obscura/serve', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action }) });
      fetchStatus();
    } catch { /* silent */ }
  }, [fetchStatus]);

  const handleToggleTracker = useCallback(async () => {
    try {
      await fetch('/api/obscura/trackers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', enabled: !trackers?.enabled }) });
      fetchStatus();
    } catch { /* silent */ }
  }, [trackers, fetchStatus]);

  const handleToggleIntercept = useCallback(async () => {
    try {
      await fetch('/api/obscura/intercept', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'toggle', enabled: !interception?.enabled }) });
      fetchStatus();
    } catch { /* silent */ }
  }, [interception, fetchStatus]);

  const handleProxyRotate = useCallback(async () => {
    try {
      await fetch('/api/obscura/proxy', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'rotate' }) });
      fetchStatus();
    } catch { /* silent */ }
  }, [fetchStatus]);

  const subTabs = [
    { key: 'browser' as const, label: 'Navegador', icon: Globe },
    { key: 'scrape' as const, label: 'Scrape', icon: Zap },
    { key: 'tools' as const, label: 'MCP Tools', icon: Terminal },
    { key: 'network' as const, label: 'Rede', icon: Network },
    { key: 'stealth' as const, label: 'Stealth', icon: Shield },
    { key: 'info' as const, label: 'Info', icon: Activity },
  ];

  // ═══ RENDER ═══════════════════════════════════════════
  return (
    <div className="space-y-5">
      {/* ═══ STATUS BAR ═══ */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {[
          { label: 'Motor', value: status?.running ? 'Online' : 'Offline', icon: Radio, color: status?.running ? '#00ff88' : '#e01b24' },
          { label: 'Versao', value: status?.version ?? '...', icon: Cpu, color: '#22d3ee' },
          { label: 'V8', value: status?.v8Version ? `v${status.v8Version.split('.')[0]}` : '...', icon: Code2, color: '#a855f7' },
          { label: 'CDP', value: `v${status?.protocolVersion ?? '...'}`, icon: Network, color: '#f97316' },
          { label: 'Stealth', value: status?.stealth ? 'ON' : 'OFF', icon: Shield, color: status?.stealth ? '#00ff88' : '#71717a' },
          { label: 'Serve', value: serve?.running ? `:${serve.port}` : 'OFF', icon: Server, color: serve?.running ? '#00ff88' : '#71717a' },
          { label: 'MCP', value: String(mcpTools.length), icon: Terminal, color: '#fbbf24' },
          { label: 'Intercept', value: interception?.enabled ? 'ON' : 'OFF', icon: ShieldOff, color: interception?.enabled ? '#f97316' : '#71717a' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
              <CardContent className="p-3 flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: stat.color + '15', border: `1px solid ${stat.color}30` }}>
                  <stat.icon className="w-3.5 h-3.5" style={{ color: stat.color }} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-zinc-100 leading-none">{stat.value}</p>
                  <p className="text-[9px] text-zinc-500 mt-0.5">{stat.label}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* ═══ SUB-TAB NAV ═══ */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1 bg-zinc-900/40 rounded-lg p-1 border border-zinc-800/30">
          {subTabs.map(tab => (
            <button key={tab.key} onClick={() => setActiveSubTab(tab.key)}
              className={cn('flex items-center gap-2 px-4 py-2 rounded-md text-xs font-medium transition-all cursor-pointer',
                activeSubTab === tab.key ? 'bg-[#22d3ee]/10 text-[#22d3ee]' : 'text-zinc-500 hover:text-zinc-300'
              )}>
              <tab.icon className="w-3.5 h-3.5" />{tab.label}
            </button>
          ))}
        </div>
        <Badge variant="outline" className={cn('text-[10px] border ml-auto',
          status?.running ? 'border-emerald-500/30 text-emerald-400' : 'border-red-500/30 text-red-400'
        )}>
          <Radio className="w-2.5 h-2.5 mr-1" />{status?.running ? 'CDP Connected' : 'Disconnected'}
        </Badge>
      </div>

      {/* ═══ TAB CONTENT ═══ */}
      <AnimatePresence mode="wait">
        <motion.div key={activeSubTab} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.12 }}>

          {/* ──── BROWSER TAB ──── */}
          {activeSubTab === 'browser' && (
            <div className="space-y-4">
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardContent className="p-3">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 bg-zinc-950/60 rounded-lg px-2.5 py-1.5 border border-zinc-800/50 flex-shrink-0">
                      <div className={cn('w-2 h-2 rounded-full', status?.running ? 'bg-emerald-400' : 'bg-red-400')} />
                      <span className="text-[10px] text-zinc-500 font-mono">Obscura v{status?.version ?? '0.1.10'}</span>
                    </div>
                    <div className="flex-1 flex items-center gap-2 bg-zinc-950/60 rounded-lg border border-zinc-800/50 px-3">
                      <Globe className="w-3.5 h-3.5 text-zinc-600 flex-shrink-0" />
                      <Input value={url} onChange={e => setUrl(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleNavigate()}
                        placeholder="https://example.com"
                        className="border-0 bg-transparent text-xs text-zinc-200 h-9 p-0 focus-visible:ring-0"
                        disabled={isNavigating} />
                    </div>
                    <div className="flex items-center gap-1.5">
                      {(['text', 'html', 'markdown', 'links'] as const).map(f => (
                        <button key={f} onClick={() => setDumpFormat(f)}
                          className={cn('px-2.5 py-1 rounded-md text-[10px] font-medium transition-all cursor-pointer border',
                            dumpFormat === f ? 'bg-[#22d3ee]/15 text-[#22d3ee] border-[#22d3ee]/30' : 'border-zinc-800 text-zinc-500 hover:text-zinc-300'
                          )}>{f}</button>
                      ))}
                      <Button onClick={() => handleNavigate()} disabled={isNavigating || !url.trim()}
                        className="bg-[#22d3ee]/15 text-[#22d3ee] hover:bg-[#22d3ee]/25 border border-[#22d3ee]/30 text-xs h-9 px-4 ml-1">
                        {isNavigating ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                        {isNavigating ? 'Carregando...' : 'Navegar'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-2 px-4 pt-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      {navResult?.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> :
                       navResult ? <AlertTriangle className="w-4 h-4 text-red-400" /> :
                       <Eye className="w-4 h-4 text-zinc-500" />}
                      {navResult?.title || 'Resultado da Navegacao'}
                    </CardTitle>
                    {navResult && (
                      <div className="flex items-center gap-3 text-[9px] text-zinc-500">
                        <span className="flex items-center gap-1"><Clock className="w-2.5 h-2.5" />{navResult.executionTimeMs}ms</span>
                        {navResult.success && dumpFormat === 'text' && <span>{navResult.text.length} chars</span>}
                        {navResult.success && dumpFormat === 'links' && <span>{navResult.links.length} links</span>}
                        <Button size="sm" variant="ghost" className="h-6 text-[9px] text-zinc-500 hover:text-zinc-300 px-2"
                          onClick={() => { navigator.clipboard.writeText(navResult.text || navResult.html || ''); }}>
                          <Copy className="w-2.5 h-2.5 mr-1" />Copy
                        </Button>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  {navResult ? (
                    <div className="bg-zinc-950/60 rounded-lg overflow-auto max-h-[450px]">
                      {navResult.error ? (
                        <div className="p-4 text-xs text-red-400"><AlertTriangle className="w-4 h-4 inline mr-2" />{navResult.error}</div>
                      ) : dumpFormat === 'links' ? (
                        <div className="divide-y divide-zinc-800/20">
                          {navResult.links.map((link, i) => (
                            <button key={i} onClick={() => handleNavigate(link.href)}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-zinc-800/30 transition-colors cursor-pointer">
                              <Link2 className="w-3 h-3 text-cyan-400 flex-shrink-0" />
                              <span className="text-[11px] text-cyan-400 font-mono truncate max-w-[300px]">{link.href}</span>
                              <ChevronRight className="w-3 h-3 text-zinc-700 flex-shrink-0" />
                              <span className="text-[11px] text-zinc-400 truncate">{link.text}</span>
                            </button>
                          ))}
                        </div>
                      ) : dumpFormat === 'html' ? (
                        <pre className="p-4 text-[10px] text-emerald-300 font-mono whitespace-pre-wrap break-all">{navResult.html.slice(0, 50000)}</pre>
                      ) : (
                        <pre className="p-4 text-[11px] text-zinc-300 font-mono whitespace-pre-wrap leading-relaxed">{navResult.text}</pre>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <Globe className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
                      <p className="text-xs text-zinc-600">Navegador Obscura — Headless Browser em Rust</p>
                      <p className="text-[10px] text-zinc-700 mt-1">Insira uma URL e pressione Navegar para renderizar</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* JS Eval */}
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs font-semibold text-zinc-300 flex items-center gap-2">
                    <Terminal className="w-3.5 h-3.5 text-purple-400" />Eval JavaScript
                    <Badge className="text-[8px] bg-purple-500/15 text-purple-400 border-purple-500/20 ml-auto">--eval</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Input value={evalExpr} onChange={e => setEvalExpr(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEval()}
                      placeholder="document.title" className="flex-1 bg-zinc-950/60 border-zinc-800/60 text-xs font-mono h-8" />
                    <Button onClick={handleEval} disabled={isEvaling}
                      className="bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/30 text-xs h-8 px-3">
                      {isEvaling ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3" />}
                    </Button>
                  </div>
                  {evalResult && <div className="bg-zinc-950/60 rounded-lg p-3 border border-zinc-800/20"><pre className="text-[11px] text-emerald-300 font-mono whitespace-pre-wrap">{evalResult}</pre></div>}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──── SCRAPE TAB ──── */}
          {activeSubTab === 'scrape' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-[#22d3ee]" />Scrape em Lote
                    <Badge className="text-[8px] bg-[#22d3ee]/15 text-[#22d3ee] border-[#22d3ee]/20 ml-auto">--scrape</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <p className="text-[10px] text-zinc-500 leading-relaxed">Scrape multiplas URLs em paralelo com workers nativos do Obscura. Cada URL e processada em um processo isolado com V8 independente.</p>
                  <Textarea value={scrapeUrls} onChange={e => setScrapeUrls(e.target.value)}
                    placeholder={"https://example.com\nhttps://news.ycombinator.com\nhttps://en.wikipedia.org"}
                    className="bg-zinc-950/60 border-zinc-800/60 text-xs font-mono min-h-[200px]" spellCheck={false} />
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-600">{scrapeUrls.split('\n').filter(u => u.trim()).length} URLs</span>
                    <Button onClick={handleScrape} disabled={isScraping || !scrapeUrls.trim()}
                      className="bg-[#22d3ee]/15 text-[#22d3ee] hover:bg-[#22d3ee]/25 border border-[#22d3ee]/30 text-xs h-8 px-4">
                      {isScraping ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                      {isScraping ? 'Scraping...' : 'Scrape'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs font-semibold text-zinc-400 flex items-center gap-2"><BarChart3 className="w-3.5 h-3.5" />Resultados</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="bg-zinc-950/60 rounded-lg p-4 min-h-[250px] max-h-[400px] overflow-auto">
                    {scrapeResult ? (
                      <pre className="text-[10px] text-zinc-300 font-mono whitespace-pre-wrap">{scrapeResult}</pre>
                    ) : (
                      <div className="text-center py-10"><Zap className="w-8 h-8 text-zinc-800 mx-auto mb-2" /><p className="text-[10px] text-zinc-600">Resultados do scrape aparecerao aqui</p></div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──── MCP TOOLS TAB ──── */}
          {activeSubTab === 'tools' && (
            <div className="space-y-4">
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><Terminal className="w-4 h-4 text-[#fbbf24]" />MCP Tools — Model Context Protocol</CardTitle>
                    <Badge className="text-[9px] bg-yellow-500/15 text-yellow-400 border-yellow-500/20">{mcpTools.length} ferramentas</Badge>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <p className="text-[10px] text-zinc-500 leading-relaxed mb-4">O Obscura implementa um servidor MCP que expoe ferramentas de automacao de navegador para agentes de IA (Claude Desktop, Cursor, etc).</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                    {mcpTools.map((tool, i) => {
                      const Icon = TOOL_ICONS[tool.name] ?? Code2;
                      return (
                        <motion.div key={tool.name} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}
                          className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20 hover:border-[#22d3ee]/20 transition-all">
                          <div className="flex items-center gap-2 mb-1.5">
                            <Icon className="w-3.5 h-3.5 text-[#22d3ee]" />
                            <span className="text-[11px] font-semibold text-zinc-200 font-mono">{tool.name}</span>
                          </div>
                          <p className="text-[9px] text-zinc-500 leading-relaxed">{tool.description}</p>
                        </motion.div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs font-semibold text-zinc-400 flex items-center gap-2"><Code2 className="w-3.5 h-3.5" />Configuracao Claude Desktop</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <pre className="bg-zinc-950/60 rounded-lg p-4 text-[10px] text-emerald-300 font-mono overflow-auto">{JSON.stringify({ mcpServers: { obscura: { command: 'obscura', args: ['mcp'] } } }, null, 2)}</pre>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──── NETWORK TAB ──── */}
          {activeSubTab === 'network' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Server className="w-4 h-4 text-[#00ff88]" />CDP Serve Mode
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20">
                      <p className="text-[9px] text-zinc-500">Status</p>
                      <p className={cn('text-sm font-bold', serve?.running ? 'text-emerald-400' : 'text-zinc-500')}>{serve?.running ? 'Running' : 'Stopped'}</p>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20">
                      <p className="text-[9px] text-zinc-500">Port / Workers</p>
                      <p className="text-sm font-bold text-zinc-200">:{serve?.port ?? 9223} / {serve?.workers ?? 4}</p>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20">
                      <p className="text-[9px] text-zinc-500">Uptime</p>
                      <p className="text-sm font-bold text-zinc-200">{serve?.uptimeSeconds ? `${Math.floor(serve.uptimeSeconds / 60)}m ${serve.uptimeSeconds % 60}s` : '--'}</p>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20">
                      <p className="text-[9px] text-zinc-500">PID</p>
                      <p className="text-sm font-bold text-zinc-200 font-mono">{serve?.pid ?? 'N/A'}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button onClick={() => handleServe(serve?.running ? 'stop' : 'start')}
                      className={cn('flex-1 text-xs', serve?.running
                        ? 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30'
                        : 'bg-[#00ff88]/15 text-[#00ff88] hover:bg-[#00ff88]/25 border border-[#00ff88]/30')}>
                      {serve?.running ? <><Trash2 className="w-3 h-3 mr-1" />Stop</> : <><Play className="w-3 h-3 mr-1" />Start</>}
                    </Button>
                    <Button onClick={fetchStatus} variant="ghost" className="bg-zinc-800/40 text-zinc-400 hover:text-zinc-200 border border-zinc-800/50 text-xs h-8 px-3">
                      <RefreshCw className="w-3 h-3" />
                    </Button>
                  </div>
                  <p className="text-[9px] text-zinc-600 leading-relaxed">Serve mode expoe um servidor CDP WebSocket para Puppeteer/Playwright. Compativel com <code className="text-cyan-400">obscura serve --port 9223 --stealth</code></p>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Shuffle className="w-4 h-4 text-[#a855f7]" />Proxy Rotation
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className="text-[9px] bg-purple-500/15 text-purple-400 border-purple-500/20">{proxy?.strategy ?? 'round-robin'}</Badge>
                      <span className="text-[9px] text-zinc-500">{proxy?.proxies.length ?? 0} proxies</span>
                    </div>
                    <Button onClick={handleProxyRotate} size="sm"
                      className="bg-purple-500/15 text-purple-400 hover:bg-purple-500/25 border border-purple-500/30 text-[10px] h-7 px-2">
                      <Shuffle className="w-3 h-3 mr-1" />Rotate
                    </Button>
                  </div>
                  {proxy && proxy.proxies.length > 0 ? (
                    <div className="space-y-1.5 max-h-[180px] overflow-auto">
                      {proxy.proxies.map((p, i) => (
                        <div key={i} className={cn('flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] border',
                          p.active ? 'bg-zinc-950/50 border-zinc-800/20' : 'bg-zinc-950/30 border-zinc-800/10 opacity-50')}>
                          <Wifi className="w-3 h-3 text-purple-400 flex-shrink-0" />
                          <span className="text-zinc-300 font-mono truncate flex-1">{p.url}</span>
                          <Badge className="text-[8px] bg-zinc-800 text-zinc-400">{p.type}</Badge>
                          <span className="text-emerald-400">{p.successCount}</span>
                          <span className="text-red-400">{p.failCount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Nenhum proxy configurado</p>
                  )}
                  <div className="flex items-center gap-3 text-[9px] text-zinc-500">
                    <span>Total: {proxy?.totalRequests ?? 0} req</span>
                    <span>Falhas: {proxy?.totalFailures ?? 0}</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <ShieldOff className="w-4 h-4 text-[#f97316]" />Request Interception
                    <button onClick={handleToggleIntercept} className="ml-auto">
                      {interception?.enabled ? <ToggleRight className="w-6 h-6 text-[#f97316]" /> : <ToggleLeft className="w-6 h-6 text-zinc-600" />}
                    </button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20 text-center">
                      <p className="text-[9px] text-zinc-500">Regras</p>
                      <p className="text-lg font-bold text-zinc-200">{interception?.rules.length ?? 0}</p>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20 text-center">
                      <p className="text-[9px] text-zinc-500">Bloqueados</p>
                      <p className="text-lg font-bold text-red-400">{interception?.totalBlocked ?? 0}</p>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20 text-center">
                      <p className="text-[9px] text-zinc-500">Interceptados</p>
                      <p className="text-lg font-bold text-orange-400">{interception?.totalIntercepted ?? 0}</p>
                    </div>
                  </div>
                  {interception && interception.rules.length > 0 ? (
                    <div className="space-y-1.5">
                      {interception.rules.map(rule => (
                        <div key={rule.id} className={cn('flex items-center gap-3 px-3 py-2 rounded-lg border text-[10px]',
                          rule.enabled ? 'bg-zinc-950/50 border-zinc-800/20' : 'bg-zinc-950/30 border-zinc-800/10 opacity-50')}>
                          <Badge className={cn('text-[8px]',
                            rule.action === 'block' ? 'bg-red-500/15 text-red-400 border-red-500/20' :
                            rule.action === 'fulfill' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/20' :
                            'bg-cyan-500/15 text-cyan-400 border-cyan-500/20')}>{rule.action}</Badge>
                          <span className="text-zinc-300 font-mono truncate flex-1">{rule.pattern}</span>
                          <span className="text-zinc-500">{rule.name}</span>
                          <span className="text-zinc-600">hits: {rule.hitCount}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[10px] text-zinc-600 text-center py-3">Nenhuma regra de interceptacao configurada</p>
                  )}
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──── STEALTH TAB ──── */}
          {activeSubTab === 'stealth' && (
            <div className="space-y-4">
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#00ff88]" />Tracker Blocking
                    </CardTitle>
                    <button onClick={handleToggleTracker}>
                      {trackers?.enabled ? <ToggleRight className="w-6 h-6 text-[#00ff88]" /> : <ToggleLeft className="w-6 h-6 text-zinc-600" />}
                    </button>
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20 text-center">
                      <p className="text-[9px] text-zinc-500">Dominios Bloqueados</p>
                      <p className="text-lg font-bold text-[#00ff88]">{trackers?.totalBlockedDomains.toLocaleString() ?? '3.520'}</p>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20 text-center">
                      <p className="text-[9px] text-zinc-500">Session Blocked</p>
                      <p className="text-lg font-bold text-red-400">{trackers?.sessionBlocked ?? 0}</p>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20 text-center">
                      <p className="text-[9px] text-zinc-500">Session Requests</p>
                      <p className="text-lg font-bold text-zinc-200">{trackers?.sessionRequests ?? 0}</p>
                    </div>
                    <div className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20 text-center">
                      <p className="text-[9px] text-zinc-500">Block Rate</p>
                      <p className="text-lg font-bold text-orange-400">
                        {trackers && trackers.sessionRequests > 0 ? `${Math.round((trackers.sessionBlocked / trackers.sessionRequests) * 100)}%` : '--'}
                      </p>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-500 leading-relaxed">Categorias de tracking bloqueadas pelo Obscura stealth mode:</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                    {trackers?.categories && Object.entries(trackers.categories).map(([cat, count]) => (
                      <div key={cat} className="bg-zinc-950/50 rounded-lg p-2.5 border border-zinc-800/20">
                        <div className="flex items-center gap-1.5 mb-1">
                          <div className="w-2 h-2 rounded-full" style={{ background: CAT_COLORS[cat] ?? '#71717a' }} />
                          <span className="text-[10px] font-medium text-zinc-300 capitalize">{cat}</span>
                        </div>
                        <p className="text-sm font-bold" style={{ color: CAT_COLORS[cat] ?? '#71717a' }}>{count}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
                    <Gauge className="w-4 h-4 text-[#22d3ee]" />Top Blocked Domains
                  </CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="space-y-1.5">
                    {trackers?.topBlocked.map((t, i) => (
                      <div key={t.domain} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-zinc-950/50 border border-zinc-800/20">
                        <span className="text-[10px] text-zinc-600 w-5">#{i + 1}</span>
                        <span className="text-[11px] text-zinc-300 font-mono flex-1">{t.domain}</span>
                        <Badge className="text-[8px]" style={{ background: (CAT_COLORS[t.category] ?? '#71717a') + '20', color: CAT_COLORS[t.category] ?? '#71717a', borderColor: (CAT_COLORS[t.category] ?? '#71717a') + '40' }}>{t.category}</Badge>
                        <span className="text-[10px] text-zinc-500">{t.count} blocks</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs font-semibold text-zinc-400 flex items-center gap-2"><Shield className="w-3.5 h-3.5" />Anti-Fingerprint Features</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                    {[
                      'Fingerprint randomization (GPU, screen, canvas, audio, battery)',
                      'Realistic navigator.userAgentData (Chrome 145)',
                      'event.isTrusted = true para eventos dispatchados',
                      'Native function masking (Function.prototype.toString)',
                      'navigator.webdriver = undefined',
                      'Propriedades internas ocultas',
                      'Per-session fingerprint rotation',
                      'SSRF protection (loopback/RFC1918 blocked)',
                    ].map((f, i) => (
                      <div key={i} className="flex items-start gap-2 text-[10px]">
                        <CheckCircle2 className="w-3 h-3 text-[#00ff88] flex-shrink-0 mt-0.5" />
                        <span className="text-zinc-400 leading-relaxed">{f}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ──── INFO TAB ──── */}
          {activeSubTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><Activity className="w-4 h-4 text-[#22d3ee]" />Obscura Engine</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-2.5">
                  {status ? [
                    ['Status', status.running ? 'Online' : 'Offline'], ['Versao', status.version],
                    ['V8 Engine', status.v8Version || 'N/A'], ['Protocolo', `CDP v${status.protocolVersion}`],
                    ['CDP URL', status.cdpUrl], ['Stealth', status.stealth ? 'Ativado' : 'Desativado'],
                  ].map(([label, value]) => (
                    <div key={label} className="flex items-center justify-between py-1.5 border-b border-zinc-800/20 last:border-0">
                      <span className="text-[10px] text-zinc-500">{label}</span>
                      <span className="text-[10px] text-zinc-300 font-mono truncate max-w-[250px]">{value}</span>
                    </div>
                  )) : <p className="text-xs text-zinc-600">Carregando...</p>}
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-3 px-4 pt-4">
                  <CardTitle className="text-sm font-semibold text-zinc-200 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-[#00ff88]" />Benchmarks vs Chrome</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4 space-y-3">
                  {[['Memoria', '30 MB', '200+ MB', true], ['Binario', '70 MB', '300+ MB', true],
                    ['Page load', '85 ms', '~500 ms', true], ['Startup', 'Instant', '~2s', true],
                    ['Anti-detect', 'Built-in', 'Nenhum', true],
                  ].map(([metric, obs, chr, better]) => (
                    <div key={metric} className="flex items-center gap-3">
                      <span className="text-[10px] text-zinc-500 w-20">{metric}</span>
                      <div className="flex-1 flex items-center gap-2">
                        <span className="text-[10px] text-[#22d3ee] font-mono font-medium">{obs}</span>
                        <ArrowRight className="w-3 h-3 text-zinc-700" />
                        <span className="text-[10px] text-zinc-500 font-mono">{chr}</span>
                      </div>
                      {better && <Badge className="text-[8px] bg-emerald-500/10 text-emerald-400 border-emerald-500/20">faster</Badge>}
                    </div>
                  ))}
                </CardContent>
              </Card>
              <Card className="lg:col-span-2 bg-zinc-900/60 border-zinc-800/40 rounded-xl">
                <CardHeader className="pb-2 px-4 pt-3">
                  <CardTitle className="text-xs font-semibold text-zinc-400 flex items-center gap-2"><MonitorSmartphone className="w-3.5 h-3.5" />Arquitetura Rust (8 Crates)</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      ['obscura-cli', 'CLI: fetch, serve, scrape, mcp', '#22d3ee'],
                      ['obscura-cdp', 'CDP WebSocket server', '#f97316'],
                      ['obscura-browser', 'Page/Navigation layer', '#a855f7'],
                      ['obscura-js', 'V8 runtime + bootstrap.js', '#00ff88'],
                      ['obscura-dom', 'DOM tree (html5ever)', '#fbbf24'],
                      ['obscura-net', 'HTTP client + cookies', '#e01b24'],
                      ['obscura-mcp', 'MCP server (AI agents)', '#3b82f6'],
                      ['obscura', 'Embeddable library API', '#71717a'],
                    ].map(([name, desc, color]) => (
                      <div key={name} className="bg-zinc-950/50 rounded-lg p-3 border border-zinc-800/20">
                        <p className="text-[11px] font-semibold font-mono" style={{ color }}>{name}</p>
                        <p className="text-[9px] text-zinc-500 mt-1">{desc}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

        </motion.div>
      </AnimatePresence>

      {/* ═══ FOOTER ═══ */}
      <div className="flex items-center justify-between text-[9px] text-zinc-700 border-t border-zinc-800/20 pt-3">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3" />Stealth</span>
          <span className="flex items-center gap-1"><Cpu className="w-3 h-3" />V8</span>
          <span className="flex items-center gap-1"><Network className="w-3 h-3" />CDP</span>
          <span className="flex items-center gap-1"><Terminal className="w-3 h-3" />MCP</span>
          <span className="flex items-center gap-1"><Server className="w-3 h-3" />Serve</span>
          <span className="flex items-center gap-1"><Shuffle className="w-3 h-3" />Proxy</span>
        </div>
        <span>Obscura v0.1.10 &bull; h4ckf0r0day/obscura &bull; Apache-2.0</span>
      </div>
    </div>
  );
}
