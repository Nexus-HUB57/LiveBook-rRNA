/**
 * CHIMERA v4.0 — MCP Demo Flow Tests
 * Validates the full MCP demo server flow: tool definitions, handlers, and bridge registration.
 */

import {
  DEMO_TOOL_DEFINITIONS,
  createMCPDemoHandlers,
  type MCPToolDefinition,
  type MCPDemoHandlers,
} from '@/lib/agentic/mcp-demo-server';

// ─── Helpers ───

async function callHandler(handlers: MCPDemoHandlers, name: string, args: Record<string, unknown>) {
  const handler = handlers[name];
  if (!handler) throw new Error(`No handler for ${name}`);
  return handler(args);
}

// ─── Tests ───

describe('MCP Demo Server — Tool Definitions', () => {
  it('should export exactly 3 tool definitions', () => {
    expect(DEMO_TOOL_DEFINITIONS).toHaveLength(3);
  });

  it('should have required tool names', () => {
    const names = DEMO_TOOL_DEFINITIONS.map(t => t.name);
    expect(names).toContain('get_weather');
    expect(names).toContain('calculate');
    expect(names).toContain('get_time');
  });

  it('each tool should have a non-empty description', () => {
    for (const tool of DEMO_TOOL_DEFINITIONS) {
      expect(tool.description).toBeTruthy();
      expect(tool.description.length).toBeGreaterThan(10);
    }
  });

  it('each tool should have an object-type inputSchema', () => {
    for (const tool of DEMO_TOOL_DEFINITIONS) {
      expect(tool.inputSchema.type).toBe('object');
      expect(tool.inputSchema.properties).toBeDefined();
    }
  });
});

describe('MCP Demo Server — createMCPDemoHandlers()', () => {
  let handlers: MCPDemoHandlers;

  beforeEach(() => {
    handlers = createMCPDemoHandlers();
  });

  it('should return a handler for each tool name', () => {
    expect(typeof handlers.get_weather).toBe('function');
    expect(typeof handlers.calculate).toBe('function');
    expect(typeof handlers.get_time).toBe('function');
  });

  it('get_weather should return correct structure', async () => {
    const result = await callHandler(handlers, 'get_weather', { city: 'Tokyo' });
    expect(result.city).toBe('Tokyo');
    expect(result.temp).toBe('25C');
    expect(result.condition).toBe('sunny');
    expect(result.humidity).toBe(60);
  });

  it('get_weather should reject missing city', async () => {
    await expect(callHandler(handlers, 'get_weather', {})).rejects.toThrow('"city" is required');
  });

  it('get_time should return ISO datetime string', async () => {
    const result = await callHandler(handlers, 'get_time', {});
    expect(result.timezone).toBe('UTC');
    expect(typeof result.datetime).toBe('string');
    expect(() => new Date(result.datetime as string)).not.toThrow();
  });

  it('get_time should accept a custom timezone', async () => {
    const result = await callHandler(handlers, 'get_time', { timezone: 'America/New_York' });
    expect(result.timezone).toBe('America/New_York');
  });
});

describe('MCP Demo Server — calculate handler', () => {
  let handlers: MCPDemoHandlers;

  beforeEach(() => {
    handlers = createMCPDemoHandlers();
  });

  it('should evaluate addition', async () => {
    const result = await callHandler(handlers, 'calculate', { expression: '2 + 3' });
    expect(result.expression).toBe('2 + 3');
    expect(result.result).toBe(5);
  });

  it('should evaluate multiplication with precedence', async () => {
    const result = await callHandler(handlers, 'calculate', { expression: '2 + 3 * 4' });
    expect(result.result).toBe(14);
  });

  it('should evaluate parentheses', async () => {
    const result = await callHandler(handlers, 'calculate', { expression: '(2 + 3) * 4' });
    expect(result.result).toBe(20);
  });

  it('should evaluate Math.sqrt', async () => {
    const result = await callHandler(handlers, 'calculate', { expression: 'Math.sqrt(16)' });
    expect(result.result).toBe(4);
  });

  it('should reject dangerous expressions', async () => {
    await expect(callHandler(handlers, 'calculate', { expression: 'process.exit()' })).rejects.toThrow('disallowed');
  });

  it('should reject missing expression', async () => {
    await expect(callHandler(handlers, 'calculate', {})).rejects.toThrow('"expression" is required');
  });
});

describe('MCP Demo Bridge — registerDemoMCPServer()', () => {
  it('should register demo tools in the ToolRegistry', () => {
    const { registerDemoMCPServer } = require('@/lib/agentic/mcp-demo-bridge');
    const { getToolRegistry } = require('@/lib/agentic/tool-registry');

    const toolNames = registerDemoMCPServer();

    expect(toolNames).toHaveLength(3);
    expect(toolNames).toContain('demo_get_weather');
    expect(toolNames).toContain('demo_calculate');
    expect(toolNames).toContain('demo_get_time');

    const registry = getToolRegistry();
    const allTools = registry.listAll();
    const demoTools = allTools.filter(t => 'category' in t && t.category === 'mcp-demo');
    expect(demoTools.length).toBeGreaterThanOrEqual(3);
  });
});
