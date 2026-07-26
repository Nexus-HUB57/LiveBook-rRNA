/**
 * ═══════════════════════════════════════════════════════════════
 * LIVE LAB TRI-NUCLEAR — Type Definitions
 * ═══════════════════════════════════════════════════════════════
 */

export interface LiveLabModel {
  id: string;
  provedor: string;
  contexto_tokens: number;
  custo_por_1m_tokens: {
    entrada_usd: number;
    saida_usd: number;
  };
  latencia_media_ms: number;
  peso_roteamento: number;
  casos_uso_prioritarios: string[];
  formato_api?: string;
}

export interface Skill {
  id: string;
  nome: string;
  dominio: string;
  trigger: string;
  rbac_nivel: string;
  entrada_schema: Record<string, unknown>;
  saida_schema: Record<string, unknown>;
  criticidade: string;
  descricao: string;
}

export interface MetaSkill extends Skill {
  skills_compostas: string[];
  ordem_execucao: string;
}

export interface ModuloEducacional {
  id: string;
  titulo: string;
  descricao: string;
  skills_exigidas: string[];
  modelo_recomendado: string;
  criterios_aprovacao: Record<string, number>;
  conteudo_teorico: string;
}

export interface TrilhaAprendizagem {
  id: string;
  nome: string;
  descricao: string;
  modulos: ModuloEducacional[];
  certificacao: {
    nivel: string;
    requisitos: string[];
  };
}

export interface WorkflowPasso {
  nucleo: number;
  acao: string;
  saida: string;
}

export interface WorkflowHibrido {
  id: string;
  nome: string;
  descricao: string;
  nucleos_envolvidos: number[];
  passos: WorkflowPasso[];
  trigger: string;
}

export interface InteracaoHistorico {
  data: string;
  tipo: string;
  nucleo: number;
  detalhes: string;
}

export interface Persona {
  id: string;
  nome: string;
  perfil: string;
  rbac_nivel: string;
  budget_diario_tokens: number;
  trilha_ativa: string | null;
  modulo_atual: number;
  historico_interacoes: InteracaoHistorico[];
}

export interface PoliticaGovernanca {
  rate_limit: Record<string, Record<string, number>>;
  budget_tracking: Record<string, number>;
  pii_masking: {
    campos_regex: string[];
    acao: string;
  };
}

export interface LiveLabManifesto {
  versao: string;
  visao_executiva: string;
  nucleo_agregador: {
    modelos: LiveLabModel[];
    algoritmo_roteamento: Record<string, unknown>;
  };
  nucleo_produtividade: {
    skills_atomicas: Skill[];
    meta_skills: MetaSkill[];
  };
  nucleo_ecossistema: {
    trilhas: TrilhaAprendizagem[];
    certificacoes: Record<string, unknown>;
  };
  workflows_hibridos: WorkflowHibrido[];
  personas: Persona[];
  politicas_governanca: PoliticaGovernanca;
  perguntas_criticas: string[];
}