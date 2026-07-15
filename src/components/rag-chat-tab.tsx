'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Collapsible, CollapsibleTrigger, CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  Bot, BrainCircuit, Database, Filter, Send, Loader2, ChevronRight,
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
interface RagResponse {
  query: string; answer: string; retrieved: RetrievedSource[];
  contextLength: number; pipeline?: {
    documentsScanned: number; retrieved: number; reranked: number; contextChars: number;
  };
}

/* ================================================================
   RAG CHAT TAB
   ================================================================ */
export function RagChatTab() {
  const { data: agentsData } = trpc.agents.list.useQuery(undefined, { staleTime: 60_000 });
  const agents = agentsData?.agents ?? [];

  const [messages, setMessages] = useState<Array<{
    role: 'user' | 'assistant'; content: string;
    retrieved?: RetrievedSource[]; contextLength?: number;
    pipeline?: RagResponse['pipeline'];
  }>>([]);
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
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
      });
      const data: RagResponse = await res.json();
      setMessages(prev => [...prev, {
        role: 'assistant', content: data.answer || 'Sem resposta disponivel.',
        retrieved: data.retrieved || [], contextLength: data.contextLength || 0, pipeline: data.pipeline,
      }]);
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: 'Erro ao processar consulta. Tente novamente.' }]);
    }
    setLoading(false);
  }, [input, loading, selectedAgent]);

  const quickActions = ['O que e OODA?', 'Como funciona o RAG?', 'Capacidades Bitcoin', 'Arquitetura Sabio Heroi'];
  const agentOptions = [
    { value: 'all', label: 'Todos os Agentes' },
    ...agents.map(a => ({ value: a.slug, label: a.name })),
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col h-[calc(100vh-180px)] min-h-[500px]"
    >
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

      <Card className="flex-1 bg-zinc-900/80 border-zinc-800/80 flex flex-col overflow-hidden gap-0">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <motion.div
              className="flex flex-col items-center justify-center h-full text-center py-12"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <motion.div
                className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-4"
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
              >
                <BrainCircuit className="w-7 h-7 text-emerald-400" />
              </motion.div>
              <h3 className="text-sm font-semibold text-zinc-200 mb-1">RAG rRNA — Pergunte ao Ecossistema</h3>
              <p className="text-xs text-zinc-500 max-w-md">
                Pipeline: RecursiveChunk → TF-IDF → BM25 → Cross-Encoder Rerank → LLM
              </p>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="max-w-[85%] md:max-w-[70%]">
                  {msg.role === 'assistant' && (
                    <div className="flex items-center gap-1.5 mb-1.5 text-emerald-400 text-[10px] font-medium pl-1">
                      <Bot className="w-3 h-3" />RAG rRNA Agent
                      {msg.contextLength !== undefined && msg.contextLength > 0 && (
                        <span className="text-zinc-600 ml-2">{msg.contextLength} chars</span>
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

                  {msg.retrieved && msg.retrieved.length > 0 && (
                    <Collapsible className="mt-2">
                      <CollapsibleTrigger className="flex items-center gap-1.5 text-[10px] text-zinc-500 hover:text-emerald-400 transition-colors pl-1 py-1">
                        <ChevronRight className="w-3 h-3 transition-transform [[data-state=open]>&]:rotate-90" />
                        <Database className="w-3 h-3" />
                        {msg.retrieved.length} fonte{msg.retrieved.length > 1 ? 's' : ''}
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-1.5 space-y-1 pl-1">
                          {msg.retrieved.map((src, j) => (
                            <div key={j} className="flex items-center gap-2 text-[10px] p-2 rounded-lg bg-zinc-800/50 border border-zinc-800">
                              <span className="w-5 h-5 rounded-md bg-emerald-500/10 text-emerald-400 flex items-center justify-center font-mono text-[9px] font-bold flex-shrink-0">{j + 1}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-zinc-300 font-medium truncate">{src.title}</div>
                                <div className="text-zinc-600 truncate">{src.source}</div>
                              </div>
                              <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-zinc-700 text-zinc-500 flex-shrink-0">{src.agent}</Badge>
                              <Badge variant="outline" className="text-[8px] px-1.5 py-0 border-amber-500/30 text-amber-400 flex-shrink-0">{src.score}</Badge>
                            </div>
                          ))}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          <AnimatePresence>
            {loading && (
              <motion.div
                className="flex justify-start"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
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
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {messages.length === 0 && (
          <div className="px-4 py-2 border-t border-zinc-800/60 flex gap-2 flex-wrap flex-shrink-0">
            {quickActions.map(action => (
              <motion.button
                key={action}
                onClick={() => sendQuery(action)}
                className="px-3 py-1.5 rounded-lg text-[11px] text-zinc-400 border border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/30 hover:bg-emerald-500/5 transition-all"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                {action}
              </motion.button>
            ))}
          </div>
        )}

        <div className="p-3 border-t border-zinc-800/60 flex-shrink-0">
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendQuery()}
              placeholder="Pergunte sobre OODA, RAG, Bitcoin, arquitetura dos agentes..."
              className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg h-10 text-xs" />
            <motion.div whileTap={{ scale: 0.95 }}>
              <Button onClick={() => sendQuery()} disabled={loading || !input.trim()}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-4 h-10 gap-2">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span className="hidden sm:inline text-xs">Consultar</span>
              </Button>
            </motion.div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}