import { SOURCE_DISCOVERY_CONTRACT } from "../source-discovery.contract.js";

export function assertSourceDiscoveryBoundary({ job_id, output } = {}) {
  if (!SOURCE_DISCOVERY_CONTRACT.jobs[job_id]) throw new Error(`SOURCE_DISCOVERY_BOUNDARY_INVALID_JOB:${job_id || "missing"}`);
  if (!output || typeof output !== "object" || Array.isArray(output)) throw new Error(`SOURCE_DISCOVERY_BOUNDARY_INVALID_OUTPUT:${job_id}`);
  if (job_id === "URL_MANIFEST") {
    if (!output.deduped_url_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:deduped_url_manifest");
    if (!output.source_discovery_matrix_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:source_discovery_matrix_manifest");
    if (!output.neutral_evidence_bucket_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:neutral_evidence_bucket_manifest");
    if (!output.adapter_expansion_log) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:adapter_expansion_log");
    assertNoPhase1LockOrNarrowing(output.source_discovery_matrix_manifest?.forbidden_actions_confirmed, "source_discovery_matrix_manifest");
    assertNoPhase1LockOrNarrowing(output.neutral_evidence_bucket_manifest?.forbidden_actions_confirmed, "neutral_evidence_bucket_manifest");
    if (output.adapter_expansion_log?.dynamic_routing_used !== false) throw new Error("SOURCE_DISCOVERY_ADAPTER_DYNAMIC_ROUTING_FORBIDDEN");
    if (output.adapter_expansion_log?.domain_lock_used !== false) throw new Error("SOURCE_DISCOVERY_ADAPTER_DOMAIN_LOCK_FORBIDDEN");
  }
  if (job_id === "SOURCE_EXTRACTION") {
    if (!output.source_family_index) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:source_family_index");
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

export function assertNoSourceDiscoveryModelUsage({ job_id, model_metadata } = {}) {
  if (model_metadata) throw new Error(`SOURCE_DISCOVERY_MODEL_USAGE_FORBIDDEN:${job_id || "missing"}`);
  return { ok: true, model_usage: "NONE" };
}

function assertNoPhase1LockOrNarrowing(flags = {}, context) {
  if (flags.primary_domain_locked !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_LOCK_FORBIDDEN:${context}`);
  if (flags.source_discovery_narrowed !== false) throw new Error(`SOURCE_DISCOVERY_NARROWING_FORBIDDEN:${context}`);
  if (flags.sources_excluded_by_domain !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_EXCLUSION_FORBIDDEN:${context}`);
  if (flags.domain_specific_prompt_routing_used !== false) throw new Error(`SOURCE_DISCOVERY_DOMAIN_PROMPT_ROUTING_FORBIDDEN:${context}`);
  if (flags.dynamic_routing_used !== false) throw new Error(`SOURCE_DISCOVERY_DYNAMIC_ROUTING_FORBIDDEN:${context}`);
}
