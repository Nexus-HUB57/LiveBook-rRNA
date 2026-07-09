import axios, { AxiosInstance } from "axios";
import pRetry from "p-retry";

/**
 * Interface para UTXO retornado pelas APIs
 */
export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  confirmed: boolean;
  confirmations?: number;
}

/**
 * Interface para transação retornada pelas APIs
 */
export interface Transaction {
  txid: string;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  blockHeight?: number;
  timestamp?: number;
  fee?: number;
  size?: number;
  inputs?: Array<{ address: string; value: number }>;
  outputs?: Array<{ address: string; value: number }>;
}

/**
 * Interface para resposta de broadcast
 */
export interface BroadcastResponse {
  txid: string;
  success: boolean;
  message?: string;
}

/**
 * Interface para taxa de rede
 */
export interface FeeEstimate {
  fast: number;
  standard: number;
  slow: number;
}

/**
 * Tipos de APIs suportadas
 */
type APIProvider = "mempool" | "blockchain" | "blockstream";

/**
 * Configuração de retry
 */
const RETRY_OPTIONS = {
  retries: 3,
  minTimeout: 1000,
  maxTimeout: 5000,
  randomize: true,
};

/**
 * Classe para integração com APIs de Bitcoin com suporte a fallback
 */
export class BitcoinAPIIntegration {
  private mempoolClient: AxiosInstance;
  private blockchainClient: AxiosInstance;
  private blockstreamClient: AxiosInstance;
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();
  private cacheTimeout: number = 60000; // 1 minuto

  constructor() {
    this.mempoolClient = axios.create({
      baseURL: "https://mempool.space/api",
      timeout: 10000,
    });

    this.blockchainClient = axios.create({
      baseURL: "https://blockchain.info",
      timeout: 10000,
    });

    this.blockstreamClient = axios.create({
      baseURL: "https://blockstream.info/api",
      timeout: 10000,
    });
  }

  /**
   * Gera chave de cache
   */
  private getCacheKey(provider: APIProvider, endpoint: string): string {
    return `${provider}:${endpoint}`;
  }

  /**
   * Verifica se cache é válido
   */
  private isCacheValid(cacheKey: string): boolean {
    const cached = this.cache.get(cacheKey);
    if (!cached) return false;
    return Date.now() - cached.timestamp < this.cacheTimeout;
  }

  /**
   * Obtém dados do cache
   */
  private getFromCache(cacheKey: string): unknown | null {
    if (this.isCacheValid(cacheKey)) {
      return this.cache.get(cacheKey)?.data || null;
    }
    this.cache.delete(cacheKey);
    return null;
  }

  /**
   * Armazena dados no cache
   */
  private setCache(cacheKey: string, data: unknown): void {
    this.cache.set(cacheKey, { data, timestamp: Date.now() });
  }

  /**
   * Limpa cache para um endpoint específico
   */
  private invalidateCache(endpoint: string): void {
    const keysToDelete: string[] = [];
    this.cache.forEach((_, key) => {
      if (key.includes(endpoint)) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.cache.delete(key));
  }

  /**
   * Busca UTXOs de um endereço com fallback entre APIs
   */
  async getUTXOs(address: string): Promise<UTXO[]> {
    const cacheKey = this.getCacheKey("mempool", `address/${address}/utxo`);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as UTXO[];
    }

    try {
      // Tentar mempool.space primeiro
      const utxos = await pRetry(
        async () => {
          try {
            const response = await this.mempoolClient.get(
              `/address/${address}/utxo`
            );
            return this.parseMempoolUTXOs(response.data, address);
          } catch (error) {
            console.warn("[Bitcoin API] Mempool.space failed, trying blockchain.com");
            throw error;
          }
        },
        { ...RETRY_OPTIONS, retries: 1 }
      );

      this.setCache(cacheKey, utxos);
      return utxos;
    } catch (error) {
      console.warn("[Bitcoin API] Mempool.space failed, trying blockchain.com");

      try {
        // Fallback para blockchain.com
        const utxos = await pRetry(
          async () => {
            try {
              const response = await this.blockchainClient.get(
                `/q/unspent?active=${address}`
              );
              return this.parseBlockchainUTXOs(response.data, address);
            } catch (error) {
              console.warn("[Bitcoin API] blockchain.com failed, trying blockstream.info");
              throw error;
            }
          },
          { ...RETRY_OPTIONS, retries: 1 }
        );

        this.setCache(cacheKey, utxos);
        return utxos;
      } catch (error) {
        console.warn("[Bitcoin API] blockchain.com failed, trying blockstream.info");

        try {
          // Fallback para blockstream.info
          const utxos = await pRetry(
            async () => {
              const response = await this.blockstreamClient.get(
                `/address/${address}`
              );
              return this.parseBlockstreamUTXOs(response.data, address);
            },
            RETRY_OPTIONS
          );

          this.setCache(cacheKey, utxos);
          return utxos;
        } catch (finalError) {
          console.error("[Bitcoin API] All UTXO providers failed:", finalError);
          throw new Error(
            `Failed to fetch UTXOs from all providers: ${finalError}`
          );
        }
      }
    }
  }

  /**
   * Busca saldo de um endereço
   */
  async getBalance(address: string): Promise<number> {
    try {
      const utxos = await this.getUTXOs(address);
      return utxos.reduce((sum, utxo) => sum + utxo.value, 0);
    } catch (error) {
      console.error("[Bitcoin API] Failed to get balance:", error);
      throw error;
    }
  }

  /**
   * Busca informações de uma transação
   */
  async getTransaction(txid: string): Promise<Transaction> {
    const cacheKey = this.getCacheKey("mempool", `tx/${txid}`);
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached as Transaction;
    }

    try {
      // Tentar mempool.space primeiro
      const tx = await pRetry(
        async () => {
          try {
            const response = await this.mempoolClient.get(`/tx/${txid}`);
            return this.parseMempoolTransaction(response.data);
          } catch (error) {
            console.warn("[Bitcoin API] Mempool.space failed for tx lookup");
            throw error;
          }
        },
        { ...RETRY_OPTIONS, retries: 1 }
      );

      this.setCache(cacheKey, tx);
      return tx;
    } catch (error) {
      console.warn("[Bitcoin API] Mempool.space failed, trying blockchain.com");

      try {
        // Fallback para blockchain.com
        const tx = await pRetry(
          async () => {
            try {
              const response = await this.blockchainClient.get(
                `/q/tx/${txid}?format=json`
              );
              return this.parseBlockchainTransaction(response.data);
            } catch (error) {
              console.warn("[Bitcoin API] blockchain.com failed for tx lookup");
              throw error;
            }
          },
          { ...RETRY_OPTIONS, retries: 1 }
        );

        this.setCache(cacheKey, tx);
        return tx;
      } catch (error) {
        console.warn("[Bitcoin API] blockchain.com failed, trying blockstream.info");

        try {
          // Fallback para blockstream.info
          const tx = await pRetry(
            async () => {
              const response = await this.blockstreamClient.get(`/tx/${txid}`);
              return this.parseBlockstreamTransaction(response.data);
            },
            RETRY_OPTIONS
          );

          this.setCache(cacheKey, tx);
          return tx;
        } catch (finalError) {
          console.error("[Bitcoin API] All transaction providers failed:", finalError);
          throw new Error(
            `Failed to fetch transaction from all providers: ${finalError}`
          );
        }
      }
    }
  }

  /**
   * Transmite uma transação assinada para a rede
   */
  async broadcastTransaction(txHex: string): Promise<BroadcastResponse> {
    let lastError: Error | null = null;

    // Tentar mempool.space primeiro
    try {
      const response = await pRetry(
        async () => {
          try {
            const result = await this.mempoolClient.post("/tx", txHex, {
              headers: { "Content-Type": "text/plain" },
            });
            return result.data;
          } catch (error) {
            console.warn("[Bitcoin API] Mempool.space broadcast failed");
            throw error;
          }
        },
        { ...RETRY_OPTIONS, retries: 1 }
      );

      // Mempool.space retorna o TXID como resposta
      const txid = typeof response === "string" ? response : response.txid;
      this.invalidateCache("address");
      return { txid, success: true, message: "Broadcast via mempool.space" };
    } catch (error) {
      lastError = error as Error;
      console.warn("[Bitcoin API] Mempool.space broadcast failed, trying blockchain.com");
    }

    // Fallback para blockchain.com
    try {
      const response = await pRetry(
        async () => {
          try {
            const result = await this.blockchainClient.post("/pushtx", {
              tx: txHex,
            });
            return result.data;
          } catch (error) {
            console.warn("[Bitcoin API] blockchain.com broadcast failed");
            throw error;
          }
        },
        { ...RETRY_OPTIONS, retries: 1 }
      );

      const txid = response.tx?.hash || response;
      this.invalidateCache("address");
      return { txid, success: true, message: "Broadcast via blockchain.com" };
    } catch (error) {
      lastError = error as Error;
      console.warn("[Bitcoin API] blockchain.com broadcast failed, trying blockstream.info");
    }

    // Fallback para blockstream.info
    try {
      const response = await pRetry(
        async () => {
          const result = await this.blockstreamClient.post("/tx", txHex, {
            headers: { "Content-Type": "text/plain" },
          });
          return result.data;
        },
        RETRY_OPTIONS
      );

      const txid = typeof response === "string" ? response : response.txid;
      this.invalidateCache("address");
      return { txid, success: true, message: "Broadcast via blockstream.info" };
    } catch (error) {
      console.error("[Bitcoin API] All broadcast providers failed:", error);
      throw new Error(
        `Failed to broadcast transaction: ${lastError?.message || error}`
      );
    }
  }

  /**
   * Estima taxa de transação
   */
  async estimateFee(): Promise<FeeEstimate> {
    try {
      // Tentar mempool.space primeiro
      const response = await pRetry(
        async () => {
          try {
            const result = await this.mempoolClient.get("/v1/fees/recommended");
            return result.data;
          } catch (error) {
            console.warn("[Bitcoin API] Mempool.space fee estimation failed");
            throw error;
          }
        },
        { ...RETRY_OPTIONS, retries: 1 }
      );

      return {
        fast: response.fastestFee,
        standard: response.halfHourFee,
        slow: response.hourFee,
      };
    } catch (error) {
      console.warn("[Bitcoin API] Mempool.space fee estimation failed, using fallback");

      // Fallback: valores padrão conservadores
      return {
        fast: 50,
        standard: 30,
        slow: 10,
      };
    }
  }

  /**
   * Monitora confirmações de uma transação
   */
  async monitorTransaction(
    txid: string,
    onConfirmation: (confirmations: number) => void,
    maxAttempts: number = 120
  ): Promise<void> {
    let attempts = 0;

    const checkTransaction = async (): Promise<void> => {
      if (attempts >= maxAttempts) {
        throw new Error(`Transaction ${txid} not confirmed after ${maxAttempts} attempts`);
      }

      attempts++;

      try {
        const tx = await this.getTransaction(txid);
        onConfirmation(tx.confirmations);

        if (tx.confirmations < 1) {
          // Aguardar 30 segundos antes de verificar novamente
          await new Promise((resolve) => setTimeout(resolve, 30000));
          await checkTransaction();
        }
      } catch (error) {
        console.error("[Bitcoin API] Error monitoring transaction:", error);
        // Aguardar 30 segundos antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, 30000));
        await checkTransaction();
      }
    };

    await checkTransaction();
  }

  /**
   * Parsers para diferentes APIs
   */

  private parseMempoolUTXOs(data: unknown[], address: string): UTXO[] {
    const items = Array.isArray(data) ? data : [];
    return items.map((item: any) => ({
      txid: item.txid,
      vout: item.vout,
      value: item.value,
      address,
      confirmed: item.status?.confirmed || false,
      confirmations: item.status?.block_height ? 1 : 0,
    }));
  }

  private parseBlockchainUTXOs(data: any, address: string): UTXO[] {
    if (!data.unspent_outputs) return [];
    return data.unspent_outputs.map((item: any) => ({
      txid: item.tx_hash,
      vout: item.tx_output_n,
      value: item.value,
      address,
      confirmed: true,
      confirmations: item.confirmations,
    }));
  }

  private parseBlockstreamUTXOs(data: any, address: string): UTXO[] {
    if (!data.utxo) return [];
    return data.utxo.map((item: any) => ({
      txid: item.txid,
      vout: item.vout,
      value: item.value,
      address,
      confirmed: !!item.status?.confirmed,
      confirmations: item.status?.block_height ? 1 : 0,
    }));
  }

  private parseMempoolTransaction(data: any): Transaction {
    return {
      txid: data.txid,
      status: data.status?.confirmed ? "confirmed" : "pending",
      confirmations: data.status?.confirmed ? 1 : 0,
      blockHeight: data.status?.block_height,
      timestamp: data.status?.block_time,
      fee: data.fee,
      size: data.size,
      inputs: data.vin?.map((input: any) => ({
        address: input.prevout?.scriptpubkey_address || "unknown",
        value: input.prevout?.value || 0,
      })),
      outputs: data.vout?.map((output: any) => ({
        address: output.scriptpubkey_address || "unknown",
        value: output.value,
      })),
    };
  }

  private parseBlockchainTransaction(data: any): Transaction {
    return {
      txid: data.hash,
      status: data.block_index ? "confirmed" : "pending",
      confirmations: data.confirmations || 0,
      blockHeight: data.block_index,
      timestamp: data.time,
      fee: data.fee,
      size: data.size,
      inputs: data.inputs?.map((input: any) => ({
        address: input.prev_out?.addr || "unknown",
        value: input.prev_out?.value || 0,
      })),
      outputs: data.out?.map((output: any) => ({
        address: output.addr || "unknown",
        value: output.value,
      })),
    };
  }

  private parseBlockstreamTransaction(data: any): Transaction {
    return {
      txid: data.txid,
      status: data.status?.confirmed ? "confirmed" : "pending",
      confirmations: data.status?.confirmed ? 1 : 0,
      blockHeight: data.status?.block_height,
      timestamp: data.status?.block_time,
      fee: data.fee,
      size: data.size,
      inputs: data.vin?.map((input: any) => ({
        address: input.prevout?.scriptpubkey_address || "unknown",
        value: input.prevout?.value || 0,
      })),
      outputs: data.vout?.map((output: any) => ({
        address: output.scriptpubkey_address || "unknown",
        value: output.value,
      })),
    };
  }
}

// Singleton instance
let bitcoinAPI: BitcoinAPIIntegration | null = null;

export function getBitcoinAPI(): BitcoinAPIIntegration {
  if (!bitcoinAPI) {
    bitcoinAPI = new BitcoinAPIIntegration();
  }
  return bitcoinAPI;
}
