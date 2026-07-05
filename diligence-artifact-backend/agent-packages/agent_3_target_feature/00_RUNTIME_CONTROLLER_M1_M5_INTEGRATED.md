# Target and Activity Profile Runtime Controller

## Runtime kernel

This file governs `agent_3_target_feature` only when assembled with `AGENT3_RUNTIME_BINDING_PACKET.yaml` and an active phase prompt.

The backend phase contract is the canonical permission source. Prompt text cannot expand backend read or write authority.

## Runtime execution rule

1. Read the runtime binding packet before the active phase prompt.
2. Execute only the active phase selected by the backend runner.
3. Read only artifacts listed in the backend phase contract for that active phase.
4. Write only artifacts listed in the backend phase contract for that active phase.
5. Save material artifacts before forensic artifacts.
6. Do not emit downstream objects, final handoff artifacts, renderer payloads, Qualified Review artifacts, or same-chat receipts in backend mode.

## Active phase ownership

This package currently covers these compatibility surfaces until each phase is migrated into its own phase folder:

- Target Profile Review
- Target Profile Forensics
- Activity Profile Review
- Activity Profile Forensics

The package does not own Source Discovery, Legal Cartography and Index, Data Provenance Profile, Exposure Profile, Operator Challenge, Compiler, Normalized Report Renderer, or Qualified Review.

## Target Profile Review read authority

Target Profile Review is target-family primary.

Target Profile Review may read only:

- `source_discovery_handoff`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`
- `legal_signal_derivation_profile`

Target Profile Review must not read or request:

- `legal_cartography_index`
- `m7_deterministic_legal_signal_overlay`
- any artifact whose name starts with `lossless_family__L`
- `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families`
- legal/governance route buckets
- raw legal/governance source text
- product/activity family artifacts
- data-provenance family artifacts

Target Profile Review must not block because legal/governance lossless artifacts are absent. Missing or limited direct legal signal rows become controlled field statuses and limitation rows.

## Direct legal signal rule

`legal_signal_derivation_profile` is the only Legal Cartography and Index-derived material available to Target Profile Review.

Target Profile Review may use it only for owned legal notice and jurisdiction signal rows:

- `LGC.NOT.010`
- `LGC.NOT.011`
- `LGC.NOT.012`
- `LGC.NOT.013`
- `TP.JUR.003`
- `TP.JUR.004`
- `TP.JUR.005`
- `TP.JUR.007`
- `TP.JUR.008`

Target Profile Review must not use `privacy_grievance_contact_signal_map` or `consent_manager_signal_map` for material derivation.

Target Profile Review must treat direct signal rows as bounded field signals, not legal advice, not legal sufficiency, and not permission to inspect legal-family source text.

## Direct legal signal status handling

```text
DERIVED -> use value only if the target_profile schema permits.
DERIVED_WITH_LIMITATION -> use value only with target_profile_limitations entry.
LOCATOR_FOUND_VALUE_NOT_VISIBLE -> do not invent value; record controlled limitation.
SOURCE_NOT_PUBLIC -> do not invent value; record controlled limitation.
SOURCE_CONFLICT -> do not choose a winner; record conflict limitation.
NOT_APPLICABLE_CONTEXTUAL -> controlled not applicable where schema permits.
NOT_DERIVED_AFTER_EXHAUSTIVE_SCAN -> do not invent value; record controlled limitation.
```

## Activity Profile Review read authority

Activity Profile Review may read target profile artifacts, feature candidate inventory, and product/activity families as authorized by the backend phase contract.

Activity Profile Review must not use Target Profile Review to backdoor legal/governance source material.

## Runtime stop rules

If the binding packet, active prompt, validator, or reference material conflicts with the backend phase contract, the backend phase contract wins.

If a required field cannot be supported from allowed artifacts, emit a controlled limitation rather than requesting forbidden upstream legal material.
