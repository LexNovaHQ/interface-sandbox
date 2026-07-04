import express from "express";
import { configStatus } from "../../config.js";
import { publicPermissionMatrix } from "../../permissions.js";
import { CENTRAL_PHASES } from "../contracts/central-phase.contract.js";

export const healthRouter = express.Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    ok: true,
    service: "interface-diligence-central-runtime",
    mode: "central_runtime_tree_pass1",
    production_entrypoint_switched: false,
    central_phase_count: CENTRAL_PHASES.length,
    storage: {
      firestore: "runs/{run_id}",
      drive: "one_folder_per_run",
      sheets: "dashboard_only"
    },
    config: configStatus(),
    permissions: publicPermissionMatrix()
  });
});
