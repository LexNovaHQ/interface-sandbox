import { deriveVaultPrefillFromStage9 } from "./vaultPrefillFromStage9.js";
import { deriveVaultQuestionsFromStage9 } from "./vaultQuestionsFromStage9.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nowIso() {
  return new Date().toISOString();
}

function createId(prefix) {
  const randomPart = globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
  return `${prefix}_${randomPart}`;
}

function getStage9ReportData(stage9ReportData) {
  return stage9ReportData?.report?.report_data
    || stage9ReportData?.report_data
    || stage9ReportData;
}

function getRunId(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  return stage9ReportData?.run_id
    || stage9ReportData?.report?.run_id
    || reportData?.matter_overview?.run_id
    || stage9ReportData?.report_meta?.run_id
    || `run-${Date.now()}`;
}

function getTargetProfile(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const matter = reportData?.matter_overview || {};
  const reportIdentity = matter.report_identity || {};
  const product = reportData?.product_activity_profile || {};
  const targetProfileV2 = reportData?.target_profile_v2 || {};
  const identity = targetProfileV2.identity || {};
  const targetProfileRef = product.target_profile_ref || reportData?.feature_profile_v2?.target_profile_ref || {};
  const productSummary = product.product_summary || {};
  const firstFeature = asArray(product.feature_inventory || reportData?.feature_profile_v2?.feature_inventory)[0] || {};
  const firstProduct = asArray(targetProfileV2?.product_baseline?.products)[0] || {};

  return {
    company_name: reportIdentity.target_or_client
      || matter.target_or_client
      || matter.target
      || identity.legal_name
      || identity.brand_name
      || targetProfileRef.legal_name
      || targetProfileRef.brand_name
      || "Unknown target",
    primary_url: reportIdentity.primary_url
      || matter.primary_url
      || matter.url
      || identity.website
      || identity.domain
      || stage9ReportData?.target_input?.primary_url
      || stage9ReportData?.primary_url
      || "",
    product_name: reportIdentity.product_or_matter
      || matter.product_or_matter
      || matter.product
      || productSummary.product_name
      || productSummary.name
      || firstProduct.product_name
      || firstProduct.name
      || firstFeature.business_label_or_product_area
      || firstFeature.feature_name
      || "Primary product not established from reviewed evidence",
    jurisdictions: reportIdentity.jurisdictions
      || matter.jurisdictions
      || matter.jurisdiction
      || targetProfileV2.jurisdiction?.headquarters
      || targetProfileV2.jurisdiction?.operating_markets
      || "Not established from reviewed public evidence",
    review_mode: reportIdentity.review_mode
      || matter.review_mode
      || "Public-footprint legal exposure diligence",
    evidence_cutoff: matter.evidence_cut_off?.generated_at
      || matter.evidence_cut_off?.evidence_cutoff
      || matter.evidence_cutoff
      || stage9ReportData?.report?.generated_at
      || stage9ReportData?.generated_at
      || new Date().toISOString()
  };
}

function getFeatureMap(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const product = reportData?.product_activity_profile || {};
  const features = reportData?.feature_profile_v2?.feature_inventory || product.feature_inventory || product.feature_map || product.features;
  if (Array.isArray(features)) {
    return features.map((feature, index) => ({
      feature_id: feature.feature_id || `stage9-feature-${index + 1}`,
      feature_name: feature.feature_name || feature.name || `Feature ${index + 1}`,
      feature_role: feature.feature_role || feature.role || "Derived from Stage 9 product activity profile",
      functional_profile: feature.functional_profile || feature.functional_profiles || feature.profile || feature.archetype_codes || "Not established from reviewed evidence",
      risk_surfaces: feature.risk_surfaces || feature.legal_risk_surfaces || feature.surface_tokens || "Not established from reviewed evidence",
      evidence_source: feature.evidence_source || feature.feature_source_url || feature.source_url || ""
    }));
  }

  return asArray(product.active_functional_profiles).map((profile, index) => ({
    feature_id: `stage9-profile-${index + 1}`,
    feature_name: profile.label || profile.profile || profile.code || `Profile ${index + 1}`,
    archetype_code: profile.code || profile.functional_profile || "UNI",
    summary: profile.summary || profile.description || "Derived from Stage 9 product activity profile."
  }));
}

function normalizeFindingSeverity(finding) {
  return finding?.severity?.tier
    || finding?.highest_severity?.tier
    || finding?.severity
    || finding?.highest_tier
    || "UNSPECIFIED";
}

function getRegistryRefs(finding) {
  const explicitRefs = asArray(finding?.supporting_registry_references)
    .filter(Boolean)
    .map(String);
  if (explicitRefs.length) return explicitRefs;

  return asArray(finding?.supporting_registry_items || finding?.supporting_registry_rows || finding?.supporting_items)
    .map((item) => item.registry_reference || item.threat_id || item.id || item)
    .filter(Boolean)
    .map(String);
}

function deriveThreatFindings(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const exposureFindings = reportData?.exposure_findings || {};
  const consolidated = asArray(exposureFindings.consolidated_findings);
  const supportingRows = asArray(exposureFindings.supporting_registry_rows);

  if (consolidated.length) {
    return consolidated.map((finding, index) => {
      const supportingRefs = getRegistryRefs(finding);
      const documentRoutes = asArray(
        finding.affected_documents
          || finding.document_routes
          || finding.remediation_documents
          || finding.affected_documents_controls
      );

      return {
        finding_id: finding.consolidated_finding_id || finding.finding_id || finding.id || `CF-${String(index + 1).padStart(3, "0")}`,
        threat_id: supportingRefs[0] || finding.consolidated_finding_id || finding.finding_id || `CF-${String(index + 1).padStart(3, "0")}`,
        threat_name: finding.exposure_title || finding.title || finding.finding_title || finding.exposure_family || "Consolidated exposure finding",
        linked_feature_ids: asArray(finding.linked_feature_ids),
        document_routes: documentRoutes,
        vault_dependencies: asArray(finding.vault_dependencies),
        severity: normalizeFindingSeverity(finding),
        status: "TRIGGERED",
        consolidated: true,
        supporting_registry_refs: supportingRefs,
        review_ready_summary: finding.finding_statement
          || finding.consolidated_summary
          || finding.assessment
          || finding.summary
          || "Derived from Stage 9 consolidated exposure finding.",
        commercial_deal_impact: finding.commercial_deal_impact || "",
        suggested_remediation_path: finding.suggested_remediation_path || "",
        legal_risk_surfaces: asArray(finding.legal_risk_surfaces),
        functional_profiles: asArray(finding.functional_profiles)
      };
    });
  }

  return supportingRows.map((row, index) => ({
    finding_id: row.finding_id || row.registry_reference || row.threat_id || `ROW-${index + 1}`,
    threat_id: row.registry_reference || row.threat_id || row.id || `ROW-${index + 1}`,
    threat_name: row.exposure_title || row.title || row.threat_name || "Registry exposure item",
    linked_feature_ids: asArray(row.linked_feature_ids),
    document_routes: asArray(row.document_routes || row.affected_documents),
    vault_dependencies: asArray(row.vault_dependencies),
    severity: normalizeFindingSeverity(row),
    status: row.status || row.assessment_outcome || "TRIGGERED",
    consolidated: false,
    supporting_registry_refs: [row.registry_reference || row.threat_id || row.id].filter(Boolean).map(String),
    review_ready_summary: row.status_explanation || row.exposure_mechanism || row.summary || "Derived from Stage 9 supporting registry item.",
    commercial_deal_impact: row.commercial_deal_impact || "",
    suggested_remediation_path: row.suggested_remediation_path || ""
  }));
}

function deriveDocumentStackStatus(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const stack = reportData?.legal_stack_control_review || {};
  const inventory = asArray(stack.document_inventory || stack.legal_stack || stack.documents);
  const coverage = asArray(stack.document_coverage_matrix);

  if (inventory.length) return inventory;

  return coverage.map((item, index) => ({
    document_id: item.document_id || item.document_type || `doc-${index + 1}`,
    document_type: item.document_type || item.label || "Legal document/control area",
    status: item.status || item.coverage_status || item.evidence_status || "review_required",
    controls: asArray(item.controls || item.controls_found || item.covered_controls),
    gaps: asArray(item.gaps || item.gaps_noted || item.control_gaps),
    linked_consolidated_findings: asArray(item.linked_consolidated_findings)
  }));
}

function deriveAssemblyRoute(stage9ReportData) {
  const reportData = getStage9ReportData(stage9ReportData);
  const remediation = reportData?.implications_remediation_path || {};
  const roadmap = asArray(remediation.remediation_roadmap);
  const documentRoutes = asArray(remediation.document_route || remediation.document_routes);
  const controlRoutes = asArray(remediation.control_route || remediation.control_routes);

  return {
    recommended_package: "Review-Ready Remediation Handoff",
    route_basis: "Derived deterministically from Stage 9 Legal Exposure Diligence Report.",
    document_routes: documentRoutes,
    control_routes: controlRoutes,
    remediation_roadmap: roadmap,
    remediation_priority_map: asArray(remediation.remediation_priority_map),
    review_priority: asArray(remediation.review_priority),
    review_ready_handoff_bridge: asArray(remediation.review_ready_handoff_bridge),
    local_counsel_review_required: true
  };
}

function createHandoffEnvelope({ runId, payloadRef, summary, warnings }) {
  const timestamp = nowIso();
  return {
    handoff_id: createId("handoff"),
    run_id: runId,
    source_engine: "diligence",
    target_engine: "assembly",
    payload_type: "assembly_handoff_payload",
    status: "draft",
    created_at: timestamp,
    updated_at: timestamp,
    payload_ref: payloadRef,
    summary,
    warnings: Array.isArray(warnings) ? warnings : [String(warnings)]
  };
}

function createSummary(targetProfile, threatFindings) {
  return `Review-Ready remediation handoff for ${targetProfile.company_name} / ${targetProfile.product_name} (${threatFindings.length} finding route${threatFindings.length === 1 ? "" : "s"}).`;
}

export function assembleStage10VaultHandoff(stage9ReportData, options = {}) {
  const warnings = [];
  const runId = options.runId || getRunId(stage9ReportData);
  const createdAt = options.createdAt || nowIso();
  const targetProfile = getTargetProfile(stage9ReportData);
  const featureMap = getFeatureMap(stage9ReportData);
  const threatFindings = deriveThreatFindings(stage9ReportData);
  const documentStackStatus = deriveDocumentStackStatus(stage9ReportData);
  const vault_prefill_suggestions = deriveVaultPrefillFromStage9(stage9ReportData, warnings);
  const vault_confirmation_questions = deriveVaultQuestionsFromStage9(stage9ReportData);
  const assembly_route_recommendation = deriveAssemblyRoute(stage9ReportData);

  const assembly_handoff = {
    handoff_meta: {
      run_id: runId,
      created_at: createdAt,
      source_engine: "diligence",
      target_engine: "assembly",
      compiler_schema: "stage9-report-data.json",
      assembler_contract: "STAGE_10_STAGE9_TO_NODE_5B_COMPATIBLE_HANDOFF_v1",
      canonical_output_shape: "assembly_handoff_payload"
    },
    target_profile: targetProfile,
    feature_map: featureMap,
    threat_findings: threatFindings,
    document_stack_status: documentStackStatus,
    vault_prefill_suggestions,
    vault_confirmation_questions,
    assembly_route_recommendation,
    warnings
  };

  const pendingPayloadRef = options.payloadRef || "interface_handoff_payloads/pending";
  const handoff_envelope = createHandoffEnvelope({
    runId,
    payloadRef: pendingPayloadRef,
    summary: createSummary(targetProfile, threatFindings),
    warnings
  });

  const payload_ref = pendingPayloadRef === "interface_handoff_payloads/pending"
    ? `interface_handoff_payloads/${handoff_envelope.handoff_id}`
    : pendingPayloadRef;

  return {
    ok: true,
    stage: "10",
    node: "5B_COMPAT_RUNTIME",
    run_id: runId,
    vault_prefill_suggestions,
    assembly_handoff,
    handoff_envelope: {
      ...handoff_envelope,
      payload_ref
    },
    persistence_plan: {
      payload_collection: "interface_handoff_payloads",
      envelope_collection: "interface_handoffs",
      stage_output_path: `interface_runs/${runId}/stage_outputs/stage_10_review_ready_handoff`,
      payload_ref
    },
    warnings
  };
}
