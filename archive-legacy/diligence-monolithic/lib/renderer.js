export const RENDERER_VERSION = "monolith_html_renderer_v1";

const SECTION_ORDER = [
  { key: "matter_overview", label: "Matter Overview" },
  { key: "executive_summary", label: "Executive Summary" },
  { key: "target_profile", label: "Target Overview" },
  { key: "product_activity_ip_profile", label: "Product and Activity Profile" },
  { key: "data_risk_provenance_controls", label: "Data Provenance & Controls" },
  { key: "legal_document_control_review", label: "Legal / Governance Document Review" },
  { key: "exposure_findings", label: "Exposure Findings" },
  { key: "implications_remediation_path", label: "Implications & Review Path" },
  { key: "evidence_gaps_clarification_points", label: "Evidence Gaps & Clarification Points" },
  { key: "methodology_limitations_review_notes", label: "Methodology, Limitations & Review Notes" },
  { key: "forensic_ledger_appendix", label: "Technical Trace Appendix" }
];

const SECTION_LABEL_OVERRIDES = {
  risk_surface_profile: "Activity surface profile",
  data_risk_thesis: "Data provenance thesis",
  registry_use_note: "Review framework note",
  vault_assembler_handoff: "Vault Assembly Handoff",
  target_data_provenance_profile: "Target Data Provenance Profile",
  target_exposure_profile: "Target Exposure Profile"
};

const FORBIDDEN_VISIBLE_TERMS = [
  "non-compliant",
  "illegal",
  "liable",
  "unenforceable",
  "confirmed breach",
  "gap proven",
  "fix required",
  "clause must be added",
  "safe",
  "risk score"
];

const SAFE_EMPTY_TEXT = "Not visible in reviewed public materials.";
const PUBLIC_LIMITATION_TEXT =
  "This report is based on reviewed public-footprint materials only. It is not legal advice, not a compliance verdict, and requires qualified review before reliance.";

/**
 * Monolith renderer.
 *
 * Primary contract used by server.js:
 *   renderDiligenceReport({ terminalJson, runId, executionPayload, events })
 *
 * Accepted terminal shapes:
 *   { final_output_handoff: {...} }
 *   { ok: true, terminal_json: { final_output_handoff: {...} } }
 *   { final_output_handoff: { screen_report_payload, integrated_json_report, vault_assembler_handoff } }
 *
 * This renderer is display-only. It must not create findings, repair upstream
 * substance, rewrite registry status, or invent Vault fields.
 */
export async function renderDiligenceReport(input = {}) {
  return renderReport(input);
}

export async function renderReport(input = {}) {
  const renderedAt = nowIso();
  const context = normalizeMonolithRendererContext(input);
  const trace = createRendererTrace({ context, renderedAt });

  if (!context.finalOutputHandoff) {
    return renderFailureReport({
      context,
      trace,
      renderedAt,
      reason: "FINAL_OUTPUT_HANDOFF_MISSING"
    });
  }

  if (isControlledFailure(context.finalOutputHandoff)) {
    return renderControlledFailureReport({ context, trace, renderedAt });
  }

  if (context.screenReportPayload) {
    return renderScreenPayloadReport({ context, trace, renderedAt });
  }

  if (context.integratedJsonReport) {
    return renderIntegratedJsonFallback({ context, trace, renderedAt });
  }

  return renderFailureReport({
    context,
    trace,
    renderedAt,
    reason: "SCREEN_AND_INTEGRATED_REPORT_MISSING"
  });
}

function normalizeMonolithRendererContext(input = {}) {
  const terminalJson = firstPlainObject(
    input.terminalJson,
    input.terminal_json,
    input.response?.terminal_json,
    input.result?.terminal_json,
    input
  );

  const finalOutputHandoff = firstPlainObject(
    terminalJson?.final_output_handoff,
    terminalJson?.terminal_json?.final_output_handoff,
    terminalJson?.result?.final_output_handoff,
    input.final_output_handoff,
    input.response?.final_output_handoff
  );

  const screenReportPayload = firstPlainObject(
    finalOutputHandoff?.screen_report_payload,
    terminalJson?.screen_report_payload,
    input.screen_report_payload
  );

  const integratedJsonReport = firstPlainObject(
    finalOutputHandoff?.integrated_json_report,
    terminalJson?.integrated_json_report,
    input.integrated_json_report
  );

  const vaultAssemblerHandoff = firstPlainObject(
    finalOutputHandoff?.vault_assembler_handoff,
    terminalJson?.vault_assembler_handoff,
    input.vault_assembler_handoff
  );

  const runMeta = firstPlainObject(
    finalOutputHandoff?.handoff_meta,
    finalOutputHandoff?.run_meta,
    integratedJsonReport?.report_meta,
    screenReportPayload?.report_shell,
    input.executionPayload,
    input.execution_payload
  ) || {};

  return {
    input,
    terminalJson,
    finalOutputHandoff,
    screenReportPayload,
    integratedJsonReport,
    vaultAssemblerHandoff,
    runId: firstString(input.runId, input.run_id, terminalJson?.run_id, runMeta.run_id),
    targetUrl: firstString(input.targetUrl, input.target_url, terminalJson?.target_url, runMeta.target_url),
    companyName: firstString(input.companyName, input.company_name, runMeta.company_name, runMeta.target_name, runMeta.prepared_for),
    sourceMode: firstString(input.sourceMode, input.source_mode, runMeta.source_mode),
    status: firstString(
      input.status,
      terminalJson?.status,
      finalOutputHandoff?.handoff_lock?.status,
      finalOutputHandoff?.lock_status,
      "MONOLITH_COMPLETE"
    ),
    runtimeEvents: safeArray(input.events || input.runtimeEvents || input.runtime_events),
    parseReport: firstPlainObject(input.parseReport, input.parse_report),
    modelMeta: firstPlainObject(input.modelMeta, input.model_meta),
    referencesLoaded: firstPlainObject(input.referencesLoaded, input.references_loaded)
  };
}

function createRendererTrace({ context, renderedAt }) {
  return {
    renderer_version: RENDERER_VERSION,
    rendered_at: renderedAt,
    render_mode: context.screenReportPayload
      ? "SCREEN_PAYLOAD_RENDER"
      : context.integratedJsonReport
        ? "INTEGRATED_JSON_FALLBACK_RENDER"
        : "FAILURE_RENDER",
    input_source: context.screenReportPayload
      ? "terminal_json.final_output_handoff.screen_report_payload"
      : context.integratedJsonReport
        ? "terminal_json.final_output_handoff.integrated_json_report"
        : "terminal_json.final_output_handoff",
    monolith_only: true,
    phase_stack_dependency: false,
    no_substantive_mutation: true,
    raw_html_allowed_from_input: false,
    sections_expected: SECTION_ORDER.map((section) => section.key),
    sections_rendered: [],
    sections_missing: [],
    additional_sections_rendered: [],
    forbidden_visible_terms_detected: [],
    warnings: [],
    errors: []
  };
}

function renderScreenPayloadReport({ context, trace, renderedAt }) {
  const screenPayload = context.screenReportPayload;
  const reportShell = asObject(screenPayload.report_shell);
  const sections = asObject(screenPayload.sections);
  const rendererContract = asObject(screenPayload.renderer_contract);
  const displayIdIndex = asObject(screenPayload.display_id_index);
  const platformDiligenceObject = asObject(screenPayload.platform_diligence_object);

  const renderedSections = [];
  const missingSections = [];

  for (const descriptor of SECTION_ORDER) {
    const section = sections[descriptor.key];
    if (!isPlainObject(section)) {
      missingSections.push(descriptor.key);
      continue;
    }

    renderedSections.push({
      key: descriptor.key,
      label: descriptor.label,
      html: renderScreenSection({ descriptor, section, displayIdIndex })
    });
  }

  const extraSectionKeys = Object.keys(sections).filter(
    (key) => !SECTION_ORDER.some((section) => section.key === key)
  );

  trace.sections_rendered = renderedSections.map((section) => section.key);
  trace.sections_missing = missingSections;
  trace.additional_sections_rendered = extraSectionKeys;
  trace.renderer_contract_present = Object.keys(rendererContract).length > 0;
  trace.vault_handoff_present = Boolean(context.vaultAssemblerHandoff);

  if (missingSections.length) trace.warnings.push(`SCREEN_SECTIONS_MISSING:${missingSections.join(",")}`);
  if (!trace.renderer_contract_present) trace.warnings.push("RENDERER_CONTRACT_MISSING_OR_EMPTY");

  const forbiddenTerms = detectForbiddenVisibleTerms(screenPayload);
  if (forbiddenTerms.length) {
    trace.warnings.push(`FORBIDDEN_VISIBLE_TERMS_PRESENT_IN_SCREEN_PAYLOAD:${forbiddenTerms.join(",")}`);
    trace.forbidden_visible_terms_detected = forbiddenTerms;
  }

  const reportTitle = firstString(
    reportShell.report_title,
    reportShell.title,
    context.companyName ? `${context.companyName} Public-Footprint Diligence Report` : "",
    context.targetUrl ? `${context.targetUrl} Public-Footprint Diligence Report` : "",
    "Public-Footprint Diligence Report"
  );

  const htmlReport = buildHtmlDocument({
    title: reportTitle,
    context,
    reportShell,
    renderedSections,
    additionalSectionsHtml: extraSectionKeys.length ? renderAdditionalSections({ sections, extraSectionKeys }) : "",
    displayIdIndex,
    platformDiligenceObject,
    rendererContract,
    trace
  });

  const reportJson = buildReportJson({
    context,
    renderedAt,
    trace,
    reportTitle,
    renderStatus: trace.warnings.length ? "RENDERED_WITH_WARNINGS" : "RENDERED"
  });

  return wrapRendererResult({ htmlReport, reportJson, trace, reportTitle });
}

function renderIntegratedJsonFallback({ context, trace, renderedAt }) {
  trace.warnings.push("SCREEN_REPORT_PAYLOAD_MISSING_USED_INTEGRATED_JSON_FALLBACK");

  const integrated = context.integratedJsonReport;
  const reportMeta = asObject(integrated.report_meta);
  const preparedProfiles = asObject(integrated.prepared_final_profiles);
  const canonicalSummary = asObject(integrated.canonical_summary);
  const limitations = safeArray(context.finalOutputHandoff?.limitations || integrated.limitations);

  const title = firstString(
    reportMeta.report_title,
    context.companyName ? `${context.companyName} Public-Footprint Diligence Report` : "",
    "Public-Footprint Diligence Report"
  );

  const sections = [
    {
      key: "canonical_summary",
      label: "Executive Summary",
      html: renderCardSection("canonical_summary", "Executive Summary", canonicalSummary)
    },
    {
      key: "prepared_profiles",
      label: "Prepared Final Profiles",
      html: renderCardSection("prepared_profiles", "Prepared Final Profiles", preparedProfiles)
    },
    {
      key: "limitations",
      label: "Limitations",
      html: renderCardSection("limitations", "Limitations", limitations)
    }
  ];

  trace.sections_rendered = sections.map((section) => section.key);

  const htmlReport = htmlPage({
    title,
    body: `
      ${renderHero({
        title,
        subtitle: "Renderer-ready screen payload was missing. This report is rendered from the integrated machine JSON branch without changing substance.",
        status: "RENDERED_WITH_WARNINGS",
        context
      })}
      ${renderBoundaryNotice()}
      ${sections.map((section) => section.html).join("\n")}
      ${context.vaultAssemblerHandoff ? renderCardSection("vault_handoff", "Vault Assembly Handoff", context.vaultAssemblerHandoff) : ""}
      <details class="card technical" open><summary>Renderer Trace</summary>${renderGenericValue(trace)}</details>
    `
  });

  const reportJson = buildReportJson({
    context,
    renderedAt,
    trace,
    reportTitle: title,
    renderStatus: "RENDERED_WITH_WARNINGS"
  });

  return wrapRendererResult({ htmlReport, reportJson, trace, reportTitle: title });
}

function renderControlledFailureReport({ context, trace, renderedAt }) {
  trace.render_mode = "CONTROLLED_FAILURE_RENDER";
  trace.warnings.push("CONTROLLED_FAILURE_TERMINAL_OUTPUT_RENDERED");

  const title = context.companyName
    ? `${context.companyName} Diligence Run Controlled Failure`
    : "Diligence Run Controlled Failure";

  const handoffLock = asObject(context.finalOutputHandoff?.handoff_lock);
  const limitations = safeArray(context.finalOutputHandoff?.limitations);
  const failurePayload = firstPlainObject(
    context.finalOutputHandoff?.controlled_failure,
    context.finalOutputHandoff?.failure,
    context.finalOutputHandoff
  );

  const htmlReport = htmlPage({
    title,
    body: `
      ${renderHero({
        title,
        subtitle: "The monolith emitted a controlled-failure terminal object. This is not a complete diligence report.",
        status: "CONTROLLED_FAILURE",
        context
      })}
      ${renderBoundaryNotice()}
      ${renderCardSection("handoff_lock", "Handoff Lock", handoffLock)}
      ${renderCardSection("failure_payload", "Controlled Failure Payload", failurePayload)}
      ${renderCardSection("limitations", "Limitations", limitations)}
      <details class="card technical" open><summary>Renderer Trace</summary>${renderGenericValue(trace)}</details>
    `
  });

  const reportJson = buildReportJson({
    context,
    renderedAt,
    trace,
    reportTitle: title,
    renderStatus: "CONTROLLED_FAILURE_RENDERED"
  });

  return wrapRendererResult({ htmlReport, reportJson, trace, reportTitle: title, renderStatus: "CONTROLLED_FAILURE_RENDERED" });
}

function renderFailureReport({ context, trace, renderedAt, reason }) {
  trace.render_mode = "FAILURE_RENDER";
  trace.errors.push(reason);

  const title = context.companyName
    ? `${context.companyName} Diligence Run Incomplete`
    : "Diligence Run Incomplete";

  const failureRows = [
    ["Run ID", context.runId || "N/A"],
    ["Target", context.targetUrl || context.companyName || "N/A"],
    ["Renderer reason", reason],
    ["Runtime status", context.status || "N/A"]
  ];

  const htmlReport = htmlPage({
    title,
    body: `
      ${renderHero({
        title,
        subtitle: "The monolith did not provide a complete final output handoff for report rendering.",
        status: "RENDER_FAILED",
        context
      })}
      ${renderBoundaryNotice()}
      <section class="card"><h2>Run Status</h2>${renderKeyValueTable(failureRows)}</section>
      ${renderCardSection("terminal_json", "Terminal JSON", context.terminalJson)}
      <details class="card technical" open><summary>Renderer Trace</summary>${renderGenericValue(trace)}</details>
    `
  });

  const reportJson = buildReportJson({
    context,
    renderedAt,
    trace,
    reportTitle: title,
    renderStatus: "FAILURE_RENDERED"
  });

  return wrapRendererResult({ htmlReport, reportJson, trace, reportTitle: title, renderStatus: "FAILURE_RENDERED" });
}

function buildHtmlDocument({
  title,
  context,
  reportShell,
  renderedSections,
  additionalSectionsHtml,
  displayIdIndex,
  platformDiligenceObject,
  rendererContract,
  trace
}) {
  const shellRows = objectToRows({
    report_id: reportShell.report_id,
    report_title: reportShell.report_title || title,
    generated_at: reportShell.generated_at,
    prepared_for: reportShell.prepared_for,
    evidence_cutoff: reportShell.evidence_cutoff,
    run_id: context.runId,
    target_url: context.targetUrl,
    company_name: context.companyName,
    source_mode: context.sourceMode
  });

  const sectionToc = renderedSections.map((section) => `
    <a href="#${escapeAttr(section.key)}">${escapeHtml(section.label)}</a>
  `).join("");

  return htmlPage({
    title,
    body: `
      ${renderHero({
        title,
        subtitle: "Public-footprint diligence report rendered from the monolith terminal handoff.",
        status: trace.warnings.length ? "RENDERED_WITH_WARNINGS" : "RENDERED",
        context
      })}
      ${renderBoundaryNotice()}
      <section class="card"><h2>Report Shell</h2>${renderKeyValueTable(shellRows)}</section>
      <nav class="toc card"><h2>Report Sections</h2><div class="toc-links">${sectionToc}</div></nav>
      ${renderedSections.map((section) => section.html).join("\n")}
      ${additionalSectionsHtml}
      ${renderCardSection("vault_handoff", "Vault Assembly Handoff", context.vaultAssemblerHandoff)}
      <details class="card technical"><summary>Display ID Index</summary>${renderGenericValue(displayIdIndex)}</details>
      <details class="card technical"><summary>Platform Diligence Object</summary>${renderGenericValue(platformDiligenceObject)}</details>
      <details class="card technical"><summary>Renderer Contract</summary>${renderGenericValue(rendererContract)}</details>
      <details class="card technical" open><summary>Renderer Trace</summary>${renderGenericValue(trace)}</details>
    `
  });
}

function renderHero({ title, subtitle, status, context }) {
  const target = firstString(context.companyName, context.targetUrl, "Target not specified");
  return `
    <header class="hero">
      <div>
        <p class="eyebrow">Interface Diligence · Monolith Runtime</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <div class="hero-meta">
        ${renderBadge(status)}
        <div class="meta-line"><span>Target</span><strong>${escapeHtml(target)}</strong></div>
        <div class="meta-line"><span>Run ID</span><strong>${escapeHtml(context.runId || "N/A")}</strong></div>
        <div class="meta-line"><span>Runtime</span><strong>Single monolith job</strong></div>
      </div>
    </header>
  `;
}

function renderBoundaryNotice() {
  return `<section class="notice"><strong>Review boundary:</strong> ${escapeHtml(PUBLIC_LIMITATION_TEXT)}</section>`;
}

function renderScreenSection({ descriptor, section, displayIdIndex }) {
  if (descriptor.key === "exposure_findings") {
    return renderExposureFindingsSection({ descriptor, section, displayIdIndex });
  }

  if (descriptor.key === "forensic_ledger_appendix") {
    return renderAppendixSection({ descriptor, section });
  }

  return renderCardSection(descriptor.key, descriptor.label, section);
}

function renderExposureFindingsSection({ descriptor, section, displayIdIndex }) {
  const findingRows = safeArray(section.finding_rows);
  const otherBlocks = Object.entries(section)
    .filter(([key]) => key !== "finding_rows")
    .map(([blockKey, value]) => `<div class="block"><h3>${escapeHtml(displayLabel(blockKey))}</h3>${renderGenericValue(value)}</div>`)
    .join("");

  const findingCards = findingRows.length
    ? findingRows.map((finding, index) => renderFindingCard({ finding, index, displayIdIndex })).join("")
    : `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;

  return `
    <section class="card report-section" id="${escapeAttr(descriptor.key)}">
      <h2>${escapeHtml(descriptor.label)}</h2>
      ${otherBlocks}
      <div class="block"><h3>Finding Rows</h3><div class="finding-grid">${findingCards}</div></div>
    </section>
  `;
}

function renderFindingCard({ finding, index, displayIdIndex }) {
  const item = asObject(finding);
  const displayId = firstString(item.display_exposure_id, item.display_id, `EXP-${String(index + 1).padStart(3, "0")}`);
  const title = firstString(item.normalized_threat_name, item.title, item.normalized_category, displayId);
  const status = firstString(item.display_status, item.evaluation_status, "Visible signal");
  const summary = firstString(item.plain_english_summary, item.summary, SAFE_EMPTY_TEXT);
  const relatedActivity = firstString(item.related_activity, item.activity, "");
  const controlPosition = firstString(item.visible_control_position, item.control_position, "");
  const evidencePreview = asObject(item.evidence_preview);
  const technicalRefs = asObject(item.technical_refs);

  return `
    <article class="finding-card">
      <div class="finding-head"><span class="display-id">${escapeHtml(displayId)}</span>${renderBadge(status)}</div>
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(summary)}</p>
      ${relatedActivity ? `<p><strong>Related activity:</strong> ${escapeHtml(relatedActivity)}</p>` : ""}
      ${controlPosition ? `<p><strong>Visible control position:</strong> ${escapeHtml(controlPosition)}</p>` : ""}
      ${Object.keys(evidencePreview).length ? `<div class="evidence-preview"><strong>Evidence preview</strong>${renderGenericValue(evidencePreview)}</div>` : ""}
      ${item.qualified_review_flag ? `<p class="review-flag">Qualified reviewer should verify.</p>` : ""}
      <details><summary>Technical refs</summary>${renderGenericValue({ ...technicalRefs, display_id_index_entry: displayIdIndex?.[displayId] || null })}</details>
    </article>
  `;
}

function renderAppendixSection({ descriptor, section }) {
  const blocks = Object.entries(section).map(([blockKey, value]) => {
    const open = blockKey === "full_registry_ledger" ? " open" : "";
    return `<details class="appendix-block"${open}><summary>${escapeHtml(displayLabel(blockKey))}</summary>${renderGenericValue(value)}</details>`;
  }).join("");

  return `
    <section class="card report-section appendix" id="${escapeAttr(descriptor.key)}">
      <h2>${escapeHtml(descriptor.label)}</h2>
      <p class="muted">This appendix preserves technical references and registry-row material for review traceability.</p>
      ${blocks || `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`}
    </section>
  `;
}

function renderAdditionalSections({ sections, extraSectionKeys }) {
  return `
    <details class="card technical">
      <summary>Additional Screen Payload Sections</summary>
      ${extraSectionKeys.map((key) => `<div class="block"><h3>${escapeHtml(displayLabel(key))}</h3>${renderGenericValue(sections[key])}</div>`).join("")}
    </details>
  `;
}

function renderCardSection(id, title, value) {
  return `
    <section class="card report-section" id="${escapeAttr(id)}">
      <h2>${escapeHtml(title)}</h2>
      ${renderGenericValue(value)}
    </section>
  `;
}

function renderGenericValue(value, depth = 0) {
  if (value === undefined || value === null || value === "") {
    return `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return `<p>${escapeHtml(String(value))}</p>`;
  }

  if (Array.isArray(value)) {
    if (!value.length) return `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;
    if (value.every(isPrimitive)) return `<ul>${value.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
    if (value.every(isPlainObject)) return renderObjectArrayTable(value, depth);
    return value.map((item, index) => `<div class="nested-card"><h4>Item ${index + 1}</h4>${renderGenericValue(item, depth + 1)}</div>`).join("");
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);
    if (!entries.length) return `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;
    if (entries.every(([, item]) => isPrimitive(item))) return renderKeyValueTable(entries.map(([key, item]) => [displayLabel(key), item]));
    if (depth >= 5) return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
    return entries.map(([key, item]) => `<div class="nested-block"><h4>${escapeHtml(displayLabel(key))}</h4>${renderGenericValue(item, depth + 1)}</div>`).join("");
  }

  return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function renderObjectArrayTable(rows, depth = 0) {
  if (!rows.length) return `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;
  const columns = collectTableColumns(rows);
  return `
    <div class="table-wrap">
      <table>
        <thead><tr>${columns.map((col) => `<th>${escapeHtml(displayLabel(col))}</th>`).join("")}</tr></thead>
        <tbody>
          ${rows.map((row) => `<tr>${columns.map((col) => `<td>${renderTableCell(row[col], depth + 1)}</td>`).join("")}</tr>`).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderTableCell(value, depth = 0) {
  if (value === undefined || value === null || value === "") return `<span class="muted">—</span>`;
  if (isPrimitive(value)) return escapeHtml(String(value));
  if (Array.isArray(value) && value.every(isPrimitive)) return escapeHtml(value.map(String).join(", "));
  return `<details><summary>View</summary>${renderGenericValue(value, depth + 1)}</details>`;
}

function renderKeyValueTable(rows) {
  const safeRows = safeArray(rows).filter((row) => Array.isArray(row) && row.length >= 2);
  if (!safeRows.length) return `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;
  return `
    <div class="table-wrap">
      <table class="kv"><tbody>
        ${safeRows.map(([key, value]) => `<tr><th>${escapeHtml(displayLabel(key))}</th><td>${renderTableCell(value)}</td></tr>`).join("")}
      </tbody></table>
    </div>
  `;
}

function renderBadge(value) {
  const label = String(value || "Visible signal");
  const normalized = label.toLowerCase();
  let tone = "neutral";
  if (normalized.includes("warning") || normalized.includes("partial") || normalized.includes("unclear")) tone = "warn";
  if (normalized.includes("failed") || normalized.includes("missing") || normalized.includes("access") || normalized.includes("controlled")) tone = "alert";
  if (normalized.includes("rendered") || normalized.includes("present") || normalized.includes("complete") || normalized.includes("ready")) tone = "ok";
  if (normalized.includes("qualified review")) tone = "review";
  return `<span class="badge ${tone}">${escapeHtml(label)}</span>`;
}

function htmlPage({ title, body }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    :root {
      --bg:#08090d; --card:#10131a; --card2:#141925; --text:#f2efe6; --muted:#a6a092;
      --line:rgba(220,197,127,.22); --accent:#dcc57f; --accent2:#8c6f2f;
      --warn:#e4b557; --warn-bg:rgba(228,181,87,.12); --alert:#ff7777; --alert-bg:rgba(255,119,119,.12);
      --ok:#86efac; --ok-bg:rgba(134,239,172,.12); --review:#c4b5fd; --review-bg:rgba(196,181,253,.12);
      --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,"Liberation Mono",monospace;
      --sans:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
    }
    *{box-sizing:border-box} body{margin:0;background:radial-gradient(circle at top left,rgba(220,197,127,.09),transparent 34%),var(--bg);color:var(--text);font-family:var(--sans);line-height:1.55}
    .page{width:min(1180px,calc(100% - 32px));margin:0 auto;padding:28px 0 60px}
    .hero{display:grid;grid-template-columns:minmax(0,1fr)320px;gap:22px;align-items:stretch;padding:32px;border-radius:24px;background:linear-gradient(135deg,rgba(20,25,37,.96),rgba(9,11,16,.96));border:1px solid var(--line);box-shadow:0 18px 45px rgba(0,0,0,.28);margin-bottom:18px}
    .eyebrow{margin:0 0 8px;color:var(--accent);font-weight:900;letter-spacing:.08em;text-transform:uppercase;font-size:12px}
    h1{margin:0;font-size:clamp(30px,5vw,56px);line-height:1.02;letter-spacing:-.04em} h2{margin-top:0;font-size:27px;letter-spacing:-.02em} h3{font-size:18px;margin:20px 0 10px} h4{margin:14px 0 8px;font-size:15px}
    .subtitle{max-width:780px;color:var(--muted);font-size:17px;margin:16px 0 0}.hero-meta{display:flex;flex-direction:column;gap:12px;padding:18px;border-radius:18px;background:rgba(255,255,255,.035);border:1px solid var(--line)}.meta-line span{display:block;color:var(--muted);font-size:12px;text-transform:uppercase;letter-spacing:.06em;margin-bottom:3px}.meta-line strong{display:block;overflow-wrap:anywhere}
    .notice{border:1px solid rgba(228,181,87,.45);background:var(--warn-bg);padding:16px 18px;border-radius:18px;margin:18px 0}.card{background:linear-gradient(180deg,var(--card),#0d1017);border:1px solid var(--line);border-radius:20px;padding:24px;margin:18px 0;box-shadow:0 10px 28px rgba(0,0,0,.22)}
    .block,.nested-block{border-top:1px solid var(--line);padding-top:14px;margin-top:14px}.nested-card,.finding-card{border:1px solid var(--line);background:var(--card2);border-radius:16px;padding:14px;margin:10px 0}.toc-links{display:flex;flex-wrap:wrap;gap:10px}.toc-links a{text-decoration:none;padding:8px 12px;border-radius:999px;background:rgba(220,197,127,.1);color:var(--accent);font-weight:800;font-size:14px}
    .badge{display:inline-flex;align-items:center;width:max-content;padding:6px 10px;border-radius:999px;font-size:12px;font-weight:900;letter-spacing:.02em;background:rgba(220,197,127,.1);color:var(--accent);text-transform:uppercase}.badge.warn{background:var(--warn-bg);color:var(--warn)}.badge.alert{background:var(--alert-bg);color:var(--alert)}.badge.ok{background:var(--ok-bg);color:var(--ok)}.badge.review{background:var(--review-bg);color:var(--review)}
    .finding-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:14px}.finding-head{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.display-id{font-family:var(--mono);font-weight:900;color:var(--accent)}.review-flag{padding:10px 12px;border-radius:12px;background:var(--review-bg);color:var(--review);font-weight:800}.evidence-preview{border-left:4px solid var(--line);padding-left:12px;margin:12px 0}.appendix-block{border-top:1px solid var(--line);padding-top:12px;margin-top:12px}
    details summary{cursor:pointer;font-weight:900;color:var(--accent)}.technical{background:#0b0e14}.table-wrap{overflow-x:auto;width:100%}table{border-collapse:collapse;width:100%;min-width:520px;font-size:14px}th,td{border:1px solid var(--line);padding:10px 12px;vertical-align:top;text-align:left}th{background:rgba(220,197,127,.09);color:var(--accent);font-weight:900}table.kv th{width:260px}pre{max-width:100%;overflow-x:auto;padding:14px;border-radius:14px;background:#05070b;color:#eef2f7;font-family:var(--mono);font-size:12px;line-height:1.45}.muted{color:var(--muted)}
    @media(max-width:860px){.hero{grid-template-columns:1fr;padding:24px}.card{padding:18px}}@media print{body{background:#fff;color:#111}.page{width:100%;padding:0}.card,.hero,.notice{box-shadow:none;break-inside:avoid}.toc{display:none}}
  </style>
</head>
<body><main class="page">${body}</main></body>
</html>`;
}

function buildReportJson({ context, renderedAt, trace, reportTitle, renderStatus }) {
  return {
    renderer_version: RENDERER_VERSION,
    render_status: renderStatus,
    rendered_at: renderedAt,
    report_title: reportTitle,
    run_id: context.runId || null,
    monolith_only: true,
    final_output_handoff: context.finalOutputHandoff,
    screen_report_payload: context.screenReportPayload || null,
    integrated_json_report: context.integratedJsonReport || null,
    vault_assembler_handoff: context.vaultAssemblerHandoff || null,
    parse_report: context.parseReport || null,
    model_meta: context.modelMeta || null,
    references_loaded: context.referencesLoaded || null,
    renderer_trace: trace
  };
}

function wrapRendererResult({ htmlReport, reportJson, trace, reportTitle, renderStatus }) {
  const status = renderStatus || reportJson.render_status;
  return {
    html_report: htmlReport,
    report_json: reportJson,
    renderer_trace: trace,
    renderer_output: {
      renderer_version: RENDERER_VERSION,
      render_status: status,
      report_title: reportTitle,
      html_report: htmlReport,
      report_json: reportJson,
      export_payload: {
        artifact_type: "monolith_rendered_report",
        html_report_present: true,
        report_json_present: true,
        renderer_version: RENDERER_VERSION,
        rendered_at: reportJson.rendered_at
      }
    },
    rendered_report: { html: htmlReport, report_json: reportJson }
  };
}

function isControlledFailure(finalOutputHandoff) {
  const lockStatus = String(finalOutputHandoff?.handoff_lock?.status || finalOutputHandoff?.lock_status || "").toUpperCase();
  return lockStatus.includes("CONTROLLED_FAILURE") || Boolean(finalOutputHandoff?.controlled_failure);
}

function detectForbiddenVisibleTerms(value) {
  const text = JSON.stringify(value || {}).toLowerCase();
  return FORBIDDEN_VISIBLE_TERMS.filter((term) => text.includes(term.toLowerCase()));
}

function collectTableColumns(rows) {
  const preferred = [
    "display_exposure_id", "display_id", "normalized_threat_name", "normalized_category", "display_status",
    "plain_english_summary", "related_activity", "visible_control_position", "qualified_review_flag",
    "threat_id", "Threat_ID", "registry_row_id", "evaluation_status", "evaluation_confidence", "row_route_reason"
  ];
  const seen = new Set();
  const columns = [];
  for (const key of preferred) {
    if (rows.some((row) => Object.prototype.hasOwnProperty.call(row, key))) {
      columns.push(key); seen.add(key);
    }
  }
  for (const row of rows) for (const key of Object.keys(row || {})) if (!seen.has(key)) { columns.push(key); seen.add(key); }
  return columns;
}

function objectToRows(object) {
  return Object.entries(object || {}).filter(([, value]) => value !== undefined && value !== null && value !== "");
}

function displayLabel(key) {
  const raw = String(key || "");
  if (SECTION_LABEL_OVERRIDES[raw]) return SECTION_LABEL_OVERRIDES[raw];
  return raw.replace(/_/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase()).replace(/\bIp\b/g, "IP").replace(/\bAi\b/g, "AI").replace(/\bPii\b/g, "PII").replace(/\bJson\b/g, "JSON");
}

function firstPlainObject(...values) { for (const value of values) if (isPlainObject(value)) return value; return null; }
function firstString(...values) { for (const value of values) { const text = String(value || "").trim(); if (text) return text; } return ""; }
function asObject(value) { return isPlainObject(value) ? value : {}; }
function safeArray(value) { return Array.isArray(value) ? value : []; }
function isPrimitive(value) { return value === null || ["string", "number", "boolean"].includes(typeof value); }
function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function nowIso() { return new Date().toISOString(); }
function escapeHtml(value) { return String(value ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;"); }
function escapeAttr(value) { return escapeHtml(value).replace(/\s+/g, "-"); }
