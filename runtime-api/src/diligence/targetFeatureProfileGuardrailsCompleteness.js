import { validateTargetFeatureProfileGuardrails as validateBaseGuardrails } from "./targetFeatureProfileGuardrailsLocked.js";

const COVERAGE_STATUS = new Set(["mapped", "supporting", "duplicate", "insufficient_detail", "non_feature_context"]);
const COMPLETE_STATUS = new Set(["COMPLETE", "PARTIAL", "THIN"]);

function issue(instancePath, message, params = {}) {
  return { keyword: "target_feature_profile_completeness_warning", severity: "WARNING", instancePath, schemaPath: "#/targetFeatureProfileCompletenessGuardrails", message, params };
}
function repair(instancePath, message, params = {}) {
  return { keyword: "target_feature_profile_completeness_repair", severity: "REPAIRABLE", instancePath, schemaPath: "#/targetFeatureProfileCompletenessGuardrails", message, params, action: "rerun_missing_stage5_candidate_or_source_accounting" };
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
function addRepair(profile, repairs, instancePath, message, params = {}) {
  const item = repair(instancePath, message, params);
  repairs.push(item);
  writeLimitation(profile, item);
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
function expectedStage5Candidates(packageInput = {}) {
  const rows = packageInput?.target_feature_candidate_index?.candidates;
  return Array.isArray(rows) ? rows.filter((row) => row && typeof row === "object") : [];
}
function featureText(profile = {}) {
  return (Array.isArray(profile?.feature_inventory) ? profile.feature_inventory : []).map((feature) => [feature?.feature_name, feature?.commercial_function, feature?.business_label_or_product_area, feature?.feature_description, feature?.system_action, feature?.output_or_result].filter(Boolean).join(" ")).join(" ").toLowerCase();
}
function candidateTerms(candidate = {}) {
  return [candidate.candidate_label, candidate.raw_signal, candidate.candidate_key, candidate.reason_for_indexing]
    .map((value) => String(value || "").toLowerCase().trim())
    .filter((value) => value && value.length > 2);
}
function candidateAccounted(candidate, profile, scan, coverage = []) {
  const terms = candidateTerms(candidate);
  const mappedText = featureText(profile);
  const scanText = [
    ...(Array.isArray(scan?.distinct_commercial_outcomes_seen) ? scan.distinct_commercial_outcomes_seen : []),
    ...(Array.isArray(scan?.unmapped_outcomes_due_to_insufficient_detail) ? scan.unmapped_outcomes_due_to_insufficient_detail : []),
    ...(Array.isArray(scan?.completeness_warnings) ? scan.completeness_warnings : [])
  ].join(" ").toLowerCase();
  const coverageText = coverage.map((row) => [row?.source_id, row?.source_url, row?.coverage_status, row?.unmapped_reason, ...(Array.isArray(row?.mapped_feature_ids) ? row.mapped_feature_ids : [])].filter(Boolean).join(" ")).join(" ").toLowerCase();
  const candidateSourceId = String(candidate.source_id || "").trim().toLowerCase();
  if (candidateSourceId && coverageText.includes(candidateSourceId)) return true;
  return terms.some((term) => mappedText.includes(term) || scanText.includes(term) || coverageText.includes(term));
}
function outcomeLooksMapped(outcome, profile, unmapped = []) {
  const value = String(outcome || "").toLowerCase();
  if (!value) return true;
  if (unmapped.some((x) => String(x || "").toLowerCase().includes(value) || value.includes(String(x || "").toLowerCase()))) return true;
  const mappedText = featureText(profile);
  const groups = [
    [/text[- ]?to[- ]?speech|tts/, ["text-to-speech", "text to speech", "tts"]],
    [/speech[- ]?to[- ]?text|asr|transcription/, ["speech-to-text", "speech to text", "asr", "transcription", "transcribes"]],
    [/document.*digit|digit.*document|ocr/, ["document digit", "digitisation", "digitization", "ocr"]],
    [/translation|translate/, ["translation", "translate"]],
    [/dubbing|dub/, ["dubbing", "dub"]],
    [/conversational|agent|voice ai/, ["conversational", "agent", "voice"]]
  ];
  for (const [pattern, terms] of groups) if (pattern.test(value)) return terms.some((term) => mappedText.includes(term));
  return mappedText.includes(value);
}
function validateCompleteness(profile, warnings, repairs, options = {}) {
  const scan = profile?.commercial_scan;
  if (!scan || typeof scan !== "object" || Array.isArray(scan)) {
    addRepair(profile, repairs, "/commercial_scan", "commercial_scan missing; Stage 5 source/outcome completeness cannot be verified");
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
  const candidates = expectedStage5Candidates(options.packageInput || {});
  const unaccountedCandidates = candidates.filter((candidate) => !candidateAccounted(candidate, profile, scan, coverage));
  if (!outcomes.length) addRepair(profile, repairs, "/commercial_scan/distinct_commercial_outcomes_seen", "distinct_commercial_outcomes_seen is empty; Stage 5 outcome completeness is thin");
  if (!coverage.length) addRepair(profile, repairs, "/commercial_scan/source_coverage", "source_coverage missing or empty; Stage 5 source completeness cannot be verified");
  if (missingCoverage.length) addRepair(profile, repairs, "/commercial_scan/source_coverage", "source_coverage does not account for all Stage 5 packet sources", { missing_source_ids: missingCoverage, expected_source_count: expectedIds.length, actual_source_coverage_count: coverageIds.length });
  if (unaccountedCandidates.length) addRepair(profile, repairs, "/commercial_scan", "deterministic Stage 5 feature candidates were not explicitly walked", { missing_candidate_ids: unaccountedCandidates.map((row) => row.candidate_id || row.candidate_key).filter(Boolean), missing_candidate_labels: unaccountedCandidates.map((row) => row.candidate_label).filter(Boolean).slice(0, 50) });
  if (extraCoverage.length) addWarning(profile, warnings, "/commercial_scan/source_coverage", "source_coverage contains source IDs not present in Stage 5 packet", { extra_source_ids: extraCoverage });
  coverage.forEach((row, index) => {
    const base = `/commercial_scan/source_coverage/${index}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) { addWarning(profile, warnings, base, "source_coverage row is not an object; passed with warning"); return; }
    if (!COVERAGE_STATUS.has(row.coverage_status)) addRepair(profile, repairs, `${base}/coverage_status`, "source_coverage coverage_status is invalid", { coverage_status: row.coverage_status || null });
    const mapped = Array.isArray(row.mapped_feature_ids) ? row.mapped_feature_ids : [];
    const mappedLike = ["mapped", "supporting", "duplicate"].includes(row.coverage_status);
    if (mappedLike && !mapped.length) addRepair(profile, repairs, `${base}/mapped_feature_ids`, "source_coverage row is mapped/supporting/duplicate but has no mapped_feature_ids");
    const unknown = mapped.filter((id) => !features.has(id));
    if (unknown.length) addRepair(profile, repairs, `${base}/mapped_feature_ids`, "source_coverage references feature IDs not present in feature_inventory", { unknown_feature_ids: unknown });
    if (["insufficient_detail", "non_feature_context"].includes(row.coverage_status) && !nonEmptyString(row.unmapped_reason)) addRepair(profile, repairs, `${base}/unmapped_reason`, "source_coverage row should explain unmapped/non-feature status");
    if (!Array.isArray(row.evidence_refs) || !row.evidence_refs.length) addWarning(profile, warnings, `${base}/evidence_refs`, "source_coverage row lacks evidence_refs; deterministic coverage audit is weak");
  });
  const unresolvedOutcomes = outcomes.filter((outcome) => !outcomeLooksMapped(outcome, profile, unmapped));
  if (unresolvedOutcomes.length) addRepair(profile, repairs, "/commercial_scan/distinct_commercial_outcomes_seen", "commercial outcomes are neither mapped into feature_inventory nor listed as unmapped", { unresolved_outcomes: unresolvedOutcomes });
  if (!COMPLETE_STATUS.has(scan.completeness_status)) addRepair(profile, repairs, "/commercial_scan/completeness_status", "completeness_status missing or invalid", { completeness_status: scan.completeness_status || null });
  else if (scan.completeness_status !== "COMPLETE") addWarning(profile, warnings, "/commercial_scan/completeness_status", "Stage 5 completeness is not complete", { completeness_status: scan.completeness_status });
  if (unmapped.length) addWarning(profile, warnings, "/commercial_scan/unmapped_outcomes_due_to_insufficient_detail", "Stage 5 has unmapped commercial outcomes due to insufficient detail", { count: unmapped.length });
}
export function validateTargetFeatureProfileGuardrails(profile, options = {}) {
  const result = validateBaseGuardrails(profile, options);
  validateCompleteness(profile, result.warnings || (result.warnings = []), result.repairs || (result.repairs = []), options);
  result.ok = Array.isArray(result.errors) ? result.errors.length === 0 : result.ok;
  return result;
}
