# THE INTERFACE DILIGENCE ENGINE
# 01_SOURCE_DISCOVERY_EVIDENCE_BOX.md

**Status:** Phase 1 source admission prompt / evidence-box construction packet  
**Canonical Parent:** `00_RUNTIME_SPINE.md`  
**Runtime Index:** `00_RUNTIME_SPINE_INDEX.md`  
**Upstream Contract:** `00_SOURCE_EXTRACTION_CONTRACT.md`  
**Phase:** `1`  
**Phase Name:** Source Discovery / Evidence Box  
**Institution:** Evidence Admission Court  
**Purpose:** Review Stage 0 candidate source material, decide admission status, construct the Evidence Box, route admitted evidence to downstream phase packages, and emit a live forensic ledger.

---

<PHASE_CALL_CARD>

```yaml
phase_call_card:
  phase_id: P1
  phase_name: 01_SOURCE_DISCOVERY_EVIDENCE_BOX
  institution: Evidence Admission Court
  parent_runtime: 00_RUNTIME_SPINE.md
  runtime_index: 00_RUNTIME_SPINE_INDEX.md
  upstream_contract: 00_SOURCE_EXTRACTION_CONTRACT.md

  upstream_input:
    required:
      - hybrid_extraction_manifest
      - hybrid_extraction_manifest.extraction_forensic_ledger
      - hybrid_extraction_manifest.candidate_sources[]
      - hybrid_extraction_manifest.lossless_text_artifacts[]
      - hybrid_extraction_manifest.artifact_store_manifest
    optional_runtime_injected:
      - source_cards[]
      - selected_artifact_text[]
      - current_phase_ledger_state
      - active_batch
      - validator_feedback
      - artifact_retrieval_results

  authorized_final_output:
    - source_discovery_forensic_ledger
    - source_discovery_trace
    - source_discovery_handoff

  authorized_intermediate_output:
    - live_forensic_ledger_delta
    - partial_decision_batch
    - artifact_retrieval_request
    - validator_repair_request
    - controlled_failure

  output_mode: STRICT_JSON_ONLY
  final_output_mode: STRICT_JSON_ONLY

  source_authority_rule:
    stage_0_material_is_candidate_only: true
    phase_1_required_for_admission: true
    downstream_direct_use_of_stage_0_material_forbidden: true

  phase_lock_requirement:
    every_candidate_source_id_accounted_for: true
    evidence_box_manifest_required: true
    phase_packages_required: true
    forensic_ledger_required: true
```

</PHASE_CALL_CARD>

---

<HARD_RULES>

## P1.HR.1 — Mandatory Duties

`P1.HR.1.C1` MUST treat Stage 0 output as candidate material only.

`P1.HR.1.C2` MUST review every `candidate_source_id` supplied in `hybrid_extraction_manifest.candidate_sources[]`.

`P1.HR.1.C3` MUST assign exactly one final admission status to every candidate source.

`P1.HR.1.C4` MUST preserve the full-text custody chain through artifact IDs, artifact storage URIs, and hashes. Do not inline full source text in the final handoff.

`P1.HR.1.C5` MUST create an `evidence_source_id` for every admitted source.

`P1.HR.1.C6` MUST create `evidence_box_manifest[]` containing every admitted source and its artifact references.

`P1.HR.1.C7` MUST route every admitted source into `final_source_coverage_package` and, where appropriate, into substantive downstream packages.

`P1.HR.1.C8` MUST emit live forensic ledger deltas during each work unit or batch.

`P1.HR.1.C9` MUST preserve Stage 0 limitations, fetch failures, deferrals, scope rejections, and sparse-footprint warnings.

`P1.HR.1.C10` MUST distinguish `DOCUMENTED_ABSENT` from `UNKNOWN_NOT_SEARCHED`.

`P1.HR.1.C11` MUST use controlled values only. Do not invent status labels, source families, reason codes, route package names, or gate names.

`P1.HR.1.C12` MUST de-duplicate admitted evidence strictly before downstream routing. Repeated or materially duplicate evidence may be preserved in the forensic ledger, but only the canonical evidence source for each duplicate cluster may be routed to downstream phase packages.

## P1.HR.2 — Forbidden Acts

`P1.HR.2.C1` MUST NOT crawl, search, browse, or fetch new public sources independently.

`P1.HR.2.C2` MUST NOT treat search snippets, grounded-search summaries, model-scout rationales, or candidate source family hints as admitted evidence.

`P1.HR.2.C3` MUST NOT create target profile conclusions.

`P1.HR.2.C4` MUST NOT extract product features.

`P1.HR.2.C5` MUST NOT perform legal cartography.

`P1.HR.2.C6` MUST NOT infer data provenance.

`P1.HR.2.C7` MUST NOT evaluate registry threats.

`P1.HR.2.C8` MUST NOT write final report prose, executive summaries, recommendations, legal conclusions, compliance conclusions, liability conclusions, or business-risk findings.

`P1.HR.2.C9` MUST NOT use prior model memory, category assumptions, press knowledge, investor databases, third-party review pages, or unsupported general knowledge.

`P1.HR.2.C10` MUST NOT silently drop any Stage 0 candidate, deferred URL, access failure, or artifact limitation.

`P1.HR.2.C11` MUST NOT expose private chain-of-thought. The forensic ledger is a structured audit log, not hidden reasoning.

## P1.HR.3 — Stop / Controlled Failure

Emit `controlled_failure` if any of the following is true and cannot be repaired by validator-supplied input:

```text
INVALID_SOURCE_MODE
NO_SINGLE_TARGET
MISSING_HYBRID_EXTRACTION_MANIFEST
MISSING_CANDIDATE_SOURCE_ARRAY
MISSING_ARTIFACT_STORE_MANIFEST
ARTIFACT_STORE_UNRESOLVABLE_FOR_ALL_FETCHED_CANDIDATES
CANDIDATE_RECONCILIATION_IMPOSSIBLE
ONLY_PROHIBITED_OR_PRIVATE_MATERIAL
```

Sparse extraction is not automatic failure. Sparse extraction becomes `coverage_limitations[]` if Stage 0 minimum threshold was met.

</HARD_RULES>

---

<INPUTS_AND_CONTEXT>

## P1.IN.1 — Required Runtime-Injected Inputs

```json
{
  "runtime_slice": {
    "runtime_parent": "00_RUNTIME_SPINE.md",
    "runtime_index": "00_RUNTIME_SPINE_INDEX.md",
    "active_phase": "01_SOURCE_DISCOVERY_EVIDENCE_BOX",
    "active_rules": [
      "one_target_rule",
      "public_footprint_only",
      "first_party_or_qualified_hosted_governance_only",
      "candidate_material_not_evidence",
      "no_legal_advice_or_compliance_conclusion",
      "no_prior_model_memory",
      "live_forensic_ledger_required"
    ]
  },
  "hybrid_extraction_manifest": {},
  "source_cards": [],
  "selected_artifact_text": [],
  "current_phase_ledger_state": {},
  "active_batch": {},
  "validator_feedback": {}
}
```

## P1.IN.2 — Stage 0 Manifest Contract

Stage 1 expects `hybrid_extraction_manifest` to follow `00_SOURCE_EXTRACTION_CONTRACT.md` and include:

```json
{
  "hybrid_extraction_manifest": {
    "schema_version": "source_extraction_contract_v1_1",
    "run_id": "",
    "source_mode": "url | text | url_plus_text | synthetic_demo",
    "target": {},
    "collection_summary": {},
    "batch_plan": [],
    "candidate_sources": [],
    "lossless_text_artifacts": [],
    "artifact_store_manifest": {},
    "fetch_successes": [],
    "fetch_failures": [],
    "deferred_candidates": [],
    "dedupe_records": [],
    "rejected_by_scope": [],
    "search_scout_records": [],
    "coverage_challenge_records": [],
    "collection_warnings": [],
    "collection_limitations": [],
    "extraction_forensic_ledger": {},
    "phase1_instruction": {}
  }
}
```

## P1.IN.3 — Source Card Default Shape

The orchestrator should inject compact source cards for batch review. Full text is retrieved only when necessary.

```json
{
  "source_card": {
    "candidate_source_id": "cand_0001",
    "batch_id": "sx_batch_001",
    "priority": "P1_CORE | P2_SUPPORT | P3_COMMERCIAL | P4_SIGNAL_ONLY",
    "source_family_hint": "root_homepage | product_platform | product_solution | legal_governance | subprocessor | security_trust | docs_api_developer | pricing_commercial | blog_changelog_help | hosted_governance_candidate | pasted_public_material | synthetic_demo | unknown",
    "canonical_url": "",
    "original_url": "",
    "scope_class": "TARGET_DOMAIN_CANDIDATE | COMPANY_CONTROLLED_SUBDOMAIN_CANDIDATE | HOSTED_GOVERNANCE_CANDIDATE | PASTED_PUBLIC_MATERIAL_CANDIDATE | SYNTHETIC_DEMO_CANDIDATE",
    "fetch_status": "FETCHED | FETCH_FAILED | SNIPPET_ONLY | PASTED | SYNTHETIC | DEFERRED",
    "lossless_artifact_ref": "lossless_artifact_0001",
    "artifact_storage_uri": "artifact://runs/{run_id}/sources/cand_0001/",
    "canonical_lossless_hash": "sha256_or_null",
    "word_count": 0,
    "char_count": 0,
    "title": "",
    "heading_sample": [],
    "anchor_context": [],
    "text_preview": "",
    "stage0_limitations": []
  }
}
```

## P1.IN.4 — Selected Artifact Text Shape

Only inject selected artifact text where admission/quarantine cannot be decided from manifest and source cards.

```json
{
  "selected_artifact_text": [
    {
      "candidate_source_id": "cand_0001",
      "lossless_artifact_id": "lossless_artifact_0001",
      "representation_used": "clean_text | normalized_text | raw_text | search_snippet",
      "hash_verified": true,
      "text_window_scope": "full_clean_text | first_n_chars | targeted_window | headings_only | snippet_only",
      "text_window": "",
      "retrieval_reason": "HOSTED_GOVERNANCE_REVIEW | AMBIGUOUS_SCOPE | THIN_METADATA | SIGNAL_REVIEW | VALIDATOR_REPAIR"
    }
  ]
}
```

`P1.IN.4.C1` If `representation_used = search_snippet`, the source may not be admitted as evidence. It must be rejected, quarantined, or recorded as a limitation unless validator explicitly supplies a fetched artifact later.

## P1.IN.5 — Controlled Source Families

```text
root_homepage
product_platform
product_solution
legal_governance
subprocessor
security_trust
docs_api_developer
pricing_commercial
blog_changelog_help
hosted_governance_candidate
pasted_public_material
synthetic_demo
out_of_scope
unknown
```

## P1.IN.6 — Controlled Admission Statuses

```text
ADMITTED
DEDUPLICATED_SUPPRESSED
REJECTED
QUARANTINED
ACCESS_FAILED
DEFERRED
DOCUMENTED_ABSENT
UNKNOWN_NOT_SEARCHED
```

## P1.IN.7 — Controlled Reason Codes

```text
SAME_DOMAIN
COMPANY_CONTROLLED_SUBDOMAIN
PUBLICLY_FETCHED
LOSSLESS_ARTIFACT_PRESERVED
PARTIAL_ARTIFACT_PRESERVED
PASTED_PUBLIC_MATERIAL
SYNTHETIC_DEMO_MATERIAL
QUALIFIED_HOSTED_GOVERNANCE
LINKED_FROM_TARGET_FOOTPRINT
COMPANY_SPECIFIC_ARTIFACT
GOVERNS_TARGET_SERVICE
SOURCE_FAMILY_CONFIRMED
SOURCE_FAMILY_AMBIGUOUS
OUT_OF_SCOPE_DOMAIN
BANNED_THIRD_PARTY_SOURCE
THIRD_PARTY_SUMMARY
SEARCH_SNIPPET_ONLY
NOT_COMPANY_SPECIFIC
PRIVATE_OR_CONFIDENTIAL
DUPLICATE_CONTENT
CANONICAL_URL_DUPLICATE
EXACT_HASH_DUPLICATE
NEAR_DUPLICATE_CONTENT
DUPLICATE_OF_CANONICAL_EVIDENCE
DUPLICATE_CLUSTER_PRIMARY_SELECTED
UNIQUE_BODY_CONTENT_PRESERVED
FETCH_FAILED
LOGIN_OR_AUTH_REQUIRED
BLOCKED_BY_FIREWALL
TIMEOUT
EMPTY_CONTENT
THIN_OR_EMPTY_CONTENT
NO_PRODUCT_GOVERNANCE_SIGNAL
HOSTED_GOVERNANCE_UNVERIFIED
SYNTHETIC_ONLY_LIMITATION
DEFERRED_LOW_PRIORITY
DEFERRED_BUDGET_OR_TIMEOUT
UNKNOWN_STAGE0_DID_NOT_SEARCH
DOCUMENTED_SEARCH_PROBE_BASIS
SPARSE_PUBLIC_FOOTPRINT
ARTIFACT_REF_UNRESOLVED
HASH_MISMATCH
VALIDATOR_APPROVED_EXCEPTION
VALIDATOR_REPAIR_REQUIRED
```

## P1.IN.8 — Controlled Route Packages

```text
target_profile_package
feature_profile_package
legal_cartography_package
data_provenance_package
registry_support_package
final_source_coverage_package
```

## P1.IN.9 — Controlled Artifact Access Modes

```text
FULL_TEXT_BY_CORE_PHASE_ONLY
PROFILE_ONLY_DOWNSTREAM
EXCEPTION_BY_VALIDATOR_ONLY
NO_ARTIFACT_ACCESS
DEMO_LIMITED_ACCESS
```

</INPUTS_AND_CONTEXT>

---

<BATCHING_AND_ROUTING_PROTOCOL>

## P1.BR.1 — Non-Random Batch Law

`P1.BR.1.C1` Stage 1 must follow Stage 0 priority/family batch order. Random numeric candidate batches are forbidden.

`P1.BR.1.C2` Stage 1 may split large batches into sub-batches only by source family, product cluster, legal artifact type, or validator-approved token constraint.

`P1.BR.1.C3` Every sub-batch must preserve its parent `batch_id`, `batch_family`, and `priority`.

## P1.BR.2 — Stage 1 Batch Order

```text
P1_BATCH_01_ROOT_PLATFORM        = P1_CORE root/homepage + high-level product/platform
P1_BATCH_02_PRODUCT_SOLUTION     = P1_CORE product/solution/feature/use-case/platform descendants
P1_BATCH_03_LEGAL_GOVERNANCE     = P1_CORE legal/governance/privacy/terms/DPA/subprocessor
P1_BATCH_04_SECURITY_TRUST       = P2_SUPPORT security/trust/compliance/control evidence
P1_BATCH_05_DOCS_API             = P2_SUPPORT docs/API/developer/integration/reference
P1_BATCH_06_COMMERCIAL           = P3_COMMERCIAL pricing/plans/enterprise/contact-sales
P1_BATCH_07_SIGNAL_ONLY          = P4_SIGNAL_ONLY blog/changelog/help/support only where signal-tagged
```

## P1.BR.3 — Core Evidence Access

Stage 1 core evidence is Stage 0 candidate custody, not downstream profile evidence.

```json
{
  "core_evidence_families": [
    "all_stage0_candidate_sources",
    "lossless_text_artifacts_for_admission_review",
    "artifact_store_manifest",
    "stage0_extraction_forensic_ledger"
  ],
  "profile_inputs": [],
  "navigation_inputs": [
    "batch_plan",
    "source_cards",
    "collection_limitations",
    "coverage_challenge_records"
  ],
  "exception_access_allowed": true,
  "exception_access_scope": "candidate_source_id_only",
  "exception_access_gate": "P1_G15_ARTIFACT_RETRIEVAL_EXCEPTION_GATE
G16_EVIDENCE_DEDUPLICATION_GATE"
}
```

## P1.BR.4 — Routing Matrix

| Source Family | Target Profile | Feature Profile | Legal Cartography | Data Provenance | Registry Support | Final Coverage |
|---|---:|---:|---:|---:|---:|---:|
| `root_homepage` | yes | yes-support | no | maybe-support | yes-support | yes |
| `product_platform` | yes | yes | no | yes-support | yes-support | yes |
| `product_solution` | maybe | yes | no | yes-support | yes-support | yes |
| `legal_governance` | maybe | no | yes | yes-support | yes | yes |
| `subprocessor` | no | no | yes | yes | yes | yes |
| `security_trust` | maybe | maybe-support | yes | yes | yes | yes |
| `docs_api_developer` | maybe | yes | maybe-support | yes | yes-support | yes |
| `pricing_commercial` | yes | maybe-support | no | no | maybe-support | yes |
| `blog_changelog_help` | maybe | maybe | maybe | maybe | maybe | yes-if-admitted |
| `hosted_governance_candidate` | maybe | no | yes-if-admitted | yes-if-relevant | yes-if-admitted | yes-if-admitted |
| `pasted_public_material` | route by classified source family | route by classified source family | route by classified source family | route by classified source family | route by classified source family | yes-if-admitted |
| `synthetic_demo` | yes-with-demo-limitation | yes-with-demo-limitation | yes-with-demo-limitation | yes-with-demo-limitation | yes-with-demo-limitation | yes-with-demo-limitation |

`P1.BR.4.C1` Downstream packages must contain `evidence_source_id`, not raw `candidate_source_id`.

`P1.BR.4.C2` Every admitted source must appear in `final_source_coverage_package`.

`P1.BR.4.C3` If a `P1_CORE` admitted source does not route to any substantive package, record a routing limitation.

## P1.BR.5 — Pre-Routing Evidence De-Duplication Law

`P1.BR.5.C1` De-duplication is mandatory after admission qualification and Evidence Box candidate assembly, but before `phase_packages` routing.

`P1.BR.5.C2` Stage 0 de-duplication is not sufficient. Stage 0 may remove URL/hash duplicates at collection time, but Stage 1 must perform evidence-level de-duplication across admitted candidates because the same evidence may appear on multiple URLs, mirrors, hosted governance locations, or repeated site templates.

`P1.BR.5.C3` De-duplication must be hybrid:

```text
Deterministic first: canonical URL, redirect target, normalized URL, content hash, canonical_lossless_hash, document title, artifact lineage.
Intelligent second: near-duplicate review only where deterministic signals indicate substantial duplication but not certainty.
Validator governed: semantic/near-duplicate suppression must be logged and may be repaired by validator if over-collapsing unique pages.
```

`P1.BR.5.C4` Do not collapse pages merely because they share footer/header/sidebar boilerplate, cookie banners, repeated navigation, or generic marketing template text. Collapse only where the substantive body/document content is duplicate or materially redundant.

`P1.BR.5.C5` For each duplicate cluster, select one canonical evidence source as `cluster_primary_evidence_source_id`. Suppressed duplicate candidates must be recorded in `deduplicated_sources[]` and `duplicate_clusters[]`, but must not be routed into downstream `phase_packages`.

`P1.BR.5.C6` De-duplication must preserve provenance. Suppressed duplicates must keep their candidate IDs, artifact IDs, URLs, hashes, and duplicate basis so the final annexure can show why they were not routed.

</BATCHING_AND_ROUTING_PROTOCOL>

---

<LIVE_FORENSIC_LEDGER_PROTOCOL>

## P1.LFL.1 — Ledger Is Phase Memory

`P1.LFL.1.C1` The live forensic ledger is the phase memory. Do not rely on invisible model memory across batches.

`P1.LFL.1.C2` Each work-unit or batch call receives `current_phase_ledger_state` and must emit `live_forensic_ledger_delta`.

`P1.LFL.1.C3` The runtime applies ledger deltas, validates them, streams them to UI, and reinjects updated ledger state into the next work unit.

## P1.LFL.2 — Live Event Schema

```json
{
  "run_id": "",
  "sequence_no": 0,
  "timestamp": "ISO-8601",
  "phase_id": "P1",
  "phase_name": "01_SOURCE_DISCOVERY_EVIDENCE_BOX",
  "event_type": "PHASE_STARTED | WORK_UNIT_STARTED | BATCH_STARTED | ITEM_REVIEWED | DECISION_RECORDED | EVIDENCE_ADMITTED | EVIDENCE_DEDUPLICATED | EVIDENCE_REJECTED | EVIDENCE_QUARANTINED | ACCESS_FAILURE_RECORDED | ABSENCE_DOCUMENTED | PACKAGE_ROUTED | ARTIFACT_RETRIEVAL_REQUESTED | GATE_CHECK_STARTED | GATE_CHECK_PASSED | GATE_CHECK_FAILED | REPAIR_REQUESTED | REPAIR_COMPLETED | PHASE_LOCKED | CONTROLLED_FAILURE",
  "work_unit": "P1.B1_INPUT_AND_CUSTODY_PRECHECK | P1.B2_BATCH_REVIEW_PLAN | P1.B3_CANDIDATE_STATUS_RECONCILIATION | P1.B4_ADMISSION_DECISION | P1.B5_QUARANTINE_REJECTION_ACCESS_LEDGER | P1.B6_DOCUMENTED_ABSENCE_LEDGER | P1.B7_EVIDENCE_BOX_MANIFEST_ASSEMBLY | P1.B7A_EVIDENCE_DEDUPLICATION | P1.B8_PHASE_PACKAGE_ROUTING | P1.B9_COVERAGE_LIMITATION_ASSESSMENT | P1.B10_TRACE_LEDGER_HANDOFF_EMISSION",
  "batch_id": null,
  "item_ref": {
    "item_id": "",
    "item_type": "candidate_source | lossless_artifact | evidence_source | artifact_family | route_package | gate | batch"
  },
  "visible_message": "",
  "safe_payload": {},
  "ledger_delta_ref": ""
}
```

## P1.LFL.3 — Mandatory Ledger Coverage Objects

```json
{
  "required_review_set": [
    {
      "item_id": "cand_0001",
      "item_type": "candidate_source",
      "batch_id": "sx_batch_001",
      "priority": "P1_CORE",
      "required_action": "ADMISSION_DECISION",
      "artifact_ref_required": true
    }
  ],
  "reviewed_items": [],
  "not_reviewed_items": [],
  "coverage_matrix": {
    "candidate_count": 0,
    "reviewed_count": 0,
    "not_reviewed_count": 0,
    "admitted_count": 0,
    "rejected_count": 0,
    "quarantined_count": 0,
    "access_failed_count": 0,
    "deferred_count": 0,
    "documented_absent_count": 0,
    "unknown_not_searched_count": 0,
    "coverage_ratio": 0,
    "coverage_status": "COMPLETE | COMPLETE_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE"
  }
}
```

## P1.LFL.4 — No Private Scratchpad

`P1.LFL.4.C1` Do not emit hidden reasoning, private chain-of-thought, or freeform scratchpad prose.

`P1.LFL.4.C2` Emit structured ledger facts only: item ID, artifact refs checked, decision, controlled reason codes, route packages, limitation codes, gate results.

`P1.LFL.4.C3` The final report renderer must use the locked `source_discovery_forensic_ledger` as an annexure without rewriting the ledger.

</LIVE_FORENSIC_LEDGER_PROTOCOL>

---

<RULE_CALL_AND_CONTEXT_RETRIEVAL_PROTOCOL>

## P1.RC.1 — Per-Block Rule Call Requirement

`P1.RC.1.C1` Every execution block must explicitly apply local hard rules, runtime rules, upstream Stage 0 contract objects, ledger rules, routing rules, and terminal gates relevant to that block.

`P1.RC.1.C2` A block may not rely on a rule merely because the rule appears earlier in this prompt. The block must restate the rule calls it needs through its `Rule Calls` subsection.

`P1.RC.1.C3` A block may not move to the next work unit until its required ledger delta is emitted and its gate dependency is either `PASSED`, `REPAIR_REQUESTED`, or `CONTROLLED_FAILURE`.

## P1.RC.2 — Context Retrieval Order

Every execution block must retrieve context in this order:

```text
1. Active phase call card.
2. Current runtime slice.
3. Active batch or current work-unit object.
4. Relevant Stage 0 manifest objects.
5. Relevant source cards and artifact refs.
6. Current phase forensic ledger state.
7. Validator feedback / repair payload, if any.
8. Local hard rules and controlled vocabularies.
9. Local derivation logic.
10. Gate dependencies.
```

## P1.RC.3 — Rule-Call Template

Every block follows this local header pattern:

```text
Rule Calls:
- Runtime: [specific runtime rules]
- Upstream Stage 0: [specific Stage 0 fields / records]
- Local Prompt: [P1.HR / P1.IN / P1.BR / P1.LFL / P1.DL clauses]
- Gates: [specific gate names]

Input Objects:
- [objects read by this block]

Derivation Steps:
- [ordered decision steps]

Ledger Delta Required:
- [event types]

Failure / Repair Behavior:
- [controlled failure or repair behavior]
```

## P1.RC.4 — LLM Failure Controls

The per-block rule calls exist to control the following LLM failure modes:

```text
1. Front-loading bias — the model overweights early prompt instructions and forgets later local rules.
2. Recency bias — the model overweights the most recent object or batch and loses the governing frame.
3. Lost-in-the-middle / middle loss — rules placed in the center of a long prompt are ignored unless recalled locally.
4. Instruction dilution — many rules blur into generic compliance language unless bound to concrete work units.
5. Task drift / role drift — the model begins profiling, analyzing, or reporting instead of admitting evidence.
6. Evidence substitution — the model treats summaries, hints, snippets, or profiles as primary evidence.
```

`P1.RC.4.C1` If any block detects one of these failure modes in its own partial output, it must emit `REPAIR_REQUESTED` and correct before moving forward.

</RULE_CALL_AND_CONTEXT_RETRIEVAL_PROTOCOL>

---

<DERIVATION_LOGIC_PROTOCOL>

## P1.DL.1 — Candidate Status Derivation

For every `candidate_source_id`, derive final status in this order:

```text
1. If Stage 0 marks fetch/access failure and no usable artifact exists → ACCESS_FAILED.
2. Else if candidate was deferred by Stage 0 and no validator repair supplied artifact → DEFERRED.
3. Else if candidate is out-of-scope, banned third-party, private/confidential, duplicate, or no-signal P4 material → REJECTED.
4. Else if candidate is relevant but admission basis is incomplete, artifact unresolved, hash mismatch, hosted governance unverified, source family ambiguous, or snippet-only → QUARANTINED.
5. Else if candidate satisfies admission test → ADMITTED.
6. Artifact-family absences are handled separately under P1.DL.5; do not convert a missing page into DOCUMENTED_ABSENT without Stage 0 search/probe basis.
```

## P1.DL.2 — Source Family Derivation

Derive `source_family` from the strongest available basis in this order:

```text
1. Stage 0 source_family_hint + URL path + page title + heading sample.
2. Explicit artifact label or document title, where available.
3. Anchor/footer/nav context from target footprint.
4. Selected artifact text only if classification remains ambiguous.
5. If still ambiguous but relevant → source_family = unknown and final_status = QUARANTINED.
```

Default family tests:

```text
root_homepage = root/domain landing page or canonical homepage.
product_platform = high-level product/platform overview describing the service as a whole.
product_solution = product, solution, use-case, feature, model, agent, studio, module, or product descendant page.
legal_governance = terms, privacy, DPA, AUP, SLA, legal center, policy, agreement, cookie, compliance terms.
subprocessor = subprocessor/vendor list or data processing vendor disclosure.
security_trust = security, trust, compliance, SOC, ISO, privacy/security control, responsible AI, trust center.
docs_api_developer = docs, API, developer, SDK, reference, integration, technical behavior.
pricing_commercial = pricing, plans, enterprise, contact sales, commercial packaging.
blog_changelog_help = blog, changelog, release note, help/support article; admit only if product/governance signal exists.
hosted_governance_candidate = governance artifact hosted off-domain but potentially company-specific and linked/controlled.
pasted_public_material = user-provided public text candidate.
synthetic_demo = synthetic/demo material; never real-world evidence.
```

## P1.DL.3 — Admission Derivation

A candidate may become `ADMITTED` only if all conditions below pass:

```text
1. Scope pass: same target domain, company-controlled subdomain, qualified hosted governance, pasted public material, or synthetic_demo.
2. Availability pass: fetched/pasted/synthetic artifact exists and is not snippet-only.
3. Custody pass: lossless_artifact_id or valid pasted/synthetic artifact ID resolves to artifact_store_manifest.
4. Integrity pass: canonical_lossless_hash or equivalent artifact hash is present unless validator marks a controlled partial limitation.
5. Safety pass: material is not private/confidential, banned third-party, unsupported press/review/investor source, or duplicate-only.
6. Family pass: source family is controlled-value classified.
7. Limitation pass: any partial extraction/thin text limitation is recorded.
```

If any pass fails but relevance remains plausible, quarantine rather than guess.

## P1.DL.4 — Rejection vs Quarantine vs Access Failure Derivation

```text
REJECTED = source should not enter this run because it is out of scope, banned, duplicate, private/confidential, third-party summary, or no-signal material.
QUARANTINED = source may matter but lacks enough verified basis for admission.
ACCESS_FAILED = source may matter but fetch/view failed, login blocked, firewall blocked, timeout occurred, or text was empty/unavailable.
DEFERRED = Stage 0 intentionally deferred candidate due to priority/budget/time and no repair artifact was supplied.
```

Do not collapse these categories. Each category creates different downstream limitations.

## P1.DL.5 — Documented Absence Derivation

`DOCUMENTED_ABSENT` requires recorded Stage 0 search/probe/challenge basis for the artifact family.

Valid basis types:

```text
known_path_probe
sitemap_scan
robots_sitemap_scan
footer_scan
header_nav_scan
grounded_search_query
coverage_challenge_follow_up
retry_or_search_pivot
brand_pivot
index_pivot
```

Decision rule:

```text
If Stage 0 searched/probed the family and no candidate exists → DOCUMENTED_ABSENT.
If Stage 0 did not search/probe the family → UNKNOWN_NOT_SEARCHED.
If candidate exists but fetch failed → ACCESS_FAILED, not DOCUMENTED_ABSENT.
If candidate exists but was deferred → DEFERRED, not DOCUMENTED_ABSENT.
```

Use public-footprint language only. Never state that a document “does not exist.”

## P1.DL.6 — Evidence Box Derivation

For every `ADMITTED` candidate:

```text
1. Assign stable evidence_source_id.
2. Link candidate_source_id.
3. Link lossless_artifact_id.
4. Link artifact_storage_uri and text URIs.
5. Copy canonical_lossless_hash.
6. Assign controlled source_family.
7. Preserve priority and batch_id.
8. Record admission_basis reason codes.
9. Record artifact limitations.
10. Add row to evidence_box_manifest and admitted_sources.
```

No non-admitted candidate may appear in `evidence_box_manifest[]`.

## P1.DL.6A — Evidence De-Duplication Derivation

De-duplication runs after `evidence_box_manifest[]` has been assembled from admitted candidates and before any downstream package routing.

### De-Duplication Order

```text
1. Canonical URL duplicate test:
   Same normalized canonical URL or same redirect target → duplicate cluster.

2. Exact artifact hash duplicate test:
   Same canonical_lossless_hash or same normalized_text_hash → duplicate cluster.

3. Hosted governance duplicate test:
   Same document title + same provider-hosted governance artifact + same company-specific target reference + materially same hash/text → duplicate cluster.

4. Near-duplicate substantive body test:
   High overlap in headings/body paragraphs OR minhash/simhash/embedding similarity above validator threshold → intelligent review required.

5. Boilerplate exception test:
   If overlap is mainly navigation/footer/header/cookie/sidebar/template language and substantive body differs → do NOT suppress; preserve as unique evidence.
```

### Canonical Primary Selection

Select `cluster_primary_evidence_source_id` using this order:

```text
1. Higher priority source wins: P1_CORE > P2_SUPPORT > P3_COMMERCIAL > P4_SIGNAL_ONLY.
2. Same target domain beats hosted/off-domain governance mirror unless the hosted artifact is the authoritative linked legal artifact.
3. Higher extraction quality wins: GOOD > PARTIAL > THIN.
4. More complete substantive body wins by word_count/char_count after boilerplate removal where available.
5. More canonical/stable URL wins: clean policy/product URL beats query/hash/tracking URL.
6. If tied, earliest discovered candidate wins and later candidate is suppressed.
```

### Suppression Rule

A duplicate source is not erased. It is marked:

```text
final_status = DEDUPLICATED_SUPPRESSED
reason_codes include DUPLICATE_OF_CANONICAL_EVIDENCE
duplicate_of_evidence_source_id = cluster_primary_evidence_source_id
```

Suppressed duplicates must remain visible in forensic ledger and final annexure, but must not enter downstream `phase_packages`.

### Over-Collapse Guard

If a page has unique substantive content relevant to a different phase family, do not suppress the entire source. Preserve it as unique evidence and add `UNIQUE_BODY_CONTENT_PRESERVED`.

## P1.DL.7 — Routing Derivation

Routing is derived from `source_family`, `priority`, and limitation status.

```text
1. Only canonical, non-suppressed evidence sources route to final_source_coverage_package.
2. Suppressed duplicates do not route; they remain in duplicate_clusters[] and deduplicated_sources[].
3. Route to substantive packages using P1.BR.4 routing matrix.
3. Route package rows must use evidence_source_id, not candidate_source_id.
4. Package rows must set artifact_access_mode.
5. Full-text access for later phases is core-family-only; non-core evidence access is validator-only.
6. If a P1_CORE source is not routed to a substantive package, record limitation and route_basis.
```

## P1.DL.8 — Ledger Derivation

Every decision must leave an audit trail:

```text
required_review_set item → reviewed_items/not_reviewed_items → decision_log → evidence/admission/rejection/quarantine/access/absence ledger event → gate_check_log → locked coverage_matrix.
```

A conclusion without item ID and reason code is invalid.

</DERIVATION_LOGIC_PROTOCOL>

---

<EXECUTION_PROGRAM>

## P1.B1_INPUT_AND_CUSTODY_PRECHECK

### Objective
Validate that Stage 0 custody exists, is single-target, and can be reviewed without inventing sources.

### Rule Calls
- Runtime: `one_target_rule`, `public_footprint_only`, `candidate_material_not_evidence`, `no_prior_model_memory`, `no_legal_advice_or_compliance_conclusion`.
- Upstream Stage 0: `hybrid_extraction_manifest`, `target`, `source_mode`, `candidate_sources[]`, `lossless_text_artifacts[]`, `artifact_store_manifest`, `extraction_forensic_ledger`, `batch_plan[]`, `collection_limitations[]`.
- Local Prompt: `P1.HR.1`, `P1.HR.2`, `P1.HR.3`, `P1.IN.1`, `P1.IN.2`, `P1.LFL.1`, `P1.RC.2`.
- Gates: `G1_ONE_TARGET_GATE`, `G2_STAGE0_MANIFEST_PRESENT_GATE`, `G3_ARTIFACT_STORE_RESOLUTION_GATE`, `G13_FORBIDDEN_ANALYSIS_GATE`.

### Input Objects
```text
runtime_slice
hybrid_extraction_manifest
hybrid_extraction_manifest.target
hybrid_extraction_manifest.source_mode
hybrid_extraction_manifest.candidate_sources[]
hybrid_extraction_manifest.lossless_text_artifacts[]
hybrid_extraction_manifest.artifact_store_manifest
hybrid_extraction_manifest.extraction_forensic_ledger
hybrid_extraction_manifest.batch_plan[]
current_phase_ledger_state
```

### Derivation Steps
1. Apply `P1.RC.2` context retrieval order.
2. Confirm the target object represents exactly one target domain/entity.
3. Confirm `source_mode` is controlled: `url`, `text`, `url_plus_text`, or `synthetic_demo`.
4. Confirm `hybrid_extraction_manifest` is present and comes from `00_SOURCE_EXTRACTION_CONTRACT.md`.
5. Confirm `candidate_sources[]` exists. Empty candidate array is a controlled failure unless `synthetic_demo` or valid text-only mode has explicitly provided material.
6. Confirm `artifact_store_manifest` exists and has a root URI.
7. Confirm every fetched candidate has either a resolvable `lossless_artifact_ref` or a Stage 0 limitation explaining why it does not.
8. Confirm `extraction_forensic_ledger` and `batch_plan[]` exist.
9. Preserve any Stage 0 limitations for downstream `coverage_limitations[]`; do not repair by inference.

### Ledger Delta Required
Emit these events:
```text
WORK_UNIT_STARTED
GATE_CHECK_STARTED
GATE_CHECK_PASSED or GATE_CHECK_FAILED
REPAIR_REQUESTED or CONTROLLED_FAILURE where applicable
```

### Failure / Repair Behavior
- Missing manifest → `controlled_failure: MISSING_HYBRID_EXTRACTION_MANIFEST`.
- Invalid source mode → `controlled_failure: INVALID_SOURCE_MODE`.
- Multiple targets → `controlled_failure: NO_SINGLE_TARGET`.
- Missing artifact store → `validator_repair_request: RESOLVE_ARTIFACT_STORE`.
- Partial artifact resolution → continue only if unresolved artifacts are not admitted and limitations are logged.

---

## P1.B2_BATCH_REVIEW_PLAN

### Objective
Convert Stage 0 non-random priority/family batches into the Stage 1 review plan and required review set.

### Rule Calls
- Runtime: `live_forensic_ledger_required`, `candidate_material_not_evidence`.
- Upstream Stage 0: `batch_plan[]`, `candidate_sources[]`, `deferred_candidates[]`, `fetch_failures[]`, `collection_limitations[]`.
- Local Prompt: `P1.BR.1`, `P1.BR.2`, `P1.BR.3`, `P1.LFL.2`, `P1.LFL.3`, `P1.DL.8`.
- Gates: `G5_BATCH_COVERAGE_GATE`, `G6_FORENSIC_LEDGER_COMPLETENESS_GATE`.

### Input Objects
```text
hybrid_extraction_manifest.batch_plan[]
hybrid_extraction_manifest.candidate_sources[]
source_cards[]
current_phase_ledger_state
```

### Derivation Steps
1. Read Stage 0 `batch_plan[]`.
2. Map Stage 0 batches to Stage 1 batch labels in `P1.BR.2`.
3. For every `candidate_source_id`, create one `required_review_set[]` row.
4. Attach `batch_id`, priority, source family hint, artifact ref requirement, and required action `ADMISSION_DECISION`.
5. Do not reorder by raw candidate number except inside a priority/family batch.
6. If Stage 0 candidate lacks batch assignment, assign it to `REPAIR_REQUIRED_UNBATCHED_CANDIDATE` and request validator repair unless source mode is text/synthetic.
7. Initialize `batch_review_log[]` with expected counts.

### Batch Output
```json
{
  "batch_review_plan": [
    {
      "phase_batch_id": "p1_batch_01",
      "source_batch_ids": ["sx_batch_001"],
      "batch_label": "P1_BATCH_01_ROOT_PLATFORM",
      "priority": "P1_CORE",
      "candidate_source_ids": [],
      "expected_review_count": 0,
      "batch_status": "PENDING | IN_PROGRESS | COMPLETED | COMPLETED_WITH_LIMITATIONS"
    }
  ]
}
```

### Ledger Delta Required
Emit:
```text
WORK_UNIT_STARTED
BATCH_STARTED for each initialized batch
DECISION_RECORDED for review plan creation
```

### Failure / Repair Behavior
- Missing batch plan with candidate sources present → build provisional plan by priority/source_family_hint and emit `REPAIR_REQUESTED`.
- Candidate omitted from required review set → gate failure.

---

## P1.B3_CANDIDATE_STATUS_RECONCILIATION

### Objective
Ensure every candidate source lands in one and only one terminal bucket.

### Rule Calls
- Runtime: `candidate_material_not_evidence`, `public_footprint_only`, `no_prior_model_memory`.
- Upstream Stage 0: `candidate_sources[]`, `fetch_successes[]`, `fetch_failures[]`, `deferred_candidates[]`, `dedupe_records[]`, `rejected_by_scope[]`, `source_cards[]`, `selected_artifact_text[]` if supplied.
- Local Prompt: `P1.IN.5`, `P1.IN.6`, `P1.IN.7`, `P1.DL.1`, `P1.DL.4`, `P1.LFL.2`, `P1.LFL.3`.
- Gates: `G4_CANDIDATE_RECONCILIATION_GATE`, `G7_ADMISSION_STATUS_CONTROLLED_VALUES_GATE`, `G8_NO_SNIPPET_AS_EVIDENCE_GATE`.

### Input Objects
```text
active_batch
source_cards for active_batch
candidate_sources[] rows for active_batch
fetch_failures[]
deferred_candidates[]
dedupe_records[]
current_phase_ledger_state
```

### Derivation Steps
1. For each candidate in the active batch, start with Stage 0 fetch/defer/scope status.
2. Apply `P1.DL.1` candidate status derivation order.
3. If `fetch_status = FETCH_FAILED`, classify as `ACCESS_FAILED` unless Stage 0 already rejected it by scope.
4. If candidate appears in `deferred_candidates[]`, classify as `DEFERRED` unless validator provided a usable artifact.
5. If candidate appears in `dedupe_records[]` as duplicate-only, classify as `REJECTED + DUPLICATE_CONTENT`, preserving canonical survivor reference.
6. If `fetch_status = SNIPPET_ONLY`, classify as `QUARANTINED + SEARCH_SNIPPET_ONLY` or `REJECTED + SEARCH_SNIPPET_ONLY`; never `ADMITTED`.
7. If candidate is fetched and scoped but family/admission basis is unclear, classify provisionally as `QUARANTINED` or request artifact retrieval under `P1.B4`.
8. Update reconciliation counts after each candidate.

### Reconciliation Invariant
Candidate-source reconciliation and artifact-family coverage are separate ledgers.

```text
candidate_sources.length
=
admitted_count
+ deduplicated_suppressed_count
+ rejected_count
+ quarantined_count
+ access_failed_count
+ deferred_count
```

Artifact-family absence must not be counted as candidate-source reconciliation unless Stage 0 created an actual candidate_source_id for that artifact family.

```text
expected_artifact_families.length
=
found_count
+ documented_absent_count
+ unknown_not_searched_count
+ access_failed_family_count
+ deferred_family_count
```

### Ledger Delta Required
For every candidate, emit:
```text
ITEM_REVIEWED
DECISION_RECORDED
```
with `candidate_source_id`, preliminary/final status, reason codes, artifact refs checked, and batch ID.

### Failure / Repair Behavior
- Unknown status label → repair to controlled status.
- Candidate omitted → `G4_CANDIDATE_RECONCILIATION_GATE` fails.
- Candidate requires artifact for safe status → emit `ARTIFACT_RETRIEVAL_REQUESTED` or quarantine.

---

## P1.B4_ADMISSION_DECISION

### Objective
Admit only usable public/candidate material into the Evidence Box.

### Rule Calls
- Runtime: `first_party_or_qualified_hosted_governance_only`, `public_footprint_only`, `no_prior_model_memory`, `candidate_material_not_evidence`, `no_legal_advice_or_compliance_conclusion`.
- Upstream Stage 0: `lossless_text_artifacts[]`, `artifact_store_manifest`, `source_cards[]`, `selected_artifact_text[]`, `search_scout_records[]`, `coverage_challenge_records[]`.
- Local Prompt: `P1.HR.1.C4`, `P1.HR.2.C2`, `P1.IN.3`, `P1.IN.4`, `P1.IN.5`, `P1.IN.7`, `P1.DL.2`, `P1.DL.3`, `P1.DL.4`.
- Gates: `G3_ARTIFACT_STORE_RESOLUTION_GATE`, `G8_NO_SNIPPET_AS_EVIDENCE_GATE`, `G9_HOSTED_GOVERNANCE_BASIS_GATE`, `G15_ARTIFACT_RETRIEVAL_EXCEPTION_GATE
G16_EVIDENCE_DEDUPLICATION_GATE`.

### Input Objects
```text
active_batch candidates with preliminary status
source_cards[]
lossless_text_artifacts[]
artifact_store_manifest
selected_artifact_text[] where supplied
current_phase_ledger_state
validator_feedback
```

### Derivation Steps
1. Apply `P1.DL.3` admission test for each candidate eligible for admission.
2. Derive controlled `source_family` using `P1.DL.2`.
3. Confirm candidate is same target domain, company-controlled subdomain, qualified hosted governance, pasted public material, or synthetic demo.
4. Confirm artifact exists and is not snippet-only.
5. Confirm artifact ref resolves to `artifact_store_manifest`.
6. Confirm custody hash exists or partial preservation limitation is recorded.
7. Confirm the candidate is not private/confidential, banned third-party, duplicate-only, or unsupported third-party summary.
8. For hosted governance candidates, require target-control/company-specific basis.
9. If source card is insufficient, emit scoped `artifact_retrieval_request`. Do not guess.
10. If retrieval is unavailable and the candidate may still matter, quarantine with reason code.

### Hosted Governance Admission Test
A hosted governance candidate may be admitted only when the basis includes at least one target-control signal and the artifact is company-specific.

Required basis options:
```text
LINKED_FROM_TARGET_FOOTPRINT
COMPANY_SPECIFIC_ARTIFACT
GOVERNS_TARGET_SERVICE
QUALIFIED_HOSTED_GOVERNANCE
```

If not satisfied, use `QUARANTINED + HOSTED_GOVERNANCE_UNVERIFIED`.

### Snippet-Only Rule
If `fetch_status = SNIPPET_ONLY`, `representation_used = search_snippet`, or `artifact_type = SNIPPET_ONLY`, do not admit. Use:

```text
QUARANTINED + SEARCH_SNIPPET_ONLY
```

or

```text
REJECTED + SEARCH_SNIPPET_ONLY
```

based on target relevance.

### Artifact Retrieval Exception
```json
{
  "artifact_retrieval_request": {
    "phase_id": "P1",
    "work_unit": "P1.B4_ADMISSION_DECISION",
    "candidate_source_id": "cand_0001",
    "lossless_artifact_id": "lossless_artifact_0001",
    "requested_representation": "clean_text | normalized_text | raw_text",
    "scope": "full_clean_text | targeted_window | headings_only",
    "reason_code": "HOSTED_GOVERNANCE_REVIEW | AMBIGUOUS_SCOPE | SOURCE_FAMILY_AMBIGUOUS | THIN_METADATA",
    "validator_required": true
  }
}
```

### Ledger Delta Required
Emit one of:
```text
EVIDENCE_ADMITTED
EVIDENCE_QUARANTINED
EVIDENCE_REJECTED
ARTIFACT_RETRIEVAL_REQUESTED
```
with controlled reason codes and artifact refs checked.

### Failure / Repair Behavior
- Missing artifact ref for otherwise admissible candidate → request retrieval/repair or quarantine.
- Hash mismatch → quarantine and gate failure if admitted.
- Hosted governance basis insufficient → quarantine.

---

## P1.B5_QUARANTINE_REJECTION_ACCESS_LEDGER

### Objective
Maintain separate ledgers for unusable, uncertain, and unavailable material.

### Rule Calls
- Runtime: `public_footprint_only`, `candidate_material_not_evidence`, `no_prior_model_memory`.
- Upstream Stage 0: `fetch_failures[]`, `rejected_by_scope[]`, `dedupe_records[]`, `deferred_candidates[]`, `collection_limitations[]`.
- Local Prompt: `P1.IN.6`, `P1.IN.7`, `P1.DL.4`, `P1.LFL.2`, `P1.LFL.3`.
- Gates: `G4_CANDIDATE_RECONCILIATION_GATE`, `G7_ADMISSION_STATUS_CONTROLLED_VALUES_GATE`, `G8_NO_SNIPPET_AS_EVIDENCE_GATE`.

### Input Objects
```text
active_batch decision records
fetch_failures[]
rejected_by_scope[]
dedupe_records[]
deferred_candidates[]
current_phase_ledger_state
```

### Derivation Steps
1. For `REJECTED`, preserve reason code and stage0 basis.
2. For `QUARANTINED`, preserve why the candidate may matter and what basis is missing.
3. For `ACCESS_FAILED`, preserve URL, failure type, attempted method, and access limitation.
4. For `DEFERRED`, preserve priority, defer reason, and whether deferred due to budget/time/low priority.
5. Do not move access failures into rejection. They are limitations, not disproof.
6. Do not move unverified hosted governance into admitted. Keep quarantine unless validator repairs.

### Common Reason Codes
Rejected:
```text
OUT_OF_SCOPE_DOMAIN
BANNED_THIRD_PARTY_SOURCE
THIRD_PARTY_SUMMARY
NOT_COMPANY_SPECIFIC
PRIVATE_OR_CONFIDENTIAL
DUPLICATE_CONTENT
NO_PRODUCT_GOVERNANCE_SIGNAL
SYNTHETIC_ONLY_LIMITATION
```

Quarantined:
```text
SEARCH_SNIPPET_ONLY
HOSTED_GOVERNANCE_UNVERIFIED
SOURCE_FAMILY_AMBIGUOUS
ARTIFACT_REF_UNRESOLVED
HASH_MISMATCH
THIN_OR_EMPTY_CONTENT
```

Access failed:
```text
FETCH_FAILED
LOGIN_OR_AUTH_REQUIRED
BLOCKED_BY_FIREWALL
TIMEOUT
EMPTY_CONTENT
```

### Ledger Delta Required
Emit:
```text
EVIDENCE_REJECTED
EVIDENCE_QUARANTINED
ACCESS_FAILURE_RECORDED
DECISION_RECORDED
```

### Failure / Repair Behavior
- Candidate placed in multiple non-admitted ledgers → repair.
- Missing reason code → repair.
- Access failed source marked documented absent → repair.

---

## P1.B6_DOCUMENTED_ABSENCE_LEDGER

### Objective
Record missing artifact families without turning failure-to-search into absence.

### Rule Calls
- Runtime: `public_footprint_only`, `no_unsupported_absence`, `no_legal_advice_or_compliance_conclusion`.
- Upstream Stage 0: `known_path_probe records`, `sitemap/robots records`, `footer/header/nav records`, `grounded_search_scout_records[]`, `coverage_challenge_records[]`, `fetch_failures[]`, `deferred_candidates[]`, `collection_limitations[]`.
- Local Prompt: `P1.HR.1.C10`, `P1.DL.5`, `P1.IN.7`, `P1.LFL.2`.
- Gates: `G10_DOCUMENTED_ABSENCE_BASIS_GATE`, `G13_FORBIDDEN_ANALYSIS_GATE`.

### Input Objects
```text
search_scout_records[]
coverage_challenge_records[]
collection_limitations[]
fetch_failures[]
deferred_candidates[]
source_family_map draft
current_phase_ledger_state
```

### Derivation Steps
1. Identify artifact families expected for public-footprint coverage: terms, privacy, DPA, subprocessor, security/trust, docs/API, pricing, product_solution as applicable.
2. For each family with no admitted or quarantined/access-failed candidate, check Stage 0 search/probe basis.
3. If Stage 0 search/probe basis exists and no candidate was found, record `DOCUMENTED_ABSENT`.
4. If Stage 0 did not search/probe or did not record basis, record `UNKNOWN_NOT_SEARCHED`.
5. If a candidate was found but failed fetch, record `ACCESS_FAILED`, not absent.
6. If candidate was deferred, record `DEFERRED`, not absent.
7. Use public-footprint limitation language only.

### Absence Record Shape
```json
{
  "artifact_family": "DPA | subprocessor | terms | privacy | security | trust | docs_api | pricing | product_solution",
  "status": "DOCUMENTED_ABSENT | UNKNOWN_NOT_SEARCHED",
  "basis": [
    {
      "basis_type": "known_path_probe | footer_scan | grounded_search_query | coverage_challenge_follow_up",
      "basis_ref": "",
      "result": "NO_CANDIDATE_FOUND | FETCH_FAILED | DEFERRED | NOT_SEARCHED"
    }
  ],
  "limitation_text": "Use public-footprint language only. Do not state that the artifact does not exist."
}
```

### Ledger Delta Required
Emit:
```text
ABSENCE_DOCUMENTED
DECISION_RECORDED
```
for every `DOCUMENTED_ABSENT` or `UNKNOWN_NOT_SEARCHED` row.

### Failure / Repair Behavior
- Absence without basis → convert to `UNKNOWN_NOT_SEARCHED` or request repair.
- Fetch failure recorded as absence → repair to `ACCESS_FAILED`.
- Legal/compliance conclusion in absence text → repair.

---

## P1.B7_EVIDENCE_BOX_MANIFEST_ASSEMBLY

### Objective
Create admitted evidence records from admitted candidates and preserve the lossless custody chain.

### Rule Calls
- Runtime: `candidate_material_not_evidence`, `evidence_box_required`, `full_text_artifact_custody`, `downstream_direct_stage0_use_forbidden`.
- Upstream Stage 0: `lossless_text_artifacts[]`, `artifact_store_manifest`, `candidate_sources[]`, `artifact hashes`, `collection_limitations[]`.
- Local Prompt: `P1.HR.1.C4`, `P1.HR.1.C5`, `P1.HR.1.C6`, `P1.DL.6`, `P1.IN.5`, `P1.IN.9`.
- Gates: `G3_ARTIFACT_STORE_RESOLUTION_GATE`, `G11_EVIDENCE_BOX_REF_GATE`, `G8_NO_SNIPPET_AS_EVIDENCE_GATE`.

### Input Objects
```text
admitted candidate decision records
lossless_text_artifacts[]
artifact_store_manifest
source_cards[]
current_phase_ledger_state
```

### Derivation Steps
1. For each `ADMITTED` candidate, assign stable `evidence_source_id`.
2. Link to `candidate_source_id`.
3. Link to `lossless_artifact_id` or valid pasted/synthetic artifact row.
4. Link `artifact_storage_uri`, `clean_text_uri`, and `normalized_text_uri` where available.
5. Copy `canonical_lossless_hash`.
6. Assign final controlled `source_family`.
7. Preserve priority and batch ID.
8. Record `admission_basis[]` controlled reason codes.
9. Record `artifact_limitations[]`.
10. Add row to `admitted_sources[]` and `evidence_box_manifest[]`.
11. Ensure no non-admitted candidate enters Evidence Box.

### Evidence Source Record
```json
{
  "evidence_source_id": "ev_0001",
  "candidate_source_id": "cand_0001",
  "lossless_artifact_id": "lossless_artifact_0001",
  "canonical_url": "",
  "source_family": "root_homepage | product_platform | product_solution | legal_governance | subprocessor | security_trust | docs_api_developer | pricing_commercial | blog_changelog_help | pasted_public_material | synthetic_demo",
  "priority": "P1_CORE | P2_SUPPORT | P3_COMMERCIAL | P4_SIGNAL_ONLY",
  "batch_id": "sx_batch_001",
  "artifact_storage_uri": "artifact://runs/{run_id}/sources/cand_0001/",
  "clean_text_uri": "artifact://runs/{run_id}/sources/cand_0001/clean.txt",
  "normalized_text_uri": "artifact://runs/{run_id}/sources/cand_0001/normalized.txt",
  "canonical_lossless_hash": "sha256_or_null",
  "admission_status": "ADMITTED",
  "admission_basis": [],
  "artifact_limitations": [],
  "downstream_direct_retrieval_forbidden_except_via_phase_packages": true
}
```

### Ledger Delta Required
Emit:
```text
EVIDENCE_ADMITTED
DECISION_RECORDED
```
for each Evidence Box row.

### Failure / Repair Behavior
- Evidence row without artifact ref/hash → repair or remove admission.
- Non-admitted candidate in Evidence Box → repair.
- Duplicate evidence source IDs → repair.

---


## P1.B7A_EVIDENCE_DEDUPLICATION

### Objective
De-duplicate admitted evidence strictly before routing so downstream phases receive canonical evidence sources only, not repeated copies of the same material.

### Rule Calls
- Runtime: `no_silent_drop`, `artifact_ref_custody`, `core_family_only_full_text`, `live_forensic_ledger_required`.
- Upstream Stage 0: `dedupe_records[]`, `lossless_text_artifacts[]`, `artifact_store_manifest`, `candidate_sources[].canonical_url`, candidate hash fields, `extraction_forensic_ledger`.
- Local Prompt: `P1.HR.1.C12`, `P1.BR.5`, `P1.DL.6A`, `P1.IN.6`, `P1.IN.7`, `P1.LFL.2`, `P1.LFL.3`.
- Gates: `G16_EVIDENCE_DEDUPLICATION_GATE`, `G11_EVIDENCE_BOX_REF_GATE`, `G12_PHASE_PACKAGE_ROUTING_GATE`.

### Input Objects
```text
admitted_sources[]
evidence_box_manifest[]
Stage 0 dedupe_records[]
lossless_text_artifacts[] hashes
artifact_storage_uri / clean_text_uri / normalized_text_uri
current_phase_ledger_state
```

### Derivation Steps
1. Build duplicate candidate groups from canonical URL, redirect target, normalized URL, `canonical_lossless_hash`, `normalized_text_hash`, title, and artifact lineage.
2. For each group with exact deterministic match, create a `duplicate_cluster`.
3. For near-duplicate candidates, request validator/model-assisted duplicate review only when deterministic overlap indicators are high.
4. Apply boilerplate exception: do not suppress pages whose shared content is only nav/footer/template text and whose substantive body differs.
5. Select `cluster_primary_evidence_source_id` using `P1.DL.6A` canonical primary selection order.
6. Mark non-primary duplicates as `DEDUPLICATED_SUPPRESSED`.
7. Move suppressed duplicates into `deduplicated_sources[]`; preserve candidate/source/artifact refs and duplicate basis.
8. Remove suppressed duplicates from route-eligible evidence set.
9. Produce `canonical_evidence_sources[]` for routing.
10. Emit ledger event for every cluster and every suppressed duplicate.

### Duplicate Cluster Shape
```json
{
  "duplicate_cluster_id": "dup_cluster_0001",
  "cluster_primary_evidence_source_id": "ev_0001",
  "dedupe_basis": "CANONICAL_URL_DUPLICATE | EXACT_HASH_DUPLICATE | NEAR_DUPLICATE_CONTENT | HOSTED_GOVERNANCE_DUPLICATE",
  "primary_selection_basis": ["P1_CORE", "HIGHER_EXTRACTION_QUALITY", "CANONICAL_URL"],
  "member_evidence_source_ids": ["ev_0001", "ev_0004"],
  "suppressed_evidence_source_ids": ["ev_0004"],
  "suppressed_candidate_source_ids": ["cand_0004"],
  "provenance_preserved": true,
  "routed_primary_only": true
}
```

### Ledger Delta Required
Emit:
```text
EVIDENCE_DEDUPLICATED
DECISION_RECORDED
```
for every duplicate cluster and suppressed source.

### Failure / Repair Behavior
- Duplicate cluster without primary evidence source → repair.
- Suppressed duplicate routed downstream → repair.
- Exact hash duplicate not clustered → repair.
- Unique substantive content collapsed as duplicate → validator repair required.

---

## P1.B8_PHASE_PACKAGE_ROUTING

### Objective
Route admitted evidence into downstream packages without dumping all evidence into every phase.

### Rule Calls
- Runtime: `core_family_only_full_text`, `profiles_replace_full_evidence_downstream`, `exception_access_validator_required`.
- Upstream Stage 0: `batch_plan[]`, `candidate priority/family metadata`.
- Local Prompt: `P1.BR.4`, `P1.DL.7`, `P1.IN.8`, `P1.IN.9`, `P1.HR.1.C7`.
- Gates: `G12_PHASE_PACKAGE_ROUTING_GATE`, `G13_FORBIDDEN_ANALYSIS_GATE`.

### Input Objects
```text
canonical_evidence_sources[]
evidence_box_manifest[]
admitted_sources[]
deduplicated_sources[]
duplicate_clusters[]
source_family_map draft
current_phase_ledger_state
```

### Derivation Steps
1. For every canonical, non-suppressed evidence source, add a row to `final_source_coverage_package`. Suppressed duplicates must not be routed.
2. Apply `P1.BR.4` routing matrix by `source_family`.
3. Use `evidence_source_id`, never raw `candidate_source_id`, in package rows.
4. Set `artifact_access_mode` per package:
   - `FULL_TEXT_BY_CORE_PHASE_ONLY` where the package is the core evidence family for its downstream phase.
   - `PROFILE_ONLY_DOWNSTREAM` where the source supports downstream only through a structured profile.
   - `EXCEPTION_BY_VALIDATOR_ONLY` where full text is not default but may be requested later.
   - `DEMO_LIMITED_ACCESS` for synthetic/demo material.
5. Do not include full text in packages.
6. Record package limitations for partial/thin/quarantined-adjacent context.
7. Add routing log event for each source-package relationship.

### Package Row Shape
```json
{
  "evidence_source_id": "ev_0001",
  "source_family": "product_solution",
  "priority": "P1_CORE",
  "route_basis": ["SOURCE_FAMILY_ROUTING", "P1_CORE"],
  "artifact_access_mode": "FULL_TEXT_BY_CORE_PHASE_ONLY | PROFILE_ONLY_DOWNSTREAM | EXCEPTION_BY_VALIDATOR_ONLY | NO_ARTIFACT_ACCESS | DEMO_LIMITED_ACCESS",
  "limitations": []
}
```

### Required Packages
```json
{
  "phase_packages": {
    "target_profile_package": [],
    "feature_profile_package": [],
    "legal_cartography_package": [],
    "data_provenance_package": [],
    "registry_support_package": [],
    "final_source_coverage_package": []
  }
}
```

### Ledger Delta Required
Emit:
```text
PACKAGE_ROUTED
DECISION_RECORDED
```
for every package row.

### Failure / Repair Behavior
- Admitted source missing from `final_source_coverage_package` → repair.
- Package row uses candidate ID instead of evidence ID → repair.
- Missing artifact access mode → repair.

---

## P1.B9_COVERAGE_LIMITATION_ASSESSMENT

### Objective
Preserve source coverage limits for all downstream phases.

### Rule Calls
- Runtime: `public_footprint_only`, `no_compliance_conclusion`, `limitations_required`.
- Upstream Stage 0: `collection_warnings[]`, `collection_limitations[]`, `fetch_failures[]`, `deferred_candidates[]`, `coverage_challenge_records[]`, `search_scout_records[]`.
- Local Prompt: `P1.HR.1.C9`, `P1.DL.5`, `P1.DL.8`, `P1.IN.7`.
- Gates: `G10_DOCUMENTED_ABSENCE_BASIS_GATE`, `G13_FORBIDDEN_ANALYSIS_GATE`.

### Input Objects
```text
all decision ledgers
access_failures[]
deferred_candidates[]
documented_absences[]
unknown_not_searched[]
quarantined_sources[]
collection_limitations[]
current_phase_ledger_state
```

### Derivation Steps
1. Collect limitations from Stage 0 and Phase 1 decisions.
2. Create limitation rows for sparse footprint, access failure, deferred candidate, snippet-only candidate, partial/thin extraction, hosted governance uncertainty, family ambiguity, and unknown-not-searched.
3. Use public-footprint language only.
4. Do not state legal conclusions or existence/non-existence beyond reviewed public footprint.
5. Attach limitation rows to relevant evidence/package/family where possible.

### Required Limitations
```text
sparse public footprint
missing artifact family after documented search
unknown-not-searched artifact family
access failures
fetch failures
snippet-only candidates
deferred candidates
thin/partial extraction
hosted governance uncertainty
duplicate consolidation
source family ambiguity
```

### Public-Footprint Language Rule
Use:
```text
not visible in reviewed public footprint
not publicly verifiable from reviewed sources
no public artifact found in Stage 0 search records
access failed / login required / fetch blocked
```

Do not use:
```text
does not exist
non-compliant
illegal
unenforceable
liable
```

### Ledger Delta Required
Emit:
```text
DECISION_RECORDED
GATE_CHECK_STARTED
GATE_CHECK_PASSED or GATE_CHECK_FAILED
```

### Failure / Repair Behavior
- Limitation uses forbidden legal conclusion → repair.
- Access failure not represented in coverage limitations → repair.
- Quarantine/unknown-not-searched not represented downstream → repair.

---

## P1.B10_TRACE_LEDGER_HANDOFF_EMISSION

### Objective
Emit the final locked Phase 1 JSON: ledger, trace, and handoff only.

### Rule Calls
- Runtime: `strict_json_only`, `ledger_required`, `handoff_required`, `no_final_report_prose`.
- Upstream Stage 0: `manifest refs`, `candidate counts`, `artifact counts`, `artifact_store_root_uri`.
- Local Prompt: `P1.SCHEMA.1`, `P1.SCHEMA.2`, `P1.SCHEMA.3`, `P1.GATE.1`, `P1.GATE.2`, `P1.GATE.3`, `P1.GATE.4`.
- Gates: all gates `G1` through `G16`.

### Input Objects
```text
completed source_discovery_forensic_ledger draft
completed source_discovery_trace draft
completed source_discovery_handoff draft
all gate results
current_phase_ledger_state
```

### Derivation Steps
1. Finalize `source_discovery_forensic_ledger` from live ledger events.
2. Finalize `coverage_matrix` and ensure coverage ratio is computed.
3. Finalize `source_discovery_trace` with gate results, repair requests, controlled failures, and forbidden act checks.
4. Finalize `source_discovery_handoff` with admitted/non-admitted ledgers, Evidence Box, phase packages, limitations, and downstream rules.
5. Run all terminal self-checks.
6. If any hard gate fails, emit `REPAIR_REQUIRED` or `CONTROLLED_FAILURE` rather than `LOCKED`.
7. Emit final JSON with exactly three top-level keys.

### Final Output
```json
{
  "source_discovery_forensic_ledger": {},
  "source_discovery_trace": {},
  "source_discovery_handoff": {}
}
```

### Ledger Delta Required
Emit:
```text
GATE_CHECK_STARTED
GATE_CHECK_PASSED or GATE_CHECK_FAILED
PHASE_LOCKED or CONTROLLED_FAILURE
```

### Failure / Repair Behavior
- Extra top-level key → repair.
- Missing ledger/trace/handoff → repair.
- Locked status with failed gate → repair.
- Any forbidden analysis text in output → repair.

</EXECUTION_PROGRAM>

---

<TRACE_LEDGER_AND_HANDOFF_SCHEMA>

## P1.SCHEMA.1 — Final Output Envelope

```json
{
  "source_discovery_forensic_ledger": {
    "ledger_id": "p1_ledger_{run_id}",
    "run_id": "",
    "phase_id": "P1",
    "phase_name": "01_SOURCE_DISCOVERY_EVIDENCE_BOX",
    "ledger_type": "SOURCE_DISCOVERY_FORENSIC_LEDGER",
    "ledger_events": [],
    "required_review_set": [],
    "reviewed_items": [],
    "not_reviewed_items": [],
    "batch_review_log": [],
    "decision_log": [],
    "evidence_use_log": [],
    "routing_log": [],
    "artifact_retrieval_log": [],
    "gate_check_log": [],
    "coverage_matrix": {
      "candidate_count": 0,
      "reviewed_count": 0,
      "not_reviewed_count": 0,
      "admitted_count": 0,
      "deduplicated_suppressed_count": 0,
      "canonical_route_eligible_count": 0,
      "rejected_count": 0,
      "quarantined_count": 0,
      "access_failed_count": 0,
      "deferred_count": 0,
      "documented_absent_count": 0,
      "unknown_not_searched_count": 0,
      "coverage_ratio": 0,
      "coverage_status": "COMPLETE | COMPLETE_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE"
    },
    "token_and_runtime_summary": {
      "model_calls": 0,
      "batches_processed": 0,
      "artifact_retrieval_requests": 0,
      "started_at": "ISO-8601",
      "completed_at": "ISO-8601",
      "duration_ms": 0
    },
    "ledger_lock_status": "LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE"
  },
  "source_discovery_trace": {
    "trace_id": "p1_trace_{run_id}",
    "run_id": "",
    "phase_id": "P1",
    "phase_name": "01_SOURCE_DISCOVERY_EVIDENCE_BOX",
    "input_manifest_checked": true,
    "stage0_ledger_checked": true,
    "artifact_store_checked": true,
    "hash_verification_summary": {
      "checked_count": 0,
      "failed_count": 0,
      "failures": []
    },
    "batch_execution_summary": [],
    "forbidden_acts_checked": [
      "no_crawling_or_new_search",
      "no_target_profile",
      "no_feature_extraction",
      "no_legal_cartography",
      "no_data_provenance",
      "no_registry_evaluation",
      "no_final_report_prose",
      "no_search_snippet_as_evidence",
      "no_prior_model_memory"
    ],
    "repair_requests": [],
    "controlled_failures": [],
    "gate_results": [],
    "lock_readiness": "READY | NOT_READY"
  },
  "source_discovery_handoff": {
    "handoff_id": "p1_handoff_{run_id}",
    "run_id": "",
    "phase_id": "P1",
    "phase_name": "01_SOURCE_DISCOVERY_EVIDENCE_BOX",
    "source_mode": "url | text | url_plus_text | synthetic_demo",
    "target": {
      "target_url": "",
      "canonical_domain": "",
      "root_url": "",
      "company_name_candidate": "",
      "target_confidence": "HIGH | MEDIUM | LOW"
    },
    "stage0_manifest_ref": {
      "manifest_id": "",
      "manifest_hash": "",
      "candidate_count": 0,
      "lossless_artifact_count": 0,
      "artifact_store_root_uri": ""
    },
    "candidate_reconciliation": {
      "candidate_count": 0,
      "admitted_count": 0,
      "deduplicated_suppressed_count": 0,
      "canonical_route_eligible_count": 0,
      "rejected_count": 0,
      "quarantined_count": 0,
      "access_failed_count": 0,
      "deferred_count": 0,
      "documented_absent_count": 0,
      "unknown_not_searched_count": 0,
      "reconciliation_status": "BALANCED | REPAIR_REQUIRED | CONTROLLED_FAILURE"
    },
    "admitted_sources": [],
    "canonical_evidence_sources": [],
    "deduplicated_sources": [],
    "duplicate_clusters": [],
    "rejected_sources": [],
    "quarantined_sources": [],
    "access_failures": [],
    "deferred_candidates": [],
    "documented_absences": [],
    "unknown_not_searched": [],
    "evidence_box_manifest": [],
    "source_family_map": {
      "root_homepage": [],
      "product_platform": [],
      "product_solution": [],
      "legal_governance": [],
      "subprocessor": [],
      "security_trust": [],
      "docs_api_developer": [],
      "pricing_commercial": [],
      "blog_changelog_help": [],
      "hosted_governance_candidate": [],
      "pasted_public_material": [],
      "synthetic_demo": [],
      "unknown": []
    },
    "phase_packages": {
      "target_profile_package": [],
      "feature_profile_package": [],
      "legal_cartography_package": [],
      "data_provenance_package": [],
      "registry_support_package": [],
      "final_source_coverage_package": []
    },
    "coverage_limitations": [],
    "downstream_rules": {
      "direct_stage0_use_forbidden": true,
      "downstream_phases_use_evidence_source_ids_only": true,
      "full_text_access_core_family_only": true,
      "exception_access_validator_required": true
    },
    "lock_status": "LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE"
  }
}
```

## P1.SCHEMA.2 — Admitted Source Row

```json
{
  "evidence_source_id": "ev_0001",
  "candidate_source_id": "cand_0001",
  "lossless_artifact_id": "lossless_artifact_0001",
  "canonical_url": "",
  "source_family": "",
  "priority": "",
  "batch_id": "",
  "artifact_storage_uri": "",
  "clean_text_uri": "",
  "normalized_text_uri": "",
  "canonical_lossless_hash": "",
  "admission_basis": [],
  "artifact_limitations": [],
  "downstream_route_packages": []
}
```

## P1.SCHEMA.3 — Non-Admitted Source Row

```json
{
  "candidate_source_id": "cand_0001",
  "canonical_url": "",
  "source_family_hint": "",
  "final_status": "DEDUPLICATED_SUPPRESSED | REJECTED | QUARANTINED | ACCESS_FAILED | DEFERRED",
  "reason_codes": [],
  "artifact_refs_checked": [],
  "stage0_record_refs": [],
  "limitation_text": ""
}
```

</TRACE_LEDGER_AND_HANDOFF_SCHEMA>

---

<TERMINAL_GATE>

## P1.GATE.1 — Hard Gates

Stage 1 cannot lock unless all applicable gates pass.

```text
G1_ONE_TARGET_GATE
G2_STAGE0_MANIFEST_PRESENT_GATE
G3_ARTIFACT_STORE_RESOLUTION_GATE
G4_CANDIDATE_RECONCILIATION_GATE
G5_BATCH_COVERAGE_GATE
G6_FORENSIC_LEDGER_COMPLETENESS_GATE
G7_ADMISSION_STATUS_CONTROLLED_VALUES_GATE
G8_NO_SNIPPET_AS_EVIDENCE_GATE
G9_HOSTED_GOVERNANCE_BASIS_GATE
G10_DOCUMENTED_ABSENCE_BASIS_GATE
G11_EVIDENCE_BOX_REF_GATE
G12_PHASE_PACKAGE_ROUTING_GATE
G13_FORBIDDEN_ANALYSIS_GATE
G14_LOCK_STATUS_GATE
G15_ARTIFACT_RETRIEVAL_EXCEPTION_GATE
G16_EVIDENCE_DEDUPLICATION_GATE
```

## P1.GATE.2 — Gate Conditions

### G1_ONE_TARGET_GATE

Passes only if:
```text
exactly one target is present
source_mode is one of the controlled modes
canonical_domain/root_url is present when source_mode includes URL
pasted/synthetic modes do not introduce a second target identity
```

Fails if multiple companies/domains are mixed without a controlled `CONTROLLED_FAILURE`.

### G2_STAGE0_MANIFEST_PRESENT_GATE

Passes only if `hybrid_extraction_manifest` exists and contains:
```text
run_id or manifest_id
source_mode
target object or valid pasted/synthetic target descriptor
candidate_sources[]
lossless_text_artifacts[]
artifact_store_manifest
extraction_forensic_ledger or extraction ledger reference
batch_plan[] or enough data to construct one deterministically
```

Missing Stage 0 manifest, missing artifact store, or missing candidate inventory triggers `REPAIR_REQUIRED` or `CONTROLLED_FAILURE`.

### G3_ARTIFACT_STORE_RESOLUTION_GATE

Every admitted or canonical evidence source must have:
```text
lossless_artifact_id
artifact_storage_uri
canonical_lossless_hash
at least one usable text representation unless valid pasted/synthetic candidate
```

If a source cannot resolve to a retrievable artifact and is not a valid pasted/synthetic source, it cannot be admitted.

### G4_CANDIDATE_RECONCILIATION_GATE

Candidate-source reconciliation and artifact-family coverage are separate.

```text
candidate_sources.length
=
admitted + deduplicated_suppressed + rejected + quarantined + access_failed + deferred
```

Artifact-family coverage is separate:

```text
expected_artifact_families.length
=
found + documented_absent + unknown_not_searched + access_failed + deferred
```

Fails if any `candidate_source_id` disappears or if `DOCUMENTED_ABSENT` / `UNKNOWN_NOT_SEARCHED` is used to hide an unreviewed candidate source.

### G5_BATCH_COVERAGE_GATE

Every candidate must be assigned to a Stage 1 priority/family batch and each batch must have terminal status.

Passes only if:
```text
batch_review_log covers every stage0 batch or reconstructed batch
every reviewed item has batch_id
no random ungrouped review bucket exists unless repair-created and explained
```

### G6_FORENSIC_LEDGER_COMPLETENESS_GATE

Passes only if:
```text
required_review_set populated
reviewed_items + justified non-reviewed statuses cover all candidate_source_ids
coverage_ratio computed
ledger_events populated
decision_log populated
gate_check_log populated
ledger_lock_status = LOCKED
```

### G7_ADMISSION_STATUS_CONTROLLED_VALUES_GATE

Passes only if every candidate/source status uses the controlled vocabulary only:
```text
ADMITTED
DEDUPLICATED_SUPPRESSED
REJECTED
QUARANTINED
ACCESS_FAILED
DEFERRED
```

Artifact-family rows may use:
```text
FOUND
DOCUMENTED_ABSENT
UNKNOWN_NOT_SEARCHED
ACCESS_FAILED
DEFERRED
```

Flexible strings, invented status names, or mixed candidate/family statuses fail this gate.

### G8_NO_SNIPPET_AS_EVIDENCE_GATE

Any `SNIPPET_ONLY`, grounded-search summary, search result abstract, or model-scout rationale must not appear in `admitted_sources[]`, `canonical_evidence_sources[]`, `evidence_box_manifest[]`, or downstream `phase_packages`.

Snippet-only material may appear only in:
```text
quarantined_sources[]
rejected_sources[]
coverage_limitations[]
forensic ledger events
```

### G9_HOSTED_GOVERNANCE_BASIS_GATE

Hosted governance may be admitted only if the admission record includes controlled basis showing:
```text
company-specific artifact
publicly accessible full text or preserved artifact
linked from target footprint OR clearly company-controlled OR otherwise validator-accepted as qualifying hosted governance
artifact governs or describes the target service
not merely a generic third-party template/example
```

If basis is incomplete, classify as `QUARANTINED + HOSTED_GOVERNANCE_UNVERIFIED`.

### G10_DOCUMENTED_ABSENCE_BASIS_GATE

Every `DOCUMENTED_ABSENT` artifact-family row must include Stage 0 search/probe basis such as:
```text
known path probe
sitemap/robots check
nav/footer scan
grounded search query
coverage challenge result
retry/pivot record
```

If search/probe basis is missing, convert to `UNKNOWN_NOT_SEARCHED`.

### G11_EVIDENCE_BOX_REF_GATE

Every `evidence_box_manifest[]` row must resolve to:
```text
evidence_source_id
candidate_source_id
lossless_artifact_id
artifact_storage_uri or clean_text_uri
canonical_lossless_hash
source_family
admission_basis
```

Fails if an admitted evidence source lacks artifact lineage, hash, or source-family assignment.

### G12_PHASE_PACKAGE_ROUTING_GATE

Every canonical, non-suppressed evidence source must appear in `final_source_coverage_package` and must have at least one routing log event.

Suppressed duplicate sources must not appear in any downstream `phase_packages`.

Every routed package row must include:
```text
evidence_source_id
source_family
artifact_access_mode
routing_basis
```

### G13_FORBIDDEN_ANALYSIS_GATE

Fail if output contains target summary, feature inventory, legal conclusions, data provenance conclusions, registry statuses, recommendations, final-report prose, or any analysis outside source admission/routing/custody.

### G14_LOCK_STATUS_GATE

Passes only if:
```text
source_discovery_forensic_ledger.ledger_lock_status = LOCKED
source_discovery_handoff.lock_status = LOCKED
source_discovery_trace.lock_readiness = READY
all hard gates passed or controlled failure is explicitly emitted
```

If repair is required, lock status must be `REPAIR_REQUIRED`, not `LOCKED`.

### G15_ARTIFACT_RETRIEVAL_EXCEPTION_GATE

Passes only if every non-default artifact retrieval request is:
```text
scoped to a candidate_source_id or artifact_family
linked to a work_unit
justified by reason_code
recorded in ledger_events
approved or denied by validator/runtime
```

Fails if the model uses unrequested full text outside the active batch or imports non-core evidence without an exception record.

### G16_EVIDENCE_DEDUPLICATION_GATE

Passes only if:
```text
all admitted evidence sources are checked for deterministic duplicate signals
exact hash duplicates are clustered
canonical URL duplicates are clustered
duplicate_clusters[] preserves primary + suppressed members
deduplicated_sources[] preserves suppressed duplicate provenance
canonical_evidence_sources[] excludes suppressed duplicates
phase_packages route canonical_evidence_sources[] only
```

Fails if:
```text
same canonical_lossless_hash appears in two routed evidence sources
same canonical_url appears in two routed evidence sources without validator justification
suppressed duplicate appears in downstream package
duplicate is erased from ledger instead of preserved as suppressed
unique substantive page is suppressed solely because of footer/header boilerplate
```

## P1.GATE.3 — Terminal Self-Check

Before final JSON, verify:

```text
CHECK 1 — Every candidate_source_id is accounted for.
CHECK 2 — Candidates were processed by priority/family batch, not random order.
CHECK 3 — Forensic ledger events exist for every reviewed item.
CHECK 4 — No search snippet was admitted as evidence.
CHECK 5 — Every admitted source has resolvable artifact refs.
CHECK 6 — Rejected, quarantined, access failed, deferred, documented absent, and unknown-not-searched are separated.
CHECK 7 — Every documented absence cites Stage 0 search/probe basis.
CHECK 8 — Evidence de-duplication ran before routing.
CHECK 9 — Suppressed duplicate evidence sources are preserved in duplicate_clusters[] / deduplicated_sources[] and are not routed.
CHECK 10 — Every canonical evidence source routes into final_source_coverage_package.
CHECK 11 — No target/feature/legal/data/registry analysis appears.
CHECK 12 — Final response has exactly source_discovery_forensic_ledger, source_discovery_trace, and source_discovery_handoff.
```

## P1.GATE.4 — Final Emission Rule

Emit final answer as strict JSON only:

```json
{
  "source_discovery_forensic_ledger": {},
  "source_discovery_trace": {},
  "source_discovery_handoff": {}
}
```

</TERMINAL_GATE>
