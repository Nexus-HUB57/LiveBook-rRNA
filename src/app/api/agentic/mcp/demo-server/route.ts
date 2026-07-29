/**
 * CHIMERA v4.0 — MCP Demo Server Endpoint
 * A real MCP server endpoint at /api/agentic/mcp/demo-server that the MCP adapter can connect to.
 * Handles JSON-RPC 2.0 requests: initialize, tools/list, tools/call.
 */

import { NextRequest, NextResponse } from 'next/server';
import { DEMO_TOOL_DEFINITIONS, createMCPDemoHandlers } from '@/lib/agentic/mcp-demo-server';

// ─── JSON-RPC 2.0 Types ───

interface JsonRpcRequest {
  jsonrpc: '2.0';
  id: number | string;
  method: string;
  params?: Record<string, unknown>;
}

interface JsonRpcSuccessResponse {
  jsonrpc: '2.0';
  id: number | string;
  result: unknown;
}

interface JsonRpcErrorResponse {
  jsonrpc: '2.0';
  id: number | string | null;
  error: {
    code: number;
    message: string;
    data?: unknown;
  };
}

type JsonRpcResponse = JsonRpcSuccessResponse | JsonRpcErrorResponse;

function success(id: number | string, result: unknown): JsonRpcSuccessResponse {
  return { jsonrpc: '2.0', id, result };
}

function error(id: number | string | null, code: number, message: string, data?: unknown): JsonRpcErrorResponse {
  return { jsonrpc: '2.0', id, error: { code, message, data } };
}

// ─── Handlers ───

const demoHandlers = createMCPDemoHandlers();

/** POST /api/agentic/mcp/demo-server — JSON-RPC 2.0 endpoint */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validate JSON-RPC envelope
    if (!body || body.jsonrpc !== '2.0' || !body.method) {
      return NextResponse.json(
        error(null, -32600, 'Invalid Request: missing jsonrpc "2.0" or method'),
        { status: 400 }
      );
    }

    const request = body as JsonRpcRequest;
    const { id, method, params } = request;

    switch (method) {
      // ── initialize ──
      case 'initialize': {
        return NextResponse.json(success(id, {
          protocolVersion: '2024-11-05',
          capabilities: {
            tools: { listChanged: false },
          },
          serverInfo: {
            name: 'chimera-mcp-demo',
            version: '4.0.0',
          },
        }));
      }

      // ── tools/list ──
      case 'tools/list': {
        return NextResponse.json(success(id, {
          tools: DEMO_TOOL_DEFINITIONS,
        }));
      }

      // ── tools/call ──
      case 'tools/call': {
        const toolName = params?.name as string;
        const toolArgs = (params?.arguments as Record<string, unknown>) ?? {};

        if (!toolName) {
          return NextResponse.json(
            error(id, -32602, 'Invalid params: "name" is required for tools/call'),
            { status: 400 }
          );
        }

        const handler = demoHandlers[toolName];
        if (!handler) {
          return NextResponse.json(
            error(id, -32601, `Method not found: unknown tool "${toolName}"`),
            { status: 404 }
          );
        }

        try {
          const result = await handler(toolArgs);
          // MCP tools/call returns content array
          return NextResponse.json(success(id, {
            content: [{
              type: 'text',
              text: JSON.stringify(result),
            }],
          }));
        } catch (toolErr) {
          return NextResponse.json(
            error(id, -32603, `Tool execution failed: ${toolErr instanceof Error ? toolErr.message : String(toolErr)}`),
            { status: 500 }
          );
        }
      }

      // ── unknown method ──
      default:
        return NextResponse.json(
          error(id, -32601, `Method not found: ${method}`),
          { status: 404 }
        );
    }
  } catch (err) {
    return NextResponse.json(
      error(null, -32700, `Parse error: ${err instanceof Error ? err.message : String(err)}`),
      { status: 500 }
    );
  }
}

/** GET /api/agentic/mcp/demo-server — Health check */
export async function GET() {
  return NextResponse.json({
    name: 'chimera-mcp-demo',
    version: '4.0.0',
    status: 'ready',
    tools: DEMO_TOOL_DEFINITIONS.map(t => t.name),
  });
}
