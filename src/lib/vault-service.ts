// ─── Cofres Nexus — Vault Service ───────────────────────
// Server-only module. Handles BIP32 derivation, encryption, and address generation.
// NEVER import this in client components.

import * as bip39 from "bip39";
import bip32Factory from "bip32";
import * as tinysecp from "tiny-secp256k1";
import { ECPairFactory } from "ecpair";
import { payments } from "bitcoinjs-lib";
import crypto from "crypto";

const bip32 = bip32Factory(tinysecp);
const ECPair = ECPairFactory(tinysecp);

// ─── Encryption Helpers ─────────────────────────────────
const ALGORITHM = "aes-256-gcm";
const VAULT_MASTER_KEY = process.env.VAULT_ENCRYPTION_KEY;
if (!VAULT_MASTER_KEY) {
  throw new Error('[VaultService] FATAL: VAULT_ENCRYPTION_KEY env var is required. Vault encryption cannot operate without it.');
}

function encrypt(plaintext: string): { encrypted: string; iv: string; tag: string } {
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(VAULT_MASTER_KEY, "nexus-salt", 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(plaintext, "utf8", "hex");
  encrypted += cipher.final("hex");
  const tag = cipher.getAuthTag().toString("hex");
  return { encrypted, iv: iv.toString("hex"), tag };
}

function decrypt(encryptedHex: string, ivHex: string, tagHex: string): string {
  const key = crypto.scryptSync(VAULT_MASTER_KEY, "nexus-salt", 32);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, Buffer.from(ivHex, "hex"));
  decipher.setAuthTag(Buffer.from(tagHex, "hex"));
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}

// ─── BIP32 Derivation ───────────────────────────────────
export interface GeneratedWallet {
  mnemonic: string;
  seed: Buffer;
  rootKey: bip32.BIP32Interface;
  xpub: string;
  xprv: string;
  firstAddress: string;
  firstAddressIndex: number;
}

export function generateMnemonic(strength: number = 128): string {
  return bip39.generateMnemonic(strength);
}

export function generateWallet(mnemonic?: string, derivationPath: string = "m/44'/0'/0'"): GeneratedWallet {
  const mn = mnemonic || bip39.generateMnemonic(128);
  const seed = bip39.mnemonicToSeedSync(mn);
  const rootKey = bip32.fromSeed(seed);
  const derivedKey = rootKey.derivePath(derivationPath);
  const firstChild = derivedKey.derive(0).derive(0);
  const { address } = payments.p2pkh({ pubkey: firstChild.publicKey });

  return {
    mnemonic: mn,
    seed,
    rootKey,
    xpub: derivedKey.neutered().toBase58(),
    xprv: derivedKey.toBase58(),
    firstAddress: address!,
    firstAddressIndex: 0,
  };
}

export function deriveAddress(xprv: string, index: number, isChange: boolean = false): { address: string; privateKey: string } {
  const node = bip32.fromBase58(xprv);
  const chain = isChange ? 1 : 0;
  const child = node.derive(chain).derive(index);
  const { address } = payments.p2pkh({ pubkey: child.publicKey });
  return {
    address: address!,
    privateKey: child.toWIF(),
  };
}

export function deriveAddressFromXpub(xpub: string, index: number, isChange: boolean = false): string {
  const node = bip32.fromBase58(xpub);
  const chain = isChange ? 1 : 0;
  const child = node.derive(chain).derive(index);
  const { address } = payments.p2pkh({ pubkey: child.publicKey });
  return address!;
}

export function importPrivateKey(wif: string): { address: string; publicKey: string } {
  const keyPair = ECPair.fromWIF(wif);
  const { address } = payments.p2pkh({ pubkey: keyPair.publicKey });
  return {
    address: address!,
    publicKey: keyPair.publicKey.toString("hex"),
  };
}

export function validateAddress(address: string): boolean {
  try {
    payments.p2pkh({ address });
    return true;
  } catch {
    return false;
  }
}

// ─── Encryption wrapper for vault storage ───────────────
export function encryptMnemonic(mnemonic: string): string {
  const { encrypted, iv, tag } = encrypt(mnemonic);
  return JSON.stringify({ encrypted, iv, tag });
}

export function decryptMnemonic(stored: string): string {
  const { encrypted, iv, tag } = JSON.parse(stored);
  return decrypt(encrypted, iv, tag);
}

// ─── Mempool.space balance fetch ────────────────────────
export async function fetchAddressBalance(address: string): Promise<{ balanceSat: number; txCount: number }> {
  try {
    const res = await fetch("https://mempool.space/api/address/" + address);
    if (!res.ok) return { balanceSat: 0, txCount: 0 };
    const data = await res.json();
    const balanceSat = data.chain_stats?.funded_txo_sum || 0;
    const spentSat = data.chain_stats?.spent_txo_sum || 0;
    return {
      balanceSat: balanceSat - spentSat,
      txCount: data.chain_stats?.tx_count || 0,
    };
  } catch {
    return { balanceSat: 0, txCount: 0 };
  }
}

export function satToBTC(sat: number): string {
  return (sat / 100_000_000).toFixed(8);
}