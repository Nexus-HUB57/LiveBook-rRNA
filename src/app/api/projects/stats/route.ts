import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const [total, active, closed, developing, byCategoryRaw, byMonthRaw, bySourceRaw, topAuthorsRaw] =
    await Promise.all([
      db.project.count(),
      db.project.count({ where: { status: "active" } }),
      db.project.count({ where: { status: "closed" } }),
      db.project.count({ where: { status: "developing" } }),
      db.project.groupBy({ by: ["category"], _count: { category: true } }),
      db.project.groupBy({ by: ["dateAdded"], _count: { dateAdded: true }, orderBy: { dateAdded: "desc" }, take: 24 }),
      db.project.groupBy({ by: ["source"], _count: { source: true } }),
      db.project.groupBy({ by: ["author"], _count: { author: true }, orderBy: { _count: { author: "desc" } }, take: 10 }),
    ]);

  const byCategory: Record<string, number> = {};
  for (const c of byCategoryRaw) byCategory[c.category] = c._count.category;

  const bySource: Record<string, number> = {};
  for (const s of bySourceRaw) bySource[s.source] = s._count.source;

  const byMonth = byMonthRaw.map((m) => ({ date: m.dateAdded, count: m._count.dateAdded })).reverse();
  const topAuthors = topAuthorsRaw.map((a) => ({ author: a.author, count: a._count.author }));

  return NextResponse.json({ total, active, closed, developing, byCategory, byMonth, bySource, topAuthors });
}