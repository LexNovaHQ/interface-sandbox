import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { buildOperatorChallengeInventory } from "./operator-challenge-inventory.js";

export const M12_PHASE2G_RUNNER_STATUS = Object.freeze({
  runner: "operator-challenge.runner",
  phase_owned_path: "src/phases/11-operator-challenge",
  routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  route_id: "ROUTE.PHASE10.EXPOSURE_PROFILE",
  bucket_id: "2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS",
  delivery_mode: "DERIVED_ONLY",
  source_bucket_delivered: false,
  forensic_inputs_forbidden: true,
  dynamic_m11_batches_loaded_by_2g: true,
  layer1_status: "PHASE11_LAYER1_DETERMINISTIC_CROSS_PHASE_INVENTORY_ACTIVE",
  layer2_status: "PENDING_SEMANTIC_ADVERSARIAL_CHALLENGE",
  layer3_status: "PENDING_DETERMINISTIC_ADJUDICATION_REINVESTIGATION_GATE"
});

export async function runM12Phase2GChallenge({ run, internalJobId = "M12", contract, readArtifacts } = {}) {
  assertCallback(readArtifacts, "readArtifacts");
  if (!(contract?.reads || []).includes("phase_routing_manifest")) throw new Error("M12_PHASE2G_MANIFEST_READ_MISSING");
  const routed = await readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId: contract.actor_id || contract.agent_id || "agent_7_m12" });
  const artifacts = routed.artifacts;
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);

  const inventoryOutput = buildOperatorChallengeInventory({ run, artifacts });
  const inventory = inventoryOutput.operator_challenge_inventory;
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) throw new Error("PHASE11_LAYER1_INVENTORY_MISSING");

  const challengeGateStagingEnvelope = {
    schema_version: "challenge_gate.phase11_layer1_staging.v1",
    status: "CREATED",
    gate: "LAYER1_COMPLETE_LAYER2_LAYER3_PENDING",
    generated_by: "phase11_layer1_deterministic_inventory_runner",
    run_id: run?.run_id || "",
    delivery_mode: "DERIVED_ONLY",
    forensic_inputs_used: false,
    blocking_decision_made: false,
    reinvestigation_decision_made: false,
    operator_challenge_inventory: inventory,
    layer_status: {
      layer_1: "COMPLETE",
      layer_2: "PENDING",
      layer_3: "PENDING"
    },
    next_required_layer: "PHASE11_LAYER2_SEMANTIC_ADVERSARIAL_CHALLENGE",
    compiler_handoff_allowed: false
  };

  return Object.freeze({
    ok: true,
    output: { challenge_gate: challengeGateStagingEnvelope },
    phase_lock_status: "CREATED",
    phase2g_route_id: routed.route.route_id,
    phase2g_bucket_id: routed.route.bucket_id,
    phase2g_delivery_mode: routed.route.delivery_mode,
    artifacts_read: Object.keys(artifacts).sort(),
    layer1_inventory_fingerprint: inventory.inventory_fingerprint
  });
}

function assertRoutePacket(packet = {}, internalJobId) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("M12_PHASE2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== internalJobId) throw new Error(`M12_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.route_id !== "ROUTE.PHASE10.EXPOSURE_PROFILE") throw new Error(`M12_PHASE2G_ROUTE_MISMATCH:${packet.route_id || "missing"}`);
  if (packet.delivery_mode !== "DERIVED_ONLY") throw new Error(`M12_PHASE2G_DELIVERY_MODE_MISMATCH:${packet.delivery_mode || "missing"}`);
  if (packet.source_bucket_delivered !== false) throw new Error("M12_PHASE2G_SOURCE_BUCKET_DELIVERED");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("M12_PHASE2G_FORENSICS_INPUT_BOUNDARY_MISSING");
  if (!Array.isArray(packet.dynamic_inputs) || !packet.dynamic_inputs.includes("M11_BATCHES_FROM_EXPOSURE_ROUTE_PLAN")) throw new Error("M12_PHASE2G_DYNAMIC_M11_BATCH_ROUTE_MISSING");
}

function assertCallback(fn, label) { if (typeof fn !== "function") throw new Error(`M12_PHASE2G_RUNNER_MISSING_CALLBACK:${label}`); }
