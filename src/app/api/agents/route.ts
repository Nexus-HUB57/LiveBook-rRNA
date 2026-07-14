import { db } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  const agents = await db.agent.findMany({
    include: {
      skills: { select: { name: true, category: true, description: true, enabled: true } },
      _count: { select: { knowledge: true, messages: true } },
    },
    orderBy: { createdAt: "asc" },
  });

  const summary = {
    total: agents.length,
    core: agents.filter(a => a.tier === "core").length,
    withVoice: agents.filter(a => a.hasVoice).length,
    withRag: agents.filter(a => a.hasRag).length,
    withBtc: agents.filter(a => a.hasBtc).length,
    totalSkills: agents.reduce((s, a) => s + a.skills.length, 0),
    totalFlows: agents.reduce((s, a) => s + a.flowCount, 0),
    totalApis: agents.reduce((s, a) => s + a.apiCount, 0),
    totalKnowledge: agents.reduce((s, a) => s + a._count.knowledge, 0),
    types: [...new Set(agents.map(a => a.agentType))],
  };

  return NextResponse.json({ agents, summary });
}