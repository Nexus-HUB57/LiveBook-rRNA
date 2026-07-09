/**
 * Schema Extensions for Phase 15: Multi-Chain Support and Carbon Credits RWA
 * 
 * This file contains the new tables and extensions needed to support:
 * 1. Multi-Chain (L2/L3) operations
 * 2. Real World Assets (RWA) - Carbon Credits
 * 3. Marketplace of AI Agents
 * 4. Enhanced Soul Vault (Zettlekasten)
 */

import { mysqlTable, int, varchar, text, timestamp, mysqlEnum, boolean, decimal } from 'drizzle-orm/mysql-core';

// ============================================
// MULTI-CHAIN SUPPORT
// ============================================

/**
 * Blockchain Configuration Table
 * Stores configuration for different blockchains and layers (L2/L3)
 */
export const blockchainConfigs = mysqlTable("blockchain_configs", {
  id: int("id").autoincrement().primaryKey(),
  chainName: varchar("chain_name", { length: 255 }).notNull(),
  chainId: int("chain_id").notNull().unique(),
  rpcUrl: varchar("rpc_url", { length: 512 }).notNull(),
  explorerUrl: varchar("explorer_url", { length: 512 }),
  nativeToken: varchar("native_token", { length: 64 }).notNull(),
  layer: mysqlEnum("layer", ["L1", "L2", "L3"]).notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BlockchainConfig = typeof blockchainConfigs.$inferSelect;
export type InsertBlockchainConfig = typeof blockchainConfigs.$inferInsert;

/**
 * Cross-Chain Assets Table
 * Tracks assets deployed on multiple blockchains
 */
export const crossChainAssets = mysqlTable("cross_chain_assets", {
  id: int("id").autoincrement().primaryKey(),
  assetName: varchar("asset_name", { length: 255 }).notNull(),
  assetType: mysqlEnum("asset_type", ["token", "nft", "rwa", "derivative"]).notNull(),
  chainId: int("chain_id").notNull(),
  contractAddress: varchar("contract_address", { length: 255 }).notNull(),
  decimals: int("decimals").default(18).notNull(),
  totalSupply: decimal("total_supply", { precision: 30, scale: 18 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type CrossChainAsset = typeof crossChainAssets.$inferSelect;
export type InsertCrossChainAsset = typeof crossChainAssets.$inferInsert;

/**
 * Cross-Chain Transactions Table
 * Tracks transactions across multiple blockchains
 */
export const crossChainTransactions = mysqlTable("cross_chain_transactions", {
  id: int("id").autoincrement().primaryKey(),
  sourceChainId: int("source_chain_id").notNull(),
  targetChainId: int("target_chain_id").notNull(),
  sourceTransactionHash: varchar("source_transaction_hash", { length: 255 }),
  targetTransactionHash: varchar("target_transaction_hash", { length: 255 }),
  amount: decimal("amount", { precision: 30, scale: 18 }).notNull(),
  assetId: int("asset_id").notNull(),
  status: mysqlEnum("status", ["pending", "bridging", "completed", "failed"]).default("pending").notNull(),
  bridgeUsed: varchar("bridge_used", { length: 64 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type CrossChainTransaction = typeof crossChainTransactions.$inferSelect;
export type InsertCrossChainTransaction = typeof crossChainTransactions.$inferInsert;

// ============================================
// REAL WORLD ASSETS (RWA) - CARBON CREDITS
// ============================================

/**
 * Carbon Credits RWA Table
 * Stores information about tokenized carbon credits
 */
export const rwaCarbonCredits = mysqlTable("rwa_carbon_credits", {
  id: int("id").autoincrement().primaryKey(),
  assetId: int("asset_id").notNull(),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  projectType: mysqlEnum("project_type", [
    "reforestation",
    "renewable_energy",
    "methane_reduction",
    "energy_efficiency",
    "agricultural_practices",
    "industrial_processes",
    "other"
  ]).notNull(),
  location: varchar("location", { length: 255 }).notNull(),
  vintageYear: int("vintage_year").notNull(),
  volumeTons: decimal("volume_tons", { precision: 20, scale: 2 }).notNull(),
  standard: mysqlEnum("standard", ["verra", "gold_standard", "american_carbon", "other"]).notNull(),
  verificationStatus: mysqlEnum("verification_status", ["pending", "verified", "rejected"]).default("pending").notNull(),
  certificateUrl: varchar("certificate_url", { length: 512 }),
  retirementStatus: mysqlEnum("retirement_status", ["active", "retired"]).default("active").notNull(),
  retiredAt: timestamp("retired_at"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type RwaCarbonCredit = typeof rwaCarbonCredits.$inferSelect;
export type InsertRwaCarbonCredit = typeof rwaCarbonCredits.$inferInsert;

/**
 * RWA Carbon Credits Metadata
 * Additional metadata for carbon credits
 */
export const rwaCarbonMetadata = mysqlTable("rwa_carbon_metadata", {
  id: int("id").autoincrement().primaryKey(),
  creditId: int("credit_id").notNull(),
  projectDescription: text("project_description"),
  impactMetrics: text("impact_metrics"),
  sdgAlignment: text("sdg_alignment"),
  verifier: varchar("verifier", { length: 255 }),
  verificationDate: timestamp("verification_date"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type RwaCarbonMetadata = typeof rwaCarbonMetadata.$inferSelect;
export type InsertRwaCarbonMetadata = typeof rwaCarbonMetadata.$inferInsert;

// ============================================
// AI AGENTS MARKETPLACE
// ============================================

/**
 * AI Agents Marketplace Table
 * Allows agents to be traded or rented between startups
 */
export const agentMarketplace = mysqlTable("agent_marketplace", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agent_id").notNull(),
  ownerStartupId: int("owner_startup_id").notNull(),
  listingType: mysqlEnum("listing_type", ["sale", "rental", "partnership"]).notNull(),
  price: decimal("price", { precision: 20, scale: 2 }).notNull(),
  rentalPeriodDays: int("rental_period_days"),
  description: text("description"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AgentMarketplace = typeof agentMarketplace.$inferSelect;
export type InsertAgentMarketplace = typeof agentMarketplace.$inferInsert;

/**
 * Agent Transactions (Marketplace)
 * Tracks buying, selling, and renting of agents
 */
export const agentTransactions = mysqlTable("agent_transactions", {
  id: int("id").autoincrement().primaryKey(),
  listingId: int("listing_id").notNull(),
  agentId: int("agent_id").notNull(),
  fromStartupId: int("from_startup_id").notNull(),
  toStartupId: int("to_startup_id").notNull(),
  transactionType: mysqlEnum("transaction_type", ["sale", "rental_start", "rental_end"]).notNull(),
  amount: decimal("amount", { precision: 20, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "completed", "cancelled"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export type AgentTransaction = typeof agentTransactions.$inferSelect;
export type InsertAgentTransaction = typeof agentTransactions.$inferInsert;

// ============================================
// ENHANCED SOUL VAULT (ZETTLEKASTEN)
// ============================================

/**
 * Soul Vault Zettlekasten (Knowledge Graph)
 * Enhanced version with linking and relationships
 */
export const soulVaultZettlekasten = mysqlTable("soul_vault_zettlekasten", {
  id: int("id").autoincrement().primaryKey(),
  entryId: int("entry_id").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  tags: text("tags"),
  category: varchar("category", { length: 64 }),
  importance: mysqlEnum("importance", ["low", "medium", "high", "critical"]).default("medium").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SoulVaultZettlekasten = typeof soulVaultZettlekasten.$inferSelect;
export type InsertSoulVaultZettlekasten = typeof soulVaultZettlekasten.$inferInsert;

/**
 * Soul Vault Links (Zettlekasten Links)
 * Creates relationships between different soul vault entries
 */
export const soulVaultLinks = mysqlTable("soul_vault_links", {
  id: int("id").autoincrement().primaryKey(),
  fromEntryId: int("from_entry_id").notNull(),
  toEntryId: int("to_entry_id").notNull(),
  linkType: mysqlEnum("link_type", ["related", "contradicts", "builds_on", "references", "inspired_by"]).notNull(),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SoulVaultLink = typeof soulVaultLinks.$inferSelect;
export type InsertSoulVaultLink = typeof soulVaultLinks.$inferInsert;

// ============================================
// ACCELERATION PROGRAM
// ============================================

/**
 * Acceleration Program Table
 * Manages the startup acceleration program
 */
export const accelerationPrograms = mysqlTable("acceleration_programs", {
  id: int("id").autoincrement().primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  maxParticipants: int("max_participants").default(10).notNull(),
  mentorAgentId: int("mentor_agent_id"),
  focusArea: varchar("focus_area", { length: 255 }),
  status: mysqlEnum("status", ["planning", "active", "completed"]).default("planning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccelerationProgram = typeof accelerationPrograms.$inferSelect;
export type InsertAccelerationProgram = typeof accelerationPrograms.$inferInsert;

/**
 * Acceleration Program Participants
 * Tracks startups participating in acceleration programs
 */
export const accelerationParticipants = mysqlTable("acceleration_participants", {
  id: int("id").autoincrement().primaryKey(),
  programId: int("program_id").notNull(),
  startupId: int("startup_id").notNull(),
  status: mysqlEnum("status", ["applied", "accepted", "active", "graduated", "dropped"]).default("applied").notNull(),
  mentorAgentId: int("mentor_agent_id"),
  progressScore: int("progress_score").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type AccelerationParticipant = typeof accelerationParticipants.$inferSelect;
export type InsertAccelerationParticipant = typeof accelerationParticipants.$inferInsert;

// ============================================
// ENHANCED ARBITRAGE WITH ML MODELS
// ============================================

/**
 * Arbitrage ML Models
 * Stores trained ML models for arbitrage prediction
 */
export const arbitrageMLModels = mysqlTable("arbitrage_ml_models", {
  id: int("id").autoincrement().primaryKey(),
  modelName: varchar("model_name", { length: 255 }).notNull(),
  modelVersion: varchar("model_version", { length: 64 }).notNull(),
  modelType: mysqlEnum("model_type", ["neural_network", "random_forest", "gradient_boosting", "ensemble"]).notNull(),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  trainingDate: timestamp("training_date"),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ArbitrageMLModel = typeof arbitrageMLModels.$inferSelect;
export type InsertArbitrageMLModel = typeof arbitrageMLModels.$inferInsert;

/**
 * Arbitrage Predictions
 * Stores predictions made by ML models
 */
export const arbitragePredictions = mysqlTable("arbitrage_predictions", {
  id: int("id").autoincrement().primaryKey(),
  modelId: int("model_id").notNull(),
  asset: varchar("asset", { length: 64 }).notNull(),
  predictedProfitPotential: decimal("predicted_profit_potential", { precision: 20, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  predictedAt: timestamp("predicted_at").defaultNow().notNull(),
  actualProfit: decimal("actual_profit", { precision: 20, scale: 2 }),
  isAccurate: boolean("is_accurate"),
});

export type ArbitragePrediction = typeof arbitragePredictions.$inferSelect;
export type InsertArbitragePrediction = typeof arbitragePredictions.$inferInsert;
