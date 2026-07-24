/**
 * ═══════════════════════════════════════════════════════════════
 * OBSCURA NAVIGATOR — Type Definitions
 * ═══════════════════════════════════════════════════════════════
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

export interface ObscuraLink {
  href: string;
  text: string;
}

export interface ScrapeResult {
  url: string;
  success: boolean;
  result?: string;
  error?: string;
  executionTimeMs: number;
}

export interface ScrapeBatchResult {
  results: ScrapeResult[];
  total: number;
  succeeded: number;
  failed: number;
  totalTimeMs: number;
}

export interface EvalResult {
  success: boolean;
  result?: string;
  error?: string;
  executionTimeMs: number;
}

export interface ObscuraStatus {
  running: boolean;
  version: string;
  cdpUrl: string;
  userAgent: string;
  v8Version: string;
  protocolVersion: string;
  stealth: boolean;
  pid?: number;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export type DumpFormat = 'html' | 'text' | 'links' | 'markdown' | 'assets' | 'original';
