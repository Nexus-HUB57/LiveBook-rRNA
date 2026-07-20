import { NextRequest, NextResponse } from "next/server";
import { fableDomain, listDomains, getAllAdapters } from "@/lib/fable-method-engine";

/** GET /api/fable/domain — List available domain adapters */
export async function GET() {
  try {
    const domains = listDomains();
    return NextResponse.json({
      success: true,
      domains,
      adapters: getAllAdapters(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

/** POST /api/fable/domain — Get or generate a domain adapter bundle */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sector } = body;

    if (!sector || typeof sector !== "string") {
      return NextResponse.json(
        { error: "Campo 'sector' obrigatorio." },
        { status: 400 },
      );
    }

    const adapter = await fableDomain(sector);

    return NextResponse.json({
      success: true,
      adapter,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error("[Fable Domain] Error:", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}