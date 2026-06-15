import { runDiligenceStage } from "../diligence/stageRunner.js";

export async function runStage(stageId, input, options = {}) {
  const result = await runDiligenceStage({ stageId, input, options, env: process.env });
  if (!result.ok) {
    const error = new Error(result.error || `${stageId} failed`);
    error.result = result;
    error.status = result.status || 500;
    throw error;
  }
  return result;
}
