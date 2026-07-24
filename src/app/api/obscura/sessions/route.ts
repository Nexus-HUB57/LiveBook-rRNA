import { NextRequest, NextResponse } from 'next/server';
import { getCDPSessions, createCDPSession, closeCDPSession, refreshCDPSessions } from '@/lib/obscura/obscura-engine';

export async function GET() {
  const sessions = getCDPSessions();
  return NextResponse.json({ sessions, total: sessions.length });
}

export async function POST(req: NextRequest) {
  try {
    const { action, url, sessionId } = await req.json();
    switch (action) {
      case 'create': {
        const session = createCDPSession(url);
        return NextResponse.json({ success: true, session });
      }
      case 'close': {
        if (!sessionId) return NextResponse.json({ error: 'sessionId required' }, { status: 400 });
        return NextResponse.json({ success: closeCDPSession(sessionId) });
      }
      case 'refresh': {
        const sessions = await refreshCDPSessions();
        return NextResponse.json({ success: true, sessions, total: sessions.length });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}