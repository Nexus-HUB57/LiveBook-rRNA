/**
 * OBSCURA NAVIGATOR — Type Definitions (Expanded)
 * Covers all features from h4ckf0r0day/obscura: CDP, MCP, Stealth, Interception, Proxy, Serve
 */

export interface ObscuraConfig {
  binaryPath: string;
  cdpPort: number;
  stealth: boolean;
  proxy?: string;
  timeout: number;
  waitUntil: 'load' | 'domcontentloaded' | 'networkidle0';
}

export interface NavigateResult {
  success: boolean;
  url: string;
  title: string;
  text: string;
  html: string;
  markdown?: string;
  links: ObscuraLink[];
  assets: string[];
  executionTimeMs: number;
  timestamp: string;
  error?: string;
}

export interface ObscuraLink { href: string; text: string; }

export interface ScrapeResult {
  url: string; success: boolean; result?: string; error?: string; executionTimeMs: number;
}

export interface ScrapeBatchResult {
  results: ScrapeResult[]; total: number; succeeded: number; failed: number; totalTimeMs: number;
}

export interface EvalResult {
  success: boolean; result?: string; error?: string; executionTimeMs: number;
}

export interface ObscuraStatus {
  running: boolean; version: string; cdpUrl: string; userAgent: string;
  v8Version: string; protocolVersion: string; stealth: boolean; pid?: number;
}

export interface MCPTool {
  name: string; description: string; parameters: Record<string, unknown>;
}

export type DumpFormat = 'html' | 'text' | 'links' | 'markdown' | 'assets' | 'original';

// ─── CDP Session Management ─────────────────────────────
export interface CDPSession {
  id: string;
  url: string;
  title: string;
  status: 'active' | 'navigating' | 'idle' | 'closed';
  createdAt: string;
  lastActivity: string;
  requests: number;
  domNodes: number;
}

// ─── Request Interception ────────────────────────────────
export type InterceptAction = 'block' | 'continue' | 'fulfill' | 'redirect';

export interface InterceptRule {
  id: string;
  name: string;
  pattern: string;
  resourceTypes?: string[];
  action: InterceptAction;
  fulfillBody?: string;
  fulfillStatus?: number;
  redirectUrl?: string;
  enabled: boolean;
  hitCount: number;
  createdAt: string;
}

export interface InterceptedRequest {
  id: string;
  url: string;
  method: string;
  resourceType: string;
  ruleId?: string;
  ruleName?: string;
  action: InterceptAction;
  timestamp: string;
  size?: number;
  blocked: boolean;
}

export interface InterceptState {
  enabled: boolean;
  rules: InterceptRule[];
  history: InterceptedRequest[];
  totalBlocked: number;
  totalIntercepted: number;
}

// ─── Tracker Blocking ────────────────────────────────────
export type TrackerCategory = 'analytics' | 'ads' | 'telemetry' | 'fingerprinting' | 'social' | 'other';

export interface TrackerStats {
  enabled: boolean;
  totalBlockedDomains: number;
  categories: Record<TrackerCategory, number>;
  topBlocked: Array<{ domain: string; count: number; category: TrackerCategory }>;
  sessionBlocked: number;
  sessionRequests: number;
}

// ─── Proxy Rotation ──────────────────────────────────────
export interface ProxyRotationEntry {
  url: string;
  type: 'http' | 'https' | 'socks5';
  label?: string;
  successCount: number;
  failCount: number;
  lastUsed?: string;
  active: boolean;
}

export interface ProxyRotationConfig {
  strategy: 'round-robin' | 'random' | 'failover' | 'sticky';
  currentIndex: number;
  proxies: ProxyRotationEntry[];
  totalRequests: number;
  totalFailures: number;
}

// ─── Serve Mode (CDP Server) ─────────────────────────────
export interface ServeState {
  running: boolean;
  port: number;
  stealth: boolean;
  proxy?: string;
  workers: number;
  pid?: number;
  uptimeSeconds: number;
  startedAt?: string;
}

// ─── Network Log ─────────────────────────────────────────
export interface NetworkRequest {
  id: string;
  url: string;
  method: string;
  status: number;
  resourceType: string;
  size: number;
  durationMs: number;
  timestamp: string;
  blocked: boolean;
  blockedBy?: string;
}

export interface NetworkLog {
  requests: NetworkRequest[];
  totalRequests: number;
  totalBlocked: number;
  totalBytes: number;
  avgDurationMs: number;
}
