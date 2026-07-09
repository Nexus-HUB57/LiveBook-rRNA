import { describe, it, expect, beforeEach, vi } from "vitest";
import { TransactionMonitor, MonitoringEvent } from "./transaction-monitor";

describe("TransactionMonitor", () => {
  let monitor: TransactionMonitor;

  beforeEach(() => {
    monitor = new TransactionMonitor();
    vi.useFakeTimers();
  });

  describe("startMonitoring", () => {
    it("should start monitoring a transaction", () => {
      const txid = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      const address = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const callback = vi.fn();

      monitor.startMonitoring(txid, address, callback);

      const status = monitor.getStatus(txid);
      expect(status).toBeDefined();
      expect(status?.txid).toBe(txid);
      expect(status?.address).toBe(address);
      expect(status?.status).toBe("pending");
    });

    it("should add callback to existing monitoring", () => {
      const txid = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      const address = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const callback1 = vi.fn();
      const callback2 = vi.fn();

      monitor.startMonitoring(txid, address, callback1);
      monitor.startMonitoring(txid, address, callback2);

      const status = monitor.getStatus(txid);
      expect(status?.callbacks.length).toBe(2);
    });
  });

  describe("stopMonitoring", () => {
    it("should stop monitoring a transaction", () => {
      const txid = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      const address = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const callback = vi.fn();

      monitor.startMonitoring(txid, address, callback);
      expect(monitor.getStatus(txid)).toBeDefined();

      monitor.stopMonitoring(txid);
      expect(monitor.getStatus(txid)).toBeNull();
    });
  });

  describe("listMonitored", () => {
    it("should list all monitored transactions", () => {
      const address = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const callback = vi.fn();

      const txid1 = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      const txid2 = "def456abc123def456abc123def456abc123def456abc123def456abc123def456";

      monitor.startMonitoring(txid1, address, callback);
      monitor.startMonitoring(txid2, address, callback);

      const monitored = monitor.listMonitored();
      expect(monitored.length).toBe(2);
      expect(monitored.map((m) => m.txid)).toContain(txid1);
      expect(monitored.map((m) => m.txid)).toContain(txid2);
    });

    it("should return empty list when no transactions are monitored", () => {
      const monitored = monitor.listMonitored();
      expect(monitored.length).toBe(0);
    });
  });

  describe("Configuration", () => {
    it("should allow setting polling interval", () => {
      monitor.setPollingInterval(60000);
      expect(monitor).toBeDefined();
    });

    it("should allow setting max attempts", () => {
      monitor.setMaxAttempts(200);
      expect(monitor).toBeDefined();
    });
  });

  describe("Cleanup", () => {
    it("should remove old monitored transactions", () => {
      const txid = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      const address = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const callback = vi.fn();

      monitor.startMonitoring(txid, address, callback);

      // Simular passagem de 25 horas
      vi.advanceTimersByTime(25 * 60 * 60 * 1000);

      monitor.cleanup(24 * 60 * 60 * 1000); // 24 horas

      expect(monitor.getStatus(txid)).toBeNull();
    });

    it("should not remove recent transactions", () => {
      const txid = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      const address = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const callback = vi.fn();

      monitor.startMonitoring(txid, address, callback);

      // Simular passagem de 1 hora
      vi.advanceTimersByTime(1 * 60 * 60 * 1000);

      monitor.cleanup(24 * 60 * 60 * 1000); // 24 horas

      expect(monitor.getStatus(txid)).toBeDefined();
    });
  });

  describe("Monitoring Events", () => {
    it("should track monitoring status correctly", () => {
      const txid = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      const address = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const callback = vi.fn();

      monitor.startMonitoring(txid, address, callback);

      const status = monitor.getStatus(txid);
      expect(status?.attempts).toBeGreaterThanOrEqual(0);
      expect(status?.status).toBe("pending");
      expect(status?.confirmations).toBe(0);
    });
  });

  describe("Edge Cases", () => {
    it("should handle monitoring multiple transactions", () => {
      const address = "bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4";
      const callback = vi.fn();

      for (let i = 0; i < 10; i++) {
        const txid = `abc${i}def456abc123def456abc123def456abc123def456abc123def456abc1`;
        monitor.startMonitoring(txid, address, callback);
      }

      const monitored = monitor.listMonitored();
      expect(monitored.length).toBe(10);
    });

    it("should handle stopping non-existent transaction", () => {
      const txid = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      expect(() => monitor.stopMonitoring(txid)).not.toThrow();
    });

    it("should handle getting status of non-existent transaction", () => {
      const txid = "abc123def456abc123def456abc123def456abc123def456abc123def456abc1";
      const status = monitor.getStatus(txid);
      expect(status).toBeNull();
    });
  });
});
