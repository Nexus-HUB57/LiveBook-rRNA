// ═══════════════════════════════════════════════════════════
// Production Services — Real Data Fetching
// ═══════════════════════════════════════════════════════════

const MEMPOOL_BASE = "https://mempool.space/api";

// ─── Types ───────────────────────────────────────────────
export interface BitcoinNetworkState {
  blockHeight: number;
  btcPrice: number;
  mempoolTxCount: number;
  mempoolVsize: number;
  nextBlockFee: number;
  updatedAt: number;
}

export interface MempoolInfo {
  loaded: boolean;
  vsize: number;
  total_fee: number;
  fee_histogram: number[][];
  n_transactions: number;
}

// ─── BTC Network State ───────────────────────────────────
export async function fetchBlockHeight(): Promise<number> {
  const res = await fetch(`${MEMPOOL_BASE}/blocks/tip/height`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Block height fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchBTCPrice(): Promise<number> {
  const res = await fetch(`${MEMPOOL_BASE}/v1/prices`, { cache: "no-store" });
  if (!res.ok) throw new Error(`BTC price fetch failed: ${res.status}`);
  const data = await res.json();
  return data.USD || 0;
}

export async function fetchMempoolInfo(): Promise<MempoolInfo> {
  const res = await fetch(`${MEMPOOL_BASE}/mempool`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Mempool fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchFullNetworkState(): Promise<BitcoinNetworkState> {
  const [blockHeight, priceData, mempool] = await Promise.allSettled([
    fetchBlockHeight(),
    fetchBTCPrice(),
    fetchMempoolInfo(),
  ]);

  return {
    blockHeight: blockHeight.status === "fulfilled" ? blockHeight.value : 0,
    btcPrice: priceData.status === "fulfilled" ? priceData.value : 0,
    mempoolTxCount: mempool.status === "fulfilled" ? mempool.value.n_transactions : 0,
    mempoolVsize: mempool.status === "fulfilled" ? mempool.value.vsize : 0,
    nextBlockFee: mempool.status === "fulfilled" && mempool.value.fee_histogram?.[0]
      ? mempool.value.fee_histogram[0][0]
      : 0,
    updatedAt: Date.now(),
  };
}

// ─── UTXO Fetching ───────────────────────────────────────
export interface MempoolUTXO {
  txid: string;
  vout: number;
  status: {
    confirmed: boolean;
    block_height?: number;
    block_hash?: string;
    block_time?: number;
  };
  value: number;
}

export interface AddressData {
  address: {
    chain_stats: {
      funded_txo_count: number;
      funded_txo_sum: number;
      spent_txo_count: number;
      spent_txo_sum: number;
      tx_count: number;
    };
    mempool_stats: {
      funded_txo_count: number;
      funded_txo_sum: number;
      spent_txo_count: number;
      spent_txo_sum: number;
      tx_count: number;
    };
  };
}

export async function fetchAddressUTXOs(address: string): Promise<MempoolUTXO[]> {
  const res = await fetch(`${MEMPOOL_BASE}/address/${address}/utxo`, { cache: "no-store" });
  if (!res.ok) throw new Error(`UTXO fetch failed: ${res.status}`);
  return res.json();
}

export async function fetchAddressData(address: string): Promise<AddressData> {
  const res = await fetch(`${MEMPOOL_BASE}/address/${address}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Address data fetch failed: ${res.status}`);
  return res.json();
}

// ─── LLM Agent Call (real) ──────────────────────────────
export async function callOrchestrateAPI(task: string, agent?: string): Promise<{
  result: string;
  agentCalls?: string[];
  orchestrator?: string;
}> {
  const body: Record<string, string> = { task };
  if (agent) body.agent = agent;

  const res = await fetch("/api/orchestrate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "Unknown error");
    throw new Error(`Orchestrate API error ${res.status}: ${errText}`);
  }

  return res.json();
}

// ─── Polling Hook Factory ────────────────────────────────
export function startPolling(fn: () => Promise<void>, intervalMs: number): () => void {
  let stopped = false;
  const run = async () => {
    while (!stopped) {
      try { await fn(); } catch { /* silent — data will show last known good */ }
      await new Promise(r => setTimeout(r, intervalMs));
    }
  };
  run();
  return () => { stopped = true; };
}