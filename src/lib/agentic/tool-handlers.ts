/**
 * CHIMERA v4.0 — Real Tool Handlers
 *
 * Wires all 10 native tools defined in tool-registry.ts to actual implementations.
 * Each handler is registered via getToolRegistry().registerHandler().
 *
 * Every handler:
 *   - Returns structured data (never throws at the boundary)
 *   - Wraps errors as { error: string }
 *   - Uses dynamic imports for z-ai-web-dev-sdk (async, server-only)
 */

import { getToolRegistry } from './tool-registry';
import { routeChat } from '@/lib/9router-bridge';
import { db } from '@/lib/db';
import * as fs from 'fs';
import * as path from 'path';
import * as vm from 'vm';

// ─── SDK Helper ────────────────────────────────────────

/** Lazily create a z-ai-web-dev-sdk client. Returns null if unavailable. */
async function getSDKClient() {
  try {
    const ZAI = (await import('z-ai-web-dev-sdk')).default;
    return await ZAI.create();
  } catch {
    return null;
  }
}

const SDK_FALLBACK = {
  error: 'SDK not available',
  message: 'Tool requires z-ai-web-dev-sdk',
};

// ─── 1. web-search ─────────────────────────────────────

const webSearchHandler = async (args: Record<string, unknown>) => {
  try {
    const query = String(args.query || '');
    if (!query) return { error: 'Missing required parameter: query' };

    const client = await getSDKClient();
    if (!client) return SDK_FALLBACK;

    const results = await (client as any).webSearch({
      query,
      maxResults: Number(args.maxResults) || 5,
    });

    return { results, query };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── 2. web-reader ─────────────────────────────────────

const webReaderHandler = async (args: Record<string, unknown>) => {
  try {
    const url = String(args.url || '');
    if (!url) return { error: 'Missing required parameter: url' };

    const client = await getSDKClient();
    if (!client) return SDK_FALLBACK;

    const result = await (client as any).webReader({ url });

    return {
      url,
      title: result?.title || '',
      content: typeof result?.content === 'string'
        ? result.content.slice(0, 5000)
        : JSON.stringify(result?.content ?? '').slice(0, 5000),
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── 3. code-executor ───────────────────────────────────

const codeExecutorHandler = async (args: Record<string, unknown>) => {
  const stdoutChunks: string[] = [];
  const stderrChunks: string[] = [];

  try {
    const code = String(args.code ?? '');
    if (!code) return { error: 'Missing required parameter: code' };

    const timeoutMs = Number(args.timeout) || 30000;

    // Capture console.log / console.error inside sandbox
    const sandbox: Record<string, unknown> = {
      console: {
        log: (...vals: unknown[]) => stdoutChunks.push(vals.map(String).join(' ') + '\n'),
        error: (...vals: unknown[]) => stderrChunks.push(vals.map(String).join(' ') + '\n'),
        warn: (...vals: unknown[]) => stderrChunks.push(vals.map(String).join(' ') + '\n'),
        info: (...vals: unknown[]) => stdoutChunks.push(vals.map(String).join(' ') + '\n'),
      },
      setTimeout,
      clearTimeout,
      JSON,
      Math,
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
      parseInt,
      parseFloat,
      isNaN,
      isFinite,
      encodeURIComponent,
      decodeURIComponent,
      atob,
      btoa,
      RegExp,
      Symbol,
      Buffer,
    };

    const context = vm.createContext(sandbox);
    const script = new vm.Script(code, { filename: 'sandbox.js' });
    const result = script.runInContext(context, { timeout: timeoutMs });

    // If the result is a promise, await it with a timeout
    if (result instanceof Promise) {
      await Promise.race([
        result,
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Promise timed out')), timeoutMs)
        ),
      ]);
    }

    return {
      stdout: stdoutChunks.join(''),
      stderr: stderrChunks.join(''),
      exitCode: 0,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('timed out') || message.includes('TIMEOUT')) {
      return { stdout: stdoutChunks.join(''), stderr: `Timeout: ${message}`, exitCode: 124 };
    }
    return { stdout: stdoutChunks.join(''), stderr: message, exitCode: 1 };
  }
};

// ─── 4. image-generation ────────────────────────────────

const imageGeneratorHandler = async (args: Record<string, unknown>) => {
  try {
    const prompt = String(args.prompt || '');
    if (!prompt) return { error: 'Missing required parameter: prompt' };

    const client = await getSDKClient();
    if (!client) return SDK_FALLBACK;

    const size = String(args.size || '512x512');
    const result = await (client as any).generateImage({ prompt, size });

    return { imageBase64: result, prompt };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── 5. file-reader ─────────────────────────────────────

const MAX_FILE_SIZE = 1024 * 1024; // 1 MB

const fileReaderHandler = async (args: Record<string, unknown>) => {
  try {
    const relativePath = String(args.path || '');
    if (!relativePath) return { error: 'Missing required parameter: path' };

    const resolvedPath = path.resolve('/home/z/my-project', relativePath);

    // Security: ensure resolved path is still within the project
    if (!resolvedPath.startsWith('/home/z/my-project')) {
      return { error: 'Path traversal detected. Only files within the project directory are allowed.' };
    }

    const stat = fs.statSync(resolvedPath);
    if (stat.size > MAX_FILE_SIZE) {
      return { error: `File too large: ${stat.size} bytes. Maximum is ${MAX_FILE_SIZE} bytes (1 MB).` };
    }

    const content = fs.readFileSync(resolvedPath, 'utf-8');

    return {
      path: relativePath,
      content,
      size: stat.size,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── 6. file-writer ─────────────────────────────────────

const fileWriterHandler = async (args: Record<string, unknown>) => {
  try {
    const relativePath = String(args.path || '');
    const content = String(args.content ?? '');

    if (!relativePath) return { error: 'Missing required parameter: path' };

    const resolvedPath = path.resolve('/home/z/my-project', relativePath);

    // Security: ensure resolved path is still within the project
    if (!resolvedPath.startsWith('/home/z/my-project')) {
      return { error: 'Path traversal detected. Only files within the project directory are allowed.' };
    }

    // Create parent directories if they don't exist
    const dir = path.dirname(resolvedPath);
    fs.mkdirSync(dir, { recursive: true });

    fs.writeFileSync(resolvedPath, content, 'utf-8');

    const bytesWritten = Buffer.byteLength(content, 'utf-8');

    return {
      path: relativePath,
      bytesWritten,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── 7. rag-query ───────────────────────────────────────

const ragQueryHandler = async (args: Record<string, unknown>) => {
  try {
    const query = String(args.query || '');
    if (!query) return { error: 'Missing required parameter: query' };

    const topK = Number(args.topK) || 5;
    const agentSlug = args.agentSlug ? String(args.agentSlug) : undefined;

    // Keyword search over KnowledgeEntry via Prisma
    const keywords = query
      .toLowerCase()
      .replace(/[^\u4e00-\u9fff\w\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 1);

    // If no meaningful keywords, return empty
    if (keywords.length === 0) {
      return { query, results: [] };
    }

    // Build Prisma OR conditions for each keyword
    const whereClause: Record<string, unknown> = {
      OR: keywords.flatMap((kw) => [
        { title: { contains: kw } },
        { content: { contains: kw } },
        { source: { contains: kw } },
      ]),
    };

    // Scope to agent if provided
    if (agentSlug) {
      (whereClause as Record<string, unknown>).agent = { slug: agentSlug };
    }

    const entries = await db.knowledgeEntry.findMany({
      where: whereClause as any,
      take: topK * 3,
      select: {
        id: true,
        title: true,
        content: true,
        source: true,
        chunkType: true,
        agent: { select: { name: true, slug: true } },
      },
    });

    // Simple relevance scoring: count keyword matches
    const scored = entries.map((entry: { id: string; title: string; content: string; source: string; chunkType: string; agent: { name: string; slug: string } }) => {
      const text = `${entry.title} ${entry.content} ${entry.source}`.toLowerCase();
      let score = 0;
      for (const kw of keywords) {
        const regex = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        const matches = text.match(regex);
        score += (matches?.length ?? 0);
        // Title match bonus
        if (entry.title.toLowerCase().includes(kw)) score += 2;
      }
      return { ...entry, score };
    });

    // Sort by score descending, take topK
    scored.sort((a: any, b: any) => b.score - a.score);
    const topResults = scored.slice(0, topK);

    const results = topResults.map((r: any) => ({
      id: r.id,
      title: r.title,
      content: r.content.length > 500 ? r.content.slice(0, 500) + '...' : r.content,
      source: r.source,
      chunkType: r.chunkType,
      agent: r.agent.name,
      agentSlug: r.agent.slug,
      score: r.score,
    }));

    return { query, results };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── 8. llm-call ────────────────────────────────────────

const llmCallHandler = async (args: Record<string, unknown>) => {
  try {
    const prompt = String(args.prompt || '');
    if (!prompt) return { error: 'Missing required parameter: prompt' };

    const result = await routeChat({
      messages: [{ role: 'user' as const, content: prompt }],
      model: args.model ? String(args.model) : undefined,
      provider: args.provider ? String(args.provider) : undefined,
      timeoutMs: 30000,
    });

    return {
      response: result.content,
      model: result.model,
      provider: result.provider,
    };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── 9. tts ─────────────────────────────────────────────

const ttsHandler = async (args: Record<string, unknown>) => {
  try {
    const text = String(args.text || '');
    if (!text) return { error: 'Missing required parameter: text' };

    const client = await getSDKClient();
    if (!client) return SDK_FALLBACK;

    const voice = String(args.voice || 'alloy');
    const result = await (client as any).tts({ text, voice });

    return { audioBase64: result, text };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── 10. vlm ────────────────────────────────────────────

const vlmHandler = async (args: Record<string, unknown>) => {
  try {
    const image = String(args.image || '');
    if (!image) return { error: 'Missing required parameter: image' };

    const client = await getSDKClient();
    if (!client) return SDK_FALLBACK;

    const question = String(args.question || 'Describe this image in detail.');
    const result = await (client as any).vlm({ image, question });

    return { analysis: result, question };
  } catch (err) {
    return { error: err instanceof Error ? err.message : String(err) };
  }
};

// ─── Registration ───────────────────────────────────────

/**
 * Register all 10 native tool handlers with the tool registry.
 * Call this once at server startup.
 */
export function registerAllToolHandlers(): void {
  const registry = getToolRegistry();

  registry.registerHandler('web-search', webSearchHandler);
  registry.registerHandler('web-reader', webReaderHandler);
  registry.registerHandler('code-executor', codeExecutorHandler);
  registry.registerHandler('image-generation', imageGeneratorHandler);
  registry.registerHandler('file-reader', fileReaderHandler);
  registry.registerHandler('file-writer', fileWriterHandler);
  registry.registerHandler('rag-query', ragQueryHandler);
  registry.registerHandler('llm-call', llmCallHandler);
  registry.registerHandler('tts', ttsHandler);
  registry.registerHandler('vlm', vlmHandler);
}

export default registerAllToolHandlers;
