# MODULE XI — REGISTRY HANDSHAKE AND EXPOSURE PROFILE
## Three-Layer M11 Contract

# LOCK

M11 remains batched. The model evaluates only the active batch supplied by backend.

M11 uses three layers:

1. deterministic backend registry spine and packet formation;
2. semantic model evidence application for the active batch;
3. deterministic backend final status, workpad merge, projection, and forensics.

Public/report wording normalization is outside M11 scope.

# LAYER 1 — DETERMINISTIC BACKEND

Backend owns:

```text
registry load
registry validation
Threat_ID decomposition validation
M9 navigation consumption
route plan
batch plan
evidence packet formation
registry spine prefill
```

Registry spine fields are backend-owned:

```text
Threat_ID
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

The model must not rewrite these fields.

# LAYER 2 — SEMANTIC MODEL

The model owns only active-batch evidence application:

```text
target_match
basis_proof
control_exclusion_evaluation
evidence_source_basis
applied_fp_mechanism
row_limitations
status_inputs
```

The model applies the exact Hunter Trigger to admitted target, product, data, and governance evidence.

The model must not route rows, batch rows, save artifacts, validate as M12, merge the workpad, project material profiles, assemble forensics, choose profile placement, or normalize public wording.

# LAYER 3 — DETERMINISTIC FINALIZATION

Backend owns:

```text
pre-save discipline
final material status derivation
full material row assembly
accepted batch save
98-row workpad merge
controlled projection
triggered projection
forensic assembly
```

Allowed final material statuses:

```text
TRIGGERED
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

# ROUTING

Route values:

```text
EVALUATION_ROUTED
NOT_TRIGGERED_NOT_APPLICABLE
```

Route reasons:

```text
UNI_ALWAYS_RUN
ARCHETYPE_TRIGGERED
INT_NOT_TRIGGERED_NOT_APPLICABLE
```

Surface-only routing is forbidden. Surface is context only.

# M9 EVIDENCE DISCIPLINE

M9 is navigation and custody authority. M9 is not proof by itself except for rows about document presence, absence, custody, navigation, or limitation.

For trigger/control proof, M11 must bind to full lossless text, locked upstream proof, or formal limitation.

M9 silence is not evidence absence. If M9 is silent or thin, backend may supply closest relevant full lossless section or part from loaded evidence.

# REGISTRY CANON

M11 treats these registry keys as source authority:

```text
Threat_ID
Threat_Name
Lane
Archetype
Surface
Authority_IN
Authority_EU
Authority_US
Velocity
Pain_Tier
Pain_Category
Pain_Depth
Status
Effective_Date
Legal_Pain
FP_Mechanism
FP_Impact
Lex_Nova_Fix
Hunter_Trigger
Provenance
FIELD21
FIELD22
FIELD23
```

FIELD21 is archetype/scope. FIELD22 is subcategory. FIELD23 is variant.

Hunter_Trigger plus registry evaluation rules are the row-level derivation authority.

# MATERIAL ROW CONTRACT

Controlled and triggered material profiles use the same full row schema:

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

The full row is assembled by backend from deterministic spine plus semantic evidence application plus deterministic final status.

# PHASE B MODEL ROW

The model returns exactly one semantic row per expected Threat_ID:

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

No extra rows. No grouped rows. No profile containers.

# PROJECTION

Controlled profile includes:

```text
CONTROLLED_BY_VISIBLE_CONTROL
CONTROLLED_BY_EXCLUSION
CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION
```

Triggered profile includes:

```text
TRIGGERED
```

Workpad-only rows remain internal.

# FORENSICS

Forensics preserve registry custody, route plan, semantic evidence application, status inputs, evidence binding, control/exclusion evaluation, final status derivation, projection reconciliation, and M9 consumption trace.

# REPAIR

Repair the smallest affected unit only: route plan, single batch, batch validation, accepted batch save, workpad merge, projection, or forensics.
