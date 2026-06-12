import { asList, card, escapeHtml, keyValue, metricCard, safeArray, section, table, text } from "./htmlReportPrimitives.js";

export function renderMatterOverview(report) {
  const matter = report.matter_overview || {};
  const identity = matter.report_identity || {};
  const scope = matter.review_scope || {};
  const cutoff = matter.evidence_cut_off || {};
  return section("overview", "01", "Matter Overview", `
    <div class="hero">
      <div class="doc"><p class="kicker">Legal Exposure Diligence Report</p><h1>${escapeHtml(text(identity.target_or_client || matter.target_or_client, "Target"))}</h1><p class="lead">${escapeHtml(text(identity.product_or_matter || matter.product_or_matter, "Matter evidence review"))}</p>${keyValue([["Primary URL", identity.primary_url], ["Review Mode", identity.review_mode], ["Report Date", identity.report_date], ["Report Version", identity.report_version], ["Report Status", matter.report_status]])}</div>
      <div class="metrics">${metricCard("Reviewed Sources", scope.reviewed_source_count || report.evidence_reviewed?.reviewed_sources?.length || 0)}${metricCard("Rows Assessed", report.forensic_ledger_appendix?.registry_count || 0)}${metricCard("Forensic Ledger", report.forensic_ledger_appendix?.ledger_count || 0)}</div>
    </div>
    ${card("Review Scope", asList(scope.reviewed_material))}
    ${card("Scope Limitations", asList(matter.scope_limitations))}
    ${card("Evidence Cut-Off", keyValue([["Generated At", cutoff.generated_at], ["Evidence Basis", cutoff.evidence_basis], ["Registry Version", cutoff.registry_version]]))}
    <div class="notice">${escapeHtml(text(matter.reliance_disclaimer || matter.disclaimer))}</div>
  `);
}

export function renderExecutiveSummary(report) {
  const summary = report.executive_exposure_summary || {};
  const posture = summary.executive_posture || {};
  const numbers = summary.key_numbers || {};
  const counts = numbers.status_counts || summary.status_counts || {};
  const themes = safeArray(summary.top_exposure_themes);
  const priorities = safeArray(summary.immediate_review_priorities);
  const control = summary.control_position || {};
  return section("executive-summary", "02", "Executive Exposure Summary", `
    <div class="summary"><article class="posture"><span>Executive Posture</span><h3>${escapeHtml(text(posture.posture || summary.overall_exposure_posture, "Not assessed"))}</h3><p>${escapeHtml(text(posture.judgment || summary.recommended_next_step))}</p></article><div class="metrics">${metricCard("Consolidated Exposure Findings", numbers.consolidated_exposure_findings || summary.consolidated_exposure_findings || 0)}${metricCard("Identified Registry Exposure Items", numbers.identified_registry_exposure_items || summary.identified_registry_exposure_items || 0)}${metricCard("Rows Assessed", numbers.registry_rows_assessed || summary.registry_rows_assessed || 0)}${metricCard("Clarification Required", numbers.clarification_required_items || 0)}${Object.entries(counts).map(([key, value]) => metricCard(key, value)).join("")}</div></div>
    ${card("Top Exposure Themes", table([{ label: "Finding", key: "consolidated_finding_id" }, { label: "Theme", key: "exposure_title" }, { label: "Supporting Items", key: "supporting_registry_item_count" }, { label: "Severity", key: "severity" }, { label: "Affected Documents", render: (row) => escapeHtml(text(row.affected_documents)) }], themes))}
    ${card("Control Position", `<p>${escapeHtml(text(control.summary))}</p>${table([{ label: "Registry Reference", key: "registry_reference" }, { label: "Exposure Title", key: "exposure_title" }, { label: "Control Position", key: "control_position" }], control.control_evidenced_items)}`)}
    ${card("Immediate Review Priorities", table([{ label: "Finding", key: "consolidated_finding_id" }, { label: "Exposure", key: "exposure_title" }, { label: "Priority", key: "priority" }, { label: "Counsel Review Point", key: "counsel_review_point" }], priorities))}
    ${card("Executive Conclusion", `<p class="lead small">${escapeHtml(text(summary.executive_conclusion))}</p>`)}
  `);
}

function platformBlock(element = {}) {
  const signals = element.detected_signals || {};
  return `<details open><summary>${escapeHtml(text(element.visible_label || element.review_lens))}</summary><p>${escapeHtml(text(element.activation_summary))}</p>${keyValue([["Linked Identified Exposures", text(element.linked_identified_exposures)], ["Linked Control-Evidenced Items", text(element.linked_control_evidenced_items)], ["Document Routes", text(element.document_routes)]])}${table([{ label: "Feature", key: "feature_name" }, { label: "Role", key: "feature_role" }, { label: "Functional Profile", key: "functional_profile" }, { label: "Risk Surfaces", key: "risk_surfaces" }], signals.product_features)}</details>`;
}

export function renderEvidenceAndProfile(report) {
  const evidence = report.evidence_reviewed || {};
  const profile = report.product_activity_profile || {};
  const surfaceMap = report.legal_risk_surface_map || {};
  const inventory = evidence.evidence_inventory || {};
  const sources = safeArray(inventory.reviewed_sources || evidence.reviewed_sources);
  const features = safeArray(report.feature_profile_v2?.feature_inventory || profile.feature_inventory);
  const productSummary = profile.product_summary || {};
  const blocks = [profile.platform_product_architecture, profile.data_processing_user_information_flows, profile.automated_systems_output_reliance, profile.content_output_ip_position, profile.third_party_infrastructure_dependencies, profile.user_facing_claims_product_reliance, profile.communications_user_interaction_flows, profile.customer_contracting_reliance_position];
  const surfaces = safeArray(surfaceMap.active_legal_surfaces || surfaceMap.surfaces);
  return section("evidence-profile", "03", "Evidence & Profile", `
    ${card("Evidence Reviewed", `${keyValue([["Reviewed Source Count", inventory.reviewed_source_count || sources.length]])}${table([{ label: "Source", render: (row) => `<b>${escapeHtml(text(row.title || row.source_type))}</b>` }, { label: "Type", key: "source_type" }, { label: "Evidence Mode", key: "evidence_mode" }, { label: "URL", render: (row) => row.source_url ? `<a href="${escapeHtml(row.source_url)}">Open source</a>` : "—" }], sources)}<h4>Evidence Categories</h4>${table([{ label: "Category", key: "category" }, { label: "Source Count", key: "source_count" }], evidence.evidence_categories)}<h4>Evidence Not Reviewed</h4>${asList(evidence.evidence_not_reviewed)}<h4>Evidence Limitations</h4>${asList(evidence.evidence_limitations)}`)}
    ${card("Product & Activity Profile", `<p class="lead small">${escapeHtml(text(profile.product_activity_thesis))}</p>${keyValue([["Product Summary", productSummary.product_name || productSummary.name], ["Function", productSummary.function], ["Mechanism", productSummary.mechanism], ["Active Functional Profiles", text(profile.active_functional_profiles)], ["Active Legal Risk Surfaces", text(profile.active_legal_risk_surfaces)]])}<h4>Feature Inventory</h4>${table([{ label: "Feature", render: (row) => `<b>${escapeHtml(text(row.feature_name))}</b><p class="muted">${escapeHtml(text(row.feature_description))}</p>` }, { label: "Role", key: "feature_role" }, { label: "Functional Profile", render: (row) => escapeHtml(text(row.archetype_labels || row.archetype_codes)) }, { label: "Risk Surfaces", render: (row) => escapeHtml(text(row.surface_tokens)) }, { label: "Source", render: (row) => row.feature_source_url ? `<a href="${escapeHtml(row.feature_source_url)}">Open source</a>` : "—" }], features)}<h4>Platform Legal Diligence Lenses</h4>${blocks.map(platformBlock).join("")}`)}
    ${card("Legal Risk Surface Map", table([{ label: "Legal Risk Surface", key: "legal_risk_surface" }, { label: "Category", key: "surface_category" }, { label: "Why Active", key: "why_surface_is_active" }, { label: "Legal Consequence", key: "legal_consequence_category" }, { label: "Linked Findings", render: (row) => escapeHtml(text(safeArray(row.linked_findings).map((item) => `${item.consolidated_finding_id} ${item.exposure_title}`))) }, { label: "Linked Controls", render: (row) => escapeHtml(text(safeArray(row.linked_controls).map((item) => item.registry_reference))) }], surfaces))}
  `);
}
