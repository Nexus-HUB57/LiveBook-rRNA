import { NextRequest, NextResponse } from 'next/server';
import { getMCPAdapter } from '@/lib/agentic';

/** GET /api/agentic/mcp — List MCP servers */
export async function GET() {
  const mcp = getMCPAdapter();
  return NextResponse.json({ servers: mcp.listServers() });
}

/** POST /api/agentic/mcp — Register a new MCP server */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, name, transport, command, url, env, headers } = body;

    if (!id || !name) return NextResponse.json({ error: 'id and name are required' }, { status: 400 });

    const mcp = getMCPAdapter();
    mcp.registerServer({
      id, name, transport: transport || 'sse',
      command, url, env, headers,
      enabled: true, connected: false,
    });

    return NextResponse.json({ registered: true, serverId: id }, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

/** DELETE /api/agentic/mcp — Unregister an MCP server */
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const serverId = searchParams.get('serverId');
  if (!serverId) return NextResponse.json({ error: 'serverId is required' }, { status: 400 });

  const mcp = getMCPAdapter();
  mcp.unregisterServer(serverId);
  return NextResponse.json({ unregistered: true, serverId });
}