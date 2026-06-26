# 00_VALIDATOR_RULES_INTEGRATED
## Agent 2 Sequential Validation Contract

---

# VALIDATOR LOCK

`VAL.RUNTIME.C1` This file is the final Agent 2 validation overlay. It supports the module-local validators inside M7 and M8. It does not replace them.

`VAL.RUNTIME.C2` Agent 2 must execute M7 and M8 separately. A single model response containing all four Agent 2 artifacts is invalid.

`VAL.RUNTIME.C3` The backend supports the agent packet. The backend must not merge M7 and M8, compress their outputs into one call, or delay M7 saving until after M8.

`VAL.RUNTIME.C4` Validation is sequential: validate M7 first, save M7 artifacts, then validate M8, save M8 artifacts, then perform the Agent 2 aggregate lock check.

---

# SECTION 1 — UNIVERSAL AGENT 2 GATES

`VAL.S1.C1` Required runtime packet: `AGENT2_RUNTIME_BINDING_PACKET.yaml`.

`VAL.S1.C2` Required active agent id: `agent_2_target_feature`.

`VAL.S1.C3` Allowed modules only: `M7_TARGET_PROFILE` and `M8_TARGET_FEATURE_PROFILE`.

`VAL.S1.C4` Forbidden modules: M6, M9, M10, M11, M12, M13, M14.

`VAL.S1.C5` Forbidden writes: `source_discovery_handoff`, `legal_cartography_index`, `target_data_provenance_profile`, `target_exposure_profile`, `operator_challenge_gate`, `final_output_handoff`, `renderer_payload`, registry rows, legal-risk findings, privacy-readiness findings.

`VAL.S1.C6` Required Agent 2 save order:

```text
target_profile
target_profile_forensics
target_feature_profile
target_feature_profile_forensics
```

`VAL.S1.C7` `target_profile` and `target_feature_profile` are material outputs. They must not contain source ledgers, extraction capsules, field derivation ledgers, forensic branches, trace objects, scratchpads, profile metadata, lock status, or validation status.

`VAL.S1.C8` Forensics/provenance must live only in `target_profile_forensics` and `target_feature_profile_forensics`.

`VAL.S1.C9` Every emitted `*.SRC.NNN` source reference in any forensic row must include exact upstream `source_url` or `source_urls` copied from the loaded family artifact.

---

# SECTION 2 — REQUIRED INPUTS

## 2.1 Agent 1 Outputs Required by Agent 2

`VAL.S2.C1` Validate that Agent 2 receives locked Agent 1 outputs:

```text
source_discovery_handoff
legal_cartography_index
```

`VAL.S2.C2` `source_discovery_handoff` must contain the live family index:

```text
source_discovery_handoff.bucket_family_index.target_profile_urls.families
source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families
```

`VAL.S2.C3` Do not require legacy `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, or `source_coverage_gates` branches. They are not required by the live family-artifact system.

## 2.2 M7 Live Inputs

`VAL.S2.C4` M7 must use:

```text
lossless_family__T0_ROOT
lossless_family__T1_IDENTITY
lossless_family__T2_LEGAL_IDENTITY
lossless_family__T3_OPERATOR_ENTITY
lossless_family__T4_SUPPORTING_IDENTITY
```

`VAL.S2.C5` M7 may use `legal_cartography_index` narrowly for legal entity, entity type, registered/notice location, governing law, courts/venue, and legal-notice identity.

## 2.3 M8 Live Inputs

`VAL.S2.C6` M8 must use saved M7 outputs:

```text
target_profile
target_profile_forensics
```

`VAL.S2.C7` M8 must use:

```text
lossless_family__P1_PRODUCT
lossless_family__P2_PLATFORM_FEATURE_SOLUTION
lossless_family__P3_AI_CAPABILITY_TECHNICAL
lossless_family__P4_USE_CASE_INDUSTRY
lossless_family__P5_ENTERPRISE_PRICING
```

`VAL.S2.C8` M8 must use `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` for archetype and surface derivation.

---

# SECTION 3 — M7 VALIDATION GATES

`VAL.M7.C1` M7 must emit `target_profile` first and `target_profile_forensics` second.

`VAL.M7.C2` M7 must complete the extraction checkpoint before field application:

```text
PHASE EXTRACTION COMPLETE: TARGET_PROFILE_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED
```

`VAL.M7.C3` M7 must review 100% of the M7 route universe derived from `source_discovery_handoff.bucket_family_index.target_profile_urls.families` and the loaded T-family artifacts.

`VAL.M7.C4` M7 field application may begin only after the Target Source Extraction Capsule locks.

`VAL.M7.C5` `target_profile` must contain exactly five parent sections:

```text
target_identity
jurisdiction_notice
business_context
product_service_wrapper
target_profile_limitations
```

`VAL.M7.C6` `target_profile` must contain the locked eighteen material field lines defined in M7.

`VAL.M7.C7` `target_profile` must not contain `profile_meta`, `lock_status`, `validation_status`, `target_profile_forensics`, `source_ledger`, `field_derivation_ledger`, `trace`, `scratchpad`, feature fields, data fields, registry fields, legal-risk fields, or final handoff fields.

`VAL.M7.C8` `target_profile_forensics` must exist only after `target_profile` and must contain the proof branches required by M7, including source ledger, extraction capsule summary, route coverage ledger, field derivation ledger, targeted re-extraction ledger, limitation ledger, cross-route use ledger, validation/QC result, runtime trace, and forensic boundary.

`VAL.M7.C9` Every populated M7 material field must map to a selected TP.* field derivation row or controlled field status.

`VAL.M7.C10` M7 must stop and repair M7 only if it returns `REPAIR_REQUIRED` or `REINVESTIGATE_REQUIRED`. M8 must not start.

---

# SECTION 4 — M8 VALIDATION GATES

`VAL.M8.C1` M8 may start only after `target_profile` and `target_profile_forensics` have been saved.

`VAL.M8.C2` M8 must emit `target_feature_profile` first and `target_feature_profile_forensics` second.

`VAL.M8.C3` M8 must complete the extraction checkpoint before PA application:

```text
PHASE EXTRACTION COMPLETE: PRODUCT_ACTIVITY_SOURCE_CAPSULE 100% ROUTE FAMILY COVERAGE CHECKED
```

`VAL.M8.C4` M8 must review 100% of the Product / Activity route universe derived from `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families` and loaded P-family artifacts.

`VAL.M8.C5` M8 must not treat route labels, nav labels, product names, API names, model names, pricing tiers, or slogans as activities without mechanics proof.

`VAL.M8.C6` `target_feature_profile` must contain exactly:

```text
activities
profile_level_limitations
```

`VAL.M8.C7` Each emitted activity must contain exactly the locked 12 material keys:

```text
activity_reference
product_service_wrapper
activity_feature_name
activity_candidate_summary
mechanics_proof
autonomy_human_control_signal
data_content_object_touched
external_internal_action_signal
archetype_codes
archetype_proof
surface_context_tokens
surface_proof_and_routing_limits
```

`VAL.M8.C8` `target_feature_profile` must not contain source URLs, evidence quotes, source ledgers, confidence scores, derivation ledgers, extraction fragments, route coverage ledgers, debug notes, validation logs, extraction capsule, chain-of-thought, or forensic material.

`VAL.M8.C9` Every emitted activity must have mechanics proof and at least one evidence-supported archetype code.

`VAL.M8.C10` Archetype codes are closed and must be only:

```text
UNI, DOE, JDG, CMP, CRT, RDR, ORC, TRN, SHD, OPT, MOV
```

`VAL.M8.C11` Surface tokens are closed and must be only:

```text
Consumer-Public, Enterprise-Private, PII, Employment, Sensitive/Biometric, Financial, Content&IP, Safety&Physical, Infrastructure, Minors
```

`VAL.M8.C12` Do not invent, alias, pluralize, rename, normalize, translate, split, merge, or approximate archetypes or surfaces.

`VAL.M8.C13` Every emitted activity must be tested against all 11 locked archetype codes and all 10 locked surface tokens using `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml`.

`VAL.M8.C14` `target_feature_profile_forensics` must contain the proof branches required by M8, including product/activity source route coverage, extraction capsule summary, candidate admission/omission ledger, selected PA field derivation ledger, activity mechanics derivation ledger, archetype derivation ledger, surface token derivation ledger, targeted re-extraction ledger, activity limitations ledger, cross-route use ledger, validation/QC result, runtime trace, and forensic boundary.

`VAL.M8.C15` Every emitted archetype and surface token must have a matching forensic derivation row. The matching row must contain source custody and exact source URL where the derivation is evidence-supported.

`VAL.M8.C16` M8 must stop and repair M8 only if it returns `REPAIR_REQUIRED` or `REINVESTIGATE_REQUIRED`. Agent 2 must not lock and must not hand off to M10.

---

# SECTION 5 — AGENT 2 FINAL LOCK VALIDATION

`VAL.A2.C1` Agent 2 may lock `M7_M8` only after all four artifacts exist and were saved in order:

```text
target_profile
target_profile_forensics
target_feature_profile
target_feature_profile_forensics
```

`VAL.A2.C2` Agent 2 may lock only if M7 passed and M8 passed, or passed with limitations that are recorded and safe for M10/M11 downstream use.

`VAL.A2.C3` Agent 2 must not lock if any M7/M8 artifact contains upstream artifacts, downstream artifacts, registry evaluations, legal-risk findings, privacy-readiness findings, renderer payloads, terminal report payloads, or final handoff objects.

`VAL.A2.C4` Agent 2 terminal receipt may include the next-agent command only after the final Agent 2 validation gate passes.

`VAL.A2.C5` If any gate fails, return `REPAIR_REQUIRED` with the smallest repair scope: M7 only, M8 only, or upstream Agent 1 repair. Do not silently proceed.
