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

| ID | Finding | Controlling instruction | Current disposition | Required closure evidence |
|---|---|---|---|---|
| CF-001 | Mechanical status retirement collapsed distinct M10 branches into duplicate `REINVESTIGATION_REQUIRED` text. | CO-FINAL-02 | OPEN | Corrected M10 semantics and semantic integrity gate PASS. |
| CF-002 | Ad hoc aliases such as source-scoped or verb-form reinvestigation statuses may remain after replacement. | CO-FINAL-02 | OPEN | Repository-wide semantic scan proves aliases absent; scope carried as metadata. |
| CF-003 | Phase 3B must remain model-led and deterministic support-only. | CO-FINAL-03 | VALIDATED_NO_CHANGE | Authority fixture plus negative substitution/conflict tests. |
| CF-004 | AI, FinTech and FDR registry contracts were previously altered and then restored. | CO-FINAL-03 | VALIDATED_NO_CHANGE | Base/head registry blob parity and no final diff. |
| CF-005 | Derivable domain and executable package availability must remain separate. | CO-FINAL-04 | VALIDATED_NO_CHANGE | AI full, FinTech report-only, uninstalled-domain universal report-only fixtures. |
| CF-006 | Only critical failures may block; ordinary semantic, forensic and evidence deficiencies may not. | CO-FINAL-05 | PARTIALLY_VALIDATED | Canonical outcome contract plus repository-wide runtime audit and behavior fixtures. |
| CF-007 | The full Phase 1–16 architecture requires a corrected-instruction audit, not the earlier deterministic-domain interpretation. | CO-FINAL-06 | OPEN | Phase-by-phase audit matrix with explicit dispositions. |
| CF-008 | Production checks may contain false blockers, duplicate work or brittle string assertions. | CO-FINAL-07 | OPEN | Production-gate audit, one active syntax pass, behavioral checks and clean self-removal. |
| CF-009 | No live Cloud Tasks → Firestore → Drive matter execution has been certified. | CO-FINAL-08 | OPEN | Eight-scenario live-run evidence matrix with run IDs and artifact hashes. |
| CF-010 | Cloudflare Pages reported a failed build on the initial closure baseline. | CO-FINAL-09 | OPEN | Successful deployment at the actual final head, or a precise external-access blocker. |
| CF-011 | PR description and final certification metadata must track the actual final SHA and runs. | CO-FINAL-09 | OPEN | Updated PR body after all code, CI, live-run and deployment work. |

## Disposition vocabulary

Every finding must end in exactly one of:

- `FIXED`
- `VALIDATED_NO_CHANGE`
- `NON_BLOCKING_LIMITATION`
- `CRITICAL_UNRESOLVED`

No finding may be closed by an unsupported statement that it is merely "covered by tests."

## Change discipline

- No broad blind replacement is authorized.
- Every edit must map to a ledger finding.
- Registry edits require a separately proven registry defect.
- No merge is authorized until CO-FINAL-09 acceptance gates are satisfied.
