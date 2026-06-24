import { z } from "zod";
import { ARTIFACT_NAMES, LOCK_STATUSES, PHASES } from "./constants.js";

export const createRunSchema = z.object({
  target: z.string().min(1),
  root_url: z.string().min(1),
  source_mode: z.enum(["url", "text", "url_plus_text", "synthetic_demo"]),
  created_by: z.string().optional().default("operator"),
  notes: z.string().optional().default("")
});

export const saveArtifactSchema = z.object({
  run_id: z.string().min(1),
  phase: z.enum(PHASES),
  agent_id: z.string().min(1),
  artifact_name: z.enum(ARTIFACT_NAMES),
  lock_status: z.enum(LOCK_STATUSES),
  artifact: z.record(z.any())
});

export const lockPhaseSchema = z.object({
  run_id: z.string().min(1),
  phase: z.enum(PHASES),
  agent_id: z.string().min(1).optional().default("operator"),
  status: z.enum(LOCK_STATUSES),
  next_phase: z.enum(PHASES).optional().nullable(),
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
