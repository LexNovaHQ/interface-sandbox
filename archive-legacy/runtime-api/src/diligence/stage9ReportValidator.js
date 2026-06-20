import { REVIEW_READY_DISCLAIMER } from "./reportTerminologyMap.js";
import { REPORT_SECTION_KEYS } from "./reportSectionContract.js";
import { requiredBlocksForSection } from "./reportSectionContentContract.js";
import { visibleLanguageViolations } from "./reportLegalLanguage.js";

const T = ["thr", "eat"].join("");
const ID_KEY = `${T}_id`;
const SRC_ID_KEY = `${T[0].toUpperCase()}${T.slice(1)}_ID`;
const asArray = (value) => Array.isArray(value) ? value : [];
const asText = (value) => String(value ?? "").trim();
const hasValue = (value) => Array.isArray(value) || (value && typeof value === "object" ? Object.keys(value).length > 0 : asText(value).length > 0);
function rowId(entry) { return asText(entry?.[ID_KEY] || entry?.[SRC_ID_KEY] || entry?.registry_reference || entry?.registry_row_id || entry?.appendix_row_reference); }
function duplicateValues(values) { const seen = new Set(); const dup = new Set(); for (const value of values) { if (seen.has(value)) dup.add(value); seen.add(value); } return [...dup]; }
function countsByStatus(rows = []) { return rows.reduce((acc, entry) => { const status = asText(entry?.final_status || entry?.assessment_status || entry?.raw_assessment_status || "UNKNOWN"); acc[status] = (acc[status] || 0) + 1; return acc; }, {}); }
function visibleObject(reportData = {}) { const clone = { ...reportData }; delete clone.forensic_ledger_appendix; return clone; }
function visibleBody(reportData = {}) { return JSON.stringify(visibleObject(reportData)); }
function effectiveLedgerFromStage9(stage9Report = {}) {
  const appendix = stage9Report?.forensic_ledger_appendix || stage9Report?.report?.report_data?.forensic_ledger_appendix || {};
  return asArray(appendix.full_registry_ledger || appendix.appendix_e_exposure_forensic_ledger || appendix.forensic_ledger);
}
function hasVisibleLeak(reportData = {}) {
  const body = visibleBody(reportData);
  const explicitTerms = ["legal_stack_review", "legal_stack_control_review", "document_stack_redline", "legal_stack_assessment", "registry_reference", ID_KEY, "entry_number", "trigger_if_result", "exclude_if_result", "condition_trigger_basis", "raw_registry_payload", "Hunter_Trigger", "TRIGGER_IF", "EXCLUDE_IF", "Operator Challenge", "Registry Evaluation"].filter((term) => body.includes(term));
  const rawStatusTerms = ["TRIGGERED", "CONTROLLED", "INSUFFICIENT_EVIDENCE", "NOT_TRIGGERED", "NOT_APPLICABLE"].filter((term) => body.includes(`\"${term}\"`) || body.includes(`:${term}`));
  const rawSeverityTerms = (body.match(/\bT[1-5]\s*[—-]/g) || []).map((term) => `raw_severity_${term}`);
  const policyViolations = visibleLanguageViolations(visibleObject(reportData));
  return [...new Set([...explicitTerms, ...rawStatusTerms, ...rawSeverityTerms, ...policyViolations])];
}
function validateRequiredBlocks(reportData, warnings) { for (const key of REPORT_SECTION_KEYS) { const section = reportData?.[key]; for (const block of requiredBlocksForSection(key)) if (!Object.prototype.hasOwnProperty.call(section || {}, block)) warnings.push(`missing noncritical Stage 9 v2 block: ${key}.${block}`); } }
function validateLockedAppendices(reportData, ledger, errors, warnings) {
  const appendix = reportData?.forensic_ledger_appendix || {};
  const appendixChecks = [
    ["appendix_a_evidence_source_index", "Evidence Source Index"],
    ["appendix_b_feature_ledger", "Feature Ledger"],
    ["appendix_c_data_provenance_ledger", "Data Provenance Ledger"],
    ["appendix_d_legal_control_ledger", "Legal / Control Ledger"],
    ["appendix_e_exposure_forensic_ledger", "Exposure Forensic Ledger"],
    ["appendix_f_quality_review_trace", "Quality Review Trace"]
  ];
  for (const [key, label] of appendixChecks) {
    if (!Array.isArray(appendix[key])) errors.push(`${label} appendix missing or not an array: forensic_ledger_appendix.${key}`);
  }
  const exposureLedger = asArray(appendix.appendix_e_exposure_forensic_ledger || appendix.full_registry_ledger || appendix.forensic_ledger);
  if (exposureLedger.length !== ledger.length) errors.push(`Exposure Forensic Ledger row count mismatch: expected ${ledger.length}, received ${exposureLedger.length}`);
  const matrix = asArray(reportData?.exposure_findings?.integrated_exposure_matrix || reportData?.exposure_findings?.finding_rows);
  if ((countsByStatus(ledger).TRIGGERED || 0) > 0 && !matrix.length) errors.push("identified exposures exist but integrated exposure matrix is empty");
  const matrixWithoutProvenance = matrix.filter((row) => !hasValue(row.appendix_provenance));
  if (matrixWithoutProvenance.length) errors.push(`integrated exposure matrix row(s) missing appendix provenance: ${matrixWithoutProvenance.length}`);
  const productRows = asArray(reportData?.product_activity_ip_profile?.product_function_matrix);
  const featureLedger = asArray(appendix.appendix_b_feature_ledger);
  if (featureLedger.length && productRows.length !== featureLedger.length) warnings.push(`product function matrix count differs from feature appendix count: matrix=${productRows.length}, appendix=${featureLedger.length}`);
}
function validateSectionSubstance(reportData, errors, warnings, ledgerCounts) {
  if (!hasValue(reportData?.matter_overview?.matter_identity)) errors.push("matter_overview.matter_identity is empty");
  if (!hasValue(reportData?.matter_overview?.review_scope)) errors.push("matter_overview.review_scope is empty");
  if (!asText(reportData?.matter_overview?.reliance_disclaimer).includes("not legal advice")) errors.push("matter_overview.reliance_disclaimer does not contain not-legal-advice language");
  if (reportData?.matter_overview?.local_counsel_review_required !== true) errors.push("matter_overview.local_counsel_review_required must be true");
  if (!hasValue(reportData?.executive_summary?.executive_posture)) errors.push("executive_summary.executive_posture is empty");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.exposure_findings?.exposure_category_groups).length) errors.push("identified exposures exist but exposure category groups are empty");
  if (!asArray(reportData?.methodology_limitations_review_notes?.methodology).length) errors.push("methodology_limitations_review_notes.methodology is empty");
  if (!asArray(reportData?.methodology_limitations_review_notes?.stage_roles).length) errors.push("methodology_limitations_review_notes.stage_roles is empty");
  if (!asArray(reportData?.methodology_limitations_review_notes?.status_definitions).length) errors.push("methodology_limitations_review_notes.status_definitions is empty");
  if (!asArray(reportData?.forensic_ledger_appendix?.full_registry_ledger).length) errors.push("forensic_ledger_appendix.full_registry_ledger is empty");
  if (!hasValue(reportData?.forensic_ledger_appendix?.condition_trigger_basis)) errors.push("forensic_ledger_appendix.condition_trigger_basis marker is missing");
  for (const [section, value] of Object.entries(reportData || {})) if (!hasValue(value)) warnings.push(`thin report section: ${section}`);
}
function validateProfileMode(stage9Report, errors) {
  if (stage9Report?.profile_input_version !== "stage9_profile_input_v1") errors.push("Stage 9 must be assembled through stage9_profile_input_v1");
  const profileValidation = stage9Report?.stage9_profile_input_validation || {};
  for (const key of ["target_profile_present", "target_feature_profile_present", "legal_cartography_present", "data_provenance_profile_present", "exposure_profile_present", "stage8_quality_control_ledger_present"]) {
    if (profileValidation[key] !== true) errors.push(`Stage 9 profile input validation failed: ${key}`);
  }
  if (Number(profileValidation.exposure_registry_ledger_count || 0) <= 0) errors.push("Stage 9 exposure_profile.registry_ledger is empty after Stage 8 quality-control overlay");
  if (stage9Report?.source_meta?.effective_registry_ledger_source !== "exposure_profile.registry_ledger_after_stage8_quality_control_overlay") errors.push("Stage 9 effective registry ledger source is not the corrected exposure profile");
}

export function validateStage9Report({ stage9Report, postChallengeLedger, registryRuntime }) {
  const errors = [];
  const warnings = [];
  const report = stage9Report?.report;
  const reportData = report?.report_data;
  if (stage9Report?.stage9_report_version !== "stage9_report_v2") errors.push("stage9_report_version must be stage9_report_v2");
  validateProfileMode(stage9Report, errors);
  if (!report || typeof report !== "object") errors.push("report object missing");
  if (!reportData || typeof reportData !== "object") errors.push("report.report_data object missing");
  if (reportData) {
    for (const key of REPORT_SECTION_KEYS) {
      if (!reportData[key] || typeof reportData[key] !== "object") errors.push(`missing report section: ${key}`);
      if (reportData[key]?.heading == null) errors.push(`missing report section heading: ${key}`);
    }
    for (const staleKey of ["evidence_reviewed", "legal_risk_surface_map", "legal_stack_control_review", "executive_exposure_summary"]) if (Object.prototype.hasOwnProperty.call(reportData, staleKey)) errors.push(`legacy Stage 9 section key present: ${staleKey}`);
  }
  const ledger = asArray(postChallengeLedger).length ? asArray(postChallengeLedger) : effectiveLedgerFromStage9(stage9Report);
  const ledgerIds = ledger.map(rowId).filter(Boolean);
  const ledgerCounts = countsByStatus(ledger);
  const registryRows = asArray(registryRuntime?.threats);
  const registryIds = registryRows.map((row, index) => asText(row?.[ID_KEY] || row?.[SRC_ID_KEY] || `ROW_${index + 1}`));
  const exposureFindings = reportData?.exposure_findings || {};
  const findingRows = asArray(exposureFindings.finding_rows || exposureFindings.integrated_exposure_matrix);
  const categoryGroups = asArray(exposureFindings.exposure_category_groups);
  const appendixRows = asArray(reportData?.forensic_ledger_appendix?.full_registry_ledger || reportData?.forensic_ledger_appendix?.forensic_ledger);
  if (reportData) { validateRequiredBlocks(reportData, warnings); validateSectionSubstance(reportData, errors, warnings, ledgerCounts); validateLockedAppendices(reportData, ledger, errors, warnings); }
  if (appendixRows.length !== ledger.length) errors.push(`forensic appendix row count mismatch: expected ${ledger.length}, received ${appendixRows.length}`);
  const appendixIds = appendixRows.map(rowId).filter(Boolean);
  const missingFromAppendix = ledgerIds.filter((id) => !appendixIds.includes(id));
  const unexpectedAppendix = appendixIds.filter((id) => !ledgerIds.includes(id));
  const duplicateAppendix = duplicateValues(appendixIds);
  if (missingFromAppendix.length) errors.push(`forensic appendix missing row reference(s): ${missingFromAppendix.join(", ")}`);
  if (unexpectedAppendix.length) errors.push(`forensic appendix has unexpected row reference(s): ${unexpectedAppendix.join(", ")}`);
  if (duplicateAppendix.length) errors.push(`forensic appendix has duplicate row reference(s): ${duplicateAppendix.join(", ")}`);
  if (registryIds.length && ledgerIds.length !== registryIds.length) errors.push(`effective exposure ledger row count does not match registry count: ledger=${ledgerIds.length}, registry=${registryIds.length}`);
  const leaks = reportData ? hasVisibleLeak(reportData) : [];
  if (leaks.length) errors.push(`internal terminology leaked into visible Stage 9 v2 sections: ${leaks.join(", ")}`);
  const reportText = JSON.stringify(report || {});
  if (!reportText.includes(REVIEW_READY_DISCLAIMER)) errors.push("Review-Ready / counsel review disclaimer missing");
  const bannedBackendFields = ["vault_prefill_suggestions", "assembly_handoff", "handoff_envelope", "handoff_meta", "payload_ref", "interface_handoffs", "interface_handoff_payloads"];
  const backendLeaks = bannedBackendFields.filter((field) => reportText.includes(field) || JSON.stringify(stage9Report?.platform_diligence_object || {}).includes(field));
  if (backendLeaks.length) errors.push(`backend handoff field leaked into Stage 9 report: ${backendLeaks.join(", ")}`);
  if (!hasValue(stage9Report?.platform_diligence_object?.elements)) errors.push("platform_diligence_object.elements is empty or missing");
  if (!findingRows.length && (ledgerCounts.TRIGGERED || 0) > 0) warnings.push("identified exposures exist but Stage 9 finding rows are empty");
  return { ok: errors.length === 0, errors, warnings, counts: { ledger: ledgerCounts, exposure_categories: categoryGroups.length, finding_rows: findingRows.length, appendix_rows: appendixRows.length, registry_count: registryIds.length, visible_language_violations: leaks.length }, coverage: { ledger_count: ledgerIds.length, appendix_count: appendixIds.length, missing_from_appendix: missingFromAppendix, unexpected_appendix: unexpectedAppendix, duplicate_appendix: duplicateAppendix, visible_language_violations: leaks } };
}
