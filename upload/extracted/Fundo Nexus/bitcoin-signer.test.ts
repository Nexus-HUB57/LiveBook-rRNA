import { describe, it, expect } from "vitest";
import {
  generateHDWallet,
  generateAddress,
  validateAddress,
  calculateEconomicDistribution,
  encryptPrivateKey,
  decryptPrivateKey,
} from "./bitcoin-signer";

describe("Bitcoin Signer", () => {
  describe("generateHDWallet", () => {
    it("should generate a valid HD wallet with BIP39 mnemonic", () => {
      const wallet = generateHDWallet();

      expect(wallet).toBeDefined();
      expect(wallet.mnemonic).toBeDefined();
      expect(wallet.seed).toBeDefined();
      expect(wallet.xpub).toBeDefined();
      expect(wallet.xprv).toBeDefined();
      expect(wallet.publicKey).toBeDefined();
      expect(wallet.privateKey).toBeDefined();
      expect(wallet.address).toBeDefined();
      expect(wallet.path).toBe("m/84'/0'/0'/0/0");
    });

    it("should generate SegWit address starting with bc1", () => {
      const wallet = generateHDWallet();
      expect(wallet.address).toMatch(/^bc1/);
    });

    it("should generate wallet from existing mnemonic", () => {
      const mnemonic =
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
      const wallet = generateHDWallet(mnemonic);

      expect(wallet.mnemonic).toBe(mnemonic);
      expect(wallet.address).toBeDefined();
    });
  });

  describe("generateAddress", () => {
    it("should generate address from wallet", () => {
      const wallet = generateHDWallet();
      expect(wallet.address).toBeDefined();
      expect(wallet.address).toMatch(/^bc1/);
    });
  });

  describe("validateAddress", () => {
    it("should validate correct Bitcoin address", () => {
      const wallet = generateHDWallet();
      const isValid = validateAddress(wallet.address);

      expect(isValid).toBe(true);
    });

    it("should reject invalid Bitcoin address", () => {
      const isValid = validateAddress("invalid_address");

      expect(isValid).toBe(false);
    });
  });

  describe("calculateEconomicDistribution", () => {
    it("should calculate 80/10/10 distribution correctly", () => {
      const amount = 100;
      const distribution = calculateEconomicDistribution(amount);

      expect(distribution.executorShare).toBe(80);
      expect(distribution.progenitorShare).toBe(10);
      expect(distribution.infrastructureShare).toBe(10);
      expect(distribution.executorShare + distribution.progenitorShare + distribution.infrastructureShare).toBe(amount);
    });

    it("should handle decimal amounts", () => {
      const amount = 1.5;
      const distribution = calculateEconomicDistribution(amount);

      expect(distribution.executorShare).toBeCloseTo(1.2, 5);
      expect(distribution.progenitorShare).toBeCloseTo(0.15, 5);
      expect(distribution.infrastructureShare).toBeCloseTo(0.15, 5);
    });

    it("should handle zero amount", () => {
      const amount = 0;
      const distribution = calculateEconomicDistribution(amount);

      expect(distribution.executorShare).toBe(0);
      expect(distribution.progenitorShare).toBe(0);
      expect(distribution.infrastructureShare).toBe(0);
    });
  });

  describe("encryptPrivateKey and decryptPrivateKey", () => {
    it("should encrypt and decrypt private key correctly", () => {
      const wallet = generateHDWallet();
      const password = "Benjamin2020*1981$";

      const encrypted = encryptPrivateKey(wallet.privateKey, password);
      expect(encrypted).toBeDefined();
      expect(encrypted).not.toBe(wallet.privateKey);

      const decrypted = decryptPrivateKey(encrypted, password);
      expect(decrypted).toBe(wallet.privateKey);
    });

    it("should fail decryption with wrong password", () => {
      const wallet = generateHDWallet();
      const password = "Benjamin2020*1981$";
      const wrongPassword = "WrongPassword123";

      const encrypted = encryptPrivateKey(wallet.privateKey, password);

      expect(() => {
        decryptPrivateKey(encrypted, wrongPassword);
      }).toThrow();
    });

    it("should handle different private keys", () => {
      const wallet1 = generateHDWallet();
      const wallet2 = generateHDWallet();
      const password = "Benjamin2020*1981$";

      const encrypted1 = encryptPrivateKey(wallet1.privateKey, password);
      const encrypted2 = encryptPrivateKey(wallet2.privateKey, password);

      expect(encrypted1).not.toBe(encrypted2);

      const decrypted1 = decryptPrivateKey(encrypted1, password);
      const decrypted2 = decryptPrivateKey(encrypted2, password);

      expect(decrypted1).toBe(wallet1.privateKey);
      expect(decrypted2).toBe(wallet2.privateKey);
    });
  });
});
