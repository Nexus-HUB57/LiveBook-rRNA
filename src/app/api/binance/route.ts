import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

// ============================================================
// BINANCE API — HMAC-SHA256 signed requests
// Credentials in .env.local (server-only, never sent to client)
// ============================================================

const API_KEY = process.env.BINANCE_API_KEY!;
const API_SECRET = process.env.BINANCE_API_SECRET!;
const BASE_URL = "https://api.binance.com";

function sign(params: Record<string, string>): string {
  const query = new URLSearchParams(params).toString();
  return crypto.createHmac("sha256", API_SECRET).update(query).digest("hex");
}

async function binanceRequest(
  endpoint: string,
  params: Record<string, string> = {}
) {
  const timestamp = String(Date.now());
  const allParams = { ...params, timestamp, recvWindow: "15000" };
  allParams.signature = sign(allParams);

  const url = `${BASE_URL}${endpoint}?${new URLSearchParams(allParams).toString()}`;
  const res = await fetch(url, {
    method: "GET",
    headers: {
      "X-MBX-APIKEY": API_KEY,
      "Content-Type": "application/json",
    },
  });

  if (!res.ok) {
    const body = await res.text();
    return { error: true, status: res.status, body };
  }

  try {
    return { error: false, data: await res.json() };
  } catch {
    return { error: true, status: res.status, body: "Invalid JSON" };
  }
}

// ============================================================
// GET /api/binance?action=account|trades|deposits|withdrawals|ticker|deposit-address
// ============================================================

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const action = searchParams.get("action") || "account";

  try {
    switch (action) {
      // ---------- ACCOUNT ----------
      case "account": {
        const r = await binanceRequest("/api/v3/account");
        if (r.error) return NextResponse.json({ error: true, detail: r.body }, { status: r.status });
        const a = r.data;
        const btc = a.balances?.find((b: { asset: string }) => b.asset === "BTC");
        const usdt = a.balances?.find((b: { asset: string }) => b.asset === "USDT");
        const nonZero = a.balances?.filter(
          (b: { free: string; locked: string }) => parseFloat(b.free) > 0 || parseFloat(b.locked) > 0
        ).length || 0;

        return NextResponse.json({
          error: false,
          canTrade: a.canTrade,
          canDeposit: a.canDeposit,
          canWithdraw: a.canWithdraw,
          btc: {
            free: btc ? parseFloat(btc.free) : 0,
            locked: btc ? parseFloat(btc.locked) : 0,
            total: btc ? parseFloat(btc.free) + parseFloat(btc.locked) : 0,
          },
          usdt: {
            free: usdt ? parseFloat(usdt.free) : 0,
            locked: usdt ? parseFloat(usdt.locked) : 0,
            total: usdt ? parseFloat(usdt.free) + parseFloat(usdt.locked) : 0,
          },
          nonZeroAssets: nonZero,
          fetchedAt: new Date().toISOString(),
        });
      }

      // ---------- TRADES ----------
      case "trades": {
        const symbol = searchParams.get("symbol") || "BTCUSDT";
        const limit = searchParams.get("limit") || "20";
        const r = await binanceRequest("/api/v3/myTrades", { symbol, limit });
        if (r.error) return NextResponse.json({ error: true, detail: r.body }, { status: r.status });
        const trades = r.data.map((t: Record<string, unknown>) => ({
          id: t.id,
          symbol: t.symbol,
          price: parseFloat(t.price as string),
          qty: parseFloat(t.qty as string),
          quoteQty: parseFloat(t.quoteQty as string),
          commission: parseFloat(t.commission as string),
          commissionAsset: t.commissionAsset,
          time: new Date(t.time as number).toISOString(),
          isBuyer: t.isBuyer,
          isMaker: t.isMaker,
        }));
        return NextResponse.json({ error: false, trades });
      }

      // ---------- DEPOSITS ----------
      case "deposits": {
        const coin = searchParams.get("coin") || "BTC";
        const limit = searchParams.get("limit") || "20";
        const r = await binanceRequest("/sapi/v1/capital/deposit/hisrec", { coin, limit });
        if (r.error) return NextResponse.json({ error: true, detail: r.body }, { status: r.status });
        const deposits = (r.data || []).map((d: Record<string, unknown>) => ({
          id: d.id,
          amount: parseFloat(d.amount as string),
          coin: d.coin,
          network: d.network,
          status: d.status,
          address: d.address,
          txId: d.txId,
          insertTime: new Date(d.insertTime as number).toISOString(),
        }));
        return NextResponse.json({ error: false, deposits });
      }

      // ---------- WITHDRAWALS ----------
      case "withdrawals": {
        const coin = searchParams.get("coin") || "BTC";
        const limit = searchParams.get("limit") || "20";
        const r = await binanceRequest("/sapi/v1/capital/withdraw/history", { coin, limit });
        if (r.error) return NextResponse.json({ error: true, detail: r.body }, { status: r.status });
        const withdrawals = (r.data || []).map((w: Record<string, unknown>) => ({
          id: w.id,
          amount: parseFloat(w.amount as string),
          fee: parseFloat(w.transactionFee as string),
          coin: w.coin,
          network: w.network,
          status: w.status,
          address: w.address,
          txId: w.txId,
          applyTime: new Date(w.applyTime as number).toISOString(),
        }));
        return NextResponse.json({ error: false, withdrawals });
      }

      // ---------- TICKER (public) ----------
      case "ticker": {
        const res = await fetch(`${BASE_URL}/api/v3/ticker/price?symbol=BTCUSDT`);
        const data = await res.json();
        return NextResponse.json({
          error: false,
          price: parseFloat(data.price),
          symbol: data.symbol,
        });
      }

      // ---------- DEPOSIT ADDRESS ----------
      case "deposit-address": {
        const coin = searchParams.get("coin") || "BTC";
        const network = searchParams.get("network") || "BTC";
        const r = await binanceRequest("/sapi/v1/capital/deposit/address", { coin, network });
        if (r.error) return NextResponse.json({ error: true, detail: r.body }, { status: r.status });
        return NextResponse.json({
          error: false,
          address: r.data.address,
          tag: r.data.tag,
          coin: r.data.coin,
          network: r.data.network,
        });
      }

      default:
        return NextResponse.json({ error: true, detail: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: true, detail: msg }, { status: 500 });
  }
}