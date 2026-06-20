# Lex Nova Runtime API

Phase: 1 runtime skeleton.

This service is intended for Google Cloud Run. It is not part of the Cloudflare Pages Functions runtime.

## Current endpoints

```text
GET /health
GET /v1/runtime-status
```

`/health` returns basic runtime and pool configuration status.

`/v1/runtime-status` requires the runtime access header.

## Required Phase 1 variables

```text
RUNTIME_ACCESS_TOKEN
ALLOWED_ORIGIN
```

## Gemini pool variables for later phases

```text
GEMINI_SEARCH_API_KEYS
GEMINI_JSON_API_KEYS
GEMINI_REASONING_API_KEYS
GEMINI_REGISTRY_API_KEYS
GEMINI_SEARCH_MODEL_SEQUENCE
GEMINI_JSON_MODEL_SEQUENCE
GEMINI_REASONING_MODEL_SEQUENCE
GEMINI_REGISTRY_MODEL_SEQUENCE
GEMINI_FINAL_MODEL_SEQUENCE
```

Phase 1 does not call Gemini.

## Local run

```text
npm install
npm start
```

## Cloud Run deploy shape

Deploy from the `runtime-api` directory using Google Cloud Run source deployment/buildpacks.
