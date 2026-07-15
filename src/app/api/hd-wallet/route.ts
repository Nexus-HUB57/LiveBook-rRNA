// ============================================================
// HD WALLET API — BIP32 Derivation, Address Generation & Scanning
// All operations server-side using xprv from HD_WALLET
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import HDKey from "hdkey";
import { HD_WALLET, VAULT_WALLETS, PRIMARY_ADDRESS, ACTIVE_ADDRESS, BINANCE_BTC_ADDRESS } from "@/components/bitcoin/bitcoin-data";

// ---------- CONSTANTS ----------
const GAP_LIMIT = 20; // BIP44 standard gap limit
const SCAN_BATCH_SIZE = 5; // addresses per API call to avoid rate limits

// ---------- HELPERS ----------

function sha256(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

function hash160(buf: Buffer): Buffer {
  return crypto.createHash("ripemd160").update(sha256(buf)).digest();
}

function base58Encode(buffer: Buffer): string {
  const ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";
  let num = BigInt("0x" + buffer.toString("hex"));
  let str = "";
  while (num > 0n) {
    str = ALPHABET[Number(num % 58n)] + str;
    num /= 58n;
  }
  for (let i = 0; i < buffer.length && buffer[i] === 0; i++) {
    str = "1" + str;
  }
  return str;
}

function pubkeyToP2PKHAddress(pubkey: Buffer): string {
  const h160 = hash160(pubkey);
  const versioned = Buffer.concat([Buffer.from([0x00]), h160]);
  const checksum = crypto.createHash("sha256").update(crypto.createHash("sha256").update(versioned).digest()).digest().subarray(0, 4);
  return base58Encode(Buffer.concat([versioned, checksum]));
}

// ---------- BIP32 DERIVATION ----------

interface DerivedAddress {
  index: number;
  path: string;
  pubkey: string;
  address: string;
  type: "receiving" | "change" | "custom";
}

interface HDNode {
  xprv: string;
  xpub: string;
  pubkey: Buffer;
  address: string;
  path: string;
  index: number;
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
    pubkey: Buffer.from(pubkey).toString("hex"),
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
    const node = deriveChild(masterXprv, path);
    addresses.push({
      index: i,
      path,
      pubkey: node.pubkey,
      address: node.address,
      type,
    });
  }

  return addresses;
}

// ---------- BLOCKCHAIN.INFO FETCH ----------

async function fetchMultiBalance(addresses: string[]): Promise<Map<string, { balance: number; txCount: number }>> {
  const result = new Map<string, { balance: number; txCount: number }>();

  // blockchain.info supports multi-address: ?active=addr1|addr2|addr3
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

// ---------- NUCLEO BALANCE ----------

async function fetchNucleoBalance(): Promise<{
  primary: { address: string; balance: number; txCount: number };
  active: { address: string; balance: number; txCount: number };
  totalVault: number;
  vaultsWithBalance: Array<{ name: string; address: string; balance: number }>;
  binance: string;
}> {
  // Fetch primary and active address balances
  const balances = await fetchMultiBalance([PRIMARY_ADDRESS, ACTIVE_ADDRESS]);

  const primaryInfo = balances.get(PRIMARY_ADDRESS) || { balance: 0, txCount: 0 };
  const activeInfo = balances.get(ACTIVE_ADDRESS) || { balance: 0, txCount: 0 };

  // Check a sample of vault wallets for balance (top 5 by name)
  const sampleVaults = VAULT_WALLETS.slice(0, 10);
  const vaultAddresses = sampleVaults.map(w => w.address);
  const vaultBalances = await fetchMultiBalance(vaultAddresses);

  let totalVault = 0;
  const vaultsWithBalance: Array<{ name: string; address: string; balance: number }> = [];
  for (const w of sampleVaults) {
    const info = vaultBalances.get(w.address);
    if (info && info.balance > 0) {
      totalVault += info.balance;
      vaultsWithBalance.push({ name: w.name, address: w.address, balance: info.balance });
    }
  }

  return {
    primary: { address: PRIMARY_ADDRESS, balance: primaryInfo.balance, txCount: primaryInfo.txCount },
    active: { address: ACTIVE_ADDRESS, balance: activeInfo.balance, txCount: activeInfo.txCount },
    totalVault,
    vaultsWithBalance,
    binance: BINANCE_BTC_ADDRESS,
  };
}

// ============================================================
// ROUTE HANDLER
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // ---------- DERIVE ADDRESSES ----------
    if (action === "derive") {
      const count = Math.min(Math.max(body.count || 20, 1), 50);
      const start = Math.max(body.start || 0, 0);
      const branch = body.branch === "change" ? "1" : "0";
      const pathPrefix = body.pathPrefix || "m/44'/0'/0'";

      // Derive from the HD wallet xprv
      const addresses: DerivedAddress[] = [];
      for (let i = start; i < start + count; i++) {
        const path = `${pathPrefix}/${branch}/${i}`;
        const type = branch === "1" ? "change" : "receiving";
        try {
          const node = deriveChild(HD_WALLET.xprv, path);
          addresses.push({
            index: i,
            path,
            pubkey: node.pubkey,
            address: node.address,
            type,
          });
        } catch (e) {
          addresses.push({
            index: i,
            path,
            pubkey: "error",
            address: `derivation-error-${i}`,
            type,
          });
        }
      }

      return NextResponse.json({
        error: false,
        addresses,
        xprv: HD_WALLET.xprv.slice(0, 8) + "..." + HD_WALLET.xprv.slice(-8),
        derivationPath: `${pathPrefix}/${branch}/*`,
        totalDerived: addresses.length,
      });
    }

    // ---------- SCAN FOR FUNDED ADDRESSES ----------
    if (action === "scan") {
      const maxIndex = Math.min(Math.max(body.maxIndex || 100, 10), 500);
      const branch = body.branch === "change" ? "1" : "0";
      const pathPrefix = body.pathPrefix || "m/44'/0'/0'";

      // Derive addresses in batches and check balances
      const funded: Array<{
        index: number; path: string; address: string; pubkey: string;
        balance: number; txCount: number; utxos: { txid: string; vout: number; value: number }[];
      }> = [];

      let lastFundedIndex = -1;
      let consecutiveEmpty = 0;

      for (let batchStart = 0; batchStart < maxIndex; batchStart += GAP_LIMIT) {
        const batchEnd = Math.min(batchStart + GAP_LIMIT, maxIndex);
        const addrs: DerivedAddress[] = [];

        for (let i = batchStart; i < batchEnd; i++) {
          const path = `${pathPrefix}/${branch}/${i}`;
          try {
            const node = deriveChild(HD_WALLET.xprv, path);
            addrs.push({ index: i, path, pubkey: node.pubkey, address: node.address, type: branch === "1" ? "change" : "receiving" });
          } catch {
            continue;
          }
        }

        if (addrs.length === 0) break;

        const addrList = addrs.map(a => a.address);
        const balances = await fetchMultiBalance(addrList);

        let batchHasFunded = false;
        for (const addr of addrs) {
          const info = balances.get(addr.address);
          if (info && info.balance > 0) {
            const utxos = info.balance > 0 ? await fetchAddressUTXOs(addr.address) : [];
            funded.push({
              ...addr,
              balance: info.balance,
              txCount: info.txCount,
              utxos,
            });
            lastFundedIndex = addr.index;
            consecutiveEmpty = 0;
            batchHasFunded = true;
          } else {
            consecutiveEmpty++;
          }
        }

        // Stop if we've hit GAP_LIMIT consecutive empty addresses after a funded one
        if (lastFundedIndex >= 0 && consecutiveEmpty >= GAP_LIMIT) break;
      }

      const totalBalance = funded.reduce((s, f) => s + f.balance, 0);

      return NextResponse.json({
        error: false,
        funded,
        totalFunded: funded.length,
        totalBalance,
        totalBalanceBTC: (totalBalance / 100000000).toFixed(8),
        scannedUpTo: lastFundedIndex + GAP_LIMIT,
        pathPrefix: `${pathPrefix}/${branch}`,
      });
    }

    // ---------- NUCLEO BALANCE (LIVE) ----------
    if (action === "nucleo-balance") {
      const data = await fetchNucleoBalance();
      return NextResponse.json({ error: false, ...data, fetchedAt: new Date().toISOString() });
    }

    // ---------- SINGLE ADDRESS BALANCE ----------
    if (action === "address-balance") {
      const address = body.address;
      if (!address || typeof address !== "string") {
        return NextResponse.json({ error: true, detail: "address is required" }, { status: 400 });
      }
      const balances = await fetchMultiBalance([address]);
      const info = balances.get(address) || { balance: 0, txCount: 0 };
      return NextResponse.json({ error: false, address, ...info });
    }

    // ---------- SCAN ALL KNOWN ADDRESSES (consolidated view) ----------
    if (action === "scan-all") {
      const maxIndex = Math.min(Math.max(body.maxIndex || 50, 10), 200);

      // Collect all addresses to check
      const addressesToCheck: Array<{ label: string; address: string; type: string }> = [
        { label: "Primary", address: PRIMARY_ADDRESS, type: "watch_only" },
        { label: "Active (523tx)", address: ACTIVE_ADDRESS, type: "imported" },
        { label: "Binance Custody", address: BINANCE_BTC_ADDRESS, type: "custody" },
        ...VAULT_WALLETS.slice(0, 10).map(w => ({ label: w.name, address: w.address, type: "vault" })),
        ...IMPORTED_WALLETS.map(w => ({ label: w.label || w.address.slice(0, 12), address: w.address, type: "imported" })),
      ];

      // Also derive HD addresses m/44'/0'/0'/0/0..19 and m/0/0..19
      const hdAddresses: Array<{ label: string; address: string; type: string }> = [];
      for (let i = 0; i < Math.min(maxIndex, 20); i++) {
        try {
          // BIP44 path
          const bip44 = deriveChild(HD_WALLET.xprv, `m/44'/0'/0'/0/${i}`);
          hdAddresses.push({ label: `HD m/44'/0'/0'/0/${i}`, address: bip44.address, type: "hd_bip44" });
        } catch { /* skip */ }
        try {
          // Original m/0/i path
          const legacy = deriveChild(HD_WALLET.xprv, `m/0/${i}`);
          hdAddresses.push({ label: `HD m/0/${i}`, address: legacy.address, type: "hd_legacy" });
        } catch { /* skip */ }
      }

      const allAddresses = [...addressesToCheck, ...hdAddresses];

      // Fetch balances in batches
      const allAddrs = allAddresses.map(a => a.address);
      const balances = await fetchMultiBalance(allAddrs);

      const results = allAddresses.map(a => {
        const info = balances.get(a.address) || { balance: 0, txCount: 0 };
        return { ...a, balance: info.balance, txCount: info.txCount };
      }).filter(r => r.balance > 0 || r.type === "watch_only" || r.type === "custody")
        .sort((a, b) => b.balance - a.balance);

      const totalOnChain = results.reduce((s, r) => s + r.balance, 0);

      return NextResponse.json({
        error: false,
        addresses: results,
        totalAddresses: allAddresses.length,
        fundedCount: results.filter(r => r.balance > 0).length,
        totalOnChain,
        totalOnChainBTC: (totalOnChain / 100000000).toFixed(8),
        fetchedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ error: true, detail: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: true, detail: msg }, { status: 500 });
  }
}

// GET — HD wallet metadata (no keys)
export async function GET() {
  // Derive first 5 addresses from both paths to show as preview
  const previews: Array<{ path: string; address: string }> = [];
  for (let i = 0; i < 5; i++) {
    try {
      const bip44 = deriveChild(HD_WALLET.xprv, `m/44'/0'/0'/0/${i}`);
      previews.push({ path: `m/44'/0'/0'/0/${i}`, address: bip44.address });
    } catch { /* skip */ }
    try {
      const legacy = deriveChild(HD_WALLET.xprv, `m/0/${i}`);
      previews.push({ path: `m/0/${i}`, address: legacy.address });
    } catch { /* skip */ }
  }

  return NextResponse.json({
    xpub: HD_WALLET.xpub,
    derivationPaths: ["m/44'/0'/0'/0/*", "m/0/*"],
    seedValid: HD_WALLET.seedValid,
    previewAddresses: previews,
    vaultCount: VAULT_WALLETS.length,
    primaryAddress: PRIMARY_ADDRESS,
  });
}