/**
 * POST /api/obscura/scrape — Batch scrape multiple URLs
 */
import { NextRequest, NextResponse } from 'next/server';
import { obscuraScrape } from '@/lib/obscura/obscura-engine';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { urls, eval: evalExpr, format, concurrency, proxy } = body;

    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return NextResponse.json({ error: 'URLs array is required' }, { status: 400 });
    }

    if (urls.length > 100) {
      return NextResponse.json({ error: 'Max 100 URLs per request' }, { status: 400 });
    }

    const result = await obscuraScrape(urls, { eval: evalExpr, format, concurrency, proxy });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
