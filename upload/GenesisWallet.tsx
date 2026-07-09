import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Copy, Plus, Send } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface BitcoinAddress {
  id: string;
  address: string;
  balance: string;
  lastUpdated: string;
}

export default function GenesisWallet() {
  const [addresses, setAddresses] = useState<BitcoinAddress[]>([
    {
      id: "1",
      address: "bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq",
      balance: "0.5234",
      lastUpdated: "2025-12-15T13:00:00Z",
    },
  ]);

  const [sendForm, setSendForm] = useState({
    toAddress: "",
    amount: "",
    fee: "medium",
  });

  const [copied, setCopied] = useState<string | null>(null);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSendTransaction = () => {
    if (!sendForm.toAddress || !sendForm.amount) {
      alert("Por favor, preencha todos os campos");
      return;
    }
    console.log("Enviando transação:", sendForm);
    // TODO: Implementar envio de transação
  };

  const totalBalance = addresses.reduce((sum, addr) => sum + parseFloat(addr.balance), 0);

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-yellow-400">Carteira Gênesis (Hot Wallet)</h1>
          <p className="text-gray-400">Gerenciamento de endereços ativos para transações diárias</p>
        </div>

        {/* Balance Overview */}
        <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Saldo Total Disponível</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-yellow-400 mb-2">
              ₿ {totalBalance.toFixed(4)}
            </div>
            <p className="text-xs text-gray-500">
              Equivalente a ~R$ {(totalBalance * 250000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="addresses" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-slate-800 border border-slate-700">
            <TabsTrigger value="addresses" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              Endereços Ativos
            </TabsTrigger>
            <TabsTrigger value="send" className="data-[state=active]:bg-yellow-500/20 data-[state=active]:text-yellow-400">
              Enviar Bitcoin
            </TabsTrigger>
          </TabsList>

          {/* Addresses Tab */}
          <TabsContent value="addresses" className="space-y-4">
            <Card className="bg-slate-900 border-yellow-500/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="text-yellow-400">Endereços Ativos</CardTitle>
                    <CardDescription>Endereços com saldo disponível para transações</CardDescription>
                  </div>
                  <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                    <Plus className="w-4 h-4 mr-2" />
                    Novo Endereço
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {addresses.map((addr) => (
                  <div key={addr.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-yellow-500/50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1">
                        <p className="text-sm text-gray-400 mb-1">Endereço</p>
                        <div className="flex items-center gap-2">
                          <code className="text-yellow-400 font-mono text-sm break-all">{addr.address}</code>
                          <button
                            onClick={() => handleCopyAddress(addr.address)}
                            className="p-1 hover:bg-slate-700 rounded"
                          >
                            <Copy className="w-4 h-4 text-gray-400 hover:text-yellow-400" />
                          </button>
                        </div>
                        {copied === addr.address && (
                          <p className="text-xs text-green-400 mt-1">✓ Copiado</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-yellow-400">₿ {addr.balance}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          Atualizado: {new Date(addr.lastUpdated).toLocaleString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Send Tab */}
          <TabsContent value="send" className="space-y-4">
            <Card className="bg-slate-900 border-orange-500/20">
              <CardHeader>
                <CardTitle className="text-orange-400">Enviar Bitcoin</CardTitle>
                <CardDescription>Crie e envie uma transação Bitcoin</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert className="bg-blue-500/10 border-blue-500/20">
                  <AlertCircle className="h-4 w-4 text-blue-400" />
                  <AlertDescription className="text-blue-400 text-sm">
                    Todas as transações serão assinadas localmente e transmitidas com fallback automático
                  </AlertDescription>
                </Alert>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Endereço de Destino</label>
                    <Input
                      placeholder="bc1q... ou 1A1z..."
                      value={sendForm.toAddress}
                      onChange={(e) => setSendForm({ ...sendForm, toAddress: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Quantidade (BTC)</label>
                    <Input
                      type="number"
                      placeholder="0.0000"
                      step="0.0001"
                      value={sendForm.amount}
                      onChange={(e) => setSendForm({ ...sendForm, amount: e.target.value })}
                      className="bg-slate-800 border-slate-700 text-white placeholder-gray-600"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-300 block mb-2">Velocidade de Transação</label>
                    <select
                      value={sendForm.fee}
                      onChange={(e) => setSendForm({ ...sendForm, fee: e.target.value })}
                      className="w-full bg-slate-800 border border-slate-700 text-white rounded px-3 py-2"
                    >
                      <option value="slow">Lenta (≈ 1 hora)</option>
                      <option value="medium">Normal (≈ 10-30 min)</option>
                      <option value="fast">Rápida (≈ 1-10 min)</option>
                    </select>
                  </div>

                  <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                    <p className="text-sm text-gray-400 mb-2">Resumo da Transação</p>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Quantidade:</span>
                        <span className="text-yellow-400">₿ {sendForm.amount || "0.0000"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Taxa Estimada:</span>
                        <span className="text-orange-400">₿ 0.0001</span>
                      </div>
                      <div className="flex justify-between border-t border-slate-700 pt-2 mt-2">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-yellow-400 font-bold">
                          ₿ {(parseFloat(sendForm.amount || "0") + 0.0001).toFixed(4)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    onClick={handleSendTransaction}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Enviar Transação
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Security Alert */}
        <Alert className="bg-yellow-500/10 border-yellow-500/20">
          <AlertCircle className="h-4 w-4 text-yellow-400" />
          <AlertDescription className="text-yellow-400 text-sm">
            <strong>Segurança:</strong> A Carteira Gênesis é uma Hot Wallet para transações diárias. Mantenha saldos baixos e transfira fundos do Cerberus (Cold Storage) conforme necessário.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}
