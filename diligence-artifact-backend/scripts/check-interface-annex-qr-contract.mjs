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
  qrPresentation: read("src/phases/13-qualified-review/presentation/qualified-review-presentation.builder.js"),
  publicRoutes: read("src/runtime/routes/public.routes.js"),
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
    confirmation_unit: "SECTION",
    per_question_confirmation_forbidden: true,
    active_registry_values: true,
    editable_atomic_values: true,
    section_attestation: true,
    save_draft_state: true,
    submission_request: true,
    legacy_renderer_retired: true
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
  has(files.qrHtml, "qualified-review.css?v=qr-section-attestation-v3-20260714");
  has(files.qrHtml, "<title>Qualified Review</title>");
  has(files.qrHtml, "Review Workspace");
  has(files.qrHtml, "Separate workspace");
  has(files.qrHtml, "Shared run ID");
  has(files.qrHtml, "Section-level attestation");
  has(files.qrHtml, "No document assembly");
  has(files.qrHtml, "Review values and attest each section");
  has(files.qrHtml, 'id="handoffMeta"');
  has(files.qrHtml, 'id="handoffBody"');
  has(files.qrHtml, 'id="qrReceiptPanel"');
  has(files.qrHtml, 'id="qrFinalGatePanel"');
  has(files.qrHtml, 'id="openAnnexure"');
  has(files.qrHtml, 'id="qualifiedReviewLiveStatus"');
  lacks(files.qrHtml, "Qualified Review Workspace");
  lacks(files.qrHtml, "Proceed to Drafting");

  has(files.qrCss, "INTERFACE_QUALIFIED_REVIEW_SECTION_ATTESTATION_V3");
  has(files.qrCss, "interface_qualified_review_section_attestation.v3");
  has(files.qrCss, ".qr-matter-panel");
  has(files.qrCss, ".qr-review-queue");
  has(files.qrCss, ".qr-section-attestation");
  has(files.qrCss, ".qr-atomic-field");
  has(files.qrCss, ".qr-receipt-panel");
  has(files.qrCss, ".qr-alert-panel");

  has(files.qrPresentation, 'QUALIFIED_REVIEW_PRESENTATION_VERSION = "phase13_qualified_review_presentation.v1"');
  has(files.qrPresentation, "qualified_review_is_separate_system: true");
  has(files.qrPresentation, "shares_pipeline_run_id: true");
  has(files.qrPresentation, "no_document_assembly: true");
  has(files.qrPresentation, 'confirmation_unit: "SECTION"');
  has(files.qrPresentation, "per_question_confirmation_forbidden: true");
  has(files.qrPresentation, "field_edit_resets_section_attestation: true");
  has(files.qrPresentation, "local_counsel_review_required: true");
  has(files.qrPresentation, "legal_architect_not_law_firm: true");

  has(files.qrJs, 'const VERSION = "interface_qualified_review_section_attestation.v3"');
  has(files.qrJs, 'confirmation_unit: "SECTION"');
  has(files.qrJs, "per_question_confirmation_forbidden: true");
  has(files.qrJs, "QUALIFIED_REVIEW_NO_DOCUMENT_ASSEMBLY_NOT_LOCKED");
  has(files.qrJs, "renderMatterSummary");
  has(files.qrJs, "renderSectionAttestation");
  has(files.qrJs, "Attest this section");
  has(files.qrJs, "fieldChanged");
  has(files.qrJs, "Save draft");
  has(files.qrJs, "Submit Qualified Review");
  has(files.qrJs, "DILIGENCE DERIVED");
  has(files.qrJs, "{MARKET BASED} — not diligence evidence");
  has(files.qrJs, "technical-annexure.html?run_id=");
  has(files.qrJs, "report.html?run_id=");
  lacks(files.qrJs, '["confirm", "Confirm"]');
  lacks(files.qrJs, "question_responses");
  lacks(files.qrJs, "qualified-review-backend-sync");
  lacks(files.qrJs, "assembly-engine.html");

  has(files.publicRoutes, "qualified-review/:run_id/draft");
  has(files.publicRoutes, "sections/:section_id/attestation");
  has(files.publicRoutes, "qualified-review/:run_id/submit");
  has(files.publicRoutes, "QUALIFIED_REVIEW_MATRIX_SUBMISSION_RETIRED");
}

function validateScripts() {
  for (const file of [
    base + "technical-annexure.js",
    base + "annexure-route-sync.js",
    base + "qualified-review-system/qualified-review.js",
    "src/phases/13-qualified-review/presentation/qualified-review-presentation.builder.js",
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
