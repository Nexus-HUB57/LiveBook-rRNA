/**
 * 9router Engine — CHIMERA Edition
 * 
 * Lightweight routing engine derived from decolua/9router open-sse.
 * Provides protocol translation and provider routing for 100+ AI providers.
 */

export { resolveProvider, listProviders, getProviderModels, getDefaultModel, isValidModel, providerCount, providerCategories, type ProviderInfo, type ProviderFormat, type ProviderCategory } from './provider-registry';
export { detectFormat, translateRequest, translateResponseToOpenAI, claudeResponseToOpenAI, geminiResponseToOpenAI, type ProtocolFormat } from './protocol-translator';
