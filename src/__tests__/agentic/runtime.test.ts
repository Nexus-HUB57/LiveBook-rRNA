/**
 * CHIMERA v4.0 — Agentic Runtime Tests
 */

import { ToolRegistry, NATIVE_TOOLS, MemoryManager, AgentEventBus, MCPAdapter, BUILTIN_AGENTS, CHIMERA_VERSION, CHIMERA_CODENAME } from '@/lib/agentic';

describe('CHIMERA v4.0 — Última Onda Agentic AI', () => {
  describe('Version & Identity', () => {
    it('should export correct version', () => {
      expect(CHIMERA_VERSION).toBe('4.0.0');
    });
    it('should export correct codename', () => {
      expect(CHIMERA_CODENAME).toBe('Última Onda Agentic AI');
    });
  });

  describe('ToolRegistry', () => {
    let registry: ToolRegistry;
    beforeEach(() => {
      registry = new ToolRegistry();
    });

    it('should initialize with 10 native tools', () => {
      expect(registry.getStats().nativeTools).toBe(10);
    });

    it('should register and retrieve a custom tool', () => {
      registry.registerTool({
        id: 'test-tool', name: 'test_tool', description: 'A test',
        inputSchema: { type: 'object' }, handler: 'test',
      });
      expect(registry.getTool('test-tool')).toBeDefined();
      expect(registry.getStats().nativeTools).toBe(11);
    });

    it('should get tools for agent by IDs', () => {
      const tools = registry.getToolsForAgent(['tool-web-search', 'tool-code-executor']);
      expect(tools).toHaveLength(2);
      expect(tools[0].name).toBe('web_search');
      expect(tools[1].name).toBe('code_executor');
    });

    it('should return all tools when no IDs specified', () => {
      const tools = registry.getToolsForAgent([]);
      expect(tools).toHaveLength(10);
    });

    it('should convert tools to OpenAI function format', () => {
      const fns = registry.getToolsAsFunctions(['tool-web-search']);
      expect(fns).toHaveLength(1);
      expect(fns[0].type).toBe('function');
      expect(fns[0].function.name).toBe('web_search');
      expect(fns[0].function.parameters).toBeDefined();
    });

    it('should execute tool with placeholder when no handler wired', async () => {
      const result = await registry.executeTool('tool-web-search', { query: 'test' });
      expect(result).toBeDefined();
      expect((result as Record<string, unknown>).status).toBe('handler_not_wired');
    });

    it('should execute tool with registered handler', async () => {
      registry.registerHandler('web-search', async (args) => ({ searched: args.query }));
      const result = await registry.executeTool('tool-web-search', { query: 'test' });
      expect((result as Record<string, unknown>).searched).toBe('test');
    });

    it('should list all tools with isMCP flag', () => {
      const all = registry.listAll();
      expect(all.length).toBeGreaterThanOrEqual(10);
      all.forEach(t => expect(t).toHaveProperty('isMCP'));
    });

    it('should register and unregister MCP tools', () => {
      registry.registerMCPTools('srv1', [
        { name: 'mcp_tool', description: 'test', inputSchema: { type: 'object' }, serverId: 'srv1' },
      ]);
      expect(registry.getStats().mcpTools).toBe(1);
      registry.unregisterMCPServer('srv1');
      expect(registry.getStats().mcpTools).toBe(0);
    });

    it('should return stats', () => {
      const stats = registry.getStats();
      expect(stats).toHaveProperty('nativeTools');
      expect(stats).toHaveProperty('mcpTools');
      expect(stats).toHaveProperty('registeredHandlers');
      expect(stats).toHaveProperty('toolNames');
    });
  });

  describe('MemoryManager', () => {
    let mm: MemoryManager;
    beforeEach(() => { mm = new MemoryManager(100); });

    it('should create a memory entry', () => {
      const m = mm.create({ agentId: 'a1', type: 'episodic', content: 'Test memory' });
      expect(m.id).toBeDefined();
      expect(m.agentId).toBe('a1');
      expect(m.importance).toBeGreaterThan(0);
    });

    it('should retrieve a memory by ID', () => {
      const m = mm.create({ agentId: 'a1', type: 'semantic', content: 'Find me' });
      const found = mm.get(m.id);
      expect(found).toBeDefined();
      expect(found!.content).toBe('Find me');
      expect(found!.accessCount).toBe(1);
    });

    it('should query memories by agent', () => {
      mm.create({ agentId: 'a1', type: 'episodic', content: 'Alpha' });
      mm.create({ agentId: 'a2', type: 'episodic', content: 'Beta' });
      mm.create({ agentId: 'a1', type: 'semantic', content: 'Gamma' });
      const results = mm.query({ agentId: 'a1' });
      expect(results).toHaveLength(2);
    });

    it('should query memories by type', () => {
      mm.create({ agentId: 'a1', type: 'episodic', content: 'E1' });
      mm.create({ agentId: 'a1', type: 'semantic', content: 'S1' });
      mm.create({ agentId: 'a1', type: 'procedural', content: 'P1' });
      const results = mm.query({ agentId: 'a1', type: 'semantic' });
      expect(results).toHaveLength(1);
      expect(results[0].type).toBe('semantic');
    });

    it('should rank by keyword relevance', () => {
      mm.create({ agentId: 'a1', type: 'episodic', content: 'The quick brown fox jumps' });
      mm.create({ agentId: 'a1', type: 'episodic', content: 'A different story entirely' });
      const results = mm.query({ agentId: 'a1', query: 'brown fox' });
      expect(results).toHaveLength(1);
      expect(results[0].content).toContain('brown fox');
    });

    it('should respect query limit', () => {
      for (let i = 0; i < 10; i++) {
        mm.create({ agentId: 'a1', type: 'episodic', content: `Memory ${i}` });
      }
      const results = mm.query({ agentId: 'a1', limit: 3 });
      expect(results).toHaveLength(3);
    });

    it('should build context string for LLM', () => {
      mm.create({ agentId: 'a1', type: 'working', content: 'Important context' });
      mm.create({ agentId: 'a1', type: 'semantic', content: 'Knowledge base info' });
      const ctx = mm.buildContext('a1');
      expect(ctx).toContain('Relevant Memory');
      expect(ctx).toContain('Important context');
    });

    it('should delete a memory', () => {
      const m = mm.create({ agentId: 'a1', type: 'episodic', content: 'Delete me' });
      expect(mm.get(m.id)).toBeDefined();
      mm.delete(m.id);
      expect(mm.get(m.id)).toBeUndefined();
    });

    it('should clear all memories for an agent', () => {
      mm.create({ agentId: 'a1', type: 'episodic', content: 'A' });
      mm.create({ agentId: 'a1', type: 'semantic', content: 'B' });
      mm.create({ agentId: 'a2', type: 'episodic', content: 'C' });
      const deleted = mm.clearAgent('a1');
      expect(deleted).toBe(2);
      expect(mm.query({ agentId: 'a1' })).toHaveLength(0);
      expect(mm.query({ agentId: 'a2' })).toHaveLength(1);
    });

    it('should evict low-importance memories at capacity', () => {
      const small = new MemoryManager(3);
      small.create({ agentId: 'a1', type: 'working', content: 'W1' });
      small.create({ agentId: 'a1', type: 'working', content: 'W2' });
      small.create({ agentId: 'a1', type: 'working', content: 'W3' });
      small.create({ agentId: 'a1', type: 'working', content: 'W4' }); // should evict oldest
      expect(small.getStats().total).toBe(3);
    });

    it('should decay non-semantic memories', () => {
      const m = mm.create({ agentId: 'a1', type: 'episodic', content: 'Decay me', importance: 0.8 });
      mm.decay();
      const updated = mm.get(m.id);
      expect(updated!.importance).toBeLessThan(0.8);
    });

    it('should return stats', () => {
      mm.create({ agentId: 'a1', type: 'episodic', content: 'E' });
      mm.create({ agentId: 'a2', type: 'semantic', content: 'S' });
      const stats = mm.getStats();
      expect(stats.total).toBe(2);
      expect(stats.byType.episodic).toBe(1);
      expect(stats.byAgent.a1).toBe(1);
    });
  });

  describe('AgentEventBus', () => {
    it('should emit and receive events', () => {
      const bus = AgentEventBus.getInstance();
      const received: string[] = [];
      bus.on('agent.status_change', (e) => received.push(e.type));
      bus.emit({ type: 'agent.status_change', payload: { status: 'thinking' }, timestamp: new Date().toISOString() });
      expect(received).toHaveLength(1);
      expect(received[0]).toBe('agent.status_change');
    });

    it('should support global handlers', () => {
      const bus = AgentEventBus.getInstance();
      const all: string[] = [];
      const unsub = bus.onAny((e) => all.push(e.type));
      bus.emit({ type: 'agent.tool_call', payload: {}, timestamp: new Date().toISOString() });
      bus.emit({ type: 'memory.created', payload: {}, timestamp: new Date().toISOString() });
      expect(all).toHaveLength(2);
      unsub();
    });

    it('should buffer recent events', () => {
      const bus = AgentEventBus.getInstance();
      for (let i = 0; i < 5; i++) {
        bus.emit({ type: 'agent.thinking', payload: { i }, timestamp: new Date().toISOString() });
      }
      const recent = bus.getRecent(3);
      expect(recent).toHaveLength(3);
    });

    it('should filter recent events by type', () => {
      const bus = AgentEventBus.getInstance();
      bus.emit({ type: 'agent.thinking', payload: {}, timestamp: new Date().toISOString() });
      bus.emit({ type: 'agent.tool_call', payload: {}, timestamp: new Date().toISOString() });
      bus.emit({ type: 'agent.thinking', payload: {}, timestamp: new Date().toISOString() });
      const thinking = bus.getRecent(100, 'agent.thinking');
      expect(thinking.every(e => e.type === 'agent.thinking')).toBe(true);
    });

    it('should return bus stats', () => {
      const stats = AgentEventBus.getInstance().getStats();
      expect(stats).toHaveProperty('bufferSize');
      expect(stats).toHaveProperty('maxBufferSize');
      expect(stats).toHaveProperty('sseClients');
    });
  });

  describe('MCPAdapter', () => {
    it('should register and list servers', () => {
      const mcp = new MCPAdapter();
      mcp.registerServer({ id: 's1', name: 'Test Server', transport: 'sse', enabled: true, connected: false });
      const servers = mcp.listServers();
      expect(servers).toHaveLength(1);
      expect(servers[0].name).toBe('Test Server');
    });

    it('should unregister servers', () => {
      const mcp = new MCPAdapter();
      mcp.registerServer({ id: 's1', name: 'S1', transport: 'sse', enabled: true, connected: false });
      mcp.unregisterServer('s1');
      expect(mcp.listServers()).toHaveLength(0);
    });

    it('should get server status', () => {
      const mcp = new MCPAdapter();
      mcp.registerServer({ id: 's1', name: 'S1', transport: 'sse', enabled: true, connected: false });
      const status = mcp.getServerStatus('s1');
      expect(status).toBeDefined();
      expect(status!.name).toBe('S1');
    });
  });

  describe('BUILTIN_AGENTS', () => {
    it('should have 4 built-in agents', () => {
      expect(BUILTIN_AGENTS).toHaveLength(4);
    });

    it('should have orchestrator as first agent', () => {
      expect(BUILTIN_AGENTS[0].id).toBe('agentica-orchestrator');
      expect(BUILTIN_AGENTS[0].role).toBe('orchestrator');
    });

    it('should have required agent roles', () => {
      const roles = BUILTIN_AGENTS.map(a => a.role);
      expect(roles).toContain('orchestrator');
      expect(roles).toContain('researcher');
      expect(roles).toContain('coder');
      expect(roles).toContain('analyst');
    });

    it('all agents should have tools, model, and provider', () => {
      for (const agent of BUILTIN_AGENTS) {
        expect(agent.tools).toBeDefined();
        expect(agent.model).toBeTruthy();
        expect(agent.provider).toBeTruthy();
        expect(agent.systemPrompt).toBeTruthy();
      }
    });
  });
});