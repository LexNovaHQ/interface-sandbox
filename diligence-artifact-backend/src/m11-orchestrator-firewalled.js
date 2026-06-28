import { getRunRecord } from "./firestore.js";
import { artifactSaveBody, readArtifactPayload, saveArtifact } from "./artifact-service.js";
import { loadReferencePacket } from "./reference-loader.js";
import { runM11OrchestratedPhase as runCheckpointedM11 } from "./m11-orchestrator-checkpointed.js";
import { projectControlledProfile, projectTriggeredProfile } from "./m11-deterministic-system.js";
import { buildExposureRegistryForensicsFromSavedArtifacts } from "./m11-deterministic-forensics.js";
import { applyM11FalsePositiveFirewall } from "./m11-false-positive-firewall.js";

const AGENT_5 = "agent_5_exposure_registry";
const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS"]);

export async function runM11OrchestratedPhase(args) {
  await runCheckpointedM11(args);
  await applyPostRunFalsePositiveFirewall(args);
}

async function applyPostRunFalsePositiveFirewall({ run, phase, contract }) {
  const updated = await getRunRecord(run.run_id);
  if (!ACCEPTED.has(updated.status) || updated.current_phase !== contract.next) return;

  const route = await readArtifactPayload({ run_id: run.run_id, artifact_name: "exposure_registry_route_plan", agent_id: AGENT_5 });
  const workpad = await readArtifactPayload({ run_id: run.run_id, artifact_name: "exposure_registry_workpad_98", agent_id: AGENT_5 });
  const routePlan = route.exposure_registry_route_plan || route;
  const workpadRoot = workpad.exposure_registry_workpad_98 || workpad;
  const routeRowsById = new Map((routePlan.route_rows || []).map((row) => [row.Threat_ID, row]));

  const rows = Array.isArray(workpadRoot.registry_rows) ? workpadRoot.registry_rows : [];
  let demoted = 0;
  const nextRows = rows.map((row) => {
    if (row.final_material_status !== "TRIGGERED" || !row.material_projection) return row;
    const checked = applyM11FalsePositiveFirewall({ row: { Threat_ID: row.Threat_ID, ...row.material_projection }, routeRow: routeRowsById.get(row.Threat_ID) || {} });
    if (checked.evaluation_status !== "CONTROLLED") return row;
    demoted += 1;
    return {
      ...row,
      trigger_status: "CONTROLLED",
      internal_evaluation_status: "CONTROLLED_BY_FALSE_POSITIVE_FIREWALL",
      final_material_status: "CONTROLLED",
      material_projection: checked,
      limitations: checked.row_limitations || row.limitations || "False-positive firewall demoted row to CONTROLLED."
    };
  });

  if (!demoted) return;

  const patchedWorkpad = {
    exposure_registry_workpad_98: {
      ...workpadRoot,
      workpad_metadata: {
        ...(workpadRoot.workpad_metadata || {}),
        false_positive_firewall: {
          status: "APPLIED",
          demoted_triggered_rows: demoted,
          rule: "Trigger requires direct public proof plus activity/regime fit; absence/speculation/jurisdiction gaps are controlled limitations."
        }
      },
      registry_rows: nextRows
    }
  };

  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: "exposure_registry_workpad_98", artifact: patchedWorkpad.exposure_registry_workpad_98, lock_status: "LOCKED_WITH_LIMITATIONS" }));

  const controlled = projectControlledProfile(patchedWorkpad);
  const triggered = projectTriggeredProfile(patchedWorkpad);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: "exposure_registry_controlled_profile", artifact: controlled.exposure_registry_controlled_profile, lock_status: "LOCKED_WITH_LIMITATIONS" }));
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: "exposure_registry_triggered_profile", artifact: triggered.exposure_registry_triggered_profile, lock_status: "LOCKED_WITH_LIMITATIONS" }));

  const referencePacket = await loadReferencePacket(contract.references || []);
  const batches = await readDynamicArtifacts({ run_id: run.run_id, batch_plan: routePlan.batch_plan || [], prefix: "exposure_registry_batch__" });
  const validations = await readDynamicArtifacts({ run_id: run.run_id, batch_plan: routePlan.batch_plan || [], prefix: "exposure_registry_batch_validation__" });
  const forensicOutput = buildExposureRegistryForensicsFromSavedArtifacts({ routePlan: route, acceptedBatches: batches, batchValidations: validations, workpad: patchedWorkpad, controlledProfile: controlled, triggeredProfile: triggered, fieldDerivationRegistryText: referencePacket.files?.["FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml"]?.content || "" });
  const forensics = forensicOutput.exposure_registry_profile_forensics;
  const forensicStatus = forensics.registry_lock_gate_result?.status === "PASS" ? "LOCKED_WITH_LIMITATIONS" : "REPAIR_REQUIRED";
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: "exposure_registry_profile_forensics", artifact: forensics, lock_status: forensicStatus }));
}

async function readDynamicArtifacts({ run_id, batch_plan, prefix }) {
  const out = [];
  for (const batch of batch_plan) {
    if (!batch?.batch_id) continue;
    try {
      out.push(await readArtifactPayload({ run_id, artifact_name: `${prefix}${batch.batch_id}`, agent_id: AGENT_5 }));
    } catch (_error) {}
  }
  return out;
}
