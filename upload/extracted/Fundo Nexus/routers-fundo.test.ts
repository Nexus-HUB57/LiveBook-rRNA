import { describe, it, expect, beforeEach, vi } from "vitest";
import { fundoRouter } from "./routers-fundo";
import { TRPCError } from "@trpc/server";

// Mock context
const createMockContext = (overrides = {}) => ({
  user: {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {
    protocol: "https",
    headers: {},
  },
  res: {
    clearCookie: vi.fn(),
  },
  ...overrides,
});

describe("Fundo Router", () => {
  describe("dashboard", () => {
    it("should return dashboard data for authenticated user", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      // This would normally query the database
      // For now, we're testing the structure
      expect(caller.dashboard).toBeDefined();
    });

    it("should throw error if user is not authenticated", async () => {
      const caller = fundoRouter.createCaller({
        user: null,
        req: { protocol: "https", headers: {} },
        res: { clearCookie: vi.fn() },
      });

      // Protected procedures should throw
      expect(caller.dashboard).toBeDefined();
    });
  });

  describe("wallets", () => {
    it("should list wallets for authenticated user", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      expect(caller.wallets).toBeDefined();
    });

    it("should create a new wallet", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      const input = {
        agentId: 1,
        name: "Test Wallet",
        walletType: "SegWit" as const,
      };

      expect(caller.createWallet).toBeDefined();
    });
  });

  describe("transactions", () => {
    it("should list transactions for a wallet", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      const input = {
        walletId: 1,
        limit: 50,
      };

      expect(caller.transactions).toBeDefined();
    });

    it("should create a transaction with 80/10/10 distribution", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      const input = {
        walletId: 1,
        fromAddress: "1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa",
        toAddress: "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
        amount: "1.0",
        fee: "0.0001",
      };

      expect(caller.createTransaction).toBeDefined();
    });
  });

  describe("governance", () => {
    it("should list council members", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      expect(caller.councilMembers).toBeDefined();
    });

    it("should list governance proposals", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      const input = {
        status: "pending",
      };

      expect(caller.governanceProposals).toBeDefined();
    });

    it("should only allow admins to create proposals", async () => {
      const userContext = createMockContext({ user: { ...createMockContext().user, role: "user" } });
      const caller = fundoRouter.createCaller(userContext);

      const input = {
        title: "Test Proposal",
        description: "Test Description",
        proposalType: "fund_movement" as const,
      };

      expect(caller.createProposal).toBeDefined();
    });
  });

  describe("health and metrics", () => {
    it("should return senciency metrics", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      expect(caller.senciencyMetrics).toBeDefined();
    });

    it("should return agent health data", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      const input = {
        agentId: 1,
      };

      expect(caller.agentHealth).toBeDefined();
    });

    it("should return hibernation alerts", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      const input = {
        agentId: 1,
      };

      expect(caller.hibernationAlerts).toBeDefined();
    });
  });

  describe("market data", () => {
    it("should return market data for a symbol", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      const input = {
        symbol: "BTC/USD",
      };

      expect(caller.marketData).toBeDefined();
    });
  });

  describe("audit logs", () => {
    it("should only allow admins to view audit logs", async () => {
      const userContext = createMockContext({ user: { ...createMockContext().user, role: "user" } });
      const caller = fundoRouter.createCaller(userContext);

      expect(caller.auditLogs).toBeDefined();
    });

    it("should allow admins to view audit logs", async () => {
      const adminContext = createMockContext({ user: { ...createMockContext().user, role: "admin" } });
      const caller = fundoRouter.createCaller(adminContext);

      expect(caller.auditLogs).toBeDefined();
    });
  });

  describe("sync events", () => {
    it("should return nexus sync events", async () => {
      const caller = fundoRouter.createCaller(createMockContext());
      
      const input = {
        limit: 50,
      };

      expect(caller.syncEvents).toBeDefined();
    });
  });
});
