import { NextRequest, NextResponse } from 'next/server';
import { agenticaRoute } from '@/lib/live-lab/agentica-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { intent } = body;
    if (!intent || typeof intent !== 'string') {
      return NextResponse.json({ erro: 'Campo "intent" e obrigatorio (string)' }, { status: 400 });
    }
    const result = agenticaRoute(intent);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
