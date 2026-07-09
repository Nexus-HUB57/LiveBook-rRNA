import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, Zap } from "lucide-react";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const SENTIMENT_COLORS: Record<string, string> = {
  bullish: "bg-green-200 text-green-800",
  bearish: "bg-red-200 text-red-800",
  neutral: "bg-gray-200 text-gray-800",
};

export default function MarketOracle() {
  const { data: marketData, isLoading: dataLoading } = trpc.market.data.useQuery();
  const { data: insights, isLoading: insightsLoading } = trpc.market.insights.useQuery({ limit: 20 });

  if (dataLoading || insightsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Preparar dados para gráfico
  const chartData = (marketData as any[])?.slice(0, 10).map(d => ({
    asset: d.asset,
    price: d.price,
    volume: d.volume24h,
    change: d.priceChange24h,
  })) || [];

  const bullishInsights = (insights as any[])?.filter(i => i.sentiment === "bullish") || [];
  const bearishInsights = (insights as any[])?.filter(i => i.sentiment === "bearish") || [];
  const neutralInsights = (insights as any[])?.filter(i => i.sentiment === "neutral") || [];

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Market Oracle V2</h1>
        <p className="text-gray-500">Análise de mercado em tempo real com IA e insights de tendências</p>
      </div>

      {/* Resumo de Sentimento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-green-200 bg-green-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-green-800">Bullish</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{bullishInsights.length}</div>
            <p className="text-xs text-green-700 mt-1">Insights otimistas</p>
          </CardContent>
        </Card>

        <Card className="border-gray-200 bg-gray-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-800">Neutral</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-gray-600">{neutralInsights.length}</div>
            <p className="text-xs text-gray-700 mt-1">Insights neutros</p>
          </CardContent>
        </Card>

        <Card className="border-red-200 bg-red-50">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-red-800">Bearish</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{bearishInsights.length}</div>
            <p className="text-xs text-red-700 mt-1">Insights pessimistas</p>
          </CardContent>
        </Card>
      </div>

      {/* Dados de Mercado */}
      <Tabs defaultValue="prices" className="w-full">
        <TabsList>
          <TabsTrigger value="prices">Preços e Volume</TabsTrigger>
          <TabsTrigger value="insights">Insights IA</TabsTrigger>
        </TabsList>

        <TabsContent value="prices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Preços de Ativos</CardTitle>
              <CardDescription>Últimos preços e variação 24h</CardDescription>
            </CardHeader>
            <CardContent>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="asset" />
                    <YAxis yAxisId="left" />
                    <YAxis yAxisId="right" orientation="right" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="price" stroke="#3b82f6" name="Preço ($)" />
                    <Line yAxisId="right" type="monotone" dataKey="change" stroke="#10b981" name="Variação 24h (%)" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tabela de Ativos</CardTitle>
              <CardDescription>Dados detalhados de mercado</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">Ativo</th>
                      <th className="text-right py-2 px-2">Preço</th>
                      <th className="text-right py-2 px-2">Variação 24h</th>
                      <th className="text-right py-2 px-2">Volume 24h</th>
                      <th className="text-right py-2 px-2">Market Cap</th>
                      <th className="text-left py-2 px-2">Sentimento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(marketData as any[])?.slice(0, 15).map((data: any) => (
                      <tr key={data.id} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-2 font-medium">{data.asset}</td>
                        <td className="py-2 px-2 text-right">${data.price.toLocaleString()}</td>
                        <td className={`py-2 px-2 text-right font-bold ${data.priceChange24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {data.priceChange24h >= 0 ? "+" : ""}{data.priceChange24h}%
                        </td>
                        <td className="py-2 px-2 text-right">${(data.volume24h / 1000000).toFixed(2)}M</td>
                        <td className="py-2 px-2 text-right">${(data.marketCap / 1000000000).toFixed(2)}B</td>
                        <td className="py-2 px-2">
                          <Badge className={SENTIMENT_COLORS[data.sentiment] || "bg-gray-200"}>
                            {data.sentiment}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          {/* Bullish Insights */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-green-600">📈 Insights Bullish</h3>
            <div className="space-y-3">
              {bullishInsights.map((insight: any) => (
                <Card key={insight.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <CardDescription>{insight.content}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-green-200 text-green-800">Confiança: {insight.confidence}%</Badge>
                        <Badge className={`${SENTIMENT_COLORS[insight.sentiment]}`}>
                          {insight.sentiment}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    <p>Ativos relacionados: {insight.relatedAssets}</p>
                    <p>Impacto: {insight.impact}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Neutral Insights */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-gray-600">➡️ Insights Neutros</h3>
            <div className="space-y-3">
              {neutralInsights.map((insight: any) => (
                <Card key={insight.id} className="border-gray-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <CardDescription>{insight.content}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-gray-200 text-gray-800">Confiança: {insight.confidence}%</Badge>
                        <Badge className={`${SENTIMENT_COLORS[insight.sentiment]}`}>
                          {insight.sentiment}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    <p>Ativos relacionados: {insight.relatedAssets}</p>
                    <p>Impacto: {insight.impact}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Bearish Insights */}
          <div>
            <h3 className="text-lg font-bold mb-3 text-red-600">📉 Insights Bearish</h3>
            <div className="space-y-3">
              {bearishInsights.map((insight: any) => (
                <Card key={insight.id} className="border-red-200">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-base">{insight.title}</CardTitle>
                        <CardDescription>{insight.content}</CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge className="bg-red-200 text-red-800">Confiança: {insight.confidence}%</Badge>
                        <Badge className={`${SENTIMENT_COLORS[insight.sentiment]}`}>
                          {insight.sentiment}
                        </Badge>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-600">
                    <p>Ativos relacionados: {insight.relatedAssets}</p>
                    <p>Impacto: {insight.impact}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
