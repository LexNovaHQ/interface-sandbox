import { buildPhasePrompt } from "./prompt-loader.js";
import { callGeminiJson } from "./gemini-client.js";
import { artifactSaveBody, lockPhase, readArtifactPayload, saveArtifact } from "./artifact-service.js";
import { validatePhase7Layer4SemanticBatchArtifact } from "./phases/07-data-provenance-profile/layer4-semantic-batch-artifact-validator.js";

const AGENT_4 = "agent_4_data_privacy";
const BATCH_PROMPTS = Object.freeze([
  "agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md"
]);
const REPAIR_PROMPTS = Object.freeze([
  "agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml",
  "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md",
  "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_REPAIR.md"
]);

export async function runPhase7Layer4SemanticBatchPhase({ run, phase, contract }) {
  const artifacts = await readPhase7Layer4Artifacts({ run_id: run.run_id, reads: contract.reads || [] });
  const routeManifest = artifacts.dap_semantic_batch_route_manifest;
  const routePackets = routeManifest?.batch_route_packets || [];
  if (!routePackets.length) return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_4, status: "REPAIR_REQUIRED", next_phase: phase });

  const accepted = [];
  const validations = [];
  for (const routePacket of routePackets) {
    const existing = await readArtifactPayload({ run_id: run.run_id, artifact_name: routePacket.expected_artifact_name });
    if (existing) {
      accepted.push(existing);
      continue;
    }
    let output = await runBatchModel({ run, phase, routePacket, artifacts, repair: false });
    let validation = validatePhase7Layer4SemanticBatchArtifact(output, { routePacket });
    if (validation.status !== "PASS") {
      output = await runBatchModel({ run, phase, routePacket, artifacts, repair: true, priorOutput: output, validation });
      validation = validatePhase7Layer4SemanticBatchArtifact(output, { routePacket });
      if (validation.status !== "PASS") {
        await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_4, artifact_name: `dap_semantic_batch_validation__${routePacket.batch_id}`, artifact: { dap_semantic_batch_validation: validation }, lock_status: "REPAIR_REQUIRED" }));
        return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_4, status: "REPAIR_REQUIRED", next_phase: phase });
      }
    }
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_4, artifact_name: `dap_semantic_batch_validation__${routePacket.batch_id}`, artifact: { dap_semantic_batch_validation: validation }, lock_status: "LOCKED" }));
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_4, artifact_name: routePacket.expected_artifact_name, artifact: output, lock_status: "LOCKED" }));
    accepted.push(output);
    validations.push(validation);
  }

  return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_4, status: "LOCKED", next_phase: contract.next });
}

async function runBatchModel({ run, phase, routePacket, artifacts, repair, priorOutput = null, validation = null }) {
  const prompt = await buildPhasePrompt({
    prompt_files: repair ? REPAIR_PROMPTS : BATCH_PROMPTS,
    phase: `${phase}:${repair ? "REPAIR" : "BATCH"}:${routePacket.batch_id}`,
    run,
    artifacts: repair ? { ...artifacts, active_dap_semantic_batch_route_packet: routePacket, prior_batch_output: priorOutput, backend_batch_validation: validation } : { ...artifacts, active_dap_semantic_batch_route_packet: routePacket },
    writes: [routePacket.expected_artifact_name],
    references: []
  });
  return (await callGeminiJson({ prompt, phase: `${phase}:${repair ? "REPAIR" : "BATCH"}:${routePacket.batch_id}` })).json;
}

async function readPhase7Layer4Artifacts({ run_id, reads }) {
  const artifacts = {};
  for (const name of reads) artifacts[name] = await readArtifactPayload({ run_id, artifact_name: name });
  return artifacts;
}
