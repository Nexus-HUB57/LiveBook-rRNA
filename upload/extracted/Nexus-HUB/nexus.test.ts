        title: "Test Insight",
        content: "Um insight de teste",
        sentiment: "bullish",
        confidence: 85,
        source: "Test",
      });

      expect(insightId).toBeDefined();
      expect(typeof insightId).toBe("number");
    });

    it("deve recuperar insights de mercado", async () => {
      const insights = await db.getMarketInsights();

      expect(Array.isArray(insights)).toBe(true);
      expect(insights.length).toBeGreaterThan(0);
    });
  });

  // ============================================
  // TESTES DE ARBITRAGEM
  // ============================================
  describe("Arbitrage", () => {
    let oppId: number | null = null;

    it("deve criar uma oportunidade de arbitragem", async () => {
      oppId = await db.createArbitrageOpportunity({
        asset: "TEST",
        exchangeFrom: "Exchange A",
        exchangeTo: "Exchange B",
        priceDifference: 10.5,
        profitPotential: 5000,
        confidence: 90,
        status: "identified",
      });

      expect(oppId).toBeDefined();
      expect(typeof oppId).toBe("number");
    });

    it("deve recuperar oportunidades de arbitragem", async () => {
      const opps = await db.getArbitrageOpportunities();

      expect(Array.isArray(opps)).toBe(true);
      expect(opps.length).toBeGreaterThan(0);
    });

    it("deve filtrar por status", async () => {
      const identified = await db.getArbitrageOpportunities("identified");

      expect(Array.isArray(identified)).toBe(true);
      if (identified.length > 0) {
        expect((identified[0] as any).status).toBe("identified");
      }
    });

    it("deve atualizar oportunidade de arbitragem", async () => {
      if (!oppId) return;
      const result = await db.updateArbitrageOpportunity(oppId, {
        status: "executing",
      });

      expect(result).toBe(true);
    });
  });

  // ============================================
  // TESTES DE SOUL VAULT
  // ============================================
  describe("Soul Vault", () => {
    let entryId: number | null = null;

    it("deve criar uma entrada no Soul Vault", async () => {
      entryId = await db.createSoulVaultEntry({
        type: "decision",
        title: "Test Decision",
        content: "Uma decisão de teste",
        impact: "high",
      });

      expect(entryId).toBeDefined();
      expect(typeof entryId).toBe("number");
    });

    it("deve recuperar entradas do Soul Vault", async () => {
      const entries = await db.getSoulVaultEntries();

      expect(Array.isArray(entries)).toBe(true);
      expect(entries.length).toBeGreaterThan(0);
    });

    it("deve filtrar por tipo", async () => {
      const decisions = await db.getSoulVaultEntries("decision");

      expect(Array.isArray(decisions)).toBe(true);
      if (decisions.length > 0) {
        expect((decisions[0] as any).type).toBe("decision");
      }
    });