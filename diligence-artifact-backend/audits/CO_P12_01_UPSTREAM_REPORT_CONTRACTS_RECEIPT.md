# CO-P12-01 — Upstream Report Contract Prerequisites

## Execution receipt

| Field | Value |
|---|---|
| Repository | `LexNovaHQ/interface-sandbox` |
| Branch | `domain-gate-v0-preflight` |
| Change order | `CO-P12-01` |
| Bundle | `CO_P12_01_UPSTREAM_REPORT_CONTRACTS_v1_2026-07-12.zip` |
| Date | `2026-07-12` |
| Pre-change head | `daf7f800399137dfc7874104b23ff493e3583cd8` |
| Post-code marker head | `274e5d3ef604382faefc036d8ca8e618db4e4a3a` |
| Rollback branch | `backup/domain-gate-v0-preflight-pre-co-p12-01-20260712` |
| Commits from pre-head to marker | `34` |
| Branch relation | `ahead 34, behind 0` |

## Result

**Code and contract application: COMPLETE.**

**Full local/npm validation: NOT EXECUTED IN THIS CONNECTOR SESSION.**

The second statement is not a defect waiver. It means this receipt records the applied remote branch state and installed acceptance machinery without falsely claiming that the repository's executable npm suite has run successfully.

## Locked architecture applied

### Phase 12 doctrine

- Governing rule: **Upstream phases decide. Phase 12 arranges.**
- Phase 12 is locked as a deterministic, zero-judgment report projection compiler.
- Client-facing terminology uses `Sector`, `Primary Sector`, `Sector Classification Profile`, `Capability Overlays`, `Regulatory Context Overlays`, and `Sector-Specific Control Obligations`.
- Internal `domain_*` identifiers remain unchanged.
- Future direct-profile artifact loading and Phase 2G removal are locked as one atomic Phase 12 rebuild cutover.
- The present change order does not falsely claim that the Phase 12 compiler/renderer rebuild is complete.

### Phase 5 Behavior Class cutover

- Active material paths use:
  - `behavior_class_codes`
  - `behavior_class_derivation_basis`
  - `behavior_class_vocabulary`
- Primary and capability-overlay classification blocks remain separate.
- Behavior Class and Surface selections are validated independently for each block and package.
- Regulatory overlays remain excluded from activity-classification blocks.
- Retired `archetype_*` material paths are rejected; no permanent dual-schema adapter was introduced.

### Phase 10 deterministic report row

- Global execution identity remains `registry_row_key = package_id::Threat_ID`.
- Raw `Threat_ID` is not treated as global identity and is not globally deduplicated.
- The deterministic registry spine includes the complete report-facing registry facts and execution custody.
- Registry ingestion may read physical `Archetype` only as an ingestion-boundary alias; canonical material output uses `Behavior_Class`.
- The semantic model is restricted to the evidence-application allowlist and cannot emit or alter registry facts.
- Accepted batches, workpad, controlled profile, and triggered profile preserve the complete row and custody.
- `Pain_Tier`, `Pain_Category`, and `Pain_Depth` are mandatory and mounted Registry-Key validated before Phase 10 continues.
- Registry-key version, threat-registry version, severity contract, and fingerprints are carried into the manifest/execution identity.
- `Compliance_Framework` is not inferred from authority prose when the physical registry has no separate column; the package schema limitation is recorded instead.

### Phase 11 compiler handoff

Phase 12 admission accepts only:

```text
PASS
PASS_WITH_LIMITATION
```

and additionally requires:

```text
schema_version = challenge_gate.v4.operator_challenge
compiler_handoff_allowed = true
layer_status.layer_3 = COMPLETE
reinvestigation_dispatch_required != true
final_gate_fingerprint = non-empty
```

Legacy lock aliases, pending reinvestigation, controlled failure, and Phase 11 internal semantic/reinvestigation ledgers are not compiler admission authorities.

## Schema/version markers installed

```text
ACTIVITY_PROFILE_REVIEW_CONTRACT_v9_BEHAVIOR_CLASS_CANONICAL
activity_profile_material.v9.behavior_class
activity_taxonomy_resolver.v2.behavior_class_canonical
phase5_classification_inventory.v2.behavior_class
exposure_registry_route_plan.v4.behavior_class_package_scoped
active_threat_registry_manifest.v3.mounted_key_severity
phase10_report_row.v1.complete_registry_spine
m11_batch_registry_ledger.v4.complete_registry_spine.accepted
exposure_registry_workpad.v4.complete_registry_spine
exposure_registry_controlled_profile.v4.complete_report_row
exposure_registry_triggered_profile.v4.complete_report_row
phase10_downstream_compatibility.v4.phase11_exact_gate
```

## Files changed through the marker head

### Added

- `.github/workflows/co-p12-01-validation.yml`
- `diligence-artifact-backend/audits/CO_P12_01_CODE_CUTOVER_MARKER.md`
- `diligence-artifact-backend/scripts/check-co-p12-01.mjs`
- `diligence-artifact-backend/src/phases/05-activity-profile-review/README.md`
- `diligence-artifact-backend/src/phases/10-exposure-profile/README.md`
- `diligence-artifact-backend/src/phases/12-normalized-compiler/PHASE12_REPORT_PROJECTION_AUTHORITY.md`
- `diligence-artifact-backend/src/phases/12-normalized-compiler/README.md`

### Modified

- `diligence-artifact-backend/agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md`
- `diligence-artifact-backend/agent-packages/agent_3_target_feature/03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md`
- `diligence-artifact-backend/agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md`
- `diligence-artifact-backend/agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md`
- `diligence-artifact-backend/agent-packages/agent_5_exposure_registry/AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11.md`
- `diligence-artifact-backend/package.json`
- `diligence-artifact-backend/scripts/check-activity-taxonomy-resolver.mjs`
- `diligence-artifact-backend/src/phases/05-activity-profile-review/activity-profile-review.contract.js`
- `diligence-artifact-backend/src/phases/05-activity-profile-review/activity-profile.constants.js`
- `diligence-artifact-backend/src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js`
- `diligence-artifact-backend/src/phases/10-exposure-profile/active-threat-registry-manifest.js`
- `diligence-artifact-backend/src/phases/10-exposure-profile/m11-deterministic-system-m11v2.js`
- `diligence-artifact-backend/src/phases/10-exposure-profile/m11-orchestrator-m11v2.js`
- `diligence-artifact-backend/src/phases/10-exposure-profile/phase10-classification-inventory.validator.js`
- `diligence-artifact-backend/src/phases/10-exposure-profile/phase10-classification-routing.js`
- `diligence-artifact-backend/src/phases/10-exposure-profile/phase10-semantic-finalization.js`
- `diligence-artifact-backend/src/phases/12-normalized-compiler/phase10-downstream-compatibility.js`
- `diligence-artifact-backend/src/runtime/domain-gate/activity-taxonomy.resolver.js`

No production source file was deleted or archived by this change order.

## Installed validation commands

Run from `diligence-artifact-backend`:

```powershell
npm ci
npm run check:phase5:behavior-class-cutover
npm run check:phase10:report-row-custody
npm run check:phase11:compiler-exact-gate
npm run check:p12:co1
npm run check:phase5-activity-profile
npm run check:phase10-full
npm run check:phase11-full
npm run check:normalized
npm run check
```

A GitHub Actions workflow is installed for the dedicated CO-P12-01 checks. It is configured for pull requests targeting `domain-gate-v0-preflight` and manual dispatch; no workflow run is claimed in this receipt.

## Next boundary

CO-P12-01 closes the upstream prerequisites only. The next authorized Phase 12 job is the actual zero-judgment compiler rebuild, including the atomic direct-profile loader / Phase 2G removal and renderer projection cleanup.