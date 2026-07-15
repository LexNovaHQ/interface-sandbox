import {
  FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
  validateFeatureCandidateInventoryIndex
} from "../../05-activity-profile-review/services/activity-candidate-inventory-index.builder.js";

export function validateFeatureCandidateCoverage(inventoryInput, profileInput, options = {}) {
  const inventory = unwrapInventory(inventoryInput);
  const profile = profileInput?.target_feature_profile || profileInput || {};
  const failures = [...validateFeatureCandidateInventoryIndex(inventory).failures];

  if (!Array.isArray(profile.activities)) failures.push("target_feature_profile.activities must be array");
  if (failures.length) return coverageResult("FAIL", failures, [], []);

  const candidateIds = new Set((inventory.candidates || []).map((candidate) => candidate.candidate_id));
  const activityRefs = new Set((profile.activities || []).map((activity) => activity.activity_reference).filter(Boolean));
  const covered = new Set();
  const coverageRows = [];

  const add = (candidateId, activityReference, disposition, path, reason = "") => {
    if (!candidateId) {
      failures.push(`${path}:candidate_id_missing`);
      return;
    }
    if (!candidateIds.has(candidateId)) {
      failures.push(`${path}:unknown_candidate:${candidateId}`);
      return;
    }
    if (activityReference && !activityRefs.has(activityReference)) {
      failures.push(`${path}:unknown_activity:${activityReference}`);
    }
    covered.add(candidateId);
    coverageRows.push({
      candidate_id: candidateId,
      activity_reference: activityReference || null,
      coverage_disposition: disposition || "DIRECT_ACTIVITY_ROW",
      coverage_path: path,
      reason
    });
  };

  for (const activity of profile.activities || []) {
    for (const candidateId of activity.source_candidate_ids || []) {
      add(candidateId, activity.activity_reference, activity.coverage_disposition, "activity.source_candidate_ids");
    }
  }

  for (const row of options.coverageLedger || options.candidate_to_activity_coverage_ledger || []) {
    add(
      row.candidate_id || row.source_candidate_id || row.canonical_candidate_id,
      row.activity_reference,
      row.coverage_disposition || row.disposition,
      "candidate_to_activity_coverage_ledger",
      row.reason || ""
    );
  }

  for (const row of options.exclusionLedger || options.candidate_exclusion_ledger || []) {
    if (!row.reason && !row.exclusion_reason) continue;
    add(
      row.candidate_id || row.source_candidate_id,
      null,
      row.disposition || "EXCLUDED_NON_PRODUCT_ACTIVITY",
      "candidate_exclusion_ledger",
      row.reason || row.exclusion_reason
    );
  }

  const uncovered = (inventory.candidates || []).filter((candidate) => !covered.has(candidate.candidate_id));
  for (const candidate of uncovered) {
    failures.push(`uncovered candidate:${candidate.candidate_id}:${candidate.candidate_name}`);
  }

  return coverageResult(failures.length ? "FAIL" : "PASS", failures, uncovered, coverageRows);
}

export function buildM8FeatureCoverageForensics(inventoryInput, profileInput, options = {}) {
  const inventory = unwrapInventory(inventoryInput);
  const validation = options.coverageResult || validateFeatureCandidateCoverage(inventory, profileInput, options);

  return Object.freeze({
    feature_candidate_inventory_ref: Object.freeze({
      artifact_name: FEATURE_CANDIDATE_INVENTORY_ARTIFACT,
      inventory_version: inventory?.inventory_version || "",
      run_id: inventory?.run_id || "",
      canonical_candidate_count: inventory?.canonical_candidate_count || 0,
      raw_hit_count: inventory?.raw_hit_count || 0,
      source_of_truth: true
    }),
    raw_feature_hit_derivation_ledger: Object.freeze((inventory?.raw_feature_hit_index || []).map(({
      raw_hit_id,
      raw_type,
      source_pointer,
      evidence_unit_ref
    }) => Object.freeze({ raw_hit_id, raw_type, source_pointer, evidence_unit_ref }))),
    canonicalization_derivation_ledger: Object.freeze(inventory?.canonicalization_index || []),
    dedup_decision_ledger: Object.freeze(inventory?.dedup_index || []),
    parent_child_overlap_ledger: Object.freeze(validation.coverage_rows || []),
    validation_result: validation
  });
}

function coverageResult(status, failures, uncovered, coverageRows) {
  return Object.freeze({
    coverage_result: status,
    failures: Object.freeze([...failures]),
    uncovered_candidates: Object.freeze(uncovered.map(({
      candidate_id,
      candidate_name,
      candidate_type,
      canonical_feature_key
    }) => Object.freeze({ candidate_id, candidate_name, candidate_type, canonical_feature_key }))),
    coverage_rows: Object.freeze(coverageRows.map((row) => Object.freeze({ ...row }))),
    repair_required: status !== "PASS"
  });
}

function unwrapInventory(input) {
  return input?.feature_candidate_inventory || input || {};
}
