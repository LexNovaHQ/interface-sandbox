import express from "express";
import { assertRunId } from "../../run-id.js";
import { getRunRecord, getArtifactMetadata } from "../../firestore.js";
import { readJsonArtifactFromDrive } from "../../drive.js";
import { sendError } from "../errors.js";
import { CENTRAL_PHASES } from "../contracts/central-phase.contract.js";

export const publicRouter = express.Router();

publicRouter.get("/runtime/central-phases", (_req, res) => res.json({ ok: true, phases: CENTRAL_PHASES }));

publicRouter.get("/diligence-system/jobs/:run_id/qualified-review", async (req, res) => {
  try {
    assertRunId(req.params.run_id);
    const run = await getRunRecord(req.params.run_id);
    const rendererPayload = await readRequiredArtifact(req.params.run_id, "qualified_review_renderer_payload");
    const validationManifest = await readOptionalArtifact(req.params.run_id, "qualified_review_validation_manifest");
    const sectionArtifacts = {};
    for (const artifactName of ["qr_artifact__entity_commercial", "qr_artifact__technology_infrastructure", "qr_artifact__ai_capability_product_behavior", "qr_artifact__dap_privacy_india_cyber"]) {
      sectionArtifacts[artifactName] = await readRequiredArtifact(req.params.run_id, artifactName);
    }
    return res.json({
      ok: true,
      run_id: req.params.run_id,
      public_label: "Qualified Review",
      system_boundary: {
        source_system: "Interface Diligence Engine",
        entry_condition: "qualified_review_renderer_payload and QR section artifacts exist",
        qualified_review_is_separate_system: true,
        no_document_assembly: true
      },
      run_status: run.status,
      current_phase: run.current_phase,
      qualified_review_renderer_payload: rendererPayload,
      qualified_review_validation_manifest: validationManifest,
      qualified_review_section_artifacts: sectionArtifacts
    });
  } catch (error) {
    return sendError(res, error);
  }
});

async function readRequiredArtifact(runId, artifactName) {
  const meta = await getArtifactMetadata(runId, artifactName);
  return readJsonArtifactFromDrive(meta.drive_file_id);
}

async function readOptionalArtifact(runId, artifactName) {
  try {
    return await readRequiredArtifact(runId, artifactName);
  } catch (error) {
    if (String(error?.message || error).startsWith(`ARTIFACT_NOT_FOUND:${runId}:${artifactName}`)) return null;
    throw error;
  }
}
