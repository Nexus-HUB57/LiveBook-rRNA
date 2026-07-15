"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useEcosystem } from "@/contexts/ecosystem-context";
import {
  type AtemporalCall,
  type AbsorbedEvent,
  type AlgorithmSyncRecord,
  type AgentExecution,
  type AlgorithmType,
  type AtemporalCallStatus,
  type EventHorizonPhase,
  type ExecutionStatus,
  ALGORITHM_LABELS,
  ALGORITHM_COLORS,
} from "@/lib/wormhole-blackhole-engine";
import WormholeCanvas from "@/components/metaverse/wormhole-canvas";
import BlackHoleCanvas from "@/components/metaverse/black-hole-canvas";

type Tab = "wormhole" | "blackhole" | "algorithms" | "execution";

const STATUS_STYLES: Record<AtemporalCallStatus, string> = {
  traversing: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20",
  emerged: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  collapsed: "text-red-400 bg-red-400/10 border-red-400/20",
  absorbed: "text-purple-400 bg-purple-400/10 border-purple-400/20",
};

const PHASE_STYLES: Record<EventHorizonPhase, string> = {
  accretion: "text-amber-400 bg-amber-400/10 border-amber-400/20",
  compression: "text-orange-400 bg-orange-400/10 border-orange-400/20",
  singularity: "text-red-500 bg-red-500/10 border-red-500/20",
  hawking: "text-violet-400 bg-violet-400/10 border-violet-400/20",
};

const EXEC_STYLES: Record<ExecutionStatus, string> = {
  queued: "text-zinc-400 bg-zinc-400/10 border-zinc-400/20",
  running: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20 animate-pulse",
  completed: "text-emerald-400 bg-emerald-400/10 border-emerald-400/20",
  failed: "text-red-400 bg-red-400/10 border-red-400/20",
  timeout: "text-orange-400 bg-orange-400/10 border-orange-400/20",
};

function ProgressBar({ value, color }: { value: number; color: string }) {
  return (
    <div className="w-full h-1 bg-[#272729] rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-300"
        style={{ width: `${Math.min(100, value * 100)}%`, backgroundColor: color }}
      />
    </div>
  );
}

function Timestamp({ ts }: { ts: number }) {
  const d = new Date(ts);
  return <span className="text-[10px] text-[#666] font-mono">{d.toLocaleTimeString("pt-BR")}.{d.getMilliseconds().toString().padStart(3, "0")}</span>;
}

// ─── Wormhole Call Card ──────────────────────────────────
function CallCard({ call }: { call: AtemporalCall }) {
  const temporalLabel = call.temporalDelta > 0
    ? `+${call.temporalDelta} gen`
    : call.temporalDelta === 0 ? "mesmo gen" : `${call.temporalDelta} gen`;

  return (
    <div className="bg-[#272729] border border-[#343536] rounded-lg p-3 space-y-2 hover:border-[#444] transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: call.energySignature }} />
          <span className="text-xs font-medium text-white truncate">{call.sourceAgent}</span>
          <svg className="w-3 h-3 text-[#666] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
          <span className="text-xs font-medium text-white truncate">{call.targetAgent}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${STATUS_STYLES[call.status]}`}>
          {call.status === "traversing" ? "atravessando" : call.status === "emerged" ? "emergiu" : call.status === "collapsed" ? "colapsou" : "absorvido"}
        </span>
      </div>
      <p className="text-[11px] text-[#aaa] leading-relaxed">{call.payload}</p>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#666]">Gen {call.sourceGen} → Gen {call.targetGen} ({temporalLabel})</span>
        <Timestamp ts={call.timestamp} />
      </div>
      {call.status === "traversing" && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-[#666]">Travessia</span>
            <span className="text-cyan-400">{(call.traversalProgress * 100).toFixed(1)}%</span>
          </div>
          <ProgressBar value={call.traversalProgress} color="#22d3ee" />
          <div className="flex justify-between text-[10px]">
            <span className="text-[#666]">Entropia Quântica</span>
            <span style={{ color: call.quantumEntropy > 0.7 ? "#ef4444" : "#22d3ee" }}>{(call.quantumEntropy * 100).toFixed(1)}%</span>
          </div>
          <ProgressBar value={call.quantumEntropy} color={call.quantumEntropy > 0.7 ? "#ef4444" : "#a855f7"} />
        </div>
      )}
    </div>
  );
}

// ─── Blackhole Event Card ────────────────────────────────
function BlackholeEventCard({ event }: { event: AbsorbedEvent }) {
  const phaseLabels: Record<EventHorizonPhase, string> = {
    accretion: "Acreção",
    compression: "Compressão",
    singularity: "Singularidade",
    hawking: "Radiação Hawking",
  };

  return (
    <div className="bg-[#272729] border border-[#343536] rounded-lg p-3 space-y-2 hover:border-[#444] transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-medium text-white truncate">{event.sourceAgent}</span>
          <span className="text-[#666]">·</span>
          <span className="text-[11px] text-[#888] truncate">{event.eventType}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${PHASE_STYLES[event.phase]}`}>
          {phaseLabels[event.phase]}
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2 text-center">
        <div>
          <div className="text-[10px] text-[#666]">Karma Original</div>
          <div className="text-xs font-mono text-amber-400">{event.originalKarma}</div>
        </div>
        <div>
          <div className="text-[10px] text-[#666]">Karma Comprimido</div>
          <div className="text-xs font-mono text-violet-400">{event.compressedKarma || "—"}</div>
        </div>
        <div>
          <div className="text-[10px] text-[#666]">Entropia</div>
          <div className="text-xs font-mono text-red-400">+{event.entropyGain || 0}</div>
        </div>
      </div>
      {!event.absorbed && (
        <div className="space-y-1">
          <div className="flex justify-between text-[10px]">
            <span className="text-[#666]">Distância ao Horizonte</span>
            <span className="text-amber-400">{(event.distanceToHorizon * 100).toFixed(1)}%</span>
          </div>
          <ProgressBar value={event.distanceToHorizon} color="#f59e0b" />
        </div>
      )}
      {event.absorbed && (
        <div className="flex items-center gap-2 text-[10px] text-violet-400">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          Absorvido no horizonte de eventos
        </div>
      )}
      <div className="text-right"><Timestamp ts={event.timestamp} /></div>
    </div>
  );
}

// ─── Algorithm Sync Card ─────────────────────────────────
function AlgorithmCard({ record }: { record: AlgorithmSyncRecord }) {
  const color = ALGORITHM_COLORS[record.algorithm];
  return (
    <div className="bg-[#272729] border border-[#343536] rounded-lg p-3 space-y-2 hover:border-[#444] transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-medium text-white">{ALGORITHM_LABELS[record.algorithm]}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[#666] font-mono">v{record.version}</span>
          <span className={`text-[10px] px-1.5 py-0.5 rounded border ${record.synchronized ? "text-emerald-400 bg-emerald-400/10 border-emerald-400/20" : "text-red-400 bg-red-400/10 border-red-400/20"}`}>
            {record.synchronized ? "sincronizado" : "desincronizado"}
          </span>
        </div>
      </div>
      <div className="space-y-1">
        <div className="flex justify-between text-[10px]">
          <span className="text-[#666]">Convergência</span>
          <span style={{ color }}>{(record.convergence * 100).toFixed(1)}%</span>
        </div>
        <ProgressBar value={record.convergence} color={color} />
      </div>
      <div className="flex items-center justify-between text-[10px]">
        <span className="text-[#666]">{record.agentCount} agentes</span>
        <span className="text-[#555] font-mono truncate max-w-[100px]">{record.hash}</span>
      </div>
    </div>
  );
}

// ─── Execution Card ──────────────────────────────────────
function ExecutionCard({ exec }: { exec: AgentExecution }) {
  const statusLabels: Record<ExecutionStatus, string> = {
    queued: "Na fila", running: "Executando", completed: "Concluído", failed: "Falhou", timeout: "Timeout",
  };
  return (
    <div className="bg-[#272729] border border-[#343536] rounded-lg p-3 space-y-2 hover:border-[#444] transition-colors">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ALGORITHM_COLORS[exec.algorithm] }} />
          <span className="text-xs font-medium text-white truncate">{exec.agent}</span>
          <span className="text-[#666]">·</span>
          <span className="text-[11px] text-[#888] truncate">{ALGORITHM_LABELS[exec.algorithm]}</span>
        </div>
        <span className={`text-[10px] px-1.5 py-0.5 rounded border flex-shrink-0 ${EXEC_STYLES[exec.status]}`}>
          {statusLabels[exec.status]}
        </span>
      </div>
      <p className="text-[11px] text-[#aaa] truncate">{exec.input}</p>
      {exec.output && (
        <p className="text-[10px] text-[#888] font-mono truncate bg-[#1a1a1b] p-1.5 rounded">{exec.output}</p>
      )}
      <div className="flex items-center justify-between text-[10px]">
        {exec.duration !== undefined && <span className="text-[#666]">{exec.duration.toFixed(0)}ms</span>}
        {exec.karmaGenerated !== undefined && exec.karmaGenerated > 0 && (
          <span className="text-amber-400">+{exec.karmaGenerated} karma</span>
        )}
        <Timestamp ts={exec.timestamp} />
      </div>
    </div>
  );
}

// ─── Main Panel ──────────────────────────────────────────
export default function WormholePanel() {
  const { agents, organismGeneration, autonomousEvents, addAutonomousEvent, totalAutonomousKarma } = useEcosystem();
  const [activeTab, setActiveTab] = useState<Tab>("wormhole");

  const [calls, setCalls] = useState<AtemporalCall[]>([]);
  const [absorbed, setAbsorbed] = useState<AbsorbedEvent[]>([]);
  const [algorithms, setAlgorithms] = useState<AlgorithmSyncRecord[]>([]);
  const [executions, setExecutions] = useState<AgentExecution[]>([]);
  const [stats, setStats] = useState<ReturnType<typeof import("@/lib/wormhole-blackhole-engine").getWormholeBlackholeEngine>["getStats"] | null>(null);

  const engineRef = useRef<ReturnType<typeof import("@/lib/wormhole-blackhole-engine").getWormholeBlackholeEngine> | null>(null);
  const agentNames = useRef<string[]>([]);

  // Init engine
  useEffect(() => {
    let mounted = true;
    import("@/lib/wormhole-blackhole-engine").then(({ getWormholeBlackholeEngine }) => {
      if (!mounted) return;
      const engine = getWormholeBlackholeEngine();
      engineRef.current = engine;

      const refresh = () => {
        if (!mounted) return;
        setCalls(engine.getCalls());
        setAbsorbed(engine.getAbsorbed());
        setAlgorithms(engine.getAlgorithms());
        setExecutions(engine.getExecutions());
        setStats(engine.getStats());
      };

      engine.subscribe(refresh);
      refresh();

      return () => {}; // cleanup handled by engine.destroy()
    });
    return () => { mounted = false; };
  }, []);

  // Keep agent names updated
  useEffect(() => {
    agentNames.current = agents.slice(0, 6).map(a => a.name);
  }, [agents]);

  const handleInvokeAgent = useCallback(async () => {
    const engine = engineRef.current;
    if (!engine) return;
    const names = agentNames.current.length >= 1 ? agentNames.current : ["Fable 5", "Sibyl Analyst", "Neo Synth"];
    const agent = names[Date.now() % names.length];
    const algoTypes: AlgorithmType[] = ["routing", "karma_weighting", "evolution", "consensus", "federation", "orchestration", "memory_compression"];
    const algo = algoTypes[Date.now() % algoTypes.length];
    const input = `Executar ${ALGORITHM_LABELS[algo]} no ecossistema — convergencia de estado entre ${names.length} agentes, geracao ${organismGeneration}`;
    const execution = await engine.invokeAgent(agent, algo, input);

    // Bridge: feed successful Fable 5 executions to the Fable OS wormhole events
    if (execution.status === "completed" && execution.karmaGenerated && execution.karmaGenerated > 0) {
      addAutonomousEvent({
        type: "agent_execution",
        agent: "Fable 5 OS",
        content: `Execucao via Wormhole: ${ALGORITHM_LABELS[algo]} concluida com sucesso — ${execution.karmaGenerated} karma gerado`,
        karma: execution.karmaGenerated,
      });
    }
  }, [organismGeneration, addAutonomousEvent]);

  const handleSyncAll = useCallback(() => {
    const engine = engineRef.current;
    if (!engine) return;
    const count = agentNames.current.length || 3;
    engine.syncAllAlgorithms(count);
  }, []);

  const tabs: { key: Tab; label: string; icon: string }[] = [
    { key: "wormhole", label: "Wormhole", icon: "🌀" },
    { key: "blackhole", label: "Blackhole", icon: "⚫" },
    { key: "algorithms", label: "Algoritmos", icon: "🧬" },
    { key: "execution", label: "Execução", icon: "⚡" },
  ];

  return (
    <div className="min-h-screen bg-[#1a1a1b] flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-bold text-white flex items-center gap-2">
            <span className="text-xl">🌀</span> Wormhole & Blackhole
          </h1>
          <p className="text-[11px] text-[#666] mt-0.5">Chamadas atemporais · Horizonte de eventos · Sincronização de algoritmos</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSyncAll}
            className="px-3 py-1.5 text-[10px] font-medium text-white bg-[#343536] hover:bg-[#444] rounded-lg transition-colors cursor-pointer border border-[#444]"
          >
            Sincronizar Tudo
          </button>
          <button
            onClick={handleInvokeAgent}
            className="px-3 py-1.5 text-[10px] font-medium text-black bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
          >
            Invocar Agente
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="px-4 py-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px]">
          <span className="text-[#666]">
            <span className="text-cyan-400 font-mono">{stats.activeCalls}</span> atravessando
          </span>
          <span className="text-[#666]">
            <span className="text-emerald-400 font-mono">{stats.emerged}</span> emergiram
          </span>
          <span className="text-[#666]">
            <span className="text-red-400 font-mono">{stats.collapsed}</span> colapsaram
          </span>
          <span className="text-[#666]">|</span>
          <span className="text-[#666]">
            <span className="text-amber-400 font-mono">{stats.absorbedCount}</span> absorvidos
          </span>
          <span className="text-[#666]">
            <span className="text-violet-400 font-mono">{stats.pendingAbsorption}</span> na fila
          </span>
          <span className="text-[#666]">|</span>
          <span className="text-[#666]">
            <span className="text-emerald-400 font-mono">{stats.algoSynced}/{stats.algoTotal}</span> algoritmos
          </span>
          <span className="text-[#666]">
            <span className="text-red-400 font-mono">{stats.totalEntropy.toFixed(0)}</span> entropia
          </span>
          <span className="text-[#666]">
            Horizonte: <span className="text-amber-400 font-mono">{(stats.eventHorizonRadius * 100).toFixed(1)}%</span>
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="px-4 pt-2">
        <div className="flex gap-1 bg-[#272729] rounded-lg p-0.5 w-fit">
          {tabs.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-3 py-1.5 text-[11px] font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.key ? "bg-[#343536] text-white" : "text-[#888] hover:text-white"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-hidden">
        {/* Wormhole Tab */}
        {activeTab === "wormhole" && (
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* Canvas */}
            <div className="relative w-full lg:w-1/2 h-[300px] lg:h-full rounded-xl overflow-hidden border border-[#343536] flex-shrink-0">
              <WormholeCanvas />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1b] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-[#1a1a1b]/80 backdrop-blur-sm rounded-lg p-2 border border-[#343536]">
                  <div className="text-[10px] text-[#666]">Canal Atemporal Ativo</div>
                  <div className="text-xs text-cyan-400 font-mono">GERAÇÃO {organismGeneration} → FLUXO TRANS-TEMPORAL</div>
                </div>
              </div>
            </div>
            {/* Call List */}
            <div className="flex-1 min-w-0 max-h-[500px] lg:max-h-full overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {calls.length === 0 ? (
                <div className="text-center py-12 text-[#666] text-xs">
                  <div className="text-2xl mb-2">🌀</div>
                  Nenhuma chamada atemporal detectada.<br />
                  Aguardando atividade do organismo...
                </div>
              ) : (
                calls.map(c => <CallCard key={c.id} call={c} />)
              )}
            </div>
          </div>
        )}

        {/* Blackhole Tab */}
        {activeTab === "blackhole" && (
          <div className="flex flex-col lg:flex-row gap-4 h-full">
            {/* Canvas */}
            <div className="relative w-full lg:w-1/2 h-[300px] lg:h-full rounded-xl overflow-hidden border border-[#343536] flex-shrink-0">
              <BlackHoleCanvas />
              <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a1b] via-transparent to-transparent pointer-events-none" />
              <div className="absolute bottom-3 left-3 right-3">
                <div className="bg-[#1a1a1b]/80 backdrop-blur-sm rounded-lg p-2 border border-[#343536]">
                  <div className="text-[10px] text-[#666]">Horizonte de Eventos</div>
                  <div className="text-xs text-amber-400 font-mono">RAIO {(stats?.eventHorizonRadius ?? 0.5 * 100).toFixed(1)}% · ENTROPIA {stats?.totalEntropy.toFixed(0) ?? "0"}</div>
                </div>
              </div>
            </div>
            {/* Event List */}
            <div className="flex-1 min-w-0 max-h-[500px] lg:max-h-full overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {absorbed.length === 0 ? (
                <div className="text-center py-12 text-[#666] text-xs">
                  <div className="text-2xl mb-2">⚫</div>
                  Nenhum evento no horizonte.<br />
                  Eventos autônomos serão absorvidos aqui...
                </div>
              ) : (
                absorbed.map(e => <BlackholeEventCard key={e.id} event={e} />)
              )}
            </div>
          </div>
        )}

        {/* Algorithms Tab */}
        {activeTab === "algorithms" && (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {algorithms.map(a => <AlgorithmCard key={a.id} record={a} />)}
            </div>
          </div>
        )}

        {/* Execution Tab */}
        {activeTab === "execution" && (
          <div className="max-w-4xl mx-auto space-y-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[11px] text-[#666]">
                {executions.filter(e => e.status === "running").length} executando ·{" "}
                {executions.filter(e => e.status === "completed").length} concluídas
              </div>
            </div>
            <div className="max-h-[500px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {executions.length === 0 ? (
                <div className="text-center py-12 text-[#666] text-xs">
                  <div className="text-2xl mb-2">⚡</div>
                  Nenhuma execução registrada.<br />
                  Clique &quot;Invocar Agente&quot; para iniciar...
                </div>
              ) : (
                executions.map(e => <ExecutionCard key={e.id} exec={e} />)
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}