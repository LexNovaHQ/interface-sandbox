const ALLOWED_ARCHETYPE_CODES = new Set(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const ARCHETYPE_LABELS = Object.freeze({
  UNI: "Universal",
  DOE: "The Doer",
  JDG: "The Judge",
  CMP: "The Companion",
  CRT: "The Creator",
  RDR: "The Reader",
  ORC: "The Orchestrator",
  TRN: "The Translator",
  SHD: "The Shield",
  OPT: "The Optimizer",
  MOV: "The Mover"
});
const ALLOWED_SURFACE_TOKENS = new Set([
  "Consumer-Public",
  "Enterprise-Private",
  "PII",
  "Employment",
  "Sensitive/Biometric",
  "Financial",
  "Content&IP",
  "Safety&Physical",
  "Infrastructure",
  "Minors"
]);
const FORBIDDEN_KEYS = new Set([
  "legal_stack_review",
  "document_stack_redline",
  "legal_stack_assessment",
  "registry_ledger",
  "registry_evaluation",
  "final_status",
  "controlled_rows",
  "insufficient_evidence_rows",
  "operator_challenge",
  "report_data",
  "technical_audit_log",
  "assembly_route",
  "vault_confirmation_questions",
  "vault_prefill_suggestions",
  "vault_payload",
  "html"
]);
const FORBIDDEN_THREAT_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);

function push(errors, instancePath, message, params = {}) {
  errors.push({
    keyword: "target_feature_profile_guardrail",
    instancePath,
    schemaPath: "#/targetFeatureProfileGuardrails",
    message,
    params
  });
}

function walkKeys(value, errors, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walkKeys(item, errors, `${path}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (FORBIDDEN_KEYS.has(key)) push(errors, childPath, `forbidden key emitted: ${key}`, { key });
    if (typeof child === "string" && FORBIDDEN_THREAT_STATUSES.has(child.trim())) {
      push(errors, childPath, `forbidden registry status emitted: ${child}`, { value: child });
    }
    walkKeys(child, errors, childPath);
  }
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function validateTargetFeatureProfileGuardrails(profile, { threatMappingSupplied = false } = {}) {
  const errors = [];
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
    push(errors, "", "target_feature_profile must be an object");
    return { ok: false, errors };
  }

  walkKeys(profile, errors, "");

  const features = Array.isArray(profile.product_feature_map) ? profile.product_feature_map : [];
  const seenIds = new Set();

  features.forEach((feature, index) => {
    const base = `/product_feature_map/${index}`;
    if (!feature || typeof feature !== "object" || Array.isArray(feature)) {
      push(errors, base, "feature must be an object");
      return;
    }

    if (!nonEmptyString(feature.feature_id)) {
      push(errors, `${base}/feature_id`, "feature_id must be non-empty");
    } else if (seenIds.has(feature.feature_id)) {
      push(errors, `${base}/feature_id`, "feature_id must be unique", { feature_id: feature.feature_id });
    } else {
      seenIds.add(feature.feature_id);
    }

    if (!["CORE", "SECONDARY"].includes(feature.feature_role)) {
      push(errors, `${base}/feature_role`, "feature_role must be CORE or SECONDARY", { feature_role: feature.feature_role });
    }

    if (!nonEmptyString(feature.feature_description)) push(errors, `${base}/feature_description`, "feature_description must be non-empty");
    if (!nonEmptyString(feature.evidence_quote)) push(errors, `${base}/evidence_quote`, "evidence_quote must be non-empty for every final feature");
    if (!nonEmptyString(feature.feature_source_url)) push(errors, `${base}/feature_source_url`, "feature_source_url must be non-empty for every final feature");

    const codes = Array.isArray(feature.archetype_codes) ? feature.archetype_codes : [];
    const labels = Array.isArray(feature.archetype_labels) ? feature.archetype_labels : [];
    for (const code of codes) {
      if (!ALLOWED_ARCHETYPE_CODES.has(code)) push(errors, `${base}/archetype_codes`, `invalid archetype code: ${code}`, { code });
    }
    const expectedLabels = codes.filter((code) => ALLOWED_ARCHETYPE_CODES.has(code)).map((code) => ARCHETYPE_LABELS[code]);
    for (const expected of expectedLabels) {
      if (!labels.includes(expected)) push(errors, `${base}/archetype_labels`, `missing archetype label for code: ${expected}`, { expected });
    }

    const surfaces = Array.isArray(feature.surface_tokens) ? feature.surface_tokens : [];
    for (const token of surfaces) {
      if (!ALLOWED_SURFACE_TOKENS.has(token)) push(errors, `${base}/surface_tokens`, `invalid surface token: ${token}`, { token });
    }

    const threats = Array.isArray(feature.linked_threat_ids) ? feature.linked_threat_ids : [];
    if (!threatMappingSupplied && threats.length > 0) {
      push(errors, `${base}/linked_threat_ids`, "linked_threat_ids must be empty unless explicit threat mapping context was supplied", { linked_threat_ids: threats });
    }
  });

  return { ok: errors.length === 0, errors };
}
