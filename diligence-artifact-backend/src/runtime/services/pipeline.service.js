import { getRunRecord, updateRunRecord, logEvent } from "./storage/firestore.service.js";
import { updateRunDashboardRow } from "./storage/sheets.service.js";
import { getInternalJobContract, normalizeInternalJobId } from "../contracts/internal-job.contract.js";
import { centralPhaseStatusForInternalJob } from "../contracts/central-phase.contract.js";
import { artifactMatchesPermission } from "../contracts/artifact-permissions.contract.js";
import { saveRuntimeArtifact as saveArtifact, readRuntimeArtifactPayload as readArtifactPayload, lockRuntimePhase as lockPhase } from "./artifacts.service.js";
import { buildPhasePrompt } from "./prompts.service.js";
import { callProviderJson } from "./provider.service.js";
import { runSourceUrlManifestJob as runSourceUrlManifestPhaseJob, runSourceExtractionJob as runSourceExtractionPhaseJob, runSourceFamilyHandoffJob as runSourceFamilyHandoffPhaseJob } from "../../phases/01-source-discovery/source-discovery.runner.js";
import { runCartographyIndexJob as runCartographyIndexPhaseJob } from "../../phases/02-cartography-index/cartography-index.runner.js";
import { validateM9LegalCartographyIndex as validateLegalCartographyIndex } from "../../phases/02-legal-cartography-index/validators/legal-cartography-index.validator.js";
import { runM9HybridOrchestrator as runLegalCartographyHybridOrchestrator } from "../../phases/02-legal-cartography-index/orchestrators/legal-cartography-hybrid.orchestrator.js";
import { runTargetProfileReviewPhase } from "../../phases/03-target-profile-review/target-profile-review.runner.js";
import { runDomainDerivationPhase } from "../../phases/03-domain-derivation/domain-derivation.runner.js";
import { validateM7TargetProfileOutput as validateTargetProfileOutput } from "../../phases/03-target-profile-review/validators/target-profile-review.validator.js";
import { runTargetProfileForensicsPhase } from "../../phases/04-target-profile-forensics/target-profile-forensics.runner.js";
import { runActivityCandidateInventoryPhase } from "../../phases/05-activity-profile-review/activity-candidate-inventory.runner.js";
import { runActivityProfileReviewPhase } from "../../phases/05-activity-profile-review/activity-profile-review.runner.js";
import { validateM8TargetFeatureOutput as validateActivityProfileOutput } from "../../phases/05-activity-profile-review/validators/activity-profile-review.validator.js";
import { runActivityProfileForensicsPhase } from "../../phases/06-activity-profile-forensics/activity-profile-forensics.runner.js";
import { runDataProvenanceProfilePhase } from "../../phases/07-data-provenance-profile/data-provenance-profile.runner.js";
import { runDapForensicsPhase } from "../../phases/08-data-provenance-forensics/dap-forensics.runner.js";
import { runM11OrchestratedPhase as runExposureProfileOrchestrator } from "../../m11-orchestrator.js";
import { buildM12DeterministicChallengeGate as buildOperatorChallengeGate } from "../../m12-deterministic-challenge.js";
import { compileFinalOutputHandoff } from "../../compiler.js";
import { buildRendererPayload } from "../../report-renderer.js";

const ADVANCE_OK = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const LOSSLESS_ROOT_BASE_ARTIFACT_PATTERN = /^lossless_root__([a-z0-9_]+)$/;
const JOB = Object.freeze({ sourceUrlManifest: "AGENT_1A_URL_MANIFEST", sourceExtract: "AGENT_1B_EXTRACT", sourceDiscoveryHandoff: "M6_BUCKET_INDEX", cartographySourceInventory: "P2_SOURCE_INVENTORY_CARTOGRAPHY", cartographyLocatorSpine: "P2_LOCATOR_SPINE", cartographyProfileRouteMatrix: "P2_PROFILE_ROUTE_MATRIX", cartographySemanticOverlay: "P2_SEMANTIC_NAVIGATION_OVERLAY", legalCartographyIndex: "M9", cartographyCompilerValidation: "P2_INDEX_COMPILER_VALIDATION", targetProfileReview: "M7_TARGET_PROFILE", domainDerivation: "P3_DOMAIN_DERIVATION_LAYER", targetProfileForensics: "M7_TARGET_PROFILE_FORENSICS", activityCandidateInventory: "M8_FEATURE_CANDIDATE_INVENTORY", activityProfileReview: "M8_TARGET_FEATURE_PROFILE", activityProfileForensics: "M8_TARGET_FEATURE_PROFILE_FORENSICS", dataProvenanceLayer4: "DATA_PROVENANCE_PROFILE_LAYER4", dataProvenanceLayer5: "DATA_PROVENANCE_PROFILE_LAYER5", dataProvenanceForensics: "DATA_PROVENANCE_PROFILE_FORENSICS", exposureProfile: "M11", operatorChallenge: "M12", compiler: "NORMALIZED_COMPILER", reportRenderer: "NORMALIZED_REPORT_RENDERER", reportRendererCompatibility: "RENDERER", complete: "COMPLETE" });
const CARTOGRAPHY_JOBS = new Set([JOB.cartographySourceInventory, JOB.cartographyLocatorSpine, JOB.cartographyProfileRouteMatrix, JOB.cartographySemanticOverlay, JOB.cartographyCompilerValidation]);
const ART = Object.freeze({ targetProfile: "target_profile", domainDerivation: "domain_derivation_profile", activeManifest: "active_run_package_manifest", legalIndex: "legal_cartography_index", challengeGate: "challenge_gate", final: "final_output_handoff", renderer: "renderer_payload", exposureRoutePlan: "exposure_registry_route_plan" });

export const PIPELINE_SERVICE_STATUS = Object.freeze({ central_runtime_service: "pipeline.service", phase3_domain_derivation_runner_wired: true, phase3_domain_derivation_registry_ladder_prompt_active: true, phase3_domain_derivation_prompt_package_pending: false, downstream_domain_derivation_reads_synced: true, central_phase_language: true, sparse_lossless_root_resolution_enabled: true });
export function decorateRunWithCentralPhase(run = {}) { const internalJobId = normalizeRuntimeJobId(run.current_phase || ""); const central = centralPhaseStatusForInternalJob(internalJobId); return { ...run, central_phase: run.central_phase || central.central_phase_id, central_phase_label: run.central_phase_label || central.central_phase_label, active_internal_job: run.current_phase || "" }; }

export async function advanceCentralPipelineRun({ run_id } = {}) {
  const run = await getRunRecord(run_id);
  if (run.current_phase === JOB.complete || run.status === "COMPLETE") return { ok: true, run_id, status: "COMPLETE", current_phase: JOB.complete, advanced: false };
  const internalJobId = normalizeRuntimeJobId(run.current_phase);
  const persistencePhase = persistencePhaseForInternalJob(internalJobId);
  const central = centralPhaseStatusForInternalJob(internalJobId);
  const contract = getInternalJobContract(internalJobId === JOB.reportRenderer ? JOB.reportRendererCompatibility : internalJobId);
  const actor = actorForContract(contract);
  const runtimeRun = { ...run, current_phase: persistencePhase, central_phase: central.central_phase_id, central_phase_label: central.central_phase_label };
  await updateRunRecord(run_id, { current_phase: persistencePhase, central_phase: central.central_phase_id, central_phase_label: central.central_phase_label, active_internal_job: internalJobId, status: "RUNNING" });
  try {
    if (internalJobId === JOB.sourceUrlManifest) await runSourceUrlManifestJob({ run: runtimeRun, persistencePhase, contract, central });
    else if (internalJobId === JOB.sourceExtract) await runSourceExtractionJob({ run: runtimeRun, persistencePhase, contract, central });
    else if (internalJobId === JOB.sourceDiscoveryHandoff) await runSourceDiscoveryHandoffJob({ run: runtimeRun, persistencePhase, contract, central });
    else if (CARTOGRAPHY_JOBS.has(internalJobId)) await runCartographyIndexRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.legalCartographyIndex) await runLegalCartographyIndexJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.targetProfileReview) await runTargetProfileReviewRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.domainDerivation) await runDomainDerivationRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.targetProfileForensics) await runTargetProfileForensicsRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.activityCandidateInventory) await runActivityCandidateInventoryRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.activityProfileReview) await runActivityProfileReviewRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.activityProfileForensics) await runActivityProfileForensicsRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.dataProvenanceLayer4 || internalJobId === JOB.dataProvenanceLayer5) await runDataProvenanceProfileRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.dataProvenanceForensics) await runDapForensicsRuntimeJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.exposureProfile) await runExposureProfileJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else if (internalJobId === JOB.operatorChallenge) await runOperatorChallengeJob({ run: runtimeRun, persistencePhase, contract, central });
    else if (internalJobId === JOB.compiler) await runCompilerJob({ run: runtimeRun, persistencePhase, contract, central });
    else if (internalJobId === JOB.reportRenderer) await runReportRendererJob({ run: runtimeRun, persistencePhase, contract, central });
    else if (contract.type === "model") await runModelProfileJob({ run: runtimeRun, persistencePhase, internalJobId, contract, central });
    else throw new Error(`UNKNOWN_CENTRAL_PIPELINE_JOB:${central.central_phase_id}:${internalJobId}:${contract.type}`);
  } catch (error) {
    await logEvent({ run_id, event_type: "CENTRAL_PIPELINE_JOB_FAILED", actor, payload: { persistencePhase, internalJobId, central_phase_id: central.central_phase_id, message: error.message } });
    await updateRunRecord(run_id, { status: "CONTROLLED_FAILURE" });
    throw error;
  }
  const updated = decorateRunWithCentralPhase(await getRunRecord(run_id));
  await updateRunDashboardRow(updated);
  return { ok: true, run_id, advanced: true, completed_phase: persistencePhase, completed_internal_job: internalJobId, completed_central_phase: central.central_phase_id, current_phase: updated.current_phase, status: updated.status, central_phase: updated.central_phase, central_phase_label: updated.central_phase_label, active_internal_job: updated.active_internal_job, final_report_url: updated.final_report_url || "" };
}

function normalizeRuntimeJobId(value) { if (!value || value === "URL_MANIFEST" || value === "M6" || value === "AGENT_1_SCOUT_EXTRACT") return JOB.sourceUrlManifest; if (value === "COMPILER") return JOB.compiler; if (value === JOB.reportRendererCompatibility) return JOB.reportRenderer; return normalizeInternalJobId(value); }
function persistencePhaseForInternalJob(internalJobId) { return internalJobId === JOB.reportRenderer ? JOB.reportRendererCompatibility : internalJobId; }
function actorForContract(contract = {}) { return contract.agent_id || contract.actor_id || "pipeline_service"; }
function artifactSaveBody({ run_id, phase, agent_id, artifact_name, artifact, lock_status }) { return { run_id, phase, agent_id, artifact_name, artifact, lock_status }; }
async function lockCentralPhase({ run, persistencePhase, contract, status, nextPhase, central, final_report_url = "" }) { await lockPhase({ run_id: run.run_id, phase: persistencePhase, agent_id: actorForContract(contract), status, next_phase: nextPhase, final_report_url }); await logEvent({ run_id: run.run_id, event_type: "CENTRAL_PIPELINE_JOB_COMPLETED", actor: actorForContract(contract), payload: { persistencePhase, central_phase_id: central.central_phase_id, status, next_phase: nextPhase } }); }
function nextForStatus(status, contract, fallback) { return ADVANCE_OK.has(status) ? contract.next : fallback; }

async function runSourceUrlManifestJob({ run, persistencePhase, contract, central }) { const result = await runSourceUrlManifestPhaseJob({ run }); await saveDeterministicArtifacts({ run, persistencePhase, actor: contract.actor_id, writes: contract.writes, output: result.output, central, optional_writes: contract.optional_writes, dynamic_writes: contract.dynamic_writes }); await lockCentralPhase({ run, persistencePhase, contract, status: "LOCKED", nextPhase: contract.next, central }); }
async function runSourceExtractionJob({ run, persistencePhase, contract, central }) { const deduped = await readArtifactPayload({ run_id: run.run_id, artifact_name: "deduped_url_manifest", agent_id: contract.actor_id }); const result = await runSourceExtractionPhaseJob({ run, artifacts: { deduped_url_manifest: deduped } }); await saveDeterministicArtifacts({ run, persistencePhase, actor: contract.actor_id, writes: contract.writes, output: result.output, central, optional_writes: contract.optional_writes, dynamic_writes: contract.dynamic_writes }); await lockCentralPhase({ run, persistencePhase, contract, status: "LOCKED", nextPhase: contract.next, central }); }
async function runSourceDiscoveryHandoffJob({ run, persistencePhase, contract, central }) { const artifacts = await readArtifactsForCentralJob({ run_id: run.run_id, reads: contract.reads, agent_id: contract.actor_id, strict: false }); const result = await runSourceFamilyHandoffPhaseJob({ run, artifacts }); await saveDeterministicArtifacts({ run, persistencePhase, actor: contract.actor_id, writes: contract.writes, output: result.output, central, optional_writes: contract.optional_writes, dynamic_writes: contract.dynamic_writes }); await lockCentralPhase({ run, persistencePhase, contract, status: result.output.source_discovery_handoff?.status || "LOCKED", nextPhase: contract.next, central }); }
async function runCartographyIndexRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runCartographyIndexPhaseJob({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id: agent_id || contract.actor_id, strict: true }), readArtifact: ({ artifact_name, agent_id }) => readCentralArtifactPayload({ run_id: run.run_id, artifact_name, agent_id: agent_id || contract.actor_id, cache: {} }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.actor_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runLegalCartographyIndexJob({ run, persistencePhase, internalJobId, contract, central }) { const artifacts = await readArtifactsForCentralJob({ run_id: run.run_id, reads: contract.reads, agent_id: contract.agent_id || contract.actor_id, strict: false }); const allArtifacts = { ...artifacts, ...(await loadLegalDocArtifacts({ run_id: run.run_id, artifacts, agent_id: contract.agent_id || contract.actor_id })) }; const result = await runLegalCartographyHybridOrchestrator({ run, artifacts: allArtifacts, runSemanticModel: ({ run: modelRun, artifacts: modelArtifacts, expected_artifact_name }) => runM9SemanticModel({ run: modelRun, artifacts: modelArtifacts, expectedArtifactName: expected_artifact_name, contract, central, internalJobId }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id || contract.actor_id, artifact_name, artifact, lock_status })), validateFinalIndex: validateLegalCartographyIndex, logger: (message) => logEvent({ run_id: run.run_id, event_type: "M9_LEGAL_CARTOGRAPHY_NOTE", actor: contract.agent_id || contract.actor_id, payload: { message } }) }); const status = result.final_validation?.status === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS"; await lockCentralPhase({ run, persistencePhase, contract, status, nextPhase: contract.next, central }); }
async function runM9SemanticModel({ run, artifacts, expectedArtifactName, contract, central, internalJobId }) { const prompt = await buildPhasePrompt({ prompt_files: contract.prompt_files, phase: internalJobId, run, artifacts, writes: [expectedArtifactName], references: contract.references || [] }); return (await callProviderJson({ prompt, phase: central.central_phase_id })).json; }
async function runTargetProfileReviewRuntimeJob(args) { const { run, persistencePhase, internalJobId, contract, central } = args; const result = await runTargetProfileReviewPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), buildPrompt: (p) => buildPhasePrompt(p), callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runDomainDerivationRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runDomainDerivationPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id, strict }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict }), buildPrompt: (p) => buildPhasePrompt(p), callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id || contract.actor_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runTargetProfileForensicsRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runTargetProfileForensicsPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id || contract.actor_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runActivityCandidateInventoryRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runActivityCandidateInventoryPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id || contract.actor_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runActivityProfileReviewRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runActivityProfileReviewPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), buildPrompt: (p) => buildPhasePrompt(p), callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runActivityProfileForensicsRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runActivityProfileForensicsPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id || contract.actor_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runDataProvenanceProfileRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runDataProvenanceProfilePhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), buildPrompt: (p) => buildPhasePrompt(p), callProvider: ({ prompt, phase }) => callProviderJson({ prompt, phase }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id || contract.actor_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runDapForensicsRuntimeJob({ run, persistencePhase, internalJobId, contract, central }) { const result = await runDapForensicsPhase({ run, internalJobId, contract, readArtifacts: ({ reads, agent_id }) => readArtifactsForCentralJob({ run_id: run.run_id, reads, agent_id, strict: true }), saveArtifact: async ({ artifact_name, artifact, lock_status }) => saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.agent_id || contract.actor_id, artifact_name, artifact, lock_status })) }); await lockCentralPhase({ run, persistencePhase, contract, status: result.phase_lock_status, nextPhase: nextForStatus(result.phase_lock_status, contract, persistencePhase), central }); }
async function runExposureProfileJob({ run, persistencePhase, contract, central }) { await runExposureProfileOrchestrator({ run, phase: persistencePhase, contract }); await lockCentralPhase({ run, persistencePhase, contract, status: "LOCKED_WITH_LIMITATIONS", nextPhase: contract.next, central }); }
async function runOperatorChallengeJob({ run, persistencePhase, contract, central }) { const artifacts = await readArtifactsForCentralJob({ run_id: run.run_id, reads: contract.reads, agent_id: contract.actor_id, strict: false }); const output = buildOperatorChallengeGate({ run, artifacts }); const artifact = output[ART.challengeGate] || output.challenge_gate; await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.actor_id, artifact_name: ART.challengeGate, artifact, lock_status: artifact.status || "LOCKED" })); await lockCentralPhase({ run, persistencePhase, contract, status: artifact.status || "LOCKED", nextPhase: contract.next, central }); }
async function runCompilerJob({ run, persistencePhase, contract, central }) { const artifacts = await readArtifactsForCentralJob({ run_id: run.run_id, reads: contract.reads, agent_id: contract.actor_id, strict: false }); const output = compileFinalOutputHandoff({ run, artifacts }); await saveOutputArtifacts({ run, persistencePhase, actor: contract.actor_id, writes: contract.writes, output, lock_status: "LOCKED_WITH_LIMITATIONS" }); await lockCentralPhase({ run, persistencePhase, contract, status: "LOCKED_WITH_LIMITATIONS", nextPhase: contract.next, central }); }
async function runReportRendererJob({ run, persistencePhase, contract, central }) { const artifacts = await readArtifactsForCentralJob({ run_id: run.run_id, reads: contract.reads, agent_id: contract.actor_id, strict: false }); const output = buildRendererPayload({ run, final_output_handoff: artifacts, [ART.final]: artifacts[ART.final] }); await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: contract.actor_id, artifact_name: ART.renderer, artifact: output[ART.renderer], lock_status: "COMPLETE" })); await lockCentralPhase({ run, persistencePhase, contract, status: "COMPLETE", nextPhase: contract.next, central, final_report_url: buildReportUrl(run.run_id) }); }
async function runModelProfileJob({ run, persistencePhase, internalJobId, contract, central }) { const artifacts = await readArtifactsForCentralJob({ run_id: run.run_id, reads: contract.reads, agent_id: contract.agent_id, strict: true }); const prompt = await buildPhasePrompt({ prompt_file: contract.prompt_file, prompt_files: contract.prompt_files, phase: internalJobId, run, artifacts, writes: contract.writes, references: contract.references || [] }); const result = await callProviderJson({ prompt, phase: central.central_phase_id }); const output = result.json || {}; if (internalJobId === JOB.targetProfileReview) validateTargetProfileOutput(output, { phase: internalJobId }); if (internalJobId === JOB.activityProfileReview) validateActivityProfileOutput(output, { phase: internalJobId }); await saveOutputArtifacts({ run, persistencePhase, actor: contract.agent_id, writes: contract.writes, output, lock_status: "LOCKED_WITH_LIMITATIONS" }); await lockCentralPhase({ run, persistencePhase, contract, status: "LOCKED_WITH_LIMITATIONS", nextPhase: contract.next, central }); }
async function saveDeterministicArtifacts({ run, persistencePhase, actor, writes = [], output, optional_writes = [], dynamic_writes = [] }) { await saveOutputArtifacts({ run, persistencePhase, actor, writes, output, lock_status: "LOCKED", optional_writes, dynamic_writes }); }
async function saveOutputArtifacts({ run, persistencePhase, actor, writes = [], output = {}, lock_status, optional_writes = [], dynamic_writes = [] }) { const keys = Object.keys(output || {}); for (const name of writes) await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: actor, artifact_name: name, artifact: output[name], lock_status })); for (const name of optional_writes) if (output[name]) await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: actor, artifact_name: name, artifact: output[name], lock_status })); for (const permission of dynamic_writes) for (const name of keys.filter((key) => artifactMatchesPermission(key, permission))) await saveArtifact(artifactSaveBody({ run_id: run.run_id, phase: persistencePhase, agent_id: actor, artifact_name: name, artifact: output[name], lock_status })); }

async function readArtifactsForCentralJob({ run_id, reads = [], agent_id, strict = true }) {
  const artifacts = {};
  const cache = {};
  for (const artifact_name of reads || []) {
    if (String(artifact_name).includes("{")) continue;
    try {
      artifacts[artifact_name] = await readCentralArtifactPayload({ run_id, artifact_name, agent_id, cache });
    } catch (error) {
      if (strict) throw error;
      artifacts[artifact_name] = null;
    }
  }
  return artifacts;
}

async function readCentralArtifactPayload({ run_id, artifact_name, agent_id, cache = {} }) {
  if (!isLosslessRootBaseArtifactName(artifact_name)) return readArtifactPayload({ run_id, artifact_name, agent_id });
  return resolveLosslessRootArtifact({ run_id, artifact_name, agent_id, cache });
}

async function resolveLosslessRootArtifact({ run_id, artifact_name, agent_id, cache = {} }) {
  const root = artifact_name.match(LOSSLESS_ROOT_BASE_ARTIFACT_PATTERN)?.[1] || artifact_name.replace(/^lossless_root__/, "");
  const index = await readSourceFamilyIndexForRootResolver({ run_id, agent_id, cache });
  const entry = index?.root_artifact_manifest?.[root];

  if (!entry) return fallbackPhysicalRootOrEmpty({ run_id, artifact_name, agent_id, root, reason: "ROOT_MANIFEST_ENTRY_MISSING" });
  const required = Array.isArray(entry.required_artifacts) ? entry.required_artifacts.filter(Boolean) : [];
  if (!required.length) return emptyResolvedRoot({ artifact_name, root, entry, reason: entry.status || "UNSAVED_EMPTY" });

  const physicalArtifacts = [];
  for (const physicalName of required) physicalArtifacts.push(await readArtifactPayload({ run_id, artifact_name: physicalName, agent_id }));
  const ordered = physicalArtifacts
    .map((artifact, index) => ({ artifact, index }))
    .sort((a, b) => Number(a.artifact?.shard_index || a.index + 1) - Number(b.artifact?.shard_index || b.index + 1));
  const base = ordered[0]?.artifact || {};
  const sources = ordered.flatMap(({ artifact }) => Array.isArray(artifact?.sources) ? artifact.sources : []);
  return {
    ...base,
    artifact_name,
    common_root: root,
    root_virtual_artifact_name: artifact_name,
    storage_mode: required.length > 1 ? "RESOLVED_ROOT_SHARDS" : (base.storage_mode || entry.status || "SINGLE"),
    physical_artifact_names: required,
    root_resolution: { status: "COMPLETE", common_root: root, root_manifest_status: entry.status || "UNKNOWN", required_artifacts: required, loaded_artifacts: required, required_together: required.length > 1, source_text_cutting_allowed: false },
    sources,
    manifest_only_sources: ordered.flatMap(({ artifact }) => artifact?.manifest_only_sources || []),
    metadata_only_sources: ordered.flatMap(({ artifact }) => artifact?.metadata_only_sources || []),
    legal_document_sources: ordered.flatMap(({ artifact }) => artifact?.legal_document_sources || []),
    rejected_sources: ordered.flatMap(({ artifact }) => artifact?.rejected_sources || []),
    missing_limited_primary_sources: ordered.flatMap(({ artifact }) => artifact?.missing_limited_primary_sources || []),
    corpus_forensics: { ...(base.corpus_forensics || {}), total_sources: sources.length, resolved_physical_artifacts: required.length, virtual_root_resolution: true },
    dedupe_forensics: ordered.find(({ artifact }) => Object.keys(artifact?.dedupe_forensics || {}).length)?.artifact.dedupe_forensics || base.dedupe_forensics || {}
  };
}

async function readSourceFamilyIndexForRootResolver({ run_id, agent_id, cache = {} }) {
  if (cache.source_family_index !== undefined) return cache.source_family_index;
  try {
    cache.source_family_index = await readArtifactPayload({ run_id, artifact_name: "source_family_index", agent_id });
  } catch {
    cache.source_family_index = null;
  }
  return cache.source_family_index;
}

async function fallbackPhysicalRootOrEmpty({ run_id, artifact_name, agent_id, root, reason }) {
  try { return await readArtifactPayload({ run_id, artifact_name, agent_id }); }
  catch { return emptyResolvedRoot({ artifact_name, root, reason }); }
}

function emptyResolvedRoot({ artifact_name, root, entry = {}, reason }) {
  return {
    artifact_name,
    common_root: root,
    root_virtual_artifact_name: artifact_name,
    storage_mode: entry.status || "UNSAVED_EMPTY",
    physical_artifact_names: [],
    root_resolution: { status: "UNSAVED_EMPTY", common_root: root, reason, required_artifacts: [], source_text_cutting_allowed: false },
    sources: [],
    manifest_only_sources: [],
    metadata_only_sources: [],
    legal_document_sources: [],
    rejected_sources: [],
    missing_limited_primary_sources: [],
    corpus_forensics: { total_sources: 0, resolved_physical_artifacts: 0, virtual_root_resolution: true },
    dedupe_forensics: {}
  };
}

function isLosslessRootBaseArtifactName(value) { return LOSSLESS_ROOT_BASE_ARTIFACT_PATTERN.test(String(value || "")); }
async function loadLegalDocArtifacts({ run_id, artifacts, agent_id }) { const docs = artifacts.legal_doc_inventory?.documents_found || []; const loaded = {}; for (const doc of Array.isArray(docs) ? docs : []) { const name = doc.artifact_name; if (!name || loaded[name]) continue; try { loaded[name] = await readArtifactPayload({ run_id, artifact_name: name, agent_id }); } catch { loaded[name] = null; } } return loaded; }
function buildReportUrl(runId) { return `/interface-diligence/diligence-system/report.html?run_id=${encodeURIComponent(runId)}`; }
