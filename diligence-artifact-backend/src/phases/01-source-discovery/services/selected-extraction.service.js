import crypto from "node:crypto";

export const PHASE1_SELECTED_EXTRACTION_SCHEMA_VERSION = "PHASE1_SELECTED_EXTRACTION_v1";
export const EXTRACTION_SCOPES = Object.freeze([
  "FULL_DOCUMENT",
  "FULL_MAIN_CONTENT",
  "SELECTED_UNIQUE_SECTIONS",
  "STRUCTURED_COVERAGE_ONLY",
  "METADATA_ONLY"
]);

/** Apply the RB-10 extraction scope after materialising the authorised source. */
export function applySelectedExtractionScope({ manifestRow, extracted } = {}) {
  if (!extracted?.ok) return extracted;
  const requested = manifestRow?.legal_doc_candidate ? "FULL_DOCUMENT" : manifestRow?.extraction_scope || "FULL_MAIN_CONTENT";
  if (!EXTRACTION_SCOPES.includes(requested)) throw new Error(`PHASE1_SELECTED_EXTRACTION_SCOPE_INVALID:${requested}`);
  const originalText = String(extracted.lossless_text || "").trim();
  const originalBlocks = splitMeaningfulBlocks(originalText);
  let selectedBlocks = originalBlocks;
  let selectedText = originalText;
  let selectionBasis = "FULL_SOURCE_AUTHORISED";

  if (requested === "METADATA_ONLY") {
    selectedBlocks = [];
    selectedText = "";
    selectionBasis = "NO_CONTENT_EXTRACTION_AUTHORISED";
  } else if (requested === "STRUCTURED_COVERAGE_ONLY") {
    selectedBlocks = [];
    selectedText = structuredCoverageText(manifestRow);
    selectionBasis = "TEMPLATE_BODY_SUPPRESSED_STRUCTURED_COVERAGE_ONLY";
  } else if (requested === "SELECTED_UNIQUE_SECTIONS") {
    const wanted = new Set(manifestRow?.selected_block_hashes || []);
    selectedBlocks = wanted.size ? originalBlocks.filter((block) => wanted.has(hashBlock(block))) : selectByUniqueMaterial(originalBlocks, manifestRow?.unique_material || []);
    if (!selectedBlocks.length && manifestRow?.structured_coverage) {
      selectedText = structuredCoverageText(manifestRow);
      selectionBasis = "NO_MATCHING_UNIQUE_BLOCK_STRUCTURED_COVERAGE_FALLBACK";
    } else {
      selectedText = selectedBlocks.join("\n\n");
      selectionBasis = wanted.size ? "SELECTED_BY_RB09_BLOCK_HASH" : "SELECTED_BY_DECLARED_UNIQUE_MATERIAL";
    }
  }

  return {
    ...extracted,
    lossless_text: selectedText,
    extraction_scope: requested,
    extraction_scope_applied: true,
    selected_extraction_schema_version: PHASE1_SELECTED_EXTRACTION_SCHEMA_VERSION,
    extraction_scope_forensics: {
      requested_scope: requested,
      selection_basis: selectionBasis,
      original_block_count: originalBlocks.length,
      selected_block_count: selectedBlocks.length,
      omitted_block_count: Math.max(0, originalBlocks.length - selectedBlocks.length),
      original_sha256: sha256(originalText),
      selected_sha256: sha256(selectedText),
      full_page_body_retained: ["FULL_DOCUMENT", "FULL_MAIN_CONTENT"].includes(requested)
    },
    extraction_warnings: unique([
      ...(extracted.extraction_warnings || []),
      requested === "STRUCTURED_COVERAGE_ONLY" ? "FULL_TEMPLATE_BODY_SUPPRESSED" : null,
      requested === "SELECTED_UNIQUE_SECTIONS" ? "ONLY_SELECTED_UNIQUE_SECTIONS_RETAINED" : null
    ])
  };
}

export function assertSelectedExtractionResult(manifestRow, result) {
  if (!result?.ok) return { ok: true, status: result?.status || "FETCH_FAILED" };
  if (result.selected_extraction_schema_version !== PHASE1_SELECTED_EXTRACTION_SCHEMA_VERSION || result.extraction_scope_applied !== true) throw new Error(`PHASE1_SELECTED_EXTRACTION_NOT_APPLIED:${manifestRow?.manifest_id || "missing"}`);
  if (!EXTRACTION_SCOPES.includes(result.extraction_scope)) throw new Error(`PHASE1_SELECTED_EXTRACTION_SCOPE_INVALID:${result.extraction_scope}`);
  if (manifestRow?.legal_doc_candidate && result.extraction_scope !== "FULL_DOCUMENT") throw new Error(`PHASE1_SELECTED_EXTRACTION_LEGAL_DOCUMENT_TRUNCATED:${manifestRow?.manifest_id}`);
  if (result.extraction_scope === "METADATA_ONLY" && result.lossless_text) throw new Error(`PHASE1_SELECTED_EXTRACTION_METADATA_TEXT_PRESENT:${manifestRow?.manifest_id}`);
  return { ok: true, scope: result.extraction_scope };
}

export function splitMeaningfulBlocks(text) {
  const rough = String(text || "")
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map((item) => normalize(item))
    .filter((item) => item.length >= 20);
  const blocks = [];
  let current = "";
  for (const item of rough) {
    if (!current) current = item;
    else if (current.length + item.length < 900) current += ` ${item}`;
    else { blocks.push(current); current = item; }
  }
  if (current) blocks.push(current);
  if (!blocks.length && normalize(text)) blocks.push(normalize(text));
  return blocks;
}

export function hashBlock(value) { return sha256(normalizeForHash(value)); }

function selectByUniqueMaterial(blocks, uniqueMaterial) {
  const needles = (uniqueMaterial || []).map((item) => normalizeForHash(item)).filter(Boolean);
  if (!needles.length) return blocks;
  return blocks.filter((block) => {
    const normalized = normalizeForHash(block);
    return needles.some((needle) => normalized.includes(needle) || needle.split(" ").filter((token) => token.length > 3).every((token) => normalized.includes(token)));
  });
}

function structuredCoverageText(row) {
  const payload = {
    feature_cluster: row?.feature_cluster || row?.variant_cluster_id || row?.route_type || "unassigned",
    variant_family: row?.variant_family || "none",
    coverage: row?.structured_coverage || deriveCoverage(row?.canonical_url),
    unique_material: row?.unique_material || [],
    canonical_owner_candidate_id: row?.canonical_owner_candidate_id || null,
    source_url: row?.canonical_url || row?.fetch_url || null
  };
  return `STRUCTURED COVERAGE RECORD\n${JSON.stringify(payload, null, 2)}`;
}

function deriveCoverage(value) {
  try {
    const path = new URL(value).pathname.toLowerCase();
    const pair = /\/([a-z-]{2,20})-to-([a-z-]{2,20})(?:\/|$)/.exec(path);
    if (pair) return { coverage_type: "language_pair", source_language: pair[1], target_language: pair[2] };
    const segments = path.split("/").filter(Boolean);
    if (path.includes("electricity-bill-payment/") && segments.length > 1) return { coverage_type: "state_provider", state: segments.at(-1).replace(/-/g, " ") };
    return segments.length ? { coverage_type: "path_variant", value: segments.at(-1) } : null;
  } catch { return null; }
}

function normalize(value) { return String(value || "").replace(/\r/g, "\n").replace(/[ \t]+/g, " ").replace(/\n[ \t]+/g, "\n").replace(/\n{3,}/g, "\n\n").trim(); }
function normalizeForHash(value) { return normalize(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
function unique(values) { return [...new Set((values || []).filter(Boolean))]; }
