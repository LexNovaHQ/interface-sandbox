import fs from "node:fs";

const file = "src/runtime/services/pipeline.service.js";
let source = fs.readFileSync(file, "utf8");

source = replaceOnce(source,
  'import { centralPhaseStatusForInternalJob } from "../contracts/central-phase.contract.js";\n',
  'import { centralPhaseStatusForInternalJob } from "../contracts/central-phase.contract.js";\nimport { isAdvanceAllowedStatus, outcomeRecord } from "../contracts/execution-outcome.contract.js";\n'
);
source = replaceOnce(source,
  'const ADVANCE_OK = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS", "COMPLETE"]);\n',
  ''
);
source = replaceOnce(source,
  'await updateRunRecord(run_id, { current_phase: persistencePhase, central_phase: central.central_phase_id, central_phase_label: central.central_phase_label, active_internal_job: internalJobId, status: "RUNNING" });',
  'await updateRunRecord(run_id, { current_phase: persistencePhase, central_phase: central.central_phase_id, central_phase_label: central.central_phase_label, active_internal_job: internalJobId, status: "RUNNING", run_blocked: false, execution_outcome: null });'
);
source = replaceOnce(source,
  '  } catch (error) {\n    await logEvent({ run_id, event_type: "CENTRAL_PIPELINE_JOB_FAILED", actor, payload: { persistencePhase, internalJobId, central_phase_id: central.central_phase_id, message: error.message } });\n    await updateRunRecord(run_id, { status: "CONTROLLED_FAILURE" });\n    throw error;\n  }',
  '  } catch (error) {\n    const outcome = outcomeRecord(error);\n    await logEvent({ run_id, event_type: "CENTRAL_PIPELINE_JOB_OUTCOME", actor, payload: { persistencePhase, internalJobId, central_phase_id: central.central_phase_id, ...outcome } });\n    await updateRunRecord(run_id, { status: outcome.runtime_status, run_blocked: outcome.run_blocked, execution_outcome: outcome.execution_outcome, last_runtime_error: outcome.message });\n    throw error;\n  }'
);
source = replaceOnce(source,
  'function nextForStatus(status, contract, fallback) { return ADVANCE_OK.has(status) ? contract.next : fallback; }',
  'function nextForStatus(status, contract, fallback) { return isAdvanceAllowedStatus(status) ? contract.next : fallback; }'
);

fs.writeFileSync(file, source);
console.log("CO-E2E-01 runtime patch applied");

function replaceOnce(value, from, to) {
  if (!value.includes(from)) throw new Error(`PATCH_ANCHOR_MISSING:${from.slice(0, 80)}`);
  return value.replace(from, to);
}
