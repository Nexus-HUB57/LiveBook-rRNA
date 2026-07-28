/**
 * POST /api/obscura/links — Extract all links from a page
 */
import { NextRequest, NextResponse } from 'next/server';
import { obscuraExtractLinks } from '@/lib/obscura/obscura-engine';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const { links, executionTimeMs } = await obscuraExtractLinks(url);
    return NextResponse.json({ links, total: links.length, executionTimeMs });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
