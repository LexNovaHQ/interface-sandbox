import { VAULT_GROUPS, isAllowedVaultPath } from "./vaultCanonicalMap.js";

const REQUIRED_ASSEMBLY_FIELDS = Object.freeze([
  "handoff_meta",
  "target_profile",
  "feature_map",
  "threat_findings",
  "document_stack_status",
  "vault_prefill_suggestions",
  "vault_confirmation_questions",
  "assembly_route_recommendation",
  "warnings"
]);

const REQUIRED_ENVELOPE_FIELDS = Object.freeze([
  "handoff_id",
  "run_id",
  "source_engine",
  "target_engine",
  "payload_type",
  "status",
  "created_at",
  "updated_at",
  "payload_ref",
  "summary",
  "warnings"
]);

function isObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isIsoDate(value) {
  return typeof value === "string" && !Number.isNaN(Date.parse(value));
}

function validatePrefill(prefill, errors) {
  if (!isObject(prefill)) {
    errors.push("vault_prefill_suggestions must be an object.");
    return;
  }

  const groups = Object.keys(prefill);
  VAULT_GROUPS.forEach((group) => {
    if (!isObject(prefill[group])) errors.push(`vault_prefill_suggestions.${group} must be an object.`);
  });
  groups.forEach((group) => {
    if (!VAULT_GROUPS.includes(group)) errors.push(`vault_prefill_suggestions contains non-canonical group: ${group}`);
  });

  VAULT_GROUPS.forEach((group) => {
    Object.entries(prefill[group] || {}).forEach(([localPath, suggestion]) => {
      const fieldPath = `${group}.${localPath}`;
      if (!isAllowedVaultPath(fieldPath)) errors.push(`Invalid Vault prefill field path: ${fieldPath}`);
      if (!isObject(suggestion)) {
        errors.push(`Vault suggestion at ${fieldPath} must be an object.`);
        return;
      }
      ["value", "basis", "confidence", "source_finding_ids"].forEach((key) => {
        if (!(key in suggestion)) errors.push(`Vault suggestion at ${fieldPath} missing ${key}.`);
      });
      if (!["high", "medium", "low"].includes(String(suggestion.confidence))) {
        errors.push(`Vault suggestion at ${fieldPath} has invalid confidence: ${suggestion.confidence}`);
      }
      if (!Array.isArray(suggestion.source_finding_ids)) {
        errors.push(`Vault suggestion at ${fieldPath} source_finding_ids must be an array.`);
      }
    });
  });
}

function validateQuestions(questions, errors) {
  if (!Array.isArray(questions)) {
    errors.push("vault_confirmation_questions must be an array.");
    return;
  }

  questions.forEach((question, index) => {
    if (!isObject(question)) {
      errors.push(`vault_confirmation_questions[${index}] must be an object.`);
      return;
    }
    ["field_path", "question", "why_it_matters", "source_context", "required_for"].forEach((key) => {
      if (!question[key]) errors.push(`vault_confirmation_questions[${index}] missing ${key}.`);
    });
    if (!isAllowedVaultPath(question.field_path)) {
      errors.push(`vault_confirmation_questions[${index}] has invalid Vault field path: ${question.field_path}`);
    }
  });
}

function validateAssemblyHandoff(assemblyHandoff, errors) {
  if (!isObject(assemblyHandoff)) {
    errors.push("assembly_handoff must be an object.");
    return;
  }

  REQUIRED_ASSEMBLY_FIELDS.forEach((field) => {
    if (!(field in assemblyHandoff)) errors.push(`assembly_handoff missing required field: ${field}`);
  });

  const meta = assemblyHandoff.handoff_meta || {};
  if (meta.source_engine !== "diligence") errors.push("assembly_handoff.handoff_meta.source_engine must be diligence.");
  if (meta.target_engine !== "assembly") errors.push("assembly_handoff.handoff_meta.target_engine must be assembly.");
  if (!meta.run_id) errors.push("assembly_handoff.handoff_meta.run_id is required.");
  if (!isIsoDate(meta.created_at)) errors.push("assembly_handoff.handoff_meta.created_at must be an ISO timestamp.");

  if (!isObject(assemblyHandoff.target_profile)) errors.push("assembly_handoff.target_profile must be an object.");
  if (!Array.isArray(assemblyHandoff.feature_map)) errors.push("assembly_handoff.feature_map must be an array.");
  if (!Array.isArray(assemblyHandoff.threat_findings)) errors.push("assembly_handoff.threat_findings must be an array.");
  if (!Array.isArray(assemblyHandoff.document_stack_status)) errors.push("assembly_handoff.document_stack_status must be an array.");
  if (!isObject(assemblyHandoff.assembly_route_recommendation)) errors.push("assembly_handoff.assembly_route_recommendation must be an object.");
  if (!Array.isArray(assemblyHandoff.warnings)) errors.push("assembly_handoff.warnings must be an array.");

  validatePrefill(assemblyHandoff.vault_prefill_suggestions, errors);
  validateQuestions(assemblyHandoff.vault_confirmation_questions, errors);
}

function validateEnvelope(envelope, errors) {
  if (!isObject(envelope)) {
    errors.push("handoff_envelope must be an object.");
    return;
  }

  REQUIRED_ENVELOPE_FIELDS.forEach((field) => {
    if (!(field in envelope)) errors.push(`handoff_envelope missing required field: ${field}`);
  });

  if (envelope.source_engine !== "diligence") errors.push("handoff_envelope.source_engine must be diligence.");
  if (envelope.target_engine !== "assembly") errors.push("handoff_envelope.target_engine must be assembly.");
  if (envelope.payload_type !== "assembly_handoff_payload") errors.push("handoff_envelope.payload_type must be assembly_handoff_payload.");
  if (envelope.status !== "draft") errors.push("handoff_envelope.status must be draft.");
  if (!isIsoDate(envelope.created_at)) errors.push("handoff_envelope.created_at must be an ISO timestamp.");
  if (!isIsoDate(envelope.updated_at)) errors.push("handoff_envelope.updated_at must be an ISO timestamp.");
  if (!Array.isArray(envelope.warnings)) errors.push("handoff_envelope.warnings must be an array.");
}

export function validateReviewReadyHandoff(result) {
  const errors = [];
  const warnings = [];

  if (!isObject(result)) {
    return { ok: false, errors: ["Stage 10 handoff result must be an object."], warnings };
  }

  if (result.ok !== true) errors.push("Stage 10 result ok must be true.");
  if (result.node !== "5B_COMPAT_RUNTIME") errors.push("Stage 10 result node must be 5B_COMPAT_RUNTIME.");
  if (!result.run_id) errors.push("Stage 10 result run_id is required.");

  validateAssemblyHandoff(result.assembly_handoff, errors);
  validateEnvelope(result.handoff_envelope, errors);

  if (!isObject(result.persistence_plan)) errors.push("persistence_plan must be an object.");
  else {
    if (result.persistence_plan.payload_collection !== "interface_handoff_payloads") errors.push("persistence_plan.payload_collection must be interface_handoff_payloads.");
    if (result.persistence_plan.envelope_collection !== "interface_handoffs") errors.push("persistence_plan.envelope_collection must be interface_handoffs.");
    if (!result.persistence_plan.payload_ref) errors.push("persistence_plan.payload_ref is required.");
  }

  if (result.handoff_envelope?.payload_ref && result.persistence_plan?.payload_ref && result.handoff_envelope.payload_ref !== result.persistence_plan.payload_ref) {
    errors.push("handoff_envelope.payload_ref must match persistence_plan.payload_ref.");
  }

  if (!Object.values(result.assembly_handoff?.vault_prefill_suggestions || {}).some((group) => Object.keys(group || {}).length > 0)) {
    warnings.push("No Vault prefill suggestions were derived from Stage 9.");
  }

  return {
    ok: errors.length === 0,
    errors,
    warnings
  };
}
