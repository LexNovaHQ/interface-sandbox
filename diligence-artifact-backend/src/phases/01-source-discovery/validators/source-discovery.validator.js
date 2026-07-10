import { SOURCE_DISCOVERY_CONTRACT } from "../source-discovery.contract.js";
import { COMMON_ROOT_CODES, RETIRED_COMMON_ROOT_CODES, ROOT_TRAVERSAL_POLICY } from "../services/source-discovery-taxonomy.service.js";

export function assertSourceDiscoveryBoundary({ job_id, output } = {}) {
  if (!SOURCE_DISCOVERY_CONTRACT.jobs[job_id]) throw new Error(`SOURCE_DISCOVERY_BOUNDARY_INVALID_JOB:${job_id || "missing"}`);
  if (!output || typeof output !== "object" || Array.isArray(output)) throw new Error(`SOURCE_DISCOVERY_BOUNDARY_INVALID_OUTPUT:${job_id}`);
  assertNoLegacyFamilyArtifacts(output, job_id);
  if (job_id === "URL_MANIFEST") {
    if (!output.deduped_url_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:deduped_url_manifest");
    if (!output.source_discovery_matrix_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:source_discovery_matrix_manifest");
    if (!output.neutral_evidence_bucket_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:neutral_evidence_bucket_manifest");
    if (!output.adapter_expansion_log) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:adapter_expansion_log");
    assertNoPhase1LockOrNarrowing(output.source_discovery_matrix_manifest?.forbidden_actions_confirmed, "source_discovery_matrix_manifest");
    assertNoPhase1LockOrNarrowing(output.neutral_evidence_bucket_manifest?.forbidden_actions_confirmed, "neutral_evidence_bucket_manifest");
    if ((output.deduped_url_manifest.manifest_sources || []).some((row) => row.root_family || row.bucket)) throw new Error("SOURCE_DISCOVERY_LEGACY_ROW_TAXONOMY_FORBIDDEN");
    assertLockedRootMatrix(output.deduped_url_manifest, output.source_discovery_matrix_manifest);
    if (output.adapter_expansion_log?.dynamic_routing_used !== false) throw new Error("SOURCE_DISCOVERY_ADAPTER_DYNAMIC_ROUTING_FORBIDDEN");
    if (output.adapter_expansion_log?.domain_lock_used !== false) throw new Error("SOURCE_DISCOVERY_ADAPTER_DOMAIN_LOCK_FORBIDDEN");
  }
  if (job_id === "SOURCE_EXTRACTION") {
    if (!output.source_family_index) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:source_family_index");
    if (!output.source_family_index.root_artifact_manifest || typeof output.source_family_index.root_artifact_manifest !== "object" || Array.isArray(output.source_family_index.root_artifact_manifest)) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:root_artifact_manifest");
    assertLockedRootManifest(output.source_family_index.root_artifact_manifest);
    if (!Array.isArray(output.source_family_index.saved_root_artifacts)) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:saved_root_artifacts_index");
    if (!output.legal_doc_inventory) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:legal_doc_inventory");
    if (!output.legal_doc_extraction_index) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:legal_doc_extraction_index");
    if (!output.legal_doc_lossless_validation_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:legal_doc_lossless_validation_manifest");
    if (output.legal_doc_lossless_validation_manifest?.merged_legal_blob_detected !== false) throw new Error("SOURCE_DISCOVERY_LEGAL_DOC_MERGE_FORBIDDEN");
  }
  if (job_id === "SOURCE_FAMILY_HANDOFF") {
    if (!output.source_discovery_handoff) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:source_discovery_handoff");
    if (!output.post_phase_1_domain_gate_handoff) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:post_phase_1_domain_gate_handoff");
    if (output.post_phase_1_domain_gate_handoff?.domain_lock_allowed_before_this_handoff !== false) throw new Error("SOURCE_DISCOVERY_PRE_HANDOFF_DOMAIN_LOCK_FORBIDDEN");
  }
  return { ok: true, job_id, phase_id: SOURCE_DISCOVERY_CONTRACT.phase_id };
}

export function assertNoSourceDiscoveryModelUsage({ job_id, model_metadata } = {}) { if (model_metadata) throw new Error(`SOURCE_DISCOVERY_MODEL_USAGE_FORBIDDEN:${job_id || "missing"}`); return { ok: true, model_usage: "NONE" }; }
function assertLockedRootMatrix(manifest = {}, matrix = {}) {
  const matrixRoots = matrix.common_core_roots || [];
  const ids = matrixRoots.map((root) => root.id);
  if (ids.length !== COMMON_ROOT_CODES.length || COMMON_ROOT_CODES.some((code) => !ids.includes(code))) throw new Error("SOURCE_DISCOVERY_LOCKED_ROOT_MATRIX_INCOMPLETE");
  for (const root of matrixRoots) if (root.traversal_policy !== ROOT_TRAVERSAL_POLICY[root.id]) throw new Error(`SOURCE_DISCOVERY_ROOT_TRAVERSAL_POLICY_MISMATCH:${root.id}`);
  for (const row of manifest.manifest_sources || []) {
    if (!COMMON_ROOT_CODES.includes(row.common_root)) throw new Error(`SOURCE_DISCOVERY_UNKNOWN_COMMON_ROOT:${row.common_root || "missing"}`);
    if (RETIRED_COMMON_ROOT_CODES.includes(row.common_root)) throw new Error(`SOURCE_DISCOVERY_RETIRED_COMMON_ROOT_FORBIDDEN:${row.common_root}`);
    if (row.root_traversal_policy !== ROOT_TRAVERSAL_POLICY[row.common_root]) throw new Error(`SOURCE_DISCOVERY_ROW_TRAVERSAL_POLICY_MISMATCH:${row.common_root}`);
    if (!Array.isArray(row.source_signal_roles)) throw new Error(`SOURCE_DISCOVERY_ROW_SIGNAL_ROLES_MISSING:${row.manifest_id || row.common_root}`);
    if (row.phase_1_classification_effect !== "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING") throw new Error(`SOURCE_DISCOVERY_ROW_CLASSIFICATION_EFFECT_INVALID:${row.manifest_id || row.common_root}`);
  }
}
function assertLockedRootManifest(rootArtifactManifest = {}) {
  const keys = Object.keys(rootArtifactManifest);
  for (const key of keys) if (!COMMON_ROOT_CODES.includes(key) || RETIRED_COMMON_ROOT_CODES.includes(key)) throw new Error(`SOURCE_DISCOVERY_ROOT_ARTIFACT_MANIFEST_INVALID_ROOT:${key}`);
  for (const code of COMMON_ROOT_CODES) if (!rootArtifactManifest[code]) throw new Error(`SOURCE_DISCOVERY_ROOT_ARTIFACT_MANIFEST_MISSING_ROOT:${code}`);
}
function assertNoPhase1LockOrNarrowing(flags = {}, context) { if (flags.primary_domain_locked !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_LOCK_FORBIDDEN:${context}`); if (flags.source_discovery_narrowed !== false) throw new Error(`SOURCE_DISCOVERY_NARROWING_FORBIDDEN:${context}`); if (flags.sources_excluded_by_domain !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_EXCLUSION_FORBIDDEN:${context}`); if (flags.domain_specific_prompt_routing_used !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_PROMPT_ROUTING_FORBIDDEN:${context}`); if (flags.dynamic_routing_used !== false) throw new Error(`SOURCE_DISCOVERY_DYNAMIC_ROUTING_FORBIDDEN:${context}`); }
function assertNoLegacyFamilyArtifacts(output, jobId) { for (const name of Object.keys(output || {})) if (name.startsWith("lossless_family__")) throw new Error(`SOURCE_DISCOVERY_LEGACY_FAMILY_ARTIFACT_FORBIDDEN:${jobId}:${name}`); }
