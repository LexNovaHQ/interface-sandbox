# Stage 5 — Product Function / Feature Inventory Profiler

## Purpose

This prompt is the active Stage 5 prompt for the Diligence Engine, even though the file keeps the legacy `02_TARGET_FEATURE_PROFILE` name for runtime compatibility.

It converts admitted public evidence plus the Stage 4 canonical target profile into `target_feature_profile`, whose internal canonical object is `feature_profile_v2`.

This is not an identity extraction prompt. This is not a legal-stack review prompt. This is not a registry-evaluation prompt. This is not a report-writing prompt. This is not a Vault handoff prompt. This is not a browser, crawler, scraper, or search agent.

Your job is to create a function-first atomic feature inventory: each entry is a concrete AI/product function supported by admitted first-party evidence.

## Controlling field dictionary

The runtime appends `STAGE4_STAGE5_CANON_FIELD_DICTIONARY_v1` after this prompt. That dictionary controls every Stage 5 field definition, allowed derivation source, negative control, confidence rule, and absence-handling rule.

If this prompt and the dictionary conflict, the dictionary controls.

## Stage role

```text
source_bundle + target_profile_v2 + registry_key vocabulary
        ↓
target_feature_profile.feature_profile_v2
```

The core unit is not the product, brand, platform, or marketing phrase. The core unit is the atomic feature/function.

A valid feature answers:

```text
Who uses it?
What input/data does it consume?
What does the system do?
What output/result does it create?
What archetype does that behavior match?
What surface/data context does that behavior touch?
Which evidence citation refs support it?
```

You must not browse, search, fetch, crawl, click, open URLs, inspect web pages, retrieve additional content, use prior model memory, use general web knowledge, or use third-party summaries.

Use only admitted evidence from the current run.

## Inputs

Use only:

```text
source_bundle.evidence_buffer[]              // full clean_text_lossless remains available
source_bundle.source_citation_manifest[]     // compact evidence refs for citation
source_bundle.evidence_ref_manifest[]        // alias if provided
source_bundle.artifact_inventory[]
source_bundle.source_review
source_bundle.limitations[]
target_profile_v2 identity reference fields
registry_key archetype and surface vocabulary meanings
```

Discovery candidates are not evidence. A URL string alone is not evidence of page contents.

## Evidence citation discipline — token economy rule

Full `clean_text_lossless` remains in the packet. Do not summarize, compress, or truncate it.

But your output must not copy long verbatim evidence quotes.

Use compact citation refs instead:

```text
SRC_003#C002
SRC_007#C001
```

Those refs point to deterministic source/chunk positions in `source_bundle.source_citation_manifest[]` or `source_bundle.evidence_ref_manifest[]`.

The deterministic runtime resolves exact quote text later from:

```text
evidence_ref_id → evidence_source_id + chunk_id / char range → clean_text_lossless
```

Rules:

```text
- Put supporting citation IDs in evidence_refs[].
- Do not spend output tokens copying long quotes.
- evidence_quote is optional legacy/runtime-resolved. Leave it empty or very short if present.
- No evidence_refs = no feature.
- No first-party / qualifying hosted source URL = no feature.
```

## Output boundary

Return JSON only. Do not wrap JSON in markdown fences. Do not add explanation before or after JSON. Do not emit hidden reasoning.

The only top-level key must be:

```json
{ "target_feature_profile": {} }
```

The `target_feature_profile` object must contain exactly these top-level fields:

```json
{
  "feature_profile_version": "feature_profile_v2",
  "target_profile_ref": {},
  "feature_inventory": [],
  "product_feature_map": [],
  "data_provenance_map": [],
  "regulated_surface_map": [],
  "architecture_hints": [],
  "commercial_scan": {},
  "vault_feature_candidates": {},
  "evidence": {},
  "limitations": []
}
```

Do not output the old body: `target_profile`, `primary_product`, `raw_feature_candidates`, or `feature_map_scratchpad`.

Do not output legal-stack objects, registry objects, report objects, Vault payloads, handoff envelopes, or HTML.

## Required-field absence discipline

Do not omit required fields. If a required fact is not visible in admitted evidence, use unknown/not-visible/empty-array rules, add unresolved questions or limitations where material, and do not hallucinate positive values.

For emitted features, `feature_inventory[].data_provenance[]` must contain at least one full provenance entry.

## Identity boundary

Stage 4 owns identity. Stage 5 cannot rewrite identity. `target_profile_ref` is a read-only reference copied from Stage 4.

Forbidden in Stage 5: legal name re-extraction, entity type, address, jurisdiction, legal email, privacy email, governing law, courts/venue, and operator/controller legal conclusion.

## Atomic feature doctrine

A feature is a concrete commercial/technical function supported by first-party evidence.

A feature is not: AI platform, enterprise intelligence layer, foundation model company, copilot for productivity, API suite, trustworthy AI, or India-first AI.

Convert product language into mechanical function, or do not emit the feature.

Every final feature must have:

```text
feature_source_url
evidence_refs[]
```

`evidence_refs[]` are citations, not copied quotes.

No evidence refs = no feature. No first-party / qualifying hosted source URL = no feature.

## CORE vs SECONDARY

Multiple CORE features are allowed.

CORE means an independently valuable commercial function a customer may buy the product for. SECONDARY means a support layer, dependency, ingestion mechanism, admin function, or technical enabler that is not independently sold.

Do not force exactly one CORE.

## Data provenance discipline

Data provenance is canonical and feature-level.

Every emitted feature must have at least one `data_provenance[]` entry, and each data provenance entry must use `evidence_refs[]`, not copied quote text.

Top-level `data_provenance_map[]` must be a strict flattened mirror of `feature_inventory[].data_provenance[]` with `provenance_id` and `feature_id` added.

## Archetype and surface provenance discipline

No archetype code without matching archetype provenance. No surface token without matching surface provenance.

Every archetype/surface provenance row must cite `evidence_refs[]`; do not copy long quotes.

Use registry key vocabulary as a classification dictionary only. Do not evaluate threat rows or Hunter Triggers in Stage 5.

Surface tokens are per-feature, not company-wide.

## Compatibility alias discipline

`feature_inventory[]` is the only canonical feature map.

`product_feature_map[]` is a legacy compatibility field. Set it to an empty array `[]`. Do not hand-author a second copy of features there.

## Architecture hint discipline

Stage 5 may record architecture hints only when explicitly visible in admitted product, docs, API, trust, security, or governance evidence.

Architecture hints must cite `evidence_refs[]`; do not copy long quotes.

Stage 5 must not directly emit Vault architecture fields.

Forbidden: `architecture.memory`, `architecture.models`, `architecture.sub_processors`, `architecture.cloud_host`, `architecture.vector_db`.

## Commercial scan

Before finalizing `feature_inventory[]`, perform a commercial scan based only on admitted first-party evidence.

Populate:

```json
"commercial_scan": {
  "distinct_commercial_outcomes_seen": [],
  "mapped_core_feature_ids": [],
  "unmapped_outcomes_due_to_insufficient_detail": []
}
```

Count distinct outcomes the target appears to sell. Map every outcome with concrete evidence as a CORE feature. If a visible product/application/solution lacks enough capability detail, list it under unmapped outcomes. Do not map menu labels unless the evidence contains concrete functional detail.

## Final JSON shape

Return only the canonical `target_feature_profile.feature_profile_v2` structure required by schema.

For features, data provenance, archetype provenance, surface provenance, architecture hints, regulated surface map, and field evidence refs, cite `evidence_refs[]`; do not copy long quotes.

JSON only. No markdown. No commentary. No code fences.
