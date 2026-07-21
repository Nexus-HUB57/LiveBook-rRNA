# fable-method

## Description
Think / Act / Prove cognitive pipeline. Classify task complexity, gather evidence, generate and execute plan, verify results. The foundational skill that all other Fable skills build upon.

## Trigger
Use when any task needs structured analysis and execution. Default skill for all non-trivial work.

## Modes
- `inline` — Full Think → Act → Prove execution
- `plan` — Stop after THINK, deliver plan only
- `audit` — Grade existing work against the method
- `report` — Rewrite outcome-first with honest caveats

## Protocol

### Phase 1: THINK
1. Classify complexity: trivial / standard / complex / critical
2. Assess risk level and determine if verification/subagents are needed
3. Gather initial evidence (file reads, grep matches, API responses)
4. Output classification + evidence summary

### Phase 2: ACT (skipped in plan mode)
1. Generate plan steps from evidence (analyze → identify → implement → validate)
2. Execute steps sequentially, tracking evidence per step
3. Each step links to evidence IDs for traceability

### Phase 3: PROVE (skipped in plan mode)
1. Verify each completed step against linked evidence
2. Evidence must have confidence >= 0.7 to count
3. Compute verification score (verified steps / total completed)
4. Mark phase as done with score

## API
```
POST /api/fable/method
{ "task": "string", "mode": "inline|plan|audit|report" }

GET /api/fable/method
→ Returns history of method runs
```

## Integration
- Persists results to Prisma (moltbookState table)
- Called by fable-loop as the core execution engine
- Judge results consumed by fable-judge for verification