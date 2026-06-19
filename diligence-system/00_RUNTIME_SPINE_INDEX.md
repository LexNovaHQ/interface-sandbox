# THE INTERFACE DILIGENCE ENGINE
# 00_RUNTIME_SPINE_INDEX

Status: Runtime Slicing Index — no new substantive law except explicit routing of already-locked Runtime Spine duties.
Primary Runtime: `00_RUNTIME_SPINE.md`
Compatibility Runtime Copy: `00_RUNTIME_SPINE.md`
Stage 0 Contract: `00_SOURCE_EXTRACTION_CONTRACT.md`
First Phase Prompt: `01_SOURCE_DISCOVERY_EVIDENCE_BOX.md`

---

## 1. Purpose

This index tells the runtime which Runtime Spine modules must be injected or referenced by each stage/phase prompt.

It exists to prevent:

1. front-loading bias;
2. recency bias;
3. lost-in-the-middle / middle loss;
4. instruction dilution;
5. task drift / role drift;
6. evidence substitution; and
7. black-box phase memory.

This index does not replace the Runtime Spine. If this index conflicts with the Runtime Spine, the Runtime Spine controls.

---

## 2. Universal Runtime Slices

These slices must be available to every phase prompt, validator, repair path, final compiler, and renderer unless expressly inapplicable.

| Slice ID | Runtime Area | Must Be Used For |
|---|---|---|
| `UNIVERSAL_KERNEL` | Module I | identity, one-target rule, source mode, public/synthetic boundary, admitted evidence law, legal/advice firewall, zero inference |
| `REFERENCE_AUTHORITY` | Module II | governing references, authority hierarchy, no local redefinition, registry/field/contract authority |
| `OBJECT_CUSTODY` | Module III | canonical handoffs, lifecycle, owner phase, universal phase output pattern, mutation bar, evidence-ref survival |
| `LIVE_FORENSIC_LEDGER` | Module IV | ledger as memory, trace, provenance, item review coverage, live UI events, final annexures |
| `PHASE_POWER` | Module V | institutional power, forbidden acts, cross-phase contamination, high-risk boundary |
| `ROUTING_VALIDATION` | Module VI | route eligibility, validation gates, guardrail severity, repair/reinvestigation/failure, renderer boundary |

---

## 3. Universal Phase Output Pattern

Every model-executed phase emits:

```json
{
  "{phase}_forensic_ledger": {},
  "{phase}_trace": {},
  "{phase}_handoff": {}
}
```

Stage 0 emits:

```json
{
  "hybrid_extraction_manifest": {
    "extraction_forensic_ledger": {}
  }
}
```

Renderer consumes locked final handoff and locked ledgers. It does not create new substance.

---

## 4. Phase Ledger / Trace / Handoff Map

| Stage / Phase | File | Forensic Ledger | Trace | Handoff / Output |
|---|---|---|---|---|
| Stage 0 | `00_SOURCE_EXTRACTION_CONTRACT.md` | `extraction_forensic_ledger` | `extraction_trace` or manifest validation trace | `hybrid_extraction_manifest` |
| Phase 1 | `01_SOURCE_DISCOVERY_EVIDENCE_BOX.md` | `source_discovery_forensic_ledger` | `source_discovery_trace` | `source_discovery_handoff` |
| Phase 2 | `02_TARGET_PROFILE.md` | `target_profile_forensic_ledger` | `target_profile_trace` | `target_profile` |
| Phase 3 | `03_TARGET_FEATURE_PROFILE.md` | `feature_profile_forensic_ledger` | `feature_function_trace` | `target_feature_profile` |
| Phase 4 | `04_LEGAL_CARTOGRAPHY_INDEX.md` | `legal_cartography_forensic_ledger` | `legal_cartography_trace` | `legal_cartography_index` |
| Phase 5 | `05_TARGET_DATA_PROVENANCE_PROFILE.md` | `data_provenance_forensic_ledger` | `data_provenance_trace` | `target_data_provenance_profile` |
| Phase 6 | `06_EXPOSURE_PROFILE_REGISTRY_LEDGER.md` | `exposure_profile_forensic_ledger` | `registry_evaluation_trace` | `target_exposure_profile` |
| Phase 7 | `07_FINAL_OUTPUT_COMPILER_AND_HANDOFF.md` | `final_output_forensic_ledger` | `final_compiler_trace` | `final_output_handoff` |
| Renderer | deterministic renderer | consumes locked ledgers | render validation trace if needed | rendered report + annexures |

---

## 5. Core Evidence / Profile Routing Law

Each phase receives three input layers:

1. `CORE_EVIDENCE_FAMILY` — full lossless admitted evidence for the phase’s own job only.
2. `LOCKED_UPSTREAM_PROFILES` — structured handoffs from prior phases.
3. `NAVIGATION_AND_EXCEPTION_INDEX` — Evidence Box manifest, source family map, and validator-controlled exception access.

Full-text access is not global. It is phase-scoped.

```text
FULL TEXT ACCESS = core family only.
PROFILE ACCESS = all relevant locked upstream profiles.
EXCEPTION ACCESS = validator-approved, row/work-unit scoped, ledger-recorded.
```

---

## 6. Phase Input Routing Matrix

| Stage / Phase | Full Evidence By Default | Profile Inputs By Default | Exception Evidence Rule |
|---|---|---|---|
| Stage 0 Extraction | public sources it fetches/extracts | none | none |
| Phase 1 Source Discovery | source cards + selected artifact text | Stage 0 manifest + extraction ledger | full artifact retrieval only when admission/quarantine requires it |
| Phase 2 Target Profile | root/homepage, high-level product/platform, pricing/commercial where available | source_discovery_handoff | legal/governance only for identity/entity ambiguity |
| Phase 3 Feature Profile | product/platform, product/solution, docs/API/developer where behaviour is described | source_discovery_handoff, target_profile | legal/security only if feature behaviour depends on policy/control evidence |
| Phase 4 Legal Cartography | legal/governance, subprocessor, security/trust where governance/control evidence exists | source_discovery_handoff, target_profile, target_feature_profile | docs/API only if legal/governance artifact references implementation |
| Phase 5 Data Provenance | docs/API/developer, security/trust, subprocessor, privacy/DPA, feature-specific product text | target_profile, target_feature_profile, legal_cartography_index | product full text only when feature data behaviour is unclear |
| Phase 6 Registry Ledger | legal/governance/control evidence + registry references | target_profile, target_feature_profile, legal_cartography_index, target_data_provenance_profile | row-scoped admitted evidence only, validator-approved |
| Phase 7 Final Handoff | no full evidence by default | all locked upstream profiles + all locked ledgers | only for quote/citation repair, validator-approved |
| Renderer | locked final_output_handoff + locked ledgers | final_output_handoff | none; renderer cannot request new evidence |

---

## 7. Non-Random Batching Law

No phase may batch randomly when a substantive grouping exists.

| Stage / Phase | Default Batch Unit |
|---|---|
| Stage 0 | priority + source family + root cluster |
| Phase 1 | Stage 0 priority/family/root-cluster batches |
| Phase 2 | one batch; optional second batch for commercial/market posture |
| Phase 3 | product cluster; sub-batch by feature/module/workflow/API surface when needed |
| Phase 4 | legal/governance artifact type |
| Phase 5 | feature-linked data provenance batch |
| Phase 6 | registry archetype / row routing class |
| Phase 7 | final report section / upstream handoff block |

Every batch must emit live forensic ledger events.

---

## 8. Stage 0 / Phase 1 Source Custody Index

Stage 0 owns:

- candidate URL discovery;
- deterministic + grounded-search scout discovery;
- product descendant / hash-route / root-cluster discovery;
- URL/content de-duplication;
- fetch/extract;
- lossless artifact storage;
- extraction forensic ledger;
- candidate manifest.

Stage 0 does not admit evidence.

Phase 1 owns:

- source qualification/admission;
- rejection/quarantine/access/defer ledgers;
- artifact-family absence coverage;
- Evidence Box manifest;
- admitted-evidence de-duplication before routing;
- source family map;
- phase package routing;
- source discovery forensic ledger.

Phase 1 does not crawl, search, extract, profile, do legal cartography, do data provenance, evaluate registry rows, or write final report narrative.

---

## 9. Live Forensic Ledger UI Rule

Every phase must be capable of streaming ledger deltas to the UI.

A visible ledger row should include, where applicable:

- time;
- stage/phase;
- work unit;
- batch ID;
- item ID;
- event type;
- decision/status;
- reason code;
- evidence/artifact refs;
- validator status;
- safe visible message.

The UI must not expose private chain-of-thought. The live ledger is structured audit progress.

---

## 10. Final Annexure Rule

Final report annexures are generated from locked phase ledgers, not from fresh model reasoning.

Required annexure families:

1. Source Coverage & Evidence Box Annexure;
2. Target Profile Forensic Ledger Annexure;
3. Feature Profile Forensic Ledger Annexure;
4. Legal Cartography Forensic Ledger Annexure;
5. Data Provenance Forensic Ledger Annexure;
6. Registry Evaluation Ledger Annexure;
7. Final Assembly Ledger Annexure;
8. Runtime Limitations, Access Failures, and Repair Annexure.

Renderer may format ledger content. Renderer may not alter ledger substance.

---

## 11. Validation Gates That Must Be Preserved

Every phase validator must include:

- jurisdiction gate;
- source/evidence gate where applicable;
- lossless custody gate where applicable;
- handoff contract gate;
- field canon gate;
- evidence reference gate;
- forensic ledger completeness gate;
- forensic trace gate;
- phase-power gate;
- routing gate where applicable;
- registry gate where applicable;
- final compiler gate where applicable;
- renderer gate where applicable.

Schema compliance does not cure evidence failure.
Trace presence does not cure ledger failure.
Ledger presence does not cure unsupported substance.
Final formatting does not cure final-output defects.

---

## 12. Current Locked Stage / Phase Prompt Files

| File | Status |
|---|---|
| `00_RUNTIME_SPINE.md` | Primary patched Runtime Spine |
| `00_RUNTIME_SPINE.md` | Compatibility runtime copy with forensic-ledger amendment |
| `00_RUNTIME_SPINE_INDEX.md` | This runtime slicing index |
| `00_SOURCE_EXTRACTION_CONTRACT.md` | Stage 0 extraction contract patched |
| `01_SOURCE_DISCOVERY_EVIDENCE_BOX.md` | Phase 1 source admission prompt patched |

