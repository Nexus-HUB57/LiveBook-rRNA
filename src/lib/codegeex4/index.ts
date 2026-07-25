/**
 * ═══════════════════════════════════════════════════════════════
 * CODEGEEX4 INTEGRATION MODULE — Public API
 * ═══════════════════════════════════════════════════════════════
 *
 * Unified barrel export for all CodeGeeX4 integrations into CHIMERA.
 * Each sub-module is independently usable.
 *
 * Architecture:
 *   - function-call-protocol.ts  → Tool calling parser (CodeGeeX4 → OpenAI)
 *   - citation-formatter.ts     → RAG [[citation:N]] attribution
 *   - system-prompts.ts          → 9 code-specialized agent personas
 *   - repo-tasks.ts              → Repository-level edit/qa formatting
 */

// Function calling
export {
  parseCodeGeeXFunctionCalls,
  formatToolsForCodeGeeX,
  buildFunctionCallRequest,
  codeGeeXToOpenAIToolCalls,
  normalizeCodeGeeXResponse,
  type FunctionCall,
  type FunctionCallResult,
  type ToolDefinition,
} from './function-call-protocol';

// Citation formatting
export {
  CITATION_SYSTEM_PROMPT,
  formatCitationContext,
  buildCitationPrompt,
  parseCitations,
  createCitationAwareGenerator,
  formatCitations,
  type CitationSource,
  type FormattedCitations,
} from './citation-formatter';

// System prompts
export {
  getCodeGeeXPrompt,
  listCodeGeeXModes,
  buildCodeGeeXChatRequest,
  type CodeGeeXAgentMode,
} from './system-prompts';
