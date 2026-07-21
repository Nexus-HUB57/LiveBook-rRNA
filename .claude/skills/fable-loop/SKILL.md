# fable-loop

## Description
Full orchestrated cognitive run with parallel evidence subagents and automatic adversarial verification. Use for complex or critical tasks that need maximum confidence.

## Trigger
Use when task complexity is `complex` or `critical`, or when multiple code areas need investigation simultaneously.

## Protocol

### Step 1: Parallel Evidence Gathering
Spawn 3 subagents concurrently:
- **file-mapper**: Map files relevant to the task
- **dep-checker**: Identify dependencies and imports
- **api-verifier**: Verify API routes and contracts

Each subagent produces evidence entries with confidence scores.

### Step 2: Context Merging
Merge all subagent evidence into a unified MethodContext.

### Step 3: Committed Plan
Run THINK → ACT on merged evidence.
If scope is ambiguous, STOP for human approval before proceeding.

### Step 4: Adversarial Verification
Automatically invoke fable-judge on the completed work.

### Step 5: Result Assembly
Return LoopResult containing:
- methodContext (full pipeline state)
- subAgentResults (individual subagent outputs)
- committedPlan (final plan steps)
- judgeReport (adversarial verification)
- totalDurationMs

## API
```
POST /api/fable/loop
{ "task": "string" }
```

## Integration
- Calls fable-method engine internally for THINK/ACT/PROVE
- Calls fable-judge for automatic verification
- Subagent results tracked in Fable 5 OS task system