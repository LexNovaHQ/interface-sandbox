import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT } from "./domain-control-obligation-candidate-inventory.contract.js";
import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID
} from "./domain-control-obligation.constants.js";
import { buildDomainControlObligationCandidateInventory } from "./services/domain-control-obligation-candidate-inventory.builder.js";
import { resolveDomainControlObligationTaxonomy } from "./services/domain-control-obligation-taxonomy.resolver.js";
import { assertDomainControlObligationCandidateInventory } from "./validators/domain-control-obligation-candidate-inventory.validator.js";

const NAVIGATION_INDEX_ARTIFACT = "domain_control_obligation_navigation_index";

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_RUNNER_STATUS = Object.freeze({
  phase_runner: "domain-control-obligation-candidate-inventory.runner",
  central_phase_id: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.central_phase_id,
  phase_job_id: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
  phase_owned_runner: true,
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: "NONE_DETERMINISTIC",
  provider_call_allowed: false,
  phase2g_route_scoped_runtime_reader_required: true,
  phase2e_navigation_required: true,
  lossless_evidence_is_primary: true,
  material_field_derivation_allowed: false,
  profile_forensics_inputs_forbidden: true,
  dap_inputs_forbidden: true,
  writes: Object.freeze([DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT])
});

export async function runDomainControlObligationCandidateInventoryPhase({
  run,
  internalJobId = DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID,
  contract = DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT,
  readArtifacts,
  saveArtifact
} = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(saveArtifact, "saveArtifact");

  const routed = await readPhaseRouteRuntimePacket({
    internalJobId,
    readArtifacts,
    consumerAgentId: contract.agent_id || contract.actor_id
  });
  const artifacts = routed.artifacts || {};
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  assertRequiredArtifacts(artifacts);

  const resolvedTaxonomy = await resolveDomainControlObligationTaxonomy({
    activeRunPackageManifest: artifacts.active_run_package_manifest
  });
  const inventory = await buildDomainControlObligationCandidateInventory({
    runId: run?.run_id || run?.id || "",
    activeRunPackageManifest: artifacts.active_run_package_manifest,
    targetFeatureProfile: artifacts.target_feature_profile,
    navigationIndex: artifacts[NAVIGATION_INDEX_ARTIFACT],
    resolvedTaxonomy
  });

  const validation = assertDomainControlObligationCandidateInventory(inventory, {
    resolvedTaxonomy,
    navigationIndex: artifacts[NAVIGATION_INDEX_ARTIFACT],
    targetFeatureProfile: artifacts.target_feature_profile
  });
  const lockStatus = resolveLockStatus(inventory);

  await saveArtifact({
    artifact_name: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
    artifact: inventory,
    lock_status: lockStatus
  });

  return Object.freeze({
    ok: true,
    output: Object.freeze({ [DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT]: inventory }),
    saved_artifacts: Object.freeze([DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT]),
    phase_lock_status: lockStatus,
    internal_job_id: internalJobId,
    phase2g_route_id: routed.route.route_id,
    phase2g_bucket_id: routed.route.bucket_id,
    candidate_count: inventory.candidate_count,
    inventory_limitations: inventory.inventory_limitations,
    resolved_obligation_count: resolvedTaxonomy.resolution_summary?.resolved_obligation_count || 0,
    validation_status: validation.status,
    provider_called: false,
    material_fields_derived: false,
    regulatory_overlay_obligation_rows_created: false,
    phase8_layer1_runner_used: true
  });
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.central_phase_id) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  }
  if (contract.phase_job_id && contract.phase_job_id !== DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_PHASE_JOB_MISMATCH:${contract.phase_job_id}`);
  }
  if (contract.compatibility_internal_job_id && contract.compatibility_internal_job_id !== DOMAIN_CONTROL_OBLIGATION_CANDIDATE_JOB_ID) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INTERNAL_JOB_MISMATCH:${contract.compatibility_internal_job_id}`);
  }
  const reads = contract.reads || contract.deterministic_job?.reads || [];
  if (!reads.includes("phase_routing_manifest")) throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_PHASE_ROUTING_MANIFEST_READ_MISSING");
  const writes = contract.writes || contract.deterministic_job?.writes || [];
  if (writes.length !== 1 || writes[0] !== DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT) {
    throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_WRITES_MISMATCH");
  }
  if (contract.model_usage !== "NONE_DETERMINISTIC") throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_MODEL_USAGE_MISMATCH");
}

function assertRoutePacket(packet = {}, internalJobId) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_P2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== internalJobId) throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ROUTE_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.route_id !== PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID) throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ROUTE_ID_MISMATCH:${packet.route_id || "missing"}`);
  if (packet.bucket_id !== PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID) throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_BUCKET_ID_MISMATCH:${packet.bucket_id || "missing"}`);
  if (packet.source_bucket_delivered !== true) throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_SOURCE_BUCKET_NOT_DELIVERED");
  if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_LOSSLESS_PRIMARY_BOUNDARY_MISSING");
  if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INDEX_NAVIGATION_BOUNDARY_MISSING");
  if (packet.direct_lossless_as_fallback_allowed !== false) throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FALLBACK_FRAMING_FORBIDDEN");
  if (packet.free_corpus_read_allowed !== false) throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FREE_CORPUS_READ_FORBIDDEN");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FORENSICS_INPUT_BOUNDARY_MISSING");
}

function assertRequiredArtifacts(artifacts = {}) {
  for (const artifactName of [NAVIGATION_INDEX_ARTIFACT, "target_feature_profile", "active_run_package_manifest"]) {
    const value = artifacts[artifactName];
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_REQUIRED_ARTIFACT_MISSING:${artifactName}`);
    }
  }
  const profile = unwrapArtifact(artifacts.target_feature_profile, "target_feature_profile");
  if (!Array.isArray(profile.activities)) throw new Error("DOMAIN_CONTROL_OBLIGATION_CANDIDATE_TARGET_FEATURE_ACTIVITIES_MISSING");
}

function resolveLockStatus(inventory = {}) {
  const hasLimitations = Array.isArray(inventory.inventory_limitations) && inventory.inventory_limitations.length > 0;
  const candidateLimitations = (inventory.candidates || []).some((row) => Array.isArray(row.candidate_limitation) && row.candidate_limitation.length > 0);
  return hasLimitations || candidateLimitations ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
}

function unwrapArtifact(value = {}, artifactName) {
  if (value?.[artifactName] && typeof value[artifactName] === "object" && !Array.isArray(value[artifactName])) return value[artifactName];
  if (value?.artifact_type === artifactName) return value;
  return value || {};
}

function assertCallback(value, label) {
  if (typeof value !== "function") throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_MISSING_CALLBACK:${label}`);
}
