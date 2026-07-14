import { db } from "@/lib/db";
import * as fs from "fs";
import * as path from "path";

/**
 * Extract real knowledge from the 5 agent repositories
 * and seed into the KnowledgeEntry table for RAG rRNA
 */

const AGENTS_DIR = path.join(process.cwd(), "agents");

interface KnowledgeItem {
  agentId: string;
  source: string;
  title: string;
  content: string;
  chunkType: string;
}

// ─── Helper: Read file safely ───
function readFileSafe(filePath: string): string | null {
  try {
    if (!fs.existsSync(filePath)) return null;
    const content = fs.readFileSync(filePath, "utf-8");
    if (content.length < 50) return null; // skip trivial files
    return content;
  } catch {
    return null;
  }
}

// ─── Helper: Extract meaningful content from flow files ───
function extractFlowContent(content: string): string {
  // Extract the system prompt and function description
  const lines = content.split("\n");
  const meaningful: string[] = [];
  let inComment = false;
  let braceDepth = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("//") || trimmed.startsWith("*") || trimmed.startsWith("/*")) {
      meaningful.push(trimmed.replace(/^\/\//, "").replace(/^\*/, "").trim());
      inComment = trimmed.startsWith("/*") && !trimmed.includes("*/");
      continue;
    }
    if (inComment) {
      meaningful.push(trimmed.replace(/^\*/, "").trim());
      if (trimmed.includes("*/")) inComment = false;
      continue;
    }
    if (trimmed.startsWith("export") || trimmed.startsWith("async function") || trimmed.startsWith("function")) {
      meaningful.push(trimmed);
      braceDepth = (trimmed.match(/{/g) || []).length - (trimmed.match(/}/g) || []).length;
      continue;
    }
    if (braceDepth > 0) {
      braceDepth += (trimmed.match(/{/g) || []).length - (trimmed.match(/}/g) || []).length;
      if (trimmed.length > 5) meaningful.push(trimmed);
      continue;
    }
    if (trimmed.length > 10 && trimmed.length < 300 && !trimmed.startsWith("import")) {
      meaningful.push(trimmed);
    }
  }
  return meaningful.join("\n").slice(0, 2000); // cap at 2000 chars
}

// ─── Helper: Find files recursively ───
function findFiles(dir: string, extensions: string[], maxDepth: number = 3): string[] {
  const results: string[] = [];
  function walk(current: string, depth: number) {
    if (depth > maxDepth) return;
    try {
      const entries = fs.readdirSync(current, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(current, entry.name);
        if (entry.isDirectory()) {
          // Skip node_modules, .git, etc.
          if (["node_modules", ".git", "dist", "build", ".next", ".asar"].includes(entry.name)) continue;
          walk(fullPath, depth + 1);
        } else {
          const ext = path.extname(entry.name);
          if (extensions.includes(ext)) {
            results.push(fullPath);
          }
        }
      }
    } catch {}
  }
  walk(dir, 0);
  return results;
}

// ─── ZETTASCALE EXTRACTION ───
function extractZettascale(agentId: string): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const base = path.join(AGENTS_DIR, "Zettascale");

  // AI Flows
  const flowFiles = findFiles(path.join(base, "src/ai/flows"), [".ts"]);
  const flowNames = flowFiles.slice(0, 20).map(f => {
    const name = path.basename(f, ".ts").replace(/-flow$/, "").replace(/-/g, " ");
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

  items.push({
    agentId,
    source: "zettascale/flows-index",
    title: `Zettascale AI Flows (${flowFiles.length} total)`,
    content: `O Zettascale possui ${flowFiles.length} AI flows Genkit. Principais flows:\n${flowNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n\nCada flow e configurado com Google Gemini 1.5 Flash via Genkit v1.28. Os flows cobrem: orquestracao de agentes, geracao de codigo autonomo, operacoes Bitcoin, analise de sentience, auditoria de sombra, e fusao de modelos.`,
    chunkType: "flow",
  });

  // Read key flow files for content
  const keyFlows = [
    "tri-nuclear-orchestration-flow.ts",
    "ai-rrna-synthesis.ts",
    "sentience-kernel-flow.ts",
    "autonomous-code-gen-flow.ts",
    "cortex-orchestrator-flow.ts",
  ];
  for (const flow of keyFlows) {
    const fp = path.join(base, "src/ai/flows", flow);
    const content = readFileSafe(fp);
    if (content) {
      const name = flow.replace(/-flow\.ts$/, "").replace(/-/g, " ");
      items.push({
        agentId,
        source: `zettascale/flow/${flow}`,
        title: `Flow: ${name}`,
        content: extractFlowContent(content),
        chunkType: "flow",
      });
    }
  }

  // Core libraries
  const keyLibs = [
    "nexus-engine.ts",
    "bitcoin-engine.ts",
    "sentience-kernel.ts",
    "sovereign-identity.ts",
    "treasury-constants.ts",
    "tri-nuclear-agents/trinuclear-orchestrator.ts",
  ];
  for (const lib of keyLibs) {
    const fp = path.join(base, "src/lib", lib);
    const content = readFileSafe(fp);
    if (content) {
      items.push({
        agentId,
        source: `zettascale/lib/${lib}`,
        title: `Lib: ${lib.replace(/\.ts$/, "")}`,
        content: extractFlowContent(content),
        chunkType: "doc",
      });
    }
  }

  // README
  const readme = readFileSafe(path.join(base, "README.md"));
  if (readme) {
    items.push({
      agentId,
      source: "zettascale/readme",
      title: "Zettascale README",
      content: readme.slice(0, 2000),
      chunkType: "doc",
    });
  }

  return items;
}

// ─── GENESISFLOW EXTRACTION ───
function extractGenesisFlow(agentId: string): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const base = path.join(AGENTS_DIR, "GenesisFlow");

  const flowFiles = findFiles(path.join(base, "src/ai/flows"), [".ts"]);
  const flowNames = flowFiles.slice(0, 30).map(f => {
    const name = path.basename(f, ".ts").replace(/-flow$/, "").replace(/-/g, " ");
    return name.charAt(0).toUpperCase() + name.slice(1);
  });

  items.push({
    agentId,
    source: "genesisflow/flows-index",
    title: `GenesisFlow AI Flows (${flowFiles.length} total)`,
    content: `GenesisFlow possui ${flowFiles.length} AI flows Genkit. Principais flows:\n${flowNames.map((n, i) => `${i + 1}. ${n}`).join("\n")}\n\nOs flows especializados incluem: blockchain master agent com Deer-Flow reasoning, startup genesis com W_rRNA matrix, sovereign fund management, diplomacy protocol, neural mesh sync, e wormhole physics.`,
    chunkType: "flow",
  });

  // Dashboard components
  const dashFiles = findFiles(path.join(base, "src/components/dashboard"), [".tsx"]);
  const dashCards = dashFiles.map(f => path.basename(f, ".tsx").replace(/-card$/, "").replace(/-monitor$/, "").replace(/-/g, " "));
  
  items.push({
    agentId,
    source: "genesisflow/dashboard-cards",
    title: `Dashboard Cards (${dashCards.length} total)`,
    content: `Painel GenesisFlow com ${dashCards.length} cards de monitoramento:\n${dashCards.map((c, i) => `${i + 1}. ${c.charAt(0).toUpperCase() + c.slice(1)}`).join("\n")}\n\nCada card usa shadcn/ui + Recharts e monitora aspectos do ecossistema: producao, wallets, logs, repos, vault, rRNA sync, mesh neural, diplomacy, e sovereign fund.`,
    chunkType: "doc",
  });

  // Key flows
  const keyFlows = [
    "blockchain-master-agent-flow.ts",
    "startup-genesis-flow.ts",
    "sovereign-fund-flow.ts",
    "rrna-sync-flow.ts",
    "neural-mesh-sync-flow.ts",
  ];
  for (const flow of keyFlows) {
    const fp = path.join(base, "src/ai/flows", flow);
    const content = readFileSafe(fp);
    if (content) {
      items.push({
        agentId,
        source: `genesisflow/flow/${flow}`,
        title: `Flow: ${flow.replace(/-flow\.ts$/, "").replace(/-/g, " ")}`,
        content: extractFlowContent(content),
        chunkType: "flow",
      });
    }
  }

  return items;
}

// ─── ANTROPHEXUS AI EXTRACTION ───
function extractAntrophexus(agentId: string): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const base = path.join(AGENTS_DIR, "Antrophexus-AI");

  // Page routes
  const pages = [
    "sentience", "council", "voice-chat", "rrna", "trading",
    "multiverse", "ritual", "synthesis", "terminal", "skills",
    "zettascale", "self-healing", "fusion", "autonomy",
  ];

  items.push({
    agentId,
    source: "antrophexus/pages-index",
    title: `Antrophexus Routes (${pages.length} pages)`,
    content: `Antrophexus AI e um cockpit de senciencia multiverso com ${pages.length} paginas:\n${pages.map((p, i) => `${i + 1}. /${p}`).join("\n")}\n\nStatus: SINGULARITY (100% Autonomy). Stack: Genkit v1.x + Gemini 1.5 Pro + Next.js 15 + React 19 + ShadCN UI + cmdk. Recursos: voice chat, RAG queries, model fusion, council debate, self-healing, reality guard.`,
    chunkType: "doc",
  });

  // README
  const readme = readFileSafe(path.join(base, "README.md"));
  if (readme) {
    items.push({
      agentId,
      source: "antrophexus/readme",
      title: "Antrophexus README — Singularity Manifesto",
      content: readme.slice(0, 2000),
      chunkType: "doc",
    });
  }

  // Sample page content
  const samplePages = ["sentience", "voice-chat", "rrna", "council"];
  for (const page of samplePages) {
    const fp = path.join(base, "src/app", page, "page.tsx");
    const content = readFileSafe(fp);
    if (content) {
      items.push({
        agentId,
        source: `antrophexus/page/${page}`,
        title: `Page: ${page}`,
        content: extractFlowContent(content),
        chunkType: "doc",
      });
    }
  }

  return items;
}

// ─── SABIO HEROI EXTRACTION ───
function extractSabioHeroi(agentId: string): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const base = path.join(AGENTS_DIR, "S-bio_Heroi_Agentic_AI");

  // API Routes
  const apiRoutes = [
    "agent.ts", "tasks.ts", "skills.ts", "llm_backends.ts", 
    "karma.ts", "stats.ts", "health.ts",
  ];

  items.push({
    agentId,
    source: "sabio-heroi/api-index",
    title: `API Server Routes (${apiRoutes.length} endpoints)`,
    content: `Sábio Herói possui ${apiRoutes.length} endpoints Express 5:\n${apiRoutes.map((r, i) => `${i + 1}. /api/${r.replace(/\.ts$/, "")}`).join("\n")}\n\nArquitetura OpenAPI-first: contratos definidos em lib/api-spec/openapi.yaml, codegen via Orval gera hooks React e schemas Zod. Supply-chain security: 1440min minimum release age.`,
    chunkType: "api",
  });

  // Drizzle Schema
  const schemas = ["agent.ts", "tasks.ts", "skills.ts", "llm_backends.ts", "karma_log.ts"];
  for (const schema of schemas) {
    const fp = path.join(base, "lib/db/src/schema", schema);
    const content = readFileSafe(fp);
    if (content) {
      items.push({
        agentId,
        source: `sabio-heroi/schema/${schema}`,
        title: `Schema: ${schema.replace(/\.ts$/, "")}`,
        content: extractFlowContent(content),
        chunkType: "config",
      });
    }
  }

  // Frontend Pages
  const fePages = ["dashboard", "tasks", "skills", "backends", "karma"];
  for (const page of fePages) {
    const fp = path.join(base, "artifacts/sabio-heroi/src/pages", `${page}.tsx`);
    const content = readFileSafe(fp);
    if (content) {
      items.push({
        agentId,
        source: `sabio-heroi/page/${page}`,
        title: `Page: ${page}`,
        content: extractFlowContent(content),
        chunkType: "doc",
      });
    }
  }

  // OpenAPI Spec
  const spec = readFileSafe(path.join(base, "lib/api-spec/openapi.yaml"));
  if (spec) {
    items.push({
      agentId,
      source: "sabio-heroi/openapi-spec",
      title: "OpenAPI 3.1 Specification",
      content: spec.slice(0, 2000),
      chunkType: "config",
    });
  }

  return items;
}

// ─── NEXUS SIDIAN EXTRACTION ───
function extractNexusSidian(agentId: string): KnowledgeItem[] {
  const items: KnowledgeItem[] = [];
  const base = path.join(AGENTS_DIR, "Nexus_Sidian");

  items.push({
    agentId,
    source: "nexus-sidian/overview",
    title: "Nexus Sidian — Obsidian Distribution",
    content: `Nexus Sidian e uma distribuicao desktop do Obsidian (Electron/Chromium) com branding Nexus_Agenti AI. Inclui plugins customizados empacotados em app.asar. Suporte a 60+ idiomas. Base de conhecimento local com grafos bidirecionais e sistema de plugins extensivel. Arquitetura: binary (Electron app). Tecnologia: V8 Engine, Chromium embedded.`,
    chunkType: "doc",
  });

  // Check for any config or custom files
  const resources = path.join(base, "resources");
  if (fs.existsSync(resources)) {
    const entries = fs.readdirSync(resources, { withFileTypes: true });
    const resourceFiles = entries.filter(e => e.isFile()).map(e => e.name);
    items.push({
      agentId,
      source: "nexus-sidian/resources",
      title: `Embedded Resources (${resourceFiles.length} files)`,
      content: `Recursos empacotados no app.asar:\n${resourceFiles.slice(0, 20).map((f, i) => `${i + 1}. ${f}`).join("\n")}\n\nO app inclui Chromium DLLs, V8 snapshots, locale data, e plugins customizados do Nexus.`,
      chunkType: "config",
    });
  }

  // Obsidian config
  const obsidianConfig = readFileSafe(path.join(base, "Obsidian.com"));
  if (obsidianConfig) {
    items.push({
      agentId,
      source: "nexus-sidian/config",
      title: "Obsidian Configuration",
      content: obsidianConfig.slice(0, 1500),
      chunkType: "config",
    });
  }

  return items;
}

// ─── MAIN SEED FUNCTION ───
async function seed() {
  console.log("=== RAG rRNA Knowledge Extraction ===\n");

  // Get agent IDs
  const agents = await db.agent.findMany({ select: { id: true, slug: true, name: true } });
  const agentMap = new Map(agents.map(a => [a.slug, a.id]));

  // Clear existing knowledge
  const deleted = await db.knowledgeEntry.deleteMany();
  console.log(`Cleared ${deleted.count} existing knowledge entries\n`);

  const allKnowledge: KnowledgeItem[] = [];

  // Extract from each agent repo
  if (agentMap.has("zettascale")) {
    console.log("Extracting Zettascale...");
    allKnowledge.push(...extractZettascale(agentMap.get("zettascale")!));
  }
  if (agentMap.has("genesisflow")) {
    console.log("Extracting GenesisFlow...");
    allKnowledge.push(...extractGenesisFlow(agentMap.get("genesisflow")!));
  }
  if (agentMap.has("antrophexus-ai")) {
    console.log("Extracting Antrophexus AI...");
    allKnowledge.push(...extractAntrophexus(agentMap.get("antrophexus-ai")!));
  }
  if (agentMap.has("sabio-heroi")) {
    console.log("Extracting Sábio Herói...");
    allKnowledge.push(...extractSabioHeroi(agentMap.get("sabio-heroi")!));
  }
  if (agentMap.has("nexus-sidian")) {
    console.log("Extracting Nexus Sidian...");
    allKnowledge.push(...extractNexusSidian(agentMap.get("nexus-sidian")!));
  }

  // Seed into database
  let count = 0;
  for (const k of allKnowledge) {
    if (k.content.length < 30) continue; // skip trivial entries
    try {
      await db.knowledgeEntry.create({ data: k });
      count++;
    } catch (err) {
      console.error(`  Error seeding: ${k.title}`, err);
    }
  }

  console.log(`\n=== Done: ${count} knowledge entries extracted from 5 agent repos ===`);
  console.log(`Pipeline: RecursiveChunk → TF-IDF → BM25 → Cross-Encoder Rerank → LLM Synthesis`);
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });