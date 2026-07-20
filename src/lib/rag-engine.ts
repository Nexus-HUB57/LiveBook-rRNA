/**
 * RAG rRNA Engine — Langchain-style Retrieval Augmented Generation
 * 
 * Inspired by biological ribosomal RNA (rRNA) which reads mRNA templates
 * to synthesize proteins, this engine reads knowledge entries and synthesizes
 * intelligent responses through a multi-stage pipeline:
 * 
 * 1. EXTRACT  — Recursive text chunking (Langchain-style)
 * 2. ENCODE   — TF-IDF vectorization + n-gram expansion
 * 3. RETRIEVE — BM25-style scoring with field boosting
 * 4. RERANK   — Cross-encoder style re-ranking by relevance
 * 5. AUGMENT  — Context window assembly with source attribution
 * 6. GENERATE — LLM synthesis with RAG prompt template
 */

// ═══════════════════════════════════════════════════════════════════
// 1. RECURSIVE TEXT CHUNKER (Langchain-style)
// ═══════════════════════════════════════════════════════════════════

export interface Chunk {
  id: string;
  text: string;
  metadata: {
    source: string;
    agentName?: string;
    agentSlug?: string;
    chunkType: string;
    chunkIndex: number;
    totalChunks: number;
  };
}

const DEFAULT_SEPARATORS = [
  '\n\n',    // paragraph breaks
  '\n',      // line breaks
  '. ',      // sentence endings
  '; ',      // clause endings
  ', ',      // comma breaks
  ' ',       // word breaks
];

/**
 * RecursiveCharacterTextSplitter — splits text hierarchically
 * like Langchain's RecursiveCharacterTextSplitter
 */
export function recursiveChunk(
  text: string,
  chunkSize: number = 500,
  chunkOverlap: number = 50,
  separators: string[] = DEFAULT_SEPARATORS,
): string[] {
  if (!text || text.length <= chunkSize) return [text];

  for (const sep of separators) {
    if (!text.includes(sep)) continue;

    const splits = text.split(sep);
    const chunks: string[] = [];
    let current = '';

    for (const split of splits) {
      const candidate = current ? current + sep + split : split;

      if (candidate.length > chunkSize && current.length > 0) {
        chunks.push(current.trim());
        // Overlap: take last N chars of previous chunk
        const overlapText = current.length > chunkOverlap
          ? current.slice(-chunkOverlap)
          : current;
        current = overlapText + sep + split;
      } else {
        current = candidate;
      }
    }

    if (current.trim()) {
      chunks.push(current.trim());
    }

    // Check if any chunk still exceeds limit — recurse with next separator
    const allFit = chunks.every(c => c.length <= chunkSize * 1.2);
    if (allFit && chunks.length > 1) return chunks;

    // Flatten: try next separator level
    return splits.flatMap(s =>
      recursiveChunk(s.trim(), chunkSize, chunkOverlap, separators.slice(separators.indexOf(sep) + 1))
    ).filter(c => c.length > 10);
  }

  // Final fallback: hard split by character count
  const chunks: string[] = [];
  for (let i = 0; i < text.length; i += chunkSize) {
    chunks.push(text.slice(i, i + chunkSize).trim());
  }
  return chunks.filter(c => c.length > 10);
}

// ═══════════════════════════════════════════════════════════════════
// 2. TF-IDF ENCODER
// ═══════════════════════════════════════════════════════════════════

function tokenize(text: string): string[] {
  return text.toLowerCase()
    .replace(/[^\w\s\u4e00-\u9fff\u00c0-\u024f]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function generateNgrams(tokens: string[], n: number = 2): string[] {
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join('_'));
  }
  return ngrams;
}

/**
 * Compute TF (Term Frequency) for a document
 */
function computeTF(tokens: string[]): Map<string, number> {
  const tf = new Map<string, number>();
  const total = tokens.length || 1;
  for (const t of tokens) {
    tf.set(t, (tf.get(t) || 0) + 1);
  }
  // Normalize
  for (const [k, v] of tf) {
    tf.set(k, v / total);
  }
  return tf;
}

/**
 * Compute IDF (Inverse Document Frequency) across a corpus
 */
function computeIDF(documents: string[][]): Map<string, number> {
  const N = documents.length || 1;
  const df = new Map<string, number>();
  for (const doc of documents) {
    const unique = new Set(doc);
    for (const term of unique) {
      df.set(term, (df.get(term) || 0) + 1);
    }
  }
  const idf = new Map<string, number>();
  for (const [term, freq] of df) {
    idf.set(term, Math.log((N + 1) / (freq + 1)) + 1); // smoothed IDF
  }
  return idf;
}

// ═══════════════════════════════════════════════════════════════════
// 3. BM25-STYLE RETRIEVER
// ═══════════════════════════════════════════════════════════════════

interface RetrievalDocument {
  id: string;
  title: string;
  content: string;
  source: string;
  agentName?: string;
  agentSlug?: string;
  chunkType: string;
  // Pre-computed fields for scoring
  titleTokens: string[];
  contentTokens: string[];
  sourceTokens: string[];
}

const BM25_K1 = 1.5;  // term frequency saturation
const BM25_B = 0.75;   // length normalization

/**
 * BM25 scoring function — industry standard for information retrieval
 * Similar to what Langchain's BM25Retriever uses under the hood
 */
function bm25Score(
  queryTokens: string[],
  docTokens: string[],
  docTF: Map<string, number>,
  idf: Map<string, number>,
  avgDL: number,
): number {
  const docLen = docTokens.length || 1;
  let score = 0;

  for (const qt of queryTokens) {
    const termIDF = idf.get(qt) || 0;
    const termTF = docTF.get(qt) || 0;
    const numerator = termTF * (BM25_K1 + 1);
    const denominator = termTF + BM25_K1 * (1 - BM25_B + BM25_B * (docLen / avgDL));
    score += termIDF * (numerator / denominator);
  }

  return score;
}

// ═══════════════════════════════════════════════════════════════════
// 4. CROSS-ENCODER RERANKER (simplified)
// ═══════════════════════════════════════════════════════════════════

/**
 * Simplified cross-encoder re-ranking
 * In production, this would use a transformer model.
 * Here we use heuristics: exact phrase matching, positional bonus,
 * semantic proximity via token overlap ratios.
 */
function rerank(
  query: string,
  queryTokens: string[],
  queryNgrams: string[],
  results: Array<RetrievalDocument & { bm25Score: number }>,
): Array<RetrievalDocument & { bm25Score: number; rerankScore: number }> {
  return results.map(doc => {
    let rerankBonus = 0;

    // Bonus 1: Exact phrase match in title (high signal)
    if (doc.title.toLowerCase().includes(query.toLowerCase())) {
      rerankBonus += 15;
    }

    // Bonus 2: Query n-gram matches in content
    const contentNgrams = generateNgrams(doc.contentTokens, 2);
    const ngramOverlap = queryNgrams.filter(qn => contentNgrams.includes(qn)).length;
    rerankBonus += ngramOverlap * 3;

    // Bonus 3: Early position match (concepts at start of document)
    const first100 = doc.content.slice(0, 200).toLowerCase();
    const earlyMatches = queryTokens.filter(qt => first100.includes(qt)).length;
    rerankBonus += earlyMatches * 2;

    // Bonus 4: Chunk type relevance
    if (query.toLowerCase().includes('flow') && doc.chunkType === 'flow') rerankBonus += 5;
    if (query.toLowerCase().includes('api') && doc.chunkType === 'api') rerankBonus += 5;
    if (query.toLowerCase().includes('config') && doc.chunkType === 'config') rerankBonus += 3;

    // Bonus 5: Diversity penalty — prefer different sources
    // (applied at selection time, not here)

    return {
      ...doc,
      rerankScore: doc.bm25Score + rerankBonus,
    };
  });
}

// ═══════════════════════════════════════════════════════════════════
// 5. CONTEXT ASSEMBLER
// ═══════════════════════════════════════════════════════════════════

interface AssembledContext {
  formattedContext: string;
  sources: Array<{
    id: string;
    title: string;
    source: string;
    agent: string;
    agentSlug?: string;
    score: number;
    chunkType: string;
  }>;
  totalChars: number;
}

const MAX_CONTEXT_CHARS = 4000; // LLM context window budget

function assembleContext(
  results: Array<RetrievalDocument & { rerankScore: number }>,
  maxChars: number = MAX_CONTEXT_CHARS,
): AssembledContext {
  const sources: AssembledContext['sources'] = [];
  const parts: string[] = [];
  let usedChars = 0;

  for (const doc of results) {
    const snippet = doc.content.length > 400
      ? doc.content.slice(0, 400) + '...'
      : doc.content;

    const entry = `[${sources.length + 1}] ${doc.title} (${doc.agentName || 'Unknown'})\n${snippet}`;
    
    if (usedChars + entry.length > maxChars) break;

    parts.push(entry);
    sources.push({
      id: doc.id,
      title: doc.title,
      source: doc.source,
      agent: doc.agentName || 'Unknown',
      agentSlug: doc.agentSlug,
      score: Math.round(doc.rerankScore * 10) / 10,
      chunkType: doc.chunkType,
    });
    usedChars += entry.length;
  }

  return {
    formattedContext: parts.join('\n\n---\n\n'),
    sources,
    totalChars: usedChars,
  };
}

// ═══════════════════════════════════════════════════════════════════
// 6. RAG PIPELINE ORCHESTRATOR
// ═══════════════════════════════════════════════════════════════════

export interface RAGQueryResult {
  query: string;
  answer: string;
  retrieved: Array<{
    id: string;
    title: string;
    source: string;
    agent: string;
    agentSlug?: string;
    score: number;
    chunkType?: string;
  }>;
  contextLength: number;
  pipeline: {
    documentsScanned: number;
    retrieved: number;
    reranked: number;
    contextChars: number;
  };
}

export type LLMGenerator = (context: string, query: string) => Promise<string>;

/**
 * Main RAG pipeline — the rRNA-inspired orchestrator
 * 
 * Biological analogy:
 * - DNA → Knowledge base (stored entries)
 * - mRNA → Query (transcribed intent)
 * - tRNA → Retrieval (matching codons)
 * - Ribosome (rRNA) → This engine (assembly & synthesis)
 * - Protein → Generated answer
 */
export async function ragPipeline(
  query: string,
  documents: Array<{
    id: string;
    title: string;
    content: string;
    source: string;
    agentName?: string;
    agentSlug?: string;
    chunkType: string;
  }>,
  options: {
    topK?: number;
    maxContextChars?: number;
    llmGenerator?: LLMGenerator;
    agentName?: string;
  } = {},
): Promise<RAGQueryResult> {
  const {
    topK = 5,
    maxContextChars = MAX_CONTEXT_CHARS,
    llmGenerator,
    agentName,
  } = options;

  // ─── STAGE 1: PREPARE DOCUMENTS ───
  const preparedDocs: RetrievalDocument[] = documents.map(doc => ({
    ...doc,
    titleTokens: tokenize(doc.title),
    contentTokens: tokenize(doc.content),
    sourceTokens: tokenize(doc.source),
  }));

  // ─── STAGE 2: COMPUTE TF-IDF ───
  const queryTokens = tokenize(query);
  const queryNgrams = generateNgrams(queryTokens, 2);

  const allDocTokens = preparedDocs.map(d => [...d.titleTokens, ...d.contentTokens]);
  const idf = computeIDF(allDocTokens);
  const avgDL = allDocTokens.reduce((s, t) => s + t.length, 0) / (allDocTokens.length || 1);

  // ─── STAGE 3: BM25 RETRIEVAL ───
  // Pre-compute TF per field (content, title, source) — each needs its own TF map
  const contentTFs = preparedDocs.map(d => computeTF(d.contentTokens));
  const titleTFs = preparedDocs.map(d => computeTF(d.titleTokens));
  const sourceTFs = preparedDocs.map(d => computeTF(d.sourceTokens));

  const scored = preparedDocs
    .map((doc, idx) => ({
      ...doc,
      bm25Score: bm25Score(queryTokens, doc.contentTokens, contentTFs[idx], idf, avgDL)
        + bm25Score(queryTokens, doc.titleTokens, titleTFs[idx], idf, avgDL) * 2  // title boost
        + bm25Score(queryTokens, doc.sourceTokens, sourceTFs[idx], idf, avgDL) * 0.5, // source mild boost
    }))
    .filter(d => d.bm25Score > 0)
    .sort((a, b) => b.bm25Score - a.bm25Score)
    .slice(0, topK * 3); // over-retrieve for reranking

  // ─── STAGE 4: CROSS-ENCODER RERANKING ───
  const reranked = rerank(query, queryTokens, queryNgrams, scored)
    .sort((a, b) => b.rerankScore - a.rerankScore)
    .slice(0, topK);

  // ─── STAGE 5: CONTEXT ASSEMBLY ───
  const assembled = assembleContext(reranked, maxContextChars);

  // ─── STAGE 6: GENERATION ───
  let answer: string;

  if (assembled.formattedContext) {
    if (llmGenerator) {
      try {
        answer = await llmGenerator(assembled.formattedContext, query);
      } catch (err) {
        console.error('[rRNA Pipeline] LLM generation error:', err);
        answer = generateOfflineAnswer(query, assembled.sources);
      }
    } else {
      answer = generateOfflineAnswer(query, assembled.sources);
    }
  } else {
    answer = 'Nenhum resultado encontrado na base de conhecimento. Tente perguntar sobre: orquestracao, Bitcoin, OODA, JARVIS, RAG, voice, karma, sentience, wallet, dashboard, tri-nuclear, Zettascale, GenesisFlow, Antrophexus, Sabio Heroi, Obsidian.';
  }

  return {
    query,
    answer,
    retrieved: assembled.sources,
    contextLength: assembled.totalChars,
    pipeline: {
      documentsScanned: documents.length,
      retrieved: scored.length,
      reranked: reranked.length,
      contextChars: assembled.totalChars,
    },
  };
}

function generateOfflineAnswer(
  query: string,
  results: Array<{ title: string; agent: string; score: number }>,
): string {
  if (results.length === 0) return 'Sem resultados relevantes.';

  const sections = results.slice(0, 3).map((r, i) => {
    return `**[${i + 1}] ${r.agent}** — ${r.title} (score: ${r.score})`;
  }).join('\n');

  return `## Resultados RAG rRNA (Modo Offline)\n\n${sections}\n\n_Fonte: Base de conhecimento com entrada dos 5 agentes Nexus. Ative LLM (ZAI_API_BASE_URL + ZAI_API_KEY) para respostas sintetizadas._`;
}