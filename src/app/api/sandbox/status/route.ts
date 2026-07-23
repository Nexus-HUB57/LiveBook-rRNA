/**
 * GET /api/sandbox/status — Full sandbox health + stats
 * POST /api/sandbox/status — Trigger GC
 */
import { NextRequest, NextResponse } from 'next/server';
import { getSandboxHealth, runGarbageCollection, getAuditLog, getEvolutionEvents, getMemoryEntries } from '@/lib/sandbox/memory-store';
import { getEvolutionStats } from '@/lib/sandbox/evolution-engine';
import { getDedicatedLLMStatus } from '@/lib/sandbox/dedicated-llm';

export async function GET() {
  const health = getSandboxHealth();
  const evolution = getEvolutionStats();
  const llm = getDedicatedLLMStatus();
  const recentAudit = getAuditLog(20);
  const recentEvo = getEvolutionEvents(undefined, 10);
  const memoryCount = getMemoryEntries().length;

  return NextResponse.json({ health, evolution, llm, recentAudit, recentEvo, memoryCount });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const inactivityMs = body.inactivityMs ?? 300_000;
  const result = runGarbageCollection(inactivityMs);
  return NextResponse.json({ ...result, health: getSandboxHealth() });
}
