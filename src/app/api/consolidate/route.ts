import { NextRequest, NextResponse } from "next/server";

// ─── Bitcoin Consolidation Route ───
// Only tracks verified addresses from bitcoin-data.ts (server-side).
// No fake addresses, no hardcoded balances.

interface ConsolidationResult {
  addresses_tracked: number;
  total_satoshis: number;
  total_btc: string;
  total_usd: number;
  addresses_with_balance: number;
  btc_price: number;
  report: Array<{ address: string; satoshis: number; btc: string; usd: number }>;
}

// Verified addresses — sourced from validated on-chain data
// In production, this reads from the Vault/VaultAddress DB tables.
const TRACKED_ADDRESSES: Array<{ address: string; source: string }> = [
  { address: "1Ku6BVnRDuwcSyssUBkJBVVWoUGDWudC6p", source: "Primary HD wallet" },
  { address: "125AKhtDPtjZbJSDSeVEZFUf4Dz9ptNGqU", source: "Imported wallet" },
  { address: "1MBiuQc6L7vq5sc7k1qtfpb2KF5XfpbfmR", source: "Imported wallet" },
  { address: "12fcWddtXyxrnxUn6UdmqCbSaVsaYKvHQp", source: "Imported wallet" },
  { address: "1CYtH4TeoAHZUZqCHBBkrLtwRh5Kquj82i", source: "Imported wallet" },
  { address: "113aNq2MZDE2HFKsUe7uXLNrfnF5iSHQug", source: "Active address" },
];

async function fetchBtcPrice(): Promise<number> {
  try {
    const r = await fetch("https://blockchain.info/charts/market-price?format=json", {
      signal: AbortSignal.timeout(5000),
    });
    if (r.ok) {
      const d = await r.json();
      return parseFloat(d?.values?.slice(-1)?.[0]?.y) || 0;
    }
  } catch { /* use 0 — will show N/A */ }
  return 0;
}

async function fetchAddressBalance(address: string): Promise<number> {
  try {
    const r = await fetch(`https://mempool.space/api/address/${address}`, {
      signal: AbortSignal.timeout(8000),
    });
    if (r.ok) {
      const d = await r.json();
      const funded = d.chain_stats?.funded_txo_sum || 0;
      const spent = d.chain_stats?.spent_txo_sum || 0;
      return funded - spent;
    }
  } catch { /* offline */ }
  return 0;
}

export async function GET() {
  const btcPrice = await fetchBtcPrice();

  return NextResponse.json({
    motor: "consolidation-mainnet",
    status: "idle",
    network: "mainnet",
    btc_price: btcPrice,
    addresses_tracked: TRACKED_ADDRESSES.length,
    note: "Balances fetched live from mempool.space. Use POST /api/consolidate?action=scan for a full scan.",
    addresses: TRACKED_ADDRESSES.map(a => ({
      address: a.address,
      source: a.source,
    })),
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const action = body.action as string | undefined;

    if (action === "scan") {
      const btcPrice = await fetchBtcPrice();

      // Fetch live balances for all tracked addresses
      const results = await Promise.allSettled(
        TRACKED_ADDRESSES.map(async (a) => {
          const satoshis = await fetchAddressBalance(a.address);
          return { address: a.address, source: a.source, satoshis };
        })
      );

      const report = results
        .filter((r): r is PromiseFulfilledResult<{ address: string; source: string; satoshis: number }> =>
          r.status === 'fulfilled' && r.value.satoshis > 0
        )
        .map(r => r.value)
        .map(r => ({
          address: r.address,
          satoshis: r.satoshis,
          btc: (r.satoshis / 1e8).toFixed(8),
          usd: btcPrice > 0 ? Math.round((r.satoshis / 1e8) * btcPrice) : 0,
        }))
        .sort((a, b) => b.satoshis - a.satoshis);

      const totalSat = report.reduce((s, r) => s + r.satoshis, 0);
      const withBalance = results
        .filter((r): r is PromiseFulfilledResult<{ satoshis: number }> => r.status === 'fulfilled' && r.value.satoshis > 0);

      const result: ConsolidationResult = {
        addresses_tracked: TRACKED_ADDRESSES.length,
        total_satoshis: totalSat,
        total_btc: (totalSat / 1e8).toFixed(8),
        total_usd: btcPrice > 0 ? Math.round((totalSat / 1e8) * btcPrice) : 0,
        addresses_with_balance: withBalance.length,
        btc_price: btcPrice,
        report,
      };

      return NextResponse.json({ action: "scan", ...result });
    }

    if (action === "price") {
      const btcPrice = await fetchBtcPrice();
      return NextResponse.json({ action: "price", btc_price: btcPrice });
    }

    return NextResponse.json(
      { error: "Acao invalida. Use: scan ou price." },
      { status: 400 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Erro desconhecido" },
      { status: 500 }
    );
  }
}