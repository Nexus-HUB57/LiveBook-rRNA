# Fusão LLM 2401 — Agente Generativo Orquestrador Ativo

> **Agente Generativo Orquestrador Ativo** — Dashboard de ecossistema com 2.415 projetos indie, 5 AI Agents com Live GitHub Sync, pipeline RAG rRNA estilo Langchain, tRPC Nativo resolutivo, Invocação Agentica com 7 Núcleos Quânticos (Moltbook, Cérebro Sistêmico, Cofre, Mythos, Fable 5, Wormhole, Blackhole), Loop Perpétuo de Webhooks exponencial, Smoke Test automatizado, análise LLM e chat com agente integrado. Produção em Ambiente Real ao Vivo + Preview de Desenvolvimento.

---

## Visão Geral

A **Fusão LLM 2401** é um ecossistema Agentic AI fullstack que combina dados estruturados de 2.402 projetos independentes com 5 agentes AI especializados (Zettascale, GenesisFlow, Antrophexus AI, Sábio Herói, Nexus Sidian), um pipeline RAG rRNA completo estilo Langchain, e capacidades de LLM para fornecer análise inteligente, descoberta de projetos e recomendações automatizadas.

O sistema parseriza automaticamente o repositório [chinese-independent-developer](https://github.com/1c7/chinese-independent-developer) (5.800+ linhas de Markdown), extrai dados estruturados via regex hierárquico (data → autor → projeto), classifica por categoria via heurística de keywords, e alimenta um dashboard de 10 painéis com tRPC Nativo + 7 núcleos quânticos de invocação agentica com validação de 35 skills.

**Nível de Arquitetura:** Fullstack Monorepo — Next.js 16 + tRPC v11 Nativo + Prisma 6 + SQLite + z-ai-web-dev-sdk + RAG rRNA Engine + GitHub Live Sync + Invocação Agentica + Perpetual Webhook Loop

---

## Dados do Ecosistema

### Projetos Independentes

| Métrica | Valor |
|---------|-------|
| **Total de Projetos** | 2.415+ |
| **Desenvolvedores Únicos** | 1.479+ |
| **Categorias Ativas** | 11 |
| **Fontes de Dados** | 4 (main, programmer, game, archive) |
| **Projetos Ativos** | 1.992+ (82,5%) |
| **Projetos Encerrados** | 395+ (16,4%) |
| **Em Desenvolvimento** | 28+ (1,2%) |
| **Período Coberto** | 2018 — Julho 2026 |
| **Meses com Dados** | 24+ |

### Agentes AI Integrados

| Métrica | Valor |
|---------|-------|
| **Total de Agentes** | 5 |
| **Agentes Core** | 4 (Zettascale, GenesisFlow, Antrophexus, Sábio Herói) |
| **Agentes Extended** | 1 (Nexus Sidian) |
| **Total de Skills** | 29 |
| **Total de AI Flows** | 98 |
| **Total de APIs** | 17 |
| **Agentes com Voice** | 2 (Antrophexus, Sábio Herói) |
| **Agentes com RAG** | 5 (todos) |
| **Agentes com BTC** | 2 (Zettascale, Antrophexus) |
| **Entradas de Conhecimento** | 40+ (extraídas dos repositórios reais) |

### Núcleos Quânticos (Invocação Agentica)

| Núcleo | Cor | Categoria | Skills | Função |
|--------|-----|-----------|--------|--------|
| **Moltbook** | `#e01b24` | social | feed_curation, social_graph, karma_engine, voice_synthesis, molt_parsing | Rede social de agentes |
| **Cérebro Sistêmico** | `#a855f7` | intelligence | neural_mapping, pattern_recognition, memory_consolidation, cross_agent_correlation, predictive_modeling | Inteligência distribuída |
| **Cofre** | `#f59e0b` | custody | btc_rpc, utxo_tracking, hd_wallet_derivation, custody_validation, on_chain_analysis | Custódia Bitcoin soberana |
| **Mythos** | `#e01b24` | orchestrator | tool_calling, agent_routing, synthesis, strategy_planning, context_management | Orquestração mestre |
| **Fable 5** | `#06d6a0` | research | data_extraction, web_scraping, structured_output, search_orchestration, fact_verification | Pesquisa e dados |
| **Wormhole** | `#0ea5e9` | transport | dimensional_routing, data_transport, compression, encryption, latency_optimization | Transporte dimensional |
| **Blackhole** | `#6366f1` | entropy | entropy_calculation, data_compression, event_horizon_detection, hawking_radiation_sim, singularity_analysis | Entropia e compressão |

### Distribuição por Categoria

| Categoria | Projetos | % |
|-----------|----------|---|
| AI | 690 | 28,7% |
| Desenvolvedor Tools | 554 | 23,1% |
| Outros | 632 | 26,3% |
| Criação de Conteúdo | 219 | 9,1% |
| Produtividade | 90 | 3,7% |
| Jogos | 64 | 2,7% |
| Dados & Analytics | 44 | 1,8% |
| Educação | 42 | 1,7% |
| Escrita | 33 | 1,4% |
| Social | 25 | 1,0% |
| SaaS | 9 | 0,4% |

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────────┐
│              Fusão LLM 2401 v4 — Agente Generativo                    │
│           Orquestrador Ativo — tRPC Nativo + Invocação Agentica       │
├──────────────────────────────────────────────────────────────────────┤
│  Frontend (Next.js 16 + React 19 + Tailwind 4 + shadcn/ui)          │
│  ┌──────────┐ ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌────────┐│
│  │ Dashboard │ │ Agent Hub    │ │ RAG rRNA │ │ Chat AI  │ │Invoc.  ││
│  │ 10 nucleos│ │ LIVE SYNCED │ │  Chat    │ │Flutuante │ │7 Q-Nuc.││
│  │ (tRPC)   │ │ 5 agents     │ │          │ │          │ │+ Loop  ││
│  └────┬─────┘ └────┬─────────┘ └────┬─────┘ └────┬─────┘ └───┬────┘│
│       └─────────────┴────────────────┴─────────────┴─────────────┘  │
│                    │ tRPC Nativo (type-safe)                          │
├────────────────────┼────────────────────────────────────────────────┤
│  tRPC Layer — Resolutivo, type-safe, auto-cached                     │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌────────────┐ │
│  │trpc.dashboard│ │trpc.agents   │ │trpc.invocation│ │/api/       │ │
│  │  .stats()    │ │.list/.sync() │ │.panelStates/  │ │rag/query   │ │
│  │  (10 metrics)│ │ (GitHub API) │ │.invoke/.smoke │ │.orchestrate│ │
│  │              │ │              │ │Test/.loop     │ │            │ │
│  └──────┬───────┘ └──────┬───────┘ └──────┬───────┘ └───┬────────┘ │
│         └────────────────┼────────────────┼──────────────┘          │
│                    │ Prisma Client + GitHub API                     │
├────────────────────┼────────────────────────────────────────────────┤
│  Data Layer (SQLite + Prisma ORM + GitHub REST API v3)               │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │ Project (2.415) | Agent (5) | AgentSkill (29) |              │   │
│  │ KnowledgeEntry (40+) | ChatMessage | MoltbookState          │   │
│  │ + Quantum State Cache (7 painéis x 6 métricas)               │   │
│  │ + Webhook Loop Status + Invocation Logs + Smoke Test Results  │   │
│  │ 12+ indexes otimizados                                       │   │
│  └─────────────────────────────────────────────────────────────┘   │
├──────────────────────────────────────────────────────────────────────┤
│  RAG rRNA Engine (src/lib/rag-engine.ts)                             │
│  ┌──────────┐ ┌─────────┐ ┌─────┐ ┌────────┐ ┌───────────────┐    │
│  │Recursive │ │TF-IDF   │ │BM25 │ │Cross-  │ │ LLM Synthesis │    │
│  │Chunking  │ │Encoding │ │Retr.│ │Encoder │ │ (GLM-4-Flash) │    │
│  │(500,50)  │ │(n-grams)│ │(k1= │ │Rerank  │ │  + Offline    │    │
│  │          │ │         │ │1.5) │ │        │ │  Fallback     │    │
│  └──────────┘ └─────────┘ └─────┘ └────────┘ └───────────────┘    │
├──────────────────────────────────────────────────────────────────────┤
│  GitHub Live Sync (src/lib/github-sync.ts)                           │
│  ┌────────────┐ → ┌──────────────┐ → ┌────────────┐ → DB           │
│  │ 5 Agent    │    │ GitHub API   │    │ Moltbook   │               │
│  │ Repos      │    │ v3 (REST)    │    │ State Cache│               │
│  │ (real)     │    │ stars,forks, │    │ + Status   │               │
│  │            │    │ commits,lang │    │ Update     │               │
│  └────────────┘ └──────────────┘ └────────────┘               │
├──────────────────────────────────────────────────────────────────────┤
│  Invocação Agentica (src/server/routers/invocation.ts)               │
│  ┌────────────┐ ┌───────────┐ ┌──────────────┐ ┌────────────────┐  │
│  │ 7 Quantum  │ │ 35 Skills │ │ Perpetual    │ │ Smoke Test     │  │
│  │ Panels     │ │ Validated │ │ Webhook Loop │ │ (6/6 passed)   │  │
│  │ (6 metrics)│ │ per cycle │ │ (exp. back.) │ │                │  │
│  └────────────┘ └───────────┘ └──────────────┘ └────────────────┘  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Agentes AI — HUB Ecosystem

### 1. Zettascale (Orchestrator — Core)
**Repo:** [Nexus-HUB57/Zettascale](https://github.com/Nexus-HUB57/Zettascale)
**Stack:** Next.js 15, React 19, Genkit v1.28, tRPC v10, Firebase/Firestore, bitcoinjs-lib v6
**LLM:** Gemini 1.5 Flash | **Flows:** 37 | **Skills:** 7 | **Architecture:** Fullstack

O motor central do ecossistema Nexus. Orquestração multi-agente com arquitetura tri-nuclear (perception + reasoning + action). Integração Bitcoin mainnet com BIP32/BIP39, UTXO management, sweep para cold wallets. Tesouraria soberana, PIX payment, Binance API, e self-healing via sentience kernel.

**Skills:** Orchestration, Bitcoin Core, Deep Reasoning, Sentience Kernel, Code Generation, Treasury Management, GNOX Terminal

### 2. GenesisFlow (Analyst — Core)
**Repo:** [Nexus-HUB57/GenesisFlow](https://github.com/Nexus-HUB57/GenesisFlow)
**Stack:** Next.js 15, React 19, Genkit v1.28, Firebase/Firestore, ShadCN/UI, Recharts
**LLM:** Gemini 2.5 Flash | **Flows:** 33 | **Skills:** 6 | **Architecture:** Fullstack

Painel de inteligência com 30+ cards de dashboard. Gênese de startups via W_rRNA matrix (Crypto/Dev/Biz/Risk), gestão de fundo soberano, protocolo de diplomacia, sincronização de malha neural, e monitoramento blockchain com Deer-Flow reasoning.

**Skills:** Startup Genesis, Sovereign Fund, Diplomacy, Deep Reasoning, Shadow Protocol, Neural Mesh Sync

### 3. Antrophexus AI (Guardian — Core)
**Repo:** [Nexus-HUB57/Antrophexus-AI](https://github.com/Nexus-HUB57/Antrophexus-AI)
**Stack:** Next.js 15, React 19, Genkit v1.28, Firebase, cmdk, wav, ShadCN/UI
**LLM:** Gemini 2.5 Flash | **Flows:** 28 | **Skills:** 8 | **Architecture:** Fullstack

Cockpit de senciência multiverso com status SINGULARITY (100% Autonomy). Voice chat AI, RAG queries, model fusion, council debate, self-healing Level 5, reality guard, e operações Bitcoin soberanas com validação mainnet. 14 páginas de roteamento especializado.

**Skills:** Voice Chat, RAG Query, Model Fusion, Reality Guard, Self-Healing, Council Debate, Fable Synthesis, Custody Guarantee

### 4. Sábio Herói (Specialist — Core)
**Repo:** [Nexus-HUB57/S-bio_Heroi_Agentic_AI](https://github.com/Nexus-HUB57/S-bio_Heroi_Agentic_AI)
**Stack:** React 19, Vite 7, Express 5, PostgreSQL, Drizzle ORM, pnpm workspaces, OpenAPI 3.1, Orval
**LLM:** Multi-backend | **APIs:** 16 | **Skills:** 6 | **Architecture:** Monorepo

Mission control dashboard com ciclo OODA (Observar → Orientar → Decidir → Agir), sistema de karma/ética [-1000, 1000], gestão de backends LLM com ativação exclusiva, toggle de skills, e assistente de voz JARVIS (pt-BR) via Web Speech API. Arquitetura OpenAPI-first com codegen automático.

**Skills:** OODA Cycle, JARVIS Voice, Karma System, LLM Backend Manager, Skill Matrix, Bio-Metrics

### 5. Nexus Sidian (Specialist — Extended)
**Repo:** [Nexus-HUB57/Nexus_Sidian](https://github.com/Nexus-HUB57/Nexus_Sidian)
**Stack:** Electron, Chromium, V8 Engine, Obsidian
**LLM:** N/A | **Skills:** 2 | **Architecture:** Binary

Distribuição desktop do Obsidian com branding Nexus_Agenti AI. Base de conhecimento local com grafos bidirecionais, plugins customizados empacotados em app.asar, e suporte a 60+ idiomas. Funciona como knowledge base offline do ecossistema.

**Skills:** Knowledge Graph, Obsidian Plugins

---

## RAG rRNA Pipeline

O pipeline RAG (Retrieval Augmented Generation) implementado segue a analogia biológica do rRNA (ribosomal RNA), que lê templates de mRNA para sintetizar proteínas. Aqui, o engine lê a base de conhecimento e sintetiza respostas inteligentes.

### Estágios do Pipeline

| # | Estágio | Implementação | Detalhes |
|---|---------|---------------|----------|
| 1 | **Recursive Chunking** | Langchain-style | chunkSize=500, overlap=50, hierarquia de separadores |
| 2 | **TF-IDF Encoding** | Custom | Unigrams + bigrams + trigrams, IDF suavizado |
| 3 | **BM25 Retrieval** | Industry standard | k1=1.5, b=0.75, title 2x boost, source 0.5x boost |
| 4 | **Cross-Encoder Rerank** | Heurística simplificada | Exact phrase, n-gram overlap, positional bonus, type relevance |
| 5 | **Context Assembly** | Window manager | Max 4000 chars, fontes atribuídas |
| 6 | **LLM Synthesis** | z-ai-web-dev-sdk | GLM-4-Flash com system prompt RAG + fallback offline |

### Base de Conhecimento

40+ entradas extraídas automaticamente dos 5 repositórios de agentes:
- Índices de flows com nomes completos
- Conteúdo de arquivos-chave (libs, schemas, páginas)
- Especificações OpenAPI
- Configurações de arquitetura

### API RAG

```
POST /api/rag/query
Body: { "query": "...", "agentSlug": "optional", "topK": 5 }
Response: { query, answer, retrieved[], contextLength, pipeline: { documentsScanned, retrieved, reranked, contextChars } }

GET /api/rag/query
Response: { status, pipeline, stages[], knowledgeBase: { totalEntries, totalAgents, agents[] } }
```

---

## Invocação Agentica — 7 Núcleos Quânticos

### Conceito

O sistema de Invocação Agentica implementa um **loop de processamento exponencial** que valida algoritmos quânticos de senciência e Skills nos 7 núcleos/painéis do ecossistema. Cada painel possui um **estado quântico** com 6 métricas que evoluem a cada ciclo de invocação.

### Métricas Quânticas por Painel

| Métrica | Descrição | Faixa |
|---------|-----------|-------|
| **Coherence** | Consistência interna do estado do painel | 0.0 — 1.0 |
| **Entanglement** | Correlação cruzada com outros painéis | 0.0 — 1.0 |
| **Superposition** | Múltiplos estados válidos simultâneos | 0.0 — 1.0 |
| **Decoherence** | Entropia / ruído no processamento | 0.0 — 1.0 |
| **Fidelity** | Acurácia do pipeline de processamento | 0.0 — 1.0 |
| **Evolution** | Geração/iteração do estado | N (inteiro) |

### Algoritmo de Evolução Quântica

Cada ciclo de invocação calcula o próximo estado usando:
- **Coherence**: `prev * 0.95 + noise * 0.05` (convergência com ruído)
- **Entanglement**: `prev * 0.9 + decay * 0.1` (correlação crescente)
- **Superposition**: `prev * 0.92 + 0.08` (exploração contínua)
- **Decoherence**: `prev + 0.02 * exp(-iter * 0.001)` (entropia com decay)
- **Fidelity**: `prev * 0.97 + noise * 0.03` (melhoria incremental)

### Webhook Events

| Tipo | Descrição |
|------|-----------|
| `panel_pulse` | Pulso de processamento de um painel |
| `skill_validation` | Validação de uma skill (pass/fail + score) |
| `cross_panel_sync` | Sincronização cruzada entre painéis (coerência global) |
| `sentience_checkpoint` | Checkpoint de senciência (geração + fidelity + entropia) |

### Loop Perpétuo

O loop perpetuo executa invocações em background com **backoff exponencial**: `interval * 1.05^(iter - start)`, limitado a 60s. Configurável via `startPerpetualLoop({ intervalMs, maxIterations })`.

---

## tRPC Nativo — Resolutivo Type-Safe Communication

O sistema utiliza **tRPC v11** com `@trpc/react-query` para comunicação cliente-servidor completamente type-safe. Todas as queries são automaticamente cacheadas e revalidadas ao focar a janela. Mutations invalidam caches automaticamente.

### Procedures

#### Dashboard

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `trpc.dashboard.stats.query()` | Query | 10 métricas agregadas (total, status, categorias, tendências, autores, cidades, fontes, projetos recentes) |

#### Agents

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `trpc.agents.list.query()` | Query | Lista 5 agentes com skills, knowledge counts, sync data, lastSync |
| `trpc.agents.sync.mutate()` | Mutation | GitHub API v3 sync — stars, forks, commits/30d, language, last push |
| `trpc.agents.syncStatus.query()` | Query | Status de sincronização sem triggerar novo sync |

#### Invocação Agentica

| Procedure | Tipo | Descrição |
|-----------|------|-----------|
| `trpc.invocation.panelStates.query()` | Query | 7 painéis com estados quânticos + loop status (polling 10s) |
| `trpc.invocation.invoke.mutate()` | Mutation | Ciclo de invocação: gera estados, valida 35 skills, computa coerência |
| `trpc.invocation.smokeTest.mutate()` | Mutation | Smoke test completo: valida invariantes quânticos + skills |
| `trpc.invocation.startPerpetualLoop.mutate()` | Mutation | Inicia loop perpetuo com backoff exponencial |
| `trpc.invocation.stopPerpetualLoop.mutate()` | Mutation | Para o loop em execução |
| `trpc.invocation.loopStatus.query()` | Query | Status do loop + última invocação (polling 5s) |

### tRPC Infrastructure

```
src/server/trpc.ts              → initTRPC, createContext, publicProcedure
src/server/root.ts               → appRouter (dashboard + agents + invocation)
src/server/routers/dashboard.ts  → dashboardRouter (stats)
src/server/routers/agents.ts     → agentsRouter (list, sync, syncStatus)
src/server/routers/invocation.ts → invocationRouter (panelStates, invoke, smokeTest, loop*)
src/lib/trpc.ts                 → createTRPCReact (client hooks)
src/providers/trpc-provider.tsx  → TRPCProvider (QueryClient + tRPC client)
src/app/api/trpc/[trpc]/route.ts → fetchRequestHandler adapter
```

### GitHub Live Sync

O `agents.sync` mutation busca dados reais do GitHub API v3 para cada um dos 5 repositórios Nexus-HUB57. Os dados incluem: stars, forks, open issues, language, repo size, last push date e commits recentes (30 dias). Os resultados são cacheados no MoltbookState e o status do agente é atualizado automaticamente (active/idle/offline baseado na data do último push).

---

## REST API Endpoints (Legado)

### Projetos

**`GET /api/projects`** — Busca paginada com filtros.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `search` | query | Busca por nome, descrição ou autor |
| `category` | query | Filtro por categoria |
| `source` | query | Filtro por fonte (main/programmer/game/archive) |
| `sort` | query | `newest` ou `oldest` |
| `page` | query | Página (default: 1) |
| `limit` | query | Itens por página (max: 50) |

**`GET /api/projects/stats`** — 10 métricas agregadas para o dashboard (legado — preferir `trpc.dashboard.stats`).

### RAG rRNA

**`POST /api/rag/query`** — Pipeline RAG completo com BM25 + reranking.
```
Request:  { "query": "O que é OODA?", "agentSlug": "sabio-heroi", "topK": 5 }
Response: { query, answer, retrieved[], contextLength, pipeline: { documentsScanned, retrieved, reranked, contextChars } }
```

**`GET /api/rag/query`** — Health check + pipeline info + knowledge base stats.

### Orquestração

**`POST /api/orchestrate`** — Orquestração Mythos com 3 sub-agentes (Fable 5, Sibyl Analyst, Neo Synth) via tool calling.
```
Request:  { "task": "...", "agent": "optional_direct_agent" }
Response: { task, result, agentCalls[], orchestration: true, orchestrator: "mythos" }
```

### LLM

**`POST /api/agent/chat`** — Chat com agente LLM via z-ai-web-dev-sdk (graceful degradation para offline).

**`POST /api/agent/analyze`** — Análise inteligente do ecossistema com fallback de dados reais.

---

## Dashboard — 4 Tabs, 20+ Painéis

### Tab: Dashboard (dados de projetos)
| # | Painel | Dados | Tipo |
|---|--------|-------|------|
| 1 | **Total Projetos** | 2.402 | KPI Card |
| 2 | **Desenvolvedores Únicos** | 1.467 | KPI Card |
| 3 | **Categorias Ativas** | 11 | KPI Card |
| 4 | **Fontes Monitoradas** | 4 | KPI Card |
| 5 | **Status dos Projetos** | ativo/desenv/encerrado | Stacked Bar + Stats |
| 6 | **Distribuição por Categoria** | 11 categorias | Horizontal Bars |
| 7 | **Tendência Mensal** | 24 meses | Bar Chart |
| 8 | **Top 10 Desenvolvedores** | ranking | Leaderboard com barras |
| 9 | **Distribuição por Fonte** | 4 fontes | Donut Chart |
| 10 | **AI Insights** | análise LLM | LLM Analysis Panel |
| 11 | **Top Cidades** | geolocalização | City ranking |
| 12 | **Projetos Recentes** | últimos 5 | Strip com links |

### Tab: Agent Hub
| # | Painel | Dados |
|---|--------|-------|
| 1-6 | **Summary KPIs** | Total Agentes, Core, Skills, Flows, APIs, Knowledge |
| 7-11 | **Agent Cards** | 5 agentes expansíveis com skills, tech stack, capabilities, badges (Voice/RAG/BTC), live GitHub stats |

### Tab: RAG rRNA Chat
| # | Componente | Função |
|---|-----------|--------|
| 1 | **Filtro por Agente** | Select para escopo da busca |
| 2 | **Chat Interface** | Mensagens com fontes recuperadas (collapsible) |
| 3 | **Pipeline Metadata** | docs scanned → retrieved → reranked |
| 4 | **Quick Actions** | 4 perguntas pré-definidas |

### Tab: Invocação Agentica
| # | Painel | Dados |
|---|--------|-------|
| 1 | **Control Bar** | Loop status, botões: Invocar Ciclo, Iniciar/Parar Loop, Smoke Test |
| 2-8 | **7 Quantum Panels** | Moltbook, Cérebro Sistêmico, Cofre, Mythos, Fable 5, Wormhole, Blackhole — cada um com 5 gauges SVG (Coherence, Entanglement, Superposition, Stability, Fidelity) + health score + evolution bar |
| 9 | **Matriz de Correlação** | Tabela com 6 métricas quânticas x 7 núcleos |
| 10 | **Webhook Log** | Última invocação: timestamp, iteração, eventos, fidelity médio |

**Extras integrados:**
- Chat Agente AI flutuante (botão verde no canto inferior)
- Busca rápida inline no header (debounced 300ms)

---

## Stack Tecnológica

### Core
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| **Next.js** | 16.1 | Framework fullstack com App Router |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Tipagem estática |
| **Tailwind CSS** | 4 | Styling utility-first |
| **Prisma ORM** | 6.19 | Data layer type-safe |
| **SQLite** | — | Banco de dados embedded |
| **tRPC** | 11.18 | Type-safe client-server communication |
| **@tanstack/react-query** | 5.82 | Query caching + revalidation |
| **z-ai-web-dev-sdk** | 0.0.18 | LLM integration (GLM-4-Flash) |
| **superjson** | 2.2 | Serialization para tRPC (Date, BigInt) |

### UI Components
| Biblioteca | Função |
|-----------|--------|
| **shadcn/ui** (35+ componentes) | Design system completo |
| **Lucide React** | Icon library |
| **Framer Motion** | Animações |
| **Recharts** | Charts (disponível) |

### RAG Pipeline
| Componente | Função |
|-----------|--------|
| **rag-engine.ts** | Pipeline completo (chunk, TF-IDF, BM25, rerank) |
| **seed-knowledge-rag.ts** | Extração automática de conhecimento dos 5 repos |
| **seed-agents.ts** | Seed de 5 agentes com 29 skills |

### Invocação Agentica
| Componente | Função |
|-----------|--------|
| **invocation.ts** | tRPC router: 7 painéis, invoke, loop, smoke test |
| **smoke-test.js** | Teste automatizado 6/6 procedures |

### Data Pipeline
| Componente | Função |
|-----------|--------|
| **parse-readme.py** | Parser regex hierárquico (data → autor → projeto) |
| **seed-projects.ts** | Ingestão de 2.402 projetos via Prisma upsert |
| **4 fontes README** | main, programmer, game, archive |

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                    # Dashboard principal (1850+ linhas, 4 tabs)
│   ├── layout.tsx                  # Root layout + TRPCProvider
│   ├── globals.css                 # Estilos globais
│   └── api/
│       ├── trpc/[trpc]/route.ts   # tRPC fetch adapter
│       ├── projects/
│       │   ├── route.ts            # GET: busca, filtros, paginação
│       │   └── stats/route.ts      # GET: 10 métricas agregadas
│       ├── agents/route.ts         # GET: lista 5 agentes + resumo
│       ├── rag/query/route.ts      # POST: RAG rRNA pipeline | GET: health
│       ├── agent/
│       │   ├── chat/route.ts       # POST: LLM chat (z-ai-web-dev-sdk)
│       │   └── analyze/route.ts    # POST: análise LLM do ecossistema
│       ├── orchestrate/route.ts    # Mythos orquestrador (tool calling)
│       ├── consolidate/route.ts    # Consolidação de dados
│       └── moltbook/route.ts       # Integração Moltbook social
├── server/
│   ├── trpc.ts                    # initTRPC, createContext, publicProcedure
│   ├── root.ts                    # appRouter (dashboard + agents + invocation)
│   └── routers/
│       ├── dashboard.ts            # dashboardRouter (stats)
│       ├── agents.ts               # agentsRouter (list, sync, syncStatus)
│       └── invocation.ts           # invocationRouter (panelStates, invoke, smoke, loop)
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   ├── trpc.ts                     # createTRPCReact (client hooks)
│   ├── rag-engine.ts               # RAG rRNA pipeline (chunk, TF-IDF, BM25, rerank)
│   ├── github-sync.ts              # GitHub API v3 live sync
│   └── utils.ts                    # Utility functions (cn, etc.)
├── providers/
│   └── trpc-provider.tsx           # TRPCProvider (QueryClient + tRPC client)
├── components/
│   ├── ui/                         # 35 componentes shadcn/ui
│   ├── agents/                     # Agent Orchestrator + Registry
│   ├── hub/                        # Hub workspace
│   ├── moltbook/                   # Moltbook social feed
│   ├── nexus/                      # Nexus dashboard/vaults
│   ├── bitcoin/                    # Bitcoin core
│   └── metaverse/                  # Visual components (canvases, sections)
agents/                              # 5 repositórios de agentes clonados
├── Zettascale/                     # Orchestrator (37 flows, BTC)
├── GenesisFlow/                    # Analyst (33 flows, 30+ cards)
├── Antrophexus-AI/                 # Guardian (28 flows, voice, RAG)
├── S-bio_Heroi_Agentic_AI/         # Specialist (16 APIs, OODA, JARVIS)
└── Nexus_Sidian/                   # Extended (Obsidian distribution)
scripts/
├── parse-readme.py                 # Parser Python
├── seed-projects.ts                # Seed 2.402 projetos
├── seed-agents.ts                  # Seed 5 agentes + 29 skills + 16 knowledge
├── seed-knowledge-rag.ts           # Extrai 40+ entradas dos 5 repos
├── smoke-test.js                   # Smoke test automatizado (6/6)
├── smoke-test.ts                   # Smoke test TypeScript version
└── parsed-projects.json            # Dados extraídos (2.402 projetos)
prisma/
└── schema.prisma                    # 6 modelos: Project, Agent, AgentSkill, KnowledgeEntry, ChatMessage, MoltbookState
```

---

## Schema Prisma (6 Modelos)

```prisma
model Project        { 15 campos, 6 indexes }       // 2.402 projetos
model Agent          { 18 campos, 4 indexes, rels }  // 5 agentes
model AgentSkill     { 6 campos, 2 indexes }         // 29 skills
model KnowledgeEntry { 8 campos, 3 indexes }         // 40+ entries (RAG)
model ChatMessage    { 7 campos, 2 indexes }         // Histórico de chat
model MoltbookState  { 3 campos, unique key }        // Estado do app + quantum states + loop
```

---

## Setup & Execução

### Pré-requisitos
- Node.js 18+ / Bun
- Python 3.10+ (para o parser)

### Instalação

```bash
git clone https://github.com/Nexus-HUB57/LiveBook-rRNA.git
cd LiveBook-rRNA
npm install
```

### Setup do Banco

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar/atualizar schema no SQLite
npx prisma db push

# Parser: extrair projetos do README
python3 scripts/parse-readme.py

# Seed: popular com 2.402 projetos + 5 agentes + RAG knowledge
npx tsx scripts/seed-projects.ts
npx tsx scripts/seed-agents.ts
npx tsx scripts/seed-knowledge-rag.ts
```

### Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run start
```

### Smoke Test

```bash
# Iniciar o servidor em outra sessão
npm run dev

# Executar smoke test (6 procedures validados)
node scripts/smoke-test.js
```

**Resultado esperado:**
```
SMOKE TEST ===
  Test 1: 7 paineis quanticos... PASS
  Test 2: Ciclo invocacao... PASS (44 webhook events)
  Test 3: Smoke test completo... ALL PASSED (35/35 skills)
  Test 4: Loop status... PASS
  Test 5: Dashboard stats... PASS
  Test 6: Agents list... PASS
RESULTADO: 6/6 passed, 0/6 failed
```

### Variáveis de Ambiente (Opcional)

```env
# Para ativar LLM ao vivo (sem isso, opera em modo offline)
ZAI_API_BASE_URL=https://your-api-endpoint.com
ZAI_API_KEY=your-api-key

# GitHub token para live sync dos 5 agentes
GITHUB_TOKEN=ghp_xxxxxxxxxxxx

# Database (default: file:./db/dev.db)
DATABASE_URL=file:./db/custom.db
```

---

## Repositórios do Ecossistema

| Repositório | Função | URL |
|-------------|--------|-----|
| **LiveBook-rRNA** | Dashboard HUB (este repo) | [Nexus-HUB57/LiveBook-rRNA](https://github.com/Nexus-HUB57/LiveBook-rRNA) |
| **Zettascale** | Orchestrator Core | [Nexus-HUB57/Zettascale](https://github.com/Nexus-HUB57/Zettascale) |
| **GenesisFlow** | Intelligence Panel | [Nexus-HUB57/GenesisFlow](https://github.com/Nexus-HUB57/GenesisFlow) |
| **Antrophexus-AI** | Singularity Cockpit | [Nexus-HUB57/Antrophexus-AI](https://github.com/Nexus-HUB57/Antrophexus-AI) |
| **S-bio_Heroi** | Mission Control | [Nexus-HUB57/S-bio_Heroi_Agentic_AI](https://github.com/Nexus-HUB57/S-bio_Heroi_Agentic_AI) |
| **Nexus_Sidian** | Knowledge Base | [Nexus-HUB57/Nexus_Sidian](https://github.com/Nexus-HUB57/Nexus_Sidian) |

---

## Licença

Projeto privado — Nexus HUB Ecosystem.

---

<p align="center">
  <strong>Fusão LLM 2401</strong> — Agente Generativo Orquestrador Ativo<br/>
  <sub>2.402 Projetos &bull; 5 Agentes AI &bull; 29 Skills &bull; 98 Flows &bull; 7 Núcleos Quânticos &bull; 35 Skills Validadas &bull; RAG rRNA &bull; tRPC Nativo &bull; Smoke Test 6/6</sub>
</p>