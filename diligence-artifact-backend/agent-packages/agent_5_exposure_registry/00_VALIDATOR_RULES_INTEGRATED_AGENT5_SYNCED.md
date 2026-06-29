# 00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED
## Agent 5 / M11 Three-Layer Material Row Validator Contract

# VALIDATOR LOCK

This validator governs Agent 5 / M11 package execution after the three-layer material row upgrade.

If this validator conflicts with older seven-field language, this validator controls for Agent 5 material-row validation.

# REQUIRED INPUT AND ACCESS GATES

Validate that Agent 5 receives or can load:

```text
source_discovery_handoff
legal_cartography_index
target_profile
target_profile_forensics
target_feature_profile
target_feature_profile_forensics
data_provenance_profile
data_provenance_profile_forensics
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
AI_THREAT_REGISTRY.yaml
REGISTRY_KEY_v3_0.md
03_REGISTRY_EVALUATION_RULES.yaml
FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml
FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml
```

Agent 5 must not mutate or backfill upstream M6, M7, M8, M9, or M10 artifacts.

# M9 LEGAL CARTOGRAPHY CONSUMPTION GATE

Validate that `legal_cartography_index` is consumed as the saved M9 artifact. Reject any Agent 5 output that builds, rebuilds, saves, mutates, replaces, or renames legal cartography.

Evidence use must follow this chain:

```text
M9 navigation/custody -> full lossless L1-L6 unit or locked upstream proof -> row evidence basis
```

M9 silence is not evidence absence. If M9 is silent or thin, backend may supply closest relevant full lossless section/part. Blind L1-L6 bucket scanning remains forbidden.

# ROUTE PLAN AND BATCH PLAN GATE

`exposure_registry_route_plan` must account for all 98 active Threat_IDs exactly once.

Every UNI row must be `EVALUATION_ROUTED` with route reason `UNI_ALWAYS_RUN`.

Non-UNI rows may be routed only by active M8 archetype intersection. Surface-only routing is forbidden.

Every model-routed batch must contain max 8 rows. Reject grouped, composite, duplicate, missing, unexpected, or category Threat_ID route rows.

# ACTIVE BATCH MODEL OUTPUT GATE

M11 model batch output must have exactly one root:

```text
m11_batch_registry_ledger
```

Batch `returned_threat_ids[]` must match backend-provided `expected_threat_ids[]` exactly.

`batch_registry_ledger[]` must contain exactly one row per expected Threat_ID and no other rows.

Each semantic batch row may contain only:

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

Model batch rows must not emit deterministic registry spine fields, final material profiles, workpad, forensics, M12 validation, challenge gate, final handoff, renderer, report prose, or terminal receipts.

# STATUS INPUT GATE

Each semantic row must include `status_inputs` sufficient for backend final status derivation:

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

# M12 BATCH VALIDATION / ACCEPTED BATCH GATE

Batch validation artifact must exist before accepted batch artifact.

Batch validation status must be PASS or PASS_WITH_LIMITATION before accepted batch is saved.

M11 model output must not simulate M12 batch validation or claim save/acceptance state.

# FULL MATERIAL ROW GATE

Backend-assembled accepted batch/workpad/material projection rows must contain the full material row contract:

```text
Threat_ID
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

The model must not be treated as the author of deterministic registry spine fields.

# FINAL STATUS GATE

Final material `evaluation_status` must be one of:

```text
TRIGGERED
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

# SPLIT MATERIAL OUTPUT GATES

`exposure_registry_controlled_profile` must contain exactly one top-level key:

```text
controlled_rows
```

Controlled rows must have one of:

```text
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

`exposure_registry_triggered_profile` must contain exactly one top-level key:

```text
triggered_rows
```

Triggered rows must have:

```text
TRIGGERED
```

Both controlled and triggered rows must use the full material row contract.

# FORENSIC GATE

Forensics must prove 98/98 row coverage, 22/22 LEP coverage, accepted batch + validation custody, deterministic registry spine prefill, semantic evidence application, backend-derived final status, controlled/triggered projection reconciliation, and M9 legal-cartography consumption without rebuild.

Forensics must not re-emit material profiles, challenge gate, final handoff, renderer payload, report prose, or terminal receipts.

# FIREWALL

Reject final findings that use legal verdict language, compliance verdicts, liability findings, breach findings, enforceability verdicts, transfer-legality conclusions, security-adequacy conclusions, risk scores, or high/low risk verdict labels.
