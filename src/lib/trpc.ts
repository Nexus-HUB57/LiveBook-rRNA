/**
 * tRPC Client — React hooks for type-safe data fetching.
 * Uses @trpc/react-query for automatic caching and revalidation.
 */
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '@/server/root';

export const trpc = createTRPCReact<AppRouter>();