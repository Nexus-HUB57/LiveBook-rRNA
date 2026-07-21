# CLAUDE.md — CHIMERA Fable Method Integration

## Proactive Rules

When working in this repository, Claude Code should proactively apply the Fable Method cognitive architecture to every non-trivial change.

### Before Any Code Change

1. **THINK** — Classify the task complexity:
   - `trivial`: rename, format, typo, comment
   - `standard`: fix, implement, create, add, update
   - `complex`: refactor, architecture, multi-agent, pipeline
   - `critical`: deploy, production, migration, schema change, security

2. **Check domain adapter** — If the change touches a known sector, load its trap fixtures:
   ```
   /api/fable/domain?sector=chimera-dashboard
   /api/fable/domain?sector=bitcoin-vault
   /api/fable/domain?sector=rag-rrna
   ```

3. **Check for known traps** — Review the trap fixtures for the sector before making changes.

### During Code Changes

1. **ACT** — Generate a mental plan with evidence-backed steps
2. For `complex` or `critical` tasks, consider running `fable-loop` for parallel evidence gathering
3. Track which files are affected and why

### After Code Changes

1. **PROVE** — Verify the change:
   - Run `npx next build` to confirm compilation
   - Check that no trap fixtures were triggered
   - Verify CSS variables are synced (`#080b0d` palette, not `#1a1a1b`)
   - Confirm no dead code was introduced

2. For significant changes, run `fable-judge` to get an automated verification score

## Design Constraints

- **NEVER** expose private keys, mnemonics, or xprv in client-side code
- **ALWAYS** use lazy env var access (`getVaultKey()`) for sensitive values
- **NEVER** reuse content TF maps for title/source scoring in RAG
- **ALWAYS** use `let` not `const` for variables that will be reassigned
- **NEVER** use Turbopack-conflicting function names (e.g., don't name functions `deriveChild` when HDKey already has one)

## Fable Method Skills — Quick Reference

### fable-method
```
POST /api/fable/method { "task": "...", "mode": "inline|plan|audit|report" }
```
Use for any task. Default `inline` runs full Think/Act/Prove.

### fable-loop
```
POST /api/fable/loop { "task": "..." }
```
Use for complex/critical tasks. Spawns parallel evidence agents, runs full pipeline, then invokes judge.

### fable-judge
```
POST /api/fable/judge { "work": { ...MethodContext } }
```
Use to verify any completed work. Returns VERIFIED/CAVEATS/REFUTED with score.

### fable-domain
```
POST /api/fable/domain { "sector": "..." }
GET  /api/fable/domain (lists all adapters)
```
Use to get domain knowledge, conventions, and trap fixtures for a sector.

## File Organization

```
src/
├── app/
│   ├── api/fable/          # All Fable API routes
│   │   ├── method/         # fable-method skill
│   │   ├── loop/           # fable-loop skill
│   │   ├── judge/          # fable-judge skill
│   │   ├── domain/         # fable-domain skill
│   │   ├── spawn/          # Fable 5 OS subagent spawning
│   │   ├── stats/          # Execution statistics
│   │   ├── tasks/          # Task listing
│   │   └── task/[id]/      # Task details
│   └── page.tsx            # Main dashboard (10 tabs)
├── components/
│   └── fable-method-tab.tsx  # Fable Method UI
├── lib/
│   ├── fable-method-engine.ts  # Core engine (Think/Act/Prove)
│   └── fable-5-orchestrator.ts # LLM subagent orchestrator
└── contexts/
    └── ecosystem-context.tsx
```

## Palette Reference

```css
--background: #080b0d;
--accent: #00ff88;
--accent2: #22d3ee;
--font-body: Inter;
--font-mono: IBM Plex Mono;
```