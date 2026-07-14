/**
 * tRPC Router: Dashboard Statistics
 * Provides type-safe, resolutivo access to 2,402-project ecosystem data.
 */
import { z } from 'zod';
import { createTRPCRouter, publicProcedure } from '../trpc';
import { db } from '@/lib/db';

export const dashboardRouter = createTRPCRouter({
  /**
   * Fetch all 10 dashboard panel data points in a single type-safe call.
   * Replaces the previous REST /api/projects/stats endpoint.
   */
  stats: publicProcedure
    .input(z.void().optional())
    .query(async () => {
      const [total, active, closed, developing, byCategoryRaw, byMonthRaw, bySourceRaw, topAuthorsRaw] =
        await Promise.all([
          db.project.count(),
          db.project.count({ where: { status: 'active' } }),
          db.project.count({ where: { status: 'closed' } }),
          db.project.count({ where: { status: 'developing' } }),
          db.project.groupBy({ by: ['category'], _count: { category: true } }),
          db.project.groupBy({
            by: ['dateAdded'],
            _count: { dateAdded: true },
            orderBy: { dateAdded: 'desc' },
            take: 24,
          }),
          db.project.groupBy({ by: ['source'], _count: { source: true } }),
          db.project.groupBy({
            by: ['author'],
            _count: { author: true },
            orderBy: { _count: { author: 'desc' } },
            take: 10,
          }),
        ]);

      const byCategory: Record<string, number> = {};
      for (const c of byCategoryRaw) byCategory[c.category] = c._count.category;

      const bySource: Record<string, number> = {};
      for (const s of bySourceRaw) bySource[s.source] = s._count.source;

      const byMonth = byMonthRaw
        .map((m) => ({ month: m.dateAdded, count: m._count.dateAdded }))
        .reverse();

      const topAuthors = topAuthorsRaw.map((a) => ({
        name: a.author,
        count: a._count.author,
      }));

      const uniqueAuthors = await db.project
        .groupBy({ by: ['author'] })
        .then((r) => r.length);

      const cityRaw = await db.project.groupBy({
        by: ['authorCity'],
        _count: { authorCity: true },
        where: { authorCity: { not: null, not: '' } },
        orderBy: { _count: { authorCity: 'desc' } },
        take: 10,
      });
      const topCities = cityRaw.map((c) => ({
        city: c.authorCity,
        count: c._count.authorCity,
      }));

      const recentProjects = await db.project.findMany({
        orderBy: { dateAdded: 'desc' },
        take: 5,
        select: {
          name: true,
          author: true,
          category: true,
          dateAdded: true,
          url: true,
        },
      });

      return {
        total,
        active,
        closed,
        developing,
        byCategory,
        byMonth,
        bySource,
        topAuthors,
        uniqueAuthors,
        topCities,
        recentProjects,
      };
    }),
});