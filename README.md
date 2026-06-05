# The Interface

Wrapper Batch 1 rebuild for a public demo interface.

The app is a React/Vite Cloudflare Pages skeleton for operational legal-tech units. It is not a live engine implementation.

## Public Surface

- Brand: The Interface
- Subtitle: Law × Technology · AI Governance · Privacy · Systems
- Public posture: portfolio-inspired operational shell
- Global disclaimer: Public demo. No legal advice. Public or user-provided materials only. Do not submit confidential information. Outputs are demo artifacts requiring qualified legal review before use.

## Operational Units

1. Wrapper
   - Universal shell for identity, navigation, runtime status, handoff envelope status, disclaimers, and technical drawer.
2. Diligence
   - Future public evidence intake, source collection, classification, registry evaluation, diligence report, and Assembly handoff.
3. Assembly
   - Future handoff intake, canonical profile construction, document assembly routing, human review, and Delivery handoff.
4. Delivery
   - Future delivered packages, human review state, client package trail, and maintenance status.
5. Horizon
   - Future fixed regulatory source list, extraction, classification, storage, and Maintenance feed.

Maintenance is not a top-level public route. It appears inside Delivery as an internal monitor fed by Horizon.

## Current Status

Wrapper Batch 1 is UI cleanup only.

No live engine logic exists yet:

- no scraping
- no Groq calls
- no registry evaluation
- no Vault question logic
- no document assembly
- no delivery portal integration
- no regulatory scanner
- no fake engine output

Firebase/Firestore is the future backend database and junction for future engine coordination. Configuration Batch 0 wires safe config detection only; it does not write engine data.

## Configuration Batch 0

Firebase/Firestore is the future backend junction for Wrapper, Diligence, Assembly, Delivery, Horizon, and Maintenance coordination.

The browser uses `VITE_FIREBASE_*` public web config values. The Groq API key is server-only and must not be prefixed with `VITE_`.

The user has configured local `.env.local` manually. Do not commit `.env.local`.

Cloudflare Pages variables must be set under project settings for the relevant environment/context, currently `sandbox`.

- Cloudflare Pages build command remains `npm run build`.
- Cloudflare Pages output directory remains `dist`.
- No live engine logic exists yet.

Configuration Batch 0 does not add scraping, Groq calls, registry evaluation, Vault question logic, document assembly, CRM simulation, Horizon scanner logic, or fake engine output.

## Wrapper Batch 2 - Installed Runtime Artifacts

Wrapper Batch 2 installed:

- `data/runtime/registry.runtime.json`
- `data/runtime/registry_key.runtime.json`
- `data/runtime/runtime_artifacts_manifest.json`
- `docs/reference/vault.js`
- `docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md`

`data/runtime/registry.runtime.json` contains the 98-row threat registry runtime artifact.

`data/runtime/registry_key.runtime.json` reflects Registry Key v3.0.

`data/runtime/runtime_artifacts_manifest.json` tracks artifact status for the Wrapper runtime surface.

`docs/reference/vault.js` is reference-only. It is not imported, executed, or wired into the app.

`docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md` converts the GPT runtime into staged backend execution doctrine for the future Groq-compatible sandbox. It is not executed by the app.

No engine logic exists yet. This batch does not add scraping, Groq calls, registry evaluation, Hunter Logic Gate execution, Vault question logic, document assembly, CRM simulation, Horizon scanner logic, or fake engine output.

Base Diligence Engine rule for the future engine: all TRIGGERED threats are preserved in `findings[]`; filtering, sorting, and prioritising happen only at the UI or report-renderer level later.

## Wrapper Final Stack Connection

Firebase/Firestore frontend bridge initialization is driven only by `VITE_FIREBASE_*` public web config values. The Wrapper reports whether config is present, whether the project ID exists, whether Firebase initialized, and whether Firestore is ready. Firestore writes are not enabled for engine data yet.

Groq status is checked only through the server-side Cloudflare Pages Function `/api/system-status`. The function reads `GROQ_API_KEY`, `GROQ_PRIMARY_MODEL`, and `GROQ_FALLBACK_MODEL` from Cloudflare server environment variables, returns safe configured/model/status fields, never returns the key, and does not call Groq.

`GROQ_API_KEY` must never be exposed with a `VITE_` prefix.

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
- `GROQ_API_KEY`
- `GROQ_PRIMARY_MODEL`
- `GROQ_FALLBACK_MODEL`

The Cloudflare Pages build command remains `npm run build`. The output directory remains `dist`.

No engine logic exists yet.

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

<!-- deploy: cloudflare-pages-env-refresh -->

<!-- deploy: cloudflare-pages-env-refresh -->

## Diligence Stage Prompt Templates

The Diligence Engine now has stage-level Groq prompt templates under docs/prompts/diligence/.

These templates are subordinate to docs/runtimes/02_DILIGENCE_RUNTIME_GROQ_SANDBOX_v1.md.

Installed prompt templates:

- 01_Target_Feature_Extraction.prompt.md
- 02_Legal_Stack_Review.prompt.md
- 03_Registry_Evaluation.prompt.md
- 04_Final_Compiler_And_Handoff.prompt.md
- PROMPT_INDEX.md

The stage prompts are not engine implementation code. They are execution contracts for future bounded Groq calls.

The Source Collector remains backend-owned. Groq does not browse, scrape, fetch, or search.

The base Diligence Engine emits all TRIGGERED threats. Filtering, sorting, prioritising, grouping, and collapsing happen only in the UI/report renderer.
