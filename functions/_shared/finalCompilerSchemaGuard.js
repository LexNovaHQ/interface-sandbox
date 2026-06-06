import { normalizeFinalCompilerOutput } from "./finalCompilerNormalizer.js";

const TOP_LEVEL_KEYS = Object.freeze([
  "diligence_run",
  "source_bundle_summary",
  "target_profile",
  "primary_product",
  "product_feature_map",
  "legal_stack",
  "document_stack_redline",
  "threat_registry_summary",
  "feature_to_threat_matrix",
  "findings",
  "controlled_rows",
  "insufficient_evidence_rows",
  "assembly_route",
  "report_data",
  "technical_audit_log",
  "threat_findings",
  "vault_confirmation_questions",
  "disclaimer"
]);

const VALID_SOURCE_MODES = new Set(["url", "text", "url_plus_text"]);
const VALID_EVIDENCE_MODES = new Set([
  "QUOTE",
  "ABSENCE",
  "INFERENCE_FROM_ADMITTED_EVIDENCE",
  "LIMITATION",
  "OTHER"
]);
const VALID_SEVERITIES = new Set(["INFO", "WARNING", "ERROR"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function asObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function asString(value, fallback = "") {
  if (value === undefined || value === null) return fallback;
  const text = String(value).trim();
  return text || fallback;
}

function normalizeEvidenceMode(value) {
  const normalized = asString(value, "INFERENCE_FROM_ADMITTED_EVIDENCE").toUpperCase();
  return VALID_EVIDENCE_MODES.has(normalized) ? normalized : "INFERENCE_FROM_ADMITTED_EVIDENCE";
}

function normalizeSeverity(value) {
  const normalized = asString(value, "INFO").toUpperCase();
  return VALID_SEVERITIES.has(normalized) ? normalized : "INFO";
}

function normalizeAuditEntry(entry = {}) {
  return {
    ...asObject(entry),
    entry_type: asString(entry.entry_type || "COMPILER_WARNING"),
    message: asString(entry.message || "Compiler audit entry."),
    severity: normalizeSeverity(entry.severity)
  };
}

function guardFindings(output) {
  output.findings = asArray(output.findings).map((finding) => ({
    ...finding,
    evidence: {
      ...asObject(finding.evidence),
      evidence_mode: normalizeEvidenceMode(finding.evidence?.evidence_mode)
    },
    status: "TRIGGERED"
  }));

  output.threat_findings = asArray(output.threat_findings).map((finding) => ({
    ...finding,
    status: "TRIGGERED"
  }));
}

function guardAudit(output) {
  output.technical_audit_log = asArray(output.technical_audit_log).map(normalizeAuditEntry);

  const forensic = output.report_data?.full_forensic_record;
  if (forensic && typeof forensic === "object") {
    forensic.technical_audit_log = output.technical_audit_log;
  }
}

function guardAssemblyRoute(output) {
  output.assembly_route = {
    ...asObject(output.assembly_route),
    local_counsel_review_required: output.assembly_route?.local_counsel_review_required === false ? false : true,
    vault_confirmation_question_count: asArray(output.vault_confirmation_questions).length
  };

  const forensic = output.report_data?.full_forensic_record;
  if (forensic && typeof forensic === "object") {
    forensic.assembly_route = output.assembly_route;
  }
}

function guardSourceMode(output, input) {
  const requested = asString(output.diligence_run?.source_mode || input?.source_mode || "text");
  output.diligence_run = {
    ...asObject(output.diligence_run),
    source_mode: VALID_SOURCE_MODES.has(requested) ? requested : "text"
  };
}

function stripTopLevel(output) {
  return TOP_LEVEL_KEYS.reduce((acc, key) => {
    acc[key] = output[key];
    return acc;
  }, {});
}

export function normalizeFinalCompilerForSchema(modelOutput = {}, input = {}) {
  const output = normalizeFinalCompilerOutput(modelOutput, input);

  guardSourceMode(output, input);
  guardFindings(output);
  guardAudit(output);
  guardAssemblyRoute(output);

  return stripTopLevel(output);
}
