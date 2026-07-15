import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { validateAddress, fetchAddressBalance, satToBTC } from "@/lib/vault-service";

// POST /api/vaults/import-address — Import a watch-only address into a vault
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { vaultId, address, label } = body;

    if (!vaultId || !address) {
      return NextResponse.json({ success: false, error: "vaultId e address obrigatorios" }, { status: 400 });
    }

    if (!validateAddress(address)) {
      return NextResponse.json({ success: false, error: "Endereco Bitcoin invalido" }, { status: 400 });
    }

    const vault = await prisma.vault.findUnique({ where: { id: vaultId } });
    if (!vault) {
      return NextResponse.json({ success: false, error: "Cofre nao encontrado" }, { status: 404 });
    }

    // Check for duplicates
    const existing = await prisma.vaultAddress.findFirst({ where: { vaultId, address } });
    if (existing) {
      return NextResponse.json({ success: false, error: "Endereco ja existe neste cofre" }, { status: 409 });
    }

    const { balanceSat } = await fetchAddressBalance(address);

    const newAddr = await prisma.vaultAddress.create({
      data: {
        vaultId,
        address,
        derivationIndex: -1, // -1 = imported (not derived)
        isChange: false,
        label: label || "Importado",
        balanceSat,
        fetchedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      address: { ...newAddr, balanceSat, balanceBTC: satToBTC(balanceSat) },
      message: "Endereco importado com sucesso",
    });
  } catch (err: any) {
    console.error("[Import Address]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}