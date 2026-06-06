import assemblyOutputSchema from "../../../../data/schemas/assemblyOutput.schema.json";
import { validateHandoffEnvelope } from "../../contracts/handoffEnvelope.js";
import { formatSchemaErrors, validateJsonSchema } from "../../diligence/validation/index.js";

const FORBIDDEN_ASSEMBLY_INTAKE_FIELDS = Object.freeze([
  "compiler_output",
  "pipeline_artifacts",
  "source_collection",
  "source_bundle",
  "target_feature_profile",
  "legal_stack_review",
  "merged_registry_result",
  "registry_evaluation_ledger",
  "operator_challenge_result",
  "correction_result"
]);

function hasOwn(object, key) {
  return Object.prototype.hasOwnProperty.call(object || {}, key);
}

function countPrefillFields(vaultPrefill = {}) {
  return ["baseline", "architecture", "archetypes", "compliance"].reduce((total, group) => {
    return total + Object.keys(vaultPrefill[group] || {}).length;
  }, 0);
}

function createIntakeSummary({ handoff_envelope, assembly_handoff }) {
  return {
    handoff_id: handoff_envelope.handoff_id,
    run_id: handoff_envelope.run_id,
    status: handoff_envelope.status,
    payload_ref: handoff_envelope.payload_ref,
    source_engine: handoff_envelope.source_engine,
    target_engine: handoff_envelope.target_engine,
    payload_type: handoff_envelope.payload_type,
    recommended_package: assembly_handoff.assembly_route_recommendation?.recommended_package || null,
    feature_count: Array.isArray(assembly_handoff.feature_map) ? assembly_handoff.feature_map.length : 0,
    threat_finding_count: Array.isArray(assembly_handoff.threat_findings) ? assembly_handoff.threat_findings.length : 0,
    document_status_count: Array.isArray(assembly_handoff.document_stack_status) ? assembly_handoff.document_stack_status.length : 0,
    prefill_field_count: countPrefillFields(assembly_handoff.vault_prefill_suggestions),
    confirmation_question_count: Array.isArray(assembly_handoff.vault_confirmation_questions)
      ? assembly_handoff.vault_confirmation_questions.length
      : 0,
    warning_count: Array.isArray(assembly_handoff.warnings) ? assembly_handoff.warnings.length : 0
  };
}

export function validateAssemblyIntake(input = {}) {
  const errors = [];

  FORBIDDEN_ASSEMBLY_INTAKE_FIELDS.forEach((field) => {
    if (hasOwn(input, field)) {
      errors.push(`Assembly intake must not receive raw Diligence field: ${field}`);
    }
  });

  const handoff_envelope = input.handoff_envelope;
  const assembly_handoff = input.assembly_handoff;

  if (!handoff_envelope) errors.push("handoff_envelope is required.");
  if (!assembly_handoff) errors.push("assembly_handoff is required.");

  if (handoff_envelope) {
    const envelopeValidation = validateHandoffEnvelope(handoff_envelope);
    if (!envelopeValidation.valid) {
      errors.push(...envelopeValidation.errors.map((error) => `handoff_envelope: ${error}`));
    }

    if (handoff_envelope.source_engine !== "diligence") {
      errors.push("handoff_envelope.source_engine must be diligence.");
    }

    if (handoff_envelope.target_engine !== "assembly") {
      errors.push("handoff_envelope.target_engine must be assembly.");
    }

    if (handoff_envelope.payload_type !== "assembly_handoff_payload") {
      errors.push("handoff_envelope.payload_type must be assembly_handoff_payload.");
    }
  }

  if (assembly_handoff) {
    const handoffValidation = validateJsonSchema(assemblyOutputSchema, assembly_handoff);
    if (!handoffValidation.ok) {
      errors.push(`assembly_handoff schema invalid: ${formatSchemaErrors(handoffValidation.errors)}`);
    }
  }

  if (handoff_envelope?.run_id && assembly_handoff?.handoff_meta?.run_id && handoff_envelope.run_id !== assembly_handoff.handoff_meta.run_id) {
    errors.push("handoff_envelope.run_id must match assembly_handoff.handoff_meta.run_id.");
  }

  return {
    ok: errors.length === 0,
    errors,
    summary: errors.length ? null : createIntakeSummary({ handoff_envelope, assembly_handoff })
  };
}

export function createAssemblyIntake(input = {}) {
  const validation = validateAssemblyIntake(input);

  if (!validation.ok) {
    return {
      ok: false,
      status: "rejected",
      errors: validation.errors
    };
  }

  return {
    ok: true,
    status: "ready_for_vault_confirmation",
    handoff_envelope: input.handoff_envelope,
    assembly_handoff: input.assembly_handoff,
    summary: validation.summary,
    next_actions: [
      "Review Vault prefill suggestions",
      "Collect required Vault confirmation answers",
      "Build canonical Vault payload",
      "Route to document assembly"
    ]
  };
}

export function assertAssemblyIntakeReady(intakeResult) {
  if (!intakeResult?.ok) {
    throw new Error(`Assembly intake rejected: ${(intakeResult?.errors || []).join(" | ")}`);
  }

  return intakeResult;
}
