import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  generateHDWallet,
  generateAddress,
  validateAddress,
  buildAndSignTransaction,
  broadcastTransaction,
  getUTXOs,
  getBalance,
  estimateFee,
  decryptPrivateKey,
} from "./bitcoin-signer";
import { getDb, getWalletById, getAddressByAddress } from "./db";
import { transactions } from "../drizzle/schema";

export const transactionSignerRouter = router({
  // Gerar nova carteira HD
  generateWallet: protectedProcedure
    .input(z.object({
      mnemonic: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      try {
        const wallet = generateHDWallet(input.mnemonic);
        return {
          success: true,
          wallet: {
            mnemonic: wallet.mnemonic,
            address: wallet.address,
            publicKey: wallet.publicKey,
            xpub: wallet.xpub,
          },
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to generate wallet: ${error}`,
        });
      }
    }),

  // Gerar endereço a partir de chave pública
  generateAddress: protectedProcedure
    .input(z.object({
      publicKey: z.string(),
      addressType: z.enum(["P2PKH", "P2SH", "SegWit"]).default("SegWit"),
    }))
    .query(async ({ input }) => {
      try {
        const address = generateAddress(input.publicKey, input.addressType);
        return {
          success: true,
          address,
          addressType: input.addressType,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INVALID_INPUT",
          message: `Failed to generate address: ${error}`,
        });
      }
    }),

  // Validar endereço Bitcoin
  validateAddress: protectedProcedure
    .input(z.object({
      address: z.string(),
    }))
    .query(async ({ input }) => {
      const isValid = validateAddress(input.address);
      return {
        success: true,
        isValid,
        address: input.address,
      };
    }),

  // Obter UTXOs de um endereço
  getUTXOs: protectedProcedure
    .input(z.object({
      address: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        if (!validateAddress(input.address)) {
          throw new TRPCError({
            code: "INVALID_INPUT",
            message: "Invalid Bitcoin address",
          });
        }

        const utxos = await getUTXOs(input.address);
        return {
          success: true,
          utxos,
          count: utxos.length,
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch UTXOs: ${error}`,
        });
      }
    }),

  // Obter saldo de um endereço
  getBalance: protectedProcedure
    .input(z.object({
      address: z.string(),
    }))
    .query(async ({ input }) => {
      try {
        if (!validateAddress(input.address)) {
          throw new TRPCError({
            code: "INVALID_INPUT",
            message: "Invalid Bitcoin address",
          });
        }

        const balance = await getBalance(input.address);
        return {
          success: true,
          balance,
          address: input.address,
          btc: (balance / 100000000).toFixed(8),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to fetch balance: ${error}`,
        });
      }
    }),

  // Estimar taxa de transação
  estimateFee: protectedProcedure
    .input(z.object({
      bytes: z.number().min(1),
    }))
    .query(async ({ input }) => {
      try {
        const fee = await estimateFee(input.bytes);
        return {
          success: true,
          fee,
          bytes: input.bytes,
          btc: (fee / 100000000).toFixed(8),
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to estimate fee: ${error}`,
        });
      }
    }),

  // Construir e assinar transação
  signTransaction: protectedProcedure
    .input(z.object({
      walletId: z.number(),
      utxos: z.array(
        z.object({
          txid: z.string(),
          vout: z.number(),
          value: z.number(),
          address: z.string(),
        })
      ),
      outputs: z.array(
        z.object({
          address: z.string(),
          value: z.number(),
        })
      ),
      changeAddress: z.string(),
      fee: z.number(),
      password: z.string(),
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

        // Validar carteira
        const wallet = await getWalletById(input.walletId);
        if (!wallet) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Wallet not found",
          });
        }

        // Validar endereços
        for (const output of input.outputs) {
          if (!validateAddress(output.address)) {
            throw new TRPCError({
              code: "INVALID_INPUT",
              message: `Invalid destination address: ${output.address}`,
            });
          }
        }

        if (!validateAddress(input.changeAddress)) {
          throw new TRPCError({
            code: "INVALID_INPUT",
            message: "Invalid change address",
          });
        }

        // Montar mapa de chaves privadas
        const privateKeys = new Map<string, string>();

        for (const utxo of input.utxos) {
          const address = await getAddressByAddress(utxo.address);
          if (!address || !address.privateKeyEncrypted) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message: `No private key for address: ${utxo.address}`,
            });
          }

          try {
            const decrypted = decryptPrivateKey(
              address.privateKeyEncrypted,
              input.password
            );
            privateKeys.set(utxo.address, decrypted);
          } catch (error) {
            throw new TRPCError({
              code: "UNAUTHORIZED",
              message: "Invalid password",
            });
          }
        }

        // Construir e assinar transação
        const signedTx = await buildAndSignTransaction({
          utxos: input.utxos,
          outputs: input.outputs,
          fee: input.fee,
          changeAddress: input.changeAddress,
          privateKeys,
        });

        // Registrar transação no banco de dados
        await db.insert(transactions).values({
          walletId: input.walletId,
          transactionHash: signedTx.txid,
          fromAddress: input.utxos[0].address,
          toAddress: input.outputs[0].address,
          amount: input.outputs.reduce((sum, o) => sum + o.value, 0).toString(),
          fee: input.fee.toString(),
          status: "pending",
          description: "Signed transaction ready for broadcast",
        });

        return {
          success: true,
          txid: signedTx.txid,
          hex: signedTx.hex,
          size: signedTx.size,
          fee: input.fee,
        };
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to sign transaction: ${error}`,
        });
      }
    }),

  // Transmitir transação assinada
  broadcastTransaction: protectedProcedure
    .input(z.object({
      txHex: z.string(),
      walletId: z.number(),
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

        // Transmitir para a rede
        const txid = await broadcastTransaction(input.txHex);

        // Atualizar status da transação
        await db
          .update(transactions)
          .set({ status: "confirmed" })
          .where((t) => t.transactionHash === txid);

        return {
          success: true,
          txid,
          message: "Transaction broadcasted successfully",
        };
      } catch (error) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: `Failed to broadcast transaction: ${error}`,
        });
      }
    }),
});
