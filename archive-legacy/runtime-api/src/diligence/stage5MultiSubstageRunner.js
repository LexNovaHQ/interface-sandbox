import { runStage5Runtime } from "./stage5/stage5.runtime.js";

function asText(value) {
  return typeof value === "string" ? value.trim() : "";
}

/*
 * RETIRED LEGACY STAGE 5 MULTI-SUBSTAGE RUNNER SHIM.
 *
 * The historical implementation in this file predated the canonical Stage 5 spine and
 * included old 5A/5B/5C/5D/5E-style assembly logic. That path is no longer allowed.
 *
 * Any caller that still imports runStage5MultiSubstageProfile now receives the
 * canonical Stage 5 runtime result, preserving the external return expectation while
 * preventing legacy deterministic/source-normalizing logic from re-entering runtime.
 */

export async function runStage5MultiSubstageProfile({
  adapterResult = {},
  companyProfile = null,
  logs = [],
  logStage = null,
  env = process.env,
  modelPorts = {},
  registryPorts = {},
  schemaValidator = null
} = {}) {
  const stage5Input = adapterResult?.target_feature_profile_input || adapterResult;
  const resolvedCompanyProfile = companyProfile || stage5Input?.upstream_profile || adapterResult?.company_profile || {};
  const runId = asText(adapterResult?.run_id || stage5Input?.run_id || env?.GITHUB_RUN_ID) || `stage5_canonical_shim_${Date.now()}`;
  const log = (status, meta = {}) => {
    if (typeof logStage === "function") logStage(logs, "target_feature_profile_multistage", status, meta);
  };

  log("canonical_runtime_running", { shim: "stage5MultiSubstageRunner", run_id: runId });
  const result = await runStage5Runtime({
    companyProfile: resolvedCompanyProfile,
    adapterResult,
    stage5Input,
    runContext: { runId },
    modelPorts,
    registryPorts,
    schemaValidator
  });
  log("canonical_runtime_complete", {
    shim: "stage5MultiSubstageRunner",
    feature_count: result?.target_feature_profile?.feature_inventory?.length || 0,
    reinvestigation_required: result?.validation?.reinvestigation_required === true
  });
  return result.target_feature_profile;
}

export const stage5MultiSubstageInternals = Object.freeze({
  retired_legacy_runner_replaced: true,
  canonical_runtime: "runStage5Runtime",
  old_5c_5d_5e_logic_available: false
});
