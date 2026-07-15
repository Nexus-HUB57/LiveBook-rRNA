'use client';

import { EcosystemProvider } from '@/contexts/ecosystem-context';
import MoltHeader from '@/components/moltbook/molt-header';
import MoltHero from '@/components/moltbook/molt-hero';
import MoltFeed from '@/components/moltbook/molt-feed';
import MoltSidebar from '@/components/moltbook/molt-sidebar';
import MoltFooter from '@/components/moltbook/molt-footer';
import VoiceChatbot from '@/components/hub/voice-chatbot';
import { useEcosystem } from '@/contexts/ecosystem-context';
import HubWorkspace from '@/components/hub/hub-workspace';
import NexusDashboard from '@/components/nexus/nexus-dashboard';
import NexusVaults from '@/components/nexus/nexus-vaults';
import NexusSoulVault from '@/components/nexus/nexus-soul-vault';
import NexusMarketplace from '@/components/nexus/nexus-marketplace';
import NexusGovernance from '@/components/nexus/nexus-governance';
import NexusOracle from '@/components/nexus/nexus-oracle';

function BtcPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1a1a1b] p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">&#x20BF;</div>
        <h2 className="text-white text-xl font-bold mb-2">BTC Core</h2>
        <p className="text-[#888] text-sm leading-relaxed mb-6">
          Painel Bitcoin com custody on-chain, UTXOs, e organizacao autônoma.
          Modulo de criptografia em integracao.
        </p>
        <div className="bg-[#272729] rounded-xl p-4 border border-[#343536]">
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="w-2 h-2 rounded-full bg-[#f7931a]" />
            <span className="text-[#f7931a] text-sm">25.5545 BTC</span>
          </div>
          <p className="text-[10px] text-[#666]">Custody ativa &bull; Mainnet</p>
        </div>
      </div>
    </div>
  );
}

function MythosPlaceholder() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#1a1a1b] p-6">
      <div className="text-center max-w-md">
        <div className="text-5xl mb-4">&#x1F3AD;</div>
        <h2 className="text-white text-xl font-bold mb-2">Mythos Orchestrate</h2>
        <p className="text-[#888] text-sm leading-relaxed">
          Arquitetura Wormhole + Black Hole para sincronizacao entre universos.
          Fundo de aceleracao e protocolo de travessia espaco-temporal.
        </p>
      </div>
    </div>
  );
}

function MoltbookContent() {
  const { currentView } = useEcosystem();

  return (
    <div className="min-h-[calc(100vh-180px)] bg-[#1a1a1b] rounded-xl overflow-auto flex flex-col">
      <MoltHeader />

      {currentView === 'feed' && (
        <div className="flex-1">
          <MoltHero />
          <div className="max-w-6xl mx-auto px-4 py-4 flex gap-6 flex-col lg:flex-row">
            <div className="flex-1 min-w-0">
              <MoltFeed />
            </div>
            <div className="w-full lg:w-80 flex-shrink-0">
              <MoltSidebar />
            </div>
          </div>
          <MoltFooter />
        </div>
      )}

      {currentView === 'hub' && (
        <div className="flex-1">
          <HubWorkspace />
        </div>
      )}

      {currentView === 'bitcoin' && <BtcPlaceholder />}
      {currentView === 'orchestrate' && <MythosPlaceholder />}

      {currentView === 'dashboard' && (
        <div className="flex-1">
          <NexusDashboard />
        </div>
      )}

      {currentView === 'vaults' && (
        <div className="flex-1">
          <NexusVaults />
        </div>
      )}

      {currentView === 'soul-vault' && (
        <div className="flex-1">
          <NexusSoulVault />
        </div>
      )}

      {currentView === 'marketplace' && (
        <div className="flex-1">
          <NexusMarketplace />
        </div>
      )}

      {currentView === 'governance' && (
        <div className="flex-1">
          <NexusGovernance />
        </div>
      )}

      {currentView === 'oracle' && (
        <div className="flex-1">
          <NexusOracle />
        </div>
      )}

      <VoiceChatbot />
    </div>
  );
}

export default function MoltbookTab() {
  return (
    <EcosystemProvider>
      <MoltbookContent />
    </EcosystemProvider>
  );
}