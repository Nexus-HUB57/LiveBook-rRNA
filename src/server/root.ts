/**
 * tRPC Root Router — Aggregates all sub-routers.
 * This is the single entry point for all tRPC procedures.
 */
import { createTRPCRouter } from './trpc';
import { dashboardRouter } from './routers/dashboard';
import { agentsRouter } from './routers/agents';

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  agents: agentsRouter,
});

export type AppRouter = typeof appRouter;