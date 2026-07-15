/**
 * ═══════════════════════════════════════════════════════════════
 * tRPC Router: ORCHESTRATION — Protocolo Reativo Gerativo
 * ═══════════════════════════════════════════════════════════════
 *
 * Expose o Orchestration Director, Self-Healing Engine e
 * Wisdom Engine via tRPC procedures.
 *
 * Nenhuma orquestração via link — tudo é acionamento real
 * de Skills e algoritmos em ambiente real.
 */
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import {
  runOrchestrationCycle,
  getOrchestrationStatus,
  activateSkill,
  getActiveSkillsRegistry,
  startOrchestrationLoop,
  stopOrchestrationLoop,
  isOrchestrationLoopRunning,
} from '@/lib/orchestration-director';
import { getWisdomState, getWisdomPatterns, getWisdomInsights, getDecisionMemory } from '@/lib/wisdom-engine';
import { getHealingHistory, getLastHealingCycle } from '@/lib/self-healing-engine';

export const orchestrationRouter = createTRPCRouter({
  /**
   * Execute a single full orchestration cycle:
   * INVOKE → DETECT → HEAL → LEARN → DIRECT → PERSIST
   */
  executeCycle: publicProcedure.mutation(async () => {
    const result = await runOrchestrationCycle(true);
    return result;
  }),

  /**
   * Get full orchestration status: last cycle, wisdom, healing, history.
   */
  status: publicProcedure.query(async () => {
    return getOrchestrationStatus();
  }),

  /**
   * Activate a specific skill on a specific panel (real directive).
   */
  activateSkill: publicProcedure
    .input(z.object({
      panelId: z.string(),
      skillName: z.string(),
      params: z.record(z.number()).optional().default({}),
    }))
    .mutation(async ({ input }) => {
      return activateSkill(input.panelId, input.skillName, input.params);
    }),

  /**
   * Get the registry of all active skills available for directive activation.
   */
  skillsRegistry: publicProcedure.query(async () => {
    return getActiveSkillsRegistry();
  }),

  /**
   * Get wisdom state — how much the system has learned.
   */
  wisdomState: publicProcedure.query(async () => {
    return getWisdomState();
  }),

  /**
   * Get wisdom patterns — recurring anomalies the system has identified.
   */
  wisdomPatterns: publicProcedure.query(async () => {
    return getWisdomPatterns();
  }),

  /**
   * Get wisdom insights — learnings and correlations discovered.
   */
  wisdomInsights: publicProcedure.query(async () => {
    return getWisdomInsights();
  }),

  /**
   * Get decision memory — history of healing decisions and outcomes.
   */
  decisionMemory: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(50).default(20) }).optional())
    .query(async ({ input }) => {
      return getDecisionMemory(input?.limit ?? 20);
    }),

  /**
   * Get healing history — past healing cycles.
   */
  healingHistory: publicProcedure
    .input(z.object({ limit: z.number().min(1).max(20).default(10) }).optional())
    .query(async ({ input }) => {
      return getHealingHistory(input?.limit ?? 10);
    }),

  /**
   * Start the perpetual orchestration loop with self-healing + wisdom.
   * Auto-sufficient, self-directing, exponential memory growth.
   */
  startLoop: publicProcedure
    .input(z.object({
      intervalMs: z.number().min(5000).default(10000),
      maxCycles: z.number().min(1).default(100),
    }).optional())
    .mutation(async ({ input }) => {
      return startOrchestrationLoop(input?.intervalMs, input?.maxCycles);
    }),

  /**
   * Stop the perpetual orchestration loop.
   */
  stopLoop: publicProcedure.mutation(async () => {
    return stopOrchestrationLoop();
  }),

  /**
   * Get loop running state.
   */
  loopRunning: publicProcedure.query(async () => {
    const running = isOrchestrationLoopRunning();
    const status = await getOrchestrationStatus();
    return { running, ...status };
  }),
});