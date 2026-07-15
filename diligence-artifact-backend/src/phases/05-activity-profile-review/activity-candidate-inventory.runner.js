import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT } from "./activity-candidate-inventory.contract.js";
import {
  BASE_ACTIVITY_EVIDENCE_ROOTS,
  CANDIDATE_CREATION_LOCATOR_MAPS,
  CONTEXT_ONLY_LOCATOR_MAPS,
  SEMANTIC_SUPPORT_RECEIPT_FIELDS
} from "./activity-profile.constants.js";
import {
  buildFeatureCandidateInventoryBaseline,
  validateFeatureCandidateInventoryIndex
} from "./services/activity-candidate-inventory-index.builder.js";
import {
  buildSemanticSupportUnavailableReceipt,
  reconcileSemanticCandidateSupport
} from "./services/activity-candidate-inventory-semantic-support.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";

const NEW_LAYER1_PROMPT = "03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC_LED_SEMANTIC_SUPPORTED.md";
const OLD_LAYER1_PROMPT = "03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md";
const LIMITATION_LOCK_STATUSES = new Set(["UNAVAILABLE", "OUTPUT_REJECTED"]);
const MALFORMED_PROVIDER_ERROR = /(invalid|malformed|parse|json|schema|response format)/i;

export const ACTIVITY_CANDIDATE_INVENTORY_RUNNER_STATUS = Object.freeze({
  phase_runner: "activity-candidate-inventory.runner",
  central_phase_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id,
  phase_job_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.phase_job_id,
  public_label: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.public_label,
  compatibility_internal_job_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.compatibility_internal_job_id,
  phase_owned_runner: true,
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  deterministic_baseline_required: true,
  semantic_support_attempt_required: true,
  semantic_support_non_blocking: true,
  semantic_output_non_authoritative: true,
  deterministic_reconciliation_required: true,
  lossless_primary_evidence_navigated_via_index: true,
  phase2g_route_scoped_runtime_reader_active: true,
  profile_forensics_inputs_forbidden: true,
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
  const routePacket = artifacts.phase_route_runtime_packet;

  assertRoutePacket(routePacket, internalJobId);
  assertActivityProfileSourceIndexPresent(artifacts.activity_profile_source_index);
  assertPackageContextPresent(artifacts);

  const losslessUnitsByRoot = selectAuthorizedLosslessRoots(artifacts);
  const deterministicBaseline = buildFeatureCandidateInventoryBaseline(
    artifacts.activity_profile_source_index,
    losslessUnitsByRoot,
    {
      runId: run?.run_id || run?.id || null,
      activeRunPackageManifest: artifacts.active_run_package_manifest,
      domainDerivationProfile: artifacts.domain_derivation_profile
    }
  );
  assertInventoryValidation(deterministicBaseline, "DETERMINISTIC_BASELINE");

  const locatorRows = collectLocatorRows(artifacts.activity_profile_source_index);
  const mappedUnitIds = collectMappedUnitIds(deterministicBaseline);
  const permittedEvidenceRoots = [...(deterministicBaseline.deterministic_baseline_metadata?.evidence_roots_opened || [])];
  const routedArtifactNames = collectRoutedArtifactNames({
    routePacket,
    losslessUnitsByRoot
  });
  const mappedRoutedUnits = collectMappedRoutedUnits({
    deterministicBaseline,
    losslessUnitsByRoot
  });

  let finalInventory;
  let semanticReceipt;
  let modelMetadata = {};
  let semanticError = null;

  const prompt = await buildPrompt({
    prompt_files: contract.prompt_files,
    phase: internalJobId,
    run,
    artifacts: {
      semantic_support_runtime_packet: {
        route_id: routed.route.route_id,
        bucket_id: routed.route.bucket_id,
        routing_authority: routePacket.routing_authority,
        lossless_evidence_role: routePacket.lossless_evidence_role,
        index_role: routePacket.index_role,
        deterministic_baseline: deterministicBaseline,
        index_locator_rows: locatorRows,
        mapped_routed_units: mappedRoutedUnits,
        routed_artifact_names: routedArtifactNames,
        index_mapped_unit_ids: mappedUnitIds,
        permitted_evidence_roots: permittedEvidenceRoots,
        package_taxonomy_supplied: false
      }
    },
    writes: [],
    references: []
  });

  let providerResult;
  try {
    providerResult = await callProvider({
      prompt,
      phase: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id
    });
  } catch (error) {
    semanticError = error;
    if (MALFORMED_PROVIDER_ERROR.test(String(error?.message || ""))) {
      const rejected = reconcileSemanticCandidateSupport({
        deterministicBaseline,
        semanticProposalInput: {},
        routedArtifactNames,
        indexLocatorRows: locatorRows,
        indexMappedUnitIds: mappedUnitIds,
        permittedEvidenceRoots
      });
      finalInventory = rejected.inventory;
      semanticReceipt = rejected.receipt;
    } else {
      semanticReceipt = buildSemanticSupportUnavailableReceipt({
        deterministicBaseline,
        limitation: "SEMANTIC_SUPPORT_PROVIDER_UNAVAILABLE"
      });
      finalInventory = Object.freeze({
        ...deterministicBaseline,
        semantic_support_receipt: semanticReceipt
      });
    }
  }

  if (!semanticReceipt) {
    modelMetadata = providerResult?.metadata || {};
    const semanticProposalInput = providerResult?.json ?? providerResult ?? {};
    const reconciled = reconcileSemanticCandidateSupport({
      deterministicBaseline,
      semanticProposalInput,
      routedArtifactNames,
      indexLocatorRows: locatorRows,
      indexMappedUnitIds: mappedUnitIds,
      permittedEvidenceRoots
    });
    finalInventory = reconciled.inventory;
    semanticReceipt = reconciled.receipt;
  }

  assertSemanticReceipt(semanticReceipt);
  assertInventoryValidation(finalInventory, "FINAL_RECONCILED_INVENTORY");

  const phaseLockStatus = resolvePhaseLockStatus({
    deterministicBaseline,
    semanticReceipt
  });
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
    semantic_support_status: semanticReceipt.status,
    semantic_support_attempted: semanticReceipt.attempted,
    semantic_support_error: semanticError?.message || "",
    model_metadata: modelMetadata,
    deterministic_baseline_required: true,
    semantic_support_attempt_required: true,
    semantic_support_non_blocking: true,
    semantic_output_non_authoritative: true,
    deterministic_reconciliation_required: true,
    lossless_primary_evidence_navigated_via_index: true,
    activity_candidate_inventory_phase_runner_used: true,
    source_helper: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_baseline_job.source_helper,
    validator: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.deterministic_baseline_job.validator,
    internal_job_id: internalJobId
  };
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
  const promptFiles = contract.prompt_files || [];
  if (!promptFiles.some((file) => String(file).endsWith(NEW_LAYER1_PROMPT))) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_NEW_SEMANTIC_PROMPT_MISSING");
  }
  if (promptFiles.some((file) => String(file).endsWith(OLD_LAYER1_PROMPT))) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_OLD_DETERMINISTIC_PROMPT_ACTIVE");
  }
  if ((contract.references || []).length) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_TAXONOMY_REFERENCES_FORBIDDEN");
  }
}

function assertRoutePacket(packet = {}, internalJobId) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_PHASE2G_AUTHORITY_MISSING");
  }
  if (packet.internal_job_id !== internalJobId) {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  }
  if (packet.route_id !== "ROUTE.PHASE5.ACTIVITY_PROFILE" || packet.bucket_id !== "2C_BUCKET_ACTIVITY_PROFILE") {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_PHASE2G_ROUTE_MISMATCH:${packet.route_id || "missing"}:${packet.bucket_id || "missing"}`);
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

function selectAuthorizedLosslessRoots(artifacts = {}) {
  return Object.freeze(Object.fromEntries(
    BASE_ACTIVITY_EVIDENCE_ROOTS
      .filter((root) => artifacts[root] && typeof artifacts[root] === "object" && !Array.isArray(artifacts[root]))
      .map((root) => [root, artifacts[root]])
  ));
}

function collectLocatorRows(index = {}) {
  const rows = [];
  for (const mapKey of [...CANDIDATE_CREATION_LOCATOR_MAPS, ...CONTEXT_ONLY_LOCATOR_MAPS]) {
    for (const row of Array.isArray(index[mapKey]) ? index[mapKey] : []) {
      if (!row || typeof row !== "object" || Array.isArray(row)) continue;
      rows.push(Object.freeze({
        source_locator_map: mapKey,
        source_artifact: String(row.source_artifact || row.common_root || row.source_root || ""),
        source_id: String(row.source_id || ""),
        source_root: String(row.common_root || row.source_root || row.root_artifact || ""),
        route_class: String(row.route_class || ""),
        route_code: String(row.route_code || ""),
        locator_id: String(row.locator_id || ""),
        unit_id: String(row.unit_id || ""),
        source_pointer: row.source_pointer ?? null,
        unit_pointer: row.unit_pointer ?? null,
        candidate_creation_allowed: row.candidate_creation_allowed !== false,
        context_only: row.context_only === true,
        matched_signal_labels: Array.isArray(row.matched_signal_labels)
          ? row.matched_signal_labels.map((value) => String(value || "")).filter(Boolean)
          : []
      }));
    }
  }
  return Object.freeze(rows);
}

function collectMappedUnitIds(inventory = {}) {
  return Object.freeze(uniqueStrings([
    ...(inventory.raw_feature_hit_index || []).map((row) => row?.source_pointer?.unit_id),
    ...(inventory.context_pointer_index || []).map((row) => row?.unit_id)
  ]));
}

function collectRoutedArtifactNames({ routePacket = {}, losslessUnitsByRoot = {} } = {}) {
  const names = [...(routePacket.delivered_artifacts || [])];
  for (const [rootName, payload] of Object.entries(losslessUnitsByRoot)) {
    names.push(rootName, payload?.artifact_name, payload?.root_virtual_artifact_name);
    names.push(...(Array.isArray(payload?.physical_artifact_names) ? payload.physical_artifact_names : []));
  }
  return Object.freeze(uniqueStrings(names));
}

function collectMappedRoutedUnits({ deterministicBaseline = {}, losslessUnitsByRoot = {} } = {}) {
  const units = [];
  for (const rawHit of deterministicBaseline.raw_feature_hit_index || []) {
    const sourceRoot = rawHit?.source_root;
    const structuralPath = rawHit?.evidence_unit_ref?.structural_path;
    const payload = losslessUnitsByRoot[sourceRoot];
    const evidenceUnit = resolveStructuralPath(payload, structuralPath);
    if (!evidenceUnit || typeof evidenceUnit !== "object") continue;
    units.push(Object.freeze({
      raw_hit_id: rawHit.raw_hit_id,
      source_root: sourceRoot,
      evidence_unit_ref: rawHit.evidence_unit_ref,
      source_pointer: rawHit.source_pointer,
      evidence_unit: evidenceUnit
    }));
  }
  return Object.freeze(units);
}

function resolveStructuralPath(payload, structuralPath) {
  if (!payload || typeof payload !== "object") return null;
  const path = String(structuralPath || "");
  if (!path || path === "$root") return payload;
  if (!path.startsWith("$root")) return null;
  const tokens = [];
  const remainder = path.slice(5);
  const matcher = /\.([^.[\]]+)|\[(\d+)\]/g;
  let match;
  while ((match = matcher.exec(remainder))) {
    tokens.push(match[1] !== undefined ? match[1] : Number(match[2]));
  }
  let current = payload;
  for (const token of tokens) {
    if (current === null || current === undefined) return null;
    current = current[token];
  }
  return current ?? null;
}

function assertSemanticReceipt(receipt = {}) {
  const actual = Object.keys(receipt).sort();
  const expected = [...SEMANTIC_SUPPORT_RECEIPT_FIELDS].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_RECEIPT_FIELD_SET_MISMATCH:${JSON.stringify({ actual, expected })}`);
  }
  if (receipt.attempted !== true) {
    throw new Error("ACTIVITY_CANDIDATE_INVENTORY_SEMANTIC_ATTEMPT_NOT_RECORDED");
  }
}

function assertInventoryValidation(inventory, stage) {
  const validation = validateFeatureCandidateInventoryIndex(inventory);
  if (validation.status !== "PASS") {
    throw new Error(`ACTIVITY_CANDIDATE_INVENTORY_${stage}_VALIDATION_FAILED:${JSON.stringify(validation)}`);
  }
}

function resolvePhaseLockStatus({ deterministicBaseline = {}, semanticReceipt = {} } = {}) {
  if ((deterministicBaseline.index_limitations || []).length) return "LOCKED_WITH_LIMITATIONS";
  if (LIMITATION_LOCK_STATUSES.has(semanticReceipt.status)) return "LOCKED_WITH_LIMITATIONS";
  return "LOCKED";
}

function uniqueStrings(values) {
  return [...new Set((values || []).flat(Infinity).map((value) => String(value || "").trim()).filter(Boolean))];
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
