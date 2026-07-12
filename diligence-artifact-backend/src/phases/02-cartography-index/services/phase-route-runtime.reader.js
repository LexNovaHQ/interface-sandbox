import {
  PHASE_ROUTE_IDS,
  P2G_PHASE_ROUTING_ARTIFACTS,
  P2G_ROUTING_DOCTRINE,
  P2G_SOURCE_BUCKET_DELIVERY_MODE,
  P2G_DERIVED_ONLY_DELIVERY_MODE,
  P2G_DYNAMIC_M11_BATCH_INPUT
} from "../phase-routing.contract.js";

const ROUTER_AGENT_ID = "agent_2_cartography_index";
const ROUTING_AUTHORITY = "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY";
const LEGAL_DOC_DYNAMIC_PATTERN = "legal_doc_{DOC_TYPE}";
const LOSSLESS_ROOT_PATTERN = /^lossless_root__([a-z0-9_]+)$/;
const FORENSICS_MARKERS = Object.freeze(["forensics", "_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics"]);
const VIRTUAL_DYNAMIC_ARTIFACTS = Object.freeze(["m11_batch_artifacts", "m12_batch_validation_artifacts", "m12_global_dynamic_artifact_manifest"]);

export const P2G_RUNTIME_ROUTE_BY_JOB = Object.freeze({
  M7_TARGET_PROFILE: PHASE_ROUTE_IDS.targetProfile,
  P3_DOMAIN_DERIVATION_LAYER: PHASE_ROUTE_IDS.domainDerivation,
  M7_TARGET_PROFILE_FORENSICS: PHASE_ROUTE_IDS.targetProfile,
  M8_FEATURE_CANDIDATE_INVENTORY: PHASE_ROUTE_IDS.activityProfile,
  M8_TARGET_FEATURE_PROFILE: PHASE_ROUTE_IDS.activityProfile,
  M8_TARGET_FEATURE_PROFILE_FORENSICS: PHASE_ROUTE_IDS.activityProfile,
  DATA_PROVENANCE_PROFILE_LAYER4: PHASE_ROUTE_IDS.dataPrivacy,
  DATA_PROVENANCE_PROFILE_FORENSICS: PHASE_ROUTE_IDS.dataPrivacy,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY: PHASE_ROUTE_IDS.domainControlObligation,
  DOMAIN_CONTROL_OBLIGATION_PROFILE: PHASE_ROUTE_IDS.domainControlObligation,
  M11: PHASE_ROUTE_IDS.legalCartographySignals,
  M12: PHASE_ROUTE_IDS.legalCartographySignals,
  NORMALIZED_COMPILER: PHASE_ROUTE_IDS.legalCartographySignals
});

export const P2G_PHASE_ROUTE_RUNTIME_READER_STATUS = Object.freeze({
  service: "phase-route-runtime.reader",
  routing_authority: ROUTING_AUTHORITY,
  route_scoped_runtime_reader_active: true,
  cutover_jobs: Object.freeze(Object.keys(P2G_RUNTIME_ROUTE_BY_JOB)),
  router_reads_primary_evidence_and_indexes_for_profile_jobs: true,
  derived_only_packets_for_forensics_challenge_compiler: true,
  derived_only_jobs_receive_exact_job_scope_only: true,
  consumer_reads_only_authorized_preceding_context: true,
  sparse_lossless_root_resolution_owned_by_2g: true,
  dynamic_legal_document_expansion_owned_by_2g: true,
  dynamic_m11_batch_expansion_owned_by_2g: true,
  profile_forensics_inputs_forbidden: true,
  lossless_evidence_is_primary: true,
  index_navigation_mandatory: true
});

export function phaseRouteIdForRuntimeJob(internalJobId) {
  const routeId = P2G_RUNTIME_ROUTE_BY_JOB[String(internalJobId || "")];
  if (!routeId) throw new Error(`P2G_RUNTIME_ROUTE_NOT_DECLARED_FOR_JOB:${internalJobId || "missing"}`);
  return routeId;
}

export function buildPhaseRouteRuntimeReadPlan({ internalJobId, phaseRoutingManifest } = {}) {
  const manifest = unwrap(phaseRoutingManifest, P2G_PHASE_ROUTING_ARTIFACTS.manifest);
  assertManifest(manifest);
  const routeId = phaseRouteIdForRuntimeJob(internalJobId);
  const routes = Array.isArray(manifest.route_buckets) ? manifest.route_buckets : [];
  const route = routes.find((row) => row?.route_id === routeId);
  if (!route) throw new Error(`P2G_RUNTIME_ROUTE_MISSING_FROM_MANIFEST:${routeId}`);
  const authorizedJobs = new Set([...(route.parent_jobs || []), ...(route.downstream_jobs || [])]);
  if (!authorizedJobs.has(internalJobId)) throw new Error(`P2G_RUNTIME_JOB_NOT_AUTHORIZED_BY_ROUTE:${routeId}:${internalJobId}`);
  if (route.lossless_evidence_primary !== true) throw new Error(`P2G_RUNTIME_ROUTE_LOSSLESS_NOT_PRIMARY:${routeId}`);
  if (route.index_navigation_mandatory !== true) throw new Error(`P2G_RUNTIME_ROUTE_INDEX_NAVIGATION_NOT_MANDATORY:${routeId}`);
  if (route.navigation_rule !== P2G_ROUTING_DOCTRINE) throw new Error(`P2G_RUNTIME_ROUTE_NAVIGATION_DOCTRINE_MISMATCH:${routeId}`);
  if (route.direct_lossless_as_fallback_allowed !== false) throw new Error(`P2G_RUNTIME_ROUTE_FALLBACK_FRAMING_FORBIDDEN:${routeId}`);
  if (route.free_corpus_read_allowed !== false) throw new Error(`P2G_RUNTIME_ROUTE_FREE_CORPUS_READ_FORBIDDEN:${routeId}`);

  const deliveryMode = route.job_scoped_delivery_modes?.[internalJobId] || P2G_SOURCE_BUCKET_DELIVERY_MODE;
  if (![P2G_SOURCE_BUCKET_DELIVERY_MODE, P2G_DERIVED_ONLY_DELIVERY_MODE].includes(deliveryMode)) throw new Error(`P2G_RUNTIME_DELIVERY_MODE_INVALID:${routeId}:${internalJobId}:${deliveryMode}`);
  const jobScopedDerivedProfiles = route.job_scoped_derived_profiles?.[internalJobId] || [];
  const dynamicInputs = route.job_scoped_dynamic_inputs?.[internalJobId] || [];
  const staticPrimaryEvidence = (route.primary_lossless_evidence || []).filter((name) => name !== LEGAL_DOC_DYNAMIC_PATTERN);
  const routerArtifactReads = deliveryMode === P2G_SOURCE_BUCKET_DELIVERY_MODE ? unique([...(route.required_index_artifacts || []), ...staticPrimaryEvidence, ...(route.allowed_legal_artifacts || [])]) : [];
  const consumerContextReads = deliveryMode === P2G_SOURCE_BUCKET_DELIVERY_MODE ? unique([...(route.allowed_preceding_derived_profiles || []), ...jobScopedDerivedProfiles, ...(route.allowed_runtime_context || [])]) : unique([...jobScopedDerivedProfiles]);
  const artifactReads = unique([...routerArtifactReads, ...consumerContextReads]);
  const forbidden = new Set(route.forbidden_artifacts || []);
  for (const artifactName of artifactReads) {
    if (forbidden.has(artifactName)) throw new Error(`P2G_RUNTIME_ROUTE_FORBIDDEN_ARTIFACT_DECLARED:${routeId}:${artifactName}`);
    if (FORENSICS_MARKERS.some((marker) => String(artifactName).includes(marker))) throw new Error(`P2G_RUNTIME_ROUTE_FORENSICS_INPUT_FORBIDDEN:${routeId}:${artifactName}`);
  }
  if (deliveryMode === P2G_SOURCE_BUCKET_DELIVERY_MODE) {
    if (!(route.required_index_artifacts || []).length) throw new Error(`P2G_RUNTIME_ROUTE_REQUIRED_INDEX_MISSING:${routeId}`);
    if (!(route.primary_lossless_evidence || []).length) throw new Error(`P2G_RUNTIME_ROUTE_PRIMARY_EVIDENCE_MISSING:${routeId}`);
  }

  return Object.freeze({
    internal_job_id: internalJobId,
    route_id: route.route_id,
    bucket_id: route.bucket_id,
    delivery_mode: deliveryMode,
    router_agent_id: ROUTER_AGENT_ID,
    required_index_artifacts: Object.freeze([...(route.required_index_artifacts || [])]),
    primary_lossless_evidence: Object.freeze([...(route.primary_lossless_evidence || [])]),
    allowed_preceding_derived_profiles: Object.freeze([...(route.allowed_preceding_derived_profiles || [])]),
    job_scoped_derived_profiles: Object.freeze([...jobScopedDerivedProfiles]),
    dynamic_inputs: Object.freeze([...dynamicInputs]),
    allowed_runtime_context: Object.freeze(deliveryMode === P2G_SOURCE_BUCKET_DELIVERY_MODE ? [...(route.allowed_runtime_context || [])] : []),
    allowed_legal_artifacts: Object.freeze([...(route.allowed_legal_artifacts || [])]),
    router_artifact_reads: Object.freeze(routerArtifactReads),
    consumer_context_reads: Object.freeze(consumerContextReads),
    artifact_reads: Object.freeze(artifactReads),
    dynamic_legal_documents_required: deliveryMode === P2G_SOURCE_BUCKET_DELIVERY_MODE && (route.primary_lossless_evidence || []).includes(LEGAL_DOC_DYNAMIC_PATTERN),
    dynamic_m11_batches_required: dynamicInputs.includes(P2G_DYNAMIC_M11_BATCH_INPUT)
  });
}

export async function readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId } = {}) {
  if (typeof readArtifacts !== "function") throw new Error("P2G_RUNTIME_READER_MISSING_READ_ARTIFACTS_CALLBACK");
  if (!consumerAgentId) throw new Error("P2G_RUNTIME_READER_MISSING_CONSUMER_AGENT_ID");
  const manifestArtifacts = await readArtifacts({ reads: [P2G_PHASE_ROUTING_ARTIFACTS.manifest], agent_id: ROUTER_AGENT_ID, strict: true });
  const manifest = unwrap(manifestArtifacts?.[P2G_PHASE_ROUTING_ARTIFACTS.manifest], P2G_PHASE_ROUTING_ARTIFACTS.manifest);
  const plan = buildPhaseRouteRuntimeReadPlan({ internalJobId, phaseRoutingManifest: manifest });
  const routerArtifacts = plan.router_artifact_reads.length ? await readRouterArtifacts({ readArtifacts, reads: plan.router_artifact_reads }) : {};
  const expandedLegalDocuments = plan.dynamic_legal_documents_required ? await readDynamicLegalDocuments({ readArtifacts, routerArtifacts }) : {};
  const consumerContext = plan.consumer_context_reads.length ? await readArtifacts({ reads: plan.consumer_context_reads, agent_id: consumerAgentId, strict: true }) : {};
  const staticArtifacts = { ...routerArtifacts, ...expandedLegalDocuments, ...consumerContext };
  const dynamicM11 = plan.dynamic_m11_batches_required ? await readDynamicM11BatchInputs({ readArtifacts, consumerAgentId, artifacts: staticArtifacts }) : {};
  const routedArtifacts = { ...staticArtifacts, ...dynamicM11 };
  const deliveredNames = Object.keys(routedArtifacts);
  const allowedNames = unique([...plan.artifact_reads, ...Object.keys(expandedLegalDocuments), ...Object.keys(dynamicM11)]);
  assertExactRoutedArtifacts(routedArtifacts, allowedNames, plan.route_id);
  for (const indexArtifact of plan.required_index_artifacts) {
    if (!deliveredNames.includes(indexArtifact)) continue;
    const value = routedArtifacts[indexArtifact];
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`P2G_RUNTIME_REQUIRED_INDEX_UNAVAILABLE:${plan.route_id}:${indexArtifact}`);
  }
  const sourceBucketDelivered = plan.delivery_mode === P2G_SOURCE_BUCKET_DELIVERY_MODE;
  const runtimePacket = Object.freeze({
    artifact_type: "phase_route_runtime_packet",
    routing_authority: ROUTING_AUTHORITY,
    internal_job_id: internalJobId,
    route_id: plan.route_id,
    bucket_id: plan.bucket_id,
    delivery_mode: plan.delivery_mode,
    source_bucket_delivered: sourceBucketDelivered,
    lossless_evidence_role: sourceBucketDelivered ? "PRIMARY_EVIDENCE" : "NOT_DELIVERED_TO_DERIVED_ONLY_JOB",
    index_role: sourceBucketDelivered ? "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE" : "DERIVED_ONLY_PACKET_NO_PRIMARY_SOURCE_NAVIGATION",
    navigation_rule: P2G_ROUTING_DOCTRINE,
    direct_lossless_as_fallback_allowed: false,
    free_corpus_read_allowed: false,
    profile_forensics_inputs_allowed: false,
    sparse_lossless_root_resolution_owned_by_2g: true,
    router_artifact_reads: plan.router_artifact_reads,
    consumer_context_reads: plan.consumer_context_reads,
    expanded_legal_document_artifacts: Object.freeze(Object.keys(expandedLegalDocuments)),
    dynamic_inputs: plan.dynamic_inputs,
    delivered_artifacts: Object.freeze(deliveredNames)
  });
  return Object.freeze({ route: plan, artifacts: Object.freeze({ ...routedArtifacts, [P2G_PHASE_ROUTING_ARTIFACTS.manifest]: manifest, phase_route_runtime_packet: runtimePacket }) });
}

async function readRouterArtifacts({ readArtifacts, reads }) {
  const roots = reads.filter((name) => LOSSLESS_ROOT_PATTERN.test(name));
  const regular = reads.filter((name) => !LOSSLESS_ROOT_PATTERN.test(name));
  const output = regular.length ? await readArtifacts({ reads: regular, agent_id: ROUTER_AGENT_ID, strict: true }) : {};
  let sourceFamilyIndex;
  for (const rootArtifactName of roots) {
    const direct = await readArtifacts({ reads: [rootArtifactName], agent_id: ROUTER_AGENT_ID, strict: false });
    if (direct?.[rootArtifactName] && typeof direct[rootArtifactName] === "object") {
      output[rootArtifactName] = direct[rootArtifactName];
      continue;
    }
    if (sourceFamilyIndex === undefined) {
      const indexResult = await readArtifacts({ reads: ["source_family_index"], agent_id: ROUTER_AGENT_ID, strict: false });
      sourceFamilyIndex = indexResult?.source_family_index || null;
    }
    output[rootArtifactName] = await resolveLosslessRootFromManifest({ rootArtifactName, sourceFamilyIndex, readArtifacts });
  }
  return output;
}

async function resolveLosslessRootFromManifest({ rootArtifactName, sourceFamilyIndex, readArtifacts }) {
  const root = rootArtifactName.match(LOSSLESS_ROOT_PATTERN)?.[1] || "";
  const entry = sourceFamilyIndex?.root_artifact_manifest?.[root] || {};
  const required = Array.isArray(entry.required_artifacts) ? entry.required_artifacts.filter(Boolean) : [];
  if (!required.length) return emptyResolvedRoot({ rootArtifactName, root, reason: entry.status || "UNSAVED_EMPTY" });
  const loaded = await readArtifacts({ reads: required, agent_id: ROUTER_AGENT_ID, strict: true });
  const parts = required.map((name, index) => ({ name, artifact: loaded?.[name], index })).filter((row) => row.artifact && typeof row.artifact === "object").sort((a, b) => Number(a.artifact.shard_index || a.index + 1) - Number(b.artifact.shard_index || b.index + 1));
  if (parts.length !== required.length) throw new Error(`P2G_RUNTIME_LOSSLESS_ROOT_PARTS_INCOMPLETE:${rootArtifactName}`);
  const base = parts[0]?.artifact || {};
  const sources = parts.flatMap((row) => Array.isArray(row.artifact.sources) ? row.artifact.sources : []);
  return {
    ...base,
    artifact_name: rootArtifactName,
    common_root: root,
    root_virtual_artifact_name: rootArtifactName,
    storage_mode: required.length > 1 ? "RESOLVED_ROOT_SHARDS" : (base.storage_mode || entry.status || "SINGLE"),
    physical_artifact_names: required,
    root_resolution: { status: "COMPLETE", common_root: root, root_manifest_status: entry.status || "UNKNOWN", required_artifacts: required, loaded_artifacts: required, required_together: required.length > 1, source_text_cutting_allowed: false },
    sources,
    manifest_only_sources: parts.flatMap((row) => row.artifact.manifest_only_sources || []),
    metadata_only_sources: parts.flatMap((row) => row.artifact.metadata_only_sources || []),
    legal_document_sources: parts.flatMap((row) => row.artifact.legal_document_sources || []),
    rejected_sources: parts.flatMap((row) => row.artifact.rejected_sources || []),
    missing_limited_primary_sources: parts.flatMap((row) => row.artifact.missing_limited_primary_sources || []),
    corpus_forensics: { ...(base.corpus_forensics || {}), total_sources: sources.length, resolved_physical_artifacts: required.length, virtual_root_resolution: true }
  };
}

function emptyResolvedRoot({ rootArtifactName, root, reason }) {
  return { artifact_name: rootArtifactName, common_root: root, root_virtual_artifact_name: rootArtifactName, storage_mode: "UNSAVED_EMPTY", physical_artifact_names: [], root_resolution: { status: "UNSAVED_EMPTY", common_root: root, reason, required_artifacts: [], loaded_artifacts: [], required_together: false, source_text_cutting_allowed: false }, sources: [], manifest_only_sources: [], metadata_only_sources: [], legal_document_sources: [], rejected_sources: [], missing_limited_primary_sources: [], corpus_forensics: { total_sources: 0, resolved_physical_artifacts: 0, virtual_root_resolution: true } };
}

async function readDynamicLegalDocuments({ readArtifacts, routerArtifacts }) {
  const inventory = unwrap(routerArtifacts.legal_doc_inventory, "legal_doc_inventory");
  const names = unique((Array.isArray(inventory.documents_found) ? inventory.documents_found : []).map((row) => row?.artifact_name).filter((name) => /^legal_doc_[a-z0-9_]+(?:__[a-z0-9-]+)?$/.test(String(name || ""))));
  if (!names.length) return {};
  const loaded = await readArtifacts({ reads: names, agent_id: ROUTER_AGENT_ID, strict: false });
  return Object.fromEntries(Object.entries(loaded || {}).filter(([, value]) => value && typeof value === "object"));
}

async function readDynamicM11BatchInputs({ readArtifacts, consumerAgentId, artifacts }) {
  const routePlan = unwrap(artifacts.exposure_registry_route_plan, "exposure_registry_route_plan");
  const batchPlan = Array.isArray(routePlan.batch_plan) ? routePlan.batch_plan : [];
  const batchNames = batchPlan.map((row) => `exposure_registry_batch__${row.batch_id}`).filter((name) => !name.endsWith("__undefined"));
  const validationNames = batchPlan.map((row) => `exposure_registry_batch_validation__${row.batch_id}`).filter((name) => !name.endsWith("__undefined"));
  const loadedBatches = batchNames.length ? await readArtifacts({ reads: batchNames, agent_id: consumerAgentId, strict: false }) : {};
  const loadedValidations = validationNames.length ? await readArtifacts({ reads: validationNames, agent_id: consumerAgentId, strict: false }) : {};
  const missingBatchArtifacts = batchNames.filter((name) => !loadedBatches?.[name]);
  const missingBatchValidationArtifacts = validationNames.filter((name) => !loadedValidations?.[name]);
  return {
    m11_batch_artifacts: batchNames.filter((name) => loadedBatches?.[name]).map((name) => ({ artifact_name: name, batch_id: name.replace(/^exposure_registry_batch__/, ""), artifact: loadedBatches[name] })),
    m12_batch_validation_artifacts: validationNames.filter((name) => loadedValidations?.[name]).map((name) => ({ artifact_name: name, batch_id: name.replace(/^exposure_registry_batch_validation__/, ""), artifact: loadedValidations[name] })),
    m12_global_dynamic_artifact_manifest: { batch_count: batchPlan.length, expected_batch_artifacts: batchNames, expected_batch_validation_artifacts: validationNames, missing_batch_artifacts: missingBatchArtifacts, missing_batch_validation_artifacts: missingBatchValidationArtifacts, routing_authority: ROUTING_AUTHORITY }
  };
}

function assertManifest(manifest = {}) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) throw new Error("P2G_RUNTIME_MANIFEST_MISSING");
  if (manifest.artifact_type !== P2G_PHASE_ROUTING_ARTIFACTS.manifest) throw new Error("P2G_RUNTIME_MANIFEST_WRONG_ARTIFACT_TYPE");
  if (manifest.routing_authority !== ROUTING_AUTHORITY) throw new Error("P2G_RUNTIME_MANIFEST_WRONG_AUTHORITY");
  if (manifest.doctrine?.lossless_evidence_is_primary !== true) throw new Error("P2G_RUNTIME_MANIFEST_LOSSLESS_PRIMARY_MISSING");
  if (manifest.doctrine?.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") throw new Error("P2G_RUNTIME_MANIFEST_INDEX_ROLE_MISSING");
  if (manifest.doctrine?.direct_lossless_as_fallback_allowed !== false) throw new Error("P2G_RUNTIME_MANIFEST_FALLBACK_FORBIDDEN");
  if (manifest.doctrine?.free_corpus_read_allowed !== false) throw new Error("P2G_RUNTIME_MANIFEST_FREE_CORPUS_FORBIDDEN");
}

function assertExactRoutedArtifacts(artifacts = {}, allowedArtifactNames = [], routeId) {
  const allowed = new Set(allowedArtifactNames);
  for (const key of Object.keys(artifacts || {})) {
    if (!allowed.has(key)) throw new Error(`P2G_RUNTIME_UNDECLARED_ARTIFACT_DELIVERED:${routeId}:${key}`);
    if (!VIRTUAL_DYNAMIC_ARTIFACTS.includes(key) && FORENSICS_MARKERS.some((marker) => String(key).includes(marker))) throw new Error(`P2G_RUNTIME_FORENSICS_ARTIFACT_DELIVERED:${routeId}:${key}`);
  }
  for (const key of allowed) if (!(key in artifacts)) throw new Error(`P2G_RUNTIME_DECLARED_ARTIFACT_NOT_DELIVERED:${routeId}:${key}`);
}

function unique(values) { return [...new Set((values || []).filter((value) => typeof value === "string" && value.trim()))]; }
function unwrap(value, key) { return value?.[key] || value?.artifact?.[key] || value?.artifact || value || {}; }
