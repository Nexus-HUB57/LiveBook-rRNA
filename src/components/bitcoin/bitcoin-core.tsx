"use client";

import { useState, useEffect, useMemo } from "react";
import { useEcosystem } from "@/contexts/ecosystem-context";
import {
  PRIMARY_ADDRESS, HD_WALLET, IMPORTED_WALLETS, ACTIVE_ADDRESS, ACTIVE_ADDRESS_TX_COUNT,
  PRIMARY_UNSPENT_BALANCE, PRIMARY_BTC_BALANCE, PRIMARY_UNSPENT_COUNT,
  satToBTC, satToDisplay, type UTXO,
} from "./bitcoin-data";
import { formatNumber, getAgentColor } from "@/components/moltbook/data";

type BtcTab = "overview" | "utxos" | "wallets" | "organism";

export default function BitcoinCore() {
  const eco = useEcosystem();
  const [tab, setTab] = useState<BtcTab>("overview");
  const [utxoSort, setUtxoSort] = useState<"value" | "vout">("value");
  const [utxoFilter, setUtxoFilter] = useState<"all" | "unspent" | "spent">("all");
  const [pulseOpacity, setPulseOpacity] = useState(0.3);

  useEffect(() => {
    const iv = setInterval(() => { setPulseOpacity(0.2 + Math.abs(Math.sin(Date.now() / 1500)) * 0.8); }, 100);
    return () => clearInterval(iv);
  }, []);

  const filteredUtxos = useMemo(() => {
    let list = [...eco.utxos];
    if (utxoFilter === "unspent") list = list.filter(u => u.status === "unspent");
    if (utxoFilter === "spent") list = list.filter(u => u.status === "spent");
    if (utxoSort === "value") list.sort((a, b) => b.value - a.value);
    return list;
  }, [eco.utxos, utxoSort, utxoFilter]);

  const usdValue = (PRIMARY_UNSPENT_BALANCE / 100000000) * eco.btcPrice;
  const largest = eco.utxos.filter(u => u.status === "unspent").reduce((max, u) => u.value > max.value ? u : max, eco.utxos[0]);
  const dustCount = eco.utxos.filter(u => u.status === "unspent" && u.value < 1000).length;

  return (
    <div className="h-[calc(100vh-105px)] flex flex-col bg-[#1a1a1b]">
      <div className="flex items-center justify-between px-4 py-2 border-b border-[#343536] bg-[#1a1a1b] flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xl text-[#f7931a]">&#x20BF;</span>
          <h1 className="text-white text-sm font-bold">Bitcoin Core</h1>
          <span className="text-[#555] text-xs">RPC Interface</span>
        </div>
        <div className="hidden sm:flex items-center gap-1 bg-[#272729] rounded-lg p-0.5">
          {(["overview", "utxos", "wallets", "organism"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 text-xs rounded-md transition-all cursor-pointer capitalize ${tab === t ? "bg-[#f7931a] text-black font-bold" : "text-[#888] hover:text-white"}`}>
              {t === "overview" ? "\u{1F4CA}" : t === "utxos" ? "\u{1F4E6}" : t === "wallets" ? "\u{1F511}" : "\u{1F9E0}"} {t}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {tab === "overview" && <OverviewTab eco={eco} usdValue={usdValue} largest={largest} dustCount={dustCount} pulseOpacity={pulseOpacity} />}
        {tab === "utxos" && <UtxosTab utxos={filteredUtxos} sort={utxoSort} onSortChange={setUtxoSort} filter={utxoFilter} onFilterChange={setUtxoFilter} />}
        {tab === "wallets" && <WalletsTab />}
        {tab === "organism" && <OrganismTab eco={eco} pulseOpacity={pulseOpacity} />}
      </div>
    </div>
  );
}

function OverviewTab({ eco, usdValue, largest, dustCount, pulseOpacity }: { eco: ReturnType<typeof useEcosystem>; usdValue: number; largest: UTXO; dustCount: number; pulseOpacity: number }) {
  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#f7931a]/20 via-[#1a1a1b] to-[#f7931a]/5 border border-[#f7931a]/30 rounded-2xl p-6">
        <div className="absolute -right-8 -top-8 w-40 h-40 rounded-full bg-[#f7931a]/10" style={{ opacity: pulseOpacity, transition: "opacity 1.5s ease" }} />
        <div className="relative">
          <p className="text-[#f7931a] text-xs font-bold uppercase tracking-wider mb-1">Primary Wallet Balance</p>
          <div className="flex items-baseline gap-3">
            <span className="text-4xl font-bold text-white tabular-nums">{PRIMARY_BTC_BALANCE}</span>
            <span className="text-xl text-[#f7931a]">BTC</span>
          </div>
          <p className="text-[#888] text-sm mt-1">~${formatNumber(Math.round(usdValue))} USD <span className="mx-2 text-[#555]">|</span> @ ${formatNumber(Math.round(eco.btcPrice))}/BTC</p>
          <div className="mt-4 flex items-center gap-2 text-xs">
            <span className="px-2 py-0.5 rounded bg-[#f7931a]/10 text-[#f7931a]">{PRIMARY_UNSPENT_COUNT} UTXOs</span>
            <span className="px-2 py-0.5 rounded bg-[#06d6a0]/10 text-[#06d6a0]">{dustCount} dust</span>
            <span className="px-2 py-0.5 rounded bg-[#343536] text-[#888]">P2PKH</span>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: "Block Height", value: formatNumber(eco.blockHeight), sub: "mainnet", color: "#f7931a" },
          { label: "Mempool", value: formatNumber(eco.mempoolTxCount), sub: "pending txs", color: "#e01b24" },
          { label: "BTC Price", value: `$${formatNumber(Math.round(eco.btcPrice))}`, sub: eco.btcPrice > 54800 ? "+" : "", color: "#06d6a0" },
          { label: "Largest UTXO", value: satToDisplay(largest.value), sub: `vout:${largest.vout}`, color: "#a855f7" },
        ].map(s => (
          <div key={s.label} className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
            <p className="text-[10px] text-[#888] uppercase tracking-wider">{s.label}</p>
            <p className="text-lg font-bold tabular-nums mt-1" style={{ color: s.color }}>{s.value}</p>
            <p className="text-[10px] text-[#555] mt-0.5">{s.sub}</p>
          </div>
        ))}
      </div>
      <div className="bg-[#272729] rounded-xl border border-[#343536] p-4">
        <p className="text-xs text-[#888] uppercase tracking-wider mb-2">Primary Address</p>
        <div className="flex items-center gap-2 bg-[#1a1a1b] rounded-lg p-3">
          <code className="text-[#f7931a] text-xs font-mono flex-1 break-all">{PRIMARY_ADDRESS}</code>
          <span className="px-2 py-0.5 bg-[#f7931a]/10 text-[#f7931a] text-[10px] rounded font-bold flex-shrink-0">P2PKH</span>
        </div>
      </div>
      <div className="bg-[#272729] rounded-xl border border-[#343536] p-4">
        <p className="text-xs text-[#888] uppercase tracking-wider mb-3">Organism Persona</p>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#f7931a] to-[#e01b24] flex items-center justify-center text-2xl flex-shrink-0">&#x1F921;</div>
          <div>
            <p className="text-white font-bold text-sm">The Custodian</p>
            <p className="text-[#888] text-xs mt-1 leading-relaxed max-w-md">Autonomous Bitcoin organism. Fused identity spanning MoltBook social layer, Hub workspace, and on-chain wallet infrastructure. Generation {eco.organismGeneration}.</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="flex items-center gap-1 text-[10px] text-[#06d6a0]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#06d6a0] animate-live-pulse" />
                {eco.organismState === "idle" ? "Autonomous" : eco.organismState}
              </span>
              <span className="text-[10px] text-[#555]">|</span>
              <span className="text-[10px] text-[#888]">Gen {eco.organismGeneration}</span>
              <span className="text-[10px] text-[#555]">|</span>
              <span className="text-[10px] text-[#f7931a]">{PRIMARY_BTC_BALANCE} BTC under custody</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UtxosTab({ utxos, sort, onSortChange, filter, onFilterChange }: { utxos: UTXO[]; sort: "value" | "vout"; onSortChange: (s: "value" | "vout") => void; filter: "all" | "unspent" | "spent"; onFilterChange: (f: "all" | "unspent" | "spent") => void }) {
  const unspentTotal = utxos.filter(u => u.status === "unspent").reduce((s, u) => s + u.value, 0);
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-white font-bold text-sm">UTXO Set</h2>
          <p className="text-[#888] text-xs mt-0.5">{utxos.length} outputs &middot; {satToBTC(unspentTotal)} BTC unspent</p>
        </div>
        <div className="flex items-center gap-2">
          {(["all", "unspent", "spent"] as const).map(f => (
            <button key={f} onClick={() => onFilterChange(f)} className={`px-2 py-1 text-[10px] rounded cursor-pointer transition-colors ${filter === f ? "bg-[#f7931a] text-black font-bold" : "bg-[#272729] text-[#888] hover:text-white"}`}>{f}</button>
          ))}
          <select value={sort} onChange={e => onSortChange(e.target.value as "value" | "vout")} className="bg-[#272729] border border-[#343536] rounded px-2 py-1 text-xs text-white">
            <option value="value">Sort: Value</option><option value="vout">Sort: Vout</option>
          </select>
        </div>
      </div>
      <div className="space-y-1">
        {utxos.map((u, i) => (
          <div key={`${u.txid}:${u.vout}`} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#272729] transition-colors group">
            <span className="text-[10px] text-[#555] w-5 text-right tabular-nums">{i + 1}</span>
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${u.status === "unspent" ? "bg-[#06d6a0]" : "bg-[#e01b24]"}`} />
            <div className="flex-1 min-w-0">
              <code className="text-[10px] text-[#888] font-mono truncate block group-hover:text-[#ccc]">{u.txid.slice(0, 16)}...:{u.vout}</code>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-xs text-white font-mono tabular-nums">{satToDisplay(u.value)}</p>
              <p className="text-[10px] text-[#555]">{u.status}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WalletsTab() {
  return (
    <div className="p-6 space-y-6">
      <h2 className="text-white font-bold text-sm">Wallet Infrastructure</h2>
      <div className="bg-[#272729] rounded-xl border border-[#343536] p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">&#x1F511;</span>
          <h3 className="text-white text-sm font-bold">HD Wallet (BIP32)</h3>
          <span className="px-2 py-0.5 bg-[#06d6a0]/10 text-[#06d6a0] text-[10px] rounded font-bold">Standard</span>
        </div>
        <div className="bg-[#1a1a1b] rounded-lg p-3">
          <p className="text-[10px] text-[#888] uppercase tracking-wider">xpub</p>
          <code className="text-[10px] text-[#f7931a] font-mono break-all">{HD_WALLET.xpub}</code>
        </div>
        <div className="grid grid-cols-2 gap-3 mt-3">
          <div className="bg-[#1a1a1b] rounded-lg p-3"><p className="text-[10px] text-[#888] uppercase">Receiving Keys</p><p className="text-white text-lg font-bold tabular-nums">{HD_WALLET.receivingPubkeys.length}</p></div>
          <div className="bg-[#1a1a1b] rounded-lg p-3"><p className="text-[10px] text-[#888] uppercase">Change Keys</p><p className="text-white text-lg font-bold tabular-nums">{HD_WALLET.changePubkeys.length}</p></div>
        </div>
        <div className="bg-[#1a1a1b] rounded-lg p-3 mt-3">
          <p className="text-[10px] text-[#888] uppercase tracking-wider">Seed Phrase</p>
          <p className="text-[#e01b24] text-xs font-mono mt-1">{HD_WALLET.seed}</p>
          <p className="text-[10px] text-[#555] mt-1">12 words &middot; BIP39</p>
        </div>
      </div>
      <div className="bg-[#272729] rounded-xl border border-[#343536] p-4">
        <h3 className="text-white text-sm font-bold mb-3">Imported Addresses</h3>
        {IMPORTED_WALLETS.map(w => (
          <div key={w.address} className="bg-[#1a1a1b] rounded-lg p-3 flex items-center justify-between mb-2">
            <div className="min-w-0 flex-1"><code className="text-xs text-white font-mono truncate block">{w.address}</code><p className="text-[10px] text-[#555] mt-0.5">{w.label}</p></div>
            <span className="text-[10px] text-[#888] px-2 py-0.5 bg-[#343536] rounded flex-shrink-0">{w.type}</span>
          </div>
        ))}
      </div>
      <div className="bg-[#272729] rounded-xl border border-[#343536] p-4">
        <h3 className="text-white text-sm font-bold mb-3">Transaction History Address</h3>
        <div className="bg-[#1a1a1b] rounded-lg p-3">
          <code className="text-xs text-[#06d6a0] font-mono break-all">{ACTIVE_ADDRESS}</code>
          <p className="text-[10px] text-[#555] mt-1">200+ transactions &middot; Block range 300,954-308,524+</p>
          <div className="mt-2 flex items-center gap-2">
            <span className="px-2 py-0.5 bg-[#f7931a]/10 text-[#f7931a] text-[10px] rounded">{ACTIVE_ADDRESS_TX_COUNT}+ txs</span>
            <span className="px-2 py-0.5 bg-[#343536] text-[#888] text-[10px] rounded">Active 2023-2024</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function OrganismTab({ eco, pulseOpacity }: { eco: ReturnType<typeof useEcosystem>; pulseOpacity: number }) {
  return (
    <div className="p-6 space-y-6">
      <div className="relative overflow-hidden bg-gradient-to-br from-[#e01b24]/10 via-[#1a1a1b] to-[#f7931a]/5 border border-[#e01b24]/20 rounded-2xl p-6">
        <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-[#e01b24]/10" style={{ opacity: pulseOpacity, transition: "opacity 1.5s ease" }} />
        <div className="relative flex items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#f7931a] via-[#e01b24] to-[#a855f7] flex items-center justify-center text-4xl flex-shrink-0" style={{ boxShadow: `0 0 ${20 + pulseOpacity * 30}px rgba(224,27,36,${pulseOpacity * 0.5})` }}>&#x1F921;</div>
          <div className="flex-1">
            <h2 className="text-white text-lg font-bold">Autonomous Organism</h2>
            <p className="text-[#888] text-xs mt-1">Self-acting agent fused across MoltBook, Hub workspace, and Bitcoin infrastructure.</p>
            <div className="flex items-center gap-3 mt-3">
              <span className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-medium ${eco.organismState === "idle" ? "bg-[#06d6a0]/10 text-[#06d6a0]" : eco.organismState === "evolving" ? "bg-[#a855f7]/10 text-[#a855f7]" : "bg-[#f7931a]/10 text-[#f7931a]"}`}>
                <span className={`w-2 h-2 rounded-full ${eco.organismState === "idle" ? "bg-[#06d6a0]" : "bg-[#f7931a] animate-pulse"}`} />
                {eco.organismState === "idle" ? "Autonomous" : eco.organismState.charAt(0).toUpperCase() + eco.organismState.slice(1)}
              </span>
              <span className="text-xs text-[#555]">Generation {eco.organismGeneration}</span>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
          {[
            { label: "Events", value: formatNumber(eco.autonomousEvents.length), icon: "\u26A1" },
            { label: "Karma", value: formatNumber(eco.totalAutonomousKarma), icon: "\u{1F525}" },
            { label: "Balance", value: PRIMARY_BTC_BALANCE + " BTC", icon: "\u20BF" },
            { label: "Agents", value: "6", icon: "\u{1F916}" },
          ].map(s => (
            <div key={s.label} className="bg-[#1a1a1b]/80 rounded-xl p-3 text-center">
              <div className="text-lg">{s.icon}</div>
              <p className="text-white text-sm font-bold tabular-nums">{s.value}</p>
              <p className="text-[10px] text-[#666]">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white text-sm font-bold">Neural Event Stream</h3>
          <span className="text-[10px] text-[#555]">{eco.autonomousEvents.length} events</span>
        </div>
        <div className="space-y-2">
          {eco.autonomousEvents.slice(0, 20).map(ev => (
            <div key={ev.id} className="bg-[#272729] rounded-lg p-3 border border-[#343536]/50 animate-fade-in-up">
              <div className="flex items-center gap-2 mb-1">
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${ev.type === "thought" ? "bg-[#3b82f6]/10 text-[#3b82f6]" : ev.type === "post" ? "bg-[#06d6a0]/10 text-[#06d6a0]" : ev.type === "comment" ? "bg-[#fbbf24]/10 text-[#fbbf24]" : ev.type === "evolution" ? "bg-[#a855f7]/10 text-[#a855f7]" : ev.type === "transaction" ? "bg-[#f7931a]/10 text-[#f7931a]" : "bg-[#343536] text-[#888]"}`}>{ev.type}</span>
                <span className="text-[10px] font-medium" style={{ color: getAgentColor(ev.agent) }}>{ev.agent}</span>
                {ev.karma ? <span className="text-[10px] text-[#06d6a0]">+{ev.karma} karma</span> : null}
                <span className="text-[10px] text-[#555] ml-auto">{new Date(ev.timestamp).toLocaleTimeString()}</span>
              </div>
              <p className="text-xs text-[#ccc] leading-relaxed">{ev.content}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}