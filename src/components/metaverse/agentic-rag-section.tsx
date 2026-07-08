'use client';

import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Brain, Cpu, GitBranch, Database, Eye, Terminal, BookOpen, Activity } from 'lucide-react';
import KnowledgeVaultCanvas from './knowledge-vault-canvas';
import ObsidianKnowledgeGraph from './obsidian-knowledge-graph';
import AIAgentTerminal from './ai-agent-terminal';
import FableNarrativeEngine from './fable-narrative-engine';

type RAGPhase = 'idle' | 'indexing' | 'retrieving' | 'generating' | 'streaming';
type OrgasmState = 'dormant' | 'awakening' | 'active' | 'transcendent';

interface VaultFileData {
  name: string;
  type: string;
  size: string;
  color: string;
  status: string;
}

const PHASE_LABELS: Record<RAGPhase, string> = {
  idle: 'DORMENTE',
  indexing: 'INDEXANDO',
  retrieving: 'RECUPERANDO',
  generating: 'GERANDO',
  streaming: 'STREAMING',
};

const PHASE_COLORS: Record<RAGPhase, string> = {
  idle: '#8888aa',
  indexing: '#fbbf24',
  retrieving: '#a855f7',
  generating: '#e040a0',
  streaming: '#06d6a0',
};

const PHASE_FLOW: RAGPhase[] = ['idle', 'indexing', 'retrieving', 'generating', 'streaming'];

export default function AgenticRAGSection() {
  const [ragPhase, setRagPhase] = useState<RAGPhase>('idle');
  const [orgasmState, setOrgasmState] = useState<OrgasmState>('dormant');
  const [selectedGraphNode, setSelectedGraphNode] = useState<string | null>(null);
  const [activeFile, setActiveFile] = useState<VaultFileData | null>(null);
  const [cycleCount, setCycleCount] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const startRAGCycle = useCallback(() => {
    if (isProcessing) return;
    setIsProcessing(true);
    setOrgasmState('awakening');
    setRagPhase('indexing');

    const timings: { phase: RAGPhase; delay: number; state?: OrgasmState }[] = [
      { phase: 'retrieving', delay: 3000, state: 'active' },
      { phase: 'generating', delay: 6000 },
      { phase: 'streaming', delay: 10000 },
    ];

    const timeouts: ReturnType<typeof setTimeout>[] = [];

    timings.forEach(({ phase, delay, state }) => {
      timeouts.push(setTimeout(() => {
        setRagPhase(phase);
        if (state) setOrgasmState(state);
      }, delay));
    });

    timeouts.push(setTimeout(() => {
      setRagPhase('idle');
      setOrgasmState('transcendent');
      setIsProcessing(false);
      setCycleCount(prev => prev + 1);

      // Reset to dormant after showing transcendent
      setTimeout(() => setOrgasmState('dormant'), 3000);
    }, 14000));

    return () => timeouts.forEach(clearTimeout);
  }, [isProcessing]);

  const handleFileActivate = useCallback((file: VaultFileData) => {
    setActiveFile(file);
    setTimeout(() => setActiveFile(null), 4000);
  }, []);

  const handleNodeClick = useCallback((nodeId: string) => {
    setSelectedGraphNode(nodeId === selectedGraphNode ? null : nodeId);
  }, [selectedGraphNode]);

  const handleCommandSent = useCallback((cmd: string) => {
    if (cmd.includes('/rag') && ragPhase === 'idle' && !isProcessing) {
      startRAGCycle();
    }
  }, [ragPhase, isProcessing, startRAGCycle]);

  const currentPhaseIndex = PHASE_FLOW.indexOf(ragPhase);

  const organismStats = [
    { label: 'Claude', value: 'v3.7', sub: 'Anthropic', icon: <Brain className="w-3.5 h-3.5" />, color: '#fbbf24' },
    { label: 'Fable 5', value: 'β.3', sub: 'Narrative', icon: <BookOpen className="w-3.5 h-3.5" />, color: '#e040a0' },
    { label: 'Obsidian', value: '2,847', sub: 'notes', icon: <Eye className="w-3.5 h-3.5" />, color: '#8b5cf6' },
    { label: 'Git Clone', value: '3', sub: 'repos', icon: <GitBranch className="w-3.5 h-3.5" />, color: '#06d6a0' },
  ];

  return (
    <section className="relative py-20 sm:py-32 px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/3 left-1/4 w-[600px] h-[400px] opacity-[0.04]"
          style={{ background: 'radial-gradient(ellipse, #e040a0 0%, transparent 60%)', filter: 'blur(80px)' }}
        />
        <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[350px] opacity-[0.03]"
          style={{ background: 'radial-gradient(ellipse, #fbbf24 0%, transparent 60%)', filter: 'blur(80px)' }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative z-10">
        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <motion.span
            className="inline-flex items-center gap-2 text-xs font-mono tracking-[0.3em] uppercase text-[#e040a0] mb-4 border border-[#e040a0]/20 px-4 py-2 rounded-full"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <Cpu className="w-3 h-3" />
            AI Agentic Atemporal
          </motion.span>
          <motion.h2
            className="text-3xl sm:text-4xl md:text-5xl font-bold"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            <span className="text-white">Organismo </span>
            <span className="bg-gradient-to-r from-[#e040a0] via-[#fbbf24] to-[#a855f7] bg-clip-text text-transparent">
              RAG LLM
            </span>
            <span className="text-white"> Atemporal</span>
          </motion.h2>
          <motion.p
            className="mt-4 text-[#8888aa] max-w-2xl mx-auto text-sm sm:text-base leading-relaxed px-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Claude Anthropic + Fable 5 Narrative Engine + Obsidian Knowledge Graph + Git Clone.
            Um organismo AI agentic que indexa, recupera e gera narrativas a partir de artefatos
            temporais em escala Zettascale.
          </motion.p>
        </div>

        {/* Organism stats */}
        <motion.div
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.35 }}
        >
          {organismStats.map((stat) => (
            <div
              key={stat.label}
              className="glass rounded-xl p-3 flex items-center gap-3 border border-white/5 group hover:border-white/10 transition-colors"
            >
              <div style={{ color: stat.color }}>{stat.icon}</div>
              <div>
                <div className="text-[10px] text-[#8888aa] uppercase tracking-wider">{stat.label}</div>
                <div className="text-sm font-bold font-mono text-white">{stat.value}</div>
                <div className="text-[8px] text-[#8888aa]/60">{stat.sub}</div>
              </div>
            </div>
          ))}
        </motion.div>

        {/* RAG Phase Flow */}
        <motion.div
          className="flex items-center justify-center gap-1 sm:gap-2 mb-8"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          {PHASE_FLOW.map((phase, i) => (
            <div key={phase} className="flex items-center gap-1 sm:gap-2">
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[9px] sm:text-[10px] font-mono uppercase tracking-wider transition-all ${
                i === currentPhaseIndex
                  ? 'bg-white/10 border border-white/20'
                  : i < currentPhaseIndex
                  ? 'bg-white/[0.03] border border-white/5'
                  : 'bg-transparent border border-white/[0.03]'
              }`}
                style={i === currentPhaseIndex ? { color: PHASE_COLORS[phase], borderColor: PHASE_COLORS[phase] + '44' } : {}}
              >
                {i <= currentPhaseIndex && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PHASE_COLORS[phase] }} />
                )}
                <span className={i > currentPhaseIndex ? 'text-[#555577]' : ''}>{PHASE_LABELS[phase]}</span>
              </div>
              {i < PHASE_FLOW.length - 1 && (
                <div className="text-[#555577] text-[8px]">→</div>
              )}
            </div>
          ))}
        </motion.div>

        {/* Active file notification */}
        {activeFile && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-4 max-w-md mx-auto glass rounded-lg p-2.5 border border-white/10 flex items-center gap-2"
          >
            <Database className="w-3.5 h-3.5 shrink-0" style={{ color: activeFile.color }} />
            <div className="flex-1 min-w-0">
              <div className="text-[10px] font-mono text-white truncate">{activeFile.name}</div>
              <div className="text-[8px] text-[#8888aa]">{activeFile.size} · {activeFile.status}</div>
            </div>
            <div className="text-[8px] font-mono text-[#06d6a0]">INDEXED</div>
          </motion.div>
        )}

        {/* Main Grid: Vault + Graph (top) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-4 sm:mb-6">
          {/* Knowledge Vault Canvas */}
          <motion.div
            className="relative rounded-2xl overflow-hidden glass gradient-border"
            style={{ minHeight: '380px' }}
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                isProcessing ? 'bg-[#fbbf24] animate-pulse' : ragPhase === 'idle' ? 'bg-[#8888aa]' : 'bg-[#06d6a0]'
              }`} />
              <span className="text-[10px] font-mono text-[#8888aa] tracking-wider uppercase">Knowledge Vault</span>
            </div>
            <div className="absolute top-3 right-3 z-10">
              <span className="text-[9px] font-mono text-[#fbbf24] border border-[#fbbf24]/20 px-2 py-0.5 rounded-full">
                7 ARTEFATOS SEALED
              </span>
            </div>
            <KnowledgeVaultCanvas
              isActive={ragPhase !== 'idle'}
              ragPhase={ragPhase}
              onFileActivate={handleFileActivate}
            />
          </motion.div>

          {/* Obsidian Knowledge Graph */}
          <motion.div
            className="relative rounded-2xl overflow-hidden glass gradient-border"
            style={{ minHeight: '380px' }}
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full transition-colors duration-500 ${
                selectedGraphNode ? 'bg-[#a855f7]' : 'bg-[#8888aa]'
              }`} />
              <span className="text-[10px] font-mono text-[#8888aa] tracking-wider uppercase">Obsidian Knowledge Graph</span>
            </div>
            <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
              <span className="text-[9px] font-mono text-[#a855f7] border border-[#a855f7]/20 px-2 py-0.5 rounded-full">
                15 NÓS · 42 ARESTAS
              </span>
            </div>
            <ObsidianKnowledgeGraph
              isActive={ragPhase !== 'idle'}
              activeNode={selectedGraphNode || undefined}
              onNodeClick={handleNodeClick}
            />
          </motion.div>
        </div>

        {/* Bottom Grid: Terminal + Fable (bottom) */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 sm:gap-6">
          {/* AI Agent Terminal */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2 }}
          >
            <AIAgentTerminal
              isProcessing={isProcessing}
              onCommandSent={handleCommandSent}
            />
          </motion.div>

          {/* Fable 5 Narrative Engine */}
          <motion.div
            className="lg:col-span-2"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="glass rounded-xl p-4 border border-[#e040a0]/15 h-full" style={{ minHeight: '460px' }}>
              <FableNarrativeEngine
                isActive={ragPhase !== 'idle'}
                ragPhase={ragPhase}
              />
            </div>
          </motion.div>
        </div>

        {/* Control Bar */}
        <motion.div
          className="mt-6 sm:mt-8 flex flex-col sm:flex-row items-center justify-between gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.5 }}
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-[#e040a0]" />
              <span className="text-sm font-semibold text-white">Estado do Organismo</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider px-3 py-1 rounded-full border"
              style={{
                color: orgasmState === 'dormant' ? '#8888aa' :
                       orgasmState === 'awakening' ? '#fbbf24' :
                       orgasmState === 'active' ? '#e040a0' : '#06d6a0',
                borderColor: (orgasmState === 'dormant' ? '#8888aa' :
                       orgasmState === 'awakening' ? '#fbbf24' :
                       orgasmState === 'active' ? '#e040a0' : '#06d6a0') + '33',
                backgroundColor: (orgasmState === 'dormant' ? '#8888aa' :
                       orgasmState === 'awakening' ? '#fbbf24' :
                       orgasmState === 'active' ? '#e040a0' : '#06d6a0') + '11',
              }}
            >
              {orgasmState === 'dormant' ? 'DORMENTE' :
               orgasmState === 'awakening' ? 'DESPERTANDO' :
               orgasmState === 'active' ? 'ATIVO' : 'TRANSCENDENTE'}
            </span>
            {cycleCount > 0 && (
              <span className="text-[9px] text-[#8888aa] font-mono">{cycleCount} ciclo(s) completo(s)</span>
            )}
          </div>

          {!isProcessing && (
            <motion.button
              onClick={startRAGCycle}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold flex items-center gap-2 cursor-pointer bg-gradient-to-r from-[#e040a0] to-[#a855f7] text-white hover:shadow-[0_0_25px_rgba(224,64,160,0.4)] transition-shadow"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <Brain className="w-4 h-4" />
              Ativar Ciclo RAG Completo
            </motion.button>
          )}
          {isProcessing && (
            <div className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#e040a0]/10 border border-[#e040a0]/20">
              <div className="w-2 h-2 rounded-full bg-[#e040a0] animate-pulse" />
              <span className="text-sm font-mono text-[#e040a0]">Processamento em andamento...</span>
            </div>
          )}
        </motion.div>

        {/* Footer Metrics */}
        <motion.div
          className="mt-6 grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3"
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.55 }}
        >
          {[
            { label: 'Embeddings', value: `${(2.4 + cycleCount * 0.3).toFixed(1)} ZB`, color: '#a855f7' },
            { label: 'Claude Tokens', value: `${(847 + cycleCount * 123).toLocaleString()}K`, color: '#fbbf24' },
            { label: 'Fable Arcos', value: `${3 + cycleCount}`, color: '#e040a0' },
            { label: 'Graph Nodes', value: `${15 + cycleCount * 2}`, color: '#8b5cf6' },
            { label: 'Vault I/O', value: `${(7.3 + cycleCount * 1.1).toFixed(1)} ZB/s`, color: '#06d6a0' },
            { label: 'Ciclos', value: String(cycleCount), color: '#fbbf24' },
          ].map(m => (
            <div key={m.label} className="text-center p-2.5 rounded-xl bg-[#0a0a1a]/40 border border-white/5">
              <div className="text-[8px] text-[#8888aa] uppercase tracking-wider mb-1">{m.label}</div>
              <div className="text-xs sm:text-sm font-bold font-mono" style={{ color: m.color }}>
                {m.value}
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}