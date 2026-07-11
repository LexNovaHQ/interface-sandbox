# MODULE VIII — TARGET FEATURE PROFILE

## M8.S0 — Phase Call Card

phase_id: M8_TARGET_FEATURE_PROFILE
module_id: M8
module_name: TARGET_FEATURE_PROFILE
active_phase_only: true
active_agent: agent_3_target_feature
canonical_material_output: target_feature_profile
canonical_forensic_output: target_feature_profile_forensics
runtime_contract_version: m8_phase5_phase2g_route_scoped_v6

## M8.S1 — Architecture Lock

Phase 2G is the sole runtime routing authority for this material profile.

`feature_candidate_inventory` is the deterministic source of truth for candidate existence.

`activity_profile_source_index` is the mandatory Phase 2C navigation map into the primary activity lossless evidence supplied in the 2G packet.

`active_run_package_manifest` and the mounted domain package context control package-specific activity taxonomy. Fixed AI archetype and AI surface enums are not universal Phase 5 authority.

M8 does not discover, harvest, dedupe, or create the candidate universe. M8 consumes the saved candidate inventory, navigates the routed 2C evidence, and writes only `target_feature_profile`.

## M8.S2 — Governing Imports

M8 is governed by:

- 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
- AGENT3_RUNTIME_BINDING_PACKET.yaml
- 03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md
- 03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md
- 00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md
- AGENT3_BACKEND_OUTPUT_CONTRACT.md
- AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md
- 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
- 00_VALIDATOR_RULES_INTEGRATED.md
- references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md
- references/domain-packages/package-catalog.v0.json
- references/registry/Diligence_Field_Derivation_Registry.yml
- references/registry/AI_Registry_Key.yml
- references/registry/FinTech_Registry_Key.yml
- FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml

If older M8 wording conflicts with this file, the Phase 2G route, phase-owned contract, and this package-aware rule control.

## M8.S3 — Required Inputs

M8 must consume only the artifacts delivered through:

```text
ROUTE.PHASE5.ACTIVITY_PROFILE
2C_BUCKET_ACTIVITY_PROFILE
```

Required packet artifacts:

- `phase_routing_manifest`
- `phase_route_runtime_packet`
- `activity_profile_source_index`
- `target_profile`
- `feature_candidate_inventory`
- `domain_derivation_profile`
- `active_run_package_manifest`
- `domain_selection_profile`
- `lossless_root__product_service`
- `lossless_root__platform_feature_solution`
- `lossless_root__technical_docs_api`
- `lossless_root__docs_api_data_flow`
- `lossless_root__integrations_ecosystem`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__use_case_customer_industry`
- `lossless_root__support_help_resources`
- `lossless_root__ai_safety_transparency`

Required references:

- `references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md`
- `references/domain-packages/package-catalog.v0.json`
- `references/registry/Diligence_Field_Derivation_Registry.yml`
- `references/registry/AI_Registry_Key.yml`
- `references/registry/FinTech_Registry_Key.yml`
- `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml`

M8 must not consume `source_discovery_handoff`, `cartography_index`, `target_profile_forensics`, `target_feature_profile_forensics`, raw `lossless_family__*` artifacts, or any evidence outside the routed 2C bucket.

The activity evidence path is:

```text
Phase 2G 2C packet → activity_profile_source_index navigation → feature_candidate_inventory treatment → target_feature_profile
```

## M8.S4 — Execution Boundary

M8_TARGET_FEATURE_PROFILE begins only after saved `feature_candidate_inventory` exists and is locked.

M8 must not:

- discover new sources;
- browse, crawl, search the web, or fetch new URLs;
- use memory or general knowledge about the target;
- read outside the Phase 2G packet;
- use any forensic profile as a material-profile input;
- create candidates outside `feature_candidate_inventory`;
- dedupe or mutate candidates;
- mutate upstream artifacts;
- perform legal, data-provenance, exposure, operator, compiler, or review work;
- emit report prose or renderer payloads.

## M8.S5 — Candidate Treatment Rules

Every canonical candidate in `feature_candidate_inventory.candidates[]` must be considered.

A candidate requiring product/activity treatment must appear as a visible activity row unless it was already merged as a duplicate by the deterministic inventory or the pointed activity evidence is too thin to support mechanics after index-guided navigation.

Standalone API, model, integration, data-object interaction, external-action, and pricing-confirmed capability candidates must not be silently absorbed into product-wrapper rows. If grouping is necessary, the grouped candidate name must remain visible in `activity_feature_name` or `activity_candidate_summary`.

If M8 sees a public activity signal through index-guided reading of the routed primary evidence that is not represented in `feature_candidate_inventory`, M8 must not add that candidate as a normal activity. It must record a profile-level limitation requiring repair of `M8_FEATURE_CANDIDATE_INVENTORY`.

## M8.S6 — Evidence Rules

Lossless evidence in the 2C packet is primary evidence. It is not a fallback.

M8 must derive mechanics from that evidence only after navigating through `activity_profile_source_index` and `feature_candidate_inventory` pointers.

Route slugs, page titles, candidate names, source labels, pricing labels, and navigation labels are not mechanics proof by themselves.

M8 must not make free-corpus reads or copy lossless excerpts into the material profile.

M8 must not place source URLs, source IDs, source pointers, candidate IDs, copied evidence excerpts, confidence fields, evidence ledgers, or forensic/provenance material inside `target_feature_profile`.

## M8.S7 — Package-Aware Activity Label Authority

`archetype_codes` and `surface_context_tokens` remain compatibility field names in the material card, but their values are package-controlled labels, not hardcoded AI enum fields.

M8 must derive package labels from:

```text
active_run_package_manifest
package-catalog.v0.json
DOMAIN_PACKAGE_KEY_v0.md
Diligence_Field_Derivation_Registry.yml Product/Activity grammar
mounted Registry Keys' behavior_class and surface axes
public activity mechanics reached through 2C navigation
```

If the active package does not expose enough package taxonomy, M8 must still fill the required fields with package-context-limited labels and record a limitation explaining the constraint.

The retired standalone classification matrix is not active derivation authority. Product and Activity taxonomy comes from the FDR Product/Activity section plus the mounted key's `behavior_class` and `surface` axes.

M8 must not derive Subcat, Authority, Compliance_Framework, Pain_Tier, Pain_Category, Pain_Depth, Status, Effective_Date, Velocity, Threat_Trigger, registry rows, legal risk, or exposure findings.

Every emitted activity must have at least one package-controlled label in `archetype_codes[]`.

Every `archetype_codes[]` value must have exactly one matching `archetype_derivation_basis[]` entry. No basis entry may exist for an unselected value.

Every `surface_context_tokens[]` value must have exactly one matching `surface_derivation_basis[]` entry. No basis entry may exist for an unselected token.

`surface_context_tokens[]` may be empty only where no package/context label is supported after source lookup. In that case, `surface_derivation_basis[]` must also be empty.

## M8.S8 — Material Output Boundary

The only valid backend output is `target_feature_profile` with exactly three profile-level keys:

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
- phase_route_runtime_packet
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

If candidate evidence is too thin, package taxonomy is not expressive enough, or source navigation is incomplete, use `profile_level_limitations[]` rather than inventing facts.
