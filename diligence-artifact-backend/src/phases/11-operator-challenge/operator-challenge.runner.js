import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { buildPhasePrompt } from "../../runtime/services/prompts.service.js";
import { callProviderJson } from "../../runtime/services/provider.service.js";
import { saveRuntimeArtifact } from "../../runtime/services/artifacts.service.js";
import { buildOperatorChallengeInventory } from "./operator-challenge-inventory.js";
import { buildOperatorChallengeSemanticPacket, validateOperatorChallengeSemanticLedger, buildOperatorChallengeSemanticFallbackLedger } from "./operator-challenge-semantic.js";
import { buildOperatorChallengeLayer3 } from "./operator-challenge-adjudication.js";
import { executePhase11ReinvestigationLoop } from "./operator-challenge-dispatch.runtime.js";
import { callPhase11WithTechnicalRetry } from "./operator-challenge-technical-retry.js";

const AGENT = "agent_7_m12";
const LAYER2_PROMPT = "agent-packages/agent_7_operator_challenge/PHASE11_LAYER2_SEMANTIC_ADVERSARIAL_CHALLENGE.md";

export const M12_PHASE2G_RUNNER_STATUS = Object.freeze({
  runner: "operator-challenge.runner", phase_owned_path: "src/phases/11-operator-challenge", routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", route_id: "ROUTE.PHASE10.EXPOSURE_PROFILE", bucket_id: "2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS", delivery_mode: "DERIVED_ONLY", source_bucket_delivered: false, forensic_inputs_forbidden: true, dynamic_m11_batches_loaded_by_2g: true,
  layer1_status: "PHASE11_LAYER1_DETERMINISTIC_CROSS_PHASE_INVENTORY_ACTIVE", layer2_status: "PHASE11_LAYER2_SEMANTIC_ADVERSARIAL_CHALLENGE_ACTIVE", layer3_status: "PHASE11_LAYER3_DETERMINISTIC_ADJUDICATION_REINVESTIGATION_GATE_ACTIVE", reinvestigation_dispatch_status: "PHASE11_TARGETED_DISPATCH_AND_RETURN_ACTIVE", independent_artifact_status: "PHASE11_INDEPENDENT_ARTIFACT_CUTOVER_ACTIVE", mutation_guard_status: "PHASE11_TARGETED_MUTATION_GUARD_ACTIVE", durable_checkpoint_status: "PHASE11_DURABLE_DISPATCH_CHECKPOINT_ACTIVE", technical_retry_status: "PHASE11_BOUNDED_TECHNICAL_RETRY_ACTIVE", blocking_is_exception: true, only_critical_failure_blocks: true, maximum_reinvestigation_attempts: 2,
  semantic_fallback_prevents_false_blocker: true
});

export async function runM12Phase2GChallenge({ run, internalJobId = "M12", contract, readArtifacts, buildPrompt = buildPhasePrompt, callProvider = callProviderJson } = {}) {
  assertCallback(readArtifacts, "readArtifacts"); assertCallback(buildPrompt, "buildPrompt"); assertCallback(callProvider, "callProvider");
  if (!(contract?.reads || []).includes("phase_routing_manifest")) throw new Error("M12_PHASE2G_MANIFEST_READ_MISSING");
  const routed = await readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId: contract.actor_id || contract.agent_id || AGENT });
  const artifacts = routed.artifacts; assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  const inventory = buildOperatorChallengeInventory({ run, artifacts }).operator_challenge_inventory;
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) throw new Error("PHASE11_LAYER1_INVENTORY_MISSING");
  const packet = buildOperatorChallengeSemanticPacket({ inventory, run });
  const prompt = await buildPrompt({ prompt_files: [LAYER2_PROMPT], phase: "PHASE11_LAYER2_SEMANTIC_ADVERSARIAL_CHALLENGE", run, artifacts: packet, writes: ["operator_challenge_semantic_ledger"], references: [] });
  const firstCall = await callPhase11WithTechnicalRetry({ label: "PHASE11_LAYER2_PRIMARY", call: () => callProvider({ prompt, phase: "OPERATOR_CHALLENGE" }) });
  let providerResult = firstCall.result;
  let semanticOutput = providerResult?.json || providerResult || {};
  let validation = validateOperatorChallengeSemanticLedger({ semanticOutput, inventory });
  let outputRepairAttempts = 0;
  let technicalRetryCount = firstCall.technical_retry_count;
  let semanticFallbackUsed = false;
  let layer2ValidationFailures = validation.failures;
  if (validation.status !== "PASS") {
    outputRepairAttempts = 1;
    const repairPrompt = `${prompt}\n\nOUTPUT REPAIR REQUIRED. Return the complete ledger again for the identical packet. Fix only these validator failures: ${validation.failures.join(" | ")}. Do not change candidate identity, order, scope, or inventory fingerprint.`;
    const repairCall = await callPhase11WithTechnicalRetry({ label: "PHASE11_LAYER2_OUTPUT_REPAIR", call: () => callProvider({ prompt: repairPrompt, phase: "OPERATOR_CHALLENGE_REPAIR" }) });
    technicalRetryCount += repairCall.technical_retry_count;
    providerResult = repairCall.result;
    semanticOutput = providerResult?.json || providerResult || {};
    validation = validateOperatorChallengeSemanticLedger({ semanticOutput, inventory });
    layer2ValidationFailures = validation.failures;
  }
  const semanticLedger = validation.status === "PASS"
    ? validation.semantic_ledger
    : buildOperatorChallengeSemanticFallbackLedger({ inventory, validationFailures: layer2ValidationFailures });
  semanticFallbackUsed = validation.status !== "PASS";
  await saveIndependent(run.run_id, "operator_challenge_inventory", inventory, "LOCKED");
  await saveIndependent(run.run_id, "operator_challenge_semantic_ledger", semanticLedger, semanticFallbackUsed ? "LOCKED_WITH_LIMITATIONS" : "LOCKED");
  const priorArtifacts = await readArtifacts({ reads: ["challenge_gate"], agent_id: contract.actor_id || contract.agent_id || AGENT, strict: false });
  const initialLayer3 = buildOperatorChallengeLayer3({ inventory, semanticLedger, priorChallengeGate: priorArtifacts?.challenge_gate || null, run });
  let challengeGate = initialLayer3.challenge_gate;
  let dispatchCount = 0;
  if (challengeGate.status === "REINVESTIGATION_REQUIRED") {
    const loop = await executePhase11ReinvestigationLoop({ run, m12Contract: contract, inventory, semanticLedger, initialChallengeGate: challengeGate, readArtifacts, buildPrompt, callProvider });
    challengeGate = loop.challenge_gate; dispatchCount = loop.dispatch_count;
  }
  challengeGate = {
    ...challengeGate,
    independent_artifact_contract: { version: "PHASE11_INDEPENDENT_ARTIFACT_CONTRACT_v1", inventory_artifact: "operator_challenge_inventory", semantic_ledger_artifact: "operator_challenge_semantic_ledger", reinvestigation_ledger_artifact: "operator_challenge_reinvestigation_ledger", dispatch_checkpoint_artifact: "operator_challenge_dispatch_checkpoint", compiler_authority_artifact: "challenge_gate" },
    layer2_validation: { status: semanticFallbackUsed ? "PASS_WITH_FALLBACK" : "PASS", exact_candidate_coverage: true, candidate_count: inventory.candidate_count, output_repair_attempts: outputRepairAttempts, technical_retry_count: technicalRetryCount, technical_retry_is_not_field_reinvestigation: true, output_repair_is_not_field_reinvestigation: true, semantic_fallback_used: semanticFallbackUsed, fallback_reason: semanticFallbackUsed ? "PHASE11_LAYER2_MODEL_OUTPUT_UNUSABLE" : "" }
  };
  const runtimeLockStatus = challengeGate.status === "CONTROLLED_FAILURE" ? "CONTROLLED_FAILURE" : challengeGate.status === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : challengeGate.status === "PASS" ? "LOCKED" : "CREATED";
  await saveIndependent(run.run_id, "operator_challenge_reinvestigation_ledger", challengeGate.operator_challenge_reinvestigation_ledger, runtimeLockStatus);
  return Object.freeze({ ok: true, output: { operator_challenge_inventory: inventory, operator_challenge_semantic_ledger: semanticLedger, operator_challenge_reinvestigation_ledger: challengeGate.operator_challenge_reinvestigation_ledger, challenge_gate: challengeGate }, phase_lock_status: runtimeLockStatus, phase2g_route_id: routed.route.route_id, phase2g_bucket_id: routed.route.bucket_id, phase2g_delivery_mode: routed.route.delivery_mode, artifacts_read: Object.keys(artifacts).sort(), layer1_inventory_fingerprint: inventory.inventory_fingerprint, layer2_semantic_output_fingerprint: semanticLedger.semantic_output_fingerprint, layer3_final_gate_fingerprint: challengeGate.final_gate_fingerprint, reinvestigation_dispatch_required: challengeGate.reinvestigation_dispatch_required, reinvestigation_dispatch_count: dispatchCount, compiler_handoff_allowed: challengeGate.compiler_handoff_allowed });
}

async function saveIndependent(runId, artifactName, artifact, lockStatus) { return saveRuntimeArtifact({ run_id: runId, phase: "M12", agent_id: AGENT, artifact_name: artifactName, artifact, lock_status: lockStatus || "LOCKED" }); }
function assertRoutePacket(packet = {}, internalJobId) { if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("M12_PHASE2G_AUTHORITY_MISSING"); if (packet.internal_job_id !== internalJobId) throw new Error(`M12_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`); if (packet.route_id !== "ROUTE.PHASE10.EXPOSURE_PROFILE") throw new Error(`M12_PHASE2G_ROUTE_MISMATCH:${packet.route_id || "missing"}`); if (packet.delivery_mode !== "DERIVED_ONLY") throw new Error(`M12_PHASE2G_DELIVERY_MODE_MISMATCH:${packet.delivery_mode || "missing"}`); if (packet.source_bucket_delivered !== false) throw new Error("M12_PHASE2G_SOURCE_BUCKET_DELIVERED"); if (packet.profile_forensics_inputs_allowed !== false) throw new Error("M12_PHASE2G_FORENSICS_INPUT_BOUNDARY_MISSING"); if (!Array.isArray(packet.dynamic_inputs) || !packet.dynamic_inputs.includes("M11_BATCHES_FROM_EXPOSURE_ROUTE_PLAN")) throw new Error("M12_PHASE2G_DYNAMIC_M11_BATCH_ROUTE_MISSING"); }
function assertCallback(fn, label) { if (typeof fn !== "function") throw new Error(`M12_PHASE2G_RUNNER_MISSING_CALLBACK:${label}`); }
