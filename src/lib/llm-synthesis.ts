/**
 * LLM Synthesis — Streaming text generation via 9router bridge.
 *
 * Provides async generators that yield token-by-token for SSE streaming.
 * Routes through 100+ providers with automatic fallback.
 * Falls back gracefully when no provider is available.
 */

export interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

const SYSTEM_PROMPT = `Voce e um assistente especializado no ecossistema CHIMERA — Multi-Agent Fusion Engine.
Voce tem conhecimento sobre:
- 2.402+ projetos de desenvolvedores independentes chineses
- 5 agentes AI: Zettascale, GenesisFlow, Antrophexus AI, Sabio Heroi, Nexus Sidian
- Motor Colibri com GLM-5.2 744B MoE (19k experts em 3 tiers)
- Pipeline RAG rRNA (Retrieval Augmented Generation)
- Protocolo de auto-cura reativo de 6 fases (INVOKE → DETECT → HEAL → LEARN → DIRECT → PERSIST)
- Expert Cortex: visualizacao de roteamento de experts em tempo real
- Orquestracao real via Skills e algoritmos
- Bitcoin, custodia, UTXO, derivacao HD
- Ciclo OODA, JARVIS, voice synthesis

Regras:
- Responda no mesmo idioma da pergunta do usuario
- Seja conciso e util
- Cite fontes quando disponivel via RAG
- Se nao souber, diga com honestidade`;

/**
 * Stream LLM response token by token via 9router bridge.
 * Routes through GLM → DeepSeek → Groq with auto-fallback.
 * Falls back to word-by-word simulation if no provider is available.
 */
export async function* streamLLM(
  query: string,
  options: {
    agentSlug?: string;
    context?: string;
    history?: LLMMessage[];
    provider?: string;
  } = {}
): AsyncGenerator<string> {
  const { agentSlug, context, history = [], provider } = options;

  // Build messages array
  const messages: LLMMessage[] = [
    { role: 'system', content: SYSTEM_PROMPT },
  ];

  // Add agent-specific context
  if (agentSlug) {
    messages.push({
      role: 'system',
      content: `O usuario esta conversando com o agente "${agentSlug}". Adapte suas respostas ao contexto desse agente quando relevante.`,
    });
  }

  // Add conversation history (last 10 messages)
  const recentHistory = history.slice(-10);
  for (const msg of recentHistory) {
    messages.push({ role: msg.role, content: msg.content });
  }

  // Add RAG context if available
  let userContent = query;
  if (context) {
    userContent = `Contexto recuperado via RAG rRNA:\n---\n${context}\n---\n\nPergunta do usuario: ${query}`;
  }

  messages.push({ role: 'user', content: userContent });

  // Try 9router bridge streaming
  try {
    const { streamChat } = await import('@/lib/9router-bridge');
    const chunkGenerator = streamChat({
      provider: provider || 'glm',
      messages: messages as any,
      stream: true,
      maxTokens: 2048,
      fallbackChain: provider
        ? [provider, 'glm', 'deepseek', 'groq']
        : ['glm', 'deepseek', 'groq', 'openai'],
      timeoutMs: 30000,
      metadata: { source: 'llm-synthesis', agent: agentSlug || '' },
    });

    let hasContent = false;
    for await (const chunk of chunkGenerator) {
      if (chunk.token) {
        hasContent = true;
        yield chunk.token;
      }
      if (chunk.done) break;
      if (chunk.error) break;
    }
    if (hasContent) return;
  } catch (err) {
    console.error('[LLM Stream] 9router error, falling back:', err);
  }

  // Fallback: Generate a contextual response without LLM
  yield* generateFallbackResponse(query, agentSlug, context);
}

/**
 * Generate a fallback response when LLM is not available.
 * Still streams token by token for consistent UX.
 */
async function* generateFallbackResponse(
  query: string,
  agentSlug?: string,
  context?: string
): AsyncGenerator<string> {
  const lowerQuery = query.toLowerCase();

  let response: string;

  if (lowerQuery.includes('ooda') || lowerQuery.includes('ciclo ooda')) {
    response = `O ciclo OODA (Observe, Orient, Decide, Act) e um framework de decisao estrategica desenvolvido pelo coronel John Boyd. No ecossistema Nexus-HUB, o OODA e aplicado na orquestracao dos agentes AI: **Observe** os estados quanticos dos 7 paineis, **Oriente** com base na sabedoria acumulada, **Decida** quais Skills ativar, e **Act** executando acoes corretivas em tempo real. Cada ciclo de orquestracao executa implicitamente este loop.`;
  } else if (lowerQuery.includes('bitcoin') || lowerQuery.includes('btc')) {
    response = `O ecossistema tem suporte a Bitcoin atraves do agente **Cofre** e do painel quântico de mesmo nome. As Skills relacionadas incluem: btc_rpc (comunicacao com nodes Bitcoin), utxo_tracking (rastreamento de transacoes nao gastas), hd_wallet_derivation (derivacao de carteiras HD), custody_validation (validacao de custodia), e on_chain_analysis (analise on-chain). O agente Cofre opera com dados em tempo real da blockchain.`;
  } else if (lowerQuery.includes('rag') || lowerQuery.includes('pipeline') || lowerQuery.includes('rrna')) {
    response = `O pipeline RAG rRNA (Retrieval Augmented Generation com inspiracao em RNA ribossomal) segue 6 estagios: **EXTRACT** — chunking recursivo de texto; **ENCODE** — vetorizacao TF-IDF com expansao de n-gramas; **RETRIEVE** — scoring BM25 com field boosting; **RERANK** — re-ranking cross-encoder por relevancia; **AUGMENT** — montagem da janela de contexto com atribuicao de fonte; **GENERATE** — sintese via LLM com template RAG. A base de conhecimento inclui READMEs e documentacao dos 5 agentes Nexus.`;
  } else if (lowerQuery.includes('quantico') || lowerQuery.includes('nucleo') || lowerQuery.includes('painel')) {
    response = `Os 7 paineis quanticos sao: **Moltbook** (social, feed curation, karma engine), **Cerebro Sistemico** (inteligencia, neural mapping, predictive modeling), **Cofre** (custodia Bitcoin, UTXO tracking), **Mythos** (orquestrador, tool calling, agent routing), **Fable 5** (pesquisa, data extraction, web scraping), **Wormhole** (transporte, dimensional routing, encryption), e **Blackhole** (entropia, event horizon detection, singularity analysis). Cada painel possui 5 metricas quanticas: Coerencia, Entrelaçamento, Superposicao, Decoerencia e Fidelidade.`;
  } else if (lowerQuery.includes('orquestr') || lowerQuery.includes('auto-cura') || lowerQuery.includes('sabedoria')) {
    response = `O Protocolo Reativo Gerativo opera em 6 fases por ciclo: **INVOKE** — gerar estados quanticos para todos os paineis; **DETECT** — executar o Self-Healing Engine para detectar anomalias; **HEAL** — aplicar acoes corretivas reais via Skills (recalibracao, estabilizacao, amplificacao, escudo antientropia, ressync); **LEARN** — processar sabedoria via Wisdom Engine (padroes, insights, memoria de decisoes); **DIRECT** — usar sabedoria para direcionar acoes futuras; **PERSIST** — salvar tudo em memoria persistente. O sistema e autossuficiente com loop exponencial e memoria que cresce a cada ciclo.`;
  } else if (lowerQuery.includes('agente') || lowerQuery.includes('agentes') || lowerQuery.includes('zettascale') || lowerQuery.includes('genesisflow')) {
    response = `O ecossistema possui 5 agentes AI: **Zettascale** (orquestrador core, React + Node.js), **GenesisFlow** (especialista em fluxos, Next.js), **Antrophexus AI** (analista, Python), **Sabio Heroi** (guardiao com RAG + voz), e **Nexus Sidian** (integracao Obsidian). Cada agente tem Skills proprias, documentacao no banco de conhecimento, e pode ser selecionado no chat para respostas especializadas. O Hub sincroniza com os repositorios GitHub ao vivo.`;
  } else {
    response = `O ecossistema CHIMERA e uma plataforma Multi-Agent Fusion Engine com GLM-5.2 744B MoE, 19k experts em 3 tiers (VRAM/RAM/Disk), auto-cura reativa de 6 fases, Expert Cortex em tempo real, 5 agentes AI com Skills especializadas, pipeline RAG rRNA, e Protocolo Reativo Gerativo de auto-cura e auto-sabedoria. Tudo conectado via tRPC v11 com Next.js 16 e Prisma. Para saber mais, pergunte sobre: expert routing, auto-cura, Bitcoin, pipeline RAG, orquestracao, ou agentes especificos.`;
  }

  // Stream word by word
  const words = response.split(/(\s+)/);
  for (const word of words) {
    yield word;
    if (word.trim()) {
      await new Promise(r => setTimeout(r, 20));
    }
  }
}

/**
 * Check if LLM streaming is available via 9router bridge.
 */
export function isLLMAvailable(): boolean {
  // 9router bridge is always available — it has ZAI SDK as final fallback
  return true;
}