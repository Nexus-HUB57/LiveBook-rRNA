/**
 * ═══════════════════════════════════════════════════════════════
 * CODEGEEX4 CITATION FORMAT — Proven RAG attribution pattern
 * ═══════════════════════════════════════════════════════════════
 *
 * Ported from CodeGeeX4's web_demo and langchain_demo.
 * Uses [[citation:N]] format for source attribution in RAG responses.
 * This is the same pattern proven at scale by ZhipuAI/THUDM.
 *
 * Original pattern (Python):
 *   citations = "\n\n".join(
 *     [f"[[citation:{i+1}]]\n```markdown\n{item['snippet']}\n```"
 *      for i, item in enumerate(search_res)]
 *   )
 */

// ─── Types ───────────────────────────────────────────────

export interface CitationSource {
  id: string;
  title: string;
  content: string;
  url?: string;
  score?: number;
  agent?: string;
}

export interface FormattedCitations {
  /** The citation block to inject into the LLM prompt */
  contextBlock: string;
  /** System prompt instruction for citation usage */
  citationSystemPrompt: string;
  /** Total number of citations */
  count: number;
}

// ─── System Prompt ───────────────────────────────────────

/**
 * Citation-aware RAG system prompt.
 * Instructs the LLM to use [[citation:N]] references.
 *
 * Ported from CodeGeeX4's web_demo/backend/utils/chat.py SYS_PROMPT.
 * Enhanced for multilingual support and code contexts.
 */
export const CITATION_SYSTEM_PROMPT = `You will receive a user question along with relevant context snippets. Each context is prefixed with a citation reference like [[citation:N]], where N is a number. If applicable, use the context and cite it at the end of each sentence.

Rules:
- Your answer must be correct, accurate, and written in an expert, unbiased, professional tone.
- Keep your answer under 2000 characters. Do not provide irrelevant information or repeat.
- Cite context using the format [[citation:N]]. If a sentence draws from multiple sources, list all applicable citations, e.g. [[citation:3]][[citation:5]].
- If all contexts are irrelevant, answer from your own knowledge without citation numbers.
- Match the user's language. For code and specific names/citations, use the original language.
- When writing code, always cite the source if the approach comes from a specific reference.`;

// ─── Formatters ──────────────────────────────────────────

/**
 * Format retrieved sources into CodeGeeX4's citation block format.
 * Produces the `[引用]` block that gets injected into the prompt.
 *
 * @example
 * ```ts
 * const formatted = formatCitationContext(sources);
 * // => "[[citation:1]]\n```markdown\nsource content\n```\n\n[[citation:2]]..."
 * ```
 */
export function formatCitationContext(sources: CitationSource[]): string {
  return sources
    .map((source, i) => {
      const citation = `[[citation:${i + 1}]]`;
      const content = source.content.length > 800
        ? source.content.slice(0, 800) + '...'
        : source.content;
      return `${citation}\n\```markdown\n${content}\n\````;
    })
    .join('\n\n');
}

/**
 * Build a complete citation-formatted RAG prompt.
 * Combines citation context with the user query.
 *
 * Ported from CodeGeeX4's build_model_input() in web_demo.
 */
export function buildCitationPrompt(query: string, sources: CitationSource[]): string {
  const citations = formatCitationContext(sources);
  return `[References]\n${citations}\n\nQuestion: ${query}\n`;
}

/**
 * Parse citations from an LLM response.
 * Extracts all [[citation:N]] references and returns unique citation numbers.
 */
export function parseCitations(response: string): number[] {
  const pattern = /\[\[citation:(\d+)\]\]/g;
  const citations = new Set<number>();
  let match;
  while ((match = pattern.exec(response)) !== null) {
    citations.add(parseInt(match[1], 10));
  }
  return Array.from(citations).sort((a, b) => a - b);
}

/**
 * Enhance the RAG engine's LLM generator with citation formatting.
 * Wraps the existing generator to inject citation context.
 */
export function createCitationAwareGenerator(
  baseGenerator: (context: string, query: string) => Promise<string>,
): (context: string, query: string, sources: CitationSource[]) => Promise<{ answer: string; citations: number[] }> {
  return async (context: string, query: string, sources: CitationSource[]) => {
    const citationContext = buildCitationPrompt(query, sources);
    const fullContext = `${citationContext}\n\n${context}`;
    const answer = await baseGenerator(fullContext, query);
    const citations = parseCitations(answer);
    return { answer, citations };
  };
}

/**
 * Get the full formatted citation package for RAG pipeline integration.
 */
export function formatCitations(sources: CitationSource[]): FormattedCitations {
  return {
    contextBlock: formatCitationContext(sources),
    citationSystemPrompt: CITATION_SYSTEM_PROMPT,
    count: sources.length,
  };
}
