# CO-P12-01 Code Cutover Marker

- Repository: `LexNovaHQ/interface-sandbox`
- Branch: `domain-gate-v0-preflight`
- Change order: `CO-P12-01 — Upstream Report Contract Prerequisites`
- Cutover date: `2026-07-12`
- Pre-change head: `daf7f800399137dfc7874104b23ff493e3583cd8`
- Rollback branch: `backup/domain-gate-v0-preflight-pre-co-p12-01-20260712`

## Applied boundaries

- Phase 12 doctrine locked: upstream phases decide; Phase 12 arranges.
- Public report terminology locked to Sector terminology while backend `domain_*` identifiers remain unchanged.
- Phase 5 material schema cut over to canonical `behavior_class_*` fields.
- Primary and capability-overlay Behavior Class and Surface blocks remain separate and independently validated.
- Phase 10 mounted threat registries preserve a complete deterministic report-row spine and compound `registry_row_key` custody.
- Pain Tier, Pain Category and Pain Depth are mandatory and validated against the mounted Registry Key.
- Model-emitted registry facts are rejected outside the semantic allowlist.
- Phase 11 compiler admission accepts only final `PASS` or `PASS_WITH_LIMITATION` gates with affirmative handoff, completed Layer 3 and fingerprint custody.
- Phase 12 direct-profile/no-Phase2G cutover is locked as a future atomic rebuild boundary and is not falsely marked active.

## Validation status

Remote structural inspection and syntax-oriented acceptance assets are installed. Full npm/local execution remains a separate validation step and is not represented by this marker as passed.