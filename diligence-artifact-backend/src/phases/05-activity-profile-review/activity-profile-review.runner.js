import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "./activity-profile-review.contract.js";
import { validateM8TargetFeatureOutput } from "./validators/activity-profile-review.validator.js";
import { readPhaseRouteRuntimePacket } from "../02-cartography-index/services/phase-route-runtime.reader.js";
import { resolveActivityTaxonomy } from "../../runtime/domain-gate/activity-taxonomy.resolver.js";

const ROOT_RE = /^lossless_root__[a-z0-9_]+$/;

export const ACTIVITY_PROFILE_REVIEW_RUNNER_STATUS = Object.freeze({
  phase_runner: "activity-profile-review.runner",
  central_phase_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id,
  phase_job_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.phase_job_id,
  public_label: ACTIVITY_PROFILE_REVIEW_CONTRACT.public_label,
  compatibility_internal_job_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.compatibility_internal_job_id,
  phase_owned_runner: true,
  production_entrypoint_switched: true,
  global_production_deployment_switched: false,
  model_usage: ACTIVITY_PROFILE_REVIEW_CONTRACT.model_usage,
  validator: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator,
  validator_phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator_phase,
  phase2g_route_scoped_runtime_reader_active: true,
  phase2g_routed_packet_is_read_ceiling: true,
  lossless_primary_evidence_navigated_via_index: true,
  profile_forensics_inputs_forbidden: true,
  active_package_manifest_required: true,
  mounted_taxonomy_resolver_required: true,
  mounted_taxonomy_ref_stamped_by_backend: true,
  primary_overlay_schema_active: true,
  regulatory_overlays_excluded_from_classification: true,
  declared_unrouted_roots_become_limitations: true,
  writes: [...ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes],
  routing_manifest_read: "phase_routing_manifest"
});

export async function runActivityProfileReviewPhase({
  run,
  internalJobId = "M8_TARGET_FEATURE_PROFILE",
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

  const artifacts = routed.artifacts || {};
  assertRoutePacket(artifacts.phase_route_runtime_packet, internalJobId);
  assertCandidateInventoryPresent(artifacts.feature_candidate_inventory);
  assertActivitySourceIndexPresent(artifacts.activity_profile_source_index);
  assertPackageContextPresent(artifacts.active_run_package_manifest);

  const mounted = extractMountedPackageContext(artifacts.active_run_package_manifest);
  const resolved = await resolveActivityTaxonomy({
    primaryPackageId: mounted.primaryPackageId,
    capabilityOverlayIds: mounted.capabilityOverlayIds
  });

  const routedRootNames = Object.keys(artifacts).filter((name) => ROOT_RE.test(name));
  const indexedRootNames = collectIndexedRootNames(artifacts.activity_profile_source_index);
  const indexedRootSet = indexedRootNames.size ? indexedRootNames : new Set(routedRootNames);

  const declaredEvidenceRoots = uniqueStrings(resolved.evidence_roots);
  const usableEvidenceRoots = declaredEvidenceRoots
    .filter((root) => routedRootNames.includes(root))
    .filter((root) => indexedRootSet.has(root));

  const routingLimitations = uniqueStrings([
    ...declaredEvidenceRoots
      .filter((root) => !routedRootNames.includes(root))
      .map((root) => `DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_ROUTED:${root}`),
    ...declaredEvidenceRoots
      .filter((root) => routedRootNames.includes(root) && !indexedRootSet.has(root))
      .map((root) => `DECLARED_ACTIVITY_EVIDENCE_ROOT_NOT_INDEXED:${root}`)
  ]);

  const resolvedTaxonomy = Object.freeze({
    ...resolved,
    mounted_primary_package_id: mounted.primaryPackageId,
    mounted_capability_overlay_ids: Object.freeze([...mounted.capabilityOverlayIds]),
    excluded_regulatory_overlay_ids: Object.freeze([...mounted.regulatoryOverlayIds]),
    usable_evidence_roots: Object.freeze([...usableEvidenceRoots]),
    routing_limitations: Object.freeze([...routingLimitations])
  });

  const promptArtifacts = buildPromptArtifacts({
    artifacts,
    resolvedTaxonomy,
    usableEvidenceRoots,
    mounted,
    routedRootNames,
    indexedRootNames,
    routingLimitations
  });

  const prompt = await buildPrompt({
    prompt_files: contract.prompt_files || ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.prompt_files,
    prompt_file: contract.prompt_file,
    phase: internalJobId,
    run,
    artifacts: promptArtifacts,
    writes: contract.writes,
    references: contract.references || []
  });

  const providerResult = await callProvider({
    prompt,
    phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id
  });

  const output = normalizeAndStampOutput({
    rawOutput: providerResult?.json || providerResult || {},
    resolvedTaxonomy,
    mounted,
    routingLimitations
  });

  validateM8TargetFeatureOutput(output, { phase: internalJobId, resolvedTaxonomy });
  assertMaterialBoundary(output);

  const artifactName = ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes[0];
  const artifact = output[artifactName];
  const phaseLockStatus = resolveActivityProfileReviewLockStatus(artifact);

  await saveArtifact({
    artifact_name: artifactName,
    artifact,
    lock_status: phaseLockStatus
  });

  return Object.freeze({
    ok: true,
    output,
    saved_artifacts: Object.freeze([artifactName]),
    artifacts_read: Object.freeze(Object.keys(artifacts).sort()),
    phase_lock_status: phaseLockStatus,
    model_metadata: providerResult?.metadata || {},
    model_usage: ACTIVITY_PROFILE_REVIEW_CONTRACT.model_usage,
    phase2g_route_id: routed.route?.route_id || artifacts.phase_route_runtime_packet?.route_id,
    phase2g_bucket_id: routed.route?.bucket_id || artifacts.phase_route_runtime_packet?.bucket_id,
    routed_activity_evidence_roots: Object.freeze(routedRootNames),
    usable_activity_evidence_roots: Object.freeze(usableEvidenceRoots),
    excluded_regulatory_overlay_ids: Object.freeze(mounted.regulatoryOverlayIds),
    resolved_activity_taxonomy: summarizeTaxonomy(resolvedTaxonomy),
    activity_profile_review_phase_runner_used: true,
    validator: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator,
    validator_phase: ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.validator_phase,
    internal_job_id: internalJobId
  });
}

function buildPromptArtifacts({
  artifacts,
  resolvedTaxonomy,
  usableEvidenceRoots,
  mounted,
  routedRootNames,
  indexedRootNames,
  routingLimitations
}) {
  const scopedArtifacts = {
    phase_routing_manifest: artifacts.phase_routing_manifest,
    phase_route_runtime_packet: artifacts.phase_route_runtime_packet,
    activity_profile_source_index: artifacts.activity_profile_source_index,
    target_profile: artifacts.target_profile,
    feature_candidate_inventory: artifacts.feature_candidate_inventory,
    domain_derivation_profile: artifacts.domain_derivation_profile,
    active_run_package_manifest: artifacts.active_run_package_manifest,
    domain_selection_profile: artifacts.domain_selection_profile,
    resolved_activity_taxonomy: resolvedTaxonomy,
    activity_taxonomy_runtime_context: Object.freeze({
      primary_package_id: mounted.primaryPackageId,
      capability_overlay_ids: Object.freeze(mounted.capabilityOverlayIds),
      excluded_regulatory_overlay_ids: Object.freeze(mounted.regulatoryOverlayIds),
      routed_activity_evidence_roots: Object.freeze(routedRootNames),
      indexed_activity_evidence_roots: Object.freeze([...indexedRootNames]),
      usable_activity_evidence_roots: Object.freeze(usableEvidenceRoots),
      resolver_limitations: Object.freeze(resolvedTaxonomy.limitations || []),
      routing_limitations: Object.freeze(routingLimitations),
      model_must_not_emit_or_override_mounted_taxonomy_ref: true,
      regulatory_overlays_excluded_from_activity_classification: true
    })
  };

  for (const rootName of usableEvidenceRoots) {
    if (artifacts[rootName]) scopedArtifacts[rootName] = artifacts[rootName];
  }

  return scopedArtifacts;
}

function normalizeAndStampOutput({ rawOutput = {}, resolvedTaxonomy, mounted, routingLimitations = [] }) {
  const artifactName = ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes[0];
  const profile = rawOutput?.[artifactName] && typeof rawOutput[artifactName] === "object" && !Array.isArray(rawOutput[artifactName])
    ? { ...rawOutput[artifactName] }
    : { ...(rawOutput || {}) };

  delete profile.mounted_taxonomy_ref;

  profile.profile_level_limitations = uniqueStrings([
    ...(Array.isArray(profile.profile_level_limitations) ? profile.profile_level_limitations : []),
    ...(resolvedTaxonomy.limitations || []),
    ...(resolvedTaxonomy.routing_limitations || []),
    ...routingLimitations
  ]);

  profile.mounted_taxonomy_ref = buildMountedTaxonomyRef({ resolvedTaxonomy, mounted });

  return Object.freeze({ [artifactName]: profile });
}

function buildMountedTaxonomyRef({ resolvedTaxonomy, mounted }) {
  return Object.freeze({
    primary_package_id: mounted.primaryPackageId || "",
    primary_key_version: resolvedTaxonomy.primary?.key_version || "",
    overlays: Object.freeze((resolvedTaxonomy.overlays || []).map((overlay) => Object.freeze({
      overlay_id: overlay.overlay_id,
      package_id: overlay.package_id,
      key_version: overlay.key_version || ""
    })))
  });
}

function extractMountedPackageContext(manifest = {}) {
  const primaryPackageId = normalizeId(manifest.primary_domain_package || manifest.primaryPackageId || manifest.primary_package_id);
  const regulatoryOverlayIds = uniqueStrings(manifest.regulatory_overlays || manifest.regulatoryOverlayIds || manifest.regulatory_overlay_ids);
  const capabilityOverlayIds = uniqueStrings(manifest.capability_overlays || manifest.capabilityOverlayIds || manifest.capability_overlay_ids)
    .filter((overlayId) => !regulatoryOverlayIds.includes(overlayId));

  if (!primaryPackageId) throw new Error("ACTIVITY_PROFILE_REVIEW_PRIMARY_DOMAIN_PACKAGE_MISSING");

  return Object.freeze({ primaryPackageId, capabilityOverlayIds, regulatoryOverlayIds });
}

function collectIndexedRootNames(index) {
  const roots = new Set();
  visit(index, (value) => {
    if (typeof value === "string" && ROOT_RE.test(value)) roots.add(value);
  });
  return roots;
}

function visit(value, fn, seen = new Set()) {
  fn(value);
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item) => visit(item, fn, seen));
  else Object.values(value).forEach((item) => visit(item, fn, seen));
}

function assertRuntimeContract(contract = {}) {
  if (contract.central_phase_id !== ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id) {
    throw new Error(`ACTIVITY_PROFILE_REVIEW_CONTRACT_MISMATCH:${contract.central_phase_id || "missing"}`);
  }
  if (contract.public_label !== ACTIVITY_PROFILE_REVIEW_CONTRACT.public_label) {
    throw new Error(`ACTIVITY_PROFILE_REVIEW_LABEL_MISMATCH:${contract.public_label || "missing"}`);
  }
  assertSameArray(contract.writes || [], ACTIVITY_PROFILE_REVIEW_CONTRACT.material_job.writes, "ACTIVITY_PROFILE_REVIEW_WRITES");
  if (!(contract.reads || []).includes("phase_routing_manifest")) {
    throw new Error("ACTIVITY_PROFILE_REVIEW_PHASE2G_MANIFEST_READ_MISSING");
  }
}

function assertRoutePacket(packet = {}, internalJobId) {
  if (packet.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") throw new Error("ACTIVITY_PROFILE_REVIEW_PHASE2G_AUTHORITY_MISSING");
  if (packet.internal_job_id !== internalJobId) throw new Error(`ACTIVITY_PROFILE_REVIEW_PHASE2G_JOB_MISMATCH:${packet.internal_job_id || "missing"}`);
  if (packet.lossless_evidence_role !== "PRIMARY_EVIDENCE") throw new Error("ACTIVITY_PROFILE_REVIEW_LOSSLESS_PRIMARY_BOUNDARY_MISSING");
  if (packet.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("ACTIVITY_PROFILE_REVIEW_INDEX_NAVIGATION_BOUNDARY_MISSING");
  if (packet.profile_forensics_inputs_allowed !== false) throw new Error("ACTIVITY_PROFILE_REVIEW_FORENSICS_INPUT_BOUNDARY_MISSING");
}

function assertCandidateInventoryPresent(inventory) {
  if (!inventory || typeof inventory !== "object" || Array.isArray(inventory)) throw new Error("ACTIVITY_PROFILE_REVIEW_MISSING_FEATURE_CANDIDATE_INVENTORY");
  if (!Array.isArray(inventory.candidates)) throw new Error("ACTIVITY_PROFILE_REVIEW_FEATURE_CANDIDATE_INVENTORY_CANDIDATES_MISSING");
}

function assertActivitySourceIndexPresent(index) {
  if (!index || typeof index !== "object" || Array.isArray(index)) throw new Error("ACTIVITY_PROFILE_REVIEW_MISSING_ACTIVITY_PROFILE_SOURCE_INDEX");
}

function assertPackageContextPresent(manifest) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) throw new Error("ACTIVITY_PROFILE_REVIEW_MISSING_ACTIVE_RUN_PACKAGE_MANIFEST");
}

function assertMaterialBoundary(output = {}) {
  const profile = output.target_feature_profile;
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) throw new Error("ACTIVITY_PROFILE_REVIEW_MATERIAL_ARTIFACT_MISSING");
  const expected = [...ACTIVITY_PROFILE_REVIEW_CONTRACT.output_contract.required_profile_keys].sort();
  assertSameArray(Object.keys(profile).sort(), expected, "ACTIVITY_PROFILE_REVIEW_PROFILE_KEYS");
  if (!Array.isArray(profile.activities)) throw new Error("ACTIVITY_PROFILE_REVIEW_ACTIVITIES_NOT_ARRAY");
  if (!Array.isArray(profile.profile_level_limitations)) throw new Error("ACTIVITY_PROFILE_REVIEW_LIMITATIONS_NOT_ARRAY");
}

function resolveActivityProfileReviewLockStatus(profile = {}) {
  return Array.isArray(profile.profile_level_limitations) && profile.profile_level_limitations.length
    ? "LOCKED_WITH_LIMITATIONS"
    : "LOCKED";
}

function summarizeTaxonomy(resolved = {}) {
  return Object.freeze({
    primary_package_id: resolved.primary?.package_id || null,
    mounted_primary_package_id: resolved.mounted_primary_package_id || "",
    primary_key_version: resolved.primary?.key_version || "",
    overlay_ids: Object.freeze((resolved.overlays || []).map((overlay) => overlay.overlay_id)),
    evidence_roots: Object.freeze(resolved.evidence_roots || []),
    usable_evidence_roots: Object.freeze(resolved.usable_evidence_roots || []),
    limitations: Object.freeze(uniqueStrings([...(resolved.limitations || []), ...(resolved.routing_limitations || [])]))
  });
}

function assertSameArray(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${label}_MISMATCH:${JSON.stringify({ actual, expected })}`);
  }
}

function assertCallback(fn, label) {
  if (typeof fn !== "function") throw new Error(`ACTIVITY_PROFILE_REVIEW_RUNNER_MISSING_CALLBACK:${label}`);
}

function uniqueStrings(values) {
  return [...new Set((Array.isArray(values) ? values : [values]).flat(Infinity).map(normalizeId).filter(Boolean))];
}

function normalizeId(value) {
  return String(value || "").trim();
}
