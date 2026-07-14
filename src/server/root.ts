/**
 * tRPC Root Router — Aggregates all sub-routers.
 * Single entry point for all tRPC procedures.
 * Routers: dashboard, agents, invocation (webhook + quantum panels).
 */
import { createTRPCRouter } from './trpc';
import { dashboardRouter } from './routers/dashboard';
import { agentsRouter } from './routers/agents';
import { invocationRouter } from './routers/invocation';

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  agents: agentsRouter,
  invocation: invocationRouter,
});

export type AppRouter = typeof appRouter;