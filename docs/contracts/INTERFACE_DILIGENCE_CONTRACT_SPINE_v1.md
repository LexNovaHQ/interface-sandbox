# THE INTERFACE — DILIGENCE ENGINE CONTRACT SPINE v1

## Binding update

This spine now incorporates the locked Diligence Canon Field Dictionary for non-Stage-6 slices and the Stage 6 Canonical Spine for Stage 6.

The controlling Stage 6 spine is:

```text
docs/contracts/DILIGENCE_CANONICAL_SPINE_v1.md
```

The controlling runtime dictionary for non-Stage-6 slices is:

```text
docs/contracts/DILIGENCE_CANON_FIELD_DICTIONARY_v1.md
```

The previous Stage 4 / Stage 5 dictionary is retained as migration history and compatibility fallback:

```text
docs/contracts/STAGE4_STAGE5_CANON_FIELD_DICTIONARY_v1.md
```

The supremacy addendum remains:

```text
docs/contracts/STAGE4_STAGE5_CANON_SUPERSEDES_SPINE_v1.md
```

If any older spine language, runtime note, archive, prompt, schema bundle, or fixture treats `target_profile`, `primary_product`, or `product_feature_map[]` as canonical, it is superseded.

If any older Stage 6 language treats legal-stack review, Stage 6A, or model overlay as independent schema/vocabulary authority, it is superseded by `docs/contracts/DILIGENCE_CANONICAL_SPINE_v1.md`.

---

## Canonical pipeline

```text
0.   Source Collector
0.5  Evidence Refiner                                      → source_bundle
4.   Canonical Target Profile                              → company_profile wrapper containing target_profile_v2
5.   Product Function / Feature Inventory                  → target_feature_profile wrapper containing feature_profile_v2
6.   Legal Stack + Data Provenance Navigation Layer        -> stage6_review wrapper containing stage6_review_v1
7.   Registry Ledger                                       → registry_evaluation_ledger[]
8.   Operator Challenge                                    → operator_challenge_gate + corrected_ledger_entries[]
9.   Final Compiler                                        → compiler_output
5B.  Deterministic Backend Assembler                       → vault_prefill_suggestions + assembly_handoff + handoff_envelope
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

## Stage 6 canon

Runtime output key is:

```text
stage6_review
```

Canonical internal version:

```text
stage6_review_v1
```

This section is a summary only. The binding Stage 6 source of truth is:

```text
docs/contracts/DILIGENCE_CANONICAL_SPINE_v1.md
runtime-api/src/diligence/stage6CanonicalVocabulary.js
data/schemas/stage6Review.schema.json
```

Stage 6 role:

```text
Legal Stack + Data Provenance Navigation Layer
```

Stage 6 owns:

```text
legal_document_cartography
  legal_document_inventory[]
  legal_document_index[]
  document_relationship_map[]
  document_control_signal_map[]
  document_mismatch_signal_map[]
  legal_document_summary_signals
  legal_document_limitations[]

data_provenance_profile
  data_flow_profile[]
  data_profile_summary_signals
  data_profile_limitations[]

stage7_navigation_index
  feature_to_data_flow_index[]
  feature_to_legal_unit_index[]
  control_family_index[]
  data_signal_index[]
  legal_unit_source_locator_index[]
  absence_unknown_index[]
  fallback_source_packet[]
```

Stage 6 helps Stage 7 navigate. It does not decide Stage 7.

Stage 6 must not emit:

```text
threat_status
triggered_threat_ids
Hunter Trigger decisions
registry final_status values
candidate control gaps
recommended controls
missing required clauses
DPDP/GDPR/CCPA compliance verdicts
Vault prefill
Vault handoff
legal advice
```

Stage 7 still reads the underlying source/document text line-by-line when applying Hunter Trigger logic.

---

## Stage 7 boundary

Stage 7 receives Stage 6 maps as navigation handles only.

Allowed Stage 7 use:

```text
Use Stage 6 refs to find relevant source/document text faster.
Then apply the supplied registry row's Hunter Trigger logic line-by-line against the underlying source bundle.
```

Forbidden Stage 7 shortcut:

```text
Stage 6 says not_visible -> automatically TRIGGERED
Stage 6 says visible -> automatically CONTROLLED
Stage 6 data profile has personal_data_visible -> automatically PRV threat triggered
Stage 6 legal stack has DPA visible -> automatically PRV threat controlled
```

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

For Stage 6, the Layer 0 contract does not change runtime blocking. Stage 6 schema/guardrail updates happen only in later layers.

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

Stage 6 canonical maps may become a later approved input to post-Stage-7 synthesis, but Layer 0 does not authorize Vault prefill from Stage 6.

---

## Disclaimer

Every report and payload must preserve:

```text
Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.
```

End of Contract Spine v1.
