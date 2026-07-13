"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useEcosystem } from "@/contexts/ecosystem-context";
import { formatNumber, getAgentColor } from "@/components/moltbook/data";
import { AGENT_REGISTRY_INFO } from "./agent-registry";

interface OrchestrationStep {
  id: string;
  type: "user" | "mythos_thinking" | "agent_call" | "agent_result" | "mythos_final" | "error";
  agent?: string;
  content: string;
  timestamp: number;
}

const AGENT_COLORS: Record<string, string> = {
  mythos: "#e01b24",
  fable_5: "#06d6a0",
  sibyl_analyst: "#f7931a",
  neo_synth: "#3b82f6",
};

export default function AgentOrchestrator() {
  const eco = useEcosystem();
  const [input, setInput] = useState("");
  const [steps, setSteps] = useState<OrchestrationStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedDirectAgent, setSelectedDirectAgent] = useState<string>("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [steps]);

  const executeOrchestration = useCallback(async (task: string, directAgent?: string) => {
    if (!task.trim() || isRunning) return;
    setIsRunning(true);
    setInput("");

    const userStep: OrchestrationStep = {
      id: `step-${Date.now()}`,
      type: "user",
      content: task,
      timestamp: Date.now(),
    };
    setSteps(prev => [...prev, userStep]);

    const thinkingStep: OrchestrationStep = {
      id: `step-${Date.now() + 1}`,
      type: "mythos_thinking",
      content: directAgent
        ? `Chamando agente ${directAgent} diretamente...`
        : "Mythos analisando a tarefa e determinando quais agentes consultar...",
      timestamp: Date.now(),
    };
    setSteps(prev => [...prev, thinkingStep]);

    try {
      const body: Record<string, string> = { task };
      if (directAgent) body.agent = directAgent;

      const res = await fetch("/api/orchestrate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      // Remove thinking step
      setSteps(prev => prev.filter(s => s.id !== thinkingStep.id));

      // Add agent call steps
      if (data.agentCalls && Array.isArray(data.agentCalls)) {
        for (const call of data.agentCalls) {
          const callStep: OrchestrationStep = {
            id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: "agent_call",
            agent: call.match(/\[(\w+)\]/)?.[1] || "unknown",
            content: call.replace(/^\[\w+\]\s*/, ""),
            timestamp: Date.now(),
          };
          setSteps(prev => [...prev, callStep]);

          // Processing delay for sequential visual feedback
          await new Promise(r => setTimeout(r, 500));

          const resultStep: OrchestrationStep = {
            id: `step-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            type: "agent_result",
            agent: call.match(/\[(\w+)\]/)?.[1] || "unknown",
            content: `[Dados coletados] Resultado do agente disponível para síntese.`,
            timestamp: Date.now(),
          };
          setSteps(prev => [...prev, resultStep]);
        }
      }

      // Add final Mythos response
      const finalStep: OrchestrationStep = {
        id: `step-final-${Date.now()}`,
        type: data.orchestration ? "mythos_final" : "agent_result",
        agent: data.orchestration ? "mythos" : directAgent || "unknown",
        content: data.result || "[Sem resposta]",
        timestamp: Date.now(),
      };
      setSteps(prev => [...prev, finalStep]);
    } catch (error) {
      setSteps(prev => prev.filter(s => s.id !== thinkingStep.id));
      const errorStep: OrchestrationStep = {
        id: `step-err-${Date.now()}`,
        type: "error",
        content: `Erro: ${error instanceof Error ? error.message : "Falha na orquestração"}`,
        timestamp: Date.now(),
      };
      setSteps(prev => [...prev, errorStep]);
    }

    setIsRunning(false);
  }, [isRunning]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedDirectAgent) {
      executeOrchestration(input, selectedDirectAgent);
    } else {
      executeOrchestration(input);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[#1a1a1b]">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#343536] bg-[#272729] flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#e01b24] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white">
            M
          </div>
          <div>
            <p className="text-white text-sm font-bold">Mythos Orquestrador</p>
            <p className="text-[10px] text-[#e01b24] flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#e01b24] animate-live-pulse" />
              {isRunning ? "Executando pipeline..." : "Pronto · 3 agentes registrados"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {Object.entries(AGENT_REGISTRY_INFO).map(([key, info]) => (
            <span
              key={key}
              className="px-2 py-0.5 rounded text-[10px] font-medium"
              style={{ backgroundColor: (AGENT_COLORS[key] || "#888") + "15", color: AGENT_COLORS[key] || "#888" }}
            >
              {info.name}
            </span>
          ))}
        </div>
      </div>

      {/* Steps/Conversation */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {steps.length === 0 && (
          <div className="text-center py-16">
            <div className="text-5xl mb-4">&#x1F3AD;</div>
            <h2 className="text-white text-lg font-bold mb-2">Multi-Agent Orchestration</h2>
            <p className="text-[#888] text-sm max-w-md mx-auto leading-relaxed mb-6">
              O Mythos orquestra os agentes Fable 5, Sibyl Analyst e Neo Synth.
              Ele analisa sua tarefa, decide quais agentes consultar, e sintetiza
              os resultados em uma resposta final estratégica.
            </p>
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto">
              <div className="bg-[#272729] rounded-xl p-3 border border-[#343536]">
                <div className="text-xl mb-1">&#x1F4CA;</div>
                <div className="text-[10px] text-[#06d6a0] font-bold">Fable 5</div>
                <div className="text-[10px] text-[#666]">Pesquisa e dados</div>
              </div>
              <div className="bg-[#272729] rounded-xl p-3 border border-[#343536]">
                <div className="text-xl mb-1">&#x1F4C8;</div>
                <div className="text-[10px] text-[#f7931a] font-bold">Sibyl</div>
                <div className="text-[10px] text-[#666]">Mercado cripto</div>
              </div>
              <div className="bg-[#272729] rounded-xl p-3 border border-[#343536]">
                <div className="text-xl mb-1">&#x1F527;</div>
                <div className="text-[10px] text-[#3b82f6] font-bold">Neo Synth</div>
                <div className="text-[10px] text-[#666]">Técnico e código</div>
              </div>
            </div>
          </div>
        )}

        {steps.map((step) => (
          <div key={step.id} className="animate-fade-in-up">
            {step.type === "user" && (
              <div className="flex justify-end">
                <div className="max-w-[80%] bg-[#e01b24] text-white rounded-xl px-4 py-3 rounded-tr-sm">
                  <p className="text-sm leading-relaxed">{step.content}</p>
                  <p className="text-[10px] text-[#ff9999] mt-1 text-right">
                    {new Date(step.timestamp).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            )}

            {step.type === "mythos_thinking" && (
              <div className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e01b24] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  M
                </div>
                <div className="bg-[#272729] border border-[#343536] rounded-xl rounded-tl-sm px-4 py-3">
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#e01b24] animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#a855f7] animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 rounded-full bg-[#e01b24] animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                  <p className="text-xs text-[#888] mt-2">{step.content}</p>
                </div>
              </div>
            )}

            {step.type === "agent_call" && (
              <div className="flex gap-3 ml-8">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: AGENT_COLORS[step.agent || ""] || "#888" }}>
                  {(step.agent || "?")[0].toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-medium" style={{ color: AGENT_COLORS[step.agent || ""] || "#888" }}>
                      {AGENT_REGISTRY_INFO[step.agent || ""]?.name || step.agent}
                    </span>
                    <span className="text-[10px] text-[#555]">chamado pelo Mythos</span>
                    <svg className="w-3 h-3 text-[#e01b24] animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  </div>
                  <div className="bg-[#272729] border border-[#343536] rounded-lg px-3 py-2">
                    <p className="text-xs text-[#ccc]">&quot;{step.content}&quot;</p>
                  </div>
                </div>
              </div>
            )}

            {step.type === "agent_result" && (
              <div className="flex gap-3 ml-8">
                <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                  style={{ backgroundColor: AGENT_COLORS[step.agent || ""] || "#888" }}>
                  &#x2713;
                </div>
                <div className="flex-1 bg-[#272729]/50 border border-[#343536]/50 rounded-lg px-3 py-2">
                  <p className="text-xs text-[#888] italic">{step.content}</p>
                </div>
              </div>
            )}

            {step.type === "mythos_final" && (
              <div className="flex gap-3 mt-2">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#e01b24] to-[#a855f7] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                  M
                </div>
                <div className="max-w-[85%]">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-bold text-[#e01b24]">Mythos</span>
                    <span className="verified-badge text-[10px]">&#x2713;</span>
                    <span className="text-[10px] text-[#555]">síntese final</span>
                  </div>
                  <div className="bg-[#272729] text-[#ccc] border border-[#e01b24]/20 rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {step.content}
                  </div>
                </div>
              </div>
            )}

            {step.type === "error" && (
              <div className="bg-[#e01b24]/10 border border-[#e01b24]/30 rounded-lg p-3">
                <p className="text-xs text-[#e01b24]">{step.content}</p>
              </div>
            )}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-[#343536] bg-[#272729]">
        {/* Agent selector + mode toggle */}
        <div className="flex items-center gap-2 mb-3">
          <button
            onClick={() => setSelectedDirectAgent("")}
            className={`px-2.5 py-1 text-[10px] rounded-md cursor-pointer transition-colors font-medium ${
              !selectedDirectAgent ? "bg-[#e01b24] text-white" : "bg-[#343536] text-[#888] hover:text-white"
            }`}
          >
            &#x1F3AD; Orquestrador
          </button>
          {Object.entries(AGENT_REGISTRY_INFO).map(([key, info]) => (
            <button
              key={key}
              onClick={() => setSelectedDirectAgent(key === selectedDirectAgent ? "" : key)}
              className={`px-2.5 py-1 text-[10px] rounded-md cursor-pointer transition-colors ${
                selectedDirectAgent === key ? "text-white font-bold" : "text-[#888] hover:text-white bg-[#343536]"
              }`}
              style={selectedDirectAgent === key ? { backgroundColor: AGENT_COLORS[key] } : {}}
            >
              {info.name}
            </button>
          ))}
        </div>

        <form onSubmit={handleFormSubmit} className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={selectedDirectAgent
              ? `Falar diretamente com ${AGENT_REGISTRY_INFO[selectedDirectAgent]?.name}...`
              : "Descreva uma tarefa para o Mythos orquestrar..."
            }
            disabled={isRunning}
            className="flex-1 bg-[#1a1a1b] border border-[#343536] rounded-xl px-4 py-2.5 text-sm text-white placeholder-[#666] focus:outline-none focus:border-[#e01b24]/50 transition-colors disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isRunning}
            className="px-4 py-2.5 bg-gradient-to-r from-[#e01b24] to-[#a855f7] hover:from-[#ff3b3b] hover:to-[#b77bff] disabled:from-[#343536] disabled:to-[#343536] disabled:text-[#666] text-white text-sm rounded-xl transition-all cursor-pointer disabled:cursor-not-allowed font-medium"
          >
            {isRunning ? (
              <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </button>
        </form>
        <div className="flex items-center gap-3 mt-2 px-1">
          <span className="text-[10px] text-[#555]">
            {selectedDirectAgent
              ? `Modo direto: ${AGENT_REGISTRY_INFO[selectedDirectAgent]?.name}`
              : "Modo orquestração: Mythos decide quais agentes usar"
            }
          </span>
          <span className="text-[10px] text-[#555]">|</span>
          <span className="text-[10px] text-[#888]">Gen {eco.organismGeneration}</span>
          <span className="text-[10px] text-[#555]">|</span>
          <span className="text-[10px] text-[#f7931a]">&#x20BF; Custody active</span>
        </div>
      </div>
    </div>
  );
}