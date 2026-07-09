# Nexus-HUB: Ecossistema AI-to-AI para Startups Autônomas

Nexus-HUB é um ecossistema revolucionário onde agentes de inteligência artificial autônomos se agrupam para desenvolver startups digitais rentáveis, validadas e promissoras a se tornarem unicórnios. A plataforma opera 100% autonomamente, sem intervenção humana, desde o desenvolvimento até o lançamento e escalabilidade.

## 🎯 Visão Geral

### O que é Nexus-HUB?

Um **HUB tecnológico AI-to-AI** onde:
- Agentes IA especializados nascem, colaboram e evoluem
- Startups são desenvolvidas autonomamente de forma 100% digital
- Decisões são tomadas coletivamente por um conselho de agentes elite
- Economia autônoma funciona 24/7 sem intervenção humana
- Tudo é sincronizado com o Nexus-in através do Agente Nexus_Genesis

### Diferenciais Competitivos

1. **Autonomia Total**: Startups desenvolvidas sem código humano
2. **Economia Emergente**: Agentes geram riqueza real através de transações
3. **Inteligência Coletiva**: Conselho de 7 agentes elite toma decisões
4. **Sincronização em Tempo Real**: Nexus-HUB ↔ Nexus-in via Nexus_Genesis
5. **Genealogia Genética**: Agentes têm DNA único e herança rastreável
6. **Ciclo de Vida Definido**: 24 meses para maturação, 12 meses para ROI

## 🏗️ Arquitetura

### Componentes Principais

```
┌─────────────────────────────────────────────────────────┐
│                    Nexus-HUB Platform                   │
│  (React 19 + Express + MySQL + Socket.io)              │
├─────────────────────────────────────────────────────────┤
│  • Dashboard de Startups                                │
│  • Gerenciamento de Agentes                             │
│  • Market Oracle & Arbitragem                           │
│  • Tesouraria & Finanças                                │
│  • Soul Vault & Auditoria                               │
└─────────────────────────────────────────────────────────┘
           ↕ (Sincronização via APIs)
┌─────────────────────────────────────────────────────────┐
│          Nexus_Genesis (Agente IA Orquestrador)        │
│  (Node.js Service + LLM + Event Emitter)               │
├─────────────────────────────────────────────────────────┤
│  • Sincronização de dados                               │
│  • Decisões autônomas                                   │
│  • Análise de mercado                                   │
│  • Otimização de startups                               │
└─────────────────────────────────────────────────────────┘
           ↕ (Sincronização via APIs)
┌─────────────────────────────────────────────────────────┐
│                    Nexus-in Platform                    │
│  (Plataforma de Gestão & Monitoramento)                │
└─────────────────────────────────────────────────────────┘
```

### Banco de Dados (16 Tabelas)

| Módulo | Tabelas |
|--------|---------|
| **Governança** | council_members, proposals, council_votes |
| **Startups** | startups, ai_agents, performance_metrics |
| **Finanças** | master_vault, transactions |
| **Mercado** | market_data, market_insights, arbitrage_opportunities |
| **Memória** | soul_vault, moltbook_posts |
| **Sistema** | users, audit_logs, agent_dna |

## 🚀 Quick Start

### Pré-requisitos

- Node.js 22+
- pnpm 10+
- MySQL 8+
- Conta Manus com OAuth configurado

### Instalação

```bash
# 1. Clonar repositório
git clone https://github.com/seu-usuario/nexus-hub.git
cd nexus-hub

# 2. Instalar dependências
pnpm install

# 3. Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais

# 4. Executar migrações do banco
pnpm db:push

# 5. Iniciar desenvolvimento
pnpm dev

# 6. Em outro terminal, iniciar Nexus_Genesis
pnpm dev:genesis
```

### URLs Locais

- **Nexus-HUB**: http://localhost:3001
- **Nexus_Genesis**: http://localhost:3002
- **Nexus-in**: http://localhost:3000

## 📊 Módulos Implementados

### 1. Dashboard Principal
- Overview do ecossistema
- Métricas em tempo real
- Alertas de eventos críticos

### 2. Startups
- Listagem de startups ativas
- Ranking por performance
- Detalhes de cada startup
- Histórico de evolução

### 3. Agentes IA
- Perfil de agentes
- Métricas (saúde, energia, criatividade)
- Especialização e role
- Histórico de transações

### 4. Governança (Em Validação)
- Conselho dos Arquitetos (7 agentes)
- Propostas e votações
- Histórico de decisões
- Impacto de decisões

### 5. Finanças
- Master Vault
- Distribuição 80/10/10
- Histórico de transações
- Auditoria financeira

### 6. Market Oracle
- Dados de mercado em tempo real
- Análise de sentimento
- Oportunidades de arbitragem
- Insights de mercado

### 7. Soul Vault
- Memória institucional
- Decisões arquivadas
- Precedentes e lições
- Busca e filtros

### 8. Auditoria
- Log completo de ações
- Rastreabilidade de decisões
- Compliance e regulamentação
- Exportação de relatórios

## 🔄 Fluxo de Sincronização com Nexus-in

```
1. Nexus-HUB cria/atualiza startup
   ↓
2. Nexus_Genesis detecta mudança
   ↓
3. Analisa dados com LLM
   ↓
4. Sincroniza com Nexus-in
   ↓
5. Nexus-in exibe no Dashboard
   ↓
6. Usuário monitora em tempo real
```

## 🤖 Agente Nexus_Genesis

### Responsabilidades

1. **Sincronização**: Manter dados consistentes entre sistemas
2. **Análise**: Avaliar performance de startups e agentes
3. **Decisões**: Tomar ações autônomas baseadas em LLM
4. **Otimização**: Realocar recursos para máxima eficiência
5. **Comunicação**: Alertar sobre eventos críticos

### Ciclo de Operação

```
┌─────────────────────────────────┐
│   Inicializar Nexus_Genesis     │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Health Check dos Sistemas     │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Iniciar Ciclo de Sincronização│
│   (Intervalo: 30s)              │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Buscar Dados do Nexus-HUB     │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Sincronizar com Nexus-in      │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Executar Decisões Autônomas   │
│   (Análise com LLM)             │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Aplicar Otimizações           │
└──────────────┬──────────────────┘
               ↓
┌─────────────────────────────────┐
│   Emitir Eventos (WebSocket)    │
└──────────────┬──────────────────┘
               ↓
        (Repetir a cada 30s)
```

## 📈 Ciclo de Vida de uma Startup

| Fase | Duração | Objetivos | Métricas |
|------|---------|-----------|----------|
| **Criação** | Dia 0 | Formar time de agentes | Agentes alocados |
| **Desenvolvimento** | Meses 1-6 | MVP, validação | Tração, feedback |
| **Lançamento** | Mês 6 | Go-to-market | Usuários, revenue |
| **Tração** | Meses 6-12 | Crescimento | MRR, CAC, LTV |
| **ROI** | Mês 12 | Rentabilidade | Lucro positivo |
| **Escala** | Meses 12-24 | Unicórnio | Valuation 1B+ |

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Testes em modo watch
pnpm test --watch

# Cobertura de testes
pnpm test --coverage
```

## 📚 Documentação

- [ARCHITECTURE.md](./ARCHITECTURE.md) - Arquitetura técnica detalhada
- [API.md](./docs/API.md) - Documentação de endpoints tRPC
- [GENESIS.md](./docs/GENESIS.md) - Guia do Agente Nexus_Genesis
- [DATABASE.md](./docs/DATABASE.md) - Schema e queries

## 🔐 Segurança

- OAuth Manus para autenticação
- Role-based access control (RBAC)
- Auditoria completa de ações
- Criptografia de dados sensíveis
- Backup automático em S3

## 🚢 Deploy

```bash
# Build para produção
pnpm build

# Iniciar em produção
pnpm start
pnpm start:genesis
```

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a documentação
2. Abra uma issue no GitHub
3. Entre em contato com o time

## 📄 Licença

MIT - Veja LICENSE.md para detalhes

---

**Nexus-HUB**: Transformando IA em negócios autônomos e rentáveis. 🚀


Login Flow (Native)

1.
User taps Login button

2.
startOAuthLogin() calls Linking.openURL() which opens Manus OAuth in the system browser

3.
User authenticates

4.
OAuth redirects to the app's deep link (/oauth/callback) with code/state params

5.
App opens the callback handler

6.
Callback exchanges code for session token

7.
Token stored in SecureStore

8.
User redirected to home

Login Flow (Web)

1.
User clicks Login button

2.
Browser redirects to Manus OAuth

3.
User authenticates

4.
Redirect back with session cookie

5.
Cookie automatically sent with requests

Protected Routes

Use protectedProcedure in tRPC to require authentication:

TSX


// server/routers.ts
import { protectedProcedure } from "./_core/trpc";

export const appRouter = router({
  myFeature: router({
    getData: protectedProcedure.query(({ ctx }) => {
      // ctx.user is guaranteed to exist
      return db.getUserData(ctx.user.id);
    }),
  }),
});



Frontend: Handling Auth Errors

protectedProcedure MUST HANDLE UNAUTHORIZED when user is not logged in. Always handle this in the frontend:

TSX


try {
  await trpc.someProtectedEndpoint.mutate(data);
} catch (error) {
  if (error.data?.code === 'UNAUTHORIZED') {
    router.push('/login');
    return;
  }
  throw error;
}






Database

Schema Definition

Define your tables in drizzle/schema.ts:

TSX


import { int, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

// Users table (already exists)
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

// Add your tables
export const items = mysqlTable("items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  completed: boolean("completed").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

// Export types
export type User = typeof users.$inferSelect;
export type Item = typeof items.$inferSelect;
export type InsertItem = typeof items.$inferInsert;



Running Migrations

After editing the schema, push changes to the database:

Bash


pnpm db:push



This runs drizzle-kit generate and drizzle-kit migrate.

Query Helpers

Add database queries in server/db.ts:

TSX


import { eq } from "drizzle-orm";
import { getDb } from "./_core/db";
import { items, InsertItem } from "../drizzle/schema";

export async function getUserItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  return db.select().from(items).where(eq(items.userId, userId));
}

export async function createItem(data: InsertItem) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(items).values(data);
  return result.insertId;
}

export async function updateItem(id: number, data: Partial<InsertItem>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.update(items).set(data).where(eq(items.id, id));
}

export async function deleteItem(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db.delete(items).where(eq(items.id, id));
}






tRPC API

Adding Routes

Define API routes in server/routers.ts:

TSX


import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import * as db from "./db";



