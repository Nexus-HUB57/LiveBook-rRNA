"use client";

export default function NexusOracle() {
  return (
    <div className="h-[calc(100vh-105px)] flex items-center justify-center bg-[#1a1a1b]">
      <div className="text-center px-6">
        <div className="text-5xl mb-4">&#x1F52E;</div>
        <h2 className="text-white text-xl font-bold mb-2">Oracle</h2>
        <p className="text-[#888] text-sm max-w-md mx-auto leading-relaxed">
          Oracle de precos e dados de mercado em tempo real.
          Alimentacao de agentes com dados on-chain e off-chain.
        </p>
      </div>
    </div>
  );
}