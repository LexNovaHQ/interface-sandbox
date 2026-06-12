import { makeReportShell, makeSection, REPORT_SECTION_KEYS } from "./reportSectionContract.js";
import { hydrateRegistryReportRows, statusCounts } from "./reportRegistryHydrator.js";
import { sanitizeVisibleText } from "./reportLegalLanguage.js";
import { groupIdentifiedExposures } from "./reportExposureGrouper.js";
import { synthesizeDiligenceReportSections } from "./reportDiligenceSynthesizer.js";

const RAW_VALUE_KEYS = new Set([
  "source_url",
  "document_url",
  "url",
  "evidence_hash",
  "source_hash",
  "source_id",
  "registry_reference",
  "finding_id",
  "feature_id",
  "raw",
  "code"
]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function unique(values = []) {
  return [...new Set(values.map((value) => asText(value)).filter(Boolean))];
}

function sanitizeVisibleValue(value, key = "") {
  if (value == null) return value;
  if (typeof value === "string") return RAW_VALUE_KEYS.has(key) ? value : sanitizeVisibleText(value);
  if (Array.isArray(value)) return value.map((item) => sanitizeVisibleValue(item, key));
  if (typeof value === "object") {
    const out = {};
    for (const [childKey, childValue] of Object.entries(value)) {
      out[childKey] = sanitizeVisibleValue(childValue, childKey);
    }
    return out;
  }
  return value;
}

function sanitizeVisibleReportData(reportData = {}) {
  const out = {};
  for (const [key, value] of Object.entries(reportData)) {
    out[key] = key === "forensic_ledger_appendix" ? value : sanitizeVisibleValue(value, key);
  }
  return out;
}

function getTargetName({ companyProfile, targetFeatureProfile, sourceBundle }) {
  const identity = safeObject(companyProfile?.identity);
  const targetRef = safeObject(targetFeatureProfile?.target_profile_ref);
  return asText(
    identity.brand_name ||
      identity.legal_name ||
      targetRef.brand_name ||
      targetRef.legal_name ||
      sourceBundle?.target_url ||
      sourceBundle?.target_domain,
    "Target not specified"
  );
}

function getPrimaryProduct({ companyProfile = {}, targetFeatureProfile = {} } = {}) {
  const products = asArray(companyProfile?.product_baseline?.products).map((product) => typeof product === "string" ? { name: product } : safeObject(product));
  const features = asArray(targetFeatureProfile.feature_inventory);
  const productName = asText(
    products[0]?.name ||
      products[0]?.product_name ||
      features[0]?.business_label_or_product_area ||
      features[0]?.feature_name,
    "Product / matter not specified"
  );
  return {
    name: productName,
    product_name: productName,
    function: unique(features.map((feature) => feature.commercial_function)).join(", "),
    mechanism: unique(features.map((feature) => feature.system_action)).join(", "),
    user: unique(features.map((feature) => feature.actor_or_user)).join(", "),
    source: "target_profile_v2.product_baseline and feature_profile_v2.feature_inventory"
  };
}

function getPrimaryUrl({ sourceBundle = {}, evidenceJunction = {}, stage7Artifact = {}, stage8Ledger = {} } = {}) {
  return asText(
    sourceBundle.target_input?.primary_url ||
      sourceBundle.target_url ||
      evidenceJunction.target_input?.primary_url ||
      stage7Artifact.target_url ||
      stage8Ledger.target_url
  );
}

function normalizeUrl(value) {
  return asText(value).replace(/#.*$/, "").replace(/\/$/, "");
}

function addReviewedSource(map, candidate = {}) {
  const sourceUrl = asText(candidate.source_url || candidate.url || candidate.final_url || candidate.feature_source_url || candidate.document_url);
  const title = asText(candidate.title || candidate.document_type || candidate.source_type || sourceUrl);
  if (!sourceUrl && !title) return;
  const key = normalizeUrl(sourceUrl) || title.toLowerCase();
  if (!key) return;
  const existing = map.get(key) || {};
  map.set(key, {
    source_id: asText(existing.source_id || candidate.source_id || candidate.evidence_source_id || candidate.evidence_route_id || candidate.id, `SRC-${String(map.size + 1).padStart(3, "0")}`),
    title: sanitizeVisibleText(asText(existing.title || title, `Reviewed source ${map.size + 1}`)),
    source_url: asText(existing.source_url || sourceUrl),
    source_type: sanitizeVisibleText(asText(existing.source_type || candidate.source_type || candidate.source_family || candidate.artifact_class || candidate.document_type || "Reviewed evidence")),
    evidence_mode: sanitizeVisibleText(asText(existing.evidence_mode || candidate.evidence_mode || candidate.coverage_status || candidate.capture_mode || "Reviewed evidence")),
    status: sanitizeVisibleText(asText(existing.status || candidate.status || candidate.admission_status)),
    word_count: candidate.word_count ?? existing.word_count ?? null,
    evidence_hash: asText(existing.evidence_hash || candidate.clean_text_sha256 || candidate.source_hash)
  });
}

function sourceInventory({ sourceBundle = {}, evidenceJunction = {}, targetFeatureProfile = {}, legalStackReview = {}, stage7Artifact = {}, stage8Ledger = {} } = {}) {
  const sources = new Map();

  for (const record of asArray(sourceBundle.evidence_buffer)) addReviewedSource(sources, record);
  for (const artifact of asArray(sourceBundle.artifact_inventory)) addReviewedSource(sources, artifact);
  for (const source of asArray(sourceBundle.source_review?.sources_reviewed || sourceBundle.source_review?.reviewed_sources)) addReviewedSource(sources, source);
  for (const source of asArray(sourceBundle.source_discovery?.flattened_sources)) addReviewedSource(sources, {
    ...source,
    source_url: source.final_url || source.url,
    source_type: source.source_family,
    evidence_mode: source.admission_status || source.source_bucket || "Discovered and reviewed source"
  });
  for (const source of asArray(evidenceJunction.source_registry)) addReviewedSource(sources, {
    ...source,
    source_url: source.final_url || source.url,
    source_type: source.source_family,
    evidence_mode: source.coverage_status || "Full visible text captured"
  });
  for (const source of asArray(evidenceJunction.routed_evidence)) addReviewedSource(sources, {
    ...source,
    source_url: source.final_url || source.url,
    source_type: source.source_family,
    evidence_mode: "Routed evidence"
  });
  for (const feature of asArray(targetFeatureProfile.feature_inventory)) addReviewedSource(sources, {
    source_id: feature.feature_id,
    title: feature.feature_name,
    source_url: feature.feature_source_url,
    source_type: "Product / activity evidence",
    evidence_mode: "Feature evidence"
  });
  for (const doc of asArray(legalStackReview.legal_stack)) addReviewedSource(sources, {
    title: doc.document_type,
    document_type: doc.document_type,
    source_url: doc.document_url || doc.url,
    source_type: "Legal stack document",
    evidence_mode: doc.evidence_status || "Legal-stack evidence"
  });
  for (const url of [
    sourceBundle.target_input?.primary_url,
    sourceBundle.target_url,
    evidenceJunction.target_input?.primary_url,
    stage7Artifact.target_url,
    stage8Ledger.target_url
  ]) {
    if (url) addReviewedSource(sources, { title: "Primary target URL", source_url: url, source_type: "Target input", evidence_mode: "Target input" });
  }

  return [...sources.values()].map((record, index) => ({
    ...record,
    source_id: asText(record.source_id, `SRC-${String(index + 1).padStart(3, "0")}`)
  }));
}

function activeSurfaceMap(hydratedRows) {
  const map = new Map();
  for (const item of hydratedRows.rows) {
    for (const surface of item.legal_risk_surfaces || []) {
      if (!map.has(surface)) {
        map.set(surface, {
          legal_risk_surface: surface,
          linked_registry_references: [],
          identified_exposures: 0,
          control_evidenced_items: 0,
          clarification_required_items: 0,
          no_finding_items: 0,
          outside_scope_items: 0,
          jurisdictional_references: { IN: [], EU: [], US: [] }
        });
      }
      const record = map.get(surface);
      record.linked_registry_references.push(item.registry_reference);
      if (item.assessment_status === "TRIGGERED") record.identified_exposures += 1;
      if (item.assessment_status === "CONTROLLED") record.control_evidenced_items += 1;
      if (item.assessment_status === "INSUFFICIENT_EVIDENCE") record.clarification_required_items += 1;
      if (item.assessment_status === "NOT_TRIGGERED") record.no_finding_items += 1;
      if (item.assessment_status === "NOT_APPLICABLE") record.outside_scope_items += 1;
      for (const key of ["IN", "EU", "US"]) {
        if (item.jurisdictional_references?.[key]) record.jurisdictional_references[key].push(item.jurisdictional_references[key]);
      }
    }
  }
  return [...map.values()].map((record) => ({
    ...record,
    linked_registry_references: unique(record.linked_registry_references),
    jurisdictional_references: {
      IN: unique(record.jurisdictional_references.IN),
      EU: unique(record.jurisdictional_references.EU),
      US: unique(record.jurisdictional_references.US)
    }
  }));
}

export function buildStage9Report({ stage6Cache, stage7Artifact, stage8Ledger, registryRuntime }) {
  const generatedAt = new Date().toISOString();
  const sourceBundle = stage6Cache?.source_bundle || {};
  const evidenceJunction = stage6Cache?.evidence_junction || {};
  const companyProfile = stage6Cache?.company_profile || {};
  const targetFeatureProfile = stage6Cache?.target_feature_profile || {};
  const legalStackReview = stage6Cache?.legal_stack_review || {};
  const postChallengeLedger = asArray(stage8Ledger?.post_challenge_ledger || stage7Artifact?.merged_ledger);
  const hydratedRows = hydrateRegistryReportRows({ registryRuntime, postChallengeLedger });
  const consolidatedFindings = groupIdentifiedExposures(hydratedRows.sorted_identified_exposures);
  const surfaces = activeSurfaceMap(hydratedRows);
  const primaryProduct = getPrimaryProduct({ companyProfile, targetFeatureProfile });
  const primaryUrl = getPrimaryUrl({ sourceBundle, evidenceJunction, stage7Artifact, stage8Ledger });
  const reviewedSources = sourceInventory({ sourceBundle, evidenceJunction, targetFeatureProfile, legalStackReview, stage7Artifact, stage8Ledger });
  const report = makeReportShell({ generated_at: generatedAt });

  const sections = synthesizeDiligenceReportSections({
    targetName: getTargetName({ companyProfile, targetFeatureProfile, sourceBundle }),
    primaryUrl,
    primaryProduct,
    sourceBundle,
    targetFeatureProfile,
    legalStackReview,
    hydratedRows,
    consolidatedFindings,
    surfaces,
    reviewedSources,
    stage7Artifact,
    stage8Ledger,
    registryRuntime,
    generatedAt
  });

  for (const key of REPORT_SECTION_KEYS) {
    report.report_data[key] = makeSection(key, sections[key]);
  }
  report.report_data.target_profile_v2 = companyProfile;
  report.report_data.feature_profile_v2 = targetFeatureProfile;
  report.report_data.platform_legal_diligence = sections.platform_legal_diligence;
  report.report_data = sanitizeVisibleReportData(report.report_data);

  return {
    artifact_type: "stage9_legal_exposure_report_data",
    generated_at: generatedAt,
    report,
    hydrated_registry_rows: hydratedRows,
    consolidated_exposure_findings: sections.exposure_findings.consolidated_findings,
    source_meta: {
      stage7_artifact_type: stage7Artifact?.artifact_type || null,
      stage8_artifact_type: stage8Ledger?.artifact_type || null,
      registry_version: registryRuntime?.version || null
    },
    validation_expectations: {
      status_counts: statusCounts(postChallengeLedger),
      ledger_count: postChallengeLedger.length,
      registry_count: hydratedRows.registry_count,
      consolidated_exposure_findings: sections.exposure_findings.consolidated_findings.length
    }
  };
}
