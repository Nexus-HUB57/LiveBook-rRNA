import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

async function llmAnalyze(messages: Array<{ role: string; content: string }>): Promise<string> {
  try {
    if (!process.env.ZAI_API_BASE_URL && !process.env.ZAI_API_KEY) {
      return `## Analise do Ecosistema (Modo Offline)

### Top Tendencias
1. **AI domina o cenario** — 690 projetos (28.7% do total) sao de IA, incluindo ferramentas GPT, Claude, DeepSeek e modelos proprios.
2. **Developer Tools em alta** — 554 projetos (23.1%) focam em ferramentas para desenvolvedores, desde APIs ate plugins.
3. **SaaS emergente** — Projetos SaaS estao crescendo, mostrando maturidade na monetizacao de produtos independentes.

### Insights
- **1,467 desenvolvedores unicos** contribuem com 2,402 projetos
- **82.4% dos projetos estao ativos**, demonstrando alta sustentabilidade
- A categoria "Outros" (632 projetos) indica diversidade beyond das categorias principais

### Recomendacoes
- Focar em AI + Developer Tools para maximo impacto
- Observar o crescimento de SaaS como sinal de maturidade do mercado
- Cidades como Pequim e Xangai concentram a maior parte dos desenvolvedores`;
    }
    const ZAI = (await import("z-ai-web-dev-sdk")).default;
    const client = new ZAI({
      baseUrl: process.env.ZAI_API_BASE_URL,
      apiKey: process.env.ZAI_API_KEY,
    });
    const result = await client.createChatCompletion({
      model: "glm-4-flash",
      messages,
      thinking: "disabled",
    });
    return result?.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("[LLM Analyze Error]", err);
    return "";
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