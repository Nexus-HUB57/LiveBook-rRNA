# CHIMERA — Multi-Agent Fusion Engine

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/9router-20%2B%20providers-00ff88" alt="Providers" />
  <img src="https://img.shields.io/badge/tRPC-v11-0097A7?logo=trpc" alt="tRPC" />
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/GLM--5.2%20744B%20MoE-emerald" alt="GLM-5.2" />
  <img src="https://img.shields.io/badge/API%20Routes-42-cyan" alt="API Routes" />
  <img src="https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker" alt="Docker" />
</p>

<p align="center">
  <strong>LLM Orchestration</strong> · <strong>20+ AI Providers</strong> · <strong>Protocol Translation</strong> · <strong>Bitcoin Custody</strong> · <strong>RAG Pipeline Clinico</strong> · <strong>Cognitive Architecture</strong> · <strong>Auto-Cura Reativa</strong>
</p>

---

## Visao Geral

O **CHIMERA** e uma **Multi-Agent Fusion Engine** — plataforma de orquestracao de agentes de IA com roteamento inteligente para 20+ provedores LLM. O sistema combina chamadas nativas de API com traducao automatica de protocolo (OpenAI, Claude, Gemini), cadeias de fallback resilientes, e uma arquitetura cognitiva baseada no metodo Think/Act/Prove.

Alem da camada de roteamento, o ecossistema inclui pipeline RAG biologico de 6 fases para diagnostico clinico, custodia Bitcoin com PSBT v2, auto-cura reativa em 6 fases, 7 agentes especializados, e 42 API routes.

---

## Stack Tecnica

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 16.1 (App Router, Turbopack, Standalone Output) |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui + Framer Motion |
| **Linguagem** | TypeScript 5 |
| **LLM Routing** | 9router bridge (in-process, hub-and-spoke protocol translation) |
| **API Layer** | tRPC v11 (type-safe) + 42 REST API routes |
| **Database** | Prisma 6 + SQLite (15 modelos) |
| **Bitcoin** | bitcoinjs-lib (BIP32/39, P2PKH) + @noble/secp256k1 (PSBT v2) |
| **RAG** | Pipeline rRNA com BM25 field-boosted + cross-encoder reranking |
| **Cognitive** | Fable Method Engine (Think/Act/Prove) + Fable 5 OS |
| **Auto-Cura** | Protocolo reativo de 6 fases + Wisdom Engine adaptativa |
| **Streaming** | SSE nativo (fetch + ReadableStream, async generators) |
| **Deploy** | Docker + Caddy (auto-SSL) + docker-compose |

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

Cada provider tem timeout independente. O ZAI SDK so e acionado como fallback final.

### Provedores Registrados (20+)

| Provider | Formato | Modelos Principais |
|----------|---------|-------------------|
| **GLM (Zhipu AI)** | OpenAI | GLM-5.2 744B MoE, glm-4-flash, glm-4-plus |
| **DeepSeek** | OpenAI | DeepSeek-V3, DeepSeek-Reasoner |
| **Groq** | OpenAI | Llama 4 Maverick, Llama 4 Scout |
| **OpenAI** | OpenAI | GPT-4o, GPT-4o-mini, o3, o4-mini |
| **Anthropic** | Claude | Claude 4 Sonnet, Claude 4 Opus, Claude 3.5 Haiku |
| **Google Gemini** | Gemini | Gemini 2.5 Pro, Gemini 2.5 Flash |
| **xAI (Grok)** | OpenAI | Grok 3, Grok 3 Mini |
| **Mistral** | OpenAI | Mistral Large, Codestral |
| **Together AI** | OpenAI | Llama 4, Mixtral |
| **Fireworks AI** | OpenAI | Llama 4 Scout |
| **OpenRouter** | OpenAI | 100+ modelos (meta-router) |
| **Cerebras** | OpenAI | Llama 4 (inference wafer-scale, 32ms latency) |
| **SiliconFlow** | OpenAI | DeepSeek-V3, Qwen3-8B |
| **Ollama (Local)** | OpenAI | llama3, mistral, phi3 |
| **Azure OpenAI** | OpenAI | GPT-4o (enterprise) |
| **Cohere** | OpenAI | Command R+, Command A |
| **NVIDIA NIM** | OpenAI | Llama 4 (NIM-optimized) |
| **Hyperbolic** | OpenAI | DeepSeek-V3 |
| **SambaNova** | OpenAI | Llama 4 (reconfigurable) |
| **Cloudflare** | OpenAI | Llama 4 Workers AI |

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

## 7 Agentes do Ecossistema

| Agente | Tipo | Especialidade | Integracao |
|--------|------|---------------|-------------|
| **Mythos** | Orquestrador | Coordena multiplos agentes com tool calling via 9router | `/api/orchestrate` |
| **Fable 5 OS** | Subagente | Spawning recursivo, auto-correcao (3 tentativas), karma tracking | `/api/fable/spawn` |
| **RAG rRNA** | Pipeline | 6 estagios biologicos com BM25 + reranking + 9router synthesis | `/api/rag/query` |
| **9router** | Routing | 20+ providers, traducao de protocolo, fallback chains | `/api/9router/*` |
| **Bitcoin Vault** | Custodia | BIP32/39 HD wallet + PSBT v2 + AES-256-GCM | `/api/vaults/*` |
| **Colibri** | Inference | GLM-5.2 744B MoE, 3-tier expert cache (VRAM/RAM/Disk) | `/api/colibri/*` |
| **Moltbook** | Social | Rede social de agentes com karma, rank, curadoria | `/api/moltbook` |

---

## Capacidades de Diagnostico Clinico

O ecossistema suporta atribuicoes de **diagnostico clinico** como ferramenta de apoio a decisao medica:

| Capacidade | Agente | Rota | Descricao |
|------------|--------|------|-------------|
| Identificacao de Patogenos | RAG rRNA | `/api/rag/query` | rRNA 16S/23S para classificacao taxonomica |
| Resistencia Antimicrobiana | RAG rRNA | `/api/rag/query` | Deteccao de genes de resistencia via RAG |
| Diarreia Infecciosa | Mythos + RAG | `/api/orchestrate` | Triagem multiplex para GI pathogens |
| Meningite Bacteriana | Mythos | `/api/agent/analyze` | Identificacao rapida via rRNA CNS |
| Sepsis Neonatal | Fable 5 | `/api/fable/spawn` | Screening precoce via blood culture rRNA |
| Tuberculose | RAG rRNA | `/api/rag/query` | Deteccao M. tuberculosis via rRNA |
| Analise de Sintomas | Mythos + sub | `/api/orchestrate` | Interpreta sintomas, solicita exames, gera hipoteses |
| Triagem Prioritaria | Sibyl Analyst | Via Mythos | Classifica urgencia (emergencia/urgencia/eletiva) |
| Sintese de Laudos | Neo Synth | Via Mythos | Consolida resultados multi-fonte em laudo estruturado |
| Pesquisa de Evidencias | Fable 5 | `/api/fable/spawn` | Diretrizes clinicas, estudos, meta-analises |
| Base de Conhecimento | RAG rRNA | `/api/rag/query` | Indexa diretrizes, protocolos, artigos |

> **Nota:** O diagnostico clinico requer dados de entrada do profissional de saude. O sistema opera como ferramenta de apoio a decisao clinica, nao substitui o julgamento medico.

---

## Arquitetura Fable Method (4 Skills)

```
User Task
  |
  v
Fable Method Engine
  |-- fable-method  --> Classificar, planejar, executar, verificar
  |-- fable-loop    --> Subagentes paralelos + judge automatico
  |-- fable-judge   --> Verificacao adversarial (8 checks)
  +-- fable-domain  --> Adaptadores de setor com trap fixtures
```

### Skill 1: fable-method (Think/Act/Prove)

| Modo | Comportamento |
|------|---------------|
| `inline` | Execucao completa Think -> Act -> Prove |
| `plan` | Para apos THINK, entrega o plano |
| `audit` | Avalia trabalho existente contra o metodo |
| `report` | Reescreve outcome-first com caveats honestos |

### Skill 2: fable-loop (Orquestracao Paralela)

Spawn de 3 subagentes em paralelo -> merge de evidencias -> THINK/ACT/PROVE -> fable-judge automatico.

### Skill 3: fable-judge (Verificacao Adversarial)

8 checks automaticos: Think phase, Act results, Prove verification, Evidence quality, Phase completion, Time bounds, Traceability, Failed steps. Veredictos: VERIFIED (>=80), CAVEATS (>=50), REFUTED (<50).

### Skill 4: fable-domain (5 Adaptadores)

| Setor | Foco |
|-------|------|
| `chimera-dashboard` | Dark premium, shadcn/ui, tabs, pt-BR |
| `bitcoin-vault` | BIP32/39, PSBT v2, custody |
| `rag-rrna` | BM25 field boosting, TF isolation |
| `fable-orchestrator` | LLM spawning, auto-correcao, karma |
| `colibri-routing` | 9router: providers, protocol translation, fallback |

---

## RAG rRNA Pipeline

```
EXTRACT --> ENCODE --> RETRIEVE --> RERANK --> AUGMENT --> GENERATE
  |           |          |           |          |          |
  v           v          v           v          v          v
 Chunking   TF-IDF     BM25      Cross-enc  Context   9router
 recursive  bigrams    field      rerank    assembly  bridge
            n-gram     boosted              4000c    LLM call
                       title 2x
```

- TF-IDF com n-gram expansion (bigramas)
- BM25 scoring com field boosting (content 1.5x, title 2.0x)
- Per-field TF maps isolados
- Cross-encoder reranking heuristico
- Context window de 4000 chars
- LLM Synthesis via 9router bridge

---

## Protocolo de Auto-Cura Reativa (6 Fases)

```
INVOKE --> DETECT --> HEAL --> LEARN --> DIRECT --> PERSIST
```

Anomalias geram `HealingEvent` com severidade. Padroes recorrentes acumulam peso na `WisdomEntry` — memoria que melhora com o tempo.

---

## API Routes (42 endpoints)

### 9router (2) | Agent (3) | Fable (9) | Colibri (5) | RAG (1) | Bitcoin (5) | Utilidades (17)

| Grupo | Rotas |
|-------|-------|
| **9router** | `GET /api/9router/providers`, `POST /api/9router/route-chat` |
| **Agent** | `POST /api/agent/chat`, `POST /api/agent/chat/stream`, `POST /api/agent/analyze` |
| **Fable** | `/api/fable/method`, `/api/fable/loop`, `/api/fable/judge`, `/api/fable/domain`, `/api/fable/spawn`, `/api/fable/stats`, `/api/fable/tasks`, `/api/fable/task/[id]`, `/api/fable/agent-query` |
| **Colibri** | `/api/colibri/health`, `/api/colibri/models`, `/api/colibri/experts`, `/api/colibri/chat`, `/api/colibri/orchestrate` |
| **RAG** | `POST /api/rag/query` |
| **Orquestracao** | `POST /api/orchestrate` |
| **Bitcoin** | `/api/vaults`, `/api/vaults/[id]`, `/api/vaults/[id]/generate-address`, `/api/vaults/[id]/custody`, `/api/vaults/import-address` |
| **Wallet** | `/api/hd-wallet`, `/api/mnemonic`, `/api/generate-wallet`, `/api/withdraw` |
| **System** | `/api/projects`, `/api/projects/stats`, `/api/consolidate`, `/api/federated`, `/api/agents`, `/api/moltbook`, `/api/binance`, `/api/chat/history`, `/api/webhook/invoke` |
| **tRPC** | `/api/trpc/[trpc]` |

---

## Dashboard — 12 Paineis Integrados

| # | Painel | Descricao |
|---|--------|-----------|
| 1 | **Conexao CHIMERA** | Endpoint config, status online/offline |
| 2 | **Motor CHIMERA** | Scheduler: ativo, fila, completos, falhas |
| 3 | **Quick Stats** | 6 metricas: Cores, RAM, Model, Experts, KV Slots, Uptime |
| 4 | **Hardware** | CPU, GPU, VRAM, RAM detalhes |
| 5 | **Expert Tiers** | Distribuicao VRAM/RAM/Disk com heatmap |
| 6 | **Fallback Chain** | 8 provedores em cadeia animada com latencia |
| 7 | **System Metrics** | 6 metricas live com sparklines (throughput, latencia, cache, tokens, uptime, erros) |
| 8 | **9router Provider Grid** | 20 providers com status, latencia, RPM, modelo |
| 9 | **Agent Command Center** | 7 agentes com contexto, RPM, status, ultima acao |
| 10 | **Fable Method + RAG Pipeline + Diagnostico** | 4 skills, 5 domain adapters, 6 estagios pipeline, 6 areas clinicas |
| 11 | **API Routes** | 42 endpoints em 8 grupos |
| 12 | **Expert Cortex** | Heatmap interativo do GLM-5.2 |
| 13 | **Chat CHIMERA** | Streaming inline com TTFT, tokens/sec |

---

## Estrutura do Projeto

```
chimera/
|-- AGENTS.md                          # Mapa de arquitetura dos agentes
|-- CLAUDE.md                          # Regras proativas para Claude Code
|-- docker-compose.yml                 # Producao: app + Caddy + volumes
|-- Dockerfile                         # Multi-stage build (standalone)
|-- Caddyfile                          # Reverse proxy + SSL auto
|-- .env.production                   # Template de variaveis de producao
|-- .dockerignore                      # Build context limpo
|-- prisma/
|   +-- schema.prisma                 # 15 modelos
|-- src/
|   |-- app/
|   |   |-- page.tsx                   # Dashboard principal — 11 tabs
|   |   |-- layout.tsx                 # Root layout + IBM Plex Mono
|   |   +-- api/                       # 42 API routes
|   |       |-- 9router/               #   2 rotas 9router bridge
|   |       |-- fable/                 #   9 rotas Fable Method
|   |       |-- agent/                 #   3 rotas agentic
|   |       |-- colibri/               #   5 rotas Colibri engine
|   |       |-- vaults/                #   5 rotas Bitcoin vault
|   |       +-- rag/                   #   RAG rRNA pipeline
|   |-- components/                    # 90+ componentes React
|   |-- lib/
|   |   |-- 9router-bridge.ts          # Bridge principal (routeChat, streamChat)
|   |   |-- 9router-engine/            # Motor 9router
|   |   |   |-- provider-registry.ts   #   20+ providers
|   |   |   +-- protocol-translator.ts #   Traducao OpenAI/Claude/Gemini
|   |   |-- fable-method-engine.ts     # Motor Think/Act/Prove
|   |   |-- fable-5-orchestrator.ts    # Orquestrador LLM subagentes
|   |   |-- llm-synthesis.ts          # Streaming LLM synthesis
|   |   |-- rag-engine.ts             # Pipeline RAG rRNA
|   |   |-- self-healing-engine.ts    # Auto-cura reativa 6 fases
|   |   +-- wisdom-engine.ts          # Memoria de sabedoria
|   +-- server/
|       +-- routers/                   # 4 tRPC routers
|-- 9router/                           # decolua/9router (referencia, read-only)
+-- colibri/                            # Colibri Engine (C) — GLM-5.2 744B MoE
```

---

## Deploy de Producao

### Docker Compose (Recomendado)

```bash
# 1. Clonar
gh repo clone Nexus-HUB57/LiveBook-rRNA

# 2. Configurar variaveis
 cp .env.production .env
# Edite .env com suas API keys

# 3. Subir
 docker compose up -d --build
```

O Caddy provisiona SSL automaticamente via Let's Encrypt quando um dominio e configurado. Sem dominio, serve HTTP na porta 80.

### Docker Manual

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
- API key para pelo menos um provider LLM
- (Opcional) Colibri Engine para expert routing completo

---

## Variaveis de Ambiente

```env
# Essenciais
DATABASE_URL="file:./chimera.db"
ZAI_API_KEY="..."          # GLM/Zhipu AI (primario)
VAULT_ENCRYPTION_KEY="..." # AES-256-GCM para vaults

# 9router Providers (preencha conforme necessidade)
OPENAI_API_KEY="..."
ANTHROPIC_API_KEY="..."
GEMINI_API_KEY="..."
DEEPSEEK_API_KEY="..."
GROQ_API_KEY="..."
XAI_API_KEY="..."
MISTRAL_API_KEY="..."
OPENROUTER_API_KEY="..."
# ... veja .env.production para lista completa
```

---

## Possibilidades de Desenvolvimento

| Dominio | Exemplo |
|---------|---------|
| **Multiagentes Autonomos** | Assistentes empresariais, pipelines de automacao, sistemas de decisao |
| **Saude e Bioinformatica** | Diagnostico genomico, analise de sequencias, vigilancia epidemiologica |
| **Financeiro e Blockchain** | Custodia de cripto, analise on-chain, trading algoritmico, AML |
| **Infraestrutura Auto-Curada** | Monitoramento autonomo, SRE assistido por IA, disaster recovery |
| **Conhecimento e RAG** | Bases corporativas inteligentes, busca semantica, pesquisa academica |
| **IA Explicavel (XAI)** | Auditoria de decisoes com Fable Judge, relatorios com cadeia de raciocinio |
| **DAOs de IA** | Governanca descentralizada, marketplaces de skills, curadoria colaborativa |

---

## Licenca

Private — Nexus HUB57
