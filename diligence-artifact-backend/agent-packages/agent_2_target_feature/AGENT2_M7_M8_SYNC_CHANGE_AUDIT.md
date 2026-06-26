# AGENT 2 M7/M8 SYNC CHANGE AUDIT

## Scope honored

- M7 and M8 remain separate module files.
- No backend files were changed in this packet step.
- No module was merged.
- No one-shot four-artifact output was introduced.
- M7 emits/saves `target_profile` first and `target_profile_forensics` second.
- M8 emits/saves `target_feature_profile` first and `target_feature_profile_forensics` second.

## M7 final sync patch

Patched only stale execution-step and source-universe references left after Step 1:

- `M7.S1B.C3` now identifies live backend family-index inputs and permitted cross-route product-family support under `GRK.004`.
- `M7.S4A.C3` now includes product-family artifacts only for permitted M7 wrapper/business support; not for feature mechanics/archetypes/surfaces/data/exposure.
- `M7.S5.C2` now consumes the Target Identity extraction capsule derived from live target-family artifacts and narrow legal exception context.
- `M7.S6.C2` now consumes the Jurisdiction & Notice extraction capsule derived from live target-family artifacts and narrow legal exception context.
- `M7.S7.C2` now consumes the Business Context extraction capsule and permitted product-family support only under `GRK.004`.
- `M7.S8.C2` now consumes the Product / Service Wrapper extraction capsule and permitted product-family support only under `GRK.004`.
- `M7.S9.C2` now consumes completed capsule + live family metadata + family-artifact limitation branches, not legacy route-execution structures.

## M8 sync patch

Patched M8 separately while preserving the packet’s 12-field routing-first material activity card and separate forensic output.

- Added `CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml` as governing import.
- Replaced obsolete M6 input references with:
  - `source_discovery_handoff.bucket_family_index.product_activity_profile_urls.families`
  - `lossless_family__P1_PRODUCT` through `lossless_family__P5_ENTERPRISE_PRICING`
  - family-artifact limitation branches where present.
- Preserved locked M7 context as prerequisite input.
- Updated archetype execution to all 11 locked codes: `UNI`, `DOE`, `JDG`, `CMP`, `CRT`, `RDR`, `ORC`, `TRN`, `SHD`, `OPT`, `MOV`.
- Preserved all 10 locked surface tokens.
- Added classification-matrix authority for archetype/surface conditions, `trigger_if`, `trigger_with_limitation_if`, `exclude_if`, forbidden-inference checks, and evidence minimums.
- Updated M8.T4 to a classification ledger contract for both `archetype_derivation_ledger[]` and `surface_token_derivation_ledger[]`.
- Preserved the rule that `target_feature_profile` contains only material activity fields; source/provenance/forensic rows stay in `target_feature_profile_forensics`.

## Deliberate non-changes

The following were not changed because they belong to Step 3 / backend orchestration:

- `00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED.md`
- `00_VALIDATOR_RULES_INTEGRATED.md`
- `00_TERMINAL_RECEIPT_RULES_INTEGRATED.md`
- backend phase contracts
- backend validators
- backend runner
- terminal bridge

## Verification checks

- M7 no longer requires legacy route-inventory/route-execution branches for field application.
- M8 no longer requires legacy `bucket_handoff`, `discovered_route_inventory`, `route_execution_ledger`, or `source_coverage_gates` as inputs.
- Remaining mentions of legacy branches are only negative/do-not-use clauses.
- Main full prompt packet was rebuilt with the updated M7 and M8 modules.
