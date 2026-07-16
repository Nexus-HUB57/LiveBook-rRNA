# CHIMERA — Multi-Agent Fusion Engine

> **CHIMERA** — A criatura mitologica que e fusao de multiplos seres. No codigo, MoE (Mixture of Experts) com 19k experts + 5 AI Agents fundidos numa entidade orquestrada com auto-cura regenerativa. Dashboard de ecossistema agentic com engine Colibri (GLM-5.2 744B MoE), auto-cura reativa de 6 fases, Expert Cortex visualization, streaming SSE nativo, tRPC v11, Prisma 6 + SQLite, e 5 AI Agents com Live GitHub Sync.

---

## Visao Geral

O **CHIMERA** evoluiu de um ecossistema de agentes para uma **Multi-Agent Fusion Engine** completa sobre o motor Colibri — um engine de inferencia LLM em C otimizado para GLM-5.2 744B (Mixture of Experts). O sistema combina dashboard em tempo real com 10 paineis, pipeline de auto-cura reativa de 6 fases, visualizacao de heatmap de 19k experts, chat streaming nativo SSE, e um hub de 5 agentes AI especializados com sync ao vivo do GitHub.

O motor Colibri implementa um sistema de 3 tiers para cache de experts: **VRAM** (mais rapido, capacidade limitada), **RAM** (intermediario), e **Disco** (fallback). Cada expert e roteado dinamicamente com base em frequencia de uso, e o dashboard visualiza esse roteamento em tempo real atraves do Expert Cortex — um canvas com pixels coloridos por tier e brilho por frequencia de ativacao.

**Nivel de Arquitetura:** Fullstack Monorepo — Next.js 16 + React 19 + Tailwind 4 + TypeScript 5 + tRPC v11 + Prisma 6.19 + SQLite + Framer Motion + Colibri Engine (C) + GLM-5.2 744B MoE

---

## Arquitetura Colibri

### Motor de Inferencia

```
┌─────────────────────────────────────────────────────────┐
│                    Colibri Engine (C)                     │
│                   GLM-5.2 744B MoE                       │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐               │
│  │  VRAM    │  │   RAM    │  │  Disco   │   3-Tier      │
│  │ Tier 0   │  │ Tier 1   │  │ Tier 2   │   Expert      │
│  │ ~2k exp  │  │ ~8k exp  │  │ ~9k exp  │   Cache       │
│  └──────────┘  └──────────┘  └──────────┘               │
│       ▲              ▲              ▲                     │
│       └──────────────┴──────────────┘                     │
│              Dynamic Expert Router                        │
└─────────────────────────────────────────────────────────┘
         │                              │
    /v1/chat/completions            /experts
    /v1/models                      /health
```

### Protocolo de Auto-Cura Reativo (6 Fases)

```
INVOKE → DETECT → HEAL → LEARN → DIRECT → PERSIST
   │         │        │        │        │        │
   ▼         ▼        ▼        ▼        ▼        ▼
 Executa  Detecta  Aplica  Armazena  Redireciona Persiste
 agente   anomalia cura    sabedoria  proxima   estado
                           peso++    acao      no DB
```

Cada ciclo percorre as 6 fases sequencialmente. Anomalias detectadas geram `HealingEvent` com severidade (critical/warning/info), e padroes recorrentes acumulam peso na `WisdomEntry` — formando uma memoria de auto-cura que melhora com o tempo.

---

## Stack Tecnica

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 16 (App Router) + React 19 |
| **Linguagem** | TypeScript 5 |
| **Estilo** | Tailwind CSS 4 + shadcn/ui |
| **API Layer** | tRPC v11 (type-safe) + REST API routes |
| **Database** | Prisma 6.19 + SQLite |
| **LLM Engine** | Colibri (C) — GLM-5.2 744B MoE |
| **Streaming** | SSE nativo (fetch + ReadableStream) |
| **Animacoes** | Framer Motion |
| **Runtime** | Bun |
| **Deploy** | Standalone Next.js + Caddy |

---

## Estrutura do Projeto

```
chimera/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Entry principal — 10 tabs
│   │   ├── layout.tsx                  # Root layout + providers
│   │   └── api/
│   │       └── colibri/
│   │           ├── health/route.ts     # Proxy GET /health
│   │           ├── models/route.ts     # Proxy GET /v1/models
│   │           ├── experts/route.ts    # Proxy GET /experts (hex heatmap)
│   │           └── chat/route.ts       # Proxy POST /v1/chat/completions (SSE)
│   ├── components/
│   │   ├── dashboard-tab.tsx           # Dashboard Colibri (6 sub-paineis)
│   │   ├── orchestration-tab.tsx       # Auto-cura 6 fases + gauges SVG
│   │   ├── agent-hub-tab.tsx           # Hub de 6 agentes
│   │   ├── rag-chat-tab.tsx            # Chat GLM-5.2 com streaming SSE
│   │   ├── invocation-tab.tsx          # 12 skills em 6 categorias
│   │   ├── metaverso-tab.tsx           # Metaverso (WebGL/WebXR)
│   │   ├── recuperacao-tab.tsx         # Recuperacao / backup
│   │   ├── rrna-systems-tab.tsx        # rRNA Systems
│   │   ├── moltbook-tab.tsx            # Moltbook (social)
│   │   ├── governance-tab.tsx          # Governanca (voting)
│   │   └── agent-chat.tsx              # FAB chat widget
│   ├── server/
│   │   ├── root.ts                     # 4 tRPC routers
│   │   └── routers/
│   │       ├── colibri.ts              # 7 procedures (health, models, experts, cycles, healing, wisdom, stats)
│   │       ├── dashboard.ts
│   │       ├── agents.ts
│   │       └── orchestration.ts
│   └── lib/
│       ├── self-healing-engine.ts      # Motor de auto-cura reativo
│       ├── wisdom-engine.ts            # Motor de sabedoria (peso + frequencia)
│       ├── orchestration-director.ts   # Diretor de orquestracao 6 fases
│       ├── rag-engine.ts               # Pipeline RAG rRNA
│       ├── llm-synthesis.ts            # Sintese via LLM
│       └── db.ts                       # Prisma client singleton
├── prisma/
│   └── schema.prisma                   # 12 modelos (incluindo Colibri)
├── agents/                             # 5 AI Agents (submodules)
│   ├── Zettascale/
│   ├── GenesisFlow/
│   ├── Antrophexus-AI/
│   ├── S-bio_Heroi_Agentic_AI/
│   └── Nexus_Sidian/
└── colibri/                            # Colibri Engine (C) — referencia
```

---

## Dashboard (10 Paineis)

| # | Tab | Descricao |
|---|-----|-----------|
| 1 | **Dashboard** | QuickStats (6 metricas), Engine Status, Hardware, Expert Tiers, Expert Cortex (canvas), Inline Chat |
| 2 | **Agent Hub** | 6 agentes filtraveis por tipo (orchestrator/specialist/analyst/voice/guardian) |
| 3 | **Chat GLM-5.2** | Chat streaming SSE com TTFT, tokens/sec, temperature, max tokens |
| 4 | **Invocacao** | 12 skills em 6 categorias com execucao simulada e log |
| 5 | **Orquestracao** | Pipeline 6 fases animado, gauges SVG (Coherence/Fidelity/Wisdom/Healing), Healing Log |
| 6 | **Metaverso** | WebXR / WebGL (placeholder) |
| 7 | **Recuperacao** | Backup / restore (placeholder) |
| 8 | **rRNA Systems** | Pipeline rRNA (placeholder) |
| 9 | **Moltbook** | Social feed (placeholder) |
| 10 | **Governanca** | Voting / governance (placeholder) |

---

## API Routes (Colibri)

Todos os endpoints proxy para o motor Colibri (`COLIBRI_URL`, default `http://127.0.0.1:8000`):

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/colibri/health` | Health check — retorna scheduler, tiers, hwinfo, kv_slots |
| GET | `/api/colibri/models` | Lista modelos disponiveis |
| GET | `/api/colibri/experts` | Hex-encoded expert heatmap (2 bits tier + 6 bits heat por expert) |
| POST | `/api/colibri/chat` | Chat completions com streaming SSE (proxy direto do body) |

### SSE Streaming

O chat utiliza `fetch` + `ReadableStream` para parser de SSE nativo (nao EventSource, pois precisa POST):

```typescript
const res = await fetch('/api/colibri/chat', {
  method: 'POST',
  body: JSON.stringify({ model: 'glm-5.2', messages, stream: true }),
});
const reader = res.body.getReader();
const decoder = new TextDecoder();
// Parse SSE: "data: {...}" lines → extract choices[0].delta.content
```

Headers de performance passados: `x-colibri-queue-wait-ms` (tempo de fila), `x-request-id`.

---

## tRPC Routers

| Router | Procedures |
|--------|-----------|
| `colibri` | `health`, `models`, `experts`, `cycles`, `healingEvents`, `wisdomEntries`, `dashboardStats` |
| `dashboard` | Stats do ecossistema de projetos |
| `agents` | CRUD de agentes + skills + knowledge |
| `orchestration` | Ciclos de orquestracao |

---

## Models do Prisma

### Core
- **Project** — Projetos indie do ecossistema (2.415+)
- **Agent** — Agentes AI com tipo, tier, capabilities
- **AgentSkill** — Skills por agente
- **KnowledgeEntry** — Chunks de conhecimento para RAG
- **ChatSession** / **ChatSessionMessage** — Chat com persistencia

### CHIMERA Orchestration
- **ColibriConnection** — Registro de conexoes ao motor
- **OrchestrationCycle** — Ciclos completos das 6 fases
- **HealingEvent** — Eventos de cura com severidade e resultado
- **WisdomEntry** — Memoria de padroes com peso acumulativo

---

## Expert Cortex Visualization

O Expert Cortex renderiza o heatmap de experts do Colibri em um canvas HTML:

```
Hex String: "3F 2A 1C ..."
           │  │  │
           │  │  └─ Heat (6 bits): frequencia de roteamento
           │  └──── Tier (2 bits): 00=Disk, 01=RAM, 10=VRAM
           └────── Byte por expert (~19k total)
```

- **Cor por tier:** VRAM = verde, RAM = azul, Disco = cinza
- **Brilho por heat:** mais roteado = mais brilhante
- **Hover tooltip:** layer, expert index, tier, heat value
- **Polling:** atualiza a cada 3 segundos

---

## Self-Healing Engine

O motor de auto-cura implementa um protocolo reativo gerativo:

1. **INVOKE** — Executa acao no agente/painel
2. **DETECT** — Analisa resultado, detecta anomalias (null data, erros, timeouts)
3. **HEAL** — Aplica correcao (retry com backoff, fallback, reconexao)
4. **LEARN** — Armazena padrao na Wisdom Engine (peso += 1 se sucesso)
5. **DIRECT** — Redireciona para proxima acao com base no contexto
6. **PERSIST** — Salva estado no SQLite via Prisma

A Wisdom Engine acumula conhecimento sobre padroes de falha e cura, com pesos que aumentam a cada aplicacao bem-sucedida — formando um sistema que melhora autonomamente.

---

## Variaveis de Ambiente

```env
DATABASE_URL="file:./dev.db"
COLIBRI_URL="http://127.0.0.1:8000"
```

---

## Setup

```bash
# Instalar dependencias
bun install

# Setup do banco
bun run db:push
bun run db:generate

# Desenvolvimento
bun run dev          # http://localhost:3000

# Build de producao
bun run build
bun run start        # standalone server
```

### Requisitos

- **Bun** (runtime)
- **Colibri Engine** rodando para funcionalidade completa (dashboard opera em modo degradado sem ele)
- O dashboard mostra "Conecte ao motor" quando o Colibri esta offline — todos os painéis sao gracefull

---

## Agentes do Ecossistema

| Agente | Tipo | Stack | Especialidade |
|--------|------|-------|---------------|
| **Zettascale** | Core | Next.js + Trigonal | Orquestracao trinuclear, Bitcoin, Treasury |
| **GenesisFlow** | Core | Next.js + Genkit | AI flows, Fusion synthesis |
| **Antrophexus AI** | Extended | Next.js + Firebase | Dashboard, Skills, Custodia |
| **Sabio Heroi** | Extended | Hono + Drizzle | Agentic AI com karma system |
| **Nexus Sidian** | Extended | Electron + Obsidian | Knowledge graph, Desktop |

---

## Deploy

O sistema utiliza Next.js standalone output com Caddy como reverse proxy:

```bash
bun run build        # Gera .next/standalone/
bun run start        # Inicia em producao
```

- **Caddyfile** incluido para reverse proxy com SSL automatico (Let's Encrypt)
- **Smoke test** automatizado em `scripts/smoke-test.ts`

---

## Licenca

Private — Nexus HUB57