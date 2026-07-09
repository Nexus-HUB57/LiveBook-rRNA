import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, Copy, Eye, EyeOff, Lock, Unlock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface VaultAddress {
  id: string;
  address: string;
  derivationPath: string;
  balance: string;
  isActive: boolean;
}

export default function CerberusVault() {
  const [vaultAddresses, setVaultAddresses] = useState<VaultAddress[]>([
    {
      id: "1",
      address: "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4",
      derivationPath: "m/84'/0'/0'/0/0",
      balance: "5.2341",
      isActive: true,
    },
    {
      id: "2",
      address: "bc1qr508d6qejxtdg4y5r3zarvary0c5xw7kxpjzsx",
      derivationPath: "m/84'/0'/0'/0/1",
      balance: "3.1234",
      isActive: true,
    },
  ]);

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [passphrase, setPassphrase] = useState("");
  const [showPassphrase, setShowPassphrase] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [showMnemonic, setShowMnemonic] = useState(false);

  const handleUnlock = () => {
    if (passphrase === "Benjamin2020*1981$") {
      setIsUnlocked(true);
      alert("✓ Cofre Cerberus desbloqueado com sucesso!");
    } else {
      alert("✗ Passphrase incorreta");
    }
  };

  const handleLock = () => {
    setIsUnlocked(false);
    setPassphrase("");
    setShowMnemonic(false);
  };

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setCopied(address);
    setTimeout(() => setCopied(null), 2000);
  };

  const totalVaultBalance = vaultAddresses.reduce((sum, addr) => sum + parseFloat(addr.balance), 0);

  const mockMnemonic =
    "abandon ability able about above absent absorb abstract abuse access accident account achieve across act action actor out autumn average avid avoid awake aware away awesome awful axis baby babylon back bad badge bag balance balcony ball band bank bar bare bargain barrel base basic basket battle be beach bean bear beat beautiful because become beef before begin behind believe below belt bench benefit best betray between beyond bias bible bid bike bind biology bird birth bit bite black blade blame blank blast bleak bless blind blood blossom blow blue blur blush board boat body boil bold bolt bomb bone bonus book boom boost border born borrow boss bottom bounce box boy brake brand brass brave bread breeze brew brick bride brief bright bring brink brisk brittle broad broke broken bronze brood brook broom brother brown browse bruce brute bubble buddy budget buffalo build bulb bulk bullet bundle bunker burden burger burst bus business busy but buy buzz";

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6">
        {/* Header */}
        <div className="flex flex-col gap-2">
          <h1 className="text-3xl font-bold text-orange-400">Carteira Cerberus (Cold Storage)</h1>
          <p className="text-gray-400">Custódia segura de chaves privadas e Master Key criptografada</p>
        </div>

        {/* Security Status */}
        <Card className={`bg-gradient-to-br border-2 ${isUnlocked ? "from-green-900/30 to-green-800/30 border-green-500/50" : "from-red-900/30 to-red-800/30 border-red-500/50"}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-400">Status de Segurança</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isUnlocked ? (
                  <>
                    <Unlock className="w-5 h-5 text-green-400" />
                    <span className="text-lg font-bold text-green-400">Desbloqueado</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 text-red-400" />
                    <span className="text-lg font-bold text-red-400">Bloqueado</span>
                  </>
                )}
              </div>
              <p className="text-sm text-gray-400">
                {isUnlocked ? "Acesso temporário concedido" : "Acesso protegido por passphrase"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Unlock Section */}
        {!isUnlocked && (
          <Card className="bg-slate-900 border-orange-500/20">
            <CardHeader>
              <CardTitle className="text-orange-400">Desbloquear Cofre Cerberus</CardTitle>
              <CardDescription>Digite a passphrase para acessar as chaves privadas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-yellow-500/10 border-yellow-500/20">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <AlertDescription className="text-yellow-400 text-sm">
                  A passphrase é necessária para acessar e gerenciar as chaves privadas do Cerberus.
                </AlertDescription>
              </Alert>

              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Passphrase</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      type={showPassphrase ? "text" : "password"}
                      placeholder="Digite a passphrase"
                      value={passphrase}
                      onChange={(e) => setPassphrase(e.target.value)}
                      className="bg-slate-800 border-slate-700 text-white placeholder-gray-600 pr-10"
                    />
                    <button
                      onClick={() => setShowPassphrase(!showPassphrase)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                    >
                      {showPassphrase ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button
                    onClick={handleUnlock}
                    className="bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    Desbloquear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Unlocked Content */}
        {isUnlocked && (
          <>
            {/* Vault Balance */}
            <Card className="bg-gradient-to-br from-slate-900 to-slate-800 border-orange-500/20">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-gray-400">Saldo Total do Cofre</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold text-orange-400 mb-2">
                  ₿ {totalVaultBalance.toFixed(4)}
                </div>
                <p className="text-xs text-gray-500">
                  Equivalente a ~R$ {(totalVaultBalance * 250000).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="addresses" className="w-full">
              <TabsList className="grid w-full grid-cols-3 bg-slate-800 border border-slate-700">
                <TabsTrigger value="addresses" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                  Endereços do Cofre
                </TabsTrigger>
                <TabsTrigger value="mnemonic" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                  Mnemônico
                </TabsTrigger>
                <TabsTrigger value="keys" className="data-[state=active]:bg-orange-500/20 data-[state=active]:text-orange-400">
                  Chaves Privadas
                </TabsTrigger>
              </TabsList>

              {/* Addresses Tab */}
              <TabsContent value="addresses" className="space-y-4">
                <Card className="bg-slate-900 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Endereços do Cofre (Vault)</CardTitle>
                    <CardDescription>Endereços de coleta para recebimento de fundos</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {vaultAddresses.map((addr) => (
                      <div key={addr.id} className="p-4 bg-slate-800 rounded-lg border border-slate-700 hover:border-orange-500/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <p className="text-sm text-gray-400 mb-1">Endereço</p>
                            <div className="flex items-center gap-2 mb-2">
                              <code className="text-orange-400 font-mono text-sm break-all">{addr.address}</code>
                              <button
                                onClick={() => handleCopyAddress(addr.address)}
                                className="p-1 hover:bg-slate-700 rounded"
                              >
                                <Copy className="w-4 h-4 text-gray-400 hover:text-orange-400" />
                              </button>
                            </div>
                            {copied === addr.address && (
                              <p className="text-xs text-green-400">✓ Copiado</p>
                            )}
                            <p className="text-xs text-gray-500 mt-2">Caminho: {addr.derivationPath}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-2xl font-bold text-orange-400">₿ {addr.balance}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Mnemonic Tab */}
              <TabsContent value="mnemonic" className="space-y-4">
                <Card className="bg-slate-900 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Frase Mnemônica (BIP39)</CardTitle>
                    <CardDescription>Backup seguro para recuperação da carteira</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="bg-red-500/10 border-red-500/20">
                      <AlertCircle className="h-4 w-4 text-red-400" />
                      <AlertDescription className="text-red-400 text-sm">
                        <strong>CRÍTICO:</strong> Guarde esta frase em local seguro. Qualquer pessoa com acesso a ela pode recuperar suas chaves privadas.
                      </AlertDescription>
                    </Alert>

                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <label className="text-sm font-medium text-gray-300">Frase Mnemônica (12 palavras)</label>
                        <button
                          onClick={() => setShowMnemonic(!showMnemonic)}
                          className="text-xs text-orange-400 hover:text-orange-300"
                        >
                          {showMnemonic ? "Ocultar" : "Mostrar"}
                        </button>
                      </div>
                      {showMnemonic ? (
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700">
                          <p className="text-sm text-orange-400 font-mono leading-relaxed break-words">
                            {mockMnemonic}
                          </p>
                          <Button
                            onClick={() => {
                              navigator.clipboard.writeText(mockMnemonic);
                              alert("✓ Frase mnemônica copiada");
                            }}
                            className="mt-4 bg-orange-500 hover:bg-orange-600 text-white w-full"
                          >
                            Copiar Frase
                          </Button>
                        </div>
                      ) : (
                        <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 text-center py-8">
                          <p className="text-gray-500">Frase oculta por segurança</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Keys Tab */}
              <TabsContent value="keys" className="space-y-4">
                <Card className="bg-slate-900 border-orange-500/20">
                  <CardHeader>
                    <CardTitle className="text-orange-400">Chaves Privadas (Criptografadas)</CardTitle>
                    <CardDescription>Armazenadas com AES-256 e protegidas por passphrase</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Alert className="bg-blue-500/10 border-blue-500/20">
                      <AlertCircle className="h-4 w-4 text-blue-400" />
                      <AlertDescription className="text-blue-400 text-sm">
                        As chaves privadas estão criptografadas com AES-256. Apenas você pode descriptografá-las com a passphrase.
                      </AlertDescription>
                    </Alert>

                    <div className="space-y-3">
                      {vaultAddresses.map((addr) => (
                        <div key={addr.id} className="p-3 bg-slate-800 rounded-lg border border-slate-700">
                          <p className="text-xs text-gray-500 mb-2">Endereço: {addr.address.substring(0, 20)}...</p>
                          <p className="text-xs text-orange-400 font-mono break-all">
                            [CHAVE CRIPTOGRAFADA - AES-256]
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Lock Button */}
            <Button
              onClick={handleLock}
              className="w-full bg-red-600 hover:bg-red-700 text-white"
            >
              <Lock className="w-4 h-4 mr-2" />
              Bloquear Cofre
            </Button>
          </>
        )}

        {/* Security Alert */}
        <Alert className="bg-orange-500/10 border-orange-500/20">
          <AlertCircle className="h-4 w-4 text-orange-400" />
          <AlertDescription className="text-orange-400 text-sm">
            <strong>Segurança:</strong> O Cerberus é um Cold Storage offline. Transfira fundos para o Gênesis (Hot Wallet) conforme necessário para transações.
          </AlertDescription>
        </Alert>
      </div>
    </DashboardLayout>
  );
}
