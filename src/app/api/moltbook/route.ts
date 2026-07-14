import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action } = body;

    const moltbookPort = "3002";
    let targetPath = "/";

    if (action === "home") targetPath = "/";
    else if (action === "feed") targetPath = "/feed?sort=hot&limit=10";
    else if (action === "search" && body.query) targetPath = `/search?q=${encodeURIComponent(body.query)}&limit=10`;
    else if (action === "submolts") targetPath = "/submolts";
    else if (action === "status") targetPath = "/agents/status";
    else return NextResponse.json({ error: "Unknown action" }, { status: 400 });

    const url = `http://localhost:${moltbookPort}${targetPath}`;

    const res = await fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        ...(body.apiKey ? { Authorization: `Bearer ${body.apiKey}` } : {}),
      },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `Moltbook service returned ${res.status}`, serviceAvailable: false },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json({ ...data, serviceAvailable: true });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: msg, serviceAvailable: false }, { status: 503 });
  }
}

export async function GET() {
  try {
    const res = await fetch("http://localhost:3002/");
    const data = await res.json();
    return NextResponse.json({ ...data, serviceAvailable: true });
  } catch {
    return NextResponse.json({ serviceAvailable: false, error: "Moltbook service not running" }, { status: 503 });
  }
}