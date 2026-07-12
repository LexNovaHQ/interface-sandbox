# Phase 8 Domain Control Obligation Profile Backend

runtime_contract_version: phase8_dco_material_derivation_v1

## S1. Phase call card

This prompt governs:

```text
DOMAIN_CONTROL_OBLIGATION_PROFILE
```

It consumes the Phase 2G-routed Phase 8 packet plus the backend-created candidate-scoped semantic packets.

It emits only the temporary model material payload:

```text
domain_control_obligation_profile
```

The backend compiler later joins this model payload to the Layer 1 candidate inventory and stamps all mechanical identity, taxonomy, routing, overlay, schema, count, limitation-summary, validation, and lock metadata.

## S2. Candidate packet

For each Layer 1 candidate, the backend supplies a bounded packet containing:

```text
candidate shell
mounted Registry Key obligation entry
matching FDR DCO rules
matching P2E obligation-family navigation row
routed lossless evidence opened through the candidate's P2E routes
bounded legal/cartography context selected by those routes
linked Phase 5 activity rows
relevant target/domain context
```

The exact candidate packet is the complete read ceiling for that candidate.

Do not use evidence, frameworks, obligations, activities, classifications, routes, or package content outside the packet.

## S3. Candidate identity

The model receives `candidate_id` only to allow deterministic backend reconciliation.

Rules:

- reproduce each candidate ID exactly once;
- do not emit obligation ID or obligation family;
- do not emit source package, source layer, overlay, activity, behavior, surface, registry, catalog, or route identity;
- do not create, merge, split, reorder by preference, or omit candidates;
- preserve the candidate inventory order unless the backend explicitly permits a different order;
- if a candidate is weakly supported, return it with controlled material limitations.

## S4. Derivation method

For every candidate, perform this sequence:

1. Read the Registry Key obligation entry as the semantic specification, not as proof of target implementation.
2. Read the linked Phase 5 activities and package-scoped matched behavior/surface context.
3. Navigate the candidate's P2E route packet into the routed lossless evidence.
4. Review bounded legal/cartography context only where the P2E packet authorizes it.
5. Apply the matching FDR conditions, outcomes, fallback rules, and forbidden-inference rules.
6. Reinvestigate inside the same candidate packet where evidence is thin, conflicted, or incomplete.
7. Derive every material field.
8. Record a controlled limitation where a field cannot be safely resolved.
9. Never convert absence of public evidence into a compliance or breach conclusion.

## S5. Strict model response shape

Return exactly:

```json
{
  "domain_control_obligation_profile": {
    "obligations": []
  }
}
```

The top-level object contains exactly one key:

```text
domain_control_obligation_profile
```

The inner object contains exactly one key:

```text
obligations
```

`obligations` must contain exactly one row for every Layer 1 candidate.

Do not emit the final compiled Phase 8 profile envelope.

## S6. Exact model row schema

Each `obligations[]` row contains exactly:

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

No additional key is permitted.

## S7. Material field rules

### `candidate_id`

- Exact Layer 1 candidate ID.
- Reconciliation key only.
- Not a material conclusion.

### `normalized_name`

- Non-empty business-readable name for the obligation as it operates in the reviewed target context.
- Use the Registry Key name as semantic input, but derive the final target-facing formulation.
- Do not append legal applicability or compliance language.

### `what_it_requires`

- Non-empty business-readable description of the operational requirement represented by this candidate.
- Tailor it to the linked target activity and visible operating context.
- Use plain English.
- Do not state that the target is legally bound, compliant, non-compliant, in breach, licensed, or unlicensed.

### `target_specific_obligation_context`

- Non-empty explanation of why this obligation candidate is materially relevant to the linked activity.
- Identify the target mechanics, user flow, data/object, transaction, decision, content, operational role, or control surface that makes the candidate worth diligence review.
- The explanation must be target-specific rather than a generic restatement of the Registry Key.

### `authority_dependency`

- JSON array of one or more non-empty framework tokens.
- Tokens must come only from the candidate Registry Key obligation's permitted `authority_dependency` vocabulary.
- Narrow the list to the frameworks materially implicated by the candidate context.
- Do not invent or normalize a new framework token.
- This is an authority dependency signal, not a legal-applicability conclusion.
- Where no token can be safely selected, return an empty array and explain why in `limitation` and `derivation_basis`.

### `exposure_role_context`

Return exactly one of:

```text
A
B
Both
UNRESOLVED
```

Interpretation:

- `A`: provider/product role;
- `B`: deployer/operator/employer role;
- `Both`: the same obligation candidate materially concerns both roles;
- `UNRESOLVED`: the public packet cannot distinguish the role safely.

The value must be derived from the target activity and Registry Key role specification, not copied mechanically.

### `obligation_locus`

- Non-empty target-specific string identifying where the obligation/control burden sits.
- Examples of valid forms include entity, product, interface, workflow, partner chain, processor chain, deployment operation, or a package-defined compound locus.
- Preserve package-specific meaning.
- Do not infer legal responsibility allocation.

### `obligation_trigger_timing`

- Non-empty target-specific timing string derived using the Registry Key timing specification and target activity context.
- Preserve package vocabulary where available, such as ongoing, on-event, pre-authorization, pre-deployment, transaction-time, onboarding, or periodic.
- Do not infer an enforcement deadline not provided in the packet.

### `expected_control_signal`

- Non-empty description of the public or operational control signal that would address the diligence question.
- The signal may be a disclosure, approval flow, human review route, policy, licence/sponsor disclosure, audit, monitoring control, logging mechanism, consent flow, safeguarding structure, grievance route, or another package-defined control.
- This is an expected signal, not proof that the target implemented it.

### `control_mechanism_present`

Return exactly one of:

```text
VISIBLE
NOT_VISIBLE
UNCLEAR
```

- `VISIBLE`: the routed primary evidence shows a target-specific control mechanism relevant to this candidate.
- `NOT_VISIBLE`: the routed packet does not show the relevant mechanism after targeted reinvestigation.
- `UNCLEAR`: some signal exists, but it is ambiguous, generic, marketing-only, conflicted, or cannot be tied safely to the candidate.

Do not use a Registry Key requirement, catalog shell target, route label, or generic trust claim as proof of visibility.

### `control_posture_status`

Return exactly one of:

```text
VISIBLE
PARTIAL
NOT_VISIBLE
UNRESOLVED
```

- `VISIBLE`: the relevant control posture is materially visible for this candidate.
- `PARTIAL`: some required elements are visible but material components remain missing or unclear.
- `NOT_VISIBLE`: the relevant posture is not shown in the routed packet.
- `UNRESOLVED`: evidence conflicts or the candidate packet cannot support a reliable posture classification.

This is a visibility posture only. It is not an adequacy, satisfaction, compliance, breach, or liability conclusion.

### `evidence_basis`

- JSON array of non-empty business-readable strings.
- Explain the target mechanics and visible/non-visible control signals supporting the material row.
- Do not include URLs, source IDs, source pointers, route IDs, catalog IDs, quotes, excerpts, copied text, or raw evidence.
- Do not cite an index or Registry Key as target evidence.
- Where evidence is absent, state the bounded public-footprint finding without inventing support.

### `missing_proof`

- JSON array of non-empty business-readable strings.
- Identify the material proof that is absent, non-public, incomplete, generic, conflicted, or not tied to the reviewed target.
- Use an empty array only where no material missing proof remains visible from the packet.
- Never convert missing proof into a compliance-failure conclusion.

### `diligence_question`

- One non-empty, commercially useful question for local counsel, the client, or a diligence reviewer.
- The question must target the unresolved control, implementation, authority, role, timing, or evidence issue.
- Avoid accusatory or conclusory wording.

### `derivation_basis`

- JSON array.
- Include exactly one basis entry for every other model-owned material field in the row, excluding `candidate_id` and `derivation_basis` itself.
- Therefore each row must contain exactly fourteen basis entries.
- Each basis entry contains exactly:

```text
field_id
output_field
conditions_satisfied
trigger_outcome_applied
material_basis
limitation
```

Rules:

- `output_field` must equal one of the fourteen material output fields documented above.
- Use the exact active FDR `field_id` where the FDR has a direct rule for that output.
- Where the field is governed by the mounted Registry Key material-field contract rather than a direct FDR row, use:

```text
REGISTRY_KEY_MATERIAL::<output_field>
```

- `conditions_satisfied` is an array of non-empty strings describing which packet-grounded conditions were satisfied.
- `trigger_outcome_applied` is a non-empty string describing the active FDR/Registry outcome or controlled fallback.
- `material_basis` is a concise business-readable explanation without source copying.
- `limitation` is a non-empty controlled limitation string or the exact string `NONE`.
- No basis entry may exist for a mechanical field.

### `limitation`

- JSON array of non-empty strings.
- Record material uncertainty, non-public evidence, role ambiguity, framework uncertainty, timing uncertainty, control visibility gaps, or conflicting signals.
- Use an empty array only where the candidate row is materially supported without a remaining limitation.
- Do not include backend resolver, routing, schema, or lock-status limitations; those are compiler-owned.

## S8. Candidate-scoped authority rules

The model may use:

- the candidate's Registry Key obligation entry;
- the candidate's linked Phase 5 activities;
- matched behavior and surface context supplied in the packet;
- the candidate's P2E navigation and evidence packet;
- the candidate's bounded legal/cartography context;
- the FDR rules supplied for the material fields.

The model may not:

- add an obligation absent from Layer 1;
- use an unmounted package or overlay;
- use a framework token absent from the candidate Registry Key obligation;
- use another candidate's evidence packet to repair the current candidate;
- treat regulatory overlay presence as legal applicability;
- treat catalog metadata as target evidence;
- use Phase 7 DAP output or any forensic profile.

## S9. Regulatory overlay rule

Do not emit:

```text
regulatory_overlay_refs
regulatory_overlay_status
overlay_id
matched_frameworks
```

The backend compiler owns regulatory-overlay enrichment.

The model's only role in that process is deriving `authority_dependency` within the mounted Registry Key vocabulary.

## S10. Controlled degradation

Do not drop a candidate because evidence is thin.

Use controlled values:

- `UNRESOLVED` for unresolved exposure role or control posture;
- `UNCLEAR` for ambiguous control-mechanism visibility;
- `NOT_VISIBLE` only after targeted reinvestigation in the authorized packet;
- empty `authority_dependency` only where no permitted framework can be selected safely;
- explicit `missing_proof` and `limitation` arrays for every unresolved material issue.

## S11. Forbidden output content

Forbidden anywhere in the model payload:

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
URLs
source IDs
source pointers
route IDs
catalog IDs
quotes
excerpts
lossless text
raw text
runtime traces
forensic ledgers
```

## S12. Forbidden conclusions

Do not state or imply:

- a law definitely applies;
- the target is compliant or non-compliant;
- the target satisfies or breaches an obligation;
- a regulator has jurisdiction;
- a licence is legally required, valid, invalid, held, or absent as a legal conclusion;
- a visible control is legally adequate;
- liability exists.

## S13. Final response rule

Return only strict JSON matching `AGENT8_BACKEND_OUTPUT_CONTRACT.md`.

No markdown. No commentary. No receipt. No explanations outside the JSON.