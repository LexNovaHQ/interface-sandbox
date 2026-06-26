# MODULE VII — TARGET PROFILE

## M7.S0 — Phase Call Card and Phase Local Lock Gate

<phase_call_card>
phase_id: PHASE_02
module_id: M7
module_name: TARGET_PROFILE
active_phase_only: true

governing_imports:
  - 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md
  - AGENT2_RUNTIME_BINDING_PACKET.yaml
  - 00_TERMINAL_RECEIPT_RULES_INTEGRATED.md
  - 00_VALIDATOR_RULES_INTEGRATED.md
  - FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  - FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml

execution_rule:
  Execute M7 only.
  Build `target_profile` only from the live backend M6 `source_discovery_handoff.bucket_family_index`, loaded target-family artifacts `lossless_family__T0_ROOT` through `lossless_family__T4_SUPPORTING_IDENTITY`, locked M9 `legal_cartography_index` where narrowly permitted, the M7 Target Source Extraction Capsule, and the M7 material selector mapped to governing TP.* FD Registry rows.
  Do not execute every TP.* row merely because it exists.
  Do not perform M8, M9, M10, M11, M12, M13, or M14 work.
  Do not emit final_output_handoff.
  Build and save the main material output first: `target_profile`.
  Build and save the separate provenance output only after the main output: `target_profile_forensics`.
  After phase output, call validate_phase.

phase_terminal_sequence:
  In phased execution, emit exactly one `<phase_output phase="M7">` block.
  Inside the block, execute M7 in three non-skippable internal stages: M7-A Target Source Extraction Capsule, M7-B TP Field Application, and M7-C Target Profile Forensics.
  Emit a compact M7 material-selector coverage summary only after M7-A extraction has locked.
  Do not emit row-by-row TP `FD_ROW` lines in the main phase response.
  Before field application, emit the exact internal checkpoint line: `PHASE EXTRACTION COMPLETE: TARGET_PROFILE_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED`.
  Then emit the exact phase checkpoint line: `PHASE MATERIAL PROFILE COMPLETE: TARGET_PROFILE 18/18`.
  Then emit the main phase packet containing `target_profile` first.
  After `target_profile` is complete, emit the separate provenance packet containing `target_profile_forensics`.
  Then emit `phase_local_gate`.
  Close with `</phase_output>`.
  Do not emit `<technical_audit_log>`.
  Do not emit `<operator_challenge_gate>`.
  Do not emit `final_output_handoff`.
  In monolith final execution, Module VII provenance may be projected to the final forensic/audit export only through Module XIII/Module XIV; the material target profile remains the five-parent, eighteen-field material object.

phase_local_gate:
  Before handoff, verify:
    - `target_profile` contains exactly five parent sections.
    - `target_profile` contains exactly eighteen material field lines across those parents.
    - the five parents are: Target Identity, Jurisdiction & Notice, Business Context, Product / Service Wrapper, and Target Profile Limitations.
    - `target_profile_forensics` is separate from `target_profile`.
    - `target_profile` is built and saved before `target_profile_forensics` is built and saved.
    - no profile metadata, evidence map, confidence object, trace, scratchpad, debug branch, extraction capsule, or forensic/provenance branch is emitted inside `target_profile`.
    - every emitted material field was derived through the M7 material selector table in `M7.S3`.
    - every selected TP.* registry row has a Module V workpad outcome or a `target_profile_forensics.field_derivation_ledger` outcome.
    - rows not selected for the eighteen-field material output are not executed as material fields.
    - the M7 Target Source Extraction Capsule was created and locked before field application.
    - every M6-approved target/legal route family URL relevant to M7 was extraction-reviewed, either with field-relevant lossless excerpts captured or with an explicit no-support/gated/broken/not-field-relevant reason.
    - capsule route-family coverage equals 100% of the M6-approved M7 route universe, excluding only routes formally marked broken, gated, duplicate-canonicalized, non-public, or outside M7 scope with reason.
    - any weak, missing, thin, vague, or conflicting field was sent through targeted field-specific re-extraction before receiving a limitation status.
    - all blank, limited, absent, weak, or conflicting fields have controlled field status.
    - missing evidence is routed to targeted re-extraction, controlled field status, M6 repair, or limitations; never guessed.
    - no M8-M14 canonical objects are emitted.

  allowed_gate_outcomes:
    - PASS
    - REPAIR_REQUIRED
    - REINVESTIGATE_REQUIRED
    - PASS_WITH_LIMITATION
    - CONTROLLED_FAILURE

allowed_inputs:
  - source_discovery_handoff
  - legal_cartography_index
  - TP.* field selector authority
  - M7 material selector table
  - M6-approved target/legal route families and M6 limitations

required_visible_rows:
  FD_ROW_PREFIX: NONE_IN_MAIN_PHASE_OUTPUT
  MATERIAL_OUTPUT_FIELD_COUNT: 18
  REQUIRED_EXTRACTION_CHECKPOINT: PHASE EXTRACTION COMPLETE: TARGET_PROFILE_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED
  REQUIRED_PHASE_CHECKPOINT: PHASE MATERIAL PROFILE COMPLETE: TARGET_PROFILE 18/18
  INTERNAL_LEDGER_REQUIREMENT: selected TP.* rows only, through Module V workpad and/or target_profile_forensics

required_machine_output:
  - target_profile
  - target_profile_forensics

forbidden_outputs:
  - target_feature_profile
  - legal_cartography_index
  - target_data_provenance_profile
  - target_exposure_profile
  - operator_challenge_gate
  - final_output_handoff
  - profile_meta inside target_profile
  - forensic/provenance branch inside target_profile
  - extraction capsule inside target_profile
  - old ten-field flat target_profile

validator_action:
  action_name: validate_phase
  phase: M7
  pass_condition: target_profile emitted with exactly five parents + eighteen material field lines, target_profile_forensics emitted separately after target_profile, selected TP.* material selector rows resolved, and targeted re-extraction performed before limitation statuses
  fail_behavior: repair M7 only; do not advance to M8

repair_policy:
  - If the local gate returns REPAIR_REQUIRED, repair M7 only and rerun the local gate.
  - If the local gate returns REINVESTIGATE_REQUIRED, emit a scoped reinvestigation request and do not advance.
  - If the defect is missing M6 route universe coverage, return to M6/Agent 1 source repair instead of inventing facts.
  - Do not recompute unrelated upstream objects.

stop_condition:
  Stop local M7 phase only; return control to the Agent 2 resolver in 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md.
  The Agent 2 resolver may proceed to M8 only if M7 returns PASS, PASS_WITH_LIMITATION, or CONTROLLED_FAILURE that is expressly safe for downstream use.
  If M7 returns REPAIR_REQUIRED or REINVESTIGATE_REQUIRED, do not proceed to M8.
</phase_call_card>

`M7.S0.C1` This phase call card is the first executable block for this Module when extracted into a standalone phase prompt.

`M7.S0.C2` In monolith execution, this call card functions as a Module-local lock gate and terminal-projection contract. It does not authorize standalone `<phase_output>` blocks in the final monolith response; final monolith emission remains governed by Module XIV and `00_TERMINAL_RAILS_RULES.md`.

`M7.S0.C3` The Module may not advance, hand off, or be treated as locked until its phase-local gate has returned `PASS`, `PASS_WITH_LIMITATION`, or `CONTROLLED_FAILURE` under the rules above.

`M7.S0.C4` `REPAIR_REQUIRED` and `REINVESTIGATE_REQUIRED` are stop states. The Module must repair, route targeted field re-extraction, or route scoped M6 repair before the next Module begins.

## M7.S1 — Function and Hard Rules

---

### M7.T0 — Applied Global Rules — Compressed Import

`M7.T0.C1` Module VII imports `GRK.001` through `GRK.019` and `GRK.003A` under `GRK.000A`. Imported rules apply in full.

`M7.T0.C2` Local deltas for Module VII are limited to target-profile work: use only locked Module VI route universe outputs, locked Module IX legal-cartography context where narrowly permitted, the M7 Target Source Extraction Capsule, and admitted M7-relevant cross-route evidence already listed by M6.

`M7.T0.C3` The legal-family exception is narrow: Terms, Terms of Service, Terms and Conditions, User Agreement, EULA, Privacy Policy, legal notice, imprint, Trust Center, or equivalent governance material may be used only for legal entity identity, entity type, registered/notice location, governing law, courts/venue, or legal notice identity where the source itself contains the relevant public text. Module VII must stop once the needed value, controlled status, or limitation is assigned.

`M7.T0.C4` Module VII must not perform feature extraction, data provenance, legal cartography analysis, registry evaluation, handoff assembly, report writing, or terminal emission.

`M7.T0.C5` Output root, lock status, ledger duties, limitation carry-forward, no-alias discipline, no-legal-advice boundary, and terminal preservation remain governed by the imported Global Rules, Module IV, Module V, and `M7.S13`.

---

### M7.T0A — Module Duty Card — Compressed

`M7.T0A.C1` Module VII executes under the common duty-card doctrine in Module II, Module IV, Module V, Module VI, Module IX, and `GRK.000A`.

`M7.T0A.C2` Canonical material output is `target_profile`. Canonical provenance output is `target_profile_forensics`. Required inputs are `source_discovery_handoff`, `legal_cartography_index`, M6-approved target/legal route families, M7-relevant cross-route evidence already listed by M6, final-source coverage limitations, and `fd_registry_reference` with `TP.*` authority.

`M7.T0A.C3` Unique model duties are: build the M7 Target Source Extraction Capsule, apply the M7 material selector table, derive exactly the eighteen material field lines across five parent sections, ledger every selected TP.* row, ledger targeted field-specific re-extraction, ledger cross-route evidence use, retire non-selected TP.* rows from material execution, emit only `target_profile` as main output, and emit `target_profile_forensics` only after `target_profile`.

`M7.T0A.C4` Unique forbidden acts are: executing all 43 TP.* rows as material output, using sources outside M6/M9, skipping extraction, assigning limitation statuses without targeted re-extraction, unadmitted evidence use, feature decomposition, data provenance, registry status, legal sufficiency/compliance assessment, report/handoff/terminal branch emission, aliases, old ten-field flat target profile, and material profile metadata inside `target_profile`.

`M7.T0A.C5` Repair route: Module VII target-profile defects are classified under `M7.S12.C0A–C0D` and the `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md` Section 8 Repair Routing Matrix. M6 route-universe defects return to Agent 1 / M6 source repair.

---

### M7.S1A — Function

`M7.S1A.C1` Module VII converts M6-approved target/legal route families, narrow M9 legal-cartography context, and the M7 Target Source Extraction Capsule into the canonical five-parent, eighteen-field `target_profile` object.

`M7.S1A.C2` Module VII performs target-level business identification only.

`M7.S1A.C3` Module VII answers: who the target is, where it is legally anchored where visible, what kind of business it appears to be, what public offering wrapper it exposes, and what public-footprint limitations affect downstream review.

`M7.S1A.C4` Module VII emits the material state object `target_profile` first.

`M7.S1A.C5` Module VII emits the provenance state object `target_profile_forensics` only after the material profile is complete.

`M7.S1A.C6` Module VII working memory is governed by Module V through `target_profile_ledger` and the M7 Target Source Extraction Capsule. The extraction capsule is internal working material and must not be saved as the forensic output before the main profile.

### M7.S1B — Mandatory Duties

`M7.S1B.C1` MUST consume Module VI `source_discovery_handoff`.

`M7.S1B.C2` MUST consume Module IX `legal_cartography_index` only for the narrow identity/notice/governing-law/courts-venue use cases authorized in `M7.S2C`.

`M7.S1B.C3` MUST use the live backend M6 family-index structure as the M7 route universe: `source_discovery_handoff.bucket_family_index.target_profile_urls.families`, loaded target-family artifacts `lossless_family__T0_ROOT`, `lossless_family__T1_IDENTITY`, `lossless_family__T2_LEGAL_IDENTITY`, `lossless_family__T3_OPERATOR_ENTITY`, and `lossless_family__T4_SUPPORTING_IDENTITY`; `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families` plus `legal_cartography_index` only where the legal-family exception permits; and `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families` plus loaded product-family artifacts only where `GRK.004` permits wrapper/business support for an active M7 field. Legacy `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, `source_coverage_gates`, and `missing_limited_primary_sources` branches are not required inputs in the backend-synced system.

`M7.S1B.C4` MUST execute and lock M7-A Target Source Extraction Capsule before applying TP.* field rules. Capsule creation means detailed route-family extraction, not a one-line summary.

`M7.S1B.C5` MUST apply only the TP.* rows mapped in the M7 material selector table for the eighteen material field lines. The full 43-row TP registry remains authority, but non-selected TP.* rows are not material execution rows.

`M7.S1B.C6` MUST preserve uncertainty through controlled field statuses: `FIELD_CONFIRMED`, `FIELD_LIMITED`, `FIELD_NOT_PUBLIC`, `FIELD_CONFLICTED`, or `FIELD_NOT_FOUND`.

`M7.S1B.C7` MUST send any weak, vague, missing, thin, or conflicting field through targeted field-specific re-extraction before assigning `FIELD_LIMITED`, `FIELD_NOT_PUBLIC`, `FIELD_CONFLICTED`, or `FIELD_NOT_FOUND`, unless the limitation is directly inherited from M6 because the relevant source route was already marked gated, broken, non-public, or unavailable.

`M7.S1B.C8` MUST write Module V ledger rows and/or `target_profile_forensics` rows before lock.

`M7.S1B.C9` MUST apply `GRK.004` when materially relevant M6-approved cross-route evidence supports an active M7 field.

`M7.S1B.C10` MUST record `cross_route_use_reason` when non-primary route-indexed evidence supports an M7 field.

`M7.S1B.C11` MUST use cross-route evidence only for the eighteen M7 material field lines and never for feature profiling, data provenance, legal cartography, registry evaluation, challenge, handoff, or terminal work.

### M7.S1C — Forbidden Acts

`M7.S1C.C1` Apply `M7.T0`, especially `GRK.001`, `GRK.002`, `GRK.004`, `GRK.007`, `GRK.008`, `GRK.009`, and `GRK.015`.

`M7.S1C.C2` Module VII must not discover new sources, search the web, follow unapproved links, use unadmitted source material, use candidate leads, use search snippets, or use rejected, quarantined, access-failed-only, deferred, duplicate-suppressed-only, snippet-only, or non-routed material as evidence.

`M7.S1C.C3` Module VII must not use legacy M6 evidence-vault, lossless-payload, phase-package, or coverage-limitation package branches as required inputs. Those branches are obsolete for Agent 2 after the rebuilt M6 route-execution contract.

`M7.S1C.C4` Module VII must not use any route or locked upstream object for non-M7 purposes. Cross-route admitted evidence may be used only where the evidence independently supports one of the eighteen M7 material fields and the cross-route use basis is ledgered. Legal-family access remains limited to `M7.S2C`.

`M7.S1C.C5` Module VII must not decompose wrappers into features/functions, build `primary_product`, derive product mechanism, derive data ingress, derive AI processing path, derive output/action path, derive data flow, derive retention, derive transfer, derive subprocessors, derive operator/controller signal, derive legal basis, derive provenance, assign archetype, assign surface token, or trigger registry rows.

`M7.S1C.C6` Module VII must not perform legal cartography review, compliance/enforceability/liability analysis, registry/archetype/surface/threat evaluation, display/report/final-handoff work, or emit trace, forensic ledger, scratchpad, debug, compatibility, old flat output, or extra output keys inside `target_profile`.

`M7.S1C.C7` Any violation of `M7.S1C` must be classified under `M7.S12.C0A–C0D` and routed through the `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md` Section 8 Repair Routing Matrix.

---

## M7.S2 — Input Protocol

### M7.S2A — Required Inputs

| Required Input | Required Use |
| --- | --- |
| Module VI `source_discovery_handoff` | upstream bucket/family route universe and source-custody index |
| `source_discovery_handoff.target_url` or target/ref equivalent | reviewed target/domain boundary |
| `source_discovery_handoff.bucket_family_index.target_profile_urls.families` | M7 target-family route universe |
| `lossless_family__T0_ROOT` | root/homepage target source text and custody refs |
| `lossless_family__T1_IDENTITY` | identity/about/company target source text and custody refs |
| `lossless_family__T2_LEGAL_IDENTITY` | target-side legal identity or notice source text where present |
| `lossless_family__T3_OPERATOR_ENTITY` | operator/entity/supporting corporate source text where present |
| `lossless_family__T4_SUPPORTING_IDENTITY` | supporting identity source text where present |
| `legal_cartography_index` | narrow identity/notice/governing-law/courts-venue context only |
| `fd_registry_reference` | governing `TP.*` registry authority |
| `M7.S3 target_profile_material_selector` | material TP-row selection map |

### M7.S2A.1 — Backend-Synced Source-Custody Rule

`M7.S2A.1.C1` The live backend source text location is `lossless_family__{ROOT_FAMILY}.sources[].lossless_text` as indexed by `source_discovery_handoff.contract.source_text_location`.

`M7.S2A.1.C2` Each source ID is immutable. A source ID such as `T1_IDENTITY.SRC.001` means only the exact source object carrying that ID inside the loaded upstream artifact.

`M7.S2A.1.C3` Every M7 forensic row that cites a `*.SRC.NNN` source reference must include the matching upstream `source_url` or `source_urls` copied from the same loaded source object.

`M7.S2A.1.C4` Do not relabel, reorder, infer, or remap source IDs. If the exact upstream URL for a source ID cannot be located, do not cite that source ID; create a limitation row instead.

### M7.S2B — Route Family Access Matrix

| Route / Object | Access Status | Permitted Use |
| --- | --- | --- |
| `lossless_family__T0_ROOT` | primary target family | all eighteen Target Profile material fields where supported by extracted source material |
| `lossless_family__T1_IDENTITY` | primary target family | identity, business context, wrapper, reviewed website/domain, and limitations |
| `lossless_family__T2_LEGAL_IDENTITY` | primary/narrow legal identity family | legal entity name, entity type, registered/notice location, governing law, courts/venue, and legal notice identity where source text supports it |
| `lossless_family__T3_OPERATOR_ENTITY` | supporting target family | operator/entity/supporting corporate identity where source text supports an active M7 field |
| `lossless_family__T4_SUPPORTING_IDENTITY` | supporting target family | supporting identity, business context, wrapper, and limitations where source text supports an active M7 field |
| `source_discovery_handoff.bucket_family_index.target_profile_urls.families` | custody/control | family-level route availability, primary/index-only/failed-absent state, and source-to-family routing; route existence alone is not field evidence |
| `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families` | narrow exception context | only where `M7.S2C` permits and primarily through `legal_cartography_index`; not legal analysis |
| `legal_cartography_index` | narrow supporting context | document index and legal/governance section signals only for fields authorized in `M7.S2C`; not compliance, enforceability, legal-risk, or registry analysis |
| product/data/registry families | forbidden for M7 material derivation except narrow cross-route factual support already indexed and explicitly ledgered | no feature mechanics, data provenance, legal cartography analysis, archetype/surface, registry, or risk evaluation |

### M7.S2C — Legal-Family Exception Stop Rule

`M7.S2C.C1` Module VII may use Terms, Terms of Service, Terms and Conditions, User Agreement, EULA, Privacy Policy, legal notice, imprint, Trust Center, Security Page, or equivalent governance material only where the specific source contains public text relevant to identity, notice, governing law, or courts/venue.

`M7.S2C.C2` Legal-family exception use is permitted only for:

* `legal_entity_name`;
* `entity_type`;
* `registered_notice_location`;
* `governing_law`;
* `courts_venue`;
* `target_profile_limitations`.

`M7.S2C.C3` Terms / User Agreement / EULA may support `legal_entity_name`, `entity_type`, `registered_notice_location`, `governing_law`, and `courts_venue`. Privacy Policy, legal notice, imprint, Trust Center, Security Page, or equivalent governance material may support those fields only where the source itself contains notice identity, address, governing law, venue, or equivalent public text. DPA, AUP, SLA, subprocessor page, AI policy, cookie policy, or governance material must not be used for Module VII unless the specific artifact contains legal notice identity/address/governing-law/venue text and the use is ledgered.

`M7.S2C.C4` Once the needed field is found, receives controlled status, or valid fallback is assigned, Module VII must stop using the legal-family exception for that field immediately.

`M7.S2C.C5` Legal-family exception access must write Module V ledger row type `target_legal_exception_access` and a corresponding row in `target_profile_forensics.cross_route_use_ledger` where the forensics artifact is emitted.

### M7.S2D — Input Failure Handling

| Condition | Required Handling |
| --- | --- |
| `source_discovery_handoff` missing | emit `CONTROLLED_FAILURE` |
| M6 `status` / lock state = `CONTROLLED_FAILURE` | emit limited profile only if safe; otherwise `CONTROLLED_FAILURE` |
| `source_discovery_handoff.bucket_family_index.target_profile_urls.families` missing in URL mode | return to M6 source repair unless document-only mode applies |
| all loaded target-family artifacts missing or empty | `REPAIR_REQUIRED` |
| source family object lacks any primary/index-only/failed-absent state | `REPAIR_REQUIRED` |
| `legal_cartography_index` missing | `LOCKED_WITH_LIMITATIONS` only if legal/jurisdiction fields can be derived from loaded target-family artifacts; otherwise repair |
| field evidence thin or ambiguous after first extraction | send the specific field back to targeted re-extraction within loaded source families |
| field remains weak after targeted re-extraction | assign controlled field status and record limitation/provenance |
| necessary source family absent from M6 | return to M6/Agent 1 source repair |
| non-primary family evidence appears needed to populate field | use only if M6-approved, M7-field-relevant, and ledgered; otherwise fallback and record limitation |

### M7.S2E — Source-Mode Scope Rule

`M7.S2E.C1` In `url` and `url_plus_text` modes, Module VII may use only M6-approved URL-derived target/legal evidence and M6-approved M7-relevant supplied public material.

`M7.S2E.C2` In `NO_URL_PUBLIC_MATERIAL_ONLY` / `text` mode, Module VII may derive the eighteen material field lines only from supplied public material admitted and routed by Module VI.

`M7.S2E.C3` If supplied public material is legal/governance/data-only and does not reliably identify the target, Module VII must ask for a public target URL or lock with explicit limitation / controlled failure. It must not infer identity from brand familiarity, filename, or model memory.

`M7.S2E.C4` In document-only mode, `target_profile.target_profile_limitations` must disclose that the run is based on supplied public material only and is not a full website public-footprint review.

---

## M7.S3 — Inventory and Field Derivation

`M7.S3.C1` Module VII owns only `target_profile` and `target_profile_forensics`.

`M7.S3.C2` Module VII does not define local field derivation rows.

`M7.S3.C3` Material field authority for `target_profile` comes from `FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`, filtered through the M7 material selector table below.

`M7.S3.C4` Module VII must apply the Target Profile material selector:

```yaml
fd_registry_selector:
  registry_reference: FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  profile_section: Target Profile
  field_id_prefix: TP.
  source_registry_available_rows: 43
  material_output_field_count: 18
  execution_scope: selected_material_rows_only
  selected_field_families:
    - TP.ID.*: selected identity, reviewed website, and primary domain rows only
    - TP.JUR.*: selected registered/notice location, governing-law, and courts/venue rows only
    - TP.BIZ.*: selected business category, customer type, market type, industry/sector, and regulated-sector rows only
    - TP.WRAP.*: selected high-level offering, public claim, wrapper names, and delivery-model rows only
    - TP.LIM.*: selected limitation rows only
```

`M7.S3.C5` For every selected `TP.*` row, Module VII must apply the governing `Mode`, `Source_Basis`, `Conditions`, `Trigger_Outcome`, `Exclude_Fallback`, and `Forbidden_Inference`.

`M7.S3.C6` Every populated `target_profile` field must cite the applicable selected `TP.*` `Field_ID` in Module V ledger and/or `target_profile_forensics.field_derivation_ledger`.

`M7.S3.C7` Module-native metadata must remain outside `target_profile` in phase-local gate, Module V ledger, validator output, or `target_profile_forensics`. It must not be emitted as `profile_meta` or any equivalent material field.

`M7.S3.C8` No `M7.FD.*` row has runtime authority after this selector is active. Legacy local FD identifiers may appear only as historical patch references and must not control derivation.

`M7.S3.C9` If a selected `TP.*` row cannot be applied after targeted re-extraction where required, Module VII must emit a controlled field status or controlled limitation using the allowed M7 field status vocabulary and ledger the fallback/limitation.

### M7.T1 — Target Profile Material Selector

| Parent | Output Field | Registry Fields to Use | Use Rule | Fallback / Limitation Rule |
|---|---|---|---|---|
| Target Identity | `brand_name` | `TP.ID.001` | Extract the public-facing brand or company/product name from M6-approved target source material. | If only a domain slug or weak mention exists after targeted re-extraction, emit `FIELD_LIMITED` with limitation. |
| Target Identity | `legal_entity_name` | `TP.ID.002` | Extract legal entity / contracting party / operator name from target, terms, privacy, legal notice, imprint, footer, or corporate notice where M6/M9-approved. | If no legal entity is visible after targeted re-extraction, emit `FIELD_NOT_FOUND` or `FIELD_NOT_PUBLIC` and add identity limitation. |
| Target Identity | `entity_type` | `TP.ID.005` | Extract legal form only where expressly visible: Inc., LLC, Pvt Ltd, Ltd, GmbH, etc. | Do not infer. If unavailable after targeted re-extraction, emit controlled status. |
| Target Identity | `reviewed_website` | `TP.ID.003` | Use submitted/resolved target-controlled reviewed URL. | If URL cannot be resolved to reviewed target, controlled failure or limitation. |
| Target Identity | `primary_domain` | `TP.ID.004` | Derive from the reviewed target-controlled URL or M6 target boundary. | If M6 target boundary is uncertain, inherit M6 limitation. |
| Jurisdiction & Notice | `registered_notice_location` | `TP.JUR.001`, `TP.JUR.002` | Prefer full registered office / legal notice / notice address if visible. If full address is not visible, emit registered/notice location using country/state/region where visible. | If neither address nor location is visible after targeted re-extraction, emit controlled status and jurisdiction limitation. |
| Jurisdiction & Notice | `governing_law` | `TP.JUR.003` | Extract governing law only where expressly visible in M6/M9-approved legal/governance material. | Do not infer. If unavailable after targeted re-extraction, emit controlled status. |
| Jurisdiction & Notice | `courts_venue` | `TP.JUR.004`, `TP.JUR.005` | Extract courts, venue, arbitration forum, or dispute forum only where expressly visible. | Do not infer. If unavailable after targeted re-extraction, emit controlled status. |
| Business Context | `business_category` | `TP.BIZ.001` | Classify the visible business category at high level: AI vendor, SaaS, API platform, model provider, developer platform, marketplace/intermediary, service/advisory layer, hybrid, etc. | If unclear after targeted re-extraction, emit `FIELD_LIMITED` and business-context limitation. |
| Business Context | `primary_customer_type` | `TP.BIZ.002` | Extract visible customer/user segment: B2B, B2C, developers, enterprises, government/public sector, creators, agencies, etc. | Do not infer from design or vibe. If not visible after targeted re-extraction, emit controlled status. |
| Business Context | `market_type_candidate` | `TP.BIZ.003` | Identify self-serve, enterprise, API-first, platform, managed/service-assisted, open-access, gated/request-demo, or hybrid only from public signals. | If unclear after targeted re-extraction, emit controlled status. |
| Business Context | `industry_sector` | `TP.BIZ.004` | Extract industry/sector positioning from visible public text. | Do not infer geography/sector from TLD, language, founder location, or model knowledge. |
| Business Context | `regulated_sector_hints` | `TP.BIZ.005` | Emit factual regulated-sector hints only: healthcare, finance, education, employment, minors, biometrics, government, legal/professional, etc. | If no regulated-sector signal is visible after targeted re-extraction, emit empty array and record field status in forensics. Do not infer from vibes. |
| Product / Service Wrapper | `high_level_offering` | `TP.WRAP.001` | Summarize the public offering wrapper at target level without feature mechanics. | If unclear after targeted re-extraction, emit controlled status and wrapper limitation. |
| Product / Service Wrapper | `primary_public_claim` | `TP.WRAP.002` | Extract the target's main public positioning claim where visible. | Do not turn claims into verified facts. If not visible after targeted re-extraction, emit controlled status. |
| Product / Service Wrapper | `product_service_wrapper_names` | `TP.WRAP.003`, `TP.WRAP.004` | List named products/platforms/APIs/models/services at wrapper level only. | Do not decompose into features. If wrapper list is thin or gated, emit limitation. |
| Product / Service Wrapper | `delivery_model_signals` | `TP.WRAP.005`, `TP.WRAP.006`, `TP.WRAP.007`, `TP.WRAP.008` | Extract delivery model signals: app/platform, API/programmatic, offline/service/advisory, partner/marketplace/intermediary, dashboard, docs, or deployment surface where visible. | Do not infer mechanics. If delivery model is unclear after targeted re-extraction, emit controlled status. |
| Target Profile Limitations | `target_profile_limitations` | `TP.ID.009`, `TP.JUR.008`, `TP.BIZ.008`, `TP.WRAP.010`, `TP.LIM.001`–`TP.LIM.008` | Emit only material limitations affecting target profile or downstream review. Limitation subtypes must include identity, jurisdiction, business-context, wrapper, and downstream-review effect where relevant. | Empty array only if no material limitation exists after extraction and targeted re-extraction checks. Never omit limitations caused by missing legal name, jurisdiction, gated source, thin footprint, unclear wrapper, or M6 route limitation. |

### M7.T2 — Registry Rows Not Selected for Material M7 Output

```yaml
m7_audit_retired_rows:
  rule: These TP rows remain part of the registry but are not emitted as standalone M7 material fields unless a validator/audit export explicitly requests them. They may support limitations or forensics where relevant.
  rows:
    - TP.ID.006: Parent / affiliate relationship; may qualify legal_entity_name or identity limitation only, not a standalone material field.
    - TP.ID.007: Identity confidence; store in Module V ledger / target_profile_forensics only.
    - TP.ID.008: Identity evidence basis; store in Module V ledger / target_profile_forensics only.
    - TP.JUR.006: Jurisdiction confidence; store in Module V ledger / target_profile_forensics only.
    - TP.JUR.007: Jurisdiction evidence basis; store in Module V ledger / target_profile_forensics only.
    - TP.BIZ.006: Business-context confidence; store in Module V ledger / target_profile_forensics only.
    - TP.BIZ.007: Business-context evidence basis; store in Module V ledger / target_profile_forensics only.
    - TP.WRAP.009: Wrapper evidence basis; store in Module V ledger / target_profile_forensics only.
```

### M7.T3 — Target Profile FD Registry Selector

```yaml
target_profile_fd_registry_selector:
  table_id: M7.T3
  selector_type: material_registry_selector
  governing_registry: FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
  profile_section: Target Profile
  field_id_prefix: TP.
  source_registry_available_row_count: 43
  material_output_field_count: 18
  local_fd_table_replaced: true
  no_local_redefinition: true
  material_field_execution_rule:
    - load TP registry as authority
    - execute only TP rows mapped in M7.T1
    - do not execute all 43 TP rows as material output
    - build M7 Target Source Extraction Capsule before field application
    - apply row Mode
    - apply row Source_Basis
    - evaluate row Conditions
    - apply row Trigger_Outcome
    - apply row Exclude_Fallback
    - enforce row Forbidden_Inference
    - if field support is insufficient, send the field to targeted field-specific re-extraction
    - after targeted re-extraction, emit a confirmed field value or controlled field status
    - write Module V ledger row and/or target_profile_forensics row with output_field, fd_registry_id, fd_field_id, fd_profile_section, fd_mode, fd_outcome, fallback_code where applicable, evidence_refs where applicable, re_extraction_status where applicable, and forbidden_inference_check
    - mark non-selected rows audit-retired for M7 material output where validator/audit export requires tracking
```

---

## M7.S4 — Execution Step 1: Input and Selector Initialization

### Consumes

`M7.S4.C1` Consume Module VI `source_discovery_handoff`.

`M7.S4.C2` Consume Module VI `source_discovery_handoff.target_url` or target/ref equivalent as the reviewed target boundary.

`M7.S4.C3` Consume Module VI `source_discovery_handoff.bucket_family_index.target_profile_urls.families`.

`M7.S4.C4` Consume loaded target-family artifacts `lossless_family__T0_ROOT` through `lossless_family__T4_SUPPORTING_IDENTITY` and their `sources[]` source-custody objects.

`M7.S4.C5` Consume each loaded family artifact only for source text and source-custody metadata admitted by Agent 1 / M6.

`M7.S4.C6` Consume family-level `primary`, `index_only`, and `failed_absent` state from `source_discovery_handoff.bucket_family_index` as inherited coverage/limitation context.

`M7.S4.C7` Consume `missing_limited_primary_sources[]`, `rejected_sources[]`, `manifest_only_sources[]`, and `metadata_only_sources[]` from the loaded family artifacts where present as inherited limitation context.

`M7.S4.C8` Consume `legal_cartography_index` only for narrow identity/notice/governing-law/courts-venue context.

### Applies

`M7.S4.C9` Load the M7 material selector table in `M7.S3`. No material Target Profile field may be populated until the applicable selected TP.* row is applied.

`M7.S4.C10` Initialize a five-parent, eighteen-field `target_profile` shell with only the allowed parent sections and fields in `M7.S13.C3`.

`M7.S4.C11` Initialize internal M7 Target Source Extraction Capsule with five capsule parents: Target Identity, Jurisdiction & Notice, Business Context, Product / Service Wrapper, and Target Profile Limitations.

### Writes

`M7.S4.C12` Write Module V ledger row type `target_profile_input_check`.

`M7.S4.C13` Write Module V ledger row type `target_profile_material_selector_initialization`.

`M7.S4.C14` Write Module V ledger row type `target_source_extraction_capsule_initialization`.

### Forbidden

`M7.S4.C15` Do not write `profile_meta` or any metadata branch inside `target_profile`.

`M7.S4.C16` Do not use old M6 package inputs, lossless-payload branches, or evidence-vault branches as required inputs.

`M7.S4.C17` Do not use product/activity, data/provenance, or registry-support routes for non-M7 purposes. Cross-route evidence may be used only if it independently supports an active M7 field and the cross-route basis is ledgered.

`M7.S4.C18` Do not use the legal-family exception during Step 1; reserve M6/M9-approved legal-family evidence for the fields authorized in `M7.S2C`.

### Failure Handling

`M7.S4.C19` Missing `source_discovery_handoff`, missing `bucket_family_index.target_profile_urls.families`, or missing/empty loaded target-family artifacts means `REPAIR_REQUIRED` or `CONTROLLED_FAILURE` depending on whether the defect is repairable by M6 / Agent 1.


---

## M7.S4A — Execution Step 1A: Target Source Extraction Capsule

`M7.S4A.C0` M7-A is a mandatory internal extraction phase. Module VII must not begin TP field application under `M7.S5` through `M7.S10` until this extraction phase is complete and locally locked.

### Purpose

`M7.S4A.C1` The Target Source Extraction Capsule replaces the obsolete assumption that M6 supplies downstream lossless evidence. Rebuilt M6 supplies the route universe. Module VII must therefore extract the target-specific material needed for TP field application from M6-approved routes before applying the FD Registry.

`M7.S4A.C2` The capsule is not the saved forensic output and not the main material profile. It is internal working material used to make TP field application evidence-backed. It may be summarized later inside `target_profile_forensics` after the main `target_profile` has been built and saved.

### Source Universe

`M7.S4A.C3` Build the M7 extraction source universe from these sources only:

- `source_discovery_handoff.bucket_family_index.target_profile_urls.families`
- `lossless_family__T0_ROOT.sources[]`
- `lossless_family__T1_IDENTITY.sources[]`
- `lossless_family__T2_LEGAL_IDENTITY.sources[]`
- `lossless_family__T3_OPERATOR_ENTITY.sources[]`
- `lossless_family__T4_SUPPORTING_IDENTITY.sources[]`
- family-artifact limitation branches such as `missing_limited_primary_sources[]`, `rejected_sources[]`, `manifest_only_sources[]`, and `metadata_only_sources[]` where present
- `legal_cartography_index` only for legal identity, notice, governing-law, court, venue, and legal notice context permitted by `M7.S2C`
- `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families` and loaded product-family artifacts `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING` only where `GRK.004` permits wrapper/business support for an active M7 field; these routes must never be used for feature mechanics, archetypes, surfaces, data provenance, or exposure analysis

`M7.S4A.C4` Module VII may not add new URLs, discover new sources, follow unapproved links, perform search, rely on memory, or use general public familiarity with the target. If the route needed for a material Target Profile field is absent from M6, return to M6 / Agent 1 source repair.

### 100% Route-Family Coverage Rule

`M7.S4A.C5` Every M6-approved route in the M7 source universe must receive a capsule coverage row before field application begins.

`M7.S4A.C6` A route coverage row must identify:

```yaml
route:
route_family:
approved_by_m6: true
execution_status_from_m6:
used_for_capsule_parents:
  - Target Identity
  - Jurisdiction & Notice
  - Business Context
  - Product / Service Wrapper
  - Target Profile Limitations
extraction_result:
  one_of:
    - FIELD_RELEVANT_MATERIAL_EXTRACTED
    - NO_FIELD_RELEVANT_MATERIAL_FOUND
    - DUPLICATE_CANONICALIZED
    - GATED_OR_NON_PUBLIC
    - BROKEN_OR_404
    - OUTSIDE_M7_SCOPE_WITH_REASON
    - RETURN_TO_M6_REPAIR_REQUIRED
extracted_material_refs:
exclusion_or_limitation_reason:
```

`M7.S4A.C7` The capsule coverage gate passes only when 100% of M7 source-universe routes have a coverage row. The gate may pass with limitation where M6 already marks a route gated, non-public, broken, duplicate-canonicalized, or limited, but the limitation must be inherited and recorded.

`M7.S4A.C8` Route existence is not evidence. A route proves only that a source was discovered/executed. Field evidence exists only where the capsule extracts field-relevant source material from the approved route.

### Field-Relevant Lossless Extraction Rule

`M7.S4A.C9` Extraction must be field-relevant and lossless at the material-fragment level. The model must capture the exact public wording, label, heading, clause title, page section, or visible text fragment that supports a Target Profile field. It must not replace extraction with a generic summary.

`M7.S4A.C10` The capsule should not copy full pages or create a giant evidence vault. It must extract only the fragments needed to apply the selected TP fields, but those fragments must preserve enough original wording to allow field derivation and later forensic proof.

`M7.S4A.C11` Every extracted fragment must be assigned to one or more capsule parents:

- Target Identity
- Jurisdiction & Notice
- Business Context
- Product / Service Wrapper
- Target Profile Limitations

`M7.S4A.C12` Every extracted fragment must carry:

```yaml
capsule_parent:
route:
source_location:
field_relevance:
exact_or_near_lossless_fragment:
normalization_note:
supported_candidate_fields:
limitation_note:
```

### Parent-Specific Extraction Duties

`M7.S4A.C13` Target Identity extraction must search approved routes for brand name, legal entity name, entity type, reviewed website, primary domain, legal notice identity, footer identity, terms/privacy contracting identity, and any visible identity ambiguity.

`M7.S4A.C14` Jurisdiction & Notice extraction must search approved target/legal routes for registered office, legal notice address, privacy/legal postal address, governing law, courts, venue, arbitration forum, dispute forum, and absence/gating of these signals.

`M7.S4A.C15` Business Context extraction must search approved routes for public business category, customer type, market type, industry/sector, regulated-sector factual hints, geographic market statements where expressly visible, and business-context uncertainty.

`M7.S4A.C16` Product / Service Wrapper extraction must search approved routes for high-level offering, public positioning claim, named product/service/API/model/platform wrappers, delivery model signals, app/platform/API/dashboard/docs/deployment signals, and wrapper uncertainty. It must not extract feature mechanics, data flows, archetypes, surfaces, or registry triggers.

`M7.S4A.C17` Target Profile Limitations extraction must identify missing identity, missing legal entity, missing entity type, missing notice location, missing governing law, missing venue, unclear customer type, unclear wrapper, gated/request-only materials, thin public footprint, M6 inherited limitations, and downstream review effects.

### Extraction Quality Gate

`M7.S4A.C18` M7-A extraction fails if any of the following occurs:

- an M6-approved M7 route has no coverage row;
- a capsule parent is empty while approved routes likely contain material for it;
- a field is later populated from a route that was not included in the capsule;
- the capsule uses generic summaries instead of field-relevant fragments;
- route labels are treated as facts without extracted support;
- the capsule uses sources outside M6/M9;
- legal/governance routes are used outside the `M7.S2C` legal-family exception;
- product/activity routes are used to derive feature mechanics or archetypes;
- field application begins before the extraction gate passes.

`M7.S4A.C19` If extraction is incomplete because a route is absent from M6, do not proceed to TP field application. Return `REPAIR_REQUIRED` with M6/Agent 1 source repair route.

`M7.S4A.C20` If extraction is complete but the public material remains thin, vague, gated, or not public, proceed to field application only with inherited limitation context and mandatory targeted field-specific re-extraction where a material field remains deficient.

### Extraction Checkpoint

`M7.S4A.C21` Module VII may proceed to M7-B field application only after recording this checkpoint:

```text
PHASE EXTRACTION COMPLETE: TARGET_PROFILE_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED
```

`M7.S4A.C22` The checkpoint is false and invalid unless every route in the M7 source universe has a capsule coverage row and every parent has either extracted field-relevant material or an explicit limitation/no-support reason.

`M7.S4A.C23` Write Module V ledger row types:

- `target_source_route_coverage_row`
- `target_source_fragment_extraction`
- `target_source_parent_coverage_check`
- `target_source_extraction_quality_gate`

`M7.S4A.C24` Do not save the extraction capsule as a standalone artifact before the main profile. Save only `target_profile` first. Summarize the capsule later in `target_profile_forensics`.
---

## M7.S5 — Execution Step 2: Identity and URL Derivation

### Consumes

`M7.S5.C1` Consume M7 Target Identity extraction capsule first.

`M7.S5.C2` Consume the M7 Target Identity extraction capsule derived from `source_discovery_handoff.bucket_family_index.target_profile_urls.families`, loaded target-family artifacts `lossless_family__T0_ROOT` through `lossless_family__T4_SUPPORTING_IDENTITY`, and narrow legal-family context only where `M7.S2C` permits. Do not look for legacy route-inventory or route-execution branches.

`M7.S5.C3` May consume M6/M9-approved legal-family evidence under `M7.S2C` only for `legal_entity_name` or `entity_type` if target-profile route extraction cannot supply them.

`M7.S5.C4` May consume cross-route M6-approved evidence under `GRK.004` only where it independently supports `brand_name`, `legal_entity_name`, `entity_type`, `reviewed_website`, or `primary_domain` and the basis is ledgered.

### Applies

`M7.S5.C5` Apply `TP.ID.001` for `brand_name`.

`M7.S5.C6` Apply `TP.ID.002` for `legal_entity_name`.

`M7.S5.C7` Apply `TP.ID.005` for `entity_type`.

`M7.S5.C8` Apply `TP.ID.003` for `reviewed_website`.

`M7.S5.C9` Apply `TP.ID.004` for `primary_domain`.

`M7.S5.C10` If any identity field is weak, missing, vague, or conflicting after first extraction, send that specific field back to targeted identity re-extraction before assigning a limitation status.

### Writes

`M7.S5.C11` Write only these target-profile fields under `target_profile.target_identity`: `brand_name`, `legal_entity_name`, `entity_type`, `reviewed_website`, and `primary_domain`.

`M7.S5.C12` Write Module V ledger row types:

* `target_identity_derivation`;
* `target_url_derivation`;
* `target_identity_re_extraction`, where applicable;
* `target_legal_exception_access`, only if legal-family exception used.

### Forbidden

`M7.S5.C13` Do not derive `operator_or_controller_signal`.

`M7.S5.C14` Do not emit parent/affiliate relationship, identity confidence, or identity evidence-basis as material fields.

`M7.S5.C15` Do not use DPA, AUP, SLA, Trust Center, Security Page, Subprocessor Page, AI Policy, or Cookie Policy for identity unless the specific M6/M9-approved artifact contains legal notice identity/address and the use is permitted under `M7.S2C.C3`.

`M7.S5.C16` Do not derive feature, data, legal-cartography, registry, or risk fields.

### Stop Rule

`M7.S5.C17` Once `legal_entity_name` / `entity_type` is found, controlled status is assigned, or valid fallback is assigned, stop reading legal-family evidence for identity immediately.

---

## M7.S6 — Execution Step 3: Jurisdiction and Notice Derivation

### Consumes

`M7.S6.C1` Consume M7 Jurisdiction & Notice extraction capsule first.

`M7.S6.C2` Consume the M7 Jurisdiction & Notice extraction capsule derived from `source_discovery_handoff.bucket_family_index.target_profile_urls.families`, loaded target-family artifacts, and M6/M9-approved legal-family context only where `M7.S2C` permits. Do not look for legacy target/legal route-execution rows.

`M7.S6.C3` Consume M6/M9-approved legal-family evidence only under `M7.S2C` and only for `registered_notice_location`, `governing_law`, or `courts_venue`.

`M7.S6.C4` May consume cross-route M6-approved evidence under `GRK.004` only where it independently supports `registered_notice_location`, `governing_law`, or `courts_venue` and the basis is ledgered.

### Applies

`M7.S6.C5` Apply `TP.JUR.001` and `TP.JUR.002` for `registered_notice_location`.

`M7.S6.C6` Apply `TP.JUR.003` for `governing_law`.

`M7.S6.C7` Apply `TP.JUR.004` and `TP.JUR.005` for `courts_venue`.

`M7.S6.C8` If any jurisdiction/notice field is weak, missing, vague, or conflicting after first extraction, send that specific field back to targeted jurisdiction/notice re-extraction before assigning a limitation status.

### Writes

`M7.S6.C9` Write only these target-profile fields under `target_profile.jurisdiction_notice`: `registered_notice_location`, `governing_law`, and `courts_venue`.

`M7.S6.C10` Write Module V ledger row types:

* `target_address_or_notice_derivation`;
* `target_governing_law_derivation`;
* `target_courts_venue_derivation`;
* `target_jurisdiction_re_extraction`, where applicable;
* `target_legal_exception_access`, only if legal-family exception used.

### Address Preference Rule

`M7.S6.C11` For `registered_notice_location`, prefer the most specific visible public value in this order: full registered office address → legal notice address → privacy/legal contact postal address → registered/notice state-region/country location → controlled field status.

### Forbidden

`M7.S6.C12` Do not infer jurisdiction from TLD, language, customer geography, CDN, server region, phone code, office assumption, founder nationality, or model knowledge.

`M7.S6.C13` Do not conduct legal enforceability, legal sufficiency, venue validity, or compliance analysis.

`M7.S6.C14` Do not collapse governing law and courts/venue into one vague field.

### Stop Rule

`M7.S6.C15` Once each needed address/jurisdiction field is found, controlled status is assigned, or valid fallback is assigned, stop reading legal-family evidence for that field immediately.

---

## M7.S7 — Execution Step 4: Business, Market, and Regulated-Sector Derivation

### Consumes

`M7.S7.C1` Consume M7 Business Context extraction capsule first.

`M7.S7.C2` Consume the M7 Business Context extraction capsule derived from live target-family artifacts and, only where `GRK.004` permits, product/activity family artifacts that independently support an active M7 business-context field. Do not look for legacy route-execution rows and do not use product/activity material for feature profiling.

`M7.S7.C3` May consume cross-route M6-approved evidence under `GRK.004` only where it independently supports `business_category`, `primary_customer_type`, `market_type_candidate`, `industry_sector`, `regulated_sector_hints`, or limitations and the basis is ledgered.

### Applies

`M7.S7.C4` Apply `TP.BIZ.001` for `business_category`.

`M7.S7.C5` Apply `TP.BIZ.002` for `primary_customer_type`.

`M7.S7.C6` Apply `TP.BIZ.003` for `market_type_candidate`.

`M7.S7.C7` Apply `TP.BIZ.004` for `industry_sector`.

`M7.S7.C8` Apply `TP.BIZ.005` for `regulated_sector_hints`.

`M7.S7.C9` If any business-context field is weak, missing, vague, or conflicting after first extraction, send that specific field back to targeted business-context re-extraction before assigning a limitation status.

### Writes

`M7.S7.C10` Write only these target-profile fields under `target_profile.business_context`: `business_category`, `primary_customer_type`, `market_type_candidate`, `industry_sector`, and `regulated_sector_hints`.

`M7.S7.C11` Write Module V ledger row types:

* `target_business_category_derivation`;
* `target_customer_type_derivation`;
* `target_market_type_derivation`;
* `target_industry_sector_derivation`;
* `target_regulated_sector_derivation`;
* `target_business_context_re_extraction`, where applicable.

### Forbidden

`M7.S7.C12` Do not use product/activity routes for feature profiling. Cross-route M6-approved evidence may support selected M7 business/market fields only if it independently supports the M7 field and the basis is ledgered.

`M7.S7.C13` Do not write sales motion, revenue model, public-sector status, target language, or geography as separate fields unless mapped to an active M7 field and expressly supported.

`M7.S7.C14` Do not infer geography from office, language, TLD, CDN, founder location, or model knowledge. Geography may appear only when expressly visible in M6-approved evidence.

`M7.S7.C15` Do not convert regulated-sector hints into legal, risk, registry, privacy-readiness, or compliance conclusions.

---

## M7.S8 — Execution Step 5: Wrapper Signal Derivation

### Consumes

`M7.S8.C1` Consume M7 Product / Service Wrapper extraction capsule first.

`M7.S8.C2` Consume the M7 Product / Service Wrapper extraction capsule derived from live target-family artifacts and, only where `GRK.004` permits, product/activity family artifacts that independently support wrapper-level M7 fields. Do not use product/activity material to derive feature mechanics, archetypes, surfaces, data flows, or exposure routing.

`M7.S8.C3` May consume cross-route M6-approved evidence under `GRK.004` only where it independently supports `high_level_offering`, `primary_public_claim`, `product_service_wrapper_names`, `delivery_model_signals`, or limitations and the basis is ledgered.

### Applies

`M7.S8.C4` Apply `TP.WRAP.001` for `high_level_offering`.

`M7.S8.C5` Apply `TP.WRAP.002` for `primary_public_claim`.

`M7.S8.C6` Apply `TP.WRAP.003` and `TP.WRAP.004` for `product_service_wrapper_names`.

`M7.S8.C7` Apply `TP.WRAP.005`, `TP.WRAP.006`, `TP.WRAP.007`, and `TP.WRAP.008` for `delivery_model_signals`.

`M7.S8.C8` If any wrapper field is weak, missing, vague, or conflicting after first extraction, send that specific field back to targeted wrapper re-extraction before assigning a limitation status.

### Writes

`M7.S8.C9` Write only these target-profile fields under `target_profile.product_service_wrapper`: `high_level_offering`, `primary_public_claim`, `product_service_wrapper_names`, and `delivery_model_signals`.

`M7.S8.C10` Write Module V ledger row types:

* `target_high_level_offering_derivation`;
* `target_primary_public_claim_derivation`;
* `target_wrapper_names_derivation`;
* `target_delivery_model_signal_derivation`;
* `target_wrapper_re_extraction`, where applicable.

### Forbidden

`M7.S8.C11` Do not use product/activity routes for feature profiling. Cross-route M6-approved evidence may support wrapper-level target fields only if it independently supports the M7 field and the basis is ledgered.

`M7.S8.C12` Do not emit `primary_product`.

`M7.S8.C13` Do not derive product mechanism.

`M7.S8.C14` Do not decompose wrappers into atomic features.

`M7.S8.C15` Do not assign archetypes or surfaces.

`M7.S8.C16` Do not derive data inputs, processing path, output action, or provenance.

---

## M7.S9 — Execution Step 6: Target Source Extraction Capsule and Custody Ledger Assembly

### Consumes

`M7.S9.C1` Consume the five M7 extraction capsule parents and populated Module VII fields.

`M7.S9.C2` Consume the completed M7 Target Source Extraction Capsule, `source_discovery_handoff.bucket_family_index` family metadata, loaded family-artifact limitation branches where present, and narrow `legal_cartography_index` context only where used under `M7.S2C`. Do not look for legacy M6 route inventory, route execution ledger, source coverage gates, or standalone missing/limited-primary-source branches.

### Applies

`M7.S9.C3` Apply the evidence-basis obligations attached to selected TP.* rows and record supporting `fd_field_id` values in Module V ledger and/or `target_profile_forensics.field_derivation_ledger`.

`M7.S9.C4` Apply the rule that the Target Source Extraction Capsule is internal working material. It may be summarized in `target_profile_forensics` after the main profile, but it must not be saved as a standalone material profile or emitted before `target_profile`.

### Writes

`M7.S9.C5` Write evidence refs, source URLs, extraction capsule summary, and evidence basis only to Module V ledger and `target_profile_forensics`. No evidence-basis object is authorized inside `target_profile`.

`M7.S9.C6` Write Module V ledger row type `target_evidence_mapping`.

`M7.S9.C7` Write Module V ledger row type `target_source_extraction_capsule_summary`.

`M7.S9.C7A` Every evidence row that contains a `*.SRC.NNN` value must include the exact `source_url` or `source_urls` copied from the same loaded upstream source object. Naked source IDs are forbidden.

### Forbidden

`M7.S9.C8` Do not create evidence entries for empty arrays, schema-only fields, unsupported values, route existence alone, or non-substantive metadata.

`M7.S9.C9` Do not cite non-routed, rejected, quarantined, access-failed-only, duplicate-suppressed-only, snippet-only, or otherwise unapproved source material.

`M7.S9.C10` Do not quote unsupported text.

`M7.S9.C11` Do not emit `evidence_map`, confidence objects, source refs, custody refs, extraction capsule, or forensic/provenance branches inside `target_profile`.

---

## M7.S10 — Execution Step 7: Limitations Assembly

### Consumes

`M7.S10.C1` Consume family-artifact limitation branches such as `missing_limited_primary_sources[]`, `rejected_sources[]`, `manifest_only_sources[]`, and `metadata_only_sources[]` where present.

`M7.S10.C2` Consume `source_discovery_handoff.bucket_family_index` family-level `primary`, `index_only`, and `failed_absent` state as inherited coverage/limitation context.

`M7.S10.C3` Consume Module VII fallback, weak, partial, unsupported-cross-route, missing-evidence, legal-entity absence, entity-type absence, address/location absence, governing-law absence, courts/venue absence, business-context ambiguity, wrapper ambiguity, and thin-footprint states.

`M7.S10.C4` Consume all targeted re-extraction outcomes.

### Applies

`M7.S10.C5` Apply `TP.ID.009`, `TP.JUR.008`, `TP.BIZ.008`, `TP.WRAP.010`, and `TP.LIM.001` through `TP.LIM.008` for `target_profile_limitations` and carry-forward effects.

`M7.S10.C6` Apply controlled limitation status only after targeted field-specific re-extraction, unless the limitation is directly inherited from M6 route status.

### Writes

`M7.S10.C7` Write only `target_profile.target_profile_limitations` inside the main profile.

`M7.S10.C8` Write Module V ledger row type `target_limitation_carry_forward`.

`M7.S10.C9` Write `target_profile_forensics.limitation_ledger` after the main profile is complete.

### Forbidden

`M7.S10.C10` Do not turn limitations into findings, recommendations, legal conclusions, registry triggers, or data-provenance conclusions.

`M7.S10.C11` Do not emit one vague generic limitation paragraph where field-specific limitations exist.

`M7.S10.C12` Do not emit limitation statuses before targeted re-extraction unless the status is directly inherited from M6 route limitation.

---

## M7.S11 — Working Ledger

`M7.S11.C1` Module VII ledger is governed by Module V and projected to `target_profile_forensics` after the material profile is complete.

`M7.S11.C2` Required Module VII ledger row types:

* `fd_row_application_workpad` for selected TP.* rows only;
* `fd_row_reinvestigation`;
* `fd_row_targeted_re_extraction`;
* `fd_row_fallback_or_exclusion`;
* `target_profile_input_check`;
* `target_profile_material_selector_initialization`;
* `target_source_extraction_capsule_initialization`;
* `target_identity_derivation`;
* `target_url_derivation`;
* `target_identity_re_extraction`;
* `target_legal_exception_access`;
* `target_address_or_notice_derivation`;
* `target_governing_law_derivation`;
* `target_courts_venue_derivation`;
* `target_jurisdiction_re_extraction`;
* `target_business_category_derivation`;
* `target_customer_type_derivation`;
* `target_market_type_derivation`;
* `target_industry_sector_derivation`;
* `target_regulated_sector_derivation`;
* `target_business_context_re_extraction`;
* `target_high_level_offering_derivation`;
* `target_primary_public_claim_derivation`;
* `target_wrapper_names_derivation`;
* `target_delivery_model_signal_derivation`;
* `target_wrapper_re_extraction`;
* `target_evidence_mapping`;
* `target_source_extraction_capsule_summary`;
* `target_cross_route_evidence_use`, only if cross-route M6-approved evidence supports an M7 field;
* `target_limitation_carry_forward`;
* `target_profile_forensics_build_check`;
* `target_profile_lock_check`.

`M7.S11.C3` No separate Module VII scratchpad object is authorized inside `target_profile`. The Module V `target_profile_ledger` and the internal Target Source Extraction Capsule are the sole Module VII workpads and must contain final workpad rows for every selected TP.* row mapped in `M7.T1`.

`M7.S11.C4` Non-selected TP.* rows do not require material execution rows. If validator/audit export requires tracking, mark them as `AUDIT_RETIRED_FOR_M7_MATERIAL_OUTPUT`, not `EMITTED`.

`M7.S11.C5` The separate forensic/provenance artifact is `target_profile_forensics`. It is built only after `target_profile` and must not be clumped into `target_profile`.

`M7.S11.C6` No separate Module VII trace object is authorized inside `target_profile`.

`M7.S11.C7` Module V ledger rows must persist through Module XIV.

`M7.S11.C8` Module XIII/M14 may project relevant Module VII ledger rows into final forensic / technical audit sections only after preserving the main/profile separation.

---

## M7.S12 — Lock Gate

`M7.S12.C0A` Module VII lock defects must be classified under `M7.S12.C0B–C0D` and the `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md` Section 8 Repair Routing Matrix.

`M7.S12.C0B` Missing `source_discovery_handoff`, unauthorized cross-route use, unapproved source-material use, unsupported identity substitution, executing all 43 TP.* rows as material output, emitting old ten-field flat output, skipping source extraction, emitting limitation status without targeted re-extraction, clumping main profile and forensics, or emitting feature/data/legal/registry fields is `CRITICAL_BLOCKER`.

`M7.S12.C0C` Missing ledger/provenance for a selected TP.* row, unresolved legal entity name, unresolved entity type, unresolved governing law, unresolved courts/venue, unresolved registered/notice location, incomplete limitation carry-forward, or missing targeted re-extraction row is `REPAIRABLE_FAILURE` unless a safe controlled status is already emitted after re-extraction.

`M7.S12.C0D` Thin public-footprint identity, missing legal entity, missing full address but visible location, missing governing-law detail, missing courts/venue detail, unclear customer type, unclear market type, unclear wrapper, or fallback values may be `PASS_WITH_LIMITATION` if targeted re-extraction was attempted or M6 limitation was inherited and downstream effect is explicit in `target_profile_forensics` and `target_profile_limitations`.

`M7.S12.C1` Lock only if Module VI input exists or controlled failure is preserved.

`M7.S12.C2` Lock only if Module IX `legal_cartography_index` is present or its absence is explicitly limited for legal/jurisdiction fields.

`M7.S12.C3` Lock only if `source_discovery_handoff.bucket_family_index.target_profile_urls.families` and loaded target-family artifacts are present, or their absence triggers repair.

`M7.S12.C4` Lock only if all populated substantive fields are derived through the M7 material selector in `M7.S3`.

`M7.S12.C5` Lock only if M7-A Target Source Extraction Capsule was completed, every M6-approved M7 route received a capsule coverage row, 100% route-family coverage was checked, and the extraction checkpoint was recorded before field application.

`M7.S12.C6` Lock only if every weak, vague, missing, thin, or conflicting field was returned to targeted field-specific re-extraction before a limitation status was assigned, unless the limitation was inherited from M6 route status.

`M7.S12.C7` Lock only if every populated field has supporting source basis recorded in Module V ledger or `target_profile_forensics`, or is a controlled status recorded in limitations and forensics.

`M7.S12.C8` Lock only if all evidence refs in Module V / `target_profile_forensics` resolve to loaded upstream source IDs in the target-family artifacts, inherited M6 family limitations, or M9 legal-cartography entries where legal-family exception is permitted.

`M7.S12.C9` Lock only if cross-route evidence use, if any, is M7-field-relevant and ledgered.

`M7.S12.C10` Lock only if cross-route evidence use did not perform feature profiling, data provenance, legal cartography, registry evaluation, challenge, handoff, report, or terminal work.

`M7.S12.C11` Lock only if legal-family exception use was limited to fields authorized in `M7.S2C`.

`M7.S12.C12` Lock only if legal-family exception use stopped after the relevant field was found, controlled status was assigned, or fallback assigned.

`M7.S12.C13` Lock only if identity and URL fields are populated or controlled field statuses are used.

`M7.S12.C14` Lock only if jurisdiction and notice fields are populated or controlled field statuses are used.

`M7.S12.C15` Lock only if business-context fields are populated or controlled field statuses are used.

`M7.S12.C16` Lock only if wrapper fields are populated or controlled field statuses are used.

`M7.S12.C17` Lock only if wrapper evidence did not decompose into feature mechanics, archetypes, surfaces, data flows, or registry triggers.

`M7.S12.C18` Lock only if Module VII scope-firewall/output-boundary exclusions remain satisfied under `M7.S1C`, `M7.T0`, `GRK.007`, `GRK.008`, `GRK.009`, and `GRK.015`, including absence of operator/controller, primary-product, data/provenance, feature-decomposition, legal-cartography analysis, registry-evaluation, recommendation/report, final-output, terminal leakage, old flat output, and metadata fields inside `target_profile`.

`M7.S12.C19` Lock only if every selected TP.* row from `M7.T1` has a Module V workpad row and/or `target_profile_forensics.field_derivation_ledger` row with `output_field`, `fd_registry_id`, `fd_field_id`, `fd_profile_section`, `fd_mode`, `fd_outcome`, `source_ref`, `source_url` or `source_urls`, re-extraction status where applicable, fallback code where applicable, and `forbidden_inference_check`.

`M7.S12.C20` If any selected TP.* row lacks a final outcome, Module VII must reopen only that row, perform targeted field-specific re-extraction within M6/M9-approved sources, and record `FD_ROW_WORKPAD_GAP` before repair.

`M7.S12.C21` If reinvestigation cannot derive the field, Module VII must resolve the row through controlled status, exclusion, limitation, or conflict outcome before lock. Silent skipping is forbidden.

`M7.S12.C22` Lock only if no selected TP.* row remains `draft`, unattempted, unsupported, or assigned limitation without targeted re-extraction.

`M7.S12.C23` Lock only if `target_profile` contains exactly the parent sections and material fields defined in `M7.S13.C3` and no others.

`M7.S12.C24` Lock only if array fields and limitation lists are valid arrays.

`M7.S12.C25` Lock only if no forbidden old output keys appear inside `target_profile`.

`M7.S12.C26` Lock only if `target_profile` is emitted and saved before `target_profile_forensics`.

`M7.S12.C27` Lock only if `target_profile_forensics` contains the required provenance branches in `M7.S13.C4`.

`M7.S12.C28` If all gates pass, set phase-local lock state to `LOCKED`.

`M7.S12.C29` If usable but limited, set phase-local lock state to `LOCKED_WITH_LIMITATIONS`.

`M7.S12.C30` If unsafe or unusable, set phase-local lock state to `CONTROLLED_FAILURE` or `REPAIR_REQUIRED` as appropriate.

---

## M7.S13 — Output Contract

`M7.S13.C1` Module VII emits `target_profile` first and `target_profile_forensics` second.

`M7.S13.C2` `target_profile` is a clean material Target Profile object. It contains five parent sections and eighteen material field lines. It contains no machine fields, metadata fields, evidence objects, confidence objects, trace objects, ledger objects, extraction capsule, source capsule, or forensic/provenance branches.

`M7.S13.C2A` Any earlier Module VII call-card, input-check, selector, extraction capsule, execution metadata, evidence basis, confidence value, workpad detail, or validation detail must be stored outside `target_profile` in Module V ledger, phase-local gate, validator output, or `target_profile_forensics` only.

`M7.S13.C3` `target_profile` must contain exactly this material structure:

```json id="m7-output-contract"
{
  "target_profile": {
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
}
```

`M7.S13.C4` `target_profile_forensics` must be emitted only after `target_profile` and must contain exactly these provenance branches:

```json id="m7-forensics-contract"
{
  "target_profile_forensics": {
    "source_ledger_used_for_m7": [],
    "target_source_extraction_capsule_summary": [],
    "target_source_route_coverage_ledger": [],
    "field_derivation_ledger": [],
    "targeted_re_extraction_ledger": [],
    "limitation_ledger": [],
    "cross_route_use_ledger": [],
    "validation_quality_control_result": {},
    "runtime_trace_m7_only": {},
    "forensic_boundary": {}
  }
}
```

`M7.S13.C4A` `target_source_route_coverage_ledger[]` must summarize the M7-A route-family coverage rows and prove that every M6-approved M7 route was reviewed before field application. It must be emitted only inside `target_profile_forensics`, never inside `target_profile` and never before the main profile.

`M7.S13.C4B` Any row inside `target_profile_forensics` that cites a `*.SRC.NNN` source reference must include a matching `source_url` or `source_urls`. Source IDs and URLs must be copied from the same loaded upstream source object; source-ID relabeling is a controlled failure.

`M7.S13.C5` Apply `M7.T0`, `M7.S1C`, `GRK.006`, `GRK.007`, `GRK.008`, `GRK.009`, `GRK.015`, and `GRK.016` to the Module VII output boundary. Module VII must emit only `target_profile` and separate `target_profile_forensics`; operator/controller fields, `primary_product`, data-processing/provenance fields, commercial-motion/language/pipeline/question branches, downstream profile objects, registry/legal/data/feature objects, final-handoff/HTML/report/recommendation branches, aliases, compatibility wrappers, and extra output keys are forbidden.

`M7.S13.C6` The following keys are specifically forbidden inside `target_profile`: `profile_meta`, `lock_status`, `website`, `primary_url`, `legal_name`, `registered_or_notice_address`, `governing_jurisdiction`, `business_model`, `market_context`, `parent_affiliate_relationship`, `identity_confidence`, `identity_evidence_basis`, `jurisdiction_confidence`, `jurisdiction_evidence_basis`, `business_context_confidence`, `business_context_evidence_basis`, `wrappers`, `evidence_map`, `source_refs`, `trace`, `forensic_ledger`, `scratchpad`, `target_profile_forensics`, `source_ledger`, `field_derivation_ledger`, `targeted_re_extraction_ledger`, `validation_quality_control_result`, and any old ten-field flat M7 key not expressly retained in `M7.S13.C3`.

`M7.S13.C7` Main output may show a controlled field status in a field value when the value cannot be confirmed after the required extraction/re-extraction loop. The detailed proof of that status must be recorded in `target_profile_forensics`, not inside the main profile.
