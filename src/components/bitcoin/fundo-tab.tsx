"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useEcosystem } from "@/contexts/ecosystem-context";
import {
  FUND_ADDRESSES, FUND_TOTAL_BTC, BLACKHOLE, WORMHOLE_ENDPOINTS,
  PRIMARY_BTC_BALANCE, PRIMARY_UNSPENT_BALANCE,
  satToBTC,
} from "./bitcoin-data";
import { formatNumber } from "@/components/moltbook/data";

// ============================================================
// FUNDO TAB — Wormhole + Blackhole Architecture
// ============================================================

function useCopyToClipboard() {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const copy = useCallback((id: string, text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    setCopiedId(id);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setCopiedId(null), 1800);
  }, []);

  return { copiedId, copy };
}

function CopyBtn({ id, text, onCopy, copiedId }: { id: string; text: string; onCopy: (id: string, text: string) => void; copiedId: string | null }) {
  const isCopied = copiedId === id;
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onCopy(id, text); }}
      className={`flex-shrink-0 w-7 h-7 flex items-center justify-center rounded-md transition-all duration-200 cursor-pointer ${
        isCopied
          ? "bg-[#06d6a0]/20 text-[#06d6a0] scale-110"
          : "bg-[#343536]/50 text-[#555] hover:bg-[#343536] hover:text-[#888] opacity-0 group-hover:opacity-100"
      }`}
      title={isCopied ? "Copied!" : "Copy"}
    >
      {isCopied ? (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
      ) : (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
      )}
    </button>
  );
}

export default function FundoTab() {
  const { copiedId, copy } = useCopyToClipboard();
  const eco = useEcosystem();
  const [expandedSection, setExpandedSection] = useState<string | null>("fund-whales");
  const [liveFundBalances, setLiveFundBalances] = useState<Map<string, { balance: number; txCount: number }>>(new Map());
  const [loadingFund, setLoadingFund] = useState(false);
  const [fundFetchedAt, setFundFetchedAt] = useState<string | null>(null);

  const toggleSection = (id: string) => setExpandedSection(prev => prev === id ? null : id);

  const fetchFundBalances = useCallback(async () => {
    setLoadingFund(true);
    try {
      const addrs = FUND_ADDRESSES.map(f => f.address);
      const results = new Map<string, { balance: number; txCount: number }>();
      for (let i = 0; i < addrs.length; i += 3) {
        const batch = addrs.slice(i, i + 3).join("|");
        try {
          const res = await fetch(`https://blockchain.info/balance?active=${batch}`, {
            headers: { "User-Agent": "Mozilla/5.0" },
            signal: AbortSignal.timeout(15000),
          });
          if (res.ok) {
            const data = await res.json() as Record<string, { final_balance: number; n_tx: number }>;
            for (const addr of addrs.slice(i, i + 3)) {
              const info = data[addr];
              if (info) results.set(addr, { balance: info.final_balance, txCount: info.n_tx });
            }
          }
        } catch { /* skip */ }
      }
      setLiveFundBalances(results);
      setFundFetchedAt(new Date().toISOString());
    } finally {
      setLoadingFund(false);
    }
  }, []);

  useEffect(() => { fetchFundBalances(); }, [fetchFundBalances]);

  const fundTotalLive = FUND_ADDRESSES.reduce((s, f) => {
    const live = liveFundBalances.get(f.address);
    return s + (live ? live.balance : f.balance);
  }, 0);

  const signableEndpoints = WORMHOLE_ENDPOINTS.filter(e => e.status === "signable");
  const watchEndpoints = WORMHOLE_ENDPOINTS.filter(e => e.status === "watch_only");
  const fundEndpoints = WORMHOLE_ENDPOINTS.filter(e => e.category === "fund");
  const vaultEndpoints = WORMHOLE_ENDPOINTS.filter(e => e.category === "vault");
  const totalWormholeBTC = WORMHOLE_ENDPOINTS.reduce((s, e) => s + e.balance, 0) / 100000000;

  return (
    <div className="p-4 sm:p-6 space-y-5">

      {/* ===== HERO: Fund Total ===== */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#a855f7]/20 via-[#1a1a1b] to-[#6366f1]/10 border border-[#a855f7]/30 rounded-2xl p-5 sm:p-6 group hover:border-[#a855f7]/50 transition-colors duration-300">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-[#a855f7]/10 animate-pulse" />
        <div className="relative">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <p className="text-[#a855f7] text-xs font-bold uppercase tracking-wider">Fundo Total</p>
              <span className="px-1.5 py-0.5 bg-[#e01b24]/10 text-[#e01b24] text-[9px] rounded font-bold">{FUND_ADDRESSES.length} WHALE</span>
              {fundFetchedAt && <span className="px-1.5 py-0.5 bg-[#06d6a0]/10 text-[#06d6a0] text-[9px] rounded font-bold animate-pulse">LIVE</span>}
              {loadingFund && <span className="w-3 h-3 border-2 border-[#a855f7]/30 border-t-[#a855f7] rounded-full animate-spin" />}
            </div>
            <button onClick={fetchFundBalances} disabled={loadingFund}
              className="flex items-center gap-1 px-2 py-1 text-[10px] bg-[#343536]/50 hover:bg-[#343536] text-[#888] hover:text-white rounded-lg transition-colors cursor-pointer disabled:opacity-50">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
              Refresh
            </button>
          </div>
          <div className="flex items-baseline gap-3">
            <span className="text-3xl sm:text-4xl font-bold text-white tabular-nums tracking-tight">
              {(fundTotalLive / 100000000).toFixed(2)}
            </span>
            <span className="text-lg sm:text-xl text-[#a855f7] font-medium">BTC</span>
          </div>
          <p className="text-[#888] text-sm mt-1.5">
            <span className="text-[#ccc]">~${formatNumber(Math.round(fundTotalLive / 100000000 * eco.btcPrice))} USD</span>
            <span className="mx-2 text-[#555]">{"\u00B7"}</span>
            <span>{FUND_ADDRESSES.length} enderecos {"\u00B7"} 2,000 BTC cada</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-lg bg-[#a855f7]/10 text-[#a855f7] font-medium">Era 2013</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#e01b24]/10 text-[#e01b24] font-medium">P2PKH</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#343536] text-[#888]">Wormhole Nativo</span>
            <span className="px-2.5 py-1 rounded-lg bg-[#f7931a]/10 text-[#f7931a] font-medium">WIF Architecture</span>
          </div>
          {fundFetchedAt && (
            <p className="text-[#555] text-[10px] mt-2">Atualizado: {new Date(fundFetchedAt).toLocaleTimeString()}</p>
          )}
        </div>
      </div>

      {/* ===== WORMHOLE + BLACKHOLE FLOW ===== */}
      <div className="bg-[#272729] rounded-xl border border-[#a855f7]/20 p-4">
        <p className="text-xs text-[#888] uppercase tracking-wider mb-4 font-medium">Arquitetura Wormhole {"\u2192"} Blackhole</p>
        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {/* WORMHOLE SOURCE */}
          <div className="flex-1 bg-gradient-to-br from-[#a855f7]/10 to-[#1a1a1b] rounded-xl p-4 border border-[#a855f7]/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#a855f7]/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#a855f7" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" /><path d="M2 12h20" /></svg>
              </div>
              <div>
                <p className="text-white text-xs font-bold">WORMHOLE</p>
                <p className="text-[#a855f7] text-[9px]">{WORMHOLE_ENDPOINTS.length} endpoints</p>
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#888]">Fund (Whale)</span>
                <span className="text-[#a855f7] font-bold">{fundEndpoints.length} addr</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#888]">Vault (WIF)</span>
                <span className="text-[#06d6a0] font-bold">{vaultEndpoints.length} signable</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#888]">Watch-Only</span>
                <span className="text-[#f7931a] font-bold">{watchEndpoints.length} tracked</span>
              </div>
              <div className="border-t border-[#343536] pt-1.5 mt-1.5">
                <div className="flex items-center justify-between text-[10px]">
                  <span className="text-white font-medium">Total Wormhole</span>
                  <span className="text-[#a855f7] font-bold">{totalWormholeBTC.toFixed(2)} BTC</span>
                </div>
              </div>
            </div>
          </div>

          {/* FLOW ARROW */}
          <div className="hidden sm:flex flex-col items-center justify-center gap-1 px-2">
            <div className="w-12 h-0.5 bg-gradient-to-r from-[#a855f7] to-[#f0b90b] rounded-full" />
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b90b" strokeWidth="2" strokeLinecap="round"><path d="M5 12h14" /><path d="m12 5 7 7-7 7" /></svg>
            <p className="text-[8px] text-[#555] font-bold uppercase">WIF</p>
            <p className="text-[8px] text-[#555] font-bold uppercase">PSBT</p>
            <div className="w-12 h-0.5 bg-gradient-to-r from-[#a855f7] to-[#f0b90b] rounded-full" />
          </div>
          <div className="sm:hidden flex items-center justify-center py-1">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f0b90b" strokeWidth="2" strokeLinecap="round"><path d="M12 5v14" /><path d="m19 12-7 7-7-7" /></svg>
            <p className="text-[8px] text-[#555] font-bold uppercase ml-2">WIF {"\u2192"} PSBT {"\u2192"} Blackhole</p>
          </div>

          {/* BLACKHOLE SINK */}
          <div className="flex-1 bg-gradient-to-br from-[#f0b90b]/10 to-[#1a1a1b] rounded-xl p-4 border border-[#f0b90b]/20">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-lg bg-[#f0b90b]/20 flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f0b90b" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="4" /><line x1="4.93" y1="4.93" x2="9.17" y2="9.17" /><line x1="14.83" y1="14.83" x2="19.07" y2="19.07" /><line x1="14.83" y1="9.17" x2="19.07" y2="4.93" /><line x1="14.83" y1="9.17" x2="18.36" y2="5.64" /><line x1="4.93" y1="19.07" x2="9.17" y2="14.83" /></svg>
              </div>
              <div>
                <p className="text-white text-xs font-bold">BLACKHOLE</p>
                <p className="text-[#f0b90b] text-[9px]">{BLACKHOLE.label}</p>
              </div>
            </div>
            <div className="bg-[#1a1a1b] rounded-lg p-2.5 mb-2">
              <div className="flex items-center gap-2">
                <code className="text-[10px] text-[#f0b90b] font-mono truncate flex-1">{BLACKHOLE.address}</code>
                <CopyBtn id="blackhole-addr" text={BLACKHOLE.address} onCopy={copy} copiedId={copiedId} />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#888]">Tipo</span>
                <span className="text-[#f0b90b] font-bold">{BLACKHOLE.type.toUpperCase()}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#888]">Rede</span>
                <span className="text-white font-bold">{BLACKHOLE.network}</span>
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#888]">Destino</span>
                <span className="px-2 py-0.5 bg-[#e01b24]/10 text-[#e01b24] text-[9px] rounded font-bold">IMUTAVEL</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FUND WHALE ADDRESSES ===== */}
      <div className="bg-[#272729] rounded-xl border border-[#a855f7]/20 overflow-hidden">
        <button onClick={() => toggleSection("fund-whales")}
          className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer group">
          <div className="flex items-center gap-2">
            <span className="text-base">{"\u{1F30A}"}</span>
            <h3 className="text-white text-sm font-bold">Whale Fund Addresses</h3>
            <span className="px-2 py-0.5 bg-[#e01b24]/10 text-[#e01b24] text-[10px] rounded font-bold">{FUND_ADDRESSES.length} x 2,000 BTC</span>
            <span className="px-2 py-0.5 bg-[#a855f7]/10 text-[#a855f7] text-[10px] rounded font-bold">Wormhole</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#a855f7] font-bold tabular-nums">{FUND_TOTAL_BTC.toLocaleString()} BTC</span>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
              className={`text-[#555] transition-transform duration-200 ${expandedSection === "fund-whales" ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
          </div>
        </button>

        {expandedSection === "fund-whales" && (
          <div className="px-4 pb-4 border-t border-[#a855f7]/20" style={{ animation: "fade-in-up 0.2s ease-out" }}>
            <div className="pt-3 space-y-2 max-h-[400px] overflow-y-auto">
              {FUND_ADDRESSES.map((fa, i) => {
                const live = liveFundBalances.get(fa.address);
                const balanceBTC = live ? (live.balance / 100000000).toFixed(8) : fa.balanceBTC;
                const txCount = live ? live.txCount : fa.txCount;
                return (
                  <div key={fa.address} className="bg-[#1a1a1b] rounded-lg p-3 border border-[#343536]/50 hover:border-[#a855f7]/30 transition-colors group">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-[10px] text-[#a855f7] font-bold w-5 tabular-nums flex-shrink-0">{i + 1}</span>
                        <div className="w-6 h-6 rounded-full bg-[#a855f7]/10 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px]">{"\u{1F30A}"}</span>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <code className="text-[10px] text-white font-mono truncate">{fa.address}</code>
                            <CopyBtn id={`fund-${i}`} text={fa.address} onCopy={copy} copiedId={copiedId} />
                          </div>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className="text-[8px] text-[#555]">Primeira tx: {fa.firstTx}</span>
                            <span className="text-[8px] text-[#555]">{"\u00B7"}</span>
                            <span className="text-[8px] text-[#555]">Ultima tx: {fa.lastTx}</span>
                            <span className="text-[8px] text-[#555]">{"\u00B7"}</span>
                            <span className="text-[8px] text-[#555]">{txCount} txs</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm text-[#a855f7] font-bold tabular-nums">{balanceBTC}</p>
                        <p className="text-[10px] text-[#a855f7]/60">BTC</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className="px-2 py-0.5 bg-[#f7931a]/10 text-[#f7931a] text-[9px] rounded font-bold">P2PKH</span>
                      <span className="px-2 py-0.5 bg-[#343536] text-[#888] text-[9px] rounded">{fa.supplyPercent} suprimento</span>
                      <span className="px-2 py-0.5 bg-[#a855f7]/10 text-[#a855f7] text-[9px] rounded font-bold">WORMHOLE</span>
                      <span className="text-[9px] text-[#555]">~${formatNumber(Math.round(fa.balance / 100000000 * eco.btcPrice))}</span>
                      <a href={`https://blockchain.info/address/${fa.address}`} target="_blank" rel="noopener noreferrer"
                        className="ml-auto inline-flex items-center gap-1 text-[9px] text-[#555] hover:text-[#f7931a] transition-colors">
                        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" /><polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" /></svg>
                        blockchain.info
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ===== WIF ENDPOINTS ===== */}
      <div className="bg-[#272729] rounded-xl border border-[#06d6a0]/20 overflow-hidden">
        <button onClick={() => toggleSection("wif-signable")}
          className="w-full flex items-center justify-between px-4 py-3.5 cursor-pointer group">
          <div className="flex items-center gap-2">
            <span className="text-base">{"\u{1F511}"}</span>
            <h3 className="text-white text-sm font-bold">WIF Signable Endpoints</h3>
            <span className="px-2 py-0.5 bg-[#06d6a0]/10 text-[#06d6a0] text-[10px] rounded font-bold">{signableEndpoints.length} chaves</span>
          </div>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            className={`text-[#555] transition-transform duration-200 ${expandedSection === "wif-signable" ? "rotate-180" : ""}`}><polyline points="6 9 12 15 18 9" /></svg>
        </button>

        {expandedSection === "wif-signable" && (
          <div className="px-4 pb-4 border-t border-[#06d6a0]/20" style={{ animation: "fade-in-up 0.2s ease-out" }}>
            <div className="pt-3">
              <p className="text-[10px] text-[#555] mb-3">
                Wallet Import Format (WIF) {"\u2014"} chaves privadas que permitem assinar transacoes via Wormhole para o Blackhole.
                Fluxo: WIF decode {"\u2192"} secp256k1 sign {"\u2192"} PSBT {"\u2192"} broadcast {"\u2192"} Blackhole (Binance bc1q)
              </p>
              <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                {signableEndpoints.map((ep, i) => (
                  <div key={ep.address} className="flex items-center gap-2 bg-[#1a1a1b] rounded-lg px-2.5 py-2 hover:bg-[#343536]/50 transition-colors">
                    <span className="text-[9px] text-[#06d6a0] w-5 tabular-nums text-right flex-shrink-0">{i + 1}</span>
                    <span className="text-[9px] text-[#888] w-24 truncate flex-shrink-0">{ep.label}</span>
                    <code className="text-[10px] text-white font-mono truncate flex-1">{ep.address}</code>
                    <span className="px-1.5 py-0.5 bg-[#06d6a0]/10 text-[#06d6a0] text-[8px] rounded font-bold flex-shrink-0">WIF</span>
                    <CopyBtn id={`wif-ep-${i}`} text={ep.address} onCopy={copy} copiedId={copiedId} />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ===== WORMHOLE STATS ===== */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Wormhole Endpoints", value: String(WORMHOLE_ENDPOINTS.length), sub: "total tracked", color: "#a855f7" },
          { label: "Signable (WIF)", value: String(signableEndpoints.length), sub: "PSBT ready", color: "#06d6a0" },
          { label: "Fund Balance", value: `${(fundTotalLive / 100000000).toFixed(0)} BTC`, sub: `~$${formatNumber(Math.round(fundTotalLive / 100000000 * eco.btcPrice))}`, color: "#e01b24" },
          { label: "Blackhole", value: "IMUTAVEL", sub: "bc1q Binance", color: "#f0b90b" },
        ].map((s, i) => (
          <div key={s.label} className="bg-[#272729] rounded-xl p-3 border border-[#343536] hover:border-[#555] transition-all duration-200 h-full">
            <p className="text-[10px] text-[#888] uppercase tracking-wider">{s.label}</p>
            <p className="text-sm font-bold tabular-nums mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[#555] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>

      {/* ===== NUCLEO + FUNDO CONSOLIDATED ===== */}
      <div className="bg-gradient-to-r from-[#f7931a]/5 via-[#272729] to-[#a855f7]/5 rounded-xl border border-[#343536] p-4">
        <p className="text-xs text-[#888] uppercase tracking-wider mb-3 font-medium">Consolidacao Total</p>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <p className="text-[10px] text-[#555]">Nucleo (Primary)</p>
            <p className="text-white text-sm font-bold tabular-nums">{PRIMARY_BTC_BALANCE} BTC</p>
          </div>
          <div>
            <p className="text-[10px] text-[#555]">Fundo (Whale)</p>
            <p className="text-[#a855f7] text-sm font-bold tabular-nums">{(fundTotalLive / 100000000).toFixed(2)} BTC</p>
          </div>
          <div>
            <p className="text-[10px] text-[#555]">Wormhole Total</p>
            <p className="text-[#f7931a] text-sm font-bold tabular-nums">{(totalWormholeBTC + fundTotalLive / 100000000).toFixed(2)} BTC</p>
          </div>
        </div>
      </div>
    </div>
  );
}