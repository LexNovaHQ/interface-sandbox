# Qualified Review public workspace

This directory contains the active section-attested Qualified Review browser client.

Backend authority lives under:

- `src/phases/13-qualified-review/`
- `src/phases/14-qualified-review-submission/`
- `src/phases/15-diligence-qa-complete/`
- `src/phases/16-assembly-engine/`
- `src/runtime/services/async-phase13.service.js`

The retired 79-row matrix, per-question response client and normalized-section QR builders are not valid runtime authorities.

The active client must use section-level draft and attestation routes. The `/responses` route is retained only as an HTTP 410 tombstone so stale clients fail loudly.
