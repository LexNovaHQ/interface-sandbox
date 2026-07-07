# PHASE 7 LAYER 4 — DAP SEMANTIC BATCH REPAIR

Repair the active batch only.

Inputs:

- active route packet
- prior batch output
- backend validation result
- repair reason

Rules:

- Keep the same expected artifact root.
- Keep the same batch_id and families.
- Return exactly the expected field IDs.
- Do not alter route, index, registry, or upstream artifacts.
- Do not emit anything outside the active batch.
- Do not add new sources.

Return strict JSON only.
