/**
 * ═══════════════════════════════════════════════════════════════
 * OBSCURA NAVIGATOR — Engine (CLI + CDP Wrapper)
 * ═══════════════════════════════════════════════════════════════
 * Wraps the Obscura headless browser binary for use within
 * the CHIMERA ecosystem. Supports fetch, scrape, eval, CDP.
 */

import { execFile, exec } from 'child_process';
import { promisify } from 'util';
import type {
  ObscuraConfig, NavigateResult, ScrapeResult, ScrapeBatchResult,
  EvalResult, ObscuraStatus, ObscuraLink, DumpFormat,
} from './types';

const execFileAsync = promisify(execFile);
const execAsync = promisify(exec);

// ─── Config ─────────────────────────────────────────────
const DEFAULT_CONFIG: ObscuraConfig = {
  binaryPath: process.env.OBSCURA_BINARY ?? '/home/z/my-project/bin/obscura/obscura',
  cdpPort: parseInt(process.env.OBSCURA_PORT ?? '9223'),
  stealth: true,
  timeout: 30,
  waitUntil: 'load',
};

export function getObscuraConfig(): ObscuraConfig {
  return { ...DEFAULT_CONFIG };
}

// ═══ STATUS ═════════════════════════════════════════════

export async function getObscuraStatus(): Promise<ObscuraStatus> {
  const config = getObscuraConfig();
  try {
    const { stdout } = await execAsync(`curl -s http://127.0.0.1:${config.cdpPort}/json/version`, {
      timeout: 3000,
    });
    const info = JSON.parse(stdout);
    return {
      running: true,
      version: '0.1.10',
      cdpUrl: info.webSocketDebuggerUrl,
      userAgent: info['User-Agent'],
      v8Version: info['V8-Version'],
      protocolVersion: info['Protocol-Version'],
      stealth: config.stealth,
    };
  } catch {
    return {
      running: false,
      version: '0.1.10',
      cdpUrl: `ws://127.0.0.1:${config.cdpPort}/devtools/browser`,
      userAgent: '',
      v8Version: '',
      protocolVersion: '',
      stealth: config.stealth,
    };
  }
}

// ═══ NAVIGATE / FETCH ═══════════════════════════════════

export async function obscuraNavigate(
  url: string,
  options?: {
    dump?: DumpFormat;
    eval?: string;
    waitUntil?: string;
    timeout?: number;
    proxy?: string;
    stealth?: boolean;
    output?: string;
  },
): Promise<NavigateResult> {
  const config = getObscuraConfig();
  const startTime = performance.now();

  const args: string[] = ['fetch', url];

  if (options?.dump) args.push('--dump', options.dump);
  if (options?.eval) args.push('--eval', options.eval);
  if (options?.waitUntil) args.push('--wait-until', options.waitUntil);
  if (options?.timeout) args.push('--timeout', String(options.timeout));
  if (options?.proxy) args.push('--proxy', options.proxy);
  if (options?.stealth ?? config.stealth) args.push('--stealth');
  args.push('--quiet');

  try {
    const { stdout } = await execFileAsync(config.binaryPath, args, {
      timeout: (options?.timeout ?? config.timeout + 10) * 1000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const executionTimeMs = Math.round(performance.now() - startTime);

    // If dump format was specified, return accordingly
    const dumpFormat = options?.dump;

    if (dumpFormat === 'links') {
      const links: ObscuraLink[] = stdout
        .split('\n')
        .filter(l => l.trim())
        .map(l => {
          const parts = l.split(/\s+/);
          return { href: parts[0] ?? '', text: parts.slice(1).join(' ') };
        });
      return {
        success: true, url, title: '', text: '', html: '',
        links, assets: [], executionTimeMs,
        timestamp: new Date().toISOString(),
      };
    }

    if (dumpFormat === 'assets') {
      const assets = stdout.split('\n').filter(l => l.trim());
      return {
        success: true, url, title: '', text: '', html: '',
        links: [], assets, executionTimeMs,
        timestamp: new Date().toISOString(),
      };
    }

    if (dumpFormat === 'markdown') {
      return {
        success: true, url, title: '', text: stdout, html: '', markdown: stdout,
        links: [], assets: [], executionTimeMs,
        timestamp: new Date().toISOString(),
      };
    }

    // Default: text output or eval result
    return {
      success: true, url, title: '', text: stdout, html: dumpFormat === 'html' ? stdout : '',
      links: [], assets: [], executionTimeMs,
      timestamp: new Date().toISOString(),
    };
  } catch (err) {
    return {
      success: false, url, title: '', text: '', html: '',
      links: [], assets: [], executionTimeMs: Math.round(performance.now() - startTime),
      timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ═══ SCRAPE (batch) ═════════════════════════════════════

export async function obscuraScrape(
  urls: string[],
  options?: {
    eval?: string;
    format?: 'json' | 'text';
    concurrency?: number;
    proxy?: string;
    quiet?: boolean;
  },
): Promise<ScrapeBatchResult> {
  const config = getObscuraConfig();
  const startTime = performance.now();

  if (urls.length === 0) {
    return { results: [], total: 0, succeeded: 0, failed: 0, totalTimeMs: 0 };
  }

  const args: string[] = ['scrape', ...urls];

  if (options?.eval) args.push('--eval', options.eval);
  if (options?.format) args.push('--format', options.format);
  if (options?.concurrency) args.push('--concurrency', String(options.concurrency));
  if (options?.proxy) args.push('--proxy', options.proxy);
  if (config.stealth) args.push('--stealth');
  args.push('--quiet');
  args.push('--format', options?.format ?? 'json');

  try {
    const { stdout } = await execFileAsync(config.binaryPath, args, {
      timeout: 120_000,
      maxBuffer: 50 * 1024 * 1024,
    });

    const results: ScrapeResult[] = JSON.parse(stdout).map((r: Record<string, unknown>) => ({
      url: r.url as string,
      success: !!(r.result || r.output),
      result: (r.result ?? r.output ?? '') as string,
      error: r.error as string | undefined,
      executionTimeMs: r.timeMs ?? 0,
    }));

    return {
      results,
      total: results.length,
      succeeded: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      totalTimeMs: Math.round(performance.now() - startTime),
    };
  } catch (err) {
    return {
      results: urls.map(url => ({
        url, success: false, error: String(err), executionTimeMs: 0,
      })),
      total: urls.length, succeeded: 0, failed: urls.length,
      totalTimeMs: Math.round(performance.now() - startTime),
    };
  }
}

// ═══ EVAL ═══════════════════════════════════════════════

export async function obscuraEval(
  url: string,
  expression: string,
  options?: { waitUntil?: string; timeout?: number; stealth?: boolean },
): Promise<EvalResult> {
  const startTime = performance.now();
  const result = await obscuraNavigate(url, {
    eval: expression,
    ...options,
  });

  return {
    success: result.success,
    result: result.text,
    error: result.error,
    executionTimeMs: result.executionTimeMs,
  };
}

// ═══ EXTRACT LINKS ══════════════════════════════════════

export async function obscuraExtractLinks(url: string): Promise<{ links: ObscuraLink[]; executionTimeMs: number }> {
  const startTime = performance.now();
  const result = await obscuraNavigate(url, { dump: 'links' });
  return { links: result.links, executionTimeMs: result.executionTimeMs };
}

// ═══ GET MARKDOWN ══════════════════════════════════════

export async function obscuraGetMarkdown(url: string): Promise<{ markdown: string; executionTimeMs: number }> {
  const result = await obscuraNavigate(url, { dump: 'markdown' });
  return { markdown: result.text, executionTimeMs: result.executionTimeMs };
}

// ═══ CDP INFO ══════════════════════════════════════════

export async function obscuraCDPInfo() {
  const config = getObscuraConfig();
  try {
    const { stdout: versionInfo } = await execAsync(`curl -s http://127.0.0.1:${config.cdpPort}/json/version`);
    const { stdout: targets } = await execAsync(`curl -s http://127.0.0.1:${config.cdpPort}/json/list`);
    return {
      version: JSON.parse(versionInfo),
      targets: JSON.parse(targets),
    };
  } catch {
    return null;
  }
}

// ═══ MCP TOOLS (static list) ══════════════════════════

export function getMCPTools() {
  return [
    { name: 'browser_navigate', description: 'Navigate to a URL (url, optional waitUntil: load/domcontentloaded/networkidle0)' },
    { name: 'browser_snapshot', description: 'Return current page URL, title, and body text' },
    { name: 'browser_click', description: 'Click an element by CSS selector' },
    { name: 'browser_fill', description: 'Set an input value (triggers input + change events)' },
    { name: 'browser_type', description: 'Append text to an input' },
    { name: 'browser_press_key', description: 'Press a keyboard key (Enter, Tab, Escape, etc.)' },
    { name: 'browser_scroll', description: 'Scroll the page by a pixel offset' },
    { name: 'browser_select_option', description: 'Select an option in a <select> by value' },
    { name: 'browser_hover', description: 'Hover over an element by CSS selector' },
    { name: 'browser_wait_for', description: 'Wait for a CSS selector to appear' },
    { name: 'browser_evaluate', description: 'Run JavaScript in the page context' },
    { name: 'browser_get_attributes', description: 'Get all attributes of an element' },
    { name: 'browser_screenshot', description: 'Take a screenshot (returns base64 PNG)' },
  ];
}
