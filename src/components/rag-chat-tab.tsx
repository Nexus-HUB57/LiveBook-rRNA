'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  MessageSquareText, ArrowUp, CircleStop, Trash2, Feather,
  Zap, Gauge, Timer, Eye, Settings2, BrainCircuit,
  Send, LoaderCircle, ChevronDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ChatMsg { id: string; role: 'user' | 'assistant'; content: string; }

export function RagChatTab() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [draft, setDraft] = useState('');
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(false);
  const [metrics, setMetrics] = useState<{ tokens: number; tokPerSec: number | null; ttft: number | null; promptTokens: number; completionTokens: number }>({
    tokens: 0, tokPerSec: null, ttft: null, promptTokens: 0, completionTokens: 0,
  });
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1024);
  const [showSettings, setShowSettings] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Check engine connection
  useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch('/api/colibri/health');
        const data = await res.json();
        setConnected(data.status && data.status !== 'offline' && data.status !== 'error');
      } catch { setConnected(false); }
    };
    check();
    const t = setInterval(check, 10000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const send = useCallback(async () => {
    const content = draft.trim();
    if (!content || loading) return;
    const userMsg: ChatMsg = { id: crypto.randomUUID(), role: 'user', content };
    const assistMsg: ChatMsg = { id: crypto.randomUUID(), role: 'assistant', content: '' };
    setMessages(prev => [...prev, userMsg, assistMsg]);
    setDraft('');
    setLoading(true);
    setMetrics(prev => ({ ...prev, tokens: 0, tokPerSec: null, ttft: null }));
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
          temperature,
          max_completion_tokens: maxTokens,
        }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error(`Engine: ${res.status}`);
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
          for (const line of frame.split(/\r?\n/).filter(l => l.startsWith('data:'))) {
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
              if (event.usage) {
                setMetrics(prev => ({
                  ...prev,
                  promptTokens: prev.promptTokens + (event.usage.prompt_tokens || 0),
                  completionTokens: prev.completionTokens + (event.usage.completion_tokens || 0),
                }));
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
        setMessages(prev => prev.map(m => m.id === assistMsg.id ? { ...m, content: `Erro: ${err instanceof Error ? err.message : 'Falha'}` } : m));
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }, [draft, loading, messages, temperature, maxTokens]);

  const totalTokens = metrics.promptTokens + metrics.completionTokens;

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-cyan-400" />
          <span className="text-sm font-bold text-zinc-200">Chat GLM-5.2</span>
          <Badge className={cn("text-[10px]", connected ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-red-500/15 text-red-400 border-red-500/30")}>
            {connected ? 'Conectado' : 'Offline'}
          </Badge>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
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
              <Timer className="w-2.5 h-2.5 mr-1" /> TTFT {(metrics.ttft / 1000).toFixed(2)}s
            </Badge>
          )}
          {totalTokens > 0 && (
            <Badge className="bg-zinc-800 text-zinc-400 border-zinc-700 text-[10px]">
              <BrainCircuit className="w-2.5 h-2.5 mr-1" /> {metrics.promptTokens}→{metrics.completionTokens}
            </Badge>
          )}
          <div className="relative">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setShowSettings(!showSettings)}>
              <Settings2 className="w-3.5 h-3.5 text-zinc-500" />
            </Button>
            {showSettings && (
              <Card className="absolute right-0 top-9 w-64 z-50 border-zinc-800 bg-zinc-900 p-3 space-y-3">
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Temperature: {temperature.toFixed(1)}</label>
                  <input type="range" min="0" max="2" step="0.1" value={temperature} onChange={e => setTemperature(Number(e.target.value))}
                    className="w-full mt-1 accent-emerald-500" />
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase">Max Tokens</label>
                  <input type="number" min={1} max={4096} value={maxTokens} onChange={e => setMaxTokens(Math.min(4096, Math.max(1, Number(e.target.value))))}
                    className="w-full h-8 mt-1 px-2 text-[11px] bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200" />
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <Card className="border-zinc-800/60 bg-zinc-900/30 min-h-[400px] max-h-[60vh] flex flex-col">
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {!messages.length ? (
            <div className="text-center py-16">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ duration: 0.5 }}
                className="w-16 h-16 rounded-full border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center mx-auto mb-4">
                <Feather className="w-7 h-7 text-cyan-400" />
              </motion.div>
              <h2 className="text-xl text-zinc-300 font-light mb-2">Chat com GLM-5.2</h2>
              <p className="text-[12px] text-zinc-600 max-w-md mx-auto mb-6">
                Conecte ao motor Colibri para ter conversas diretamente com o modelo GLM-5.2 744B MoE. Nada sai do seu hardware.
              </p>
              <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
                {['Explique MoE routing', 'Escreva codigo C otimizado', 'Analise complexidade de algoritmos'].map(s => (
                  <button key={s} onClick={() => setDraft(s)}
                    className="text-[11px] text-zinc-500 border border-zinc-700/50 rounded-xl px-3 py-3 hover:border-cyan-500/30 hover:text-zinc-300 transition-all text-left">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                className={cn('flex gap-3', msg.role === 'user' && 'justify-end')}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-xl border border-cyan-500/20 bg-cyan-500/5 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <Feather className="w-4 h-4 text-cyan-400" />
                  </div>
                )}
                <div className={cn('max-w-[80%] rounded-2xl px-4 py-3 text-[13px] leading-relaxed whitespace-pre-wrap',
                  msg.role === 'user' ? 'bg-zinc-800 text-zinc-300 rounded-br-md' : 'bg-zinc-800/40 border border-zinc-700/30 text-zinc-200 rounded-bl-md'
                )}>
                  {msg.content || (
                    <span className="inline-flex gap-1.5 pt-1">
                      <i className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                      <i className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
                      <i className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:300ms]" />
                    </span>
                  )}
                </div>
              </motion.div>
            ))
          )}
          <div ref={bottomRef} />
        </CardContent>
      </Card>

      {/* Composer */}
      <div className="flex gap-2 items-end">
        <Textarea value={draft} onChange={e => setDraft(e.target.value)}
          placeholder={connected ? "Escreva sua mensagem..." : "Conecte ao motor Colibri..."}
          className="min-h-[52px] max-h-[150px] resize-none bg-zinc-900/60 border-zinc-800/60 text-[13px] text-zinc-200 placeholder:text-zinc-600 rounded-xl"
          onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); void send(); } }}
          disabled={!connected}
        />
        {loading ? (
          <Button size="icon" variant="destructive" className="h-[52px] w-[52px] rounded-xl flex-shrink-0" onClick={() => abortRef.current?.abort()}>
            <CircleStop className="w-4 h-4" />
          </Button>
        ) : (
          <Button size="icon" className="h-[52px] w-[52px] rounded-xl flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white" disabled={!draft.trim() || !connected} onClick={() => void send()}>
            <Send className="w-4 h-4" />
          </Button>
        )}
        <Button size="icon" variant="ghost" className="h-[52px] w-[52px] rounded-xl flex-shrink-0" onClick={() => { setMessages([]); setMetrics({ tokens: 0, tokPerSec: null, ttft: null, promptTokens: 0, completionTokens: 0 }); }} disabled={!messages.length}>
          <Trash2 className="w-3.5 h-3.5 text-zinc-500" />
        </Button>
      </div>
    </div>
  );
}