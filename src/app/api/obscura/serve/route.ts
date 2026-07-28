import { NextRequest, NextResponse } from 'next/server';
import { getServeState, startServe, stopServe } from '@/lib/obscura/obscura-engine';

export async function GET() {
  return NextResponse.json(getServeState());
}

export async function POST(req: NextRequest) {
  try {
    const { action, port, stealth, proxy, workers } = await req.json();
    if (action === 'stop') {
      await stopServe();
      return NextResponse.json({ success: true, serve: getServeState() });
    }
    const state = await startServe({ port, stealth, proxy, workers });
    return NextResponse.json({ success: true, serve: state });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}