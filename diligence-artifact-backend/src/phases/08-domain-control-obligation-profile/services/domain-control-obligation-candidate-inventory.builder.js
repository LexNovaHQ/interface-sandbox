import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_SCHEMA_VERSION,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS
} from "../domain-control-obligation.constants.js";
import { resolveDomainControlObligationTaxonomy } from "./domain-control-obligation-taxonomy.resolver.js";

const NAVIGATION_INDEX_ARTIFACT = "domain_control_obligation_navigation_index";
const PRIMARY_SOURCE_LAYER = "PRIMARY";
const CAPABILITY_SOURCE_LAYER = "CAPABILITY_OVERLAY";

export const DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_BUILDER_STATUS = Object.freeze({
  builder: "domain-control-obligation-candidate-inventory.builder",
  builder_version: "phase8_dco_candidate_inventory_builder_v1",
  execution_mode: "DETERMINISTIC",
  provider_call_allowed: false,
  candidate_universe_source: "mounted Registry Key obligations",
  trigger_source: "target_feature_profile package-scoped classifications",
  navigation_source: NAVIGATION_INDEX_ARTIFACT,
  material_field_derivation_allowed: false,
  regulatory_overlay_obligation_rows_allowed: false
});

export async function buildDomainControlObligationCandidateInventory({
  runId = "",
  activeRunPackageManifest = {},
  targetFeatureProfile = {},
  navigationIndex = {},
  resolvedTaxonomy,
  packageKeys,
  obligationCatalogs,
  packageCatalog
} = {}) {
  const resolved = resolvedTaxonomy || await resolveDomainControlObligationTaxonomy({
    activeRunPackageManifest,
    packageKeys,
    obligationCatalogs,
    packageCatalog
  });
  const profile = unwrapArtifact(targetFeatureProfile, "target_feature_profile");
  const index = unwrapArtifact(navigationIndex, NAVIGATION_INDEX_ARTIFACT);
  const limitations = [...(resolved.limitations || [])];

  if (!Array.isArray(profile?.activities)) {
    throw new Error("DOMAIN_CONTROL_OBLIGATION_TARGET_FEATURE_PROFILE_ACTIVITIES_MISSING");
  }
  if (!index || typeof index !== "object" || Array.isArray(index)) {
    throw new Error("DOMAIN_CONTROL_OBLIGATION_NAVIGATION_INDEX_MISSING");
  }

  const p2eFamilyRows = indexP2EFamilyRows(index, limitations);
  const candidateDrafts = [];

  for (const obligation of resolved.obligations || []) {
    const scopedKey = scopedObligationKey(obligation);
    if (obligation.resolution_status !== "RESOLVED") {
      limitations.push(`UNRESOLVED_OBLIGATION_EXCLUDED_FROM_CANDIDATES:${scopedKey}`);
      continue;
    }
    if (!DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS.includes(obligation.source_layer)) {
      limitations.push(`FORBIDDEN_OBLIGATION_SOURCE_LAYER_EXCLUDED:${scopedKey}:${obligation.source_layer || "missing"}`);
      continue;
    }

    const requiredBehaviorCodes = uniqueStrings(obligation.applies_when?.behavior_class || []);
    const requiredSurfaceTokens = uniqueStrings(obligation.applies_when?.surface || []);
    if (!requiredBehaviorCodes.length || !requiredSurfaceTokens.length) {
      limitations.push(`OBLIGATION_TRIGGER_AXIS_INCOMPLETE:${scopedKey}`);
      continue;
    }

    const familyKey = p2eFamilyKey(obligation.catalog_package_id, obligation.obligation_family);
    const familyRows = p2eFamilyRows.get(familyKey) || [];
    if (familyRows.length !== 1) {
      limitations.push(`${familyRows.length ? "P2E_OBLIGATION_FAMILY_ROUTE_AMBIGUOUS" : "P2E_OBLIGATION_FAMILY_ROUTE_MISSING"}:${scopedKey}:${familyKey}`);
      continue;
    }

    const linkedActivityReferences = [];
    const matchedBehaviorCodes = new Set();
    const matchedSurfaceTokens = new Set();

    for (const activity of profile.activities) {
      const classification = classificationBlockForObligation(activity, obligation);
      if (!classification) continue;

      const activityBehaviorCodes = uniqueStrings(classification.archetype_codes || []);
      const activitySurfaceTokens = uniqueStrings(classification.surface_context_tokens || []);
      const behaviorMatches = intersection(requiredBehaviorCodes, activityBehaviorCodes);
      const surfaceMatches = intersection(requiredSurfaceTokens, activitySurfaceTokens);
      if (!behaviorMatches.length || !surfaceMatches.length) continue;

      const activityReference = normalizeId(activity.activity_reference);
      if (!activityReference) {
        limitations.push(`MATCHED_ACTIVITY_REFERENCE_MISSING:${scopedKey}`);
        continue;
      }
      linkedActivityReferences.push(activityReference);
      behaviorMatches.forEach((value) => matchedBehaviorCodes.add(value));
      surfaceMatches.forEach((value) => matchedSurfaceTokens.add(value));
    }

    if (!linkedActivityReferences.length) continue;

    const candidateLimitations = uniqueStrings(obligation.limitations || []);
    candidateDrafts.push({
      obligation,
      linked_activity_references: uniqueStrings(linkedActivityReferences).sort(),
      matched_behavior_codes: [...matchedBehaviorCodes].sort(),
      matched_surface_tokens: [...matchedSurfaceTokens].sort(),
      p2e_navigation_route_refs: familyRows.map(normalizeP2ERouteRef),
      candidate_limitation: candidateLimitations
    });
  }

  candidateDrafts.sort(compareCandidateDrafts);
  const candidates = candidateDrafts.map((draft, indexValue) => deepFreeze({
    candidate_id: `DCO-CAND-${String(indexValue + 1).padStart(3, "0")}`,
    obligation_id: draft.obligation.obligation_id,
    obligation_family: draft.obligation.obligation_family,
    source_layer: draft.obligation.source_layer,
    source_package_id: draft.obligation.source_package_id,
    catalog_package_id: draft.obligation.catalog_package_id,
    capability_overlay_id: draft.obligation.capability_overlay_id || "",
    linked_activity_references: draft.linked_activity_references,
    matched_behavior_codes: draft.matched_behavior_codes,
    matched_surface_tokens: draft.matched_surface_tokens,
    registry_key_ref: clonePlain(draft.obligation.registry_key_ref),
    obligation_catalog_ref: clonePlain(draft.obligation.obligation_catalog_ref),
    p2e_navigation_route_refs: draft.p2e_navigation_route_refs,
    candidate_status: draft.candidate_limitation.length
      ? DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES[1]
      : DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES[0],
    candidate_limitation: draft.candidate_limitation
  }));

  if (!candidates.length) limitations.push("NO_DOMAIN_CONTROL_OBLIGATION_CANDIDATES_MATCHED");

  return deepFreeze({
    artifact_type: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
    schema_version: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_SCHEMA_VERSION,
    run_id: normalizeId(runId),
    derivation_mode: DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE,
    source_navigation_index: NAVIGATION_INDEX_ARTIFACT,
    mounted_package_refs: clonePlain(resolved.mounted_taxonomy_ref || {}),
    candidate_count: candidates.length,
    candidates,
    inventory_limitations: uniqueStrings(limitations)
  });
}

function classificationBlockForObligation(activity = {}, obligation = {}) {
  if (obligation.source_layer === PRIMARY_SOURCE_LAYER) {
    const block = activity.primary_classification;
    if (!isPlainObject(block)) return null;
    return normalizeId(block.package_id) === normalizeId(obligation.source_package_id) ? block : null;
  }

  if (obligation.source_layer === CAPABILITY_SOURCE_LAYER) {
    const overlayId = normalizeId(obligation.capability_overlay_id);
    const packageId = normalizeId(obligation.source_package_id);
    return (Array.isArray(activity.overlay_classifications) ? activity.overlay_classifications : [])
      .find((block) => isPlainObject(block)
        && normalizeId(block.overlay_id) === overlayId
        && normalizeId(block.package_id) === packageId) || null;
  }

  return null;
}

function indexP2EFamilyRows(index = {}, limitations = []) {
  const map = new Map();
  for (const row of Array.isArray(index.obligation_family_routing) ? index.obligation_family_routing : []) {
    if (!isPlainObject(row)) continue;
    const key = p2eFamilyKey(row.domain_id, row.obligation_family);
    if (!normalizeId(row.domain_id) || !normalizeId(row.obligation_family)) {
      limitations.push("P2E_OBLIGATION_FAMILY_ROUTE_MALFORMED");
      continue;
    }
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(row);
  }
  return map;
}

function normalizeP2ERouteRef(row = {}) {
  return deepFreeze({
    route_ref_id: p2eFamilyKey(row.domain_id, row.obligation_family),
    domain_id: normalizeId(row.domain_id),
    obligation_family: normalizeId(row.obligation_family),
    required_control_source_route_ids: uniqueStrings(row.required_control_source_route_ids || []).sort(),
    selective_legal_route_ids: uniqueStrings(row.selective_legal_route_ids || []).sort(),
    locator_families: uniqueStrings(row.locator_families || []).sort(),
    legal_doc_types: uniqueStrings(row.legal_doc_types || []).sort(),
    shell_field_targets: uniqueStrings(row.shell_field_targets || []).sort(),
    reading_priority: normalizeArray(row.reading_priority).map((value) => clonePlain(value))
  });
}

function scopedObligationKey(row = {}) {
  return `${normalizeId(row.source_package_id) || "unknown"}:${normalizeId(row.obligation_id) || "missing"}`;
}

function p2eFamilyKey(domainId, obligationFamily) {
  return `${normalizeId(domainId)}:${normalizeId(obligationFamily)}`;
}

function compareCandidateDrafts(left, right) {
  return [
    left.obligation.source_layer,
    left.obligation.source_package_id,
    left.obligation.capability_overlay_id,
    left.obligation.obligation_id
  ].map(normalizeId).join(":").localeCompare([
    right.obligation.source_layer,
    right.obligation.source_package_id,
    right.obligation.capability_overlay_id,
    right.obligation.obligation_id
  ].map(normalizeId).join(":"));
}

function intersection(left, right) {
  const rightSet = new Set(uniqueStrings(right));
  return uniqueStrings(left).filter((value) => rightSet.has(value));
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

function normalizeArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function uniqueStrings(value) {
  return [...new Set(normalizeArray(value).flat(Infinity).map(normalizeId).filter(Boolean))];
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
