import crypto from "node:crypto";
import { splitMeaningfulBlocks, hashBlock } from "./selected-extraction.service.js";

export const PHASE1_BLOCK_DEDUPE_SCHEMA_VERSION = "PHASE1_POST_EXTRACTION_BLOCK_DEDUPE_v1";

export function createBlockDedupeState() {
  return {
    schema_version: PHASE1_BLOCK_DEDUPE_SCHEMA_VERSION,
    roots: new Map(),
    totals: {
      sources_seen: 0,
      sources_retained: 0,
      exact_duplicate_sources_suppressed: 0,
      block_only_duplicate_sources_suppressed: 0,
      duplicate_blocks_removed: 0,
      unique_blocks_retained: 0
    }
  };
}

/**
 * RB-12 dedupes non-legal evidence inside its primary logical root. Legal
 * instruments bypass this function and remain complete independent integrity
 * units. Cross-root duplication is prevented by RB-07/RB-10 primary ownership.
 */
export function dedupeExtractedSource({ root, source, state } = {}) {
  if (!state?.roots || !root || !source) throw new Error("PHASE1_BLOCK_DEDUPE_INPUT_INVALID");
  state.totals.sources_seen += 1;
  const rootState = state.roots.get(root) || {
    exact_hash_owners: new Map(),
    block_hash_owners: new Map(),
    source_forensics: []
  };
  state.roots.set(root, rootState);

  const text = String(source.lossless_text || "").trim();
  const exactHash = sha256(normalizeForHash(text));
  const exactOwner = rootState.exact_hash_owners.get(exactHash);
  if (text && exactOwner) {
    state.totals.exact_duplicate_sources_suppressed += 1;
    const result = {
      action: "SUPPRESS_EXACT_DUPLICATE",
      source: null,
      duplicate_owner_source_id: exactOwner,
      forensics: {
        schema_version: PHASE1_BLOCK_DEDUPE_SCHEMA_VERSION,
        exact_content_hash: exactHash,
        duplicate_owner_source_id: exactOwner,
        original_block_count: splitMeaningfulBlocks(text).length,
        retained_block_count: 0,
        duplicate_block_count: splitMeaningfulBlocks(text).length,
        reason: "EXACT_NORMALISED_CONTENT_HASH_ALREADY_OWNED_IN_ROOT"
      }
    };
    rootState.source_forensics.push({ source_id: source.source_id, ...result.forensics, action: result.action });
    return result;
  }

  const blocks = splitMeaningfulBlocks(text);
  const retained = [];
  const duplicateBlocks = [];
  const hashesRetainedInsideSource = new Set();
  for (const block of blocks) {
    const hash = hashBlock(block);
    const owner = rootState.block_hash_owners.get(hash);
    if (owner) {
      duplicateBlocks.push({ sha256: hash, owner_source_id: owner, duplicate_scope: "PRIOR_SOURCE_IN_ROOT" });
    } else if (hashesRetainedInsideSource.has(hash)) {
      duplicateBlocks.push({ sha256: hash, owner_source_id: source.source_id, duplicate_scope: "REPEATED_INSIDE_SOURCE" });
    } else {
      retained.push({ text: block, sha256: hash });
      hashesRetainedInsideSource.add(hash);
    }
  }

  state.totals.duplicate_blocks_removed += duplicateBlocks.length;
  state.totals.unique_blocks_retained += retained.length;
  if (text && blocks.length && retained.length === 0) {
    state.totals.block_only_duplicate_sources_suppressed += 1;
    const owner = duplicateBlocks[0]?.owner_source_id || null;
    const result = {
      action: "SUPPRESS_BLOCK_ONLY_DUPLICATE",
      source: null,
      duplicate_owner_source_id: owner,
      forensics: {
        schema_version: PHASE1_BLOCK_DEDUPE_SCHEMA_VERSION,
        exact_content_hash: exactHash,
        duplicate_owner_source_id: owner,
        original_block_count: blocks.length,
        retained_block_count: 0,
        duplicate_block_count: duplicateBlocks.length,
        duplicate_blocks: duplicateBlocks,
        reason: "ALL_EXTRACTED_BLOCKS_ALREADY_OWNED_IN_ROOT"
      }
    };
    rootState.source_forensics.push({ source_id: source.source_id, ...result.forensics, action: result.action });
    return result;
  }

  const retainedText = retained.length ? retained.map((item) => item.text).join("\n\n") : text;
  const output = {
    ...source,
    lossless_text: retainedText,
    sha256: sha256(retainedText),
    block_dedupe_forensics: {
      schema_version: PHASE1_BLOCK_DEDUPE_SCHEMA_VERSION,
      exact_content_hash_before_dedupe: exactHash,
      exact_content_hash_after_dedupe: sha256(normalizeForHash(retainedText)),
      original_block_count: blocks.length,
      retained_block_count: retained.length,
      duplicate_block_count: duplicateBlocks.length,
      retained_block_hashes: retained.map((item) => item.sha256),
      duplicate_blocks: duplicateBlocks,
      repeated_inside_source_blocks_removed: duplicateBlocks.filter((item) => item.duplicate_scope === "REPEATED_INSIDE_SOURCE").length,
      content_changed_by_block_dedupe: duplicateBlocks.length > 0,
      primary_owner_root: root
    }
  };

  if (text) rootState.exact_hash_owners.set(exactHash, source.source_id);
  for (const item of retained) rootState.block_hash_owners.set(item.sha256, source.source_id);
  state.totals.sources_retained += 1;
  rootState.source_forensics.push({ source_id: source.source_id, ...output.block_dedupe_forensics, action: "RETAIN" });
  return { action: "RETAIN", source: output, duplicate_owner_source_id: null, forensics: output.block_dedupe_forensics };
}

export function serialiseBlockDedupeState(state) {
  return {
    schema_version: PHASE1_BLOCK_DEDUPE_SCHEMA_VERSION,
    status: "COMPLETE",
    ownership_rule: "ONE_BLOCK_OWNER_PER_PRIMARY_LOGICAL_ROOT",
    legal_instruments_excluded: true,
    totals: { ...(state?.totals || {}) },
    roots: Object.fromEntries([...(state?.roots || new Map()).entries()].map(([root, value]) => [root, {
      exact_content_hashes_owned: value.exact_hash_owners.size,
      block_hashes_owned: value.block_hash_owners.size,
      source_forensics: value.source_forensics
    }]))
  };
}

export function assertBlockDedupeState(serialised) {
  if (serialised?.schema_version !== PHASE1_BLOCK_DEDUPE_SCHEMA_VERSION || serialised.legal_instruments_excluded !== true) throw new Error("PHASE1_BLOCK_DEDUPE_SCHEMA_INVALID");
  for (const [root, entry] of Object.entries(serialised.roots || {})) {
    const retainedHashes = new Set();
    for (const source of entry.source_forensics || []) {
      const localHashes = new Set();
      for (const hash of source.retained_block_hashes || []) {
        if (localHashes.has(hash)) throw new Error(`PHASE1_BLOCK_DEDUPE_DUPLICATE_HASH_INSIDE_SOURCE:${root}:${source.source_id}:${hash}`);
        localHashes.add(hash);
        if (retainedHashes.has(hash)) throw new Error(`PHASE1_BLOCK_DEDUPE_DUPLICATE_RETAINED_HASH:${root}:${hash}`);
        retainedHashes.add(hash);
      }
    }
  }
  return { ok: true, roots: Object.keys(serialised.roots || {}).length };
}

function normalizeForHash(value) { return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/\s+/g, " ").trim(); }
function sha256(value) { return crypto.createHash("sha256").update(String(value || "")).digest("hex"); }
