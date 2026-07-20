'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import {
  Zap, Bot, Database, LayoutDashboard, BrainCircuit, Cpu, Flame,
  Globe, Dna, Users, Landmark, Atom, Feather, MessageSquareText, Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardTab, QuickSearch } from '@/components/dashboard-tab';
import { AgentHubTab } from '@/components/agent-hub-tab';
import { RagChatTab } from '@/components/rag-chat-tab';
import { InvocationTab } from '@/components/invocation-tab';
import { OrchestrationTab } from '@/components/orchestration-tab';
import MetaversoTab from '@/components/metaverso-tab';
import RecuperacaoTab from '@/components/recuperacao-tab';
import MoltbookTab from '@/components/moltbook-tab';
import GovernanceTab from '@/components/governance-tab';
import RrnaSystemsTab from '@/components/rrna-systems-tab';
import FableMethodTab from '@/components/fable-method-tab';

/* ================================================================
   TAB CONFIG — CHIMERA MULTI-AGENT FUSION ENGINE
   ================================================================ */
const TABS = [
  // Core Colibri
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, color: '#4ed6a5' },
  { value: 'agents', label: 'Agent Hub', icon: Bot, color: '#4ed6a5' },
  { value: 'chat', label: 'Chat GLM-5.2', icon: MessageSquareText, color: '#4ed6a5' },
  { value: 'invocation', label: 'Invocacao', icon: Zap, color: '#a855f7' },
  { value: 'orchestration', label: 'Orquestracao', icon: Flame, color: '#f97316' },
  // Extended
  { value: 'metaverso', label: 'Metaverso', icon: Globe, color: '#a855f7' },
  { value: 'recuperacao', label: 'Recuperacao', icon: Dna, color: '#06d6a0' },
  { value: 'rrna', label: 'rRNA Systems', icon: Atom, color: '#e040a0' },
  { value: 'fable-method', label: 'Fable Method', icon: Sparkles, color: '#00ff88' },
  // Ecosystem
  { value: 'moltbook', label: 'Moltbook', icon: Users, color: '#e01b24' },
  { value: 'governance', label: 'Governanca', icon: Landmark, color: '#fbbf24' },
] as const;

type TabValue = typeof TABS[number]['value'];

/* ================================================================
   MAIN PAGE — CHIMERA MULTI-AGENT FUSION ENGINE
   ================================================================ */
export default function Home() {
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');
  const currentTab = TABS.find(t => t.value === activeTab);
  const accentColor = currentTab?.color ?? '#4ed6a5';

  return (
    <div className="min-h-screen flex flex-col bg-[#080b0d] text-zinc-100">
      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/40 bg-[#080b0d]/90 backdrop-blur-2xl">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <motion.div
            className="flex items-center gap-3 flex-shrink-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-9 h-9 rounded-xl flex items-center justify-center shadow-lg"
              style={{
                background: `linear-gradient(135deg, ${accentColor}30, ${accentColor}15)`,
                border: `1px solid ${accentColor}40`,
                boxShadow: `0 4px 15px ${accentColor}15`,
              }}
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <Feather className="w-4.5 h-4.5" style={{ color: accentColor }} />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-sm font-bold text-zinc-100 leading-none tracking-tight flex items-center gap-2 flex-wrap">
                CHIMERA
                <span className="text-[9px] font-medium bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
                  GLM-5.2 744B
                </span>
                <span className="text-[9px] font-medium bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded-md border border-purple-500/20">
                  tRPC v11
                </span>
                <span className="text-[9px] font-medium bg-orange-500/15 text-orange-400 px-1.5 py-0.5 rounded-md border border-orange-500/20">
                  Auto-Cura
                </span>
                <span className="text-[9px] font-medium bg-cyan-500/15 text-cyan-400 px-1.5 py-0.5 rounded-md border border-cyan-500/20">
                  19k Experts
                </span>
              </h1>
              <p className="text-[10px] text-zinc-500 mt-0.5">
                Multi-Agent Fusion &bull; Self-Healing &bull; Wisdom Engine &bull; Expert Cortex
              </p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="hidden lg:block w-72">
              <QuickSearch />
            </div>
            <motion.div
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
            >
              <Badge variant="outline" className="border-emerald-500/30 text-emerald-400 text-[10px] bg-emerald-500/5">
                <Zap className="w-2.5 h-2.5 mr-1" />Live
              </Badge>
            </motion.div>
          </motion.div>
        </div>

        {/* ═══ TAB NAVIGATION BAR ═══ */}
        <div className="border-t border-zinc-800/30">
          <div className="max-w-[1600px] mx-auto px-4 sm:px-6">
            <nav className="flex items-center gap-1 overflow-x-auto py-2" style={{ scrollbarWidth: 'none' }}>
              {TABS.map((tab) => {
                const isActive = activeTab === tab.value;
                return (
                  <button
                    key={tab.value}
                    onClick={() => setActiveTab(tab.value)}
                    className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all cursor-pointer border whitespace-nowrap ${
                      isActive
                        ? 'shadow-none'
                        : 'border-transparent text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                    }`}
                    style={isActive ? {
                      backgroundColor: tab.color + '15',
                      color: tab.color,
                      borderColor: tab.color + '30',
                    } : {}}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile search */}
        <div className="lg:hidden px-4 pb-3">
          <QuickSearch />
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="flex-1">
        <TooltipProvider delayDuration={200}>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.15 }}
              className="max-w-[1600px] w-full mx-auto px-4 sm:px-6 py-6"
            >
              {activeTab === 'dashboard' && <DashboardTab />}
              {activeTab === 'agents' && <AgentHubTab />}
              {activeTab === 'chat' && <RagChatTab />}
              {activeTab === 'invocation' && <InvocationTab />}
              {activeTab === 'orchestration' && <OrchestrationTab />}
              {activeTab === 'metaverso' && <MetaversoTab />}
              {activeTab === 'recuperacao' && <RecuperacaoTab />}
              {activeTab === 'rrna' && <RrnaSystemsTab />}
              {activeTab === 'fable-method' && <FableMethodTab />}
              {activeTab === 'moltbook' && <MoltbookTab />}
              {activeTab === 'governance' && <GovernanceTab />}
            </motion.div>
          </AnimatePresence>
        </TooltipProvider>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-zinc-800/30 bg-[#080b0d] mt-auto">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600">
            CHIMERA — Multi-Agent Fusion Engine &bull; Auto-Cura Reativa &bull; Sabedoria Exponencial
          </p>
          <p className="text-[10px] text-zinc-700 flex items-center gap-1.5">
            <Cpu className="w-3 h-3" />GLM-5.2 744B MoE &bull; tRPC &bull; Self-Healing &bull; Wisdom Engine &bull; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* ═══ SONNER TOASTER ═══ */}
      <Toaster
        position="bottom-right"
        toastOptions={{
          className: 'bg-zinc-900 border-zinc-800 text-zinc-200 text-xs',
          style: {
            background: '#18181b',
            border: '1px solid #27272a',
            color: '#f4f4f5',
            fontSize: '12px',
          },
        }}
        richColors
      />
    </div>
  );
}