import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";

// DELETE /api/vaults/[id]
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    // Verify vault exists
    const vault = await prisma.vault.findUnique({ where: { id } });
    if (!vault) {
      return NextResponse.json({ success: false, error: "Cofre nao encontrado" }, { status: 404 });
    }

    await prisma.vault.delete({ where: { id } });
    return NextResponse.json({ success: true, message: "Cofre deletado com sucesso" });
  } catch (err: any) {
    console.error("[Vault DELETE]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// PATCH /api/vaults/[id] — Update vault settings
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { name, description, binanceCustodyAddress, autoSendToCustody } = body;

    const vault = await prisma.vault.findUnique({ where: { id } });
    if (!vault) {
      return NextResponse.json({ success: false, error: "Cofre nao encontrado" }, { status: 404 });
    }

    const updateData: any = {};
    if (name !== undefined) updateData.name = name.trim().slice(0, 100);
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (binanceCustodyAddress !== undefined) updateData.binanceCustodyAddress = binanceCustodyAddress || null;
    if (autoSendToCustody !== undefined) updateData.autoSendToCustody = Boolean(autoSendToCustody);

    const updated = await prisma.vault.update({
      where: { id },
      data: updateData,
      include: { addresses: true, transactions: true },
    });

    return NextResponse.json({ success: true, vault: updated });
  } catch (err: any) {
    console.error("[Vault PATCH]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// GET /api/vaults/[id] — Single vault with live balances
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const { fetchAddressBalance, satToBTC } = await import("@/lib/vault-service");

    const vault = await prisma.vault.findUnique({
      where: { id },
      include: {
        addresses: { orderBy: [{ isChange: "asc" }, { derivationIndex: "asc" }] },
        transactions: { orderBy: { createdAt: "desc" }, take: 50 },
      },
    });

    if (!vault) {
      return NextResponse.json({ success: false, error: "Cofre nao encontrado" }, { status: 404 });
    }

    const addrsWithBalances = await Promise.all(
      vault.addresses.map(async (a) => {
        const { balanceSat } = await fetchAddressBalance(a.address);
        await prisma.vaultAddress.update({
          where: { id: a.id },
          data: { balanceSat, fetchedAt: new Date() },
        });
        return { ...a, balanceSat };
      })
    );

    const totalBalance = addrsWithBalances.reduce((sum, a) => sum + a.balanceSat, 0);

    return NextResponse.json({
      success: true,
      vault: {
        ...vault,
        addresses: addrsWithBalances,
        totalBalanceSat: totalBalance,
        totalBalanceBTC: satToBTC(totalBalance),
        custodyTotalBTC: satToBTC(vault.totalSentToCustodySat),
      },
    });
  } catch (err: any) {
    console.error("[Vault GET by ID]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}