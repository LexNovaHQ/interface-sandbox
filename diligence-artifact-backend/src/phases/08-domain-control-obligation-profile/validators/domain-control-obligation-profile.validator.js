import {
  DOMAIN_CONTROL_OBLIGATION_CONTROL_MECHANISM_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_CONTROL_POSTURE_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_DERIVATION_BASIS_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_FINAL_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MOUNTED_CAPABILITY_REF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MOUNTED_PACKAGE_REF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MOUNTED_REGULATORY_REF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_DERIVATION_MODE,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_TOP_LEVEL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_REF_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS
} from "../domain-control-obligation.constants.js";

const EXPOSURE_ROLE_VALUES = Object.freeze(["A", "B", "Both", "UNRESOLVED"]);
const MODEL_ARRAY_FIELDS = Object.freeze([
  "authority_dependency",
  "evidence_basis",
  "missing_proof",
  "limitation"
]);
const MODEL_STRING_FIELDS = Object.freeze([
  "candidate_id",
  "normalized_name",
  "what_it_requires",
  "target_specific_obligation_context",
  "exposure_role_context",
  "obligation_locus",
  "obligation_trigger_timing",
  "expected_control_signal",
  "control_mechanism_present",
  "control_posture_status",
  "diligence_question"
]);
const BASIS_OUTPUT_FIELDS = Object.freeze(
  DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS.filter((field) => field !== "derivation_basis")
);
const MODEL_FORBIDDEN_KEYS = new Set([
  ...DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS.filter((field) => field !== "candidate_id"),
  "artifact_type",
  "schema_version",
  "run_id",
  "derivation_mode",
  "mounted_taxonomy_ref",
  "obligation_count",
  "profile_level_limitations",
  "validation_summary",
  "lock_status"
]);
const COPY_KEY_MARKERS = new Set([
  "source_id",
  "source_url",
  "source_pointer",
  "source_ref",
  "route_id",
  "catalog_id",
  "registry_key_ref",
  "obligation_catalog_ref",
  "p2e_navigation_route_refs",
  "excerpt",
  "lossless_text",
  "clean_text",
  "raw_text",
  "runtime_trace"
]);
const FORBIDDEN_CONCLUSION_PATTERNS = Object.freeze([
  /\b(?:is|are|was|were|remains?)\s+(?:fully\s+)?compliant\b/i,
  /\b(?:is|are|was|were|remains?)\s+non[- ]compliant\b/i,
  /\b(?:is|are|was|were)\s+in\s+breach\b/i,
  /\b(?:obligation|duty|requirement)\s+(?:is|was)\s+(?:legally\s+)?(?:satisfied|breached|violated)\b/i,
  /\b(?:law|regulation|framework|statute)\s+definitely\s+applies\b/i,
  /\bregulator\s+has\s+jurisdiction\b/i,
  /\blicen[cs]e\s+(?:is|was)\s+(?:legally\s+)?(?:required|valid|invalid)\b/i,
  /\blegally\s+adequate\b/i,
  /\bliability\s+(?:is|was)\s+(?:established|confirmed)\b/i
]);

export const DOMAIN_CONTROL_OBLIGATION_PROFILE_VALIDATOR_STATUS = Object.freeze({
  validator: "domain-control-obligation-profile.validator",
  validator_version: "phase8_dco_profile_validator_v1",
  validates_temporary_model_payload: true,
  validates_final_compiled_profile: true,
  exact_candidate_reconciliation_required: true,
  backend_material_repair_allowed: false,
  regulatory_overlay_rows_allowed: false,
  legal_or_compliance_conclusions_allowed: false
});

export function validateDomainControlObligationModelOutput(input, {
  candidateInventory,
  resolvedTaxonomy,
  fdrRules = []
} = {}) {
  const failures = [];
  const root = requireExactModelEnvelope(input, failures);
  const rows = Array.isArray(root?.obligations) ? root.obligations : [];
  const inventory = unwrapArtifact(candidateInventory, "domain_control_obligation_candidate_inventory");
  const candidates = Array.isArray(inventory?.candidates) ? inventory.candidates : [];
  const candidateById = new Map(candidates.map((row) => [normalizeId(row.candidate_id), row]));
  const resolvedByScopedId = resolvedObligationMap(resolvedTaxonomy);
  const fdrIdsByOutputField = buildFdrIdsByOutputField(fdrRules);

  if (!candidateInventory || !isPlainObject(inventory)) failures.push("candidate inventory is required for model validation");
  if (rows.length !== candidates.length) failures.push(`model row count mismatch:${rows.length}:${candidates.length}`);

  const seenCandidateIds = new Set();
  rows.forEach((row, index) => {
    const path = `domain_control_obligation_profile.obligations[${index}]`;
    validateModelRow({
      row,
      path,
      failures,
      candidateById,
      resolvedByScopedId,
      fdrIdsByOutputField,
      seenCandidateIds
    });
  });

  for (const candidateId of candidateById.keys()) {
    if (!seenCandidateIds.has(candidateId)) failures.push(`missing model row for candidate:${candidateId}`);
  }

  if (containsKey(input, MODEL_FORBIDDEN_KEYS)) failures.push("model output contains backend-owned mechanical field");
  if (containsKey(input, COPY_KEY_MARKERS)) failures.push("model output contains source, route, registry, or runtime pointer field");
  if (containsForbiddenConclusion(input)) failures.push("model output contains forbidden legal/compliance conclusion language");

  return receipt(failures);
}

export function assertDomainControlObligationModelOutput(input, context = {}) {
  const result = validateDomainControlObligationModelOutput(input, context);
  if (result.status !== "PASS") {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_VALIDATION_FAILED:${JSON.stringify(result.failures)}`);
  }
  return result;
}

export function validateDomainControlObligationProfile(input, {
  candidateInventory,
  resolvedTaxonomy,
  modelOutput
} = {}) {
  const failures = [];
  const profile = unwrapArtifact(input, DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT);
  const inventory = unwrapArtifact(candidateInventory, "domain_control_obligation_candidate_inventory");
  const candidates = Array.isArray(inventory?.candidates) ? inventory.candidates : [];
  const candidateById = new Map(candidates.map((row) => [normalizeId(row.candidate_id), row]));
  const modelRows = modelOutputRowMap(modelOutput);

  if (!isPlainObject(profile)) return receipt(["compiled profile must be object"]);
  rejectKeyDiff(Object.keys(profile), DOMAIN_CONTROL_OBLIGATION_PROFILE_TOP_LEVEL_FIELDS, "compiled profile", failures);
  if (profile.artifact_type !== DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT) failures.push("compiled artifact_type mismatch");
  if (profile.schema_version !== DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION) failures.push("compiled schema_version mismatch");
  if (profile.derivation_mode !== DOMAIN_CONTROL_OBLIGATION_PROFILE_DERIVATION_MODE) failures.push("compiled derivation_mode mismatch");
  if (!Array.isArray(profile.obligations)) failures.push("compiled obligations must be array");
  if (!Array.isArray(profile.profile_level_limitations)) failures.push("profile_level_limitations must be array");
  validateStringArray(profile.profile_level_limitations, "profile_level_limitations", failures, { allowEmpty: true });
  validateMountedTaxonomyRef(profile.mounted_taxonomy_ref, failures);

  const rows = Array.isArray(profile.obligations) ? profile.obligations : [];
  if (profile.obligation_count !== rows.length) failures.push("obligation_count mismatch");
  if (candidateInventory && rows.length !== candidates.length) failures.push("compiled candidate coverage count mismatch");

  const seenCandidateIds = new Set();
  for (const [index, row] of rows.entries()) {
    const path = `obligations[${index}]`;
    if (!isPlainObject(row)) {
      failures.push(`${path} must be object`);
      continue;
    }
    rejectKeyDiff(Object.keys(row), DOMAIN_CONTROL_OBLIGATION_FINAL_ROW_FIELDS, path, failures);
    const candidateId = normalizeId(row.candidate_id);
    if (!candidateId) failures.push(`${path}.candidate_id missing`);
    if (seenCandidateIds.has(candidateId)) failures.push(`${path}.candidate_id duplicate:${candidateId}`);
    seenCandidateIds.add(candidateId);

    const candidate = candidateById.get(candidateId);
    if (candidateInventory && !candidate) failures.push(`${path} has no Layer 1 candidate:${candidateId}`);
    if (candidate) validateMechanicalFieldsAgainstCandidate(row, candidate, path, failures);

    const modelRow = modelRows.get(candidateId);
    if (modelOutput && !modelRow) failures.push(`${path} has no validated model row:${candidateId}`);
    if (modelRow) {
      for (const field of DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS) {
        if (!deepEqual(row[field], modelRow[field])) failures.push(`${path}.${field} was changed by backend compilation`);
      }
    }

    validateFinalMaterialFields(row, path, failures);
    validateRegulatoryOverlayRefs(row.regulatory_overlay_refs, {
      path: `${path}.regulatory_overlay_refs`,
      authorityDependency: row.authority_dependency,
      resolvedTaxonomy,
      failures
    });
  }

  if (candidateInventory) {
    for (const candidateId of candidateById.keys()) {
      if (!seenCandidateIds.has(candidateId)) failures.push(`compiled profile missing candidate:${candidateId}`);
    }
  }

  if (resolvedTaxonomy?.mounted_taxonomy_ref && !deepEqual(profile.mounted_taxonomy_ref, resolvedTaxonomy.mounted_taxonomy_ref)) {
    failures.push("mounted_taxonomy_ref mismatch with resolver");
  }
  if (containsForbiddenConclusion(profile)) failures.push("compiled profile contains forbidden legal/compliance conclusion language");
  if (containsKey(profile, new Set(["candidate_inventory", "domain_control_obligation_candidate_inventory", "validation_summary", "lock_status"]))) {
    failures.push("compiled profile contains forbidden inventory/validation/runtime branch");
  }

  return receipt(failures);
}

export function assertDomainControlObligationProfile(input, context = {}) {
  const result = validateDomainControlObligationProfile(input, context);
  if (result.status !== "PASS") {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_PROFILE_VALIDATION_FAILED:${JSON.stringify(result.failures)}`);
  }
  return result;
}

function requireExactModelEnvelope(input, failures) {
  if (!isPlainObject(input)) {
    failures.push("model response must be plain object");
    return null;
  }
  rejectKeyDiff(Object.keys(input), [DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT], "model response", failures);
  const root = input[DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT];
  if (!isPlainObject(root)) {
    failures.push("domain_control_obligation_profile must be object");
    return null;
  }
  rejectKeyDiff(Object.keys(root), ["obligations"], "model profile envelope", failures);
  if (!Array.isArray(root.obligations)) failures.push("model obligations must be array");
  return root;
}

function validateModelRow({
  row,
  path,
  failures,
  candidateById,
  resolvedByScopedId,
  fdrIdsByOutputField,
  seenCandidateIds
}) {
  if (!isPlainObject(row)) {
    failures.push(`${path} must be object`);
    return;
  }
  rejectKeyDiff(Object.keys(row), DOMAIN_CONTROL_OBLIGATION_MODEL_OUTPUT_ROW_FIELDS, path, failures);

  for (const field of MODEL_STRING_FIELDS) {
    if (!normalizeId(row[field])) failures.push(`${path}.${field} must be non-empty string`);
  }
  for (const field of MODEL_ARRAY_FIELDS) validateStringArray(row[field], `${path}.${field}`, failures, { allowEmpty: true });

  const candidateId = normalizeId(row.candidate_id);
  if (seenCandidateIds.has(candidateId)) failures.push(`${path}.candidate_id duplicate:${candidateId}`);
  seenCandidateIds.add(candidateId);
  const candidate = candidateById.get(candidateId);
  if (!candidate) failures.push(`${path}.candidate_id not in Layer 1 inventory:${candidateId}`);

  if (!EXPOSURE_ROLE_VALUES.includes(row.exposure_role_context)) failures.push(`${path}.exposure_role_context invalid`);
  if (!DOMAIN_CONTROL_OBLIGATION_CONTROL_MECHANISM_STATUSES.includes(row.control_mechanism_present)) failures.push(`${path}.control_mechanism_present invalid`);
  if (!DOMAIN_CONTROL_OBLIGATION_CONTROL_POSTURE_STATUSES.includes(row.control_posture_status)) failures.push(`${path}.control_posture_status invalid`);

  validateCrossFieldConsistency(row, path, failures);
  validateDerivationBasis(row.derivation_basis, { path: `${path}.derivation_basis`, failures, fdrIdsByOutputField });

  if (candidate) {
    const resolved = resolvedByScopedId.get(`${candidate.source_package_id}:${candidate.obligation_id}`);
    if (!resolved) failures.push(`${path} candidate obligation absent from resolved taxonomy`);
    else validateAuthorityDependency(row.authority_dependency, resolved.registry_obligation?.authority_dependency, path, failures);
  }

  if (containsKey(row, MODEL_FORBIDDEN_KEYS)) failures.push(`${path} contains backend-owned mechanical field`);
  if (containsKey(row, COPY_KEY_MARKERS)) failures.push(`${path} contains source/route pointer field`);
  if (containsForbiddenMaterialString(row)) failures.push(`${path} contains source-copy marker, URL, or forbidden conclusion`);
}

function validateFinalMaterialFields(row, path, failures) {
  for (const field of MODEL_STRING_FIELDS.filter((field) => field !== "candidate_id")) {
    if (!normalizeId(row[field])) failures.push(`${path}.${field} must be non-empty string`);
  }
  for (const field of MODEL_ARRAY_FIELDS) validateStringArray(row[field], `${path}.${field}`, failures, { allowEmpty: true });
  if (!EXPOSURE_ROLE_VALUES.includes(row.exposure_role_context)) failures.push(`${path}.exposure_role_context invalid`);
  if (!DOMAIN_CONTROL_OBLIGATION_CONTROL_MECHANISM_STATUSES.includes(row.control_mechanism_present)) failures.push(`${path}.control_mechanism_present invalid`);
  if (!DOMAIN_CONTROL_OBLIGATION_CONTROL_POSTURE_STATUSES.includes(row.control_posture_status)) failures.push(`${path}.control_posture_status invalid`);
  validateCrossFieldConsistency(row, path, failures);
  validateDerivationBasis(row.derivation_basis, { path: `${path}.derivation_basis`, failures, fdrIdsByOutputField: new Map() });
  if (!DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS.includes(row.source_layer)) failures.push(`${path}.source_layer invalid`);
  if (containsForbiddenMaterialString(pick(row, DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS))) failures.push(`${path} material fields contain source-copy marker, URL, or forbidden conclusion`);
}

function validateCrossFieldConsistency(row, path, failures) {
  const mechanism = row.control_mechanism_present;
  const posture = row.control_posture_status;
  const allowedPostures = {
    VISIBLE: new Set(["VISIBLE", "PARTIAL", "UNRESOLVED"]),
    NOT_VISIBLE: new Set(["NOT_VISIBLE", "UNRESOLVED"]),
    UNCLEAR: new Set(["PARTIAL", "UNRESOLVED"])
  };
  if (allowedPostures[mechanism] && !allowedPostures[mechanism].has(posture)) failures.push(`${path} control mechanism/posture contradiction`);
  if (row.exposure_role_context === "UNRESOLVED" && !(row.limitation || []).length) failures.push(`${path} unresolved role requires limitation`);
  if (mechanism === "NOT_VISIBLE" && !(row.missing_proof || []).length && !(row.limitation || []).length) failures.push(`${path} not-visible mechanism requires missing proof or limitation`);
  if (mechanism === "UNCLEAR" && !(row.limitation || []).length) failures.push(`${path} unclear mechanism requires limitation`);
  if (posture === "UNRESOLVED" && !(row.limitation || []).length) failures.push(`${path} unresolved posture requires limitation`);
  if (!(row.authority_dependency || []).length && !(row.limitation || []).length) failures.push(`${path} empty authority_dependency requires limitation`);
  if (!(row.evidence_basis || []).length && (!(row.missing_proof || []).length || !(row.limitation || []).length)) failures.push(`${path} empty evidence_basis requires missing_proof and limitation`);
}

function validateAuthorityDependency(actual, permitted, path, failures) {
  const allowed = new Set(uniqueStrings(permitted || []));
  for (const token of uniqueStrings(actual || [])) {
    if (!allowed.has(token)) failures.push(`${path}.authority_dependency token not permitted by mounted Registry Key:${token}`);
  }
}

function validateDerivationBasis(value, { path, failures, fdrIdsByOutputField }) {
  if (!Array.isArray(value)) {
    failures.push(`${path} must be array`);
    return;
  }
  if (value.length !== BASIS_OUTPUT_FIELDS.length) failures.push(`${path} must contain exactly ${BASIS_OUTPUT_FIELDS.length} entries`);
  const seen = new Set();
  for (const [index, entry] of value.entries()) {
    const entryPath = `${path}[${index}]`;
    if (!isPlainObject(entry)) {
      failures.push(`${entryPath} must be object`);
      continue;
    }
    rejectKeyDiff(Object.keys(entry), DOMAIN_CONTROL_OBLIGATION_DERIVATION_BASIS_FIELDS, entryPath, failures);
    for (const field of ["field_id", "output_field", "trigger_outcome_applied", "material_basis", "limitation"]) {
      if (!normalizeId(entry[field])) failures.push(`${entryPath}.${field} must be non-empty string`);
    }
    validateStringArray(entry.conditions_satisfied, `${entryPath}.conditions_satisfied`, failures, { allowEmpty: false });
    if (!BASIS_OUTPUT_FIELDS.includes(entry.output_field)) failures.push(`${entryPath}.output_field invalid:${entry.output_field}`);
    if (seen.has(entry.output_field)) failures.push(`${entryPath}.output_field duplicate:${entry.output_field}`);
    seen.add(entry.output_field);
    const allowedFdrIds = fdrIdsByOutputField.get(entry.output_field);
    if (allowedFdrIds?.size && !allowedFdrIds.has(entry.field_id)) failures.push(`${entryPath}.field_id does not match FDR rule for ${entry.output_field}`);
  }
  for (const field of BASIS_OUTPUT_FIELDS) if (!seen.has(field)) failures.push(`${path} missing basis for:${field}`);
}

function validateMechanicalFieldsAgainstCandidate(row, candidate, path, failures) {
  for (const field of DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS.filter((name) => name !== "regulatory_overlay_refs")) {
    if (!deepEqual(row[field], candidate[field])) failures.push(`${path}.${field} mismatch with Layer 1 candidate`);
  }
}

function validateMountedTaxonomyRef(value, failures) {
  if (!isPlainObject(value)) {
    failures.push("mounted_taxonomy_ref must be object");
    return;
  }
  rejectKeyDiff(Object.keys(value), DOMAIN_CONTROL_OBLIGATION_MOUNTED_PACKAGE_REF_FIELDS, "mounted_taxonomy_ref", failures);
  if (!normalizeId(value.primary_package_id)) failures.push("mounted_taxonomy_ref.primary_package_id missing");
  if (!Array.isArray(value.capability_overlays)) failures.push("mounted_taxonomy_ref.capability_overlays must be array");
  if (!Array.isArray(value.regulatory_overlays)) failures.push("mounted_taxonomy_ref.regulatory_overlays must be array");
  for (const [index, row] of (value.capability_overlays || []).entries()) validateExactObject(row, DOMAIN_CONTROL_OBLIGATION_MOUNTED_CAPABILITY_REF_FIELDS, `mounted_taxonomy_ref.capability_overlays[${index}]`, failures);
  for (const [index, row] of (value.regulatory_overlays || []).entries()) validateExactObject(row, DOMAIN_CONTROL_OBLIGATION_MOUNTED_REGULATORY_REF_FIELDS, `mounted_taxonomy_ref.regulatory_overlays[${index}]`, failures);
}

function validateRegulatoryOverlayRefs(value, { path, authorityDependency, resolvedTaxonomy, failures }) {
  if (!Array.isArray(value)) {
    failures.push(`${path} must be array`);
    return;
  }
  const expected = expectedRegulatoryOverlayRefs({ authorityDependency, resolvedTaxonomy });
  for (const [index, row] of value.entries()) {
    validateExactObject(row, DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_REF_FIELDS, `${path}[${index}]`, failures);
    validateStringArray(row?.matched_frameworks, `${path}[${index}].matched_frameworks`, failures, { allowEmpty: false });
    if (!DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_STATUSES.includes(row?.overlay_status)) failures.push(`${path}[${index}].overlay_status invalid`);
  }
  if (resolvedTaxonomy && !deepEqual(value, expected)) failures.push(`${path} does not equal deterministic mounted-overlay/framework intersection`);
}

export function expectedRegulatoryOverlayRefs({ authorityDependency = [], resolvedTaxonomy = {} } = {}) {
  const authoritySet = new Set(uniqueStrings(authorityDependency));
  return (resolvedTaxonomy?.regulatory_overlays || [])
    .filter((overlay) => overlay?.resolution_status === "RESOLVED")
    .map((overlay) => ({
      overlay_id: normalizeId(overlay.overlay_id),
      matched_frameworks: uniqueStrings(overlay.framework_links || []).filter((token) => authoritySet.has(token)).sort(),
      overlay_status: "CANDIDATE_ONLY"
    }))
    .filter((row) => row.overlay_id && row.matched_frameworks.length)
    .sort((left, right) => left.overlay_id.localeCompare(right.overlay_id));
}

function resolvedObligationMap(resolvedTaxonomy = {}) {
  return new Map((resolvedTaxonomy?.obligations || []).map((row) => [`${normalizeId(row.source_package_id)}:${normalizeId(row.obligation_id)}`, row]));
}

function modelOutputRowMap(modelOutput) {
  const root = isPlainObject(modelOutput?.[DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT])
    ? modelOutput[DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT]
    : {};
  return new Map((Array.isArray(root.obligations) ? root.obligations : []).map((row) => [normalizeId(row.candidate_id), row]));
}

function buildFdrIdsByOutputField(rules = []) {
  const map = new Map();
  for (const rule of Array.isArray(rules) ? rules : []) {
    const field = normalizeOutputField(rule?.output_field);
    if (!field || !BASIS_OUTPUT_FIELDS.includes(field) || !normalizeId(rule?.field_id)) continue;
    if (!map.has(field)) map.set(field, new Set());
    map.get(field).add(normalizeId(rule.field_id));
  }
  return map;
}

function normalizeOutputField(value) {
  return normalizeId(value)
    .replace(/\//g, " ")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .toLowerCase();
}

function containsForbiddenMaterialString(value) {
  let failed = false;
  visit(value, (item) => {
    if (failed || typeof item !== "string") return;
    if (/https?:\/\//i.test(item)) failed = true;
    if (/\b(?:source_id|source_pointer|source_ref|route_id|catalog_id|registry_key_ref|obligation_catalog_ref)\b/i.test(item)) failed = true;
    if (FORBIDDEN_CONCLUSION_PATTERNS.some((pattern) => pattern.test(item))) failed = true;
  });
  return failed;
}

function containsForbiddenConclusion(value) {
  let failed = false;
  visit(value, (item) => {
    if (!failed && typeof item === "string" && FORBIDDEN_CONCLUSION_PATTERNS.some((pattern) => pattern.test(item))) failed = true;
  });
  return failed;
}

function containsKey(value, forbidden, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => containsKey(item, forbidden, seen));
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.has(key)) return true;
    if (containsKey(child, forbidden, seen)) return true;
  }
  return false;
}

function visit(value, fn, seen = new Set()) {
  fn(value);
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item) => visit(item, fn, seen));
  else Object.values(value).forEach((item) => visit(item, fn, seen));
}

function validateStringArray(value, path, failures, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    failures.push(`${path} must be array`);
    return;
  }
  if (!allowEmpty && value.length === 0) failures.push(`${path} must not be empty`);
  const seen = new Set();
  for (const [index, item] of value.entries()) {
    const normalized = normalizeId(item);
    if (!normalized) failures.push(`${path}[${index}] must be non-empty string`);
    if (seen.has(normalized)) failures.push(`${path}[${index}] duplicate:${normalized}`);
    seen.add(normalized);
  }
}

function validateExactObject(value, fields, path, failures) {
  if (!isPlainObject(value)) {
    failures.push(`${path} must be object`);
    return;
  }
  rejectKeyDiff(Object.keys(value), fields, path, failures);
}

function rejectKeyDiff(actualKeys, expectedKeys, path, failures) {
  const actual = [...actualKeys].sort();
  const expected = [...expectedKeys].sort();
  if (!deepEqual(actual, expected)) failures.push(`${path} field set mismatch:actual=${actual.join(",")}:expected=${expected.join(",")}`);
}

function unwrapArtifact(value = {}, artifactName) {
  if (isPlainObject(value?.[artifactName])) return value[artifactName];
  if (value?.artifact_type === artifactName) return value;
  return value || {};
}

function pick(value = {}, fields = []) {
  return Object.fromEntries(fields.map((field) => [field, value[field]]));
}

function uniqueStrings(value) {
  const values = value == null ? [] : (Array.isArray(value) ? value : [value]);
  return [...new Set(values.flat(Infinity).map(normalizeId).filter(Boolean))];
}

function normalizeId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
}

function receipt(failures) {
  return Object.freeze({
    status: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze([...failures])
  });
}
