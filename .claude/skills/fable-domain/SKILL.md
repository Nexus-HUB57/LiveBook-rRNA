# fable-domain

## Description
Sector-specific adapter bundles with trap fixtures. Pre-loaded domain knowledge that the other skills use to avoid common mistakes and enforce project conventions.

## Trigger
Use when working in a specific code sector. Load the adapter BEFORE making changes to understand conventions and known traps.

## Built-in Adapters

### chimera-dashboard
- **Conventions**: Dark premium palette (#080b0d), shadcn/ui, Tailwind CSS 4, tab navigation, pt-BR strings
- **Trap Fixtures**:
  - Dead code removal (imported but unused components)
  - CSS variable sync (palette must match between globals.css and components)
  - API route type safety (imported types must exist in source)
- **Smoke Tests**: Build passes, dev server starts, strict TypeScript on key files

### bitcoin-vault
- **Conventions**: No client-side private keys, XPRV/seed server-side only, P2PKH via bitcoinjs-lib, PSBT v2, AES-256-GCM
- **Trap Fixtures**:
  - Key exposure check (zero private keys in client bundle)
- **Smoke Tests**: Wallet generation

### rag-rrna
- **Conventions**: TF-IDF with bigram expansion, BM25 with field boosting, per-field TF maps, cross-encoder reranking
- **Trap Fixtures**:
  - TF field isolation (never reuse content TF for title/source)
- **Smoke Tests**: RAG pipeline runs

## API
```
POST /api/fable/domain
{ "sector": "chimera-dashboard" | "bitcoin-vault" | "rag-rrna" | "custom-sector" }

GET /api/fable/domain
→ Lists all available adapter sectors
```

## Custom Sectors
Unknown sectors get a generated adapter with a basic trap fixture. Conventions and traps should be filled in after research.

## Integration
- Called by fable-method during THINK phase when sector is known
- Trap fixtures used by fable-judge for additional verification
- Conventions enforced by CLAUDE.md proactive rules