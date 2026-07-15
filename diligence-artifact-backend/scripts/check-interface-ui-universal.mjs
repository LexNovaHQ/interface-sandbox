import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const base = "public/interface-diligence/diligence-system/";
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");
const pages = {
  landing: read(base + "index.html"),
  report: read(base + "report.html"),
  annexure: read(base + "technical-annexure.html"),
  qr: read(base + "qualified-review.html"),
  assembly: read(base + "assembly-engine.html"),
  signals: read(base + "signals-preview.html"),
  sector: read(base + "operator-sector-packages.html")
};
const landingJs = read(base + "diligence-system.js");
const landingConsoleJs = read(base + "public-run-console.js");
const landingCss = read(base + "interface-landing-polish.css");
const phaseConsoleCss = read(base + "interface-phase-console-v3.css");
const publicRoutes = read("src/runtime/routes/public.routes.js");
const bridge = read(base + "report-p12-payload-adapter.js");
const runtime = read(base + "report-document-runtime.js");
const stateCss = read(base + "interface-state-system.css");
const stateJs = read(base + "interface-state-system.js");
const sectorJs = read(base + "operator-sector-packages.js");
const pkg = JSON.parse(read("package.json"));

for (const [name, page] of Object.entries(pages)) {
  has(page, "interface-ui-shell.css", `${name}: shared shell missing`);
  has(page, '<meta name="robots" content="noindex,nofollow"', `${name}: noindex missing`);
  has(page, '<span class="wordmark-title">The Interface</span>', `${name}: identity changed`);
  has(page, "Law × Technology · AI Governance · Privacy · Systems", `${name}: subtitle changed`);
  lacks(page, "Lex Nova Diligence Engine", `${name}: Lex Nova rebrand leakage`);
  lacks(page, "Download JSON", `${name}: public Download JSON action forbidden`);
  lacks(page, "M7 ", `${name}: stale M-stage label`);
  lacks(page, "M8 ", `${name}: stale M-stage label`);
  lacks(page, "M9 ", `${name}: stale M-stage label`);
  lacks(page, "M10 ", `${name}: stale M-stage label`);
  lacks(page, "M11 ", `${name}: stale M-stage label`);
  lacks(page, "M12 ", `${name}: stale M-stage label`);
}

has(pages.landing, "<title>Interface Diligence Engine</title>");
has(pages.landing, '<div class="eyebrow">Diligence Intake</div>');
has(pages.landing, "<h1>Start a legal diligence run.</h1>");
has(pages.landing, 'id="workflowStatus"', "landing: sixteen-phase workflow status missing");
has(pages.landing, 'aria-label="Sixteen diligence workflow phases"', "landing: phase-count accessibility contract missing");
has(pages.landing, 'id="derivedDomainPanel"', "landing: derived sector/package panel missing");
has(pages.landing, "Phase 3 derives this from evidence", "landing: automatic derivation boundary missing");
has(pages.landing, "there is no manual registry selector", "landing: no-manual-selector explanation missing");
has(pages.landing, "Public footprint in", "landing: portfolio-inspired editorial thesis missing");
has(pages.landing, "Review-ready diligence out.", "landing: editorial outcome line missing");
has(pages.landing, "interface-phase-console-v3.css", "landing: phase-console stylesheet missing");
lacks(pages.landing, 'class="rail-wrap"', "landing: retired left rail returned");
lacks(pages.landing, 'id="phaseRail"', "landing: retired phase rail mount returned");
lacks(pages.landing, "mobile-funnel", "landing: retired mobile funnel returned");
lacks(pages.landing, "Active Vertical Registry", "landing: fake registry selector returned");
lacks(pages.landing, 'id="registryLane"', "landing: fake registry selector control returned");

const centralPhases = [
  "Source Discovery",
  "Cartography and Index",
  "Target Profile Review",
  "Target Profile Forensics",
  "Activity Profile Review",
  "Activity Profile Forensics",
  "Data Provenance Profile",
  "Domain Control Obligation Profile",
  "Data Provenance Forensics",
  "Exposure Profile",
  "Operator Challenge",
  "Compiler",
  "Qualified Review",
  "Qualified Review Submission",
  "Diligence-QA Complete",
  "Assembly Engine"
];
for (const label of centralPhases) {
  has(landingJs, `label: "${label}"`, `landing: central phase missing: ${label}`);
}
for (let sequence = 1; sequence <= 16; sequence += 1) {
  has(landingJs, `sequence: ${sequence}`, `landing: central phase sequence missing: ${sequence}`);
}

has(landingJs, "CENTRAL_PHASES", "landing: sixteen-phase authority missing");
has(landingJs, "workflow-stage-job", "landing: exact current job trace missing");
has(landingJs, "updateDiligenceDerivedDomain", "landing: derived-domain bridge missing");
has(landingJs, "REINVESTIGATION", "landing: reinvestigation visual state missing");
has(landingConsoleJs, "Phase 16 — Assembly Engine", "resume console: Phase 16 fallback missing");
has(landingConsoleJs, "domain_selection", "resume console: derived-domain payload missing");
has(landingConsoleJs, "updateDiligenceDerivedDomain", "resume console: derived-domain bridge missing");
lacks(landingJs, "PUBLIC_STAGES", "landing: merged six-stage authority returned");
lacks(landingConsoleJs, "const LANES", "landing: fake vertical registry table returned");
lacks(landingConsoleJs, "registryLane", "landing: fake registry selector returned");
lacks(landingConsoleJs, "form.prepend", "landing: out-of-place selector injection returned");
lacks(landingConsoleJs, "Active demo registry", "landing: demo registry blocker returned");
lacks(landingConsoleJs, 'run.status === "REINVESTIGATION_REQUIRED"', "resume console: reinvestigation incorrectly terminal");
lacks(landingJs, 'stateLabel = index === 0 ? "Ready"', "landing: false idle READY state returned");

has(landingCss, "INTERFACE_LANDING_CONSOLE_V2", "landing: editorial console stylesheet missing");
has(phaseConsoleCss, "INTERFACE_PHASE_CONSOLE_V3", "landing: phase authority stylesheet missing");
has(phaseConsoleCss, ".derived-domain-panel", "landing: derived-domain styling missing");
has(phaseConsoleCss, ".workflow-stage-job", "landing: current-job styling missing");
has(phaseConsoleCss, ".registry-selector-block", "landing: stale selector defensive suppression missing");

has(publicRoutes, "public_domain_selection.v1", "public route: safe domain projection missing");
has(publicRoutes, "PHASE_3B_DOMAIN_DERIVATION", "public route: Phase 3 derivation authority missing");
has(publicRoutes, "active_run_package_manifest", "public route: active package manifest projection missing");
has(publicRoutes, "active_threat_registry_manifest", "public route: mounted registry projection missing");
has(publicRoutes, "mounted_registry_packages", "public route: mounted package field missing");
has(publicRoutes, "pendingPublicDomainSelection", "public route: pre-Phase-3 state missing");

has(pages.report, "report-p12-payload-adapter.js");
has(pages.annexure, "Public Technical Annexure");
has(pages.qr, "<title>Qualified Review</title>");
has(pages.qr, '<div class="eyebrow">Review Workspace</div>');
has(pages.qr, "Section-level attestation");
has(pages.qr, "Review values and attest each section");
lacks(pages.qr, "Qualified Review Workspace");
has(pages.assembly, "Preview · Not yet active");
has(pages.assembly, "Generate Draft — Not Active");
has(pages.signals, "Preview · Navigation only");
has(pages.signals, "Phase 12 report outputs");
has(pages.sector, "Operator Diagnostics");
has(pages.sector, "Internal · Read only");

has(bridge, "renderer_payload.v14.co_p12_05");
has(bridge, "report_manifest_clean_profiles");
has(bridge, "normalized_section_artifacts_only");
has(runtime, 'SOURCE = "report_manifest_clean_profiles"');
has(runtime, 'SCHEMA = "renderer_payload.v14.co_p12_05"');
has(runtime, "Renderer payload is unavailable");
has(runtime, "Report not ready");

for (const token of [
  "INTERFACE_STATE_SYSTEM_V1",
  "is-report_not_ready",
  "is-controlled_failure",
  "is-pass_with_limitation",
  "is-missing_artifact",
  "is-network_failure",
  "@media(max-width:640px)"
]) has(stateCss, token);
for (const token of [
  "interface_state_system.v1",
  "report_not_ready",
  "controlled_failure",
  "pass_with_limitation",
  "missing_artifact",
  "network_failure",
  "MutationObserver"
]) has(stateJs, token);
for (const token of [
  "domain_package_catalog_v0",
  "passive_manifest",
  "AI_Registry_Key.yml",
  "FinTech_Registry_Key.yml",
  "Diligence_Field_Derivation_Registry.yml",
  "source-hint",
  "dynamic_routing_enabled:false"
]) has(sectorJs, token);

for (const file of [
  base + "diligence-system.js",
  base + "public-run-console.js",
  base + "interface-state-system.js",
  base + "operator-sector-packages.js",
  base + "assembly-engine.js",
  base + "signals-preview.js",
  base + "technical-annexure.js",
  base + "qualified-review-system/qualified-review.js",
  base + "report-p12-payload-adapter.js",
  base + "report-document-runtime.js",
  "src/runtime/routes/public.routes.js",
  "scripts/check-interface-ui-universal.mjs",
  "scripts/check-interface-report-ui-contract.mjs",
  "scripts/check-interface-annex-qr-contract.mjs",
  "scripts/check-interface-assembly-signals-contract.mjs"
]) {
  const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
  assert.equal(result.status, 0, `${file} syntax failed: ${result.stderr || result.stdout}`);
}

assert.equal(
  pkg.scripts["check:interface-ui"],
  "node scripts/check-interface-ui-universal.mjs && node scripts/check-interface-report-ui-contract.mjs && node scripts/check-interface-annex-qr-contract.mjs && node scripts/check-interface-assembly-signals-contract.mjs && node scripts/check-interface-report-visual-regression.mjs"
);

console.log(JSON.stringify({
  check: "interface-ui",
  status: "PASS",
  pages: Object.keys(pages),
  shared_shell: true,
  landing_console_v3: true,
  landing_global_rail: false,
  landing_central_phase_count: 16,
  exact_current_job_visible: true,
  manual_registry_selector: false,
  phase3_domain_projection: true,
  reinvestigation_terminal: false,
  p12_adapter_current: true,
  qualified_review_section_attestation: true,
  stale_renderer_rejected: true,
  lex_nova_rebrand_leakage: false,
  download_json_public_action: false,
  sector_admin: true,
  controlled_states: true
}, null, 2));

function has(source, token, message) {
  assert.ok(source.includes(token), message || `missing ${token}`);
}

function lacks(source, token, message) {
  assert.equal(source.includes(token), false, message || `forbidden ${token}`);
}
