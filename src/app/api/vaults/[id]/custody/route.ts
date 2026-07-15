import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { validateAddress, fetchAddressBalance, satToBTC } from "@/lib/vault-service";

// POST /api/vaults/[id]/custody — Record a custody send to Binance
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { amountSat, txHash, note } = body;

    if (!amountSat || amountSat <= 0) {
      return NextResponse.json({ success: false, error: "Valor invalido" }, { status: 400 });
    }

    const vault = await prisma.vault.findUnique({
      where: { id },
      include: { addresses: true },
    });

    if (!vault) {
      return NextResponse.json({ success: false, error: "Cofre nao encontrado" }, { status: 404 });
    }

    if (!vault.binanceCustodyAddress) {
      return NextResponse.json({
        success: false,
        error: "Endereco de custodia Binance nao configurado. Defina nas configuracoes do cofre.",
      }, { status: 400 });
    }

    if (!validateAddress(vault.binanceCustodyAddress)) {
      return NextResponse.json({ success: false, error: "Endereco de custodia invalido" }, { status: 400 });
    }

    // Find source address (first funded)
    const fundedAddr = vault.addresses.find((a) => a.balanceSat >= amountSat);
    const fromAddr = fundedAddr?.address || vault.addresses[0]?.address || "unknown";

    // Record the custody transaction
    const tx = await prisma.vaultTransaction.create({
      data: {
        vaultId: id,
        txHash: txHash || null,
        type: "custody",
        amountSat,
        fromAddress: fromAddr,
        toAddress: vault.binanceCustodyAddress,
        status: txHash ? "confirmed" : "pending",
        confirmedAt: txHash ? new Date() : null,
        note: note || "Envio para custodia Binance — Nucleos de Processamento, GPUs Descentralizados, rRNA Agentic AI",
      },
    });

    // Update vault totals
    await prisma.vault.update({
      where: { id },
      data: {
        totalSentToCustodySat: { increment: amountSat },
      },
    });

    return NextResponse.json({
      success: true,
      transaction: tx,
      custodyAddress: vault.binanceCustodyAddress,
      amountBTC: satToBTC(amountSat),
      totalCustodyBTC: satToBTC(vault.totalSentToCustodySat + amountSat),
      message: "Transferencia para custodia registrada. Fundos destinados a: Nucleos de Processamento, GPUs Nativos Descentralizados e Nucleos rRNA Agentic AI.",
    });
  } catch (err: any) {
    console.error("[Custody Send]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}