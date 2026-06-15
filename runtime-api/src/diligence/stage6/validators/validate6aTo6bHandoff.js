import {
  assertLegalGovernanceLosslessSource,
  assertWindowIsVerbatim,
  asArray,
  asObject,
  asText,
  createReinvestigationRequest
} from '../stage6.runtime.js';
import {
  STAGE6_CONTRACT_ERROR_CODE,
  STAGE6_CONTROL_FAMILY,
  STAGE6_DATA_LANGUAGE_TERMS,
  STAGE6_FORBIDDEN_6B_BASIS_VALUES,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_SOURCE_FAMILY,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';

export const STAGE6A_TO_6B_HANDOFF_VALIDATOR_VERSION = 'validate6a_to_6b_handoff_v1';

const FORBIDDEN_6B_ROW_SPINE_KEYS = new Set([
  'data_flow_seed',
  'data_flow_seeds',
  'stage5_data_flow_seed',
  'stage5_data_flow_seeds',
  'stage5_data_provenance_seed',
  'stage5_data_provenance_seeds',
  'canonical_data_flow_rows',
  'seeded_data_flow_rows',
  'product_data_flow_seed',
  'target_feature_profile_data_flow_seed'
]);

function hasDataLanguage(text = '') {
  const haystack = asText(text).toLowerCase();
  return STAGE6_DATA_LANGUAGE_TERMS.some((term) => haystack.includes(term.toLowerCase()));
}

function normalizeLegalCartography(stage6aOutput = {}, proposedStage6bInput = {}) {
  return asObject(stage6aOutput.legal_cartography)
    || asObject(proposedStage6bInput.reference?.legal_cartography)
    || asObject(proposedStage6bInput.legal_cartography);
}

function legalWindowById(legalCartography = {}) {
  const windows = asArray(legalCartography.legal_source_window_ledger);
  return new Map(windows.map((window) => [window.window_id, window]));
}

function sourceById(primaryEvidence = {}) {
  return new Map(asArray(primaryEvidence.sources).map((source) => [source.source_id, source]));
}

function collectForbiddenFindings(value, path = 'root', findings = []) {
  if (Array.isArray(value)) {
    value.forEach((item, index) => collectForbiddenFindings(item, `${path}[${index}]`, findings));
    return findings;
  }

  if (!value || typeof value !== 'object') return findings;

  for (const [key, nested] of Object.entries(value)) {
    const nextPath = `${path}.${key}`;
    if (FORBIDDEN_6B_ROW_SPINE_KEYS.has(key)) {
      const nonEmpty = Array.isArray(nested) ? nested.length > 0 : Boolean(nested && typeof nested === 'object' ? Object.keys(nested).length : nested);
      if (nonEmpty) findings.push({ path: nextPath, reason: 'Stage 6B handoff contains a Stage 5/product-derived row spine key.' });
    }
    if (key === 'no_new_data_flow_rows' && nested === true) {
      findings.push({ path: nextPath, reason: 'Stage 6B may not forbid new legal/governance data provenance rows.' });
    }
    if (typeof nested === 'string' && STAGE6_FORBIDDEN_6B_BASIS_VALUES.includes(nested)) {
      findings.push({ path: nextPath, reason: `Forbidden 6B basis value: ${nested}` });
    }
    collectForbiddenFindings(nested, nextPath, findings);
  }

  return findings;
}

export function buildStage6BInputFrom6AHandoff({
  canonicalStage6Input = {},
  stage6aOutput = {},
  targetProfile = null,
  targetFeatureProfile = null,
  metadataSidecar = null,
  navigationSidecar = null
} = {}) {
  const primaryEvidence = asObject(canonicalStage6Input.primary_evidence);
  const legalCartography = asObject(stage6aOutput.legal_cartography);
  const reference = asObject(canonicalStage6Input.reference);

  return {
    stage6b_input_version: 'stage6b_legal_governance_data_extraction_input_v1',
    primary_evidence: {
      family_id: STAGE6_SOURCE_FAMILY.LEGAL_GOVERNANCE,
      family_label: primaryEvidence.family_label || 'Legal / Governance Source Family',
      sources: asArray(primaryEvidence.sources)
    },
    reference: {
      target_profile: targetProfile || reference.target_profile || {},
      target_feature_profile: targetFeatureProfile || reference.target_feature_profile || {},
      legal_cartography: legalCartography,
      metadata_sidecar: metadataSidecar || reference.metadata_sidecar || [],
      navigation_sidecar: navigationSidecar || reference.navigation_sidecar || []
    },
    handoff_policy: {
      primary_source: 'legal_governance_clean_text_lossless',
      stage5_usage: 'reference_only',
      allow_new_legal_governance_data_findings: true,
      no_new_data_flow_rows: false
    }
  };
}

export function validate6aTo6bHandoff({
  canonicalStage6Input = {},
  stage6aOutput = {},
  proposedStage6bInput = null,
  promptConfig = null
} = {}) {
  const stage6bInput = proposedStage6bInput || buildStage6BInputFrom6AHandoff({ canonicalStage6Input, stage6aOutput });
  const violations = [];
  const reinvestigationRequests = [];

  try {
    assertLegalGovernanceLosslessSource(stage6bInput);
  } catch (error) {
    violations.push({
      code: error.code || STAGE6_CONTRACT_ERROR_CODE.LOSSLESS_PRIMARY_EVIDENCE_VIOLATION,
      message: error.message,
      details: error.details || {}
    });
  }

  const primaryEvidence = asObject(stage6bInput.primary_evidence);
  const legalCartography = normalizeLegalCartography(stage6aOutput, stage6bInput);
  const documentInventory = asArray(legalCartography.legal_document_inventory);
  const legalUnitMap = asArray(legalCartography.legal_unit_map);
  const legalControlMap = asArray(legalCartography.legal_control_map);
  const legalSourceWindowLedger = asArray(legalCartography.legal_source_window_ledger);
  const sourcesById = sourceById(primaryEvidence);
  const windowsById = legalWindowById(legalCartography);
  const unitsById = new Map(legalUnitMap.map((unit) => [unit.legal_unit_id, unit]));

  if (!documentInventory.length) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: '6A→6B handoff missing legal_document_inventory.' });
  if (!legalUnitMap.length) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: '6A→6B handoff missing legal_unit_map.' });
  if (!legalSourceWindowLedger.length) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: '6A→6B handoff missing legal_source_window_ledger.' });

  for (const window of legalSourceWindowLedger) {
    if (!window.window_id) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: 'Legal source window missing window_id.' });
    if (!window.source_id || !sourcesById.has(window.source_id)) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: `Legal source window ${window.window_id || '<missing>'} references source_id not present in primary evidence.` });
      continue;
    }
    if (!Number.isInteger(Number(window.char_start)) || !Number.isInteger(Number(window.char_end)) || !window.source_sha256 || typeof window.verbatim_text !== 'string') {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: `Legal source window ${window.window_id} lacks offsets/hash/verbatim_text.` });
      continue;
    }
    try {
      assertWindowIsVerbatim(sourcesById.get(window.source_id), window);
    } catch (error) {
      violations.push({
        code: error.code || STAGE6_CONTRACT_ERROR_CODE.SOURCE_WINDOW_NOT_VERBATIM,
        message: error.message,
        details: error.details || { window_id: window.window_id }
      });
    }
  }

  for (const unit of legalUnitMap) {
    if (!unit.legal_unit_id) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: 'Legal unit missing legal_unit_id.' });
    if (!unit.source_id || !sourcesById.has(unit.source_id)) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: `Legal unit ${unit.legal_unit_id || '<missing>'} references missing source_id.` });
    }
    if (!unit.source_window_ref || !windowsById.has(unit.source_window_ref)) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: `Legal unit ${unit.legal_unit_id || '<missing>'} has unresolved source_window_ref.` });
    }
    const citedWindow = windowsById.get(unit.source_window_ref);
    if (citedWindow && hasDataLanguage(citedWindow.verbatim_text) && asArray(unit.control_family_candidates).includes(STAGE6_CONTROL_FAMILY.UNKNOWN)) {
      reinvestigationRequests.push(createReinvestigationRequest({
        stage: '6A_TO_6B_HANDOFF',
        reason: 'Legal unit contains data/provenance language but remains UNKNOWN before 6B extraction.',
        affected_refs: [unit.legal_unit_id, unit.source_window_ref],
        requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_LEGAL_UNIT_CLASSIFICATION],
        details: { trigger: 'DATA_LANGUAGE_UNKNOWN_AT_6B_HANDOFF' }
      }));
    }
  }

  for (const control of legalControlMap) {
    if (!control.legal_unit_id || !unitsById.has(control.legal_unit_id)) {
      violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: `Legal control ${control.legal_control_id || '<missing>'} references missing legal_unit_id.` });
    }
    for (const ref of asArray(control.source_window_refs)) {
      if (!windowsById.has(ref)) {
        violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: `Legal control ${control.legal_control_id || '<missing>'} references missing source window ${ref}.` });
      }
    }
  }

  const forbiddenFindings = [
    ...collectForbiddenFindings(stage6bInput, 'stage6bInput'),
    ...collectForbiddenFindings(promptConfig, 'promptConfig')
  ];
  for (const finding of forbiddenFindings) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION,
      message: finding.reason,
      path: finding.path
    });
  }

  if (!asObject(stage6bInput.reference).legal_cartography && !asObject(stage6bInput.legal_cartography)) {
    violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION, message: '6B input must include 6A legal_cartography as reference.' });
  }

  if (violations.length) {
    return {
      ok: false,
      validator_version: STAGE6A_TO_6B_HANDOFF_VALIDATOR_VERSION,
      status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
      violations,
      reinvestigation_requests: reinvestigationRequests,
      next_action: 'REPAIR_STAGE6A_TO_6B_CONTRACT_BEFORE_6B'
    };
  }

  if (reinvestigationRequests.length) {
    return {
      ok: false,
      validator_version: STAGE6A_TO_6B_HANDOFF_VALIDATOR_VERSION,
      status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
      violations: [],
      reinvestigation_requests: reinvestigationRequests,
      next_action: 'REINVESTIGATE_STAGE6A_LEGAL_UNITS_BEFORE_6B_EXTRACTION'
    };
  }

  return {
    ok: true,
    validator_version: STAGE6A_TO_6B_HANDOFF_VALIDATOR_VERSION,
    status: STAGE6_VALIDATION_STATUS.PASS,
    legal_document_count: documentInventory.length,
    legal_unit_count: legalUnitMap.length,
    legal_source_window_count: legalSourceWindowLedger.length,
    next_action: 'RUN_STAGE6B_LEGAL_GOVERNANCE_DATA_PROVENANCE_EXTRACTION'
  };
}
