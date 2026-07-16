# Phase 1 Universal Baseline Fixtures

These fixtures lock the agreed Sarvam AI and Paytm FinTech-with-AI-overlay baselines before the Phase 1 rebuild.

## Status

- `sarvam-ai.fixture.json` and `paytm-fintech-ai-overlay.fixture.json` define future-state behavioural requirements.
- `scripts/check-phase1-universal-baseline-red.mjs` executes those requirements against the current Phase 1 implementation.
- `npm run check:phase1-universal-baseline:red` must pass **only by confirming the expected current failures are present**.
- `npm run check:phase1-universal-baseline` is the future green gate. It is expected to fail until RB-02 through RB-17 implement the locked doctrine.
- Neither command is wired into the production gate during RB-00/RB-01.

## Locked behaviours

1. Broad discovery does not authorize broad extraction.
2. One logical artifact exists per populated non-legal root.
3. Root sharding is size-only after dedupe, with an 800 KiB threshold.
4. Same-root exact and near-duplicate material is represented once.
5. Template variants become structured coverage plus unique deltas.
6. Entity ownership survives URL manifest, extraction, root assembly, legal artifacts, and handoff.
7. A source has one primary root owner and may expose secondary-root references without duplicated full text.
8. AI overlays attach to underlying features rather than duplicating the primary-domain corpus.
9. Distinct legal instruments remain complete and entity-specific.
10. Legal acronym matching is token/route bounded; `translation` must never classify as an SLA.

## Non-impact boundary

RB-00/RB-01 do not modify Phase 1 production logic or downstream contracts. The public compatibility freeze is stored at:

`src/phases/01-source-discovery/contracts/PHASE1_PUBLIC_CONTRACT_FREEZE_v1.json`
