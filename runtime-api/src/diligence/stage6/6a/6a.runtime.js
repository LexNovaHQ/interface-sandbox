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
  STAGE6A_STRUCTURAL_COVERAGE_RULES,
  STAGE6A_STRUCTURAL_MARKER_PATTERNS,
  STAGE6A_STRUCTURAL_MARKER_TYPE,
  STAGE6A_TABLE_LIST_MARKERS,
  containsStage6DataLanguage,
  termsPresent
} from './6a.dictionary.js';

const STRUCTURAL_MARKER_LEVEL = Object.freeze({
  [STAGE6A_STRUCTURAL_MARKER_TYPE.PART]: 1,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.CHAPTER]: 1,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.ARTICLE]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.SCHEDULE]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEX]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEXURE]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.APPENDIX]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.EXHIBIT]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.ATTACHMENT]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.ADDENDUM]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.RIDER]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.ORDER_FORM]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.STATEMENT_OF_WORK]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.DATA_PROCESSING_ADDENDUM]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.STANDARD_CONTRACTUAL_CLAUSES]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.TECHNICAL_ORGANISATIONAL_MEASURES]: 2,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.SECTION]: 3,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.SECURITY_MEASURES]: 3,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.SUBPROCESSOR_TABLE]: 3,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.PROCESSING_DETAILS]: 3,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.TRANSFER_DETAILS]: 3,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.RETENTION_SCHEDULE]: 3,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.CLAUSE]: 4,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.NUMBERED_HEADING]: 4,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.MARKDOWN_HEADING]: 4,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.ALL_CAPS_HEADING]: 4,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.TABLE_OR_LIST]: 5,
  [STAGE6A_STRUCTURAL_MARKER_TYPE.FULL_DOCUMENT_FALLBACK]: 0
});

const SCHEDULE_OR_ANNEXURE_MARKERS = new Set([
  STAGE6A_STRUCTURAL_MARKER_TYPE.SCHEDULE,
  STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEX,
  STAGE6A_STRUCTURAL_MARKER_TYPE.ANNEXURE,
  STAGE6A_STRUCTURAL_MARKER_TYPE.APPENDIX,
  STAGE6A_STRUCTURAL_MARKER_TYPE.EXHIBIT,
  STAGE6A_STRUCTURAL_MARKER_TYPE.ATTACHMENT,
  STAGE6A_STRUCTURAL_MARKER_TYPE.ADDENDUM,
  STAGE6A_STRUCTURAL_MARKER_TYPE.RIDER,
  STAGE6A_STRUCTURAL_MARKER_TYPE.DATA_PROCESSING_ADDENDUM,
  STAGE6A_STRUCTURAL_MARKER_TYPE.STANDARD_CONTRACTUAL_CLAUSES,
  STAGE6A_STRUCTURAL_MARKER_TYPE.TECHNICAL_ORGANISATIONAL_MEASURES
]);

const TABLE_OR_LIST_MARKERS = new Set([
  STAGE6A_STRUCTURAL_MARKER_TYPE.TABLE_OR_LIST,
  STAGE6A_STRUCTURAL_MARKER_TYPE.SUBPROCESSOR_TABLE,
  STAGE6A_STRUCTURAL_MARKER_TYPE.PROCESSING_DETAILS,
  STAGE6A_STRUCTURAL_MARKER_TYPE.TRANSFER_DETAILS,
  STAGE6A_STRUCTURAL_MARKER_TYPE.SECURITY_MEASURES,
  STAGE6A_STRUCTURAL_MARKER_TYPE.RETENTION_SCHEDULE
]);

const STRUCTURAL_CLASSIFIER_BY_MARKER = Object.freeze({
  [STAGE6A_STRUCTURAL_MARKER_TYPE.SUBPROCESSOR_TABLE]: {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.SUBPROCESSOR_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.SUBPROCESSORS,
    confidence: 'MEDIUM_STRUCTURAL_MARKER'
  },
  [STAGE6A_STRUCTURAL_MARKER_TYPE.PROCESSING_DETAILS]: {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.DATA_PROCESSING_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.DATA_PROCESSING,
    confidence: 'MEDIUM_STRUCTURAL_MARKER'
  },
  [STAGE6A_STRUCTURAL_MARKER_TYPE.TRANSFER_DETAILS]: {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.INTERNATIONAL_TRANSFER_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.INTERNATIONAL_TRANSFERS,
    confidence: 'MEDIUM_STRUCTURAL_MARKER'
  },
  [STAGE6A_STRUCTURAL_MARKER_TYPE.STANDARD_CONTRACTUAL_CLAUSES]: {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.INTERNATIONAL_TRANSFER_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.INTERNATIONAL_TRANSFERS,
    confidence: 'MEDIUM_STRUCTURAL_MARKER'
  },
  [STAGE6A_STRUCTURAL_MARKER_TYPE.SECURITY_MEASURES]: {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.SECURITY_MEASURES_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.SECURITY,
    confidence: 'MEDIUM_STRUCTURAL_MARKER'
  },
  [STAGE6A_STRUCTURAL_MARKER_TYPE.TECHNICAL_ORGANISATIONAL_MEASURES]: {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.SECURITY_MEASURES_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.SECURITY,
    confidence: 'MEDIUM_STRUCTURAL_MARKER'
  },
  [STAGE6A_STRUCTURAL_MARKER_TYPE.RETENTION_SCHEDULE]: {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.RETENTION_DELETION_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.RETENTION_DELETION,
    confidence: 'MEDIUM_STRUCTURAL_MARKER'
  },
  [STAGE6A_STRUCTURAL_MARKER_TYPE.DATA_PROCESSING_ADDENDUM]: {
    unit_type: STAGE6A_LEGAL_UNIT_TYPE.DATA_PROCESSING_CLAUSE,
    control_family: STAGE6_CONTROL_FAMILY.DATA_PROCESSING,
    confidence: 'MEDIUM_STRUCTURAL_MARKER'
  }
});

export function inferDocumentType(source = {}) {
  const corpus = `${asText(source.source_title)} ${asText(source.source_url)} ${asText(source.clean_text_lossless)}`.toLowerCase();
  for (const candidate of STAGE6A_DOCUMENT_TYPE_KEYWORDS) {
    if (candidate.terms.some((term) => corpus.includes(term.toLowerCase()))) return candidate.type;
  }
  return 'UNKNOWN';
}

function lineStartFor(text = '', index = 0) {
  return text.lastIndexOf('\n', Math.max(0, index - 1)) + 1;
}

function lineEndFor(text = '', index = 0) {
  const next = text.indexOf('\n', index);
  return next === -1 ? text.length : next;
}

function numberingLevel(marker = '') {
  const clean = String(marker || '').replace(/\.$/, '');
  if (!/^\d+(?:\.\d+)*$/.test(clean)) return STRUCTURAL_MARKER_LEVEL[STAGE6A_STRUCTURAL_MARKER_TYPE.NUMBERED_HEADING];
  return Math.min(6, clean.split('.').length + 2);
}

function markdownLevel(marker = '') {
  const depth = String(marker || '').trim().length;
  if (!depth) return STRUCTURAL_MARKER_LEVEL[STAGE6A_STRUCTURAL_MARKER_TYPE.MARKDOWN_HEADING];
  return Math.min(6, depth + 1);
}

function markerLevel(marker = {}) {
  if (marker.marker_type === STAGE6A_STRUCTURAL_MARKER_TYPE.NUMBERED_HEADING) return numberingLevel(marker.marker_text);
  if (marker.marker_type === STAGE6A_STRUCTURAL_MARKER_TYPE.MARKDOWN_HEADING) return markdownLevel(marker.marker_text);
  return STRUCTURAL_MARKER_LEVEL[marker.marker_type] || 4;
}

function markerHeading(match, raw = '') {
  const groups = match.groups || {};
  const heading = asText(groups.heading || match[2] || match[1] || raw).trim();
  const marker = asText(groups.marker || match[1] || raw).trim();
  return {
    heading_text: heading || marker,
    marker_text: marker || heading || raw.trim()
  };
}

function collectPatternMarkers(cleanTextLossless = '', patterns = []) {
  const markers = [];
  for (const pattern of patterns) {
    pattern.expression.lastIndex = 0;
    let match;
    while ((match = pattern.expression.exec(cleanTextLossless)) !== null) {
      const raw = match[0];
      const lineStart = lineStartFor(cleanTextLossless, match.index);
      const lineEnd = lineEndFor(cleanTextLossless, match.index);
      const { heading_text, marker_text } = markerHeading(match, raw);
      if (!heading_text || heading_text.length < 2) continue;
      markers.push({
        heading_text,
        marker_text,
        marker_type: pattern.marker_type,
        char_start: lineStart,
        marker_char_start: match.index,
        marker_char_end: lineEnd,
        priority: pattern.priority || 0,
        legal_unit_level: markerLevel({ marker_type: pattern.marker_type, marker_text }),
        boundary_basis: 'STRUCTURAL_MARKER_DETECTED'
      });
    }
  }
  return markers;
}

function detectTableOrListMarkers(cleanTextLossless = '') {
  const markers = [];
  const linePattern = /[^\n]*(?:\n|$)/g;
  let match;
  while ((match = linePattern.exec(cleanTextLossless)) !== null) {
    const rawLine = match[0];
    if (!rawLine) break;
    const line = rawLine.replace(/\n$/, '');
    const trimmed = line.trim();
    if (trimmed.length < 8 || trimmed.length > 260) continue;
    const lower = trimmed.toLowerCase();
    const hasTableSyntax = trimmed.startsWith('|') || trimmed.includes('\t') || /\s{3,}/.test(trimmed);
    const hasListSyntax = /^[-*•]\s+/.test(trimmed) || /^\(?[a-z0-9ivxlc]+\)?[.)]\s+/i.test(trimmed);
    const matchedMarker = STAGE6A_TABLE_LIST_MARKERS.find((candidate) => termsPresent(lower, candidate.terms).length > 0);
    if (!matchedMarker && !hasTableSyntax) continue;
    if (!hasTableSyntax && !hasListSyntax && !matchedMarker) continue;
    markers.push({
      heading_text: trimmed,
      marker_text: matchedMarker ? matchedMarker.marker_type : 'TABLE_OR_LIST',
      marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.TABLE_OR_LIST,
      char_start: match.index,
      marker_char_start: match.index,
      marker_char_end: match.index + line.length,
      priority: 55,
      legal_unit_level: STRUCTURAL_MARKER_LEVEL[STAGE6A_STRUCTURAL_MARKER_TYPE.TABLE_OR_LIST],
      boundary_basis: 'TABLE_OR_LIST_MARKER_DETECTED'
    });
  }
  return markers;
}

function dedupeStructuralMarkers(cleanTextLossless = '', markers = []) {
  const bestByLine = new Map();
  for (const marker of markers) {
    const lineStart = lineStartFor(cleanTextLossless, marker.char_start);
    const existing = bestByLine.get(lineStart);
    if (!existing || Number(marker.priority || 0) > Number(existing.priority || 0)) {
      bestByLine.set(lineStart, { ...marker, char_start: lineStart });
    }
  }
  return [...bestByLine.values()].sort((a, b) => a.char_start - b.char_start || b.priority - a.priority);
}

export function detectLegalHeadings(cleanTextLossless = '') {
  const structuralMarkers = collectPatternMarkers(cleanTextLossless, STAGE6A_STRUCTURAL_MARKER_PATTERNS);
  const headingMarkers = collectPatternMarkers(cleanTextLossless, STAGE6A_HEADING_PATTERNS).map((marker) => ({
    ...marker,
    boundary_basis: 'GENERIC_HEADING_DETECTED'
  }));
  const tableMarkers = detectTableOrListMarkers(cleanTextLossless);
  return dedupeStructuralMarkers(cleanTextLossless, [...structuralMarkers, ...headingMarkers, ...tableMarkers]);
}

function findSplitEnd(text = '', cursor = 0, hardEnd = 0, rangeEnd = 0) {
  const end = Math.min(hardEnd, rangeEnd);
  if (end >= rangeEnd) return rangeEnd;
  const segment = text.slice(cursor, end);
  const paragraph = segment.lastIndexOf('\n\n');
  if (paragraph > Math.floor(segment.length * 0.45)) return cursor + paragraph + 2;
  const newline = segment.lastIndexOf('\n');
  if (newline > Math.floor(segment.length * 0.45)) return cursor + newline + 1;
  const sentence = Math.max(segment.lastIndexOf('. '), segment.lastIndexOf('; '));
  if (sentence > Math.floor(segment.length * 0.45)) return cursor + sentence + 2;
  return end;
}

export function buildLegalUnitRanges(source = {}, { maxLegalUnitChars = 9000 } = {}) {
  const text = asText(source.clean_text_lossless);
  const headings = detectLegalHeadings(text);
  if (!headings.length) {
    return [{
      heading_text: '',
      marker_text: 'FULL_DOCUMENT',
      marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.FULL_DOCUMENT_FALLBACK,
      legal_unit_level: 0,
      char_start: 0,
      char_end: text.length,
      boundary_basis: 'FULL_DOCUMENT_FALLBACK'
    }];
  }

  const normalizedHeadings = headings[0].char_start > 0
    ? [{
        heading_text: 'Document preamble',
        marker_text: 'PREAMBLE',
        marker_type: STAGE6A_STRUCTURAL_MARKER_TYPE.FULL_DOCUMENT_FALLBACK,
        legal_unit_level: 0,
        char_start: 0,
        boundary_basis: 'PREAMBLE_BEFORE_FIRST_MARKER',
        priority: 1
      }, ...headings]
    : headings;

  const ranges = normalizedHeadings.map((heading, index) => {
    const nextHeading = normalizedHeadings[index + 1];
    return {
      heading_text: heading.heading_text,
      marker_text: heading.marker_text,
      marker_type: heading.marker_type,
      legal_unit_level: heading.legal_unit_level,
      char_start: heading.char_start,
      char_end: nextHeading ? nextHeading.char_start : text.length,
      boundary_basis: heading.boundary_basis || 'HEADING_DETECTED',
      marker_char_start: heading.marker_char_start,
      marker_char_end: heading.marker_char_end,
      is_schedule_or_annexure: SCHEDULE_OR_ANNEXURE_MARKERS.has(heading.marker_type),
      is_table_or_list_unit: TABLE_OR_LIST_MARKERS.has(heading.marker_type)
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
      const hardEnd = cursor + maxLegalUnitChars;
      const splitEnd = findSplitEnd(text, cursor, hardEnd, range.char_end);
      splitRanges.push({
        ...range,
        heading_text: `${range.heading_text || range.marker_text || 'Legal unit'} [part ${part}]`,
        char_start: cursor,
        char_end: splitEnd,
        boundary_basis: 'LONG_LEGAL_UNIT_SPLIT_WITHOUT_TEXT_LOSS',
        parent_heading_text: range.heading_text,
        split_part: part
      });
      if (splitEnd <= cursor) break;
      cursor = splitEnd;
      part += 1;
    }
  }

  return splitRanges;
}

export function classifyLegalUnit(verbatimText = '', marker = {}) {
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

  if (!matches.length && STRUCTURAL_CLASSIFIER_BY_MARKER[marker.marker_type]) {
    return {
      ...STRUCTURAL_CLASSIFIER_BY_MARKER[marker.marker_type],
      matched_terms: [marker.marker_text || marker.heading_text || marker.marker_type]
    };
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

function structurePathFor(stack = [], range = {}) {
  return [...stack.map((entry) => entry.heading_text || entry.marker_text).filter(Boolean), range.heading_text || range.marker_text].filter(Boolean);
}

export function buildLegalUnits(canonicalInput = {}, { maxLegalUnitChars = 9000 } = {}) {
  const sources = asArray(canonicalInput.primary_evidence?.sources);
  const documents = buildLegalDocumentInventory(canonicalInput);
  const legalUnitMap = [];
  const legalSourceWindowLedger = [];

  sources.forEach((source, sourceIndex) => {
    const document = documents[sourceIndex];
    const ranges = buildLegalUnitRanges(source, { maxLegalUnitChars });
    const hierarchyStack = [];
    ranges.forEach((range, rangeIndex) => {
      const legalUnitId = `LUNIT_${String(legalUnitMap.length + 1).padStart(4, '0')}`;
      while (hierarchyStack.length && Number(hierarchyStack[hierarchyStack.length - 1].legal_unit_level) >= Number(range.legal_unit_level)) {
        hierarchyStack.pop();
      }
      const parent = hierarchyStack[hierarchyStack.length - 1] || null;
      const verbatimText = source.clean_text_lossless.slice(range.char_start, range.char_end);
      const classification = classifyLegalUnit(verbatimText, range);
      const window = createLegalUnitWindow(source, range, {
        legal_unit_id: legalUnitId,
        window_id: `${source.source_id}#6A#${legalUnitId}`,
        unit_index: rangeIndex + 1,
        heading_text: range.heading_text,
        unit_type: classification.unit_type,
        used_for: ['legal_cartography', classification.control_family],
        selection_reason: range.boundary_basis
      });

      const unitRow = {
        legal_unit_id: legalUnitId,
        legal_document_id: document.legal_document_id,
        source_id: source.source_id,
        source_window_ref: window.window_id,
        unit_type: classification.unit_type,
        heading_text: range.heading_text,
        legal_unit_marker: range.marker_text || '',
        legal_unit_marker_type: range.marker_type,
        legal_unit_level: range.legal_unit_level,
        legal_unit_sequence: rangeIndex + 1,
        parent_legal_unit_id: parent?.legal_unit_id || '',
        structure_path: structurePathFor(hierarchyStack, range),
        is_schedule_or_annexure: Boolean(range.is_schedule_or_annexure),
        is_table_or_list_unit: Boolean(range.is_table_or_list_unit),
        char_start: range.char_start,
        char_end: range.char_end,
        source_sha256: source.source_sha256,
        control_family_candidates: [classification.control_family, ...(classification.alternate_candidates || []).map((candidate) => candidate.control_family)].filter(Boolean),
        matched_terms: classification.matched_terms || [],
        classification_confidence: classification.confidence,
        boundary_basis: range.boundary_basis,
        parent_heading_text: range.parent_heading_text || '',
        split_part: range.split_part || null
      };

      legalSourceWindowLedger.push(window);
      legalUnitMap.push(unitRow);
      hierarchyStack.push(unitRow);
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

export function buildTableListInventory(legalUnitMap = []) {
  return asArray(legalUnitMap)
    .filter((unit) => unit.is_table_or_list_unit)
    .map((unit, index) => ({
      table_or_list_id: `TLIST_${String(index + 1).padStart(4, '0')}`,
      legal_unit_id: unit.legal_unit_id,
      legal_document_id: unit.legal_document_id,
      source_id: unit.source_id,
      heading_text: unit.heading_text,
      legal_unit_marker_type: unit.legal_unit_marker_type,
      source_window_refs: [unit.source_window_ref]
    }));
}

export function buildStructuralCoverageInventory(canonicalInput = {}, legalUnitMap = []) {
  const unitsBySource = new Map();
  for (const unit of asArray(legalUnitMap)) {
    if (!unitsBySource.has(unit.source_id)) unitsBySource.set(unit.source_id, []);
    unitsBySource.get(unit.source_id).push(unit);
  }

  const inventory = [];
  for (const source of asArray(canonicalInput.primary_evidence?.sources)) {
    const text = asText(source.clean_text_lossless);
    const sourceUnits = unitsBySource.get(source.source_id) || [];
    for (const rule of STAGE6A_STRUCTURAL_COVERAGE_RULES) {
      const matchedTerms = termsPresent(text, rule.terms);
      if (!matchedTerms.length) {
        inventory.push({
          source_id: source.source_id,
          trigger: rule.trigger,
          status: 'NOT_TRIGGERED',
          matched_terms: [],
          expected_marker_types: rule.marker_types,
          matched_legal_unit_ids: []
        });
        continue;
      }
      const matchedUnits = sourceUnits.filter((unit) => asArray(rule.marker_types).includes(unit.legal_unit_marker_type));
      inventory.push({
        source_id: source.source_id,
        trigger: rule.trigger,
        status: matchedUnits.length ? 'PRESENT_AND_INDEXED' : 'PRESENT_BUT_MISSING_UNIT',
        matched_terms: matchedTerms,
        expected_marker_types: rule.marker_types,
        matched_legal_unit_ids: matchedUnits.map((unit) => unit.legal_unit_id)
      });
    }
  }
  return inventory;
}

export function validateStage6ALegalCartography(stage6aOutput = {}) {
  const legalCartography = stage6aOutput.legal_cartography || stage6aOutput;
  const units = asArray(legalCartography.legal_unit_map);
  const windows = asArray(legalCartography.legal_source_window_ledger);
  const controls = asArray(legalCartography.legal_control_map);
  const coverageInventory = asArray(legalCartography.structural_coverage_inventory);
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
    if (!unit.legal_unit_marker_type) {
      reinvestigationRequests.push(createReinvestigationRequest({
        stage: '6A',
        reason: 'Legal unit lacks structural marker metadata; harden legal-unit cartography before 6B.',
        affected_refs: [unit.legal_unit_id, unit.source_window_ref].filter(Boolean),
        requested_actions: [STAGE6_REINVESTIGATION_ACTION.RERUN_LEGAL_UNIT_CLASSIFICATION],
        details: { trigger: 'LEGAL_UNIT_MARKER_MISSING' }
      }));
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

  for (const coverage of coverageInventory) {
    if (coverage.status === 'PRESENT_BUT_MISSING_UNIT') {
      reinvestigationRequests.push(createReinvestigationRequest({
        stage: '6A',
        reason: `Source contains structural marker ${coverage.trigger} but no matching legal unit was indexed.`,
        affected_refs: [coverage.source_id],
        requested_actions: [STAGE6_REINVESTIGATION_ACTION.SPLIT_LEGAL_UNIT],
        details: {
          trigger: 'STRUCTURAL_MARKER_MISSING_UNIT',
          coverage_trigger: coverage.trigger,
          matched_terms: coverage.matched_terms,
          expected_marker_types: coverage.expected_marker_types
        }
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
    const structuralCoverageInventory = buildStructuralCoverageInventory(canonicalInput, legalUnits.legal_unit_map);
    const tableListInventory = buildTableListInventory(legalUnits.legal_unit_map);
    return {
      ok: true,
      stage6a_output_version: STAGE6A_RUNTIME_VERSION,
      legal_cartography: {
        legal_document_inventory: legalUnits.legal_document_inventory,
        legal_unit_map: legalUnits.legal_unit_map,
        legal_control_map: legalControlMap,
        legal_source_window_ledger: legalUnits.legal_source_window_ledger,
        table_list_inventory: tableListInventory,
        structural_coverage_inventory: structuralCoverageInventory
      },
      source_custody_manifest: custodyManifest,
      validation: {},
      forensic_log: {
        primary_source_family: 'legal_governance',
        no_source_level_cap: true,
        no_normalization: true,
        no_capped_text_windows: true,
        legal_unit_specific_windows: true,
        structural_marker_capture: true,
        schedule_annexure_appendix_exhibit_capture: true,
        table_list_capture: true,
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
        reinvestigation_note: '6A deterministic hardening records specific structural/classification reinvestigation requests; later phases may execute targeted split/classification repair.'
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
