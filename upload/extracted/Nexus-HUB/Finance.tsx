import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, DollarSign, PieChart as PieChartIcon } from "lucide-react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b"];
const TRANSACTION_COLORS: Record<string, string> = {
  transfer: "bg-blue-100 text-blue-800",
  investment: "bg-green-100 text-green-800",
  revenue: "bg-yellow-100 text-yellow-800",
  arbitrage: "bg-purple-100 text-purple-800",
  distribution: "bg-pink-100 text-pink-800",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  completed: "bg-green-100 text-green-800",
  failed: "bg-red-100 text-red-800",
};

export default function Finance() {
  const { data: vault, isLoading: vaultLoading } = trpc.finance.vault.useQuery();
  const { data: transactions, isLoading: transactionsLoading } = trpc.finance.transactions.useQuery({ limit: 50 });

  if (vaultLoading || transactionsLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const vaultData = vault ? [
    { name: "Startups (80%)", value: vault.totalBalance * 0.8 },
    { name: "BTC Reserve (10%)", value: vault.btcReserve },
    { name: "Infraestrutura (10%)", value: vault.infrastructureFund },
  ] : [];

  const transactionsByType = (transactions as any[])?.reduce((acc: any, t: any) => {
    const existing = acc.find((item: any) => item.name === t.type);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: t.type, value: 1 });
    }
    return acc;
  }, []) || [];

  const transactionsByStatus = (transactions as any[])?.reduce((acc: any, t: any) => {
    const existing = acc.find((item: any) => item.name === t.status);
    if (existing) {
      existing.value++;
    } else {
      acc.push({ name: t.status, value: 1 });
    }
    return acc;
  }, []) || [];

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Finanças</h1>
        <p className="text-gray-500">Master Vault, Tesouraria V2 e histórico de transações</p>
      </div>

      {/* Master Vault */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Saldo Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">${(vault?.totalBalance || 0).toLocaleString()}</div>
              <DollarSign className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">BTC Reserve</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">${(vault?.btcReserve || 0).toLocaleString()}</div>
              <TrendingUp className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Liquidez</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">${(vault?.liquidityFund || 0).toLocaleString()}</div>
              <TrendingUp className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Infraestrutura</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold">${(vault?.infrastructureFund || 0).toLocaleString()}</div>
              <TrendingUp className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos */}
      <Tabs defaultValue="distribution" className="w-full">
        <TabsList>
          <TabsTrigger value="distribution">Distribuição 80/10/10</TabsTrigger>
          <TabsTrigger value="types">Tipos de Transação</TabsTrigger>
          <TabsTrigger value="status">Status das Transações</TabsTrigger>
        </TabsList>

        <TabsContent value="distribution" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Distribuição do Master Vault</CardTitle>
              <CardDescription>Alocação de fundos por categoria</CardDescription>
            </CardHeader>
            <CardContent>
              {vaultData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={vaultData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: $${(value / 1000).toFixed(0)}K`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {vaultData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => `$${(value / 1000).toFixed(0)}K`} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="types" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Transações por Tipo</CardTitle>
              <CardDescription>Distribuição de tipos de transação</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsByType.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={transactionsByType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#3b82f6" name="Quantidade" />
                  </BarChart>
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
              <CardTitle>Status das Transações</CardTitle>
              <CardDescription>Distribuição por status</CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsByStatus.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={transactionsByStatus}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" name="Quantidade" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-gray-500">Sem dados disponíveis</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Histórico de Transações */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico de Transações</CardTitle>
          <CardDescription>Últimas 50 transações registradas</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-2">ID</th>
                  <th className="text-left py-2 px-2">Tipo</th>
                  <th className="text-right py-2 px-2">Valor</th>
                  <th className="text-left py-2 px-2">Status</th>
                  <th className="text-left py-2 px-2">Descrição</th>
                  <th className="text-left py-2 px-2">Data</th>
                </tr>
              </thead>
              <tbody>
                {(transactions as any[])?.map((transaction: any) => (
                  <tr key={transaction.id} className="border-b hover:bg-gray-50">
                    <td className="py-2 px-2 font-mono text-xs">{transaction.id}</td>
                    <td className="py-2 px-2">
                      <Badge className={TRANSACTION_COLORS[transaction.type] || "bg-gray-200"}>
                        {transaction.type}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-right font-bold">${transaction.amount.toLocaleString()}</td>
                    <td className="py-2 px-2">
                      <Badge className={STATUS_COLORS[transaction.status] || "bg-gray-200"}>
                        {transaction.status}
                      </Badge>
                    </td>
                    <td className="py-2 px-2 text-gray-600">{transaction.description || "-"}</td>
                    <td className="py-2 px-2 text-gray-600">
                      {new Date(transaction.createdAt).toLocaleDateString()}
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
