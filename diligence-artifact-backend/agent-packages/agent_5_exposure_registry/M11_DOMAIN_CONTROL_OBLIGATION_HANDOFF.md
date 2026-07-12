# M11 — Phase 8 Domain Control Obligation Handoff

## Status

This addendum defines the substantive M11 use of the locked `domain_control_obligation_profile`.

It is not active until the later mechanical prompt-bundle and P2G cutover explicitly include it.

## 1. Source boundary

M11 may receive only:

```text
domain_control_obligation_profile
```

M11 must not receive or request:

```text
domain_control_obligation_candidate_inventory
Phase 8 candidate packets
Phase 8 Registry Key payloads
Phase 8 P2E route packets
Phase 8 derivation-basis ledgers as a substitute for M11 evidence
```

The Phase 8 profile must be locked as `LOCKED` or `LOCKED_WITH_LIMITATIONS` before M11 may use it.

## 2. Context role

The Phase 8 profile is derived material context only.

It may help M11 understand:

- the mounted-package obligation identity;
- the target-specific obligation context;
- linked target activities;
- authority-dependency anchors;
- the expected control signal;
- the public-footprint control visibility and posture;
- missing proof;
- diligence questions;
- limitations;
- candidate-only regulatory-overlay context.

It is not:

- an exposure verdict;
- a Hunter Trigger result;
- threat-registry authority;
- proof that a law applies;
- proof that an obligation is satisfied or breached;
- proof that a regulator has jurisdiction;
- proof that a visible control defeats an M11 threat;
- a substitute for M11 primary evidence.

## 3. Routing and registry spine lock

Phase 8 context must not:

- create a new `Threat_ID`;
- delete a registry row;
- change the M11 route plan;
- change batch membership;
- replace `Hunter_Trigger`;
- rewrite `Archetype`, `Subcategory`, `Surface`, authority anchors, pain fields, remediation, or review-route defaults;
- change a row from routed to not routed or the reverse;
- choose the final M11 material status.

The threat registry and M11 deterministic route plan remain the only authorities for M11 row identity and routing.

## 4. Backend-scoped context links

Where the backend provides `m11_domain_control_obligation_context`, use only the obligation rows linked to the active batch or active `Threat_ID` by exact deterministic token intersection.

The link may use exact intersections among:

```text
Phase 8 authority_dependency <-> M11 authority anchors
Phase 8 matched_behavior_codes <-> M11 Archetype/Subcategory tokens
Phase 8 matched_surface_tokens <-> M11 Surface tokens
```

A context link is a navigation and review aid only. It is not an exposure trigger and does not prove substantive alignment between the obligation and threat.

If no exact link exists, do not semantically force one.

## 5. Permitted semantic use

For an already-routed M11 row, the model may use linked Phase 8 context to:

- focus review on a target-specific activity or control surface;
- identify an expected control signal that M11 should verify against its own admitted evidence;
- identify a public-footprint control claim that requires independent M11 evidence confirmation;
- preserve missing-proof and limitation signals;
- ask whether a visible Phase 8 control actually defeats, reduces, or does not affect the active Hunter Trigger;
- flag authority or regulatory-overlay language that requires qualified review.

The model must still derive M11 semantic fields from the active M11 batch packet and M11-admitted primary evidence.

## 6. Control discipline

`control_mechanism_present` and `control_posture_status` are Phase 8 public-footprint visibility signals.

They do not automatically set:

```text
visible_control_present
visible_control_defeats_or_reduces_exposure
control_exclusion_evaluation
final_material_status
```

M11 must independently determine those M11 fields from its own Hunter Trigger, control/exclusion rules, and admitted evidence.

A Phase 8 `VISIBLE` signal may be carried only as a control lead until M11 verifies that the mechanism is relevant to the active threat and actually defeats or reduces it.

A Phase 8 `PARTIAL`, `NOT_VISIBLE`, or `UNRESOLVED` posture must not be converted into a breach or compliance conclusion.

## 7. Authority and overlay discipline

`authority_dependency` is contextual vocabulary from the mounted Registry Key. It is not a legal-applicability decision.

`regulatory_overlay_refs` are candidate-only contextual references. They must not be used to assert:

- legal applicability;
- regulator jurisdiction;
- licence requirement or validity;
- satisfaction or breach;
- an independent regulatory obligation row.

## 8. M11 output boundary

The existing M11 model row schema remains unchanged.

Phase 8 context may influence only the already-authorized semantic fields:

```text
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
applied_fp_mechanism
row_limitations
status_inputs
```

Do not emit Phase 8 rows, obligation profiles, candidate IDs, regulatory-overlay references, handoff packets, or new output branches in the M11 model response.

## 9. Limitation carry-forward

Where Phase 8 reports missing proof, unresolved role, unclear control, partial posture, or profile-level limitations:

- preserve the issue in M11 `row_limitations` where relevant to the active threat;
- do not hide it because the threat row otherwise appears supported;
- do not convert it into an automatic trigger;
- do not convert it into an automatic control;
- continue under the system-wide blocking doctrine unless a structural M11 failure exists.

## 10. Final lock

M11 remains the sole owner of exposure evaluation.

Phase 8 provides bounded obligation/control context. It never replaces the threat registry, M11 evidence discipline, Hunter Trigger evaluation, false-positive discipline, or deterministic final-status authority.
