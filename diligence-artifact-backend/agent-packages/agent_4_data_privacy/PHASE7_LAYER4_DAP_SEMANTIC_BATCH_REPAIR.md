# PHASE 7 LAYER 4 — DAP SEMANTIC BATCH REPAIR

Repair the active batch only.

Inputs:

- `phase_route_runtime_packet`
- active DAP batch route packet
- prior batch output
- backend validation result
- repair reason

Rules:

- Keep the same Phase 2G route ID and 2D bucket.
- Keep the same expected artifact root.
- Keep the same batch_id and families.
- Return exactly the expected field IDs.
- Do not alter the Phase 2G route, active DAP batch route, index, registry, or upstream artifacts.
- Do not emit anything outside the active batch.
- Do not add new sources or expand beyond the evidence already present in the Phase 2G packet.
- Do not read or request any forensic profile.

Return strict JSON only.
