import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_SCHEMA_VERSION,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_TOP_LEVEL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS,
  DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS
} from "../domain-control-obligation.constants.js";

const NAVIGATION_INDEX_ARTIFACT = "domain_control_obligation_navigation_index";
const ROUTE_REF_FIELDS = Object.freeze([
  "route_ref_id",
  "domain_id",
  "obligation_family",
  "required_control_source_route_ids",
  "selective_legal_route_ids",
  "locator_families",
  "legal_doc_types",
  "shell_field_targets",
  "reading_priority"
]);
const REGISTRY_KEY_REF_FIELDS = Object.freeze(["key_file", "package_id", "key_version", "obligation_path"]);
const CATALOG_REF_FIELDS = Object.freeze(["catalog_file", "domain_id", "obligation_family"]);
const FORBIDDEN_COPY_KEYS = new Set([
  "excerpt", "lossless_text", "clean_text", "text", "body", "content", "markdown", "html",
  "registry_obligation", "catalog_family", "public_evidence_signal", "trigger_condition"
]);

export function validateDomainControlObligationCandidateInventory(input, {
  resolvedTaxonomy,
  navigationIndex,
  targetFeatureProfile
} = {}) {
  const inventory = unwrapArtifact(input, DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT);
  const failures = [];

  if (!isPlainObject(inventory)) {
    return receipt(["candidate inventory must be object"]);
  }

  rejectKeyDiff(Object.keys(inventory), DOMAIN_CONTROL_OBLIGATION_CANDIDATE_TOP_LEVEL_FIELDS, "inventory", failures);
  if (inventory.artifact_type !== DOMAIN_CONTROL_OBLIGATION_CANDIDATE_ARTIFACT) failures.push("artifact_type mismatch");
  if (inventory.schema_version !== DOMAIN_CONTROL_OBLIGATION_CANDIDATE_SCHEMA_VERSION) failures.push("schema_version mismatch");
  if (inventory.derivation_mode !== DOMAIN_CONTROL_OBLIGATION_CANDIDATE_DERIVATION_MODE) failures.push("derivation_mode mismatch");
  if (inventory.source_navigation_index !== NAVIGATION_INDEX_ARTIFACT) failures.push("source_navigation_index mismatch");
  if (!Array.isArray(inventory.candidates)) failures.push("candidates must be array");
  if (!Array.isArray(inventory.inventory_limitations)) failures.push("inventory_limitations must be array");
  if (!isPlainObject(inventory.mounted_package_refs)) failures.push("mounted_package_refs must be object");
  validateStringArray(inventory.inventory_limitations, "inventory_limitations", failures, { allowEmpty: true });

  const candidates = Array.isArray(inventory.candidates) ? inventory.candidates : [];
  if (inventory.candidate_count !== candidates.length) failures.push("candidate_count mismatch");
  if (!candidates.length && !(inventory.inventory_limitations || []).includes("NO_DOMAIN_CONTROL_OBLIGATION_CANDIDATES_MATCHED")) {
    failures.push("empty candidate inventory requires NO_DOMAIN_CONTROL_OBLIGATION_CANDIDATES_MATCHED limitation");
  }

  const candidateIds = new Set();
  const scopedObligations = new Set();
  candidates.forEach((candidate, index) => validateCandidate(candidate, index, failures, candidateIds, scopedObligations));

  if (containsKey(inventory, new Set([...DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS, "regulatory_overlay_refs"]))) {
    failures.push("candidate inventory contains Layer 2 material/regulatory-overlay fields");
  }
  if (containsKey(inventory, FORBIDDEN_COPY_KEYS)) failures.push("candidate inventory contains source/evidence copy fields");

  if (resolvedTaxonomy) validateAgainstResolvedTaxonomy(inventory, resolvedTaxonomy, failures);
  if (navigationIndex) validateAgainstNavigationIndex(inventory, navigationIndex, failures);
  if (targetFeatureProfile && resolvedTaxonomy && navigationIndex) {
    validateExactDeterministicCandidateUniverse(inventory, { resolvedTaxonomy, navigationIndex, targetFeatureProfile }, failures);
  }

  return receipt(failures);
}

export function assertDomainControlObligationCandidateInventory(input, context = {}) {
  const result = validateDomainControlObligationCandidateInventory(input, context);
  if (result.status !== "PASS") {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_VALIDATION_FAILED:${JSON.stringify(result.failures)}`);
  }
  return result;
}

function validateCandidate(candidate, index, failures, candidateIds, scopedObligations) {
  const path = `candidates[${index}]`;
  if (!isPlainObject(candidate)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(candidate), DOMAIN_CONTROL_OBLIGATION_CANDIDATE_FIELDS, path, failures);

  for (const field of [
    "candidate_id", "obligation_id", "obligation_family", "source_layer", "source_package_id",
    "catalog_package_id", "candidate_status"
  ]) {
    if (!normalizeId(candidate[field])) failures.push(`${path}.${field} must be non-empty string`);
  }

  if (!/^DCO-CAND-\d{3,}$/.test(normalizeId(candidate.candidate_id))) failures.push(`${path}.candidate_id format invalid`);
  if (candidateIds.has(candidate.candidate_id)) failures.push(`${path}.candidate_id duplicate:${candidate.candidate_id}`);
  candidateIds.add(candidate.candidate_id);

  const scopedKey = `${normalizeId(candidate.source_package_id)}:${normalizeId(candidate.obligation_id)}`;
  if (scopedObligations.has(scopedKey)) failures.push(`${path} duplicate package-scoped obligation:${scopedKey}`);
  scopedObligations.add(scopedKey);

  if (!DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS.includes(candidate.source_layer)) failures.push(`${path}.source_layer not allowed:${candidate.source_layer}`);
  if (DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS.includes(candidate.source_layer)) failures.push(`${path}.source_layer regulatory overlay forbidden`);
  if (candidate.source_layer === "PRIMARY" && normalizeId(candidate.capability_overlay_id)) failures.push(`${path}.capability_overlay_id must be empty for PRIMARY`);
  if (candidate.source_layer === "CAPABILITY_OVERLAY" && !normalizeId(candidate.capability_overlay_id)) failures.push(`${path}.capability_overlay_id required for CAPABILITY_OVERLAY`);

  validateStringArray(candidate.linked_activity_references, `${path}.linked_activity_references`, failures);
  validateStringArray(candidate.matched_behavior_codes, `${path}.matched_behavior_codes`, failures);
  validateStringArray(candidate.matched_surface_tokens, `${path}.matched_surface_tokens`, failures);
  validateStringArray(candidate.candidate_limitation, `${path}.candidate_limitation`, failures, { allowEmpty: true });

  const expectedStatus = candidate.candidate_limitation?.length
    ? DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES[1]
    : DOMAIN_CONTROL_OBLIGATION_CANDIDATE_STATUSES[0];
  if (candidate.candidate_status !== expectedStatus) failures.push(`${path}.candidate_status inconsistent with candidate_limitation`);

  validateExactObject(candidate.registry_key_ref, REGISTRY_KEY_REF_FIELDS, `${path}.registry_key_ref`, failures);
  validateExactObject(candidate.obligation_catalog_ref, CATALOG_REF_FIELDS, `${path}.obligation_catalog_ref`, failures);
  if (candidate.registry_key_ref?.package_id !== candidate.source_package_id) failures.push(`${path}.registry_key_ref.package_id mismatch`);
  if (candidate.obligation_catalog_ref?.domain_id !== candidate.catalog_package_id) failures.push(`${path}.obligation_catalog_ref.domain_id mismatch`);
  if (candidate.obligation_catalog_ref?.obligation_family !== candidate.obligation_family) failures.push(`${path}.obligation_catalog_ref.obligation_family mismatch`);

  if (!Array.isArray(candidate.p2e_navigation_route_refs) || candidate.p2e_navigation_route_refs.length !== 1) {
    failures.push(`${path}.p2e_navigation_route_refs must contain exactly one route ref`);
  } else {
    validateRouteRef(candidate.p2e_navigation_route_refs[0], `${path}.p2e_navigation_route_refs[0]`, candidate, failures);
  }
}

function validateRouteRef(ref, path, candidate, failures) {
  validateExactObject(ref, ROUTE_REF_FIELDS, path, failures);
  if (ref.route_ref_id !== `${candidate.catalog_package_id}:${candidate.obligation_family}`) failures.push(`${path}.route_ref_id mismatch`);
  if (ref.domain_id !== candidate.catalog_package_id) failures.push(`${path}.domain_id mismatch`);
  if (ref.obligation_family !== candidate.obligation_family) failures.push(`${path}.obligation_family mismatch`);
  for (const field of [
    "required_control_source_route_ids", "selective_legal_route_ids", "locator_families",
    "legal_doc_types", "shell_field_targets"
  ]) validateStringArray(ref[field], `${path}.${field}`, failures, { allowEmpty: true });
  if (!Array.isArray(ref.reading_priority)) failures.push(`${path}.reading_priority must be array`);
}

function validateAgainstResolvedTaxonomy(inventory, resolved, failures) {
  const obligations = new Map((resolved.obligations || []).map((row) => [`${row.source_package_id}:${row.obligation_id}`, row]));
  for (const [index, candidate] of (inventory.candidates || []).entries()) {
    const path = `candidates[${index}]`;
    const row = obligations.get(`${candidate.source_package_id}:${candidate.obligation_id}`);
    if (!row) {
      failures.push(`${path} obligation not found in resolved mounted taxonomy`);
      continue;
    }
    for (const field of ["obligation_family", "source_layer", "catalog_package_id", "capability_overlay_id"]) {
      if (normalizeId(candidate[field]) !== normalizeId(row[field])) failures.push(`${path}.${field} mismatch with resolved taxonomy`);
    }
    if (row.resolution_status !== "RESOLVED") failures.push(`${path} originated from unresolved obligation`);
    if (!deepEqual(candidate.registry_key_ref, row.registry_key_ref)) failures.push(`${path}.registry_key_ref mismatch with resolver`);
    if (!deepEqual(candidate.obligation_catalog_ref, row.obligation_catalog_ref)) failures.push(`${path}.obligation_catalog_ref mismatch with resolver`);
  }
  if (!deepEqual(inventory.mounted_package_refs, resolved.mounted_taxonomy_ref || {})) failures.push("mounted_package_refs mismatch with resolver");
}

function validateAgainstNavigationIndex(inventory, navigationIndexInput, failures) {
  const index = unwrapArtifact(navigationIndexInput, NAVIGATION_INDEX_ARTIFACT);
  const rows = new Map();
  for (const row of Array.isArray(index.obligation_family_routing) ? index.obligation_family_routing : []) {
    const key = `${normalizeId(row.domain_id)}:${normalizeId(row.obligation_family)}`;
    if (!rows.has(key)) rows.set(key, []);
    rows.get(key).push(row);
  }
  for (const [candidateIndex, candidate] of (inventory.candidates || []).entries()) {
    const key = `${candidate.catalog_package_id}:${candidate.obligation_family}`;
    const matches = rows.get(key) || [];
    if (matches.length !== 1) {
      failures.push(`candidates[${candidateIndex}] P2E route resolution count:${matches.length}`);
      continue;
    }
    const expected = canonicalRouteRef(matches[0]);
    if (!deepEqual(candidate.p2e_navigation_route_refs?.[0], expected)) failures.push(`candidates[${candidateIndex}].p2e_navigation_route_refs mismatch with P2E index`);
  }
}

function validateExactDeterministicCandidateUniverse(inventory, { resolvedTaxonomy, navigationIndex, targetFeatureProfile }, failures) {
  const profile = unwrapArtifact(targetFeatureProfile, "target_feature_profile");
  const index = unwrapArtifact(navigationIndex, NAVIGATION_INDEX_ARTIFACT);
  const p2eKeys = new Map();
  for (const row of Array.isArray(index.obligation_family_routing) ? index.obligation_family_routing : []) {
    const key = `${normalizeId(row.domain_id)}:${normalizeId(row.obligation_family)}`;
    p2eKeys.set(key, (p2eKeys.get(key) || 0) + 1);
  }

  const expected = new Map();
  for (const obligation of resolvedTaxonomy.obligations || []) {
    if (obligation.resolution_status !== "RESOLVED") continue;
    if (!DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS.includes(obligation.source_layer)) continue;
    if (!(obligation.applies_when?.behavior_class || []).length || !(obligation.applies_when?.surface || []).length) continue;
    const p2eKey = `${obligation.catalog_package_id}:${obligation.obligation_family}`;
    if (p2eKeys.get(p2eKey) !== 1) continue;

    const linked = [];
    const matchedBehaviors = new Set();
    const matchedSurfaces = new Set();
    for (const activity of profile.activities || []) {
      const match = matchActivityToObligation(activity, obligation);
      if (!match) continue;
      linked.push(match.activity_reference);
      match.behavior_codes.forEach((value) => matchedBehaviors.add(value));
      match.surface_tokens.forEach((value) => matchedSurfaces.add(value));
    }
    if (!linked.length) continue;
    expected.set(`${obligation.source_package_id}:${obligation.obligation_id}`, {
      linked_activity_references: uniqueStrings(linked).sort(),
      matched_behavior_codes: [...matchedBehaviors].sort(),
      matched_surface_tokens: [...matchedSurfaces].sort()
    });
  }

  const actual = new Map((inventory.candidates || []).map((row) => [`${row.source_package_id}:${row.obligation_id}`, row]));
  for (const [key, expectedMatch] of expected) {
    const candidate = actual.get(key);
    if (!candidate) {
      failures.push(`expected candidate missing:${key}`);
      continue;
    }
    for (const field of ["linked_activity_references", "matched_behavior_codes", "matched_surface_tokens"]) {
      if (!deepEqual(candidate[field], expectedMatch[field])) failures.push(`${key}.${field} mismatch with Phase 5 package-scoped trigger match`);
    }
  }
  for (const key of actual.keys()) if (!expected.has(key)) failures.push(`unexpected candidate emitted:${key}`);
}

function matchActivityToObligation(activity, obligation) {
  let block = null;
  if (obligation.source_layer === "PRIMARY") {
    if (activity.primary_classification?.package_id === obligation.source_package_id) block = activity.primary_classification;
  } else if (obligation.source_layer === "CAPABILITY_OVERLAY") {
    block = (activity.overlay_classifications || []).find((row) => row?.overlay_id === obligation.capability_overlay_id && row?.package_id === obligation.source_package_id) || null;
  }
  if (!block) return null;
  const behaviorCodes = intersection(obligation.applies_when?.behavior_class, block.archetype_codes);
  const surfaceTokens = intersection(obligation.applies_when?.surface, block.surface_context_tokens);
  const activityReference = normalizeId(activity.activity_reference);
  if (!behaviorCodes.length || !surfaceTokens.length || !activityReference) return null;
  return {
    activity_reference: activityReference,
    behavior_codes: behaviorCodes,
    surface_tokens: surfaceTokens
  };
}

function canonicalRouteRef(row = {}) {
  return {
    route_ref_id: `${normalizeId(row.domain_id)}:${normalizeId(row.obligation_family)}`,
    domain_id: normalizeId(row.domain_id),
    obligation_family: normalizeId(row.obligation_family),
    required_control_source_route_ids: uniqueStrings(row.required_control_source_route_ids || []).sort(),
    selective_legal_route_ids: uniqueStrings(row.selective_legal_route_ids || []).sort(),
    locator_families: uniqueStrings(row.locator_families || []).sort(),
    legal_doc_types: uniqueStrings(row.legal_doc_types || []).sort(),
    shell_field_targets: uniqueStrings(row.shell_field_targets || []).sort(),
    reading_priority: normalizeArray(row.reading_priority).map(clonePlain)
  };
}

function validateExactObject(value, expectedFields, path, failures) {
  if (!isPlainObject(value)) return failures.push(`${path} must be object`);
  rejectKeyDiff(Object.keys(value), expectedFields, path, failures);
}

function validateStringArray(value, path, failures, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) return failures.push(`${path} must be array`);
  if (!allowEmpty && !value.length) failures.push(`${path} must be non-empty`);
  const seen = new Set();
  value.forEach((item, index) => {
    if (!normalizeId(item)) failures.push(`${path}[${index}] must be non-empty string`);
    if (seen.has(item)) failures.push(`${path}[${index}] duplicate:${item}`);
    seen.add(item);
  });
}

function rejectKeyDiff(actualFields, expectedFields, path, failures) {
  const actual = [...actualFields].sort();
  const expected = [...expectedFields].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) failures.push(`${path} field set mismatch`);
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

function intersection(left, right) {
  const rightSet = new Set(uniqueStrings(right));
  return uniqueStrings(left).filter((value) => rightSet.has(value));
}

function unwrapArtifact(value = {}, artifactName) {
  if (isPlainObject(value?.[artifactName])) return value[artifactName];
  if (value?.artifact_type === artifactName) return value;
  return value || {};
}

function deepEqual(left, right) {
  return JSON.stringify(left) === JSON.stringify(right);
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

function receipt(failures) {
  return Object.freeze({
    status: failures.length ? "FAIL" : "PASS",
    failures: Object.freeze([...failures])
  });
}
