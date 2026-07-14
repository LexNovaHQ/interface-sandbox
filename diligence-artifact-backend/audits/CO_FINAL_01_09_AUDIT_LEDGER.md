# CO-FINAL-01–09 Audit Ledger

## Baseline

- Repository: `LexNovaHQ/interface-sandbox`
- Pull request: `#95`
- Base branch: `domain-gate-v0-preflight`
- Baseline base SHA: `97c504c91220636361ad87b78f813a7d6d8f374e`
- Authorized working branch: `co-e2e-01-03-critical-authority`
- Initial closure baseline SHA: `01f608e3d40722e8a846d9b9330c91537b046626`
- Scope: CO-FINAL-01 through CO-FINAL-09, incorporating the full `0047` audit and the corrected authority instructions.

## Governing authority locks

1. Phase 3B remains model-led for primary domain, AI overlay, regulatory overlay and fusion candidate judgment.
2. Deterministic code may validate structure, evidence, consistency and package mount eligibility only.
3. Deterministic code must never select, rank, substitute or silently replace the model-derived domain judgment.
4. Maximum two targeted reinvestigation attempts.
5. Unresolved primary after reinvestigation is non-blocking: continue with a valid AI overlay or universal report-only.
6. Only `CRITICAL_FAILURE` may set `run_blocked: true`.
7. The retired repair-required machine status must remain absent.
8. Ad hoc aliases may not replace canonical execution outcomes.
9. Domain package derivation and package execution availability are separate facts.
10. Production certification requires real Cloud Tasks → Firestore → Drive evidence, not fixture-only certification.

## Finding ledger

| ID | Finding | Controlling instruction | Final disposition | Closure evidence |
|---|---|---|---|---|
| CF-001 | Mechanical status retirement collapsed distinct M10 branches into duplicate `REINVESTIGATION_REQUIRED` text. | CO-FINAL-02 | `FIXED` | M7/M8/M10 semantics corrected; semantic outcome integrity gate passes. |
| CF-002 | Ad hoc aliases such as source-scoped or verb-form reinvestigation statuses remained after replacement. | CO-FINAL-02 | `FIXED` | Canonical status plus owner/scope/reason/attempt metadata installed; all prefixed aliases are permanently banned. |
| CF-003 | Phase 3B must remain model-led and deterministic support-only. | CO-FINAL-03 | `VALIDATED_NO_CHANGE` | Negative substitution and competing-claim fixtures preserve model authority and route conflicts to reinvestigation. |
| CF-004 | AI, FinTech and FDR registry contracts were previously altered and then restored. | CO-FINAL-03 | `VALIDATED_NO_CHANGE` | Base/head registry blob parity confirmed; no closure registry edits. |
| CF-005 | Derivable domain and executable package availability must remain separate. | CO-FINAL-04 | `VALIDATED_NO_CHANGE` | AI full, FinTech report-only, uninstalled-domain universal report-only and unresolved-primary continuation fixtures pass. |
| CF-006 | Only critical failures may block; ordinary semantic, forensic and evidence deficiencies may not. | CO-FINAL-05 | `FIXED` | Canonical outcome contract, repository-wide runtime audit and Phase 7/shared-forensics metadata corrections pass. |
| CF-007 | The full Phase 1–16 architecture required a corrected-instruction audit, not the earlier deterministic-domain interpretation. | CO-FINAL-06 | `VALIDATED_NO_CHANGE` | Phase-by-phase closure audit completed; settled ownership remains intact. |
| CF-008 | Production checks contained false-blocker risk, duplicate work or brittle string assertions. | CO-FINAL-07 | `FIXED` | One syntax pass, unique production scripts and behavior-based Phase 12 post-clean checks certified. |
| CF-009 | No live Cloud Tasks → Firestore → Drive matter execution had been certified. | CO-FINAL-08 | `CRITICAL_UNRESOLVED` | One real one-phase transport/custody smoke passed with run ID `LN-20260714-115746-CO-FINAL-PUBLIC-TRANSPOR-848890`; the mandatory eight-scenario live matrix remains blocked by WIF rejection. |
| CF-010 | Cloudflare Pages reports failed builds although the intended deployment is a Worker proxy. | CO-FINAL-09 | `CRITICAL_UNRESOLVED` | Pages continues failing; Cloudflare API credentials are absent, so the stale project cannot be disabled or corrected from GitHub. |
| CF-011 | PR description and final certification metadata must track the actual final SHA and runs. | CO-FINAL-09 | `FIXED` | PR description is updated only after temporary probes are removed and final permanent CI completes. |

## Live evidence boundary

The real one-phase smoke proves:

- Cloudflare Worker health was reachable;
- a Firestore-backed run was created;
- Cloud Tasks accepted the asynchronous advance;
- a task name was recorded;
- polling observed Firestore state transitions;
- Phase 1A locked and advanced to Phase 1B;
- a locked `deduped_url_manifest` artifact was recorded through the Drive-backed artifact path.

It does **not** prove the full eight-scenario semantic live matrix. That missing matrix remains a merge blocker.

## Disposition vocabulary

Every finding ends in exactly one of:

- `FIXED`
- `VALIDATED_NO_CHANGE`
- `NON_BLOCKING_LIMITATION`
- `CRITICAL_UNRESOLVED`

## Change discipline

- No broad blind replacement was used for permanent corrections.
- Every permanent edit maps to a ledger finding.
- No registry was edited during closure.
- No merge is authorized while CF-009 and CF-010 remain `CRITICAL_UNRESOLVED`.
