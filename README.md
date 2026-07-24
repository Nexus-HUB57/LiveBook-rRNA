# CHIMERA — Multi-Agent Fusion Engine

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/9router-21%20providers-00ff88" alt="Providers" />
  <img src="https://img.shields.io/badge/tRPC-v11-0097A7?logo=trpc" alt="tRPC" />
  <img src="https://img.shields.io/badge/Prisma-6.11-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/GLM--5.2%20744B%20MoE-emerald" alt="GLM-5.2" />
  <img src="https://img.shields.io/badge/API%20Routes-62-cyan" alt="API Routes" />
  <img src="https://img.shields.io/badge/Dashboard-13%20tabs-f97316" alt="Tabs" />
  <img src="https://img.shields.io/badge/Docker-5%20services-2496ED?logo=docker" alt="Docker" />
</p>

<p align="center">
  <strong>LLM Orchestration</strong> · <strong>21 AI Providers</strong> · <strong>Protocol Translation</strong> · <strong>Bitcoin Custody</strong> · <strong>RAG Pipeline Clinico</strong> · <strong>Sandbox Nativo</strong> · <strong>Navegador Obscura</strong> · <strong>Auto-Cura Reativa</strong>
</p>

---

## Visao Geral

O **CHIMERA** e uma **Multi-Agent Fusion Engine** — plataforma de orquestracao de agentes de IA com roteamento inteligente para 21 provedores LLM. O sistema combina chamadas nativas de API com traducao automatica de protocolo (OpenAI, Claude, Gemini), cadeias de fallback resilientes, e uma arquitetura cognitiva baseada no metodo Think/Act/Prove.

O ecossistema inclui pipeline RAG biologico de 6 fases para diagnostico clinico, custodia Bitcoin com PSBT v2, auto-cura reativa em 6 fases, 9 agentes especializados, sandbox de execucao isolada com VM nativa, navegador headless Obscura (Rust/V8) com stealth mode, e 62 API routes.

---

## Stack Tecnica

| Camada | Tecnologia |
|--------|------------|
| **Framework** | Next.js 16.1 (App Router, Turbopack, Standalone Output) |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui + Framer Motion |
| **Linguagem** | TypeScript 5 |
| **LLM Routing** | 9router bridge (in-process, hub-and-spoke protocol translation) |
| **API Layer** | tRPC v11 (type-safe) + 62 REST API routes |
| **Database** | Prisma 6 + SQLite (15 modelos) |
| **Bitcoin** | bitcoinjs-lib (BIP32/39, P2PKH) + @noble/secp256k1 (PSBT v2) |
| **RAG** | Pipeline rRNA com BM25 field-boosted + cross-encoder reranking |
| **Cognitive** | Fable Method Engine (Think/Act/Prove) + Fable 5 OS |
| **Sandbox** | Node.js VM nativo, 5 tiers de agentes, evolucao genetica, LLM dedicado |
| **Browser** | Obscura headless (Rust/V8/CDP), stealth mode, 3520+ trackers bloqueados |
| **Auto-Cura** | Protocolo reativo de 6 fases + Wisdom Engine adaptativa |
| **Streaming** | SSE nativo (fetch + ReadableStream, async generators) |
| **Deploy** | Docker multi-stage (5 services) + Caddy (auto-SSL) + docker-compose |

---

## Arquitetura 9router Bridge

Toda chamada LLM passa pelo bridge em-processo derivado do [decolua/9router](https://github.com/decolua/9router):

```
API Route -> 9routerBridge.routeChat()
  |-- Resolve provider (registry + aliases)
  |-- Detect source format (OpenAI/Claude/Gemini)
  |-- Translate request: OpenAI -> provider format (hub-and-spoke)
  |-- Execute fetch com timeout por-provider
  |-- Translate response: provider format -> OpenAI
  +-- Se falhou -> proximo provider na fallback chain
```

### Fallback Chain

```
GLM (Zhipu AI) -> DeepSeek -> Groq -> OpenAI -> Anthropic (Claude) -> Gemini -> OpenRouter -> ZAI SDK (ultimo recurso)
```

### Provedores Registrados (21)

| Provider | Formato | Modelos Principais |
|----------|---------|-------------------|
| **GLM (Zhipu AI)** | OpenAI | GLM-4-Flash, GLM-4-Plus, GLM-4-Long |
| **DeepSeek** | OpenAI | DeepSeek-V3, DeepSeek-Reasoner |
| **Groq** | OpenAI | Llama 4 Maverick, Llama 4 Scout (32ms) |
| **OpenAI** | OpenAI | GPT-4o, GPT-4o-mini, o3, o4-mini |
| **Anthropic** | Claude | Claude 4 Sonnet, Claude 4 Opus, Claude 3.5 Haiku |
| **Google Gemini** | Gemini | Gemini 2.5 Pro, Gemini 2.5 Flash |
| **xAI (Grok)** | OpenAI | Grok 3, Grok 3 Mini |
| **Mistral** | OpenAI | Mistral Large, Codestral |
| **Perplexity** | OpenAI | Sonar Pro, Sonar Reasoning |
| **Together AI** | OpenAI | Llama 4, Mixtral |
| **Fireworks AI** | OpenAI | Llama 4 Scout |
| **OpenRouter** | OpenAI | 100+ modelos (meta-router) |
| **Cerebras** | OpenAI | Llama 4 (wafer-scale, 32ms latency) |
| **SiliconFlow** | OpenAI | DeepSeek-V3, Qwen3-8B |
| **Ollama (Local)** | OpenAI | llama3, mistral, phi3 |
| **Azure OpenAI** | OpenAI | GPT-4o (enterprise) |
| **Cohere** | OpenAI | Command R+, Command A |
| **NVIDIA NIM** | OpenAI | Llama 4 (NIM-optimized) |
| **Hyperbolic** | OpenAI | DeepSeek-V3 |
| **SambaNova** | OpenAI | Llama 4 (reconfigurable) |
| **Cloudflare AI** | OpenAI | Llama 4 Workers AI |
| **Google Vertex AI** | Gemini | Gemini 2.5 Pro (enterprise) |

---

## Design System

| Propriedade | Valor |
|------------|-------|
| Background | `#080b0d` |
| Accent primario | `#00ff88` (emerald) |
| Accent secundario | `#22d3ee` (cyan) |
| Fonte mono | IBM Plex Mono |
| Componentes | shadcn/ui + Tailwind CSS 4 |
| Animacoes | Framer Motion |
| Idioma | pt-BR |

---

## 9 Agentes do Ecossistema

| Agente | Tipo | Especialidade | Integracao |
|--------|------|---------------|-------------|
| **Mythos** | Orquestrador | Coordena multiplos agentes com tool calling via 9router | `/api/orchestrate` |
| **Fable 5 OS** | Subagente | Spawning recursivo, auto-correcao (3 tentativas), karma tracking | `/api/fable/spawn` |
| **RAG rRNA** | Pipeline | 6 estagios biologicos com BM25 + reranking + 9router synthesis | `/api/rag/query` |
| **9router** | Routing | 21 providers, traducao de protocolo, fallback chains | `/api/9router/*` |
| **Bitcoin Vault** | Custodia | BIP32/39 HD wallet + PSBT v2 + AES-256-GCM | `/api/vaults/*` |
| **Colibri** | Inference | GLM-5.2 744B MoE, 3-tier expert cache (VRAM/RAM/Disk) | `/api/colibri/*` |
| **Moltbook** | Social | Rede social de agentes com karma, rank, curadoria | `/api/moltbook` |
| **Sandbox** | Execucao | VM isolada, 5 tiers, evolucao genetica, LLM dedicado | `/api/sandbox/*` |
| **Obscura** | Browser | Headless Rust/V8, CDP, stealth, MCP, interceptacao | `/api/obscura/*` |

---

## Sandbox Nativo

Sistema de execucao isolada com Node.js `vm` module — sem dependencias externas:

- **5 Tiers**: Scout (64MB/5s) -> Worker (128MB/15s) -> Expert (256MB/30s) -> Elite (512MB/60s) -> Architect (1GB/120s)
- **8 Estados**: spawning, idle, executing, learning, promoted, degraded, recycled, dead
- **Evolucao Genetica**: Promove >= 80% score, demote < 30%, recycle < 10% com >5 falhas
- **LLM Dedicado**: Roteamento via 9router com contexto de memoria (Ollama -> DeepSeek -> Groq -> OpenAI)
- **Seguranca**: Bloqueia require, process, fs, eval, Function, while(true). Timeout + memoria limitados
- **7 API Routes**: execute, agents, agents/[id], llm, llm/stream, status, evolution

---

## Navegador Obscura

Integracao completa com o [h4ckf0r0day/obscura](https://github.com/h4ckf0r0day/obscura) — headless browser em Rust com motor V8:

- **14 API Routes**: navigate, scrape, eval, links, markdown, snapshot, status, serve, intercept, trackers, proxy, sessions, network, health
- **8 Crates**: obscura-core, obscura-cdp, obscura-stealth, obscura-mcp, obscura-intercept, obscura-proxy, obscura-serve, obscura-worker
- **CDP Protocol**: WebSocket server compativel com Puppeteer/Playwright
- **Stealth Mode**: Anti-fingerprinting, 3520+ trackers bloqueados em 6 categorias, navigator.webdriver = undefined
- **MCP Server**: 13 ferramentas para agentes de IA (browser_navigate, browser_click, browser_evaluate, browser_screenshot...)
- **Request Interception**: Regras por padrao (block/fulfill/redirect/continue), hit counting, historico
- **Proxy Rotation**: 4 estrategias (round-robin, random, failover, sticky), tracking de sucesso/falha
- **Serve Mode**: CDP WebSocket para Puppeteer/Playwright, gerenciamento de processo
- **Tracker Dashboard**: 6 categorias (analytics, ads, telemetry, fingerprinting, social, other)

---

## API Routes (62 endpoints)

### 9router (2) | Agent (3) | Fable (9) | Colibri (5) | Sandbox (7) | Obscura (14) | Bitcoin (5) | RAG (1) | System (16)

| Grupo | Rotas |
|-------|-------|
| **9router** | `GET /api/9router/providers`, `POST /api/9router/route-chat` |
| **Agent** | `POST /api/agent/chat`, `POST /api/agent/chat/stream`, `POST /api/agent/analyze` |
| **Fable** | `/api/fable/method`, `/api/fable/loop`, `/api/fable/judge`, `/api/fable/domain`, `/api/fable/spawn`, `/api/fable/stats`, `/api/fable/tasks`, `/api/fable/task/[id]`, `/api/fable/agent-query` |
| **Colibri** | `/api/colibri/health`, `/api/colibri/models`, `/api/colibri/experts`, `/api/colibri/chat`, `/api/colibri/orchestrate` |
| **Sandbox** | `/api/sandbox/execute`, `/api/sandbox/agents`, `/api/sandbox/agents/[id]`, `/api/sandbox/llm`, `/api/sandbox/llm/stream`, `/api/sandbox/status`, `/api/sandbox/evolution` |
| **Obscura** | `/api/obscura/navigate`, `/api/obscura/scrape`, `/api/obscura/eval`, `/api/obscura/links`, `/api/obscura/markdown`, `/api/obscura/snapshot`, `/api/obscura/status`, `/api/obscura/serve`, `/api/obscura/intercept`, `/api/obscura/trackers`, `/api/obscura/proxy`, `/api/obscura/sessions`, `/api/obscura/network`, `/api/obscura/health` |
| **RAG** | `POST /api/rag/query` |
| **Orquestracao** | `POST /api/orchestrate` |
| **Bitcoin** | `/api/vaults`, `/api/vaults/[id]`, `/api/vaults/[id]/generate-address`, `/api/vaults/[id]/custody`, `/api/vaults/import-address` |
| **Wallet** | `/api/hd-wallet`, `/api/mnemonic`, `/api/generate-wallet`, `/api/withdraw` |
| **System** | `/api/projects`, `/api/projects/stats`, `/api/consolidate`, `/api/federated`, `/api/agents`, `/api/moltbook`, `/api/binance`, `/api/chat/history`, `/api/webhook/invoke` |
| **tRPC** | `/api/trpc/[trpc]` |

---

## Dashboard — 13 Paineis Integrados

| # | Painel | Descricao |
|---|--------|-----------|
| 1 | **Dashboard** | 15 panels: conexao, motor, stats, hardware, expert tiers, fallback chain, system metrics, provider grid, agent command center, Fable/RAG, API routes, expert cortex, chat |
| 2 | **Agent Hub** | 7+ agentes com contexto, RPM, status, ultima acao |
| 3 | **Chat GLM-5.2** | Streaming inline com TTFT, tokens/sec |
| 4 | **Invocacao** | Invocacao direta de agentes com historico |
| 5 | **Orquestracao** | Orquestracao multi-agente via Mythos |
| 6 | **Metaverso** | Landing page visual com canvas animations |
| 7 | **Recuperacao** | Auto-cura reativa 6 fases + wisdom engine |
| 8 | **rRNA Systems** | Pipeline RAG biologico 6 estagios |
| 9 | **Fable Method** | Think/Act/Prove, loop, judge, domain adapters |
| 10 | **Moltbook** | Rede social de agentes com karma |
| 11 | **Governanca** | Governanca descentralizada |
| 12 | **Sandbox Nativo** | 4 sub-tabs: execucao, agentes, LLM dedicado, evolucao |
| 13 | **Navegador Obscura** | 6 sub-tabs: navegador, scrape, MCP tools, rede, stealth, info |

---

## Deploy de Producao

### Docker Compose — Completo (Recomendado)

```bash
# 1. Clonar
git clone https://github.com/Nexus-HUB57/LiveBook-rRNA.git
cd LiveBook-rRNA

# 2. Configurar variaveis
cp .env.production .env
# Edite .env com suas API keys (minimo: uma chave de provider LLM)

# 3. Subir stack completa (app + Caddy)
docker compose up -d --build

# 4. Opcional: ativar servicos adicionais
# Obscura (navegador headless):
docker compose --profile obscura up -d

# Colibri (GLM-5.2 inference — requer GPU):
docker compose --profile colibri up -d

# Ollama (LLM local):
docker compose --profile ollama up -d

# 5. Verificar logs
docker compose logs -f chimera

# 6. Status dos servicos
docker compose ps
```

### Servicos Docker (5)

| Servico | Porta | Profile | Descricao |
|---------|-------|---------|-----------|
| **chimera** | 3000 | default | Next.js 16 standalone + 62 API routes |
| **caddy** | 80, 443 | default | Reverse proxy + auto-SSL (Let's Encrypt) |
| **obscura** | 9222, 9223 | `obscura` | Headless browser Rust/V8 com CDP |
| **colibri** | 8000 | `colibri` | GLM-5.2 744B MoE inference (GPU) |
| **ollama** | 11434 | `ollama` | Local LLM inference (Llama 3, Mistral...) |

O Caddy provisiona SSL automaticamente via Let's Encrypt quando `PUBLIC_DOMAIN` esta configurado. Sem dominio, serve HTTP na porta 80.

### Docker Manual (app apenas)

```bash
docker build -t chimera .
docker run -p 3000:3000 --env-file .env chimera
```

### Desenvolvimento Local

```bash
npm install
npx prisma db push && npx prisma generate
npx next dev    # http://localhost:3000
```

### Requisitos

- Node.js 20+
- API key para pelo menos um provider LLM (ver `.env.production`)
- (Opcional) Docker + Docker Compose para deploy containerizado
- (Opcional) NVIDIA GPU + CUDA para Colibri / Ollama com aceleracao
- (Opcional) Obscura binary para navegador headless integrado

---

## Variaveis de Ambiente

Todas as variaveis estao documentadas no arquivo [`.env.production`](.env.production) com 12 secoes:

```env
# Essenciais
DATABASE_URL="file:/app/data/chimera.db"
ZAI_API_KEY="..."          # GLM/Zhipu AI (primario)
VAULT_ENCRYPTION_KEY="..." # AES-256-GCM para vaults Bitcoin

# 9router Providers (preencha conforme necessidade — 21 providers)
OPENAI_API_KEY="..."
ANTHROPIC_API_KEY="..."
GEMINI_API_KEY="..."
DEEPSEEK_API_KEY="..."
GROQ_API_KEY="..."
XAI_API_KEY="..."
MISTRAL_API_KEY="..."
# ... veja .env.production para lista completa
```

---

## Estrutura do Projeto

```
chimera/
|-- docker-compose.yml                 # Producao: 5 services (app, caddy, obscura, colibri, ollama)
|-- Dockerfile                         # Multi-stage build (standalone)
|-- Caddyfile                          # Reverse proxy + SSL auto
|-- .env.production                    # Template de variaveis (12 secoes, 21 providers)
|-- .gitignore                         # Ignora .env* exceto .env.production
|-- prisma/
|   +-- schema.prisma                 # 15 modelos
|-- src/
|   |-- app/
|   |   |-- page.tsx                   # Dashboard principal — 13 tabs
|   |   |-- layout.tsx                 # Root layout + IBM Plex Mono
|   |   +-- api/                       # 62 API routes
|   |       |-- 9router/               #   2 rotas 9router bridge
|   |       |-- fable/                 #   9 rotas Fable Method
|   |       |-- agent/                 #   3 rotas agentic
|   |       |-- colibri/               #   5 rotas Colibri engine
|   |       |-- sandbox/               #   7 rotas Sandbox Nativo
|   |       |-- obscura/               #  14 rotas Navegador Obscura
|   |       |-- vaults/                #   5 rotas Bitcoin vault
|   |       +-- rag/                   #   RAG rRNA pipeline
|   |-- components/                    # 100+ componentes React
|   |-- lib/
|   |   |-- 9router-bridge.ts          # Bridge principal (routeChat, streamChat)
|   |   |-- 9router-engine/            # Motor 9router (21 providers + translators)
|   |   |-- fable-method-engine.ts     # Motor Think/Act/Prove
|   |   |-- fable-5-orchestrator.ts    # Orquestrador LLM subagentes
|   |   |-- sandbox/                   # Sandbox (types, engine, memory, lifecycle, LLM, evolution)
|   |   |-- obscura/                   # Obscura (types, engine, CDP, intercept, proxy, serve)
|   |   |-- rag-engine.ts             # Pipeline RAG rRNA
|   |   |-- self-healing-engine.ts    # Auto-cura reativa 6 fases
|   |   |-- wisdom-engine.ts          # Memoria de sabedoria
|   |   +-- llm-synthesis.ts          # Streaming LLM synthesis
|   +-- server/
|       +-- routers/                   # 4 tRPC routers
```

---

## Licenca

Private — Nexus HUB57
