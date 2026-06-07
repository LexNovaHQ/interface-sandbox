# Lex Nova Interface Runtime Lock

Status: LOCKED
Date: 2026-06-07

## 1. Locked Platform Boundary

Cloudflare Pages is retained only as the static React frontend host for the operating cockpit at `sandbox.lexnovahq.com`.

Cloudflare Pages Functions are deprecated for all intelligence-runtime duties. They must not be used for:

- Gemini Search grounding
- Gemini JSON stage execution
- Gemini reasoning/final compiler execution
- source discovery orchestration
- Jina scrape orchestration
- 98-row registry evaluation
- full diligence pipeline execution
- Assembly handoff execution

Google Cloud Run is the runtime backend for intelligence execution.

The React frontend controls workflow state, progress display, automatic batch continuation, retry/resume controls, report rendering, and operating-system navigation.

## 2. Reason for Lock

Production testing proved that Cloudflare Functions cannot be treated as a reliable runtime for Gemini Search grounding in this system.

Observed failures included:

- `/api/source-discovery-scout` returning Cloudflare 504 during Gemini Search grounding.
- `/api/source-discovery-artifact` returning Cloudflare 504 during a single artifact-level search.
- A later fail-fast patch producing production gateway errors rather than a stable runtime surface.

This disqualifies Cloudflare Functions from the core intelligence layer. Cloudflare remains useful as the React/static host only.

## 3. Target Architecture

```text
Reviewer
  -> Cloudflare Pages React Cockpit
  -> Google Cloud Run Runtime API
  -> Gemini server-side key pools
  -> React receives JSON and advances workflow
```

Cloudflare Pages:

- hosts React UI
- serves routes and static assets
- renders Diligence, Assembly, Delivery, Horizon screens
- stores local run state for v1
- exports/imports run JSON

Google Cloud Run Runtime API:

- stores server-side Gemini pool keys as environment variables
- runs Gemini Search discovery
- runs Gemini JSON stages
- runs Gemini reasoning/final stages
- runs registry batching and coverage validation
- returns clean JSON with model/key metadata
- enforces CORS and access-token checks

React Cockpit:

- one URL input
- one Run Full Diligence button
- automatic internal batch execution
- progress UI
- retry/resume controls
- report renderer
- Assembly handoff preview
- Delivery package preview

## 4. No Artificial Evidence Limits

The system must not impose arbitrary limits such as:

- top 10 URLs
- top 20 URLs
- first 50 pages
- selected legal pages only
- partial registry rows
- partial findings

Every relevant first-party, native-domain, subdomain, documentation, legal, trust, security, governance, and trace-qualified hosted governance page is valid evidence.

Execution may use internal batch sizes, chunking, pagination, retries, and merge steps. Those are implementation mechanics, not evidence limits.

## 5. Automatic Batch Continuation

Reviewer experience is locked:

```text
Enter URL once.
Click Run Full Diligence once.
System continues all internal batches automatically until complete or failed.
```

No reviewer should be required to manually click through scrape batches, evidence batches, registry batches, or stage batches for the same URL.

Each batch subsystem must have:

- queue
- cursor
- status per item
- automatic loop
- retry count
- merge step
- coverage validator
- final completion gate

## 6. Runtime State Machine

The full Diligence run must advance through:

```text
IDLE
INITIALIZING_RUN
CHECKING_RUNTIME
DISCOVERING_SOURCES
ADMITTING_SOURCES
SCRAPING_SOURCES
CHUNKING_EVIDENCE
REFINING_EVIDENCE
RUNNING_FEATURE_PROFILE
RUNNING_LEGAL_STACK_REVIEW
RUNNING_REGISTRY
VALIDATING_REGISTRY_COVERAGE
RUNNING_OPERATOR_CHALLENGE
APPLYING_OPERATOR_CORRECTIONS
RUNNING_FINAL_COMPILER
ASSEMBLING_HANDOFF
RENDERING_REPORT
READY_FOR_DELIVERY
FAILED
```

## 7. Cloud Run Runtime API Minimum Endpoints

Phase 1 must create only:

```text
GET /health
GET /v1/runtime-status
```

Phase 2 adds Gemini smoke endpoints:

```text
POST /v1/smoke/search
POST /v1/smoke/json
POST /v1/smoke/reasoning
```

Phase 3 adds:

```text
POST /v1/source-discovery
```

Later phases add:

```text
POST /v1/stage/run
```

## 8. Required Runtime Environment Variables

The Cloud Run service must use these server-side environment variables:

```text
GEMINI_SEARCH_API_KEYS
GEMINI_JSON_API_KEYS
GEMINI_REASONING_API_KEYS
GEMINI_SEARCH_MODEL_SEQUENCE
GEMINI_JSON_MODEL_SEQUENCE
GEMINI_FINAL_MODEL_SEQUENCE
RUNTIME_ACCESS_TOKEN
ALLOWED_ORIGIN
```

The React frontend must not receive Gemini keys.

## 9. Completion Definition

The operating system is live only when a reviewer can:

```text
1. open sandbox.lexnovahq.com
2. enter one URL
3. click Run Full Diligence once
4. watch automatic source discovery
5. watch automatic source admission
6. watch automatic scrape batching
7. watch automatic evidence refinement
8. watch automatic 98-row registry evaluation
9. receive final compiler output
10. receive Node 5B Assembly handoff
11. view Delivery package preview
12. export/import run JSON
```

## 10. Non-Negotiable Legal/Positioning Boundary

Lex Nova HQ is a legal architecture consultancy, not a law firm.

All reviewer-facing outputs must preserve:

- public-source-only limitation
- no legal advice disclaimer
- Review-Ready Draft positioning
- local counsel review requirement
- evidence limitations and failed-source logs
