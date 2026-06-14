import { sanitizeVisibleText, toDocumentRouteLabel, toFunctionalProfileLabel } from "./reportLegalLanguage.js";
import { displayControlOutcome, displayLane, displayStatus, displayVelocity } from "./reportTerminologyMap.js";

const asArray = (value) => Array.isArray(value) ? value : [];
const asText = (value, fallback = "") => String(value ?? "").trim() || fallback;
const safeObject = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const unique = (values = []) => [...new Set(asArray(values).flat().map((value) => asText(value)).filter(Boolean))];

function humanText(value, fallback = "Not specified in reviewed evidence") {
  let text = sanitizeVisibleText(asText(value, fallback));
  text = text
    .replace(/\bLegal Exposure Registry\b/gi, "review framework")
    .replace(/\bregistry row(s)?\b/gi, "review item$1")
    .replace(/\bregistry item(s)?\b/gi, "review item$1")
    .replace(/\bregistry reference(s)?\b/gi, "appendix row reference$1")
    .replace(/\bRegistry Reference(s)?\b/g, "Appendix Row Reference$1")
    .replace(/\bthreat id\b/gi, "appendix row reference")
    .replace(/\bHunter Trigger\b/gi, "applicability basis")
    .replace(/\bOperator Challenge\b/g, "Quality Review")
    .replace(/\bRegistry Evaluation\b/g, "Issue-Spotting Review")
    .replace(/\bVault\b/g, "delivery workspace")
    .replace(/\bNode 5B\b/g, "assembly workflow");
  return text.replace(/\s+/g, " ").trim();
}

function appendixRef(prefix, index) {
  return `APP-${prefix}-${String(index + 1).padStart(3, "0")}`;
}

function sourceId(source, index) {
  return asText(source?.source_id || source?.evidence_source_id || source?.source_record_ref || source?.id, `SRC-${String(index + 1).padStart(3, "0")}`);
}

function severityForMain(severity = {}) {
  const tier = asText(severity?.tier || severity?.raw);
  const category = humanText(severity?.category || severity?.label || "Review priority not specified");
  const depth = humanText(severity?.depth || "Matter-specific severity depends on customer profile, jurisdiction, and non-public controls.");
  const labelByTier = {
    T1: "Critical business-continuity / prohibited-risk issue",
    T2: "Material financial or customer-approval risk",
    T3: "Deal-blocking / customer approval risk",
    T4: "Regulatory remediation / enforcement attention",
    T5: "Governance friction / monitoring item"
  };
  return {
    priority_label: labelByTier[tier] || category,
    exposure_category: category,
    priority_explanation: depth
  };
}

function priorityForMain(severity = {}, timing = {}) {
  const tier = asText(severity?.tier);
  const rawTiming = asText(timing?.raw || timing?.label);
  if (["T1", "T2"].includes(tier) || rawTiming === "ACTIVE_NOW") return "Immediate counsel review / pre-signing or pre-launch check";
  if (["T3", "T4"].includes(tier) || rawTiming === "THIS_YEAR") return "Customer readiness / enterprise approval review";
  return "Governance maturity / monitoring review";
}

function functionalProfileLabel(value, fallback = "Functional profile not specified") {
  if (Array.isArray(value)) return unique(value.map((item) => functionalProfileLabel(item))).join(", ") || fallback;
  if (value && typeof value === "object") return humanText(toFunctionalProfileLabel(value.label || value.code || value.from_id), fallback);
  return humanText(toFunctionalProfileLabel(value), fallback);
}

function documentLabel(value) {
  return humanText(toDocumentRouteLabel(value), "Relevant document / control area");
}

function buildFeatureLookup(targetFeatureProfile = {}) {
  return new Map(asArray(targetFeatureProfile.feature_inventory).map((feature) => [asText(feature?.feature_id), feature]).filter(([key]) => key));
}

function buildRouteMap(stage7Artifact = {}) {
  return new Map(asArray(stage7Artifact.route_records).map((route) => [asText(route?.threat_id), route]).filter(([key]) => key));
}

function buildSourceRows({ sourceBundle = {}, reviewedSources = [], targetFeatureProfile = {}, stage6Review = {}, hydratedRows = {} }) {
  const raw = [];
  raw.push(...asArray(sourceBundle?.evidence_buffer));
  raw.push(...asArray(sourceBundle?.source_review?.source_records));
  raw.push(...asArray(sourceBundle?.raw_footprint?.source_records));
  raw.push(...asArray(reviewedSources));
  const seen = new Set();
  const sources = raw.map((source, index) => {
    const ref = sourceId(source, index);
    const url = asText(source?.source_url || source?.url || source?.final_url);
    const key = `${ref}|${url}|${asText(source?.title)}`;
    if (!ref && !url) return null;
    if (seen.has(key)) return null;
    seen.add(key);
    return {
      source_ref: ref,
      source_family: humanText(source?.source_family || source?.source_type || "Reviewed evidence"),
      url,
      final_url: asText(source?.final_url || source?.source_url || source?.url),
      title: humanText(source?.title || source?.document_title || source?.source_type || url || ref),
      capture_status: humanText(source?.capture_status || source?.evidence_mode || source?.access_status || "Reviewed"),
      coverage_status: humanText(source?.coverage_status || source?.quality?.coverage_status || "Coverage not separately classified"),
      word_count: source?.word_count || source?.text?.word_count || null,
      text_hash: asText(source?.clean_text_sha256 || source?.text_hash || source?.sha256),
      source_limitation: humanText(source?.limitation || source?.coverage_note || source?.quality?.note || "No source-specific limitation recorded."),
      linked_feature_refs: [],
      linked_data_flow_refs: [],
      linked_legal_document_refs: [],
      linked_exposure_refs: []
    };
  }).filter(Boolean);
  const byRef = new Map(sources.map((source) => [source.source_ref, source]));
  const byUrl = new Map(sources.map((source) => [source.url, source]).filter(([url]) => url));
  for (const feature of asArray(targetFeatureProfile.feature_inventory)) {
    const refs = unique([feature.feature_source_ref, feature.source_record_ref, feature.feature_source_url, feature.source_url, ...asArray(feature.evidence_refs)]);
    for (const ref of refs) {
      const target = byRef.get(ref) || byUrl.get(ref);
      if (target) target.linked_feature_refs = unique([...target.linked_feature_refs, feature.feature_id]);
    }
  }
  for (const flow of asArray(stage6Review?.data_provenance_profile?.data_flow_profile)) {
    for (const ref of unique(asArray(flow.source_refs))) {
      const target = byRef.get(ref) || byUrl.get(ref);
      if (target) target.linked_data_flow_refs = unique([...target.linked_data_flow_refs, flow.data_flow_id]);
    }
  }
  for (const doc of asArray(stage6Review?.legal_document_cartography?.legal_document_inventory)) {
    for (const ref of unique([doc.source_record_ref, doc.source_url, doc.final_url, ...asArray(doc.source_refs)])) {
      const target = byRef.get(ref) || byUrl.get(ref);
      if (target) target.linked_legal_document_refs = unique([...target.linked_legal_document_refs, doc.document_id || doc.document_type]);
    }
  }
  for (const item of asArray(hydratedRows.rows)) {
    const refs = unique([item.reviewed_evidence?.evidence_reference, ...asArray(item.reviewed_evidence?.feature_references)]);
    for (const ref of refs) {
      const target = byRef.get(ref) || byUrl.get(ref);
      if (target) target.linked_exposure_refs = unique([...target.linked_exposure_refs, item.registry_reference]);
    }
  }
  return sources;
}

function buildFeatureLedger(targetFeatureProfile = {}) {
  return asArray(targetFeatureProfile.feature_inventory).map((feature, index) => ({
    appendix_ref: appendixRef("FEAT", index),
    feature_ref: asText(feature.feature_id, `FEATURE-${index + 1}`),
    feature_name: humanText(feature.feature_name, "Unnamed feature"),
    feature_description: humanText(feature.feature_description || feature.description),
    feature_role: humanText(feature.feature_role || feature.role),
    commercial_function: humanText(feature.commercial_function),
    product_area: humanText(feature.business_label_or_product_area || feature.product_area),
    user_or_actor: humanText(feature.actor_or_user),
    input_data_categories: asArray(feature.input_data).map(humanText),
    system_action: humanText(feature.system_action),
    output_or_result: humanText(feature.output_or_result),
    autonomy_level: humanText(feature.autonomy_level),
    human_review_signal: humanText(feature.human_review_signal),
    external_action_signal: humanText(feature.external_action_signal),
    delivery_channels: asArray(feature.delivery_channels).map(humanText),
    triggering_ai_function: unique(asArray(feature.archetype_labels).concat(asArray(feature.archetype_codes)).map((item) => functionalProfileLabel(item))).join(", ") || "Functional profile not specified",
    archetype_codes: asArray(feature.archetype_codes),
    archetype_provenance: asArray(feature.archetype_provenance),
    legal_risk_surfaces: asArray(feature.surface_tokens).map(humanText),
    surface_provenance: asArray(feature.surface_provenance),
    source_url: asText(feature.feature_source_url || feature.source_url),
    evidence_refs: asArray(feature.evidence_refs),
    confidence: humanText(feature.confidence || feature.feature_confidence || "Not specified upstream"),
    limitations: asArray(feature.limitations).map(humanText)
  }));
}

function buildFeatureMainTable(featureLedger = []) {
  return featureLedger.map((row) => ({
    feature_reference: `${row.feature_ref} (*)`,
    product_function: [row.feature_name, row.commercial_function, row.product_area].filter(Boolean).join(" — ") || "Product function not specified",
    triggering_ai_function: row.triggering_ai_function,
    input_output_pattern: {
      input_data_categories: row.input_data_categories,
      system_action: row.system_action,
      output_or_result: row.output_or_result
    },
    autonomy_and_human_review: [row.autonomy_level, row.human_review_signal, row.external_action_signal].filter(Boolean).join("; ") || "Autonomy / human-review posture not specified in reviewed evidence.",
    legal_risk_surface: row.legal_risk_surfaces,
    evidence_provenance: `See Appendix B (${row.appendix_ref}) and Appendix A for full source provenance.`
  }));
}

function buildDataLedger(stage6Review = {}) {
  return asArray(stage6Review?.data_provenance_profile?.data_flow_profile).map((flow, index) => ({
    appendix_ref: appendixRef("DATA", index),
    data_flow_ref: asText(flow.data_flow_id, `DATA-${index + 1}`),
    linked_feature_ref: asText(flow.feature_id),
    data_subject: flow.data_subject || {},
    data_category: flow.data_category || {},
    processing_actions: asArray(flow.processing?.processing_actions),
    processing_purpose: asArray(flow.processing?.processing_purpose),
    role_allocation: flow.role_allocation || {},
    regime_relevance: flow.regime_relevance || {},
    notice_position: flow.notice || {},
    consent_or_basis_position: flow.consent_basis || {},
    rights_position: flow.rights || {},
    processor_chain: flow.processor_chain || {},
    transfer_location: flow.transfer_location || {},
    retention_deletion_position: flow.retention_deletion_ai || {},
    security_accountability_position: flow.security_accountability || {},
    source_refs: asArray(flow.source_refs),
    confidence: humanText(flow.confidence || "Not specified upstream"),
    limitations: asArray(flow.limitations).map(humanText)
  }));
}

function buildDataMainTable(dataLedger = [], featureLookup = new Map()) {
  return dataLedger.map((row) => {
    const feature = featureLookup.get(row.linked_feature_ref) || {};
    return {
      data_flow_reference: `${row.data_flow_ref} (*)`,
      linked_product_function: humanText(feature.feature_name || row.linked_feature_ref || "Linked product function not specified"),
      data_subject_and_category: humanText([JSON.stringify(row.data_subject), JSON.stringify(row.data_category)].filter(Boolean).join("; ")),
      processing_purpose_and_action: humanText([row.processing_actions.join(", "), row.processing_purpose.join(", ")].filter(Boolean).join("; ")),
      role_and_provider_chain: humanText([JSON.stringify(row.role_allocation), JSON.stringify(row.processor_chain)].filter(Boolean).join("; ")),
      transfer_retention_security_position: humanText([JSON.stringify(row.transfer_location), JSON.stringify(row.retention_deletion_position), JSON.stringify(row.security_accountability_position)].filter(Boolean).join("; ")),
      control_or_gap_position: humanText([JSON.stringify(row.notice_position), JSON.stringify(row.consent_or_basis_position), JSON.stringify(row.rights_position)].filter(Boolean).join("; ")),
      appendix_provenance: `See Appendix C (${row.appendix_ref}) and Appendix A for full source provenance.`
    };
  });
}

function buildLegalLedger(stage6Review = {}) {
  const cartography = safeObject(stage6Review.legal_document_cartography);
  const docs = asArray(cartography.legal_document_inventory).map((doc, index) => ({
    appendix_ref: appendixRef("LEGAL-DOC", index),
    row_type: "document",
    document_ref: asText(doc.document_id || doc.source_record_ref, `DOC-${index + 1}`),
    document_type: documentLabel(doc.document_type || doc.type),
    document_title: humanText(doc.document_title || doc.title || doc.document_type),
    document_status: humanText(doc.document_status || "unknown"),
    access_status: humanText(doc.access_status || "unknown"),
    source_url: asText(doc.source_url || doc.final_url),
    final_url: asText(doc.final_url || doc.source_url),
    jurisdiction_scope: asArray(doc.jurisdiction_scope).map(humanText),
    source_refs: unique([doc.source_record_ref, doc.source_url, doc.final_url, ...asArray(doc.source_refs)]),
    confidence: humanText(doc.confidence || "Not specified upstream"),
    limitations: asArray(doc.limitations).map(humanText)
  }));
  const controls = asArray(cartography.document_control_signal_map).map((signal, index) => ({
    appendix_ref: appendixRef("LEGAL-CTRL", index),
    row_type: "control_signal",
    control_signal_ref: asText(signal.control_signal_id, `CTRL-${index + 1}`),
    document_ref: asText(signal.document_id),
    legal_unit_ref: asText(signal.legal_unit_id),
    control_family: humanText(signal.control_family),
    control_signal: humanText(signal.control_signal),
    linked_feature_refs: asArray(signal.feature_refs),
    linked_data_flow_refs: asArray(signal.data_flow_refs || signal.data_flow_ids),
    source_refs: asArray(signal.source_refs),
    confidence: humanText(signal.confidence || "Not specified upstream")
  }));
  const gaps = asArray(cartography.document_mismatch_signal_map).map((gap, index) => ({
    appendix_ref: appendixRef("LEGAL-GAP", index),
    row_type: "gap_or_mismatch",
    gap_ref: asText(gap.mismatch_id || gap.gap_id, `GAP-${index + 1}`),
    document_ref: asText(gap.document_id),
    legal_unit_ref: asText(gap.legal_unit_id),
    gap_type: humanText(gap.gap_type || gap.control_family || gap.mismatch_type),
    gap_signal: humanText(gap.mismatch_signal || gap.gap_signal || gap.signal),
    linked_feature_refs: asArray(gap.feature_refs),
    linked_data_flow_refs: asArray(gap.data_flow_refs || gap.data_flow_ids),
    source_refs: asArray(gap.source_refs),
    confidence: humanText(gap.confidence || "Not specified upstream")
  }));
  return { documents: docs, controls, gaps, rows: [...docs, ...controls, ...gaps] };
}

function buildLegalMainTable(legalLedger = {}, exposureRows = []) {
  const rows = [];
  const linkedFindingsFor = (refs = []) => unique(asArray(exposureRows).filter((finding) => asArray(finding.affected_documents_or_controls).some((item) => refs.some((ref) => humanText(item).toLowerCase().includes(humanText(ref).toLowerCase())))).map((finding) => finding.finding_reference || finding.finding_id));
  for (const doc of asArray(legalLedger.documents)) {
    const controls = asArray(legalLedger.controls).filter((control) => control.document_ref === doc.document_ref);
    const gaps = asArray(legalLedger.gaps).filter((gap) => gap.document_ref === doc.document_ref);
    rows.push({
      document_or_control_reference: `${doc.document_ref} (*)`,
      document_or_control_area: [doc.document_type, doc.document_title].filter(Boolean).join(" — ") || "Legal document / control area",
      public_evidence_status: [doc.document_status, doc.access_status].filter(Boolean).join("; ") || "Evidence status not specified",
      control_signal: controls.map((control) => control.control_signal).filter(Boolean).join("; ") || "No specific public/admitted control signal recorded for this document.",
      gap_or_mismatch: gaps.map((gap) => gap.gap_signal).filter(Boolean).join("; ") || "No document-specific gap recorded in upstream legal review.",
      linked_exposure_findings: linkedFindingsFor([doc.document_type, doc.document_title]),
      counsel_review_point: `Counsel should review ${doc.document_type || doc.document_title || "this document/control area"} against linked findings and non-public contract/control evidence.`,
      appendix_provenance: `See Appendix D (${doc.appendix_ref}) and Appendix A for full source provenance.`
    });
  }
  return rows;
}

function routeReasonLabel(reason) {
  const normalized = asText(reason).toUpperCase();
  if (normalized === "UNI_ALWAYS_RUN") return "Universal review item";
  if (normalized === "STAGE5_INT_TRIGGERED") return "Triggered by active product/function evidence";
  if (normalized === "CONDITIONAL_DOC_REVIEW") return "Triggered by legal/governance document-review route";
  if (normalized === "INT_NOT_TRIGGERED") return "Outside current active product/function route";
  return humanText(reason || "Route not specified");
}

function triggeringFunctionFor(item = {}, route = {}, featureLookup = new Map()) {
  if (route?.route_reason === "CONDITIONAL_DOC_REVIEW") return "Legal / governance artifact review";
  if (route?.route_reason === "UNI_ALWAYS_RUN") return "General Applicability";
  const candidates = [];
  if (route?.archetype) candidates.push(route.archetype);
  if (item.functional_profile?.label || item.functional_profile?.code) candidates.push(item.functional_profile);
  for (const ref of asArray(item.reviewed_evidence?.feature_references)) {
    const feature = featureLookup.get(ref);
    candidates.push(...asArray(feature?.archetype_labels), ...asArray(feature?.archetype_codes));
  }
  return unique(candidates.map((candidate) => functionalProfileLabel(candidate))).join(", ") || "Functional profile not specified";
}

function exposureAppendixRefById(exposureLedger = []) {
  return new Map(exposureLedger.map((row) => [asText(row.threat_id || row.registry_row_id), row.appendix_ref]).filter(([id]) => id));
}

function buildExposureLedger({ hydratedRows = {}, stage7Artifact = {}, stage8Ledger = {}, registryRuntime = {}, featureLookup = new Map() }) {
  const routeMap = buildRouteMap(stage7Artifact);
  const correctionMeta = new Map(asArray(stage8Ledger?.correction_meta).map((item) => [asText(item?.threat_id || item?.registry_reference), item]).filter(([id]) => id));
  return asArray(hydratedRows.rows).map((item, index) => {
    const route = routeMap.get(item.registry_reference) || {};
    const correction = correctionMeta.get(item.registry_reference) || null;
    return {
      appendix_ref: appendixRef("EXP", index),
      entry_number: item.entry_number ?? index + 1,
      threat_id: item.registry_reference,
      registry_row_id: item.registry_reference,
      exposure_title: humanText(item.exposure_title),
      lane_use_context: humanText(item.use_context || displayLane(item.raw_lane)),
      triggering_ai_function: triggeringFunctionFor(item, route, featureLookup),
      route_reason: routeReasonLabel(route.route_reason),
      raw_route_reason: asText(route.route_reason),
      legal_risk_surface: asArray(item.legal_risk_surfaces).map(humanText),
      authority_india: humanText(item.jurisdictional_references?.IN || "Not specified in registry"),
      authority_eu_uk: humanText(item.jurisdictional_references?.EU || "Not specified in registry"),
      authority_us: humanText(item.jurisdictional_references?.US || "Not specified in registry"),
      raw_severity_tier: asText(item.severity?.tier),
      main_report_severity_label: severityForMain(item.severity),
      exposure_category: humanText(item.severity?.category),
      exposure_depth: humanText(item.severity?.depth),
      raw_assessment_status: asText(item.assessment_status),
      main_report_assessment_outcome: humanText(item.assessment_outcome || displayStatus(item.assessment_status)),
      effective_review_date: humanText(item.effective_review_date),
      legal_significance: humanText(item.legal_significance),
      exposure_mechanism: humanText(item.exposure_mechanism),
      commercial_deal_impact: humanText(item.commercial_deal_impact),
      suggested_remediation_path: humanText(item.suggested_remediation_path),
      applicability_test: item.applicability_test || {},
      applicability_criteria: item.applicability_test?.criteria || {},
      finding_threshold_outcome: humanText(item.applicability_test?.finding_threshold_outcome),
      control_test_outcome: humanText(item.applicability_test?.control_test_outcome || item.control_position),
      feature_refs: asArray(item.reviewed_evidence?.feature_references),
      evidence_ref: humanText(item.reviewed_evidence?.evidence_reference),
      reasoning_summary: humanText(item.residual_exposure),
      registry_basis: humanText(item.registry_basis),
      batch_or_challenge_trace: correction ? humanText(JSON.stringify(correction)) : "No Stage 8 correction applied to this row.",
      raw_registry_payload: item.raw_registry_payload || null,
      registry_version: registryRuntime?.version || null
    };
  });
}

function dataFlowRefsForFeatures(stage6Review = {}, featureRefs = []) {
  const wanted = new Set(asArray(featureRefs).map(asText));
  return unique(asArray(stage6Review.stage7_navigation_index?.feature_to_data_flow_index)
    .filter((row) => wanted.has(asText(row.feature_id)))
    .flatMap((row) => asArray(row.data_flow_refs || row.data_flow_ids || row.to_refs)));
}

function legalUnitRefsForFeatures(stage6Review = {}, featureRefs = []) {
  const wanted = new Set(asArray(featureRefs).map(asText));
  return unique(asArray(stage6Review.stage7_navigation_index?.feature_to_legal_unit_index)
    .filter((row) => wanted.has(asText(row.feature_id)))
    .flatMap((row) => asArray(row.legal_unit_refs || row.legal_unit_ids || row.to_refs)));
}

function buildIntegratedExposureMatrix({ hydratedRows = {}, stage6Review = {}, stage7Artifact = {}, exposureLedger = [], targetFeatureProfile = {} }) {
  const featureLookup = buildFeatureLookup(targetFeatureProfile);
  const routeMap = buildRouteMap(stage7Artifact);
  const appendixById = exposureAppendixRefById(exposureLedger);
  return asArray(hydratedRows.sorted_identified_exposures).map((item, index) => {
    const featureRefs = asArray(item.reviewed_evidence?.feature_references);
    const affectedFeatures = featureRefs.map((ref) => featureLookup.get(ref)).filter(Boolean).map((feature) => humanText(feature.feature_name || feature.feature_id));
    const dataRefs = dataFlowRefsForFeatures(stage6Review, featureRefs);
    const legalRefs = legalUnitRefsForFeatures(stage6Review, featureRefs);
    const severity = severityForMain(item.severity);
    return {
      finding_reference: `FIND-${String(index + 1).padStart(3, "0")} (*)`,
      exposure_issue: {
        exposure_category: humanText(item.severity?.category || item.exposure_category),
        exposure_title: humanText(item.exposure_title),
        issue_statement: humanText(item.residual_exposure || item.legal_significance)
      },
      triggering_ai_function: triggeringFunctionFor(item, routeMap.get(item.registry_reference) || {}, featureLookup),
      product_data_hook: {
        exposure_mechanism: humanText(item.exposure_mechanism),
        affected_features: affectedFeatures.length ? affectedFeatures : featureRefs,
        affected_data_flow_references: dataRefs,
        appendix_note: "(*) See Appendices B, C, and E for feature/data provenance."
      },
      legal_surface_and_jurisdiction: {
        legal_risk_surfaces: asArray(item.legal_risk_surfaces).map(humanText),
        jurisdictional_references: {
          India: humanText(item.jurisdictional_references?.IN || "Not specified in registry"),
          "EU / UK": humanText(item.jurisdictional_references?.EU || "Not specified in registry"),
          US: humanText(item.jurisdictional_references?.US || "Not specified in registry")
        }
      },
      assessment_and_priority: {
        assessment_outcome: humanText(item.assessment_outcome),
        priority_label: severity.priority_label,
        priority_route: priorityForMain(item.severity, item.timing_urgency),
        timing_urgency: humanText(item.timing_urgency?.label || displayVelocity(item.timing_urgency?.raw))
      },
      evidence_and_applicability_basis: {
        applicability_basis: humanText(item.applicability_test?.finding_threshold || "Review item triggered by evaluated criteria."),
        evidence_reference: humanText(item.reviewed_evidence?.evidence_reference),
        criteria_satisfied: asArray(item.applicability_test?.criteria?.satisfied).map((criterion) => humanText(criterion.criterion_text || criterion.evidentiary_basis)),
        appendix_note: "(*) See Appendix E for full condition and evidence provenance."
      },
      control_position_or_gap: {
        control_position: humanText(item.control_position || displayControlOutcome(false)),
        affected_document_or_control_routes: unique([...(legalRefs || []), ...asArray(item.legal_risk_surfaces)]).map(humanText)
      },
      counsel_review_or_remediation: {
        recommended_action: humanText(item.suggested_remediation_path),
        counsel_review_note: humanText(item.counsel_review_note),
        commercial_or_deal_impact: humanText(item.commercial_deal_impact)
      },
      appendix_provenance: appendixById.get(item.registry_reference) || appendixRef("EXP", item.entry_number ? item.entry_number - 1 : index)
    };
  });
}

function buildExposureFindingsSection({ prior = {}, integratedExposureMatrix = [] }) {
  const groups = asArray(prior.exposure_category_groups).map((group) => ({
    ...group,
    highest_severity: severityForMain(group.highest_severity || {}).priority_label,
    highest_velocity: humanText(group.highest_velocity),
    findings: asArray(group.findings).map((finding) => ({
      finding_reference: humanText(finding.finding_id || finding.finding_reference),
      exposure_title: humanText(finding.finding_title || finding.exposure_title),
      assessment_outcome: humanText(finding.status || finding.assessment_outcome),
      appendix_cross_references: asArray(finding.appendix_refs || finding.appendix_cross_references)
    }))
  }));
  return {
    content_contract: prior.content_contract,
    exposure_category_groups: groups,
    integrated_exposure_matrix: integratedExposureMatrix,
    finding_rows: integratedExposureMatrix,
    severity_summary: {
      total_identified_findings: integratedExposureMatrix.length,
      priority_findings: integratedExposureMatrix.filter((row) => /Immediate|Material|Critical|customer-approval/i.test(JSON.stringify(row.assessment_and_priority))).length
    },
    control_position_summary: integratedExposureMatrix.map((row) => ({ finding_reference: row.finding_reference, control_position: row.control_position_or_gap?.control_position })),
    evidence_basis_summary: integratedExposureMatrix.map((row) => ({ finding_reference: row.finding_reference, evidence_basis: row.evidence_and_applicability_basis?.evidence_reference })),
    appendix_crosswalk: integratedExposureMatrix.map((row) => ({ finding_reference: row.finding_reference, appendix_provenance: row.appendix_provenance })),
    consolidated_count: groups.length,
    count: integratedExposureMatrix.length
  };
}

function buildProductSection({ prior = {}, featureLedger = [] }) {
  return {
    content_contract: prior.content_contract,
    product_activity_thesis: humanText(prior.product_activity_thesis),
    product_function_matrix: buildFeatureMainTable(featureLedger),
    product_profile_summary: {
      total_features: featureLedger.length,
      triggering_ai_functions: unique(featureLedger.map((row) => row.triggering_ai_function)),
      legal_risk_surfaces: unique(featureLedger.flatMap((row) => row.legal_risk_surfaces))
    },
    appendix_provenance_note: "(*) See Appendix B for full feature ledger and Appendix A for evidence source provenance."
  };
}

function buildDataSection({ prior = {}, dataLedger = [], featureLookup }) {
  return {
    content_contract: prior.content_contract,
    data_risk_thesis: humanText(prior.data_risk_thesis),
    data_control_matrix: buildDataMainTable(dataLedger, featureLookup),
    data_flow_summary: {
      total_data_flows: dataLedger.length,
      data_flows_with_provider_chain: dataLedger.filter((row) => JSON.stringify(row.processor_chain || {}).length > 5).length,
      data_flows_with_retention_or_deletion_position: dataLedger.filter((row) => JSON.stringify(row.retention_deletion_position || {}).length > 5).length
    },
    appendix_provenance_note: "(*) See Appendix C for full data provenance ledger and Appendix A for evidence source provenance."
  };
}

function buildLegalSection({ prior = {}, legalLedger = {}, integratedExposureMatrix = [] }) {
  return {
    content_contract: prior.content_contract,
    legal_document_review_thesis: humanText(prior.legal_document_review_thesis),
    legal_control_matrix: buildLegalMainTable(legalLedger, integratedExposureMatrix),
    document_inventory_summary: {
      total_documents_found: asArray(legalLedger.documents).length,
      control_signal_count: asArray(legalLedger.controls).length,
      gap_or_mismatch_count: asArray(legalLedger.gaps).length
    },
    appendix_provenance_note: "(*) See Appendix D for full legal/control ledger and Appendix A for evidence source provenance."
  };
}

function buildRemediationSection({ prior = {}, integratedExposureMatrix = [] }) {
  return {
    content_contract: prior.content_contract,
    remediation_thesis: humanText(prior.remediation_thesis || "Remediation should be routed through documents, controls, product governance, data governance, and counsel review."),
    action_queue: integratedExposureMatrix.map((row, index) => ({
      action_reference: `ACT-${String(index + 1).padStart(3, "0")} (*)`,
      linked_finding: row.finding_reference,
      required_review: row.counsel_review_or_remediation?.recommended_action,
      owner_or_workstream: inferWorkstream(row),
      priority: row.assessment_and_priority?.priority_route,
      output_needed: outputNeeded(row),
      open_question_or_blocker: row.counsel_review_or_remediation?.counsel_review_note,
      appendix_provenance: row.appendix_provenance
    })),
    review_ready_handoff_bridge: {
      summary: "Use this action queue to prepare counsel review, document remediation, product/control clarification, and client confirmation requests. Do not treat it as legal advice or a final legal determination.",
      local_counsel_review_required: true
    }
  };
}

function inferWorkstream(row = {}) {
  const text = JSON.stringify(row).toLowerCase();
  if (/privacy|data|processor|subprocessor|retention|deletion|transfer/.test(text)) return "Privacy / Data Protection";
  if (/security|breach|confidential/.test(text)) return "Security / Trust";
  if (/ip|content|output|copyright|training/.test(text)) return "IP / Content / Product";
  if (/terms|dpa|aup|sla|contract|liability|warranty/.test(text)) return "Commercial / Legal Documents";
  if (/human review|decision|automated|appeal|escalation/.test(text)) return "Product Governance / Human Review";
  return "Legal / Product Governance";
}

function outputNeeded(row = {}) {
  const text = JSON.stringify(row).toLowerCase();
  const outputs = [];
  if (/privacy|processor|subprocessor|retention|deletion|transfer/.test(text)) outputs.push("privacy/DPA/subprocessor control review");
  if (/terms|liability|warranty|contract/.test(text)) outputs.push("terms and liability allocation review");
  if (/aup|misuse|abuse|prohibited/.test(text)) outputs.push("acceptable-use restriction review");
  if (/human review|decision|appeal|escalation/.test(text)) outputs.push("human-review and escalation protocol review");
  return outputs.length ? outputs.join("; ") : "counsel review note and client factual confirmation";
}

function buildEvidenceGapSection({ prior = {}, integratedExposureMatrix = [] }) {
  const byCategory = new Map(integratedExposureMatrix.map((row) => [humanText(row.exposure_issue?.exposure_category), row.finding_reference]));
  const openRequests = asArray(prior.open_information_requests).map((request, index) => ({
    request_reference: asText(request.request_id, `IR-${index + 1}`),
    clarification_needed: humanText(request.question),
    why_it_matters: humanText(request.why_needed),
    requested_evidence: humanText(request.requested_evidence || "Internal documents, customer terms, implementation evidence, or operational records needed for counsel review."),
    linked_finding_or_section: byCategory.get(humanText(request.affected_section)) || humanText(request.affected_section),
    consequence_if_unresolved: "Counsel may need to qualify advice or request additional documents before sign-off.",
    appendix_provenance: "(*) See the relevant feature, data, legal/control, or exposure appendix for provenance."
  }));
  return {
    content_contract: prior.content_contract,
    open_information_requests: openRequests,
    missing_documents: asArray(prior.missing_documents).map((doc, index) => ({
      request_reference: `DOCREQ-${String(index + 1).padStart(3, "0")}`,
      document_type: documentLabel(doc.document_type),
      reason_needed: humanText(doc.reason_needed || doc.requested_evidence)
    })),
    missing_factual_confirmations: asArray(prior.missing_factual_confirmations).map((item, index) => ({ confirmation_reference: asText(item.confirmation_id, `FC-${index + 1}`), question: humanText(item.question) })),
    unclear_data_flows: asArray(prior.unclear_data_flows).map((flow) => ({ data_flow_reference: asText(flow.data_flow_id), confidence_level: humanText(flow.confidence) })),
    unclear_provider_dependencies: asArray(prior.unclear_provider_dependencies).map((hint) => ({ provider_dependency_reference: asText(hint.hint_id), provider_dependency_type: humanText(hint.hint_type), provider_dependency_value: humanText(hint.hint_value), confidence_level: humanText(hint.confidence) })),
    evidence_limitations: asArray(prior.evidence_limitations).map(humanText),
    consequence_if_unresolved: asArray(prior.consequence_if_unresolved).map(humanText),
    client_confirmation_questions: asArray(prior.client_confirmation_questions).map(humanText)
  };
}

function buildMethodologySection(prior = {}) {
  const stageRoles = asArray(prior.stage_roles).map((item) => ({
    review_step: humanText(item.stage || item.review_step),
    purpose: humanText(item.role || item.purpose)
  }));
  return {
    ...prior,
    stage_roles: stageRoles,
    methodology: asArray(prior.methodology).map(humanText),
    status_definitions: asArray(prior.status_definitions).map((item) => ({ status: humanText(item.status), meaning: humanText(item.meaning) })),
    legal_limitations: asArray(prior.legal_limitations).map(humanText),
    evidence_limitations: asArray(prior.evidence_limitations).map(humanText),
    review_framework_note: humanText(prior.registry_use_note || "An internal review framework was used to structure issue spotting. Row-level detail is preserved only in the forensic appendices."),
    reviewer_notes: asArray(prior.reviewer_notes).map(humanText)
  };
}

function buildAppendixHub({ prior = {}, evidenceSourceIndex, featureLedger, dataLedger, legalLedger, exposureLedger, qualityTraceLedger }) {
  return {
    ...prior,
    appendix_notice: "This appendix hub preserves full forensic provenance. Main report tables are deliberately compressed and use (*) markers to route reviewers to the relevant appendix rows.",
    appendix_a_evidence_source_index: evidenceSourceIndex,
    appendix_b_feature_ledger: featureLedger,
    appendix_c_data_provenance_ledger: dataLedger,
    appendix_d_legal_control_ledger: legalLedger.rows,
    appendix_e_exposure_forensic_ledger: exposureLedger,
    appendix_f_quality_review_trace: qualityTraceLedger,
    full_registry_ledger: exposureLedger,
    forensic_ledger: exposureLedger,
    full_ledger_summary: {
      ...(prior.full_ledger_summary || {}),
      exposure_rows: exposureLedger.length,
      feature_rows: featureLedger.length,
      data_flow_rows: dataLedger.length,
      legal_control_rows: legalLedger.rows.length,
      source_rows: evidenceSourceIndex.length,
      quality_trace_rows: qualityTraceLedger.length
    },
    row_level_proof: exposureLedger.map((row) => ({ appendix_ref: row.appendix_ref, threat_id: row.threat_id, reasoning_summary: row.reasoning_summary, evidence_ref: row.evidence_ref })),
    condition_trigger_basis: exposureLedger.map((row) => ({ appendix_ref: row.appendix_ref, threat_id: row.threat_id, applicability_criteria: row.applicability_criteria, finding_threshold_outcome: row.finding_threshold_outcome, control_test_outcome: row.control_test_outcome })),
    evidence_references: exposureLedger.map((row) => ({ appendix_ref: row.appendix_ref, threat_id: row.threat_id, evidence_ref: row.evidence_ref, feature_refs: row.feature_refs }))
  };
}

function buildQualityTraceLedger(stage8Export = {}, stage8Ledger = {}) {
  const reopened = asArray(stage8Export?.summary?.reopened_rows || stage8Ledger?.operator_challenge_gate?.reopened_rows);
  const notes = asArray(stage8Ledger?.operator_challenge_gate?.notes);
  const warnings = asArray(stage8Export?.model_metadata?.model_warnings);
  const rows = reopened.map((row, index) => ({
    appendix_ref: appendixRef("QA", index),
    challenge_ref: `QA-${String(index + 1).padStart(3, "0")}`,
    row_ref: asText(row.threat_id || row.registry_reference || row.appendix_row_reference),
    deterministic_flag: humanText(row.reason || row.required_action || "Quality review reopened this row."),
    previous_outcome: humanText(row.previous_status),
    corrected_outcome: humanText(row.reopened_status),
    reason_for_challenge: humanText(row.reason),
    required_action: humanText(row.required_action),
    model_challenge_used: Boolean(stage8Export?.model_metadata?.compact_challenge),
    challenge_warning: "",
    correction_applied: true,
    exhausted_or_unresolved: false
  }));
  for (const warning of warnings.concat(notes).filter(Boolean)) {
    rows.push({
      appendix_ref: appendixRef("QA", rows.length),
      challenge_ref: `QA-${String(rows.length + 1).padStart(3, "0")}`,
      row_ref: "General Quality Review",
      deterministic_flag: "Quality review warning",
      previous_outcome: "Not applicable",
      corrected_outcome: "Not applicable",
      reason_for_challenge: humanText(warning),
      required_action: "Review warning before delivery if material.",
      model_challenge_used: Boolean(stage8Export?.model_metadata?.compact_challenge),
      challenge_warning: humanText(warning),
      correction_applied: false,
      exhausted_or_unresolved: /exhaust|unresolved|failed/i.test(String(warning))
    });
  }
  if (!rows.length) {
    rows.push({
      appendix_ref: appendixRef("QA", 0),
      challenge_ref: "QA-001",
      row_ref: "Quality Review Summary",
      deterministic_flag: "No row-level correction recorded",
      previous_outcome: "Not applicable",
      corrected_outcome: "Not applicable",
      reason_for_challenge: "Stage 8 completed without a row-level correction trace.",
      required_action: "No correction action recorded.",
      model_challenge_used: Boolean(stage8Export?.model_metadata?.compact_challenge),
      challenge_warning: "None recorded",
      correction_applied: false,
      exhausted_or_unresolved: false
    });
  }
  return rows;
}

export function applyLockedStage9ReportArchitecture({ sections = {}, stage6Cache = {}, stage7Artifact = {}, stage8Ledger = {}, stage8Export = {}, registryRuntime = {}, hydratedRows = {}, reviewedSources = [] } = {}) {
  const sourceBundle = stage6Cache.source_bundle || {};
  const targetFeatureProfile = stage6Cache.target_feature_profile || {};
  const stage6Review = stage6Cache.stage6_review || {};
  const featureLookup = buildFeatureLookup(targetFeatureProfile);
  const evidenceSourceIndex = buildSourceRows({ sourceBundle, reviewedSources, targetFeatureProfile, stage6Review, hydratedRows });
  const featureLedger = buildFeatureLedger(targetFeatureProfile);
  const dataLedger = buildDataLedger(stage6Review);
  const legalLedger = buildLegalLedger(stage6Review);
  const exposureLedger = buildExposureLedger({ hydratedRows, stage7Artifact, stage8Ledger, registryRuntime, featureLookup });
  const qualityTraceLedger = buildQualityTraceLedger(stage8Export, stage8Ledger);
  const integratedExposureMatrix = buildIntegratedExposureMatrix({ hydratedRows, stage6Review, stage7Artifact, exposureLedger, targetFeatureProfile });
  return {
    ...sections,
    target_profile: {
      ...(sections.target_profile || {}),
      target_snapshot: {
        target_identity: safeObject(stage6Cache.company_profile?.identity),
        jurisdictional_profile: safeObject(stage6Cache.company_profile?.jurisdiction),
        business_model_profile: safeObject(stage6Cache.company_profile?.business_model),
        market_context: safeObject(stage6Cache.company_profile?.market_context),
        product_baseline: safeObject(stage6Cache.company_profile?.product_baseline),
        evidence_provenance_note: "(*) See Appendix A for source provenance."
      }
    },
    product_activity_ip_profile: buildProductSection({ prior: sections.product_activity_ip_profile || {}, featureLedger }),
    data_risk_provenance_controls: buildDataSection({ prior: sections.data_risk_provenance_controls || {}, dataLedger, featureLookup }),
    legal_document_control_review: buildLegalSection({ prior: sections.legal_document_control_review || {}, legalLedger, integratedExposureMatrix }),
    exposure_findings: buildExposureFindingsSection({ prior: sections.exposure_findings || {}, integratedExposureMatrix }),
    implications_remediation_path: buildRemediationSection({ prior: sections.implications_remediation_path || {}, integratedExposureMatrix }),
    evidence_gaps_clarification_points: buildEvidenceGapSection({ prior: sections.evidence_gaps_clarification_points || {}, integratedExposureMatrix }),
    methodology_limitations_review_notes: buildMethodologySection(sections.methodology_limitations_review_notes || {}),
    forensic_ledger_appendix: buildAppendixHub({ prior: sections.forensic_ledger_appendix || {}, evidenceSourceIndex, featureLedger, dataLedger, legalLedger, exposureLedger, qualityTraceLedger })
  };
}
