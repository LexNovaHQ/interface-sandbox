# 00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED

## Agent 5 / M11 Package-Scoped Semantic Validator Contract

## VALIDATOR VERSION

```text
AGENT5_PACKAGE_SCOPED_SEMANTIC_VALIDATOR_v1
```

This validator governs Agent 5 semantic batch execution after CO-7. It supersedes older AI-only, 98-row, L1-L6, eight-row, and cross-package-union language.

## RUNTIME INPUT GATE

Agent 5 may use only the active Phase 2G packet and its own current Phase 10 checkpoints.

Required routed authorities include:

```text
phase_routing_manifest
phase_route_runtime_packet
legal_cartography_index
legal_signal_derivation_profile
admitted 2F legal/governance primary evidence
admitted legal_doc_* artifacts
target_profile
domain_derivation_profile
target_feature_profile
active_run_package_manifest
current Phase 7 data-provenance material admitted by the route
active_threat_registry_manifest
exposure_registry_route_plan
```

Forbidden inputs include:

```text
target_profile_forensics
target_feature_profile_forensics
dap_forensics_profile
any preceding profile forensics
lossless_family__*
retired M10/4B/4C artifacts
source outside the active 2F packet
alternate route maps
free-corpus scans
```

Missing preceding forensic artifacts are never blockers.

## REGISTRY AND EXECUTION IDENTITY GATE

Validate:

- registry selection comes from `domain_derivation_profile`;
- `active_run_package_manifest` is consistency-check only;
- every mounted registry is declared by `THREAT_REGISTRY_BINDINGS_v1.yaml`;
- global deterministic identity is `registry_row_key = <package_id>::<Threat_ID>`;
- canonical `Threat_ID` is preserved;
- `registry_row_key` is never model-authored;
- all active checkpoints carry the current Phase 10 execution fingerprint.

## PHASE 5 CLASSIFICATION GATE

Validate that Phase 10 projects only:

```text
target_feature_profile.activities[].primary_classification
target_feature_profile.activities[].overlay_classifications[]
```

Reject flat activity-level classification paths.

Every mounted primary or overlay stream must have a matching non-empty package-scoped Phase 5 classification inventory. Reject missing overlay classification, package escape, source-type mixing, or a global cross-package archetype union.

## ROUTE PLAN GATE

`exposure_registry_route_plan` must reconcile dynamically against:

```text
active_threat_registry_manifest.expected_registry_row_key_count
```

Validate:

- one route row per expected `registry_row_key`;
- separate primary and overlay stream plans;
- every UNI row is `EVALUATION_ROUTED` with `UNI_ALWAYS_RUN`;
- every non-UNI routed row has `PACKAGE_ARCHETYPE_MATCH` against its own package inventory;
- non-matching non-UNI rows are `NOT_TRIGGERED_NOT_APPLICABLE`;
- surface-only routing is forbidden;
- route rows from different packages or streams are never merged.

No fixed 98-row assumption is permitted.

## BATCH PLAN GATE

Every semantic batch must contain exactly one package, one stream, and one archetype group.

Validate:

- `1 <= row_count <= 15`;
- package mixing is forbidden;
- primary/overlay stream mixing is forbidden;
- archetype-group mixing is forbidden;
- packet-size ceiling is satisfied;
- no registry or evidence content was truncated to satisfy the ceiling;
- `expected_registry_row_keys[]` are unique and belong to the batch package;
- canonical `expected_threat_ids[]` are unique within the batch;
- every routed registry row key appears in exactly one batch;
- no non-routed registry row key appears in a batch.

## SEMANTIC PACKET GATE

The packet must declare:

```text
semantic_packet_contract_version = M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1
```

Validate exact equality among:

```text
row_count
registry_rows.length
expected_registry_row_keys.length
expected_threat_ids.length
```

The model may read deterministic custody metadata but cannot emit or alter it.

## MODEL OUTPUT ROOT GATE

The semantic model must return exactly one root:

```text
m11_batch_registry_ledger
```

The ledger must declare:

```text
semantic_contract_version = M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1
```

The following echoed fields must exactly match the packet:

```text
batch_id
batch_group
stream_id
stream_type
package_id
source_domain
expected_threat_ids[]
```

`returned_threat_ids[]` must equal `expected_threat_ids[]` exactly and in order.

## SEMANTIC ROW GATE

`batch_registry_ledger[]` must contain exactly one row per expected canonical Threat ID and no other row.

Allowed row keys are only:

```text
Threat_ID
trigger_status
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
applied_fp_mechanism
row_limitations
status_inputs
```

`trigger_status` is optional and non-authoritative.

Reject model rows containing:

```text
registry_row_key
Threat_Name
package_id
source_domain
stream_id
stream_type
Archetype
Subcategory
Surface
authority_anchors
pain fields
remediation
review_route
route
route_reason
evaluation_status
profile placement
```

## STATUS INPUT GATE

Each row must contain exactly these keys:

```text
target_match_present
hunter_conditions_met
trigger_if_met
exclude_if_met
visible_control_present
visible_control_defeats_or_reduces_exposure
evidence_sufficient
public_evidence_limitation
false_positive_concern
```

Every value must be lower-case `yes`, `no`, or `partial`.

## NARRATIVE QUALITY GATE

These fields must be non-empty concise narrative text and cannot be only a scalar label:

```text
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
row_limitations
```

`basis_proof` must apply the parsed Hunter Trigger condition by condition and identify the supplied evidence used.

Reject unsupported jurisdiction, deployment, user-flow, control, exclusion, or applicability claims.

Phase 5 classification, route reason, package selection, registry status, legal-cartography metadata, or domain-control-obligation context cannot independently prove a Hunter Trigger.

Lossless legal/governance evidence is primary evidence. Legal cartography is the mandatory navigation map. Recorded index-gap navigation inside the same routed bucket is not fallback evidence.

## REPAIR GATE

Repair uses:

```text
M11_PACKAGE_SCOPED_SEMANTIC_REPAIR_v1
```

One repair pass may change only identified semantic fields. It must return the complete ledger for all expected Threat IDs and preserve immutable batch metadata.

After one repair pass:

- unresolved non-structural uncertainty becomes a limitation;
- exact-root, exact-coverage, identity, package/stream, schema, or unusable-output failures remain blocking.

## BACKEND ACCEPTED-BATCH GATE

The backend, not the model, maps canonical Threat IDs to deterministic `registry_row_key` values and assembles the full material row.

The full material row contains 19 fields:

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

Allowed final material statuses remain:

```text
TRIGGERED
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

The model must never be treated as author of deterministic spine fields or final status.

## DYNAMIC FINALIZATION GATE

Workpad and forensic coverage must reconcile against the mounted registry manifest and compound row-key inventory, not a fixed 98-row count.

The stable artifact token `exposure_registry_workpad_98` may remain for compatibility, but its metadata and validation are dynamic.

LEP coverage remains governed separately by the locked 22-row field-derivation registry.

## OUTPUT FIREWALL

Reject model output containing backend artifacts, validation artifacts, workpads, profiles, forensics, challenge gates, compiler output, renderer output, report prose, legal verdicts, compliance verdicts, liability findings, breach findings, enforceability conclusions, security-adequacy conclusions, transfer-legality conclusions, or risk scores.