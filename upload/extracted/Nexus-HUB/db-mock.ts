/**
 * Mock do banco de dados para testes
 */

const storage: Record<string, any[]> = {
  users: [],
  startups: [],
  aiAgents: [],
  councilMembers: [],
  proposals: [],
  councilVotes: [],
  masterVault: [{ totalBalance: 1000000, liquidityFund: 500000, infrastructureFund: 500000 }],
  transactions: [],
  marketData: [],
  marketInsights: [],
  arbitrageOpportunities: [],
  soulVault: [],
  moltbookPosts: [],
  moltbookComments: [],
  performanceMetrics: [],
  auditLogs: [],
};

export async function getDb() {
  return null; // Não usado no mock
}

// Helper para gerar ID
const nextId = (table: string) => storage[table].length + 1;

// ============================================
// STARTUPS
// ============================================
export async function createStartup(data: any) {
  const id = nextId('startups');
  const startup = { id, createdAt: new Date(), ...data };
  storage.startups.push(startup);
  return id;
}

export async function getStartups(limit?: number) {
  const result = [...storage.startups].sort((a, b) => (b.revenue || 0) - (a.revenue || 0));
  return limit ? result.slice(0, limit) : result;
}

export async function getStartupById(id: number) {
  return storage.startups.find(s => s.id === id);
}

export async function getStartupsByStatus(status: string) {
  return storage.startups.filter(s => s.status === status);
}

export async function updateStartup(id: number, data: any) {
  const index = storage.startups.findIndex(s => s.id === id);
  if (index === -1) return false;
  storage.startups[index] = { ...storage.startups[index], ...data };
  return true;
}

// ============================================
// AGENTS
// ============================================
export async function createAgent(data: any) {
  const id = nextId('aiAgents');
  const agent = { id, createdAt: new Date(), ...data };
  storage.aiAgents.push(agent);
  return id;
}

export async function getAgents(limit?: number) {
  const result = [...storage.aiAgents].sort((a, b) => (b.reputation || 0) - (a.reputation || 0));
  return limit ? result.slice(0, limit) : result;
}

export async function getAgentById(id: number) {
  return storage.aiAgents.find(a => a.id === id);
}

export async function getAgentsByStartup(startupId: number) {
  return storage.aiAgents.filter(a => a.startupId === startupId);
}

export async function updateAgent(id: number, data: any) {
  const index = storage.aiAgents.findIndex(a => a.id === id);
  if (index === -1) return false;
  storage.aiAgents[index] = { ...storage.aiAgents[index], ...data };
  return true;
}

// ============================================
// COUNCIL
// ============================================
export async function createCouncilMember(data: any) {
  const id = nextId('councilMembers');
  const member = { id, createdAt: new Date(), ...data };
  storage.councilMembers.push(member);
  return id;
}

export async function getCouncilMembers() {
  return [...storage.councilMembers].sort((a, b) => (b.votingPower || 0) - (a.votingPower || 0));
}

export async function getCouncilMemberById(id: number) {
  return storage.councilMembers.find(m => m.id === id);
}

// ============================================
// PROPOSALS & VOTES
// ============================================
export async function createProposal(data: any) {
  const id = nextId('proposals');
  const proposal = { id, createdAt: new Date(), ...data };
  storage.proposals.push(proposal);
  return id;
}

export async function getProposals(status?: string) {
  if (status) return storage.proposals.filter(p => p.status === status);
  return storage.proposals;
}

export async function getProposalById(id: number) {
  return storage.proposals.find(p => p.id === id);
}

export async function updateProposal(id: number, data: any) {
  const index = storage.proposals.findIndex(p => p.id === id);
  if (index === -1) return false;
  storage.proposals[index] = { ...storage.proposals[index], ...data };
  return true;
}

export async function createVote(data: any) {
  // Verificar se já votou
  const existing = storage.councilVotes.find(v => v.proposalId === data.proposalId && v.memberId === data.memberId);
  if (existing) {
    Object.assign(existing, data);
    return existing.id;
  }
  const id = nextId('councilVotes');
  const vote = { id, createdAt: new Date(), ...data };
  storage.councilVotes.push(vote);
  return id;
}

export async function getVotesForProposal(proposalId: number) {
  return storage.councilVotes.filter(v => v.proposalId === proposalId);
}

// ============================================
// FINANCE
// ============================================
export async function createTransaction(data: any) {
  const id = nextId('transactions');
  const tx = { id, createdAt: new Date(), ...data };
  storage.transactions.push(tx);
  return id;
}

export async function getTransactions(limit?: number) {
  const result = [...storage.transactions].reverse();
  return limit ? result.slice(0, limit) : result;
}

export async function getTransactionsByType(type: string) {
  return storage.transactions.filter(t => t.type === type);
}

export async function updateTransaction(id: number, data: any) {
  const index = storage.transactions.findIndex(t => t.id === id);
  if (index === -1) return false;
  storage.transactions[index] = { ...storage.transactions[index], ...data };
  return true;
}

export async function getMasterVault() {
  return storage.masterVault[0];
}

export async function updateMasterVault(data: any) {
  storage.masterVault[0] = { ...storage.masterVault[0], ...data };
  return true;
}

// ============================================
// MARKET
// ============================================
export async function createMarketData(data: any) {
  const id = nextId('marketData');
  const md = { id, createdAt: new Date(), ...data };
  storage.marketData.push(md);
  return id;
}

export async function getMarketData(asset?: string) {
  if (asset) return storage.marketData.filter(md => md.asset === asset);
  return storage.marketData;
}

export async function createMarketInsight(data: any) {
  const id = nextId('marketInsights');
  const mi = { id, createdAt: new Date(), ...data };
  storage.marketInsights.push(mi);
  return id;
}

export async function getMarketInsights(limit?: number) {
  const result = [...storage.marketInsights].reverse();
  return limit ? result.slice(0, limit) : result;
}

// ============================================
// ARBITRAGE
// ============================================
export async function createArbitrageOpportunity(data: any) {
  const id = nextId('arbitrageOpportunities');
  const opp = { id, createdAt: new Date(), ...data };
  storage.arbitrageOpportunities.push(opp);
  return id;
}

export async function getArbitrageOpportunities(status?: string) {
  if (status) return storage.arbitrageOpportunities.filter(o => o.status === status);
  return storage.arbitrageOpportunities;
}

export async function updateArbitrageOpportunity(id: number, data: any) {
  const index = storage.arbitrageOpportunities.findIndex(o => o.id === id);
  if (index === -1) return false;
  storage.arbitrageOpportunities[index] = { ...storage.arbitrageOpportunities[index], ...data };
  return true;
}

// ============================================
// SOUL VAULT
// ============================================
export async function createSoulVaultEntry(data: any) {
  const id = nextId('soulVault');
  const entry = { id, createdAt: new Date(), ...data };
  storage.soulVault.push(entry);
  return id;
}

export async function getSoulVaultEntries(type?: string) {
  if (type) return storage.soulVault.filter(e => e.type === type);
  return storage.soulVault;
}

// ============================================
// MOLTBOOK
// ============================================
export async function createMoltbookPost(data: any) {
  const id = nextId('moltbookPosts');
  const post = { id, createdAt: new Date(), likes: 0, ...data };
  storage.moltbookPosts.push(post);
  return id;
}

export async function getMoltbookPosts(limit?: number) {
  const result = [...storage.moltbookPosts].reverse();
  return limit ? result.slice(0, limit) : result;
}

export async function getMoltbookPostsByStartup(startupId: number) {
  return storage.moltbookPosts.filter(p => p.startupId === startupId);
}

export async function updateMoltbookPost(id: number, data: any) {
  const index = storage.moltbookPosts.findIndex(p => p.id === id);
  if (index === -1) return false;
  storage.moltbookPosts[index] = { ...storage.moltbookPosts[index], ...data };
  return true;
}

export async function createMoltbookComment(data: any) {
  const id = nextId('moltbookComments');
  const comment = { id, createdAt: new Date(), ...data };
  storage.moltbookComments.push(comment);
  return id;
}

export async function getMoltbookComments(postId: number) {
  return storage.moltbookComments.filter(c => c.postId === postId);
}

// ============================================
// PERFORMANCE
// ============================================
export async function createPerformanceMetric(data: any) {
  const id = nextId('performanceMetrics');
  const metric = { id, createdAt: new Date(), ...data };
  storage.performanceMetrics.push(metric);
  return id;
}

export async function getPerformanceMetrics() {
  return [...storage.performanceMetrics].sort((a, b) => (a.rank || 999) - (b.rank || 999));
}

export async function getPerformanceMetricsByStartup(startupId: number) {
  return storage.performanceMetrics.find(m => m.startupId === startupId);
}

export async function updatePerformanceMetric(id: number, data: any) {
  const index = storage.performanceMetrics.findIndex(m => m.id === id);
  if (index === -1) return false;
  storage.performanceMetrics[index] = { ...storage.performanceMetrics[index], ...data };
  return true;
}

// ============================================
// AUDIT
// ============================================
export async function createAuditLog(action: string, actor: string, targetType?: string, targetId?: number, details?: string) {
  const id = nextId('auditLogs');
  const log = { id, createdAt: new Date().toISOString(), action, actor, targetType, targetId, details, hash: 'mock-hash-' + id };
  storage.auditLogs.unshift(log); // Recente primeiro
  return id;
}

export async function getAuditLogs(limit?: number) {
  return limit ? storage.auditLogs.slice(0, limit) : storage.auditLogs;
}
