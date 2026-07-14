import fs from "node:fs";

patchAsyncRuntime();
patchOutcomeContract();
patchAuthorityCheck();
console.log("CO-E2E post-review lifecycle and outcome synchronization applied");

function patchAsyncRuntime() {
  const file = "src/runtime/services/async-phase13.service.js";
  let text = fs.readFileSync(file, "utf8");
  text = replaceOnce(text,
    'import { runAssemblyEngineRuntime } from "./assembly-engine.service.js";\n',
    'import { runAssemblyEngineRuntime } from "./assembly-engine.service.js";\nimport { outcomeRecord } from "../contracts/execution-outcome.contract.js";\n'
  );
  text = replaceOnce(text,
`    if (job === QR_JOB) {
      const rebuilt = await rebuildQualifiedReviewWorkspace({ run: claimed });
      await completedEvent({ run_id, actor, completedPhase: job, run: rebuilt.run, dispatchedNext: false, paused: true });
      return workerResponse(rebuilt.run, { completed_step: true, paused: true });
    }`,
`    if (job === QR_JOB) {
      const rebuilt = await rebuildQualifiedReviewWorkspace({ run: claimed });
      if (rebuilt.report_only === true) {
        await completedEvent({ run_id, actor, completedPhase: job, run: rebuilt.run, dispatchedNext: false, paused: false });
        return workerResponse(rebuilt.run, { completed_step: true, terminal: true, report_only: true });
      }
      await completedEvent({ run_id, actor, completedPhase: job, run: rebuilt.run, dispatchedNext: false, paused: true });
      return workerResponse(rebuilt.run, { completed_step: true, paused: true });
    }`
  );
  text = replaceOnce(text,
`  } catch (error) {
    const failed = await updateRunRecord(run_id, {
      status: "CONTROLLED_FAILURE",
      runner_state: "FAILED",
      runner_last_error: error?.message || String(error),
      runner_failed_at: new Date().toISOString()
    });
    await updateRunDashboardRow(failed);
    await logEvent({
      run_id,
      event_type: "ASYNC_WORKER_FAILED",
      actor,
      payload: {
        phase: job,
        central_phase: centralPhaseForJob(job),
        error_message: error?.message || String(error)
      }
    });
    throw error;
  }`,
`  } catch (error) {
    const outcome = outcomeRecord(error);
    const failed = await updateRunRecord(run_id, {
      status: outcome.runtime_status,
      run_blocked: outcome.run_blocked,
      execution_outcome: outcome.execution_outcome,
      runner_state: outcome.run_blocked ? "FAILED" : "IDLE",
      runner_last_error: outcome.message,
      runner_failed_at: outcome.run_blocked ? new Date().toISOString() : null
    });
    await updateRunDashboardRow(failed);
    await logEvent({
      run_id,
      event_type: "ASYNC_WORKER_OUTCOME",
      actor,
      payload: { phase: job, central_phase: centralPhaseForJob(job), ...outcome }
    });
    throw error;
  }`
  );
  text = replaceOnce(text,
`    paused: options.paused === true,
    already_running: false,`,
`    paused: options.paused === true,
    report_only: options.report_only === true,
    already_running: false,`
  );
  fs.writeFileSync(file, text);
}

function patchOutcomeContract() {
  const file = "src/runtime/contracts/execution-outcome.contract.js";
  let text = fs.readFileSync(file, "utf8");
  text = replaceOnce(text,
    '/PACKAGE_LIFECYCLE_(?:INVALID|MISSING|CATALOG_MISMATCH|SELECTABLE_ASSET_GAP)/i,',
    '/PACKAGE_LIFECYCLE_(?:INVALID|MISSING|CATALOG_MISMATCH|SELECTABLE_ASSET_GAP|NOT_EXECUTABLE_POST_REVIEW)/i,'
  );
  text = replaceOnce(text,
    '/REQUIRED_ARTIFACT_(?:MISSING|UNUSABLE)/i,',
    '/REQUIRED_ARTIFACT_(?:MISSING|UNUSABLE)/i,\n  /MISSING_REQUIRED_(?:INPUT|ARTIFACT)|MISSING_SCOPED_LOSSLESS_ROOT/i,'
  );
  fs.writeFileSync(file, text);
}

function patchAuthorityCheck() {
  const file = "scripts/check-e2e-outcome-domain-authority.mjs";
  let text = fs.readFileSync(file, "utf8");
  text = replaceOnce(text,
    'import { loadPackageLifecycleV1, selectablePackageIds } from "../src/runtime/domain-gate/package-lifecycle.loader.js";\n',
    'import { loadPackageLifecycleV1, selectablePackageIds } from "../src/runtime/domain-gate/package-lifecycle.loader.js";\nimport { resolvePostReviewPackageDisposition } from "../src/runtime/services/qualified-review-workspace.service.js";\n'
  );
  text = replaceOnce(text,
`assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.CRITICAL_FAILURE), true);

const artifacts = baseArtifacts();`,
`assert.equal(shouldBlockRun(EXECUTION_OUTCOMES.CRITICAL_FAILURE), true);
assert.deepEqual(resolvePostReviewPackageDisposition({ primary_domain_package: "ai-governance", primary_domain_lifecycle: "ACTIVE_E2E", primary_domain_delivery_mode: "FULL_REVIEW_READY" }), { package_id: "ai-governance", lifecycle: "ACTIVE_E2E", delivery_mode: "FULL_REVIEW_READY", mode: "FULL_REVIEW_READY" });
assert.deepEqual(resolvePostReviewPackageDisposition({ primary_domain_package: "fintech", primary_domain_lifecycle: "ACTIVE_REPORT_ONLY", primary_domain_delivery_mode: "REPORT_ONLY" }), { package_id: "fintech", lifecycle: "ACTIVE_REPORT_ONLY", delivery_mode: "REPORT_ONLY", mode: "REPORT_ONLY" });
assert.throws(() => resolvePostReviewPackageDisposition({ primary_domain_package: "saas", primary_domain_lifecycle: "DECLARED_NOT_INSTALLED", primary_domain_delivery_mode: "NOT_EXECUTABLE" }), /PACKAGE_LIFECYCLE_NOT_EXECUTABLE_POST_REVIEW/);

const artifacts = baseArtifacts();`
  );
  fs.writeFileSync(file, text);
}

function replaceOnce(value, from, to) {
  if (!value.includes(from)) throw new Error(`PATCH_ANCHOR_MISSING:${from.slice(0, 100)}`);
  return value.replace(from, to);
}
