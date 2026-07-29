import { NextRequest, NextResponse } from 'next/server';
import { agenticaExecuteSkill } from '@/lib/live-lab/agentica-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { skillId, input, personaId } = body;
    if (!skillId || typeof skillId !== 'string') {
      return NextResponse.json({ erro: 'Campo "skillId" e obrigatorio (string)' }, { status: 400 });
    }
    if (!personaId || typeof personaId !== 'string') {
      return NextResponse.json({ erro: 'Campo "personaId" e obrigatorio (string)' }, { status: 400 });
    }
    const result = await agenticaExecuteSkill(skillId, input || {}, personaId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
