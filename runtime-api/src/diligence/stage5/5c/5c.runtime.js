import { assertLosslessPrimaryEvidence, assertWindowIsVerbatim } from "../stage5.runtime.js";
import { STAGE5_FEATURE_PATTERNS } from "../stage5.dictionary.js";
import { buildStage5CPromptInput } from "./5c.prompt.js";

function patternForFunction(row = {}) {
  const haystack = `${row.function_id} ${row.function_name} ${row.system_action}`.toLowerCase();
  return STAGE5_FEATURE_PATTERNS.find((pattern) => haystack.includes(pattern.key) || pattern.terms.some((term) => haystack.includes(term.toLowerCase()))) || STAGE5_FEATURE_PATTERNS[0];
}

function dataCategory(pattern) {
  if (pattern.input_data.includes("audio")) return "audio";
  if (pattern.input_data.includes("document")) return "document";
  if (pattern.input_data.includes("text")) return "text";
  return "api_payload";
}

export async function runStage5C({ canonicalInput, stage5a, stage5b, modelPorts = {}, runContext = {} } = {}) {
  assertLosslessPrimaryEvidence(canonicalInput);
  const evidenceWindows = [
    ...(stage5a?.feature_evidence_windows || []),
    ...(stage5b?.supplemental_evidence_windows || [])
  ];
  const windowIds = new Set(evidenceWindows.map((window) => window.window_id));
  const tagsByFunction = new Map((stage5b?.feature_tags || []).map((tag) => [tag.function_id, tag]));
  const records = [];
  const dataProvenanceSeeds = [];
  const regulatedSurfaceSeeds = [];
  const vaultQuestionSeeds = [];

  for (const fn of stage5a?.admitted_functions || []) {
    const tag = tagsByFunction.get(fn.function_id);
    if (!tag) {
      const error = new Error(`5C missing 5B tag row for ${fn.function_id}`);
      error.code = "STAGE5C_MISSING_5B_TAG";
      throw error;
    }
    const pattern = patternForFunction(fn);
    const refs = [...new Set([...(fn.source_window_refs || []), ...(tag.source_window_refs || [])])];
    if (!refs.length || refs.some((ref) => !windowIds.has(ref))) {
      const error = new Error("5C feature record lacks valid evidence_window_refs.");
      error.code = "STAGE5C_SOURCE_WINDOW_REF_VIOLATION";
      throw error;
    }
    const featureId = `FEAT_${fn.function_id.replace(/^S5A_FUNC_/, "")}`;
    const touchpoint = {
      touchpoint_id: `${featureId}_TP_001`,
      touchpoint_type: "input_processing",
      data_category: dataCategory(pattern),
      data_subject: "user",
      data_origin: "user_provided",
      direction: "inbound",
      processing_context: fn.system_action,
      explicitness: "evidenced",
      source_window_refs: refs
    };
    const provenance = {
      provenance_id: `${featureId}_DP_001`,
      data_origin: "user_provided",
      data_subject: "user",
      data_category: touchpoint.data_category,
      processing_context: fn.system_action,
      storage_or_retention_signal: "NOT_EVIDENCED",
      training_or_finetuning_signal: "NOT_EVIDENCED",
      sharing_signal: "NOT_EVIDENCED",
      logging_or_telemetry_signal: "NOT_EVIDENCED",
      source_window_refs: refs
    };
    const record = {
      feature_id: featureId,
      function_id: fn.function_id,
      core_product_id: fn.core_product_id,
      core_product_name: fn.core_product_name,
      feature_name: fn.function_name,
      feature_role: fn.primary_or_secondary === "secondary" ? "SECONDARY" : "CORE",
      commercial_function: fn.commercial_function,
      actor_or_user: fn.actor_or_user,
      input_data: pattern.input_data,
      system_action: fn.system_action,
      output_or_result: fn.output_or_result,
      delivery_channels: pattern.surface_tokens.includes("developer_api") ? ["api"] : ["app", "web"],
      autonomy_level: pattern.key === "voice_agent" ? "execute" : "unknown",
      human_review_signal: "not_visible",
      external_action_signal: pattern.key === "voice_agent" ? "true" : "unknown",
      archetype_codes: tag.archetype_codes,
      archetype_labels: tag.archetype_labels,
      surface_tokens: tag.surface_tokens,
      data_touchpoints: [touchpoint],
      data_provenance: [provenance],
      storage_or_retention_signal: "NOT_EVIDENCED",
      training_or_finetuning_signal: "NOT_EVIDENCED",
      sharing_signal: "NOT_EVIDENCED",
      logging_or_telemetry_signal: "NOT_EVIDENCED",
      evidence_window_refs: refs,
      unknowns: [],
      limitations: []
    };
    records.push(record);
    dataProvenanceSeeds.push({ feature_id: featureId, ...provenance });
    regulatedSurfaceSeeds.push({ feature_id: featureId, surface_tokens: tag.surface_tokens, source_window_refs: refs });
    vaultQuestionSeeds.push({ feature_id: featureId, question: "Confirm storage, training, sharing, and logging controls.", source_window_refs: refs });
  }

  for (const record of records) {
    for (const touchpoint of record.data_touchpoints) if (!touchpoint.source_window_refs.length) throw new Error("5C touchpoint missing source_window_refs.");
    for (const provenance of record.data_provenance) if (!provenance.source_window_refs.length) throw new Error("5C provenance missing source_window_refs.");
  }
  for (const window of evidenceWindows) {
    const source = canonicalInput.primary_evidence.sources.find((row) => row.source_id === window.source_id);
    assertWindowIsVerbatim(source, window);
  }
  return {
    ok: true,
    stage5c_output_version: "stage5c_complete_feature_records_v2",
    target_profile_ref: canonicalInput.target_profile_ref,
    complete_feature_records: records,
    feature_unknowns: [],
    data_provenance_seeds: dataProvenanceSeeds,
    regulated_surface_seeds: regulatedSurfaceSeeds,
    vault_question_seeds: vaultQuestionSeeds,
    supplemental_evidence_windows: [],
    prompt_input: buildStage5CPromptInput({ canonicalInput, stage5a, stage5b, evidenceWindows }),
    validation: { ok: true, complete_feature_record_count: records.length },
    forensic_log: { substage: "5C", model_port_used: Boolean(modelPorts?.stage5c), run_id: runContext?.runId || null }
  };
}
