# 00_SOURCE_EXTRACTION_CONTRACT_v3_UNIVERSAL_LOCKED

Contract: S0 Source Extraction Contract  
Runtime Parent: The Interface Diligence Engine  
Node: S0  
Modes: `MONOLITH_RUNTIME` + `PHASE_STACK_RUNTIME`  
Canonical outputs: `hybrid_extraction_manifest`, `extraction_forensic_ledger`

S0 is a bounded public-source selector. It collects, classifies, fetches, dedupes, preserves full lossless source content, records limitations, and emits a universal handoff. S0 does not profile, extract features, infer data provenance, assess legal stack, evaluate registry rows, compile findings, or generate reports.

---

# LAYER 1 — CANON

## C1. Role Boundary
Upstream: Runtime Kernel.

S0 MAY:
```text
collect
classify
fetch
dedupe
preserve full lossless content
verify source uniqueness
record failures
package handoff
```

S0 MUST NOT:
```text
summarize accepted evidence
use prior model memory
use third-party summaries
process private/confidential materials
profile target
feature-extract
infer data provenance
assess legal stack
evaluate registry
write findings
produce HTML
make legal/compliance conclusions
```

Allowed language: `not visible in reviewed public footprint`, `not publicly verifiable`, `no public artifact found`, `requires qualified review`.  
Forbidden language: `illegal`, `non-compliant`, `liable`, `unenforceable`, `confirmed violation`, unless quoted verbatim.

## C2. Evidence Firewall
Upstream: C1.

Admissible:
```text
target domain
company-controlled subdomain
qualifying hosted governance artifact
pasted public first-party material
synthetic demo fixture in synthetic_demo mode
```

Qualifying hosted governance requires all:
```text
linked from target footprint or clearly company-controlled
company-specific text
recognized governance/document class
```

Search snippets are candidate leads only. They cannot enter `lossless_text_artifacts[]`.

Kill list:
```text
Crunchbase
PitchBook
TechCrunch
press summaries
investor blurbs
review sites
directories
forums
social commentary
prior model knowledge
```

## C3. Runtime Ignition
Upstream: C1-C2.

Source modes:
```text
url
text
url_plus_text
synthetic_demo
```

Downstream modes:
```text
MONOLITH_RUNTIME
PHASE_STACK_RUNTIME
```

Rules:
```text
same handoff supports both modes
no monolith-only root
no phase-stack-only root
root outputs stay canonical
```

## C4. LLM Failure Controls
Upstream: C1-C3.

Every S0 execution must counter:
```text
1 hallucination / prior-knowledge contamination
2 front-loaded instruction bias
3 recency / terminal overwrite bias
4 middle-out / lost-in-the-middle failure
5 instruction dilution
6 role drift / premature synthesis
7 schema drift / nomenclature mutation
8 classification bias
9 quota satisfaction bias
10 evidence dilution / repetition amplification
11 false blocking / brittle validation
```

Required controls:
```text
four-layer structure
upstream references per step
closed taxonomy
known path bank
full lossless accepted content
deterministic dedupe first
model review only for ambiguity/satisfaction
nonblocking repair max 2 attempts
canonical nomenclature only
```

## C5. Family/Subfamily Taxonomy
Upstream: C1-C4.

Family order:
```text
TARGET_FAMILY → PRODUCT_FAMILY → LEGAL_FAMILY → DATA_FAMILY
```

Family caps:
```text
TARGET_FAMILY = 5 hard max / 3 normal stop
PRODUCT_FAMILY = 10 hard max
LEGAL_FAMILY = 10 hard max
DATA_FAMILY = 5 hard max
TOTAL ACCEPTED LOSSLESS SOURCES = 30 hard max
```

Subfamilies:
```text
TARGET_FAMILY
  T0_ROOT
  T1_IDENTITY
  T2_LEGAL_IDENTITY
  T3_OPERATOR_ENTITY
  T4_SUPPORTING_IDENTITY

PRODUCT_FAMILY
  P0_PRODUCT_ROOT
  P1_PRODUCT_SLUG
  P2_PLATFORM_FEATURE_SOLUTION
  P3_AI_CAPABILITY_TECHNICAL
  P4_USE_CASE_INDUSTRY
  P5_ENTERPRISE_PRICING

LEGAL_FAMILY
  L1_CORE_TERMS_PRIVACY
  L2_B2B_CONTRACTING
  L3_AI_USAGE_GOVERNANCE
  L4_PRIVACY_ADJACENT_NOTICES
  L5_LEGAL_HUB_HOSTED
  L6_ENTITY_NOTICE

DATA_FAMILY
  D1_SECURITY_TRUST
  D2_SUBPROCESSOR_PRIVACY_CENTER
  D3_DATA_GOVERNANCE_CONTROLS
  D4_DOCS_API_DATA_FLOW
  D5_AI_SAFETY_TRANSPARENCY
```

Subfamily caps:
```text
T0_ROOT=1
T1_IDENTITY=1
T2_LEGAL_IDENTITY=1
T3_OPERATOR_ENTITY=1 fallback
T4_SUPPORTING_IDENTITY=1 fallback

P0_PRODUCT_ROOT=1
P1_PRODUCT_SLUG=5
P2_PLATFORM_FEATURE_SOLUTION=2
P3_AI_CAPABILITY_TECHNICAL=2
P4_USE_CASE_INDUSTRY=fallback replacement
P5_ENTERPRISE_PRICING=fallback replacement

L1_CORE_TERMS_PRIVACY=2
L2_B2B_CONTRACTING=3
L3_AI_USAGE_GOVERNANCE=2
L4_PRIVACY_ADJACENT_NOTICES=1
L5_LEGAL_HUB_HOSTED=1
L6_ENTITY_NOTICE=1

D1_SECURITY_TRUST=1
D2_SUBPROCESSOR_PRIVACY_CENTER=1
D3_DATA_GOVERNANCE_CONTROLS=1
D4_DOCS_API_DATA_FLOW=1
D5_AI_SAFETY_TRANSPARENCY=1
```

Quota full is not coverage satisfied. Every accepted source must earn its place.

## C6. Known Path Bank
Upstream: C5.

### TARGET_FAMILY
```text
T0_ROOT: /
T1_IDENTITY: /about, /about-us, /company, /our-company, /who-we-are
T2_LEGAL_IDENTITY: /legal, /legal-notice, /imprint, /contact, /contact-us
T3_OPERATOR_ENTITY: /privacy, /terms, /dpa, /legal
T4_SUPPORTING_IDENTITY: /team, /careers, /newsroom, /press
```

Target rules:
```text
always fetch root
after root fetch at most 2 identity/legal-identity pages unless identity unresolved
use T3/T4 only if company_name/legal_entity/HQ/operator remains unresolved
do not spend target quota on blog/customer/generic press/careers unless no stronger identity source exists
```

### PRODUCT_FAMILY
```text
P0_PRODUCT_ROOT:
/product, /products, /platform

P1_PRODUCT_SLUG:
/product/{slug}, /products/{slug}, /#/product/{slug}, /#/products/{slug}

P2_PLATFORM_FEATURE_SOLUTION:
/platform, /platform/{slug}, /features, /features/{slug}, /solutions, /solutions/{slug}, /#/platform/{slug}, /#/features/{slug}, /#/solutions/{slug}

P3_AI_CAPABILITY_TECHNICAL:
/models, /models/{slug}, /agents, /agents/{slug}, /assistant, /assistants, /studio, /api, /apis, /developer, /developers, /docs, /integrations, /connectors, /actions, /workflows, /automation, /search, /knowledge, /vault

P4_USE_CASE_INDUSTRY:
/use-cases, /use-case/{slug}, /industries, /industry/{slug}, /customers

P5_ENTERPRISE_PRICING:
/pricing, /enterprise, /contact-sales, /plans
```

Product rules:
```text
fetch discovered product slugs first
product slugs must come from nav/sitemap/hash/root/search scout
never brute-force {slug}
when discovered product-slug set is exhausted, stop slug discovery
do not fetch weak /features /solutions /use-cases /blog /customers merely to fill quota
```

### LEGAL_FAMILY
```text
L1_CORE_TERMS_PRIVACY:
/terms, /terms-of-use, /terms-of-service, /terms-and-conditions, /legal/terms, /policies/terms-of-use, /privacy, /privacy-policy, /legal/privacy, /policies/privacy-policy, /eula

L2_B2B_CONTRACTING:
/dpa, /data-processing-agreement, /legal/dpa, /legal/data-processing-agreement, /policies/data-processing-addendum, /aup, /acceptable-use, /acceptable-use-policy, /legal/acceptable-use-policy, /sla, /service-level-agreement, /service-credit-terms, /platform-agreement, /customer-agreement

L3_AI_USAGE_GOVERNANCE:
/usage-policy, /acceptable-use-policy, /content-policy, /ai-policy, /responsible-ai, /model-policy, /safety-policy

L4_PRIVACY_ADJACENT_NOTICES:
/cookie-policy, /cookies, /privacy-center, /do-not-sell, /data-privacy-framework, /gdpr, /ccpa

L5_LEGAL_HUB_HOSTED:
/legal, /legal-center, /legal-hub, /policies, /terms-and-policies, /trust, /trust-center

L6_ENTITY_NOTICE:
/legal-notice, /imprint, /contact, /controller
```

Hosted governance candidates:
```text
legal.{domain}
trust.{domain}
security.{domain}
compliance.{domain}
privacy.{domain}
iubenda
Termly
Termsfeed
OneTrust
TrustArc
Vanta
Drata
Secureframe
SafeBase
TrustCloud
Whistic
Conveyor
Notion
Webflow
GitHub Pages
```

Legal rules:
```text
resolve ToS Privacy Policy DPA AUP SLA
FOUND / ABSENT_AFTER_TARGETED_PROBE / ACCESS_FAILED / INSUFFICIENT_TEXT are terminal collection states
stop once status is resolved
```

### DATA_FAMILY
```text
D1_SECURITY_TRUST:
/security, /security-center, /data-security, /trust, /trust-center, /compliance, /compliance-center, /soc-2, /iso-27001

D2_SUBPROCESSOR_PRIVACY_CENTER:
/subprocessors, /subprocessor, /privacy-center, /data-protection, /gdpr, /dpa, /data-processing-agreement

D3_DATA_GOVERNANCE_CONTROLS:
/enterprise-privacy, /customer-data, /data-processing, /data-residency, /retention, /deletion, /data-export, /data-deletion

D4_DOCS_API_DATA_FLOW:
/docs, /developer, /developers, /api, /api-reference, /integrations, /connectors, /webhooks, /actions, /authentication, /audit-logs, /permissions

D5_AI_SAFETY_TRANSPARENCY:
/responsible-ai, /ai-policy, /ai-transparency, /transparency, /safety, /model-card, /model-cards, /model-details, /usage-policy
```

D4 Docs/API gate:
```text
fetch only if URL/anchor/title/route basis contains data-flow signal:
data, file, upload, storage, retention, delete, export, webhook, connector, integration, auth, permission, audit, log, subprocessor, model, training, customer content
```

Data rules:
```text
security/trust/subprocessor/privacy-center outrank docs
never crawl broad docs trees
docs/API gets one slot unless subfamily review justifies targeted second pass
```

## C7. Deterministic / Model Split
Upstream: C1-C6.

Deterministic may:
```text
canonicalize URL
build navigation_map
extract nav/footer/header/sitemap/robots/hash routes
generate known-path candidates
scope filter
classify obvious paths
apply caps
fetch
extract raw_text/clean_text
dedupe by URL/hash/canonical/redirect
assemble schema
repair schema
```

Model may:
```text
search scout leads
coverage challenge leads
ambiguous family/subfamily review
near-duplicate review
subfamily satisfaction review
```

Model must not:
```text
summarize accepted content
profile target
feature-extract
infer data provenance
legal-stack assess
registry evaluate
write findings
certify absence
invent product slugs
treat snippets as evidence
```

---

# LAYER 2 — EXECUTION STEPS

Each step must keep: `Purpose`, `Upstream References`, `Consumes`, `Emits`, `Rules`, `Failure Route`.

## SX.0 Input Validation + Target Canonicalization
Upstream: C1-C3.  
Consumes: user input.  
Emits: `target{}`, `extraction_call_card{}`, ledger event.  
Rules:
```text
one target only
valid source_mode only
canonicalize target_url/root/canonical_domain/allowed_hosts
text mode disables search/fetch
synthetic_demo marked demo-only
```
Failure: invalid mode/no clear target/prohibited-only material = fatal; hosted-domain ambiguity = model review max 2.

## SX.1 Root Fetch + Navigation Map
Upstream: C2, C5, C6.  
Consumes: `target{}`.  
Emits: `navigation_map{}`, route seeds.  
Rules:
```text
root first in URL modes
extract header/footer/root anchors/sitemap/robots/hash routes
classify routes by family
search scout cannot run before navigation attempt
```
Failure: root fetch retry once; if still failed run search scout; if unresolved limitation.

## SX.2 Candidate Generation
Upstream: C5-C6, SX.1.  
Consumes: `navigation_map{}`, known path bank.  
Emits: `candidate_sources[]`.  
Rules:
```text
navigation candidates first
legal/data canonical probes allowed even if not visible
product slug brute-force forbidden
search scout only for missing core family/subfamily
every candidate gets route_source + route_basis
```
Failure: missing core family → search scout; scout-only third-party → reject.

## SX.3 Family/Subfamily Classification
Upstream: C5-C6.  
Consumes: `candidate_sources[]`.  
Emits: classified `candidate_sources[]`.  
Rules:
```text
classify by path + route basis + anchor + title + known bank
legal/data tie: contract/policy = LEGAL; controls/security/subprocessor/retention/transfer/data-flow = DATA
ambiguous cases → model review
```
Failure: unresolved unclassified candidate deferred with limitation.

## SX.4 Deterministic Candidate Dedupe
Upstream: C5-C7.  
Consumes: classified candidates.  
Emits: `dedupe_records[]`, candidate status updates.  
Dedupe by:
```text
normalized URL
canonical URL
redirect target
tracking-param stripped URL
canonical tag
same hash route
known-path equivalence
```
Failure: keep strongest route_source, log conflict.

## SX.5 Family/Subfamily Queue Selection
Upstream: C5-C6, SX.3-SX.4.  
Consumes: deduped candidates.  
Emits: fetch queue, stop states.  
Rules:
```text
family order TARGET→PRODUCT→LEGAL→DATA
subfamily caps before family caps
route strength HEADER/FOOTER > SITEMAP > ROOT > HASH > KNOWN_PATH_PROBE > SEARCH_SCOUT
product quota is max not target
do not fill quotas with weak sources
```
Failure: no queue for unresolved family → search scout/challenge if justified.

## SX.6 Fetch Ladder + Full Lossless Extraction
Upstream: C2, C6-C7, SX.5.  
Consumes: fetch queue.  
Emits: `lossless_text_artifacts[]`, `artifact_inventory[]`, `fetch_log`.  
Rules:
```text
http/https public only
stop at login/paywall/private/auth wall
extract raw_text + clean_text
accepted source must preserve full lossless content
no summaries
no excerpt-only accepted source
no accepted snippet-only source
record hash/count/quality/lineage
```
Failure: fetch retry once; thin extraction targeted retry; unresolved = ACCESS_FAILED or INSUFFICIENT_TEXT.

## SX.7 Content Dedupe + Accepted-Source Gate
Upstream: C4-C7, SX.6.  
Consumes: fetched artifacts.  
Emits: accepted `lossless_text_artifacts[]`, `dedupe_records[]`, limitations.  
Accepted source must:
```text
be in scope
fit open family/subfamily slot
preserve full lossless content
not duplicate accepted source
add unique evidentiary value
carry lineage/hash/url/family/subfamily/artifact_type
```
Content dedupe by:
```text
raw hash
clean hash
normalized hash
boilerplate-stripped hash
title similarity
first 800-1200 char body similarity
same legal shell
```
Failure: duplicate suppressed; ambiguous near-duplicate → SX.8; unclear value → SX.9.

## SX.8 Model Near-Duplicate Review
Upstream: C7, SX.7.  
Consumes: compact metadata/fingerprints/headings.  
Emits: `model_review_log`, `dedupe_records[]`.  
Decisions:
```text
KEEP_UNIQUE
KEEP_CANONICAL
DEFER_NEAR_DUPLICATE
DEFER_REPETITIVE_TEMPLATE
DEFER_LOW_INCREMENTAL_VALUE
```
Failure: after 2 ambiguous attempts, keep strongest canonical source and warn.

## SX.9 Model Subfamily Satisfaction Review
Upstream: C4-C7, SX.5-SX.8.  
Consumes: accepted source metadata, `collection_summary`, `artifact_inventory`.  
Emits: `model_review_log`, limitations, challenge recommendations.  
Statuses:
```text
SATISFIED
THIN
MISFILLED_SLOT
DUPLICATIVE
UNAVAILABLE_AFTER_SEARCH
NEEDS_COVERAGE_CHALLENGE
```
Allowed actions:
```text
LOCK
RUN_COVERAGE_CHALLENGE
RECLASSIFY
DROP_DUPLICATE
DEFER_EXTRA
```
Failure: MISFILLED_SLOT repaired/reclassified/dropped; THIN limitation-routed; challenge only if quota remains.

## SX.10 Coverage Challenge
Upstream: C5-C7, SX.9.  
Consumes: unresolved family/subfamily slots.  
Emits: challenge leads and log.  
Rules:
```text
only unresolved family/subfamily
no all-family reopen
respect remaining caps
no weak P4 unless resolving missing family/subfamily
candidate leads only
```
Failure: no leads → UNAVAILABLE_AFTER_SEARCH; useful leads → SX.11.

## SX.11 Targeted Second Pass
Upstream: SX.10.  
Consumes: challenge-approved candidates.  
Emits: updated artifacts/dedupe/limitations.  
Rules:
```text
only failed/unresolved item
no global rerun
max 2 repair attempts per failure
unresolved nonfatal → warning + forensic archive
```

## SX.12 Manifest Assembly
Upstream: all C/SX.  
Consumes: all S0 records.  
Emits: `hybrid_extraction_manifest`, `extraction_forensic_ledger`.  
Rules:
```text
canonical fields only
exactly two roots
no discussion/retired fields
universal for monolith + phase stack
schema repair max 2
schema impossible = fatal
```

---

# LAYER 3 — GATES

## G1 Boundary Gate
Checks:
```text
valid mode
one target
public-only material
no prohibited material admitted
```
Fatal only for invalid mode, no target, prohibited-only material.

## G2 Navigation Gate
Checks:
```text
root attempted or text-mode bypass logged
navigation_map populated or limitation logged
sitemap/robots/hash attempted when available
```

## G3 Family/Subfamily Gate
Checks:
```text
candidate family/subfamily or defer reason present
caps applied
product slug brute-force absent
legal/data probes applied
```

## G4 Full Lossless Gate
Checks:
```text
accepted artifact has raw_text + clean_text
not snippet-only
hashes/counts present
preservation status recorded
```

## G5 Unique Value / Dedupe Gate
Checks:
```text
URL dedupe complete
content dedupe complete
model near-duplicate review where triggered
every accepted source earns its place
```

## G6 Subfamily Satisfaction Gate
Checks:
```text
no quota-only slot filling
model satisfaction review complete
misfilled slots repaired or limitation-routed
```

## G7 Nonblocking Repair Gate
Checks:
```text
repairable failure has ticket
attempt_count <= 2
unresolved nonfatal archived
single failure does not doom S0
```

Failure ticket:
```json
{
  "failure_id": "",
  "gate_id": "",
  "failed_condition": "",
  "affected_item_ids": [],
  "failure_severity": "REPAIRABLE | WARNING | FATAL",
  "repair_route": "DETERMINISTIC_REPAIR | MODEL_REVIEW | COVERAGE_CHALLENGE | FETCH_RETRY | SCHEMA_REPAIR",
  "attempt_count": 0,
  "max_attempts": 2,
  "final_status": "RESOLVED | PASSED_WITH_WARNING | FATAL"
}
```

## G8 Terminal Schema Gate
Checks:
```text
exactly two roots
hybrid_extraction_manifest has exactly 10 top-level fields
extraction_forensic_ledger has exactly 8 top-level fields
canonical nomenclature preserved
downstream_handoff present
```

---

# LAYER 4 — FINAL OUTPUT

## O1. Root Output
```json
{
  "hybrid_extraction_manifest": {},
  "extraction_forensic_ledger": {}
}
```

## O2. hybrid_extraction_manifest
Top-level fields must be exactly:
```text
extraction_call_card
target
navigation_map
collection_summary
candidate_sources
artifact_inventory
lossless_text_artifacts
dedupe_records
collection_limitations
downstream_handoff
```

Schema:
```json
{
  "extraction_call_card": {
    "node_id": "S0",
    "contract_version": "s0_source_extraction_contract_v3_universal_locked",
    "adapter_version": "",
    "run_id": "",
    "source_mode": "url | text | url_plus_text | synthetic_demo",
    "downstream_mode": "MONOLITH_RUNTIME | PHASE_STACK_RUNTIME",
    "canonical_output": "hybrid_extraction_manifest",
    "search_pool_enabled": true,
    "grounding_enabled": true,
    "deterministic_fetch_enabled": true,
    "output_is_candidate_only": true,
    "generated_at": ""
  },
  "target": {
    "target_url": "",
    "normalized_target_url": "",
    "canonical_domain": "",
    "root_url": "",
    "allowed_hosts": [],
    "company_name_candidate": "",
    "normalization_notes": []
  },
  "navigation_map": {
    "root_url": "",
    "header_links": [],
    "footer_links": [],
    "sitemap_links": [],
    "robots_sitemap_links": [],
    "spa_hash_routes": [],
    "candidate_routes_by_family": {
      "TARGET_FAMILY": [],
      "PRODUCT_FAMILY": [],
      "LEGAL_FAMILY": [],
      "DATA_FAMILY": []
    }
  },
  "collection_summary": {
    "collection_status": "COMPLETED | COMPLETED_WITH_LIMITATIONS | CONTROLLED_FAILURE",
    "candidate_count": 0,
    "accepted_source_count": 0,
    "lossless_artifact_count": 0,
    "fetch_success_count": 0,
    "fetch_failure_count": 0,
    "dedupe_suppressed_count": 0,
    "deferred_count": 0,
    "scope_rejected_count": 0,
    "family_caps": {},
    "family_counts": {},
    "subfamily_counts": {},
    "family_stop_states": {},
    "coverage_status_by_family": {},
    "source_runtime_trace": {}
  },
  "candidate_sources": [
    {
      "candidate_source_id": "",
      "candidate_url": "",
      "canonical_url": "",
      "source_family": "",
      "source_subfamily": "",
      "route_source": "ROOT | HEADER | FOOTER | SITEMAP | ROBOTS | HASH_ROUTE | KNOWN_PATH_PROBE | SEARCH_SCOUT | COVERAGE_CHALLENGE | PASTED_TEXT | SYNTHETIC_DEMO",
      "route_basis": "",
      "scope_class": "TARGET_DOMAIN_CANDIDATE | COMPANY_CONTROLLED_SUBDOMAIN_CANDIDATE | HOSTED_GOVERNANCE_CANDIDATE | PASTED_PUBLIC_MATERIAL_CANDIDATE | SYNTHETIC_DEMO_CANDIDATE | THIRD_PARTY_NON_GOVERNANCE | PRIVATE_OR_PROHIBITED",
      "fetch_decision": "FETCH | DEFER | REJECT",
      "fetch_decision_reason": "",
      "final_status": "ACCEPTED_LOSSLESS | FETCH_FAILED | DEDUPED | DEFERRED | REJECTED | SNIPPET_ONLY_QUARANTINED"
    }
  ],
  "artifact_inventory": [
    {
      "artifact_id": "",
      "candidate_source_id": "",
      "artifact_type": "Homepage | Product Page | ToS | Privacy Policy | DPA | AUP | SLA | Trust Center | Security Page | Subprocessor Page | Legal Center | AI Policy | Documentation | Developer Docs | API Docs | Pricing Page | Other",
      "artifact_class": "TARGET_SURFACE | PRODUCT_SURFACE | CORE_LEGAL | GOVERNANCE_SURFACE | DATA_SURFACE | FOOTPRINT_WIDE",
      "status": "FOUND | ABSENT | ACCESS_FAILED | INSUFFICIENT_TEXT",
      "source_url": "",
      "source_family": "",
      "source_subfamily": "",
      "lossless_artifact_ref": "",
      "absence_basis": "",
      "warning": ""
    }
  ],
  "lossless_text_artifacts": [
    {
      "lossless_artifact_id": "",
      "candidate_source_id": "",
      "artifact_id": "",
      "source_url": "",
      "source_family": "",
      "source_subfamily": "",
      "artifact_type": "",
      "fetch_method_lineage": [],
      "raw_text": "",
      "clean_text": "",
      "normalized_text_hash": "",
      "content_hash": "",
      "char_count": 0,
      "word_count": 0,
      "extraction_quality": "GOOD | PARTIAL | THIN | EMPTY",
      "lossless_preservation_status": "PRESERVED | PARTIAL_PRESERVED | FAILED",
      "snippet_only": false
    }
  ],
  "dedupe_records": [
    {
      "dedupe_record_id": "",
      "dedupe_type": "URL_NORMALIZATION | REDIRECT_TARGET | CANONICAL_TAG | CONTENT_HASH | NORMALIZED_TEXT_HASH | BOILERPLATE_STRIPPED_HASH | MODEL_NEAR_DUPLICATE_REVIEW",
      "canonical_candidate_source_id": "",
      "suppressed_candidate_source_ids": [],
      "dedupe_basis": [],
      "model_review_ref": "",
      "not_silently_dropped": true
    }
  ],
  "collection_limitations": [
    {
      "limitation_id": "",
      "limitation_type": "ACCESS_FAILED | THIN_COVERAGE | UNFILLED_SUBFAMILY | MISFILLED_SLOT | PASSED_WITH_WARNING | TOOL_LIMITATION | SOURCE_UNAVAILABLE | SNIPPET_ONLY_QUARANTINED",
      "affected_family": "",
      "affected_subfamily": "",
      "affected_item_ids": [],
      "basis": "",
      "downstream_effect": "",
      "forensic_ref": ""
    }
  ],
  "downstream_handoff": {
    "canonical_next_use": "MONOLITH_MODULE_VI_EVIDENCE_BUFFER | PHASE_1_SOURCE_DISCOVERY_EVIDENCE_BOX",
    "candidate_only": true,
    "lossless_text_available": true,
    "artifact_inventory_ready": true,
    "snippet_only_forbidden_as_accepted_evidence": true,
    "evidence_buffer_materials": {
      "source_text_array": "lossless_text_artifacts[]",
      "artifact_map": "artifact_inventory[]",
      "source_metadata": "candidate_sources[]",
      "limitations": "collection_limitations[]"
    }
  }
}
```

## O3. extraction_forensic_ledger
Top-level fields must be exactly:
```text
ledger_meta
ledger_events
candidate_discovery_log
fetch_log
dedupe_log
model_review_log
validation_repair_log
terminal_gate_log
```

Schema:
```json
{
  "ledger_meta": {
    "ledger_id": "",
    "node_id": "S0",
    "run_id": "",
    "contract_version": "s0_source_extraction_contract_v3_universal_locked",
    "ledger_type": "EXTRACTION_FORENSIC_LEDGER",
    "started_at": "",
    "completed_at": "",
    "ledger_lock_status": "LOCKED | LOCKED_WITH_WARNINGS | CONTROLLED_FAILURE"
  },
  "ledger_events": [],
  "candidate_discovery_log": [],
  "fetch_log": [],
  "dedupe_log": [],
  "model_review_log": [],
  "validation_repair_log": [],
  "terminal_gate_log": []
}
```

## O4. Terminal Validity Rule
Valid S0 output requires:
```text
exactly two roots
no third root
accepted sources are full lossless or limitation-routed
candidate drops are recorded
dedupe is recorded
model reviews are logged where triggered
nonfatal failures are repaired or archived
downstream mode is declared
canonical nomenclature is preserved
