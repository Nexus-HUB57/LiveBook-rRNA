// ============================================================
// FEDERATED LEARNING API — Simulation endpoint
// Triggers a federated round and returns results
// ============================================================

import { NextResponse } from "next/server";
import {
  executeFederatedRound,
  randomGradients,
  SIMULATION_AGENTS,
  DEFAULT_CONFIG,
  type AggregationConfig,
} from "@/lib/federated";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const action = body.action || "run";

    if (action === "run") {
      const dim = Math.min(Math.max(body.gradientDim || 128, 16), 1024);
      const config: AggregationConfig = {
        epsilon: typeof body.epsilon === "number" ? body.epsilon : DEFAULT_CONFIG.epsilon,
        minContributions: DEFAULT_CONFIG.minContributions,
        anchorToBitcoin: body.anchorToBitcoin !== false,
        referenceBlock: body.referenceBlock || DEFAULT_CONFIG.referenceBlock,
      };

      const contributions = SIMULATION_AGENTS.map((agent, i) => ({
        ...agent,
        gradients: randomGradients(dim, Date.now() + i * 1000),
      }));

      const { round, model, logs } = executeFederatedRound(contributions, config, null);

      return NextResponse.json({
        error: false,
        round: {
          roundId: round.roundId,
          timestamp: round.timestamp,
          totalReward: round.totalReward,
          agentCount: round.agents.length,
          agents: round.agents.map(a => ({
            name: a.agentName,
            reward: a.reward,
            validated: a.validated,
          })),
          sigmaApplied: round.sigmaApplied,
          epsilon: round.epsilon,
          anchoredBlock: round.anchoredBlock,
          anchorTxHash: round.anchorTxHash,
        },
        model: {
          hash: model.hash,
          version: model.version,
          roundCount: model.roundCount,
          totalReward: model.totalReward,
        },
        logs,
      });
    }

    return NextResponse.json({ error: true, detail: `Unknown action: ${action}` }, { status: 400 });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({ error: true, detail: msg }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    name: "Federated Learning Engine",
    version: "1.0.0",
    agents: SIMULATION_AGENTS.map(a => a.agentName),
    config: DEFAULT_CONFIG,
    capabilities: ["FedAvg", "NRP validation", "DP Gaussian noise", "Bitcoin virtual anchoring"],
  });
}