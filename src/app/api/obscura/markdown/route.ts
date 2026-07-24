/**
 * POST /api/obscura/markdown — Get page as Markdown
 */
import { NextRequest, NextResponse } from 'next/server';
import { obscuraGetMarkdown } from '@/lib/obscura/obscura-engine';

export async function POST(req: NextRequest) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL required' }, { status: 400 });

    const { markdown, executionTimeMs } = await obscuraGetMarkdown(url);
    return NextResponse.json({ markdown, executionTimeMs });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
