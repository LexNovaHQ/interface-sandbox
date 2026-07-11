import { discoverPackageKeys } from "./domain-derivation-registry.loader.js";
import { BASE_ACTIVITY_EVIDENCE_ROOTS } from "../../phases/05-activity-profile-review/activity-profile.constants.js";

export async function resolveActivityTaxonomy({ primaryPackageId, capabilityOverlayIds = [] } = {}) {
  const primaryId = normalizeId(primaryPackageId);
  const overlayIds = uniqueStrings(capabilityOverlayIds);
  const discovered = await discoverPackageKeys();
  const limitations = [];

  const primaryEntry = primaryId ? discovered[primaryId] || null : null;
  const primary = primaryEntry ? normalizeMountedKey(primaryEntry.key, { packageId: primaryId }) : null;

  if (!primary) {
    limitations.push(`PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:${primaryId || "missing"}`);
  }

  const overlays = [];
  for (const overlayId of overlayIds) {
    const match = findOverlayKey(discovered, overlayId);
    if (!match) {
      limitations.push(`OVERLAY_HAS_NO_TAXONOMY_KEY:${overlayId}`);
      continue;
    }
    overlays.push(normalizeMountedKey(match.entry.key, {
      packageId: match.packageId,
      overlayId
    }));
  }

  const evidenceRoots = uniqueStrings([
    ...BASE_ACTIVITY_EVIDENCE_ROOTS,
    ...(primary?.evidence_roots || []),
    ...overlays.flatMap((overlay) => overlay.evidence_roots || [])
  ]);

  return Object.freeze({
    primary: primary ? Object.freeze(primary) : null,
    overlays: Object.freeze(overlays.map((overlay) => Object.freeze(overlay))),
    evidence_roots: Object.freeze(evidenceRoots),
    limitations: Object.freeze(limitations)
  });
}

function findOverlayKey(discovered, overlayId) {
  for (const [packageId, entry] of Object.entries(discovered || {})) {
    const declared = uniqueStrings(asArray(entry?.key?.serves_capability_overlay));
    if (declared.includes(overlayId)) return { packageId, entry };
  }
  return null;
}

function normalizeMountedKey(key = {}, { packageId, overlayId } = {}) {
  const registryKey = key.registry_key || {};
  const behaviorClass = key.behavior_class || {};
  const surface = key.surface || {};
  const archetypeVocabulary = asArray(behaviorClass.codes).map((entry) => Object.freeze({
    package_id: packageId,
    code: String(entry?.code || ""),
    normalized_name: String(entry?.normalized_name || entry?.internal_name || entry?.code || ""),
    conditions: Object.freeze({ ...(entry?.conditions || {}) }),
    trigger_if: String(entry?.trigger_if || ""),
    exclude_if: normalizeExcludeIf(entry?.exclude_if)
  }));
  const surfaceTokens = asArray(surface.tokens).map((entry) => Object.freeze({
    package_id: packageId,
    token: String(entry?.token || ""),
    normalized_name: String(entry?.normalized_name || entry?.token || ""),
    conditions: Object.freeze({ ...(entry?.conditions || {}) }),
    trigger_if: String(entry?.trigger_if || "")
  }));
  const surfaceAxes = surface.axis_id || surfaceTokens.length
    ? [Object.freeze({
        package_id: packageId,
        axis_id: String(surface.axis_id || "surface"),
        axis_label: String(surface.axis_label || ""),
        multi_value: surface.multi_value === true,
        combine: String(surface.combine || ""),
        tokens: Object.freeze(surfaceTokens)
      })]
    : [];

  const normalized = {
    package_id: packageId,
    key_version: String(registryKey.version || ""),
    archetype_vocabulary: Object.freeze(archetypeVocabulary),
    surface_axes: Object.freeze(surfaceAxes),
    evidence_roots: Object.freeze(uniqueStrings(key.activity_evidence_roots)),
    grammar: Object.freeze({
      behavior_class: Object.freeze({
        axis_id: String(behaviorClass.axis_id || "behavior_class"),
        residual_code: String(behaviorClass.residual_code || ""),
        resolution_test: String(behaviorClass.resolution_test || "")
      }),
      surface: Object.freeze({
        axis_id: String(surface.axis_id || "surface"),
        multi_value: surface.multi_value === true,
        combine: String(surface.combine || ""),
        note: String(surface.note || "")
      })
    })
  };

  if (overlayId) normalized.overlay_id = overlayId;
  else normalized.status = String(registryKey.status || "ACTIVE");
  return normalized;
}

function normalizeExcludeIf(value) {
  if (Array.isArray(value)) return Object.freeze(value.map((item) => String(item || "")).filter(Boolean));
  if (value === null || value === undefined || value === "") return Object.freeze([]);
  return Object.freeze([String(value)]);
}

function asArray(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined || value === "") return [];
  return [value];
}

function normalizeId(value) {
  return String(value || "").trim();
}

function uniqueStrings(values) {
  return [...new Set(asArray(values).flat(Infinity).map(normalizeId).filter(Boolean))];
}
