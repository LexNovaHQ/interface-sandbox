const REQUIRED_TOP_LEVEL = [
  "target_profile",
  "target_profile_forensic_ledger",
  "target_profile_trace"
];

const FORBIDDEN_TOP_LEVEL = [
  "target_feature_profile",
  "legal_cartography_index",
  "target_data_provenance_profile",
  "target_exposure_profile",
  "registry_ledger",
  "final_output_handoff",
  "final_report",
  "html_report"
];

const FORBIDDEN_DOWNSTREAM_KEYS = new Set([
  "legal_cartography_index",
  "legal_unit_map",
  "legal_control_map",
  "clause_map",
  "control_family_map",
  "enforceability_verdict",
  "compliance_verdict",
  "legal_advice",
  "registry_ledger",
  "target_exposure_profile",
  "final_output_handoff"
]);

const FEATURE_RE = /\b(feature_inventory|feature_id|feature_name|function_behavior|archetypes?|surfaces?|target_feature_profile)\b/i;
const LEGAL_VERDICT_RE = /\b(legal advice|compliance verdict|enforceability verdict)\b/i;
const LEGAL_ROUTING_HINT_RE = /\b(legal_cartography|governing_law|courts_or_venue|compliance|legal details|legal_name)\b/i;
const REGISTRY_RE = /\b(registry row|registry_ledger|threat id|row status|applicable|not_applicable)\b/i;
const NEW_FETCH_RE = /\b(new\s+(fetch|search|browse|crawl)|performed\s+(a\s+)?(search|browse|fetch)|google\s+search|grounding\s+used)\b/i;
const REFERENCE_FIELD_RE = /^(evidence_ref|evidence_refs|source_ref|source_refs|source_id|source_ids|candidate_source_id|candidate_source_ids|lossless_artifact_ref|lossless_artifact_refs|artifact_ref|artifact_refs|candidate_source_ref|candidate_source_refs|lossless_artifact_id|lossless_artifact_ids)$/i;
const TOKENISH_ID_RE = /^(ev_|src_|cand_|lossless_|artifact_|source_|doc_)/i;

export function validateP2Output({ p2Output, sourceDiscoveryHandoff, hybridExtractionManifest } = {}) {
  const errors = [];
  const warnings = [];
  const output = objectOrNull(p2Output) || {};

  if (!objectOrNull(p2Output)) errors.push("P2_OUTPUT_OBJECT_MISSING");
  for (const key of REQUIRED_TOP_LEVEL) {
    if (!(key in output)) errors.push(`P2_REQUIRED_TOP_LEVEL_MISSING:${key}`);
  }
  for (const key of FORBIDDEN_TOP_LEVEL) {
    if (key in output) errors.push(`P2_FORBIDDEN_TOP_LEVEL_PRESENT:${key}`);
  }

  const targetProfile = objectOrNull(output.target_profile);
  const ledger = objectOrNull(output.target_profile_forensic_ledger);
  const trace = output.target_profile_trace;
  if (!targetProfile) errors.push("P2_TARGET_PROFILE_OBJECT_MISSING");
  if (!ledger) errors.push("P2_TARGET_PROFILE_FORENSIC_LEDGER_OBJECT_MISSING");
  if (!trace || (typeof trace !== "object" && !Array.isArray(trace))) errors.push("P2_TARGET_PROFILE_TRACE_OBJECT_OR_ARRAY_MISSING");

  const profileText = compactJson(targetProfile);
  const outputText = compactJson(output);
  if (FEATURE_RE.test(profileText)) errors.push("P2_PERFORMS_FEATURE_OR_FUNCTION_DECOMPOSITION");
  if (containsForbiddenDownstreamKey(output) || LEGAL_VERDICT_RE.test(outputText)) {
    errors.push("P2_PERFORMS_LEGAL_CARTOGRAPHY_OR_VERDICT");
  } else if (LEGAL_ROUTING_HINT_RE.test(outputText)) {
    warnings.push("P2_LEGAL_ROUTING_HINT_PRESENT_NOT_CARTOGRAPHY");
  }
  if (REGISTRY_RE.test(outputText)) errors.push("P2_ASSIGNES_REGISTRY_ROW_STATUS");
  if (NEW_FETCH_RE.test(outputText)) errors.push("P2_CLAIMS_NEW_FETCH_SEARCH_OR_BROWSE");

  const evidenceRefCheck = checkEvidenceRefs(output, sourceDiscoveryHandoff, hybridExtractionManifest);
  if (!evidenceRefCheck.ok) errors.push(...evidenceRefCheck.errors);

  const limitationCount = countByKey(targetProfile, /limitation|unknown|missing/i);
  if (!limitationCount) warnings.push("P2_LIMITATIONS_OR_UNKNOWNS_NOT_EXPLICIT");

  const summary = {
    target_profile_present: Boolean(targetProfile),
    forensic_ledger_present: Boolean(ledger),
    trace_present: Boolean(trace && typeof trace === "object"),
    company_identity_present: hasAnyKey(targetProfile, /company|target|name|identity/i),
    product_family_count: countProductFamilies(targetProfile),
    limitation_count: limitationCount,
    evidence_ref_check: evidenceRefCheck.summary
  };

  return { ok: errors.length === 0, errors, warnings, summary };
}

export function summarizeP2Output(input = {}) {
  return validateP2Output(input).summary;
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

function checkEvidenceRefs(output, sourceDiscoveryHandoff, manifest) {
  const allowed = collectAllowedRefs(sourceDiscoveryHandoff, manifest);
  const refs = collectReferenceTokens(output);
  const unresolved = Array.from(refs).filter((ref) => !allowed.has(String(ref)));
  return {
    ok: unresolved.length === 0,
    errors: unresolved.map((ref) => `P2_EVIDENCE_REF_UNRESOLVED:${ref}`),
    summary: { checked_ref_count: refs.size, unresolved_ref_count: unresolved.length, unresolved_refs: unresolved.slice(0, 10) }
  };
}

function collectAllowedRefs(sourceDiscoveryHandoff, manifest) {
  const root = unwrapManifest(manifest);
  const allowed = new Set();
  for (const ref of collectReferenceTokens(root)) allowed.add(ref);
  for (const ref of collectReferenceTokens(sourceDiscoveryHandoff)) allowed.add(ref);
  for (const candidate of arr(root.candidate_sources)) {
    if (candidate.candidate_source_id) allowed.add(String(candidate.candidate_source_id));
    if (candidate.lossless_artifact_ref) allowed.add(String(candidate.lossless_artifact_ref));
  }
  for (const artifact of arr(root.lossless_text_artifacts)) {
    if (artifact.lossless_artifact_id) allowed.add(String(artifact.lossless_artifact_id));
    if (artifact.candidate_source_id) allowed.add(String(artifact.candidate_source_id));
  }
  return allowed;
}

export function collectReferenceTokens(value) {
  const refs = new Set();
  walk(value, (key, child) => {
    if ((/^evidence_map$/i.test(key) || /^source_map$/i.test(key)) && objectOrNull(child)) {
      for (const mapKey of Object.keys(child)) refs.add(String(mapKey));
    }
    if (REFERENCE_FIELD_RE.test(key)) addReferenceValue(refs, child);
    if (/^id$/i.test(key) || /_id$/i.test(key)) addTokenishId(refs, child);
  });
  return refs;
}

function addReferenceValue(refs, value) {
  if (typeof value === "string") {
    refs.add(value);
    return;
  }
  if (!Array.isArray(value)) return;
  for (const entry of value) {
    if (typeof entry === "string") refs.add(entry);
  }
}

function addTokenishId(refs, value) {
  if (typeof value !== "string") return;
  if (TOKENISH_ID_RE.test(value)) refs.add(value);
}

function containsForbiddenDownstreamKey(value) {
  let found = false;
  walk(value, (key) => {
    if (FORBIDDEN_DOWNSTREAM_KEYS.has(key)) found = true;
  });
  return found;
}

function countProductFamilies(value) {
  let count = 0;
  walk(value, (key, child) => {
    if (/product_famil/i.test(key) && Array.isArray(child)) count += child.length;
  });
  return count;
}

function countByKey(value, pattern) {
  let count = 0;
  walk(value, (key, child) => {
    if (pattern.test(key)) count += Array.isArray(child) ? child.length : child ? 1 : 0;
  });
  return count;
}

function hasAnyKey(value, pattern) {
  let found = false;
  walk(value, (key, child) => {
    if (pattern.test(key) && child !== null && child !== undefined && child !== "") found = true;
  });
  return found;
}

function walk(value, visit, key = "") {
  visit(key, value);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) return value.forEach((child, index) => walk(child, visit, String(index)));
  for (const [childKey, child] of Object.entries(value)) walk(child, visit, childKey);
}
