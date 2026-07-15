import { DAP_FORENSICS_CONTRACT } from "./dap-forensics.contract.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";

const CONTRACT_NAME = "DAP_SEMANTIC_BATCH_FORENSICS_CONTRACT_V1";
const EXPECTED_BATCH_COUNT = 17;
const EXPECTED_FIELD_COUNT = 150;

export const DAP_FORENSICS_RUNNER_STATUS = Object.freeze({
  phase_runner: "dap-forensics.runner",
  phase2g_route_scoped_runtime_reader_active: true,
  routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
  route_id: "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE",
  delivery_mode: "DERIVED_ONLY",
  source_bucket_delivered: false,
  profile_forensics_inputs_forbidden: true
});

export async function runDapForensicsPhase({ run, internalJobId = "DATA_PROVENANCE_PROFILE_FORENSICS", contract, readArtifacts, saveArtifact } = {}) {
  assertRuntimeContract(contract);
  assertCallback(readArtifacts, "readArtifacts");
  assertCallback(saveArtifact, "saveArtifact");
  const routed = await readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId: contract.agent_id || contract.actor_id });
  const artifacts = routed.artifacts;
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  assertAllowedRuntimeArtifacts(artifacts);
  const profile = buildDapForensicsProfile({ run, artifacts });
  assertDapForensicsProfile(profile.dap_forensics_profile);
  const status = profile.dap_forensics_profile.forensic_lock_gate_result.status === "PASS" ? "LOCKED" : "LOCKED_WITH_LIMITATIONS";
  await saveArtifact({ artifact_name: "dap_forensics_profile", artifact: profile.dap_forensics_profile, lock_status: status });
  return Object.freeze({ ok: true, output: profile, saved_artifacts: ["dap_forensics_profile"], phase_lock_status: status, model_usage: "NONE_DETERMINISTIC", internal_job_id: internalJobId, phase2g_route_id: routed.route.route_id, phase2g_bucket_id: routed.route.bucket_id, phase2g_delivery_mode: routed.route.delivery_mode });
}

export function buildDapForensicsProfile({ run = {}, artifacts = {} } = {}) {
  const navigationIndex = unwrap(artifacts.data_privacy_navigation_index, "data_privacy_navigation_index");
  const routeManifest = unwrap(artifacts.dap_semantic_batch_route_manifest, "dap_semantic_batch_route_manifest");
  const validationManifest = unwrap(artifacts.dap_semantic_batch_validation_manifest, "dap_semantic_batch_validation_manifest");
  const semanticGate = unwrap(artifacts.data_provenance_profile_semantic_batch_gate, "data_provenance_profile_semantic_batch_gate");
  const packets = Array.isArray(routeManifest.batch_route_packets) ? routeManifest.batch_route_packets : [];
  const batchTraceIndex = packets.map((packet) => buildBatchTrace({ packet, artifacts, validationManifest }));
  const fieldTraceIndex = batchTraceIndex.flatMap((batch) => batch.field_trace_rows || []);
  const missingBatchArtifacts = batchTraceIndex.filter((row) => !row.batch_artifact_present).map((row) => row.expected_artifact_name);
  const missingFieldIds = batchTraceIndex.flatMap((row) => row.missing_field_ids || []);
  const duplicateFieldIds = duplicated(fieldTraceIndex.map((row) => row.field_id).filter(Boolean));
  const status = missingBatchArtifacts.length || missingFieldIds.length || duplicateFieldIds.length || semanticGate.status !== "PASS" ? "LOCKED_WITH_LIMITATIONS" : "PASS";
  return Object.freeze({ dap_forensics_profile: Object.freeze({
    artifact_type: "dap_forensics_profile",
    profile_version: "phase8_dap_forensics_profile_v2_phase2g_derived_only",
    run_id: run.run_id || "UNKNOWN_RUN",
    phase_id: "DATA_PROVENANCE_FORENSICS",
    source_boundary: "PHASE2G_DERIVED_ONLY_PHASE7_LOCKED_ARTIFACTS",
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    route_id: "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE",
    forensic_contract: Object.freeze({ contract_name: CONTRACT_NAME, trace_scope: "Phase 7 DAP navigation index, route manifest, 17 DAP batch artifacts, validation manifest, and semantic batch gate", source_of_truth: "saved_phase7_artifacts_delivered_by_phase2g", model_generated_forensics_allowed: false, deterministic_forensic_profile: true }),
    forensic_boundary: Object.freeze({ material_profile_re_emitted: false, semantic_forensic_profile_retired: true, old_m10_forensics_reused: false, four_b_four_c_reused: false, source_bucket_delivered: false, artifact_name: "dap_forensics_profile" }),
    phase7_source_artifacts: Object.freeze(["data_privacy_navigation_index", "dap_semantic_batch_route_manifest", ...packets.map((packet) => packet.expected_artifact_name).filter(Boolean), "dap_semantic_batch_validation_manifest", "data_provenance_profile_semantic_batch_gate"]),
    navigation_index_trace: Object.freeze({ present: Boolean(navigationIndex && navigationIndex.artifact_type), artifact_type: navigationIndex.artifact_type || "NOT_REPORTED", validation_status: navigationIndex.validation_quality_control_result?.status || "NOT_REPORTED" }),
    semantic_route_manifest_trace: Object.freeze({ present: Boolean(routeManifest && routeManifest.artifact_type), route_packet_count: packets.length, expected_batch_count: EXPECTED_BATCH_COUNT, expected_field_count: packets.flatMap((packet) => packet.expected_field_ids || []).length }),
    batch_trace_index: Object.freeze(batchTraceIndex),
    material_profile_trace_index: Object.freeze(fieldTraceIndex),
    field_trace_index: Object.freeze(fieldTraceIndex),
    route_coverage_trace_index: Object.freeze(buildRouteCoverage({ packets, fieldTraceIndex })),
    limitation_trace_index: Object.freeze(buildLimitations({ semanticGate, validationManifest, missingBatchArtifacts, missingFieldIds, duplicateFieldIds })),
    validation_manifest_trace: Object.freeze({ present: Boolean(validationManifest && validationManifest.artifact_type), status: validationManifest.validation_quality_control_result?.status || "NOT_REPORTED", expected_batch_count: validationManifest.expected_batch_count || 0, observed_batch_count: validationManifest.observed_batch_count || 0, expected_field_count: validationManifest.expected_field_count || 0, observed_field_count: validationManifest.observed_field_count || 0 }),
    semantic_batch_gate_trace: Object.freeze({ present: Boolean(semanticGate && semanticGate.artifact_type), status: semanticGate.status || "NOT_REPORTED", all_batches_present: semanticGate.all_batches_present === true, all_fields_covered_once: semanticGate.all_fields_covered_once === true, non_blocking_repair_required: semanticGate.non_blocking_repair_required === true, blocking_failure: semanticGate.blocking_failure === true }),
    forensic_lock_gate_result: Object.freeze({ status, expected_batch_count: EXPECTED_BATCH_COUNT, observed_batch_count: batchTraceIndex.filter((row) => row.batch_artifact_present).length, expected_field_count: EXPECTED_FIELD_COUNT, observed_field_count: fieldTraceIndex.length, missing_batch_artifacts: Object.freeze(missingBatchArtifacts), missing_field_ids: Object.freeze(missingFieldIds), duplicate_field_ids: Object.freeze(duplicateFieldIds), blocking_failure: false, non_blocking_repair_required: status !== "PASS" }),
    validation_quality_control_result: Object.freeze({ status, blocking_failure: false, non_blocking_repair_required: status !== "PASS" })
  }) });
}

function assertRuntimeContract(contract = {}) { if (contract.central_phase_id !== DAP_FORENSICS_CONTRACT.central_phase_id) throw new Error(`DAP_FORENSICS_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`); if (!(contract.reads || []).includes("phase_routing_manifest")) throw new Error("DAP_FORENSICS_PHASE2G_MANIFEST_READ_MISSING"); assertSameArray(contract.writes || [], DAP_FORENSICS_CONTRACT.deterministic_job.writes, "DAP_FORENSICS_WRITES"); }
function assertRoutePacket(packet = {}, internalJobId) { if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("DAP_FORENSICS_PHASE2G_AUTHORITY_MISSING"); if (packet.internal_job_id !== internalJobId) throw new Error(`DAP_FORENSICS_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`); if (packet.route_id !== "ROUTE.PHASE7.DATA_PROVENANCE_PROFILE") throw new Error(`DAP_FORENSICS_PHASE2G_ROUTE_MISMATCH:${packet.route_id || "missing"}`); if (packet.delivery_mode !== "DERIVED_ONLY") throw new Error(`DAP_FORENSICS_PHASE2G_DELIVERY_MODE_MISMATCH:${packet.delivery_mode || "missing"}`); if (packet.source_bucket_delivered !== false) throw new Error("DAP_FORENSICS_SOURCE_BUCKET_MUST_NOT_BE_DELIVERED"); if (packet.profile_forensics_inputs_allowed !== false) throw new Error("DAP_FORENSICS_FORENSICS_INPUT_BOUNDARY_MISSING"); }
function assertAllowedRuntimeArtifacts(artifacts = {}) { const allowed = new Set(DAP_FORENSICS_CONTRACT.deterministic_job.reads); for (const key of Object.keys(artifacts)) if (!allowed.has(key)) throw new Error(`DAP_FORENSICS_FORBIDDEN_RUNTIME_ARTIFACT:${key}`); }
function assertDapForensicsProfile(profile = {}) { for (const branch of DAP_FORENSICS_CONTRACT.output_contract.required_branches) if (!(branch in profile)) throw new Error(`DAP_FORENSICS_MISSING_BRANCH:${branch}`); if (profile.forensic_contract?.model_generated_forensics_allowed !== false) throw new Error("DAP_FORENSICS_MODEL_GENERATED_TRACE_NOT_FORBIDDEN"); if (profile.forensic_boundary?.old_m10_forensics_reused !== false) throw new Error("DAP_FORENSICS_OLD_M10_REUSED"); if (profile.forensic_boundary?.four_b_four_c_reused !== false) throw new Error("DAP_FORENSICS_4B_4C_REUSED"); if (profile.forensic_boundary?.source_bucket_delivered !== false) throw new Error("DAP_FORENSICS_SOURCE_BUCKET_DELIVERED"); }
function buildBatchTrace({ packet, artifacts, validationManifest }) { const artifactName = packet.expected_artifact_name; const batch = unwrap(artifacts[artifactName], artifactName); const expected = packet.expected_field_ids || []; const returned = Array.isArray(batch.returned_field_ids) ? batch.returned_field_ids : []; const rows = Array.isArray(batch.field_rows) ? batch.field_rows : []; return Object.freeze({ batch_id: packet.batch_id, expected_artifact_name: artifactName, batch_artifact_present: Boolean(artifacts[artifactName]), expected_field_count: expected.length, returned_field_count: returned.length, missing_field_ids: Object.freeze(expected.filter((fieldId) => !returned.includes(fieldId))), duplicate_field_ids: Object.freeze(duplicated(returned)), layer5_manifest_status: findBatchStatus(validationManifest, packet.batch_id), route_ids: Object.freeze([...(packet.required_d_family_route_ids || []), ...(packet.selective_l_family_route_ids || [])]), field_trace_rows: Object.freeze(rows.map((row, index) => ({ trace_id: `${packet.batch_id}.${row.field_id || index}`, field_id: row.field_id || "UNKNOWN_FIELD", source_artifact: artifactName, batch_id: packet.batch_id, semantic_resolution_status: row.semantic_resolution_status || "NOT_REPORTED", basis_route_ids: Object.freeze(Array.isArray(row.basis_route_ids) ? row.basis_route_ids : []), forbidden_inference_check: row.forbidden_inference_check || "NOT_REPORTED", qualified_review_required: !["SEMANTIC_RESOLVED_WITH_BOUNDED_SUPPORT", "DETERMINISTIC_SOURCE_FACT_CARRIED"].includes(row.semantic_resolution_status), material_profile_reemitted: false }))) }); }
function buildRouteCoverage({ packets, fieldTraceIndex }) { const used = new Set(fieldTraceIndex.flatMap((row) => row.basis_route_ids || [])); return packets.map((packet) => { const ids = [...(packet.required_d_family_route_ids || []), ...(packet.selective_l_family_route_ids || [])]; return Object.freeze({ batch_id: packet.batch_id, expected_artifact_name: packet.expected_artifact_name, route_count: ids.length, used_route_count: ids.filter((id) => used.has(id)).length, unused_route_ids: Object.freeze(ids.filter((id) => !used.has(id))) }); }); }
function buildLimitations({ semanticGate, validationManifest, missingBatchArtifacts, missingFieldIds, duplicateFieldIds }) { return Object.freeze([...(semanticGate.status !== "PASS" ? [{ limitation_id: "PHASE7_GATE_LIMITED", source: "data_provenance_profile_semantic_batch_gate", reason: `Phase 7 gate status: ${semanticGate.status || "NOT_REPORTED"}`, blocking: false }] : []), ...(validationManifest.validation_quality_control_result?.status !== "PASS" ? [{ limitation_id: "PHASE7_VALIDATION_LIMITED", source: "dap_semantic_batch_validation_manifest", reason: `Validation manifest status: ${validationManifest.validation_quality_control_result?.status || "NOT_REPORTED"}`, blocking: false }] : []), ...missingBatchArtifacts.map((name) => ({ limitation_id: `MISSING_BATCH:${name}`, source: name, reason: "Expected DAP batch artifact is missing.", blocking: false })), ...missingFieldIds.map((id) => ({ limitation_id: `MISSING_FIELD:${id}`, source: "dap_semantic_batch_route_manifest", reason: "Expected DAP field was not returned by its semantic batch.", blocking: false })), ...duplicateFieldIds.map((id) => ({ limitation_id: `DUPLICATE_FIELD:${id}`, source: "dap_semantic_batch_route_manifest", reason: "DAP field appeared more than once across batch outputs.", blocking: false }))]); }
function findBatchStatus(validationManifest, batchId) { const rows = Array.isArray(validationManifest.batch_results) ? validationManifest.batch_results : []; return rows.find((row) => row.batch_id === batchId)?.layer4_validation_status || "NOT_REPORTED"; }
function duplicated(values = []) { return [...new Set(values.filter((value, index) => values.indexOf(value) !== index))]; }
function unwrap(value, key) { if (value?.[key] && typeof value[key] === "object") return value[key]; if (value?.artifact?.[key] && typeof value.artifact[key] === "object") return value.artifact[key]; return value && typeof value === "object" ? value : {}; }
function assertSameArray(actual, expected, label) { if (JSON.stringify(actual) !== JSON.stringify(expected)) throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`); }
function assertCallback(fn, label) { if (typeof fn !== "function") throw new Error(`DAP_FORENSICS_RUNNER_MISSING_CALLBACK:${label}`); }
