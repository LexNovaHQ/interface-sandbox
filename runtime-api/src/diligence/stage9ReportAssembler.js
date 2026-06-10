import { makeReportShell, makeSection } from "./reportSectionContract.js";
import { REVIEW_READY_DISCLAIMER, displayStatus } from "./reportTerminologyMap.js";
import { hydrateRegistryReportRows, statusCounts } from "./reportRegistryHydrator.js";

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

function getTargetName({ companyProfile, targetFeatureProfile, sourceBundle }) {
  return asText(
    companyProfile?.company_name ||
      companyProfile?.target_name ||
      companyProfile?.target?.name ||
      targetFeatureProfile?.target_profile?.target_name ||
      targetFeatureProfile?.target_profile?.company_name ||
      sourceBundle?.target_url ||
      sourceBundle?.target_domain,
    "Target not specified"
  );
}

function getPrimaryProduct(targetFeatureProfile = {}) {
  const primary = targetFeatureProfile.primary_product || targetFeatureProfile.target_profile?.primary_product || {};
  if (typeof primary === "string") return { name: primary };
  return safeObject(primary);
}

function sourceInventory(sourceBundle = {}) {
  const evidenceBuffer = asArray(sourceBundle.evidence_buffer);
  const artifacts = asArray(sourceBundle.artifact_inventory);
  const sourceReview = sourceBundle.source_review || {};
  const fromEvidence = evidenceBuffer.map((record, index) => ({
    source_id: asText(record.source_id || record.id, `SRC-${String(index + 1).padStart(3, "0")}`),
    source_url: asText(record.source_url || record.url),
    source_type: asText(record.source_type || record.artifact_class || record.document_type || "Reviewed source"),
    title: asText(record.title || record.document_type || record.source_url || record.url || `Reviewed source ${index + 1}`),
    evidence_mode: asText(record.evidence_mode || record.capture_mode || "Admitted evidence")
  }));
  if (fromEvidence.length) return fromEvidence;
  return artifacts.map((artifact, index) => ({
    source_id: asText(artifact.source_id || artifact.id, `SRC-${String(index + 1).padStart(3, "0")}`),
    source_url: asText(artifact.source_url || artifact.url),
    source_type: asText(artifact.artifact_class || artifact.source_type || "Reviewed artifact"),
    title: asText(artifact.title || artifact.source_url || artifact.url || `Reviewed artifact ${index + 1}`),
    evidence_mode: asText(artifact.evidence_mode || "Admitted evidence")
  })).concat(asArray(sourceReview.sources_reviewed || sourceReview.reviewed_sources));
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

function buildLegalStackControlReview(legalStackReview = {}, hydratedRows) {
  const legalStack = asArray(legalStackReview.legal_stack).map((doc) => ({
    document_type: asText(doc.document_type || doc.type || "Legal document"),
    exists: doc.exists === true,
    evidence_status: asText(doc.evidence_status || "Not specified"),
    document_url: asText(doc.document_url || doc.url),
    controls_found: asArray(doc.covers).map((item) => asText(item)).filter(Boolean),
    gaps_noted: asArray(doc.misses).map((item) => asText(item)).filter(Boolean),
    review_note: asText(doc.review_note || doc.summary || doc.notes)
  }));

  const controlledByDocument = hydratedRows.control_evidenced_items.slice(0, 12).map((item) => ({
    registry_reference: item.registry_reference,
    exposure_title: item.exposure_title,
    control_position: item.control_position,
    residual_watchpoint: item.residual_exposure,
    suggested_remediation_path: item.suggested_remediation_path
  }));

  return {
    legal_stack: legalStack,
    document_stack_redline: asArray(legalStackReview.document_stack_redline),
    document_stack_synthesis: legalStackReview.document_stack_synthesis || null,
    legal_stack_assessment: asArray(legalStackReview.legal_stack_assessment),
    control_evidenced_items: controlledByDocument
  };
}

function findingSchedule(items) {
  return items.map((item, index) => ({
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
}

function findingCards(items) {
  return items.map((item, index) => ({
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
    registry_basis: item.registry_basis,
    applicability_summary: {
      satisfied_criteria: item.applicability_test.criteria.satisfied,
      not_satisfied_criteria: item.applicability_test.criteria.not_satisfied,
      finding_threshold: item.applicability_test.finding_threshold,
      finding_threshold_outcome: item.applicability_test.finding_threshold_outcome,
      control_exclusion_test: item.applicability_test.control_exclusion_test,
      control_test_outcome: item.applicability_test.control_test_outcome
    }
  }));
}

function remediationPriority(item) {
  const tier = item.severity.tier;
  const velocity = item.timing_urgency.raw;
  if (["T1", "T2"].includes(tier) || velocity === "ACTIVE_NOW") return "Priority 1 — Immediate / Pre-Signing / Pre-Launch";
  if (["T3", "T4"].includes(tier) || velocity === "THIS_YEAR") return "Priority 2 — Customer / Enterprise Readiness";
  return "Priority 3 — Governance Maturity / Cleanup";
}

function buildRemediation(items) {
  const groups = new Map();
  for (const item of items) {
    const priority = remediationPriority(item);
    if (!groups.has(priority)) groups.set(priority, []);
    groups.get(priority).push({
      registry_reference: item.registry_reference,
      exposure_title: item.exposure_title,
      suggested_remediation_path: item.suggested_remediation_path,
      linked_surfaces: item.legal_risk_surfaces,
      timing_urgency: item.timing_urgency.label,
      counsel_review_required: true
    });
  }
  return [...groups.entries()].map(([priority, actions]) => ({ priority, actions }));
}

function buildExecutiveSummary({ hydratedRows, surfaceMap }) {
  const topFindings = hydratedRows.sorted_identified_exposures.slice(0, 5);
  const topControls = hydratedRows.control_evidenced_items.slice(0, 5);
  const gaps = hydratedRows.clarification_required_items.slice(0, 5);
  const highSeverityCount = hydratedRows.identified_exposures.filter((item) => ["T1", "T2"].includes(item.severity.tier)).length;
  const posture = highSeverityCount >= 3 || hydratedRows.identified_exposures.length >= 25 ? "High" : highSeverityCount >= 1 || hydratedRows.identified_exposures.length >= 8 ? "Moderate-High" : hydratedRows.identified_exposures.length ? "Moderate" : "Low on reviewed evidence";
  return {
    overall_exposure_posture: posture,
    status_counts: Object.fromEntries(Object.entries(hydratedRows.status_counts).map(([status, count]) => [displayStatus(status), count])),
    top_red_flags: topFindings.map((item) => ({ registry_reference: item.registry_reference, exposure_title: item.exposure_title, severity: item.severity.label, timing_urgency: item.timing_urgency.label, commercial_deal_impact: item.commercial_deal_impact })),
    controls_already_found: topControls.map((item) => ({ registry_reference: item.registry_reference, exposure_title: item.exposure_title, control_position: item.control_position, residual_watchpoint: item.residual_exposure })),
    evidence_gaps_or_unknowns: gaps.map((item) => ({ registry_reference: item.registry_reference, exposure_title: item.exposure_title, clarification_points: item.clarification_points })),
    active_legal_risk_surfaces: surfaceMap.map((surface) => surface.legal_risk_surface),
    recommended_next_step: hydratedRows.identified_exposures.length ? "Review the identified exposures with qualified counsel, request clarification evidence for unresolved items, and route remediation through the legal stack and control areas identified in this report." : "Review the methodology and evidence set with qualified counsel before relying on the absence of identified exposures."
  };
}

function matterMode({ hydratedRows }) {
  const hasDealDeath = hydratedRows.identified_exposures.some((item) => item.severity.category === "Deal Death");
  const hasEnterprise = hydratedRows.rows.some((item) => item.legal_risk_surfaces.includes("Enterprise-Private"));
  if (hasDealDeath || hasEnterprise) return "Transaction / Customer Approval Sensitive";
  return "Product / Policy Review Sensitive";
}

function buildForensicLedger(hydratedRows) {
  return hydratedRows.rows.map((item) => ({
    registry_reference: item.registry_reference,
    exposure_title: item.exposure_title,
    assessment_outcome: item.assessment_outcome,
    functional_profile: item.functional_profile,
    legal_risk_surfaces: item.legal_risk_surfaces,
    severity: item.severity,
    timing_urgency: item.timing_urgency,
    finding_threshold_outcome: item.applicability_test.finding_threshold_outcome,
    control_test_outcome: item.applicability_test.control_test_outcome,
    evidence_reference: item.reviewed_evidence.evidence_reference,
    registry_basis: item.registry_basis
  }));
}

export function buildStage9Report({ stage6Cache, stage7Artifact, stage8Ledger, registryRuntime }) {
  const sourceBundle = stage6Cache?.source_bundle || {};
  const companyProfile = stage6Cache?.company_profile || {};
  const targetFeatureProfile = stage6Cache?.target_feature_profile || {};
  const legalStackReview = stage6Cache?.legal_stack_review || {};
  const postChallengeLedger = asArray(stage8Ledger?.post_challenge_ledger || stage7Artifact?.merged_ledger);
  const hydratedRows = hydrateRegistryReportRows({ registryRuntime, postChallengeLedger });
  const surfaces = activeSurfaceMap(hydratedRows);
  const primaryProduct = getPrimaryProduct(targetFeatureProfile);
  const report = makeReportShell();

  report.report_data.matter_overview = makeSection("matter_overview", {
    target_or_client: getTargetName({ companyProfile, targetFeatureProfile, sourceBundle }),
    product_or_matter: asText(primaryProduct.name || primaryProduct.product_name || targetFeatureProfile?.target_profile?.primary_product_name, "Product / matter not specified"),
    review_type: "Legal Exposure Diligence",
    evidence_mode: sourceBundle?.source_mode || sourceBundle?.evidence_mode || "Matter evidence review",
    jurisdictions_flagged: unique(hydratedRows.rows.flatMap((item) => Object.entries(item.jurisdictional_references).filter(([, value]) => value).map(([key]) => key))),
    report_status: "Review-Ready Draft — Counsel Review Required",
    disclaimer: REVIEW_READY_DISCLAIMER
  });

  report.report_data.executive_exposure_summary = makeSection("executive_exposure_summary", buildExecutiveSummary({ hydratedRows, surfaceMap: surfaces }));

  report.report_data.evidence_reviewed = makeSection("evidence_reviewed", {
    reviewed_sources: sourceInventory(sourceBundle),
    evidence_not_reviewed: [
      "Internal controls, workflows, and policies not included in the admitted evidence set.",
      "Customer contracts, security questionnaires, and deployment matrices unless expressly present in the admitted evidence set.",
      "Jurisdiction-specific counsel conclusions beyond the registry references and reviewed evidence."
    ],
    source_limitations: asArray(sourceBundle.limitations).concat(asArray(legalStackReview.limitations)).map((item) => asText(item)).filter(Boolean)
  });

  report.report_data.product_activity_profile = makeSection("product_activity_profile", {
    target_profile: targetFeatureProfile.target_profile || {},
    primary_product: primaryProduct,
    product_feature_map: asArray(targetFeatureProfile.product_feature_map),
    active_functional_profiles: unique(hydratedRows.rows.map((item) => item.functional_profile.label)),
    active_legal_risk_surfaces: surfaces.map((surface) => surface.legal_risk_surface)
  });

  report.report_data.legal_risk_surface_map = makeSection("legal_risk_surface_map", {
    surfaces
  });

  report.report_data.legal_stack_control_review = makeSection("legal_stack_control_review", buildLegalStackControlReview(legalStackReview, hydratedRows));

  report.report_data.exposure_findings = makeSection("exposure_findings", {
    schedule: findingSchedule(hydratedRows.sorted_identified_exposures),
    detail_cards: findingCards(hydratedRows.sorted_identified_exposures),
    count: hydratedRows.identified_exposures.length
  });

  report.report_data.evidence_gaps_clarification_points = makeSection("evidence_gaps_clarification_points", {
    clarification_required_items: hydratedRows.clarification_required_items.map((item) => ({
      registry_reference: item.registry_reference,
      exposure_title: item.exposure_title,
      why_it_matters: item.legal_significance,
      evidence_missing_or_unclear: item.residual_exposure,
      clarification_points: item.clarification_points,
      potential_consequence: item.commercial_deal_impact
    }))
  });

  report.report_data.implications_remediation_path = makeSection("implications_remediation_path", {
    matter_sensitivity: matterMode({ hydratedRows }),
    remediation_priority_map: buildRemediation(hydratedRows.sorted_identified_exposures),
    control_follow_up: hydratedRows.control_evidenced_items.map((item) => ({
      registry_reference: item.registry_reference,
      exposure_title: item.exposure_title,
      residual_watchpoint: item.residual_exposure,
      suggested_remediation_path: item.suggested_remediation_path
    }))
  });

  report.report_data.methodology_limitations_review_notes = makeSection("methodology_limitations_review_notes", {
    review_method: [
      "Reviewed admitted matter evidence and public/legal sources captured by the prior review workflow.",
      "Mapped product/activity profile and legal risk surfaces against the Legal Exposure Registry.",
      "Separated identified exposures, control-evidenced items, clarification-required items, no-finding items, and outside-scope items.",
      "Preserved a forensic ledger for counsel review."
    ],
    limitations: [
      "This report is based only on admitted evidence available to the review workflow.",
      "Absence of public or admitted evidence does not prove absence of internal controls.",
      "Registry references are issue-spotting anchors and do not replace jurisdiction-specific legal advice.",
      "Qualified counsel must review before reliance, negotiation, filing, implementation, or client delivery."
    ],
    counsel_review_note: REVIEW_READY_DISCLAIMER
  });

  report.report_data.forensic_ledger_appendix = makeSection("forensic_ledger_appendix", {
    registry_count: hydratedRows.registry_count,
    ledger_count: hydratedRows.rows.length,
    status_counts: Object.fromEntries(Object.entries(hydratedRows.status_counts).map(([status, count]) => [displayStatus(status), count])),
    source_stage7_summary: stage7Artifact?.summary || null,
    source_stage8_operator_gate: stage8Ledger?.operator_challenge_gate || null,
    forensic_ledger: buildForensicLedger(hydratedRows)
  });

  return {
    artifact_type: "stage9_legal_exposure_report_data",
    generated_at: new Date().toISOString(),
    report,
    hydrated_registry_rows: hydratedRows,
    source_meta: {
      stage7_artifact_type: stage7Artifact?.artifact_type || null,
      stage8_artifact_type: stage8Ledger?.artifact_type || null,
      registry_version: registryRuntime?.version || null
    },
    validation_expectations: {
      status_counts: statusCounts(postChallengeLedger),
      ledger_count: postChallengeLedger.length,
      registry_count: hydratedRows.registry_count
    }
  };
}
