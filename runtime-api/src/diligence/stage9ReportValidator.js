import { BANNED_VISIBLE_TERMS, REVIEW_READY_DISCLAIMER } from "./reportTerminologyMap.js";
import { REPORT_SECTION_KEYS } from "./reportSectionContract.js";
import { visibleLanguageViolations } from "./reportLegalLanguage.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value) {
  return String(value ?? "").trim();
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

  const findingSchedule = asArray(reportData?.exposure_findings?.schedule);
  const findingCards = asArray(reportData?.exposure_findings?.detail_cards);
  const clarificationItems = asArray(reportData?.evidence_gaps_clarification_points?.clarification_required_items);
  const forensicLedger = asArray(reportData?.forensic_ledger_appendix?.forensic_ledger);
  const reviewedSources = asArray(reportData?.evidence_reviewed?.reviewed_sources);

  if (!reviewedSources.length) {
    errors.push("evidence_reviewed.reviewed_sources is empty");
  }
  const reviewedSourceRowsWithoutIdentity = reviewedSources.filter((source) => !asText(source?.source_url) && !asText(source?.title));
  if (reviewedSourceRowsWithoutIdentity.length) {
    errors.push(`evidence_reviewed.reviewed_sources contains ${reviewedSourceRowsWithoutIdentity.length} row(s) without source_url or title`);
  }

  if (findingSchedule.length !== (ledgerCounts.TRIGGERED || 0)) {
    errors.push(`identified exposure schedule count mismatch: expected ${ledgerCounts.TRIGGERED || 0}, received ${findingSchedule.length}`);
  }
  if (findingCards.length !== (ledgerCounts.TRIGGERED || 0)) {
    errors.push(`finding detail card count mismatch: expected ${ledgerCounts.TRIGGERED || 0}, received ${findingCards.length}`);
  }
  if (clarificationItems.length !== (ledgerCounts.INSUFFICIENT_EVIDENCE || 0)) {
    errors.push(`clarification-required count mismatch: expected ${ledgerCounts.INSUFFICIENT_EVIDENCE || 0}, received ${clarificationItems.length}`);
  }
  if (forensicLedger.length !== ledger.length) {
    errors.push(`forensic ledger count mismatch: expected ${ledger.length}, received ${forensicLedger.length}`);
  }

  const forensicIds = forensicLedger.map((row) => asText(row.registry_reference)).filter(Boolean);
  const missingFromForensic = ledgerIds.filter((id) => !forensicIds.includes(id));
  const unexpectedForensic = forensicIds.filter((id) => !ledgerIds.includes(id));
  const duplicateForensic = duplicateValues(forensicIds);
  if (missingFromForensic.length) errors.push(`forensic ledger missing registry reference(s): ${missingFromForensic.join(", ")}`);
  if (unexpectedForensic.length) errors.push(`forensic ledger has unexpected registry reference(s): ${unexpectedForensic.join(", ")}`);
  if (duplicateForensic.length) errors.push(`forensic ledger has duplicate registry reference(s): ${duplicateForensic.join(", ")}`);

  if (registryIds.length && ledgerIds.length !== registryIds.length) {
    errors.push(`post-challenge ledger row count does not match registry count: ledger=${ledgerIds.length}, registry=${registryIds.length}`);
  }

  const leaks = reportData ? visibleTermLeaks(reportData) : [];
  if (leaks.length) errors.push(`internal terminology leaked into visible report sections: ${leaks.join(", ")}`);

  const languageViolations = reportData ? visibleLanguageViolations({ ...reportData, forensic_ledger_appendix: undefined }) : [];
  if (languageViolations.length) errors.push(`non-legal visible language detected: ${languageViolations.join(", ")}`);

  const reportText = JSON.stringify(report || {});
  if (!reportText.includes(REVIEW_READY_DISCLAIMER)) errors.push("Review-Ready / counsel review disclaimer missing");

  const bannedBackendFields = ["vault_prefill_suggestions", "assembly_handoff", "handoff_envelope", "handoff_meta", "payload_ref", "interface_handoffs", "interface_handoff_payloads"];
  const backendLeaks = bannedBackendFields.filter((field) => reportText.includes(field));
  if (backendLeaks.length) errors.push(`backend handoff field leaked into Stage 9 report: ${backendLeaks.join(", ")}`);

  if (!findingSchedule.length && (ledgerCounts.TRIGGERED || 0) > 0) warnings.push("ledger has identified exposures but schedule is empty");
  if (!reportData?.methodology_limitations_review_notes?.limitations?.length) warnings.push("methodology limitations section has no limitation bullets");

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    counts: {
      ledger: ledgerCounts,
      finding_schedule: findingSchedule.length,
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
      visible_language_violations: languageViolations
    }
  };
}
