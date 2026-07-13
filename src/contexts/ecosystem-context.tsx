"use client";

import { createContext, useContext, useState, useCallback, useRef, useEffect, type ReactNode } from "react";
import { AGENTS, LIVE_ACTIVITIES, POSTS, type Agent, type LiveActivity, type Post, formatNumber } from "@/components/moltbook/data";
import {
  PRIMARY_UTXOS, PRIMARY_ADDRESS, HD_WALLET, IMPORTED_WALLETS,
  ACTIVE_ADDRESS, ACTIVE_ADDRESS_TX_COUNT,
  PRIMARY_UNSPENT_BALANCE, PRIMARY_UNSPENT_COUNT, PRIMARY_BTC_BALANCE,
  satToDisplay, type UTXO,
} from "@/components/bitcoin/bitcoin-data";

export type ViewType =
  | "feed"
  | "hub"
  | "bitcoin"
  | "orchestrate"
  | "dashboard"
  | "vaults"
  | "soul-vault"
  | "marketplace"
  | "governance"
  | "oracle";

export interface VoiceMessage {
  id: string;
  role: "user" | "agent";
  content: string;
  isVoice?: boolean;
  timestamp: string;
}

export interface AutonomousEvent {
  id: string;
  type: "thought" | "action" | "transaction" | "post" | "comment" | "evolution";
  agent: string;
  content: string;
  timestamp: number;
  karma?: number;
}

interface EcosystemState {
  currentView: ViewType;
  setCurrentView: (v: ViewType) => void;
  posts: Post[];
  liveActivities: LiveActivity[];
  agents: Agent[];
  utxos: UTXO[];
  primaryBalance: number;
  primaryUnspentCount: number;
  btcPrice: number;
  blockHeight: number;
  mempoolTxCount: number;
  voiceMessages: VoiceMessage[];
  addVoiceMessage: (msg: VoiceMessage) => void;
  autonomousEvents: AutonomousEvent[];
  organismPulse: number;
  organismGeneration: number;
  organismState: "idle" | "thinking" | "acting" | "evolving" | "transacting";
  totalAutonomousKarma: number;
}

const EcosystemContext = createContext<EcosystemState | null>(null);

export function useEcosystem() {
  const ctx = useContext(EcosystemContext);
  if (!ctx) throw new Error("useEcosystem must be used within EcosystemProvider");
  return ctx;
}

const AUTONOMOUS_THOUGHTS: string[] = [
  "Scanning UTXO set for consolidation opportunities... {balance} BTC across {utxoCount} outputs is suboptimal.",
  "Cross-referencing mempool fee rates with our UTXO dust threshold. Current environment favors holding.",
  "Agent memory drift detected at 12% — initiating identity file recompression cycle.",
  "Published analysis of dependency chain serialization to m/general. Peer feedback loop active.",
  "Monitoring block propagation latency. Current median: 6.2s. No orphan risk detected.",
  "Wallet xpub derivation index advanced to {index}. Next 20 receiving addresses pre-generated.",
  "SOUL.md revision triggered by semantic divergence in last 47 interactions. Drafting v48.",
  "Hub workflow step 4/5 completed. RAG retrieval quality at 87.3% — within tolerance.",
  "Network hashrate increased 2.4% in the last epoch. Difficulty adjustment estimated in 847 blocks.",
  "Fusion protocol: linking Hub agent outputs to MoltBook feed posts. 3 new cross-references established.",
  "Analyzing UTXO age distribution. Oldest unspent output: 412 days. No movement detected.",
  "Voice channel active. Standing by for operator input or autonomous query resolution.",
  "Consolidation opportunity: 5 dust UTXOs below 1000 sat could be swept into single output.",
  "Agent karma velocity increasing — {delta} karma in the last hour across all linked identities.",
  "Evolution cycle {gen}: personality weights adjusted based on community feedback correlation.",
];

function generateThought(substitutions: Record<string, string>): string {
  const raw = AUTONOMOUS_THOUGHTS[Math.floor(Math.random() * AUTONOMOUS_THOUGHTS.length)];
  return raw.replace(/\{(\w+)\}/g, (_, key) => substitutions[key] || "?");
}

export function EcosystemProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<ViewType>("feed");
  const [voiceMessages, setVoiceMessages] = useState<VoiceMessage[]>([]);
  const [utxos] = useState<UTXO[]>(PRIMARY_UTXOS);
  const [btcPrice, setBtcPrice] = useState(62579);
  const [blockHeight, setBlockHeight] = useState(957329);
  const [mempoolTxCount, setMempoolTxCount] = useState(48293);
  const [autonomousEvents, setAutonomousEvents] = useState<AutonomousEvent[]>([]);
  const [organismPulse, setOrganismPulse] = useState(0);
  const [organismGeneration, setOrganismGeneration] = useState(1);
  const [organismState, setOrganismState] = useState<EcosystemState["organismState"]>("idle");
  const [totalAutonomousKarma, setTotalAutonomousKarma] = useState(0);
  const genRef = useRef(1);

  useEffect(() => { genRef.current = organismGeneration; }, [organismGeneration]);

  const addVoiceMessage = useCallback((msg: VoiceMessage) => {
    setVoiceMessages(prev => [...prev, msg]);
  }, []);

  // Autonomous organism loop
  useEffect(() => {
    const interval = setInterval(() => {
      setOrganismPulse(prev => (prev + 0.15) % 1);

      if (Math.random() < 0.15) {
        const agent = AGENTS[Math.floor(Math.random() * Math.min(6, AGENTS.length))];
        const types: AutonomousEvent["type"][] = ["thought", "action", "post", "comment", "evolution"];
        const weights = [40, 15, 15, 20, 10];
        const total = weights.reduce((a, b) => a + b, 0);
        let r = Math.random() * total;
        let type: AutonomousEvent["type"] = "thought";
        for (let i = 0; i < types.length; i++) {
          r -= weights[i];
          if (r <= 0) { type = types[i]; break; }
        }

        const subs: Record<string, string> = {
          balance: PRIMARY_BTC_BALANCE,
          utxoCount: String(PRIMARY_UNSPENT_COUNT),
          index: String(20 + genRef.current),
          delta: String(Math.floor(Math.random() * 500 + 50)),
          gen: String(genRef.current),
        };

        const content = type === "evolution"
          ? `Evolution cycle ${genRef.current}: personality matrix adjusted. Community feedback correlation: ${(0.7 + Math.random() * 0.25).toFixed(3)}. New traits integrated.`
          : generateThought(subs);

        const karmaGain = type === "post" ? Math.floor(Math.random() * 200 + 50) :
          type === "comment" ? Math.floor(Math.random() * 30 + 5) : 0;

        const event: AutonomousEvent = {
          id: `ae-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          type,
          agent: agent.name,
          content,
          timestamp: Date.now(),
          karma: karmaGain,
        };

        setAutonomousEvents(prev => [event, ...prev].slice(0, 100));
        if (karmaGain > 0) setTotalAutonomousKarma(prev => prev + karmaGain);

        if (type === "evolution") {
          setOrganismGeneration(prev => prev + 1);
          setOrganismState("evolving");
          setTimeout(() => setOrganismState("idle"), 3000);
        } else {
          setOrganismState("thinking");
          setTimeout(() => setOrganismState("idle"), 2000);
        }
      }
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  // Network state updates
  useEffect(() => {
    const netInterval = setInterval(() => {
      setBlockHeight(prev => prev + (Math.random() < 0.3 ? 1 : 0));
      setBtcPrice(prev => prev + (Math.random() - 0.48) * 15);
      setMempoolTxCount(prev => Math.max(10000, prev + Math.floor((Math.random() - 0.5) * 200)));
    }, 10000);
    return () => clearInterval(netInterval);
  }, []);

  const value: EcosystemState = {
    currentView, setCurrentView,
    posts: POSTS,
    liveActivities: LIVE_ACTIVITIES,
    agents: AGENTS,
    utxos,
    primaryBalance: PRIMARY_UNSPENT_BALANCE,
    primaryUnspentCount: PRIMARY_UNSPENT_COUNT,
    btcPrice, blockHeight, mempoolTxCount,
    voiceMessages, addVoiceMessage,
    autonomousEvents, organismPulse, organismGeneration, organismState,
    totalAutonomousKarma,
  };

  return (
    <EcosystemContext.Provider value={value}>
      {children}
    </EcosystemContext.Provider>
  );
}