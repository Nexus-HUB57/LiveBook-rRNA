/**
 * CHIMERA v4.0 — Tool Registry
 * Central registry for native tools and MCP-discovered tools.
 */

import type { ToolDefinition, MCPToolInfo, MCPServerConfig } from './types';
import { v4 as uuid } from 'uuid';

// ─── Native Tool Definitions ───

export const NATIVE_TOOLS: ToolDefinition[] = [
  {
    id: 'tool-web-search',
    name: 'web_search',
    description: 'Search the web for real-time information. Returns relevant URLs, titles, and snippets.',
    inputSchema: {
      type: 'object',
      properties: { query: { type: 'string', description: 'Search query' }, maxResults: { type: 'number', default: 5 } },
      required: ['query']
    },
    handler: 'web-search',
    category: 'research',
    timeoutMs: 15000,
  },
  {
    id: 'tool-web-reader',
    name: 'web_reader',
    description: 'Extract and read content from a web page URL. Returns title, HTML content, and metadata.',
    inputSchema: {
      type: 'object',
      properties: { url: { type: 'string', description: 'URL to read' } },
      required: ['url']
    },
    handler: 'web-reader',
    category: 'research',
    timeoutMs: 20000,
  },
  {
    id: 'tool-code-executor',
    name: 'code_executor',
    description: 'Execute JavaScript/TypeScript code in a sandboxed environment. Returns stdout, stderr, and exit code.',
    inputSchema: {
      type: 'object',
      properties: {
        code: { type: 'string', description: 'Code to execute' },
        language: { type: 'string', enum: ['javascript', 'typescript'], default: 'javascript' },
        timeout: { type: 'number', default: 30000 }
      },
      required: ['code']
    },
    handler: 'code-executor',
    category: 'execution',
    timeoutMs: 35000,
  },
  {
    id: 'tool-image-generator',
    name: 'image_generator',
    description: 'Generate images from text descriptions using AI. Returns base64-encoded image data.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Image description' },
        size: { type: 'string', enum: ['256x256', '512x512', '1024x1024'], default: '512x512' }
      },
      required: ['prompt']
    },
    handler: 'image-generation',
    category: 'creative',
    timeoutMs: 60000,
  },
  {
    id: 'tool-file-reader',
    name: 'file_reader',
    description: 'Read file contents from the project filesystem. Supports text files up to 1MB.',
    inputSchema: {
      type: 'object',
      properties: { path: { type: 'string', description: 'File path to read' } },
      required: ['path']
    },
    handler: 'file-reader',
    category: 'system',
    timeoutMs: 5000,
  },
  {
    id: 'tool-file-writer',
    name: 'file_writer',
    description: 'Write content to a file in the project filesystem. Creates parent directories if needed.',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path to write' },
        content: { type: 'string', description: 'Content to write' }
      },
      required: ['path', 'content']
    },
    handler: 'file-writer',
    category: 'system',
    timeoutMs: 10000,
  },
  {
    id: 'tool-rag-query',
    name: 'rag_query',
    description: 'Query the RAG (Retrieval-Augmented Generation) knowledge base for relevant context.',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        topK: { type: 'number', default: 5 },
        agentSlug: { type: 'string', description: 'Optional agent to scope the search' }
      },
      required: ['query']
    },
    handler: 'rag-query',
    category: 'knowledge',
    timeoutMs: 10000,
  },
  {
    id: 'tool-llm-call',
    name: 'llm_call',
    description: 'Call another LLM model directly for sub-tasks. Useful for getting a second opinion or using specialized models.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'Prompt to send' },
        model: { type: 'string', description: 'Model ID (e.g. glm-4-flash, gpt-4o)' },
        provider: { type: 'string', description: 'Provider name' }
      },
      required: ['prompt']
    },
    handler: 'llm-call',
    category: 'ai',
    timeoutMs: 30000,
  },
  {
    id: 'tool-tts',
    name: 'text_to_speech',
    description: 'Convert text to speech audio. Returns base64-encoded audio data.',
    inputSchema: {
      type: 'object',
      properties: {
        text: { type: 'string', description: 'Text to convert' },
        voice: { type: 'string', default: 'alloy' }
      },
      required: ['text']
    },
    handler: 'tts',
    category: 'media',
    timeoutMs: 15000,
  },
  {
    id: 'tool-vlm-analyze',
    name: 'vlm_analyze',
    description: 'Analyze images using vision-language models. Describe content, extract text, or answer questions about images.',
    inputSchema: {
      type: 'object',
      properties: {
        image: { type: 'string', description: 'Base64-encoded image or URL' },
        question: { type: 'string', description: 'Question about the image' }
      },
      required: ['image']
    },
    handler: 'vlm',
    category: 'perception',
    timeoutMs: 20000,
  },
];

// ─── Tool Registry Class ───

export class ToolRegistry {
  private tools: Map<string, ToolDefinition> = new Map();
  private mcpTools: Map<string, MCPToolInfo> = new Map();
  private handlers: Map<string, (args: Record<string, unknown>) => Promise<unknown>> = new Map();

  constructor() {
    for (const tool of NATIVE_TOOLS) {
      this.tools.set(tool.id, tool);
    }
  }

  /** Register a native tool */
  registerTool(tool: ToolDefinition): void {
    this.tools.set(tool.id, tool);
  }

  /** Register a handler function for a tool */
  registerHandler(toolId: string, handler: (args: Record<string, unknown>) => Promise<unknown>): void {
    this.handlers.set(toolId, handler);
  }

  /** Register MCP-discovered tools */
  registerMCPTools(serverId: string, tools: MCPToolInfo[]): void {
    for (const tool of tools) {
      this.mcpTools.set(`${serverId}:${tool.name}`, tool);
    }
  }

  /** Remove MCP tools from a server */
  unregisterMCPServer(serverId: string): void {
    for (const [key, tool] of this.mcpTools) {
      if (tool.serverId === serverId) {
        this.mcpTools.delete(key);
      }
    }
  }

  /** Get a tool by ID (checks native first, then MCP) */
  getTool(id: string): ToolDefinition | undefined {
    return this.tools.get(id);
  }

  /** Get MCP tool by serverId:toolName */
  getMCPTool(key: string): MCPToolInfo | undefined {
    return this.mcpTools.get(key);
  }

  /** List all tools available to a given agent (by tool IDs) */
  getToolsForAgent(toolIds?: string[]): ToolDefinition[] {
    if (!toolIds || toolIds.length === 0) {
      return Array.from(this.tools.values());
    }
    return toolIds
      .map(id => this.tools.get(id))
      .filter((t): t is ToolDefinition => t !== undefined);
  }

  /** Get all tools as OpenAI function-calling format */
  getToolsAsFunctions(toolIds?: string[]): Array<{
    type: 'function';
    function: { name: string; description: string; parameters: Record<string, unknown> };
  }> {
    const tools = this.getToolsForAgent(toolIds);
    return tools.map(tool => ({
      type: 'function' as const,
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));
  }

  /** Execute a native tool by ID */
  async executeTool(toolId: string, args: Record<string, unknown>): Promise<unknown> {
    const tool = this.tools.get(toolId);
    if (!tool) throw new Error(`Tool not found: ${toolId}`);

    const handler = this.handlers.get(tool.handler);
    if (!handler) {
      // Return a placeholder result — actual handlers are wired per deployment
      return {
        tool: tool.name,
        status: 'handler_not_wired',
        message: `Handler '${tool.handler}' not registered. Wire it via registerHandler().`,
        receivedArgs: args,
      };
    }

    return handler(args);
  }

  /** Get registry stats */
  getStats() {
    return {
      nativeTools: this.tools.size,
      mcpTools: this.mcpTools.size,
      registeredHandlers: this.handlers.size,
      toolNames: Array.from(this.tools.values()).map(t => t.name),
    };
  }

  /** List all registered tools with details */
  listAll(): Array<ToolDefinition & { isMCP: false } | MCPToolInfo & { isMCP: true }> {
    const native = Array.from(this.tools.values()).map(t => ({ ...t, isMCP: false as const }));
    const mcp = Array.from(this.mcpTools.values()).map(t => ({ ...t, isMCP: true as const }));
    return [...native, ...mcp];
  }
}

// Singleton
let _registry: ToolRegistry | null = null;
export function getToolRegistry(): ToolRegistry {
  if (!_registry) _registry = new ToolRegistry();
  return _registry;
}
