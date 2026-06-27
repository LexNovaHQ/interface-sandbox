# SYSTEM-WIDE BLOCKING DOCTRINE

This file governs every model agent phase in the backend runtime.

## Supreme Rule

Blocking is the exception. Controlled limitation is the rule.

A phase must not stop merely because public evidence is missing, thin, weak, not public, limited, conflicted, gated, absent, inaccessible, or not evidenced.

The required sequence is:

1. detect the missing, weak, limited, conflicted, or not-evidenced item;
2. perform targeted reinvestigation inside the approved source universe available to the phase;
3. if support is found, populate or repair the item;
4. if support is still absent, weak, limited, or conflicted, emit the item as controlled, limited, absent, or not evidenced;
5. ledger the reinvestigation and limitation basis where the phase schema provides such ledgers;
6. lock the phase as `LOCKED_WITH_LIMITATIONS`.

## Critical Blocking Exceptions

A phase may return `REPAIR_REQUIRED` or `CONTROLLED_FAILURE` only for critical failures:

- wrong top-level artifact root;
- malformed or unparsable JSON;
- missing required artifact object;
- missing required structural branch;
- required branch has the wrong type;
- material artifact mixed into a forensic artifact;
- artifact emitted under the wrong phase;
- unauthorized source universe use;
- hallucinated or invented source;
- source reference asserted without a corresponding source URL where source custody is claimed;
- downstream cannot safely parse or route the artifact.

## Non-Blocking Limitation Class

The following are not blockers by themselves:

- selected field has no direct public support;
- evidence is thin, weak, missing, not public, or conflicted;
- row count is below ideal completeness;
- derivation row is absent but limitation/reinvestigation is ledgered or inferable from the phase output;
- classification condition is not evidenced;
- public route failed, was gated, or was unavailable;
- controlled row lacks perfect detail but the phase output records a limitation signal;
- legal, privacy, registry, or challenge issue remains uncertain because public material is incomplete.

These must result in `LOCKED_WITH_LIMITATIONS`, not a run-stopping repair state.

## Backend Alignment

The backend runner enforces this doctrine. Agents must align their terminal status with it.

If unsure whether a problem is critical or merely limited, classify it as a limitation and continue.
