import { NextRequest, NextResponse } from 'next/server';
import { agenticaGovernanca } from '@/lib/live-lab/agentica-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { personaId, acao, nivelRequerido } = body;
    if (!personaId || typeof personaId !== 'string') {
      return NextResponse.json({ erro: 'Campo "personaId" e obrigatorio (string)' }, { status: 400 });
    }
    if (!acao || typeof acao !== 'string') {
      return NextResponse.json({ erro: 'Campo "acao" e obrigatorio (string)' }, { status: 400 });
    }
    if (!nivelRequerido || typeof nivelRequerido !== 'string') {
      return NextResponse.json({ erro: 'Campo "nivelRequerido" e obrigatorio (string)' }, { status: 400 });
    }
    const result = agenticaGovernanca(personaId, acao, nivelRequerido);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
