import { buildStage6BLegalGovernancePrefill, stage6BLegalGovernanceSourceRecords } from "./stage6bLegalGovernancePrefill.js";

function arr(value) { return Array.isArray(value) ? value : []; }
function obj(value) { return value && typeof value === "object" && !Array.isArray(value) ? value : {}; }
function issue(code, path, message, params = {}, severity = "repairable") { return { code, path, message, params, severity }; }
function allUnknown(values = []) { return arr(values).every((value) => !value || value === "unknown"); }
function hasVisible(values = []) { return arr(values).some((value) => value === "visible" || value === "partial"); }
function legalUnitCount(input = {}) { return arr((input.legal_document_cartography || input.stage6a_review?.legal_document_cartography || {}).legal_document_index).length; }

function rowLegalUnitRefs(row = {}) {
  return [
    ...arr(row.source_trace?.legal_unit_refs),
    ...arr(row.notice?.notice_legal_unit_refs),
    ...arr(row.consent_basis?.basis_legal_unit_refs),
    ...arr(row.rights?.rights_legal_unit_refs),
    ...arr(row.processor_chain?.processor_legal_unit_refs),
    ...arr(row.transfer_location?.location_legal_unit_refs),
    ...arr(row.retention_deletion_ai?.ai_architecture_legal_unit_refs),
    ...arr(row.security_accountability?.security_legal_unit_refs)
  ].filter(Boolean);
}

export function evaluateStage6BQualityExpectations(stage6Review = {}, { input = {}, semanticModelAttempted = null } = {}) {
  const out = [];
  const rows = arr(stage6Review?.data_provenance_profile?.data_flow_profile);
  const legalSources = stage6BLegalGovernanceSourceRecords(input);
  const prefill = buildStage6BLegalGovernancePrefill(input);
  const legalUnits = legalUnitCount(input);

  if (!rows.length) return out;

  if (legalSources.length === 0) {
    out.push(issue("STAGE6B_LEGAL_GOVERNANCE_SOURCE_GAP", "/data_provenance_profile", "6B has data-flow rows but no legal/governance lossless sources were available for control overlay.", { data_flow_count: rows.length }, "warning"));
    return out;
  }

  const legalLinkedRows = rows.filter((row) => rowLegalUnitRefs(row).length > 0).length;
  if (legalUnits > 0 && legalLinkedRows === 0) out.push(issue("STAGE6B_LEGAL_UNIT_REFS_EMPTY", "/data_provenance_profile/data_flow_profile", "6A legal units exist but no 6B data-flow row carries legal-unit refs.", { legal_unit_count: legalUnits, data_flow_count: rows.length }));

  const noticeValues = rows.flatMap((row) => [row.notice?.privacy_notice_signal, row.notice?.ai_notice_signal, row.notice?.subprocessor_notice_signal]);
  if (prefill.signals?.privacy_notice_signal === "visible" && allUnknown(noticeValues)) out.push(issue("STAGE6B_NOTICE_UNKNOWN_DESPITE_PRIVACY_DOC", "/data_provenance_profile/data_flow_profile", "Privacy/legal notice is visible in legal/governance sources but 6B notice fields remain unknown."));

  const rightsValues = rows.flatMap((row) => [row.rights?.access_right_signal, row.rights?.correction_right_signal, row.rights?.deletion_right_signal, row.rights?.opt_out_signal, row.rights?.withdrawal_right_signal, row.rights?.grievance_signal]);
  if (prefill.signals?.rights_signal === "visible" && allUnknown(rightsValues)) out.push(issue("STAGE6B_RIGHTS_UNKNOWN_DESPITE_PRIVACY_DOC", "/data_provenance_profile/data_flow_profile", "Privacy rights are visible in legal/governance sources but 6B rights fields remain unknown."));

  const securityValues = rows.flatMap((row) => [row.security_accountability?.encryption_signal, row.security_accountability?.access_control_signal, row.security_accountability?.audit_log_signal, row.security_accountability?.breach_notice_signal, row.security_accountability?.dpo_or_contact_signal]);
  if (hasVisible([prefill.signals?.encryption_signal, prefill.signals?.access_control_signal, prefill.signals?.breach_notice_signal]) && allUnknown(securityValues)) out.push(issue("STAGE6B_SECURITY_UNKNOWN_DESPITE_TRUST_DOC", "/data_provenance_profile/data_flow_profile", "Security/trust controls are visible but 6B security_accountability remains unknown."));

  const transferValues = rows.flatMap((row) => [row.transfer_location?.cross_border_signal, row.transfer_location?.data_residency_signal, row.transfer_location?.transfer_basis_signal]);
  if (hasVisible([prefill.signals?.data_residency_signal, prefill.signals?.cross_border_signal]) && allUnknown(transferValues)) out.push(issue("STAGE6B_TRANSFER_LOCATION_UNKNOWN_DESPITE_GOVERNANCE_DOC", "/data_provenance_profile/data_flow_profile", "Transfer/location or residency signals are visible but 6B transfer_location remains unknown."));

  const processorValues = rows.flatMap((row) => [row.processor_chain?.subprocessor_list_visible, row.processor_chain?.model_provider_visible, row.processor_chain?.cloud_provider_visible]);
  if (prefill.signals?.subprocessor_list_visible === "visible" && allUnknown(processorValues)) out.push(issue("STAGE6B_PROCESSOR_CHAIN_UNKNOWN_DESPITE_LEGAL_DOC", "/data_provenance_profile/data_flow_profile", "Subprocessor/processor language is visible but 6B processor_chain remains unknown."));

  const trainingValues = rows.flatMap((row) => [row.retention_deletion_ai?.training_opt_out_visible, row.retention_deletion_ai?.fine_tuning_prohibition_signal, row.processing?.fine_tuning_signal]);
  if (hasVisible([prefill.signals?.training_opt_out_visible, prefill.signals?.fine_tuning_prohibition_signal]) && allUnknown(trainingValues)) out.push(issue("STAGE6B_TRAINING_UNKNOWN_DESPITE_AI_PRIVACY_DOC", "/data_provenance_profile/data_flow_profile", "Training/fine-tuning controls are visible but 6B training fields remain unknown."));

  if (semanticModelAttempted === true) {
    const unknownHeavyRows = rows.filter((row) => {
      const values = [
        row.notice?.privacy_notice_signal,
        row.rights?.deletion_right_signal,
        row.processor_chain?.subprocessor_list_visible,
        row.transfer_location?.data_residency_signal,
        row.retention_deletion_ai?.training_opt_out_visible,
        row.security_accountability?.encryption_signal
      ];
      return values.filter((value) => value === "unknown").length >= 5;
    });
    if (unknownHeavyRows.length === rows.length && rows.length > 0) out.push(issue("STAGE6B_UNKNOWN_HEAVY_OUTPUT", "/data_provenance_profile/data_flow_profile", "All 6B rows remain unknown-heavy after semantic classification; unknown should be exception, not norm.", { data_flow_count: rows.length }));
  }

  return out;
}

export const stage6bSemanticQualityExpectationsInternals = { rowLegalUnitRefs, allUnknown, hasVisible, legalUnitCount };
