import { NextResponse } from 'next/server';

const COLIBRI_BASE = process.env.COLIBRI_URL || 'http://127.0.0.1:8000';

export async function GET() {
  try {
    const res = await fetch(`${COLIBRI_BASE}/experts`, {
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return NextResponse.json(null, { status: res.status });
    const data = await res.json();
    return NextResponse.json(data);
  } catch {
    return NextResponse.json(null, { status: 503 });
  }
}