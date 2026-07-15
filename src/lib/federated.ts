// ============================================================
// FEDERATED LEARNING ENGINE — Simulation Module
// FedAvg aggregation, NRP (Neural Reward Protocol),
// Bitcoin Mainnet virtual anchoring
// ============================================================

import * as crypto from "crypto";

// ---------- TYPES ----------

export interface AgentContribution {
  agentId: string;
  agentName: string;
  gradients: number[];
  reward: number;
  validated: boolean;
}

export interface AggregationConfig {
  epsilon: number;           // DP noise scale (Gaussian)
  minContributions: number;
  anchorToBitcoin: boolean;
  referenceBlock: number;
}

export interface FederatedRound {
  roundId: string;
  timestamp: string;
  agents: AgentContribution[];
  globalModelHash: string;
  anchoredBlock: number | null;
  anchorTxHash: string | null;
  sigmaNoiseApplied: boolean;
  epsilon: number;
  totalReward: number;
}

export interface SovereignModel {
  hash: string;
  version: number;
  roundCount: number;
  totalReward: number;
  lastAnchoredBlock: number | null;
  created: string;
  updated: string;
}

// ---------- NRP — Neural Reward Protocol ----------

/**
 * Validate an agent's contribution using NRP scoring.
 * Rewards are based on gradient magnitude, diversity, and norm bounds.
 */
export function validateContribution(
  agentId: string,
  agentName: string,
  gradients: number[],
  maxNorm: number = 10.0,
): AgentContribution {
  const norm = Math.sqrt(gradients.reduce((s, g) => s + g * g, 0));
  const diversity = gradients.filter(g => Math.abs(g) > 0.01).length / gradients.length;

  // Reward = norm_factor * diversity_factor (clamped 0–200)
  const normFactor = Math.min(norm / maxNorm, 1.0);
  const reward = Math.floor(normFactor * diversity * 200);

  return {
    agentId,
    agentName,
    gradients,
    reward: Math.max(reward, 10), // minimum participation reward
    validated: norm <= maxNorm * 1.5,
  };
}

// ---------- FEDAVG AGGREGATION ----------

/**
 * Federated Averaging with optional differential privacy (Gaussian noise).
 * Returns aggregated global model as gradient array.
 */
export function aggregateGradients(
  contributions: AgentContribution[],
  config: AggregationConfig,
): { globalGradients: number[]; sigmaApplied: boolean } {
  const valid = contributions.filter(c => c.validated);
  if (valid.length < config.minContributions) {
    throw new Error(
      `Insufficient valid contributions: ${valid.length}/${config.minContributions} required`,
    );
  }

  const dim = valid[0].gradients.length;
  const weighted = valid.map(c => ({
    gradients: c.gradients,
    weight: c.reward,
  }));
  const totalWeight = weighted.reduce((s, w) => s + w.weight, 0);

  // Weighted average
  const averaged = new Array(dim).fill(0);
  for (const { gradients, weight } of weighted) {
    for (let i = 0; i < dim; i++) {
      averaged[i] += (gradients[i] * weight) / totalWeight;
    }
  }

  // Apply Gaussian noise for differential privacy
  let sigmaApplied = false;
  if (config.epsilon > 0) {
    // Box-Muller transform for Gaussian noise
    const sigma = 1.0 / config.epsilon;
    for (let i = 0; i < averaged.length; i++) {
      const u1 = Math.random() || 1e-10;
      const u2 = Math.random();
      const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
      averaged[i] += z * sigma;
    }
    sigmaApplied = true;
  }

  return { globalGradients: averaged, sigmaApplied };
}

// ---------- BITCOIN VIRTUAL ANCHORING ----------

/**
 * Generate a virtual anchor hash for the global model.
 * Simulates anchoring a model hash to a Bitcoin block successor.
 * Uses SHA-256 of (model_hash + block_height + nonce) as the anchor commitment.
 */
export function anchorToBitcoin(
  modelHash: string,
  referenceBlock: number,
): { anchorTxHash: string; anchoredBlock: number } {
  const anchoredBlock = referenceBlock + 1;
  const nonce = crypto.randomBytes(16).toString("hex");

  const payload = `${modelHash}:${anchoredBlock}:${nonce}`;
  const anchorTxHash = crypto
    .createHash("sha256")
    .update(payload)
    .digest("hex");

  return { anchorTxHash, anchoredBlock };
}

// ---------- SOVEREIGN MODEL ----------

/**
 * Compute a sovereign model hash from aggregated gradients.
 */
export function computeModelHash(gradients: number[]): string {
  const data = gradients.map(g => g.toFixed(12)).join(",");
  return crypto.createHash("sha256").update(data).digest("hex");
}

// ---------- FULL FEDERATED ROUND ----------

export interface FederatedRoundResult {
  round: FederatedRound;
  model: SovereignModel;
  logs: string[];
}

/**
 * Execute a complete federated learning round:
 * 1. Validate contributions via NRP
 * 2. Aggregate with FedAvg + DP noise
 * 3. Compute sovereign model hash
 * 4. Anchor to Bitcoin (virtual)
 */
export function executeFederatedRound(
  contributions: Array<{ agentId: string; agentName: string; gradients: number[] }>,
  config: AggregationConfig,
  existingModel: SovereignModel | null,
): FederatedRoundResult {
  const logs: string[] = [];
  const timestamp = new Date().toISOString();

  // Phase 1: NRP Validation
  logs.push("Validando contribuicoes via NRP...");
  const validated = contributions.map(c =>
    validateContribution(c.agentId, c.agentName, c.gradients),
  );
  for (const v of validated) {
    logs.push(
      `[NRP] Agente ${v.agentName} validado. Recompensa: ${v.reward} unidades.`,
    );
  }

  // Phase 2: FedAvg Aggregation
  logs.push("Agregando gradientes com FedAvg...");
  const { globalGradients, sigmaApplied } = aggregateGradients(validated, config);
  if (sigmaApplied) {
    logs.push(
      `[SIGMA-AGGREGATOR] Ruido Gaussiano aplicado: Epsilon ${config.epsilon} ativo.`,
    );
  }

  // Phase 3: Sovereign Model Hash
  const modelHash = computeModelHash(globalGradients);
  logs.push(`Modelo Soberano: ${modelHash}`);

  // Phase 4: Bitcoin Anchoring
  let anchoredBlock: number | null = null;
  let anchorTxHash: string | null = null;
  if (config.anchorToBitcoin) {
    logs.push("Ancorando modelo global na Mainnet Bitcoin...");
    const anchor = anchorToBitcoin(modelHash, config.referenceBlock);
    anchoredBlock = anchor.anchoredBlock;
    anchorTxHash = anchor.anchorTxHash;
    logs.push(
      `[Nexus] Hash ${anchorTxHash.slice(0, 4)}...${anchorTxHash.slice(-4)} selado no bloco virtual sucessor ao ${config.referenceBlock}.`,
    );
  }

  const totalReward = validated.reduce((s, v) => s + v.reward, 0);

  const round: FederatedRound = {
    roundId: crypto.randomBytes(8).toString("hex"),
    timestamp,
    agents: validated,
    globalModelHash: modelHash,
    anchoredBlock,
    anchorTxHash,
    sigmaApplied,
    epsilon: config.epsilon,
    totalReward,
  };

  const model: SovereignModel = {
    hash: modelHash,
    version: (existingModel?.version ?? 0) + 1,
    roundCount: (existingModel?.roundCount ?? 0) + 1,
    totalReward: (existingModel?.totalReward ?? 0) + totalReward,
    lastAnchoredBlock: anchoredBlock,
    created: existingModel?.created || timestamp,
    updated: timestamp,
  };

  return { round, model, logs };
}

// ---------- MOCK DATA GENERATORS ----------

/** Generate random gradient vector of given dimension */
export function randomGradients(dim: number, seed: number = 42): number[] {
  // Simple seeded PRNG (mulberry32)
  let s = seed | 0;
  const next = () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return Array.from({ length: dim }, () => (next() - 0.5) * 2);
}

/** Pre-configured simulation agents */
export const SIMULATION_AGENTS = [
  { agentId: "nexus-prime", agentName: "Nexus-Prime" },
  { agentId: "jarvis-x", agentName: "Jarvis-X" },
  { agentId: "sigma-node", agentName: "Sigma-Node" },
];

/** Default aggregation config matching the test spec */
export const DEFAULT_CONFIG: AggregationConfig = {
  epsilon: 0.1,
  minContributions: 2,
  anchorToBitcoin: true,
  referenceBlock: 944288,
};