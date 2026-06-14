import { BANNED_VISIBLE_TERMS, REVIEW_READY_DISCLAIMER } from "./reportTerminologyMap.js";
import { REPORT_SECTION_KEYS } from "./reportSectionContract.js";
import { requiredBlocksForSection } from "./reportSectionContentContract.js";
import { visibleLanguageViolations } from "./reportLegalLanguage.js";

const asArray = (value) => Array.isArray(value) ? value : [];
const asText = (value) => String(value ?? "").trim();

function hasValue(value) {
  if (Array.isArray(value)) return true;
  if (value && typeof value === "object") return Object.keys(value).length > 0;
  return asText(value).length > 0;
}

function duplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates];
}

function threatId(entry) {
  return asText(entry?.threat_id || entry?.Threat_ID || entry?.registry_reference);
}

function countsByStatus(rows = []) {
  return rows.reduce((acc, entry) => {
    const status = asText(entry?.final_status || entry?.assessment_status || "UNKNOWN");
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

function extractVisibleReport(reportData) {
  const clone = { ...(reportData || {}) };
  delete clone.forensic_ledger_appendix;
  return JSON.stringify(clone);
}

function visibleTermLeaks(reportData) {
  const visible = extractVisibleReport(reportData || {});
  const baseBanned = BANNED_VISIBLE_TERMS.filter((term) => !["DOC_"].includes(term));
  const stage9V2Banned = [
    ...baseBanned,
    "legal_stack_review",
    "legal_stack_control_review",
    "legal_stack",
    "document_stack_redline",
    "legal_stack_assessment",
    "registry_reference",
    "supporting_registry",
    "threat_id",
    "entry_number",
    "trigger_if_result",
    "exclude_if_result",
    "condition_trigger_basis",
    "raw_registry_payload",
    "Hunter_Trigger"
  ];
  return [...new Set(stage9V2Banned.filter((term) => visible.includes(term)))];
}

function validateRequiredBlocks(reportData, errors) {
  for (const key of REPORT_SECTION_KEYS) {
    const section = reportData?.[key];
    for (const block of requiredBlocksForSection(key)) {
      if (!Object.prototype.hasOwnProperty.call(section || {}, block)) errors.push(`missing required Stage 9 v2 content block: ${key}.${block}`);
    }
  }
}

function validateSubstance(reportData, errors, ledgerCounts) {
  if (!hasValue(reportData?.matter_overview?.matter_identity)) errors.push("matter_overview.matter_identity is empty");
  if (!hasValue(reportData?.matter_overview?.review_scope)) errors.push("matter_overview.review_scope is empty");
  if (!asText(reportData?.matter_overview?.reliance_disclaimer).includes("not legal advice")) errors.push("matter_overview.reliance_disclaimer does not contain not-legal-advice language");
  if (reportData?.matter_overview?.local_counsel_review_required !== true) errors.push("matter_overview.local_counsel_review_required must be true");

  if (!hasValue(reportData?.executive_summary?.executive_posture)) errors.push("executive_summary.executive_posture is empty");
  if (!hasValue(reportData?.executive_summary?.target_snapshot)) errors.push("executive_summary.target_snapshot is empty");
  if (!hasValue(reportData?.executive_summary?.product_activity_snapshot)) errors.push("executive_summary.product_activity_snapshot is empty");
  if (!hasValue(reportData?.executive_summary?.data_posture)) errors.push("executive_summary.data_posture is empty");
  if (!hasValue(reportData?.executive_summary?.legal_document_posture)) errors.push("executive_summary.legal_document_posture is empty");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.executive_summary?.counsel_review_priorities).length) errors.push("executive_summary.counsel_review_priorities is empty despite identified exposures");

  if (!hasValue(reportData?.target_profile?.identity)) errors.push("target_profile.identity is empty");
  if (!hasValue(reportData?.target_profile?.jurisdiction)) errors.push("target_profile.jurisdiction is empty");
  if (!hasValue(reportData?.target_profile?.business_model)) errors.push("target_profile.business_model is empty");
  if (!hasValue(reportData?.target_profile?.product_baseline)) errors.push("target_profile.product_baseline is empty");

  if (!asText(reportData?.product_activity_ip_profile?.product_activity_thesis)) errors.push("product_activity_ip_profile.product_activity_thesis is empty");
  if (!asArray(reportData?.product_activity_ip_profile?.feature_table).length) errors.push("product_activity_ip_profile.feature_table is empty");

  if (!hasValue(reportData?.data_risk_provenance_controls?.data_flow_summary)) errors.push("data_risk_provenance_controls.data_flow_summary is empty");
  if (!Array.isArray(reportData?.data_risk_provenance_controls?.data_flow_table)) errors.push("data_risk_provenance_controls.data_flow_table must be an array");
  if (!hasValue(reportData?.data_risk_provenance_controls?.control_review)) errors.push("data_risk_provenance_controls.control_review is empty");

  if (!hasValue(reportData?.legal_document_control_review?.document_inventory_summary)) errors.push("legal_document_control_review.document_inventory_summary is empty");
  if (!Array.isArray(reportData?.legal_document_control_review?.document_inventory)) errors.push("legal_document_control_review.document_inventory must be an array");
  if (!Array.isArray(reportData?.legal_document_control_review?.control_signal_matrix)) errors.push("legal_document_control_review.control_signal_matrix must be an array");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.legal_document_control_review?.counsel_review_points).length) errors.push("legal_document_control_review.counsel_review_points is empty despite identified exposures");

  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.exposure_findings?.exposure_category_groups).length) errors.push("exposure_findings.exposure_category_groups is empty despite identified exposures");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.exposure_findings?.finding_rows).length) errors.push("exposure_findings.finding_rows is empty despite identified exposures");
  if (!hasValue(reportData?.exposure_findings?.severity_summary)) errors.push("exposure_findings.severity_summary is empty");

  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.implications_remediation_path?.priority_actions).length) errors.push("implications_remediation_path.priority_actions is empty despite identified exposures");
  if (!hasValue(reportData?.implications_remediation_path?.review_ready_handoff_bridge)) errors.push("implications_remediation_path.review_ready_handoff_bridge is empty");

  if (!Array.isArray(reportData?.evidence_gaps_clarification_points?.open_information_requests)) errors.push("evidence_gaps_clarification_points.open_information_requests must be an array");
  if (!asArray(reportData?.evidence_gaps_clarification_points?.consequence_if_unresolved).length) errors.push("evidence_gaps_clarification_points.consequence_if_unresolved is empty");

  if (!asArray(reportData?.methodology_limitations_review_notes?.methodology).length) errors.push("methodology_limitations_review_notes.methodology is empty");
  if (!asArray(reportData?.methodology_limitations_review_notes?.stage_roles).length) errors.push("methodology_limitations_review_notes.stage_roles is empty");
  if (!asArray(reportData?.methodology_limitations_review_notes?.status_definitions).length) errors.push("methodology_limitations_review_notes.status_definitions is empty");
  if (!asText(reportData?.methodology_limitations_review_notes?.registry_use_note)) errors.push("methodology_limitations_review_notes.registry_use_note is empty");

  if (!asArray(reportData?.forensic_ledger_appendix?.full_registry_ledger).length) errors.push("forensic_ledger_appendix.full_registry_ledger is empty");
  if (!hasValue(reportData?.forensic_ledger_appendix?.condition_trigger_basis)) errors.push("forensic_ledger_appendix.condition_trigger_basis marker is missing");
}

export function validateStage9Report({ stage9Report, postChallengeLedger, registryRuntime }) {
  const errors = [];
  const warnings = [];
  const report = stage9Report?.report;
  const reportData = report?.report_data;
  if (stage9Report?.stage9_report_version !== "stage9_report_v2") errors.push("stage9_report_version must be stage9_report_v2");
  if (!report || typeof report !== "object") errors.push("report object missing");
  if (!reportData || typeof reportData !== "object") errors.push("report.report_data object missing");

  if (reportData) {
    for (const key of REPORT_SECTION_KEYS) {
      if (!reportData[key] || typeof reportData[key] !== "object") errors.push(`missing report section: ${key}`);
      if (reportData[key]?.heading == null) errors.push(`missing report section heading: ${key}`);
    }
    for (const staleKey of ["evidence_reviewed", "legal_risk_surface_map", "legal_stack_control_review", "executive_exposure_summary"]) {
      if (Object.prototype.hasOwnProperty.call(reportData, staleKey)) errors.push(`legacy Stage 9 section key present: ${staleKey}`);
    }
  }

  const ledger = asArray(postChallengeLedger);
  const ledgerIds = ledger.map(threatId).filter(Boolean);
  const ledgerCounts = countsByStatus(ledger);
  const registryRows = asArray(registryRuntime?.threats);
  const registryIds = registryRows.map((row, index) => asText(row?.threat_id || row?.Threat_ID || `ROW_${index + 1}`));

  const exposureFindings = reportData?.exposure_findings || {};
  const findingRows = asArray(exposureFindings.finding_rows);
  const categoryGroups = asArray(exposureFindings.exposure_category_groups);
  const appendixRows = asArray(reportData?.forensic_ledger_appendix?.full_registry_ledger || reportData?.forensic_ledger_appendix?.forensic_ledger);

  if (reportData) {
    validateRequiredBlocks(reportData, errors);
    validateSubstance(reportData, errors, ledgerCounts);
  }

  if ((ledgerCounts.TRIGGERED || 0) > 0 && !categoryGroups.length) errors.push("identified exposures exist but exposure category groups are empty");
  if (findingRows.length !== (ledgerCounts.TRIGGERED || 0)) errors.push(`finding row count mismatch: expected ${ledgerCounts.TRIGGERED || 0}, received ${findingRows.length}`);
  if (appendixRows.length !== ledger.length) errors.push(`forensic appendix row count mismatch: expected ${ledger.length}, received ${appendixRows.length}`);

  const appendixIds = appendixRows.map((row) => asText(row.threat_id || row.registry_reference)).filter(Boolean);
  const missingFromAppendix = ledgerIds.filter((id) => !appendixIds.includes(id));
  const unexpectedAppendix = appendixIds.filter((id) => !ledgerIds.includes(id));
  const duplicateAppendix = duplicateValues(appendixIds);
  if (missingFromAppendix.length) errors.push(`forensic appendix missing row reference(s): ${missingFromAppendix.join(", ")}`);
  if (unexpectedAppendix.length) errors.push(`forensic appendix has unexpected row reference(s): ${unexpectedAppendix.join(", ")}`);
  if (duplicateAppendix.length) errors.push(`forensic appendix has duplicate row reference(s): ${duplicateAppendix.join(", ")}`);
  if (registryIds.length && ledgerIds.length !== registryIds.length) errors.push(`post-challenge ledger row count does not match registry count: ledger=${ledgerIds.length}, registry=${registryIds.length}`);

  const leaks = reportData ? visibleTermLeaks(reportData) : [];
  if (leaks.length) errors.push(`internal terminology leaked into visible Stage 9 v2 sections: ${leaks.join(", ")}`);

  const languageViolations = reportData ? visibleLanguageViolations({ ...reportData, forensic_ledger_appendix: undefined }) : [];
  if (languageViolations.length) errors.push(`non-legal visible language detected: ${languageViolations.join(", ")}`);

  const reportText = JSON.stringify(report || {});
  if (!reportText.includes(REVIEW_READY_DISCLAIMER)) errors.push("Review-Ready / counsel review disclaimer missing");

  const bannedBackendFields = ["vault_prefill_suggestions", "assembly_handoff", "handoff_envelope", "handoff_meta", "payload_ref", "interface_handoffs", "interface_handoff_payloads"];
  const backendLeaks = bannedBackendFields.filter((field) => reportText.includes(field) || JSON.stringify(stage9Report?.platform_diligence_object || {}).includes(field));
  if (backendLeaks.length) errors.push(`backend handoff field leaked into Stage 9 report: ${backendLeaks.join(", ")}`);

  if (!hasValue(stage9Report?.platform_diligence_object?.elements)) errors.push("platform_diligence_object.elements is empty or missing");
  if (!findingRows.length && (ledgerCounts.TRIGGERED || 0) > 0) warnings.push("ledger has identified exposures but Stage 9 finding rows are empty");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      ledger: ledgerCounts,
      exposure_categories: categoryGroups.length,
      finding_rows: findingRows.length,
      appendix_rows: appendixRows.length,
      registry_count: registryIds.length,
      visible_language_violations: languageViolations.length
    },
    coverage: {
      ledger_count: ledgerIds.length,
      appendix_count: appendixIds.length,
      missing_from_appendix: missingFromAppendix,
      unexpected_appendix: unexpectedAppendix,
      duplicate_appendix: duplicateAppendix,
      visible_language_violations: languageViolations
    }
  };
}
