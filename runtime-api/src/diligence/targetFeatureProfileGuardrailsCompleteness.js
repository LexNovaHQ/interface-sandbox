import { validateTargetFeatureProfileGuardrails as validateBaseGuardrails } from "./targetFeatureProfileGuardrailsLocked.js";

const COVERAGE_STATUS = new Set(["mapped", "supporting", "duplicate", "insufficient_detail", "non_feature_context"]);
const COMPLETE_STATUS = new Set(["COMPLETE", "PARTIAL", "THIN"]);

function issue(instancePath, message, params = {}) {
  return { keyword: "target_feature_profile_completeness_warning", severity: "WARNING", instancePath, schemaPath: "#/targetFeatureProfileCompletenessGuardrails", message, params };
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
function nonEmptyString(value) { return typeof value === "string" && value.trim().length > 0; }
function sourceId(row) { return String(row?.evidence_source_id || row?.source_id || "").trim(); }
function expectedStage5Sources(packageInput = {}) {
  const out = [];
  const seen = new Set();
  const add = (row) => {
    const id = sourceId(row);
    if (!id || seen.has(id)) return;
    seen.add(id);
    out.push({ source_id: id, source_url: row?.source_url || row?.final_url || row?.url || "", source_family: row?.source_family || "unknown" });
  };
  for (const row of packageInput?.source_bundle?.evidence_buffer || []) add(row);
  for (const row of packageInput?.source_bundle?.artifact_inventory || []) add(row);
  for (const row of packageInput?.input_budget?.included_sources || []) add(row);
  return out;
}
function outcomeLooksMapped(outcome, profile, unmapped = []) {
  const value = String(outcome || "").toLowerCase();
  if (!value) return true;
  if (unmapped.some((x) => String(x || "").toLowerCase().includes(value) || value.includes(String(x || "").toLowerCase()))) return true;
  const featureText = (Array.isArray(profile?.feature_inventory) ? profile.feature_inventory : []).map((feature) => [feature?.feature_name, feature?.commercial_function, feature?.business_label_or_product_area, feature?.feature_description, feature?.system_action, feature?.output_or_result].filter(Boolean).join(" ")).join(" ").toLowerCase();
  const groups = [
    [/text[- ]?to[- ]?speech|tts/, ["text-to-speech", "text to speech", "tts"]],
    [/speech[- ]?to[- ]?text|asr|transcription/, ["speech-to-text", "speech to text", "asr", "transcription", "transcribes"]],
    [/document.*digit|digit.*document|ocr/, ["document digit", "digitisation", "digitization", "ocr"]],
    [/translation|translate/, ["translation", "translate"]],
    [/dubbing|dub/, ["dubbing", "dub"]],
    [/conversational|agent|voice ai/, ["conversational", "agent", "voice"]]
  ];
  for (const [pattern, terms] of groups) if (pattern.test(value)) return terms.some((term) => featureText.includes(term));
  return featureText.includes(value);
}
function validateCompleteness(profile, warnings, options = {}) {
  const scan = profile?.commercial_scan;
  if (!scan || typeof scan !== "object" || Array.isArray(scan)) {
    addWarning(profile, warnings, "/commercial_scan", "commercial_scan missing; Stage 5 source/outcome completeness cannot be verified");
    return;
  }
  const features = new Set((Array.isArray(profile.feature_inventory) ? profile.feature_inventory : []).map((feature) => feature?.feature_id).filter(nonEmptyString));
  const coverage = Array.isArray(scan.source_coverage) ? scan.source_coverage : [];
  const outcomes = Array.isArray(scan.distinct_commercial_outcomes_seen) ? scan.distinct_commercial_outcomes_seen : [];
  const unmapped = Array.isArray(scan.unmapped_outcomes_due_to_insufficient_detail) ? scan.unmapped_outcomes_due_to_insufficient_detail : [];
  const expected = expectedStage5Sources(options.packageInput || {});
  const expectedIds = expected.map((row) => row.source_id);
  const coverageIds = coverage.map((row) => String(row?.source_id || "").trim()).filter(Boolean);
  const missingCoverage = expectedIds.filter((id) => !coverageIds.includes(id));
  const extraCoverage = coverageIds.filter((id) => expectedIds.length && !expectedIds.includes(id));
  if (!outcomes.length) addWarning(profile, warnings, "/commercial_scan/distinct_commercial_outcomes_seen", "distinct_commercial_outcomes_seen is empty; Stage 5 outcome completeness is thin");
  if (!coverage.length) addWarning(profile, warnings, "/commercial_scan/source_coverage", "source_coverage missing or empty; Stage 5 source completeness cannot be verified");
  if (missingCoverage.length) addWarning(profile, warnings, "/commercial_scan/source_coverage", "source_coverage does not account for all Stage 5 packet sources", { missing_source_ids: missingCoverage, expected_source_count: expectedIds.length, actual_source_coverage_count: coverageIds.length });
  if (extraCoverage.length) addWarning(profile, warnings, "/commercial_scan/source_coverage", "source_coverage contains source IDs not present in Stage 5 packet", { extra_source_ids: extraCoverage });
  coverage.forEach((row, index) => {
    const base = `/commercial_scan/source_coverage/${index}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) { addWarning(profile, warnings, base, "source_coverage row is not an object; passed with warning"); return; }
    if (!COVERAGE_STATUS.has(row.coverage_status)) addWarning(profile, warnings, `${base}/coverage_status`, "source_coverage coverage_status is invalid; passed with warning", { coverage_status: row.coverage_status || null });
    const mapped = Array.isArray(row.mapped_feature_ids) ? row.mapped_feature_ids : [];
    const mappedLike = ["mapped", "supporting", "duplicate"].includes(row.coverage_status);
    if (mappedLike && !mapped.length) addWarning(profile, warnings, `${base}/mapped_feature_ids`, "source_coverage row is mapped/supporting/duplicate but has no mapped_feature_ids");
    const unknown = mapped.filter((id) => !features.has(id));
    if (unknown.length) addWarning(profile, warnings, `${base}/mapped_feature_ids`, "source_coverage references feature IDs not present in feature_inventory", { unknown_feature_ids: unknown });
    if (["insufficient_detail", "non_feature_context"].includes(row.coverage_status) && !nonEmptyString(row.unmapped_reason)) addWarning(profile, warnings, `${base}/unmapped_reason`, "source_coverage row should explain unmapped/non-feature status");
    if (!Array.isArray(row.evidence_refs) || !row.evidence_refs.length) addWarning(profile, warnings, `${base}/evidence_refs`, "source_coverage row lacks evidence_refs; deterministic coverage audit is weak");
  });
  const unresolvedOutcomes = outcomes.filter((outcome) => !outcomeLooksMapped(outcome, profile, unmapped));
  if (unresolvedOutcomes.length) addWarning(profile, warnings, "/commercial_scan/distinct_commercial_outcomes_seen", "commercial outcomes are neither mapped into feature_inventory nor listed as unmapped", { unresolved_outcomes: unresolvedOutcomes });
  if (!COMPLETE_STATUS.has(scan.completeness_status)) addWarning(profile, warnings, "/commercial_scan/completeness_status", "completeness_status missing or invalid; passed with warning", { completeness_status: scan.completeness_status || null });
  else if (scan.completeness_status !== "COMPLETE") addWarning(profile, warnings, "/commercial_scan/completeness_status", "Stage 5 completeness is nonblocking but not complete", { completeness_status: scan.completeness_status });
  if (unmapped.length) addWarning(profile, warnings, "/commercial_scan/unmapped_outcomes_due_to_insufficient_detail", "Stage 5 has unmapped commercial outcomes due to insufficient detail", { count: unmapped.length });
}
export function validateTargetFeatureProfileGuardrails(profile, options = {}) {
  const result = validateBaseGuardrails(profile, options);
  validateCompleteness(profile, result.warnings || (result.warnings = []), options);
  result.ok = Array.isArray(result.errors) ? result.errors.length === 0 : result.ok;
  return result;
}
