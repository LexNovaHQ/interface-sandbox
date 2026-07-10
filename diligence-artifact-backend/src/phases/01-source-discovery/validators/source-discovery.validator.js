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
    assertLockedRootManifest(output.source_family_index.root_artifact_manifest, output);
    assertMatrixRows(output.source_family_index.discovered_source_index || [], "source_family_index.discovered_source_index");
    assertMatrixRows([...(output.source_family_index.manifest_only_index || []), ...(output.source_family_index.metadata_only_index || [])], "source_family_index.index_rows");
    if (!Array.isArray(output.source_family_index.saved_root_artifacts)) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:saved_root_artifacts_index");
    if (!output.legal_doc_inventory) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:legal_doc_inventory");
    if (!output.legal_doc_extraction_index) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:legal_doc_extraction_index");
    if (!output.legal_doc_lossless_validation_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:legal_doc_lossless_validation_manifest");
    if (output.legal_doc_lossless_validation_manifest?.merged_legal_blob_detected !== false) throw new Error("SOURCE_DISCOVERY_LEGAL_DOC_MERGE_FORBIDDEN");
    assertLegalDocsIndependent(output);
  }
  if (job_id === "SOURCE_FAMILY_HANDOFF") {
    if (!output.source_discovery_handoff) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:source_discovery_handoff");
    if (!output.post_phase_1_domain_gate_handoff) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:post_phase_1_domain_gate_handoff");
    assertHandoffPropagation(output.source_discovery_handoff, output.post_phase_1_domain_gate_handoff);
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
  assertMatrixRows(manifest.manifest_sources || [], "deduped_url_manifest.manifest_sources");
}
function assertMatrixRows(rows = [], context) {
  for (const row of rows) {
    if (!COMMON_ROOT_CODES.includes(row.common_root)) throw new Error(`SOURCE_DISCOVERY_UNKNOWN_COMMON_ROOT:${context}:${row.common_root || "missing"}`);
    if (RETIRED_COMMON_ROOT_CODES.includes(row.common_root)) throw new Error(`SOURCE_DISCOVERY_RETIRED_COMMON_ROOT_FORBIDDEN:${context}:${row.common_root}`);
    if (row.root_traversal_policy !== ROOT_TRAVERSAL_POLICY[row.common_root]) throw new Error(`SOURCE_DISCOVERY_ROW_TRAVERSAL_POLICY_MISMATCH:${context}:${row.common_root}`);
    if (!Array.isArray(row.source_signal_roles)) throw new Error(`SOURCE_DISCOVERY_ROW_SIGNAL_ROLES_MISSING:${context}:${row.manifest_id || row.source_id || row.common_root}`);
    if (row.phase_1_classification_effect !== "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING") throw new Error(`SOURCE_DISCOVERY_ROW_CLASSIFICATION_EFFECT_INVALID:${context}:${row.manifest_id || row.source_id || row.common_root}`);
    if (row.common_root === "docs_api_data_flow" && row.admission_tier === "PRIMARY" && row.api_data_flow_signal?.present !== true) throw new Error(`SOURCE_DISCOVERY_DATA_FLOW_SIGNAL_MISSING:${context}:${row.manifest_id || row.source_id}`);
    if (row.common_root === "technical_docs_api" && row.admission_tier === "PRIMARY" && row.route_type !== "app_shell_metadata" && !row.technical_route_shape) throw new Error(`SOURCE_DISCOVERY_TECHNICAL_ROUTE_SHAPE_MISSING:${context}:${row.manifest_id || row.source_id}`);
  }
}
function assertLockedRootManifest(rootArtifactManifest = {}, output = {}) {
  const keys = Object.keys(rootArtifactManifest);
  for (const key of keys) if (!COMMON_ROOT_CODES.includes(key) || RETIRED_COMMON_ROOT_CODES.includes(key)) throw new Error(`SOURCE_DISCOVERY_ROOT_ARTIFACT_MANIFEST_INVALID_ROOT:${key}`);
  for (const code of COMMON_ROOT_CODES) if (!rootArtifactManifest[code]) throw new Error(`SOURCE_DISCOVERY_ROOT_ARTIFACT_MANIFEST_MISSING_ROOT:${code}`);
  for (const [root, entry] of Object.entries(rootArtifactManifest)) {
    if (entry.root_traversal_policy !== ROOT_TRAVERSAL_POLICY[root]) throw new Error(`SOURCE_DISCOVERY_ROOT_ARTIFACT_MANIFEST_POLICY_MISMATCH:${root}`);
    if (entry.source_text_cutting_allowed !== false) throw new Error(`SOURCE_DISCOVERY_ROOT_TEXT_CUTTING_FORBIDDEN:${root}`);
    if (entry.legal_documents_stored_separately !== true) throw new Error(`SOURCE_DISCOVERY_LEGAL_DOC_SEPARATION_FLAG_MISSING:${root}`);
    const required = Array.isArray(entry.required_artifacts) ? entry.required_artifacts : [];
    if (!entry.source_count && required.length) throw new Error(`SOURCE_DISCOVERY_EMPTY_ROOT_PHYSICALLY_SAVED:${root}`);
    if (entry.source_count > 0 && !required.length) throw new Error(`SOURCE_DISCOVERY_MATERIAL_ROOT_WITHOUT_PHYSICAL_ARTIFACT:${root}`);
    if (entry.status === "SHARDED" && (required.length < 2 || entry.root_sources_required_together !== true)) throw new Error(`SOURCE_DISCOVERY_SHARDED_ROOT_INTEGRITY_INVALID:${root}`);
    for (const name of required) {
      const artifact = output[name];
      if (!artifact) throw new Error(`SOURCE_DISCOVERY_ROOT_REQUIRED_ARTIFACT_NOT_EMITTED:${root}:${name}`);
      if (!Array.isArray(artifact.sources) || artifact.sources.length === 0) throw new Error(`SOURCE_DISCOVERY_SAVED_ROOT_WITHOUT_SOURCES:${name}`);
      if (artifact.root_shard_integrity?.source_text_cutting_allowed !== false) throw new Error(`SOURCE_DISCOVERY_SHARD_TEXT_CUTTING_FORBIDDEN:${name}`);
    }
    const listed = new Set(entry.source_ids || []);
    const found = new Map();
    for (const name of required) for (const source of output[name]?.sources || []) found.set(source.source_id, (found.get(source.source_id) || 0) + 1);
    for (const id of listed) if (found.get(id) !== 1) throw new Error(`SOURCE_DISCOVERY_ROOT_SOURCE_ID_NOT_EXACTLY_ONCE:${root}:${id || "missing"}`);
  }
}
function assertLegalDocsIndependent(output = {}) {
  const docs = output.legal_doc_inventory?.documents_found || [];
  for (const doc of docs) {
    const artifact = output[doc.artifact_name];
    if (!artifact || typeof artifact.lossless_text !== "string" || !artifact.lossless_text.trim()) throw new Error(`SOURCE_DISCOVERY_LEGAL_DOC_ARTIFACT_TEXT_MISSING:${doc.artifact_name || "missing"}`);
    for (const rootName of output.source_family_index?.saved_root_artifacts || []) for (const source of output[rootName]?.sources || []) if (source.canonical_url === doc.source_url && source.lossless_text) throw new Error(`SOURCE_DISCOVERY_LEGAL_DOC_TEXT_LEAKED_INTO_ROOT:${rootName}:${doc.artifact_name}`);
  }
}
function assertHandoffPropagation(handoff = {}, postHandoff = {}) {
  if (handoff.schema_version !== "PHASE1_SOURCE_DISCOVERY_HANDOFF_v2_FULL_ROOT_MATRIX") throw new Error(`SOURCE_DISCOVERY_HANDOFF_SCHEMA_STALE:${handoff.schema_version || "missing"}`);
  if (postHandoff.schema_version !== "POST_PHASE_1_DOMAIN_GATE_HANDOFF_v2_FULL_ROOT_MATRIX") throw new Error(`SOURCE_DISCOVERY_POST_HANDOFF_SCHEMA_STALE:${postHandoff.schema_version || "missing"}`);
  const contract = handoff.contract || {};
  for (const flag of ["full_15_root_classifier_matrix_preserved", "primary_full_extract_slug_chain_preserved", "source_signal_roles_preserved", "technical_route_shape_preserved", "api_data_flow_signal_preserved", "legal_doc_granularity_preserved"]) if (contract[flag] !== true) throw new Error(`SOURCE_DISCOVERY_HANDOFF_CONTRACT_FLAG_MISSING:${flag}`);
  for (const [root, entry] of Object.entries(handoff.common_root_index || {})) {
    if (!COMMON_ROOT_CODES.includes(root) || RETIRED_COMMON_ROOT_CODES.includes(root)) throw new Error(`SOURCE_DISCOVERY_HANDOFF_INVALID_ROOT:${root}`);
    if (entry.root_traversal_policy !== ROOT_TRAVERSAL_POLICY[root]) throw new Error(`SOURCE_DISCOVERY_HANDOFF_ROOT_POLICY_MISMATCH:${root}`);
    assertHandoffRows(entry.primary || [], `handoff.common_root_index.${root}.primary`);
    assertHandoffRows(entry.legal_documents || [], `handoff.common_root_index.${root}.legal_documents`);
    assertHandoffRows(entry.index_only || [], `handoff.common_root_index.${root}.index_only`, { allowNoSourceId: true });
  }
  const docs = handoff.legal_document_index?.documents_found || [];
  for (const doc of docs) {
    if (!doc.artifact_name || !doc.doc_type || !doc.source_url) throw new Error("SOURCE_DISCOVERY_HANDOFF_LEGAL_DOC_REF_INCOMPLETE");
    if (!Array.isArray(doc.source_signal_roles)) throw new Error(`SOURCE_DISCOVERY_HANDOFF_LEGAL_DOC_SIGNAL_ROLES_MISSING:${doc.artifact_name}`);
    if (doc.source_of_truth !== true) throw new Error(`SOURCE_DISCOVERY_HANDOFF_LEGAL_DOC_SOURCE_OF_TRUTH_MISSING:${doc.artifact_name}`);
  }
}
function assertHandoffRows(rows = [], context, options = {}) {
  for (const row of rows) {
    if (!options.allowNoSourceId && !row.source_id) throw new Error(`SOURCE_DISCOVERY_HANDOFF_ROW_SOURCE_ID_MISSING:${context}`);
    if (!row.common_root || !COMMON_ROOT_CODES.includes(row.common_root) || RETIRED_COMMON_ROOT_CODES.includes(row.common_root)) throw new Error(`SOURCE_DISCOVERY_HANDOFF_ROW_COMMON_ROOT_INVALID:${context}:${row.common_root || "missing"}`);
    if (row.root_traversal_policy !== ROOT_TRAVERSAL_POLICY[row.common_root]) throw new Error(`SOURCE_DISCOVERY_HANDOFF_ROW_POLICY_MISMATCH:${context}:${row.common_root}`);
    if (!row.admission_tier) throw new Error(`SOURCE_DISCOVERY_HANDOFF_ROW_ADMISSION_TIER_MISSING:${context}:${row.manifest_id || row.source_id || row.common_root}`);
    if (!row.extraction_decision) throw new Error(`SOURCE_DISCOVERY_HANDOFF_ROW_EXTRACTION_DECISION_MISSING:${context}:${row.manifest_id || row.source_id || row.common_root}`);
    if (!Array.isArray(row.source_signal_roles)) throw new Error(`SOURCE_DISCOVERY_HANDOFF_ROW_SIGNAL_ROLES_MISSING:${context}:${row.manifest_id || row.source_id || row.common_root}`);
    if (row.phase_1_classification_effect !== "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING") throw new Error(`SOURCE_DISCOVERY_HANDOFF_ROW_CLASSIFICATION_EFFECT_INVALID:${context}:${row.manifest_id || row.source_id || row.common_root}`);
    if (row.common_root === "docs_api_data_flow" && row.admission_tier === "PRIMARY" && row.api_data_flow_signal?.present !== true) throw new Error(`SOURCE_DISCOVERY_HANDOFF_DATA_FLOW_SIGNAL_MISSING:${context}:${row.manifest_id || row.source_id}`);
    if (row.common_root === "technical_docs_api" && row.admission_tier === "PRIMARY" && row.route_type !== "app_shell_metadata" && !row.technical_route_shape) throw new Error(`SOURCE_DISCOVERY_HANDOFF_TECHNICAL_ROUTE_SHAPE_MISSING:${context}:${row.manifest_id || row.source_id}`);
  }
}
function assertNoPhase1LockOrNarrowing(flags = {}, context) { if (flags.primary_domain_locked !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_LOCK_FORBIDDEN:${context}`); if (flags.source_discovery_narrowed !== false) throw new Error(`SOURCE_DISCOVERY_NARROWING_FORBIDDEN:${context}`); if (flags.sources_excluded_by_domain !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_EXCLUSION_FORBIDDEN:${context}`); if (flags.domain_specific_prompt_routing_used !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_PROMPT_ROUTING_FORBIDDEN:${context}`); if (flags.dynamic_routing_used !== false) throw new Error(`SOURCE_DISCOVERY_DYNAMIC_ROUTING_FORBIDDEN:${context}`); }
function assertNoLegacyFamilyArtifacts(output, jobId) { for (const name of Object.keys(output || {})) if (name.startsWith("lossless_family__")) throw new Error(`SOURCE_DISCOVERY_LEGACY_FAMILY_ARTIFACT_FORBIDDEN:${jobId}:${name}`); }
