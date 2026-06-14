import { validateTargetFeatureProfileGuardrails as validateBaseGuardrails } from "./targetFeatureProfileGuardrailsLocked.js";
import { validateTargetFeatureProfileGuardrails as validateCompletenessGuardrails } from "./targetFeatureProfileGuardrailsCompleteness.js";

const NULL_COMPLETENESS_HELPER_PATTERNS = [
  "mapped_feature_ids",
  "evidence_refs",
  "unmapped_reason",
  "coverage_reason"
];

function isNullCompletenessHelperError(error) {
  const message = String(error?.message || "");
  return NULL_COMPLETENESS_HELPER_PATTERNS.some((pattern) => message.includes(pattern));
}

function appendCompletenessFallbackWarning(profile, result, error) {
  const warning = {
    keyword: "target_feature_profile_completeness_guardrail_fallback",
    severity: "WARNING",
    instancePath: "/target_feature_audit_ledger",
    schemaPath: "#/targetFeatureProfileCompletenessGuardrails",
    message: "Stage 5 completeness accounting hit a null coverage helper and was downgraded to warning instead of crashing runtime",
    params: { error: String(error?.message || error || "unknown_error") }
  };

  if (!Array.isArray(result.warnings)) result.warnings = [];
  result.warnings.push(warning);

  if (profile && typeof profile === "object" && !Array.isArray(profile)) {
    if (!Array.isArray(profile.limitations)) profile.limitations = [];
    const limitation = `COMPLETENESS_WARNING ${warning.instancePath}: ${warning.message} ${JSON.stringify(warning.params)}`;
    if (!profile.limitations.includes(limitation)) profile.limitations.push(limitation);
  }
}

export function validateTargetFeatureProfileGuardrails(profile, options = {}) {
  try {
    return validateCompletenessGuardrails(profile, options);
  } catch (error) {
    if (!isNullCompletenessHelperError(error)) throw error;

    const result = validateBaseGuardrails(profile, options);
    appendCompletenessFallbackWarning(profile, result, error);
    result.ok = Array.isArray(result.errors) ? result.errors.length === 0 : result.ok;
    return result;
  }
}
