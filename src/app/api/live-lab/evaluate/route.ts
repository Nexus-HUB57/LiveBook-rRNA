import { NextRequest, NextResponse } from 'next/server';
import { agenticaEvaluateModulo } from '@/lib/live-lab/agentica-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { moduloId } = body;
    if (!moduloId || typeof moduloId !== 'string') {
      return NextResponse.json({ erro: 'Campo "moduloId" e obrigatorio (string)' }, { status: 400 });
    }
    const result = await agenticaEvaluateModulo(moduloId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
