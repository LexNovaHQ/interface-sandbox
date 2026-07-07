# Phase 7 Data Privacy Architecture Package Contract

Status: `PACKAGE_CONTRACT_LAYER_1_LOCKED_RUNTIME_CUTOVER_PENDING`

This package replaces the old 34-field / 36-field split design with one integrated Phase 7 material field base.

## Locked design

- Material base: 150 `DAP.*` rows.
- Report spine: 17 lawyer-readable sections.
- Layer 1 must compile registry derivation rules before any source navigation, evidence extraction, model packet, compiler, or report work.
- The model may receive only bounded work packets prepared by deterministic layers.
- Existing roots remain compatibility outputs until downstream runtime cutover.

## Layer 1 mandatory compiler

Layer 1 emits `dap_registry_manifest` from `references/registry/FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml`.

Each compiled row must carry:

- `field_id`
- `profile_section`
- `field_family`
- `output_field`
- `mode`
- `source_basis`
- `conditions`
- `trigger_outcome`
- `exclude_fallback`
- `forbidden_inference`
- `lock_status`
- `material_section_id`
- `material_section_title`
- `material_subsection_id`
- `registry_family`
- `deterministic_prefill_eligible`
- `model_packet_family`
- `evidence_atom_requirements`
- `limitation_trigger`
- `missing_proof_trigger`
- `legal_firewall`

## Runtime status

Do not switch the Phase 7 runtime entrypoint yet. Layer 1 and the package contract are foundation only. Layers 2-9 must be built before runtime cutover.
