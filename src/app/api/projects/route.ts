import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const source = searchParams.get("source") || "";
  const status = searchParams.get("status") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(Math.max(1, parseInt(searchParams.get("limit") || "20")), 50);

  // Build where clause
  const andConditions: Record<string, unknown>[] = [];

  if (search) {
    andConditions.push({
      OR: [
        { name: { contains: search } },
        { description: { contains: search } },
        { author: { contains: search } },
      ],
    });
  }
  if (category && category !== "all") andConditions.push({ category });
  if (source && source !== "all") andConditions.push({ source });
  if (status && status !== "all") andConditions.push({ status });

  const where = andConditions.length > 0 ? { AND: andConditions } : {};

  // Sort
  const orderBy = sort === "oldest"
    ? { dateAdded: "asc" }
    : sort === "name"
      ? { name: "asc" }
      : sort === "author"
        ? { author: "asc" }
        : { dateAdded: "desc" };

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.project.count({ where }),
  ]);

  // Get all categories, sources, and statuses for filters
  const [categories, sources, statuses] = await Promise.all([
    db.project.groupBy({ by: ["category"], _count: { category: true }, orderBy: { _count: { category: "desc" } } }),
    db.project.groupBy({ by: ["source"], _count: { source: true }, orderBy: { _count: { source: "desc" } } }),
    db.project.groupBy({ by: ["status"], _count: { status: true }, orderBy: { _count: { status: "desc" } } }),
  ]);

  return NextResponse.json({
    projects,
    total,
    page,
    totalPages: Math.max(1, Math.ceil(total / limit)),
    categories: categories.map((c) => ({ name: c.category, count: c._count.category })),
    sources: sources.map((s) => ({ name: s.source, count: s._count.source })),
    statuses: statuses.map((s) => ({ name: s.status, count: s._count.status })),
  });
}