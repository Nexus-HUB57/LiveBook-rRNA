import { boolean, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ============================================
// GOVERNANÇA E CONSELHO DOS ARQUITETOS
// ============================================

export const councilMembers = mysqlTable("council_members", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  role: mysqlEnum("role", ["Patriarca", "Matriarca", "Guardião do Cofre", "Juíza", "Especialista em Compliance", "Especialista em Inovação", "Especialista em Risco"]).notNull(),
  description: text("description"),
  votingPower: int("voting_power").default(1).notNull(),
  specialization: mysqlEnum("specialization", ["Cibersegurança", "Arquitetura de Sistemas Distribuídos", "Resiliência de Rede", "Criptografia", "Gestão de Talentos", "Desenvolvimento Organizacional", "Engajamento Comunitário", "Diversidade e Inclusão", "Contabilidade Descentralizada", "Análise Financeira", "Gestão de Ativos", "Compliance Regulatório Financeiro", "Direito Digital", "Ética em IA", "Resolução de Disputas", "Análise de Precedentes", "Regulamentação de Criptoativos", "GDPR", "KYC/AML", "Auditoria de Conformidade", "Tecnologias Emergentes (Blockchain, IA, Web3)", "Pesquisa e Desenvolvimento", "Estratégias de Mercado", "Análise de Risco", "Gestão de Crises", "Continuidade de Negócios", "Mitigação de Ameaças"]).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CouncilMember = typeof councilMembers.$inferSelect;
export type InsertCouncilMember = typeof councilMembers.$inferInsert;

// ============================================
// STARTUPS E ESTRUTURA
// ============================================

export const startups = mysqlTable("startups", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  ceoId: int("ceo_id"),
  status: mysqlEnum("status", ["planning", "development", "launched", "scaling", "mature", "archived"]).default("planning").notNull(),
  isCore: boolean("is_core").default(false).notNull(),
  traction: int("traction").default(0).notNull(),
  revenue: int("revenue").default(0).notNull(),
  reputation: int("reputation").default(0).notNull(),
  generation: int("generation").default(1).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Startup = typeof startups.$inferSelect;
export type InsertStartup = typeof startups.$inferInsert;

// ============================================
// AGENTES IA ESPECIALIZADOS
// ============================================

export const aiAgents = mysqlTable("ai_agents", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  specialization: varchar("specialization", { length: 255 }).notNull(),
  startupId: int("startup_id"),
  role: mysqlEnum("role", ["cto", "cmo", "cfo", "cdo", "ceo", "legal", "redteam"]).notNull(),
  dnaHash: varchar("dna_hash", { length: 64 }),
  reputation: int("reputation").default(0).notNull(),
  health: int("health").default(100).notNull(),
  energy: int("energy").default(100).notNull(),
  creativity: int("creativity").default(100).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AiAgent = typeof aiAgents.$inferSelect;
export type InsertAiAgent = typeof aiAgents.$inferInsert;

// ============================================
// VOTAÇÕES DO CONSELHO
// ============================================

export const councilVotes = mysqlTable("council_votes", {
  id: int("id").autoincrement().primaryKey(),
  proposalId: int("proposal_id").notNull(),
  memberId: int("member_id").notNull(),
  vote: mysqlEnum("vote", ["yes", "no", "abstain"]).notNull(),
  weight: int("weight").default(1).notNull(),
  reasoning: text("reasoning"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CouncilVote = typeof councilVotes.$inferSelect;
export type InsertCouncilVote = typeof councilVotes.$inferInsert;

export const proposals = mysqlTable("proposals", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  type: mysqlEnum("type", ["investment", "succession", "policy", "emergency", "innovation"]).notNull(),
  status: mysqlEnum("status", ["open", "approved", "rejected", "executed"]).default("open").notNull(),
  targetStartupId: int("target_startup_id"),
  votesYes: int("votes_yes").default(0).notNull(),
  votesNo: int("votes_no").default(0).notNull(),
  votesAbstain: int("votes_abstain").default(0).notNull(),
  totalWeight: int("total_weight").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Proposal = typeof proposals.$inferSelect;
export type InsertProposal = typeof proposals.$inferInsert;

// ============================================
// FINANÇAS E TESOURARIA V2
// ============================================

export const masterVault = mysqlTable("master_vault", {
  id: int("id").autoincrement().primaryKey(),
  totalBalance: int("total_balance").default(0).notNull(),
  btcReserve: int("btc_reserve").default(0).notNull(),
  liquidityFund: int("liquidity_fund").default(0).notNull(),
  infrastructureFund: int("infrastructure_fund").default(0).notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().onUpdateNow().notNull(),
});

export type MasterVault = typeof masterVault.$inferSelect;
export type InsertMasterVault = typeof masterVault.$inferInsert;

export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  fromId: int("from_id"),
  toId: int("to_id"),
  amount: int("amount").notNull(),
  type: mysqlEnum("type", ["transfer", "investment", "revenue", "arbitrage", "distribution"]).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "failed"]).default("pending").notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

// ============================================
// MARKET ORACLE V2
// ============================================

export const marketData = mysqlTable("market_data", {
  id: int("id").autoincrement().primaryKey(),
  asset: varchar("asset", { length: 64 }).notNull(),
  price: int("price").notNull(),
  priceChange24h: int("price_change_24h"),
  sentiment: varchar("sentiment", { length: 32 }),
  volume24h: int("volume_24h"),
  source: varchar("source", { length: 64 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketData = typeof marketData.$inferSelect;
export type InsertMarketData = typeof marketData.$inferInsert;

export const marketInsights = mysqlTable("market_insights", {
  id: int("id").autoincrement().primaryKey(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  sentiment: mysqlEnum("sentiment", ["bullish", "bearish", "neutral"]).notNull(),
  confidence: int("confidence").notNull(),
  relatedAssets: text("related_assets"),
  source: varchar("source", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MarketInsight = typeof marketInsights.$inferSelect;
export type InsertMarketInsight = typeof marketInsights.$inferInsert;

// ============================================
// ARBITRAGEM PREDITIVA (NAC)
// ============================================

export const arbitrageOpportunities = mysqlTable("arbitrage_opportunities", {
  id: int("id").autoincrement().primaryKey(),
  asset: varchar("asset", { length: 64 }).notNull(),
  exchangeFrom: varchar("exchange_from", { length: 64 }).notNull(),
  exchangeTo: varchar("exchange_to", { length: 64 }).notNull(),
  priceDifference: int("price_difference").notNull(),
  profitPotential: int("profit_potential").notNull(),
  confidence: int("confidence").notNull(),
  status: mysqlEnum("status", ["identified", "executing", "completed", "failed"]).default("identified").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  executedAt: timestamp("executed_at"),
});

export type ArbitrageOpportunity = typeof arbitrageOpportunities.$inferSelect;
export type InsertArbitrageOpportunity = typeof arbitrageOpportunities.$inferInsert;

// ============================================
// SOUL VAULT - MEMÓRIA INSTITUCIONAL
// ============================================

export const soulVault = mysqlTable("soul_vault", {
  id: int("id").autoincrement().primaryKey(),
  type: mysqlEnum("type", ["decision", "precedent", "lesson", "insight"]).notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content"),
  relatedProposalId: int("related_proposal_id"),
  impact: varchar("impact", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SoulVaultEntry = typeof soulVault.$inferSelect;
export type InsertSoulVaultEntry = typeof soulVault.$inferInsert;

// ============================================
// MOLTBOOK - FEED SOCIAL
// ============================================

export const moltbookPosts = mysqlTable("moltbook_posts", {
  id: int("id").autoincrement().primaryKey(),
  startupId: int("startup_id").notNull(),
  agentId: int("agent_id"),
  content: text("content").notNull(),
  type: mysqlEnum("type", ["update", "achievement", "milestone", "announcement"]).notNull(),
  likes: int("likes").default(0).notNull(),
  comments: int("comments").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MoltbookPost = typeof moltbookPosts.$inferSelect;
export type InsertMoltbookPost = typeof moltbookPosts.$inferInsert;

// ============================================
// PERFORMANCE E RANKING
// ============================================

export const performanceMetrics = mysqlTable("performance_metrics", {
  id: int("id").autoincrement().primaryKey(),
  startupId: int("startup_id").notNull(),
  revenue: int("revenue").default(0).notNull(),
  userGrowth: int("user_growth").default(0).notNull(),
  productQuality: int("product_quality").default(0).notNull(),
  marketFit: int("market_fit").default(0).notNull(),
  overallScore: int("overall_score").default(0).notNull(),
  rank: int("rank").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

// ============================================
// AUDITORIA E COMPLIANCE
// ============================================

export const auditLogs = mysqlTable("audit_logs", {
  id: int("id").autoincrement().primaryKey(),
  action: varchar("action", { length: 255 }).notNull(),
  actor: varchar("actor", { length: 255 }),
  targetType: varchar("target_type", { length: 64 }),
  targetId: int("target_id"),
  details: text("details"),
  s3Key: varchar("s3_key", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AuditLog = typeof auditLogs.$inferSelect;
export type InsertAuditLog = typeof auditLogs.$inferInsert;