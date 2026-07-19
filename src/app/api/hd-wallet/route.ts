// ============================================================
// HD WALLET API — BIP32 Derivation, Address Generation & Scanning
// All operations server-side using xprv from HD_WALLET
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import { deriveChild } from "bip32";
import { HD_WALLET, VAULT_WALLETS, PRIMARY_ADDRESS, ACTIVE_ADDRESS, BINANCE_BTC_ADDRESS } from "@/components/bitcoin/bitcoin-data";

// ---------- CONSTANTS ----------
const GAP_LIMIT = 20; // BIP44 standard gap limit
const SCAN_BATCH_SIZE = 5; // addresses per API call to avoid rate limits

// ---------- HELPERS ----------
function sha256(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

interface HDNode {
  xprv: string;
  xpub: string;
  pubkey: Buffer;
  address: string;
  path: string;
  index: number;
}

interface DerivedAddress {
  index: number;
  path: string;
  pubkey: string;
  address: string;
  type: string;
}

/**
 * Derive a single child from the master xprv
 */
function deriveChild(masterXprv: string, path: string): HDNode {
  let node = HDKey.fromExtendedKey(masterXprv);
  const parts = path.split("/").filter(Boolean);
  for (const part of parts) {
    let index = 0;
    if (part.endsWith("'") || part.endsWith("h") || part.endsWith("H")) {
      index = parseInt(part.slice(0, -1)) + 0x80000000;
    } else {
      index = parseInt(part);
    }
    node = node.deriveChild(index);
  }

  const pubkey = node.publicKey;
  const address = pubkeyToP2PKHAddress(pubkey);

  return {
    xprv: node.privateExtendedKey || "",
    xpub: node.publicExtendedKey || "",
    pubkey: String(pubkey),
    address,
    path,
    index: parseInt(parts[parts.length - 1].replace(/['hH]/g, "")),
  };
}

/**
 * Derive a range of addresses at a given branch
 */
function deriveAddressRange(masterXprv: string, branch: string, start: number, count: number): DerivedAddress[] {
  const addresses: DerivedAddress[] = [];
  const type = branch === "1" ? "change" : "receiving";
  for (let i = start; i < start + count; i++) {
    const path = `m/44'/0'/0'/${branch}/${i}`;
    try {
      const node = deriveChild(masterXprv, path);
      addresses.push({
        index: i,
        path,
        pubkey: String(node.pubkey),
        address: node.address,
        type,
      });
    } catch { /* skip */ }
  }

  return addresses;
}

// ---------- BLOCKCHAIN.INFO FETCH ----------
async function fetchMultiBalance(addresses: string[]): Promise<Map<string, { balance: number; txCount: number }>> {
  const result = new Map<string, { balance: number; txCount: number }>();

  const batches: string[][] = [];
  for (let i = 0; i < addresses.length; i += SCAN_BATCH_SIZE) {
    batches.push(addresses.slice(i, i + SCAN_BATCH_SIZE));
  }

  for (const batch of batches) {
    try {
      const active = batch.join("|");
      const res = await fetch(`https://blockchain.info/balance?active=${active}`, {
        headers: { "User-Agent": "Mozilla/5.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) continue;
      const data = await res.json() as Record<string, { final_balance: number; n_tx: number }>;
      for (const addr of batch) {
        const info = data[addr];
        if (info) {
          result.set(addr, { balance: info.final_balance, txCount: info.n_tx });
        }
      }
    } catch {
      // Skip failed batch
    }
  }

  return result;
}

// ---------- NUCLEO BALANCE ----------
async function fetchAddressUTXOs(address: string): Promise<{ txid: string; vout: number; value: number }[]> {
  try {
    const res = await fetch(`https://blockchain.info/unspent?active=${address}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok || res.status === 500) return [];
    const data = await res.json() as {
      unspent_outputs?: Array<{ tx_hash_big_endian: string; tx_output_n: number; value: number }>;
    };
    if (!data.unspent_outputs) return [];
    return data.unspent_outputs.map(u => ({
      txid: u.tx_hash_big_endian,
      vout: u.tx_output_n,
      value: u.value,
    }));
  } catch {
    return [];
  }
}

// ---------- PUBKEY TO ADDRESS ----------
function pubkeyToP2PKHAddress(pubkey: Buffer): string {
  const hash = sha256(pubkey);
  return `1${hash.toString("hex")}`;
}

// ---------- MAIN GET ----------
export async function GET(req: NextRequest) {
  try {
    const primaryInfo = await fetchAddressUTXOs(PRIMARY_ADDRESS);
    const activeInfo = await fetchAddressUTXOs(ACTIVE_ADDRESS);

    // Sample vaults for display
    const sampleVaults = VAULT_WALLETS.slice(0, 10);
    const vaultAddresses = sampleVaults.map(w => w.address);
    const vaultBalances = await fetchMultiBalance(vaultAddresses);

    const totalVault = 0;
    const vaultsWithBalance: Array<{ name: string; address: string; balance: number }> = [];
    for (const w of sampleVaults) {
      const info = vaultBalances.get(w.address);
      if (info && info.balance > 0) {
        totalVault += info.balance;
        vaultsWithBalance.push({ name: w.address.slice(0, 12) + '...', address: w.address, balance: info.balance });
      }
    }

    // Collect all addresses to check
    const addressesToCheck: Array<{ label: string; address: string; type: string }> = [
      { label: "Primary", address: PRIMARY_ADDRESS, type: "watch_only" },
      { label: "Active (523tx)", address: ACTIVE_ADDRESS, type: "imported" },
      { label: "Binance Custody", address: BINANCE_BTC_ADDRESS, type: "custody" },
      ...VAULT_WALLETS.slice(0, 10).map(w => ({ label: (w as unknown as Record<string, unknown>)?.name ?? w.address.slice(0, 12), address: w.address, type: "vault" })),
      ...IMPORTED_WALLETS.map(w => ({ label: (w as unknown as Record<string, unknown>)?.label ?? w.address.slice(0, 12), address: w.address, type: "imported" })),
    ];

    // Derive HD addresses if xprv available
    const hdAddresses: Array<{ label: string; address: string; type: string }> = [];
    if (process.env.HD_WALLET_XPRV) {
      for (let i = 0; i < Math.min(20, 100); i++) {
        try {
          // BIP44 path
          const hdPath = `m/44'/0'/0/${i}`;
          const bip44 = localDeriveChild(process.env.HD_WALLET_XPRV || '', hdPath);
          hdAddresses.push({ label: `HD m/44'/0'/0/${i}`, address: bip44.address, type: "hd_bip44" });
        } catch { /* skip */ }
        try {
          // Original m/0/i path
          const legacy = localDeriveChild(process.env.HD_WALLET_XPRV || '', `m/0/${i}`);
          hdAddresses.push({ label: `HD m/0/${i}`, address: legacy.address, type: "hd_legacy" });
        } catch { /* skip */ }
      }
    }

    // Fetch balances for HD addresses
    const hdBalances = await fetchMultiBalance(hdAddresses.map(a => a.address));

    return NextResponse.json({
      primary: { address: PRIMARY_ADDRESS, balance: primaryInfo.balance, txCount: primaryInfo.txCount },
      active: { address: ACTIVE_ADDRESS, balance: activeInfo.balance, txCount: activeInfo.txCount },
      totalVault,
      vaultsWithBalance,
      hdAddresses,
    });
  } catch (error: unknown) {
    return NextResponse.json({ error: 'HD Wallet scan failed' }, { status: 500 });
  }
}