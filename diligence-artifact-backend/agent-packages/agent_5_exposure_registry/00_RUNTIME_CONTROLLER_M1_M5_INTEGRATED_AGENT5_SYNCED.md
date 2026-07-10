# Agent 5 Runtime Controller — Phase 9 Exposure Profile

## Runtime authority

This file governs `agent_5_exposure_registry` only for `M11_EXPOSURE_REGISTRY`.

The backend Phase 2G route packet is the sole runtime read authority. Prompt text cannot add an artifact, root, index, profile, or forensic input that Phase 2G did not deliver.

```text
routing_authority: P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY
route_id: ROUTE.PHASE9.EXPOSURE_PROFILE
bucket_id: 2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS
delivery_mode: SOURCE_BUCKET_PROFILE
```

The 2F route is forward-owned by Phase 9 / M11. M9 builds `legal_cartography_index` and `legal_signal_derivation_profile`; M9 is not the downstream route owner.

Lossless legal/governance evidence is primary evidence. `legal_cartography_index` and `legal_signal_derivation_profile` are mandatory navigation and bounded signal authorities into that evidence. Direct lossless evidence is not a fallback.

## Allowed runtime inputs

M11 may use only the artifacts delivered by the active 2G packet:

- `legal_cartography_index`
- `legal_signal_derivation_profile`
- the 2F legal/governance primary lossless evidence bucket, including admitted `legal_doc_*` artifacts
- `target_profile`
- `domain_derivation_profile`
- `feature_candidate_inventory`
- `target_feature_profile`
- Phase 7 Layer 4 DAP material artifacts
- `dap_semantic_batch_validation_manifest`
- `data_provenance_profile_semantic_batch_gate`
- `domain_selection_profile`
- `active_run_package_manifest`
- M11’s own saved route, batch, validation, workpad, projection, and forensic artifacts when resuming checkpoints

## Forbidden runtime inputs

M11 must not read or require:

- `target_profile_forensics`
- `target_feature_profile_forensics`
- `dap_forensics_profile`
- any preceding profile forensic artifact
- retired M10/4B/4C artifacts
- `lossless_family__*`
- any source outside the 2F packet
- any alternate route map or free-corpus scan

Missing preceding forensic artifacts are never blockers for M11.

## Execution ownership

M11 uses three layers:

1. deterministic backend registry spine, route plan, batch plan, and packet formation;
2. semantic active-batch evidence application;
3. deterministic validation, final status, accepted-batch save, 98-row workpad merge, controlled/triggered projection, and forensic assembly.

The M11 model may return semantic evidence-application rows only. It must not route threats, select batches, rewrite registry spine fields, choose final material status, save artifacts, merge profiles, assemble forensics, perform M12 global challenge, compile, render, or write report prose.

## Material row contract

Every accepted material row carries these 19 fields:

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

## Save order

```text
1. exposure_registry_route_plan
2. per planned batch: deterministic validation, validation save, accepted batch save
3. exposure_registry_workpad_98
4. exposure_registry_controlled_profile
5. exposure_registry_triggered_profile
6. exposure_registry_profile_forensics
```

`exposure_registry_profile_forensics` is an M11 audit side output. M12 does not require or read it.

## M12 boundary

M12 global challenge belongs to `agent_7_m12`, not Agent 5. It receives a separate Phase 2G `DERIVED_ONLY` packet containing M11 material outputs and dynamic batch validations. M11 must not emit `challenge_gate`.

Stop after the M11 artifacts lock.
