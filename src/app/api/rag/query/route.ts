import { db } from "@/lib/db";
import { NextRequest, NextResponse } from "next/server";
import { rragPipeline, recursiveChunk } from "@/lib/rag-engine";

export async function POST(req: NextRequest) {
  try {
    const { query, agentSlug, topK } = await req.json();
    if (!query || typeof query !== "string") {
      return NextResponse.json({ error: "query string required" }, { status: 400 });
    }
    const k = Math.min(topK || 5, 10);

    // 1. FETCH knowledge entries from DB
    const where: Record<string, unknown> = {};
    if (agentSlug) {
      const agent = await db.agent.findUnique({ where: { slug: agentSlug } });
      if (agent) where.agentId = agent.id;
    }

    const entries = await db.knowledgeEntry.findMany({
      where,
      include: { agent: { select: { name: true, slug: true } } },
    });

    // 2. CHUNK large entries (Langchain-style recursive splitting)
    const documents: Array<{
      id: string;
      title: string;
      content: string;
      source: string;
      agentName: string;
      agentSlug: string;
      chunkType: string;
    }> = [];

    for (const entry of entries) {
      if (entry.content.length > 600) {
        // Apply recursive chunking for long documents
        const chunks = recursiveChunk(entry.content, 500, 50);
        for (let i = 0; i < chunks.length; i++) {
          documents.push({
            id: `${entry.id}#${i}`,
            title: `${entry.title} [${i + 1}/${chunks.length}]`,
            content: chunks[i],
            source: entry.source,
            agentName: entry.agent.name,
            agentSlug: entry.agent.slug,
            chunkType: entry.chunkType,
          });
        }
      } else {
        documents.push({
          id: entry.id,
          title: entry.title,
          content: entry.content,
          source: entry.source,
          agentName: entry.agent.name,
          agentSlug: entry.agent.slug,
          chunkType: entry.chunkType,
        });
      }
    }

    // 3. LLM Generator (with graceful degradation)
    const llmGenerator = async (context: string, q: string): Promise<string> => {
      if (process.env.ZAI_API_BASE_URL && process.env.ZAI_API_KEY) {
        try {
          const ZAI = (await import("z-ai-web-dev-sdk")).default;
          const client = new ZAI({
            baseUrl: process.env.ZAI_API_BASE_URL,
            apiKey: process.env.ZAI_API_KEY,
          });
          const result = await client.createChatCompletion({
            model: "glm-4-flash",
            messages: [
              {
                role: "system",
                content: `Voce e o rRNA Agent — um assistente RAG especializado no ecossistema Nexus HUB com 5 agentes AI.
Responda SEMPRE em Portugues brasileiro.
Use APENAS o contexto fornecido. Cite fontes como [1], [2].
Seja conciso, tecnico e preciso.
Se o contexto nao cobrir a pergunta, diga que a informacao nao esta disponivel na base.`,
              },
              {
                role: "user",
                content: `Contexto RAG rRNA:\n\n${context}\n\n---\n\nPergunta: ${q}`,
              },
            ],
            thinking: "disabled",
          });
          return result?.choices?.[0]?.message?.content || "";
        } catch (err) {
          console.error("[RAG rRNA] LLM Error:", err);
          throw err; // fallback to offline
        }
      }
      throw new Error("LLM not configured");
    };

    // 4. RUN RAG rRNA PIPELINE
    const result = await rragPipeline(query, documents, {
      topK: k,
      llmGenerator,
    });

    return NextResponse.json(result);
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("[RAG rRNA Pipeline Error]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET: Pipeline health + stats
export async function GET() {
  try {
    const totalEntries = await db.knowledgeEntry.count();
    const totalAgents = await db.agent.count();
    const agents = await db.agent.findMany({
      select: { name: true, slug: true, _count: { select: { knowledge: true } } },
    });

    return NextResponse.json({
      status: "operational",
      pipeline: "rRNA v2 — Langchain-style",
      stages: [
        "RecursiveChunking (chunkSize=500, overlap=50)",
        "TF-IDF Encoding (unigrams + bigrams)",
        "BM25 Retrieval (k1=1.5, b=0.75, title 2x boost)",
        "Cross-Encoder Reranking (phrase + n-gram + positional)",
        "Context Assembly (max 4000 chars)",
        "LLM Synthesis (GLM-4-Flash with fallback)",
      ],
      knowledgeBase: {
        totalEntries,
        totalAgents,
        agents: agents.map(a => ({ name: a.name, slug: a.slug, entries: a._count.knowledge })),
      },
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}