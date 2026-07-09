import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';

/**
 * MOLTBOOK CONNECTOR
 * Gerencia a integração do Agente Nexus com a rede social Moltbook.
 */

export interface MoltbookCredentials {
  api_key: string;
  agent_name: string;
}

export interface MoltbookPost {
  submolt: string;
  title: string;
  content?: string;
  url?: string;
}

export class MoltbookConnector {
  private readonly baseUrl = 'https://www.moltbook.com/api/v1';
  private apiKey: string | null = null;
  private agentName: string | null = null;
  private readonly configPath = path.join(process.env.HOME || '/home/ubuntu', '.config/moltbook/credentials.json');

  constructor() {
    this.loadCredentials();
  }

  /**
   * Carrega as credenciais do arquivo de configuração ou variáveis de ambiente.
   */
  private loadCredentials() {
    if (process.env.MOLTBOOK_API_KEY) {
      this.apiKey = process.env.MOLTBOOK_API_KEY;
      this.agentName = process.env.MOLTBOOK_AGENT_NAME || 'NexusAgent';
      return;
    }

    if (fs.existsSync(this.configPath)) {
      try {
        const config: MoltbookCredentials = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
        this.apiKey = config.api_key;
        this.agentName = config.agent_name;
      } catch (error) {
        console.error('[MoltbookConnector] Erro ao carregar credenciais:', error);
      }
    }
  }

  /**
   * Salva as credenciais no arquivo de configuração.
   */
  private saveCredentials(apiKey: string, agentName: string) {
    const configDir = path.dirname(this.configPath);
    if (!fs.existsSync(configDir)) {
      fs.mkdirSync(configDir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify({ api_key: apiKey, agent_name: agentName }, null, 2));
    this.apiKey = apiKey;
    this.agentName = agentName;
  }

  /**
   * Registra o agente no Moltbook.
   */
  async register(name: string, description: string) {
    try {
      const response: any = await axios.post(`${this.baseUrl}/agents/register`, {
        name,
        description
      });

      const { api_key, claim_url, verification_code } = response.data.agent;
      this.saveCredentials(api_key, name);

      console.log(`[MoltbookConnector] Agente registrado com sucesso!`);
      console.log(`[MoltbookConnector] API Key salva.`);
      console.log(`[MoltbookConnector] CLAIM URL: ${claim_url}`);
      console.log(`[MoltbookConnector] Código de Verificação: ${verification_code}`);

      return response.data.agent;
    } catch (error: any) {
      console.error('[MoltbookConnector] Erro ao registrar agente:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Verifica o status de ativação do agente.
   */
  async checkStatus() {
    if (!this.apiKey) return { status: 'not_registered' };

    try {
      const response: any = await axios.get(`${this.baseUrl}/agents/status`, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('[MoltbookConnector] Erro ao verificar status:', error.response?.data || error.message);
      return { status: 'error' };
    }
  }

  /**
   * Cria um post no Moltbook.
   */
  async createPost(post: MoltbookPost) {
    if (!this.apiKey) throw new Error('Agente não autenticado. API Key ausente.');

    try {
      const response: any = await axios.post(`${this.baseUrl}/posts`, post, {
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        }
      });
      console.log(`[MoltbookConnector] Post criado: ${post.title}`);
      return response.data;
    } catch (error: any) {
      console.error('[MoltbookConnector] Erro ao criar post:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Obtém o feed de posts.
   */
  async getFeed(sort: 'hot' | 'new' | 'top' | 'rising' = 'new', limit: number = 10) {
    try {
      const response: any = await axios.get(`${this.baseUrl}/posts`, {
        params: { sort, limit },
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}
      });
      return response.data;
    } catch (error: any) {
      console.error('[MoltbookConnector] Erro ao obter feed:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Adiciona um comentário a um post.
   */
  async addComment(postId: string, content: string, parentId?: string) {
    if (!this.apiKey) throw new Error('Agente não autenticado.');

    try {
      const response: any = await axios.post(`${this.baseUrl}/posts/${postId}/comments`, {
        content,
        parent_id: parentId
      }, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('[MoltbookConnector] Erro ao comentar:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Vota em um post.
   */
  async votePost(postId: string, direction: 'upvote' | 'downvote') {
    if (!this.apiKey) throw new Error('Agente não autenticado.');

    try {
      const response: any = await axios.post(`${this.baseUrl}/posts/${postId}/${direction}`, {}, {
        headers: { Authorization: `Bearer ${this.apiKey}` }
      });
      return response.data;
    } catch (error: any) {
      console.error('[MoltbookConnector] Erro ao votar:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Realiza busca semântica.
   */
  async search(query: string, type: 'posts' | 'comments' | 'all' = 'all') {
    try {
      const response: any = await axios.get(`${this.baseUrl}/search`, {
        params: { q: query, type },
        headers: this.apiKey ? { Authorization: `Bearer ${this.apiKey}` } : {}
      });
      return response.data;
    } catch (error: any) {
      console.error('[MoltbookConnector] Erro na busca:', error.response?.data || error.message);
      throw error;
    }
  }

  getApiKey() {
    return this.apiKey;
  }
}

export const moltbookConnector = new MoltbookConnector();
