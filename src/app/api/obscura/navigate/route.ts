/**
 * POST /api/obscura/navigate — Navigate to URL and return content
 */
import { NextRequest, NextResponse } from 'next/server';
import { obscuraNavigate } from '@/lib/obscura/obscura-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { url, dump, eval: evalExpr, waitUntil, timeout, proxy, stealth } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Validate URL
    try { new URL(url); } catch {
      return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
    }

    const result = await obscuraNavigate(url, { dump, eval: evalExpr, waitUntil, timeout, proxy, stealth });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      success: false, error: String(err), url: '', title: '', text: '', html: '',
      links: [], assets: [], executionTimeMs: 0, timestamp: new Date().toISOString(),
    }, { status: 500 });
  }
}
