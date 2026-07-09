import { describe, it, expect, beforeEach } from "vitest";
import {
  BitcoinWalletManager,
  BitcoinTransactionBuilder,
  BitcoinUtils,
} from "./bitcoin-wallet";

describe("BitcoinWalletManager", () => {
  let manager: BitcoinWalletManager;

  beforeEach(() => {
    manager = new BitcoinWalletManager("test-password-123");
  });

  it("should generate a valid mnemonic", () => {
    const mnemonic = manager.generateMnemonic();
    expect(mnemonic).toBeDefined();
    expect(mnemonic.split(" ").length).toBe(24);
  });

  it("should import from mnemonic", async () => {
    const mnemonic = manager.generateMnemonic();
    await expect(manager.importFromMnemonic(mnemonic)).resolves.not.toThrow();
  });

  it("should reject invalid mnemonic", async () => {
    const invalidMnemonic = "invalid mnemonic words";
    await expect(manager.importFromMnemonic(invalidMnemonic)).rejects.toThrow();
  });

  it("should generate P2PKH address", async () => {
    const mnemonic = manager.generateMnemonic();
    await manager.importFromMnemonic(mnemonic);

    const wallet = manager.generateP2PKH();
    expect(wallet.address).toBeDefined();
    expect(wallet.address.startsWith("1")).toBe(true);
    expect(wallet.publicKey).toBeDefined();
    expect(wallet.privateKey).toBeDefined();
    expect(wallet.addressType).toBe("P2PKH");
  });

  it("should generate P2SH address", async () => {
    const mnemonic = manager.generateMnemonic();
    await manager.importFromMnemonic(mnemonic);

    const wallet = manager.generateP2SH();
    expect(wallet.address).toBeDefined();
    expect(wallet.address.startsWith("3")).toBe(true);
    expect(wallet.addressType).toBe("P2SH");
  });

  it("should generate P2WPKH address", async () => {
    const mnemonic = manager.generateMnemonic();
    await manager.importFromMnemonic(mnemonic);

    const wallet = manager.generateP2WPKH();
    expect(wallet.address).toBeDefined();
    expect(wallet.address.startsWith("bc1")).toBe(true);
    expect(wallet.addressType).toBe("P2WPKH");
  });

  it("should encrypt and decrypt private key", () => {
    const privateKey = "L1uyy57oK0hFtz1vSrCMr1UUq3MJsDg5YKcF7zLEvVHaUjMU5pwL";

    const encrypted = manager.encryptPrivateKey(privateKey);
    expect(encrypted).toHaveProperty("iv");
    expect(encrypted).toHaveProperty("ciphertext");
    expect(encrypted).toHaveProperty("salt");

    const decrypted = manager.decryptPrivateKey(encrypted);
    expect(decrypted).toBe(privateKey);
  });

  it("should validate Bitcoin address", () => {
    expect(BitcoinWalletManager.validateAddress("invalid-address")).toBe(false);
  });

  it("should detect address type by prefix", () => {
    expect(BitcoinWalletManager.getAddressType("1A1z7agoat3bstZHTBCVXwXfonnT2zQc6")).toBe("P2PKH");
    expect(BitcoinWalletManager.getAddressType("3J98t1WpEZ73CNmYviecrnyiWrnqRhWNLy")).toBe("P2SH");
    expect(BitcoinWalletManager.getAddressType("bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4")).toBe("P2WPKH");
    expect(BitcoinWalletManager.getAddressType("unknown-address")).toBeNull();
  });
});

describe("BitcoinTransactionBuilder", () => {
  let builder: BitcoinTransactionBuilder;

  beforeEach(() => {
    builder = new BitcoinTransactionBuilder("testnet");
  });

  it("should calculate fee correctly", () => {
    const fee = builder.calculateFee(1, 2, 10);
    expect(fee).toBeGreaterThan(0);
    expect(typeof fee).toBe("number");
  });

  it("should calculate fee for multiple inputs and outputs", () => {
    const fee = builder.calculateFee(2, 1, 20);
    expect(fee).toBeGreaterThan(0);
  });
});

describe("BitcoinUtils", () => {
  it("should convert satoshis to BTC", () => {
    expect(BitcoinUtils.satoshisToBtc(100000000)).toBe(1);
    expect(BitcoinUtils.satoshisToBtc(50000000)).toBe(0.5);
    expect(BitcoinUtils.satoshisToBtc(1)).toBe(0.00000001);
  });

  it("should convert BTC to satoshis", () => {
    expect(BitcoinUtils.btcToSatoshis(1)).toBe(100000000);
    expect(BitcoinUtils.btcToSatoshis(0.5)).toBe(50000000);
    expect(BitcoinUtils.btcToSatoshis(0.00000001)).toBe(1);
  });

  it("should validate derivation path", () => {
    expect(BitcoinUtils.validateDerivationPath("m/44'/0'/0'/0/0")).toBe(true);
    expect(BitcoinUtils.validateDerivationPath("m/84'/0'/0'/0/0")).toBe(true);
    expect(BitcoinUtils.validateDerivationPath("m/invalid/path")).toBe(false);
  });

  it("should generate derivation path", () => {
    const path = BitcoinUtils.generateDerivationPath("bip44", 0, 0, 0);
    expect(path).toBe("m/44'/0'/0'/0/0");

    const path84 = BitcoinUtils.generateDerivationPath("bip84", 0, 0, 0);
    expect(path84).toBe("m/84'/0'/0'/0/0");
  });
});
