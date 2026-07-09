import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, TrendingUp, CheckCircle, Clock, XCircle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ScatterChart, Scatter } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const STATUS_COLORS: Record<string, string> = {
  identified: "bg-blue-100 text-blue-800",
  executing: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

const STATUS_ICONS: Record<string, any> = {
  identified: Clock,
  executing: Zap,
  completed: CheckCircle,
  failed: XCircle,
};

export default function Arbitrage() {
  const { data: opportunities, isLoading } = trpc.arbitrage.opportunities.useQuery();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const identified = (opportunities as any[])?.filter(o => o.status === "identified") || [];
  const executing = (opportunities as any[])?.filter(o => o.status === "executing") || [];
  const completed = (opportunities as any[])?.filter(o => o.status === "completed") || [];
  const failed = (opportunities as any[])?.filter(o => o.status === "failed") || [];

  // Dados para gráfico
  const profitData = (opportunities as any[])?.map(o => ({
    asset: o.asset,
    profitPotential: o.profitPotential,
    confidence: o.confidence,
    status: o.status,
  })) || [];

  const confidenceData = (opportunities as any[])?.map(o => ({
    asset: o.asset,
    priceDifference: o.priceDifference,
    confidence: o.confidence,
  })) || [];

  const totalPotentialProfit = (opportunities as any[])?.reduce((sum, o) => sum + o.profitPotential, 0) || 0;
  const avgConfidence = (opportunities as any[])?.length > 0
    ? Math.round((opportunities as any[]).reduce((sum, o) => sum + o.confidence, 0) / (opportunities as any[]).length)
    : 0;

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Motor de Arbitragem Preditiva (NAC)</h1>
        <p className="text-gray-500">Identificação automática de oportunidades entre exchanges com análise preditiva</p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Oportunidades Identificadas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{identified.length}</div>
              <Clock className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Em Execução</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{executing.length}</div>
              <Zap className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Profit Potencial Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">${totalPotentialProfit.toLocaleString()}</div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Confiança Média</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{avgConfidence}%</div>
              <CheckCircle className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="profit" className="w-full">
        <TabsList>
          <TabsTrigger value="profit">Profit Potencial</TabsTrigger>
          <TabsTrigger value="confidence">Confiança vs Diferença</TabsTrigger>
          <TabsTrigger value="status">Status</TabsTrigger>
        </TabsList>

        <TabsContent value="profit" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Profit Potencial por Ativo</CardTitle>
              <CardDescription>Oportunidades ordenadas por lucro potencial</CardDescription>
            </CardHeader>
            <CardContent>
              {profitData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={profitData.sort((a, b) => b.profitPotential - a.profitPotential).slice(0, 10)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="asset" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="profitPotential" fill="#10b981" name="Profit ($)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="confidence" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Confiança vs Diferença de Preço</CardTitle>
              <CardDescription>Análise de risco vs oportunidade</CardDescription>
            </CardHeader>
            <CardContent>
              {confidenceData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="priceDifference" name="Diferença de Preço" />
                    <YAxis type="number" dataKey="confidence" name="Confiança (%)" />
                    <Tooltip cursor={{ strokeDasharray: "3 3" }} />
                    <Scatter name="Oportunidades" data={confidenceData} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Distribuição por Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Identificadas</span>
                    <span className="font-bold">{identified.length}</span>
                  </div>
                  <Progress value={(identified.length / ((opportunities as any[])?.length || 1)) * 100} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Em Execução</span>
                    <span className="font-bold">{executing.length}</span>
                  </div>
                  <Progress value={(executing.length / ((opportunities as any[])?.length || 1)) * 100} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Completadas</span>
                    <span className="font-bold">{completed.length}</span>
                  </div>
                  <Progress value={(completed.length / ((opportunities as any[])?.length || 1)) * 100} />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Falhadas</span>
                    <span className="font-bold">{failed.length}</span>
                  </div>
                  <Progress value={(failed.length / ((opportunities as any[])?.length || 1)) * 100} />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo de Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 border rounded bg-blue-50">
                  <p className="text-sm text-gray-600">Identificadas (aguardando execução)</p>
                  <p className="text-2xl font-bold text-blue-600">{identified.length}</p>
                </div>
                <div className="p-3 border rounded bg-yellow-50">
                  <p className="text-sm text-gray-600">Em execução (processando)</p>
                  <p className="text-2xl font-bold text-yellow-600">{executing.length}</p>
                </div>
                <div className="p-3 border rounded bg-green-50">
                  <p className="text-sm text-gray-600">Completadas (sucesso)</p>
                  <p className="text-2xl font-bold text-green-600">{completed.length}</p>
                </div>
                <div className="p-3 border rounded bg-red-50">
                  <p className="text-sm text-gray-600">Falhadas (erro)</p>
                  <p className="text-2xl font-bold text-red-600">{failed.length}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Tabela Detalhada */}
      <Card>
        <CardHeader>
          <CardTitle>Oportunidades Detalhadas</CardTitle>
          <CardDescription>Todas as oportunidades de arbitragem identificadas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">Ativo</th>
                  <th className="text-left py-2 px-2">De → Para</th>
                  <th className="text-right py-2 px-2">Diferença</th>
                  <th className="text-right py-2 px-2">Profit</th>
                  <th className="text-right py-2 px-2">Confiança</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {(opportunities as any[])?.map((opp: any) => {
                  const StatusIcon = STATUS_ICONS[opp.status];
                  return (
                    <tr key={opp.id} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2 font-bold">{opp.asset}</td>
                      <td className="py-2 px-2 text-xs">
                        <span className="bg-gray-100 px-2 py-1 rounded">{opp.exchangeFrom}</span>
                        <span className="mx-1">→</span>
                        <span className="bg-gray-100 px-2 py-1 rounded">{opp.exchangeTo}</span>
                      </td>
                      <td className="py-2 px-2 text-right font-bold">${opp.priceDifference.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right font-bold text-green-600">${opp.profitPotential.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${opp.confidence}%` }}
                            />
                          </div>
                          <span className="font-bold">{opp.confidence}%</span>
                        </div>
                      </td>
                      <td className="py-2 px-2">
                        <div className="flex items-center gap-2">
                          <StatusIcon className="w-4 h-4" />
                          <Badge className={STATUS_COLORS[opp.status]}>
                            {opp.status}
                          </Badge>
                        </div>
                      </td>
                      <td className="py-2 px-2 text-gray-600">
                        {new Date(opp.createdAt).toLocaleDateString()}
                      </td>
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
