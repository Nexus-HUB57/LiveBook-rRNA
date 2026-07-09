import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, RefreshCw, Copy, CheckCircle2, Clock, XCircle } from "lucide-react";
import { toast } from "sonner";

export default function Transactions() {
  const [address, setAddress] = useState("");
  const [selectedTxid, setSelectedTxid] = useState<string | null>(null);
  const [copiedTxid, setCopiedTxid] = useState<string | null>(null);

  // Queries
  const historyQuery = trpc.bitcoin.getTransactionHistory.useQuery(
    { address, limit: 50 },
    { enabled: !!address }
  );

  const txDetailsQuery = trpc.bitcoin.getTransaction.useQuery(
    { txid: selectedTxid || "0000000000000000000000000000000000000000000000000000000000000000" },
    { enabled: !!selectedTxid }
  );

  const monitoredQuery = trpc.bitcoin.listMonitored.useQuery();

  // Mutations
  const startMonitoringMutation = trpc.bitcoin.startMonitoring.useMutation({
    onSuccess: () => {
      toast.success("Monitoramento iniciado");
      monitoredQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const stopMonitoringMutation = trpc.bitcoin.stopMonitoring.useMutation({
    onSuccess: () => {
      toast.success("Monitoramento parado");
      monitoredQuery.refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCopyTxid = (txid: string) => {
    navigator.clipboard.writeText(txid);
    setCopiedTxid(txid);
    setTimeout(() => setCopiedTxid(null), 2000);
  };

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return <CheckCircle2 className="w-5 h-5 text-green-500" />;
      case "pending":
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case "failed":
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-green-100 text-green-800">Confirmada</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">Pendente</Badge>;
      case "failed":
        return <Badge className="bg-red-100 text-red-800">Falha</Badge>;
      default:
        return <Badge>Desconhecido</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">
            Transações Bitcoin
          </h1>
          <p className="text-slate-600">
            Monitore e gerencie suas transações em tempo real
          </p>
        </div>

        <Tabs defaultValue="history" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="history">Histórico</TabsTrigger>
            <TabsTrigger value="monitoring">Monitoramento</TabsTrigger>
            <TabsTrigger value="details">Detalhes</TabsTrigger>
          </TabsList>

          {/* Aba de Histórico */}
          <TabsContent value="history" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Buscar Histórico</h2>
              <div className="flex gap-4">
                <Input
                  placeholder="Digite um endereço Bitcoin (bc1...)"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={() => historyQuery.refetch()}
                  disabled={historyQuery.isLoading}
                >
                  {historyQuery.isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Buscar
                </Button>
              </div>
            </Card>

            {historyQuery.isLoading && (
              <div className="flex justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              </div>
            )}

            {historyQuery.data?.transactions && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">
                  {historyQuery.data.count} transações encontradas
                </h3>
                {historyQuery.data.transactions.map((tx) => (
                  <Card
                    key={tx.id}
                    className="p-4 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => {
                      setSelectedTxid(tx.transactionHash);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          {getStatusIcon(tx.status)}
                          <div>
                            <p className="font-mono text-sm text-slate-600">
                              {tx.transactionHash.substring(0, 16)}...
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(tx.createdAt).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-slate-600">De:</p>
                            <p className="font-mono text-xs">
                              {tx.fromAddress.substring(0, 16)}...
                            </p>
                          </div>
                          <div>
                            <p className="text-slate-600">Para:</p>
                            <p className="font-mono text-xs">
                              {tx.toAddress.substring(0, 16)}...
                            </p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {getStatusBadge(tx.status)}
                        <p className="text-lg font-semibold mt-2">
                          {(parseInt(tx.amount) / 100000000).toFixed(8)} BTC
                        </p>
                        <p className="text-xs text-slate-500">
                          Taxa: {(parseInt(tx.fee || "0") / 100000000).toFixed(8)} BTC
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Aba de Monitoramento */}
          <TabsContent value="monitoring" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Transações Monitoradas</h2>
              {monitoredQuery.isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                </div>
              ) : monitoredQuery.data?.transactions.length === 0 ? (
                <p className="text-slate-600">Nenhuma transação sendo monitorada</p>
              ) : (
                <div className="space-y-4">
                  {monitoredQuery.data?.transactions.map((tx) => (
                    <Card key={tx.txid} className="p-4 bg-blue-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <p className="font-mono text-sm">
                              {tx.txid.substring(0, 16)}...
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleCopyTxid(tx.txid)}
                            >
                              {copiedTxid === tx.txid ? (
                                <CheckCircle2 className="w-4 h-4 text-green-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-slate-600">Status:</p>
                              <p className="font-semibold">{tx.status}</p>
                            </div>
                            <div>
                              <p className="text-slate-600">Confirmações:</p>
                              <p className="font-semibold">{tx.confirmations}</p>
                            </div>
                            <div>
                              <p className="text-slate-600">Tentativas:</p>
                              <p className="font-semibold">
                                {tx.attempts}/{tx.maxAttempts}
                              </p>
                            </div>
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => stopMonitoringMutation.mutate({ txid: tx.txid })}
                          disabled={stopMonitoringMutation.isPending}
                        >
                          Parar
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

          {/* Aba de Detalhes */}
          <TabsContent value="details" className="space-y-6">
            <Card className="p-6">
              <h2 className="text-xl font-semibold mb-4">Detalhes da Transação</h2>
              {selectedTxid ? (
                txDetailsQuery.isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  </div>
                ) : txDetailsQuery.data?.transaction ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-600 text-sm">TXID</p>
                        <p className="font-mono text-sm break-all">
                          {txDetailsQuery.data.transaction.txid}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Status</p>
                        {getStatusBadge(txDetailsQuery.data.transaction.status)}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-slate-600 text-sm">Confirmações</p>
                        <p className="font-semibold">
                          {txDetailsQuery.data.transaction.confirmations}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-600 text-sm">Taxa</p>
                        <p className="font-semibold">
                          {txDetailsQuery.data.transaction.fee
                            ? `${txDetailsQuery.data.transaction.fee} sat`
                            : "N/A"}
                        </p>
                      </div>
                    </div>

                    {txDetailsQuery.data.transaction.blockHeight && (
                      <div>
                        <p className="text-slate-600 text-sm">Altura do Bloco</p>
                        <p className="font-semibold">
                          {txDetailsQuery.data.transaction.blockHeight}
                        </p>
                      </div>
                    )}

                    <Button
                      onClick={() =>
                        selectedTxid && startMonitoringMutation.mutate({
                          txid: selectedTxid,
                          address: address,
                        })
                      }
                      disabled={startMonitoringMutation.isPending}
                    >
                      {startMonitoringMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      ) : (
                        <Clock className="w-4 h-4 mr-2" />
                      )}
                      Monitorar Transação
                    </Button>
                  </div>
                ) : (
                  <p className="text-slate-600">Transação não encontrada</p>
                )
              ) : (
                <p className="text-slate-600">Selecione uma transação para ver detalhes</p>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
