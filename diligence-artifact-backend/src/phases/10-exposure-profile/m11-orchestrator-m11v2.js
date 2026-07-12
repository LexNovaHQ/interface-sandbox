import { logEvent } from "../../runtime/services/storage/firestore.service.js";
import { loadReferencePacket } from "../../runtime/services/reference.service.js";
import { lockPhase, readArtifact, readArtifactPayload, saveArtifact } from "../../runtime/services/artifacts.service.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import {
  artifactMatchesPhase10ExecutionFingerprint,
  buildActiveThreatRegistryManifest,
  isCurrentActiveThreatRegistryManifest,
  resolveActiveThreatRegistryContext,
  stampPhase10ExecutionMetadata
} from "./active-threat-registry-manifest.js";
import {
  buildPackageScopedExposureRegistryRoutePlan,
  finalizePhase10RoutingContext,
  PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA
} from "./phase10-classification-routing.js";

const AGENT_5 = "agent_5_exposure_registry";
const ACCEPTED = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);
const ART = Object.freeze({
  manifest: "active_threat_registry_manifest",
  legalIndex: "legal_cartography_index",
  featureMain: "target_feature_profile",
  route: "exposure_registry_route_plan"
});

export const M11_PHASE2G_RUNTIME_STATUS = Object.freeze({
  routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  route_id: "ROUTE.PHASE10.EXPOSURE_PROFILE",
  bucket_id: "2F_BUCKET_LEGAL_CARTOGRAPHY_LEGAL_SIGNALS",
  delivery_mode: "SOURCE_BUCKET_PROFILE",
  lossless_evidence_is_primary: true,
  index_navigation_mandatory: true,
  preceding_forensic_inputs_forbidden: true,
  infrastructure_authority: "CENTRAL_RUNTIME_SERVICES",
  phase_owned_path: "src/phases/10-exposure-profile",
  deterministic_route_stage: "CO_4_CO_5_CO_6_ACTIVE",
  semantic_stage: "PENDING_CO_7_AGENT5_PACKAGE_AND_CO_8_RUNTIME"
});

export async function runM11OrchestratedPhase({ run, phase, contract }) {
  if (!(contract.reads || []).includes("phase_routing_manifest")) throw new Error("M11_PHASE2G_MANIFEST_READ_MISSING");

  const routed = await readPhaseRouteRuntimePacket({
    internalJobId: "M11",
    consumerAgentId: contract.agent_id || AGENT_5,
    readArtifacts: ({ reads, agent_id, strict }) => readArtifactsForM11({
      run_id: run.run_id,
      reads,
      agent_id,
      strict
    })
  });
  const artifacts = routed.artifacts;
  assertM11RoutePacket(artifacts.phase_route_runtime_packet);
  const baseReferencePacket = await loadReferencePacket(contract.references || []);

  let registryContext;
  try {
    const selectedContext = await resolveActiveThreatRegistryContext({
      runId: run.run_id,
      artifacts,
      baseReferencePacket
    });
    registryContext = finalizePhase10RoutingContext({
      registryContext: selectedContext,
      targetFeatureProfile: artifacts[ART.featureMain]
    });
  } catch (error) {
    await logEvent({
      run_id: run.run_id,
      event_type: "M11_AUTO_SELECTOR_OR_CLASSIFICATION_ADAPTER_CONTROLLED_FAILURE",
      actor: AGENT_5,
      payload: {
        error: String(error?.message || error),
        selector_authority: "domain_derivation_profile",
        classification_authority: "target_feature_profile"
      }
    });
    await lockPhase({
      run_id: run.run_id,
      phase,
      agent_id: AGENT_5,
      status: "CONTROLLED_FAILURE",
      next_phase: phase
    });
    return;
  }

  const manifest = await getOrBuildActiveThreatRegistryManifest({
    run,
    phase,
    registryContext
  });
  if (!isAccepted(manifest.lock_status)) {
    await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });
    return;
  }

  const route = await getOrBuildRoutePlan({
    run,
    phase,
    artifacts,
    registryContext,
    manifest: manifest.artifact
  });
  if (!isAccepted(route.lock_status)) {
    await lockPhase({ run_id: run.run_id, phase, agent_id: AGENT_5, status: "CONTROLLED_FAILURE", next_phase: phase });
    return;
  }

  if (!registryContext.semantic_layer_compatibility?.ok) {
    await logEvent({
      run_id: run.run_id,
      event_type: "M11_PACKAGE_SCOPED_ROUTE_PLAN_READY_SEMANTIC_PACKAGE_PENDING",
      actor: AGENT_5,
      payload: {
        primary_package: manifest.artifact.primary_package,
        ai_mount: manifest.artifact.ai_mount,
        mounted_packages: manifest.artifact.mounted_packages,
        phase10_execution_fingerprint: manifest.artifact.phase10_execution_fingerprint,
        classification_inventory_digest: manifest.artifact.phase5_classification_inventory_digest,
        route_plan_schema: route.artifact.schema_version,
        stream_count: route.artifact.stream_plans?.length || 0,
        batch_count: route.artifact.batch_plan?.length || 0,
        maximum_rows_per_batch: route.artifact.batch_plan_validation?.maximum_rows_per_batch || null,
        pending_change_orders: registryContext.semantic_layer_compatibility.pending_change_orders
      }
    });
    await lockPhase({
      run_id: run.run_id,
      phase,
      agent_id: AGENT_5,
      status: "CONTROLLED_FAILURE",
      next_phase: phase
    });
    return;
  }

  throw new Error("M11_SEMANTIC_STAGE_MUST_NOT_RUN_BEFORE_CO_7_AND_CO_8");
}

async function getOrBuildActiveThreatRegistryManifest({ run, phase, registryContext }) {
  const expectedExecutionFingerprint = registryContext.phase10_execution_fingerprint;
  const existing = await readAcceptedCheckpoint({
    run_id: run.run_id,
    artifact_name: ART.manifest
  });
  if (existing && isCurrentActiveThreatRegistryManifest(existing.artifact, expectedExecutionFingerprint)) return existing;

  const output = buildActiveThreatRegistryManifest({ context: registryContext });
  const artifact = output[ART.manifest];
  const lock_status = artifact.validation?.status === "PASS" || artifact.validation?.status === "PASS_WITH_LIMITATION"
    ? "LOCKED"
    : "CONTROLLED_FAILURE";
  await saveArtifact(artifactSaveBody({
    run_id: run.run_id,
    phase,
    agent_id: AGENT_5,
    artifact_name: ART.manifest,
    artifact,
    lock_status
  }));
  return { artifact, lock_status };
}

async function getOrBuildRoutePlan({ run, phase, artifacts, registryContext, manifest }) {
  const expectedExecutionFingerprint = manifest.phase10_execution_fingerprint;
  const existing = await readAcceptedCheckpoint({
    run_id: run.run_id,
    artifact_name: ART.route
  });
  if (
    existing
    && artifactMatchesPhase10ExecutionFingerprint(existing.artifact, expectedExecutionFingerprint)
    && existing.artifact?.schema_version === PACKAGE_SCOPED_ROUTE_PLAN_SCHEMA
  ) return existing;

  const output = buildPackageScopedExposureRegistryRoutePlan({
    registryContext,
    targetFeatureProfile: artifacts[ART.featureMain],
    legalCartographyIndex: artifacts[ART.legalIndex],
    upstreamArtifacts: artifacts,
    runId: run.run_id,
    manifest
  });
  const artifact = stampPhase10ExecutionMetadata(output[ART.route], manifest);
  const lock_status = routePlanLockStatus(artifact.phase_a_validation?.status);
  await saveArtifact(artifactSaveBody({
    run_id: run.run_id,
    phase,
    agent_id: AGENT_5,
    artifact_name: ART.route,
    artifact,
    lock_status
  }));
  return { artifact, lock_status };
}

async function readAcceptedCheckpoint({ run_id, artifact_name }) {
  try {
    const result = await readArtifact({ run_id, artifact_name, agent_id: AGENT_5 });
    return isAccepted(result.lock_status)
      ? { artifact: result.artifact, lock_status: result.lock_status }
      : null;
  } catch (_error) {
    return null;
  }
}

async function readArtifactsForM11({ run_id, reads, agent_id, strict = true }) {
  const artifacts = {};
  for (const artifactName of reads || []) {
    try {
      artifacts[artifactName] = await readArtifactPayload({
        run_id,
        artifact_name: artifactName,
        agent_id
      });
    } catch (error) {
      if (strict) throw error;
      artifacts[artifactName] = null;
    }
  }
  return artifacts;
}

function assertM11RoutePacket(packet = {}) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("M11_PHASE2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== "M11") throw new Error(`M11_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.route_id !== "ROUTE.PHASE10.EXPOSURE_PROFILE") throw new Error(`M11_PHASE2G_ROUTE_MISMATCH:${packet.route_id || "missing"}`);
  if (packet.delivery_mode !== "SOURCE_BUCKET_PROFILE") throw new Error(`M11_PHASE2G_DELIVERY_MODE_MISMATCH:${packet.delivery_mode || "missing"}`);
  if (packet.source_bucket_delivered !== true) throw new Error("M11_PHASE2G_SOURCE_BUCKET_MISSING");
  if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("M11_PHASE2G_LOSSLESS_PRIMARY_MISSING");
  if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("M11_PHASE2G_INDEX_NAVIGATION_MISSING");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("M11_PHASE2G_FORENSICS_INPUT_BOUNDARY_MISSING");
}

function artifactSaveBody({ run_id, phase, agent_id, artifact_name, artifact, lock_status = "LOCKED" }) {
  return { run_id, phase, agent_id, artifact_name, lock_status, artifact };
}

function routePlanLockStatus(status) {
  if (status === "PASS") return "LOCKED";
  if (status === "PASS_WITH_LIMITATION") return "LOCKED_WITH_LIMITATIONS";
  return "CONTROLLED_FAILURE";
}

function isAccepted(status) {
  return ACCEPTED.has(status);
}
