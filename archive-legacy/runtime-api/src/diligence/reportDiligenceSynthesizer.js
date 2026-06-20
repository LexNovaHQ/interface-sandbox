import { REVIEW_READY_DISCLAIMER, displayStatus } from "./reportTerminologyMap.js";
import { requiredBlocksForSection } from "./reportSectionContentContract.js";
import { buildPlatformLegalDiligence } from "./platformLegalDiligenceMapper.js";
import { buildForensicLedgerAppendix } from "./reportAppendixBuilder.js";

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

function withContract(sectionKey, body = {}) {
  return {
    content_contract: {
      required_blocks: requiredBlocksForSection(sectionKey),
      contract_status: "populated"
    },
    ...body
  };
}

const STATUS_DEFINITIONS = Object.freeze([
  { status: "Identified Exposure", meaning: "The reviewed evidence met the issue-spotting threshold and no sufficient public or admitted control was evidenced for the item." },
  { status: "Control Evidenced", meaning: "The item was reviewed and a public or admitted control position was evidenced." },
  { status: "Clarification Required", meaning: "The reviewed evidence did not support a conclusive assessment and requires client or counsel clarification." },
  { status: "No Finding on Reviewed Evidence", meaning: "The reviewed evidence did not satisfy the issue-spotting threshold for the item." },
  { status: "Outside Current Review Scope", meaning: "The item was not applicable to the reviewed product/activity profile for this matter." }
]);

const CATEGORY_LABELS = Object.freeze({
  PRV: "Privacy, Data Protection & User Rights",
  BIO: "Biometric, Voice & Sensitive Data",
  DEC: "Automated Decisioning, Human Review & Reliance",
  INF: "IP, Content, Training Data & Infrastructure",
  LIA: "Liability, Warranty & Allocation of Risk",
  CNS: "Consent, Consumer Terms & User Notice",
  HAL: "Output Reliability, Hallucination & False Claims",
  FRD: "Misrepresentation, Fraud & AI-Washing",
  HRM: "User Harm, Safety & Vulnerable Users",
  TRD: "Trading, Pricing & Market Conduct",
  SHD: "Security & Operational Controls",
  FIN: "Financial, Billing & Commercial Terms Risk",
  GEN: "Platform Legal Control Exposure"
});

const CATEGORY_DESCRIPTIONS = Object.freeze({
  PRV: "Personal data, processors, subprocessors, model providers, transfers, deletion, training use, and processing transparency.",
  BIO: "Voice, biometric, sensitive-data, consent, retention, deletion, and identity-related controls.",
  DEC: "Automated review, decision-support, human oversight, appeals, and outcome-reliance controls.",
  INF: "Content, copyright, training data, output ownership, third-party materials, and infrastructure controls.",
  LIA: "Contractual responsibility, warranties, disclaimers, user reliance, damages allocation, and customer-facing commitments.",
  CNS: "Consent, notice, user rights, cancellation, opt-out, and public-facing control disclosures.",
  HAL: "Output reliability, hallucination, accuracy statements, reliance controls, and human review.",
  FRD: "Public claims, user reliance, misrepresentation, impersonation, fraud-adjacent AI uses, and AI-washing.",
  HRM: "Direct user harm, safety, minors, vulnerable users, healthcare-adjacent reliance, or workplace-impact controls.",
  TRD: "Trading, pricing, market conduct, transaction authority, and market-impact controls.",
  SHD: "Security commitments, incident response, service availability, audit logs, breach language, and operational controls.",
  FIN: "Financial commitment, payment, billing, and authority-bearing activity.",
  GEN: "Platform legal controls requiring review against product, policy, contract, governance, and customer-facing evidence."
});

const DOCUMENT_ROUTE_BY_CATEGORY = Object.freeze({
  PRV: ["Privacy Policy", "Data Processing Addendum", "Data Protection Impact Assessment"],
  BIO: ["Privacy Policy", "Data Processing Addendum", "Data Protection Impact Assessment"],
  DEC: ["AI / Agent Governance Terms", "Human Review / Handover Protocol", "Internal Governance SOP"],
  INF: ["IP / Output Ownership Terms", "Terms of Service", "AI / Agent Governance Terms"],
  LIA: ["Terms of Service", "Service Level Agreement", "AI / Agent Governance Terms"],
  CNS: ["Privacy Policy", "Terms of Service", "Acceptable Use Policy"],
  HAL: ["AI / Agent Governance Terms", "Acceptable Use Policy", "Human Review / Handover Protocol"],
  FRD: ["Terms of Service", "Acceptable Use Policy", "AI / Agent Governance Terms"],
  HRM: ["Internal Governance SOP", "Human Review / Handover Protocol", "Privacy Policy"],
  TRD: ["Terms of Service", "Privacy Policy", "AI / Agent Governance Terms"],
  SHD: ["Service Level Agreement", "Data Processing Addendum", "Internal Governance SOP"],
  FIN: ["AI / Agent Governance Terms", "Terms of Service", "Human Review / Handover Protocol"],
  GEN: ["Terms of Service", "Privacy Policy", "AI / Agent Governance Terms"]
});

const CONTROL_ROUTE_BY_CATEGORY = Object.freeze({
  PRV: ["subprocessor disclosure", "deletion/DSR workflow", "training-use and transfer control"],
  BIO: ["capture consent check", "retention/deletion control", "sensitive-data handling review"],
  DEC: ["human review gate", "appeals/escalation workflow", "decision-support limitation control"],
  INF: ["input/output ownership review", "training-data use control", "third-party content review"],
  LIA: ["warranty/disclaimer review", "liability allocation review", "customer reliance control"],
  CNS: ["notice/consent review", "user rights workflow", "consumer-facing disclosure review"],
  HAL: ["human review protocol", "output limitation disclosure", "high-risk use restriction"],
  FRD: ["claim substantiation review", "misrepresentation guardrail", "support/sales statement control"],
  HRM: ["safety review", "review/escalation protocol", "vulnerable-user limitation"],
  TRD: ["public disclosure review", "traceability/provenance control", "market-conduct review"],
  SHD: ["security commitment review", "incident/breach process", "availability/support control"],
  FIN: ["transaction authority limit", "approval gate", "audit log and exception review"],
  GEN: ["policy/control review", "counsel validation", "client factual confirmation"]
});

function categoryCodeFromReference(reference = "") {
  const parts = asText(reference).split("_").filter(Boolean);
  return parts.length >= 2 ? parts[1].toUpperCase() : "GEN";
}

function categoryLabel(code = "GEN") {
  return CATEGORY_LABELS[code] || CATEGORY_LABELS.GEN;
}

function severityRank(item = {}) {
  const tier = asText(item?.severity?.tier || item?.highest_severity?.tier || "T5");
  const tierRank = { T1: 1, T2: 2, T3: 3, T4: 4, T5: 5 }[tier] || 99;
  const velocity = asText(item?.timing_urgency?.raw || item?.highest_velocity?.raw || "WATCH");
  const velocityRank = { ACTIVE_NOW: 1, THIS_YEAR: 2, INCOMING: 3, WATCH: 4 }[velocity] || 99;
  return tierRank * 100 + velocityRank;
}

function priorityForSeverity(severity = {}, velocity = {}) {
  const tier = asText(severity.tier, "T5");
  const rawVelocity = asText(velocity.raw, "WATCH");
  if (["T1", "T2"].includes(tier) || rawVelocity === "ACTIVE_NOW") return "Priority 1 — Immediate / Pre-Signing / Pre-Launch";
  if (["T3", "T4"].includes(tier) || rawVelocity === "THIS_YEAR") return "Priority 2 — Customer / Enterprise Readiness";
  return "Priority 3 — Governance Maturity / Cleanup";
}

function sourceCategory(source = {}) {
  const text = `${source.source_type || ""} ${source.title || ""} ${source.source_url || ""}`.toLowerCase();
  if (text.includes("privacy")) return "Legal documents / privacy evidence";
  if (text.includes("terms") || text.includes("legal") || text.includes("policy")) return "Legal documents";
  if (text.includes("security") || text.includes("trust")) return "Security / trust evidence";
  if (text.includes("pricing") || text.includes("plans")) return "Commercial / pricing evidence";
  if (text.includes("docs") || text.includes("api") || text.includes("developer")) return "Product / technical evidence";
  return "Public product / website evidence";
}

function evidenceCategoryInventory(reviewedSources = []) {
  const categories = new Map();
  for (const source of asArray(reviewedSources)) {
    const category = sourceCategory(source);
    if (!categories.has(category)) categories.set(category, []);
    categories.get(category).push({
      source_id: source.source_id,
      title: source.title,
      source_url: source.source_url,
      source_type: source.source_type,
      evidence_mode: source.evidence_mode
    });
  }
  return [...categories.entries()].map(([category, sources]) => ({ category, source_count: sources.length, sources }));
}

function getTargetName({ companyProfile = {}, targetFeatureProfile = {}, sourceBundle = {} } = {}) {
  const identity = safeObject(companyProfile.identity);
  const targetRef = safeObject(targetFeatureProfile.target_profile_ref);
  return asText(identity.brand_name || identity.legal_name || targetRef.brand_name || targetRef.legal_name || sourceBundle?.target_url || sourceBundle?.target_domain, "Target not specified");
}

function buildMatterOverview({ targetName, primaryUrl, companyProfile, sourceBundle, reviewedSources, registryRuntime, generatedAt }) {
  const identity = safeObject(companyProfile.identity);
  const productBaseline = safeObject(companyProfile.product_baseline);
  return withContract("matter_overview", {
    matter_identity: {
      target_name: targetName,
      legal_name: asText(identity.legal_name),
      website: asText(identity.website || primaryUrl),
      domain: asText(identity.domain),
      primary_product_or_service: asText(productBaseline.high_level_offering || productBaseline.primary_claim, "Product / matter not specified"),
      report_date: generatedAt,
      report_status: "Review-Ready Draft — Counsel Review Required"
    },
    review_scope: {
      source_mode: sourceBundle?.source_mode || sourceBundle?.evidence_mode || "Matter evidence review",
      reviewed_source_count: reviewedSources.length,
      reviewed_source_families: unique(reviewedSources.map((source) => source.source_type)),
      reviewed_material_summary: [
        "Public product and website evidence admitted into the review workflow",
        "Public or admitted legal, governance, privacy, security, product, developer, and commercial materials identified during review",
        "Target profile, feature profile, data provenance, legal document cartography, post-challenge exposure findings, and evidence limitations from validated upstream stages"
      ],
      not_reviewed: [
        "Private customer contracts, MSAs, order forms, customer-specific DPAs, negotiated enterprise terms, SOC reports, security questionnaires, source code, internal policies, deployment evidence, and data-room materials unless present in the admitted evidence set."
      ]
    },
    evidence_cutoff: {
      generated_at: generatedAt,
      registry_version: registryRuntime?.version || null,
      source_bundle_version: sourceBundle?.source_bundle_version || sourceBundle?.schema_version || null
    },
    reliance_disclaimer: REVIEW_READY_DISCLAIMER,
    local_counsel_review_required: true,
    public_footprint_limitation: "This report is based on public or admitted evidence only and does not verify non-public implementation, private contracts, or operational effectiveness."
  });
}

function buildTargetProfileSection({ companyProfile }) {
  return withContract("target_profile", {
    identity: safeObject(companyProfile.identity),
    jurisdiction: safeObject(companyProfile.jurisdiction),
    business_model: safeObject(companyProfile.business_model),
    market_context: safeObject(companyProfile.market_context),
    product_baseline: safeObject(companyProfile.product_baseline),
    data_touchpoint_summary: asArray(companyProfile.data_touchpoint_map),
    evidence_basis: asArray(companyProfile.evidence?.field_evidence_refs),
    limitations: asArray(companyProfile.limitations)
  });
}

function buildProductActivityIpProfile({ targetFeatureProfile, companyProfile, hydratedRows }) {
  const features = asArray(targetFeatureProfile.feature_inventory);
  const activeArchetypes = unique(features.flatMap((feature) => asArray(feature.archetype_codes).concat(asArray(feature.archetype_labels))));
  const activeSurfaces = unique(features.flatMap((feature) => asArray(feature.surface_tokens)));
  const contentFeatures = features.filter((feature) => {
    const text = `${asArray(feature.input_data).join(" ")} ${feature.output_or_result || ""} ${asArray(feature.surface_tokens).join(" ")} ${feature.feature_description || ""}`.toLowerCase();
    return ["content", "ip", "output", "document", "image", "audio", "video", "code", "training"].some((term) => text.includes(term));
  });
  return withContract("product_activity_ip_profile", {
    product_activity_thesis: `Based on the reviewed evidence, ${asText(companyProfile?.identity?.brand_name || companyProfile?.identity?.legal_name, "the target")} appears to operate a product/platform footprint involving ${features.length} identified feature(s). Review focuses on product functionality, user-facing claims, data-processing indicators, automated-system reliance, provider dependencies, content/IP position, security/operational controls, and customer-contracting posture.`,
    feature_inventory_summary: {
      total_features: features.length,
      core_features: features.filter((feature) => feature.feature_role === "CORE").map((feature) => ({ feature_id: feature.feature_id, feature_name: feature.feature_name })),
      secondary_features: features.filter((feature) => feature.feature_role !== "CORE").map((feature) => ({ feature_id: feature.feature_id, feature_name: feature.feature_name }))
    },
    feature_table: features.map((feature) => ({
      feature_id: feature.feature_id,
      feature_name: feature.feature_name,
      commercial_function: feature.commercial_function,
      business_label_or_product_area: feature.business_label_or_product_area,
      actor_or_user: feature.actor_or_user,
      input_data: asArray(feature.input_data),
      system_action: feature.system_action,
      output_or_result: feature.output_or_result,
      autonomy_level: feature.autonomy_level,
      human_review_signal: feature.human_review_signal,
      external_action_signal: feature.external_action_signal,
      delivery_channels: feature.delivery_channels,
      evidence_refs: asArray(feature.evidence_refs)
    })),
    functional_profile: {
      active_archetypes: activeArchetypes,
      archetype_basis: asArray(features.flatMap((feature) => asArray(feature.archetype_provenance)))
    },
    risk_surface_profile: {
      active_surfaces: activeSurfaces,
      surface_basis: asArray(features.flatMap((feature) => asArray(feature.surface_provenance)))
    },
    ip_content_profile: {
      content_or_output_features: contentFeatures.map((feature) => ({ feature_id: feature.feature_id, feature_name: feature.feature_name, output_or_result: feature.output_or_result })),
      output_ownership_signals: unique(asArray(hydratedRows.rows).flatMap((row) => asArray(row.legal_risk_surfaces)).filter((surface) => /ip|content|output|training|copyright/i.test(surface))),
      training_or_finetuning_signals: asArray(targetFeatureProfile.data_provenance_map).filter((item) => /training|fine/i.test(`${item.training_or_finetuning_signal || ""} ${item.processing_context || ""}`))
    },
    architecture_profile: {
      model_provider_hints: asArray(targetFeatureProfile.architecture_hints).filter((hint) => hint.hint_type === "model_provider"),
      subprocessor_hints: asArray(targetFeatureProfile.architecture_hints).filter((hint) => hint.hint_type === "subprocessor"),
      architecture_hints: asArray(targetFeatureProfile.architecture_hints)
    },
    commercial_scan: safeObject(targetFeatureProfile.commercial_scan),
    evidence_basis: asArray(targetFeatureProfile.evidence?.field_evidence_refs),
    limitations: asArray(targetFeatureProfile.limitations)
  });
}

function buildDataRiskProvenanceControls({ stage6Review, targetFeatureProfile, hydratedRows }) {
  const dataProfile = safeObject(stage6Review.data_provenance_profile);
  const flows = asArray(dataProfile.data_flow_profile);
  const sensitiveFlows = flows.filter((flow) => /sensitive|biometric|health|financial|credential|child|minor/i.test(JSON.stringify(flow.data_category || {}) + JSON.stringify(flow.data_subject || {})));
  const thirdPartyFlows = flows.filter((flow) => /subprocessor|third_party|model_provider|cloud_provider|transfer/i.test(JSON.stringify(flow.processor_chain || {}) + JSON.stringify(flow.role_allocation || {})));
  return withContract("data_risk_provenance_controls", {
    data_risk_thesis: `The data review identified ${flows.length} data-flow profile row(s), including ${sensitiveFlows.length} sensitive/high-risk signal(s) and ${thirdPartyFlows.length} third-party/provider signal(s) requiring TMT counsel review where relevant.`,
    data_flow_summary: {
      total_data_flows: flows.length,
      personal_data_flows: flows.filter((flow) => /personal_data/.test(JSON.stringify(flow.data_category || {}))).length,
      sensitive_or_high_risk_flows: sensitiveFlows.length,
      third_party_or_processor_flows: thirdPartyFlows.length
    },
    data_flow_table: flows.map((flow) => ({
      data_flow_id: flow.data_flow_id,
      linked_feature_id: flow.feature_id,
      data_subject: flow.data_subject,
      data_category: flow.data_category,
      processing_actions: flow.processing?.processing_actions || [],
      processing_purpose: flow.processing?.processing_purpose || [],
      role_allocation: flow.role_allocation,
      regime_relevance: flow.regime_relevance,
      notice_position: flow.notice,
      consent_or_basis_position: flow.consent_basis,
      rights_position: flow.rights,
      processor_chain: flow.processor_chain,
      transfer_location: flow.transfer_location,
      retention_deletion_ai: flow.retention_deletion_ai,
      security_accountability: flow.security_accountability,
      confidence: flow.confidence
    })),
    control_review: {
      privacy_notice_controls: controlsByFamily(stage6Review, ["privacy_notice", "data_collection", "data_use"]),
      subprocessor_controls: controlsByFamily(stage6Review, ["subprocessor_disclosure", "model_provider_disclosure"]),
      retention_deletion_controls: controlsByFamily(stage6Review, ["retention", "deletion", "data_subject_rights"]),
      training_finetuning_controls: controlsByFamily(stage6Review, ["training_or_finetuning"]),
      security_controls: controlsByFamily(stage6Review, ["security_safeguards", "breach_notice"])
    },
    data_gaps: asArray(dataProfile.data_profile_limitations).concat(asArray(hydratedRows.clarification_required_items).filter((item) => ["PRV", "BIO", "DEC"].includes(categoryCodeFromReference(item.registry_reference))).map((item) => item.exposure_title)),
    evidence_basis: unique(flows.flatMap((flow) => asArray(flow.source_refs))),
    limitations: asArray(dataProfile.data_profile_limitations).concat(asArray(targetFeatureProfile.limitations))
  });
}

function controlsByFamily(stage6Review, families = []) {
  const cartography = safeObject(stage6Review.legal_document_cartography);
  return asArray(cartography.document_control_signal_map).filter((signal) => families.includes(signal.control_family)).map((signal) => ({
    control_signal_id: signal.control_signal_id,
    document_id: signal.document_id,
    legal_unit_id: signal.legal_unit_id,
    control_family: signal.control_family,
    control_signal: signal.control_signal,
    source_refs: asArray(signal.source_refs),
    confidence: signal.confidence
  }));
}

function buildLegalDocumentControlReview({ stage6Review, findingRows }) {
  const cartography = safeObject(stage6Review.legal_document_cartography);
  const documents = asArray(cartography.legal_document_inventory);
  const legalUnits = asArray(cartography.legal_document_index);
  const controls = asArray(cartography.document_control_signal_map);
  const mismatches = asArray(cartography.document_mismatch_signal_map);
  const summary = safeObject(cartography.legal_document_summary_signals);
  return withContract("legal_document_control_review", {
    legal_document_review_thesis: `The legal-document review identified ${documents.length} legal/control document(s), ${legalUnits.length} macro legal unit(s), ${controls.length} control signal(s), and ${mismatches.length} mismatch signal(s) for counsel review.`,
    document_inventory_summary: {
      total_documents_found: documents.length,
      core_document_status: safeObject(summary.core_stack_status),
      supplemental_artifacts_detected: asArray(summary.supplemental_artifacts_detected),
      document_hierarchy_signal: summary.document_hierarchy_signal,
      legal_document_coverage_signal: summary.legal_document_coverage_signal,
      major_unknowns: asArray(summary.major_unknowns)
    },
    document_inventory: documents,
    legal_unit_index: legalUnits,
    document_relationships: asArray(cartography.document_relationship_map),
    control_signal_matrix: controls,
    document_mismatch_signals: mismatches,
    counsel_review_points: findingRows.map((finding) => ({
      finding_id: finding.finding_id,
      category_label: finding.category_label,
      counsel_review_point: `Review legal documents and controls linked to ${finding.finding_title}, with attention to ${finding.affected_documents_or_controls.join(", ") || "the relevant legal/control documents"}.`
    })),
    evidence_basis: unique(documents.flatMap((doc) => [doc.source_record_ref, doc.source_url, doc.final_url])),
    limitations: asArray(cartography.legal_document_limitations).concat(asArray(stage6Review.stage6_limitations))
  });
}

function featureMapById(targetFeatureProfile = {}) {
  return new Map(asArray(targetFeatureProfile.feature_inventory).map((feature) => [feature.feature_id, feature]));
}

function findingRowsFromHydrated({ hydratedRows, targetFeatureProfile, stage6Review }) {
  const featuresById = featureMapById(targetFeatureProfile);
  const legalControls = asArray(stage6Review.legal_document_cartography?.document_control_signal_map);
  return asArray(hydratedRows.sorted_identified_exposures).map((item, index) => {
    const code = categoryCodeFromReference(item.registry_reference);
    const featureRefs = asArray(item.reviewed_evidence?.feature_references);
    const affectedFeatures = featureRefs.map((ref) => featuresById.get(ref)).filter(Boolean).map((feature) => ({ feature_id: feature.feature_id, feature_name: feature.feature_name }));
    const docs = DOCUMENT_ROUTE_BY_CATEGORY[code] || DOCUMENT_ROUTE_BY_CATEGORY.GEN;
    return {
      finding_id: `FIND-${String(index + 1).padStart(3, "0")}`,
      category_label: categoryLabel(code),
      finding_title: item.exposure_title,
      finding_statement: `${item.exposure_title}. ${item.residual_exposure || item.legal_significance || "The reviewed evidence indicates a counsel-review issue."}`,
      hunter_signal_trigger: item.exposure_mechanism || item.applicability_test?.finding_threshold || "Issue-spotting signal based on reviewed evidence and post-challenge assessment.",
      status: item.assessment_outcome,
      severity: item.severity,
      velocity: item.timing_urgency?.label,
      legal_pain: item.legal_significance,
      business_pain: item.commercial_deal_impact,
      mechanism: item.exposure_mechanism,
      affected_feature_refs: featureRefs,
      affected_features: affectedFeatures,
      affected_data_flow_refs: dataFlowRefsForFeatures(stage6Review, featureRefs),
      affected_legal_unit_refs: legalUnitRefsForFeatures(stage6Review, featureRefs),
      affected_documents_or_controls: docs.concat(unique(legalControls.filter((signal) => featureRefs.some((ref) => asArray(signal.feature_refs).includes(ref))).map((signal) => signal.control_family))),
      evidence_basis: {
        evidence_reference: item.reviewed_evidence?.evidence_reference,
        feature_references: featureRefs
      },
      control_position: item.control_position,
      recommended_action: item.suggested_remediation_path || `Review ${docs.join(", ")} and confirm whether existing controls address this finding.`,
      counsel_review_note: item.counsel_review_note || "Qualified counsel should verify jurisdiction-specific treatment and whether non-public controls change this assessment.",
      appendix_refs: [`APP-${String((item.entry_number || index + 1)).padStart(3, "0")}`],
      _category_code: code
    };
  }).sort((a, b) => severityRank({ severity: a.severity }) - severityRank({ severity: b.severity }));
}

function dataFlowRefsForFeatures(stage6Review, featureRefs = []) {
  const indexRows = asArray(stage6Review.stage7_navigation_index?.feature_to_data_flow_index);
  return unique(indexRows.filter((row) => featureRefs.includes(row.feature_id)).flatMap((row) => asArray(row.data_flow_refs || row.data_flow_ids || row.to_refs)));
}

function legalUnitRefsForFeatures(stage6Review, featureRefs = []) {
  const indexRows = asArray(stage6Review.stage7_navigation_index?.feature_to_legal_unit_index);
  return unique(indexRows.filter((row) => featureRefs.includes(row.feature_id)).flatMap((row) => asArray(row.legal_unit_refs || row.legal_unit_ids || row.to_refs)));
}

function categoryGroupsFromFindings(findingRows = []) {
  const groups = new Map();
  for (const finding of findingRows) {
    const code = finding._category_code || "GEN";
    if (!groups.has(code)) groups.set(code, []);
    groups.get(code).push(finding);
  }
  return [...groups.entries()].map(([code, findings], index) => {
    const highest = [...findings].sort((a, b) => severityRank({ severity: a.severity }) - severityRank({ severity: b.severity }))[0] || {};
    return {
      category_id: `CAT-${String(index + 1).padStart(3, "0")}`,
      category_label: categoryLabel(code),
      category_description: CATEGORY_DESCRIPTIONS[code] || CATEGORY_DESCRIPTIONS.GEN,
      finding_count: findings.length,
      highest_severity: highest.severity || {},
      highest_velocity: highest.velocity || "Timing not specified",
      affected_features: unique(findings.flatMap((finding) => finding.affected_features.map((feature) => feature.feature_name))),
      affected_data_flows: unique(findings.flatMap((finding) => finding.affected_data_flow_refs)),
      affected_legal_documents: unique(findings.flatMap((finding) => finding.affected_documents_or_controls)),
      summary_for_counsel: `${categoryLabel(code)} contains ${findings.length} identified finding(s). Highest severity: ${highest.severity?.label || "not specified"}.`,
      findings: findings.map(({ _category_code, ...finding }) => finding)
    };
  });
}

function buildExposureFindings({ findingRows }) {
  const publicRows = findingRows.map(({ _category_code, ...finding }) => finding);
  const groups = categoryGroupsFromFindings(findingRows);
  return withContract("exposure_findings", {
    exposure_category_groups: groups,
    finding_rows: publicRows,
    severity_summary: {
      critical_or_high_findings: publicRows.filter((finding) => ["T1", "T2"].includes(finding.severity?.tier)).length,
      total_identified_findings: publicRows.length,
      by_category: groups.map((group) => ({ category_label: group.category_label, finding_count: group.finding_count, highest_severity: group.highest_severity?.label }))
    },
    control_position_summary: publicRows.map((finding) => ({ finding_id: finding.finding_id, control_position: finding.control_position })),
    evidence_basis_summary: publicRows.map((finding) => ({ finding_id: finding.finding_id, evidence_basis: finding.evidence_basis })),
    appendix_crosswalk: publicRows.map((finding) => ({ finding_id: finding.finding_id, appendix_refs: finding.appendix_refs })),
    consolidated_findings: groups,
    consolidated_count: groups.length,
    count: publicRows.length
  });
}

function buildExecutiveSummary({ companyProfile, targetFeatureProfile, stage6Review, findingRows, reviewedSources, hydratedRows }) {
  const dataFlows = asArray(stage6Review.data_provenance_profile?.data_flow_profile);
  const documents = asArray(stage6Review.legal_document_cartography?.legal_document_inventory);
  const controls = asArray(stage6Review.legal_document_cartography?.document_control_signal_map);
  const high = findingRows.filter((finding) => ["T1", "T2"].includes(finding.severity?.tier));
  const posture = high.length >= 3 || findingRows.length >= 10
    ? "High review priority"
    : high.length || findingRows.length >= 4
      ? "Moderate-high review priority"
      : findingRows.length
        ? "Moderate review priority"
        : "Low exposure on reviewed evidence";
  return withContract("executive_summary", {
    executive_posture: {
      overall_review_priority: posture,
      summary: `${posture}. The review identified ${findingRows.length} lawyer-readable exposure finding(s), ${dataFlows.length} data-flow row(s), ${documents.length} legal/control document(s), and ${controls.length} legal-document control signal(s) from ${reviewedSources.length} reviewed source(s).`
    },
    target_snapshot: {
      identity: safeObject(companyProfile.identity),
      business_model: safeObject(companyProfile.business_model),
      market_context: safeObject(companyProfile.market_context)
    },
    product_activity_snapshot: {
      core_features_count: asArray(targetFeatureProfile.feature_inventory).filter((feature) => feature.feature_role === "CORE").length,
      total_features_count: asArray(targetFeatureProfile.feature_inventory).length,
      active_archetypes: unique(asArray(targetFeatureProfile.feature_inventory).flatMap((feature) => asArray(feature.archetype_codes))),
      active_surfaces: unique(asArray(targetFeatureProfile.feature_inventory).flatMap((feature) => asArray(feature.surface_tokens))),
      ip_content_signals: findingRows.filter((finding) => finding.category_label.includes("IP") || finding.category_label.includes("Content")).map((finding) => finding.finding_title)
    },
    data_posture: {
      data_flow_count: dataFlows.length,
      high_sensitivity_signals: dataFlows.filter((flow) => /sensitive|biometric|health|financial|credential|child|minor/i.test(JSON.stringify(flow))).map((flow) => flow.data_flow_id),
      third_party_or_subprocessor_signals: dataFlows.filter((flow) => /subprocessor|third_party|model_provider|cloud_provider|transfer/i.test(JSON.stringify(flow))).map((flow) => flow.data_flow_id)
    },
    legal_document_posture: {
      documents_found_count: documents.length,
      core_document_status: safeObject(stage6Review.legal_document_cartography?.legal_document_summary_signals?.core_stack_status),
      control_gaps_summary: asArray(stage6Review.legal_document_cartography?.document_mismatch_signal_map).map((mismatch) => ({ mismatch_id: mismatch.mismatch_id, control_family: mismatch.control_family, mismatch_signal: mismatch.mismatch_signal }))
    },
    exposure_posture: {
      critical_or_high_findings_count: high.length,
      finding_category_count: categoryGroupsFromFindings(findingRows).length,
      top_categories: categoryGroupsFromFindings(findingRows).slice(0, 5).map((group) => ({ category_label: group.category_label, finding_count: group.finding_count, highest_severity: group.highest_severity?.label }))
    },
    evidence_posture: {
      reviewed_sources_count: reviewedSources.length,
      major_evidence_gaps_count: asArray(hydratedRows.clarification_required_items).length + asArray(companyProfile.evidence?.unresolved_questions).length + asArray(targetFeatureProfile.evidence?.unresolved_questions).length
    },
    counsel_review_priorities: findingRows.slice(0, 7).map((finding) => ({
      finding_id: finding.finding_id,
      priority: priorityForSeverity(finding.severity, { raw: finding.velocity }),
      counsel_review_point: `Review ${finding.category_label}: ${finding.finding_title}.`
    }))
  });
}

function buildImplicationsRemediationPath({ findingRows, stage6Review }) {
  const actions = findingRows.map((finding) => ({
    finding_id: finding.finding_id,
    category_label: finding.category_label,
    finding_title: finding.finding_title,
    priority: priorityForSeverity(finding.severity, { raw: finding.velocity }),
    action: finding.recommended_action,
    why_it_matters: finding.legal_pain || finding.business_pain,
    affected_report_sections: ["Product, Activity & IP Profile", "Data Risk, Provenance & Controls", "Legal Document & Control Review", "Exposure Findings"]
  }));
  return withContract("implications_remediation_path", {
    remediation_thesis: actions.length
      ? "Remediation should be routed through the affected documents, data controls, operational controls, and counsel-review priorities identified below."
      : "No open remediation route was generated from identified exposure findings on the reviewed evidence.",
    priority_actions: actions,
    document_route: unique(findingRows.flatMap((finding) => finding.affected_documents_or_controls)).map((document_or_control) => ({ document_or_control, required_review: `Review ${document_or_control} against linked findings and evidence gaps.` })),
    data_control_route: asArray(stage6Review.data_provenance_profile?.data_flow_profile).map((flow) => ({
      data_flow_id: flow.data_flow_id,
      control_area: unique([...(flow.notice ? ["notice"] : []), ...(flow.consent_basis ? ["consent/basis"] : []), ...(flow.rights ? ["rights"] : []), ...(flow.processor_chain ? ["processor chain"] : []), ...(flow.transfer_location ? ["transfer"] : []), ...(flow.retention_deletion_ai ? ["retention/deletion"] : []), ...(flow.security_accountability ? ["security/accountability"] : [])]).join(", ") || "data control review"
    })),
    operational_control_route: unique(findingRows.flatMap((finding) => CONTROL_ROUTE_BY_CATEGORY[finding._category_code] || CONTROL_ROUTE_BY_CATEGORY.GEN)).map((control) => ({ control, required_review: `Confirm ${control} with product, operations, and counsel.` })),
    local_counsel_review_queue: actions.slice(0, 10).map((action) => ({ finding_id: action.finding_id, priority: action.priority, review_point: action.action })),
    quick_wins: actions.filter((action) => /policy|notice|disclaimer|terms|privacy|aup/i.test(action.action)).slice(0, 8),
    blocked_until_clarified: findingRows.filter((finding) => /clarification|insufficient|unclear|not visible/i.test(`${finding.control_position} ${finding.finding_statement}`)).map((finding) => ({ finding_id: finding.finding_id, issue: finding.finding_title })),
    review_ready_handoff_bridge: {
      summary: "Use this report to prepare counsel review, document remediation, and client clarification requests. Do not treat it as legal advice or a finalized legal determination.",
      local_counsel_review_required: true
    }
  });
}

function buildEvidenceGaps({ companyProfile, targetFeatureProfile, stage6Review, hydratedRows }) {
  const cartography = safeObject(stage6Review.legal_document_cartography);
  const dataProfile = safeObject(stage6Review.data_provenance_profile);
  const documents = asArray(cartography.legal_document_inventory);
  const knownDocTypes = new Set(documents.map((doc) => doc.document_type));
  const expectedDocTypes = ["tos", "privacy_policy", "dpa", "aup", "sla"];
  const missingDocuments = expectedDocTypes.filter((docType) => !knownDocTypes.has(docType)).map((docType) => ({
    document_type: docType,
    reason_needed: "Core public/customer-facing document or control area should be confirmed before counsel sign-off."
  }));
  const clarificationRows = asArray(hydratedRows.clarification_required_items);
  return withContract("evidence_gaps_clarification_points", {
    open_information_requests: clarificationRows.map((item, index) => ({
      request_id: `IR-${String(index + 1).padStart(3, "0")}`,
      question: asArray(item.clarification_points)[0] || `Clarify whether reviewed evidence for ${item.exposure_title} is complete.`,
      why_needed: item.residual_exposure || "Reviewed evidence did not support a conclusive assessment.",
      affected_section: categoryLabel(categoryCodeFromReference(item.registry_reference)),
      related_finding_ids: []
    })),
    missing_documents: missingDocuments,
    missing_factual_confirmations: unique(asArray(companyProfile.evidence?.unresolved_questions).concat(asArray(targetFeatureProfile.evidence?.unresolved_questions))).map((question, index) => ({ confirmation_id: `FC-${String(index + 1).padStart(3, "0")}`, question })),
    unclear_data_flows: asArray(dataProfile.data_flow_profile).filter((flow) => ["low", "unknown"].includes(flow.confidence) || JSON.stringify(flow).includes("unknown")).map((flow) => ({ data_flow_id: flow.data_flow_id, confidence: flow.confidence })),
    unclear_provider_dependencies: asArray(targetFeatureProfile.architecture_hints).filter((hint) => ["model_provider", "subprocessor", "cloud_host", "integration"].includes(hint.hint_type) && ["low", "unknown"].includes(hint.confidence)).map((hint) => ({ hint_id: hint.hint_id, hint_type: hint.hint_type, hint_value: hint.hint_value, confidence: hint.confidence })),
    evidence_limitations: unique(asArray(companyProfile.limitations).concat(asArray(targetFeatureProfile.limitations), asArray(stage6Review.stage6_limitations), asArray(dataProfile.data_profile_limitations), asArray(cartography.legal_document_limitations))),
    consequence_if_unresolved: [
      "Counsel may need to qualify advice or request additional documents before sign-off.",
      "Document and control remediation may remain provisional until private contracts, internal controls, or client factual confirmations are reviewed."
    ],
    client_confirmation_questions: clarificationRows.flatMap((item) => asArray(item.clarification_points)).slice(0, 25)
  });
}

function buildMethodology({ registryRuntime }) {
  return withContract("methodology_limitations_review_notes", {
    methodology: [
      "Reviewed public or admitted evidence and upstream validated profile outputs.",
      "Compiled target, product, data, legal-document, and exposure findings into a lawyer-readable review pack.",
      "Converted row-level issue-spotting outcomes into human-facing categories and preserved row-level detail only in the forensic appendix."
    ],
    stage_roles: [
      { stage: "Target Profile", role: "Identifies business, jurisdiction, market, product baseline, and source-backed profile facts." },
      { stage: "Feature Profile", role: "Identifies product functions, data provenance, architecture hints, archetypes, surfaces, commercial outcomes, evidence, and limitations." },
      { stage: "Data Provenance", role: "Maps data flows and data-control signals for review." },
      { stage: "Legal Document Cartography", role: "Maps public/admitted legal documents, macro legal units, control signals, mismatches, and limitations." },
      { stage: "Registry Evaluation", role: "Applies issue-spotting logic to validated evidence and produces row-level assessment outcomes." },
      { stage: "Operator Challenge", role: "Checks and corrects ledger outcomes before final compilation." }
    ],
    status_definitions: STATUS_DEFINITIONS,
    legal_limitations: [
      REVIEW_READY_DISCLAIMER,
      "This output is a legal architecture and diligence-support artifact. It is not a law-firm opinion, filing, advice memorandum, or jurisdiction-specific legal determination.",
      "Qualified counsel must review the report before reliance, negotiation, implementation, filing, or client delivery."
    ],
    evidence_limitations: [
      "Private contracts, internal controls, implementation records, source code, and operational evidence were not reviewed unless included in the admitted evidence set.",
      "Absence of public evidence is not proof that a non-public control does not exist."
    ],
    registry_use_note: `An internal issue-spotting registry${registryRuntime?.version ? ` (${registryRuntime.version})` : ""} was used to structure review logic. Row-level details are preserved only in the Forensic Ledger Appendix.`,
    reviewer_notes: [
      "Use the main report for partner/reviewer triage and the appendix for auditability.",
      "Use evidence gaps and clarification points to prepare follow-up requests before final legal review."
    ]
  });
}

export function synthesizeDiligenceReportSections({
  targetName,
  primaryUrl,
  sourceBundle = {},
  companyProfile = {},
  targetFeatureProfile = {},
  stage6Review = {},
  hydratedRows = {},
  reviewedSources = [],
  stage7Artifact = {},
  stage8Ledger = {},
  registryRuntime = {},
  generatedAt = new Date().toISOString()
} = {}) {
  const findingRows = findingRowsFromHydrated({ hydratedRows, targetFeatureProfile, stage6Review });
  const platformDiligenceObject = buildPlatformLegalDiligence({ targetFeatureProfile, stage6Review, hydratedRows, reviewedSources });
  const forensicLedgerAppendix = withContract("forensic_ledger_appendix", buildForensicLedgerAppendix({ hydratedRows, stage7Artifact, stage8Ledger }));

  return {
    matter_overview: buildMatterOverview({ targetName, primaryUrl, companyProfile, sourceBundle, reviewedSources, registryRuntime, generatedAt }),
    executive_summary: buildExecutiveSummary({ companyProfile, targetFeatureProfile, stage6Review, findingRows, reviewedSources, hydratedRows }),
    target_profile: buildTargetProfileSection({ companyProfile }),
    product_activity_ip_profile: buildProductActivityIpProfile({ targetFeatureProfile, companyProfile, hydratedRows }),
    data_risk_provenance_controls: buildDataRiskProvenanceControls({ stage6Review, targetFeatureProfile, hydratedRows }),
    legal_document_control_review: buildLegalDocumentControlReview({ stage6Review, findingRows }),
    exposure_findings: buildExposureFindings({ findingRows }),
    implications_remediation_path: buildImplicationsRemediationPath({ findingRows, stage6Review }),
    evidence_gaps_clarification_points: buildEvidenceGaps({ companyProfile, targetFeatureProfile, stage6Review, hydratedRows }),
    methodology_limitations_review_notes: buildMethodology({ registryRuntime }),
    forensic_ledger_appendix: forensicLedgerAppendix,
    platform_diligence_object: platformDiligenceObject
  };
}
