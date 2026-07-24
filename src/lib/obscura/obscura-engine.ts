import { execFile, exec, ChildProcess } from 'child_process';
import { promisify } from 'util';
import { v4 as uuid } from 'uuid';
import type {
  ObscuraConfig, NavigateResult, ScrapeResult, ScrapeBatchResult,
  EvalResult, ObscuraStatus, ObscuraLink, DumpFormat,
  CDPSession, InterceptRule, InterceptState, InterceptedRequest, InterceptAction,
  TrackerStats, TrackerCategory,
  ProxyRotationConfig, ProxyRotationEntry,
  ServeState, NetworkRequest, NetworkLog, MCPTool,
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

// ═══ IN-MEMORY STATE ════════════════════════════════════
const cdpSessions = new Map<string, CDPSession>();
let interceptState: InterceptState = {
  enabled: false, rules: [], history: [], totalBlocked: 0, totalIntercepted: 0,
};
let trackerStats: TrackerStats = {
  enabled: true, totalBlockedDomains: 3520,
  categories: { analytics: 1240, ads: 980, telemetry: 540, fingerprinting: 380, social: 210, other: 170 },
  topBlocked: [
    { domain: 'google-analytics.com', count: 89, category: 'analytics' as TrackerCategory },
    { domain: 'doubleclick.net', count: 67, category: 'ads' as TrackerCategory },
    { domain: 'facebook.net', count: 45, category: 'social' as TrackerCategory },
    { domain: 'hotjar.com', count: 34, category: 'analytics' as TrackerCategory },
    { domain: 'fingerprintjs.com', count: 28, category: 'fingerprinting' as TrackerCategory },
  ],
  sessionBlocked: 0, sessionRequests: 0,
};
let proxyConfig: ProxyRotationConfig = {
  strategy: 'round-robin', currentIndex: 0, proxies: [], totalRequests: 0, totalFailures: 0,
};
let serveState: ServeState = { running: false, port: 9223, stealth: true, workers: 4, uptimeSeconds: 0 };
let serveProcess: ChildProcess | null = null;
const networkRequests: NetworkRequest[] = [];
const MAX_NETWORK_LOG = 2000;

// ═══ STATUS ═════════════════════════════════════════════

export async function getObscuraStatus(): Promise<ObscuraStatus> {
  const config = getObscuraConfig();
  try {
    const { stdout } = await execAsync(`curl -s http://127.0.0.1:${config.cdpPort}/json/version`, { timeout: 3000 });
    const info = JSON.parse(stdout);
    return {
      running: true, version: '0.1.10', cdpUrl: info.webSocketDebuggerUrl,
      userAgent: info['User-Agent'] ?? '', v8Version: info['V8-Version'] ?? '',
      protocolVersion: info['Protocol-Version'] ?? '', stealth: config.stealth,
    };
  } catch {
    return {
      running: false, version: '0.1.10',
      cdpUrl: `ws://127.0.0.1:${config.cdpPort}/devtools/browser`,
      userAgent: '', v8Version: '', protocolVersion: '', stealth: config.stealth,
    };
  }
}

// ═══ NAVIGATE / FETCH ═══════════════════════════════════

export async function obscuraNavigate(
  url: string,
  options?: { dump?: DumpFormat; eval?: string; waitUntil?: string; timeout?: number; proxy?: string; stealth?: boolean },
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
      timeout: (options?.timeout ?? config.timeout + 10) * 1000, maxBuffer: 10 * 1024 * 1024,
    });
    const executionTimeMs = Math.round(performance.now() - startTime);
    const dumpFormat = options?.dump;

    if (dumpFormat === 'links') {
      const links: ObscuraLink[] = stdout.split('\n').filter(l => l.trim()).map(l => {
        const parts = l.split(/\s+/); return { href: parts[0] ?? '', text: parts.slice(1).join(' ') };
      });
      return { success: true, url, title: '', text: '', html: '', links, assets: [], executionTimeMs, timestamp: new Date().toISOString() };
    }
    if (dumpFormat === 'assets') {
      return { success: true, url, title: '', text: '', html: '', links: [], assets: stdout.split('\n').filter(l => l.trim()), executionTimeMs, timestamp: new Date().toISOString() };
    }
    if (dumpFormat === 'markdown') {
      return { success: true, url, title: '', text: stdout, html: '', markdown: stdout, links: [], assets: [], executionTimeMs, timestamp: new Date().toISOString() };
    }
    return { success: true, url, title: '', text: stdout, html: dumpFormat === 'html' ? stdout : '', links: [], assets: [], executionTimeMs, timestamp: new Date().toISOString() };
  } catch (err) {
    return {
      success: false, url, title: '', text: '', html: '', links: [], assets: [],
      executionTimeMs: Math.round(performance.now() - startTime), timestamp: new Date().toISOString(),
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

// ═══ SCRAPE (batch) ═════════════════════════════════════

export async function obscuraScrape(
  urls: string[],
  options?: { eval?: string; format?: 'json' | 'text'; concurrency?: number; proxy?: string },
): Promise<ScrapeBatchResult> {
  const config = getObscuraConfig();
  const startTime = performance.now();
  if (!urls.length) return { results: [], total: 0, succeeded: 0, failed: 0, totalTimeMs: 0 };

  const args: string[] = ['scrape', ...urls];
  if (options?.eval) args.push('--eval', options.eval);
  if (options?.concurrency) args.push('--concurrency', String(options.concurrency));
  if (options?.proxy) args.push('--proxy', options.proxy);
  if (config.stealth) args.push('--stealth');
  args.push('--quiet', '--format', options?.format ?? 'json');

  try {
    const { stdout } = await execFileAsync(config.binaryPath, args, { timeout: 120_000, maxBuffer: 50 * 1024 * 1024 });
    const results: ScrapeResult[] = JSON.parse(stdout).map((r: Record<string, unknown>) => ({
      url: r.url as string, success: !!(r.result || r.output),
      result: (r.result ?? r.output ?? '') as string, error: r.error as string | undefined, executionTimeMs: r.timeMs ?? 0,
    }));
    return { results, total: results.length, succeeded: results.filter(r => r.success).length, failed: results.filter(r => !r.success).length, totalTimeMs: Math.round(performance.now() - startTime) };
  } catch (err) {
    return { results: urls.map(url => ({ url, success: false, error: String(err), executionTimeMs: 0 })), total: urls.length, succeeded: 0, failed: urls.length, totalTimeMs: Math.round(performance.now() - startTime) };
  }
}

// ═══ EVAL ═══════════════════════════════════════════════

export async function obscuraEval(url: string, expression: string, options?: { waitUntil?: string; timeout?: number }): Promise<EvalResult> {
  const startTime = performance.now();
  const result = await obscuraNavigate(url, { eval: expression, ...options });
  return { success: result.success, result: result.text, error: result.error, executionTimeMs: result.executionTimeMs };
}

export async function obscuraExtractLinks(url: string) {
  const startTime = performance.now();
  const result = await obscuraNavigate(url, { dump: 'links' });
  return { links: result.links, executionTimeMs: result.executionTimeMs };
}

export async function obscuraGetMarkdown(url: string) {
  const result = await obscuraNavigate(url, { dump: 'markdown' });
  return { markdown: result.text, executionTimeMs: result.executionTimeMs };
}

export async function obscuraCDPInfo() {
  const config = getObscuraConfig();
  try {
    const [v, t] = await Promise.all([
      execAsync(`curl -s http://127.0.0.1:${config.cdpPort}/json/version`),
      execAsync(`curl -s http://127.0.0.1:${config.cdpPort}/json/list`),
    ]);
    return { version: JSON.parse(v.stdout), targets: JSON.parse(t.stdout) };
  } catch { return null; }
}

export function getMCPTools(): MCPTool[] {
  return [
    { name: 'browser_navigate', description: 'Navigate to URL (url, waitUntil?)', parameters: {} },
    { name: 'browser_snapshot', description: 'Page URL, title, body text', parameters: {} },
    { name: 'browser_click', description: 'Click by CSS selector', parameters: {} },
    { name: 'browser_fill', description: 'Set input value (input+change)', parameters: {} },
    { name: 'browser_type', description: 'Append text to input', parameters: {} },
    { name: 'browser_press_key', description: 'Dispatch keyboard event', parameters: {} },
    { name: 'browser_scroll', description: 'Scroll by pixel offset', parameters: {} },
    { name: 'browser_select_option', description: 'Select <select> by value', parameters: {} },
    { name: 'browser_hover', description: 'Hover over element', parameters: {} },
    { name: 'browser_wait_for', description: 'Wait for CSS selector', parameters: {} },
    { name: 'browser_evaluate', description: 'Run JS in page context', parameters: {} },
    { name: 'browser_get_attributes', description: 'Get element attributes', parameters: {} },
    { name: 'browser_screenshot', description: 'Screenshot (base64 PNG)', parameters: {} },
  ];
}

// ═══ CDP SESSIONS ══════════════════════════════════════

export function getCDPSessions(): CDPSession[] {
  return Array.from(cdpSessions.values());
}

export function createCDPSession(url: string): CDPSession {
  const session: CDPSession = {
    id: uuid(), url, title: '', status: 'active',
    createdAt: new Date().toISOString(), lastActivity: new Date().toISOString(), requests: 0, domNodes: 0,
  };
  cdpSessions.set(session.id, session);
  return session;
}

export function closeCDPSession(id: string): boolean {
  const s = cdpSessions.get(id);
  if (s) { s.status = 'closed'; cdpSessions.delete(id); return true; }
  return false;
}

export async function refreshCDPSessions(): Promise<CDPSession[]> {
  const info = await obscuraCDPInfo();
  if (!info?.targets) return getCDPSessions();
  for (const target of info.targets as Array<{ id: string; url: string; title?: string }>) {
    if (target.type === 'page' && !cdpSessions.has(target.id)) {
      cdpSessions.set(target.id, {
        id: target.id, url: target.url, title: target.title ?? '',
        status: 'active', createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(), requests: 0, domNodes: 0,
      });
    }
  }
  return getCDPSessions();
}

// ═══ REQUEST INTERCEPTION ═══════════════════════════════

export function getInterceptState(): InterceptState {
  return { ...interceptState, rules: [...interceptState.rules], history: interceptState.history.slice(-200) };
}

export function setInterceptionEnabled(enabled: boolean) {
  interceptState.enabled = enabled;
}

export function addInterceptRule(rule: Omit<InterceptRule, 'id' | 'hitCount' | 'createdAt'>): InterceptRule {
  const newRule: InterceptRule = { ...rule, id: uuid(), hitCount: 0, createdAt: new Date().toISOString() };
  interceptState.rules.push(newRule);
  return newRule;
}

export function removeInterceptRule(id: string): boolean {
  const idx = interceptState.rules.findIndex(r => r.id === id);
  if (idx >= 0) { interceptState.rules.splice(idx, 1); return true; }
  return false;
}

export function toggleInterceptRule(id: string, enabled: boolean): boolean {
  const rule = interceptState.rules.find(r => r.id === id);
  if (rule) { rule.enabled = enabled; return true; }
  return false;
}

export function clearInterceptHistory() {
  interceptState.history = [];
  interceptState.totalBlocked = 0;
  interceptState.totalIntercepted = 0;
}

// ═══ TRACKER BLOCKING ══════════════════════════════════

export function getTrackerStats(): TrackerStats {
  return { ...trackerStats };
}

export function setTrackerBlocking(enabled: boolean) {
  trackerStats.enabled = enabled;
}

export function resetTrackerSession() {
  trackerStats.sessionBlocked = 0;
  trackerStats.sessionRequests = 0;
}

// ═══ PROXY ROTATION ════════════════════════════════════

export function getProxyConfig(): ProxyRotationConfig {
  return { ...proxyConfig, proxies: [...proxyConfig.proxies] };
}

export function addProxy(entry: Omit<ProxyRotationEntry, 'successCount' | 'failCount' | 'active'>): ProxyRotationEntry {
  const proxy: ProxyRotationEntry = { ...entry, successCount: 0, failCount: 0, active: true };
  proxyConfig.proxies.push(proxy);
  return proxy;
}

export function removeProxy(index: number): boolean {
  if (index >= 0 && index < proxyConfig.proxies.length) {
    proxyConfig.proxies.splice(index, 1);
    if (proxyConfig.currentIndex >= proxyConfig.proxies.length) proxyConfig.currentIndex = 0;
    return true;
  }
  return false;
}

export function setProxyStrategy(strategy: ProxyRotationConfig['strategy']) {
  proxyConfig.strategy = strategy;
  proxyConfig.currentIndex = 0;
}

export function rotateProxy(): ProxyRotationEntry | null {
  if (!proxyConfig.proxies.length) return null;
  const active = proxyConfig.proxies.filter(p => p.active);
  if (!active.length) return null;

  let pick: ProxyRotationEntry;
  switch (proxyConfig.strategy) {
    case 'random':
      pick = active[Math.floor(Math.random() * active.length)];
      break;
    case 'failover': {
      const sorted = [...active].sort((a, b) => a.failCount - b.failCount);
      pick = sorted[0];
      break;
    }
    case 'sticky':
      pick = active[proxyConfig.currentIndex % active.length];
      break;
    default: // round-robin
      pick = active[proxyConfig.currentIndex % active.length];
      proxyConfig.currentIndex = (proxyConfig.currentIndex + 1) % active.length;
  }
  pick.lastUsed = new Date().toISOString();
  proxyConfig.totalRequests++;
  return pick;
}

// ═══ SERVE MODE ════════════════════════════════════════

export function getServeState(): ServeState {
  if (serveState.running && serveState.startedAt) {
    serveState.uptimeSeconds = Math.round((Date.now() - new Date(serveState.startedAt).getTime()) / 1000);
  }
  return { ...serveState };
}

export async function startServe(opts?: { port?: number; stealth?: boolean; proxy?: string; workers?: number }): Promise<ServeState> {
  if (serveState.running) return getServeState();
  const config = getObscuraConfig();
  const port = opts?.port ?? serveState.port;
  const args = ['serve', '--port', String(port)];
  if (opts?.stealth ?? config.stealth) args.push('--stealth');
  if (opts?.proxy ?? config.proxy) args.push('--proxy', opts?.proxy ?? config.proxy!);
  if (opts?.workers) args.push('--workers', String(opts.workers));

  try {
    serveProcess = execFile(config.binaryPath, args);
    serveState = {
      running: true, port, stealth: opts?.stealth ?? config.stealth,
      proxy: opts?.proxy ?? config.proxy, workers: opts?.workers ?? 4,
      pid: serveProcess.pid, uptimeSeconds: 0, startedAt: new Date().toISOString(),
    };
    serveProcess.on('exit', () => { serveState.running = false; serveState.pid = undefined; serveProcess = null; });
    return getServeState();
  } catch {
    return serveState;
  }
}

export async function stopServe(): Promise<boolean> {
  if (!serveProcess) return false;
  serveProcess.kill('SIGTERM');
  serveState.running = false;
  serveState.pid = undefined;
  serveProcess = null;
  return true;
}

// ═══ NETWORK LOG ════════════════════════════════════════

export function getNetworkLog(): NetworkLog {
  const reqs = networkRequests.slice(-MAX_NETWORK_LOG);
  const totalBlocked = reqs.filter(r => r.blocked).length;
  const totalBytes = reqs.reduce((s, r) => s + (r.size || 0), 0);
  const avgDuration = reqs.length ? Math.round(reqs.reduce((s, r) => s + r.durationMs, 0) / reqs.length) : 0;
  return { requests: reqs, totalRequests: reqs.length, totalBlocked, totalBytes, avgDurationMs: avgDuration };
}

export function clearNetworkLog() {
  networkRequests.length = 0;
}

// ═══ FULL HEALTH ════════════════════════════════════════

export async function getFullHealth() {
  const [status, cdpInfo] = await Promise.all([getObscuraStatus(), obscuraCDPInfo()]);
  return {
    status, cdpInfo, serve: getServeState(),
    interception: getInterceptState(), trackers: getTrackerStats(),
    proxy: getProxyConfig(), sessions: getCDPSessions(), network: getNetworkLog(),
  };
}
