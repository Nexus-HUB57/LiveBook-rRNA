import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext; clearedCookies: any[] } {
  const clearedCookies: any[] = [];

  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "admin",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: (name: string, options: any) => {
        clearedCookies.push({ name, options });
      },
    } as TrpcContext["res"],
  };

  return { ctx, clearedCookies };
}

describe("Council of Architects", () => {
  let caller: any;

  beforeAll(() => {
    const { ctx } = createAuthContext();
    caller = appRouter.createCaller(ctx);
  });

  describe("Council Members", () => {
    it("should list all council members", async () => {
      const members = await caller.councilOfArchitects.council.members();
      expect(Array.isArray(members)).toBe(true);
    });

    it("should get voting power distribution", async () => {
      const distribution = await caller.councilOfArchitects.council.getVotingPowerDistribution();
      expect(distribution).toHaveProperty("totalVotingPower");
      expect(distribution).toHaveProperty("distribution");
      expect(distribution.totalVotingPower).toBe(10);
    });

    it("should get decision logic for a member", async () => {
      const logic = await caller.councilOfArchitects.council.getDecisionLogic({ memberId: 1 });
      if (logic) {
        expect(logic).toHaveProperty("memberId");
        expect(logic).toHaveProperty("name");
        expect(logic).toHaveProperty("decisionLogic");
      }
    });
  });

  describe("Proposals", () => {
    let proposalId: number;

    it("should create a proposal", async () => {
      const result = await caller.councilOfArchitects.voting.createProposal({
        title: "Test Investment Proposal",
        description: "This is a test proposal for investment",
        type: "investment",
        expectedImpact: "High growth potential",
        riskAssessment: "Moderate risk",
      });

      expect(result).toHaveProperty("success");
      expect(result.success).toBe(true);
      expect(result).toHaveProperty("proposalId");
      proposalId = result.proposalId;
    });

    it("should list proposals", async () => {
      const proposals = await caller.councilOfArchitects.voting.listProposals({
        limit: 50,
      });

      expect(Array.isArray(proposals)).toBe(true);
    });

    it("should get proposal details", async () => {
      if (!proposalId) {
        console.log("Skipping: proposalId not set");
        return;
      }

      const proposal = await caller.councilOfArchitects.voting.getProposal({
        proposalId,
      });

      if (proposal) {
        expect(proposal).toHaveProperty("id");
        expect(proposal).toHaveProperty("title");
        expect(proposal).toHaveProperty("votes");
      }
    });

    it("should get voting status", async () => {
      if (!proposalId) {
        console.log("Skipping: proposalId not set");
        return;
      }

      const status = await caller.councilOfArchitects.voting.getVotingStatus({
        proposalId,
      });

      if (status) {
        expect(status).toHaveProperty("proposalId");
        expect(status).toHaveProperty("weightedYes");
        expect(status).toHaveProperty("weightedNo");
        expect(status).toHaveProperty("approvalThreshold");
      }
    });
  });

  describe("Analytics", () => {
    it("should get voting patterns", async () => {
      const patterns = await caller.councilOfArchitects.analytics.getVotingPatterns();
      expect(patterns).toHaveProperty("totalProposals");
      expect(patterns).toHaveProperty("approvedProposals");
      expect(patterns).toHaveProperty("rejectedProposals");
      expect(patterns).toHaveProperty("approvalRate");
    });

    it("should get council health metrics", async () => {
      const metrics = await caller.councilOfArchitects.analytics.getCouncilHealthMetrics();
      expect(metrics).toHaveProperty("totalMembers");
      expect(metrics).toHaveProperty("totalProposals");
      expect(metrics).toHaveProperty("participationRate");
      expect(metrics).toHaveProperty("executionSuccessRate");
    });

    it("should get member voting history", async () => {
      const history = await caller.councilOfArchitects.analytics.getMemberVotingHistory({
        memberId: 1,
      });

      if (history) {
        expect(history).toHaveProperty("memberId");
        expect(history).toHaveProperty("memberName");
        expect(history).toHaveProperty("totalVotes");
        expect(Array.isArray(history.votes)).toBe(true);
      }
    });
  });
});
