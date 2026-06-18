# THE INTERFACE DILIGENCE ENGINE
# 00_SOURCE_EXTRACTION_CONTRACT.md

**Status:** Stage 0 source extraction contract  
**Canonical Parent:** `00_RUNTIME_SPINE.md`  
**Runtime Index:** `00_RUNTIME_SPINE_INDEX.md`  
**Stage:** `0`  
**Stage Name:** Hybrid Source Extraction  
**Purpose:** Discover, fetch, extract, dedupe, classify, and package candidate public source material before Phase 1 admission.  
**Important:** Stage 0 produces candidate material only. It does not admit evidence.

---

## CONTRACT RULE 0 — NO EVIDENCE ADMISSION

`SX.0.C1` This contract governs source extraction before `01_SOURCE_DISCOVERY_EVIDENCE_BOX.md`.

`SX.0.C2` Stage 0 does not create admitted evidence.

`SX.0.C3` Stage 0 does not create the Evidence Box.

`SX.0.C4` Stage 0 does not emit `source_discovery_handoff`.

`SX.0.C5` Stage 0 emits only `hybrid_extraction_manifest` and supporting candidate text references.

`SX.0.C6` Every candidate source must be reviewed by Phase 1 before it may become admitted evidence.

`SX.0.C7` Search result snippets, grounded-search summaries, candidate family hints, and model-scout rationales are collection leads only. They must not become admitted evidence. Phase 1 may only quarantine or reject snippet-only material and preserve the limitation.

`SX.0.C8` No downstream phase may read Stage 0 material directly. Downstream phases may read only Phase 1 admitted/routed evidence packages.

---

# 1. EXTRACTION CALL CARD

The orchestrator must construct this call card before Stage 0 begins.

```yaml
extraction_call_card:
  runtime_parent: 00_RUNTIME_SPINE.md
  runtime_index: 00_RUNTIME_SPINE_INDEX.md
  extraction_contract: 00_SOURCE_EXTRACTION_CONTRACT.md

  active_stage: 0
  active_layer: Hybrid Source Extraction
  canonical_output: hybrid_extraction_manifest

  source_mode: url | text | url_plus_text | synthetic_demo
  target_url: <url_or_null>
  pasted_public_material_ref: <blob_ref_or_null>
  synthetic_demo_ref: <demo_ref_or_null>

  allowed_hosts:
    - <canonical_domain>
    - <www_domain>
    - <known_company_controlled_subdomain>

  search_pool_enabled: true | false
  grounding_enabled: true | false
  deterministic_fetch_enabled: true
  jina_or_reader_enabled: true | false
  browser_render_fallback_enabled: true | false

  output_is_candidate_only: true
  phase_1_required_for_admission: true

  failure_route:
    - extraction_repair
    - source_limitation
    - controlled_failure
```

---

# 2. HARD RULES

## 2.1 MUST

`SX.2.1.C1` MUST enforce the one-target rule before collection.

`SX.2.1.C2` MUST normalize target URL, canonical domain, scheme, and allowed host set.

`SX.2.1.C3` MUST collect candidate source URLs using deterministic discovery and grounded search scouting when source mode permits web discovery.

`SX.2.1.C4` MUST fetch and extract candidate URLs before they can be passed to Phase 1 as source candidates.

`SX.2.1.C5` MUST preserve raw/clean extraction references, content hashes, fetch method, status code, collection timestamp, word count, and extraction quality.

`SX.2.1.C6` MUST dedupe by normalized URL, canonical URL, redirect target, URL fragment policy, canonical lossless hash, normalized text hash, and artifact lineage before emitting the final candidate manifest.

`SX.2.1.C7` MUST classify each candidate into a priority tier and source family hint.

`SX.2.1.C8` MUST record all rejected-by-scope URLs, fetch failures, deferred candidates, and collection limitations.

`SX.2.1.C9` MUST execute coverage challenge before finalizing the manifest when source mode is `url` or `url_plus_text`.

`SX.2.1.C10` MUST emit `hybrid_extraction_manifest` even when extraction is sparse, unless controlled failure is required.

`SX.2.1.C11` MUST discover product/platform descendant routes from visible roots, sitemap entries, anchor cards, JavaScript route hints, hash routes, and grounded search leads. A top-level `/product`, `/products`, `/platform`, or `/solutions` path is only an entry point, not sufficient product discovery if child product routes exist.

`SX.2.1.C12` MUST assign `root_cluster_id` to every discovered URL so downstream batching can prove which root/index/path family produced the candidate.

## 2.2 MUST NOT

`SX.2.2.C1` MUST NOT admit evidence.

`SX.2.2.C2` MUST NOT perform target profiling.

`SX.2.2.C3` MUST NOT perform feature extraction.

`SX.2.2.C4` MUST NOT perform legal cartography.

`SX.2.2.C5` MUST NOT infer data provenance.

`SX.2.2.C6` MUST NOT evaluate registry rows.

`SX.2.2.C7` MUST NOT generate final findings, risk conclusions, compliance conclusions, liability conclusions, or legal conclusions.

`SX.2.2.C8` MUST NOT use search snippets, model summaries, third-party descriptions, press pages, review sites, investor databases, or prior model memory as proof.

`SX.2.2.C9` MUST NOT silently drop discovered candidates. Fetch, reject, quarantine-for-Phase-1-review, defer with reason, or record failure.

`SX.2.2.C10` MUST NOT bypass login walls, paywalls, bot-protection, private dashboards, credential gates, or non-public material.

`SX.2.2.C11` MUST NOT ask the user for confidential documents, credentials, private MSAs, private DPAs, or login access.

## 2.3 STOP IF

`SX.2.3.C1` STOP if more than one target is supplied and no single target is clearly selected.

`SX.2.3.C2` STOP if source mode is invalid.

`SX.2.3.C3` STOP if source mode requires URL extraction and no valid target URL exists.

`SX.2.3.C4` STOP if all provided material is prohibited/private/confidential and no safe public-material path exists.

`SX.2.3.C5` STOP if deterministic fetch and search scout both fail tool-wide and no candidate material exists.

---

# 3. SOURCE MODE BRANCHING

| Source Mode | Stage 0 Behavior | Search Pool | Fetch/Extract | Output |
|---|---|---:|---:|---|
| `url` | Full hybrid extraction from target public footprint. | Yes | Yes | `hybrid_extraction_manifest` with URL candidates. |
| `url_plus_text` | Full hybrid extraction first, then append pasted public material as candidate material. | Yes | Yes | Manifest includes URL candidates + pasted material candidate. |
| `text` | Bypass web discovery. Package pasted text as candidate public material for Phase 1 review. | No | No | Manifest includes pasted material candidate. |
| `synthetic_demo` | Bypass web discovery. Package synthetic/demo material with explicit synthetic status. | No | No | Manifest includes synthetic candidate; Phase 1 must preserve demo limitation. |

`SX.3.C1` For `text` mode, Stage 0 must not search or browse.

`SX.3.C2` For `synthetic_demo`, Stage 0 must not search or browse.

`SX.3.C3` For `url_plus_text`, URL extraction must run before pasted text append so source coverage remains auditable.

`SX.3.C4` Pasted text is candidate material only until Phase 1 admits it.

---

# 4. PRIORITY LADDER

## 4.1 Priority Definitions

| Priority | Source Families | Fetch Rule |
|---|---|---|
| `P1_CORE` | Root/homepage; high-level product/platform pages; product pages; solution pages; legal pages; governance pages; subprocessor pages. | Always fetch where found. Never silently skip. |
| `P2_SUPPORT` | Security/trust pages; docs/API/developer pages. | Fetch unless unavailable or deferred with recorded reason. Auto-promote to `P1_CORE` when legal/product evidence is thin or trust/security contains governance artifacts. |
| `P3_COMMERCIAL` | Pricing/commercial/enterprise/contact-sales pages. | Fetch when visible; useful for commercial and target context. |
| `P4_SIGNAL_ONLY` | Blog/changelog/help/support/case-study pages. | Fetch only when path/title/snippet indicates product, governance, security, legal, data, AI disclosure, policy, or material feature signal. |

## 4.2 Priority Promotion Rules

`SX.4.2.C1` Promote `security`, `trust`, `trust-center`, `security-center`, `compliance`, `subprocessors`, `data-processing`, `privacy-center`, or `legal-center` URLs to `P1_CORE` if they contain or link to legal/governance/subprocessor/security/privacy artifacts.

`SX.4.2.C2` Promote docs/API/developer URLs to `P1_CORE` if they are the only visible source of product capability, data flow, API action, autonomous action, user-input handling, integration, or model-behavior evidence.

`SX.4.2.C3` Promote pricing/commercial URLs to `P2_SUPPORT` if they contain enterprise obligations, plan gating, DPA references, SLA references, security claims, AI capability claims, or customer commitment language.

`SX.4.2.C4` Do not fetch `P4_SIGNAL_ONLY` content merely because it is same-domain. A product/governance/security/legal/data signal must exist in URL, title, snippet, sitemap label, anchor text, or deterministic keyword match.

## 4.3 Non-Random Batch Plan

`SX.4.3.C1` Stage 0 batching must be deterministic and priority/family based. Random numeric URL batches are forbidden.

`SX.4.3.C2` Batch execution order must follow the priority ladder unless an operator/debug override is explicitly recorded.

`SX.4.3.C3` Stage 0 batch units are source-root/source-family clusters, not arbitrary URL counts.

### 4.3.1 Stage 0 Batch Families

```text
SX_BATCH_P1_ROOT_PLATFORM = root/homepage + high-level product/platform entry points
SX_BATCH_P1_PRODUCT_SOLUTION = product/solution/feature/use-case/platform descendant clusters
SX_BATCH_P1_LEGAL_GOVERNANCE = legal/governance/privacy/terms/DPA/subprocessor clusters
SX_BATCH_P2_SECURITY_TRUST = security/trust/compliance/control evidence clusters
SX_BATCH_P2_DOCS_API = docs/API/developer/integration/reference clusters
SX_BATCH_P3_COMMERCIAL = pricing/plans/enterprise/contact-sales/commercial clusters
SX_BATCH_P4_SIGNAL_ONLY = blog/changelog/help/support only where product/governance signal exists
```

### 4.3.2 Batch Manifest Requirement

Each batch must be represented in `extraction_forensic_ledger.batch_execution_log` and `hybrid_extraction_manifest.batch_plan`.

```json
{
  "batch_id": "sx_batch_001",
  "batch_family": "SX_BATCH_P1_PRODUCT_SOLUTION",
  "root_cluster_id": "rc_product_001",
  "root_cluster_seed_url": "https://example.ai/products",
  "priority": "P1_CORE",
  "source_family_target": "product_solution",
  "candidate_url_count": 0,
  "fetch_attempted_count": 0,
  "fetch_success_count": 0,
  "fetch_failure_count": 0,
  "deferred_count": 0,
  "batch_status": "PENDING | IN_PROGRESS | COMPLETED | COMPLETED_WITH_LIMITATIONS | CONTROLLED_FAILURE"
}
```

`SX.4.3.C4` A candidate may move between batches only through a recorded promotion/demotion event.

`SX.4.3.C5` `P1_CORE` batches must complete or produce explicit failure/defer records before lower-priority batches may lock.

---

# 5. DETERMINISTIC DISCOVERY PROGRAM

## 5.1 Work Units

```text
SX.B1_TARGET_CANONICALIZATION
SX.B2_KNOWN_PATH_PROBING
SX.B2A_PRODUCT_DESCENDANT_DISCOVERY
SX.B2B_HASH_ROUTE_AND_SPA_DISCOVERY
SX.B2C_ROOT_CLUSTER_ASSIGNMENT
SX.B3_SITEMAP_ROBOTS_DISCOVERY
SX.B4_NAV_FOOTER_ANCHOR_DISCOVERY
SX.B5_GROUNDED_SEARCH_SCOUT
SX.B6_CANDIDATE_UNION_SCOPE_FILTER
SX.B6A_URL_DEDUPLICATION
SX.B7_PRIORITY_QUEUE_AND_DEFER_LEDGER
SX.B8_FETCH_AND_EXTRACT
SX.B9_COVERAGE_CHALLENGE_SCOUT
SX.B10_SECOND_PASS_FETCH_AND_EXTRACT
SX.B11_MANIFEST_ASSEMBLY
```

## 5.2 `SX.B1_TARGET_CANONICALIZATION`

Input:

```json
{
  "source_mode": "url | url_plus_text | text | synthetic_demo",
  "target_url": "https://example.ai or null",
  "pasted_public_material_ref": "blob_ref_or_null",
  "synthetic_demo_ref": "demo_ref_or_null"
}
```

For `text` and `synthetic_demo`, validate source mode, package the supplied material as candidate material, and skip URL canonicalization/fetch.

Operation:

1. Normalize scheme to `https` where available.
2. Remove tracking parameters.
3. Identify canonical domain.
4. Identify root URL.
5. Create initial allowed hosts.
6. Enforce one-company rule.

Output fields:

```json
{
  "target": {
    "target_url": "",
    "canonical_domain": "",
    "root_url": "",
    "allowed_hosts": [],
    "normalization_notes": []
  }
}
```

Fail if:

- invalid URL;
- ambiguous multiple target domains;
- URL resolves to non-public/login/private-only surface.

## 5.3 `SX.B2_KNOWN_PATH_PROBING`

Probe known public paths under canonical domain and allowed hosts. Known paths are seed roots, not proof of complete source discovery.

### 5.3.1 Core Static Seed Paths

```text
/
/product
/products
/platform
/features
/solutions
/solution
/use-cases
/usecases
/customers
/case-studies
/models
/model
/agents
/agent
/studio
/apps
/tools
/workflows
/automation
/automations
/terms
/terms-of-service
/terms-and-conditions
/legal
/privacy
/privacy-policy
/dpa
/data-processing-agreement
/subprocessors
/cookie-policy
/acceptable-use
/aup
/sla
/security
/trust
/trust-center
/security-center
/compliance
/docs
/developers
/developer
/api
/api-docs
/reference
/integrations
/pricing
/plans
/enterprise
/contact-sales
/demo
```

### 5.3.2 `SX.B2A_PRODUCT_DESCENDANT_DISCOVERY`

A product/platform root path is only an entry point. It does not satisfy product-source discovery if visible child product pages, solution pages, feature pages, use-case pages, model pages, agent pages, app pages, or platform-module pages exist.

Stage 0 must expand product descendants from:

```text
sitemap URLs
homepage/nav/footer anchors
product index cards
solution/use-case cards
platform/module cards
docs links tied to product slugs
JavaScript route hints
hash routes
canonical links
OpenGraph URLs
grounded-search candidate leads
```

Recognized descendant path families include:

```text
/product/{slug}
/products/{slug}
/platform/{slug}
/platform/{module}/{slug}
/features/{slug}
/feature/{slug}
/solutions/{slug}
/solution/{slug}
/use-cases/{slug}
/usecases/{slug}
/models/{slug}
/model/{slug}
/agents/{slug}
/agent/{slug}
/studio/{slug}
/apps/{slug}
/tools/{slug}
/workflows/{slug}
/automation/{slug}
/docs/{product_slug}
/docs/{product_slug}/{subpath}
/developers/{product_slug}
/api/{product_slug}
```

`SX.B2A.C1` Do not brute-force numeric or infinite paths such as `/product/1`, `/product/2`, `/product/3` unless those routes are visible from sitemap, anchors, route manifests, or grounded search leads.

`SX.B2A.C2` Every discovered product descendant must carry `root_cluster_id`, `root_cluster_type`, and `discovery_parent_url`.

`SX.B2A.C3` If a product root exists but descendant extraction fails, record `PRODUCT_DESCENDANT_DISCOVERY_LIMITED` in `collection_limitations`.

### 5.3.3 `SX.B2B_HASH_ROUTE_AND_SPA_DISCOVERY`

Single-page apps and hash-routed sites must be handled as candidate sources when public route hints are visible.

Recognized route patterns include:

```text
/#/product/{slug}
/#/products/{slug}
/#/platform/{slug}
/#/features/{slug}
/#/solutions/{slug}
/#/use-cases/{slug}
/app#/product/{slug}
/platform#/{slug}
/docs#/{slug}
```

Stage 0 must discover SPA/hash routes from:

```text
href attributes
router link attributes
script-visible route manifests
static JS route strings where available without credentialed interaction
sitemap entries
search scout leads
```

`SX.B2B.C1` Hash routes are valid candidates only if the route is public and tied to the target/company-controlled host.

`SX.B2B.C2` If the route cannot be rendered/extracted, record `FETCH_FAILED` or `SNIPPET_ONLY` candidate status; do not invent content.

### 5.3.4 `SX.B2C_ROOT_CLUSTER_ASSIGNMENT`

Every candidate URL must be assigned to a root cluster before batching.

```json
{
  "root_cluster_id": "rc_product_001",
  "root_cluster_type": "ROOT_HOME | PRODUCT_ROOT | PRODUCT_DESCENDANT | LEGAL_ROOT | LEGAL_DESCENDANT | TRUST_ROOT | DOCS_ROOT | DOCS_DESCENDANT | COMMERCIAL_ROOT | SIGNAL_ROOT | HOSTED_GOVERNANCE_ROOT | PASTED_TEXT_ROOT | SYNTHETIC_ROOT",
  "root_cluster_seed_url": "https://example.ai/products",
  "discovery_parent_url": "https://example.ai/products"
}
```

Root clusters control batch grouping and live ledger coverage. A candidate may belong to one primary root cluster and optional secondary clusters, but the primary cluster must be recorded.

Output:

```json
{
  "known_path_candidates": [],
  "product_descendant_candidates": [],
  "hash_route_candidates": [],
  "root_clusters": []
}
```

## 5.4 `SX.B3_SITEMAP_ROBOTS_DISCOVERY`

Fetch and parse:

```text
/robots.txt
/sitemap.xml
/sitemap_index.xml
/sitemap*.xml
```

Extract:

- sitemap-declared URLs;
- robots-declared sitemaps;
- product/platform/feature/solution/use-case/model/agent descendant URLs;
- docs/API/developer descendant URLs;
- legal/governance/security/trust descendant URLs;
- likely source family from path/title where available;
- root cluster assignment;
- priority tier from `SX.4`.

`SX.B3.C1` Sitemap discovery must not collapse child product URLs into the parent product root. Each fetchable child URL remains a candidate unless URL/content de-duplication suppresses it with a recorded `dedupe_record`.

## 5.5 `SX.B4_NAV_FOOTER_ANCHOR_DISCOVERY`

Fetch root/homepage and parse public links from:

- header nav;
- footer nav;
- legal footer;
- product nav;
- docs links;
- trust/security/legal badges;
- canonical links;
- OpenGraph URLs;
- same-domain anchors;
- product/solution/use-case cards;
- platform/module cards;
- visible SPA/hash routes;
- public JavaScript route hints where accessible without login.

Do not interact with signup forms. Visible signup links may become candidates if public.

`SX.B4.C1` A product index page with visible product cards must generate one candidate per visible product card/route, not merely one candidate for the index page.


---

# 6. GROUNDED SEARCH SCOUT PACKET

The search pool may be used only for candidate discovery. It must not generate evidence or findings.

## 6.1 Search Scout Activation

`SX.6.1.C1` Run Search Scout for source modes `url` and `url_plus_text`.

`SX.6.1.C2` Do not run Search Scout for `text` or `synthetic_demo`.

`SX.6.1.C3` Search Scout must receive target domain, company-name candidate if available, deterministic candidate summary, and priority ladder.

## 6.2 Search Scout Prompt Packet

```text
<SEARCH_SCOUT_PACKET>
ROLE:
You are a grounded search scout for Stage 0 Hybrid Source Extraction.

JOB:
Find candidate public URLs likely controlled by the target company.
Return URL leads only.
Do not analyze the target.
Do not infer product facts.
Do not evaluate legal gaps.
Do not treat snippets as evidence.
Do not summarize the company.

TARGET:
canonical_domain: {{canonical_domain}}
company_name_candidate: {{company_name_candidate}}
allowed_hosts: {{allowed_hosts}}

PRIORITY LADDER:
P1_CORE = root/homepage + high-level product/platform + product/solution + legal/governance/subprocessor.
P2_SUPPORT = security/trust + docs/API/developer.
P3_COMMERCIAL = pricing/commercial.
P4_SIGNAL_ONLY = blog/changelog/help only where product/governance signals exist.

REQUIRED SEARCH INTENTS:
1. homepage/product/platform/features/solutions/use-cases and product descendant routes
2. terms/terms of service/user agreement/legal
3. privacy/privacy policy/data processing agreement/DPA/subprocessors
4. security/trust/compliance/SOC2/GDPR/data protection
5. docs/API/developers/integrations
6. pricing/enterprise/contact sales/demo
7. AI policy/AUP/acceptable use/cookie policy if visible
8. qualifying hosted governance artifacts linked to or clearly controlled by target

OUTPUT JSON ONLY:
{
  "search_scout_candidates": [
    {
      "candidate_url": "",
      "source_family_hint": "root_homepage | product_platform | product_solution | legal_governance | subprocessor | security_trust | docs_api_developer | pricing_commercial | blog_changelog_help | hosted_governance_candidate | unknown",
      "priority_hint": "P1_CORE | P2_SUPPORT | P3_COMMERCIAL | P4_SIGNAL_ONLY",
      "discovery_query": "",
      "reason_for_candidate": "",
      "requires_fetch": true,
      "requires_phase1_admission": true
    }
  ],
  "follow_up_queries": []
}
</SEARCH_SCOUT_PACKET>
```

## 6.3 Mandatory Search Query Families

The orchestrator may execute search queries itself or ask the search pool to ground them. Baseline query families:

```text
site:[domain] product OR products OR platform OR features OR solutions OR "use cases" OR models OR agents OR studio
site:[domain] terms OR "terms of service" OR "terms and conditions" OR legal
site:[domain] privacy OR "privacy policy" OR DPA OR "data processing agreement" OR subprocessors
site:[domain] security OR trust OR compliance OR SOC2 OR GDPR OR "data protection"
site:[domain] docs OR API OR developers OR integrations
site:[domain] pricing OR enterprise OR "contact sales" OR demo
"[company name]" "privacy policy"
"[company name]" "terms of service"
"[company name]" "data processing agreement"
"[company name]" subprocessors
"[company name]" "trust center"
```

`SX.6.3.C1` Query families may be skipped only if source mode does not permit search, or equivalent candidates have already been fetched and recorded.

`SX.6.3.C2` Skipped query families must be recorded in `collection_limitations`.

---

# 7. HOSTED GOVERNANCE CANDIDATE RULE

`SX.7.C1` Stage 0 may collect third-party-hosted governance candidates for Phase 1 review.

`SX.7.C2` Stage 0 must mark them as `hosted_governance_candidate`, not first-party evidence.

`SX.7.C3` Phase 1 decides whether hosted governance material qualifies as first-party admitted evidence.

`SX.7.C4` Candidate hosts may include legal/governance/trust/security platforms, including but not limited to Termly, iubenda, TermsFeed, OneTrust, Drata, Vanta, Secureframe, TrustCloud, Notion, Webflow CMS, GitHub Pages, and equivalent governance hosts.

`SX.7.C5` Stage 0 must record why the candidate may be company-controlled:

```json
{
  "hosted_governance_candidate_basis": {
    "linked_from_target_domain": true,
    "company_specific_text_visible": true,
    "recognized_governance_artifact_type": true,
    "basis_notes": []
  }
}
```

`SX.7.C6` If any basis element is unknown, mark it `unknown`; do not assume.

---

# 8. CANDIDATE UNION AND SCOPE FILTER

## 8.1 Candidate Sources

Merge candidates from:

- known path probing;
- sitemap/robots discovery;
- nav/footer anchor discovery;
- grounded search scout;
- coverage challenge scout;
- user-pasted material;
- synthetic/demo material.

## 8.2 Scope Classes

| Scope Class | Meaning | Stage 0 Action |
|---|---|---|
| `TARGET_DOMAIN_CANDIDATE` | URL belongs to canonical target domain or allowed host. | Keep and prioritize. |
| `COMPANY_CONTROLLED_SUBDOMAIN_CANDIDATE` | Subdomain appears company-controlled. | Keep and prioritize; Phase 1 can verify. |
| `HOSTED_GOVERNANCE_CANDIDATE` | External host may contain company-controlled governance artifact. | Keep for Phase 1 review. |
| `PASTED_PUBLIC_MATERIAL_CANDIDATE` | User-provided text declared public/safe. | Keep for Phase 1 review. |
| `SYNTHETIC_DEMO_CANDIDATE` | Demo/synthetic material. | Keep with synthetic limitation. |
| `THIRD_PARTY_NON_GOVERNANCE` | Press, review, investor, aggregator, directory, social, forum, third-party commentary. | Reject from candidate bundle or quarantine as non-evidence discovery note. |
| `PRIVATE_OR_PROHIBITED` | Login, credential, private doc, confidential, paywalled, user account, private MSA, internal dashboard. | Exclude and record. |

## 8.3 Kill List

Always reject or exclude from fetch as evidence candidates:

```text
Crunchbase
PitchBook
TechCrunch
G2
Capterra
review sites
press summaries
investor descriptions
third-party news
forums
social media commentary
unverified directories
unverified third-party AI summaries
prior model memory
```

Exception: a third-party host may be retained only as `HOSTED_GOVERNANCE_CANDIDATE` under `SX.7`.

## 8.4 `SX.B6A_URL_DEDUPLICATION`

Stage 0 must perform URL-level and content-level de-duplication before the priority queue locks. De-duplication is deterministic first and may be assisted by model review only for ambiguous near-duplicate routing.

### 8.4.1 URL Normalization Inputs

For every candidate URL compute:

```json
{
  "original_url": "",
  "normalized_url": "",
  "canonical_url": "",
  "redirect_target_url": null,
  "url_without_tracking_params": "",
  "fragment_policy": "DROP_ANALYTICS_FRAGMENT | PRESERVE_HASH_ROUTE | PRESERVE_SEMANTIC_FRAGMENT",
  "url_dedup_key": "",
  "content_dedup_key": null
}
```

### 8.4.2 Deterministic URL De-Dup Rules

Suppress duplicate candidates when they differ only by:

```text
http vs https after canonical redirect
www vs non-www after canonical redirect
trailing slash
utm/gclid/fbclid/ref tracking parameters
sort/filter parameters that do not change substantive page content
same canonical URL tag
same redirect target
same `url_dedup_key`
```

Do not suppress when the difference is substantive:

```text
/product/a vs /product/b
/docs/product-a vs /docs/product-b
/pricing vs /enterprise
/privacy vs /dpa
hash route representing a distinct SPA page
semantic anchor/fragment that loads distinct route content
locale page with materially different legal/geographic content
```

### 8.4.3 Content De-Dup Rules

After fetch/extract, suppress duplicate candidates when:

```text
canonical_lossless_hash matches
normalized_text_hash matches
substantive body is materially identical after boilerplate removal
same hosted governance artifact appears through multiple URLs
same document appears through both pretty URL and PDF/export URL
```

Do not suppress merely because pages share:

```text
header/footer/navigation
cookie banners
common legal boilerplate
site-wide marketing slogans
same layout/template
```

### 8.4.4 Canonical Selection Rule

For each duplicate cluster choose the canonical retained candidate by this order:

```text
1. target-domain URL over search/snippet/secondary mirror
2. directly linked target-domain URL over discovered-only URL
3. cleaner canonical URL over parameterized URL
4. richer extraction quality over thinner extraction
5. legal/governance official artifact URL over marketing duplicate
6. earliest discovered URL only if all else equal
```

### 8.4.5 Dedupe Record Schema

```json
{
  "dedupe_cluster_id": "sx_dup_001",
  "canonical_candidate_source_id": "cand_0001",
  "suppressed_candidate_source_ids": ["cand_0002"],
  "dedupe_type": "URL_NORMALIZATION | REDIRECT_TARGET | CANONICAL_TAG | CONTENT_HASH | NORMALIZED_TEXT_HASH | HOSTED_GOVERNANCE_DUPLICATE | NEAR_DUPLICATE_REVIEW",
  "dedupe_basis": [],
  "root_cluster_ids_involved": [],
  "phase1_visibility": true,
  "not_silently_dropped": true
}
```

`SX.B6A.C1` Suppressed duplicates must remain visible in `dedupe_records` and `extraction_forensic_ledger.dedupe_log`.

`SX.B6A.C2` Suppressed duplicates must not enter fetch/routing queues unless retained as canonical or explicitly needed for artifact lineage.

`SX.B6A.C3` Phase 1 must receive dedupe records so it can avoid re-admitting duplicate evidence.

---

# 9. FETCH AND EXTRACT PROGRAM

## 9.1 Fetch Ladder

For each prioritized candidate URL, attempt in order as available:

```text
1. direct_fetch
2. readability_extract
3. jina_reader_extract
4. browser_render_extract
5. search_snippet_candidate_capture
```

`SX.9.1.C1` `search_snippet_candidate_capture` is last resort and candidate-only.

`SX.9.1.C2` Snippet-only captures must be flagged `snippet_only: true`, `requires_phase1_limitation_review: true`, and `phase1_admission_forbidden: true`.

`SX.9.1.C3` A failed direct fetch is not a tool-wide failure if other extraction methods succeed.

`SX.9.1.C4` A failed extraction of one candidate does not stop remaining candidates.

## 9.2 Extraction Record Schema

```json
{
  "candidate_source_id": "cand_0001",
  "canonical_url": "",
  "original_url": "",
  "normalized_url": "",
  "url_dedup_key": "",
  "root_cluster_id": "",
  "root_cluster_type": "",
  "scope_class": "TARGET_DOMAIN_CANDIDATE | COMPANY_CONTROLLED_SUBDOMAIN_CANDIDATE | HOSTED_GOVERNANCE_CANDIDATE | PASTED_PUBLIC_MATERIAL_CANDIDATE | SYNTHETIC_DEMO_CANDIDATE",
  "priority": "P1_CORE | P2_SUPPORT | P3_COMMERCIAL | P4_SIGNAL_ONLY",
  "source_family_hint": "root_homepage | product_platform | product_solution | legal_governance | subprocessor | security_trust | docs_api_developer | pricing_commercial | blog_changelog_help | hosted_governance_candidate | pasted_public_material | synthetic_demo | unknown",
  "discovery_methods": [],
  "fetch_status": "FETCHED | FETCH_FAILED | SNIPPET_ONLY | PASTED | SYNTHETIC | DEFERRED",
  "http_status": null,
  "fetch_method": "direct_fetch | readability_extract | jina_reader_extract | browser_render_extract | search_snippet_candidate_capture | pasted_text | synthetic_demo",
  "fetched_at": "ISO-8601",
  "raw_html_ref": null,
  "clean_text_ref": null,
  "search_snippet_ref": null,
  "content_hash": "sha256_or_null",
  "word_count": 0,
  "extraction_quality": "GOOD | PARTIAL | THIN | EMPTY | FAILED | NOT_APPLICABLE",
  "snippet_only": false,
  "phase1_admission_forbidden": false,
  "requires_phase1_admission": true,
  "requires_phase1_limitation_review": false,
  "collection_notes": []
}
```

---

# 10. CASCADING RETRY PROTOCOL

This adapts the retired prototype anti-blocking rule into deterministic Stage 0 extraction.

## 10.1 Trigger

Run retry cascade when:

- a priority candidate fetch fails;
- a required query family returns zero target-domain candidates;
- a candidate source family appears missing after deterministic discovery;
- bot protection or transient timeout prevents extraction;
- legal/governance artifacts appear likely but cannot be fetched directly.

## 10.2 Retry Ladder

| Level | Name | Action |
|---|---|---|
| Level 1 | Hard Retry | Re-execute the same fetch/query after retry delay. |
| Level 2 | Index Pivot | Execute `site:[target domain] "[artifact keyword]"`. |
| Level 3 | Brand Pivot | Execute `"[Company Name]" "[artifact keyword]"` without domain constraint. |
| Level 4 | Snippet Candidate Capture | Capture visible grounded-search snippet as candidate-only material if URL cannot be fetched. |

`SX.10.2.C1` Move to next level only if current level fails.

`SX.10.2.C2` A failed cascade for one artifact does not stop extraction of remaining candidates.

`SX.10.2.C3` Level 4 output is not admitted evidence. It is `SNIPPET_ONLY` candidate material requiring Phase 1 limitation review and must be quarantined or rejected by Phase 1.

## 10.3 Retry Outcome Classes

| Outcome | Meaning |
|---|---|
| `FETCHED_AFTER_RETRY` | Retry produced extractable candidate text. |
| `SNIPPET_ONLY_AFTER_RETRY` | Search result snippet visible but page not extractable. |
| `ACCESS_FAILED_AFTER_RETRY` | Candidate exists but cannot be accessed/extracted. |
| `NOT_FOUND_AFTER_RETRY` | Query family produced no candidate source. |
| `TOOL_FAILURE_AFTER_RETRY` | Tool failed internally or returned null/no response across multiple attempts. |

---

# 11. COVERAGE CHALLENGE PACKET

Coverage Challenge runs after initial candidate union/fetch. It prevents premature completion.

## 11.1 Coverage Challenge Prompt Packet

```text
<COVERAGE_CHALLENGE_PACKET>
ROLE:
You are a grounded coverage challenge scout for Stage 0 Hybrid Source Extraction.

JOB:
Given the extracted candidate manifest summary, identify likely missing source families and return follow-up queries or candidate URL leads only.
Do not analyze the target.
Do not infer evidence.
Do not decide absence.
Do not assign legal, feature, data, or registry conclusions.

TARGET:
canonical_domain: {{canonical_domain}}
company_name_candidate: {{company_name_candidate}}

CURRENT_CANDIDATE_SUMMARY:
{{candidate_manifest_summary}}

CHECK THESE FAMILY GROUPS:
P1_CORE:
- root/homepage
- high-level product/platform
- product/solution pages
- legal/governance/subprocessor
P2_SUPPORT:
- security/trust
- docs/API/developer
P3_COMMERCIAL:
- pricing/commercial
P4_SIGNAL_ONLY:
- blog/changelog/help only where product/governance signals exist

OUTPUT JSON ONLY:
{
  "coverage_challenge": {
    "possibly_missing_families": [],
    "follow_up_queries": [],
    "follow_up_candidate_urls": [],
    "reason": "",
    "requires_second_pass": true
  }
}
</COVERAGE_CHALLENGE_PACKET>
```

## 11.2 Challenge Rules

`SX.11.2.C1` Coverage Challenge may suggest queries and URL leads only.

`SX.11.2.C2` Coverage Challenge must not classify an artifact as absent.

`SX.11.2.C3` Absence classification belongs to Phase 1 after reviewing Stage 0 collection records.

`SX.11.2.C4` Run at most two extraction passes unless a debug/operator override is active.

`SX.11.2.C5` If important source families remain missing after two passes, record `collection_limitations` and pass to Phase 1.

---

# 12. DEFER LEDGER / NO SILENT DROP

If any candidate is not fetched, it must be recorded.

```json
{
  "deferred_candidates": [
    {
      "candidate_url": "",
      "priority": "P1_CORE | P2_SUPPORT | P3_COMMERCIAL | P4_SIGNAL_ONLY",
      "source_family_hint": "",
      "defer_reason": "LOW_PRIORITY_OR_BUDGET | DUPLICATE | FETCH_QUEUE_LIMIT | OUT_OF_SCOPE | BLOCKED | OPERATOR_LIMIT | DEBUG_LIMIT",
      "not_silently_dropped": true,
      "phase1_review_required": true
    }
  ]
}
```

`SX.12.C1` `P1_CORE` candidates should not be deferred for budget unless extraction cannot continue safely.

`SX.12.C2` Deferring a `P1_CORE` candidate creates a high-priority limitation for Phase 1.

`SX.12.C3` `P4_SIGNAL_ONLY` candidates may be deferred freely if no product/governance signal exists, but must still be recorded if discovered.

## 12.1 Live Extraction Forensic Ledger

`SX.12.1.C1` Stage 0 must maintain a visible append-only extraction forensic ledger while extraction is running.

`SX.12.1.C2` The ledger is the runtime memory for extraction. The system must not rely on invisible model memory or unstored scratchpad state.

`SX.12.1.C3` Every batch, candidate discovery, fetch attempt, extraction success, extraction failure, dedupe action, defer action, scope rejection, search scout lead, and coverage challenge lead must create a ledger event.

`SX.12.1.C4` Ledger events must be safe, structured, UI-renderable audit facts. They must not expose private chain-of-thought, speculative reasoning, or freeform internal deliberation.

### 12.1.1 Live Event Schema

```json
{
  "run_id": "",
  "sequence_no": 0,
  "timestamp": "ISO-8601",
  "stage_id": "SX",
  "stage_name": "00_SOURCE_EXTRACTION_CONTRACT",
  "event_type": "RUN_STARTED | STAGE_STARTED | BATCH_STARTED | ROOT_CLUSTER_ASSIGNED | PRODUCT_DESCENDANT_DISCOVERED | HASH_ROUTE_DISCOVERED | SOURCE_DISCOVERED | SOURCE_FETCH_ATTEMPTED | SOURCE_FETCHED | SOURCE_EXTRACTION_FAILED | ARTIFACT_STORED | URL_DEDUPED | SOURCE_DEDUPED | SOURCE_DEFERRED | SOURCE_SCOPE_REJECTED | SEARCH_SCOUT_COMPLETED | COVERAGE_CHALLENGE_COMPLETED | GATE_CHECK_STARTED | GATE_CHECK_PASSED | GATE_CHECK_FAILED | CONTROLLED_FAILURE | STAGE_LOCKED",
  "work_unit": "SX.B1_TARGET_CANONICALIZATION | SX.B2_KNOWN_PATH_PROBING | SX.B2A_PRODUCT_DESCENDANT_DISCOVERY | SX.B2B_HASH_ROUTE_AND_SPA_DISCOVERY | SX.B2C_ROOT_CLUSTER_ASSIGNMENT | SX.B3_SITEMAP_ROBOTS_DISCOVERY | SX.B4_NAV_FOOTER_ANCHOR_DISCOVERY | SX.B5_GROUNDED_SEARCH_SCOUT | SX.B6_CANDIDATE_UNION_SCOPE_FILTER | SX.B6A_URL_DEDUPLICATION | SX.B7_PRIORITY_QUEUE_AND_DEFER_LEDGER | SX.B8_FETCH_AND_EXTRACT | SX.B9_COVERAGE_CHALLENGE_SCOUT | SX.B10_SECOND_PASS_FETCH_AND_EXTRACT | SX.B11_MANIFEST_ASSEMBLY",
  "batch_id": null,
  "item_ref": {
    "item_id": "",
    "item_type": "candidate_source | candidate_url | extraction_artifact | query_family | batch | gate"
  },
  "visible_message": "",
  "safe_payload": {},
  "ledger_delta_ref": ""
}
```

### 12.1.2 Extraction Forensic Ledger Object

Stage 0 final manifest must include `extraction_forensic_ledger`. The same object is populated from the live ledger events streamed to the UI.

```json
{
  "extraction_forensic_ledger": {
    "ledger_id": "sx_ledger_{run_id}",
    "run_id": "",
    "stage_id": "SX",
    "stage_name": "00_SOURCE_EXTRACTION_CONTRACT",
    "ledger_type": "EXTRACTION_FORENSIC_LEDGER",
    "ledger_events": [],
    "batch_execution_log": [],
    "candidate_discovery_log": [],
    "fetch_attempt_log": [],
    "artifact_storage_log": [],
    "dedupe_log": [],
    "defer_log": [],
    "scope_rejection_log": [],
    "search_scout_log": [],
    "coverage_challenge_log": [],
    "gate_check_log": [],
    "coverage_matrix": {
      "required_batch_count": 0,
      "completed_batch_count": 0,
      "candidate_count": 0,
      "fetch_attempted_count": 0,
      "fetch_success_count": 0,
      "fetch_failure_count": 0,
      "deferred_count": 0,
      "scope_rejected_count": 0,
      "silent_drop_count": 0,
      "coverage_status": "COMPLETE | COMPLETE_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE"
    },
    "token_and_runtime_summary": {
      "search_pool_calls": 0,
      "fetch_calls": 0,
      "browser_render_calls": 0,
      "started_at": "ISO-8601",
      "completed_at": "ISO-8601",
      "duration_ms": 0
    },
    "ledger_lock_status": "LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE"
  }
}
```

`SX.12.1.C5` The UI must be able to render `ledger_events[]` live while Stage 0 is running.

`SX.12.1.C6` The final report renderer must include the locked Stage 0 extraction forensic ledger as an annexure.

---

# 13. MINIMUM EXTRACTION THRESHOLD

This adapts the retired minimum artifact principle into Stage 0.

## 13.1 Proceed Threshold

Proceed to Phase 1 if at least one of the following is true:

1. root/homepage or high-level product/platform content was fetched;
2. at least one product/solution page was fetched;
3. at least one legal/governance artifact was fetched;
4. at least two governance/support artifacts were fetched from legal/security/trust/subprocessor/docs categories;
5. `text` or `synthetic_demo` mode supplied candidate material.

## 13.2 Proceed With Warning

If extraction proceeds with sparse material, record:

```json
{
  "collection_warnings": [
    "MIN_THRESHOLD_PROCEED: extraction is sparse; Phase 1 must preserve limitations."
  ]
}
```

## 13.3 Never Halt When Threshold Is Met

`SX.13.3.C1` If any proceed threshold is met, Stage 0 must emit the manifest and route to Phase 1.

`SX.13.3.C2` Sparse extraction is a limitation, not a reason to invent missing material.

---

# 14. FAILURE / HALT DIAGNOSTICS

## 14.1 Controlled Failure Types

| Failure Type | Meaning | Output |
|---|---|---|
| `INVALID_SOURCE_MODE` | Source mode not recognized. | Controlled failure. |
| `NO_SINGLE_TARGET` | Multiple/ambiguous targets. | Controlled failure. |
| `NO_PUBLIC_MATERIAL` | No safe public material from URL/text/demo. | Controlled failure or limitation. |
| `TOOL_EXECUTION_FAILURE` | Search/fetch tools failed internally across multiple attempts. | Controlled failure if no threshold met. |
| `BLOCKED_BY_FIREWALL` | Tools executed, domain globally blocked, no candidates extracted, threshold unmet. | Controlled failure if no threshold met. |
| `PROHIBITED_ONLY_INPUT` | Only private/confidential/prohibited material supplied. | Controlled failure. |

## 14.2 Non-Triggers

The following never justify abort by themselves:

- no pricing page found;
- no blog/changelog/help page found;
- one artifact family missing;
- one URL fetch failed;
- direct fetch failed but search/reader/browser succeeded;
- thin content;
- sparse footprint where minimum threshold is met;
- no DPA or AUP found after attempted discovery;
- all discovered candidates are low-priority P4 pages.

`SX.14.2.C1` Missing artifact families must be recorded for Phase 1. Do not invent them. Do not halt if proceed threshold is met.

---

# 15. HYBRID EXTRACTION MANIFEST SCHEMA

Stage 0 must emit this object. Full source text is not inlined inside the main manifest. Full lossless text is stored in the artifact store and referenced through `lossless_text_artifacts[]` and `artifact_store_manifest`.

```json
{
  "hybrid_extraction_manifest": {
    "schema_version": "source_extraction_contract_v1_2",
    "run_id": "",
    "source_mode": "url | text | url_plus_text | synthetic_demo",
    "target": {
      "target_url": "",
      "canonical_domain": "",
      "root_url": "",
      "company_name_candidate": "",
      "allowed_hosts": [],
      "normalization_notes": []
    },
    "collection_summary": {
      "collection_status": "COMPLETED | COMPLETED_WITH_LIMITATIONS | CONTROLLED_FAILURE",
      "passes_completed": 0,
      "candidate_count": 0,
      "fetch_success_count": 0,
      "fetch_failure_count": 0,
      "deferred_count": 0,
      "scope_rejected_count": 0,
      "snippet_only_count": 0,
      "lossless_artifact_count": 0,
      "artifact_store_resolved": true,
      "p1_core_count": 0,
      "p2_support_count": 0,
      "p3_commercial_count": 0,
      "p4_signal_only_count": 0
    },
    "batch_plan": [
      {
        "batch_id": "sx_batch_001",
        "batch_family": "SX_BATCH_P1_ROOT_PLATFORM | SX_BATCH_P1_PRODUCT_SOLUTION | SX_BATCH_P1_LEGAL_GOVERNANCE | SX_BATCH_P2_SECURITY_TRUST | SX_BATCH_P2_DOCS_API | SX_BATCH_P3_COMMERCIAL | SX_BATCH_P4_SIGNAL_ONLY",
        "root_cluster_id": "",
        "root_cluster_seed_url": "",
        "priority": "P1_CORE | P2_SUPPORT | P3_COMMERCIAL | P4_SIGNAL_ONLY",
        "source_family_target": "",
        "candidate_url_count": 0,
        "fetch_attempted_count": 0,
        "fetch_success_count": 0,
        "fetch_failure_count": 0,
        "deferred_count": 0,
        "batch_status": "PENDING | IN_PROGRESS | COMPLETED | COMPLETED_WITH_LIMITATIONS | CONTROLLED_FAILURE"
      }
    ],
    "root_clusters": [
      {
        "root_cluster_id": "rc_product_001",
        "root_cluster_type": "PRODUCT_ROOT | PRODUCT_DESCENDANT | LEGAL_ROOT | TRUST_ROOT | DOCS_ROOT | COMMERCIAL_ROOT | SIGNAL_ROOT | HOSTED_GOVERNANCE_ROOT | PASTED_TEXT_ROOT | SYNTHETIC_ROOT",
        "root_cluster_seed_url": "",
        "candidate_count": 0,
        "batch_id": "sx_batch_001",
        "cluster_status": "DISCOVERED | FETCHED | PARTIAL | FAILED | DEFERRED"
      }
    ],
    "collection_passes": [
      {
        "pass_id": "pass_1",
        "methods_used": [],
        "queries_executed": [],
        "known_paths_probed": [],
        "started_at": "ISO-8601",
        "completed_at": "ISO-8601"
      }
    ],
    "candidate_sources": [
      {
        "candidate_source_id": "cand_0001",
        "canonical_url": "",
        "original_url": "",
        "normalized_url": "",
        "url_dedup_key": "",
        "root_cluster_id": "",
        "root_cluster_type": "",
        "scope_class": "TARGET_DOMAIN_CANDIDATE | COMPANY_CONTROLLED_SUBDOMAIN_CANDIDATE | HOSTED_GOVERNANCE_CANDIDATE | PASTED_PUBLIC_MATERIAL_CANDIDATE | SYNTHETIC_DEMO_CANDIDATE",
        "priority": "P1_CORE | P2_SUPPORT | P3_COMMERCIAL | P4_SIGNAL_ONLY",
        "batch_id": "sx_batch_001",
        "source_family_hint": "root_homepage | product_platform | product_solution | legal_governance | subprocessor | security_trust | docs_api_developer | pricing_commercial | blog_changelog_help | hosted_governance_candidate | pasted_public_material | synthetic_demo | unknown",
        "discovery_methods": [],
        "fetch_status": "FETCHED | FETCH_FAILED | SNIPPET_ONLY | PASTED | SYNTHETIC | DEFERRED",
        "lossless_artifact_ref": "lossless_artifact_0001",
        "artifact_storage_uri": "artifact://runs/{run_id}/sources/cand_0001/",
        "canonical_lossless_hash": "sha256_or_null",
        "word_count": 0,
        "char_count": 0,
        "snippet_only": false,
        "phase1_admission_forbidden": false,
        "requires_phase1_admission": true,
        "requires_phase1_limitation_review": false
      }
    ],
    "lossless_text_artifacts": [
      {
        "lossless_artifact_id": "lossless_artifact_0001",
        "candidate_source_id": "cand_0001",
        "canonical_url": "",
        "artifact_type": "HTML_PAGE | PDF_TEXT | PASTED_TEXT | SYNTHETIC_TEXT | SNIPPET_ONLY",
        "fetch_method_lineage": [],
        "storage": {
          "artifact_storage_uri": "artifact://runs/{run_id}/sources/cand_0001/",
          "raw_html_uri": null,
          "raw_text_uri": null,
          "clean_text_uri": null,
          "normalized_text_uri": null,
          "search_snippet_uri": null
        },
        "hashes": {
          "raw_html_hash": null,
          "raw_text_hash": null,
          "clean_text_hash": null,
          "normalized_text_hash": null,
          "canonical_lossless_hash": "sha256_or_null"
        },
        "char_count": 0,
        "word_count": 0,
        "extraction_quality": "GOOD | PARTIAL | THIN | EMPTY | FAILED | NOT_APPLICABLE",
        "lossless_preservation_status": "PRESERVED | PARTIAL_PRESERVED | SNIPPET_ONLY | FAILED | NOT_APPLICABLE",
        "lossless_limitations": [],
        "snippet_only": false,
        "phase1_admission_forbidden": false,
        "requires_phase1_admission": true,
        "requires_phase1_limitation_review": false
      }
    ],
    "artifact_store_manifest": {
      "store_type": "LOCAL_RUN_ARTIFACT_STORE | OBJECT_STORE | DATABASE_BLOB_STORE | CONNECTOR_FILE_STORE",
      "store_root_uri": "artifact://runs/{run_id}/sources/",
      "artifact_count": 0,
      "artifact_index": [
        {
          "lossless_artifact_id": "lossless_artifact_0001",
          "candidate_source_id": "cand_0001",
          "artifact_storage_uri": "artifact://runs/{run_id}/sources/cand_0001/",
          "available_representations": ["raw_html", "raw_text", "clean_text", "normalized_text"],
          "canonical_lossless_hash": "sha256_or_null",
          "phase1_retrieval_allowed": true,
          "downstream_direct_retrieval_forbidden": true
        }
      ]
    },
    "fetch_successes": [],
    "fetch_failures": [],
    "deferred_candidates": [],
    "dedupe_records": [
      {
        "dedupe_cluster_id": "sx_dup_001",
        "canonical_candidate_source_id": "cand_0001",
        "suppressed_candidate_source_ids": [],
        "dedupe_type": "URL_NORMALIZATION | REDIRECT_TARGET | CANONICAL_TAG | CONTENT_HASH | NORMALIZED_TEXT_HASH | HOSTED_GOVERNANCE_DUPLICATE | NEAR_DUPLICATE_REVIEW",
        "dedupe_basis": [],
        "root_cluster_ids_involved": [],
        "phase1_visibility": true,
        "not_silently_dropped": true
      }
    ],
    "rejected_by_scope": [],
    "search_scout_records": [],
    "coverage_challenge_records": [],
    "collection_warnings": [],
    "collection_limitations": [],
    "extraction_forensic_ledger": {
      "ledger_id": "sx_ledger_{run_id}",
      "run_id": "",
      "stage_id": "SX",
      "stage_name": "00_SOURCE_EXTRACTION_CONTRACT",
      "ledger_type": "EXTRACTION_FORENSIC_LEDGER",
      "ledger_events": [],
      "batch_execution_log": [],
      "candidate_discovery_log": [],
      "fetch_attempt_log": [],
      "artifact_storage_log": [],
      "dedupe_log": [],
      "defer_log": [],
      "scope_rejection_log": [],
      "search_scout_log": [],
      "coverage_challenge_log": [],
      "gate_check_log": [],
      "coverage_matrix": {
        "required_batch_count": 0,
        "completed_batch_count": 0,
        "candidate_count": 0,
        "fetch_attempted_count": 0,
        "fetch_success_count": 0,
        "fetch_failure_count": 0,
        "deferred_count": 0,
        "scope_rejected_count": 0,
        "silent_drop_count": 0,
        "coverage_status": "COMPLETE | COMPLETE_WITH_LIMITATIONS | REPAIR_REQUIRED | CONTROLLED_FAILURE"
      },
      "token_and_runtime_summary": {},
      "ledger_lock_status": "LOCKED | REPAIR_REQUIRED | CONTROLLED_FAILURE"
    },
    "phase1_instruction": {
      "candidate_only": true,
      "phase1_must_admit_or_reject": true,
      "downstream_direct_use_forbidden": true,
      "phase1_receives_manifest_plus_source_cards_plus_selected_artifacts": true
    }
  }
}
```

---


# 16. TERMINAL GATE

Before emitting `hybrid_extraction_manifest`, verify:

```text
1. source_mode is valid;
2. one-target rule is satisfied;
3. priority ladder applied;
4. deterministic discovery attempted where required;
5. product descendant, hash-route, and root-cluster discovery attempted or limitation recorded;
6. grounded search scout attempted where required or limitation recorded;
7. candidate union, scope filter, and URL/content de-duplication completed;
8. fetch/extract attempted for all non-deferred canonical candidates;
9. retry cascade completed where triggered;
10. coverage challenge completed where required or limitation recorded;
11. all deferred candidates recorded;
12. all fetch failures recorded;
13. all duplicate suppressions recorded in `dedupe_records` and `extraction_forensic_ledger.dedupe_log`;
14. no admitted evidence emitted;
15. no target/feature/legal/data/registry/final analysis emitted;
16. Phase 1 instruction included;
17. batch_plan is populated and matches priority/family/root-cluster execution;
18. extraction_forensic_ledger is populated;
19. artifact_store_manifest resolves every lossless artifact;
20. `SNIPPET_ONLY` candidates are marked `phase1_admission_forbidden: true`;
21. silent_drop_count is zero or controlled failure is emitted.
```

If pass:

```text
EMIT: hybrid_extraction_manifest
ROUTE: 01_SOURCE_DISCOVERY_EVIDENCE_BOX.md
```

If fail:

```text
EMIT: controlled_failure OR extraction_limitation_manifest
ROUTE: extraction_repair OR Phase 1 with limitation, depending on severity
```

---

# 17. IMPLEMENTATION NOTE FOR GEMINI SEARCH POOL

`SX.17.C1` Gemini grounding/search pool is used for candidate discovery and coverage challenge only.

`SX.17.C2` The search pool must not be allowed to produce final diligence analysis.

`SX.17.C3` The search pool output must be machine-validated before fetch.

`SX.17.C4` Every URL produced by search pool must pass scope filtering.

`SX.17.C5` Every URL that passes scope filtering must be fetched/extracted or recorded as deferred/failure.

`SX.17.C6` The search pool may propose hosted governance candidates, but Phase 1 decides whether they qualify as admitted evidence.

`SX.17.C7` Search snippets may be retained only as `SNIPPET_ONLY` candidate records. Phase 1 must not admit them as evidence; it may quarantine/reject them and preserve the limitation.

---

# 18. FINAL LOCK RULE

`SX.18.C1` Stage 0 finds.

`SX.18.C2` Stage 0 fetches.

`SX.18.C3` Stage 0 extracts.

`SX.18.C4` Stage 0 records.

`SX.18.C5` Stage 0 does not admit.

`SX.18.C6` Phase 1 admits.

`SX.18.C7` Phase 1 preserves.

`SX.18.C8` Phase 1 routes.

`SX.18.C9` No Phase 1 admission, no downstream evidence use.

`SX.18.C10` No silent drop.

`SX.18.C11` Controlled failure beats false completeness.

`SX.18.C12` The extraction forensic ledger is the visible runtime memory of Stage 0. It must stream live to the UI and be preserved as a final report annexure.

`SX.18.C13` Stage 0 batching is deterministic by priority, source family, and root cluster. Random candidate batching is forbidden.

`SX.18.C14` Stage 0 must perform URL/content de-duplication before priority routing locks. Duplicate suppression must be recorded, not silently dropped.

`SX.18.C15` Product discovery is descendant-aware. Top-level product paths are entry points only and must be expanded through visible descendants, sitemaps, anchors, route hints, hash routes, and grounded search leads.
