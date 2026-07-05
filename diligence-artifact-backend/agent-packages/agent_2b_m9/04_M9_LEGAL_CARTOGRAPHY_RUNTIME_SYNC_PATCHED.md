# Legal Cartography and Index — Runtime Sync

## Current Package Lock

This package implements the **Legal Cartography and Index** phase.

The compatibility agent ID remains `agent_2b_m9` because the existing runtime still uses that internal identifier.

Source Discovery is upstream. Legal Cartography and Index must not execute source discovery and must not emit `source_discovery_handoff`.

## Internal Job Split

Legal Cartography and Index has two internal jobs:

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

Job B reads Job A artifacts and loaded legal-governance source text. It derives only the 21 field-registry keyed rows locked in:

```text
M9_LEGAL_SIGNAL_DERIVATION_CONTRACT.md
```

The filename is retained for compatibility; the governing phase name is **Legal Cartography and Index**.

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

The Legal Cartography and Index package must not emit question IDs, reviewer questions, question rows, question indexes, Target Profile Review overlays, Data Provenance Profile selected-support packets, target profile outputs, data profile outputs, renderer payloads, or final handoff outputs.

## Boundary

Target Profile Review, Data Provenance Profile, and Qualified Review consume Legal Cartography and Index outputs later through their own phase contracts. They do not define Legal Cartography and Index derivation authority.
