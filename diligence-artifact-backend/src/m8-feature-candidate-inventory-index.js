import { buildFeatureCandidateInventory as buildCandidateInventory } from "./m8-feature-candidate-inventory.js";
import { FEATURE_CANDIDATE_INVENTORY_ARTIFACT, FEATURE_CANDIDATE_INVENTORY_MODE, FEATURE_CANDIDATE_INVENTORY_VERSION, FEATURE_CANDIDATE_INDEX_BOUNDARY } from "./m8-feature-candidate-index-boundary.js";

export function buildFeatureCandidateInventoryIndex(sourceArtifacts, options = {}) {
  const legacy = buildCandidateInventory(sourceArtifacts, options);
  const rawIndex = (legacy.raw_feature_hit_ledger || []).map(stripRawHit);
  const candidates = (legacy.candidates || []).map(stripCandidate);
  return {
    artifact_type: FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
    inventory_version: FEATURE_CANDIDATE_INVENTORY_VERSION,
    run_id: legacy.run_id || options.runId || null,
    derivation_mode: FEATURE_CANDIDATE_INVENTORY_MODE,
    source_families_indexed: legacy.source_families_read || legacy.source_families_indexed || [],
    raw_hit_count: rawIndex.length,
    canonical_candidate_count: candidates.length,
    raw_feature_hit_index: rawIndex,
    candidates,
    canonicalization_index: candidates.map((candidate) => ({ candidate_id: candidate.candidate_id, canonical_feature_key: candidate.canonical_feature_key, merged_raw_hit_ids: candidate.merged_raw_hit_ids || [] })),
    dedup_index: (legacy.dedup_merge_ledger || legacy.dedup_index || []).map((row) => ({ canonical_candidate_id: row.candidate_id || row.canonical_candidate_id, primary_raw_hit_id: row.primary_raw_hit_id, merged_raw_hit_id: row.merged_raw_hit_id, merge_basis: row.reason || row.merge_basis || "same_canonical_feature_key" })),
    parent_child_overlap_index: (legacy.parent_child_overlap_ledger || legacy.parent_child_overlap_index || []).map((row) => ({ parent_candidate_id: row.parent_candidate_id, child_candidate_id: row.child_candidate_id, overlap_basis: row.reason || row.overlap_basis || "possible_parent_child_overlap", required_treatment: row.required_treatment || "PRESERVE_BOTH_OR_CHILD_LINK" })),
    dedup_summary: legacy.dedup_summary || {},
    index_boundary: FEATURE_CANDIDATE_INDEX_BOUNDARY,
    index_limitations: legacy.index_limitations || []
  };
}

export function validateFeatureCandidateInventoryIndex(input) {
  const inventory = input?.feature_candidate_inventory || input;
  const failures = [];
  if (inventory?.artifact_type !== FEATURE_CANDIDATE_INVENTORY_ARTIFACT) failures.push("artifact_type must be feature_candidate_inventory");
  if (inventory?.derivation_mode !== FEATURE_CANDIDATE_INVENTORY_MODE) failures.push("inventory must be deterministic index-only mode");
  if (!Array.isArray(inventory?.candidates)) failures.push("candidates must be array");
  for (const candidate of inventory?.candidates || []) {
    if (!candidate.candidate_id || !candidate.canonical_feature_key) failures.push("candidate missing id/key");
    if (!Array.isArray(candidate.source_pointers) || !candidate.source_pointers.length) failures.push(`${candidate.candidate_id || "candidate"}:source_pointers_missing`);
  }
  if (containsEvidenceCopy(inventory)) failures.push("inventory contains evidence-copy fields");
  return { status: failures.length ? "FAIL" : "PASS", failures };
}

function stripCandidate(candidate) {
  return {
    candidate_id: candidate.candidate_id,
    canonical_feature_key: candidate.canonical_feature_key,
    candidate_name: candidate.candidate_name,
    candidate_type: candidate.candidate_type,
    candidate_status: candidate.candidate_status || "CANONICAL_CANDIDATE",
    wrapper_or_surface: candidate.wrapper_or_surface,
    capability_key: candidate.capability_key,
    surface_key: candidate.surface_key,
    mandatory_profile_treatment: candidate.mandatory_profile_treatment,
    merged_raw_hit_ids: candidate.merged_raw_hit_ids || [],
    source_pointers: (candidate.source_pointers || candidate.source_refs || []).map(toPointer)
  };
}

function stripRawHit(hit) {
  const pointer = toPointer(hit.source_pointer || hit.source_ref || hit);
  return { raw_hit_id: hit.raw_hit_id, source_family: hit.source_family, source_id: hit.source_id, source_url: hit.source_url, source_title_or_slug: hit.source_title_or_slug, raw_name: hit.raw_name, raw_type: hit.raw_type, wrapper_or_surface: hit.wrapper_or_surface, capability_key: hit.capability_key, surface_key: hit.surface_key, confidence_basis: hit.confidence_basis, mandatory_profile_treatment: hit.mandatory_profile_treatment, source_pointer: pointer };
}

function toPointer(ref) {
  const family = String(ref.source_family || ref.artifact_name || "").replace(/^lossless_family__/, "");
  return { lossless_artifact_name: ref.lossless_artifact_name || (family ? `lossless_family__${family}` : ""), source_family: family, source_id: ref.source_id || "", source_url: ref.source_url || "", route_type: ref.route_type || "", locator_type: ref.locator_type || inferLocatorType(ref), locator_value: ref.locator_value || inferLocatorValue(ref) };
}

function inferLocatorType(ref) { return ref.route_type ? "route_type" : ref.source_url ? "source_url" : "source_id"; }
function inferLocatorValue(ref) { return ref.route_type || slug(ref.source_url) || ref.source_id || ""; }
function slug(value) { try { return new URL(String(value || "")).pathname.split("/").filter(Boolean).at(-1) || ""; } catch { return ""; } }
function containsEvidenceCopy(value) { if (!value || typeof value !== "object") return false; if (Array.isArray(value)) return value.some(containsEvidenceCopy); return Object.keys(value).some((key) => ["excerpt", "lossless_text", "clean_text", "text", "mechanics_proof", "evidence_summary", "activity_candidate_summary", "archetype_proof", "surface_proof_and_routing_limits"].includes(key)) || Object.values(value).some(containsEvidenceCopy); }
