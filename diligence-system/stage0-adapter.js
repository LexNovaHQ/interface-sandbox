import crypto from "node:crypto";

const VALID_SOURCE_MODES = new Set(["url", "url_plus_text", "text", "synthetic_demo"]);
const BATCH_BY_FAMILY = {
  root_homepage: "SX_BATCH_P1_ROOT_PLATFORM",
  product_solution: "SX_BATCH_P1_PRODUCT_SOLUTION",
  product_platform: "SX_BATCH_P1_PRODUCT_SOLUTION",
  legal_governance: "SX_BATCH_P1_LEGAL_GOVERNANCE",
  subprocessor: "SX_BATCH_P1_LEGAL_GOVERNANCE",
  security_trust: "SX_BATCH_P2_SECURITY_TRUST",
  docs_api_developer: "SX_BATCH_P2_DOCS_API",
  pricing_commercial: "SX_BATCH_P3_COMMERCIAL",
  blog_changelog_help: "SX_BATCH_P4_SIGNAL_ONLY",
  pasted_public_material: "SX_BATCH_P4_SIGNAL_ONLY",
  synthetic_demo: "SX_BATCH_P4_SIGNAL_ONLY",
  unknown: "SX_BATCH_P4_SIGNAL_ONLY"
};

export function buildHybridExtractionManifest(input = {}) {
  const sourceMode = normalizeSourceMode(input.sourceMode);
  const packet = input.hybridEvidencePacket || {};
  const sourceReview = packet.source_review || {};
  const warnings = arr(packet.warnings).map((message, index) => ({ warning_id: id("WARN", index), message: String(message) }));
  const limitations = [];
  const target = buildTarget(input.targetUrl, input.companyName, limitations);
  const candidates = [];
  const artifacts = [];
  const fetchSuccesses = [];
  const fetchFailures = [];
  const deferred = [];
  const scouts = [];
  const batchIds = new Set();
  const fetchedUrls = new Set();
  const inventoryByUrl = new Map();

  for (const item of arr(packet.artifact_inventory)) {
    const key = urlKey(item.source_url);
    if (!inventoryByUrl.has(key)) inventoryByUrl.set(key, []);
    inventoryByUrl.get(key).push(item);
    if (item.status === "ABSENT" && item.artifact_class === "CORE_LEGAL") {
      limitations.push({ limitation_id: id("LIMIT", limitations.length), type: "CORE_LEGAL_ARTIFACT_ABSENT", artifact_type: item.artifact_type || "UNKNOWN", basis: item.absence_basis || item.warning || "Core legal artifact not ingested by Stage 0 fetcher." });
    }
  }

  for (const attempt of arr(packet.direct_fetch_attempts)) {
    const normalized = normalizeAttempt(attempt);
    if (normalized.status === "INGESTED") fetchSuccesses.push(normalized);
    else fetchFailures.push(normalized);
  }

  for (const entry of arr(packet.evidence_buffer)) {
    const sourceUrl = entry.source_url || input.targetUrl || "UNKNOWN";
    const inventory = inventoryByUrl.get(urlKey(sourceUrl))?.[0] || null;
    const family = sourceFamilyHint(entry, inventory, sourceMode);
    const batchId = batchFor(family);
    batchIds.add(batchId);
    fetchedUrls.add(urlKey(sourceUrl));
    addCandidate({ candidates, artifacts, entry, inventory, batchId, family, fetchStatus: fetchStatusFor(entry, sourceMode), sourceUrl, cleanText: entry.evidence_text || entry.clean_text || "", limitations: [] });
  }

  if ((sourceMode === "text" || sourceMode === "url_plus_text") && input.pastedPublicMaterial && !candidates.some((c) => c.fetch_status === "PASTED")) {
    const family = "pasted_public_material";
    const batchId = batchFor(family);
    batchIds.add(batchId);
    addCandidate({ candidates, artifacts, entry: { source_url: "PASTED_PUBLIC_MATERIAL", source_type: "PASTED_PUBLIC_MATERIAL", ingestion_method: "PASTED_TEXT", artifact_type: "Pasted Public Material", evidence_text: input.pastedPublicMaterial }, inventory: null, batchId, family, fetchStatus: "PASTED", sourceUrl: "PASTED_PUBLIC_MATERIAL", cleanText: input.pastedPublicMaterial, limitations: [] });
  }

  if (sourceMode === "synthetic_demo") {
    const family = "synthetic_demo";
    const batchId = batchFor(family);
    const syntheticText = input.syntheticDemoMaterial || input.pastedPublicMaterial || "";
    batchIds.add(batchId);
    limitations.push({ limitation_id: id("LIMIT", limitations.length), type: "SYNTHETIC_ONLY_LIMITATION", basis: "Synthetic demo material is candidate-only and cannot be treated as admitted evidence." });
    addCandidate({ candidates, artifacts, entry: { source_url: "SYNTHETIC_DEMO_MATERIAL", source_type: "SYNTHETIC_DEMO", ingestion_method: "SYNTHETIC_TEXT", artifact_type: "Synthetic Demo Material", evidence_text: syntheticText }, inventory: null, batchId, family, fetchStatus: "SYNTHETIC", sourceUrl: "SYNTHETIC_DEMO_MATERIAL", cleanText: syntheticText, limitations: ["SYNTHETIC_ONLY_LIMITATION"] });
  }

  for (const link of arr(packet.candidate_links)) {
    if (fetchedUrls.has(urlKey(link.url))) continue;
    const scout = { scout_record_id: id("scout", scouts.length), url: link.url || "UNKNOWN", bucket: link.bucket || "UNKNOWN", discovery_basis: link.discovery_basis || "UNKNOWN", status: "DISCOVERED_NOT_FETCHED" };
    scouts.push(scout);
    deferred.push({ deferred_candidate_id: id("defer", deferred.length), canonical_url: scout.url, reason: "DISCOVERED_LINK_NOT_FETCHED_IN_STAGE0_LIMITS", source: scout.scout_record_id });
  }

  const batchPlan = Array.from(batchIds).sort().map((batch_id) => ({ batch_id, candidate_count: candidates.filter((c) => c.batch_id === batch_id).length, stage: "S0_CANDIDATE_COLLECTION" }));
  const status = candidates.length ? (limitations.length ? "COMPLETED_WITH_LIMITATIONS" : "LOCKED") : "CONTROLLED_FAILURE";

  return { hybrid_extraction_manifest: {
    schema_version: "source_extraction_contract_v1_1",
    run_id: input.runId || "UNKNOWN_RUN",
    source_mode: sourceMode,
    target,
    collection_summary: {
      source_mode: sourceMode,
      primary_attempted: num(sourceReview.primary_attempted),
      primary_ingested: num(sourceReview.primary_ingested),
      secondary_attempted: num(sourceReview.secondary_attempted),
      secondary_ingested: num(sourceReview.secondary_ingested),
      evidence_entries: candidates.length,
      artifact_inventory_entries: arr(packet.artifact_inventory).length,
      evidence_buffer_size_chars: candidates.reduce((sum, c) => sum + num(c.char_count), 0),
      jina_used: Boolean(sourceReview.jina_used),
      grounding_allowed: Boolean(sourceReview.grounding_allowed ?? packet.grounding_allowed),
      warnings_count: warnings.length,
      limitations_count: limitations.length
    },
    batch_plan: batchPlan,
    candidate_sources: candidates,
    lossless_text_artifacts: artifacts,
    artifact_store_manifest: { storage_mode: "in_memory_runtime_payload", lossless_text_available: true, artifact_count: artifacts.length, note: "Stage 0 adapter preserves fetched clean_text from hybrid fetcher output for Phase 1 admission review." },
    fetch_successes: fetchSuccesses,
    fetch_failures: fetchFailures,
    deferred_candidates: deferred,
    dedupe_records: [],
    rejected_by_scope: [],
    search_scout_records: scouts,
    coverage_challenge_records: [],
    collection_warnings: warnings,
    collection_limitations: limitations,
    extraction_forensic_ledger: {
      phase_id: "S0_HYBRID_SOURCE_EXTRACTION",
      ledger_status: status,
      ledger_events: [
        { event: "STAGE0_ADAPTER_STARTED", source_mode: sourceMode },
        { event: "CANDIDATE_SOURCES_PACKAGED", count: candidates.length },
        { event: "STAGE0_CANDIDATE_ONLY_LOCKED", next_phase: "P1" }
      ],
      batch_execution_log: batchPlan.map((b) => ({ batch_id: b.batch_id, candidate_count: b.candidate_count, status: "CANDIDATE_COLLECTION_COMPLETE" })),
      source_review: sourceReview
    },
    phase1_instruction: { next_phase: "P1", next_prompt_file: "01_SOURCE_DISCOVERY_EVIDENCE_BOX.md", stage_0_output_is_candidate_only: true, phase_1_required_for_admission: true, downstream_direct_use_forbidden: true }
  } };
}

export function summarizeHybridExtractionManifest(manifest) {
  const root = unwrap(manifest);
  return {
    run_id: root.run_id || "UNKNOWN_RUN",
    source_mode: root.source_mode || "unknown",
    candidate_count: arr(root.candidate_sources).length,
    artifact_count: arr(root.lossless_text_artifacts).length,
    fetch_success_count: arr(root.fetch_successes).length,
    fetch_failure_count: arr(root.fetch_failures).length,
    warning_count: arr(root.collection_warnings).length,
    limitation_count: arr(root.collection_limitations).length,
    batch_count: arr(root.batch_plan).length,
    stage_0_status: root.extraction_forensic_ledger?.ledger_status || "UNKNOWN",
    next_phase: root.phase1_instruction?.next_phase || "P1"
  };
}

export function validateHybridExtractionManifest(manifest) {
  const root = unwrap(manifest);
  const errors = [];
  const warnings = [];
  if (!root || typeof root !== "object") errors.push("HYBRID_EXTRACTION_MANIFEST_MISSING");
  if (!root.schema_version) errors.push("SCHEMA_VERSION_MISSING");
  if (!root.run_id) errors.push("RUN_ID_MISSING");
  if (!VALID_SOURCE_MODES.has(root.source_mode)) errors.push(`SOURCE_MODE_INVALID:${root.source_mode || "MISSING"}`);
  if (!Array.isArray(root.candidate_sources)) errors.push("CANDIDATE_SOURCES_ARRAY_MISSING");
  if (!Array.isArray(root.lossless_text_artifacts)) errors.push("LOSSLESS_TEXT_ARTIFACTS_ARRAY_MISSING");
  if (!root.artifact_store_manifest) errors.push("ARTIFACT_STORE_MANIFEST_MISSING");
  if (!root.extraction_forensic_ledger) errors.push("EXTRACTION_FORENSIC_LEDGER_MISSING");
  for (const keyPath of findForbiddenKeys(root, new Set(["admitted_evidence", "source_discovery_handoff", "evidence_box"]))) {
    errors.push(`FORBIDDEN_STAGE1_KEY_PRESENT:${keyPath}`);
  }

  const artifacts = arr(root.lossless_text_artifacts);
  const artifactIds = new Set(artifacts.map((a) => a.lossless_artifact_id).filter(Boolean));
  for (const candidate of arr(root.candidate_sources)) {
    if (!candidate.candidate_source_id) errors.push("CANDIDATE_SOURCE_ID_MISSING");
    if (["FETCHED", "PASTED", "SYNTHETIC", "INGESTED"].includes(candidate.fetch_status) && !candidate.lossless_artifact_ref) errors.push(`LOSSLESS_ARTIFACT_REF_MISSING:${candidate.candidate_source_id || "UNKNOWN"}`);
    if (candidate.lossless_artifact_ref && !artifactIds.has(candidate.lossless_artifact_ref)) errors.push(`LOSSLESS_ARTIFACT_REF_UNRESOLVED:${candidate.candidate_source_id || "UNKNOWN"}`);
  }
  for (const artifact of artifacts) {
    if (!artifact.lossless_artifact_id) errors.push("LOSSLESS_ARTIFACT_ID_MISSING");
    if (!artifact.candidate_source_id) errors.push("LOSSLESS_ARTIFACT_CANDIDATE_REF_MISSING");
    if (!String(artifact.clean_text || "").trim() && !artifact.controlled_empty_or_access_limitation) errors.push(`LOSSLESS_ARTIFACT_TEXT_MISSING:${artifact.lossless_artifact_id || "UNKNOWN"}`);
  }
  if (root.phase1_instruction?.stage_0_output_is_candidate_only !== true) errors.push("STAGE0_CANDIDATE_ONLY_FLAG_MISSING");
  if (root.phase1_instruction?.phase_1_required_for_admission !== true) errors.push("PHASE1_REQUIRED_FOR_ADMISSION_FLAG_MISSING");
  if (!arr(root.candidate_sources).length) warnings.push("NO_CANDIDATE_SOURCES_EMITTED");
  return { ok: errors.length === 0, errors, warnings };
}

function addCandidate({ candidates, artifacts, entry, inventory, batchId, family, fetchStatus, sourceUrl, cleanText, limitations }) {
  const candidateId = id("cand", candidates.length);
  const artifactId = id("artifact", artifacts.length);
  const text = String(cleanText || "");
  const hash = entry.canonical_lossless_hash || entry.hash || sha(text || sourceUrl || candidateId);
  const title = entry.title || inventory?.artifact_type || entry.artifact_type || "Untitled candidate source";
  candidates.push({
    candidate_source_id: candidateId,
    batch_id: batchId,
    priority: priorityFor(family),
    source_family_hint: family,
    canonical_url: canonicalUrl(sourceUrl),
    original_url: sourceUrl || "UNKNOWN",
    scope_class: entry.evidence_scope || inventory?.artifact_class || entry.source_type || "UNKNOWN",
    fetch_status: fetchStatus,
    lossless_artifact_ref: artifactId,
    artifact_storage_uri: `in_memory://${artifactId}`,
    canonical_lossless_hash: hash,
    word_count: words(text),
    char_count: text.length,
    title,
    heading_sample: entry.heading_sample || "",
    anchor_context: entry.first_party_basis || inventory?.evidence_summary || "",
    text_preview: text.slice(0, 600),
    stage0_limitations: limitations
  });
  artifacts.push({
    lossless_artifact_id: artifactId,
    candidate_source_id: candidateId,
    source_url: sourceUrl || "UNKNOWN",
    title,
    clean_text: text,
    char_count: text.length,
    word_count: words(text),
    canonical_lossless_hash: hash,
    representation: "clean_text",
    is_lossless_for_current_fetch: true,
    summarized: false,
    compressed: false,
    truncated: false,
    normalized: false
  });
}

function buildTarget(targetUrl, companyName, limitations) {
  const notes = [];
  let canonicalDomain = null;
  let rootUrl = null;
  let allowedHosts = [];
  if (targetUrl && targetUrl !== "N/A") {
    try {
      const parsed = new URL(targetUrl);
      canonicalDomain = parsed.hostname.toLowerCase();
      rootUrl = `${parsed.protocol}//${parsed.host}/`;
      allowedHosts = [canonicalDomain];
      notes.push("TARGET_URL_NORMALIZED");
    } catch {
      notes.push("TARGET_URL_INVALID");
      limitations.push({ limitation_id: id("LIMIT", limitations.length), type: "TARGET_URL_NORMALIZATION_FAILED", basis: `Could not parse targetUrl: ${targetUrl}` });
    }
  } else {
    notes.push("TARGET_URL_NOT_SUPPLIED_FOR_NON_URL_MODE");
  }
  return { target_url: targetUrl || "N/A", company_name: companyName || "N/A", canonical_domain: canonicalDomain, root_url: rootUrl, allowed_hosts: allowedHosts, normalization_notes: notes };
}

function sourceFamilyHint(entry, inventory, sourceMode) {
  if (sourceMode === "synthetic_demo") return "synthetic_demo";
  if (entry.source_type === "PASTED_PUBLIC_MATERIAL" || entry.ingestion_method === "PASTED_TEXT") return "pasted_public_material";
  const text = `${inventory?.artifact_type || entry.artifact_type || ""} ${entry.source_url || ""}`.toLowerCase();
  if (/homepage|about|company|^https?:\/\/[^/]+\/?$/.test(text)) return "root_homepage";
  if (/subprocessor/.test(text)) return "subprocessor";
  if (/terms|privacy|dpa|data-processing|acceptable-use|aup|sla|cookie|legal/.test(text)) return "legal_governance";
  if (/trust|security|compliance/.test(text)) return "security_trust";
  if (/docs|api|developer/.test(text)) return "docs_api_developer";
  if (/pricing|enterprise/.test(text)) return "pricing_commercial";
  if (/blog|changelog|help|support/.test(text)) return "blog_changelog_help";
  if (/product|platform/.test(text)) return "product_platform";
  if (/solution|use-cases|use-case/.test(text)) return "product_solution";
  return "unknown";
}

function priorityFor(family) {
  if (["root_homepage", "product_solution", "product_platform", "legal_governance", "subprocessor"].includes(family)) return "P1_CORE";
  if (["security_trust", "docs_api_developer"].includes(family)) return "P2_SUPPORT";
  if (family === "pricing_commercial") return "P3_COMMERCIAL";
  return "P4_SIGNAL_ONLY";
}

function batchFor(family) { return BATCH_BY_FAMILY[family] || BATCH_BY_FAMILY.unknown; }
function fetchStatusFor(entry, sourceMode) { if (sourceMode === "synthetic_demo") return "SYNTHETIC"; if (entry.source_type === "PASTED_PUBLIC_MATERIAL" || entry.ingestion_method === "PASTED_TEXT") return "PASTED"; return "FETCHED"; }
function normalizeAttempt(attempt = {}) { return { source_url: attempt.source_url || "UNKNOWN", fetch_url: attempt.fetch_url || attempt.source_url || "UNKNOWN", method: attempt.method || "UNKNOWN", bucket: attempt.bucket || "UNKNOWN", discovery_basis: attempt.discovery_basis || "UNKNOWN", status: attempt.status || "UNKNOWN", http_status: num(attempt.http_status), chars: num(attempt.chars), latency_ms: num(attempt.latency_ms), warning: attempt.warning || "N/A" }; }
function canonicalUrl(url) { if (!url) return "UNKNOWN"; if (["PASTED_PUBLIC_MATERIAL", "SYNTHETIC_DEMO_MATERIAL"].includes(url)) return url; try { const parsed = new URL(url); parsed.hash = ""; return parsed.toString(); } catch { return url; } }
function urlKey(url) { return canonicalUrl(url).toLowerCase(); }
function normalizeSourceMode(mode) { const value = String(mode || "url").trim() || "url"; return VALID_SOURCE_MODES.has(value) ? value : "url"; }
function unwrap(manifest) { return manifest?.hybrid_extraction_manifest || manifest || {}; }
function arr(value) { return Array.isArray(value) ? value : []; }
function num(value) { const number = Number(value); return Number.isFinite(number) ? number : 0; }
function words(text) { return String(text || "").trim().split(/\s+/).filter(Boolean).length; }
function sha(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
function id(prefix, index) { return `${prefix}_${String(index + 1).padStart(4, "0")}`; }
function findForbiddenKeys(value, forbidden, path = "") { if (!value || typeof value !== "object") return []; const hits = []; for (const [key, child] of Object.entries(value)) { const keyPath = path ? `${path}.${key}` : key; if (forbidden.has(key)) hits.push(keyPath); if (child && typeof child === "object") hits.push(...findForbiddenKeys(child, forbidden, keyPath)); } return hits; }
