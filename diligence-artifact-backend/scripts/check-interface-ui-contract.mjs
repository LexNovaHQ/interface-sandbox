import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const files = Object.freeze({
  uiLock: read("docs/ui/INTERFACE_UI_LOCK_v1.md"),
  reportLock: read("docs/ui/INTERFACE_REPORT_STRUCTURE_LOCK_v1.md"),
  shellCss: read("public/interface-diligence/diligence-system/interface-ui-shell.css"),
  landingCss: read("public/interface-diligence/diligence-system/interface-landing-polish.css"),
  reportCss: read("public/interface-diligence/diligence-system/interface-report-document.css"),
  landingHtml: read("public/interface-diligence/diligence-system/index.html"),
  reportHtml: read("public/interface-diligence/diligence-system/report.html"),
  annexureHtml: read("public/interface-diligence/diligence-system/technical-annexure.html"),
  qrHtml: read("public/interface-diligence/diligence-system/qualified-review.html"),
  p12Bridge: read("public/interface-diligence/diligence-system/report-p12-payload-adapter.js"),
  pagination: read("public/interface-diligence/diligence-system/report-pagination.js"),
  documentRenderer: read("public/interface-diligence/diligence-system/report-document.js"),
  activityPresentation: read("src/phases/12-normalized-compiler/phase12-activity-presentation.js"),
  projection: read("src/phases/12-normalized-compiler/phase12-projection-adapter.js"),
  compilerValidator: read("src/phases/12-normalized-compiler/phase12-compiler-validator.js"),
  rendererService: read("src/runtime/services/reporting/report-renderer.service.js"),
  phase12Fixture: read("scripts/test-support/phase12-production.fixture.mjs"),
  phase12Check: read("scripts/check-phase12-production.mjs"),
  packageJson: read("package.json")
});

const pkg = JSON.parse(files.packageJson);
const shellImport = "interface-ui-shell.css?v=shell-v1-20260713";
const landingImport = "interface-landing-polish.css?v=landing-v1-20260713";
const reportImport = "interface-report-document.css?v=report-document-v1-20260713";

validateIdentityLocks();
validateSharedShell();
validateLandingPage();
validateReportShell();
validateReportDesignSystem();
validatePaginationEngine();
validateSectionAwareRenderer();
validatePhase12PresentationContract();
validateProductionCoverage();
validateSyntax();

assert.equal(pkg.scripts["check:interface-ui"], "node scripts/check-interface-ui-contract.mjs", "package.json must expose check:interface-ui");

console.log(JSON.stringify({
  check: "interface-ui-contract",
  status: "PASS",
  ui_lock: "INTERFACE_UI_LOCK_v1",
  report_structure_lock: "INTERFACE_REPORT_STRUCTURE_LOCK_v1",
  shell: "interface_ui_shell.v1",
  landing_polish: "interface_landing_polish.v1",
  report_document: "interface_report_document.v1",
  report_pagination: "interface_report_pagination.v1",
  p12_activity_presentation: "phase12_activity_presentation.v1",
  p12_bridge: "interface_p12_frontend_bridge.v1",
  renderer_schema: "renderer_payload.v14.co_p12_05",
  renderer_source: "report_manifest_clean_profiles",
  table_page_size: 10,
  deck_page_size: 5,
  section_renderer_count: 10,
  primary_overlay_activity_separation: "ENFORCED",
  exposure_grouping: ["stream", "material_status", "pain_category", "subcategory"],
  old_card_renderer_loaded: false
}, null, 2));

function validateIdentityLocks() {
  mustContain(files.uiLock, "Interface Sandbox is a multi-sector diligence engine", "UI lock must preserve multi-sector Interface identity");
  mustContain(files.uiLock, "It is not Lex Nova-branded UI", "UI lock must prevent Lex Nova rebrand drift");
  mustContain(files.reportLock, "senior-partner legal diligence document", "report lock must require senior-partner document grammar");
  mustContain(files.reportLock, "maximum 10 visible rows per page", "report lock must cap tables at 10 rows");
  mustContain(files.reportLock, "maximum 5 visible cards per page", "report lock must cap decks at 5 cards");
  mustContain(files.reportLock, "primary_classification.behavior_class_codes", "report lock must preserve Primary Behaviour Class path");
  mustContain(files.reportLock, "overlay_classifications[].behavior_class_codes", "report lock must preserve Overlay Behaviour Class path");
  mustContain(files.reportLock, "Pain Category grouping", "report lock must require Pain Category grouping");
  mustContain(files.reportLock, "Subcategory grouping", "report lock must require Subcategory grouping");
  mustContain(files.reportLock, "Public Download JSON is forbidden", "report lock must forbid public JSON download");
}

function validateSharedShell() {
  mustContain(files.shellCss, "INTERFACE_UI_SHELL_V1", "shared shell marker missing");
  mustContain(files.shellCss, "interface_ui_shell.v1", "shared shell version missing");
  mustContain(files.shellCss, ".interface-topbar", "shared header primitive missing");
  mustContain(files.shellCss, ".footer-note", "shared footer primitive missing");
  mustContain(files.shellCss, "prefers-reduced-motion", "shared reduced-motion protection missing");

  for (const [name, source] of [
    ["landing", files.landingHtml],
    ["report", files.reportHtml],
    ["annexure", files.annexureHtml],
    ["qualified_review", files.qrHtml]
  ]) {
    mustContain(source, shellImport, `${name} must import shared Interface shell`);
    mustContain(source, '<span class="wordmark-title">The Interface</span>', `${name} must preserve The Interface wordmark`);
    mustContain(source, "Law × Technology · AI Governance · Privacy · Systems", `${name} must preserve curated Interface subtitle`);
    mustNotContain(source, "Lex Nova Diligence Engine", `${name} must not be rebranded to Lex Nova`);
  }
}

function validateLandingPage() {
  mustContain(files.landingHtml, "<title>Interface Diligence Engine</title>", "landing title changed unexpectedly");
  mustContain(files.landingHtml, '<div class="eyebrow">Diligence Intake</div>', "landing eyebrow changed unexpectedly");
  mustContain(files.landingHtml, "<h1>Start a legal diligence run.</h1>", "landing hero title changed unexpectedly");
  mustContain(files.landingHtml, landingImport, "landing polish import missing");
  assert.ok(files.landingHtml.indexOf(landingImport) > files.landingHtml.indexOf(shellImport), "landing polish must load after shared shell");
  mustContain(files.landingCss, "INTERFACE_LANDING_POLISH_V1", "landing polish marker missing");
  mustContain(files.landingCss, ".gate-status-priority", "Run Status command-center polish missing");
  mustContain(files.landingCss, ".gate-workbench", "landing workbench polish missing");
  mustContain(files.landingCss, ".mobile-funnel", "mobile funnel polish missing");
}

function validateReportShell() {
  mustContain(files.reportHtml, reportImport, "report document CSS import missing");
  assert.ok(files.reportHtml.indexOf(reportImport) > files.reportHtml.indexOf(shellImport), "report document CSS must load after shared shell");
  mustContain(files.reportHtml, 'class="report-utility-bar no-print"', "report utility toolbar missing");
  mustContain(files.reportHtml, 'class="report-paper"', "continuous report paper missing");
  mustContain(files.reportHtml, 'class="report-cover"', "formal report cover missing");
  mustContain(files.reportHtml, 'id="reportMeta"', "matter caption target missing");
  mustContain(files.reportHtml, 'id="reportStatusStrip"', "report status strip missing");
  mustContain(files.reportHtml, 'id="reportRail"', "report contents rail missing");
  mustContain(files.reportHtml, 'id="reportMobileSectionSelect"', "mobile section selector missing");
  mustNotContain(files.reportHtml, "report-meta-card", "report metadata must not remain a dashboard card");
  mustNotContain(files.reportHtml, "report-control-card", "report controls must not remain a dashboard card");
  mustNotContain(files.reportHtml, "report-table-overrides.css", "retired report card/table CSS must not be loaded");
  mustNotContain(files.reportHtml, "report-dap-row-layout.css", "retired DAP card CSS must not be loaded");
  mustNotContain(files.reportHtml, "report.js?v=section-card-rows", "old generic report renderer must not be loaded");
  mustNotContain(files.reportHtml, "report-ui-sync.js", "old report UI sync must not be loaded");
  mustContain(files.reportHtml, "report-p12-payload-adapter.js", "P12 bridge script missing");
  mustContain(files.reportHtml, "report-pagination.js", "pagination script missing");
  mustContain(files.reportHtml, "report-document.js", "section-aware document renderer missing");
  assert.ok(files.reportHtml.indexOf("report-p12-payload-adapter.js") < files.reportHtml.indexOf("report-pagination.js"), "P12 bridge must load before pagination");
  assert.ok(files.reportHtml.indexOf("report-pagination.js") < files.reportHtml.indexOf("report-document.js"), "pagination must load before document renderer");
  for (const id of ["downloadPdfButton", "technicalAnnexureButton", "qualifiedReviewButton", "reportFooterQualifiedReviewButton", "headerQualifiedReviewLink"]) mustContain(files.reportHtml, `id="${id}"`, `report action missing: ${id}`);
  mustNotContain(files.reportHtml, "Download JSON", "public report must not expose Download JSON");
}

function validateReportDesignSystem() {
  mustContain(files.reportCss, "INTERFACE_REPORT_DOCUMENT_V1", "report document marker missing");
  mustContain(files.reportCss, "interface_report_document.v1", "report document version missing");
  for (const token of ["--report-paper:", "--report-ink:", ".report-paper", ".report-cover", ".report-document-section", ".report-document-table", ".report-detail-deck", ".report-pain-category", ".report-subcategory-group"]) mustContain(files.reportCss, token, `report document primitive missing: ${token}`);
  mustContain(files.reportCss, "size: A4", "A4 print contract missing");
  mustContain(files.reportCss, ".is-page-hidden { display: table-row !important; }", "print must expand paginated table rows");
  mustContain(files.reportCss, ".report-detail-card.is-page-hidden { display: block !important; }", "print must expand paginated cards");
}

function validatePaginationEngine() {
  mustContain(files.pagination, "interface_report_pagination.v1", "pagination version missing");
  mustContain(files.pagination, "const TABLE_PAGE_SIZE = 10;", "table page size must be 10");
  mustContain(files.pagination, "const DECK_PAGE_SIZE = 5;", "deck page size must be 5");
  mustContain(files.pagination, "createPagedTable", "shared paginated table function missing");
  mustContain(files.pagination, "createPagedDeck", "shared paginated deck function missing");
  mustContain(files.pagination, 'pageButton("First"', "First control missing");
  mustContain(files.pagination, 'pageButton("Previous"', "Previous control missing");
  mustContain(files.pagination, 'pageButton("Next"', "Next control missing");
  mustContain(files.pagination, 'pageButton("Last"', "Last control missing");
  mustContain(files.pagination, "beforeprint", "full print expansion hook missing");
  mustContain(files.pagination, "afterprint", "print state restoration hook missing");
  mustNotContain(files.pagination, "Show All", "Show All must remain forbidden");
}

function validateSectionAwareRenderer() {
  mustContain(files.documentRenderer, 'const EXPECTED_RENDERER_SOURCE = "report_manifest_clean_profiles";', "document renderer source lock missing");
  mustContain(files.documentRenderer, 'const EXPECTED_SCHEMA_VERSION = "renderer_payload.v14.co_p12_05";', "document renderer schema lock missing");
  for (let index = 1; index <= 10; index += 1) mustContain(files.documentRenderer, `function renderSection${String(index).padStart(2, "0")}(`, `section renderer missing for ${index}`);
  for (const label of ["Primary Behaviour Class", "Primary Surface", "Overlay Behaviour Class", "Overlay Surface"]) mustContain(files.documentRenderer, label, `Section 04 column missing: ${label}`);
  mustContain(files.documentRenderer, "primary_classification", "Section 04 must consume primary_classification");
  mustContain(files.documentRenderer, "overlay_classifications", "Section 04 must consume overlay_classifications");
  mustContain(files.documentRenderer, "Part A — Actors, Data and Authority", "Section 05 Part A missing");
  mustContain(files.documentRenderer, "Part B — Supply Chain and Lifecycle", "Section 05 Part B missing");
  mustContain(files.documentRenderer, "Part C — Risk and Readiness", "Section 05 Part C missing");
  mustContain(files.documentRenderer, 'const streamOrder = ["Primary Sector", "Capability Overlay"]', "Section 08 stream separation missing");
  mustContain(files.documentRenderer, "painCategoryLabel", "Pain Category grouping missing");
  mustContain(files.documentRenderer, "subcategoryLabel", "Subcategory grouping missing");
  mustContain(files.documentRenderer, "compareExposureRows", "deterministic exposure ordering missing");
  mustContain(files.documentRenderer, "pagination.createPagedTable", "document renderer must use shared table pagination");
  mustContain(files.documentRenderer, "pagination.createPagedDeck", "document renderer must use shared deck pagination");
}

function validatePhase12PresentationContract() {
  mustContain(files.activityPresentation, 'PHASE12_ACTIVITY_PRESENTATION_SCHEMA = "phase12_activity_presentation.v1"', "activity presentation schema missing");
  mustContain(files.activityPresentation, "ACTIVITY_TABLE_PAGE_SIZE = 10", "activity table limit missing");
  mustContain(files.activityPresentation, "ACTIVITY_DECK_PAGE_SIZE = 5", "activity deck limit missing");
  mustContain(files.activityPresentation, 'primary_behavior_class: "primary_classification.behavior_class_codes"', "primary Behaviour Class path missing");
  mustContain(files.activityPresentation, 'primary_surface: "primary_classification.surface_context_tokens"', "primary Surface path missing");
  mustContain(files.activityPresentation, 'overlay_behavior_class: "overlay_classifications[].behavior_class_codes"', "overlay Behaviour Class path missing");
  mustContain(files.activityPresentation, 'overlay_surface: "overlay_classifications[].surface_context_tokens"', "overlay Surface path missing");
  mustContain(files.activityPresentation, "primary_overlay_collapse_forbidden: true", "activity classification collapse must be forbidden");
  mustContain(files.activityPresentation, "substantive_derivation_performed: false", "activity register must remain presentation-only");
  mustContain(files.activityPresentation, "SECTION4_COLLAPSED_CLASSIFICATION_FIELD_FORBIDDEN", "collapsed activity mutation guard missing");

  mustContain(files.projection, "injectPhase12ActivityPresentation", "Phase 12 projection must inject activity register");
  mustContain(files.projection, "report_section__04_product_activity_architecture", "activity register must attach to Section 04");
  mustContain(files.compilerValidator, "validateSection4", "compiler validator must validate Section 04 presentation");
  mustContain(files.compilerValidator, "section4_activity_presentation_enforced: true", "Section 04 validation receipt missing");

  mustContain(files.rendererService, 'schema_version: "renderer_payload.v14.co_p12_05"', "current renderer schema missing");
  mustContain(files.rendererService, "renderer_source: RENDERER_SOURCE", "current renderer source missing");
  mustContain(files.rendererService, 'product_name: "Interface Diligence Engine"', "Interface product identity missing");
  mustContain(files.rendererService, 'report_title: "Diligence Report"', "product-neutral report title missing");
  mustContain(files.rendererService, 'schema_version: "interface_report_presentation.v1"', "report presentation contract missing");
  mustContain(files.rendererService, "table_rows_per_page: TABLE_ROWS_PER_PAGE", "renderer table limit missing");
  mustContain(files.rendererService, "deck_cards_per_page: DECK_CARDS_PER_PAGE", "renderer deck limit missing");
  mustContain(files.rendererService, 'field_id: "PA.ACTIVITY_REGISTER"', "renderer must expose separate activity-register subsection");
  mustContain(files.rendererService, 'profile_id: "activity_register"', "activity-register profile identity missing");
  mustContain(files.rendererService, "publicStreamScope", "renderer must normalize public stream labels");
  mustContain(files.rendererService, "pain_category_rank", "Pain Category rank metadata missing");
  mustContain(files.rendererService, "subcategory_order", "Subcategory order metadata missing");
  mustContain(files.rendererService, "exposure_sort_rank", "stable exposure sort rank missing");
  mustNotContain(files.rendererService, "Lex Nova Diligence Engine", "renderer must not rebrand Interface UI");
  mustNotContain(files.rendererService, "Lex Nova Diligence Report", "renderer must not emit Lex Nova report title");

  mustContain(files.p12Bridge, "interface_p12_frontend_bridge.v1", "P12 bridge version missing");
  mustContain(files.p12Bridge, "normalized_section_artifacts_only", "P12 bridge must reject stale renderer source");
  mustContain(files.p12Bridge, "normalizeStreamScope", "P12 bridge must normalize exposure stream labels");
  mustContain(files.p12Bridge, 'return "Primary Sector"', "P12 bridge Primary stream label missing");
  mustContain(files.p12Bridge, 'return "Capability Overlay"', "P12 bridge Overlay stream label missing");
  mustContain(files.p12Bridge, "delete bridged.section_order", "raw section_order must be stripped after validation");
}

function validateProductionCoverage() {
  mustContain(files.phase12Fixture, "primary_classification", "Phase 12 fixture must include Primary classification");
  mustContain(files.phase12Fixture, "overlay_classifications", "Phase 12 fixture must include Overlay classifications");
  mustContain(files.phase12Check, "validateSection4(output)", "Phase 12 production gate must validate Section 04");
  mustContain(files.phase12Check, "SECTION4_COLLAPSED_CLASSIFICATION_FIELD_FORBIDDEN", "production gate must test collapsed activity rejection");
  mustContain(files.phase12Check, "section4_activity_row_count", "production receipt must report activity row count");
  mustContain(files.phase12Check, "validateSection8(output)", "Phase 12 production gate must retain Section 08 coverage");
}

function validateSyntax() {
  for (const relativePath of [
    "public/interface-diligence/diligence-system/report-p12-payload-adapter.js",
    "public/interface-diligence/diligence-system/report-pagination.js",
    "public/interface-diligence/diligence-system/report-document.js",
    "src/phases/12-normalized-compiler/phase12-activity-presentation.js",
    "src/phases/12-normalized-compiler/phase12-projection-adapter.js",
    "src/phases/12-normalized-compiler/phase12-compiler-validator.js",
    "src/runtime/services/reporting/report-renderer.service.js",
    "scripts/test-support/phase12-production.fixture.mjs",
    "scripts/check-phase12-production.mjs"
  ]) {
    const result = spawnSync(process.execPath, ["--check", path.join(root, relativePath)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${relativePath} syntax check failed: ${result.stderr || result.stdout}`);
  }
}

function mustContain(source, token, message) {
  assert.ok(source.includes(token), `${message}: ${token}`);
}

function mustNotContain(source, token, message) {
  assert.equal(source.includes(token), false, `${message}: ${token}`);
}
