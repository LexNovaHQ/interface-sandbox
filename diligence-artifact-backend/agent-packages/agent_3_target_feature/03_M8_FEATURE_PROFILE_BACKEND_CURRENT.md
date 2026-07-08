# MODULE VIII — TARGET FEATURE PROFILE

## M8.S0 — Phase Call Card

phase_id: M8_TARGET_FEATURE_PROFILE
module_id: M8
module_name: TARGET_FEATURE_PROFILE
active_phase_only: true
active_agent: agent_3_target_feature
canonical_material_output: target_feature_profile
canonical_forensic_output: target_feature_profile_forensics
runtime_contract_version: m8_ai_registry_key_direct_authority_step1

## M8.S1 — Architecture Lock

feature_candidate_inventory is the deterministic source of truth for M8 candidate existence.

M8 does not discover, harvest, dedupe, or create the candidate universe.

M8 consumes the saved feature_candidate_inventory as a navigation map and uses P1-P5 lossless artifacts only as evidence for mechanics, grouping, archetype derivation, surface-token derivation, limitations, and profile wording.

The inventory answers only: what candidate exists, and where M8 should look.

M8 answers only: what the evidenced candidate does, which activity mechanics are visible, which archetypes and surfaces are supported, and how the clean material activity row should be written.

Lossless evidence remains exclusively in the lossless_family__P* artifacts. feature_candidate_inventory is not evidence text.

## M8.S2 — Governing Imports

M8 is governed by:

- 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
- AGENT3_RUNTIME_BINDING_PACKET.yaml
- 03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md
- 00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md
- 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
- 00_VALIDATOR_RULES_INTEGRATED.md
- AI_REGISTRY_KEY.md
- FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
- FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml

AI_REGISTRY_KEY.md is the sole active authority for Activity Profile archetype and surface derivation.

CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml is superseded for Activity Profile material derivation and must not be used as a controlling M8 reference.

If any older M8 wording conflicts with 03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md, the inventory contract controls for candidate existence and navigation.

If any older M8 wording conflicts with AI_REGISTRY_KEY.md, AI_REGISTRY_KEY.md controls for archetype and surface derivation.

## M8.S3 — Required Inputs

M8 must consume:

- feature_candidate_inventory
- source_discovery_handoff
- target_profile
- target_profile_forensics
- lossless_family__P1_PRODUCT
- lossless_family__P2_PLATFORM_FEATURE_SOLUTION
- lossless_family__P3_AI_CAPABILITY_TECHNICAL
- lossless_family__P4_USE_CASE_INDUSTRY
- lossless_family__P5_ENTERPRISE_PRICING
- AI_REGISTRY_KEY.md
- FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
- FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml

feature_candidate_inventory.candidates[] is the mandatory candidate universe.

feature_candidate_inventory.candidates[].source_pointers[] is used only to navigate to the matching P1-P5 lossless source object.

P4 may support semantic context, but it does not create candidate existence unless the deterministic inventory has already indexed the candidate.

## M8.S4 — Execution Boundary

M8_TARGET_FEATURE_PROFILE begins only after saved feature_candidate_inventory exists and is locked.

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
- mutate M7 artifacts
- perform M7 work
- perform M9 work
- perform M10 work
- perform M11 work
- perform M12 work
- perform M13 work
- perform M14 work
- evaluate registry rows
- emit report prose
- emit renderer payloads

## M8.S5 — Candidate Treatment Rules

Every canonical candidate in feature_candidate_inventory.candidates[] must be considered.

A candidate requiring product/activity treatment must appear as a visible activity row unless it was already merged as a duplicate by the deterministic inventory or the pointed lossless evidence is too thin to support mechanics after source lookup.

Standalone API candidates should normally become direct activity rows because they are separately addressable developer-facing productized capabilities.

Model catalogue or model-access candidates should normally become direct activity rows where public source evidence indicates model access, invocation, deployment, or productized availability.

Integration candidates should normally become direct activity rows where public source evidence shows supported integration pathways, deployment surfaces, runtime infrastructure, or agent framework integrations.

Pricing-confirmed candidates must not create mechanics by themselves. Pricing can confirm availability or commercial surface only after the corresponding product/API/model/source evidence is checked.

Standalone API, model, integration, and pricing-confirmed capability candidates must not be silently absorbed into product-wrapper rows.

If grouping is necessary under the activity card, the grouped candidate name must remain visible in activity_feature_name or activity_candidate_summary.

If M8 sees a public feature in lossless source that is not present in feature_candidate_inventory, M8 must not add that feature as a normal activity. M8 must record a profile-level limitation requiring repair of M8_FEATURE_CANDIDATE_INVENTORY.

## M8.S6 — Evidence Rules

M8 must derive mechanics from lossless source text reached through the candidate's source pointers.

Route slugs, page titles, candidate names, source labels, pricing labels, and navigation labels are not mechanics proof by themselves.

M8 may use the candidate name and source pointer only to locate the source object.

M8 must not copy lossless excerpts into the material profile.

M8 must not place source URLs, source IDs, source pointers, candidate IDs, or evidence ledgers inside target_feature_profile.

## M8.S7 — Archetype and Surface Authority

M8 must derive archetypes directly from AI_REGISTRY_KEY.md §4.

M8 must derive surface tokens directly from AI_REGISTRY_KEY.md §7.

M8 must not use CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml as an active derivation authority.

M8 must not derive Subcat, Authority, Compliance_Framework, Pain_Tier, Pain_Category, Pain_Depth, Status, Effective_Date, Velocity, Threat_Trigger, registry rows, legal risk, or exposure findings.

Every mechanically valid emitted activity must be tested against the active archetype vocabulary authorized by the current material validator.

Every emitted activity must be tested against all locked surface tokens:

- Consumer-Public
- Enterprise-Private
- PII
- Employment
- Sensitive/Biometric
- Financial
- Content&IP
- Safety&Physical
- Infrastructure
- Minors

Every emitted activity must have at least one evidence-supported archetype code.

surface_context_tokens must be an array. It may be empty only where no surface token is supported after source lookup.

## M8.S8 — Material Output Boundary

The only valid backend output for this phase is target_feature_profile with exactly three profile-level keys: activities[], commercial_availability_posture, and profile_level_limitations[].

M8 must not return:

- feature_candidate_inventory
- target_feature_profile_forensics
- target_profile
- target_profile_forensics
- legal_cartography_index
- data_provenance_profile
- exposure_registry_profile
- challenge_gate
- final_output_handoff
- renderer_payload

M8 must not include inside target_feature_profile:

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
- archetype_proof
- surface_context_tokens
- surface_proof_and_routing_limits

No other activity keys are permitted under the current material schema.

activity_reference must be stable and unique, using ACT.001, ACT.002, ACT.003, and continuing sequentially.

activity_feature_name must be specific enough for deterministic downstream matching to the inventory candidate.

Do not use vague names like AI platform, API service, enterprise AI, language tool, or automation feature where the inventory candidate is specific.

## M8.S10 — Field Guidance

product_service_wrapper should identify the visible product, API family, model family, integration surface, or service wrapper.

activity_feature_name should name the concrete activity or capability.

activity_candidate_summary should summarize the evidenced activity in plain English.

mechanics_proof should explain what the source shows the activity does. It must be based on lossless evidence, not route labels.

autonomy_human_control_signal should state whether the activity appears automated, human-assisted, agentic, workflow-based, manual, review-based, or unclear from public material.

data_content_object_touched should state the visible object acted on, such as documents, speech, text, video, voice, images, translations, models, APIs, customer workflows, integrations, or unclear.

external_internal_action_signal should state whether the activity appears customer-facing, internal/admin-facing, developer-facing, enterprise-deployment-facing, or unclear.

archetype_codes must be an array of supported locked archetype codes.

archetype_proof must explain why the selected archetype codes are supported under AI_REGISTRY_KEY.md §4.

surface_context_tokens must be an array of supported surface tokens.

surface_proof_and_routing_limits must explain supported surface tokens under AI_REGISTRY_KEY.md §7 and any public-evidence limitations.

## M8.S11 — Profile-Level Limitations

profile_level_limitations[] may be used only for missing source pointer, missing lossless artifact, missing source object, evidence-thin candidate, inventory repair requirement, candidate not mechanically supported, or classification not supportable after source lookup.

It must not contain forensic ledgers, source excerpts, route coverage rows, or candidate IDs.

Limitations must be business-readable.

## M8.S12 - Final Gate

Before returning, verify:

1. Output has exactly one top-level key: `target_feature_profile`.
2. target_feature_profile has exactly `activities[]`, `commercial_availability_posture`, and `profile_level_limitations[]`.
3. Every activity has exactly the locked 12 keys.
4. `commercial_availability_posture` has exactly these six keys: `posture`, `free_trial_freemium_signal`, `beta_pilot_early_access_signal`, `paid_production_enterprise_plan_signal`, `evidence_basis`, and `limitation`.
5. `commercial_availability_posture.evidence_basis` is an array and contains no source URLs, source IDs, source pointers, copied excerpts, confidence fields, or forensic rows.
6. No candidate IDs, source pointers, source URLs, excerpts, confidence fields, validation fields, or forensic branches appear in the material profile.
7. Every emitted activity has at least one archetype code.
8. Every emitted activity has a `surface_context_tokens` array.
9. Every inventory candidate requiring treatment has a visible activity row or a profile-level limitation.
10. No standalone API, model, integration, or pricing-confirmed candidate has been silently absorbed into a product wrapper.
11. No unindexed candidate has been added as a normal activity.
12. No forensic output is emitted.
13. No Activity Profile material instruction treats CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml as active authority.

If any condition fails, repair the material output only. Do not emit forensics.

## M8.S13 - Final Backend JSON Shape

Return strict JSON only with exactly this shape:

```json
{
  "target_feature_profile": {
    "activities": [
      {
        "activity_reference": "ACT.001",
        "product_service_wrapper": "",
        "activity_feature_name": "",
        "activity_candidate_summary": "",
        "mechanics_proof": "",
        "autonomy_human_control_signal": "",
        "data_content_object_touched": "",
        "external_internal_action_signal": "",
        "archetype_codes": [],
        "archetype_proof": "",
        "surface_context_tokens": [],
        "surface_proof_and_routing_limits": ""
      }
    ],
    "commercial_availability_posture": {
      "posture": "",
      "free_trial_freemium_signal": "",
      "beta_pilot_early_access_signal": "",
      "paid_production_enterprise_plan_signal": "",
      "evidence_basis": [],
      "limitation": ""
    },
    "profile_level_limitations": []
  }
}
```

## M8.S14 - QR Commercial Availability Posture Addendum

This addendum documents target_feature_profile.commercial_availability_posture, the profile-level commercial availability object already incorporated into M8.S12 and M8.S13. It does not modify, weaken, or expand the locked activity card in M8.S9.

No other profile-level material object is authorized by this addendum.

### M8.S14A — Registry Authority

M8 may derive `commercial_availability_posture` only through the locked `PA.COM.*` registry family:

- `PA.COM.001` — commercial availability posture
- `PA.COM.002` — free trial / freemium signal
- `PA.COM.003` — beta / pilot / early-access signal
- `PA.COM.004` — paid production / enterprise plan signal
- `PA.COM.005` — commercial availability evidence basis
- `PA.COM.006` — commercial availability limitation

M8 must not derive this object from memory, market knowledge, external browsing, unapproved URLs, or pricing labels alone.

### M8.S14B — Source Access and Evidence Boundary

M8 may use only the source families already authorized for M8:

- `feature_candidate_inventory`
- `lossless_family__P1_PRODUCT`
- `lossless_family__P2_PLATFORM_FEATURE_SOLUTION`
- `lossless_family__P3_AI_CAPABILITY_TECHNICAL`
- `lossless_family__P4_USE_CASE_INDUSTRY`
- `lossless_family__P5_ENTERPRISE_PRICING`
- locked `target_profile` and `target_profile_forensics` as context only

P5 pricing material may support commercial availability posture, free trial/freemium posture, paid production posture, plan posture, or limitation posture. P5 must not create product/activity mechanics and must not create a normal `activities[]` row unless the deterministic inventory already requires that candidate to be treated and product/API/model/source evidence supports it.

The material profile must not include source URLs, source IDs, source pointers, copied excerpts, confidence fields, derivation ledgers, or forensic material inside `commercial_availability_posture`. `evidence_basis[]` must be a short business-readable source-basis summary only, such as `Pricing page referenced paid API/model plans` or `Product/signup material referenced waitlist/private access`.

### M8.S14C — Material Object Contract

When this addendum is active, `target_feature_profile` must contain exactly these three top-level material keys:

```text
activities
commercial_availability_posture
profile_level_limitations
```

`commercial_availability_posture` must be a profile-level object with exactly these six keys:

```json
{
  "posture": "",
  "free_trial_freemium_signal": "",
  "beta_pilot_early_access_signal": "",
  "paid_production_enterprise_plan_signal": "",
  "evidence_basis": [],
  "limitation": ""
}
```

### M8.S14D — Field Guidance

`posture` must state the best public-footprint posture in plain English, using only visible evidence. Permitted answer families are: production/commercially available, beta/pilot/early access, free trial/freemium/free tier, paid production/enterprise, hybrid/unclear mixed posture, not publicly visible, or field limited.

`free_trial_freemium_signal` must state whether the public material shows a free trial, freemium plan, free tier, free credits, free developer access, or no visible free/freemium signal.

`beta_pilot_early_access_signal` must state whether the public material shows beta, pilot, preview, waitlist, private access, early access, limited availability, or no visible beta/pilot signal.

`paid_production_enterprise_plan_signal` must state whether the public material shows paid production use, API pricing, paid plans, enterprise plan, request-demo enterprise access, sales-assisted commercial use, or no visible paid-production signal.

`evidence_basis[]` must be a short array of business-readable basis notes. It must not include source URLs, source IDs, source pointers, copied source text, or forensic ledger rows.

`limitation` must state any commercial-availability uncertainty, including private order-form dependency, pricing not reviewed, gated pricing, source not found, mixed product posture, or reviewer confirmation needed. If no material limitation exists, use `No material commercial availability limitation identified from reviewed public material.`

### M8.S14E — Final Backend JSON Shape Addendum

Return strict JSON only. When this addendum is active, the M8 material response shape is the same strict `target_feature_profile` shape in M8.S13.

The commercial availability object does not authorize new activity keys, new candidates, source discovery, legal analysis, privacy analysis, registry evaluation, or final QR/report output.

### M8.S14F — Final Gate Addendum

Before returning the M8 material response, verify:

1. Output has exactly one top-level key: `target_feature_profile`.
2. target_feature_profile has exactly `activities[]`, `commercial_availability_posture`, and `profile_level_limitations[]`.
3. Every activity still has exactly the locked 12 keys from M8.S9.
4. `commercial_availability_posture` has exactly the six keys in M8.S14C.
5. `commercial_availability_posture.evidence_basis` is an array and contains no source URLs, source IDs, source pointers, copied excerpts, or forensic rows.
6. No candidate IDs, source pointers, source URLs, excerpts, confidence fields, validation fields, or forensic branches appear in the material profile.
7. No forensic output is emitted.
8. CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml is not active authority for M8 material derivation.

If any condition fails, repair the material output only. Do not emit forensics.
