#!/usr/bin/env node

console.error(JSON.stringify({
  ok: false,
  phase: "stage6b_data_provenance_e2e",
  error_type: "STAGE6B_AUDIT_NOT_YET_CANONICAL",
  error: "Stage 6B Data Provenance audit is intentionally separated from Stage 6A and no longer imports the legacy integrated Stage 6 audit. Build the canonical 6B runtime/audit path before using this script as proof.",
  legacy_compatibility_script: "npm run e2e:stage6:legacy"
}, null, 2));

process.exit(1);
