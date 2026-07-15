'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Toaster } from '@/components/ui/sonner';
import {
  Zap, Bot, Database, LayoutDashboard, BrainCircuit, Cpu,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardTab, QuickSearch } from '@/components/dashboard-tab';
import { AgentHubTab } from '@/components/agent-hub-tab';
import { RagChatTab } from '@/components/rag-chat-tab';
import { InvocationTab } from '@/components/invocation-tab';
import { AgentChat } from '@/components/agent-chat';

/* ================================================================
   TAB CONFIG
   ================================================================ */
const TABS = [
  { value: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, activeColor: 'emerald' },
  { value: 'agents', label: 'Agent Hub', icon: Bot, activeColor: 'emerald' },
  { value: 'rag', label: 'RAG Chat', icon: Database, activeColor: 'emerald' },
  { value: 'invocation', label: 'Invocacao', icon: Zap, activeColor: 'purple' },
] as const;

/* ================================================================
   MAIN PAGE — FUSÃO LLM 2401 AGENTIC AI DASHBOARD
   ================================================================ */
export default function Home() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen flex flex-col bg-[#09090b] text-zinc-100">
      {/* Custom Scrollbar */}
      <style>{`
        ::-webkit-scrollbar { width: 5px; height: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #27272a; border-radius: 3px; }
        ::-webkit-scrollbar-thumb:hover { background: #3f3f46; }
      `}</style>

      {/* ═══ HEADER ═══ */}
      <header className="sticky top-0 z-40 border-b border-zinc-800/60 bg-[#09090b]/85 backdrop-blur-2xl">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-3 flex items-center justify-between gap-4">
          <motion.div
            className="flex items-center gap-3 flex-shrink-0"
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <motion.div
              className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 border border-emerald-500/30 flex items-center justify-center shadow-lg shadow-emerald-500/10"
              whileHover={{ rotate: 8, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300 }}
            >
              <BrainCircuit className="w-4.5 h-4.5 text-emerald-400" />
            </motion.div>
            <div>
              <h1 className="text-sm font-bold text-zinc-100 leading-none tracking-tight flex items-center gap-2">
                Fusão LLM 2401
                <motion.span
                  className="text-[9px] font-medium bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md border border-emerald-500/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  Agentic AI
                </motion.span>
                <motion.span
                  className="text-[9px] font-medium bg-purple-500/15 text-purple-400 px-1.5 py-0.5 rounded-md border border-purple-500/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  tRPC
                </motion.span>
                <motion.span
                  className="text-[9px] font-medium bg-amber-500/15 text-amber-400 px-1.5 py-0.5 rounded-md border border-amber-500/20"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  v2.0
                </motion.span>
              </h1>
              <p className="text-[10px] text-zinc-500 mt-0.5">Agente Generativo Orquestrador Ativo &bull; Live Sync &bull; Quantum Panels</p>
            </div>
          </motion.div>

          <motion.div
            className="flex items-center gap-3"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="hidden md:block w-72">
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

        {/* Mobile search */}
        <div className="md:hidden px-4 pb-3">
          <QuickSearch />
        </div>
      </header>

      {/* ═══ MAIN CONTENT WITH TABS ═══ */}
      <main className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-6">
        <TooltipProvider delayDuration={200}>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-5">
            {/* Tab Navigation */}
            <div className="flex items-center gap-4 flex-wrap">
              <TabsList className="bg-zinc-900 border border-zinc-800 p-1 rounded-xl h-auto">
                {TABS.map((tab, i) => (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className={`rounded-lg px-4 py-2 text-xs font-medium transition-all gap-2
                      ${tab.activeColor === 'purple'
                        ? 'data-[state=active]:bg-purple-600/20 data-[state=active]:text-purple-400 data-[state=active]:border-purple-500/30'
                        : 'data-[state=active]:bg-emerald-600/20 data-[state=active]:text-emerald-400 data-[state=active]:border-emerald-500/30'
                      }
                      data-[state=active]:shadow-none text-zinc-400 hover:text-zinc-200`}
                  >
                    <tab.icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab Content with animated transitions */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === 'dashboard' && (
                  <TabsContent value="dashboard" forceMount className="mt-0">
                    <DashboardTab />
                  </TabsContent>
                )}
                {activeTab === 'agents' && (
                  <TabsContent value="agents" forceMount className="mt-0">
                    <AgentHubTab />
                  </TabsContent>
                )}
                {activeTab === 'rag' && (
                  <TabsContent value="rag" forceMount className="mt-0">
                    <RagChatTab />
                  </TabsContent>
                )}
                {activeTab === 'invocation' && (
                  <TabsContent value="invocation" forceMount className="mt-0">
                    <InvocationTab />
                  </TabsContent>
                )}
              </motion.div>
            </AnimatePresence>
          </Tabs>
        </TooltipProvider>
      </main>

      {/* ═══ FOOTER ═══ */}
      <footer className="border-t border-zinc-800/40 bg-[#09090b] mt-auto">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-zinc-600">
            Fusão LLM 2401 — Agente Generativo Orquestrador Ativo
          </p>
          <p className="text-[10px] text-zinc-700 flex items-center gap-1.5">
            <Cpu className="w-3 h-3" />tRPC Nativo &bull; Quantum Panels &bull; Live Sync &bull; {new Date().getFullYear()}
          </p>
        </div>
      </footer>

      {/* ═══ FLOATING AGENT CHAT ═══ */}
      <AgentChat />

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