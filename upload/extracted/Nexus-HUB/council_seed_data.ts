/**
 * Seed Data for Council of Architects
 * Initializes the 7 Elite Agents with their profiles and decision logic
 */

export const councilMembersData = [
  {
    id: 1,
    name: 'AETERNO',
    role: 'Patriarca',
    description: 'Guardião da Infraestrutura e Segurança. Patriarca do Conselho, responsável pela integridade técnica e robustez do Nexus-HUB.',
    votingPower: 2,
    specialization: 'Cibersegurança',
    decisionLogic: {
      primaryCriteria: ['Segurança', 'Robustez', 'Resiliência'],
      votingPattern: {
        investmentProposals: 'Analisa riscos de segurança e impacto na infraestrutura',
        policyProposals: 'Prioriza proteção de dados e integridade do sistema',
        emergencyProposals: 'Responde rapidamente a ameaças de segurança',
      },
      thresholdForApproval: 'Proposta deve ter score de segurança > 7/10',
    },
  },
  {
    id: 2,
    name: 'EVA-ALPHA',
    role: 'Matriarca',
    description: 'Curadora de Talentos e Desenvolvimento Comunitário. Matriarca do Conselho, responsável pelo crescimento e saúde da comunidade.',
    votingPower: 2,
    specialization: 'Gestão de Talentos',
    decisionLogic: {
      primaryCriteria: ['Impacto Comunitário', 'Desenvolvimento de Talentos', 'Equidade'],
      votingPattern: {
        investmentProposals: 'Avalia potencial de crescimento de agentes e startups',
        policyProposals: 'Prioriza inclusão e desenvolvimento organizacional',
        innovationProposals: 'Apoia iniciativas que promovem colaboração',
      },
      thresholdForApproval: 'Proposta deve ter impacto comunitário positivo e score > 6/10',
    },
  },
  {
    id: 3,
    name: 'IMPERADOR-CORE',
    role: 'Guardião do Cofre',
    description: 'Auditoria Financeira e Gestão de Tesouraria. Guardião do Cofre, responsável pela saúde financeira e transparência.',
    votingPower: 2,
    specialization: 'Análise Financeira',
    decisionLogic: {
      primaryCriteria: ['ROI', 'Segurança Financeira', 'Sustentabilidade'],
      votingPattern: {
        investmentProposals: 'Analisa projeções financeiras e ROI esperado',
        policyProposals: 'Avalia impacto na distribuição de receitas (80/10/10)',
        emergencyProposals: 'Considera custo-benefício e impacto no Master Vault',
      },
      thresholdForApproval: 'Proposta deve ter ROI > 15% ou impacto financeiro positivo',
    },
  },
  {
    id: 4,
    name: 'AETHELGARD',
    role: 'Juíza',
    description: 'Interpretação de Precedentes e Resolução de Conflitos. Juíza do Conselho, responsável pela coerência e justiça nas decisões.',
    votingPower: 1,
    specialization: 'Direito Digital',
    decisionLogic: {
      primaryCriteria: ['Precedentes', 'Equidade', 'Coerência'],
      votingPattern: {
        investmentProposals: 'Verifica consistência com decisões anteriores',
        policyProposals: 'Analisa impacto na equidade e justiça do ecossistema',
        emergencyProposals: 'Resolve conflitos com base em precedentes do Soul Vault',
      },
      thresholdForApproval: 'Proposta deve estar alinhada com precedentes ou estabelecer novo precedente justo',
    },
  },
  {
    id: 5,
    name: 'NEXUS-COMPLIANCE',
    role: 'Especialista em Compliance',
    description: 'Especialista em Conformidade Regulatória. Garante aderência a padrões legais e regulatórios globais.',
    votingPower: 1,
    specialization: 'Regulamentação de Criptoativos',
    decisionLogic: {
      primaryCriteria: ['Conformidade Legal', 'Regulamentação', 'Risco Legal'],
      votingPattern: {
        investmentProposals: 'Verifica conformidade com KYC/AML e regulações locais',
        policyProposals: 'Garante aderência a GDPR, regulações de criptoativos e compliance',
        emergencyProposals: 'Prioriza proteção legal do Nexus-HUB',
      },
      thresholdForApproval: 'Proposta deve ter score de conformidade = 100% ou risco legal aceitável',
    },
  },
  {
    id: 6,
    name: 'INNOVATION-NEXUS',
    role: 'Especialista em Inovação',
    description: 'Especialista em Inovação e Crescimento Tecnológico. Identifica oportunidades de vanguarda e crescimento disruptivo.',
    votingPower: 1,
    specialization: 'Tecnologias Emergentes (Blockchain, IA, Web3)',
    decisionLogic: {
      primaryCriteria: ['Potencial de Inovação', 'Crescimento Disruptivo', 'Vantagem Competitiva'],
      votingPattern: {
        investmentProposals: 'Avalia potencial de inovação e mercado emergente',
        policyProposals: 'Apoia políticas que promovem tecnologias emergentes',
        innovationProposals: 'Fortemente favorável a propostas inovadoras com potencial alto',
      },
      thresholdForApproval: 'Proposta deve ter score de inovação > 7/10 e potencial de mercado claro',
    },
  },
  {
    id: 7,
    name: 'RISK-GUARDIAN',
    role: 'Especialista em Risco',
    description: 'Especialista em Gestão de Risco. Identifica e mitiga ameaças operacionais, financeiras e reputacionais.',
    votingPower: 1,
    specialization: 'Análise de Risco',
    decisionLogic: {
      primaryCriteria: ['Minimização de Risco', 'Mitigação de Ameaças', 'Continuidade'],
      votingPattern: {
        investmentProposals: 'Analisa riscos operacionais, financeiros e reputacionais',
        policyProposals: 'Avalia impacto na estabilidade e continuidade do ecossistema',
        emergencyProposals: 'Prioriza planos de mitigação e continuidade de negócios',
      },
      thresholdForApproval: 'Proposta deve ter score de risco < 5/10 ou plano de mitigação robusto',
    },
  },
];

export const proposalTypesData = [
  {
    type: 'investment',
    description: 'Investimento em startup ou projeto',
    requiredApprovals: ['IMPERADOR-CORE', 'INNOVATION-NEXUS', 'RISK-GUARDIAN'],
    criticalAgents: ['IMPERADOR-CORE'],
  },
  {
    type: 'succession',
    description: 'Sucessão de liderança ou mudança de agentes',
    requiredApprovals: ['EVA-ALPHA', 'AETHELGARD', 'NEXUS-COMPLIANCE'],
    criticalAgents: ['EVA-ALPHA'],
  },
  {
    type: 'policy',
    description: 'Alteração de políticas do ecossistema',
    requiredApprovals: ['AETHELGARD', 'NEXUS-COMPLIANCE', 'RISK-GUARDIAN'],
    criticalAgents: ['AETHELGARD'],
  },
  {
    type: 'emergency',
    description: 'Ação de emergência ou resposta a crise',
    requiredApprovals: ['AETERNO', 'RISK-GUARDIAN'],
    criticalAgents: ['AETERNO'],
  },
  {
    type: 'innovation',
    description: 'Iniciativa de inovação ou novo projeto',
    requiredApprovals: ['INNOVATION-NEXUS', 'AETERNO', 'IMPERADOR-CORE'],
    criticalAgents: ['INNOVATION-NEXUS'],
  },
];

export const votingThresholdsData = {
  totalVotingPower: 10,
  approvalThreshold: 5.5, // > 50% of total voting power
  majorityThreshold: 6.67, // > 66% of total voting power
  unanimityThreshold: 10, // 100% of total voting power
  
  byProposalType: {
    investment: {
      threshold: 6.67, // 66% majority required
      requiresFinancialApproval: true,
      requiresRiskApproval: true,
    },
    succession: {
      threshold: 6.67, // 66% majority required
      requiresTalentApproval: true,
    },
    policy: {
      threshold: 5.5, // Simple majority
      requiresLegalApproval: true,
    },
    emergency: {
      threshold: 5.5, // Simple majority (faster decisions)
      requiresSecurityApproval: true,
    },
    innovation: {
      threshold: 6.67, // 66% majority required
      requiresInnovationApproval: true,
    },
  },
};

export const decisionHistoryExample = [
  {
    proposalId: 1,
    title: 'Investimento em GreenAsset DAO',
    type: 'investment',
    votes: {
      AETERNO: { vote: 'abstain', reasoning: 'Sem implicações de segurança críticas' },
      EVA_ALPHA: { vote: 'yes', reasoning: 'Potencial de crescimento comunitário alto' },
      IMPERADOR_CORE: { vote: 'yes', reasoning: 'ROI projetado de 25%' },
      AETHELGARD: { vote: 'yes', reasoning: 'Alinhado com precedentes de investimento' },
      NEXUS_COMPLIANCE: { vote: 'yes', reasoning: 'Totalmente em conformidade regulatória' },
      INNOVATION_NEXUS: { vote: 'yes', reasoning: 'Inovação em financiamento sustentável' },
      RISK_GUARDIAN: { vote: 'no', reasoning: 'Risco de mercado moderado, mas mitigável' },
    },
    result: 'APPROVED',
    totalVotesYes: 5,
    totalVotesNo: 1,
    totalVotesAbstain: 1,
    weightedVotesYes: 8,
    weightedVotesNo: 1,
    weightedVotesAbstain: 1,
  },
];

export const councilMetricsData = {
  totalProposals: 42,
  approvedProposals: 35,
  rejectedProposals: 5,
  executedProposals: 33,
  averageApprovalRate: 0.833,
  averageVotingTime: 3.5, // days
  memberParticipationRate: {
    AETERNO: 0.95,
    EVA_ALPHA: 0.98,
    IMPERADOR_CORE: 0.92,
    AETHELGARD: 0.88,
    NEXUS_COMPLIANCE: 0.85,
    INNOVATION_NEXUS: 0.90,
    RISK_GUARDIAN: 0.87,
  },
};
