/* LexNova Runtime — Stage 5A Deterministic Candidate Pool Builder. No model calls. */

import { asArray, asPlainObject, asText, stableStage5Id, uniqueStrings } from '../shared/stage5SharedIndex.js';

const DISPOSITION_VALUES = Object.freeze([
  'ADMITTED_PRODUCT_FUNCTION',
  'CORE_PRODUCT_OR_PRODUCT_AREA',
  'DUPLICATE_OR_ALIAS',
  'DELIVERY_CHANNEL_SIGNAL',
  'ARCHITECTURE_SIGNAL',
  'DATA_SIGNAL',
  'COMMERCIAL_OUTCOME_ONLY',
  'INSUFFICIENT_FUNCTION_EVIDENCE',
  'OUT_OF_SCOPE_FOR_5A'
]);

const FUNCTION_LIKE_BUCKETS = Object.freeze(['FUNCTION_TERM', 'API_CAPABILITY', 'WORKFLOW_CAPABILITY', 'MODEL_CAPABILITY']);

export function buildStage5ADeterministicCandidatePool(stage5aInput = {}, losslessIndex = {}) {
  const sourceRows = asArray(losslessIndex.lossless_source_index);
  const candidates = [];
  sourceRows.forEach((row) => {
    addProductLabelCandidates(candidates, row);
    addFunctionTermCandidates(candidates, row);
    addApiCandidates(candidates, row);
    addDataSignalCandidates(candidates, row);
    addCommercialCandidates(candidates, row);
  });

  const deduped = dedupeCandidates(candidates).map((candidate, index) => ({
    ...candidate,
    candidate_id: candidate.candidate_id || stableStage5Id('CAND', index + 1)
  }));

  return {
    deterministic_candidate_pool_version: 'stage5a_candidate_pool_v1',
    target_profile_ref: stage5aInput.target_profile_ref || null,
    candidate_count: deduped.length,
    deterministic_candidate_pool: deduped,
    candidate_pool_summary: summarizeCandidatePool(deduped),
    allowed_candidate_dispositions: DISPOSITION_VALUES,
    notes: ['Candidate pool is high recall and not final truth. Model adjudicates product-function admission.']
  };
}

export function summarizeCandidatePool(candidates = []) {
  return asArray(candidates).reduce((acc, candidate) => {
    const kind = candidate.candidate_kind || 'UNKNOWN';
    acc[kind] = (acc[kind] || 0) + 1;
    return acc;
  }, {});
}

export function isFunctionLikeCandidate(candidate = {}) {
  return FUNCTION_LIKE_BUCKETS.includes(asText(candidate.candidate_kind));
}

export function getStage5AAllowedCandidateDispositions() {
  return [...DISPOSITION_VALUES];
}

function addProductLabelCandidates(out, row) {
  for (const label of asArray(row.detected_product_labels)) {
    out.push(baseCandidate(row, label, 'CORE_PRODUCT_OR_PRODUCT_AREA', 'Detected product/platform label in lossless source index.'));
  }
}

function addFunctionTermCandidates(out, row) {
  for (const label of asArray(row.detected_function_terms)) {
    out.push(baseCandidate(row, label, 'FUNCTION_TERM', 'Detected function-like term in product-family source.'));
  }
}

function addApiCandidates(out, row) {
  if (!asArray(row.detected_api_terms).length) return;
  const label = row.title && /api|developer|reference|sdk/i.test(row.title) ? row.title : 'API capability surface';
  out.push(baseCandidate(row, label, 'API_CAPABILITY', 'Detected API/developer capability surface.'));
}

function addDataSignalCandidates(out, row) {
  for (const label of asArray(row.detected_data_terms).slice(0, 8)) {
    out.push(baseCandidate(row, label, 'DATA_SIGNAL', 'Detected data/input/output term.'));
  }
}

function addCommercialCandidates(out, row) {
  const haystack = `${row.title || ''} ${row.source_url || ''}`.toLowerCase();
  if (/pricing|enterprise|customer|case|solution|use-case|usecase/.test(haystack)) {
    out.push(baseCandidate(row, row.title || row.source_url || 'commercial outcome', 'COMMERCIAL_OUTCOME_ONLY', 'Detected commercial/source outcome signal.'));
  }
}

function baseCandidate(row, label, kind, reason) {
  const sourceRef = asText(row.source_id);
  return {
    candidate_id: null,
    candidate_text: asText(label),
    candidate_kind: kind,
    candidate_core_product_name: inferCoreProductName(row, label),
    source_refs: sourceRef ? [sourceRef] : [],
    lossless_index_refs: buildLosslessRefs(row),
    supporting_terms: uniqueStrings([label, ...(row.detected_api_terms || []), ...(row.detected_function_terms || [])]).slice(0, 12),
    candidate_reason: reason,
    source_family: row.source_family || null
  };
}

function inferCoreProductName(row, label) {
  const title = asText(row.title);
  if (/api|studio|model|platform|agent|edge|dashboard|console/i.test(title)) return title;
  if (/api|studio|model|platform|agent|edge|dashboard|console/i.test(label)) return label;
  return title || 'UNKNOWN_CORE_PRODUCT';
}

function buildLosslessRefs(row = {}) {
  const refs = [];
  if (row.source_id) refs.push(`${row.source_id}#source`);
  for (const marker of asArray(row.section_markers).slice(0, 3)) refs.push(marker.marker_id || marker);
  for (const chunk of asArray(row.chunk_refs).slice(0, 3)) refs.push(typeof chunk === 'string' ? chunk : asPlainObject(chunk).chunk_id);
  return uniqueStrings(refs);
}

function dedupeCandidates(candidates) {
  const seen = new Map();
  for (const candidate of candidates) {
    const key = `${candidate.candidate_kind}:${candidate.candidate_text}`.toLowerCase();
    const existing = seen.get(key);
    if (!existing) {
      seen.set(key, candidate);
      continue;
    }
    existing.source_refs = uniqueStrings([...(existing.source_refs || []), ...(candidate.source_refs || [])]);
    existing.lossless_index_refs = uniqueStrings([...(existing.lossless_index_refs || []), ...(candidate.lossless_index_refs || [])]);
    existing.supporting_terms = uniqueStrings([...(existing.supporting_terms || []), ...(candidate.supporting_terms || [])]);
  }
  return [...seen.values()].filter((candidate) => candidate.candidate_text);
}
