import {
  PHASE_ROUTE_IDS,
  P2G_PHASE_ROUTING_ARTIFACTS,
  P2G_ROUTING_DOCTRINE
} from "../phase-routing.contract.js";

const ROUTER_AGENT_ID = "agent_2_cartography_index";
const ROUTING_AUTHORITY = "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY";
const FORENSICS_MARKERS = Object.freeze([
  "forensics",
  "_forensics",
  "dap_forensics_profile",
  "exposure_registry_profile_forensics"
]);

export const P2G_RUNTIME_ROUTE_BY_JOB = Object.freeze({
  M7_TARGET_PROFILE: PHASE_ROUTE_IDS.targetProfile,
  P3_DOMAIN_DERIVATION_LAYER: PHASE_ROUTE_IDS.domainDerivation,
  M8_FEATURE_CANDIDATE_INVENTORY: PHASE_ROUTE_IDS.activityProfile,
  M8_TARGET_FEATURE_PROFILE: PHASE_ROUTE_IDS.activityProfile,
  DATA_PROVENANCE_PROFILE_LAYER4: PHASE_ROUTE_IDS.dataPrivacy
});

export const P2G_PHASE_ROUTE_RUNTIME_READER_STATUS = Object.freeze({
  service: "phase-route-runtime.reader",
  routing_authority: ROUTING_AUTHORITY,
  route_scoped_runtime_reader_active: true,
  cutover_jobs: Object.freeze(Object.keys(P2G_RUNTIME_ROUTE_BY_JOB)),
  router_reads_primary_evidence_and_indexes: true,
  consumer_reads_only_authorized_preceding_context: true,
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
  if (!Array.isArray(route.parent_jobs) || !route.parent_jobs.includes(internalJobId)) throw new Error(`P2G_RUNTIME_JOB_NOT_AUTHORIZED_BY_ROUTE:${routeId}:${internalJobId}`);
  if (route.lossless_evidence_primary !== true) throw new Error(`P2G_RUNTIME_ROUTE_LOSSLESS_NOT_PRIMARY:${routeId}`);
  if (route.index_navigation_mandatory !== true) throw new Error(`P2G_RUNTIME_ROUTE_INDEX_NAVIGATION_NOT_MANDATORY:${routeId}`);
  if (route.navigation_rule !== P2G_ROUTING_DOCTRINE) throw new Error(`P2G_RUNTIME_ROUTE_NAVIGATION_DOCTRINE_MISMATCH:${routeId}`);
  if (route.direct_lossless_as_fallback_allowed !== false) throw new Error(`P2G_RUNTIME_ROUTE_FALLBACK_FRAMING_FORBIDDEN:${routeId}`);
  if (route.free_corpus_read_allowed !== false) throw new Error(`P2G_RUNTIME_ROUTE_FREE_CORPUS_READ_FORBIDDEN:${routeId}`);

  const jobScopedDerivedProfiles = route.job_scoped_derived_profiles?.[internalJobId] || [];
  const routerArtifactReads = unique([
    ...(route.required_index_artifacts || []),
    ...(route.primary_lossless_evidence || []),
    ...(route.allowed_legal_artifacts || [])
  ]);
  const consumerContextReads = unique([
    ...(route.allowed_preceding_derived_profiles || []),
    ...jobScopedDerivedProfiles,
    ...(route.allowed_runtime_context || [])
  ]);
  const artifactReads = unique([...routerArtifactReads, ...consumerContextReads]);
  const forbidden = new Set(route.forbidden_artifacts || []);
  for (const artifactName of artifactReads) {
    if (forbidden.has(artifactName)) throw new Error(`P2G_RUNTIME_ROUTE_FORBIDDEN_ARTIFACT_DECLARED:${routeId}:${artifactName}`);
    if (FORENSICS_MARKERS.some((marker) => String(artifactName).includes(marker))) throw new Error(`P2G_RUNTIME_ROUTE_FORENSICS_INPUT_FORBIDDEN:${routeId}:${artifactName}`);
  }
  if (!(route.required_index_artifacts || []).length) throw new Error(`P2G_RUNTIME_ROUTE_REQUIRED_INDEX_MISSING:${routeId}`);
  if (!(route.primary_lossless_evidence || []).length) throw new Error(`P2G_RUNTIME_ROUTE_PRIMARY_EVIDENCE_MISSING:${routeId}`);

  return Object.freeze({
    internal_job_id: internalJobId,
    route_id: route.route_id,
    bucket_id: route.bucket_id,
    router_agent_id: ROUTER_AGENT_ID,
    required_index_artifacts: Object.freeze([...(route.required_index_artifacts || [])]),
    primary_lossless_evidence: Object.freeze([...(route.primary_lossless_evidence || [])]),
    allowed_preceding_derived_profiles: Object.freeze([...(route.allowed_preceding_derived_profiles || [])]),
    job_scoped_derived_profiles: Object.freeze([...jobScopedDerivedProfiles]),
    allowed_runtime_context: Object.freeze([...(route.allowed_runtime_context || [])]),
    allowed_legal_artifacts: Object.freeze([...(route.allowed_legal_artifacts || [])]),
    router_artifact_reads: Object.freeze(routerArtifactReads),
    consumer_context_reads: Object.freeze(consumerContextReads),
    artifact_reads: Object.freeze(artifactReads)
  });
}

export async function readPhaseRouteRuntimePacket({ internalJobId, readArtifacts, consumerAgentId } = {}) {
  if (typeof readArtifacts !== "function") throw new Error("P2G_RUNTIME_READER_MISSING_READ_ARTIFACTS_CALLBACK");
  if (!consumerAgentId) throw new Error("P2G_RUNTIME_READER_MISSING_CONSUMER_AGENT_ID");

  const manifestArtifacts = await readArtifacts({
    reads: [P2G_PHASE_ROUTING_ARTIFACTS.manifest],
    agent_id: ROUTER_AGENT_ID,
    strict: true
  });
  const manifest = unwrap(manifestArtifacts?.[P2G_PHASE_ROUTING_ARTIFACTS.manifest], P2G_PHASE_ROUTING_ARTIFACTS.manifest);
  const plan = buildPhaseRouteRuntimeReadPlan({ internalJobId, phaseRoutingManifest: manifest });

  const routerArtifacts = plan.router_artifact_reads.length
    ? await readArtifacts({ reads: plan.router_artifact_reads, agent_id: ROUTER_AGENT_ID, strict: true })
    : {};
  const consumerContext = plan.consumer_context_reads.length
    ? await readArtifacts({ reads: plan.consumer_context_reads, agent_id: consumerAgentId, strict: true })
    : {};
  const routedArtifacts = { ...routerArtifacts, ...consumerContext };
  assertExactRoutedArtifacts(routedArtifacts, plan.artifact_reads, plan.route_id);
  for (const indexArtifact of plan.required_index_artifacts) {
    const value = routedArtifacts[indexArtifact];
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`P2G_RUNTIME_REQUIRED_INDEX_UNAVAILABLE:${plan.route_id}:${indexArtifact}`);
  }

  const runtimePacket = Object.freeze({
    artifact_type: "phase_route_runtime_packet",
    routing_authority: ROUTING_AUTHORITY,
    internal_job_id: internalJobId,
    route_id: plan.route_id,
    bucket_id: plan.bucket_id,
    lossless_evidence_role: "PRIMARY_EVIDENCE",
    index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
    navigation_rule: P2G_ROUTING_DOCTRINE,
    direct_lossless_as_fallback_allowed: false,
    free_corpus_read_allowed: false,
    profile_forensics_inputs_allowed: false,
    router_artifact_reads: plan.router_artifact_reads,
    consumer_context_reads: plan.consumer_context_reads,
    delivered_artifacts: Object.freeze([...plan.artifact_reads])
  });

  return Object.freeze({
    route: plan,
    artifacts: Object.freeze({
      ...routedArtifacts,
      [P2G_PHASE_ROUTING_ARTIFACTS.manifest]: manifest,
      phase_route_runtime_packet: runtimePacket
    })
  });
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
    if (FORENSICS_MARKERS.some((marker) => String(key).includes(marker))) throw new Error(`P2G_RUNTIME_FORENSICS_ARTIFACT_DELIVERED:${routeId}:${key}`);
  }
  for (const key of allowed) if (!(key in artifacts)) throw new Error(`P2G_RUNTIME_DECLARED_ARTIFACT_NOT_DELIVERED:${routeId}:${key}`);
}

function unique(values) {
  return [...new Set((values || []).filter((value) => typeof value === "string" && value.trim()))];
}

function unwrap(value, key) {
  return value?.[key] || value?.artifact?.[key] || value?.artifact || value || {};
}
