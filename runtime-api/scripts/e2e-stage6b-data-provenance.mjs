console.error(JSON.stringify({
  ok: false,
  phase: "stage6b_data_provenance_e2e",
  disabled: true,
  reason: "Stage 6B remains disabled during canonical Stage 6 spine/schema reset. Rebuild this E2E against stage6_review_v1 before using it as proof."
}, null, 2));
process.exit(1);
