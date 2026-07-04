import { SOURCE_DISCOVERY_CONTRACT } from "../source-discovery.contract.js";

export function assertSourceDiscoveryBoundary({ job_id, output } = {}) {
  if (!SOURCE_DISCOVERY_CONTRACT.jobs[job_id]) throw new Error(`SOURCE_DISCOVERY_BOUNDARY_INVALID_JOB:${job_id || "missing"}`);
  if (!output || typeof output !== "object" || Array.isArray(output)) throw new Error(`SOURCE_DISCOVERY_BOUNDARY_INVALID_OUTPUT:${job_id}`);
  if (job_id === "URL_MANIFEST" && !output.deduped_url_manifest) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:deduped_url_manifest");
  if (job_id === "SOURCE_EXTRACTION" && !output.source_family_index) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:source_family_index");
  if (job_id === "SOURCE_FAMILY_HANDOFF" && !output.source_discovery_handoff) throw new Error("SOURCE_DISCOVERY_OUTPUT_MISSING:source_discovery_handoff");
  return { ok: true, job_id, phase_id: SOURCE_DISCOVERY_CONTRACT.phase_id };
}

export function assertNoSourceDiscoveryModelUsage({ job_id, model_metadata } = {}) {
  if (model_metadata) throw new Error(`SOURCE_DISCOVERY_MODEL_USAGE_FORBIDDEN:${job_id || "missing"}`);
  return { ok: true, model_usage: "NONE" };
}
