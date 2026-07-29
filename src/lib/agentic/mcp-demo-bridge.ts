/**
 * CHIMERA v4.0 — MCP Demo Bridge
 * Registers demo MCP tools both as an MCP server endpoint and as native tools in the ToolRegistry.
 */

import { getMCPAdapter } from './mcp-adapter';
import { getToolRegistry } from './tool-registry';
import { DEMO_TOOL_DEFINITIONS, createMCPDemoHandlers } from './mcp-demo-server';
import type { ToolDefinition } from './types';

const DEMO_SERVER_ID = 'mcp-demo-server';
const DEMO_SERVER_NAME = 'CHIMERA Demo MCP Server';

/**
 * Register the demo MCP server and its tools.
 *
 * 1. Registers the demo server in the MCP adapter (points to /api/agentic/mcp/demo-server).
 * 2. Also registers the demo tools as native tools in the ToolRegistry for direct use
 *    without needing HTTP transport.
 *
 * @returns List of registered tool names
 */
export function registerDemoMCPServer(): string[] {
  const adapter = getMCPAdapter();
  const registry = getToolRegistry();
  const handlers = createMCPDemoHandlers();

  // 1. Register the demo MCP server in the adapter
  adapter.registerServer({
    id: DEMO_SERVER_ID,
    name: DEMO_SERVER_NAME,
    transport: 'sse',
    url: '/api/agentic/mcp/demo-server',
    enabled: true,
    connected: false,
  });

  // 2. Register each demo tool as a native tool in the ToolRegistry
  //    This provides a simpler alternative that works without HTTP.
  const toolNames: string[] = [];

  for (const def of DEMO_TOOL_DEFINITIONS) {
    const toolId = `mcp-demo-${def.name}`;
    const handlerKey = `mcp-demo-${def.name}`;

    const toolDef: ToolDefinition = {
      id: toolId,
      name: `demo_${def.name}`,
      description: `[Demo MCP] ${def.description}`,
      inputSchema: def.inputSchema,
      handler: handlerKey,
      category: 'mcp-demo',
      isMCP: true,
      mcpServer: DEMO_SERVER_ID,
    };

    registry.registerTool(toolDef);
    registry.registerHandler(handlerKey, handlers[def.name]);
    toolNames.push(`demo_${def.name}`);
  }

  return toolNames;
}