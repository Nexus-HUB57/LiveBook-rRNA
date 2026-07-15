import { NextRequest, NextResponse } from "next/server";
import { generateWallet, generateWalletBatch } from "@/lib/keygen";
import { addToDynamicVault, dynamicVaultCount } from "@/lib/dynamic-vault";

// ============================================================
// POST /api/generate-wallet
// Actions:
//   single   — Generate 1 new wallet (default)
//   batch    — Generate N wallets (count param, max 50)
//   verify   — Verify a WIF key and return derived address
//
// All keys are generated server-side with crypto.randomBytes.
// Generated wallets are stored in the DynamicVault for PSBT signing.
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action || "single";

    // ---------- SINGLE WALLET ----------
    if (action === "single") {
      const wallet = generateWallet();

      // Store in dynamic vault for PSBT signing
      const vaultEntry = {
        name: `Gen-${Date.now().toString(36)}`,
        address: wallet.addressUncompressed,
        wif: wallet.wif,
        compressed: false,
        pubkeyHex: wallet.pubkeyHexUncompressed,
        type: "P2PKH" as const,
      };
      addToDynamicVault(vaultEntry);

      return NextResponse.json({
        error: false,
        wallet: {
          name: vaultEntry.name,
          address: vaultEntry.address,
          addressCompressed: wallet.addressCompressed,
          wif: wallet.wif,
          wifCompressed: wallet.wifCompressed,
          compressed: false,
          pubkeyHex: wallet.pubkeyHexUncompressed,
          pubkeyHexCompressed: wallet.pubkeyHexCompressed,
          type: "P2PKH",
          dynamic: true,
        },
        dynamicVaultTotal: dynamicVaultCount(),
      });
    }

    // ---------- BATCH GENERATION ----------
    if (action === "batch") {
      const count = typeof body.count === "number" ? Math.min(body.count, 50) : 10;
      const compressed = body.compressed === true;
      const wallets = generateWalletBatch(count, compressed);

      const result = wallets.map((w, i) => {
        const entry = {
          name: `Gen-${Date.now().toString(36)}-${i + 1}`,
          address: compressed ? w.addressCompressed : w.addressUncompressed,
          wif: compressed ? w.wifCompressed : w.wif,
          compressed,
          pubkeyHex: compressed ? w.pubkeyHexCompressed : w.pubkeyHexUncompressed,
          type: "P2PKH" as const,
        };
        addToDynamicVault(entry);
        return entry;
      });

      return NextResponse.json({
        error: false,
        wallets: result,
        count: result.length,
        dynamicVaultTotal: dynamicVaultCount(),
      });
    }

    // ---------- VERIFY WIF ----------
    if (action === "verify") {
      const wif = body.wif;
      if (!wif || typeof wif !== "string") {
        return NextResponse.json({ error: true, detail: "wif parameter required" }, { status: 400 });
      }

      const { verifyKeyAddress } = await import("@/lib/psbt");
      const result = verifyKeyAddress(wif, body.address || "");

      return NextResponse.json({ error: false, ...result });
    }

    return NextResponse.json({ error: true, detail: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: true, detail: msg }, { status: 500 });
  }
}

// GET — info about the key generator + dynamic vault status
export async function GET() {
  const { getAllDynamicVault, dynamicVaultCount } = await import("@/lib/dynamic-vault");
  return NextResponse.json({
    generator: "keygen.ts",
    entropy: "crypto.randomBytes (CSPRNG)",
    curve: "secp256k1 (@noble/secp256k1)",
    output: ["WIF uncompressed", "WIF compressed", "P2PKH address", "public key hex"],
    security: "Keys generated server-side, stored in memory vault for PSBT signing",
    dynamicVaultCount: dynamicVaultCount(),
    dynamicVaultAddresses: getAllDynamicVault().map(w => w.address),
  });
}