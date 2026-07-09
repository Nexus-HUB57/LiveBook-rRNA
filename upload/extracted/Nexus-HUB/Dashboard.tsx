import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Loader2, TrendingUp, Users, Zap, DollarSign, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

export default function Dashboard() {
  const { data: overview, isLoading: overviewLoading } = trpc.dashboard.overview.useQuery();
  const { data: startups, isLoading: startupsLoading } = trpc.startups.list.useQuery({ limit: 10 });
  const { data: agents, isLoading: agentsLoading } = trpc.agents.list.useQuery({ limit: 10 });
  const { data: arbitrage, isLoading: arbitrageLoading } = trpc.arbitrage.opportunities.useQuery({ status: "identified" });
  const { data: transactions, isLoading: transactionsLoading } = trpc.finance.transactions.useQuery({ limit: 10 });
  const { data: vault, isLoading: vaultLoading } = trpc.finance.vault.useQuery();

  if (overviewLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // Dados para gráficos
  const revenueData = (startups as any[])?.slice(0, 5).map(s => ({
    name: s.name,
    revenue: s.revenue,
    traction: s.traction,
  })) || [];

  const agentHealthData = (agents as any[])?.slice(0, 5).map(a => ({
    name: a.name,
    health: a.health,
    energy: a.energy,
    creativity: a.creativity,
  })) || [];

  const statusDistribution = (startups as any[])?.reduce((acc: any, s: any) => {
    const existing = acc.find((item: any) => item.name === s.status);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: s.status, value: 1 });
    }
    return acc;
  }, []) || [];

  return (
    <div className="w-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Nexus-HUB Dashboard</h1>
        <p className="text-gray-500">Visão geral do ecossistema de startups autônomas</p>
      </div>

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Startups Ativas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{overview?.startupsCount || 0}</div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Agentes IA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{overview?.agentsCount || 0}</div>
              <Users className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Receita Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">${(overview?.totalRevenue || 0).toLocaleString()}</div>
              <DollarSign className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Oportunidades NAC</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">{overview?.arbitrageOpportunities || 0}</div>
              <Zap className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas Críticos */}
      {(overview?.arbitrageOpportunities || 0) > 0 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            {overview?.arbitrageOpportunities} oportunidades de arbitragem identificadas. Revisar Motor NAC.
          </AlertDescription>
        </Alert>
      )}

      {/* Gráficos */}
      <Tabs defaultValue="revenue" className="w-full">
        <TabsList>
          <TabsTrigger value="revenue">Receita por Startup</TabsTrigger>
          <TabsTrigger value="agents">Saúde dos Agentes</TabsTrigger>
          <TabsTrigger value="status">Distribuição de Status</TabsTrigger>
        </TabsList>

        <TabsContent value="revenue" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Top 5 Startups por Receita</CardTitle>
              <CardDescription>Receita e tração das startups mais rentáveis</CardDescription>
            </CardHeader>
            <CardContent>
              {revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Receita ($)" />
                    <Bar dataKey="traction" fill="#10b981" name="Tração (%)" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Métricas dos Agentes</CardTitle>
              <CardDescription>Saúde, energia e criatividade dos top 5 agentes</CardDescription>
            </CardHeader>
            <CardContent>
              {agentHealthData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={agentHealthData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="health" stroke="#10b981" name="Saúde" />
                    <Line type="monotone" dataKey="energy" stroke="#f59e0b" name="Energia" />
                    <Line type="monotone" dataKey="creativity" stroke="#8b5cf6" name="Criatividade" />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="status" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição de Status</CardTitle>
              <CardDescription>Startups por status de desenvolvimento</CardDescription>
            </CardHeader>
            <CardContent>
              {statusDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {statusDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Tabelas de Dados */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Startups */}
        <Card>
          <CardHeader>
            <CardTitle>Startups Recentes</CardTitle>
            <CardDescription>Top 5 startups por receita</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(startups as any[])?.slice(0, 5).map((startup: any) => (
                <div key={startup.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{startup.name}</p>
                    <p className="text-sm text-gray-500">{startup.status}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">${startup.revenue.toLocaleString()}</p>
                    <p className="text-sm text-gray-500">{startup.traction}% tração</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Agentes */}
        <Card>
          <CardHeader>
            <CardTitle>Agentes Elite</CardTitle>
            <CardDescription>Top 5 agentes por reputação</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {(agents as any[])?.slice(0, 5).map((agent: any) => (
                <div key={agent.id} className="flex items-center justify-between p-2 border rounded">
                  <div>
                    <p className="font-medium">{agent.name}</p>
                    <p className="text-sm text-gray-500">{agent.role}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">{agent.reputation} pts</p>
                    <p className="text-sm text-gray-500">Saúde: {agent.health}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
