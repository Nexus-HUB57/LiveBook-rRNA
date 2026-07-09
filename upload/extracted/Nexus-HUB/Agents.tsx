import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Zap, Heart, Lightbulb, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

const ROLE_COLORS: Record<string, string> = {
  cto: "bg-blue-200 text-blue-800",
  cmo: "bg-green-200 text-green-800",
  cfo: "bg-yellow-200 text-yellow-800",
  cdo: "bg-purple-200 text-purple-800",
  ceo: "bg-red-200 text-red-800",
  legal: "bg-gray-200 text-gray-800",
  redteam: "bg-orange-200 text-orange-800",
  architect: "bg-indigo-200 text-indigo-800",
};

export default function Agents() {
  const { data: agents, isLoading } = trpc.agents.list.useQuery({ limit: 100 });
  const { data: council } = trpc.council.members.useQuery();
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const filteredAgents = selectedRole
    ? (agents as any[])?.filter(a => a.role === selectedRole)
    : agents;

  const roles = Array.from(new Set((agents as any[])?.map(a => a.role) || []));

  return (
    <div className="w-full space-y-6 p-6">
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Agentes IA</h1>
        <p className="text-gray-500">Perfis, especialização e métricas de saúde dos agentes autônomos</p>
      </div>

      <Tabs defaultValue="agents" className="w-full">
        <TabsList>
          <TabsTrigger value="agents">Todos os Agentes</TabsTrigger>
          <TabsTrigger value="council">Conselho dos Arquitetos</TabsTrigger>
        </TabsList>

        <TabsContent value="agents" className="space-y-6">
          {/* Filtros */}
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={selectedRole === null ? "default" : "outline"}
              onClick={() => setSelectedRole(null)}
            >
              Todos ({(agents as any[])?.length || 0})
            </Button>
            {roles.map(role => (
              <Button
                key={role}
                variant={selectedRole === role ? "default" : "outline"}
                onClick={() => setSelectedRole(role)}
              >
                {role.toUpperCase()} ({(agents as any[])?.filter(a => a.role === role).length || 0})
              </Button>
            ))}
          </div>

          {/* Grid de Agentes */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(filteredAgents as any[])?.map((agent: any) => (
              <Card key={agent.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{agent.name}</CardTitle>
                      <CardDescription>{agent.specialization}</CardDescription>
                    </div>
                  </div>
                  <Badge className={ROLE_COLORS[agent.role] || "bg-gray-200"}>
                    {agent.role.toUpperCase()}
                  </Badge>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Métricas Principais */}
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-600">Saúde</span>
                        </div>
                        <span className="font-bold">{agent.health}%</span>
                      </div>
                      <Progress value={agent.health} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">Energia</span>
                        </div>
                        <span className="font-bold">{agent.energy}%</span>
                      </div>
                      <Progress value={agent.energy} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="w-4 h-4 text-purple-500" />
                          <span className="text-sm text-gray-600">Criatividade</span>
                        </div>
                        <span className="font-bold">{agent.creativity}%</span>
                      </div>
                      <Progress value={agent.creativity} className="h-2" />
                    </div>
                  </div>

                  {/* Reputação */}
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-blue-500" />
                        <span className="text-sm text-gray-600">Reputação</span>
                      </div>
                      <span className="font-bold">{agent.reputation} pts</span>
                    </div>
                  </div>

                  {/* Taxa de Sucesso */}
                  <div className="pt-2 border-t space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Sucessos</span>
                      <span className="font-bold text-green-600">{agent.successCount}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Falhas</span>
                      <span className="font-bold text-red-600">{agent.failureCount}</span>
                    </div>
                    {(agent.successCount + agent.failureCount) > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Taxa de Sucesso</span>
                        <span className="font-bold">
                          {Math.round((agent.successCount / (agent.successCount + agent.failureCount)) * 100)}%
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="council" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {(council as any[])?.map((member: any) => (
              <Card key={member.id} className="border-2 border-purple-300">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.role}</CardDescription>
                    </div>
                    <Badge className="bg-purple-500">Poder: {member.votingPower}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mt-2">{member.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Especialização</p>
                    <p className="font-medium">{member.specialization}</p>
                  </div>

                  {/* Métricas de Saúde */}
                  <div className="space-y-3 pt-2 border-t">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          <span className="text-sm text-gray-600">Saúde</span>
                        </div>
                        <span className="font-bold">{member.health}%</span>
                      </div>
                      <Progress value={member.health} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          <span className="text-sm text-gray-600">Energia</span>
                        </div>
                        <span className="font-bold">{member.energy}%</span>
                      </div>
                      <Progress value={member.energy} className="h-2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
