import { artifactRoot } from "./phase12-report-contract.js";
import { FORBIDDEN_REPORT_KEYS } from "./phase12-artifact-family.contract.js";
import { normalizeRegistryCode, normalizeSectorPackage } from "./phase12-taxonomy-normalizer.js";

export function projectFdrFinding({ route = {}, artifacts = {}, reportArtifactName, custodyManifest } = {}) {
  const resolved = resolveRouteValue(route, artifacts);
  const finding = {
    field_id: route.field_id,
    label: route.canonical_label,
    value: cleanMaterialValue(resolved.value),
    value_status: resolved.status,
    report_importance: route.report_importance || "MATERIAL",
    presentation: route.presentation || "FIELD_OR_ROW"
  };
  custodyManifest?.field_bindings?.push({
    report_artifact: reportArtifactName,
    field_id: route.field_id,
    route_id: route.route_id,
    owner_phase: route.owner_phase,
    source_artifact: route.selected_source_artifact,
    source_path: resolved.path,
    value_status: resolved.status
  });
  return finding;
}

export function buildExposureDisplayRow({ row = {}, reportArtifactName, rowIndex = 0, custodyManifest } = {}) {
  const packageId = String(row.package_id || "").trim();
  const streamScope = String(row.stream_type || "").toUpperCase() === "PRIMARY" ? "Primary Sector" : "Capability Overlay";
  const materialStatus = String(row.evaluation_status || row.final_material_status || "").toUpperCase();
  const display = {
    identity: {
      threat_id: row.Threat_ID,
      threat_name: row.Threat_Name,
      sector: normalizeSectorPackage(packageId),
      stream_scope: streamScope,
      material_status: materialStatus
    },
    classification: {
      lane: normalizeRegistryCode({ packageId, resolver: "lane", value: row.Lane }),
      behavior_class: normalizeRegistryCode({ packageId, resolver: "behavior_class", value: row.Behavior_Class }),
      surface: normalizeRegistryCode({ packageId, resolver: "surface", value: row.Surface }),
      subcategory: normalizeRegistryCode({ packageId, resolver: "subcat", value: row.Subcategory }),
      compliance_framework: normalizeRegistryCode({ packageId, resolver: "compliance_framework", value: row.Compliance_Framework })
    },
    authorities: {
      india: cleanMaterialValue(row.Authority_IN),
      european_union: cleanMaterialValue(row.Authority_EU),
      united_states: cleanMaterialValue(row.Authority_US)
    },
    severity: {
      velocity: normalizeRegistryCode({ packageId, resolver: "velocity", value: row.Velocity }),
      pain_tier: normalizeRegistryCode({ packageId, resolver: "pain_tier", value: row.Pain_Tier }),
      pain_category: cleanMaterialValue(row.Pain_Category),
      pain_depth: normalizeRegistryCode({ packageId, resolver: "pain_depth", value: row.Pain_Depth }),
      legal_status: normalizeRegistryCode({ packageId, resolver: "legal_status", value: row.Status }),
      effective_date: cleanMaterialValue(row.Effective_Date)
    },
    basis: {
      target_match: cleanMaterialValue(row.target_match),
      basis_proof: cleanMaterialValue(row.basis_proof),
      control_or_exclusion_position: cleanMaterialValue(row.control_exclusion_evaluation),
      evidence_basis: cleanMaterialValue(row.evidence_source_basis),
      provenance: cleanMaterialValue(row.Provenance)
    },
    impact: {
      legal_pain: cleanMaterialValue(row.Legal_Pain),
      false_positive_impact: cleanMaterialValue(row.FP_Impact)
    },
    false_positive: {
      mechanism: cleanMaterialValue(row.FP_Mechanism),
      applied_mechanism: cleanMaterialValue(row.applied_fp_mechanism)
    },
    response: {
      recommended_fix: cleanMaterialValue(row.Lex_Nova_Fix),
      review_route: cleanMaterialValue(row.review_route)
    },
    limitations: normalizeLimitations(row.row_limitations)
  };
  custodyManifest?.exposure_row_bindings?.push({
    report_artifact: reportArtifactName,
    report_row_index: rowIndex,
    registry_row_key: row.registry_row_key,
    package_id: row.package_id,
    source_domain: row.source_domain,
    stream_id: row.stream_id,
    stream_type: row.stream_type,
    source_profile: materialStatus === "TRIGGERED" ? "exposure_registry_triggered_profile" : "exposure_registry_controlled_profile"
  });
  return display;
}

export function cleanMaterialValue(value) {
  if (value === undefined || value === null) return value ?? null;
  if (Array.isArray(value)) return value.map(cleanMaterialValue);
  if (typeof value !== "object") return value;
  const out = {};
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_REPORT_KEYS.has(key)) continue;
    out[key] = cleanMaterialValue(nested);
  }
  return out;
}

export function assertNoForbiddenReportKeys(value, path = "artifact", failures = []) {
  if (!value || typeof value !== "object") return failures;
  if (Array.isArray(value)) {
    value.forEach((item, index) => assertNoForbiddenReportKeys(item, `${path}[${index}]`, failures));
    return failures;
  }
  for (const [key, nested] of Object.entries(value)) {
    if (FORBIDDEN_REPORT_KEYS.has(key)) failures.push(`REPORT_ARTIFACT_FORBIDDEN_KEY:${path}.${key}`);
    assertNoForbiddenReportKeys(nested, `${path}.${key}`, failures);
  }
  return failures;
}

function resolveRouteValue(route, artifacts) {
  const artifactName = route.selected_source_artifact;
  const root = artifactRoot(artifacts[artifactName], artifactName);
  if (!artifactName || !Object.keys(root).length) return unresolved("OWNER_ARTIFACT_MISSING");
  const id = route.field_id;
  for (const [sourcePath, value] of [
    [`${artifactName}.__fdr_values.${id}`, root.__fdr_values?.[id]],
    [`${artifactName}.fields_by_id.${id}`, root.fields_by_id?.[id]],
    [`${artifactName}.${id}`, root[id]],
    [`${artifactName}.${slug(route.canonical_label)}`, root[slug(route.canonical_label)]]
  ]) {
    if (hasValue(value)) return { status: "RESOLVED", value, path: sourcePath };
  }
  return unresolved("UPSTREAM_VALUE_UNAVAILABLE");
}

function normalizeLimitations(value) {
  if (Array.isArray(value)) return cleanMaterialValue(value);
  if (value === undefined || value === null || value === "") return [];
  return [cleanMaterialValue(value)];
}

function unresolved(status) { return { status, value: null, path: null }; }
function hasValue(value) { return value !== undefined && value !== null && !(typeof value === "string" && !value.trim()); }
function slug(value) { return String(value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_+|_+$/g, ""); }
