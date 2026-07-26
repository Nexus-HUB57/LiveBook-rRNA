# CHIMERA — Multi-Agent Fusion Engine

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/9router-23%20providers-00ff88" alt="Providers" />
  <img src="https://img.shields.io/badge/tRPC-v11-0097A7?logo=trpc" alt="tRPC" />
  <img src="https://img.shields.io/badge/Prisma-6.11-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/GLM--5.2%20744B%20MoE-emerald" alt="GLM-5.2" />
  <img src="https://img.shields.io/badge/API%20Routes-62-cyan" alt="API Routes" />
  <img src="https://img.shields.io/badge/Dashboard-13%20tabs-f97316" alt="Tabs" />
  <img src="https://img.shields.io/badge/Docker-6%20services-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Live%20Lab-Tri--Nuclear%20v2.0-purple" alt="Live Lab" />
  <img src="https://img.shields.io/badge/Agentica%20AI-Arquiteta--Cognitiva-f472b6" alt="Agentica AI" />
</p>

<p align="center">
  <strong>LLM Orchestration</strong> · <strong>23 AI Providers</strong> · <strong>Protocol Translation</strong> · <strong>CodeGeeX4 Native</strong> · <strong>Bitcoin Custody</strong> · <strong>RAG Pipeline Clinico</strong> · <strong>Sandbox Nativo</strong> · <strong>Navegador Obscura</strong> · <strong>Auto-Cura Reativa</strong> · <strong>Live Lab Tri-Nuclear</strong> · <strong>Agentica AI</strong>
</p>

---

## Visao Geral

O **CHIMERA** e uma **Multi-Agent Fusion Engine** — plataforma de orquestracao de agentes de IA com roteamento inteligente para 23 provedores LLM. O sistema combina chamadas nativas de API com traducao automatica de protocolo (OpenAI, Claude, Gemini), cadeias de fallback resilientes, e uma arquitetura cognitiva baseada no metodo Think/Act/Prove.

O ecossistema inclui pipeline RAG biologico de 6 fases para diagnostico clinico, custodia Bitcoin com PSBT v2, auto-cura reativa em 6 fases, 9 agentes especializados, sandbox de execucao isolada com VM nativa, navegador headless Obscura (Rust/V8) com stealth mode, 62 API routes, e o **Live Lab Tri-Nuclear** — ecossistema cognitivo com 3 nucleos orquestrados pela Agentica AI (Arquiteta-Cognitiva).

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

### Provedores Registrados (23)

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
| **CodeGeeX4 (Ollama)** | OpenAI | CodeGeeX4 9B (128K context) |
| **CodeGeeX4 Native** | OpenAI | CodeGeeX4 9B, streaming, function calling |
| **Azure OpenAI** | OpenAI | GPT-4o (enterprise) |
| **Cohere** | OpenAI | Command R+, Command A |
| **NVIDIA NIM** | OpenAI | Llama 4 (NIM-optimized) |
| **Hyperbolic** | OpenAI | DeepSeek-V3 |
| **SambaNova** | OpenAI | Llama 4 (reconfigurable) |
| **Cloudflare AI** | OpenAI | Llama 4 Workers AI |
| **Google Vertex AI** | Gemini | Gemini 2.5 Pro (enterprise) |

---

## Live Lab Tri-Nuclear — Ecossistema Cognitivo

O **Live Lab Tri-Nuclear** e um subsistema cognitivo integrado ao CHIMERA, composto por tres nucleos sinergicos orquestrados pela **Agentica AI** (Arquiteta-Cognitiva v2.0). Cada nucleo opera com dados, regras e propositos distintos, conectados por workflows hibridos que atravessam nucleos para entregar valor composto.

### N1 — Nucleo Agregador (LLMs)

Camada de roteamento inteligente com 9 modelos LLM e algoritmo de cascata baseado em intencoes. Cada modelo possui metadados de custo, latencia, peso de roteamento e casos de uso prioritarios. O algoritmo avalia a intencao do usuario, seleciona o modelo primario pela cascata, e aplica fallback por peso se o primario falhar.

| Modelo | Provedor | Contexto | Custo (1M tok) | Latencia |
|--------|----------|----------|-----------------|----------|
| **GLM-4-Flash** | Zhipu AI | 128K | $0.10 / $0.10 | 320ms |
| **GLM-4-Plus** | Zhipu AI | 128K | $1.40 / $1.40 | 450ms |
| **DeepSeek-V3** | DeepSeek | 128K | $0.27 / $1.10 | 600ms |
| **GPT-4o** | OpenAI | 128K | $2.50 / $10.00 | 800ms |
| **Claude 4 Sonnet** | Anthropic | 200K | $3.00 / $15.00 | 700ms |
| **Gemini 2.5 Pro** | Google | 1M | $1.25 / $5.00 | 900ms |
| **Llama 4 Maverick** | Groq | 128K | $0.20 / $0.80 | 32ms |
| **CodeGeeX4 9B** | CodeGeeX Native | 128K | $0.00 / $0.00 | local |
| **GLM-5.2 744B MoE** | Colibri | 128K | $0.00 / $0.00 | local |

### N2 — Nucleo Produtividade (Skills)

Camada de 12 skills atomicas e 5 meta-skills compostas, cada uma com dominio, trigger regex, permissao RBAC e nivel de criticidade. As meta-skills encadeiam skills atomicas em sequencias determinadas (paralelo ou sequencial) para fluxos de produtividade avancada.

**Skills Atomicas (12)**: code_review, debug_assist, test_generation, refactoring_suggest, doc_generation, api_design, data_analysis, security_audit, perf_optimization, prompt_engineering, git_workflow, infra_as_code.

**Meta-Skills (5)**: full_stack_dev (encadeia 4+ atomicas), devops_pipeline (CI/CD completo), security_hardening (auditoria + remediacao), data_pipeline (ETL + analise + visualizacao), learning_path (modulo educacional adaptativo).

### N3 — Nucleo Ecossistema (Educacao/Certs)

Camada de trilhas de aprendizagem com modulos educacionais, criterios de aprovacao, e certificacoes por nivel. O nucleo conecta competencias ao ecossistema CHIMERA, permitindo que personas evoluam dentro de trilhas estruturadas com avaliacao automatica.

| Trilha | Modulos | Certificacao |
|--------|---------|--------------|
| **Full-Stack AI Developer** | 4 modulos | CHIMERA-FSAI-L1 a L4 |
| **DevOps Cloud Architect** | 3 modulos | CHIMERA-DCA-L1 a L3 |
| **AI Research Engineer** | 3 modulos | CHIMERA-AIRE-L1 a L3 |
| **Security & Compliance** | 2 modulos | CHIMERA-SC-L1 a L2 |

### Agentica AI — Arquiteta-Cognitiva

A **Agentica AI** e o agente orquestrador do Live Lab Tri-Nuclear, implementada em `src/lib/live-lab/agentica-ai.ts` com 7 funcoes de orquestracao:

| Funcao | Descricao | Output |
|--------|-----------|--------|
| `agenticaDiagnose()` | Diagnostico completo do ecossistema (integridade, modelos, skills, trilhas, governanca) | `AgenticaDiagnostico` |
| `agenticaRoute(intencao)` | Roteamento inteligente de intencao para modelo otimo (cascata + peso) | modelo + custo + latencia |
| `agenticaExecuteSkill(skillId, input, persona)` | Executa skill com routing automatico e logging | `AgenticaSkillResult` |
| `agenticaEvaluateModulo(moduloId)` | Avaliacao de modulo educacional com feedback | `AgenticaModuloResult` |
| `agenticaProgress(personaId)` | Progresso da persona na trilha ativa | `AgenticaPersonaProgress` |
| `agenticaStats()` | Estatisticas enriquecidas do ecossistema | modelos, skills, trilhas, workflows, certs |
| `agenticaGovernanca(personaId, acao, nivel)` | Verificacao RBAC em tempo real | `AgenticaGovernancaCheck` |

### Governanca RBAC — 5 Personas

| Persona | Papel | Nivel RBAC | Trilha Ativa |
|---------|-------|------------|--------------|
| **Dev_Basic** | Desenvolvedor Junior | basic | Full-Stack AI Developer |
| **DevOps_Admin** | Administrador DevOps | intermediate | DevOps Cloud Architect |
| **System_Architect** | Arquiteto de Sistemas | advanced | AI Research Engineer |
| **AI_Engineer** | Engenheiro de IA | advanced | AI Research Engineer |
| **Product_Manager** | Gestor de Produto | admin | Security & Compliance |

### Workflows Hibridos (Cross-Nucleo)

Fluxos que atravessam os tres nucleos para entregar valor composto. Cada passo indica qual nucleo (N1/N2/N3) atua e qual saida produz.

| Workflow | Nucleos | Descricao |
|----------|---------|-----------|
| **Desenvolvimento Guiado** | N1 -> N2 -> N3 | Usuario pede codigo -> LLM gera -> Skill executa -> Modulo avalia |
| **Auditoria de Seguranca** | N2 -> N1 -> N3 | Skill audita -> LLM analisa resultado -> Certificacao atualiza |
| **Pipeline de Aprendizado** | N3 -> N1 -> N2 | Trilha sugere modulo -> LLM ensina -> Skill pratica |

### Politicas de Governanca

O manifesto define politicas de governanca aplicadas pela Agentica AI em tempo real:

- **Rate Limiting**: Limites por persona e por acao (req/min, req/hora, req/dia)
- **Budget Tracking**: Orcamento mensal por persona com alertas em 50%, 80% e 95% de consumo
- **Privacidade e PII**: Mascaramento automatico de campos sensiveis (email, CPF, telefone, cartao) via regex

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
| **9router** | Routing | 23 providers, traducao de protocolo, fallback chains | `/api/9router/*` |
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
- **LLM Dedicado**: Roteamento via 9router com contexto de memoria (CodeGeeX4 -> Ollama -> DeepSeek -> Groq -> OpenAI)
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

# CodeGeeX4 (API nativa com function calling — requer GPU):
docker compose --profile codegeex up -d

# 5. Verificar logs
docker compose logs -f chimera

# 6. Status dos servicos
docker compose ps
```

### Servicos Docker (6)

| Servico | Porta | Profile | Descricao |
|---------|-------|---------|-----------|
| **chimera** | 3000 | default | Next.js 16 standalone + 62 API routes |
| **caddy** | 80, 443 | default | Reverse proxy + auto-SSL (Let's Encrypt) |
| **obscura** | 9222, 9223 | `obscura` | Headless browser Rust/V8 com CDP |
| **colibri** | 8000 | `colibri` | GLM-5.2 744B MoE inference (GPU) |
| **ollama** | 11434 | `ollama` | Local LLM inference (Llama 3, Mistral...) |
| **codegeex** | 8001 | `codegeex` | CodeGeeX4 9B native API, streaming + function calling (GPU) |

O servico **codegeex** roda a API nativa do CodeGeeX4 com suporte a streaming SSE, function calling (tool_use), e 128K de contexto. Usa o endpoint `/v1/chat/completions` diretamente compativel com o protocolo OpenAI, permitindo roteamento via 9router sem traducao de protocolo. Requer GPU NVIDIA e pesos do modelo montados no volume `codegeex-models`.

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
- (Opcional) NVIDIA GPU + CUDA para Colibri / Ollama / CodeGeeX4 com aceleracao
- (Opcional) Obscura binary para navegador headless integrado

---

## Variaveis de Ambiente

Todas as variaveis estao documentadas no arquivo [`.env.production`](.env.production) com 14 secoes:

```env
# Essenciais
DATABASE_URL="file:/app/data/chimera.db"
ZAI_API_KEY="..."          # GLM/Zhipu AI (primario)
VAULT_ENCRYPTION_KEY="..." # AES-256-GCM para vaults Bitcoin

# 9router Providers (preencha conforme necessidade — 23 providers)
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
|-- docker-compose.yml                 # Producao: 6 services (app, caddy, obscura, colibri, ollama, codegeex)
|-- Dockerfile                         # Multi-stage build (standalone)
|-- Caddyfile                          # Reverse proxy + SSL auto
|-- .env.production                    # Template de variaveis (14 secoes, 23 providers)
|-- .gitignore                         # Ignora .env* exceto .env.production
|-- codegeex4/                         # CodeGeeX4 native OpenAI-compat API server
|   +-- Dockerfile                     # Python 3.11 + PyTorch CUDA + FastAPI
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
|   |   +-- live-lab-tab.tsx           #   Painel Live Lab com Agentica AI
|   |-- lib/
|   |   |-- 9router-bridge.ts          # Bridge principal (routeChat, streamChat)
|   |   |-- 9router-engine/            # Motor 9router (23 providers + translators)
|   |   |-- live-lab/                  # Live Lab Tri-Nuclear v2.0
|   |   |   |-- raw-manifesto.json     #   Manifesto JSON (9 LLMs, 17 skills, 4 trilhas, 5 personas)
|   |   |   |-- manifesto.ts           #   Typed manifesto + AGENTICA_AI identity
|   |   |   |-- types.ts               #   TypeScript interfaces (LiveLabManifesto, Persona, Skill...)
|   |   |   |-- orchestrator.ts        #   Engine: routeToModel, executeSkill, evaluateModulo
|   |   |   |-- agentica-ai.ts          #   7 funcoes Arquiteta-Cognitiva (diagnose, route, governanca...)
|   |   |   +-- index.ts               #   Re-exports publicos
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
