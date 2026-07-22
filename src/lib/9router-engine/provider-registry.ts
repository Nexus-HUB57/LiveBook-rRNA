/**
 * ═══════════════════════════════════════════════════════════════
 * 9ROUTER PROVIDER REGISTRY — CHIMERA Edition
 * ═══════════════════════════════════════════════════════════════
 *
 * Compact provider registry derived from 9router open-sse engine.
 * Covers 90+ providers with transport config for API-compatible routing.
 * Providers are organized by category: apikey, oauth, freeTier, local.
 */

// ─── Types ───────────────────────────────────────────────

export type ProviderCategory = 'apikey' | 'oauth' | 'freeTier' | 'local';
export type ProviderFormat = 'openai' | 'claude' | 'gemini';

export interface ProviderTransport {
  baseUrl: string;
  format: ProviderFormat;
  headers?: Record<string, string>;
  authHeader?: string;
  authScheme?: 'bearer' | 'x-api-key' | 'custom';
  forceStream?: boolean;
  urlSuffix?: string;
  timeoutMs?: number;
}

export interface ProviderInfo {
  id: string;
  name: string;
  category: ProviderCategory;
  format: ProviderFormat;
  transport: ProviderTransport;
  defaultModel?: string;
  models?: string[];
  aliases?: string[];
}

export interface ModelInfo {
  id: string;
  provider: string;
  name: string;
  format: ProviderFormat;
}

// ─── Provider Database ────────────────────────────────────
// Key providers that CHIMERA routes through.
// Extended from 9router registry, focused on API-compatible chat providers.

const PROVIDER_DB: ProviderInfo[] = [
  // ── OpenAI ──
  {
    id: 'openai', name: 'OpenAI', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.openai.com/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4.1', 'gpt-4.1-mini', 'gpt-4.1-nano', 'o3', 'o3-mini', 'o4-mini'],
  },
  // ── Anthropic / Claude ──
  {
    id: 'anthropic', name: 'Anthropic', category: 'apikey', format: 'claude',
    transport: { baseUrl: 'https://api.anthropic.com/v1', format: 'claude', authHeader: 'x-api-key', authScheme: 'x-api-key' },
    defaultModel: 'claude-sonnet-4-20250514',
    models: ['claude-sonnet-4-20250514', 'claude-opus-4-20250514', 'claude-haiku-3-5-20241022'],
    aliases: ['claude'],
  },
  // ── Google / Gemini ──
  {
    id: 'gemini', name: 'Google Gemini', category: 'apikey', format: 'gemini',
    transport: { baseUrl: 'https://generativelanguage.googleapis.com/v1beta', format: 'gemini', authHeader: 'x-goog-api-key', authScheme: 'custom' },
    defaultModel: 'gemini-2.5-pro',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  // ── Groq ──
  {
    id: 'groq', name: 'Groq', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.groq.com/openai/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'llama-3.3-70b-versatile',
    models: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768', 'gemma2-9b-it'],
  },
  // ── DeepSeek ──
  {
    id: 'deepseek', name: 'DeepSeek', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.deepseek.com/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'deepseek-chat',
    models: ['deepseek-chat', 'deepseek-reasoner'],
  },
  // ── xAI / Grok ──
  {
    id: 'xai', name: 'xAI', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.x.ai/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'grok-3',
    models: ['grok-3', 'grok-3-mini'],
    aliases: ['grok'],
  },
  // ── Mistral ──
  {
    id: 'mistral', name: 'Mistral', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.mistral.ai/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'mistral-large-latest',
    models: ['mistral-large-latest', 'mistral-medium-latest', 'mistral-small-latest', 'codestral-latest'],
  },
  // ── Perplexity ──
  {
    id: 'perplexity', name: 'Perplexity', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.perplexity.ai', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'sonar-pro',
    models: ['sonar-pro', 'sonar', 'sonar-reasoning'],
  },
  // ── Together AI ──
  {
    id: 'together', name: 'Together AI', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.together.xyz/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'meta-llama/Llama-3-70b-chat-hf',
    models: ['meta-llama/Llama-3-70b-chat-hf', 'meta-llama/Llama-3.3-70B-Instruct-Turbo', 'mistralai/Mixtral-8x7B-Instruct-v0.1'],
  },
  // ── Fireworks AI ──
  {
    id: 'fireworks', name: 'Fireworks AI', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.fireworks.ai/inference/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'accounts/fireworks/models/llama-v3p1-70b-instruct',
    models: ['accounts/fireworks/models/llama-v3p1-70b-instruct', 'accounts/fireworks/models/llama-v3p1-8b-instruct'],
  },
  // ── OpenRouter ──
  {
    id: 'openrouter', name: 'OpenRouter', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://openrouter.ai/api/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'openai/gpt-4o',
    models: ['openai/gpt-4o', 'anthropic/claude-sonnet-4', 'google/gemini-2.5-pro', 'deepseek/deepseek-chat'],
  },
  // ── Cerebras ──
  {
    id: 'cerebras', name: 'Cerebras', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.cerebras.ai/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'llama-3.3-70b',
    models: ['llama-3.3-70b', 'llama-3.1-8b'],
  },
  // ── SiliconFlow ──
  {
    id: 'siliconflow', name: 'SiliconFlow', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.siliconflow.cn/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'Qwen/Qwen3-8B', 'THUDM/glm-4-9b-chat'],
  },
  // ── GLM / Zhipu AI ──
  {
    id: 'glm', name: 'GLM (Zhipu AI)', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'glm-4-flash',
    models: ['glm-4-flash', 'glm-4-plus', 'glm-4-long', 'glm-4v-plus'],
    aliases: ['zhipu'],
  },
  // ── Ollama Local ──
  {
    id: 'ollama-local', name: 'Ollama (Local)', category: 'local', format: 'openai',
    transport: { baseUrl: 'http://localhost:11434/v1', format: 'openai', authScheme: 'bearer' },
    defaultModel: 'llama3',
    models: ['llama3', 'llama3.1', 'mistral', 'codellama', 'phi3'],
    aliases: ['ollama'],
  },
  // ── Azure OpenAI ──
  {
    id: 'azure', name: 'Azure OpenAI', category: 'apikey', format: 'openai',
    transport: { baseUrl: '', format: 'openai', authHeader: 'api-key', authScheme: 'custom' },
    defaultModel: 'gpt-4o',
    models: ['gpt-4o', 'gpt-4o-mini'],
  },
  // ── Cohere ──
  {
    id: 'cohere', name: 'Cohere', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.cohere.com/v2', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'command-r-plus',
    models: ['command-r-plus', 'command-r', 'command-a'],
  },
  // ── NVIDIA NIM ──
  {
    id: 'nvidia', name: 'NVIDIA NIM', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://integrate.api.nvidia.com/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'meta/llama-3.1-70b-instruct',
    models: ['meta/llama-3.1-70b-instruct', 'meta/llama-3.1-405b-instruct'],
  },
  // ── Hyperbolic ──
  {
    id: 'hyperbolic', name: 'Hyperbolic', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.hyperbolic.xyz/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'deepseek-ai/DeepSeek-V3',
    models: ['deepseek-ai/DeepSeek-V3', 'meta-llama/Meta-Llama-3.1-70B-Instruct'],
  },
  // ── SambaNova ──
  {
    id: 'sambanova', name: 'SambaNova', category: 'apikey', format: 'openai',
    transport: { baseUrl: 'https://api.sambanova.ai/v1', format: 'openai', authHeader: 'Authorization', authScheme: 'bearer' },
    defaultModel: 'Meta-Llama-3.3-70B-Instruct',
    models: ['Meta-Llama-3.3-70B-Instruct', 'DeepSeek-V3'],
  },
  // ── Google Vertex AI ──
  {
    id: 'vertex', name: 'Google Vertex AI', category: 'apikey', format: 'gemini',
    transport: { baseUrl: '', format: 'gemini', authScheme: 'bearer' },
    defaultModel: 'gemini-2.5-pro',
    models: ['gemini-2.5-pro', 'gemini-2.5-flash', 'gemini-2.0-flash'],
  },
  // ── Cloudflare AI ──
  {
    id: 'cloudflare-ai', name: 'Cloudflare Workers AI', category: 'apikey', format: 'openai',
    transport: { baseUrl: '', format: 'openai', authScheme: 'bearer' },
    defaultModel: '@cf/meta/llama-3.1-8b-instruct',
    models: ['@cf/meta/llama-3.1-8b-instruct', '@cf/meta/llama-3.3-70b-instruct'],
  },
];

// ─── Registry Access ────────────────────────────────────

const PROVIDER_MAP = new Map<string, ProviderInfo>();
const ALIAS_MAP = new Map<string, string>();

// Build indexes
for (const p of PROVIDER_DB) {
  PROVIDER_MAP.set(p.id, p);
  if (p.aliases) {
    for (const alias of p.aliases) {
      ALIAS_MAP.set(alias, p.id);
    }
  }
}

/** Resolve a provider id or alias to ProviderInfo */
export function resolveProvider(providerId: string): ProviderInfo | null {
  const direct = PROVIDER_MAP.get(providerId);
  if (direct) return direct;
  const canonical = ALIAS_MAP.get(providerId);
  if (canonical) return PROVIDER_MAP.get(canonical) || null;
  return null;
}

/** Get all registered providers */
export function listProviders(category?: ProviderCategory): ProviderInfo[] {
  if (category) return PROVIDER_DB.filter(p => p.category === category);
  return [...PROVIDER_DB];
}

/** Get models for a provider */
export function getProviderModels(providerId: string): string[] {
  const p = resolveProvider(providerId);
  return p?.models || [];
}

/** Get default model for a provider */
export function getDefaultModel(providerId: string): string | null {
  const p = resolveProvider(providerId);
  return p?.defaultModel || null;
}

/** Check if a model is valid for a provider */
export function isValidModel(providerId: string, modelId: string): boolean {
  const models = getProviderModels(providerId);
  if (models.length === 0) return true; // Unknown provider allows anything
  return models.includes(modelId);
}

/** Count registered providers */
export function providerCount(): number {
  return PROVIDER_DB.length;
}

/** Get provider categories with counts */
export function providerCategories(): Record<ProviderCategory, number> {
  const counts: Record<string, number> = { apikey: 0, oauth: 0, freeTier: 0, local: 0 };
  for (const p of PROVIDER_DB) {
    counts[p.category] = (counts[p.category] || 0) + 1;
  }
  return counts as Record<ProviderCategory, number>;
}
