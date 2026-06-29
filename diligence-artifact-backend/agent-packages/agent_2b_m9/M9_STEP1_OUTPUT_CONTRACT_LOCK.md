# M9 STEP 1 — OUTPUT CONTRACT LOCK

## Purpose

This file locks the compatibility contract for the M9 hybrid upgrade before any deterministic builder, semantic layer, compiler, runner, validator, or pipeline wiring is changed.

This is a non-execution contract. It does not change the live pipeline by itself.

## Locked Rule

The M9 hybrid upgrade must remain a drop-in replacement for the current M9 phase.

Downstream phases must continue to receive exactly one final M9 artifact:

```text
legal_cartography_index
```

The final M9 artifact name must not change.

## Hybrid Artifact Save Contract

When hybrid M9 is wired, each M9 layer must produce and save its own artifact.

The full hybrid M9 phase must save exactly these three M9-owned artifacts in order:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
legal_cartography_index
```

The first artifact is produced by the deterministic layer.

The second artifact is produced by the semantic layer.

The third artifact is produced by the deterministic compiler and remains the only downstream-required M9 artifact.

`legal_cartography_index` is the compiled/final artifact. It is not optional.

## Final Artifact Shape Must Remain Backward-Compatible

The final `legal_cartography_index` must retain these existing top-level arrays/objects:

```text
document_coverage_index
document_structure_index
incorporated_linked_document_map
control_language_locator
missing_limited_legal_governance_items
downstream_rules
lock_status
```

No downstream phase may be required to read a new final artifact name.

No downstream phase may be required to read a new top-level M9 root in order to keep working.

## Internal Hybrid Artifacts Are M9-Owned

The hybrid M9 system must save supporting artifacts, including:

```text
legal_cartography_deterministic_map
legal_cartography_semantic_profile
```

The optional repair workpad may also be saved if reinvestigation is needed:

```text
legal_cartography_reinvestigation_workpad
```

These internal artifacts are M9-owned.

They must not become mandatory inputs for M7, M8, M10, M11, M12, compiler, renderer, or public UI unless a later migration explicitly changes those phases.

## M9 Must Remain a Map, Not Parallel Evidence

The final M9 artifact must not duplicate full legal/governance source text.

M9 may store navigation pointers, including:

```text
source family
lossless artifact name
source URL
host document
embedded document or unit name
section or heading path
section order
location pointer
referenced document pointer
missing-source search trail
semantic topic label
control label
limitation
```

M9 must not store full clause text, full control text, or copied legal evidence as a substitute for the lossless source artifacts.

The lossless legal/governance family artifacts remain the source of truth for legal text.

M9 tells downstream phases where to look. It does not replace the evidence.

## Field Boundary Lock

Deterministic M9 may create factual navigation fields:

```text
source family
lossless artifact name
source URL
document identity
document class candidate
standalone/embedded/reference status
section or internal unit identity
heading path
location pointer
referenced links
missing-source search trail
source status
limitation from source custody
```

Semantic M9 may add bounded labels:

```text
legal topic
apparent function
control type
substitute control signal
downstream relevance
ambiguity note
confidence label
limitation note
```

Semantic M9 must not create:

```text
legal advice
compliance conclusion
sufficiency conclusion
enforceability assessment
risk conclusion
registry evaluation
new source document
new fetched URL
full legal text replacement
```

## Compiler Lock

The final compiler must perform a strict merge.

It may attach semantic labels to deterministic map rows.

It must reject or quarantine semantic claims that do not attach to an existing deterministic document/unit/section pointer.

It must not delete, truncate, summarize, or rewrite deterministic map rows.

It must not copy full legal source text into the final M9 artifact.

## Repair and Reinvestigation Rule

Reinvestigation is the rule for repair rows.

Blocking is the exception.

Rows with weak labels, uncertain document class, missing topic label, unclear control type, thin source coverage, referenced-but-unloaded material, or substitute-control ambiguity must be routed to M9 reinvestigation first.

After reinvestigation, unresolved non-critical issues must carry limitations and allow M9 to lock with limitations.

## Critical Blocking Conditions Only

M9 may block only for critical failures, including:

```text
no usable legal/governance corpus
missing all legal/governance lossless artifacts
source custody corruption
malformed final legal_cartography_index that cannot be saved
semantic layer invents source documents that the compiler cannot reject safely
legal advice or compliance/risk/registry conclusion appears in M9
artifact save failure
```

Ordinary quality gaps are not critical failures.

## Non-Impact Rule

The M9 hybrid upgrade must not disturb:

```text
M7
M8
M10
M11
M12
compiler
renderer
source extraction
source discovery
public routes
public UI
existing downstream artifact names
```

## Step 1 Status

This file locks the upgrade boundary only.

No runtime behavior is changed by Step 1.
