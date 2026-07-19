'use client';

import { useState, useEffect } from 'react';
import { Globe, ExternalLink, Layers, Network, Box, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

const ECOSYSTEM_MODULES = [
  { name: 'Zettascale Dashboard', desc: 'Painel de monitoramento de performance em tempo real', status: 'active', icon: Layers, color: 'text-emerald-400' },
  { name: 'GenesisFlow', desc: 'Pipeline de fluxo genetico para evolucao de agentes', status: 'active', icon: Sparkles, color: 'text-amber-400' },
  { name: 'Antrophexus AI', desc: 'Interface de interacao humano-agente avancada', status: 'idle', icon: Network, color: 'text-purple-400' },
  { name: 'Sabio Heroi', desc: 'Agente especialista em conhecimento e pesquisa', status: 'active', icon: Box, color: 'text-cyan-400' },
  { name: 'S-bio Heroi Agentic AI', desc: 'IA agentica biologica com processamento DNA-inspired', status: 'idle', icon: Globe, color: 'text-rose-400' },
];

const REALMS = [
  { name: 'Nexus Hub', desc: 'Centro de operacoes do ecossistema', nodes: 6, connections: 24 },
  { name: 'Knowledge Vault', desc: 'Grafo Obsidian de conhecimento acumulado', nodes: 156, connections: 892 },
  { name: 'Trinuclear Sandbox', desc: 'Ambiente de testes para 3 nucleos de agentes', nodes: 12, connections: 36 },
  { name: 'Wormhole Transport', desc: 'Canal de transporte inter-dimensional de dados', nodes: 4, connections: 8 },
];

const STATUS_MAP: Record<string, { label: string; className: string }> = {
  active: { label: 'Ativo', className: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
  idle: { label: 'Inativo', className: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
  offline: { label: 'Offline', className: 'bg-red-500/15 text-red-400 border-red-500/30' },
};

export default function MetaversoTab() {
  const [colibriHealth, setColibriHealth] = useState<{ status: string; latency?: number } | null>(null);

  useEffect(() => {
    fetch('/api/colibri/health')
      .then(r => r.json())
      .then(d => setColibriHealth(d))
      .catch(() => setColibriHealth({ status: 'offline' }));
  }, []);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Globe className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-bold text-zinc-200">Metaverso & Ecosistema</span>
          <Badge className="bg-purple-500/15 text-purple-400 border-purple-500/30 text-[10px]">5 Modulos</Badge>
        </div>
        {colibriHealth && (
          <Badge variant="outline" className={cn("text-[10px] border", STATUS_MAP[colibriHealth.status]?.className)}>
            Colibri: {colibriHealth.status}{colibriHealth.latency ? ` (${colibriHealth.latency}ms)` : ''}
          </Badge>
        )}
      </div>

      {/* Ecosystem Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {ECOSYSTEM_MODULES.map((mod, i) => {
          const Icon = mod.icon;
          const st = STATUS_MAP[mod.status] || STATUS_MAP.idle;
          return (
            <motion.div key={mod.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
              <Card className="border-zinc-800/60 bg-zinc-900/50 hover:border-zinc-700/60 transition-colors h-full">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                        <Icon className={cn("w-4 h-4", mod.color)} />
                      </div>
                      <CardTitle className="text-[12px] font-bold text-zinc-200">{mod.name}</CardTitle>
                    </div>
                    <Badge variant="outline" className={cn("text-[9px] border", st.className)}>{st.label}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">{mod.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Realms Section */}
      <Card className="border-zinc-800/60 bg-zinc-900/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
            <Network className="w-3.5 h-3.5 text-purple-400" /> Dominios do Ecossistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {REALMS.map((realm) => (
              <div key={realm.name} className="p-3 rounded-lg bg-zinc-800/30 border border-zinc-700/20 hover:border-purple-500/20 transition-colors">
                <div className="text-[12px] font-bold text-zinc-200 mb-1">{realm.name}</div>
                <p className="text-[10px] text-zinc-500 mb-2">{realm.desc}</p>
                <div className="flex gap-3 text-[9px] text-zinc-600">
                  <span className="text-purple-400">{realm.nodes} nos</span>
                  <span className="text-cyan-400">{realm.connections} conexoes</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}