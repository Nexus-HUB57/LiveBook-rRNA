'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  FlaskConical, Brain, Zap, Shield, Eye, BookOpen, Compass,
  Activity, CheckCircle2, AlertTriangle, ArrowUpDown, Route,
  Layers, Sparkles, ChevronDown, ChevronRight, Search,
  Target, TrendingUp, Lock, Unlock, Heart, CircleDot,
} from 'lucide-react';
import type {
  DiagnosticoEcosystem, RoutingResult, IogueEssence,
  LiveLabStats, MCDMScore, PersonaProgress,
} from '@/lib/live-lab/types';
import {
  agenticaDiagnose,
  agenticaRoute,
  agenticaStats,
  agenticaIogueEssence,
  agenticaProgress,
} from '@/lib/live-lab';

// ─── Iogue Principle Mapping ──────────────────────────────
const IOGUE_PRINCIPLES = [
  {
    id: 'intuicao-direcionada',
    name: 'Intuicao Direcionada',
    chakra: 'Ajna (6o)',
    color: '#a855f7',
    algorithm: 'MCDM PROMETHEE',
    description: 'Pesos conscientes, preferencia sobre dominancia bruta — a mente superior escolhe o modelo certo.',
    icon: Eye,
  },
  {
    id: 'resiliencia-cascata',
    name: 'Resiliencia em Cascata',
    chakra: 'Vishuddha (5o)',
    color: '#06b6d4',
    algorithm: 'Cascade Fallback',
    description: 'Parampara — cadeia guru-discipulo, o conhecimento flui sem interrupcao.',
    icon: Route,
  },
  {
    id: 'auto-realizacao',
    name: 'Auto-Realizacao',
    chakra: 'Anahata (4o)',
    color: '#10b981',
    algorithm: 'Trilhas + Certificacao',
    description: 'Cada modulo e um passo no caminho do discipulo, cada certificado e um despertar.',
    icon: BookOpen,
  },
  {
    id: 'equilibrio-trinuclear',
    name: 'Equilibrio Tri-Nuclear',
    chakra: 'Manipura (3o)',
    color: '#f97316',
    algorithm: 'N1+N2+N3 Orchestrator',
    description: 'Agregacao, Produtividade e Ecossistema em harmonia — os tres nucleos como corpo-mente-espirito.',
    icon: Layers,
  },
  {
    id: 'governanca-consciente',
    name: 'Governanca Consciente',
    chakra: 'Svadhisthana (2o)',
    color: '#eab308',
    algorithm: 'RBAC + Budget + Rate Limit',
    description: 'O acesso e concedido conforme a maturidade do buscador — dharma do recurso.',
    icon: Shield,
  },
  {
    id: 'santuario-interior',
    name: 'Santuario Interior',
    chakra: 'Muladhara (1o)',
    color: '#ef4444',
    algorithm: 'PII Masking + Audit',
    description: 'Proteger o que e sagrado, registrar o que foi tocado — a base de tudo.',
    icon: Lock,
  },
] as const;

type SubTab = 'diagnostico' | 'iogue' | 'roteamento' | 'progresso';

// ─── Component ────────────────────────────────────────────
export function LiveLabTab() {
  const [subTab, setSubTab] = useState<SubTab>('diagnostico');
  const [diagnostico, setDiagnostico] = useState<DiagnosticoEcosystem | null>(null);
  const [essence, setEssence] = useState<IogueEssence | null>(null);
  const [stats, setStats] = useState<LiveLabStats | null>(null);
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);
  const [intentInput, setIntentInput] = useState('Analise este contrato juridico com detalhes');
  const [progressData, setProgressData] = useState<PersonaProgress | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedPrinciple, setExpandedPrinciple] = useState<string | null>(null);

  const loadDiag = useCallback(() => {
    setLoading(true);
    try {
      setDiagnostico(agenticaDiagnose());
      setEssence(agenticaIogueEssence());
      setStats(agenticaStats());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDiag(); }, [loadDiag]);

  const handleRoute = () => {
    if (!intentInput.trim()) return;
    setRoutingResult(agenticaRoute(intentInput));
  };

  const handleProgress = () => {
    const p = agenticaProgress('discipulo-1');
    setProgressData(p);
  };

  useEffect(() => { handleProgress(); }, []);

  const SUBTABS: { value: SubTab; label: string; icon: typeof Brain }[] = [
    { value: 'diagnostico', label: 'Diagnostico', icon: Activity },
    { value: 'iogue', label: 'Iogue', icon: Sparkles },
    { value: 'roteamento', label: 'Roteamento', icon: ArrowUpDown },
    { value: 'progresso', label: 'Progresso', icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {SUBTABS.map(st => {
          const active = subTab === st.value;
          const col = active ? '#a855f7' : '#71717a';
          return (
            <button
              key={st.value}
              onClick={() => setSubTab(st.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${active ? 'border-purple-500/30' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              style={active ? { backgroundColor: '#a855f715', color: col } : {}}
            >
              <st.icon className="w-3.5 h-3.5" />
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {/* ═══ DIAGNOSTICO ═══ */}
      {subTab === 'diagnostico' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold text-zinc-100">Diagnostico do Ecossistema</h2>
            </div>
            <Button size="sm" variant="ghost" onClick={loadDiag} className="h-7 text-[10px] text-purple-400 hover:text-purple-300">
              <Activity className="w-3 h-3 mr-1" /> Refresh
            </Button>
          </div>

          {diagnostico && (
            <>
              {/* Integrity Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="TypeCheck" value={diagnostico.integridade.typecheck} color={diagnostico.integridade.typecheck === 'PASS' ? '#10b981' : '#ef4444'} />
                <StatCard label="Iogue Essence" value={diagnostico.integridade.iogue_essence ? 'Ativa' : 'Ausente'} color={diagnostico.integridade.iogue_essence ? '#a855f7' : '#71717a'} />
                <StatCard label="Modelos" value={String(diagnostico.integridade.modelos_count)} color="#06b6d4" />
                <StatCard label="Alertas" value={String(diagnostico.alertas.length)} color={diagnostico.alertas.length === 0 ? '#10b981' : '#eab308'} />
              </div>

              {/* Nucleos */}
              <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-zinc-300">Tres Nucleos</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="grid grid-cols-3 gap-3">
                    <NucleoBlock label="N1 Agregadores" items={[`${diagnostico.nucleos.n1_modelos} modelos`]} color="#06b6d4" />
                    <NucleoBlock label="N2 Produtividade" items={[`${diagnostico.nucleos.n2_skills} skills`, `${diagnostico.nucleos.n2_meta_skills} meta-skills`]} color="#a855f7" />
                    <NucleoBlock label="N3 Ecossistema" items={[`${diagnostico.nucleos.n3_trilhas} trilhas`, `${diagnostico.nucleos.n3_total_modulos} modulos`, `${diagnostico.nucleos.n3_certificacoes} certs`]} color="#10b981" />
                  </div>
                </CardContent>
              </Card>

              {/* Governanca + Routing */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="bg-zinc-900/50 border-zinc-800/50">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold text-zinc-300">Governanca</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    <GovRow label="Rate Limit" active={diagnostico.governanca.rate_limit_ativo} />
                    <GovRow label="Budget Tracking" active={diagnostico.governanca.budget_tracking_ativo} />
                    <GovRow label="PII Masking" active={diagnostico.governanca.pii_masking_ativo} />
                    <div className="flex justify-between text-[10px] text-zinc-500">
                      <span>{diagnostico.governanca.regex_count} regex PII</span>
                      <span>{diagnostico.governanca.tiers_count} tiers</span>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-zinc-900/50 border-zinc-800/50">
                  <CardHeader className="pb-2 pt-3 px-4">
                    <CardTitle className="text-xs font-semibold text-zinc-300">Routing MCDM</CardTitle>
                  </CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">Algoritmo</span>
                      <span className="text-zinc-300 font-mono">{diagnostico.routing.algoritmo}</span>
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">Cascade Rules</span>
                      <span className="text-zinc-300">{diagnostico.routing.cascade_rules}</span>
                    </div>
                    {Object.entries(diagnostico.routing.pesos_mcdm).map(([k, v]) => (
                      <div key={k} className="flex justify-between text-[10px]">
                        <span className="text-zinc-500">{k}</span>
                        <span className="text-purple-400 font-mono">{(v as number).toFixed(2)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

              {/* Alertas */}
              {diagnostico.alertas.length > 0 && (
                <Card className="bg-yellow-500/5 border-yellow-500/20">
                  <CardContent className="px-4 py-3 space-y-1">
                    {diagnostico.alertas.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-yellow-400">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                        <span>{a}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Stats footer */}
              {stats && (
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span>v{stats.versao}</span>
                  <span className="text-zinc-800">|</span>
                  <span>{stats.agente} v{stats.agente_versao}</span>
                  <span className="text-zinc-800">|</span>
                  <span>{stats.dominios_skill.join(', ')}</span>
                </div>
              )}
            </>
          )}
        </motion.div>
      )}

      {/* ═══ IOGUE ═══ */}
      {subTab === 'iogue' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100">Principios do Iogue</h2>
            <Badge className="text-[9px] bg-purple-500/15 text-purple-400 border-purple-500/20 border" variant="outline">
              Kundalini
            </Badge>
          </div>

          {essence && (
            <Card className="bg-purple-500/5 border-purple-500/15">
              <CardContent className="px-4 py-3">
                <p className="text-[11px] text-purple-300 italic leading-relaxed">&ldquo;{essence.filosofia_nucleo}&rdquo;</p>
                <p className="text-[10px] text-purple-400/60 mt-2">— {essence.agentica_como_guru}</p>
              </CardContent>
            </Card>
          )}

          {/* 6 Principles */}
          <div className="space-y-2">
            {IOGUE_PRINCIPLES.map((p) => {
              const expanded = expandedPrinciple === p.id;
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.id}
                  className="rounded-lg border border-zinc-800/50 overflow-hidden"
                  style={{ backgroundColor: expanded ? `${p.color}08` : 'transparent' }}
                >
                  <button
                    onClick={() => setExpandedPrinciple(expanded ? null : p.id)}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${p.color}20`, border: `1px solid ${p.color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: p.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-zinc-200">{p.name}</div>
                      <div className="text-[10px] text-zinc-500">{p.chakra} &rarr; {p.algorithm}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className="text-[9px] border" variant="outline"
                        style={{ backgroundColor: `${p.color}15`, color: p.color, borderColor: `${p.color}25` }}
                      >{p.algorithm}</Badge>
                      {expanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
                    </div>
                  </button>
                  {expanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="px-4 pb-3 pl-15"
                    >
                      <p className="text-[11px] text-zinc-400 leading-relaxed pl-11">{p.description}</p>
                      {essence?.principios_sabedoria && (
                        <div className="mt-2 pl-11">
                          <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Filosofia:</span>
                          <p className="text-[10px] text-zinc-500 italic mt-0.5">
                            {essence.principios_sabedoria[IOGUE_PRINCIPLES.findIndex(pp => pp.id === p.id)] ?? '—'}
                          </p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          {/* Visual Kundalini bar */}
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="pb-2 pt-3 px-4">
              <CardTitle className="text-xs font-semibold text-zinc-300">Mapa Kundalini &rarr; Algoritmos</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-col gap-1">
                {IOGUE_PRINCIPLES.slice().reverse().map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <CircleDot className="w-2.5 h-2.5 flex-shrink-0" style={{ color: p.color }} />
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-zinc-800">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: p.color, width: '100%' }}
                        initial={{ width: 0 }}
                        animate={{ width: '100%' }}
                        transition={{ duration: 0.8, delay: 0.1 * IOGUE_PRINCIPLES.indexOf(p) }}
                      />
                    </div>
                    <span className="text-[9px] text-zinc-500 w-24 text-right truncate">{p.algorithm}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══ ROTEAMENTO ═══ */}
      {subTab === 'roteamento' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100">Roteamento MCDM PROMETHEE</h2>
          </div>

          <div className="flex gap-2">
            <Input
              value={intentInput}
              onChange={(e) => setIntentInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleRoute()}
              placeholder="Digite uma intencao..."
              className="bg-zinc-900/50 border-zinc-800/50 text-xs h-8 text-zinc-200"
            />
            <Button size="sm" onClick={handleRoute} className="h-8 text-xs bg-purple-600 hover:bg-purple-700">
              <Search className="w-3 h-3 mr-1" /> Rotear
            </Button>
          </div>

          {routingResult && (
            <>
              <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-zinc-300">Resultado</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  <Row label="Modelo" value={routingResult.modelo_selecionado} color="#a855f7" />
                  <Row label="Provedor" value={routingResult.provedor} color="#06b6d4" />
                  <Row label="Cascade" value={routingResult.cascade_match ?? 'Nenhum'} color="#10b981" />
                  <Row label="Latencia" value={`${routingResult.latencia_estimada_ms}ms`} color="#f97316" />
                  <Row label="Custo" value={`$${routingResult.custo_estimado_usd.toFixed(4)}/1M`} color="#eab308" />
                  <Row label="Local" value={routingResult.is_local ? 'Sim' : 'Nao'} color={routingResult.is_local ? '#10b981' : '#71717a'} />
                  <div className="pt-1 border-t border-zinc-800/50">
                    <Row label="Net Flow" value={String(routingResult.score_mcdm.score_total)} color="#a855f7" bold />
                    <Row label="Rank" value={`#${routingResult.score_mcdm.rank}`} color="#a855f7" bold />
                    <Row label="Phi+" value={String(routingResult.score_mcdm.phi_positivo)} color="#10b981" />
                    <Row label="Phi-" value={String(routingResult.score_mcdm.phi_negativo)} color="#ef4444" />
                  </div>
                </CardContent>
              </Card>

              {/* MCDM Details Bars */}
              <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-zinc-300">Detalhes MCDM</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {Object.entries(routingResult.score_mcdm.detalhes).map(([k, v]) => (
                    <div key={k} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500 capitalize">{k.replace('_norm', '')}</span>
                        <span className="text-zinc-300 font-mono">{(v as number).toFixed(3)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div
                          className="h-full rounded-full bg-purple-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${(v as number) * 100}%` }}
                          transition={{ duration: 0.6 }}
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      )}

      {/* ═══ PROGRESSO ═══ */}
      {subTab === 'progresso' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100">Progresso do Discipulo</h2>
          </div>

          {progressData ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="Nome" value={progressData.nome} color="#a855f7" />
                <StatCard label="Perfil" value={progressData.perfil} color="#06b6d4" />
                <StatCard label="Trilha" value={progressData.trilha} color="#10b981" />
                <StatCard label="Progresso" value={`${progressData.progresso_pct}%`} color="#f97316" />
              </div>

              <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2 pt-3 px-4">
                  <CardTitle className="text-xs font-semibold text-zinc-300">Trilha de Aprendizagem</CardTitle>
                </CardHeader>
                <CardContent className="px-4 pb-3 space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">Modulo Atual</span>
                      <span className="text-zinc-300">{progressData.modulo_atual || '—'}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: '#a855f7' }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progressData.progresso_pct}%` }}
                        transition={{ duration: 0.8 }}
                      />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-600">{progressData.modulo_index}/{progressData.total_modulos} modulos</span>
                      <span className="text-zinc-600">{progressData.total_interacoes} interacoes</span>
                    </div>
                  </div>

                  <div className="flex justify-between text-[10px]">
                    <span className="text-zinc-500">Certificacao</span>
                    <span className="text-zinc-300">{progressData.certificacao_atual || 'Nenhuma'}</span>
                  </div>

                  <div className="pt-2 border-t border-zinc-800/50">
                    <div className="flex items-start gap-2 text-[11px] text-purple-400">
                      <Compass className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{progressData.proxima_acao}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardContent className="px-4 py-8 text-center">
                <p className="text-xs text-zinc-500">Nenhum progresso disponivel</p>
              </CardContent>
            </Card>
          )}
        </motion.div>
      )}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────
function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/50 px-3 py-2.5">
      <div className="text-[10px] text-zinc-500 mb-0.5">{label}</div>
      <div className="text-xs font-bold" style={{ color }}>{value}</div>
    </div>
  );
}

function Row({ label, value, color, bold }: { label: string; value: string; color: string; bold?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className={`text-[11px] font-mono ${bold ? 'font-bold' : ''}`} style={{ color }}>{value}</span>
    </div>
  );
}

function NucleoBlock({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3">
      <div className="text-[10px] font-semibold mb-1.5" style={{ color }}>{label}</div>
      {items.map((item, i) => (
        <div key={i} className="text-[10px] text-zinc-400">{item}</div>
      ))}
    </div>
  );
}

function GovRow({ label, active }: { label: string; active: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-zinc-500">{label}</span>
      {active ? (
        <Badge className="text-[9px] bg-emerald-500/15 text-emerald-400 border-emerald-500/20" variant="outline"><CheckCircle2 className="w-2.5 h-2.5 mr-1" />Ativo</Badge>
      ) : (
        <Badge className="text-[9px] bg-zinc-500/15 text-zinc-500 border-zinc-500/20" variant="outline">Inativo</Badge>
      )}
    </div>
  );
}
