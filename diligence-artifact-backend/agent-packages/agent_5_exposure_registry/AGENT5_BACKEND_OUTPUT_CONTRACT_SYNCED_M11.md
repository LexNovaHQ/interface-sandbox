# AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11
## Backend Output Contract — M11 Threat_Name + Subcategory Material Row Upgrade

# CONTRACT LOCK

Agent 5 / M11 remains phased and batched. Each boundary emits or saves exactly one declared artifact family.

Public/report wording normalization is outside M11 scope. M11 emits auditable material rows only.

# THREE-LAYER OWNERSHIP

## Layer 1 — deterministic backend prefill

Backend owns registry/reference load, schema validation, route plan, batch plan, evidence packet formation, deterministic registry spine prefill, accepted-batch save, workpad merge, material projection, and forensics.

Backend-prefilled registry spine fields:

```text
Threat_ID
Threat_Name
Archetype
Subcategory
Surface
authority_anchors
Pain_Tier
Pain_Depth
Pain_Category
Legal_Pain
base registry FP_Mechanism
registry remediation source from Lex_Nova_Fix
review_route default
parsed Hunter_Trigger
route reason
batch membership
```

`Threat_Name` is mandatory. It comes from `AI_THREAT_REGISTRY.Threat_Name` and the model must not rewrite it.

`Subcategory` is code-only inside M11. Display labels are normalizer/compiler scope only. Known legacy `FIN` is normalized to `LIA` as a non-blocking registry-drift warning because the registry key folds financial-agent commitment into the liability harm mechanism.

The M11 model must not rewrite this spine.

## Layer 2 — semantic M11 active-batch evidence application

Each M11 model call evaluates one active batch only.

The model returns only:

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

The model must not assemble the final material row, choose final profile placement, emit `Threat_Name`, normalize `Subcategory`, or normalize public wording.

## Layer 3 — deterministic final status and projection

Backend assembles the full material row, derives final evaluation status, saves accepted batches, merges the 98-row workpad, and projects controlled/triggered profiles.

Allowed final material statuses:

```text
TRIGGERED
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

# ROUTING CONTRACT

UNI rows are evaluation-routed. Non-UNI rows may be evaluation-routed only when registry Archetype intersects active M8 archetypes. Surface is context only and must never independently route a non-UNI row.

# PHASE B MODEL OUTPUT CONTRACT

Each M11 model call returns exactly one `m11_batch_registry_ledger` root with one semantic row per expected Threat_ID.

Semantic row shape:

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

`returned_threat_ids[]` must equal `expected_threat_ids[]` exactly. Grouped, duplicate, composite, category, or unexpected Threat_ID rows are forbidden.

# FULL MATERIAL ROW CONTRACT

Accepted batch/workpad/material projection rows are assembled by backend from deterministic spine + semantic evidence application + deterministic final status.

Full material row fields:

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

Material row field count: `19`.

# CONTROLLED/TRIGGERED PROJECTION CONTRACT

`exposure_registry_controlled_profile` may contain only `controlled_rows` at top level.

Controlled profile includes only:

```text
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

`exposure_registry_triggered_profile` may contain only `triggered_rows` at top level.

Triggered profile includes only:

```text
TRIGGERED
```

Both profiles emit the full 19-field material row contract.

# SAVE ORDER

```text
1. exposure_registry_route_plan
2. for each batch: M11 semantic ledger -> validation -> deterministic status/fp discipline -> accepted batch save
3. exposure_registry_workpad_98
4. exposure_registry_controlled_profile
5. exposure_registry_triggered_profile
6. exposure_registry_profile_forensics
7. M12 global challenge may begin
```

# LEGACY OUTPUT PROHIBITION

Do not emit old combined material roots, old seven-field material rows, or old eighteen-field material rows without `Threat_Name` as the production contract.
