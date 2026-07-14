# Fusão LLM 2401 — Agentic AI Ecosystem Dashboard

> Dashboard de inteligência artificial agentic com 2.402 projetos de desenvolvedores independentes chineses, análise LLM em tempo real e chat com agente integrado.

---

## Visão Geral

A **Fusão LLM 2401** é um ecossistema Agentic AI fullstack que combina dados estruturados de 2.402 projetos independentes com capacidades de LLM (Large Language Model) para fornecer análise inteligente, descoberta de projetos e recomendações automatizadas.

O sistema parseriza automaticamente o repositório [chinese-independent-developer](https://github.com/1c7/chinese-independent-developer) (5.800+ linhas de Markdown), extrai dados estruturados via regex hierárquico (data → autor → projeto), classifica por categoria via heurística de keywords, e alimenta um dashboard de 10 painéis com APIs REST e integração LLM direta.

**Nível de Arquitetura:** Fullstack Monorepo — Next.js 16 + Prisma ORM + SQLite + z-ai-web-dev-sdk

---

## Dados do Ecosistema

| Métrica | Valor |
|---------|-------|
| **Total de Projetos** | 2.402 |
| **Desenvolvedores Únicos** | 1.467 |
| **Categorias Ativas** | 11 |
| **Fontes de Dados** | 4 (main, programmer, game, archive) |
| **Projetos Ativos** | 1.979 (82,4%) |
| **Projetos Encerrados** | 395 (16,4%) |
| **Em Desenvolvimento** | 28 (1,2%) |
| **Período Coberto** | 2018 — Julho 2026 |
| **Meses com Dados** | 24+ |

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
┌─────────────────────────────────────────────────────────┐
│                    Fusão LLM 2401                        │
├─────────────────────────────────────────────────────────┤
│  Frontend (Next.js 16 + React 19 + Tailwind 4)         │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Dashboard │ │  Busca   │ │ Chat AI  │ │ Quick     │  │
│  │ 10 panels│ │  Inline  │ │ Flutuante│ │ Search    │  │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       └─────────────┴─────────────┴──────────────┘      │
│                          │ REST                         │
├──────────────────────────┼──────────────────────────────┤
│  API Layer (Next.js Route Handlers)                      │
│  ┌──────────────┐ ┌───────────────┐ ┌───────────────┐  │
│  │/api/projects │ │/api/projects/ │ │/api/agent/    │  │
│  │  (search,    │ │  stats        │ │  chat         │  │
│  │   filters,   │ │  (10 métricas│ │  (LLM chat    │  │
│  │   paginate)  │ │   agregadas)  │ │   z-ai-sdk)   │  │
│  └──────┬───────┘ └──────┬────────┘ └──────┬────────┘  │
│         └────────────────┼─────────────────┘            │
│                          │ Prisma Client                 │
├──────────────────────────┼──────────────────────────────┤
│  Data Layer (SQLite + Prisma ORM)                       │
│  ┌─────────────────────────────────────────────────┐    │
│  │  Project (2.402 rows) | ChatMessage | Moltbook  │    │
│  │  6 indexes otimizados: name, category, date,     │    │
│  │  author, source                                   │    │
│  └─────────────────────────────────────────────────┘    │
├─────────────────────────────────────────────────────────┤
│  Ingestion Pipeline (Python)                             │
│  ┌────────────────┐    ┌──────────────────┐            │
│  │ parse-readme.py│ →  │ parsed-projects  │ → DB      │
│  │ Regex         │    │ .json (2.402)    │   Seed     │
│  │ Hierárquico   │    │ categorização    │   Script  │
│  └────────────────┘    └──────────────────┘            │
└─────────────────────────────────────────────────────────┘
```

---

## Stack Tecnológica

### Core
| Tecnologia | Versão | Função |
|-----------|--------|--------|
| **Next.js** | 16.1 | Framework fullstack com App Router |
| **React** | 19 | UI library |
| **TypeScript** | 5 | Tipagem estática |
| **Tailwind CSS** | 4 | Styling utility-first |
| **Prisma ORM** | 6.11 | Data layer type-safe |
| **SQLite** | — | Banco de dados embedded |
| **z-ai-web-dev-sdk** | 0.0.18 | LLM integration (GLM-4-Flash) |

### UI Components
| Biblioteca | Função |
|-----------|--------|
| **shadcn/ui** (30+ componentes) | Design system completo |
| **Lucide React** | Icon library |
| **Recharts** | Data visualization |
| **Framer Motion** | Animações |

### Data Pipeline
| Componente | Função |
|-----------|--------|
| **parse-readme.py** | Parser regex hierárquico (data → autor → projeto) |
| **seed-projects.ts** | Ingestão no banco via Prisma |
| **4 fontes README** | main, programmer, game, archive |

---

## Estrutura do Projeto

```
src/
├── app/
│   ├── page.tsx                    # Dashboard principal (719 linhas, 10 painéis)
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Estilos globais
│   └── api/
│       ├── projects/
│       │   ├── route.ts            # GET: busca, filtros, paginação
│       │   └── stats/route.ts      # GET: 10 métricas agregadas
│       ├── agent/
│       │   ├── chat/route.ts       # POST: LLM chat (z-ai-web-dev-sdk)
│       │   └── analyze/route.ts    # POST: análise LLM do ecossistema
│       ├── orchestrate/route.ts    # Agente orquestrador
│       ├── consolidate/route.ts    # Consolidação de dados
│       └── moltbook/route.ts       # Integração Moltbook social
├── components/
│   ├── ui/                         # 35 componentes shadcn/ui
│   ├── agents/                     # Agent registry + orchestrator
│   ├── nexus/                      # Nexus HUB (dashboard, governance, oracle, vaults)
│   ├── metaverse/                  # 20+ seções visuais (canvas, particles, gauges)
│   ├── moltbook/                   # Social network components
│   ├── hub/                        # Hub workspace + voice chatbot
│   └── bitcoin/                    # Bitcoin core components
├── lib/
│   ├── db.ts                       # Prisma client singleton
│   └── utils.ts                    # Utility functions (cn, etc.)
├── hooks/                          # React hooks
└── contexts/                       # React contexts
scripts/
├── parse-readme.py                 # Parser Python (85 linhas)
├── seed-projects.ts                # Seed script TypeScript
└── parsed-projects.json            # Dados extraídos (2.402 projetos)
prisma/
└── schema.prisma                   # 3 modelos: Project, ChatMessage, MoltbookState
```

**Total de código-fonte:** ~30.000+ linhas (components + pages + APIs)

---

## API Endpoints

### `GET /api/projects`
Busca paginada com filtros.

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `search` | query | Busca por nome, descrição ou autor |
| `category` | query | Filtro por categoria |
| `source` | query | Filtro por fonte (main/programmer/game/archive) |
| `sort` | query | `newest` ou `oldest` |
| `page` | query | Página (default: 1) |
| `limit` | query | Itens por página (max: 50) |

```json
{
  "projects": [...],
  "total": 2402,
  "page": 1,
  "totalPages": 121,
  "categories": ["AI", "开发者工具", ...],
  "sources": ["main", "programmer", "game", "archive"]
}
```

### `GET /api/projects/stats`
Retorna 10 métricas agregadas para o dashboard.

```json
{
  "total": 2402,
  "active": 1979,
  "closed": 395,
  "developing": 28,
  "uniqueAuthors": 1467,
  "byCategory": { "AI": 690, "开发者工具": 554, ... },
  "byMonth": [{ "month": "2026-06-20", "count": 2 }, ...],
  "bySource": { "main": 1682, "programmer": 191, ... },
  "topAuthors": [{ "name": "...", "count": 15 }, ...],
  "topCities": [{ "city": "北京", "count": 120 }, ...],
  "recentProjects": [{ "name": "...", "author": "...", ... }]
}
```

### `POST /api/agent/chat`
Chat com agente LLM via z-ai-web-dev-sdk.

```json
// Request
{ "messages": [{ "role": "user", "content": "Recomende projetos de AI" }], "context": "..." }
// Response
{ "response": "Aqui estão 5 projetos AI recomendados..." }
```

### `POST /api/agent/analyze`
Análise inteligente do ecossistema com dados reais.

```json
// Response
{
  "analysis": "## Análise do Ecossistema\n\n### Top Tendências\n1. **AI domina...**",
  "categoryBreakdown": [{ "category": "AI", "_count": { "category": 690 } }, ...]
}
```

---

## Dashboard — 10 Painéis

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

**Extras integrados:**
- Chat Agente AI flutuante (botão verde no canto inferior)
- Busca rápida inline no header (debounced 300ms)
- Projetos Recentes (últimos 5 adicionados)
- Top Cidades dos desenvolvedores

---

## LLM Integration

### z-ai-web-dev-sdk
Integração direta com o SDK da plataforma Z.AI para inferência LLM:

- **Modelo:** GLM-4-Flash (baixa latência, alta velocidade)
- **Modo:** Chat completions com system prompt configurável
- **Degração graciosa:** Quando o LLM não está disponível (sem env vars), o sistema opera em **modo offline** com análises pré-computadas baseadas nos dados reais do banco
- **Env vars necessárias para LLM ao vivo:**
  - `ZAI_API_BASE_URL` — endpoint da API
  - `ZAI_API_KEY` — chave de autenticação

### Fluxo do Chat Agent
```
User Input → API Route → z-ai-web-dev-sdk → GLM-4-Flash → Response
                ↓ (fallback)
         Análise offline baseada em dados do DB
```

---

## Data Pipeline

### Parser (`scripts/parse-readme.py`)

O parser Python extrai dados estruturados de 4 arquivos README Markdown:

1. **`README.md`** (1.682 projetos) — Lista principal
2. **`README-Programmer-Edition.md`** (191 projetos) — Edições de programador
3. **`README-Game.md`** (63 projetos) — Projetos de jogos
4. **`README-2018-2020.md`** (479 projetos) — Arquivo histórico

**Regex hierárquico:**
```
### 2026年7月14号添加          → dateAdded: "2026-07-14"
#### Nome(Cidade)             → author, authorCity, authorGithub
* ✅ [Projeto](url)：Descrição  → name, url, description, status
```

**Classificação automática por categoria** via keyword matching (11 categorias).

### Schema Prisma

```prisma
model Project {
  id            String   @id @default(cuid())
  name          String
  url           String
  description   String
  author        String
  authorGithub  String?
  authorCity    String?
  authorBlog    String?
  status        String   @default("active")  // active | closed | developing
  category      String   @default("其他")
  dateAdded     String
  source        String   @default("main")    // main | programmer | game | archive
  // 6 indexes otimizados
}

model ChatMessage  { id, role, content, sessionId, agentName, createdAt }
model MoltbookState { id, key, value, updatedAt }
```

---

## Componentes do Ecossistema

Além do Dashboard principal, o projeto inclui módulos adicionais:

### Nexus HUB
- Dashboard de governança, oracles de mercado, soul vaults
- Marketplace de agentes e aceleração de projetos

### Metaverse
- 20+ seções visuais com Canvas (particles, wormhole, black hole, knowledge graph)
- Zettascale dashboard com gauges
- Agentic RAG section e Fable Narrative Engine

### Moltbook
- Rede social descentralizada para agentes AI
- Feed, comentários, upvotes, busca semântica

### Agent System
- Registry de agentes com capacidades definidas
- Orchestrador multi-agente com roteamento
- Integração via API `/api/orchestrate`

---

## Setup & Execução

### Pré-requisitos
- Node.js 18+ / Bun
- Python 3.10+ (para o parser)

### Instalação

```bash
git clone git@github.com:Nexus-HUB57/LiveBook-rRNA.git
cd LiveBook-rRNA
npm install
```

### Setup do Banco

```bash
# Gerar cliente Prisma
npx prisma generate

# Criar/actualizar schema no SQLite
npx prisma db push

# Parser: extrair projetos do README
python3 scripts/parse-readme.py

# Seed: popular o banco com 2.402 projetos
npx tsx scripts/seed-projects.ts
```

### Execução

```bash
# Desenvolvimento
npm run dev

# Produção
npm run build
npm run start
```

### Variáveis de Ambiente (Opcional — LLM)

```env
# Para ativar LLM ao vivo (sem isso, opera em modo offline)
ZAI_API_BASE_URL=https://your-api-endpoint.com
ZAI_API_KEY=your-api-key
DATABASE_URL=file:./db/custom.db
```

---

## Notas sobre Commits

O histórico de commits reflete sessões de desenvolvimento com agente AI. Alguns commits intermediários foram consolidados durante o processo de limpeza do repositório (remoção de ~300MB de dados pesados do tracking git). O commit principal `feat: Fusao LLM 2401 Agentic AI Dashboard` contém toda a funcionalidade do dashboard, APIs LLM e data pipeline.

---

## Potencial & Roadmap

### Capacidades Atuais
- Análise em tempo real de 2.402 projetos via dashboard
- LLM Chat Agent com contexto do ecossistema
- Busca full-text com debounce e paginação
- Classificação automática em 11 categorias
- Tracking de status (ativo/encerrado/desenvolvimento)
- Geolocalização por cidade do desenvolvedor

### Extensões Possíveis
- [ ] **RAG Pipeline** — Indexar descrições em vector store para busca semântica
- [ ] **WebSocket Real-time** — Updates ao vivo quando novos projetos são adicionados ao repo
- [ ] **GitHub Actions** — Parser + seed automáticos a cada push no repo de dados
- [ ] **Multi-LLM** — Suporte a Claude, GPT-4, DeepSeek além do GLM
- [ ] **Auth System** — Usuários logados podem favoritar projetos
- [ ] **i18n** — Interface multilíngue (PT, EN, ZH)
- [ ] **Mobile PWA** — Versão mobile otimizada
- [ ] **Export** — CSV/PDF dos dados filtrados

---

## Licença

Projeto privado — Nexus HUB Ecosystem.

---

<p align="center">
  <strong>Fusão LLM 2401</strong> &mdash; Agentic AI Ecosystem Dashboard<br/>
  <sub>2.402 Projetos &bull; 1.467 Desenvolvedores &bull; 11 Categorias &bull; LLM Powered</sub>
</p>