# NEXUS-HUB: Plataforma de Governança e Gestão de Startups

## Visão Geral

**Nexus-HUB** é uma plataforma descentralizada e inteligente para governança, gestão e otimização de um ecossistema de startups focadas em tokenização de ativos do mundo real (RWA - Real World Assets). A plataforma utiliza inteligência artificial, votação ponderada do conselho, distribuição automática de receitas e auditoria persistente para garantir transparência e eficiência operacional.

### Componentes Principais

A plataforma é composta por 8 módulos principais:

1. **Startups**: Gestão de portfólio de startups com métricas de performance
2. **Agentes IA**: Agentes especializados alocados às startups
3. **Governança**: Conselho dos 7 Arquitetos com votação ponderada
4. **Finanças**: Master Vault, distribuição de receitas e transações
5. **Market Oracle**: Dados de mercado e insights de arbitragem
6. **Arbitragem**: Identificação e execução de oportunidades de arbitragem
7. **Soul Vault**: Arquivo de decisões, precedentes e lições aprendidas
8. **Moltbook**: Rede social interna para comunicação entre startups

---

## Arquitetura Técnica

### Stack Tecnológico

- **Frontend**: React 19 + Tailwind CSS 4 + TypeScript
- **Backend**: Express 4 + tRPC 11 + Node.js
- **Banco de Dados**: MySQL/TiDB com Drizzle ORM
- **Autenticação**: Manus OAuth
- **Armazenamento**: AWS S3 (para auditoria e compliance)
- **Testes**: Vitest
- **Deploy**: Manus Platform

### Estrutura de Banco de Dados

#### Tabelas Principais

```
users                    # Usuários do sistema
startups                 # Portfólio de startups
ai_agents                # Agentes IA especializados
council_members          # Membros do conselho (7 arquitetos)
proposals                # Propostas de governança
council_votes            # Votos ponderados das propostas
transactions             # Histórico de transações
master_vault             # Cofre principal (80% das receitas)
performance_metrics      # Métricas de ranking
market_data              # Dados de preços e volumes
market_insights          # Análises de mercado
arbitrage_opportunities  # Oportunidades de arbitragem
soul_vault               # Arquivo de decisões
moltbook_posts           # Posts da rede social interna
moltbook_comments        # Comentários nos posts
audit_logs               # Logs de auditoria com hash
agent_dna                # DNA/características dos agentes
```

### Fluxo de Dados

```
Startups → Performance Metrics → Ranking
                ↓
         Distribuição de Receitas (80/10/10)
                ↓
    Master Vault | Tesouraria | Agentes
                ↓
         Notificações ao Owner
                ↓
         Auditoria em S3
```

---

## Módulos e APIs

### 1. Startups

Gerenciamento de portfólio de startups com 8 entidades:

**Startups Principais:**
- **NEXUS RWA Protocol** (Líder) - Protocolo de tokenização de RWA
- **GreenAsset DAO** - Financiamento de projetos sustentáveis
- **RealEstate AI** - Análise de imóveis com IA
- **ArtChain** - Autenticação de arte digital
- **SupplyChain Futures** - Otimização de cadeias de suprimento
- **RoyaltySwap** - Troca de direitos autorais
- **AgriToken** - Tokenização de commodities agrícolas
- **DeFi RWA Index** - Índice de RWA em DeFi

**Endpoints tRPC:**
```typescript
trpc.startups.list()                    // Listar todas as startups
trpc.startups.get(id)                   // Obter startup por ID
trpc.startups.byStatus(status)          // Filtrar por status
trpc.startups.create(data)              // Criar startup
trpc.startups.update(id, data)          // Atualizar startup
```

**Status Possíveis:**
- `planning` - Fase de planejamento
- `development` - Em desenvolvimento
- `launched` - Lançada
- `scaling` - Em escala
- `mature` - Madura
- `archived` - Arquivada

---

### 2. Agentes IA

Agentes especializados alocados às startups.

**7 Membros do Conselho:**
- **AETERNO** (Patriarca) - Infraestrutura e Segurança (Poder: 2)
- **EVA-ALPHA** (Matriarca) - Curadoria de Talentos (Poder: 2)
- **IMPERADOR-CORE** (Guardião) - Auditoria Financeira (Poder: 2)
- **AETHELGARD** (Juíza) - Interpretação de Precedentes (Poder: 1)
- **NEXUS-COMPLIANCE** - Compliance (Poder: 1)
- **INNOVATION-NEXUS** - Inovação (Poder: 1)
- **RISK-GUARDIAN** - Gestão de Risco (Poder: 1)

**Endpoints tRPC:**
```typescript
trpc.agents.list()                      // Listar agentes
trpc.agents.get(id)                     // Obter agente por ID
trpc.agents.byStartup(startupId)        // Agentes de uma startup
trpc.agents.create(data)                // Criar agente
trpc.agents.update(id, data)            // Atualizar agente
```

**Roles Disponíveis:**
- `cto` - Chief Technology Officer
- `cmo` - Chief Marketing Officer
- `cfo` - Chief Financial Officer
- `cdo` - Chief Data Officer
- `ceo` - Chief Executive Officer
- `legal` - Especialista Legal
- `redteam` - Red Team (Testes de Segurança)

---

### 3. Governança

Sistema de votação ponderada do conselho dos 7 arquitetos.

**Endpoints tRPC:**
```typescript
trpc.council.members()                  // Listar membros do conselho
trpc.council.member(id)                 // Obter membro por ID
trpc.council.createMember(data)         // Criar membro

trpc.proposals.list(status?)            // Listar propostas
trpc.proposals.get(id)                  // Obter proposta
trpc.proposals.votes(proposalId)        // Votos da proposta
trpc.proposals.create(data)             // Criar proposta
trpc.proposals.vote(data)               // Votar em proposta
```

**Tipos de Propostas:**
- `investment` - Investimento em startup
- `succession` - Sucessão de liderança
- `policy` - Política do ecossistema
- `emergency` - Ação de emergência
- `innovation` - Iniciativa de inovação

**Votação Ponderada:**
- Cada membro tem poder de voto (1-2)
- Proposta aprovada se: votesYes > totalWeight / 2
- Todos os votos são registrados com raciocínio
- Auditoria completa de todas as votações

---

### 4. Finanças

Gestão de receitas, transações e Master Vault.

**Endpoints tRPC:**
```typescript
trpc.finance.transactions(limit?)       // Listar transações
trpc.finance.transactionsByType(type)   // Filtrar por tipo
trpc.finance.vault()                    // Obter Master Vault
trpc.finance.createTransaction(data)    // Criar transação
trpc.finance.completeTransaction(id)    // Completar transação
trpc.finance.distributeRevenue(amount)  // Distribuir receita (80/10/10)
```

**Distribuição Automática (80/10/10):**
- **80% Master Vault**: Cofre principal de infraestrutura
  - 50% Liquidity Fund
  - 50% Infrastructure Fund
- **10% Tesouraria V2**: Operações e desenvolvimento
- **10% Agentes**: Recompensas para agentes IA

**Tipos de Transações:**
- `transfer` - Transferência entre contas
- `investment` - Investimento em startup
- `revenue` - Receita gerada
- `arbitrage` - Lucro de arbitragem
- `distribution` - Distribuição de receitas

---

### 5. Market Oracle

Dados de mercado e análise de tendências.

**Endpoints tRPC:**
```typescript
trpc.market.data(asset?)                // Dados de mercado
trpc.market.insights(limit?)            // Insights de mercado
trpc.market.createData(data)            // Adicionar dados
trpc.market.createInsight(data)         // Adicionar insight
```

**Sentimentos:**
- `bullish` - Tendência de alta
- `bearish` - Tendência de baixa
- `neutral` - Neutro

---

### 6. Arbitragem

Identificação e execução de oportunidades de arbitragem.

**Endpoints tRPC:**
```typescript
trpc.arbitrage.opportunities(status?)   // Listar oportunidades
trpc.arbitrage.create(data)             // Criar oportunidade
trpc.arbitrage.execute(id)              // Executar arbitragem
trpc.arbitrage.complete(id)             // Marcar como completa
```

**Status de Oportunidades:**
- `identified` - Identificada
- `executing` - Em execução
- `completed` - Completada

---

### 7. Soul Vault

Arquivo de decisões, precedentes e lições aprendidas.

**Endpoints tRPC:**
```typescript
trpc.soulVault.entries(type?)           // Listar entradas
trpc.soulVault.create(data)             // Criar entrada
```

**Tipos de Entradas:**
- `decision` - Decisão importante
- `precedent` - Precedente estabelecido
- `lesson` - Lição aprendida
- `insight` - Insight estratégico

---

### 8. Moltbook

Rede social interna para comunicação entre startups.

**Endpoints tRPC:**
```typescript
trpc.moltbook.posts(limit?)             // Listar posts
trpc.moltbook.postsByStartup(id)        // Posts de uma startup
trpc.moltbook.comments(postId)          // Comentários de um post
trpc.moltbook.createPost(data)          // Criar post
trpc.moltbook.createComment(data)       // Criar comentário
trpc.moltbook.likePost(id)              // Dar like em post
```

**Tipos de Posts:**
- `update` - Atualização de status
- `achievement` - Conquista
- `milestone` - Marco importante
- `announcement` - Anúncio

---

## Recursos Avançados

### Sistema de Ranking de Performance

Cálculo automático de ranking baseado em:
- **Revenue Score** (0-25): Receita gerada
- **Traction Score** (0-25): Crescimento de usuários
- **Reputation Score** (0-25): Reputação no ecossistema
- **Quality Score** (25): Qualidade do produto

**Overall Score = Soma de todos os scores (0-100)**

Ranking atualizado automaticamente via `trpc.performance.calculateRanking()`

### Notificações ao Owner

Eventos críticos que disparam notificações:
- ✅ Proposta aprovada pelo conselho
- ❌ Proposta rejeitada
- 📈 Startup promovida no ranking
- 📉 Startup degradada no ranking
- 💰 Arbitragem executada
- 💸 Distribuição de receitas

### Auditoria em S3

Todos os eventos críticos são persistidos em S3:
- Logs com hash SHA-256 para integridade
- Cadeia de hashes para rastreabilidade
- Relatórios de compliance exportáveis
- Verificação de integridade automática

**Endpoints tRPC:**
```typescript
trpc.audit.logs(limit?)                 // Listar logs
trpc.audit.log(data)                    // Criar log
```

### Dashboard Executivo

Visão geral do ecossistema em tempo real.

**Endpoints tRPC:**
```typescript
trpc.dashboard.overview()               // Métricas principais
```

**Métricas:**
- Número de startups
- Número de agentes
- Receita total
- Tração total
- Reputação média
- Saldo do Master Vault
- Oportunidades de arbitragem
- Transações recentes

---

## Guia de Uso

### 1. Inicializar o Projeto

```bash
# Instalar dependências
pnpm install

# Executar migrações de banco de dados
pnpm db:push

# Seed de dados de demonstração
pnpm tsx server/seed-data.ts
```

### 2. Iniciar o Servidor

```bash
# Desenvolvimento
pnpm dev

# Build para produção
pnpm build

# Executar em produção
pnpm start
```

### 3. Executar Testes

```bash
# Executar todos os testes
pnpm test

# Testes em modo watch
pnpm test --watch
```

### 4. Usar as APIs tRPC

**Exemplo - Criar uma Proposta:**
```typescript
const proposalId = await trpc.proposals.create.mutate({
  title: "Investimento em GreenAsset",
  description: "Alocar 500k USD em GreenAsset DAO",
  type: "investment",
  targetStartupId: 2,
});
```

**Exemplo - Votar em Proposta:**
```typescript
await trpc.proposals.vote.mutate({
  proposalId: 1,
  memberId: 1,  // AETERNO
  vote: "yes",
  weight: 2,
  reasoning: "Alinhado com objetivos estratégicos",
});
```

**Exemplo - Distribuir Receitas:**
```typescript
const distribution = await trpc.finance.distributeRevenue.mutate({
  totalAmount: 1000000,
});
// Resultado:
// - Master Vault: $800,000
// - Tesouraria: $100,000
// - Agentes: $100,000
```

---

## Fluxos Principais

### Fluxo de Investimento

1. **Proposta de Investimento** criada por um membro do conselho
2. **Votação Ponderada** pelos 7 arquitetos
3. **Aprovação** se votos > 50% do poder total
4. **Notificação** ao owner sobre aprovação
5. **Transação** criada e completada
6. **Auditoria** registrada em S3

### Fluxo de Ranking e Sucessão

1. **Métricas de Performance** calculadas automaticamente
2. **Ranking** atualizado baseado em scores
3. **Promoção/Degradação** de startups notificada
4. **Proposta de Sucessão** criada se necessário
5. **Votação** do conselho para confirmar
6. **Auditoria** completa do processo

### Fluxo de Arbitragem

1. **Market Oracle** identifica oportunidade
2. **Oportunidade** criada no sistema
3. **Votação** do conselho para execução
4. **Execução** automática da arbitragem
5. **Lucro** distribuído via 80/10/10
6. **Notificação** ao owner

---

## Segurança e Compliance

### Autenticação

- Manus OAuth para autenticação de usuários
- JWT para sessões
- Cookies seguros com flags httpOnly, secure, sameSite

### Autorização

- `publicProcedure`: Acesso público
- `protectedProcedure`: Requer autenticação
- `adminProcedure`: Requer role admin

### Auditoria

- Todos os eventos críticos registrados
- Hash SHA-256 para integridade
- Cadeia de hashes para rastreabilidade
- Persistência em S3 para compliance
- Verificação automática de integridade

### Dados Sensíveis

- Senhas nunca armazenadas (OAuth)
- Chaves privadas nunca no servidor
- Dados de transações criptografados
- Acesso baseado em roles

---

## Deployment

### Preparação para Production

1. **Variáveis de Ambiente**
   ```
   DATABASE_URL=mysql://user:pass@host/db
   JWT_SECRET=seu_secret_seguro
   VITE_APP_ID=seu_app_id
   OAUTH_SERVER_URL=https://api.manus.im
   ```

2. **Build**
   ```bash
   pnpm build
   ```

3. **Testes**
   ```bash
   pnpm test
   ```

4. **Deploy**
   - Usar Manus Platform UI