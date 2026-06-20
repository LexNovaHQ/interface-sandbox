const MAIN_SECTIONS = Object.freeze([
  ["matter_overview", "01", "Matter Overview"],
  ["executive_summary", "02", "Executive Summary"],
  ["target_profile", "03", "Target Profile"],
  ["product_activity_ip_profile", "04", "Product / Activity / IP Profile"],
  ["data_risk_provenance_controls", "05", "Data Risk, Provenance & Controls"],
  ["legal_document_control_review", "06", "Legal Document & Control Review"],
  ["exposure_findings", "07", "Exposure Findings"],
  ["implications_remediation_path", "08", "Implications & Remediation Path"],
  ["evidence_gaps_clarification_points", "09", "Evidence Gaps & Clarification Points"],
  ["methodology_limitations_review_notes", "10", "Methodology, Limitations & Review Notes"]
]);

const APPENDICES = Object.freeze([
  ["appendix_a_evidence_source_index", "Appendix A — Evidence Source Index"],
  ["appendix_b_feature_ledger", "Appendix B — Feature Ledger"],
  ["appendix_c_data_provenance_ledger", "Appendix C — Data Provenance Ledger"],
  ["appendix_d_legal_control_ledger", "Appendix D — Legal / Control Ledger"],
  ["appendix_e_exposure_forensic_ledger", "Appendix E — Exposure Forensic Ledger"],
  ["appendix_f_quality_review_trace", "Appendix F — Quality Review / Correction Trace"]
]);

const LABELS = Object.freeze({
  finding_reference: "Finding Ref",
  appendix_provenance: "Appendix Provenance",
  appendix_ref: "Appendix Ref",
  exposure_issue: "Exposure Issue",
  triggering_ai_function: "Triggering AI Function",
  product_data_hook: "Product / Data Hook",
  legal_surface_and_jurisdiction: "Legal Surface & Jurisdiction",
  assessment_and_priority: "Assessment & Priority",
  evidence_and_applicability_basis: "Evidence & Applicability Basis",
  control_position_or_gap: "Control Position / Gap",
  counsel_review_or_remediation: "Counsel Review / Remediation",
  feature_reference: "Feature Ref",
  data_flow_reference: "Data Flow Ref",
  document_or_control_reference: "Document / Control Ref",
  source_ref: "Source Ref",
  source_family: "Source Family",
  text_hash: "Text Hash",
  source_limitation: "Source Limitation",
  feature_ref: "Feature Ref",
  data_flow_ref: "Data Flow Ref",
  linked_feature_ref: "Linked Feature Ref",
  document_ref: "Document Ref",
  legal_unit_ref: "Legal Unit Ref",
  control_signal_ref: "Control Signal Ref",
  gap_ref: "Gap Ref",
  threat_id: "Registry Row ID",
  registry_row_id: "Registry Row ID",
  raw_severity_tier: "Raw Severity Tier",
  raw_assessment_status: "Raw Assessment Status",
  raw_route_reason: "Raw Route Reason",
  raw_registry_payload: "Raw Registry Payload",
  finding_threshold_outcome: "Finding Threshold Outcome",
  control_test_outcome: "Control Test Outcome",
  main_report_severity_label: "Main Report Severity Label",
  main_report_assessment_outcome: "Main Report Assessment Outcome"
});

const VISIBLE_HTML_BANNED_TERMS = Object.freeze([
  /\bthreat_id\b/i,
  /\bThreat_ID\b/,
  /\bregistry_reference\b/i,
  /\bRegistry Reference\b/i,
  /\bHunter\b/i,
  /\btrigger_if_result\b/i,
  /\bexclude_if_result\b/i,
  /\bfinal_status\b/i,
  /\bTRIGGERED\b/,
  /\bCONTROLLED\b/,
  /\bINSUFFICIENT_EVIDENCE\b/,
  /\bNOT_TRIGGERED\b/,
  /\bNOT_APPLICABLE\b/,
  /\bOperator Challenge\b/i,
  /\bVault\b/,
  /\bNode 5B\b/i,
  /\bRows Assessed\b/i,
  /\bRegistry Rows\b/i,
  /\bRegistry Items\b/i,
  /\bT[1-5]\b/
]);

const esc = (value) => String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#039;");
const arr = (value) => Array.isArray(value) ? value : [];
const isObj = (value) => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const label = (key = "") => LABELS[key] || String(key).replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
const get = (root, path) => String(path || "").split(".").reduce((acc, key) => acc?.[key], root);

function text(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.map((item) => text(item, "")).filter(Boolean).join(", ") : fallback;
  if (isObj(value)) return Object.entries(value).filter(([, child]) => child !== null && child !== undefined && child !== "").map(([key, child]) => `${label(key)}: ${text(child, "")}`).join("; ") || fallback;
  return String(value);
}

function inline(value) {
  if (value === null || value === undefined || value === "") return "—";
  if (Array.isArray(value)) return value.length ? `<ul class="mini-list">${value.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>` : "—";
  if (isObj(value)) {
    const rows = Object.entries(value).filter(([, child]) => child !== null && child !== undefined && child !== "");
    return rows.length ? `<dl class="inline-kv">${rows.map(([key, child]) => `<div><dt>${esc(label(key))}</dt><dd>${inline(child)}</dd></div>`).join("")}</dl>` : "—";
  }
  return esc(value);
}

function list(items) {
  const rows = arr(items).filter(Boolean);
  return rows.length ? `<ul class="bullet-list">${rows.map((item) => `<li>${inline(item)}</li>`).join("")}</ul>` : `<p class="muted">No items recorded.</p>`;
}

function allKeys(rows) {
  const keys = new Set();
  for (const row of arr(rows)) if (isObj(row)) for (const key of Object.keys(row)) if (!key.startsWith("_")) keys.add(key);
  return [...keys];
}

function table(columns, rows, className = "") {
  const data = arr(rows);
  if (!data.length) return `<p class="muted">No rows recorded.</p>`;
  return `<div class="table-wrap ${esc(className)}"><table><thead><tr>${columns.map((column) => `<th>${esc(column.label)}</th>`).join("")}</tr></thead><tbody>${data.map((row) => `<tr>${columns.map((column) => `<td>${column.render ? column.render(row) : inline(get(row, column.key))}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}

function fullTable(rows) {
  const keys = allKeys(rows);
  return keys.length ? table(keys.map((key) => ({ label: label(key), key })), rows, "forensic-table") : `<p class="muted">No rows recorded.</p>`;
}

function card(title, body, note = "") { return `<article class="card"><div class="card-title"><h3>${esc(title)}</h3>${note ? `<p class="muted">${esc(note)}</p>` : ""}</div>${body}</article>`; }
function section(id, number, title, body, extra = "") { return `<section id="${esc(id)}" class="report-section ${esc(extra)}"><div class="section-title"><span>${esc(number)}</span><h2>${esc(title)}</h2></div>${body}</section>`; }
function metric(title, value) { return `<article class="metric"><div>${esc(title)}</div><strong>${esc(text(value, "0"))}</strong></article>`; }
function kv(rows) { return `<dl class="kv">${arr(rows).map(([title, value]) => `<div><dt>${esc(title)}</dt><dd>${inline(value)}</dd></div>`).join("")}</dl>`; }
function nav() { return `<nav class="top"><b>LEX NOVA</b><div>${MAIN_SECTIONS.map(([id,, title]) => `<a href="#${esc(id)}">${esc(title.split(" & ")[0])}</a>`).join("")}<a href="#appendices">Appendices</a></div></nav>`; }
function rail() { return `<aside class="rail"><h4>Review Map</h4>${MAIN_SECTIONS.concat([["appendices", "11", "Appendices"]]).map(([id, number, title]) => `<a href="#${esc(id)}"><span>${esc(number)}</span>${esc(title)}</a>`).join("")}</aside>`; }

function renderMatterOverview(report) {
  const matter = report.matter_overview || {};
  const identity = matter.matter_identity || {};
  const scope = matter.review_scope || {};
  const summary = report.forensic_ledger_appendix?.full_ledger_summary || {};
  return section("matter_overview", "01", "Matter Overview", `<div class="hero"><div class="doc"><p class="kicker">Legal Exposure Diligence Report</p><h1>${esc(text(identity.target_name, "Target"))}</h1><p class="lead">${esc(text(identity.primary_product_or_service, "Matter evidence review"))}</p>${kv([["Primary URL", identity.website], ["Domain", identity.domain], ["Report Status", identity.report_status], ["Local Counsel Review", matter.local_counsel_review_required === true ? "Required" : "Required before reliance"]])}</div><div class="metrics">${metric("Reviewed Sources", scope.reviewed_source_count || summary.source_rows)}${metric("Exposure Findings", report.exposure_findings?.count)}${metric("Forensic Appendices", APPENDICES.length)}</div></div>${card("Review Scope", list(scope.reviewed_material_summary || scope.reviewed_material))}${card("Materials Not Reviewed", list(scope.not_reviewed || matter.scope_limitations))}<div class="notice">${esc(text(matter.reliance_disclaimer || matter.disclaimer))}</div>`, "hero-section");
}

function renderExecutiveSummary(report) {
  const posture = report.executive_summary?.executive_posture || {};
  const summary = report.forensic_ledger_appendix?.full_ledger_summary || {};
  const findings = arr(report.exposure_findings?.integrated_exposure_matrix);
  return section("executive_summary", "02", "Executive Summary", `<div class="summary"><article class="posture"><span>Overall Review Priority</span><h3>${esc(text(posture.overall_review_priority, "Review priority not separately classified"))}</h3><p>${esc(text(posture.summary, "Review findings and appendix provenance before delivery."))}</p></article><div class="metrics">${metric("Integrated Findings", findings.length)}${metric("Product Functions", summary.feature_rows)}${metric("Data Flows", summary.data_flow_rows)}${metric("Legal / Control Rows", summary.legal_control_rows)}</div></div>${card("Top Counsel Review Queue", table([{ label: "Finding Ref", key: "finding_reference" }, { label: "Exposure Issue", render: (row) => inline(row.exposure_issue) }, { label: "Priority", render: (row) => inline(row.assessment_and_priority) }, { label: "Appendix", key: "appendix_provenance" }], findings.slice(0, 6)))}${card("Evidence Posture", kv([["Reviewed source count", summary.source_rows], ["Feature rows", summary.feature_rows], ["Data-flow rows", summary.data_flow_rows], ["Legal/control rows", summary.legal_control_rows]]))}`);
}

function renderTargetProfile(report) {
  const snapshot = report.target_profile?.target_snapshot || {};
  return section("target_profile", "03", "Target Profile", card("Target Snapshot", kv([["Target Identity", snapshot.target_identity], ["Jurisdictional Profile", snapshot.jurisdictional_profile], ["Business Model Profile", snapshot.business_model_profile], ["Market Context", snapshot.market_context], ["Product Baseline", snapshot.product_baseline], ["Evidence Provenance", snapshot.evidence_provenance_note]])));
}

function renderProduct(report) {
  const product = report.product_activity_ip_profile || {};
  return section("product_activity_ip_profile", "04", "Product / Activity / IP Profile", `${card("Product Activity Thesis", `<p>${esc(text(product.product_activity_thesis))}</p>`)}${card("Product / AI Function Matrix", table([{ label: "Feature Ref", key: "feature_reference" }, { label: "Product Function", key: "product_function" }, { label: "Triggering AI Function", key: "triggering_ai_function" }, { label: "Input / Output Pattern", render: (row) => inline(row.input_output_pattern) }, { label: "Autonomy / Human Review", key: "autonomy_and_human_review" }, { label: "Legal Risk Surface", key: "legal_risk_surface" }, { label: "Provenance", key: "evidence_provenance" }], product.product_function_matrix))}${card("Product Profile Summary", kv([["Total product functions", product.product_profile_summary?.total_features], ["Triggering AI functions", product.product_profile_summary?.triggering_ai_functions], ["Legal risk surfaces", product.product_profile_summary?.legal_risk_surfaces], ["Appendix provenance", product.appendix_provenance_note]]))}`);
}

function renderData(report) {
  const data = report.data_risk_provenance_controls || {};
  return section("data_risk_provenance_controls", "05", "Data Risk, Provenance & Controls", `${card("Data Risk Thesis", `<p>${esc(text(data.data_risk_thesis))}</p>`)}${card("Data Control Matrix", table([{ label: "Data Flow Ref", key: "data_flow_reference" }, { label: "Linked Product Function", key: "linked_product_function" }, { label: "Data Subject / Category", key: "data_subject_and_category" }, { label: "Processing Purpose / Action", key: "processing_purpose_and_action" }, { label: "Role / Provider Chain", key: "role_and_provider_chain" }, { label: "Transfer / Retention / Security", key: "transfer_retention_security_position" }, { label: "Control / Gap", key: "control_or_gap_position" }, { label: "Provenance", key: "appendix_provenance" }], data.data_control_matrix))}${card("Data Flow Summary", kv([["Total data flows", data.data_flow_summary?.total_data_flows], ["Provider-chain signals", data.data_flow_summary?.data_flows_with_provider_chain], ["Retention/deletion signals", data.data_flow_summary?.data_flows_with_retention_or_deletion_position], ["Appendix provenance", data.appendix_provenance_note]]))}`);
}

function renderLegal(report) {
  const legal = report.legal_document_control_review || {};
  return section("legal_document_control_review", "06", "Legal Document & Control Review", `${card("Legal Document Review Thesis", `<p>${esc(text(legal.legal_document_review_thesis))}</p>`)}${card("Legal / Control Matrix", table([{ label: "Document / Control Ref", key: "document_or_control_reference" }, { label: "Document / Control Area", key: "document_or_control_area" }, { label: "Public Evidence Status", key: "public_evidence_status" }, { label: "Control Signal", key: "control_signal" }, { label: "Gap / Mismatch", key: "gap_or_mismatch" }, { label: "Linked Exposure Findings", key: "linked_exposure_findings" }, { label: "Counsel Review Point", key: "counsel_review_point" }, { label: "Provenance", key: "appendix_provenance" }], legal.legal_control_matrix))}${card("Document / Control Summary", kv([["Documents found", legal.document_inventory_summary?.total_documents_found], ["Control signals", legal.document_inventory_summary?.control_signal_count], ["Gap or mismatch signals", legal.document_inventory_summary?.gap_or_mismatch_count], ["Appendix provenance", legal.appendix_provenance_note]]))}`);
}

function renderExposure(report) {
  const exposure = report.exposure_findings || {};
  const rows = arr(exposure.integrated_exposure_matrix || exposure.finding_rows);
  return section("exposure_findings", "07", "Exposure Findings", `${card("Integrated Exposure Matrix", table([{ label: "Finding Ref", key: "finding_reference" }, { label: "Exposure Issue", render: (row) => inline(row.exposure_issue) }, { label: "Triggering AI Function", key: "triggering_ai_function" }, { label: "Product / Data Hook", render: (row) => inline(row.product_data_hook) }, { label: "Legal Surface & Jurisdiction", render: (row) => inline(row.legal_surface_and_jurisdiction) }, { label: "Assessment & Priority", render: (row) => inline(row.assessment_and_priority) }, { label: "Evidence & Applicability Basis", render: (row) => inline(row.evidence_and_applicability_basis) }, { label: "Control Position / Gap", render: (row) => inline(row.control_position_or_gap) }, { label: "Counsel Review / Remediation", render: (row) => inline(row.counsel_review_or_remediation) }, { label: "Appendix Provenance", key: "appendix_provenance" }], rows, "wide-table"), "Rows marked (*) route to the forensic appendices for full provenance.")}${card("Exposure Category Groups", table([{ label: "Category", key: "category_label" }, { label: "Finding Count", key: "finding_count" }, { label: "Highest Priority", key: "highest_severity" }, { label: "Timing", key: "highest_velocity" }, { label: "Counsel Summary", key: "summary_for_counsel" }], exposure.exposure_category_groups))}${card("Appendix Crosswalk", table([{ label: "Finding Ref", key: "finding_reference" }, { label: "Appendix Provenance", key: "appendix_provenance" }], exposure.appendix_crosswalk))}`);
}

function renderRemediation(report) {
  const remediation = report.implications_remediation_path || {};
  return section("implications_remediation_path", "08", "Implications & Remediation Path", `${card("Remediation Thesis", `<p>${esc(text(remediation.remediation_thesis))}</p>`)}${card("Action Queue", table([{ label: "Action Ref", key: "action_reference" }, { label: "Linked Finding", key: "linked_finding" }, { label: "Required Review", key: "required_review" }, { label: "Owner / Workstream", key: "owner_or_workstream" }, { label: "Priority", key: "priority" }, { label: "Output Needed", key: "output_needed" }, { label: "Open Question / Blocker", key: "open_question_or_blocker" }, { label: "Appendix Provenance", key: "appendix_provenance" }], remediation.action_queue))}${card("Review-Ready Handoff Bridge", kv([["Summary", remediation.review_ready_handoff_bridge?.summary], ["Local counsel review required", remediation.review_ready_handoff_bridge?.local_counsel_review_required === true ? "Yes" : "Yes, before reliance"]]))}`);
}

function renderGaps(report) {
  const gaps = report.evidence_gaps_clarification_points || {};
  return section("evidence_gaps_clarification_points", "09", "Evidence Gaps & Clarification Points", `${card("Open Information Requests", table([{ label: "Request Ref", key: "request_reference" }, { label: "Clarification Needed", key: "clarification_needed" }, { label: "Why It Matters", key: "why_it_matters" }, { label: "Requested Evidence", key: "requested_evidence" }, { label: "Linked Finding / Section", key: "linked_finding_or_section" }, { label: "Consequence If Unresolved", key: "consequence_if_unresolved" }, { label: "Appendix Provenance", key: "appendix_provenance" }], gaps.open_information_requests))}${card("Missing Documents", table([{ label: "Request Ref", key: "request_reference" }, { label: "Document Type", key: "document_type" }, { label: "Reason Needed", key: "reason_needed" }], gaps.missing_documents))}${card("Missing Factual Confirmations", table([{ label: "Confirmation Ref", key: "confirmation_reference" }, { label: "Question", key: "question" }], gaps.missing_factual_confirmations))}${card("Evidence Limitations", list(gaps.evidence_limitations))}`);
}

function renderMethodology(report) {
  const methodology = report.methodology_limitations_review_notes || {};
  return section("methodology_limitations_review_notes", "10", "Methodology, Limitations & Review Notes", `${card("Methodology", list(methodology.methodology))}${card("Review Workflow Roles", table([{ label: "Review Step", key: "review_step" }, { label: "Purpose", key: "purpose" }], methodology.stage_roles))}${card("Assessment Outcome Definitions", table([{ label: "Outcome", key: "status" }, { label: "Meaning", key: "meaning" }], methodology.status_definitions))}${card("Legal Limitations", list(methodology.legal_limitations))}${card("Evidence Limitations", list(methodology.evidence_limitations))}${card("Review Framework Note", `<p>${esc(text(methodology.review_framework_note))}</p>`)}${card("Reviewer Notes", list(methodology.reviewer_notes))}`);
}

function renderAppendices(report) {
  const appendix = report.forensic_ledger_appendix || {};
  const blocks = APPENDICES.map(([key, title]) => { const rows = arr(appendix[key]); return card(title, `<div class="appendix-count">${esc(String(rows.length))} row(s)</div>${fullTable(rows)}`, "Full forensic provenance table. Main report rows marked (*) route here."); }).join("");
  return `<div id="appendices" class="appendix-zone"><!--APPENDICES_START-->${section("appendix_hub", "11", "Forensic Appendices", `<div class="notice">${esc(text(appendix.appendix_notice || "Appendices preserve full forensic provenance for reviewer and counsel audit."))}</div>${card("Appendix Summary", kv([["Source rows", appendix.full_ledger_summary?.source_rows], ["Feature rows", appendix.full_ledger_summary?.feature_rows], ["Data-flow rows", appendix.full_ledger_summary?.data_flow_rows], ["Legal/control rows", appendix.full_ledger_summary?.legal_control_rows], ["Exposure rows", appendix.full_ledger_summary?.exposure_rows], ["Quality review rows", appendix.full_ledger_summary?.quality_trace_rows]]))}${blocks}`)}</div>`;
}

function renderBody(report) { return [renderMatterOverview(report), renderExecutiveSummary(report), renderTargetProfile(report), renderProduct(report), renderData(report), renderLegal(report), renderExposure(report), renderRemediation(report), renderGaps(report), renderMethodology(report), renderAppendices(report)].join(""); }

export function validateRenderedLegalExposureReportHtml(html = "") {
  const visibleMain = String(html || "").split("<!--APPENDICES_START-->")[0] || "";
  const violations = VISIBLE_HTML_BANNED_TERMS.filter((pattern) => pattern.test(visibleMain)).map((pattern) => String(pattern).replace(/^\/|\/[a-z]*$/gi, ""));
  return { ok: violations.length === 0, visible_language_violations: violations };
}

export function renderLegalExposureReport(stage9ReportData) {
  const reportShell = stage9ReportData?.report || {};
  const report = reportShell.report_data || {};
  const missing = MAIN_SECTIONS.map(([key]) => key).filter((key) => !isObj(report[key]));
  if (missing.length) throw new Error(`Locked Stage 9 JSON missing report section(s): ${missing.join(", ")}`);
  if (!isObj(report.forensic_ledger_appendix)) throw new Error("Locked Stage 9 JSON missing forensic_ledger_appendix section.");
  const title = reportShell.report_title || "Legal Exposure Diligence Report";
  const generatedAt = stage9ReportData?.generated_at || reportShell.generated_at || "";
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><style>${styles()}</style></head><body data-generated-at="${esc(generatedAt)}">${nav()}<div class="layout">${rail()}<main>${renderBody(report)}</main></div></body></html>`;
  const validation = validateRenderedLegalExposureReportHtml(html);
  if (!validation.ok) { const error = new Error(`Stage 9 HTML visible-language validation failed: ${validation.visible_language_violations.join(", ")}`); error.result = validation; throw error; }
  return html;
}

function styles() { return `:root{--bg:#050505;--line:rgba(197,160,89,.32);--gold:#C5A059;--gold2:#e8ca7a;--text:#e8e2d4;--muted:#aaa}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:radial-gradient(circle at 10% 0,rgba(197,160,89,.18),transparent 30%),#050505;color:var(--text);font-family:Inter,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;line-height:1.55}a{color:var(--gold2)}.top{position:sticky;top:0;z-index:5;background:rgba(5,5,5,.9);backdrop-filter:blur(16px);border-bottom:1px solid var(--line);display:flex;justify-content:space-between;padding:14px 28px}.top b{font-family:Georgia,serif;color:var(--gold);letter-spacing:.18em}.top div{display:flex;gap:16px;flex-wrap:wrap}.top a{color:var(--text);font-size:13px;text-decoration:none}.layout{max-width:1580px;margin:auto;display:grid;grid-template-columns:245px 1fr;gap:28px;padding:34px 28px 80px}.rail{position:sticky;top:76px;align-self:start;border:1px solid var(--line);background:rgba(17,17,17,.78);border-radius:22px;padding:18px}.rail h4{color:var(--gold);letter-spacing:.1em;text-transform:uppercase}.rail a{display:flex;gap:10px;padding:10px;color:var(--text);text-decoration:none}.rail span{color:var(--gold)}.report-section{margin-bottom:34px;scroll-margin-top:88px}.section-title span,.kicker{color:var(--gold);letter-spacing:.18em;text-transform:uppercase;font-size:12px}.section-title h2,h1,h3,h4{font-family:Georgia,serif;color:#fff8e6}h1{font-size:clamp(42px,7vw,84px);margin:.1em 0}.lead{font-size:19px;color:#d7d0c0}.hero,.summary{display:grid;grid-template-columns:1fr 330px;gap:20px}.doc,.card,.metric,.posture{border:1px solid var(--line);background:linear-gradient(180deg,#151515,#0b0b0b);border-radius:22px;padding:22px;box-shadow:0 20px 70px rgba(0,0,0,.25)}.card{margin:16px 0}.card-title{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}.metrics{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px}.metric div{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.metric strong{display:block;font:30px Georgia,serif;color:#fff8e6}.metric small,.muted{color:var(--muted)}.kv{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:12px}.kv dt,.inline-kv dt{font-size:11px;color:var(--muted);text-transform:uppercase;letter-spacing:.08em}.kv dd,.inline-kv dd{margin:3px 0 0;color:#fff8e6;word-break:break-word}.inline-kv{display:grid;gap:8px;margin:0}.inline-kv div{padding-bottom:8px;border-bottom:1px solid rgba(197,160,89,.12)}.notice{border:1px solid var(--line);background:rgba(197,160,89,.08);border-radius:16px;padding:16px;margin:16px 0}.bullet-list,.mini-list{margin:0;padding-left:18px}.bullet-list li,.mini-list li{margin:6px 0}.table-wrap{overflow:auto;border:1px solid rgba(197,160,89,.18);border-radius:16px;margin:10px 0}table{border-collapse:collapse;width:100%;min-width:840px}th,td{padding:10px 12px;border-bottom:1px solid rgba(197,160,89,.12);vertical-align:top;font-size:13px}th{text-align:left;color:#f2dfb3;background:rgba(197,160,89,.08);text-transform:uppercase;font-size:11px;letter-spacing:.08em}td{color:#eee7d8}.wide-table table{min-width:1400px}.forensic-table table{min-width:1700px}.appendix-zone{border-top:2px solid var(--line);margin-top:40px;padding-top:12px}.appendix-count{color:var(--gold2);font-weight:700;margin-bottom:8px}@media(max-width:1000px){.layout,.hero,.summary{display:block}.rail{display:none}.metrics{grid-template-columns:1fr}}@media print{.top,.rail{display:none}.layout{display:block;padding:0}.card,.doc,.metric,.posture{box-shadow:none;break-inside:avoid}.table-wrap{overflow:visible}table{min-width:0}}`; }
