/**
 * LIVE LAB TRI-NUCLEAR — Type Definitions v2.0
 * Alinhado com a estrutura real do raw-manifesto.json
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
  rbac_permissoes: string;
  nivel_criticidade: string;
  payload_schema: Record<string, unknown>;
  descricao?: string;
}

export interface MetaSkill {
  id: string;
  nome: string;
  dominio: string;
  trigger: string;
  rbac_permissoes: string;
  nivel_criticidade: string;
  payload_schema: Record<string, unknown>;
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
  modulos: ModuloEducacional[];
  descricao?: string;
  certificacao?: {
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
  papel: string;
  nivel_acesso_rbac: string;
  trilha_ativa: string | null;
  certificacao_atual: string | null;
  historico_interacoes: InteracaoHistorico[];
}

export interface PoliticaGovernanca {
  rate_limiting: Record<string, Record<string, number>>;
  budget_tracking: Record<string, number>;
  privacidade_e_pii: {
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
    skills: Skill[];
    meta_skills: MetaSkill[];
  };
  nucleo_ecossistema: {
    trilhas_aprendizagem: TrilhaAprendizagem[];
    certificacoes: Record<string, unknown>;
  };
  workflows_hibridos: {
    malha_eventos_descricao: Record<string, unknown>;
    exemplos_fluxos: WorkflowHibrido[];
  };
  personas: Persona[];
  politicas_governanca: PoliticaGovernanca;
}