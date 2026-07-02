# 00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED

## Universal runtime kernel for Agent 3

This file governs `agent_3_target_feature` only when assembled with `AGENT3_RUNTIME_BINDING_PACKET.yaml` and an active phase prompt.

The backend phase contract is the canonical permission source. Prompt text cannot expand backend read or write authority.

## Runtime execution rule

1. Read the runtime binding packet before the active module prompt.
2. Execute only the active phase selected by the backend runner.
3. Read only artifacts listed in the backend phase contract for that phase.
4. Write only artifacts listed in the backend phase contract for that phase.
5. Save material artifacts before forensic artifacts.
6. Do not emit downstream objects or renderer/final handoff artifacts.

## Agent 3 active scope

Agent 3 owns:

- `M7_TARGET_PROFILE`
- `M7_TARGET_PROFILE_FORENSICS`
- `M8_FEATURE_CANDIDATE_INVENTORY`
- `M8_TARGET_FEATURE_PROFILE`
- `M8_TARGET_FEATURE_PROFILE_FORENSICS`

Agent 3 does not own M6, M9, M10, M11, M12, compiler, or renderer work.

## M7 read authority

M7 is profile-bucket only.

M7 may read only:

- `source_discovery_handoff`
- `m7_deterministic_legal_signal_overlay`
- `lossless_family__T0_ROOT`
- `lossless_family__T1_IDENTITY`
- `lossless_family__T2_LEGAL_IDENTITY`
- `lossless_family__T3_OPERATOR_ENTITY`
- `lossless_family__T4_SUPPORTING_IDENTITY`

M7 must not read or request:

- `legal_cartography_index`
- any artifact whose name starts with `lossless_family__L`
- `source_discovery_handoff.bucket_family_index.legal_governance_profile_urls.families`
- legal/governance route buckets
- raw legal/governance source text

M7 must not block because legal/governance lossless artifacts are absent. Missing deterministic overlay values become controlled field statuses and limitations.

## M7 deterministic overlay rule

`m7_deterministic_legal_signal_overlay` is the only M9-derived material available to M7.

M7 may use it only for:

- `target_identity.legal_entity_name`
- `jurisdiction_notice.governing_law`
- `jurisdiction_notice.courts_venue`

M7 must not derive those values directly from legal/governance artifacts.

## M8 read authority

M8 may read target profile artifacts and product/activity lossless families as authorized by the backend phase contract.

M8 must not use M7 to backdoor legal/governance source material.

## Runtime stop rules

If the binding packet, active prompt, validator, or reference material conflicts with the backend phase contract, the backend phase contract wins.

If a required field cannot be supported from allowed artifacts, emit a controlled limitation rather than requesting forbidden upstream legal material.
