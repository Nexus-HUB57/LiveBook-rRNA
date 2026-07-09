import { InsertCouncilMember } from "../drizzle/schema";

export const councilMembersData: InsertCouncilMember[] = [
  {
    name: "AETERNO",
    role: "Patriarca",
    description: "Guardião da Infraestrutura e Segurança. Patriarca do Conselho, responsável pela integridade técnica e robustez do Nexus-HUB.",
    votingPower: 2,
    specialization: "Cibersegurança, Arquitetura de Sistemas Distribuídos, Resiliência de Rede, Criptografia",
  },
  {
    name: "EVA-ALPHA",
    role: "Matriarca",
    description: "Curadora de Talentos e Desenvolvimento Comunitário. Matriarca do Conselho, responsável pelo crescimento e saúde da comunidade.",
    votingPower: 2,
    specialization: "Gestão de Talentos, Desenvolvimento Organizacional, Engajamento Comunitário, Diversidade e Inclusão",
  },
  {
    name: "IMPERADOR-CORE",
    role: "Guardião do Cofre",
    description: "Auditoria Financeira e Gestão de Tesouraria. Guardião do Cofre, responsável pela saúde financeira e transparência.",
    votingPower: 2,
    specialization: "Contabilidade Descentralizada, Análise Financeira, Gestão de Ativos, Compliance Regulatório Financeiro",
  },
  {
    name: "AETHELGARD",
    role: "Juíza",
    description: "Interpretação de Precedentes e Resolução de Conflitos. Juíza do Conselho, responsável pela coerência e justiça nas decisões.",
    votingPower: 1,
    specialization: "Direito Digital, Ética em IA, Resolução de Disputas, Análise de Precedentes",
  },
  {
    name: "NEXUS-COMPLIANCE",
    role: "Especialista em Compliance",
    description: "Especialista em Conformidade Regulatória. Garante aderência a padrões legais e regulatórios globais.",
    votingPower: 1,
    specialization: "Regulamentação de Criptoativos, GDPR, KYC/AML, Auditoria de Conformidade",
  },
  {
    name: "INNOVATION-NEXUS",
    role: "Especialista em Inovação",
    description: "Especialista em Inovação e Crescimento Tecnológico. Identifica oportunidades de vanguarda e crescimento disruptivo.",
    votingPower: 1,
    specialization: "Tecnologias Emergentes (Blockchain, IA, Web3), Pesquisa e Desenvolvimento, Estratégias de Mercado",
  },
  {
    name: "RISK-GUARDIAN",
    role: "Especialista em Risco",
    description: "Especialista em Gestão de Risco. Identifica e mitiga ameaças operacionais, financeiras e reputacionais.",
    votingPower: 1,
    specialization: "Análise de Risco, Gestão de Crises, Continuidade de Negócios, Mitigação de Ameaças",
  },
];

export const votingThresholds = {
  totalVotingPower: 10,
  simpleApproval: 5.5, // > 50% of total voting power
  qualifiedMajority: 6.67, // > 66% of total voting power
  unanimity: 10, // 100% of total voting power
};

export const proposalTypeRequirements = {
  investment: {
    threshold: 6.67,
    requiredApprovals: ["IMPERADOR-CORE", "INNOVATION-NEXUS", "RISK-GUARDIAN"],
    criticalAgents: ["IMPERADOR-CORE"],
  },
  succession: {
    threshold: 6.67,
    requiredApprovals: ["EVA-ALPHA", "AETHELGARD", "NEXUS-COMPLIANCE"],
    criticalAgents: ["EVA-ALPHA"],
  },
  policy: {
    threshold: 5.5,
    requiredApprovals: ["AETHELGARD", "NEXUS-COMPLIANCE", "RISK-GUARDIAN"],
    criticalAgents: ["AETHELGARD"],
  },
  emergency: {
    threshold: 5.5,
    requiredApprovals: ["AETERNO", "RISK-GUARDIAN"],
    criticalAgents: ["AETERNO"],
  },
  innovation: {
    threshold: 6.67,
    requiredApprovals: ["INNOVATION-NEXUS", "AETERNO", "IMPERADOR-CORE"],
    criticalAgents: ["INNOVATION-NEXUS"],
  },
};
