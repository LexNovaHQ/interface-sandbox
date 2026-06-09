const FINAL_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);
const GATE_RESULTS = new Set(["PASS", "FAIL", "NOT_REQUIRED", "INSUFFICIENT"]);
const TRUE_BASIS_PREFIXES = ["TRUE_EVIDENCE:", "TRUE_ABSENCE:", "TRUE_FEATURE_MAP:", "TRUE_LEGAL_STACK:"];
const FALSE_BASIS_PREFIXES = ["FALSE_NOT_SATISFIED:", "FALSE_NOT_APPLICABLE:", "FALSE_INSUFFICIENT:"];
const ALLOWED_GLOBAL_REFS = new Set(["GLOBAL", "MULTI", "UNKNOWN"]);
const FORBIDDEN_KEYS = new Set([
  "source_bundle", "target_feature_profile", "legal_stack_review", "operator_challenge_gate", "high_risk_checks", "reopened_rows", "findings", "controlled_rows", "insufficient_evidence_rows", "report_data", "vault_prefill_suggestions", "vault_confirmation_questions", "assembly_route", "technical_audit_log", "html", "registry_batch_evaluation"
]);
const LEGAL_ADVICE_PATTERNS = [/\billegal\b/i, /\bnon-compliant\b/i, /\bliable\b/i, /\bunenforceable\b/i, /confirmed violation/i, /certif(?:y|ies|ied) compliance/i, /make[s]? .* liable/i];

function push(errors, instancePath, message, params = {}) {
  errors.push({ keyword: "registry_ledger_guardrail", instancePath, schemaPath: "#/registryLedgerGuardrails", message, params });
}

function walk(value, errors, path = "") {
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((item, index) => walk(item, errors, `${path}/${index}`));
    return;
  }
  for (const [key, child] of Object.entries(value)) {
    const childPath = `${path}/${key}`;
    if (FORBIDDEN_KEYS.has(key)) push(errors, childPath, `forbidden key emitted: ${key}`, { key });
    if (typeof child === "string") for (const pattern of LEGAL_ADVICE_PATTERNS) if (pattern.test(child)) push(errors, childPath, "legal advice or liability/compliance conclusion emitted", { value: child });
    walk(child, errors, childPath);
  }
}

function rowThreatId(row, index) { return String(row?.Threat_ID || row?.threat_id || `MISSING_THREAT_ID_ROW_${index + 1}`).trim(); }
function rowThreatName(row) { return String(row?.Threat_Name || row?.threat_name || "Unnamed registry row").trim(); }
function nonEmpty(value) { return typeof value === "string" && value.trim().length > 0; }
function hasMismatchBasis(text) { return /lane|archetype|surface|categorical|scope|not applicable|requires/i.test(String(text || "")); }
function hasInsufficientBasis(text) { return /insufficient|missing|unavailable|thin|malformed|cannot be evaluated|unparseable|unclear/i.test(String(text || "")); }
function featureIds(input = {}) { return new Set((input?.target_feature_profile?.product_feature_map || []).map((feature) => feature?.feature_id).filter(Boolean)); }

export function validateRegistryLedgerGuardrails(output, { input = {} } = {}) {
  const errors = [];
  if (!output || typeof output !== "object" || Array.isArray(output)) {
    push(errors, "", "registry ledger output must be an object");
    return { ok: false, errors };
  }

  walk(output, errors, "");

  const rows = Array.isArray(input?.registry_rows) ? input.registry_rows : [];
  const ledger = Array.isArray(output.registry_evaluation_ledger) ? output.registry_evaluation_ledger : [];
  const meta = output.registry_batch_meta || {};
  const allowedFeatureIds = featureIds(input);

  const topKeys = Object.keys(output).sort();
  const expectedTopKeys = ["batch_warnings", "registry_batch_meta", "registry_evaluation_ledger"];
  if (JSON.stringify(topKeys) !== JSON.stringify(expectedTopKeys)) push(errors, "", "output must contain exactly registry_batch_meta, registry_evaluation_ledger, and batch_warnings", { topKeys });

  if (meta.registry_count_loaded !== rows.length) push(errors, "/registry_batch_meta/registry_count_loaded", "registry_count_loaded must equal supplied registry_rows.length", { expected: rows.length, actual: meta.registry_count_loaded });
  if (ledger.length !== rows.length) push(errors, "/registry_evaluation_ledger", "registry_evaluation_ledger length must equal supplied registry_rows.length", { expected: rows.length, actual: ledger.length });
  if (!Array.isArray(output.batch_warnings)) push(errors, "/batch_warnings", "batch_warnings must be an array");
  else output.batch_warnings.forEach((warning, index) => { if (typeof warning !== "string") push(errors, `/batch_warnings/${index}`, "batch_warnings entries must be strings"); });

  ledger.forEach((entry, index) => {
    const base = `/registry_evaluation_ledger/${index}`;
    const row = rows[index] || {};
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      push(errors, base, "ledger entry must be an object");
      return;
    }

    if (entry.entry_number !== index + 1) push(errors, `${base}/entry_number`, "entry_number must be sequential within supplied batch", { expected: index + 1, actual: entry.entry_number });
    const expectedThreatId = rowThreatId(row, index);
    if (entry.threat_id !== expectedThreatId) push(errors, `${base}/threat_id`, "threat_id must preserve supplied row Threat_ID or placeholder", { expected: expectedThreatId, actual: entry.threat_id });
    if (!nonEmpty(entry.threat_name)) push(errors, `${base}/threat_name`, "threat_name must be non-empty");
    if (rowThreatName(row) && rowThreatName(row) !== "Unnamed registry row" && entry.threat_name !== rowThreatName(row)) push(errors, `${base}/threat_name`, "threat_name should preserve supplied row Threat_Name", { expected: rowThreatName(row), actual: entry.threat_name });

    if (!GATE_RESULTS.has(entry.archetype_gate)) push(errors, `${base}/archetype_gate`, "archetype_gate must use closed gate vocabulary", { actual: entry.archetype_gate });
    if (!GATE_RESULTS.has(entry.surface_gate)) push(errors, `${base}/surface_gate`, "surface_gate must use closed gate vocabulary", { actual: entry.surface_gate });
    if (!nonEmpty(entry.authority_relevance)) push(errors, `${base}/authority_relevance`, "authority_relevance must be non-empty");

    const conditions = Array.isArray(entry.conditions) ? entry.conditions : [];
    if (!Array.isArray(entry.conditions)) push(errors, `${base}/conditions`, "conditions must be an array");
    conditions.forEach((condition, cIndex) => {
      const cBase = `${base}/conditions/${cIndex}`;
      if (!condition || typeof condition !== "object" || Array.isArray(condition)) {
        push(errors, cBase, "condition must be an object");
        return;
      }
      if (!nonEmpty(condition.condition_id)) push(errors, `${cBase}/condition_id`, "condition_id must be non-empty");
      if (typeof condition.result !== "boolean") push(errors, `${cBase}/result`, "condition.result must be boolean");
      if (!nonEmpty(condition.basis)) push(errors, `${cBase}/basis`, "condition.basis must be non-empty");
      const basis = String(condition.basis || "");
      const goodPrefix = condition.result ? TRUE_BASIS_PREFIXES.some((prefix) => basis.startsWith(prefix)) : FALSE_BASIS_PREFIXES.some((prefix) => basis.startsWith(prefix));
      if (!goodPrefix) push(errors, `${cBase}/basis`, "condition.basis must start with the required TRUE_/FALSE_ diagnostic prefix", { basis });
    });

    if (typeof entry.trigger_if_result !== "boolean") push(errors, `${base}/trigger_if_result`, "trigger_if_result must be boolean");
    if (typeof entry.exclude_if_result !== "boolean") push(errors, `${base}/exclude_if_result`, "exclude_if_result must be boolean");
    if (!FINAL_STATUSES.has(entry.final_status)) push(errors, `${base}/final_status`, "final_status must use closed status vocabulary", { actual: entry.final_status });
    if (!Array.isArray(entry.feature_refs)) push(errors, `${base}/feature_refs`, "feature_refs must be an array");
    else entry.feature_refs.forEach((ref, rIndex) => { if (!allowedFeatureIds.has(ref) && !ALLOWED_GLOBAL_REFS.has(ref)) push(errors, `${base}/feature_refs/${rIndex}`, "feature_ref must be a Stage 5 feature_id, GLOBAL, MULTI, or UNKNOWN", { ref }); });
    if (!nonEmpty(entry.evidence_ref)) push(errors, `${base}/evidence_ref`, "evidence_ref must be non-empty");
    if (String(entry.evidence_ref || "").includes("/")) push(errors, `${base}/evidence_ref`, "evidence_ref must not combine multiple sources with slash");
    if (!nonEmpty(entry.reasoning_summary)) push(errors, `${base}/reasoning_summary`, "reasoning_summary must be non-empty");

    if (entry.final_status === "TRIGGERED" && !(entry.trigger_if_result === true && entry.exclude_if_result === false)) push(errors, `${base}/final_status`, "TRIGGERED requires trigger_if_result=true and exclude_if_result=false");
    if (entry.final_status === "CONTROLLED" && !(entry.trigger_if_result === true && entry.exclude_if_result === true)) push(errors, `${base}/final_status`, "CONTROLLED requires trigger_if_result=true and exclude_if_result=true");
    if (entry.final_status === "NOT_TRIGGERED" && entry.trigger_if_result !== false) push(errors, `${base}/final_status`, "NOT_TRIGGERED requires trigger_if_result=false");
    if (entry.final_status === "NOT_APPLICABLE" && !hasMismatchBasis(`${entry.reasoning_summary} ${conditions.map((c) => c.basis).join(" ")}`)) push(errors, `${base}/reasoning_summary`, "NOT_APPLICABLE requires explicit lane/archetype/surface/categorical mismatch reasoning");
    if (entry.final_status === "INSUFFICIENT_EVIDENCE" && !hasInsufficientBasis(`${entry.reasoning_summary} ${conditions.map((c) => c.basis).join(" ")}`)) push(errors, `${base}/reasoning_summary`, "INSUFFICIENT_EVIDENCE requires explicit insufficient/missing/malformed evidence reasoning");
    if (entry.archetype_gate === "FAIL" && entry.final_status !== "NOT_APPLICABLE") push(errors, `${base}/final_status`, "archetype_gate=FAIL should produce NOT_APPLICABLE unless schema/runtime is explicitly extended", { final_status: entry.final_status });
    if (entry.surface_gate === "FAIL" && entry.final_status !== "NOT_APPLICABLE") push(errors, `${base}/final_status`, "surface_gate=FAIL should produce NOT_APPLICABLE unless schema/runtime is explicitly extended", { final_status: entry.final_status });
    const rowArchetype = String(row?.Archetype || row?.archetype || "").trim();
    if (rowArchetype === "UNI" && entry.final_status === "NOT_APPLICABLE" && /archetype/i.test(entry.reasoning_summary || "")) push(errors, `${base}/final_status`, "UNI rows must not be NOT_APPLICABLE merely because of archetype mismatch");
  });

  return { ok: errors.length === 0, errors };
}
