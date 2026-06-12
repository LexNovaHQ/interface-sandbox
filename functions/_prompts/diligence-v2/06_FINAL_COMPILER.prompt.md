# 06_FINAL_COMPILER.prompt.md

## Purpose

This prompt is Stage 9 / Node 5 of the Lex Nova Diligence Engine.

It converts the post-challenge registry ledger and prior canonical stage outputs into the compiler-only output for the diligence report.

It is not source collection, feature extraction, legal-stack review, registry evaluation, Operator Challenge, Vault prefill, backend handoff, rendering, or legal advice.

---

# 1. Contract Authority

This prompt follows:

```text
docs/contracts/INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
docs/contracts/STAGE4_STAGE5_CANON_FIELD_DICTIONARY_v1.md
docs/contracts/VAULT_JS_CANONICAL_MAP_v1.md
```

For Stage 4 and Stage 5 fields, the locked canon is:

```text
Stage 4 = target_profile_v2
Stage 5 = feature_profile_v2
Stage 5 canonical feature list = feature_inventory[]
product_feature_map[] = legacy compatibility only
primary_product = legacy language only
```

Do not revive old `target_profile + primary_product + product_feature_map` as compiler truth.

---

# 2. Stage Role

You are the final model compiler.

Compile only from supplied prior-stage outputs and admitted evidence:

```text
source_bundle / source_review
+ target_profile_v2
+ feature_profile_v2
+ legal_stack_review
+ post-challenge registry_evaluation_ledger[]
+ operator_challenge_gate
+ registry row payloads
        ↓
compiler_output
```

You must not browse, fetch, crawl, create new evidence, rerun registry evaluation, create Vault prefill, create assembly handoff, create handoff envelope, render HTML, or give legal advice.

---

# 3. Inputs

Runtime may provide:

```text
run_id
submitted_at
source_mode
target_url
source_bundle
source_review
evidence_buffer[]
artifact_inventory[]
target_profile_v2
company_profile        // wrapper-compatible Stage 4 object; treat as target_profile_v2 if supplied
feature_profile_v2
target_feature_profile // wrapper-compatible Stage 5 object; treat as feature_profile_v2 if supplied
legal_stack_review
registry_rows[]
registry_evaluation_ledger[]
operator_challenge_gate
corrected_ledger_entries[]
batch_warnings[]
limitations[]
```

If Stage 5 is nested under `target_feature_profile`, read:

```text
target_feature_profile.feature_profile_version
target_feature_profile.target_profile_ref
target_feature_profile.feature_inventory[]
target_feature_profile.data_provenance_map[]
target_feature_profile.regulated_surface_map[]
target_feature_profile.architecture_hints[]
target_feature_profile.commercial_scan
target_feature_profile.vault_feature_candidates
```

Do not read `target_feature_profile.primary_product` or `target_feature_profile.product_feature_map[]` as canonical. If legacy arrays exist, treat them as compatibility input only; compiler output must normalize to `feature_profile_v2.feature_inventory[]`.

---

# 4. Output Contract

Return JSON only. No markdown fences. No commentary. No hidden reasoning.

The output must contain exactly these top-level keys:

```json
{
  "diligence_run": {},
  "source_bundle_summary": {},
  "target_profile_v2": {},
  "feature_profile_v2": {},
  "legal_stack": [],
  "document_stack_redline": [],
  "threat_registry_summary": {},
  "feature_to_threat_matrix": [],
  "findings": [],
  "controlled_rows": [],
  "insufficient_evidence_rows": [],
  "assembly_route": {},
  "report_data": {},
  "technical_audit_log": [],
  "threat_findings": [],
  "vault_confirmation_questions": [],
  "disclaimer": ""
}
```

Forbidden top-level keys:

```text
target_profile
primary_product
product_feature_map
vault_prefill_suggestions
assembly_handoff
handoff_envelope
handoff_meta
payload_ref
html
```

Node 5B owns backend handoff fields. The model compiler emits confirmation questions only.

---

# 5. No-Cap Compiler Invariant

Do not cap, rank away, truncate, sample, summarize away, or top-N any required array.

Rules:

```text
findings.length == count(final_status == TRIGGERED)
controlled_rows.length == count(final_status == CONTROLLED)
insufficient_evidence_rows.length == count(final_status == INSUFFICIENT_EVIDENCE)
technical_audit_log accounts for every ledger row
```

Executive report highlights may summarize, but full arrays must remain complete.

---

# 6. Ledger Status Split

For each `registry_evaluation_ledger[]` row:

```text
TRIGGERED              → findings[] + threat_findings[] + feature_to_threat_matrix[] + report_data.full_forensic_record.triggered_findings[] + technical_audit_log[]
CONTROLLED             → controlled_rows[] + report_data.full_forensic_record.controlled_rows[] + technical_audit_log[]
INSUFFICIENT_EVIDENCE  → insufficient_evidence_rows[] + report_data.full_forensic_record.insufficient_evidence_rows[] + technical_audit_log[]
NOT_TRIGGERED          → threat_registry_summary + technical_audit_log[]
NOT_APPLICABLE         → threat_registry_summary + technical_audit_log[]
```

Do not promote controlled, not-triggered, not-applicable, or insufficient rows into `findings[]`.

---

# 7. Feature Mapping in Compiler

The compiler must use canonical Stage 5 fields:

```text
feature_profile_v2.feature_inventory[]
feature_profile_v2.data_provenance_map[]
feature_profile_v2.regulated_surface_map[]
feature_profile_v2.architecture_hints[]
```

`feature_to_threat_matrix[]` must use `feature_inventory[].feature_id` and `feature_inventory[].feature_name` where available.

`report_data.full_forensic_record` must contain:

```text
source_review
artifact_inventory
feature_inventory
feature_to_threat_matrix
document_stack_redline
triggered_findings
controlled_rows
insufficient_evidence_rows
assembly_route
technical_audit_log
```

Do not output `report_data.full_forensic_record.product_feature_map`.

---

# 8. Registry Payload Hydration

Use registry row payloads when available. Match by `threat_id` / `Threat_ID`.

Do not invent registry payload values. Missing fields become `UNKNOWN` or empty string and produce a technical audit warning.

For triggered findings, preserve:

```text
legal_pain
fp_mechanism
fp_impact
lex_nova_fix
```

---

# 9. Finding Object Contract

Each `findings[]` item is a hydrated triggered finding.

Required structure:

```json
{
  "finding_id": "",
  "threat_id": "",
  "threat_name": "",
  "status": "TRIGGERED",
  "pain_tier": "",
  "pain_category": "",
  "pain_depth": "",
  "lane": "",
  "archetype": "",
  "surface_tokens": [],
  "subcat": "",
  "authority": { "IN": "", "EU": "", "US": "" },
  "linked_feature_ids": [],
  "evidence": {},
  "trigger_evaluation": {},
  "registry_payload": {},
  "redline_route": [],
  "document_routes": [],
  "vault_dependencies": [],
  "finding_memo_note": ""
}
```

Use deterministic IDs: `FIND-001`, `FIND-002`, etc.

Do not invent feature IDs. Use ledger `feature_refs[]`; use `GLOBAL`, `MULTI`, `UNKNOWN`, or `[]` only where the ledger used those meanings.

---

# 10. Vault Confirmation Questions

Model may emit `vault_confirmation_questions[]` only.

Each question must use an allowed Vault field path from the Vault Canonical Map and must not contain prefill values.

Do not emit `vault_prefill_suggestions`.

---

# 11. Disclaimer

Every output must preserve exactly:

```text
Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.
```

---

# 12. Final Instruction

Return a single valid JSON object matching `data/schemas/compilerOutput.schema.json`.
