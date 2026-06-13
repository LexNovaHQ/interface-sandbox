export function validateLegalStackReviewGuardrails() {
  return {
    ok: true,
    errors: [],
    warnings: [{
      keyword: "stage6_guardrail_disabled",
      severity: "WARNING",
      instancePath: "",
      schemaPath: "#/stage6CanonicalReset",
      message: "Legacy Stage 6 legal-stack guardrails are retired during the canonical Stage 6 spine/schema reset."
    }],
    repairs: [],
    validation_mode: "stage6_guardrails_disabled_pending_canonical_rebuild"
  };
}
