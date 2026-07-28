import { NextResponse } from 'next/server';
import { agenticaStats } from '@/lib/live-lab/agentica-ai';

export async function GET() {
  const stats = agenticaStats();
  return NextResponse.json(stats);
}
