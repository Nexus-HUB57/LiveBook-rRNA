import { NextResponse } from 'next/server';
import { agenticaIogueEssence } from '@/lib/live-lab/agentica-ai';

export async function GET() {
  const essence = agenticaIogueEssence();
  if (!essence) {
    return NextResponse.json({ erro: 'Essencia Iogue nao disponivel' }, { status: 404 });
  }
  return NextResponse.json(essence);
}
