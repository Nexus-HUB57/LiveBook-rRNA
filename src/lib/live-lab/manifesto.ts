/**
 * ═══════════════════════════════════════════════════════════════
 * LIVE LAB TRI-NUCLEAR — Typed Manifesto (v2.0 Agentica AI)
 * ═══════════════════════════════════════════════════════════════
 * Importa o manifesto JSON bruto e o tipa para consumo seguro
 * pelo orchestrator e componentes React.
 *
 * Agentica AI — Arquiteta-Cognitiva do Live Lab
 * ═══════════════════════════════════════════════════════════════
 */

import type { LiveLabManifesto } from './types';
import rawManifesto from './raw-manifesto.json';

/** Manifesto tipado do Live Lab Tri-Nuclear v2.0 */
export const LIVE_LAB_MANIFESTO: LiveLabManifesto = rawManifesto as unknown as LiveLabManifesto;

/**
 * Agentica AI — Identidade da Arquiteta-Cognitiva
 * Metadados do agente que orquestra o Live Lab
 */
export const AGENTICA_AI = {
  id: 'agentica-ai',
  nome: 'Agentica AI',
  papel: 'Arquiteta-Cognitiva',
  versao: '2.0.0',
  nucleo_primario: 1,  // N1 — Agregadores (LLMs)
  nucleo_secundario: 2, // N2 — Produtividade (Skills)
  nucleo_terciario: 3,  // N3 — Ecossistema (Educação/Certs)
  manifesto_versao: (rawManifesto as Record<string, unknown>).versao ?? '2.0.0-agentica',
  criado_em: '2026-07-27T00:00:00Z',
  descricao: (
    'Agentica AI atua como Arquiteta-Cognitiva do Live Lab Tri-Nuclear, ' +
    'responsavel por orquestrar a selecao inteligente de LLMs, ' +
    'a execucao de Skills atomicas e compostas, ' +
    'o progresso das trilhas de aprendizagem, ' +
    'e a aplicacao de politicas de governanca RBAC em tempo real.'
  ),
} as const;