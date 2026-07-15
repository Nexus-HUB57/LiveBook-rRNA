/**
 * tRPC Router: Colibri Engine
 * Type-safe access to Colibri orchestration data.
 */
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '@/lib/db';

const COLIBRI_BASE = process.env.COLIBRI_URL || 'http://127.0.0.1:8000';

async function fetchColibri(path: string, timeout = 5000) {
  try {
    const res = await fetch(`${COLIBRI_BASE}${path}`, { signal: AbortSignal.timeout(timeout) });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export const colibriRouter = createTRPCRouter({
  health: publicProcedure.query(async () => {
    const data = await fetchColibri('/health');
    if (!data) {
      return {
        status: 'offline',
        scheduler: null,
        tiers: null,
        hwinfo: null,
        kvSlots: 0,
      };
    }
    return {
      status: data.status || 'unknown',
      scheduler: data.scheduler || null,
      tiers: data.tiers || null,
      hwinfo: data.hwinfo || null,
      kvSlots: data.kv_slots || 0,
    };
  }),

  models: publicProcedure.query(async () => {
    const data = await fetchColibri('/v1/models');
    return (data?.data || []).map((m: { id: string }) => m.id);
  }),

  experts: publicProcedure.query(async () => {
    return fetchColibri('/experts');
  }),

  // Orchestration cycles
  cycles: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.orchestrationCycle.findMany({
        orderBy: { createdAt: 'desc' },
        take: input?.limit || 20,
      });
    }),

  healingEvents: publicProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ input }) => {
      return db.healingEvent.findMany({
        orderBy: { createdAt: 'desc' },
        take: input?.limit || 30,
      });
    }),

  wisdomEntries: publicProcedure.query(async () => {
    return db.wisdomEntry.findMany({
      orderBy: { weight: 'desc' },
      take: 20,
    });
  }),

  // Dashboard aggregate stats
  dashboardStats: publicProcedure.query(async () => {
    const [totalCycles, completedCycles, failedCycles, totalHealing, totalAnomalies, wisdomCount] =
      await Promise.all([
        db.orchestrationCycle.count(),
        db.orchestrationCycle.count({ where: { status: 'completed' } }),
        db.orchestrationCycle.count({ where: { status: 'failed' } }),
        db.healingEvent.count({ where: { result: 'success' } }),
        db.healingEvent.count(),
        db.wisdomEntry.count(),
      ]);

    const lastCycle = await db.orchestrationCycle.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const health = await fetchColibri('/health');

    return {
      cycles: { total: totalCycles, completed: completedCycles, failed: failedCycles, lastCycle },
      healing: { total: totalHealing, totalAnomalies, successRate: totalAnomalies > 0 ? Math.round((totalHealing / totalAnomalies) * 100) : 0 },
      wisdom: { count: wisdomCount },
      engine: health ? {
        status: health.status,
        active: Number(health.scheduler?.active || 0),
        capacity: health.scheduler?.capacity || 0,
        queued: health.scheduler?.queued || 0,
        completed: health.scheduler?.completed || 0,
        tiers: health.tiers || null,
        hwinfo: health.hwinfo || null,
        kvSlots: health.kv_slots || 0,
      } : null,
    };
  }),
});