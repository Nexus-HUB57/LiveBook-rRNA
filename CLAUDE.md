# CLAUDE.md — CHIMERA Ecosystem

## Architecture Overview

CHIMERA is a Multi-Agent Fusion Engine powered by the **9router bridge** — an in-process routing layer that orchestrates LLM calls across 100+ AI providers with automatic fallback chains and protocol translation.

### 9router Bridge Layer

All LLM calls go through `src/lib/9router-bridge.ts`:
- **Entry points**: `routeChat()` (non-streaming), `streamChat()` (streaming async generator)
- **Provider registry**: `src/lib/9router-engine/provider-registry.ts` — 20 providers, OpenAI/Claude/Gemini formats
- **Protocol translator**: `src/lib/9router-engine/protocol-translator.ts` — hub-and-spoke (OpenAI as intermediate)
- **Fallback chains**: GLM → DeepSeek → Groq → OpenAI → Anthropic → Gemini → OpenRouter → ZAI SDK
- **API routes**: `/api/9router/providers` (status), `/api/9router/route-chat` (direct routing)

**NEVER import `z-ai-web-dev-sdk` directly in API routes.** Always use 9router bridge. The ZAI SDK exists only as the final fallback inside `9router-bridge.ts`.

### Migrated API Routes

All these routes now use 9router bridge (not direct SDK):
- `/api/orchestrate` — Mythos agent orchestration with tool calling
- `/api/agent/chat/stream` — Streaming chat via `streamChat()`
- `/api/agent/chat` — Non-streaming chat via `routeChat()`
- `/api/agent/analyze` — Ecosystem analysis via `routeChat()`
- `/api/rag/query` — RAG pipeline synthesis via `routeChat()`
- `/api/fable/spawn` — Fable 5 OS subagent spawning via `routeChat()`

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
   /api/fable/domain?sector=colibri-routing
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
   - Confirm no direct `z-ai-web-dev-sdk` imports in src/ (only in 9router-bridge.ts)

2. For significant changes, run `fable-judge` to get an automated verification score

## Design Constraints

- **NEVER** expose private keys, mnemonics, or xprv in client-side code
- **ALWAYS** use lazy env var access (`getVaultKey()`) for sensitive values
- **NEVER** reuse content TF maps for title/source scoring in RAG
- **ALWAYS** use `let` not `const` for variables that will be reassigned
- **NEVER** use Turbopack-conflicting function names (e.g., don't name functions `deriveChild` when HDKey already has one)
- **NEVER** import `z-ai-web-dev-sdk` directly — always use `@/lib/9router-bridge`
- **ALWAYS** specify `fallbackChain` when calling `routeChat()` for resilience

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
│   ├── api/
│   │   ├── 9router/          # 9router bridge API routes
│   │   │   ├── providers/    # Provider listing + status
│   │   │   └── route-chat/   # Direct chat routing
│   │   ├── orchestrate/      # Mythos agent orchestration
│   │   ├── agent/
│   │   │   ├── chat/         # Agent chat (stream + non-stream)
│   │   │   └── analyze/      # Ecosystem analysis
│   │   ├── rag/query/        # RAG rRNA pipeline
│   │   └── fable/            # All Fable API routes
│   │       ├── method/       # fable-method skill
│   │       ├── loop/         # fable-loop skill
│   │       ├── judge/        # fable-judge skill
│   │       ├── domain/       # fable-domain skill
│   │       ├── spawn/        # Fable 5 OS subagent spawning
│   │       ├── stats/        # Execution statistics
│   │       ├── tasks/        # Task listing
│   │       └── task/[id]/    # Task details
│   └── page.tsx              # Main dashboard (10 tabs)
├── components/
│   └── fable-method-tab.tsx  # Fable Method UI
├── lib/
│   ├── 9router-bridge.ts     # Main routing bridge (routeChat, streamChat)
│   ├── 9router-engine/       # 9router engine (provider-registry, protocol-translator)
│   ├── fable-method-engine.ts  # Core engine (Think/Act/Prove)
│   ├── fable-5-orchestrator.ts # LLM subagent orchestrator (via 9router)
│   └── llm-synthesis.ts     # Streaming LLM synthesis (via 9router)
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