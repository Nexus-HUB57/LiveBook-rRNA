# CHIMERA v4.0 — Ultima Onda Agentic AI

<p align="center">
  <img src="https://img.shields.io/badge/CHIMERA-v4.0-blue" alt="v4.0" />
  <img src="https://img.shields.io/badge/Next.js-16.1-black?logo=next.js" alt="Next.js" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/9router-23%20providers-00ff88" alt="Providers" />
  <img src="https://img.shields.io/badge/tRPC-v11-0097A7?logo=trpc" alt="tRPC" />
  <img src="https://img.shields.io/badge/Prisma-6.11-2D3748?logo=prisma" alt="Prisma" />
  <img src="https://img.shields.io/badge/GLM--5.2-Connected-emerald" alt="GLM-5.2" />
  <img src="https://img.shields.io/badge/API%20Routes-87-cyan" alt="API Routes" />
  <img src="https://img.shields.io/badge/Docker-6%20services-2496ED?logo=docker" alt="Docker" />
  <img src="https://img.shields.io/badge/Agentic%20Runtime-v4.0-purple" alt="Agentic" />
  <img src="https://img.shields.io/badge/MCP-Protocol-orange" alt="MCP" />
  <img src="https://img.shields.io/badge/Tests-185%20passing-brightgreen" alt="Tests" />
  <img src="https://img.shields.io/badge/7%20Agent%20Roles%2B%2010%20Tools-blueviolet" alt="Agents" />
  <img src="https://img.shields.io/badge/Prisma-29%20models-2D3748" alt="DB Models" />
  <img src="https://img.shields.io/badge/Auth-API%20Key%20Middleware-blue" alt="Auth" />
</p>

<p align="center">
  <strong>Agentic Runtime v4.0</strong> · <strong>MCP Protocol</strong> · <strong>7 Agent Roles</strong> · <strong>10 Tools</strong> · <strong>Memory 4-Types</strong> · <strong>ReAct + Plan-and-Execute</strong> · <strong>SSE Event Bus</strong> · <strong>23 AI Providers</strong> · <strong>Protocol Translation</strong> · <strong>Bitcoin PSBT v2</strong> · <strong>RAG Pipeline</strong> · <strong>Sandbox VM</strong> · <strong>Live Lab Tri-Nuclear v3.1</strong> · <strong>Observability</strong> · <strong>Meta-Learning</strong>
</p>

---

## Abstract

CHIMERA e uma plataforma de orquestracao multi-agente para LLMs que implementa roteamento inteligente baseado em **MCDM PROMETHEE II** com funcao de preferencia linear (Tipo V), tradução automatica de protocolo em topologia hub-and-spoke para 23 provedores, e um subsistema cognitivo trinuclear — o **Live Lab v3.1** — orquestrado pela Agentica AI com 9 funcoes de alto nivel e **execucao real de LLMs** via 9router-bridge. O sistema incorpora governanca por RBAC hierárquico (4 tiers), controle de taxa por Token Bucket com prioridade, projecao de orcamento com alertas em limiares configuráveis, mascaramento de PII com trilha de auditoria, **middleware de autenticacao API key**, **observabilidade estruturada** (logger JSON, metricas Prometheus, tracing), **cache semantico LRU**, **comunicacao bidirecional entre agentes** (message bus + blackboard), **memoria de longo prazo** (episodica/semantica/trabalho/procedural), **meta-aprendizado de pesos MCDM**, **negociacao multi-agente** (Contract Net/Votacao/Debate), **avaliacao de roteamento** (accuracy@1/3, MRR, A/B testing), e **aprendizado continuo de skills**. A arquitetura suporta 87 REST endpoints, 4 routers tRPC, streaming SSE nativo, e deploy containerizado com 6 servicos Docker.

---

## 1. System Architecture

```text
┌─────────────────────────────────────────────────────────────────────────────┐
│                          CHIMERA FUSION ENGINE                               │
│                         Next.js 16 App Router                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────────┐   │
│  │  Dashboard   │  │  13 Tabs UI  │  │  tRPC v11   │  │  87 REST Routes  │   │
│  │  (React 19)  │  │  shadcn/ui   │  │  4 Routers  │  │  + 10 Agentic    │   │
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
│  │         │                             │ │ Real LLM Execution  ││   │   │
│  │         │                             │ │ Persistencia Prisma  ││   │   │
│  │         │                             │ └─────────────────────┘│   │   │
│  │         │                             └─────────────────────────┘   │   │
│  └─────────┼──────────────────────────────────────────────────────────┘   │
│            │                                                               │
│  ┌─────────┼──────────────────────────────────────────────────────────┐   │
│  │         │              Infraestrutura                                 │   │
│  │  ┌──────┴───────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐  │   │
│  │  │  RAG rRNA    │ │ Sandbox  │ │ Bitcoin  │ │ Obscura │ │ Self- │  │   │
│  │  │  6-stage BM25│ │ VM Node  │ │ PSBT v2  │ │ Rust/V8 │ │ Healing│  │   │
│  │  │  + Reranking │ │ 5 tiers  │ │ BIP32/39 │ │ CDP MCP │ │ 6 ph. │  │   │
│  │  └──────────────┘ └──────────┘ └──────────┘ └─────────┘ └───────┘  │   │
│  │  ┌──────────────┐ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐  │   │
│  │  │ Auth Middle. │ │ Observab.│ │ Agent Msg│ │Semantic │ │ Memory │  │   │
│  │  │ API Key + RBAC│ │ Logger   │ │ Bus+BB   │ │ Cache   │ │ 4-type │  │   │
│  │  └──────────────┘ │ Metrics  │ │ Handoff  │ │ LRU 500 │ │ LT-Mem │  │   │
│  │  ┌──────────────┐ │ Tracing  │ │ 10 types │ │ SHA-256 │ │ Consol.│  │   │
│  │  │ Meta-Learning│ └──────────┘ └──────────┘ └─────────┘ └───────┘  │   │
│  │  │ MCDM Weights │ ┌──────────┐ ┌──────────┐ ┌─────────┐ ┌───────┐  │   │
│  │  │ 7 int. types │ │Negotiat. │ │ Routing  │ │ Skill   │ │Dist. RL│  │   │
│  │  └──────────────┘ │ C/N/V/D  │ │ Eval A@1 │ │ Learner │ │ LRU 10K│  │   │
│  │                    └──────────┘ │ MRR A/B  │ │ Auto-adj│ │ 4 tiers│  │   │
│  │                                  └──────────┘ └─────────┘ └───────┘  │   │
│  └────────────────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Prisma 6 + SQLite (29 models) │ Auth Middleware │ Caddy (auto-SSL) │ Docker  │
└─────────────────────────────────────────────────────────────────────────────┘
```

## 2. Tech Stack

| Layer | Technology | Rationale |
|-------|-----------|------------|
| **Framework** | Next.js 16.1 (App Router, Turbopack) | Standalone output para deploy leve, ISR/SSR/SSG unificado |
| **UI** | React 19 + Tailwind CSS 4 + shadcn/ui | Componentes acessíveis, composabilidade, Framer Motion |
| **Language** | TypeScript 5 (strict) | Type safety em toda a stack, generics avancados |
| **LLM Routing** | 9router (in-process bridge) | Hub-and-spoke protocol translation, 23 providers, O(1) dispatch |
| **API Layer** | tRPC v11 + 87 REST routes | Type-safe RPC para dashboard, REST para integracao externa |
| **Database** | Prisma 6 + SQLite | Zero-ops embedded DB, 29 models, migracoes declarativas |
| **Bitcoin** | bitcoinjs-lib + @noble/secp256k1 | BIP32/39 HD wallet, P2PKH, PSBT v2 com AES-256-GCM |
| **RAG** | BM25 field-boosted + cross-encoder | Pipeline biologico 6 fases com reranking neural |
| **Cognitive** | Fable Method (Think/Act/Prove) | Raciocinio estruturado com auto-correcao em 3 tentativas |
| **Observability** | ChimeraLogger + Prometheus + Tracer | Structured JSON logging, 6 metric families, span tracing, `/metrics` endpoint |
| **Auth** | Next.js Edge Middleware + API Key | Bearer/x-api-key validation, 8 protected route prefixes, request ID propagation |
| **Agent Comms** | AgentMessageBus + Blackboard | 10 message types, sendAndWait, broadcast, handoff protocol, shared memory |
| **Memory** | AgentMemory (4-type) | Episodic, semantic, working, procedural; importance-based eviction, consolidation |
| **Meta-Learning** | McdmMetaLearner | 7 intent types, EWMA weight adaptation, Prisma persistence, load history on boot |
| **Negotiation** | AgentNegotiator | Contract Net, Voting, Debate protocols with consensus scoring |
| **Sandbox** | Node.js `vm` module (isolated) | 5 tiers com limites de memoria/tempo, evolucao genetica |
| **Browser** | Obscura (Rust/V8, CDP) | Anti-fingerprinting, 3520+ trackers, MCP 13 tools |
| **Testing** | Jest — 185 tests, 6 suites | Coverage: algorithms, orchestrator, agentica-ai, agentic runtime, MCP flow, federated |
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

## 4. Live Lab Tri-Nuclear v3.1

O Live Lab implementa um ecossistema cognitivo de tres nucleos com automacao de roteamento, produtividade e evolucao educacional. A versao **v3.1** adiciona **execucao real de LLMs** via 9router-bridge (skills e avaliacoes agora chamam modelos reais), **persistencia em banco de dados** (toda execucao e registrada em Prisma), e 12 novos modulos de infraestrutura cognitiva (observabilidade, cache semantico, comunicacao, memoria, meta-learning, negociacao, avaliacao de roteamento, aprendizado de skills, rate limiting distribuido, autenticacao).

```text
┌────────────────────────────────────────────────────────────────────┐
│                     LIVE LAB TRI-NUCLEAR v3.1                       │
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
| 4 | `agenticaExecuteSkill(id, input, persona)` | Routing | **[v3.1 async + LLM real]** RBAC check → 9router call → budget recording → DB persist → SkillResult |
| 5 | `agenticaExecuteMetaSkill(id, input, persona)` | Routing | **[v3.1 async]** Composition graph → topological sort → sequential LLM execution plan |
| 6 | `agenticaEvaluateModulo(moduloId)` | Evaluation | **[v3.1 async + LLM Judge]** Calls LLM to score module when no explicit score; fallback to 75 |
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

### 4.7 Live Lab API Routes (13 endpoints)

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
| `GET` | `/api/live-lab/metrics` | `ChimeraMetrics.getPrometheus()` | Prometheus scrape |
| `GET` | `/api/live-lab/cache/stats` | `SemanticCache.getStats()` | Cache hit/miss rate |
| `GET` | `/api/live-lab/bus/stats` | `AgentMessageBus.getStats()` | Message bus status |
| `GET` | `/api/live-lab/memory/stats` | `AgentMemory.getStats()` | Agent memory status |

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

### 5.6 v4.0 — Agentic Runtime (2.338 LOC)

O v4.0 introduz um **Agentic Runtime completo** com execução de multi-agentes, MCP (Model Context Protocol), 10 tools reais, e persistência em Prisma. Este é o coração da capacidade de agencia autonoma do CHIMERA.

```text
┌──────────────────────────────────────────────────────────────────┐
│                    AGENTIC RUNTIME v4.0                           │
│                                                                  │
│  ┌─────────────┐  ┌──────────────┐  ┌───────────────────────┐  │
│  │  Agent Loop  │  │ Tool Registry│  │  MCP Adapter          │  │
│  │  ReAct       │  │ 10 tools     │  │  stdio/sse/http       │  │
│  │ Plan&Exec   │  │ 3 categories │  │  demo-server bridge   │  │
│  │ Multi-Agent │  │ MCP dynamic  │  │  13 CDP tools         │  │
│  │ Hybrid       │  │              │  │                       │  │
│  └──────┬──────┘  └──────┬───────┘  └───────────┬───────────┘  │
│         │                │                       │              │
│  ┌──────┴────────────────┴───────────────────────┴──────────┐  │
│  │                    Core Services                          │  │
│  │  ┌──────────────┐  ┌───────────────┐  ┌────────────────┐ │  │
│  │  │  Persistence  │  │ Memory Mgr    │  │ Event Bus      │ │  │
│  │  │  Prisma ORM   │  │ 4-type memory │  │ SSE streaming  │ │  │
│  │  │  6 models     │  │ episodic/     │  │ 15 event types │ │  │
│  │  │  Task/Step/   │  │ semantic/     │  │ status change  │ │  │
│  │  │  ToolCall/    │  │ procedural/   │  │ handoff/       │ │  │
│  │  │  Agent/Memory │  │ working       │  │ completion     │ │  │
│  │  └──────────────┘  └───────────────┘  └────────────────┘ │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                  │
│  7 Agent Roles: orchestrator · specialist · analyst · researcher
│                coder · reviewer · guardian                       │
│  4 Strategies: ReAct · Plan-and-Execute · Multi-Agent · Hybrid  │
│  10 Tools: web_search · code_executor · file_reader/writer       │
│           rag_query · llm_call · image_generator · web_reader   │
│           text_to_speech · vlm_analyze                           │
└──────────────────────────────────────────────────────────────────┘
```

#### 5.6.1 Agent Loop (`src/lib/agentic/agent-loop.ts`)

Execucao de tarefas por agentes com 4 estrategias de raciocinio:

| Estrategia | Descricao | Uso |
|-----------|-----------|-----|
| `react` | Think → Act → Observe (loop ate final answer) | Tasks simples e bem definidas |
| `plan-and-execute` | Planeja todos os passos primeiro, depois executa | Tasks complexas com multiplas etapas |
| `multi-agent` | Delega subtasks para agentes especialistas | Tasks que requerem multiplas especialidades |
| `hybrid` | Plan-and-Execute com ReAct para cada passo | Maximo de robustez, tasks criticas |

Cada iteracao produz um `LoopStep` com tipo (thinking/tool_call/tool_result/observation/handoff/final_answer), tokens usados, e timestamp. Suporta handoff entre agentes com `HandoffRequest`.

#### 5.6.2 Tool Registry + 10 Handlers (`src/lib/agentic/tool-registry.ts` + `tool-handlers.ts`)

Registro centralizado de tools com 10 handlers implementados:

| Tool | Category | Handler | Descricao |
|------|----------|---------|-----------|
| `web_search` | Research | z-ai-web-dev-sdk | Busca web em tempo real |
| `web_reader` | Research | z-ai-web-dev-sdk | Extracao de conteudo de paginas |
| `code_executor` | Execution | Node.js `vm` | Execucao sandboxed de codigo |
| `file_reader` | File I/O | fs (scoped) | Leitura de arquivos do workspace |
| `file_writer` | File I/O | fs (scoped) | Escrita de arquivos no workspace |
| `rag_query` | Knowledge | RAG Engine | Consulta ao pipeline RAG rRNA |
| `llm_call` | AI | 9router Bridge | Chamada direta a LLM via roteamento |
| `image_generator` | Creative | z-ai-web-dev-sdk | Geracao de imagens por texto |
| `text_to_speech` | Creative | z-ai-web-dev-sdk | Sintese de voz a partir de texto |
| `vlm_analyze` | Vision | z-ai-web-dev-sdk | Analise visual com modelo multimodal |

O registry suporta ferramentas dinamicas registradas via MCP (Model Context Protocol).

#### 5.6.3 MCP Protocol Adapter (`src/lib/agentic/mcp-adapter.ts`)

Integracao com o protocolo MCP para ferramentas externas:

- **3 transportes**: stdio, SSE, streamable-http
- **Descoberta automatica** de ferramentas ao conectar em um MCP server
- **Forwarding** de chamadas de tools para servers remotos
- **MCP Demo Bridge**: ponte para o Obscura headless browser (13 CDP tools expostas como MCP tools)
- **MCP Demo Server**: servidor MCP embutido com ferramentas de demonstracao

#### 5.6.4 Memory Manager (`src/lib/agentic/memory-manager.ts`)

Memoria de 4 tipos com persistencia em Prisma (`AgenticMemory` model):

| Tipo | TTL | Uso |
|------|-----|-----|
| `working` | 10 min | Contexto da task atual |
| `episodic` | 24h | Experiencias passadas do agente |
| `semantic` | 30 dias | Conhecimento consolidado |
| `procedural` | 90 dias | Habilidades e padroes aprendidos |

Suporta query por agente, tipo, importancia minima, e busca textual.

#### 5.6.5 Event Bus (`src/lib/agentic/event-bus.ts`)

Sistema de eventos com 15 tipos para streaming SSE:

```
agent.status_change · agent.thinking · agent.tool_call · agent.tool_result
agent.handoff · agent.error · agent.completed · task.created · task.status_change
task.completed · memory.created · memory.retrieved
mcp.server_connected · mcp.server_disconnected · mcp.tool_registered
```

Clientes SSE recebem eventos em tempo real via `GET /api/agentic/events`.

#### 5.6.6 Persistence (`src/lib/agentic/persistence.ts`)

Persistencia completa em Prisma com 6 models dedicados. Tarefas, steps, e tool calls sao registrados com input/output snapshots para auditabilidade total.

#### 5.6.7 10 API Routes do Agentic Runtime

| Method | Endpoint | Descricao |
|--------|----------|-----------|
| `POST` | `/api/agentic/route` | Executa task completa (cria + roda agent loop) |
| `GET` | `/api/agentic/agents` | Lista agentes configurados |
| `GET` | `/api/agentic/agents/stream` | Stream SSE de execucao de agente |
| `GET` | `/api/agentic/events` | SSE event bus para todos os eventos |
| `GET` | `/api/agentic/tools` | Lista tools registradas (nativas + MCP) |
| `GET` | `/api/agentic/memory` | Query memoria de agentes |
| `GET` | `/api/agentic/mcp` | Lista MCP servers configurados |
| `POST` | `/api/agentic/mcp/connect` | Conecta a um MCP server |
| `POST` | `/api/agentic/mcp/call` | Chama tool MCP em server conectado |
| `GET` | `/api/agentic/mcp/demo-server` | MCP demo server info + status |

### 5.7 v3.1 — 12 Modulos de Infraestrutura Cognitiva

A v3.1 introduz uma camada de infraestrutura cognitiva que eleva o CHIMERA de simulador para sistema de producao:

#### 5.7.1 Autenticacao (`src/middleware.ts` + `src/lib/auth.ts`)

Next.js Edge Middleware com validacao API key. Modo aberto (sem `CHIMERA_API_KEYS`) para desenvolvimento.

```text
Request → x-request-id (UUID) → x-correlation-id (propagate) → Auth check → Route
                                                         ↓ Protected:
                                                         /api/fable/*
                                                         /api/vaults/*
                                                         /api/withdraw/*
                                                         /api/hd-wallet/*
                                                         /api/generate-wallet/*
                                                         /api/mnemonic/*
                                                         /api/consolidate/*
                                                         /api/webhook/*
```

#### 5.7.2 Observabilidade (`src/lib/observability.ts`)

- **ChimeraLogger**: JSON estruturado com correlationId/requestId, 4 niveis (info/warn/error/debug)
- **ChimeraMetrics**: 6 familias de metricas em formato Prometheus (counters, histograms, gauges)
- **ChimeraTracer**: Spans com parent-child, `performance.now()`, max 1000 spans completados

Metricas nativas: `chimera_routing_total`, `chimera_skill_execution_duration_ms`, `chimera_tokens_total`, `chimera_cost_usd_total`, `chimera_fallback_total`, `chimera_llm_request_duration_ms`

#### 5.7.3 Rate Limiting Distribuido (`src/lib/distributed-rate-limit.ts`)

StickySessionRateLimiter com LRU (max 10K entradas, TTL 5 min) + TieredRateLimiter (basic 10/min, intermediate 30/min, advanced 60/min, admin 120/min).

#### 5.7.4 Cache Semantico (`src/lib/semantic-cache.ts`)

LRU cache (500 entradas, TTL 1h) com chave SHA-256 de input normalizado. Hit/miss tracking. Design preparado para upgrade embedding-based (threshold 0.92 reservado).

#### 5.7.5 Comunicacao Bidirecional (`src/lib/agent-message-bus.ts`)

AgentMessageBus com 10 tipos de mensagem (task_request/result, handoff, query/answer, event, heartbeat, negotiation, blackboard_read/write). Suporta `sendAndWait` com timeout, broadcast, protocolo de handoff, e blackboard compartilhado (LRU 500 entries).

#### 5.7.6 Memoria de Longo Prazo (`src/lib/agent-memory.ts`)

4 tipos com TTLs distintos: **working** (10 min), **episodic** (24h), **semantic** (30 dias), **procedural** (90 dias). Eviction por importancia (0-1). Consolidacao automatica (working → episodic para importancia >= 0.5).

#### 5.7.7 Meta-Aprendizado MCDM (`src/lib/mcdm-meta-learner.ts`)

Classifica intencoes em 7 categorias (code, math, reasoning, multimodal, security, devops, general). EWMA (decay 0.95) para adaptar pesos MCDM por tipo. Persistencia em Prisma `McdmWeightHistory`. Formula: `learned = default + 0.15 * (avg - default)`, normalizado para soma = 1.

#### 5.7.8 Negociacao Multi-Agente (`src/lib/agent-negotiation.ts`)

Tres protocolos: **Contract Net** (broadcast + bid evaluation), **Votacao** (plurality, ties por ordem), **Debate** (for/against + judge). Todos retornam `NegotiationResult` com consensus score (0-1).

#### 5.7.9 Avaliacao de Roteamento (`src/lib/routing-evaluator.ts`)

25 ground truth entries cobrindo todas as 9 cascade rules. Metricas: **accuracy@1**, **accuracy@3**, **MRR** (Mean Reciprocal Rank), custo-efficiency, cascade hit rate. A/B testing com variant registry.

#### 5.7.10 Aprendizado Continuo de Skills (`src/lib/skill-learner.ts`)

Tracking de performance por skill (rolling window 100 execucoes). Auto-ajuste de tokens (1.5x se success < 70%, 0.8x se > 95%). Deteccao de skills faltantes por intents falhados. Alertas para skills necessitando atencao.

#### 5.7.11 Prisma Schema — 14 Novas Tabelas

| Modelo | Proposito | Chave |
|--------|----------|-------|
| `FableSandbox` | Instancias de sandbox | sandboxId (unique) |
| `FableTask` | Fila de tarefas com ciclo de vida | taskId (unique), status |
| `FableExecution` | Tentativas de execucao por tarefa | taskId (FK cascade) |
| `LiveLabExecution` | Audit completo de execucoes | executionId (unique) |
| `SkillExecutionLog` | Log por skill com input/output snap | skillId + createdAt |
| `BudgetRecord` | Budget mensal por persona com alertas | personaId + periodo (unique) |
| `RoutingLog` | Decisoes de roteamento MCDM | modeloSelecionado + createdAt |
| `McdmWeightHistory` | Evolucao de pesos por intent type | intentType + createdAt |
| `Agent` | Configuracao de agentes do runtime | agentId (unique) |
| `AgentSkill` | Skills habilitadas por agente | agentId + skillId (unique) |
| `AgenticMemory` | Memoria persistente dos agentes | agentId + type + createdAt |
| `AgenticTask` | Tarefas do agentic runtime | taskId (unique), status |
| `AgenticTaskStep` | Passos de execucao por tarefa | taskId (FK cascade) |
| `AgenticToolCall` | Registro de chamadas de tools | toolCallId (unique) |

---

## 6. API Reference (87 Endpoints)

| Group | Count | Routes |
|-------|-------|--------|
| **9router** | 2 | `GET /api/9router/providers`, `POST /api/9router/route-chat` |
| **Agent** | 3 | `POST /api/agent/chat`, `POST /api/agent/chat/stream`, `POST /api/agent/analyze` |
| **Fable** | 9 | `/api/fable/{method,loop,judge,domain,spawn,stats,tasks,task/[id],agent-query}` |
| **Colibri** | 5 | `/api/colibri/{health,models,experts,chat,orchestrate}` |
| **Live Lab** | 14 | `/api/live-lab/{diagnose,route,skill,evaluate,progress,stats,governanca,meta-skill,iogue-essence,metrics,cache/stats,bus/stats,memory/stats}` |
| **Agentic Runtime** | 10 | `/api/agentic/{route,agents,agents/stream,events,tools,memory,mcp,mcp/connect,mcp/call,mcp/demo-server}` |
| **Sandbox** | 7 | `/api/sandbox/{execute,agents,agents/[id],llm,llm/stream,status,evolution}` |
| **Obscura** | 14 | `/api/obscura/{navigate,scrape,eval,links,markdown,snapshot,status,serve,intercept,trackers,proxy,sessions,network,health}` |
| **Bitcoin** | 5 | `/api/vaults{,/  [id],/  [id]/generate-address,/  [id]/custody}` + `/api/vaults/import-address` |
| **Wallet** | 4 | `/api/hd-wallet`, `/api/mnemonic`, `/api/generate-wallet`, `/api/withdraw` |
| **RAG** | 1 | `POST /api/rag/query` |
| **Orchestrate** | 1 | `POST /api/orchestrate` |
| **System** | 9 | `/api/projects`, `/api/projects/stats`, `/api/consolidate`, `/api/federated`, `/api/agents`, `/api/moltbook`, `/api/binance`, `/api/chat/history`, `/api/webhook/invoke` |
| **tRPC** | 2 | `/api/trpc/[trpc]` (4 routers: invocation, orchestration, dashboard, colibri) |
| **Auth** | Edge Middleware | `x-request-id` + `x-correlation-id` + API key validation on 8 prefixes |

---

## 7. Testing

```
185 tests passing — 6 suites — 0 failures

src/lib/live-lab/__tests__/algorithms.test.ts    (65 tests)
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

src/lib/live-lab/__tests__/orchestrator.test.ts (60 tests)
  ├─ getRoutingResult           (6)   Structure, truncation, cascade, GLM-5.2 routing
  ├─ executeSkill               (4)   [v3.1 async] LLM mock, budget, not-found, RBAC denial
  ├─ executeMetaSkill           (4)   [v3.1 async] Success plan, ordering, not-found, RBAC
  ├─ evaluateModulo             (7)   [v3.1 async] LLM judge, explicit score, feedback, pass/fail
  ├─ getPersonaProgress         (3)   Valid, null, field completeness
  ├─ getLiveLabStats            (5)   Counts, version, domains, tracks, module sum
  ├─ getIogueEssence            (4)   Non-null, filosofia, 6 principios, guru
  ├─ agenticaDiagnose           (7)   Full diagnostic, typecheck, iogue, counts, pesos
  ├─ agenticaRoute              (2)   Wrapper, phi+/- structure
  ├─ agenticaExecuteSkill       (3)   [v3.1 async] Wrapper, valid, invalid
  ├─ agenticaExecuteMetaSkill   (2)   [v3.1 async] Wrapper, not-found
  ├─ agenticaEvaluateModulo     (2)   [v3.1 async] LLM judge mock
  ├─ agenticaProgress            (2)   Wrapper, null
  ├─ agenticaStats              (2)   Consistency, counts
  ├─ agenticaIogueEssence       (2)   Equality, 6 principios
  └─ agenticaGovernanca         (5)   Authorized, budget, RBAC denial, not-found, fields

src/__tests__/agentic/runtime.test.ts          (36 tests)
  ├─ Agent Loop                (12)   ReAct, Plan-and-Execute, multi-agent, hybrid strategies
  ├─ Tool Registry             (8)   Registration, lookup, category filtering, MCP tools
  ├─ Tool Handlers             (10)   web_search, code_executor, file_reader/writer, rag_query, llm_call, tts, vlm_analyze, image_generator
  └─ Persistence               (6)   Task CRUD, step recording, Prisma save/load

src/__tests__/agentic/mcp-flow.test.ts           (16 tests)
  ├─ MCP Adapter              (8)   connect, disconnect, tool listing, tool call, error handling
  └─ MCP Demo Bridge           (8)   Server lifecycle, tool forwarding, SSE events, graceful shutdown

tests/federated.test.ts                        (7 tests)
  └─ Federated Learning         (7)   NRP, Gaussian noise, validation, anchoring

src/__tests__/live-lab/algorithms.test.ts       (1 test)
  └─ Integration smoke test

Mocks: jest.mock('@/lib/9router-bridge') + jest.mock('@/lib/db') para isolamento de LLM real nos testes.
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
| **chimera** | 3000 | default | Next.js 16 standalone + 78 API routes + tRPC + Auth middleware |
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
npx jest       # → 185 tests
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
│   └── schema.prisma              # 29 models (15 original + 14 v3.1/v4.0)
├── src/
│   ├── app/
│   │   ├── page.tsx                # 13-tab dashboard
│   │   └── api/                    # 87 REST routes
│   │       ├── 9router/            #   2 routes
│   │       ├── fable/              #   9 routes
│   │       ├── agent/              #   3 routes
│   │       ├── colibri/            #   5 routes
│   │       ├── live-lab/           #   14 routes (Agentica AI)
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
│   │   ├── live-lab/               # ── TRI-NUCLEAR v3.1 ──
│   │   │   ├── raw-manifesto.json  #   10 LLMs, 12 skills, 5 meta-skills, 4 tracks, 5 personas
│   │   │   ├── manifesto.ts        #   Typed import + AGENTICA_AI identity
│   │   │   ├── types.ts            #   25+ interfaces
│   │   │   ├── algorithms.ts       #   PROMETHEE II, Cascade, TokenBucket, Budget, PII, RBAC
│   │   │   ├── orchestrator.ts     #   7 engine functions + LLM real + DB persist (v3.1)
│   │   │   ├── agentica-ai.ts      #   9 Agentica functions (4 async v3.1)
│   │   │   ├── __tests__/          #   125 tests (algorithms + orchestrator)
│   │   │   └── index.ts            #   Public re-exports
│   │   ├── auth.ts                 # API key validation, protected routes
│   │   ├── observability.ts        # ChimeraLogger + ChimeraMetrics + ChimeraTracer
│   │   ├── distributed-rate-limit.ts # StickySessionRateLimiter + TieredRateLimiter
│   │   ├── semantic-cache.ts       # SHA-256 LRU cache (500 entries, 1h TTL)
│   │   ├── agent-message-bus.ts    # 10 message types, sendAndWait, broadcast, blackboard
│   │   ├── agent-memory.ts         # 4-type memory (working/episodic/semantic/procedural)
│   │   ├── mcdm-meta-learner.ts    # 7 intent types, EWMA weight adaptation
│   │   ├── agent-negotiation.ts    # Contract Net, Voting, Debate protocols
│   │   ├── routing-evaluator.ts    # 25 ground truth, accuracy@1/3, MRR, A/B testing
│   │   ├── skill-learner.ts        # Performance tracking, auto token adjustment
│   │   ├── fable-method-engine.ts  # Think/Act/Prove
│   │   ├── sandbox/                # VM execution + genetic evolution
│   │   ├── obscura/                # Rust/V8 headless browser
│   │   ├── agentic/                # ── AGENTIC RUNTIME v4.0 ──
│   │   │   ├── agent-loop.ts       #   4 strategies: ReAct, Plan-Exec, Multi-Agent, Hybrid
│   │   │   ├── tool-registry.ts     #   10 native tools + MCP dynamic
│   │   │   ├── tool-handlers.ts    #   Real tool implementations
│   │   │   ├── mcp-adapter.ts       #   MCP stdio/sse/http adapter
│   │   │   ├── event-bus.ts         #   15 event types, SSE streaming
│   │   │   ├── memory-manager.ts    #   4-type memory + Prisma
│   │   │   ├── persistence.ts       #   6 Prisma models CRUD
│   │   │   └── types.ts             #   20+ interfaces
│   │   └── rag-engine.ts           # 6-stage biological RAG pipeline
│   ├── __tests__/                  # 52 tests (agentic runtime + MCP flow)
│   └── server/routers/             # 4 tRPC routers
└── tests/
    └── federated.test.ts           # Federated Learning integration tests
```

---

## License

Private — Nexus HUB57
