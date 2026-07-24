/**
 * POST /api/obscura/snapshot — Get page snapshot (title + text)
 */
import { NextRequest, NextResponse } from 'next/server';
import { obscuraNavigate } from '@/lib/obscura/obscura-engine';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const result = await obscuraNavigate(url, { dump: 'text', waitUntil: 'networkidle0' });
    return NextResponse.json({
      success: result.success,
      url,
      title: result.title,
      text: result.text,
      executionTimeMs: result.executionTimeMs,
      error: result.error,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
