import { NextResponse } from 'next/server';
import { getToolRegistry } from '@/lib/agentic';

/** GET /api/agentic/tools — List all tools */
export async function GET() {
  const registry = getToolRegistry();
  return NextResponse.json({
    tools: registry.listAll(),
    stats: registry.getStats(),
  });
}

/** POST /api/agentic/tools — Execute a specific tool */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { toolId, arguments: args } = body;

    if (!toolId) return NextResponse.json({ error: 'toolId is required' }, { status: 400 });

    const registry = getToolRegistry();
    const tool = registry.getTool(toolId);
    if (!tool) return NextResponse.json({ error: `Tool not found: ${toolId}` }, { status: 404 });

    const result = await registry.executeTool(toolId, args || {});
    return NextResponse.json({ tool: tool.name, result });
  } catch (err) {
    return NextResponse.json({
      error: 'Tool execution failed',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
