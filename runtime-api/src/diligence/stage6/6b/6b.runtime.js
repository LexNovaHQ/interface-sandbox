import {
  assertLegalGovernanceLosslessSource,
  assertWindowIsVerbatim,
  asArray,
  asObject,
  asText,
  createReinvestigationRequest,
  runBoundedReinvestigationLoop
} from '../stage6.runtime.js';
import {
  STAGE6_CONTRACT_ERROR_CODE,
  STAGE6_FORBIDDEN_6B_BASIS_VALUES,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';
import {
  buildStage6BInputFrom6AHandoff,
  validate6aTo6bHandoff
} from '../validators/validate6aTo6bHandoff.js';
import {
  STAGE6B_DATA_CATEGORY,
  STAGE6B_DATA_SUBJECT,
  STAGE6B_EXPLICITNESS,
  STAGE6B_FINDING_TYPE,
  STAGE6B_LEGAL_DATA_FINDING_RULES,
  STAGE6B_PROCESSING_CONTEXT,
  STAGE6B_REQUIRED_COVERAGE_RULES,
  STAGE6B_RUNTIME_VERSION,
  STAGE6B_SOURCE_BASIS,
  hasStage6BDataProvenanceLanguage,
  termsPresent
} from './6b.dictionary.js';

export const STAGE6B_PROFILE_VERSION = 'legal_governance_data_provenance_profile_v1';

function nonEmptyObject(value) {
  const obj = asObject(value);
  return Object.keys(obj).length ? obj : null;
}

function legalCartographyFromInput(stage6bInput = {}, stage6aOutput = {}) {
  return nonEmptyObject(stage6bInput.reference?.legal_cartography)
    || nonEmptyObject(stage6bInput.legal_cartography)
    || nonEmptyObject(stage6aOutput.legal_cartography)
    || {};
}

function sourceById(stage6bInput = {}) {
  return new Map(asArray(stage6bInput.primary_evidence?.sources).map((source) => [source.source_id, source]));
}

function windowById(legalCartography = {}) {
  return new Map(asArray(legalCartography.legal_source_window_ledger).map((window) => [window.window_id, window]));
}

function unitById(legalCartography = {}) {
  return new Map(asArray(legalCartography.legal_unit_map).map((unit) => [unit.legal_unit_id, unit]));
}

function controlledFindingTypes() {
  return new Set(Object.values(STAGE6B_FINDING_TYPE));
}

function resolveLegalUnitWindow({ unit = {}, windowsById = new Map(), sourcesById = new Map() } = {}) {
  const window = windowsById.get(unit.source_window_ref);
  if (!window) return null;
  const source = sourcesById.get(window.source_id || unit.source_id);
  if (!source) return null;
  assertWindowIsVerbatim(source, window);
  return window;
}

function legalUnitRelevanceScore(unit = {}, window = {}) {
  const text = asText(window.verbatim_text);
  const base = hasStage6BDataProvenanceLanguage(text) ? 2 : 0;
  const controlHint = asArray(unit.control_family_candidates).some((value) => value && value !== 'UNKNOWN') ? 1 : 0;
  const structuralHint = /subprocessor|processing|transfer|security|retention|ai|model|privacy|data/i.test(`${unit.heading_text || ''} ${unit.legal_unit_marker || ''} ${unit.legal_unit_marker_type || ''}`) ? 1 : 0;
  return base + controlHint + structuralHint;
}

export function buildStage6BLegalUnitPackets({ stage6bInput = {}, legalCartography = {} } = {}) {
  const sourcesById = sourceById(stage6bInput);
  const windowsById = windowById(legalCartography);
  const packets = [];

  for (const unit of asArray(legalCartography.legal_unit_map)) {
    const window = resolveLegalUnitWindow({ unit, windowsById, sourcesById });
    if (!window) continue;
    const relevanceScore = legalUnitRelevanceScore(unit, window);
    if (relevanceScore <= 0) continue;
    packets.push({
      legal_unit_id: unit.legal_unit_id,
      legal_document_id: unit.legal_document_id,
      source_id: unit.source_id,
      source_window_ref: unit.source_window_ref,
      heading_text: unit.heading_text,
      unit_type: unit.unit_type,
      legal_unit_marker_type: unit.legal_unit_marker_type,
      control_family_candidates: asArray(unit.control_family_candidates),
      matched_terms_from_6a: asArray(unit.matched_terms),
      classification_confidence: unit.classification_confidence,
      relevance_score: relevanceScore,
      verbatim_text: window.verbatim_text,
      source_sha256: window.source_sha256,
      char_start: window.char_start,
      char_end: window.char_end
    });
  }

  return packets;
}

function textSignalForFinding(rule = {}, text = '') {
  const lower = asText(text).toLowerCase();
  const hasAny = (terms) => asArray(terms).some((term) => lower.includes(String(term).toLowerCase()));
  return {
    ai_or_model_treatment: hasAny(['ai', 'model', 'llm', 'machine learning', 'prompt', 'output', 'embedding', 'rag'])
      ? 'EVIDENCED_IN_LEGAL_GOVERNANCE_SOURCE'
      : 'NOT_EVIDENCED',
    retention_or_deletion_signal: hasAny(['retain', 'retention', 'delete', 'deletion', 'erasure', 'stored for'])
      ? 'EVIDENCED_IN_LEGAL_GOVERNANCE_SOURCE'
      : 'NOT_EVIDENCED',
    subprocessor_or_transfer_signal: hasAny(['subprocessor', 'service provider', 'vendor', 'processor', 'international transfer', 'standard contractual clauses', 'scc', 'outside your country', 'cross-border'])
      ? 'EVIDENCED_IN_LEGAL_GOVERNANCE_SOURCE'
      : 'NOT_EVIDENCED',
    controller_processor_role: hasAny(['controller', 'processor', 'process on behalf', 'data controller', 'data processor'])
      ? 'EVIDENCED_IN_LEGAL_GOVERNANCE_SOURCE'
      : 'NOT_EVIDENCED',
    explicitness: termsPresent(text, rule.terms).length ? STAGE6B_EXPLICITNESS.EXPLICIT : STAGE6B_EXPLICITNESS.IMPLIED_BY_LEGAL_UNIT
  };
}

function findingConfidence({ matchedTerms = [], unit = {} } = {}) {
  if (matchedTerms.length >= 2) return 'HIGH';
  if (matchedTerms.length === 1) return 'MEDIUM';
  if (asArray(unit.control_family_candidates).some((value) => value && value !== 'UNKNOWN')) return 'LOW_CONTROL_FAMILY_HINT';
  return 'LOW';
}

export function deriveLegalDataFindingsFromPackets({ legalUnitPackets = [], rules = STAGE6B_LEGAL_DATA_FINDING_RULES } = {}) {
  const findings = [];
  const seen = new Set();

  for (const packet of asArray(legalUnitPackets)) {
    const text = asText(packet.verbatim_text);
    for (const rule of asArray(rules)) {
      const matchedTerms = termsPresent(text, rule.terms);
      const controlHintMatch = asArray(packet.control_family_candidates).some((value) => asArray(rule.control_family_hints).includes(value));
      if (!matchedTerms.length && !controlHintMatch) continue;
      const dedupeKey = `${packet.legal_unit_id}::${rule.finding_type}`;
      if (seen.has(dedupeKey)) continue;
      seen.add(dedupeKey);
      const signals = textSignalForFinding(rule, text);
      findings.push({
        legal_data_finding_id: `LGDP_${String(findings.length + 1).padStart(4, '0')}`,
        finding_type: rule.finding_type,
        data_category: rule.data_category || STAGE6B_DATA_CATEGORY.UNKNOWN,
        data_subject: rule.data_subject || STAGE6B_DATA_SUBJECT.UNKNOWN,
        declared_action: rule.declared_action || 'legal/governance source describes data handling',
        processing_context: rule.processing_context || STAGE6B_PROCESSING_CONTEXT.UNKNOWN,
        ai_or_model_treatment: signals.ai_or_model_treatment,
        retention_or_deletion_signal: signals.retention_or_deletion_signal,
        subprocessor_or_transfer_signal: signals.subprocessor_or_transfer_signal,
        controller_processor_role: signals.controller_processor_role,
        source_basis: STAGE6B_SOURCE_BASIS.LEGAL_GOVERNANCE_SOURCE,
        legal_unit_refs: [packet.legal_unit_id],
        source_window_refs: [packet.source_window_ref],
        matched_terms: matchedTerms,
        control_family_hints: asArray(rule.control_family_hints),
        explicitness: signals.explicitness,
        confidence: findingConfidence({ matchedTerms, unit: packet }),
        row_creation_basis: 'LEGAL_GOVERNANCE_SOURCE_DERIVED_FINDING'
      });
    }
  }

  return findings;
}

function sourceWindowLedgerForFindings({ legalCartography = {}, findings = [] } = {}) {
  const refs = new Set(asArray(findings).flatMap((finding) => asArray(finding.source_window_refs)));
  return asArray(legalCartography.legal_source_window_ledger).filter((window) => refs.has(window.window_id));
}

function coverageSummary({ legalUnitPackets = [], findings = [] } = {}) {
  const findingTypes = new Set(asArray(findings).map((finding) => finding.finding_type));
  const allText = asArray(legalUnitPackets).map((packet) => packet.verbatim_text).join('\n\n');
  return asArray(STAGE6B_REQUIRED_COVERAGE_RULES).map((rule) => {
    const matchedTerms = termsPresent(allText, rule.terms);
    const expectedFindingsPresent = asArray(rule.expected_finding_types).filter((type) => findingTypes.has(type));
    return {
      trigger: rule.trigger,
      status: !matchedTerms.length ? 'NOT_TRIGGERED' : expectedFindingsPresent.length ? 'PRESENT_AND_EXTRACTED' : 'PRESENT_BUT_NO_FINDING',
      matched_terms: matchedTerms,
      expected_finding_types: rule.expected_finding_types,
      extracted_finding_types: expectedFindingsPresent
    };
  });
}

export function buildStage6BLegalGovernanceDataProvenanceProfile({ stage6bInput = {}, legalCartography = {} } = {}) {
  const legalUnitPackets = buildStage6BLegalUnitPackets({ stage6bInput, legalCartography });
  const legalDataFindings = deriveLegalDataFindingsFromPackets({ legalUnitPackets });
  const profile = {
    profile_version: STAGE6B_PROFILE_VERSION,
    legal_data_findings: legalDataFindings,
    extraction_scope: {
      primary_source_family: 'legal_governance',
      stage5_usage: 'reference_only',
      legal_unit_packet_count: legalUnitPackets.length,
      legal_data_finding_count: legalDataFindings.length
    },
    coverage_summary: coverageSummary({ legalUnitPackets, findings: legalDataFindings }),
    limitations: legalUnitPackets.length ? [] : ['No data-relevant legal units were available from 6A legal cartography.']
  };

  return {
    ok: true,
    stage6b_output_version: STAGE6B_RUNTIME_VERSION,
    legal_governance_data_provenance_profile: profile,
    source_window_ledger: sourceWindowLedgerForFindings({ legalCartography, findings: legalDataFindings }),
    legal_unit_packets: legalUnitPackets,
    validation: {},
    forensic_log: {
      primary_source_family: 'legal_governance',
      stage5_used_as_row_spine: false,
      stage5_usage: 'reference_only',
      no_new_data_flow_rows: false,
      legal_governance_source_derived_rows: true,
      legal_unit_packet_count: legalUnitPackets.length,
      legal_data_finding_count: legalDataFindings.length
    }
  };
}

function hasForbiddenBasis(value) {
  if (!value) return false;
  if (typeof value === 'string') return STAGE6_FORBIDDEN_6B_BASIS_VALUES.includes(value);
  if (Array.isArray(value)) return value.some(hasForbiddenBasis);
  if (typeof value === 'object') return Object.values(value).some(hasForbiddenBasis);
  return false;
}

export function validateStage6BLegalGovernanceDataProvenance(stage6bOutput = {}, { stage6bInput = {}, legalCartography = {} } = {}) {
  const profile = asObject(stage6bOutput.legal_governance_data_provenance_profile);
  const findings = asArray(profile.legal_data_findings);
  const legalUnitMap = asArray(legalCartography.legal_unit_map);
  const legalUnitIds = new Set(legalUnitMap.map((unit) => unit.legal_unit_id));
  const windowsById = windowById(legalCartography);
  const sourcesById = sourceById(stage6bInput);
  const controlledTypes = controlledFindingTypes();
  const violations = [];
  const reinvestigationRequests = [];

  try {
    assertLegalGovernanceLosslessSource(stage6bInput);
  } catch (error) {
    violations.push({ code: error.code || STAGE6_CONTRACT_ERROR_CODE.LOSSLESS_PRIMARY_EVIDENCE_VIOLATION, message: error.message, details: error.details || {} });
  }

  if (!profile.profile_version) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: '6B output missing profile_version.' });
  if (hasForbiddenBasis(stage6bOutput)) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: '6B output contains forbidden Stage 5-derived source basis.' });

  for (const finding of findings) {
    if (!finding.legal_data_finding_id) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: '6B finding missing legal_data_finding_id.' });
    if (!controlledTypes.has(finding.finding_type)) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} has uncontrolled finding_type.` });
    if (finding.source_basis !== STAGE6B_SOURCE_BASIS.LEGAL_GOVERNANCE_SOURCE) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} source_basis must be LEGAL_GOVERNANCE_SOURCE.` });
    if (!asArray(finding.legal_unit_refs).length) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} missing legal_unit_refs.` });
    if (!asArray(finding.source_window_refs).length) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} missing source_window_refs.` });

    for (const unitRef of asArray(finding.legal_unit_refs)) {
      if (!legalUnitIds.has(unitRef)) violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} references missing legal unit ${unitRef}.` });
    }
    for (const windowRef of asArray(finding.source_window_refs)) {
      const window = windowsById.get(windowRef);
      if (!window) {
        violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} references missing source window ${windowRef}.` });
        continue;
      }
      const source = sourcesById.get(window.source_id);
      if (!source) {
        violations.push({ code: STAGE6_CONTRACT_ERROR_CODE.LEGAL_DATA_PROVENANCE_HANDOFF_VIOLATION, message: `6B finding ${finding.legal_data_finding_id || '<missing>'} window ${windowRef} references source missing from primary evidence.` });
        continue;
      }
      try {
        assertWindowIsVerbatim(source, window);
      } catch (error) {
        violations.push({ code: error.code || STAGE6_CONTRACT_ERROR_CODE.SOURCE_WINDOW_NOT_VERBATIM, message: error.message, details: error.details || { window_id: windowRef } });
      }
    }
  }

  const dataRelevantPackets = asArray(stage6bOutput.legal_unit_packets).filter((packet) => hasStage6BDataProvenanceLanguage(packet.verbatim_text));
  if (dataRelevantPackets.length && !findings.length) {
    reinvestigationRequests.push(createReinvestigationRequest({
      stage: '6B',
      reason: 'Legal/governance legal units contain data provenance language but 6B produced no legal data findings.',
      affected_refs: dataRelevantPackets.map((packet) => packet.legal_unit_id),
      requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_DATA_PROVENANCE_EXTRACTION],
      details: { trigger: 'DATA_LANGUAGE_PRESENT_WITH_NO_6B_FINDINGS' }
    }));
  }

  for (const coverage of asArray(profile.coverage_summary)) {
    if (coverage.status === 'PRESENT_BUT_NO_FINDING') {
      reinvestigationRequests.push(createReinvestigationRequest({
        stage: '6B',
        reason: `Legal/governance source contains ${coverage.trigger} but 6B produced no matching finding type.`,
        affected_refs: [],
        requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_DATA_PROVENANCE_EXTRACTION],
        details: coverage
      }));
    }
  }

  if (violations.length) {
    return {
      ok: false,
      status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
      violations,
      reinvestigation_requests: reinvestigationRequests
    };
  }

  if (reinvestigationRequests.length) {
    return {
      ok: false,
      status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
      violations: [],
      reinvestigation_requests: reinvestigationRequests
    };
  }

  return {
    ok: true,
    status: STAGE6_VALIDATION_STATUS.PASS,
    legal_data_finding_count: findings.length
  };
}

export async function runStage6BLegalGovernanceDataProvenance({ canonicalInput = {}, stage6aOutput = {}, stage6bInput = null, modelPort = null, maxReinvestigationAttempts = 1 } = {}) {
  const effectiveStage6bInput = stage6bInput || buildStage6BInputFrom6AHandoff({
    canonicalStage6Input: canonicalInput,
    stage6aOutput
  });
  const legalCartography = legalCartographyFromInput(effectiveStage6bInput, stage6aOutput);
  const handoffValidation = validate6aTo6bHandoff({
    canonicalStage6Input: canonicalInput,
    stage6aOutput,
    proposedStage6bInput: effectiveStage6bInput
  });

  if (handoffValidation.status === STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION) {
    return {
      ok: false,
      stage6b_output_version: STAGE6B_RUNTIME_VERSION,
      status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
      validation: {
        handoff: handoffValidation
      },
      forensic_log: {
        primary_source_family: 'legal_governance',
        stage5_used_as_row_spine: false,
        reason: '6B cannot run until legal/governance primary source and 6A cartography handoff are valid.'
      }
    };
  }

  const buildOutput = () => buildStage6BLegalGovernanceDataProvenanceProfile({
    stage6bInput: effectiveStage6bInput,
    legalCartography
  });

  const initialOutput = buildOutput();
  const loopResult = await runBoundedReinvestigationLoop({
    initialResult: initialOutput,
    maxAttempts: maxReinvestigationAttempts,
    context: { stage: '6B' },
    validate: async (candidate) => validateStage6BLegalGovernanceDataProvenance(candidate, {
      stage6bInput: effectiveStage6bInput,
      legalCartography
    }),
    reinvestigate: async (candidate, { validation }) => ({
      ...candidate,
      validation: {
        ...candidate.validation,
        reinvestigation_requested: true,
        reinvestigation_requests: validation.reinvestigation_requests || []
      },
      forensic_log: {
        ...candidate.forensic_log,
        reinvestigation_note: '6B canonical runtime records exact legal-unit reinvestigation requests; model-assisted targeted extraction can be plugged into modelPort without changing row spine.',
        model_port_available: Boolean(modelPort)
      }
    })
  });

  return {
    ...loopResult.result,
    validation: {
      ...loopResult.result.validation,
      handoff: handoffValidation,
      status: loopResult.status,
      attempts: loopResult.attempts
    }
  };
}
