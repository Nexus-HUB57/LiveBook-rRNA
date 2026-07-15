'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { Bot, Cpu, MessageSquare, Send, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMsg { role: 'user' | 'agent' | 'system'; content: string; }

export function AgentChat() {
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

  return (
    <>
      {/* FAB Button */}
      <AnimatePresence>
        {!open && (
          <motion.button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all group"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <MessageSquare className="w-6 h-6" />
            <motion.span
              className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full"
              animate={{ scale: [1, 1.3, 1], opacity: [1, 0.6, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-zinc-800 text-zinc-200 text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-zinc-700">
              Chat com Agente AI
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-2rem)] h-[480px] max-h-[70vh] bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl shadow-black/50 flex flex-col overflow-hidden"
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
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
                  <motion.div
                    key={i}
                    className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                  >
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
                  </motion.div>
                ))}
                <AnimatePresence>
                  {loading && (
                    <motion.div
                      className="flex justify-start"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <div className="bg-zinc-800 rounded-xl rounded-bl-sm px-3 py-2 space-y-1.5">
                        <Skeleton className="h-2 w-36 bg-zinc-700" />
                        <Skeleton className="h-2 w-28 bg-zinc-700" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </ScrollArea>

            {/* Quick actions */}
            <div className="px-3 pb-1 flex gap-1 flex-wrap">
              {['Recomendar projetos', 'Top categorias', 'Tendencias AI'].map(a => (
                <motion.button
                  key={a}
                  onClick={() => send(a)}
                  className="px-2 py-0.5 rounded-md text-[10px] text-zinc-400 border border-zinc-800 hover:text-emerald-400 hover:border-emerald-500/30 transition-colors"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {a}
                </motion.button>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 pt-1 border-t border-zinc-800">
              <div className="flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
                  placeholder="Pergunte ao Agente AI..."
                  className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder:text-zinc-600 rounded-lg h-9 text-xs" />
                <motion.div whileTap={{ scale: 0.95 }}>
                  <Button onClick={() => send()} disabled={loading || !input.trim()}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg px-3 h-9">
                    {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}