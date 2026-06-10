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

function getRunId(stage9ReportData) {
  return stage9ReportData?.run_id
    || stage9ReportData?.matter_overview?.run_id
    || stage9ReportData?.report_meta?.run_id
    || `run-${Date.now()}`;
}

function getTargetProfile(stage9ReportData) {
  const matter = stage9ReportData?.matter_overview || {};
  const product = stage9ReportData?.product_activity_profile || {};
  const productProfile = product.product_profile || product.target_profile || product;

  return {
    company_name: matter.target || productProfile.company_name || productProfile.company || stage9ReportData?.target_profile?.company_name || "Unknown target",
    primary_url: matter.primary_url || matter.url || stage9ReportData?.target_input?.primary_url || stage9ReportData?.primary_url || "",
    product_name: matter.product || productProfile.product_name || productProfile.name || product.product_name || "Primary product not established from reviewed evidence",
    jurisdictions: matter.jurisdictions || matter.jurisdiction || productProfile.jurisdiction || productProfile.hq_jurisdiction || "Not established from reviewed public evidence",
    review_mode: matter.review_mode || "Public-footprint legal exposure diligence",
    evidence_cutoff: matter.evidence_cutoff || stage9ReportData?.report_meta?.evidence_cutoff || new Date().toISOString()
  };
}

function getFeatureMap(stage9ReportData) {
  const product = stage9ReportData?.product_activity_profile || {};
  const features = product.feature_map || product.features || product.product_feature_map;
  if (Array.isArray(features)) return features;

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

function getRegistryItems(finding) {
  return asArray(finding?.supporting_registry_items || finding?.supporting_registry_rows || finding?.supporting_items);
}

function deriveThreatFindings(stage9ReportData) {
  const consolidated = asArray(stage9ReportData?.exposure_findings?.consolidated_findings);
  const supportingRows = asArray(stage9ReportData?.exposure_findings?.supporting_registry_rows);

  if (consolidated.length) {
    return consolidated.map((finding, index) => {
      const supporting = getRegistryItems(finding);
      const supportingRefs = supporting.map((item) => item.registry_reference || item.threat_id || item.id || item).filter(Boolean).map(String);
      const documentRoutes = asArray(finding.affected_documents || finding.document_routes || finding.remediation_documents);

      return {
        finding_id: finding.finding_id || finding.id || `CF-${String(index + 1).padStart(3, "0")}`,
        threat_id: supportingRefs[0] || finding.finding_id || `CF-${String(index + 1).padStart(3, "0")}`,
        threat_name: finding.title || finding.finding_title || finding.exposure_family || "Consolidated exposure finding",
        linked_feature_ids: asArray(finding.linked_feature_ids),
        document_routes: documentRoutes,
        vault_dependencies: asArray(finding.vault_dependencies),
        severity: normalizeFindingSeverity(finding),
        status: "TRIGGERED",
        consolidated: true,
        supporting_registry_refs: supportingRefs,
        review_ready_summary: finding.finding_statement || finding.assessment || finding.summary || "Derived from Stage 9 consolidated exposure finding."
      };
    });
  }

  return supportingRows.map((row, index) => ({
    finding_id: row.registry_reference || row.threat_id || `ROW-${index + 1}`,
    threat_id: row.registry_reference || row.threat_id || row.id || `ROW-${index + 1}`,
    threat_name: row.exposure_title || row.title || row.threat_name || "Registry exposure item",
    linked_feature_ids: asArray(row.linked_feature_ids),
    document_routes: asArray(row.document_routes || row.affected_documents),
    vault_dependencies: asArray(row.vault_dependencies),
    severity: normalizeFindingSeverity(row),
    status: row.status || "TRIGGERED",
    consolidated: false,
    supporting_registry_refs: [row.registry_reference || row.threat_id || row.id].filter(Boolean).map(String),
    review_ready_summary: row.status_explanation || row.exposure_mechanism || row.summary || "Derived from Stage 9 supporting registry item."
  }));
}

function deriveDocumentStackStatus(stage9ReportData) {
  const stack = stage9ReportData?.legal_stack_control_review || {};
  const inventory = asArray(stack.document_inventory || stack.legal_stack || stack.documents);
  const coverage = asArray(stack.document_coverage_matrix);

  if (inventory.length) return inventory;

  return coverage.map((item, index) => ({
    document_id: item.document_id || item.document_type || `doc-${index + 1}`,
    document_type: item.document_type || item.label || "Legal document/control area",
    status: item.status || item.coverage_status || "review_required",
    controls: asArray(item.controls || item.covered_controls),
    gaps: asArray(item.gaps || item.control_gaps)
  }));
}

function deriveAssemblyRoute(stage9ReportData) {
  const remediation = stage9ReportData?.implications_remediation_path || {};
  const roadmap = asArray(remediation.remediation_roadmap);
  const documentRoutes = asArray(remediation.document_route || remediation.document_routes);
  const controlRoutes = asArray(remediation.control_route || remediation.control_routes);

  return {
    recommended_package: "Review-Ready Remediation Handoff",
    route_basis: "Derived deterministically from Stage 9 Legal Exposure Diligence Report.",
    document_routes: documentRoutes,
    control_routes: controlRoutes,
    remediation_roadmap: roadmap,
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
