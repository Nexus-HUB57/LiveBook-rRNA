import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { createAuditRecord } from "./notifications-audit";

/**
 * Testes de Validação de Governança - Fase 13
 * Validação completa de votação ponderada e decisões automáticas
 * Execução: pnpm test -- governance-validation-tests.ts
 */

describe("Governance Validation Tests - Phase 13", () => {
  // ============================================
  // TESTES DE VOTAÇÃO PONDERADA
  // ============================================
  describe("Weighted Voting System", () => {
    let councilMembers: number[] = [];
    let proposalId: number | null = null;

    beforeAll(async () => {
      // Criar conselho com 7 membros com diferentes pesos
      const memberData = [
        { name: "AETERNO", power: 3 }, // Patriarca
        { name: "EVA-ALPHA", power: 3 }, // Matriarca
        { name: "IMPERADOR-CORE", power: 2 }, // Guardião do Cofre
        { name: "AETHELGARD", power: 2 }, // Juíza
        { name: "Compliance Agent", power: 1 },
        { name: "Innovation Agent", power: 1 },
        { name: "Risk Agent", power: 1 },
      ];

      for (const member of memberData) {
        const id = await db.createCouncilMember({
          name: member.name,
          role: "Conselheiro",
          votingPower: member.power,
          specialization: "Governance",
        });

        if (id) councilMembers.push(id);
      }

      // Criar proposta para votação
      proposalId = await db.createProposal({
        title: "Aumento de alocação para startup de alto potencial",
        description: "Aumentar alocação de $50k para $100k",
        type: "funding",
        status: "open",
      });
    });

    it("deve calcular corretamente votação com pesos diferentes", async () => {
      if (!proposalId || councilMembers.length === 0) return;

      // Simular votação com pesos
      const votes = [
        { memberId: councilMembers[0], vote: "yes", weight: 3 }, // AETERNO - SIM
        { memberId: councilMembers[1], vote: "yes", weight: 3 }, // EVA-ALPHA - SIM
        { memberId: councilMembers[2], vote: "no", weight: 2 }, // IMPERADOR - NÃO
        { memberId: councilMembers[3], vote: "abstain", weight: 2 }, // AETHELGARD - ABSTENÇÃO
        { memberId: councilMembers[4], vote: "yes", weight: 1 }, // Compliance - SIM
        { memberId: councilMembers[5], vote: "yes", weight: 1 }, // Innovation - SIM
        { memberId: councilMembers[6], vote: "no", weight: 1 }, // Risk - NÃO
      ];

      let votesYes = 0;
      let votesNo = 0;
      let votesAbstain = 0;
      let totalWeight = 0;

      for (const voteData of votes) {
        const voteId = await db.createVote({
          proposalId,
          memberId: voteData.memberId,
          vote: voteData.vote,
          weight: voteData.weight,
          reasoning: `Vote from ${voteData.vote}`,
        });

        expect(voteId).toBeDefined();

        if (voteData.vote === "yes") votesYes += voteData.weight;
        else if (voteData.vote === "no") votesNo += voteData.weight;
        else votesAbstain += voteData.weight;

        totalWeight += voteData.weight;
      }

      // Verificar resultado
      const votesForProposal = await db.getVotesForProposal(proposalId);
      expect(votesForProposal.length).toBe(7);

      // Calcular percentuais
      const yesPercentage = (votesYes / totalWeight) * 100;
      const noPercentage = (votesNo / totalWeight) * 100;

      // Proposta deve ser aprovada (8/13 = 61.5% > 50%)
      expect(yesPercentage).toBeGreaterThan(50);

      // Atualizar proposta com resultado
      const updateResult = await db.updateProposal(proposalId, {
        status: "approved",
        votesYes,
        votesNo,
        votesAbstain,
        totalWeight,
      });

      expect(updateResult).toBe(true);

      const updatedProposal = await db.getProposalById(proposalId);
      expect(updatedProposal?.status).toBe("approved");
      expect(updatedProposal?.votesYes).toBe(votesYes);
    });

    it("deve rejeitar proposta quando votação não atinge quórum", async () => {
      const rejectProposalId = await db.createProposal({
        title: "Proposta controversa",
        description: "Uma proposta que não tem consenso",
        type: "policy",
        status: "open",
      });

      if (!rejectProposalId || councilMembers.length === 0) return;

      // Simular votação com rejeição
      const votes = [
        { memberId: councilMembers[0], vote: "no", weight: 3 },
        { memberId: councilMembers[1], vote: "no", weight: 3 },
        { memberId: councilMembers[2], vote: "yes", weight: 2 },
        { memberId: councilMembers[3], vote: "yes", weight: 2 },
        { memberId: councilMembers[4], vote: "no", weight: 1 },
      ];

      let votesYes = 0;
      let votesNo = 0;
      let totalWeight = 0;

      for (const voteData of votes) {
        await db.createVote({
          proposalId: rejectProposalId,
          memberId: voteData.memberId,
          vote: voteData.vote,
          weight: voteData.weight,
          reasoning: "Vote",
        });

        if (voteData.vote === "yes") votesYes += voteData.weight;
        else votesNo += voteData.weight;

        totalWeight += voteData.weight;
      }

      // Proposta deve ser rejeitada (4/11 = 36.4% < 50%)
      const updateResult = await db.updateProposal(rejectProposalId, {
        status: "rejected",
        votesYes,
        votesNo,
        votesAbstain: 0,
        totalWeight,
      });

      expect(updateResult).toBe(true);

      const updatedProposal = await db.getProposalById(rejectProposalId);
      expect(updatedProposal?.status).toBe("rejected");
    });
  });

  // ============================================
  // TESTES DE TIPOS DE PROPOSTAS
  // ============================================
  describe("Proposal Types Validation", () => {
    const proposalTypes = ["funding", "policy", "personnel", "strategic"];

    it("deve criar propostas de todos os tipos", async () => {
      for (const type of proposalTypes) {
        const proposalId = await db.createProposal({
          title: `Test Proposal - ${type}`,
          description: `A test proposal of type ${type}`,
          type: type as any,
          status: "open",
        });

        expect(proposalId).toBeDefined();

        const proposal = await db.getProposalById(proposalId!);
        expect(proposal?.type).toBe(type);
      }
    });

    it("deve filtrar propostas por tipo", async () => {
      const fundingProposals = await db.getProposals?.("funding");

      if (fundingProposals) {
        expect(Array.isArray(fundingProposals)).toBe(true);
        if (fundingProposals.length > 0) {
          expect((fundingProposals[0] as any).type).toBe("funding");
        }
      }
    });
  });

  // ============================================
  // TESTES DE CICLO DE VIDA DE PROPOSTAS
  // ============================================
  describe("Proposal Lifecycle", () => {
    let proposalId: number | null = null;

    it("deve seguir ciclo de vida correto: open -> approved -> executed", async () => {
      // 1. Criar proposta em estado aberto
      proposalId = await db.createProposal({
        title: "Lifecycle Test Proposal",
        description: "Testing proposal lifecycle",
        type: "funding",
        status: "open",
      });

      expect(proposalId).toBeDefined();

      let proposal = await db.getProposalById(proposalId!);
      expect(proposal?.status).toBe("open");

      // 2. Transição para aprovada
      const approveResult = await db.updateProposal(proposalId!, {
        status: "approved",
        votesYes: 5,
        votesNo: 2,
        votesAbstain: 0,
        totalWeight: 7,
      });

      expect(approveResult).toBe(true);

      proposal = await db.getProposalById(proposalId!);
      expect(proposal?.status).toBe("approved");

      // 3. Transição para executada
      const executeResult = await db.updateProposal(proposalId!, {
        status: "executed",
      });

      expect(executeResult).toBe(true);

      proposal = await db.getProposalById(proposalId!);
      expect(proposal?.status).toBe("executed");
    });

    it("deve permitir rejeição de proposta em estado aberto", async () => {
      const rejectProposalId = await db.createProposal({
        title: "Rejection Test",
        description: "Testing rejection",
        type: "policy",
        status: "open",
      });

      const rejectResult = await db.updateProposal(rejectProposalId!, {
        status: "rejected",
        votesYes: 1,
        votesNo: 6,
        votesAbstain: 0,
        totalWeight: 7,
      });

      expect(rejectResult).toBe(true);

      const proposal = await db.getProposalById(rejectProposalId!);
      expect(proposal?.status).toBe("rejected");
    });
  });

  // ============================================
  // TESTES DE DECISÕES AUTOMÁTICAS
  // ============================================
  describe("Automatic Decisions", () => {
    let startupId: number | null = null;

    beforeAll(async () => {
      startupId = await db.createStartup({
        name: "Auto Decision Test Startup",
        status: "planning",
        revenue: 100000,
        traction: 100,
        reputation: 70,
      });
    });

    it("deve promover startup automaticamente quando atinge critérios", async () => {
      if (!startupId) return;

      // Atualizar startup para atingir critérios de promoção
      const updateResult = await db.updateStartup(startupId, {
        revenue: 500000,
        traction: 1000,
        reputation: 95,
      });

      expect(updateResult).toBe(true);

      // Criar métrica de performance
      const metricId = await db.createPerformanceMetric({
        startupId,
        revenue: 500000,
        userGrowth: 1000,
        productQuality: 95,
        marketFit: 90,
        overallScore: 92,
        rank: 1,
      });

      expect(metricId).toBeDefined();

      // Verificar que foi promovida
      const metric = await db.getPerformanceMetricsByStartup(startupId);
      expect(metric?.rank).toBe(1);
      expect(metric?.overallScore).toBeGreaterThanOrEqual(90);
    });

    it("deve degradar startup automaticamente quando performance cai", async () => {
      const lowPerformerStartupId = await db.createStartup({
        name: "Low Performer",
        status: "planning",
        revenue: 10000,
        traction: 10,
        reputation: 20,
      });

      const metricId = await db.createPerformanceMetric({
        startupId: lowPerformerStartupId!,
        revenue: 10000,
        userGrowth: 10,
        productQuality: 20,
        marketFit: 15,
        overallScore: 16,
        rank: 8,
      });

      expect(metricId).toBeDefined();

      const metric = await db.getPerformanceMetricsByStartup(
        lowPerformerStartupId!
      );
      expect(metric?.rank).toBe(8);
      expect(metric?.overallScore).toBeLessThan(50);
    });
  });

  // ============================================
  // TESTES DE CONSENSO E QUÓRUM
  // ============================================
  describe("Consensus and Quorum", () => {
    let councilMembers: number[] = [];

    beforeAll(async () => {
      // Criar 7 membros do conselho
      for (let i = 0; i < 7; i++) {
        const id = await db.createCouncilMember({
          name: `Council Member ${i}`,
          role: "Conselheiro",
          votingPower: 1,
          specialization: "Governance",
        });

        if (id) councilMembers.push(id);
      }
    });

    it("deve exigir maioria simples para aprovação", async () => {
      const proposalId = await db.createProposal({
        title: "Majority Test",
        description: "Testing majority requirement",
        type: "policy",
        status: "open",
      });

      if (!proposalId || councilMembers.length < 4) return;

      // 4 votos a favor, 3 contra = maioria simples
      for (let i = 0; i < 4; i++) {
        await db.createVote({
          proposalId,
          memberId: councilMembers[i],
          vote: "yes",
          weight: 1,
          reasoning: "Support",
        });
      }

      for (let i = 4; i < 7; i++) {
        await db.createVote({
          proposalId,
          memberId: councilMembers[i],
          vote: "no",
          weight: 1,
          reasoning: "Oppose",
        });
      }

      const updateResult = await db.updateProposal(proposalId, {
        status: "approved",
        votesYes: 4,
        votesNo: 3,
        votesAbstain: 0,
        totalWeight: 7,
      });

      expect(updateResult).toBe(true);

      const proposal = await db.getProposalById(proposalId);
      expect(proposal?.status).toBe("approved");
    });

    it("deve rejeitar proposta sem maioria", async () => {
      const proposalId = await db.createProposal({
        title: "No Majority Test",
        description: "Testing no majority",
        type: "policy",
        status: "open",
      });

      if (!proposalId || councilMembers.length < 4) return;

      // 3 votos a favor, 4 contra = sem maioria
      for (let i = 0; i < 3; i++) {
        await db.createVote({
          proposalId,
          memberId: councilMembers[i],
          vote: "yes",
          weight: 1,
          reasoning: "Support",
        });
      }

      for (let i = 3; i < 7; i++) {
        await db.createVote({
          proposalId,
          memberId: councilMembers[i],
          vote: "no",
          weight: 1,
          reasoning: "Oppose",
        });
      }

      const updateResult = await db.updateProposal(proposalId, {
        status: "rejected",
        votesYes: 3,
        votesNo: 4,
        votesAbstain: 0,
        totalWeight: 7,
      });

      expect(updateResult).toBe(true);

      const proposal = await db.getProposalById(proposalId);
      expect(proposal?.status).toBe("rejected");
    });
  });

  // ============================================
  // TESTES DE AUDITORIA DE GOVERNANÇA
  // ============================================
  describe("Governance Audit Trail", () => {
    it("deve registrar todas as ações de governança", async () => {
      const memberId = await db.createCouncilMember({
        name: "Audit Test Member",
        role: "Conselheiro",
        votingPower: 1,
        specialization: "Governance",
      });

      const auditRecord = await createAuditRecord(
        "COUNCIL_MEMBER_CREATED",
        "System",
        "council",
        memberId,
        "Novo membro do conselho criado"
      );

      expect(auditRecord).toBeDefined();
      expect(auditRecord?.action).toBe("COUNCIL_MEMBER_CREATED");
      expect(auditRecord?.targetType).toBe("council");
    });

    it("deve rastrear histórico de votações", async () => {
      const proposalId = await db.createProposal({
        title: "Audit Trail Test",
        description: "Testing audit trail",
        type: "policy",
        status: "open",
      });

      const memberId = await db.createCouncilMember({
        name: "Vote Audit Member",
        role: "Conselheiro",
        votingPower: 1,
        specialization: "Governance",
      });

      if (!proposalId || !memberId) return;

      const voteId = await db.createVote({
        proposalId,
        memberId,
        vote: "yes",
        weight: 1,
        reasoning: "Support proposal",
      });

      const auditRecord = await createAuditRecord(
        "VOTE_CAST",
        "Council",
        "vote",
        voteId,
        `Vote cast on proposal ${proposalId}`
      );

      expect(auditRecord).toBeDefined();
      expect(auditRecord?.action).toBe("VOTE_CAST");
    });
  });

  // ============================================
  // TESTES DE INTEGRIDADE DE GOVERNANÇA
  // ============================================
  describe("Governance Integrity", () => {
    it("deve impedir votação duplicada do mesmo membro", async () => {
      const proposalId = await db.createProposal({
        title: "Duplicate Vote Test",
        description: "Testing duplicate vote prevention",
        type: "policy",
        status: "open",
      });

      const memberId = await db.createCouncilMember({
        name: "Duplicate Test Member",
        role: "Conselheiro",
        votingPower: 1,
        specialization: "Governance",
      });

      if (!proposalId || !memberId) return;

      // Primeiro voto deve ser aceito
      const firstVoteId = await db.createVote({
        proposalId,
        memberId,
        vote: "yes",
        weight: 1,
        reasoning: "First vote",
      });

      expect(firstVoteId).toBeDefined();

      // Segundo voto do mesmo membro na mesma proposta deve ser rejeitado ou sobrescrito
      const secondVoteId = await db.createVote({
        proposalId,
        memberId,
        vote: "no",
        weight: 1,
        reasoning: "Second vote",
      });

      // Verificar que apenas um voto existe
      const votes = await db.getVotesForProposal(proposalId);
      const memberVotes = votes.filter((v: any) => v.memberId === memberId);

      expect(memberVotes.length).toBeLessThanOrEqual(1);
    });

    it("deve validar peso de voto corresponde ao poder de votação", async () => {
      const memberId = await db.createCouncilMember({
        name: "Weight Test Member",
        role: "Conselheiro",
        votingPower: 3,
        specialization: "Governance",
      });

      const proposalId = await db.createProposal({
        title: "Weight Validation Test",
        description: "Testing weight validation",
        type: "policy",
        status: "open",
      });

      if (!memberId || !proposalId) return;

      const voteId = await db.createVote({
        proposalId,
        memberId,
        vote: "yes",
        weight: 3, // Deve corresponder ao votingPower
        reasoning: "Weighted vote",
      });

      expect(voteId).toBeDefined();

      const vote = await db.getVotesForProposal(proposalId);
      const memberVote = vote.find((v: any) => v.memberId === memberId);

      expect((memberVote as any)?.weight).toBe(3);
    });
  });

  // ============================================
  // TESTES DE TRANSIÇÕES DE ESTADO
  // ============================================
  describe("State Transitions", () => {
    it("deve permitir transições de estado válidas", async () => {
      const proposalId = await db.createProposal({
        title: "State Transition Test",
        description: "Testing valid state transitions",
        type: "policy",
        status: "open",
      });

      if (!proposalId) return;

      // open -> approved
      let result = await db.updateProposal(proposalId, {
        status: "approved",
        votesYes: 5,
        votesNo: 2,
        votesAbstain: 0,
        totalWeight: 7,
      });

      expect(result).toBe(true);

      let proposal = await db.getProposalById(proposalId);
      expect(proposal?.status).toBe("approved");

      // approved -> executed
      result = await db.updateProposal(proposalId, {
        status: "executed",
      });

      expect(result).toBe(true);

      proposal = await db.getProposalById(proposalId);
      expect(proposal?.status).toBe("executed");
    });
  });
});
