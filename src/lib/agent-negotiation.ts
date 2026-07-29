/**
 * CHIMERA — Multi-Agent Negotiation Protocols
 *
 * Implements three negotiation strategies for multi-agent coordination:
 *   1. Contract Net  — broadcast task, collect bids, award to best
 *   2. Voting        — agents vote on options, plurality wins
 *   3. Debate        — agents argue for/against, judge decides
 *
 * Zero external dependencies — pure TypeScript.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface Proposal {
  id: string;
  fromAgent: string;
  task: string;
  capability: string;
  estimatedCost: number;      // tokens or USD
  estimatedDuration: number;  // ms
  confidence: number;         // 0-1
  bid?: number;               // for Contract Net
}

export interface NegotiationResult {
  protocol: 'contract_net' | 'voting' | 'debate';
  winner: string;             // agent ID
  proposals: Proposal[];
  rounds: number;
  consensus: number;          // 0-1 agreement level
  reasoning: string;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function randomId(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  return `prop_${Date.now()}_${rand}`;
}

function makeProposal(
  fromAgent: string,
  task: string,
  capability: string,
  opts?: Partial<Pick<Proposal, 'estimatedCost' | 'estimatedDuration' | 'confidence' | 'bid'>>,
): Proposal {
  return {
    id: randomId(),
    fromAgent,
    task,
    capability,
    estimatedCost: opts?.estimatedCost ?? 0,
    estimatedDuration: opts?.estimatedDuration ?? 0,
    confidence: opts?.confidence ?? 0.5,
    bid: opts?.bid,
  };
}

// ---------------------------------------------------------------------------
// AgentNegotiator
// ---------------------------------------------------------------------------

export class AgentNegotiator {
  // -----------------------------------------------------------------------
  // Contract Net Protocol
  // Broadcast task to bidders, collect proposals, evaluate, award to best
  // -----------------------------------------------------------------------

  contractNet(
    task: string,
    bidders: string[],
    evaluateBid: (proposal: Proposal) => number,
    maxRounds: number = 1,
  ): NegotiationResult {
    const allProposals: Proposal[] = [];
    let rounds = 0;

    for (let r = 0; r < maxRounds; r++) {
      rounds++;

      // Simulate broadcast: each "bidder" would submit a proposal
      // In real usage, the caller populates proposals via a callback or
      // the bus. Here we collect the proposals that the evaluateBid
      // function has access to. We create placeholder proposals per bidder.
      const roundProposals = bidders.map((bidder) =>
        makeProposal(bidder, task, 'contract_net_bid'),
      );

      // The caller's evaluateBid scores each proposal.
      // In a real system, bidders submit actual proposals via the message bus.
      // For the protocol skeleton, we score the placeholders.
      for (const p of roundProposals) {
        p.bid = evaluateBid(p);
      }

      allProposals.push(...roundProposals);
    }

    // Determine winner
    const scored = allProposals
      .filter((p) => p.bid !== undefined && p.bid > 0)
      .sort((a, b) => (b.bid ?? 0) - (a.bid ?? 0));

    if (scored.length === 0) {
      return {
        protocol: 'contract_net',
        winner: 'none',
        proposals: allProposals,
        rounds,
        consensus: 0,
        reasoning: 'No valid bids received from any bidder',
      };
    }

    const winner = scored[0];
    const totalBidders = allProposals.length;
    const consensus = totalBidders > 1
      ? Math.max(0, Math.min(1, winner.bid! / allProposals.reduce((s, p) => s + (p.bid ?? 0), 0)))
      : 1;

    return {
      protocol: 'contract_net',
      winner: winner.fromAgent,
      proposals: allProposals,
      rounds,
      consensus,
      reasoning: `Awarded to ${winner.fromAgent} with bid score ${winner.bid!.toFixed(3)} out of ${scored.length} valid bids`,
    };
  }

  // -----------------------------------------------------------------------
  // Voting Protocol
  // Agents vote on options, plurality wins (ties broken by first)
  // -----------------------------------------------------------------------

  async vote(
    topic: string,
    voters: string[],
    options: string[],
    getVote: (voter: string, options: string[]) => string | Promise<string>,
  ): Promise<NegotiationResult> {
    const proposals: Proposal[] = [];
    const tally: Record<string, number> = {};
    for (const opt of options) {
      tally[opt] = 0;
    }

    // Collect votes from each voter
    for (const voter of voters) {
      const choice = await getVote(voter, options);
      if (choice in tally) {
        tally[choice]++;
      }

      proposals.push(
        makeProposal(voter, topic, 'vote', { confidence: choice in tally ? 1 : 0 }),
      );
    }

    // Determine winner by plurality
    const sorted = Object.entries(tally).sort((a, b) => b[1] - a[1]);
    const topVotes = sorted[0][1];
    const tied = sorted.filter(([, v]) => v === topVotes);

    // Plurality winner (first in options order for ties)
    const winnerOption = tied.length === 1
      ? tied[0][0]
      : options.find((o) => tied.some(([t]) => t === o)) ?? tied[0][0];

    const totalVotes = voters.length;
    const consensus = totalVotes > 0 ? topVotes / totalVotes : 0;

    return {
      protocol: 'voting',
      winner: winnerOption,
      proposals,
      rounds: 1,
      consensus,
      reasoning: `${winnerOption} won with ${topVotes}/${totalVotes} votes (${(consensus * 100).toFixed(0)}% consensus). Results: ${sorted.map(([o, v]) => `${o}=${v}`).join(', ')}`,
    };
  }

  // -----------------------------------------------------------------------
  // Debate Protocol
  // Agents argue for/against a proposition, judge makes final decision
  // -----------------------------------------------------------------------

  async debate(
    proposition: string,
    participants: Array<{
      agentId: string;
      stance: 'for' | 'against';
      argument: string;
    }>,
    judgeFn: (
      proposition: string,
      debateArguments: Array<{ agentId: string; stance: string; argument: string }>,
    ) => string | Promise<string>,
    maxRounds: number = 1,
  ): Promise<NegotiationResult> {
    const proposals: Proposal[] = [];
    let rounds = 0;

    for (let r = 0; r < maxRounds; r++) {
      rounds++;

      for (const p of participants) {
        proposals.push(
          makeProposal(p.agentId, proposition, `debate_${p.stance}`, {
            confidence: p.stance === 'for' ? 0.8 : 0.3,
          }),
        );
      }
    }

    // Count arguments per stance
    const forCount = participants.filter((p) => p.stance === 'for').length;
    const againstCount = participants.filter((p) => p.stance === 'against').length;
    const total = participants.length;

    // Stance balance consensus (1 = unanimous, 0 = split 50/50)
    const majoritySide = Math.max(forCount, againstCount);
    const stanceConsensus = total > 0 ? majoritySide / total : 0;

    // Judge makes the final decision
    const judgeDecision = await judgeFn(
      proposition,
      participants.map((p) => ({
        agentId: p.agentId,
        stance: p.stance,
        argument: p.argument,
      })),
    );

    // Consensus blends stance agreement with judge confidence
    const judgeAgreesWithMajority =
      (forCount >= againstCount && judgeDecision === 'accept') ||
      (againstCount > forCount && judgeDecision === 'reject');
    const consensus = judgeAgreesWithMajority ? stanceConsensus : stanceConsensus * 0.5;

    return {
      protocol: 'debate',
      winner: judgeDecision,
      proposals,
      rounds,
      consensus: Math.max(0, Math.min(1, consensus)),
      reasoning: `Judge decided "${judgeDecision}" after ${rounds} round(s) of debate. Arguments: ${forCount} for, ${againstCount} against. Participants: ${participants.map((p) => p.agentId).join(', ')}`,
    };
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

export const agentNegotiator = new AgentNegotiator();
