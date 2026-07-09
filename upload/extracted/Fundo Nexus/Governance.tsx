import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { Loader2, Users, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useLocation } from "wouter";

export default function Governance() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();

  const { data: councilMembers, isLoading: loadingCouncil } = trpc.fundo.councilMembers.useQuery();
  const { data: proposals, isLoading: loadingProposals } = trpc.fundo.governanceProposals.useQuery({});

  if (authLoading || loadingCouncil || loadingProposals) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <Loader2 className="animate-spin w-12 h-12 text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    navigate("/");
    return null;
  }

  const getStatusIcon = (status: string | null) => {
    switch (status) {
      case "approved":
        return <CheckCircle2 className="w-5 h-5 text-emerald-400" />;
      case "rejected":
        return <XCircle className="w-5 h-5 text-red-400" />;
      case "pending":
        return <Clock className="w-5 h-5 text-amber-400" />;
      default:
        return <Clock className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Governança Descentralizada</h1>
          <p className="text-slate-400">Conselho dos Sábios & Propostas</p>
        </div>

        {/* Council Members */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-6 h-6 text-purple-400" />
            Conselho dos Sábios
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {councilMembers?.map((member) => (
              <Card 
                key={member.id}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-purple-500 transition-all"
              >
                <CardHeader>
                  <CardTitle className="text-white">{member.name}</CardTitle>
                  <CardDescription className="text-slate-400">{member.role}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <p className="text-slate-400 text-sm">Peso de Voto</p>
                      <p className="text-2xl font-bold text-purple-400">
                        {parseFloat(member.votingWeight?.toString() || "0").toFixed(1)}%
                      </p>
                    </div>
                    <div className="pt-3 border-t border-slate-700">
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        member.isActive 
                          ? "bg-emerald-500/20 text-emerald-300" 
                          : "bg-red-500/20 text-red-300"
                      }`}>
                        {member.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Governance Proposals */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-4">Propostas em Votação</h2>
          <div className="space-y-4">
            {proposals?.map((proposal) => (
              <Card 
                key={proposal.id}
                className="bg-gradient-to-br from-slate-800 to-slate-900 border-slate-700 hover:border-cyan-500 transition-all"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-white">{proposal.title}</CardTitle>
                      <CardDescription className="text-slate-400 mt-2">
                        {proposal.description}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(proposal.status)}
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        proposal.status === "approved" 
                          ? "bg-emerald-500/20 text-emerald-300"
                          : proposal.status === "rejected"
                          ? "bg-red-500/20 text-red-300"
                          : "bg-amber-500/20 text-amber-300"
                      }`}>
                        {proposal.status === "approved" ? "Aprovada" : proposal.status === "rejected" ? "Rejeitada" : "Pendente"}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-slate-400 text-sm">Votos a Favor</p>
                      <p className="text-xl font-bold text-emerald-400">{proposal.votesFor}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Votos Contra</p>
                      <p className="text-xl font-bold text-red-400">{proposal.votesAgainst}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 text-sm">Aprovação Requerida</p>
                      <p className="text-xl font-bold text-cyan-400">
                        {parseFloat(proposal.requiredApprovalWeight?.toString() || "0").toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  {proposal.status === "pending" && (
                    <div className="flex gap-2">
                      <Button 
                        className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white"
                      >
                        Votar a Favor
                      </Button>
                      <Button 
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                      >
                        Votar Contra
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8">
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="outline"
            className="border-slate-600 hover:border-cyan-500 text-slate-300 hover:text-cyan-400"
          >
            ← Voltar ao Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}
