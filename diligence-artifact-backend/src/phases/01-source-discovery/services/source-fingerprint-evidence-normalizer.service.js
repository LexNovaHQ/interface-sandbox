export const PHASE1_FINGERPRINT_EVIDENCE_NORMALIZER_VERSION = "PHASE1_FINGERPRINT_EVIDENCE_NORMALIZER_RB18_v1";

/**
 * A successful HTTP response is not automatically usable evidence. Client-only
 * shells and empty boilerplate-stripped pages must not enter canonical
 * selection as successful fingerprints without a content hash.
 */
export function normaliseSourceFingerprintEvidencePass(fingerprintPass = {}) {
  const inventory = fingerprintPass.inventory;
  if (!inventory || !Array.isArray(inventory.fingerprints)) throw new Error("PHASE1_FINGERPRINT_EVIDENCE_NORMALIZER_INPUT_INVALID");

  let reclassified = 0;
  inventory.fingerprints = inventory.fingerprints.map((item) => {
    if (item.fetch_status !== "FETCHED") return item;
    const complete = Boolean(item.exact_content_hash && item.template_signature && Array.isArray(item.block_hashes));
    if (complete) return item;
    reclassified += 1;
    fingerprintPass.analysis_cache?.delete?.(item.candidate_id);
    return {
      ...item,
      fetch_status: "FETCH_FAILED",
      limitation: "NO_MATERIAL_EVIDENCE_AFTER_BOILERPLATE_REMOVAL",
      producer_reclassification: PHASE1_FINGERPRINT_EVIDENCE_NORMALIZER_VERSION,
      successful_http_response_without_material_evidence: true,
      exact_content_hash: null,
      block_hashes: [],
      near_duplicate_signature: { shingle_size: 3, distinct_shingle_count: 0, sampled_hashes: [] },
      analysis_excerpt: ""
    };
  });

  inventory.status = inventory.fingerprints.some((item) => item.fetch_status === "FETCH_FAILED") ? "COMPLETE_WITH_FETCH_LIMITATIONS" : "COMPLETE";
  inventory.counts = {
    ...(inventory.counts || {}),
    fingerprints_created: inventory.fingerprints.length,
    fetched: inventory.fingerprints.filter((item) => item.fetch_status === "FETCHED").length,
    skipped_by_entity_boundary: inventory.fingerprints.filter((item) => item.fetch_status === "SKIPPED_ENTITY_BOUNDARY").length,
    failed: inventory.fingerprints.filter((item) => item.fetch_status === "FETCH_FAILED").length,
    exact_content_hashes: new Set(inventory.fingerprints.map((item) => item.exact_content_hash).filter(Boolean)).size,
    successful_http_empty_pages_reclassified: reclassified
  };
  inventory.evidence_normalizer_version = PHASE1_FINGERPRINT_EVIDENCE_NORMALIZER_VERSION;
  inventory.http_success_is_not_evidence_success = true;
  return fingerprintPass;
}

export function assertSourceFingerprintEvidenceNormalisation(fingerprintPass = {}) {
  const inventory = fingerprintPass.inventory;
  if (inventory?.evidence_normalizer_version !== PHASE1_FINGERPRINT_EVIDENCE_NORMALIZER_VERSION) throw new Error("PHASE1_FINGERPRINT_EVIDENCE_NORMALIZER_VERSION_INVALID");
  for (const item of inventory.fingerprints || []) {
    if (item.fetch_status === "FETCHED" && (!item.exact_content_hash || !item.template_signature || !Array.isArray(item.block_hashes))) throw new Error(`PHASE1_FINGERPRINT_EMPTY_FETCHED_RECORD_REMAINED:${item.candidate_id}`);
    if (item.successful_http_response_without_material_evidence === true && item.fetch_status !== "FETCH_FAILED") throw new Error(`PHASE1_FINGERPRINT_EMPTY_RESPONSE_STATUS_INVALID:${item.candidate_id}`);
  }
  return { ok: true, reclassified: inventory.counts?.successful_http_empty_pages_reclassified || 0 };
}
