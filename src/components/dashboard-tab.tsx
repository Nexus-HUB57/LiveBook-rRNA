'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import {
  Activity, Cpu, HardDrive, MemoryStick, MonitorDot, Zap,
  Gauge, Timer, Layers, Database, Server, RefreshCw, Wifi, WifiOff,
  LoaderCircle, BrainCircuit, ArrowUp, CircleStop, MessageSquareText,
  Trash2, Feather, Clock, Eye, Link2, KeyRound, Settings,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

// ─── TYPES ───
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

// ─── DASHBOARD SUB-PANELS ───

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
            Motor Colibri
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

function HardwareCard({ hwinfo }: { hwinfo: HwinfoHealth | null }) {
  if (!hwinfo) return (
    <Card className="border-zinc-800/60 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Cpu className="w-3.5 h-3.5 text-amber-400" /> Hardware
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[11px] text-zinc-600">Conecte ao motor para ver hardware.</p>
      </CardContent>
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

function ExpertTiersCard({ tiers }: { tiers: TiersHealth | null }) {
  if (!tiers) return (
    <Card className="border-zinc-800/60 bg-zinc-900/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="w-3.5 h-3.5 text-blue-400" /> Expert Tiers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-[11px] text-zinc-600">Conecte ao motor para ver tiers.</p>
      </CardContent>
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

function ExpertCortexCard({ connected }: { connected: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<{ rows: number; cols: number; map: string } | null>(null);
  const [tip, setTip] = useState<{ x: number; y: number; row: number; col: number; tier: number; heat: number } | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ w: 400, h: 250 });

  useEffect(() => {
    if (!connected) return;
    let disposed = false;
    const poll = async () => {
      try {
        const res = await fetch('/api/colibri/experts');
        if (!res.ok) return;
        const next = await res.json();
        if (disposed || !next?.rows) return;
        setData(next);
      } catch { /* engine busy */ }
    };
    void poll();
    const t = setInterval(() => void poll(), 3000);
    return () => { disposed = true; clearInterval(t); };
  }, [connected]);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth - 20, h: el.clientHeight - 20 }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !data) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const { rows, cols, map } = data;
    const cell = Math.max(2, Math.floor(Math.min(size.w / cols, size.h / rows)));
    const gap = cell >= 4 ? 1 : 0;
    canvas.width = cols * (cell + gap);
    canvas.height = rows * (cell + gap);

    const TIER_RGB: [number, number, number][] = [[58, 71, 80], [90, 155, 216], [78, 214, 165]];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c;
        const byte = parseInt(map.substr(i * 2, 2), 16) || 0;
        const tier = byte >> 6;
        const heat = byte & 63;
        const [R, G, B] = TIER_RGB[tier] ?? TIER_RGB[0];
        const lum = 0.35 + 0.65 * Math.min(heat / 24, 1);
        ctx.fillStyle = `rgb(${(R * lum) | 0},${(G * lum) | 0},${(B * lum) | 0})`;
        ctx.fillRect(c * (cell + gap), r * (cell + gap), cell, cell);
      }
    }
  }, [data, size]);

  const TIER_NAME = ['Disk', 'RAM', 'VRAM'];
  const TIER_COLOR = ['#8b9aa3', '#5a9bd8', '#4ed6a5'];

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <BrainCircuit className="w-3.5 h-3.5 text-purple-400" />
            Expert Cortex {data ? `— ${data.rows} layers × ${data.cols} experts` : ''}
          </CardTitle>
          <div className="flex gap-3 text-[10px] text-zinc-500">
            {TIER_NAME.map((name, i) => (
              <span key={name} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-sm" style={{ background: TIER_COLOR[i] }} />
                {name}
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
              onMouseMove={(e) => {
                if (!data) return;
                const rect = e.currentTarget.getBoundingClientRect();
                const sx = e.currentTarget.width / rect.width;
                const sy = e.currentTarget.height / rect.height;
                const cell = Math.max(2, Math.floor(Math.min(size.w / data.cols, size.h / data.rows)));
                const gap = cell >= 4 ? 1 : 0;
                const col = Math.floor(((e.clientX - rect.left) * sx) / (cell + gap));
                const row = Math.floor(((e.clientY - rect.top) * sy) / (cell + gap));
                if (row < 0 || row >= data.rows || col < 0 || col >= data.cols) { setTip(null); return; }
                const byte = parseInt(data.map.substr((row * data.cols + col) * 2, 2), 16) || 0;
                setTip({ x: e.clientX, y: e.clientY, row, col, tier: byte >> 6, heat: byte & 63 });
              }}
              onMouseLeave={() => setTip(null)}
            />
          ) : (
            <p className="text-[11px] text-zinc-600">Conecte ao motor Colibri para ver o cortex de experts.</p>
          )}
        </div>
        {tip && data && (
          <div className="fixed z-50 bg-zinc-900 border border-zinc-700 rounded-lg p-2.5 text-[11px] pointer-events-none shadow-xl max-w-[260px]"
            style={{ left: tip.x + 14, top: tip.y + 14 }}>
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Layers className="w-3 h-3" /> Layer {tip.row + 3} · Expert {tip.col}
            </div>
            <div>Tier: <strong style={{ color: TIER_COLOR[tip.tier] }}>{TIER_NAME[tip.tier]}</strong></div>
            <div>Heat: <strong>{tip.heat === 0 ? 'never routed' : `~2^${tip.heat} selections`}</strong></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── STREAMING CHAT (inline) ───

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
    const content = draft.trim();
    if (!content || loading) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: 'user', content };
    const assistMsg: ChatMsg = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMsg, assistMsg]);
    setDraft('');
    setLoading(true);
    setMetrics({ tokens: 0, tokPerSec: null, ttft: null });
    const t0 = performance.now();
    let firstToken = true;
    let count = 0;
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      const res = await fetch('/api/colibri/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'glm-5.2-colibri',
          messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
          temperature: 0.7,
          max_completion_tokens: 512,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Engine error: ${res.status}`);
      const reader = res.body?.getReader();
      if (!reader) throw new Error('Empty stream');
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const frames = buffer.split(/\r?\n\r?\n/);
        buffer = frames.pop() || '';
        for (const frame of frames) {
          const lines = frame.split(/\r?\n/).filter(l => l.startsWith('data:'));
          for (const line of lines) {
            const data = line.slice(5).trim();
            if (data === '[DONE]') break;
            try {
              const event = JSON.parse(data);
              const text = event.choices?.[0]?.delta?.content;
              if (text) {
                if (firstToken) { setMetrics(prev => ({ ...prev, ttft: performance.now() - t0 })); firstToken = false; }
                count++;
                setMessages(prev => prev.map(m => m.id === assistMsg.id ? { ...m, content: m.content + text } : m));
                const elapsed = (performance.now() - t0) / 1000;
                if (elapsed > 0.3) setMetrics(prev => ({ ...prev, tokens: count, tokPerSec: count / elapsed }));
              }
            } catch { /* skip */ }
          }
        }
        if (done) break;
      }
      const finalElapsed = (performance.now() - t0) / 1000;
      if (count > 0) setMetrics(prev => ({ ...prev, tokens: count, tokPerSec: count / finalElapsed }));
    } catch (err) {
      if (!(controller.signal.aborted)) {
        setMessages(prev => prev.map(m => m.id === assistMsg.id ? { ...m, content: `Erro: ${err instanceof Error ? err.message : 'Falha na geracao'}` } : m));
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }, [draft, loading, messages]);

  return (
    <Card className="border-zinc-800/60 bg-zinc-900/50 backdrop-blur col-span-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <MessageSquareText className="w-3.5 h-3.5 text-cyan-400" />
            Chat Colibri
          </CardTitle>
          <div className="flex gap-2 flex-wrap">
            {loading && metrics.tokens > 0 && (
              <Badge className="bg-emerald-500/15 text-emerald-400 border-emerald-500/30 text-[10px]">
                <Zap className="w-2.5 h-2.5 mr-1" /> {metrics.tokens} tokens
              </Badge>
            )}
            {!loading && metrics.tokPerSec !== null && (
              <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px]">
                <Gauge className="w-2.5 h-2.5 mr-1" /> {metrics.tokPerSec.toFixed(1)} tok/s
              </Badge>
            )}
            {!loading && metrics.ttft !== null && (
              <Badge className="bg-zinc-800 text-zinc-300 border-zinc-700 text-[10px]">
                <Timer className="w-2.5 h-2.5 mr-1" /> TTFT {(metrics.ttft / 1000).toFixed(1)}s
              </Badge>
            )}
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
              <Eye className="w-2.5 h-2.5 mr-1" /> Slot 1
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="max-h-[350px] overflow-y-auto mb-3 space-y-3">
          {!messages.length ? (
            <div className="text-center py-10">
              <div className="w-14 h-14 rounded-full border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center mx-auto mb-3">
                <Feather className="w-6 h-6 text-emerald-400" />
              </div>
              <h3 className="text-lg text-zinc-300 font-light mb-1">Ask the giant.</h3>
              <p className="text-[11px] text-zinc-600">Conecte ao motor Colibri e converse diretamente com GLM-5.2.</p>
              <div className="flex gap-2 mt-4 justify-center flex-wrap">
                {['Explique expert routing', 'Compare RAM e VRAM caching', 'Escreva um benchmark em C'].map((s) => (
                  <button key={s} onClick={() => setDraft(s)}
                    className="text-[10px] text-zinc-500 border border-zinc-700/50 rounded-lg px-3 py-2 hover:border-emerald-500/30 hover:text-zinc-300 transition-all">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-lg border border-emerald-500/20 bg-emerald-500/5 flex items-center justify-center flex-shrink-0">
                    <Feather className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                )}
                <div className={cn('max-w-[75%] rounded-xl px-3.5 py-2.5 text-[13px] leading-relaxed',
                  msg.role === 'user'
                    ? 'bg-zinc-800 text-zinc-300'
                    : 'bg-zinc-800/50 border border-zinc-700/30 text-zinc-200'
                )}>
                  {msg.content || <span className="inline-flex gap-1 pt-1"><i className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /><i className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:150ms]" /><i className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse [animation-delay:300ms]" /></span>}
                </div>
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-lg border border-zinc-700 bg-zinc-800 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-zinc-400">
                    Y
                  </div>
                )}
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex gap-2">
          <Textarea value={draft} onChange={e => setDraft(e.target.value)}
            placeholder="Message colibri..."
            className="min-h-[44px] max-h-[120px] resize-none bg-zinc-800/50 border-zinc-700/50 text-[13px] text-zinc-200 placeholder:text-zinc-600 rounded-xl"
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
            disabled={!connected}
          />
          {loading ? (
            <Button size="icon" variant="destructive" className="h-[44px] w-[44px] rounded-xl flex-shrink-0" onClick={() => abortRef.current?.abort()}>
              <CircleStop className="w-4 h-4" />
            </Button>
          ) : (
            <Button size="icon" className="h-[44px] w-[44px] rounded-xl flex-shrink-0 bg-emerald-600 hover:bg-emerald-500 text-white" disabled={!draft.trim() || !connected} onClick={() => void send()}>
              <ArrowUp className="w-4 h-4" />
            </Button>
          )}
          <Button size="icon" variant="ghost" className="h-[44px] w-[44px] rounded-xl flex-shrink-0" onClick={() => { setMessages([]); setMetrics({ tokens: 0, tokPerSec: null, ttft: null }); }} disabled={!messages.length}>
            <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── CONNECTION CONFIG CARD ───

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
            <Server className="w-3.5 h-3.5 text-cyan-400" /> Conexão Colibri Engine
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-[10px]",
              connected ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-red-500/15 text-red-400 border-red-500/30"
            )}>
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
          <p className="text-[10px] text-zinc-500">
            Motor GLM-5.2 744B MoE via OpenAI-compatible API.
            {connected ? ' Conectado e recebendo métricas.' : ' Clique em ⚙ para configurar o endpoint.'}
          </p>
        ) : (
          <div className="space-y-2.5">
            <label className="block">
              <span className="text-[10px] text-zinc-500 font-bold uppercase">API Endpoint</span>
              <div className="flex gap-2 mt-1">
                <div className="relative flex-1">
                  <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-zinc-600" />
                  <Input value={url} onChange={e => setUrl(e.target.value)}
                    className="h-8 pl-8 text-[11px] bg-zinc-800/50 border-zinc-700/50 font-mono text-zinc-300"
                    placeholder="http://127.0.0.1:8000/v1" />
                </div>
                <Button size="sm" className="h-8 text-[11px] bg-cyan-600 hover:bg-cyan-500 text-white"
                  onClick={() => { localStorage.setItem('colibri.baseUrl', url); onConnect(url); }}
                  disabled={loading}>
                  {loading ? <LoaderCircle className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                  Conectar
                </Button>
              </div>
            </label>
            <p className="text-[9px] text-zinc-600">
              O endpoint deve apontar para o servidor Colibri (./coli serve). Porta padrão: 8000.
              A conexão é usada para health check, chat streaming e expert cortex.
            </p>
            <div className="flex gap-2 text-[9px] text-zinc-600">
              <span className="flex items-center gap-1"><Database className="w-3 h-3" /> Modelos: /v1/models</span>
              <span className="flex items-center gap-1"><Activity className="w-3 h-3" /> Health: /health</span>
              <span className="flex items-center gap-1"><BrainCircuit className="w-3 h-3" /> Experts: /experts</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── QUICK STATS ROW ───

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

// ─── MAIN DASHBOARD TAB ───

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
      // Use the custom URL directly (bypass our proxy for custom connections)
      const healthBase = effectiveUrl.replace(/\/v1\/?$/, '');
      const res = await fetch(`/api/colibri/health`);
      const data = await res.json();
      if (data.status && data.status !== 'offline' && data.status !== 'error') {
        setHealth(data);
        setConnected(true);
      } else {
        setConnected(false);
      }
    } catch {
      setConnected(false);
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 5000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const handleConnect = (url: string) => {
    setBaseUrl(url);
    // Trigger immediate re-fetch with the new URL
    fetchHealth(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoaderCircle className="w-6 h-6 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ConnectionCard connected={connected} onConnect={handleConnect} loading={loading} />
        <EngineStatusCard health={health} connected={connected} onRefresh={() => { refreshRef.current++; fetchHealth(); }} />
      </div>
      <QuickStatsRow health={health} connected={connected} />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <HardwareCard hwinfo={health?.hwinfo ?? null} />
        <ExpertTiersCard tiers={health?.tiers ?? null} />
      </div>
      <ExpertCortexCard connected={connected} />
      <InlineChat connected={connected} />
    </div>
  );
}

// ─── QUICK SEARCH (exported for header) ───

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