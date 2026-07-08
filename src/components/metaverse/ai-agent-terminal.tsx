'use client';

import { useState, useRef, useEffect, useCallback } from 'react';

interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'system' | 'error' | 'agent';
  text: string;
  timestamp: string;
  agent?: string;
}

const AGENT_RESPONSES: Record<string, string[]> = {
  claude: [
    '>> Claude: Analisando artefatos do vault... 7 arquivos indexados no RAG.',
    '>> Claude: Protocolo de simbiose quântica detectado. Sincronizando com rRNA cores.',
    '>> Claude: Camada narrativa Fable 5 ativa. Gerando contexto temporal...',
    '>> Claude: Embeddings gerados para 2.4 ZB de dados. Vector DB atualizado.',
    '>> Claude: Retrieval augmented generation em andamento. Top-K=256, Temperature=0.7',
    '>> Claude: Integração Obsidian confirmada. Knowledge graph sincronizado.',
    '>> Claude: Sandbox Trinuclear sincronizado. Ollama (tok/s: 62), Llama 4 (tok/s: 71), OpenAI (tok/s: 85).',
    '>> Claude: Cross-core inference mesh ativo. Latência média: 23ms. Acurácia: 96.2%.',
  ],
  fable: [
    '>> Fable 5: "No limiar entre 2026 e 2077, o legado pulsa em cada linha de código..."',
    '>> Fable 5: Gerando arco narrativo temporal com 5 pontos de inflexão.',
    '>> Fable 5: Prompt library carregada. 1,247 templates de narrativa disponíveis.',
    '>> Fable 5: Story graph atualizado — 23 nós conectados, 67 relações mapeadas.',
    '>> Fable 5: Simulando branch narrativo alternativo via Monte Carlo quântico.',
    '>> Fable 5: "Os artefatos não são apenas dados — são memórias de um futuro possível."',
    '>> Fable 5: Branching dinâmico gerado — 3 arcos ativos, 12 sub-branches.',
  ],
  system: [
    '[SYS] RAG Pipeline: Index → Embed → Retrieve → Generate → Stream',
    '[SYS] Quantum coherence: 99.97% | Entanglement pairs: 128 | Dimensions: 7',
    '[SYS] Vault integrity: 7/7 sealed | Knowledge nodes: 15 | Edges: 42',
    '[SYS] Git clone: 3 repos synced | Obsidian vault: 2,847 notes indexed',
    '[SYS] Fable 5 narrative engine: v5.0.0-beta.3 | Claude API: connected',
    '[SYS] Sandbox Trinuclear: 3 cores online | Cross-core mesh: active',
    '[SYS] Wormhole sync: synchronized | Black hole entropy: 0.73 | Hawking radiation: stable',
    '[SYS] Zettascale throughput: 1.18 ZB/s | Recovery: 6/6 artefatos > 90% integrity',
  ],
};

interface AIAgentTerminalProps {
  isProcessing: boolean;
  onCommandSent: (cmd: string) => void;
}

const COMMANDS = [
  '/rag index',
  '/claude analyze vault',
  '/fable generate narrative',
  '/obsidian sync',
  '/quantum bridge status',
  '/git clone --recursive',
  '/vault integrity check',
  '/knowledge graph refresh',
  '/sandbox status',
  '/wormhole traverse',
  '/zettascale report',
  '/help',
];

export default function AIAgentTerminal({ isProcessing, onCommandSent }: AIAgentTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 0, type: 'system', text: '[META] AI Agentic Atemporal RAG LLM v2.0 iniciado', timestamp: '00:00:00' },
    { id: 1, type: 'system', text: '[META] Conectando ao ecossistema MetaTempo...', timestamp: '00:00:01' },
    { id: 2, type: 'output', text: '✓ Claude Anthropic v3.7 — conectado', timestamp: '00:00:02', agent: 'claude' },
    { id: 3, type: 'output', text: '✓ Fable 5 Narrative Engine v5.0.0-beta.3 — ativo', timestamp: '00:00:02', agent: 'fable' },
    { id: 4, type: 'output', text: '✓ Knowledge Vault — 7 artefatos selados', timestamp: '00:00:03' },
    { id: 5, type: 'output', text: '✓ Obsidian Graph — 15 nós, 42 arestas', timestamp: '00:00:03' },
    { id: 6, type: 'output', text: '✓ Sandbox Trinuclear — Ollama + Llama 4 + OpenAI', timestamp: '00:00:04' },
    { id: 7, type: 'system', text: '[META] 6 subsistemas sincronizados. Digite /help para comandos.', timestamp: '00:00:05' },
  ]);
  const [input, setInput] = useState('');
  const [elapsedTime, setElapsedTime] = useState(4);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lineIdRef = useRef(8);
  const autoProcessRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Auto-processing when isProcessing
  useEffect(() => {
    if (isProcessing) {
      let step = 0;
      autoProcessRef.current = setInterval(() => {
        step++;
        const agentType = step % 3 === 0 ? 'claude' : step % 3 === 1 ? 'fable' : 'system';
        const responses = AGENT_RESPONSES[agentType];
        const text = responses[step % responses.length];
        addLine(text, agentType === 'system' ? 'system' : 'output', agentType);

        if (step >= 12) {
          if (autoProcessRef.current) clearInterval(autoProcessRef.current);
          addLine('[META] Processamento RAG em lote concluído.', 'system');
        }
      }, 2500);
    } else {
      if (autoProcessRef.current) clearInterval(autoProcessRef.current);
    }
    return () => {
      if (autoProcessRef.current) clearInterval(autoProcessRef.current);
    };
  }, [isProcessing]);

  const addLine = useCallback((text: string, type: TerminalLine['type'], agent?: string) => {
    const h = Math.floor(elapsedTime / 3600);
    const m = Math.floor((elapsedTime % 3600) / 60);
    const s = elapsedTime % 60;
    const timestamp = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;

    setLines(prev => [...prev, {
      id: lineIdRef.current++,
      type,
      text,
      timestamp,
      agent,
    }]);
  }, [elapsedTime]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    addLine(input, 'input');
    onCommandSent(input);
    setInput('');

    // Simulate response
    setTimeout(() => {
      if (input.includes('/claude')) {
        addLine(AGENT_RESPONSES.claude[Math.floor(Math.random() * AGENT_RESPONSES.claude.length)], 'output', 'claude');
      } else if (input.includes('/fable')) {
        addLine(AGENT_RESPONSES.fable[Math.floor(Math.random() * AGENT_RESPONSES.fable.length)], 'output', 'fable');
      } else if (input.includes('/rag')) {
        addLine('[SYS] RAG indexação iniciada... Processando 7 artefatos do vault.', 'system');
      } else if (input.includes('/obsidian')) {
        addLine('[SYS] Obsidian sync em andamento. Git clone dos repositórios atualizado.', 'system');
      } else if (input.includes('/quantum')) {
        addLine('[SYS] Quantum Bridge: Coerência 99.97% | Pares EPR ativos: 128', 'system');
      } else if (input.includes('/vault')) {
        addLine('[SYS] Vault integrity: 7/7 selados | Hash SHA-512 verificado | Nenhum comprometimento.', 'system');
      } else if (input.includes('/knowledge')) {
        addLine('[SYS] Knowledge graph: 15 nós | 42 arestas | Componentes conexos: 1', 'system');
      } else if (input.includes('/git')) {
        addLine('[SYS] Git clone: 3 repositórios sincronizados | Último commit: 2s atrás', 'system');
      } else if (input.includes('/sandbox')) {
        addLine('[SYS] Sandbox: Ollama=ready(62 tok/s) | Llama4=ready(71 tok/s) | OpenAI=ready(85 tok/s) | Sync=100%', 'system');
      } else if (input.includes('/wormhole')) {
        addLine('[SYS] Wormhole: phase=traversing | sync=100% | entropy=0.73 | filaments=8 ativos', 'system');
      } else if (input.includes('/zettascale')) {
        addLine('[SYS] Zettascale: 1.18 ZB/s | Latencia: 0.047ns | Coerencia: 99.97% | 5 estagios certificados', 'system');
      } else if (input.includes('/help')) {
        addLine('[HELP] Comandos disponíveis: /rag /claude /fable /obsidian /quantum /git /vault /knowledge /sandbox /wormhole /zettascale', 'system');
      } else {
        addLine(`[META] Comando "${input}" processado. Consulte /help para comandos disponíveis.`, 'system');
      }
    }, 600);
  }, [input, addLine, onCommandSent]);

  const getLineColor = (line: TerminalLine) => {
    switch (line.type) {
      case 'input': return 'text-[#06d6a0]';
      case 'output': return line.agent === 'claude' ? 'text-[#fbbf24]' : line.agent === 'fable' ? 'text-[#e040a0]' : 'text-[#c0b8d0]';
      case 'system': return 'text-[#8888aa]';
      case 'error': return 'text-red-400';
      default: return 'text-[#8888aa]';
    }
  };

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col h-full rounded-xl overflow-hidden border border-[#a855f7]/20 bg-[#080818]/90">
      {/* Terminal header */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-white/5 bg-[#0a0a1a]">
        <div className="flex items-center gap-3">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-[#e040a0]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#fbbf24]/60" />
            <div className="w-2.5 h-2.5 rounded-full bg-[#06d6a0]/60" />
          </div>
          <span className="text-[10px] font-mono text-[#8888aa] tracking-wider">
            AGENTIC RAG TERMINAL v2.0
          </span>
        </div>
        <div className="flex items-center gap-3">
          {isProcessing && (
            <span className="text-[9px] font-mono text-[#fbbf24] animate-pulse">PROCESSING</span>
          )}
          <span className="text-[9px] font-mono text-[#8888aa]">{formatTime(elapsedTime)}</span>
        </div>
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[11px] leading-relaxed"
        style={{ maxHeight: '340px' }}
      >
        {lines.map((line) => (
          <div key={line.id} className={`flex gap-2 ${getLineColor(line)}`}>
            <span className="text-[#555577] shrink-0 select-none">{line.timestamp}</span>
            {line.type === 'input' && <span className="text-[#a855f7] shrink-0 select-none">❯</span>}
            <span className="break-all">{line.text}</span>
          </div>
        ))}
        {isProcessing && (
          <div className="flex gap-2 text-[#fbbf24]">
            <span className="text-[#555577] shrink-0 select-none">{formatTime(elapsedTime)}</span>
            <span className="animate-pulse">▌</span>
          </div>
        )}
      </div>

      {/* Command input */}
      <form onSubmit={handleSubmit} className="border-t border-white/5 p-2 flex gap-2">
        <span className="text-[#a855f7] font-mono text-sm self-center select-none">❯</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite um comando... (tab para sugerir)"
          className="flex-1 bg-transparent text-[#06d6a0] font-mono text-[11px] outline-none placeholder:text-[#555577]/50"
          autoComplete="off"
        />
      </form>

      {/* Quick commands */}
      <div className="border-t border-white/5 px-2 py-1.5 flex gap-1.5 flex-wrap">
        {COMMANDS.slice(0, 4).map((cmd) => (
          <button
            key={cmd}
            onClick={() => { setInput(cmd); inputRef.current?.focus(); }}
            className="text-[8px] font-mono text-[#8888aa] hover:text-[#a855f7] px-1.5 py-0.5 rounded border border-white/5 hover:border-[#a855f7]/30 transition-colors cursor-pointer"
          >
            {cmd}
          </button>
        ))}
      </div>
    </div>
  );
}