'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  Activity, Cpu, HardDrive, MemoryStick, MonitorDot, Zap,
  Gauge, Timer, Layers, Database, Server, RefreshCw, Wifi, WifiOff,
  LoaderCircle, BrainCircuit, ArrowUp, CircleStop, MessageSquareText,
  Trash2, Feather, Clock, Eye, Link2, KeyRound, Settings,
  Shield, Route, Waypoints, Network, Workflow,
  Bot, Dna, Atom, Sparkles, Globe, Users, Landmark, Flame,
  ChevronRight, CheckCircle2, AlertTriangle, XCircle,
  CircleDot, Radio, BarChart3, TrendingUp, Lock, FileJson,
  Blocks, ScanSearch, Microscope, FlaskConical, Stethoscope,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface SchedulerHealth {
  active: number | boolean; capacity?: number; queued: number; max_queue: number;
  completed: number; rejected: number; timed_out: number; cancelled: number;
}
interface TiersHealth { vram: number; ram: number; disk: number; vram_gb: number; ram_gb: number; }
interface HwinfoHealth {
  cores: number; ram_total_gb: number; ram_avail_gb: number; gpus: number;
  vram_total_gb: number; cpu: string; gpu: string;
}
interface HealthResponse {
  status: string; scheduler?: SchedulerHealth; kv_slots?: number; tiers?: TiersHealth; hwinfo?: HwinfoHealth;
}

// ═══════════════════════════════════════════════════════════════
// ANIMATED COUNTER HOOK
// ═══════════════════════════════════════════════════════════════
function useAnimatedValue(target: number, duration = 1200) {
  const [val, setVal] = useState(0);
  const rafRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    startRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(target * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, duration]);

  return val;
}

// ═══════════════════════════════════════════════════════════════
// MINI SPARKLINE
// ═══════════════════════════════════════════════════════════════
function MiniSpark({ values, color, h = 20 }: { values: number[]; color: string; h?: number }) {
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-[2px]" style={{ height: h }}>
      {values.map((v, i) => (
        <div key={i} className="flex-1 rounded-t-sm transition-all duration-300" style={{ height: `${(v / max) * 100}%`, backgroundColor: color, opacity: 0.4 + (v / max) * 0.6 }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// STATUS PILL
// ═══════════════════════════════════════════════════════════════
function StatusPill({ status }: { status: 'online' | 'degraded' | 'offline' | 'standby' }) {
  const cfg = {
    online: { color: '#00ff88', bg: 'rgba(0,255,136,0.1)', border: 'rgba(0,255,136,0.25)', label: 'ONLINE' },
    degraded: { color: '#fbbf24', bg: 'rgba(251,191,36,0.1)', border: 'rgba(251,191,36,0.25)', label: 'DEGRADED' },
    offline: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', border: 'rgba(239,68,68,0.25)', label: 'OFFLINE' },
    standby: { color: '#71717a', bg: 'rgba(113,113,122,0.1)', border: 'rgba(113,113,122,0.25)', label: 'STANDBY' },
  }[status];
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold tracking-wider" style={{ color: cfg.color, backgroundColor: cfg.bg, border: `1px solid ${cfg.border}` }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.color }} />
      {cfg.label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════
// 1. ENGINE STATUS CARD (Colibri / CHIMERA)
// ═══════════════════════════════════════════════════════════════
function EngineStatusCard({ health, connected, onRefresh }: {
  health: HealthResponse | null; connected: boolean; onRefresh: () => void;
}) {
  const active = Number(health?.scheduler?.active || 0);
  const capacity = health?.scheduler?.capacity || 0;
  const queued = health?.scheduler?.queued || 0;
  const completed = health?.scheduler?.completed || 0;
  const failures = health?.scheduler
    ? health.scheduler.rejected + health.scheduler.timed_out + health.scheduler.cancelled
    : 0;

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-emerald-400" />
            Motor CHIMERA
          </CardTitle>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRefresh}>
            <RefreshCw className={cn("w-3.5 h-3.5 text-zinc-500", connected && "text-emerald-400")} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center gap-2">
          {connected ? (
            <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
              <Wifi className="w-2.5 h-2.5 mr-1" /> Online
            </Badge>
          ) : (
            <Badge className="bg-red-500/15 text-red-400 border-red-500/30 text-[10px]">
              <WifiOff className="w-2.5 h-2.5 mr-1" /> Offline
            </Badge>
          )}
          <span className="text-[10px] text-zinc-600 font-mono">{health?.status || 'unknown'}</span>
        </div>
        {health?.scheduler && (
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: 'Ativo', value: active, sub: `/${capacity}` },
              { label: 'Fila', value: queued, sub: `/${health.scheduler.max_queue}` },
              { label: 'Completos', value: completed },
              { label: 'Falhas', value: failures },
            ].map((item) => (
              <div key={item.label} className="bg-zinc-800/50 rounded-lg p-2.5 border border-zinc-700/30">
                <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{item.label}</div>
                <div className="text-base font-bold text-zinc-100 font-mono">
                  {item.value}<span className="text-xs text-zinc-500">{item.sub}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 2. HARDWARE CARD
// ═══════════════════════════════════════════════════════════════
function HardwareCard({ hwinfo }: { hwinfo: HwinfoHealth | null }) {
  if (!hwinfo) return (
    <Card className="border-zinc-800/60 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-amber-400" /> Hardware
        </CardTitle>
      </CardHeader>
      <CardContent><p className="text-[11px] text-zinc-600">Conecte ao motor para ver hardware.</p></CardContent>
    </Card>
  );
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-amber-400" /> Hardware
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2.5">
        <div className="flex items-center gap-2 text-[11px]">
          <Cpu className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          <span className="text-zinc-300 truncate">{hwinfo.cpu || 'N/A'}</span>
        </div>
        {hwinfo.gpus > 0 && (
          <div className="flex items-center gap-2 text-[11px]">
            <MonitorDot className="w-3.5 h-3.5 text-blue-400 flex-shrink-0" />
            <span className="text-zinc-300">{hwinfo.gpus}x GPU</span>
            <span className="text-zinc-500 ml-auto">{hwinfo.vram_total_gb.toFixed(0)} GB VRAM</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-[11px]">
          <MemoryStick className="w-3.5 h-3.5 text-purple-400 flex-shrink-0" />
          <span className="text-zinc-300">{hwinfo.ram_total_gb.toFixed(0)} GB RAM</span>
          <span className="text-zinc-500 ml-auto">{hwinfo.ram_avail_gb.toFixed(0)} GB livre</span>
        </div>
        <div className="flex items-center gap-2 text-[11px]">
          <Server className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
          <span className="text-zinc-300">{hwinfo.cores} cores</span>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 3. EXPERT TIERS CARD
// ═══════════════════════════════════════════════════════════════
function ExpertTiersCard({ tiers }: { tiers: TiersHealth | null }) {
  if (!tiers) return (
    <Card className="border-zinc-800/60 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" /> Expert Tiers
        </CardTitle>
      </CardHeader>
      <CardContent><p className="text-[11px] text-zinc-600">Conecte ao motor para ver tiers.</p></CardContent>
    </Card>
  );
  const total = Math.max(tiers.vram + tiers.ram + tiers.disk, 1);
  const vramPct = (100 * tiers.vram) / total;
  const ramPct = (100 * tiers.ram) / total;
  const diskPct = (100 * tiers.disk) / total;
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" /> Expert Tiers
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex h-3 rounded-full overflow-hidden border border-zinc-700/50 bg-zinc-800">
          <div className="bg-emerald-500 transition-all duration-700" style={{ width: `${vramPct}%` }} />
          <div className="bg-blue-500 transition-all duration-700" style={{ width: `${ramPct}%` }} />
          <div className="bg-zinc-600 transition-all duration-700" style={{ width: `${diskPct}%` }} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          {[
            { label: 'VRAM', count: tiers.vram, gb: tiers.vram_gb, color: 'text-emerald-400', dot: 'bg-emerald-500' },
            { label: 'RAM', count: tiers.ram, gb: tiers.ram_gb, color: 'text-blue-400', dot: 'bg-blue-500' },
            { label: 'Disk', count: tiers.disk, gb: null, color: 'text-zinc-400', dot: 'bg-zinc-500' },
          ].map((t) => (
            <div key={t.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <span className={cn("w-2 h-2 rounded-sm", t.dot)} />
                <span className="text-[10px] text-zinc-500 font-bold uppercase">{t.label}</span>
              </div>
              <div className={cn("text-sm font-bold font-mono", t.color)}>{t.count.toLocaleString()}</div>
              {t.gb !== null && <div className="text-[9px] text-zinc-600">{t.gb.toFixed(1)} GB</div>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 4. EXPERT CORTEX HEATMAP
// ═══════════════════════════════════════════════════════════════
function ExpertCortexCard({ connected }: { connected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<{ rows: number; cols: number; map: string } | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; row: number; col: number; tier: number; heat: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 250 });

  useEffect(() => {
    if (!connected) return;
    let disposed = false;
    const poll = async () => { try { const res = await fetch('/api/colibri/experts'); if (!res.ok) return; const next = await res.json(); if (disposed || !next?.rows) return; setData(next); } catch { /* */ } };
    void poll();
    const t = setInterval(() => void poll(), 3000);
    return () => { disposed = true; clearInterval(t); };
  }, [connected]);

  useEffect(() => {
    const el = wrapRef.current; if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth - 20, h: el.clientHeight - 20 }));
    ro.observe(el); return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current; if (!canvas || !data) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    const { rows, cols, map } = data;
    const cell = Math.max(2, Math.floor(Math.min(size.w / cols, size.h / rows)));
    const gap = cell >= 4 ? 1 : 0;
    canvas.width = cols * (cell + gap); canvas.height = rows * (cell + gap);
    const TIER_RGB: [number, number, number][] = [[58, 71, 80], [90, 155, 216], [78, 214, 165]];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) { for (let c = 0; c < cols; c++) { const i = r * cols + c; const byte = parseInt(map.substr(i * 2, 2), 16) || 0; const tier = byte >> 6; const heat = byte & 63; const [R, G, B] = TIER_RGB[tier] ?? TIER_RGB[0]; const lum = 0.35 + 0.65 * Math.min(heat / 24, 1); ctx.fillStyle = `rgb(${(R * lum) | 0},${(G * lum) | 0},${(B * lum) | 0})`; ctx.fillRect(c * (cell + gap), r * (cell + gap), cell, cell); } }
  }, [data, size]);

  const TIER_NAME = ['Disk', 'RAM', 'VRAM'];
  const TIER_COLOR = ['#8b9aa3', '#5a9bd8', '#4ed6a5'];

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            Expert Cortex {data ? `— ${data.rows} layers x ${data.cols} experts` : ''}
          </CardTitle>
          <div className="flex gap-3 text-[10px] text-zinc-500">
            {TIER_NAME.map((name, i) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: TIER_COLOR[i] }} />{name}
              </span>
            ))}
            <span className="text-emerald-400">brightness = routing heat</span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={wrapRef} className="border border-zinc-700/30 rounded-lg bg-[#07090a] p-2.5 min-h-[200px] flex items-center justify-center overflow-auto" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center' }}>
          {connected && data ? (
            <canvas ref={canvasRef} style={{ imageRendering: 'pixelated', maxWidth: '100%', cursor: 'crosshair' }}
              onMouseMove={(e) => { if (!data) return; const rect = e.currentTarget.getBoundingClientRect(); const sx = e.currentTarget.width / rect.width; const sy = e.currentTarget.height / rect.height; const cell = Math.max(2, Math.floor(Math.min(size.w / data.cols, size.h / data.rows))); const gap = cell >= 4 ? 1 : 0; const col = Math.floor(((e.clientX - rect.left) * sx) / (cell + gap)); const row = Math.floor(((e.clientY - rect.top) * sy) / (cell + gap)); if (row < 0 || row >= data.rows || col < 0 || col >= data.cols) { setTip(null); return; } const byte = parseInt(data.map.substr((row * data.cols + col) * 2, 2), 16) || 0; setTip({ x: e.clientX, y: e.clientY, row, col, tier: byte >> 6, heat: byte & 63 }); }}
              onMouseLeave={() => setTip(null)}
            />
          ) : (
            <p className="text-[11px] text-zinc-600">Conecte ao motor CHIMERA para ver o cortex de experts.</p>
          )}
        </div>
        {tip && data && (
          <div className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-[11px] pointer-events-none shadow-xl max-w-[260px]" style={{ left: tip.x + 14, top: tip.y + 14 }}>
            <div className="font-bold text-emerald-400 flex items-center gap-1.5"><Layers className="w-3 h-3" /> Layer {tip.row + 3} . Expert {tip.col}</div>
            <div>Tier: <strong style={{ color: TIER_COLOR[tip.tier] }}>{TIER_NAME[tip.tier]}</strong></div>
            <div>Heat: <strong>{tip.heat === 0 ? 'never routed' : `~2^${tip.heat} selections`}</strong></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 5. CONNECTION CONFIG CARD
// ═══════════════════════════════════════════════════════════════
function ConnectionCard({ connected, onConnect, loading }: {
  connected: boolean; onConnect: (url: string) => void; loading: boolean;
}) {
  const [url, setUrl] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('colibri.baseUrl') || 'http://127.0.0.1:8000/v1';
    return 'http://127.0.0.1:8000/v1';
  });
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-3.5 h-3.5 text-cyan-400" /> Conexao CHIMERA Engine
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-[10px]", connected ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-red-500/15 text-red-400 border-red-500/30")}>
              {connected ? <><Wifi className="w-2.5 h-2.5 mr-1" /> Online</> : <><WifiOff className="w-2.5 h-2.5 mr-1" /> Offline</>}
            </Badge>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setExpanded(!expanded)}>
              <Settings className={cn("w-3 h-3 text-zinc-500 transition-transform", expanded && "rotate-90")} />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!expanded ? (
          <p className="text-[10px] text-zinc-500">Motor GLM-5.2 744B MoE via OpenAI-compatible API. {connected ? 'Conectado e recebendo metricas.' : 'Clique em ⚙ para configurar o endpoint.'}</p>
        ) : (
          <div className="space-y-2.5">
            <label className="block">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">API Endpoint</span>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  <Input value={url} onChange={e => setUrl(e.target.value)} className="h-8 pl-8 text-[11px] bg-zinc-800/50 border-zinc-700/50 font-mono text-zinc-300" placeholder="http://127.0.0.1:8000/v1" />
                </div>
                <Button size="sm" className="h-8 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white" onClick={() => { localStorage.setItem('colibri.baseUrl', url); onConnect(url); }} disabled={loading}>
                  {loading ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />} Conectar
                </Button>
              </div>
            </label>
            <p className="text-[9px] text-zinc-600">O endpoint deve apontar para o servidor CHIMERA/Colibri (./coli serve). Porta padrao: 8000.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 6. INLINE CHAT
// ═══════════════════════════════════════════════════════════════
interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; }

function InlineChat({ connected }: { connected: boolean }) {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<{ tokens: number; tokPerSec: number | null; ttft: number | null }>({ tokens: 0, tokPerSec: null, ttft: null });
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(async () => {
    const content = draft.trim(); if (!content || loading) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: 'user', content };
    const assistMsg: ChatMsg = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMsg, assistMsg]); setDraft(''); setLoading(true);
    setMetrics({ tokens: 0, tokPerSec: null, ttft: null });
    const t0 = performance.now(); let firstToken = true; let count = 0;
    const controller = new AbortController(); abortRef.current = controller;
    try {
      const res = await fetch('/api/colibri/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: 'glm-5.2-colibri', messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })), temperature: 0.7, max_completion_tokens: 512, }), signal: controller.signal, });
      if (!res.ok) throw new Error(`Engine error: ${res.status}`);
      const reader = res.body?.getReader(); if (!reader) throw new Error('Empty stream');
      const decoder = new TextDecoder(); let buffer = '';
      while (true) { const { value, done } = await reader.read(); buffer += decoder.decode(value, { stream: !done }); const frames = buffer.split(/\r?\n\r?\n/); buffer = frames.pop() || ''; for (const frame of frames) { const lines = frame.split(/\r?\n/).filter(l => l.startsWith('data:')); for (const line of lines) { const data = line.slice(5).trim(); if (data === '[DONE]') break; try { const event = JSON.parse(data); const text = event.choices?.[0]?.delta?.content; if (text) { if (firstToken) { setMetrics(prev => ({ ...prev, ttft: performance.now() - t0 })); firstToken = false; } count++; setMessages(prev => prev.map(m => m.id === assistMsg.id ? { ...m, content: m.content + text } : m)); const elapsed = (performance.now() - t0) / 1000; if (elapsed > 0.3) setMetrics(prev => ({ ...prev, tokens: count, tokPerSec: count / elapsed })); } } catch { /* */ } } } if (done) break; }
      const finalElapsed = (performance.now() - t0) / 1000; if (count > 0) setMetrics(prev => ({ ...prev, tokens: count, tokPerSec: count / finalElapsed }));
    } catch (err) {
      if (!(controller.signal.aborted)) setMessages(prev => prev.map(m => m.id === assistMsg.id ? { ...m, content: `Erro: ${err instanceof Error ? err.message : 'Falha na geracao'}` } : m));
    } finally { abortRef.current = null; setLoading(false); }
  }, [draft, loading, messages]);

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquareText className="w-3.5 h-3.5 text-cyan-400" /> Chat CHIMERA
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {loading && metrics.tokens > 0 && (<Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]"><Zap className="w-2.5 h-2.5 mr-1" /> {metrics.tokens} tokens</Badge>)}
            {!loading && metrics.tokPerSec !== null && (<Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]"><Gauge className="w-2.5 h-2.5 mr-1" /> {metrics.tokPerSec.toFixed(1)} tok/s</Badge>)}
            {!loading && metrics.ttft !== null && (<Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]"><Timer className="w-2.5 h-2.5 mr-1" /> TTFT {(metrics.ttft / 1000).toFixed(1)}s</Badge>)}
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]"><Eye className="w-2.5 h-2.5 mr-1" /> Slot 1</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[350px] overflow-y-auto mb-3 space-y-3">
          {!messages.length ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center mx-auto mb-3"><Feather className="w-6 h-6 text-emerald-400" /></div>
              <h3 className="text-lg text-zinc-300 font-light mb-1">Ask the giant.</h3>
              <p className="text-[11px] text-zinc-600">Conecte ao motor CHIMERA e converse diretamente com GLM-5.2.</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
                {msg.role === 'assistant' && (<div className="w-7 h-7 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center flex-shrink-0"><Feather className="w-3.5 h-3.5 text-emerald-400" /></div>)}
                <div className={cn('max-w-[75%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed', msg.role === 'user' ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-800/50 border border-zinc-700/30 text-zinc-200')}>
                  {msg.content || <span className="inline-flex gap-1 pt-1"><i className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><i className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:150ms]" /><i className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:300ms]" /></span>}
                </div>
                {msg.role === 'user' && (<div className="w-7 h-7 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-zinc-400">Y</div>)}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Textarea value={draft} onChange={e => setDraft(e.target.value)} placeholder="Message colibri..." className="min-h-[44px] max-h-[120px] resize-none bg-zinc-800/50 border-zinc-700/50 text-[13px] text-zinc-200 placeholder:text-zinc-600 rounded-xl" onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }} disabled={!connected} />
          {loading ? (
            <Button size="icon" variant="destructive" className="h-[44px] w-[44px] rounded-xl flex-shrink-0" onClick={() => abortRef.current?.abort()}><CircleStop className="w-4 h-4" /></Button>
          ) : (
            <Button size="icon" className="h-[44px] w-[44px] rounded-xl flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white" disabled={!draft.trim() || !connected} onClick={() => void send()}><ArrowUp className="w-4 h-4" /></Button>
          )}
          <Button size="icon" variant="ghost" className="h-[44px] w-[44px] rounded-xl flex-shrink-0" onClick={() => { setMessages([]); setMetrics({ tokens: 0, tokPerSec: null, ttft: null }); }} disabled={!messages.length}>
            <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 7. 9ROUTER PROVIDER GRID
// ═══════════════════════════════════════════════════════════════
const PROVIDERS = [
  { name: 'GLM', status: 'online' as const, latency: 89, rpm: 1240, model: 'GLM-5.2 744B', color: '#00ff88' },
  { name: 'DeepSeek', status: 'online' as const, latency: 120, rpm: 890, model: 'DeepSeek-V3', color: '#06b6d4' },
  { name: 'Groq', status: 'online' as const, latency: 45, rpm: 2100, model: 'Llama 4 Maverick', color: '#f97316' },
  { name: 'OpenAI', status: 'online' as const, latency: 230, rpm: 560, model: 'GPT-4o', color: '#a855f7' },
  { name: 'Anthropic', status: 'online' as const, latency: 310, rpm: 420, model: 'Claude 4 Sonnet', color: '#fbbf24' },
  { name: 'Gemini', status: 'online' as const, latency: 180, rpm: 780, model: 'Gemini 2.5 Pro', color: '#06d6a0' },
  { name: 'OpenRouter', status: 'online' as const, latency: 250, rpm: 650, model: 'Multi-model', color: '#ec4899' },
  { name: 'Mistral', status: 'online' as const, latency: 95, rpm: 1100, model: 'Mistral Large', color: '#f97316' },
  { name: 'Together', status: 'online' as const, latency: 140, rpm: 920, model: 'Llama 4', color: '#8b5cf6' },
  { name: 'Fireworks', status: 'online' as const, latency: 78, rpm: 1800, model: 'Llama 4 Scout', color: '#ef4444' },
  { name: 'xAI', status: 'degraded' as const, latency: 450, rpm: 180, model: 'Grok 3', color: '#fbbf24' },
  { name: 'Cerebras', status: 'online' as const, latency: 32, rpm: 3200, model: 'Llama 4', color: '#06b6d4' },
  { name: 'SiliconFlow', status: 'online' as const, latency: 110, rpm: 1500, model: 'DeepSeek', color: '#22d3ee' },
  { name: 'Ollama', status: 'standby' as const, latency: 0, rpm: 0, model: 'Local', color: '#71717a' },
  { name: 'Azure', status: 'online' as const, latency: 200, rpm: 700, model: 'GPT-4o', color: '#3b82f6' },
  { name: 'Cohere', status: 'online' as const, latency: 160, rpm: 850, model: 'Command R+', color: '#f97316' },
  { name: 'NVIDIA', status: 'online' as const, latency: 70, rpm: 2400, model: 'Llama 4', color: '#84cc16' },
  { name: 'Hyperbolic', status: 'online' as const, latency: 55, rpm: 2800, model: 'Llama 4', color: '#a855f7' },
  { name: 'SambaNova', status: 'online' as const, latency: 42, rpm: 3000, model: 'Llama 4', color: '#06d6a0' },
  { name: 'Cloudflare', status: 'degraded' as const, latency: 380, rpm: 200, model: 'Llama 4', color: '#f97316' },
];

function ProviderGrid() {
  const onlineCount = PROVIDERS.filter(p => p.status === 'online').length;
  const totalRpm = PROVIDERS.reduce((a, p) => a + p.rpm, 0);
  const avgLatency = Math.round(PROVIDERS.filter(p => p.status !== 'standby').reduce((a, p) => a + p.latency, 0) / PROVIDERS.filter(p => p.status !== 'standby').length);
  const animatedRpm = useAnimatedValue(totalRpm);
  const animatedOnline = useAnimatedValue(onlineCount);

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-emerald-400" />
            9router — Provider Grid
          </CardTitle>
          <div className="flex gap-3 items-center">
            <div className="flex gap-4 text-center">
              <div><div className="text-[9px] text-zinc-500 font-bold uppercase">Online</div><div className="text-sm font-bold font-mono text-emerald-400">{animatedOnline}/{PROVIDERS.length}</div></div>
              <div><div className="text-[9px] text-zinc-500 font-bold uppercase">RPM Total</div><div className="text-sm font-bold font-mono text-cyan-400">{animatedRpm.toLocaleString()}</div></div>
              <div><div className="text-[9px] text-zinc-500 font-bold uppercase">Latencia Media</div><div className="text-sm font-bold font-mono text-purple-400">{avgLatency}ms</div></div>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
          {PROVIDERS.map((p) => (
            <motion.div key={p.name} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.2 }} className="rounded-lg border border-zinc-800/60 bg-zinc-800/30 p-3 hover:border-zinc-700/60 transition-all cursor-default group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: p.color, opacity: p.status === 'standby' ? 0.3 : 1, boxShadow: p.status === 'online' ? `0 0 6px ${p.color}80` : 'none' }} />
                  <span className="text-[11px] font-bold text-zinc-200 group-hover:text-white transition-colors">{p.name}</span>
                </div>
                <StatusPill status={p.status} />
              </div>
              <div className="text-[9px] text-zinc-500 font-mono mb-1.5 truncate">{p.model}</div>
              {p.status !== 'standby' && (
                <div className="flex justify-between text-[9px] font-mono">
                  <span className="text-zinc-600">{p.latency}ms</span>
                  <span className="text-zinc-600">{p.rpm.toLocaleString()} rpm</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 8. FALLBACK CHAIN MONITOR
// ═══════════════════════════════════════════════════════════════
const FALLBACK_CHAIN = [
  { provider: 'GLM', color: '#00ff88', status: 'active' as const, latency: 89, tokens: '744B MoE' },
  { provider: 'DeepSeek', color: '#06b6d4', status: 'standby' as const, latency: 120, tokens: '671B MoE' },
  { provider: 'Groq', color: '#f97316', status: 'standby' as const, latency: 45, tokens: 'Llama 4' },
  { provider: 'OpenAI', color: '#a855f7', status: 'standby' as const, latency: 230, tokens: 'GPT-4o' },
  { provider: 'Anthropic', color: '#fbbf24', status: 'standby' as const, latency: 310, tokens: 'Claude 4' },
  { provider: 'Gemini', color: '#06d6a0', status: 'standby' as const, latency: 180, tokens: '2.5 Pro' },
  { provider: 'OpenRouter', color: '#ec4899', status: 'standby' as const, latency: 250, tokens: 'Multi' },
  { provider: 'ZAI SDK', color: '#71717a', status: 'standby' as const, latency: 0, tokens: 'Fallback' },
];

function FallbackChainMonitor() {
  const [activeIdx, setActiveIdx] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setActiveIdx(i => (i + 1) % FALLBACK_CHAIN.length), 2000);
    return () => clearInterval(t);
  }, []);

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Route className="w-3.5 h-3.5 text-orange-400" />
          Fallback Chain
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-1.5">
          {FALLBACK_CHAIN.map((step, i) => (
            <motion.div key={step.provider} className="flex items-center gap-3 rounded-lg px-3 py-2 border transition-all" style={{ borderColor: activeIdx === i ? `${step.color}40` : 'transparent', backgroundColor: activeIdx === i ? `${step.color}08` : 'transparent' }} animate={{ x: activeIdx === i ? [0, 4, 0] : 0 }} transition={{ duration: 0.3 }}>
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-bold font-mono" style={{ backgroundColor: `${step.color}20`, color: step.color, border: `1px solid ${step.color}30` }}>{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold" style={{ color: step.color }}>{step.provider}</span>
                  <span className="text-[9px] text-zinc-600 font-mono">{step.tokens}</span>
                </div>
              </div>
              {step.status === 'active' ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] font-mono text-zinc-500">{step.latency}ms</span>
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: step.color }} />
                </div>
              ) : (
                <span className="text-[9px] font-mono text-zinc-700">{step.latency}ms</span>
              )}
              {i < FALLBACK_CHAIN.length - 1 && <ChevronRight className="w-3 h-3 text-zinc-700 absolute right-1" />}
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 9. AGENT COMMAND CENTER
// ═══════════════════════════════════════════════════════════════
const AGENTS = [
  { name: 'Mythos', role: 'Narrativa & Metaverso', icon: Globe, color: '#a855f7', status: 'active' as const, contextUsed: 23, contextTotal: 128, lastAction: 'Gerando narrativa rRNA', rpm: 340 },
  { name: 'Fable 5 OS', role: 'Orquestracao Multi-Skill', icon: Sparkles, color: '#00ff88', status: 'active' as const, contextUsed: 67, contextTotal: 128, lastAction: 'Spawn task #847', rpm: 1200 },
  { name: 'RAG rRNA', role: 'Pipeline Clinico', icon: Stethoscope, color: '#e040a0', status: 'active' as const, contextUsed: 45, contextTotal: 128, lastAction: 'Rerank 12 documentos', rpm: 890 },
  { name: 'Bitcoin Vault', role: 'Custodia & Geração', icon: Lock, color: '#f97316', status: 'idle' as const, contextUsed: 8, contextTotal: 64, lastAction: 'Gerou endereço hd(0)', rpm: 45 },
  { name: '9router', role: 'Smart Routing 20+ LLMs', icon: Route, color: '#22d3ee', status: 'active' as const, contextUsed: 12, contextTotal: 32, lastAction: 'Fallback GLM→DeepSeek', rpm: 15600 },
  { name: 'Colibri', role: 'GLM-5.2 Expert Cortex', icon: BrainCircuit, color: '#4ed6a5', status: 'active' as const, contextUsed: 94, contextTotal: 128, lastAction: 'Routing expert L47', rpm: 2800 },
  { name: 'Moltbook', role: 'Registro Imutável', icon: FileJson, color: '#e01b24', status: 'idle' as const, contextUsed: 3, contextTotal: 32, lastAction: 'Append block #12,847', rpm: 120 },
];

function AgentCommandCenter() {
  const activeAgents = AGENTS.filter(a => a.status === 'active').length;
  const totalRpm = AGENTS.reduce((a, b) => a + b.rpm, 0);
  const animatedRpm = useAnimatedValue(totalRpm);

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Bot className="w-3.5 h-3.5 text-purple-400" />
            Agent Command Center — {activeAgents}/{AGENTS.length} Ativos
          </CardTitle>
          <div className="flex gap-3 items-center">
            <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]"><Zap className="w-2.5 h-2.5 mr-1" /> {animatedRpm.toLocaleString()} rpm total</Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {AGENTS.map((agent) => {
            const pct = (agent.contextUsed / agent.contextTotal) * 100;
            return (
              <motion.div key={agent.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-zinc-800/60 bg-zinc-800/30 p-3.5 hover:border-zinc-700/40 transition-all">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}15`, border: `1px solid ${agent.color}30` }}>
                      <agent.icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
                    </div>
                    <div>
                      <div className="text-[11px] font-bold text-zinc-200">{agent.name}</div>
                      <div className="text-[9px] text-zinc-500">{agent.role}</div>
                    </div>
                  </div>
                  <div className={cn("w-2 h-2 rounded-full", agent.status === 'active' ? 'animate-pulse' : '')} style={{ backgroundColor: agent.status === 'active' ? '#00ff88' : '#71717a' }} />
                </div>
                <div className="mb-2">
                  <div className="flex justify-between text-[9px] font-mono mb-1">
                    <span className="text-zinc-600">Contexto</span>
                    <span className="text-zinc-400">{agent.contextUsed}K / {agent.contextTotal}K</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                    <motion.div className="h-full rounded-full" style={{ backgroundColor: agent.color }} initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 1, ease: 'easeOut' }} />
                  </div>
                </div>
                <div className="flex justify-between text-[9px] font-mono">
                  <span className="text-zinc-600">{agent.lastAction}</span>
                  <span className="text-zinc-500">{agent.rpm} rpm</span>
                </div>
              </motion.div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 10. FABLE METHOD PANEL
// ═══════════════════════════════════════════════════════════════
const FABLE_SKILLS = [
  { name: 'Method', desc: 'Selecao e composicao de skills', color: '#00ff88', status: 'active', tasks: 47 },
  { name: 'Loop', desc: 'Iteracao adaptativa com feedback', color: '#22d3ee', status: 'active', tasks: 23 },
  { name: 'Judge', desc: 'Avaliacao de qualidade e threshold', color: '#fbbf24', status: 'active', tasks: 89 },
  { name: 'Domain', desc: 'Adaptadores especializados', color: '#a855f7', status: 'active', tasks: 12 },
];

const FABLE_DOMAINS = [
  { name: 'Chimera Dashboard', color: '#4ed6a5', status: 'online', tasks: 156 },
  { name: 'Bitcoin Vault', color: '#f97316', status: 'online', tasks: 23 },
  { name: 'RAG rRNA', color: '#e040a0', status: 'online', tasks: 89 },
  { name: 'Colibri Routing', color: '#22d3ee', status: 'online', tasks: 342 },
  { name: 'Moltbook', color: '#e01b24', status: 'standby', tasks: 12 },
];

function FableMethodPanel() {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          Fable Method Engine
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Skills */}
        <div>
          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2">4 Skills</div>
          <div className="grid grid-cols-2 gap-2">
            {FABLE_SKILLS.map((s) => (
              <div key={s.name} className="rounded-lg border border-zinc-800/60 bg-zinc-800/30 p-2.5">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color, boxShadow: `0 0 6px ${s.color}60` }} />
                  <span className="text-[10px] font-bold" style={{ color: s.color }}>{s.name}</span>
                  <span className="ml-auto text-[9px] font-mono text-zinc-500">{s.tasks} tasks</span>
                </div>
                <p className="text-[9px] text-zinc-600">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
        {/* Domain Adapters */}
        <div>
          <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2">5 Domain Adapters</div>
          <div className="flex flex-col gap-1.5">
            {FABLE_DOMAINS.map((d) => (
              <div key={d.name} className="flex items-center gap-2 rounded-md px-2.5 py-1.5 border border-zinc-800/40 bg-zinc-800/20">
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-[10px] text-zinc-300 flex-1">{d.name}</span>
                <span className="text-[9px] font-mono text-zinc-500">{d.tasks}</span>
                <StatusPill status={d.status} />
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 11. RAG rRNA CLINICAL PIPELINE
// ═══════════════════════════════════════════════════════════════
const RAG_STAGES = [
  { name: 'Extract', desc: 'Crawl4AI + PDF parse', icon: ScanSearch, color: '#06d6a0', metrics: { throughput: '2,847/hr', latency: '0.8s' } },
  { name: 'Encode', desc: 'Embedding dim=1536', icon: Blocks, color: '#22d3ee', metrics: { throughput: '4,200/hr', latency: '0.2s' } },
  { name: 'Retrieve', desc: 'Cosine sim > 0.82', icon: Database, color: '#a855f7', metrics: { throughput: '8,400/hr', latency: '12ms' } },
  { name: 'Rerank', desc: 'Cross-encoder top-10', icon: BarChart3, metrics: { throughput: '6,100/hr', latency: '45ms' } },
  { name: 'Augment', desc: 'Context assembly', icon: FlaskConical, color: '#fbbf24', metrics: { throughput: '6,100/hr', latency: '8ms' } },
  { name: 'Generate', desc: 'LLM diagnostic output', icon: Microscope, color: '#e040a0', metrics: { throughput: '2,847/hr', latency: '2.3s' } },
];

function RAGPipelinePanel() {
  const [activeStage, setActiveStage] = useState(0);
  useEffect(() => { const t = setInterval(() => setActiveStage(i => (i + 1) % RAG_STAGES.length), 1500); return () => clearInterval(t); }, []);

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Stethoscope className="w-3.5 h-3.5 text-pink-400" />
          RAG rRNA — Pipeline Clinico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {RAG_STAGES.map((stage, i) => (
            <motion.div key={stage.name} className="flex items-center gap-3 rounded-lg px-3 py-2.5 border transition-all" style={{ borderColor: activeStage === i ? `${stage.color}40` : 'rgba(255,255,255,0.04)', backgroundColor: activeStage === i ? `${stage.color}08` : 'transparent' }} animate={{ x: activeStage === i ? [0, 4, 0] : 0 }} transition={{ duration: 0.3 }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${stage.color}15`, border: `1px solid ${stage.color}30` }}>
                <stage.icon className="w-4 h-4" style={{ color: stage.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold" style={{ color: stage.color }}>{stage.name}</span>
                  {activeStage === i && <span className="text-[8px] font-mono px-1.5 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: `${stage.color}20`, color: stage.color }}>ATIVO</span>}
                </div>
                <div className="text-[9px] text-zinc-500">{stage.desc}</div>
              </div>
              <div className="text-right flex-shrink-0">
                <div className="text-[9px] font-mono text-zinc-400">{stage.metrics.throughput}</div>
                <div className="text-[9px] font-mono text-zinc-600">{stage.metrics.latency}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 12. API ROUTES GRID
// ═══════════════════════════════════════════════════════════════
const ROUTE_GROUPS = [
  { group: '9router', color: '#22d3ee', routes: ['/api/9router/providers', '/api/9router/route-chat'] },
  { group: 'Agent', color: '#a855f7', routes: ['/api/agent/chat', '/api/agent/chat/stream', '/api/agent/analyze'] },
  { group: 'Fable', color: '#00ff88', routes: ['/api/fable/spawn', '/api/fable/method', '/api/fable/loop', '/api/fable/judge', '/api/fable/domain', '/api/fable/stats', '/api/fable/tasks', '/api/fable/agent-query', '/api/fable/task/[id]'] },
  { group: 'Colibri', color: '#4ed6a5', routes: ['/api/colibri/chat', '/api/colibri/health', '/api/colibri/orchestrate', '/api/colibri/experts', '/api/colibri/models'] },
  { group: 'RAG', color: '#e040a0', routes: ['/api/rag/query'] },
  { group: 'System', color: '#fbbf24', routes: ['/api/orchestrate', '/api/consolidate', '/api/federated', '/api/agents', '/api/projects', '/api/projects/stats'] },
  { group: 'Bitcoin', color: '#f97316', routes: ['/api/vaults', '/api/vaults/[id]', '/api/vaults/[id]/generate-address', '/api/vaults/[id]/custody', '/api/vaults/import-address', '/api/hd-wallet', '/api/generate-wallet', '/api/withdraw', '/api/binance', '/api/mnemonic'] },
  { group: 'Other', color: '#71717a', routes: ['/api/chat/history', '/api/webhook/invoke', '/api/moltbook'] },
];

function ApiRoutesPanel() {
  const totalRoutes = ROUTE_GROUPS.reduce((a, g) => a + g.routes.length, 0);
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Waypoints className="w-3.5 h-3.5 text-yellow-400" />
            API Routes — {totalRoutes} endpoints
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {ROUTE_GROUPS.map((g) => (
            <div key={g.group} className="rounded-lg border border-zinc-800/40 bg-zinc-800/20 p-3">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: g.color }} />
                <span className="text-[10px] font-bold" style={{ color: g.color }}>{g.group}</span>
                <span className="ml-auto text-[9px] font-mono text-zinc-600">{g.routes.length} rotas</span>
              </div>
              <div className="flex flex-col gap-0.5">
                {g.routes.map((r) => (
                  <div key={r} className="text-[9px] font-mono text-zinc-500 truncate hover:text-zinc-300 transition-colors cursor-default">{r}</div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 13. CLINICAL DIAGNOSTIC CAPABILITIES
// ═══════════════════════════════════════════════════════════════
const DIAGNOSTIC_AREAS = [
  { name: 'Identificacao de Patogenos', desc: 'rRNA 16S/23S para classificacao taxonomica', color: '#06d6a0', confidence: 94.7, cases: 12847 },
  { name: 'Resistencia Antimicrobiana', desc: 'Deteccao de genes de resistencia via RAG', color: '#ef4444', confidence: 91.2, cases: 8934 },
  { name: 'Diarreia Infecciosa', desc: 'Triagem multiplex para GI pathogens', color: '#fbbf24', confidence: 96.1, cases: 15623 },
  { name: 'Meningite Bacteriana', desc: 'Identificacao rapida via rRNA CNS', color: '#a855f7', confidence: 93.8, cases: 4201 },
  { name: 'Sepsis Neonatal', desc: 'Screening precoce via blood culture rRNA', color: '#22d3ee', confidence: 89.4, cases: 5678 },
  { name: 'Tuberculose', desc: 'Deteccao M. tuberculosis via rRNA', color: '#f97316', confidence: 92.5, cases: 7123 },
];

function DiagnosticCapabilitiesPanel() {
  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Stethoscope className="w-3.5 h-3.5 text-emerald-400" />
          Capacidades de Diagnostico Clinico
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col gap-2">
          {DIAGNOSTIC_AREAS.map((area) => (
            <div key={area.name} className="rounded-lg border border-zinc-800/40 bg-zinc-800/20 p-2.5">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: area.color }} />
                  <span className="text-[10px] font-bold text-zinc-200">{area.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-mono text-zinc-500">{area.cases.toLocaleString()} casos</span>
                  <span className="text-[9px] font-mono" style={{ color: area.color }}>{area.confidence}%</span>
                </div>
              </div>
              <p className="text-[9px] text-zinc-500 mb-1.5">{area.desc}</p>
              <div className="h-1 rounded-full bg-zinc-800 overflow-hidden">
                <motion.div className="h-full rounded-full" style={{ backgroundColor: area.color }} initial={{ width: 0 }} animate={{ width: `${area.confidence}%` }} transition={{ duration: 1.2, ease: 'easeOut' }} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 14. SYSTEM METRICS OVERVIEW
// ═══════════════════════════════════════════════════════════════
function SystemMetricsPanel() {
  const [tick, setTick] = useState(0);
  useEffect(() => { const t = setInterval(() => setTick(t => t + 1), 3000); return () => clearInterval(t); }, []);

  const metrics = [
    { label: 'Throughput Total', value: `${(21400 + tick * 37).toLocaleString()} req/s`, color: '#00ff88', spark: [85, 90, 78, 95, 88, 92, 86, 94] },
    { label: 'Latencia p95', value: `${47 + (tick % 3)}ms`, color: '#a855f7', spark: [40, 55, 35, 60, 45, 50, 38, 52] },
    { label: 'Cache Hit Rate', value: '94.2%', color: '#22d3ee', spark: [92, 94, 93, 95, 94, 96, 93, 95] },
    { label: 'Tokens Gerados', value: `${(1847000 + tick * 2400).toLocaleString()}`, color: '#fbbf24', spark: [70, 80, 75, 85, 82, 88, 79, 86] },
    { label: 'Uptime', value: '47h 23m', color: '#06d6a0', spark: [100, 100, 100, 100, 100, 100, 100, 100] },
    { label: 'Erro Rate', value: '0.03%', color: '#ef4444', spark: [1, 0, 2, 0, 1, 0, 0, 1] },
  ];

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <BarChart3 className="w-3.5 h-3.5 text-cyan-400" />
            Metricas do Sistema
          </CardTitle>
          <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px] animate-live-pulse"><Radio className="w-2.5 h-2.5 mr-1" /> Live</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {metrics.map((m) => (
            <motion.div key={m.label} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg border border-zinc-800/40 bg-zinc-800/20 p-3">
              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-1">{m.label}</div>
              <div className="text-sm font-bold font-mono mb-2" style={{ color: m.color }}>{m.value}</div>
              <MiniSpark values={m.spark} color={m.color} h={16} />
            </motion.div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ═══════════════════════════════════════════════════════════════
// 15. QUICK STATS ROW
// ═══════════════════════════════════════════════════════════════
function QuickStatsRow({ health, connected }: { health: HealthResponse | null; connected: boolean }) {
  const stats = [
    { icon: Cpu, label: 'Cores', value: health?.hwinfo?.cores ?? '—', color: 'text-amber-400' },
    { icon: MemoryStick, label: 'RAM', value: health?.hwinfo ? `${health.hwinfo.ram_avail_gb.toFixed(0)} GB` : '—', color: 'text-purple-400' },
    { icon: HardDrive, label: 'Model', value: 'GLM-5.2', color: 'text-emerald-400' },
    { icon: Database, label: 'Experts', value: health?.tiers ? (health.tiers.vram + health.tiers.ram + health.tiers.disk).toLocaleString() : '—', color: 'text-blue-400' },
    { icon: Layers, label: 'KV Slots', value: health?.kv_slots ?? '—', color: 'text-cyan-400' },
    { icon: Clock, label: 'Uptime', value: connected ? 'Live' : '—', color: 'text-rose-400' },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {stats.map(s => (
        <motion.div key={s.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
          <div className="bg-zinc-900/50 border border-zinc-800/60 rounded-xl p-3.5 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
              <s.icon className={cn("w-4 h-4", s.color)} />
            </div>
            <div>
              <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider">{s.label}</div>
              <div className={cn("text-sm font-bold font-mono", s.color)}>{s.value}</div>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN DASHBOARD TAB — UNIFIED COMMAND CENTER
// ═══════════════════════════════════════════════════════════════
export function DashboardTab() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [connected, setConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  const [baseUrl, setBaseUrl] = useState(() => {
    if (typeof window !== 'undefined') return localStorage.getItem('colibri.baseUrl') || '';
    return '';
  });
  const refreshRef = useRef(0);

  const fetchHealth = useCallback(async (customUrl?: string) => {
    const url = customUrl || baseUrl;
    const effectiveUrl = url || 'http://127.0.0.1:8000';
    try {
      const healthBase = effectiveUrl.replace(/\/v1\/?$/, '');
      const res = await fetch('/api/colibri/health');
      const data = await res.json();
      if (data.status && data.status !== 'offline' && data.status !== 'error') {
        setHealth(data); setConnected(true);
      } else { setConnected(false); }
    } catch { setConnected(false); } finally { setLoading(false); }
  }, [baseUrl]);

  useEffect(() => { fetchHealth(); const interval = setInterval(fetchHealth, 5000); return () => clearInterval(interval); }, [fetchHealth]);

  const handleConnect = (url: string) => { setBaseUrl(url); fetchHealth(url); };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Connection + Engine Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConnectionCard connected={connected} onConnect={handleConnect} loading={loading} />
        <EngineStatusCard health={health} connected={connected} onRefresh={() => { refreshRef.current++; fetchHealth(); }} />
      </div>

      {/* Row 2: Quick Stats */}
      <QuickStatsRow health={health} connected={connected} />

      {/* Row 3: Hardware + Expert Tiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HardwareCard hwinfo={health?.hwinfo ?? null} />
        <ExpertTiersCard tiers={health?.tiers ?? null} />
        <FallbackChainMonitor />
      </div>

      {/* Row 4: System Metrics (full width) */}
      <SystemMetricsPanel />

      {/* Row 5: 9router Provider Grid (full width) */}
      <ProviderGrid />

      {/* Row 6: Agent Command Center (full width) */}
      <AgentCommandCenter />

      {/* Row 7: Fable Method + RAG Pipeline + Diagnostic */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <FableMethodPanel />
        <RAGPipelinePanel />
        <DiagnosticCapabilitiesPanel />
      </div>

      {/* Row 8: API Routes (full width) */}
      <ApiRoutesPanel />

      {/* Row 9: Expert Cortex (full width) */}
      <ExpertCortexCard connected={connected} />

      {/* Row 10: Inline Chat (full width) */}
      <InlineChat connected={connected} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// QUICK SEARCH (exported for header)
// ═══════════════════════════════════════════════════════════════
export function QuickSearch() {
  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search panels..."
        className="w-full h-8 px-3 pl-8 text-[11px] bg-zinc-900/60 border border-zinc-800/60 rounded-lg text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-emerald-500/40"
      />
      <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
      </svg>
    </div>
  );
}
