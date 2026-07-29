/**
 * CHIMERA v4.0 — MCP (Model Context Protocol) Adapter
 * Discovers tools from MCP servers and bridges them into the Tool Registry.
 * Supports SSE and Streamable HTTP transports.
 */

import type { MCPServerConfig, MCPToolInfo, ToolDefinition } from './types';
import { getToolRegistry } from './tool-registry';
import { AgentEventBus } from './event-bus';

// ─── MCP Protocol Messages ───

interface MCPRequest {
  jsonrpc: '2.0';
  id: number;
  method: string;
  params?: Record<string, unknown>;
}

interface MCPResponse {
  jsonrpc: '2.0';
  id: number;
  result?: unknown;
  error?: { code: number; message: string; data?: unknown };
}

interface MCPTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}

export class MCPAdapter {
  private servers: Map<string, MCPServerConfig> = new Map();
  private nextId = 1;

  /** Register an MCP server configuration */
  registerServer(config: MCPServerConfig): void {
    this.servers.set(config.id, { ...config, connected: false });
    AgentEventBus.getInstance().emit({
      type: 'mcp.server_connected',
      payload: { serverId: config.id, name: config.name, transport: config.transport },
      timestamp: new Date().toISOString(),
    });
  }

  /** Remove an MCP server */
  unregisterServer(serverId: string): void {
    const server = this.servers.get(serverId);
    if (server) {
      getToolRegistry().unregisterMCPServer(serverId);
      this.servers.delete(serverId);
      AgentEventBus.getInstance().emit({
        type: 'mcp.server_disconnected',
        payload: { serverId, name: server.name },
        timestamp: new Date().toISOString(),
      });
    }
  }

  /** Connect to an MCP server and discover its tools */
  async connect(serverId: string): Promise<MCPToolInfo[]> {
    const config = this.servers.get(serverId);
    if (!config) throw new Error(`MCP server not found: ${serverId}`);
    if (config.transport === 'stdio') {
      return this.connectStdio(config);
    } else {
      return this.connectHttp(config);
    }
  }

  /** Discover tools from a connected server */
  async discoverTools(serverId: string): Promise<MCPToolInfo[]> {
    const response = await this.sendRequest(serverId, 'tools/list', {});
    const tools = (response.result as { tools?: MCPTool[] })?.tools ?? [];

    const toolInfos: MCPToolInfo[] = tools.map(t => ({
      name: t.name,
      description: t.description ?? '',
      inputSchema: t.inputSchema ?? { type: 'object', properties: {} },
      serverId,
    }));

    getToolRegistry().registerMCPTools(serverId, toolInfos);

    // Update server config
    const config = this.servers.get(serverId);
    if (config) {
      config.tools = toolInfos;
      config.connected = true;
      config.lastPing = new Date().toISOString();
      this.servers.set(serverId, config);
    }

    for (const tool of toolInfos) {
      AgentEventBus.getInstance().emit({
        type: 'mcp.tool_registered',
        payload: { serverId, toolName: tool.name },
        timestamp: new Date().toISOString(),
      });
    }

    return toolInfos;
  }

  /** Execute a tool on an MCP server */
  async callTool(serverId: string, toolName: string, args: Record<string, unknown>): Promise<unknown> {
    const response = await this.sendRequest(serverId, 'tools/call', {
      name: toolName,
      arguments: args,
    });

    if (response.error) {
      throw new Error(`MCP tool error [${serverId}:${toolName}]: ${response.error.message}`);
    }

    return response.result;
  }

  /** List all registered servers */
  listServers(): MCPServerConfig[] {
    return Array.from(this.servers.values());
  }

  /** Get a server's status */
  getServerStatus(serverId: string): MCPServerConfig | undefined {
    return this.servers.get(serverId);
  }

  // ─── Private: HTTP-based connection (SSE / Streamable HTTP) ───

  private async connectHttp(config: MCPServerConfig): Promise<MCPToolInfo[]> {
    const url = config.url;
    if (!url) throw new Error(`HTTP MCP server '${config.id}' has no URL`);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...config.headers },
        body: JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'initialize',
          params: { protocolVersion: '2024-11-05', capabilities: {}, clientInfo: { name: 'chimera', version: '4.0.0' } }
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const config2 = this.servers.get(config.id);
      if (config2) {
        config2.connected = true;
        config2.lastPing = new Date().toISOString();
        this.servers.set(config.id, config2);
      }

      return this.discoverTools(config.id);
    } catch (err) {
      const config2 = this.servers.get(config.id);
      if (config2) {
        config2.connected = false;
        this.servers.set(config.id, config2);
      }
      throw new Error(`Failed to connect MCP server '${config.name}': ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  // ─── Private: Stdio connection (conceptual — not runnable in Next.js serverless) ───

  private async connectStdio(config: MCPServerConfig): Promise<MCPToolInfo[]> {
    // In a serverless/edge environment, stdio MCP is not directly executable.
    // This is a placeholder that records the config. Actual stdio execution
    // would require a persistent process manager (e.g., via Docker sidecar).
    const config2 = this.servers.get(config.id);
    if (config2) {
      config2.connected = false; // stdio not directly supported in serverless
      config2.lastPing = new Date().toISOString();
      this.servers.set(config.id, config2);
    }
    return [];
  }

  // ─── Private: Send JSON-RPC request ───

  private async sendRequest(serverId: string, method: string, params: Record<string, unknown>): Promise<MCPResponse> {
    const config = this.servers.get(serverId);
    if (!config) throw new Error(`Server not found: ${serverId}`);

    const id = this.nextId++;
    const request: MCPRequest = { jsonrpc: '2.0', id, method, params };

    if (config.transport === 'stdio' || !config.url) {
      return { jsonrpc: '2.0', id, result: { error: 'stdio transport not supported in serverless environment' } };
    }

    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...config.headers },
      body: JSON.stringify(request),
    });

    const data = await response.json();
    return data as MCPResponse;
  }
}

let _mcp: MCPAdapter | null = null;
export function getMCPAdapter(): MCPAdapter {
  if (!_mcp) _mcp = new MCPAdapter();
  return _mcp;
}
