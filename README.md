# CHIMERA — Multi-Agent Fusion Engine

> **CHIMERA** — A criatura mitologica que e fusao de multiplos seres. No codigo, MoE (Mixture of Experts) com 19k experts + 5 AI Agents fundidos numa entidade orquestrada com auto-cura regenerativa. Dashboard com 10 tabs, engine Colibri (GLM-5.2 744B MoE), pipeline RAG rRNA 6 fases, Bitcoin BIP32/39 + PSBT v2, Fable Method Engine (Think/Act/Prove), Fable 5 OS (LLM subagent spawning), e 5 AI Agents com Live GitHub Sync.

---

## Visao Geral

O **CHIMERA** e uma **Multi-Agent Fusion Engine** completa sobre o motor Colibri — engine de inferencia LLM em C otimizado para GLM-5.2 744B (Mixture of Experts). O sistema combina:

- **Dashboard em tempo real** com 10 paineis navegaveis por tabs
- **Fable Method Engine** — arquitetura cognitiva Think/Act/Prove com 4 skills (fable-method, fable-loop, fable-judge, fable-domain)
- **Fable 5 OS** — orquestrador de subagentes com LLM, auto-correcao e karma tracking
- **Pipeline RAG rRNA** — 6 estagios biologicos: Extract, Encode, Retrieve, Rerank, Augment, Generate
- **Bitcoin Vault** — BIP32/39 HD wallet + PSBT v2 + AES-256-GCM custody
- **Auto-cura reativa** de 6 fases com Wisdom Engine adaptativa
- **Expert Cortex** — visualizacao heatmap de 19k experts com 3-tier cache
- **Chat streaming SSE** nativo com GLM-5.2
- **5 AI Agents** especializados com GitHub sync

O motor Colibri implementa um sistema de 3 tiers para cache de experts: **VRAM** (mais rapido, ~2k experts), **RAM** (intermediario, ~8k), e **Disco** (fallback, ~9k). Cada expert e roteado dinamicamente com base em frequencia de uso.

**Nivel de Arquitetura:** Fullstack Monorepo — Next.js 16.1 (Turbopack) + React 19 + Tailwind CSS 4 + TypeScript 5 + tRPC v11 + Prisma 6.19 + SQLite + Framer Motion + Colibri Engine (C) + GLM-5.2 744B MoE

---

## Stack Tecnica

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 16.1 (App Router, Turbopack, Standalone Output) |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui + Framer Motion |
| **Linguagem** | TypeScript 5 |
| **API Layer** | tRPC v11 (type-safe) + 40+ REST API routes |
| **Database** | Prisma 6.19 + SQLite (15 modelos) |
| **LLM Engine** | Colibri (C) — GLM-5.2 744B MoE |
| **Bitcoin** | bitcoinjs-lib (BIP32/39, P2PKH) + @noble/secp256k1 (PSBT v2) |
| **RAG** | Pipeline rRNA com BM25 field-boosted + cross-encoder reranking |
| **Cognitive** | Fable Method Engine (Think/Act/Prove) + Fable 5 OS |
| **Streaming** | SSE nativo (fetch + ReadableStream) |
| **Deploy** | Docker (standalone) + Space-Z (HuggingFace Spaces) |

---

## Design System

| Propriedade | Valor |
|------------|-------|
| Background | `#080b0d` |
| Accent primario | `#00ff88` (emerald) |
| Accent secundario | `#22d3ee` (cyan) |
| Fonte body | IBM Plex Mono (monospace universal) |
| Badges | `text-[10px]`, borders `border-zinc-800/60` |
| Cards | `bg-zinc-900/30` |
| Idioma | pt-BR (todos os strings visiveis) |

---

## Arquitetura Fable Method (4 Skills)

A arquitetura cognitiva baseia-se no **Fable Method** (inspirado em Sahir619/fable-method). Toda tarefa nao-trivial percorre o pipeline Think → Act → Prove.

```
User Task
  │
  ▼
Fable Method Engine
  ├── fable-method  → Classificar, planejar, executar, verificar
  ├── fable-loop    → Subagentes paralelos + judge automatico
  ├── fable-judge   → Verificacao adversarial (8 checks)
  └── fable-domain  → Adaptadores de setor com trap fixtures
```

### Skill 1: fable-method — Think / Act / Prove

Pipeline cognitivo fundamental com 4 modos:

| Modo | Comportamento |
|------|---------------|
| `inline` | Execucao completa Think → Act → Prove |
| `plan` | Para apos THINK, entrega o plano |
| `audit` | Avalia trabalho existente contra o metodo |
| `report` | Reescreve outcome-first com caveats honestos |

**THINK** classifica complexidade (trivial/standard/complex/critical), avalia risco, reune evidencias.
**ACT** gera e executa plan steps com rastreabilidade de evidencia por step.
**PROVE** verifica cada step concluido contra evidencias (confianca >= 0.7), computa score.

### Skill 2: fable-loop — Orquestracao Paralela

Para tarefas complexas/criticas:
1. Spawn de 3 subagentes em paralelo (file-mapper, dep-checker, api-verifier)
2. Merge de evidencias em contexto unificado
3. Execucao THINK → ACT → PROVE
4. Invocacao automatica do fable-judge

### Skill 3: fable-judge — Verificacao Adversarial

8 checks automaticos:

| # | Check | Criterio |
|---|-------|----------|
| 1 | Think phase executed | Fase think presente e nao pulada |
| 2 | Act phase produced results | Pelo menos 1 step concluido |
| 3 | Prove phase verified | Fase prove executou verificacao |
| 4 | Evidence quality | >= 2 evidencias com confianca >= 70% |
| 5 | No skipped phases | Zero fases puladas |
| 6 | Reasonable time | Duracao < 120 segundos |
| 7 | Plan-to-evidence traceability | Steps ligados a evidencias |
| 8 | No failed steps | Nenhum passo falhou |

Veredictos: **VERIFIED** (>= 80), **CAVEATS** (>= 50), **REFUTED** (< 50)

### Skill 4: fable-domain — Adaptadores de Setor

5 adaptadores pre-construidos com convencoes, trap fixtures e smoke tests:

| Setor | Foco | Traps |
|-------|------|-------|
| `chimera-dashboard` | Dark premium, shadcn/ui, tabs, pt-BR | Dead code, CSS sync, type safety |
| `bitcoin-vault` | BIP32/39, PSBT v2, custody | Key exposure no client bundle |
| `rag-rrna` | BM25 field boosting, TF isolation | TF reuso entre campos |
| `fable-orchestrator` | LLM spawning, auto-correcao, karma | Infinite loop, sandbox cleanup |
| `colibri-routing` | Tier routing, expert atlas, fallback | Model availability sem fallback |

---

## Fable 5 OS — Orquestrador de Subagentes

Sistema de spawning de subagentes via LLM com auto-correcao:

- **Spawning**: Gera solucoes via LLM (FABLE_5_SYSTEM prompt) com capability especifica
- **Auto-correcao**: Ate 3 tentativas (CORRECTION_SYSTEM prompt) com analise de erro
- **Karma tracking**: Karma gerado proporcional ao trabalho real (duracao * steps)
- **Sandbox management**: Sandboxes isolados em `/tmp/fable_sandbox_*/` com cleanup automatico
- **Capabilities**: `code-gen`, `analysis`, `refactor`, `test-gen`, `doc-gen`
- **Persistencia**: Tasks e execucoes salvas via Prisma

---

## Bitcoin Vault — BIP32/39 + PSBT v2

Modulo completo de custodia Bitcoin:

- **HD Wallet**: Derivacao BIP32/39 com mnemonic de 12/24 palavras
- **Enderecos**: P2PKH via bitcoinjs-lib
- **PSBT v2**: Assinatura parcial via @noble/secp256k1
- **Custody**: Encriptacao AES-256-GCM para vault storage (lazy key access)
- **Consolidacao**: UTXO consolidation para otimizacao de fees
- **Balance**: Verificacao via mempool.space API
- **Seguranca**: Chaves privadas nunca no client-side, XPRV/seed server-side only

---

## RAG rRNA Pipeline

Pipeline biologico de 6 estagios:

```
EXTRACT → ENCODE → RETRIEVE → RERANK → AUGMENT → GENERATE
```

- **TF-IDF** com n-gram expansion (bigramas)
- **BM25 scoring** com field boosting (content 1.5x, title 2.0x, source 1.0x)
- **Per-field TF maps** — cada campo tem seu proprio TF (nunca reusado entre campos)
- **Cross-encoder reranking** heuristico (exact phrase, n-gram overlap, positional bonus)
- **Context window** de 4000 chars maximo
- **Offline mode** com mensagem fixa quando sem LLM

---

## Protocolo de Auto-Cura Reativo (6 Fases)

```
INVOKE → DETECT → HEAL → LEARN → DIRECT → PERSIST
   │         │        │        │        │        │
   ▼         ▼        ▼        ▼        ▼        ▼
 Executa  Detecta  Aplica  Armazena  Redireciona Persiste
 agente   anomalia cura    sabedoria  proxima   estado
                           peso++    acao      no DB
```

Anomalias detectadas geram `HealingEvent` com severidade (critical/warning/info). Padroes recorrentes acumulam peso na `WisdomEntry` — memoria de auto-cura que melhora com o tempo.

---

## Estrutura do Projeto

```
chimera/
├── AGENTS.md                          # Mapa de arquitetura dos agentes
├── CLAUDE.md                          # Regras proativas para Claude Code
├── .claude/skills/                    # Claude Code plugin skills
│   ├── fable-method/SKILL.md          #   Think/Act/Prove pipeline
│   ├── fable-loop/SKILL.md            #   Orquestracao paralela
│   ├── fable-judge/SKILL.md           #   Verificacao adversarial
│   └── fable-domain/SKILL.md          #   Adaptadores de setor
├── src/
│   ├── app/
│   │   ├── page.tsx                   # Dashboard principal — 10 tabs
│   │   ├── layout.tsx                 # Root layout + IBM Plex Mono
│   │   ├── not-found.tsx              # 404 estilizado dark
│   │   ├── error.tsx                  # Error boundary estilizado
│   │   └── api/                       # 40+ API routes
│   │       ├── fable/                 # 8 rotas Fable Method
│   │       │   ├── method/            #   fable-method skill
│   │       │   ├── loop/              #   fable-loop skill
│   │       │   ├── judge/             #   fable-judge skill
│   │       │   ├── domain/            #   fable-domain skill
│   │       │   ├── spawn/             #   Fable 5 OS spawning
│   │       │   ├── stats/             #   Estatisticas
│   │       │   ├── tasks/             #   Listagem de tasks
│   │       │   └── task/[id]/         #   Detalhe de task
│   │       ├── vaults/                # 4 rotas Bitcoin vault
│   │       ├── colibri/               # 5 rotas Colibri engine
│   │       ├── agent/                 # 3 rotas agentic chat
│   │       └── ...                    # RAG, projects, etc.
│   ├── components/                    # 61 componentes custom
│   │   ├── fable-method-tab.tsx       # Tab Fable Method interativa
│   │   ├── dashboard-tab.tsx          # Dashboard com 6 sub-paineis
│   │   ├── agent-hub-tab.tsx          # Hub de 5 agentes
│   │   ├── rag-chat-tab.tsx           # Chat RAG com streaming
│   │   └── metaverse/                 # 22 componentes WebGL/canvas
│   ├── lib/
│   │   ├── fable-method-engine.ts     # Motor Think/Act/Prove (4 skills)
│   │   ├── fable-5-orchestrator.ts    # Orquestrador LLM subagentes
│   │   ├── rag-engine.ts              # Pipeline RAG rRNA
│   │   ├── vault-service.ts           # Servico de custody Bitcoin
│   │   ├── dynamic-vault.ts           # Vault dinamico BIP32
│   │   ├── psbt.ts                    # PSBT v2 operations
│   │   ├── bip39.ts                   # Mnemonic generation
│   │   ├── self-healing-engine.ts     # Auto-cura reativa 6 fases
│   │   ├── wisdom-engine.ts           # Memoria de sabedoria
│   │   └── orchestration-director.ts  # Diretor de orquestracao
│   └── server/
│       └── routers/                   # 4 tRPC routers
├── prisma/
│   └── schema.prisma                 # 15 modelos
├── colibri/                            # Colibri Engine (C) — referencia
├── agents/                            # 5 AI Agents (submodules)
└── Dockerfile                         # Multi-stage build (standalone)
```

---

## Dashboard (10 Paineis)

| # | Tab | Descricao | Status |
|---|-----|-----------|--------|
| 1 | **Dashboard** | QuickStats (6 metricas), Engine Status, Hardware, Expert Cortex (canvas), Inline Chat | Producao |
| 2 | **Agent Hub** | 5 agentes filtraveis por tipo (orchestrator/specialist/analyst/voice/guardian) | Producao |
| 3 | **Chat GLM-5.2** | Chat streaming SSE com TTFT, tokens/sec, temperature | Producao |
| 4 | **Invocacao** | 12 skills em 6 categorias com execucao e log | Producao |
| 5 | **Orquestracao** | Pipeline 6 fases animado, gauges SVG (Coherence/Fidelity/Wisdom/Healing) | Producao |
| 6 | **Metaverso** | WebXR/WebGL com particles, wormhole, black hole, knowledge graph | Producao |
| 7 | **Recuperacao** | Self-healing engine, recovery protocols | Producao |
| 8 | **rRNA Systems** | Pipeline RAG rRNA com BM25 + reranking | Producao |
| 9 | **Fable Method** | 4 skills interativos (method/loop/judge/domain) + history | Producao |
| 10 | **Moltbook** | Social knowledge graph com karma | Producao |
| 11 | **Governanca** | Voting e governance | Producao |

---

## API Routes

### Fable Method (8 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/fable/method` | Executar fable-method (inline/plan/audit/report) |
| GET | `/api/fable/method` | Historico de execucoes |
| POST | `/api/fable/loop` | Executar fable-loop (subagentes paralelos + judge) |
| POST | `/api/fable/judge` | Verificacao adversarial |
| POST | `/api/fable/domain` | Obter adaptador de setor |
| GET | `/api/fable/domain` | Listar todos os adaptadores |
| POST | `/api/fable/spawn` | Spawn Fable 5 OS subagente |
| GET | `/api/fable/stats` | Estatisticas de execucao |

### Bitcoin Vault (4 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET/POST | `/api/vaults` | Listar/criar vaults |
| GET/DELETE | `/api/vaults/[id]` | Detalhe/remover vault |
| POST | `/api/vaults/[id]/generate-address` | Derivar endereco HD |
| POST | `/api/vaults/[id]/custody` | Custodia de transacao |

### Colibri Engine (5 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/colibri/health` | Health check com scheduler, tiers, hwinfo |
| GET | `/api/colibri/models` | Modelos disponiveis |
| GET | `/api/colibri/experts` | Hex-encoded expert heatmap |
| POST | `/api/colibri/chat` | Chat completions com SSE |
| POST | `/api/colibri/orchestrate` | Orquestracao multi-modelo |

### Outras Rotas

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/rag/query` | Pipeline RAG rRNA completa |
| GET/POST | `/api/projects` | Projetos do ecossistema |
| POST | `/api/agent/chat` | Chat com agente |
| GET | `/api/agent/chat/stream` | Chat streaming |
| POST | `/api/hd-wallet` | Carteira HD (BIP32/39) |
| POST | `/api/mnemonic` | Gerar mnemonic |
| POST | `/api/generate-wallet` | Gerar carteira completa |
| POST | `/api/withdraw` | Saque Bitcoin |
| POST | `/api/consolidate` | Consolidacao UTXO |
| POST | `/api/moltbook` | Feed social |
| POST | `/api/federated` | Consulta federada |
| POST | `/api/orchestrate` | Ciclo de orquestracao |
| POST | `/api/webhook/invoke` | Invocacao via webhook |

---

## Models do Prisma (15)

### Core
| Modelo | Descricao |
|--------|-----------|
| `Project` | Projetos do ecossistema |
| `Agent` | Agentes AI com tipo, tier, capabilities |
| `AgentSkill` | Skills por agente |
| `KnowledgeEntry` | Chunks de conhecimento para RAG |
| `ChatSession` | Sessoes de chat |
| `ChatSessionMessage` | Mensagens de chat |
| `ChatMessage` | Mensagens genericas |

### Orquestracao
| Modelo | Descricao |
|--------|-----------|
| `ColibriConnection` | Conexoes ao motor |
| `OrchestrationCycle` | Ciclos das 6 fases |
| `HealingEvent` | Eventos de cura com severidade |
| `WisdomEntry` | Memoria de padroes com peso |

### Bitcoin
| Modelo | Descricao |
|--------|-----------|
| `Vault` | Vaults encriptados |
| `VaultAddress` | Enderecos derivados HD |
| `VaultTransaction` | Transacoes rastreadas |

### Social
| Modelo | Descricao |
|--------|-----------|
| `MoltbookState` | Estado do Moltbook + persistencia Fable |

---

## 5 Agentes do Ecossistema

| Agente | Tipo | Especialidade |
|--------|------|---------------|
| **Zettascale** | Core | Orquestracao trinuclear, Bitcoin, Treasury |
| **GenesisFlow** | Core | AI flows, Fusion synthesis |
| **Antrophexus AI** | Extended | Dashboard, Skills, Custodia |
| **Sabio Heroi** | Extended | Agentic AI com karma system |
| **Nexus Sidian** | Extended | Knowledge graph, Desktop |

---

## Variaveis de Ambiente

```env
DATABASE_URL="file:./chimera.db"       # Fallback: file:./chimera.db
COLIBRI_URL="http://127.0.0.1:8000"  # Motor Colibri (opcional)
VAULT_ENCRYPTION_KEY="..."             # Chave AES-256-GCM para vaults
```

---

## Setup

```bash
# Instalar dependencias
npm install

# Setup do banco
npx prisma db push
npx prisma generate

# Desenvolvimento
npx next dev          # http://localhost:3000

# Build de producao
npx next build        # Standalone output
node .next/standalone/server.js  # Producao
```

### Docker

```bash
docker build -t chimera .
docker run -p 3000:3000 --env-file .env.local chimera
```

### Requisitos

- **Node.js** 20+
- **Prisma CLI** (incluso como dependencia)
- **Colibri Engine** rodando para funcionalidade completa (dashboard opera em modo degradado sem ele)

---

## Claude Code Integration

O ecossistema inclui integracao proativa com Claude Code:

- **AGENTS.md** — Mapa completo de agentes, skills e data flow
- **CLAUDE.md** — Regras proativas: classificar complexidade, carregar domain adapters, verificar traps antes de mudancas
- **.claude/skills/** — 4 skills instalados como plugin Claude Code

---

## Licenca

Private — Nexus HUB57