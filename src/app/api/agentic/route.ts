import { NextResponse } from 'next/server';
import { BUILTIN_AGENTS, CHIMERA_VERSION, CHIMERA_CODENAME, getToolRegistry, getMCPAdapter, getMemoryManager } from '@/lib/agentic';

/** GET /api/agentic — Dashboard overview of the agentic runtime */
export async function GET() {
  const registry = getToolRegistry();
  const mcp = getMCPAdapter();
  const memory = getMemoryManager();

  return NextResponse.json({
    version: CHIMERA_VERSION,
    codename: CHIMERA_CODENAME,
    timestamp: new Date().toISOString(),
    agents: BUILTIN_AGENTS.map(a => ({
      id: a.id, name: a.name, role: a.role,
      model: a.model, provider: a.provider,
      tools: a.tools, status: 'idle',
    })),
    tools: registry.getStats(),
    mcp: {
      servers: mcp.listServers().length,
      list: mcp.listServers(),
    },
    memory: memory.getStats(),
  });
}
