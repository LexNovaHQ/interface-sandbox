import { makeReportShell, makeSection, REPORT_SECTION_KEYS } from "./reportSectionContract.js";
import { hydrateRegistryReportRows, statusCounts } from "./reportRegistryHydrator.js";
import { synthesizeDiligenceReportSections } from "./reportDiligenceSynthesizer.js";

const asArray = (value) => Array.isArray(value) ? value : [];
const asText = (value, fallback = "") => String(value ?? "").trim() || fallback;
const safeObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const unique = (values = []) => [...new Set(values.map((value) => asText(value)).filter(Boolean))];

function targetName({ companyProfile = {}, targetFeatureProfile = {}, sourceBundle = {} }) {
  const identity = safeObject(companyProfile.identity);
  const targetRef = safeObject(targetFeatureProfile.target_profile_ref);
  return asText(identity.brand_name || identity.legal_name || targetRef.brand_name || targetRef.legal_name || sourceBundle.target_url || sourceBundle.target_domain, "Target not specified");
}

function primaryUrl({ sourceBundle = {}, evidenceJunction = {}, stage7Artifact = {}, stage8Ledger = {} }) {
  return asText(sourceBundle.target_input?.primary_url || sourceBundle.target_url || evidenceJunction.target_input?.primary_url || stage7Artifact.target_url || stage8Ledger.target_url);
}

function reviewedSources({ sourceBundle = {}, targetFeatureProfile = {}, stage6Review = {} }) {
  const docs = asArray(stage6Review.legal_document_cartography?.legal_document_inventory).map((doc) => ({
    source_id: doc.source_record_ref || doc.document_id,
    title: doc.document_title || doc.document_type,
    source_url: doc.source_url || doc.final_url,
    source_type: "Legal/control document evidence",
    evidence_mode: doc.access_status || doc.document_status || "Legal-document evidence"
  }));
  const features = asArray(targetFeatureProfile.feature_inventory).map((feature) => ({
    source_id: feature.feature_id,
    title: feature.feature_name,
    source_url: feature.feature_source_url,
    source_type: "Product / activity evidence",
    evidence_mode: "Feature evidence"
  }));
  const evidence = asArray(sourceBundle.evidence_buffer).map((source, index) => ({
    source_id: source.source_id || source.evidence_source_id || `SRC-${String(index + 1).padStart(3, "0")}`,
    title: source.title || source.source_type || source.source_url || source.url,
    source_url: source.source_url || source.url || source.final_url,
    source_type: source.source_family || source.source_type || "Reviewed evidence",
    evidence_mode: source.evidence_mode || source.coverage_status || source.capture_mode || "Reviewed evidence",
    word_count: source.word_count || null
  }));
  const seen = new Set();
  return evidence.concat(features, docs).filter((source) => {
    const key = source.source_url || source.title || source.source_id;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function buildStage9Report({ stage6Cache, stage7Artifact, stage8Ledger, registryRuntime }) {
  const generatedAt = new Date().toISOString();
  const sourceBundle = stage6Cache?.source_bundle || {};
  const evidenceJunction = stage6Cache?.evidence_junction || {};
  const companyProfile = stage6Cache?.company_profile || stage6Cache?.target_profile_v2 || {};
  const targetFeatureProfile = stage6Cache?.target_feature_profile || {};
  const stage6Review = stage6Cache?.stage6_review || {};
  const postChallengeLedger = asArray(stage8Ledger?.post_challenge_ledger || stage7Artifact?.merged_ledger);
  const hydratedRows = hydrateRegistryReportRows({ registryRuntime, postChallengeLedger });
  const reviewed = reviewedSources({ sourceBundle, targetFeatureProfile, stage6Review });
  const report = makeReportShell({ generated_at: generatedAt });
  const sections = synthesizeDiligenceReportSections({
    targetName: targetName({ companyProfile, targetFeatureProfile, sourceBundle }),
    primaryUrl: primaryUrl({ sourceBundle, evidenceJunction, stage7Artifact, stage8Ledger }),
    sourceBundle,
    companyProfile,
    targetFeatureProfile,
    stage6Review,
    hydratedRows,
    reviewedSources: reviewed,
    stage7Artifact,
    stage8Ledger,
    registryRuntime,
    generatedAt
  });
  for (const key of REPORT_SECTION_KEYS) report.report_data[key] = makeSection(key, sections[key]);
  return {
    artifact_type: "stage9_legal_exposure_report_data_v2",
    stage9_report_version: "stage9_report_v2",
    generated_at: generatedAt,
    report,
    forensic_ledger_appendix: sections.forensic_ledger_appendix,
    platform_diligence_object: sections.platform_diligence_object,
    source_meta: {
      stage7_artifact_type: stage7Artifact?.artifact_type || null,
      stage8_artifact_type: stage8Ledger?.artifact_type || null,
      registry_version: registryRuntime?.version || null,
      source_bundle_version: sourceBundle?.source_bundle_version || sourceBundle?.schema_version || null,
      stage6_review_version: stage6Review?.stage6_review_version || null,
      stage6_component: stage6Review?.stage6_component || null
    },
    validation_expectations: {
      status_counts: statusCounts(postChallengeLedger),
      ledger_count: postChallengeLedger.length,
      registry_count: hydratedRows.registry_count,
      exposure_findings: report.report_data.exposure_findings?.finding_rows?.length || 0,
      exposure_categories: report.report_data.exposure_findings?.exposure_category_groups?.length || 0,
      reviewed_sources: reviewed.length,
      legal_documents: asArray(stage6Review.legal_document_cartography?.legal_document_inventory).length,
      data_flows: asArray(stage6Review.data_provenance_profile?.data_flow_profile).length,
      feature_count: asArray(targetFeatureProfile.feature_inventory).length,
      reviewed_source_families: unique(reviewed.map((source) => source.source_type))
    }
  };
}
