import { logEvent } from "./firestore.js";
import { buildPhasePrompt } from "./prompt-loader.js";
import { loadReferencePacket } from "./reference-loader.js";
import { callGeminiJson } from "./gemini-client.js";
import { artifactSaveBody, lockPhase, readArtifact, readArtifactPayload, saveArtifact } from "./artifact-service.js";
import { buildExposureRegistryRoutePlan, buildM11BatchPacket, mergeExposureRegistryWorkpad98, projectControlledProfile, projectTriggeredProfile, validateM11BatchLedger } from "./m11-deterministic-system.js";
import { buildExposureRegistryForensicsFromSavedArtifacts } from "./m11-deterministic-forensics.js";
import { buildCompactM11BatchPacket } from "./m11-batch-evidence-resolver.js";
import { applyM11FalsePositiveFirewall } from "./m11-false-positive-firewall.js";

const AGENT_5 = "agent_5_exposure_registry";
const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const BATCH_PROMPTS = Object.freeze([
  "agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md",
  "agent-packages/agent_5_exposure_registry/M11_C_BATCH_EVALUATION.md",
  "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"
]);
const M12_BATCH_PROMPTS = Object.freeze([
  "agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md",
  "agent-packages/agent_5_exposure_registry/M12_BATCH_VALIDATION.md",
  "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"
]);
const REPAIR_PROMPTS = Object.freeze([
  "agent-packages/agent_5_exposure_registry/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml",
  "agent-packages/agent_5_exposure_registry/00_RUNTIME_CONTROLLER_M1_M5_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/00_M11_RUNTIME_CONTROLLER.md",
  "agent-packages/agent_5_exposure_registry/M11_D_BATCH_REINVESTIGATION_REPAIR.md",
  "agent-packages/agent_5_exposure_registry/00_VALIDATOR_RULES_INTEGRATED_AGENT5_SYNCED.md",
  "agent-packages/agent_5_exposure_registry/BACKEND_CANONICAL_OUTPUT_ADAPTER.md"
]);
const ART = Object.freeze({ legalIndex: "legal_cartography_index", featureMain: "target_feature_profile", route: "exposure_registry_route_plan", workpad: "exposure_registry_workpad_98", controlled: "exposure_registry_controlled_profile", triggered: "exposure_registry_triggered_profile", forensics: "exposure_registry_profile_forensics" });

export async function runM11OrchestratedPhase({ run, phase, contract }) {
  const artifacts = await readArtifactsForM11({ run_id: run.run_id, reads: contract.reads, agent_id: contract.agent_id || AGENT_5 });
  const referencePacket = await loadReferencePacket(contract.references || []);
  const route = await getOrBuildRoutePlan({ run, phase, artifacts, referencePacket });
  if (!isAccepted(route.lock_status)) return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });

  const acceptedBatches = [];
  const batchValidations = [];
  for (const batch of route.artifact.batch_plan || []) {
    const completed = await readCompletedBatchCheckpoint({ run_id: run.run_id, batch_id: batch.batch_id });
    if (completed) {
      acceptedBatches.push(completed.batchArtifact);
      batchValidations.push(completed.validationArtifact);
      await logCheckpointReuse({ run_id: run.run_id, artifact_name: `exposure_registry_batch__${batch.batch_id}`, lock_status: completed.batchLockStatus });
      continue;
    }

    const batchPacketRoot = buildM11BatchPacket({ routePlan: { [ART.route]: route.artifact }, batchId: batch.batch_id, upstreamArtifacts: artifacts, referencePacket });
    const compactPacket = buildCompactM11BatchPacket({ batchPacket: batchPacketRoot, upstreamArtifacts: artifacts });
    let batchOutput = applyBatchFalsePositiveDiscipline({
      batchOutput: await runM11Batch({ run, phase, batch, compactPacket }),
      routePlan: route.artifact
    });
    let structuralValidation = validateM11BatchLedger(batchOutput, batch.expected_threat_ids || []);
    const validationName = `exposure_registry_batch_validation__${batch.batch_id}`;

    if (!structuralValidation.ok) {
      const repairedOutput = await runM11BatchRepair({
        run,
        phase,
        batch,
        compactPacket,
        batchOutput,
        structuralValidation,
        validationArtifact: null,
        repairReason: "BACKEND_STRUCTURAL_VALIDATION"
      });

      const repairedStructuralValidation = validateM11BatchLedger(
        repairedOutput,
        batch.expected_threat_ids || []
      );

      if (!repairedStructuralValidation.ok) {
        const repair = buildStructuralBatchValidationArtifact({
          batch,
          structuralValidation: repairedStructuralValidation,
          repairAttempted: true
        });

        await saveArtifact(artifactSaveBody({
          run_id: run.run_id,
          phase,
          agent_id: AGENT_5,
          artifact_name: validationName,
          artifact: repair,
          lock_status: "REPAIR_REQUIRED"
        }));

        await lockPhase({
          run_id: run.run_id,
          phase,
          agent_id: AGENT_5,
          status: "REPAIR_REQUIRED",
          next_phase: phase
        });

        return;
      }

      batchOutput = applyBatchFalsePositiveDiscipline({ batchOutput: repairedOutput, routePlan: route.artifact });
      structuralValidation = repairedStructuralValidation;

      await logEvent({
        run_id: run.run_id,
        event_type: "M11_BATCH_STRUCTURAL_REPAIR_ACCEPTED",
        actor: AGENT_5,
        payload: { batch_id: batch.batch_id }
      });
    }

    let validationArtifact = await runM12BatchValidation({ run, phase, batch, compactPacket, batchOutput, structuralValidation, routePlan: route.artifact });
    let m12Status = validationArtifact.exposure_registry_batch_validation.status;
    if (!isAcceptedBatchValidationStatus(m12Status)) {
      const repairedOutput = await runM11BatchRepair({
        run,
        phase,
        batch,
        compactPacket,
        batchOutput,
        structuralValidation,
        validationArtifact,
        repairReason: "M12_BATCH_VALIDATION"
      });

      const repairedStructuralValidation = validateM11BatchLedger(
        repairedOutput,
        batch.expected_threat_ids || []
      );

      if (!repairedStructuralValidation.ok) {
        const repair = buildStructuralBatchValidationArtifact({
          batch,
          structuralValidation: repairedStructuralValidation,
          repairAttempted: true,
          priorM12Validation: validationArtifact
        });

        await saveArtifact(artifactSaveBody({
          run_id: run.run_id,
          phase,
          agent_id: AGENT_5,
          artifact_name: validationName,
          artifact: repair,
          lock_status: "REPAIR_REQUIRED"
        }));

        await lockPhase({
          run_id: run.run_id,
          phase,
          agent_id: AGENT_5,
          status: "REPAIR_REQUIRED",
          next_phase: phase
        });

        return;
      }

      const repairedValidationArtifact = await runM12BatchValidation({
        run,
        phase,
        batch,
        compactPacket,
        batchOutput: applyBatchFalsePositiveDiscipline({ batchOutput: repairedOutput, routePlan: route.artifact }),
        structuralValidation: repairedStructuralValidation,
        routePlan: route.artifact
      });

      const repairedM12Status =
        repairedValidationArtifact.exposure_registry_batch_validation.status;

      if (isAcceptedBatchValidationStatus(repairedM12Status)) {
        batchOutput = applyBatchFalsePositiveDiscipline({ batchOutput: repairedOutput, routePlan: route.artifact });
        structuralValidation = repairedStructuralValidation;
        validationArtifact = addRepairTrace(repairedValidationArtifact, {
          repair_attempted: true,
          repair_result: "REPAIRED_AND_ACCEPTED"
        });
        m12Status = validationArtifact.exposure_registry_batch_validation.status;
      } else {
        batchOutput = applyBatchFalsePositiveDiscipline({ batchOutput: repairedOutput, routePlan: route.artifact });
        structuralValidation = repairedStructuralValidation;
        validationArtifact = coercePostReinvestigationM12FailureToWarning(
          repairedValidationArtifact,
          {
            batch_id: batch.batch_id,
            prior_status: m12Status,
            repaired_status: repairedM12Status
          }
        );
        m12Status = validationArtifact.exposure_registry_batch_validation.status;
      }
    }

    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: validationName, artifact: validationArtifact, lock_status: batchValidationLockStatus(m12Status) }));

    const batchArtifactName = `exposure_registry_batch__${batch.batch_id}`;
    await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: batchArtifactName, artifact: batchOutput, lock_status: m12Status === "PASS_WITH_LIMITATION" ? "LOCKED_WITH_LIMITATIONS" : "LOCKED" }));
    acceptedBatches.push(batchOutput);
    batchValidations.push(validationArtifact);
  }

  const workpad = await getOrBuildWorkpad({ run, phase, route, acceptedBatches, batchValidations });
  if (!isAccepted(workpad.lock_status)) return lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "REPAIR_REQUIRED", next_phase: phase });
  const controlled = await getOrBuildProjection({ run, phase, artifactName: ART.controlled, build: () => projectControlledProfile({ [ART.workpad]: workpad.artifact })[ART.controlled] });
  const triggered = await getOrBuildProjection({ run, phase, artifactName: ART.triggered, build: () => projectTriggeredProfile({ [ART.workpad]: workpad.artifact })[ART.triggered] });
  const forensics = await getOrBuildForensics({ run, phase, route, workpad, controlled, triggered, acceptedBatches, batchValidations, referencePacket });
  const finalStatus = deriveFinalM11Status({ routeStatus: route.lock_status, forensicStatus: forensics.lock_status, batchValidations });

  await logEvent({ run_id: run.run_id, event_type: "M11_ORCHESTRATED_PHASE_COMPLETED", actor: AGENT_5, payload: { checkpoint_resume: true, batch_prompt_mode: "compact_lossless_units", route_status: route.lock_status, batch_count: acceptedBatches.length, forensic_status: finalStatus } });
  await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: finalStatus, next_phase: isAccepted(finalStatus) ? contract.next : phase });
}

async function getOrBuildRoutePlan({ run, phase, artifacts, referencePacket }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: ART.route });
  if (existing && !hasSurfaceTriggeredRoutes(existing.artifact)) return existing;
  if (existing) await logEvent({ run_id: run.run_id, event_type: "M11_ROUTE_PLAN_SURFACE_TRIGGER_CHECKPOINT_REBUILT", actor: AGENT_5, payload: { reason: "Retired surface-only route reason found in checkpoint" } });
  const output = buildExposureRegistryRoutePlan({ upstreamArtifacts: artifacts, targetFeatureProfile: artifacts[ART.featureMain], legalCartographyIndex: artifacts[ART.legalIndex], referencePacket, runId: run.run_id });
  const artifact = output[ART.route];
  const lock_status = routePlanLockStatus(artifact.phase_a_validation?.status);
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.route, artifact, lock_status }));
  return { artifact, lock_status };
}

async function runM11Batch({ run, phase, batch, compactPacket }) {
  const prompt = await buildPhasePrompt({ prompt_files: BATCH_PROMPTS, phase: `${phase}:M11_BATCH:${batch.batch_id}`, run, artifacts: { m11_batch_packet: compactPacket }, writes: ["m11_batch_registry_ledger"], references: [] });
  return (await callGeminiJson({ prompt, phase: `${phase}:${batch.batch_id}` })).json;
}

async function runM12BatchValidation({ batch, batchOutput, structuralValidation, routePlan }) {
  return buildDeterministicM12BatchValidation({
    batch,
    batchOutput,
    structuralValidation,
    routePlan
  });
}

async function runM11BatchRepair({
  run,
  phase,
  batch,
  compactPacket,
  batchOutput,
  structuralValidation,
  validationArtifact,
  repairReason
}) {
  const prompt = await buildPhasePrompt({
    prompt_files: REPAIR_PROMPTS,
    phase: `${phase}:M11_REPAIR:${batch.batch_id}`,
    run,
    artifacts: {
      m11_batch_packet: compactPacket,
      m11_batch_registry_ledger: batchOutput,
      backend_structural_validation: structuralValidation,
      m12_batch_validation: validationArtifact || null,
      repair_context: {
        batch_id: batch.batch_id,
        repair_reason: repairReason,
        rule: "Run one targeted reinvestigation/repair pass. If the same substantive result remains and no concrete repair is available, return the same result with row_limitations warning."
      }
    },
    writes: ["m11_batch_registry_ledger"],
    references: []
  });

  return (await callGeminiJson({
    prompt,
    phase: `${phase}:REPAIR:${batch.batch_id}`
  })).json;
}

async function readCompletedBatchCheckpoint({ run_id, batch_id }) {
  const validation = await readAcceptedCheckpoint({ run_id, artifact_name: `exposure_registry_batch_validation__${batch_id}` });
  const batch = await readAcceptedCheckpoint({ run_id, artifact_name: `exposure_registry_batch__${batch_id}` });
  if (!validation || !batch) return null;
  return { validationArtifact: validation.artifact, batchArtifact: batch.artifact, validationLockStatus: validation.lock_status, batchLockStatus: batch.lock_status };
}

async function getOrBuildWorkpad({ run, phase, route, acceptedBatches, batchValidations }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: ART.workpad });
  if (existing) return existing;
  const output = mergeExposureRegistryWorkpad98({ routePlan: { [ART.route]: route.artifact }, acceptedBatches, batchValidations });
  const artifact = output[ART.workpad];
  const lock_status = artifact.merge_validation?.status === "PASS" ? "LOCKED" : "REPAIR_REQUIRED";
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.workpad, artifact, lock_status }));
  return { artifact, lock_status };
}

async function getOrBuildProjection({ run, phase, artifactName, build }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: artifactName });
  if (existing) return existing;
  const artifact = build();
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: artifactName, artifact, lock_status: "LOCKED" }));
  return { artifact, lock_status: "LOCKED" };
}

async function getOrBuildForensics({ run, phase, route, workpad, controlled, triggered, acceptedBatches, batchValidations, referencePacket }) {
  const existing = await readAcceptedCheckpoint({ run_id: run.run_id, artifact_name: ART.forensics });
  if (existing) return existing;
  const output = buildExposureRegistryForensicsFromSavedArtifacts({ routePlan: { [ART.route]: route.artifact }, acceptedBatches, batchValidations, workpad: { [ART.workpad]: workpad.artifact }, controlledProfile: { [ART.controlled]: controlled.artifact }, triggeredProfile: { [ART.triggered]: triggered.artifact }, fieldDerivationRegistryText: referencePacket.files?.["FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml"]?.content || "" });
  const artifact = output[ART.forensics];
  const lock_status = artifact.registry_lock_gate_result?.status === "PASS" ? "LOCKED" : "REPAIR_REQUIRED";
  await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase, agent_id: AGENT_5, artifact_name: ART.forensics, artifact, lock_status }));
  return { artifact, lock_status };
}

async function readAcceptedCheckpoint({ run_id, artifact_name }) {
  try {
    const result = await readArtifact({ run_id, artifact_name, agent_id: AGENT_5 });
    if (!isAccepted(result.lock_status)) return null;
    return { artifact: result.artifact, lock_status: result.lock_status };
  } catch (_error) {
    return null;
  }
}

async function logCheckpointReuse({ run_id, artifact_name, lock_status }) {
  await logEvent({ run_id, event_type: "M11_CHECKPOINT_REUSED", actor: AGENT_5, payload: { artifact_name, lock_status } });
}

function routePlanLockStatus(status) { if (status === "PASS") return "LOCKED"; if (status === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS"; return "CONTROLLED_FAILURE"; }
function isAccepted(status) { return ACCEPTED.has(status); }
function deriveFinalM11Status({ routeStatus, forensicStatus, batchValidations }) { if (!isAccepted(forensicStatus)) return forensicStatus; if (routeStatus === "LOCKED_WITH_LIMITATIONS") return "LOCKED_WITH_LIMITATIONS"; if (batchValidations.some((validation) => validation?.exposure_registry_batch_validation?.status === "PASS_WITH_LIMITATION")) return "LOCKED_WITH_LIMITATIONS"; return "LOCKED"; }
function normalizeBatchValidationStatus(status) { return ["PASS", "PASS_WITH_LIMITATION", "REPAIR_REQUIRED", "CONTROLLED_FAILURE"].includes(status) ? status : "REPAIR_REQUIRED"; }
function isAcceptedBatchValidationStatus(status) { return status === "PASS" || status === "PASS_WITH_LIMITATION"; }
function batchValidationLockStatus(status) { if (status === "PASS") return "LOCKED"; if (status === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS"; if (status === "CONTROLLED_FAILURE") return "CONTROLLED_FAILURE"; return "REPAIR_REQUIRED"; }
function buildRoutePlanSummary(routePlan, batch) { return { batch_id: batch.batch_id, batch_group: batch.batch_group, expected_threat_ids: batch.expected_threat_ids || [], route_reasons: batch.route_reasons || [], route_plan_status: routePlan?.phase_a_validation?.status || "UNKNOWN", route_plan_warning_count: routePlan?.phase_a_validation?.non_blocking_warning_count || 0 }; }
function buildStructuralBatchValidationArtifact({ batch, structuralValidation, repairAttempted = false, priorM12Validation = null }) { return { exposure_registry_batch_validation: { batch_id: batch.batch_id, batch_group: batch.batch_group, status: "REPAIR_REQUIRED", validation_owner: "backend_structural_validator", semantic_m12_validation_status: "REPAIR_REQUIRED", expected_threat_ids: batch.expected_threat_ids || [], failures: structuralValidation.failures || [], repair_attempted: repairAttempted, prior_m12_validation: priorM12Validation?.exposure_registry_batch_validation || null } }; }
function normalizeM12BatchValidationResult({ batch, result }) { const root = result.json?.exposure_registry_batch_validation || result.json; const status = normalizeBatchValidationStatus(root?.status); return { exposure_registry_batch_validation: { batch_id: root?.batch_id || batch.batch_id, batch_group: root?.batch_group || batch.batch_group, status, validation_owner: root?.validation_owner || "agent_5_exposure_registry:M12_BATCH_VALIDATION", semantic_m12_validation_status: normalizeBatchValidationStatus(root?.semantic_m12_validation_status || status), expected_threat_ids: root?.expected_threat_ids || batch.expected_threat_ids || [], validated_threat_ids: root?.validated_threat_ids || [], shape_checks: root?.shape_checks || {}, challenge_checks: root?.challenge_checks || {}, findings: Array.isArray(root?.findings) ? root.findings : [], repair_directives: Array.isArray(root?.repair_directives) ? root.repair_directives : [], limitations: Array.isArray(root?.limitations) ? root.limitations : [], model_metadata: result.metadata || {} } }; }
async function readArtifactsForM11({ run_id, reads, agent_id }) { const artifacts = {}; for (const artifactName of reads) artifacts[artifactName] = await readArtifactPayload({ run_id, artifact_name: artifactName, agent_id }); return artifacts; }

function addRepairTrace(validationArtifact, trace) {
  const root = validationArtifact.exposure_registry_batch_validation;
  return {
    exposure_registry_batch_validation: {
      ...root,
      repair_trace: {
        ...(root.repair_trace || {}),
        ...trace
      }
    }
  };
}

function isNonActionableRepairValidation(validationArtifact) {
  const root = validationArtifact?.exposure_registry_batch_validation || {};
  return ["REPAIR_REQUIRED", "CONTROLLED_FAILURE"].includes(root.status) &&
    !asArray(root.findings).length &&
    !asArray(root.failures).length &&
    !asArray(root.repair_directives).length;
}

function coerceRepeatedNonActionableRepairToWarning(validationArtifact, { batch_id }) {
  const root = validationArtifact.exposure_registry_batch_validation;
  return {
    exposure_registry_batch_validation: {
      ...root,
      status: "PASS_WITH_LIMITATION",
      semantic_m12_validation_status: root.status || "REPAIR_REQUIRED",
      limitations: [
        ...asArray(root.limitations),
        {
          code: "M12_REINVESTIGATION_SAME_RESULT_WITH_WARNING",
          severity: "WARNING_NON_BLOCKING",
          batch_id,
          message: "M12 returned a repeated non-actionable repair status after reinvestigation. The repaired batch ledger was structurally valid and materially unchanged, so the run continues with warning."
        }
      ],
      repair_trace: {
        ...(root.repair_trace || {}),
        repair_attempted: true,
        repair_result: "SAME_RESULT_WITH_WARNING"
      }
    }
  };
}

function coercePostReinvestigationM12FailureToWarning(validationArtifact, {
  batch_id,
  prior_status,
  repaired_status
}) {
  const root = validationArtifact.exposure_registry_batch_validation;

  return {
    exposure_registry_batch_validation: {
      ...root,
      status: "PASS_WITH_LIMITATION",
      semantic_m12_validation_status: repaired_status || root.status || "REPAIR_REQUIRED",
      limitations: [
        ...asArray(root.limitations),
        {
          code: "M12_POST_REINVESTIGATION_REPAIR_STATUS_CARRIED_AS_WARNING",
          severity: "WARNING_NON_BLOCKING",
          batch_id,
          prior_status,
          repaired_status,
          message: "M12 still returned a repair/blocking status after one reinvestigation pass. The repaired batch ledger is structurally valid, so the unresolved semantic validation issue is carried as a warning/limitation and the run continues."
        }
      ],
      repair_trace: {
        ...(root.repair_trace || {}),
        repair_attempted: true,
        repair_result: "POST_REINVESTIGATION_STATUS_CARRIED_AS_WARNING"
      }
    }
  };
}

function buildDeterministicM12BatchValidation({
  batch,
  batchOutput,
  structuralValidation,
  routePlan
}) {
  const ledger = batchOutput?.m11_batch_registry_ledger || batchOutput || {};
  const rows = Array.isArray(ledger.batch_registry_ledger)
    ? ledger.batch_registry_ledger
    : [];

  const expected = Array.isArray(batch.expected_threat_ids)
    ? batch.expected_threat_ids.map(String)
    : [];

  const returned = Array.isArray(ledger.returned_threat_ids)
    ? ledger.returned_threat_ids.map(String)
    : rows.map((row) => String(row.Threat_ID || "")).filter(Boolean);

  const failures = [];
  const warnings = [];

  if (!structuralValidation?.ok) {
    failures.push(...(structuralValidation.failures || ["backend structural validation failed"]));
  }

  if (!arraysEqualAsSets(expected, returned)) {
    failures.push("returned_threat_ids do not match expected_threat_ids");
  }

  if (rows.length !== expected.length) {
    failures.push(`batch_registry_ledger length ${rows.length} does not match expected ${expected.length}`);
  }

  for (const row of rows) {
    const id = String(row.Threat_ID || "").trim();
    const status = String(row.evaluation_status || row.trigger_status || "").trim().toUpperCase();

    if (!id) failures.push("batch row missing Threat_ID");

    if (!["TRIGGERED", "CONTROLLED"].includes(status)) {
      warnings.push(`non-final semantic status carried as limitation: ${id || "unknown"}:${status || "blank"}`);
    }

    if (String(row.row_limitations || "").trim()) {
      warnings.push(`row limitation carried: ${id || "unknown"}`);
    }

    if (String(row.row_limitations || "").includes("False-positive firewall demoted prior TRIGGERED status to CONTROLLED")) {
      warnings.push(`false-positive discipline applied before batch save: ${id || "unknown"}`);
    }
  }

  const status = failures.length
    ? "REPAIR_REQUIRED"
    : warnings.length
      ? "PASS_WITH_LIMITATION"
      : "PASS";

  return {
    exposure_registry_batch_validation: {
      batch_id: batch.batch_id,
      batch_group: batch.batch_group,
      status,
      validation_owner: "backend_deterministic_m12_batch_validator",
      semantic_m12_validation_status: status,
      expected_threat_ids: expected,
      validated_threat_ids: returned,
      shape_checks: {
        backend_structural_validation_status: structuralValidation?.status || "UNKNOWN",
        expected_count: expected.length,
        returned_count: returned.length,
        row_count: rows.length,
        route_plan_status: routePlan?.phase_a_validation?.status || "UNKNOWN"
      },
      challenge_checks: {
        deterministic: true,
        model_usage: "NONE_DETERMINISTIC",
        false_positive_discipline: "APPLIED_PRE_SAVE_TO_BATCH_LEDGER",
        non_blocking_rule: "Structural invalidity blocks before repair. False-positive demotions are applied before the batch artifact is saved and carried as warning/limitation."
      },
      findings: [],
      failures,
      repair_directives: failures.length
        ? failures.map((failure) => ({ failure, directive: "Run M11 batch reinvestigation repair once." }))
        : [],
      limitations: warnings,
      model_metadata: {
        model_usage: "NONE_DETERMINISTIC"
      }
    }
  };
}

function hasSurfaceTriggeredRoutes(routePlan) {
  const retiredRouteReason = ["SURFACE", "TRIGGERED"].join("_");
  const rows = Array.isArray(routePlan?.route_rows) ? routePlan.route_rows : [];
  return rows.some((row) => row.route_reason === retiredRouteReason);
}

function applyBatchFalsePositiveDiscipline({ batchOutput, routePlan }) {
  const ledger = batchOutput?.m11_batch_registry_ledger || batchOutput || {};
  const rows = Array.isArray(ledger.batch_registry_ledger) ? ledger.batch_registry_ledger : [];
  if (!rows.length) return batchOutput;

  const routeRowsById = new Map((Array.isArray(routePlan?.route_rows) ? routePlan.route_rows : []).map((row) => [row.Threat_ID, row]));
  const cleanedRows = rows.map((row) => applyM11FalsePositiveFirewall({ row, routeRow: routeRowsById.get(row.Threat_ID) || {} }));

  if (batchOutput?.m11_batch_registry_ledger) {
    return {
      ...batchOutput,
      m11_batch_registry_ledger: {
        ...batchOutput.m11_batch_registry_ledger,
        batch_registry_ledger: cleanedRows
      }
    };
  }

  return {
    ...ledger,
    batch_registry_ledger: cleanedRows
  };
}

function arraysEqualAsSets(a, b) {
  const aa = new Set((Array.isArray(a) ? a : []).map(String));
  const bb = new Set((Array.isArray(b) ? b : []).map(String));
  if (aa.size !== bb.size) return false;
  for (const item of aa) if (!bb.has(item)) return false;
  return true;
}

function isSameBatchMaterialResult(a, b) {
  return stableBatchFingerprint(a) === stableBatchFingerprint(b);
}

function stableBatchFingerprint(root) {
  const ledger = root?.m11_batch_registry_ledger || root || {};
  return JSON.stringify(
    asArray(ledger.batch_registry_ledger)
      .map((row) => ({
        Threat_ID: row.Threat_ID || "",
        trigger_status: row.trigger_status || "",
        registry_exposure: row.registry_exposure || "",
        target_match: row.target_match || "",
        evaluation_status: row.evaluation_status || "",
        basis_proof: row.basis_proof || "",
        impact_priority: row.impact_priority || "",
        review_route: row.review_route || "",
        row_limitations: row.row_limitations || ""
      }))
      .sort((a, b) => a.Threat_ID.localeCompare(b.Threat_ID))
  );
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}
