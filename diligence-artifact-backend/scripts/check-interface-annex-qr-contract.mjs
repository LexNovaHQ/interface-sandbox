import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const base = "public/interface-diligence/diligence-system/";
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const files = Object.freeze({
  annexHtml: read(base + "technical-annexure.html"),
  annexCss: read(base + "interface-annexure.css"),
  annexJs: read(base + "technical-annexure.js"),
  annexRoutes: read(base + "annexure-route-sync.js"),
  qrHtml: read(base + "qualified-review.html"),
  qrCss: read(base + "qualified-review.css"),
  qrJs: read(base + "qualified-review-system/qualified-review.js"),
  qrRenderer: read("src/qualified-review-system/renderer.js"),
  packageJson: JSON.parse(read("package.json"))
});

validateIdentity();
validateAnnexure();
validateQualifiedReview();
validateScripts();
validatePackageScripts();

console.log(JSON.stringify({
  check: "interface-annexure-qualified-review-contract",
  status: "PASS",
  annexure: {
    manifest_only: true,
    grouped_by_phase_and_profile: true,
    private_exclusion_notice: true,
    report_and_qr_links: true
  },
  qualified_review: {
    qualified_review_is_separate_system: true,
    shares_pipeline_run_id: true,
    no_document_assembly: true,
    matter_summary: true,
    review_queue: true,
    confirm_correct_limitation: true,
    save_state: true,
    receipt: true
  }
}, null, 2));

function validateIdentity() {
  for (const source of [files.annexHtml, files.qrHtml]) {
    has(source, '<span class="wordmark-title">The Interface</span>');
    has(source, "Law × Technology · AI Governance · Privacy · Systems");
    lacks(source, "Lex Nova Diligence Engine");
  }
}

function validateAnnexure() {
  has(files.annexHtml, "interface-annexure.css?v=annexure-v1-20260713");
  has(files.annexHtml, "Public manifest only");
  has(files.annexHtml, "Private material excluded");
  has(files.annexHtml, "Reference layer");
  has(files.annexHtml, 'id="backToReportButton"');
  has(files.annexHtml, 'id="annexureQualifiedReviewButton"');
  has(files.annexHtml, 'id="annexureHeaderQualifiedReview"');
  has(files.annexHtml, 'id="manifestJsonButton"');
  has(files.annexHtml, 'id="artifactIndex"');
  has(files.annexHtml, "annexure-route-sync.js");
  has(files.annexHtml, "technical-annexure.js");

  has(files.annexCss, "INTERFACE_PUBLIC_ANNEXURE_V1");
  has(files.annexCss, "interface_public_annexure.v1");
  has(files.annexCss, ".annexure-phase-group");
  has(files.annexCss, ".annexure-profile-group");
  has(files.annexCss, ".annexure-table");
  has(files.annexCss, ".annexure-status.is-included");
  has(files.annexCss, ".annexure-status.is-excluded");

  has(files.annexJs, 'const VERSION = "interface_public_annexure.v1"');
  has(files.annexJs, 'payload.layer_id !== "layer_2_public_technical_annexure"');
  has(files.annexJs, "payload.report_body_inlines_full_payloads !== false");
  has(files.annexJs, "payload.manifest_only !== true");
  has(files.annexJs, "groupArtifacts");
  has(files.annexJs, "inferProfile");
  has(files.annexJs, "included_in_public_annexure_manifest");
  has(files.annexJs, "exclusion_reason");
  has(files.annexJs, "Public manifest metadata only");
  has(files.annexJs, 'th.scope = "col"');
  has(files.annexJs, "qualified-review.html?run_id=");
  has(files.annexJs, "report.html?run_id=");
  has(files.annexRoutes, "qualified-review.html?run_id=");
  lacks(files.annexJs, "reviewer submission payload");
  lacks(files.annexJs, "provider telemetry payload");
}

function validateQualifiedReview() {
  has(files.qrHtml, "interface-ui-shell.css?v=shell-v1-20260713");
  has(files.qrHtml, "qualified-review.css?v=qr-workspace-v2-20260713");
  has(files.qrHtml, "Qualified Review Workspace");
  has(files.qrHtml, "Separate workspace");
  has(files.qrHtml, "Shared run ID");
  has(files.qrHtml, "No document assembly");
  has(files.qrHtml, 'id="handoffMeta"');
  has(files.qrHtml, 'id="handoffBody"');
  has(files.qrHtml, 'id="qrReceiptPanel"');
  has(files.qrHtml, 'id="qrFinalGatePanel"');
  has(files.qrHtml, 'id="openAnnexure"');
  has(files.qrHtml, 'id="qualifiedReviewLiveStatus"');

  has(files.qrCss, "INTERFACE_QUALIFIED_REVIEW_WORKSPACE_V2");
  has(files.qrCss, "interface_qualified_review_workspace.v2");
  has(files.qrCss, ".qr-matter-panel");
  has(files.qrCss, ".qr-review-queue");
  has(files.qrCss, ".qr-decision-options");
  has(files.qrCss, '.qr-finding[data-review-mode="limitation"]');
  has(files.qrCss, ".qr-receipt-panel");
  has(files.qrCss, ".qr-alert-panel");

  has(files.qrRenderer, 'QUALIFIED_REVIEW_RENDERER_VERSION = "qualified_review_renderer_matrix_artifacts_v2.separate_workspace"');
  has(files.qrRenderer, "qualified_review_is_separate_system: true");
  has(files.qrRenderer, "shares_pipeline_run_id: true");
  has(files.qrRenderer, "no_document_assembly: true");
  has(files.qrRenderer, "limitation_notes: true");
  has(files.qrRenderer, "save_response_state: true");
  has(files.qrRenderer, "submission_receipt: true");
  has(files.qrRenderer, 'reviewer_decisions: ["confirm", "correct", "limitation", "not_applicable"]');
  has(files.qrRenderer, 'forbidden_public_actions: ["Download JSON", "Assemble Document", "Proceed to Drafting"]');
  has(files.qrRenderer, "before Qualified Review submission");
  lacks(files.qrRenderer, "before draft preparation");
  lacks(files.qrRenderer, "ready_for_assembly");
  lacks(files.qrRenderer, "assembly-engine.html");

  has(files.qrJs, 'const VERSION = "interface_qualified_review_workspace.v2"');
  has(files.qrJs, "qualified_review_is_separate_system: true");
  has(files.qrJs, "shares_pipeline_run_id: true");
  has(files.qrJs, "no_document_assembly: true");
  has(files.qrJs, "QUALIFIED_REVIEW_NO_DOCUMENT_ASSEMBLY_NOT_LOCKED");
  has(files.qrJs, "renderMatterSummary");
  has(files.qrJs, "renderFinding");
  has(files.qrJs, '["confirm", "Confirm"]');
  has(files.qrJs, '["correct", "Correct"]');
  has(files.qrJs, '["limitation", "Add limitation"]');
  has(files.qrJs, '["not_applicable", "Not applicable"]');
  has(files.qrJs, "reviewer_limitation");
  has(files.qrJs, "not_applicable_reason: limitation");
  has(files.qrJs, "save_reason: reason");
  has(files.qrJs, "question_responses: responses");
  has(files.qrJs, "localStorage.setItem");
  has(files.qrJs, "renderReceipt");
  has(files.qrJs, "Qualified Review receipt");
  has(files.qrJs, "No document was assembled");
  has(files.qrJs, "technical-annexure.html?run_id=");
  has(files.qrJs, "report.html?run_id=");
  lacks(files.qrJs, "assembly-engine.html");
  lacks(files.qrJs, "Proceed to Drafting");
  lacks(files.qrJs, "Ready for draft preparation");
  lacks(files.qrHtml, "Proceed to Drafting");
}

function validateScripts() {
  for (const file of [
    base + "technical-annexure.js",
    base + "annexure-route-sync.js",
    base + "qualified-review-system/qualified-review.js",
    "src/qualified-review-system/renderer.js",
    "scripts/check-interface-annex-qr-contract.mjs"
  ]) {
    const result = spawnSync(process.execPath, ["--check", path.join(root, file)], { encoding: "utf8" });
    assert.equal(result.status, 0, `${file} syntax check failed: ${result.stderr || result.stdout}`);
  }
}

function validatePackageScripts() {
  assert.equal(files.packageJson.scripts["check:interface-annex-qr"], "node scripts/check-interface-annex-qr-contract.mjs");
  assert.ok(files.packageJson.scripts["check:interface-ui"].includes("check-interface-annex-qr-contract.mjs"));
}

function has(source, token, message) {
  assert.ok(source.includes(token), message || `missing ${token}`);
}

function lacks(source, token, message) {
  assert.equal(source.includes(token), false, message || `forbidden ${token}`);
}
