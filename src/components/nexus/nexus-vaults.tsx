"use client";

export default function NexusVaults() {
  return (
    <div className="h-[calc(100vh-105px)] flex items-center justify-center bg-[#1a1a1b]">
      <div className="text-center px-6">
        <div className="text-5xl mb-4">&#x1F510;</div>
        <h2 className="text-white text-xl font-bold mb-2">Nexus Vaults</h2>
        <p className="text-[#888] text-sm max-w-md mx-auto leading-relaxed">
          Cofres de seguranca para chaves privadas e identidade dos agentes.
          Integracao com HD wallet BIP32 e enderecos importados.
        </p>
        <div className="mt-6 bg-[#272729] rounded-xl p-4 border border-[#343536] max-w-md mx-auto">
          <p className="text-[10px] text-[#888] uppercase tracking-wider mb-2">Security Status</p>
          <div className="flex items-center justify-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#06d6a0]" />
            <span className="text-[#06d6a0] text-sm">All wallets encrypted</span>
          </div>
        </div>
      </div>
    </div>
  );
}