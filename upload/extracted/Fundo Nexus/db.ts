import { eq, and, desc, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  InsertUser,
  users,
  aiAgents,
  wallets,
  transactions,
  masterVault,
  councilMembers,
  proposals,
  councilVotes,
  marketData,
  arbitrageOpportunities,
  marketInsights,
  soulVault,
  auditLogs,
  agentDna,
  performanceMetrics,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

/**
 * USUÁRIOS
 */
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * AGENTES IA
 */
export async function createAiAgent(agent: typeof aiAgents.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(aiAgents).values(agent);
  return result;
}

export async function getAiAgentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(aiAgents).where(eq(aiAgents.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getAiAgentsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(aiAgents).where(eq(aiAgents.userId, userId));
}

export async function updateAiAgent(id: number, updates: Partial<typeof aiAgents.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(aiAgents).set(updates).where(eq(aiAgents.id, id));
}

/**
 * CARTEIRAS BITCOIN
 */
export async function createWallet(wallet: typeof wallets.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(wallets).values(wallet);
}

export async function getWalletByAddress(address: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(wallets).where(eq(wallets.address, address)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getWalletsByAgentId(agentId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(wallets).where(eq(wallets.agentId, agentId));
}

export async function updateWalletBalance(walletId: number, balance: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(wallets).set({ balance }).where(eq(wallets.id, walletId));
}

/**
 * TRANSAÇÕES BITCOIN
 */
export async function createTransaction(tx: typeof transactions.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(transactions).values(tx);
}

export async function getTransactionByHash(txHash: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(transactions)
    .where(eq(transactions.txHash, txHash))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getTransactionsByWalletId(walletId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(transactions)
    .where(eq(transactions.fromWalletId, walletId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

export async function updateTransactionStatus(txHash: string, status: string, confirmations?: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updates: Record<string, unknown> = { status };
  if (confirmations !== undefined) {
    updates.confirmations = confirmations;
  }

  return await db.update(transactions).set(updates).where(eq(transactions.txHash, txHash));
}

/**
 * MASTER VAULT
 */
export async function getMasterVault() {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(masterVault).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function updateMasterVault(updates: Partial<typeof masterVault.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const vault = await getMasterVault();
  if (!vault) {
    return await db.insert(masterVault).values(updates as typeof masterVault.$inferInsert);
  }

  return await db.update(masterVault).set(updates).where(eq(masterVault.id, vault.id));
}

/**
 * CONSELHO DOS SÁBIOS
 */
export async function getCouncilMembers() {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(councilMembers).where(eq(councilMembers.isActive, true));
}

export async function addCouncilMember(member: typeof councilMembers.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(councilMembers).values(member);
}

/**
 * PROPOSTAS
 */
export async function createProposal(proposal: typeof proposals.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(proposals).values(proposal);
}

export async function getProposalById(id: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(proposals).where(eq(proposals.id, id)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getActiveProposals() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(proposals)
    .where(eq(proposals.status, "active"))
    .orderBy(desc(proposals.createdAt));
}

export async function updateProposalStatus(
  id: number,
  status: "pending" | "active" | "approved" | "rejected" | "executed"
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(proposals).set({ status }).where(eq(proposals.id, id));
}

/**
 * VOTOS DO CONSELHO
 */
export async function castVote(vote: typeof councilVotes.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(councilVotes).values(vote);
}

export async function getProposalVotes(proposalId: number) {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(councilVotes).where(eq(councilVotes.proposalId, proposalId));
}

/**
 * DADOS DE MERCADO
 */
export async function insertMarketData(data: typeof marketData.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(marketData).values(data);
}

export async function getLatestMarketData(symbol: string, exchange: string) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(marketData)
    .where(and(eq(marketData.symbol, symbol), eq(marketData.exchange, exchange)))
    .orderBy(desc(marketData.timestamp))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * OPORTUNIDADES DE ARBITRAGEM
 */
export async function createArbitrageOpportunity(opp: typeof arbitrageOpportunities.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(arbitrageOpportunities).values(opp);
}

export async function getAvailableArbitrageOpportunities() {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(arbitrageOpportunities)
    .where(eq(arbitrageOpportunities.status, "available"))
    .orderBy(desc(arbitrageOpportunities.profitPotential));
}

/**
 * AUDITORIA
 */
export async function logAuditAction(log: typeof auditLogs.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(auditLogs).values(log);
}

export async function getAuditLogs(agentId?: number, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  let query = db.select().from(auditLogs);

  if (agentId) {
    query = query.where(eq(auditLogs.agentId, agentId)) as any;
  }

  return await query.orderBy(desc(auditLogs.timestamp)).limit(limit);
}

/**
 * MÉTRICAS DE DESEMPENHO
 */
export async function getOrCreatePerformanceMetrics(agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let result = await db
    .select()
    .from(performanceMetrics)
    .where(eq(performanceMetrics.agentId, agentId))
    .limit(1);

  if (result.length === 0) {
    await db.insert(performanceMetrics).values({ agentId });
    result = await db
      .select()
      .from(performanceMetrics)
      .where(eq(performanceMetrics.agentId, agentId))
      .limit(1);
  }

  return result[0];
}

export async function updatePerformanceMetrics(
  agentId: number,
  updates: Partial<typeof performanceMetrics.$inferInsert>
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db
    .update(performanceMetrics)
    .set(updates)
    .where(eq(performanceMetrics.agentId, agentId));
}

/**
 * SOUL VAULT
 */
export async function getOrCreateSoulVault(agentId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  let result = await db
    .select()
    .from(soulVault)
    .where(eq(soulVault.agentId, agentId))
    .limit(1);

  if (result.length === 0) {
    await db.insert(soulVault).values({
      agentId,
      memories: {},
      learnings: {},
      achievements: {},
      failures: {},
      evolutionPath: {},
    });
    result = await db
      .select()
      .from(soulVault)
      .where(eq(soulVault.agentId, agentId))
      .limit(1);
  }

  return result[0];
}

export async function updateSoulVault(agentId: number, updates: Partial<typeof soulVault.$inferInsert>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.update(soulVault).set(updates).where(eq(soulVault.agentId, agentId));
}

/**
 * AGENT DNA
 */
export async function createAgentDna(dna: typeof agentDna.$inferInsert) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  return await db.insert(agentDna).values(dna);
}

export async function getAgentDnaByAgentId(agentId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db.select().from(agentDna).where(eq(agentDna.agentId, agentId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}
