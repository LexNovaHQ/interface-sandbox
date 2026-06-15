import {
  assertLegalGovernanceLosslessSource,
  assertWindowIsVerbatim,
  asArray,
  asObject,
  createReinvestigationRequest
} from '../stage6.runtime.js';
import {
  STAGE6_CONTRACT_ERROR_CODE,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';
import { STAGE6C_ALIGNMENT_STATUS } from '../6c/6c.dictionary.js';

export const STAGE6C_TO_7_HANDOFF_VALIDATOR_VERSION = 'validate6c_to_7_handoff_v1';

function nonEmptyObject(value = {}) {
  const object = asObject(value);
  return Object.keys(object).length ? object : null;
}

function sourceById(primaryEvidence = {}) {
  return new Map(asArray(primaryEvidence.sources).map((source) => [source.source_id, source]));
}

function legalCartographyFromStage6A(stage6aOutput = {}) {
  return asObject(stage6aOutput.legal_cartography || stage6aOutput.stage6a_output?.legal_cartography || stage6aOutput);
}

function dataProvenanceProfileFromStage6C(stage6cOutput = {}) {
  return asObject(stage6cOutput.data_provenance_profile || stage6cOutput.stage6c_output?.data_provenance_profile || stage6cOutput.dataProvenanceProfile);
}

function targetProfileFromInput(canonicalStage6Input = {}, targetProfile = null) {
  return nonEmptyObject(targetProfile)
    || nonEmptyObject(canonicalStage6Input.reference?.target_profile)
    || nonEmptyObject(canonicalStage6Input.target_profile)
    || {};
}

function targetFeatureProfileFromInput(canonicalStage6Input = {}, targetFeatureProfile = null) {
  return nonEmptyObject(targetFeatureProfile)
    || nonEmptyObject(canonicalStage6Input.reference?.target_feature_profile)
    || nonEmptyObject(canonicalStage6Input.target_feature_profile)
    || {};
}

function addWindow(out, seen, window) {
  if (!window?.window_id || seen.has(window.window_id)) return;
  seen.add(window.window_id);
  out.push(window);
}

export function legalSourceWindowLedgerForStage7({ stage6aOutput = {}, stage6bOutput = {}, stage6cInput = {} } = {}) {
  const legalCartography = legalCartographyFromStage6A(stage6aOutput);
  const out = [];
  const seen = new Set();
  for (const window of asArray(legalCartography.legal_source_window_ledger)) addWindow(out, seen, window);
  for (const window of asArray(stage6bOutput.source_window_ledger)) addWindow(out, seen, window);
  for (const window of asArray(stage6cInput.source_custody?.legal_source_window_ledger)) addWindow(out, seen, window);
  return out;
}

function windowMap(windows = []) {
  return new Map(asArray(windows).map((window) => [window.window_id, window]));
}

function collectLegalWindowRefsFromDataProfile(dataProvenanceProfile = {}) {
  const refs = [];
  const add = (value) => {
    for (const item of asArray(value)) if (item && !refs.includes(item)) refs.push(item);
  };
  for (const row of asArray(dataProvenanceProfile.integrated_data_flows)) add(row.legal_source_window_refs);
  for (const row of asArray(dataProvenanceProfile.unmatched_legal_governance_controls)) add(row.legal_source_window_refs);
  for (const row of asArray(dataProvenanceProfile.conflicts)) add(row.legal_source_window_refs);
  return refs;
}

function collectProductWindowRefsFromDataProfile(dataProvenanceProfile = {}) {
  const refs = [];
  const add = (value) => {
    for (const item of asArray(value)) if (item && !refs.includes(item)) refs.push(item);
  };
  for (const row of asArray(dataProvenanceProfile.integrated_data_flows)) add(row.product_source_window_refs);
  for (const row of asArray(dataProvenanceProfile.unmatched_product_observed_flows)) add(row.product_source_window_refs);
  for (const row of asArray(dataProvenanceProfile.conflicts)) add(row.product_source_window_refs);
  return refs;
}

function hasLegalPrimaryEvidence(stage7Input = {}) {
  return Boolean(asArray(stage7Input.primary_evidence?.legal_governance_lossless_sources).length);
}

function hasLegalCartography(stage7Input = {}) {
  const cartography = asObject(stage7Input.primary_cartography?.legal_cartography || stage7Input.legal_cartography);
  return Boolean(asArray(cartography.legal_unit_map).length && asArray(cartography.legal_source_window_ledger).length);
}

function hasDataProfile(stage7Input = {}) {
  const profile = asObject(stage7Input.reference_profiles?.data_provenance_profile || stage7Input.data_provenance_profile);
  return Boolean(Object.keys(profile).length);
}

export function buildStage7InputFrom6CHandoff({
  canonicalStage6Input = {},
  stage6aOutput = {},
  stage6bOutput = {},
  stage6cOutput = {},
  stage6cInput = {},
  targetProfile = null,
  targetFeatureProfile = null,
  productSourceWindowLedger = []
} = {}) {
  const legalCartography = legalCartographyFromStage6A(stage6aOutput);
  const dataProvenanceProfile = dataProvenanceProfileFromStage6C(stage6cOutput);
  const legalSourceWindowLedger = legalSourceWindowLedgerForStage7({ stage6aOutput, stage6bOutput, stage6cInput });
  const productLedger = asArray(productSourceWindowLedger).length
    ? asArray(productSourceWindowLedger)
    : asArray(stage6cInput.source_custody?.product_source_window_ledger);

  return {
    stage7_input_version: 'stage7_registry_evaluation_input_v1',
    primary_evidence: {
      legal_governance_lossless_sources: asArray(canonicalStage6Input.primary_evidence?.sources),
      legal_governance_primary_evidence: canonicalStage6Input.primary_evidence || null
    },
    primary_cartography: {
      legal_cartography: legalCartography
    },
    reference_profiles: {
      target_profile: targetProfileFromInput(canonicalStage6Input, targetProfile),
      target_feature_profile: targetFeatureProfileFromInput(canonicalStage6Input, targetFeatureProfile),
      data_provenance_profile: dataProvenanceProfile
    },
    source_custody: {
      legal_source_window_ledger: legalSourceWindowLedger,
      product_source_window_ledger: productLedger
    },
    handoff_policy: {
      stage7_primary_sources: ['legal_governance_lossless_sources', 'legal_cartography'],
      data_provenance_profile_is_reference: true,
      target_profiles_are_reference: true,
      registry_evaluation_must_not_use_6c_as_only_truth: true
    }
  };
}

export function validate6cTo7Handoff({
  canonicalStage6Input = {},
  stage6aOutput = {},
  stage6bOutput = {},
  stage6cOutput = {},
  stage6cInput = {},
  targetProfile = null,
  targetFeatureProfile = null,
  productSourceWindowLedger = [],
  proposedStage7Input = null
} = {}) {
  const stage7Input = proposedStage7Input || buildStage7InputFrom6CHandoff({
    canonicalStage6Input,
    stage6aOutput,
    stage6bOutput,
    stage6cOutput,
    stage6cInput,
    targetProfile,
    targetFeatureProfile,
    productSourceWindowLedger
  });
  const legalCartography = asObject(stage7Input.primary_cartography?.legal_cartography || legalCartographyFromStage6A(stage6aOutput));
  const dataProfile = asObject(stage7Input.reference_profiles?.data_provenance_profile || dataProvenanceProfileFromStage6C(stage6cOutput));
  const legalWindows = asArray(stage7Input.source_custody?.legal_source_window_ledger);
  const productWindows = asArray(stage7Input.source_custody?.product_source_window_ledger);
  const legalWindowById = windowMap(legalWindows);
  const productWindowIds = new Set(productWindows.map((window) => window.window_id || window));
  const sourcesById = sourceById(asObject(canonicalStage6Input.primary_evidence));
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

  if (!hasLegalPrimaryEvidence(stage7Input)) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.STAGE7_HANDOFF_VIOLATION,
      message: 'Stage 7 handoff missing legal/governance lossless primary evidence.'
    });
  }

  if (!hasLegalCartography(stage7Input)) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.STAGE7_HANDOFF_VIOLATION,
      message: 'Stage 7 handoff missing legal_cartography with legal_unit_map and legal_source_window_ledger.'
    });
  }

  if (hasDataProfile(stage7Input) && (!hasLegalPrimaryEvidence(stage7Input) || !hasLegalCartography(stage7Input))) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.STAGE7_HANDOFF_VIOLATION,
      message: 'Stage 7 cannot receive data_provenance_profile without legal/governance primary evidence and legal_cartography.'
    });
  }

  if (!dataProfile.profile_version) {
    reinvestigationRequests.push(createReinvestigationRequest({
      stage: '6C_TO_7_HANDOFF',
      reason: 'Stage 7 handoff has no integrated data_provenance_profile.profile_version from 6C.',
      affected_refs: [],
      requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_ALIGNMENT_FOR_PAIR],
      details: { trigger: 'MISSING_6C_DATA_PROVENANCE_PROFILE' }
    }));
  }

  if (!asArray(legalCartography.legal_unit_map).length) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION,
      message: 'Stage 7 handoff legal_cartography has no legal_unit_map.'
    });
  }

  if (!legalWindows.length) {
    violations.push({
      code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_CARTOGRAPHY_HANDOFF_VIOLATION,
      message: 'Stage 7 handoff has no legal source-window ledger.'
    });
  }

  for (const window of legalWindows) {
    const source = sourcesById.get(window.source_id);
    if (!source) {
      violations.push({
        code: STAGE6_CONTRACT_ERROR_CODE.STAGE7_HANDOFF_VIOLATION,
        message: `Stage 7 legal source window ${window.window_id || '<missing>'} references source missing from legal/governance primary evidence.`
      });
      continue;
    }
    try {
      assertWindowIsVerbatim(source, window);
    } catch (error) {
      violations.push({
        code: error.code || STAGE6_CONTRACT_ERROR_CODE.SOURCE_WINDOW_NOT_VERBATIM,
        message: error.message,
        details: error.details || { window_id: window.window_id }
      });
    }
  }

  for (const ref of collectLegalWindowRefsFromDataProfile(dataProfile)) {
    if (!legalWindowById.has(ref)) {
      violations.push({
        code: STAGE6_CONTRACT_ERROR_CODE.STAGE7_HANDOFF_VIOLATION,
        message: `Stage 7 data_provenance_profile references legal source window not present in source custody ledger: ${ref}.`
      });
    }
  }

  for (const ref of collectProductWindowRefsFromDataProfile(dataProfile)) {
    if (productWindowIds.size && !productWindowIds.has(ref)) {
      reinvestigationRequests.push(createReinvestigationRequest({
        stage: '6C_TO_7_HANDOFF',
        reason: `Stage 7 data_provenance_profile references product source window not present in product custody ledger: ${ref}.`,
        affected_refs: [ref],
        requested_actions: [STAGE6_REINVESTIGATION_ACTION.REQUEST_UPSTREAM_SOURCE_REPAIR],
        details: { trigger: 'MISSING_PRODUCT_WINDOW_AT_STAGE7_HANDOFF' }
      }));
    }
  }

  for (const row of asArray(dataProfile.integrated_data_flows)) {
    const status = row.alignment_status;
    if ([STAGE6C_ALIGNMENT_STATUS.MATCHED_PRODUCT_AND_LEGAL_DATA_FLOW, STAGE6C_ALIGNMENT_STATUS.CONFLICT_PRODUCT_VS_LEGAL_DISCLOSURE].includes(status)) {
      if (!asArray(row.legal_source_window_refs).length) {
        violations.push({
          code: STAGE6_CONTRACT_ERROR_CODE.STAGE7_HANDOFF_VIOLATION,
          message: `Stage 7 ${status} row ${row.integrated_data_flow_id || '<missing>'} lacks legal_source_window_refs.`
        });
      }
    }
    if (status === STAGE6C_ALIGNMENT_STATUS.PRODUCT_OBSERVED_BUT_LEGAL_SOURCE_SILENT && !asArray(row.product_observed_refs).length) {
      violations.push({
        code: STAGE6_CONTRACT_ERROR_CODE.STAGE7_HANDOFF_VIOLATION,
        message: `Stage 7 product-observed silent row ${row.integrated_data_flow_id || '<missing>'} lacks product_observed_refs.`
      });
    }
    if (status === STAGE6C_ALIGNMENT_STATUS.LEGAL_GOVERNANCE_CONTROL_WITHOUT_PRODUCT_FLOW && !asArray(row.legal_source_window_refs).length) {
      violations.push({
        code: STAGE6_CONTRACT_ERROR_CODE.STAGE7_HANDOFF_VIOLATION,
        message: `Stage 7 legal-only row ${row.integrated_data_flow_id || '<missing>'} lacks legal_source_window_refs.`
      });
    }
  }

  if (violations.length) {
    return {
      ok: false,
      validator_version: STAGE6C_TO_7_HANDOFF_VALIDATOR_VERSION,
      status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
      violations,
      reinvestigation_requests: reinvestigationRequests,
      stage7_input: stage7Input,
      next_action: 'REPAIR_STAGE6C_TO_STAGE7_HANDOFF_CONTRACT'
    };
  }

  if (reinvestigationRequests.length) {
    return {
      ok: false,
      validator_version: STAGE6C_TO_7_HANDOFF_VALIDATOR_VERSION,
      status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
      violations: [],
      reinvestigation_requests: reinvestigationRequests,
      stage7_input: stage7Input,
      next_action: 'REINVESTIGATE_BEFORE_STAGE7_REGISTRY_EVALUATION'
    };
  }

  return {
    ok: true,
    validator_version: STAGE6C_TO_7_HANDOFF_VALIDATOR_VERSION,
    status: STAGE6_VALIDATION_STATUS.PASS,
    legal_source_count: asArray(stage7Input.primary_evidence?.legal_governance_lossless_sources).length,
    legal_unit_count: asArray(legalCartography.legal_unit_map).length,
    legal_source_window_count: legalWindows.length,
    integrated_data_flow_count: asArray(dataProfile.integrated_data_flows).length,
    stage7_input: stage7Input,
    next_action: 'RUN_STAGE7_REGISTRY_EVALUATION_WITH_LEGAL_PRIMARY_EVIDENCE'
  };
}
