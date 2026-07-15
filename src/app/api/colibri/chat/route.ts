import { NextRequest } from 'next/server';

const COLIBRI_BASE = process.env.COLIBRI_URL || 'http://127.0.0.1:8000';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const colibriRes = await fetch(`${COLIBRI_BASE}/v1/chat/completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...body,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });

    if (!colibriRes.ok) {
      const errText = await colibriRes.text();
      return new Response(errText, { status: colibriRes.status, headers: { 'Content-Type': 'application/json' } });
    }

    if (!colibriRes.body) {
      return new Response(JSON.stringify({ error: 'Empty stream from engine' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'text/event-stream');
    headers.set('Cache-Control', 'no-cache');
    headers.set('Connection', 'keep-alive');
    const queueWait = colibriRes.headers.get('x-colibri-queue-wait-ms');
    if (queueWait) headers.set('X-Colibri-Queue-Wait-Ms', queueWait);
    const reqId = colibriRes.headers.get('x-request-id');
    if (reqId) headers.set('X-Request-Id', reqId);

    return new Response(colibriRes.body, { headers });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Stream failed' }),
      { status: 502, headers: { 'Content-Type': 'application/json' } }
    );
  }
}