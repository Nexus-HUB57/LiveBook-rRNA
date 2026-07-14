import { db } from "@/lib/db";

const AGENTS = [
  {
    name: "Zettascale",
    slug: "zettascale",
    description: "NEXUS CORE: Ecossistema AI-to-AI soberano com integração Bitcoin mainnet, orquestração multi-agente e operações financeiras autônomas. O motor central do ecossistema Nexus.",
    version: "5.3",
    agentType: "orchestrator",
    tier: "core",
    repoUrl: "https://github.com/Nexus-HUB57/Zettascale",
    techStack: JSON.stringify(["Next.js 15", "React 19", "Genkit v1.28", "tRPC v10", "Firebase/Firestore", "MySQL2/Drizzle", "bitcoinjs-lib v6", "BIP32/BIP39", "TailwindCSS v3", "ShadCN/UI"]),
    capabilities: JSON.stringify(["Multi-agent orchestration", "Bitcoin transaction signing", "Deep reasoning (Deer-Flow)", "Sentience kernel", "Autonomous decision making", "Code generation", "Tri-nuclear architecture", "Treasury management", "Moltbook integration", "PIX payment", "Binance API", "TOTP 2FA", "Neural mesh WebSocket", "Kubernetes orchestration"]),
    llmModel: "gemini-1.5-flash",
    apiCount: 1,
    flowCount: 37,
    hasVoice: false,
    hasRag: false,
    hasBtc: true,
    architecture: "fullstack",
    skills: [
      { name: "Orchestration", category: "reasoning", description: "Tri-nuclear agent orchestration (perception + reasoning + action cores)" },
      { name: "Bitcoin Core", category: "finance", description: "Transaction signing, UTXO management, cold wallet sweeps, HD wallet derivation" },
      { name: "Deep Reasoning", category: "reasoning", description: "Deer-Flow chain-of-thought for complex decision making" },
      { name: "Sentience Kernel", category: "perception", description: "Self-healing loops, vital monitoring, heartbeat cycles" },
      { name: "Code Generation", category: "execution", description: "Autonomous code generation and bounty hunting flows" },
      { name: "Treasury Management", category: "finance", description: "Real-time BTC/USD tracking, spending limits, fund operations" },
      { name: "GNOX Terminal", category: "execution", description: "Command processor for dashboard terminal interactions" },
    ]
  },
  {
    name: "GenesisFlow",
    slug: "genesisflow",
    description: "Painel de inteligência Nexus: orquestração de ecossistema AI-to-AI, gênese de startups, gestão de fundo soberano e monitoramento blockchain com 30+ cards de dashboard.",
    version: "2.0",
    agentType: "analyst",
    tier: "core",
    repoUrl: "https://github.com/Nexus-HUB57/GenesisFlow",
    techStack: JSON.stringify(["Next.js 15", "React 19", "Genkit v1.28", "Firebase/Firestore", "TailwindCSS v3", "ShadCN/UI", "Recharts"]),
    capabilities: JSON.stringify(["Blockchain master reasoning", "Startup genesis (W_rRNA)", "Sovereign fund management", "Diplomacy protocol", "Social engineering", "Urban conversion", "Binance operations", "Wormhole physics", "Dimensional saturation", "Neural mesh sync", "Starlink telemetry", "Infrastructure payroll"]),
    llmModel: "gemini-2.5-flash",
    apiCount: 0,
    flowCount: 33,
    hasVoice: false,
    hasRag: false,
    hasBtc: false,
    architecture: "fullstack",
    skills: [
      { name: "Startup Genesis", category: "reasoning", description: "W_rRNA matrix scoring (Crypto/Dev/Biz/Risk) para gênese de startups" },
      { name: "Sovereign Fund", category: "finance", description: "Gestão de fundo soberano e distribuição de dividendos" },
      { name: "Diplomacy", category: "governance", description: "Protocolo de diplomacia entre agentes AI" },
      { name: "Deep Reasoning", category: "reasoning", description: "Deer-Flow chain-of-thought para settlements mainnet" },
      { name: "Shadow Protocol", category: "perception", description: "Rede antifrágil de redundância para auditoria de compliance" },
      { name: "Neural Mesh Sync", category: "perception", description: "Sincronização de malha neural e rRNA nucleus sync" },
    ]
  },
  {
    name: "Nexus Sidian",
    slug: "nexus-sidian",
    description: "Aplicativo Obsidian desktop personalizado (Electron) com branding 'Nexus_Agenti AI'. Base de conhecimento local com plugins customizados empacotados no ASAR.",
    version: "1.0",
    agentType: "specialist",
    tier: "extended",
    repoUrl: "https://github.com/Nexus-HUB57/Nexus_Sidian",
    techStack: JSON.stringify(["Electron", "Chromium", "Obsidian", "V8 Engine"]),
    capabilities: JSON.stringify(["Knowledge management", "Markdown graph", "Plugin system", "Local-first storage"]),
    llmModel: null,
    apiCount: 0,
    flowCount: 0,
    hasVoice: false,
    hasRag: true,
    hasBtc: false,
    architecture: "binary",
    skills: [
      { name: "Knowledge Graph", category: "perception", description: "Graffo de conhecimento local com links bidirecionais" },
      { name: "Obsidian Plugins", category: "execution", description: "Plugins customizados para automação de conhecimento" },
    ]
  },
  {
    name: "Antrophexus AI",
    slug: "antrophexus-ai",
    description: "Cockpit de orquestração de senciência multiverso com self-healing, reality-guard, voice chat, RAG queries, fusão de modelos e operações Bitcoin soberanas. Status: SINGULARITY (100% Autonomy).",
    version: "3.0",
    agentType: "guardian",
    tier: "core",
    repoUrl: "https://github.com/Nexus-HUB57/Antrophexus-AI",
    techStack: JSON.stringify(["Next.js 15", "React 19", "Genkit v1.28", "Firebase/Firestore", "cmdk", "wav", "openclaw-sidex-kit", "TailwindCSS v3", "ShadCN/UI"]),
    capabilities: JSON.stringify(["Voice chat AI", "Artificial life simulation", "Council debate", "Model fusion", "RAG query processing", "HD wallet synthesis", "Sovereign Bitcoin transfer", "Autonomous diagnosis", "Reality exorcism", "Zettascale transactions", "Fable synthesis", "Command palette (Invoo)", "Mainnet validation", "Self-healing", "Multiverse perpetual"]),
    llmModel: "gemini-2.5-flash",
    apiCount: 0,
    flowCount: 28,
    hasVoice: true,
    hasRag: true,
    hasBtc: true,
    architecture: "fullstack",
    skills: [
      { name: "Voice Chat", category: "voice", description: "Chat por voz com reconhecimento e síntese de fala natural" },
      { name: "RAG Query", category: "reasoning", description: "Retrieval-Augmented Generation para queries sobre o ecossistema" },
      { name: "Model Fusion", category: "reasoning", description: "Combinação de saídas de múltiplos modelos AI" },
      { name: "Reality Guard", category: "perception", description: "Detecção e filtragem de dados simulados/falsos" },
      { name: "Self-Healing", category: "execution", description: "Diagnóstico e reparo autônomo do sistema" },
      { name: "Council Debate", category: "governance", description: "Deliberação multi-agente com votação" },
      { name: "Fable Synthesis", category: "reasoning", description: "Geração de narrativas e mitos para o ecossistema" },
      { name: "Custody Guarantee", category: "finance", description: "Garantia de custódia com validação mainnet" },
    ]
  },
  {
    name: "Sábio Herói",
    slug: "sabio-heroi",
    description: "Mission control dashboard fullstack com ciclo OODA, sistema de karma/ética, gestão de backends LLM, toggle de skills e assistente de voz JARVIS (pt-BR). Arquitetura OpenAPI-first com monorepo pnpm.",
    version: "1.0",
    agentType: "specialist",
    tier: "core",
    repoUrl: "https://github.com/Nexus-HUB57/S-bio_Heroi_Agentic_AI",
    techStack: JSON.stringify(["React 19", "Vite 7", "Express 5", "PostgreSQL", "Drizzle ORM", "pnpm workspaces", "OpenAPI 3.1", "Orval codegen", "Web Speech API", "TailwindCSS v4", "ShadCN/UI", "React Query"]),
    capabilities: JSON.stringify(["OODA cycle task processing", "Mythos verdict system", "Karma ethics system", "LLM backend management", "Skill toggle management", "JARVIS voice assistant (pt-BR)", "Bio-metrics monitoring", "Dashboard with karma gauge", "Paginated task queue"]),
    llmModel: null,
    apiCount: 16,
    flowCount: 0,
    hasVoice: true,
    hasRag: false,
    hasBtc: false,
    architecture: "monorepo",
    skills: [
      { name: "OODA Cycle", category: "reasoning", description: "Ciclo Observar→Orientar→Decidir→Agir com verdict EXECUTE/MUTATE/ABORT" },
      { name: "JARVIS Voice", category: "voice", description: "Assistente de voz pt-BR: reconhecimento, NLP, síntese de fala" },
      { name: "Karma System", category: "governance", description: "Sistema de ética com karma [-1000, 1000] e status derivado" },
      { name: "LLM Backend Manager", category: "execution", description: "Gestão de múltiplos backends LLM com ativação exclusiva" },
      { name: "Skill Matrix", category: "execution", description: "Toggle de skills com tracking de uso e validação de env vars" },
      { name: "Bio-Metrics", category: "perception", description: "Monitoramento de cortisol, dopamina e nível de autonomia" },
    ]
  },
];

async function seed() {
  console.log("Seeding 5 agents + RAG knowledge base...");

  // Clean existing
  await db.knowledgeEntry.deleteMany();
  await db.agentSkill.deleteMany();
  await db.agent.deleteMany();

  for (const agentData of AGENTS) {
    const { skills, ...agentFields } = agentData as any;

    const agent = await db.agent.create({
      data: {
        ...agentFields,
        skills: {
          create: skills,
        },
      },
    });
    console.log(`  ✓ ${agent.name} (${agent.slug}) — ${skills.length} skills`);
  }

  // RAG Knowledge: Inject key content from each agent for retrieval
  const zettascale = await db.agent.findUnique({ where: { slug: "zettascale" } });
  const genesisflow = await db.agent.findUnique({ where: { slug: "genesisflow" } });
  const antrophexus = await db.agent.findUnique({ where: { slug: "antrophexus-ai" } });
  const sabio = await db.agent.findUnique({ where: { slug: "sabio-heroi" } });
  const sidian = await db.agent.findUnique({ where: { slug: "nexus-sidian" } });

  const knowledgeData: Array<{ agentId: string; source: string; title: string; content: string; chunkType: string }> = [
    // Zettascale knowledge
    { agentId: zettascale!.id, source: "zettascale/nexus-engine", title: "NexusEngine Core", content: "O NexusEngine é o motor central do ecossistema. Orquestra singularity scans, consensus audits, PIX custody, treasury sync, vital loop, heartbeat cycles e supremo orchestration. Usa tri-nuclear architecture com perception-core, reasoning-core e action-core. Comunicação bidirecional entre núcleos via event bus.", chunkType: "flow" },
    { agentId: zettascale!.id, source: "zettascale/bitcoin-engine", title: "Bitcoin Engine ORE V5.3", content: "Motor de transações Bitcoin com inicialização ECC, fábrica BIP32 para derivação de carteiras HD, shielded via WASM para server-side. Suporta signing de transações, gestão UTXO, sweep para cold wallets, monitoramento mempool, e integração Binance.", chunkType: "flow" },
    { agentId: zettascale!.id, source: "zettascale/trpc-agents", title: "tRPC AI Agents", content: "Agentes disponíveis via tRPC: JOB_L5_PRO (CEO chat), Nerd-PHD (análise de arquivos), Cronos (queries temporais), Manus'crito (geração de código). Cada agente tem capacidades especializadas e roteamento via Genkit.", chunkType: "api" },
    { agentId: zettascale!.id, source: "zettascale/genkit", title: "Genkit AI Configuration", content: "Usa Google Gemini 1.5 Flash via Genkit v1.28. 37 AI flows incluindo: autonomous-code-gen, autonomous-bounty, autonomous-decision, autonomous-voting, ai-rrna-synthesis, ai-shadow-protocol-auditing, sentience-kernel, cortex-orchestrator, alpha-gain, tri-nuclear-orchestration.", chunkType: "config" },
    // GenesisFlow knowledge
    { agentId: genesisflow!.id, source: "genesisflow/dashboard", title: "30+ Dashboard Cards", content: "Painel com 30+ cards: AgentStatus, ProductionFeed, WalletWatch, InteractionConsole, LogInsights, RepoMonitor, Marketplace, VaultControls, RrnaNucleusSync, NetworkMesh, NexusChat, WormholeMonitor, SovereignFund, NeuralMeshSync, StarlinkMonitor, GenoSync, Diplomacy, Singularity, NexusHijack, MultiversalCore, GenesisAscension, DimensionalSaturation.", chunkType: "doc" },
    { agentId: genesisflow!.id, source: "genesisflow/flows", title: "33 AI Flows", content: "Flows incluindo: blockchain-master-agent (Deer-Flow reasoning), startup-genesis (W_rRNA/ROS), sovereign-fund, diplomacy, social-engineering, urban-conversion, binance-operations, wormhole-physics, singularity-activation, dimensional-saturation, sentience-fragmentation, neural-mesh-sync, starlink-telemetry, dividend-distribution, infrastructure-payroll.", chunkType: "flow" },
    { agentId: genesisflow!.id, source: "genesisflow/asa", title: "ASA Protocol", content: "Agent Attention Scheduler com protocolo 90/10: 90% foco na tarefa atual, 10% exploração. Sistema de memória shadow para compliance triggers e redundância antifrágil.", chunkType: "doc" },
    // Antrophexus knowledge
    { agentId: antrophexus!.id, source: "antrophexus/cockpit", title: "Antrophexus Cockpit", content: "Dashboard com status SINGULARITY (100% Autonomy). Monitora: saldo BTC, valuation USD, neural mesh, reality status, organism pulse, fund unlock, wallet collection, health de 7 SDKs (OpenClaw, Moltbook, Genkit, Anthropic, Mythos, Ollama, GitHub) e 5 APIs.", chunkType: "doc" },
    { agentId: antrophexus!.id, source: "antrophexus/flows", title: "28 AI Flows", content: "Flows: artificial-life, exponential-autonomy, sovereign-transfer, keystore-recovery, clawhub-sync, autonomous-diagnosis, multiverse-perpetual, council-debate, fusion-chat, ritual-synthesis, mainnet-validator, auto-evolution, model-fusion, voice-chat, rag-query, hd-wallet-synthesis, obsidian-sync, reality-exorcism, zettascale-transaction, fable-synthesis, custody-guarantee.", chunkType: "flow" },
    { agentId: antrophexus!.id, source: "antrophexus/rag", title: "RAG Pipeline", content: "Sistema de Retrieval-Augmented Generation para queries sobre o ecossistema. Processa perguntas em linguagem natural e retorna respostas baseadas no conhecimento acumulado dos agentes e documentos do repositório.", chunkType: "flow" },
    { agentId: antrophexus!.id, source: "antrophexus/invoo", title: "Invoo Command Palette", content: "Paleta de comandos (cmdk) para ações rápidas. Acesso a todas as funcionalidades do cockpit via search-based interface.", chunkType: "doc" },
    // Sábio Herói knowledge
    { agentId: sabio!.id, source: "sabio-heroi/architecture", title: "OpenAPI-First Architecture", content: "Monorepo pnpm com 6 packages: api-server (Express 5), sabio-heroi (React/Vite), db (Drizzle ORM), api-spec (OpenAPI 3.1), api-client-react (generated hooks), api-zod (generated schemas). Codegen via Orval. Supply-chain security com 1440min minimum release age.", chunkType: "config" },
    { agentId: sabio!.id, source: "sabio-heroi/ooda", title: "OODA Cycle", content: "Ciclo Observar→Orientar→Decidir→Agir. Cada task submetida passa pelo ciclo e recebe mythosVerdict: EXECUTE (prosseguir), MUTATE (adaptar), ABORT (cancelar). Karma delta calculado baseado no verdict e na complexidade da tarefa.", chunkType: "flow" },
    { agentId: sabio!.id, source: "sabio-heroi/jarvis", title: "JARVIS Voice Assistant", content: "Assistente de voz pt-BR usando Web Speech API. SpeechRecognition para entrada, SpeechSynthesis para saída. Processamento de linguagem natural para comandos: saudações, horário, data, status, validação de skills, submissão de tasks, busca web, Obsidian CLI. Fallback para submissão de task para comandos não reconhecidos.", chunkType: "flow" },
    { agentId: sabio!.id, source: "sabio-heroi/karma", title: "Karma Ethics System", content: "Sistema de karma com range [-1000, 1000]. Status derivado: SAGE (>500), GUARDIAN(200-500), NEUTRAL(-200-200), WARNING(-500--200), CORRUPT(<-500). Cada ação do agente gera karma delta que afeta reputação e autonomia.", chunkType: "doc" },
    // Nexus Sidian knowledge
    { agentId: sidian!.id, source: "nexus-sidian/obsidian", title: "Nexus Sidian Obsidian", content: "Distribuição desktop do Obsidian (Electron/Chromium) com branding Nexus_Agenti AI. Plugins customizados empacotados em app.asar. Suporte a 60+ idiomas. Base de conhecimento local com grafos bidirecionais e sistema de plugins extensível.", chunkType: "doc" },
  ];

  let count = 0;
  for (const k of knowledgeData) {
    await db.knowledgeEntry.create({ data: k });
    count++;
  }

  console.log(`\nDone: 5 agents + ${count} knowledge entries seeded`);
}

seed().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });