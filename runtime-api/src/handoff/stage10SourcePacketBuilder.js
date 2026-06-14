function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function unique(values = []) {
  return [...new Set(asArray(values).map((value) => asText(value)).filter(Boolean))];
}

function reportData(stage9ReportData = {}) {
  return asObject(stage9ReportData?.report?.report_data || stage9ReportData?.report_data || {});
}

function sectionBody(stage9ReportData = {}, key) {
  const section = reportData(stage9ReportData)[key];
  if (!section || typeof section !== "object") return {};
  const { key: _key, heading: _heading, content_contract: _contract, ...body } = section;
  return body;
}

function sourceMeta(stage9ReportData = {}) {
  return asObject(stage9ReportData.source_meta || stage9ReportData.report?.source_meta);
}

function firstProductName(targetProfile = {}, featureProfile = {}) {
  const products = asArray(targetProfile?.product_baseline?.products);
  const product = products[0] || {};
  const features = asArray(featureProfile?.feature_inventory);
  return asText(
    product.name ||
      product.product_name ||
      product.description ||
      features[0]?.business_label_or_product_area ||
      features[0]?.feature_name,
    "Primary product not established from reviewed evidence"
  );
}

function primaryUrl({ targetProfile = {}, sourceBundle = {}, stage9ReportData = {} } = {}) {
  const matter = sectionBody(stage9ReportData, "matter_overview");
  return asText(
    matter?.matter_identity?.website ||
      matter?.matter_identity?.primary_url ||
      targetProfile?.identity?.website ||
      targetProfile?.identity?.domain ||
      sourceBundle?.target_input?.primary_url ||
      sourceBundle?.target_url ||
      sourceBundle?.target_domain
  );
}

function targetProfileV2(stage6Cache = {}, stage9ReportData = {}) {
  return asObject(
    stage6Cache.company_profile ||
      stage6Cache.target_profile_v2 ||
      stage9ReportData.target_profile_v2 ||
      stage9ReportData.stage10_source_packet?.target_profile_v2
  );
}

function featureProfileV2(stage6Cache = {}, stage9ReportData = {}) {
  return asObject(
    stage6Cache.target_feature_profile ||
      stage6Cache.feature_profile_v2 ||
      stage9ReportData.feature_profile_v2 ||
      stage9ReportData.stage10_source_packet?.feature_profile_v2
  );
}

function stage6Review(stage6Cache = {}, stage9ReportData = {}) {
  return asObject(
    stage6Cache.stage6_review ||
      stage6Cache.stage6_integrated_artifact?.stage6_review ||
      stage9ReportData.stage6_review ||
      stage9ReportData.stage10_source_packet?.stage6_review
  );
}

function sourceBundle(stage6Cache = {}) {
  return asObject(stage6Cache.source_bundle);
}

function evidenceRefsFrom(value) {
  if (!value || typeof value !== "object") return [];
  return unique([
    ...asArray(value.evidence_refs),
    ...asArray(value.source_refs),
    ...asArray(value.field_evidence_refs),
    value.evidence_ref,
    value.source_record_ref,
    value.feature_source_url,
    value.source_url
  ]);
}

function buildFeatureMap(featureProfile = {}, s6Review = {}) {
  const flowByFeature = new Map();
  for (const flow of asArray(s6Review?.data_provenance_profile?.data_flow_profile)) {
    if (!flow?.feature_id) continue;
    if (!flowByFeature.has(flow.feature_id)) flowByFeature.set(flow.feature_id, []);
    flowByFeature.get(flow.feature_id).push(flow.data_flow_id);
  }

  return asArray(featureProfile.feature_inventory).map((feature, index) => ({
    feature_id: asText(feature.feature_id, `feature-${index + 1}`),
    feature_name: asText(feature.feature_name, `Feature ${index + 1}`),
    feature_role: asText(feature.feature_role, "unknown"),
    commercial_function: asText(feature.commercial_function),
    business_label_or_product_area: asText(feature.business_label_or_product_area),
    actor_or_user: asText(feature.actor_or_user),
    system_action: asText(feature.system_action),
    output_or_result: asText(feature.output_or_result),
    autonomy_level: asText(feature.autonomy_level, "unknown"),
    human_review_signal: asText(feature.human_review_signal, "unknown"),
    external_action_signal: asText(feature.external_action_signal, "unknown"),
    delivery_channels: asObject(feature.delivery_channels),
    archetype_codes: unique(feature.archetype_codes),
    archetype_labels: unique(feature.archetype_labels),
    surface_tokens: unique(feature.surface_tokens),
    data_provenance_refs: unique([
      ...asArray(feature.data_provenance).map((row) => row.provenance_id),
      ...asArray(featureProfile.data_provenance_map).filter((row) => row.feature_id === feature.feature_id).map((row) => row.provenance_id),
      ...asArray(flowByFeature.get(feature.feature_id))
    ]),
    evidence_refs: evidenceRefsFrom(feature)
  }));
}

function buildLegalDocumentStatus(s6Review = {}) {
  const cartography = asObject(s6Review.legal_document_cartography);
  const controlMap = asArray(cartography.document_control_signal_map);
  const mismatchMap = asArray(cartography.document_mismatch_signal_map);
  const index = asArray(cartography.legal_document_index);

  return asArray(cartography.legal_document_inventory).map((doc, indexNumber) => {
    const docId = asText(doc.document_id, `legal-doc-${indexNumber + 1}`);
    return {
      document_id: docId,
      document_type: asText(doc.document_type, "unknown"),
      document_family: asText(doc.document_family, "unknown"),
      document_title: asText(doc.document_title, docId),
      document_status: asText(doc.document_status, "unknown"),
      access_status: asText(doc.access_status, "unknown"),
      source_url: asText(doc.source_url || doc.final_url),
      jurisdiction_scope: asArray(doc.jurisdiction_scope),
      control_families_detected: unique(index.filter((unit) => unit.document_id === docId).flatMap((unit) => unit.control_families_detected)),
      control_signals: controlMap.filter((control) => control.document_id === docId),
      mismatch_signals: mismatchMap.filter((mismatch) => mismatch.expected_ref === docId || mismatch.actual_ref === docId),
      linked_exposure_finding_ids: [],
      linked_data_flow_ids: unique(index.filter((unit) => unit.document_id === docId).flatMap((unit) => unit.data_flow_refs)),
      assembly_document_route: []
    };
  });
}

function appendixRefsFromFinding(finding = {}) {
  return unique([
    finding.finding_id,
    finding.category_id,
    ...asArray(finding.appendix_refs),
    ...asArray(finding.supporting_registry_references),
    ...asArray(finding.supporting_registry_rows).map((row) => row.appendix_ref || row.registry_reference || row.threat_id),
    ...asArray(finding.representative_items).map((row) => row.appendix_ref || row.registry_reference || row.threat_id)
  ]);
}

function buildThreatFindings(stage9ReportData = {}) {
  const exposure = sectionBody(stage9ReportData, "exposure_findings");
  const categories = asArray(exposure.exposure_category_groups || exposure.category_groups);
  const findings = asArray(exposure.finding_table || exposure.findings || exposure.consolidated_findings);
  const rows = findings.length
    ? findings
    : categories.flatMap((category) => asArray(category.findings).map((finding) => ({ ...finding, category_label: category.category_label, category_id: category.category_id })));

  return rows.map((finding, index) => ({
    finding_id: asText(finding.finding_id || finding.consolidated_finding_id, `FIND-${String(index + 1).padStart(3, "0")}`),
    category_label: asText(finding.category_label || finding.exposure_category || finding.exposure_title, "Uncategorised exposure"),
    finding_title: asText(finding.finding_title || finding.exposure_title || finding.title, "Exposure finding"),
    severity: finding.severity || finding.highest_severity || "unknown",
    legal_pain: asText(finding.legal_pain || finding.legal_significance),
    business_pain: asText(finding.business_pain || finding.commercial_deal_impact),
    status: asText(finding.status || finding.assessment_outcome || "identified_exposure"),
    linked_feature_ids: unique(finding.linked_feature_ids || finding.affected_feature_refs),
    linked_data_flow_ids: unique(finding.linked_data_flow_ids || finding.affected_data_flow_refs),
    linked_legal_unit_ids: unique(finding.linked_legal_unit_ids || finding.affected_legal_unit_refs),
    document_routes: unique(finding.document_routes || finding.affected_documents || finding.affected_documents_or_controls),
    control_routes: unique(finding.control_routes || finding.affected_controls),
    vault_dependencies: unique(finding.vault_dependencies),
    appendix_refs: appendixRefsFromFinding(finding),
    review_ready_summary: asText(finding.finding_statement || finding.summary || finding.consolidated_summary),
    recommended_action: asText(finding.recommended_action || finding.suggested_remediation_path)
  }));
}

function readStage9Remediation(stage9ReportData = {}) {
  return sectionBody(stage9ReportData, "implications_remediation_path");
}

function readStage9Gaps(stage9ReportData = {}) {
  return sectionBody(stage9ReportData, "evidence_gaps_clarification_points");
}

function existingDocsUrls(legalDocumentStatus = []) {
  return unique(legalDocumentStatus.map((doc) => doc.source_url).filter(Boolean));
}

function evidenceCutoff(stage9ReportData = {}, stage6Cache = {}) {
  const matter = sectionBody(stage9ReportData, "matter_overview");
  return asText(
    matter?.evidence_cutoff?.generated_at ||
      matter?.evidence_cutoff?.evidence_basis ||
      stage9ReportData.generated_at ||
      stage6Cache.generated_at
  );
}

function buildStage9ReportSummary(stage9ReportData = {}) {
  return {
    artifact_type: asText(stage9ReportData.artifact_type),
    stage9_report_version: asText(stage9ReportData.stage9_report_version),
    generated_at: asText(stage9ReportData.generated_at),
    report_title: asText(stage9ReportData.report?.report_title),
    report_status: asText(stage9ReportData.report?.report_status)
  };
}

export function buildStage10SourcePacket({ stage9ReportData = {}, stage6Cache = {}, stage7Artifact = {}, stage8Ledger = {}, runId = null } = {}) {
  const targetProfile = targetProfileV2(stage6Cache, stage9ReportData);
  const featureProfile = featureProfileV2(stage6Cache, stage9ReportData);
  const s6Review = stage6Review(stage6Cache, stage9ReportData);
  const sBundle = sourceBundle(stage6Cache);
  const features = buildFeatureMap(featureProfile, s6Review);
  const legalDocumentStatus = buildLegalDocumentStatus(s6Review);
  const threatFindings = buildThreatFindings(stage9ReportData);

  return {
    stage10_source_packet_version: "stage10_source_packet_v2",
    run_id: asText(runId || stage9ReportData.run_id || stage9ReportData.report?.run_id || stage7Artifact.run_id || stage8Ledger.run_id, `run-${Date.now()}`),
    generated_at: new Date().toISOString(),
    target_profile_v2: targetProfile,
    feature_profile_v2: featureProfile,
    stage6_review: s6Review,
    stage9_report_summary: buildStage9ReportSummary(stage9ReportData),
    exposure_findings: threatFindings,
    evidence_gaps: readStage9Gaps(stage9ReportData),
    remediation_path: readStage9Remediation(stage9ReportData),
    forensic_ledger_appendix: asObject(stage9ReportData.forensic_ledger_appendix || reportData(stage9ReportData).forensic_ledger_appendix),
    platform_diligence_object: asObject(stage9ReportData.platform_diligence_object || stage9ReportData.report?.report_data?.platform_diligence_object),
    source_meta: sourceMeta(stage9ReportData),
    validation_expectations: asObject(stage9ReportData.validation_expectations),
    target_profile: {
      company_name: asText(targetProfile?.identity?.legal_name || targetProfile?.identity?.brand_name, "Unknown target"),
      brand_name: asText(targetProfile?.identity?.brand_name),
      primary_url: primaryUrl({ targetProfile, sourceBundle: sBundle, stage9ReportData }),
      domain: asText(targetProfile?.identity?.domain),
      product_name: firstProductName(targetProfile, featureProfile),
      jurisdiction: {
        country: asText(targetProfile?.jurisdiction?.registered_or_notice_country || targetProfile?.jurisdiction?.governing_law_country),
        state: asText(targetProfile?.jurisdiction?.registered_or_notice_state || targetProfile?.jurisdiction?.governing_law_state)
      },
      market: asText(targetProfile?.business_model?.market_type_candidate, "unknown"),
      review_mode: "Public-footprint and admitted evidence review",
      evidence_cutoff: evidenceCutoff(stage9ReportData, stage6Cache)
    },
    feature_map: features,
    threat_findings: threatFindings,
    legal_document_status: legalDocumentStatus,
    source_materials: { existing_docs_urls: existingDocsUrls(legalDocumentStatus) },
    source_trace: {
      diligence_run_id: asText(runId || stage9ReportData.run_id || stage7Artifact.run_id || stage8Ledger.run_id),
      stage9_report_version: asText(stage9ReportData.stage9_report_version, "stage9_report_v2"),
      stage10_source_packet_version: "stage10_source_packet_v2",
      evidence_cutoff: evidenceCutoff(stage9ReportData, stage6Cache),
      source_stage_refs: ["target_profile_v2", "feature_profile_v2", "stage6_review", "stage9_report_v2", "stage8_post_challenge_ledger"],
      mapping_warnings: []
    }
  };
}
