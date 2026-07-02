# M10 LEAN INPUT CONTRACT

## Purpose

M10 is a model phase and must remain token-bounded. It must not ingest raw lossless family artifacts directly.

## Governing rule

The backend phase contract is canonical. For `M10`, the model may use only:

- `source_discovery_handoff`
- `legal_cartography_index`
- `target_profile`
- `target_profile_forensics`
- `feature_candidate_inventory`
- `target_feature_profile`
- `target_feature_profile_forensics`

M10 must not read, request, or depend on:

- `lossless_family__D1_SECURITY_TRUST`
- `lossless_family__D2_SUBPROCESSOR_PRIVACY_CENTER`
- `lossless_family__D3_DATA_GOVERNANCE_CONTROLS`
- `lossless_family__D4_DOCS_API_DATA_FLOW`
- `lossless_family__D5_AI_SAFETY_TRANSPARENCY`
- `lossless_family__L1_CORE_TERMS_PRIVACY`
- `lossless_family__L2_B2B_CONTRACTING`
- `lossless_family__L4_PRIVACY_ADJACENT_NOTICES`
- any other raw `lossless_family__*` artifact

## Boundary with 4B

Raw data, privacy, security, subprocessor, DPA, policy, and legal-family materials are handled by deterministic 4B after M10.

M10 produces the compact base `data_provenance_profile` from M7/M8 profiles, M9 legal navigation, and M6 source-route custody. 4B then performs the full substantive DAP field-base derivation from raw families and produces `extended_dap_india_readiness_profile`.

## Failure rule

If a M10 field cannot be supported from the lean inputs, M10 must emit a controlled limitation or missing-proof route. It must not request raw lossless families and must not block merely because raw families are absent from the M10 prompt.
