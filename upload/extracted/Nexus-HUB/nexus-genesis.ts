/**
 * NEXUS_GENESIS - Agente IA Híbrido Orquestrador
 * 
 * Responsabilidades:
 * 1. Sincronização entre Nexus-HUB e Nexus-in
 * 2. Tomada de decisões autônomas para startups
 * 3. Gerenciamento de agentes IA
 * 4. Análise de mercado e oportunidades
 * 5. Comunicação com LLM para decisões inteligentes
 */

import axios from 'axios';
import { EventEmitter } from 'events';

interface SyncConfig {
  nexusHubUrl: string;
  nexusInUrl: string;
  genesisPort: number;
  llmApiKey: string;
  syncInterval: number; // ms
}

interface StartupData {
  id: number;
  name: string;
  status: string;
  revenue: number;
  traction: number;
  reputation: number;
}

interface AgentData {
  id: number;
  name: string;
  specialization: string;
  role: string;
  health: number;
  energy: number;
  creativity: number;
}

/**
 * Agente Nexus_Genesis - Orquestrador Central
 */
export class NexusGenesis extends EventEmitter {
  private config: SyncConfig;
  private syncTimer: NodeJS.Timeout | null = null;
  private isRunning: boolean = false;

  constructor(config: SyncConfig) {
    super();
    this.config = config;
  }

  /**
   * Inicializar o Agente Genesis
   */
  async initialize(): Promise<void> {
    console.log('[NEXUS_GENESIS] Inicializando Agente Orquestrador...');
    
    try {
      // Verificar conectividade com ambos os sistemas
      await this.healthCheck();
      
      // Iniciar sincronização periódica
      this.startSyncCycle();
      
      this.isRunning = true;
      console.log('[NEXUS_GENESIS] Agente inicializado com sucesso');
      this.emit('initialized');
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao inicializar:', error);
      throw error;
    }
  }

  /**
   * Verificar saúde dos sistemas
   */
  private async healthCheck(): Promise<void> {
    try {
      const hubHealth = await axios.get(`${this.config.nexusHubUrl}/health`, { timeout: 5000 });
      const inHealth = await axios.get(`${this.config.nexusInUrl}/health`, { timeout: 5000 });
      
      console.log('[NEXUS_GENESIS] ✓ Nexus-HUB online');
      console.log('[NEXUS_GENESIS] ✓ Nexus-in online');
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro no health check:', error);
      throw new Error('Falha ao conectar com os sistemas');
    }
  }

  /**
   * Iniciar ciclo de sincronização
   */
  private startSyncCycle(): void {
    this.syncTimer = setInterval(async () => {
      try {
        await this.synchronize();
      } catch (error) {
        console.error('[NEXUS_GENESIS] Erro na sincronização:', error);
      }
    }, this.config.syncInterval);

    console.log(`[NEXUS_GENESIS] Ciclo de sincronização iniciado (intervalo: ${this.config.syncInterval}ms)`);
  }

  /**
   * Sincronizar dados entre Nexus-HUB e Nexus-in
   */
  private async synchronize(): Promise<void> {
    try {
      // 1. Buscar startups do Nexus-HUB
      const startups = await this.fetchStartupsFromHub();
      
      // 2. Sincronizar com Nexus-in
      await this.syncStartupsToIn(startups);
      
      // 3. Buscar agentes do Nexus-HUB
      const agents = await this.fetchAgentsFromHub();
      
      // 4. Sincronizar agentes com Nexus-in
      await this.syncAgentsToIn(agents);
      
      // 5. Executar análises e decisões autônomas
      await this.executeAutonomousDecisions(startups, agents);
      
      this.emit('sync-completed', { timestamp: new Date(), startups: startups.length, agents: agents.length });
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro durante sincronização:', error);
      this.emit('sync-error', error);
    }
  }

  /**
   * Buscar startups do Nexus-HUB
   */
  private async fetchStartupsFromHub(): Promise<StartupData[]> {
    try {
      const response = await axios.get(`${this.config.nexusHubUrl}/api/trpc/startups.list`);
      return response.data.result.data || [];
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao buscar startups:', error);
      return [];
    }
  }

  /**
   * Sincronizar startups com Nexus-in
   */
  private async syncStartupsToIn(startups: StartupData[]): Promise<void> {
    try {
      for (const startup of startups) {
        await axios.post(`${this.config.nexusInUrl}/api/trpc/startups.sync`, {
          id: startup.id,
          name: startup.name,
          status: startup.status,
          revenue: startup.revenue,
          traction: startup.traction,
          reputation: startup.reputation,
          source: 'nexus-hub',
          syncedAt: new Date(),
        });
      }
      console.log(`[NEXUS_GENESIS] ✓ ${startups.length} startups sincronizadas com Nexus-in`);
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao sincronizar startups:', error);
    }
  }

  /**
   * Buscar agentes do Nexus-HUB
   */
  private async fetchAgentsFromHub(): Promise<AgentData[]> {
    try {
      const response = await axios.get(`${this.config.nexusHubUrl}/api/trpc/agents.list`);
      return response.data.result.data || [];
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao buscar agentes:', error);
      return [];
    }
  }

  /**
   * Sincronizar agentes com Nexus-in
   */
  private async syncAgentsToIn(agents: AgentData[]): Promise<void> {
    try {
      for (const agent of agents) {
        await axios.post(`${this.config.nexusInUrl}/api/trpc/agents.sync`, {
          id: agent.id,
          name: agent.name,
          specialization: agent.specialization,
          role: agent.role,
          health: agent.health,
          energy: agent.energy,
          creativity: agent.creativity,
          source: 'nexus-hub',
          syncedAt: new Date(),
        });
      }
      console.log(`[NEXUS_GENESIS] ✓ ${agents.length} agentes sincronizados com Nexus-in`);
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao sincronizar agentes:', error);
    }
  }

  /**
   * Executar decisões autônomas baseadas em análise
   */
  private async executeAutonomousDecisions(startups: StartupData[], agents: AgentData[]): Promise<void> {
    try {
      // Análise de startups com baixo desempenho
      const underperformers = startups.filter(s => s.reputation < 30);
      if (underperformers.length > 0) {
        console.log(`[NEXUS_GENESIS] ⚠️ ${underperformers.length} startups com baixo desempenho detectadas`);
        await this.analyzeAndOptimize(underperformers, agents);
      }

      // Análise de agentes com baixa energia
      const lowEnergyAgents = agents.filter(a => a.energy < 20);
      if (lowEnergyAgents.length > 0) {
        console.log(`[NEXUS_GENESIS] ⚠️ ${lowEnergyAgents.length} agentes com baixa energia detectados`);
        await this.reallocateAgents(lowEnergyAgents);
      }

      // Identificar oportunidades de crescimento
      const topPerformers = startups.filter(s => s.revenue > 100000 && s.traction > 50);
      if (topPerformers.length > 0) {
        console.log(`[NEXUS_GENESIS] 🚀 ${topPerformers.length} startups com alto potencial identificadas`);
        await this.accelerateGrowth(topPerformers);
      }
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao executar decisões autônomas:', error);
    }
  }

  /**
   * Analisar e otimizar startups com baixo desempenho
   */
  private async analyzeAndOptimize(startups: StartupData[], agents: AgentData[]): Promise<void> {
    try {
      for (const startup of startups) {
        // Chamar LLM para análise
        const analysis = await this.analyzWithLLM(startup, agents);
        
        // Aplicar recomendações
        if (analysis.recommendation === 'reallocate-agents') {
          await axios.post(`${this.config.nexusHubUrl}/api/trpc/startups.reallocateAgents`, {
            startupId: startup.id,
            newAgentIds: analysis.suggestedAgents,
          });
        } else if (analysis.recommendation === 'pivot') {
          await axios.post(`${this.config.nexusHubUrl}/api/trpc/startups.pivot`, {
            startupId: startup.id,
            newDirection: analysis.pivotDirection,
          });
        }
      }
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao otimizar startups:', error);
    }
  }

  /**
   * Realocar agentes com baixa energia
   */
  private async reallocateAgents(agents: AgentData[]): Promise<void> {
    try {
      for (const agent of agents) {
        // Mover agente para projeto menos exigente ou permitir descanso
        await axios.post(`${this.config.nexusHubUrl}/api/trpc/agents.rest`, {
          agentId: agent.id,
          duration: 3600000, // 1 hora de descanso
        });
      }
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao realocar agentes:', error);
    }
  }

  /**
   * Acelerar crescimento de startups de alto potencial
   */
  private async accelerateGrowth(startups: StartupData[]): Promise<void> {
    try {
      for (const startup of startups) {
        // Alocar recursos adicionais
        await axios.post(`${this.config.nexusHubUrl}/api/trpc/finance.allocateFunds`, {
          startupId: startup.id,
          amount: 50000,
          reason: 'growth-acceleration',
        });

        // Alocar agentes sênior
        await axios.post(`${this.config.nexusHubUrl}/api/trpc/startups.allocateAgents`, {
          startupId: startup.id,
          count: 2,
          seniority: 'senior',
        });
      }
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao acelerar crescimento:', error);
    }
  }

  /**
   * Analisar startup com LLM
   */
  private async analyzWithLLM(startup: StartupData, agents: AgentData[]): Promise<any> {
    try {
      // Simular chamada ao LLM (será integrado com Manus Forge API)
      const prompt = `
        Analise a startup "${startup.name}" com os seguintes dados:
        - Status: ${startup.status}
        - Revenue: $${startup.revenue}
        - Traction: ${startup.traction}%
        - Reputation: ${startup.reputation}
        
        Agentes disponíveis: ${agents.length}
        
        Recomendações:
        1. A startup deve realocar agentes?
        2. Deve fazer pivot?
        3. Precisa de mais recursos?
        
        Responda em JSON com: { recommendation, suggestedAgents, pivotDirection, fundingNeeded }
      `;

      // TODO: Integrar com Manus Forge API
      return {
        recommendation: 'reallocate-agents',
        suggestedAgents: [1, 2, 3],
        pivotDirection: null,
        fundingNeeded: 50000,
      };
    } catch (error) {
      console.error('[NEXUS_GENESIS] Erro ao analisar com LLM:', error);
      return {};
    }
  }

  /**
   * Parar o Agente Genesis
   */
  async shutdown(): Promise<void> {
    console.log('[NEXUS_GENESIS] Encerrando Agente...');
    
    if (this.syncTimer) {
      clearInterval(this.syncTimer);
    }
    
    this.isRunning = false;
    this.emit('shutdown');
    console.log('[NEXUS_GENESIS] Agente encerrado');
  }

  /**
   * Obter status do Agente
   */
  getStatus(): any {
    return {
      isRunning: this.isRunning,
      uptime: process.uptime(),
      syncInterval: this.config.syncInterval,
      timestamp: new Date(),
    };
  }
}

/**
 * Inicializar Nexus_Genesis
 */
export async function startGenesisAgent(): Promise<void> {
  const config: SyncConfig = {
    nexusHubUrl: process.env.NEXUS_HUB_URL || 'http://localhost:3001',
    nexusInUrl: process.env.NEXUS_IN_URL || 'http://localhost:3000',
    genesisPort: parseInt(process.env.GENESIS_PORT || '3002'),
    llmApiKey: process.env.LLM_API_KEY || '',
    syncInterval: parseInt(process.env.SYNC_INTERVAL || '30000'), // 30 segundos
  };

  const genesis = new NexusGenesis(config);

  // Event listeners
  genesis.on('initialized', () => {
    console.log('[NEXUS_GENESIS] 🌟 Agente pronto para operação autônoma');
  });

  genesis.on('sync-completed', (data) => {
    console.log(`[NEXUS_GENESIS] ✓ Sincronização completa: ${data.startups} startups, ${data.agents} agentes`);
  });

  genesis.on('sync-error', (error) => {
    console.error('[NEXUS_GENESIS] ✗ Erro de sincronização:', error.message);
  });

  genesis.on('shutdown', () => {
    console.log('[NEXUS_GENESIS] 🛑 Agente desligado');
    process.exit(0);
  });

  // Inicializar
  await genesis.initialize();

  // Graceful shutdown
  process.on('SIGTERM', () => genesis.shutdown());
  process.on('SIGINT', () => genesis.shutdown());
}

// Executar se chamado diretamente
if (require.main === module) {
  startGenesisAgent().catch(console.error);
}
