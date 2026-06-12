# NODE 5B DETERMINISTIC ASSEMBLER CONTRACT v1

## Status

Canonical build contract for the deterministic backend assembler.

This contract now follows the locked Stage 4 / Stage 5 canon:

```text
Stage 4 = target_profile_v2
Stage 5 = feature_profile_v2
Stage 5 canonical feature array = feature_inventory[]
product_feature_map[] = legacy compatibility only
primary_product = legacy language only
```

## Governing rule

Node 5B is deterministic backend logic.

It does not:

```text
call Gemini
re-run diligence prompts
create new findings
change registry statuses
invent Vault fields
infer private architecture or commercial facts
create legal advice
render the report
```

Node 5B receives validated compiler output and applies fixed mapping rules from the Vault Canonical Map.

---

## Input contract

Node 5B receives compiler output matching `data/schemas/compilerOutput.schema.json`.

Required compiler-owned inputs:

```text
diligence_run
source_bundle_summary
target_profile_v2
feature_profile_v2
legal_stack[]
document_stack_redline[]
threat_registry_summary{}
feature_to_threat_matrix[]
findings[]
controlled_rows[]
insufficient_evidence_rows[]
assembly_route{}
report_data{}
technical_audit_log[]
threat_findings[]
vault_confirmation_questions[]
disclaimer
```

Legacy names are not canonical input:

```text
target_profile
primary_product
product_feature_map[]
```

Node 5B must reject or quarantine compiler outputs that contain backend-owned fields:

```text
vault_prefill_suggestions
assembly_handoff
handoff_envelope
handoff_meta
payload_ref
interface_handoffs
interface_handoff_payloads
```

---

## Output contract

Node 5B produces:

```text
assembly_handoff
handoff_envelope
persistence_plan
```

`assembly_handoff` shape:

```json
{
  "handoff_meta": {},
  "target_profile": {},
  "feature_map": [],
  "threat_findings": [],
  "document_stack_status": [],
  "vault_prefill_suggestions": {
    "baseline": {},
    "architecture": {},
    "archetypes": {},
    "compliance": {}
  },
  "vault_confirmation_questions": [],
  "assembly_route_recommendation": {},
  "warnings": []
}
```

Mapping:

```text
assembly_handoff.target_profile = compiler_output.target_profile_v2
assembly_handoff.feature_map = compiler_output.feature_profile_v2.feature_inventory[]
```

---

## Vault prefill shape

Node 5B derives exactly:

```json
{
  "baseline": {},
  "architecture": {},
  "archetypes": {},
  "compliance": {}
}
```

No fifth group. No `meta`. No `human_review`. `integrations` belongs under `baseline`, not `architecture`.

Each populated field must be:

```json
{
  "value": null,
  "basis": "",
  "confidence": "high | medium | low",
  "source_finding_ids": []
}
```

---

## Deterministic derivation sources

Node 5B may derive only from canonical columns:

```text
compiler_output.target_profile_v2.vault_baseline_candidates
compiler_output.feature_profile_v2.feature_inventory[]
compiler_output.feature_profile_v2.data_provenance_map[]
compiler_output.feature_profile_v2.regulated_surface_map[]
compiler_output.feature_profile_v2.architecture_hints[]
compiler_output.legal_stack[]
compiler_output.findings[]
compiler_output.threat_findings[]
compiler_output.vault_confirmation_questions[]
```

Forbidden derivation sources:

```text
broad joined report prose
registry boilerplate as product fact
legal/AUP prohibitions as feature surfaces
case-law/provider examples as architecture providers
unproven private architecture assumptions
old primary_product object
old product_feature_map[] as canonical truth
```

---

## Prefill boundary

Prefill aggressively where a public, evidence-backed, canonical column exists.

Do not guess internal architecture, commercial terms, or private controls.

Public footprint may establish what the product appears to do and who it touches. The founder/client must confirm how it is built, what it costs, and what it contractually commits to.

---

## Archetype fan-out

Use `feature_profile_v2.feature_inventory[].archetype_codes[]` and confirmed findings.

| Archetype | Vault flag(s) |
|---|---|
| UNI | `archetypes.is_generalist` |
| DOE | `archetypes.is_doer` |
| ORC | `archetypes.is_orchestrator` |
| CRT | `archetypes.is_creator` |
| RDR | `archetypes.is_reader` |
| CMP | `archetypes.conversational_ui` |
| TRN | `archetypes.sens_bio` |
| JDG | `archetypes.is_judge`, `archetypes.is_judge_hr`, `archetypes.is_judge_legal` |
| OPT | `archetypes.is_optimizer`, `archetypes.sens_fin` |
| SHD | `archetypes.is_shield` |
| MOV | `archetypes.is_mover` |

Do not emit `human_review`; it is not a Vault field.

---

## Surface fan-out

Use `feature_profile_v2.regulated_surface_map[]` and `feature_inventory[].surface_tokens[]`.

| Surface | Vault field | Value |
|---|---|---|
| PII | `compliance.processes_pii` | `"yes"` |
| Financial | `compliance.sens_fin` | `true` |
| Employment | `compliance.sens_employment` | `true` |
| Minors | `compliance.minors` | `true` |

Do not infer health/finance/employment/minors from generic legal boilerplate or AUP prohibitions.

---

## Baseline prefill

Priority:

```text
target_profile_v2.vault_baseline_candidates.baseline.*
then target_profile_v2.identity.legal_name
then target_profile_v2.identity.brand_name
then feature_profile_v2.feature_inventory[] for products only
```

Legal name priority:

```text
identity.legal_name > identity.brand_name > display label
```

---

## Architecture prefill

Architecture is usually internal.

Only prefill from:

```text
feature_profile_v2.architecture_hints[]
```

and only where:

```text
disposition = prefill_candidate
hint_value is explicit
```

Do not infer providers or memory architecture from broad report text, registry rows, examples, case-law references, or generic docs.

---

## Confirmation questions

Node 5B passes through model-supplied `vault_confirmation_questions[]` after allowlist validation.

Invalid Vault paths are dropped with warnings.

---

## Mandatory disclaimer

Every handoff remains subject to:

```text
Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.
```

End of Node 5B contract.
