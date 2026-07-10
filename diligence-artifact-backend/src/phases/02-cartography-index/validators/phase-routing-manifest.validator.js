import { P2G_PHASE_ROUTING_ARTIFACTS, P2G_ROUTE_BUCKETS, P2G_ROUTING_DOCTRINE } from "../phase-routing.contract.js";

const FORENSICS_MARKERS = Object.freeze(["forensics", "_forensics", "dap_forensics_profile", "exposure_registry_profile_forensics"]);

export function validatePhaseRoutingManifest(manifest = {}) {
  const errors = [];
  const warnings = [];
  if (!manifest || typeof manifest !== "object") errors.push("PHASE_ROUTING_MANIFEST_MISSING");
  if (manifest.artifact_type !== P2G_PHASE_ROUTING_ARTIFACTS.manifest) errors.push("PHASE_ROUTING_MANIFEST_WRONG_ARTIFACT_TYPE");
  if (manifest.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") errors.push("PHASE_ROUTING_MANIFEST_WRONG_AUTHORITY");
  if (manifest.doctrine?.lossless_evidence_is_primary !== true) errors.push("LOSSLESS_EVIDENCE_NOT_MARKED_PRIMARY");
  if (manifest.doctrine?.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") errors.push("INDEX_NOT_MARKED_AS_MANDATORY_NAVIGATION_MAP");
  if (manifest.doctrine?.direct_lossless_as_fallback_allowed !== false) errors.push("DIRECT_LOSSLESS_FALLBACK_ALLOWED_BUT_FORBIDDEN");
  if (manifest.doctrine?.free_corpus_read_allowed !== false) errors.push("FREE_CORPUS_READ_ALLOWED_BUT_FORBIDDEN");
  const routes = Array.isArray(manifest.route_buckets) ? manifest.route_buckets : [];
  if (routes.length !== P2G_ROUTE_BUCKETS.length) errors.push(`PHASE_ROUTING_BUCKET_COUNT_MISMATCH:${routes.length}`);
  const bucketIds = new Set();
  const routeIds = new Set();
  const expectedBuckets = new Set(P2G_ROUTE_BUCKETS.map((route) => route.bucket_id));
  for (const route of routes) validateRoute(route, { errors, warnings, bucketIds, routeIds, expectedBuckets });
  for (const expected of expectedBuckets) if (!bucketIds.has(expected)) errors.push(`MISSING_ROUTE_BUCKET:${expected}`);
  const serialized = JSON.stringify(manifest);
  for (const forbidden of ["fallback_allowed\":true", "direct_lossless_as_fallback_allowed\":true", "free_corpus_read_allowed\":true", "lossless_evidence_role\":\"FALLBACK", "LOSSLESS_EVIDENCE_IS_FALLBACK"]) if (serialized.includes(forbidden)) errors.push(`FORBIDDEN_ROUTING_MARKER:${forbidden}`);
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze(warnings) });
}

export function validatePhaseRouteValidationManifest(validationManifest = {}) {
  const errors = [];
  if (validationManifest.artifact_type !== P2G_PHASE_ROUTING_ARTIFACTS.validation) errors.push("PHASE_ROUTE_VALIDATION_MANIFEST_WRONG_ARTIFACT_TYPE");
  if (!["PASS", "FAIL"].includes(validationManifest.validation_status)) errors.push("PHASE_ROUTE_VALIDATION_MANIFEST_INVALID_STATUS");
  if (validationManifest.validated_doctrine?.lossless_evidence_is_primary !== true) errors.push("VALIDATION_DOCTRINE_LOSSLESS_PRIMARY_MISSING");
  if (validationManifest.validated_doctrine?.index_navigation_mandatory !== true) errors.push("VALIDATION_DOCTRINE_INDEX_NAVIGATION_MISSING");
  if (validationManifest.validated_doctrine?.direct_lossless_as_fallback_forbidden !== true) errors.push("VALIDATION_DOCTRINE_FALLBACK_FORBIDDEN_MISSING");
  return Object.freeze({ ok: errors.length === 0, errors: Object.freeze(errors), warnings: Object.freeze([]) });
}

function validateRoute(route = {}, ctx) {
  const { errors, warnings, bucketIds, routeIds, expectedBuckets } = ctx;
  if (!route.route_id) errors.push("ROUTE_ID_MISSING");
  if (!route.bucket_id) errors.push(`BUCKET_ID_MISSING:${route.route_id || "unknown"}`);
  if (bucketIds.has(route.bucket_id)) errors.push(`DUPLICATE_BUCKET_ID:${route.bucket_id}`);
  if (routeIds.has(route.route_id)) errors.push(`DUPLICATE_ROUTE_ID:${route.route_id}`);
  bucketIds.add(route.bucket_id);
  routeIds.add(route.route_id);
  if (!expectedBuckets.has(route.bucket_id)) errors.push(`UNKNOWN_BUCKET_ID:${route.bucket_id}`);
  if (!Array.isArray(route.required_index_artifacts) || route.required_index_artifacts.length < 1) errors.push(`ROUTE_REQUIRED_INDEX_MISSING:${route.bucket_id}`);
  if (!Array.isArray(route.primary_lossless_evidence) || route.primary_lossless_evidence.length < 1) errors.push(`ROUTE_PRIMARY_LOSSLESS_EVIDENCE_MISSING:${route.bucket_id}`);
  if (route.lossless_evidence_primary !== true) errors.push(`ROUTE_LOSSLESS_NOT_PRIMARY:${route.bucket_id}`);
  if (route.index_navigation_mandatory !== true) errors.push(`ROUTE_INDEX_NAVIGATION_NOT_MANDATORY:${route.bucket_id}`);
  if (route.navigation_rule !== P2G_ROUTING_DOCTRINE) errors.push(`ROUTE_NAVIGATION_RULE_WRONG:${route.bucket_id}`);
  if (route.direct_lossless_as_fallback_allowed !== false) errors.push(`ROUTE_DIRECT_LOSSLESS_FALLBACK_ALLOWED:${route.bucket_id}`);
  if (route.free_corpus_read_allowed !== false) errors.push(`ROUTE_FREE_CORPUS_READ_ALLOWED:${route.bucket_id}`);
  for (const artifact of route.primary_lossless_evidence || []) if (!String(artifact).startsWith("lossless_root__") && artifact !== "legal_doc_{DOC_TYPE}" && !String(artifact).startsWith("legal_doc_")) errors.push(`ROUTE_PRIMARY_EVIDENCE_NOT_LOSSLESS_OR_LEGAL_DOC:${route.bucket_id}:${artifact}`);
  for (const artifact of route.allowed_preceding_derived_profiles || []) if (FORENSICS_MARKERS.some((marker) => String(artifact).includes(marker))) errors.push(`ROUTE_PRECEDING_PROFILE_FORENSICS_FORBIDDEN:${route.bucket_id}:${artifact}`);
  for (const artifact of route.forbidden_artifacts || []) if (!artifact) warnings.push(`EMPTY_FORBIDDEN_ARTIFACT_MARKER:${route.bucket_id}`);
  if (route.requires_legal_dependency !== true && Array.isArray(route.allowed_legal_artifacts) && route.allowed_legal_artifacts.length) errors.push(`LEGAL_ARTIFACTS_WITHOUT_DECLARED_LEGAL_DEPENDENCY:${route.bucket_id}`);
  if (route.route_ready === false) warnings.push(`ROUTE_REQUIRED_INDEX_NOT_PRESENT_AT_BUILD_TIME:${route.bucket_id}`);
}
