import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function Market() {
  const { data: marketData, isLoading: dataLoading } = trpc.market.data.useQuery({});
  const { data: insights, isLoading: insightsLoading } = trpc.market.insights.useQuery({});

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Market Oracle V2</h1>
        <p className="text-slate-400">Dados de mercado em tempo real e análise de sentimento</p>
      </div>

      {/* Market Data */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Dados de Mercado</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataLoading ? (
            Array(6)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-32 bg-slate-700" />)
          ) : (
            marketData?.map((data) => (
              <Card key={data.id} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-white">{data.asset}</h3>
                    <Badge className={data.sentiment === "bullish" ? "bg-green-500" : data.sentiment === "bearish" ? "bg-red-500" : "bg-slate-500"}>
                      {data.sentiment}
                    </Badge>
                  </div>
                  <p className="text-2xl font-bold text-amber-400 mb-2">${data.price.toLocaleString()}</p>
                  <div className="flex items-center gap-1">
                    {data.priceChange24h && data.priceChange24h > 0 ? (
                      <TrendingUp className="w-4 h-4 text-green-400" />
                    ) : (
                      <TrendingDown className="w-4 h-4 text-red-400" />
                    )}
                    <span className={data.priceChange24h && data.priceChange24h > 0 ? "text-green-400" : "text-red-400"}>
                      {data.priceChange24h}% (24h)
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Insights */}
      <div>
        <h2 className="text-xl font-semibold text-white mb-4">Insights de IA</h2>
        <div className="space-y-4">
          {insightsLoading ? (
            Array(3)
              .fill(0)
              .map((_, i) => <Skeleton key={i} className="h-24 bg-slate-700" />)
          ) : (
            insights?.map((insight) => (
              <Card key={insight.id} className="bg-slate-800 border-slate-700">
                <CardContent className="pt-6">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-semibold text-white">{insight.title}</h3>
                    <Badge className={insight.sentiment === "bullish" ? "bg-green-500" : insight.sentiment === "bearish" ? "bg-red-500" : "bg-slate-500"}>
                      {insight.sentiment}
                    </Badge>
                  </div>
                  <p className="text-slate-300 text-sm mb-2">{insight.content}</p>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-400">Confiança: {insight.confidence}%</span>
                    <span className="text-slate-400">{insight.source}</span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
