import { NextRequest, NextResponse } from 'next/server';
import { agenticaExecuteMetaSkill } from '@/lib/live-lab/agentica-ai';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { metaSkillId, input, personaId } = body;
    if (!metaSkillId || typeof metaSkillId !== 'string') {
      return NextResponse.json({ erro: 'Campo "metaSkillId" e obrigatorio (string)' }, { status: 400 });
    }
    if (!personaId || typeof personaId !== 'string') {
      return NextResponse.json({ erro: 'Campo "personaId" e obrigatorio (string)' }, { status: 400 });
    }
    const result = await agenticaExecuteMetaSkill(metaSkillId, input || {}, personaId);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json({ erro: String(e) }, { status: 500 });
  }
}
