import { getBitcoinAPI, Transaction } from "./bitcoin-api-integration";

/**
 * Interface para evento de monitoramento
 */
export interface MonitoringEvent {
  txid: string;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  timestamp: number;
  previousStatus?: string;
}

/**
 * Callback para eventos de monitoramento
 */
export type MonitoringCallback = (event: MonitoringEvent) => Promise<void>;

/**
 * Interface para transação monitorada
 */
interface MonitoredTransaction {
  txid: string;
  address: string;
  startTime: number;
  lastCheck: number;
  status: "pending" | "confirmed" | "failed";
  confirmations: number;
  callbacks: MonitoringCallback[];
  maxAttempts: number;
  attempts: number;
}

/**
 * Gerenciador de monitoramento de transações em tempo real
 */
export class TransactionMonitor {
  private monitoredTransactions: Map<string, MonitoredTransaction> = new Map();
  private pollingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private pollingInterval: number = 30000; // 30 segundos
  private maxAttempts: number = 120; // 1 hora com polling de 30s
  private bitcoinAPI = getBitcoinAPI();

  /**
   * Inicia monitoramento de uma transação
   */
  startMonitoring(
    txid: string,
    address: string,
    callback: MonitoringCallback
  ): void {
    const existing = this.monitoredTransactions.get(txid);

    if (existing) {
      // Adicionar callback à transação existente
      existing.callbacks.push(callback);
      return;
    }

    // Criar novo monitoramento
    const monitored: MonitoredTransaction = {
      txid,
      address,
      startTime: Date.now(),
      lastCheck: Date.now(),
      status: "pending",
      confirmations: 0,
      callbacks: [callback],
      maxAttempts: this.maxAttempts,
      attempts: 0,
    };

    this.monitoredTransactions.set(txid, monitored);
    this.startPolling(txid);
  }

  /**
   * Para monitoramento de uma transação
   */
  stopMonitoring(txid: string): void {
    const interval = this.pollingIntervals.get(txid);
    if (interval) {
      clearInterval(interval);
      this.pollingIntervals.delete(txid);
    }
    this.monitoredTransactions.delete(txid);
  }

  /**
   * Inicia polling para uma transação
   */
  private startPolling(txid: string): void {
    // Executar verificação inicial imediatamente
    this.checkTransaction(txid);

    // Configurar polling periódico
    const interval = setInterval(() => {
      this.checkTransaction(txid);
    }, this.pollingInterval);

    this.pollingIntervals.set(txid, interval);
  }

  /**
   * Verifica status de uma transação
   */
  private async checkTransaction(txid: string): Promise<void> {
    const monitored = this.monitoredTransactions.get(txid);
    if (!monitored) return;

    try {
      monitored.attempts++;

      // Verificar se excedeu limite de tentativas
      if (monitored.attempts > monitored.maxAttempts) {
        await this.notifyCallbacks(txid, {
          txid,
          status: "failed",
          confirmations: 0,
          timestamp: Date.now(),
          previousStatus: monitored.status,
        });

        this.stopMonitoring(txid);
        return;
      }

      // Buscar informações da transação
      const tx = await this.bitcoinAPI.getTransaction(txid);
      const previousStatus = monitored.status;

      // Atualizar status
      monitored.status = tx.status;
      monitored.confirmations = tx.confirmations;
      monitored.lastCheck = Date.now();

      // Notificar callbacks se status mudou
      if (previousStatus !== tx.status || tx.confirmations > 0) {
        await this.notifyCallbacks(txid, {
          txid,
          status: tx.status,
          confirmations: tx.confirmations,
          timestamp: Date.now(),
          previousStatus,
        });

        // Se confirmada, parar monitoramento
        if (tx.status === "confirmed" && tx.confirmations >= 1) {
          this.stopMonitoring(txid);
        }
      }
    } catch (error) {
      console.error(`[TransactionMonitor] Error checking transaction ${txid}:`, error);

      // Continuar tentando até atingir limite
      if (monitored.attempts >= monitored.maxAttempts) {
        await this.notifyCallbacks(txid, {
          txid,
          status: "failed",
          confirmations: 0,
          timestamp: Date.now(),
          previousStatus: monitored.status,
        });

        this.stopMonitoring(txid);
      }
    }
  }

  /**
   * Notifica todos os callbacks registrados
   */
  private async notifyCallbacks(
    txid: string,
    event: MonitoringEvent
  ): Promise<void> {
    const monitored = this.monitoredTransactions.get(txid);
    if (!monitored) return;

    const promises = monitored.callbacks.map(async (callback) => {
      try {
        await callback(event);
      } catch (error) {
        console.error(
          `[TransactionMonitor] Error in callback for ${txid}:`,
          error
        );
      }
    });

    await Promise.all(promises);
  }

  /**
   * Obtém status atual de uma transação monitorada
   */
  getStatus(txid: string): MonitoredTransaction | null {
    return this.monitoredTransactions.get(txid) || null;
  }

  /**
   * Lista todas as transações monitoradas
   */
  listMonitored(): MonitoredTransaction[] {
    return Array.from(this.monitoredTransactions.values());
  }

  /**
   * Limpa monitoramento de transações antigas
   */
  cleanup(maxAgeMs: number = 86400000): void {
    // 24 horas por padrão
    const now = Date.now();
    const toDelete: string[] = [];

    this.monitoredTransactions.forEach((monitored, txid) => {
      if (now - monitored.startTime > maxAgeMs) {
        toDelete.push(txid);
      }
    });

    toDelete.forEach((txid) => this.stopMonitoring(txid));
  }

  /**
   * Define intervalo de polling
   */
  setPollingInterval(intervalMs: number): void {
    this.pollingInterval = intervalMs;
  }

  /**
   * Define número máximo de tentativas
   */
  setMaxAttempts(attempts: number): void {
    this.maxAttempts = attempts;
  }
}

// Singleton instance
let transactionMonitor: TransactionMonitor | null = null;

export function getTransactionMonitor(): TransactionMonitor {
  if (!transactionMonitor) {
    transactionMonitor = new TransactionMonitor();
  }
  return transactionMonitor;
}
