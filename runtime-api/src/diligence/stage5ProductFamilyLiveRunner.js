import { buildStage5ProductFamilyPackets } from "./stage5ProductFamilyPacketBuilder.js";
import { mergeStage5ProductFamilyProfiles } from "./stage5ProductFamilyProfileMerger.js";
import { validateDiligenceStageOutput } from "./stageSchemaValidator.js";
import { validateTargetFeatureProfileGuardrails } from "./targetFeatureProfileGuardrails.js";

function asString(value, fallback = "") {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (value === undefined || value === null || value === "") return fallback;
  return String(value).trim() || fallback;
}
function numberFrom(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
function modeEnabled(options = {}, env = process.env) {
  if (options.stage5ProductFamilyMode === false) return false;
  if (env.STAGE5_PRODUCT_FAMILY_MODE === "false") return false;
  return true;
}
function featureRunOptions(env = process.env, extra = {}) {
  return {
    pool: env.LIVE_FEATURE_POOL || env.STAGE5_FEATURE_POOL || "reasoning",
    maxOutputTokens: numberFrom(env.LIVE_FEATURE_MAX_OUTPUT_TOKENS, 8192),
    timeoutMs: numberFrom(env.LIVE_FEATURE_TIMEOUT_MS, 90000),
    ...extra
  };
}
function log(logStage, logs, stage, status, details = {}) {
  if (typeof logStage === "function") logStage(logs, stage, status, details);
}

function validateMergedTargetFeatureProfile(profile, packageInput = {}) {
  const schema = validateDiligenceStageOutput("targetFeatureProfile", profile);
  if (!schema.ok) return { ok: false, reason: "schema_validation_failed", schema };

  const evidenceBuffer = Array.isArray(packageInput?.source_bundle?.evidence_buffer) ? packageInput.source_bundle.evidence_buffer : [];
  const threatMappingSupplied = packageInput?.threat_mapping_supplied === true || packageInput?.source_bundle?.source_review?.threat_mapping_supplied === true;
  const guardrail = validateTargetFeatureProfileGuardrails(profile, {
    packageInput,
    evidenceBuffer,
    threatMappingSupplied
  });
  if (!guardrail.ok) return { ok: false, reason: "guardrail_validation_failed", schema, guardrail };
  return { ok: true, schema, guardrail };
}

export async function runStage5ProductFamilyScopedProfile({ adapterResult, runStage, logs, logStage, options = {}, env = process.env } = {}) {
  if (!modeEnabled(options, env)) return null;
  const packetPlan = buildStage5ProductFamilyPackets(adapterResult?.target_feature_profile_input, {
    max_product_family_packets: numberFrom(env.STAGE5_MAX_PRODUCT_FAMILY_PACKETS, 8)
  });
  log(logStage, logs, "target_feature_profile_product_families", packetPlan.enabled ? "running" : "skipped", {
    enabled: packetPlan.enabled,
    disabled_reason: packetPlan.disabled_reason,
    family_packet_count: packetPlan.family_inputs.length,
    full_input_chars: packetPlan.input_size_report.full_input_chars,
    total_family_packet_chars: packetPlan.input_size_report.total_family_packet_chars,
    no_snippet_selection: true
  });
  if (!packetPlan.enabled) return null;

  const familyResults = [];
  for (const familyPacket of packetPlan.family_inputs) {
    log(logStage, logs, "target_feature_profile_product_family", "running", {
      product_family_id: familyPacket.product_family_id,
      product_family_name: familyPacket.product_family_name,
      source_count: familyPacket.source_count,
      estimated_input_chars: familyPacket.estimated_input_chars
    });
    const result = await runStage("target_feature_profile", familyPacket.input, featureRunOptions(env, { skipStage5FeatureDiscovery: true }));
    if (!result?.ok) {
      log(logStage, logs, "target_feature_profile_product_family", "fallback", {
        product_family_id: familyPacket.product_family_id,
        product_family_name: familyPacket.product_family_name,
        error_type: result?.error_type || "family_stage5_failed",
        error: asString(result?.error)
      });
      return null;
    }
    familyResults.push({ ...familyPacket, result, target_feature_profile: result.target_feature_profile });
    log(logStage, logs, "target_feature_profile_product_family", "complete", {
      product_family_id: familyPacket.product_family_id,
      product_family_name: familyPacket.product_family_name,
      feature_count: result.target_feature_profile?.feature_inventory?.length || 0,
      classification_status: result.target_feature_profile?.classification_quality?.status || null
    });
  }

  const merged = mergeStage5ProductFamilyProfiles({
    baseInput: adapterResult.target_feature_profile_input,
    familyResults,
    packetPlan
  });
  if (!merged.ok) {
    log(logStage, logs, "target_feature_profile_product_families", "fallback", {
      reason: "product_family_merge_produced_no_features",
      merge_summary: merged.merge_summary
    });
    return null;
  }

  const mergedValidation = validateMergedTargetFeatureProfile(merged.target_feature_profile, adapterResult.target_feature_profile_input);
  if (!mergedValidation.ok) {
    log(logStage, logs, "target_feature_profile_product_families", "fallback", {
      reason: `product_family_merge_${mergedValidation.reason}`,
      merge_summary: merged.merge_summary,
      schema_error_count: mergedValidation.schema?.errors?.length || 0,
      guardrail_error_count: mergedValidation.guardrail?.errors?.length || 0,
      guardrail_repair_count: mergedValidation.guardrail?.repairs?.length || 0,
      guardrail_warning_count: mergedValidation.guardrail?.warnings?.length || 0
    });
    return null;
  }

  log(logStage, logs, "target_feature_profile_product_families", "complete", {
    merge_summary: merged.merge_summary,
    classification_status: merged.target_feature_profile.classification_quality?.status || null,
    merged_schema_validation_mode: mergedValidation.schema.validation_mode,
    merged_guardrail_validation_mode: mergedValidation.guardrail.validation_mode,
    merged_guardrail_warning_count: mergedValidation.guardrail.warnings?.length || 0,
    merged_guardrail_repair_count: mergedValidation.guardrail.repairs?.length || 0
  });
  return merged.target_feature_profile;
}

export const stage5ProductFamilyLiveRunnerInternals = { validateMergedTargetFeatureProfile };
