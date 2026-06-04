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

Firebase/Firestore is the future backend database. It is currently shown as a status placeholder only and is not connected.

## Runtime Artifacts Expected Later

These artifacts are expected later and currently surface as missing in the Wrapper status panel unless installed:

- `registry.runtime.json`
- `registry_key.runtime.json`
- `runtime_artifacts_manifest.json`
- `02_DILIGENCE_RUNTIME_SANDBOX_v1.md`
- `vault.js`

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
