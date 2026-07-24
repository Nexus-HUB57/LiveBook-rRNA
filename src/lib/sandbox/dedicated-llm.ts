/**
 * ═══════════════════════════════════════════════════════════════
 * SANDBOX NATIVO — Dedicated LLM Manager
 * ═══════════════════════════════════════════════════════════════
 * Manages the dedicated LLM for sandbox agents using the
 * 9router bridge with local-first strategy (Ollama → fallback).
 */

import type { DedicatedLLMConfig, LLMConversation, LLMInteraction } from './types';
import { routeChat, streamChat, getProviderStatus, type ChatMessage, type StreamChunk } from '../9router-bridge';
import {
  createConversation, getConversation, addMessageToConversation,
  addAuditEntry, getMemoryEntries, addMemory,
} from './memory-store';

// ─── Default Config ─────────────────────────────────────
const DEFAULT_CONFIG: DedicatedLLMConfig = {
  provider: 'ollama',
  model: 'llama3.1:8b',
  temperature: 0.7,
  maxTokens: 2048,
  systemPrompt: `Você é o LLM Dedicado do Sandbox Nativo CHIMERA. Você atua como o cérebro central para agentes executando em ambiente sandbox.

Suas capacidades:
- Raciocínio complexo e planejamento
- Geração de código (JavaScript, TypeScript, Python)
- Tool calling e agent routing
- Explicação e depuração de código
- Análise de resultados de execução
- Sugestões de otimização
- Diagnóstico de falhas em agentes

Sempre responda em português brasileiro. Seja preciso e técnico.`,
  enableMemory: true,
  enableToolCalling: true,
  enableStreaming: true,
};

let config = { ...DEFAULT_CONFIG };

export function getLLMConfig(): DedicatedLLMConfig {
  return { ...config };
}

export function updateLLMConfig(partial: Partial<DedicatedLLMConfig>): DedicatedLLMConfig {
  config = { ...config, ...partial };
  return config;
}

// ═══ NON-STREAMING CHAT ═══════════════════════════════

export async function dedicatedLLMChat(
  userMessage: string,
  agentId?: string,
  conversationId?: string,
): Promise<{ response: string; conversationId: string; interaction: LLMInteraction; tokens?: { prompt: number; completion: number; total: number } }> {
  const startTime = performance.now();

  // Get or create conversation
  let convId = conversationId;
  if (!convId) {
    const conv = createConversation(agentId);
    convId = conv.id;
  }
  const conv = getConversation(convId);
  if (!conv) throw new Error('Conversation not found');

  // Build context with memory
  let contextAugmented = userMessage;
  if (config.enableMemory && agentId) {
    const memories = getMemoryEntries(agentId).slice(-5);
    if (memories.length > 0) {
      const memoryContext = memories
        .map(m => `[${m.type}] ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value).slice(0, 200)}`)
        .join('\n');
      contextAugmented = `[Contexto de memória do agente ${agentId}]:\n${memoryContext}\n\n[Pergunta]: ${userMessage}`;
    }
  }

  // Store user message
  addMessageToConversation(convId, {
    agentId,
    role: 'user',
    content: contextAugmented,
    model: config.model,
    provider: config.provider,
    latencyMs: 0,
  });

  // Build messages for 9router
  const messages: ChatMessage[] = [
    { role: 'system', content: config.systemPrompt },
    ...conv.messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
  ];

  // Route through 9router with local-first fallback
  const result = await routeChat({
    provider: config.provider,
    model: config.model,
    messages,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    fallbackChain: ['ollama', 'deepseek', 'groq', 'openai', 'anthropic', 'gemini'],
    timeoutMs: 30000,
    metadata: { source: 'sandbox-dedicated-llm', agentId: agentId ?? 'system' },
  });

  const latencyMs = Math.round(performance.now() - startTime);
  const responseContent = result.content ?? '[LLM não retornou conteúdo]';

  // Store assistant message
  const interaction = addMessageToConversation(convId, {
    agentId,
    role: 'assistant',
    content: responseContent,
    model: result.model,
    provider: result.provider,
    tokens: result.usage ? {
      prompt: result.usage.promptTokens,
      completion: result.usage.completionTokens,
      total: result.usage.totalTokens,
    } : undefined,
    latencyMs,
  })!;

  // Audit
  addAuditEntry({
    action: 'llm_call',
    agentId,
    resource: `${result.provider}/${result.model}`,
    result: result.success ? 'success' : 'error',
    details: `${latencyMs}ms | ${result.usage?.totalTokens ?? 0} tokens | via ${result.provider}`,
  });

  return {
    response: responseContent,
    conversationId: convId,
    interaction,
    tokens: result.usage,
  };
}

// ═══ STREAMING CHAT ══════════════════════════════════

export async function* dedicatedLLMStream(
  userMessage: string,
  agentId?: string,
  conversationId?: string,
): AsyncGenerator<StreamChunk & { conversationId: string }> {
  let convId = conversationId;
  if (!convId) {
    const conv = createConversation(agentId);
    convId = conv.id;
  }

  // Build context
  let contextAugmented = userMessage;
  if (config.enableMemory && agentId) {
    const memories = getMemoryEntries(agentId).slice(-3);
    if (memories.length > 0) {
      const memoryContext = memories
        .map(m => `[${m.type}] ${typeof m.value === 'string' ? m.value : JSON.stringify(m.value).slice(0, 150)}`)
        .join('\n');
      contextAugmented = `[Memória]: ${memoryContext}\n\n[Pergunta]: ${userMessage}`;
    }
  }

  addMessageToConversation(convId, {
    agentId,
    role: 'user',
    content: contextAugmented,
    model: config.model,
    provider: config.provider,
    latencyMs: 0,
  });

  const conv = getConversation(convId);
  const messages: ChatMessage[] = [
    { role: 'system', content: config.systemPrompt },
    ...(conv?.messages.filter(m => m.role === 'user' || m.role === 'assistant').slice(-10).map(m => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })) ?? []),
  ];

  let fullContent = '';
  const startTime = performance.now();

  try {
    const stream = streamChat({
      provider: config.provider,
      model: config.model,
      messages,
      temperature: config.temperature,
      maxTokens: config.maxTokens,
      fallbackChain: ['ollama', 'deepseek', 'groq', 'openai', 'anthropic', 'gemini'],
      timeoutMs: 30000,
    });

    for await (const chunk of stream) {
      if (chunk.token) fullContent += chunk.token;
      yield { ...chunk, conversationId: convId };
    }

    // Store complete response
    const latencyMs = Math.round(performance.now() - startTime);
    addMessageToConversation(convId, {
      agentId,
      role: 'assistant',
      content: fullContent,
      model: config.model,
      provider: config.provider,
      latencyMs,
    });

    addAuditEntry({
      action: 'llm_call',
      agentId,
      resource: `${config.provider}/${config.model}`,
      result: 'success',
      details: `Stream ${latencyMs}ms | ${fullContent.length} chars`,
    });
  } catch (err) {
    addAuditEntry({
      action: 'llm_call',
      agentId,
      resource: `${config.provider}/${config.model}`,
      result: 'error',
      details: String(err),
    });
    yield { token: '', done: true, error: String(err), conversationId: convId };
  }
}

// ═══ LLM STATUS ═══════════════════════════════════════

export function getDedicatedLLMStatus() {
  const allStatus = getProviderStatus();
  const primaryStatus = allStatus.find(p => p.id === config.provider) ?? allStatus[0] ?? { id: config.provider, name: config.provider, category: 'local', format: 'openai' as const, defaultModel: config.model, modelsCount: 0, configured: false };
  return {
    config: { ...config, systemPrompt: config.systemPrompt.slice(0, 100) + '...' },
    providerStatus: primaryStatus,
    fallbackChain: ['ollama', 'deepseek', 'groq', 'openai', 'anthropic', 'gemini'],
    mode: 'local-first-with-cloud-fallback' as const,
  };
}
