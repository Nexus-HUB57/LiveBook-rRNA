/**
 * ═══════════════════════════════════════════════════════════════
 * LIVE LAB TRI-NUCLEAR — Orchestrator Engine
 * ═══════════════════════════════════════════════════════════════
 */

import { LIVE_LAB_MANIFESTO } from './manifesto';
import type { LiveLabModel, Persona } from './types';

/** Route an intention string to the best-fit LLM using cascade rules + weight fallback */
export function routeToModel(intencao: string): LiveLabModel {
  const algo = LIVE_LAB_MANIFESTO.nucleo_agregador.algoritmo_roteamento as {
    cascata?: { regra: string; modelo_primario: string; fallback?: string[]; latencia_maxima_ms?: number }[];
    ponderacao?: string;
  };
  const cascata = algo.cascata || [];

  for (const rule of cascata) {
    const keyword = rule.regra.split('/')[0].toLowerCase();
    if (intencao.toLowerCase().includes(keyword)) {
      const model = LIVE_LAB_MANIFESTO.nucleo_agregador.modelos.find(m => m.id === rule.modelo_primario);
      if (model) return model;
    }
  }

  // Fallback: pick highest-weight model
  return LIVE_LAB_MANIFESTO.nucleo_agregador.modelos.reduce((best, curr) =>
    curr.peso_roteamento > best.peso_roteamento ? curr : best
  );
}

/** Simulate executing a skill */
export function executeSkill(
  skillId: string,
  input: Record<string, unknown>,
  persona: Persona
): { sucesso: boolean; resultado: Record<string, unknown>; tokens_usados: number } {
  const allSkills = [
    ...LIVE_LAB_MANIFESTO.nucleo_produtividade.skills_atomicas,
    ...LIVE_LAB_MANIFESTO.nucleo_produtividade.meta_skills,
  ];
  const skill = allSkills.find(s => s.id === skillId);

  if (!skill) {
    return { sucesso: false, resultado: { erro: 'Skill nao encontrada: ' + skillId }, tokens_usados: 0 };
  }

  const tokens_usados = Math.floor(Math.random() * 500) + 100;
  return {
    sucesso: true,
    resultado: {
      skill: skillId,
      dominio: skill.dominio,
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
  for (const trilha of LIVE_LAB_MANIFESTO.nucleo_ecossistema.trilhas) {
    const mod = trilha.modulos.find(m => m.id === moduloId);
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
    ? LIVE_LAB_MANIFESTO.nucleo_ecossistema.trilhas.find(t => t.id === persona.trilha_ativa)
    : null;

  return {
    nome: persona.nome,
    perfil: persona.perfil,
    trilha: persona.trilha_ativa || 'Nenhuma',
    modulo: persona.modulo_atual,
    totalModulos: trilha?.modulos.length || 0,
    progresso: trilha ? Math.round((persona.modulo_atual / trilha.modulos.length) * 100) : 0,
    totalInteracoes: persona.historico_interacoes.length,
    budgetRestante: persona.budget_diario_tokens,
  };
}

/** Get overall Live Lab stats */
export function getLiveLabStats() {
  return {
    modelos: LIVE_LAB_MANIFESTO.nucleo_agregador.modelos.length,
    skills: LIVE_LAB_MANIFESTO.nucleo_produtividade.skills_atomicas.length,
    metaSkills: LIVE_LAB_MANIFESTO.nucleo_produtividade.meta_skills.length,
    trilhas: LIVE_LAB_MANIFESTO.nucleo_ecossistema.trilhas.length,
    workflows: LIVE_LAB_MANIFESTO.workflows_hibridos.length,
    personas: LIVE_LAB_MANIFESTO.personas.length,
    certificacoes: Object.keys(LIVE_LAB_MANIFESTO.nucleo_ecossistema.certificacoes).length,
  };
}