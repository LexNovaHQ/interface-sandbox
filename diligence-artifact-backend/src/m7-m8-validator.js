const REQUIRED_TOP_LEVEL_KEYS = Object.freeze([
  "target_profile",
  "target_profile_forensics",
  "target_feature_profile",
  "target_feature_profile_forensics"
]);

const MODEL_LOCK_STATUSES = Object.freeze([
  "LOCKED",
  "LOCKED_WITH_LIMITATIONS",
  "REPAIR_REQUIRED",
  "CONTROLLED_FAILURE"
]);

const ALLOWED_ARCHETYPE_CODES = Object.freeze([
  "UNI",
  "DOE",
  "JDG",
  "CMP",
  "CRT",
  "RDR",
  "ORC",
  "TRN",
  "SHD",
  "OPT",
  "MOV"
]);

const ALLOWED_SURFACE_TOKENS = Object.freeze([
  "Consumer-Public",
  "Enterprise-Private",
  "PII",
  "Employment",
  "Sensitive/Biometric",
  "Financial",
  "Content&IP",
  "Safety&Physical",
  "Infrastructure",
  "Minors"
]);

const REQUIRED_ACTIVITY_FIELDS = Object.freeze([
  "activity_reference",
  "product_service_wrapper",
  "activity_feature_name",
  "activity_candidate_summary",
  "primary_source_refs",
  "primary_source_urls",
  "mechanics_proof",
  "autonomy_human_control_signal",
  "data_content_object_touched",
  "external_internal_action_signal",
  "archetype_codes",
  "archetype_proof",
  "surface_context_tokens",
  "surface_proof_and_routing_limits"
]);

const REQUIRED_FEATURE_FORENSIC_BRANCHES = Object.freeze([
  "validation_status",
  "product_activity_source_route_coverage_ledger",
  "product_activity_extraction_capsule_summary",
  "candidate_admission_and_omission_ledger",
  "selected_pa_field_derivation_ledger",
  "activity_mechanics_derivation_ledger",
  "archetype_derivation_ledger",
  "surface_token_derivation_ledger",
  "targeted_re_extraction_ledger",
  "activity_limitations_ledger",
  "cross_route_use_ledger",
  "validation_quality_control_result",
  "runtime_trace_m8_only",
  "forensic_boundary"
]);

const REQUIRED_CLASSIFICATION_ROW_FIELDS = Object.freeze([
  "activity_reference",
  "classification_type",
  "code",
  "conditions",
  "trigger_if",
  "trigger_result",
  "trigger_with_limitation_if",
  "exclude_if",
  "exclusion_result",
  "forbidden_inference_check",
  "confidence",
  "limitation_if_any"
]);

const REQUIRED_CONDITION_FIELDS = Object.freeze([
  "condition_id",
  "condition_text",
  "result",
  "source_ref",
  "source_url",
  "evidence_summary"
]);

const ALLOWED_CONDITION_RESULTS = Object.freeze(["TRUE", "FALSE", "NOT_EVIDENCED"]);
const ALLOWED_TRIGGER_RESULTS = Object.freeze(["TRIGGERED", "TRIGGERED_WITH_LIMITATION", "NOT_TRIGGERED", "NOT_EVIDENCED", "EXCLUDED"]);
const TRIGGERED_RESULTS = Object.freeze(["TRIGGERED", "TRIGGERED_WITH_LIMITATION"]);
const ALLOWED_EXCLUSION_RESULTS = Object.freeze(["EXCLUDED", "NOT_EXCLUDED"]);
const ALLOWED_FORBIDDEN_INFERENCE_RESULTS = Object.freeze(["PASS", "FAIL"]);
const ALLOWED_CONFIDENCE = Object.freeze(["HIGH", "MEDIUM", "LOW"]);

const FORBIDDEN_KEYS = Object.freeze([
  "source_discovery_handoff",
  "legal_cartography_index",
  "data_provenance_profile",
  "exposure_registry_profile",
  "challenge_gate",
  "final_output_handoff",
  "renderer_payload",
  "screen_report_payload",
  "target_data_provenance_profile",
  "target_exposure_profile",
  "bucket_handoff",
  "discovered_route_inventory",
  "route_execution_ledger",
  "source_coverage_gates",
  "missing_limited_primary_sources"
]);

const FORBIDDEN_STRING_VALUES = Object.freeze([
  "<phase_output",
  "</phase_output>",
  "agent_2_target_feature",
  "agent_1_source_legal",
  "M6_M9",
  "bucket_handoff",
  "discovered_route_inventory",
  "route_execution_ledger",
  "source_coverage_gates",
  "missing_limited_primary_sources",
  "target_data_provenance_profile",
  "target_exposure_profile"
]);

const PLACEHOLDER_PATH_PATTERNS = Object.freeze([
  /target_profile\.tp_id_\d+/i,
  /target_feature_profile\.tf_id_\d+/i,
  /target_profile\.field_\d+/i,
  /target_feature_profile\.field_\d+/i
]);

const SOURCE_ID_PATTERN = /\b(?:T[0-4]|P[1-5]|D[1-5]|L[1-6])_[A-Z0-9_]+\.SRC\.\d{3}\b/g;
const SOURCE_ID_EXACT_PATTERN = /^(?:T[0-4]|P[1-5]|D[1-5]|L[1-6])_[A-Z0-9_]+\.SRC\.\d{3}$/;
const URL_PATTERN = /https?:\/\/[^\s,"'<>\])}]+/g;

const URL_FIELDS = Object.freeze([
  "url",
  "source_url",
  "sourceUrl",
  "canonical_url",
  "canonicalUrl",
  "final_url",
  "finalUrl",
  "href",
  "source"
]);

const SOURCE_ID_FIELDS = Object.freeze([
  "source_id",
  "sourceId",
  "source_ref",
  "sourceRef",
  "source_artifact",
  "sourceArtifact",
  "id"
]);

export function validateM7M8TargetFeatureOutput(output, context = {}) {
  const failures = [];

  if (!output || typeof output !== "object" || Array.isArray(output)) {
    return fail(["missing output object"]);
  }

  const keys = Object.keys(output);
  const missing = REQUIRED_TOP_LEVEL_KEYS.filter((key) => !(key in output));
  const extra = keys.filter((key) => !REQUIRED_TOP_LEVEL_KEYS.includes(key));

  if (missing.length) failures.push(`missing top-level keys: ${missing.join(",")}`);
  if (extra.length) failures.push(`extra top-level keys: ${extra.join(",")}`);

  for (const key of REQUIRED_TOP_LEVEL_KEYS) {
    if (!isPlainObject(output[key])) failures.push(`${key} must be an object`);
  }

  for (const forbidden of FORBIDDEN_KEYS) {
    if (containsKey(output, forbidden)) failures.push(`forbidden key present: ${forbidden}`);
  }

  for (const forbidden of FORBIDDEN_STRING_VALUES) {
    if (containsStringValue(output, forbidden)) failures.push(`forbidden stale reference present: ${forbidden}`);
  }

  for (const pattern of PLACEHOLDER_PATH_PATTERNS) {
    if (containsStringPattern(output, pattern)) failures.push(`placeholder path present: ${pattern.source}`);
  }

  validateArtifactLockStatus(output.target_profile, failures, "target_profile");
  validateArtifactLockStatus(output.target_feature_profile, failures, "target_feature_profile");
  validateFeatureArchetypeSignal(output.target_feature_profile, failures);
  validateForensicObjects(output, failures);
  validateActivityRows(output, failures);
  validateClassificationLedgers(output, failures);
  validateSourceCustody(output, context.artifacts || {}, failures);

  return failures.length ? fail(failures) : { status: "PASS", failed_gates: [], repair_instructions: [] };
}

export function resolveM7M8LockStatus(output) {
  const statuses = [
    readArtifactStatus(output?.target_profile),
    readArtifactStatus(output?.target_feature_profile),
    readArtifactStatus(output?.target_profile_forensics),
    readArtifactStatus(output?.target_feature_profile_forensics)
  ].filter(Boolean);

  if (statuses.includes("CONTROLLED_FAILURE")) return "CONTROLLED_FAILURE";
  if (statuses.includes("REPAIR_REQUIRED")) return "REPAIR_REQUIRED";
  if (statuses.includes("LOCKED_WITH_LIMITATIONS")) return "LOCKED_WITH_LIMITATIONS";
  if (statuses.includes("LOCKED")) return "LOCKED";
  return "REPAIR_REQUIRED";
}

function validateArtifactLockStatus(artifact, failures, name) {
  const status = readArtifactStatus(artifact);
  if (!status) {
    failures.push(`${name} missing lock_status or validation_status`);
    return;
  }
  if (!MODEL_LOCK_STATUSES.includes(status)) failures.push(`${name} invalid lock status: ${status}`);
}

function readArtifactStatus(artifact) {
  if (!isPlainObject(artifact)) return "";
  return artifact.lock_status || artifact.validation_status || artifact.status || "";
}

function validateFeatureArchetypeSignal(targetFeatureProfile, failures) {
  if (!isPlainObject(targetFeatureProfile)) return;
  if (!containsKeyMatching(targetFeatureProfile, /archetype/i) && !containsStringPattern(targetFeatureProfile, /\b(UNI|DOE|JDG|CMP|CRT|RDR|ORC|TRN|SHD|OPT|MOV)\b/)) {
    failures.push("target_feature_profile missing archetype derivation signal");
  }
}

function validateForensicObjects(output, failures) {
  const targetForensics = output.target_profile_forensics;
  const featureForensics = output.target_feature_profile_forensics;
  if (!isPlainObject(targetForensics)) return;
  if (!isPlainObject(featureForensics)) return;

  if (!hasForensicSignal(targetForensics)) failures.push("target_profile_forensics missing forensic/provenance signal");
  if (!hasForensicSignal(featureForensics)) failures.push("target_feature_profile_forensics missing forensic/provenance signal");

  const missingBranches = REQUIRED_FEATURE_FORENSIC_BRANCHES.filter((field) => !(field in featureForensics));
  if (missingBranches.length) failures.push(`target_feature_profile_forensics missing branches: ${missingBranches.join(",")}`);
}

function validateActivityRows(output, failures) {
  const profile = output.target_feature_profile;
  if (!isPlainObject(profile)) return;

  if (!Array.isArray(profile.activities)) {
    failures.push("target_feature_profile.activities must be an array");
    return;
  }

  if (readArtifactStatus(profile) !== "CONTROLLED_FAILURE" && profile.activities.length === 0) {
    failures.push("target_feature_profile.activities must not be empty unless CONTROLLED_FAILURE");
  }

  const seenReferences = new Set();

  profile.activities.forEach((activity, index) => {
    const path = `target_feature_profile.activities[${index}]`;
    if (!isPlainObject(activity)) {
      failures.push(`${path} must be an object`);
      return;
    }

    const missingFields = REQUIRED_ACTIVITY_FIELDS.filter((field) => !(field in activity));
    if (missingFields.length) failures.push(`${path} missing required fields: ${missingFields.join(",")}`);

    if (!nonEmptyString(activity.activity_reference)) {
      failures.push(`${path}.activity_reference must be a non-empty string`);
    } else if (seenReferences.has(activity.activity_reference)) {
      failures.push(`${path}.activity_reference duplicate: ${activity.activity_reference}`);
    } else {
      seenReferences.add(activity.activity_reference);
    }

    validatePrimarySources(activity, path, failures);
    validateCodeArray(activity.archetype_codes, ALLOWED_ARCHETYPE_CODES, `${path}.archetype_codes`, failures, { requireNonEmpty: true });
    validateCodeArray(activity.surface_context_tokens, ALLOWED_SURFACE_TOKENS, `${path}.surface_context_tokens`, failures, { requireNonEmpty: true });

    if (Array.isArray(activity.archetype_codes) && activity.archetype_codes.includes("UNI") && activity.archetype_codes.length > 1) {
      failures.push(`${path}.archetype_codes cannot include UNI alongside narrower archetypes`);
    }
  });
}

function validatePrimarySources(activity, path, failures) {
  if (!Array.isArray(activity.primary_source_refs) || !activity.primary_source_refs.length) {
    failures.push(`${path}.primary_source_refs must be a non-empty array`);
    return;
  }
  if (!isPlainObject(activity.primary_source_urls)) {
    failures.push(`${path}.primary_source_urls must be an object keyed by source ID`);
    return;
  }

  for (const sourceId of activity.primary_source_refs) {
    if (!SOURCE_ID_EXACT_PATTERN.test(sourceId || "")) {
      failures.push(`${path}.primary_source_refs contains invalid source ID: ${sourceId}`);
      continue;
    }
    const sourceUrl = activity.primary_source_urls[sourceId];
    if (!nonEmptyString(sourceUrl) || !extractUrlsFromValue(sourceUrl).length) {
      failures.push(`${path}.primary_source_urls missing valid URL for ${sourceId}`);
    }
  }
}

function validateCodeArray(values, allowed, path, failures, { requireNonEmpty = false } = {}) {
  if (!Array.isArray(values)) {
    failures.push(`${path} must be an array`);
    return;
  }
  if (requireNonEmpty && !values.length) failures.push(`${path} must not be empty`);

  const seen = new Set();
  values.forEach((value) => {
    if (!allowed.includes(value)) failures.push(`${path} contains non-locked code/token: ${value}`);
    if (seen.has(value)) failures.push(`${path} contains duplicate code/token: ${value}`);
    seen.add(value);
  });
}

function validateClassificationLedgers(output, failures) {
  const profile = output.target_feature_profile;
  const forensics = output.target_feature_profile_forensics;
  if (!isPlainObject(profile) || !isPlainObject(forensics) || !Array.isArray(profile.activities)) return;

  const archetypeRows = Array.isArray(forensics.archetype_derivation_ledger) ? forensics.archetype_derivation_ledger : [];
  const surfaceRows = Array.isArray(forensics.surface_token_derivation_ledger) ? forensics.surface_token_derivation_ledger : [];

  if (!Array.isArray(forensics.archetype_derivation_ledger)) failures.push("target_feature_profile_forensics.archetype_derivation_ledger must be an array");
  if (!Array.isArray(forensics.surface_token_derivation_ledger)) failures.push("target_feature_profile_forensics.surface_token_derivation_ledger must be an array");

  const activityRefs = new Set(profile.activities.map((activity) => activity?.activity_reference).filter(Boolean));
  const emittedArchetypes = new Map();
  const emittedSurfaces = new Map();

  for (const activity of profile.activities) {
    if (!isPlainObject(activity) || !activity.activity_reference) continue;
    for (const code of arrayOrEmpty(activity.archetype_codes)) emittedArchetypes.set(classificationKey(activity.activity_reference, "ARCHETYPE", code), activity);
    for (const token of arrayOrEmpty(activity.surface_context_tokens)) emittedSurfaces.set(classificationKey(activity.activity_reference, "SURFACE", token), activity);
  }

  const triggeredArchetypeRows = new Set();
  const triggeredSurfaceRows = new Set();

  archetypeRows.forEach((row, index) => {
    const path = `target_feature_profile_forensics.archetype_derivation_ledger[${index}]`;
    validateClassificationRow(row, path, "ARCHETYPE", ALLOWED_ARCHETYPE_CODES, activityRefs, failures);
    if (TRIGGERED_RESULTS.includes(row?.trigger_result)) triggeredArchetypeRows.add(classificationKey(row.activity_reference, "ARCHETYPE", row.code));
  });

  surfaceRows.forEach((row, index) => {
    const path = `target_feature_profile_forensics.surface_token_derivation_ledger[${index}]`;
    validateClassificationRow(row, path, "SURFACE", ALLOWED_SURFACE_TOKENS, activityRefs, failures);
    if (TRIGGERED_RESULTS.includes(row?.trigger_result)) triggeredSurfaceRows.add(classificationKey(row.activity_reference, "SURFACE", row.code));
  });

  for (const key of emittedArchetypes.keys()) {
    if (!triggeredArchetypeRows.has(key)) failures.push(`emitted archetype missing TRIGGERED ledger row: ${key}`);
  }
  for (const key of emittedSurfaces.keys()) {
    if (!triggeredSurfaceRows.has(key)) failures.push(`emitted surface token missing TRIGGERED ledger row: ${key}`);
  }
  for (const key of triggeredArchetypeRows) {
    if (!emittedArchetypes.has(key)) failures.push(`TRIGGERED archetype ledger row not emitted in activity: ${key}`);
  }
  for (const key of triggeredSurfaceRows) {
    if (!emittedSurfaces.has(key)) failures.push(`TRIGGERED surface ledger row not emitted in activity: ${key}`);
  }
}

function validateClassificationRow(row, path, expectedType, allowedCodes, activityRefs, failures) {
  if (!isPlainObject(row)) {
    failures.push(`${path} must be an object`);
    return;
  }

  const missing = REQUIRED_CLASSIFICATION_ROW_FIELDS.filter((field) => !(field in row));
  if (missing.length) failures.push(`${path} missing required fields: ${missing.join(",")}`);

  if (!activityRefs.has(row.activity_reference)) failures.push(`${path}.activity_reference does not match an emitted activity: ${row.activity_reference}`);
  if (row.classification_type !== expectedType) failures.push(`${path}.classification_type must be ${expectedType}`);
  if (!allowedCodes.includes(row.code)) failures.push(`${path}.code not in locked ${expectedType} matrix: ${row.code}`);
  if (!ALLOWED_TRIGGER_RESULTS.includes(row.trigger_result)) failures.push(`${path}.trigger_result invalid: ${row.trigger_result}`);
  if (!ALLOWED_EXCLUSION_RESULTS.includes(row.exclusion_result)) failures.push(`${path}.exclusion_result invalid: ${row.exclusion_result}`);
  if (!ALLOWED_FORBIDDEN_INFERENCE_RESULTS.includes(row.forbidden_inference_check)) failures.push(`${path}.forbidden_inference_check invalid: ${row.forbidden_inference_check}`);
  if (!ALLOWED_CONFIDENCE.includes(row.confidence)) failures.push(`${path}.confidence invalid: ${row.confidence}`);

  if (!Array.isArray(row.conditions) || !row.conditions.length) {
    failures.push(`${path}.conditions must be a non-empty array`);
  } else {
    row.conditions.forEach((condition, index) => validateConditionRow(condition, `${path}.conditions[${index}]`, row, failures));
  }

  if (TRIGGERED_RESULTS.includes(row.trigger_result)) {
    if (row.exclusion_result !== "NOT_EXCLUDED") failures.push(`${path} is triggered but exclusion_result is not NOT_EXCLUDED`);
    if (row.forbidden_inference_check !== "PASS") failures.push(`${path} is triggered but forbidden_inference_check is not PASS`);
    if (!arrayOrEmpty(row.conditions).some((condition) => condition?.result === "TRUE")) failures.push(`${path} is triggered but has no TRUE condition`);
  }
}

function validateConditionRow(condition, path, parentRow, failures) {
  if (!isPlainObject(condition)) {
    failures.push(`${path} must be an object`);
    return;
  }

  const missing = REQUIRED_CONDITION_FIELDS.filter((field) => !(field in condition));
  if (missing.length) failures.push(`${path} missing required fields: ${missing.join(",")}`);

  if (!ALLOWED_CONDITION_RESULTS.includes(condition.result)) failures.push(`${path}.result invalid: ${condition.result}`);
  if (!nonEmptyString(condition.condition_id) || !condition.condition_id.includes(".C")) failures.push(`${path}.condition_id must be a matrix condition ID`);
  if (!nonEmptyString(condition.condition_text)) failures.push(`${path}.condition_text must be non-empty`);
  if (!nonEmptyString(condition.evidence_summary)) failures.push(`${path}.evidence_summary must be non-empty`);

  if (condition.result === "TRUE") {
    const sourceIds = extractSourceIds(condition.source_ref);
    const urls = extractUrlsFromValue(condition.source_url);
    if (!sourceIds.length) failures.push(`${path} TRUE condition missing source_ref with source ID`);
    if (!urls.length) failures.push(`${path} TRUE condition missing valid source_url`);
  }

  if (parentRow?.classification_type === "ARCHETYPE" && parentRow?.code && !String(condition.condition_id || "").startsWith(`${parentRow.code}.C`)) {
    failures.push(`${path}.condition_id does not match archetype code ${parentRow.code}`);
  }
  if (parentRow?.classification_type === "SURFACE" && parentRow?.code && !String(condition.condition_id || "").startsWith("SURF.")) {
    failures.push(`${path}.condition_id must start with SURF. for surface derivation`);
  }
}

function validateSourceCustody(output, artifacts, failures) {
  const sourceIndex = buildSourceIndex(artifacts);
  const emittedRefs = collectSourceReferenceObjects(output);

  if (!emittedRefs.length) return;

  if (!sourceIndex.size) {
    failures.push("source-aware validation could not build upstream source index from M7_M8 artifacts");
    return;
  }

  for (const ref of emittedRefs) {
    const sourceIds = unique(extractSourceIds(ref.value));
    if (!sourceIds.length) continue;

    const providedUrls = extractUrlsFromValue(ref.value);
    if (!providedUrls.length) {
      failures.push(`source reference missing source_url/source_urls at ${ref.path}: ${sourceIds.join(",")}`);
      continue;
    }

    for (const sourceId of sourceIds) {
      const upstream = sourceIndex.get(sourceId);
      if (!upstream) {
        failures.push(`unknown source_id not present in loaded upstream artifacts at ${ref.path}: ${sourceId}`);
        continue;
      }

      if (!upstream.urls.length) {
        failures.push(`upstream source_id has no URL available for validation: ${sourceId}`);
        continue;
      }

      const matched = providedUrls.some((url) => upstream.urls.some((known) => normalizeUrl(url) === normalizeUrl(known)));
      if (!matched) {
        failures.push(`source_id/source_url mismatch at ${ref.path}: ${sourceId} expected one of ${upstream.urls.join(" | ")} but got ${providedUrls.join(" | ")}`);
      }
    }
  }
}

function buildSourceIndex(artifacts) {
  const index = new Map();

  walk(artifacts, (value, path) => {
    if (!isPlainObject(value)) return;

    const ids = unique(SOURCE_ID_FIELDS.flatMap((field) => extractSourceIds(value[field])));
    if (!ids.length) return;

    const urls = unique(URL_FIELDS.flatMap((field) => extractUrlsFromValue(value[field])));
    const title = firstString(value.title, value.page_title, value.source_title, value.document_title, value.name);

    for (const id of ids) {
      const existing = index.get(id) || { urls: [], titles: [], paths: [] };
      existing.urls = unique([...existing.urls, ...urls]);
      if (title) existing.titles = unique([...existing.titles, title]);
      existing.paths = unique([...existing.paths, path]);
      index.set(id, existing);
    }
  });

  return index;
}

function collectSourceReferenceObjects(output) {
  const refs = [];

  walk(output, (value, path) => {
    if (!isPlainObject(value)) return;
    const serialized = JSON.stringify(value);
    const sourceIds = extractSourceIds(serialized);
    if (!sourceIds.length) return;

    const hasStructuredSourceField = Object.keys(value).some((key) => /source(_|-)?(id|ref|artifact|url|urls)/i.test(key));
    const hasFreeTextSourceId = Object.values(value).some((item) => typeof item === "string" && extractSourceIds(item).length);

    if (hasStructuredSourceField || hasFreeTextSourceId) refs.push({ path, value });
  });

  return refs;
}

function extractSourceIds(value) {
  if (typeof value === "string") return value.match(SOURCE_ID_PATTERN) || [];
  if (Array.isArray(value)) return value.flatMap((item) => extractSourceIds(item));
  if (value && typeof value === "object") return Object.values(value).flatMap((item) => extractSourceIds(item));
  return [];
}

function extractUrlsFromValue(value) {
  if (typeof value === "string") return value.match(URL_PATTERN) || [];
  if (Array.isArray(value)) return value.flatMap((item) => extractUrlsFromValue(item));
  if (value && typeof value === "object") return Object.values(value).flatMap((item) => extractUrlsFromValue(item));
  return [];
}

function normalizeUrl(value) {
  return String(value || "")
    .trim()
    .replace(/[?#].*$/, "")
    .replace(/\/+$/, "")
    .toLowerCase();
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function firstString(...values) {
  return values.find((value) => typeof value === "string" && value.trim()) || "";
}

function hasForensicSignal(value) {
  return containsKeyMatching(value, /(source|evidence|forensic|derivation|provenance|ledger|confidence)/i);
}

function fail(failures) {
  return {
    status: "REPAIR_REQUIRED",
    failed_gates: failures,
    repair_instructions: [
      "Return exactly target_profile, target_profile_forensics, target_feature_profile, and target_feature_profile_forensics.",
      "Every activity row must contain the locked activity fields, including primary_source_refs and primary_source_urls.",
      "Use only archetype codes and surface tokens locked in CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml.",
      "Every emitted archetype/surface token must have a matching classification derivation ledger row with conditions, trigger_if, trigger_result, exclude_if, exclusion_result, forbidden_inference_check, confidence, and limitation_if_any.",
      "Every emitted source_id/source_ref/source_artifact containing a *.SRC.NNN value must include a matching source_url/source_urls copied from the loaded upstream artifact. Do not relabel, reorder, or remap source IDs."
    ]
  };
}

function classificationKey(activityReference, classificationType, code) {
  return `${activityReference}::${classificationType}::${code}`;
}

function arrayOrEmpty(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function isPlainObject(value) {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function walk(value, visitor, path = "$") {
  visitor(value, path);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, visitor, `${path}[${index}]`));
    return;
  }
  for (const [key, item] of Object.entries(value)) {
    walk(item, visitor, `${path}.${key}`);
  }
}

function containsKey(value, key) {
  if (!value || typeof value !== "object") return false;
  if (Object.prototype.hasOwnProperty.call(value, key)) return true;
  return Object.values(value).some((item) => containsKey(item, key));
}

function containsKeyMatching(value, pattern) {
  if (!value || typeof value !== "object") return false;
  return Object.keys(value).some((key) => pattern.test(key)) || Object.values(value).some((item) => containsKeyMatching(item, pattern));
}

function containsStringValue(value, needle) {
  if (typeof value === "string") return value.includes(needle);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => containsStringValue(item, needle));
}

function containsStringPattern(value, pattern) {
  if (typeof value === "string") return pattern.test(value);
  if (!value || typeof value !== "object") return false;
  return Object.values(value).some((item) => containsStringPattern(item, pattern));
}
