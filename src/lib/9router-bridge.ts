/**
 * ═══════════════════════════════════════════════════════════════
 * 9ROUTER BRIDGE — CHIMERA Integration Layer
 * ═══════════════════════════════════════════════════════════════
 *
 * Typed TypeScript bridge that routes chat requests through 100+ AI
 * providers using 9router's hub-and-spoke translation architecture.
 *
 * Architecture:
 *   CHIMERA API routes → 9routerBridge.routeChat() → detect format
 *     → translate to provider format → execute → translate response back
 *
 * Fallback chains: if primary provider fails, automatically tries
 * the next provider in the chain.
 */

import { resolveProvider, type ProviderInfo, type ProviderFormat, listProviders, getProviderModels, providerCount, providerCategories } from './9router-engine/provider-registry';
import { detectFormat, translateRequest, translateResponseToOpenAI, type ProtocolFormat } from './9router-engine/protocol-translator';

// ─── Types ───────────────────────────────────────────────

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | Array<Record<string, unknown>>;
  tool_calls?: Array<Record<string, unknown>>;
  tool_call_id?: string;
  name?: string;
}

export interface ChatTool {
  type?: string;
  name?: string;
  function?: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
  description?: string;
  input_schema?: Record<string, unknown>;
}

export interface RouteChatOptions {
  /** Provider ID or alias (e.g. 'openai', 'claude', 'deepseek'). Auto-selects if omitted. */
  provider?: string;
  /** Model ID within the provider. Uses provider default if omitted. */
  model?: string;
  /** Chat messages in OpenAI format (default/CHIMERA internal format). */
  messages: ChatMessage[];
  /** Tools/functions for the LLM */
  tools?: ChatTool[];
  /** Enable streaming response */
  stream?: boolean;
  /** Max tokens for response */
  maxTokens?: number;
  /** Temperature sampling */
  temperature?: number;
  /** Fallback chain: try each provider in order until one succeeds */
  fallbackChain?: string[];
  /** Timeout per provider attempt in ms (default 30000) */
  timeoutMs?: number;
  /** Explicit API key for this request (overrides env vars) */
  apiKey?: string;
  /** Request metadata for logging */
  metadata?: Record<string, string>;
}

export interface RouteChatResult {
  success: boolean;
  content: string | null;
  toolCalls?: Array<Record<string, unknown>>;
  finishReason: string;
  provider: string;
  model: string;
  format: ProtocolFormat;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  latencyMs: number;
  fallbackUsed?: string;
  error?: string;
}

export interface StreamChunk {
  token?: string;
  done?: boolean;
  error?: string;
  toolCall?: Record<string, unknown>;
  usage?: Record<string, number>;
}

export interface ProviderStatus {
  id: string;
  name: string;
  category: string;
  format: string;
  defaultModel: string;
  modelsCount: number;
  configured: boolean;
}

// ─── Credential Resolution ──────────────────────────────

/** Environment variable mapping for providers */
const ENV_KEY_MAP: Record<string, string[]> = {
  openai: ['OPENAI_API_KEY'],
  anthropropic: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'],
  claude: ['ANTHROPIC_API_KEY', 'CLAUDE_API_KEY'],
  gemini: ['GOOGLE_API_KEY', 'GEMINI_API_KEY'],
  groq: ['GROQ_API_KEY'],
  deepseek: ['DEEPSEEK_API_KEY'],
  xai: ['XAI_API_KEY', 'GROK_API_KEY'],
  grok: ['XAI_API_KEY', 'GROK_API_KEY'],
  mistral: ['MISTRAL_API_KEY'],
  perplexity: ['PERPLEXITY_API_KEY'],
  together: ['TOGETHER_API_KEY'],
  fireworks: ['FIREWORKS_API_KEY'],
  openrouter: ['OPENROUTER_API_KEY'],
  cerebras: ['CEREBRAS_API_KEY'],
  siliconflow: ['SILICONFLOW_API_KEY'],
  glm: ['ZHIPU_API_KEY', 'GLM_API_KEY', 'ZAI_API_KEY'],
  zhipu: ['ZHIPU_API_KEY', 'GLM_API_KEY', 'ZAI_API_KEY'],
  ollama: [],
  'ollama-local': [],
  azure: ['AZURE_OPENAI_API_KEY'],
  cohere: ['COHERE_API_KEY'],
  nvidia: ['NVIDIA_API_KEY'],
  hyperbolic: ['HYPERBOLIC_API_KEY'],
  sambanova: ['SAMBANOVA_API_KEY'],
  cloudflare: ['CLOUDFLARE_API_TOKEN'],
  'cloudflare-ai': ['CLOUDFLARE_API_TOKEN'],
  vertex: ['GOOGLE_APPLICATION_CREDENTIALS'],
};

/** Resolve API key for a provider from env vars */
function resolveCredentials(providerId: string, explicitKey?: string): { apiKey: string | null; envName: string | null } {
  if (explicitKey) return { apiKey: explicitKey, envName: 'explicit' };

  const envNames = ENV_KEY_MAP[providerId] || [];
  for (const envName of envNames) {
    const val = process.env[envName];
    if (val) return { apiKey: val, envName };
  }
  return { apiKey: null, envName: null };
}

/** Check if provider has credentials configured */
export function isProviderConfigured(providerId: string): boolean {
  const info = resolveProvider(providerId);
  if (!info) return false;
  if (info.category === 'local') return true;
  const { apiKey } = resolveCredentials(providerId);
  return !!apiKey;
}

// ─── ZAI SDK Fallback ──────────────────────────────────

/** Use ZAI SDK as universal fallback (existing CHIMERA path) */
async function callViaZAISDK(
  body: Record<string, unknown>,
): Promise<{ content: string | null; toolCalls?: Array<Record<string, unknown>>; finishReason: string; usage?: Record<string, number> }> {
  const ZAI = (await import('z-ai-web-dev-sdk')).default;
  const client = await ZAI.create() as any;
  const result = await client.createChatCompletion(body);

  const choice = result?.choices?.[0];
  return {
    content: choice?.message?.content || null,
    toolCalls: choice?.message?.tool_calls,
    finishReason: choice?.finish_reason || 'stop',
    usage: result?.usage ? {
      promptTokens: result.usage.prompt_tokens,
      completionTokens: result.usage.completion_tokens,
      totalTokens: result.usage.total_tokens,
    } : undefined,
  };
}

// ─── EXECUTE REQUEST ────────────────────────────────────

async function executeProviderRequest(
  provider: ProviderInfo,
  translatedBody: Record<string, unknown>,
  apiKey: string,
  timeoutMs: number,
  signal: AbortSignal,
): Promise<{ response: Response; format: ProtocolFormat }> {
  const baseUrl = provider.transport.baseUrl;
  const format = provider.transport.format as ProtocolFormat;

  let url: string;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(provider.transport.headers || {}),
  };

  if (format === 'claude') {
    url = `${baseUrl}/messages`;
    headers['x-api-key'] = apiKey;
    headers['anthropic-version'] = '2023-06-01';
    headers['anthropic-dangerous-direct-browser-access'] = 'true';
  } else if (format === 'gemini') {
    const model = String(translatedBody.model || provider.defaultModel);
    const stream = translatedBody.stream ? '&alt=sse' : '';
    url = `${baseUrl}/models/${model}:streamGenerateContent?${new URLSearchParams({ key: apiKey }).toString()}${stream}`;
    // Remove model and systemInstruction from body for Gemini
    const { model: _m, systemInstruction: _s, ...rest } = translatedBody;
    translatedBody = rest;
  } else {
    // OpenAI-compatible
    url = `${baseUrl}/chat/completions`;
    const scheme = provider.transport.authScheme;
    if (scheme === 'x-api-key') {
      headers['x-api-key'] = apiKey;
    } else if (scheme === 'custom') {
      const header = provider.transport.authHeader || 'Authorization';
      headers[header] = apiKey;
    } else {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
  signal.addEventListener('abort', () => controller.abort());

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(translatedBody),
      signal: controller.signal,
    });
    return { response, format };
  } finally {
    clearTimeout(timeoutId);
  }
}

// ─── DEFAULT FALLBACK CHAIN ──────────────────────────────

const DEFAULT_FALLBACK_CHAIN = [
  'glm',           // Zhipu AI (ZAI SDK native)
  'deepseek',      // DeepSeek
  'groq',          // Groq (fast)
  'openai',        // OpenAI
  'anthropic',     // Claude
  'gemini',        // Google
  'openrouter',    // OpenRouter (meta-router)
];

// ─── MAIN BRIDGE ────────────────────────────────────────

/**
 * Route a chat completion request through 9router engine.
 *
 * Flow:
 * 1. Resolve provider (from options, fallback chain, or auto-select)
 * 2. Detect source format (always OpenAI in CHIMERA context)
 * 3. Translate request to provider's native format
 * 4. Execute request with timeout and error handling
 * 5. Translate response back to OpenAI format
 * 6. If failed and fallback chain exists, try next provider
 */
export async function routeChat(options: RouteChatOptions): Promise<RouteChatResult> {
  const startTime = performance.now();
  const { messages, tools, stream = false, maxTokens, temperature, metadata } = options;
  const timeoutMs = options.timeoutMs || 30000;

  // Build OpenAI-format body (CHIMERA internal format)
  const openAIBody: Record<string, unknown> = {
    model: options.model || 'glm-4-flash',
    messages,
    stream,
  };
  if (maxTokens) openAIBody.max_tokens = maxTokens;
  if (temperature !== undefined) openAIBody.temperature = temperature;
  if (tools?.length) openAIBody.tools = tools;

  // Determine provider chain to try
  const chain = options.fallbackChain || (options.provider
    ? [options.provider]
    : DEFAULT_FALLBACK_CHAIN
  );

  let lastError = '';

  for (const providerId of chain) {
    const provider = resolveProvider(providerId);
    if (!provider) {
      console.warn(`[9router] Provider not found: ${providerId}`);
      lastError = `Provider not found: ${providerId}`;
      continue;
    }

    const model = options.model || provider.defaultModel || 'glm-4-flash';
    const { apiKey } = resolveCredentials(provider.id, options.apiKey);

    // Local providers don't need API keys
    if (provider.category !== 'local' && !apiKey) {
      console.warn(`[9router] No credentials for ${provider.id}`);
      lastError = `No API key configured for ${provider.name}`;
      continue;
    }

    // Translate request
    const targetFormat = provider.transport.format as ProtocolFormat;
    const translatedBody = translateRequest(
      { ...openAIBody, model },
      'openai',
      targetFormat,
      model,
    );

    try {
 const signal = new AbortSignal(); // for now, no upstream cancellation
      const { response, format } = await executeProviderRequest(
        provider, translatedBody, apiKey || '', timeoutMs, signal,
      );

      if (!response.ok) {
        const errorBody = await response.text().catch(() => 'Unknown error');
        lastError = `${provider.name} returned ${response.status}: ${errorBody.slice(0, 200)}`;
        console.warn(`[9router] ${provider.id} error:`, response.status, errorBody.slice(0, 100));
        continue;
      }

      // Parse response
      const isStream = stream || provider.transport.forceStream;
      let result: RouteChatResult;

      if (isStream && response.body) {
        // For streaming, we need to collect the full response
        // In a real implementation, this would return a ReadableStream
        // For now, collect and return aggregated result
        const collected = await collectSSEStream(response.body, format);
        result = {
          success: true,
          content: collected.content,
          toolCalls: collected.toolCalls,
          finishReason: collected.finishReason,
          provider: provider.id,
          model,
          format,
          usage: collected.usage ? {
            promptTokens: collected.usage.prompt_tokens || 0,
            completionTokens: collected.usage.completion_tokens || 0,
            totalTokens: collected.usage.total_tokens || 0,
          } : undefined,
          latencyMs: Math.round(performance.now() - startTime),
        };
      } else {
        const data = await response.json();
        const normalized = translateResponseToOpenAI(data, format);
        const choice = (normalized.choices as Array<Record<string, unknown>>)?.[0];
        const msg = choice?.message as Record<string, unknown> | undefined;

        result = {
          success: true,
          content: (msg?.content as string) || null,
          toolCalls: msg?.tool_calls as Array<Record<string, unknown>>,
          finishReason: String(choice?.finish_reason || 'stop'),
          provider: provider.id,
          model,
          format,
          usage: normalized.usage as RouteChatResult['usage'],
          latencyMs: Math.round(performance.now() - startTime),
        };
      }

      // If this was a fallback, record it
      if (chain.indexOf(providerId) > 0) {
        result.fallbackUsed = providerId;
      }

      return result;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.warn(`[9router] ${provider.id} exception:`, lastError);
      continue;
    }
  }

  // All providers failed — try ZAI SDK as last resort
  try {
    console.log('[9router] All providers failed, falling back to ZAI SDK');
    const zaiResult = await callViaZAISDK(openAIBody);
    return {
      success: true,
      content: zaiResult.content,
      toolCalls: zaiResult.toolCalls,
      finishReason: zaiResult.finishReason,
      provider: 'zai-sdk',
      model: String(openAIBody.model),
      format: 'openai',
      usage: zaiResult.usage as RouteChatResult['usage'],
      latencyMs: Math.round(performance.now() - startTime),
      fallbackUsed: 'zai-sdk',
    };
  } catch (zaiErr) {
    return {
      success: false,
      content: null,
      finishReason: 'error',
      provider: chain[0] || 'unknown',
      model: String(openAIBody.model),
      format: 'openai',
      latencyMs: Math.round(performance.now() - startTime),
      error: `All providers failed. Last error: ${lastError}. ZAI SDK also failed: ${zaiErr instanceof Error ? zaiErr.message : String(zaiErr)}`,
    };
  }
}

/**
 * Stream a chat completion — returns an async generator of SSE chunks.
 * Uses 9router protocol translation for non-OpenAI providers.
 */
export async function* streamChat(options: RouteChatOptions): AsyncGenerator<StreamChunk> {
  const startTime = performance.now();
  const { messages, tools, maxTokens, temperature } = options;
  const timeoutMs = options.timeoutMs || 60000;

  const openAIBody: Record<string, unknown> = {
    model: options.model || 'glm-4-flash',
    messages,
    stream: true,
  };
  if (maxTokens) openAIBody.max_tokens = maxTokens;
  if (temperature !== undefined) openAIBody.temperature = temperature;
  if (tools?.length) openAIBody.tools = tools;

  const chain = options.fallbackChain || (options.provider
    ? [options.provider]
    : DEFAULT_FALLBACK_CHAIN
  );

  for (const providerId of chain) {
    const provider = resolveProvider(providerId);
    if (!provider) continue;

    const model = options.model || provider.defaultModel || 'glm-4-flash';
    const { apiKey } = resolveCredentials(provider.id, options.apiKey);
    if (provider.category !== 'local' && !apiKey) continue;

    const targetFormat = provider.transport.format as ProtocolFormat;
    const translatedBody = translateRequest(
      { ...openAIBody, model },
      'openai',
      targetFormat,
      model,
    );

    try {
      const signal = new AbortSignal();
      const { response, format } = await executeProviderRequest(
        provider, translatedBody, apiKey || '', timeoutMs, signal,
      );

      if (!response.ok || !response.body) continue;

      // Stream SSE chunks
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') {
            yield { done: true, usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 } };
            return;
          }

          try {
            const parsed = JSON.parse(data);
            // Claude SSE format
            if (format === 'claude' && parsed.type) {
              if (parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
                yield { token: parsed.delta.text };
              } else if (parsed.type === 'message_stop') {
                yield { done: true };
                return;
              }
              continue;
            }
            // Gemini SSE format
            if (format === 'gemini' && parsed.candidates) {
              const parts = parsed.candidates?.[0]?.content?.parts;
              if (parts) {
                for (const part of parts) {
                  if (part.text) yield { token: part.text };
                }
              }
              continue;
            }
            // OpenAI SSE format
            const token = parsed.choices?.[0]?.delta?.content;
            if (token) {
              yield { token };
            }
            const finishReason = parsed.choices?.[0]?.finish_reason;
            if (finishReason) {
              yield {
                done: true,
                usage: {
                  promptTokens: parsed.usage?.prompt_tokens || 0,
                  completionTokens: parsed.usage?.completion_tokens || 0,
                  totalTokens: parsed.usage?.total_tokens || 0,
                },
              };
              return;
            }
          } catch {
            // Skip malformed SSE frames
          }
        }
      }

      // If we get here without [DONE], the stream ended naturally
      yield { done: true };
      return;
    } catch (err) {
      console.warn(`[9router] Stream ${providerId} failed:`, err instanceof Error ? err.message : err);
      continue;
    }
  }

  // All providers failed for streaming — yield error
  yield { error: 'All providers failed for streaming', done: true };
}

// ─── SSE STREAM COLLECTOR (for non-streaming use of stream providers) ──

async function collectSSEStream(
  body: ReadableStream<Uint8Array>,
  format: ProtocolFormat,
): Promise<{ content: string; toolCalls?: Array<Record<string, unknown>>; finishReason: string; usage?: Record<string, number> }> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let content = '';
  let finishReason = 'stop';
  let usage: Record<string, number> | undefined;

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (!line.trim() || !line.startsWith('data: ')) continue;
      const data = line.slice(6).trim();
      if (data === '[DONE]') continue;

      try {
        const parsed = JSON.parse(data);
        if (format === 'claude' && parsed.type === 'content_block_delta' && parsed.delta?.type === 'text_delta') {
          content += parsed.delta.text;
        } else if (format === 'gemini' && parsed.candidates?.[0]?.content?.parts) {
          for (const part of parsed.candidates[0].content.parts) {
            if (part.text) content += part.text;
          }
        } else {
          const token = parsed.choices?.[0]?.delta?.content;
          if (token) content += token;
          if (parsed.choices?.[0]?.finish_reason) finishReason = parsed.choices[0].finish_reason;
          if (parsed.usage) usage = parsed.usage;
        }
      } catch {
        // Skip
      }
    }
  }

  return { content, finishReason, usage };
}

// ─── PROVIDER STATUS ────────────────────────────────────

/** Get status of all providers (configured vs available) */
export function getProviderStatus(): ProviderStatus[] {
  return listProviders().map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    format: p.format,
    defaultModel: p.defaultModel || '',
    modelsCount: p.models?.length || 0,
    configured: isProviderConfigured(p.id),
  }));
}

/** Get summary of 9router engine */
export function getEngineInfo() {
  return {
    engine: '9router-bridge',
    version: '1.0.0',
    providers: providerCount(),
    categories: providerCategories(),
    defaultFallbackChain: DEFAULT_FALLBACK_CHAIN,
    supportedFormats: ['openai', 'claude', 'gemini'],
    translationMode: 'hub-and-spoke',
  };
}
