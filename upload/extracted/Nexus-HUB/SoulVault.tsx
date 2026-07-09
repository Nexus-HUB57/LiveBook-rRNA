import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, Lightbulb, CheckCircle, AlertCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const TYPE_COLORS: Record<string, string> = {
  decision: "bg-blue-200 text-blue-800",
  precedent: "bg-purple-200 text-purple-800",
  lesson: "bg-yellow-200 text-yellow-800",
  insight: "bg-green-200 text-green-800",
};

const TYPE_ICONS: Record<string, any> = {
  decision: CheckCircle,
  precedent: BookOpen,
  lesson: Lightbulb,
  insight: AlertCircle,
};

export default function SoulVault() {
  const { data: entries, isLoading } = trpc.soulVault.entries.useQuery();
  const [selectedType, setSelectedType] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const decisions = (entries as any[])?.filter(e => e.type === "decision") || [];
  const precedents = (entries as any[])?.filter(e => e.type === "precedent") || [];
  const lessons = (entries as any[])?.filter(e => e.type === "lesson") || [];
  const insights = (entries as any[])?.filter(e => e.type === "insight") || [];

  const filteredEntries = selectedType
    ? (entries as any[])?.filter(e => e.type === selectedType)
    : entries;

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Soul Vault</h1>
        <p className="text-gray-500">Memória institucional - Decisões, precedentes e lições aprendidas</p>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Decisões</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{decisions.length}</div>
              <CheckCircle className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Precedentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{precedents.length}</div>
              <BookOpen className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Lições</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{lessons.length}</div>
              <Lightbulb className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Insights</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{insights.length}</div>
              <AlertCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedType === null ? "default" : "outline"}
          onClick={() => setSelectedType(null)}
        >
          Todas ({(entries as any[])?.length || 0})
        </Button>
        <Button
          variant={selectedType === "decision" ? "default" : "outline"}
          onClick={() => setSelectedType("decision")}
        >
          Decisões ({decisions.length})
        </Button>
        <Button
          variant={selectedType === "precedent" ? "default" : "outline"}
          onClick={() => setSelectedType("precedent")}
        >
          Precedentes ({precedents.length})
        </Button>
        <Button
          variant={selectedType === "lesson" ? "default" : "outline"}
          onClick={() => setSelectedType("lesson")}
        >
          Lições ({lessons.length})
        </Button>
        <Button
          variant={selectedType === "insight" ? "default" : "outline"}
          onClick={() => setSelectedType("insight")}
        >
          Insights ({insights.length})
        </Button>
      </div>

      {/* Entradas */}
      <div className="space-y-4">
        {(filteredEntries as any[])?.map((entry: any) => {
          const Icon = TYPE_ICONS[entry.type];
          return (
            <Card key={entry.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    <Icon className="w-5 h-5 mt-1 text-gray-500" />
                    <div className="flex-1">
                      <CardTitle className="text-lg">{entry.title}</CardTitle>
                      <CardDescription className="mt-1">{entry.content}</CardDescription>
                    </div>
                  </div>
                  <Badge className={TYPE_COLORS[entry.type]}>
                    {entry.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center gap-4 text-sm">
                  {entry.relatedProposalId && (
                    <div>
                      <p className="text-gray-600">Proposta Relacionada: <span className="font-bold">#{entry.relatedProposalId}</span></p>
                    </div>
                  )}
                  {entry.impact && (
                    <div>
                      <p className="text-gray-600">Impacto: <span className="font-bold">{entry.impact}</span></p>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Registrado em {new Date(entry.createdAt).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabela Cronológica */}
      <Card>
        <CardHeader>
          <CardTitle>Timeline Completa</CardTitle>
          <CardDescription>Histórico de entradas ordenado cronologicamente</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Data</th>
                  <th className="text-left py-2 px-2">Tipo</th>
                  <th className="text-left py-2 px-2">Título</th>
                  <th className="text-left py-2 px-2">Impacto</th>
                  <th className="text-left py-2 px-2">Proposta</th>
                </tr>
              </thead>
              <tbody>
                {(entries as any[])?.map((entry: any) => (
                  <tr key={entry.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 text-gray-600">
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-2 px-2">
                      <Badge className={TYPE_COLORS[entry.type]}>
                        {entry.type}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 font-medium">{entry.title}</td>
                    <td className="py-2 px-2">{entry.impact || "-"}</td>
                    <td className="py-2 px-2 font-mono text-xs">
                      {entry.relatedProposalId ? `#${entry.relatedProposalId}` : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
