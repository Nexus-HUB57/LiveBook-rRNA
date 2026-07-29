/**
 * LIVE LAB — Orchestrator v3.1 (Guru-Interior + LLM Real + Persistencia)
 *
 * O orquestrador e o "guru interior" do ecossistema — nao impoe, desperta.
 * Nao controla, orquestra. Cada funcao espelha um aspecto do caminho do discipulo.
 *
 * v3.1: executeSkill() agora chama LLMs reais via 9router-bridge.
 *        evaluateModulo() usa LLM judge quando nao ha score explicito.
 *        Todas as execucoes sao persistidas em Prisma.
 */

import { LIVE_LAB_MANIFESTO, AGENTICA_AI } from './manifesto';
import { routeIntent, matchSkill, composeMetaSkill, TokenBucket, BudgetTracker, rbacCheck } from './algorithms';
import type { RoutingResult, SkillResult, MetaSkillResult, ModuloResult, PersonaProgress, LiveLabStats, Skill, MetaSkill, IogueEssence, LiveLabModel } from './types';
import { routeChat } from '@/lib/9router-bridge';
import { db } from '@/lib/db';

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

/**
 * executeSkill — Executa uma skill chamando um LLM REAL via 9router-bridge.
 * Retorna envelope sincrono (Fire-and-Forget com persistencia assincrona).
 */
export async function executeSkill(skillId: string, input: Record<string, unknown>, personaId: string): Promise<SkillResult> {
  const skill = findSkillById(skillId);
  if (!skill) return { sucesso: false, skill_id: skillId, modelo_selecionado: '', tokens_usados: 0, custo_usd: 0, latencia_ms: 0, resultado: { erro: `Skill '${skillId}' nao encontrada` } };
  const persona = M.personas.find(p => p.id === personaId);
  if (persona && !rbacCheck(persona.nivel_acesso_rbac, skill.rbac_permissoes[0] || 'basic', [...RBAC_LEVELS]))
    return { sucesso: false, skill_id: skillId, modelo_selecionado: '', tokens_usados: 0, custo_usd: 0, latencia_ms: 0, resultado: { erro: 'RBAC: nivel insuficiente' } };

  const routing = getRoutingResult(`executar ${skillId}: ${JSON.stringify(input).slice(0, 200)}`);
  const modelo = skill.modelo_preferido ? findModelo(skill.modelo_preferido) : findModelo(routing.modelo_selecionado);
  if (!modelo) return { sucesso: false, skill_id: skillId, modelo_selecionado: '', tokens_usados: 0, custo_usd: 0, latencia_ms: 0, resultado: { erro: 'Nenhum modelo disponivel' } };

  // Resolve provider ID for 9router from modelo.provedor
  const providerId = resolveProviderId(modelo);
  const maxTokens = skill.tokens_estimados || 2048;

  const skillSystemPrompt = `Voce e o agente ${AGENTICA_AI.nome} executando a skill "${skill.nome}" (dominio: ${skill.dominio}).
Descricao: ${skill.descricao || skill.trigger}
Responda de forma objetiva e tecnica em portugues.`;

  const userMessage = typeof input.prompt === 'string'
    ? input.prompt as string
    : `Execute a skill "${skill.nome}" com os seguintes parametros:
${JSON.stringify(input, null, 2)}`;

  const startTime = performance.now();
  let llmSuccess = false;
  let llmContent: string | null = null;
  let llmTokens = maxTokens;
  let llmLatency = modelo.latencia_media_ms;
  let llmFallback: string | undefined;

  try {
    const result = await routeChat({
      provider: providerId,
      model: modelo.id,
      messages: [
        { role: 'system', content: skillSystemPrompt },
        { role: 'user', content: userMessage },
      ],
      maxTokens,
      temperature: 0.3,
      timeoutMs: 30000,
      metadata: { source: 'live-lab-orchestrator', skillId, personaId },
    });

    llmSuccess = result.success;
    llmContent = result.content;
    llmTokens = result.usage?.totalTokens || maxTokens;
    llmLatency = result.latencyMs;
    llmFallback = result.fallbackUsed;
  } catch (err) {
    llmContent = `[Erro LLM] ${err instanceof Error ? err.message : String(err)}`;
  }

  const realTokens = llmTokens;
  const custo_usd = modelo.custo_por_1m_tokens.entrada_usd * (realTokens / 1_000_000)
    + modelo.custo_por_1m_tokens.saida_usd * (Math.ceil(realTokens * 0.4) / 1_000_000);
  budgetTracker.recordUsage(personaId, custo_usd);

  const resultadoFinal: SkillResult = {
    sucesso: llmSuccess && !!llmContent,
    skill_id: skillId,
    modelo_selecionado: modelo.id,
    tokens_usados: realTokens,
    custo_usd,
    latencia_ms: llmLatency,
    resultado: {
      dominio: skill.dominio,
      input,
      executor: persona?.nome || 'anonimo',
      timestamp: new Date().toISOString(),
      llm_resposta: llmContent,
      provedor: modelo.provedor,
      fallback_usado: llmFallback || null,
    },
  };

  // Persist execution asynchronously (fire-and-forget)
  persistExecution(routing, resultadoFinal, personaId, skillId, llmFallback).catch(() => {});

  return resultadoFinal;
}

export async function executeMetaSkill(metaSkillId: string, input: Record<string, unknown>, personaId: string): Promise<MetaSkillResult> {
  const metaSkill = M.nucleo_produtividade.meta_skills.find(ms => ms.id === metaSkillId);
  if (!metaSkill) return { sucesso: false, meta_skill_id: metaSkillId, resultados: [], total_tokens: 0, total_custo_usd: 0, total_latencia_ms: 0, execution_plan: [] };
  const persona = M.personas.find(p => p.id === personaId);
  if (persona && !rbacCheck(persona.nivel_acesso_rbac, metaSkill.rbac_permissoes[0] || 'basic', [...RBAC_LEVELS]))
    return { sucesso: false, meta_skill_id: metaSkillId, resultados: [{ sucesso: false, skill_id: metaSkillId, modelo_selecionado: '', tokens_usados: 0, custo_usd: 0, latencia_ms: 0, resultado: { erro: 'RBAC: nivel insuficiente para meta-skill' } }], total_tokens: 0, total_custo_usd: 0, total_latencia_ms: 0, execution_plan: [] };
  const plan = composeMetaSkill(metaSkill as MetaSkill, M.nucleo_produtividade.skills);
  if (plan.hasCycle) return { sucesso: false, meta_skill_id: metaSkillId, resultados: [], total_tokens: 0, total_custo_usd: 0, total_latencia_ms: 0, execution_plan: plan.executionPlan };
  const resultados: SkillResult[] = [];
  let total_tokens = 0; let total_custo = 0; let total_lat = 0;
  for (const step of plan.executionPlan) {
    const r = await executeSkill(step.skillId, input, personaId);
    resultados.push(r);
    total_tokens += r.tokens_usados; total_custo += r.custo_usd; total_lat += r.latencia_ms;
    if (!r.sucesso) return { sucesso: false, meta_skill_id: metaSkillId, resultados, total_tokens, total_custo_usd: total_custo, total_latencia_ms: total_lat, execution_plan: plan.executionPlan };
  }
  return { sucesso: true, meta_skill_id: metaSkillId, resultados, total_tokens, total_custo_usd: total_custo, total_latencia_ms: total_lat, execution_plan: plan.executionPlan };
}

/**
 * evaluateModulo — Avalia modulo. Se _score fornecido, usa-o.
 * Senao, chama LLM judge para avaliar dominio do conteudo.
 */
export async function evaluateModulo(moduloId: string, _score?: number): Promise<ModuloResult> {
  const match = findModulo(moduloId);
  if (!match) return { modulo_id: moduloId, aprovado: false, pontuacao: 0, pontuacao_minima: 0, feedback: `Modulo '${moduloId}' nao encontrado`, modelo_usado: '' };
  const { modulo } = match;
  const min = modulo.criterios_aprovacao.taxa_acerto_minima;

  let score: number;
  let modeloUsado = modulo.modelo_recomendado;

  if (_score !== undefined) {
    score = _score;
  } else {
    // LLM Judge: pede ao modelo que avalie o dominio do modulo
    try {
      const judgeResult = await routeChat({
        provider: resolveProviderId(findModelo(modulo.modelo_recomendado) || M.nucleo_agregador.modelos[0]),
        model: modulo.modelo_recomendado,
        messages: [
          { role: 'system', content: 'Voce e um avaliador educacional. Avalie o dominio de um modulo com pontuacao de 0 a 100. Responda APENAS com o numero inteiro, nada mais.' },
          { role: 'user', content: `Modulo: "${modulo.titulo}"\nDescricao: ${modulo.descricao}\nConteudo: ${modulo.conteudo_teorico?.slice(0, 1500) || 'N/A'}\n\nAvalie o dominio esperado de um estudante que completou este modulo (0-100):` },
        ],
        maxTokens: 16,
        temperature: 0.1,
        timeoutMs: 15000,
        metadata: { source: 'live-lab-evaluate', moduloId },
      });
      const parsed = parseInt(String(judgeResult.content).trim(), 10);
      score = Number.isFinite(parsed) ? Math.min(100, Math.max(0, parsed)) : 75;
      modeloUsado = judgeResult.model;
    } catch {
      score = 75; // fallback conservador
    }
  }

  const feedback = score >= 90 ? 'Excelente dominio do modulo.' : score >= min ? 'Bom desempenho. Revise pontos de atencao.' : 'Necessita mais pratica. Revisar conteudo.';
  return { modulo_id: moduloId, aprovado: score >= min, pontuacao: score, pontuacao_minima: min, feedback, modelo_usado: modeloUsado };
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

// ─── Helper: Resolve provider ID from modelo for 9router ───
function resolveProviderId(modelo: LiveLabModel | undefined): string {
  if (!modelo) return 'glm';
  const provedor = modelo.provedor?.toLowerCase() || '';
  const registryId = modelo.provedor_registry_id?.toLowerCase() || '';
  // Map provedor names to 9router provider IDs
  if (provedor.includes('zhipu') || provedor.includes('glm') || modelo.id.startsWith('glm')) return 'glm';
  if (provedor.includes('deepseek') || modelo.id.startsWith('deepseek')) return 'deepseek';
  if (provedor.includes('openai') || modelo.id.startsWith('gpt')) return 'openai';
  if (provedor.includes('anthropic') || provedor.includes('claude') || modelo.id.startsWith('claude')) return 'claude';
  if (provedor.includes('google') || provedor.includes('gemini') || modelo.id.startsWith('gemini')) return 'gemini';
  if (provedor.includes('mistral') || modelo.id.startsWith('mistral')) return 'mistral';
  if (provedor.includes('groq') || modelo.id.startsWith('llama')) return 'groq';
  if (registryId) return registryId;
  return 'glm'; // default to Zhipu
}

// ─── Helper: Persist execution to Prisma (fire-and-forget) ───
async function persistExecution(
  routing: RoutingResult,
  result: SkillResult,
  personaId: string,
  skillId: string,
  fallbackUsed?: string,
): Promise<void> {
  try {
    const executionId = `exec_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

    await db.liveLabExecution.create({
      data: {
        executionId,
        intent: routing.intencao,
        personaId,
        skillId,
        modeloSelecionado: result.modelo_selecionado,
        provedor: routing.provedor,
        sucesso: result.sucesso,
        tokensUsados: result.tokens_usados,
        custoUsd: result.custo_usd,
        latenciaMs: result.latencia_ms,
        resultado: JSON.stringify(result.resultado),
        cascadeMatch: routing.cascade_match,
        scoreMcdm: routing.score_mcdm?.score_total,
        rankMcdm: routing.score_mcdm?.rank,
        fallbackUsed: fallbackUsed || null,
      },
    });

    await db.skillExecutionLog.create({
      data: {
        executionId,
        skillId,
        personaId,
        inputSnap: JSON.stringify(result.resultado.input).slice(0, 2000),
        outputSnap: JSON.stringify(result.resultado).slice(0, 4000),
        sucesso: result.sucesso,
        modelo: result.modelo_selecionado,
        tokensUsados: result.tokens_usados,
        custoUsd: result.custo_usd,
        latenciaMs: result.latencia_ms,
      },
    });

    await db.routingLog.create({
      data: {
        intent: routing.intencao,
        modeloSelecionado: routing.modelo_selecionado,
        provedor: routing.provedor,
        scoreMcdm: routing.score_mcdm?.score_total || 0,
        rankMcdm: routing.score_mcdm?.rank || 0,
        cascadeMatch: routing.cascade_match || null,
        latenciaEstimada: routing.latencia_estimada_ms,
        custoEstimado: routing.custo_estimado_usd,
        isLocal: routing.is_local,
      },
    });
  } catch (err) {
    console.warn('[LiveLab] Persist error (non-blocking):', err instanceof Error ? err.message : String(err));
  }
}
