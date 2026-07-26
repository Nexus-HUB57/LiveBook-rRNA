"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Brain, Wrench, GraduationCap, Workflow, Cpu,
  Shield, Zap, Users, AlertTriangle, CheckCircle2,
  Clock, DollarSign, Target, BookOpen,
} from "lucide-react";
import {
  LIVE_LAB_MANIFESTO,
  getLiveLabStats,
  routeToModel,
} from "@/lib/live-lab";

const NUCLEO_COLORS: Record<number, string> = {
  1: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  2: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  3: "bg-violet-500/20 text-violet-400 border-violet-500/30",
};

const NUCLEO_LABELS: Record<number, string> = {
  1: "N1 Agregador",
  2: "N2 Produtividade",
  3: "N3 Ecossistema",
};

const DOMINIO_COLORS: Record<string, string> = {
  DevOps: "bg-blue-500/20 text-blue-400",
  DataViz: "bg-amber-500/20 text-amber-400",
  ContentGen: "bg-emerald-500/20 text-emerald-400",
  Automation: "bg-cyan-500/20 text-cyan-400",
  Security: "bg-red-500/20 text-red-400",
};

const CRITICIDADE_COLORS: Record<string, string> = {
  alto: "bg-red-500/20 text-red-400",
  medio: "bg-amber-500/20 text-amber-400",
  baixo: "bg-emerald-500/20 text-emerald-400",
};

const CERT_NIVEIS: Record<string, string> = {
  Bronze: "bg-amber-700/30 text-amber-500 border-amber-700/40",
  Prata: "bg-zinc-400/30 text-zinc-300 border-zinc-400/40",
  Ouro: "bg-yellow-400/30 text-yellow-300 border-yellow-400/40",
};

export default function LiveLabTab() {
  const [activeSub, setActiveSub] = useState("n1");
  const stats = getLiveLabStats();
  const manifesto = LIVE_LAB_MANIFESTO;

  return (
    <div className="space-y-4">
      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { label: "Modelos LLM", value: stats.modelos, icon: Brain },
          { label: "Skills", value: stats.skills, icon: Wrench },
          { label: "Meta-Skills", value: stats.metaSkills, icon: Zap },
          { label: "Trilhas", value: stats.trilhas, icon: GraduationCap },
          { label: "Workflows", value: stats.workflows, icon: Workflow },
          { label: "Personas", value: stats.personas, icon: Users },
          { label: "Certificacoes", value: stats.certificacoes, icon: Shield },
        ].map((s) => (
          <Card key={s.label} className="bg-zinc-900/50 border-zinc-800">
            <CardContent className="p-3 flex items-center gap-2">
              <s.icon className="h-4 w-4 text-emerald-400 shrink-0" />
              <div>
                <div className="text-xs text-zinc-500">{s.label}</div>
                <div className="text-lg font-mono font-bold text-white">{s.value}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Sub-Tabs */}
      <Tabs value={activeSub} onValueChange={setActiveSub}>
        <TabsList className="bg-zinc-900 border border-zinc-800">
          <TabsTrigger value="n1" className="text-xs">
            <Brain className="h-3.5 w-3.5 mr-1" />N1 Agregador
          </TabsTrigger>
          <TabsTrigger value="n2" className="text-xs">
            <Wrench className="h-3.5 w-3.5 mr-1" />N2 Produtividade
          </TabsTrigger>
          <TabsTrigger value="n3" className="text-xs">
            <GraduationCap className="h-3.5 w-3.5 mr-1" />N3 Ecossistema
          </TabsTrigger>
          <TabsTrigger value="workflows" className="text-xs">
            <Workflow className="h-3.5 w-3.5 mr-1" />Workflows
          </TabsTrigger>
        </TabsList>

        {/* N1 — Agregador */}
        <TabsContent value="n1" className="mt-4">
          <div className="mb-3 flex items-center gap-2 text-xs text-zinc-500">
            <Cpu className="h-3.5 w-3.5" />
            <span>Roteamento Hibrido: Cascata ponderada por latencia (&lt;1500ms) + peso de uso</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
            {manifesto.nucleo_agregador.modelos.map((m) => (
              <Card key={m.id} className="bg-zinc-900/50 border-zinc-800 hover:border-emerald-500/30 transition-colors">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-mono text-emerald-400 flex items-center justify-between">
                    {m.id}
                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                      {m.provedor}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Contexto</span>
                    <span className="font-mono text-zinc-300">{(m.contexto_tokens / 1000).toFixed(0)}K</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Custo IN</span>
                    <span className="font-mono text-zinc-300">${m.custo_por_1m_tokens.entrada_usd.toFixed(2)}/1M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Custo OUT</span>
                    <span className="font-mono text-zinc-300">${m.custo_por_1m_tokens.saida_usd.toFixed(2)}/1M</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Latencia</span>
                    <span className={`font-mono ${m.latencia_media_ms < 500 ? "text-emerald-400" : m.latencia_media_ms < 1000 ? "text-amber-400" : "text-red-400"}`}>
                      {m.latencia_media_ms}ms
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Peso</span>
                    <span className="font-mono text-cyan-400">{(m.peso_roteamento * 100).toFixed(0)}%</span>
                  </div>
                  <div className="pt-1 border-t border-zinc-800">
                    <div className="text-zinc-500 mb-1">Uso prioritario:</div>
                    <div className="flex flex-wrap gap-1">
                      {m.casos_uso_prioritarios.map((u) => (
                        <Badge key={u} variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                          {u}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* N2 — Produtividade */}
        <TabsContent value="n2" className="mt-4">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Wrench className="h-4 w-4 text-cyan-400" />
            Skills Atomicas ({manifesto.nucleo_produtividade.skills_atomicas.length})
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500">
                  <th className="text-left p-2">Skill</th>
                  <th className="text-left p-2">Trigger</th>
                  <th className="text-left p-2">Dominio</th>
                  <th className="text-left p-2">RBAC</th>
                  <th className="text-left p-2">Criticidade</th>
                </tr>
              </thead>
              <tbody>
                {manifesto.nucleo_produtividade.skills_atomicas.map((s) => (
                  <tr key={s.id} className="border-b border-zinc-800/50 hover:bg-zinc-900/30">
                    <td className="p-2 font-mono text-emerald-400">{s.nome}</td>
                    <td className="p-2 font-mono text-zinc-400">{s.trigger}</td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${DOMINIO_COLORS[s.dominio] || "bg-zinc-700 text-zinc-300"}`}>
                        {s.dominio}
                      </span>
                    </td>
                    <td className="p-2 text-zinc-400">{s.rbac_nivel}</td>
                    <td className="p-2">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] ${CRITICIDADE_COLORS[s.criticidade] || ""}`}>
                        {s.criticidade}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h3 className="text-sm font-semibold text-white mb-3 mt-6 flex items-center gap-2">
            <Zap className="h-4 w-4 text-yellow-400" />
            Meta-Skills ({manifesto.nucleo_produtividade.meta_skills.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {manifesto.nucleo_produtividade.meta_skills.map((ms) => (
              <Card key={ms.id} className="bg-zinc-900/50 border-yellow-500/20">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm font-mono text-yellow-400">{ms.nome}</CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-2 text-xs">
                  <p className="text-zinc-400">{ms.descricao}</p>
                  <div className="text-zinc-500">Skills compostas:</div>
                  <div className="flex flex-wrap gap-1">
                    {ms.skills_compostas.map((sid) => (
                      <Badge key={sid} variant="outline" className="text-[10px] border-yellow-500/30 text-yellow-400/80">
                        {sid}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex justify-between text-zinc-500">
                    <span>Ordem: <span className="text-zinc-300">{ms.ordem_execucao}</span></span>
                    <span>Criticidade: <span className={CRITICIDADE_COLORS[ms.criticidade]?.split(" ")[1] || "text-zinc-300"}>{ms.criticidade}</span></span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* N3 — Ecossistema */}
        <TabsContent value="n3" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {manifesto.nucleo_ecossistema.trilhas.map((trilha) => (
              <Card key={trilha.id} className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm text-violet-400 flex items-center justify-between">
                    {trilha.nome}
                    <Badge className={`text-[10px] ${CERT_NIVEIS[trilha.certificacao.nivel] || ""}`}>
                      {trilha.certificacao.nivel}
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0 space-y-3">
                  <p className="text-xs text-zinc-400">{trilha.descricao}</p>
                  <div>
                    <div className="text-xs text-zinc-500 mb-2">Modulos ({trilha.modulos.length}):</div>
                    <div className="space-y-2">
                      {trilha.modulos.map((mod, idx) => (
                        <div key={mod.id} className="flex items-start gap-2 p-2 bg-zinc-800/50 rounded">
                          <span className="text-[10px] font-mono text-zinc-600 mt-0.5 w-4 shrink-0">M{idx + 1}</span>
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-zinc-200">{mod.titulo}</div>
                            <div className="text-[10px] text-zinc-500 mt-0.5">{mod.descricao}</div>
                            <div className="flex gap-1 mt-1">
                              <Badge variant="outline" className="text-[9px] border-zinc-700 text-emerald-400/80">
                                {mod.modelo_recomendado}
                              </Badge>
                              {mod.skills_exigidas.slice(0, 2).map((s) => (
                                <Badge key={s} variant="outline" className="text-[9px] border-zinc-700 text-cyan-400/80">
                                  {s}
                                </Badge>
                              ))}
                              {mod.skills_exigidas.length > 2 && (
                                <Badge variant="outline" className="text-[9px] border-zinc-700 text-zinc-500">
                                  +{mod.skills_exigidas.length - 2}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-[10px] text-zinc-600 border-t border-zinc-800 pt-2">
                    Requisitos cert.: {trilha.certificacao.requisitos.join(" | ")}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Workflows */}
        <TabsContent value="workflows" className="mt-4">
          <div className="space-y-4">
            {manifesto.workflows_hibridos.map((wf) => (
              <Card key={wf.id} className="bg-zinc-900/50 border-zinc-800">
                <CardHeader className="p-3 pb-2">
                  <CardTitle className="text-sm text-white flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Workflow className="h-4 w-4 text-cyan-400" />
                      {wf.nome}
                    </span>
                    <div className="flex gap-1">
                      {wf.nucleos_envolvidos.map((n) => (
                        <Badge key={n} className={`text-[10px] border ${NUCLEO_COLORS[n]}`}>
                          {NUCLEO_LABELS[n]}
                        </Badge>
                      ))}
                      <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                        {wf.trigger}
                      </Badge>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3 pt-0">
                  <p className="text-xs text-zinc-400 mb-3">{wf.descricao}</p>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {wf.passos.map((passo, idx) => (
                      <div key={idx} className="flex items-center shrink-0">
                        <div className={`px-2 py-1.5 rounded border text-[10px] ${NUCLEO_COLORS[passo.nucleo]}`}>
                          <div className="font-medium">{NUCLEO_LABELS[passo.nucleo]}</div>
                          <div className="text-zinc-400 mt-0.5 max-w-[140px] truncate">{passo.acao}</div>
                        </div>
                        {idx < wf.passos.length - 1 && (
                          <div className="text-zinc-600 mx-1">→</div>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Personas */}
          <h3 className="text-sm font-semibold text-white mb-3 mt-6 flex items-center gap-2">
            <Users className="h-4 w-4 text-emerald-400" />
            Personas do Laboratorio ({manifesto.personas.length})
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {manifesto.personas.map((p) => (
              <Card key={p.id} className="bg-zinc-900/50 border-zinc-800">
                <CardContent className="p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-white">{p.nome}</span>
                    <Badge variant="outline" className="text-[10px] border-zinc-700 text-zinc-400">
                      {p.rbac_nivel}
                    </Badge>
                  </div>
                  <div className="text-xs text-zinc-400">{p.perfil}</div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div className="flex items-center gap-1 text-zinc-500">
                      <DollarSign className="h-3 w-3" />
                      <span>Budget: <span className="font-mono text-zinc-300">{(p.budget_diario_tokens / 1000).toFixed(0)}K tokens</span></span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <BookOpen className="h-3 w-3" />
                      <span>Trilha: <span className="font-mono text-zinc-300">{p.trilha_ativa || "—"}</span></span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Target className="h-3 w-3" />
                      <span>Modulo: <span className="font-mono text-zinc-300">M{p.modulo_atual}</span></span>
                    </div>
                    <div className="flex items-center gap-1 text-zinc-500">
                      <Clock className="h-3 w-3" />
                      <span>Interacoes: <span className="font-mono text-zinc-300">{p.historico_interacoes.length}</span></span>
                    </div>
                  </div>
                  {p.historico_interacoes.length > 0 && (
                    <div className="pt-1 border-t border-zinc-800">
                      <div className="text-[10px] text-zinc-600 mb-1">Ultimas interacoes:</div>
                      {p.historico_interacoes.slice(-3).map((h, i) => (
                        <div key={i} className="text-[10px] text-zinc-500 flex gap-2">
                          <span className="text-zinc-600">{h.data}</span>
                          <Badge className={`text-[8px] px-1 py-0 ${NUCLEO_COLORS[h.nucleo]}`}>
                            N{h.nucleo}
                          </Badge>
                          <span className="truncate">{h.tipo}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Perguntas Criticas */}
          <h3 className="text-sm font-semibold text-white mb-3 mt-6 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-400" />
            Perguntas Criticas para o Time de Engenharia
          </h3>
          <div className="space-y-2">
            {manifesto.perguntas_criticas.map((q, i) => (
              <div key={i} className="flex items-start gap-2 p-3 bg-amber-500/5 border border-amber-500/10 rounded">
                <span className="text-amber-400 font-mono text-xs mt-0.5">Q{i + 1}</span>
                <p className="text-xs text-zinc-300">{q}</p>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}