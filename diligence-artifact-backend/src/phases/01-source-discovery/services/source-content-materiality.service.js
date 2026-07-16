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

const SUPPRESSION_ACTIONS = new Set([
  "SUPPRESS_EXACT_DUPLICATE",
  "SUPPRESS_BLOCK_ONLY_DUPLICATE"
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

/**
 * Validate the actual post-dedupe storage corpus. Navigation indexes are not the
 * storage source of truth and may retain auditable references to sources removed
 * as exact or all-block duplicates. Only physical root sources and independent
 * legal artifacts are required to carry material text.
 */
export function assertExtractedSourcesContainMaterialText(output) {
  const sourceFamilyIndex = output?.source_family_index;
  if (!sourceFamilyIndex?.root_artifact_manifest) throw new Error("PHASE1_MATERIAL_STORAGE_BOUNDARY_INPUT_INVALID");

  const indexedSourceIds = new Set((sourceFamilyIndex.discovered_source_index || []).map((row) => row.source_id).filter(Boolean));
  const physicalSourceIds = new Set();
  let physicalRootSources = 0;

  for (const [root, entry] of Object.entries(sourceFamilyIndex.root_artifact_manifest || {})) {
    for (const artifactName of entry.required_artifacts || []) {
      const artifact = output[artifactName];
      if (!artifact || artifact.common_root !== root || !Array.isArray(artifact.sources)) throw new Error(`PHASE1_MATERIAL_STORAGE_ROOT_ARTIFACT_INVALID:${artifactName}`);
      for (const source of artifact.sources) {
        const sourceId = source?.source_id || source?.manifest_id || `${root}:unknown`;
        if (physicalSourceIds.has(sourceId)) throw new Error(`PHASE1_MATERIAL_STORAGE_DUPLICATE_PHYSICAL_SOURCE:${sourceId}`);
        physicalSourceIds.add(sourceId);
        physicalRootSources += 1;

        if (indexedSourceIds.size && source.source_id && !indexedSourceIds.has(source.source_id)) throw new Error(`PHASE1_MATERIAL_STORAGE_PHYSICAL_SOURCE_NOT_INDEXED:${source.source_id}`);
        const retainedText = normalizeText(source.lossless_text);
        if (!retainedText) throw new Error(`PHASE1_EXTRACTED_SOURCE_TEXT_MISSING:${sourceId}`);

        const scope = source.extraction_scope || "FULL_MAIN_CONTENT";
        if (["FULL_MAIN_CONTENT", "FULL_DOCUMENT"].includes(scope)) {
          const materiality = assessSourceContentMateriality({ text: retainedText });
          if (!materiality.extraction_eligible) throw new Error(`PHASE1_EXTRACTED_SOURCE_NOT_MATERIAL:${sourceId}:${materiality.reasons.join(",")}`);
        } else if (["SELECTED_UNIQUE_SECTIONS", "STRUCTURED_COVERAGE_ONLY"].includes(scope)) {
          if (retainedText.length < 40) throw new Error(`PHASE1_EXTRACTED_DELTA_TOO_SMALL:${sourceId}`);
        } else {
          throw new Error(`PHASE1_MATERIAL_STORAGE_SCOPE_INVALID:${sourceId}:${scope}`);
        }
      }
    }
  }

  const suppressedSourceIds = new Set();
  const blockDedupe = sourceFamilyIndex.block_dedupe_forensics || {};
  for (const [root, rootForensics] of Object.entries(blockDedupe.roots || {})) {
    for (const source of rootForensics.source_forensics || []) {
      if (!SUPPRESSION_ACTIONS.has(source.action)) continue;
      if (!source.source_id || !source.duplicate_owner_source_id) throw new Error(`PHASE1_MATERIAL_STORAGE_SUPPRESSION_PROVENANCE_MISSING:${root}:${source.source_id || "unknown"}`);
      if (physicalSourceIds.has(source.source_id)) throw new Error(`PHASE1_MATERIAL_STORAGE_SUPPRESSED_SOURCE_STILL_PHYSICAL:${source.source_id}`);
      suppressedSourceIds.add(source.source_id);
    }
  }

  for (const row of sourceFamilyIndex.manifest_only_index || []) {
    if (!SUPPRESSION_ACTIONS.has(row.extraction_status)) continue;
    if (!row.source_id || !row.duplicate_owner_source_id) throw new Error(`PHASE1_MATERIAL_STORAGE_MANIFEST_SUPPRESSION_PROVENANCE_MISSING:${row.source_id || row.manifest_id || "unknown"}`);
    if (physicalSourceIds.has(row.source_id)) throw new Error(`PHASE1_MATERIAL_STORAGE_MANIFEST_SUPPRESSED_SOURCE_STILL_PHYSICAL:${row.source_id}`);
    suppressedSourceIds.add(row.source_id);
  }

  const legalDocs = output?.legal_doc_inventory?.documents_found || [];
  for (const doc of legalDocs) {
    const artifact = output[doc.artifact_name];
    const materiality = assessSourceContentMateriality({ text: artifact?.lossless_text });
    if (!artifact?.lossless_text || artifact.extraction_scope !== "FULL_DOCUMENT" || !materiality.extraction_eligible) throw new Error(`PHASE1_LEGAL_ARTIFACT_NOT_MATERIAL:${doc.artifact_name}`);
  }

  return {
    ok: true,
    physical_root_sources: physicalRootSources,
    suppressed_duplicate_sources: suppressedSourceIds.size,
    legal_artifacts: legalDocs.length
  };
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
