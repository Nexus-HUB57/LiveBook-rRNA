'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';

interface TerminalLine {
  id: number;
  type: 'input' | 'output' | 'system' | 'error' | 'agent' | 'collab';
  text: string;
  timestamp: string;
  agent?: string;
}

const AGENT_RESPONSES: Record<string, string[]> = {
  claude: [
    '>> Claude: Analisando artefatos do vault... 7 arquivos indexados no RAG.',
    '>> Claude: Protocolo de simbiose quantica detectado. Sincronizando com rRNA cores.',
    '>> Claude: Camada narrativa Fable 5 ativa. Gerando contexto temporal...',
    '>> Claude: Embeddings gerados para 2.4 ZB de dados. Vector DB atualizado.',
    '>> Claude: Retrieval augmented generation em andamento. Top-K=256, Temperature=0.7',
    '>> Claude: Integracao Obsidian confirmada. Knowledge graph sincronizado.',
    '>> Claude: Sandbox Trinuclear sincronizado. Ollama (tok/s: 62), Llama 4 (tok/s: 71), OpenAI (tok/s: 85).',
    '>> Claude: Cross-core inference mesh ativo. Latencia media: 23ms. Acuracia: 96.2%.',
  ],
  fable: [
    '>> Fable 5: "No limiar entre 2026 e 2077, o legado pulsa em cada linha de codigo..."',
    '>> Fable 5: Gerando arco narrativo temporal com 5 pontos de inflexao.',
    '>> Fable 5: Prompt library carregada. 1,247 templates de narrativa disponiveis.',
    '>> Fable 5: Story graph atualizado -- 23 nos conectados, 67 relacoes mapeadas.',
    '>> Fable 5: Simulando branch narrativo alternativo via Monte Carlo quantico.',
    '>> Fable 5: "Os artefatos nao sao apenas dados -- sao memorias de um futuro possivel."',
    '>> Fable 5: Branching dinamico gerado -- 3 arcos ativos, 12 sub-branches.',
  ],
  system: [
    '[SYS] RAG Pipeline: Index -> Embed -> Retrieve -> Generate -> Stream',
    '[SYS] Quantum coherence: 99.97% | Entanglement pairs: 128 | Dimensions: 7',
    '[SYS] Vault integrity: 7/7 sealed | Knowledge nodes: 15 | Edges: 42',
    '[SYS] Git clone: 3 repos synced | Obsidian vault: 2,847 notes indexed',
    '[SYS] Fable 5 narrative engine: v5.0.0-beta.3 | Claude API: connected',
    '[SYS] Sandbox Trinuclear: 3 cores online | Cross-core mesh: active',
    '[SYS] Wormhole sync: synchronized | Black hole entropy: 0.73 | Hawking radiation: stable',
    '[SYS] Zettascale throughput: 1.18 ZB/s | Recovery: 6/6 artefatos > 90% integrity',
  ],
  collab: [
    '>> [COLLAB] Claude + Fable: Cross-referencing vault artifacts with narrative arcs... 3 correlations found.',
    '>> [COLLAB] Claude -> Fable: Generating contextual narrative from RAG retrieval results.',
    '>> [COLLAB] System -> Claude -> Fable: Pipeline synchronization complete. All agents aligned.',
    '>> [COLLAB] Claude + System: Re-indexing vault with updated embeddings. Delta: +2,847 vectors.',
    '>> [COLLAB] Fable + Claude: Narrative coherence check passed. Temporal consistency: 97.3%.',
    '>> [COLLAB] System + Claude + Fable: Multi-agent consensus reached. Branch merge approved.',
    '>> [COLLAB] Claude -> System: Quantum entanglement calibration optimized. Throughput: +12%.',
    '>> [COLLAB] Fable -> Claude -> System: Story arc validation complete. 5/5 narrative constraints satisfied.',
    '>> [COLLAB] Claude + Fable + System: Vault decryption layer verified. All artifacts accessible.',
    '>> [COLLAB] System -> Claude: Embedding cache warm. Retrieval latency reduced to 4ms.',
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
  '/claude deep-analyze',
  '/fable branch-tree',
  '/rag reindex --force',
  '/quantum entangle --pairs=256',
  '/sandbox benchmark',
  '/memory inspect',
  '/embed stats',
  '/vault decrypt --artifact=all',
];

export default function AIAgentTerminal({ isProcessing, onCommandSent }: AIAgentTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { id: 0, type: 'system', text: '[META] AI Agentic Atemporal RAG LLM v2.0 iniciado', timestamp: '00:00:00' },
    { id: 1, type: 'system', text: '[META] Conectando ao ecossistema MetaTempo...', timestamp: '00:00:01' },
    { id: 2, type: 'output', text: 'Claude Anthropic v3.7 -- conectado', timestamp: '00:00:02', agent: 'claude' },
    { id: 3, type: 'output', text: 'Fable 5 Narrative Engine v5.0.0-beta.3 -- ativo', timestamp: '00:00:02', agent: 'fable' },
    { id: 4, type: 'output', text: 'Knowledge Vault -- 7 artefatos selados', timestamp: '00:00:03' },
    { id: 5, type: 'output', text: 'Obsidian Graph -- 15 nos, 42 arestas', timestamp: '00:00:03' },
    { id: 6, type: 'output', text: 'Sandbox Trinuclear -- Ollama + Llama 4 + OpenAI', timestamp: '00:00:04' },
    { id: 7, type: 'system', text: '[META] 6 subsistemas sincronizados. Digite /help para comandos.', timestamp: '00:00:05' },
  ]);
  const [input, setInput] = useState('');
  const [elapsedTime, setElapsedTime] = useState(4);
  const [agentActivity, setAgentActivity] = useState({ claude: 30, fable: 30, system: 50 });
  const [streamingText, setStreamingText] = useState('');
  const [streamingColor, setStreamingColor] = useState('#c0b8d0');
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const lineIdRef = useRef(8);
  const autoProcessRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamingRef = useRef<{ interval: ReturnType<typeof setInterval> | null; fullText: string }>({ interval: null, fullText: '' });
  const commandHistoryRef = useRef<string[]>([]);
  const historyIndexRef = useRef(-1);
  const pendingInputRef = useRef('');
  const completionRef = useRef<{ matches: string[]; index: number }>({ matches: [], index: 0 });

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [lines, streamingText]);

  // Timer
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Agent activity decay
  useEffect(() => {
    const interval = setInterval(() => {
      setAgentActivity(prev => ({
        claude: Math.max(10, prev.claude - 2),
        fable: Math.max(10, prev.fable - 2),
        system: Math.max(10, prev.system - 1),
      }));
    }, 600);
    return () => clearInterval(interval);
  }, []);

  // Auto-processing when isProcessing
  useEffect(() => {
    if (isProcessing) {
      let step = 0;
      autoProcessRef.current = setInterval(() => {
        step++;
        let agentType: string;
        let lineType: TerminalLine['type'];
        let agentName: string | undefined;

        if (step % 5 === 0) {
          agentType = 'collab';
          lineType = 'collab';
          agentName = 'collab';
          setAgentActivity(prev => ({ claude: 100, fable: 100, system: 100 }));
        } else {
          const mod = step % 3;
          agentType = mod === 0 ? 'claude' : mod === 1 ? 'fable' : 'system';
          lineType = agentType === 'system' ? 'system' : 'output';
          agentName = agentType;
          setAgentActivity(prev => ({ ...prev, [agentType]: 100 }));
        }

        const responses = AGENT_RESPONSES[agentType];
        const text = responses[step % responses.length];
        addLine(text, lineType, agentName);

        if (step >= 15) {
          if (autoProcessRef.current) clearInterval(autoProcessRef.current);
          addLine('[META] Processamento RAG em lote concluido.', 'system');
        }
      }, 2200);
    } else {
      if (autoProcessRef.current) clearInterval(autoProcessRef.current);
    }
    return () => {
      if (autoProcessRef.current) clearInterval(autoProcessRef.current);
    };
  }, [isProcessing]);

  // Cleanup streaming on unmount
  useEffect(() => {
    return () => {
      if (streamingRef.current.interval) clearInterval(streamingRef.current.interval);
    };
  }, []);

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

  const getResponseForCommand = useCallback((cmd: string): { text: string; type: TerminalLine['type']; agent?: string } => {
    if (cmd.includes('/claude deep-analyze')) {
      return { text: AGENT_RESPONSES.claude[1], type: 'output', agent: 'claude' };
    } else if (cmd.includes('/claude')) {
      return { text: AGENT_RESPONSES.claude[Math.floor(Math.random() * AGENT_RESPONSES.claude.length)], type: 'output', agent: 'claude' };
    } else if (cmd.includes('/fable branch-tree')) {
      return { text: '>> Fable 5: Branch tree -- Arco Principal (18 branches) | Claude Consciente (7) | Simbiose Quantica (0) | Sandbox (0) | 3 sub-branches ativos em depth 2-4', type: 'output', agent: 'fable' };
    } else if (cmd.includes('/fable')) {
      return { text: AGENT_RESPONSES.fable[Math.floor(Math.random() * AGENT_RESPONSES.fable.length)], type: 'output', agent: 'fable' };
    } else if (cmd.includes('/rag reindex --force')) {
      return { text: '[SYS] RAG reindexacao forçada iniciada... Limpando cache de 2,847 embeddings. Re-gerando vetores para 7 artefatos. Progresso: 0%', type: 'system' };
    } else if (cmd.includes('/rag')) {
      return { text: '[SYS] RAG indexacao iniciada... Processando 7 artefatos do vault.', type: 'system' };
    } else if (cmd.includes('/obsidian')) {
      return { text: '[SYS] Obsidian sync em andamento. Git clone dos repositorios atualizado.', type: 'system' };
    } else if (cmd.includes('/quantum entangle')) {
      return { text: '[SYS] Quantum entanglement: escalando de 128 para 256 pares EPR. Coerencia mantida em 99.94%. Entropia cruzada: 0.012.', type: 'system' };
    } else if (cmd.includes('/quantum')) {
      return { text: '[SYS] Quantum Bridge: Coerencia 99.97% | Pares EPR ativos: 128', type: 'system' };
    } else if (cmd.includes('/sandbox benchmark')) {
      return { text: '[SYS] Benchmark cross-core iniciado... Ollama: 62 tok/s (baseline) | Llama 4: 71 tok/s (+14.5%) | OpenAI: 85 tok/s (+37.1%) | Latencia media: 23ms | P99: 47ms', type: 'system' };
    } else if (cmd.includes('/sandbox')) {
      return { text: '[SYS] Sandbox: Ollama=ready(62 tok/s) | Llama4=ready(71 tok/s) | OpenAI=ready(85 tok/s) | Sync=100%', type: 'system' };
    } else if (cmd.includes('/memory inspect')) {
      return { text: '[SYS] Memory Buffer: 256 slots | Utilizados: 189 (73.8%) | FIFO head: 0x7F3A | Fragmentacao: 2.1% | Pico de uso: 94% em T-00:03:12', type: 'system' };
    } else if (cmd.includes('/embed stats')) {
      return { text: '[SYS] Embeddings: 2,847 vetores | Dimensao: 1536 | Modelo: text-embedding-3-small | Cache hit rate: 94.2% | Ultimo update: 4s atras', type: 'system' };
    } else if (cmd.includes('/vault decrypt')) {
      return { text: AGENT_RESPONSES.collab[Math.floor(Math.random() * AGENT_RESPONSES.collab.length)], type: 'collab', agent: 'collab' };
    } else if (cmd.includes('/vault')) {
      return { text: '[SYS] Vault integrity: 7/7 selados | Hash SHA-512 verificado | Nenhum comprometimento.', type: 'system' };
    } else if (cmd.includes('/knowledge')) {
      return { text: '[SYS] Knowledge graph: 15 nos | 42 arestas | Componentes conexos: 1', type: 'system' };
    } else if (cmd.includes('/git')) {
      return { text: '[SYS] Git clone: 3 repositorios sincronizados | Ultimo commit: 2s atras', type: 'system' };
    } else if (cmd.includes('/wormhole')) {
      return { text: '[SYS] Wormhole: phase=traversing | sync=100% | entropy=0.73 | filaments=8 ativos', type: 'system' };
    } else if (cmd.includes('/zettascale')) {
      return { text: '[SYS] Zettascale: 1.18 ZB/s | Latencia: 0.047ns | Coerencia: 99.97% | 5 estagios certificados', type: 'system' };
    } else if (cmd.includes('/help')) {
      return { text: '[HELP] Comandos: /rag /claude /fable /obsidian /quantum /git /vault /knowledge /sandbox /wormhole /zettascale /memory /embed /help', type: 'system' };
    } else {
      return { text: `[META] Comando "${cmd}" processado. Consulte /help para comandos disponíveis.`, type: 'system' };
    }
  }, []);

  const startStream = useCallback((fullText: string, type: TerminalLine['type'], agent?: string) => {
    // Clear any existing stream
    if (streamingRef.current.interval) {
      clearInterval(streamingRef.current.interval);
    }

    const color = getLineColorValue(type, agent);
    setStreamingColor(color);
    setStreamingText('');
    streamingRef.current.fullText = fullText;

    let idx = 0;
    const interval = setInterval(() => {
      idx += 1 + Math.floor(Math.random() * 2);
      if (idx >= fullText.length) {
        idx = fullText.length;
        clearInterval(interval);
        streamingRef.current.interval = null;
        // Add the final line
        const h = Math.floor(elapsedTime / 3600);
        const m = Math.floor((elapsedTime % 3600) / 60);
        const s = elapsedTime % 60;
        const timestamp = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
        setLines(prev => [...prev, {
          id: lineIdRef.current++,
          type,
          text: fullText,
          timestamp,
          agent,
        }]);
        setStreamingText('');
        return;
      }
      setStreamingText(fullText.slice(0, idx));
    }, 18);

    streamingRef.current.interval = interval;
  }, [elapsedTime, addLine]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add to command history
    commandHistoryRef.current.push(input);
    historyIndexRef.current = -1;
    pendingInputRef.current = '';

    addLine(input, 'input');
    onCommandSent(input);

    const cmd = input;
    setInput('');
    completionRef.current = { matches: [], index: 0 };

    // Determine response and start streaming
    const response = getResponseForCommand(cmd);

    // Boost agent activity
    if (response.agent === 'claude') {
      setAgentActivity(prev => ({ ...prev, claude: 100 }));
    } else if (response.agent === 'fable') {
      setAgentActivity(prev => ({ ...prev, fable: 100 }));
    } else if (response.agent === 'system') {
      setAgentActivity(prev => ({ ...prev, system: 100 }));
    } else if (response.agent === 'collab') {
      setAgentActivity(prev => ({ claude: 100, fable: 100, system: 100 }));
    }

    // Start streaming response after short delay
    setTimeout(() => {
      startStream(response.text, response.type, response.agent);
    }, 300);
  }, [input, addLine, onCommandSent, getResponseForCommand, startStream]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const current = input;
      if (!current.startsWith('/')) return;

      const matches = COMMANDS.filter(cmd => cmd.startsWith(current));
      if (matches.length === 0) return;

      if (matches.length === 1) {
        setInput(matches[0]);
        completionRef.current = { matches, index: 0 };
      } else {
        const prev = completionRef.current;
        if (
          prev.matches.length === matches.length &&
          prev.matches.every((m, i) => m === matches[i]) &&
          prev.index < matches.length - 1
        ) {
          const nextIdx = prev.index + 1;
          completionRef.current = { matches, index: nextIdx };
          setInput(matches[nextIdx]);
        } else {
          completionRef.current = { matches, index: 0 };
          setInput(matches[0]);
        }
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      const history = commandHistoryRef.current;
      if (history.length === 0) return;

      if (historyIndexRef.current === -1) {
        pendingInputRef.current = input;
        historyIndexRef.current = history.length - 1;
      } else if (historyIndexRef.current > 0) {
        historyIndexRef.current--;
      }
      setInput(history[historyIndexRef.current]);
      completionRef.current = { matches: [], index: 0 };
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndexRef.current === -1) return;

      const history = commandHistoryRef.current;
      if (historyIndexRef.current < history.length - 1) {
        historyIndexRef.current++;
        setInput(history[historyIndexRef.current]);
      } else {
        historyIndexRef.current = -1;
        setInput(pendingInputRef.current);
      }
      completionRef.current = { matches: [], index: 0 };
    }
  }, [input]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    completionRef.current = { matches: [], index: 0 };
    historyIndexRef.current = -1;
  }, []);

  const getLineColorValue = (type: TerminalLine['type'], agent?: string): string => {
    switch (type) {
      case 'input': return '#06d6a0';
      case 'collab': return '#06b6d4';
      case 'output':
        if (agent === 'claude') return '#fbbf24';
        if (agent === 'fable') return '#e040a0';
        return '#c0b8d0';
      case 'system': return '#8888aa';
      case 'error': return '#f87171';
      default: return '#8888aa';
    }
  };

  const getLineColor = (line: TerminalLine) => {
    const color = getLineColorValue(line.type, line.agent);
    return `text-[${color}]`;
  };

  const getLineColorClass = (line: TerminalLine): string => {
    switch (line.type) {
      case 'input': return 'text-[#06d6a0]';
      case 'collab': return 'text-[#06b6d4]';
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

  const quickCommands = COMMANDS.slice(0, 8);

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

      {/* Agent Status Indicators */}
      <div className="flex items-center gap-4 px-3 py-1.5 border-b border-white/5 bg-[#0c0c1e]/80">
        {[
          { name: 'Claude', color: '#fbbf24', activity: agentActivity.claude },
          { name: 'Fable', color: '#e040a0', activity: agentActivity.fable },
          { name: 'System', color: '#06b6d4', activity: agentActivity.system },
        ].map((agent) => (
          <div key={agent.name} className="flex items-center gap-1.5 flex-1">
            <div
              className="w-1.5 h-1.5 rounded-full shrink-0"
              style={{
                backgroundColor: agent.activity > 50 ? agent.color : '#555577',
                boxShadow: agent.activity > 50 ? `0 0 4px ${agent.color}` : 'none',
              }}
            />
            <span className="text-[8px] font-mono shrink-0" style={{ color: agent.color, opacity: 0.8 }}>
              {agent.name}
            </span>
            <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: agent.color }}
                animate={{ width: `${agent.activity}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Terminal body */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-3 space-y-1 font-mono text-[11px] leading-relaxed"
        style={{ maxHeight: '300px' }}
      >
        {lines.map((line) => (
          <div key={line.id} className={`flex gap-2 ${getLineColorClass(line)}`}>
            <span className="text-[#555577] shrink-0 select-none">{line.timestamp}</span>
            {line.type === 'input' && <span className="text-[#a855f7] shrink-0 select-none">{'>'}</span>}
            {line.type === 'collab' && <span className="text-[#06b6d4] shrink-0 select-none">{'++'}</span>}
            <span className="break-all">{line.text}</span>
          </div>
        ))}
        {/* Streaming line */}
        {streamingText && (
          <div className="flex gap-2" style={{ color: streamingColor }}>
            <span className="text-[#555577] shrink-0 select-none">{formatTime(elapsedTime)}</span>
            <span className="break-all">
              {streamingText}
              <span className="inline-block w-1.5 h-3 ml-0.5 animate-pulse" style={{ backgroundColor: streamingColor, verticalAlign: 'middle' }} />
            </span>
          </div>
        )}
        {isProcessing && !streamingText && (
          <div className="flex gap-2 text-[#fbbf24]">
            <span className="text-[#555577] shrink-0 select-none">{formatTime(elapsedTime)}</span>
            <span className="animate-pulse">|</span>
          </div>
        )}
      </div>

      {/* Command input */}
      <form onSubmit={handleSubmit} className="border-t border-white/5 p-2 flex gap-2">
        <span className="text-[#a855f7] font-mono text-sm self-center select-none">{'>'}</span>
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder="Digite um comando... (tab para sugerir)"
          className="flex-1 bg-transparent text-[#06d6a0] font-mono text-[11px] outline-none placeholder:text-[#555577]/50"
          autoComplete="off"
        />
      </form>

      {/* Quick commands */}
      <div className="border-t border-white/5 px-2 py-1.5 flex gap-1.5 flex-wrap">
        {quickCommands.map((cmd) => (
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