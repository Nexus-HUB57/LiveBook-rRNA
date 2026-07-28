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
  Target, TrendingUp, Lock, CircleDot, Play, XCircle,
  Loader2, RefreshCw,
} from 'lucide-react';
import type {
  DiagnosticoEcosystem, RoutingResult, IogueEssence,
  LiveLabStats, PersonaProgress, SkillResult, MetaSkillResult, GovernancaCheck,
} from '@/lib/live-lab/types';

// ─── API helpers ─────────────────────────────────────────
const API = '/api/live-lab';
async function apiGet<T>(path: string): Promise<T> {
  const r = await fetch(`${API}${path}`);
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}
async function apiPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const r = await fetch(`${API}${path}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!r.ok) throw new Error(await r.text());
  return r.json();
}

// ─── Iogue Principle Mapping ──────────────────────────────
const IOGUE_PRINCIPLES = [
  { id: 'intuicao-direcionada', name: 'Intuicao Direcionada', chakra: 'Ajna (6o)', color: '#a855f7', algorithm: 'MCDM PROMETHEE', description: 'Pesos conscientes, preferencia sobre dominancia bruta — a mente superior escolhe o modelo certo.', icon: Eye },
  { id: 'resiliencia-cascata', name: 'Resiliencia em Cascata', chakra: 'Vishuddha (5o)', color: '#06b6d4', algorithm: 'Cascade Fallback', description: 'Parampara — cadeia guru-discipulo, o conhecimento flui sem interrupcao.', icon: Route },
  { id: 'auto-realizacao', name: 'Auto-Realizacao', chakra: 'Anahata (4o)', color: '#10b981', algorithm: 'Trilhas + Certificacao', description: 'Cada modulo e um passo no caminho do discipulo, cada certificado e um despertar.', icon: BookOpen },
  { id: 'equilibrio-trinuclear', name: 'Equilibrio Tri-Nuclear', chakra: 'Manipura (3o)', color: '#f97316', algorithm: 'N1+N2+N3 Orchestrator', description: 'Agregacao, Produtividade e Ecossistema em harmonia — os tres nucleos como corpo-mente-espirito.', icon: Layers },
  { id: 'governanca-consciente', name: 'Governanca Consciente', chakra: 'Svadhisthana (2o)', color: '#eab308', algorithm: 'RBAC + Budget + Rate Limit', description: 'O acesso e concedido conforme a maturidade do buscador — dharma do recurso.', icon: Shield },
  { id: 'santuario-interior', name: 'Santuario Interior', chakra: 'Muladhara (1o)', color: '#ef4444', algorithm: 'PII Masking + Audit', description: 'Proteger o que e sagrado, registrar o que foi tocado — a base de tudo.', icon: Lock },
] as const;

type SubTab = 'diagnostico' | 'iogue' | 'roteamento' | 'skills' | 'progresso';

// ─── Component ────────────────────────────────────────────
export function LiveLabTab() {
  const [subTab, setSubTab] = useState<SubTab>('diagnostico');
  const [diagnostico, setDiagnostico] = useState<DiagnosticoEcosystem | null>(null);
  const [essence, setEssence] = useState<IogueEssence | null>(null);
  const [stats, setStats] = useState<LiveLabStats | null>(null);
  const [routingResult, setRoutingResult] = useState<RoutingResult | null>(null);
  const [intentInput, setIntentInput] = useState('Analise este contrato juridico com detalhes');
  const [progressData, setProgressData] = useState<PersonaProgress | null>(null);
  const [skillResult, setSkillResult] = useState<SkillResult | null>(null);
  const [metaResult, setMetaResult] = useState<MetaSkillResult | null>(null);
  const [govResult, setGovResult] = useState<GovernancaCheck | null>(null);
  const [loading, setLoading] = useState(false);
  const [expandedPrinciple, setExpandedPrinciple] = useState<string | null>(null);
  const [skillId, setSkillId] = useState('code_review');
  const [metaSkillId, setMetaSkillId] = useState('full_stack_dev');
  const [personaId, setPersonaId] = useState('ai-engineer');
  const [govAcao, setGovAcao] = useState('executar');
  const [govNivel, setGovNivel] = useState('advanced');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadDiag = useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const [d, e, s] = await Promise.all([
        apiGet<DiagnosticoEcosystem>('/diagnose'),
        apiGet<IogueEssence>('/iogue-essence').catch(() => null),
        apiGet<LiveLabStats>('/stats'),
      ]);
      setDiagnostico(d);
      setEssence(e);
      setStats(s);
    } catch (err) {
      setErrorMsg(String(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDiag(); }, [loadDiag]);

  const handleRoute = async () => {
    if (!intentInput.trim()) return;
    setErrorMsg(null);
    try {
      const r = await apiPost<RoutingResult>('/route', { intent: intentInput });
      setRoutingResult(r);
    } catch (err) { setErrorMsg(String(err)); }
  };

  const handleSkill = async () => {
    setErrorMsg(null);
    try {
      const r = await apiPost<SkillResult>('/skill', { skillId, personaId, input: {} });
      setSkillResult(r);
    } catch (err) { setErrorMsg(String(err)); }
  };

  const handleMetaSkill = async () => {
    setErrorMsg(null);
    try {
      const r = await apiPost<MetaSkillResult>('/meta-skill', { metaSkillId, personaId, input: {} });
      setMetaResult(r);
    } catch (err) { setErrorMsg(String(err)); }
  };

  const handleGov = async () => {
    setErrorMsg(null);
    try {
      const r = await apiPost<GovernancaCheck>('/governanca', { personaId, acao: govAcao, nivelRequerido: govNivel });
      setGovResult(r);
    } catch (err) { setErrorMsg(String(err)); }
  };

  const loadProgress = useCallback(async () => {
    try {
      const p = await apiGet<PersonaProgress>(`/progress?personaId=${personaId}`);
      setProgressData(p);
    } catch { setProgressData(null); }
  }, [personaId]);

  useEffect(() => { loadProgress(); }, [loadProgress]);

  const SUBTABS: { value: SubTab; label: string; icon: typeof Brain }[] = [
    { value: 'diagnostico', label: 'Diagnostico', icon: Activity },
    { value: 'iogue', label: 'Iogue', icon: Sparkles },
    { value: 'roteamento', label: 'Roteamento', icon: ArrowUpDown },
    { value: 'skills', label: 'Skills', icon: Play },
    { value: 'progresso', label: 'Progresso', icon: TrendingUp },
  ];

  return (
    <div className="space-y-4">
      {/* Sub-tab nav */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {SUBTABS.map(st => {
          const active = subTab === st.value;
          return (
            <button key={st.value} onClick={() => setSubTab(st.value)}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${active ? 'border-purple-500/30' : 'border-transparent text-zinc-500 hover:text-zinc-300'}`}
              style={active ? { backgroundColor: '#a855f715', color: '#a855f7' } : {}}>
              <st.icon className="w-3.5 h-3.5" /><span>{st.label}</span>
            </button>
          );
        })}
      </div>

      {errorMsg && (
        <div className="flex items-center gap-2 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" /><span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="ml-auto"><XCircle className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* ═══ DIAGNOSTICO ═══ */}
      {subTab === 'diagnostico' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FlaskConical className="w-5 h-5 text-purple-400" />
              <h2 className="text-sm font-bold text-zinc-100">Diagnostico do Ecossistema</h2>
            </div>
            <Button size="sm" variant="ghost" onClick={loadDiag} disabled={loading} className="h-7 text-[10px] text-purple-400 hover:text-purple-300">
              {loading ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />} Refresh
            </Button>
          </div>

          {diagnostico && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <StatCard label="TypeCheck" value={diagnostico.integridade.typecheck} color={diagnostico.integridade.typecheck === 'PASS' ? '#10b981' : '#ef4444'} />
                <StatCard label="Iogue Essence" value={diagnostico.integridade.iogue_essence ? 'Ativa' : 'Ausente'} color={diagnostico.integridade.iogue_essence ? '#a855f7' : '#71717a'} />
                <StatCard label="Modelos" value={String(diagnostico.integridade.modelos_count)} color="#06b6d4" />
                <StatCard label="Alertas" value={String(diagnostico.alertas.length)} color={diagnostico.alertas.length === 0 ? '#10b981' : '#eab308'} />
              </div>

              <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Tres Nucleos</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3">
                  <div className="grid grid-cols-3 gap-3">
                    <NucleoBlock label="N1 Agregadores" items={[`${diagnostico.nucleos.n1_modelos} modelos`]} color="#06b6d4" />
                    <NucleoBlock label="N2 Produtividade" items={[`${diagnostico.nucleos.n2_skills} skills`, `${diagnostico.nucleos.n2_meta_skills} meta-skills`]} color="#a855f7" />
                    <NucleoBlock label="N3 Ecossistema" items={[`${diagnostico.nucleos.n3_trilhas} trilhas`, `${diagnostico.nucleos.n3_total_modulos} modulos`, `${diagnostico.nucleos.n3_certificacoes} certs`]} color="#10b981" />
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Card className="bg-zinc-900/50 border-zinc-800/50">
                  <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Governanca</CardTitle></CardHeader>
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
                  <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Routing MCDM</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-3 space-y-2">
                    <Row label="Algoritmo" value={diagnostico.routing.algoritmo} color="#a855f7" />
                    <Row label="Cascade Rules" value={String(diagnostico.routing.cascade_rules)} color="#06b6d4" />
                    {Object.entries(diagnostico.routing.pesos_mcdm).map(([k, v]) => (
                      <Row key={k} label={k} value={(v as number).toFixed(2)} color="#a855f7" mono />
                    ))}
                  </CardContent>
                </Card>
              </div>

              {diagnostico.alertas.length > 0 && (
                <Card className="bg-yellow-500/5 border-yellow-500/20">
                  <CardContent className="px-4 py-3 space-y-1">
                    {diagnostico.alertas.map((a, i) => (
                      <div key={i} className="flex items-start gap-2 text-[11px] text-yellow-400">
                        <AlertTriangle className="w-3 h-3 mt-0.5 flex-shrink-0" /><span>{a}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {stats && (
                <div className="flex items-center gap-3 text-[10px] text-zinc-600">
                  <span>v{stats.versao}</span><span className="text-zinc-800">|</span>
                  <span>{stats.agente} v{stats.agente_versao}</span><span className="text-zinc-800">|</span>
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
            <Badge className="text-[9px] bg-purple-500/15 text-purple-400 border-purple-500/20 border" variant="outline">Kundalini</Badge>
          </div>

          {essence && (
            <Card className="bg-purple-500/5 border-purple-500/15">
              <CardContent className="px-4 py-3">
                <p className="text-[11px] text-purple-300 italic leading-relaxed">&ldquo;{essence.filosofia_nucleo}&rdquo;</p>
                <p className="text-[10px] text-purple-400/60 mt-2">— {essence.agentica_como_guru}</p>
              </CardContent>
            </Card>
          )}

          <div className="space-y-2">
            {IOGUE_PRINCIPLES.map((p) => {
              const expanded = expandedPrinciple === p.id;
              const Icon = p.icon;
              return (
                <motion.div key={p.id} className="rounded-lg border border-zinc-800/50 overflow-hidden" style={{ backgroundColor: expanded ? `${p.color}08` : 'transparent' }}>
                  <button onClick={() => setExpandedPrinciple(expanded ? null : p.id)} className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${p.color}20`, border: `1px solid ${p.color}30` }}>
                      <Icon className="w-4 h-4" style={{ color: p.color }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-semibold text-zinc-200">{p.name}</div>
                      <div className="text-[10px] text-zinc-500">{p.chakra} &rarr; {p.algorithm}</div>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Badge className="text-[9px] border" variant="outline" style={{ backgroundColor: `${p.color}15`, color: p.color, borderColor: `${p.color}25` }}>{p.algorithm}</Badge>
                      {expanded ? <ChevronDown className="w-3.5 h-3.5 text-zinc-600" /> : <ChevronRight className="w-3.5 h-3.5 text-zinc-600" />}
                    </div>
                  </button>
                  {expanded && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="px-4 pb-3 pl-15">
                      <p className="text-[11px] text-zinc-400 leading-relaxed pl-11">{p.description}</p>
                      {essence?.principios_sabedoria && (
                        <div className="mt-2 pl-11">
                          <span className="text-[9px] text-zinc-600 uppercase tracking-wider">Filosofia:</span>
                          <p className="text-[10px] text-zinc-500 italic mt-0.5">{essence.principios_sabedoria[IOGUE_PRINCIPLES.findIndex(pp => pp.id === p.id)] ?? '—'}</p>
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>

          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Mapa Kundalini &rarr; Algoritmos</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3">
              <div className="flex flex-col gap-1">
                {IOGUE_PRINCIPLES.slice().reverse().map((p) => (
                  <div key={p.id} className="flex items-center gap-2">
                    <CircleDot className="w-2.5 h-2.5 flex-shrink-0" style={{ color: p.color }} />
                    <div className="flex-1 h-2 rounded-full overflow-hidden bg-zinc-800">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: p.color, width: '100%' }} initial={{ width: 0 }} animate={{ width: '100%' }} transition={{ duration: 0.8, delay: 0.1 * IOGUE_PRINCIPLES.indexOf(p) }} />
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
            <Input value={intentInput} onChange={(e) => setIntentInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleRoute()} placeholder="Digite uma intencao..." className="bg-zinc-900/50 border-zinc-800/50 text-xs h-8 text-zinc-200" />
            <Button size="sm" onClick={handleRoute} className="h-8 text-xs bg-purple-600 hover:bg-purple-700"><Search className="w-3 h-3 mr-1" /> Rotear</Button>
          </div>
          {routingResult && (
            <>
              <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Resultado</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  <Row label="Modelo" value={routingResult.modelo_selecionado} color="#a855f7" bold />
                  <Row label="Provedor" value={routingResult.provedor} color="#06b6d4" />
                  <Row label="Cascade" value={routingResult.cascade_match ?? 'Nenhum'} color="#10b981" />
                  <Row label="Latencia" value={`${routingResult.latencia_estimada_ms}ms`} color="#f97316" />
                  <Row label="Custo" value={`$${routingResult.custo_estimado_usd.toFixed(4)}/1M`} color="#eab308" />
                  <Row label="Local" value={routingResult.is_local ? 'Sim' : 'Nao'} color={routingResult.is_local ? '#10b981' : '#71717a'} />
                  <div className="pt-1 border-t border-zinc-800/50">
                    <Row label="Net Flow" value={String(routingResult.score_mcdm.score_total)} color="#a855f7" bold />
                    <Row label="Rank" value={`#${routingResult.score_mcdm.rank}`} color="#a855f7" bold />
                    <Row label="Phi+" value={String(routingResult.score_mcdm.phi_positivo)} color="#10b981" mono />
                    <Row label="Phi-" value={String(routingResult.score_mcdm.phi_negativo)} color="#ef4444" mono />
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-zinc-900/50 border-zinc-800/50">
                <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Detalhes MCDM</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3 space-y-2">
                  {Object.entries(routingResult.score_mcdm.detalhes).map(([k, v]) => (
                    <div key={k} className="space-y-0.5">
                      <div className="flex justify-between text-[10px]">
                        <span className="text-zinc-500 capitalize">{k.replace('_norm', '')}</span>
                        <span className="text-zinc-300 font-mono">{(v as number).toFixed(3)}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-zinc-800 overflow-hidden">
                        <motion.div className="h-full rounded-full bg-purple-500" initial={{ width: 0 }} animate={{ width: `${(v as number) * 100}%` }} transition={{ duration: 0.6 }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </motion.div>
      )}

      {/* ═══ SKILLS + GOVERNANCA ═══ */}
      {subTab === 'skills' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100">Execucao de Skills + Governanca</h2>
          </div>

          {/* Execute Skill */}
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Executar Skill</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label className="text-[9px] text-zinc-600 uppercase">Skill ID</label><Input value={skillId} onChange={e => setSkillId(e.target.value)} className="bg-zinc-800/50 border-zinc-700/50 text-[11px] h-7 mt-1 text-zinc-200" /></div>
                <div><label className="text-[9px] text-zinc-600 uppercase">Persona</label><Input value={personaId} onChange={e => setPersonaId(e.target.value)} className="bg-zinc-800/50 border-zinc-700/50 text-[11px] h-7 mt-1 text-zinc-200" /></div>
                <div className="flex items-end"><Button size="sm" onClick={handleSkill} className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 w-full"><Play className="w-3 h-3 mr-1" /> Executar</Button></div>
              </div>
              {skillResult && (
                <div className={`rounded-lg p-3 space-y-1 text-[10px] ${skillResult.sucesso ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}
                  >
                  <div className="flex items-center gap-1.5 font-semibold text-xs">{skillResult.sucesso ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}<span style={{ color: skillResult.sucesso ? '#10b981' : '#ef4444' }}>{skillResult.sucesso ? 'Sucesso' : 'Falha'}</span></div>
                  <Row label="Skill" value={skillResult.skill_id} color="#a855f7" mono />
                  {skillResult.sucesso && <><Row label="Modelo" value={skillResult.modelo_selecionado} color="#06b6d4" /><Row label="Tokens" value={String(skillResult.tokens_usados)} color="#10b981" /><Row label="Custo" value={`$${skillResult.custo_usd.toFixed(6)}`} color="#eab308" /><Row label="Latencia" value={`${skillResult.latencia_ms}ms`} color="#f97316" /></>}
                  {!skillResult.sucesso && (skillResult.resultado as Record<string, string>)?.erro && <p className="text-red-400 mt-1">{(skillResult.resultado as Record<string, string>).erro}</p>}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Execute Meta-Skill */}
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Executar Meta-Skill</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div><label className="text-[9px] text-zinc-600 uppercase">Meta-Skill</label><Input value={metaSkillId} onChange={e => setMetaSkillId(e.target.value)} className="bg-zinc-800/50 border-zinc-700/50 text-[11px] h-7 mt-1 text-zinc-200" /></div>
                <div><label className="text-[9px] text-zinc-600 uppercase">Persona</label><Input value={personaId} onChange={e => setPersonaId(e.target.value)} className="bg-zinc-800/50 border-zinc-700/50 text-[11px] h-7 mt-1 text-zinc-200" /></div>
                <div className="flex items-end"><Button size="sm" onClick={handleMetaSkill} className="h-7 text-[10px] bg-purple-600 hover:bg-purple-700 w-full"><Play className="w-3 h-3 mr-1" /> Executar</Button></div>
              </div>
              {metaResult && (
                <div className={`rounded-lg p-3 space-y-1 text-[10px] ${metaResult.sucesso ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-1.5 font-semibold text-xs">{metaResult.sucesso ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}<span style={{ color: metaResult.sucesso ? '#10b981' : '#ef4444' }}>{metaResult.sucesso ? 'Sucesso' : 'Falha'}</span></div>
                  <Row label="Total Tokens" value={String(metaResult.total_tokens)} color="#a855f7" />
                  <Row label="Total Custo" value={`$${metaResult.total_custo_usd.toFixed(6)}`} color="#eab308" />
                  <Row label="Total Latencia" value={`${metaResult.total_latencia_ms}ms`} color="#f97316" />
                  {metaResult.executionPlan.length > 0 && (
                    <div className="mt-2">
                      <span className="text-[9px] text-zinc-600 uppercase">Plano:</span>
                      <div className="flex gap-1 mt-1 flex-wrap">{metaResult.executionPlan.map((s, i) => (
                        <Badge key={i} className="text-[9px] bg-purple-500/10 text-purple-400 border-purple-500/20" variant="outline">#{s.order} {s.skillId}</Badge>
                      ))}</div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Governanca Check */}
          <Card className="bg-zinc-900/50 border-zinc-800/50">
            <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Governanca RBAC</CardTitle></CardHeader>
            <CardContent className="px-4 pb-3 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                <div><label className="text-[9px] text-zinc-600 uppercase">Persona</label><Input value={personaId} onChange={e => setPersonaId(e.target.value)} className="bg-zinc-800/50 border-zinc-700/50 text-[11px] h-7 mt-1 text-zinc-200" /></div>
                <div><label className="text-[9px] text-zinc-600 uppercase">Acao</label><Input value={govAcao} onChange={e => setGovAcao(e.target.value)} className="bg-zinc-800/50 border-zinc-700/50 text-[11px] h-7 mt-1 text-zinc-200" /></div>
                <div><label className="text-[9px] text-zinc-600 uppercase">Nivel Req.</label><Input value={govNivel} onChange={e => setGovNivel(e.target.value)} className="bg-zinc-800/50 border-zinc-700/50 text-[11px] h-7 mt-1 text-zinc-200" /></div>
                <div className="flex items-end"><Button size="sm" onClick={handleGov} className="h-7 text-[10px] bg-yellow-600 hover:bg-yellow-700 w-full"><Shield className="w-3 h-3 mr-1" /> Verificar</Button></div>
              </div>
              {govResult && (
                <div className={`rounded-lg p-3 space-y-1 text-[10px] ${govResult.autorizado ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-red-500/10 border border-red-500/20'}`}>
                  <div className="flex items-center gap-1.5 font-semibold text-xs">{govResult.autorizado ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <XCircle className="w-3.5 h-3.5 text-red-400" />}<span style={{ color: govResult.autorizado ? '#10b981' : '#ef4444' }}>{govResult.autorizado ? 'Autorizado' : 'Negado'}</span></div>
                  <Row label="Nivel" value={`${govResult.rbac_nivel} → ${govResult.rbac_nivel_requerido}`} color="#a855f7" />
                  {!govResult.autorizado && govResult.motivo && <p className="text-red-400">{govResult.motivo}</p>}
                  {govResult.rate_limit_info && <Row label="Rate Limit" value={`${govResult.rate_limit_info.remaining}/${govResult.rate_limit_info.limit_per_min} restante`} color="#06b6d4" />}
                  {govResult.budget_info && <Row label="Budget" value={`${govResult.budget_info.restante_usd.toFixed(2)} restante (${govResult.budget_info.pct_usado.toFixed(1)}%)`} color="#eab308" />}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* ═══ PROGRESSO ═══ */}
      {subTab === 'progresso' && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-purple-400" />
            <h2 className="text-sm font-bold text-zinc-100">Progresso do Discipulo</h2>
          </div>
          <div className="flex gap-2 items-end">
            <div className="flex-1"><label className="text-[9px] text-zinc-600 uppercase">Persona ID</label><Input value={personaId} onChange={e => setPersonaId(e.target.value)} className="bg-zinc-900/50 border-zinc-800/50 text-xs h-8 text-zinc-200" /></div>
            <Button size="sm" onClick={loadProgress} className="h-8 text-xs bg-purple-600 hover:bg-purple-700"><RefreshCw className="w-3 h-3 mr-1" /> Buscar</Button>
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
                <CardHeader className="pb-2 pt-3 px-4"><CardTitle className="text-xs font-semibold text-zinc-300">Trilha de Aprendizagem</CardTitle></CardHeader>
                <CardContent className="px-4 pb-3 space-y-3">
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-500">Modulo Atual</span>
                      <span className="text-zinc-300">{progressData.modulo_atual || '—'}</span>
                    </div>
                    <div className="h-2 rounded-full bg-zinc-800 overflow-hidden">
                      <motion.div className="h-full rounded-full" style={{ backgroundColor: '#a855f7' }} initial={{ width: 0 }} animate={{ width: `${progressData.progresso_pct}%` }} transition={{ duration: 0.8 }} />
                    </div>
                    <div className="flex justify-between text-[10px]">
                      <span className="text-zinc-600">{progressData.modulo_index}/{progressData.total_modulos} modulos</span>
                      <span className="text-zinc-600">{progressData.total_interacoes} interacoes</span>
                    </div>
                  </div>
                  <Row label="Certificacao" value={progressData.certificacao_atual || 'Nenhuma'} color="#eab308" />
                  <div className="pt-2 border-t border-zinc-800/50">
                    <div className="flex items-start gap-2 text-[11px] text-purple-400">
                      <Compass className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" /><span>{progressData.proxima_acao}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card className="bg-zinc-900/50 border-zinc-800/50">
              <CardContent className="px-4 py-8 text-center"><p className="text-xs text-zinc-500">Nenhum progresso disponivel para esta persona</p></CardContent>
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

function Row({ label, value, color, bold, mono }: { label: string; value: string; color: string; bold?: boolean; mono?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className="text-[10px] text-zinc-500">{label}</span>
      <span className={`text-[11px] ${bold ? 'font-bold ' : ''}${mono ? 'font-mono ' : ''}`} style={{ color }}>{value}</span>
    </div>
  );
}

function NucleoBlock({ label, items, color }: { label: string; items: string[]; color: string }) {
  return (
    <div className="rounded-lg border border-zinc-800/50 bg-zinc-900/30 p-3">
      <div className="text-[10px] font-semibold mb-1.5" style={{ color }}>{label}</div>
      {items.map((item, i) => <div key={i} className="text-[10px] text-zinc-400">{item}</div>)}
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
