/*
 * LexNova Runtime — Stage 5 Canonical Field Map
 * Declares final field ownership. No model calls. No live wiring.
 */

export const STAGE5_CANONICAL_TOP_LEVEL_FIELDS = Object.freeze([
  'feature_profile_version',
  'target_profile_ref',
  'feature_inventory',
  'product_feature_map',
  'data_provenance_map',
  'regulated_surface_map',
  'architecture_hints',
  'commercial_scan',
  'vault_feature_candidates',
  'evidence',
  'limitations',
  'unresolved_feature_candidates',
  'classification_quality'
]);

export const STAGE5_FEATURE_INVENTORY_FIELDS = Object.freeze([
  'feature_id',
  'feature_name',
  'feature_role',
  'commercial_function',
  'business_label_or_product_area',
  'feature_description',
  'actor_or_user',
  'input_data',
  'system_action',
  'output_or_result',
  'autonomy_level',
  'human_review_signal',
  'external_action_signal',
  'delivery_channels',
  'data_provenance',
  'archetype_codes',
  'archetype_labels',
  'archetype_provenance',
  'surface_tokens',
  'surface_provenance',
  'confidence',
  'feature_source_url',
  'evidence_refs',
  'linked_threat_ids'
]);

export const STAGE5_FIELD_OWNERS = Object.freeze({
  feature_profile_version: '5E',
  target_profile_ref: '5E',
  feature_inventory: '5C',
  product_feature_map: '5E',
  data_provenance_map: '5E',
  regulated_surface_map: '5E',
  architecture_hints: '5E',
  commercial_scan: '5E',
  vault_feature_candidates: '5E',
  evidence: '5E',
  limitations: '5E',
  unresolved_feature_candidates: '5E',
  classification_quality: '5E',
  feature_id: '5C',
  feature_name: '5C',
  feature_role: '5C',
  commercial_function: '5C',
  business_label_or_product_area: '5C',
  feature_description: '5C',
  actor_or_user: '5C',
  input_data: '5C',
  system_action: '5C',
  output_or_result: '5C',
  autonomy_level: '5C',
  human_review_signal: '5C',
  external_action_signal: '5C',
  delivery_channels: '5C',
  data_provenance: '5C',
  archetype_codes: '5C',
  archetype_labels: '5C',
  archetype_provenance: '5C',
  surface_tokens: '5C',
  surface_provenance: '5C',
  confidence: '5C',
  feature_source_url: '5C',
  evidence_refs: '5C',
  linked_threat_ids: '5C'
});

export const STAGE5_FIELD_CONTRIBUTORS = Object.freeze({
  feature_inventory: ['5A', '5B', '5C', '5D'],
  data_provenance_map: ['5D', '5E'],
  regulated_surface_map: ['5B', '5D', '5E'],
  architecture_hints: ['5A', '5D', '5E'],
  commercial_scan: ['SOURCE_MANIFEST', '5A', '5E'],
  vault_feature_candidates: ['5C', '5D', '5E'],
  evidence: ['5A', '5B', '5D', '5E'],
  limitations: ['5A', '5B', '5C', '5D', '5E'],
  unresolved_feature_candidates: ['5A', '5B', '5C', '5E'],
  classification_quality: ['5A_VALIDATION', '5B_VALIDATION', '5C_VALIDATION', '5D_VALIDATION', '5E_VALIDATION'],
  feature_name: ['5A'],
  feature_role: ['5A'],
  commercial_function: ['5A'],
  business_label_or_product_area: ['5A', 'SOURCE_MANIFEST'],
  feature_description: ['5A'],
  actor_or_user: ['5A'],
  input_data: ['5A', '5D'],
  system_action: ['5A'],
  output_or_result: ['5A'],
  autonomy_level: ['5B'],
  human_review_signal: ['5B'],
  external_action_signal: ['5B'],
  delivery_channels: ['SOURCE_MANIFEST', '5A'],
  data_provenance: ['5D'],
  archetype_codes: ['5B'],
  archetype_labels: ['5B_TAXONOMY'],
  archetype_provenance: ['5B'],
  surface_tokens: ['5B'],
  surface_provenance: ['5B'],
  confidence: ['5A', '5B', '5D', 'VALIDATORS'],
  feature_source_url: ['5A'],
  evidence_refs: ['5A', '5B', '5D'],
  linked_threat_ids: []
});

export const STAGE5_FIELD_REQUIREDNESS = Object.freeze(Object.fromEntries(
  [...STAGE5_CANONICAL_TOP_LEVEL_FIELDS, ...STAGE5_FEATURE_INVENTORY_FIELDS].map((field) => [field, 'REQUIRED'])
));

export function assertStage5FieldOwnershipComplete(schemaFields = []) {
  const fields = schemaFields.length ? schemaFields : [...STAGE5_CANONICAL_TOP_LEVEL_FIELDS, ...STAGE5_FEATURE_INVENTORY_FIELDS];
  const missing = fields.filter((field) => !STAGE5_FIELD_OWNERS[field]);
  return { ok: missing.length === 0, missing_fields: missing, checked_fields: fields.length };
}
