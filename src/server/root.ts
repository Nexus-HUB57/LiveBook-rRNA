/**
 * tRPC Root Router — Aggregates all sub-routers.
 * Single entry point for all tRPC procedures.
 * Routers: dashboard, agents, invocation, orchestration.
 */
import { createTRPCRouter } from './trpc';
import { dashboardRouter } from './routers/dashboard';
import { agentsRouter } from './routers/agents';
import { invocationRouter } from './routers/invocation';
import { orchestrationRouter } from './routers/orchestration';

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  agents: agentsRouter,
  invocation: invocationRouter,
  orchestration: orchestrationRouter,
});

export type AppRouter = typeof appRouter;