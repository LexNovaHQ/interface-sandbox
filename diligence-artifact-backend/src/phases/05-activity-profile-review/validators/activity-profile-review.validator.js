import {
  SHARED_ACTIVITY_FIELDS,
  CLASSIFICATION_BLOCK_FIELDS,
  OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  DERIVATION_BASIS_FIELDS,
  COMMERCIAL_AVAILABILITY_FIELDS,
  PROFILE_TOP_LEVEL_KEYS
} from "../activity-profile.constants.js";

const TFP = "target_feature_profile";
const ACTIVITY_FIELDS = Object.freeze([...SHARED_ACTIVITY_FIELDS, "primary_classification", "overlay_classifications"]);
const MOUNTED_TAXONOMY_REF_FIELDS = Object.freeze(["primary_package_id", "primary_key_version", "overlays"]);
const MOUNTED_TAXONOMY_OVERLAY_REF_FIELDS = Object.freeze(["overlay_id", "package_id", "key_version"]);
const RETIRED_KEYS = new Set(["archetype_codes", "archetype_derivation_basis", "archetype_vocabulary"]);
const MATERIAL_BLOCKED_KEYS = new Set([
  "validation_status", "lock_status", "status", "target_feature_profile_forensics",
  "feature_candidate_inventory", "activity_profile_source_index", "phase_route_runtime_packet",
  "runtime_trace", "source_ledger", "scratchpad", "debug", "candidate_id", "source_id",
  "source_url", "source_pointer", "source_ref", "source_pointers", "source_refs", "source_urls",
  "confidence", "excerpt", "lossless_text", "clean_text", "text"
]);
const MATERIAL_BLOCKED_FRAGMENTS = ["http://", "https://", "source_id", "source_url", "source_pointer", "source_ref", "candidate_id", "confidence", "runtime_trace", "_ledger"];

export function validateM8TargetFeatureOutput(output, { phase = "M8_TARGET_FEATURE_PROFILE", resolvedTaxonomy = null } = {}) {
  const failures = [];
  if (phase !== "M8_TARGET_FEATURE_PROFILE") failures.push(`M8_UNSUPPORTED_LAYER2_PHASE:${phase}`);
  if (!isPlainObject(output) || Object.keys(output).length !== 1 || !isPlainObject(output[TFP])) failures.push("target_feature_profile root invalid");
  if (!failures.length) validateProfile(output[TFP], failures, normalizeTaxonomy(resolvedTaxonomy));
  if (failures.length) throw new Error(`M8_TARGET_FEATURE_PROFILE_VALIDATION_FAILED:${JSON.stringify({ phase, failures })}`);
}

function validateProfile(profile, failures, taxonomy) {
  rejectKeyDiff(Object.keys(profile).sort(), [...PROFILE_TOP_LEVEL_KEYS].sort(), TFP, failures);
  if (!Array.isArray(profile.activities)) failures.push(`${TFP}.activities must be array`);
  if (!Array.isArray(profile.profile_level_limitations)) failures.push(`${TFP}.profile_level_limitations must be array`);
  validateCommercialAvailability(profile.commercial_availability_posture, failures);
  validateMountedTaxonomyRef(profile.mounted_taxonomy_ref, failures, taxonomy);
  rejectBlockedMaterial(profile, TFP, failures);

  const limitations = Array.isArray(profile.profile_level_limitations) ? profile.profile_level_limitations : [];
  for (const limitation of [...taxonomy.limitations, ...taxonomy.routing_limitations]) {
    if (!limitations.includes(limitation)) failures.push(`${TFP}.profile_level_limitations missing resolver/routing limitation:${limitation}`);
  }

  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  if (!activities.length && !limitations.length) failures.push("empty activities[] requires profile_level_limitations[]");
  const seen = new Set();
  activities.forEach((activity, index) => {
    const path = `${TFP}.activities[${index}]`;
    if (!isPlainObject(activity)) return failures.push(`${path} must be object`);
    rejectKeyDiff(Object.keys(activity).sort(), [...ACTIVITY_FIELDS].sort(), path, failures);
    rejectRetiredKeys(activity, path, failures);
    for (const field of SHARED_ACTIVITY_FIELDS) requireNonEmptyString(activity[field], `${path}.${field}`, failures);
    const ref = String(activity.activity_reference || "").trim();
    if (seen.has(ref)) failures.push(`${path}.activity_reference duplicate:${ref}`);
    if (ref) seen.add(ref);
    validatePrimary(activity.primary_classification, `${path}.primary_classification`, ref, limitations, taxonomy, failures);
    validateOverlays(activity.overlay_classifications, `${path}.overlay_classifications`, taxonomy, failures);
  });
}

function validateCommercialAvailability(value, failures) {
  const path = `${TFP}.commercial_availability_posture`;
  if (!isPlainObject(value)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(value).sort(), [...COMMERCIAL_AVAILABILITY_FIELDS].sort(), path, failures);
  for (const field of ["posture", "free_trial_freemium_signal", "beta_pilot_early_access_signal", "paid_production_enterprise_plan_signal", "limitation"]) requireNonEmptyString(value[field], `${path}.${field}`, failures);
  if (!Array.isArray(value.evidence_basis)) failures.push(`${path}.evidence_basis must be array`);
  for (const [index, item] of asArray(value.evidence_basis).entries()) requireNonEmptyString(item, `${path}.evidence_basis[${index}]`, failures);
}

function validatePrimary(block, path, activityReference, limitations, taxonomy, failures) {
  if (!isPlainObject(block)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(block).sort(), [...CLASSIFICATION_BLOCK_FIELDS].sort(), path, failures);
  rejectRetiredKeys(block, path, failures);
  const expectedPackageId = taxonomy.mounted_primary_package_id || taxonomy.primary?.package_id || "";
  if (block.package_id !== expectedPackageId) failures.push(`${path}.package_id mismatch:${block.package_id || "missing"} expected:${expectedPackageId || "missing"}`);
  validateClassificationBlock({ block, path, taxonomyBlock: taxonomy.primary, expectedPackageId, failures, primary: true, activityReference, limitations });
}

function validateOverlays(overlays, path, taxonomy, failures) {
  if (!Array.isArray(overlays)) return failures.push(`${path} must be array`);
  const expectedIds = asArray(taxonomy.overlays).map((row) => row.overlay_id).sort();
  const actualIds = overlays.map((row) => row?.overlay_id).filter(Boolean).sort();
  rejectKeyDiff(actualIds, expectedIds, `${path}.overlay_id`, failures);
  const seen = new Set();
  overlays.forEach((overlay, index) => {
    const overlayPath = `${path}[${index}]`;
    if (!isPlainObject(overlay)) return failures.push(`${overlayPath} must be object`);
    rejectKeyDiff(Object.keys(overlay).sort(), [...OVERLAY_CLASSIFICATION_BLOCK_FIELDS].sort(), overlayPath, failures);
    rejectRetiredKeys(overlay, overlayPath, failures);
    if (seen.has(overlay.overlay_id)) failures.push(`${overlayPath}.overlay_id duplicate:${overlay.overlay_id}`);
    seen.add(overlay.overlay_id);
    if (asArray(taxonomy.excluded_regulatory_overlay_ids).includes(overlay.overlay_id)) failures.push(`${overlayPath}.overlay_id regulatory overlay block forbidden:${overlay.overlay_id}`);
    const taxonomyBlock = asArray(taxonomy.overlays).find((row) => row.overlay_id === overlay.overlay_id);
    if (!taxonomyBlock) return failures.push(`${overlayPath} unresolved overlay block forbidden:${overlay.overlay_id || "missing"}`);
    validateClassificationBlock({ block: overlay, path: overlayPath, taxonomyBlock, expectedPackageId: taxonomyBlock.package_id, failures, primary: false, activityReference: "", limitations: [] });
  });
}

function validateClassificationBlock({ block, path, taxonomyBlock, expectedPackageId, failures, primary, activityReference, limitations }) {
  if (block.package_id !== expectedPackageId) failures.push(`${path}.package_id mismatch:${block.package_id || "missing"} expected:${expectedPackageId || "missing"}`);
  const codes = arrayOfStrings(block.behavior_class_codes, `${path}.behavior_class_codes`, failures);
  const surfaces = arrayOfStrings(block.surface_context_tokens, `${path}.surface_context_tokens`, failures);
  validateUnique(codes, `${path}.behavior_class_codes`, failures);
  validateUnique(surfaces, `${path}.surface_context_tokens`, failures);
  validateBasisArray(block.behavior_class_derivation_basis, `${path}.behavior_class_derivation_basis`, failures);
  validateBasisArray(block.surface_derivation_basis, `${path}.surface_derivation_basis`, failures);
  validateBasisCoverage(codes, block.behavior_class_derivation_basis, `${path}.behavior_class_derivation_basis`, failures, false);
  validateBasisCoverage(surfaces, block.surface_derivation_basis, `${path}.surface_derivation_basis`, failures, true);

  const vocabulary = new Set(asArray(taxonomyBlock?.behavior_class_vocabulary).map((entry) => entry.code));
  const surfaceTokens = new Set(asArray(taxonomyBlock?.surface_axes).flatMap((axis) => asArray(axis.tokens).map((entry) => entry.token)));
  if (taxonomyBlock) {
    for (const code of codes) if (!vocabulary.has(code)) failures.push(`${path}.behavior_class_codes contains code outside package vocabulary:${code}`);
    for (const token of surfaces) if (!surfaceTokens.has(token)) failures.push(`${path}.surface_context_tokens contains token outside package vocabulary:${token}`);
  }

  if (primary) {
    const noKey = !taxonomyBlock;
    const noKeyLimitation = `PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:${expectedPackageId}`;
    const noMatchLimitation = `NO_PRIMARY_BEHAVIOR_CLASS_MATCH:${activityReference}`;
    if (noKey) {
      if (!limitations.includes(noKeyLimitation)) failures.push(`${path} missing limitation for unkeyed primary:${noKeyLimitation}`);
      if (codes.length || asArray(block.behavior_class_derivation_basis).length || surfaces.length || asArray(block.surface_derivation_basis).length) failures.push(`${path} must have empty classification arrays when primary taxonomy key is unresolved`);
    } else if (!codes.length && !limitations.includes(noMatchLimitation)) failures.push(`${path}.behavior_class_codes empty without ${noMatchLimitation}`);
  } else if (!codes.length) failures.push(`${path}.behavior_class_codes must be non-empty for resolved overlay block`);
}

function validateBasisArray(value, path, failures) {
  if (!Array.isArray(value)) return failures.push(`${path} must be array`);
  value.forEach((item, index) => {
    const itemPath = `${path}[${index}]`;
    if (!isPlainObject(item)) return failures.push(`${itemPath} must be object`);
    rejectKeyDiff(Object.keys(item).sort(), [...DERIVATION_BASIS_FIELDS].sort(), itemPath, failures);
    for (const field of DERIVATION_BASIS_FIELDS) {
      if (field === "conditions_satisfied") {
        if (!Array.isArray(item[field])) failures.push(`${itemPath}.${field} must be array`);
      } else requireNonEmptyString(item[field], `${itemPath}.${field}`, failures);
    }
  });
}

function validateBasisCoverage(selected, basis, path, failures, allowEmpty) {
  const rows = asArray(basis);
  if (!selected.length && allowEmpty && rows.length) failures.push(`${path} must be empty when no values selected`);
  const basisCodes = rows.map((row) => String(row?.code_or_token || "").trim()).filter(Boolean);
  rejectKeyDiff([...basisCodes].sort(), [...selected].sort(), `${path}.code_or_token`, failures);
}

function validateMountedTaxonomyRef(ref, failures, taxonomy) {
  const path = `${TFP}.mounted_taxonomy_ref`;
  if (!isPlainObject(ref)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(ref).sort(), [...MOUNTED_TAXONOMY_REF_FIELDS].sort(), path, failures);
  if (ref.primary_package_id !== taxonomy.mounted_primary_package_id) failures.push(`${path}.primary_package_id mismatch`);
  if (ref.primary_key_version !== (taxonomy.primary?.key_version || "")) failures.push(`${path}.primary_key_version mismatch`);
  if (!Array.isArray(ref.overlays)) failures.push(`${path}.overlays must be array`);
  const expected = asArray(taxonomy.overlays).map((row) => `${row.overlay_id}:${row.package_id}:${row.key_version || ""}`).sort();
  const actual = asArray(ref.overlays).map((row, index) => {
    if (!isPlainObject(row)) { failures.push(`${path}.overlays[${index}] must be object`); return ""; }
    rejectKeyDiff(Object.keys(row).sort(), [...MOUNTED_TAXONOMY_OVERLAY_REF_FIELDS].sort(), `${path}.overlays[${index}]`, failures);
    return `${row.overlay_id}:${row.package_id}:${row.key_version || ""}`;
  }).sort();
  rejectKeyDiff(actual, expected, `${path}.overlays`, failures);
}

function normalizeTaxonomy(value) {
  const taxonomy = isPlainObject(value) ? value : {};
  return {
    ...taxonomy,
    primary: taxonomy.primary || null,
    overlays: asArray(taxonomy.overlays),
    limitations: asArray(taxonomy.limitations),
    routing_limitations: asArray(taxonomy.routing_limitations),
    excluded_regulatory_overlay_ids: asArray(taxonomy.excluded_regulatory_overlay_ids),
    mounted_primary_package_id: String(taxonomy.mounted_primary_package_id || taxonomy.primary?.package_id || "")
  };
}

function rejectBlockedMaterial(value, path, failures, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) return value.forEach((item, index) => rejectBlockedMaterial(item, `${path}[${index}]`, failures, seen));
  for (const [key, child] of Object.entries(value)) {
    if (MATERIAL_BLOCKED_KEYS.has(key)) failures.push(`${path}.${key} blocked material key`);
    rejectRetiredKeys({ [key]: child }, path, failures);
    rejectBlockedMaterial(child, `${path}.${key}`, failures, seen);
  }
  const serialized = JSON.stringify(value);
  for (const fragment of MATERIAL_BLOCKED_FRAGMENTS) if (serialized.includes(fragment)) failures.push(`${path} contains blocked source/forensic fragment:${fragment}`);
}

function rejectRetiredKeys(value, path, failures) {
  for (const key of Object.keys(value || {})) if (RETIRED_KEYS.has(key)) failures.push(`${path}.${key} retired Phase 5 material key`);
}
function rejectKeyDiff(actual, expected, path, failures) { if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${path} keys mismatch:${JSON.stringify({ actual, expected })}`); }
function arrayOfStrings(value, path, failures) { if (!Array.isArray(value)) { failures.push(`${path} must be array`); return []; } const rows = value.map((item) => String(item || "").trim()); rows.forEach((item, index) => { if (!item) failures.push(`${path}[${index}] must be non-empty string`); }); return rows.filter(Boolean); }
function validateUnique(value, path, failures) { if (new Set(value).size !== value.length) failures.push(`${path} contains duplicates`); }
function requireNonEmptyString(value, path, failures) { if (!(typeof value === "string" && value.trim())) failures.push(`${path} must be non-empty string`); }
function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function asArray(value) { return Array.isArray(value) ? value : []; }
