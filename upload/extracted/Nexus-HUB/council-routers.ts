import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";
import {
  getAllCouncilMembers,
  getCouncilMemberById,
  getCouncilMemberByRole,
  getTotalVotingPower,
  createProposal,
  getProposalById,
  listProposals,
  updateProposalStatus,
  updateProposalVotes,
  castVote,
  getVotesByProposal,
  getMemberVote,
  createSoulVaultEntry,
  getSoulVaultEntries,
  createAuditLog,
  getAuditLogs,
} from "./db";
import { votingThresholds, proposalTypeRequirements } from "./council-seed";

// ============================================
// COUNCIL MEMBER MANAGEMENT
// ============================================

export const councilRouter = router({
  members: publicProcedure.query(async () => {
    return getAllCouncilMembers();
  }),

  getMember: publicProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ input }) => {
      return getCouncilMemberById(input.memberId);
    }),

  getMemberByRole: publicProcedure
    .input(z.object({ role: z.string() }))
    .query(async ({ input }) => {
      return getCouncilMemberByRole(input.role);
    }),

  getVotingPowerDistribution: publicProcedure.query(async () => {
    const members = await getAllCouncilMembers();
    const distribution: Record<string, number> = {};
    members.forEach((member) => {
      distribution[member.name.toLowerCase().replace(/-/g, "_")] = member.votingPower;
    });
    return {
      totalVotingPower: votingThresholds.totalVotingPower,
      distribution,
    };
  }),

  getDecisionLogic: publicProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ input }) => {
      const member = await getCouncilMemberById(input.memberId);
      if (!member) return null;

      const decisionLogics: Record<string, any> = {
        AETERNO: {
          primaryCriteria: ["Segurança", "Robustez", "Resiliência"],
          votingPattern: "Prioriza segurança e integridade do sistema",
        },
        "EVA-ALPHA": {
          primaryCriteria: ["Impacto Comunitário", "Desenvolvimento de Talentos", "Equidade"],
          votingPattern: "Avalia potencial de crescimento e inclusão",
        },
        "IMPERADOR-CORE": {
          primaryCriteria: ["ROI", "Segurança Financeira", "Sustentabilidade"],
          votingPattern: "Analisa métricas financeiras e projeções",
        },
        AETHELGARD: {
          primaryCriteria: ["Precedentes", "Equidade", "Coerência"],
          votingPattern: "Verifica consistência com decisões anteriores",
        },
        "NEXUS-COMPLIANCE": {
          primaryCriteria: ["Conformidade Legal", "Regulamentação", "Risco Legal"],
          votingPattern: "Garante aderência a padrões regulatórios",
        },
        "INNOVATION-NEXUS": {
          primaryCriteria: ["Potencial de Inovação", "Crescimento Disruptivo", "Vantagem Competitiva"],
          votingPattern: "Apoia propostas inovadoras com potencial alto",
        },
        "RISK-GUARDIAN": {
          primaryCriteria: ["Minimização de Risco", "Mitigação de Ameaças", "Continuidade"],
          votingPattern: "Analisa riscos operacionais e financeiros",
        },
      };

      return {
        memberId: input.memberId,
        name: member.name,
        decisionLogic: decisionLogics[member.name] || {},
      };
    }),
});

// ============================================
// PROPOSAL VOTING SYSTEM
// ============================================

export const proposalVotingRouter = router({
  createProposal: publicProcedure
    .input(
      z.object({
        title: z.string().min(1),
        description: z.string().min(1),
        type: z.enum(["investment", "succession", "policy", "emergency", "innovation"]),
        targetStartupId: z.number().optional(),
        expectedImpact: z.string().optional(),
        riskAssessment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const proposal = await createProposal({
        title: input.title,
        description: input.description,
        type: input.type,
        targetStartupId: input.targetStartupId,
        expectedImpact: input.expectedImpact,
        riskAssessment: input.riskAssessment,
        status: "open",
      });

      await createAuditLog({
        action: "PROPOSAL_CREATED",
        actor: "system",
        targetType: "proposal",
        details: `Proposta criada: ${input.title}`,
      });

      return { success: true, proposalId: proposal.insertId };
    }),

  listProposals: publicProcedure
    .input(
      z.object({
        status: z.enum(["open", "approved", "rejected", "executed"]).optional(),
        type: z.string().optional(),
        limit: z.number().default(50),
      })
    )
    .query(async ({ input }) => {
      return listProposals({
        status: input.status,
        type: input.type,
        limit: input.limit,
      });
    }),

  getProposal: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(async ({ input }) => {
      const proposal = await getProposalById(input.proposalId);
      if (!proposal) return null;

      const votes = await getVotesByProposal(input.proposalId);
      const members = await getAllCouncilMembers();

      const votesWithMemberInfo = votes.map((vote) => {
        const member = members.find((m) => m.id === vote.memberId);
        return {
          ...vote,
          memberName: member?.name || "Unknown",
        };
      });

      return {
        ...proposal,
        votes: votesWithMemberInfo,
      };
    }),

  vote: publicProcedure
    .input(
      z.object({
        proposalId: z.number(),
        memberId: z.number(),
        vote: z.enum(["yes", "no", "abstain"]),
        reasoning: z.string().optional(),
        confidenceLevel: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ input }) => {
      // Check if member has already voted
      const existingVote = await getMemberVote(input.proposalId, input.memberId);
      if (existingVote) {
        throw new Error("Member has already voted on this proposal");
      }

      // Get member voting power
      const member = await getCouncilMemberById(input.memberId);
      if (!member) {
        throw new Error("Member not found");
      }

      // Cast vote
      await castVote({
        proposalId: input.proposalId,
        memberId: input.memberId,
        vote: input.vote,
        weight: member.votingPower,
        reasoning: input.reasoning,
        confidenceLevel: input.confidenceLevel || 100,
      });

      // Update proposal vote counts
      const proposal = await getProposalById(input.proposalId);
      if (!proposal) throw new Error("Proposal not found");

      const votes = await getVotesByProposal(input.proposalId);
      let votesYes = 0,
        votesNo = 0,
        votesAbstain = 0;
      let weightedYes = 0,
        weightedNo = 0,
        weightedAbstain = 0;
      let totalVotingPowerCast = 0;

      votes.forEach((v) => {
        if (v.vote === "yes") {
          votesYes++;
          weightedYes += v.weight;
        } else if (v.vote === "no") {
          votesNo++;
          weightedNo += v.weight;
        } else {
          votesAbstain++;
          weightedAbstain += v.weight;
        }
        totalVotingPowerCast += v.weight;
      });

      // Check if proposal is approved or rejected
      const proposalType = proposal.type as keyof typeof proposalTypeRequirements;
      const threshold = proposalTypeRequirements[proposalType]?.threshold || votingThresholds.simpleApproval;

      let newStatus = "open";
      if (totalVotingPowerCast >= votingThresholds.totalVotingPower) {
        if (weightedYes > threshold) {
          newStatus = "approved";
        } else if (weightedNo >= weightedYes) {
          newStatus = "rejected";
        }
      }

      await updateProposalVotes(input.proposalId, {
        votesYes,
        votesNo,
        votesAbstain,
        weightedYes,
        weightedNo,
        weightedAbstain,
        totalVotingPowerCast,
        status: newStatus as any,
      });

      await createAuditLog({
        action: "VOTE_CAST",
        actor: member.name,
        targetType: "proposal",
        targetId: input.proposalId,
        details: `${member.name} votou ${input.vote} com peso ${member.votingPower}`,
      });

      return { success: true, voteId: 1, proposalStatus: newStatus };
    }),

  getVotes: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(async ({ input }) => {
      return getVotesByProposal(input.proposalId);
    }),

  getVotingStatus: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .query(async ({ input }) => {
      const proposal = await getProposalById(input.proposalId);
      if (!proposal) return null;

      const proposalType = proposal.type as keyof typeof proposalTypeRequirements;
      const threshold = proposalTypeRequirements[proposalType]?.threshold || votingThresholds.simpleApproval;

      const remainingVotingPower = votingThresholds.totalVotingPower - proposal.totalVotingPowerCast;
      const maxPossibleYes = proposal.weightedYes + remainingVotingPower;
      const approvalLikelihood = maxPossibleYes > threshold ? Math.min(100, (maxPossibleYes / threshold) * 100) : 0;

      return {
        proposalId: input.proposalId,
        votesYes: proposal.votesYes,
        votesNo: proposal.votesNo,
        votesAbstain: proposal.votesAbstain,
        weightedYes: proposal.weightedYes,
        weightedNo: proposal.weightedNo,
        weightedAbstain: proposal.weightedAbstain,
        totalVotingPowerCast: proposal.totalVotingPowerCast,
        approvalThreshold: threshold,
        isApproved: proposal.status === "approved",
        approvalLikelihood: Math.round(approvalLikelihood),
      };
    }),
});

// ============================================
// COUNCIL EXECUTION
// ============================================

export const councilExecutionRouter = router({
  executeProposal: publicProcedure
    .input(z.object({ proposalId: z.number() }))
    .mutation(async ({ input }) => {
      const proposal = await getProposalById(input.proposalId);
      if (!proposal) throw new Error("Proposal not found");
      if (proposal.status !== "approved") throw new Error("Proposal is not approved");

      await updateProposalStatus(input.proposalId, "executed");
      await updateProposalVotes(input.proposalId, { executedAt: new Date() });

      // Create Soul Vault entry
      await createSoulVaultEntry({
        type: "decision",
        title: `Execução: ${proposal.title}`,
        content: `Proposta de tipo ${proposal.type} foi executada com sucesso. Votos: Sim ${proposal.weightedYes}, Não ${proposal.weightedNo}.`,
        relatedProposalId: input.proposalId,
        impact: "executed",
      });

      await createAuditLog({
        action: "PROPOSAL_EXECUTED",
        actor: "system",
        targetType: "proposal",
        targetId: input.proposalId,
        details: `Proposta executada: ${proposal.title}`,
      });

      return { success: true };
    }),

  rejectProposal: publicProcedure
    .input(z.object({ proposalId: z.number(), rejectionReason: z.string().optional() }))
    .mutation(async ({ input }) => {
      const proposal = await getProposalById(input.proposalId);
      if (!proposal) throw new Error("Proposal not found");

      await updateProposalStatus(input.proposalId, "rejected");

      await createSoulVaultEntry({
        type: "decision",
        title: `Rejeição: ${proposal.title}`,
        content: `Proposta de tipo ${proposal.type} foi rejeitada. Razão: ${input.rejectionReason || "Não especificada"}`,
        relatedProposalId: input.proposalId,
        impact: "rejected",
      });

      await createAuditLog({
        action: "PROPOSAL_REJECTED",
        actor: "system",
        targetType: "proposal",
        targetId: input.proposalId,
        details: `Proposta rejeitada: ${proposal.title}`,
      });

      return { success: true };
    }),

  getExecutionHistory: publicProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ input }) => {
      return listProposals({ status: "executed", limit: input.limit });
    }),
});

// ============================================
// COUNCIL ANALYTICS
// ============================================

export const councilAnalyticsRouter = router({
  getVotingPatterns: publicProcedure.query(async () => {
    const proposals = await listProposals({ limit: 100 });
    const approvedCount = proposals.filter((p: any) => p.status === "approved").length;
    const rejectedCount = proposals.filter((p: any) => p.status === "rejected").length;
    const approvalRate = proposals.length > 0 ? (approvedCount / proposals.length) * 100 : 0;

    return {
      totalProposals: proposals.length,
      approvedProposals: approvedCount,
      rejectedProposals: rejectedCount,
      approvalRate: Math.round(approvalRate),
    };
  }),

  getMemberVotingHistory: publicProcedure
    .input(z.object({ memberId: z.number() }))
    .query(async ({ input }) => {
      const member = await getCouncilMemberById(input.memberId);
      if (!member) return null;

      const proposals = await listProposals({ limit: 100 });
      const memberVotes: any[] = [];

      for (const proposal of proposals) {
        const vote = await getMemberVote(proposal.id, input.memberId);
        if (vote) {
          memberVotes.push({
            proposalId: proposal.id,
            proposalTitle: proposal.title,
            vote: vote.vote,
            weight: vote.weight,
            reasoning: vote.reasoning,
          });
        }
      }

      return {
        memberId: input.memberId,
        memberName: member.name,
        totalVotes: memberVotes.length,
        votes: memberVotes,
      };
    }),

  getCouncilHealthMetrics: publicProcedure.query(async () => {
    const members = await getAllCouncilMembers();
    const proposals = await listProposals({ limit: 100 });

    const totalVotes = proposals.reduce((sum: number, p: any) => sum + (p.votesYes + p.votesNo + p.votesAbstain), 0);
    const expectedVotes = proposals.length * members.length;
    const participationRate = expectedVotes > 0 ? (totalVotes / expectedVotes) * 100 : 0;

    const approvedCount = proposals.filter((p: any) => p.status === "approved").length;
    const executedCount = proposals.filter((p: any) => p.status === "executed").length;
    const executionSuccessRate = approvedCount > 0 ? (executedCount / approvedCount) * 100 : 0;

    return {
      totalMembers: members.length,
      totalProposals: proposals.length,
      participationRate: Math.round(participationRate),
      executionSuccessRate: Math.round(executionSuccessRate),
      totalVotingPower: votingThresholds.totalVotingPower,
    };
  }),
});

// ============================================
// MAIN COUNCIL ROUTER
// ============================================

export const councilOfArchitectsRouter = router({
  council: councilRouter,
  voting: proposalVotingRouter,
  execution: councilExecutionRouter,
  analytics: councilAnalyticsRouter,
});
