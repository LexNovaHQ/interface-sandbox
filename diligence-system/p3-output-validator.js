const REQUIRED_TOP_LEVEL = [
  "target_feature_profile",
  "feature_profile_forensic_ledger",
  "feature_function_trace"
];

const FORBIDDEN_TOP_LEVEL = [
  "legal_cartography_index",
  "target_data_provenance_profile",
  "target_exposure_profile",
  "registry_ledger",
  "final_output_handoff",
  "final_report",
  "html_report"
];

const LEGAL_RE = /\b(legal_cartography|legal advice|compliance verdict|compliant|non-compliant|violates|lawful|unlawful)\b/i;
const REGISTRY_ROUTING_RE = /\b(registry|registry row|registry_key_detection_test|registry_evaluation|registry row truth)\b/i;
const DATA_PROVENANCE_RE = /\b(data_provenance|training data|retention analysis|privacy compliance)\b/i;
const NEW_FETCH_RE = /\b(new\s+(fetch|search|browse|crawl)|performed\s+(a\s+)?(search|browse|fetch)|google\s+search|grounding\s+used)\b/i;
const NON_REFERENCE_OBJECT_LABELS = new Set([
  "source_discovery_handoff",
  "hybrid_extraction_manifest",
  "target_profile",
  "target_profile_forensic_ledger",
  "target_profile_trace",
  "feature_profile_forensic_ledger",
  "feature_function_trace"
]);

export function validateP3Output({
  p3Output,
  targetProfile,
  sourceDiscoveryHandoff,
  hybridExtractionManifest,
  targetProfileForensicLedger,
  targetProfileTrace
} = {}) {
  const errors = [];
  const warnings = [];
  const output = objectOrNull(p3Output) || {};

  if (!objectOrNull(p3Output)) errors.push("P3_OUTPUT_OBJECT_MISSING");
  for (const key of REQUIRED_TOP_LEVEL) {
    if (!(key in output)) errors.push(`P3_REQUIRED_TOP_LEVEL_MISSING:${key}`);
  }
  for (const key of FORBIDDEN_TOP_LEVEL) {
    if (key in output) errors.push(`P3_FORBIDDEN_TOP_LEVEL_PRESENT:${key}`);
  }

  const featureProfile = objectOrNull(output.target_feature_profile);
  const ledger = objectOrNull(output.feature_profile_forensic_ledger);
  const trace = output.feature_function_trace;
  if (!featureProfile) errors.push("P3_TARGET_FEATURE_PROFILE_OBJECT_MISSING");
  if (!ledger) errors.push("P3_FEATURE_PROFILE_FORENSIC_LEDGER_OBJECT_MISSING");
  if (!trace || (typeof trace !== "object" && !Array.isArray(trace))) errors.push("P3_FEATURE_FUNCTION_TRACE_OBJECT_OR_ARRAY_MISSING");

  const outputText = compactJson(output);
  const registryCheck = checkRegistrySubstance(output);
  if (registryCheck.assignsRegistryRowStatus) errors.push("P3_ASSIGNES_REGISTRY_ROW_STATUS");
  if (registryCheck.routingSignalPresent && !registryCheck.assignsRegistryRowStatus) {
    warnings.push("P3_REGISTRY_ROUTING_SIGNAL_PRESENT_NOT_ROW_EVALUATION");
  }
  if (LEGAL_RE.test(outputText)) errors.push("P3_PERFORMS_LEGAL_CARTOGRAPHY_OR_VERDICT");
  if (DATA_PROVENANCE_RE.test(outputText)) errors.push("P3_PERFORMS_DATA_PROVENANCE_FINAL_ANALYSIS");
  if (NEW_FETCH_RE.test(outputText)) errors.push("P3_CLAIMS_NEW_FETCH_SEARCH_OR_BROWSE");

  const featureStats = summarizeFeatures(featureProfile);
  if (!featureStats.feature_count) errors.push("P3_FEATURE_FUNCTION_RECORDS_MISSING");
  if (featureStats.product_wrapper_count >= featureStats.feature_count && !featureStats.function_signal_count) {
    errors.push("P3_PRODUCT_WRAPPER_USED_WITHOUT_FUNCTION_ATOMICITY");
  }

  const evidenceRefCheck = checkEvidenceRefs(output, {
    sourceDiscoveryHandoff,
    hybridExtractionManifest,
    targetProfile,
    targetProfileForensicLedger,
    targetProfileTrace
  });
  if (!evidenceRefCheck.ok) errors.push(...evidenceRefCheck.errors);
  if (!targetProfile || typeof targetProfile !== "object") warnings.push("P3_TARGET_PROFILE_INPUT_MISSING_OR_NON_OBJECT");
  if (!featureStats.feature_inventory_named) warnings.push("P3_FEATURE_INVENTORY_EQUIVALENT_STRUCTURE_USED");

  const summary = {
    target_feature_profile_present: Boolean(featureProfile),
    forensic_ledger_present: Boolean(ledger),
    trace_present: Boolean(trace && typeof trace === "object"),
    feature_count: featureStats.feature_count,
    product_wrapper_count: featureStats.product_wrapper_count,
    archetype_signal_count: featureStats.archetype_signal_count,
    surface_signal_count: featureStats.surface_signal_count,
    limitation_count: countByKey(featureProfile, /limitation|unknown|missing/i),
    evidence_ref_check: evidenceRefCheck.summary
  };

  return { ok: errors.length === 0, errors, warnings, summary };
}

export function summarizeP3Output(input = {}) {
  return validateP3Output(input).summary;
}

function objectOrNull(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function compactJson(value) {
  try { return JSON.stringify(value || {}); } catch { return String(value || ""); }
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function unwrapManifest(manifest) {
  return manifest?.hybrid_extraction_manifest || manifest || {};
}

function summarizeFeatures(value) {
  let featureCount = 0;
  let productWrapperCount = 0;
  let archetypeSignalCount = 0;
  let surfaceSignalCount = 0;
  let functionSignalCount = 0;
  let featureInventoryNamed = false;
  walk(value, (key, child) => {
    if (/feature_inventory|features|functions/i.test(key) && Array.isArray(child)) {
      featureInventoryNamed = /feature_inventory/i.test(key) || featureInventoryNamed;
      featureCount += child.length;
    }
    if (/product_wrapper/i.test(key) && child) productWrapperCount += 1;
    if (/archetypes?/i.test(key) && child) archetypeSignalCount += Array.isArray(child) ? child.length : 1;
    if (/surfaces?/i.test(key) && child) surfaceSignalCount += Array.isArray(child) ? child.length : 1;
    if (/(function_behavior|feature_name|system_action|output_or_result)/i.test(key) && child) functionSignalCount += 1;
  });
  return { feature_count: featureCount, product_wrapper_count: productWrapperCount, archetype_signal_count: archetypeSignalCount, surface_signal_count: surfaceSignalCount, function_signal_count: functionSignalCount, feature_inventory_named: featureInventoryNamed };
}

function checkEvidenceRefs(output, inputs = {}) {
  const allowed = collectAllowedRefs(inputs);
  const refs = collectReferenceTokens(output);
  const unresolved = Array.from(refs).filter((ref) => !allowed.has(String(ref)));
  return {
    ok: unresolved.length === 0,
    errors: unresolved.map((ref) => `P3_EVIDENCE_REF_UNRESOLVED:${ref}`),
    summary: { checked_ref_count: refs.size, unresolved_ref_count: unresolved.length, unresolved_refs: unresolved.slice(0, 10) }
  };
}

function collectAllowedRefs({
  sourceDiscoveryHandoff,
  hybridExtractionManifest,
  targetProfile,
  targetProfileForensicLedger,
  targetProfileTrace
} = {}) {
  const root = unwrapManifest(hybridExtractionManifest);
  const allowed = new Set();
  for (const candidate of arr(root.candidate_sources)) {
    if (candidate.candidate_source_id) allowed.add(String(candidate.candidate_source_id));
    if (candidate.lossless_artifact_ref) allowed.add(String(candidate.lossless_artifact_ref));
  }
  for (const artifact of arr(root.lossless_text_artifacts)) {
    if (artifact.lossless_artifact_id) allowed.add(String(artifact.lossless_artifact_id));
    if (artifact.candidate_source_id) allowed.add(String(artifact.candidate_source_id));
  }
  for (const input of [
    sourceDiscoveryHandoff,
    targetProfile,
    targetProfileForensicLedger,
    targetProfileTrace
  ]) {
    for (const token of collectReferenceTokens(input)) allowed.add(token);
  }
  return allowed;
}

function collectReferenceTokens(value) {
  const tokens = new Set();
  walk(value, (key, child) => {
    if (isReferenceKey(key)) collectReferenceValue(child, tokens);
    if (typeof child === "string" && isIdLikeReference(child)) tokens.add(child);
  });
  return tokens;
}

function collectReferenceValue(value, tokens) {
  if (typeof value === "string") {
    tokens.add(value);
    return;
  }
  if (Array.isArray(value)) {
    for (const entry of value) collectReferenceValue(entry, tokens);
  }
}

function isReferenceKey(key = "") {
  return /^(evidence_ref|evidence_refs|source_ref|source_refs|source_id|source_ids|candidate_source_id|candidate_source_ids|lossless_artifact_ref|lossless_artifact_refs|artifact_ref|artifact_refs|primary_evidence_refs|secondary_evidence_refs)$/i.test(key);
}

function isIdLikeReference(value = "") {
  return !NON_REFERENCE_OBJECT_LABELS.has(value) && /^(ev_|src_|cand_|lossless_|artifact_|source_|doc_)/i.test(value);
}

function checkRegistrySubstance(output) {
  let assignsRegistryRowStatus = false;
  let routingSignalPresent = false;
  const controlledVerdictValues = new Set([
    "APPLICABLE",
    "NOT_APPLICABLE",
    "INSUFFICIENT_EVIDENCE",
    "CONTROL_PRESENT",
    "CONTROL_MISSING",
    "RISK_CONFIRMED"
  ]);
  const forbiddenKeys = /^(registry_row_status|threat_status|registry_evaluation_results|registry_row_evaluations|exposure_findings|remediation_map)$/i;

  walk(output, (key, child, path = []) => {
    const pathText = [...path, key].filter(Boolean).join(".");
    const keyText = String(key || "");
    const parentText = path.filter(Boolean).join(".");
    if (REGISTRY_ROUTING_RE.test(keyText) || (typeof child === "string" && REGISTRY_ROUTING_RE.test(child))) {
      routingSignalPresent = true;
    }
    if (forbiddenKeys.test(keyText)) {
      assignsRegistryRowStatus = true;
    }
    if (/^row_status$/i.test(keyText) && /\b(registry|threat)\b/i.test(parentText)) {
      assignsRegistryRowStatus = true;
    }
    if (/^threat_id$/i.test(keyText) && hasStatusEvaluationSibling(path, output)) {
      assignsRegistryRowStatus = true;
    }
    if (typeof child === "string" && isRegistryVerdictValue(child, controlledVerdictValues, keyText, parentText)) {
      assignsRegistryRowStatus = true;
    }
  });

  return { assignsRegistryRowStatus, routingSignalPresent };
}

function isRegistryVerdictValue(value, controlledVerdictValues, keyText, parentText) {
  const normalized = value.trim().toUpperCase();
  if (controlledVerdictValues.has(normalized) && /\b(registry|row|threat|control|risk|exposure|status|verdict|finding)\b/i.test(`${keyText}.${parentText}`)) {
    return true;
  }
  if (/^(PASS|FAIL)$/i.test(value.trim()) && /\b(registry|row|threat)\b/i.test(`${keyText}.${parentText}`) && !/forbidden_scope_checks\.registry_evaluation$/i.test(`${parentText}.${keyText}`)) {
    return true;
  }
  return false;
}

function hasStatusEvaluationSibling(path, output) {
  const parent = getAtPath(output, path);
  if (!objectOrNull(parent)) return false;
  return Object.keys(parent).some((key) => /(status|verdict|evaluation|finding)$/i.test(key));
}

function getAtPath(value, path = []) {
  let current = value;
  for (const key of path) {
    if (!current || typeof current !== "object") return undefined;
    current = current[key];
  }
  return current;
}

function countByKey(value, pattern) {
  let count = 0;
  walk(value, (key, child) => {
    if (pattern.test(key)) count += Array.isArray(child) ? child.length : child ? 1 : 0;
  });
  return count;
}

function walk(value, visit, key = "", path = []) {
  visit(key, value, path);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((child, index) => walk(child, visit, String(index), [...path, key].filter(Boolean)));
  for (const [childKey, child] of Object.entries(value)) walk(child, visit, childKey, [...path, key].filter(Boolean));
}
