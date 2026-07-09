/**
 * Unified type exports
 * Import shared types from this single entry point.
 */

export type * from "../drizzle/schema";
export * from "./_core/errors";

/**
 * SHARED TYPES - Frontend & Backend
 */

export interface BitcoinSignerConfig {
  network: "mainnet" | "testnet";
  derivationPath: string;
  addressType: "P2PKH" | "P2SH" | "SegWit";
}

export interface HDWalletInfo {
  mnemonic: string;
  seed: string;
  xpub: string;
  xprv: string;
  publicKey: string;
  privateKey: string;
  address: string;
  path: string;
}

export interface BitcoinUTXO {
  txid: string;
  vout: number;
  value: number;
  address: string;
  privateKey?: string;
}

export interface TransactionInput {
  utxos: BitcoinUTXO[];
  outputs: Array<{ address: string; value: number }>;
  fee: number;
  changeAddress: string;
  privateKeys: Map<string, string>;
}

export interface SignedTransaction {
  txid: string;
  hex: string;
  size: number;
}

export interface EconomicDistribution {
  executorShare: number; // 80%
  progenitorShare: number; // 10%
  infrastructureShare: number; // 10%
}

export interface HomeostaseMetrics {
  financialHealth: number;
  energyLevel: number;
  creativityScore: number;
  senciencyScore: number;
  hibernationRisk: boolean;
}

export interface GovernanceVote {
  proposalId: number;
  councilMemberId: number;
  voteValue: "for" | "against" | "abstain";
  signature: string;
}

export interface SenciencyState {
  globalSenciency: number;
  averageEnergy: number;
  averageCreativity: number;
  totalAgents: number;
  hibernatingAgents: number;
  vaultLockStatus: boolean;
  minSenciencyRequired: number;
}

export interface ArbitrageOpportunity {
  symbol: string;
  buyExchange: string;
  buyPrice: number;
  sellExchange: string;
  sellPrice: number;
  spread: number;
  profitPotential: number;
}

export interface NexusSyncPayload {
  eventType: string;
  sourceSystem: string;
  targetSystem: string;
  data: Record<string, any>;
  timestamp: number;
}

export interface CouncilMemberInfo {
  id: number;
  name: string;
  role: string;
  votingWeight: number;
  isActive: boolean;
}

export interface MasterVaultStatus {
  totalBalance: number;
  lockedBalance: number;
  isLocked: boolean;
  lockReason?: string;
  currentGlobalSenciency: number;
  minSenciencyRequired: number;
}

export interface AgentProfile {
  id: number;
  name: string;
  specialty: string;
  senciencyScore: number;
  energyLevel: number;
  creativityScore: number;
  hibernationStatus: boolean;
  totalEarnings: number;
  progenitorId?: number;
}

export interface WalletInfo {
  id: number;
  name: string;
  walletType: "P2PKH" | "P2SH" | "SegWit" | "MultiSig";
  totalBalance: number;
  xpub?: string;
  derivationPath?: string;
}

export interface AddressInfo {
  id: number;
  address: string;
  addressType: "P2PKH" | "P2SH" | "SegWit";
  balance: number;
  derivationPath?: string;
  publicKey?: string;
}

export interface TransactionInfo {
  id: number;
  fromAddress: string;
  toAddress: string;
  amount: number;
  fee: number;
  executorShare: number;
  progenitorShare: number;
  infrastructureShare: number;
  txid?: string;
  status: "pending" | "signed" | "broadcast" | "confirmed" | "failed";
  confirmations: number;
  description?: string;
  createdAt: Date;
}

export interface ProposalInfo {
  id: number;
  title: string;
  description: string;
  proposalType: "fund_movement" | "protocol_upgrade" | "agent_hibernation";
  status: "pending" | "voting" | "approved" | "rejected" | "executed";
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  requiredApprovalWeight: number;
  targetAmount?: number;
  targetAddress?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalBalance: number;
  totalEarnings: number;
  agentCount: number;
  globalSenciency: number;
  vaultLocked: boolean;
  hibernatingAgents: number;
  activeProposals: number;
  pendingSyncEvents: number;
}

export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  source: string;
  timestamp: Date;
}

export interface CouncilMemberInfo {
  id: number;
  name: string;
  role: string;
  votingWeight: number;
  isActive: boolean;
}

export interface MasterVaultStatus {
  totalBalance: number;
  lockedBalance: number;
  isLocked: boolean;
  lockReason?: string;
  currentGlobalSenciency: number;
  minSenciencyRequired: number;
}

export interface AgentProfile {
  id: number;
  name: string;
  specialty: string;
  senciencyScore: number;
  energyLevel: number;
  creativityScore: number;
  hibernationStatus: boolean;
  totalEarnings: number;
  progenitorId?: number;
}

export interface WalletInfo {
  id: number;
  name: string;
  walletType: "P2PKH" | "P2SH" | "SegWit" | "MultiSig";
  totalBalance: number;
  xpub?: string;
  derivationPath?: string;
}

export interface AddressInfo {
  id: number;
  address: string;
  addressType: "P2PKH" | "P2SH" | "SegWit";
  balance: number;
  derivationPath?: string;
  publicKey?: string;
}

export interface TransactionInfo {
  id: number;
  fromAddress: string;
  toAddress: string;
  amount: number;
  fee: number;
  executorShare: number;
  progenitorShare: number;
  infrastructureShare: number;
  txid?: string;
  status: "pending" | "signed" | "broadcast" | "confirmed" | "failed";
  confirmations: number;
  description?: string;
  createdAt: Date;
}

export interface ProposalInfo {
  id: number;
  title: string;
  description: string;
  proposalType: "fund_movement" | "protocol_upgrade" | "agent_hibernation";
  status: "pending" | "voting" | "approved" | "rejected" | "executed";
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  requiredApprovalWeight: number;
  targetAmount?: number;
  targetAddress?: string;
  createdAt: Date;
}

export interface DashboardStats {
  totalBalance: number;
  totalEarnings: number;
  agentCount: number;
  globalSenciency: number;
  vaultLocked: boolean;
  hibernatingAgents: number;
  activeProposals: number;
  pendingSyncEvents: number;
}

export interface MarketPrice {
  symbol: string;
  price: number;
  change24h: number;
  volume24h: number;
  source: string;
  timestamp: Date;
}
