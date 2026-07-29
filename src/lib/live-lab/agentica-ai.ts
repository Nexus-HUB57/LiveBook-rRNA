/**
 * LIVE LAB — Agentica AI v3.0 (Arquiteta-Cognitiva)
 * Sete funcoes como sete chakras da Kundalini, mais duas de sabedoria.
 */
import { LIVE_LAB_MANIFESTO, AGENTICA_AI } from './manifesto';
import { getRoutingResult, executeSkill, executeMetaSkill, evaluateModulo, getPersonaProgress, getLiveLabStats, getIogueEssence, rateLimiter, budgetTracker, RBAC_LEVELS } from './orchestrator';
import type { DiagnosticoEcosystem, RoutingResult, SkillResult, MetaSkillResult, ModuloResult, PersonaProgress, LiveLabStats, GovernancaCheck, RateLimitTier, IogueEssence } from './types';

const M = LIVE_LAB_MANIFESTO;

export function agenticaDiagnose(): DiagnosticoEcosystem {
  const modelos = M.nucleo_agregador.modelos.length;
  const skills = (M.nucleo_produtividade.skills || []).length;
  const metaSkills = (M.nucleo_produtividade.meta_skills || []).length;
  const trilhas = M.nucleo_ecossistema.trilhas_aprendizagem.length;
  const totalModulos = M.nucleo_ecossistema.trilhas_aprendizagem.reduce((a, t) => a + t.modulos.length, 0);
  const workflows = (M.workflows_hibridos?.exemplos_fluxos || []).length;
  const personas = M.personas.length;
  const certs = Object.keys(M.nucleo_ecossistema.certificacoes || {}).length;
  const gov = M.politicas_governanca;
  const hasIogue = !!M.essencia_iogue;
  const alertas: string[] = [];
  if (modelos < 8) alertas.push(`Apenas ${modelos} modelos (<8 recomendado)`);
  if (skills < 10) alertas.push(`Apenas ${skills} skills (<10 recomendado)`);
  if (trilhas < 4) alertas.push(`Apenas ${trilhas} trilhas (<4 recomendado)`);
  if (!hasIogue) alertas.push('Essencia Iogue nao encontrada no manifesto');
  return {
    agente: AGENTICA_AI,
    integridade: { manifesto_valido: !!(M.versao && M.visao_executiva), typecheck: (modelos + skills + trilhas) > 0 ? 'PASS' : 'FAIL', modelos_count: modelos, skills_count: skills, meta_skills_count: metaSkills, trilhas_count: trilhas, workflows_count: workflows, personas_count: personas, certificacoes_count: certs, iogue_essence: hasIogue },
    nucleos: { n1_modelos: modelos, n2_skills: skills, n2_meta_skills: metaSkills, n3_trilhas: trilhas, n3_total_modulos: totalModulos, n3_certificacoes: certs },
    governanca: { rate_limit_ativo: !!gov.rate_limiting && Object.keys(gov.rate_limiting).length > 0, budget_tracking_ativo: !!gov.budget_tracking && Object.keys(gov.budget_tracking).length > 0, pii_masking_ativo: !!gov.privacidade_e_pii && (gov.privacidade_e_pii.campos_regex || []).length > 0, regex_count: (gov.privacidade_e_pii?.campos_regex || []).length, tiers_count: Object.keys(gov.rate_limiting || {}).length },
    routing: { algoritmo: M.nucleo_agregador.algoritmo_roteamento.tipo, cascade_rules: M.nucleo_agregador.algoritmo_roteamento.cascata.length, pesos_mcdm: M.nucleo_agregador.algoritmo_roteamento.pesos_mcdm },
    alertas, timestamp: new Date().toISOString(),
  };
}

export function agenticaRoute(intent: string): RoutingResult { return getRoutingResult(intent); }
export async function agenticaExecuteSkill(skillId: string, input: Record<string, unknown>, personaId: string): Promise<SkillResult> { return executeSkill(skillId, input, personaId); }
export async function agenticaExecuteMetaSkill(metaSkillId: string, input: Record<string, unknown>, personaId: string): Promise<MetaSkillResult> { return executeMetaSkill(metaSkillId, input, personaId); }
export async function agenticaEvaluateModulo(moduloId: string): Promise<ModuloResult> { return evaluateModulo(moduloId); }
export function agenticaProgress(personaId: string): PersonaProgress | null { return getPersonaProgress(personaId); }
export function agenticaStats(): LiveLabStats { return getLiveLabStats(); }
export function agenticaIogueEssence(): IogueEssence | null { return getIogueEssence(); }

export function agenticaGovernanca(personaId: string, acao: string, nivelRequerido: string): GovernancaCheck {
  const persona = M.personas.find(p => p.id === personaId);
  if (!persona) return { autorizado: false, rbac_nivel: 'unknown', rbac_nivel_requerido: nivelRequerido, acao, motivo: `Persona '${personaId}' nao encontrada` };
  const levels: string[] = [...RBAC_LEVELS];
  const pIdx = levels.indexOf(persona.nivel_acesso_rbac as string);
  const rIdx = levels.indexOf(nivelRequerido as string);
  if (pIdx < 0 || rIdx < 0 || pIdx < rIdx) return { autorizado: false, rbac_nivel: persona.nivel_acesso_rbac, rbac_nivel_requerido: nivelRequerido, acao, motivo: `Nivel '${persona.nivel_acesso_rbac}' insuficiente para '${nivelRequerido}'` };
  const tier: RateLimitTier = (M.politicas_governanca.rate_limiting as Record<string, RateLimitTier>)[persona.nivel_acesso_rbac] || { req_per_min: 10, req_per_hour: 100, req_per_day: 500 };
  const allowed = rateLimiter.consume(personaId);
  if (!allowed) return { autorizado: false, rbac_nivel: persona.nivel_acesso_rbac, rbac_nivel_requerido: nivelRequerido, acao, motivo: 'Rate limit excedido', rate_limit_info: { used_per_min: tier.req_per_min, limit_per_min: tier.req_per_min, remaining: 0, reset_ms: 60000 } };
  const rlState = rateLimiter.getState(personaId);
  const budget = budgetTracker.getUsage(personaId);
  const budgetLimit = ((M.politicas_governanca.budget_tracking as Record<string, { usd_mes: number }>)[persona.nivel_acesso_rbac]?.usd_mes) || 0;
  return { autorizado: true, rbac_nivel: persona.nivel_acesso_rbac, rbac_nivel_requerido: nivelRequerido, acao, rate_limit_info: { used_per_min: Math.round(tier.req_per_min - rlState.tokens), limit_per_min: tier.req_per_min, remaining: Math.round(rlState.tokens), reset_ms: 60000 }, budget_info: budget ? { usado_usd: budget.usado_usd, limite_usd: budgetLimit, restante_usd: Math.max(0, budgetLimit - budget.usado_usd), pct_usado: budgetLimit > 0 ? (budget.usado_usd / budgetLimit) * 100 : 0 } : undefined };
}