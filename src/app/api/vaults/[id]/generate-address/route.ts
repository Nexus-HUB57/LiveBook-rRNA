import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { deriveAddressFromXpub, fetchAddressBalance } from "@/lib/vault-service";

// POST /api/vaults/[id]/generate-address — Derive next address from xpub
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { isChange = false, label } = body;

    const vault = await prisma.vault.findUnique({
      where: { id },
      include: { addresses: true },
    });

    if (!vault) {
      return NextResponse.json({ success: false, error: "Cofre nao encontrado" }, { status: 404 });
    }
    if (!vault.xpub) {
      return NextResponse.json({ success: false, error: "Cofre nao possui xpub" }, { status: 400 });
    }

    // Find next available index
    const existing = vault.addresses.filter((a) => a.isChange === isChange);
    const nextIndex = existing.length > 0 ? Math.max(...existing.map((a) => a.derivationIndex)) + 1 : 0;

    const address = deriveAddressFromXpub(vault.xpub, nextIndex, isChange);

    // Fetch initial balance
    const { balanceSat } = await fetchAddressBalance(address);

    const newAddr = await prisma.vaultAddress.create({
      data: {
        vaultId: id,
        address,
        derivationIndex: nextIndex,
        isChange,
        label: label || null,
        balanceSat,
        fetchedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      address: { ...newAddr, balanceSat },
      message: "Endereco derivado com sucesso",
    });
  } catch (err: any) {
    console.error("[Generate Address]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}