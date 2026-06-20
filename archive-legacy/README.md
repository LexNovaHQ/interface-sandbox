# The Interface

The Interface is a React/Vite Cloudflare Pages shell for Lex Nova HQ operational legal-tech units.

It is a public demo interface. It is **not** a law firm product, not legal advice, and not a live legal engine unless a runtime path is explicitly wired and validated.

## Public Surface

- Brand: The Interface
- Subtitle: Law × Technology · AI Governance · Privacy · Systems
- Public posture: portfolio-inspired operational shell
- Global disclaimer: Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.

## Operational Units

1. Wrapper
   - Universal shell for identity, navigation, runtime status, handoff envelope status, disclaimers, and technical drawer.
2. Diligence
   - Public evidence intake, source discovery, source collection, classification, registry evaluation, diligence report, and Assembly handoff.
3. Assembly
   - Handoff intake, canonical profile construction, document assembly routing, human review, and Delivery handoff.
4. Delivery
   - Delivered packages, human review state, client package trail, and maintenance status.
5. Horizon
   - Future fixed regulatory source list, extraction, classification, storage, and Maintenance feed.

Maintenance is not a top-level public route. It appears inside Delivery as an internal monitor fed by Horizon.

## Current Status

The Wrapper shell, Firebase readiness bridge, provider status endpoints, runtime artifacts, Diligence v2 contracts, Diligence v2 prompt files, schema contracts, Source Discovery Scout, Jina Source Collector, Diligence stage endpoints, registry batching, Node 5B assembler, and persistence planner are installed.

The Diligence runtime path is staged as:

- Source Discovery Scout: Gemini Search grounding discovers first-party and qualifying hosted governance URLs.
- Source Collector: Jina Reader fetches the primary URL, manual URLs, and admitted Scout URLs.
- Stages 01-06: server-side Gemini pool calls run evidence refinement through final compiler.
- Node 5B: deterministic backend assembler derives Vault/Assembly handoff objects without a model call.

Still not a completed public product:

- no production-grade Diligence UI runner yet
- no final Firestore write trigger enabled from the public UI yet
- no document assembly execution
- no delivery portal integration
- no regulatory scanner
- no fake engine output

Firebase/Firestore is the backend junction for future engine coordination. The current bridge detects configuration/readiness. Persistence code exists, but public UI writes must remain explicit and reviewed before being turned on.

## AI Provider Configuration

Gemini is the active AI provider. The project uses **pool-only** server-side Cloudflare Pages secrets.

Required server-only Gemini pool variables:

```text
GEMINI_SEARCH_API_KEYS
GEMINI_JSON_API_KEYS
GEMINI_REASONING_API_KEYS
GEMINI_SEARCH_MODEL_SEQUENCE
GEMINI_JSON_MODEL_SEQUENCE
GEMINI_FINAL_MODEL_SEQUENCE
```

Do not create browser-visible model keys. Do not create `VITE_`-prefixed Gemini keys. The React client never receives AI provider secrets.

Provider status endpoints:

- `/api/system-status` returns provider pool status, Firebase config, capability flags, and server-only key-presence status without exposing secrets.
- `/api/ai-smoke-test` accepts `POST` only and validates Gemini through the JSON key pool.
- `/api/source-discovery-scout` accepts `POST` only and uses Gemini Search grounding through the Search key pool.

Diligence Engine source discovery is split: Gemini Search may discover candidate URLs, but admitted evidence comes from Jina-fetched first-party material, hosted-governance-qualified material, or user-provided public text.

## Installed Runtime and Reference Artifacts

Active Diligence runtime artifacts:

- `data/runtime/registry.runtime.json`
- `data/runtime/registry_key.runtime.json`
- `data/runtime/runtime_artifacts_manifest.json`

Reference-only artifacts:

- `docs/reference/vault.js`
- `docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md`
- `docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md`

`data/runtime/registry.runtime.json` contains the current threat registry runtime artifact.

`data/runtime/registry_key.runtime.json` reflects Registry Key v3.0.

`data/runtime/runtime_artifacts_manifest.json` tracks artifact status for the Wrapper runtime surface.

`docs/reference/vault.js` is reference-only. It is not imported, executed, or wired into the app. It is retained as source material for the Vault canonical map and Node 5B deterministic assembler.

`docs/reference/01_DILIGENCE_RUNTIME_GPT_v1.md` and `docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md` are migration/reference materials. They are not active runtime dependencies and are not executed by the app.

Base Diligence rule for the future engine: all TRIGGERED threats are preserved in `findings[]`; filtering, sorting, prioritising, grouping, and collapsing happen only at the UI or report-renderer level later.

## Diligence v2 Prompt Chain

The active Diligence prompt chain is under:

```text
functions/_prompts/diligence-v2/
```

Prompt index:

```text
functions/_prompts/diligence-v2/PROMPT_INDEX.md
```

Installed v2 prompt files:

- `00_SHARED_SYSTEM_PREAMBLE.prompt.md`
- `01_EVIDENCE_REFINER.prompt.md`
- `02_TARGET_FEATURE_PROFILE.prompt.md`
- `03_LEGAL_STACK_REVIEW.prompt.md`
- `04_REGISTRY_LEDGER_EVALUATION.prompt.md`
- `05_OPERATOR_CHALLENGE.prompt.md`
- `06_FINAL_COMPILER.prompt.md`

The old Groq prompt tree under `docs/prompts/diligence/` is legacy/reference material only. Do not use it for Diligence v2 implementation.

## Diligence v2 Runtime Boundary

The intended Diligence v2 runtime chain is:

```text
0A.  Source Discovery Scout             Gemini Search / Pages Function
0B.  Source Collector                   client / browser / Jina
0.5  Evidence Refiner                   Gemini / Pages Function
1.   Target + Feature Map               Gemini / Pages Function
2.   Legal Stack + Redline              Gemini / Pages Function
3.   Registry Ledger                    Gemini / Pages Function, batched
4.   Operator Challenge                 Gemini / Pages Function, merged ledger only
5.   Final Compiler                     Gemini / Pages Function
5B.  Deterministic Backend Assembler     backend only, no model
```

Node 5 emits compiler output and `vault_confirmation_questions[]` only.

Node 5B deterministically derives:

```text
vault_prefill_suggestions
assembly_handoff
handoff_envelope
Firestore writes
```

No model stage may emit `vault_prefill_suggestions`, `assembly_handoff`, or `handoff_envelope`.

## Wrapper Final Stack Connection

Firebase/Firestore frontend bridge initialization is driven only by `VITE_FIREBASE_*` public web config values. The Wrapper reports whether config is present, whether the project ID exists, whether Firebase initialized, and whether Firestore is ready.

AI provider status is checked through the server-side Cloudflare Pages Function `/api/system-status`. The function reads Gemini pool variables and capability flags from Cloudflare environment variables, returns safe configured/model/status fields, never returns keys, and does not call Gemini or any model provider.

Cloudflare Pages environment variables must include:

- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`
- `VITE_INTERFACE_APP_MODE`
- `VITE_INTERFACE_DEMO_MODE`
- `VITE_INTERFACE_RUNTIME_VERSION`
- `GEMINI_SEARCH_API_KEYS`
- `GEMINI_JSON_API_KEYS`
- `GEMINI_REASONING_API_KEYS`
- `GEMINI_SEARCH_MODEL_SEQUENCE`
- `GEMINI_JSON_MODEL_SEQUENCE`
- `GEMINI_FINAL_MODEL_SEQUENCE`
- `AI_RATE_LIMIT_MODE`
- `SANDBOX_PUBLIC_MODE`
- `CLIENT_CONFIDENTIAL_INPUTS_ALLOWED`
- `DILIGENCE_SOURCE_MODE`
- `ENABLE_SEARCH_DISCOVERY`
- `ENABLE_GEMINI_URL_CONTEXT`

The Cloudflare Pages build command remains `npm run build`. The output directory remains `dist`.

## Local Development

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Cloudflare Pages

Use Cloudflare Pages for production deploys.

- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: leave blank

Do not deploy this project through Wrangler for the static Pages flow.
