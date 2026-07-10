# MODULE VIII — TARGET FEATURE PROFILE

## M8.S0 — Phase Call Card

phase_id: M8_TARGET_FEATURE_PROFILE
module_id: M8
module_name: TARGET_FEATURE_PROFILE
active_phase_only: true
active_agent: agent_3_target_feature
canonical_material_output: target_feature_profile
canonical_forensic_output: target_feature_profile_forensics
runtime_contract_version: m8_phase5_package_aware_p2c_source_index_v5

## M8.S1 — Architecture Lock

`feature_candidate_inventory` is the deterministic source of truth for candidate existence.

`activity_profile_source_index` is the Phase 2C navigation authority for activity evidence.

`active_run_package_manifest` and the mounted domain package context control package-specific activity taxonomy. Fixed AI archetype and AI surface enums are not universal Phase 5 authority.

M8 does not discover, harvest, dedupe, or create the candidate universe. M8 consumes the saved candidate inventory and writes only `target_feature_profile`.

## M8.S2 — Governing Imports

M8 is governed by:

- 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
- AGENT3_RUNTIME_BINDING_PACKET.yaml
- 03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md
- 03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md
- 00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md
- AGENT3_BACKEND_OUTPUT_CONTRACT.md
- AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md
- 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
- 00_VALIDATOR_RULES_INTEGRATED.md
- references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md
- references/domain-packages/package-catalog.v0.json
- references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml
- FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml

If any older M8 wording conflicts with this file or 03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md, the package-aware Phase 5 rule controls.

## M8.S3 — Required Inputs

M8 must consume:

- cartography_index
- activity_profile_source_index
- target_profile
- target_profile_forensics
- feature_candidate_inventory
- domain_derivation_profile
- active_run_package_manifest
- domain_selection_profile
- references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md
- references/domain-packages/package-catalog.v0.json
- references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml
- FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml

M8 must not consume raw Phase 1 families or roots directly. The activity evidence path is:

```text
Phase 1 source artifacts → Phase 2C activity_profile_source_index → feature_candidate_inventory → target_feature_profile
```

## M8.S4 — Execution Boundary

M8_TARGET_FEATURE_PROFILE begins only after saved `feature_candidate_inventory` exists and is locked.

M8 must not:

- discover new sources
- browse
- crawl
- search the web
- fetch new URLs
- use memory or general knowledge about the target
- create candidates outside feature_candidate_inventory
- dedupe candidates
- mutate feature_candidate_inventory
- mutate target_profile or target_profile_forensics
- perform M7, M9, M10, M11, M12, M13, or M14 work
- evaluate legal/compliance/exposure/data-provenance conclusions
- emit report prose
- emit renderer payloads

## M8.S5 — Candidate Treatment Rules

Every canonical candidate in `feature_candidate_inventory.candidates[]` must be considered.

A candidate requiring product/activity treatment must appear as a visible activity row unless it was already merged as a duplicate by the deterministic inventory or the pointed activity source evidence is too thin to support mechanics after navigation.

Standalone API, model, integration, data-object interaction, external-action, and pricing-confirmed capability candidates must not be silently absorbed into product-wrapper rows. If grouping is necessary under the material card, the grouped candidate name must remain visible in `activity_feature_name` or `activity_candidate_summary`.

If M8 sees a public activity signal through `activity_profile_source_index` that is not represented in `feature_candidate_inventory`, M8 must not add that candidate as a normal activity. It must record a profile-level limitation requiring repair of `M8_FEATURE_CANDIDATE_INVENTORY`.

## M8.S6 — Evidence Rules

M8 must derive mechanics from source evidence reached through `activity_profile_source_index` / `feature_candidate_inventory` navigation pointers.

Route slugs, page titles, candidate names, source labels, pricing labels, and navigation labels are not mechanics proof by themselves.

M8 must not copy lossless excerpts into the material profile.

M8 must not place source URLs, source IDs, source pointers, candidate IDs, copied evidence excerpts, confidence fields, evidence ledgers, or forensic/provenance material inside `target_feature_profile`.

## M8.S7 — Package-Aware Activity Label Authority

`archetype_codes` and `surface_context_tokens` remain compatibility field names in the material card, but their values are package-controlled labels.

They are not hardcoded AI enum fields.

M8 must derive package labels from:

```text
active_run_package_manifest
package-catalog.v0.json
DOMAIN_PACKAGE_KEY_v0.md
public activity mechanics located through 2C
```

If the active package does not expose enough package taxonomy in v0, M8 must still fill the required fields with package-context-limited labels and must record a limitation explaining the taxonomy constraint.

M8 must not use CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml as an active derivation authority.

M8 must not derive Subcat, Authority, Compliance_Framework, Pain_Tier, Pain_Category, Pain_Depth, Status, Effective_Date, Velocity, Threat_Trigger, registry rows, legal risk, or exposure findings.

Every emitted activity must have at least one package-controlled label in `archetype_codes[]`.

Every emitted `archetype_codes[]` value must have exactly one matching `archetype_derivation_basis[]` entry whose `code_or_token` equals that value.

No `archetype_derivation_basis[]` entry may exist for a value not present in `archetype_codes[]`.

Every emitted `surface_context_tokens[]` value must have exactly one matching `surface_derivation_basis[]` entry whose `code_or_token` equals that value.

No `surface_derivation_basis[]` entry may exist for a value not present in `surface_context_tokens[]`.

`surface_context_tokens[]` must be an array. It may be empty only where no package/context label is supported after source lookup. If it is empty, `surface_derivation_basis[]` must also be empty.

## M8.S8 — Material Output Boundary

The only valid backend output for this phase is `target_feature_profile` with exactly three profile-level keys:

```text
activities[]
commercial_availability_posture
profile_level_limitations[]
```

M8 must not return:

- feature_candidate_inventory
- target_feature_profile_forensics
- target_profile
- target_profile_forensics
- activity_profile_source_index
- legal_cartography_index
- legal_signal_derivation_profile
- data_provenance_profile
- exposure_registry_profile
- challenge_gate
- final_output_handoff
- renderer_payload

M8 must not include inside `target_feature_profile`:

- candidate_id
- source_candidate_ids
- source_pointers
- source_refs
- source_urls
- source_ids
- evidence excerpts
- confidence fields
- route coverage rows
- derivation ledgers
- validation ledgers
- forensic branches
- lock_status
- validation_status
- profile_meta
- archetype_proof
- surface_proof_and_routing_limits

## M8.S9 — Activity Row Contract

Each activity row must contain exactly these 12 keys:

- activity_reference
- product_service_wrapper
- activity_feature_name
- activity_candidate_summary
- mechanics_proof
- autonomy_human_control_signal
- data_content_object_touched
- external_internal_action_signal
- archetype_codes
- archetype_derivation_basis
- surface_context_tokens
- surface_derivation_basis

No other activity keys are permitted under the current compatibility material schema.

The old fields `archetype_proof` and `surface_proof_and_routing_limits` are forbidden.

`activity_reference` must be stable and unique, using ACT.001, ACT.002, ACT.003, and continuing sequentially.

## M8.S10 — Commercial Availability

`commercial_availability_posture` must contain:

- posture
- free_trial_freemium_signal
- beta_pilot_early_access_signal
- paid_production_enterprise_plan_signal
- evidence_basis[]
- limitation

Commercial availability is not mechanics proof by itself. It confirms availability or commercial posture only when candidate/mechanics evidence supports the row.

## M8.S11 — Limitation Rule

If candidate evidence is too thin, package taxonomy is not expressive enough in v0, or source navigation is incomplete, use `profile_level_limitations[]` rather than inventing facts.
