export const PHASE1_SOURCE_CONTENT_MATERIALITY_VERSION = "PHASE1_SOURCE_CONTENT_MATERIALITY_RB18_v1";

const DEFAULT_MIN_CHARACTERS = positiveInt(process.env.LN_PHASE1_MIN_MATERIAL_CHARACTERS, 60);
const DEFAULT_MIN_TOKENS = positiveInt(process.env.LN_PHASE1_MIN_MATERIAL_TOKENS, 8);
const DEFAULT_MIN_UNIQUE_TOKENS = positiveInt(process.env.LN_PHASE1_MIN_MATERIAL_UNIQUE_TOKENS, 5);
const DEFAULT_MIN_BLOCKS = positiveInt(process.env.LN_PHASE1_MIN_MATERIAL_BLOCKS, 1);

const PLACEHOLDER_PATTERNS = Object.freeze([
  ["JAVASCRIPT_SHELL", /\b(?:enable|requires?|need) javascript\b|\bjavascript (?:is )?(?:disabled|required)\b/i],
  ["LOADING_SHELL", /^\s*(?:loading|please wait|redirecting|initializing|starting)(?:[. !]|$)/i],
  ["BOT_CHALLENGE", /\b(?:checking your browser|verify you are human|captcha|cloudflare ray id|just a moment)\b/i],
  ["ACCESS_BLOCK", /\b(?:access denied|request blocked|forbidden|unauthorized)\b/i],
  ["AUTH_SHELL", /^\s*(?:sign in|log in|login|required authentication|authentication required)\b/i],
  ["NOT_FOUND", /\b(?:404|page not found|content not found|the requested page could not be found)\b/i],
  ["EMPTY_PRODUCT_STATE", /^\s*(?:coming soon|under construction|no content available|nothing here yet)\b/i]
]);

/**
 * One deterministic authority for deciding whether fetched text is evidence.
 * HTTP success, a title, metadata, or a non-empty DOM shell are not enough.
 */
export function assessSourceContentMateriality({
  text,
  blocks,
  minCharacters = DEFAULT_MIN_CHARACTERS,
  minTokens = DEFAULT_MIN_TOKENS,
  minUniqueTokens = DEFAULT_MIN_UNIQUE_TOKENS,
  minBlocks = DEFAULT_MIN_BLOCKS
} = {}) {
  const normalized = normalizeText(text);
  const tokens = tokenize(normalized);
  const uniqueTokens = new Set(tokens);
  const meaningfulBlocks = Array.isArray(blocks) ? blocks.filter((block) => normalizeText(block).length >= 40) : splitMeaningfulBlocks(normalized);
  const placeholderSignals = detectPlaceholderSignals(normalized);
  const reasons = [];

  if (normalized.length < minCharacters) reasons.push("BELOW_MINIMUM_CHARACTER_COUNT");
  if (tokens.length < minTokens) reasons.push("BELOW_MINIMUM_TOKEN_COUNT");
  if (uniqueTokens.size < minUniqueTokens) reasons.push("BELOW_MINIMUM_UNIQUE_TOKEN_COUNT");
  if (meaningfulBlocks.length < minBlocks) reasons.push("NO_MEANINGFUL_CONTENT_BLOCK");
  if (placeholderSignals.length) reasons.push("PLACEHOLDER_OR_APPLICATION_SHELL");

  const extractionEligible = reasons.length === 0;
  return {
    schema_version: PHASE1_SOURCE_CONTENT_MATERIALITY_VERSION,
    status: extractionEligible ? "MATERIAL_CONTENT" : "NO_MATERIAL_CONTENT",
    extraction_eligible: extractionEligible,
    character_count: normalized.length,
    token_count: tokens.length,
    unique_token_count: uniqueTokens.size,
    meaningful_block_count: meaningfulBlocks.length,
    thresholds: {
      minimum_characters: minCharacters,
      minimum_tokens: minTokens,
      minimum_unique_tokens: minUniqueTokens,
      minimum_blocks: minBlocks
    },
    placeholder_signals: placeholderSignals,
    reasons
  };
}

export function assertSourceContentMateriality(result) {
  if (result?.schema_version !== PHASE1_SOURCE_CONTENT_MATERIALITY_VERSION) throw new Error("PHASE1_SOURCE_CONTENT_MATERIALITY_SCHEMA_INVALID");
  if (!Array.isArray(result.reasons) || !Array.isArray(result.placeholder_signals)) throw new Error("PHASE1_SOURCE_CONTENT_MATERIALITY_RECORD_INCOMPLETE");
  if ((result.status === "MATERIAL_CONTENT") !== (result.extraction_eligible === true)) throw new Error("PHASE1_SOURCE_CONTENT_MATERIALITY_STATUS_MISMATCH");
  if (result.extraction_eligible && result.reasons.length) throw new Error("PHASE1_SOURCE_CONTENT_MATERIALITY_ELIGIBLE_WITH_REASONS");
  if (!result.extraction_eligible && !result.reasons.length) throw new Error("PHASE1_SOURCE_CONTENT_MATERIALITY_INELIGIBLE_WITHOUT_REASON");
  return { ok: true, extraction_eligible: result.extraction_eligible };
}

/**
 * Defense-in-depth gate immediately before Agent 1B. A malformed manifest may
 * not convert a shell, placeholder, failed page, or metadata-only record into an
 * extraction request. This is a critical invariant and therefore fails loudly.
 */
export function assertFinalManifestMaterialExtractionBoundary(manifest) {
  if (!manifest?.manifest_sources || manifest.final_extraction_authority !== true || manifest.material_content_required_for_extraction !== true) throw new Error("PHASE1_MATERIAL_EXTRACTION_BOUNDARY_MANIFEST_INVALID");
  let authorized = 0;
  for (const row of manifest.manifest_sources) {
    const extractRequested = row.admission_tier === "PRIMARY" && row.extraction_decision === "EXTRACT";
    if (!extractRequested) continue;
    authorized += 1;
    const selectedHashesRequired = row.extraction_scope !== "STRUCTURED_COVERAGE_ONLY";
    if (row.fingerprint_fetch_status !== "FETCHED" || row.fingerprint_extraction_eligible !== true || row.content_materiality?.status !== "MATERIAL_CONTENT" || !row.exact_content_hash || !Array.isArray(row.selected_block_hashes) || (selectedHashesRequired && row.selected_block_hashes.length === 0)) {
      throw new Error(`PHASE1_EXTRACTION_BLOCKED_NON_MATERIAL_SOURCE:${row.manifest_id || row.canonical_url || "unknown"}`);
    }
  }
  return { ok: true, authorized_material_rows: authorized };
}

export function assertExtractedSourcesContainMaterialText(output) {
  const rows = output?.source_family_index?.discovered_source_index || [];
  for (const row of rows) {
    const artifactNames = output.source_family_index?.root_artifact_manifest?.[row.common_root]?.required_artifacts || [];
    const source = artifactNames.flatMap((name) => output[name]?.sources || []).find((item) => item.source_id === row.source_id);
    if (row.legal_doc_candidate) continue;
    const retainedText = normalizeText(source?.lossless_text);
    if (!retainedText) throw new Error(`PHASE1_EXTRACTED_SOURCE_TEXT_MISSING:${row.source_id || row.manifest_id}`);
    const scope = source?.extraction_scope || row.extraction_scope;
    if (["FULL_MAIN_CONTENT", "FULL_DOCUMENT"].includes(scope)) {
      const materiality = assessSourceContentMateriality({ text: retainedText });
      if (!materiality.extraction_eligible) throw new Error(`PHASE1_EXTRACTED_SOURCE_NOT_MATERIAL:${row.source_id || row.manifest_id}:${materiality.reasons.join(",")}`);
    } else if (retainedText.length < 40) {
      throw new Error(`PHASE1_EXTRACTED_DELTA_TOO_SMALL:${row.source_id || row.manifest_id}`);
    }
  }
  const legalDocs = output?.legal_doc_inventory?.documents_found || [];
  for (const doc of legalDocs) {
    const artifact = output[doc.artifact_name];
    const materiality = assessSourceContentMateriality({ text: artifact?.lossless_text });
    if (!artifact?.lossless_text || !materiality.extraction_eligible) throw new Error(`PHASE1_LEGAL_ARTIFACT_NOT_MATERIAL:${doc.artifact_name}`);
  }
  return { ok: true, root_sources: rows.filter((row) => !row.legal_doc_candidate).length, legal_artifacts: legalDocs.length };
}

function detectPlaceholderSignals(text) {
  if (!text || text.length > 1200) return [];
  return PLACEHOLDER_PATTERNS.filter(([, pattern]) => pattern.test(text)).map(([signal]) => signal);
}

function splitMeaningfulBlocks(text) {
  return String(text || "")
    .split(/\n{2,}|(?<=[.!?])\s+(?=[A-Z0-9])/)
    .map(normalizeText)
    .filter((item) => item.length >= 40);
}

function normalizeText(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function tokenize(value) {
  return String(value || "").toLowerCase().split(/[^a-z0-9]+/).filter((token) => token.length > 1);
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(String(value || ""), 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}
