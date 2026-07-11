# Target and Activity Profile Runtime Controller

## Runtime kernel

This file governs `agent_3_target_feature` only when assembled with `AGENT3_RUNTIME_BINDING_PACKET.yaml` and an active phase prompt.

The backend phase contract is the canonical permission source. Prompt text cannot expand backend read or write authority. For Target Profile Review, Domain Derivation Layer, and Activity Profile Review, Phase 2G is the sole runtime routing authority.

## Runtime execution rule

1. Read the runtime binding packet before the active phase prompt.
2. Execute only the active phase selected by the backend runner.
3. For 3A, 3B, and Phase 5, accept only the artifact packet resolved from `phase_routing_manifest` by `phase-route-runtime.reader`.
4. Treat lossless evidence in that packet as primary evidence and use the routed index as the mandatory navigation map.
5. Do not request or inspect any artifact outside the routed bucket and declared preceding derived-profile context.
6. Write only artifacts listed in the backend phase contract for that active phase.
7. Save material artifacts before forensic artifacts.
8. Do not emit downstream objects, final handoff artifacts, renderer payloads, Qualified Review artifacts, or same-chat receipts in backend mode.

## Active phase ownership

This package covers:

- Target Profile Review
- Domain Derivation Layer
- Target Profile Forensics
- Activity Profile Review
- Activity Profile Forensics

The package does not own Source Discovery, Phase 2 Cartography and Index, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, Normalized Report Renderer, or Qualified Review.

## Phase 2G boundary

For material profile jobs:

- `phase_routing_manifest` identifies the authorized route.
- `phase_route_runtime_packet` records the resolved route and bucket.
- Lossless evidence is primary evidence; it is not a fallback.
- Index navigation is mandatory.
- Free-corpus reads are forbidden.
- A material profile may receive its own bucket plus only the preceding derived profiles declared by 2G.
- Target, activity, DAP, and exposure forensic artifacts are forbidden as material-profile inputs.
- A phase may not widen its own packet.

## Target Profile Review read authority

Target Profile Review uses `ROUTE.PHASE3A.TARGET_PROFILE` and bucket `2A_BUCKET_TARGET_PROFILE`. It may use only routed target evidence, `target_profile_source_index`, and bounded `legal_signal_derivation_profile` rows. It must not derive Lane/domain package/AI mount decisions.

## Domain Derivation Layer read authority

Domain Derivation Layer uses `ROUTE.PHASE3B.DOMAIN_DERIVATION` and bucket `2B_BUCKET_DOMAIN_DERIVATION`. It uses `domain_derivation_source_index` as navigation, mounted Registry Keys plus catalog/FDR grammar as rule authority, and deterministic validator/compiler as lock authority.

Domain Derivation Layer must not derive or emit target profile edits, activity profile rows, archetypes, surface locks, exposure rows, legal advice, compliance conclusion, risk conclusion, Lane, or remediation route.

## Activity Profile Review read authority

Both Phase 5 jobs use `ROUTE.PHASE5.ACTIVITY_PROFILE` and bucket `2C_BUCKET_ACTIVITY_PROFILE`.

`M8_TARGET_FEATURE_PROFILE` additionally receives `feature_candidate_inventory` as a 2G-declared job-scoped derived artifact.

### Layer 1 — Activity Candidate Inventory

`M8_FEATURE_CANDIDATE_INVENTORY` is deterministic-led and semantic-supported.

1. The backend uses `activity_profile_source_index` as mandatory navigation into the Phase-2G-routed primary lossless evidence.
2. The backend opens only index-mapped routed lossless units and builds the deterministic evidence-grounded baseline first.
3. The semantic call receives only that baseline, bounded locator rows, mapped routed units, and structural pointer metadata.
4. The semantic call may propose recover, merge, split, rename, or reject actions only.
5. The semantic call must not receive or apply Registry Key taxonomy, classify activities, copy evidence, expand evidence, generate final IDs/keys, or emit the saved inventory.
6. The backend validator and reconciler remain the sole authority for proposal acceptance, final IDs/keys, receipt generation, and artifact saving.
7. Provider failure or malformed output is non-blocking: retain the deterministic baseline and save `LOCKED_WITH_LIMITATIONS`.

### Layer 2 — Activity Profile Review material

The material profile uses the same routed lossless evidence, navigated through `activity_profile_source_index` and candidate pointers, to derive mechanics and the material activity profile. Package-specific taxonomy remains a Layer 2 concern and is not available to the Layer 1 semantic-support call.

Neither Phase 5 job may read `target_profile_forensics`, `target_feature_profile_forensics`, legal/data indexes outside its route, or any downstream artifact.

## Phase 5 Activity Profile Review runtime controller lock — agnostic v8

Phase 5 has two separated prompt bundles.

Layer 1 `M8_FEATURE_CANDIDATE_INVENTORY`:

- builds deterministic baseline first;
- uses `activity_profile_source_index` as the navigation map;
- opens index-mapped `lossless_root__*` units as primary evidence;
- copies no evidence text;
- applies no package taxonomy;
- attempts one semantic-support pass only after the deterministic baseline;
- accepts only bounded semantic proposals;
- treats semantic output as non-authoritative;
- reconciles accepted proposals deterministically;
- saves only backend-created `feature_candidate_inventory`.

Layer 2 `M8_TARGET_FEATURE_PROFILE`:

- consumes `feature_candidate_inventory`;
- consumes routed lossless evidence only through `activity_profile_source_index`;
- receives resolved package-tagged taxonomy from `active_run_package_manifest` and `resolveActivityTaxonomy`;
- applies primary package taxonomy in `primary_classification`;
- applies resolved capability overlay taxonomy in `overlay_classifications[]`;
- excludes regulatory overlays from activity archetype and surface classification;
- emits exactly `target_feature_profile`;
- never selects, changes, or expands the mounted domain;
- never fetches evidence outside the Phase-2G-routed packet.

The AI Registry Key is one possible key among many and is never universal Phase-5 taxonomy authority.
