import {
  SHARED_ACTIVITY_FIELDS,
  CLASSIFICATION_BLOCK_FIELDS,
  OVERLAY_CLASSIFICATION_BLOCK_FIELDS,
  DERIVATION_BASIS_FIELDS,
  COMMERCIAL_AVAILABILITY_FIELDS,
  PROFILE_TOP_LEVEL_KEYS
} from "../activity-profile.constants.js";

const TFP = "target_feature_profile";
const MATERIAL_TOP_LEVEL_KEYS = Object.freeze([TFP]);
const ACTIVITY_FIELDS = Object.freeze([...SHARED_ACTIVITY_FIELDS, "primary_classification", "overlay_classifications"]);
const MOUNTED_TAXONOMY_REF_FIELDS = Object.freeze(["primary_package_id", "primary_key_version", "overlays"]);
const MOUNTED_TAXONOMY_OVERLAY_REF_FIELDS = Object.freeze(["overlay_id", "package_id", "key_version"]);

const MATERIAL_BLOCKED_KEYS = Object.freeze([
  "validation_status",
  "lock_status",
  "status",
  "target_feature_profile_forensics",
  "feature_candidate_inventory",
  "activity_profile_source_index",
  "phase_route_runtime_packet",
  "runtime_trace",
  "source_ledger",
  "scratchpad",
  "debug",
  "archetype_proof",
  "surface_proof_and_routing_limits",
  "candidate_id",
  "source_id",
  "source_url",
  "source_pointer",
  "source_ref",
  "source_pointers",
  "source_refs",
  "source_urls",
  "confidence",
  "excerpt",
  "lossless_text",
  "clean_text",
  "text"
]);

const MATERIAL_BLOCKED_FRAGMENTS = Object.freeze([
  "http://",
  "https://",
  "source_id",
  "source_url",
  "source_pointer",
  "source_ref",
  "candidate_id",
  "confidence",
  "runtime_trace",
  "_ledger"
]);

export function validateM8TargetFeatureOutput(output, { phase = "M8_TARGET_FEATURE_PROFILE", resolvedTaxonomy = null } = {}) {
  const failures = [];

  if (phase !== "M8_TARGET_FEATURE_PROFILE") {
    throw new Error(`M8_TARGET_FEATURE_PROFILE_VALIDATION_FAILED:${JSON.stringify({ phase, failures: [`M8_UNSUPPORTED_LAYER2_PHASE:${phase}`] })}`);
  }

  validateExactTopLevelKeys(output, MATERIAL_TOP_LEVEL_KEYS, failures, phase);

  if (!failures.length) {
    validateProfile(output[TFP], failures, normalizeResolvedTaxonomy(resolvedTaxonomy));
  }

  if (failures.length) {
    throw new Error(`M8_TARGET_FEATURE_PROFILE_VALIDATION_FAILED:${JSON.stringify({ phase, failures })}`);
  }
}

function validateProfile(profile, failures, taxonomy) {
  if (!isPlainObject(profile)) return failures.push(`${TFP} must be object`);

  rejectKeyDiff(Object.keys(profile).sort(), [...PROFILE_TOP_LEVEL_KEYS].sort(), TFP, failures);

  if (!Array.isArray(profile.activities)) failures.push(`${TFP}.activities must be array`);
  if (!Array.isArray(profile.profile_level_limitations)) failures.push(`${TFP}.profile_level_limitations must be array`);

  validateCommercialAvailability(profile.commercial_availability_posture, failures);
  validateMountedTaxonomyRef(profile.mounted_taxonomy_ref, failures, taxonomy);

  if (containsAnyKey(profile, MATERIAL_BLOCKED_KEYS)) failures.push(`${TFP} contains blocked material key`);
  if (containsBlockedFragment(profile)) failures.push(`${TFP} contains blocked source/forensic fragment`);

  const limitations = Array.isArray(profile.profile_level_limitations) ? profile.profile_level_limitations : [];
  for (const limitation of [...taxonomy.limitations, ...taxonomy.routing_limitations]) {
    if (!limitations.includes(limitation)) failures.push(`${TFP}.profile_level_limitations missing resolver/routing limitation: ${limitation}`);
  }

  const activities = Array.isArray(profile.activities) ? profile.activities : [];
  if (!activities.length && !limitations.length) failures.push("empty activities[] requires profile_level_limitations[]");

  const seenRefs = new Set();
  activities.forEach((activity, index) => {
    const ref = typeof activity?.activity_reference === "string" ? activity.activity_reference.trim() : "";
    if (ref) {
      if (seenRefs.has(ref)) failures.push(`${TFP}.activities[${index}].activity_reference duplicate:${ref}`);
      seenRefs.add(ref);
    }
    validateActivity(activity, index, failures, taxonomy, limitations);
  });
}

function validateCommercialAvailability(value, failures) {
  const path = `${TFP}.commercial_availability_posture`;
  if (!isPlainObject(value)) return failures.push(`${path} must be object`);

  rejectKeyDiff(Object.keys(value).sort(), [...COMMERCIAL_AVAILABILITY_FIELDS].sort(), path, failures);

  for (const field of ["posture", "free_trial_freemium_signal", "beta_pilot_early_access_signal", "paid_production_enterprise_plan_signal", "limitation"]) {
    if (!(typeof value[field] === "string" && value[field].trim())) failures.push(`${path}.${field} must be non-empty string`);
  }

  if (!Array.isArray(value.evidence_basis)) failures.push(`${path}.evidence_basis must be array`);
  for (const [index, item] of (Array.isArray(value.evidence_basis) ? value.evidence_basis : []).entries()) {
    if (!(typeof item === "string" && item.trim())) failures.push(`${path}.evidence_basis[${index}] must be non-empty string`);
    if (containsBlockedFragment(item)) failures.push(`${path}.evidence_basis[${index}] contains blocked source fragment`);
  }
}

function validateActivity(activity, index, failures, taxonomy, limitations) {
  const path = `${TFP}.activities[${index}]`;

  if (!isPlainObject(activity)) return failures.push(`${path} must be object`);

  rejectKeyDiff(Object.keys(activity).sort(), [...ACTIVITY_FIELDS].sort(), path, failures);

  for (const field of SHARED_ACTIVITY_FIELDS) {
    if (!(typeof activity[field] === "string" && activity[field].trim())) failures.push(`${path}.${field} must be non-empty string`);
  }

  validatePrimaryClassification({
    block: activity.primary_classification,
    path: `${path}.primary_classification`,
    activityReference: activity.activity_reference,
    taxonomy,
    limitations,
    failures
  });

  validateOverlayBlocks({
    overlays: activity.overlay_classifications,
    path: `${path}.overlay_classifications`,
    taxonomy,
    failures
  });
}

function validatePrimaryClassification({ block, path, activityReference, taxonomy, limitations, failures }) {
  if (!isPlainObject(block)) return failures.push(`${path} must be object`);

  rejectKeyDiff(Object.keys(block).sort(), [...CLASSIFICATION_BLOCK_FIELDS].sort(), path, failures);

  const expectedPackageId = taxonomy.mounted_primary_package_id || taxonomy.primary?.package_id || "";
  if (block.package_id !== expectedPackageId) {
    failures.push(`${path}.package_id mismatch:${block.package_id || "missing"} expected:${expectedPackageId || "missing"}`);
  }

  validateClassificationBlock({
    block,
    path,
    taxonomyBlock: taxonomy.primary,
    expectedPackageId,
    failures,
    primary: true,
    activityReference,
    limitations
  });
}

function validateOverlayBlocks({ overlays, path, taxonomy, failures }) {
  if (!Array.isArray(overlays)) return failures.push(`${path} must be array`);

  const expectedIds = (taxonomy.overlays || []).map((overlay) => overlay.overlay_id).sort();
  const actualIds = overlays.map((overlay) => overlay?.overlay_id).filter(Boolean).sort();

  rejectKeyDiff(actualIds, expectedIds, `${path}.overlay_id`, failures);

  const seen = new Set();
  overlays.forEach((overlay, index) => {
    const overlayPath = `${path}[${index}]`;
    if (!isPlainObject(overlay)) return failures.push(`${overlayPath} must be object`);

    rejectKeyDiff(Object.keys(overlay).sort(), [...OVERLAY_CLASSIFICATION_BLOCK_FIELDS].sort(), overlayPath, failures);

    if (seen.has(overlay.overlay_id)) failures.push(`${overlayPath}.overlay_id duplicate:${overlay.overlay_id}`);
    seen.add(overlay.overlay_id);

    if ((taxonomy.excluded_regulatory_overlay_ids || []).includes(overlay.overlay_id)) {
      failures.push(`${overlayPath}.overlay_id regulatory overlay block forbidden:${overlay.overlay_id}`);
    }

    const taxonomyBlock = (taxonomy.overlays || []).find((item) => item.overlay_id === overlay.overlay_id);
    if (!taxonomyBlock) {
      failures.push(`${overlayPath} unresolved overlay block forbidden:${overlay.overlay_id || "missing"}`);
      return;
    }

    validateClassificationBlock({
      block: overlay,
      path: overlayPath,
      taxonomyBlock,
      expectedPackageId: taxonomyBlock.package_id,
      failures,
      primary: false,
      activityReference: "",
      limitations: []
    });
  });
}

function validateClassificationBlock({
  block,
  path,
  taxonomyBlock,
  expectedPackageId,
  failures,
  primary,
  activityReference,
  limitations
}) {
  if (block.package_id !== expectedPackageId) {
    failures.push(`${path}.package_id mismatch:${block.package_id || "missing"} expected:${expectedPackageId || "missing"}`);
  }

  const codes = arrayOfStrings(block.archetype_codes, `${path}.archetype_codes`, failures);
  const surfaces = arrayOfStrings(block.surface_context_tokens, `${path}.surface_context_tokens`, failures);

  validateUniqueSelections(codes, `${path}.archetype_codes`, failures);
  validateUniqueSelections(surfaces, `${path}.surface_context_tokens`, failures);

  validateBasisArray(block.archetype_derivation_basis, `${path}.archetype_derivation_basis`, failures);
  validateBasisArray(block.surface_derivation_basis, `${path}.surface_derivation_basis`, failures);

  validateBasisCoverage({
    selected: codes,
    basis: block.archetype_derivation_basis,
    path: `${path}.archetype_derivation_basis`,
    label: "archetype",
    failures
  });

  validateBasisCoverage({
    selected: surfaces,
    basis: block.surface_derivation_basis,
    path: `${path}.surface_derivation_basis`,
    label: "surface",
    failures,
    allowEmptySelected: true
  });

  const vocabCodes = new Set((taxonomyBlock?.archetype_vocabulary || []).map((entry) => entry.code));
  const surfaceTokens = new Set((taxonomyBlock?.surface_axes || []).flatMap((axis) => (axis.tokens || []).map((entry) => entry.token)));

  if (taxonomyBlock) {
    for (const code of codes) if (!vocabCodes.has(code)) failures.push(`${path}.archetype_codes contains code outside package vocabulary:${code}`);
    for (const token of surfaces) if (!surfaceTokens.has(token)) failures.push(`${path}.surface_context_tokens contains token outside package vocabulary:${token}`);
  }

  if (primary) {
    const noPrimaryKey = !taxonomyBlock;
    const primaryLimitation = `PRIMARY_PACKAGE_HAS_NO_TAXONOMY_KEY:${expectedPackageId}`;
    const noMatchLimitation = `NO_PRIMARY_ARCHETYPE_MATCH:${activityReference}`;

    if (noPrimaryKey) {
      if (!limitations.includes(primaryLimitation)) failures.push(`${path} missing limitation for unkeyed primary:${primaryLimitation}`);
      if (codes.length || block.archetype_derivation_basis.length || surfaces.length || block.surface_derivation_basis.length) {
        failures.push(`${path} must have empty classification arrays when primary taxonomy key is unresolved`);
      }
      return;
    }

    if (!codes.length && !limitations.includes(noMatchLimitation)) {
      failures.push(`${path}.archetype_codes empty without ${noMatchLimitation}`);
    }
  } else if (!codes.length) {
    failures.push(`${path}.archetype_codes must be non-empty for resolved overlay block`);
  }
}

function validateMountedTaxonomyRef(ref, failures, taxonomy) {
  const path = `${TFP}.mounted_taxonomy_ref`;
  if (!isPlainObject(ref)) return failures.push(`${path} must be object`);

  rejectKeyDiff(Object.keys(ref).sort(), [...MOUNTED_TAXONOMY_REF_FIELDS].sort(), path, failures);

  if (ref.primary_package_id !== taxonomy.mounted_primary_package_id) {
    failures.push(`${path}.primary_package_id mismatch:${ref.primary_package_id || "missing"} expected:${taxonomy.mounted_primary_package_id || "missing"}`);
  }

  const expectedPrimaryVersion = taxonomy.primary?.key_version || "";
  if (ref.primary_key_version !== expectedPrimaryVersion) {
    failures.push(`${path}.primary_key_version mismatch:${ref.primary_key_version || "missing"} expected:${expectedPrimaryVersion || "empty"}`);
  }

  if (!Array.isArray(ref.overlays)) failures.push(`${path}.overlays must be array`);

  const expected = (taxonomy.overlays || []).map((overlay) => `${overlay.overlay_id}:${overlay.package_id}:${overlay.key_version || ""}`).sort();
  const actual = (Array.isArray(ref.overlays) ? ref.overlays : []).map((overlay, index) => {
    const overlayPath = `${path}.overlays[${index}]`;
    if (!isPlainObject(overlay)) {
      failures.push(`${overlayPath} must be object`);
      return "";
    }
    rejectKeyDiff(Object.keys(overlay).sort(), [...MOUNTED_TAXONOMY_OVERLAY_REF_FIELDS].sort(), overlayPath, failures);
    return `${overlay.overlay_id}:${overlay.package_id}:${overlay.key_version || ""}`;
  }).sort();

  rejectKeyDiff(actual, expected, `${path}.overlays`, failures);
}

function validateBasisArray(value, path, failures) {
  if (!Array.isArray(value)) return failures.push(`${path} must be array`);

  for (const [index, item] of value.entries()) {
    const itemPath = `${path}[${index}]`;
    if (!isPlainObject(item)) {
      failures.push(`${itemPath} must be object`);
      continue;
    }

    rejectKeyDiff(Object.keys(item).sort(), [...DERIVATION_BASIS_FIELDS].sort(), itemPath, failures);

    for (const field of DERIVATION_BASIS_FIELDS) {
      const fieldValue = item[field];
      if (field === "conditions_satisfied") {
        if (!Array.isArray(fieldValue) || !fieldValue.length) failures.push(`${itemPath}.conditions_satisfied must be non-empty array`);
        for (const [conditionIndex, condition] of (Array.isArray(fieldValue) ? fieldValue : []).entries()) {
          if (!(typeof condition === "string" && condition.trim())) failures.push(`${itemPath}.conditions_satisfied[${conditionIndex}] must be non-empty string`);
        }
      } else if (!(typeof fieldValue === "string" && fieldValue.trim())) {
        failures.push(`${itemPath}.${field} must be non-empty string`);
      }
    }
  }
}

function validateBasisCoverage({ selected, basis, path, label, failures, allowEmptySelected = false }) {
  if (!Array.isArray(basis)) return;

  const selectedValues = selected.filter((item) => typeof item === "string" && item.trim());
  const basisValues = basis.map((item) => (isPlainObject(item) ? String(item.code_or_token || "").trim() : "")).filter(Boolean);

  if (!selectedValues.length && allowEmptySelected && !basisValues.length) return;

  for (const selectedValue of selectedValues) {
    const count = basisValues.filter((basisValue) => basisValue === selectedValue).length;
    if (count !== 1) failures.push(`${path} must contain exactly one basis entry for selected ${label}: ${selectedValue}`);
  }

  for (const basisValue of basisValues) {
    if (!selectedValues.includes(basisValue)) failures.push(`${path} contains basis entry for unselected ${label}: ${basisValue}`);
  }

  validateUniqueSelections(basisValues, `${path}.code_or_token`, failures);
}

function arrayOfStrings(value, path, failures) {
  if (!Array.isArray(value)) {
    failures.push(`${path} must be array`);
    return [];
  }

  for (const [index, item] of value.entries()) {
    if (!(typeof item === "string" && item.trim())) failures.push(`${path}[${index}] must be non-empty string`);
  }

  return value.filter((item) => typeof item === "string" && item.trim());
}

function validateUniqueSelections(values, path, failures) {
  const seen = new Set();
  for (const value of values) {
    if (typeof value !== "string" || !value.trim()) continue;
    if (seen.has(value)) failures.push(`${path} contains duplicate value: ${value}`);
    seen.add(value);
  }
}

function validateExactTopLevelKeys(output, expected, failures, phase) {
  if (!isPlainObject(output)) return failures.push(`${phase}_OUTPUT_INVALID:not_object`);
  rejectKeyDiff(Object.keys(output).sort(), [...expected].sort(), phase, failures);
}

function rejectKeyDiff(actual, expected, label, failures) {
  const missing = expected.filter((key) => !actual.includes(key));
  const extra = actual.filter((key) => !expected.includes(key));
  if (missing.length) failures.push(`${label} missing keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`${label} extra keys: ${extra.join(",")}`);
}

function normalizeResolvedTaxonomy(input = {}) {
  const primary = input?.primary || null;
  const overlays = Array.isArray(input?.overlays) ? input.overlays : [];
  return Object.freeze({
    primary,
    overlays,
    mounted_primary_package_id: String(input?.mounted_primary_package_id || primary?.package_id || input?.primary_package_id || "").trim(),
    excluded_regulatory_overlay_ids: Array.isArray(input?.excluded_regulatory_overlay_ids) ? input.excluded_regulatory_overlay_ids : [],
    limitations: Array.isArray(input?.limitations) ? input.limitations : [],
    routing_limitations: Array.isArray(input?.routing_limitations) ? input.routing_limitations : []
  });
}

function containsAnyKey(value, keys) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some((item) => containsAnyKey(item, keys));
  return Object.keys(value).some((key) => keys.includes(key)) || Object.values(value).some((item) => containsAnyKey(item, keys));
}

function containsBlockedFragment(value) {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    return MATERIAL_BLOCKED_FRAGMENTS.some((fragment) => normalized.includes(fragment.toLowerCase()));
  }
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => containsBlockedFragment(item));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}
