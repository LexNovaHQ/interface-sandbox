import { buildStage5CandidateManifestV2 } from "./stage5CandidateManifestV2.js";
import { buildStage5ProductFamilyManifestV2 } from "./stage5ProductFamilyManifestV2.js";

const DEFAULT_MIN_FAMILIES_FOR_SCOPED_RUN = 2;

function clone(value) { return JSON.parse(JSON.stringify(value || {})); }
function asArray(value) { return Array.isArray(value) ? value : []; }
function asString(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() || fallback;
}
function sourceId(source = {}) { return asString(source.evidence_source_id || source.source_id); }
function filterBySourceIds(items = [], sourceIds = new Set()) {
  return asArray(items).filter((item) => sourceIds.has(sourceId(item)) || sourceIds.has(asString(item.source_id)) || sourceIds.has(asString(item.evidence_source_id)));
}
function filterCitationManifest(items = [], sourceIds = new Set()) {
  return asArray(items).filter((item) => sourceIds.has(asString(item.evidence_source_id || item.source_id)));
}
function summarizeManifest(manifest = {}) {
  return {
    product_family_manifest_version: manifest.product_family_manifest_version || "stage5_product_family_manifest_v2",
    product_family_count: manifest.product_family_count || 0,
    uncapped_product_family_count: manifest.uncapped_product_family_count || 0,
    max_product_family_packets: manifest.max_product_family_packets || null,
    manifest_warnings: asArray(manifest.manifest_warnings),
    product_family_index: asArray(manifest.product_families).map((family) => ({
      product_family_id: family.product_family_id,
      product_family_name: family.product_family_name,
      family_type: family.family_type,
      source_count: family.source_count,
      lossless_char_count: family.lossless_char_count,
      candidate_summary: family.candidate_summary
    }))
  };
}
function estimateChars(evidenceBuffer = []) {
  return asArray(evidenceBuffer).reduce((sum, source) => sum + asString(source.clean_text_lossless).length, 0);
}
function candidateMatchesFamily(candidate = {}, sourceIds = new Set()) {
  return sourceIds.has(asString(candidate.source_id || candidate.evidence_source_id));
}
function makeFamilyInput(baseInput = {}, family = {}, manifest = {}) {
  const input = clone(baseInput);
  const sourceIds = new Set(asArray(family.source_ids).map(asString).filter(Boolean));
  const candidates = asArray(family.candidates).filter((candidate) => candidateMatchesFamily(candidate, sourceIds));
  const evidenceBuffer = filterBySourceIds(input.source_bundle?.evidence_buffer, sourceIds);
  const artifactInventory = filterBySourceIds(input.source_bundle?.artifact_inventory, sourceIds);
  const sourceCitationManifest = filterCitationManifest(input.source_bundle?.source_citation_manifest, sourceIds);
  const evidenceRefManifest = filterCitationManifest(input.source_bundle?.evidence_ref_manifest, sourceIds);

  input.stage5_execution_mode = "stage5_product_family_scoped_lossless_classification";
  input.stage5_product_family_packet = {
    packet_version: "stage5_product_family_lossless_packet_v1",
    product_family_id: family.product_family_id,
    product_family_name: family.product_family_name,
    family_type: family.family_type,
    investigation_order: "complete this family before moving to the next family",
    output_scope: "Return feature_profile_v2 for this product family only.",
    source_ids: asArray(family.source_ids),
    source_urls: asArray(family.source_urls),
    source_manifest: asArray(family.source_manifest),
    candidate_summary: family.candidate_summary || {},
    deterministic_prefill: family.deterministic_prefill || {},
    lossless_source_policy: {
      product_family_sources_only: true,
      source_text_is_lossless: true,
      summarized: false,
      compressed: false,
      snippet_selected: false,
      legal_governance_sources_excluded: true
    }
  };

  input.stage5_product_family_manifest_v2 = summarizeManifest(manifest);
  input.current_product_family_candidates = candidates;
  input.target_feature_candidate_index = {
    ...(input.target_feature_candidate_index || {}),
    index_version: "stage5_feature_candidate_index_v1_product_family_scoped",
    candidate_count: candidates.length,
    candidates,
    candidate_clusters: asArray(input.target_feature_candidate_index?.candidate_clusters).filter((cluster) => asArray(cluster?.candidate_ids).some((id) => candidates.some((candidate) => candidate.source_candidate_id === id || candidate.candidate_id === id)))
  };
  input.target_feature_candidate_manifest_v2 = buildStage5CandidateManifestV2(input);

  input.source_bundle = {
    ...(input.source_bundle || {}),
    artifact_inventory: artifactInventory,
    source_citation_manifest: sourceCitationManifest,
    evidence_ref_manifest: evidenceRefManifest,
    evidence_buffer: evidenceBuffer,
    source_review: {
      ...(input.source_bundle?.source_review || {}),
      packet_scope: "stage5_product_family_lossless_packet",
      product_family_id: family.product_family_id,
      product_family_name: family.product_family_name,
      product_family_source_count: evidenceBuffer.length,
      product_family_lossless_chars: estimateChars(evidenceBuffer),
      product_family_candidate_count: candidates.length,
      family_scoped_classification: true,
      legal_governance_sources_excluded: true,
      no_snippet_selection: true
    }
  };

  const estimatedInputChars = estimateChars(evidenceBuffer);
  input.input_budget = {
    ...(input.input_budget || {}),
    product_family_scoped: true,
    full_packet_estimated_input_chars_before_family_scoping: input.input_budget?.estimated_input_chars || null,
    estimated_input_chars: estimatedInputChars,
    included_sources: artifactInventory,
    total_packet_sources: evidenceBuffer.length,
    text_truncated: false,
    text_summarized: false,
    text_compressed: false,
    snippet_selected: false
  };

  input.adapter_policy = {
    ...(input.adapter_policy || {}),
    product_family_scoped_lossless_classification: true,
    product_family_model_calls_capped: true,
    deterministic_field_prefill_required: true,
    final_merge_required: true,
    model_input_uses_current_product_family_sources: true,
    no_random_snippets: true
  };
  return input;
}
function familyIsClassifiable(family = {}) {
  const summary = family.candidate_summary || {};
  return Number(summary.atomic_feature_candidate || 0) > 0 || Number(summary.product_area || 0) > 0 || Number(summary.delivery_channel_signal || 0) > 0;
}
export function buildStage5ProductFamilyPackets(stage5Input = {}, options = {}) {
  const manifest = buildStage5ProductFamilyManifestV2(stage5Input, options);
  const minFamilies = Number(options.minFamiliesForScopedRun || DEFAULT_MIN_FAMILIES_FOR_SCOPED_RUN) || DEFAULT_MIN_FAMILIES_FOR_SCOPED_RUN;
  const families = asArray(manifest.product_families).filter(familyIsClassifiable);
  const enabled = families.length >= minFamilies;
  const familyInputs = enabled ? families.map((family) => ({
    product_family_id: family.product_family_id,
    product_family_name: family.product_family_name,
    family_type: family.family_type,
    source_count: family.source_count,
    candidate_summary: family.candidate_summary,
    estimated_input_chars: family.lossless_char_count,
    input: makeFamilyInput(stage5Input, family, manifest)
  })) : [];
  return {
    packet_plan_version: "stage5_product_family_packet_plan_v1",
    enabled,
    disabled_reason: enabled ? null : `requires_at_least_${minFamilies}_classifiable_product_families`,
    manifest,
    family_inputs: familyInputs,
    input_size_report: {
      full_input_chars: Number(stage5Input?.input_budget?.estimated_input_chars || 0),
      family_packet_count: familyInputs.length,
      family_packet_chars: familyInputs.map((packet) => ({ product_family_id: packet.product_family_id, product_family_name: packet.product_family_name, estimated_input_chars: packet.estimated_input_chars })),
      total_family_packet_chars: familyInputs.reduce((sum, packet) => sum + Number(packet.estimated_input_chars || 0), 0),
      no_snippet_selection: true,
      lossless_family_sources: true
    }
  };
}
