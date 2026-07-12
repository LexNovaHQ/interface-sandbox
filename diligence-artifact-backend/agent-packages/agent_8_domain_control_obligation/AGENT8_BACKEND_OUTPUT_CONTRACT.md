# Agent 8 Backend Output Contract

output_contract_version: phase8_dco_model_material_output_v1

## 1. Contract purpose

This file governs the backend model response for:

```text
DOMAIN_CONTROL_OBLIGATION_PROFILE
```

The model response is a temporary material payload. It is not the final compiled `domain_control_obligation_profile` artifact.

The backend compiler joins the model rows to Layer 1 candidates and stamps all mechanical identity, routing, package, taxonomy, overlay, schema, count, profile-limitation, validation, and lock metadata.

## 2. Required top-level shape

Return exactly one plain JSON object:

```json
{
  "domain_control_obligation_profile": {
    "obligations": []
  }
}
```

Rules:

- no array wrapper;
- no markdown fence;
- no XML-like phase wrapper;
- no `phase_output`, `output`, `result`, or `data` wrapper;
- no commentary before or after the JSON;
- no second top-level artifact.

## 3. Required inner shape

`domain_control_obligation_profile` contains exactly one key:

```text
obligations
```

`obligations` is an array containing exactly one row for every candidate in `domain_control_obligation_candidate_inventory.candidates[]`.

The model must not emit the final compiled top-level fields:

```text
artifact_type
schema_version
run_id
derivation_mode
mounted_taxonomy_ref
obligation_count
profile_level_limitations
```

## 4. Exact row shape

Each row contains exactly sixteen keys:

```json
{
  "candidate_id": "DCO-CAND-001",
  "normalized_name": "",
  "what_it_requires": "",
  "target_specific_obligation_context": "",
  "authority_dependency": [],
  "exposure_role_context": "UNRESOLVED",
  "obligation_locus": "",
  "obligation_trigger_timing": "",
  "expected_control_signal": "",
  "control_mechanism_present": "UNCLEAR",
  "control_posture_status": "UNRESOLVED",
  "evidence_basis": [],
  "missing_proof": [],
  "diligence_question": "",
  "derivation_basis": [],
  "limitation": []
}
```

The skeleton above defines types only. Empty required strings are not valid final values.

## 5. Field types

| Field | Required type | Empty allowed |
|---|---|---|
| `candidate_id` | non-empty string | No |
| `normalized_name` | non-empty string | No |
| `what_it_requires` | non-empty string | No |
| `target_specific_obligation_context` | non-empty string | No |
| `authority_dependency` | array of unique non-empty strings | Conditional |
| `exposure_role_context` | controlled string | No |
| `obligation_locus` | non-empty string | No |
| `obligation_trigger_timing` | non-empty string | No |
| `expected_control_signal` | non-empty string | No |
| `control_mechanism_present` | controlled string | No |
| `control_posture_status` | controlled string | No |
| `evidence_basis` | array of unique non-empty strings | Conditional |
| `missing_proof` | array of unique non-empty strings | Yes |
| `diligence_question` | non-empty string | No |
| `derivation_basis` | array of exactly 14 basis objects | No |
| `limitation` | array of unique non-empty strings | Yes |

Conditional empty-array rules:

- empty `authority_dependency` requires an explicit authority limitation;
- empty `evidence_basis` requires non-empty `missing_proof` and `limitation`.

## 6. Controlled values

### Exposure role

```text
A
B
Both
UNRESOLVED
```

### Control mechanism

```text
VISIBLE
NOT_VISIBLE
UNCLEAR
```

### Control posture

```text
VISIBLE
PARTIAL
NOT_VISIBLE
UNRESOLVED
```

No alternative strings are allowed.

## 7. Derivation-basis object

Each `derivation_basis[]` object contains exactly:

```json
{
  "field_id": "",
  "output_field": "",
  "conditions_satisfied": [],
  "trigger_outcome_applied": "",
  "material_basis": "",
  "limitation": "NONE"
}
```

Required types:

- `field_id`: non-empty string;
- `output_field`: non-empty string;
- `conditions_satisfied`: array of non-empty strings;
- `trigger_outcome_applied`: non-empty string;
- `material_basis`: non-empty string;
- `limitation`: non-empty string or exact `NONE`.

Each row must contain exactly one basis entry for each of:

```text
normalized_name
what_it_requires
target_specific_obligation_context
authority_dependency
exposure_role_context
obligation_locus
obligation_trigger_timing
expected_control_signal
control_mechanism_present
control_posture_status
evidence_basis
missing_proof
diligence_question
limitation
```

Do not include basis entries for:

```text
candidate_id
derivation_basis
any backend-owned mechanical field
```

## 8. Candidate identity rule

`candidate_id` must match the corresponding Layer 1 candidate exactly.

The model must not emit:

```text
obligation_id
obligation_family
source_layer
source_package_id
catalog_package_id
capability_overlay_id
linked_activity_references
matched_behavior_codes
matched_surface_tokens
registry_key_ref
obligation_catalog_ref
p2e_navigation_route_refs
```

The backend compiler owns those fields.

## 9. Authority-dependency rule

`authority_dependency` contains only exact framework tokens permitted by the candidate's mounted Registry Key obligation entry.

The model may narrow the permitted list based on target context. It may not add, rename, translate, merge, or infer a new token.

This array is used by the backend only as a material authority-dependency signal and as an input to deterministic Option A overlay intersection. It is not a legal-applicability conclusion.

## 10. Evidence-basis rule

`evidence_basis` and all other material fields must be business-readable paraphrase.

Forbidden:

```text
URLs
source IDs
source pointers
route IDs
catalog IDs
registry paths
quotes
excerpts
copied clauses
lossless text
raw text
markdown
HTML
```

Do not cite indexes, catalogs, Registry Keys, or FDR rows as target evidence.

## 11. Regulatory-overlay exclusion

The model must not emit:

```text
regulatory_overlay_refs
regulatory_overlay_status
overlay_id
matched_frameworks
```

The backend compiler owns regulatory-overlay enrichment and may only enrich existing obligation rows.

## 12. Forbidden combined output

Forbidden:

```json
{
  "domain_control_obligation_candidate_inventory": {},
  "domain_control_obligation_profile": {}
}
```

Forbidden:

```json
{
  "domain_control_obligation_profile": {
    "artifact_type": "domain_control_obligation_profile",
    "obligations": [],
    "mounted_taxonomy_ref": {}
  }
}
```

Forbidden:

```json
{
  "domain_control_obligation_profile": {
    "obligations": []
  },
  "dap_forensics_profile": {}
}
```

The model emits only its material row payload.

## 13. Forbidden legal conclusions

No field may state or imply:

- legal applicability;
- compliance or non-compliance;
- satisfaction or breach;
- regulator jurisdiction;
- licence requirement or validity;
- legal adequacy;
- liability.

Use visibility, posture, missing-proof, limitation, and diligence-question language instead.

## 14. Final response rule

Return strict JSON only.

No markdown. No commentary. No validation receipt. No lock status. No next-step instruction.