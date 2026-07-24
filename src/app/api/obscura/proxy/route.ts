import { NextRequest, NextResponse } from 'next/server';
import { getProxyConfig, addProxy, removeProxy, setProxyStrategy, rotateProxy } from '@/lib/obscura/obscura-engine';

export async function GET() {
  return NextResponse.json(getProxyConfig());
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, url, type, label, index, strategy } = body;
    switch (action) {
      case 'add': {
        if (!url || !type) return NextResponse.json({ error: 'url and type required' }, { status: 400 });
        const proxy = addProxy({ url, type, label });
        return NextResponse.json({ success: true, proxy });
      }
      case 'remove': {
        if (index === undefined) return NextResponse.json({ error: 'index required' }, { status: 400 });
        return NextResponse.json({ success: removeProxy(index) });
      }
      case 'strategy': {
        if (!strategy) return NextResponse.json({ error: 'strategy required' }, { status: 400 });
        setProxyStrategy(strategy);
        return NextResponse.json({ success: true, ...getProxyConfig() });
      }
      case 'rotate': {
        const next = rotateProxy();
        return NextResponse.json({ success: !!next, currentProxy: next });
      }
      default:
        return NextResponse.json({ error: `Unknown action: ${action}` }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}