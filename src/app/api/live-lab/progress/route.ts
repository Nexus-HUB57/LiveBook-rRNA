import { NextRequest, NextResponse } from 'next/server';
import { agenticaProgress } from '@/lib/live-lab/agentica-ai';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const personaId = searchParams.get('personaId');
  if (!personaId) {
    return NextResponse.json({ erro: 'Query param "personaId" e obrigatorio' }, { status: 400 });
  }
  const result = agenticaProgress(personaId);
  if (!result) {
    return NextResponse.json({ erro: `Persona '${personaId}' nao encontrada` }, { status: 404 });
  }
  return NextResponse.json(result);
}
