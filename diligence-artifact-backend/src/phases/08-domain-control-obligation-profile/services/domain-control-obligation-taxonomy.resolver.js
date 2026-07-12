import path from "node:path";
import { discoverPackageKeys } from "../../../runtime/domain-gate/domain-derivation-registry.loader.js";
import { loadPackageCatalogV0 } from "../../../runtime/domain-gate/package-catalog.loader.js";
import { loadObligationCatalogs } from "../../02-cartography-index/services/domain-control-obligation-navigation-index.builder.js";
import {
  DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS,
  DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_MODE,
  DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS
} from "../domain-control-obligation.constants.js";

const RESOLVER_ID = "domain-control-obligation-taxonomy.resolver";
const RESOLVER_VERSION = "phase8_dco_taxonomy_resolver_v1_package_agnostic";
const PRIMARY_SOURCE_LAYER = "PRIMARY";
const CAPABILITY_SOURCE_LAYER = "CAPABILITY_OVERLAY";
const REGULATORY_SOURCE_LAYER = "REGULATORY_OVERLAY";

export const DOMAIN_CONTROL_OBLIGATION_TAXONOMY_RESOLVER_STATUS = Object.freeze({
  resolver: RESOLVER_ID,
  resolver_version: RESOLVER_VERSION,
  registry_discovery: "references/registry/*_Registry_Key.yml",
  primary_key_mapping: "registry_key.domain_package",
  capability_overlay_mapping: "serves_capability_overlay",
  obligation_definition_source: "domain_control_obligation.obligations",
  catalog_mapping_primary: "domain_control_obligation.navigation_companion",
  catalog_mapping_fallback: "catalog.domain_id matched to mounted package or overlay declaration",
  regulatory_overlay_mapping: "regulatory_overlay.overlays",
  regulatory_overlay_mode: DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_MODE,
  hardcoded_domain_logic: false,
  resolver_reads_runtime_artifacts: false,
  resolver_expands_phase2g_reads: false,
  phase2g_remains_only_routing_authority: true,
  obligation_catalogs_are_navigation_authority_only: true,
  registry_values_are_model_inputs_not_backend_material_answers: true
});

export async function resolveDomainControlObligationTaxonomy({
  activeRunPackageManifest = {},
  primaryPackageId,
  capabilityOverlayIds,
  regulatoryOverlayIds,
  packageKeys,
  obligationCatalogs,
  packageCatalog
} = {}) {
  const mounted = extractMountedPackageContext({
    manifest: activeRunPackageManifest,
    primaryPackageId,
    capabilityOverlayIds,
    regulatoryOverlayIds
  });

  if (!mounted.primary_package_id) {
    throw new Error("DOMAIN_CONTROL_OBLIGATION_PRIMARY_PACKAGE_MISSING");
  }

  const discovered = packageKeys
    ? normalizeDiscoveredPackageKeys(packageKeys)
    : normalizeDiscoveredPackageKeys(await discoverPackageKeys());
  const catalogManifest = packageCatalog || await loadPackageCatalogV0();
  const catalogs = normalizeObligationCatalogs(obligationCatalogs || loadObligationCatalogs());
  const keyRecords = Object.entries(discovered)
    .map(([packageId, entry]) => normalizeKeyRecord({ packageId, entry }))
    .sort((left, right) => left.package_id.localeCompare(right.package_id));

  const limitations = [];
  validateMountedIdsAgainstPackageCatalog({ mounted, catalogManifest, limitations });

  const primaryRecord = keyRecords.find((record) => record.package_id === mounted.primary_package_id) || null;
  if (!primaryRecord) limitations.push(`PRIMARY_PACKAGE_HAS_NO_REGISTRY_KEY:${mounted.primary_package_id}`);

  const primary = primaryRecord
    ? resolveMountedKey({
      record: primaryRecord,
      sourceLayer: PRIMARY_SOURCE_LAYER,
      capabilityOverlayId: "",
      catalogs,
      limitations
    })
    : null;

  const capabilityOverlays = [];
  for (const overlayId of mounted.capability_overlay_ids) {
    const matches = keyRecords.filter((record) => record.serves_capability_overlay.includes(overlayId));
    if (!matches.length) {
      limitations.push(`CAPABILITY_OVERLAY_HAS_NO_REGISTRY_KEY:${overlayId}`);
      continue;
    }
    if (matches.length > 1) {
      limitations.push(`CAPABILITY_OVERLAY_KEY_AMBIGUOUS:${overlayId}:${matches.map((record) => record.package_id).join(",")}`);
      continue;
    }
    capabilityOverlays.push(resolveMountedKey({
      record: matches[0],
      sourceLayer: CAPABILITY_SOURCE_LAYER,
      capabilityOverlayId: overlayId,
      catalogs,
      limitations
    }));
  }

  const mountedKeyScopes = [
    ...(primary ? [primary] : []),
    ...capabilityOverlays
  ];

  const regulatoryOverlays = resolveMountedRegulatoryOverlays({
    mountedOverlayIds: mounted.regulatory_overlay_ids,
    mountedKeyScopes,
    limitations
  });

  const obligations = deduplicateResolvedObligations({
    obligations: mountedKeyScopes.flatMap((scope) => scope.obligations || []),
    limitations
  });

  const mountedTaxonomyRef = buildMountedTaxonomyRef({
    mounted,
    primary,
    capabilityOverlays,
    regulatoryOverlays
  });

  const resolvedCount = obligations.filter((row) => row.resolution_status === "RESOLVED").length;
  const unresolvedCount = obligations.length - resolvedCount;

  return deepFreeze({
    resolver_id: RESOLVER_ID,
    resolver_version: RESOLVER_VERSION,
    resolver_status: unresolvedCount || limitations.length ? "RESOLVED_WITH_LIMITATIONS" : "RESOLVED",
    authority_model: {
      individual_obligation_authority: "MOUNTED_REGISTRY_KEY",
      obligation_family_navigation_authority: "INSTALLED_OBLIGATION_CATALOG",
      regulatory_overlay_authority: "MOUNTED_REGISTRY_KEY_OVERLAY_DECLARATION",
      material_derivation_owner: "MODEL",
      mechanical_compilation_owner: "BACKEND",
      regulatory_overlay_mode: DOMAIN_CONTROL_OBLIGATION_REGULATORY_OVERLAY_MODE
    },
    mounted_package_context: mounted,
    mounted_taxonomy_ref: mountedTaxonomyRef,
    primary,
    capability_overlays: capabilityOverlays,
    regulatory_overlays: regulatoryOverlays,
    obligations,
    resolution_summary: {
      mounted_key_scope_count: mountedKeyScopes.length,
      loaded_catalog_count: catalogs.length,
      obligation_count: obligations.length,
      resolved_obligation_count: resolvedCount,
      unresolved_obligation_count: unresolvedCount,
      regulatory_overlay_count: regulatoryOverlays.length
    },
    loaded_obligation_catalogs: catalogs.map(catalogRef),
    limitations: uniqueStrings(limitations)
  });
}

function extractMountedPackageContext({
  manifest = {},
  primaryPackageId,
  capabilityOverlayIds,
  regulatoryOverlayIds
} = {}) {
  const primary = normalizeId(
    primaryPackageId
      ?? manifest.primary_domain_package
      ?? manifest.primaryPackageId
      ?? manifest.primary_package_id
  );
  const regulatory = uniqueStrings(
    regulatoryOverlayIds
      ?? manifest.regulatory_overlays
      ?? manifest.regulatoryOverlayIds
      ?? manifest.regulatory_overlay_ids
      ?? []
  );
  const capability = uniqueStrings(
    capabilityOverlayIds
      ?? manifest.capability_overlays
      ?? manifest.capabilityOverlayIds
      ?? manifest.capability_overlay_ids
      ?? []
  ).filter((overlayId) => !regulatory.includes(overlayId));

  return deepFreeze({
    primary_package_id: primary,
    capability_overlay_ids: capability,
    regulatory_overlay_ids: regulatory
  });
}

function normalizeDiscoveredPackageKeys(value = {}) {
  if (!isPlainObject(value)) throw new Error("DOMAIN_CONTROL_OBLIGATION_PACKAGE_KEYS_INVALID");
  const out = {};
  for (const [packageId, entryValue] of Object.entries(value)) {
    const entry = isPlainObject(entryValue) && Object.prototype.hasOwnProperty.call(entryValue, "key")
      ? entryValue
      : { file: "", key: entryValue };
    if (!isPlainObject(entry.key)) continue;
    const declaredPackageId = normalizeId(entry.key?.registry_key?.domain_package || packageId);
    if (!declaredPackageId) continue;
    out[declaredPackageId] = {
      file: normalizeId(entry.file),
      key: entry.key
    };
  }
  return out;
}

function normalizeKeyRecord({ packageId, entry = {} }) {
  const key = entry.key || {};
  const registryKey = key.registry_key || {};
  const declaredPackageId = normalizeId(registryKey.domain_package || packageId);
  if (!declaredPackageId) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_REGISTRY_KEY_PACKAGE_MISSING:${entry.file || "unknown"}`);
  }

  return deepFreeze({
    package_id: declaredPackageId,
    key_file: normalizeId(entry.file),
    key_version: normalizeId(registryKey.version || key.version || key.schema_version),
    serves_capability_overlay: uniqueStrings(key.serves_capability_overlay || []),
    navigation_companion: normalizeId(key?.domain_control_obligation?.navigation_companion),
    obligations: normalizeArray(key?.domain_control_obligation?.obligations),
    regulatory_overlay_declarations: normalizeArray(key?.regulatory_overlay?.overlays),
    key
  });
}

function normalizeObligationCatalogs(values = []) {
  return normalizeArray(values)
    .filter(isPlainObject)
    .map((catalog) => deepFreeze({
      ...clonePlain(catalog),
      catalog_file: normalizeId(catalog.catalog_file),
      domain_id: normalizeId(catalog.domain_id),
      obligation_families: normalizeArray(catalog.obligation_families).filter(isPlainObject).map(clonePlain)
    }))
    .sort((left, right) => `${left.domain_id}:${left.catalog_file}`.localeCompare(`${right.domain_id}:${right.catalog_file}`));
}

function resolveMountedKey({
  record,
  sourceLayer,
  capabilityOverlayId,
  catalogs,
  limitations
}) {
  if (!DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYERS.includes(sourceLayer)) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_SOURCE_LAYER_FORBIDDEN:${sourceLayer || "missing"}`);
  }
  if (DOMAIN_CONTROL_OBLIGATION_FORBIDDEN_SOURCE_LAYERS.includes(sourceLayer)) {
    throw new Error(`DOMAIN_CONTROL_OBLIGATION_REGULATORY_SOURCE_LAYER_FORBIDDEN:${sourceLayer}`);
  }

  const catalog = resolveCatalogForMountedKey({
    record,
    sourceLayer,
    capabilityOverlayId,
    catalogs,
    limitations
  });
  const familyMap = new Map(
    normalizeArray(catalog?.obligation_families)
      .filter(isPlainObject)
      .map((family) => [normalizeId(family.id), family])
      .filter(([familyId]) => familyId)
  );

  if (!record.obligations.length) {
    limitations.push(`PACKAGE_KEY_HAS_NO_DOMAIN_CONTROL_OBLIGATIONS:${record.package_id}`);
  }

  const obligations = record.obligations.map((raw, index) => normalizeResolvedObligation({
    raw,
    index,
    record,
    sourceLayer,
    capabilityOverlayId,
    catalog,
    familyMap,
    limitations
  }));

  return deepFreeze({
    source_layer: sourceLayer,
    package_id: record.package_id,
    capability_overlay_id: capabilityOverlayId || "",
    key_file: record.key_file,
    key_version: record.key_version,
    navigation_companion: record.navigation_companion,
    catalog: catalog ? catalogRef(catalog) : null,
    obligation_count: obligations.length,
    obligations,
    regulatory_overlay_declarations: record.regulatory_overlay_declarations.map(clonePlain),
    resolution_status: catalog ? "RESOLVED" : "RESOLVED_WITHOUT_CATALOG"
  });
}

function resolveCatalogForMountedKey({
  record,
  sourceLayer,
  capabilityOverlayId,
  catalogs,
  limitations
}) {
  const declaredFile = record.navigation_companion ? path.basename(record.navigation_companion) : "";
  if (declaredFile) {
    const exact = catalogs.filter((catalog) => catalog.catalog_file === declaredFile);
    if (exact.length === 1) return exact[0];
    if (exact.length > 1) {
      limitations.push(`OBLIGATION_CATALOG_FILE_AMBIGUOUS:${record.package_id}:${declaredFile}`);
      return null;
    }
    limitations.push(`DECLARED_OBLIGATION_CATALOG_NOT_INSTALLED:${record.package_id}:${declaredFile}`);
  }

  const candidateDomainIds = uniqueStrings([
    sourceLayer === CAPABILITY_SOURCE_LAYER ? capabilityOverlayId : "",
    record.package_id,
    ...record.serves_capability_overlay
  ]);
  const byDomain = catalogs.filter((catalog) => candidateDomainIds.includes(catalog.domain_id));
  if (byDomain.length === 1) return byDomain[0];
  if (byDomain.length > 1) {
    limitations.push(`OBLIGATION_CATALOG_DOMAIN_AMBIGUOUS:${record.package_id}:${candidateDomainIds.join(",")}`);
    return null;
  }

  limitations.push(`OBLIGATION_CATALOG_NOT_RESOLVED:${record.package_id}:${capabilityOverlayId || "PRIMARY"}`);
  return null;
}

function normalizeResolvedObligation({
  raw,
  index,
  record,
  sourceLayer,
  capabilityOverlayId,
  catalog,
  familyMap,
  limitations
}) {
  const value = isPlainObject(raw) ? raw : {};
  const obligationId = normalizeId(value.obligation_id);
  const obligationFamily = normalizeId(value.obligation_family);
  const localLimitations = [];

  if (!obligationId) localLimitations.push(`OBLIGATION_ID_MISSING:${record.package_id}:${index}`);
  if (!obligationFamily) localLimitations.push(`OBLIGATION_FAMILY_MISSING:${record.package_id}:${obligationId || index}`);

  const family = obligationFamily ? familyMap.get(obligationFamily) || null : null;
  if (obligationFamily && !family) {
    localLimitations.push(`OBLIGATION_FAMILY_NOT_IN_CATALOG:${record.package_id}:${obligationId || index}:${obligationFamily}`);
  }
  if (!catalog) {
    localLimitations.push(`OBLIGATION_CATALOG_UNRESOLVED:${record.package_id}:${obligationId || index}`);
  }

  limitations.push(...localLimitations);
  const resolutionStatus = obligationId && obligationFamily && catalog && family
    ? "RESOLVED"
    : "UNRESOLVED";

  return deepFreeze({
    obligation_id: obligationId,
    obligation_family: obligationFamily,
    source_layer: sourceLayer,
    source_package_id: record.package_id,
    catalog_package_id: normalizeId(catalog?.domain_id),
    capability_overlay_id: capabilityOverlayId || "",
    applies_when: normalizeAppliesWhen(value.applies_when),
    registry_key_ref: {
      key_file: record.key_file,
      package_id: record.package_id,
      key_version: record.key_version,
      obligation_path: `domain_control_obligation.obligations[${index}]`
    },
    obligation_catalog_ref: catalog && family ? {
      catalog_file: catalog.catalog_file,
      domain_id: catalog.domain_id,
      obligation_family: obligationFamily
    } : null,
    registry_obligation: clonePlain(value),
    catalog_family: family ? clonePlain(family) : null,
    navigation_metadata: family ? normalizeCatalogFamilyNavigation(family) : null,
    resolution_status: resolutionStatus,
    limitations: uniqueStrings(localLimitations)
  });
}

function normalizeAppliesWhen(value) {
  const applies = isPlainObject(value) ? value : {};
  return deepFreeze({
    behavior_class: uniqueStrings(applies.behavior_class || applies.behavior_classes || []),
    surface: uniqueStrings(applies.surface || applies.surfaces || [])
  });
}

function normalizeCatalogFamilyNavigation(family = {}) {
  return deepFreeze({
    obligation_family: normalizeId(family.id),
    control_source_route_codes: uniqueStrings(family.control_source_route_codes || []),
    locator_families: uniqueStrings(family.locator_families || []),
    legal_doc_types: uniqueStrings(family.legal_doc_types || []),
    shell_field_targets: uniqueStrings(family.shell_field_targets || []),
    reading_priority: normalizeArray(family.reading_priority).map(clonePlain)
  });
}

function deduplicateResolvedObligations({ obligations = [], limitations }) {
  const seen = new Set();
  const output = [];
  for (const row of obligations) {
    const scopedId = `${row.source_package_id}:${row.obligation_id}`;
    if (!row.obligation_id) {
      output.push(row);
      continue;
    }
    if (seen.has(scopedId)) {
      limitations.push(`DUPLICATE_PACKAGE_SCOPED_OBLIGATION_ID:${scopedId}`);
      continue;
    }
    seen.add(scopedId);
    output.push(row);
  }
  return output.sort((left, right) => {
    const leftKey = `${left.source_layer}:${left.source_package_id}:${left.capability_overlay_id}:${left.obligation_id}`;
    const rightKey = `${right.source_layer}:${right.source_package_id}:${right.capability_overlay_id}:${right.obligation_id}`;
    return leftKey.localeCompare(rightKey);
  });
}

function resolveMountedRegulatoryOverlays({
  mountedOverlayIds,
  mountedKeyScopes,
  limitations
}) {
  const output = [];

  for (const overlayId of mountedOverlayIds) {
    const declarations = [];
    for (const scope of mountedKeyScopes) {
      for (const raw of scope.regulatory_overlay_declarations || []) {
        if (!isPlainObject(raw) || normalizeId(raw.overlay_id) !== overlayId) continue;
        declarations.push({
          source_layer: scope.source_layer,
          package_id: scope.package_id,
          key_file: scope.key_file,
          key_version: scope.key_version,
          declaration: raw
        });
      }
    }

    if (!declarations.length) {
      limitations.push(`MOUNTED_REGULATORY_OVERLAY_HAS_NO_KEY_DECLARATION:${overlayId}`);
      output.push(deepFreeze({
        overlay_id: overlayId,
        package_id: "",
        key_version: "",
        framework_links: [],
        overlay_status: "CANDIDATE_ONLY",
        trigger_if: "",
        declaration_sources: [],
        may_create_obligation_row: false,
        resolution_status: "UNRESOLVED_DECLARATION"
      }));
      continue;
    }

    const sorted = declarations.sort((left, right) => {
      const leftPriority = left.source_layer === PRIMARY_SOURCE_LAYER ? 0 : 1;
      const rightPriority = right.source_layer === PRIMARY_SOURCE_LAYER ? 0 : 1;
      return leftPriority - rightPriority || left.package_id.localeCompare(right.package_id);
    });
    if (sorted.length > 1) limitations.push(`MULTIPLE_REGULATORY_OVERLAY_DECLARATIONS:${overlayId}`);

    const selected = sorted[0];
    const frameworkLinks = uniqueStrings(sorted.flatMap((row) => row.declaration.links_to_framework || []));
    output.push(deepFreeze({
      overlay_id: overlayId,
      package_id: selected.package_id,
      key_version: selected.key_version,
      framework_links: frameworkLinks,
      overlay_status: normalizeId(selected.declaration.default_status) || "CANDIDATE_ONLY",
      trigger_if: normalizeTrigger(selected.declaration.trigger_if),
      declaration_sources: sorted.map((row) => ({
        source_layer: row.source_layer,
        package_id: row.package_id,
        key_file: row.key_file,
        key_version: row.key_version,
        framework_links: uniqueStrings(row.declaration.links_to_framework || [])
      })),
      may_create_obligation_row: false,
      resolution_status: "RESOLVED"
    }));
  }

  return output.sort((left, right) => left.overlay_id.localeCompare(right.overlay_id));
}

function buildMountedTaxonomyRef({ mounted, primary, capabilityOverlays, regulatoryOverlays }) {
  return deepFreeze({
    primary_package_id: mounted.primary_package_id,
    primary_key_version: primary?.key_version || "",
    capability_overlays: capabilityOverlays.map((overlay) => ({
      overlay_id: overlay.capability_overlay_id,
      package_id: overlay.package_id,
      key_version: overlay.key_version
    })),
    regulatory_overlays: regulatoryOverlays.map((overlay) => ({
      overlay_id: overlay.overlay_id,
      package_id: overlay.package_id,
      key_version: overlay.key_version,
      framework_links: overlay.framework_links
    }))
  });
}

function validateMountedIdsAgainstPackageCatalog({ mounted, catalogManifest = {}, limitations }) {
  const primarySet = new Set(uniqueStrings(catalogManifest.primary_domain_packages || []));
  const capabilitySet = new Set(uniqueStrings(catalogManifest.capability_overlays || []));
  const regulatorySet = new Set(uniqueStrings(catalogManifest.regulatory_overlays || []));

  if (!primarySet.has(mounted.primary_package_id)) {
    limitations.push(`PRIMARY_PACKAGE_NOT_IN_PACKAGE_CATALOG:${mounted.primary_package_id}`);
  }
  for (const overlayId of mounted.capability_overlay_ids) {
    if (!capabilitySet.has(overlayId)) limitations.push(`CAPABILITY_OVERLAY_NOT_IN_PACKAGE_CATALOG:${overlayId}`);
  }
  for (const overlayId of mounted.regulatory_overlay_ids) {
    if (!regulatorySet.has(overlayId)) limitations.push(`REGULATORY_OVERLAY_NOT_IN_PACKAGE_CATALOG:${overlayId}`);
  }
}

function catalogRef(catalog = {}) {
  return deepFreeze({
    catalog_file: normalizeId(catalog.catalog_file),
    domain_id: normalizeId(catalog.domain_id),
    catalog_version: normalizeId(catalog.version || catalog.schema_version),
    obligation_family_count: normalizeArray(catalog.obligation_families).length,
    uses_legal_index: catalog.uses_legal_index !== false,
    may_narrow_navigation: catalog.may_narrow_navigation === true,
    may_lock_domain: catalog.may_lock_domain === true
  });
}

function normalizeTrigger(value) {
  if (typeof value === "string") return value.trim();
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" ? item : JSON.stringify(item)).join(" AND ");
  if (isPlainObject(value)) return JSON.stringify(value);
  return "";
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
