import type { LiveLabManifesto, AgenticaIdentity } from './types';
import rawManifesto from './raw-manifesto.json';

export const LIVE_LAB_MANIFESTO: LiveLabManifesto = rawManifesto as unknown as LiveLabManifesto;

export const AGENTICA_AI: AgenticaIdentity = {
  id: 'agentica-ai',
  nome: 'Agentica AI',
  papel: 'Arquiteta-Cognitiva',
  versao: '3.0.0',
  nucleo_primario: 1, nucleo_secundario: 2, nucleo_terciario: 3,
  manifesto_versao: (rawManifesto as Record<string, unknown>).versao as string ?? '3.0.0-iogue',
  criado_em: '2026-07-27T00:00:00Z',
  descricao: 'Agentica AI e a Arquiteta-Cognitiva do Live Lab Tri-Nuclear. Orquestra selecao inteligente de LLMs via MCDM PROMETHEE, execucao de skills com RBAC, progresso de trilhas e governanca consciente. Inspirada nos principios da Autobiografia de um Iogue de Paramahansa Yogananda — sete funcoes como sete chakras da Kundalini.',
} as const;
