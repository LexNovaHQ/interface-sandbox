import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), "utf8");

const uiLock = read("docs/ui/INTERFACE_UI_LOCK_v1.md");
const shellCss = read("public/interface-diligence/diligence-system/interface-ui-shell.css");
const reportHtml = read("public/interface-diligence/diligence-system/report.html");
const reportJs = read("public/interface-diligence/diligence-system/report.js");
const p12Bridge = read("public/interface-diligence/diligence-system/report-p12-payload-adapter.js");
const landing = read("public/interface-diligence/diligence-system/index.html");
const annexure = read("public/interface-diligence/diligence-system/technical-annexure.html");
const qualifiedReview = read("public/interface-diligence/diligence-system/qualified-review.html");
const packageJson = JSON.parse(read("package.json"));

const expectedSectionIds = '["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]';
const shellImport = "interface-ui-shell.css?v=shell-v1-20260713";
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
assert.match(shellCss, /\.rail-wrap/, "shared shell CSS must include rail shell primitives");
assert.match(shellCss, /\.report-left-rail/, "shared shell CSS must include report rail primitives");
assert.match(shellCss, /\.qr-left-rail/, "shared shell CSS must include QR rail primitives");
assert.match(shellCss, /prefers-reduced-motion/, "shared shell CSS must include reduced-motion protection");
assert.doesNotMatch(shellCss, /Lex Nova Diligence Engine/, "shared shell CSS must not introduce Lex Nova rebrand text");

for (const [pageName, source] of shellPages) {
  assert.match(source, new RegExp(escapeRegExp(shellImport)), `${pageName} must import shared Interface UI shell`);
  assert.match(source, /interface-header\.css/, `${pageName} must preserve Interface header CSS import`);
  assert.match(source, /<span class="wordmark-title">The Interface<\/span>/, `${pageName} must preserve The Interface wordmark`);
  assert.match(source, /Law × Technology · AI Governance · Privacy · Systems/, `${pageName} must preserve Interface subtitle`);
  assert.doesNotMatch(source, /Lex Nova Diligence Engine/, `${pageName} must not be rebranded to Lex Nova`);
}

assert.ok(landing.indexOf(shellImport) > landing.indexOf("diligence-homepage-gate.css"), "landing shell import must load after landing page CSS");
assert.ok(reportHtml.indexOf(shellImport) > reportHtml.indexOf("report-dap-row-layout.css"), "report shell import must load after report page CSS");
assert.ok(annexure.indexOf(shellImport) > annexure.indexOf("interface-header.css"), "annexure shell import must load after header CSS");
assert.ok(qualifiedReview.indexOf(shellImport) > qualifiedReview.indexOf("qualified-review.css"), "QR shell import must load after QR page CSS");

const adapterIndex = reportHtml.indexOf("report-p12-payload-adapter.js");
const rendererIndex = reportHtml.indexOf("report.js?v=section-card-rows-20260703");
assert.ok(adapterIndex > -1, "report.html must load report-p12-payload-adapter.js");
assert.ok(rendererIndex > -1, "report.html must load report.js");
assert.ok(adapterIndex < rendererIndex, "P12 payload adapter must load before report.js");
assert.match(reportHtml, /id="technicalAnnexureButton"/, "technical annexure link must remain present");
assert.match(reportHtml, /id="qualifiedReviewButton"/, "qualified review action must remain present");
assert.match(reportHtml, /id="reportFooterQualifiedReviewButton"/, "footer qualified review action must remain present");
assert.match(reportHtml, /id="headerQualifiedReviewLink"/, "header qualified review link must remain present");
assert.match(reportHtml, /id="downloadPdfButton"/, "Download PDF action must remain present");
assert.doesNotMatch(reportHtml, /Download JSON/i, "public report must not expose Download JSON");

assert.match(p12Bridge, /interface_p12_frontend_bridge\.v1/, "P12 bridge version marker missing");
assert.match(p12Bridge, /renderer_payload\.v14\.co_p12_05/, "P12 bridge must require current renderer schema");
assert.match(p12Bridge, /report_manifest_clean_profiles/, "P12 bridge must require clean profile renderer source");
assert.match(p12Bridge, /normalized_section_artifacts_only/, "P12 bridge must explicitly reject stale renderer source");
assert.match(p12Bridge, /EXPECTED_SECTION_IDS = Object\.freeze\(\["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"\]\)/, "P12 bridge must lock 01-10 section IDs");
assert.match(p12Bridge, /public_report_navigation/, "P12 bridge must map section IDs to public report navigation");
assert.match(p12Bridge, /delete bridged\.section_order/, "P12 bridge must strip raw section_order after converting it to navigation metadata");
assert.match(p12Bridge, /technical-annexure\.html\?run_id=/, "P12 bridge must preserve Technical Annexure link bridge");
assert.match(p12Bridge, /qualified-review\.html\?run_id=/, "P12 bridge must preserve Qualified Review link bridge");
for (const legacy of legacySectionIds) {
  assert.match(p12Bridge, new RegExp(legacy), `P12 bridge must explicitly reject legacy section ID ${legacy}`);
}

assert.match(reportJs, /const LOCKED_RENDERER_SOURCE = "report_manifest_clean_profiles";/, "report.js must be locked to current renderer source");
assert.match(reportJs, new RegExp(escapeRegExp(`const EXPECTED_SECTION_IDS = Object.freeze(${expectedSectionIds});`)), "report.js must require section IDs 01-10");
assert.doesNotMatch(reportJs, /const LOCKED_RENDERER_SOURCE = "normalized_section_artifacts_only";/, "report.js must not be locked to stale renderer source");

assert.equal(packageJson.scripts["check:interface-ui"], "node scripts/check-interface-ui-contract.mjs", "package.json must expose check:interface-ui");

console.log(JSON.stringify({
  check: "interface-ui-contract",
  status: "PASS",
  ui_lock: "INTERFACE_UI_LOCK_v1",
  shell: "interface_ui_shell.v1",
  p12_bridge: "interface_p12_frontend_bridge.v1",
  renderer_schema: "renderer_payload.v14.co_p12_05",
  renderer_source: "report_manifest_clean_profiles",
  shell_pages: shellPages.map(([pageName]) => pageName),
  section_ids: ["01", "02", "03", "04", "05", "06", "07", "08", "09", "10"]
}, null, 2));

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
