import { NextRequest, NextResponse } from 'next/server';
import { getTrackerStats, setTrackerBlocking, resetTrackerSession } from '@/lib/obscura/obscura-engine';

export async function GET() {
  return NextResponse.json(getTrackerStats());
}

export async function POST(req: NextRequest) {
  try {
    const { action, enabled } = await req.json();
    if (action === 'toggle') {
      setTrackerBlocking(enabled ?? true);
      return NextResponse.json({ success: true, ...getTrackerStats() });
    }
    if (action === 'reset-session') {
      resetTrackerSession();
      return NextResponse.json({ success: true, ...getTrackerStats() });
    }
    return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}