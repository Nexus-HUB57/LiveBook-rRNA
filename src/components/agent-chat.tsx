'use client';

import { useState } from 'react';
import { MessageCircle, X, Send, Feather } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export function AgentChat() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');

  const send = () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', content: input.trim() };
    const botMsg = { role: 'agent', content: 'Mensagem recebida pelo agente orquestrador. Conecte ao motor Colibri para respostas reais.' };
    setMessages(prev => [...prev, userMsg, botMsg]);
    setInput('');
  };

  return (
    <>
      {/* FAB */}
      <button
        onClick={() => setOpen(!open)}
        className={cn(
          "fixed bottom-5 right-5 z-50 w-12 h-12 rounded-full flex items-center justify-center shadow-xl transition-all",
          open ? "bg-zinc-800 border border-zinc-700 rotate-0" : "bg-emerald-600 hover:bg-emerald-500"
        )}
      >
        {open ? <X className="w-5 h-5 text-zinc-300" /> : <MessageCircle className="w-5 h-5 text-white" />}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-20 right-5 z-50 w-80 h-96 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 flex items-center gap-2">
            <Feather className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-zinc-200">Agente Rapido</span>
          </div>
          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {!messages.length && (
              <p className="text-[11px] text-zinc-600 text-center py-8">Conecte ao motor Colibri para conversar.</p>
            )}
            {messages.map((m, i) => (
              <div key={i} className={cn("text-[11px] p-2 rounded-lg max-w-[85%]",
                m.role === 'user' ? "bg-zinc-800 text-zinc-300 ml-auto" : "bg-zinc-800/40 border border-zinc-700/30 text-zinc-400"
              )}>
                {m.content}
              </div>
            ))}
          </div>
          <div className="p-2 border-t border-zinc-800 flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') send(); }}
              placeholder="Mensagem..." className="h-8 text-[11px] bg-zinc-800/50 border-zinc-700/50" />
            <Button size="icon" className="h-8 w-8 bg-emerald-600 hover:bg-emerald-500" onClick={send}>
              <Send className="w-3 h-3" />
            </Button>
          </div>
        </div>
      )}
    </>
  );
}