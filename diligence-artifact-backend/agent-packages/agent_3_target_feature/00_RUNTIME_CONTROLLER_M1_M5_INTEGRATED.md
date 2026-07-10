# Target and Activity Profile Runtime Controller

## Runtime kernel

This file governs `agent_3_target_feature` only when assembled with `AGENT3_RUNTIME_BINDING_PACKET.yaml` and an active phase prompt.

The backend phase contract is the canonical permission source. Prompt text cannot expand backend read or write authority.

## Runtime execution rule

1. Read the runtime binding packet before the active phase prompt.
2. Execute only the active phase selected by the backend runner.
3. Read only artifacts listed in the backend phase contract for that active phase.
4. Write only artifacts listed in the backend phase contract for that active phase.
5. Save material artifacts before forensic artifacts.
6. Do not emit downstream objects, final handoff artifacts, renderer payloads, Qualified Review artifacts, or same-chat receipts in backend mode.

## Active phase ownership

This package currently covers these compatibility surfaces until each phase is migrated into its own phase folder:

- Target Profile Review
- Domain Derivation Layer
- Target Profile Forensics
- Activity Profile Review
- Activity Profile Forensics

The package does not own Source Discovery, Legal Cartography and Index, Phase 2A Target Profile Source Index, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, Normalized Report Renderer, or Qualified Review.

## Target Profile Review read authority

Target Profile Review is scoped target-profile material derivation.

Target Profile Review may read only:

- `source_discovery_handoff`
- `cartography_index`
- `target_profile_source_index`
- `lossless_root__homepage_landing`
- `lossless_root__company_identity`
- `lossless_root__contact_notice`
- `lossless_root__pricing_commercial_availability`
- `lossless_root__regulatory_licensing_status`
- `lossless_root__grievance_complaints`
- `legal_signal_derivation_profile`
- `domain_selection_profile`
- `active_run_package_manifest`

`cartography_index` and `target_profile_source_index` are navigation support only. The scoped `lossless_root__*` target artifacts are the source evidence.

`target_profile_source_index` is the active Phase 2A locator authority. It routes Target Profile Review to evidence; it does not supply target-profile values.

Target Profile Review must not read or request:

- `legal_cartography_index`
- `legal_doc_inventory`
- `legal_doc_extraction_index`
- `legal_doc_{DOC_TYPE}`
- raw legal/governance source text
- `m7_deterministic_legal_signal_overlay`
- `target_profile_deterministic_map`
- `target_profile_semantic_profile`
- activity/product roots outside the scoped target list
- data-provenance roots
- retired pre-cutover family artifacts

Target Profile Review must not block because legal/governance lossless artifacts are absent. Missing or limited direct legal signal rows become controlled field statuses and limitation rows.

## Target Profile Review regulatory and grievance signal rule

Target Profile Review may populate `business_context.public_regulatory_licensing_signal` and `business_context.public_grievance_complaints_signal` only as factual public operating-context signals from scoped target evidence.

Target Profile Review must not emit license validity, license requirement, applicable regulator conclusion, regulatory compliance status, grievance sufficiency, grievance compliance status, ombudsman requirement, or statutory complaint obligation.

## Direct legal signal rule

`legal_signal_derivation_profile` is the only Legal Cartography and Index-derived material available to Target Profile Review.

Target Profile Review may use it only for owned legal notice and jurisdiction signal rows:

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

Target Profile Review must treat direct signal rows as bounded field signals, not legal advice, not legal sufficiency, and not permission to inspect legal-family source text.

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

Domain Derivation Layer is Phase 3B and uses the registry ladder prompt `02B_P3_DOMAIN_DERIVATION_LAYER_BACKEND.md`.

Domain Derivation Layer may read only:

- `source_discovery_handoff`
- `cartography_index`
- `target_profile_source_index`
- `activity_profile_source_index`
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
- `domain_selection_profile`
- `active_run_package_manifest`

Domain Derivation Layer may use only these references:

- `references/domain-packages/DOMAIN_PACKAGE_KEY_v0.md`
- `references/domain-packages/package-catalog.v0.json`
- `references/domain-packages/DOMAIN_DERIVATION_REGISTRY_v0.yaml`

Domain Derivation Layer must treat `cartography_index`, `target_profile_source_index`, and `activity_profile_source_index` as navigation only. The scoped target/activity `lossless_root__*` artifacts are the evidence source. `target_profile` is context only and not proof.

## Domain Derivation Layer registry ladder rule

Domain Derivation Layer must not hardcode domain classification logic. It must evaluate the active rules in `DOMAIN_DERIVATION_REGISTRY_v0.yaml` and package identities in `package-catalog.v0.json`.

New domains, overlays, fusion candidates, and regulatory overlays are added by registry/catalog update, not by prompt update.

The model derives condition-level semantic evaluations. The deterministic validator/compiler is the lock authority.

## Domain Derivation Layer forbidden rule

Domain Derivation Layer must not read or request:

- `legal_cartography_index`
- `legal_signal_derivation_profile`
- `legal_doc_inventory`
- `legal_doc_extraction_index`
- `legal_doc_{DOC_TYPE}`
- legal/governance source text
- data-provenance roots
- privacy/security/trust roots
- retired pre-cutover family artifacts
- exposure artifacts
- compiler artifacts
- Qualified Review artifacts

Domain Derivation Layer must not derive or emit target profile edits, activity profile rows, archetypes, surface locks, exposure rows, legal advice, compliance conclusion, risk conclusion, Lane, or remediation route.

## Activity Profile Review read authority

Activity Profile Review may read target profile artifacts, feature candidate inventory, domain derivation context, and product/activity evidence as authorized by the backend phase contract.

Activity Profile Review must not use Target Profile Review or Domain Derivation Layer to backdoor legal/governance source material.

## Runtime stop rules

If the binding packet, active prompt, validator, or reference material conflicts with the backend phase contract, the backend phase contract wins.

If a required field cannot be supported from allowed artifacts, emit a controlled limitation rather than requesting forbidden upstream legal material.