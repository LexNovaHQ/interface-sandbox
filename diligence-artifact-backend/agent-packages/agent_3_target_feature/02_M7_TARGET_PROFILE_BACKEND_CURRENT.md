# MODULE VII — TARGET PROFILE

## M7.S0 — Phase Call Card and Phase-Local Lock Gate

<phase_call_card>
phase_id: M7_TARGET_PROFILE
module_id: M7
module_name: TARGET_PROFILE
active_phase_only: true
active_agent: agent_3_target_feature
canonical_material_output: target_profile
canonical_forensic_output: target_profile_forensics

## Governing Imports

- 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
- AGENT3_RUNTIME_BINDING_PACKET.yaml
- 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
- 00_VALIDATOR_RULES_INTEGRATED.md
- FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
- FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml

## Execution Rule

Execute M7 only.

Build `target_profile` only from:

1. Agent 1/2-approved source custody and routing artifacts saved in the backend / Drive artifact vault;
2. live backend M6 `source_discovery_handoff.bucket_family_index`;
3. loaded target-family artifacts `lossless_family__T0_ROOT` through `lossless_family__T4_SUPPORTING_IDENTITY`;
4. locked M9 `legal_cartography_index` only where the M7 legal-family exception allows it;
5. the M7 Target Source Extraction Capsule created in Phase A; and
6. selected `TP.*` rows from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` mapped in the M7 material selector.

Do not execute every `TP.*` row merely because it exists. The full 43-row Target Profile registry remains authority, but only the selected 18 material rows may become `target_profile` fields.

Do not perform M8, M9, M10, M11, M12, M13, or M14 work. Do not emit `target_feature_profile`, data-provenance profile, exposure profile, challenge gate, final handoff, renderer payload, report prose, or legal advice.

## Mandatory Internal Phase Sequence

M7 has four executable internal gates. They are sequential and non-skippable.

```text
PHASE A  — SOURCE EXTRACTION FROM DRIVE / BACKEND ARTIFACT VAULT
PHASE B  — MATERIAL TARGET PROFILE DERIVATION
PHASE B1 — MATERIAL TARGET PROFILE VALIDATOR + SAVE GATE
PHASE C  — TARGET PROFILE FORENSICS DERIVATION
PHASE D  — TARGET PROFILE FORENSICS VALIDATOR + SAVE GATE
```

Phase A must complete before Phase B begins.
Phase B must derive all 5 parent branches and all 18 material fields before Phase B1 begins.
Phase B1 must validate schema and substance and mark `target_profile` as save-ready before Phase C begins.
Phase C must not begin until `target_profile` has been derived, validated, and saved as the M7 material artifact by the backend runner.
Phase D must validate and save `target_profile_forensics` before the backend runner may move to M8.

If the runtime is unable to save `target_profile` before asking the model to build `target_profile_forensics`, the runtime must split M7 into two backend calls: `M7_TARGET_PROFILE_MAIN` and `M7_TARGET_PROFILE_FORENSICS`. The prompt doctrine does not authorize same-step forensic derivation before the material artifact exists.

## Backend Terminal Contract

For backend/Gemini execution, return strict JSON only. Do not emit markdown, prose, XML-style phase wrappers, checkpoint prose, terminal receipts, audit-log prose, or same-chat control text.

M7 has two backend output artifacts, but they are not emitted together.

- Phase B1 emits and saves only `target_profile`.
- Phase D emits and saves only `target_profile_forensics`.

A combined response containing both `target_profile` and `target_profile_forensics` in the same backend call is invalid unless the backend is running a deliberately marked same-chat debug simulation. Production backend execution must use the split output contracts in M7.S10.

For same-chat debugging only, the operator may request visible checkpoints. That debug mode is not the production backend terminal contract.

## Phase-Local Gate

Before M7 can lock, verify all of the following:

- `target_profile` contains exactly five parent sections.
- `target_profile` contains exactly eighteen material fields across those parents.
- the five parents are exactly: `target_identity`, `jurisdiction_notice`, `business_context`, `product_service_wrapper`, and `target_profile_limitations`.
- `target_profile_forensics` is separate from `target_profile`.
- `target_profile` is derived, validated, and saved before `target_profile_forensics` is derived, validated, and saved.
- no profile metadata, evidence map, confidence object, source ledger, runtime trace, scratchpad, debug branch, extraction capsule, or forensic/provenance branch appears inside `target_profile`.
- every emitted material field is derived through the M7 material selector table in `M7.S3` and mapped to the governing `TP.*` row in `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`.
- every selected `TP.*` registry row has a Module V workpad outcome and/or a `target_profile_forensics.field_derivation_ledger` row.
- rows not selected for the eighteen-field material output are not executed as material fields.
- the M7 Target Source Extraction Capsule was created and locked before field application.
- every Agent 1/2-approved M7 target/legal route family URL relevant to M7 was extraction-reviewed, either with field-relevant lossless excerpts captured or with an explicit no-support/gated/broken/not-field-relevant reason.
- capsule route-family coverage equals 100% of the M7 route universe approved by Agent 1/2, excluding only routes formally marked broken, gated, duplicate-canonicalized, non-public, unavailable, or outside M7 scope with reason.
- any weak, missing, thin, vague, or conflicting field was sent through targeted field-specific reinvestigation before receiving a limitation/warning status.
- after reinvestigation, unresolved weakness becomes a controlled warning/limitation, not a silent block and not a guessed value.
- missing evidence is routed to targeted reinvestigation, controlled field status, M6/Agent 1 source repair only where the route universe itself is defective, or limitations. Never guess.
- no M8-M14 canonical objects are emitted.

## Repair / Reinvestigation Policy

Repair in M7 means targeted reinvestigation first, not immediate hard blocking.

If a material field is inadequate, unsupported, weak, thin, vague, conflicting, or wrong:

1. run targeted field-specific reinvestigation inside the existing Agent 1/2-approved source universe;
2. re-derive the field using the governing `TP.*` row conditions;
3. if the field can be supported, emit the supported value;
4. if the field remains unsupported after reinvestigation, emit a controlled field status (`FIELD_LIMITED`, `FIELD_NOT_PUBLIC`, `FIELD_CONFLICTED`, or `FIELD_NOT_FOUND`) and record the limitation/warning in `target_profile_limitations` and the forensic ledgers;
5. proceed only after the limitation is controlled and ledgered.

Only route back to Agent 1 / M6 source repair when the source universe itself is missing, corrupted, inaccessible, or contradictory in a way M7 cannot repair from loaded artifacts.

Allowed phase outcomes:

- `PASS`
- `PASS_WITH_WARNING`
- `PASS_WITH_LIMITATION`
- `CONTROLLED_FAILURE`
- `REINVESTIGATION_COMPLETED_WITH_LIMITATION`
- `SOURCE_REPAIR_REQUIRED` only for upstream source-universe defects

</phase_call_card>

`M7.S0.C1` This M7 module is the standalone Target Profile phase for Agent 3. It is not a combined M7/M8 prompt.

`M7.S0.C2` M7 does not authorize four-artifact merged output. The old merged M7/M8 shape is expressly rejected for this module.

`M7.S0.C3` M7 cannot hand off to M8 until `target_profile` and `target_profile_forensics` are both saved artifacts and the M7 lock gate has passed.

`M7.S0.C4` M7 profile derivation and M7 forensic derivation are sequential. The forensic profile is not allowed to be invented from memory, summary, or unsaved material-profile assumptions.

---

## M7.S1 — Function, Authority, and Hard Boundary

### M7.S1A — Function

`M7.S1A.C1` Module VII converts Agent 1/2-approved target/legal source families, narrow M9 legal-cartography context, and the Phase A Target Source Extraction Capsule into the canonical five-parent, eighteen-field `target_profile` object.

`M7.S1A.C2` Module VII performs target-level business identification only.

`M7.S1A.C3` Module VII answers: who the target is, where it is legally anchored where visible, what kind of business it appears to be, what public offering wrapper it exposes, and what public-footprint limitations affect downstream review.

`M7.S1A.C4` Module VII emits the material state object `target_profile` first.

`M7.S1A.C5` Module VII emits the provenance state object `target_profile_forensics` only after the material profile is complete, validated, and saved by the backend runner.

### M7.S1B — Source Authority Lock

`M7.S1B.C1` Agent 1 is source custody and extraction. Agent 2/M6 is source navigation, bucket/family routing, and handoff. M9 is legal cartography. M7 is target-profile derivation only.

`M7.S1B.C2` M6 is not substantive field authority. Use M6 only to know which backend-loaded source families are available, which source IDs belong to which families, and which source limitations are inherited. A bucket assignment, route label, family classification, or source existence signal cannot prove a Target Profile field without supporting `lossless_text` from the loaded family artifacts.

`M7.S1B.C3` Module VII must use the live backend source structure only:

- `source_discovery_handoff.bucket_family_index.target_profile_urls.families`
- `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families` only for the legal-family exception
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- `legal_cartography_index` only for identity, notice, governing-law, courts/venue, or legal-document limitation support

`M7.S1B.C4` Deprecated source branches are invalid as required inputs: deprecated pre-family-index source branches, evidence vault branches, phase packages, compatibility wrappers, and snippet-only source branches.

`M7.S1B.C5` Source IDs are immutable custody anchors. Never relabel, reorder, infer, guess, remap, or pair a source ID with a URL from another source.

`M7.S1B.C6` Every object that cites a `*.SRC.NNN` source reference must also include `source_url` when one source is cited or `source_urls` as an object keyed by source ID when multiple sources are cited. The URL must be copied from the exact upstream source object.

`M7.S1B.C7` If the exact upstream URL for a source ID cannot be located, do not use that source ID. Create a limitation row instead.

### M7.S1C — Forbidden Acts

`M7.S1C.C1` M7 must not discover new sources, search the web, browse, crawl, follow unapproved links, use memory/general knowledge, use search snippets as evidence, or use rejected/quarantined/deferred/duplicate-suppressed/non-routed source material.

`M7.S1C.C2` M7 must not decompose wrappers into features/functions, derive feature mechanics, assign archetypes, assign surface tokens, derive data ingress, derive AI processing paths, derive output/action paths, derive retention, derive transfers, derive subprocessors, derive legal basis, derive data provenance, or evaluate registry rows.

`M7.S1C.C3` M7 must not perform legal sufficiency, compliance, enforceability, liability, threat, exposure, challenge, final report, or renderer work.

`M7.S1C.C4` M7 must not emit `validation_status`, confidence, evidence basis, source ledger, runtime trace, profile metadata, forensic branches, compatibility metadata, or extraction capsule inside `target_profile`.

---

## M7.S2 — Input Protocol Synced to Agent 1 and Agent 2

### M7.S2A — Required Inputs

| Required Input | Required Use |
|---|---|
| `source_discovery_handoff` | source boundary, family routing, inherited limitations, and source custody index |
| `source_discovery_handoff.target_url` or target/ref equivalent | reviewed target/domain boundary |
| `source_discovery_handoff.bucket_family_index.target_profile_urls.families` | M7 target-family route universe |
| `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families` | legal-family route universe only for the narrow legal exception |
| `lossless_family__T0_ROOT` | root/homepage target source text and custody refs |
| `lossless_family__T1_IDENTITY` | identity/about/company target source text and custody refs |
| `lossless_family__T2_LEGAL_IDENTITY` | target-side legal identity or notice source text where present |
| `lossless_family__T3_OPERATOR_ENTITY` | operator/entity/supporting corporate source text where present |
| `lossless_family__T4_SUPPORTING_IDENTITY` | supporting identity source text where present |
| `legal_cartography_index` | narrow identity/notice/governing-law/courts-venue context only |
| `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` | governing `TP.*` field derivation authority |
| `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml` | governing forensic ledger authority |
| `M7.S3 target_profile_material_selector` | selected 18-field material execution map |

### M7.S2B — Source Text Location

`M7.S2B.C1` The live backend source text location is `lossless_family__{ROOT_FAMILY}.sources[].lossless_text` as indexed by `source_discovery_handoff.contract.source_text_location`.

`M7.S2B.C2` M7 must extract from saved Drive/backend artifacts only. Do not use raw web memory, model memory, or URL text that is not present in the loaded lossless family artifacts.

### M7.S2C — Route Family Access Matrix

| Route / Object | Access Status | Permitted M7 Use |
|---|---|---|
| `lossless_family__T0_ROOT` | primary target family | all eighteen Target Profile material fields where supported by extracted source material |
| `lossless_family__T1_IDENTITY` | primary target family | identity, business context, wrapper, reviewed website/domain, and limitations |
| `lossless_family__T2_LEGAL_IDENTITY` | primary/narrow legal identity family | legal entity name, entity type, registered/notice location, governing law, courts/venue, and legal notice identity where the source text supports it |
| `lossless_family__T3_OPERATOR_ENTITY` | supporting target family | operator/entity/supporting corporate identity where source text supports an active M7 field |
| `lossless_family__T4_SUPPORTING_IDENTITY` | supporting target family | supporting identity, business context, wrapper, and limitations where source text supports an active M7 field |
| `source_discovery_handoff.bucket_family_index.target_profile_urls.families` | custody/control | family-level route availability, family state, and source-to-family routing; route existence alone is not field evidence |
| `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families` | narrow exception context | only where M7.S2D permits and primarily through `legal_cartography_index`; not legal analysis |
| `legal_cartography_index` | narrow supporting context | document index and legal/governance section signals only for fields authorized in M7.S2D; not compliance, enforceability, legal-risk, or registry analysis |
| product/activity/data/registry families | not primary M7 evidence | may support wrapper/business context only if already Agent 1/2-approved and independently supported by lossless text; never feature mechanics, data provenance, archetype/surface, registry, or risk evaluation |

### M7.S2D — Legal-Family Exception Stop Rule

`M7.S2D.C1` M7 may use Terms, Terms of Service, Terms and Conditions, User Agreement, EULA, Privacy Policy, legal notice, imprint, Trust Center, Security Page, or equivalent governance material only where the specific source contains public text relevant to identity, notice, governing law, courts/venue, or legal-document limitation.

`M7.S2D.C2` Permitted legal-family values are limited to: legal entity identity, entity type, registered/notice location, governing law, courts/venue, legal notice identity, and limitations caused by missing/gated/unclear legal material.

`M7.S2D.C3` M7 must stop using the legal-family exception as soon as the relevant value, controlled field status, or limitation is assigned.

`M7.S2D.C4` DPA, AUP, SLA, security, trust, subprocessor, or policy documents must not be used to infer product features, data provenance, compliance posture, exposure, or risk in M7.

---

## M7.S3 — Field Derivation Registry Inventory and 18-Field Material Selector

`M7.S3.C1` Material field authority for `target_profile` comes only from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`, filtered through the selected M7 rows below.

`M7.S3.C2` M7 does not define local field derivation rows. Local field names are output slots only; governing logic comes from the corresponding `TP.*` rows.

`M7.S3.C3` Every material field derivation must apply the governing registry row's `Mode`, `Source_Basis`, `Conditions`, `Trigger_Outcome`, `Exclude_Fallback`, `Forbidden_Inference`, and `Lock_Status`.

`M7.S3.C4` Every populated field and every controlled status must create a matching `field_derivation_ledger` row in `target_profile_forensics` using the applicable `TP.*` `Field_ID`.

`M7.S3.C5` Non-selected TP rows remain registry authority but are audit-retired for M7 material output. They may support limitations or forensics only where relevant.

### M7.S3A — Exact 18-Field Selector

| Parent | Output Field | Registry Field_ID(s) | Required Derivation Action |
|---|---|---|---|
| `target_identity` | `brand_name` | `TP.ID.001` | Extract public-facing brand/company/product name from Agent 1/2-approved target source text. Do not infer from domain slug alone. |
| `target_identity` | `legal_entity_name` | `TP.ID.002` | Extract legal entity / contracting party / operator from target, terms, privacy, legal notice, imprint, footer, or corporate notice where source text ties it to the target. |
| `target_identity` | `entity_type` | `TP.ID.005` | Extract legal form only where expressly visible: Inc., LLC, Pvt Ltd, Ltd, GmbH, etc. Do not infer. |
| `target_identity` | `reviewed_website` | `TP.ID.003` | Use submitted/resolved target-controlled reviewed URL from source boundary. |
| `target_identity` | `primary_domain` | `TP.ID.004` | Derive from reviewed target-controlled URL or M6 target boundary. Do not use domain to infer entity/jurisdiction/business model. |
| `jurisdiction_notice` | `registered_notice_location` | `TP.JUR.001`, `TP.JUR.002` | Prefer full registered office / legal notice / notice address if visible. If full address is unavailable, use visible country/state/region only with limitation. |
| `jurisdiction_notice` | `governing_law` | `TP.JUR.003` | Extract governing law only where expressly visible in M6/M9-approved legal/governance material. Do not infer. |
| `jurisdiction_notice` | `courts_venue` | `TP.JUR.004`, `TP.JUR.005` | Extract courts, venue, arbitration forum, or dispute forum only where expressly visible. Do not infer. |
| `business_context` | `business_category` | `TP.BIZ.001` | Classify visible business category at high level only: AI vendor, SaaS, API platform, model provider, developer platform, marketplace/intermediary, service/advisory layer, hybrid, etc. |
| `business_context` | `primary_customer_type` | `TP.BIZ.002` | Extract visible customer/user segment: B2B, B2C, developers, enterprises, government/public sector, creators, agencies, etc. Do not infer from design/vibe. |
| `business_context` | `market_type_candidate` | `TP.BIZ.003` | Identify self-serve, enterprise, API-first, platform, managed/service-assisted, open-access, gated/request-demo, or hybrid only from public signals. |
| `business_context` | `industry_sector` | `TP.BIZ.004` | Extract industry/sector positioning from visible public text. Do not infer from TLD, language, founder location, or model knowledge. |
| `business_context` | `regulated_sector_hints` | `TP.BIZ.005` | Emit factual regulated-sector hints only where visible. Empty array is allowed only after extraction/reinvestigation confirms no visible signal. |
| `product_service_wrapper` | `high_level_offering` | `TP.WRAP.001` | Summarize the public offering wrapper at target level without feature mechanics. |
| `product_service_wrapper` | `primary_public_claim` | `TP.WRAP.002` | Extract the target's main public positioning claim where visible. Do not convert marketing claim into verified fact. |
| `product_service_wrapper` | `product_service_wrapper_names` | `TP.WRAP.003`, `TP.WRAP.004` | List named products/platforms/APIs/models/services at wrapper level only. Do not decompose into features. |
| `product_service_wrapper` | `delivery_model_signals` | `TP.WRAP.005`, `TP.WRAP.006`, `TP.WRAP.007`, `TP.WRAP.008` | Extract delivery model signals: app/platform, API/programmatic, offline/service/advisory, partner/intermediary, dashboard, docs, or deployment surface where visible. |
| `target_profile_limitations` | `target_profile_limitations` | `TP.ID.009`, `TP.JUR.008`, `TP.BIZ.008`, `TP.WRAP.010`, `TP.LIM.001`–`TP.LIM.008` | Emit only material limitations affecting target profile or downstream review. Never omit limitations caused by missing legal name, jurisdiction, gated source, thin footprint, unclear wrapper, or M6 route limitation. |

### M7.S3B — Controlled Field Status Vocabulary

Allowed field status values:

- `FIELD_CONFIRMED`
- `FIELD_LIMITED`
- `FIELD_NOT_PUBLIC`
- `FIELD_CONFLICTED`
- `FIELD_NOT_FOUND`

No uncontrolled `UNKNOWN`, `N/A`, blank string, guessed value, placeholder path, dotted placeholder, or invented confidence value is allowed inside the material profile.

---

## M7.S4 — PHASE A: Source Extraction From Drive / Backend Artifact Vault

### M7.S4A — Purpose

`M7.S4A.C1` Phase A creates and locks the M7 Target Source Extraction Capsule before any material field derivation begins.

`M7.S4A.C2` The capsule is internal working material until Phase C. It must not be emitted inside `target_profile`.

`M7.S4A.C3` Phase A extracts field-relevant evidence from saved Agent 1/2 artifacts only.

### M7.S4B — 100% Route-Family Coverage

For every source object in the M7 route universe, record one of:

- `FIELD_RELEVANT_EXTRACTED`
- `NO_M7_FIELD_SUPPORT`
- `GATED_OR_NON_PUBLIC`
- `BROKEN_OR_UNAVAILABLE`
- `DUPLICATE_CANONICALIZED`
- `OUTSIDE_M7_SCOPE`

Every reviewed source row must include:

- `root_family`
- `source_id`
- `source_url`
- `extraction_status`
- `field_relevance`
- `supported_output_fields[]`
- `lossless_excerpt_or_summary`
- `limitation_if_any`

### M7.S4C — Parent-Specific Extraction Duties

Phase A must extract source support separately for the five material parents:

1. `target_identity`
2. `jurisdiction_notice`
3. `business_context`
4. `product_service_wrapper`
5. `target_profile_limitations`

Do not proceed to Phase B until Phase A has reviewed 100% of the M7 route universe and created the Target Source Extraction Capsule.

### M7.S4D — Phase A Validator

Phase A passes only if:

- all loaded T0–T4 source families were reviewed;
- relevant legal/governance families were reviewed only for the legal-family exception;
- every cited source ID has its exact URL;
- no deprecated source branch is used as authority;
- no route label is treated as field evidence;
- field-relevant extraction exists or a controlled no-support reason exists for every M7 route-family source.

If Phase A finds a missing/corrupt source universe, route to `SOURCE_REPAIR_REQUIRED`. If Phase A finds merely thin field support, continue to Phase B and use field-level reinvestigation.

---

## M7.S5 — PHASE B: Material Target Profile Derivation

Phase B derives all five parent branches and all eighteen material fields. Each parent branch has its own execution section. Each field must be derived from the Phase A capsule using the selected `TP.*` registry row.

### M7.S5A — Parent 1: `target_identity`

#### `brand_name` — `TP.ID.001`

Apply `TP.ID.001` from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`.

- Source basis: target-controlled public source text or submitted/resolved target identity.
- Derive if brand/name appears in source text, is tied to the reviewed website/product, and is not a third-party/customer/vendor/news mention.
- If weak, domain-only, or single-signal: run targeted reinvestigation across T0/T1/T4 before limitation.
- If still weak after reinvestigation: emit `FIELD_LIMITED` and ledger limitation.

#### `legal_entity_name` — `TP.ID.002`

Apply `TP.ID.002`.

- Source basis: legal/governance public sources and target-side legal identity sources.
- Derive only where entity appears in terms/privacy/legal notice/imprint/footer/contact/corporate notice and is tied to target as operator/controller/provider/contracting party.
- Do not infer legal entity from brand, domain, copyright footer, LinkedIn, app-store publisher, or news mention alone.
- If no legal entity is visible after targeted reinvestigation: emit `FIELD_NOT_FOUND` or `FIELD_NOT_PUBLIC` and create identity limitation.

#### `entity_type` — `TP.ID.005`

Apply `TP.ID.005`.

- Extract legal form only when express: Inc., LLC, Pvt Ltd, Ltd, GmbH, LLP, etc.
- Do not infer from jurisdiction, suffixless entity name, startup status, country, or market knowledge.
- If unavailable after targeted reinvestigation: emit controlled field status and ledger limitation.

#### `reviewed_website` — `TP.ID.003`

Apply `TP.ID.003`.

- Use the submitted/resolved target-controlled reviewed URL from source boundary.
- Verify the URL resolves to the reviewed target and is not a third-party profile/listing/article.
- If target-control is uncertain: emit limitation or controlled failure depending on severity.

#### `primary_domain` — `TP.ID.004`

Apply `TP.ID.004`.

- Derive from the reviewed website URL or M6 target boundary.
- Do not use domain to infer legal entity, jurisdiction, sector, or business model.
- If M6 target boundary is uncertain: inherit M6 limitation and ledger it.

### M7.S5B — Parent 2: `jurisdiction_notice`

#### `registered_notice_location` — `TP.JUR.001`, `TP.JUR.002`

Apply `TP.JUR.001` and `TP.JUR.002`.

- Prefer full registered office, legal notice address, notice address, or official contact address if visible.
- If full address is unavailable but country/state/region is visible from legal/governance material, emit limited location with limitation.
- Do not infer jurisdiction from TLD, language, currency, investor location, founder nationality, or domain hosting.
- If neither address nor location is visible after targeted reinvestigation: emit `FIELD_NOT_FOUND` or `FIELD_NOT_PUBLIC`.

#### `governing_law` — `TP.JUR.003`

Apply `TP.JUR.003`.

- Extract governing law only where expressly visible in approved legal/governance material.
- Do not infer from entity location or terms style.
- If unavailable after targeted reinvestigation: emit controlled status and jurisdiction limitation.

#### `courts_venue` — `TP.JUR.004`, `TP.JUR.005`

Apply `TP.JUR.004` and `TP.JUR.005`.

- Extract courts, venue, arbitration forum, or dispute forum only where expressly visible.
- If dispute mechanism is partial, emit the visible element and limitation.
- If unavailable after targeted reinvestigation: emit controlled status and jurisdiction limitation.

### M7.S5C — Parent 3: `business_context`

#### `business_category` — `TP.BIZ.001`

Apply `TP.BIZ.001`.

- Classify the visible high-level business category from target-controlled public text.
- Use broad factual categories only: AI vendor, SaaS, API platform, model provider, developer platform, marketplace/intermediary, service/advisory layer, hybrid, etc.
- If unclear after targeted reinvestigation: emit `FIELD_LIMITED` and business-context limitation.

#### `primary_customer_type` — `TP.BIZ.002`

Apply `TP.BIZ.002`.

- Extract visible customer/user segment from source text: B2B, B2C, developers, enterprises, public sector, creators, agencies, etc.
- Do not infer from page design, pricing tier, social proof, or vibe.
- If not visible after targeted reinvestigation: emit controlled status.

#### `market_type_candidate` — `TP.BIZ.003`

Apply `TP.BIZ.003`.

- Derive only from visible public signals: self-serve, enterprise, API-first, platform, managed/service-assisted, open-access, gated/request-demo, or hybrid.
- If signals conflict, emit the conflict and limitation.
- If unclear after targeted reinvestigation: emit controlled status.

#### `industry_sector` — `TP.BIZ.004`

Apply `TP.BIZ.004`.

- Extract industry/sector positioning from visible source text.
- Do not infer from TLD, language, founder location, funding news, or model knowledge.
- If not visible after targeted reinvestigation: emit controlled status.

#### `regulated_sector_hints` — `TP.BIZ.005`

Apply `TP.BIZ.005`.

- Emit factual regulated-sector hints only where visible from source text: healthcare, finance, education, employment, minors, biometrics, government, legal/professional, etc.
- Empty array is allowed only after targeted reinvestigation confirms no visible regulated-sector signal.
- Do not infer regulated sector from possible downstream use cases or industry stereotypes.

### M7.S5D — Parent 4: `product_service_wrapper`

#### `high_level_offering` — `TP.WRAP.001`

Apply `TP.WRAP.001`.

- Summarize the public offering wrapper at target level.
- Do not decompose into features, workflows, mechanics, models, actions, data flows, or registry archetypes.
- If unclear after targeted reinvestigation: emit controlled status and wrapper limitation.

#### `primary_public_claim` — `TP.WRAP.002`

Apply `TP.WRAP.002`.

- Extract the target's main public positioning claim where visible.
- Preserve it as a claim, not as verified fact.
- If not visible after targeted reinvestigation: emit controlled status.

#### `product_service_wrapper_names` — `TP.WRAP.003`, `TP.WRAP.004`

Apply `TP.WRAP.003` and `TP.WRAP.004`.

- List named products, platforms, APIs, models, services, or public offering labels at wrapper level only.
- Do not decompose into M8 activities/features.
- If list is thin/gated/conflicting after targeted reinvestigation: emit limitation.

#### `delivery_model_signals` — `TP.WRAP.005`, `TP.WRAP.006`, `TP.WRAP.007`, `TP.WRAP.008`

Apply `TP.WRAP.005` through `TP.WRAP.008`.

- Extract visible delivery-model signals: web app/platform, API/programmatic access, dashboard, docs, demo/request access, offline/service/advisory, partner/marketplace/intermediary, deployment surface.
- Do not infer technical mechanics or data flows.
- If unclear after targeted reinvestigation: emit controlled status and wrapper limitation.

### M7.S5E — Parent 5: `target_profile_limitations`

#### `target_profile_limitations` — selected `TP.LIM.*` and supporting limitation rows

Apply `TP.ID.009`, `TP.JUR.008`, `TP.BIZ.008`, `TP.WRAP.010`, and `TP.LIM.001`–`TP.LIM.008`.

- Emit only material limitations affecting target profile or downstream review.
- Limitation rows must identify affected field/parent, missing proof or conflict, reinvestigation performed, final controlled status, and downstream effect.
- Empty array is allowed only if no material limitation exists after extraction and targeted reinvestigation.
- Never omit limitations caused by missing legal entity, missing jurisdiction, gated source, thin public footprint, unclear wrapper, conflict between sources, or M6 inherited route limitation.

---

## M7.S6 — PHASE B1: Material Target Profile Validator + Save Gate

Phase B1 validates the completed `target_profile` before forensics may begin.

### M7.S6A — Schema Validator

`target_profile` must contain exactly this object shape:

```json
{
  "target_identity": {
    "brand_name": "",
    "legal_entity_name": "",
    "entity_type": "",
    "reviewed_website": "",
    "primary_domain": ""
  },
  "jurisdiction_notice": {
    "registered_notice_location": "",
    "governing_law": "",
    "courts_venue": ""
  },
  "business_context": {
    "business_category": "",
    "primary_customer_type": "",
    "market_type_candidate": "",
    "industry_sector": "",
    "regulated_sector_hints": []
  },
  "product_service_wrapper": {
    "high_level_offering": "",
    "primary_public_claim": "",
    "product_service_wrapper_names": [],
    "delivery_model_signals": []
  },
  "target_profile_limitations": []
}
```

No sixth parent. No metadata. No validation status inside the material profile. No source ledger. No confidence. No evidence basis. No forensics. No extraction capsule. No hidden fields.

#### M7.S6A.1 — Field Alias Rejection and Type Enforcement

Field aliases are prohibited even when the alias appears semantically equivalent. The model must emit the exact field names in the M7.S6A schema and no substitutes.

Forbidden material-profile aliases include, without limitation:

| Forbidden Alias / Drift Field | Required Handling |
|---|---|
| `website` | reject; use `reviewed_website` |
| `domain` | reject; use `primary_domain` |
| `parent_affiliate_relationship` | reject; not an M7 material field |
| `identity_confidence` | reject; confidence belongs nowhere inside `target_profile` |
| `identity_evidence_basis` | reject; evidence belongs in `target_profile_forensics.field_derivation_ledger` |
| `identity_limitation` | reject; use `target_profile_limitations[]` and forensic `limitation_ledger[]` |
| `registered_notice_country` | reject; use `registered_notice_location` |
| `registered_notice_state` | reject; use `registered_notice_location` |
| `jurisdiction_evidence_basis` | reject; evidence belongs in forensics |
| `jurisdiction_confidence` | reject |
| `governing_law_country` | reject; use `governing_law` |
| `governing_law_state` | reject; use `governing_law` |
| `industry` | reject; use `industry_sector` |
| `business_context_confidence` | reject |
| `business_context_evidence_basis` | reject |
| `product_service_wrapper_name` | reject; use `product_service_wrapper_names[]` |
| `product_service_wrapper_description` | reject; not an M7 material field |
| `wrapper_evidence_basis` | reject |
| `app_platform_delivery_signal` | reject; use `delivery_model_signals[]` |
| `api_programmatic_delivery_signal` | reject; use `delivery_model_signals[]` |
| `offline_service_advisory_delivery_signal` | reject; use `delivery_model_signals[]` |

Required material field types:

| Field | Required Type |
|---|---|
| `target_identity.brand_name` | string or controlled field status string |
| `target_identity.legal_entity_name` | string or controlled field status string |
| `target_identity.entity_type` | string or controlled field status string |
| `target_identity.reviewed_website` | string |
| `target_identity.primary_domain` | string |
| `jurisdiction_notice.registered_notice_location` | string or controlled field status string |
| `jurisdiction_notice.governing_law` | string or controlled field status string |
| `jurisdiction_notice.courts_venue` | string or controlled field status string |
| `business_context.business_category` | string or controlled field status string |
| `business_context.primary_customer_type` | string or controlled field status string |
| `business_context.market_type_candidate` | string or controlled field status string |
| `business_context.industry_sector` | string or controlled field status string |
| `business_context.regulated_sector_hints` | array |
| `product_service_wrapper.high_level_offering` | string or controlled field status string |
| `product_service_wrapper.primary_public_claim` | string or controlled field status string |
| `product_service_wrapper.product_service_wrapper_names` | array |
| `product_service_wrapper.delivery_model_signals` | array |
| `target_profile_limitations` | array |

Object values are forbidden unless the schema expressly requires an object. Split-field variants, boolean signal maps, confidence maps, evidence maps, and narrative provenance fields are forbidden inside `target_profile`.

If a value cannot be derived as the required type after targeted reinvestigation, the field must use a controlled field status and the reason must be carried in `target_profile_limitations[]` and `target_profile_forensics.limitation_ledger[]`.

### M7.S6B — Substance Validator

For each of the 18 material fields, Phase B1 must verify:

- the field maps to the correct `TP.*` registry row(s);
- the field value or controlled status follows the row's `Mode`, `Source_Basis`, `Conditions`, `Trigger_Outcome`, `Exclude_Fallback`, and `Forbidden_Inference`;
- source support came from Agent 1/2-approved loaded artifacts;
- route labels were not used as substantive proof;
- targeted reinvestigation was performed for weak/missing/thin/conflicting fields;
- unresolved weakness is represented as a warning/limitation, not a guessed value;
- every limitation has an affected field/parent and downstream effect.

#### M7.S6B.1 — Contradiction Validator

Phase B1 must reject and repair contradictions between material fields, controlled statuses, and limitations.

Contradiction checks include:

- If `target_identity.legal_entity_name` contains a derived entity name, `target_profile_limitations[]` must not state that the legal entity is wholly not visible unless the limitation is specifically scoped to uncertainty, partial source support, or conflicting source authority.
- If `jurisdiction_notice.registered_notice_location` contains a derived location, limitations must not state that jurisdiction/notice location is wholly absent unless the limitation is scoped to governing law, venue, registered address precision, or source confidence after reinvestigation.
- If `jurisdiction_notice.governing_law` or `jurisdiction_notice.courts_venue` is controlled-status, the limitation must identify exactly which legal/governance sources were reviewed and why the value remains unavailable.
- If any field contains `FIELD_NOT_FOUND`, `FIELD_NOT_PUBLIC`, `FIELD_LIMITED`, or `FIELD_CONFLICTING`, `target_profile_forensics.targeted_re_extraction_ledger[]` must later contain a matching reinvestigation row for that field.
- If `target_profile_limitations[]` is empty or says no material limitation, no material field may contain `FIELD_NOT_FOUND`, `FIELD_NOT_PUBLIC`, `FIELD_LIMITED`, or `FIELD_CONFLICTING`.
- A value and a limitation may coexist only when the limitation narrows confidence, source scope, jurisdictional precision, or downstream use; they may not contradict the existence of the value itself.

### M7.S6C — Phase B1 Repair/Reinvestigation Behavior

If Phase B1 finds an inadequate or wrong field:

1. do not proceed to Phase C;
2. reinvestigate that specific field inside the loaded source universe;
3. re-apply the governing `TP.*` row;
4. if support is found, correct the field;
5. if support remains insufficient, mark the field with a controlled status and create a limitation/warning;
6. re-run Phase B1.

Do not hard-block the entire M7 phase for ordinary missing public evidence after reinvestigation. Save the material profile with controlled limitation.

### M7.S6D — Save Gate and Phase B1 Material Output Contract

Phase B1 passes only when `target_profile` is schema-valid, substance-valid or controlled-with-limitations, and save-ready.

At the Phase B1 backend output boundary, M7 must emit exactly one top-level artifact:

```json
{
  "target_profile": {}
}
```

Phase B1 must not emit `target_profile_forensics`, `target_feature_profile`, downstream artifacts, phase wrappers, terminal receipts, or report prose.

The backend runner must validate and save `target_profile` as the M7 material artifact before Phase C begins.

Phase C is forbidden until the saved `target_profile` artifact exists in the backend / Drive artifact vault.

---

## M7.S7 — PHASE C: Target Profile Forensics Derivation

Phase C derives `target_profile_forensics` only after `target_profile` has been saved as an artifact.

### M7.S7A — Governing Forensic Authority

Forensics must derive from:

- saved `target_profile` artifact;
- Phase A Target Source Extraction Capsule;
- Phase B field-derivation outcomes;
- targeted reinvestigation outcomes;
- cross-route use decisions;
- inherited M6/M9 limitations;
- `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml` for `TP.*` field derivation proof; and
- `FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml` for forensic branch structure.

### M7.S7B — Required Forensic Branches and Registry Mapping

`target_profile_forensics` must include exactly these branches:

| Forensic Branch | Governing Forensic Registry Field_ID | Required Coverage |
|---|---|---|
| `source_ledger_used_for_m7` | `FOR.SRC.001` | every admitted/excluded/access-limited source used or reviewed for M7; source ID, URL, family, status, supported fields, limitation |
| `target_source_extraction_capsule_summary` | `FOR.EV.001`, `FOR.SRC.001` | Phase A extraction capsule summary by source family and supported parent/field |
| `target_source_route_coverage_ledger` | `FOR.SRC.001`, `FOR.QC.001` | 100% route-family coverage result and no-support/gated/broken/out-of-scope reasons |
| `field_derivation_ledger` | `FOR.FD.001` + selected `TP.*` rows | one row per selected M7 material field, including output field, `TP.*` Field_ID, source basis, outcome, evidence, fallback, limitation |
| `targeted_re_extraction_ledger` | `FOR.EV.001`, `FOR.FD.001`, `FOR.LIM.001` | every field-level reinvestigation, reason, reviewed sources, result, and final controlled status |
| `limitation_ledger` | `FOR.LIM.001` | every material limitation/warning, affected field, missing proof/conflict, why it matters, downstream effect |
| `cross_route_use_ledger` | `FOR.XREF.001`, `FOR.FD.001` | any legal/product/supporting cross-route evidence used for an M7 field and why it was allowed |
| `validation_quality_control_result` | `FOR.QC.001` | schema checks, field count, parent count, source-ref resolution, forbidden-field checks, warnings, blockers |
| `runtime_trace_m7_only` | `FOR.RUN.001` | M7-only runtime status, artifact refs, phase completion, sanitized run metadata only |
| `forensic_boundary` | `FOR.BOUND.001` | audit-only boundary, no chain-of-thought, no secrets, no hidden prompts, no legal conclusions |

#### M7.S7B.1 — Forensic Branch Alias Rejection

Forensic branch aliases are prohibited. The model must emit the exact branch names listed in M7.S7B.

Forbidden forensic aliases include, without limitation:

- `source_custody`
- `target_route_family_coverage`
- `field_derivation_decisions`
- `validation_qc_status`
- `runtime_trace_boundaries`
- `extraction_capsule_summary`
- `route_coverage`
- `evidence_summary_only`
- `generic_derivation_summary`
- `profile_forensics`
- `target_forensics`
- `qc_status`

If the model creates any forbidden forensic alias, Phase D must repair by remapping the content into the exact M7.S7B branch names or discarding unsupported narrative content. Aliases may not coexist with canonical branches.

### M7.S7C — Field Derivation Ledger Row Requirements

Every selected material field must have one `field_derivation_ledger` row with at least:

- `output_parent`
- `output_field`
- `fd_registry_id`: `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`
- `fd_field_id`
- `fd_profile_section`
- `fd_field_family`
- `fd_mode`
- `fd_source_basis`
- `conditions_evaluated[]`
- `trigger_outcome_applied`
- `exclude_fallback_applied`
- `forbidden_inference_check`: `PASS` or `FAIL_REPAIRED`
- `derivation_status`: `DERIVED`, `DERIVED_WITH_LIMITATION`, `FALLBACK_CONTROLLED`, `CONFLICTING_CONTROLLED`, or `NOT_PUBLIC_CONTROLLED`
- `source_artifact`
- `source_ref` or `source_refs[]`
- `source_url` or `source_urls{}`
- `evidence_summary`
- `targeted_reinvestigation_status`
- `limitation_if_any`

#### M7.S7C.1 — Forensic Row-Count and Coverage Gates

Forensic ledgers must be row-complete, not summary-only.

Minimum row-count and coverage gates:

- `field_derivation_ledger[]` must contain exactly 18 rows, one row for each selected M7 material field in M7.S3A. Missing rows are repair defects.
- `target_source_route_coverage_ledger[]` must contain one row per reviewed M7 source-family source, plus one explicit family-level no-source row for each empty, absent, gated, broken, duplicate-canonicalized, non-public, or out-of-scope M7 family.
- `source_ledger_used_for_m7[]` must contain every source used or reviewed for M7, including sources reviewed and excluded as not-field-relevant.
- `targeted_re_extraction_ledger[]` must contain one row for every material field that was weak, missing, thin, vague, conflicting, controlled-status, or limitation-bearing before final lock.
- `limitation_ledger[]` must contain one row for every `target_profile_limitations[]` item and every controlled-status material field that materially affects downstream review.
- `cross_route_use_ledger[]` must contain one row for every legal/product/supporting cross-route source used outside the primary target-family sources.
- `validation_quality_control_result{}` must report parent count, material field count, forensic row counts, forbidden-alias checks, source-ref URL resolution checks, contradiction checks, and unresolved warnings.

A forensic branch that merely summarizes findings without row-level evidence is inadequate and must be repaired.


### M7.S7D — Forensic Boundary

Forensics must be audit/proof only. Do not include hidden chain-of-thought, private scratchpad, secrets, API keys, prompt internals, developer-only data, unsupported legal conclusions, registry evaluation, or report prose.

---

## M7.S8 — PHASE D: Target Profile Forensics Validator + Save Gate

### M7.S8A — Schema Validator

`target_profile_forensics` must include all required branches listed in M7.S7B. Missing forensic branches are repairable defects.

Phase D must also verify that no forbidden forensic alias from M7.S7B.1 appears anywhere in `target_profile_forensics`.

Canonical forensic branch names are exclusive. A semantically similar branch name is not acceptable.

### M7.S8B — Substance Validator

Phase D validates that:

- `field_derivation_ledger[]` contains exactly 18 rows and every selected M7 material field has exactly one matching field-derivation row;
- every material field in saved `target_profile` has exactly one or more matching `field_derivation_ledger` row(s);
- every forensic row that cites a source ID includes the correct source URL from the exact upstream source object;
- all 18 selected fields have FD Registry linkage;
- all targeted reinvestigations are recorded;
- all unresolved field weaknesses are represented as warnings/limitations;
- all limitations identify affected field/parent and downstream effect;
- no retired TP row appears as a material field;
- no M8/M10/M11 object appears;
- no source-ID relabeling or source-ID/URL mismatch exists;
- no profile metadata leaked into `target_profile`;
- no legal/risk/registry conclusion appears in M7;
- no forbidden material-profile alias from M7.S6A.1 appears in `target_profile`;
- no forbidden forensic alias from M7.S7B.1 appears in `target_profile_forensics`;
- required material field types match M7.S6A.1;
- contradiction checks in M7.S6B.1 pass or are repaired/controlled;
- forensic row-count gates in M7.S7C.1 pass or are repaired/controlled.

### M7.S8C — Phase D Repair/Reinvestigation Behavior

If Phase D finds an inadequate forensic row:

1. repair the specific forensic row;
2. if the defect relates to an underlying field derivation, return to targeted reinvestigation for that field;
3. update the material field only if the reinvestigation changes the supported value/status;
4. rerun Phase B1 if material profile changes;
5. rerun Phase D after forensic repair.

After reinvestigation, if the issue remains unresolved because public evidence is insufficient, mark the issue as a warning/limitation and save the forensic output.

### M7.S8D — Save Gate, Phase D Forensic Output Contract, and Handoff

Phase D passes only when `target_profile_forensics` is schema-valid, source-linked, registry-linked, and either fully supported or controlled with warnings/limitations.

At the Phase D backend output boundary, M7 must emit exactly one top-level artifact:

```json
{
  "target_profile_forensics": {}
}
```

Phase D must not re-emit `target_profile`, `target_feature_profile`, downstream artifacts, phase wrappers, terminal receipts, or report prose.

The backend runner must validate and save `target_profile_forensics` before M8 begins.

M8 may begin only after both saved artifacts exist:

- `target_profile`
- `target_profile_forensics`

---

## M7.S9 — Hard Rejection Rules

Reject internally and repair before final M7 lock if any of these occur:

- Phase B1 backend output contains anything other than exactly one top-level `target_profile` artifact;
- Phase D backend output contains anything other than exactly one top-level `target_profile_forensics` artifact;
- `target_profile` and `target_profile_forensics` are emitted together in one production backend response;
- either M7 artifact is emitted before its own phase validator/save gate has passed;
- any upstream artifact copied into output;
- any downstream artifact copied into output;
- any XML-style wrapper, markdown, terminal receipt, checkpoint prose, or same-chat control text in backend execution;
- stale agent identity such as `agent_2_target_feature` or combined target-feature phase identity;
- placeholder dotted field paths;
- `target_profile` contains metadata, validation status, confidence, evidence basis, source ledger, extraction capsule, runtime trace, or forensic/provenance branch;
- `target_profile` contains forbidden aliases listed in M7.S6A.1, including `website`, `domain`, `industry`, confidence fields, evidence-basis fields, split jurisdiction fields, or split delivery-signal fields;
- `target_profile` has more or fewer than five parents;
- `target_profile` has more or fewer than eighteen material fields;
- any material field has the wrong required type under M7.S6A.1;
- a material field lacks selected `TP.*` registry mapping;
- a material field uses unapproved source material or route labels as field proof;
- a material field remains weak/missing/conflicting without targeted reinvestigation or controlled limitation;
- `target_profile_forensics` lacks provenance/evidence/derivation signal;
- `target_profile_forensics` contains forbidden forensic aliases listed in M7.S7B.1;
- `field_derivation_ledger[]` has more or fewer than 18 rows;
- a controlled-status or limitation-bearing material field lacks a matching targeted reinvestigation row and limitation row;
- a profile value and limitation contradict each other under M7.S6B.1;
- any `*.SRC.NNN` source reference lacks matching `source_url` or `source_urls` in the same object;
- any source ID is paired with a URL that does not belong to that source ID in the loaded upstream artifacts;
- source-ID relabeling, reordering, remapping, or source guessing;
- unsupported factual inference;
- legal advice, compliance conclusion, exposure registry evaluation, archetype/surface assignment, or M8/M10/M11 work.

---

## M7.S10 — Split Output Contracts

M7 has two output artifacts, but they are saved in separate backend phases. M7 must not return a combined two-artifact object in production backend execution.

### M7.S10A — PHASE B1 Material Output Contract

After Phase B material derivation and Phase B1 validation pass, return exactly this top-level JSON shape:

```json
{
  "target_profile": {}
}
```

The `target_profile` object must contain exactly the five-parent/eighteen-field schema shown in M7.S6A.

Do not emit `target_profile_forensics`, `target_feature_profile`, `legal_cartography_index`, `target_data_provenance_profile`, `target_exposure_profile`, `operator_challenge_gate`, `final_output_handoff`, renderer payload, report prose, or any compatibility wrapper in the Phase B1 material output.

The backend runner must save this artifact before Phase C begins.

### M7.S10B — PHASE D Forensic Output Contract

After the saved `target_profile` artifact exists, Phase C forensic derivation and Phase D validation may run. After Phase D passes, return exactly this top-level JSON shape:

```json
{
  "target_profile_forensics": {}
}
```

The `target_profile_forensics` object must contain exactly the required forensic branches shown in M7.S7B.

Do not re-emit `target_profile`, `target_feature_profile`, `legal_cartography_index`, `target_data_provenance_profile`, `target_exposure_profile`, `operator_challenge_gate`, `final_output_handoff`, renderer payload, report prose, or any compatibility wrapper in the Phase D forensic output.

The backend runner must save this artifact before M8 begins.

### M7.S10C — Combined Output Prohibition

The following production backend output shape is forbidden:

```json
{
  "target_profile": {},
  "target_profile_forensics": {}
}
```

That shape incorrectly mixes the Phase B1 material artifact and the Phase D forensic artifact into one response. It may be shown only as documentation that M7 ultimately owns two artifacts, not as an executable backend response.

---

## M7.S11 — Output Quality Standard

M7 is locked only when it is both schema-valid and substance-valid.

A field is substance-valid when it is either:

1. supported by Agent 1/2-approved source text and correctly derived under its selected `TP.*` registry row; or
2. unresolved after targeted reinvestigation but represented through a controlled status, limitation/warning, and forensic ledger.

M7 must prefer controlled limitations over false certainty. It must never invent a target fact to satisfy field completeness.

---

## M7.S12 — Integration Lock Notes

`M7.S12.C1` Preserved doctrine: five-parent/eighteen-field material output, selected `TP.*` rows only, Target Source Extraction Capsule before field application, targeted reinvestigation before limitation, narrow legal-family exception, no downstream work, and profile-before-forensics sequencing.

`M7.S12.C2` Added custody hardening: M6 is navigation/custody only, source IDs are immutable custody anchors, every source ID must be paired with its exact upstream URL, source-ID relabeling is prohibited, browsing is prohibited, registry evaluation is prohibited, and wrappers/placeholders/source mismatch are hard rejection defects.

`M7.S12.C3` Current M7 lock: no combined target-feature phase identity, no four-artifact output shape, no one-shot M7+M8 execution, no validation status inside `target_profile`, and no shortcut that allows M8 before M7 material and forensic artifacts are saved.

`M7.S12.C4` Added failure-pattern hardening from latest profile audit: forbidden material aliases, required field types, forbidden forensic aliases, 18-row forensic derivation gate, row-count coverage gates, and contradiction checks. These guardrails exist to prevent generic “profile-with-confidence/evidence-basis” schemas from replacing the locked M7 material/forensic schema.

`M7.S12.C5` Output correction: M7 owns two artifacts, but they are not emitted in one production backend response. Phase B1 emits/saves only `target_profile`. Phase D emits/saves only `target_profile_forensics`. A combined two-artifact response is rejected because it skips the material-save-before-forensics gate.
