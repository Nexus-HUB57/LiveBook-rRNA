// ============================================================
// MNEMONIC API — BIP39 Mnemonic Converter & Vault Integration
// Actions:
//   validate  — Validate a BIP39 mnemonic phrase
//   derive    — Derive addresses from mnemonic (BIP32/BIP44)
//   generate  — Generate a new random BIP39 mnemonic
//   vault-add — Derive keys and add to dynamic vault for PSBT
// ============================================================

import { NextRequest, NextResponse } from "next/server";
import * as crypto from "crypto";
import HDKey from "hdkey";
import * as secp256k1 from "@noble/secp256k1";
import {
  validateMnemonic,
  mnemonicToSeed,
  generateMnemonic,
  type DerivedKey,
} from "@/lib/bip39";
import { addToDynamicVault } from "@/lib/dynamic-vault";

// ---------- DERIVATION PATH PRESETS ----------
const PATH_PRESETS: Record<string, { label: string; purpose: number; coin: number; account: number }> = {
  BIP44: { label: "BIP44 (Legacy P2PKH)", purpose: 44, coin: 0, account: 0 },
  BIP49: { label: "BIP49 (P2SH-P2WPKH)", purpose: 49, coin: 0, account: 0 },
  BIP84: { label: "BIP84 (Native SegWit P2WPKH)", purpose: 84, coin: 0, account: 0 },
};

// ---------- HELPERS ----------

const B58 = "123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz";

function base58Encode(buf: Buffer): string {
  let num = BigInt("0x" + buf.toString("hex"));
  let str = "";
  while (num > 0n) {
    str = B58[Number(num % 58n)] + str;
    num /= 58n;
  }
  for (let i = 0; i < buf.length && buf[i] === 0; i++) str = "1" + str;
  return str;
}

function sha256(data: Buffer): Buffer {
  return crypto.createHash("sha256").update(data).digest();
}

function hash256(data: Buffer): Buffer {
  return sha256(sha256(data));
}

function hash160(data: Buffer): Buffer {
  return crypto.createHash("ripemd160").update(sha256(data)).digest();
}

function privkeyToWIF(key: Buffer, compressed: boolean): string {
  const payload = compressed
    ? Buffer.concat([Buffer.from([0x80]), key, Buffer.from([0x01])])
    : Buffer.concat([Buffer.from([0x80]), key]);
  const checksum = hash256(payload).subarray(0, 4);
  return base58Encode(Buffer.concat([payload, checksum]));
}

function pubkeyToP2PKH(pubkey: Buffer): string {
  const h160 = hash160(pubkey);
  const versioned = Buffer.concat([Buffer.from([0x00]), h160]);
  const checksum = hash256(versioned).subarray(0, 4);
  return base58Encode(Buffer.concat([versioned, checksum]));
}

// ---------- DERIVATION ENGINE ----------

function deriveKeyFromPath(masterXprv: string, path: string, index: number, branch: number): DerivedKey {
  const fullPath = `${path}/${branch}/${index}`;
  let node = HDKey.fromExtendedKey(masterXprv);
  for (const part of fullPath.replace("m/", "").split("/")) {
    let idx = 0;
    if (part.endsWith("'") || part.endsWith("h") || part.endsWith("H")) {
      idx = parseInt(part.slice(0, -1)) + 0x80000000;
    } else {
      idx = parseInt(part);
    }
    node = node.deriveChild(idx);
  }

  const privateKey = Buffer.from(node.privateKey!);
  const pubUncompressed = Buffer.from(secp256k1.getPublicKey(privateKey, false));
  const pubCompressed = Buffer.from(secp256k1.getPublicKey(privateKey, true));

  return {
    index,
    path: fullPath,
    privateKeyHex: privateKey.toString("hex"),
    wif: privkeyToWIF(privateKey, false),
    wifCompressed: privkeyToWIF(privateKey, true),
    publicKeyHex: pubUncompressed.toString("hex"),
    publicKeyCompressedHex: pubCompressed.toString("hex"),
    address: pubkeyToP2PKH(pubUncompressed),
    addressCompressed: pubkeyToP2PKH(pubCompressed),
  };
}

// ============================================================
// ROUTE HANDLER
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // ---------- VALIDATE MNEMONIC ----------
    if (action === "validate") {
      const mnemonic = body.mnemonic;
      if (!mnemonic || typeof mnemonic !== "string") {
        return NextResponse.json({ error: true, detail: "mnemonic is required" }, { status: 400 });
      }

      const result = validateMnemonic(mnemonic);
      return NextResponse.json({ error: false, ...result });
    }

    // ---------- GENERATE MNEMONIC ----------
    if (action === "generate") {
      const strength = typeof body.strength === "number"
        ? [128, 160, 192, 224, 256].includes(body.strength) ? body.strength : 128
        : 128;

      const mnemonic = generateMnemonic(strength);
      const validation = validateMnemonic(mnemonic);

      return NextResponse.json({
        error: false,
        mnemonic,
        wordCount: validation.wordCount,
        entropyBits: validation.entropyBits,
        valid: validation.valid,
      });
    }

    // ---------- DERIVE ADDRESSES ----------
    if (action === "derive") {
      const mnemonic = body.mnemonic;
      if (!mnemonic || typeof mnemonic !== "string") {
        return NextResponse.json({ error: true, detail: "mnemonic is required" }, { status: 400 });
      }

      const validation = validateMnemonic(mnemonic);
      if (!validation.valid) {
        return NextResponse.json({ error: true, detail: validation.error, valid: false });
      }

      const passphrase = body.passphrase || "";
      const preset = body.preset || "BIP44";
      const count = Math.min(Math.max(body.count || 5, 1), 50);
      const branch = body.branch === "change" ? 1 : 0;
      const addVault = body.addToVault === true;

      const cfg = PATH_PRESETS[preset] || PATH_PRESETS.BIP44;
      const path = `m/${cfg.purpose}'/${cfg.coin}'/${cfg.account}'`;

      const seed = mnemonicToSeed(mnemonic, passphrase);
      const master = HDKey.fromMasterSeed(seed);

      if (!master.privateExtendedKey) {
        return NextResponse.json({ error: true, detail: "Failed to derive master key" }, { status: 500 });
      }

      const addresses: DerivedKey[] = [];
      for (let i = 0; i < count; i++) {
        const dk = deriveKeyFromPath(master.privateExtendedKey, path, i, branch);
        addresses.push(dk);

        if (addVault) {
          addToDynamicVault({
            name: `MN-${preset}-0/${branch}/${i}`,
            address: dk.address,
            wif: dk.wif,
            compressed: false,
            pubkeyHex: dk.publicKeyHex,
            type: "P2PKH",
          });
        }
      }

      // Also derive master xpub for reference
      const masterXpub = master.publicExtendedKey || "";

      return NextResponse.json({
        error: false,
        valid: true,
        seedHex: seed.toString("hex"),
        xpub: masterXpub,
        derivationPath: `${path}/${branch}/*`,
        preset: preset,
        presetLabel: cfg.label,
        passphrase: passphrase ? "(set)" : "(none)",
        addresses,
        addedToVault: addVault ? count : 0,
      });
    }

    return NextResponse.json({ error: true, detail: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: true, detail: msg }, { status: 500 });
  }
}

// GET — API info
export async function GET() {
  return NextResponse.json({
    name: "BIP39 Mnemonic Converter",
    version: "1.0.0",
    supportedActions: ["validate", "derive", "generate"],
    pathPresets: Object.fromEntries(
      Object.entries(PATH_PRESETS).map(([k, v]) => [k, { label: v.label, path: `m/${v.purpose}'/${v.coin}'/${v.account}'/0/i` }])
    ),
    maxDerivationCount: 50,
    wordlistSize: 2048,
    supportedStrengths: [128, 160, 192, 224, 256],
  });
}