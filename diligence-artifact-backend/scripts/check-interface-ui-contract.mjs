import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const base = "public/interface-diligence/diligence-system/";
const f = Object.freeze({
  uiLock: read("docs/ui/INTERFACE_UI_LOCK_v1.md"),
  reportLock: read("docs/ui/INTERFACE_REPORT_STRUCTURE_LOCK_v1.md"),
  shell: read(base + "interface-ui-shell.css"),
  landingCss: read(base + "interface-landing-polish.css"),
  reportCss: read(base + "interface-report-document.css"),
  sections0105Css: read(base + "interface-report-sections-01-05.css"),
  sections0607Css: read(base + "interface-report-sections-06-07.css"),
  landing: read(base + "index.html"),
  report: read(base + "report.html"),
  annexure: read(base + "technical-annexure.html"),
  qr: read(base + "qualified-review.html"),
  bridge: read(base + "report-p12-payload-adapter.js"),
  pagination: read(base + "report-pagination.js"),
  runtime: read(base + "report-document-runtime.js"),
  s0103: read(base + "report-sections-01-03.js"),
  s04: read(base + "report-section-04.js"),
  s05: read(base + "report-section-05.js"),
  s0607: read(base + "report-sections-06-07.js"),
  s0810: read(base + "report-sections-06-10.js"),
  bootstrap: read(base + "report-document.js"),
  activity: read("src/phases/12-normalized-compiler/phase12-activity-presentation.js"),
  obligation: read("src/phases/12-normalized-compiler/phase12-obligation-presentation.js"),
  projection: read("src/phases/12-normalized-compiler/phase12-projection-adapter.js"),
  compilerValidator: read("src/phases/12-normalized-compiler/phase12-compiler-validator.js"),
  renderer: read("src/runtime/services/reporting/report-renderer.service.js"),
  fixture: read("scripts/test-support/phase12-production.fixture.mjs"),
  phase12: read("scripts/check-phase12-production.mjs"),
  pkg: JSON.parse(read("package.json"))
});

identity();
shell();
landing();
reportShell();
design();
pagination();
modularRuntime();
sections0103();
section04();
section05();
sections0607();
preserve0810();
phase12();
syntax();

assert.equal(f.pkg.scripts["check:interface-ui"], "node scripts/check-interface-ui-contract.mjs");
console.log(JSON.stringify({
  check: "interface-ui-contract",
  status: "PASS",
  report_runtime: "interface_report_runtime.v1.modular",
  rpt_06: "SECTIONS_01_03_ACTIVE",
  rpt_07: "SECTION_04_ACTIVE",
  rpt_08: "SECTION_05_ACTIVE",
  rpt_09: "SECTIONS_06_07_ACTIVE",
  section_05_child_profiles: 11,
  section_06_obligation_projection: "ENFORCED",
  section_07_legal_family_grouping: "ENFORCED",
  table_page_size: 10,
  deck_page_size: 5,
  sections_08_10_preserved: true
}, null, 2));

function identity() {
  has(f.uiLock, "Interface Sandbox is a multi-sector diligence engine");
  has(f.uiLock, "It is not Lex Nova-branded UI");
  has(f.reportLock, "senior-partner legal diligence document");
  has(f.reportLock, "maximum 10 visible rows per page");
  has(f.reportLock, "maximum 5 visible cards per page");
  for (const source of [f.landing, f.report, f.annexure, f.qr]) {
    has(source, '<span class="wordmark-title">The Interface</span>');
    has(source, "Law × Technology · AI Governance · Privacy · Systems");
    lacks(source, "Lex Nova Diligence Engine");
  }
}

function shell() {
  has(f.shell, "INTERFACE_UI_SHELL_V1");
  has(f.shell, "interface_ui_shell.v1");
  has(f.shell, ".interface-topbar");
  has(f.shell, ".footer-note");
  has(f.shell, "prefers-reduced-motion");
}

function landing() {
  has(f.landing, "<title>Interface Diligence Engine</title>");
  has(f.landing, '<div class="eyebrow">Diligence Intake</div>');
  has(f.landing, "<h1>Start a legal diligence run.</h1>");
  has(f.landing, "interface-landing-polish.css?v=landing-v1-20260713");
  has(f.landingCss, "INTERFACE_LANDING_POLISH_V1");
}

function reportShell() {
  for (const token of [
    'class="report-utility-bar no-print"',
    'class="report-paper"',
    'class="report-cover"',
    'id="reportMeta"',
    'id="reportStatusStrip"',
    'id="reportRail"',
    'id="reportMobileSectionSelect"'
  ]) has(f.report, token);
  for (const token of [
    "report-meta-card",
    "report-control-card",
    "report-table-overrides.css",
    "report-dap-row-layout.css",
    "report-ui-sync.js",
    "Download JSON"
  ]) lacks(f.report, token);
  has(f.report, "interface-report-sections-06-07.css?v=sections-06-07-v1-20260713");
  const order = [
    "report-p12-payload-adapter.js",
    "report-pagination.js",
    "report-document-runtime.js",
    "report-sections-01-03.js",
    "report-section-04.js",
    "report-section-05.js",
    "report-sections-06-07.js",
    "report-sections-06-10.js",
    "report-document.js"
  ];
  let last = -1;
  for (const file of order) {
    const at = f.report.indexOf(file);
    assert.ok(at > last, `${file} load order invalid`);
    last = at;
  }
  for (const id of [
    "downloadPdfButton",
    "technicalAnnexureButton",
    "qualifiedReviewButton",
    "reportFooterQualifiedReviewButton",
    "headerQualifiedReviewLink"
  ]) has(f.report, `id="${id}"`);
}

function design() {
  has(f.reportCss, "INTERFACE_REPORT_DOCUMENT_V1");
  for (const token of [
    "--report-paper:",
    ".report-paper",
    ".report-document-section",
    ".report-document-table",
    ".report-detail-deck",
    "size: A4"
  ]) has(f.reportCss, token);
  has(f.sections0105Css, "INTERFACE_REPORT_SECTIONS_01_05_V1");
  has(f.sections0607Css, "INTERFACE_REPORT_SECTIONS_06_07_V1");
  has(f.sections0607Css, "interface_report_sections_06_07.v1");
  for (const token of [
    ".report-obligation-stream",
    ".report-obligation-posture",
    ".report-obligation-card",
    '[data-report-section-id="07"]'
  ]) has(f.sections0607Css, token);
}

function pagination() {
  has(f.pagination, 'const TABLE_PAGE_SIZE = 10;');
  has(f.pagination, 'const DECK_PAGE_SIZE = 5;');
  for (const token of [
    "createPagedTable",
    "createPagedDeck",
    'pageButton("First"',
    'pageButton("Previous"',
    'pageButton("Next"',
    'pageButton("Last"',
    "beforeprint",
    "afterprint"
  ]) has(f.pagination, token);
  lacks(f.pagination, "Show All");
}

function modularRuntime() {
  has(f.runtime, "interface_report_runtime.v1");
  has(f.runtime, "renderer_payload.v14.co_p12_05");
  has(f.runtime, "report_manifest_clean_profiles");
  has(f.runtime, "window.InterfaceReportSectionRenderers");
  has(f.bootstrap, "INTERFACE_REPORT_RUNTIME_MISSING");
  has(f.bootstrap, "runtime.start()");
}

function sections0103() {
  for (const token of [
    "01.1 Matter Definition",
    "01.2 Scope of Review",
    "01.3 Reliance Boundary",
    "01.4 Report Architecture",
    "02.1 Overall Legal Posture",
    "02.5 Recommended Review Route",
    "03.5 Sector Architecture",
    "Primary Sector",
    "Capability Overlay",
    "Regulatory Context Overlay"
  ]) has(f.s0103, token);
}

function section04() {
  for (const token of [
    "04.1 Product and Service Overview",
    "04.2 Activity Register",
    "04.3 Activity Detail Deck",
    "04.4 Classification Architecture Summary",
    "Primary Behaviour Class",
    "Primary Surface",
    "Overlay Behaviour Class",
    "Overlay Surface",
    "primary_classification",
    "overlay_classifications"
  ]) has(f.s04, token);
}

function section05() {
  for (const token of [
    "Part A — Actors, Data and Authority",
    "Part B — Supply Chain and Lifecycle",
    "Part C — Risk and Readiness",
    "05.1 Provenance Executive Map",
    "Maximum 10 rows are visible per browser page"
  ]) has(f.s05, token);
  for (const id of [
    "parties_roles",
    "data_objects_flows",
    "purpose_authorization_user_controls",
    "privacy_contacts_consent_manager",
    "vendor_processor_chain",
    "location_transfer_custody",
    "retention_deletion_portability",
    "security_access_incident_governance",
    "sensitive_high_risk_contexts",
    "regulatory_readiness",
    "missing_proof_diligence_requests"
  ]) has(f.s05, id);
}

function sections0607() {
  for (const token of [
    'renderers["06"]',
    'renderers["07"]',
    "06.1 Obligation Inventory",
    "06.2 Target, Activity and Authority Linkage",
    "06.3 Expected Operational Controls",
    "06.4 Visible Control Posture",
    "06.5 Obligation Evidence",
    "06.6 Obligation Limitations",
    "Primary Sector",
    "Capability Overlay",
    "not legal-applicability, compliance, breach, licence, adequacy or liability conclusions",
    "Maximum 10 obligation rows",
    "Maximum 5 obligation evidence records"
  ]) has(f.s0607, token);
  for (const token of [
    "07.1 Legal Document Stack",
    "07.2 Artifact Inventory and Coverage",
    "07.3 Notice and Contact Map",
    "07.4 Control-Language Locations",
    "07.5 Liability and Indemnity Controls",
    "07.6 Service-Level and Support Commitments",
    "07.7 Cross-Document References",
    "07.8 Missing or Inaccessible Artifacts",
    "07.9 Legal Cartography Limitations",
    "LGC.STACK.",
    "LGC.ART.",
    "LGC.NOT.",
    "LGC.CTRL.",
    "LGC.IND.",
    "LGC.XREF.",
    "LGC.ABS.",
    "LGC.LIM."
  ]) has(f.s0607, token);
}

function preserve0810() {
  lacks(f.s0810, 'X["06"]');
  lacks(f.s0810, 'X["07"]');
  for (const id of ['X["08"]', 'X["09"]', 'X["10"]']) has(f.s0810, id);
  for (const token of [
    "Primary Sector",
    "Capability Overlay",
    "pain_category_rank",
    "subcategory_order",
    "createPagedTable",
    "createPagedDeck"
  ]) has(f.s0810, token);
}

function phase12() {
  has(f.activity, "phase12_activity_presentation.v1");
  has(f.obligation, "phase12_obligation_presentation.v1");
  has(f.obligation, "legal_applicability_conclusion_forbidden: true");
  has(f.obligation, "compliance_conclusion_forbidden: true");
  has(f.obligation, "source_layers: [\"Primary Sector\", \"Capability Overlay\"]");
  has(f.obligation, "CLEAN_OBLIGATION_PRESENTATION_REGISTER");
  has(f.projection, "injectPhase12ObligationPresentation");
  has(f.compilerValidator, "validateSection6");
  has(f.compilerValidator, "section6_obligation_presentation_enforced: true");
  has(f.fixture, "domain_control_obligation_profile");
  has(f.phase12, "validateSection6");
  has(f.phase12, "SECTION6_FORBIDDEN_ROW_KEY");
  has(f.renderer, "renderer_payload.v14.co_p12_05");
  has(f.renderer, 'product_name: "Interface Diligence Engine"');
  has(f.bridge, "interface_p12_frontend_bridge.v1");
}

function syntax() {
  for (const file of [
    base + "report-p12-payload-adapter.js",
    base + "report-pagination.js",
    base + "report-document-runtime.js",
    base + "report-sections-01-03.js",
    base + "report-section-04.js",
    base + "report-section-05.js",
    base + "report-sections-06-07.js",
    base + "report-sections-06-10.js",
    base + "report-document.js",
    "src/phases/12-normalized-compiler/phase12-activity-presentation.js",
    "src/phases/12-normalized-compiler/phase12-obligation-presentation.js",
    "src/phases/12-normalized-compiler/phase12-projection-adapter.js",
    "src/phases/12-normalized-compiler/phase12-compiler-validator.js",
    "src/runtime/services/reporting/report-renderer.service.js",
    "scripts/test-support/phase12-production.fixture.mjs",
    "scripts/check-phase12-production.mjs"
  ]) {
    const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${file} syntax check failed: ${result.stderr || result.stdout}`);
  }
}

function has(source, token, message) {
  assert.ok(source.includes(token), message || `missing ${token}`);
}

function lacks(source, token, message) {
  assert.equal(source.includes(token), false, message || `forbidden ${token}`);
}
