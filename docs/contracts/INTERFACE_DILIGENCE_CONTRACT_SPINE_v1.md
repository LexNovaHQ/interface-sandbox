# THE INTERFACE — DILIGENCE ENGINE CONTRACT SPINE v1

## Binding update

This spine now incorporates the locked Stage 4 / Stage 5 canon.

For Stage 4 and Stage 5, the controlling field dictionary is:

```text
docs/contracts/STAGE4_STAGE5_CANON_FIELD_DICTIONARY_v1.md
```

The supremacy addendum is:

```text
docs/contracts/STAGE4_STAGE5_CANON_SUPERSEDES_SPINE_v1.md
```

If any older spine language, runtime note, archive, prompt, schema bundle, or fixture treats `target_profile`, `primary_product`, or `product_feature_map[]` as canonical, it is superseded.

---

## Canonical pipeline

```text
0.   Source Collector
0.5  Evidence Refiner                      → source_bundle
4.   Canonical Target Profile              → company_profile wrapper containing target_profile_v2
5.   Product Function / Feature Inventory   → target_feature_profile wrapper containing feature_profile_v2
6.   Legal Stack Review                    → legal_stack_review
7.   Registry Ledger                       → registry_evaluation_ledger[]
8.   Operator Challenge                    → operator_challenge_gate + corrected_ledger_entries[]
9.   Final Compiler                        → compiler_output
5B.  Deterministic Backend Assembler        → vault_prefill_suggestions + assembly_handoff + handoff_envelope
```

---

## Stage 4 canon

Runtime output key may remain `company_profile` for compatibility.

Canonical object:

```text
target_profile_v2
```

Stage 4 owns:

```text
identity
jurisdiction
business_model
market_context
product_baseline
data_touchpoint_map
vault_baseline_candidates
pipeline_assumptions
evidence
limitations
```

Stage 4 may read all admitted docs, purpose-limited to identity/profile/contact/baseline extraction.

Stage 4 must not own feature classification, legal-stack adequacy, registry evaluation, or Vault handoff.

---

## Stage 5 canon

Runtime output key may remain `target_feature_profile` for compatibility.

Canonical object:

```text
feature_profile_v2
```

Canonical feature array:

```text
feature_inventory[]
```

Legacy only:

```text
product_feature_map[]
primary_product
target_profile inside Stage 5
```

Stage 5 owns:

```text
feature_inventory[]
feature-level data_provenance[]
data_provenance_map[]
archetype_codes[] + archetype_provenance[]
surface_tokens[] + surface_provenance[]
regulated_surface_map[]
architecture_hints[]
commercial_scan
vault_feature_candidates
evidence
limitations
```

Stage 5 must not rewrite Stage 4 identity or evaluate registry threat rows.

---

## Blocking policy

Only critical unrecoverable errors block runtime.

For Stage 5, blockers are limited to:

```text
1. Output is not a JSON object.
2. No usable feature_inventory can be reconstructed.
3. Third-party / invented / malformed / non-package / non-first-party source contamination.
4. Output is too structurally corrupt to canonicalize.
```

Everything else is REPAIRABLE or WARNING.

---

## Node 5B boundary

Node 5B is deterministic. It derives Vault prefill from canonical columns only:

```text
target_profile_v2
feature_profile_v2.feature_inventory[]
feature_profile_v2.data_provenance_map[]
feature_profile_v2.regulated_surface_map[]
feature_profile_v2.architecture_hints[]
legal_stack_review
threat_findings
vault_confirmation_questions
```

Node 5B must not scrape broad report prose, registry boilerplate, case-law examples, or private architecture guesses to create Vault facts.

---

## Disclaimer

Every report and payload must preserve:

```text
Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.
```

End of Contract Spine v1.
