import express from "express";
import { configStatus } from "../config.js";
import {
  AGENTS,
  ARTIFACT_NAMES,
  ARTIFACT_PERMISSION_STATUS,
  INTERNAL_JOB_WRITE_PERMISSIONS,
  READ_PERMISSIONS,
  WRITE_PERMISSIONS
} from "../contracts/artifact-permissions.contract.js";
import { CENTRAL_PHASES } from "../contracts/central-phase.contract.js";

export const healthRouter = express.Router();

function publicPermissionMatrix() {
  return {
    known_artifact_count: ARTIFACT_NAMES.length,
    agent_count: AGENTS.length,
    read_permission_profile_count: Object.keys(READ_PERMISSIONS).length,
    write_permission_profile_count: Object.keys(WRITE_PERMISSIONS).length,
    internal_job_write_profile_count: Object.keys(INTERNAL_JOB_WRITE_PERMISSIONS).length,
    status: ARTIFACT_PERMISSION_STATUS
  };
}

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "interface-diligence-central-runtime",
    mode: "central_runtime_tree_pass7",
    production_entrypoint_switched: false,
    central_phase_count: CENTRAL_PHASES.length,
    storage: {
      firestore: "runtime/services/storage/firestore.service.js",
      drive: "runtime/services/storage/drive.service.js",
      sheets: "runtime/services/storage/sheets.service.js"
    },
    config: configStatus(),
    permissions: publicPermissionMatrix()
  });
});
