const FALLBACK_SECTIONS = [
  ["matter_overview", "Overview"],
  ["executive_summary", "Executive Summary"],
  ["target_profile", "Target"],
  ["product_activity_ip_profile", "Product & IP"],
  ["data_risk_provenance_controls", "Data"],
  ["legal_document_control_review", "Legal Docs"],
  ["exposure_findings", "Findings"],
  ["implications_remediation_path", "Remediation"],
  ["evidence_gaps_clarification_points", "Gaps"],
  ["methodology_limitations_review_notes", "Methodology"],
  ["forensic_ledger_appendix", "Appendix"]
];

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function text(value, fallback = "—") {
  if (value === null || value === undefined || value === "") return fallback;
  if (Array.isArray(value)) return value.length ? value.join(", ") : fallback;
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function titleize(key = "") {
  return String(key).replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase());
}

function asList(items, className = "bullet-list") {
  const rows = safeArray(items).filter((item) => item !== null && item !== undefined && item !== "");
  if (!rows.length) return `<p class="muted">No items recorded.</p>`;
  return `<ul class="${className}">${rows.map((item) => `<li>${renderInlineValue(item)}</li>`).join("")}</ul>`;
}

function renderInlineValue(value) {
  if (value == null || value === "") return "—";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return escapeHtml(value);
  if (Array.isArray(value)) return escapeHtml(value.map((item) => typeof item === "object" ? JSON.stringify(item) : String(item)).join(", "));
  return escapeHtml(JSON.stringify(value));
}

function table(headers, rows, options = {}) {
  const limitedRows = options.limit ? safeArray(rows).slice(0, options.limit) : safeArray(rows);
  if (!limitedRows.length) return `<p class="muted">No rows recorded.</p>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header.label)}</th>`).join("")}</tr></thead>
        <tbody>
          ${limitedRows.map((row) => `
            <tr>${headers.map((header) => `<td>${header.render ? header.render(row) : escapeHtml(text(row[header.key]))}</td>`).join("")}</tr>
          `).join("")}
        </tbody>
      </table>
    </div>`;
}

function metricCard(label, value, note = "") {
  return `
    <article class="metric-card">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(text(value, "0"))}</div>
      ${note ? `<div class="metric-note">${escapeHtml(note)}</div>` : ""}
    </article>`;
}

function section(id, eyebrow, title, body, extraClass = "") {
  return `
    <section class="report-section ${extraClass}" id="${escapeHtml(id)}">
      <div class="section-heading"><span class="eyebrow">${escapeHtml(eyebrow)}</span><h2>${escapeHtml(title)}</h2></div>
      ${body}
    </section>`;
}

function subsection(title, body, note = "") {
  return `
    <article class="card-shell report-subsection">
      <div class="subsection-heading"><h3>${escapeHtml(title)}</h3>${note ? `<p class="muted">${escapeHtml(note)}</p>` : ""}</div>
      ${body}
    </article>`;
}

function renderObjectBlocks(sectionData = {}, exclude = new Set(["key", "heading", "content_contract"])) {
  return Object.entries(sectionData)
    .filter(([key]) => !exclude.has(key))
    .map(([key, value]) => subsection(titleize(key), renderValue(value)))
    .join("");
}

function renderValue(value) {
  if (value == null || value === "") return `<p class="muted">No value recorded.</p>`;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return `<p>${escapeHtml(value)}</p>`;
  if (Array.isArray(value)) {
    if (!value.length) return `<p class="muted">No rows recorded.</p>`;
    if (value.every((item) => item && typeof item === "object" && !Array.isArray(item))) {
      const keys = [...new Set(value.flatMap((row) => Object.keys(row)).filter((key) => !key.startsWith("_")).slice(0, 6))];
      return table(keys.map((key) => ({ label: titleize(key), key })), value, { limit: 20 });
    }
    return asList(value);
  }
  if (typeof value === "object") {
    const entries = Object.entries(value).filter(([key]) => !key.startsWith("_"));
    if (!entries.length) return `<p class="muted">No values recorded.</p>`;
    return `<dl class="matter-dl compact">${entries.map(([key, child]) => `<div><dt>${escapeHtml(titleize(key))}</dt><dd>${renderInlineValue(child)}</dd></div>`).join("")}</dl>`;
  }
  return `<p>${escapeHtml(String(value))}</p>`;
}

function renderTopNav(navItems) {
  return `
    <nav class="top-nav" aria-label="Report navigation">
      <div class="brand-mark">LEX NOVA</div>
      <div class="nav-links">${navItems.map(([id, label]) => `<a href="#${escapeHtml(id)}">${escapeHtml(label)}</a>`).join("")}</div>
    </nav>`;
}

function renderRail(navItems) {
  return `
    <aside class="review-rail" aria-label="Review map">
      <div class="rail-title">Review Map</div>
      ${navItems.map(([id, label], index) => `<a class="rail-item" href="#${escapeHtml(id)}"><span class="rail-dot">${String(index + 1).padStart(2, "0")}</span><span>${escapeHtml(label)}</span></a>`).join("")}
    </aside>`;
}

function renderMatterOverview(report) {
  const overview = report.matter_overview || {};
  const identity = overview.matter_identity || {};
  const scope = overview.review_scope || {};
  const body = `
    <div class="hero-grid">
      <div class="document-panel hero-card">
        <div class="doc-kicker">Legal Exposure Diligence Report</div>
        <h1>${escapeHtml(text(identity.target_name, "Target"))}</h1>
        <p class="lead">${escapeHtml(text(identity.primary_product_or_service, "Matter evidence review"))}</p>
        <dl class="matter-dl">
          <div><dt>Website</dt><dd>${identity.website ? `<a href="${escapeHtml(identity.website)}">${escapeHtml(identity.website)}</a>` : "—"}</dd></div>
          <div><dt>Domain</dt><dd>${escapeHtml(text(identity.domain))}</dd></div>
          <div><dt>Report Status</dt><dd>${escapeHtml(text(identity.report_status))}</dd></div>
          <div><dt>Reviewed Sources</dt><dd>${escapeHtml(text(scope.reviewed_source_count, "0"))}</dd></div>
        </dl>
      </div>
      <div class="hero-side">
        ${metricCard("Reviewed Sources", scope.reviewed_source_count || 0)}
        ${metricCard("Local Counsel", overview.local_counsel_review_required ? "Required" : "Review")}
        ${metricCard("Report Version", "v2")}
      </div>
    </div>
    <div class="notice-box">${escapeHtml(text(overview.reliance_disclaimer))}</div>`;
  return section("matter_overview", "01", "Matter Overview", body, "hero-section");
}

function renderExecutiveSummary(report) {
  const summary = report.executive_summary || {};
  const posture = summary.executive_posture || {};
  const exposure = summary.exposure_posture || {};
  const evidence = summary.evidence_posture || {};
  const body = `
    <div class="summary-band">
      <article class="posture-card"><span class="eyebrow">Overall Review Priority</span><div class="posture-value">${escapeHtml(text(posture.overall_review_priority, "Not assessed"))}</div><p>${escapeHtml(text(posture.summary))}</p></article>
      <div class="metric-grid">
        ${metricCard("Findings", exposure.critical_or_high_findings_count || 0, "Critical/high findings")}
        ${metricCard("Categories", exposure.finding_category_count || 0, "Finding categories")}
        ${metricCard("Evidence Gaps", evidence.major_evidence_gaps_count || 0, "Open clarification signals")}
      </div>
    </div>
    <div class="section-stack">${renderObjectBlocks(summary)}</div>`;
  return section("executive_summary", "02", "Executive Summary", body);
}

function renderFindings(report) {
  const findings = report.exposure_findings || {};
  const categories = safeArray(findings.exposure_category_groups);
  const rows = safeArray(findings.finding_rows);
  const body = `
    ${subsection("Exposure Categories", table([
      { label: "Category", key: "category_label" },
      { label: "Findings", key: "finding_count" },
      { label: "Highest Severity", render: (row) => escapeHtml(text(row.highest_severity?.label || row.highest_severity)) },
      { label: "Counsel Summary", key: "summary_for_counsel" }
    ], categories))}
    ${subsection("Finding Rows", table([
      { label: "Finding", render: (row) => `<strong>${escapeHtml(text(row.finding_id))}</strong><div class="muted small">${escapeHtml(text(row.category_label))}</div>` },
      { label: "Title", key: "finding_title" },
      { label: "Severity", render: (row) => escapeHtml(text(row.severity?.label || row.severity)) },
      { label: "Legal Pain", key: "legal_pain" },
      { label: "Recommended Action", key: "recommended_action" }
    ], rows))}`;
  return section("exposure_findings", "07", "Exposure Findings", body);
}

function renderAppendix(report) {
  const appendix = report.forensic_ledger_appendix || {};
  const summary = appendix.full_ledger_summary || {};
  const ledger = safeArray(appendix.full_registry_ledger || appendix.forensic_ledger);
  const body = `
    <div class="metric-grid compact-grid">
      ${metricCard("Registry Count", summary.registry_count || 0)}
      ${metricCard("Rows Evaluated", summary.rows_evaluated || ledger.length)}
      ${Object.entries(summary.status_counts || {}).map(([label, value]) => metricCard(label, value)).join("")}
    </div>
    ${subsection("Forensic Ledger Preview", table([
      { label: "Appendix Ref", key: "appendix_ref" },
      { label: "Threat ID", key: "threat_id" },
      { label: "Threat Name", key: "threat_name" },
      { label: "Final Status", key: "final_status" },
      { label: "Human Category", key: "human_category" }
    ], ledger, { limit: 120 }), "Registry-level detail is intentionally confined to this appendix.")}`;
  return section("forensic_ledger_appendix", "11", "Forensic Ledger Appendix", body);
}

function renderGenericSection(key, index, report) {
  const sectionData = report[key] || {};
  return section(key, String(index + 1).padStart(2, "0"), sectionData.heading || titleize(key), `<div class="section-stack">${renderObjectBlocks(sectionData)}</div>`);
}

function styles() {
  return `
    :root { --void:#050505; --surface:#0c0c0c; --line:rgba(197,160,89,.28); --gold:#C5A059; --gold2:#e1c178; --marble:#e8e5dc; --muted:#a8a49a; --ink:#161616; --paper:#f4efe3; }
    * { box-sizing:border-box; } html { scroll-behavior:smooth; } body { margin:0; background:radial-gradient(circle at 15% 0%, rgba(197,160,89,.14), transparent 34%), linear-gradient(180deg, #050505 0%, #090909 42%, #050505 100%); color:var(--marble); font-family:Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.55; }
    a { color:var(--gold2); text-decoration:none; } a:hover { text-decoration:underline; }
    .top-nav { position:sticky; top:0; z-index:20; backdrop-filter:blur(18px); background:rgba(5,5,5,.84); border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; padding:14px 28px; }
    .brand-mark { font-family:Georgia, "Times New Roman", serif; letter-spacing:.18em; color:var(--gold); font-weight:700; font-size:13px; } .nav-links { display:flex; gap:14px; flex-wrap:wrap; justify-content:flex-end; } .nav-links a { color:#ddd7c9; font-size:13px; }
    .layout { display:grid; grid-template-columns:250px minmax(0, 1fr); gap:28px; max-width:1480px; margin:0 auto; padding:36px 28px 80px; } .review-rail { position:sticky; top:74px; align-self:start; padding:18px; background:rgba(12,12,12,.72); border:1px solid var(--line); border-radius:22px; }
    .rail-title { color:var(--gold); font-family:Georgia,serif; font-size:14px; margin-bottom:14px; letter-spacing:.08em; text-transform:uppercase; } .rail-item { display:flex; align-items:center; gap:10px; padding:10px 8px; color:#ddd7c9; border-radius:14px; } .rail-dot { width:30px; height:30px; display:inline-grid; place-items:center; border:1px solid var(--line); border-radius:50%; color:var(--gold); font-size:11px; }
    .report-section { margin-bottom:34px; scroll-margin-top:88px; } .section-heading { margin:10px 0 18px; } .eyebrow { color:var(--gold); text-transform:uppercase; letter-spacing:.2em; font-size:12px; }
    h1,h2,h3,h4 { font-family:Georgia, "Times New Roman", serif; font-weight:500; line-height:1.15; margin:0 0 14px; } h1 { font-size:clamp(42px, 7vw, 86px); color:#fff8e6; } h2 { font-size:clamp(28px, 4vw, 52px); color:#fff8e6; } h3 { font-size:24px; color:#fff8e6; }
    .lead { font-size:20px; color:#d7d0c0; } .hero-grid { display:grid; grid-template-columns:minmax(0, 1fr) 320px; gap:22px; } .hero-side, .section-stack { display:grid; gap:14px; }
    .card-shell, .metric-card, .document-panel, .posture-card { background:linear-gradient(180deg, rgba(20,20,20,.96), rgba(10,10,10,.96)); border:1px solid var(--line); border-radius:24px; padding:22px; box-shadow:0 22px 80px rgba(0,0,0,.25); }
    .doc-kicker { color:var(--gold); letter-spacing:.16em; text-transform:uppercase; font-size:12px; margin-bottom:14px; } .matter-dl { display:grid; grid-template-columns:repeat(2, minmax(0,1fr)); gap:14px 18px; } .matter-dl dt { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; } .matter-dl dd { margin:2px 0 0; color:#fff8e6; }
    .notice-box { margin-top:18px; border:1px solid var(--line); background:rgba(197,160,89,.08); border-radius:18px; padding:16px 18px; color:#e9deca; } .summary-band { display:grid; grid-template-columns:380px minmax(0,1fr); gap:18px; margin-bottom:18px; } .posture-value { font-size:36px; color:#fff8e6; font-family:Georgia,serif; }
    .metric-grid { display:grid; grid-template-columns:repeat(3, minmax(0,1fr)); gap:14px; } .compact-grid { grid-template-columns:repeat(5, minmax(0,1fr)); } .metric-label { color:var(--muted); text-transform:uppercase; letter-spacing:.08em; font-size:11px; } .metric-value { color:#fff8e6; font-size:28px; font-family:Georgia,serif; margin-top:4px; } .metric-note, .muted { color:var(--muted); } .small { font-size:12px; }
    .bullet-list { margin:0; padding-left:18px; color:#ddd7c9; } .bullet-list li { margin:7px 0; } .table-wrap { overflow:auto; border:1px solid rgba(255,255,255,.08); border-radius:16px; } table { width:100%; border-collapse:collapse; min-width:720px; } th, td { text-align:left; vertical-align:top; padding:12px 14px; border-bottom:1px solid rgba(255,255,255,.07); } th { color:var(--gold); font-size:11px; text-transform:uppercase; letter-spacing:.08em; background:rgba(197,160,89,.06); } td { color:#e4dfd2; font-size:13px; }
    @media (max-width: 1050px) { .layout { grid-template-columns:1fr; } .review-rail { display:none; } .hero-grid, .summary-band { grid-template-columns:1fr; } .metric-grid { grid-template-columns:repeat(2, minmax(0,1fr)); } }
    @media print { body { background:white; color:#111; } .top-nav, .review-rail { display:none; } .layout { display:block; padding:0; } .card-shell, .metric-card, .document-panel, .posture-card { box-shadow:none; break-inside:avoid; } }
  `;
}

export function renderLegalExposureReport(stage9ReportData) {
  const reportShell = stage9ReportData?.report || {};
  const report = reportShell.report_data || stage9ReportData?.report_data || {};
  const navItems = safeArray(reportShell.navigation).length
    ? reportShell.navigation.map((item) => [item.key, item.label])
    : FALLBACK_SECTIONS;
  const title = report.matter_overview?.matter_identity?.target_name || "Legal Exposure Diligence Report";
  const customRenderers = {
    matter_overview: renderMatterOverview,
    executive_summary: renderExecutiveSummary,
    exposure_findings: renderFindings,
    forensic_ledger_appendix: renderAppendix
  };
  const body = `
    ${renderTopNav(navItems)}
    <div class="layout">
      ${renderRail(navItems)}
      <main class="report-main">
        ${navItems.map(([key], index) => customRenderers[key] ? customRenderers[key](report) : renderGenericSection(key, index, report)).join("")}
      </main>
    </div>`;
  return `<!doctype html><html lang="en"><head><meta charset="utf-8" /><meta name="viewport" content="width=device-width, initial-scale=1" /><title>${escapeHtml(title)} — Legal Exposure Diligence Report</title><style>${styles()}</style></head><body>${body}</body></html>`;
}
