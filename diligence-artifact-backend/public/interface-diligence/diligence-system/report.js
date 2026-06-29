const params = new URLSearchParams(window.location.search);
const runId = params.get("run_id") || "";

const els = {
  title: document.getElementById("reportTitle"),
  subtitle: document.getElementById("reportSubtitle"),
  meta: document.getElementById("reportMeta"),
  body: document.getElementById("reportBody"),
  technical: document.getElementById("technicalPayload"),
  pdf: document.getElementById("downloadPdfButton"),
  vault: document.getElementById("vaultButton")
};

els.pdf.addEventListener("click", () => window.print());

if (!runId) {
  fail("Missing run_id in report URL.");
} else {
  els.vault.href = `/vault/intake.html?source=diligence-system&run_id=${encodeURIComponent(runId)}`;
  loadReport(runId).catch((error) => fail(error.message || String(error)));
}

async function loadReport(id) {
  const response = await fetch(`/public/diligence-system/report/${encodeURIComponent(id)}`);
  const json = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`${response.status}: ${json.message || json.error || "Report not ready"}`);

  const payload = json.renderer_payload || {};
  const shell = payload.report_shell || {};
  const sections = normalizeSections(payload);

  els.title.textContent = shell.report_title || "Interface Public-Footprint Diligence Report";
  els.subtitle.textContent = shell.report_subtitle || "Completed diligence report generated from locked backend artifacts.";
  els.meta.innerHTML = renderObjectAsTable({
    target: shell.target_display_name,
    target_domain: shell.target_domain,
    run_id: shell.run_id || id,
    validation_status: shell.validation_status,
    generated_at: shell.generated_at,
    report_mode: shell.report_mode,
    evidence_cutoff: shell.evidence_cutoff
  });

  els.body.innerHTML = sections.map((section) => `
    <section class="report-section" id="${escapeAttr(section.id)}">
      <div class="eyebrow">${escapeHtml(section.id)}</div>
      <h2>${escapeHtml(section.title)}</h2>
      ${renderValue(section.data)}
    </section>
  `).join("");

  els.technical.textContent = JSON.stringify(payload, null, 2);
}

function normalizeSections(payload = {}) {
  if (Array.isArray(payload.section_list) && payload.section_list.length) {
    return payload.section_list.map((section) => ({
      id: section.id || section.key || "section",
      title: section.title || section.heading || section.id || "Section",
      data: section.data || section
    }));
  }
  const sections = payload.sections || {};
  if (sections && typeof sections === "object" && !Array.isArray(sections)) {
    const order = Array.isArray(payload.section_order) ? payload.section_order : Object.keys(sections);
    return order.filter((key) => sections[key]).map((key) => ({
      id: key,
      title: sections[key].heading || titleCase(key),
      data: sections[key]
    }));
  }
  return [{ id: "renderer_payload", title: "Renderer Payload", data: payload }];
}

function renderValue(value) {
  if (value === null || value === undefined || value === "") return `<p class="small-muted">Not visible in reviewed public materials.</p>`;
  if (Array.isArray(value)) return renderArray(value);
  if (typeof value === "object") return renderObject(value);
  return `<p>${escapeHtml(String(value))}</p>`;
}

function renderArray(items) {
  if (!items.length) return `<p class="small-muted">No rows emitted for this section.</p>`;
  return `<div class="value-list">${items.map((item, index) => `<div class="array-block"><div class="block-title">Row ${String(index + 1).padStart(2, "0")}</div>${renderValue(item)}</div>`).join("")}</div>`;
}

function renderObject(object) {
  const entries = Object.entries(object || {}).filter(([, value]) => value !== undefined);
  if (!entries.length) return `<p class="small-muted">No visible values emitted.</p>`;
  const primitiveEntries = entries.filter(([, value]) => value === null || typeof value !== "object");
  const complexEntries = entries.filter(([, value]) => value && typeof value === "object");
  return `${primitiveEntries.length ? renderObjectAsTable(Object.fromEntries(primitiveEntries)) : ""}${complexEntries.map(([key, value]) => `<div class="object-block"><div class="block-title">${escapeHtml(titleCase(key))}</div>${renderValue(value)}</div>`).join("")}`;
}

function renderObjectAsTable(object) {
  const rows = Object.entries(object || {}).filter(([, value]) => value !== undefined && value !== null && value !== "");
  if (!rows.length) return `<p class="small-muted">No visible values emitted.</p>`;
  return `<table class="kv"><tbody>${rows.map(([key, value]) => `<tr><th>${escapeHtml(titleCase(key))}</th><td>${escapeHtml(formatPrimitive(value))}</td></tr>`).join("")}</tbody></table>`;
}

function formatPrimitive(value) {
  if (Array.isArray(value)) return value.map(formatPrimitive).join(", ");
  if (value && typeof value === "object") return JSON.stringify(value);
  return String(value ?? "");
}

function titleCase(value) {
  return String(value || "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (match) => match.toUpperCase());
}

function fail(message) {
  els.title.textContent = "Report unavailable";
  els.subtitle.textContent = message;
  els.meta.innerHTML = `<p class="small-muted">${escapeHtml(message)}</p>`;
  els.body.innerHTML = "";
  els.technical.textContent = message;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\s+/g, "-");
}
