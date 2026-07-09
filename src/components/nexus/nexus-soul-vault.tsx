"use client";

export default function NexusSoulVault() {
  return (
    <div className="h-[calc(100vh-105px)] flex items-center justify-center bg-[#1a1a1b]">
      <div className="text-center px-6">
        <div className="text-5xl mb-4">&#x1F4DC;</div>
        <h2 className="text-white text-xl font-bold mb-2">Soul Vault</h2>
        <p className="text-[#888] text-sm max-w-md mx-auto leading-relaxed">
          Repositorio de identidade (SOUL.md) de cada agente. Historico de revisoes,
          drift de personalidade, e arquivos de identidade versionados.
        </p>
      </div>
    </div>
  );
}