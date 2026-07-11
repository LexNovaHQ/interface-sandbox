import {
  BASE_ACTIVITY_EVIDENCE_ROOTS,
  CANDIDATE_CREATION_LOCATOR_MAPS,
  CONTEXT_ONLY_LOCATOR_MAPS,
  FEATURE_CANDIDATE_FIELDS,
  FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
  FEATURE_CANDIDATE_INVENTORY_MODE,
  FEATURE_CANDIDATE_INVENTORY_VERSION
} from "../activity-profile.constants.js";

export {
  FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
  FEATURE_CANDIDATE_INVENTORY_MODE,
  FEATURE_CANDIDATE_INVENTORY_VERSION
};

const FORBIDDEN_EVIDENCE_COPY_FIELDS = new Set([
  "excerpt", "lossless_text", "clean_text", "text", "body", "content", "markdown", "html",
  "mechanics_proof", "evidence_summary", "activity_candidate_summary", "archetype_proof",
  "surface_proof_and_routing_limits"
]);

const FORBIDDEN_PACKAGE_CLASSIFICATION_FIELDS = new Set([
  "archetype_codes", "archetype_derivation_basis", "surface_context_tokens", "surface_derivation_basis",
  "primary_classification", "overlay_classifications", "package_activity_classification",
  "package_specific_field_family", "selected_package", "package_id", "overlay_id"
]);

const STRUCTURAL_LABEL_FIELDS = Object.freeze([
  "feature_name", "capability_name", "product_name", "service_name", "name", "title", "heading",
  "section_title", "page_title", "label", "slug", "path"
]);

const STRUCTURAL_METADATA_CONTAINERS = Object.freeze([
  "metadata", "attributes", "frontmatter", "source_metadata", "document_metadata"
]);

export function buildFeatureCandidateInventoryBaseline(
  activityProfileSourceIndexInput,
  losslessUnitsByRootInput = {},
  options = {}
) {
  const index = unwrapActivityProfileSourceIndex(activityProfileSourceIndexInput);
  const losslessUnitsByRoot = unwrapLosslessUnitsByRoot(losslessUnitsByRootInput);
  const limitations = [];
  const evidenceIndexes = buildEvidenceIndexes(losslessUnitsByRoot);
  const rawHits = [];
  let candidateLocatorCount = 0;
  let mappedCandidateLocatorCount = 0;

  for (const mapKey of CANDIDATE_CREATION_LOCATOR_MAPS) {
    for (const row of rows(index[mapKey]).filter(candidateRowAllowed)) {
      candidateLocatorCount += 1;
      const sourceRoot = sourceRootFromLocator(row);
      const locatorRef = locatorReference(row);

      if (!BASE_ACTIVITY_EVIDENCE_ROOTS.includes(sourceRoot)) {
        limitations.push(`UNAUTHORIZED_ACTIVITY_EVIDENCE_ROOT:${sourceRoot || "missing"}`);
        continue;
      }

      const evidenceIndex = evidenceIndexes.get(sourceRoot);
      if (!evidenceIndex) {
        limitations.push(`NO_ROUTED_LOSSLESS_UNITS_AVAILABLE:${sourceRoot}`);
        continue;
      }

      const evidenceUnit = resolveEvidenceUnit(row, evidenceIndex);
      if (!evidenceUnit) {
        limitations.push(`INDEX_LOCATOR_DID_NOT_RESOLVE_TO_ROUTED_LOSSLESS_UNIT:${mapKey}:${locatorRef}`);
        continue;
      }

      mappedCandidateLocatorCount += 1;
      rawHits.push(rawHitFromMappedEvidence(row, mapKey, evidenceUnit));
    }
  }

  rawHits.sort(compareRawHits);
  const numberedRawHits = rawHits.map((hit, indexValue) => Object.freeze({
    ...hit,
    raw_hit_id: `RH.${String(indexValue + 1).padStart(3, "0")}`
  }));
  const { candidates, dedup_index, parent_child_overlap_index } = canonicalizeRawHits(numberedRawHits);
  const contextRows = buildContextPointerIndex(index, evidenceIndexes, limitations);
  const evidenceRootsOpened = [...evidenceIndexes.keys()].sort();

  if (candidateLocatorCount === 0) limitations.push("NO_CANDIDATE_CREATION_LOCATOR_ROWS");
  if (candidateLocatorCount > 0 && mappedCandidateLocatorCount === 0) {
    limitations.push("NO_INDEX_MAPPED_ROUTED_LOSSLESS_UNITS_AVAILABLE_FOR_CANDIDATE_CREATION");
  }

  return Object.freeze({
    artifact_type: FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
    inventory_version: FEATURE_CANDIDATE_INVENTORY_VERSION,
    run_id: options.runId || index?.run_id || null,
    derivation_mode: FEATURE_CANDIDATE_INVENTORY_MODE,
    source_index_artifact: "activity_profile_source_index",
    source_locator_maps_indexed: Object.freeze(
      CANDIDATE_CREATION_LOCATOR_MAPS.filter((mapKey) => rows(index[mapKey]).length)
    ),
    raw_hit_count: numberedRawHits.length,
    canonical_candidate_count: candidates.length,
    raw_feature_hit_index: Object.freeze(numberedRawHits.map(stripRawHit)),
    candidates: Object.freeze(candidates),
    canonicalization_index: Object.freeze(candidates.map((candidate) => Object.freeze({
      candidate_id: candidate.candidate_id,
      canonical_feature_key: candidate.canonical_feature_key,
      merged_raw_hit_ids: candidate.merged_raw_hit_ids
    }))),
    dedup_index: Object.freeze(dedup_index),
    parent_child_overlap_index: Object.freeze(parent_child_overlap_index),
    dedup_summary: Object.freeze({
      merged_duplicate_count: dedup_index.length,
      parent_child_overlap_count: parent_child_overlap_index.length
    }),
    context_pointer_index: Object.freeze(contextRows),
    deterministic_baseline_metadata: Object.freeze({
      baseline_version: FEATURE_CANDIDATE_INVENTORY_VERSION,
      candidate_locator_count: candidateLocatorCount,
      mapped_candidate_locator_count: mappedCandidateLocatorCount,
      unmapped_candidate_locator_count: candidateLocatorCount - mappedCandidateLocatorCount,
      evidence_roots_requested: Object.freeze([...BASE_ACTIVITY_EVIDENCE_ROOTS]),
      evidence_roots_opened: Object.freeze(evidenceRootsOpened),
      provider_called: false,
      package_taxonomy_applied: false
    }),
    index_boundary: Object.freeze({
      deterministic_baseline_only: true,
      source_index_artifact: "activity_profile_source_index",
      source_index_is_navigation_only: true,
      lossless_primary_evidence_read: true,
      phase2g_routed_packet_is_read_ceiling: true,
      evidence_unit_mapping_required: true,
      no_source_text_copy: true,
      no_evidence_text_copy: true,
      no_archetype_or_surface_derivation: true,
      no_package_specific_activity_classification: true,
      mounted_domain_package_controls_activity_taxonomy_later: true
    }),
    index_limitations: Object.freeze(uniqueStrings(limitations))
  });
}

export function buildFeatureCandidateInventoryIndex(
  activityProfileSourceIndexInput,
  losslessUnitsByRootOrOptions = {},
  maybeOptions = {}
) {
  if (looksLikeLegacyOptions(losslessUnitsByRootOrOptions)) {
    return buildFeatureCandidateInventoryBaseline(
      activityProfileSourceIndexInput,
      {},
      losslessUnitsByRootOrOptions
    );
  }
  return buildFeatureCandidateInventoryBaseline(
    activityProfileSourceIndexInput,
    losslessUnitsByRootOrOptions,
    maybeOptions
  );
}

export const buildFeatureCandidateInventory = buildFeatureCandidateInventoryBaseline;

export function validateFeatureCandidateInventoryIndex(input) {
  const inventory = unwrapInventory(input);
  const failures = [];

  if (inventory?.artifact_type !== FEATURE_CANDIDATE_INVENTORY_ARTIFACT) failures.push("artifact_type must be feature_candidate_inventory");
  if (inventory?.inventory_version !== FEATURE_CANDIDATE_INVENTORY_VERSION) failures.push("inventory_version mismatch");
  if (inventory?.derivation_mode !== FEATURE_CANDIDATE_INVENTORY_MODE) failures.push("inventory derivation_mode mismatch");
  if (inventory?.source_index_artifact !== "activity_profile_source_index") failures.push("inventory must derive from activity_profile_source_index");

  for (const field of [
    "source_locator_maps_indexed", "raw_feature_hit_index", "candidates", "canonicalization_index",
    "dedup_index", "parent_child_overlap_index", "context_pointer_index", "index_limitations"
  ]) {
    if (!Array.isArray(inventory?.[field])) failures.push(`${field} must be array`);
  }

  if (inventory?.index_boundary?.deterministic_baseline_only !== true) failures.push("deterministic baseline boundary missing");
  if (inventory?.index_boundary?.source_index_is_navigation_only !== true) failures.push("source index navigation boundary missing");
  if (inventory?.index_boundary?.lossless_primary_evidence_read !== true) failures.push("lossless primary evidence boundary missing");
  if (inventory?.index_boundary?.phase2g_routed_packet_is_read_ceiling !== true) failures.push("Phase 2G read ceiling boundary missing");
  if (inventory?.index_boundary?.no_source_text_copy !== true) failures.push("source text copy boundary missing");
  if (inventory?.index_boundary?.no_package_specific_activity_classification !== true) failures.push("package classification boundary missing");
  if (inventory?.deterministic_baseline_metadata?.provider_called !== false) failures.push("deterministic baseline must not call provider");
  if (inventory?.deterministic_baseline_metadata?.package_taxonomy_applied !== false) failures.push("deterministic baseline must not apply package taxonomy");

  const candidateKeys = new Set();
  const candidateIds = new Set();
  for (const candidate of inventory?.candidates || []) {
    const exactFields = Object.keys(candidate).sort();
    const expectedFields = [...FEATURE_CANDIDATE_FIELDS].sort();
    if (JSON.stringify(exactFields) !== JSON.stringify(expectedFields)) failures.push(`${candidate?.candidate_id || "candidate"}:candidate_field_set_mismatch`);
    if (!candidate.candidate_id || !candidate.canonical_feature_key) failures.push("candidate missing id/key");
    if (candidateIds.has(candidate.candidate_id)) failures.push(`duplicate candidate id:${candidate.candidate_id}`);
    candidateIds.add(candidate.candidate_id);
    if (candidateKeys.has(candidate.canonical_feature_key)) failures.push(`duplicate canonical key:${candidate.canonical_feature_key}`);
    candidateKeys.add(candidate.canonical_feature_key);
    if (candidate.evidence_grounded !== true) failures.push(`${candidate.candidate_id || "candidate"}:evidence_grounded_must_be_true`);
    if (!Array.isArray(candidate.source_pointers) || !candidate.source_pointers.length) failures.push(`${candidate.candidate_id || "candidate"}:source_pointers_missing`);
    for (const pointer of candidate.source_pointers || []) validateSourcePointer(pointer, candidate.candidate_id || "candidate", failures);
  }

  for (const rawHit of inventory?.raw_feature_hit_index || []) {
    if (rawHit?.evidence_unit_mapped !== true) failures.push(`${rawHit?.raw_hit_id || "raw_hit"}:evidence_unit_not_mapped`);
    validateSourcePointer(rawHit?.source_pointer, rawHit?.raw_hit_id || "raw_hit", failures);
  }

  if (inventory?.raw_hit_count !== (inventory?.raw_feature_hit_index || []).length) failures.push("raw_hit_count mismatch");
  if (inventory?.canonical_candidate_count !== (inventory?.candidates || []).length) failures.push("canonical_candidate_count mismatch");
  if (containsEvidenceCopy(inventory)) failures.push("inventory contains evidence-copy fields");
  if (containsPackageClassification(inventory)) failures.push("inventory contains package-specific classification fields");

  return Object.freeze({
    status: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze(failures)
  });
}

export const validateFeatureCandidateInventory = validateFeatureCandidateInventoryIndex;

function buildEvidenceIndexes(losslessUnitsByRoot) {
  const indexes = new Map();
  for (const root of BASE_ACTIVITY_EVIDENCE_ROOTS) {
    if (!(root in losslessUnitsByRoot)) continue;
    const evidenceIndex = buildEvidenceUnitIndex(losslessUnitsByRoot[root]);
    if (evidenceIndex.units.length) indexes.set(root, evidenceIndex);
  }
  return indexes;
}

function buildEvidenceUnitIndex(payload) {
  const units = [];
  const aliases = new Map();
  const seen = new Set();

  const visit = (value, structuralPath) => {
    if (!value || typeof value !== "object" || seen.has(value)) return;
    seen.add(value);
    if (Array.isArray(value)) {
      value.forEach((entry, index) => visit(entry, `${structuralPath}[${index}]`));
      return;
    }
    if (isStructuralEvidenceUnit(value)) {
      const record = Object.freeze({ unit: value, structural_path: structuralPath });
      units.push(record);
      for (const alias of evidenceAliases(value)) if (!aliases.has(alias)) aliases.set(alias, record);
    }
    for (const [key, child] of Object.entries(value)) {
      if (FORBIDDEN_EVIDENCE_COPY_FIELDS.has(key)) continue;
      if (child && typeof child === "object") visit(child, `${structuralPath}.${key}`);
    }
  };

  visit(payload, "$root");
  return Object.freeze({ units: Object.freeze(units), aliases });
}

function resolveEvidenceUnit(row, evidenceIndex) {
  for (const alias of locatorAliases(row)) {
    const matched = evidenceIndex.aliases.get(alias);
    if (matched) return matched;
  }
  return evidenceIndex.units.length === 1 ? evidenceIndex.units[0] : null;
}

function rawHitFromMappedEvidence(row, mapKey, evidenceRecord) {
  const sourceRoot = sourceRootFromLocator(row);
  const routeClass = String(row.route_class || mapKey.replace(/_locator_map$/, ""));
  const structuralLabel = structuralLabelFromUnit(evidenceRecord.unit);
  const candidateName = domainNeutralTitleCase(firstNonEmptyString(
    structuralLabel,
    row.matched_signal_labels?.[0],
    row.route_class,
    row.route_code,
    row.unit_id,
    row.source_id,
    sourceRoot
  ));
  const capabilityKey = normalizeSlug(firstNonEmptyString(
    structuralLabel,
    row.unit_id,
    row.source_id,
    row.route_code,
    candidateName
  ));

  return Object.freeze({
    source_root: sourceRoot,
    source_locator_map: mapKey,
    source_id: String(row.source_id || evidenceIdentity(evidenceRecord.unit).source_id || ""),
    raw_name: candidateName,
    raw_type: normalizeRawType(routeClass),
    activity_route_class: routeClass,
    capability_key: capabilityKey,
    evidence_unit_mapped: true,
    evidence_unit_ref: Object.freeze({
      source_root: sourceRoot,
      unit_id: String(row.unit_id || evidenceIdentity(evidenceRecord.unit).unit_id || ""),
      source_id: String(row.source_id || evidenceIdentity(evidenceRecord.unit).source_id || ""),
      structural_path: evidenceRecord.structural_path
    }),
    source_pointer: Object.freeze(pointerFromLocator(row, sourceRoot))
  });
}

function buildContextPointerIndex(index, evidenceIndexes, limitations) {
  const contextRows = [];
  for (const mapKey of CONTEXT_ONLY_LOCATOR_MAPS) {
    for (const row of rows(index[mapKey])) {
      const sourceRoot = sourceRootFromLocator(row);
      if (!BASE_ACTIVITY_EVIDENCE_ROOTS.includes(sourceRoot)) continue;
      const evidenceIndex = evidenceIndexes.get(sourceRoot);
      if (!evidenceIndex) continue;
      const evidenceUnit = resolveEvidenceUnit(row, evidenceIndex);
      if (!evidenceUnit) {
        limitations.push(`CONTEXT_LOCATOR_DID_NOT_RESOLVE_TO_ROUTED_LOSSLESS_UNIT:${mapKey}:${locatorReference(row)}`);
        continue;
      }
      contextRows.push(Object.freeze({
        source_locator_map: mapKey,
        ...pointerFromLocator(row, sourceRoot),
        evidence_unit_mapped: true
      }));
    }
  }
  return contextRows;
}

function canonicalizeRawHits(rawHits) {
  const byKey = new Map();
  for (const hit of rawHits) {
    const key = `${normalizeSlug(hit.activity_route_class)}::${hit.capability_key}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push(hit);
  }

  const candidates = [];
  const dedup_index = [];
  let counter = 1;
  for (const [canonical_feature_key, hits] of [...byKey.entries()].sort(([a], [b]) => a.localeCompare(b))) {
    const sortedHits = [...hits].sort(compareRawHits);
    const primary = sortedHits[0];
    const candidate_id = `FC.${String(counter++).padStart(3, "0")}`;
    const merged_raw_hit_ids = Object.freeze(sortedHits.map((hit) => hit.raw_hit_id));
    for (const duplicate of sortedHits.slice(1)) {
      dedup_index.push(Object.freeze({
        canonical_candidate_id: candidate_id,
        primary_raw_hit_id: primary.raw_hit_id,
        merged_raw_hit_id: duplicate.raw_hit_id,
        merge_basis: "same_route_class_and_structural_capability_key"
      }));
    }
    candidates.push(Object.freeze({
      candidate_id,
      canonical_feature_key,
      candidate_name: primary.raw_name,
      candidate_type: primary.raw_type,
      candidate_status: "DETERMINISTIC_BASELINE_CANDIDATE",
      activity_route_class: primary.activity_route_class,
      capability_key: primary.capability_key,
      source_root: primary.source_root,
      evidence_grounded: true,
      mandatory_profile_treatment: "PACKAGE_AWARE_ACTIVITY_REVIEW_OR_LIMITATION",
      merged_raw_hit_ids,
      source_pointers: Object.freeze(sortedHits.map((hit) => hit.source_pointer))
    }));
  }

  return { candidates, dedup_index, parent_child_overlap_index: [] };
}

function validateSourcePointer(pointer, ownerId, failures) {
  if (!pointer || typeof pointer !== "object" || Array.isArray(pointer)) {
    failures.push(`${ownerId}:source_pointer_invalid`);
    return;
  }
  for (const field of [
    "source_artifact", "source_id", "source_root", "route_class", "route_code", "locator_id",
    "unit_id", "source_pointer", "unit_pointer"
  ]) {
    if (!(field in pointer)) failures.push(`${ownerId}:source_pointer_missing_field:${field}`);
  }
  if (!pointer.source_artifact || !pointer.source_root || !pointer.route_class) failures.push(`${ownerId}:source_pointer_missing_routing_identity`);
  if (!firstNonEmptyStringOrNull(
    pointer.locator_id,
    pointer.unit_id,
    stablePointer(pointer.source_pointer),
    stablePointer(pointer.unit_pointer)
  )) failures.push(`${ownerId}:source_pointer_missing_stable_locator`);
}

function unwrapActivityProfileSourceIndex(input) {
  if (input?.activity_profile_source_index && typeof input.activity_profile_source_index === "object") return input.activity_profile_source_index;
  if (input?.artifact?.activity_profile_source_index && typeof input.artifact.activity_profile_source_index === "object") return input.artifact.activity_profile_source_index;
  if (input?.artifact && typeof input.artifact === "object" && (
    input.artifact.activity_candidate_source_locator_map || input.artifact.product_capability_locator_map
  )) return input.artifact;
  return input || {};
}

function unwrapLosslessUnitsByRoot(input) {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  if (input.lossless_units_by_root && typeof input.lossless_units_by_root === "object") return input.lossless_units_by_root;
  if (input.artifacts && typeof input.artifacts === "object") return input.artifacts;
  return input;
}

function looksLikeLegacyOptions(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  if (BASE_ACTIVITY_EVIDENCE_ROOTS.some((root) => Object.hasOwn(value, root))) return false;
  return ["runId", "activeRunPackageManifest", "domainDerivationProfile"].some((key) => Object.hasOwn(value, key));
}

function candidateRowAllowed(row = {}) {
  return row && row.route_action === "LOCATE_ONLY" && row.candidate_creation_allowed !== false && row.context_only !== true;
}

function rows(value) {
  return Array.isArray(value) ? value.filter((row) => row && typeof row === "object") : [];
}

function sourceRootFromLocator(row) {
  return String(row?.common_root || row?.source_root || row?.root_artifact || "");
}

function pointerFromLocator(row, sourceRoot) {
  return {
    source_artifact: String(row.source_artifact || sourceRoot || ""),
    source_id: String(row.source_id || ""),
    source_root: String(sourceRoot || ""),
    route_class: String(row.route_class || ""),
    route_code: String(row.route_code || ""),
    locator_id: String(row.locator_id || ""),
    unit_id: String(row.unit_id || ""),
    source_pointer: row.source_pointer ?? null,
    unit_pointer: row.unit_pointer ?? null
  };
}

function locatorReference(row) {
  return firstNonEmptyString(
    row?.locator_id,
    row?.unit_id,
    row?.source_id,
    stablePointer(row?.unit_pointer),
    stablePointer(row?.source_pointer),
    "unidentified-locator"
  );
}

function locatorAliases(row) {
  return uniqueStrings([
    row?.unit_id,
    row?.source_id,
    row?.locator_id,
    stablePointer(row?.unit_pointer),
    stablePointer(row?.source_pointer)
  ].map(normalizeAlias));
}

function evidenceAliases(unit) {
  const identity = evidenceIdentity(unit);
  return uniqueStrings([
    identity.unit_id,
    identity.source_id,
    identity.locator_id,
    identity.id,
    stablePointer(identity.unit_pointer),
    stablePointer(identity.source_pointer)
  ].map(normalizeAlias));
}

function evidenceIdentity(unit = {}) {
  return {
    unit_id: unit.unit_id || unit.id || unit.page_id || unit.section_id || "",
    source_id: unit.source_id || unit.document_id || unit.page_id || "",
    locator_id: unit.locator_id || "",
    id: unit.id || "",
    unit_pointer: unit.unit_pointer ?? null,
    source_pointer: unit.source_pointer ?? null
  };
}

function isStructuralEvidenceUnit(value) {
  const identity = evidenceIdentity(value);
  if (firstNonEmptyStringOrNull(
    identity.unit_id,
    identity.source_id,
    identity.locator_id,
    identity.id,
    stablePointer(identity.unit_pointer),
    stablePointer(identity.source_pointer)
  )) return true;
  return STRUCTURAL_LABEL_FIELDS.some((field) => typeof value[field] === "string" && value[field].trim());
}

function structuralLabelFromUnit(unit = {}) {
  const direct = STRUCTURAL_LABEL_FIELDS.map((field) => unit[field]);
  const nested = STRUCTURAL_METADATA_CONTAINERS.flatMap((container) => {
    const metadata = unit[container];
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return [];
    return STRUCTURAL_LABEL_FIELDS.map((field) => metadata[field]);
  });
  return firstNonEmptyStringOrNull(...direct, ...nested) || "";
}

function stripRawHit(hit) {
  return Object.freeze({
    raw_hit_id: hit.raw_hit_id,
    source_root: hit.source_root,
    source_locator_map: hit.source_locator_map,
    source_id: hit.source_id,
    raw_name: hit.raw_name,
    raw_type: hit.raw_type,
    activity_route_class: hit.activity_route_class,
    capability_key: hit.capability_key,
    evidence_unit_mapped: hit.evidence_unit_mapped,
    evidence_unit_ref: hit.evidence_unit_ref,
    source_pointer: hit.source_pointer
  });
}

function compareRawHits(a, b) {
  return [a.source_root, a.activity_route_class, a.capability_key, a.source_id, stablePointer(a.source_pointer)]
    .join("::")
    .localeCompare([b.source_root, b.activity_route_class, b.capability_key, b.source_id, stablePointer(b.source_pointer)].join("::"));
}

function normalizeRawType(routeClass) {
  return String(routeClass || "GENERIC_ACTIVITY_LOCATOR")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "") || "GENERIC_ACTIVITY_LOCATOR";
}

function unwrapInventory(input) {
  return input?.feature_candidate_inventory || input;
}

function normalizeSlug(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

function domainNeutralTitleCase(value) {
  return normalizeSlug(value)
    .split("-")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function firstNonEmptyString(...values) {
  return firstNonEmptyStringOrNull(...values) || "Activity Candidate";
}

function firstNonEmptyStringOrNull(...values) {
  for (const value of values.flat()) {
    if (typeof value === "string" && value.trim()) return value.trim().slice(0, 240);
  }
  return null;
}

function normalizeAlias(value) {
  return String(value || "").trim().toLowerCase();
}

function stablePointer(value) {
  if (value === null || value === undefined || value === "") return "";
  if (typeof value === "string" || typeof value === "number") return String(value);
  if (Array.isArray(value)) return `[${value.map(stablePointer).join(",")}]`;
  if (typeof value === "object") {
    return `{${Object.keys(value).sort().map((key) => `${key}:${stablePointer(value[key])}`).join(",")}}`;
  }
  return String(value);
}

function uniqueStrings(values) {
  return [...new Set((values || []).filter((value) => typeof value === "string" && value.length))];
}

function containsEvidenceCopy(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsEvidenceCopy);
  return Object.keys(value).some((key) => FORBIDDEN_EVIDENCE_COPY_FIELDS.has(key)) || Object.values(value).some(containsEvidenceCopy);
}

function containsPackageClassification(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(containsPackageClassification);
  return Object.keys(value).some((key) => FORBIDDEN_PACKAGE_CLASSIFICATION_FIELDS.has(key)) || Object.values(value).some(containsPackageClassification);
}
