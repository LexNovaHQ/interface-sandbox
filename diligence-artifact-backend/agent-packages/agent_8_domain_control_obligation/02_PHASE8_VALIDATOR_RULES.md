# Phase 8 Domain Control Obligation Validator Rules

validator_contract_version: phase8_dco_material_validator_v1

## 1. Validator authority

The backend Phase 8 contract is the canonical permission and schema authority.

This validator evaluates only the model material payload for:

```text
DOMAIN_CONTROL_OBLIGATION_PROFILE
```

It cannot:

- expand the routed evidence packet;
- create or remove candidates;
- derive or repair material values;
- substitute Registry Key defaults for missing model fields;
- stamp mechanical fields;
- determine legal applicability or compliance.

Invalid model output is rejected for repair or controlled failure according to the global blocking doctrine. It is never silently completed by the backend.

## 2. Top-level response gate

The model response must be a plain JSON object with exactly one top-level key:

```text
domain_control_obligation_profile
```

Reject:

```text
phase_output
output
result
data
DOMAIN_CONTROL_OBLIGATION_PROFILE
array wrappers
markdown fences
commentary
```

`domain_control_obligation_profile` must be an object containing exactly one key:

```text
obligations
```

`obligations` must be an array.

## 3. Candidate coverage gate

Validate against `domain_control_obligation_candidate_inventory.candidates[]`.

Required:

- exactly one model row for every Layer 1 candidate;
- no extra row;
- no omitted row;
- no duplicate `candidate_id`;
- every `candidate_id` is an exact string match to Layer 1;
- no candidate identity mutation;
- row count equals Layer 1 candidate count.

Candidate order may be normalized by the backend compiler, but identity coverage must be exact before compilation.

A candidate with weak or absent evidence must remain present with controlled material limitations.

## 4. Exact model row keys

Every row contains exactly:

```text
candidate_id
normalized_name
what_it_requires
target_specific_obligation_context
authority_dependency
exposure_role_context
obligation_locus
obligation_trigger_timing
expected_control_signal
control_mechanism_present
control_posture_status
evidence_basis
missing_proof
diligence_question
derivation_basis
limitation
```

Reject additional or missing keys.

## 5. Mechanical-field exclusion gate

Reject any occurrence of:

```text
obligation_id
obligation_family
source_layer
source_package_id
catalog_package_id
capability_overlay_id
linked_activity_references
matched_behavior_codes
matched_surface_tokens
registry_key_ref
obligation_catalog_ref
p2e_navigation_route_refs
mounted_taxonomy_ref
regulatory_overlay_refs
schema_version
run_id
obligation_count
profile_level_limitations
validation_summary
lock_status
```

`candidate_id` is permitted only as the deterministic reconciliation key.

The model may not emit any final compiled-profile metadata.

## 6. Material field type gate

### Non-empty strings

The following must be non-empty strings:

```text
candidate_id
normalized_name
what_it_requires
target_specific_obligation_context
exposure_role_context
obligation_locus
obligation_trigger_timing
expected_control_signal
control_mechanism_present
control_posture_status
diligence_question
```

Whitespace-only values fail.

### String arrays

The following must be JSON arrays containing unique non-empty strings:

```text
authority_dependency
evidence_basis
missing_proof
limitation
```

Empty arrays are permitted only as expressly allowed by the backend contract:

- `authority_dependency`: only with a controlled limitation explaining why no Registry Key framework token could be selected;
- `evidence_basis`: only where the row explicitly records no usable public evidence and carries `missing_proof` plus `limitation`;
- `missing_proof`: permitted where no material proof gap remains;
- `limitation`: permitted where no material limitation remains.

### Derivation basis

`derivation_basis` must be an array of exactly fourteen entries.

## 7. Controlled vocabulary gate

`exposure_role_context` must be exactly one of:

```text
A
B
Both
UNRESOLVED
```

`control_mechanism_present` must be exactly one of:

```text
VISIBLE
NOT_VISIBLE
UNCLEAR
```

`control_posture_status` must be exactly one of:

```text
VISIBLE
PARTIAL
NOT_VISIBLE
UNRESOLVED
```

Reject alternate spelling, case, punctuation, synonyms, null, booleans, or numeric values.

## 8. Cross-field consistency gate

Reject obvious posture contradictions:

- `control_mechanism_present = VISIBLE` may pair only with `VISIBLE`, `PARTIAL`, or `UNRESOLVED` posture;
- `control_mechanism_present = NOT_VISIBLE` may pair only with `NOT_VISIBLE` or `UNRESOLVED` posture;
- `control_mechanism_present = UNCLEAR` may pair only with `PARTIAL` or `UNRESOLVED` posture.

Required limitation relationships:

- `exposure_role_context = UNRESOLVED` requires a role limitation;
- `control_mechanism_present = NOT_VISIBLE` requires non-empty `missing_proof` or `limitation`;
- `control_mechanism_present = UNCLEAR` requires non-empty `limitation`;
- `control_posture_status = UNRESOLVED` requires non-empty `limitation`;
- empty `authority_dependency` requires a framework/authority limitation;
- empty `evidence_basis` requires non-empty `missing_proof` and `limitation`.

The validator checks consistency only. It must not choose or repair the values.

## 9. Authority-dependency gate

For each candidate:

1. load the candidate's mounted Registry Key obligation entry;
2. collect its permitted `authority_dependency` tokens;
3. require every model token to be an exact member of that permitted set;
4. reject invented, expanded, translated, merged, or normalized tokens;
5. reject tokens taken from another candidate or an unmounted key.

The model may narrow the Registry Key list based on target context. It may not expand it.

Authority dependency is contextual only. Reject language asserting that a framework legally applies.

## 10. Derivation-basis schema gate

Each `derivation_basis[]` entry contains exactly:

```text
field_id
output_field
conditions_satisfied
trigger_outcome_applied
material_basis
limitation
```

Type rules:

- `field_id`: non-empty string;
- `output_field`: non-empty string;
- `conditions_satisfied`: array of non-empty strings;
- `trigger_outcome_applied`: non-empty string;
- `material_basis`: non-empty business-readable string;
- `limitation`: non-empty string or exact `NONE`.

The fourteen required `output_field` values are exactly:

```text
normalized_name
what_it_requires
target_specific_obligation_context
authority_dependency
exposure_role_context
obligation_locus
obligation_trigger_timing
expected_control_signal
control_mechanism_present
control_posture_status
evidence_basis
missing_proof
diligence_question
limitation
```

Required:

- exactly one basis entry per required output field;
- no duplicate output field;
- no entry for `candidate_id`;
- no entry for `derivation_basis`;
- no entry for a mechanical field.

`field_id` rule:

- use the exact FDR field ID where the active FDR directly governs the output field;
- otherwise use exactly `REGISTRY_KEY_MATERIAL::<output_field>`.

The validator must check direct FDR mappings dynamically from the active FDR rather than hardcoding a domain-specific rule set.

## 11. Target-specific materiality gate

Reject a row where:

- `what_it_requires` merely copies the Registry Key wording without target-specific adaptation;
- `target_specific_obligation_context` is generic or does not identify linked target mechanics;
- `expected_control_signal` is merely a catalog shell target or locator label;
- `evidence_basis` cites only Registry Key, catalog, index, route, or FDR metadata;
- all material fields repeat the same sentence;
- the row is schema-complete but substantively empty.

The Registry Key defines the obligation semantics. Routed lossless evidence and linked Phase 5 activity context support the target-specific analysis.

## 12. Evidence-boundary gate

Every target-specific factual statement must be supportable inside the candidate-scoped packet.

Reject:

- source use outside the Phase 2G packet;
- evidence from another candidate without an authorized shared route;
- free-corpus reasoning;
- browsing or source discovery;
- model-memory claims presented as target facts;
- Phase 7 DAP material;
- any forensic profile;
- unmounted package or overlay content.

The candidate's P2E packet is navigation. The routed lossless units are primary evidence.

## 13. Source-copy and custody gate

Reject URLs, source IDs, source pointers, route IDs, catalog IDs, quotes, excerpts, copied clauses, copied lossless text, raw text, markdown, HTML, or source-ledger structures anywhere in the model material payload.

Business-readable paraphrase is required.

Do not reject exact framework tokens in `authority_dependency`; those are controlled vocabulary, not source custody references.

## 14. Regulatory-overlay gate

Reject:

```text
regulatory_overlay_refs
regulatory_overlay_status
overlay_id
matched_frameworks
REGULATORY_OVERLAY source rows
```

The model cannot create or duplicate an obligation because a regulatory overlay is mounted.

The backend compiler alone performs Option A overlay enrichment after validating model-derived `authority_dependency`.

## 15. Forbidden legal-conclusion gate

Reject any statement that asserts or materially implies:

- legal applicability;
- compliance or non-compliance;
- satisfaction or breach;
- regulator jurisdiction;
- licence requirement, validity, invalidity, held status, or absence as a legal conclusion;
- legal adequacy of a control;
- liability.

Permitted framing:

- candidate obligation context;
- authority dependency;
- visible, partial, not-visible, unclear, or unresolved control posture;
- missing public proof;
- diligence question;
- local-counsel/reviewer follow-up need.

## 16. Forbidden artifact gate

Reject any output containing:

```text
domain_control_obligation_candidate_inventory
target_profile
domain_derivation_profile
target_feature_profile
any forensic artifact
any DAP artifact
any exposure artifact
challenge_gate
compiler artifact
renderer payload
Qualified Review artifact
```

Inputs must never be re-emitted.

## 17. Blocking and limitation gate

Treat as critical/blocking:

- malformed JSON;
- wrong top-level key;
- wrong inner key;
- missing or duplicate candidate row;
- missing material field;
- wrong field type;
- forbidden mechanical field;
- unauthorized evidence use;
- invented framework token;
- forbidden legal conclusion;
- source-copy leakage;
- output that cannot be reconciled safely.

Treat as controlled limitations rather than blockers:

- missing public control evidence;
- thin or ambiguous evidence;
- unresolved role;
- unresolved posture;
- absent framework selection within the permitted vocabulary;
- missing public proof;
- non-public implementation details.

The model must represent those conditions in the material row rather than omit the row.

## 18. Validation result

The model does not emit validation status or lock status.

The backend validator returns its own receipt and the runtime determines the final save lock status.