// ============================================================
// DYNAMIC VAULT — Runtime storage for generated wallets
// Wallets generated via /api/generate-wallet are stored here
// so the /api/withdraw route can sign PSBTs with them.
// This is an in-memory Map — keys are lost on server restart.
// ============================================================

import type { VaultWallet } from "@/components/bitcoin/bitcoin-data";

const dynamicVault = new Map<string, VaultWallet>();

/**
 * Add a wallet to the dynamic vault (generated on-the-fly)
 */
export function addToDynamicVault(wallet: VaultWallet): void {
  dynamicVault.set(wallet.address, wallet);
}

/**
 * Get a wallet from dynamic vault by address
 */
export function getFromDynamicVault(address: string): VaultWallet | undefined {
  return dynamicVault.get(address);
}

/**
 * Get all dynamic vault wallets
 */
export function getAllDynamicVault(): VaultWallet[] {
  return Array.from(dynamicVault.values());
}

/**
 * Check if dynamic vault has a wallet with given address
 */
export function hasInDynamicVault(address: string): boolean {
  return dynamicVault.has(address);
}

/**
 * Get total count of dynamic vault wallets
 */
export function dynamicVaultCount(): number {
  return dynamicVault.size;
}