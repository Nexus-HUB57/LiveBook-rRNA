/**
 * tRPC Root Router — Colibri Orchestration Architecture
 * Routers: dashboard, colibri, agents, orchestration
 */
import { createTRPCRouter } from './trpc';
import { dashboardRouter } from './routers/dashboard';
import { colibriRouter } from './routers/colibri';
import { agentsRouter } from './routers/agents';
import { orchestrationRouter } from './routers/orchestration';

export const appRouter = createTRPCRouter({
  dashboard: dashboardRouter,
  colibri: colibriRouter,
  agents: agentsRouter,
  orchestration: orchestrationRouter,
});

export type AppRouter = typeof appRouter;