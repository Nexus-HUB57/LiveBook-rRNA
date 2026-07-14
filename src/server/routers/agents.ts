/**
 * tRPC Router: Agents — Dynamic Hub with Live GitHub Sync
 * Transforms the Agent Hub from static seed data to a live, resolutivo system.
 */
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '@/lib/db';
import {
  syncAllAgents,
  getAgentSyncData,
  getLastSyncTime,
} from '@/lib/github-sync';

export const agentsRouter = createTRPCRouter({
  /**
   * List all agents with skills, knowledge counts, and live sync metadata.
   */
  list: publicProcedure.query(async () => {
    const agents = await db.agent.findMany({
      include: {
        skills: {
          select: {
            name: true,
            category: true,
            description: true,
            enabled: true,
          },
        },
        _count: { select: { knowledge: true, messages: true } },
      },
      orderBy: { createdAt: 'asc' },
    });

    const summary = {
      total: agents.length,
      core: agents.filter((a) => a.tier === 'core').length,
      withVoice: agents.filter((a) => a.hasVoice).length,
      withRag: agents.filter((a) => a.hasRag).length,
      withBtc: agents.filter((a) => a.hasBtc).length,
      totalSkills: agents.reduce((s, a) => s + a.skills.length, 0),
      totalFlows: agents.reduce((s, a) => s + a.flowCount, 0),
      totalApis: agents.reduce((s, a) => s + a.apiCount, 0),
      totalKnowledge: agents.reduce((s, a) => s + a._count.knowledge, 0),
      types: [...new Set(agents.map((a) => a.agentType))],
    };

    // Fetch live sync data for each agent
    const syncDataMap: Record<string, Record<string, unknown> | null> = {};
    for (const agent of agents) {
      syncDataMap[agent.slug] = await getAgentSyncData(agent.slug);
    }

    const lastSync = await getLastSyncTime();

    return { agents, summary, syncData: syncDataMap, lastSync };
  }),

  /**
   * Trigger live GitHub sync — fetches real repo data for all 5 agents.
   * Returns updated sync results with stars, forks, commits, etc.
   */
  sync: publicProcedure.mutation(async () => {
    const result = await syncAllAgents();
    return result;
  }),

  /**
   * Get sync status without triggering a new sync.
   */
  syncStatus: publicProcedure.query(async () => {
    const lastSync = await getLastSyncTime();
    const agents = await db.agent.findMany({
      select: { slug: true, name: true, status: true, updatedAt: true },
    });

    const statuses: Record<
      string,
      { status: string; updatedAt: Date; syncData: Record<string, unknown> | null }
    > = {};
    for (const agent of agents) {
      statuses[agent.slug] = {
        status: agent.status,
        updatedAt: agent.updatedAt,
        syncData: await getAgentSyncData(agent.slug),
      };
    }

    return { lastSync, agents: statuses };
  }),
});