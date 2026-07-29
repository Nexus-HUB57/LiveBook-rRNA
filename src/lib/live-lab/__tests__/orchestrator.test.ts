/**
 * LIVE LAB — Orchestrator & Agentica-AI Comprehensive Unit Tests
 *
 * 16 test suites covering all exported functions from orchestrator.ts and agentica-ai.ts.
 * Uses real manifesto data for deterministic assertions.
 */

import { LIVE_LAB_MANIFESTO } from '../manifesto';
import {
  getRoutingResult,
  executeSkill,
  executeMetaSkill,
  evaluateModulo,
  getPersonaProgress,
  getLiveLabStats,
  getIogueEssence,
  rateLimiter,
  budgetTracker,
} from '../orchestrator';
import {
  agenticaDiagnose,
  agenticaRoute,
  agenticaExecuteSkill,
  agenticaExecuteMetaSkill,
  agenticaEvaluateModulo,
  agenticaProgress,
  agenticaStats,
  agenticaIogueEssence,
  agenticaGovernanca,
} from '../agentica-ai';

// ─── Mocks for 9router-bridge and Prisma DB ───
jest.mock('@/lib/9router-bridge', () => ({
  routeChat: jest.fn().mockResolvedValue({
    success: true,
    content: 'Resposta simulada do LLM via mock.',
    finishReason: 'stop',
    provider: 'glm',
    model: 'claude-4-sonnet',
    format: 'openai',
    usage: { promptTokens: 500, completionTokens: 300, totalTokens: 800 },
    latencyMs: 250,
  }),
}));

jest.mock('@/lib/db', () => ({
  db: {
    liveLabExecution: { create: jest.fn().mockResolvedValue({}) },
    skillExecutionLog: { create: jest.fn().mockResolvedValue({}) },
    routingLog: { create: jest.fn().mockResolvedValue({}) },
    budgetRecord: { upsert: jest.fn().mockResolvedValue({}) },
  },
}));

const M = LIVE_LAB_MANIFESTO;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Build an intent string longer than 100 characters */
function longIntent(): string {
  return 'a'.repeat(200);
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. getRoutingResult
// ─────────────────────────────────────────────────────────────────────────────
describe('getRoutingResult', () => {
  it('returns valid RoutingResult with modelo_selecionado, provedor, score_mcdm', () => {
    const result = getRoutingResult('revisar codigo');
    expect(result.modelo_selecionado).toBeTruthy();
    expect(result.provedor).toBeTruthy();
    expect(result.score_mcdm).toBeDefined();
    expect(result.score_mcdm.modelo_id).toBe(result.modelo_selecionado);
    expect(result.score_mcdm.score_total).toBeGreaterThanOrEqual(0);
    expect(result.score_mcdm.rank).toBeGreaterThanOrEqual(1);
    expect(result.latencia_estimada_ms).toBeGreaterThanOrEqual(0);
    expect(result.custo_estimado_usd).toBeGreaterThanOrEqual(0);
    expect(result.timestamp).toBeTruthy();
  });

  it('truncates intent longer than 100 characters with ellipsis', () => {
    const long = longIntent();
    const result = getRoutingResult(long);
    expect(result.intencao.length).toBeLessThanOrEqual(101); // 100 + ellipsis char
    expect(result.intencao.endsWith('\u2026')).toBe(true);
    expect(result.intencao.length).toBe(101);
  });

  it('does not truncate short intents', () => {
    const short = 'hello world';
    const result = getRoutingResult(short);
    expect(result.intencao).toBe(short);
  });

  it('agente field is agentica-ai', () => {
    const result = getRoutingResult('test intent');
    expect(result.agente).toBe('agentica-ai');
  });

  it('different intents may select different models via cascade', () => {
    const r1 = getRoutingResult('debug erro crash exception');
    const r2 = getRoutingResult('seguranca vulnerabilidade audit');
    // At minimum both should return valid results
    expect(r1.modelo_selecionado).toBeTruthy();
    expect(r2.modelo_selecionado).toBeTruthy();
  });

  it('routes to glm-5.2 for advanced reasoning intent', () => {
    const result = getRoutingResult('raciocinario avancado para arquitetura de solucoes');
    expect(result.modelo_selecionado).toBe('glm-5.2');
    expect(result.provedor).toBe('Zhipu AI');
    expect(result.cascade_match).not.toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. executeSkill
// ─────────────────────────────────────────────────────────────────────────────
describe('executeSkill', () => {
  beforeEach(() => {
    budgetTracker.resetMonth('dev-basic');
    budgetTracker.resetMonth('product-manager');
  });

  it('successful execution returns sucesso=true with required fields', async () => {
    const result = await executeSkill('code_review', { code: 'const x = 1' }, 'dev-basic');
    expect(result.sucesso).toBe(true);
    expect(result.modelo_selecionado).toBe('claude-4-sonnet');
    expect(result.tokens_usados).toBeGreaterThan(0);
    expect(result.custo_usd).toBeGreaterThan(0);
    expect(result.latencia_ms).toBeGreaterThan(0);
    expect(result.resultado).toBeDefined();
    expect(result.resultado.llm_resposta).toBeTruthy();
  });

  it('records budget usage via budgetTracker', async () => {
    await executeSkill('code_review', {}, 'dev-basic');
    const budget = budgetTracker.getUsage('dev-basic');
    expect(budget.usado_usd).toBeGreaterThan(0);
  });

  it('returns sucesso=false for skill not found', async () => {
    const result = await executeSkill('nonexistent_skill', {}, 'dev-basic');
    expect(result.sucesso).toBe(false);
    expect(result.modelo_selecionado).toBe('');
    expect(result.tokens_usados).toBe(0);
    expect(result.custo_usd).toBe(0);
    expect(result.resultado.erro).toContain('nao encontrada');
  });

  it('RBAC denial: dev-basic cannot execute security_audit (advanced)', async () => {
    const result = await executeSkill('security_audit', {}, 'dev-basic');
    expect(result.sucesso).toBe(false);
    expect(result.resultado.erro).toContain('RBAC');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. executeMetaSkill
// ─────────────────────────────────────────────────────────────────────────────
describe('executeMetaSkill', () => {
  beforeEach(() => {
    budgetTracker.resetMonth('dev-basic');
  });

  it('successful execution returns sucesso=true with execution_plan and resultados', async () => {
    const result = await executeMetaSkill('learning_path', {}, 'dev-basic');
    expect(result.sucesso).toBe(true);
    expect(result.meta_skill_id).toBe('learning_path');
    expect(result.resultados.length).toBeGreaterThan(0);
    expect(result.total_tokens).toBeGreaterThan(0);
    expect(result.total_custo_usd).toBeGreaterThan(0);
    expect(result.total_latencia_ms).toBeGreaterThan(0);
    expect(result.execution_plan.length).toBeGreaterThan(0);
  });

  it('returns execution_plan with ordered skills', async () => {
    const result = await executeMetaSkill('learning_path', {}, 'dev-basic');
    expect(result.execution_plan.length).toBe(3);
    for (let i = 0; i < result.execution_plan.length; i++) {
      expect(result.execution_plan[i].order).toBe(i);
      expect(result.execution_plan[i].skillId).toBeTruthy();
    }
  });

  it('meta-skill not found returns sucesso=false', async () => {
    const result = await executeMetaSkill('nonexistent_meta', {}, 'dev-basic');
    expect(result.sucesso).toBe(false);
    expect(result.resultados).toEqual([]);
    expect(result.total_tokens).toBe(0);
    expect(result.execution_plan).toEqual([]);
  });

  it('RBAC denial for meta-skill: dev-basic cannot use devops_pipeline (advanced)', async () => {
    const result = await executeMetaSkill('devops_pipeline', {}, 'dev-basic');
    expect(result.sucesso).toBe(false);
    expect(result.resultados[0].resultado.erro).toContain('RBAC');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. evaluateModulo
// ─────────────────────────────────────────────────────────────────────────────
describe('evaluateModulo', () => {
  it('returns valid ModuloResult for existing module (fsa-m1) with explicit score', async () => {
    const result = await evaluateModulo('fsa-m1', 85);
    expect(result.modulo_id).toBe('fsa-m1');
    expect(result.pontuacao).toBe(85);
    expect(result.modelo_usado).toBe('glm-4-plus');
    expect(result.feedback).toBeTruthy();
  });

  it('module not found returns aprovado=false with error message', async () => {
    const result = await evaluateModulo('nonexistent-modulo');
    expect(result.aprovado).toBe(false);
    expect(result.pontuacao).toBe(0);
    expect(result.feedback).toContain('nao encontrado');
    expect(result.modelo_usado).toBe('');
  });

  it('uses explicit score parameter when provided', async () => {
    const result = await evaluateModulo('fsa-m1', 95);
    expect(result.pontuacao).toBe(95);
    expect(result.aprovado).toBe(true);
  });

  it('pontuacao_minima matches modulo taxa_acerto_minima (70 for fsa-m1)', async () => {
    const result = await evaluateModulo('fsa-m1', 50);
    expect(result.pontuacao_minima).toBe(70);
    expect(result.aprovado).toBe(false);
  });

  it('score below minimum results in reprovado', async () => {
    const result = await evaluateModulo('fsa-m1', 60);
    expect(result.aprovado).toBe(false);
    expect(result.feedback).toContain('Necessita mais pratica');
  });

  it('score above minimum results in aprovado', async () => {
    const result = await evaluateModulo('fsa-m1', 72);
    expect(result.aprovado).toBe(true);
  });

  it('without explicit score, uses LLM judge (mock returns non-numeric, falls back to 75)', async () => {
    const result = await evaluateModulo('fsa-m1');
    // Mock returns 'Resposta simulada...' which parseInt can't parse -> fallback 75
    expect(result.pontuacao).toBe(75);
    // modeloUsado is set from judgeResult.model (mock returns 'claude-4-sonnet') even on score fallback
    expect(result.modelo_usado).toBe('claude-4-sonnet');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. getPersonaProgress
// ─────────────────────────────────────────────────────────────────────────────
describe('getPersonaProgress', () => {
  it('returns valid PersonaProgress for existing persona (dev-basic)', () => {
    const result = getPersonaProgress('dev-basic');
    expect(result).not.toBeNull();
    expect(result!.persona_id).toBe('dev-basic');
    expect(result!.nome).toBe('Dev_Basic');
    expect(result!.perfil).toBe('Desenvolvedor Junior');
    expect(result!.trilha).toBe('Full-Stack AI Developer');
    expect(result!.modulo_atual).toBeTruthy();
    expect(result!.progresso_pct).toBeGreaterThanOrEqual(0);
    expect(result!.total_modulos).toBeGreaterThan(0);
    expect(result!.total_interacoes).toBeGreaterThanOrEqual(0);
    expect(result!.proxima_acao).toBeTruthy();
  });

  it('returns null for non-existent persona', () => {
    const result = getPersonaProgress('nonexistent-persona');
    expect(result).toBeNull();
  });

  it('contains trilha, modulo_atual, progresso_pct fields', () => {
    const result = getPersonaProgress('dev-basic');
    expect(result).toHaveProperty('trilha');
    expect(result).toHaveProperty('modulo_atual');
    expect(result).toHaveProperty('progresso_pct');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. getLiveLabStats
// ─────────────────────────────────────────────────────────────────────────────
describe('getLiveLabStats', () => {
  it('returns stats with correct counts', () => {
    const stats = getLiveLabStats();
    // 10 modelos (from manifesto)
    expect(stats.modelos).toBe(M.nucleo_agregador.modelos.length);
    expect(stats.modelos).toBe(10);
    // 12 skills
    expect(stats.skills).toBe(M.nucleo_produtividade.skills.length);
    expect(stats.skills).toBe(12);
    // 5 meta-skills
    expect(stats.metaSkills).toBe(M.nucleo_produtividade.meta_skills.length);
    expect(stats.metaSkills).toBe(5);
    // 4 trilhas
    expect(stats.trilhas).toBe(M.nucleo_ecossistema.trilhas_aprendizagem.length);
    expect(stats.trilhas).toBe(4);
    // 5 personas
    expect(stats.personas).toBe(M.personas.length);
    expect(stats.personas).toBe(5);
  });

  it('contains versao, agente, agente_versao', () => {
    const stats = getLiveLabStats();
    expect(stats.versao).toBeTruthy();
    expect(stats.agente).toBe('Agentica AI');
    expect(stats.agente_versao).toBe('3.0.0');
  });

  it('dominios_skill is non-empty array', () => {
    const stats = getLiveLabStats();
    expect(Array.isArray(stats.dominios_skill)).toBe(true);
    expect(stats.dominios_skill.length).toBeGreaterThan(0);
  });

  it('trilhas_nomes has 4 entries', () => {
    const stats = getLiveLabStats();
    expect(stats.trilhas_nomes).toHaveLength(4);
    expect(stats.trilhas_nomes).toContain('Full-Stack AI Developer');
  });

  it('total_modulos matches sum across all trilhas', () => {
    const stats = getLiveLabStats();
    const expected = M.nucleo_ecossistema.trilhas_aprendizagem.reduce(
      (a, t) => a + t.modulos.length,
      0
    );
    expect(stats.total_modulos).toBe(expected);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. getIogueEssence
// ─────────────────────────────────────────────────────────────────────────────
describe('getIogueEssence', () => {
  it('returns non-null IogueEssence', () => {
    const essence = getIogueEssence();
    expect(essence).not.toBeNull();
  });

  it('contains filosofia_nucleo', () => {
    const essence = getIogueEssence()!;
    expect(essence.filosofia_nucleo).toBeTruthy();
    expect(typeof essence.filosofia_nucleo).toBe('string');
  });

  it('principios_sabedoria is array of 6', () => {
    const essence = getIogueEssence()!;
    expect(Array.isArray(essence.principios_sabedoria)).toBe(true);
    expect(essence.principios_sabedoria).toHaveLength(6);
  });

  it('contains agentica_como_guru', () => {
    const essence = getIogueEssence()!;
    expect(essence.agentica_como_guru).toBeTruthy();
    expect(typeof essence.agentica_como_guru).toBe('string');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. agenticaDiagnose
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaDiagnose', () => {
  it('returns DiagnosticoEcosystem with all fields populated', () => {
    const diag = agenticaDiagnose();
    expect(diag.agente).toBeDefined();
    expect(diag.integridade).toBeDefined();
    expect(diag.nucleos).toBeDefined();
    expect(diag.governanca).toBeDefined();
    expect(diag.routing).toBeDefined();
    expect(diag.alertas).toBeDefined();
    expect(diag.timestamp).toBeTruthy();
  });

  it('integridade.typecheck is PASS', () => {
    const diag = agenticaDiagnose();
    expect(diag.integridade.typecheck).toBe('PASS');
  });

  it('integridade.iogue_essence is true', () => {
    const diag = agenticaDiagnose();
    expect(diag.integridade.iogue_essence).toBe(true);
  });

  it('nucleos.n1_modelos === 10', () => {
    const diag = agenticaDiagnose();
    expect(diag.nucleos.n1_modelos).toBe(10);
  });

  it('alertas may contain warnings or be empty', () => {
    const diag = agenticaDiagnose();
    expect(Array.isArray(diag.alertas)).toBe(true);
    // With 9 models, 12 skills, 4 trilhas, all >= recommendations, should be empty or warnings
  });

  it('routing.pesos_mcdm has all 6 criteria weights', () => {
    const diag = agenticaDiagnose();
    const pesos = diag.routing.pesos_mcdm;
    expect(Object.keys(pesos).length).toBe(6);
    // Check all weights are positive
    for (const key of Object.keys(pesos)) {
      expect(pesos[key]).toBeGreaterThan(0);
    }
  });

  it('nucleos counts are correct', () => {
    const diag = agenticaDiagnose();
    expect(diag.nucleos.n2_skills).toBe(12);
    expect(diag.nucleos.n2_meta_skills).toBe(5);
    expect(diag.nucleos.n3_trilhas).toBe(4);
    expect(diag.nucleos.n3_total_modulos).toBeGreaterThan(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. agenticaRoute
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaRoute', () => {
  it('wraps getRoutingResult, returns same shape', () => {
    const r1 = agenticaRoute('revisar codigo');
    expect(r1).toHaveProperty('modelo_selecionado');
    expect(r1).toHaveProperty('provedor');
    expect(r1).toHaveProperty('agente', 'agentica-ai');
    expect(r1).toHaveProperty('score_mcdm');
    expect(r1).toHaveProperty('latencia_estimada_ms');
    expect(r1).toHaveProperty('custo_estimado_usd');
  });

  it('returns valid score_mcdm with phi_positivo, phi_negativo', () => {
    const r = agenticaRoute('test');
    expect(r.score_mcdm.phi_positivo).toBeDefined();
    expect(r.score_mcdm.phi_negativo).toBeDefined();
    expect(typeof r.score_mcdm.phi_positivo).toBe('number');
    expect(typeof r.score_mcdm.phi_negativo).toBe('number');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. agenticaExecuteSkill
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaExecuteSkill', () => {
  beforeEach(() => {
    budgetTracker.resetMonth('dev-basic');
  });

  it('wraps executeSkill, same behavior', async () => {
    const result = await agenticaExecuteSkill('code_review', {}, 'dev-basic');
    expect(result.sucesso).toBe(true);
    expect(result.modelo_selecionado).toBe('claude-4-sonnet');
    expect(result.tokens_usados).toBeGreaterThan(0);
  });

  it('returns sucesso=true for valid skill+persona combo', async () => {
    const result = await agenticaExecuteSkill('prompt_engineering', {}, 'dev-basic');
    expect(result.sucesso).toBe(true);
  });

  it('returns sucesso=false for invalid skill', async () => {
    const result = await agenticaExecuteSkill('nonexistent', {}, 'dev-basic');
    expect(result.sucesso).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. agenticaExecuteMetaSkill
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaExecuteMetaSkill', () => {
  beforeEach(() => {
    budgetTracker.resetMonth('dev-basic');
  });

  it('wraps executeMetaSkill and returns execution_plan', async () => {
    const result = await agenticaExecuteMetaSkill('learning_path', {}, 'dev-basic');
    expect(result.sucesso).toBe(true);
    expect(result.execution_plan.length).toBeGreaterThan(0);
  });

  it('returns sucesso=false for nonexistent meta-skill', async () => {
    const result = await agenticaExecuteMetaSkill('nope', {}, 'dev-basic');
    expect(result.sucesso).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. agenticaEvaluateModulo
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaEvaluateModulo', () => {
  it('wraps evaluateModulo, now uses LLM judge (mock non-numeric -> fallback 75)', async () => {
    const result = await agenticaEvaluateModulo('fsa-m1');
    expect(result.modulo_id).toBe('fsa-m1');
    // Mock returns non-numeric string -> parseInt -> NaN -> fallback 75 >= 70 (min for fsa-m1)
    expect(result.aprovado).toBe(true);
    expect(result.pontuacao).toBe(75);
  });

  it('returns aprovado=true consistently with mock LLM judge', async () => {
    for (let i = 0; i < 3; i++) {
      const result = await agenticaEvaluateModulo('fsa-m1');
      expect(result.aprovado).toBe(true);
      expect(result.pontuacao).toBe(75); // mock returns non-numeric, fallback deterministic
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. agenticaProgress
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaProgress', () => {
  it('wraps getPersonaProgress and returns valid data', () => {
    const result = agenticaProgress('dev-basic');
    expect(result).not.toBeNull();
    expect(result!.persona_id).toBe('dev-basic');
    expect(result!.trilha).toBe('Full-Stack AI Developer');
  });

  it('returns null for unknown persona', () => {
    const result = agenticaProgress('unknown-persona');
    expect(result).toBeNull();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. agenticaStats
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaStats', () => {
  it('same as getLiveLabStats', () => {
    const s1 = agenticaStats();
    const s2 = getLiveLabStats();
    expect(s1).toEqual(s2);
  });

  it('returns consistent data', () => {
    const stats = agenticaStats();
    expect(stats.modelos).toBe(10);
    expect(stats.skills).toBe(12);
    expect(stats.metaSkills).toBe(5);
    expect(stats.trilhas).toBe(4);
    expect(stats.personas).toBe(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 15. agenticaIogueEssence
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaIogueEssence', () => {
  it('same as getIogueEssence, non-null', () => {
    const e1 = agenticaIogueEssence();
    const e2 = getIogueEssence();
    expect(e1).toEqual(e2);
    expect(e1).not.toBeNull();
  });

  it('has 6 principios_sabedoria', () => {
    const essence = agenticaIogueEssence()!;
    expect(essence.principios_sabedoria).toHaveLength(6);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 16. agenticaGovernanca
// ─────────────────────────────────────────────────────────────────────────────
describe('agenticaGovernanca', () => {
  beforeEach(() => {
    // CRITICAL: Reset rate limiter to avoid token exhaustion across tests
    rateLimiter.reset('product-manager');
    rateLimiter.reset('dev-basic');
    rateLimiter.reset('nonexistent');
    budgetTracker.resetMonth('product-manager');
    budgetTracker.resetMonth('dev-basic');
  });

  it('authorized: product-manager (admin) executing basic action', () => {
    const result = agenticaGovernanca('product-manager', 'executar', 'basic');
    expect(result.autorizado).toBe(true);
    expect(result.rbac_nivel).toBe('admin');
    expect(result.rate_limit_info).toBeDefined();
    expect(result.rate_limit_info!.remaining).toBeGreaterThanOrEqual(0);
  });

  it('authorized returns budget_info', () => {
    const result = agenticaGovernanca('product-manager', 'executar', 'basic');
    expect(result.autorizado).toBe(true);
    expect(result.budget_info).toBeDefined();
    expect(result.budget_info!.limite_usd).toBeGreaterThanOrEqual(0);
  });

  it('unauthorized RBAC: dev-basic (basic) cannot access admin level', () => {
    const result = agenticaGovernanca('dev-basic', 'executar', 'admin');
    expect(result.autorizado).toBe(false);
    expect(result.rbac_nivel).toBe('basic');
    expect(result.rbac_nivel_requerido).toBe('admin');
    expect(result.motivo).toContain('insuficiente');
  });

  it('persona not found: nonexistent returns autorizado=false', () => {
    const result = agenticaGovernanca('nonexistent', 'executar', 'basic');
    expect(result.autorizado).toBe(false);
    expect(result.rbac_nivel).toBe('unknown');
    expect(result.motivo).toContain('nao encontrada');
  });

  it('rate_limit_info has required fields when authorized', () => {
    const result = agenticaGovernanca('product-manager', 'executar', 'basic');
    expect(result.rate_limit_info).toBeDefined();
    expect(result.rate_limit_info).toHaveProperty('used_per_min');
    expect(result.rate_limit_info).toHaveProperty('limit_per_min');
    expect(result.rate_limit_info).toHaveProperty('remaining');
    expect(result.rate_limit_info).toHaveProperty('reset_ms');
  });
});
