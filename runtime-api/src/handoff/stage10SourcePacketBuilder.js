import { buildStage9ProfileInput } from "../diligence/stage9ProfileInputAdapter.js";

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

function profileInputFrom({ stage9ReportData = {}, stage6Cache = {}, stage7Artifact = {}, stage8Ledger = {}, stage8Export = {}, registryRuntime = {} } = {}) {
  const direct = asObject(stage9ReportData.stage9_profile_input || stage9ReportData.profile_input || stage9ReportData.profiles);
  const directHandoffs = asObject(stage9ReportData.profile_handoffs || direct.profile_handoffs);
  if (Object.keys(direct).length || Object.keys(directHandoffs).length) {
    const targetProfile = asObject(direct.target_profile || directHandoffs.target_profile);
    const targetFeatureProfile = asObject(direct.target_feature_profile || directHandoffs.target_feature_profile);
    const legalCartography = asObject(direct.legal_cartography || directHandoffs.legal_cartography);
    const dataProvenanceProfile = asObject(direct.data_provenance_profile || directHandoffs.data_provenance_profile);
    const exposureProfile = asObject(direct.exposure_profile || directHandoffs.exposure_profile);
    const stage8QualityControlLedger = asObject(direct.stage8_quality_control_ledger || directHandoffs.stage8_quality_control_ledger);
    return {
      profile_input_version: direct.profile_input_version || "stage10_profile_input_direct_v1",
      target_profile: targetProfile,
      target_feature_profile: targetFeatureProfile,
      legal_cartography: legalCartography,
      data_provenance_profile: dataProvenanceProfile,
      exposure_profile: exposureProfile,
      stage8_quality_control_ledger: stage8QualityControlLedger,
      source_bundle: asObject(direct.source_bundle || stage6Cache.source_bundle),
      evidence_junction: asObject(direct.evidence_junction || stage6Cache.evidence_junction),
      compatibility: {
        stage6_cache: {
          ...stage6Cache,
          target_profile: targetProfile,
          company_profile: targetProfile,
          target_feature_profile: targetFeatureProfile,
          legal_cartography: legalCartography,
          data_provenance_profile: dataProvenanceProfile,
          stage6_review: {
            ...(stage6Cache.stage6_review || {}),
            stage6_review_version: stage6Cache.stage6_review?.stage6_review_version || "stage10_profile_compat_review_v1",
            stage6_component: "stage10_profile_compatibility_context",
            legal_document_cartography: legalCartography,
            data_provenance_profile: dataProvenanceProfile
          }
        },
        stage7_artifact: { ...stage7Artifact, exposure_profile: exposureProfile, registry_ledger: exposureProfile.registry_ledger, merged_ledger: exposureProfile.registry_ledger },
        stage8_ledger: { ...stage8Ledger, post_challenge_ledger: exposureProfile.registry_ledger, corrected_count: stage8QualityControlLedger.corrected_count || stage8Ledger.corrected_count || 0 },
        stage8_export: stage8Export
      },
      validation: {
        target_profile_present: Object.keys(targetProfile).length > 0,
        target_feature_profile_present: Object.keys(targetFeatureProfile).length > 0,
        legal_cartography_present: Object.keys(legalCartography).length > 0,
        data_provenance_profile_present: Object.keys(dataProvenanceProfile).length > 0,
        exposure_profile_present: Object.keys(exposureProfile).length > 0,
        exposure_registry_ledger_count: asArray(exposureProfile.registry_ledger).length,
        stage8_quality_control_ledger_present: Object.keys(stage8QualityControlLedger).length > 0
      }
    };
  }
  return buildStage9ProfileInput({ stage6Cache, stage7Artifact, stage8Ledger, stage8Export, registryRuntime });
}

function dataFlowsFromProfile(dataProvenanceProfile = {}) {
  return asArray(
    dataProvenanceProfile.integrated_feature_data_flow_profile ||
      dataProvenanceProfile.data_flow_profile ||
      dataProvenanceProfile.feature_data_flow_profile ||
      dataProvenanceProfile.data_flows
  );
}

function sourceBundleFromProfileInput(profileInput = {}) {
  return asObject(profileInput.source_bundle || profileInput.compatibility?.stage6_cache?.source_bundle);
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

function buildFeatureMap(featureProfile = {}, dataProvenanceProfile = {}) {
  const flowByFeature = new Map();
  for (const flow of dataFlowsFromProfile(dataProvenanceProfile)) {
    const featureRefs = unique([
      flow.feature_id,
      flow.linked_feature_id,
      flow.feature_ref,
      ...asArray(flow.feature_refs),
      ...asArray(flow.linked_feature_refs)
    ]);
    for (const featureRef of featureRefs) {
      if (!flowByFeature.has(featureRef)) flowByFeature.set(featureRef, []);
      flowByFeature.get(featureRef).push(flow.data_flow_id || flow.flow_id || flow.id);
    }
  }

  return asArray(featureProfile.feature_inventory).map((feature, index) => {
    const featureId = asText(feature.feature_id, `feature-${index + 1}`);
    return {
      feature_id: featureId,
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
        ...asArray(featureProfile.data_provenance_map).filter((row) => row.feature_id === featureId).map((row) => row.provenance_id),
        ...asArray(flowByFeature.get(featureId))
      ]),
      evidence_refs: evidenceRefsFrom(feature)
    };
  });
}

function buildLegalDocumentStatus(legalCartography = {}) {
  const cartography = asObject(legalCartography);
  const controlMap = asArray(cartography.document_control_signal_map);
  const mismatchMap = asArray(cartography.document_mismatch_signal_map);
  const index = asArray(cartography.legal_document_index || cartography.legal_unit_source_locator_index);

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
      control_families_detected: unique(index.filter((unit) => unit.document_id === docId).flatMap((unit) => unit.control_families_detected || unit.control_families)),
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

function findingsFromExposureProfile(exposureProfile = {}) {
  const direct = asArray(exposureProfile.exposure_findings || exposureProfile.findings);
  if (direct.length) return direct;
  const ledger = asArray(exposureProfile.registry_ledger);
  return ledger
    .filter((row) => !["NOT_APPLICABLE", "NO_ISSUE_DETECTED"].includes(String(row.final_status || row.assessment_outcome || "").toUpperCase()))
    .map((row) => ({
      finding_id: row.finding_id || row.threat_id || row.Threat_ID,
      category_label: row.risk_domain || row.threat_category || row.category || "Registry exposure",
      finding_title: row.threat_title || row.title || row.registry_issue || row.threat_id || row.Threat_ID,
      severity: row.severity || row.risk_severity || row.final_status || row.assessment_outcome,
      status: row.final_status || row.assessment_outcome,
      linked_feature_ids: row.linked_feature_ids || row.feature_refs,
      linked_data_flow_ids: row.linked_data_flow_ids || row.data_flow_refs,
      linked_legal_unit_ids: row.linked_legal_unit_ids || row.legal_unit_refs,
      document_routes: row.document_routes || row.affected_documents_or_controls,
      appendix_refs: [row.threat_id || row.Threat_ID || row.registry_reference],
      finding_statement: row.finding_statement || row.summary || row.condition_trigger_basis,
      recommended_action: row.recommended_action || row.remediation_hint
    }));
}

function buildThreatFindings(stage9ReportData = {}, exposureProfile = {}) {
  const exposure = sectionBody(stage9ReportData, "exposure_findings");
  const categories = asArray(exposure.exposure_category_groups || exposure.category_groups);
  const findings = asArray(exposure.finding_table || exposure.findings || exposure.consolidated_findings);
  const rows = findings.length
    ? findings
    : categories.flatMap((category) => asArray(category.findings).map((finding) => ({ ...finding, category_label: category.category_label, category_id: category.category_id })));
  const sourceRows = rows.length ? rows : findingsFromExposureProfile(exposureProfile);

  return sourceRows.map((finding, index) => ({
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

function targetSummary({ targetProfile = {}, featureProfile = {}, sourceBundle = {}, stage9ReportData = {} } = {}) {
  return {
    company_name: asText(targetProfile?.identity?.legal_name || targetProfile?.identity?.brand_name, "Unknown target"),
    brand_name: asText(targetProfile?.identity?.brand_name),
    primary_url: primaryUrl({ targetProfile, sourceBundle, stage9ReportData }),
    domain: asText(targetProfile?.identity?.domain),
    product_name: firstProductName(targetProfile, featureProfile),
    jurisdiction: {
      country: asText(targetProfile?.jurisdiction?.registered_or_notice_country || targetProfile?.jurisdiction?.governing_law_country),
      state: asText(targetProfile?.jurisdiction?.registered_or_notice_state || targetProfile?.jurisdiction?.governing_law_state)
    },
    market: asText(targetProfile?.business_model?.market_type_candidate, "unknown"),
    review_mode: "Public-footprint and admitted evidence review",
    evidence_cutoff: evidenceCutoff(stage9ReportData, sourceBundle)
  };
}

export function buildStage10SourcePacket({ stage9ReportData = {}, stage6Cache = {}, stage7Artifact = {}, stage8Ledger = {}, stage8Export = {}, registryRuntime = {}, runId = null } = {}) {
  const profileInput = profileInputFrom({ stage9ReportData, stage6Cache, stage7Artifact, stage8Ledger, stage8Export, registryRuntime });
  const targetProfile = asObject(profileInput.target_profile);
  const featureProfile = asObject(profileInput.target_feature_profile);
  const legalCartography = asObject(profileInput.legal_cartography);
  const dataProvenanceProfile = asObject(profileInput.data_provenance_profile);
  const exposureProfile = asObject(profileInput.exposure_profile);
  const stage8QualityControlLedger = asObject(profileInput.stage8_quality_control_ledger);
  const sBundle = sourceBundleFromProfileInput(profileInput);
  const stage6ReviewCompat = asObject(profileInput.compatibility?.stage6_cache?.stage6_review || {
    stage6_review_version: "stage10_profile_compat_review_v1",
    stage6_component: "stage10_profile_compatibility_context",
    legal_document_cartography: legalCartography,
    data_provenance_profile: dataProvenanceProfile
  });
  const features = buildFeatureMap(featureProfile, dataProvenanceProfile);
  const legalDocumentStatus = buildLegalDocumentStatus(legalCartography);
  const threatFindings = buildThreatFindings(stage9ReportData, exposureProfile);
  const targetProfileSummary = targetSummary({ targetProfile, featureProfile, sourceBundle: sBundle, stage9ReportData });

  return {
    stage10_source_packet_version: "stage10_source_packet_v2",
    source_mode: "profile_handoff_remap_v1",
    profile_input_version: profileInput.profile_input_version || null,
    run_id: asText(runId || stage9ReportData.run_id || stage9ReportData.report?.run_id || stage7Artifact.run_id || stage8Ledger.run_id, `run-${Date.now()}`),
    generated_at: new Date().toISOString(),
    profile_handoffs: {
      target_profile: targetProfile,
      target_feature_profile: featureProfile,
      legal_cartography: legalCartography,
      data_provenance_profile: dataProvenanceProfile,
      exposure_profile: exposureProfile,
      stage8_quality_control_ledger: stage8QualityControlLedger
    },
    profile_input_validation: profileInput.validation || {},
    target_profile_v2: targetProfile,
    feature_profile_v2: featureProfile,
    stage6_review: stage6ReviewCompat,
    legal_cartography: legalCartography,
    data_provenance_profile: dataProvenanceProfile,
    exposure_profile: exposureProfile,
    stage8_quality_control_ledger: stage8QualityControlLedger,
    stage9_report_summary: buildStage9ReportSummary(stage9ReportData),
    exposure_findings: threatFindings,
    evidence_gaps: readStage9Gaps(stage9ReportData),
    remediation_path: readStage9Remediation(stage9ReportData),
    forensic_ledger_appendix: asObject(stage9ReportData.forensic_ledger_appendix || reportData(stage9ReportData).forensic_ledger_appendix),
    platform_diligence_object: asObject(stage9ReportData.platform_diligence_object || stage9ReportData.report?.report_data?.platform_diligence_object),
    source_meta: sourceMeta(stage9ReportData),
    validation_expectations: asObject(stage9ReportData.validation_expectations),
    target_profile: targetProfileSummary,
    target_profile_summary: targetProfileSummary,
    feature_map: features,
    threat_findings: threatFindings,
    legal_document_status: legalDocumentStatus,
    source_materials: { existing_docs_urls: existingDocsUrls(legalDocumentStatus) },
    source_trace: {
      diligence_run_id: asText(runId || stage9ReportData.run_id || stage7Artifact.run_id || stage8Ledger.run_id),
      stage9_report_version: asText(stage9ReportData.stage9_report_version, "stage9_report_v2"),
      stage10_source_packet_version: "stage10_source_packet_v2",
      source_mode: "profile_handoff_remap_v1",
      evidence_cutoff: evidenceCutoff(stage9ReportData, sBundle),
      source_stage_refs: ["target_profile", "target_feature_profile", "legal_cartography", "data_provenance_profile", "exposure_profile", "stage8_quality_control_ledger", "stage9_report_v2"],
      legacy_aliases_retained: ["target_profile_v2", "feature_profile_v2", "stage6_review"],
      mapping_warnings: []
    }
  };
}
