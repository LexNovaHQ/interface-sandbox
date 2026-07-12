import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { compileFinalOutputHandoff } from "./compiler.js";

export const COMPILER_PHASE2G_RUNNER_STATUS = Object.freeze({
  runner: "normalized-compiler.runner",
  phase_owned_path: "src/phases/12-normalized-compiler",
  routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  route_id: "ROUTE.PHASE10.EXPOSURE_PROFILE",
  bucket_id: "2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS",
  delivery_mode: "DERIVED_ONLY",
  source_bucket_delivered: false,
  forensic_inputs_forbidden: true,
  dynamic_m11_batches_loaded_by_2g: true
});

export async function runCompilerPhase2G({ run, internalJobId = "NORMALIZED_COMPILER", contract, readArtifacts } = {}) {
  assertCallback(readArtifacts, "readArtifacts");
  if (!(contract?.reads || []).includes("phase_routing_manifest")) throw new Error("COMPILER_PHASE2G_MANIFEST_READ_MISSING");
  const routed = await readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId: contract.actor_id || contract.agent_id || "compiler" });
  const artifacts = routed.artifacts;
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  const output = compileFinalOutputHandoff({ run, artifacts });
  if (!output?.final_output_handoff || !output?.normalized_report_manifest) throw new Error("COMPILER_PHASE2G_OUTPUT_INCOMPLETE");
  return Object.freeze({ ok: true, output, phase_lock_status: "LOCKED_WITH_LIMITATIONS", phase2g_route_id: routed.route.route_id, phase2g_bucket_id: routed.route.bucket_id, phase2g_delivery_mode: routed.route.delivery_mode, artifacts_read: Object.keys(artifacts).sort() });
}

function assertRoutePacket(packet = {}, internalJobId) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("COMPILER_PHASE2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== internalJobId) throw new Error(`COMPILER_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.route_id !== "ROUTE.PHASE10.EXPOSURE_PROFILE") throw new Error(`COMPILER_PHASE2G_ROUTE_MISMATCH:${packet.route_id || "missing"}`);
  if (packet.delivery_mode !== "DERIVED_ONLY") throw new Error(`COMPILER_PHASE2G_DELIVERY_MODE_MISMATCH:${packet.delivery_mode || "missing"}`);
  if (packet.source_bucket_delivered !== false) throw new Error("COMPILER_PHASE2G_SOURCE_BUCKET_DELIVERED");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("COMPILER_PHASE2G_FORENSICS_INPUT_BOUNDARY_MISSING");
  if (!Array.isArray(packet.dynamic_inputs) || !packet.dynamic_inputs.includes("M11_BATCHES_FROM_EXPOSURE_ROUTE_PLAN")) throw new Error("COMPILER_PHASE2G_DYNAMIC_M11_BATCH_ROUTE_MISSING");
}

function assertCallback(fn, label) { if (typeof fn !== "function") throw new Error(`COMPILER_PHASE2G_RUNNER_MISSING_CALLBACK:${label}`); }
