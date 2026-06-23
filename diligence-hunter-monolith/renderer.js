export const RENDERER_VERSION = "deterministic_html_renderer_v1";

const SECTION_ORDER = [
  {
    key: "matter_overview",
    label: "Matter Overview",
    required_blocks: [
      "matter_identity",
      "review_scope",
      "evidence_cutoff",
      "reliance_disclaimer",
      "qualified_review_required",
      "public_footprint_limitation"
    ]
  },
  {
    key: "executive_summary",
    label: "Executive Summary",
    required_blocks: [
      "executive_posture",
      "target_snapshot",
      "product_activity_snapshot",
      "data_posture",
      "legal_document_posture",
      "exposure_posture",
      "evidence_posture",
      "qualified_review_priorities"
    ]
  },
  {
    key: "target_profile",
    label: "Target Overview",
    required_blocks: [
      "identity",
      "jurisdiction",
      "business_model",
      "market_context",
      "product_baseline",
      "data_touchpoint_summary",
      "evidence_basis",
      "limitations"
    ]
  },
  {
    key: "product_activity_ip_profile",
    label: "Product and Activity Profile",
    required_blocks: [
      "product_activity_thesis",
      "feature_inventory_summary",
      "feature_table",
      "functional_profile",
      "risk_surface_profile",
      "ip_content_profile",
      "architecture_profile",
      "commercial_scan",
      "evidence_basis",
      "limitations"
    ]
  },
  {
    key: "data_risk_provenance_controls",
    label: "Data Provenance & Controls",
    required_blocks: [
      "data_risk_thesis",
      "data_flow_summary",
      "data_flow_table",
      "control_review",
      "data_gaps",
      "evidence_basis",
      "limitations"
    ]
  },
  {
    key: "legal_document_control_review",
    label: "Legal / Governance Document Review",
    required_blocks: [
      "legal_document_review_thesis",
      "document_inventory_summary",
      "document_inventory",
      "legal_unit_index",
      "document_relationships",
      "control_signal_matrix",
      "document_mismatch_signals",
      "qualified_review_points",
      "evidence_basis",
      "limitations"
    ]
  },
  {
    key: "exposure_findings",
    label: "Exposure Findings",
    required_blocks: [
      "exposure_category_groups",
      "finding_rows",
      "severity_summary",
      "control_position_summary",
      "evidence_basis_summary",
      "appendix_crosswalk"
    ]
  },
  {
    key: "implications_remediation_path",
    label: "Implications & Review Path",
    required_blocks: [
      "remediation_thesis",
      "priority_actions",
      "document_route",
      "data_control_route",
      "operational_control_route",
      "qualified_review_queue",
      "quick_wins",
      "blocked_until_clarified",
      "review_ready_handoff_bridge"
    ]
  },
  {
    key: "evidence_gaps_clarification_points",
    label: "Evidence Gaps & Clarification Points",
    required_blocks: [
      "open_information_requests",
      "missing_documents",
      "missing_factual_confirmations",
      "unclear_data_flows",
      "unclear_provider_dependencies",
      "evidence_limitations",
      "consequence_if_unresolved",
      "client_confirmation_questions"
    ]
  },
  {
    key: "methodology_limitations_review_notes",
    label: "Methodology, Limitations & Review Notes",
    required_blocks: [
      "methodology",
      "stage_roles",
      "status_definitions",
      "legal_limitations",
      "evidence_limitations",
      "registry_use_note",
      "reviewer_notes"
    ]
  },
  {
    key: "forensic_ledger_appendix",
    label: "Technical Trace Appendix",
    required_blocks: [
      "appendix_notice",
      "full_ledger_summary",
      "full_registry_ledger",
      "row_level_proof",
      "condition_trigger_basis",
      "evidence_references",
      "operator_challenge_trace",
      "batch_warnings",
      "appendix_limitations"
    ]
  }
];

const SECTION_LABEL_OVERRIDES = {
  risk_surface_profile: "Activity surface profile",
  data_risk_thesis: "Data provenance thesis",
  registry_use_note: "Review framework note"
};

const FORBIDDEN_VISIBLE_TERMS = [
  "violation",
  "non-compliant",
  "illegal",
  "liable",
  "unenforceable",
  "breach",
  "confirmed breach",
  "gap proven",
  "fix required",
  "clause must be added",
  "safe",
  "risk score"
];

const SAFE_EMPTY_TEXT = "Not visible in reviewed public materials.";
const PUBLIC_LIMITATION_TEXT = "This report is based on reviewed public-footprint materials only. It is not legal advice, not a compliance verdict, and requires qualified review before reliance.";

export function renderDiligenceReport({
  run = {},
  phaseOutputs = {},
  upstream = {},
  mechanicalValidations = {},
  runtimeTrace = null,
  response = null
} = {}) {
  const renderedAt = nowIso();
  const context = normalizeRendererContext({
    run,
    phaseOutputs,
    upstream,
    mechanicalValidations,
    runtimeTrace,
    response
  });

  const trace = createRendererTrace({
    context,
    renderedAt
  });

  if (!context.finalOutputHandoff || !context.screenReportPayload) {
    return renderFailureReport({
      context,
      trace,
      renderedAt,
      reason: context.finalOutputHandoff
        ? "SCREEN_REPORT_PAYLOAD_MISSING"
        : "FINAL_OUTPUT_HANDOFF_MISSING"
    });
  }

  const screenPayload = context.screenReportPayload;
  const reportShell = asObject(screenPayload.report_shell);
  const sections = asObject(screenPayload.sections);
  const rendererContract = asObject(screenPayload.renderer_contract);
  const displayIdIndex = asObject(screenPayload.display_id_index);
  const platformDiligenceObject = asObject(screenPayload.platform_diligence_object);

  if (!Object.keys(rendererContract).length) {
    trace.warnings.push("RENDERER_CONTRACT_MISSING_OR_EMPTY");
  }

  const renderedSections = [];
  const missingSections = [];
  const missingBlocks = [];

  for (const descriptor of SECTION_ORDER) {
    const section = sections[descriptor.key];

    if (!isPlainObject(section)) {
      missingSections.push(descriptor.key);
      continue;
    }

    const blockPresence = validateSectionBlocks({
      descriptor,
      section
    });

    missingBlocks.push(...blockPresence.missing_blocks);

    renderedSections.push({
      key: descriptor.key,
      label: descriptor.label,
      html: renderScreenSection({
        descriptor,
        section,
        displayIdIndex
      })
    });
  }

  const extraSectionKeys = Object.keys(sections).filter(
    (key) => !SECTION_ORDER.some((section) => section.key === key)
  );

  const additionalSectionsHtml = extraSectionKeys.length
    ? renderAdditionalSections({
        sections,
        extraSectionKeys
      })
    : "";

  trace.sections_expected = SECTION_ORDER.map((section) => section.key);
  trace.sections_rendered = renderedSections.map((section) => section.key);
  trace.sections_missing = missingSections;
  trace.section_blocks_missing = missingBlocks;
  trace.appendix_preserved = isPlainObject(sections.forensic_ledger_appendix);
  trace.renderer_contract_present = Object.keys(rendererContract).length > 0;

  if (!trace.appendix_preserved) {
    trace.warnings.push("FORENSIC_LEDGER_APPENDIX_MISSING");
  }

  if (missingSections.length) {
    trace.warnings.push(`SCREEN_SECTIONS_MISSING:${missingSections.join(",")}`);
  }

  if (missingBlocks.length) {
    trace.warnings.push(`SCREEN_SECTION_BLOCKS_MISSING:${missingBlocks.join(",")}`);
  }

  const reportTitle = firstString(
    reportShell.report_title,
    reportShell.title,
    context.companyName ? `${context.companyName} Public-Footprint Diligence Report` : "",
    context.targetUrl ? `${context.targetUrl} Public-Footprint Diligence Report` : "",
    "Public-Footprint Diligence Report"
  );

  const forbiddenTerms = detectForbiddenVisibleTerms(screenPayload);
  if (forbiddenTerms.length) {
    trace.warnings.push(`FORBIDDEN_VISIBLE_TERMS_PRESENT_IN_SCREEN_PAYLOAD:${forbiddenTerms.join(",")}`);
    trace.forbidden_visible_terms_detected = forbiddenTerms;
  }

  const htmlReport = buildHtmlDocument({
    title: reportTitle,
    context,
    reportShell,
    renderedSections,
    additionalSectionsHtml,
    displayIdIndex,
    platformDiligenceObject,
    rendererContract,
    trace
  });

  const reportJson = {
    renderer_version: RENDERER_VERSION,
    render_status: trace.warnings.length ? "RENDERED_WITH_WARNINGS" : "RENDERED",
    rendered_at: renderedAt,
    input_source: trace.input_source,
    report_title: reportTitle,
    final_output_handoff: context.finalOutputHandoff,
    screen_report_payload: screenPayload,
    integrated_json_report: context.finalOutputHandoff.integrated_json_report || null,
    vault_assembler_handoff: context.finalOutputHandoff.vault_assembler_handoff || null,
    renderer_trace: trace
  };

  return {
    renderer_output: {
      renderer_version: RENDERER_VERSION,
      render_status: trace.warnings.length ? "RENDERED_WITH_WARNINGS" : "RENDERED",
      report_title: reportTitle,
      html_report: htmlReport,
      plain_text_summary: buildPlainTextSummary({
        title: reportTitle,
        context,
        trace
      }),
      report_json: reportJson,
      export_payload: {
        artifact_type: "rendered_report",
        html_report_present: true,
        report_json_present: true,
        renderer_version: RENDERER_VERSION,
        rendered_at: renderedAt
      },
      download_artifacts: []
    },
    renderer_trace: trace,
    rendered_report: {
      html: htmlReport,
      report_json: reportJson
    }
  };
}

function normalizeRendererContext({
  run = {},
  phaseOutputs = {},
  upstream = {},
  mechanicalValidations = {},
  runtimeTrace = null,
  response = null
} = {}) {
  const p7 = firstPlainObject(
    phaseOutputs.P7,
    upstream.P7,
    response?.phase_outputs?.P7,
    response?.P7,
    response?.final_output_handoff ? { final_output_handoff: response.final_output_handoff } : null
  );

  const finalOutputHandoff = firstPlainObject(
    p7?.final_output_handoff,
    response?.final_output_handoff
  );

  const screenReportPayload = firstPlainObject(
    finalOutputHandoff?.screen_report_payload,
    response?.screen_report_payload
  );

  return {
    run,
    response,
    p7,
    finalOutputHandoff,
    screenReportPayload,
    phaseOutputs,
    upstream,
    mechanicalValidations,
    runtimeTrace,
    runId: firstString(run.run_id, response?.run_id, finalOutputHandoff?.run_meta?.run_id),
    targetUrl: firstString(run.target_url, response?.target_url, finalOutputHandoff?.run_meta?.target_url),
    companyName: firstString(run.company_name, response?.company_name, finalOutputHandoff?.run_meta?.company_name),
    sourceMode: firstString(run.source_mode, response?.source_mode, finalOutputHandoff?.run_meta?.source_mode),
    status: firstString(response?.status, "PHASE_STACK_COMPLETE"),
    failedNode: firstString(response?.failed_node, response?.phase_stack?.failed_node),
    completedNodes: safeArray(response?.completed_nodes || response?.phase_stack?.completed_nodes)
  };
}

function createRendererTrace({ context, renderedAt }) {
  return {
    renderer_version: RENDERER_VERSION,
    rendered_at: renderedAt,
    render_mode: context.screenReportPayload ? "SUCCESS_RENDER" : "FAILURE_RENDER",
    input_source: context.screenReportPayload
      ? "P7.final_output_handoff.screen_report_payload"
      : context.finalOutputHandoff
        ? "P7.final_output_handoff"
        : "phase_stack_failure_context",
    no_substantive_mutation: true,
    deterministic_only: true,
    raw_html_allowed_from_input: false,
    sections_expected: [],
    sections_rendered: [],
    sections_missing: [],
    section_blocks_missing: [],
    appendix_preserved: false,
    renderer_contract_present: false,
    warnings: [],
    errors: []
  };
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
    ["Status", context.status || "CONTROLLED_FAILURE"],
    ["Failed node", context.failedNode || "N/A"],
    ["Completed nodes", context.completedNodes.length ? context.completedNodes.join(", ") : "N/A"],
    ["Renderer reason", reason]
  ];

  const validationSummary = summarizeMechanicalValidations(context.mechanicalValidations);

  const htmlReport = htmlPage({
    title,
    body: `
      ${renderHero({
        title,
        subtitle: "The pipeline did not produce a complete screen report payload. This page is a controlled failure report, not a final diligence report.",
        status: "CONTROLLED_FAILURE",
        context
      })}

      <section class="card">
        <h2>Run Status</h2>
        ${renderKeyValueTable(failureRows)}
      </section>

      <section class="card">
        <h2>What This Means</h2>
        <p>${escapeHtml(PUBLIC_LIMITATION_TEXT)}</p>
        <p>The run should not be treated as a complete final report. Review the failed node, mechanical validations, and runtime trace before relying on any partial output.</p>
      </section>

      <section class="card">
        <h2>Mechanical Validation Summary</h2>
        ${renderGenericValue(validationSummary)}
      </section>

      <section class="card">
        <h2>Runtime Trace Summary</h2>
        ${renderGenericValue(compactRuntimeTrace(context.runtimeTrace))}
      </section>
    `
  });

  const reportJson = {
    renderer_version: RENDERER_VERSION,
    render_status: "FAILURE_RENDERED",
    rendered_at: renderedAt,
    failure_reason: reason,
    run_id: context.runId || null,
    status: context.status || null,
    failed_node: context.failedNode || null,
    completed_nodes: context.completedNodes,
    mechanical_validations: context.mechanicalValidations,
    runtime_trace_summary: compactRuntimeTrace(context.runtimeTrace),
    renderer_trace: trace
  };

  return {
    renderer_output: {
      renderer_version: RENDERER_VERSION,
      render_status: "FAILURE_RENDERED",
      report_title: title,
      html_report: htmlReport,
      plain_text_summary: `${title}\nStatus: ${context.status || "CONTROLLED_FAILURE"}\nReason: ${reason}`,
      report_json: reportJson,
      export_payload: {
        artifact_type: "controlled_failure_report",
        html_report_present: true,
        report_json_present: true,
        renderer_version: RENDERER_VERSION,
        rendered_at: renderedAt
      },
      download_artifacts: []
    },
    renderer_trace: trace,
    rendered_report: {
      html: htmlReport,
      report_json: reportJson
    }
  };
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
        subtitle: "Public-footprint diligence report generated from the final screen report payload.",
        status: trace.warnings.length ? "RENDERED_WITH_WARNINGS" : "RENDERED",
        context
      })}

      <section class="notice">
        <strong>Review boundary:</strong> ${escapeHtml(PUBLIC_LIMITATION_TEXT)}
      </section>

      <section class="card">
        <h2>Report Shell</h2>
        ${renderKeyValueTable(shellRows)}
      </section>

      <nav class="toc card">
        <h2>Report Sections</h2>
        <div class="toc-links">${sectionToc}</div>
      </nav>

      ${renderedSections.map((section) => section.html).join("\n")}

      ${additionalSectionsHtml}

      <section class="card">
        <h2>Display ID Index</h2>
        ${renderGenericValue(displayIdIndex)}
      </section>

      <section class="card">
        <h2>Platform Diligence Object</h2>
        ${renderGenericValue(platformDiligenceObject)}
      </section>

      <details class="card technical">
        <summary>Renderer Contract</summary>
        ${renderGenericValue(rendererContract)}
      </details>

      <details class="card technical" open>
        <summary>Renderer Trace</summary>
        ${renderGenericValue(trace)}
      </details>
    `
  });
}

function renderHero({ title, subtitle, status, context }) {
  const target = firstString(context.companyName, context.targetUrl, "Target not specified");
  return `
    <header class="hero">
      <div>
        <p class="eyebrow">Lex Nova HQ · Public-Footprint Diligence</p>
        <h1>${escapeHtml(title)}</h1>
        <p class="subtitle">${escapeHtml(subtitle)}</p>
      </div>
      <div class="hero-meta">
        ${renderBadge(status)}
        <div class="meta-line"><span>Target</span><strong>${escapeHtml(target)}</strong></div>
        <div class="meta-line"><span>Run ID</span><strong>${escapeHtml(context.runId || "N/A")}</strong></div>
      </div>
    </header>
  `;
}

function renderScreenSection({ descriptor, section, displayIdIndex }) {
  if (descriptor.key === "exposure_findings") {
    return renderExposureFindingsSection({ descriptor, section, displayIdIndex });
  }

  if (descriptor.key === "forensic_ledger_appendix") {
    return renderAppendixSection({ descriptor, section });
  }

  const renderedBlocks = Object.entries(section).map(([blockKey, value]) => `
    <div class="block">
      <h3>${escapeHtml(displayLabel(blockKey))}</h3>
      ${renderGenericValue(value)}
    </div>
  `).join("");

  return `
    <section class="card report-section" id="${escapeAttr(descriptor.key)}">
      <h2>${escapeHtml(descriptor.label)}</h2>
      ${renderedBlocks || `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`}
    </section>
  `;
}

function renderExposureFindingsSection({ descriptor, section, displayIdIndex }) {
  const findingRows = safeArray(section.finding_rows);
  const otherBlocks = Object.entries(section)
    .filter(([key]) => key !== "finding_rows")
    .map(([blockKey, value]) => `
      <div class="block">
        <h3>${escapeHtml(displayLabel(blockKey))}</h3>
        ${renderGenericValue(value)}
      </div>
    `).join("");

  const findingCards = findingRows.length
    ? findingRows.map((finding, index) => renderFindingCard({ finding, index, displayIdIndex })).join("")
    : `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;

  return `
    <section class="card report-section" id="${escapeAttr(descriptor.key)}">
      <h2>${escapeHtml(descriptor.label)}</h2>
      ${otherBlocks}
      <div class="block">
        <h3>Finding Rows</h3>
        <div class="finding-grid">
          ${findingCards}
        </div>
      </div>
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
      <div class="finding-head">
        <span class="display-id">${escapeHtml(displayId)}</span>
        ${renderBadge(status)}
      </div>
      <h4>${escapeHtml(title)}</h4>
      <p>${escapeHtml(summary)}</p>
      ${relatedActivity ? `<p><strong>Related activity:</strong> ${escapeHtml(relatedActivity)}</p>` : ""}
      ${controlPosition ? `<p><strong>Visible control position:</strong> ${escapeHtml(controlPosition)}</p>` : ""}
      ${Object.keys(evidencePreview).length ? `
        <div class="evidence-preview">
          <strong>Evidence preview</strong>
          ${renderGenericValue(evidencePreview)}
        </div>
      ` : ""}
      ${item.qualified_review_flag ? `<p class="review-flag">Qualified reviewer should verify.</p>` : ""}
      <details>
        <summary>Technical refs</summary>
        ${renderGenericValue({
          ...technicalRefs,
          display_id_index_entry: displayIdIndex?.[displayId] || null
        })}
      </details>
    </article>
  `;
}

function renderAppendixSection({ descriptor, section }) {
  const blocks = Object.entries(section).map(([blockKey, value]) => {
    const open = blockKey === "full_registry_ledger" ? " open" : "";
    return `
      <details class="appendix-block"${open}>
        <summary>${escapeHtml(displayLabel(blockKey))}</summary>
        ${renderGenericValue(value)}
      </details>
    `;
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
      ${extraSectionKeys.map((key) => `
        <div class="block">
          <h3>${escapeHtml(displayLabel(key))}</h3>
          ${renderGenericValue(sections[key])}
        </div>
      `).join("")}
    </details>
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

    if (value.every(isPrimitive)) {
      return `<ul>${value.map((item) => `<li>${escapeHtml(String(item))}</li>`).join("")}</ul>`;
    }

    if (value.every(isPlainObject)) {
      return renderObjectArrayTable(value, depth);
    }

    return value.map((item, index) => `
      <div class="nested-card">
        <h4>Item ${index + 1}</h4>
        ${renderGenericValue(item, depth + 1)}
      </div>
    `).join("");
  }

  if (isPlainObject(value)) {
    const entries = Object.entries(value);

    if (!entries.length) {
      return `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;
    }

    if (entries.every(([, item]) => isPrimitive(item))) {
      return renderKeyValueTable(entries.map(([key, item]) => [displayLabel(key), item]));
    }

    if (depth >= 5) {
      return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
    }

    return entries.map(([key, item]) => `
      <div class="nested-block">
        <h4>${escapeHtml(displayLabel(key))}</h4>
        ${renderGenericValue(item, depth + 1)}
      </div>
    `).join("");
  }

  return `<pre>${escapeHtml(JSON.stringify(value, null, 2))}</pre>`;
}

function renderObjectArrayTable(rows, depth = 0) {
  if (!rows.length) return `<p class="muted">${escapeHtml(SAFE_EMPTY_TEXT)}</p>`;

  const columns = collectTableColumns(rows);

  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>${columns.map((col) => `<th>${escapeHtml(displayLabel(col))}</th>`).join("")}</tr>
        </thead>
        <tbody>
          ${rows.map((row) => `
            <tr>
              ${columns.map((col) => `<td>${renderTableCell(row[col], depth + 1)}</td>`).join("")}
            </tr>
          `).join("")}
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
      <table class="kv">
        <tbody>
          ${safeRows.map(([key, value]) => `
            <tr>
              <th>${escapeHtml(displayLabel(key))}</th>
              <td>${renderTableCell(value)}</td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

function renderBadge(value) {
  const label = String(value || "Visible signal");
  const normalized = label.toLowerCase();
  let tone = "neutral";

  if (normalized.includes("warning") || normalized.includes("partial") || normalized.includes("unclear")) tone = "warn";
  if (normalized.includes("failed") || normalized.includes("missing") || normalized.includes("access")) tone = "alert";
  if (normalized.includes("rendered") || normalized.includes("present") || normalized.includes("complete")) tone = "ok";
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
      --bg: #f6f4ef;
      --card: #ffffff;
      --text: #1d1d1f;
      --muted: #666b73;
      --line: #ddd7cc;
      --accent: #27364a;
      --accent-soft: #e8edf5;
      --warn: #8a5a00;
      --warn-bg: #fff3d6;
      --alert: #9f2626;
      --alert-bg: #ffe2e2;
      --ok: #1f6f43;
      --ok-bg: #ddf5e7;
      --review: #5b3d91;
      --review-bg: #eee7ff;
      --mono: ui-monospace, SFMono-Regular, Menlo, Consolas, "Liberation Mono", monospace;
      --sans: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      background: var(--bg);
      color: var(--text);
      font-family: var(--sans);
      line-height: 1.55;
    }

    .page {
      width: min(1180px, calc(100% - 32px));
      margin: 0 auto;
      padding: 28px 0 60px;
    }

    .hero {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 320px;
      gap: 22px;
      align-items: stretch;
      padding: 32px;
      border-radius: 24px;
      background: linear-gradient(135deg, #ffffff, #edf1f7);
      border: 1px solid var(--line);
      box-shadow: 0 18px 45px rgba(31, 39, 54, 0.08);
      margin-bottom: 18px;
    }

    .eyebrow {
      margin: 0 0 8px;
      color: var(--accent);
      font-weight: 800;
      letter-spacing: .08em;
      text-transform: uppercase;
      font-size: 12px;
    }

    h1 {
      margin: 0;
      font-size: clamp(30px, 5vw, 56px);
      line-height: 1.02;
      letter-spacing: -0.04em;
    }

    .subtitle {
      max-width: 780px;
      color: var(--muted);
      font-size: 17px;
      margin: 16px 0 0;
    }

    .hero-meta {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 18px;
      border-radius: 18px;
      background: rgba(255,255,255,.72);
      border: 1px solid var(--line);
    }

    .meta-line span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: .06em;
      margin-bottom: 3px;
    }

    .meta-line strong {
      display: block;
      overflow-wrap: anywhere;
    }

    .notice {
      border: 1px solid #e4c878;
      background: #fff8df;
      padding: 16px 18px;
      border-radius: 18px;
      margin: 18px 0;
    }

    .card {
      background: var(--card);
      border: 1px solid var(--line);
      border-radius: 20px;
      padding: 24px;
      margin: 18px 0;
      box-shadow: 0 10px 28px rgba(31,39,54,.05);
    }

    .report-section h2,
    .card h2 {
      margin-top: 0;
      font-size: 28px;
      letter-spacing: -0.02em;
    }

    h3 {
      font-size: 18px;
      margin: 20px 0 10px;
    }

    h4 {
      margin: 14px 0 8px;
      font-size: 15px;
    }

    .block,
    .nested-block {
      border-top: 1px solid var(--line);
      padding-top: 14px;
      margin-top: 14px;
    }

    .nested-card {
      border: 1px solid var(--line);
      background: #fbfaf7;
      border-radius: 14px;
      padding: 14px;
      margin: 10px 0;
    }

    .toc-links {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }

    .toc-links a {
      text-decoration: none;
      padding: 8px 12px;
      border-radius: 999px;
      background: var(--accent-soft);
      color: var(--accent);
      font-weight: 700;
      font-size: 14px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      width: max-content;
      padding: 6px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: .02em;
      background: var(--accent-soft);
      color: var(--accent);
      text-transform: uppercase;
    }

    .badge.warn { background: var(--warn-bg); color: var(--warn); }
    .badge.alert { background: var(--alert-bg); color: var(--alert); }
    .badge.ok { background: var(--ok-bg); color: var(--ok); }
    .badge.review { background: var(--review-bg); color: var(--review); }

    .finding-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(290px, 1fr));
      gap: 14px;
    }

    .finding-card {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 16px;
      background: #fbfaf7;
    }

    .finding-head {
      display: flex;
      justify-content: space-between;
      gap: 10px;
      align-items: center;
      margin-bottom: 10px;
    }

    .display-id {
      font-family: var(--mono);
      font-weight: 800;
      color: var(--accent);
    }

    .review-flag {
      padding: 10px 12px;
      border-radius: 12px;
      background: var(--review-bg);
      color: var(--review);
      font-weight: 700;
    }

    .evidence-preview {
      border-left: 4px solid var(--line);
      padding-left: 12px;
      margin: 12px 0;
    }

    .appendix-block {
      border-top: 1px solid var(--line);
      padding-top: 12px;
      margin-top: 12px;
    }

    details summary {
      cursor: pointer;
      font-weight: 800;
      color: var(--accent);
    }

    .technical {
      background: #fbfaf7;
    }

    .table-wrap {
      overflow-x: auto;
      width: 100%;
    }

    table {
      border-collapse: collapse;
      width: 100%;
      min-width: 520px;
      font-size: 14px;
    }

    th,
    td {
      border: 1px solid var(--line);
      padding: 10px 12px;
      vertical-align: top;
      text-align: left;
    }

    th {
      background: #f2efe8;
      color: #333;
      font-weight: 800;
    }

    table.kv th {
      width: 260px;
    }

    pre {
      max-width: 100%;
      overflow-x: auto;
      padding: 14px;
      border-radius: 14px;
      background: #161a22;
      color: #eef2f7;
      font-family: var(--mono);
      font-size: 12px;
      line-height: 1.45;
    }

    .muted {
      color: var(--muted);
    }

    @media (max-width: 860px) {
      .hero {
        grid-template-columns: 1fr;
        padding: 24px;
      }

      .card {
        padding: 18px;
      }
    }

    @media print {
      body { background: #fff; }
      .page { width: 100%; padding: 0; }
      .card, .hero, .notice { box-shadow: none; break-inside: avoid; }
      .toc { display: none; }
      details { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <main class="page">
    ${body}
  </main>
</body>
</html>`;
}

function validateSectionBlocks({ descriptor, section }) {
  const missing = [];
  for (const block of descriptor.required_blocks || []) {
    if (!Object.prototype.hasOwnProperty.call(section, block)) {
      missing.push(`${descriptor.key}.${block}`);
    }
  }
  return { missing_blocks: missing };
}

function buildPlainTextSummary({ title, context, trace }) {
  return [
    title,
    "",
    `Run ID: ${context.runId || "N/A"}`,
    `Target: ${context.companyName || context.targetUrl || "N/A"}`,
    `Render status: ${trace.warnings.length ? "RENDERED_WITH_WARNINGS" : "RENDERED"}`,
    `Sections rendered: ${trace.sections_rendered.length}/${trace.sections_expected.length}`,
    trace.warnings.length ? `Warnings: ${trace.warnings.join("; ")}` : "Warnings: none",
    "",
    PUBLIC_LIMITATION_TEXT
  ].join("\n");
}

function detectForbiddenVisibleTerms(value) {
  const text = JSON.stringify(value || {}).toLowerCase();
  return FORBIDDEN_VISIBLE_TERMS.filter((term) => text.includes(term.toLowerCase()));
}

function compactRuntimeTrace(trace) {
  if (!trace || typeof trace !== "object") return null;
  return {
    run_id: trace.run_id,
    active_runtime: trace.active_runtime,
    started_at: trace.started_at,
    ended_at: trace.ended_at,
    operational_limits: trace.operational_limits,
    source_runtime_trace: trace.source_runtime_trace,
    p6: {
      route_plan_summary: trace.p6?.route_plan_summary || null,
      batch_coverage_validation: trace.p6?.batch_coverage_validation || null,
      batch_results_count: Array.isArray(trace.p6?.batch_results_summary)
        ? trace.p6.batch_results_summary.length
        : 0
    },
    stage_statuses: Object.fromEntries(
      Object.entries(trace.stages || {}).map(([key, value]) => [key, value?.status || null])
    ),
    gate_statuses: Object.fromEntries(
      Object.entries(trace.gates || {}).map(([key, value]) => [key, Boolean(value?.ok)])
    )
  };
}

function summarizeMechanicalValidations(validations = {}) {
  return Object.fromEntries(
    Object.entries(validations || {}).map(([key, validation]) => [
      key,
      {
        ok: Boolean(validation?.ok),
        errors: validation?.errors || [],
        warnings: validation?.warnings || []
      }
    ])
  );
}

function collectTableColumns(rows) {
  const preferred = [
    "display_exposure_id",
    "normalized_threat_name",
    "normalized_category",
    "display_status",
    "plain_english_summary",
    "related_activity",
    "visible_control_position",
    "qualified_review_flag",
    "Threat_ID",
    "threat_id",
    "registry_row_id",
    "evaluation_status",
    "evaluation_confidence",
    "row_route_reason"
  ];

  const seen = new Set();
  const columns = [];

  for (const key of preferred) {
    if (rows.some((row) => Object.prototype.hasOwnProperty.call(row, key))) {
      columns.push(key);
      seen.add(key);
    }
  }

  for (const row of rows) {
    for (const key of Object.keys(row || {})) {
      if (!seen.has(key)) {
        columns.push(key);
        seen.add(key);
      }
    }
  }

  return columns;
}

function objectToRows(object) {
  return Object.entries(object || {}).filter(([, value]) => value !== undefined && value !== null && value !== "");
}

function displayLabel(key) {
  const raw = String(key || "");
  if (SECTION_LABEL_OVERRIDES[raw]) return SECTION_LABEL_OVERRIDES[raw];

  return raw
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase())
    .replace(/\bIp\b/g, "IP")
    .replace(/\bAi\b/g, "AI")
    .replace(/\bPii\b/g, "PII");
}

function firstPlainObject(...values) {
  for (const value of values) {
    if (isPlainObject(value)) return value;
  }
  return null;
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value || "").trim();
    if (text) return text;
  }
  return "";
}

function asObject(value) {
  return isPlainObject(value) ? value : {};
}

function safeArray(value) {
  return Array.isArray(value) ? value : [];
}

function isPrimitive(value) {
  return value === null || ["string", "number", "boolean"].includes(typeof value);
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nowIso() {
  return new Date().toISOString();
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\s+/g, "-");
}
