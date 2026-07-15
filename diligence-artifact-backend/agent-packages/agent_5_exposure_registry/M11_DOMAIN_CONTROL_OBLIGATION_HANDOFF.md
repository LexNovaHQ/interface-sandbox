# M11 — Phase 8 Domain Control Obligation Handoff

## Status

This contract is active inside the CO-7 Agent 5 semantic package.

It defines the bounded use of the locked `domain_control_obligation_profile` within one package-scoped M11 batch.

## Source boundary

M11 may receive only the locked profile:

```text
domain_control_obligation_profile
```

M11 must not receive or request candidate inventories, Phase 8 candidate packets, Phase 8 Registry Key payloads, Phase 8 route packets, or Phase 8 derivation ledgers as substitutes for M11 evidence.

The profile must be `LOCKED` or `LOCKED_WITH_LIMITATIONS` before use.

## Context role

The profile is derived context only. It may help identify:

- mounted-package obligation identity;
- target-specific obligation context;
- linked activities;
- authority-dependency anchors;
- expected control signals;
- public-footprint control visibility;
- missing proof;
- diligence questions and limitations;
- candidate-only regulatory-overlay context.

It is not:

- an exposure verdict;
- a Hunter Trigger result;
- registry authority;
- proof of legal applicability, jurisdiction, satisfaction, breach, or licensing status;
- proof that a visible control defeats a registry row;
- a substitute for M11 primary evidence.

## Package and stream boundary

Use only context admitted for the active packet’s `package_id`, `stream_id`, and expected canonical Threat IDs.

Do not use primary-package obligation context to satisfy an overlay row, or overlay context to alter a primary row, unless the backend explicitly linked that context to the active row through deterministic packet assembly.

Phase 8 context must not:

- create, delete, or rename a Threat ID;
- create or rewrite `registry_row_key`;
- change registry selection;
- change the route plan;
- change package, stream, archetype group, or batch membership;
- replace Hunter Trigger;
- rewrite deterministic registry fields;
- choose final material status.

## Backend-scoped links

Where the backend supplies `m11_domain_control_obligation_context`, use only rows linked to the active batch through exact deterministic intersections such as:

```text
authority_dependency <-> M11 authority anchors
matched_behavior_codes <-> M11 Archetype/Subcategory tokens
matched_surface_tokens <-> M11 Surface tokens
```

A context link is a navigation and review aid only. It is not substantive proof. If no exact link exists, do not force one.

## Permitted semantic use

For an already-routed row, linked context may help the model:

- focus review on a target activity or control surface;
- identify a claimed control that requires verification against M11 evidence;
- preserve missing-proof and limitation signals;
- test whether a visible mechanism defeats, reduces, or does not affect the Hunter Trigger;
- flag authority or regulatory-overlay language for qualified review.

The semantic fields must still be derived from the active M11 packet and admitted primary evidence.

## Control discipline

Phase 8 control-visibility fields do not automatically determine:

```text
visible_control_present
visible_control_defeats_or_reduces_exposure
control_exclusion_evaluation
final material status
```

M11 must independently assess those values against the active Hunter Trigger and admitted evidence.

A visible Phase 8 signal is only a control lead until verified. Partial, not-visible, or unresolved posture must not become a breach or compliance conclusion.

## Authority and overlay discipline

Authority dependencies and regulatory-overlay references are contextual vocabulary, not legal-applicability decisions.

They must not independently establish jurisdiction, licensing duty, satisfaction, breach, or a new obligation row.

## Output boundary

Phase 8 context may influence only:

```text
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
applied_fp_mechanism
row_limitations
status_inputs
```

Do not emit Phase 8 rows, obligation profiles, candidate IDs, regulatory-overlay references, handoff packets, deterministic fields, or new output branches.

## Limitation carry-forward

Where Phase 8 reports missing proof, unresolved role, unclear control, partial posture, or profile limitations, preserve the issue in `row_limitations` where relevant. Do not convert it into an automatic trigger or automatic control.

## Final lock

M11 remains the owner of exposure evaluation. Phase 8 provides bounded context only and never replaces registry authority, Hunter Trigger evaluation, admitted evidence, false-positive discipline, or backend final-status authority.