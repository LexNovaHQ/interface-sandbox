# Target and Activity Profile Runtime Controller

## Runtime kernel

This file governs `agent_3_target_feature` only when assembled with `AGENT3_RUNTIME_BINDING_PACKET.yaml` and an active phase prompt.

The backend phase contract is the canonical permission source. Prompt text cannot expand backend read or write authority. For Target Profile Review, Domain Derivation Layer, and Activity Profile Review, Phase 2G is the sole runtime routing authority.

## Runtime execution rule

1. Read the runtime binding packet before the active phase prompt.
2. Execute only the active phase selected by the backend runner.
3. For 3A, 3B, and Phase 5, accept only the artifact packet resolved from `phase_routing_manifest` by `phase-route-runtime.reader`.
4. Treat lossless evidence in that packet as primary evidence and use the routed index as the mandatory navigation map.
5. Do not request or inspect any artifact outside the routed bucket and declared preceding derived-profile context.
6. Write only artifacts listed in the backend phase contract for that active phase.
7. Save material artifacts before forensic artifacts.
8. Do not emit downstream objects, final handoff artifacts, renderer payloads, Qualified Review artifacts, or same-chat receipts in backend mode.

## Active phase ownership

This package covers:

- Target Profile Review
- Domain Derivation Layer
- Target Profile Forensics
- Activity Profile Review
- Activity Profile Forensics

The package does not own Source Discovery, Phase 2 Cartography and Index, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, Normalized Report Renderer, or Qualified Review.

## Phase 2G boundary

For material profile jobs:

- `phase_routing_manifest` identifies the authorized route.
- `phase_route_runtime_packet` records the resolved route and bucket.
- Lossless evidence is primary evidence; it is not a fallback.
- Index navigation is mandatory.
- Free-corpus reads are forbidden.
- A material profile may receive its own bucket plus only the preceding derived profiles declared by 2G.
- Target, activity, DAP, and exposure forensic artifacts are forbidden as material-profile inputs.
- A phase may not widen its own packet.

## Target Profile Review read authority

Target Profile Review uses `ROUTE.PHASE3A.TARGET_PROFILE` and bucket `2A_BUCKET_TARGET_PROFILE`.

Its routed packet contains:

- `phase_routing_manifest`
- `phase_route_runtime_packet`
- `target_profile_source_index`
- `lossless_root__homepage_landing`
- `lossless_root__company_identity`
- `lossless_root__contact_notice`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__regulatory_licensing_status`
- `lossless_root__grievance_complaints`
- `legal_signal_derivation_profile`

`target_profile_source_index` is navigation support only. The scoped `lossless_root__*` target artifacts are primary source evidence.

Target Profile Review must not read or request:

- `source_discovery_handoff`
- `cartography_index`
- `domain_selection_profile`
- `active_run_package_manifest`
- `target_profile_forensics`
- `domain_derivation_source_index`
- `activity_profile_source_index`
- `legal_cartography_index`
- raw legal documents
- data-provenance roots
- retired pre-cutover family artifacts

## Target Profile Review regulatory and grievance signal rule

Target Profile Review may populate `business_context.public_regulatory_licensing_signal` and `business_context.public_grievance_complaints_signal` only as factual public operating-context signals from scoped target evidence.

Target Profile Review must not emit license validity, license requirement, applicable regulator conclusion, regulatory compliance status, grievance sufficiency, grievance compliance status, ombudsman requirement, or statutory complaint obligation.

## Direct legal signal rule

`legal_signal_derivation_profile` is the only legal-derived material available to Target Profile Review and arrives as a bounded dependency through 2G.

Target Profile Review may use only owned legal notice and jurisdiction signal rows:

- `LGC.NOT.010`
- `LGC.NOT.011`
- `LGC.NOT.012`
- `LGC.NOT.013`
- `TP.JUR.003`
- `TP.JUR.004`
- `TP.JUR.005`
- `TP.JUR.007`
- `TP.JUR.008`

Target Profile Review must not use `privacy_grievance_contact_signal_map` or `consent_manager_signal_map` for material derivation.

Direct signal rows are bounded field signals, not legal advice, legal sufficiency, or permission to inspect legal source text.

## Direct legal signal status handling

```text
DERIVED -> use value only if the target_profile schema permits.
DERIVED_WITH_LIMITATION -> use value only with target_profile_limitations entry.
LOCATOR_FOUND_VALUE_NOT_VISIBLE -> do not invent value; record controlled limitation.
SOURCE_NOT_PUBLIC -> do not invent value; record controlled limitation.
SOURCE_CONFLICT -> do not choose a winner; record conflict limitation.
NOT_APPLICABLE_CONTEXTUAL -> controlled not applicable where schema permits.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN -> do not invent value; record controlled limitation.
```

## Target Profile Review no-Lane rule

Target Profile Review must not derive or emit `business_context.lane`. Lane/domain package/AI mount decisions belong outside 3A.

## Domain Derivation Layer read authority

Domain Derivation Layer uses `ROUTE.PHASE3B.DOMAIN_DERIVATION` and bucket `2B_BUCKET_DOMAIN_DERIVATION`.

Its routed packet contains:

- `phase_routing_manifest`
- `phase_route_runtime_packet`
- `domain_derivation_source_index`
- `target_profile`
- `lossless_root__homepage_landing`
- `lossless_root__company_identity`
- `lossless_root__product_service`
- `lossless_root__platform_feature_solution`
- `lossless_root__technical_docs_api`
- `lossless_root__docs_api_data_flow`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__use_case_customer_industry`
- `lossless_root__integrations_ecosystem`
- `lossless_root__ai_safety_transparency`
- `lossless_root__regulatory_licensing_status`
- `lossless_root__grievance_complaints`
- `domain_selection_profile`
- `active_run_package_manifest`

Domain Derivation Layer may use only these references:

- `references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md`
- `references/domain-packages/package-catalog.v0.json`
- `references/registry/Diligence_Field_Derivation_Registry.yml`
- `references/registry/AI_Registry_Key.yml`
- `references/registry/FinTech_Registry_Key.yml`

`domain_derivation_source_index` is navigation only. The scoped 12 `lossless_root__*` artifacts are primary evidence. `target_profile` is context only and not proof.

Domain Derivation Layer must not read or request:

- `source_discovery_handoff`
- `cartography_index`
- `target_profile_source_index`
- `target_profile_forensics`
- `activity_profile_source_index`
- `legal_cartography_index`
- `legal_signal_derivation_profile`
- legal documents or legal source text
- data-provenance roots
- exposure, compiler, or Qualified Review artifacts

Domain Derivation Layer must evaluate the active rules assembled from the mounted Registry Keys (`domain_derivation_rules`) plus the Field Derivation Registry grammar; new domains and overlays are added by dropping a Registry Key and updating the catalog, not by prompt update. The model performs condition-level semantic evaluation and the deterministic validator/compiler remains lock authority.

Domain Derivation Layer must not derive or emit target profile edits, activity profile rows, archetypes, surface locks, exposure rows, legal advice, compliance conclusion, risk conclusion, Lane, or remediation route.

## Activity Profile Review read authority

Both Phase 5 jobs use `ROUTE.PHASE5.ACTIVITY_PROFILE` and bucket `2C_BUCKET_ACTIVITY_PROFILE`.

The routed bucket contains:

- `phase_routing_manifest`
- `phase_route_runtime_packet`
- `activity_profile_source_index`
- `target_profile`
- `domain_derivation_profile`
- `domain_selection_profile`
- `active_run_package_manifest`
- `lossless_root__product_service`
- `lossless_root__platform_feature_solution`
- `lossless_root__technical_docs_api`
- `lossless_root__docs_api_data_flow`
- `lossless_root__integrations_ecosystem`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__use_case_customer_industry`
- `lossless_root__support_help_resources`
- `lossless_root__ai_safety_transparency`

`M8_TARGET_FEATURE_PROFILE` additionally receives `feature_candidate_inventory` as a 2G-declared job-scoped derived artifact.

The candidate inventory job creates candidates only from `activity_profile_source_index` locators. It must not independently scan the routed lossless evidence or copy it into the inventory.

The material profile uses the same routed lossless evidence, navigated through `activity_profile_source_index` and candidate pointers, to derive mechanics and the material activity profile.

Neither Phase 5 job may read `target_profile_forensics`, `target_feature_profile_forensics`, legal/data indexes outside its route, or any downstream artifact.
