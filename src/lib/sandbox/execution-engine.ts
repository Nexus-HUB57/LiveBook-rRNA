/**
 * ═══════════════════════════════════════════════════════════════
 * SANDBOX NATIVO — Execution Engine
 * ═══════════════════════════════════════════════════════════════
 * Isolated code execution using Node.js VM module with
 * resource limits, security restrictions, and audit logging.
 */

import { randomUUID } from 'crypto';
import type { ExecutionRequest, ExecutionResult, AuditEntry } from './types';
import { addAuditEntry } from './memory-store';

// ─── Security: Blocked globals ─────────────────────────
const BLOCKED_GLOBALS = new Set([
  'require', 'module', 'exports', '__dirname', '__filename',
  'process', 'globalThis', 'Buffer', 'setTimeout', 'setInterval',
  'setImmediate', 'clearTimeout', 'clearInterval', 'clearImmediate',
]);

// ─── Safe stdlib to inject ─────────────────────────────
function getSafeContext(env?: Record<string, string>) {
  const safeMath = { ...Math };
  const safeJSON = { ...JSON };
  const safeConsole = {
    log: (...args: unknown[]) => safeArgs(args),
    error: (...args: unknown[]) => safeArgs(args),
    warn: (...args: unknown[]) => safeArgs(args),
    info: (...args: unknown[]) => safeArgs(args),
  };

  return {
    console: safeConsole,
    Math: safeMath,
    JSON: safeJSON,
    Date,
    Array,
    Object,
    String,
    Number,
    Boolean,
    Map,
    Set,
    Promise,
    Error,
    TypeError,
    RangeError,
    SyntaxError,
    RegExp,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    encodeURIComponent,
    decodeURIComponent,
    atob,
    btoa,
    structuredClone,
    crypto: {
      randomUUID: () => randomUUID(),
      getRandomValues: (arr: Uint8Array) => {
        for (let i = 0; i < arr.length; i++) arr[i] = Math.floor(Math.random() * 256);
        return arr;
      },
    },
    env: env ?? {},
    __output__: [] as string[],
    __logs__: [] as string[],
  };
}

function safeArgs(args: unknown[]): string {
  const formatted = args.map(a => {
    if (typeof a === 'object' && a !== null) {
      try { return JSON.stringify(a, null, 2); }
      catch { return String(a); }
    }
    return String(a);
  }).join(' ');
  return formatted;
}

// ─── Main execution function ────────────────────────────
export async function executeInSandbox(req: ExecutionRequest): Promise<ExecutionResult> {
  const sandboxId = randomUUID();
  const startTime = performance.now();
  const logs: string[] = [];
  let memBefore = 0;
  let memAfter = 0;

  try {
    // Memory snapshot before
    memBefore = process.memoryUsage().heapUsed / (1024 * 1024);

    const timeoutMs = req.timeoutMs ?? 5000;
    const maxOutput = req.maxOutputChars ?? (req as ExecutionRequest & { maxOutputChars?: number }).maxOutputChars ?? 50000;

    // Create VM context with safe globals
    const vm = await import('vm');
    const context = vm.createContext(getSafeContext(req.env));

    // Wrap code to capture output
    const wrappedCode = `
      (function(__ctx__) {
        const { console, Math, JSON, Date, Array, Object, String, Number, Boolean,
                Map, Set, Promise, Error, TypeError, RangeError, SyntaxError, RegExp,
                parseInt, parseFloat, isNaN, isFinite, encodeURIComponent,
                decodeURIComponent, atob, btoa, structuredClone, crypto, env,
                __output__, __logs__ } = __ctx__;

        const _origLog = console.log;
        const _origErr = console.error;
        const _origWarn = console.warn;

        console.log = (...a) => { __logs__.push('[log] ' + a.map(String).join(' ')); __output__.push(a.map(String).join(' ')); };
        console.error = (...a) => { __logs__.push('[error] ' + a.map(String).join(' ')); __output__.push(a.map(String).join(' ')); };
        console.warn = (...a) => { __logs__.push('[warn] ' + a.map(String).join(' ')); __output__.push(a.map(String).join(' ')); };

        try {
          const __result__ = (async () => {
            ${req.code}
          })();
          return __result__;
        } catch(__e__) {
          console.error = _origErr;
          console.log = _origLog;
          console.warn = _origWarn;
          throw __e__;
        }
      })
    `;

    const script = new vm.Script(wrappedCode, {
      filename: `sandbox://${sandboxId.slice(0, 8)}.${req.language}`,
      timeout: timeoutMs,
    });

    // Execute with timeout
    const result = await Promise.race([
      script.runInContext(context, { timeout: timeoutMs }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Sandbox timeout: execution exceeded ${timeoutMs}ms`)), timeoutMs + 100)
      ),
    ]);

    // Extract output
    const outputArr = (context as Record<string, unknown>).__output__ as string[];
    const logsArr = (context as Record<string, unknown>).__logs__ as string[];
    const output = (outputArr?.join('\n') ?? '') + (result !== undefined ? '\n' + String(result) : '');
    const truncated = output.length > maxOutput ? output.slice(0, maxOutput) + '\n... [output truncated]' : output;

    memAfter = process.memoryUsage().heapUsed / (1024 * 1024);
    const execTime = Math.round(performance.now() - startTime);

    addAuditEntry({
      action: 'execute',
      agentId: req.agentId,
      resource: sandboxId,
      result: 'success',
      details: `${req.language} | ${execTime}ms | ${outputArr?.length ?? 0} lines`,
    });

    return {
      success: true,
      output: truncated,
      exitCode: 0,
      executionTimeMs: execTime,
      memoryUsedMB: Math.round((memAfter - memBefore) * 100) / 100,
      sandboxId,
      timestamp: new Date().toISOString(),
      logs: logsArr ?? [],
      agentId: req.agentId,
    };
  } catch (err) {
    memAfter = process.memoryUsage().heapUsed / (1024 * 1024);
    const execTime = Math.round(performance.now() - startTime);
    const errorMsg = err instanceof Error ? err.message : String(err);

    addAuditEntry({
      action: 'execute',
      agentId: req.agentId,
      resource: sandboxId,
      result: 'error',
      details: `${req.language} | ${execTime}ms | ${errorMsg}`,
    });

    return {
      success: false,
      output: '',
      error: errorMsg,
      exitCode: 1,
      executionTimeMs: execTime,
      memoryUsedMB: Math.round(Math.max(0, memAfter - memBefore) * 100) / 100,
      sandboxId,
      timestamp: new Date().toISOString(),
      logs: [errorMsg],
      agentId: req.agentId,
    };
  }
}

// ─── Security check: detect dangerous patterns ─────────
export function validateCodeSafety(code: string): { safe: boolean; warnings: string[] } {
  const warnings: string[] = [];
  const patterns = [
    { re: /import\s+['"](?![.])/g, msg: 'External module imports are blocked in sandbox' },
    { re: /require\s*\(/g, msg: 'require() is blocked in sandbox' },
    { re: /process\./g, msg: 'process object access is blocked' },
    { re: /child_process/g, msg: 'child_process access is blocked' },
    { re: /fs[.\[]/g, msg: 'Filesystem access is blocked' },
    { re: /eval\s*\(/g, msg: 'eval() is restricted in sandbox' },
    { re: /Function\s*\(/g, msg: 'Function constructor is blocked' },
    { re: /while\s*\(\s*true\s*\)/g, msg: 'Potential infinite loop detected' },
  ];

  for (const { re, msg } of patterns) {
    if (re.test(code)) warnings.push(msg);
  }

  return { safe: warnings.length === 0, warnings };
}
