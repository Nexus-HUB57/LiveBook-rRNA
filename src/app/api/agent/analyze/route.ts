import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Fetch top projects by category for analysis
    const topByCategory = await db.project.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
      take: 11,
    });

    const sampleProjects = await db.project.findMany({
      take: 30,
      orderBy: { dateAdded: "desc" },
    });

    const projectNames = sampleProjects.map((p) => p.name);
    const descriptions = sampleProjects.map((p) => p.description);

    const res = await fetch("http://localhost:3001/analyze", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ projectNames, descriptions }),
    });

    if (!res.ok) {
      const err = await res.text();
      return NextResponse.json({ error: err }, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json({ ...data, categoryBreakdown: topByCategory });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}