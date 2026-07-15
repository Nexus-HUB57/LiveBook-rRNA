// ============================================================
// KEY GENERATOR — Cryptographic WIF key generation
// Uses Node.js crypto.randomBytes for entropy
// Uses @noble/secp256k1 for secp256k1 operations
// ============================================================

import * as crypto from "crypto";
import * as secp256k1 from "@noble/secp256k1";

// ============================================================
// BASE58 ENCODING
// ============================================================

const B58_ALPHABET = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(buffer: Buffer): string {
  const bytes = Buffer.from(buffer);
  let num = BigInt("0x" + bytes.toString("hex"));
  let str = "";
  while (num > 0n) {
    str = B58_ALPHABET[Number(num % 58n)] + str;
    num /= 58n;
  }
  // Preserve leading zeros
  for (let i = 0; i < bytes.length && bytes[i] === 0; i++) {
    str = "1" + str;
  }
  return str;
}

// ============================================================
// HASH FUNCTIONS
// ============================================================

function sha256(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

function hash256(data: Buffer): Buffer {
  return sha256(sha256(data));
}

function hash160(data: Buffer): Buffer {
  return crypto.createHash("ripemd160").update(sha256(data)).digest();
}

// ============================================================
// WIF ENCODING
// ============================================================

interface GeneratedWallet {
  privateKey: Buffer;
  wif: string;
  wifCompressed: string;
  publicKey: Buffer;
  publicKeyCompressed: Buffer;
  addressUncompressed: string;
  addressCompressed: string;
  pubkeyHexUncompressed: string;
  pubkeyHexCompressed: string;
}

/**
 * Generate a new Bitcoin keypair from cryptographic randomness.
 * Returns both compressed and uncompressed WIF + addresses.
 */
export function generateWallet(): GeneratedWallet {
  // 256-bit random private key
  const privateKey = crypto.randomBytes(32);

  // Ensure key is valid for secp256k1 (1 <= key < n)
  // n = FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141
  const n = BigInt("0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141");
  let keyInt = BigInt("0x" + privateKey.toString("hex"));
  if (keyInt === 0n || keyInt >= n) {
    // Extremely rare — regenerate
    return generateWallet();
  }

  // Derive public keys
  const publicKeyUncompressed = Buffer.from(secp256k1.getPublicKey(privateKey, false));
  const publicKeyCompressed = Buffer.from(secp256k1.getPublicKey(privateKey, true));

  // WIF Uncompressed: 0x80 + 32-byte key + 4-byte checksum
  const wifPayload = Buffer.concat([Buffer.from([0x80]), privateKey]);
  const wifChecksum = hash256(wifPayload).subarray(0, 4);
  const wif = base58Encode(Buffer.concat([wifPayload, wifChecksum]));

  // WIF Compressed: 0x80 + 32-byte key + 0x01 + 4-byte checksum
  const wifCompPayload = Buffer.concat([Buffer.from([0x80]), privateKey, Buffer.from([0x01])]);
  const wifCompChecksum = hash256(wifCompPayload).subarray(0, 4);
  const wifCompressed = base58Encode(Buffer.concat([wifCompPayload, wifCompChecksum]));

  // P2PKH Addresses
  const h160Uncomp = hash160(publicKeyUncompressed);
  const addrUncompPayload = Buffer.concat([Buffer.from([0x00]), h160Uncomp]);
  const addrUncompChecksum = hash256(addrUncompPayload).subarray(0, 4);
  const addressUncompressed = base58Encode(Buffer.concat([addrUncompPayload, addrUncompChecksum]));

  const h160Comp = hash160(publicKeyCompressed);
  const addrCompPayload = Buffer.concat([Buffer.from([0x00]), h160Comp]);
  const addrCompChecksum = hash256(addrCompPayload).subarray(0, 4);
  const addressCompressed = base58Encode(Buffer.concat([addrCompPayload, addrCompChecksum]));

  return {
    privateKey,
    wif,
    wifCompressed,
    publicKey: publicKeyUncompressed,
    publicKeyCompressed,
    addressUncompressed,
    addressCompressed,
    pubkeyHexUncompressed: publicKeyUncompressed.toString("hex"),
    pubkeyHexCompressed: publicKeyCompressed.toString("hex"),
  };
}

/**
 * Generate multiple wallets in batch.
 */
export function generateWalletBatch(count: number, compressed: boolean = false): GeneratedWallet[] {
  const wallets: GeneratedWallet[] = [];
  for (let i = 0; i < count; i++) {
    wallets.push(generateWallet());
  }
  return wallets;
}

/**
 * Format a generated wallet into the VaultWallet interface for bitcoin-data.ts
 */
export function toVaultWallet(wallet: GeneratedWallet, name: string) {
  return {
    name,
    address: wallet.addressUncompressed,
    wif: wallet.wif,
    compressed: false,
    pubkeyHex: wallet.pubkeyHexUncompressed,
    type: "P2PKH" as const,
  };
}

/**
 * Format a generated wallet (compressed) into the VaultWallet interface
 */
export function toVaultWalletCompressed(wallet: GeneratedWallet, name: string) {
  return {
    name,
    address: wallet.addressCompressed,
    wif: wallet.wifCompressed,
    compressed: true,
    pubkeyHex: wallet.pubkeyHexCompressed,
    type: "P2PKH" as const,
  };
}