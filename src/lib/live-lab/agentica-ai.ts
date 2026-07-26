/**
 * AGENTICA AI — Arquiteta-Cognitiva do Live Lab Tri-Nuclear
 * Funcoes de orquestracao avancada com diagnostico, routing
 * inteligente e governanca RBAC em tempo real.
 */

import { LIVE_LAB_MANIFESTO, AGENTICA_AI } from './manifesto';
import { routeToModel, executeSkill, evaluateModulo, getPersonaProgress, getLiveLabStats } from './orchestrator';
import type { Persona, Skill } from './types';

/* ── Tipos exportados ── */

export interface AgenticaDiagnostico {
  agente: typeof AGENTICA_AI;
  integridade: {
    typecheck: string;
    manifesto_valido: boolean;
    modelos_count: number;
    skills_count: number;
    trilhas_count: number;
  };
  ecossistema: {
    modelos_por_categoria: Record<string, number>;
    dominios_skill: string[];
    trilhas_nomes: string[];
    governanca: {
      rate_limit_ativo: boolean;
      budget_tracking_ativo: boolean;
      pii_masking_ativo: boolean;
    };
  };
  alertas: string[];
}

export interface AgenticaSkillResult {
  sucesso: boolean;
  skill_id: string;
  modelo_selecionado: string;
  tokens_usados: number;
  resultado: Record<string, unknown>;
}

export interface AgenticaModuloResult {
  modulo_id: string;
  aprovado: boolean;
  pontuacao: number;
  feedback: string;
}

export interface AgenticaPersonaProgress {
  persona_id: string;
  nome: string;
  perfil: string;
  trilha: string;
  progresso: number;
  total_interacoes: number;
}

export interface AgenticaGovernancaCheck {
  autorizado: boolean;
  rbac_nivel: string;
  acao: string;
  motivo?: string;
}

/* ── Helpers internos ── */

function getAllSkills(): (Skill | Record<string, unknown>)[] {
  const prod = LIVE_LAB_MANIFESTO.nucleo_produtividade;
  return [...(prod.skills || []), ...(prod.meta_skills || [])];
}

function getTrilhas() {
  return LIVE_LAB_MANIFESTO.nucleo_ecossistema?.trilhas_aprendizagem || [];
}

function getWorkflows() {
  const wf = LIVE_LAB_MANIFESTO.workflows_hibridos;
  if (Array.isArray(wf)) return wf;
  return wf?.exemplos_fluxos || [];
}

/* ── Funcoes publicas ── */

/** Diagnostico completo do ecossistema */
export function agenticaDiagnose(): AgenticaDiagnostico {
  const modelos = LIVE_LAB_MANIFESTO.nucleo_agregador.modelos;
  const skills = getAllSkills();
  const trilhas = getTrilhas();
  const gov = LIVE_LAB_MANIFESTO.politicas_governanca;

  const dominios = [...new Set(skills.map(s => (s as Skill).dominio).filter(Boolean))];
  const alertas: string[] = [];

  if (modelos.length < 8) alertas.push('Agregadores: menos de 8 modelos');
  if (skills.length < 15) alertas.push('Produtividade: menos de 15 skills');
  if (trilhas.length < 4) alertas.push('Ecossistema: menos de 4 trilhas');

  return {
    agente: AGENTICA_AI,
    integridade: {
      typecheck: modelos.length > 0 && skills.length > 0 ? 'PASS' : 'FAIL',
      manifesto_valido: !!(LIVE_LAB_MANIFESTO.versao && LIVE_LAB_MANIFESTO.visao_executiva),
      modelos_count: modelos.length,
      skills_count: skills.length,
      trilhas_count: trilhas.length,
    },
    ecossistema: {
      modelos_por_categoria: { total: modelos.length },
      dominios_skill: dominios,
      trilhas_nomes: trilhas.map(t => t.nome),
      governanca: {
        rate_limit_ativo: !!gov?.rate_limiting,
        budget_tracking_ativo: !!gov?.budget_tracking,
        pii_masking_ativo: !!gov?.privacidade_e_pii,
      },
    },
    alertas,
  };
}

/** Routing com logging Agentica */
export function agenticaRoute(intencao: string) {
  const modelo = routeToModel(intencao);
  return {
    agente: AGENTICA_AI.id,
    intencao: intencao.substring(0, 100),
    modelo_selecionado: modelo.id,
    provedor: modelo.provedor,
    latencia_estimada_ms: modelo.latencia_media_ms,
    custo_estimado_usd: modelo.custo_por_1m_tokens.entrada_usd / 1000,
  };
}

/** Executar skill com routing automatico */
export function agenticaExecuteSkill(
  skillId: string,
  input: Record<string, unknown>,
  persona: Persona
): AgenticaSkillResult {
  const modelo = routeToModel(input.intencao as string || `executar ${skillId}`);
  const result = executeSkill(skillId, input, persona);
  return {
    sucesso: result.sucesso,
    skill_id: skillId,
    modelo_selecionado: modelo.id,
    tokens_usados: result.tokens_usados,
    resultado: result.resultado,
  };
}

/** Avaliar modulo com feedback Agentica */
export function agenticaEvaluateModulo(moduloId: string): AgenticaModuloResult {
  const result = evaluateModulo(moduloId);
  return {
    modulo_id: moduloId,
    aprovado: result.aprovado,
    pontuacao: result.pontuacao,
    feedback: result.feedback,
  };
}

/** Progresso da persona via Agentica */
export function agenticaProgress(personaId: string): AgenticaPersonaProgress | null {
  const progress = getPersonaProgress(personaId);
  if (!progress) return null;
  return {
    persona_id: personaId,
    nome: progress.nome,
    perfil: progress.perfil,
    trilha: progress.trilha,
    progresso: progress.progresso,
    total_interacoes: progress.totalInteracoes,
  };
}

/** Stats enriquecidos pelo Agentica */
export function agenticaStats() {
  const base = getLiveLabStats();
  return {
    ...base,
    total_skills: base.skills + base.metaSkills,
    versao: LIVE_LAB_MANIFESTO.versao,
    agente: AGENTICA_AI.nome,
    agente_versao: AGENTICA_AI.versao,
    workflows: getWorkflows().length,
    certificacoes: Object.keys(LIVE_LAB_MANIFESTO.nucleo_ecossistema?.certificacoes || {}).length,
  };
}

/** Verificacao de governanca RBAC */
export function agenticaGovernanca(
  personaId: string,
  acao: string,
  nivel_requerido: string
): AgenticaGovernancaCheck {
  const persona = LIVE_LAB_MANIFESTO.personas.find(p => p.id === personaId);
  if (!persona) {
    return { autorizado: false, rbac_nivel: 'unknown', acao, motivo: 'Persona nao encontrada' };
  }

  const gov = LIVE_LAB_MANIFESTO.politicas_governanca;
  const rateLimits = gov?.rate_limiting;

  // Simulacao simplificada de RBAC
  const niveis = ['basic', 'intermediate', 'advanced', 'admin'];
  const nivelPersona = niveis.indexOf((persona.nivel_acesso_rbac || 'basic').toLowerCase());
  const nivelReq = niveis.indexOf(nivel_requerido.toLowerCase());

  const autorizado = nivelPersona >= nivelReq;
  return {
    autorizado,
    rbac_nivel: persona.nivel_acesso_rbac,
    acao,
    motivo: autorizado ? undefined : `Nivel ${persona.nivel_acesso_rbac} insuficiente para ${nivel_requerido}`,
  };
}
