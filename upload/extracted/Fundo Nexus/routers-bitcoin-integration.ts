import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getBitcoinAPI } from "./bitcoin-api-integration";
import { getTransactionMonitor } from "./transaction-monitor";
import { getDb } from "./db";
import { transactions } from "../drizzle/schema";
import { eq, or } from "drizzle-orm";

const bitcoinAPI = getBitcoinAPI();
const transactionMonitor = getTransactionMonitor();

export const bitcoinIntegrationRouter = router({
  /**
   * Busca UTXOs de um endereço
   */
  getUTXOs: protectedProcedure
    .input(z.object({
      address: z.string().min(26).max(62),
    }))
    .query(async ({ input }) => {
      try {
        const utxos = await bitcoinAPI.getUTXOs(input.address);
        return {
          success: true,
          utxos,
          count: utxos.length,
          totalValue: utxos.reduce((sum, u) => sum + u.value, 0),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch UTXOs: ${error}`,
        });
      }
    }),

  /**
   * Busca saldo de um endereço
   */
  getBalance: protectedProcedure
    .input(z.object({
      address: z.string().min(26).max(62),
    }))
    .query(async ({ input }) => {
      try {
        const balance = await bitcoinAPI.getBalance(input.address);
        return {
          success: true,
          balance,
          btc: (balance / 100000000).toFixed(8),
          address: input.address,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch balance: ${error}`,
        });
      }
    }),

  /**
   * Busca informações de uma transação
   */
  getTransaction: protectedProcedure
    .input(z.object({
      txid: z.string().length(64),
    }))
    .query(async ({ input }) => {
      try {
        const tx = await bitcoinAPI.getTransaction(input.txid);
        return {
          success: true,
          transaction: tx,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch transaction: ${error}`,
        });
      }
    }),

  /**
   * Estima taxa de transação
   */
  estimateFee: protectedProcedure.query(async () => {
    try {
      const fees = await bitcoinAPI.estimateFee();
      return {
        success: true,
        fees: {
          fast: fees.fast,
          standard: fees.standard,
          slow: fees.slow,
        },
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to estimate fees: ${error}`,
      });
    }
  }),

  /**
   * Transmite uma transação assinada
   */
  broadcastTransaction: protectedProcedure
    .input(z.object({
      txHex: z.string(),
      walletId: z.number(),
      fromAddress: z.string(),
      toAddress: z.string(),
      amount: z.string(),
      fee: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        // Transmitir transação
        const broadcastResult = await bitcoinAPI.broadcastTransaction(input.txHex);

        if (!broadcastResult.success) {
          throw new Error(broadcastResult.message || "Broadcast failed");
        }

        // Registrar transação no banco de dados
        await db.insert(transactions).values({
          walletId: input.walletId,
          transactionHash: broadcastResult.txid,
          fromAddress: input.fromAddress,
          toAddress: input.toAddress,
          amount: input.amount,
          fee: input.fee,
          status: "pending",
          description: "Transaction broadcasted to Bitcoin network",
        });

        // Iniciar monitoramento
        transactionMonitor.startMonitoring(
          broadcastResult.txid,
          input.fromAddress,
          async (event) => {
            await db
              .update(transactions)
              .set({ status: event.status })
              .where(eq(transactions.transactionHash, event.txid));
          }
        );

        return {
          success: true,
          txid: broadcastResult.txid,
          message: broadcastResult.message,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to broadcast transaction: ${error}`,
        });
      }
    }),

  /**
   * Inicia monitoramento de uma transação
   */
  startMonitoring: protectedProcedure
    .input(z.object({
      txid: z.string().length(64),
      address: z.string(),
    }))
    .mutation(async ({ input }) => {
      try {
        transactionMonitor.startMonitoring(
          input.txid,
          input.address,
          async (event) => {
            console.log(`[Monitoring] Transaction ${event.txid} status: ${event.status}`);
          }
        );

        return {
          success: true,
          message: "Monitoring started",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to start monitoring: ${error}`,
        });
      }
    }),

  /**
   * Para monitoramento de uma transação
   */
  stopMonitoring: protectedProcedure
    .input(z.object({
      txid: z.string().length(64),
    }))
    .mutation(async ({ input }) => {
      try {
        transactionMonitor.stopMonitoring(input.txid);
        return {
          success: true,
          message: "Monitoring stopped",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to stop monitoring: ${error}`,
        });
      }
    }),

  /**
   * Obtém status de monitoramento de uma transação
   */
  getMonitoringStatus: protectedProcedure
    .input(z.object({
      txid: z.string().length(64),
    }))
    .query(async ({ input }) => {
      try {
        const status = transactionMonitor.getStatus(input.txid);
        if (!status) {
          return {
            success: false,
            message: "Transaction not being monitored",
          };
        }

        return {
          success: true,
          status: {
            txid: status.txid,
            address: status.address,
            status: status.status,
            confirmations: status.confirmations,
            attempts: status.attempts,
            maxAttempts: status.maxAttempts,
            startTime: status.startTime,
            lastCheck: status.lastCheck,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to get monitoring status: ${error}`,
        });
      }
    }),

  /**
   * Lista transações sendo monitoradas
   */
  listMonitored: protectedProcedure.query(async () => {
    try {
      const monitored = transactionMonitor.listMonitored();
      return {
        success: true,
        transactions: monitored.map((m) => ({
          txid: m.txid,
          address: m.address,
          status: m.status,
          confirmations: m.confirmations,
          attempts: m.attempts,
          maxAttempts: m.maxAttempts,
        })),
        count: monitored.length,
      };
    } catch (error) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: `Failed to list monitored transactions: ${error}`,
      });
    }
  }),

  /**
   * Busca histórico de transações de um endereço
   */
  getTransactionHistory: protectedProcedure
    .input(z.object({
      address: z.string().min(26).max(62),
      limit: z.number().min(1).max(100).default(50),
    }))
    .query(async ({ input }) => {
      try {
        const db = await getDb();
        if (!db) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database not available",
          });
        }

        const history = await db
          .select()
          .from(transactions)
          .where(
            or(
              eq(transactions.fromAddress, input.address),
              eq(transactions.toAddress, input.address)
            )
          )
          .limit(input.limit);

        return {
          success: true,
          transactions: history,
          count: history.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch transaction history: ${error}`,
        });
      }
    }),
});
