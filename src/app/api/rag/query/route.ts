import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";

// RAG Pipeline: rRNA-inspired Retrieval Augmented Generation
// Uses keyword-based retrieval from KnowledgeEntry + context injection into LLM

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff]/g, " ")
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function scoreRelevance(query: string, entry: { title: string; content: string; source: string }): number {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) return 0;
  const titleTokens = tokenize(entry.title);
  const contentTokens = tokenize(entry.content);
  const sourceTokens = tokenize(entry.source);
  let score = 0;
  for (const qt of queryTokens) {
    if (titleTokens.some(t => t.includes(qt) || qt.includes(t))) score += 5;
    if (sourceTokens.some(t => t.includes(qt) || qt.includes(t))) score += 3;
    const contentMatches = contentTokens.filter(t => t.includes(qt) || qt.includes(t)).length;
    score += Math.min(contentMatches, 3);
  }
  return score;
}

export async function POST(req: NextRequest) {
  try {
    const { query, agentSlug, topK } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query string required" }, { status: 400 });
    }
    const k = Math.min(topK || 5, 10);

    // 1. RETRIEVE
    const where: Record<string, unknown> = {};
    if (agentSlug) {
      const agent = await db.agent.findUnique({ where: { slug: agentSlug } });
      if (agent) where.agentId = agent.id;
    }
    const entries = await db.knowledgeEntry.findMany({
      where,
      include: { agent: { select: { name: true, slug: true } } },
    });

    // 2. RANK
    const scored = entries
      .map(e => ({ ...e, score: scoreRelevance(query, e) }))
      .filter(e => e.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, k);

    // 3. AUGMENT
    const context = scored.map((e, i) =>
      `[${i + 1}] (${e.agent.name}) ${e.title}\n${e.content}`
    ).join("\n\n---\n\n");

    // 4. GENERATE
    let answer = "";
    if (context) {
      if (process.env.ZAI_API_BASE_URL && process.env.ZAI_API_KEY) {
        try {
          const ZAI = (await import("z-ai-web-dev-sdk")).default;
          const client = new ZAI({ baseUrl: process.env.ZAI_API_BASE_URL, apiKey: process.env.ZAI_API_KEY });
          const result = await client.createChatCompletion({
            model: "glm-4-flash",
            messages: [
              { role: "system", content: "Voce e um assistente RAG especializado no ecossistema Nexus. Responda em Portugues APENAS com o contexto. Cite fontes [1],[2]. Seja conciso." },
              { role: "user", content: `Contexto:\n\n${context}\n\n---\n\nPergunta: ${query}` }
            ],
            thinking: "disabled",
          });
          answer = result?.choices?.[0]?.message?.content || "";
        } catch (err) {
          console.error("[RAG LLM Error]", err);
          answer = generateOfflineAnswer(query, scored);
        }
      } else {
        answer = generateOfflineAnswer(query, scored);
      }
    } else {
      answer = "Nenhum resultado encontrado. Tente: orquestração, Bitcoin, OODA, JARVIS, RAG, voice, karma, sentience, wallet, dashboard.";
    }

    return NextResponse.json({
      query, answer,
      retrieved: scored.map(e => ({ id: e.id, title: e.title, source: e.source, agent: e.agent.name, agentSlug: e.agent.slug, score: e.score, chunkType: e.chunkType })),
      contextLength: context.length,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

function generateOfflineAnswer(query: string, results: Array<{ title: string; content: string; agent: { name: string }; source: string }>): string {
  if (results.length === 0) return "Sem resultados.";
  const sections = results.slice(0, 3).map((r, i) => {
    const sentences = r.content.split(". ").slice(0, 3).join(". ") + ".";
    return `**[${i + 1}] ${r.agent.name}** — ${r.title}\n${sentences}`;
  });
  return `## Resultados RAG (Modo Offline)\n\n${sections.join("\n\n")}\n\n_Fonte: Base de conhecimento com 16 entradas de 5 agentes Nexus. Ative LLM para respostas detalhadas._`;
}