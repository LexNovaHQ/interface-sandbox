/* LexNova Runtime — Stage 5A Lossless Source Index Builder. No model calls. */

import { asArray, asPlainObject, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';

const PRODUCT_LABEL_PATTERNS = Object.freeze([
  /\b(studio|api|apis|model|models|platform|workspace|dashboard|console|agent|agents|edge|copilot|assistant)\b/gi
]);

const FUNCTION_TERM_PATTERNS = Object.freeze([
  /\b(translat(?:e|ion)|transcri(?:be|ption)|speech[-\s]?to[-\s]?text|text[-\s]?to[-\s]?speech|tts|stt|ocr|digitis(?:e|ation)|extract(?:ion)?|dubb(?:ing)?|summari[sz]e|classif(?:y|ication)|embed(?:ding)?|search|generate|voice|chat|automate|workflow|integrat(?:e|ion)|api call)\b/gi
]);

const DATA_TERM_PATTERNS = Object.freeze([
  /\b(audio|voice|text|document|pdf|image|video|file|prompt|input|output|transcript|metadata|embedding|user data|customer data|personal data)\b/gi
]);

export function buildStage5ALosslessSourceIndex(stage5aInput = {}) {
  const sources = asArray(stage5aInput.product_family_source_lossless);
  return {
    lossless_source_index_version: 'stage5a_lossless_source_index_v1',
    target_profile_ref: stage5aInput.target_profile_ref || null,
    source_count: sources.length,
    lossless_source_index: sources.map((source, index) => indexLosslessSource(source, index)),
    limitations: sources.length ? [] : ['No lossless product-family sources available for 5A indexing.']
  };
}

export function indexLosslessSource(source = {}, index = 0) {
  const obj = asPlainObject(source);
  const sourceId = asText(obj.source_id) || `S5A_SRC_${String(index + 1).padStart(3, '0')}`;
  const text = asText(obj.clean_text);
  const sectionMarkers = buildSectionMarkers(text, sourceId);
  return {
    source_id: sourceId,
    source_family: asText(obj.family),
    source_url: asText(obj.source_url),
    title: asText(obj.title),
    text_ref: `lossless_text_archive:${sourceId}`,
    text_length: text.length,
    chunk_refs: asArray(obj.chunk_refs),
    section_markers: sectionMarkers,
    detected_product_labels: detectTerms(text, PRODUCT_LABEL_PATTERNS),
    detected_function_terms: detectTerms(text, FUNCTION_TERM_PATTERNS),
    detected_api_terms: detectApiTerms(text),
    detected_data_terms: detectTerms(text, DATA_TERM_PATTERNS),
    raw_source_ref: sourceId
  };
}

export function buildSectionMarkers(text = '', sourceId = 'S5A_SRC') {
  const lines = asText(text).split(/\r?\n/);
  const markers = [];
  let offset = 0;
  lines.forEach((line, index) => {
    const trimmed = line.trim();
    if (/^(#{1,4}\s+|[A-Z][A-Za-z0-9 &/:-]{2,80}$)/.test(trimmed)) {
      markers.push({
        marker_id: `${sourceId}#section:${String(markers.length + 1).padStart(3, '0')}`,
        line_number: index + 1,
        char_offset: offset,
        heading: trimmed.replace(/^#{1,4}\s+/, '').slice(0, 160)
      });
    }
    offset += line.length + 1;
  });
  return markers.slice(0, 80);
}

export function detectTerms(text = '', patterns = []) {
  const hits = [];
  for (const pattern of patterns) {
    const rx = new RegExp(pattern.source, pattern.flags);
    let match;
    while ((match = rx.exec(text)) && hits.length < 80) hits.push(match[0]);
  }
  return uniqueStrings(hits).slice(0, 40);
}

function detectApiTerms(text = '') {
  const hits = [];
  const rx = /\b(api|endpoint|sdk|webhook|integration|request|response|developer|reference|authentication|token|key)\b/gi;
  let match;
  while ((match = rx.exec(text)) && hits.length < 80) hits.push(match[0]);
  return uniqueStrings(hits).slice(0, 40);
}

export function summarizeStage5ALosslessSourceIndex(index = {}) {
  const rows = asArray(index.lossless_source_index);
  return {
    source_count: rows.length,
    total_text_length: rows.reduce((sum, row) => sum + Number(row.text_length || 0), 0),
    indexed_function_term_count: rows.reduce((sum, row) => sum + asArray(row.detected_function_terms).length, 0),
    indexed_product_label_count: rows.reduce((sum, row) => sum + asArray(row.detected_product_labels).length, 0)
  };
}
