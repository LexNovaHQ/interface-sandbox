const REQUIRED_TOP_LEVEL = [
  "source_discovery_handoff",
  "source_discovery_forensic_ledger",
  "source_discovery_trace"
];

const FORBIDDEN_TOP_LEVEL = [
  "target_profile",
  "target_feature_profile",
  "legal_cartography_index",
  "target_data_provenance_profile",
  "target_exposure_profile",
  "final_output_handoff",
  "evidence_box_final_report",
  "registry_ledger"
];

const FINAL_REPORT_RE = /\b(final report|integrated report|executive summary|html_report|vault_payload|vault_assembly_handoff)\b/i;
const NEW_FETCH_RE = /\b(new\s+(fetch|search|browse|crawl)|performed\s+(a\s+)?(search|browse|fetch)|google\s+search|grounding\s+used)\b/i;
const TARGET_PROFILE_RE = /\b(target_profile|company profile|product profile|feature profile|target feature)\b/i;
const REGISTRY_RE = /\b(registry row|registry_ledger|threat id|row status|applicable|not_applicable)\b/i;
const LEGAL_VERDICT_RE = /\b(legal advice|compliant|non-compliant|compliance verdict|violates|lawful|unlawful)\b/i;

export function validateP1Output({ p1Output, hybridExtractionManifest } = {}) {
  const errors = [];
  const warnings = [];

  if (!p1Output || typeof p1Output !== "object" || Array.isArray(p1Output)) {
    errors.push("P1_OUTPUT_OBJECT_MISSING");
  }

  const output = p1Output && typeof p1Output === "object" && !Array.isArray(p1Output) ? p1Output : {};

  for (const key of REQUIRED_TOP_LEVEL) {
    if (!(key in output)) errors.push(`P1_REQUIRED_TOP_LEVEL_MISSING:${key}`);
  }

  for (const key of FORBIDDEN_TOP_LEVEL) {
    if (key in output) errors.push(`P1_FORBIDDEN_TOP_LEVEL_PRESENT:${key}`);
  }

  const handoff = objectOrNull(output.source_discovery_handoff);
  const ledger = objectOrNull(output.source_discovery_forensic_ledger);
  const trace = output.source_discovery_trace;

  if (!handoff) errors.push("P1_SOURCE_DISCOVERY_HANDOFF_OBJECT_MISSING");
  if (!ledger) errors.push("P1_SOURCE_DISCOVERY_FORENSIC_LEDGER_OBJECT_MISSING");
  if (!trace || (typeof trace !== "object" && !Array.isArray(trace))) errors.push("P1_SOURCE_DISCOVERY_TRACE_OBJECT_OR_ARRAY_MISSING");

  const handoffText = compactJson(handoff);
  const outputText = compactJson(output);
  if (FINAL_REPORT_RE.test(handoffText)) errors.push("P1_HANDOFF_CONTAINS_FINAL_REPORT_PROSE");
  if (NEW_FETCH_RE.test(outputText)) errors.push("P1_CLAIMS_NEW_FETCH_SEARCH_OR_BROWSE");
  if (TARGET_PROFILE_RE.test(outputText)) errors.push("P1_CREATES_TARGET_PROFILE_CONCLUSIONS");
  if (REGISTRY_RE.test(outputText)) errors.push("P1_ASSIGNES_REGISTRY_ROW_STATUS");
  if (LEGAL_VERDICT_RE.test(outputText)) errors.push("P1_PRODUCES_LEGAL_ADVICE_OR_COMPLIANCE_VERDICT");

  const stage0Urls = collectStage0Urls(hybridExtractionManifest);
  const outputUrls = collectUrls(output);
  const foreignUrls = outputUrls.filter((url) => !stage0Urls.has(normalizeUrl(url)));
  if (foreignUrls.length) errors.push(`P1_MUTATES_OR_ADDS_SOURCE_URLS:${foreignUrls.slice(0, 5).join(",")}`);

  const treatment = summarizeTreatment(handoff || output);
  if (!treatment.hasTreatment) errors.push("P1_SOURCE_TREATMENT_STRUCTURE_MISSING");
  if (!treatment.hasAdmissionField) warnings.push("P1_ADMISSION_EQUIVALENT_STRUCTURE_USED");

  const evidenceRefCheck = checkEvidenceRefs(output, hybridExtractionManifest);
  if (!evidenceRefCheck.ok) errors.push(...evidenceRefCheck.errors);

  const summary = {
    source_discovery_handoff_present: Boolean(handoff),
    forensic_ledger_present: Boolean(ledger),
    trace_present: Boolean(trace && typeof trace === "object"),
    admitted_count: treatment.admitted_count,
    rejected_count: treatment.rejected_count,
    quarantined_count: treatment.quarantined_count,
    missing_or_unknown_count: treatment.missing_or_unknown_count,
    evidence_ref_check: evidenceRefCheck.summary
  };

  return { ok: errors.length === 0, errors, warnings, summary };
}

export function summarizeP1Output(input = {}) {
  return validateP1Output(input).summary;
}

function objectOrNull(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : null;
}

function compactJson(value) {
  try {
    return JSON.stringify(value || {});
  } catch {
    return String(value || "");
  }
}

function unwrapManifest(manifest) {
  return manifest?.hybrid_extraction_manifest || manifest || {};
}

function arr(value) {
  return Array.isArray(value) ? value : [];
}

function collectStage0Urls(manifest) {
  const root = unwrapManifest(manifest);
  const urls = new Set();
  for (const candidate of arr(root.candidate_sources)) {
    for (const url of [candidate.canonical_url, candidate.original_url]) {
      if (url) urls.add(normalizeUrl(url));
    }
  }
  for (const artifact of arr(root.lossless_text_artifacts)) {
    if (artifact.source_url) urls.add(normalizeUrl(artifact.source_url));
  }
  return urls;
}

function normalizeUrl(url) {
  return String(url || "").trim().replace(/\/+$/g, "").toLowerCase();
}

function collectUrls(value) {
  const urls = [];
  walk(value, (_key, child) => {
    if (typeof child === "string" && /^(https?:\/\/|PASTED_PUBLIC_MATERIAL|SYNTHETIC_DEMO_MATERIAL)/i.test(child.trim())) {
      urls.push(child.trim());
    }
  });
  return Array.from(new Set(urls));
}

function summarizeTreatment(value) {
  const admitted = collectArrayByKey(value, /admitted|accepted/i);
  const rejected = collectArrayByKey(value, /rejected|excluded/i);
  const quarantined = collectArrayByKey(value, /quarantined|deferred|limited/i);
  const missing = collectArrayByKey(value, /missing|unknown|unresolved/i);
  const statusLike = [];
  walk(value, (key, child) => {
    if (/status|treatment|admission/i.test(key) && typeof child === "string") statusLike.push(child);
  });
  return {
    hasTreatment: admitted.length || rejected.length || quarantined.length || missing.length || statusLike.length,
    hasAdmissionField: admitted.length || statusLike.some((entry) => /admit|reject|quarantine|defer/i.test(entry)),
    admitted_count: admitted.reduce((sum, item) => sum + arr(item).length, 0),
    rejected_count: rejected.reduce((sum, item) => sum + arr(item).length, 0),
    quarantined_count: quarantined.reduce((sum, item) => sum + arr(item).length, 0),
    missing_or_unknown_count: missing.reduce((sum, item) => sum + arr(item).length, 0)
  };
}

function collectArrayByKey(value, pattern) {
  const hits = [];
  walk(value, (key, child) => {
    if (pattern.test(key) && Array.isArray(child)) hits.push(child);
  });
  return hits;
}

function checkEvidenceRefs(output, manifest) {
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

  const refs = new Set();
  walk(output, (key, child) => {
    if (/(candidate_source_id|candidate_source_ref|lossless_artifact_id|lossless_artifact_ref|evidence_ref|source_ref)$/i.test(key) && typeof child === "string") {
      refs.add(child);
    }
  });

  const unresolved = Array.from(refs).filter((ref) => !allowed.has(String(ref)));
  return {
    ok: unresolved.length === 0,
    errors: unresolved.map((ref) => `P1_ADMITTED_EVIDENCE_REF_UNRESOLVED:${ref}`),
    summary: {
      checked_ref_count: refs.size,
      unresolved_ref_count: unresolved.length,
      unresolved_refs: unresolved.slice(0, 10)
    }
  };
}

function walk(value, visit, key = "") {
  visit(key, value);
  if (!value || typeof value !== "object") return;
  if (Array.isArray(value)) {
    value.forEach((child, index) => walk(child, visit, String(index)));
    return;
  }
  for (const [childKey, child] of Object.entries(value)) walk(child, visit, childKey);
}
