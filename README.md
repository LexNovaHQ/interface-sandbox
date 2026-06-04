# Lex Nova Interface Sandbox

Skeleton phase for the Lex Nova Sandbox OS.

This project builds the frontend shell, route structure, Cloudflare Pages Functions stubs, mock payloads, schemas, localStorage helpers, and environment placeholders for `sandbox.lexnovahq.com`.

## Scope

This build is contracts only. The real engines are intentionally not implemented.

Included:

- React + Vite frontend shell
- Cloudflare Pages Functions API stubs
- Mock responses for every V1 endpoint
- JSON Schemas and mock examples for future engine work
- localStorage helpers for sandbox state handoff
- Premium dark operating-system dashboard UI
- Environment documentation for later server-side Groq usage

Not included:

- Real Diligence Engine logic
- Scraping or public page retrieval
- Live Groq calls
- Hunter matching
- Registry ingestion
- Assembly clause logic
- Final ToS, DPA, or AUP clauses
- Real document generation
- CRM integration
- Maintenance Radar comparison
- PDF upload
- Authentication

## Local Development

```bash
npm install
npm run dev
```

Vite serves local mock `/api/*` responses during development so the skeleton UI can be exercised without Wrangler or external services.

## Build

```bash
npm run build
```

## Cloudflare Pages Deployment

Use Cloudflare Pages, not `npx wrangler deploy`, for production deploys.

Set Cloudflare Pages to:

- Build command: `npm run build`
- Build output directory: `dist`
- Deploy command: leave empty

The `functions` directory contains Cloudflare Pages Functions handlers for:

- `GET /api/health`
- `POST /api/diligence-url`
- `POST /api/diligence-text`
- `POST /api/assembly`
- `POST /api/delivery`
- `POST /api/maintenance`

No `/api/diligence-pdf` route exists in V1.

## Environment Variables

Future server-side AI calls will use Cloudflare environment variables:

```bash
GROQ_API_KEY=
GROQ_MODEL_PRIMARY=openai/gpt-oss-120b
GROQ_MODEL_FALLBACK=llama-3.3-70b-versatile
```

Do not create `VITE_GROQ_API_KEY`. API keys must not be exposed to frontend code and must not be committed.

## State

The skeleton uses browser state only:

- `lexnova:lastSourceBundle`
- `lexnova:lastDiligenceReport`
- `lexnova:lastVaultAnswers`
- `lexnova:lastAssemblyOutput`
- `lexnova:lastDeliveryState`
- `lexnova:lastMaintenanceRun`

## Future Engine Phases

1. Diligence ingestion and classification
2. Vault answer capture and validation
3. Assembly route logic and clause-source mapping
4. Review-ready draft generation
5. Synthetic delivery workspace integration
6. Maintenance Radar coverage comparison
7. Optional PDF upload phase after V1

## Safety Boundary

This is a public sandbox. It provides no legal advice. Use public or user-provided materials only. Do not submit confidential information. The delivery layer is synthetic. Outputs are review-ready demo drafts requiring qualified legal review.
