# Lex Nova Interface Contracts

This folder contains governing contracts for the Interface Sandbox and Diligence Engine.

## Governing documents

1. INTERFACE_DILIGENCE_CONTRACT_SPINE_v1.md
   - Canonical operating contract for the Diligence Engine.
   - Controls source admission, stage ownership, schema regeneration, prompt rebuild, renderer structure, validation gates, and handoff boundaries.

2. VAULT_JS_CANONICAL_MAP_v1.md
   - Governing sub-spine for Node 5B, vault.schema.json, Vault prefill validation, and Assembly handoff compatibility.
   - Derived from literal vault.js payload.
   - Controls exact Vault groups and fields.

## Authority rule

If implementation files, old schemas, old prompts, or runtime notes conflict with these contracts, these contracts control until amended.

For Vault field names, group placement, and Node 5B derivation, VAULT_JS_CANONICAL_MAP_v1.md controls.

## Phase status

Phase 0A only commits contract documents.
Phase 1 regenerates schemas.
Phase 2 rebuilds prompts.
No runtime or UI logic is implemented in Phase 0A.

## Non-negotiables

- No AI provider key in React.
- No VITE_GEMINI_API_KEY.
- Gemini/Groq calls only through server-side Pages Functions.
- Source discovery is not evidence.
- Jina/admitted first-party material is the evidence base.
- Vault prefill is backend-derived.
- The model must not invent Vault field names.
- The base diligence payload must not suppress findings, evidence, rows, or uncertainty.
