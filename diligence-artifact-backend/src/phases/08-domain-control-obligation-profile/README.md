# Phase 8 — Domain Control Obligation Profile

## Status

This directory contains the isolated substantive Phase 8 package for the Domain Control Obligation Profile.

Current package status:

- contracts and schemas: built;
- package-agnostic Registry Key / obligation-catalog resolver: built;
- Layer 1 deterministic candidate inventory: built;
- Layer 2 Agent 8 prompt package: built;
- Layer 2 runner, compiler, and validator: built;
- package barrel and focused checks: built;
- central runtime activation: not yet switched;
- P2G route activation and artifact permissions: not yet switched;
- downstream handoff and phase-folder renumbering: not yet switched;
- final local validation and controlled live test: pending.

The package is intentionally dormant until the later mechanical cutover jobs are executed.

## Purpose

Phase 8 derives a target-specific Domain Control Obligation Profile after the Data Provenance Profile and before Data Provenance Forensics.

It answers four bounded diligence questions:

1. Which mounted package obligations are triggered by the target's already-derived package-scoped activities?
2. What operational obligation or control expectation does each candidate represent for the reviewed target?
3. What relevant control mechanism and control posture are visible from the routed public evidence?
4. What proof is missing or requires reviewer or local-counsel confirmation?

Phase 8 does not determine legal applicability, compliance, breach, satisfaction, regulator jurisdiction, licence requirement, licence validity, legal adequacy, or liability.

## Locked serial position

The locked serial chain is:

```text
M8_TARGET_FEATURE_PROFILE_FORENSICS
  -> DATA_PROVENANCE_PROFILE_LAYER4
  -> DATA_PROVENANCE_PROFILE_LAYER5
  -> DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY
  -> DOMAIN_CONTROL_OBLIGATION_PROFILE
  -> DATA_PROVENANCE_PROFILE_FORENSICS
```

Phase 8 follows Phase 7 only for sequence. It has no substantive dependency on Phase 7 Data Provenance Profile artifacts.

## Jobs and artifacts

### Layer 1

```text
job:      DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY
artifact: domain_control_obligation_candidate_inventory
mode:     deterministic only
```

Layer 1 creates the exact candidate universe. It:

- resolves the mounted primary Registry Key and mounted capability-overlay Registry Keys;
- reads individual obligation definitions only from mounted Registry Keys;
- reads family-level navigation metadata only from installed obligation catalogs;
- uses the P2E Domain Control Obligation Navigation Index as mandatory navigation;
- matches primary obligations only against Phase 5 `primary_classification`;
- matches capability-overlay obligations only against the corresponding Phase 5 overlay classification;
- requires both behavior-code and surface-token intersection;
- emits only mechanical candidate identity, linkage, and navigation fields;
- never calls a provider;
- never derives material obligation or control-posture fields;
- never creates regulatory-overlay obligation rows.

### Layer 2

```text
job:      DOMAIN_CONTROL_OBLIGATION_PROFILE
artifact: domain_control_obligation_profile
mode:     model-derived material fields + deterministic mechanical compilation
```

Layer 2 consumes the Layer 1 candidate inventory as the complete and exclusive candidate universe. The model must return exactly one row for each candidate and may not create, omit, merge, split, or mutate candidate identity.

## Routing doctrine

Phase 2G is the sole routing authority.

```text
route:  ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE
bucket: 2E_BUCKET_DOMAIN_CONTROL_OBLIGATION
```

Locked evidence doctrine:

- lossless evidence is primary evidence;
- P2E is the mandatory navigation map into that evidence;
- direct lossless evidence is not a fallback;
- free-corpus reading is forbidden;
- indexes, route labels, catalog metadata, and Registry Key statements are not target-specific evidence;
- no forensic profile is permitted as a material Phase 8 input.

## Source-authority hierarchy

```text
Mounted Registry Key obligation entry
  -> individual obligation definition and semantic derivation input

Installed obligation catalog family
  -> obligation-family navigation metadata only

P2E navigation index
  -> route and locator map into routed primary evidence

Routed lossless evidence
  -> target-specific primary evidence

Bounded legal/cartography context
  -> selective context only

DCO Field Derivation Registry rules
  -> derivation, fallback, limitation, and forbidden-inference grammar
```

No AI, FinTech, package filename, obligation ID, or obligation family is hardcoded into the resolver or builders.

## Field ownership

### Model-owned material fields

```text
normalized_name
what_it_requires
target_specific_obligation_context
authority_dependency
exposure_role_context
obligation_locus
obligation_trigger_timing
expected_control_signal
control_mechanism_present
control_posture_status
evidence_basis
missing_proof
diligence_question
derivation_basis
limitation
```

The backend cannot author, default, repair, normalize, or rewrite these values.

### Backend-owned mechanical fields

```text
candidate_id
obligation_id
obligation_family
source_layer
source_package_id
catalog_package_id
capability_overlay_id
linked_activity_references
matched_behavior_codes
matched_surface_tokens
registry_key_ref
obligation_catalog_ref
p2e_navigation_route_refs
regulatory_overlay_refs
schema_version
run_id
mounted_taxonomy_ref
obligation_count
profile_level_limitations
```

`candidate_id` is the only mechanical identity returned by the model, and only as a reconciliation key.

## Regulatory-overlay rule — Option A

Obligation source layers are restricted to:

```text
PRIMARY
CAPABILITY_OVERLAY
```

`REGULATORY_OVERLAY` is forbidden as an obligation-definition source layer.

A regulatory overlay may enrich an existing obligation row only where:

1. the overlay is mounted;
2. the overlay declaration is resolved from a mounted Registry Key; and
3. the model-derived `authority_dependency` intersects the overlay's declared framework links.

The compiler then stamps a candidate-only `regulatory_overlay_refs` entry. The overlay never creates or duplicates an obligation row and never represents a legal-applicability conclusion.

## Control vocabularies

```text
control_mechanism_present:
  VISIBLE
  NOT_VISIBLE
  UNCLEAR

control_posture_status:
  VISIBLE
  PARTIAL
  NOT_VISIBLE
  UNRESOLVED
```

These are public-footprint visibility and posture signals, not legal or compliance verdicts.

## Package files

```text
domain-control-obligation.constants.js
domain-control-obligation-candidate-inventory.contract.js
domain-control-obligation-profile.contract.js
domain-control-obligation-candidate-inventory.runner.js
domain-control-obligation-profile.runner.js
index.js
README.md

services/
  domain-control-obligation-taxonomy.resolver.js
  domain-control-obligation-candidate-inventory.builder.js
  domain-control-obligation-profile.compiler.js

validators/
  domain-control-obligation-candidate-inventory.validator.js
  domain-control-obligation-profile.validator.js
```

Agent package:

```text
agent-packages/agent_8_domain_control_obligation/
  00_RUNTIME_CONTROLLER_PHASE8.md
  01_DOMAIN_CONTROL_OBLIGATION_PROFILE_BACKEND.md
  02_PHASE8_VALIDATOR_RULES.md
  AGENT8_BACKEND_OUTPUT_CONTRACT.md
```

Focused checks:

```text
scripts/check-phase8-domain-control-obligation-contract.mjs
scripts/check-phase8-domain-control-obligation-layer1.mjs
scripts/check-phase8-domain-control-obligation-layer2.mjs
scripts/check-phase8-domain-control-obligation-runtime-boundary.mjs
```

These checks are intentionally not registered in `package.json` during this change job. Registration belongs to the later mechanical validation-wiring change job.

## Validation and failure doctrine

Blocking is exceptional. Missing, thin, gated, conflicted, or non-public evidence normally produces a controlled limitation and `LOCKED_WITH_LIMITATIONS`.

Structural failures remain blocking, including:

- malformed model JSON;
- wrong top-level artifact;
- missing or duplicate candidate rows;
- unauthorized artifact or evidence use;
- backend-owned fields emitted by the model;
- material fields silently created or repaired by the backend;
- source text or pointer leakage;
- forbidden legal or compliance conclusions;
- an output that cannot be reconciled safely.

## Activation gate

Do not activate the Phase 8 runtime before the mechanical FDR surgery is complete.

The current FDR still contains pre-cutover source-authority language for obligation ID, obligation locus, and trigger timing. The locked correction changes those authorities to the mounted Registry Key. Because the Layer 2 runner dynamically loads DCO FDR rows, production activation before that correction would create an authority conflict.

Runtime activation, P2G route activation, artifact permissions, folder renumbering, downstream handoff, package.json registration, full local validation, and live testing remain later change jobs.
