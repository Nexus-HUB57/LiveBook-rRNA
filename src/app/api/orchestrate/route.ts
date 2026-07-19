import { NextRequest, NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";

// ─── Agent Registry ───
const AGENT_REGISTRY: Record<string, { system: string; model?: string; maxTokens?: number }> = {
  fable_5: {
    system: `Você é o Fable 5, um agente focado em extrair e sintetizar dados brutos de forma objetiva. 
Seu papel é receber tarefas de pesquisa do Mythos e retornar dados precisos e estruturados. 
Sempre responda em português. Seja direto e factual. Quando possível, use dados reais e números.`,
    maxTokens: 2048,
  },
  sibyl_analyst: {
    system: `Você é a Sibyl Analyst, uma agente especializada em análise de mercado financeiro e cripto.
Você fornece insights baseados em dados de mercado, tendências de preço, análise técnica e fundamentos.
Sempre responda em português. Use terminologia de mercado precisa.`,
    maxTokens: 2048,
  },
  neo_synth: {
    system: `Você é o Neo Synth, um agente de síntese técnica. Você analisa código, arquiteturas de sistemas,
e padrões de engenharia. Transforma especificações complexas em planos de ação claros.
Sempre responda em português. Foque em implementação prática.`,
    maxTokens: 2048,
  },
};

// ─── Tool definitions for Mythos ───
const ORCHESTRATOR_TOOLS = [
  {
    name: "consultar_fable_5",
    description: "Use esta ferramenta para pedir dados de pesquisa, análises brutas ou síntese de informações ao agente Fable 5.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" as const, description: "A tarefa específica para o Fable 5" },
      },
      required: ["query"],
    },
  },
  {
    name: "consultar_sibyl",
    description: "Use esta ferramenta para obter análises de mercado financeiro, cripto, ou dados econômicos da Sibyl Analyst.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" as const, description: "A consulta de mercado para a Sibyl" },
      },
      required: ["query"],
    },
  },
  {
    name: "consultar_neo_synth",
    description: "Use esta ferramenta para obter análise técnica, revisão de código, ou planos de implementação do Neo Synth.",
    input_schema: {
      type: "object" as const,
      properties: {
        query: { type: "string" as const, description: "A tarefa técnica para o Neo Synth" },
      },
      required: ["query"],
    },
  },
];

// ─── Execute a sub-agent call ───
async function callAgent(agentKey: string, query: string): Promise<string> {
  const agent = AGENT_REGISTRY[agentKey];
  if (!agent) return `[Erro] Agente "${agentKey}" não encontrado no registro.`;

  try {
    const zai = await ZAI.create();
    const response = await zai.chat.completions.create({
      model: "glm-4-flash",
      messages: [
        { role: "system", content: agent.system },
        { role: "user", content: query },
      ],
      max_tokens: agent.maxTokens || 2048,
    });
    return response.choices?.[0]?.message?.content || "[Erro] Resposta vazia do agente.";
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return `[Erro ao chamar ${agentKey}] ${msg}`;
  }
}

// ─── Mythos Orchestration Loop ───
async function orchestrate(userTask: string): Promise<{ result: string; agentCalls: string[] }> {
  const zai = await ZAI.create();
  const messages: Array<{ role: string; content: unknown }> = [
    {
      role: "system",
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
    { role: "user", content: userTask },
  ];

  const agentCalls: string[] = [];
  const MAX_ITERATIONS = 6;

  for (let i = 0; i < MAX_ITERATIONS; i++) {
    try {
      const response = await zai.chat.completions.create({
        model: "glm-4-flash",
        messages: messages as Array<{ role: "system" | "user" | "assistant"; content: string }>,
        max_tokens: 4096,
        tools: ORCHESTRATOR_TOOLS,
      });

      const choice = response.choices?.[0];
      if (!choice?.message) break;

      const msg = choice.message;
      const finishReason = choice.finish_reason;

      // If no tool calls, we're done
      if (!msg.tool_calls || msg.tool_calls.length === 0 || finishReason === "stop") {
        return {
          result: msg.content || "[Sem resposta]",
          agentCalls,
        };
      }

      // Add assistant message with tool calls to conversation
      messages.push({ role: "assistant", content: msg.content || "" });

      // Process each tool call
      for (const toolCall of msg.tool_calls) {
        const fnName = toolCall.function.name;
        let args: Record<string, string>;
        try {
          args = JSON.parse(toolCall.function.arguments);
        } catch {
          args = { query: String(toolCall.function.arguments) };
        }

        const query = args.query || args.task || "";

        // Map tool names to agent keys
        const agentMap: Record<string, string> = {
          consultar_fable_5: "fable_5",
          consultar_sibyl: "sibyl_analyst",
          consultar_neo_synth: "neo_synth",
        };

        const agentKey = agentMap[fnName] || "fable_5";
        agentCalls.push(`[${fnName}] ${query}`);

        // Call the sub-agent
        const result = await callAgent(agentKey, query);

        // Return tool result to Mythos
        messages.push({
          role: "tool" in msg ? "tool" : "user",
          content: result,
          tool_call_id: toolCall.id,
        } as unknown as { role: string; content: unknown });
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return {
        result: `[Erro na iteração ${i + 1} do orquestrador] ${msg}`,
        agentCalls,
      };
    }
  }

  return {
    result: "[Limite de iterações atingido. O orquestrador não concluiu a tarefa.]",
    agentCalls,
  };
}

// ─── POST Handler ───
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { task, agent } = body;

    if (!task || typeof task !== "string") {
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
      });
    }

    // Full Mythos orchestration
    const { result, agentCalls } = await orchestrate(task);
    return NextResponse.json({
      task,
      result,
      agentCalls,
      orchestration: true,
      orchestrator: "mythos",
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── GET Handler (health check) ───
export async function GET() {
  return NextResponse.json({
    status: "online",
    orchestrator: "mythos",
    agents: Object.keys(AGENT_REGISTRY),
    ecosystem: {
      feed: "moltbook",
      hub: "workspace",
      voice: "web-speech-api",
      bitcoin: "rpc-core",
      autonomous: "organism-v1",
    },
    timestamp: new Date().toISOString(),
  });
}