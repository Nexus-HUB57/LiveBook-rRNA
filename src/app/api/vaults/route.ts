import { NextRequest, NextResponse } from "next/server";
import { db as prisma } from "@/lib/db";
import { generateWallet, encryptMnemonic, deriveAddressFromXpub, fetchAddressBalance, satToBTC } from "@/lib/vault-service";

// POST /api/vaults — Create a new vault with HD wallet
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, description, mnemonic, derivationPath } = body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Nome do cofre obrigatorio" }, { status: 400 });
    }
    if (name.length > 100) {
      return NextResponse.json({ success: false, error: "Nome maximo 100 caracteres" }, { status: 400 });
    }

    const path = derivationPath || "m/44'/0'/0'";
    const wallet = generateWallet(mnemonic, path);

    // Encrypt the mnemonic
    const encryptedSeed = encryptMnemonic(wallet.mnemonic);

    // Generate first 5 receiving addresses
    const addresses = [];
    for (let i = 0; i < 5; i++) {
      const addr = deriveAddressFromXpub(wallet.xpub, i, false);
      addresses.push({
        address: addr,
        derivationIndex: i,
        isChange: false,
      });
    }

    // Create vault with addresses in transaction
    const vault = await prisma.vault.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        encrypted: true,
        masterSeedEncrypted: encryptedSeed,
        xpub: wallet.xpub,
        derivationPath: path,
        addresses: {
          create: addresses,
        },
      },
      include: { addresses: true, transactions: true },
    });

    // Fetch initial balances
    const addrsWithBalances = await Promise.all(
      vault.addresses.map(async (a) => {
        const { balanceSat } = await fetchAddressBalance(a.address);
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
      },
      message: "Cofre criado com sucesso. Seed criptografada com AES-256-GCM.",
    });
  } catch (err: any) {
    console.error("[Vaults POST]", err);
    return NextResponse.json({ success: false, error: err.message || "Erro ao criar cofre" }, { status: 500 });
  }
}

// GET /api/vaults — List all vaults
export async function GET() {
  try {
    const vaults = await prisma.vault.findMany({
      include: {
        addresses: { orderBy: { derivationIndex: "asc" } },
        transactions: { orderBy: { createdAt: "desc" }, take: 20 },
      },
      orderBy: { createdAt: "desc" },
    });

    // Enrich with live balances
    const enriched = await Promise.all(
      vaults.map(async (v) => {
        const addrsWithBalances = await Promise.all(
          v.addresses.map(async (a) => {
            const { balanceSat } = await fetchAddressBalance(a.address);
            // Update stored balance
            await prisma.vaultAddress.update({
              where: { id: a.id },
              data: { balanceSat, fetchedAt: new Date() },
            });
            return { ...a, balanceSat };
          })
        );
        const totalBalance = addrsWithBalances.reduce((sum, a) => sum + a.balanceSat, 0);
        const custodyTotal = v.totalSentToCustodySat;

        return {
          ...v,
          addresses: addrsWithBalances,
          totalBalanceSat: totalBalance,
          totalBalanceBTC: satToBTC(totalBalance),
          custodyTotalBTC: satToBTC(custodyTotal),
          addressCount: v.addresses.length,
          allEncrypted: v.encrypted && !!v.masterSeedEncrypted,
        };
      })
    );

    const totals = enriched.reduce(
      (acc, v) => ({
        balanceSat: acc.balanceSat + v.totalBalanceSat,
        custodySat: acc.custodySat + v.totalSentToCustodySat,
        vaultCount: acc.vaultCount + 1,
        addressCount: acc.addressCount + v.addressCount,
        txCount: acc.txCount + v.transactions.length,
      }),
      { balanceSat: 0, custodySat: 0, vaultCount: 0, addressCount: 0, txCount: 0 }
    );

    return NextResponse.json({
      success: true,
      vaults: enriched,
      totals: {
        ...totals,
        balanceBTC: satToBTC(totals.balanceSat),
        custodyBTC: satToBTC(totals.custodySat),
        allEncrypted: enriched.every((v) => v.allEncrypted),
      },
    });
  } catch (err: any) {
    console.error("[Vaults GET]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}