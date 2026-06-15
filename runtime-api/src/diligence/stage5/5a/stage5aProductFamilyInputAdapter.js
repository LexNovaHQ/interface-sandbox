/*
 * LexNova Runtime — Stage 5A Product-Family Input Adapter
 * Batch 2: no live wiring. Accepts target profile + product-family lossless source package.
 */

import { asArray, asPlainObject, asText, normalizeSourceRefs } from '../shared/stage5SharedIndex.js';

const SOURCE_LIST_PATHS = Object.freeze([
  ['product_family_source_lossless'],
  ['product_family_sources'],
  ['product_family_primary_sources'],
  ['product_family_secondary_sources'],
  ['product_family_supporting_sources'],
  ['stage5_source_package', 'source_inventory'],
  ['stage5_source_package', 'sources'],
  ['target_feature_profile_input', 'product_family_primary_sources'],
  ['target_feature_profile_input', 'product_family_secondary_sources'],
  ['target_feature_profile_input', 'product_family_supporting_sources'],
  ['target_feature_profile_input', 'source_bundle', 'evidence_buffer'],
  ['source_bundle', 'evidence_buffer'],
  ['sources'],
  ['source_inventory']
]);

export function buildStage5AProductFamilyInput(context = {}) {
  const targetProfile = resolveTargetProfile(context);
  const sources = collectProductFamilySources(context);
  const targetProfileRef = asText(context.target_profile_ref || targetProfile.target_profile_ref || targetProfile.company_domain || targetProfile.company_name);

  return {
    stage5a_input_version: 'stage5a_product_family_input_v1',
    target_profile_ref: targetProfileRef || null,
    target_profile: targetProfile,
    product_family_source_lossless: sources.map((source, index) => normalizeProductFamilySource(source, index)),
    source_refs: normalizeSourceRefs(sources.map((source, index) => source.source_id || source.id || `S5A_SRC_${String(index + 1).padStart(3, '0')}`)),
    input_policy: {
      lossless_source_package_required: true,
      truncation_allowed: false,
      summarization_allowed: false,
      deterministic_candidates_are_not_truth: true
    },
    limitations: sources.length ? [] : ['No product-family lossless sources were found for Stage 5A.']
  };
}

export function resolveTargetProfile(context = {}) {
  return asPlainObject(context.target_profile || context.company_profile || context.stage4_company_profile || context.targetProfile || context.target_feature_profile_input?.target_profile);
}

export function collectProductFamilySources(context = {}) {
  const collected = [];
  for (const path of SOURCE_LIST_PATHS) {
    const value = readPath(context, path);
    collected.push(...asArray(value));
  }
  const seen = new Set();
  return collected.filter((source, index) => {
    if (!source || typeof source !== 'object') return false;
    const key = asText(source.source_id || source.id || source.url || source.source_url || `idx:${index}`);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function normalizeProductFamilySource(source = {}, index = 0) {
  const obj = asPlainObject(source);
  const sourceId = asText(obj.source_id || obj.evidence_source_id || obj.id) || `S5A_SRC_${String(index + 1).padStart(3, '0')}`;
  const sourceUrl = asText(obj.source_url || obj.url || obj.href || obj.canonical_url);
  const title = asText(obj.title || obj.source_title || obj.label || sourceUrl || sourceId);
  const text = asText(obj.clean_text || obj.text || obj.markdown || obj.content || obj.body);
  return {
    source_id: sourceId,
    source_url: sourceUrl,
    title,
    family: classify5ASourceFamily(obj, sourceUrl, title),
    source_role: asText(obj.source_role || obj.role),
    clean_text: text,
    text_length: text.length,
    evidence_refs: asArray(obj.evidence_refs || obj.field_evidence_refs || obj.refs).map(asText).filter(Boolean),
    chunk_refs: asArray(obj.chunk_refs || obj.chunks).map((chunk, chunkIndex) => normalizeChunkRef(chunk, sourceId, chunkIndex)),
    raw: obj
  };
}

export function classify5ASourceFamily(source = {}, url = '', title = '') {
  const family = asText(source.family || source.source_family);
  if (family) return family;
  const haystack = `${url} ${title}`.toLowerCase();
  if (/docs|developer|api|sdk|reference/.test(haystack)) return 'docs_developer';
  if (/pricing|plans|enterprise|customers|case-stud/.test(haystack)) return 'commercial';
  if (/terms|privacy|legal|security|dpa|trust/.test(haystack)) return 'legal_governance';
  if (/product|platform|feature|solution|model|studio|api/.test(haystack)) return 'product';
  return 'product_family_unknown';
}

function normalizeChunkRef(chunk, sourceId, index) {
  if (typeof chunk === 'string') return chunk;
  const obj = asPlainObject(chunk);
  return asText(obj.chunk_id || obj.id || obj.ref) || `${sourceId}#chunk:${String(index + 1).padStart(3, '0')}`;
}

function readPath(obj, path) {
  let cursor = obj;
  for (const part of path) cursor = cursor?.[part];
  return cursor;
}
