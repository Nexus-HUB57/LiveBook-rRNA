import { NextResponse } from 'next/server';
import { getFullHealth } from '@/lib/obscura/obscura-engine';

export async function GET() {
  try {
    return NextResponse.json(await getFullHealth());
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}