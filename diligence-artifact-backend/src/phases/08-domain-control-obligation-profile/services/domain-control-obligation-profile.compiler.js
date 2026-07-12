import {
  DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_DERIVATION_MODE,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION
} from "../domain-control-obligation.constants.js";
import {
  assertDomainControlObligationModelOutput,
  assertDomainControlObligationProfile,
  expectedRegulatoryOverlayRefs
} from "../validators/domain-control-obligation-profile.validator.js";

export const DOMAIN_CONTROL_OBLIGATION_PROFILE_COMPILER_STATUS = Object.freeze({
  compiler: "domain-control-obligation-profile.compiler",
  compiler_version: "phase8_dco_profile_compiler_v1_mechanical_only",
  material_field_owner: "MODEL",
  mechanical_field_owner: "BACKEND",
  candidate_universe_source: "domain_control_obligation_candidate_inventory",
  backend_material_defaulting_allowed: false,
  backend_material_rewrite_allowed: false,
  regulatory_overlay_mode: "ENRICH_EXISTING_ROWS_ONLY",
  regulatory_overlay_obligation_rows_allowed: false
});

export function compileDomainControlObligationProfile({
  modelOutput,
  candidateInventory,
  resolvedTaxonomy,
  runId = "",
  fdrRules = []
} = {}) {
  assertDomainControlObligationModelOutput(modelOutput, {
    candidateInventory,
    resolvedTaxonomy,
    fdrRules
  });

  const inventory = unwrapArtifact(candidateInventory, "domain_control_obligation_candidate_inventory");
  const modelProfile = modelOutput[DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT];
  const modelRows = new Map(modelProfile.obligations.map((row) => [row.candidate_id, row]));
  const candidates = Array.isArray(inventory.candidates) ? inventory.candidates : [];

  const obligations = candidates.map((candidate) => {
    const modelRow = modelRows.get(candidate.candidate_id);
    if (!modelRow) throw new Error(`DOMAIN_CONTROL_OBLIGATION_COMPILER_MODEL_ROW_MISSING:${candidate.candidate_id}`);

    const mechanical = mechanicalRowFromCandidate(candidate, {
      regulatoryOverlayRefs: expectedRegulatoryOverlayRefs({
        authorityDependency: modelRow.authority_dependency,
        resolvedTaxonomy
      })
    });
    const material = materialRowFromModel(modelRow);

    return deepFreeze({
      ...mechanical,
      ...material
    });
  });

  const profile = deepFreeze({
    artifact_type: DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT,
    schema_version: DOMAIN_CONTROL_OBLIGATION_PROFILE_SCHEMA_VERSION,
    run_id: normalizeId(runId || inventory.run_id),
    derivation_mode: DOMAIN_CONTROL_OBLIGATION_PROFILE_DERIVATION_MODE,
    mounted_taxonomy_ref: normalizeMountedTaxonomyRef(
      resolvedTaxonomy?.mounted_taxonomy_ref || inventory.mounted_package_refs || {}
    ),
    obligation_count: obligations.length,
    obligations,
    profile_level_limitations: collectMechanicalProfileLimitations({
      inventory,
      resolvedTaxonomy
    })
  });

  const wrapped = deepFreeze({
    [DOMAIN_CONTROL_OBLIGATION_PROFILE_ARTIFACT]: profile
  });

  assertDomainControlObligationProfile(wrapped, {
    candidateInventory,
    resolvedTaxonomy,
    modelOutput
  });

  return wrapped;
}

function mechanicalRowFromCandidate(candidate = {}, { regulatoryOverlayRefs = [] } = {}) {
  const row = {
    candidate_id: clonePlain(candidate.candidate_id),
    obligation_id: clonePlain(candidate.obligation_id),
    obligation_family: clonePlain(candidate.obligation_family),
    source_layer: clonePlain(candidate.source_layer),
    source_package_id: clonePlain(candidate.source_package_id),
    catalog_package_id: clonePlain(candidate.catalog_package_id),
    capability_overlay_id: clonePlain(candidate.capability_overlay_id),
    linked_activity_references: clonePlain(candidate.linked_activity_references),
    matched_behavior_codes: clonePlain(candidate.matched_behavior_codes),
    matched_surface_tokens: clonePlain(candidate.matched_surface_tokens),
    registry_key_ref: clonePlain(candidate.registry_key_ref),
    obligation_catalog_ref: clonePlain(candidate.obligation_catalog_ref),
    p2e_navigation_route_refs: clonePlain(candidate.p2e_navigation_route_refs),
    regulatory_overlay_refs: clonePlain(regulatoryOverlayRefs)
  };

  const actual = Object.keys(row).sort();
  const expected = [...DOMAIN_CONTROL_OBLIGATION_MECHANICAL_PROFILE_ROW_FIELDS].sort();
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_COMPILER_MECHANICAL_FIELD_SET_MISMATCH:${actual.join(",")}`);
  }
  return row;
}

function materialRowFromModel(modelRow = {}) {
  const material = { candidate_id: clonePlain(modelRow.candidate_id) };
  for (const field of DOMAIN_CONTROL_OBLIGATION_MODEL_MATERIAL_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(modelRow, field)) {
      throw new Error(`DOMAIN_CONTROL_OBLIGATION_COMPILER_MATERIAL_FIELD_MISSING:${modelRow.candidate_id || "missing"}:${field}`);
    }
    material[field] = clonePlain(modelRow[field]);
  }
  return material;
}

function normalizeMountedTaxonomyRef(value = {}) {
  return deepFreeze({
    primary_package_id: normalizeId(value.primary_package_id),
    primary_key_version: normalizeId(value.primary_key_version),
    capability_overlays: normalizeArray(value.capability_overlays)
      .filter(isPlainObject)
      .map((row) => ({
        overlay_id: normalizeId(row.overlay_id),
        package_id: normalizeId(row.package_id),
        key_version: normalizeId(row.key_version)
      }))
      .sort((left, right) => left.overlay_id.localeCompare(right.overlay_id)),
    regulatory_overlays: normalizeArray(value.regulatory_overlays)
      .filter(isPlainObject)
      .map((row) => ({
        overlay_id: normalizeId(row.overlay_id),
        package_id: normalizeId(row.package_id),
        key_version: normalizeId(row.key_version),
        framework_links: uniqueStrings(row.framework_links || []).sort()
      }))
      .sort((left, right) => left.overlay_id.localeCompare(right.overlay_id))
  });
}

function collectMechanicalProfileLimitations({ inventory = {}, resolvedTaxonomy = {} } = {}) {
  const limitations = [
    ...uniqueStrings(resolvedTaxonomy.limitations || []),
    ...uniqueStrings(inventory.inventory_limitations || [])
  ];

  for (const candidate of inventory.candidates || []) {
    for (const limitation of uniqueStrings(candidate.candidate_limitation || [])) {
      limitations.push(`CANDIDATE_MECHANICAL_LIMITATION:${candidate.candidate_id}:${limitation}`);
    }
  }

  for (const overlay of resolvedTaxonomy.regulatory_overlays || []) {
    if (overlay?.resolution_status && overlay.resolution_status !== "RESOLVED") {
      limitations.push(`REGULATORY_OVERLAY_CONTEXT_UNRESOLVED:${normalizeId(overlay.overlay_id) || "missing"}`);
    }
  }

  return deepFreeze(uniqueStrings(limitations));
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
