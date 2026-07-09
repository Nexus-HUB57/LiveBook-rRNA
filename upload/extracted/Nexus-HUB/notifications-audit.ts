import { notifyOwner } from "./_core/notification";
import { storagePut } from "./storage";
import * as db from "./db";
import { createHash } from "crypto";

/**
 * Sistema de notificações ao owner para decisões críticas do conselho
 * e auditoria persistente em S3
 */

export interface CriticalEvent {
  type: "proposal_approved" | "proposal_rejected" | "startup_promoted" | "startup_demoted" | "arbitrage_executed" | "revenue_distributed";
  title: string;
  description: string;
  severity: "critical" | "high" | "medium" | "low";
  data?: Record<string, any>;
}

/**
 * Notificar o owner sobre eventos críticos
 */
export async function notifyCriticalEvent(event: CriticalEvent): Promise<boolean> {
  try {
    const severityEmoji = {
      critical: "🚨",
      high: "⚠️",
      medium: "📢",
      low: "ℹ️",
    };

    const title = `${severityEmoji[event.severity]} ${event.title}`;
    const content = `
${event.description}

**Tipo:** ${event.type}
**Severidade:** ${event.severity.toUpperCase()}
**Timestamp:** ${new Date().toISOString()}

${event.data ? `**Dados:**\n${JSON.stringify(event.data, null, 2)}` : ""}
    `.trim();

    const result = await notifyOwner({ title, content });
    
    if (result) {
      console.log(`✓ Notificação enviada ao owner: ${event.title}`);
    } else {
      console.warn(`⚠️ Falha ao enviar notificação ao owner: ${event.title}`);
    }

    return result;
  } catch (error) {
    console.error("[Notifications] Erro ao notificar owner:", error);
    return false;
  }
}

/**
 * Notificar aprovação de proposta
 */
export async function notifyProposalApproved(proposalId: number, title: string, votesYes: number, totalWeight: number) {
  return notifyCriticalEvent({
    type: "proposal_approved",
    title: `Proposta Aprovada: ${title}`,
    description: `A proposta foi aprovada pelo conselho com ${votesYes} votos a favor de ${totalWeight} possíveis.`,
    severity: "high",
    data: { proposalId, votesYes, totalWeight },
  });
}

/**
 * Notificar rejeição de proposta
 */
export async function notifyProposalRejected(proposalId: number, title: string, votesNo: number, totalWeight: number) {
  return notifyCriticalEvent({
    type: "proposal_rejected",
    title: `Proposta Rejeitada: ${title}`,
    description: `A proposta foi rejeitada pelo conselho com ${votesNo} votos contra de ${totalWeight} possíveis.`,
    severity: "medium",
    data: { proposalId, votesNo, totalWeight },
  });
}

/**
 * Notificar promoção de startup
 */
export async function notifyStartupPromoted(startupId: number, startupName: string, newRank: number) {
  return notifyCriticalEvent({
    type: "startup_promoted",
    title: `Startup Promovida: ${startupName}`,
    description: `${startupName} foi promovida para a posição ${newRank} no ranking de performance.`,
    severity: "high",
    data: { startupId, startupName, newRank },
  });
}

/**
 * Notificar degradação de startup
 */
export async function notifyStartupDemoted(startupId: number, startupName: string, newRank: number) {
  return notifyCriticalEvent({
    type: "startup_demoted",
    title: `Startup Degradada: ${startupName}`,
    description: `${startupName} foi degradada para a posição ${newRank} no ranking de performance.`,
    severity: "medium",
    data: { startupId, startupName, newRank },
  });
}

/**
 * Notificar execução de arbitragem
 */
export async function notifyArbitrageExecuted(asset: string, profitPotential: number, exchangeFrom: string, exchangeTo: string) {
  return notifyCriticalEvent({
    type: "arbitrage_executed",
    title: `Arbitragem Executada: ${asset}`,
    description: `Oportunidade de arbitragem em ${asset} foi executada entre ${exchangeFrom} e ${exchangeTo} com lucro potencial de $${profitPotential.toLocaleString()}.`,
    severity: "high",
    data: { asset, profitPotential, exchangeFrom, exchangeTo },
  });
}

/**
 * Notificar distribuição de receitas
 */
export async function notifyRevenueDistributed(totalAmount: number, masterVaultAmount: number, treasuryAmount: number, agentsAmount: number) {
  return notifyCriticalEvent({
    type: "revenue_distributed",
    title: "Distribuição de Receitas Executada",
    description: `Receita total de $${totalAmount.toLocaleString()} foi distribuída:\n- Master Vault (80%): $${masterVaultAmount.toLocaleString()}\n- Tesouraria V2 (10%): $${treasuryAmount.toLocaleString()}\n- Agentes (10%): $${agentsAmount.toLocaleString()}`,
    severity: "critical",
    data: { totalAmount, masterVaultAmount, treasuryAmount, agentsAmount },
  });
}

/**
 * Interface para auditoria
 */
export interface AuditRecord {
  id?: number;
  timestamp: string;
  action: string;
  actor: string;
  targetType?: string;
  targetId?: number;
  details?: string;
  s3Key?: string;
  hash: string;
  previousHash?: string;
}

/**
 * Criar registro de auditoria com hash para integridade
 */
export async function createAuditRecord(
  action: string,
  actor: string,
  targetType?: string,
  targetId?: number,
  details?: string
): Promise<AuditRecord | null> {
  try {
    const timestamp = new Date().toISOString();
    
    // Obter hash anterior para criar cadeia
    const previousLogs = await db.getAuditLogs(1);
    const previousHash = previousLogs.length > 0 ? (previousLogs[0] as any).hash : "0";

    // Criar hash do registro
    const recordData = `${timestamp}${action}${actor}${targetType || ""}${targetId || ""}${details || ""}${previousHash}`;
    const hash = createHash("sha256").update(recordData).digest("hex");

    // Salvar no banco de dados
    const logId = await db.createAuditLog(action, actor, targetType, targetId, details);

    // Persistir em S3 para compliance
    const s3Key = `audit-logs/${timestamp.replace(/[:.]/g, "-")}-${action.toLowerCase()}.json`;
    const auditRecord: AuditRecord = {
      id: logId || undefined,
      timestamp,
      action,
      actor,
      targetType,
      targetId,
      details,
      s3Key,
      hash,
      previousHash,
    };

    try {
      const { url } = await storagePut(s3Key, JSON.stringify(auditRecord, null, 2), "application/json");
      console.log(`✓ Auditoria persistida em S3: ${url}`);
    } catch (s3Error) {
      console.warn(`⚠️ Falha ao persistir auditoria em S3: ${s3Error}`);
      // Continuar mesmo se S3 falhar
    }

    return auditRecord;
  } catch (error) {
    console.error("[Audit] Erro ao criar registro de auditoria:", error);
    return null;
  }
}

/**
 * Verificar integridade da cadeia de auditoria
 */
export async function verifyAuditChain(): Promise<{ valid: boolean; errors: string[] }> {
  try {
    const logs = await db.getAuditLogs(1000);
    const errors: string[] = [];

    if (logs.length === 0) {
      return { valid: true, errors: [] };
    }

    // Verificar integridade da cadeia
    let previousHash = "0";
    for (let i = logs.length - 1; i >= 0; i--) {
      const log = logs[i] as any;
      
      // Recalcular hash
      const recordData = `${log.createdAt}${log.action}${log.actor}${log.targetType || ""}${log.targetId || ""}${log.details || ""}${previousHash}`;
      const calculatedHash = createHash("sha256").update(recordData).digest("hex");

      if (log.hash && log.hash !== calculatedHash) {
        errors.push(`Integridade comprometida no log ${log.id}: hash esperado ${calculatedHash}, recebido ${log.hash}`);
      }

      previousHash = log.hash || calculatedHash;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error("[Audit] Erro ao verificar integridade da cadeia:", error);
    return { valid: false, errors: ["Erro ao verificar integridade"] };
  }
}

/**
 * Exportar auditoria para compliance
 */
export async function exportAuditLog(startDate?: Date, endDate?: Date): Promise<string | null> {
  try {
    const logs = await db.getAuditLogs(10000);
    
    let filteredLogs = logs;
    if (startDate || endDate) {
      filteredLogs = logs.filter((log: any) => {
        const logDate = new Date(log.createdAt);
        if (startDate && logDate < startDate) return false;
        if (endDate && logDate > endDate) return false;
        return true;
      });
    }

    // Criar relatório
    const report = {
      exportDate: new Date().toISOString(),
      period: {
        start: startDate?.toISOString() || "Início",
        end: endDate?.toISOString() || "Fim",
      },
      totalRecords: filteredLogs.length,
      logs: filteredLogs,
      integrity: await verifyAuditChain(),
    };

    // Persistir em S3
    const s3Key = `audit-reports/audit-report-${new Date().toISOString().split("T")[0]}.json`;
    const { url } = await storagePut(s3Key, JSON.stringify(report, null, 2), "application/json");

    console.log(`✓ Relatório de auditoria exportado: ${url}`);
    return url;
  } catch (error) {
    console.error("[Audit] Erro ao exportar auditoria:", error);
    return null;
  }
}

/**
 * Notificar múltiplos eventos críticos em lote
 */
export async function notifyBatchCriticalEvents(events: CriticalEvent[]): Promise<boolean[]> {
  return Promise.all(events.map(event => notifyCriticalEvent(event)));
}
