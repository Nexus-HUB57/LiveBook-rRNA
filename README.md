# CHIMERA — Multi-Agent Fusion Engine

<p align="center">
  <strong>LLM Orchestration</strong> · <strong>100+ AI Providers</strong> · <strong>Protocol Translation</strong> · <strong>Bitcoin Custody</strong> · <strong>RAG Pipeline</strong> · <strong>Cognitive Architecture</strong>
</p>

---

## O que e o CHIMERA

O **CHIMERA** e uma **Multi-Agent Fusion Engine** — uma plataforma de orquestracao de agentes de IA com roteamento inteligente para mais de 100 provedores LLM. O sistema combina chamadas nativas de API com traducao automatica de protocolo (OpenAI, Claude, Gemini), cadeias de fallback resilientes, e uma arquitetura cognitiva baseada no metodo Think/Act/Prove.

Alem da camada de roteamento, o ecossistema inclui pipeline RAG biologico de 6 fases, custodia Bitcoin com PSBT v2, auto-cura reativa, e 5 agentes especializados com sincronizacao GitHub.

**Versao atual:** Integracao completa com **9router bridge** — todas as rotas de API roteiam atraves de 20+ provedores com fallback automatico.

---

## Arquitetura do 9router Bridge

Toda chamada LLM passa pelo bridge em-processo derivado do [decolua/9router](https://github.com/decolua/9router):

```
API Route → 9routerBridge.routeChat()
  ├── Resolve provider (registry + aliases)
  ├── Detect source format (OpenAI/Claude/Gemini)
  ├── Translate request: OpenAI → provider format (hub-and-spoke)
  ├── Execute fetch com timeout por-provider
  ├── Translate response: provider format → OpenAI
  └── Se falhou → proximo provider na fallback chain
```

### Fallback Chain Padrao

```
GLM (Zhipu AI) → DeepSeek → Groq → OpenAI → Anthropic (Claude) → Gemini → OpenRouter → ZAI SDK
```

Cada provider tem timeout independente. Credenciais sao resolvidas automaticamente de variaveis de ambiente. O ZAI SDK so e acionado como ultimo recurso quando nenhum provider responde.

### Provedores Registrados (20+)

| Provider | Formato | Modelos Principais |
|----------|---------|-------------------|
| **GLM (Zhipu AI)** | OpenAI | glm-4-flash, glm-4-plus, glm-4-long |
| **OpenAI** | OpenAI | gpt-4o, gpt-4o-mini, o3, o4-mini |
| **Anthropic (Claude)** | Claude | claude-sonnet-4, claude-opus-4, claude-haiku-3.5 |
| **Google Gemini** | Gemini | gemini-2.5-pro, gemini-2.5-flash |
| **DeepSeek** | OpenAI | deepseek-chat, deepseek-reasoner |
| **Groq** | OpenAI | llama-3.3-70b, mixtral-8x7b |
| **xAI (Grok)** | OpenAI | grok-3, grok-3-mini |
| **Mistral** | OpenAI | mistral-large, codestral |
| **Together AI** | OpenAI | Llama-3-70B, Mixtral |
| **Fireworks AI** | OpenAI | llama-v3p1-70b |
| **OpenRouter** | OpenAI | 100+ modelos meta-router |
| **Cerebras** | OpenAI | llama-3.3-70b (inference wafer-scale) |
| **SiliconFlow** | OpenAI | DeepSeek-V3, Qwen3-8B |
| **Ollama (Local)** | OpenAI | llama3, mistral, phi3 |
| **Azure OpenAI** | OpenAI | gpt-4o (enterprise) |
| **Cohere** | OpenAI | command-r-plus, command-a |
| **NVIDIA NIM** | OpenAI | Llama-3.1-70B, Llama-3.1-405B |
| **Hyperbolic** | OpenAI | DeepSeek-V3 |
| **SambaNova** | OpenAI | Llama-3.3-70B |
| **Cloudflare Workers AI** | OpenAI | meta/llama-3.1-8b |

---

## Stack Tecnica

| Camada | Tecnologia |
|--------|-----------|
| **Framework** | Next.js 16.1 (App Router, Turbopack, Standalone Output) |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui + Framer Motion |
| **Linguagem** | TypeScript 5 |
| **LLM Routing** | 9router bridge (in-process, hub-and-spoke protocol translation) |
| **API Layer** | tRPC v11 (type-safe) + 41 REST API routes |
| **Database** | Prisma 6.19 + SQLite (15 modelos) |
| **Bitcoin** | bitcoinjs-lib (BIP32/39, P2PKH) + @noble/secp256k1 (PSBT v2) |
| **RAG** | Pipeline rRNA com BM25 field-boosted + cross-encoder reranking |
| **Cognitive** | Fable Method Engine (Think/Act/Prove) + Fable 5 OS |
| **Auto-Cura** | Protocolo reativo de 6 fases + Wisdom Engine adaptativa |
| **Streaming** | SSE nativo (fetch + ReadableStream, async generators) |
| **Deploy** | Docker (standalone) + Space-Z (HuggingFace Spaces) |

---

## Design System

| Propriedade | Valor |
|------------|-------|
| Background | `#080b0d` |
| Accent primario | `#00ff88` (emerald) |
| Accent secundario | `#22d3ee` (cyan) |
| Fonte body | Inter |
| Fonte mono | IBM Plex Mono |
| Componentes | shadcn/ui + Tailwind CSS 4 |
| Badges | `text-[10px]`, borders `border-zinc-800/60` |
| Cards | `bg-zinc-900/30` |
| Idioma | pt-BR (todos os strings visiveis) |

---

## Agentes do Ecossistema

| Agente | Tipo | Especialidade | Integracao |
|--------|------|---------------|-------------|
| **Mythos** | Orquestrador | Coordena multiplos agentes com tool calling via 9router | `/api/orchestrate` |
| **Fable 5 OS** | Subagente | Spawning recursivo, auto-correcao (3 tentativas), karma tracking | `/api/fable/spawn` |
| **RAG rRNA** | Pipeline | 6 estagios biologicos com BM25 + reranking + 9router synthesis | `/api/rag/query` |
| **9router** | Routing | 100+ providers, traducao de protocolo, fallback chains | `/api/9router/*` |
| **Bitcoin Vault** | Custodia | BIP32/39 HD wallet + PSBT v2 + AES-256-GCM | `/api/vaults/*` |
| **Colibri** | Inference | GLM-5.2 744B MoE, 3-tier expert cache (VRAM/RAM/Disk) | `/api/colibri/*` |
| **Sibyl Analyst** | Analista | Analise de mercado financeiro e cripto | Orquestrado via Mythos |
| **Neo Synth** | Tecnico | Analise de codigo, arquiteturas, planos de acao | Orquestrado via Mythos |

### Diagnostico Clinico por Agente

O ecossistema suporta atribuicoes de **diagnostico clinico** quando configurado com provedores de LLM apropriados:

| Capacidade | Agente Responsavel | Rota | Descricao |
|------------|---------------------|------|-------------|
| Analise de sintomas | Mythos + subagentes | `/api/orchestrate` | Interpreta descricao de sintomas, solicita exames complementares, gera hipoteses diagnosticas |
| Triagem prioritaria | Sibyl Analyst | Via Mythos | Classifica urgencia (emergencia/urgencia/eletriva) com base em protocolos clinicos |
| Sintese de resultados | Neo Synth | Via Mythos | Consolida resultados de multiplas fontes em laudo estruturado |
| Pesquisa de evidencias | Fable 5 | `/api/fable/spawn` | Busca diretrizes clinicas, estudos, e meta-analises como subagente recursivo |
| Base de conhecimento medico | RAG rRNA | `/api/rag/query` | Indexa diretrizes, protocolos, e artigos para recuperacao contextual |
| Roteamento multi-provider | 9router | `/api/9router/route-chat` | Garante disponibilidade: se um provider falha, outro assume |

> **Nota:** O diagnostico clinico requer dados de entrada do profissional de saude. O sistema opera como ferramenta de apoio a decisao clinica, nao substitui o julgamento medico.

---

## Arquitetura Fable Method (4 Skills)

Toda tarefa nao-trivial percorre o pipeline cognitivo **Think → Act → Prove**:

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

### Skill 1: fable-method — Think / Act / Prove

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

8 checks automaticos com veredicto quantificado:

| # | Check | Criterio | Peso |
|---|-------|----------|------|
| 1 | Think phase executed | Fase think presente e nao pulada | 15 |
| 2 | Act phase produced results | Pelo menos 1 step concluido | 15 |
| 3 | Prove phase verified | Fase prove executou verificacao | 15 |
| 4 | Evidence quality | >= 2 evidencias com confianca >= 70% | 15 |
| 5 | No skipped phases | Zero fases puladas | 10 |
| 6 | Reasonable time | Duracao < 120 segundos | 10 |
| 7 | Plan-to-evidence traceability | Steps ligados a evidencias | 10 |
| 8 | No failed steps | Nenhum passo falhou | 10 |

Veredictos: **VERIFIED** (>= 80), **CAVEATS** (>= 50), **REFUTED** (< 50)

### Skill 4: fable-domain — Adaptadores de Setor

5 adaptadores pre-construidos com convencoes, trap fixtures e smoke tests:

| Setor | Foco | Traps |
|-------|------|-------|
| `chimera-dashboard` | Dark premium, shadcn/ui, tabs, pt-BR | Dead code, CSS sync, type safety |
| `bitcoin-vault` | BIP32/39, PSBT v2, custody | Key exposure no client bundle |
| `rag-rrna` | BM25 field boosting, TF isolation | TF reuso entre campos |
| `fable-orchestrator` | LLM spawning, auto-correcao, karma | Infinite loop, sandbox cleanup |
| `colibri-routing` | 9router: providers, protocol translation, fallback | Credential check, timeout propagation |

---

## Fable 5 OS — Orquestrador de Subagentes

Sistema de spawning de subagentes via 9router bridge com auto-correcao:

- **Spawning**: Gera solucoes via LLM com capability especifica e fallback chain
- **Auto-correcao**: Ate 3 tentativas com analise de erro iterativa
- **Karma tracking**: Karma gerado proporcional ao trabalho real (duracao)
- **Sandbox management**: Sandboxes isolados com cleanup automatico
- **Capabilities**: `code-gen`, `analysis`, `refactor`, `test-gen`, `doc-gen`
- **Persistencia**: Tasks e execucoes salvas via Prisma
- **Routing**: Toda chamada LLM via 9router bridge (GLM → DeepSeek → Groq)

---

## 9router — Roteamento Multi-Provider

### Funcionalidades

- **Protocol Translation**: Hub-and-spoke com OpenAI como formato intermediario
- **Provider Registry**: 20+ providers com transport config, modelos, e aliases
- **Credential Resolution**: Lookup automatico de API keys por provider via env vars
- **Fallback Chains**: Cadeias customizaveis com timeout independente por provider
- **Streaming**: Async generator `streamChat()` para SSE token-by-token
- **Provider Status**: `/api/9router/providers` retorna status de configuracao de cada provider

### Variaveis de Ambiente para Providers

```env
# Primario (Zhipu AI / GLM)
ZAI_API_KEY="..."

# OpenAI
OPENAI_API_KEY="..."

# Anthropic (Claude)
ANTHROPIC_API_KEY="..."

# Google Gemini
GOOGLE_API_KEY="..."

# DeepSeek
DEEPSEEK_API_KEY="..."

# Groq
GROQ_API_KEY="..."

# xAI (Grok)
XAI_API_KEY="..."

# Mistral
MISTRAL_API_KEY="..."

# OpenRouter (meta-router para 100+ modelos)
OPENROUTER_API_KEY="..."
```

Se nenhum provider externo estiver configurado, o sistema opera via ZAI SDK como fallback.

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

Pipeline biologico de 6 estagios com sintese via 9router:

```
EXTRACT --> ENCODE --> RETRIEVE --> RERANK --> AUGMENT --> GENERATE
  |           |          |           |          |          |
  v           v          v           v          v          v
 Chunking   TF-IDF     BM25      Cross-enc  Context   9router
 recursive  bigrams    field      rerank    assembly  bridge
            n-gram     boosted              4000c    LLM call
                       title 2x
```

- **TF-IDF** com n-gram expansion (bigramas)
- **BM25 scoring** com field boosting (content 1.5x, title 2.0x, source 1.0x)
- **Per-field TF maps** — cada campo tem seu proprio TF (nunca reusado entre campos)
- **Cross-encoder reranking** heuristico (exact phrase, n-gram overlap, positional bonus)
- **Context window** de 4000 chars maximo
- **LLM Synthesis** via 9router bridge (GLM → DeepSeek → Groq)

---

## Protocolo de Auto-Cura Reativo (6 Fases)

```
INVOKE --> DETECT --> HEAL --> LEARN --> DIRECT --> PERSIST
   |          |         |        |         |         |
   v          v         v        v         v         v
 Executa   Detecta   Aplica   Armazena  Redireciona Persiste
 agente    anomalia  cura    sabedoria  proxima   estado
 (9router)           peso++   acao      no DB
```

Anomalias detectadas geram `HealingEvent` com severidade (critical/warning/info). Padroes recorrentes acumulam peso na `WisdomEntry` — memoria que melhora com o tempo.

---

## API Routes (41 endpoints)

### 9router Bridge (2 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/9router/providers` | Listar todos os providers com status de configuracao |
| POST | `/api/9router/route-chat` | Roteamento direto de chat via qualquer provider |

### Orquestracao (3 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/orchestrate` | Ciclo completo Mythos (tool calling + subagentes via 9router) |
| POST | `/api/agent/chat` | Chat com agente (non-streaming, 9router) |
| POST | `/api/agent/chat/stream` | Chat streaming SSE (9router) |
| POST | `/api/agent/analyze` | Analise de ecossistema (9router) |

### Fable Method (9 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/fable/method` | Executar fable-method (inline/plan/audit/report) |
| GET | `/api/fable/method` | Historico de execucoes |
| POST | `/api/fable/loop` | Executar fable-loop (subagentes paralelos + judge) |
| POST | `/api/fable/judge` | Verificacao adversarial com 8 checks |
| POST | `/api/fable/domain` | Obter adaptador de setor |
| GET | `/api/fable/domain` | Listar todos os adaptadores |
| POST | `/api/fable/spawn` | Spawn Fable 5 OS subagente (via 9router) |
| GET | `/api/fable/stats` | Estatisticas de execucao |
| POST | `/api/fable/tasks` | Listar tasks |
| GET | `/api/fable/task/[id]` | Detalhe de task especifico |

### Bitcoin Vault (5 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET/POST | `/api/vaults` | Listar/criar vaults |
| GET/DELETE | `/api/vaults/[id]` | Detalhe/remover vault |
| POST | `/api/vaults/[id]/generate-address` | Derivar endereco HD |
| POST | `/api/vaults/[id]/custody` | Custodia de transacao |
| POST | `/api/vaults/import-address` | Importar endereco existente |

### Colibri Engine (5 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET | `/api/colibri/health` | Health check com scheduler, tiers, hwinfo |
| GET | `/api/colibri/models` | Modelos disponiveis |
| GET | `/api/colibri/experts` | Hex-encoded expert heatmap |
| POST | `/api/colibri/chat` | Chat completions com SSE |
| POST | `/api/colibri/orchestrate` | Orquestracao multi-modelo |

### RAG (1 rota)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| POST | `/api/rag/query` | Pipeline RAG rRNA completa com 9router synthesis |

### Utilidades (16 rotas)

| Metodo | Rota | Descricao |
|--------|------|-----------|
| GET/POST | `/api/projects` | Projetos do ecossistema |
| GET | `/api/projects/stats` | Estatisticas de projetos |
| POST | `/api/hd-wallet` | Carteira HD (BIP32/39) |
| POST | `/api/mnemonic` | Gerar mnemonic |
| POST | `/api/generate-wallet` | Gerar carteira completa |
| POST | `/api/withdraw` | Saque Bitcoin |
| POST | `/api/consolidate` | Consolidacao UTXO |
| POST | `/api/moltbook` | Feed social Moltbook |
| POST | `/api/federated` | Consulta federada |
| POST | `/api/webhook/invoke` | Invocacao via webhook |
| GET | `/api/agents` | Listar agentes |
| POST | `/api/binance` | Dados Binance |
| GET | `/api/chat/history` | Historico de chat |
| POST | `/api/fable/agent-query` | Query de capabilities de agente |
| * | `/api/trpc/[trpc]` | tRPC v11 type-safe router |
| * | `/api` | API root |

---

## Models do Prisma (15)

### Core (7)

| Modelo | Descricao |
|--------|-----------|
| `Project` | Projetos do ecossistema com categoria e metadados |
| `Agent` | Agentes AI com tipo, tier, capabilities, LLM model |
| `AgentSkill` | Skills por agente (reasoning, execution, perception, finance, voice, governance) |
| `KnowledgeEntry` | Chunks de conhecimento para RAG (doc, flow, api, config) |
| `ChatSession` | Sessoes de chat com agente |
| `ChatSessionMessage` | Mensagens com fontes RAG |
| `ChatMessage` | Mensagens genericas |

### Orquestracao (4)

| Modelo | Descricao |
|--------|-----------|
| `ColibriConnection` | Conexoes ao motor de inferencia |
| `OrchestrationCycle` | Ciclos das 6 fases com metricas |
| `HealingEvent` | Eventos de cura com severidade e delta |
| `WisdomEntry` | Memoria de padroes com peso adaptativo |

### Bitcoin (3)

| Modelo | Descricao |
|--------|-----------|
| `Vault` | Vaults encriptados com XPUB e derivacao HD |
| `VaultAddress` | Enderecos derivados com balance e UTXO count |
| `VaultTransaction` | Transacoes rastreadas (send/receive/consolidate/custody) |

### Social (1)

| Modelo | Descricao |
|--------|-----------|
| `MoltbookState` | Estado do Moltbook + persistencia Fable Method |

---

## Dashboard (11 Paineis)

| # | Tab | Descricao | Status |
|---|-----|-----------|--------|
| 1 | **Dashboard** | QuickStats (6 metricas), Engine Status, Hardware, Expert Cortex, Inline Chat | Producao |
| 2 | **Agent Hub** | 5+ agentes filtraveis por tipo com capabilities e GitHub sync | Producao |
| 3 | **Chat** | Chat streaming SSE com 9router multi-provider, TTFT, tokens/sec | Producao |
| 4 | **Invocacao** | 12 skills em 6 categorias com execucao e log | Producao |
| 5 | **Orquestracao** | Pipeline 6 fases animado, gauges SVG, Mythos agent routing | Producao |
| 6 | **Metaverso** | WebXR/WebGL com particles, wormhole, black hole, knowledge graph | Producao |
| 7 | **Recuperacao** | Self-healing engine, recovery protocols, wisdom memory | Producao |
| 8 | **rRNA Systems** | Pipeline RAG rRNA com BM25 + reranking + 9router synthesis | Producao |
| 9 | **Fable Method** | 4 skills interativos (method/loop/judge/domain) + history | Producao |
| 10 | **Moltbook** | Social knowledge graph com karma weighting | Producao |
| 11 | **Governanca** | Voting e governance | Producao |

---

## Estrutura do Projeto

```
chimera/
|-- AGENTS.md                          # Mapa de arquitetura dos agentes
|-- CLAUDE.md                          # Regras proativas para Claude Code
|-- .claude/skills/                    # Claude Code plugin skills (4)
|   |-- fable-method/SKILL.md          #   Think/Act/Prove pipeline
|   |-- fable-loop/SKILL.md            #   Orquestracao paralela
|   |-- fable-judge/SKILL.md           #   Verificacao adversarial
|   +-- fable-domain/SKILL.md          #   Adaptadores de setor
|-- src/
|   |-- app/
|   |   |-- page.tsx                   # Dashboard principal — 11 tabs
|   |   |-- layout.tsx                 # Root layout + Inter font
|   |   +-- api/                       # 41 API routes
|   |       |-- 9router/               #   2 rotas 9router bridge
|   |       |-- fable/                 #   9 rotas Fable Method
|   |       |-- orchestrate/           #   Mythos orchestration
|   |       |-- agent/                 #   3 rotas agentic (chat + analyze)
|   |       |-- vaults/                #   5 rotas Bitcoin vault
|   |       |-- colibri/               #   5 rotas Colibri engine
|   |       +-- rag/                   #   RAG rRNA pipeline
|   |-- components/                    # 89 componentes React
|   |   |-- fable-method-tab.tsx       # Tab Fable Method interativa
|   |   |-- dashboard-tab.tsx          # Dashboard com sub-paineis
|   |   |-- agent-hub-tab.tsx          # Hub de agentes
|   |   |-- rag-chat-tab.tsx           # Chat RAG com streaming
|   |   +-- metaverse/                 # 22 componentes WebGL/canvas
|   |-- lib/
|   |   |-- 9router-bridge.ts          # Bridge principal (routeChat, streamChat)
|   |   |-- 9router-engine/            # Motor 9router
|   |   |   |-- provider-registry.ts   #   20+ providers com transporte
|   |   |   |-- protocol-translator.ts #   Traducao OpenAI/Claude/Gemini
|   |   |   +-- translator/            #   Concerns JS do 9router original
|   |   |-- fable-method-engine.ts     # Motor Think/Act/Prove (4 skills)
|   |   |-- fable-5-orchestrator.ts    # Orquestrador LLM subagentes (via 9router)
|   |   |-- llm-synthesis.ts          # Streaming LLM synthesis (via 9router)
|   |   |-- rag-engine.ts             # Pipeline RAG rRNA
|   |   |-- vault-service.ts          # Servico de custody Bitcoin
|   |   |-- dynamic-vault.ts          # Vault dinamico BIP32
|   |   |-- psbt.ts                   # PSBT v2 operations
|   |   |-- bip39.ts                  # Mnemonic generation
|   |   |-- self-healing-engine.ts    # Auto-cura reativa 6 fases
|   |   +-- wisdom-engine.ts          # Memoria de sabedoria
|   +-- server/
|       +-- routers/                   # 4 tRPC routers
|-- prisma/
|   +-- schema.prisma                 # 15 modelos
|-- colibri/                            # Colibri Engine (C) — GLM-5.2 744B MoE
|-- agents/                            # 5 AI Agents (submodules)
|-- 9router/                           # decolua/9router (referencia, read-only)
+-- Dockerfile                         # Multi-stage build (standalone)
```

---

## Claude Code Integration

O ecossistema inclui integracao proativa com Claude Code:

- **AGENTS.md** — Mapa completo de agentes, skills, data flow, e 9router bridge
- **CLAUDE.md** — Regras proativas: classificar complexidade, carregar domain adapters, verificar traps, nunca importar SDK diretamente
- **.claude/skills/** — 4 skills instalados como plugin Claude Code (fable-method, fable-loop, fable-judge, fable-domain)

---

## Setup

```bash
# Clonar
gh repo clone Nexus-HUB57/LiveBook-rRNA

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
- **API keys** para pelo menos um provider LLM (GLM via `ZAI_API_KEY` ou outros)
- **Colibri Engine** (opcional) para funcionalidade completa de expert routing

### Variaveis de Ambiente Essenciais

```env
DATABASE_URL="file:./chimera.db"
ZAI_API_KEY="..."                       # GLM/Zhipu AI (provider primario)
VAULT_ENCRYPTION_KEY="..."              # AES-256-GCM para vaults Bitcoin
# Adicione outras API keys conforme os providers desejados
```

---

## Possibilidades de Uso

### Desenvolvimento de Software
- Orquestracao de agentes para geracao de codigo, refactoring, e analise de arquitetura
- Verificacao adversarial automatica (fable-judge) com 8 checks de qualidade
- Domain adapters com trap fixtures para evitar erros conhecidos

### Diagnostico Clinico (Apoio a Decisao)
- Triagem de sintomas com classificacao de prioridade via Mythos orchestration
- Pesquisa de evidencias em bases de conhecimento via RAG rRNA
- Sintese de laudos com multi-provider fallback para disponibilidade maxima
- Analise de resultados laboratoriais com Neo Synth

### Analise Financeira
- Monitoramento de mercado cripto via Sibyl Analyst
- Custodia Bitcoin com PSBT v2 e derivacao HD
- Consolidacao de UTXOs e otimizacao de fees

### Pesquisa e RAG
- Indexacao de documentos com chunking recursivo
- Recuperacao BM25 com reranking heuristico
- Sintese contextual via 9router bridge com 100+ providers

---

## Licenca

Private — Nexus HUB57
