import { BASE_ACTIVITY_EVIDENCE_ROOTS } from "../../phases/05-activity-profile-review/activity-profile.constants.js";
import { discoverPackageKeys } from "./domain-derivation-registry.loader.js";

export const ACTIVITY_TAXONOMY_RESOLVER_STATUS = Object.freeze({
  resolver: "activity-taxonomy.resolver",
  resolver_version: "v3_behavior_class_axis_schema",
  registry_discovery: "references/registry/*_Registry_Key.yml",
  primary_mapping: "registry_key.domain_package",
  overlay_mapping: "serves_capability_overlay",
  behavior_class_source: "behavior_class.codes",
  surface_source: "surface.tokens",
  compatibility_fallbacks_allowed: false,
  domain_derivation_rules_overlay_fallback_allowed: false,
  regulatory_overlay_taxonomy_mount_allowed: false,
  resolver_reads_runtime_artifacts: false,
  resolver_expands_phase2g_reads: false,
  phase2g_remains_only_routing_authority: true
});

export async function resolveActivityTaxonomy({ primaryPackageId, capabilityOverlayIds = [] } = {}) {
  const primaryId = normalizeId(primaryPackageId);
  const overlayIds = uniqueStrings(capabilityOverlayIds);
  const discovered = await discoverPackageKeys();
  const records = Object.entries(discovered).map(([packageId, entry]) => normalizeKeyRecord({ packageId, file: entry.file, key: entry.key }));
  const limitations = [];
  const primaryRecord = primaryId ? records.find((record) => record.package_id === primaryId) || null : null;
  if (!primaryId) limitations.push("PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:<missing>");
  else if (!primaryRecord) limitations.push(`PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:${primaryId}`);

  const primary = primaryRecord ? taxonomyBlockFromRecord(primaryRecord, { status: "RESOLVED_PRIMARY" }) : null;
  const overlays = [];
  for (const overlayId of overlayIds) {
    const record = records.find((candidate) => candidate.serves_capability_overlay.includes(overlayId));
    if (!record) {
      limitations.push(`OVERLAY_HAS_NO_TAXONOMY_KEY:${overlayId}`);
      continue;
    }
    overlays.push(taxonomyBlockFromRecord(record, { overlay_id: overlayId, status: "RESOLVED_CAPABILITY_OVERLAY" }));
  }

  return Object.freeze({
    primary,
    overlays: Object.freeze(overlays),
    evidence_roots: Object.freeze(uniqueStrings([
      ...BASE_ACTIVITY_EVIDENCE_ROOTS,
      ...(primary?.evidence_roots || []),
      ...overlays.flatMap((overlay) => overlay.evidence_roots || [])
    ])),
    limitations: Object.freeze(uniqueStrings(limitations))
  });
}

function normalizeKeyRecord({ packageId, file, key }) {
  const registryKey = key?.registry_key || {};
  const declaredPackageId = normalizeId(registryKey.domain_package || packageId);
  if (!declaredPackageId) throw new Error(`ACTIVITY_TAXONOMY_KEY_MISSING_DOMAIN_PACKAGE:${file || "unknown"}`);
  const behaviorClassVocabulary = normalizeBehaviorClass(key?.behavior_class, declaredPackageId);
  const surfaceAxes = normalizeSurfaceAxes(key?.surface, declaredPackageId);
  return Object.freeze({
    package_id: declaredPackageId,
    key_file: file || "",
    key,
    key_version: normalizeId(registryKey.version || key?.version || key?.schema_version || ""),
    serves_capability_overlay: normalizeOverlayDeclaration(key?.serves_capability_overlay),
    behavior_class_vocabulary: Object.freeze(behaviorClassVocabulary),
    surface_axes: Object.freeze(surfaceAxes),
    evidence_roots: Object.freeze(uniqueStrings(key?.activity_evidence_roots || [])),
    grammar: Object.freeze({
      behavior_class_source: "behavior_class.codes",
      surface_source: "surface.tokens",
      trigger_if_supported: true,
      exclude_if_supported: true,
      package_scoped: true
    })
  });
}

function taxonomyBlockFromRecord(record, extras = {}) {
  return Object.freeze({
    ...(extras.overlay_id ? { overlay_id: extras.overlay_id } : {}),
    package_id: record.package_id,
    key_version: record.key_version,
    key_file: record.key_file,
    behavior_class_vocabulary: record.behavior_class_vocabulary,
    surface_axes: record.surface_axes,
    evidence_roots: record.evidence_roots,
    grammar: record.grammar,
    status: extras.status || "RESOLVED"
  });
}

function normalizeBehaviorClass(value, packageId) {
  const rows = isPlainObject(value) && Array.isArray(value.codes) ? value.codes : normalizeArray(value);
  return rows.map((row) => {
    if (typeof row === "string") {
      return { code: row, normalized_name: row, trigger_if: "", exclude_if: [], package_id: packageId };
    }
    if (!isPlainObject(row)) return null;
    return {
      code: normalizeId(row.code || row.id || row.class_id || row.behavior_class),
      normalized_name: normalizeId(row.normalized_name || row.name || row.label || row.code || row.id),
      trigger_if: normalizeTrigger(row.trigger_if),
      exclude_if: normalizeArray(row.exclude_if).map((item) => typeof item === "string" ? item : JSON.stringify(item)),
      package_id: packageId
    };
  }).filter((row) => row?.code).map((row) => Object.freeze(row));
}

function normalizeSurfaceAxes(value, packageId) {
  if (Array.isArray(value)) {
    return value.map((axis, index) => normalizeSurfaceAxis(axis, index, packageId)).filter(Boolean).map(Object.freeze);
  }
  if (isPlainObject(value)) {
    if (Array.isArray(value.tokens) || value.axis_id || value.axis_label) {
      const axis = normalizeSurfaceAxis(value, 0, packageId);
      return axis ? [Object.freeze(axis)] : [];
    }
    return Object.entries(value)
      .map(([axisId, axisValue], index) => normalizeSurfaceAxis({ axis_id: axisId, tokens: normalizeArray(axisValue) }, index, packageId))
      .filter(Boolean)
      .map(Object.freeze);
  }
  return [];
}

function normalizeSurfaceAxis(axis, index, packageId) {
  if (typeof axis === "string") {
    return {
      axis_id: `surface_axis_${index + 1}`,
      tokens: Object.freeze([Object.freeze({ token: axis, normalized_name: axis, trigger_if: "", package_id: packageId })])
    };
  }
  if (!isPlainObject(axis)) return null;
  const axisId = normalizeId(axis.axis_id || axis.id || axis.name || `surface_axis_${index + 1}`);
  const tokenRows = normalizeArray(axis.tokens || axis.values || axis.options || axis.surface_tokens || axis.token)
    .map((row) => normalizeSurfaceToken(row, packageId))
    .filter(Boolean)
    .map(Object.freeze);
  return { axis_id: axisId, tokens: Object.freeze(tokenRows) };
}

function normalizeSurfaceToken(value, packageId) {
  if (typeof value === "string") return { token: value, normalized_name: value, trigger_if: "", package_id: packageId };
  if (!isPlainObject(value)) return null;
  const token = normalizeId(value.token || value.code || value.id || value.name);
  if (!token) return null;
  return {
    token,
    normalized_name: normalizeId(value.normalized_name || value.name || value.label || token),
    trigger_if: normalizeTrigger(value.trigger_if),
    package_id: packageId
  };
}

function normalizeOverlayDeclaration(value) { return uniqueStrings(value); }
function normalizeTrigger(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join(" AND ");
  if (isPlainObject(value)) return JSON.stringify(value);
  return "";
}
function normalizeArray(value) { if (value == null) return []; return Array.isArray(value) ? value : [value]; }
function uniqueStrings(value) { return [...new Set(normalizeArray(value).flat(Infinity).map(normalizeId).filter(Boolean))]; }
function normalizeId(value) { return String(value ?? "").trim(); }
function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
