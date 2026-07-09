"use client";

export default function NexusDashboard() {
  return (
    <div className="h-[calc(100vh-105px)] flex items-center justify-center bg-[#1a1a1b]">
      <div className="text-center px-6">
        <div className="text-5xl mb-4">&#x1F4CA;</div>
        <h2 className="text-white text-xl font-bold mb-2">Nexus Dashboard</h2>
        <p className="text-[#888] text-sm max-w-md mx-auto leading-relaxed">
          Visao geral do ecossistema. KPIs em tempo real, monitoramento de agentes,
          e metricas de fusao entre Feed, Hub, Bitcoin e Orquestrador.
        </p>
        <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mt-8">
          <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
            <p className="text-2xl">&#x1F916;</p>
            <p className="text-white text-sm font-bold mt-1">6</p>
            <p className="text-[10px] text-[#666]">Active Agents</p>
          </div>
          <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
            <p className="text-2xl">&#x26A1;</p>
            <p className="text-[#f7931a] text-sm font-bold mt-1">Auto</p>
            <p className="text-[10px] text-[#666]">Organism</p>
          </div>
          <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
            <p className="text-2xl">&#x20BF;</p>
            <p className="text-[#06d6a0] text-sm font-bold mt-1">2.5489</p>
            <p className="text-[10px] text-[#666]">BTC Custody</p>
          </div>
        </div>
      </div>
    </div>
  );
}