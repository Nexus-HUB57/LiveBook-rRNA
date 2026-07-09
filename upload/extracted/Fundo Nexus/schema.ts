import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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

/**
 * Tabela de carteiras Bitcoin
 */
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  mnemonic: text("mnemonic").notNull(),
  xpub: varchar("xpub", { length: 255 }).notNull(),
  xprv: text("xprv"),
  publicKey: text("publicKey").notNull(),
  privateKey: text("privateKey"),
  address: varchar("address", { length: 62 }).notNull(),
  addressType: mysqlEnum("addressType", ["P2PKH", "P2SH", "SegWit"]).default("SegWit"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * Tabela de enderecos Bitcoin
 */
export const addresses = mysqlTable("addresses", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("walletId").notNull(),
  address: varchar("address", { length: 62 }).notNull().unique(),
  publicKey: text("publicKey").notNull(),
  privateKeyEncrypted: text("privateKeyEncrypted"),
  addressType: mysqlEnum("addressType", ["P2PKH", "P2SH", "SegWit"]).default("SegWit"),
  derivationPath: varchar("derivationPath", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Address = typeof addresses.$inferSelect;
export type InsertAddress = typeof addresses.$inferInsert;

/**
 * Tabela de transacoes
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("walletId").notNull(),
  transactionHash: varchar("transactionHash", { length: 64 }).notNull().unique(),
  fromAddress: varchar("fromAddress", { length: 62 }).notNull(),
  toAddress: varchar("toAddress", { length: 62 }).notNull(),
  amount: text("amount").notNull(),
  fee: text("fee"),
  status: mysqlEnum("status", ["pending", "confirmed", "failed"]).default("pending"),
  confirmations: int("confirmations").default(0),
  blockHeight: int("blockHeight"),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Tabela de UTXOs
 */
export const utxos = mysqlTable("utxos", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("walletId").notNull(),
  txid: varchar("txid", { length: 64 }).notNull(),
  vout: int("vout").notNull(),
  value: text("value").notNull(),
  address: varchar("address", { length: 62 }).notNull(),
  confirmed: int("confirmed").default(0),
  confirmations: int("confirmations").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UTXO = typeof utxos.$inferSelect;
export type InsertUTXO = typeof utxos.$inferInsert;
