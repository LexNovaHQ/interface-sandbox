import {
  assertLegalGovernanceLosslessSource,
  assertWindowIsVerbatim,
  asArray,
  asObject,
  createReinvestigationRequest
} from '../stage6.runtime.js';
import {
  STAGE6_CONTRACT_ERROR_CODE,
  STAGE6_FORBIDDEN_6B_BASIS_VALUES,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';
import { STAGE6B_SOURCE_BASIS, hasStage6BDataProvenanceLanguage } from '../6b/6b.dictionary.js';

export const STAGE6B_TO_6C_HANDOFF_VALIDATOR_VERSION = 'validate6b_to_6c_handoff_v1';

function sourceById(primaryEvidence = {}) {
  return new Map(asArray(primaryEvidence.sources).map((source) => [source.source_id, source]));
}

function legalWindowLedger(legalCartography = {}, stage6bOutput = {}) {
  const out = [];
  const seen = new Set();
  const add = (window) => {
    if (!window?.window_id || seen.has(window.window_id)) return;
    seen.add(window.window_id);
    out.push(window);
  };
  for (const window of asArray(legalCartography.legal_source_window_ledger)) add(window);
  for (const window of asArray(stage6bOutput.source_window_ledger)) add(window);
  return out;
}

function windowById(legalCartography = {}, stage6bOutput = {}) {
  return new Map(legalWindowLedger(legalCartography, stage6bOutput).map((window) => [window.window_id, window]));
}

function legalUnitIds(legalCartography = {}) {
  return new Set(asArray(legalCartography.legal_unit_map).map((unit) => unit.legal_unit_id));
}

function profileFromStage6B(stage6bOutput = {}) {
  return asObject(
    stage6bOutput.legal_governance_data_provenance_profile
      || stage6bOutput.stage6b_output?.legal_governance_data_provenance_profile
      || stage6bOutput.stage6_review?.legal_governance_data_provenance_profile
  );
}

function targetFeatureProfileFromInput(value = {}) {
  const object = asObject(value?.target_feature_profile || value?.targetFeatureProfile || value);
  return Object.keys(object).length ? object : null;
}

function collectForbiddenFindings(value, path = 'root', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenFindings(item, `${path}[${index}]`, findings));
    return findings;
  }
  if (!value || typeof value !== 'object') return findings;

  for (const [key, nested] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;
    if (typeof nested === 'string' && STAGE6_FORBIDDEN_6B_BASIS_VALUES.includes(nested)) {
      findings.push({ path: nextPath, reason: `Forbidden 6B basis value remains in 6B→6C handoff: ${nested}` });
    }
    if (key === 'source_basis' && nested !== STAGE6B_SOURCE_BASIS.LEGAL_GOVERNANCE_SOURCE) {
      findings.push({ path: nextPath, reason: `6B legal findings must use LEGAL_GOVERNANCE_SOURCE basis, received ${nested || '<empty>'}` });
    }
    if (key === 'no_new_data_flow_rows' && nested === true) {
      findings.push({ path: nextPath, reason: '6B→6C handoff cannot preserve old no_new_data_flow_rows mode.' });
    }
    collectForbiddenFindings(nested, nextPath, findings);
  }
  return findings;
}

export function buildStage6CInputFrom6BHandoff({
  canonicalStage6Input = {},
  stage6aOutput = {},
  stage6bOutput = {},
  targetFeatureProfile = null,
  productSourceWindowLedger = []
} = {}) {
  const legalCartography = asObject(stage6aOutput.legal_cartography || stage6aOutput);
  const legalGovernanceProfile = profileFromStage6B(stage6bOutput);
  const effectiveTargetFeatureProfile = targetFeatureProfileFromInput(targetFeatureProfile || canonicalStage6Input.reference?.target_feature_profile || {});

  return {
    stage6c_input_version: 'stage6c_data_provenance_integration_input_v1',
    product_observed_profile: {
      target_feature_profile: effectiveTargetFeatureProfile || {},
      complete_feature_records: asArray(effectiveTargetFeatureProfile?.complete_feature_records || effectiveTargetFeatureProfile?.feature_inventory),
      product_data_touchpoints: asArray(effectiveTargetFeatureProfile?.data_touchpoints || effectiveTargetFeatureProfile?.data_provenance_map),
      source_status: effectiveTargetFeatureProfile ? 'PRESENT_FROM_STAGE5_TARGET_FEATURE_PROFILE' : 'MISSING_STAGE5_TARGET_FEATURE_PROFILE'
    },
    legal_governance_profile: {
      legal_governance_data_provenance_profile: legalGovernanceProfile,
      legal_cartography: legalCartography
    },
    source_custody: {
      legal_primary_evidence: canonicalStage6Input.primary_evidence || null,
      legal_source_window_ledger: legalWindowLedger(legalCartography, stage6bOutput),
      product_source_window_ledger: asArray(productSourceWindowLedger)
    },
    handoff_policy: {
      stage6c_may_create_new_source_facts: false,
      stage6c_allowed_new_rows: 'integration_alignment_rows_only',
      stage6b_profile_is_legal_governance_only: true
    }
  };
}

export function validate6bTo6cHandoff({
  canonicalStage6Input = {},
  stage6aOutput = {},
  stage6bOutput = {},
  targetFeatureProfile = null,
  proposedStage6cInput = null
} = {}) {
  const legalCartography = asObject(stage6aOutput.legal_cartography || stage6aOutput);
  const stage6cInput = proposedStage6cInput || buildStage6CInputFrom6BHandoff({
    canonicalStage6Input,
    stage6aOutput,
    stage6bOutput,
    targetFeatureProfile
  });
  const legalGovernanceProfile = asObject(stage6cInput.legal_governance_profile?.legal_governance_data_provenance_profile || profileFromStage6B(stage6bOutput));
  const findings = asArray(legalGovernanceProfile.legal_data_findings);
  const sourcesById = sourceById(asObject(canonicalStage6Input.primary_evidence));
  const windowsById = windowById(legalCartography, stage6bOutput);
  const unitIdSet = legalUnitIds(legalCartography);
  const violations = [];
  const reinvestigationRequests = [];

  try {
    assertLegalGovernanceLosslessSource(canonicalStage6Input);
  } catch (error) {
    violations.push({
      code: error.code || STAGE6_CONTRACT_ERROR_CODE.LOSSLESS_PRIMARY_EVIDENCE_VIOLATION,
      message: error.message,
      details: error.details || {}
    });
  }

  if (!legalGovernanceProfile.profile_version) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION,
      message: '6B→6C handoff missing legal_governance_data_provenance_profile.profile_version.'
    });
  }

  if (!asArray(legalCartography.legal_unit_map).length) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION,
      message: '6B→6C handoff missing 6A legal_unit_map.'
    });
  }

  if (!windowsById.size) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION,
      message: '6B→6C handoff missing legal source-window ledger.'
    });
  }

  for (const finding of findings) {
    if (!finding.legal_data_finding_id) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: '6B legal finding missing legal_data_finding_id.' });
    if (finding.source_basis !== STAGE6B_SOURCE_BASIS.LEGAL_GOVERNANCE_SOURCE) {
      violations.push({
        code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION,
        message: `6B finding ${finding.legal_data_finding_id || '<missing>'} source_basis must be LEGAL_GOVERNANCE_SOURCE.`
      });
    }
    if (!asArray(finding.legal_unit_refs).length) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} missing legal_unit_refs.` });
    }
    if (!asArray(finding.source_window_refs).length) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} missing source_window_refs.` });
    }
    for (const unitRef of asArray(finding.legal_unit_refs)) {
      if (!unitIdSet.has(unitRef)) {
        violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} references missing legal unit ${unitRef}.` });
      }
    }
    for (const windowRef of asArray(finding.source_window_refs)) {
      const window = windowsById.get(windowRef);
      if (!window) {
        violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} references missing source window ${windowRef}.` });
        continue;
      }
      const source = sourcesById.get(window.source_id);
      if (!source) {
        violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} source window ${windowRef} references source missing from primary evidence.` });
        continue;
      }
      try {
        assertWindowIsVerbatim(source, window);
      } catch (error) {
        violations.push({ code: error.code || STAGE6_CONTRACT_ERROR_CODE.SOURCE_WINDOW_NOT_VERBATIM, message: error.message, details: error.details || { window_id: windowRef } });
      }
    }
  }

  const forbidden = collectForbiddenFindings(stage6bOutput, 'stage6bOutput');
  for (const finding of forbidden) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION,
      message: finding.reason,
      path: finding.path
    });
  }

  const packetsWithDataLanguage = asArray(stage6bOutput.legal_unit_packets).filter((packet) => hasStage6BDataProvenanceLanguage(packet.verbatim_text));
  if (packetsWithDataLanguage.length && !findings.length) {
    reinvestigationRequests.push(createReinvestigationRequest({
      stage: '6B_TO_6C_HANDOFF',
      reason: '6B legal-unit packets contain data provenance language but no legal data findings reached the 6C handoff.',
      affected_refs: packetsWithDataLanguage.map((packet) => packet.legal_unit_id),
      requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_DATA_PROVENANCE_EXTRACTION],
      details: { trigger: 'DATA_LANGUAGE_PRESENT_WITH_NO_6B_FINDINGS_AT_6C_HANDOFF' }
    }));
  }

  const productProfile = asObject(stage6cInput.product_observed_profile?.target_feature_profile);
  if (!Object.keys(productProfile).length) {
    reinvestigationRequests.push(createReinvestigationRequest({
      stage: '6B_TO_6C_HANDOFF',
      reason: '6C product-observed input is missing Stage 5 target_feature_profile; 6C can run only as legal-only pending integration until Stage 5 profile is available.',
      affected_refs: [],
      requested_actions: [STAGE6_REINVESTIGATION_ACTION.REQUEST_UPSTREAM_SOURCE_REPAIR],
      details: { trigger: 'MISSING_PRODUCT_OBSERVED_PROFILE_FOR_6C' }
    }));
  }

  if (violations.length) {
    return {
      ok: false,
      validator_version: STAGE6B_TO_6C_HANDOFF_VALIDATOR_VERSION,
      status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
      violations,
      reinvestigation_requests: reinvestigationRequests,
      stage6c_input: stage6cInput,
      next_action: 'REPAIR_STAGE6B_TO_6C_CONTRACT_BEFORE_6C'
    };
  }

  if (reinvestigationRequests.length) {
    return {
      ok: false,
      validator_version: STAGE6B_TO_6C_HANDOFF_VALIDATOR_VERSION,
      status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
      violations: [],
      reinvestigation_requests: reinvestigationRequests,
      stage6c_input: stage6cInput,
      next_action: 'REINVESTIGATE_BEFORE_STAGE6C_INTEGRATION'
    };
  }

  return {
    ok: true,
    validator_version: STAGE6B_TO_6C_HANDOFF_VALIDATOR_VERSION,
    status: STAGE6_VALIDATION_STATUS.PASS,
    legal_data_finding_count: findings.length,
    legal_source_window_count: windowsById.size,
    stage6c_input: stage6cInput,
    next_action: 'RUN_STAGE6C_DATA_PROVENANCE_INTEGRATION'
  };
}
