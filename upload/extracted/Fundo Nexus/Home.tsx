import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { TrendingUp, Zap } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useLocation } from "wouter";

export default function Home() {
  const [, navigate] = useLocation();
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex flex-col">
      <header className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Fundo Nexus</h1>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-slate-300">{user?.name}</span>
                <Button
                  onClick={() => logout()}
                  variant="outline"
                  className="border-slate-600 text-slate-300 hover:bg-slate-800"
                >
                  Sair
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-8 py-16">
        <div className="max-w-2xl text-center">
          <h2 className="text-5xl font-bold text-white mb-4">
            Sistema de Gestao Bitcoin
          </h2>
          <p className="text-xl text-slate-300 mb-8">
            Integracao robusta com a rede Bitcoin com suporte a multiplas APIs,
            transmissao de transacoes e monitoramento em tempo real.
          </p>

          {isAuthenticated ? (
            <div className="flex gap-4 justify-center">
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
              >
                <TrendingUp className="mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => navigate("/transactions")}
                variant="outline"
                className="border-slate-600 text-slate-300 hover:bg-slate-800 text-lg px-8 py-6"
              >
                <Zap className="mr-2" />
                Transacoes
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => (window.location.href = getLoginUrl())}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            >
              Comecar Agora
            </Button>
          )}

          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">APIs Multiplas</h3>
              <p className="text-slate-400">
                Integracao com mempool.space, blockchain.com e blockstream.info com
                fallback automatico.
              </p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">Monitoramento</h3>
              <p className="text-slate-400">
                Acompanhe suas transacoes em tempo real com polling automatico e
                notificacoes.
              </p>
            </div>
            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
              <h3 className="text-lg font-semibold text-white mb-2">Confiavel</h3>
              <p className="text-slate-400">
                Sistema robusto com retry logic, validacao de dados e tratamento de
                erros.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
