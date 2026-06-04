export const ENGINE_IDS = Object.freeze([
  "wrapper",
  "diligence",
  "assembly",
  "delivery",
  "horizon",
  "maintenance"
]);

export const HANDOFF_STATUSES = Object.freeze([
  "draft",
  "ready",
  "pushed",
  "received",
  "failed"
]);

export const PAYLOAD_TYPES = Object.freeze([
  "assembly_handoff_payload",
  "delivery_package_payload",
  "regulatory_update_payload",
  "maintenance_alert_payload",
  "vault_confirmation_payload",
  "system_status_payload"
]);

export const COLLECTIONS = Object.freeze([
  "interface_runs",
  "interface_handoffs",
  "interface_handoff_payloads",
  "interface_delivery_packages",
  "interface_horizon_updates",
  "interface_maintenance_alerts",
  "interface_system_status"
]);

function createId(prefix) {
  const randomPart =
    globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
      ? globalThis.crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;

  return `${prefix}_${randomPart}`;
}

export function createRunId() {
  return createId("run");
}

export function createHandoffId() {
  return createId("handoff");
}

export function createHandoffEnvelope({
  runId = createRunId(),
  sourceEngine,
  targetEngine,
  payloadType,
  payloadRef = "",
  summary = "",
  warnings = []
}) {
  const timestamp = new Date().toISOString();

  return {
    handoff_id: createHandoffId(),
    run_id: runId,
    source_engine: sourceEngine,
    target_engine: targetEngine,
    payload_type: payloadType,
    status: "draft",
    created_at: timestamp,
    updated_at: timestamp,
    payload_ref: payloadRef,
    summary,
    warnings: Array.isArray(warnings) ? warnings : [String(warnings)]
  };
}

export function validateHandoffEnvelope(envelope) {
  const errors = [];

  if (!envelope || typeof envelope !== "object") {
    return { valid: false, errors: ["Envelope must be an object."] };
  }

  if (!envelope.handoff_id) errors.push("handoff_id is required.");
  if (!envelope.run_id) errors.push("run_id is required.");
  if (!ENGINE_IDS.includes(envelope.source_engine)) {
    errors.push("source_engine must be an allowed engine ID.");
  }
  if (!ENGINE_IDS.includes(envelope.target_engine)) {
    errors.push("target_engine must be an allowed engine ID.");
  }
  if (!PAYLOAD_TYPES.includes(envelope.payload_type)) {
    errors.push("payload_type must be an allowed payload type.");
  }
  if (!HANDOFF_STATUSES.includes(envelope.status)) {
    errors.push("status must be an allowed handoff status.");
  }
  if (!envelope.created_at || Number.isNaN(Date.parse(envelope.created_at))) {
    errors.push("created_at must be an ISO timestamp.");
  }
  if (!envelope.updated_at || Number.isNaN(Date.parse(envelope.updated_at))) {
    errors.push("updated_at must be an ISO timestamp.");
  }
  if (envelope.warnings !== undefined && !Array.isArray(envelope.warnings)) {
    errors.push("warnings must be an array.");
  }

  return { valid: errors.length === 0, errors };
}
