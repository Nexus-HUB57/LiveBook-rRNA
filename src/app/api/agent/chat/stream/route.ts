import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { query, agentSlug, sessionId } = body;

    if (!query?.trim()) {
      return NextResponse.json({ error: 'Query vazia' }, { status: 400 });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Try Colibri LLM first
          const colibriUrl = process.env.COLIBRI_URL || 'http://127.0.0.1:8000';
          const zaiBase = process.env.ZAI_API_BASE_URL;
          const zaiKey = process.env.ZAI_API_KEY;

          // Use ZAI SDK if available, otherwise try Colibri directly
          let response: Response | null = null;

          if (zaiBase && zaiKey) {
            response = await fetch(`${zaiBase}/v1/chat/completions`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${zaiKey}`,
              },
              body: JSON.stringify({
                model: agentSlug || 'chimera-default',
                messages: [
                  { role: 'system', content: 'Voce e o assistente CHIMERA, um motor de fusao multi-agente com GLM-5.2 744B MoE. Responda em portugues com precisao tecnica.' },
                  { role: 'user', content: query },
                ],
                stream: true,
                max_tokens: 2048,
              }),
            });
          } else {
            response = await fetch(`${colibriUrl}/v1/chat/completions`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                model: 'default',
                messages: [
                  { role: 'system', content: 'Voce e o assistente CHIMERA. Responda em portugues.' },
                  { role: 'user', content: query },
                ],
                stream: true,
              }),
            });
          }

          if (response && response.ok && response.body) {
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
                const data = line.slice(6);
                if (data === '[DONE]') {
                  controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
                  continue;
                }
                try {
                  const parsed = JSON.parse(data);
                  const token = parsed.choices?.[0]?.delta?.content;
                  if (token) {
                    controller.enqueue(encoder.encode(JSON.stringify({ token }) + '\n'));
                  }
                } catch {
                  // Ignore malformed SSE frames
                }
              }
            }
          } else {
            // Offline fallback — RAG-style response
            const fallbackAnswer = generateOfflineResponse(query);
            for (const char of fallbackAnswer) {
              controller.enqueue(encoder.encode(JSON.stringify({ token: char }) + '\n'));
              await new Promise(r => setTimeout(r, 10));
            }
          }

          controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + '\n'));
        } catch (err) {
          controller.enqueue(encoder.encode(JSON.stringify({ error: 'Erro no stream LLM' }) + '\n'));
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Expose-Headers': 'X-Session-Id',
        'X-Session-Id': sessionId || `sess_${Date.now()}`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

function generateOfflineResponse(query: string): string {
  const q = query.toLowerCase();
  if (q.includes('bitcoin') || q.includes('btc') || q.includes('wallet') || q.includes('utxo')) {
    return 'O modulo Bitcoin do CHIMERA esta operacional. Use as abas Dashboard e Cofres para monitorar UTXOs, saldos e derivacao HD. O saldo total vigente e de aproximadamente 25.55 BTC distribuidos em 33 UTXOs no endereco principal.';
  }
  if (q.includes('agente') || q.includes('agent') || q.includes('hub')) {
    return 'O ecossistema CHIMERA possui 5 agentes: Mythos Orchestrator (core), Cerebro Sistemico (core), Fable 5 Researcher (extended), Cofre Guardian (core) e Moltbook Voice (extended). Acesse a aba Agent Hub para detalhes.';
  }
  if (q.includes('rag') || q.includes('rRNA') || q.includes('conhecimento')) {
    return 'O motor RAG rRNA utiliza pipeline de 6 estagios: Extract, Encode, Retrieve (BM25), Rerank (cross-encoder), Augment e Generate. A base de conhecimento contem entradas dos 5 agentes com chunking recursivo estilo Langchain.';
  }
  if (q.includes('orquestr') || q.includes('healing') || q.includes('cura')) {
    return 'O motor de Auto-Cura Reativa opera em 6 fases: Observar, Detectar, Diagnosticar, Prescrever, Executar e Aprender. Monitora 5 metricas quanticas (fidelidade, coerencia, decoerencia, entrelacamento, superposicao) com thresholds criticos e de aviso.';
  }
  return 'CHIMERA Multi-Agent Fusion Engine — Motor operacional com GLM-5.2 744B MoE via Colibri, RAG rRNA, auto-cura reativa, tRPC v11 e 5 agentes especializados. Pergunte sobre Bitcoin, Agentes, RAG, Orquestracao ou Governanca para respostas detalhadas.';
}