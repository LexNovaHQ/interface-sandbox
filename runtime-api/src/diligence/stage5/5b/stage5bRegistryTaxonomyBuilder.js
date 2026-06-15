/* LexNova Runtime — Stage 5B Registry Taxonomy Builder. No model calls. No live wiring. */

import { asArray, asPlainObject, asText, uniqueStrings } from '../shared/stage5SharedIndex.js';

export async function buildStage5BTaxonomySlice({ registryKey, ports } = {}) {
  const loaded = registryKey || await ports?.registry?.loadRegistryKey?.();
  const key = asPlainObject(loaded);
  const vocabularies = asPlainObject(key.vocabularies || key.key?.vocabularies);
  const threatSchema = asPlainObject(key.threat_id_schema || key.key?.threat_id_schema);

  const archetypeMap = asPlainObject(vocabularies.archetypes);
  const surfaceMap = asPlainObject(vocabularies.surfaces);
  const subcatMap = asPlainObject(vocabularies.subcats);

  const archetypeCodes = uniqueStrings([
    ...asArray(threatSchema.archetype_codes),
    ...Object.keys(archetypeMap)
  ]);

  const surfaceTokens = uniqueStrings(Object.keys(surfaceMap));
  const subcatCodes = uniqueStrings([
    ...asArray(threatSchema.subcat_codes),
    ...Object.keys(subcatMap)
  ]);

  return {
    stage5b_taxonomy_version: 'stage5b_taxonomy_v1',
    taxonomy_status: archetypeCodes.length && surfaceTokens.length ? 'READY' : 'MISSING_REGISTRY_TAXONOMY',
    archetype_codes: archetypeCodes,
    archetype_labels: buildArchetypeLabels(archetypeCodes, archetypeMap),
    archetype_definitions: buildDefinitionRows(archetypeCodes, archetypeMap),
    surface_tokens: surfaceTokens,
    surface_definitions: buildSurfaceRows(surfaceTokens, surfaceMap),
    subcat_codes: subcatCodes,
    negative_controls: [
      'Do not invent archetype codes.',
      'Do not invent surface tokens.',
      'Do not assign registry threat IDs in Stage 5B.',
      'Do not delete a Stage 5A product function.',
      'If tagging is not supportable, emit TAGGING_FAILURE.'
    ],
    routing_rules: [
      'Every Stage 5A feature must receive one Stage 5B row.',
      'Primary archetype is required when tagging_status is TAGGED.',
      'Secondary archetypes require independent evidence.'
    ],
    taxonomy_source_refs: key.source_file?.filename ? [key.source_file.filename] : []
  };
}

function buildArchetypeLabels(codes, archetypeMap) {
  return Object.fromEntries(codes.map((code) => [code, asText(archetypeMap?.[code]?.archetype) || code]));
}

function buildDefinitionRows(codes, archetypeMap) {
  return codes.map((code) => ({
    code,
    label: asText(archetypeMap?.[code]?.archetype) || code,
    detection_logic: asText(archetypeMap?.[code]?.detection_logic),
    examples: asText(archetypeMap?.[code]?.examples),
    legacy: asText(archetypeMap?.[code]?.legacy)
  }));
}

function buildSurfaceRows(tokens, surfaceMap) {
  return tokens.map((token) => ({
    token,
    meaning: asText(surfaceMap?.[token]?.meaning)
  }));
}

export function validateStage5BTaxonomySlice(taxonomySlice = {}) {
  const errors = [];
  if (!asArray(taxonomySlice.archetype_codes).length) errors.push('Stage 5B taxonomy has no archetype codes.');
  if (!asArray(taxonomySlice.surface_tokens).length) errors.push('Stage 5B taxonomy has no surface tokens.');
  return {
    ok: errors.length === 0,
    errors,
    archetype_count: asArray(taxonomySlice.archetype_codes).length,
    surface_count: asArray(taxonomySlice.surface_tokens).length
  };
}
