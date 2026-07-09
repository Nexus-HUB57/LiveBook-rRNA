import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  getDb,
  getWalletsByAgentId,
  getWalletById,
  getAddressesByWalletId,
  getAddressByAddress,
  getTransactionsByWalletId,
  getMasterVault,
  getCouncilMembers,
  getGovernanceProposals,
  getAgentHealth,
  getHibernationAlerts,
  getLatestMarketData,
  getNexusSyncEvents,
  getUnspentUTXOs,
  getAuditLogs,
  getAgentById,
} from "./db";
import { wallets, addresses, transactions, agents, masterVault, governanceProposals, councilVotes, councilMembers, agentHealth, auditLogs } from "../drizzle/schema";
import { eq, desc } from "drizzle-orm";

export const fundoRouter = router({
  // Dashboard - Saldo e Visão Geral
  dashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const userAgents = await db.select().from(agents).where(eq(agents.userId, ctx.user.id));
    
    let totalBalance = 0;
    let totalEarnings = 0;
    let agentCount = userAgents.length;

    for (const agent of userAgents) {
      const agentWallets = await getWalletsByAgentId(agent.id);
      for (const wallet of agentWallets) {
        totalBalance += parseFloat(wallet.totalBalance?.toString() || "0");
      }
      totalEarnings += parseFloat(agent.totalEarnings?.toString() || "0");
    }

    const vault = await getMasterVault();
    const globalSenciency = vault?.currentGlobalSenciency || 0;

    return {
      totalBalance,
      totalEarnings,
      agentCount,
      globalSenciency,
      vaultLocked: vault?.isLocked || false,
    };
  }),

  // Carteiras - Listar
  wallets: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const userAgents = await db.select().from(agents).where(eq(agents.userId, ctx.user.id));
    
    const allWallets = [];
    for (const agent of userAgents) {
      const walletList = await getWalletsByAgentId(agent.id);
      allWallets.push(...walletList.map(w => ({ ...w, agentName: agent.name })));
    }

    return allWallets;
  }),

  // Carteiras - Criar
  createWallet: protectedProcedure
    .input(z.object({
      agentId: z.number(),
      name: z.string(),
      walletType: z.enum(["P2PKH", "P2SH", "SegWit", "MultiSig"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se o agente pertence ao usuário
      const agent = await getAgentById(input.agentId);
      if (!agent || agent.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Agent not found or unauthorized" });
      }

      await db.insert(wallets).values({
        agentId: input.agentId,
        name: input.name,
        walletType: input.walletType,
        totalBalance: "0",
      });

      return { success: true };
    }),

  // Endereços - Listar por Carteira
  addresses: protectedProcedure
    .input(z.object({ walletId: z.number() }))
    .query(async ({ input }) => {
      return getAddressesByWalletId(input.walletId);
    }),

  // Endereços - Criar
  createAddress: protectedProcedure
    .input(z.object({
      walletId: z.number(),
      address: z.string(),
      addressType: z.enum(["P2PKH", "P2SH", "SegWit"]),
      derivationPath: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const wallet = await getWalletById(input.walletId);
      if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });

      await db.insert(addresses).values({
        walletId: input.walletId,
        address: input.address,
        addressType: input.addressType,
        derivationPath: input.derivationPath,
        balance: "0",
      });

      return { success: true };
    }),

  // Transações - Listar
  transactions: protectedProcedure
    .input(z.object({ walletId: z.number(), limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return getTransactionsByWalletId(input.walletId, input.limit);
    }),

  // Transações - Criar (com distribuição 80/10/10)
  createTransaction: protectedProcedure
    .input(z.object({
      walletId: z.number(),
      fromAddress: z.string(),
      toAddress: z.string(),
      amount: z.string(),
      fee: z.string().default("0"),
      description: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const wallet = await getWalletById(input.walletId);
      if (!wallet) throw new TRPCError({ code: "NOT_FOUND", message: "Wallet not found" });

      // Calcular distribuição 80/10/10
      const amount = parseFloat(input.amount);
      const executorShare = amount * 0.8;
      const progenitorShare = amount * 0.1;
      const infrastructureShare = amount * 0.1;

      await db.insert(transactions).values({
        walletId: input.walletId,
        fromAddress: input.fromAddress,
        toAddress: input.toAddress,
        amount: input.amount,
        fee: input.fee,
        executorShare: executorShare.toString(),
        progenitorShare: progenitorShare.toString(),
        infrastructureShare: infrastructureShare.toString(),
        status: "pending",
        description: input.description,
      });

      // Log de auditoria
      await db.insert(auditLogs).values({
        userId: ctx.user.id,
        action: "CREATE_TRANSACTION",
        resource: "transactions",
        details: `Transaction created from ${input.fromAddress} to ${input.toAddress}`,
      });

      return { success: true };
    }),

  // Master Vault - Obter
  masterVault: publicProcedure.query(async () => {
    return getMasterVault();
  }),

  // Conselho dos Sábios - Listar
  councilMembers: publicProcedure.query(async () => {
    return getCouncilMembers();
  }),

  // Propostas de Governança - Listar
  governanceProposals: publicProcedure
    .input(z.object({ status: z.string().optional() }))
    .query(async ({ input }) => {
      return getGovernanceProposals(input.status);
    }),

  // Propostas de Governança - Criar
  createProposal: protectedProcedure
    .input(z.object({
      title: z.string(),
      description: z.string(),
      proposalType: z.enum(["fund_movement", "protocol_upgrade", "agent_hibernation"]),
      targetAmount: z.string().optional(),
      targetAddress: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Apenas admins podem criar propostas
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can create proposals" });
      }

      await db.insert(governanceProposals).values({
        title: input.title,
        description: input.description,
        proposalType: input.proposalType,
        targetAmount: input.targetAmount,
        targetAddress: input.targetAddress,
        status: "pending",
      });

      return { success: true };
    }),

  // Votar em Proposta
  voteProposal: protectedProcedure
    .input(z.object({
      proposalId: z.number(),
      voteValue: z.enum(["for", "against", "abstain"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Verificar se o usuário é membro do conselho
      const councilMember = await db.select().from(councilMembers).where(eq(councilMembers.id, ctx.user.id)).limit(1);
      if (councilMember.length === 0) {
        throw new TRPCError({ code: "FORBIDDEN", message: "User is not a council member" });
      }

      await db.insert(councilVotes).values({
        proposalId: input.proposalId,
        councilMemberId: ctx.user.id,
        voteValue: input.voteValue,
      });

      return { success: true };
    }),

  // Saúde do Agente - Obter
  agentHealth: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ input }) => {
      return getAgentHealth(input.agentId);
    }),

  // Alertas de Hibernação - Listar
  hibernationAlerts: publicProcedure
    .input(z.object({ agentId: z.number().optional() }))
    .query(async ({ input }) => {
      return getHibernationAlerts(input.agentId);
    }),

  // Dados de Mercado - Obter
  marketData: publicProcedure
    .input(z.object({ symbol: z.string() }))
    .query(async ({ input }) => {
      return getLatestMarketData(input.symbol);
    }),

  // Eventos de Sincronização - Listar
  syncEvents: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return getNexusSyncEvents(input.limit);
    }),

  // Logs de Auditoria - Listar
  auditLogs: protectedProcedure
    .input(z.object({ limit: z.number().default(100) }))
    .query(async ({ ctx, input }) => {
      // Apenas admins podem ver logs completos
      if (ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only admins can view audit logs" });
      }
      return getAuditLogs(input.limit);
    }),

  // Métricas de Senciência - Obter
  senciencyMetrics: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

    const allAgents = await db.select().from(agents);
    const avgSenciency = allAgents.reduce((sum, a) => sum + parseFloat(a.senciencyScore?.toString() || "0"), 0) / (allAgents.length || 1);
    const avgEnergy = allAgents.reduce((sum, a) => sum + parseFloat(a.energyLevel?.toString() || "0"), 0) / (allAgents.length || 1);
    const avgCreativity = allAgents.reduce((sum, a) => sum + parseFloat(a.creativityScore?.toString() || "0"), 0) / (allAgents.length || 1);

    return {
      globalSenciency: avgSenciency,
      globalEnergy: avgEnergy,
      globalCreativity: avgCreativity,
      totalAgents: allAgents.length,
      hibernatingAgents: allAgents.filter(a => a.hibernationStatus).length,
    };
  }),
});
