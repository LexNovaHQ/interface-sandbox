const REPORT_SECTIONS = [
  ["overview", "Overview"],
  ["executive-summary", "Executive Summary"],
  ["evidence-profile", "Evidence & Profile"],
  ["legal-stack", "Legal Stack"],
  ["findings", "Findings"],
  ["remediation", "Remediation Path"],
  ["appendix", "Appendix"],
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
  return String(value);
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function asList(items, className = "bullet-list") {
  const rows = safeArray(items).filter((item) => item !== null && item !== undefined && item !== "");
  if (!rows.length) return `<p class="muted">No items recorded.</p>`;
  return `<ul class="${className}">${rows.map((item) => `<li>${escapeHtml(typeof item === "string" ? item : JSON.stringify(item))}</li>`).join("")}</ul>`;
}

function statusTone(label) {
  const value = String(label || "").toLowerCase();
  if (value.includes("identified")) return "tone-red";
  if (value.includes("control")) return "tone-green";
  if (value.includes("clarification")) return "tone-amber";
  if (value.includes("outside")) return "tone-muted";
  return "tone-slate";
}

function table(headers, rows, options = {}) {
  const limitedRows = options.limit ? rows.slice(0, options.limit) : rows;
  if (!limitedRows.length) return `<p class="muted">No rows recorded.</p>`;
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${headers.map((header) => `<th>${escapeHtml(header.label)}</th>`).join("")}</tr></thead>
        <tbody>
          ${limitedRows.map((row) => `
            <tr>
              ${headers.map((header) => `<td>${header.render ? header.render(row) : escapeHtml(text(row[header.key]))}</td>`).join("")}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function metricCard(label, value, note, tone = "") {
  return `
    <article class="metric-card ${tone}">
      <div class="metric-label">${escapeHtml(label)}</div>
      <div class="metric-value">${escapeHtml(text(value, "0"))}</div>
      ${note ? `<div class="metric-note">${escapeHtml(note)}</div>` : ""}
    </article>
  `;
}

function section(id, eyebrow, title, body, extraClass = "") {
  return `
    <section class="report-section ${extraClass}" id="${escapeHtml(id)}">
      <div class="section-heading">
        <span class="eyebrow">${escapeHtml(eyebrow)}</span>
        <h2>${escapeHtml(title)}</h2>
      </div>
      ${body}
    </section>
  `;
}

function renderTopNav() {
  return `
    <nav class="top-nav" aria-label="Report navigation">
      <div class="brand-mark">LEX NOVA</div>
      <div class="nav-links">
        ${REPORT_SECTIONS.map(([id, label]) => `<a href="#${id}">${escapeHtml(label)}</a>`).join("")}
      </div>
    </nav>
  `;
}

function renderRail() {
  return `
    <aside class="review-rail" aria-label="Review map">
      <div class="rail-title">Review Map</div>
      ${REPORT_SECTIONS.map(([id, label], index) => `
        <a class="rail-item" href="#${id}">
          <span class="rail-dot">${String(index + 1).padStart(2, "0")}</span>
          <span>${escapeHtml(label)}</span>
        </a>
      `).join("")}
    </aside>
  `;
}

function renderMatterOverview(report) {
  const matter = report.matter_overview || {};
  const evidence = report.evidence_reviewed || {};
  const reviewedSources = safeArray(evidence.reviewed_sources);
  const jurisdictions = safeArray(matter.jurisdictions_flagged);
  const body = `
    <div class="hero-grid">
      <div class="hero-card document-panel">
        <div class="doc-kicker">Legal Exposure Diligence Report</div>
        <h1>${escapeHtml(text(matter.target_or_client, "Target"))}</h1>
        <p class="lead">${escapeHtml(text(matter.product_or_matter, "Matter evidence review"))}</p>
        <dl class="matter-dl">
          <div><dt>Review Type</dt><dd>${escapeHtml(text(matter.review_type))}</dd></div>
          <div><dt>Evidence Mode</dt><dd>${escapeHtml(text(matter.evidence_mode))}</dd></div>
          <div><dt>Jurisdictions Flagged</dt><dd>${escapeHtml(jurisdictions.length ? jurisdictions.join(" / ") : "Not specified")}</dd></div>
          <div><dt>Report Status</dt><dd>${escapeHtml(text(matter.report_status))}</dd></div>
        </dl>
      </div>
      <div class="hero-side">
        ${metricCard("Reviewed Sources", reviewedSources.length, "Public and legal evidence captured by the review workflow")}
        ${metricCard("Registry Rows", report.forensic_ledger_appendix?.registry_count || 0, "Legal Exposure Registry rows reviewed")}
        ${metricCard("Forensic Ledger", report.forensic_ledger_appendix?.ledger_count || 0, "Rows preserved for counsel review")}
      </div>
    </div>
    <div class="notice-box">${escapeHtml(text(matter.disclaimer || report.methodology_limitations_review_notes?.counsel_review_note))}</div>
  `;
  return section("overview", "01", "Matter Overview", body, "hero-section");
}

function renderExecutiveSummary(report) {
  const summary = report.executive_exposure_summary || {};
  const counts = summary.status_counts || {};
  const topFlags = safeArray(summary.top_red_flags).slice(0, 7);
  const controls = safeArray(summary.controls_already_found).slice(0, 6);
  const unknowns = safeArray(summary.evidence_gaps_or_unknowns).slice(0, 6);
  const body = `
    <div class="summary-band">
      <div class="posture-card">
        <span class="eyebrow">Overall Exposure Posture</span>
        <div class="posture-value">${escapeHtml(text(summary.overall_exposure_posture, "Not assessed"))}</div>
        <p>${escapeHtml(text(summary.recommended_next_step, "Review identified exposures, control-evidenced items, and clarification points with qualified counsel."))}</p>
      </div>
      <div class="metric-grid">
        ${metricCard("Consolidated Findings", summary.consolidated_exposure_findings || 0, "Client-facing exposure families")}
        ${metricCard("Registry Exposure Items", summary.identified_registry_exposure_items || 0, "Supporting identified registry rows")}
        ${metricCard("Rows Assessed", summary.registry_rows_assessed || 0, "Total Legal Exposure Registry rows")}
        ${Object.entries(counts).map(([label, value]) => metricCard(label, value, "", statusTone(label))).join("")}
      </div>
    </div>
    <div class="three-col">
      <article class="card-shell"><h3>Priority Exposure Families</h3>${asList(topFlags.map((item) => `${item.consolidated_finding_id || ""} — ${item.exposure_title || "Exposure family"} (${item.supporting_registry_item_count || 0} supporting item(s))`))}</article>
      <article class="card-shell"><h3>Controls Evidenced</h3>${asList(controls.map((item) => `${item.registry_reference || ""} — ${item.exposure_title || "Control-evidenced item"}`))}</article>
      <article class="card-shell"><h3>Clarification Points</h3>${asList(unknowns.map((item) => `${item.registry_reference || ""} — ${item.exposure_title || "Clarification item"}`))}</article>
    </div>
  `;
  return section("executive-summary", "02", "Executive Exposure Summary", body);
}

function renderEvidenceAndProfile(report) {
  const evidence = report.evidence_reviewed || {};
  const profile = report.product_activity_profile || {};
  const target = profile.target_profile || {};
  const primary = profile.primary_product || {};
  const sources = safeArray(evidence.reviewed_sources);
  const features = safeArray(profile.product_feature_map).slice(0, 12);
  const body = `
    <div class="split-grid">
      <article class="card-shell">
        <h3>Product & Activity Profile</h3>
        <dl class="matter-dl compact">
          <div><dt>Company</dt><dd>${escapeHtml(text(target.company_name))}</dd></div>
          <div><dt>Website</dt><dd>${target.website ? `<a href="${escapeHtml(target.website)}">${escapeHtml(target.website)}</a>` : "—"}</dd></div>
          <div><dt>Legal Entity</dt><dd>${escapeHtml(text(target.legal_entity))}</dd></div>
          <div><dt>Primary Product</dt><dd>${escapeHtml(text(primary.product_name))}</dd></div>
          <div><dt>Function</dt><dd>${escapeHtml(text(primary.function))}</dd></div>
          <div><dt>Mechanism</dt><dd>${escapeHtml(text(primary.mechanism))}</dd></div>
        </dl>
      </article>
      <article class="card-shell">
        <h3>Evidence Reviewed</h3>
        ${table([
          { label: "Source", render: (row) => escapeHtml(text(row.title || row.source_type)) },
          { label: "Type", render: (row) => escapeHtml(text(row.source_type)) },
          { label: "URL", render: (row) => row.source_url ? `<a href="${escapeHtml(row.source_url)}">Open source</a>` : "—" },
        ], sources, { limit: 16 })}
        ${sources.length > 16 ? `<p class="muted small">Showing first 16 of ${sources.length} reviewed sources. Full source inventory remains available in the Stage 9 JSON.</p>` : ""}
      </article>
    </div>
    <article class="card-shell span-full">
      <h3>Feature Map</h3>
      ${table([
        { label: "Feature", render: (row) => `<strong>${escapeHtml(text(row.feature_name))}</strong><div class="muted small">${escapeHtml(text(row.feature_description))}</div>` },
        { label: "Role", render: (row) => escapeHtml(text(row.feature_role)) },
        { label: "Functional Profile", render: (row) => escapeHtml(text(row.archetype_labels || row.archetype_codes)) },
        { label: "Risk Surfaces", render: (row) => escapeHtml(text(row.surface_tokens)) },
      ], features)}
    </article>
  `;
  return section("evidence-profile", "03", "Evidence Reviewed / Product & Activity Profile", body);
}

function renderLegalStack(report) {
  const legal = report.legal_stack_control_review || {};
  const legalStack = safeArray(legal.legal_stack);
  const controls = safeArray(legal.control_evidenced_items);
  const body = `
    <article class="card-shell">
      <h3>Legal Stack & Control Review</h3>
      ${table([
        { label: "Document / Control Area", render: (row) => `<strong>${escapeHtml(text(row.document_type))}</strong><div class="muted small">${row.document_url ? `<a href="${escapeHtml(row.document_url)}">Open document</a>` : "No URL recorded"}</div>` },
        { label: "Status", render: (row) => escapeHtml(row.exists ? text(row.evidence_status, "Exists") : "Not evidenced") },
        { label: "Controls Found", render: (row) => escapeHtml(text(row.controls_found)) },
        { label: "Gaps Noted", render: (row) => escapeHtml(text(row.gaps_noted)) },
      ], legalStack)}
    </article>
    <article class="card-shell">
      <h3>Control-Evidenced Items</h3>
      ${controls.length ? table([
        { label: "Registry Reference", key: "registry_reference" },
        { label: "Exposure Title", key: "exposure_title" },
        { label: "Control Position", key: "control_position" },
      ], controls) : `<p class="muted">No control-evidenced exposure items were recorded in this run.</p>`}
    </article>
  `;
  return section("legal-stack", "04", "Legal Stack & Control Review", body);
}

function renderConsolidatedFindingCards(consolidated) {
  return consolidated.map((finding, index) => `
    <details class="finding-card consolidated-card" ${index < 2 ? "open" : ""}>
      <summary>
        <span class="finding-index">${escapeHtml(text(finding.consolidated_finding_id || `CF-${index + 1}`))}</span>
        <span class="finding-title">${escapeHtml(text(finding.exposure_title))}</span>
        <span class="severity-pill">${escapeHtml(text(finding.highest_severity?.label || "Severity not specified"))}</span>
      </summary>
      <div class="finding-body">
        <div class="finding-grid">
          <div><h4>Consolidated Assessment</h4><p>${escapeHtml(text(finding.consolidated_summary))}</p></div>
          <div><h4>Commercial / Deal Impact</h4><p>${escapeHtml(text(finding.commercial_deal_impact))}</p></div>
          <div><h4>Remediation Focus</h4><p>${escapeHtml(text(finding.suggested_remediation_path))}</p></div>
          <div><h4>Supporting Registry Items</h4><p>${escapeHtml(text(finding.supporting_registry_references))}</p></div>
        </div>
        <h4>Representative Supporting Items</h4>
        ${table([
          { label: "Registry Reference", key: "registry_reference" },
          { label: "Exposure Item", key: "exposure_title" },
          { label: "Severity", key: "severity" },
          { label: "Timing", key: "timing_urgency" },
        ], safeArray(finding.representative_items))}
      </div>
    </details>
  `).join("");
}

function renderFindings(report) {
  const findings = report.exposure_findings || {};
  const consolidated = safeArray(findings.consolidated_findings);
  const supportingRows = safeArray(findings.supporting_registry_rows || findings.schedule);
  const rowCards = safeArray(findings.detail_cards);
  const consolidatedTable = table([
    { label: "Finding", render: (row) => `<strong>${escapeHtml(text(row.consolidated_finding_id))}</strong><div class="muted small">${escapeHtml(text(row.supporting_registry_item_count))} supporting item(s)</div>` },
    { label: "Exposure Family", render: (row) => escapeHtml(text(row.exposure_title)) },
    { label: "Highest Severity", render: (row) => escapeHtml(text(row.highest_severity?.label)) },
    { label: "Surfaces", render: (row) => escapeHtml(text(row.legal_risk_surfaces)) },
    { label: "Supporting References", render: (row) => escapeHtml(text(row.supporting_registry_references)).slice(0, 180) + (String(text(row.supporting_registry_references, "")).length > 180 ? "…" : "") },
  ], consolidated);
  const supportingTable = table([
    { label: "Registry Item", render: (row) => `<strong>${escapeHtml(text(row.registry_reference))}</strong><div class="muted small">${escapeHtml(text(row.finding_id))}</div>` },
    { label: "Exposure Item", render: (row) => escapeHtml(text(row.exposure_title)) },
    { label: "Severity", render: (row) => escapeHtml(text(row.severity)) },
    { label: "Timing", render: (row) => escapeHtml(text(row.timing_urgency)) },
    { label: "Control Position", render: (row) => escapeHtml(text(row.control_position)) },
  ], supportingRows);
  const rowDetails = rowCards.map((card, index) => `
    <details class="finding-card row-card">
      <summary>
        <span class="finding-index">${escapeHtml(text(card.finding_id || `FIND-${index + 1}`))}</span>
        <span class="finding-title">${escapeHtml(text(card.exposure_title))}</span>
        <span class="severity-pill">${escapeHtml(text(card.severity?.label || card.severity))}</span>
      </summary>
      <div class="finding-body">
        <div class="finding-grid">
          <div><h4>Why This Applies</h4><p>${escapeHtml(text(card.why_this_applies))}</p></div>
          <div><h4>Control Position</h4><p>${escapeHtml(text(card.control_position))}</p></div>
          <div><h4>Legal Significance</h4><p>${escapeHtml(text(card.legal_significance))}</p></div>
          <div><h4>Commercial / Deal Impact</h4><p>${escapeHtml(text(card.commercial_deal_impact))}</p></div>
          <div><h4>Suggested Remediation Path</h4><p>${escapeHtml(text(card.suggested_remediation_path))}</p></div>
          <div><h4>Counsel Review Note</h4><p>${escapeHtml(text(card.counsel_review_note))}</p></div>
        </div>
      </div>
    </details>
  `).join("");
  const body = `
    <article class="card-shell"><h3>Consolidated Exposure Findings</h3><p class="muted">Identified registry exposure rows are consolidated into client-facing exposure families below. Row-level registry items remain available as supporting detail and in the forensic appendix.</p>${consolidatedTable}</article>
    <article class="card-shell"><h3>Consolidated Finding Detail</h3>${renderConsolidatedFindingCards(consolidated) || `<p class="muted">No consolidated exposure findings recorded.</p>`}</article>
    <article class="card-shell"><h3>Supporting Registry Exposure Items</h3><details class="ledger-details"><summary>Open supporting registry row schedule (${supportingRows.length} item(s))</summary>${supportingTable}</details></article>
    <article class="card-shell"><h3>Row-Level Detail Cards</h3><details class="ledger-details"><summary>Open row-level detail cards (${rowCards.length} item(s))</summary>${rowDetails || `<p class="muted">No identified exposure rows recorded.</p>`}</details></article>
  `;
  return section("findings", "05", "Exposure Findings", body);
}

function renderRemediation(report) {
  const implications = report.implications_remediation_path || {};
  const gaps = report.evidence_gaps_clarification_points || {};
  const priorityMap = safeArray(implications.remediation_priority_map);
  const clarifications = safeArray(gaps.clarification_required_items);
  const body = `
    <article class="card-shell">
      <h3>Implications & Remediation Path</h3>
      <p class="lead small-lead">${escapeHtml(text(implications.matter_sensitivity, "Matter sensitivity not classified."))}</p>
      ${priorityMap.map((bucket) => `
        <details class="priority-bucket" open>
          <summary>${escapeHtml(text(bucket.priority))} <span>${safeArray(bucket.actions).length} consolidated finding(s)</span></summary>
          ${table([
            { label: "Finding", key: "consolidated_finding_id" },
            { label: "Exposure Family", key: "exposure_title" },
            { label: "Supporting Items", key: "supporting_registry_item_count" },
            { label: "Suggested Path", render: (row) => escapeHtml(text(row.suggested_remediation_path)) },
          ], safeArray(bucket.actions))}
        </details>
      `).join("") || `<p class="muted">No remediation buckets recorded.</p>`}
    </article>
    <article class="card-shell">
      <h3>Evidence Gaps & Clarification Points</h3>
      ${clarifications.length ? clarifications.map((item) => `
        <div class="question-card">
          <div class="question-title">${escapeHtml(text(item.registry_reference))} — ${escapeHtml(text(item.exposure_title))}</div>
          <p>${escapeHtml(text(item.evidence_missing_or_unclear))}</p>
          ${asList(item.clarification_points)}
        </div>
      `).join("") : `<p class="muted">No clarification-required exposure items were recorded.</p>`}
    </article>
  `;
  return section("remediation", "06", "Implications & Remediation Path", body);
}

function renderAppendix(report) {
  const methodology = report.methodology_limitations_review_notes || {};
  const appendix = report.forensic_ledger_appendix || {};
  const ledger = safeArray(appendix.forensic_ledger);
  const body = `
    <article class="card-shell document-panel light-panel">
      <h3>Methodology, Limitations & Review Notes</h3>
      <h4>Review Method</h4>${asList(methodology.review_method)}
      <h4>Limitations</h4>${asList(methodology.limitations)}
      <div class="notice-box dark-text">${escapeHtml(text(methodology.counsel_review_note))}</div>
    </article>
    <article class="card-shell">
      <h3>Forensic Ledger Appendix</h3>
      <div class="metric-grid compact-grid">
        ${metricCard("Registry Count", appendix.registry_count || 0, "")}
        ${metricCard("Ledger Count", appendix.ledger_count || 0, "")}
        ${Object.entries(appendix.status_counts || {}).map(([label, value]) => metricCard(label, value, "", statusTone(label))).join("")}
      </div>
      <details class="ledger-details">
        <summary>Open forensic ledger preview</summary>
        ${table([
          { label: "Registry Reference", key: "registry_reference" },
          { label: "Exposure Title", key: "exposure_title" },
          { label: "Assessment Outcome", key: "assessment_outcome" },
          { label: "Severity", render: (row) => escapeHtml(text(row.severity?.label || row.severity)) },
          { label: "Functional Profile", render: (row) => escapeHtml(text(row.functional_profile?.label || row.functional_profile)) },
        ], ledger, { limit: 98 })}
      </details>
    </article>
  `;
  return section("appendix", "07", "Methodology, Limitations & Forensic Ledger", body);
}

function styles() {
  return `
    :root { --void:#050505; --surface:#0c0c0c; --surface2:#141414; --line:rgba(197,160,89,.28); --gold:#C5A059; --gold2:#e1c178; --marble:#e8e5dc; --muted:#a8a49a; --ink:#161616; --paper:#f4efe3; --danger:#d88484; --green:#7fb58f; --amber:#d5a850; --slate:#91a7bd; }
    * { box-sizing: border-box; }
    html { scroll-behavior: smooth; }
    body { margin:0; background: radial-gradient(circle at 15% 0%, rgba(197,160,89,.14), transparent 34%), linear-gradient(180deg, #050505 0%, #090909 42%, #050505 100%); color:var(--marble); font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; line-height:1.55; }
    a { color: var(--gold2); text-decoration: none; } a:hover { text-decoration: underline; }
    .top-nav { position: sticky; top:0; z-index:20; backdrop-filter: blur(18px); background: rgba(5,5,5,.82); border-bottom:1px solid var(--line); display:flex; justify-content:space-between; align-items:center; padding:14px 28px; }
    .brand-mark { font-family: Georgia, "Times New Roman", serif; letter-spacing:.18em; color:var(--gold); font-weight:700; font-size:13px; }
    .nav-links { display:flex; gap:18px; flex-wrap:wrap; justify-content:flex-end; } .nav-links a { color:#ddd7c9; font-size:13px; }
    .layout { display:grid; grid-template-columns: 250px minmax(0, 1fr); gap:28px; max-width:1480px; margin:0 auto; padding:36px 28px 80px; }
    .review-rail { position: sticky; top:74px; align-self:start; padding:18px; background:rgba(12,12,12,.72); border:1px solid var(--line); border-radius:22px; box-shadow:0 22px 80px rgba(0,0,0,.25); }
    .rail-title { color:var(--gold); font-family:Georgia,serif; font-size:14px; margin-bottom:14px; letter-spacing:.08em; text-transform:uppercase; }
    .rail-item { display:flex; align-items:center; gap:10px; padding:10px 8px; color:#ddd7c9; border-radius:14px; }
    .rail-item:hover { background:rgba(197,160,89,.08); text-decoration:none; }
    .rail-dot { width:30px; height:30px; display:inline-grid; place-items:center; border:1px solid var(--line); border-radius:50%; color:var(--gold); font-size:11px; }
    .report-main { min-width:0; }
    .report-section { margin-bottom:34px; scroll-margin-top:88px; }
    .section-heading { margin: 10px 0 18px; } .eyebrow { color:var(--gold); text-transform:uppercase; letter-spacing:.2em; font-size:12px; }
    h1,h2,h3,h4 { font-family: Georgia, "Times New Roman", serif; font-weight:500; line-height:1.15; margin:0 0 14px; }
    h1 { font-size: clamp(42px, 7vw, 86px); color:#fff8e6; } h2 { font-size: clamp(28px, 4vw, 52px); color:#fff8e6; } h3 { font-size:24px; color:#fff8e6; } h4 { font-size:17px; color:#f2dfb3; margin-top:14px; }
    .lead { font-size:20px; color:#d7d0c0; max-width:900px; } .small-lead { font-size:16px; }
    .hero-grid { display:grid; grid-template-columns:minmax(0, 1fr) 320px; gap:22px; align-items:stretch; }
    .hero-side { display:grid; gap:14px; }
    .card-shell, .metric-card, .document-panel, .posture-card { background:linear-gradient(180deg, rgba(20,20,20,.96), rgba(10,10,10,.96)); border:1px solid var(--line); border-radius:24px; padding:22px; box-shadow:0 22px 80px rgba(0,0,0,.25); }
    .document-panel { position:relative; overflow:hidden; } .document-panel:before { content:""; position:absolute; inset:auto -80px -100px auto; width:260px; height:260px; border-radius:50%; background:rgba(197,160,89,.08); }
    .doc-kicker { color:var(--gold); letter-spacing:.16em; text-transform:uppercase; font-size:12px; margin-bottom:14px; }
    .matter-dl { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:14px; margin:22px 0 0; } .matter-dl.compact { grid-template-columns:1fr; }
    dt { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; } dd { margin:4px 0 0; color:#f5f0e5; }
    .notice-box { border-left:3px solid var(--gold); background:rgba(197,160,89,.09); padding:16px 18px; border-radius:14px; color:#e9e1d0; margin-top:18px; }
    .summary-band { display:grid; grid-template-columns: 360px 1fr; gap:18px; margin-bottom:18px; }
    .metric-grid { display:grid; grid-template-columns: repeat(auto-fit, minmax(170px, 1fr)); gap:14px; } .compact-grid { margin-bottom:18px; }
    .metric-card { padding:18px; } .metric-label { color:var(--muted); font-size:12px; text-transform:uppercase; letter-spacing:.08em; } .metric-value { font-family:Georgia,serif; font-size:34px; color:#fff8e6; margin-top:6px; } .metric-note { color:var(--muted); font-size:13px; }
    .tone-red { border-color:rgba(216,132,132,.45); } .tone-green { border-color:rgba(127,181,143,.45); } .tone-amber { border-color:rgba(213,168,80,.5); } .tone-muted { opacity:.86; }
    .posture-value { font-family:Georgia,serif; font-size:46px; color:var(--gold2); }
    .three-col { display:grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap:18px; } .split-grid { display:grid; grid-template-columns: 1fr 1.25fr; gap:18px; } .span-full { margin-top:18px; }
    .bullet-list { padding-left:20px; margin:10px 0 0; } .bullet-list li { margin-bottom:9px; }
    .muted { color:var(--muted); } .small { font-size:12px; } .dark-text { color:#2c2519; }
    .table-wrap { overflow:auto; border:1px solid rgba(255,255,255,.08); border-radius:16px; }
    table { width:100%; border-collapse:collapse; min-width:760px; background:rgba(255,255,255,.02); } th,td { text-align:left; vertical-align:top; padding:12px 14px; border-bottom:1px solid rgba(255,255,255,.08); } th { color:var(--gold); font-size:12px; text-transform:uppercase; letter-spacing:.08em; background:rgba(197,160,89,.06); } td { color:#e9e1d0; font-size:14px; }
    .finding-card, .priority-bucket, .ledger-details { border:1px solid rgba(197,160,89,.25); border-radius:18px; margin:12px 0; background:rgba(255,255,255,.025); overflow:hidden; }
    .consolidated-card { border-color: rgba(225,193,120,.42); background:rgba(197,160,89,.045); }
    .row-card { opacity:.92; }
    summary { cursor:pointer; padding:16px 18px; color:#fff8e6; display:flex; gap:12px; align-items:center; justify-content:space-between; }
    .finding-index { color:var(--gold); font-family:Georgia,serif; min-width:66px; } .finding-title { flex:1; } .severity-pill { border:1px solid var(--line); border-radius:999px; padding:4px 10px; color:#f2dfb3; font-size:12px; }
    .finding-body { padding:0 18px 18px; } .finding-grid { display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:16px; }
    .question-card { border:1px solid rgba(255,255,255,.1); border-radius:16px; padding:16px; margin:12px 0; background:rgba(255,255,255,.025); } .question-title { color:var(--gold2); font-family:Georgia,serif; font-size:18px; margin-bottom:8px; }
    .light-panel { background:var(--paper); color:var(--ink); } .light-panel h3,.light-panel h4 { color:#271b0a; } .light-panel .bullet-list li,.light-panel p { color:#302819; }
    @media (max-width: 980px) { .layout { grid-template-columns:1fr; padding:22px 16px 60px; } .review-rail { position:relative; top:0; display:none; } .hero-grid,.summary-band,.three-col,.split-grid,.finding-grid { grid-template-columns:1fr; } .top-nav { align-items:flex-start; gap:12px; flex-direction:column; } table { min-width:680px; } }
    @media print { body { background:#fff; color:#111; } .top-nav,.review-rail { display:none; } .layout { display:block; max-width:none; padding:0; } .card-shell,.metric-card,.document-panel,.posture-card { background:#fff; color:#111; border-color:#ccc; box-shadow:none; break-inside:avoid; } h1,h2,h3,h4, .posture-value { color:#111; } .muted,td,dd,.lead { color:#333; } a { color:#111; } }
  `;
}

export function renderLegalExposureReport(stage9ReportData) {
  const report = stage9ReportData?.report?.report_data || stage9ReportData?.report_data || {};
  const title = report.matter_overview?.target_or_client || "Legal Exposure Diligence Report";
  const body = `
    ${renderTopNav()}
    <div class="layout">
      ${renderRail()}
      <main class="report-main">
        ${renderMatterOverview(report)}
        ${renderExecutiveSummary(report)}
        ${renderEvidenceAndProfile(report)}
        ${renderLegalStack(report)}
        ${renderFindings(report)}
        ${renderRemediation(report)}
        ${renderAppendix(report)}
      </main>
    </div>
  `;
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(title)} — Legal Exposure Diligence Report</title>
  <style>${styles()}</style>
</head>
<body>${body}</body>
</html>`;
}
