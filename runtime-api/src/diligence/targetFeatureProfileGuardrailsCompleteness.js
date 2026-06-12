import { validateTargetFeatureProfileGuardrails as validateBaseGuardrails } from "./targetFeatureProfileGuardrailsLocked.js";

const COVERAGE_STATUS = new Set(["mapped", "supporting", "duplicate", "insufficient_detail", "non_feature_context"]);
const COMPLETE_STATUS = new Set(["COMPLETE", "PARTIAL", "THIN"]);

function issue(instancePath, message, params = {}) {
  return {
    keyword: "target_feature_profile_completeness_warning",
    severity: "WARNING",
    instancePath,
    schemaPath: "#/targetFeatureProfileCompletenessGuardrails",
    message,
    params
  };
}

function writeLimitation(profile, warning) {
  if (!profile || typeof profile !== "object") return;
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const line = `COMPLETENESS_WARNING ${warning.instancePath || "/"}: ${warning.message} ${JSON.stringify(warning.params || {})}`;
  if (!profile.limitations.includes(line)) profile.limitations.push(line);
}

function addWarning(profile, warnings, instancePath, message, params = {}) {
  const warning = issue(instancePath, message, params);
  warnings.push(warning);
  writeLimitation(profile, warning);
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function validateCompleteness(profile, warnings) {
  const scan = profile?.commercial_scan;
  if (!scan || typeof scan !== "object" || Array.isArray(scan)) {
    addWarning(profile, warnings, "/commercial_scan", "commercial_scan missing; Stage 5 source/outcome completeness cannot be verified");
    return;
  }

  const features = new Set((Array.isArray(profile.feature_inventory) ? profile.feature_inventory : []).map((feature) => feature?.feature_id).filter(nonEmptyString));
  const coverage = Array.isArray(scan.source_coverage) ? scan.source_coverage : [];
  const outcomes = Array.isArray(scan.distinct_commercial_outcomes_seen) ? scan.distinct_commercial_outcomes_seen : [];

  if (!outcomes.length) addWarning(profile, warnings, "/commercial_scan/distinct_commercial_outcomes_seen", "distinct_commercial_outcomes_seen is empty; Stage 5 outcome completeness is thin");
  if (!coverage.length) addWarning(profile, warnings, "/commercial_scan/source_coverage", "source_coverage missing or empty; Stage 5 source completeness cannot be verified");

  coverage.forEach((row, index) => {
    const base = `/commercial_scan/source_coverage/${index}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      addWarning(profile, warnings, base, "source_coverage row is not an object; passed with warning");
      return;
    }
    if (!COVERAGE_STATUS.has(row.coverage_status)) addWarning(profile, warnings, `${base}/coverage_status`, "source_coverage coverage_status is invalid; passed with warning", { coverage_status: row.coverage_status || null });
    const mapped = Array.isArray(row.mapped_feature_ids) ? row.mapped_feature_ids : [];
    const mappedLike = ["mapped", "supporting", "duplicate"].includes(row.coverage_status);
    if (mappedLike && !mapped.length) addWarning(profile, warnings, `${base}/mapped_feature_ids`, "source_coverage row is mapped/supporting/duplicate but has no mapped_feature_ids");
    const unknown = mapped.filter((id) => !features.has(id));
    if (unknown.length) addWarning(profile, warnings, `${base}/mapped_feature_ids`, "source_coverage references feature IDs not present in feature_inventory", { unknown_feature_ids: unknown });
    if (["insufficient_detail", "non_feature_context"].includes(row.coverage_status) && !nonEmptyString(row.unmapped_reason)) addWarning(profile, warnings, `${base}/unmapped_reason`, "source_coverage row should explain unmapped/non-feature status");
    if (!Array.isArray(row.evidence_refs) || !row.evidence_refs.length) addWarning(profile, warnings, `${base}/evidence_refs`, "source_coverage row lacks evidence_refs; deterministic coverage audit is weak");
  });

  if (!COMPLETE_STATUS.has(scan.completeness_status)) addWarning(profile, warnings, "/commercial_scan/completeness_status", "completeness_status missing or invalid; passed with warning", { completeness_status: scan.completeness_status || null });
  else if (scan.completeness_status !== "COMPLETE") addWarning(profile, warnings, "/commercial_scan/completeness_status", "Stage 5 completeness is nonblocking but not complete", { completeness_status: scan.completeness_status });

  if (Array.isArray(scan.unmapped_outcomes_due_to_insufficient_detail) && scan.unmapped_outcomes_due_to_insufficient_detail.length) {
    addWarning(profile, warnings, "/commercial_scan/unmapped_outcomes_due_to_insufficient_detail", "Stage 5 has unmapped commercial outcomes due to insufficient detail", { count: scan.unmapped_outcomes_due_to_insufficient_detail.length });
  }
}

export function validateTargetFeatureProfileGuardrails(profile, options = {}) {
  const result = validateBaseGuardrails(profile, options);
  validateCompleteness(profile, result.warnings || (result.warnings = []));
  result.ok = Array.isArray(result.errors) ? result.errors.length === 0 : result.ok;
  return result;
}
