const CLEAN_EXTRACTION_DISPOSITIONS = new Set([
  "EXTRACT_CANONICAL_FULL",
  "EXTRACT_UNIQUE_BLOCKS",
  "EXTRACT_LEGAL_FULL_DOCUMENT"
]);

/**
 * Agent 1B accepts only the final clean URL manifest. Audit-only URL records
 * remain in source_discovery_matrix_manifest.url_disposition_ledger and may
 * never be passed into extraction.
 */
export function assertCleanExtractionManifestBoundary(manifest) {
  if (
    !manifest?.final_extraction_authority ||
    manifest.clean_extraction_manifest !== true ||
    manifest.contains_extraction_authority_only !== true ||
    !Array.isArray(manifest.manifest_sources) ||
    manifest.manifest_sources.length === 0
  ) {
    throw new Error("PHASE1_AGENT_1B_BLOCKED_NON_CLEAN_URL_MANIFEST");
  }

  const identities = new Set();
  for (const row of manifest.manifest_sources) {
    if (!row.manifest_id || !row.canonical_identity || !row.canonical_candidate_id || !row.canonical_url || !row.fetch_url) {
      throw new Error("PHASE1_AGENT_1B_BLOCKED_INCOMPLETE_CLEAN_MANIFEST_ROW");
    }
    if (identities.has(row.canonical_identity)) {
      throw new Error(`PHASE1_AGENT_1B_BLOCKED_DUPLICATE_CLEAN_MANIFEST_IDENTITY:${row.canonical_identity}`);
    }
    identities.add(row.canonical_identity);

    if (
      row.admission_tier !== "PRIMARY" ||
      row.extraction_decision !== "EXTRACT" ||
      row.extraction_authorized_by_canonical_selection !== true ||
      row.downstream_default !== true
    ) {
      throw new Error(`PHASE1_AGENT_1B_BLOCKED_AUDIT_ONLY_ROW:${row.manifest_id}`);
    }
    if (!CLEAN_EXTRACTION_DISPOSITIONS.has(row.final_url_disposition)) {
      throw new Error(`PHASE1_AGENT_1B_BLOCKED_INVALID_FINAL_URL_DISPOSITION:${row.manifest_id}:${row.final_url_disposition || "missing"}`);
    }
    if (["STRUCTURED_COVERAGE_ONLY", "METADATA_ONLY"].includes(row.extraction_scope)) {
      throw new Error(`PHASE1_AGENT_1B_BLOCKED_NON_EXTRACTION_SCOPE:${row.manifest_id}:${row.extraction_scope}`);
    }
    if (
      row.fingerprint_fetch_status !== "FETCHED" ||
      row.fingerprint_extraction_eligible !== true ||
      row.content_materiality?.status !== "MATERIAL_CONTENT" ||
      !row.exact_content_hash ||
      !Array.isArray(row.selected_block_hashes) ||
      row.selected_block_hashes.length === 0
    ) {
      throw new Error(`PHASE1_AGENT_1B_BLOCKED_NON_MATERIAL_CLEAN_ROW:${row.manifest_id}`);
    }
    if (row.final_url_disposition === "EXTRACT_LEGAL_FULL_DOCUMENT" && (!row.legal_doc_candidate || row.extraction_scope !== "FULL_DOCUMENT")) {
      throw new Error(`PHASE1_AGENT_1B_BLOCKED_INVALID_LEGAL_ROW:${row.manifest_id}`);
    }
    if (row.final_url_disposition === "EXTRACT_UNIQUE_BLOCKS" && row.extraction_scope !== "SELECTED_UNIQUE_SECTIONS") {
      throw new Error(`PHASE1_AGENT_1B_BLOCKED_INVALID_UNIQUE_BLOCK_ROW:${row.manifest_id}`);
    }
    if (row.final_url_disposition === "EXTRACT_CANONICAL_FULL" && row.extraction_scope !== "FULL_MAIN_CONTENT") {
      throw new Error(`PHASE1_AGENT_1B_BLOCKED_INVALID_CANONICAL_ROW:${row.manifest_id}`);
    }
  }

  return {
    ok: true,
    clean_manifest_rows: manifest.manifest_sources.length,
    unique_canonical_identities: identities.size
  };
}
