# MODULE IX — LEGAL CARTOGRAPHY INDEX

## Current Package Lock — Agent 2B / M9

This package is active only as `agent_2b_m9`.

M6 / Source Discovery is upstream. M9 must not execute source discovery and must not emit `source_discovery_handoff`.

## Phase 2 Internal Job Split

M9 has two internal jobs inside Phase 2:

```text
Job A — Legal Cartography Index
Job B — Legal Signal Derivation
```

## Job A — Legal Cartography Index

Job A creates index/navigation artifacts only:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
legal_cartography_index
```

Job A identifies loaded documents, source locations, document structure, semantic navigation labels, locator rows, and missing/limited source rows.

Job A must not emit field-derived answers, target profile outputs, data profile outputs, renderer payloads, or reviewer-question objects.

## Job B — Legal Signal Derivation

Job B creates one deterministic field-derived artifact:

```text
legal_signal_derivation_profile
```

Job B reads Job A artifacts and loaded L-family source text. It derives only the 21 field-registry keyed rows locked in:

```text
M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md
```

Job B is deterministic only. Model-assisted derivation is not allowed.

## Read Artifacts

```text
source_discovery_handoff
lossless_family__L1_CORE_TERMS_PRIVACY
lossless_family__L2_B2B_CONTRACTING
lossless_family__L3_AI_USAGE_GOVERNANCE
lossless_family__L4_PRIVACY_ADJACENT_NOTICES
lossless_family__L5_LEGAL_HUB_HOSTED
lossless_family__L6_ENTITY_NOTICE
```

## Job A Semantic Contract

When the expected write artifact is `legal_cartography_semantic_profile`, the semantic layer emits only:

```text
queue_id
unit_id
subcats
control_families
confidence
```

No summaries, quotes, excerpts, document roles, downstream treatment, new IDs, new URLs, or downstream artifacts.

## Job A Final Artifact Shape

`legal_cartography_index` must preserve:

```text
document_coverage_index
document_structure_index
incorporated_linked_document_map
control_language_locator
semantic_navigation_index
priority_semantic_locator
legal_notice_locator
dispute_resolution_locator
governing_law_venue_locator
contact_grievance_locator
missing_limited_legal_governance_items
downstream_rules
lock_status
```

## Package Output Order

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
legal_cartography_index
legal_signal_derivation_profile
```

## Forbidden Package Pollution

The M9 package must not emit question IDs, reviewer questions, question rows, question indexes, M7 overlays, M10 selected-support packets, target profile outputs, data profile outputs, renderer payloads, or final handoff outputs.

## Boundary

M7, M10, and Qualified Review consume M9 outputs later through their own phase contracts. They do not define M9 derivation authority.
