import {
  getExecutionNode,
  getPhasePoolBindings,
  getPhasePromptText,
  getPromptStackFileText,
  getRuntimeSpineText
} from "./prompt-stack-loader.js";
import { parseJsonFromModelText, makePhaseParseFailure } from "./phase-output-parser.js";
import { validateP1Output } from "./p1-output-validator.js";
import { validateP2Output } from "./p2-output-validator.js";
import { validateP3Output } from "./p3-output-validator.js";

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

export function buildP2PromptMessages({
  runId,
  targetUrl,
  companyName,
  sourceMode,
  hybridExtractionManifest,
  sourceDiscoveryHandoff,
  sourceDiscoveryForensicLedger,
  sourceDiscoveryTrace
} = {}) {
  const runtimeSpine = getRuntimeSpineText();
  const p2Prompt = getPhasePromptText("P2");
  const handoffContract = getPromptStackFileText("09_OUTPUT_HANDOFF_CONTRACT.md");
  const userPayload = {
    run_id: runId,
    current_node: "P2",
    prior_nodes: ["S0", "P1"],
    target_url: targetUrl,
    company_name: companyName,
    source_mode: sourceMode,
    hybrid_extraction_manifest_summary: summarizeHybridManifest(hybridExtractionManifest),
    source_discovery_handoff: sourceDiscoveryHandoff,
    source_discovery_forensic_ledger: sourceDiscoveryForensicLedger,
    source_discovery_trace: sourceDiscoveryTrace,
    output_required: [
      "target_profile",
      "target_profile_forensic_ledger",
      "target_profile_trace"
    ],
    hard_boundaries: [
      "no target_feature_profile",
      "no legal_cartography_index",
      "no target_data_provenance_profile",
      "no target_exposure_profile",
      "no registry_ledger",
      "no final_output_handoff",
      "no final report",
      "no new search/fetch/browse",
      "use admitted/locked P1 evidence only"
    ]
  };

  return buildPhasePromptMessages({
    phaseLabel: "P2 TARGET PROFILE",
    phasePrompt: p2Prompt,
    runtimeSpine,
    handoffContract,
    requiredKeys: "target_profile, target_profile_forensic_ledger, and target_profile_trace",
    downstreamWarning: "Do not create P3-P7 output and do not emit a final report.",
    userPayload
  });
}

export function buildP3PromptMessages({
  runId,
  targetUrl,
  companyName,
  sourceMode,
  hybridExtractionManifest,
  sourceDiscoveryHandoff,
  targetProfile,
  targetProfileForensicLedger,
  targetProfileTrace
} = {}) {
  const runtimeSpine = getRuntimeSpineText();
  const p3Prompt = getPhasePromptText("P3");
  const handoffContract = getPromptStackFileText("09_OUTPUT_HANDOFF_CONTRACT.md");
  const userPayload = {
    run_id: runId,
    current_node: "P3",
    prior_nodes: ["S0", "P1", "P2"],
    target_url: targetUrl,
    company_name: companyName,
    source_mode: sourceMode,
    hybrid_extraction_manifest_summary: summarizeHybridManifest(hybridExtractionManifest),
    source_discovery_handoff: sourceDiscoveryHandoff,
    target_profile: targetProfile,
    target_profile_forensic_ledger: targetProfileForensicLedger,
    target_profile_trace: targetProfileTrace,
    output_required: [
      "target_feature_profile",
      "feature_profile_forensic_ledger",
      "feature_function_trace"
    ],
    hard_boundaries: [
      "atomic unit is feature/function, not product wrapper",
      "product wrapper is context only",
      "features/functions may have multiple archetypes/surfaces",
      "no legal_cartography_index",
      "no target_data_provenance_profile",
      "no target_exposure_profile",
      "no registry_ledger",
      "no final_output_handoff",
      "no final report",
      "no new search/fetch/browse",
      "use admitted/locked P1 evidence + P2 target profile only"
    ]
  };

  return buildPhasePromptMessages({
    phaseLabel: "P3 TARGET FEATURE PROFILE",
    phasePrompt: p3Prompt,
    runtimeSpine,
    handoffContract,
    requiredKeys: "target_feature_profile, feature_profile_forensic_ledger, and feature_function_trace",
    downstreamWarning: "Do not create P4-P7 output and do not emit a final report.",
    userPayload
  });
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

export async function runP2TargetProfile(input = {}) {
  const {
    runId,
    targetUrl,
    companyName,
    sourceMode,
    hybridExtractionManifest,
    sourceDiscoveryHandoff,
    sourceDiscoveryForensicLedger,
    sourceDiscoveryTrace,
    promptStackStatus,
    callModel
  } = input;

  const result = await runModelPhase({
    nodeId: "P2",
    mode: "phase_stack_p2",
    readyStatus: "P2_TARGET_PROFILE_READY_P3_PENDING",
    parseFailedStatus: "P2_TARGET_PROFILE_MODEL_PARSE_FAILED",
    validationFailedStatus: "P2_TARGET_PROFILE_VALIDATION_FAILED",
    modelCallFailedStatus: "P2_TARGET_PROFILE_MODEL_CALL_FAILED",
    retryNode: "P2_RETRY_OR_REPAIR",
    successNextNode: "P3",
    promptStackStatus,
    callModel,
    buildMessages: () => buildP2PromptMessages({
      runId,
      targetUrl,
      companyName,
      sourceMode,
      hybridExtractionManifest,
      sourceDiscoveryHandoff,
      sourceDiscoveryForensicLedger,
      sourceDiscoveryTrace
    }),
    validateOutput: (parsed) => validateP2Output({
      p2Output: parsed,
      sourceDiscoveryHandoff,
      hybridExtractionManifest
    }),
    parseKey: "p2_parse",
    validationKey: "p2_validation",
    summaryKey: "p2_summary",
    outputKey: "p2_output"
  });

  const output = result.p2_output || {};
  return {
    ...result,
    target_profile: output.target_profile || null,
    target_profile_forensic_ledger: output.target_profile_forensic_ledger || null,
    target_profile_trace: output.target_profile_trace || null
  };
}

export async function runP3TargetFeatureProfile(input = {}) {
  const {
    runId,
    targetUrl,
    companyName,
    sourceMode,
    hybridExtractionManifest,
    sourceDiscoveryHandoff,
    targetProfile,
    targetProfileForensicLedger,
    targetProfileTrace,
    promptStackStatus,
    callModel
  } = input;

  const result = await runModelPhase({
    nodeId: "P3",
    mode: "phase_stack_p3",
    readyStatus: "P3_TARGET_FEATURE_PROFILE_READY_P4_PENDING",
    parseFailedStatus: "P3_TARGET_FEATURE_PROFILE_MODEL_PARSE_FAILED",
    validationFailedStatus: "P3_TARGET_FEATURE_PROFILE_VALIDATION_FAILED",
    modelCallFailedStatus: "P3_TARGET_FEATURE_PROFILE_MODEL_CALL_FAILED",
    retryNode: "P3_RETRY_OR_REPAIR",
    successNextNode: "P4",
    promptStackStatus,
    callModel,
    buildMessages: () => buildP3PromptMessages({
      runId,
      targetUrl,
      companyName,
      sourceMode,
      hybridExtractionManifest,
      sourceDiscoveryHandoff,
      targetProfile,
      targetProfileForensicLedger,
      targetProfileTrace
    }),
    validateOutput: (parsed) => validateP3Output({
      p3Output: parsed,
      targetProfile,
      sourceDiscoveryHandoff,
      hybridExtractionManifest
    }),
    parseKey: "p3_parse",
    validationKey: "p3_validation",
    summaryKey: "p3_summary",
    outputKey: "p3_output"
  });

  const output = result.p3_output || {};
  return {
    ...result,
    target_feature_profile: output.target_feature_profile || null,
    feature_profile_forensic_ledger: output.feature_profile_forensic_ledger || null,
    feature_function_trace: output.feature_function_trace || null
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

function buildPhasePromptMessages({ phaseLabel, phasePrompt, runtimeSpine, handoffContract, requiredKeys, downstreamWarning, userPayload }) {
  return {
    systemInstruction: [
      "# RUNTIME SPINE",
      runtimeSpine,
      "",
      `# ${phaseLabel} PHASE PROMPT`,
      phasePrompt,
      "",
      "# OUTPUT HANDOFF CONTRACT",
      handoffContract,
      "",
      "# STRICT EXECUTION INSTRUCTION",
      "Return only one valid JSON object. No markdown, no prose outside JSON.",
      `The JSON object must contain ${requiredKeys}.`,
      downstreamWarning
    ].join("\n"),
    userMessage: JSON.stringify(userPayload, null, 2)
  };
}

async function runModelPhase({
  nodeId,
  mode,
  readyStatus,
  parseFailedStatus,
  validationFailedStatus,
  modelCallFailedStatus,
  retryNode,
  successNextNode,
  promptStackStatus,
  callModel,
  buildMessages,
  validateOutput,
  parseKey,
  validationKey,
  summaryKey,
  outputKey
}) {
  const startedAt = new Date().toISOString();
  if (!promptStackStatus?.ok) {
    return phaseFailure({
      nodeId,
      mode,
      status: validationFailedStatus,
      retryNode,
      message: `${nodeId}_PROMPT_STACK_INVALID`,
      parseKey,
      validationKey,
      summaryKey,
      outputKey,
      errors: promptStackStatus?.validation_errors || ["PROMPT_STACK_STATUS_NOT_OK"]
    });
  }
  if (typeof callModel !== "function") {
    return phaseFailure({ nodeId, mode, status: modelCallFailedStatus, retryNode, message: `${nodeId}_CALL_MODEL_MISSING`, parseKey, validationKey, summaryKey, outputKey });
  }

  let poolUsed = "profile";
  try {
    const node = getExecutionNode(nodeId);
    const bindings = getPhasePoolBindings();
    poolUsed = bindings[nodeId]?.primary?.[0] || node.pool?.primary?.[0] || "profile";
  } catch (err) {
    return phaseFailure({ nodeId, mode, status: validationFailedStatus, retryNode, message: err?.message || `${nodeId}_EXECUTION_NODE_MISSING`, parseKey, validationKey, summaryKey, outputKey });
  }

  let messages;
  try {
    messages = buildMessages();
  } catch (err) {
    return phaseFailure({ nodeId, mode, status: validationFailedStatus, retryNode, message: err?.message || `${nodeId}_PROMPT_BUILD_FAILED`, parseKey, validationKey, summaryKey, outputKey });
  }

  let modelResult;
  try {
    modelResult = await callModel({
      nodeId,
      poolName: poolUsed,
      systemInstruction: messages.systemInstruction,
      userMessage: messages.userMessage,
      allowGrounding: false
    });
  } catch (err) {
    const validation = { ok: false, errors: [safeError(err)], warnings: [], summary: null };
    return {
      ok: false,
      node_id: nodeId,
      mode,
      status: modelCallFailedStatus,
      pool_used: poolUsed,
      model_meta: { error: safeError(err) },
      [outputKey]: null,
      [summaryKey]: null,
      [validationKey]: validation,
      [parseKey]: makePhaseParseFailure("", ["MODEL_CALL_FAILED"]),
      phase_forensic_event: forensicEvent({ phaseId: nodeId, status: "MODEL_CALL_FAILED", startedAt }),
      next_node: retryNode
    };
  }

  const rawText = typeof modelResult === "string" ? modelResult : modelResult?.text || "";
  const modelMeta = safeModelMeta(modelResult);
  const parsed = parseJsonFromModelText(rawText);
  if (!parsed.ok) {
    return {
      ok: false,
      node_id: nodeId,
      mode,
      status: parseFailedStatus,
      pool_used: poolUsed,
      model_meta: modelMeta,
      [outputKey]: null,
      [summaryKey]: null,
      [validationKey]: { ok: false, errors: [`${nodeId}_MODEL_OUTPUT_PARSE_FAILED`], warnings: [], summary: null },
      [parseKey]: parsed,
      phase_forensic_event: forensicEvent({ phaseId: nodeId, status: "PARSE_FAILED", startedAt }),
      next_node: retryNode
    };
  }

  const validation = validateOutput(parsed.parsed);
  return {
    ok: validation.ok,
    node_id: nodeId,
    mode,
    status: validation.ok ? readyStatus : validationFailedStatus,
    pool_used: poolUsed,
    model_meta: modelMeta,
    [outputKey]: validation.ok ? parsed.parsed : null,
    [summaryKey]: validation.summary,
    [validationKey]: validation,
    [parseKey]: parsed,
    phase_forensic_event: forensicEvent({ phaseId: nodeId, status: validation.ok ? `${nodeId}_READY` : "VALIDATION_FAILED", startedAt }),
    next_node: validation.ok ? successNextNode : retryNode
  };
}

function phaseFailure({ nodeId, mode, status, retryNode, message, parseKey, validationKey, summaryKey, outputKey, errors }) {
  const validation = { ok: false, errors: errors || [message], warnings: [], summary: null };
  return {
    ok: false,
    node_id: nodeId,
    mode,
    status,
    pool_used: null,
    model_meta: null,
    [outputKey]: null,
    [summaryKey]: null,
    [validationKey]: validation,
    [parseKey]: makePhaseParseFailure("", [message]),
    phase_forensic_event: forensicEvent({ phaseId: nodeId, status }),
    next_node: retryNode
  };
}

function summarizeHybridManifest(manifest) {
  const root = manifest?.hybrid_extraction_manifest || manifest || {};
  return {
    run_id: root.run_id || null,
    source_mode: root.source_mode || null,
    candidate_count: Array.isArray(root.candidate_sources) ? root.candidate_sources.length : 0,
    artifact_count: Array.isArray(root.lossless_text_artifacts) ? root.lossless_text_artifacts.length : 0,
    limitation_count: Array.isArray(root.collection_limitations) ? root.collection_limitations.length : 0,
    warning_count: Array.isArray(root.collection_warnings) ? root.collection_warnings.length : 0
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

function forensicEvent({ phaseId = "P1", status, startedAt = new Date().toISOString() }) {
  return {
    phase_id: phaseId,
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
