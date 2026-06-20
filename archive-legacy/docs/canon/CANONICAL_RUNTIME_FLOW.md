# Canonical Runtime Flow

Status: LOCKED  
Scope: Stage 3 to every downstream Stage X and Substage XA  
Applies to: live runtime, audit runtime, e2e runtime, forensic artifacts, prompt construction, deterministic logic, and final handoff assembly.

This document is the single controlling document for evidence flow. It replaces the old Stage 5 multi-document evidence-routing doctrine. Substage-specific implementation may have a prompt, runtime, and dictionary/logic file, but no substage may contradict this document.

---

## 1. Supreme Evidence Rule

Stage 3 routes full clear lossless family source packages.

Every downstream stage and substage receives the routed family source package in runtime custody.

The primary evidence field is always:

```text
clean_text_lossless
```

Metadata is reference only.

Indexes are navigation only.

Upstream profiles are reference only.

Source windows are allowed only as exact verbatim views into `clean_text_lossless`.

No adapter, connector, normalizer, package builder, indexer, prompt builder, validator, or integrator may normalize, hydrate, summarize, truncate, compress, rewrite, rename, dedupe away, or drop source text.

If full lossless source text is missing or empty, the stage must hard-block before model execution.

---

## 2. Runtime Custody Versus Prompt Payload

Runtime custody and prompt payload are different things.

Runtime custody means the stage/substage has access to the complete routed lossless source package.

Prompt payload means the bounded text packet sent into a model call.

To control tokens, a substage runtime may send only verbatim source windows to the model, but those windows must be exact substrings of the full lossless source already held in runtime custody.

Allowed:

```text
full lossless source in runtime custody
+ exact source windows in model prompt
+ offsets and hashes proving the window comes from the full source
```

Forbidden:

```text
metadata instead of source
index instead of source
summary instead of source
clean_text instead of clean_text_lossless
hydrated/rebuilt source instead of routed source
model decision without source-window refs
```

---

## 3. Stage 3 Output Responsibility

Stage 3 is the source router.

Stage 3 does not decide final feature meaning, legal meaning, registry applicability, data provenance, or report conclusions.

Stage 3 must preserve and route the family source package.

Canonical Stage 3 routed family shape:

```json
{
  "stage3_output_version": "stage3_family_source_router_v1",
  "routed_family_sources": [
    {
      "family_id": "product_family",
      "family_label": "Product / Feature Source Family",
      "sources": [
        {
          "source_id": "SRC_001",
          "source_url": "https://example.com/product",
          "source_title": "Product Page",
          "source_family": "product_family",
          "clean_text_lossless": "FULL CLEAR TEXT",
          "source_sha256": "...",
          "lossless_policy": {
            "full_text_lossless": true,
            "summarized": false,
            "compressed": false,
            "truncated": false,
            "normalized": false
          }
        }
      ]
    }
  ],
  "metadata_sidecar": [],
  "navigation_index_sidecar": [],
  "routing_log": []
}
```

Stage 3 may emit metadata and navigation indexes, but those are sidecars. They never replace the routed source.

---

## 4. Canonical Stage X Input Contract

Every downstream stage accepts this conceptual shape:

```json
{
  "stage_input_version": "stage_x_lossless_family_input_v1",
  "target_profile_ref": {},
  "upstream_profile_or_output": {},
  "primary_evidence": {
    "family_id": "product_family",
    "family_label": "Product / Feature Source Family",
    "sources": [
      {
        "source_id": "SRC_001",
        "source_url": "https://example.com/product",
        "source_title": "Product Page",
        "source_family": "product_family",
        "clean_text_lossless": "FULL CLEAR TEXT",
        "source_sha256": "...",
        "lossless_policy": {
          "full_text_lossless": true,
          "summarized": false,
          "compressed": false,
          "truncated": false,
          "normalized": false
        }
      }
    ]
  },
  "reference": {
    "metadata_sidecar": [],
    "navigation_index_sidecar": [],
    "routing_log": []
  }
}
```

Required invariant:

```text
primary_evidence.sources[].clean_text_lossless must be non-empty full clear source text.
```

No alternate primary source object is allowed.

---

## 5. Canonical Substage XA Input Contract

A substage receives the same evidence custody, plus upstream stage/substage outputs for context:

```json
{
  "substage_input_version": "stage_xa_lossless_family_input_v1",
  "target_profile_ref": {},
  "upstream_stage_output": {},
  "upstream_substage_outputs": {},
  "primary_evidence": {
    "family_id": "product_family",
    "sources": [
      {
        "source_id": "SRC_001",
        "source_url": "https://example.com/product",
        "clean_text_lossless": "FULL CLEAR TEXT",
        "source_sha256": "...",
        "lossless_policy": {
          "full_text_lossless": true,
          "summarized": false,
          "compressed": false,
          "truncated": false,
          "normalized": false
        }
      }
    ]
  },
  "reference": {
    "metadata_sidecar": [],
    "navigation_index_sidecar": [],
    "prior_substage_validation": {}
  }
}
```

Each substage acts independently and emits its own output.

The final integrator substage combines substage outputs into the downstream profile handoff.

---

## 6. Source Window Rule

Only a stage/substage runtime may create a source window.

Adapters and connectors may not create source windows.

Prompt builders may not create source windows.

Indexes may suggest where to look, but the runtime must cut the window directly from `clean_text_lossless`.

Canonical source window shape:

```json
{
  "window_id": "SRC_001#5A#W001",
  "source_id": "SRC_001",
  "source_url": "https://example.com/product",
  "source_title": "Product Page",
  "char_start": 0,
  "char_end": 2400,
  "verbatim_text": "EXACT TEXT FROM clean_text_lossless",
  "source_sha256": "...",
  "created_by_substage": "5A",
  "used_for": ["product_function_admission"],
  "selection_reason": "capability text"
}
```

Required invariant:

```text
source.clean_text_lossless.slice(char_start, char_end) === source_window.verbatim_text
```

If this check fails, the stage hard-blocks.

A source window is not a new source. It is a bounded exact view into the full source text already held in runtime custody.

---

## 7. Index Rule

Indexes are navigation sidecars only.

An index may contain:

```text
source_id
source_url
source_title
section marker
candidate marker
term hints
char ranges
source hash
```

An index may not contain the only copy of source text.

An index may not replace `clean_text_lossless`.

A model decision may not cite an index as evidence.

Correct use:

```text
index says relevant source is SRC_004 near chars 1200-2400
runtime creates verbatim window from primary_evidence.sources[SRC_004].clean_text_lossless
model cites the source window
```

Incorrect use:

```text
model cites SRC_004#chunk_3 without receiving/verifying the verbatim text
```

---

## 8. Metadata Rule

Metadata is reference only.

Metadata may contain:

```text
source_id
source_url
title
family
role
page type
discovery route
capture status
dedupe group
```

Metadata may never be primary evidence.

Metadata may never override full source text.

Metadata may never be deduped against full source text in a way that drops the full source.

If metadata and full source text share the same `source_id`, the metadata attaches to the source as sidecar reference. The full source never attaches to metadata.

Full source wins every conflict.

---

## 9. Three Core Files Per Stage/Substage

Each stage or substage has exactly three core implementation files:

```text
prompt
runtime
dictionary / derivation / investigation logic
```

For Stage 5:

```text
runtime-api/src/diligence/stage5/stage5.prompt.js
runtime-api/src/diligence/stage5/stage5.runtime.js
runtime-api/src/diligence/stage5/stage5.dictionary.js
```

For a substage:

```text
runtime-api/src/diligence/stage5/5a/5a.prompt.js
runtime-api/src/diligence/stage5/5a/5a.runtime.js
runtime-api/src/diligence/stage5/5a/5a.dictionary.js
```

No new adapter, connector, hydration layer, normalizer, source reshaper, or package-builder-as-evidence layer may be added without explicit founder approval.

---

## 10. Stage 5 Canonical Structure

Stage 5 is now:

```text
5A — Product Function Discovery
5B — Archetype / Surface Tagging
5C — Complete Feature Record Builder
5D — Final target_feature_profile Integrator
```

Old 5C and old 5D are merged into new 5C.

Old 5E is collapsed into new 5D.

No 5E exists in the canonical runtime.

---

## 11. Stage 5 Canonical Data Flow

```text
Stage 3 product-family lossless source
  ↓
Stage 5 runtime custody
  ↓
5A independently discovers product functions and creates verbatim feature windows
  ↓
5B independently tags admitted functions using 5A windows plus source custody if needed
  ↓
5C independently builds complete feature records, including data touchpoints, feature-wise
  ↓
5D integrates 5A + 5B + 5C into target_feature_profile
```

5D does not re-adjudicate the source by default. It validates the custody chain and assembles the handoff.

---

## 12. Legacy Stage 5 Parking Rule

The old Stage 5 Batch 2/3/4/5/6 chain is parked as legacy until the canonical runtime replaces it.

Parked legacy files may be read for useful enums, schema mapping, or historical behavior, but they may not control evidence flow.

Legacy files are not allowed to:

```text
normalize source text
hydrate source text
drop clean_text_lossless
create primary evidence
run live Stage 5 after canonical cutover
silently fallback after canonical validation fails
```

If a legacy component is integrated into the canonical path, its logic must be moved into one of the three canonical files for that stage/substage.

---

## 13. Hard Validation Gates

Before any model call or deterministic decision:

```text
primary_evidence exists
primary_evidence.sources is non-empty
each source has source_id
each source has clean_text_lossless
each clean_text_lossless has length > 0
each source has source_sha256 or runtime computes it from clean_text_lossless
each lossless_policy proves full, unmodified text custody
metadata is not primary evidence
index is not primary evidence
```

Before any model output is accepted:

```text
each material decision cites source_window_refs
each source window maps to a real source_id
each source window is an exact substring of clean_text_lossless
each source window hash matches the source custody hash
no placeholder source/evidence values exist
```

Before final handoff:

```text
5A output exists
5B output exists
5C output exists
5D output exists
all material profile fields trace to source windows
final target_feature_profile schema is valid
external handoff shape remains { companyProfile, targetFeatureProfile }
```

---

## 14. Blocking Error Codes

Canonical blocking errors:

```text
LOSSLESS_PRIMARY_EVIDENCE_VIOLATION
SOURCE_WINDOW_NOT_VERBATIM
SOURCE_WINDOW_REF_VIOLATION
METADATA_AS_PRIMARY_EVIDENCE_BLOCKED
INDEX_AS_PRIMARY_EVIDENCE_BLOCKED
PLACEHOLDER_EVIDENCE_BLOCKED
STAGE5A_NO_ADMITTED_FUNCTIONS
STAGE5_FINAL_PROFILE_SCHEMA_VIOLATION
```

No warning-only downgrade is allowed for these errors.

---

## 15. Non-Negotiable Conflict Rule

If there is ever a conflict between:

```text
metadata
index
upstream profile
model inference
legacy adapter output
legacy connector output
```

and:

```text
clean_text_lossless
```

then `clean_text_lossless` wins.

If `clean_text_lossless` is unavailable, the stage blocks.

No fallback.

No inference.

No metadata substitution.

No index substitution.

No hydration.
