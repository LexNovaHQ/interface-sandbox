import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const base = "public/interface-diligence/diligence-system/";
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const exists = (file) => fs.existsSync(path.join(root, file));

const files = Object.freeze({
  report: read(base + "report.html"),
  fixtureHtml: read(base + "report-visual-fixture.html"),
  fixtureData: read(base + "report-visual-fixture-data.js"),
  runtime: read(base + "report-document-runtime.js"),
  pagination: read(base + "report-pagination.js"),
  printController: read(base + "report-print.js"),
  accessibility: read(base + "report-accessibility.js"),
  sections0103: read(base + "report-sections-01-03.js"),
  section04: read(base + "report-section-04.js"),
  section05: read(base + "report-section-05.js"),
  sections0607: read(base + "report-sections-06-07.js"),
  section08: read(base + "report-section-08.js"),
  sections0910: read(base + "report-sections-09-10.js"),
  documentCss: read(base + "interface-report-document.css"),
  sections0105Css: read(base + "interface-report-sections-01-05.css"),
  sections0607Css: read(base + "interface-report-sections-06-07.css"),
  sections0810Css: read(base + "interface-report-sections-08-10.css"),
  responsiveCss: read(base + "interface-report-responsive-accessible.css"),
  printCss: read(base + "interface-report-print.css"),
  packageJson: JSON.parse(read("package.json"))
});

validateIdentityAndShell();
validateLoadOrder();
validateSectionOwnership();
validateSection08();
validateSections0910();
validatePrintSystem();
validateAccessibilityAndResponsive();
validateVisualFixture();
validateScripts();

assert.equal(files.packageJson.scripts["check:interface-report-ui-contract"], "node scripts/check-interface-report-ui-contract.mjs");
assert.equal(files.packageJson.scripts["check:interface-report-visual-regression"], "node scripts/check-interface-report-visual-regression.mjs");
assert.equal(files.packageJson.scripts["check:interface-ui"], "node scripts/check-interface-ui-universal.mjs && node scripts/check-interface-report-ui-contract.mjs && node scripts/check-interface-annex-qr-contract.mjs && node scripts/check-interface-assembly-signals-contract.mjs && node scripts/check-interface-report-visual-regression.mjs");

console.log(JSON.stringify({
  check: "interface-report-ui-contract",
  status: "PASS",
  report_runtime: "interface_report_runtime.v2.sections_01_10",
  section_ownership: {
    "01-03": "report-sections-01-03.js",
    "04": "report-section-04.js",
    "05": "report-section-05.js",
    "06-07": "report-sections-06-07.js",
    "08": "report-section-08.js",
    "09-10": "report-sections-09-10.js"
  },
  table_page_size: 10,
  deck_page_size: 5,
  print_full_dataset: true,
  accessibility_contract: "ENFORCED",
  responsive_contract: "ENFORCED",
  visual_fixture_scenarios: ["baseline", "dense", "limitations"],
  legacy_generic_sections_06_10_removed: true
}, null, 2));

function validateIdentityAndShell() {
  for (const html of [files.report, files.fixtureHtml]) {
    has(html, '<span class="wordmark-title">The Interface</span>');
    has(html, "Law × Technology · AI Governance · Privacy · Systems");
    lacks(html, "Lex Nova Diligence Engine");
  }
  for (const token of [
    'id="reportMain"',
    'id="reportPaper"',
    'id="reportBody"',
    'id="reportRail"',
    'id="reportMobileSectionSelect"',
    'id="downloadPdfButton"',
    'id="technicalAnnexureButton"',
    'id="qualifiedReviewButton"',
    'id="reportLiveStatus"',
    'class="skip-link no-print"'
  ]) has(files.report, token);
  lacks(files.report, "Download JSON");
}

function validateLoadOrder() {
  const cssOrder = [
    "interface-report-document.css",
    "interface-report-sections-01-05.css",
    "interface-report-sections-06-07.css",
    "interface-report-sections-08-10.css",
    "interface-report-responsive-accessible.css",
    "interface-report-print.css"
  ];
  assertOrdered(files.report, cssOrder, "report CSS");

  const scriptOrder = [
    "report-p12-payload-adapter.js",
    "report-pagination.js",
    "report-print.js",
    "report-document-runtime.js",
    "report-sections-01-03.js",
    "report-section-04.js",
    "report-section-05.js",
    "report-sections-06-07.js",
    "report-section-08.js",
    "report-sections-09-10.js",
    "report-accessibility.js",
    "report-document.js"
  ];
  assertOrdered(files.report, scriptOrder, "report scripts");
  lacks(files.report, "report-sections-06-10.js");
  assert.equal(exists(base + "report-sections-06-10.js"), false, "legacy report-sections-06-10.js must be removed");
}

function validateSectionOwnership() {
  for (const token of ['X["01"]', 'X["02"]', 'X["03"]']) has(files.sections0103, token);
  has(files.section04, 'X["04"]');
  has(files.section05, 'X["05"]');
  for (const token of ['renderers["06"]', 'renderers["07"]']) has(files.sections0607, token);
  has(files.section08, 'renderers["08"]');
  for (const token of ['renderers["09"]', 'renderers["10"]']) has(files.sections0910, token);
  for (const source of [files.sections0103, files.section04, files.section05, files.sections0607, files.section08, files.sections0910]) {
    lacks(source, "renderGenericSection(s)", "dedicated section renderer may not be a generic pass-through");
  }
  has(files.runtime, 'version: "interface_report_runtime.v2.sections_01_10"');
  has(files.runtime, "renderFixture");
  has(files.runtime, "InterfaceReportPrint");
  has(files.runtime, "InterfaceReportAccessibility");
}

function validateSection08() {
  for (const token of [
    "08.1 Exposure Register Overview",
    "08.2 Primary Sector Exposures",
    "08.3 Capability Overlay Exposures",
    "08.4 Authority and Framework Cross-Section",
    "08.5 Exposure Limitations",
    "TRIGGERED",
    "CONTROLLED_BY_VISIBLE_CONTROL",
    "CONTROLLED_BY_EXCLUSION",
    "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION",
    "Primary Sector",
    "Capability Overlay",
    "pain_category_rank",
    "subcategory_order",
    "pain_depth_rank",
    "velocity_rank",
    "Maximum 10 rows",
    "Maximum 5 exposure cards",
    "does not re-evaluate, merge or re-rank exposure rows"
  ]) has(files.section08, token);
  for (const token of [
    ".report-exposure-legend",
    ".report-exposure-profile",
    ".report-exposure-status.is-triggered",
    ".report-exposure-status.is-controlled_by_visible_control",
    ".report-exposure-status.is-controlled_by_exclusion",
    ".report-exposure-status.is-controlled_by_public_evidence_limitation"
  ]) has(files.sections0810Css, token);
}

function validateSections0910() {
  for (const token of [
    "09.1 Open Review Overview",
    "09.2 Open Review Register",
    "09.3 Review Item Detail",
    "09.4 Carried Review Context",
    "09.5 Review Handoff Limitations",
    "does not create new questions, priorities, routes, remediation steps or legal conclusions",
    "Maximum 10 review items",
    "Maximum 5 review-item cards"
  ]) has(files.sections0910, token);
  for (const token of [
    "10.1 Methodology Overview",
    "10.2 Compilation and Evidence Method",
    "10.3 Report and Review Layers",
    "10.4 Technical Methodology Fields",
    "10.5 Methodology and Evidence Limitations",
    "10.6 Technical Annexure and Qualified Review Handoff",
    "Upstream phases decide. Phase 12 arranges.",
    "Substantive Re-evaluation",
    "Exposure Re-ranking",
    "Custody Rendering",
    "Forensic Payload Rendering",
    "Local Counsel"
  ]) has(files.sections0910, token);
}

function validatePrintSystem() {
  has(files.printController, 'const VERSION = "interface_report_print.v1"');
  has(files.printController, "printReport");
  has(files.printController, "beforeprint");
  has(files.printController, "afterprint");
  has(files.printController, "report-print-expanded");
  has(files.printController, "The full report dataset will be included");
  for (const token of [
    "INTERFACE_REPORT_PRINT_V1",
    "size: A4",
    "break-after: page",
    "break-before: page",
    "table-header-group",
    ".report-print-expanded .is-page-hidden",
    "print-color-adjust: exact",
    "orphans: 3",
    "widows: 3"
  ]) has(files.printCss, token);
  has(files.report, 'media="print"');
  has(files.runtime, "printReport(options)");
}

function validateAccessibilityAndResponsive() {
  for (const token of [
    'const VERSION = "interface_report_pagination.v2.accessible"',
    'node("caption", "report-table-caption"',
    'th.scope = "col"',
    'aria-live',
    'aria-atomic',
    'aria-setsize',
    'aria-posinset',
    'item.inert = hidden',
    'interface:report-pagination-change'
  ]) has(files.pagination, token);
  for (const token of [
    'const VERSION = "interface_report_accessibility.v1"',
    "MutationObserver",
    "focusSection",
    "report-accessibility-ready",
    "Moved to",
    'a[target="_blank"]'
  ]) has(files.accessibility, token);
  for (const token of [
    "INTERFACE_REPORT_RESPONSIVE_ACCESSIBLE_V1",
    ".skip-link",
    ".report-visually-hidden",
    ":focus-visible",
    "overscroll-behavior-inline",
    "prefers-reduced-motion",
    "prefers-contrast: more",
    "forced-colors: active",
    "max-width: 640px"
  ]) has(files.responsiveCss, token);
}

function validateVisualFixture() {
  for (const token of [
    "InterfaceReportFixturePayload",
    "scenario === \"dense\"",
    "scenario === \"limitations\"",
    "renderer_payload.v14.co_p12_05",
    "report_manifest_clean_profiles",
    "exposureCount = dense ? 24 : 12",
    "reviewCount = dense ? 12 : limitations ? 7 : 3",
    "phase12_obligation_presentation.v1",
    "Primary Sector",
    "Capability Overlay"
  ]) has(files.fixtureData, token);
  for (const token of [
    "scenario=baseline",
    "scenario=dense",
    "scenario=limitations",
    "Synthetic visual fixture only",
    "report-visual-fixture-data.js"
  ]) has(files.fixtureHtml, token);
}

function validateScripts() {
  const javascriptFiles = [
    base + "report-pagination.js",
    base + "report-print.js",
    base + "report-document-runtime.js",
    base + "report-sections-01-03.js",
    base + "report-section-04.js",
    base + "report-section-05.js",
    base + "report-sections-06-07.js",
    base + "report-section-08.js",
    base + "report-sections-09-10.js",
    base + "report-accessibility.js",
    base + "report-visual-fixture-data.js",
    base + "report-document.js",
    "scripts/check-interface-report-ui-contract.mjs",
    "scripts/check-interface-report-visual-regression.mjs"
  ];
  for (const file of javascriptFiles) {
    const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${file} syntax check failed: ${result.stderr || result.stdout}`);
  }
}

function assertOrdered(source, values, label) {
  let previous = -1;
  for (const value of values) {
    const index = source.indexOf(value);
    assert.ok(index > previous, `${label} load order invalid at ${value}`);
    previous = index;
  }
}

function has(source, token, message) {
  assert.ok(source.includes(token), message || `missing ${token}`);
}

function lacks(source, token, message) {
  assert.equal(source.includes(token), false, message || `forbidden ${token}`);
}
