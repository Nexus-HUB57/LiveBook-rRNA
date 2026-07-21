# fable-judge

## Description
Adversarial verification engine. Independently grades completed work against the Fable Method standard. Returns a verdict with score and detailed checks.

## Trigger
Use after any fable-method or fable-loop execution to verify quality. Can also be called standalone to audit existing work.

## Verdicts
- **VERIFIED** (score >= 80/100) — All critical checks passed
- **CAVEATS** (score >= 50/100) — Work passes with conditions
- **REFUTED** (score < 50/100) — Work does not meet standard

## Automated Checks (6+)

| # | Check | Criteria |
|---|-------|----------|
| 1 | Think phase executed | thinkPhase exists and not skipped |
| 2 | Act phase produced results | At least 1 plan step completed |
| 3 | Prove phase verified output | provePhase exists and not skipped |
| 4 | Evidence quality | >= 2 evidence items with confidence >= 70% |
| 5 | No skipped phases | Zero phases with skipped=true |
| 6 | Reasonable execution time | Duration < 120 seconds |

## Output
```typescript
{
  verdict: "VERIFIED" | "CAVEATS" | "REFUTED",
  score: number,           // 0-100
  checks: JudgeCheck[],    // Individual check results
  caveats: string[],       // Warnings for CAVEATS verdict
  refutations: string[],   // Reasons for REFUTED verdict
  summary: string          // Human-readable summary
}
```

## API
```
POST /api/fable/judge
{ "work": { ...MethodContext } }
```

## Integration
- Auto-invoked by fable-loop after execution
- Can audit any historical method run from persistence