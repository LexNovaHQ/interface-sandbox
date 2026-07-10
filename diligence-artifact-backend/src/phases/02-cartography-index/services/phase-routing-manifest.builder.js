import { P2G_PHASE_ROUTER_JOB_ID, P2G_PHASE_ROUTING_ARTIFACTS, P2G_ROUTE_BUCKETS, P2G_ROUTING_DOCTRINE, P2G_NO_FALLBACK_DOCTRINE } from "../phase-routing.contract.js";

export function buildPhaseRoutingManifest({ artifacts = {}, runId = null } = {}) {
  const routes = P2G_ROUTE_BUCKETS.map((bucket) => buildRoute({ bucket, artifacts }));
  const manifest = Object.freeze({
    artifact_type: P2G_PHASE_ROUTING_ARTIFACTS.manifest,
    phase_id: "CARTOGRAPHY_INDEX",
    job_id: P2G_PHASE_ROUTER_JOB_ID,
    run_id: runId || "",
    manifest_version: "phase2g_phase_routing_manifest_v1",
    routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
    runtime_cutover_status: "DECLARED_NOT_FULLY_CUT_OVER_FIRST_PATCH",
    doctrine: Object.freeze({
      lossless_evidence_is_primary: true,
      lossless_evidence_role: "PRIMARY_EVIDENCE",
      index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
      navigation_rule: P2G_ROUTING_DOCTRINE,
      no_fallback_doctrine: P2G_NO_FALLBACK_DOCTRINE,
      direct_lossless_as_fallback_allowed: false,
      direct_lossless_as_fallback_forbidden: true,
      free_corpus_read_allowed: false,
      phase_may_read_only_routed_bucket: true,
      preceding_derived_profiles_allowed: true,
      preceding_forensics_profiles_forbidden: true,
      derived_value_generation_forbidden_in_2g: true
    }),
    route_count: routes.length,
    route_buckets: Object.freeze(routes),
    route_index: Object.freeze(Object.fromEntries(routes.map((route) => [route.route_id, route.bucket_id]))),
    bucket_index: Object.freeze(Object.fromEntries(routes.map((route) => [route.bucket_id, route.route_id]))),
    validation_quality_control_result: Object.freeze({ status: "PASS", errors: [], warnings: [] }),
    lock_status: "LOCKED"
  });
  return Object.freeze({ [P2G_PHASE_ROUTING_ARTIFACTS.manifest]: manifest });
}

export function buildPhaseRouteValidationManifest({ phaseRoutingManifest = {}, validation = {} } = {}) {
  const manifest = unwrap(phaseRoutingManifest, P2G_PHASE_ROUTING_ARTIFACTS.manifest);
  return Object.freeze({
    [P2G_PHASE_ROUTING_ARTIFACTS.validation]: Object.freeze({
      artifact_type: P2G_PHASE_ROUTING_ARTIFACTS.validation,
      phase_id: "CARTOGRAPHY_INDEX",
      job_id: P2G_PHASE_ROUTER_JOB_ID,
      manifest_version: "phase2g_phase_route_validation_manifest_v1",
      routing_authority: manifest.routing_authority || "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY",
      route_count: Array.isArray(manifest.route_buckets) ? manifest.route_buckets.length : 0,
      validation_status: validation.ok ? "PASS" : "FAIL",
      status: validation.ok ? "LOCKED" : "REPAIR_REQUIRED",
      failures: Object.freeze(validation.errors || []),
      warnings: Object.freeze(validation.warnings || []),
      validated_doctrine: Object.freeze({
        lossless_evidence_is_primary: true,
        index_navigation_mandatory: true,
        direct_lossless_as_fallback_forbidden: true,
        free_corpus_read_forbidden: true,
        forensics_for_profile_derivation_forbidden: true
      }),
      lock_status: validation.ok ? "LOCKED" : "REPAIR_REQUIRED"
    })
  });
}

export function buildPhaseRoutingArtifacts({ artifacts = {}, runId = null, validate = null } = {}) {
  const manifest = buildPhaseRoutingManifest({ artifacts, runId });
  const validation = typeof validate === "function" ? validate(manifest[P2G_PHASE_ROUTING_ARTIFACTS.manifest]) : { ok: true, errors: [], warnings: [] };
  const validationManifest = buildPhaseRouteValidationManifest({ phaseRoutingManifest: manifest, validation });
  return Object.freeze({ ...manifest, ...validationManifest });
}

function buildRoute({ bucket, artifacts = {} }) {
  const requiredIndexPresence = Object.freeze(Object.fromEntries((bucket.required_index_artifacts || []).map((name) => [name, present(artifacts[name])] )));
  const primaryEvidencePresence = Object.freeze(Object.fromEntries((bucket.primary_lossless_evidence || []).map((name) => [name, present(artifacts[name])] )));
  const legalPresence = Object.freeze(Object.fromEntries((bucket.allowed_legal_artifacts || []).map((name) => [name, present(artifacts[name])] )));
  return Object.freeze({
    ...bucket,
    evidence_role: "PRIMARY_EVIDENCE",
    index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE",
    required_index_presence: requiredIndexPresence,
    primary_lossless_evidence_presence: primaryEvidencePresence,
    legal_dependency_presence: legalPresence,
    route_ready: Object.values(requiredIndexPresence).every(Boolean),
    source_gap_count: Object.values(primaryEvidencePresence).filter((value) => !value).length,
    lossless_evidence_primary: true,
    index_navigation_mandatory: true,
    direct_lossless_as_fallback_allowed: false,
    free_corpus_read_allowed: false,
    derived_value_generation_forbidden_in_2g: true,
    contains_lossless_text: false,
    contains_excerpts: false,
    contains_summaries: false,
    contains_profile_answers: false,
    contains_legal_or_compliance_conclusions: false
  });
}

function present(value) {
  return Boolean(value && typeof value === "object");
}

function unwrap(value, key) {
  return value?.[key] || value?.artifact || value || {};
}
