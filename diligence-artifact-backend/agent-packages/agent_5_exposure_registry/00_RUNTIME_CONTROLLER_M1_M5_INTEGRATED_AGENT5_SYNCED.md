# Agent 5 Runtime Controller — Phase 10 Exposure Profile

## Runtime authority

This file governs `agent_5_exposure_registry` only for `M11_EXPOSURE_REGISTRY`.

The backend Phase 2G route packet is the sole runtime read authority. Prompt text cannot add an artifact, root, index, profile, forensic input, package, or registry that Phase 2G did not deliver.

```text
routing_authority: P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY
route_id: ROUTE.PHASE10.EXPOSURE_PROFILE
bucket_id: 2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS
delivery_mode: SOURCE_BUCKET_PROFILE
```

Lossless legal/governance evidence is primary evidence. `legal_cartography_index` and `legal_signal_derivation_profile` are mandatory navigation and bounded-signal authorities into that evidence. Direct lossless evidence is not a fallback.

## Allowed runtime inputs

M11 may use only artifacts delivered by the active Phase 2G packet:

- `phase_routing_manifest` and `phase_route_runtime_packet`;
- `legal_cartography_index` and `legal_signal_derivation_profile`;
- admitted 2F legal/governance primary evidence, including admitted `legal_doc_*` artifacts;
- `target_profile`;
- `domain_derivation_profile`;
- `feature_candidate_inventory`;
- `target_feature_profile`;
- current Phase 7 data-provenance material admitted by the route;
- `active_run_package_manifest`;
- `domain_control_obligation_profile` where admitted as contextual handoff;
- M11’s own current fingerprint-matching checkpoints.

## Forbidden runtime inputs

M11 must not read or require:

- `target_profile_forensics`;
- `target_feature_profile_forensics`;
- `dap_forensics_profile`;
- any preceding profile forensic artifact;
- retired M10/4B/4C artifacts;
- `lossless_family__*`;
- any source outside the active Phase 2G packet;
- any alternate route map or free-corpus scan.

Missing preceding forensic artifacts are never blockers.

## Execution ownership

M11 uses three layers:

1. deterministic backend selection, registry loading, Phase 5 classification inventory projection, package-scoped routing, maximum-15 batching, evidence packet assembly, and deterministic spine prefill;
2. semantic active-batch evidence application under `M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1`;
3. deterministic validation, compound-key reconciliation, final status, accepted-batch save, dynamic workpad merge, controlled/triggered projection, and forensic assembly.

The M11 model may return semantic evidence-application rows only. It must not select packages or registries, classify activities, route rows, choose streams or batches, emit `registry_row_key`, rewrite deterministic fields, choose final status, save artifacts, merge profiles, assemble forensics, perform M12 global challenge, compile, render, or write report prose.

## Package-scoped batch boundary

Every semantic call contains exactly one:

```text
package_id
stream_id
stream_type
batch_group
```

The batch contains one to fifteen rows and remains within the packet ceiling. Package mixing, primary/overlay mixing, and archetype-group mixing are forbidden.

Canonical `Threat_ID` is the model-visible identity. Global backend custody uses `registry_row_key = <package_id>::<Threat_ID>`.

## Semantic contracts

```text
packet: M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1
output: M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1
repair: M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1
validator: AGENT5_PACKAGE_SCOPED_SEMANTIC_VALIDATOR_v1
adapter: AGENT5_PACKAGE_SCOPED_OUTPUT_ADAPTER_v1
```

The only model output root is:

```text
m11_batch_registry_ledger
```

## Material row contract

Every backend-accepted material row carries 19 fields:

```text
Threat_ID
Threat_Name
target_match
evaluation_status
basis_proof
control_exclusion_evaluation
evidence_source_basis
fp_mechanism
Archetype
Subcategory
Surface
authority_anchors
Pain_Tier
Pain_Depth
Pain_Category
Legal_Pain
remediation
review_route
row_limitations
```

Allowed final material statuses:

```text
TRIGGERED
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

Plain `CONTROLLED` is forbidden.

## Backend custody order after CO-8

```text
1. active_threat_registry_manifest
2. exposure_registry_route_plan
3. per planned package-scoped batch:
   a. semantic ledger
   b. batch validation
   c. accepted batch save
4. exposure_registry_workpad_98 with dynamic registry coverage
5. exposure_registry_controlled_profile
6. exposure_registry_triggered_profile
7. exposure_registry_profile_forensics
```

`exposure_registry_profile_forensics` is an M11 audit side output. M12 does not require or read it.

## Current build boundary

CO-7 semantic package redesign is ready. CO-8 remains required to activate the domain-agnostic Layer 2 runtime.

Until CO-8 is complete:

```text
current_runtime_model_call_allowed: false
stop_after_package_scoped_route_plan: true
```

## M12 boundary

M12 global challenge belongs to `agent_7_m12`, not Agent 5. M11 must not emit `challenge_gate`.
