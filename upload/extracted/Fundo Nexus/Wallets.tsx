import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Loader2, Plus, Wallet, Copy, ExternalLink } from "lucide-react";
import { useEffect, useState } from "react";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";

export default function Wallets() {
  const { user, loading } = useAuth();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    agentId: "",
    name: "",
    walletType: "SegWit" as "P2PKH" | "P2SH" | "SegWit" | "MultiSig",
  });

  useEffect(() => {
    if (!loading && !user) {
      window.location.href = getLoginUrl();
    }
  }, [user, loading]);

  const { data: wallets, isLoading: walletsLoading, refetch } = trpc.wallets.list.useQuery(undefined, {
    enabled: !!user,
  });

  const createWalletMutation = trpc.wallets.create.useMutation({
    onSuccess: () => {
      toast.success("Carteira criada com sucesso!");
      setShowCreateForm(false);
      setFormData({ agentId: "", name: "", walletType: "SegWit" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Erro: ${error.message}`);
    },
  });

  const handleCreateWallet = () => {
    if (!formData.agentId || !formData.name) {
      toast.error("Preencha todos os campos");
      return;
    }

    createWalletMutation.mutate({
      agentId: parseInt(formData.agentId),
      name: formData.name,
      walletType: formData.walletType,
    });
  };

  if (loading || !user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="animate-spin" size={32} />
      </div>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Carteiras Bitcoin</h1>
            <p className="text-slate-600 mt-2">Gerencie suas carteiras com suporte a P2PKH, P2SH e SegWit</p>
          </div>
          <Button onClick={() => setShowCreateForm(!showCreateForm)} className="gap-2">
            <Plus size={16} />
            Nova Carteira
          </Button>
        </div>

        {/* Create Form */}
        {showCreateForm && (
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle>Criar Nova Carteira</CardTitle>
              <CardDescription>Crie uma nova carteira Bitcoin para seu agente</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    ID do Agente
                  </label>
                  <input
                    type="number"
                    value={formData.agentId}
                    onChange={(e) => setFormData({ ...formData, agentId: e.target.value })}
                    placeholder="Ex: 1"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nome da Carteira
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Carteira Principal"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tipo de Endereço
                  </label>
                  <select
                    value={formData.walletType}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        walletType: e.target.value as "P2PKH" | "P2SH" | "SegWit" | "MultiSig",
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="P2PKH">P2PKH (Legacy)</option>
                    <option value="P2SH">P2SH</option>
                    <option value="SegWit">SegWit (Recomendado)</option>
                    <option value="MultiSig">MultiSig</option>
                  </select>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateWallet}
                    disabled={createWalletMutation.isPending}
                    className="flex-1"
                  >
                    {createWalletMutation.isPending ? (
                      <>
                        <Loader2 className="animate-spin mr-2" size={16} />
                        Criando...
                      </>
                    ) : (
                      "Criar Carteira"
                    )}
                  </Button>
                  <Button
                    onClick={() => setShowCreateForm(false)}
                    variant="outline"
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Wallets List */}
        <div className="space-y-4">
          {walletsLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="animate-spin h-6 w-6" />
            </div>
          ) : wallets && wallets.length > 0 ? (
            wallets.map((wallet: any) => (
              <Card key={wallet.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Wallet className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{wallet.name}</CardTitle>
                        <CardDescription>
                          {wallet.agentName} • {wallet.walletType}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">{wallet.totalBalance} BTC</p>
                      <p className="text-xs text-slate-500">Saldo Total</p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {wallet.xpub && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Chave Pública Estendida (xpub)
                        </label>
                        <div className="flex items-center gap-2 p-3 bg-slate-100 rounded-lg">
                          <code className="text-xs text-slate-600 flex-1 truncate">{wallet.xpub}</code>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(wallet.xpub);
                              toast.success("Copiado!");
                            }}
                            className="p-1 hover:bg-slate-200 rounded"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    )}

                    {wallet.derivationPath && (
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Caminho de Derivação (BIP44/BIP84)
                        </label>
                        <p className="text-sm text-slate-600 p-2 bg-slate-100 rounded">
                          {wallet.derivationPath}
                        </p>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <Plus size={16} />
                        Adicionar Endereço
                      </Button>
                      <Button variant="outline" size="sm" className="flex-1 gap-2">
                        <ExternalLink size={16} />
                        Ver no Blockchain
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center">
                  <Wallet className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                  <p className="text-slate-500">Nenhuma carteira criada ainda</p>
                  <Button onClick={() => setShowCreateForm(true)} className="mt-4">
                    Criar Primeira Carteira
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
