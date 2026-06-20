import { buildStage9Report } from "../diligence/stage9ReportAssembler.js";
import { validateStage9Report } from "../diligence/stage9ReportValidator.js";
import { renderLegalExposureReport } from "../report-renderer/legalExposureReportRendererV2.js";
import { assembleStage10VaultHandoff } from "../handoff/stage9ToVaultHandoffAdapter.js";
import { validateReviewReadyHandoff } from "../handoff/reviewReadyHandoffValidator.js";
import { hasReviewerDocumentText } from "./reviewerDocumentSourceAdapter.js";
import { asArray, loadRuntimeData, logStage, nowIso } from "./liveRunShared.js";
import { buildLiveEvidence, buildProfiles, normalizeInput } from "./liveEvidenceAndProfilePipeline.js";
import { buildStage6Cache, runStage, runStage6Live, runStage7, runStage8 } from "./canonicalLiveStage6To8Pipeline.js";

function normalizeStage8QualityControlLedger(stage8Ledger = {}) {
  const corrected = asArray(stage8Ledger.corrected_registry_ledger || stage8Ledger.post_challenge_ledger);
  const originalArtifactType = stage8Ledger.artifact_type || "stage8_post_challenge_ledger";
  stage8Ledger.qc_ledger_version = stage8Ledger.qc_ledger_version || "stage8_quality_control_ledger_v1";
  stage8Ledger.source_artifact_type = stage8Ledger.source_artifact_type || originalArtifactType;
  stage8Ledger.artifact_type = "stage8_quality_control_ledger";
  stage8Ledger.corrected_registry_ledger = corrected;
  stage8Ledger.post_challenge_ledger = corrected;
  stage8Ledger.source_policy = {
    ...(stage8Ledger.source_policy || {}),
    not_a_registry_ledger: true,
    applies_to: "exposure_profile.registry_ledger",
    stage9_must_consume_effective_registry_ledger_after_qc: true
  };
  return stage8Ledger;
}

function effectiveStage9Ledger(stage9ReportData = {}) {
  return asArray(
    stage9ReportData?.forensic_ledger_appendix?.full_registry_ledger
      || stage9ReportData?.report?.report_data?.forensic_ledger_appendix?.full_registry_ledger
      || stage9ReportData?.report?.report_data?.forensic_ledger_appendix?.appendix_e_exposure_forensic_ledger
  );
}

export async function runLiveDiligenceReview(input = {}, options = {}) {
  const logs = [];
  const warnings = [];
  const runId = `live_diligence_${Date.now()}`;
  const startedAt = nowIso();
  const { targetInput, targetUrl, documentText, documentLabel } = normalizeInput(input);
  const hasDoc = hasReviewerDocumentText({ document_text: documentText });
  const mode = targetUrl && hasDoc ? "url_and_document_text" : (targetUrl ? "url_only" : "document_text_only");

  logStage(logs, "live_run", "start", { run_id: runId, mode, has_url: Boolean(targetUrl), has_document_text: hasDoc, document_text_chars: documentText.length || 0 });

  const { registryRuntime, registryKey } = loadRuntimeData();
  const evidence = await buildLiveEvidence({ targetInput, targetUrl, documentText, documentLabel, hasDoc, options, logs, runId });
  const { sourceBundle, evidenceJunction, reviewerSource } = evidence;

  const { companyProfile, targetFeatureProfile } = await buildProfiles({ targetInput, sourceBundle, evidenceJunction, mode, logs, runId, runStage });
  const {
    stage6aStageResult,
    stage6bStageResult,
    stage6cStageResult,
    legalCartography,
    dataProvenanceProfile,
    stage6IntegratedArtifact,
    stage6IntegratedValidation,
    stage7HandoffValidation,
    stage7HandoffInput
  } = await runStage6Live({ sourceBundle, evidenceJunction, companyProfile, targetFeatureProfile, logs, runId });
  const stage6Cache = buildStage6Cache({
    sourceBundle,
    evidenceJunction,
    companyProfile,
    targetFeatureProfile,
    stage6aStageResult,
    stage6bStageResult,
    stage6cStageResult,
    legalCartography,
    dataProvenanceProfile,
    stage6IntegratedArtifact,
    stage6IntegratedValidation,
    stage7HandoffValidation,
    stage7HandoffInput
  });
  const stage7Artifact = await runStage7({ stage6Cache, registryRuntime, registryKey, logs, runId: `${runId}_stage7` });
  const { stage8Export, stage8Ledger, stage8Input } = await runStage8({ stage6Cache, stage7Artifact, registryRuntime, logs, runId: `${runId}_stage8` });
  normalizeStage8QualityControlLedger(stage8Ledger);

  logStage(logs, "stage9_report", "running");
  const stage9ReportData = buildStage9Report({ stage6Cache, stage7Artifact, stage8Ledger, stage8Export, registryRuntime });
  const stage9Validation = validateStage9Report({ stage9Report: stage9ReportData, postChallengeLedger: effectiveStage9Ledger(stage9ReportData), registryRuntime });
  if (!stage9Validation.ok) {
    const error = new Error("Stage 9 report validation failed.");
    error.result = stage9Validation;
    throw error;
  }
  logStage(logs, "stage9_report", "complete", { consolidated_findings: stage9ReportData.report?.report_data?.exposure_findings?.consolidated_count || 0 });

  let htmlReport = null;
  if (options.render_html !== false) {
    logStage(logs, "html_report", "running");
    htmlReport = renderLegalExposureReport(stage9ReportData);
    logStage(logs, "html_report", "complete", { html_bytes: Buffer.byteLength(htmlReport, "utf8") });
  }

  let stage10Handoff = null;
  let stage10Validation = null;
  if (options.run_handoff !== false) {
    logStage(logs, "stage10_handoff", "running");
    stage10Handoff = assembleStage10VaultHandoff({ stage9ReportData, stage6Cache, stage7Artifact, stage8Ledger }, { runId });
    stage10Validation = validateReviewReadyHandoff(stage10Handoff);
    if (!stage10Validation.ok) {
      const error = new Error("Stage 10 handoff validation failed.");
      error.result = stage10Validation;
      throw error;
    }
    logStage(logs, "stage10_handoff", "complete", { vault_questions: stage10Handoff.assembly_handoff?.vault_confirmation_questions?.length || 0 });
  }

  logStage(logs, "live_run", "complete", { run_id: runId });
  return {
    ok: true,
    artifact_type: "live_diligence_review_result",
    generated_at: nowIso(),
    started_at: startedAt,
    run_id: runId,
    mode,
    target_input: { ...targetInput, document_text_received: hasDoc, document_text_chars: documentText.length || 0 },
    stage_status: logs,
    stage9_report_data: stage9ReportData,
    html_report: htmlReport,
    stage10_handoff: stage10Handoff,
    validation: { stage9: stage9Validation, stage10: stage10Validation },
    metrics: {
      source_count: sourceBundle.raw_footprint?.source_records?.length || 0,
      reviewer_document_included: Boolean(reviewerSource),
      stage7_rows: stage7Artifact.exposure_profile?.registry_ledger?.length || stage7Artifact.merged_ledger?.length || 0,
      stage8_rows: stage8Ledger.corrected_registry_ledger?.length || stage8Ledger.post_challenge_ledger?.length || 0,
      stage8_corrected_count: stage8Ledger.corrected_count || 0,
      html_bytes: htmlReport ? Buffer.byteLength(htmlReport, "utf8") : 0
    },
    warnings,
    internal_artifacts: options.include_internal_artifacts === true ? { stage6Cache, stage7Artifact, stage8Export, stage8QualityControlLedger: stage8Ledger, stage8Ledger, stage8Input } : undefined
  };
}
