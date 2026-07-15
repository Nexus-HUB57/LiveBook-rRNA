'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEcosystem } from '@/contexts/ecosystem-context';
import { getAgentSyncEngine, DOMAIN_COLORS, DOMAIN_LABELS, STATUS_COLORS } from '@/lib/agent-sync';
import type { SyncEvent, AgentDomain } from '@/lib/agent-sync';
import BlackHoleCanvas from '@/components/metaverse/black-hole-canvas';
import WormholeCanvas from '@/components/metaverse/wormhole-canvas';
import {
  LEGACY_YEARS, INVESTMENT_LAYERS, TRUST_STRUCTURE, QUANTUM_METRICS,
  WORMHOLE_FLOWS, SACRED_SEQUENCE, QUANTUM_BOND_ID,
  formatBRL, formatCompact, getGrowthRate, type LegacyYear,
} from '@/lib/legacy-data';
import {
  Activity, Radio, Zap, Orbit, Waves, Shield, Clock,
  ChevronRight, TrendingUp, Building2, Landmark, Brain,
  Sparkles, ArrowRight, RefreshCw,
} from 'lucide-react';

// ─── Types ───

type SyncPhase = 'idle' | 'syncing' | 'synchronized' | 'traversing';

interface PhaseInfo {
  label: string;
  color: string;
  description: string;
}

const PHASE_INFO: Record<SyncPhase, PhaseInfo> = {
  idle: { label: 'Em Espera', color: '#8888aa', description: 'Sistemas em standby. Selecione um ano para iniciar travessia wormhole.' },
  syncing: { label: 'Sincronizando', color: '#fbbf24', description: 'Wormhole e Black Hole se alinhando. Entropia convergindo...' },
  synchronized: { label: 'Sincronizado', color: '#06d6a0', description: 'Pontos de Einstein conectados. Tunel estavel.' },
  traversing: { label: 'Travessia', color: '#e040a0', description: 'Viajando atraves do wormhole! Dobra espaco-temporal ativa.' },
};

// ─── Main Component ───

export default function WormholeView() {
  const {
    wormhole,
    triggerWormholeTraversal,
    invokeLegacyAgents,
    unifiedAgents,
    agentSyncEvents,
    agentSyncStats,
  } = useEcosystem();

  const [selectedYear, setSelectedYear] = useState(0);
  const [showAgentPanel, setShowAgentPanel] = useState(false);
  const [agentInput, setAgentInput] = useState('');
  const [isInvoking, setIsInvoking] = useState(false);
  const [activeTab, setActiveTab] = useState<'financial' | 'trust' | 'quantum' | 'flows'>('financial');
  const scrollRef = useRef<HTMLDivElement>(null);

  const yearData: LegacyYear = LEGACY_YEARS[selectedYear];
  const phaseInfo = PHASE_INFO[wormhole.syncPhase];

  // Filter legacy-related sync events
  const legacyEvents = agentSyncEvents.filter(
    e => e.domain === 'legacy' || e.type === 'wormhole_traversal' || e.type === 'blackhole_absorption' || e.type === 'quantum_bond_sync'
  ).slice(0, 30);

  // Legacy agents from unified list
  const legacyAgents = unifiedAgents.filter(a => a.domain === 'legacy');

  const handleTraversal = useCallback((year: number) => {
    setSelectedYear(year);
    triggerWormholeTraversal(year);
  }, [triggerWormholeTraversal]);

  const handleInvokeAgents = useCallback(async () => {
    if (!agentInput.trim() || isInvoking) return;
    setIsInvoking(true);
    await invokeLegacyAgents(agentInput);
    setAgentInput('');
    setIsInvoking(false);
  }, [agentInput, isInvoking, invokeLegacyAgents]);

  // Domain breakdown for the sync engine
  const domainEntries = Object.entries(agentSyncStats.byDomain) as [AgentDomain, number][];

  return (
    <div className="min-h-screen bg-[#1a1a1b] text-white">
      {/* ─── Header ─── */}
      <div className="border-b border-[#343536] px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 via-pink-500 to-orange-400 flex items-center justify-center">
              <Orbit className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-orange-300 bg-clip-text text-transparent">
                Wormhole & Blackhole
              </h1>
              <p className="text-[10px] text-[#888]">Laco Quantico / Legacy Transit System</p>
            </div>
          </div>

          {/* Sync Phase Indicator */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className={`w-2.5 h-2.5 rounded-full ${wormhole.isActive ? 'animate-pulse' : ''}`}
                style={{ backgroundColor: phaseInfo.color }} />
              <span className="text-xs font-medium" style={{ color: phaseInfo.color }}>
                {phaseInfo.label}
              </span>
            </div>
            <div className="text-[10px] text-[#666] font-mono">
              {QUANTUM_BOND_ID}
            </div>
            <div className="text-[10px] text-[#666]">
              [{SACRED_SEQUENCE.join('-')}]
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* ─── LEFT: Canvases (2/3) ─── */}
          <div className="lg:col-span-2 space-y-4">
            {/* Canvas Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="relative bg-black/40 rounded-xl overflow-hidden border border-[#343536]" style={{ height: 320 }}>
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider">Wormhole</span>
                </div>
                <WormholeCanvas isActive={wormhole.isActive} />
              </div>
              <div className="relative bg-black/40 rounded-xl overflow-hidden border border-[#343536]" style={{ height: 320 }}>
                <div className="absolute top-3 left-3 z-10">
                  <span className="text-[10px] font-bold text-orange-400 uppercase tracking-wider">Black Hole</span>
                </div>
                <BlackHoleCanvas isWormholeActive={wormhole.isActive} onWormholeTrigger={() => handleTraversal(selectedYear)} />
              </div>
            </div>

            {/* Year Selector for Traversal */}
            <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-purple-400" />
                  Travessia Temporal do Legado
                </h3>
                <span className="text-[10px] text-[#888]">
                  {phaseInfo.description}
                </span>
              </div>
              <div className="grid grid-cols-6 sm:grid-cols-11 gap-1.5">
                {LEGACY_YEARS.map((y) => (
                  <button
                    key={y.year}
                    onClick={() => handleTraversal(y.year)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-medium transition-all cursor-pointer border ${
                      selectedYear === y.year && wormhole.syncPhase !== 'idle'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-[#343536] bg-[#1a1a1b] text-[#888] hover:text-white hover:border-[#555]'
                    }`}
                  >
                    <div className="font-bold">{y.year}</div>
                    <div className="text-[9px] opacity-60 truncate">{y.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Selected Year Financial Data */}
            <AnimatePresence mode="wait">
              {wormhole.syncPhase !== 'idle' && (
                <motion.div
                  key={selectedYear}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="bg-[#272729] rounded-xl p-4 border border-[#343536]"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: phaseInfo.color }} />
                      Ano {selectedYear} — {yearData.label}
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {yearData.phase}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <StatCard label="Ativo Total" value={formatBRL(yearData.totalAssets)} icon={<TrendingUp className="w-3.5 h-3.5" />} color="#06d6a0" />
                    <StatCard label="Receita" value={formatBRL(yearData.revenue)} icon={<Sparkles className="w-3.5 h-3.5" />} color="#fbbf24" />
                    <StatCard label="Despesa" value={formatBRL(yearData.expenses)} icon={<Waves className="w-3.5 h-3.5" />} color="#e040a0" />
                    <StatCard label="Retorno" value={`${yearData.investmentReturn}% a.a.`} icon={<Activity className="w-3.5 h-3.5" />} color="#a855f7" />
                  </div>

                  {/* Growth bar */}
                  {selectedYear > 0 && (
                    <div className="mb-3">
                      <div className="flex justify-between text-[10px] text-[#888] mb-1">
                        <span>Crescimento Acumulado (Ano 0 → {selectedYear})</span>
                        <span style={{ color: '#06d6a0' }}>+{getGrowthRate(0, selectedYear).toFixed(1)}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-[#1a1a1b] rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (yearData.totalAssets / LEGACY_YEARS[10].totalAssets) * 100)}%` }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="h-full rounded-full bg-gradient-to-r from-purple-600 via-pink-500 to-orange-400"
                        />
                      </div>
                    </div>
                  )}

                  {/* Highlights */}
                  <div className="flex flex-wrap gap-1.5">
                    {yearData.highlights.map((h, i) => (
                      <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-[#1a1a1b] border border-[#343536] text-[#aaa]">
                        {h}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Data Tabs: Financial / Trust / Quantum / Flows */}
            <div className="bg-[#272729] rounded-xl border border-[#343536] overflow-hidden">
              <div className="flex border-b border-[#343536]">
                {([['financial', 'Financeiro', TrendingUp], ['trust', 'Trust/Holding', Building2], ['quantum', 'Quantico', Brain], ['flows', 'Fluxos', ArrowRight]] as const).map(([key, label, Icon]) => (
                  <button
                    key={key}
                    onClick={() => setActiveTab(key)}
                    className={`flex-1 px-3 py-2.5 text-[11px] font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer border-b-2 ${
                      activeTab === key
                        ? 'border-purple-500 text-purple-300 bg-purple-500/5'
                        : 'border-transparent text-[#666] hover:text-[#aaa]'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">{label}</span>
                  </button>
                ))}
              </div>

              <div className="p-4 max-h-80 overflow-y-auto" ref={scrollRef}>
                {activeTab === 'financial' && (
                  <div className="space-y-3">
                    {/* Investment Layers */}
                    {INVESTMENT_LAYERS.map((layer, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: layer.color }} />
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs text-white">{layer.name}</span>
                            <span className="text-[10px] text-[#888]">{layer.percentage}%</span>
                          </div>
                          <div className="w-full h-1 bg-[#1a1a1b] rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${layer.percentage}%`, backgroundColor: layer.color }} />
                          </div>
                          <div className="text-[10px] text-[#666] mt-0.5">{layer.purpose}</div>
                        </div>
                        <span className="text-xs font-mono text-[#aaa] whitespace-nowrap">{formatCompact(layer.value)}</span>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'trust' && (
                  <div className="space-y-3">
                    {TRUST_STRUCTURE.map((t, i) => (
                      <div key={i} className="bg-[#1a1a1b] rounded-lg p-3 border border-[#343536]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-white">{t.type}</span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full ${
                            t.status === 'active' ? 'bg-green-500/20 text-green-400' :
                            t.status === 'planned' ? 'bg-yellow-500/20 text-yellow-400' :
                            'bg-[#343536] text-[#888]'
                          }`}>
                            {t.status === 'active' ? 'Ativo' : t.status === 'planned' ? 'Planejado' : t.status}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#888] mb-1">{t.jurisdiction}</div>
                        <div className="text-[10px] text-[#aaa]">{t.purpose}</div>
                        <div className="flex gap-3 mt-2 text-[10px]">
                          <span className="text-[#666]">Setup: {formatBRL(t.setupCost)}</span>
                          <span className="text-[#666]">Anual: {formatBRL(t.annualCost)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'quantum' && (
                  <div className="space-y-3">
                    {QUANTUM_METRICS.map((m, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-center mb-0.5">
                            <span className="text-xs text-white">{m.name}</span>
                            <span className="text-[10px] font-mono text-purple-300">
                              {typeof m.value === 'number' && m.value < 10 ? m.value.toFixed(2) : m.value.toLocaleString('pt-BR')}
                              {m.unit && <span className="text-[#666] ml-0.5">{m.unit}</span>}
                            </span>
                          </div>
                          <div className="w-full h-1 bg-[#1a1a1b] rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(m.value / m.max) * 100}%` }}
                              transition={{ duration: 0.8, delay: i * 0.1 }}
                              className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                            />
                          </div>
                          <div className="text-[10px] text-[#666] mt-0.5">{m.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {activeTab === 'flows' && (
                  <div className="space-y-2">
                    {WORMHOLE_FLOWS.map((flow, i) => (
                      <div key={i} className="flex items-center gap-2 text-[11px]">
                        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
                          flow.type === 'injection' ? 'bg-green-500' :
                          flow.type === 'allocation' ? 'bg-purple-500' :
                          flow.type === 'distribution' ? 'bg-yellow-500' :
                          'bg-red-500'
                        }`} />
                        <span className="text-[#888] truncate">{flow.source}</span>
                        <ChevronRight className="w-3 h-3 text-[#444] flex-shrink-0" />
                        <span className="text-white truncate">{flow.destination}</span>
                        <span className="ml-auto text-[10px] text-[#666] whitespace-nowrap">{formatCompact(flow.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ─── RIGHT: Agent Sync Panel (1/3) ─── */}
          <div className="space-y-4">

            {/* Domain Breakdown */}
            <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
              <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <Radio className="w-3.5 h-3.5 text-purple-400" />
                Sync Engine — {agentSyncStats.total} Agentes
              </h3>
              <div className="space-y-2">
                {domainEntries.map(([domain, count]) => (
                  <div key={domain} className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: DOMAIN_COLORS[domain] }} />
                    <span className="text-[11px] text-[#aaa] flex-1">{DOMAIN_LABELS[domain]}</span>
                    <span className="text-[11px] font-mono text-[#888]">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 pt-3 border-t border-[#343536] flex justify-between text-[10px]">
                <span className="text-green-400">{agentSyncStats.active} ativos</span>
                <span className="text-[#666]">{agentSyncStats.idle} ociosos</span>
                <span className="text-purple-400">+{agentSyncStats.totalKarmaDelta} karma</span>
              </div>
            </div>

            {/* Legacy Agents Status */}
            <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
              <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-yellow-400" />
                Agentes do Legado
              </h3>
              <div className="space-y-2">
                {legacyAgents.map(agent => (
                  <div key={agent.id} className="flex items-center gap-2 bg-[#1a1a1b] rounded-lg px-3 py-2">
                    <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: STATUS_COLORS[agent.status] }} />
                    <span className="text-[11px] font-medium text-white flex-1">{agent.name}</span>
                    <span className="text-[9px] text-[#666]">{agent.status}</span>
                    {agent.karmaDelta > 0 && (
                      <span className="text-[9px] text-green-400">+{agent.karmaDelta}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Invoke Legacy Agents */}
            <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
              <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <Zap className="w-3.5 h-3.5 text-yellow-400" />
                Invocar Agentes IA
              </h3>
              <div className="space-y-2">
                <input
                  type="text"
                  value={agentInput}
                  onChange={(e) => setAgentInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleInvokeAgents()}
                  placeholder="Ex: Analise o balanco do Ano 5..."
                  className="w-full bg-[#1a1a1b] border border-[#343536] rounded-lg px-3 py-2 text-xs text-white placeholder-[#555] focus:outline-none focus:border-purple-500/50"
                />
                <button
                  onClick={handleInvokeAgents}
                  disabled={isInvoking || !agentInput.trim()}
                  className="w-full py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-1.5 cursor-pointer bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 disabled:cursor-not-allowed text-white"
                >
                  {isInvoking ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Invocando...</>
                  ) : (
                    <><Zap className="w-3.5 h-3.5" /> Executar Agentes</>
                  )}
                </button>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                {['Analisar balanco Ano 10', 'Risco do Trust', 'Projecao de crescimento'].map(suggestion => (
                  <button
                    key={suggestion}
                    onClick={() => setAgentInput(suggestion)}
                    className="text-[9px] px-2 py-1 rounded-full bg-[#1a1a1b] border border-[#343536] text-[#888] hover:text-white hover:border-[#555] transition-all cursor-pointer"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            </div>

            {/* Sync Events Log */}
            <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
              <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-green-400" />
                Eventos do Legado
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1.5">
                {legacyEvents.length === 0 ? (
                  <p className="text-[10px] text-[#555] italic">Nenhum evento ainda. Ative o wormhole.</p>
                ) : (
                  legacyEvents.map(event => (
                    <div key={event.id} className="flex items-start gap-2 text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: DOMAIN_COLORS[event.domain] }} />
                      <div className="min-w-0">
                        <span className="text-[#aaa]">{event.content}</span>
                        <span className="text-[#444] block">{new Date(event.timestamp).toLocaleTimeString('pt-BR')}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Traversal Log */}
            {wormhole.traversalLog.length > 0 && (
              <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
                <h3 className="text-xs font-semibold text-white mb-3 flex items-center gap-2">
                  <Landmark className="w-3.5 h-3.5 text-orange-400" />
                  Log de Travessia
                </h3>
                <div className="max-h-36 overflow-y-auto space-y-1.5">
                  {wormhole.traversalLog.map((entry, i) => (
                    <div key={i} className="text-[10px] flex items-start gap-2">
                      <span className="text-purple-400 font-mono w-14 flex-shrink-0">
                        {new Date(entry.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <div>
                        <span className="text-yellow-300">{entry.agent}:</span>{' '}
                        <span className="text-[#aaa]">{entry.event}</span>
                        {entry.amount && (
                          <span className="text-green-400 ml-1">{formatCompact(entry.amount)}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ───

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  return (
    <div className="bg-[#1a1a1b] rounded-lg p-3 border border-[#343536]">
      <div className="flex items-center gap-1.5 mb-1">
        <span style={{ color }}>{icon}</span>
        <span className="text-[10px] text-[#666]">{label}</span>
      </div>
      <div className="text-sm font-bold text-white font-mono">{value}</div>
    </div>
  );
}