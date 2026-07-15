'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Loader2, ChevronDown, ChevronRight, Trash2,
  Send, MessageSquare, Bot, Sparkles, History,
} from 'lucide-react';
import { useChat, type ChatSession } from '@/hooks/useChat';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

// ─── AGENT REGISTRY ───
const AGENTS = [
  { slug: 'zettascale', name: 'Zettascale', desc: 'Orquestrador Core' },
  { slug: 'genesisflow', name: 'GenesisFlow', desc: 'Especialista em Fluxos' },
  { slug: 'antrophexus', name: 'Antrophexus AI', desc: 'Analista' },
  { slug: 'sabio-heroi', name: 'Sabio Heroi', desc: 'Guardiao RAG + Voz' },
  { slug: 'nexus-sidian', name: 'Nexus Sidian', desc: 'Integracao Obsidian' },
];

const QUICK_QUESTIONS = [
  'O que e o ciclo OODA?',
  'Quais agentes tem suporte a Bitcoin?',
  'Como funciona o pipeline RAG?',
  'Liste os nucleos quanticos',
  'Explique a orquestracao reativa',
];

// ─── COMPONENT ───
export function ChatInterface() {
  const [input, setInput] = useState('');
  const [selectedAgent, setSelectedAgent] = useState('zettascale');
  const [expandedSources, setExpandedSources] = useState<string | null>(null);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [showSessions, setShowSessions] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { messages, sendMessage, isLoading, sessionId, clearHistory, loadSession } = useChat();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      const el = scrollRef.current;
      el.scrollTop = el.scrollHeight;
    }
  }, [messages]);

  // Load sessions list
  const refreshSessions = useCallback(async () => {
    try {
      const res = await fetch('/api/chat/history');
      const data = await res.json();
      if (data.sessions) setSessions(data.sessions);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    refreshSessions();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input, selectedAgent);
    setInput('');
    // Refresh sessions after a delay (new session will be created)
    setTimeout(refreshSessions, 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleDeleteSession = async (e: React.MouseEvent, sid: string) => {
    e.stopPropagation();
    await fetch(`/api/chat/history?sessionId=${sid}`, { method: 'DELETE' });
    if (sid === sessionId) clearHistory();
    refreshSessions();
  };

  const handleNewChat = () => {
    clearHistory();
    setShowSessions(false);
  };

  return (
    <div className="flex h-full gap-0">
      {/* ─── SIDEBAR: Session List ─── */}
      <AnimatePresence>
        {showSessions && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-r border-zinc-800 bg-zinc-900/30 flex-shrink-0"
          >
            <div className="w-[260px] h-full flex flex-col">
              <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
                <span className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <History className="w-3 h-3" /> Historico
                </span>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setShowSessions(false)}>
                  <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {sessions.length === 0 && (
                    <p className="text-[10px] text-zinc-600 text-center py-4">Nenhuma sessao</p>
                  )}
                  {sessions.map(s => (
                    <button
                      key={s.id}
                      onClick={() => { loadSession(s.id); setShowSessions(false); }}
                      className={cn(
                        'w-full text-left rounded-lg px-3 py-2 transition-colors group',
                        s.id === sessionId
                          ? 'bg-emerald-500/10 border border-emerald-500/20'
                          : 'hover:bg-zinc-800/60 border border-transparent'
                      )}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[11px] font-medium text-zinc-300 truncate">
                            {s.title}
                          </div>
                          <div className="text-[9px] text-zinc-600 mt-0.5">
                            {s.agentSlug && <span className="text-purple-400">{s.agentSlug}</span>}
                            {' '}&bull; {s._count.messages} msgs
                          </div>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSession(e, s.id)}
                          className="opacity-0 group-hover:opacity-100 text-zinc-600 hover:text-red-400 transition-all p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── MAIN CHAT AREA ─── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Control Bar */}
        <div className="flex flex-wrap items-center gap-2 p-3 border-b border-zinc-800/60">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setShowSessions(s => !s)}
            title="Historico de sessoes"
          >
            <History className="w-4 h-4 text-zinc-400" />
          </Button>

          <div className="h-5 w-px bg-zinc-800" />

          <Select value={selectedAgent} onValueChange={setSelectedAgent}>
            <SelectTrigger className="w-[180px] h-8 text-[11px]">
              <SelectValue placeholder="Agente" />
            </SelectTrigger>
            <SelectContent>
              {AGENTS.map(a => (
                <SelectItem key={a.slug} value={a.slug}>
                  <span className="flex items-center gap-2">
                    <Bot className="w-3 h-3 text-purple-400" />
                    <span>{a.name}</span>
                    <span className="text-zinc-500 text-[9px]">— {a.desc}</span>
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-7 text-[10px] gap-1" onClick={handleNewChat}>
            <Sparkles className="w-3 h-3" /> Nova
          </Button>

          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 ml-auto"
            onClick={clearHistory}
            title="Limpar e nova sessao"
          >
            <Trash2 className="w-4 h-4 text-zinc-500" />
          </Button>
        </div>

        {/* Quick Questions (only when no messages) */}
        {messages.length === 0 && (
          <div className="flex flex-wrap gap-1.5 px-3 pt-3">
            {QUICK_QUESTIONS.map(q => (
              <Button
                key={q}
                variant="outline"
                size="sm"
                className="text-[10px] h-7 border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:border-zinc-700"
                onClick={() => { setInput(q); inputRef.current?.focus(); }}
              >
                {q}
              </Button>
            ))}
          </div>
        )}

        {/* Messages Area */}
        <Card className="flex-1 overflow-hidden rounded-none border-0 bg-transparent">
          <ScrollArea className="h-full p-4" ref={scrollRef}>
            <div className="max-w-3xl mx-auto space-y-4">
              {messages.length === 0 && (
                <div className="py-16 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-purple-500/20 to-emerald-500/20 border border-purple-500/20 flex items-center justify-center">
                    <MessageSquare className="w-5 h-5 text-purple-400" />
                  </div>
                  <p className="text-sm text-zinc-400 font-medium">Chat com Agentes AI</p>
                  <p className="text-[11px] text-zinc-600 mt-1">
                    Selecione um agente e faca uma pergunta. Respostas com RAG + streaming.
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <motion.div
                  key={msg.id || idx}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={cn(
                    'flex flex-col',
                    msg.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  {/* Role label */}
                  <div className="flex items-center gap-1.5 mb-1">
                    {msg.role === 'agent' && <Bot className="w-3 h-3 text-purple-400" />}
                    <span className="text-[9px] font-medium text-zinc-500">
                      {msg.role === 'user' ? 'Voce' : 'Agente'}
                    </span>
                  </div>

                  {/* Message bubble */}
                  <div
                    className={cn(
                      'max-w-[85%] md:max-w-[75%] rounded-xl px-4 py-2.5 text-[13px] leading-relaxed break-words',
                      msg.role === 'user'
                        ? 'bg-emerald-600/20 text-emerald-100 border border-emerald-500/20 rounded-br-sm'
                        : 'bg-zinc-800/60 text-zinc-200 border border-zinc-800/80 rounded-bl-sm'
                    )}
                  >
                    {msg.role === 'agent' && !msg.content && (
                      <div className="flex items-center gap-2 text-zinc-500">
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span className="text-[11px]">Pensando...</span>
                      </div>
                    )}
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  </div>

                  {/* Sources */}
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="mt-1.5 w-full max-w-[85%] md:max-w-[75%]">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-auto p-1 text-[10px] text-zinc-500 hover:text-zinc-300"
                        onClick={() => setExpandedSources(prev => prev === String(idx) ? null : String(idx))}
                      >
                        {expandedSources === String(idx)
                          ? <ChevronDown className="mr-1 h-3 w-3" />
                          : <ChevronRight className="mr-1 h-3 w-3" />
                        }
                        {msg.sources.length} fonte(s) RAG
                      </Button>
                      <AnimatePresence>
                        {expandedSources === String(idx) && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="mt-1.5 space-y-1.5 rounded-lg border border-zinc-800 bg-zinc-900/50 p-2.5">
                              {msg.sources.map((src, i) => (
                                <div key={i} className="border-b border-zinc-800/50 pb-1.5 last:border-0 last:pb-0">
                                  <div className="text-[10px] font-medium text-zinc-300">
                                    [{i + 1}] {src.title}
                                  </div>
                                  <div className="text-[9px] text-zinc-500 line-clamp-2">
                                    {src.content}
                                  </div>
                                  {src.score !== undefined && (
                                    <div className="text-[8px] text-zinc-600 mt-0.5">
                                      Relevancia: {(src.score * 100).toFixed(0)}%
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </ScrollArea>
        </Card>

        {/* Input Area */}
        <div className="p-3 border-t border-zinc-800/60">
          <div className="max-w-3xl mx-auto flex gap-2">
            <Input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Pergunte sobre o ecossistema..."
              disabled={isLoading}
              className="flex-1 h-10 bg-zinc-900/50 border-zinc-800 text-sm"
            />
            <Button
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="h-10 px-4 bg-emerald-600 hover:bg-emerald-500 text-white gap-2"
            >
              {isLoading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
              <span className="hidden sm:inline text-xs">Enviar</span>
            </Button>
          </div>
          <div className="max-w-3xl mx-auto mt-1.5 flex items-center justify-between">
            <span className="text-[9px] text-zinc-600">
              {sessionId && <span className="text-zinc-500">Sessao: {sessionId.slice(0, 12)}...</span>}
            </span>
            <span className="text-[9px] text-zinc-700">
              RAG rRNA + Streaming
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}