import { buildRendererPayloadFromHandoff } from "./report-section-adapter.js";

export function buildRendererPayload({ run, final_output_handoff }) {
  const handoff = final_output_handoff?.final_output_handoff || final_output_handoff || {};
  return {
    renderer_payload: {
      run_id: run?.run_id || handoff?.run_meta?.run_id || "UNKNOWN_RUN",
      target: run?.target || handoff?.run_meta?.target || "UNKNOWN_TARGET",
      target_url: run?.root_url || run?.target_url || run?.target || handoff?.run_meta?.target_url || "UNKNOWN_TARGET_URL",
      generated_by: "portfolio_renderer",
      generated_at: new Date().toISOString(),
      validation_status: handoff?.validation_status || "UNKNOWN",
      ...buildRendererPayloadFromHandoff({ run, handoff })
    }
  };
}
