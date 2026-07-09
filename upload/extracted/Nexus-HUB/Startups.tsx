import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Users, Target } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

const STATUS_COLORS: Record<string, string> = {
  planning: "bg-gray-200 text-gray-800",
  development: "bg-blue-200 text-blue-800",
  launched: "bg-green-200 text-green-800",
  scaling: "bg-purple-200 text-purple-800",
  mature: "bg-yellow-200 text-yellow-800",
  archived: "bg-red-200 text-red-800",
};

export default function Startups() {
  const { data: startups, isLoading } = trpc.startups.list.useQuery({ limit: 50 });
  const { data: metrics } = trpc.performance.metrics.useQuery();
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const filteredStartups = selectedStatus
    ? (startups as any[])?.filter(s => s.status === selectedStatus)
    : startups;

  const statuses = Array.from(new Set((startups as any[])?.map(s => s.status) || []));

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Startups</h1>
        <p className="text-gray-500">Gerenciamento e monitoramento de todas as startups do ecossistema</p>
      </div>

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        <Button
          variant={selectedStatus === null ? "default" : "outline"}
          onClick={() => setSelectedStatus(null)}
        >
          Todas ({(startups as any[])?.length || 0})
        </Button>
        {statuses.map(status => (
          <Button
            key={status}
            variant={selectedStatus === status ? "default" : "outline"}
            onClick={() => setSelectedStatus(status)}
          >
            {status} ({(startups as any[])?.filter(s => s.status === status).length || 0})
          </Button>
        ))}
      </div>

      {/* Grid de Startups */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {(filteredStartups as any[])?.map((startup: any) => {
          const metric = (metrics as any[])?.find(m => m.startupId === startup.id);
          return (
            <Card key={startup.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{startup.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{startup.description}</CardDescription>
                  </div>
                  {startup.isCore && (
                    <Badge className="ml-2 bg-blue-500">Core</Badge>
                  )}
                </div>
                <Badge className={STATUS_COLORS[startup.status] || "bg-gray-200"}>
                  {startup.status}
                </Badge>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Métricas Principais */}
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Receita</p>
                    <p className="text-lg font-bold">${(startup.revenue / 1000).toFixed(0)}K</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Tração</p>
                    <p className="text-lg font-bold">{startup.traction}%</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Reputação</p>
                    <p className="text-lg font-bold">{startup.reputation}</p>
                  </div>
                </div>

                {/* Performance Score */}
                {metric && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-500">Performance Score</p>
                      <p className="font-bold">{metric.overallScore}/100</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-500 h-2 rounded-full"
                        style={{ width: `${metric.overallScore}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Detalhes */}
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-gray-500" />
                    <span>CEO ID: {startup.ceoId || "N/A"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <span>{startup.targetMarket || "Mercado não especificado"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-gray-500" />
                    <span>Geração: {startup.generation}</span>
                  </div>
                </div>

                {/* Ranking */}
                {metric && (
                  <div className="pt-2 border-t">
                    <p className="text-sm text-gray-500">Ranking: <span className="font-bold text-lg">#{metric.rank}</span></p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Tabela de Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo de Performance</CardTitle>
          <CardDescription>Todas as startups ordenadas por performance</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Rank</th>
                  <th className="text-left py-2 px-2">Startup</th>
                  <th className="text-right py-2 px-2">Receita</th>
                  <th className="text-right py-2 px-2">Crescimento</th>
                  <th className="text-right py-2 px-2">Qualidade</th>
                  <th className="text-right py-2 px-2">Market Fit</th>
                  <th className="text-right py-2 px-2">Score</th>
                </tr>
              </thead>
              <tbody>
                {(metrics as any[])?.sort((a, b) => a.rank - b.rank).slice(0, 10).map((metric: any) => {
                  const startup = (startups as any[])?.find(s => s.id === metric.startupId);
                  return (
                    <tr key={metric.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-bold text-lg">#{metric.rank}</td>
                      <td className="py-2 px-2">{startup?.name}</td>
                      <td className="py-2 px-2 text-right">${metric.revenue.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">{metric.userGrowth}%</td>
                      <td className="py-2 px-2 text-right">{metric.productQuality}/100</td>
                      <td className="py-2 px-2 text-right">{metric.marketFit}/100</td>
                      <td className="py-2 px-2 text-right font-bold">{metric.overallScore}/100</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
