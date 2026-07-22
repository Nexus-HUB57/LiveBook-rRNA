import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { routeChat } from "@/lib/9router-bridge";

async function llmAnalyze(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    const result = await routeChat({
      provider: 'glm',
      fallbackChain: ['glm', 'deepseek', 'groq'],
      messages: messages as any,
      maxTokens: 1024,
      timeoutMs: 20000,
      metadata: { source: 'agent-analyze' },
    });
    return result.content || '';
  } catch (err) {
    console.error('[LLM Analyze Error]', err);
    return '';
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const topByCategory = await db.project.groupBy({
      by: ["category"],
      _count: { category: true },
      orderBy: { _count: { category: "desc" } },
    });

    const sampleProjects = await db.project.findMany({
      take: 40,
      orderBy: { dateAdded: "desc" },
      select: { name: true, description: true, category: true, author: true, status: true },
    });

    const statsSummary = topByCategory
      .map((c) => `${c.category}: ${c._count.category} projetos`)
      .join("\n");

    const projectList = sampleProjects
      .slice(0, 20)
      .map((p) => `- [${p.category}] ${p.name} por ${p.author} (${p.status})`)
      .join("\n");

    const analysis = await llmAnalyze([
      { role: "system", content: "Voce e um analista de dados AI especializado em ecossistemas tech. Responda em Portugues (BR). Seja conciso com dados concretos." },
      { role: "user", content: `Analise o ecossistema de desenvolvedores independentes chineses:

## Distribuicao por Categoria:
${statsSummary}

## Projetos Recentes (amostra):
${projectList}

## Total de Categorias: ${topByCategory.length}
## Amostra: ${sampleProjects.length} de 2402 projetos totais

Forneca analise concisa cobrindo: top 3 categorias em tendencia, padroes notaveis, insights-chave, e recomendacoes. Ate 300 palavras.` },
    ]);

    return NextResponse.json({
      analysis: analysis || "Analise indisponivel.",
      categoryBreakdown: topByCategory,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}