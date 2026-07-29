import { AgentEventBus } from '@/lib/agentic';

/** GET /api/agentic/events — SSE stream of all agentic events */
export async function GET() {
  const bus = AgentEventBus.getInstance();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    start(controller) {
      const send = (data: string) => controller.enqueue(encoder.encode(data));
      const clientId = bus.registerSSE(send);

      // Send recent events as backlog
      const recent = bus.getRecent(20);
      for (const event of recent) {
        send(`data: ${JSON.stringify(event)}\n\n`);
      }

      // Cleanup on close
      controller.close = new Proxy(controller.close, {
        apply(target, thisArg, args) {
          bus.unregisterSSE(clientId);
          return Reflect.apply(target, thisArg, args);
        },
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}
