/**
 * ═══════════════════════════════════════════════════════════════
 * CODEGEEX4 FUNCTION CALL PROTOCOL — TypeScript Port
 * ═══════════════════════════════════════════════════════════════
 *
 * Ported from CodeGeeX4 function_call_demo/main.py.
 * CodeGeeX4 supports parallel function calls, where each call is
 * wrapped in ```json``` code blocks. This parser extracts and
 * validates them, with fallback heuristics for edge cases.
 *
 * Original: https://github.com/THUDM/CodeGeeX4/blob/main/function_call_demo/main.py
 */

// ─── Types ───────────────────────────────────────────────

export interface FunctionCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface FunctionCallResult {
  calls: FunctionCall[];
  errors: string[];
  rawText: string;
}

export interface ToolDefinition {
  type: 'function';
  function: {
    name: string;
    description?: string;
    parameters?: {
      type: 'object';
      properties: Record<string, {
        type: string;
        description?: string;
        enum?: string[];
      }>;
      required?: string[];
    };
  };
}

// ─── Parser ───────────────────────────────────────────────

/**
 * Parse CodeGeeX4's function call response format.
 * Supports parallel calls (multiple ```json``` blocks).
 */
export function parseCodeGeeXFunctionCalls(text: string): FunctionCallResult {
  const calls: FunctionCall[] = [];
  const errors: string[] = [];

  // Primary: extract ```json``` blocks (CodeGeeX4's native format)
  const jsonBlockPattern = /```json(.*?)```/gs;
  const matches = text.matchAll(jsonBlockPattern);
  const blocks: string[] = [];

  for (const match of matches) {
    blocks.push(match[1].trim());
  }

  // If no json blocks found, try plain JSON detection
  if (blocks.length === 0) {
    const plainJsonPattern = /\{[^{}]*"name"[^{}]*\}/gs;
    const plainMatches = text.matchAll(plainJsonPattern);
    for (const match of plainMatches) {
      blocks.push(match[0].trim());
    }
  }

  for (const block of blocks) {
    try {
      const parsed = JSON.parse(block) as FunctionCall;
      if (parsed.name && typeof parsed.name === 'string') {
        calls.push({ name: parsed.name, arguments: parsed.arguments || {} });
      }
    } catch {
      // Fallback 1: replace parentheses with brackets (CodeGeeX4 edge case)
      try {
        const fixed = block.replace(/\(/g, '[').replace(/\)/g, ']');
        const parsed = JSON.parse(fixed) as FunctionCall;
        if (parsed.name) {
          calls.push({ name: parsed.name, arguments: parsed.arguments || {} });
          continue;
        }
      } catch {
        // Fallback 2: replace single quotes with double quotes
        try {
          const fixed = block.replace(/'/g, '"');
          const parsed = JSON.parse(fixed) as FunctionCall;
          if (parsed.name) {
            calls.push({ name: parsed.name, arguments: parsed.arguments || {} });
            continue;
          }
        } catch {
          errors.push(`Failed to parse: ${block.slice(0, 100)}`);
        }
      }
    }
  }

  return { calls, errors, rawText: text };
}

// ─── Tool Formatting ──────────────────────────────────────

/**
 * Format tools for CodeGeeX4's function calling.
 * CodeGeeX4 expects tools in `{ function: [...] }` wrapper.
 */
export function formatToolsForCodeGeeX(
  tools: ToolDefinition[],
): Record<string, unknown> {
  return {
    function: tools.map(t => ({
      name: t.function.name,
      description: t.function.description || '',
      parameters: t.function.parameters || { type: 'object', properties: {} },
    })),
  };
}

/**
 * Build messages array for CodeGeeX4 function calling.
 * Tool definitions are injected as a `role: "tool"` message.
 */
export function buildFunctionCallRequest(
  query: string,
  tools: ToolDefinition[],
  systemPrompt?: string,
): Array<{ role: string; content: string | Record<string, unknown> }> {
  const messages: Array<{ role: string; content: string | Record<string, unknown> }> = [];

  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }

  messages.push({
    role: 'tool',
    content: formatToolsForCodeGeeX(tools),
  });

  messages.push({ role: 'user', content: query });

  return messages;
}

// ─── Bridge: CodeGeeX4 → 9router ────────────────────────

/**
 * Convert parsed CodeGeeX4 function calls to OpenAI tool_calls format.
 */
export function codeGeeXToOpenAIToolCalls(
  parsed: FunctionCallResult,
): Array<Record<string, unknown>> {
  return parsed.calls.map((call, index) => ({
    id: `call_cgx4_${index}_${Date.now()}`,
    type: 'function',
    function: {
      name: call.name,
      arguments: JSON.stringify(call.arguments),
    },
  }));
}

/**
 * Validate and normalize CodeGeeX4 response for 9router pipeline.
 */
export function normalizeCodeGeeXResponse(content: string): {
  text: string;
  toolCalls: Array<Record<string, unknown>>;
} {
  const parsed = parseCodeGeeXFunctionCalls(content);

  if (parsed.calls.length > 0) {
    const cleanText = content.replace(/```json[\s\S]*?```/g, '').trim();
    return {
      text: cleanText || `[Issued ${parsed.calls.length} function call(s)]`,
      toolCalls: codeGeeXToOpenAIToolCalls(parsed),
    };
  }

  return { text: content, toolCalls: [] };
}
