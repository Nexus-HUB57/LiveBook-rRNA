# CHIMERA Ecosystem — Agent Architecture Map

## Overview

CHIMERA is a multi-agent fusion engine built on Next.js 16 (standalone output), featuring 5 AI agents, Bitcoin BIP32/39 + PSBT v2 custody, RAG rRNA pipeline, and a 10-tab dashboard.

The **Fable Method** (inspired by Sahir619/fable-method) provides the cognitive architecture for all agents — a Think/Act/Prove loop that every skill must follow.

## Agent Roster

| Agent | Role | Primary Tab | Integration |
|-------|------|-------------|-------------|
| **Fable 5 OS** | Recursive sandbox orchestrator — spawns subagents, auto-corrects, tracks karma | Fable Method | fable-5-orchestrator.ts, /api/fable/spawn |
| **RAG rRNA** | Biological retrieval pipeline — Extract, Encode, Retrieve, Rerank, Augment, Generate | RAG Chat | rag-engine.ts, /api/rag/query |
| **Bitcoin Vault** | BIP32/39 HD wallet + PSBT v2 + AES-256-GCM custody | Dashboard | vault-service.ts, dynamic-vault.ts, /api/vaults/* |
| **Colibri** | LLM routing expert atlas — multi-model orchestration with tier-based selection | Orquestracao | /api/colibri/* |
| **MoltBook** | Social knowledge graph with karma-weighted content ranking | MoltBook | /api/moltbook, moltbook.json |

## Fable Method Architecture (4 Skills)

### Skill 1: `fable-method` — Think / Act / Prove

The foundational skill. Every task enters the pipeline:

1. **THINK** — Classify complexity (trivial/standard/complex/critical), assess risk, gather evidence
2. **ACT** — Generate plan steps, execute sequentially, track evidence per step
3. **PROVE** — Verify each completed step against evidence (confidence >= 0.7), compute score

Modes: `inline` (full run), `plan` (stop after think), `audit` (grade existing work), `report` (outcome-first rewrite)

### Skill 2: `fable-loop` — Orchestrated Parallel Execution

Full cognitive run for complex/critical tasks:

1. Spawn parallel evidence subagents (file mapper, dependency checker, API contract verifier)
2. Merge all evidence into unified context
3. Run THINK → ACT → PROVE on merged evidence
4. Committed plan stops for approval when scope is ambiguous
5. Auto-invoke `fable-judge` for adversarial verification

### Skill 3: `fable-judge` — Adversarial Verification

Independent verification with 6+ automated checks:

- Think phase executed (classification present)
- Act phase produced results (steps completed)
- Prove phase verified output (verification ran)
- Evidence quality (>= 2 items with confidence >= 70%)
- No skipped phases
- Reasonable execution time (< 2 min)

Verdicts: `VERIFIED` (>= 80), `CAVEATS` (>= 50), `REFUTED` (< 50)

### Skill 4: `fable-domain` — Sector Adapter Bundles

Pre-built domain knowledge adapters with trap fixtures:

- **chimera-dashboard** — Dark premium palette, shadcn/ui conventions, tab navigation, dead code traps
- **bitcoin-vault** — Key exposure checks, PSBT v2 conventions, custody safety
- **rag-rrna** — TF field isolation, BM25 scoring correctness, n-gram expansion rules

Each adapter includes: conventions, trap fixtures (common mistakes to catch), smoke tests

## Data Flow

```
User Task
  │
  ▼
Fable Method Engine (THINK → ACT → PROVE)
  │
  ├──► fable-method (inline/plan/audit/report)
  │
  ├──► fable-loop (parallel subagents + judge)
  │       │
  │       ├──► SubAgent: file-mapper
  │       ├──► SubAgent: dep-checker
   │       └──► SubAgent: api-verifier
  │
  ├──► fable-judge (adversarial verification)
  │
  └──► fable-domain (sector adapter + traps)

Results persist to Prisma (moltbookState table)
Fable 5 OS tracks karma per task execution
```

## Key Files

### Engine
- `src/lib/fable-method-engine.ts` — Core Think/Act/Prove engine with all 4 skills
- `src/lib/fable-5-orchestrator.ts` — LLM-powered subagent spawning and auto-correction
- `src/lib/self-healing-engine.ts` — Reactive auto-cure for dashboard errors
- `src/lib/wisdom-engine.ts` — Knowledge accumulation and retrieval

### API Routes
- `/api/fable/method` — Execute fable-method (POST) + get history (GET)
- `/api/fable/loop` — Execute fable-loop with parallel subagents
- `/api/fable/judge` — Run adversarial verification
- `/api/fable/domain` — Get/list domain adapters
- `/api/fable/spawn` — Spawn Fable 5 OS subagent
- `/api/fable/stats` — Method execution statistics
- `/api/fable/tasks` — List all Fable tasks
- `/api/fable/task/[id]` — Get specific task details
- `/api/fable/agent-query` — Query agent capabilities

### UI
- `src/components/fable-method-tab.tsx` — Full interactive tab with skill selector, phase pipeline, judge verdict, plan steps, history

## Design System

- **Palette**: bg `#080b0d`, accent `#00ff88`, accent2 `#22d3ee`
- **Fonts**: Inter (body), IBM Plex Mono (monospace)
- **Components**: shadcn/ui + Tailwind CSS 4
- **Style**: Badges `text-[10px]`, borders `border-zinc-800/60`, cards `bg-zinc-900/30`
- **Language**: pt-BR for all user-facing strings

## Deployment

- **Target**: Docker (Next.js standalone output)
- **Database**: SQLite via Prisma (fallback: `file:./chimera.db`)
- **Platform**: Space-Z (Hugging Face Spaces)
