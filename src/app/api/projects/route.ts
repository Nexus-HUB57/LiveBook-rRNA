import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";
  const source = searchParams.get("source") || "";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);

  const where: Record<string, unknown> = {};
  if (search) {
    where.OR = [
      { name: { contains: search } },
      { description: { contains: search } },
      { author: { contains: search } },
    ];
  }
  if (category && category !== "all") where.category = category;
  if (source && source !== "all") where.source = source;

  const orderBy = sort === "oldest" ? { dateAdded: "asc" } : { dateAdded: "desc" };

  const [projects, total] = await Promise.all([
    db.project.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    db.project.count({ where }),
  ]);

  // Get all categories and sources for filters
  const [categories, sources] = await Promise.all([
    db.project.findMany({ select: { category: true }, distinct: ["category"] }),
    db.project.findMany({ select: { source: true }, distinct: ["source"] }),
  ]);

  return NextResponse.json({
    projects,
    total,
    page,
    totalPages: Math.ceil(total / limit),
    categories: categories.map((c) => c.category),
    sources: sources.map((s) => s.source),
  });
}