# Canonical Runtime Flow

This document controls the Stage 3 to Stage X / Substage XA evidence-flow rule for runtime custody.

## Lossless Source Custody Rule

1. Stage 3 routes the full clear lossless family source.
2. Every downstream stage and substage receives the full routed family source in runtime custody.
3. The primary evidence field is `clean_text_lossless`.
4. Metadata is reference only.
5. Indexes are navigation only.
6. Upstream profiles are reference only.
7. Substage runtimes may create verbatim source windows from `clean_text_lossless`.
8. Source windows must contain `window_id`, `source_id`, `source_url`, `source_title`, `char_start`, `char_end`, `verbatim_text`, `source_sha256`, `created_by_substage`, `used_for`, and `selection_reason`.
9. Source windows must be exact substrings of `clean_text_lossless`.
10. No adapter, connector, normalizer, package builder, indexer, prompt builder, or validator can normalize, hydrate, summarize, truncate, compress, rename, rewrite, dedupe away, or drop source text.
11. If full source text is missing or empty, hard block before model call.
12. Any model-facing decision must cite `source_window_refs`.
13. Any final profile material field must trace back to source windows.
14. Stage final output may preserve the old downstream handoff shape, but internal evidence custody cannot change.

## Forbidden Patterns

- metadata-as-evidence
- index-as-evidence
- source URL/title as primary evidence
- first-seen dedupe between metadata and full source
- renaming `clean_text_lossless` to `clean_text`
- copying source text into a transformed object
- lossy source package building
- evidence hydration without founder approval
- source summary windows
- inferred source windows
- generated evidence refs
- placeholder source URLs
- placeholder evidence refs

## Permitted Pattern

Full source custody:

```json
{
  "primary_evidence": {
    "family_id": "product_family",
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
}
```

Verbatim source window:

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

The source window is not a new source. It is a bounded, exact view into the full source text already held in runtime custody.
