/**
 * LIVE LAB — Orchestrator v3.0 (Guru-Interior)
 *
 * O orquestrador e o "guru interior" do ecossistema — nao impoe, desperta.
 * Nao controla, orquestra. Cada funcao espelha um aspecto do caminho do discipulo.
 */

import { LIVE_LAB_MANIFESTO, AGENTICA_AI } from './manifesto';
import { routeIntent, matchSkill, composeMetaSkill, TokenBucket, BudgetTracker, rbacCheck } from './algorithms';
import type { RoutingResult, SkillResult, MetaSkillResult, ModuloResult, PersonaProgress, LiveLabStats, Skill, MetaSkill, IogueEssence } from './types';

export const rateLimiter = new TokenBucket(60, 60 / 60000); // 60 tokens, refill ~1/min
export const budgetTracker = new BudgetTracker();
export const RBAC_LEVELS = ['basic', 'intermediate', 'advanced', 'admin'] as const;

const M = LIVE_LAB_MANIFESTO;

function allSkills(): Skill[] {
  return [...(M.nucleo_produtividade.skills || []), ...(M.nucleo_produtividade.meta_skills || [])];
}
function findSkillById(skillId: string): Skill | undefined {
  return allSkills().find(s => s.id === skillId);
}
function findModelo(modeloId: string) {
  return M.nucleo_agregador.modelos.find(m => m.id === modeloId);
}
function findModulo(moduloId: string) {
  for (const trilha of M.nucleo_ecossistema.trilhas_aprendizagem) {
    const mod = trilha.modulos.find(m => m.id === moduloId);
    if (mod) return { trilha, modulo: mod };
  }
  return null;
}

export function getRoutingResult(intent: string): RoutingResult {
  const result = routeIntent(intent, M.nucleo_agregador.modelos, M.nucleo_agregador.algoritmo_roteamento);
  return { ...result, agente: AGENTICA_AI.id, intencao: intent.length > 100 ? intent.slice(0, 100) + '\u2026' : intent, timestamp: new Date().toISOString() };
}

export function executeSkill(skillId: string, input: Record<string, unknown>, personaId: string): SkillResult {
  const skill = findSkillById(skillId);
  if (!skill) return { sucesso: false, skill_id: skillId, modelo_selecionado: '', tokens_usados: 0, custo_usd: 0, latencia_ms: 0, resultado: { erro: `Skill '${skillId}' nao encontrada` } };
  const persona = M.personas.find(p => p.id === personaId);
  if (persona && !rbacCheck(persona.nivel_acesso_rbac, skill.rbac_permissoes[0] || 'basic', [...RBAC_LEVELS]))
    return { sucesso: false, skill_id: skillId, modelo_selecionado: '', tokens_usados: 0, custo_usd: 0, latencia_ms: 0, resultado: { erro: 'RBAC: nivel insuficiente' } };
  const modelo = skill.modelo_preferido ? findModelo(skill.modelo_preferido) : findModelo(getRoutingResult(`executar ${skillId}`).modelo_selecionado);
  if (!modelo) return { sucesso: false, skill_id: skillId, modelo_selecionado: '', tokens_usados: 0, custo_usd: 0, latencia_ms: 0, resultado: { erro: 'Nenhum modelo disponivel' } };
  const tokens = skill.tokens_estimados || 1000;
  const custo_usd = modelo.custo_por_1m_tokens.entrada_usd * (tokens / 1_000_000);
  budgetTracker.recordUsage(personaId, custo_usd);
  return { sucesso: true, skill_id: skillId, modelo_selecionado: modelo.id, tokens_usados: tokens, custo_usd, latencia_ms: modelo.latencia_media_ms, resultado: { dominio: skill.dominio, input, executor: persona?.nome || 'anonimo', timestamp: new Date().toISOString() } };
}

export function executeMetaSkill(metaSkillId: string, input: Record<string, unknown>, personaId: string): MetaSkillResult {
  const metaSkill = M.nucleo_produtividade.meta_skills.find(ms => ms.id === metaSkillId);
  if (!metaSkill) return { sucesso: false, meta_skill_id: metaSkillId, resultados: [], total_tokens: 0, total_custo_usd: 0, total_latencia_ms: 0, execution_plan: [] };
  const persona = M.personas.find(p => p.id === personaId);
  if (persona && !rbacCheck(persona.nivel_acesso_rbac, metaSkill.rbac_permissoes[0] || 'basic', [...RBAC_LEVELS]))
    return { sucesso: false, meta_skill_id: metaSkillId, resultados: [{ sucesso: false, skill_id: metaSkillId, modelo_selecionado: '', tokens_usados: 0, custo_usd: 0, latencia_ms: 0, resultado: { erro: 'RBAC: nivel insuficiente para meta-skill' } }], total_tokens: 0, total_custo_usd: 0, total_latencia_ms: 0, execution_plan: [] };
  const plan = composeMetaSkill(metaSkill as MetaSkill, M.nucleo_produtividade.skills);
  if (plan.hasCycle) return { sucesso: false, meta_skill_id: metaSkillId, resultados: [], total_tokens: 0, total_custo_usd: 0, total_latencia_ms: 0, execution_plan: plan.execution_plan };
  const resultados: SkillResult[] = [];
  let total_tokens = 0; let total_custo = 0; let total_lat = 0;
  for (const step of plan.executionPlan) {
    const r = executeSkill(step.skillId, input, personaId);
    resultados.push(r);
    total_tokens += r.tokens_usados; total_custo += r.custo_usd; total_lat += r.latencia_ms;
    if (!r.sucesso) return { sucesso: false, meta_skill_id: metaSkillId, resultados, total_tokens, total_custo_usd: total_custo, total_latencia_ms: total_lat, execution_plan: plan.execution_plan };
  }
  return { sucesso: true, meta_skill_id: metaSkillId, resultados, total_tokens, total_custo_usd: total_custo, total_latencia_ms: total_lat, execution_plan: plan.execution_plan };
}

export function evaluateModulo(moduloId: string, _score?: number): ModuloResult {
  const match = findModulo(moduloId);
  if (!match) return { modulo_id: moduloId, aprovado: false, pontuacao: 0, pontuacao_minima: 0, feedback: `Modulo '${moduloId}' nao encontrado`, modelo_usado: '' };
  const { modulo } = match;
  const score = _score ?? Math.floor(Math.random() * 24) + 72;
  const min = modulo.criterios_aprovacao.taxa_acerto_minima;
  const feedback = score >= 90 ? 'Excelente dominio do modulo.' : score >= min ? 'Bom desempenho. Revise pontos de atencao.' : 'Necessita mais pratica. Revisar conteudo.';
  return { modulo_id: moduloId, aprovado: score >= min, pontuacao: score, pontuacao_minima: min, feedback, modelo_usado: modulo.modelo_recomendado };
}

export function getPersonaProgress(personaId: string): PersonaProgress | null {
  const persona = M.personas.find(p => p.id === personaId);
  if (!persona) return null;
  const trilha = M.nucleo_ecossistema.trilhas_aprendizagem.find(t => t.id === persona.trilha_ativa);
  if (!trilha) return { persona_id: personaId, nome: persona.nome, perfil: persona.papel, trilha: 'Nenhuma', modulo_atual: '', modulo_index: 0, total_modulos: 0, progresso_pct: 0, total_interacoes: persona.historico_interacoes.length, certificacao_atual: persona.certificacao_atual, proxima_acao: 'Nenhuma trilha ativa.' };
  const modIdx = persona.certificacao_atual ? 1 : 0;
  const total = trilha.modulos.length;
  const proxima_acao = modIdx >= total ? `Trilha '${trilha.nome}' concluida!` : `Proximo: ${trilha.modulos[modIdx].titulo}`;
  return { persona_id: personaId, nome: persona.nome, perfil: persona.papel, trilha: trilha.nome, modulo_atual: trilha.modulos[modIdx]?.id || '', modulo_index: modIdx, total_modulos: total, progresso_pct: total > 0 ? Math.round((modIdx / total) * 100) : 0, total_interacoes: persona.historico_interacoes.length, certificacao_atual: persona.certificacao_atual, proxima_acao };
}

export function getLiveLabStats(): LiveLabStats {
  const prod = M.nucleo_produtividade;
  const eco = M.nucleo_ecossistema;
  const wf = M.workflows_hibridos?.exemplos_fluxos || [];
  const dominios = [...new Set(allSkills().map(s => s.dominio))];
  return { versao: M.versao, agente: AGENTICA_AI.nome, agente_versao: AGENTICA_AI.versao, modelos: M.nucleo_agregador.modelos.length, skills: (prod.skills || []).length, metaSkills: (prod.meta_skills || []).length, trilhas: eco.trilhas_aprendizagem.length, total_modulos: eco.trilhas_aprendizagem.reduce((a, t) => a + t.modulos.length, 0), workflows: wf.length, personas: M.personas.length, certificacoes: Object.keys(eco.certificacoes || {}).length, dominios_skill: dominios, trilhas_nomes: eco.trilhas_aprendizagem.map(t => t.nome) };
}

export function getIogueEssence(): IogueEssence | null {
  return M.essencia_iogue ?? null;
}
