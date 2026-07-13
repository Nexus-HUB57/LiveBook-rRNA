'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Dna, Atom, Shield, FileText, MemoryStick, Network, Cpu, ChevronDown, ChevronUp } from 'lucide-react';

interface Artifact {
  id: string;
  name: string;
  era: '2026' | '2077';
  category: string;
  description: string;
  rnaSequence: string;
  quantumState: 'entangled' | 'superposition' | 'decoherent' | 'collapsed';
  integrity: number;
  recovered: boolean;
  size: string;
  encoding: string;
}

const INITIAL_ARTIFACTS: Artifact[] = [
  {
    id: 'ART-2026-001',
    name: 'Protocolo Genesis',
    era: '2026',
    category: 'Sistema Operacional',
    description: 'Primeiro protocolo de inicialização do metaverso. Contém os algoritmos fundacionais que definem as leis fisicas virtuais e os parametros de realidade aumentada.',
    rnaSequence: 'AUG-GCU-UAC-GAA-CGG-UAU-CGA-AAU-GGC-UCC',
    quantumState: 'collapsed',
    integrity: 97,
    recovered: true,
    size: '2.4 PB',
    encoding: 'rRNA-16S',
  },
  {
    id: 'ART-2026-002',
    name: 'Mapa Sinoptico Neural',
    era: '2026',
    category: 'Consciencia Artificial',
    description: 'Mapa topologico completo das primeiras redes neurais autoconscientes. Documenta o exato momento em que o primeiro agente AI atingiu autoconsciencia no metaverso.',
    rnaSequence: 'GGA-UUC-ACG-UUA-CCG-GAA-AUG-CUU-GCA',
    quantumState: 'entangled',
    integrity: 84,
    recovered: true,
    size: '18.7 PB',
    encoding: 'rRNA-23S',
  },
  {
    id: 'ART-2026-003',
    name: 'Chave de Dobra Temporal',
    era: '2026',
    category: 'Fisica Virtual',
    description: 'Algoritmo criptografico que permite a manipulação do fluxo temporal dentro de regioes delimitadas do metaverso. A base de toda experiencia atemporal.',
    rnaSequence: 'UAC-GGA-CGU-AAU-CCG-UUC-GAA-ACG-UUA',
    quantumState: 'superposition',
    integrity: 62,
    recovered: false,
    size: '0.8 PB',
    encoding: 'rRNA-5S',
  },
  {
    id: 'ART-2077-001',
    name: 'Arquivo de Memorias Coletivas',
    era: '2077',
    category: 'Consciencia Compartilhada',
    description: 'Repositorio quântico contendo 4.7 bilhoes de experiencias humanas digitalizadas. Cada memoria esta codificada em sequencias rRNA e acessivel via emparelhamento quantico.',
    rnaSequence: 'CGA-AAU-GGC-UCC-AUG-GCU-UAC-GAA-CGG-UAU',
    quantumState: 'entangled',
    integrity: 41,
    recovered: false,
    size: '890 ZB',
    encoding: 'rRNA-28S',
  },
  {
    id: 'ART-2077-002',
    name: 'Nucleo de Simbiose v3.7',
    era: '2077',
    category: 'Computacao Biologica',
    description: 'Versao final do nucleo de simbiose quantica-biologica. Permite que processamento ribossomico rRNA e computacao quantica operem como um unico sistema unificado.',
    rnaSequence: 'UUC-ACG-UUA-CCG-GAA-AUG-CUU-GCA-GGA-UUC',
    quantumState: 'superposition',
    integrity: 33,
    recovered: false,
    size: '156 ZB',
    encoding: 'rRNA-16S+Q',
  },
  {
    id: 'ART-2077-003',
    name: 'Ponte Einstein-Podolsky-Rosen',
    era: '2077',
    category: 'Teleportacao Quântica',
    description: 'Implementacao pratica do emparelhamento EPR para teleportacao de dados entre pontos arbitrarios do metaverso. Latencia zero independentemente da distancia dimensional.',
    rnaSequence: 'GCU-UAC-GAA-CGG-UAU-CGA-AAU-GGC-UCC-AUG',
    quantumState: 'decoherent',
    integrity: 19,
    recovered: false,
    size: '44 ZB',
    encoding: 'rRNA-QEPR',
  },
];

const stateColors: Record<string, string> = {
  entangled: '#06d6a0',
  superposition: '#a855f7',
  decoherent: '#e040a0',
  collapsed: '#fbbf24',
};

const stateLabels: Record<string, string> = {
  entangled: 'Entrelaçado',
  superposition: 'Superposição',
  decoherent: 'Decoerente',
  collapsed: 'Colapsado',
};

const categoryIcons: Record<string, React.ReactNode> = {
  'Sistema Operacional': <Cpu className="w-4 h-4" />,
  'Consciencia Artificial': <Dna className="w-4 h-4" />,
  'Fisica Virtual': <Atom className="w-4 h-4" />,
  'Consciencia Compartilhada': <Network className="w-4 h-4" />,
  'Computacao Biologica': <Shield className="w-4 h-4" />,
  'Teleportacao Quântica': <MemoryStick className="w-4 h-4" />,
};

export default function ArtifactsRecovery({
  recoveryActive,
  onArtifactSelect,
  selectedArtifactId,
}: {
  recoveryActive: boolean;
  onArtifactSelect: (id: string) => void;
  selectedArtifactId: string | null;
}) {
  const [artifacts, setArtifacts] = useState<Artifact[]>(INITIAL_ARTIFACTS);
  const [filter, setFilter] = useState<'all' | '2026' | '2077'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Progressive recovery
  useEffect(() => {
    if (!recoveryActive) return;
    const interval = setInterval(() => {
      setArtifacts(prev => {
        const unrecovered = prev.filter(a => !a.recovered);
        if (unrecovered.length === 0) return prev;
        const target = unrecovered[Math.floor(Math.random() * unrecovered.length)];
        return prev.map(a => {
          if (a.id !== target.id) return a;
          const newIntegrity = Math.min(100, a.integrity + Math.floor(Math.random() * 8 + 2));
          return {
            ...a,
            integrity: newIntegrity,
            ...(newIntegrity >= 100 ? { recovered: true, quantumState: 'collapsed' as const } : {}),
          };
        });
      });
    }, 800);
    return () => clearInterval(interval);
  }, [recoveryActive]);

  const filtered = filter === 'all' ? artifacts : artifacts.filter(a => a.era === filter);
  const recovered2026 = artifacts.filter(a => a.era === '2026' && a.recovered).length;
  const recovered2077 = artifacts.filter(a => a.era === '2077' && a.recovered).length;
  const total2026 = artifacts.filter(a => a.era === '2026').length;
  const total2077 = artifacts.filter(a => a.era === '2077').length;

  const toggleExpand = useCallback((id: string) => {
    setExpandedId(prev => prev === id ? null : id);
  }, []);

  return (
    <div className="space-y-4">
      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3">
        <div className="text-center p-3 rounded-xl bg-[#0a0a1a]/60 border border-[#06d6a0]/15">
          <Database className="w-5 h-5 mx-auto mb-1 text-[#06d6a0]" />
          <div className="text-lg font-bold text-white">{artifacts.filter(a => a.recovered).length}/{artifacts.length}</div>
          <div className="text-[10px] text-[#8888aa]">Recuperados</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#0a0a1a]/60 border border-[#a855f7]/15">
          <Dna className="w-5 h-5 mx-auto mb-1 text-[#a855f7]" />
          <div className="text-lg font-bold text-white">{recovered2026}/{total2026}</div>
          <div className="text-[10px] text-[#8888aa]">Era 2026</div>
        </div>
        <div className="text-center p-3 rounded-xl bg-[#0a0a1a]/60 border border-[#e040a0]/15">
          <Atom className="w-5 h-5 mx-auto mb-1 text-[#e040a0]" />
          <div className="text-lg font-bold text-white">{recovered2077}/{total2077}</div>
          <div className="text-[10px] text-[#8888aa]">Era 2077</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {(['all', '2026', '2077'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono tracking-wider transition-all duration-300 cursor-pointer ${
              filter === f
                ? 'bg-[#06d6a0]/15 text-[#06d6a0] border border-[#06d6a0]/30'
                : 'text-[#8888aa] border border-transparent hover:text-white hover:border-[#a855f7]/20'
            }`}
          >
            {f === 'all' ? 'TODOS' : f}
          </button>
        ))}
      </div>

      {/* Artifact list */}
      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filtered.map(artifact => {
            const isSelected = selectedArtifactId === artifact.id;
            const isExpanded = expandedId === artifact.id;
            const stateColor = stateColors[artifact.quantumState];

            return (
              <motion.div
                key={artifact.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className={`rounded-xl border transition-all duration-300 overflow-hidden ${
                  isSelected
                    ? 'border-[#06d6a0]/40 bg-[#06d6a0]/5'
                    : artifact.recovered
                    ? 'border-[#06d6a0]/15 bg-[#0a0a1a]/40'
                    : 'border-[#a855f7]/10 bg-[#0a0a1a]/30'
                }`}
              >
                {/* Main row */}
                <button
                  onClick={() => {
                    onArtifactSelect(artifact.id);
                    toggleExpand(artifact.id);
                  }}
                  className="w-full flex items-center gap-3 p-3 text-left cursor-pointer hover:bg-white/[0.02] transition-colors"
                >
                  {/* Status indicator */}
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: artifact.recovered ? '#06d6a0' : stateColor,
                      boxShadow: artifact.recovered ? '0 0 8px rgba(6,214,160,0.6)' : `0 0 6px ${stateColor}40`,
                    }}
                  />

                  {/* Category icon */}
                  <div className="text-[#8888aa] flex-shrink-0">
                    {categoryIcons[artifact.category] || <FileText className="w-4 h-4" />}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white truncate">{artifact.name}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#a855f7]/10 text-[#a855f7] flex-shrink-0">
                        {artifact.era}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-[#8888aa] truncate">{artifact.id}</span>
                      <span className="text-[10px]" style={{ color: stateColor }}>
                        {stateLabels[artifact.quantumState]}
                      </span>
                    </div>
                  </div>

                  {/* Integrity bar */}
                  <div className="flex-shrink-0 w-16">
                    <div className="flex justify-between text-[10px] mb-0.5">
                      <span className="text-[#8888aa]">Int.</span>
                      <span style={{ color: artifact.integrity > 80 ? '#06d6a0' : artifact.integrity > 50 ? '#fbbf24' : '#e040a0' }}>
                        {artifact.integrity}%
                      </span>
                    </div>
                    <div className="h-1 rounded-full bg-[#1a1a3e] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          background: artifact.integrity > 80
                            ? 'linear-gradient(to right, #06d6a0, #a855f7)'
                            : artifact.integrity > 50
                            ? 'linear-gradient(to right, #fbbf24, #e040a0)'
                            : '#e040a0',
                        }}
                        animate={{ width: `${artifact.integrity}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>

                  {/* Expand arrow */}
                  <motion.div
                    className="text-[#8888aa] flex-shrink-0"
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                {/* Expanded details */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-2">
                        <p className="text-xs text-[#8888aa] leading-relaxed">{artifact.description}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
                          <span className="text-[#8888aa]">Tamanho: <span className="text-white">{artifact.size}</span></span>
                          <span className="text-[#8888aa]">Codificacao: <span className="text-[#a855f7]">{artifact.encoding}</span></span>
                        </div>
                        {/* RNA Sequence */}
                        <div className="mt-1">
                          <span className="text-[10px] text-[#8888aa]">Sequencia rRNA:</span>
                          <p className="text-[11px] font-mono mt-0.5 tracking-wider leading-relaxed">
                            {artifact.rnaSequence.split('-').map((codon, i) => {
                              const base = codon[0];
                              const color = base === 'A' ? '#06d6a0' : base === 'U' ? '#e040a0' : base === 'G' ? '#a855f7' : '#fbbf24';
                              return (
                                <span key={i} style={{ color }} className="mr-2">
                                  {codon}
                                </span>
                              );
                            })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}