export const VAULT_BRIDGE_VERSION = "monolith_vault_bridge_v1";

const ASSEMBLY_PAYLOAD_TYPE = "assembly_handoff_payload";
const SOURCE_ENGINE = "interface_diligence_monolith";
const TARGET_ENGINE = "vault_assembly_engine";
const REVIEW_READY_BOUNDARY = "Review-Ready Draft handoff only. Not legal advice, not a compliance verdict, not law-firm work, and subject to qualified local counsel review before reliance.";

export function buildVaultHandoff({
  terminalJson = {},
  runId = null,
  executionPayload = null,
  htmlReport = null,
  events = []
} = {}) {
  const builtAt = nowIso();
  const warnings = [];
  const errors = [];
  const finalOutputHandoff = resolveFinalOutputHandoff(terminalJson);
  const sourceHandoff = resolveSourceVaultHandoff({ terminalJson, finalOutputHandoff });

  if (!sourceHandoff) {
    warnings.push("VAULT_ASSEMBLER_HANDOFF_MISSING");
    return buildMissingHandoff({
      terminalJson,
      finalOutputHandoff,
      runId,
      executionPayload,
      builtAt,
      warnings,
      errors
    });
  }

  const handoffMeta = clonePlainObject(sourceHandoff.handoff_meta);
  const functionalIntakeVaultSource = clonePlainObject(sourceHandoff.functional_intake_vault);
  const vaultPayload = firstPlainObject(
    sourceHandoff.vault_payload,
    functionalIntakeVaultSource.vault_payload,
    finalOutputHandoff?.vault_payload,
    terminalJson?.vault_payload
  );
  const vaultPrefillSuggestions = firstArray(
    sourceHandoff.vault_prefill_suggestions,
    functionalIntakeVaultSource.vault_prefill_suggestions,
    finalOutputHandoff?.vault_prefill_suggestions,
    terminalJson?.vault_prefill_suggestions
  );
  const vaultConfirmationQuestions = firstArray(
    sourceHandoff.vault_confirmation_questions,
    functionalIntakeVaultSource.vault_confirmation_questions,
    finalOutputHandoff?.vault_confirmation_questions,
    terminalJson?.vault_confirmation_questions
  );
  const assemblyHandoffIntake = firstPlainObject(
    sourceHandoff.assembly_handoff_intake,
    functionalIntakeVaultSource.assembly_handoff_intake,
    sourceHandoff.assembly_handoff,
    finalOutputHandoff?.assembly_handoff_intake,
    terminalJson?.assembly_handoff_intake
  );

  if (!Object.keys(handoffMeta).length) warnings.push("HANDOFF_META_MISSING_OR_EMPTY");
  if (!Object.keys(vaultPayload).length) warnings.push("VAULT_PAYLOAD_MISSING_OR_EMPTY");
  if (!Object.keys(assemblyHandoffIntake).length) warnings.push("ASSEMBLY_HANDOFF_INTAKE_MISSING_OR_EMPTY");
  if (!Array.isArray(vaultPrefillSuggestions)) warnings.push("VAULT_PREFILL_SUGGESTIONS_NOT_ARRAY");
  if (!Array.isArray(vaultConfirmationQuestions)) warnings.push("VAULT_CONFIRMATION_QUESTIONS_NOT_ARRAY");

  const handoffEnvelope = normalizeHandoffEnvelope({
    sourceEnvelope: sourceHandoff.handoff_envelope,
    runId,
    builtAt,
    warnings
  });

  const functionalIntakeVault = normalizeFunctionalIntakeVault({
    source: functionalIntakeVaultSource,
    vaultPayload,
    vaultPrefillSuggestions,
    vaultConfirmationQuestions,
    assemblyHandoffIntake,
    sourceHandoff,
    runId,
    builtAt,
    warnings
  });

  const assemblyHandoff = normalizeAssemblyHandoff({
    sourceHandoff,
    assemblyHandoffIntake,
    handoffEnvelope,
    runId,
    builtAt
  });

  const handoffLock = normalizeHandoffLock(sourceHandoff.handoff_lock, warnings);
  const sourceTrace = buildSourceTrace({
    sourceHandoff,
    finalOutputHandoff,
    terminalJson,
    executionPayload,
    htmlReport,
    events
  });

  const bridgeStatus = statusFromWarnings({ warnings, errors });

  return {
    bridge_version: VAULT_BRIDGE_VERSION,
    mode: "monolith_vault_bridge",
    bridge_status: bridgeStatus,
    run_id: runId || handoffEnvelope.run_id || null,
    built_at: builtAt,
    source_object: "terminal_json.final_output_handoff.vault_assembler_handoff",
    boundary: REVIEW_READY_BOUNDARY,
    handoff_meta: handoffMeta,
    handoff_envelope: handoffEnvelope,
    assembly_handoff: assemblyHandoff,
    functional_intake_vault: functionalIntakeVault,
    vault_payload: vaultPayload,
    vault_prefill_suggestions: vaultPrefillSuggestions,
    vault_confirmation_questions: vaultConfirmationQuestions,
    assembly_handoff_intake: assemblyHandoffIntake,
    source_trace: sourceTrace,
    handoff_lock: handoffLock,
    warnings: [...new Set([...(sourceHandoff.warnings || []), ...warnings])],
    errors
  };
}

export const buildVaultAssemblyHandoff = buildVaultHandoff;

export async function pushVaultHandoff({
  vault_assembly_handoff = null,
  vaultEngineUrl = "",
  vaultEngineToken = "",
  runId = null
} = {}) {
  const handoff = vault_assembly_handoff || null;

  if (!handoff) {
    return {
      vault_assembly_handoff: handoff,
      vault_push_status: {
        ok: false,
        status: "NO_VAULT_HANDOFF_TO_PUSH",
        mode: "monolith_vault_bridge",
        pushed_at: nowIso(),
        warnings: ["vault_assembly_handoff missing"]
      }
    };
  }

  if (!String(vaultEngineUrl || "").trim()) {
    return {
      vault_assembly_handoff: handoff,
      vault_push_status: {
        ok: true,
        status: "VAULT_ENGINE_NOT_CONFIGURED_READY_FOR_MANUAL_HANDOFF",
        mode: "monolith_vault_bridge",
        pushed_at: null,
        warnings: [],
        boundary: REVIEW_READY_BOUNDARY
      }
    };
  }

  try {
    const response = await fetch(vaultEngineUrl, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        ...(vaultEngineToken ? { authorization: `Bearer ${vaultEngineToken}` } : {})
      },
      body: JSON.stringify({
        run_id: runId || handoff.run_id || null,
        payload_type: ASSEMBLY_PAYLOAD_TYPE,
        handoff_envelope: handoff.handoff_envelope || null,
        assembly_handoff: handoff.assembly_handoff || null,
        vault_assembly_handoff: handoff
      })
    });

    const responseBody = await response.json().catch(async () => ({ text: await response.text().catch(() => "") }));

    return {
      vault_assembly_handoff: handoff,
      vault_push_status: {
        ok: response.ok,
        status: response.ok ? "PUSHED_TO_VAULT_ENGINE" : "VAULT_ENGINE_PUSH_FAILED",
        mode: "monolith_vault_bridge",
        http_status: response.status,
        pushed_at: nowIso(),
        boundary: REVIEW_READY_BOUNDARY
      },
      vault_push_response: responseBody
    };
  } catch (err) {
    return {
      vault_assembly_handoff: handoff,
      vault_push_status: {
        ok: false,
        status: "VAULT_ENGINE_PUSH_FAILED",
        mode: "monolith_vault_bridge",
        pushed_at: nowIso(),
        boundary: REVIEW_READY_BOUNDARY
      },
      vault_push_error: err?.message || String(err)
    };
  }
}

export default buildVaultHandoff;

function resolveFinalOutputHandoff(terminalJson) {
  if (isPlainObject(terminalJson?.final_output_handoff)) return terminalJson.final_output_handoff;
  if (isPlainObject(terminalJson?.terminal_json?.final_output_handoff)) return terminalJson.terminal_json.final_output_handoff;
  if (looksLikeFinalOutputHandoff(terminalJson)) return terminalJson;
  return null;
}

function resolveSourceVaultHandoff({ terminalJson, finalOutputHandoff }) {
  return firstPlainObject(
    finalOutputHandoff?.vault_assembler_handoff,
    finalOutputHandoff?.vault_assembly_handoff,
    terminalJson?.vault_assembler_handoff,
    terminalJson?.vault_assembly_handoff,
    terminalJson?.terminal_json?.final_output_handoff?.vault_assembler_handoff
  );
}

function buildMissingHandoff({ terminalJson, finalOutputHandoff, runId, executionPayload, builtAt, warnings, errors }) {
  const handoffEnvelope = normalizeHandoffEnvelope({
    sourceEnvelope: null,
    runId,
    builtAt,
    warnings
  });

  return {
    bridge_version: VAULT_BRIDGE_VERSION,
    mode: "monolith_vault_bridge",
    bridge_status: "VAULT_HANDOFF_NOT_PRESENT",
    run_id: runId || null,
    built_at: builtAt,
    source_object: "terminal_json.final_output_handoff.vault_assembler_handoff",
    boundary: REVIEW_READY_BOUNDARY,
    handoff_meta: {},
    handoff_envelope: handoffEnvelope,
    assembly_handoff: {},
    functional_intake_vault: {},
    vault_payload: {},
    vault_prefill_suggestions: [],
    vault_confirmation_questions: [],
    assembly_handoff_intake: {},
    source_trace: {
      final_output_handoff_present: Boolean(finalOutputHandoff),
      vault_assembler_handoff_present: false,
      terminal_json_present: Boolean(terminalJson),
      execution_payload_present: Boolean(executionPayload),
      no_substantive_derivation: true
    },
    handoff_lock: {
      lock_status: "CONTROLLED_FAILURE",
      lock_reason: "vault_assembler_handoff was not present in final_output_handoff"
    },
    warnings,
    errors
  };
}

function normalizeHandoffEnvelope({ sourceEnvelope, runId, builtAt, warnings }) {
  const envelope = clonePlainObject(sourceEnvelope);
  const originalPayloadType = envelope.payload_type;

  if (originalPayloadType && originalPayloadType !== ASSEMBLY_PAYLOAD_TYPE) {
    envelope.original_payload_type = originalPayloadType;
    warnings.push(`HANDOFF_ENVELOPE_PAYLOAD_TYPE_NORMALIZED:${originalPayloadType}->${ASSEMBLY_PAYLOAD_TYPE}`);
  }

  return {
    ...envelope,
    envelope_id: firstString(envelope.envelope_id, envelope.handoff_id, runId ? `handoff_${runId}` : `handoff_${Date.now()}`),
    run_id: firstString(envelope.run_id, runId),
    payload_type: ASSEMBLY_PAYLOAD_TYPE,
    source_engine: firstString(envelope.source_engine, SOURCE_ENGINE),
    target_engine: firstString(envelope.target_engine, TARGET_ENGINE),
    source_object: firstString(envelope.source_object, "final_output_handoff.vault_assembler_handoff"),
    created_at: firstString(envelope.created_at, envelope.submittedAt, builtAt),
    boundary: firstString(envelope.boundary, REVIEW_READY_BOUNDARY)
  };
}

function normalizeFunctionalIntakeVault({
  source,
  vaultPayload,
  vaultPrefillSuggestions,
  vaultConfirmationQuestions,
  assemblyHandoffIntake,
  sourceHandoff,
  runId,
  builtAt,
  warnings
}) {
  const functional = clonePlainObject(source);

  if (!Object.keys(functional).length) {
    warnings.push("FUNCTIONAL_INTAKE_VAULT_MISSING_RECONSTRUCTED_FROM_DIRECT_HANDOFF_FIELDS");
  }

  return {
    ...functional,
    vault_schema_version: firstString(functional.vault_schema_version, sourceHandoff.vault_schema_version, "functional_assembly_intake_vault_v1"),
    intake_mode: firstString(functional.intake_mode, sourceHandoff.intake_mode, "monolith_final_output_handoff"),
    functional_sections: firstPlainObject(functional.functional_sections, sourceHandoff.functional_sections),
    vault_payload: vaultPayload,
    vault_prefill_suggestions: vaultPrefillSuggestions,
    vault_confirmation_questions: vaultConfirmationQuestions,
    assembly_handoff_intake: assemblyHandoffIntake,
    source_trace: firstPlainObject(functional.source_trace, sourceHandoff.source_trace),
    status: firstString(functional.status, sourceHandoff.status, "READY_FOR_ASSEMBLY_REVIEW"),
    submittedAt: firstString(functional.submittedAt, sourceHandoff.submittedAt, builtAt),
    run_id: firstString(functional.run_id, sourceHandoff.run_id, runId)
  };
}

function normalizeAssemblyHandoff({ sourceHandoff, assemblyHandoffIntake, handoffEnvelope, runId, builtAt }) {
  const sourceAssembly = firstPlainObject(sourceHandoff.assembly_handoff, sourceHandoff.assembly_handoff_payload);
  return {
    ...sourceAssembly,
    handoff_id: firstString(sourceAssembly.handoff_id, handoffEnvelope.envelope_id),
    run_id: firstString(sourceAssembly.run_id, runId, handoffEnvelope.run_id),
    payload_type: ASSEMBLY_PAYLOAD_TYPE,
    source_engine: firstString(sourceAssembly.source_engine, SOURCE_ENGINE),
    target_engine: firstString(sourceAssembly.target_engine, TARGET_ENGINE),
    submittedAt: firstString(sourceAssembly.submittedAt, builtAt),
    boundary: firstString(sourceAssembly.boundary, REVIEW_READY_BOUNDARY),
    assembly_handoff_intake: assemblyHandoffIntake
  };
}

function normalizeHandoffLock(lock, warnings) {
  const sourceLock = clonePlainObject(lock);
  if (!Object.keys(sourceLock).length) warnings.push("HANDOFF_LOCK_MISSING_OR_EMPTY");
  return {
    ...sourceLock,
    lock_status: firstString(sourceLock.lock_status, sourceLock.status, "LOCKED_WITH_LIMITATIONS"),
    lock_boundary: firstString(sourceLock.lock_boundary, REVIEW_READY_BOUNDARY)
  };
}

function buildSourceTrace({ sourceHandoff, finalOutputHandoff, terminalJson, executionPayload, htmlReport, events }) {
  return {
    final_output_handoff_present: Boolean(finalOutputHandoff),
    vault_assembler_handoff_present: Boolean(sourceHandoff),
    terminal_json_present: Boolean(terminalJson),
    execution_payload_present: Boolean(executionPayload),
    html_report_present: Boolean(htmlReport),
    event_count: Array.isArray(events) ? events.length : 0,
    consumed_path: sourceHandoff ? "final_output_handoff.vault_assembler_handoff" : null,
    no_substantive_derivation: true,
    no_report_prose_scrape: true,
    no_vault_field_invention: true,
    boundary: REVIEW_READY_BOUNDARY
  };
}

function statusFromWarnings({ warnings, errors }) {
  if (errors.length) return "VAULT_HANDOFF_ERROR";
  if (warnings.includes("VAULT_ASSEMBLER_HANDOFF_MISSING")) return "VAULT_HANDOFF_NOT_PRESENT";
  if (warnings.some((warning) => /MISSING|EMPTY|NORMALIZED|RECONSTRUCTED/.test(warning))) return "READY_FOR_ASSEMBLY_REVIEW_WITH_WARNINGS";
  return "READY_FOR_ASSEMBLY_REVIEW";
}

function looksLikeFinalOutputHandoff(value) {
  return isPlainObject(value) && (
    Object.prototype.hasOwnProperty.call(value, "vault_assembler_handoff") ||
    Object.prototype.hasOwnProperty.call(value, "screen_report_payload") ||
    Object.prototype.hasOwnProperty.call(value, "integrated_json_report")
  );
}

function firstPlainObject(...values) {
  for (const value of values) {
    if (isPlainObject(value)) return clonePlainObject(value);
  }
  return {};
}

function firstArray(...values) {
  for (const value of values) {
    if (Array.isArray(value)) return cloneArray(value);
  }
  return [];
}

function firstString(...values) {
  for (const value of values) {
    const text = String(value ?? "").trim();
    if (text) return text;
  }
  return "";
}

function clonePlainObject(value) {
  if (!isPlainObject(value)) return {};
  return JSON.parse(JSON.stringify(value));
}

function cloneArray(value) {
  if (!Array.isArray(value)) return [];
  return JSON.parse(JSON.stringify(value));
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function nowIso() {
  return new Date().toISOString();
}
