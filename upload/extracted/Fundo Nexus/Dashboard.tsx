import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, TrendingUp, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const [address, setAddress] = useState("");
  const [showBalance, setShowBalance] = useState(false);

  // Queries
  const balanceQuery = trpc.bitcoin.getBalance.useQuery(
    { address },
    { enabled: !!address && showBalance }
  );

  const utxosQuery = trpc.bitcoin.getUTXOs.useQuery(
    { address },
    { enabled: !!address && showBalance }
  );

  const feesQuery = trpc.bitcoin.estimateFee.useQuery();
  const monitoredQuery = trpc.bitcoin.listMonitored.useQuery();

  const handleCheckBalance = () => {
    if (!address) {
      toast.error("Por favor, digite um endereço Bitcoin");
      return;
    }
    setShowBalance(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Dashboard Bitcoin
          </h1>
          <p className="text-slate-600">
            Monitore seus ativos e transações em tempo real
          </p>
        </div>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Card de Saldo */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Saldo Total</h3>
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            {balanceQuery.isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            ) : balanceQuery.data ? (
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {balanceQuery.data.btc}
                </p>
                <p className="text-sm text-slate-600 mt-2">BTC</p>
              </div>
            ) : (
              <p className="text-slate-600">Nenhum saldo</p>
            )}
          </Card>

          {/* Card de UTXOs */}
          <Card className="p-6 bg-gradient-to-br from-green-50 to-green-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">UTXOs</h3>
              <CheckCircle2 className="w-5 h-5 text-green-600" />
            </div>
            {utxosQuery.isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-green-600" />
            ) : (
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {utxosQuery.data?.count || 0}
                </p>
                <p className="text-sm text-slate-600 mt-2">Unspent Outputs</p>
              </div>
            )}
          </Card>

          {/* Card de Taxa */}
          <Card className="p-6 bg-gradient-to-br from-purple-50 to-purple-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Taxa Padrão</h3>
              <AlertCircle className="w-5 h-5 text-purple-600" />
            </div>
            {feesQuery.isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
            ) : (
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {feesQuery.data?.fees.standard || 0}
                </p>
                <p className="text-sm text-slate-600 mt-2">sat/vB</p>
              </div>
            )}
          </Card>

          {/* Card de Monitoramento */}
          <Card className="p-6 bg-gradient-to-br from-orange-50 to-orange-100">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-900">Monitoradas</h3>
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            {monitoredQuery.isLoading ? (
              <Loader2 className="w-6 h-6 animate-spin text-orange-600" />
            ) : (
              <div>
                <p className="text-3xl font-bold text-slate-900">
                  {monitoredQuery.data?.count || 0}
                </p>
                <p className="text-sm text-slate-600 mt-2">Transações</p>
              </div>
            )}
          </Card>
        </div>

        <Tabs defaultValue="balance" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="balance">Saldo e UTXOs</TabsTrigger>
            <TabsTrigger value="fees">Taxas de Rede</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
          </TabsList>

          {/* Aba de Saldo */}
          <TabsContent value="balance" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Consultar Saldo</h2>
              <div className="flex gap-4 mb-6">
                <Input
                  placeholder="Digite um endereço Bitcoin (bc1...)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={handleCheckBalance}
                  disabled={balanceQuery.isLoading || utxosQuery.isLoading}
                >
                  {balanceQuery.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <TrendingUp className="w-4 h-4 mr-2" />
                  )}
                  Verificar
                </Button>
              </div>

              {balanceQuery.data && (
                <div className="space-y-4">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-slate-600 mb-1">Saldo Total</p>
                    <p className="text-3xl font-bold text-blue-600">
                      {balanceQuery.data.btc} BTC
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {utxosQuery.data && utxosQuery.data.utxos.length > 0 && (
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">
                  UTXOs ({utxosQuery.data.count})
                </h2>
                <div className="space-y-3">
                  {utxosQuery.data.utxos.map((utxo, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm">
                          {utxo.txid.substring(0, 16)}...:{utxo.vout}
                        </p>
                        <p className="text-xs text-slate-600">
                          {utxo.confirmed ? "Confirmado" : "Não confirmado"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">
                          {(utxo.value / 100000000).toFixed(8)} BTC
                        </p>
                        {utxo.confirmed && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            ✓ Confirmado
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </TabsContent>

          {/* Aba de Taxas */}
          <TabsContent value="fees" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Estimativa de Taxas</h2>
              {feesQuery.isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm text-slate-600 mb-2">Lenta</p>
                    <p className="text-2xl font-bold text-green-600">
                      {feesQuery.data?.fees.slow}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">sat/vByte</p>
                  </div>

                  <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                    <p className="text-sm text-slate-600 mb-2">Padrão</p>
                    <p className="text-2xl font-bold text-yellow-600">
                      {feesQuery.data?.fees.standard}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">sat/vByte</p>
                  </div>

                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-slate-600 mb-2">Rápida</p>
                    <p className="text-2xl font-bold text-red-600">
                      {feesQuery.data?.fees.fast}
                    </p>
                    <p className="text-xs text-slate-600 mt-2">sat/vByte</p>
                  </div>
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Aba de Monitoramento */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">
                Transações Monitoradas ({monitoredQuery.data?.count || 0})
              </h2>
              {monitoredQuery.isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : monitoredQuery.data?.transactions.length === 0 ? (
                <p className="text-slate-600">Nenhuma transação sendo monitorada</p>
              ) : (
                <div className="space-y-3">
                  {monitoredQuery.data?.transactions.map((tx) => (
                    <div key={tx.txid} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <div>
                        <p className="font-mono text-sm">
                          {tx.txid.substring(0, 16)}...
                        </p>
                        <p className="text-xs text-slate-600">
                          Tentativa {tx.attempts}/{tx.maxAttempts}
                        </p>
                      </div>
                      <div className="text-right">
                        <Badge className="bg-blue-100 text-blue-800 mb-2">
                          {tx.status}
                        </Badge>
                        <p className="text-sm font-semibold">
                          {tx.confirmations} confirmações
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
