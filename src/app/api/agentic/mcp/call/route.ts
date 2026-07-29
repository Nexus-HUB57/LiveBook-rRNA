import { NextRequest, NextResponse } from 'next/server';
import { getMCPAdapter } from '@/lib/agentic';

/** POST /api/agentic/mcp/call — Execute a tool on an MCP server */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { serverId, toolName, arguments: args } = body;
    if (!serverId || !toolName) return NextResponse.json({ error: 'serverId and toolName are required' }, { status: 400 });

    const mcp = getMCPAdapter();
    const result = await mcp.callTool(serverId, toolName, args || {});
    return NextResponse.json({ serverId, toolName, result });
  } catch (err) {
    return NextResponse.json({
      error: 'MCP tool call failed',
      detail: err instanceof Error ? err.message : String(err),
    }, { status: 500 });
  }
}
