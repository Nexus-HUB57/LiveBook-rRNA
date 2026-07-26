/**
 * LIVE LAB TRI-NUCLEAR — Orchestrator Engine v2.0
 * Alinhado com a estrutura real do manifesto (skills, trilhas_aprendizagem, exemplos_fluxos)
 */

import { LIVE_LAB_MANIFESTO } from './manifesto';
import type { LiveLabModel, Persona, Skill, WorkflowHibrido } from './types';

/** Normaliza acesso as skills (unifica atomicas + meta) */
function getAllSkills(): (Skill | Record<string, unknown>)[] {
  const prod = LIVE_LAB_MANIFESTO.nucleo_produtividade;
  return [...(prod.skills || []), ...(prod.meta_skills || [])];
}

/** Normaliza acesso as trilhas */
function getTrilhas() {
  return LIVE_LAB_MANIFESTO.nucleo_ecossistema?.trilhas_aprendizagem || [];
}

/** Normaliza acesso aos workflows */
function getWorkflows(): WorkflowHibrido[] {
  const wf = LIVE_LAB_MANIFESTO.workflows_hibridos;
  if (Array.isArray(wf)) return wf;
  return wf?.exemplos_fluxos || [];
}

/** Route an intention string to the best-fit LLM */
export function routeToModel(intencao: string): LiveLabModel {
  const algo = LIVE_LAB_MANIFESTO.nucleo_agregador.algoritmo_roteamento as {
    cascata?: { regra: string; modelo_primario: string; fallback?: string[]; latencia_maxima_ms?: number }[];
  };
  const cascata = algo?.cascata || [];

  for (const rule of cascata) {
    const keyword = rule.regra.split('/')[0].toLowerCase();
    if (intencao.toLowerCase().includes(keyword)) {
      const model = LIVE_LAB_MANIFESTO.nucleo_agregador.modelos.find(m => m.id === rule.modelo_primario);
      if (model) return model;
    }
  }

  return LIVE_LAB_MANIFESTO.nucleo_agregador.modelos.reduce((best, curr) =>
    curr.peso_roteamento > best.peso_roteamento ? curr : best
  );
}

/** Execute a skill by ID */
export function executeSkill(
  skillId: string,
  input: Record<string, unknown>,
  persona: Persona
): { sucesso: boolean; resultado: Record<string, unknown>; tokens_usados: number } {
  const allSkills = getAllSkills();
  const skill = allSkills.find(s => s.id === skillId);

  if (!skill) {
    return { sucesso: false, resultado: { erro: 'Skill nao encontrada: ' + skillId }, tokens_usados: 0 };
  }

  const tokens_usados = Math.floor(Math.random() * 500) + 100;
  return {
    sucesso: true,
    resultado: {
      skill: skillId,
      dominio: (skill as Skill).dominio,
      input,
      status: 'executado',
      executor: persona.nome,
      timestamp: new Date().toISOString(),
    },
    tokens_usados,
  };
}

/** Evaluate a module completion */
export function evaluateModulo(
  moduloId: string,
  _resultado?: unknown
): { aprovado: boolean; pontuacao: number; feedback: string } {
  for (const trilha of getTrilhas()) {
    const mod = trilha.modulos?.find(m => m.id === moduloId);
    if (mod) {
      const pontuacao = Math.floor(Math.random() * 30) + 70;
      const minima = (mod.criterios_aprovacao?.taxa_acerto_minima as number) || 70;
      const aprovado = pontuacao >= minima;
      let feedback: string;
      if (pontuacao >= 90) feedback = 'Excelente dominio do modulo. Pronto para avancar.';
      else if (pontuacao >= 70) feedback = 'Bom desempenho. Revise os pontos de atencao antes de avancar.';
      else feedback = 'Necessita mais pratica. Revisar conteudo teorico e refazer labs.';
      return { aprovado, pontuacao, feedback };
    }
  }
  return { aprovado: false, pontuacao: 0, feedback: 'Modulo nao encontrado: ' + moduloId };
}

/** Get persona learning progress */
export function getPersonaProgress(personaId: string) {
  const persona = LIVE_LAB_MANIFESTO.personas.find(p => p.id === personaId);
  if (!persona) return null;

  const trilha = persona.trilha_ativa
    ? getTrilhas().find(t => t.id === persona.trilha_ativa)
    : null;

  return {
    nome: persona.nome,
    perfil: persona.papel,
    trilha: persona.trilha_ativa || 'Nenhuma',
    modulo: persona.certificacao_atual || 0,
    totalModulos: trilha?.modulos?.length || 0,
    progresso: trilha ? Math.round(((persona.certificacao_atual ? 1 : 0) / (trilha.modulos?.length || 1)) * 100) : 0,
    totalInteracoes: persona.historico_interacoes.length,
    budgetRestante: 0,
  };
}

/** Get overall Live Lab stats */
export function getLiveLabStats() {
  const prod = LIVE_LAB_MANIFESTO.nucleo_produtividade;
  const eco = LIVE_LAB_MANIFESTO.nucleo_ecossistema;
  return {
    modelos: LIVE_LAB_MANIFESTO.nucleo_agregador.modelos.length,
    skills: (prod.skills || []).length,
    metaSkills: (prod.meta_skills || []).length,
    trilhas: eco?.trilhas_aprendizagem?.length || 0,
    workflows: getWorkflows().length,
    personas: LIVE_LAB_MANIFESTO.personas.length,
    certificacoes: Object.keys(eco?.certificacoes || {}).length,
  };
}
