import { NextRequest, NextResponse } from 'next/server';
import { getNetworkLog, clearNetworkLog } from '@/lib/obscura/obscura-engine';

export async function GET() {
  return NextResponse.json(getNetworkLog());
}

export async function POST(req: NextRequest) {
  try {
    const { action } = await req.json();
    if (action === 'clear') {
      clearNetworkLog();
      return NextResponse.json({ success: true });
    }
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}