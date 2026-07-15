import { NextRequest, NextResponse } from "next/server";
import {
  createWithdrawalPSBT,
  signWithdrawalPSBT,
  broadcastTransaction,
  verifyKeyAddress,
  fetchAddressBalance,
  fetchAddressUTXOs,
  CUSTODY_ADDRESS,
} from "@/lib/psbt";
import { VAULT_WALLETS, PRIMARY_ADDRESS, PRIMARY_BTC_BALANCE } from "@/components/bitcoin/bitcoin-data";
import { getFromDynamicVault } from "@/lib/dynamic-vault";

// Helper: find vault wallet in both static and dynamic vaults
function findVaultWallet(address: string) {
  return VAULT_WALLETS.find(w => w.address === address) || getFromDynamicVault(address);
}

// ============================================================
// POST /api/withdraw
// Body: { action: string, ...params }
//
// Actions:
//   list-wallets       — List all vault wallets + live balances
//   create             — Build unsigned PSBT for withdrawal from selected wallet
//   verify-key         — Check if WIF matches a given address
//   sign               — Sign PSBT, return signed TX hex (no broadcast)
//   sign-and-broadcast — Sign + broadcast in one step
//   broadcast          — Broadcast already-signed TX hex
//
// ALL withdrawals are IMUTABLY routed to CUSTODY_ADDRESS (Binance bc1q).
// No destination parameter is accepted — enforced server-side.
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const action = body.action;

    // ---------- LIST WALLETS ----------
    if (action === "list-wallets") {
      const results = [];
      for (const w of VAULT_WALLETS) {
        try {
          const { balance, txCount } = await fetchAddressBalance(w.address);
          results.push({
            name: w.name,
            address: w.address,
            balance,
            txCount,
            compressed: w.compressed,
            hasKey: true,
          });
        } catch {
          results.push({
            name: w.name,
            address: w.address,
            balance: 0,
            txCount: 0,
            compressed: w.compressed,
            hasKey: true,
          });
        }
      }
      // Also include primary (watch-only, no key)
      results.unshift({
        name: "Primary (Watch-Only)",
        address: PRIMARY_ADDRESS,
        balance: Math.round(parseFloat(PRIMARY_BTC_BALANCE) * 100000000),
        txCount: 0,
        compressed: false,
        hasKey: false,
      });
      return NextResponse.json({ error: false, wallets: results });
    }

    // ---------- CREATE PSBT ----------
    if (action === "create") {
      const amountSats = body.amount;
      const walletAddress = body.walletAddress;

      if (typeof amountSats !== "number" || amountSats <= 0) {
        return NextResponse.json({ error: true, detail: "amount must be a positive number (satoshis)" }, { status: 400 });
      }

      if (amountSats > 2_100_000_000) {
        return NextResponse.json({ error: true, detail: "Amount exceeds 21 BTC safety limit" }, { status: 400 });
      }

      if (!walletAddress || typeof walletAddress !== "string") {
        return NextResponse.json({ error: true, detail: "walletAddress is required" }, { status: 400 });
      }

      // Check if wallet has a private key in vault
      const vaultWallet = findVaultWallet(walletAddress);
      if (!vaultWallet) {
        return NextResponse.json({
          error: true,
          detail: `No private key found for ${walletAddress}. Only vault wallets can sign transactions.`,
          code: "NO_PRIVATE_KEY",
        }, { status: 400 });
      }

      try {
        const result = await createWithdrawalPSBT(amountSats, walletAddress);
        return NextResponse.json({ error: false, ...result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "PSBT creation failed";
        return NextResponse.json({ error: true, detail: msg }, { status: 400 });
      }
    }

    // ---------- VERIFY KEY ----------
    if (action === "verify-key") {
      const wif = body.wif;
      const address = body.address;
      if (!wif || typeof wif !== "string") {
        return NextResponse.json({ error: true, detail: "wif parameter required" }, { status: 400 });
      }
      const target = address || PRIMARY_ADDRESS;
      const result = verifyKeyAddress(wif, target);
      return NextResponse.json({ error: false, ...result });
    }

    // ---------- SIGN PSBT ----------
    if (action === "sign") {
      const psbt = body.psbt;
      const walletAddress = body.walletAddress;

      if (!psbt || typeof psbt !== "string") {
        return NextResponse.json({ error: true, detail: "psbt (base64) is required" }, { status: 400 });
      }

      const vaultWallet = findVaultWallet(walletAddress);
      if (!vaultWallet) {
        return NextResponse.json({
          error: true,
          detail: `No private key for ${walletAddress || "unknown"}`,
          code: "NO_PRIVATE_KEY",
        }, { status: 400 });
      }

      try {
        const result = await signWithdrawalPSBT(psbt, vaultWallet.wif, vaultWallet.address);
        return NextResponse.json({ error: false, ...result });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Signing failed";
        return NextResponse.json({ error: true, detail: msg }, { status: 400 });
      }
    }

    // ---------- SIGN AND BROADCAST ----------
    if (action === "sign-and-broadcast") {
      const psbt = body.psbt;
      const walletAddress = body.walletAddress;

      if (!psbt || typeof psbt !== "string") {
        return NextResponse.json({ error: true, detail: "psbt (base64) is required" }, { status: 400 });
      }

      const vaultWallet = findVaultWallet(walletAddress);
      if (!vaultWallet) {
        return NextResponse.json({
          error: true,
          detail: `No private key for ${walletAddress || "unknown"}`,
          code: "NO_PRIVATE_KEY",
        }, { status: 400 });
      }

      try {
        // Step 1: Sign
        const signed = await signWithdrawalPSBT(psbt, vaultWallet.wif, vaultWallet.address);

        // Step 2: Validate before broadcast
        if (!signed.txHex || signed.txHex.length < 40) {
          return NextResponse.json({
            error: true,
            detail: "Signed transaction hex is empty or too short — would cause 'TX decode failed'",
          }, { status: 400 });
        }

        // Step 3: Broadcast
        const result = await broadcastTransaction(signed.txHex);

        if (result.success) {
          return NextResponse.json({
            error: false,
            txid: result.txid,
            txHex: signed.txHex,
            txSize: signed.txSize,
            feeSats: signed.feeSats,
            sendAmount: signed.sendAmount,
            changeAmount: signed.changeAmount,
            inputCount: signed.inputCount,
            custodyAddress: signed.custodyAddress,
            changeAddress: signed.changeAddress,
          });
        }

        return NextResponse.json({
          error: true,
          detail: `Signing OK but broadcast failed: ${result.error}`,
          signedTxHex: signed.txHex,
          txid: signed.txid,
        }, { status: 400 });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Sign + broadcast failed";
        return NextResponse.json({ error: true, detail: msg }, { status: 400 });
      }
    }

    // ---------- BROADCAST (already signed) ----------
    if (action === "broadcast") {
      let txHex = body.hex;

      if (!txHex || typeof txHex !== "string") {
        return NextResponse.json({ error: true, detail: "hex (signed tx) is required" }, { status: 400 });
      }

      // Pre-validate hex before sending to blockstream
      const clean = txHex.replace(/\s/g, "").toLowerCase();
      if (!/^[0-9a-f]+$/.test(clean)) {
        return NextResponse.json({ error: true, detail: "Invalid hex characters in transaction" }, { status: 400 });
      }
      if (clean.length < 40) {
        return NextResponse.json({ error: true, detail: "Transaction hex too short — this would cause 'TX decode failed. Make sure the tx has at least one input'" }, { status: 400 });
      }

      const result = await broadcastTransaction(clean);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: true, detail: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: true, detail: msg }, { status: 500 });
  }
}

// GET — custody address + vault wallet list (addresses only, no keys)
export async function GET() {
  const walletList = VAULT_WALLETS.map(w => ({
    name: w.name,
    address: w.address,
    compressed: w.compressed,
  }));

  return NextResponse.json({
    custodyAddress: CUSTODY_ADDRESS,
    policy: "ALL withdrawals are immutable to this address via PSBT",
    vaultWalletCount: VAULT_WALLETS.length,
    wallets: walletList,
    primaryAddress: PRIMARY_ADDRESS,
    primaryHasBalance: true,
    primaryIsWatchOnly: true,
  });
}