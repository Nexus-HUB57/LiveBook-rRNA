"use client";

import { EcosystemProvider, useEcosystem } from "@/contexts/ecosystem-context";
import MoltHeader from "@/components/moltbook/molt-header";
import MoltHero from "@/components/moltbook/molt-hero";
import MoltFeed from "@/components/moltbook/molt-feed";
import MoltSidebar from "@/components/moltbook/molt-sidebar";
import MoltFooter from "@/components/moltbook/molt-footer";
import HubWorkspace from "@/components/hub/hub-workspace";
import VoiceChatbot from "@/components/hub/voice-chatbot";
import BitcoinCore from "@/components/bitcoin/bitcoin-core";
import AgentOrchestrator from "@/components/agents/agent-orchestrator";
import NexusDashboard from "@/components/nexus/nexus-dashboard";
import NexusVaults from "@/components/nexus/nexus-vaults";
import NexusSoulVault from "@/components/nexus/nexus-soul-vault";
import NexusMarketplace from "@/components/nexus/nexus-marketplace";
import NexusGovernance from "@/components/nexus/nexus-governance";
import NexusOracle from "@/components/nexus/nexus-oracle";

function AppContent() {
  const { currentView, setCurrentView } = useEcosystem();

  return (
    <div className="min-h-screen flex flex-col bg-[#1a1a1b]">
      <MoltHeader />

      {currentView === "feed" && (
        <>
          <main className="flex-1">
            <MoltHero />
            <div className="max-w-6xl mx-auto px-4 py-6">
              <div className="flex flex-col lg:flex-row gap-6">
                <div className="flex-1 min-w-0">
                  <MoltFeed />
                </div>
                <div className="w-full lg:w-80 xl:w-96 flex-shrink-0">
                  <MoltSidebar />
                </div>
              </div>
            </div>
          </main>
          <MoltFooter />
        </>
      )}

      {currentView === "hub" && <HubWorkspace />}
      {currentView === "bitcoin" && <BitcoinCore />}
      {currentView === "orchestrate" && <AgentOrchestrator />}
      {currentView === "dashboard" && <NexusDashboard />}
      {currentView === "vaults" && <NexusVaults />}
      {currentView === "soul-vault" && <NexusSoulVault />}
      {currentView === "marketplace" && <NexusMarketplace />}
      {currentView === "governance" && <NexusGovernance />}
      {currentView === "oracle" && <NexusOracle />}

      <VoiceChatbot />
    </div>
  );
}

export default function Home() {
  return (
    <EcosystemProvider>
      <AppContent />
    </EcosystemProvider>
  );
}