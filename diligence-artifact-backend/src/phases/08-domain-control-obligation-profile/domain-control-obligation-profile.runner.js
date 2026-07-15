import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import yaml from "js-yaml";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT } from "./domain-control-obligation-profile.contract.js";
import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID
} from "./domain-control-obligation.constants.js";
import { compileDomainControlObligationProfile } from "./services/domain-control-obligation-profile.compiler.js";
import { resolveDomainControlObligationTaxonomy } from "./services/domain-control-obligation-taxonomy.resolver.js";
import { assertDomainControlObligationCandidateInventory } from "./validators/domain-control-obligation-candidate-inventory.validator.js";
import {
  assertDomainControlObligationModelOutput,
  assertDomainControlObligationProfile
} from "./validators/domain-control-obligation-profile.validator.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const BACKEND_ROOT = path.resolve(__dirname, "../../..");
const FDR_PATH = path.join(BACKEND_ROOT, "references/registry/Diligence_Field_Derivation_Registry.yml");
const NAVIGATION_INDEX_ARTIFACT = "domain_control_obligation_navigation_index";
const ROOT_RE = /^lossless_root__[a-z0-9_]+$/;
const DAP_ARTIFACT_RE = /^(?:dap_|data_provenance_|extended_dap_|integrated_dap_)/i;

export const DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS = Object.freeze({
  phase_runner: "domain-control-obligation-profile.runner",
  central_phase_id: DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.central_phase_id,
  phase_job_id: DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  phase_owned_runner: true,
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.model_usage,
  provider_injected_by_central_runtime: true,
  phase2g_route_scoped_runtime_reader_required: true,
  phase2e_navigation_required: true,
  candidate_inventory_is_exact_candidate_universe: true,
  material_fields_are_model_owned: true,
  compiler_is_mechanical_only: true,
  regulatory_overlay_refs_backend_stamped: true,
  profile_forensics_inputs_forbidden: true,
  dap_inputs_forbidden: true,
  writes: Object.freeze([DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT])
});

export async function runDomainControlObligationProfilePhase({
  run,
  internalJobId = DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID,
  contract = DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT,
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
  const artifacts = routed.artifacts || {};
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  assertNoForbiddenInputs(artifacts, contract);
  assertRequiredArtifacts(artifacts);

  const candidateInventory = unwrapArtifact(
    artifacts[DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT],
    DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT
  );
  const navigationIndex = unwrapArtifact(
    artifacts[NAVIGATION_INDEX_ARTIFACT],
    NAVIGATION_INDEX_ARTIFACT
  );
  const targetFeatureProfile = unwrapArtifact(artifacts.target_feature_profile, "target_feature_profile");

  const resolvedTaxonomy = await resolveDomainControlObligationTaxonomy({
    activeRunPackageManifest: artifacts.active_run_package_manifest
  });
  assertDomainControlObligationCandidateInventory(candidateInventory, {
    resolvedTaxonomy,
    navigationIndex,
    targetFeatureProfile
  });

  const fdrRules = await loadPhase8FdrRules();
  const promptArtifacts = buildPhase8PromptArtifacts({
    artifacts,
    candidateInventory,
    navigationIndex,
    targetFeatureProfile,
    resolvedTaxonomy,
    fdrRules
  });

  const prompt = await buildPrompt({
    prompt_files: contract.prompt_files || contract.material_job?.prompt_files || [],
    prompt_file: contract.prompt_file,
    phase: internalJobId,
    run,
    artifacts: promptArtifacts,
    writes: contract.writes || contract.material_job?.writes || [DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT],
    references: normalizeReferenceFiles(contract.references || contract.material_job?.references || [])
  });

  const providerResult = await callProvider({
    prompt,
    phase: contract.central_phase_id
  });
  const modelOutput = providerResult?.json || providerResult || {};

  const modelValidation = assertDomainControlObligationModelOutput(modelOutput, {
    candidateInventory,
    resolvedTaxonomy,
    fdrRules
  });

  const compiled = compileDomainControlObligationProfile({
    modelOutput,
    candidateInventory,
    resolvedTaxonomy,
    runId: run?.run_id || run?.id || candidateInventory.run_id || "",
    fdrRules
  });
  const finalValidation = assertDomainControlObligationProfile(compiled, {
    candidateInventory,
    resolvedTaxonomy,
    modelOutput
  });

  const profile = compiled[DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT];
  const lockStatus = resolveProfileLockStatus(profile);
  await saveArtifact({
    artifact_name: DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
    artifact: profile,
    lock_status: lockStatus
  });

  return Object.freeze({
    ok: true,
    output: compiled,
    saved_artifacts: Object.freeze([DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT]),
    artifacts_read: Object.freeze(Object.keys(artifacts).sort()),
    phase_lock_status: lockStatus,
    model_metadata: providerResult?.metadata || {},
    model_usage: contract.model_usage,
    phase2g_route_id: routed.route?.route_id || artifacts.phase_route_runtime_packet?.route_id,
    phase2g_bucket_id: routed.route?.bucket_id || artifacts.phase_route_runtime_packet?.bucket_id,
    candidate_count: candidateInventory.candidate_count,
    compiled_obligation_count: profile.obligation_count,
    candidate_packet_count: promptArtifacts.domain_control_obligation_candidate_packets.length,
    routed_evidence_roots: Object.freeze(Object.keys(artifacts).filter((name) => ROOT_RE.test(name)).sort()),
    resolver_status: resolvedTaxonomy.resolver_status,
    resolver_limitations: Object.freeze([...(resolvedTaxonomy.limitations || [])]),
    model_validation_status: modelValidation.status,
    final_validation_status: finalValidation.status,
    material_fields_model_derived: true,
    backend_material_defaulting_used: false,
    backend_material_rewrite_used: false,
    regulatory_overlay_obligation_rows_created: false,
    phase8_layer2_runner_used: true,
    internal_job_id: internalJobId
  });
}

export async function loadPhase8FdrRules() {
  const parsed = yaml.load(await readFile(FDR_PATH, "utf8")) || {};
  const fields = Array.isArray(parsed.fields) ? parsed.fields : [];
  const rules = fields
    .filter((row) => isPlainObject(row))
    .filter((row) => normalizeId(row.field_id).startsWith("DCO.") || normalizeId(row.profile_section) === "Domain Control Obligation Profile")
    .map((row) => deepFreeze({
      field_id: normalizeId(row.field_id),
      profile_section: normalizeId(row.profile_section),
      field_family: normalizeId(row.field_family),
      output_field: normalizeId(row.output_field),
      mode: normalizeId(row.mode),
      source_basis: clonePlain(row.source_basis),
      conditions: clonePlain(row.conditions),
      trigger_outcome: clonePlain(row.trigger_outcome),
      exclude_fallback: clonePlain(row.exclude_fallback),
      forbidden_inference: clonePlain(row.forbidden_inference),
      lock_status: normalizeId(row.lock_status)
    }));

  if (!rules.length) throw new Error("DOMAIN_CONTROL_OBLIGATION_FDR_RULES_MISSING");
  const ids = new Set();
  for (const rule of rules) {
    if (!rule.field_id) throw new Error("DOMAIN_CONTROL_OBLIGATION_FDR_FIELD_ID_MISSING");
    if (ids.has(rule.field_id)) throw new Error(`DOMAIN_CONTROL_OBLIGATION_FDR_FIELD_ID_DUPLICATE:${rule.field_id}`);
    ids.add(rule.field_id);
  }
  return deepFreeze(rules);
}

function buildPhase8PromptArtifacts({
  artifacts,
  candidateInventory,
  navigationIndex,
  targetFeatureProfile,
  resolvedTaxonomy,
  fdrRules
}) {
  const resolvedByScopedId = new Map((resolvedTaxonomy.obligations || []).map((row) => [
    `${normalizeId(row.source_package_id)}:${normalizeId(row.obligation_id)}`,
    row
  ]));
  const activityByReference = new Map((targetFeatureProfile.activities || []).map((row) => [
    normalizeId(row.activity_reference),
    row
  ]));

  const candidatePackets = (candidateInventory.candidates || []).map((candidate) => {
    const resolved = resolvedByScopedId.get(`${candidate.source_package_id}:${candidate.obligation_id}`);
    if (!resolved) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROMPT_RESOLVED_OBLIGATION_MISSING:${candidate.candidate_id}`);

    const linkedActivities = (candidate.linked_activity_references || []).map((activityReference) => {
      const activity = activityByReference.get(activityReference);
      if (!activity) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROMPT_LINKED_ACTIVITY_MISSING:${candidate.candidate_id}:${activityReference}`);
      return clonePlain(activity);
    });
    const scopedNavigation = resolveCandidateScopedNavigation({
      candidate,
      navigationIndex,
      artifacts
    });

    return deepFreeze({
      candidate: clonePlain(candidate),
      registry_obligation: clonePlain(resolved.registry_obligation || {}),
      fdr_rules: clonePlain(fdrRules),
      p2e_navigation: clonePlain(candidate.p2e_navigation_route_refs || []),
      routed_lossless_evidence: scopedNavigation.routed_lossless_evidence,
      bounded_legal_context: scopedNavigation.bounded_legal_context,
      linked_target_feature_activities: linkedActivities,
      candidate_packet_limitations: uniqueStrings([
        ...(candidate.candidate_limitation || []),
        ...(resolved.limitations || []),
        ...scopedNavigation.limitations
      ]),
      shared_target_context_ref: "phase8_shared_target_context",
      model_must_return_candidate_id_only_from_mechanical_identity: true,
      model_must_not_emit_backend_owned_fields: true,
      regulatory_overlay_refs_backend_owned: true
    });
  });

  return deepFreeze({
    phase_routing_manifest: artifacts.phase_routing_manifest,
    phase_route_runtime_packet: artifacts.phase_route_runtime_packet,
    domain_control_obligation_candidate_inventory: clonePlain(candidateInventory),
    domain_control_obligation_navigation_index: clonePlain(navigationIndex),
    active_run_package_manifest: clonePlain(artifacts.active_run_package_manifest),
    domain_selection_profile: clonePlain(artifacts.domain_selection_profile || {}),
    resolved_domain_control_obligation_taxonomy: {
      resolver_id: resolvedTaxonomy.resolver_id,
      resolver_version: resolvedTaxonomy.resolver_version,
      resolver_status: resolvedTaxonomy.resolver_status,
      authority_model: clonePlain(resolvedTaxonomy.authority_model || {}),
      mounted_package_context: clonePlain(resolvedTaxonomy.mounted_package_context || {}),
      mounted_taxonomy_ref: clonePlain(resolvedTaxonomy.mounted_taxonomy_ref || {}),
      regulatory_overlays: clonePlain(resolvedTaxonomy.regulatory_overlays || []),
      resolution_summary: clonePlain(resolvedTaxonomy.resolution_summary || {}),
      limitations: clonePlain(resolvedTaxonomy.limitations || [])
    },
    phase8_fdr_rules: clonePlain(fdrRules),
    phase8_shared_target_context: {
      target_profile: clonePlain(artifacts.target_profile || {}),
      domain_derivation_profile: clonePlain(artifacts.domain_derivation_profile || {}),
      target_feature_profile_summary: {
        activity_count: (targetFeatureProfile.activities || []).length,
        commercial_availability_posture: clonePlain(targetFeatureProfile.commercial_availability_posture || {}),
        profile_level_limitations: clonePlain(targetFeatureProfile.profile_level_limitations || []),
        mounted_taxonomy_ref: clonePlain(targetFeatureProfile.mounted_taxonomy_ref || {})
      }
    },
    domain_control_obligation_candidate_packets: candidatePackets,
    phase8_runtime_boundaries: {
      lossless_evidence_role: "PRIMARY_EVIDENCE",
      index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
      candidate_inventory_is_only_candidate_universe: true,
      material_fields_are_model_owned: true,
      backend_compilation_is_mechanical_only: true,
      regulatory_overlay_mode: "ENRICH_EXISTING_ROWS_ONLY",
      forensic_inputs_allowed: false,
      dap_inputs_allowed: false,
      free_corpus_read_allowed: false
    }
  });
}

function resolveCandidateScopedNavigation({ candidate, navigationIndex, artifacts }) {
  const controlRouteById = new Map((navigationIndex.control_source_routes || []).map((row) => [normalizeId(row.route_id), row]));
  const legalRouteById = new Map((navigationIndex.legal_index_routes || []).map((row) => [normalizeId(row.route_id), row]));
  const requiredControlRouteIds = uniqueStrings((candidate.p2e_navigation_route_refs || []).flatMap((row) => row.required_control_source_route_ids || []));
  const selectiveLegalRouteIds = uniqueStrings((candidate.p2e_navigation_route_refs || []).flatMap((row) => row.selective_legal_route_ids || []));
  const evidence = {};
  const legalContext = {};
  const limitations = [];

  for (const routeId of requiredControlRouteIds) {
    const route = controlRouteById.get(routeId);
    if (!route) {
      limitations.push(`P2E_CONTROL_ROUTE_NOT_FOUND:${routeId}`);
      continue;
    }
    for (const artifactName of uniqueStrings(route.source_artifacts || [])) {
      const value = artifacts[artifactName];
      if (!isPlainObject(value)) {
        limitations.push(`P2E_ROUTED_PRIMARY_EVIDENCE_NOT_DELIVERED:${routeId}:${artifactName}`);
        continue;
      }
      evidence[artifactName] = clonePlain(value);
    }
  }

  for (const routeId of selectiveLegalRouteIds) {
    const route = legalRouteById.get(routeId);
    if (!route) {
      limitations.push(`P2E_LEGAL_ROUTE_NOT_FOUND:${routeId}`);
      continue;
    }
    const artifactName = normalizeId(route.artifact_name);
    const value = artifacts[artifactName];
    if (!artifactName || !isPlainObject(value)) {
      limitations.push(`P2E_BOUNDED_LEGAL_CONTEXT_NOT_DELIVERED:${routeId}:${artifactName || "missing"}`);
      continue;
    }
    legalContext[artifactName] = clonePlain(value);
  }

  return deepFreeze({
    routed_lossless_evidence: evidence,
    bounded_legal_context: legalContext,
    limitations: uniqueStrings(limitations)
  });
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.central_phase_id) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  }
  if (contract.phase_job_id !== DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_ID) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_JOB_MISMATCH:${contract.phase_job_id || "missing"}`);
  }
  if (contract.model_usage !== "MODEL_JSON_ONLY_MATERIAL_FIELDS") {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_MODEL_USAGE_MISMATCH:${contract.model_usage || "missing"}`);
  }
  const reads = contract.reads || contract.material_job?.reads || [];
  if (!reads.includes("phase_routing_manifest")) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_PHASE_ROUTING_MANIFEST_READ_MISSING");
  if (!reads.includes(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT)) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_CANDIDATE_READ_MISSING");
  const writes = contract.writes || contract.material_job?.writes || [];
  if (writes.length !== 1 || writes[0] !== DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_WRITES_MISMATCH");
  if (contract.field_ownership?.backend_may_author_material_fields !== false) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_BACKEND_MATERIAL_AUTHORING_NOT_FORBIDDEN");
  if (contract.field_ownership?.backend_may_fill_missing_material_fields !== false) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_BACKEND_MATERIAL_DEFAULTING_NOT_FORBIDDEN");
}

function assertRoutePacket(packet = {}, internalJobId) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_P2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== internalJobId) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_ROUTE_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.route_id !== PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_ROUTE_ID_MISMATCH:${packet.route_id || "missing"}`);
  if (packet.bucket_id !== PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_BUCKET_ID_MISMATCH:${packet.bucket_id || "missing"}`);
  if (packet.source_bucket_delivered !== true) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_SOURCE_BUCKET_NOT_DELIVERED");
  if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_LOSSLESS_PRIMARY_BOUNDARY_MISSING");
  if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_INDEX_NAVIGATION_BOUNDARY_MISSING");
  if (packet.direct_lossless_as_fallback_allowed !== false) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_FALLBACK_FRAMING_FORBIDDEN");
  if (packet.free_corpus_read_allowed !== false) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_FREE_CORPUS_READ_FORBIDDEN");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_FORENSICS_INPUT_BOUNDARY_MISSING");
}

function assertRequiredArtifacts(artifacts = {}) {
  for (const artifactName of [
    DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
    NAVIGATION_INDEX_ARTIFACT,
    "target_profile",
    "domain_derivation_profile",
    "target_feature_profile",
    "active_run_package_manifest"
  ]) {
    if (!isPlainObject(artifacts[artifactName])) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_REQUIRED_ARTIFACT_MISSING:${artifactName}`);
  }
  const inventory = unwrapArtifact(artifacts[DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT], DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT);
  if (!Array.isArray(inventory.candidates)) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_CANDIDATE_ROWS_MISSING");
  const profile = unwrapArtifact(artifacts.target_feature_profile, "target_feature_profile");
  if (!Array.isArray(profile.activities)) throw new Error("DOMAIN_CONTROL_OBLIGATION_PROFILE_TARGET_FEATURE_ACTIVITIES_MISSING");
}

function assertNoForbiddenInputs(artifacts = {}, contract = {}) {
  const forbidden = new Set(contract.forbidden_runtime_reads || []);
  for (const artifactName of Object.keys(artifacts)) {
    if (forbidden.has(artifactName)) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_FORBIDDEN_INPUT_DELIVERED:${artifactName}`);
    if (/forensics/i.test(artifactName)) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_FORENSICS_INPUT_DELIVERED:${artifactName}`);
    if (DAP_ARTIFACT_RE.test(artifactName)) throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_DAP_INPUT_DELIVERED:${artifactName}`);
  }
}

function resolveProfileLockStatus(profile = {}) {
  if ((profile.profile_level_limitations || []).length) return "LOCKED_WITH_LIMITATIONS";
  for (const row of profile.obligations || []) {
    if ((row.limitation || []).length || (row.missing_proof || []).length) return "LOCKED_WITH_LIMITATIONS";
    if (["UNCLEAR", "NOT_VISIBLE"].includes(row.control_mechanism_present)) return "LOCKED_WITH_LIMITATIONS";
    if (["PARTIAL", "NOT_VISIBLE", "UNRESOLVED"].includes(row.control_posture_status)) return "LOCKED_WITH_LIMITATIONS";
    if (row.exposure_role_context === "UNRESOLVED") return "LOCKED_WITH_LIMITATIONS";
  }
  return "LOCKED";
}

function normalizeReferenceFiles(values = []) {
  return uniqueStrings(values).map((value) => value.startsWith("references/registry/") ? path.basename(value) : value);
}

function unwrapArtifact(value = {}, artifactName) {
  if (isPlainObject(value?.[artifactName])) return value[artifactName];
  if (value?.artifact_type === artifactName) return value;
  return value || {};
}

function clonePlain(value) {
  if (Array.isArray(value)) return value.map(clonePlain);
  if (isPlainObject(value)) return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, clonePlain(item)]));
  return value;
}

function uniqueStrings(value) {
  const values = value == null ? [] : (Array.isArray(value) ? value : [value]);
  return [...new Set(values.flat(Infinity).map(normalizeId).filter(Boolean))];
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}

function assertCallback(value, label) {
  if (typeof value !== "function") throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_MISSING_CALLBACK:${label}`);
}
