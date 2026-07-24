/**
 * ═══════════════════════════════════════════════════════════════
 * OBSCURA NAVIGATOR — Barrel Export
 * ═══════════════════════════════════════════════════════════════
 */

export type {
  ObscuraConfig, NavigateResult, ScrapeResult, ScrapeBatchResult,
  EvalResult, ObscuraStatus, ObscuraLink, DumpFormat, MCPTool,
} from './types';

export {
  getObscuraConfig, getObscuraStatus, obscuraNavigate,
  obscuraScrape, obscuraEval, obscuraExtractLinks,
  obscuraGetMarkdown, obscuraCDPInfo, getMCPTools,
} from './obscura-engine';
