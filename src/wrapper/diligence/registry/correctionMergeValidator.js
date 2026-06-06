import registryRuntime from "../../../../data/runtime/registry.runtime.json";
import { getRegistryThreatIds } from "./registryBatcher.js";

function threatIdFromEntry(entry) {
  return String(entry?.threat_id || entry?.Threat_ID || "").trim();
}

function getCorrectedEntries(operatorChallengeResult) {
  if (Array.isArray(operatorChallengeResult?.corrected_ledger_entries)) {
    return operatorChallengeResult.corrected_ledger_entries;
  }

  if (Array.isArray(operatorChallengeResult?.operator_challenge_result?.corrected_ledger_entries)) {
    return operatorChallengeResult.operator_challenge_result.corrected_ledger_entries;
  }

  return [];
}

function getChallengeGate(operatorChallengeResult) {
  return operatorChallengeResult?.operator_challenge_gate || operatorChallengeResult?.operator_challenge_result?.operator_challenge_gate || null;
}

function getDuplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();

  values.forEach((value) => {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  });

  return [...duplicates];
}

function compareThreatIds(expectedIds, actualIds) {
  const expected = new Set(expectedIds);
  const actual = new Set(actualIds);

  return {
    missing: expectedIds.filter((id) => !actual.has(id)),
    unexpected: actualIds.filter((id) => !expected.has(id)),
    duplicates: getDuplicateValues(actualIds)
  };
}

function validateLedgerEntry(entry) {
  const threatId = threatIdFromEntry(entry);
  const errors = [];

  if (!threatId) errors.push("missing threat_id");
  if (!entry?.threat_name) errors.push(`${threatId || "unknown"}: missing threat_name`);
  if (!Number.isInteger(entry?.entry_number) || entry.entry_number < 1) errors.push(`${threatId || "unknown"}: invalid entry_number`);
  if (!Array.isArray(entry?.conditions)) errors.push(`${threatId || "unknown"}: conditions must be an array`);
  if (typeof entry?.trigger_if_result !== "boolean") errors.push(`${threatId || "unknown"}: trigger_if_result must be boolean`);
  if (typeof entry?.exclude_if_result !== "boolean") errors.push(`${threatId || "unknown"}: exclude_if_result must be boolean`);
  if (!entry?.final_status) errors.push(`${threatId || "unknown"}: missing final_status`);
  if (!Array.isArray(entry?.feature_refs)) errors.push(`${threatId || "unknown"}: feature_refs must be an array`);
  if (typeof entry?.evidence_ref !== "string") errors.push(`${threatId || "unknown"}: evidence_ref must be string`);
  if (typeof entry?.reasoning_summary !== "string") errors.push(`${threatId || "unknown"}: reasoning_summary must be string`);

  return errors;
}

export function applyOperatorChallengeCorrections({ mergedLedger, operatorChallengeResult, registry = registryRuntime }) {
  if (!Array.isArray(mergedLedger) || !mergedLedger.length) {
    throw new Error("applyOperatorChallengeCorrections requires a non-empty mergedLedger array.");
  }

  const challengeGate = getChallengeGate(operatorChallengeResult);
  const correctedEntries = getCorrectedEntries(operatorChallengeResult);
  const registryThreatIds = getRegistryThreatIds(registry);
  const originalThreatIds = mergedLedger.map(threatIdFromEntry).filter(Boolean);
  const ledgerComparison = compareThreatIds(registryThreatIds, originalThreatIds);
  const errors = [];

  if (!challengeGate) errors.push("operator_challenge_gate is missing.");
  if (mergedLedger.length !== registryThreatIds.length) {
    errors.push(`Pre-correction ledger count mismatch: expected ${registryThreatIds.length}, received ${mergedLedger.length}.`);
  }
  if (ledgerComparison.missing.length) errors.push(`Pre-correction ledger missing threat_id(s): ${ledgerComparison.missing.join(", ")}.`);
  if (ledgerComparison.unexpected.length) errors.push(`Pre-correction ledger contains unexpected threat_id(s): ${ledgerComparison.unexpected.join(", ")}.`);
  if (ledgerComparison.duplicates.length) errors.push(`Pre-correction ledger contains duplicate threat_id(s): ${ledgerComparison.duplicates.join(", ")}.`);

  const correctedIds = correctedEntries.map(threatIdFromEntry).filter(Boolean);
  const duplicateCorrections = getDuplicateValues(correctedIds);
  const originalIdSet = new Set(originalThreatIds);
  const unknownCorrections = correctedIds.filter((threatId) => !originalIdSet.has(threatId));
  const correctionEntryErrors = correctedEntries.flatMap(validateLedgerEntry);

  if (duplicateCorrections.length) errors.push(`Duplicate corrected threat_id(s): ${duplicateCorrections.join(", ")}.`);
  if (unknownCorrections.length) errors.push(`Corrected entries contain unknown threat_id(s): ${unknownCorrections.join(", ")}.`);
  if (correctionEntryErrors.length) errors.push(...correctionEntryErrors);

  if (errors.length) {
    return {
      ok: false,
      operator_challenge_gate: challengeGate,
      corrected_count: correctedEntries.length,
      registry_count_loaded: registryThreatIds.length,
      registry_count_evaluated: mergedLedger.length,
      post_challenge_ledger: mergedLedger,
      correction_errors: errors,
      correction_meta: {
        corrected_threat_ids: correctedIds,
        duplicate_corrected_threat_ids: duplicateCorrections,
        unknown_corrected_threat_ids: unknownCorrections,
        pre_correction_missing_threat_ids: ledgerComparison.missing,
        pre_correction_unexpected_threat_ids: ledgerComparison.unexpected,
        pre_correction_duplicate_threat_ids: ledgerComparison.duplicates
      }
    };
  }

  const correctionMap = new Map(correctedEntries.map((entry) => [threatIdFromEntry(entry), entry]));
  const postChallengeLedger = mergedLedger.map((entry) => correctionMap.get(threatIdFromEntry(entry)) || entry);
  const postThreatIds = postChallengeLedger.map(threatIdFromEntry).filter(Boolean);
  const postComparison = compareThreatIds(registryThreatIds, postThreatIds);
  const postErrors = [];

  if (postChallengeLedger.length !== registryThreatIds.length) {
    postErrors.push(`Post-correction ledger count mismatch: expected ${registryThreatIds.length}, received ${postChallengeLedger.length}.`);
  }
  if (postComparison.missing.length) postErrors.push(`Post-correction ledger missing threat_id(s): ${postComparison.missing.join(", ")}.`);
  if (postComparison.unexpected.length) postErrors.push(`Post-correction ledger contains unexpected threat_id(s): ${postComparison.unexpected.join(", ")}.`);
  if (postComparison.duplicates.length) postErrors.push(`Post-correction ledger contains duplicate threat_id(s): ${postComparison.duplicates.join(", ")}.`);

  return {
    ok: postErrors.length === 0,
    operator_challenge_gate: challengeGate,
    corrected_count: correctedEntries.length,
    registry_count_loaded: registryThreatIds.length,
    registry_count_evaluated: postChallengeLedger.length,
    post_challenge_ledger: postChallengeLedger,
    correction_errors: postErrors,
    correction_meta: {
      corrected_threat_ids: correctedIds,
      duplicate_corrected_threat_ids: duplicateCorrections,
      unknown_corrected_threat_ids: unknownCorrections,
      post_correction_missing_threat_ids: postComparison.missing,
      post_correction_unexpected_threat_ids: postComparison.unexpected,
      post_correction_duplicate_threat_ids: postComparison.duplicates
    }
  };
}

export function assertCorrectionMergeValid(correctionResult) {
  if (!correctionResult?.ok) {
    throw new Error(`Operator Challenge correction merge failed: ${(correctionResult?.correction_errors || []).join(" | ")}`);
  }

  return correctionResult;
}
