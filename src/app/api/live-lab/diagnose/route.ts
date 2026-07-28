import { NextResponse } from 'next/server';
import { agenticaDiagnose } from '@/lib/live-lab/agentica-ai';

export async function GET() {
  const diag = agenticaDiagnose();
  return NextResponse.json(diag);
}
