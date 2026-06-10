import { BANNED_VISIBLE_TERMS, REVIEW_READY_DISCLAIMER } from "./reportTerminologyMap.js";
import { REPORT_SECTION_KEYS } from "./reportSectionContract.js";
import { requiredBlocksForSection } from "./reportSectionContentContract.js";
import { visibleLanguageViolations } from "./reportLegalLanguage.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value ?? "").trim();
}

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
  const clone = { ...reportData };
  delete clone.forensic_ledger_appendix;
  return JSON.stringify(clone);
}

function visibleTermLeaks(reportData) {
  const visible = extractVisibleReport(reportData || {});
  return BANNED_VISIBLE_TERMS.filter((term) => visible.includes(term));
}

function validateRequiredBlocks(reportData, errors) {
  for (const key of REPORT_SECTION_KEYS) {
    const section = reportData?.[key];
    for (const block of requiredBlocksForSection(key)) {
      if (!Object.prototype.hasOwnProperty.call(section || {}, block)) {
        errors.push(`missing required DD content block: ${key}.${block}`);
      }
    }
  }
}

function validateSubstance(reportData, errors, ledgerCounts) {
  if (!hasValue(reportData?.matter_overview?.report_identity)) errors.push("matter_overview.report_identity is empty");
  if (!asArray(reportData?.matter_overview?.scope_limitations).length) errors.push("matter_overview.scope_limitations is empty");
  if (!asText(reportData?.matter_overview?.reliance_disclaimer).includes("not legal advice")) errors.push("matter_overview.reliance_disclaimer does not contain not-legal-advice language");

  if (!hasValue(reportData?.executive_exposure_summary?.executive_posture)) errors.push("executive_exposure_summary.executive_posture is empty");
  if (!hasValue(reportData?.executive_exposure_summary?.key_numbers)) errors.push("executive_exposure_summary.key_numbers is empty");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.executive_exposure_summary?.top_exposure_themes).length) errors.push("executive_exposure_summary.top_exposure_themes is empty despite identified exposures");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.executive_exposure_summary?.immediate_review_priorities).length) errors.push("executive_exposure_summary.immediate_review_priorities is empty despite identified exposures");

  if (!asArray(reportData?.evidence_reviewed?.evidence_inventory?.reviewed_sources || reportData?.evidence_reviewed?.reviewed_sources).length) errors.push("evidence_reviewed evidence inventory is empty");
  if (!asArray(reportData?.evidence_reviewed?.evidence_categories).length) errors.push("evidence_reviewed.evidence_categories is empty");
  if (!asArray(reportData?.evidence_reviewed?.evidence_not_reviewed).length) errors.push("evidence_reviewed.evidence_not_reviewed is empty");
  if (!asArray(reportData?.evidence_reviewed?.evidence_limitations).length) errors.push("evidence_reviewed.evidence_limitations is empty");

  if (!asText(reportData?.product_activity_profile?.product_activity_thesis)) errors.push("product_activity_profile.product_activity_thesis is empty");
  for (const block of ["platform_product_architecture", "data_processing_user_information_flows", "automated_systems_output_reliance", "content_output_ip_position", "third_party_infrastructure_dependencies", "user_facing_claims_product_reliance"]) {
    if (!hasValue(reportData?.product_activity_profile?.[block])) errors.push(`product_activity_profile.${block} is empty`);
  }

  if (!asArray(reportData?.legal_risk_surface_map?.active_legal_surfaces || reportData?.legal_risk_surface_map?.surfaces).length) errors.push("legal_risk_surface_map.active_legal_surfaces is empty");
  if (!asArray(reportData?.legal_risk_surface_map?.surface_activation_basis).length) errors.push("legal_risk_surface_map.surface_activation_basis is empty");
  if (!asArray(reportData?.legal_risk_surface_map?.legal_consequence_categories).length) errors.push("legal_risk_surface_map.legal_consequence_categories is empty");

  if (!asArray(reportData?.legal_stack_control_review?.document_inventory).length) errors.push("legal_stack_control_review.document_inventory is empty");
  if (!asArray(reportData?.legal_stack_control_review?.document_coverage_matrix).length) errors.push("legal_stack_control_review.document_coverage_matrix is empty");
  if (!asArray(reportData?.legal_stack_control_review?.control_gaps).length) errors.push("legal_stack_control_review.control_gaps is empty");
  if (!asArray(reportData?.legal_stack_control_review?.counsel_review_points).length && (ledgerCounts.TRIGGERED || 0) > 0) errors.push("legal_stack_control_review.counsel_review_points is empty despite identified exposures");
  if (!hasValue(reportData?.legal_stack_control_review?.legal_stack_synthesis)) errors.push("legal_stack_control_review.legal_stack_synthesis is empty");

  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.exposure_findings?.consolidated_findings_schedule).length) errors.push("exposure_findings.consolidated_findings_schedule is empty despite identified exposures");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.exposure_findings?.finding_statements).length) errors.push("exposure_findings.finding_statements is empty despite identified exposures");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.exposure_findings?.affected_documents_controls).length) errors.push("exposure_findings.affected_documents_controls is empty despite identified exposures");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.exposure_findings?.recommended_remediation).length) errors.push("exposure_findings.recommended_remediation is empty despite identified exposures");

  if (!asArray(reportData?.evidence_gaps_clarification_points?.open_information_request_list).length) errors.push("evidence_gaps_clarification_points.open_information_request_list is empty");
  if (!asArray(reportData?.evidence_gaps_clarification_points?.consequence_if_unresolved).length) errors.push("evidence_gaps_clarification_points.consequence_if_unresolved is empty");

  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.implications_remediation_path?.remediation_roadmap).length) errors.push("implications_remediation_path.remediation_roadmap is empty despite identified exposures");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.implications_remediation_path?.document_route).length) errors.push("implications_remediation_path.document_route is empty despite identified exposures");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.implications_remediation_path?.control_route).length) errors.push("implications_remediation_path.control_route is empty despite identified exposures");
  if ((ledgerCounts.TRIGGERED || 0) > 0 && !asArray(reportData?.implications_remediation_path?.review_ready_handoff_bridge).length) errors.push("implications_remediation_path.review_ready_handoff_bridge is empty despite identified exposures");

  if (!asArray(reportData?.methodology_limitations_review_notes?.methodology).length) errors.push("methodology_limitations_review_notes.methodology is empty");
  if (!asArray(reportData?.methodology_limitations_review_notes?.stage_roles).length) errors.push("methodology_limitations_review_notes.stage_roles is empty");
  if (!asArray(reportData?.methodology_limitations_review_notes?.status_definitions).length) errors.push("methodology_limitations_review_notes.status_definitions is empty");
  if (!asArray(reportData?.methodology_limitations_review_notes?.legal_limitations).length) errors.push("methodology_limitations_review_notes.legal_limitations is empty");

  if (!asArray(reportData?.forensic_ledger_appendix?.forensic_ledger).length) errors.push("forensic_ledger_appendix.forensic_ledger is empty");
  if (!hasValue(reportData?.forensic_ledger_appendix?.condition_trigger_basis)) errors.push("forensic_ledger_appendix.condition_trigger_basis marker is missing");
  if (!hasValue(reportData?.platform_legal_diligence?.elements)) errors.push("platform_legal_diligence.elements is empty or missing");
}

export function validateStage9Report({ stage9Report, postChallengeLedger, registryRuntime }) {
  const errors = [];
  const warnings = [];
  const report = stage9Report?.report;
  const reportData = report?.report_data;
  if (!report || typeof report !== "object") errors.push("report object missing");
  if (!reportData || typeof reportData !== "object") errors.push("report.report_data object missing");

  if (reportData) {
    for (const key of REPORT_SECTION_KEYS) {
      if (!reportData[key] || typeof reportData[key] !== "object") errors.push(`missing report section: ${key}`);
      if (reportData[key]?.heading == null) errors.push(`missing report section heading: ${key}`);
    }
  }

  const ledger = asArray(postChallengeLedger);
  const ledgerIds = ledger.map(threatId).filter(Boolean);
  const ledgerCounts = countsByStatus(ledger);
  const registryRows = asArray(registryRuntime?.threats);
  const registryIds = registryRows.map((row, index) => asText(row?.threat_id || row?.Threat_ID || `ROW_${index + 1}`));

  const exposureFindings = reportData?.exposure_findings || {};
  const consolidatedFindings = asArray(exposureFindings.consolidated_findings);
  const supportingRows = asArray(exposureFindings.supporting_registry_rows || exposureFindings.schedule || exposureFindings.supporting_registry_items);
  const findingSchedule = asArray(exposureFindings.consolidated_findings_schedule || exposureFindings.schedule || exposureFindings.supporting_registry_rows);
  const findingCards = asArray(exposureFindings.detail_cards);
  const clarificationItems = asArray(reportData?.evidence_gaps_clarification_points?.clarification_required_items);
  const forensicLedger = asArray(reportData?.forensic_ledger_appendix?.forensic_ledger);
  const reviewedSources = asArray(reportData?.evidence_reviewed?.evidence_inventory?.reviewed_sources || reportData?.evidence_reviewed?.reviewed_sources);

  if (reportData) {
    validateRequiredBlocks(reportData, errors);
    validateSubstance(reportData, errors, ledgerCounts);
  }

  if (!reviewedSources.length) errors.push("evidence_reviewed.reviewed_sources is empty");
  const reviewedSourceRowsWithoutIdentity = reviewedSources.filter((source) => !asText(source?.source_url) && !asText(source?.title));
  if (reviewedSourceRowsWithoutIdentity.length) errors.push(`evidence_reviewed.reviewed_sources contains ${reviewedSourceRowsWithoutIdentity.length} row(s) without source_url or title`);

  if ((ledgerCounts.TRIGGERED || 0) > 0 && !consolidatedFindings.length) errors.push("identified exposures exist but consolidated_exposure_findings is empty");
  if (consolidatedFindings.length > (ledgerCounts.TRIGGERED || 0)) errors.push(`consolidated exposure findings exceed identified registry exposure items: consolidated=${consolidatedFindings.length}, triggered=${ledgerCounts.TRIGGERED || 0}`);

  const consolidatedCoveredRefs = new Set(consolidatedFindings.flatMap((finding) => asArray(finding.supporting_registry_references).map(asText).filter(Boolean)));
  const triggeredIds = ledger.filter((entry) => asText(entry?.final_status) === "TRIGGERED").map(threatId).filter(Boolean);
  const missingFromConsolidated = triggeredIds.filter((id) => !consolidatedCoveredRefs.has(id));
  if (missingFromConsolidated.length) errors.push(`consolidated findings missing triggered registry reference(s): ${missingFromConsolidated.join(", ")}`);

  if ((ledgerCounts.TRIGGERED || 0) > 0 && supportingRows.length !== (ledgerCounts.TRIGGERED || 0)) errors.push(`supporting registry row count mismatch: expected ${ledgerCounts.TRIGGERED || 0}, received ${supportingRows.length}`);
  if ((ledgerCounts.TRIGGERED || 0) > 0 && findingCards.length !== (ledgerCounts.TRIGGERED || 0)) errors.push(`finding detail card count mismatch: expected ${ledgerCounts.TRIGGERED || 0}, received ${findingCards.length}`);
  if (clarificationItems.length !== (ledgerCounts.INSUFFICIENT_EVIDENCE || 0)) errors.push(`clarification-required count mismatch: expected ${ledgerCounts.INSUFFICIENT_EVIDENCE || 0}, received ${clarificationItems.length}`);
  if (forensicLedger.length !== ledger.length) errors.push(`forensic ledger count mismatch: expected ${ledger.length}, received ${forensicLedger.length}`);

  const forensicIds = forensicLedger.map((row) => asText(row.registry_reference)).filter(Boolean);
  const missingFromForensic = ledgerIds.filter((id) => !forensicIds.includes(id));
  const unexpectedForensic = forensicIds.filter((id) => !ledgerIds.includes(id));
  const duplicateForensic = duplicateValues(forensicIds);
  if (missingFromForensic.length) errors.push(`forensic ledger missing registry reference(s): ${missingFromForensic.join(", ")}`);
  if (unexpectedForensic.length) errors.push(`forensic ledger has unexpected registry reference(s): ${unexpectedForensic.join(", ")}`);
  if (duplicateForensic.length) errors.push(`forensic ledger has duplicate registry reference(s): ${duplicateForensic.join(", ")}`);

  if (registryIds.length && ledgerIds.length !== registryIds.length) errors.push(`post-challenge ledger row count does not match registry count: ledger=${ledgerIds.length}, registry=${registryIds.length}`);

  const leaks = reportData ? visibleTermLeaks(reportData) : [];
  if (leaks.length) errors.push(`internal terminology leaked into visible report sections: ${leaks.join(", ")}`);

  const languageViolations = reportData ? visibleLanguageViolations({ ...reportData, forensic_ledger_appendix: undefined }) : [];
  if (languageViolations.length) errors.push(`non-legal visible language detected: ${languageViolations.join(", ")}`);

  const reportText = JSON.stringify(report || {});
  if (!reportText.includes(REVIEW_READY_DISCLAIMER)) errors.push("Review-Ready / counsel review disclaimer missing");

  const bannedBackendFields = ["vault_prefill_suggestions", "assembly_handoff", "handoff_envelope", "handoff_meta", "payload_ref", "interface_handoffs", "interface_handoff_payloads"];
  const backendLeaks = bannedBackendFields.filter((field) => reportText.includes(field));
  if (backendLeaks.length) errors.push(`backend handoff field leaked into Stage 9 report: ${backendLeaks.join(", ")}`);

  if (!findingSchedule.length && (ledgerCounts.TRIGGERED || 0) > 0) warnings.push("ledger has identified exposures but consolidated findings schedule is empty");
  if (!reportData?.methodology_limitations_review_notes?.limitations?.length) warnings.push("methodology limitations section has no legacy limitation bullets");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      ledger: ledgerCounts,
      consolidated_findings: consolidatedFindings.length,
      finding_schedule: findingSchedule.length,
      supporting_registry_rows: supportingRows.length,
      finding_cards: findingCards.length,
      clarification_items: clarificationItems.length,
      forensic_ledger: forensicLedger.length,
      reviewed_sources: reviewedSources.length,
      registry_count: registryIds.length,
      visible_language_violations: languageViolations.length
    },
    coverage: {
      ledger_count: ledgerIds.length,
      forensic_count: forensicIds.length,
      reviewed_sources_count: reviewedSources.length,
      missing_from_forensic: missingFromForensic,
      unexpected_forensic: unexpectedForensic,
      duplicate_forensic: duplicateForensic,
      consolidated_covered_triggered_refs: [...consolidatedCoveredRefs],
      missing_from_consolidated: missingFromConsolidated,
      visible_language_violations: languageViolations
    }
  };
}
