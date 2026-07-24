/**
 * GET /api/sandbox/status — Full sandbox health + stats
 * POST /api/sandbox/status — Trigger GC
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSandboxHealth, runGarbageCollection, getAuditLog, getEvolutionEvents, getMemoryEntries } from '@/lib/sandbox/memory-store';
import { getEvolutionStats } from '@/lib/sandbox/evolution-engine';
import { getDedicatedLLMStatus } from '@/lib/sandbox/dedicated-llm';

export async function GET() {
  try {
    const health = getSandboxHealth();
    const evolution = getEvolutionStats();
    const llm = getDedicatedLLMStatus();
    const recentAudit = getAuditLog(20);
    const recentEvo = getEvolutionEvents(undefined, 10);
    const memoryCount = getMemoryEntries().length;

    return NextResponse.json({ health, evolution, llm, recentAudit, recentEvo, memoryCount });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Sandbox Status] Error:', msg);
    return NextResponse.json({ error: msg, health: null }, { status: 503 });
  }
}

export async function POST(req: NextRequest) {
  try {
    let body: Record<string, unknown> = {};
    try { body = await req.json(); } catch {}
    const inactivityMs = (body.inactivityMs as number) ?? 300_000;
    const result = runGarbageCollection(inactivityMs);
    return NextResponse.json({ ...result, health: getSandboxHealth() });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
