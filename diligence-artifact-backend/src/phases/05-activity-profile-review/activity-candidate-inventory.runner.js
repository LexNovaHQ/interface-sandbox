import {
  ACTIVITY_CANDIDATE_INVENTORY_CONTRACT,
  ACTIVITY_CANDIDATE_SEMANTIC_PROMPT_FILES
} from "./activity-candidate-inventory.contract.js";
import {
  buildFeatureCandidateInventoryBaseline,
  validateFeatureCandidateInventoryIndex
} from "./services/activity-candidate-inventory-index.builder.js";
import {
  buildSemanticSupportReceipt,
  buildSemanticSupportUnavailableReceipt,
  reconcileSemanticCandidateSupport
} from "./services/activity-candidate-inventory-semantic-support.js";
import {
  BASE_ACTIVITY_EVIDENCE_ROOTS,
  CANDIDATE_CREATION_LOCATOR_MAPS,
  CONTEXT_ONLY_LOCATOR_MAPS
} from "./activity-profile.constants.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";

const DEGRADED_SEMANTIC_STATUSES = new Set(["UNAVAILABLE", "OUTPUT_REJECTED"]);

export const ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS = Object.freeze({
  phase_runner: "activity-candidate-inventory.runner",
  central_phase_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id,
  phase_job_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.phase_job_id,
  public_label: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.public_label,
  compatibility_internal_job_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.compatibility_internal_job_id,
  phase_owned_runner: true,
  production_entrypoint_switched: false,
  central_runtime_callback_injection_deferred: true,
  global_production_deployment_switched: false,
  model_usage: "DETERMINISTIC_LED_SEMANTIC_SUPPORTED",
  deterministic_baseline_builder: "buildFeatureCandidateInventoryBaseline",
  semantic_support_service: "activity-candidate-inventory-semantic-support",
  semantic_prompt_files: ACTIVITY_CANDIDATE_SEMANTIC_PROMPT_FILES,
  phase2g_activity_profile_source_index_required: true,
  phase2g_route_scoped_runtime_reader_active: true,
  profile_forensics_inputs_forbidden: true,
  raw_phase1_family_reads_removed: true,
  writes: [...ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_baseline_job.writes],
  routing_manifest_read: "phase_routing_manifest"
});

export async function runActivityCandidateInventoryPhase({
  run,
  internalJobId = "M8_FEATURE_CANDIDATE_INVENTORY",
  contract,
  readArtifacts,
  buildPrompt,
  callProvider,
  saveArtifact
} = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(buildPrompt, "buildPrompt");
  assertCallback(callProvider, "callProvider");
  assertCallback(saveArtifact, "saveArtifact");

  const routed = await readPhaseRouteRuntimePacket({
    internalJobId,
    readArtifacts,
    consumerAgentId: contract.agent_id || contract.actor_id
  });
  const artifacts = routed.artifacts;
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  assertActivityProfileSourceIndexPresent(artifacts.activity_profile_source_index);
  assertPackageContextPresent(artifacts);

  const losslessUnitsByRoot = Object.fromEntries(
    BASE_ACTIVITY_EVIDENCE_ROOTS
      .filter((root) => artifacts[root] && typeof artifacts[root] === "object")
      .map((root) => [root, artifacts[root]])
  );

  const baseline = buildFeatureCandidateInventoryBaseline(
    artifacts.activity_profile_source_index,
    losslessUnitsByRoot,
    {
      runId: run?.run_id || run?.id || null,
      activeRunPackageManifest: artifacts.active_run_package_manifest,
      domainDerivationProfile: artifacts.domain_derivation_profile
    }
  );

  const baselineValidation = validateFeatureCandidateInventoryIndex(baseline);
  if (baselineValidation.status !== "PASS") {
    throw new Error(`ACTIVITY_CANDIDATE_BASELINE_VALIDATION_FAILED:${JSON.stringify(baselineValidation)}`);
  }

  const semanticContext = buildSemanticPromptContext({
    baseline,
    sourceIndex: artifacts.activity_profile_source_index,
    runtimePacket: artifacts.phase_route_runtime_packet
  });

  let finalInventory;
  let semanticReceipt;
  let modelMetadata = {};

  try {
    const prompt = await buildPrompt({
      prompt_files: ACTIVITY_CANDIDATE_SEMANTIC_PROMPT_FILES,
      phase: internalJobId,
      run,
      artifacts: semanticContext.prompt_artifacts,
      writes: [],
      references: []
    });
    const providerResult = await callProvider({
      prompt,
      phase: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id
    });
    modelMetadata = providerResult?.metadata || {};
    const providerOutput = providerResult?.json ?? providerResult;
    const packet = extractProposalPacket(providerOutput);

    if (!packet.valid) {
      semanticReceipt = buildSemanticSupportReceipt({
        deterministicBaseline: baseline,
        proposalCount: 1,
        acceptedProposalIds: [],
        rejectedProposals: [{
          proposal_id: null,
          rejection_codes: ["MALFORMED_PROPOSAL"]
        }],
        finalInventory: baseline,
        changesApplied: false,
        limitations: ["SEMANTIC_SUPPORT_MALFORMED_RESPONSE"]
      });
      finalInventory = Object.freeze({
        ...baseline,
        semantic_support_receipt: semanticReceipt
      });
    } else {
      const reconciled = reconcileSemanticCandidateSupport({
        deterministicBaseline: baseline,
        proposals: packet.proposals,
        routedArtifactNames: semanticContext.routed_artifact_names,
        indexLocatorRows: semanticContext.index_locator_rows,
        indexMappedUnitIds: semanticContext.index_mapped_unit_ids,
        permittedEvidenceRoots: semanticContext.permitted_evidence_roots
      });
      finalInventory = reconciled.inventory;
      semanticReceipt = reconciled.receipt;
    }
  } catch (error) {
    semanticReceipt = buildSemanticSupportUnavailableReceipt({
      deterministicBaseline: baseline,
      limitation: `SEMANTIC_SUPPORT_UNAVAILABLE:${sanitizeErrorCode(error)}`
    });
    finalInventory = Object.freeze({
      ...baseline,
      semantic_support_receipt: semanticReceipt
    });
  }

  assertInventoryOutputContract(finalInventory);
  const finalValidation = validateFeatureCandidateInventoryIndex(finalInventory);
  if (finalValidation.status !== "PASS") {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_VALIDATION_FAILED:${JSON.stringify(finalValidation)}`);
  }

  const phaseLockStatus = resolvePhaseLockStatus({ baseline, semanticReceipt });
  const artifactName = contract.writes[0];
  await saveArtifact({
    artifact_name: artifactName,
    artifact: finalInventory,
    lock_status: phaseLockStatus
  });

  return {
    ok: true,
    output: { [artifactName]: finalInventory },
    saved_artifacts: [artifactName],
    phase_lock_status: phaseLockStatus,
    artifacts_read: Object.keys(artifacts).sort(),
    phase2g_route_id: routed.route.route_id,
    phase2g_bucket_id: routed.route.bucket_id,
    source_locator_maps_indexed: finalInventory.source_locator_maps_indexed || [],
    raw_hit_count: finalInventory.raw_hit_count,
    canonical_candidate_count: finalInventory.canonical_candidate_count,
    model_usage: "DETERMINISTIC_LED_SEMANTIC_SUPPORTED",
    semantic_support_status: semanticReceipt.status,
    semantic_support_attempted: semanticReceipt.attempted,
    activity_candidate_inventory_phase_runner_used: true,
    model_metadata: modelMetadata,
    internal_job_id: internalJobId
  };
}

function buildSemanticPromptContext({ baseline, sourceIndex, runtimePacket }) {
  const indexLocatorRows = [
    ...CANDIDATE_CREATION_LOCATOR_MAPS.flatMap((mapKey) => rows(sourceIndex?.[mapKey])),
    ...CONTEXT_ONLY_LOCATOR_MAPS.flatMap((mapKey) => rows(sourceIndex?.[mapKey]))
  ];
  const mappedPointers = [
    ...rows(baseline.raw_feature_hit_index).map((row) => row?.source_pointer),
    ...rows(baseline.context_pointer_index),
    ...rows(baseline.candidates).flatMap((candidate) => rows(candidate.source_pointers))
  ].filter((pointer) => pointer && typeof pointer === "object");
  const indexMappedUnitIds = uniqueStrings(mappedPointers.map((pointer) => pointer.unit_id));
  const permittedEvidenceRoots = uniqueStrings(
    baseline?.deterministic_baseline_metadata?.evidence_roots_opened || []
  );
  const routedArtifactNames = uniqueStrings(
    Array.isArray(runtimePacket?.delivered_artifacts) && runtimePacket.delivered_artifacts.length
      ? runtimePacket.delivered_artifacts
      : mappedPointers.map((pointer) => pointer.source_artifact)
  );

  return {
    prompt_artifacts: Object.freeze({
      deterministic_candidate_baseline: baseline,
      routed_index_mapped_pointer_metadata: Object.freeze({
        route_id: runtimePacket?.route_id || "",
        bucket_id: runtimePacket?.bucket_id || "",
        routing_authority: runtimePacket?.routing_authority || "",
        source_index_artifact: "activity_profile_source_index",
        routed_artifact_names: Object.freeze(routedArtifactNames),
        permitted_evidence_roots: Object.freeze(permittedEvidenceRoots),
        index_mapped_unit_ids: Object.freeze(indexMappedUnitIds),
        index_locator_rows: Object.freeze(indexLocatorRows)
      }),
      phase_route_runtime_packet: runtimePacket
    }),
    routed_artifact_names: routedArtifactNames,
    permitted_evidence_roots: permittedEvidenceRoots,
    index_mapped_unit_ids: indexMappedUnitIds,
    index_locator_rows: indexLocatorRows
  };
}

function extractProposalPacket(output) {
  if (Array.isArray(output)) return { valid: true, proposals: output };
  if (!output || typeof output !== "object") return { valid: false, proposals: [] };
  const keys = Object.keys(output);
  if (
    keys.length === 1 &&
    keys[0] === "semantic_candidate_support_proposals" &&
    Array.isArray(output.semantic_candidate_support_proposals)
  ) {
    return { valid: true, proposals: output.semantic_candidate_support_proposals };
  }
  return { valid: false, proposals: [] };
}

function resolvePhaseLockStatus({ baseline, semanticReceipt }) {
  if (DEGRADED_SEMANTIC_STATUSES.has(semanticReceipt?.status)) {
    return "LOCKED_WITH_LIMITATIONS";
  }
  const criticalBaselineLimitation = rows(baseline?.index_limitations).some((limitation) =>
    String(limitation).startsWith("NO_INDEX_MAPPED_ROUTED_LOSSLESS_UNITS_AVAILABLE")
  );
  return criticalBaselineLimitation ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id) {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  }
  if (contract.public_label !== ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_label) {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_PHASE_LABEL_MISMATCH:${contract.public_label || "missing"}`);
  }
  if (!(contract.reads || []).includes("phase_routing_manifest")) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_PHASE2G_MANIFEST_READ_MISSING");
  }
  assertSameArray(
    contract.writes || [],
    ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_baseline_job.writes,
    "ACTIVITY_CANDIDATE_INVENTORY_WRITES"
  );
}

function assertRoutePacket(packet = {}, internalJobId) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_PHASE2G_AUTHORITY_MISSING");
  }
  if (packet.internal_job_id !== internalJobId) {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  }
  if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_LOSSLESS_PRIMARY_BOUNDARY_MISSING");
  }
  if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_INDEX_NAVIGATION_BOUNDARY_MISSING");
  }
  if (packet.profile_forensics_inputs_allowed !== false) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_FORENSICS_INPUT_BOUNDARY_MISSING");
  }
}

function assertActivityProfileSourceIndexPresent(index) {
  if (!index || typeof index !== "object" || Array.isArray(index)) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_MISSING_ACTIVITY_PROFILE_SOURCE_INDEX");
  }
  if (!Array.isArray(index.activity_candidate_source_locator_map)) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_ACTIVITY_SOURCE_INDEX_LOCATORS_MISSING");
  }
}

function assertPackageContextPresent(artifacts = {}) {
  if (!artifacts.domain_derivation_profile || typeof artifacts.domain_derivation_profile !== "object") {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_MISSING_DOMAIN_DERIVATION_PROFILE");
  }
  if (!artifacts.active_run_package_manifest || typeof artifacts.active_run_package_manifest !== "object") {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_MISSING_ACTIVE_RUN_PACKAGE_MANIFEST");
  }
}

function assertInventoryOutputContract(inventory = {}) {
  const required = ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.output_contract;
  for (const branch of required.required_branches) {
    if (!(branch in inventory)) {
      throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_MISSING_BRANCH:${branch}`);
    }
  }
  if (inventory.artifact_type !== required.artifact_type) {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_ARTIFACT_TYPE_MISMATCH:${inventory.artifact_type || "missing"}`);
  }
  if (inventory.inventory_version !== required.inventory_version) {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_VERSION_MISMATCH:${inventory.inventory_version || "missing"}`);
  }
  if (inventory.derivation_mode !== required.derivation_mode) {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_DERIVATION_MODE_MISMATCH:${inventory.derivation_mode || "missing"}`);
  }
  if (inventory.index_boundary?.deterministic_baseline_only !== true) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_BASELINE_BOUNDARY_MISSING");
  }
  if (inventory.index_boundary?.lossless_primary_evidence_read !== true) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_LOSSLESS_PRIMARY_BOUNDARY_MISSING");
  }
  if (inventory.index_boundary?.source_index_is_navigation_only !== true) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_INDEX_NAVIGATION_BOUNDARY_MISSING");
  }
  if (!inventory.semantic_support_receipt || inventory.semantic_support_receipt.attempted !== true) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_SEMANTIC_SUPPORT_RECEIPT_MISSING");
  }
}

function rows(value) {
  return Array.isArray(value) ? value.filter(Boolean) : [];
}

function uniqueStrings(values) {
  return [...new Set(rows(values).map((value) => String(value || "").trim()).filter(Boolean))];
}

function sanitizeErrorCode(error) {
  return String(error?.code || error?.message || "UNKNOWN")
    .toUpperCase()
    .replace(/[^A-Z0-9:_-]+/g, "_")
    .slice(0, 160);
}

function assertSameArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`);
  }
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_RUNNER_MISSING_CALLBACK:${label}`);
  }
}
