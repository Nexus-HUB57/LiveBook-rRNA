/**
 * POST /api/obscura/eval — Evaluate JS on a page
 */
import { NextRequest, NextResponse } from 'next/server';
import { obscuraEval } from '@/lib/obscura/obscura-engine';

export async function POST(req: NextRequest) {
  try {
    const { url, expression } = await req.json();
    if (!url || !expression) {
      return NextResponse.json({ error: 'URL and expression required' }, { status: 400 });
    }

    // Validate expression is reasonable
    if (expression.length > 5000) {
      return NextResponse.json({ error: 'Expression too long (max 5000 chars)' }, { status: 400 });
    }

    const result = await obscuraEval(url, expression);
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
