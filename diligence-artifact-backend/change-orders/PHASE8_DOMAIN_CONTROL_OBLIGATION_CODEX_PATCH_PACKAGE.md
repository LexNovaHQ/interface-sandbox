# PHASE 8 — DOMAIN CONTROL OBLIGATION PROFILE
## CODEX MECHANICAL PATCH PACKAGE

**Document status:** LOCKED EXECUTION SPECIFICATION  
**Change order:** CO-1  
**Target repository:** `LexNovaHQ/interface-sandbox`  
**Target branch:** `domain-gate-v0-preflight`  
**Runtime root:** `diligence-artifact-backend/`  
**Merge target:** NONE — do not merge to `main`  
**Validation policy:** remote/source audit first; full local validation only after the complete Phase 8 build and all mechanical cutovers are finished

---

# 1. PURPOSE

This package is the complete mechanical execution authority for inserting a new independent **Phase 8 — Domain Control Obligation Profile** into the active central pipeline.

It separates:

1. **Substantive Phase 8 construction**, which must be designed and reviewed deliberately; and
2. **Mechanical Codex surgery**, which is limited to exact path moves, central-contract wiring, routing activation, permissions, downstream read propagation, registry-field surgery, and validation registration.

Codex has no authority to redesign the Phase 8 architecture, invent substantive rules, alter model ownership of material fields, change Phase 7 DAP logic, or expand the evidence boundary.

This package must be read as a whole before any mechanical job is executed.

---

# 2. LOCKED ARCHITECTURE

## 2.1 Final central phase sequence

| Sequence | Central phase ID | Public label | Internal jobs |
|---:|---|---|---|
| 1 | `SOURCE_DISCOVERY` | Source Discovery | existing |
| 2 | `CARTOGRAPHY_INDEX` | Cartography and Index | existing |
| 3 | `TARGET_PROFILE_REVIEW` | Target Profile Review | existing |
| 4 | `TARGET_PROFILE_FORENSICS` | Target Profile Forensics | existing |
| 5 | `ACTIVITY_PROFILE_REVIEW` | Activity Profile Review | existing |
| 6 | `ACTIVITY_PROFILE_FORENSICS` | Activity Profile Forensics | existing |
| 7 | `DATA_PROVENANCE_PROFILE` | Data Provenance Profile | existing Layer 4 + Layer 5 |
| **8** | **`DOMAIN_CONTROL_OBLIGATION_PROFILE`** | **Domain Control Obligation Profile** | **`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY`, `DOMAIN_CONTROL_OBLIGATION_PROFILE`** |
| 9 | `DATA_PROVENANCE_FORENSICS` | DAP Forensics | existing |
| 10 | `EXPOSURE_PROFILE` | Exposure Profile | `M11` |
| 11 | `OPERATOR_CHALLENGE` | Operator Challenge | `M12` |
| 12 | `COMPILER` | Compiler | existing compiler + renderer |
| 13 | `QUALIFIED_REVIEW` | Qualified Review | existing |
| 14 | `DILIGENCE_QA_COMPLETE` | Diligence-QA Complete | existing |
| 15 | `QUALIFIED_REVIEW_SUBMISSION` | Qualified Review Submission | existing |
| 16 | `ASSEMBLY_ENGINE` | Assembly Engine | existing |

Established internal job IDs such as `M11`, `M12`, `NORMALIZED_COMPILER`, `NORMALIZED_REPORT_RENDERER`, and `QUALIFIED_REVIEW` remain unchanged.

## 2.2 Locked serial job chain

```text
M8_TARGET_FEATURE_PROFILE_FORENSICS
  -> DATA_PROVENANCE_PROFILE_LAYER4
  -> DATA_PROVENANCE_PROFILE_LAYER5
  -> DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY
  -> DOMAIN_CONTROL_OBLIGATION_PROFILE
  -> DATA_PROVENANCE_PROFILE_FORENSICS
  -> M11
  -> M12
  -> NORMALIZED_COMPILER
  -> NORMALIZED_REPORT_RENDERER
  -> QUALIFIED_REVIEW
  -> DILIGENCE_QA_COMPLETE
  -> QUALIFIED_REVIEW_SUBMISSION
  -> ASSEMBLY_ENGINE
  -> COMPLETE
```

Phase 8 executes after Phase 7, but it has **no substantive dependency on Phase 7 DAP outputs**. Phase 7 completion is only the serial scheduling gate.

## 2.3 Phase 8 jobs and artifacts

### Layer 1 job

```text
DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY
```

Writes only:

```text
domain_control_obligation_candidate_inventory
```

Model usage:

```text
NONE — deterministic candidate inventory
```

### Layer 2 job

```text
DOMAIN_CONTROL_OBLIGATION_PROFILE
```

Writes only:

```text
domain_control_obligation_profile
```

Model usage:

```text
MODEL_JSON_ONLY — model owns every material derivation field
```

## 2.4 Phase 8 source layers

Allowed obligation-definition source layers:

```text
PRIMARY
CAPABILITY_OVERLAY
```

Forbidden as an obligation-definition source layer:

```text
REGULATORY_OVERLAY
```

Regulatory overlays enrich existing obligation rows through `regulatory_overlay_refs`. They never create separate or duplicate obligation rows.

---

# 3. EVIDENCE AND ROUTING DOCTRINE

## 3.1 Sole routing authority

`P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY` remains the only routing authority.

Both Phase 8 jobs must enter through:

```text
phase_routing_manifest
ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE
2E_BUCKET_DOMAIN_CONTROL_OBLIGATION
```

## 3.2 Evidence rule

```text
LOSSLESS EVIDENCE IS PRIMARY EVIDENCE.
P2E IS THE MANDATORY NAVIGATION MAP INTO THAT EVIDENCE.
DIRECT LOSSLESS EVIDENCE IS NOT A FALLBACK.
FREE-CORPUS READING IS FORBIDDEN.
```

The P2G 2E route defines the maximum evidence universe. Package catalogs and the P2E navigation index select an obligation-specific subset inside that universe. Neither the resolver nor the model may expand the read ceiling.

## 3.3 Phase 8 allowed preceding material context

```text
target_profile
domain_derivation_profile
target_feature_profile
```

## 3.4 Phase 8 allowed runtime context

```text
domain_selection_profile
active_run_package_manifest
```

## 3.5 Phase 8 bounded legal context

```text
legal_cartography_index
legal_signal_derivation_profile
```

These are navigation and bounded legal-context inputs. They are not permission to make legal-applicability or compliance conclusions.

## 3.6 Phase 8 forbidden reads

```text
target_profile_forensics
target_feature_profile_forensics
dap_forensics_profile
exposure_registry_profile_forensics
all Phase 7 DAP material artifacts
all Phase 7 DAP validation artifacts
all M11 exposure artifacts
challenge_gate
compiler artifacts
qualified-review artifacts
```

No Phase 8 job may read a forensic profile.

---

# 4. SOURCE-AUTHORITY HIERARCHY

The following authority hierarchy is locked:

```text
Mounted Registry Key
  -> owns individual obligation definitions and substantive obligation attributes

Installed obligation catalog
  -> owns obligation-family navigation metadata, route codes, locator families,
     legal document types, shell targets, and reading priority

P2E domain_control_obligation_navigation_index
  -> owns navigation into indexed evidence

Diligence Field Derivation Registry (FDR)
  -> owns field derivation modes, conditions, fallback rules,
     forbidden inferences, and validation semantics
```

The obligation catalog does not own individual obligation IDs, obligation locus, or obligation trigger timing unless the catalog schema is explicitly expanded in a later approved change order. Phase 8 must use the mounted Registry Key as the source of those values.

---

# 5. MODEL VERSUS DETERMINISTIC AUTHORITY

## 5.1 Phase 8 Layer 1

Layer 1 is deterministic.

It may:

- resolve mounted primary and capability-overlay packages;
- discover package keys automatically;
- load matching obligation catalogs;
- enumerate installed key-defined obligations;
- join each obligation to its catalog family;
- match `applies_when.behavior_class` and `applies_when.surface` against Phase 5 package-scoped classifications;
- identify linked activities and matched tokens;
- attach P2E navigation routes;
- emit candidate shells;
- record mechanical limitations.

It must not derive Layer 2 material fields.

## 5.2 Phase 8 Layer 2

Layer 2 is a 100% model job for material derivation.

The model owns:

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
limitation
```

The backend must not author, silently complete, substitute, or rewrite a missing material field.

## 5.3 Deterministic compiler ownership

The deterministic compiler may only stamp or reconcile mechanical fields:

```text
schema_version
run_id
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
mounted_taxonomy_ref
regulatory_overlay_refs
validation_summary
lock_status
```

The compiler may normalize envelope shape and reject invalid model output. It may not replace model-owned material fields.

## 5.4 Validator ownership

The validator proves:

- the obligation exists in an installed mounted key;
- the family exists in the associated obligation catalog;
- the candidate was emitted by Layer 1;
- linked activities exist in Phase 5;
- matched behavior and surface tokens belong to the correct package-scoped classification block;
- all material fields are present and substantive;
- evidence stays inside the P2G/P2E packet;
- no unknown package, obligation, family, activity, or route was introduced;
- no legal-applicability or compliance verdict appears;
- regulatory overlays enrich rows only and never create duplicates;
- no DAP or forensic input was used;
- mechanical fields match the deterministic source packet.

---

# 6. OPTION A — REGULATORY OVERLAY ENRICHMENT

Regulatory overlays enrich existing obligation rows only.

The deterministic compiler may stamp:

```json
{
  "regulatory_overlay_refs": [
    {
      "overlay_id": "example-overlay",
      "matched_frameworks": ["EXAMPLE_FRAMEWORK"],
      "overlay_status": "CANDIDATE_ONLY"
    }
  ]
}
```

A reference is emitted only where:

1. the overlay is mounted in `active_run_package_manifest.regulatory_overlays`;
2. the overlay key declares a framework link;
3. the model-derived `authority_dependency` contains the same framework token; and
4. no legal-applicability conclusion is asserted.

A regulatory-overlay reference does not mean:

- the overlay independently created the obligation;
- the referenced law is legally applicable;
- the target satisfies or breaches the obligation;
- a regulator has jurisdiction;
- a control is legally adequate.

---

# 7. SUBSTANTIVE BUILD PRECONDITIONS

The following substantive files must exist and be reviewed before the central mechanical runtime cutover begins:

```text
src/phases/08-domain-control-obligation-profile/
  domain-control-obligation.constants.js
  domain-control-obligation-candidate-inventory.contract.js
  domain-control-obligation-profile.contract.js
  domain-control-obligation-candidate-inventory.runner.js
  domain-control-obligation-profile.runner.js
  index.js
  README.md
  services/domain-control-obligation-taxonomy.resolver.js
  services/domain-control-obligation-candidate-inventory.builder.js
  services/domain-control-obligation-profile.compiler.js
  validators/domain-control-obligation-candidate-inventory.validator.js
  validators/domain-control-obligation-profile.validator.js

agent-packages/agent_8_domain_control_obligation/
  00_RUNTIME_CONTROLLER_PHASE8.md
  01_DOMAIN_CONTROL_OBLIGATION_PROFILE_BACKEND.md
  02_PHASE8_VALIDATOR_RULES.md
  AGENT8_BACKEND_OUTPUT_CONTRACT.md

scripts/check-phase8-domain-control-obligation-contract.mjs
scripts/check-phase8-domain-control-obligation-layer1.mjs
scripts/check-phase8-domain-control-obligation-layer2.mjs
scripts/check-phase8-domain-control-obligation-runtime-boundary.mjs
```

Codex must abort the central cutover if these files are missing.

---

# 8. FDR EXACT PATCH SPECIFICATION

File:

```text
references/registry/Diligence_Field_Derivation_Registry.yml
```

## 8.1 Surgical source-basis corrections

Change only the `source_basis` values for the following existing fields.

### `DCO.OBL.001` — Obligation ID

Replace the catalog-as-ID-authority wording with:

```yaml
source_basis: mounted Registry Key obligation entries resolved from active_run_package_manifest; obligation catalog family join and P2E navigation index provide route context only
```

### `DCO.OBL.006` — Obligation locus

Replace the catalog-as-locus-authority wording with:

```yaml
source_basis: mounted Registry Key obligation entry obligation_locus
```

### `DCO.OBL.007` — Obligation trigger timing

Replace the catalog-as-timing-authority wording with:

```yaml
source_basis: mounted Registry Key obligation entry obligation_trigger_timing
```

## 8.2 Add the Option A field rule

Add one locked field immediately after the active DCO obligation-linkage fields and before control-posture fields:

```yaml
- field_id: DCO.OBL.008
  profile_section: Domain Control Obligation Profile
  field_family: Obligation Linkage
  output_field: Regulatory overlay references
  covers: Mounted overlay; matched framework token; candidate-only overlay status
  mode: JOIN
  source_basis: active_run_package_manifest.regulatory_overlays + mounted Registry Key regulatory_overlay framework links + model-derived authority_dependency
  conditions: C1 regulatory overlay is mounted as candidate/review context; C2 obligation authority_dependency contains a framework token linked by the overlay; C3 reference remains contextual and does not assert legal applicability.
  trigger_outcome: DERIVED_IF C1 AND C2. NO_VALUE_IF no mounted-overlay/framework intersection.
  exclude_fallback: EXCLUDE_IF the result would create a duplicate obligation row, independent regulatory obligation source, legal-applicability conclusion, regulator-jurisdiction conclusion, satisfaction conclusion, or breach conclusion. FALLBACK_IF overlay metadata is malformed -> no overlay reference and record a mechanical limitation only if material.
  forbidden_inference: Do not treat an overlay reference as applicability, satisfaction, breach, regulator jurisdiction, or an independent obligation source.
  lock_status: LOCKED
```

No other FDR row may change in Mechanical Job A.

---

# 9. DOWNSTREAM FOLDER RENUMBERING MAP

Use `git mv` only.

```text
src/phases/08-data-provenance-forensics
  -> src/phases/09-data-provenance-forensics

src/phases/09-exposure-profile
  -> src/phases/10-exposure-profile

src/phases/10-operator-challenge
  -> src/phases/11-operator-challenge

src/phases/11-normalized-compiler
  -> src/phases/12-normalized-compiler

src/phases/12-qualified-review
  -> src/phases/13-qualified-review

src/phases/13-diligence-qa-complete
  -> src/phases/14-diligence-qa-complete

src/phases/14-qualified-review-submission
  -> src/phases/15-qualified-review-submission

src/phases/15-assembly-engine
  -> src/phases/16-assembly-engine
```

The new substantive Phase 8 folder remains:

```text
src/phases/08-domain-control-obligation-profile
```

Internal job IDs and artifact names are not renumbered.

Rename-induced edits may update import paths, active path assertions, implementation-registry folder strings, and documentation path references. They may not change downstream business logic.

---

# 10. CENTRAL CONTRACT AND RUNTIME PATCH SPECIFICATION

## 10.1 `central-phase.contract.js`

Add:

```js
phase(
  8,
  "DOMAIN_CONTROL_OBLIGATION_PROFILE",
  "Domain Control Obligation Profile",
  [
    "DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY",
    "DOMAIN_CONTROL_OBLIGATION_PROFILE"
  ],
  ["DATA_PROVENANCE_PROFILE_LAYER5"],
  [
    "domain_control_obligation_candidate_inventory",
    "domain_control_obligation_profile"
  ]
)
```

Shift the prior phases 8–15 to 9–16.

Change DAP Forensics execution dependency from:

```text
DATA_PROVENANCE_PROFILE_LAYER5
```

to:

```text
DOMAIN_CONTROL_OBLIGATION_PROFILE
```

Do not rename established central phase IDs.

## 10.2 `pipeline.contract.js`

Add both internal job IDs to `INTERNAL_PIPELINE_JOB_IDS` between `DATA_PROVENANCE_PROFILE_LAYER5` and `DATA_PROVENANCE_PROFILE_FORENSICS`.

Add a Phase 8 agent-package root constant:

```js
const DCO_ROOT = "agent-packages/agent_8_domain_control_obligation";
```

Add a locked Layer 2 prompt-file array that uses the substantive Agent 8 package and the global blocking doctrine. Do not hardcode individual AI or fintech key files as universal prompt references.

Add a Phase 8 FDR reference array containing the active FDR only. Mounted keys and catalogs must be loaded dynamically by the resolver and passed in the runtime packet.

Add contracts equivalent to:

```js
DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY: {
  type: "deterministic",
  agent_id: "agent_8_domain_control_obligation",
  actor_id: "agent_8_domain_control_obligation",
  reads: PHASE2G_RUNTIME_ENTRY_READS,
  references: [],
  writes: ["domain_control_obligation_candidate_inventory"],
  next: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
  central_phase_id: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
  public_label: "Domain Control Obligation Profile",
  route_delivery_mode: "SOURCE_BUCKET_PROFILE",
  model_usage: "NONE_DETERMINISTIC",
  phase2g_route_id: "ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE",
  phase2e_navigation_required: true,
  profile_forensics_inputs_forbidden: true,
  dap_inputs_forbidden: true
}
```

```js
DOMAIN_CONTROL_OBLIGATION_PROFILE: {
  type: "model",
  agent_id: "agent_8_domain_control_obligation",
  actor_id: "agent_8_domain_control_obligation",
  prompt_files: PHASE8_DOMAIN_CONTROL_OBLIGATION_PROMPT_FILES,
  reads: PHASE2G_RUNTIME_ENTRY_READS,
  references: PHASE8_DOMAIN_CONTROL_OBLIGATION_REFERENCE_FILES,
  writes: ["domain_control_obligation_profile"],
  next: "DATA_PROVENANCE_PROFILE_FORENSICS",
  central_phase_id: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
  public_label: "Domain Control Obligation Profile",
  route_delivery_mode: "SOURCE_BUCKET_PROFILE",
  model_usage: "MODEL_JSON_ONLY_MATERIAL_FIELDS",
  candidate_inventory_required: true,
  material_fields_model_owned: true,
  mechanical_fields_backend_owned: true,
  mounted_taxonomy_ref_stamped_by_backend: true,
  regulatory_overlay_mode: "ENRICH_EXISTING_ROWS_ONLY",
  phase2e_navigation_required: true,
  profile_forensics_inputs_forbidden: true,
  dap_inputs_forbidden: true
}
```

Change:

```text
DATA_PROVENANCE_PROFILE_LAYER5.next
```

from:

```text
DATA_PROVENANCE_PROFILE_FORENSICS
```

to:

```text
DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY
```

Do not change Phase 7 DAP reads, writes, prompts, batches, gates, or validators.

Update the P2E contract marker:

```text
phase7b_derives_values_later
```

to:

```text
phase8_derives_values_later
```

## 10.3 `pipeline.service.js`

Update moved downstream import paths.

Import both Phase 8 runners from:

```text
src/phases/08-domain-control-obligation-profile/
```

Extend the local `JOB` object with:

```text
domainControlObligationCandidateInventory
  = DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY

domainControlObligationProfile
  = DOMAIN_CONTROL_OBLIGATION_PROFILE
```

Add explicit phase-owned dispatch branches before DAP Forensics.

Do not allow either job to fall through to the generic `contract.type === "model"` handler.

Add phase-owned runtime wrappers following existing routed phase-runner patterns:

- pass `run`, `internalJobId`, `contract`;
- inject `readArtifacts` through the existing runtime artifact service;
- inject `buildPrompt` and `callProvider` only into Layer 2;
- inject `saveArtifact` through the existing runtime artifact save path;
- save only declared writes;
- lock the job with the runner-returned lock status;
- advance using the contract `next` value;
- preserve central-phase event logging and persistence conventions.

Update status markers to state that Phase 8 is wired through P2G/P2E.

No deployment, environment, Firestore, Sheets, route, or public API logic may change.

## 10.4 `phase-registry.js`

Add the Phase 8 implementation entry:

```js
{
  order: 8,
  phase_id: "DOMAIN_CONTROL_OBLIGATION_PROFILE",
  folder: "08-domain-control-obligation-profile",
  public_label: "Domain Control Obligation Profile",
  implementation_status: "PHASE_RUNNER_CUTOVER_ACTIVE",
  runtime_owner: "src/runtime/services/pipeline.service.js",
  notes: "Deterministic obligation candidate inventory followed by model-derived material obligation/control profile. P2G/P2E routed; no DAP or forensic inputs."
}
```

Shift downstream `order` and `folder` values to 9–16 without altering their substantive notes except where the folder number or public phase sequence is explicitly referenced.

---

# 11. P2G ROUTE ACTIVATION SPECIFICATION

Files:

```text
src/phases/02-cartography-index/phase-routing.contract.js
src/phases/02-cartography-index/services/phase-route-runtime.reader.js
```

## 11.1 Route identity

Rename:

```text
ROUTE.PHASE7B.DOMAIN_CONTROL_OBLIGATION_PROFILE
```

to:

```text
ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE
```

Keep:

```text
2E_BUCKET_DOMAIN_CONTROL_OBLIGATION
```

The bucket name identifies the Phase 2E source bucket and must not be renumbered.

## 11.2 Route parent jobs

```js
parent_jobs: [
  "DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY",
  "DOMAIN_CONTROL_OBLIGATION_PROFILE"
]
```

## 11.3 Job-scoped derived profile

```js
job_scoped_derived_profiles: {
  DOMAIN_CONTROL_OBLIGATION_PROFILE: [
    "domain_control_obligation_candidate_inventory"
  ]
}
```

The candidate inventory is delivered only to the Layer 2 job.

## 11.4 Delivery modes

Both Phase 8 jobs use the source-bucket profile delivery mode. Layer 2 receives the same bounded source bucket plus the job-scoped candidate inventory.

## 11.5 Route context

```js
allowed_preceding_derived_profiles: [
  "target_profile",
  "domain_derivation_profile",
  "target_feature_profile"
]
```

```js
allowed_runtime_context: [
  "domain_selection_profile",
  "active_run_package_manifest"
]
```

```js
allowed_legal_artifacts: [
  "legal_cartography_index",
  "legal_signal_derivation_profile"
]
```

## 11.6 Forbidden route artifacts

The route must explicitly forbid:

```text
target_profile_forensics
target_feature_profile_forensics
dap_forensics_profile
exposure_registry_profile_forensics
all PHASE7_DAP_LAYER4_ARTIFACT_NAMES
all PHASE7_DAP_LAYER5_ARTIFACT_NAMES
```

## 11.7 Runtime reader map

Add both internal jobs to `P2G_RUNTIME_ROUTE_BY_JOB`, both mapped to `PHASE_ROUTE_IDS.domainControlObligation`.

Do not add a second routing authority or phase-specific direct artifact loader.

---

# 12. ARTIFACT AND AGENT PERMISSIONS SPECIFICATION

File:

```text
src/runtime/contracts/artifact-permissions.contract.js
```

## 12.1 Agent ID

Add:

```text
agent_8_domain_control_obligation
```

## 12.2 Artifact constants

Add known artifact names:

```text
domain_control_obligation_candidate_inventory
domain_control_obligation_profile
```

Add grouped constants equivalent to:

```js
DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT_NAMES
DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT_NAMES
DOMAIN_CONTROL_OBLIGATION_RUNTIME_ARTIFACT_NAMES
```

## 12.3 Known artifact registry

Add both artifacts to `ARTIFACT_NAMES` and therefore to `isKnownArtifactName` through the normal static-name route.

No dynamic Phase 8 artifact pattern is permitted in this change order.

## 12.4 Agent write permissions

```js
[AGENT_IDS.domainControlObligation]: [
  "domain_control_obligation_candidate_inventory",
  "domain_control_obligation_profile"
]
```

## 12.5 Agent read permissions

Authorize the Phase 8 agent only for the material/context artifacts P2G may deliver to it:

```text
target_profile
domain_derivation_profile
target_feature_profile
domain_selection_profile
active_run_package_manifest
domain_control_obligation_candidate_inventory
```

Source evidence and indexes remain router-loaded by `agent_2_cartography_index` through the P2G runtime reader. Do not grant the Phase 8 agent free-corpus access.

## 12.6 Internal job write permissions

```js
DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY: [
  "domain_control_obligation_candidate_inventory"
]
```

```js
DOMAIN_CONTROL_OBLIGATION_PROFILE: [
  "domain_control_obligation_profile"
]
```

## 12.7 Downstream minimal reads

Propagate only:

```text
domain_control_obligation_profile
```

Do not propagate:

```text
domain_control_obligation_candidate_inventory
```

Add the profile to Exposure, Operator Challenge, and Compiler minimal derived inputs through the existing P2G-derived arrays.

---

# 13. DOWNSTREAM HANDOFF WIRING SPECIFICATION

## 13.1 Phase 10 — Exposure Profile / M11

Add `domain_control_obligation_profile` to the P2G forward packet for M11.

The profile is context for:

- obligation identity;
- target-specific obligation context;
- visible control posture;
- missing proof;
- authority anchors;
- limitations.

It is not:

- an exposure verdict;
- proof of legal applicability;
- proof of breach;
- a substitute for the threat registry.

Substantive M11 prompt or evaluator changes must be completed and reviewed outside Codex mechanical wiring before the final cutover is accepted.

## 13.2 Phase 11 — Operator Challenge / M12

Add the locked profile to the derived-only M12 packet.

M12 may challenge:

- unsupported obligation linkage;
- control-posture overstatement;
- authority-dependency overstatement;
- hidden missing proof;
- regulatory-overlay misuse.

M12 must not rederive the Phase 8 profile.

## 13.3 Phase 12 — Compiler

Add the locked profile to the compiler derived-only packet.

No new rendered report section is authorized in this change order. The substantive compiler mapping must use the existing legal-control, exposure-control, review-route, and limitations structures unless a later explicit design decision authorizes a new section.

## 13.4 P2G arrays

Add the profile to:

- the M11 allowed preceding derived profile list;
- the M12 exact derived input list;
- the compiler exact derived input list.

Do not add the candidate inventory to any downstream array.

---

# 14. PACKAGE.JSON AND CHECK REGISTRATION

Add:

```json
"check:phase8-domain-control-obligation": "node scripts/check-phase8-domain-control-obligation-contract.mjs && node scripts/check-phase8-domain-control-obligation-layer1.mjs && node scripts/check-phase8-domain-control-obligation-layer2.mjs && node scripts/check-phase8-domain-control-obligation-runtime-boundary.mjs"
```

Register it in the primary `check` chain after Phase 7 checks and before the central Phase 9+ runtime checks.

Do not execute the full validation suite during a mechanical patch job. Full local validation remains the final project step after remote audit.

Allowed mechanical checks during Codex surgery:

```text
git diff --check
node --check only on files directly edited in that one mechanical job
rg-based exact search assertions
```

Do not run live model tests, smoke tests, deployment, or the full `npm run check` until explicitly instructed at the final validation stage.

---

# 15. ALLOWED-DIFF MANIFEST

## 15.1 CO-1 itself

```text
change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md
```

## 15.2 Substantive build paths

These are built and reviewed outside the mechanical jobs:

```text
src/phases/08-domain-control-obligation-profile/**
agent-packages/agent_8_domain_control_obligation/**
scripts/check-phase8-domain-control-obligation-*.mjs
approved Phase 10/11/12 substantive handoff files
```

## 15.3 Mechanical Job A

```text
references/registry/Diligence_Field_Derivation_Registry.yml
```

## 15.4 Mechanical Job B

```text
src/phases/08-data-provenance-forensics/** -> src/phases/09-data-provenance-forensics/**
src/phases/09-exposure-profile/** -> src/phases/10-exposure-profile/**
src/phases/10-operator-challenge/** -> src/phases/11-operator-challenge/**
src/phases/11-normalized-compiler/** -> src/phases/12-normalized-compiler/**
src/phases/12-qualified-review/** -> src/phases/13-qualified-review/**
src/phases/13-diligence-qa-complete/** -> src/phases/14-diligence-qa-complete/**
src/phases/14-qualified-review-submission/** -> src/phases/15-qualified-review-submission/**
src/phases/15-assembly-engine/** -> src/phases/16-assembly-engine/**
```

Rename-induced exact path replacements are allowed in active imports, check scripts, and active documentation. No semantic edits are allowed in moved phase implementations.

## 15.5 Mechanical Job C

```text
src/runtime/contracts/central-phase.contract.js
src/runtime/contracts/pipeline.contract.js
src/runtime/services/pipeline.service.js
src/phases/phase-registry.js
```

## 15.6 Mechanical Job D

```text
src/phases/02-cartography-index/phase-routing.contract.js
src/phases/02-cartography-index/services/phase-route-runtime.reader.js
src/runtime/contracts/artifact-permissions.contract.js
```

## 15.7 Mechanical Job E

```text
src/runtime/contracts/artifact-permissions.contract.js
src/phases/02-cartography-index/phase-routing.contract.js
src/runtime/contracts/pipeline.contract.js
package.json
active Phase 10/11/12 read-contract files explicitly identified by preflight search
active validation aggregators explicitly identified by preflight search
```

If Codex discovers a required file outside these classes, it must stop and report the file and exact dependency. It must not widen scope silently.

---

# 16. FORBIDDEN-DIFF MANIFEST

Unless separately built and approved as substantive work, Codex must not alter:

```text
src/phases/07-data-provenance-profile/**
Phase 7 DAP prompts
Phase 7 DAP batch contracts
Phase 7 DAP validators
P2E builder or P2E semantic/index generation logic
AI Registry Key obligation content
FinTech Registry Key obligation content
any installed obligation catalog content
threat registry content
source discovery logic
target profile logic
Phase 5 material derivation logic
Phase 5 model/deterministic ownership
frontend or renderer UI layout
database schema
environment configuration
cloud/deployment files
public API routes
main branch
```

Codex must not:

- invent a new routing authority;
- read artifacts directly around P2G;
- add DAP inputs to Phase 8;
- add forensic inputs to Phase 8;
- create regulatory-overlay obligation rows;
- hardcode AI or fintech as universal Phase 8 authority;
- add new legal citations;
- change existing legal citations;
- determine legal applicability;
- determine compliance;
- rewrite model-owned material fields deterministically;
- add a new rendered report section;
- merge or deploy.

---

# 17. REQUIRED SEARCH ASSERTIONS

After the relevant mechanical jobs, the following assertions must hold.

## 17.1 Retired Phase 7B naming

No active runtime/contract file may contain:

```text
ROUTE.PHASE7B.DOMAIN_CONTROL_OBLIGATION_PROFILE
phase7b_derives_values_later
PHASE7B_DOMAIN_CONTROL_OBLIGATION
```

Historical discussion under the change-order package is exempt.

## 17.2 New Phase 8 naming

Active runtime must contain:

```text
ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE
DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY
DOMAIN_CONTROL_OBLIGATION_PROFILE
domain_control_obligation_candidate_inventory
domain_control_obligation_profile
agent_8_domain_control_obligation
```

## 17.3 Retired active folder references

No active import or active implementation-registry entry may point to:

```text
src/phases/08-data-provenance-forensics
src/phases/09-exposure-profile
src/phases/10-operator-challenge
src/phases/11-normalized-compiler
src/phases/12-qualified-review
src/phases/13-diligence-qa-complete
src/phases/14-qualified-review-submission
src/phases/15-assembly-engine
```

## 17.4 Exact next chain

Search and contract inspection must prove:

```text
DATA_PROVENANCE_PROFILE_LAYER5
  -> DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY

DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY
  -> DOMAIN_CONTROL_OBLIGATION_PROFILE

DOMAIN_CONTROL_OBLIGATION_PROFILE
  -> DATA_PROVENANCE_PROFILE_FORENSICS
```

## 17.5 Candidate inventory containment

`domain_control_obligation_candidate_inventory` must appear only in:

- Phase 8 Layer 1 write declarations;
- Phase 8 Layer 2 job-scoped read declarations;
- Phase 8 agent permissions;
- Phase 8 contracts, implementation, checks, and documentation.

It must not appear in M11, M12, compiler, renderer, QR, or final handoff inputs.

## 17.6 DAP isolation

No Phase 8 contract, runner, compiler, validator, prompt, or route may list any Phase 7 DAP Layer 4 or Layer 5 artifact as a read.

---

# 18. ABORT CONDITIONS

Codex must abort immediately if:

1. the current branch is not `domain-gate-v0-preflight`;
2. the working tree is dirty before the selected job starts;
3. the substantive Phase 8 files required for central cutover are missing;
4. a requested move would overwrite an existing target directory;
5. an old downstream folder contains uncommitted changes;
6. a required edit cannot be made without changing substantive logic outside this package;
7. a required path reference exists outside the allowed-diff classes and is not a pure exact path replacement;
8. Phase 8 would need a DAP or forensic input to function;
9. an installed obligation cannot be resolved without inventing new domain logic;
10. any test or search reveals duplicate regulatory-overlay obligation rows;
11. the candidate inventory would be propagated downstream;
12. the model/deterministic field-ownership boundary would be violated;
13. any command would merge, deploy, or modify `main`.

On abort, Codex must leave the tree unchanged or restore it to the recorded pre-job HEAD and report the exact reason.

---

# 19. EXPECTED FINAL DIFF INVENTORY

At completion of the full Phase 8 program, the branch should contain:

## New substantive files

- Phase 8 folder and implementation files;
- Agent 8 prompt package;
- four focused Phase 8 check scripts;
- this patch package.

## Exact mechanical modifications

- FDR DCO source-authority corrections plus `DCO.OBL.008`;
- downstream folder moves 8→9 through 15→16;
- central phase insertion and sequence shift;
- pipeline contract insertion and next-chain update;
- pipeline service imports, dispatch, and phase-owned wrappers;
- implementation-registry insertion and folder updates;
- P2G route rename and two-job authorization;
- Phase 8 agent/artifact permissions;
- downstream propagation of only `domain_control_obligation_profile`;
- package validation registration.

## Explicit non-diff

- no Phase 7 DAP implementation changes;
- no obligation catalog content changes;
- no Registry Key obligation content changes;
- no frontend or report-layout changes;
- no deployment changes;
- no main-branch change.

---

# 20. CODEX MASTER MECHANICAL EXECUTION PROMPT

Use the following prompt only after the substantive Phase 8 package and substantive downstream handoff have been reviewed and committed.

```text
You are applying a locked mechanical patch to repository:
  LexNovaHQ/interface-sandbox

Repository root expected locally:
  <resolve the local checkout; do not assume a different repository>

Target branch:
  domain-gate-v0-preflight

Authoritative patch specification:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md

OPERATING MODE
- Mechanical execution only.
- Do not redesign architecture.
- Do not infer missing requirements.
- Do not broaden scope.
- Do not merge or deploy.
- Do not modify main.
- Execute exactly one selected mechanical job per invocation.

SELECTED_JOB must be one of:
  A_FDR_SURGERY
  B_FOLDER_RENUMBERING
  C_CENTRAL_RUNTIME_CUTOVER
  D_P2G_PERMISSIONS
  E_DOWNSTREAM_VALIDATION_WIRING

If SELECTED_JOB is absent or ambiguous, abort without changing files.

PRE-FLIGHT
1. Set strict shell/error handling.
2. Resolve repository root.
3. Confirm `git remote -v` belongs to LexNovaHQ/interface-sandbox.
4. Confirm current branch is exactly domain-gate-v0-preflight.
5. Confirm `git status --porcelain` is empty.
6. Fetch origin without switching branches.
7. Record PRE_JOB_HEAD=`git rev-parse HEAD`.
8. Read the entire authoritative patch specification.
9. Confirm all substantive Phase 8 precondition files exist before Jobs C, D, or E.
10. For Job B, confirm every source directory exists and every target directory does not exist.
11. Print the selected job, PRE_JOB_HEAD, and exact allowed files before editing.

EXECUTION
- Apply only the selected job section from the authoritative package.
- Use `git mv` for directory renumbering.
- Preserve established internal job IDs.
- Preserve Phase 7 DAP logic.
- Preserve P2G as sole routing authority.
- Preserve lossless evidence as primary and index navigation as mandatory.
- Keep Phase 8 free of DAP and forensic inputs.
- Keep all Layer 2 material fields model-owned.
- Keep deterministic work limited to mechanical compilation, stamping, validation, and locking.
- Apply Option A: regulatory overlays enrich existing rows only.
- Propagate only domain_control_obligation_profile downstream.
- Never propagate domain_control_obligation_candidate_inventory past Phase 8.

NO-SILENT-SCOPE RULE
If a necessary file is outside the allowed-diff manifest:
- stop;
- do not edit it;
- report the path, exact dependency, and proposed minimal change.

MECHANICAL CHECKS ONLY
After editing, run only:
- git diff --check
- node --check on directly edited JavaScript/MJS files for the selected job
- the exact rg/search assertions relevant to the selected job
Do not run npm run check, smoke tests, live provider tests, deployment, or full validation.

DIFF REVIEW
1. Print `git status --short`.
2. Print `git diff --stat`.
3. Print the complete diff for the selected job.
4. Verify no forbidden file changed.
5. Verify every changed file is authorized.
6. Verify no unrelated formatting churn.
7. Verify no main-branch, deployment, environment, frontend, or DAP substantive file changed.

COMMIT DISCIPLINE
- Do not commit until the diff passes the selected job’s assertions.
- Create exactly one commit for the selected mechanical job.
- Commit messages:
  A: `Correct Phase 8 DCO FDR source authority`
  B: `Renumber downstream phase folders for Phase 8 insertion`
  C: `Wire Phase 8 into central runtime sequence`
  D: `Activate Phase 8 P2G route and permissions`
  E: `Propagate Phase 8 profile and register checks`
- Do not push unless explicitly instructed in the invocation.

FAILURE HANDLING
If any assertion fails:
- do not commit;
- restore the tree to PRE_JOB_HEAD;
- report the failing assertion and affected files.

FINAL REPORT FORMAT
- Selected job
- PRE_JOB_HEAD
- Post-job HEAD or `not committed`
- Files changed/moved
- Exact mechanical changes
- Search assertions run and results
- node --check files and results
- Forbidden-file audit result
- Unresolved blockers
- Confirmation: no merge, no deploy, no main change
```

---

# 21. CODEX JOB-SPECIFIC EXECUTION PROMPTS

## 21.1 Mechanical Job A — FDR surgery

```text
SELECTED_JOB=A_FDR_SURGERY

Read and obey:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md

Apply only Section 8.

Authorized file only:
  diligence-artifact-backend/references/registry/Diligence_Field_Derivation_Registry.yml

Required edits:
1. Correct source_basis for DCO.OBL.001.
2. Correct source_basis for DCO.OBL.006.
3. Correct source_basis for DCO.OBL.007.
4. Add exactly DCO.OBL.008 using the locked YAML block in Section 8.2.

Do not change any other FDR row, spacing block, registry grammar, domain rule, legal citation, or obligation content.

Assertions:
- exactly one file changed;
- DCO.OBL.001/006/007 contain the locked source_basis strings;
- DCO.OBL.008 exists exactly once;
- no other field_id block changed;
- git diff --check passes.

Commit only with:
  Correct Phase 8 DCO FDR source authority
```

## 21.2 Mechanical Job B — folder renumbering

```text
SELECTED_JOB=B_FOLDER_RENUMBERING

Read and obey:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md

Apply only Sections 9, 15.4, 16, and the folder-reference assertions in Section 17.

Use git mv for all eight moves.

Do not alter substantive implementation logic in moved files.

After moves:
1. Search the active repository for every old path.
2. Update only exact import/path/assertion/documentation references required by the moves.
3. Do not rename internal job IDs, exported function names, artifact names, or prompt package names.
4. Do not touch Phase 7 DAP logic.

Assertions:
- all eight source directories are absent;
- all eight target directories exist;
- src/phases/08-domain-control-obligation-profile remains present and unchanged;
- no active import points at an old directory;
- diff shows renames with minimal content changes;
- git diff --check passes.

Commit only with:
  Renumber downstream phase folders for Phase 8 insertion
```

## 21.3 Mechanical Job C — central runtime cutover

```text
SELECTED_JOB=C_CENTRAL_RUNTIME_CUTOVER

Read and obey:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md

Authorized files:
  diligence-artifact-backend/src/runtime/contracts/central-phase.contract.js
  diligence-artifact-backend/src/runtime/contracts/pipeline.contract.js
  diligence-artifact-backend/src/runtime/services/pipeline.service.js
  diligence-artifact-backend/src/phases/phase-registry.js

Precondition:
- every substantive Phase 8 file listed in Section 7 exists;
- folder-renumbering job is already complete;
- tree is clean.

Apply only Section 10.

Required result:
- central Phase 8 inserted;
- downstream sequences shifted to 9–16;
- both Phase 8 jobs registered;
- Layer 5 next points to candidate inventory;
- candidate inventory next points to profile;
- profile next points to DAP Forensics;
- pipeline service imports and dispatches both phase-owned runners;
- no generic model fallback for Phase 8;
- moved downstream imports use new folders;
- Phase 7 DAP contracts and implementation remain substantively unchanged.

Assertions:
- exact next chain appears once;
- both jobs map to central phase DOMAIN_CONTROL_OBLIGATION_PROFILE;
- no active `phase7b_derives_values_later` marker remains;
- no old downstream import path remains in pipeline.service.js;
- node --check passes for all four files;
- git diff --check passes.

Commit only with:
  Wire Phase 8 into central runtime sequence
```

## 21.4 Mechanical Job D — P2G route and permissions

```text
SELECTED_JOB=D_P2G_PERMISSIONS

Read and obey:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md

Authorized files:
  diligence-artifact-backend/src/phases/02-cartography-index/phase-routing.contract.js
  diligence-artifact-backend/src/phases/02-cartography-index/services/phase-route-runtime.reader.js
  diligence-artifact-backend/src/runtime/contracts/artifact-permissions.contract.js

Apply only Sections 11 and 12.

Required result:
- route renamed to ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION_PROFILE;
- bucket remains 2E_BUCKET_DOMAIN_CONTROL_OBLIGATION;
- both Phase 8 jobs map to the route;
- Layer 2 receives candidate inventory as job-scoped derived context;
- both jobs receive source-bucket delivery;
- route allows only the locked material/runtime/legal context;
- route explicitly forbids DAP and forensic artifacts;
- agent_8_domain_control_obligation exists;
- both artifacts are known;
- write permissions are exact;
- read permissions do not grant free-corpus access;
- internal-job write permissions are exact.

Assertions:
- old Phase7B route ID absent from active files;
- new Phase8 route ID present;
- candidate inventory appears as Layer 2 job-scoped input only;
- DAP artifact arrays are forbidden, not allowed;
- node --check passes for all three files;
- git diff --check passes.

Commit only with:
  Activate Phase 8 P2G route and permissions
```

## 21.5 Mechanical Job E — downstream wiring and validation registration

```text
SELECTED_JOB=E_DOWNSTREAM_VALIDATION_WIRING

Read and obey:
  diligence-artifact-backend/change-orders/PHASE8_DOMAIN_CONTROL_OBLIGATION_CODEX_PATCH_PACKAGE.md

Apply only Sections 13 and 14 plus the exact downstream permission/route arrays in Section 12.7.

Before editing:
1. Search active Phase 10, Phase 11, Phase 12, P2G, permissions, pipeline contracts, and validation aggregators for the exact read arrays and check registration points.
2. Print the discovered files.
3. If a required file is outside the allowed classes, stop and report it.

Required result:
- domain_control_obligation_profile reaches M11;
- the same locked profile reaches M12 and NORMALIZED_COMPILER through exact derived-only arrays;
- domain_control_obligation_candidate_inventory does not leave Phase 8;
- no new renderer section is added;
- no DAP or exposure ownership is moved;
- check:phase8-domain-control-obligation is registered after Phase 7 checks.

Assertions:
- downstream searches find domain_control_obligation_profile in the expected arrays;
- downstream searches find zero candidate-inventory reads;
- package.json JSON remains valid;
- node --check passes for directly edited JS/MJS files;
- git diff --check passes.

Commit only with:
  Propagate Phase 8 profile and register checks
```

---

# 22. COMPLETION REPORT REQUIRED FROM CODEX

Every mechanical job report must use this exact structure:

```text
JOB:
PRE_JOB_HEAD:
POST_JOB_HEAD:
COMMIT:

FILES CHANGED:
FILES MOVED:

MECHANICAL CHANGES APPLIED:

ASSERTIONS:
- assertion:
  result:

NODE CHECKS:
- file:
  result:

GIT DIFF CHECK:

FORBIDDEN-FILE AUDIT:

UNRESOLVED BLOCKERS:

CONFIRMATIONS:
- no merge:
- no deploy:
- no main change:
- no Phase 7 DAP substantive change:
- no forensic input added to Phase 8:
- no DAP input added to Phase 8:
- candidate inventory not propagated downstream:
```

---

# 23. PROGRAM GATES

The full Phase 8 program proceeds only in this order:

```text
CO-1  Create and audit this Codex patch package
CO-2  Build Phase 8 contracts and schemas
CO-3  Build package-agnostic resolver
CO-4  Build Layer 1
CO-5  Build Layer 2 agent package
CO-6  Build Layer 2 runner/compiler/validator
CO-7  Build barrel, README, and focused checks
CO-8  Lock substantive downstream handoff
CO-9  Codex Mechanical A — FDR surgery
CO-10 Codex Mechanical B — folder renumbering
CO-11 Codex Mechanical C — central runtime cutover
CO-12 Codex Mechanical D — P2G route and permissions
CO-13 Codex Mechanical E — downstream wiring and validation registration
CO-14 Remote structural and contract audit
CO-15 Final local validation and controlled live test
```

No mechanical job may begin merely because this document exists. Each job requires explicit operator authorization.

---

# 24. LOCKED FINAL STATEMENT

Phase 8 is an independent material phase with:

```text
Layer 1: deterministic obligation candidate inventory
Layer 2: model-derived material obligation/control profile
Compiler: deterministic mechanical stamping and validation only
Regulatory overlays: enrichment references only
Routing: P2G sole authority through the 2E bucket
Evidence: lossless primary evidence navigated through P2E
Inputs: no DAP outputs and no forensic profiles
Downstream: only the locked domain_control_obligation_profile
```

Any implementation that violates this statement is outside the authorized change order and must be rejected.
