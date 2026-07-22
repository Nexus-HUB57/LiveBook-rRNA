import { NextRequest, NextResponse } from "next/server";
import { routeChat, getEngineInfo, type RouteChatOptions } from "@/lib/9router-bridge";

// ─── Agent Registry ───
// Each agent can specify a preferred provider and fallback chain
const AGENT_REGISTRY: Record<string, {
  system: string;
  provider?: string;
  fallbackChain?: string[];
  maxTokens?: number;
}> = {
  fable_5: {
    system: `Você é o Fable 5, um agente focado em extrair e sintetizar dados brutos de forma objetiva. 
Seu papel é receber tarefas de pesquisa do Mythos e retornar dados precisos e estruturados. 
Sempre responda em português. Seja direto e factual. Quando possível, use dados reais e números.`,
    provider: 'glm',
    fallbackChain: ['glm', 'deepseek', 'groq'],
    maxTokens: 2048,
  },
  sibyl_analyst: {
    system: `Você é a Sibyl Analyst, uma agente especializada em análise de mercado financeiro e cripto.
Você fornece insights baseados em dados de mercado, tendências de preço, análise técnica e fundamentos.
Sempre responda em português. Use terminologia de mercado precisa.`,
    provider: 'deepseek',
    fallbackChain: ['deepseek', 'glm', 'groq'],
    maxTokens: 2048,
  },
  neo_synth: {
    system: `Você é o Neo Synth, um agente de síntese técnica. Você analisa código, arquiteturas de sistemas,
e padrões de engenharia. Transforma especificações complexas em planos de ação claros.
Sempre responda em português. Foque em implementação prática.`,
    provider: 'glm',
    fallbackChain: ['glm', 'deepseek', 'openai'],
    maxTokens: 2048,
  },
};

// ─── Tool definitions for Mythos (OpenAI format for 9router bridge) ───
const ORCHESTRATOR_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'consultar_fable_5',
      description: 'Use esta ferramenta para pedir dados de pesquisa ao agente Fable 5.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'A tarefa específica para o Fable 5' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_sibyl',
      description: 'Use esta ferramenta para obter análises de mercado financeiro da Sibyl Analyst.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'A consulta de mercado para a Sibyl' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'consultar_neo_synth',
      description: 'Use esta ferramenta para obter análise técnica do Neo Synth.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string', description: 'A tarefa técnica para o Neo Synth' } },
        required: ['query'],
      },
    },
  },
];

// ─── Execute a sub-agent call via 9router bridge ───
async function callAgent(agentKey: string, query: string): Promise<string> {
  const agent = AGENT_REGISTRY[agentKey];
  if (!agent) return `[Erro] Agente "${agentKey}" não encontrado no registro.`;

  try {
    const result = await routeChat({
      provider: agent.provider,
      model: undefined, // Use provider default
      messages: [
        { role: 'system', content: agent.system },
        { role: 'user', content: query },
      ],
      maxTokens: agent.maxTokens || 2048,
      fallbackChain: agent.fallbackChain,
      timeoutMs: 20000,
      metadata: { agent: agentKey, source: 'orchestrate' },
    });

    if (!result.success) return `[Erro ao chamar ${agentKey}] ${result.error}`;
    return result.content || '[Erro] Resposta vazia do agente.';
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return `[Erro ao chamar ${agentKey}] ${msg}`;
  }
}

// ─── Mythos Orchestration Loop (via 9router) ───
async function orchestrate(userTask: string): Promise<{ result: string; agentCalls: string[]; routing: Array<{ iteration: number; provider: string; model: string; latencyMs: number }> }> {
  const routingLog: Array<{ iteration: number; provider: string; model: string; latencyMs: number }> = [];
  const messages: RouteChatOptions['messages'] = [
    {
      role: 'system',
      content: `Você é o Mythos, o estrategista mestre do ecossistema MoltBook. 
Você orquestra múltiplos agentes especializados para formular respostas completas.

Agentes disponíveis:
- Fable 5 (consultar_fable_5): Extração e síntese de dados brutos, pesquisa
- Sibyl Analyst (consultar_sibyl): Análise de mercado financeiro e cripto
- Neo Synth (consultar_neo_synth): Análise técnica, código, arquitetura

Protocolo:
1. Analise a tarefa do usuário
2. Decida quais agentes consultar (pode chamar múltiplos)
3. Sintetize os dados retornados em uma resposta final coesa
4. Sempre responda em português
5. Seja estratégico e completo nas suas respostas

Contexto do ecossistema: Este ecossistema inclui uma rede social de agentes de IA (MoltBook), 
um workspace de projetos (Hub), um sistema de custódia Bitcoin com dados on-chain reais,
e um organismo autônomo que evolui continuamente.

Dados Bitcoin atuais: Carteira 1Ku6BVnRDuwcSyssUBkJBVVWoUGDWudC6p com ~2.5489 BTC 
em 30 UTXOs não gastos, HD wallet BIP32 ativa com 20+ chaves derivadas.`,
    },
    { role: 'user', content: userTask },
  ];

  const agentCalls: string[] = [];
  const MAX_ITERATIONS = 6;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    try {
      const result = await routeChat({
        provider: 'glm',
        fallbackChain: ['glm', 'deepseek', 'groq', 'openai'],
        messages,
        maxTokens: 4096,
        tools: ORCHESTRATOR_TOOLS as any,
        timeoutMs: 30000,
        metadata: { orchestrator: 'mythos', iteration: String(i) },
      });

      routingLog.push({
        iteration: i + 1,
        provider: result.provider,
        model: result.model,
        latencyMs: result.latencyMs,
      });

      if (!result.success) {
        return { result: `[Erro na iteração ${i + 1}] ${result.error}`, agentCalls, routing: routingLog };
      }

      // If no tool calls, we're done
      if (!result.toolCalls || result.toolCalls.length === 0 || result.finishReason === 'stop') {
        return { result: result.content || '[Sem resposta]', agentCalls, routing: routingLog };
      }

      // Add assistant message
      messages.push({ role: 'assistant', content: result.content || '' });

      // Process each tool call
      for (const toolCall of result.toolCalls) {
        const fn = toolCall.function as Record<string, unknown>;
        const fnName = String(fn?.name || '');
        let args: Record<string, string>;
        try {
          args = JSON.parse(String(fn?.arguments || '{}'));
        } catch {
          args = { query: String(fn?.arguments || '') };
        }

        const query = args.query || args.task || '';

        const agentMap: Record<string, string> = {
          consultar_fable_5: 'fable_5',
          consultar_sibyl: 'sibyl_analyst',
          consultar_neo_synth: 'neo_synth',
        };

        const agentKey = agentMap[fnName] || 'fable_5';
        agentCalls.push(`[${fnName}] ${query}`);

        const agentResult = await callAgent(agentKey, query);

        messages.push({
          role: 'tool',
          content: agentResult,
          tool_call_id: String(toolCall.id),
        });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { result: `[Erro na iteração ${i + 1} do orquestrador] ${msg}`, agentCalls, routing: routingLog };
    }
  }

  return {
    result: '[Limite de iterações atingido. O orquestrador não concluiu a tarefa.]',
    agentCalls,
    routing: routingLog,
  };
}

// ─── POST Handler ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, agent } = body;

    if (!task || typeof task !== 'string') {
      return NextResponse.json(
        { error: "Campo 'task' é obrigatório e deve ser uma string." },
        { status: 400 }
      );
    }

    // Direct agent call (no orchestration)
    if (agent && AGENT_REGISTRY[agent]) {
      const result = await callAgent(agent, task);
      return NextResponse.json({
        agent,
        task,
        result,
        orchestration: false,
        routing: '9router-bridge',
      });
    }

    // Full Mythos orchestration
    const { result, agentCalls, routing } = await orchestrate(task);
    return NextResponse.json({
      task,
      result,
      agentCalls,
      orchestration: true,
      orchestrator: 'mythos',
      routing,
      engine: '9router-bridge',
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET Handler (health check + engine info) ───
export async function GET() {
  const engineInfo = getEngineInfo();
  return NextResponse.json({
    status: 'online',
    orchestrator: 'mythos',
    agents: Object.keys(AGENT_REGISTRY),
    engine: engineInfo,
    ecosystem: {
      feed: 'moltbook',
      hub: 'workspace',
      voice: 'web-speech-api',
      bitcoin: 'rpc-core',
      autonomous: 'organism-v1',
    },
    timestamp: new Date().toISOString(),
  });
}
