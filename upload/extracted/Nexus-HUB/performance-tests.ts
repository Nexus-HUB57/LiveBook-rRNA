import { describe, it, expect, beforeAll } from "vitest";
import * as db from "./db";
import { NexusGenesis } from "./nexus-genesis";

/**
 * Testes de Performance e Sincronização - Fase 13
 * Validação de escalabilidade e sincronização entre sistemas
 * Execução: pnpm test -- performance-tests.ts
 */

describe("Nexus-HUB Performance & Synchronization Tests", () => {
  // ============================================
  // TESTES DE PERFORMANCE DE LEITURA
  // ============================================
  describe("Read Performance Tests", () => {
    beforeAll(async () => {
      // Criar dados de teste
      for (let i = 0; i < 50; i++) {
        await db.createStartup({
          name: `Perf Test Startup ${i}`,
          status: "planning",
          revenue: Math.random() * 1000000,
          traction: Math.random() * 1000,
          reputation: Math.random() * 100,
        });
      }
    });

    it("deve listar startups em menos de 1 segundo", async () => {
      const startTime = performance.now();
      const startups = await db.getStartups();
      const duration = performance.now() - startTime;

      expect(startups.length).toBeGreaterThan(0);
      expect(duration).toBeLessThan(1000);
      console.log(`✓ Listagem de startups: ${duration.toFixed(2)}ms`);
    });

    it("deve filtrar startups por status em menos de 500ms", async () => {
      const startTime = performance.now();
      const startups = await db.getStartupsByStatus("planning");
      const duration = performance.now() - startTime;

      expect(Array.isArray(startups)).toBe(true);
      expect(duration).toBeLessThan(500);
      console.log(`✓ Filtro de startups por status: ${duration.toFixed(2)}ms`);
    });

    it("deve recuperar startup por ID em menos de 100ms", async () => {
      const startups = await db.getStartups();
      if (startups.length === 0) return;

      const startupId = (startups[0] as any).id;
      const startTime = performance.now();
      const startup = await db.getStartupById(startupId);
      const duration = performance.now() - startTime;

      expect(startup).toBeDefined();
      expect(duration).toBeLessThan(100);
      console.log(`✓ Recuperação de startup por ID: ${duration.toFixed(2)}ms`);
    });
  });

  // ============================================
  // TESTES DE PERFORMANCE DE ESCRITA
  // ============================================
  describe("Write Performance Tests", () => {
    it("deve criar 100 startups em menos de 30 segundos", async () => {
      const startTime = performance.now();
      const ids: number[] = [];

      for (let i = 0; i < 100; i++) {
        const id = await db.createStartup({
          name: `Write Perf Test ${i}`,
          status: "planning",
          revenue: Math.random() * 1000000,
          traction: Math.random() * 1000,
          reputation: Math.random() * 100,
        });

        if (id) ids.push(id);
      }

      const duration = performance.now() - startTime;

      expect(ids.length).toBe(100);
      expect(duration).toBeLessThan(30000);
      console.log(
        `✓ Criação de 100 startups: ${duration.toFixed(2)}ms (${(duration / 100).toFixed(2)}ms por startup)`
      );
    });

    it("deve criar 50 agentes em menos de 20 segundos", async () => {
      const startups = await db.getStartups();
      if (startups.length === 0) return;

      const startupId = (startups[0] as any).id;
      const startTime = performance.now();
      const ids: number[] = [];

      for (let i = 0; i < 50; i++) {
        const id = await db.createAgent({
          name: `Perf Agent ${i}`,
          specialization: "Testing",
          startupId,
          role: "developer",
          reputation: Math.random() * 100,
          health: Math.random() * 100,
          energy: Math.random() * 100,
          creativity: Math.random() * 100,
        });

        if (id) ids.push(id);
      }

      const duration = performance.now() - startTime;

      expect(ids.length).toBe(50);
      expect(duration).toBeLessThan(20000);
      console.log(
        `✓ Criação de 50 agentes: ${duration.toFixed(2)}ms (${(duration / 50).toFixed(2)}ms por agente)`
      );
    });

    it("deve criar 100 transações em menos de 15 segundos", async () => {
      const startTime = performance.now();
      const ids: number[] = [];

      for (let i = 0; i < 100; i++) {
        const id = await db.createTransaction({
          amount: Math.random() * 100000,
          type: "transfer",
          description: `Perf Test Transaction ${i}`,
          status: "completed",
        });

        if (id) ids.push(id);
      }

      const duration = performance.now() - startTime;

      expect(ids.length).toBe(100);
      expect(duration).toBeLessThan(15000);
      console.log(
        `✓ Criação de 100 transações: ${duration.toFixed(2)}ms (${(duration / 100).toFixed(2)}ms por transação)`
      );
    });

    it("deve atualizar 50 startups em menos de 10 segundos", async () => {
      const startups = await db.getStartups();
      const startTime = performance.now();
      let updateCount = 0;

      for (let i = 0; i < Math.min(50, startups.length); i++) {
        const startup = startups[i] as any;
        const result = await db.updateStartup(startup.id, {
          revenue: Math.random() * 1000000,
          traction: Math.random() * 1000,
          reputation: Math.random() * 100,
        });

        if (result) updateCount++;
      }

      const duration = performance.now() - startTime;

      expect(updateCount).toBe(Math.min(50, startups.length));
      expect(duration).toBeLessThan(10000);
      console.log(
        `✓ Atualização de 50 startups: ${duration.toFixed(2)}ms (${(duration / updateCount).toFixed(2)}ms por startup)`
      );
    });
  });

  // ============================================
  // TESTES DE PERFORMANCE DE QUERIES COMPLEXAS
  // ============================================
  describe("Complex Query Performance Tests", () => {
    it("deve recuperar todas as transações em menos de 2 segundos", async () => {
      const startTime = performance.now();
      const transactions = await db.getTransactions();
      const duration = performance.now() - startTime;

      expect(Array.isArray(transactions)).toBe(true);
      expect(duration).toBeLessThan(2000);
      console.log(
        `✓ Recuperação de todas as transações: ${duration.toFixed(2)}ms (${transactions.length} registros)`
      );
    });

    it("deve recuperar métricas de performance em menos de 1 segundo", async () => {
      const startTime = performance.now();
      const metrics = await db.getPerformanceMetrics();
      const duration = performance.now() - startTime;

      expect(Array.isArray(metrics)).toBe(true);
      expect(duration).toBeLessThan(1000);
      console.log(
        `✓ Recuperação de métricas de performance: ${duration.toFixed(2)}ms (${metrics.length} registros)`
      );
    });

    it("deve recuperar logs de auditoria em menos de 2 segundos", async () => {
      const startTime = performance.now();
      const logs = await db.getAuditLogs(10000);
      const duration = performance.now() - startTime;

      expect(Array.isArray(logs)).toBe(true);
      expect(duration).toBeLessThan(2000);
      console.log(
        `✓ Recuperação de logs de auditoria: ${duration.toFixed(2)}ms (${logs.length} registros)`
      );
    });

    it("deve recuperar dados de mercado em menos de 1 segundo", async () => {
      const startTime = performance.now();
      const data = await db.getMarketData();
      const duration = performance.now() - startTime;

      expect(Array.isArray(data)).toBe(true);
      expect(duration).toBeLessThan(1000);
      console.log(
        `✓ Recuperação de dados de mercado: ${duration.toFixed(2)}ms (${data.length} registros)`
      );
    });
  });

  // ============================================
  // TESTES DE SINCRONIZAÇÃO
  // ============================================
  describe("Synchronization Tests", () => {
    it("deve sincronizar startup entre sistemas", async () => {
      const startupId = await db.createStartup({
        name: "Sync Test Startup",
        status: "planning",
        revenue: 100000,
        traction: 100,
        reputation: 70,
      });

      expect(startupId).toBeDefined();

      // Simular sincronização
      const startup = await db.getStartupById(startupId!);
      expect(startup).toBeDefined();
      expect(startup?.name).toBe("Sync Test Startup");

      // Atualizar e re-sincronizar
      const updateResult = await db.updateStartup(startupId!, {
        revenue: 150000,
        traction: 200,
      });

      expect(updateResult).toBe(true);

      const updatedStartup = await db.getStartupById(startupId!);
      expect(updatedStartup?.revenue).toBe(150000);
      expect(updatedStartup?.traction).toBe(200);
    });

    it("deve sincronizar agente entre sistemas", async () => {
      const startups = await db.getStartups();
      if (startups.length === 0) return;

      const startupId = (startups[0] as any).id;

      const agentId = await db.createAgent({
        name: "Sync Test Agent",
        specialization: "Testing",
        startupId,
        role: "cto",
        reputation: 80,
        health: 100,
        energy: 100,
        creativity: 90,
      });

      expect(agentId).toBeDefined();

      const agent = await db.getAgentById(agentId!);
      expect(agent).toBeDefined();
      expect(agent?.name).toBe("Sync Test Agent");

      // Atualizar e re-sincronizar
      const updateResult = await db.updateAgent(agentId!, {
        reputation: 95,
        health: 85,
      });

      expect(updateResult).toBe(true);

      const updatedAgent = await db.getAgentById(agentId!);
      expect(updatedAgent?.reputation).toBe(95);
      expect(updatedAgent?.health).toBe(85);
    });

    it("deve sincronizar dados de mercado", async () => {
      const dataId = await db.createMarketData({
        asset: "SYNC_TEST",
        price: 100.5,
        priceChange24h: 2.5,
        sentiment: "bullish",
        volume24h: 1000000,
        source: "Test",
      });

      expect(dataId).toBeDefined();

      const data = await db.getMarketData("SYNC_TEST");
      expect(data.length).toBeGreaterThan(0);
      expect((data[0] as any).asset).toBe("SYNC_TEST");
    });
  });

  // ============================================
  // TESTES DE CARGA
  // ============================================
  describe("Load Tests", () => {
    it("deve suportar 1000 leituras concorrentes", async () => {
      const startups = await db.getStartups();
      if (startups.length === 0) return;

      const startupId = (startups[0] as any).id;
      const startTime = performance.now();

      const promises = Array(1000)
        .fill(null)
        .map(() => db.getStartupById(startupId));

      const results = await Promise.all(promises);
      const duration = performance.now() - startTime;

      expect(results.length).toBe(1000);
      expect(results.every((r) => r !== null)).toBe(true);
      expect(duration).toBeLessThan(30000);
      console.log(
        `✓ 1000 leituras concorrentes: ${duration.toFixed(2)}ms (${(duration / 1000).toFixed(2)}ms por leitura)`
      );
    });

    it("deve suportar 100 escritas concorrentes", async () => {
      const startTime = performance.now();

      const promises = Array(100)
        .fill(null)
        .map((_, i) =>
          db.createTransaction({
            amount: Math.random() * 100000,
            type: "transfer",
            description: `Concurrent Write ${i}`,
            status: "pending",
          })
        );

      const results = await Promise.all(promises);
      const duration = performance.now() - startTime;

      expect(results.filter((r) => r !== null).length).toBe(100);
      expect(duration).toBeLessThan(30000);
      console.log(
        `✓ 100 escritas concorrentes: ${duration.toFixed(2)}ms (${(duration / 100).toFixed(2)}ms por escrita)`
      );
    });
  });

  // ============================================
  // TESTES DE CONSISTÊNCIA DE DADOS
  // ============================================
  describe("Data Consistency Tests", () => {
    it("deve manter consistência de dados após múltiplas operações", async () => {
      const startupId = await db.createStartup({
        name: "Consistency Test",
        status: "planning",
        revenue: 100000,
        traction: 100,
        reputation: 70,
      });

      expect(startupId).toBeDefined();

      // Realizar múltiplas operações
      for (let i = 0; i < 10; i++) {
        await db.updateStartup(startupId!, {
          revenue: 100000 + i * 10000,
          traction: 100 + i * 10,
        });
      }

      // Verificar estado final
      const finalStartup = await db.getStartupById(startupId!);
      expect(finalStartup?.revenue).toBe(100000 + 9 * 10000);
      expect(finalStartup?.traction).toBe(100 + 9 * 10);
    });

    it("deve manter integridade de relacionamentos", async () => {
      const startupId = await db.createStartup({
        name: "Relationship Test",
        status: "planning",
      });

      const agentIds: number[] = [];

      // Criar múltiplos agentes
      for (let i = 0; i < 5; i++) {
        const id = await db.createAgent({
          name: `Agent ${i}`,
          specialization: "Testing",
          startupId: startupId!,
          role: "developer",
          reputation: 80,
          health: 100,
          energy: 100,
          creativity: 90,
        });

        if (id) agentIds.push(id);
      }

      // Verificar que todos os agentes estão associados
      const agents = await db.getAgentsByStartup(startupId!);
      expect(agents.length).toBe(5);

      // Verificar que cada agente tem a startup correta
      for (const agent of agents) {
        expect((agent as any).startupId).toBe(startupId);
      }
    });
  });

  // ============================================
  // TESTES DE RECUPERAÇÃO DE FALHAS
  // ============================================
  describe("Failure Recovery Tests", () => {
    it("deve recuperar de erro ao criar startup", async () => {
      // Tentar criar startup com dados inválidos deve falhar graciosamente
      const result = await db.createStartup({
        name: "",
        status: "invalid_status" as any,
      });

      // Deve retornar null ou falhar sem derrubar o sistema
      expect(typeof result === "number" || result === null).toBe(true);
    });

    it("deve recuperar de erro ao atualizar startup inexistente", async () => {
      const result = await db.updateStartup(999999, {
        revenue: 100000,
      });

      // Deve retornar false sem derrubar o sistema
      expect(result).toBe(false);
    });

    it("deve recuperar de erro ao recuperar dados inexistentes", async () => {
      const startup = await db.getStartupById(999999);
      expect(startup).toBeUndefined();

      const agent = await db.getAgentById(999999);
      expect(agent).toBeUndefined();
    });
  });

  // ============================================
  // TESTES DE MEMÓRIA
  // ============================================
  describe("Memory Tests", () => {
    it("deve manter uso de memória estável ao criar muitos registros", async () => {
      const initialMemory = process.memoryUsage().heapUsed;

      // Criar 200 startups
      for (let i = 0; i < 200; i++) {
        await db.createStartup({
          name: `Memory Test ${i}`,
          status: "planning",
          revenue: Math.random() * 1000000,
        });
      }

      const finalMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = finalMemory - initialMemory;

      // Permitir aumento razoável de memória (menos de 100MB)
      expect(memoryIncrease).toBeLessThan(100 * 1024 * 1024);
      console.log(
        `✓ Aumento de memória: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB`
      );
    });
  });
});
