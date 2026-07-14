import { z } from "zod";
import { CENTRAL_PHASE_BY_ID } from "./central-phase.contract.js";

const LOCK_STATUSES = Object.freeze(["CREATED", "RUNNING", "LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED", "CONTROLLED_FAILURE", "COMPLETE", "COMPLETE_WITH_WARNINGS", "COMPLETE_WITH_COUNSEL_ACTIONS"]);
const CENTRAL_PHASE_IDS = Object.freeze(Object.keys(CENTRAL_PHASE_BY_ID));

export const runtimeCreateRunSchema = z.object({
  target_url: z.string().min(1),
  target: z.string().optional().default(""),
  source_mode: z.enum(["url", "url_plus_documents"]).optional().default("url"),
  created_by: z.string().optional().default("reviewer"),
  notes: z.string().optional().default("")
});

export const runtimeAdvanceRunSchema = z.object({
  max_steps: z.number().int().min(1).max(10).optional().default(1),
  sync: z.boolean().optional().default(false),
  auto_continue: z.boolean().optional().default(true),
  authorize_assembly: z.boolean().optional().default(false),
  action: z.enum(["AUTHORIZE_ASSEMBLY"]).optional(),
  authorized_by: z.string().min(1).max(500).optional().default("public-diligence-system")
}).optional().default({ max_steps: 1, sync: false, auto_continue: true, authorize_assembly: false, authorized_by: "public-diligence-system" });

export const runtimeWorkerRunSchema = z.object({
  auto_continue: z.boolean().optional().default(true)
}).optional().default({ auto_continue: true });

export const runtimeLockCentralPhaseSchema = z.object({
  run_id: z.string().min(1),
  central_phase: z.enum(CENTRAL_PHASE_IDS),
  agent_id: z.string().optional().default("operator"),
  status: z.enum(LOCK_STATUSES),
  next_central_phase: z.enum(CENTRAL_PHASE_IDS).optional().nullable(),
  final_report_url: z.string().optional().default("")
});

export function parseOrThrow(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    const message = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`).join("; ");
    throw new Error(`INVALID_REQUEST:${message}`);
  }
  return result.data;
}

export const RUNTIME_SCHEMA_STATUS = Object.freeze({
  central_runtime_contract: "schemas.contract",
  old_schema_bridge_removed_from_runtime_routes: true,
  central_phase_schema_supported: true,
  explicit_assembly_authorization_supported: true
});
