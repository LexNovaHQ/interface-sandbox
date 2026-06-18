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
const REGISTRY_RE = /\b(registry row|registry_ledger|threat id|row status|applicable|not_applicable)\b/i;
const DATA_PROVENANCE_RE = /\b(data_provenance|training data|retention analysis|privacy compliance)\b/i;
const NEW_FETCH_RE = /\b(new\s+(fetch|search|browse|crawl)|performed\s+(a\s+)?(search|browse|fetch)|google\s+search|grounding\s+used)\b/i;

export function validateP3Output({ p3Output, targetProfile, sourceDiscoveryHandoff, hybridExtractionManifest } = {}) {
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
  if (REGISTRY_RE.test(outputText)) errors.push("P3_ASSIGNES_REGISTRY_ROW_STATUS");
  if (LEGAL_RE.test(outputText)) errors.push("P3_PERFORMS_LEGAL_CARTOGRAPHY_OR_VERDICT");
  if (DATA_PROVENANCE_RE.test(outputText)) errors.push("P3_PERFORMS_DATA_PROVENANCE_FINAL_ANALYSIS");
  if (NEW_FETCH_RE.test(outputText)) errors.push("P3_CLAIMS_NEW_FETCH_SEARCH_OR_BROWSE");

  const featureStats = summarizeFeatures(featureProfile);
  if (!featureStats.feature_count) errors.push("P3_FEATURE_FUNCTION_RECORDS_MISSING");
  if (featureStats.product_wrapper_count >= featureStats.feature_count && !featureStats.function_signal_count) {
    errors.push("P3_PRODUCT_WRAPPER_USED_WITHOUT_FUNCTION_ATOMICITY");
  }

  const evidenceRefCheck = checkEvidenceRefs(output, sourceDiscoveryHandoff, hybridExtractionManifest);
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

function checkEvidenceRefs(output, sourceDiscoveryHandoff, manifest) {
  const allowed = collectAllowedRefs(sourceDiscoveryHandoff, manifest);
  const refs = new Set();
  walk(output, (key, child) => {
    if (/(candidate_source_id|candidate_source_ref|lossless_artifact_id|lossless_artifact_ref|evidence_ref|source_ref)$/i.test(key) && typeof child === "string") refs.add(child);
    if (/evidence_refs?$/i.test(key) && Array.isArray(child)) child.filter((entry) => typeof entry === "string").forEach((entry) => refs.add(entry));
  });
  const unresolved = Array.from(refs).filter((ref) => !allowed.has(String(ref)));
  return {
    ok: unresolved.length === 0,
    errors: unresolved.map((ref) => `P3_EVIDENCE_REF_UNRESOLVED:${ref}`),
    summary: { checked_ref_count: refs.size, unresolved_ref_count: unresolved.length, unresolved_refs: unresolved.slice(0, 10) }
  };
}

function collectAllowedRefs(sourceDiscoveryHandoff, manifest) {
  const root = unwrapManifest(manifest);
  const allowed = new Set();
  for (const candidate of arr(root.candidate_sources)) {
    if (candidate.candidate_source_id) allowed.add(String(candidate.candidate_source_id));
    if (candidate.lossless_artifact_ref) allowed.add(String(candidate.lossless_artifact_ref));
  }
  for (const artifact of arr(root.lossless_text_artifacts)) {
    if (artifact.lossless_artifact_id) allowed.add(String(artifact.lossless_artifact_id));
    if (artifact.candidate_source_id) allowed.add(String(artifact.candidate_source_id));
  }
  walk(sourceDiscoveryHandoff, (key, child) => {
    if (/(candidate_source_id|candidate_source_ref|lossless_artifact_id|lossless_artifact_ref|evidence_ref|source_ref)$/i.test(key) && typeof child === "string") allowed.add(child);
  });
  return allowed;
}

function countByKey(value, pattern) {
  let count = 0;
  walk(value, (key, child) => {
    if (pattern.test(key)) count += Array.isArray(child) ? child.length : child ? 1 : 0;
  });
  return count;
}

function walk(value, visit, key = "") {
  visit(key, value);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((child, index) => walk(child, visit, String(index)));
  for (const [childKey, child] of Object.entries(value)) walk(child, visit, childKey);
}
