import { NextRequest, NextResponse } from 'next/server';
import { getMCPAdapter } from '@/lib/agentic';

/** POST /api/agentic/mcp/connect — Connect to an MCP server and discover tools */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serverId } = body;
    if (!serverId) return NextResponse.json({ error: 'serverId is required' }, { status: 400 });

    const mcp = getMCPAdapter();
    const tools = await mcp.connect(serverId);
    return NextResponse.json({ connected: true, serverId, toolsDiscovered: tools.length, tools });
  } catch (err) {
    return NextResponse.json({
      error: 'MCP connection failed',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
