/**
 * POST /api/sandbox/execute
 * Execute code in the sandbox with optional agent context.
 */
import { NextRequest, NextResponse } from 'next/server';
import { executeInSandbox, validateCodeSafety } from '@/lib/sandbox/execution-engine';
import type { ExecutionRequest } from '@/lib/sandbox/types';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, language = 'javascript', agentId, timeoutMs, env, context } = body as ExecutionRequest;

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    if (code.length > 100_000) {
      return NextResponse.json({ error: 'Code exceeds 100KB limit' }, { status: 400 });
    }

    // Safety check
    const safety = validateCodeSafety(code);
    if (!safety.safe) {
      return NextResponse.json({
        success: false,
        error: 'Code safety check failed',
        warnings: safety.warnings,
        exitCode: 403,
        executionTimeMs: 0,
        memoryUsedMB: 0,
        sandboxId: '',
        timestamp: new Date().toISOString(),
        logs: safety.warnings,
      });
    }

    const result = await executeInSandbox({ code, language, agentId, timeoutMs, env, context });
    return NextResponse.json(result);
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Internal error',
      exitCode: 500,
      executionTimeMs: 0,
      memoryUsedMB: 0,
      sandboxId: '',
      timestamp: new Date().toISOString(),
      logs: [String(err)],
    }, { status: 500 });
  }
}
