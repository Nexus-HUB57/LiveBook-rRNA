'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dna, Atom, Zap, Shield, Globe, Radio, Activity } from 'lucide-react';
import AgenticFusionSection from '@/components/metaverse/agentic-fusion-section';
import WormholeBlackholeSection from '@/components/metaverse/wormhole-blackhole-section';
import SandboxTrinuclearSection from '@/components/metaverse/sandbox-trinuclear-section';
import AgenticRagSection from '@/components/metaverse/agentic-rag-section';

const SUBSYSTEMS = [
  { key: 'fusion', label: 'Fusao rRNA', icon: Dna, color: '#06d6a0', desc: 'Simbiose deterministica entre subsistemas via rRNA' },
  { key: 'wormhole', label: 'Wormhole / BlackHole', icon: Atom, color: '#a855f7', desc: 'Tunel espaco-temporal e singularidade Kerr' },
  { key: 'sandbox', label: 'Sandbox Trinuclear', icon: Zap, color: '#fbbf24', desc: 'Ollama + Llama4 + OpenAI em teste de estresse' },
  { key: 'rag', label: 'RAG Knowledge Vault', icon: Shield, color: '#e040a0', desc: 'Pipeline recursivo de recuperacao aumentada' },
] as const;

type SubsystemKey = typeof SUBSYSTEMS[number]['key'];

export default function RrnaSystemsTab() {
  const [active, setActive] = useState<SubsystemKey>('fusion');

  return (
    <div className="min-h-[calc(100vh-180px)] bg-[#050510] rounded-xl overflow-auto">
      {/* Sub-nav */}
      <div className="sticky top-0 z-20 bg-[#050510]/90 backdrop-blur-xl border-b border-white/5 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center gap-3 flex-wrap">
          {SUBSYSTEMS.map((s) => (
            <button
              key={s.key}
              onClick={() => setActive(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
                active === s.key
                  ? 'border-current bg-white/5'
                  : 'border-white/5 text-[#8888aa] hover:text-white hover:border-white/10'
              }`}
              style={active === s.key ? { color: s.color, borderColor: s.color + '40' } : {}}
            >
              <s.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div>
        {active === 'fusion' && <AgenticFusionSection />}
        {active === 'wormhole' && <WormholeBlackholeSection />}
        {active === 'sandbox' && <SandboxTrinuclearSection />}
        {active === 'rag' && <AgenticRagSection />}
      </div>
    </div>
  );
}