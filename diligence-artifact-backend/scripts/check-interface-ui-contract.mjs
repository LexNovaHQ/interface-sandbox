import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const uiLock = read("docs/ui/INTERFACE_UI_LOCK_v1.md");
const reportLock = read("docs/ui/INTERFACE_REPORT_STRUCTURE_LOCK_v1.md");
const shellCss = read("public/interface-diligence/diligence-system/interface-ui-shell.css");
const landingPolishCss = read("public/interface-diligence/diligence-system/interface-landing-polish.css");
const reportDocumentCss = read("public/interface-diligence/diligence-system/interface-report-document.css");
const reportDocumentJs = read("public/interface-diligence/diligence-system/report-document.js");
const reportPaginationJs = read("public/interface-diligence/diligence-system/report-pagination.js");
const reportHtml = read("public/interface-diligence/diligence-system/report.html");
const rendererService = read("src/runtime/services/reporting/report-renderer.service.js");
const p12Bridge = read("public/interface-diligence/diligence-system/report-p12-payload-adapter.js");
const landing = read("public/interface-diligence/diligence-system/index.html");
const annexure = read("public/interface-diligence/diligence-system/technical-annexure.html");
const qualifiedReview = read("public/interface-diligence/diligence-system/qualified-review.html");
const packageJson = JSON.parse(read("package.json"));

const shellImport = "interface-ui-shell.css?v=shell-v1-20260713";
const landingPolishImport = "interface-landing-polish.css?v=landing-v1-20260713";
const reportDocumentImport = "interface-report-document.css?v=report-document-v1-20260713";
const shellPages = [
  ["landing", landing],
  ["report", reportHtml],
  ["technical_annexure", annexure],
  ["qualified_review", qualifiedReview]
];
const legacySectionIds = [
  "matter_overview",
  "executive_summary",
  "target_profile",
  "product_activity_ip_profile",
  "data_provenance_controls",
  "legal_document_control_review",
  "exposure_findings",
  "review_route_handoff_plan",
  "clarification_missing_source_queue",
  "methodology_limitations_public_annexure"
];

assert.match(uiLock, /Interface Sandbox is a multi-sector diligence engine/, "UI lock must preserve multi-sector Interface identity");
assert.match(uiLock, /It is not Lex Nova-branded UI/, "UI lock must prevent Lex Nova rebrand drift");
assert.match(uiLock, /renderer_payload\.v14\.co_p12_05/, "UI lock must name current Phase 12 renderer schema");
assert.match(uiLock, /report_manifest_clean_profiles/, "UI lock must name current Phase 12 renderer source");

assert.match(reportLock, /senior-partner legal diligence document/, "report structure lock must require senior-partner document grammar");
assert.match(reportLock, /maximum 10 visible rows per page/, "report structure lock must cap browser tables at 10 rows");
assert.match(reportLock, /maximum 5 visible cards per page/, "report structure lock must cap browser decks at 5 cards");
assert.match(reportLock, /primary_classification\.behavior_class_codes/, "report structure lock must preserve primary behaviour classification path");
assert.match(reportLock, /overlay_classifications\[\]\.behavior_class_codes/, "report structure lock must preserve overlay behaviour classification path");
assert.match(reportLock, /Pain Category grouping/, "report structure lock must require Pain Category grouping");
assert.match(reportLock, /Subcategory grouping/, "report structure lock must require Subcategory grouping");
assert.match(reportLock, /Public Download JSON is forbidden/, "report structure lock must forbid public JSON download");

assert.match(landing, /<title>Interface Diligence Engine<\/title>/, "landing title changed unexpectedly");
assert.match(landing, /<span class="wordmark-title">The Interface<\/span>/, "landing wordmark changed unexpectedly");
assert.match(landing, /Law × Technology · AI Governance · Privacy · Systems/, "landing subtitle changed unexpectedly");
assert.match(landing, /<div class="eyebrow">Diligence Intake<\/div>/, "landing eyebrow changed unexpectedly");
assert.match(landing, /<h1>Start a legal diligence run\.<\/h1>/, "landing hero title changed unexpectedly");
assert.doesNotMatch(landing, /Lex Nova Diligence Engine/, "landing page must not be rebranded to Lex Nova");

assert.match(shellCss, /INTERFACE_UI_SHELL_V1/, "shared shell CSS must carry INTERFACE_UI_SHELL_V1 marker");
assert.match(shellCss, /--interface-shell-version: "interface_ui_shell\.v1"/, "shared shell CSS must expose shell version token");
assert.match(shellCss, /\.interface-topbar/, "shared shell CSS must include header shell primitives");
assert.match(shellCss, /\.footer-note/, "shared shell CSS must include footer shell primitives");
assert.match(shellCss, /prefers-reduced-motion/, "shared shell CSS must include reduced-motion protection");
assert.doesNotMatch(shellCss, /Lex Nova Diligence Engine/, "shared shell CSS must not introduce Lex Nova rebrand text");

assert.match(landingPolishCss, /INTERFACE_LANDING_POLISH_V1/, "landing polish CSS must carry INTERFACE_LANDING_POLISH_V1 marker");
assert.match(landingPolishCss, /--interface-landing-polish-version: "interface_landing_polish\.v1"/, "landing polish CSS must expose landing polish version token");
assert.match(landingPolishCss, /\.diligence-gate-page \.gate-hero/, "landing polish must refine the landing hero");
assert.match(landingPolishCss, /\.diligence-gate-page \.gate-status-priority/, "landing polish must refine Run Status command center");
assert.match(landingPolishCss, /\.diligence-gate-page \.gate-run-monitor/, "landing polish must refine live run monitor");
assert.match(landingPolishCss, /\.diligence-gate-page \.gate-workbench/, "landing polish must refine matter workbench layout");
assert.match(landingPolishCss, /\.diligence-gate-page \.gate-path-list/, "landing polish must refine Review Path cards");
assert.match(landingPolishCss, /\.diligence-gate-page \.mobile-funnel/, "landing polish must refine mobile funnel");
assert.match(landingPolishCss, /prefers-reduced-motion/, "landing polish must include reduced-motion protection");
assert.doesNotMatch(landingPolishCss, /Lex Nova Diligence Engine/, "landing polish CSS must not introduce Lex Nova rebrand text");

for (const [pageName, source] of shellPages) {
  assert.match(source, new RegExp(escapeRegExp(shellImport)), `${pageName} must import shared Interface UI shell`);
  assert.match(source, /interface-header\.css/, `${pageName} must preserve Interface header CSS import`);
  assert.match(source, /<span class="wordmark-title">The Interface<\/span>/, `${pageName} must preserve The Interface wordmark`);
  assert.match(source, /Law × Technology · AI Governance · Privacy · Systems/, `${pageName} must preserve Interface subtitle`);
  assert.doesNotMatch(source, /Lex Nova Diligence Engine/, `${pageName} must not be rebranded to Lex Nova`);
}

assert.match(landing, new RegExp(escapeRegExp(landingPolishImport)), "landing page must import page-specific polish layer");
assert.ok(landing.indexOf(shellImport) > landing.indexOf("diligence-homepage-gate.css"), "landing shell import must load after landing page CSS");
assert.ok(landing.indexOf(landingPolishImport) > landing.indexOf(shellImport), "landing polish import must load after shared shell CSS");
assert.ok(annexure.indexOf(shellImport) > annexure.indexOf("interface-header.css"), "annexure shell import must load after header CSS");
assert.ok(qualifiedReview.indexOf(shellImport) > qualifiedReview.indexOf("qualified-review.css"), "QR shell import must load after QR page CSS");

assert.match(reportHtml, new RegExp(escapeRegExp(reportDocumentImport)), "report page must import report document CSS");
assert.ok(reportHtml.indexOf(reportDocumentImport) > reportHtml.indexOf(shellImport), "report document CSS must load after shared shell CSS");
assert.doesNotMatch(reportHtml, /report-table-overrides\.css/, "retired card/table report CSS must not remain loaded");
assert.doesNotMatch(reportHtml, /report-dap-row-layout\.css/, "retired DAP card layout CSS must not remain loaded");
assert.match(reportHtml, /class="report-paper"/, "report page must contain continuous report paper");
assert.match(reportHtml, /class="report-utility-bar no-print"/, "report page must contain slim utility toolbar");
assert.match(reportHtml, /class="report-cover"/, "report page must contain formal report cover");
assert.match(reportHtml, /id="reportMeta"/, "report page must preserve matter caption target");
assert.match(reportHtml, /id="reportStatusStrip"/, "report page must contain restrained status strip");
assert.doesNotMatch(reportHtml, /report-meta-card/, "report metadata must not render as a dashboard card");
assert.doesNotMatch(reportHtml, /report-control-card/, "report controls must not render as a dashboard card");

const adapterIndex = reportHtml.indexOf("report-p12-payload-adapter.js");
const paginationIndex = reportHtml.indexOf("report-pagination.js");
const documentRendererIndex = reportHtml.indexOf("report-document.js");
assert.ok(adapterIndex > -1, "report.html must load report-p12-payload-adapter.js");
assert.ok(paginationIndex > adapterIndex, "report pagination engine must load after P12 adapter");
assert.ok(documentRendererIndex > paginationIndex, "section-aware report renderer must load after pagination engine");
assert.doesNotMatch(reportHtml, /report\.js\?v=section-card-rows/, "old generic report renderer must not remain loaded");
assert.doesNotMatch(reportHtml, /report-ui-sync\.js/, "old report UI sync layer must not remain loaded");
assert.match(reportHtml, /id="technicalAnnexureButton"/, "technical annexure link must remain present");
assert.match(reportHtml, /id="qualifiedReviewButton"/, "qualified review action must remain present");
assert.match(reportHtml, /id="reportFooterQualifiedReviewButton"/, "footer qualified review action must remain present");
assert.match(reportHtml, /id="headerQualifiedReviewLink"/, "header qualified review link must remain present");
assert.match(reportHtml, /id="downloadPdfButton"/, "Download PDF action must remain present");
assert.doesNotMatch(reportHtml, /Download JSON/i, "public report must not expose Download JSON");

assert.match(reportDocumentCss, /INTERFACE_REPORT_DOCUMENT_V1/, "report document CSS version marker missing");
assert.match(reportDocumentCss, /--interface-report-document-version: "interface_report_document\.v1"/, "report document CSS version token missing");
assert.match(reportDocumentCss, /--report-paper:/, "report document CSS must define warm paper token");
assert.match(reportDocumentCss, /\.report-paper/, "report document CSS must style continuous report paper");
assert.match(reportDocumentCss, /\.report-document-section/, "report document CSS must style editorial sections");
assert.match(reportDocumentCss, /\.report-document-table/, "report document CSS must style report tables");
assert.match(reportDocumentCss, /\.report-detail-deck/, "report document CSS must style bounded detail decks");
assert.match(reportDocumentCss, /@page\s*\{[\s\S]*size: A4/, "report document CSS must define A4 print output");
assert.match(reportDocumentCss, /\.is-page-hidden \{ display: table-row !important; \}/, "print CSS must expand all paginated table rows");
assert.match(reportDocumentCss, /\.report-detail-card\.is-page-hidden \{ display: block !important; \}/, "print CSS must expand all paginated detail cards");

assert.match(reportPaginationJs, /interface_report_pagination\.v1/, "report pagination version marker missing");
assert.match(reportPaginationJs, /const TABLE_PAGE_SIZE = 10;/, "report table page size must be 10");
assert.match(reportPaginationJs, /const DECK_PAGE_SIZE = 5;/, "report deck page size must be 5");
assert.match(reportPaginationJs, /createPagedTable/, "shared paginated table function missing");
assert.match(reportPaginationJs, /createPagedDeck/, "shared paginated deck function missing");
assert.match(reportPaginationJs, /beforeprint/, "pagination engine must support full print expansion");
assert.match(reportPaginationJs, /afterprint/, "pagination engine must restore browser state after print");
assert.doesNotMatch(reportPaginationJs, /Show All/i, "Show All must remain forbidden");

for (let section = 1; section <= 10; section += 1) {
  assert.match(reportDocumentJs, new RegExp(`function renderSection${String(section).padStart(2, "0")}\\(`), `section-aware renderer missing renderSection${String(section).padStart(2, "0")}`);
}
assert.match(reportDocumentJs, /Primary Behaviour Class/, "Section 04 must display Primary Behaviour Class separately");
assert.match(reportDocumentJs, /Primary Surface/, "Section 04 must display Primary Surface separately");
assert.match(reportDocumentJs, /Overlay Behaviour Class/, "Section 04 must display Overlay Behaviour Class separately");
assert.match(reportDocumentJs, /Overlay Surface/, "Section 04 must display Overlay Surface separately");
assert.match(reportDocumentJs, /primary_classification/, "Section 04 must consume primary_classification");
assert.match(reportDocumentJs, /overlay_classifications/, "Section 04 must consume overlay_classifications");
assert.match(reportDocumentJs, /Part A — Actors, Data and Authority/, "Section 05 Part A grouping missing");
assert.match(reportDocumentJs, /Part B — Supply Chain and Lifecycle/, "Section 05 Part B grouping missing");
assert.match(reportDocumentJs, /Part C — Risk and Readiness/, "Section 05 Part C grouping missing");
assert.match(reportDocumentJs, /const streamOrder = \["Primary Sector", "Capability Overlay"\]/, "Section 08 must preserve Primary and Overlay streams");
assert.match(reportDocumentJs, /painCategoryLabel/, "Section 08 must group by Pain Category");
assert.match(reportDocumentJs, /subcategoryLabel/, "Section 08 must group by Subcategory");
assert.match(reportDocumentJs, /compareExposureRows/, "Section 08 deterministic exposure ordering missing");
assert.match(reportDocumentJs, /pagination\.createPagedTable/, "section-aware renderer must use shared table pagination");
assert.match(reportDocumentJs, /pagination\.createPagedDeck/, "section-aware renderer must use shared deck pagination");
assert.doesNotMatch(reportDocumentJs, /DECK_PAGE_SIZE\s*=\s*5/, "page-size authority must remain in shared pagination engine");

assert.match(rendererService, /renderer_payload\.v14\.co_p12_05/, "Phase 12 renderer must retain current schema");
assert.match(rendererService, /renderer_source: RENDERER_SOURCE/, "Phase 12 renderer source marker missing");
assert.match(rendererService, /product_name: "Interface Diligence Engine"/, "Phase 12 renderer must use Interface product identity");
assert.match(rendererService, /report_title: "Diligence Report"/, "Phase 12 report title must remain product-neutral");
assert.doesNotMatch(rendererService, /Lex Nova Diligence Engine/, "Phase 12 renderer must not rebrand Interface UI as Lex Nova");
assert.doesNotMatch(rendererService, /Lex Nova Diligence Report/, "Phase 12 renderer must not emit Lex Nova report title");
assert.match(rendererService, /schema_version: "interface_report_presentation\.v1"/, "Phase 12 presentation contract missing");
assert.match(rendererService, /table_rows_per_page: TABLE_ROWS_PER_PAGE/, "Phase 12 presentation contract must expose table limit");
assert.match(rendererService, /deck_cards_per_page: DECK_CARDS_PER_PAGE/, "Phase 12 presentation contract must expose deck limit");
assert.match(rendererService, /primary_behavior_class: "primary_classification\.behavior_class_codes"/, "Phase 12 presentation contract must preserve primary behavior path");
assert.match(rendererService, /overlay_behavior_class: "overlay_classifications\[\]\.behavior_class_codes"/, "Phase 12 presentation contract must preserve overlay behavior path");
assert.match(rendererService, /pain_category_rank/, "Phase 12 renderer must emit deterministic Pain Category rank metadata");
assert.match(rendererService, /subcategory_order/, "Phase 12 renderer must emit deterministic Subcategory ordering metadata");
assert.match(rendererService, /exposure_sort_rank/, "Phase 12 renderer must emit stable exposure sort rank");
assert.match(rendererService, /field_id: finding\.field_id/, "Phase 12 public fields must retain stable field IDs");
assert.match(rendererService, /artifact_name: artifactName/, "Phase 12 public subsections must retain clean artifact identity");
assert.match(rendererService, /profile_id: profile\.profile_id/, "Phase 12 public subsections must retain profile identity");

assert.match(p12Bridge, /interface_p12_frontend_bridge\.v1/, "P12 bridge version marker missing");
assert.match(p12Bridge, /renderer_payload\.v14\.co_p12_05/, "P12 bridge must require current renderer schema");
assert.match(p12Bridge, /report_manifest_clean_profiles/, "P12 bridge must require clean profile renderer source");
assert.match(p12Bridge, /normalized_section_artifacts_only/, "P12 bridge must explicitly reject stale renderer source");
assert.match(p12Bridge, /EXPECTED_SECTION_IDS = Object\.freeze\(\["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"\]\)/, "P12 bridge must lock 01-10 section IDs");
assert.match(p12Bridge, /public_report_navigation/, "P12 bridge must map section IDs to public report navigation");
assert.match(p12Bridge, /delete bridged\.section_order/, "P12 bridge must strip raw section_order after converting it to navigation metadata");
assert.match(p12Bridge, /technical-annexure\.html\?run_id=/, "P12 bridge must preserve Technical Annexure link bridge");
assert.match(p12Bridge, /qualified-review\.html\?run_id=/, "P12 bridge must preserve Qualified Review link bridge");
for (const legacy of legacySectionIds) assert.match(p12Bridge, new RegExp(legacy), `P12 bridge must explicitly reject legacy section ID ${legacy}`);

for (const relativePath of [
  "public/interface-diligence/diligence-system/report-p12-payload-adapter.js",
  "public/interface-diligence/diligence-system/report-pagination.js",
  "public/interface-diligence/diligence-system/report-document.js",
  "src/runtime/services/reporting/report-renderer.service.js"
]) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, relativePath)], { encoding: "utf8" });
  assert.equal(result.status, 0, `${relativePath} syntax check failed: ${result.stderr || result.stdout}`);
}

assert.equal(packageJson.scripts["check:interface-ui"], "node scripts/check-interface-ui-contract.mjs", "package.json must expose check:interface-ui");

console.log(JSON.stringify({
  check: "interface-ui-contract",
  status: "PASS",
  ui_lock: "INTERFACE_UI_LOCK_v1",
  report_structure_lock: "INTERFACE_REPORT_STRUCTURE_LOCK_v1",
  shell: "interface_ui_shell.v1",
  landing_polish: "interface_landing_polish.v1",
  report_document: "interface_report_document.v1",
  report_pagination: "interface_report_pagination.v1",
  p12_bridge: "interface_p12_frontend_bridge.v1",
  renderer_schema: "renderer_payload.v14.co_p12_05",
  renderer_source: "report_manifest_clean_profiles",
  table_page_size: 10,
  deck_page_size: 5,
  section_renderer_count: 10,
  shell_pages: shellPages.map(([pageName]) => pageName),
  section_ids: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
}, null, 2));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
