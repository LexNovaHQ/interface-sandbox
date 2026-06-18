import {
  getExecutionNode,
  getPhasePoolBindings,
  getPhasePromptText,
  getPromptStackFileText,
  getRuntimeSpineText
} from "./prompt-stack-loader.js";
import { parseJsonFromModelText, makePhaseParseFailure } from "./phase-output-parser.js";
import { validateP1Output } from "./p1-output-validator.js";

export function buildP1PromptMessages({
  runId,
  targetUrl,
  companyName,
  sourceMode,
  hybridExtractionManifest
} = {}) {
  const runtimeSpine = getRuntimeSpineText();
  const p1Prompt = getPhasePromptText("P1");
  const handoffContract = getPromptStackFileText("09_OUTPUT_HANDOFF_CONTRACT.md");
  const userPayload = {
    run_id: runId,
    target_url: targetUrl,
    company_name: companyName,
    source_mode: sourceMode,
    current_node: "P1",
    prior_node: "S0",
    required_input_object: "hybrid_extraction_manifest",
    hybrid_extraction_manifest: hybridExtractionManifest,
    output_required: [
      "source_discovery_handoff",
      "source_discovery_forensic_ledger",
      "source_discovery_trace"
    ],
    hard_boundaries: [
      "no target_profile",
      "no feature_profile",
      "no legal_cartography",
      "no data_provenance",
      "no exposure_profile",
      "no registry_ledger",
      "no final_output_handoff",
      "no final report",
      "no new search/fetch/browse",
      "use Stage 0 candidate material only"
    ]
  };

  return {
    systemInstruction: [
      "# RUNTIME SPINE",
      runtimeSpine,
      "",
      "# P1 PHASE PROMPT",
      p1Prompt,
      "",
      "# OUTPUT HANDOFF CONTRACT",
      handoffContract,
      "",
      "# STRICT EXECUTION INSTRUCTION",
      "Return only one valid JSON object. No markdown, no prose outside JSON.",
      "The JSON object must contain source_discovery_handoff, source_discovery_forensic_ledger, and source_discovery_trace.",
      "Do not create any P2-P7 output and do not emit a final report."
    ].join("\n"),
    userMessage: JSON.stringify(userPayload, null, 2)
  };
}

export async function runP1SourceDiscovery(input = {}) {
  const {
    runId,
    targetUrl,
    companyName,
    sourceMode,
    hybridExtractionManifest,
    promptStackStatus,
    callModel
  } = input;

  const startedAt = new Date().toISOString();
  if (!promptStackStatus?.ok) {
    return failure("P1_PROMPT_STACK_INVALID", "P1_SOURCE_DISCOVERY_VALIDATION_FAILED", {
      errors: promptStackStatus?.validation_errors || ["PROMPT_STACK_STATUS_NOT_OK"]
    });
  }
  if (typeof callModel !== "function") {
    return failure("P1_CALL_MODEL_MISSING", "P1_SOURCE_DISCOVERY_MODEL_CALL_FAILED");
  }

  let node;
  let poolUsed = "router";
  try {
    node = getExecutionNode("P1");
    const bindings = getPhasePoolBindings();
    poolUsed = bindings.P1?.primary?.[0] || node.pool?.primary?.[0] || "router";
  } catch (err) {
    return failure(err?.message || "P1_EXECUTION_NODE_MISSING", "P1_SOURCE_DISCOVERY_VALIDATION_FAILED");
  }

  let messages;
  try {
    messages = buildP1PromptMessages({ runId, targetUrl, companyName, sourceMode, hybridExtractionManifest });
  } catch (err) {
    return failure(err?.message || "P1_PROMPT_BUILD_FAILED", "P1_SOURCE_DISCOVERY_VALIDATION_FAILED");
  }

  let modelResult;
  try {
    modelResult = await callModel({
      nodeId: "P1",
      poolName: poolUsed,
      systemInstruction: messages.systemInstruction,
      userMessage: messages.userMessage,
      allowGrounding: false
    });
  } catch (err) {
    return {
      ok: false,
      node_id: "P1",
      mode: "phase_stack_p1",
      status: "P1_SOURCE_DISCOVERY_MODEL_CALL_FAILED",
      pool_used: poolUsed,
      model_meta: { error: safeError(err) },
      p1_output: null,
      p1_summary: null,
      p1_validation: { ok: false, errors: [safeError(err)], warnings: [], summary: null },
      p1_parse: makePhaseParseFailure("", ["MODEL_CALL_FAILED"]),
      phase_forensic_event: forensicEvent({ status: "MODEL_CALL_FAILED", startedAt }),
      next_node: "P1_RETRY_OR_REPAIR"
    };
  }

  const rawText = typeof modelResult === "string" ? modelResult : modelResult?.text || "";
  const modelMeta = safeModelMeta(modelResult);
  const parsed = parseJsonFromModelText(rawText);
  if (!parsed.ok) {
    return {
      ok: false,
      node_id: "P1",
      mode: "phase_stack_p1",
      status: "P1_SOURCE_DISCOVERY_MODEL_PARSE_FAILED",
      pool_used: poolUsed,
      model_meta: modelMeta,
      p1_output: null,
      p1_summary: null,
      p1_validation: { ok: false, errors: ["P1_MODEL_OUTPUT_PARSE_FAILED"], warnings: [], summary: null },
      p1_parse: parsed,
      phase_forensic_event: forensicEvent({ status: "PARSE_FAILED", startedAt }),
      next_node: "P1_RETRY_OR_REPAIR"
    };
  }

  const validation = validateP1Output({
    p1Output: parsed.parsed,
    hybridExtractionManifest
  });

  return {
    ok: validation.ok,
    node_id: "P1",
    mode: "phase_stack_p1",
    status: validation.ok
      ? "P1_SOURCE_DISCOVERY_HANDOFF_READY_P2_PENDING"
      : "P1_SOURCE_DISCOVERY_VALIDATION_FAILED",
    pool_used: poolUsed,
    model_meta: modelMeta,
    p1_output: validation.ok ? parsed.parsed : null,
    p1_summary: validation.summary,
    p1_validation: validation,
    p1_parse: parsed,
    phase_forensic_event: forensicEvent({ status: validation.ok ? "P1_READY" : "VALIDATION_FAILED", startedAt }),
    next_node: validation.ok ? "P2" : "P1_RETRY_OR_REPAIR"
  };
}

export function summarizePhaseRun(result = {}) {
  return {
    ok: Boolean(result.ok),
    node_id: result.node_id || "P1",
    mode: result.mode || "phase_stack_p1",
    status: result.status || "UNKNOWN",
    pool_used: result.pool_used || null,
    next_node: result.next_node || null,
    p1_summary: result.p1_summary || null,
    p1_validation_ok: Boolean(result.p1_validation?.ok),
    p1_parse_status: result.p1_parse?.parse_status || null
  };
}

function failure(message, status, extra = {}) {
  const validation = {
    ok: false,
    errors: extra.errors || [message],
    warnings: [],
    summary: null
  };
  return {
    ok: false,
    node_id: "P1",
    mode: "phase_stack_p1",
    status,
    pool_used: null,
    model_meta: null,
    p1_output: null,
    p1_summary: null,
    p1_validation: validation,
    p1_parse: makePhaseParseFailure("", [message]),
    phase_forensic_event: forensicEvent({ status }),
    next_node: "P1_RETRY_OR_REPAIR"
  };
}

function forensicEvent({ status, startedAt = new Date().toISOString() }) {
  return {
    phase_id: "P1_SOURCE_DISCOVERY_EVIDENCE_BOX",
    status,
    started_at: startedAt,
    completed_at: new Date().toISOString()
  };
}

function safeModelMeta(result) {
  if (!result || typeof result !== "object") return null;
  return {
    pool_name: result.pool_name || null,
    model: result.model || null,
    key_index: result.key_index || null,
    key_fingerprint: result.fingerprint || null,
    grounding_used: Boolean(result.grounding_used)
  };
}

function safeError(err) {
  return String(err?.message || err || "UNKNOWN_MODEL_CALL_ERROR").slice(0, 1000);
}
