import crypto from 'node:crypto';

import {
  STAGE6_CONTRACT_ERROR_CODE,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_RUNTIME_VERSION,
  STAGE6_SOURCE_FAMILY,
  STAGE6_VALIDATION_STATUS
} from './stage6.dictionary.js';

export class Stage6ContractViolationError extends Error {
  constructor(message, details = {}) {
    super(message);
    this.name = 'Stage6ContractViolationError';
    this.code = details.code || STAGE6_CONTRACT_ERROR_CODE.LOSSLESS_PRIMARY_EVIDENCE_VIOLATION;
    this.status = STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION;
    this.details = details;
  }
}

export function asArray(value) {
  return Array.isArray(value) ? value : [];
}

export function asObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value) ? value : {};
}

export function asText(value) {
  return typeof value === 'string' ? value : '';
}

export function computeSourceSha256(text = '') {
  return crypto.createHash('sha256').update(String(text), 'utf8').digest('hex');
}

export function stableSourceId(record = {}, index = 0) {
  return asText(record.source_id)
    || asText(record.evidence_source_id)
    || asText(record.id)
    || asText(record.source_ref)
    || asText(record.ref)
    || `LG_SRC_${String(index + 1).padStart(3, '0')}`;
}

export function exactLosslessText(record = {}) {
  if (typeof record.clean_text_lossless === 'string') return record.clean_text_lossless;
  if (record.text && typeof record.text.clean_text_lossless === 'string') return record.text.clean_text_lossless;
  return '';
}

export function canonicalLosslessPolicy(record = {}) {
  const sourcePolicy = asObject(record.lossless_policy);
  const evidencePolicy = asObject(record.evidence_policy);
  const policy = Object.keys(sourcePolicy).length ? sourcePolicy : evidencePolicy;

  if (Object.keys(policy).length) {
    return {
      full_text_lossless: policy.full_text_lossless === true,
      summarized: policy.summarized === true,
      compressed: policy.compressed === true,
      truncated: policy.truncated === true,
      normalized: policy.normalized === true
    };
  }

  return {
    full_text_lossless: true,
    summarized: false,
    compressed: false,
    truncated: false,
    normalized: false,
    policy_inferred_from_clean_text_lossless: true
  };
}

export function toCanonicalLegalGovernanceSource(record = {}, index = 0) {
  const cleanTextLossless = exactLosslessText(record);
  if (!cleanTextLossless) return null;
  const sourceId = stableSourceId(record, index);
  const sourceSha256 = asText(record.source_sha256) || computeSourceSha256(cleanTextLossless);

  return {
    source_id: sourceId,
    source_url: asText(record.source_url) || asText(record.url),
    source_title: asText(record.source_title) || asText(record.title),
    source_family: asText(record.source_family) || asText(record.family) || STAGE6_SOURCE_FAMILY.LEGAL_GOVERNANCE,
    clean_text_lossless: cleanTextLossless,
    source_sha256: sourceSha256,
    lossless_policy: canonicalLosslessPolicy(record),
    source_metadata: {
      source_role: asText(record.source_role),
      page_kind: asText(record.page_kind),
      document_type_hint: asText(record.document_type) || asText(record.document_type_hint),
      capture_status: asText(record.capture_status),
      admitted_source_family: asText(record.admitted_source_family)
    }
  };
}

export function collectLegalGovernanceCandidateRecords({ stage6Input = {}, adapterResult = {}, evidenceJunction = {}, sourceBundle = {} } = {}) {
  const candidates = [];
  const pushAll = (items) => {
    for (const item of asArray(items)) candidates.push(item);
  };

  pushAll(stage6Input.primary_evidence?.sources);
  pushAll(stage6Input.legal_governance_lossless_sources);
  pushAll(stage6Input.legal_governance_sources);
  pushAll(stage6Input.legal_family_sources);
  pushAll(stage6Input.governance_family_sources);
  pushAll(stage6Input.source_bundle?.evidence_buffer);
  pushAll(stage6Input.sources);

  pushAll(adapterResult.primary_evidence?.sources);
  pushAll(adapterResult.legal_governance_lossless_sources);
  pushAll(adapterResult.legal_governance_sources);
  pushAll(adapterResult.legal_family_sources);
  pushAll(adapterResult.governance_family_sources);
  pushAll(adapterResult.target_feature_profile_input?.source_bundle?.evidence_buffer);
  pushAll(adapterResult.source_bundle?.evidence_buffer);

  pushAll(evidenceJunction.legal_governance_sources);
  pushAll(evidenceJunction.legal_sources);
  pushAll(evidenceJunction.governance_sources);
  pushAll(evidenceJunction.sources);
  pushAll(evidenceJunction.source_registry);

  pushAll(sourceBundle.evidence_buffer);
  pushAll(sourceBundle.sources);
  pushAll(sourceBundle.source_records);
  pushAll(sourceBundle.raw_footprint?.source_records);
  pushAll(sourceBundle.raw_footprint?.sources);

  return candidates;
}

function legalGovernancePredicate(record = {}) {
  const family = `${asText(record.source_family)} ${asText(record.family)} ${asText(record.admitted_source_family)} ${asText(record.source_role)} ${asText(record.page_kind)} ${asText(record.source_url)} ${asText(record.url)}`.toLowerCase();
  return /legal|governance|privacy|terms|security|trust|subprocessor|processor|dpa|policy|acceptable|cookie|responsible-ai|responsible_ai/.test(family);
}

export function buildStage6CanonicalInput({ targetRef = {}, targetProfile = {}, targetFeatureProfile = {}, stage6Input = {}, adapterResult = {}, evidenceJunction = {}, sourceBundle = {} } = {}) {
  if (stage6Input.primary_evidence?.family_id === STAGE6_SOURCE_FAMILY.LEGAL_GOVERNANCE && asArray(stage6Input.primary_evidence.sources).length) {
    return stage6Input;
  }

  const candidateRecords = collectLegalGovernanceCandidateRecords({ stage6Input, adapterResult, evidenceJunction, sourceBundle });
  const canonicalSources = [];
  const seen = new Set();

  candidateRecords.forEach((record, index) => {
    if (!record || typeof record !== 'object') return;
    if (!legalGovernancePredicate(record)) return;
    const source = toCanonicalLegalGovernanceSource(record, index);
    if (!source) return;
    const key = source.source_id || source.source_url || source.source_sha256;
    if (seen.has(key)) return;
    seen.add(key);
    canonicalSources.push(source);
  });

  return {
    stage6_input_version: 'stage6_legal_governance_input_v1',
    target_ref: targetRef,
    primary_evidence: {
      family_id: STAGE6_SOURCE_FAMILY.LEGAL_GOVERNANCE,
      family_label: 'Legal / Governance Source Family',
      sources: canonicalSources
    },
    reference: {
      target_profile: targetProfile,
      target_feature_profile: targetFeatureProfile,
      metadata_sidecar: asArray(stage6Input.metadata_sidecar),
      navigation_sidecar: asArray(stage6Input.navigation_sidecar)
    }
  };
}

export function assertLegalGovernanceLosslessSource(input = {}) {
  const primaryEvidence = asObject(input.primary_evidence);
  const sources = asArray(primaryEvidence.sources);
  const violations = [];

  if (primaryEvidence.family_id !== STAGE6_SOURCE_FAMILY.LEGAL_GOVERNANCE) {
    violations.push('primary_evidence.family_id must be legal_governance');
  }
  if (!sources.length) {
    violations.push('primary_evidence.sources must contain legal/governance lossless sources');
  }

  sources.forEach((source, index) => {
    const prefix = `source[${index}]`;
    if (!source.source_id) violations.push(`${prefix}.source_id missing`);
    if (typeof source.clean_text_lossless !== 'string' || source.clean_text_lossless.length === 0) {
      violations.push(`${prefix}.clean_text_lossless missing or empty`);
    }
    const expectedSha = computeSourceSha256(source.clean_text_lossless || '');
    if (!source.source_sha256) violations.push(`${prefix}.source_sha256 missing`);
    if (source.source_sha256 && source.source_sha256 !== expectedSha) violations.push(`${prefix}.source_sha256 does not match clean_text_lossless`);
    const policy = asObject(source.lossless_policy);
    if (policy.full_text_lossless !== true) violations.push(`${prefix}.lossless_policy.full_text_lossless must be true`);
    if (policy.summarized === true) violations.push(`${prefix}.lossless_policy.summarized must be false`);
    if (policy.compressed === true) violations.push(`${prefix}.lossless_policy.compressed must be false`);
    if (policy.truncated === true) violations.push(`${prefix}.lossless_policy.truncated must be false`);
    if (policy.normalized === true) violations.push(`${prefix}.lossless_policy.normalized must be false`);
  });

  if (violations.length) {
    throw new Stage6ContractViolationError('Stage 6 legal/governance lossless source custody violation', {
      code: STAGE6_CONTRACT_ERROR_CODE.LOSSLESS_PRIMARY_EVIDENCE_VIOLATION,
      violations
    });
  }

  return {
    ok: true,
    status: STAGE6_VALIDATION_STATUS.PASS,
    source_count: sources.length,
    total_lossless_chars: sources.reduce((sum, source) => sum + source.clean_text_lossless.length, 0)
  };
}

export function assertWindowIsVerbatim(source = {}, window = {}) {
  const sourceText = asText(source.clean_text_lossless);
  const charStart = Number(window.char_start);
  const charEnd = Number(window.char_end);
  const expected = sourceText.slice(charStart, charEnd);

  if (!Number.isInteger(charStart) || !Number.isInteger(charEnd) || charStart < 0 || charEnd < charStart || charEnd > sourceText.length) {
    throw new Stage6ContractViolationError('Stage 6 source window offsets are invalid', {
      code: STAGE6_CONTRACT_ERROR_CODE.SOURCE_WINDOW_NOT_VERBATIM,
      source_id: source.source_id,
      window_id: window.window_id,
      char_start: window.char_start,
      char_end: window.char_end
    });
  }

  if (expected !== window.verbatim_text) {
    throw new Stage6ContractViolationError('Stage 6 source window is not verbatim', {
      code: STAGE6_CONTRACT_ERROR_CODE.SOURCE_WINDOW_NOT_VERBATIM,
      source_id: source.source_id,
      window_id: window.window_id
    });
  }

  const expectedSha = computeSourceSha256(sourceText);
  if (window.source_sha256 !== expectedSha) {
    throw new Stage6ContractViolationError('Stage 6 source window hash does not match source', {
      code: STAGE6_CONTRACT_ERROR_CODE.SOURCE_WINDOW_NOT_VERBATIM,
      source_id: source.source_id,
      window_id: window.window_id,
      expected_sha256: expectedSha,
      received_sha256: window.source_sha256
    });
  }

  return true;
}

export function createLegalUnitWindow(source = {}, range = {}, options = {}) {
  const sourceText = asText(source.clean_text_lossless);
  const charStart = Number(range.char_start ?? range.start ?? 0);
  const charEnd = Number(range.char_end ?? range.end ?? sourceText.length);
  const sourceSha256 = asText(source.source_sha256) || computeSourceSha256(sourceText);
  const legalUnitId = asText(options.legal_unit_id) || `${source.source_id || 'SRC'}#LUNIT_${String(options.unit_index ?? 1).padStart(3, '0')}`;
  const windowId = asText(options.window_id) || `${source.source_id || 'SRC'}#6A#${legalUnitId}`;

  const window = {
    window_id: windowId,
    legal_unit_id: legalUnitId,
    source_id: source.source_id,
    source_url: source.source_url,
    source_title: source.source_title,
    heading_text: asText(options.heading_text),
    unit_type: asText(options.unit_type) || 'UNKNOWN',
    char_start: charStart,
    char_end: charEnd,
    verbatim_text: sourceText.slice(charStart, charEnd),
    source_sha256: sourceSha256,
    created_by_stage: asText(options.created_by_stage) || '6A',
    used_for: asArray(options.used_for).length ? asArray(options.used_for) : ['legal_cartography'],
    selection_reason: asText(options.selection_reason) || 'legal-unit-specific verbatim source window'
  };

  assertWindowIsVerbatim({ ...source, source_sha256: sourceSha256 }, window);
  return window;
}

export function buildStage6SourceCustodyManifest(input = {}) {
  const sources = asArray(input.primary_evidence?.sources);
  return {
    manifest_version: 'stage6_source_custody_manifest_v1',
    family_id: input.primary_evidence?.family_id || STAGE6_SOURCE_FAMILY.LEGAL_GOVERNANCE,
    source_count: sources.length,
    total_lossless_chars: sources.reduce((sum, source) => sum + asText(source.clean_text_lossless).length, 0),
    sources: sources.map((source) => ({
      source_id: source.source_id,
      source_url: source.source_url,
      source_title: source.source_title,
      source_family: source.source_family,
      source_sha256: source.source_sha256 || computeSourceSha256(source.clean_text_lossless || ''),
      clean_text_lossless_length: asText(source.clean_text_lossless).length,
      full_text_lossless: source.lossless_policy?.full_text_lossless === true,
      summarized: source.lossless_policy?.summarized === true,
      compressed: source.lossless_policy?.compressed === true,
      truncated: source.lossless_policy?.truncated === true,
      normalized: source.lossless_policy?.normalized === true
    }))
  };
}

export function createReinvestigationRequest({ stage, reason, affected_refs = [], requested_actions = [], severity = STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED, details = {} } = {}) {
  return {
    request_id: `S6_REINVESTIGATE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    status: severity,
    stage,
    reason,
    affected_refs: asArray(affected_refs),
    requested_actions: asArray(requested_actions),
    details,
    created_at: new Date().toISOString()
  };
}

export function createSourceCustodyRepairRequest(details = {}) {
  return createReinvestigationRequest({
    stage: details.stage || 'stage6',
    reason: details.reason || 'Primary legal/governance lossless source custody is missing or invalid.',
    requested_actions: [STAGE6_REINVESTIGATION_ACTION.REQUEST_UPSTREAM_SOURCE_REPAIR],
    severity: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
    details
  });
}

export async function runBoundedReinvestigationLoop({ initialResult, validate, reinvestigate, maxAttempts = 2, context = {} } = {}) {
  const attempts = [];
  let current = initialResult;

  for (let attempt = 0; attempt <= maxAttempts; attempt += 1) {
    const validation = typeof validate === 'function' ? await validate(current, { attempt, context }) : { status: STAGE6_VALIDATION_STATUS.PASS };
    attempts.push({ attempt, validation });

    if (validation.status === STAGE6_VALIDATION_STATUS.PASS) {
      return {
        status: STAGE6_VALIDATION_STATUS.PASS,
        result: current,
        attempts
      };
    }

    if (validation.status === STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION) {
      return {
        status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
        result: current,
        attempts,
        reinvestigation_request: validation.reinvestigation_request || createSourceCustodyRepairRequest({ validation })
      };
    }

    if (attempt >= maxAttempts || typeof reinvestigate !== 'function') {
      return {
        status: STAGE6_VALIDATION_STATUS.UNRESOLVED_AFTER_REINVESTIGATION,
        result: current,
        attempts,
        reinvestigation_request: validation.reinvestigation_request || createReinvestigationRequest({
          stage: context.stage || 'stage6',
          reason: validation.reason || 'Validation remained unresolved after bounded reinvestigation.',
          affected_refs: validation.affected_refs || [],
          requested_actions: validation.requested_actions || []
        })
      };
    }

    current = await reinvestigate(current, { attempt, validation, context });
  }

  return {
    status: STAGE6_VALIDATION_STATUS.UNRESOLVED_AFTER_REINVESTIGATION,
    result: current,
    attempts
  };
}

export function validateStage6Foundation(input = {}) {
  try {
    const custody = assertLegalGovernanceLosslessSource(input);
    return {
      ok: true,
      status: STAGE6_VALIDATION_STATUS.PASS,
      custody
    };
  } catch (error) {
    if (error instanceof Stage6ContractViolationError) {
      return {
        ok: false,
        status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
        error_code: error.code,
        violations: error.details?.violations || [],
        reinvestigation_request: createSourceCustodyRepairRequest({
          stage: 'stage6',
          reason: error.message,
          violations: error.details?.violations || []
        })
      };
    }
    throw error;
  }
}

export async function runStage6Runtime({ targetRef = {}, targetProfile = {}, targetFeatureProfile = {}, stage6Input = {}, adapterResult = {}, evidenceJunction = {}, sourceBundle = {}, run6A, run6B, run6C } = {}) {
  const canonicalInput = buildStage6CanonicalInput({
    targetRef,
    targetProfile,
    targetFeatureProfile,
    stage6Input,
    adapterResult,
    evidenceJunction,
    sourceBundle
  });

  const foundationValidation = validateStage6Foundation(canonicalInput);
  if (foundationValidation.status === STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION) {
    return {
      ok: false,
      stage6_output_version: STAGE6_RUNTIME_VERSION,
      status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
      validation: foundationValidation,
      reinvestigation_request: foundationValidation.reinvestigation_request,
      forensic_log: {
        source_custody_preserved: false,
        reason: 'Stage 6 cannot run without legal/governance lossless primary evidence.'
      }
    };
  }

  const custodyManifest = buildStage6SourceCustodyManifest(canonicalInput);

  const stage6a = typeof run6A === 'function' ? await run6A({ canonicalInput, custodyManifest }) : null;
  const stage6b = typeof run6B === 'function' ? await run6B({ canonicalInput, custodyManifest, legalCartography: stage6a?.legal_cartography || stage6a }) : null;
  const stage6c = typeof run6C === 'function' ? await run6C({ canonicalInput, custodyManifest, legalCartography: stage6a?.legal_cartography || stage6a, legalGovernanceDataProvenanceProfile: stage6b?.legal_governance_data_provenance_profile || stage6b, targetFeatureProfile }) : null;

  return {
    ok: true,
    stage6_output_version: STAGE6_RUNTIME_VERSION,
    legal_cartography: stage6a?.legal_cartography || stage6a || null,
    legal_governance_data_provenance_profile: stage6b?.legal_governance_data_provenance_profile || stage6b || null,
    data_provenance_profile: stage6c?.data_provenance_profile || stage6c || null,
    stage7_handoff: {
      primary_evidence: canonicalInput.primary_evidence,
      primary_cartography: stage6a?.legal_cartography || stage6a || null,
      reference_profiles: {
        target_profile: targetProfile,
        target_feature_profile: targetFeatureProfile,
        data_provenance_profile: stage6c?.data_provenance_profile || stage6c || null
      },
      source_custody: custodyManifest
    },
    validation: {
      foundation: foundationValidation
    },
    forensic_log: {
      source_custody_preserved: true,
      source_count: custodyManifest.source_count,
      total_lossless_chars: custodyManifest.total_lossless_chars,
      active_substages: ['6A', '6B', '6C']
    }
  };
}
