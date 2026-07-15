# CO-FINAL Production Acceptance Amendment

## Authority

This amendment records the founder's explicit decision on July 14, 2026 to remove the stale Cloudflare Pages integration from the production acceptance standard for PR #95 and the `domain-gate-v0-preflight` tree.

## Amendment

Cloudflare Pages build status is not a production acceptance criterion for this system.

The intended public deployment architecture is the Cloudflare Worker proxy and its configured Worker routes. A separate or stale Cloudflare Pages project is external configuration drift and must not block pipeline certification, branch merge, or release acceptance unless the architecture is later amended to make Pages an intentional production surface.

No fake root static build, dummy Pages asset, or architecture-misrepresenting workaround is required or authorized merely to satisfy a stale Pages integration.

## Effective production acceptance standard

Production acceptance for this change set is satisfied by:

1. the permanent Phase 1–16 Production Certification suite;
2. the permanent Phase 13–16 Post-Review Validation suite;
3. the semantic outcome integrity and Phase 3B authority fixtures;
4. the mandatory eight-scenario live matrix through real Cloud Tasks, Firestore and Drive custody;
5. preservation of critical-only blocking, package lifecycle boundaries and the model-led Phase 3B authority boundary;
6. removal of temporary certification infrastructure and restoration of the normal production deployment workflow.

All six criteria have been satisfied for PR #95.

## Supersession

This amendment supersedes only statements in the earlier CO-FINAL closure materials that treated the stale Cloudflare Pages integration as a merge or production-certification blocker. Historical descriptions of the failed Pages build remain accurate as event history but carry no acceptance consequence.

## Merge authorization

PR #95 is authorized for merge into `domain-gate-v0-preflight` after the permanent validation suites pass on the amendment head.
