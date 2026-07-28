# CHIMERA — Multi-Agent Fusion Engine

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/9router-23%20providers-00ff88" alt="Providers" />
  <img src="https://img.shields.io/badge/tRPC-v11-0097A7?logo=trpc" alt="tRPC" />
  <img src="https://img.shields.io/badge/Prisma-6.11-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/GLM--5.2-Connected-emerald" alt="GLM-5.2" />
  <img src="https://img.shields.io/badge/API%20Routes-71-cyan" alt="API Routes" />
  <img src="https://img.shields.io/badge/Docker-6%20services-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Live%20Lab-Tri--Nuclear%20v3.0-purple" alt="Live Lab" />
  <img src="https://img.shields.io/badge/Tests-131%20passing-brightgreen" alt="Tests" />
  <img src="https://img.shields.io/badge/Agentica%20AI-9%20functions-f472b6" alt="Agentica AI" />
</p>

<p align="center">
  <strong>LLM Orchestration</strong> · <strong>23 AI Providers</strong> · <strong>Protocol Translation</strong> · <strong>CodeGeeX4 Native</strong> · <strong>Bitcoin PSBT v2</strong> · <strong>RAG Pipeline</strong> · <strong>Sandbox VM</strong> · <strong>Headless Browser</strong> · <strong>Self-Healing</strong> · <strong>Live Lab Tri-Nuclear v3.0</strong>
</p>

---

## Abstract

CHIMERA e uma plataforma de orquestracao multi-agente para LLMs que implementa roteamento inteligente baseado em **MCDM PROMETHEE II** com funcao de preferencia linear (Tipo V), tradução automatica de protocolo em topologia hub-and-spoke para 23 provedores, e um subsistema cognitivo trinuclear — o **Live Lab v3.0** — orquestrado pela Agentica AI com 9 funcoes de alto nivel. O sistema incorpora governanca por RBAC hierárquico (4 tiers), controle de taxa por Token Bucket com prioridade, projecao de orcamento com alertas em limiares configuráveis, e mascaramento de PII com trilha de auditoria. A arquitetura suporta 71 REST endpoints, 4 routers tRPC, streaming SSE nativo, e deploy containerizado com 6 servicos Docker.

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHIMERA FUSION ENGINE                               │
│                         Next.js 16 App Router                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Dashboard   │  │  13 Tabs UI  │  │  tRPC v11   │  │  71 REST Routes  │   │
│  │  (React 19)  │  │  shadcn/ui   │  │  4 Routers  │  │  + 9 Live Lab    │   │
│  └──────┬──────┘  └──────┬───────┘  └──────┬──────┘  └────────┬─────────┘   │
│         │                │                 │                   │             │
│  ┌──────┴────────────────┴─────────────────┴───────────────────┴─────────┐   │
│  │                        Core Libraries                                │   │
│  │  ┌──────────────┐  ┌───────────────┐  ┌─────────────────────────┐   │   │
│  │  │ 9router      │  │ Fable Method  │  │ Live Lab Tri-Nuclear   │   │   │
│  │  │ Bridge       │  │ Think/Act/    │  │ ┌─────────────────────┐│   │   │
│  │  │ 23 providers │  │ Prove Engine  │  │ │ Agentica AI (9 fn)  ││   │   │
│  │  │ Hub-Spoke    │  │              │  │ │ PROMETHEE II MCDM   ││   │   │
│  │  │ Protocol Tx  │  │              │  │ │ TokenBucket + Budget││   │   │
│  │  └──────┬───────┘  └───────────────┘  │ │ PII Audit Trail     ││   │   │
│  │         │                             │ │ RBAC 4-tier         ││   │   │
│  │         │                             │ │ Skill Composition   ││   │   │
│  │         │                             │ └─────────────────────┘│   │   │
│  │         │                             └─────────────────────────┘   │   │
│  └─────────┼──────────────────────────────────────────────────────────┘   │
│            │                                                               │
│  ┌─────────┼──────────────────────────────────────────────────────────┐   │
│  │         │              Subsystems                                    │   │
│  │  ┌──────┴───────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐  │   │
│  │  │  RAG rRNA    │ │ Sandbox  │ │ Bitcoin  │ │ Obscura │ │ Self- │  │   │
│  │  │  6-stage BM25│ │ VM Node  │ │ PSBT v2  │ │ Rust/V8 │ │ Healing│  │   │
│  │  │  + Reranking │ │ 5 tiers  │ │ BIP32/39 │ │ CDP MCP │ │ 6 ph. │  │   │
│  │  └──────────────┘ └──────────┘ └──────────┘ └─────────┘ └───────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Prisma 6 + SQLite (15 models) │ Caddy (auto-SSL) │ Docker Compose        │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|------------|
| **Framework** | Next.js 16.1 (App Router, Turbopack) | Standalone output para deploy leve, ISR/SSR/SSG unificado |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui | Componentes acessíveis, composabilidade, Framer Motion |
| **Language** | TypeScript 5 (strict) | Type safety em toda a stack, generics avancados |
| **LLM Routing** | 9router (in-process bridge) | Hub-and-spoke protocol translation, 23 providers, O(1) dispatch |
| **API Layer** | tRPC v11 + 71 REST routes | Type-safe RPC para dashboard, REST para integracao externa |
| **Database** | Prisma 6 + SQLite | Zero-ops embedded DB, 15 models, migracoes declarativas |
| **Bitcoin** | bitcoinjs-lib + @noble/secp256k1 | BIP32/39 HD wallet, P2PKH, PSBT v2 com AES-256-GCM |
| **RAG** | BM25 field-boosted + cross-encoder | Pipeline biologico 6 fases com reranking neural |
| **Cognitive** | Fable Method (Think/Act/Prove) | Raciocinio estruturado com auto-correcao em 3 tentativas |
| **Sandbox** | Node.js `vm` module (isolated) | 5 tiers com limites de memoria/tempo, evolucao genetica |
| **Browser** | Obscura (Rust/V8, CDP) | Anti-fingerprinting, 3520+ trackers, MCP 13 tools |
| **Testing** | Jest — 131 tests, 3 suites | Coverage: algorithms, orchestrator, agentica-ai, federated |
| **Deploy** | Docker multi-stage + Caddy | 6 services, auto-SSL via Let's Encrypt |

---

## 3. 9router Bridge — Protocol Translation

O 9router implementa traducao de protocolo em topologia **hub-and-spoke**: toda comunicacao e traduzida para/desde o formato OpenAI, eliminando a necessidade de adaptadores ponto-a-ponto.

```text
Request Flow:

  Client (OpenAI format)
       │
       ▼
  ┌─────────────────┐     ┌──────────────────┐     ┌──────────────┐
  │ 9routerBridge   │────>│ Provider Registry │────>│ Provider API │
  │ routeChat()     │     │ (23 providers)    │     │ (native fmt) │
  └────────┬────────┘     └──────────────────┘     └──────┬───────┘
           │                                               │
           │         ┌──────────────────┐                 │
           │<────────│ Response         │<────────────────┘
           │         │ Translator       │
           │         │ (provider→OpenAI) │
           │         └──────────────────┘
           │
           │  [on failure: fallback chain]
           ▼
     Next provider in chain
```

### 3.1 Fallback Chain

```text
GLM (Zhipu AI) → DeepSeek → Groq → OpenAI → Anthropic → Gemini → OpenRouter → ZAI SDK
     primary          2nd        3rd      4th       5th         6th       meta-router  last-resort
```

Cada chamada executa `fetch` com timeout por-provider. Em falha, a cadeia avanca sem retry exaustivo no mesmo provedor — maximizando resiliencia e minimizando latencia p99.

### 3.2 Provider Registry (23 providers)

| Provider | Protocol | Models | Notes |
|----------|----------|--------|-------|
| **Zhipu AI** | OpenAI | GLM-4-Flash, GLM-4-Plus, GLM-4-Long, **GLM-5.2** | Primary provider |
| **DeepSeek** | OpenAI | DeepSeek-V3, DeepSeek-Reasoner | Chain-of-thought |
| **Groq** | OpenAI | Llama 4 Maverick, Llama 4 Scout | Wafer-scale, 32ms p50 |
| **OpenAI** | OpenAI | GPT-4o, GPT-4o-mini, o3, o4-mini | Multimodal |
| **Anthropic** | Claude | Claude 4 Sonnet, Claude 4 Opus, Claude 3.5 Haiku | 200K context |
| **Google Gemini** | Gemini | Gemini 2.5 Pro (2M), Gemini 2.5 Flash | Ultra-long context |
| **xAI** | OpenAI | Grok 3, Grok 3 Mini | |
| **Mistral** | OpenAI | Mistral Large, Codestral | Multilingual |
| **Perplexity** | OpenAI | Sonar Pro, Sonar Reasoning | Web-grounded |
| **Together AI** | OpenAI | Llama 4, Mixtral | |
| **Fireworks** | OpenAI | Llama 4 Scout | |
| **OpenRouter** | OpenAI | 100+ models | Meta-router |
| **Cerebras** | OpenAI | Llama 4 | Wafer-scale inference |
| **SiliconFlow** | OpenAI | DeepSeek-V3, Qwen3-8B | |
| **Ollama** | OpenAI | llama3, mistral, phi3 | Local inference |
| **CodeGeeX4** | OpenAI | CodeGeeX4 9B | Local, 128K context |
| **CodeGeeX4 Native** | OpenAI | CodeGeeX4 9B | Streaming + function calling |
| **Azure OpenAI** | OpenAI | GPT-4o | Enterprise SLA |
| **Cohere** | OpenAI | Command R+, Command A | |
| **NVIDIA NIM** | OpenAI | Llama 4 | NIM-optimized |
| **Hyperbolic** | OpenAI | DeepSeek-V3 | |
| **SambaNova** | OpenAI | Llama 4 | Reconfigurable |
| **Cloudflare AI** | OpenAI | Llama 4 | Workers AI edge |
| **Google Vertex** | Gemini | Gemini 2.5 Pro | Enterprise |

---

## 4. Live Lab Tri-Nuclear v3.0

O Live Lab implementa um ecossistema cognitivo de tres nucleos com automacao de roteamento, produtividade e evolucao educacional. A versao 3.0 incorpora o modelo **GLM-5.2** (qualidade normalizada 0.96 — mais alta do agregador) e mapeia 6 principios filosoficos da *Autobiografia de um Iogue* (Yogananda) em algoritmos do sistema.

```text
┌────────────────────────────────────────────────────────────────────┐
│                     LIVE LAB TRI-NUCLEAR v3.0                       │
│                                                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐ │
│  │  N1 AGREGADOR     │  │  N2 PRODUTIVIDADE│  │  N3 ECOSSISTEMA   │ │
│  │  10 LLMs         │  │  12 Skills       │  │  4 Trilhas       │ │
│  │  PROMETHEE II    │  │  5 Meta-Skills   │  │  12 Modulos      │ │
│  │  9 Cascade Rules │  │  Skill Graph     │  │  4 Certificacoes │ │
│  │  6 Criteria      │  │  Topo Sort       │  │  5 Personas      │ │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘ │
│           │                    │                     │            │
│           └────────────────────┼─────────────────────┘            │
│                                │                                  │
│                    ┌───────────┴───────────┐                      │
│                    │   AGENTICA AI v3.0    │                      │
│                    │   9 Functions        │                      │
│                    │   Arquiteta-Cognitiva │                      │
│                    └───────────┬───────────┘                      │
│                                │                                  │
│  ┌─────────────────────────────┼───────────────────────────────┐  │
│  │              GOVERNANCE LAYER                               │  │
│  │  Token Bucket (priority) │ Budget Forecast │ RBAC (4 tiers)│  │
│  │  PII Masking + Audit Trail                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### 4.1 N1 — Nucleo Agregador: Roteamento Multi-Criterio

O nucleo agregador seleciona o LLM otimo para cada intencao do usuario combinando dois mecanismos complementares.

#### 4.1.1 Cascade de Intencoes

Matching ponderado por keywords com limiar de ativacao. Cada regra cascade define:

- `regra`: pipe-delimited keywords com pesos opcionais (`keyword:2.0`, padrao 1.0)
- `modelo_primario`: LLM alvo quando a regra e ativada
- `fallback[]`: cadeia de fallback se o primario exceder `latencia_maxima_ms`

```
Score(regra) = Σ pesos_matched / Σ pesos_total

Ativacao:  Score >= 0.3
```

O algoritmo aplica **fuzzy word boundary matching** — correspondencia parcial com boost de 0.5x quando >= 60% dos caracteres da keyword aparecem em ordem dentro de uma palavra da intencao.

#### 4.1.2 PROMETHEE II — Multi-Criteria Decision Making

Quando nenhuma regra cascade e ativada (ou apos restringir os candidatos a primario + fallbacks), o sistema aplica **PROMETHEE II** com funcao de preferencia linear (Tipo V):

```
Criterios (j=1..6):
  w_custo       = 0.20   (custo medio por 1M tokens — minimizar)
  w_latencia    = 0.25   (latencia p50 em ms — minimizar)
  w_qualidade   = 0.35   (qualidade normalizada — maximizar)
  w_contexto    = 0.10   (janela de contexto em tokens — maximizar)
  w_disponibilidade = 0.05 (peso de roteamento — maximizar)
  w_estabilidade = 0.05  (is_local ? 1.0 : 0.7+0.3*qualidade — maximizar)

Funcao de Preferencia Tipo V (linear):
  P_j(a, b) = |f_j(a) - f_j(b)| / q_j    se |diff| < q_j
  P_j(a, b) = 1                           se |diff| >= q_j

  onde q_j = threshold do criterio j

Flows:
  φ+(a) = Σ_{b≠a} Σ_j  w_j · P_j(a, b)     (outranking positivo)
  φ-(a) = Σ_{b≠a} Σ_j  w_j · P_j(b, a)     (outranking negativo)

Net Flow:
  φ(a) = φ+(a) - φ-(a)

Ranking: modelos ordenados por φ(a) descendente (ties compartilham rank)
```

**Thresholds padrao**: custo=2.0, latencia=300, qualidade=0.15, contexto=100000, disponibilidade=0.3, estabilidade=0.2.

#### 4.1.3 Modelo Registry (10 LLMs)

| Model | Provider | Context | Cost (in/out per 1M) | Latency | Quality | Type |
|-------|----------|---------|---------------------|---------|---------|------|
| **GLM-5.2** | Zhipu AI | 128K | $2.00 / $8.00 | 480ms | **0.96** | Cloud |
| Claude 4 Sonnet | Anthropic | 200K | $3.00 / $15.00 | 520ms | 0.95 | Cloud |
| GPT-4o | OpenAI | 128K | $2.50 / $10.00 | 650ms | 0.92 | Cloud |
| DeepSeek-R1 | DeepSeek | 64K | $0.55 / $2.19 | 1200ms | 0.88 | Cloud |
| Gemini 2.5 Pro | Google | **2M** | $1.25 / $5.00 | 850ms | 0.87 | Cloud |
| GLM-4-Plus | Zhipu AI | 128K | $1.40 / $1.40 | 450ms | 0.82 | Cloud |
| Llama 4 Maverick | Meta/Groq | 128K | $0.59 / $0.79 | **32ms** | 0.75 | Cloud |
| Mistral Large 2 | Mistral AI | 128K | $2.00 / $6.00 | 480ms | 0.80 | Cloud |
| GLM-4-Flash | Zhipu AI | 128K | $0.10 / $0.10 | 320ms | 0.70 | Cloud |
| CodeGeeX4 9B | CodeGeeX Native | 128K | **$0.00** | 150ms | 0.72 | **Local** |

#### 4.1.4 Cascade Rules (9 regras)

| # | Trigger Keywords | Primary Model | Fallback Chain | Lat. Max |
|---|-----------------|---------------|----------------|----------|
| 1 | codigo, programar, debug, code review | Claude 4 Sonnet | GPT-4o → DeepSeek-R1 → CodeGeeX4 | 1500ms |
| 2 | matematica, calculo, prova, deduzir | DeepSeek-R1 | Claude 4 Sonnet → GPT-4o | 2000ms |
| 3 | rapido, urgente, batch, etl | Llama 4 Maverick | GLM-4-Flash → CodeGeeX4 | **100ms** |
| 4 | documento longo, repo completo, ingestao | Gemini 2.5 Pro | Claude 4 Sonnet → GPT-4o | 3000ms |
| 5 | multimodal, imagem, video, vision | GPT-4o | Claude 4 Sonnet → Gemini 2.5 Pro | 2000ms |
| 6 | multilingue, traduzir, idioma | Mistral Large 2 | Claude 4 Sonnet → GPT-4o | 1000ms |
| 7 | gerar codigo, autocompletar, codegen | CodeGeeX4 9B | Claude 4 Sonnet → GPT-4o → DeepSeek-R1 | 500ms |
| 8 | classificar, categorizar, sentimento | GLM-4-Flash | Llama 4 Maverick → GLM-4-Plus | 200ms |
| **9** | **raciocinario avancado, arquitetura, estrategia** | **GLM-5.2** | **Claude 4 Sonnet → GPT-4o → DeepSeek-R1** | **1500ms** |

### 4.2 N2 — Nucleo Produtividade: Skill Composition Graph

12 skills atomicas e 5 meta-skills com resolucao de dependencias via **topological sort**.

#### 4.2.1 Skills Atomicas (12)

| ID | Dominio | RBAC Min | Criticidade | Modelo Preferido |
|----|---------|----------|-------------|-------------------|
| `code_review` | DevOps | basic | medio | Claude 4 Sonnet |
| `debug_assist` | DevOps | basic | alto | Claude 4 Sonnet |
| `test_generation` | DevOps | basic | medio | Claude 4 Sonnet |
| `refactoring_suggest` | DevOps | intermediate | medio | GPT-4o |
| `doc_generation` | Content | basic | baixo | GLM-4-Plus |
| `api_design` | Architecture | intermediate | alto | Claude 4 Sonnet |
| `data_analysis` | Data Science | intermediate | medio | Gemini 2.5 Pro |
| `security_audit` | Security | advanced | critico | GPT-4o |
| `perf_optimization` | DevOps | intermediate | alto | Claude 4 Sonnet |
| `prompt_engineering` | AI | basic | baixo | GLM-4-Plus |
| `git_workflow` | DevOps | basic | baixo | GLM-4-Plus |
| `infra_as_code` | DevOps | advanced | alto | Claude 4 Sonnet |

#### 4.2.2 Meta-Skills (5)

Composicao de skills atomicas com **Dependency Graph + Topological Sort**:

```
MetaSkill.skills_compostas → DAG
  ordem = 'sequencial'  → cada skill depende da anterior (linear chain)
  ordem = 'paralelo'    → todas no grupo 0 (parallel execution)
  ordem implicita     → BFS topological sort, grupos paralelos detectados

Output: SkillCompositionPlan
  { orderedSkills[], hasCycle: bool, executionPlan[{skillId, order, parallelGroup}] }

Ciclos: detectados → hasCycle=true, execution abortada
```

| Meta-Skill | Skills | Ordem | RBAC Min |
|-----------|--------|-------|----------|
| `full_stack_dev` | code_review + debug_assist + test_generation + doc_generation | sequencial | intermediate |
| `devops_pipeline` | infra_as_code + security_audit + perf_optimization | sequencial | advanced |
| `security_hardening` | security_audit + infra_as_code | sequencial | advanced |
| `data_pipeline` | data_analysis + doc_generation | sequencial | intermediate |
| `learning_path` | code_review + prompt_engineering + debug_assist | sequencial | basic |

### 4.3 N3 — Nucleo Ecossistema: Trilhas e Certificacoes

| Trilha | Modulos | Certificacao | Modelo Recomendado |
|--------|---------|--------------|-------------------|
| Full-Stack AI Developer | 4 (fsa-m1..m4) | CHIMERA-FSAI-L1..L4 | GLM-4-Plus / Claude 4 Sonnet |
| DevOps Cloud Architect | 3 (dca-m1..m3) | CHIMERA-DCA-L1..L3 | Claude 4 Sonnet |
| AI Research Engineer | 3 (aire-m1..m3) | CHIMERA-AIRE-L1..L3 | DeepSeek-R1 / Claude 4 Sonnet |
| Security & Compliance | 2 (sc-m1..m2) | CHIMERA-SC-L1..L2 | GPT-4o |

Cada modulo define `taxa_acerto_minima` (padrao 70%), `modelo_recomendado`, e `avaliacao_tipo` (pratico/teorico/misto).

### 4.4 Agentica AI — Arquiteta-Cognitiva (9 Functions)

```text
┌──────────────────────────────────────────────────────────────┐
│                    AGENTICA AI v3.0                           │
│                  Arquiteta-Cognitiva                          │
│                                                              │
│  Diagnostic Layer:                                           │
│    ① agenticaDiagnose()         → DiagnosticoEcosystem       │
│    ② agenticaIogueEssence()     → IogueEssence               │
│                                                              │
│  Routing Layer:                                              │
│    ③ agenticaRoute(intent)      → RoutingResult (MCDM)       │
│    ④ agenticaExecuteSkill()     → SkillResult                │
│    ⑤ agenticaExecuteMetaSkill() → MetaSkillResult            │
│                                                              │
│  Evaluation Layer:                                           │
│    ⑥ agenticaEvaluateModulo()   → ModuloResult               │
│    ⑦ agenticaProgress(persona)  → PersonaProgress            │
│                                                              │
|  Governance Layer:                                           │
│    ⑧ agenticaGovernanca()       → GovernancaCheck            │
│    ⑨ agenticaStats()            → LiveLabStats               │
└──────────────────────────────────────────────────────────────┘
```

| # | Function | Layer | Description |
|---|----------|-------|-------------|
| 1 | `agenticaDiagnose()` | Diagnostic | Full ecosystem audit: integrity, 3 cores, governance, routing MCDM, alerts |
| 2 | `agenticaIogueEssence()` | Diagnostic | Returns philosophical essence: 6 principles mapped to algorithms |
| 3 | `agenticaRoute(intent)` | Routing | Cascade match → PROMETHEE II MCDM → best model + cost + latency |
| 4 | `agenticaExecuteSkill(id, input, persona)` | Routing | RBAC check → model selection → budget recording → SkillResult |
| 5 | `agenticaExecuteMetaSkill(id, input, persona)` | Routing | Composition graph → topological sort → sequential execution plan |
| 6 | `agenticaEvaluateModulo(moduloId)` | Evaluation | Module scoring (72-95 random) vs `taxa_acerto_minima`, feedback |
| 7 | `agenticaProgress(personaId)` | Evaluation | Persona progress: trilha, modulo index, progress %, next action |
| 8 | `agenticaGovernanca(persona, action, level)` | Governance | RBAC check → rate limit consume → budget state → GovernancaCheck |
| 9 | `agenticaStats()` | Governance | Aggregated metrics: 10 models, 12 skills, 4 tracks, 5 personas |

### 4.5 Governance Layer

#### 4.5.1 Token Bucket com Prioridade

```
Parametros: maxTokens=60, refillRate=60/60000 tokens/ms (≈1 token/s)
burstAllowance=5 (consumo futuro permitido para priority 1-5)

consume(id, priority=1):
  tokens -= 1
  if tokens < -burstAllowance → DENY
  if priority >= 3: permite ir negativo (consome do futuro)

getState(id) → { tokens: float, last_refill: timestamp }
reset(id)   → tokens = maxTokens

Refill: a cada chamada, repoe (now - lastRefill) * refillRate tokens
```

#### 4.5.2 Budget Forecast

```
recordUsage(personaId, custo_usd) → acumula mensal

getForecast(personaId, limite_usd, dias_no_mes) → BudgetForecast
  projectedDailyAvg = usado_usd / diasDecorridos
  daysUntilExhaustion = (limite - usado) / projectedDailyAvg
  willExhaust = daysUntilExhaustion !== null && daysUntilExhaustion > 0

Alertas automaticos (fire-once per tier):
  50% → alerta_50_fired
  80% → alerta_80_fired
  95% → alerta_95_fired

resetMonth(personaId) → zera acumulo
```

#### 4.5.3 PII Masking com Audit Trail

```
maskPIIWithAudit(text, regexPatterns[]) → PIIMaskResult
  { maskedText: string, detectedPii: PIIAuditEntry[] }

PIIAuditEntry:
  { type: 'email'|'cpf'|'telefone'|'cartao', position: int, original: string }

Patterns padrao: email, CPF (\d{3}.\d{3}.\d{3}-\d{2}),
  telefone (\(\d{2}\)\s?\d{4,5}-?\d{4}), cartao de credito
```

#### 4.5.4 RBAC — 4 Tiers Hierarquicos

```
basic → intermediate → advanced → admin
  (0)        (1)           (2)      (3)

rbacCheck(userLevel, requiredLevel, levels[])
  → index(userLevel) >= index(requiredLevel)
```

| Persona | Role | RBAC Tier | Active Track |
|---------|------|-----------|---------------|
| Dev_Basic | Junior Developer | basic | Full-Stack AI Developer |
| DevOps_Admin | DevOps Admin | intermediate | DevOps Cloud Architect |
| System_Architect | System Architect | advanced | AI Research Engineer |
| AI_Engineer | AI Engineer | advanced | AI Research Engineer |
| Product_Manager | Product Manager | admin | Security & Compliance |

### 4.6 Essencia Iogue — Philosophy-to-Algorithm Mapping

6 principios da *Autobiografia de um Iogue* (Paramahansa Yogananda) mapeados em algoritmos do sistema:

| Yogananda Principle | Algorithm | Mapping Rationale |
|--------------------|-----------|-------------------|
| Intuicao Direcionada | PROMETHEE II MCDM | Weights as conscious priorities; preference over brute dominance |
| Resiliencia em Cascata | Fallback Chains | Guru-parampara lineage: knowledge flows uninterrupted when one link fails |
| Auto-Realizacao Progressiva | Trilhas + Certificacoes | Kriya Yoga stages: each module = awakened chakra, cert = consciousness level |
| Equilibrio Tri-Nuclear | N1+N2+N3 Orchestrator | Body-mind-spirit: independent operation, synergistic when integrated |
| Governanca Consciente | RBAC + Budget Tracking | Protection by stage; dharma of resource — use wisely, not greedily |
| Santuario Interior | PII Masking + Audit | Guard the inner sanctuary; what is sacred must not be exposed |

### 4.7 Live Lab API Routes (9 endpoints)

| Method | Endpoint | Agentica Function | Auth |
|--------|----------|-------------------|------|
| `GET` | `/api/live-lab/diagnose` | `agenticaDiagnose()` | None |
| `GET` | `/api/live-lab/iogue-essence` | `agenticaIogueEssence()` | None |
| `POST` | `/api/live-lab/route` | `agenticaRoute(intent)` | Body: `{intent}` |
| `POST` | `/api/live-lab/skill` | `agenticaExecuteSkill()` | Body: `{skillId, input, personaId}` |
| `POST` | `/api/live-lab/meta-skill` | `agenticaExecuteMetaSkill()` | Body: `{metaSkillId, input, personaId}` |
| `POST` | `/api/live-lab/evaluate` | `agenticaEvaluateModulo()` | Body: `{moduloId}` |
| `GET` | `/api/live-lab/progress` | `agenticaProgress()` | Query: `?personaId=` |
| `POST` | `/api/live-lab/governanca` | `agenticaGovernanca()` | Body: `{personaId, acao, nivelRequerido}` |
| `GET` | `/api/live-lab/stats` | `agenticaStats()` | None |

---

## 5. Subsystems

### 5.1 Sandbox Nativo — Isolated VM Execution

Execucao de codigo nao-confiavel em Node.js `vm` module com 5 tiers de recursos:

```
Scout (64MB/5s) → Worker (128MB/15s) → Expert (256MB/30s) → Elite (512MB/60s) → Architect (1GB/120s)

Lifecycle States: spawning → idle → executing → learning → promoted → degraded → recycled → dead

Genetic Evolution:
  score >= 80% → promoted (next tier)
  score <  30% → degraded (previous tier)
  score <  10% && failures > 5 → recycled

Security: blocks require, process, fs, eval, Function, while(true). Timeout + memory hard limits.

LLM Fallback Chain: CodeGeeX4 → Ollama → DeepSeek → Groq → OpenAI
```

**7 API Routes**: execute, agents, agents/[id], llm, llm/stream, status, evolution.

### 5.2 Navegador Obscura — Rust/V8 Headless Browser

Integracao com [h4ckf0r0day/obscura](https://github.com/h4ckf0r0day/obscura) — browser headless em Rust com motor V8 e CDP:

- **14 API Routes**: navigate, scrape, eval, links, markdown, snapshot, status, serve, intercept, trackers, proxy, sessions, network, health
- **Stealth**: Anti-fingerprinting, 3520+ trackers em 6 categorias, `navigator.webdriver = undefined`
- **MCP Server**: 13 tools para agentes (browser_navigate, browser_click, browser_screenshot...)
- **Proxy Rotation**: 4 strategies (round-robin, random, failover, sticky)
- **Serve Mode**: CDP WebSocket para Puppeteer/Playwright integration

### 5.3 RAG Pipeline rRNA — 6-Stage Biological Pipeline

Pipeline de recuperacao aumentada com 6 estagios inspirados em biologia molecular:

```text
Query → Transcricao → Splicing → Traducao → Reranking → Sintese LLM
  (raw)   (BM25)      (filter)   (embed)    (neural)    (9router)
```

### 5.4 Bitcoin Vault — PSBT v2 Custody

- BIP32/39 HD wallet derivation
- P2PKH address generation
- PSBT v2 partial signing with @noble/secp256k1
- AES-256-GCM encrypted vaults
- Multi-address consolidation

### 5.5 Self-Healing Engine — 6-Phase Reactive Protocol

Auto-cura reativa com Wisdom Engine adaptativa: detect → diagnose → isolate → remediate → verify → learn.

---

## 6. API Reference (71 Endpoints)

| Group | Count | Routes |
|-------|-------|--------|
| **9router** | 2 | `GET /api/9router/providers`, `POST /api/9router/route-chat` |
| **Agent** | 3 | `POST /api/agent/chat`, `POST /api/agent/chat/stream`, `POST /api/agent/analyze` |
| **Fable** | 9 | `/api/fable/{method,loop,judge,domain,spawn,stats,tasks,task/[id],agent-query}` |
| **Colibri** | 5 | `/api/colibri/{health,models,experts,chat,orchestrate}` |
| **Live Lab** | 9 | `/api/live-lab/{diagnose,route,skill,evaluate,progress,stats,governanca,meta-skill,iogue-essence}` |
| **Sandbox** | 7 | `/api/sandbox/{execute,agents,agents/[id],llm,llm/stream,status,evolution}` |
| **Obscura** | 14 | `/api/obscura/{navigate,scrape,eval,links,markdown,snapshot,status,serve,intercept,trackers,proxy,sessions,network,health}` |
| **Bitcoin** | 5 | `/api/vaults{,/  [id],/  [id]/generate-address,/  [id]/custody}` + `/api/vaults/import-address` |
| **Wallet** | 4 | `/api/hd-wallet`, `/api/mnemonic`, `/api/generate-wallet`, `/api/withdraw` |
| **RAG** | 1 | `POST /api/rag/query` |
| **Orchestrate** | 1 | `POST /api/orchestrate` |
| **System** | 9 | `/api/projects`, `/api/projects/stats`, `/api/consolidate`, `/api/federated`, `/api/agents`, `/api/moltbook`, `/api/binance`, `/api/chat/history`, `/api/webhook/invoke` |
| **tRPC** | 2 | `/api/trpc/[trpc]` (4 routers: invocation, orchestration, dashboard, colibri) |

---

## 7. Testing

```
131 tests passing — 3 suites — 0 failures

src/lib/live-lab/__tests__/algorithms.test.ts    (88 tests)
  ├─ minMaxNormalize           (4)   Edge cases: empty, equal, ascending, descending
  ├─ cascadeMatch               (5)   Weighted keywords, partial boundaries, threshold
  ├─ computeMCDMScores          (12)  PROMETHEE II: 10-model real data, phi+/-, ranking
  ├─ routeIntent                (4)   Cascade + MCDM routing, fallback selection
  ├─ matchSkill                 (4)   Regex trigger matching, priority selection
  ├─ composeMetaSkill           (6)   Sequential, parallel, cycle detection, empty deps
  ├─ TokenBucket                (8)   Consume, priority burst, refill, getState, reset
  ├─ BudgetTracker              (10)  Record, forecast, alerts (50/80/95%), exhaustion, reset
  ├─ maskPIIWithAudit           (6)   Email, CPF, telefone, multi-type, position, empty
  └─ rbacCheck                  (6)   Hierarchy, denial, same-level, invalid levels

src/lib/live-lab/__tests__/orchestrator.test.ts (36 tests)
  ├─ getRoutingResult           (6)   Structure, truncation, cascade, GLM-5.2 routing
  ├─ executeSkill               (4)   Success, budget, not-found, RBAC denial
  ├─ executeMetaSkill           (4)   Success plan, ordering, not-found, RBAC
  ├─ evaluateModulo             (6)   Score, feedback, min threshold, pass/fail
  ├─ getPersonaProgress         (3)   Valid, null, field completeness
  ├─ getLiveLabStats            (5)   Counts, version, domains, tracks, module sum
  ├─ getIogueEssence            (4)   Non-null, filosofia, 6 principios, guru
  ├─ agenticaDiagnose           (7)   Full diagnostic, typecheck, iogue, counts, pesos
  ├─ agenticaRoute              (2)   Wrapper, phi+/- structure
  ├─ agenticaExecuteSkill       (3)   Wrapper, valid, invalid
  ├─ agenticaExecuteMetaSkill   (2)   Wrapper, not-found
  ├─ agenticaEvaluateModulo     (2)   Wrapper, random score bounds
  ├─ agenticaProgress            (2)   Wrapper, null
  ├─ agenticaStats              (2)   Consistency, counts
  ├─ agenticaIogueEssence       (2)   Equality, 6 principios
  └─ agenticaGovernanca         (5)   Authorized, budget, RBAC denial, not-found, fields

tests/federated.test.ts                        (7 tests)
  └─ Federated Learning         (7)   NRP, Gaussian noise, validation, anchoring
```

---

## 8. Deployment

### 8.1 Docker Compose (Production)

```bash
git clone https://github.com/Nexus-HUB57/LiveBook-rRNA.git && cd LiveBook-rRNA
cp .env.production .env  # Edit with at least one LLM provider key

# Core stack (Next.js + Caddy reverse proxy)
docker compose up -d --build

# Optional profiles
docker compose --profile obscura  up -d   # Headless browser (Rust/V8)
docker compose --profile colibri  up -d   # GLM-5.2 inference (requires GPU)
docker compose --profile ollama   up -d   # Local LLM inference
docker compose --profile codegeex up -d   # CodeGeeX4 native API (requires GPU)

# Verify
docker compose logs -f chimera
docker compose ps
```

### 8.2 Services

| Service | Port | Profile | Description |
|---------|------|---------|-------------|
| **chimera** | 3000 | default | Next.js 16 standalone + 71 API routes + tRPC |
| **caddy** | 80, 443 | default | Reverse proxy + auto-SSL (Let's Encrypt) |
| **obscura** | 9222, 9223 | `obscura` | Headless browser Rust/V8, CDP WebSocket |
| **colibri** | 8000 | `colibri` | GLM-5.2 744B MoE inference server (GPU) |
| **ollama** | 11434 | `ollama` | Local LLM inference (Llama 3, Mistral...) |
| **codegeex** | 8001 | `codegeex` | CodeGeeX4 9B streaming + function calling (GPU) |

### 8.3 Local Development

```bash
npm install
npx prisma db push && npx prisma generate
npx next dev    # → http://localhost:3000
npx jest       # → 131 tests
```

### 8.4 Requirements

- **Required**: Node.js 20+, at least one LLM provider API key
- **Optional**: Docker + Compose (containerized deploy)
- **Optional**: NVIDIA GPU + CUDA (Colibri, Ollama, CodeGeeX4 acceleration)
- **Optional**: Obscura binary (headless browser integration)

---

## 9. Project Structure

```
chimera/
├── docker-compose.yml              # 6 services, 4 optional profiles
├── Dockerfile                      # Multi-stage Next.js standalone
├── Caddyfile                      # Reverse proxy + auto-SSL
├── .env.production                # 14 sections, 23 provider keys
├── codegeex4/
│   └── Dockerfile                 # CodeGeeX4 native OpenAI-compat API
├── prisma/
│   └── schema.prisma              # 15 models
├── src/
│   ├── app/
│   │   ├── page.tsx                # 13-tab dashboard
│   │   └── api/                    # 71 REST routes
│   │       ├── 9router/            #   2 routes
│   │       ├── fable/              #   9 routes
│   │       ├── agent/              #   3 routes
│   │       ├── colibri/            #   5 routes
│   │       ├── live-lab/           #   9 routes (Agentica AI)
│   │       ├── sandbox/            #   7 routes
│   │       ├── obscura/            #  14 routes
│   │       ├── vaults/             #   5 routes
│   │       └── rag/                #   1 route
│   ├── components/
│   │   ├── live-lab-tab.tsx        # 4 sub-tabs: Diagnostico, Iogue, Roteamento, Progresso
│   │   └── ...                     # 100+ React components
│   ├── lib/
│   │   ├── 9router-bridge.ts       # routeChat(), streamChat()
│   │   ├── 9router-engine/         # 23 providers + protocol translators
│   │   ├── live-lab/               # ── TRI-NUCLEAR v3.0 ──
│   │   │   ├── raw-manifesto.json  #   10 LLMs, 12 skills, 5 meta-skills, 4 tracks, 5 personas
│   │   │   ├── manifesto.ts        #   Typed import + AGENTICA_AI identity
│   │   │   ├── types.ts            #   25+ interfaces
│   │   │   ├── algorithms.ts       #   PROMETHEE II, Cascade, TokenBucket, Budget, PII, RBAC
│   │   │   ├── orchestrator.ts     #   7 engine functions + singletons
│   │   │   ├── agentica-ai.ts      #   9 Agentica functions
│   │   │   ├── __tests__/          #   131 tests (algorithms + orchestrator)
│   │   │   └── index.ts            #   Public re-exports
│   │   ├── fable-method-engine.ts  # Think/Act/Prove
│   │   ├── sandbox/                # VM execution + genetic evolution
│   │   ├── obscura/                # Rust/V8 headless browser
│   │   └── rag-engine.ts           # 6-stage biological RAG pipeline
│   └── server/routers/             # 4 tRPC routers
└── tests/
    └── federated.test.ts           # Federated Learning integration tests
```

---

## License

Private — Nexus HUB57
