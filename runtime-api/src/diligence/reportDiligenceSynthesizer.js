import { REVIEW_READY_DISCLAIMER, displayStatus } from "./reportTerminologyMap.js";
import { requiredBlocksForSection } from "./reportSectionContentContract.js";
import { buildPlatformLegalDiligence, platformElementByKey } from "./platformLegalDiligenceMapper.js";
import { buildImplicationsRemediationPath, controlRouteFor, documentRouteFor, priorityFor } from "./reportRemediationRouter.js";
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

const STANDARD_DOCUMENT_ROUTES = Object.freeze([
  "Terms of Service",
  "Privacy Policy",
  "Data Processing Addendum",
  "Acceptable Use Policy",
  "Service Level Agreement",
  "AI / Agent Governance Terms",
  "IP / Output Ownership Terms",
  "Internal Governance SOP",
  "Human Review / Handover Protocol",
  "Data Protection Impact Assessment"
]);

const STATUS_DEFINITIONS = Object.freeze([
  { status: "Identified Exposure", meaning: "The reviewed evidence met the registry finding threshold and did not evidence a sufficient control for the item." },
  { status: "Control Evidenced", meaning: "The item was reviewed and the admitted/public legal stack or evidence showed a control sufficient for the registry item." },
  { status: "Clarification Required", meaning: "The reviewed evidence did not support a conclusive assessment and requires client or counsel clarification." },
  { status: "No Finding on Reviewed Evidence", meaning: "The reviewed evidence did not satisfy the finding threshold for the registry item." },
  { status: "Outside Current Review Scope", meaning: "The item was not applicable to the reviewed product/activity profile for this matter." }
]);

function withContract(sectionKey, body = {}) {
  return {
    content_contract: {
      required_blocks: requiredBlocksForSection(sectionKey),
      contract_status: "populated"
    },
    ...body
  };
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

function docKey(label = "") {
  return asText(label).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function documentIndex(legalStack = []) {
  const index = new Map();
  for (const doc of asArray(legalStack)) {
    index.set(docKey(doc.document_type || doc.type), doc);
  }
  return index;
}

function documentRouteStatus(documentType, legalStack = []) {
  const index = documentIndex(legalStack);
  const found = index.get(docKey(documentType));
  if (found) return found;
  return { document_type: documentType, exists: false, evidence_status: "Not evidenced in reviewed public/admitted evidence", controls_found: [], gaps_noted: [] };
}

function missingDocuments(legalStack = []) {
  return STANDARD_DOCUMENT_ROUTES.map((docType) => documentRouteStatus(docType, legalStack))
    .filter((doc) => doc.exists !== true)
    .map((doc) => ({ document_type: doc.document_type, requested_evidence: `Provide the current ${doc.document_type} or confirm that no such document/control exists for the reviewed product.` }));
}

function buildMatterOverview({ targetName, primaryProduct, primaryUrl, sourceBundle, reviewedSources, registryRuntime, generatedAt }) {
  return withContract("matter_overview", {
    report_identity: {
      report_title: "Legal Exposure Diligence Report",
      target_or_client: targetName,
      primary_url: primaryUrl,
      product_or_matter: asText(primaryProduct.name || primaryProduct.product_name, "Product / matter not specified"),
      report_date: generatedAt,
      report_version: "Stage 9 DD Contract v1",
      review_mode: "Public-footprint and admitted evidence review"
    },
    review_scope: {
      reviewed_material: [
        "Public product and website evidence admitted into the review workflow",
        "Public or admitted legal-stack documents identified during review",
        "User-facing product claims and feature descriptions captured in the evidence set",
        "Product/activity, automated-system, data-processing, provider, security, content, and customer-contracting signals derived by the upstream review stages"
      ],
      reviewed_source_count: reviewedSources.length,
      registry_version: registryRuntime?.version || "Registry version not specified",
      source_mode: sourceBundle?.source_mode || sourceBundle?.evidence_mode || "Matter evidence review"
    },
    scope_limitations: [
      "Private customer contracts, MSAs, order forms, security questionnaires, SOC reports, source code, internal policies, data-room materials, deployment matrices, and implementation evidence were not reviewed unless present in the admitted evidence set.",
      "The report does not verify whether public legal-stack controls are operationally implemented.",
      "Absence of reviewed evidence is not treated as proof that a control does not exist internally."
    ],
    reliance_disclaimer: REVIEW_READY_DISCLAIMER,
    evidence_cut_off: {
      generated_at: generatedAt,
      evidence_basis: "Evidence available to the Stage 9 cache at report assembly time",
      registry_version: registryRuntime?.version || null
    },
    target_or_client: targetName,
    product_or_matter: asText(primaryProduct.name || primaryProduct.product_name, "Product / matter not specified"),
    review_type: "Legal Exposure Diligence",
    evidence_mode: sourceBundle?.source_mode || sourceBundle?.evidence_mode || "Matter evidence review",
    report_status: "Review-Ready Draft — Counsel Review Required",
    disclaimer: REVIEW_READY_DISCLAIMER
  });
}

function buildExecutiveSummary({ hydratedRows, consolidatedFindings, surfaces }) {
  const statusCounts = hydratedRows.status_counts || {};
  const highSeverity = asArray(hydratedRows.identified_exposures).filter((item) => ["T1", "T2"].includes(item.severity?.tier)).length;
  const posture = highSeverity >= 3 || asArray(hydratedRows.identified_exposures).length >= 25
    ? "High review priority"
    : highSeverity >= 1 || asArray(hydratedRows.identified_exposures).length >= 8
      ? "Moderate-high review priority"
      : asArray(hydratedRows.identified_exposures).length
        ? "Moderate review priority"
        : "Low exposure on reviewed evidence";
  const topThemes = asArray(consolidatedFindings).map((finding) => ({
    consolidated_finding_id: finding.consolidated_finding_id,
    exposure_title: finding.exposure_title,
    supporting_registry_item_count: finding.supporting_registry_item_count,
    severity: finding.highest_severity?.label,
    timing_urgency: finding.highest_timing_urgency?.label,
    affected_documents: documentRouteFor(finding)
  }));
  const immediatePriorities = asArray(consolidatedFindings).map((finding) => ({
    consolidated_finding_id: finding.consolidated_finding_id,
    exposure_title: finding.exposure_title,
    priority: priorityFor(finding),
    counsel_review_point: `Review ${documentRouteFor(finding).join(", ")} and confirm whether the current legal stack addresses ${finding.exposure_title}.`
  }));
  return withContract("executive_exposure_summary", {
    executive_posture: {
      posture,
      judgment: `${posture}. The reviewed footprint produced ${asArray(consolidatedFindings).length} consolidated exposure finding(s), ${asArray(hydratedRows.identified_exposures).length} identified registry exposure item(s), ${asArray(hydratedRows.control_evidenced_items).length} control-evidenced item(s), and ${asArray(hydratedRows.clarification_required_items).length} clarification-required item(s).`
    },
    key_numbers: {
      registry_rows_assessed: asArray(hydratedRows.rows).length,
      identified_registry_exposure_items: asArray(hydratedRows.identified_exposures).length,
      consolidated_exposure_findings: asArray(consolidatedFindings).length,
      control_evidenced_items: asArray(hydratedRows.control_evidenced_items).length,
      clarification_required_items: asArray(hydratedRows.clarification_required_items).length,
      outside_scope_items: statusCounts.NOT_APPLICABLE || 0,
      status_counts: Object.fromEntries(Object.entries(statusCounts).map(([status, count]) => [displayStatus(status), count]))
    },
    top_exposure_themes: topThemes,
    control_position: {
      summary: asArray(hydratedRows.control_evidenced_items).length
        ? "The reviewed legal stack or admitted evidence shows some control positions, but identified exposure families still require counsel review against the full contract and policy stack."
        : "The reviewed material did not evidence sufficient controls for the identified exposure families.",
      control_evidenced_items: asArray(hydratedRows.control_evidenced_items).map((item) => ({ registry_reference: item.registry_reference, exposure_title: item.exposure_title, control_position: item.control_position }))
    },
    immediate_review_priorities: immediatePriorities,
    executive_conclusion: asArray(consolidatedFindings).length
      ? "Proceed to counsel-led review of the consolidated findings, request missing evidence for clarification items, and route remediation through the document/control paths identified in this report."
      : "Review the evidence set, methodology, and forensic ledger with qualified counsel before relying on the absence of identified exposures.",
    active_legal_risk_surfaces: asArray(surfaces).map((surface) => surface.legal_risk_surface),
    overall_exposure_posture: posture,
    registry_rows_assessed: asArray(hydratedRows.rows).length,
    identified_registry_exposure_items: asArray(hydratedRows.identified_exposures).length,
    consolidated_exposure_findings: asArray(consolidatedFindings).length,
    status_counts: Object.fromEntries(Object.entries(statusCounts).map(([status, count]) => [displayStatus(status), count])),
    recommended_next_step: "Review consolidated exposure findings, open information requests, and remediation routes with qualified counsel."
  });
}

function buildEvidenceReviewed({ reviewedSources, sourceBundle, legalStackReview }) {
  return withContract("evidence_reviewed", {
    evidence_inventory: {
      reviewed_source_count: reviewedSources.length,
      reviewed_sources: reviewedSources
    },
    evidence_categories: evidenceCategoryInventory(reviewedSources),
    evidence_not_reviewed: [
      "Private customer contracts, MSAs, order forms, customer-specific DPAs, and negotiated enterprise terms unless present in the admitted evidence set.",
      "Source code, model cards, model evaluation records, implementation logs, SOC reports, penetration-test reports, and data-room materials unless present in the admitted evidence set.",
      "Internal policies, employee guidance, sales enablement controls, security questionnaires, incident records, and vendor contracts unless present in the admitted evidence set."
    ],
    evidence_limitations: unique(asArray(sourceBundle.limitations).concat(asArray(legalStackReview.limitations))).concat([
      "Public-footprint review cannot confirm non-public implementation or operational effectiveness of legal controls.",
      "Reviewed source inventory reflects materials admitted into the workflow, not a representation that every public source on the internet was captured."
    ]),
    reviewed_sources: reviewedSources,
    source_limitations: unique(asArray(sourceBundle.limitations).concat(asArray(legalStackReview.limitations)))
  });
}

function elementBlock(platformLegalDiligence, key) {
  const element = platformElementByKey(platformLegalDiligence, key);
  return element || { visible_label: key, activation_summary: "No specific signal was established from reviewed evidence.", detected_signals: {}, linked_identified_exposures: [], document_routes: [] };
}

function buildProductActivityProfile({ targetFeatureProfile, primaryProduct, platformLegalDiligence, hydratedRows }) {
  const targetProfileRef = safeObject(targetFeatureProfile.target_profile_ref);
  const features = asArray(targetFeatureProfile.feature_inventory);
  return withContract("product_activity_profile", {
    product_activity_thesis: `Based on the reviewed evidence, the target appears to operate a product/platform footprint involving ${unique(asArray(hydratedRows.rows).map((item) => item.functional_profile?.label)).join(", ") || "functional profiles not fully established"}. The legal review therefore focuses on product functionality, user-facing claims, data-processing indicators, automated-system reliance, provider dependencies, content/IP position, security/operational controls, and customer-contracting posture.`,
    platform_product_architecture: elementBlock(platformLegalDiligence, "platform_product_architecture"),
    data_processing_user_information_flows: elementBlock(platformLegalDiligence, "data_processing_user_information_flows"),
    automated_systems_output_reliance: elementBlock(platformLegalDiligence, "automated_systems_output_reliance"),
    content_output_ip_position: elementBlock(platformLegalDiligence, "content_output_ip_position"),
    third_party_infrastructure_dependencies: elementBlock(platformLegalDiligence, "third_party_provider_infrastructure_dependencies"),
    user_facing_claims_product_reliance: elementBlock(platformLegalDiligence, "user_facing_claims_product_reliance"),
    communications_user_interaction_flows: elementBlock(platformLegalDiligence, "communications_user_interaction_flows"),
    customer_contracting_reliance_position: elementBlock(platformLegalDiligence, "customer_contracting_reliance_position"),
    target_profile_ref: targetProfileRef,
    product_summary: primaryProduct,
    feature_inventory: features,
    data_provenance_map: asArray(targetFeatureProfile.data_provenance_map),
    regulated_surface_map: asArray(targetFeatureProfile.regulated_surface_map),
    architecture_hints: asArray(targetFeatureProfile.architecture_hints),
    commercial_scan: safeObject(targetFeatureProfile.commercial_scan),
    active_functional_profiles: unique(asArray(hydratedRows.rows).map((item) => item.functional_profile?.label)),
    active_legal_risk_surfaces: unique(asArray(hydratedRows.rows).flatMap((item) => item.legal_risk_surfaces || []))
  });
}

function surfaceCategory(surfaceName = "") {
  const lower = asText(surfaceName).toLowerCase();
  if (lower.includes("privacy") || lower.includes("data") || lower.includes("processor")) return "Data Processing";
  if (lower.includes("agent") || lower.includes("automated") || lower.includes("decision") || lower.includes("output") || lower.includes("ai")) return "Automated Systems";
  if (lower.includes("ip") || lower.includes("content") || lower.includes("training") || lower.includes("copyright")) return "Content / IP";
  if (lower.includes("security") || lower.includes("breach") || lower.includes("incident") || lower.includes("uptime")) return "Security / Operational Controls";
  if (lower.includes("provider") || lower.includes("vendor") || lower.includes("subprocessor") || lower.includes("cloud")) return "Third-Party Dependencies";
  if (lower.includes("claim") || lower.includes("consumer") || lower.includes("notice") || lower.includes("reliance")) return "User-Facing Claims";
  return "Customer Contracting";
}

function buildLegalRiskSurfaceMap({ surfaces, consolidatedFindings, hydratedRows }) {
  const controlRows = asArray(hydratedRows.control_evidenced_items);
  const activeSurfaces = asArray(surfaces).map((surface) => {
    const linkedFindings = asArray(consolidatedFindings).filter((finding) => asArray(finding.legal_risk_surfaces).includes(surface.legal_risk_surface));
    const linkedControls = controlRows.filter((item) => asArray(item.legal_risk_surfaces).includes(surface.legal_risk_surface));
    const category = surfaceCategory(surface.legal_risk_surface);
    return {
      ...surface,
      surface_category: category,
      why_surface_is_active: `${surface.legal_risk_surface} is active because reviewed product/activity or legal-stack evidence links this surface to ${surface.identified_exposures || 0} identified registry exposure item(s), ${surface.control_evidenced_items || 0} control-evidenced item(s), and ${surface.clarification_required_items || 0} clarification-required item(s).`,
      legal_consequence_category: category,
      linked_findings: linkedFindings.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, exposure_title: finding.exposure_title })),
      linked_controls: linkedControls.map((item) => ({ registry_reference: item.registry_reference, exposure_title: item.exposure_title, control_position: item.control_position }))
    };
  });
  return withContract("legal_risk_surface_map", {
    active_legal_surfaces: activeSurfaces,
    surface_activation_basis: activeSurfaces.map((surface) => ({ legal_risk_surface: surface.legal_risk_surface, why_surface_is_active: surface.why_surface_is_active })),
    legal_consequence_categories: unique(activeSurfaces.map((surface) => surface.legal_consequence_category)),
    linked_findings: activeSurfaces.flatMap((surface) => surface.linked_findings.map((finding) => ({ legal_risk_surface: surface.legal_risk_surface, ...finding }))),
    linked_controls: activeSurfaces.flatMap((surface) => surface.linked_controls.map((control) => ({ legal_risk_surface: surface.legal_risk_surface, ...control }))),
    surfaces: activeSurfaces
  });
}

function buildLegalStackControlReview({ legalStackReview, hydratedRows, consolidatedFindings }) {
  const legalStack = asArray(legalStackReview.legal_stack).map((doc) => ({
    document_type: asText(doc.document_type || doc.type, "Legal document"),
    exists: doc.exists === true,
    evidence_status: asText(doc.evidence_status, doc.exists === true ? "Evidenced" : "Not evidenced"),
    document_url: asText(doc.document_url || doc.url),
    controls_found: asArray(doc.controls_found || doc.covers),
    gaps_noted: asArray(doc.gaps_noted || doc.misses),
    review_note: asText(doc.review_note || doc.summary || doc.notes)
  }));
  const matrix = STANDARD_DOCUMENT_ROUTES.map((docType) => {
    const doc = documentRouteStatus(docType, legalStack);
    const linkedFindings = consolidatedFindings.filter((finding) => documentRouteFor(finding).includes(docType));
    return {
      document_type: docType,
      evidenced: doc.exists === true,
      evidence_status: doc.evidence_status,
      document_url: doc.document_url || "",
      coverage_purpose: `${docType} should be reviewed against exposure families linked to ${docType}.`,
      controls_found: asArray(doc.controls_found),
      gaps_noted: asArray(doc.gaps_noted),
      linked_consolidated_findings: linkedFindings.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, exposure_title: finding.exposure_title }))
    };
  });
  const controlEvidencedItems = asArray(hydratedRows.control_evidenced_items).map((item) => ({
    registry_reference: item.registry_reference,
    exposure_title: item.exposure_title,
    control_position: item.control_position,
    residual_watchpoint: item.residual_exposure,
    suggested_remediation_path: item.suggested_remediation_path
  }));
  const controlGaps = matrix.filter((row) => !row.evidenced || row.gaps_noted.length || row.linked_consolidated_findings.length).map((row) => ({
    document_type: row.document_type,
    gap: row.evidenced ? "Review document adequacy against linked exposure findings." : "Document/control not evidenced in reviewed material.",
    linked_consolidated_findings: row.linked_consolidated_findings
  }));
  const counselReviewPoints = consolidatedFindings.map((finding) => ({
    consolidated_finding_id: finding.consolidated_finding_id,
    exposure_title: finding.exposure_title,
    affected_documents: documentRouteFor(finding),
    counsel_review_point: `Review ${documentRouteFor(finding).join(", ")} for ${finding.exposure_title}.`
  }));
  return withContract("legal_stack_control_review", {
    document_inventory: legalStack.length ? legalStack : STANDARD_DOCUMENT_ROUTES.map((docType) => documentRouteStatus(docType, legalStack)),
    document_coverage_matrix: matrix,
    control_evidenced_items: controlEvidencedItems,
    control_gaps: controlGaps,
    counsel_review_points: counselReviewPoints,
    legal_stack_synthesis: {
      summary: `The legal stack review identified ${legalStack.filter((doc) => doc.exists).length} evidenced legal/control document(s) and ${controlEvidencedItems.length} control-evidenced registry item(s). Remaining identified exposure families should be reviewed against the document coverage matrix and counsel review points.`,
      document_stack_synthesis: legalStackReview.document_stack_synthesis || null,
      document_stack_redline: legalStackReview.document_stack_redline || [],
      legal_stack_assessment: legalStackReview.legal_stack_assessment || []
    },
    legal_stack: legalStack,
    document_stack_redline: legalStackReview.document_stack_redline || [],
    document_stack_synthesis: legalStackReview.document_stack_synthesis || null,
    legal_stack_assessment: legalStackReview.legal_stack_assessment || []
  });
}

function enrichConsolidatedFinding(finding) {
  const docs = documentRouteFor(finding);
  const controls = controlRouteFor(finding);
  return {
    ...finding,
    finding_statement: `The reviewed evidence indicates ${finding.exposure_title} across ${finding.supporting_registry_item_count} supporting registry exposure item(s).`,
    evidence_basis: {
      supporting_registry_references: finding.supporting_registry_references,
      supporting_registry_items: finding.supporting_registry_rows,
      reviewed_evidence_references: unique(asArray(finding.supporting_registry_rows).map((row) => row.reviewed_evidence?.evidence_reference).filter(Boolean))
    },
    legal_significance: finding.consolidated_summary,
    control_position: `Review the affected documents and controls for ${finding.exposure_title}. Public/admitted controls are not treated as sufficient unless reflected in the control-evidenced items or legal-stack matrix.`,
    affected_documents_controls: {
      affected_documents: docs,
      affected_controls: controls
    },
    recommended_remediation: {
      priority: priorityFor(finding),
      document_route: docs,
      control_route: controls,
      action: `Review and update ${docs.join(", ")} and confirm ${controls.join(", ")} for ${finding.exposure_title}.`,
      counsel_review_point: `Qualified counsel should verify whether the current legal stack and operational controls adequately address ${finding.exposure_title}.`
    }
  };
}

function buildExposureFindings({ consolidatedFindings, hydratedRows }) {
  const enriched = asArray(consolidatedFindings).map(enrichConsolidatedFinding);
  const supportingRows = asArray(hydratedRows.sorted_identified_exposures).map((item, index) => ({
    finding_id: `FIND-${String(index + 1).padStart(3, "0")}`,
    registry_reference: item.registry_reference,
    exposure_title: item.exposure_title,
    assessment_outcome: item.assessment_outcome,
    severity: item.severity.label,
    timing_urgency: item.timing_urgency.label,
    legal_risk_surfaces: item.legal_risk_surfaces,
    evidence_reference: item.reviewed_evidence.evidence_reference,
    control_position: item.control_position,
    commercial_deal_impact: item.commercial_deal_impact,
    suggested_remediation_path: item.suggested_remediation_path
  }));
  const detailCards = asArray(hydratedRows.sorted_identified_exposures).map((item, index) => ({
    finding_id: `FIND-${String(index + 1).padStart(3, "0")}`,
    exposure_title: item.exposure_title,
    registry_reference: item.registry_reference,
    assessment_outcome: item.assessment_outcome,
    severity: item.severity,
    timing_urgency: item.timing_urgency,
    use_context: item.use_context,
    functional_profile: item.functional_profile,
    legal_risk_surfaces: item.legal_risk_surfaces,
    jurisdictional_references: item.jurisdictional_references,
    why_this_applies: item.exposure_mechanism,
    reviewed_evidence: item.reviewed_evidence,
    control_position: item.control_position,
    residual_exposure: item.residual_exposure,
    legal_significance: item.legal_significance,
    commercial_deal_impact: item.commercial_deal_impact,
    clarification_points: item.clarification_points,
    suggested_remediation_path: item.suggested_remediation_path,
    counsel_review_note: item.counsel_review_note,
    registry_basis: item.registry_basis
  }));
  return withContract("exposure_findings", {
    consolidated_findings_schedule: enriched.map((finding) => ({
      consolidated_finding_id: finding.consolidated_finding_id,
      exposure_title: finding.exposure_title,
      supporting_registry_item_count: finding.supporting_registry_item_count,
      highest_severity: finding.highest_severity,
      priority: finding.recommended_remediation.priority,
      affected_documents: finding.affected_documents_controls.affected_documents
    })),
    finding_statements: enriched.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, finding_statement: finding.finding_statement })),
    evidence_basis: enriched.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, evidence_basis: finding.evidence_basis })),
    legal_significance: enriched.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, legal_significance: finding.legal_significance })),
    control_position: enriched.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, control_position: finding.control_position })),
    affected_documents_controls: enriched.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, ...finding.affected_documents_controls })),
    commercial_deal_impact: enriched.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, commercial_deal_impact: finding.commercial_deal_impact })),
    recommended_remediation: enriched.map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, ...finding.recommended_remediation })),
    supporting_registry_items: supportingRows,
    consolidated_findings: enriched,
    consolidated_count: enriched.length,
    supporting_registry_rows: supportingRows,
    supporting_registry_row_count: supportingRows.length,
    detail_cards: detailCards,
    count: supportingRows.length
  });
}

function buildEvidenceGaps({ hydratedRows, legalStackControlReview, consolidatedFindings }) {
  const missingDocs = missingDocuments(asArray(legalStackControlReview.document_inventory || legalStackControlReview.legal_stack));
  const clarificationRows = asArray(hydratedRows.clarification_required_items);
  const informationRequests = clarificationRows.map((item) => ({
    request_id: `IR-${item.registry_reference}`,
    question: asArray(item.clarification_points)[0] || `Clarify the factual and control position for ${item.exposure_title}.`,
    why_it_matters: item.legal_significance,
    evidence_requested: item.residual_exposure,
    priority: item.severity?.label || "Clarification priority not specified",
    consequence_if_unresolved: item.commercial_deal_impact,
    linked_registry_reference: item.registry_reference
  })).concat(missingDocs.map((doc, index) => ({
    request_id: `IR-DOC-${String(index + 1).padStart(2, "0")}`,
    question: `Provide or confirm the status of ${doc.document_type}.`,
    why_it_matters: `${doc.document_type} may be required to confirm control position for one or more exposure findings.`,
    evidence_requested: doc.requested_evidence,
    priority: "Document/control confirmation",
    consequence_if_unresolved: "The report cannot confirm whether the legal stack adequately addresses the related exposure families without this document/control evidence.",
    linked_registry_reference: "Document evidence request"
  })));
  return withContract("evidence_gaps_clarification_points", {
    open_information_request_list: informationRequests,
    missing_documents: missingDocs,
    missing_factual_confirmations: clarificationRows.map((item) => ({ registry_reference: item.registry_reference, exposure_title: item.exposure_title, clarification_points: item.clarification_points })),
    consequence_if_unresolved: informationRequests.map((item) => ({ request_id: item.request_id, consequence_if_unresolved: item.consequence_if_unresolved })),
    clarification_required_items: clarificationRows.map((item) => ({
      registry_reference: item.registry_reference,
      exposure_title: item.exposure_title,
      why_it_matters: item.legal_significance,
      evidence_missing_or_unclear: item.residual_exposure,
      clarification_points: item.clarification_points,
      potential_consequence: item.commercial_deal_impact
    })),
    consolidated_findings_requiring_confirmation: consolidatedFindings.filter((finding) => documentRouteFor(finding).some((doc) => missingDocs.map((entry) => entry.document_type).includes(doc))).map((finding) => ({ consolidated_finding_id: finding.consolidated_finding_id, exposure_title: finding.exposure_title }))
  });
}

function buildMethodology({ registryRuntime }) {
  return withContract("methodology_limitations_review_notes", {
    methodology: [
      "Reviewed admitted public and legal-stack evidence captured by the prior review workflow.",
      "Mapped the company/product profile, product activity, legal stack, and registry assessment into the locked diligence report structure.",
      "Grouped identified registry exposure items into client-facing exposure findings while preserving row-level proof in the forensic appendix.",
      "Assembled Stage 9 deterministically from upstream outputs; no new model inference is used to write the report."
    ],
    stage_roles: [
      "Company/profile stage: establishes target and public-footprint context.",
      "Product/activity stage: classifies platform functionality, surfaces, and feature evidence.",
      "Legal-stack stage: reviews public/admitted legal documents and control signals.",
      "Registry evaluation stage: evaluates applicable registry rows against the evidence set.",
      "Challenge review stage: checks the registry ledger before report assembly.",
      "Report assembly stage: deterministically assembles the diligence report, remediation route, and forensic appendix."
    ],
    status_definitions: STATUS_DEFINITIONS,
    legal_limitations: [
      REVIEW_READY_DISCLAIMER,
      "This report is a legal architecture and diligence-support output, not a legal opinion.",
      "Jurisdiction-specific legal conclusions, negotiation positions, enforceability views, and filing/implementation decisions require qualified counsel review."
    ],
    evidence_limitations: [
      "No source code, private customer contracts, data room, SOC reports, implementation evidence, internal policies, or security questionnaires were reviewed unless admitted into the evidence set.",
      "Absence of evidence in public/admitted sources does not prove absence of an internal control.",
      "The forensic ledger is an issue-spotting and traceability appendix for counsel review."
    ],
    registry_version: registryRuntime?.version || "Registry version not specified",
    counsel_review_note: REVIEW_READY_DISCLAIMER,
    limitations: [
      "This report is based only on admitted evidence available to the review workflow.",
      "Absence of public or admitted evidence does not prove absence of internal controls.",
      "Registry references are issue-spotting anchors and do not replace jurisdiction-specific legal advice.",
      "Qualified counsel must review before reliance, negotiation, filing, implementation, or client delivery."
    ],
    review_method: [
      "Reviewed admitted matter evidence and public/legal sources captured by the prior review workflow.",
      "Mapped product/activity profile and legal risk surfaces against the Legal Exposure Registry.",
      "Consolidated identified registry exposure items into client-facing exposure families for report readability.",
      "Preserved a forensic ledger for counsel review."
    ]
  });
}

export function synthesizeDiligenceReportSections({
  targetName,
  primaryUrl,
  primaryProduct,
  sourceBundle = {},
  targetFeatureProfile = {},
  legalStackReview = {},
  hydratedRows = {},
  consolidatedFindings = [],
  surfaces = [],
  reviewedSources = [],
  stage7Artifact = {},
  stage8Ledger = {},
  registryRuntime = {},
  generatedAt = new Date().toISOString()
} = {}) {
  const platformLegalDiligence = buildPlatformLegalDiligence({
    targetFeatureProfile,
    legalStackControlReview: legalStackReview,
    hydratedRows,
    reviewedSources
  });
  const legalStackControlReview = buildLegalStackControlReview({ legalStackReview, hydratedRows, consolidatedFindings });
  const enrichedFindings = buildExposureFindings({ consolidatedFindings, hydratedRows });
  const remediationPath = withContract("implications_remediation_path", buildImplicationsRemediationPath({
    consolidatedFindings: enrichedFindings.consolidated_findings,
    controlEvidencedItems: hydratedRows.control_evidenced_items,
    matterSensitivity: asArray(hydratedRows.identified_exposures).some((item) => item.severity?.category === "Deal / Customer Approval Risk") ? "Transaction / Customer Approval Sensitive" : "Product / Policy Review Sensitive"
  }));

  return {
    matter_overview: buildMatterOverview({ targetName, primaryProduct, primaryUrl, sourceBundle, reviewedSources, registryRuntime, generatedAt }),
    executive_exposure_summary: buildExecutiveSummary({ hydratedRows, consolidatedFindings: enrichedFindings.consolidated_findings, surfaces }),
    evidence_reviewed: buildEvidenceReviewed({ reviewedSources, sourceBundle, legalStackReview }),
    product_activity_profile: buildProductActivityProfile({ targetFeatureProfile, primaryProduct, platformLegalDiligence, hydratedRows }),
    legal_risk_surface_map: buildLegalRiskSurfaceMap({ surfaces, consolidatedFindings: enrichedFindings.consolidated_findings, hydratedRows }),
    legal_stack_control_review: legalStackControlReview,
    exposure_findings: enrichedFindings,
    evidence_gaps_clarification_points: buildEvidenceGaps({ hydratedRows, legalStackControlReview, consolidatedFindings: enrichedFindings.consolidated_findings }),
    implications_remediation_path: remediationPath,
    methodology_limitations_review_notes: buildMethodology({ registryRuntime }),
    forensic_ledger_appendix: withContract("forensic_ledger_appendix", buildForensicLedgerAppendix({ hydratedRows, stage7Artifact, stage8Ledger })),
    platform_legal_diligence: platformLegalDiligence
  };
}
