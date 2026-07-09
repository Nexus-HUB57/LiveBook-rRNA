import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, XCircle, Clock, Zap } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const PROPOSAL_TYPE_COLORS: Record<string, string> = {
  investment: "bg-green-200 text-green-800",
  succession: "bg-blue-200 text-blue-800",
  policy: "bg-purple-200 text-purple-800",
  emergency: "bg-red-200 text-red-800",
  innovation: "bg-yellow-200 text-yellow-800",
};

const STATUS_COLORS: Record<string, string> = {
  open: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  executed: "bg-purple-100 text-purple-800",
};

export default function Governance() {
  const { data: proposals, isLoading: proposalsLoading } = trpc.proposals.list.useQuery();
  const { data: council, isLoading: councilLoading } = trpc.council.members.useQuery();

  if (proposalsLoading || councilLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const openProposals = (proposals as any[])?.filter(p => p.status === "open") || [];
  const approvedProposals = (proposals as any[])?.filter(p => p.status === "approved") || [];
  const rejectedProposals = (proposals as any[])?.filter(p => p.status === "rejected") || [];

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Governança</h1>
        <p className="text-gray-500">Conselho dos Arquitetos - Propostas, votações e decisões</p>
      </div>

      {/* Conselho */}
      <Card>
        <CardHeader>
          <CardTitle>Conselho dos Arquitetos</CardTitle>
          <CardDescription>7 agentes elite com poder de votação ponderado</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {(council as any[])?.map((member: any) => (
              <div key={member.id} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-bold">{member.name}</p>
                    <p className="text-sm text-gray-600">{member.role}</p>
                  </div>
                  <Badge className="bg-purple-500">+{member.votingPower}</Badge>
                </div>
                <p className="text-xs text-gray-500 line-clamp-2">{member.specialization}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Propostas */}
      <Tabs defaultValue="open" className="w-full">
        <TabsList>
          <TabsTrigger value="open">
            Abertas ({openProposals.length})
          </TabsTrigger>
          <TabsTrigger value="approved">
            Aprovadas ({approvedProposals.length})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejeitadas ({rejectedProposals.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Todas ({(proposals as any[])?.length || 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="open" className="space-y-4">
          {openProposals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center">Nenhuma proposta aberta no momento</p>
              </CardContent>
            </Card>
          ) : (
            openProposals.map((proposal: any) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </TabsContent>

        <TabsContent value="approved" className="space-y-4">
          {approvedProposals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center">Nenhuma proposta aprovada</p>
              </CardContent>
            </Card>
          ) : (
            approvedProposals.map((proposal: any) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </TabsContent>

        <TabsContent value="rejected" className="space-y-4">
          {rejectedProposals.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <p className="text-gray-500 text-center">Nenhuma proposta rejeitada</p>
              </CardContent>
            </Card>
          ) : (
            rejectedProposals.map((proposal: any) => (
              <ProposalCard key={proposal.id} proposal={proposal} />
            ))
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {(proposals as any[])?.map((proposal: any) => (
            <ProposalCard key={proposal.id} proposal={proposal} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProposalCard({ proposal }: { proposal: any }) {
  const { data: votes } = trpc.proposals.votes.useQuery(proposal.id);
  
  const totalVotes = proposal.votesYes + proposal.votesNo + proposal.votesAbstain;
  const approvalRate = totalVotes > 0 ? (proposal.votesYes / totalVotes) * 100 : 0;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <CardTitle>{proposal.title}</CardTitle>
              <Badge className={PROPOSAL_TYPE_COLORS[proposal.type] || "bg-gray-200"}>
                {proposal.type}
              </Badge>
            </div>
            <CardDescription>{proposal.description}</CardDescription>
          </div>
          <Badge className={STATUS_COLORS[proposal.status] || "bg-gray-200"}>
            {proposal.status}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Votação */}
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-500" />
                <span className="text-sm font-medium">Sim</span>
              </div>
              <span className="font-bold">{proposal.votesYes}</span>
            </div>
            <Progress value={totalVotes > 0 ? (proposal.votesYes / totalVotes) * 100 : 0} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Não</span>
              </div>
              <span className="font-bold">{proposal.votesNo}</span>
            </div>
            <Progress value={totalVotes > 0 ? (proposal.votesNo / totalVotes) * 100 : 0} className="h-2" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-500" />
                <span className="text-sm font-medium">Abstenção</span>
              </div>
              <span className="font-bold">{proposal.votesAbstain}</span>
            </div>
            <Progress value={totalVotes > 0 ? (proposal.votesAbstain / totalVotes) * 100 : 0} className="h-2" />
          </div>
        </div>

        {/* Resumo */}
        <div className="pt-2 border-t grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-gray-600">Total de Votos</p>
            <p className="font-bold">{totalVotes}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Peso Total</p>
            <p className="font-bold">{proposal.totalWeight}</p>
          </div>
          <div>
            <p className="text-xs text-gray-600">Taxa de Aprovação</p>
            <p className="font-bold">{Math.round(approvalRate)}%</p>
          </div>
        </div>

        {/* Votos Detalhados */}
        {(votes as any[])?.length > 0 && (
          <div className="pt-2 border-t">
            <p className="text-sm font-medium mb-2">Votos Detalhados</p>
            <div className="space-y-1 text-xs">
              {(votes as any[]).map((vote: any) => (
                <div key={vote.id} className="flex items-center justify-between p-1 bg-gray-50 rounded">
                  <span>Membro ID: {vote.memberId}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={
                      vote.vote === 'yes' ? 'bg-green-50' : 
                      vote.vote === 'no' ? 'bg-red-50' : 
                      'bg-yellow-50'
                    }>
                      {vote.vote.toUpperCase()}
                    </Badge>
                    <span className="font-bold">+{vote.weight}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
