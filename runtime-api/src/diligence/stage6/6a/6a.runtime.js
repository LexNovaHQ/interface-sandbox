import {
  assertLegalGovernanceLosslessSource,
  buildStage6SourceCustodyManifest,
  createLegalUnitWindow,
  createReinvestigationRequest,
  runBoundedReinvestigationLoop,
  asArray,
  asText
} from '../stage6.runtime.js';
import {
  STAGE6_CONTROL_FAMILY,
  STAGE6_REINVESTIGATION_ACTION,
  STAGE6_VALIDATION_STATUS
} from '../stage6.dictionary.js';
import {
  STAGE6A_DOCUMENT_TYPE_KEYWORDS,
  STAGE6A_HEADING_PATTERNS,
  STAGE6A_LEGAL_UNIT_CLASSIFIERS,
  STAGE6A_LEGAL_UNIT_TYPE,
  STAGE6A_REINVESTIGATION_RULES,
  STAGE6A_RUNTIME_VERSION,
  containsStage6DataLanguage,
  termsPresent
} from './6a.dictionary.js';

export function inferDocumentType(source = {}) {
  const corpus = `${asText(source.source_title)} ${asText(source.source_url)} ${asText(source.clean_text_lossless).slice(0, 5000)}`.toLowerCase();
  for (const candidate of STAGE6A_DOCUMENT_TYPE_KEYWORDS) {
    if (candidate.terms.some((term) => corpus.includes(term.toLowerCase()))) return candidate.type;
  }
  return 'UNKNOWN';
}

export function detectLegalHeadings(cleanTextLossless = '') {
  const headings = [];
  const seen = new Set();

  for (const pattern of STAGE6A_HEADING_PATTERNS) {
    pattern.lastIndex = 0;
    let match;
    while ((match = pattern.exec(cleanTextLossless)) !== null) {
      const raw = match[0];
      const heading = asText(match[2] || match[1] || raw).trim();
      if (!heading || heading.length < 3) continue;
      const start = match.index;
      const key = `${start}:${heading}`;
      if (seen.has(key)) continue;
      seen.add(key);
      headings.push({
        heading_text: heading,
        char_start: start,
        marker_text: raw
      });
    }
  }

  return headings.sort((a, b) => a.char_start - b.char_start);
}

export function buildLegalUnitRanges(source = {}, { maxLegalUnitChars = 9000 } = {}) {
  const text = asText(source.clean_text_lossless);
  const headings = detectLegalHeadings(text);
  if (!headings.length) {
    return [{
      heading_text: '',
      char_start: 0,
      char_end: text.length,
      boundary_basis: 'FULL_DOCUMENT_FALLBACK'
    }];
  }

  const ranges = headings.map((heading, index) => {
    const nextHeading = headings[index + 1];
    return {
      heading_text: heading.heading_text,
      char_start: heading.char_start,
      char_end: nextHeading ? nextHeading.char_start : text.length,
      boundary_basis: 'HEADING_DETECTED'
    };
  }).filter((range) => range.char_end > range.char_start);

  const splitRanges = [];
  for (const range of ranges) {
    const length = range.char_end - range.char_start;
    if (length <= maxLegalUnitChars) {
      splitRanges.push(range);
      continue;
    }
    let cursor = range.char_start;
    let part = 1;
    while (cursor < range.char_end) {
      const end = Math.min(cursor + maxLegalUnitChars, range.char_end);
      splitRanges.push({
        heading_text: `${range.heading_text} [part ${part}]`,
        char_start: cursor,
        char_end: end,
        boundary_basis: 'LONG_LEGAL_UNIT_SPLIT_FOR_REINVESTIGATION_SAFE_BATCHING',
        parent_heading_text: range.heading_text
      });
      cursor = end;
      part += 1;
    }
  }

  return splitRanges;
}

export function classifyLegalUnit(verbatimText = '') {
  const matches = [];
  for (const classifier of STAGE6A_LEGAL_UNIT_CLASSIFIERS) {
    const matchedTerms = termsPresent(verbatimText, classifier.terms);
    if (matchedTerms.length) {
      matches.push({
        unit_type: classifier.unit_type,
        control_family: classifier.control_family,
        matched_terms: matchedTerms
      });
    }
  }

  if (!matches.length) {
    return {
      unit_type: STAGE6A_LEGAL_UNIT_TYPE.GENERAL_LEGAL_UNIT,
      control_family: STAGE6_CONTROL_FAMILY.UNKNOWN,
      matched_terms: [],
      confidence: containsStage6DataLanguage(verbatimText) ? 'LOW_DATA_LANGUAGE_UNCLASSIFIED' : 'LOW_GENERAL'
    };
  }

  const top = matches[0];
  return {
    ...top,
    alternate_candidates: matches.slice(1),
    confidence: matches.length > 1 ? 'MEDIUM_MULTI_MATCH' : 'HIGH'
  };
}

export function buildLegalDocumentInventory(canonicalInput = {}) {
  return asArray(canonicalInput.primary_evidence?.sources).map((source, index) => ({
    legal_document_id: `LDOC_${String(index + 1).padStart(3, '0')}`,
    source_id: source.source_id,
    source_url: source.source_url,
    document_type: inferDocumentType(source),
    document_title: source.source_title || source.source_url || source.source_id,
    effective_date: 'NOT_EVIDENCED',
    source_sha256: source.source_sha256,
    clean_text_lossless_present: typeof source.clean_text_lossless === 'string' && source.clean_text_lossless.length > 0
  }));
}

export function buildLegalUnits(canonicalInput = {}, { maxLegalUnitChars = 9000 } = {}) {
  const sources = asArray(canonicalInput.primary_evidence?.sources);
  const documents = buildLegalDocumentInventory(canonicalInput);
  const legalUnitMap = [];
  const legalSourceWindowLedger = [];

  sources.forEach((source, sourceIndex) => {
    const document = documents[sourceIndex];
    const ranges = buildLegalUnitRanges(source, { maxLegalUnitChars });
    ranges.forEach((range, rangeIndex) => {
      const legalUnitId = `LUNIT_${String(legalUnitMap.length + 1).padStart(4, '0')}`;
      const classification = classifyLegalUnit(source.clean_text_lossless.slice(range.char_start, range.char_end));
      const window = createLegalUnitWindow(source, range, {
        legal_unit_id: legalUnitId,
        window_id: `${source.source_id}#6A#${legalUnitId}`,
        unit_index: rangeIndex + 1,
        heading_text: range.heading_text,
        unit_type: classification.unit_type,
        used_for: ['legal_cartography', classification.control_family],
        selection_reason: range.boundary_basis
      });

      legalSourceWindowLedger.push(window);
      legalUnitMap.push({
        legal_unit_id: legalUnitId,
        legal_document_id: document.legal_document_id,
        source_id: source.source_id,
        source_window_ref: window.window_id,
        unit_type: classification.unit_type,
        heading_text: range.heading_text,
        char_start: range.char_start,
        char_end: range.char_end,
        source_sha256: source.source_sha256,
        control_family_candidates: [classification.control_family, ...(classification.alternate_candidates || []).map((candidate) => candidate.control_family)].filter(Boolean),
        matched_terms: classification.matched_terms || [],
        classification_confidence: classification.confidence,
        boundary_basis: range.boundary_basis,
        parent_heading_text: range.parent_heading_text || ''
      });
    });
  });

  return {
    legal_document_inventory: documents,
    legal_unit_map: legalUnitMap,
    legal_source_window_ledger: legalSourceWindowLedger
  };
}

export function buildLegalControlMap(legalUnitMap = []) {
  const rows = [];
  for (const unit of legalUnitMap) {
    const families = asArray(unit.control_family_candidates).filter((family) => family && family !== STAGE6_CONTROL_FAMILY.UNKNOWN);
    if (!families.length) {
      rows.push({
        legal_control_id: `LCTRL_${String(rows.length + 1).padStart(4, '0')}`,
        legal_unit_id: unit.legal_unit_id,
        control_family: STAGE6_CONTROL_FAMILY.UNKNOWN,
        control_label: 'Unclassified legal/governance unit',
        obligation_or_disclaimer: 'UNKNOWN',
        source_window_refs: [unit.source_window_ref]
      });
      continue;
    }

    for (const family of families) {
      rows.push({
        legal_control_id: `LCTRL_${String(rows.length + 1).padStart(4, '0')}`,
        legal_unit_id: unit.legal_unit_id,
        control_family: family,
        control_label: family.toLowerCase().replace(/_/g, ' '),
        obligation_or_disclaimer: family === STAGE6_CONTROL_FAMILY.LIMITATION_DISCLAIMER ? 'disclaimer' : 'control_or_disclosure',
        source_window_refs: [unit.source_window_ref]
      });
    }
  }
  return rows;
}

export function validateStage6ALegalCartography(stage6aOutput = {}) {
  const legalCartography = stage6aOutput.legal_cartography || stage6aOutput;
  const units = asArray(legalCartography.legal_unit_map);
  const windows = asArray(legalCartography.legal_source_window_ledger);
  const controls = asArray(legalCartography.legal_control_map);
  const windowIds = new Set(windows.map((window) => window.window_id));
  const unitIds = new Set(units.map((unit) => unit.legal_unit_id));
  const reinvestigationRequests = [];
  const contractViolations = [];

  if (!units.length) contractViolations.push('legal_unit_map is empty');
  if (!windows.length) contractViolations.push('legal_source_window_ledger is empty');

  for (const unit of units) {
    if (!unit.source_window_ref || !windowIds.has(unit.source_window_ref)) {
      contractViolations.push(`legal unit ${unit.legal_unit_id} has unresolved source_window_ref`);
    }
    const length = Number(unit.char_end) - Number(unit.char_start);
    if (length > 9000 && containsStage6DataLanguage(windows.find((window) => window.window_id === unit.source_window_ref)?.verbatim_text || '')) {
      reinvestigationRequests.push(createReinvestigationRequest({
        stage: '6A',
        reason: 'Legal unit is broad and contains data language; split or reclassify before relying on it.',
        affected_refs: [unit.legal_unit_id, unit.source_window_ref],
        requested_actions: [STAGE6_REINVESTIGATION_ACTION.SPLIT_LEGAL_UNIT],
        details: { trigger: 'LEGAL_UNIT_TOO_LONG_WITH_MULTIPLE_DATA_TERMS' }
      }));
    }
    if ((unit.control_family_candidates || []).includes(STAGE6_CONTROL_FAMILY.UNKNOWN) && containsStage6DataLanguage(windows.find((window) => window.window_id === unit.source_window_ref)?.verbatim_text || '')) {
      reinvestigationRequests.push(createReinvestigationRequest({
        stage: '6A',
        reason: 'Legal unit contains data language but classification remains generic or unknown.',
        affected_refs: [unit.legal_unit_id, unit.source_window_ref],
        requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_LEGAL_UNIT_CLASSIFICATION],
        details: { trigger: 'DATA_LANGUAGE_UNCLASSIFIED' }
      }));
    }
  }

  for (const control of controls) {
    if (!control.legal_unit_id || !unitIds.has(control.legal_unit_id)) {
      contractViolations.push(`legal control ${control.legal_control_id} references missing legal_unit_id`);
    }
    for (const ref of asArray(control.source_window_refs)) {
      if (!windowIds.has(ref)) contractViolations.push(`legal control ${control.legal_control_id} references missing source window ${ref}`);
    }
  }

  if (contractViolations.length) {
    return {
      ok: false,
      status: STAGE6_VALIDATION_STATUS.CONTRACT_VIOLATION,
      violations: contractViolations
    };
  }

  if (reinvestigationRequests.length) {
    return {
      ok: false,
      status: STAGE6_VALIDATION_STATUS.REINVESTIGATE_REQUIRED,
      reinvestigation_requests: reinvestigationRequests
    };
  }

  return {
    ok: true,
    status: STAGE6_VALIDATION_STATUS.PASS
  };
}

export async function runStage6ALegalCartography({ canonicalInput, modelPort = null, maxLegalUnitChars = 9000, maxReinvestigationAttempts = 1 } = {}) {
  assertLegalGovernanceLosslessSource(canonicalInput);
  const custodyManifest = buildStage6SourceCustodyManifest(canonicalInput);

  const buildOutput = () => {
    const legalUnits = buildLegalUnits(canonicalInput, { maxLegalUnitChars });
    const legalControlMap = buildLegalControlMap(legalUnits.legal_unit_map);
    return {
      ok: true,
      stage6a_output_version: STAGE6A_RUNTIME_VERSION,
      legal_cartography: {
        legal_document_inventory: legalUnits.legal_document_inventory,
        legal_unit_map: legalUnits.legal_unit_map,
        legal_control_map: legalControlMap,
        legal_source_window_ledger: legalUnits.legal_source_window_ledger
      },
      source_custody_manifest: custodyManifest,
      validation: {},
      forensic_log: {
        primary_source_family: 'legal_governance',
        no_source_level_cap: true,
        no_normalization: true,
        legal_unit_specific_windows: true,
        model_attempted: Boolean(modelPort)
      }
    };
  };

  const initialOutput = buildOutput();
  const loopResult = await runBoundedReinvestigationLoop({
    initialResult: initialOutput,
    maxAttempts: maxReinvestigationAttempts,
    context: { stage: '6A' },
    validate: async (candidate) => validateStage6ALegalCartography(candidate),
    reinvestigate: async (candidate, { validation }) => ({
      ...candidate,
      validation: {
        ...candidate.validation,
        reinvestigation_requested: true,
        reinvestigation_requests: validation.reinvestigation_requests || []
      },
      forensic_log: {
        ...candidate.forensic_log,
        reinvestigation_note: 'Phase 2 runtime records reinvestigation requests; split/expand execution is implemented in the 6A hardening phase.'
      }
    })
  });

  return {
    ...loopResult.result,
    validation: {
      ...loopResult.result.validation,
      status: loopResult.status,
      attempts: loopResult.attempts,
      stage6a_reinvestigation_rules: STAGE6A_REINVESTIGATION_RULES
    }
  };
}
