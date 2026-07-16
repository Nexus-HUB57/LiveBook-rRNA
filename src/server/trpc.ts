/**
 * tRPC Server Setup — CHIMERA Multi-Agent Fusion Engine
 * Native tRPC for type-safe, resolutivo client-server communication.
 */
import { initTRPC, TRPCError } from '@trpc/server';
import superjson from 'superjson';

export const createTRPCContext = async () => {
  return {
    // Add auth/session context here when needed
  };
};

export type Context = Awaited<ReturnType<typeof createTRPCContext>>;

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const createTRPCRouter = t.router;
export const createCallerFactory = t.createCallerFactory;
export const publicProcedure = t.procedure;