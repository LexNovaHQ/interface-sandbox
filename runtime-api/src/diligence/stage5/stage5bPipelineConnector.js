/* LexNova Runtime — Stage 5B Batch 3 Pipeline Connector.
 * Connects Batch 0 doctrine, Batch 1 shared foundation, Batch 2 5A, and Batch 3 5B into runtime.
 * This file does not assemble target_feature_profile and does not run 5C-5E.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { buildStage5RoutingPlan, summarizeStage5RoutingPlan } from "./shared/stage5SharedIndex.js";
import { runStage5B } from "./5b/stage5bIndex.js";

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asPlainObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function serializePrompt(prompt) {
  if (typeof prompt === "string") return prompt;
  return [
    prompt?.system || "",
    "\n---EXPECTED_JSON_CONTRACT---\n",
    JSON.stringify(prompt?.expected_json_contract || {}, null, 2),
    "\n---INPUT_JSON---\n",
    typeof prompt?.user === "string" ? prompt.user : JSON.stringify(prompt?.user || {}, null, 2)
  ].join("\n");
}

function readJsonIfPresent(filePath) {
  if (!filePath || !fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function registryKeyPaths(env = process.env) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  return [
    env.REGISTRY_KEY_RUNTIME_PATH,
    path.join(process.cwd(), "..", "data", "runtime", "registry_key.runtime.json"),
    path.join(process.cwd(), "data", "runtime", "registry_key.runtime.json"),
    path.join(here, "..", "..", "..", "..", "data", "runtime", "registry_key.runtime.json")
  ].filter(Boolean);
}

function loadRegistryKey(env = process.env) {
  const attempted = [];
  for (const candidate of registryKeyPaths(env)) {
    const resolved = path.resolve(candidate);
    attempted.push(resolved);
    const json = readJsonIfPresent(resolved);
    if (json) return { json, path: resolved, attempted };
  }
  const error = new Error("Stage 5B registry key runtime artifact not found.");
  error.status = 500;
  error.attempted_paths = attempted;
  throw error;
}

function modelMetadata(runResult = {}) {
  return {
    ok: runResult.ok === true,
    pool: runResult.model_meta?.pool || null,
    model: runResult.model_meta?.selected_model || null,
    selected_model: runResult.model_meta?.selected_model || null,
    selected_key_alias: runResult.model_meta?.selected_key_alias || null,
    attempted_models: runResult.attempts || [],
    fallback_used: runResult.fallback_used === true,
    primary_error: runResult.primary_error || null,
    usage_metadata: runResult.usage_metadata || null
  };
}

function buildPorts({ runGeminiPool, logs, logStage, env }) {
  return {
    registry: {
      async loadRegistryKey() {
        const loaded = loadRegistryKey(env);
        return {
          ...asPlainObject(loaded.json),
          source_file: {
            ...(asPlainObject(loaded.json).source_file || {}),
            filename: loaded.path
          }
        };
      }
    },
    model: {
      async runJsonStage({ phaseId, prompt, modelPool, runId }) {
        if (typeof runGeminiPool !== "function") throw new Error("Stage 5B connector requires runGeminiPool");
        const promptText = serializePrompt(prompt);
        logStage?.(logs, "stage5b_archetype_surface_tagging", "model_running", {
          phase_id: phaseId,
          model_pool: modelPool || "JSON",
          prompt_chars: promptText.length
        });
        const runResult = await runGeminiPool({
          poolName: env.STAGE5B_MODEL_POOL || env.LIVE_STAGE5B_POOL || env.STAGE5_FEATURE_POOL || "reasoning",
          prompt: promptText,
          env,
          options: {
            responseMimeType: "application/json",
            temperature: Number(env.STAGE5B_TEMPERATURE || 0.1),
            maxOutputTokens: Number(env.STAGE5B_MAX_OUTPUT_TOKENS || env.LIVE_STAGE5B_MAX_OUTPUT_TOKENS || 12000),
            timeoutMs: Number(env.STAGE5B_TIMEOUT_MS || env.LIVE_STAGE5B_TIMEOUT_MS || 90000),
            maxAttempts: Number(env.STAGE5B_MAX_ATTEMPTS || 1)
          }
        });
        if (!runResult.ok) {
          const error = new Error(runResult.error || "Stage 5B model call failed");
          error.status = runResult.error_type === "TIMEOUT" ? 504 : 502;
          error.model_metadata = modelMetadata(runResult);
          throw error;
        }
        return { json: runResult.json, model_metadata: modelMetadata(runResult), run_id: runId };
      }
    }
  };
}

export async function runStage5BBatch3Pipeline({ adapterResult = {}, runGeminiPool, logs, logStage, runId = null, env = process.env } = {}) {
  const stage5aBatch2 = adapterResult.stage5a_batch2 || adapterResult.target_feature_profile_input?.stage5a_batch2 || null;
  const stage5aFeaturePackage = stage5aBatch2?.stage5a_feature_package || null;
  const featuresFor5B = asArray(stage5aFeaturePackage?.features_for_5b);
  if (!stage5aFeaturePackage || !featuresFor5B.length) {
    const error = new Error("Stage 5B Batch 3 requires Stage 5A feature package with features_for_5b.");
    error.status = 500;
    error.stage5a_available = Boolean(stage5aBatch2);
    error.features_for_5b_count = featuresFor5B.length;
    throw error;
  }

  const context = {
    run_id: `${runId || "runtime"}_stage5b_batch3`,
    run_mode: "LIVE_STAGE5B_BATCH3",
    target_profile_ref: stage5aFeaturePackage.target_profile_ref || adapterResult.target_feature_profile_input?.target_profile_ref || null,
    stage5a_feature_package: stage5aFeaturePackage,
    features_for_5b_count: featuresFor5B.length
  };
  const routingPlan = buildStage5RoutingPlan(context);
  logStage?.(logs, "stage5b_archetype_surface_tagging", "running", {
    features_for_5b_count: featuresFor5B.length,
    routing: summarizeStage5RoutingPlan(routingPlan)
  });

  const ports = buildPorts({ runGeminiPool, logs, logStage, env });
  const result = await runStage5B({
    stage5aFeaturePackage,
    ports,
    routingPlan,
    runId: context.run_id
  });
  const metrics = result.stage5b_validation?.metrics || {};
  logStage?.(logs, "stage5b_archetype_surface_tagging", "complete", {
    feature_tag_count: metrics.feature_tag_count || result.stage5b_archetype_surface_tagging?.feature_tags?.length || 0,
    tagging_failure_count: metrics.tagging_failure_count || 0,
    controlled_archetype_count: metrics.controlled_archetype_count || 0,
    controlled_surface_count: metrics.controlled_surface_count || 0,
    validation_ok: result.stage5b_validation?.ok === true,
    validation_severity: result.stage5b_validation?.severity || null
  });

  return {
    ok: result.stage5b_validation?.ok !== false,
    routing_plan: routingPlan,
    ...result
  };
}
