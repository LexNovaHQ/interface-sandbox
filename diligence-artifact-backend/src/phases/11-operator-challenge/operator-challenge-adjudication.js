import { createHash } from "node:crypto";

export const OPERATOR_CHALLENGE_LAYER3_VERSION = "PHASE11_LAYER3_DETERMINISTIC_ADJUDICATION_v1";
export const OPERATOR_CHALLENGE_REINVESTIGATION_VERSION = "operator_challenge_reinvestigation_ledger.v1";
export const OPERATOR_CHALLENGE_GATE_VERSION = "challenge_gate.v4.operator_challenge";

const CRITICAL_TYPES = new Set([
  "REQUIRED_ARTIFACT_MISSING",
  "REQUIRED_ARTIFACT_UNUSABLE",
  "FORENSIC_INPUT_BOUNDARY_BREACH",
  "PHASE10_COMPOUND_CUSTODY_MISMATCH",
  "MATERIAL_PROFILE_OVERLAP"
]);
const MATERIAL_RECOMMENDATIONS = new Set(["MATERIAL_REINVESTIGATION", "CRITICAL_REVIEW_CANDIDATE"]);
const SAFE_FINAL_STATUSES = new Set(["PASS", "PASS_WITH_LIMITATION"]);

export function buildOperatorChallengeLayer3({ inventory, semanticLedger, priorChallengeGate = null, run = {} } = {}) {
  assertInputs(inventory, semanticLedger);
  const priorLedger = normalizePriorLedger(priorChallengeGate);
  const candidateById = new Map(inventory.challenge_candidates.map((row) => [row.challenge_candidate_id, row]));
  const semanticById = new Map(semanticLedger.challenge_reviews.map((row) => [row.challenge_candidate_id, row]));
  const adjudications = [];
  const confirmedCriticalFailures = [];
  const advisoryWarnings = [];
  const rejectedChallenges = [];
  const reinvestigationEntries = [];

  for (const candidateId of inventory.challenge_candidates.map((row) => row.challenge_candidate_id)) {
    const candidate = candidateById.get(candidateId);
    const semantic = semanticById.get(candidateId);
    const deterministicCritical = candidate.candidate_class === "CRITICAL_SUBSTRATE_CANDIDATE" && CRITICAL_TYPES.has(candidate.challenge_type);
    let disposition;

    if (deterministicCritical) {
      disposition = "CRITICAL_FAILURE";
      confirmedCriticalFailures.push(issue(candidate, semantic, "CRITICAL_FAILURE"));
    } else if (semantic.recommended_disposition === "REJECT") {
      disposition = "REJECTED_CHALLENGE";
      rejectedChallenges.push(issue(candidate, semantic, disposition));
    } else if (candidate.candidate_class === "ADVISORY_CANDIDATE" || semantic.recommended_disposition === "ADVISORY") {
      disposition = "ADVISORY_WARNING";
      advisoryWarnings.push(issue(candidate, semantic, disposition));
    } else if (MATERIAL_RECOMMENDATIONS.has(semantic.recommended_disposition) || candidate.candidate_class === "MATERIAL_FIELD_CANDIDATE") {
      const entry = buildReinvestigationEntry({ candidate, semantic, priorEntry: priorLedger.get(candidateId) });
      reinvestigationEntries.push(entry);
      disposition = entry.final_disposition;
      if (entry.final_disposition === "UNRESOLVED_AFTER_REINVESTIGATION") advisoryWarnings.push(issue(candidate, semantic, "UNRESOLVED_AFTER_REINVESTIGATION", entry));
    } else {
      disposition = "ADVISORY_WARNING";
      advisoryWarnings.push(issue(candidate, semantic, disposition));
    }

    adjudications.push({
      challenge_candidate_id: candidateId,
      deterministic_disposition: disposition,
      semantic_recommendation: semantic.recommended_disposition,
      semantic_confidence: semantic.confidence,
      criticality_confirmed_by_backend: disposition === "CRITICAL_FAILURE",
      reinvestigation_required: disposition === "REINVESTIGATION_REQUIRED",
      final_conclusion_authority: "DETERMINISTIC_LAYER3"
    });
  }

  const pending = reinvestigationEntries.filter((row) => row.final_disposition === "REINVESTIGATION_REQUIRED");
  const exhausted = reinvestigationEntries.filter((row) => row.final_disposition === "UNRESOLVED_AFTER_REINVESTIGATION");
  const resolved = reinvestigationEntries.filter((row) => row.final_disposition === "RESOLVED_AFTER_REINVESTIGATION");
  const gateStatus = confirmedCriticalFailures.length
    ? "CONTROLLED_FAILURE"
    : pending.length
      ? "REINVESTIGATION_REQUIRED"
      : advisoryWarnings.length || exhausted.length
        ? "PASS_WITH_LIMITATION"
        : "PASS";
  const runtimeLockStatus = gateStatus === "CONTROLLED_FAILURE"
    ? "CONTROLLED_FAILURE"
    : gateStatus === "REINVESTIGATION_REQUIRED"
      ? "CREATED"
      : gateStatus === "PASS_WITH_LIMITATION"
        ? "LOCKED_WITH_LIMITATIONS"
        : "LOCKED";

  const reinvestigationLedger = {
    schema_version: OPERATOR_CHALLENGE_REINVESTIGATION_VERSION,
    run_id: String(run.run_id || inventory.run_id || ""),
    inventory_fingerprint: inventory.inventory_fingerprint,
    semantic_output_fingerprint: semanticLedger.semantic_output_fingerprint,
    maximum_attempts_per_field: 2,
    blocking_is_exception: true,
    only_critical_failure_blocks: true,
    entries: reinvestigationEntries,
    pending_count: pending.length,
    exhausted_with_warning_count: exhausted.length,
    resolved_count: resolved.length,
    ledger_fingerprint: sha(reinvestigationEntries)
  };

  const challengeGate = {
    schema_version: OPERATOR_CHALLENGE_GATE_VERSION,
    layer_version: OPERATOR_CHALLENGE_LAYER3_VERSION,
    status: gateStatus,
    lock_status: gateStatus,
    runtime_lock_status: runtimeLockStatus,
    gate: gateStatus,
    generated_by: "phase11_layer3_deterministic_adjudication_reinvestigation_gate",
    run_id: String(run.run_id || inventory.run_id || ""),
    target: inventory.target || run.target || null,
    delivery_mode: "DERIVED_ONLY",
    forensic_inputs_used: false,
    blocking_is_exception: true,
    only_critical_failure_blocks: true,
    material_field_problem_is_blocking: false,
    maximum_reinvestigation_attempts: 2,
    unresolved_after_two_attempts: "PASS_WITH_LIMITATION",
    layer_status: { layer_1: "COMPLETE", layer_2: "COMPLETE", layer_3: "COMPLETE" },
    operator_challenge_inventory: inventory,
    operator_challenge_semantic_ledger: semanticLedger,
    operator_challenge_reinvestigation_ledger: reinvestigationLedger,
    adjudications,
    confirmed_critical_failures: confirmedCriticalFailures,
    advisory_warnings: advisoryWarnings,
    rejected_challenges: rejectedChallenges,
    compiler_handoff_allowed: SAFE_FINAL_STATUSES.has(gateStatus),
    reinvestigation_dispatch_required: pending.length > 0,
    reinvestigation_directives: pending.map((row) => row.directive),
    next_phase: SAFE_FINAL_STATUSES.has(gateStatus) ? "NORMALIZED_COMPILER" : "M12",
    final_gate_fingerprint: sha({ inventory: inventory.inventory_fingerprint, semantic: semanticLedger.semantic_output_fingerprint, adjudications, reinvestigationEntries, gateStatus })
  };

  return { challenge_gate: challengeGate, runtime_lock_status: runtimeLockStatus };
}

function buildReinvestigationEntry({ candidate, semantic, priorEntry }) {
  const priorAttempts = Array.isArray(priorEntry?.attempts) ? priorEntry.attempts.slice(0, 2) : [];
  const successful = priorAttempts.find((attempt) => attempt?.result === "RESOLVED" && attempt?.validated === true);
  const attemptsUsed = priorAttempts.length;
  let finalDisposition = "REINVESTIGATION_REQUIRED";
  if (successful) finalDisposition = "RESOLVED_AFTER_REINVESTIGATION";
  else if (attemptsUsed >= 2) finalDisposition = "UNRESOLVED_AFTER_REINVESTIGATION";
  const nextAttempt = finalDisposition === "REINVESTIGATION_REQUIRED" ? attemptsUsed + 1 : null;
  return {
    challenge_candidate_id: candidate.challenge_candidate_id,
    owning_phase: ownerPhase(semantic.proposed_owner || candidate.proposed_owner),
    artifact_names: unique(candidate.affected_artifacts),
    field_paths: unique(candidate.affected_field_paths),
    affected_registry_row_keys: unique(candidate.affected_registry_row_keys),
    affected_activity_ids: unique(candidate.affected_activity_ids),
    affected_data_field_ids: unique(candidate.affected_data_field_ids),
    affected_obligation_ids: unique(candidate.affected_obligation_ids),
    problem: candidate.contradiction_statement,
    required_reinvestigation: semantic.proposed_reinvestigation_scope || candidate.proposed_reinvestigation_scope,
    attempts: priorAttempts,
    attempts_used: attemptsUsed,
    maximum_attempts: 2,
    next_attempt_number: nextAttempt,
    final_disposition: finalDisposition,
    warning_if_unresolved: semantic.limitation_if_unresolved,
    directive: finalDisposition === "REINVESTIGATION_REQUIRED" ? {
      challenge_candidate_id: candidate.challenge_candidate_id,
      owning_phase: ownerPhase(semantic.proposed_owner || candidate.proposed_owner),
      artifact_names: unique(candidate.affected_artifacts),
      field_paths: unique(candidate.affected_field_paths),
      affected_row_identity: unique([
        ...candidate.affected_registry_row_keys,
        ...candidate.affected_activity_ids,
        ...candidate.affected_data_field_ids,
        ...candidate.affected_obligation_ids
      ]),
      problem: candidate.contradiction_statement,
      required_reinvestigation: semantic.proposed_reinvestigation_scope || candidate.proposed_reinvestigation_scope,
      attempt_number: nextAttempt,
      full_phase_rerun_required: false,
      smallest_affected_unit_only: true
    } : null
  };
}

function normalizePriorLedger(priorChallengeGate) {
  const gate = priorChallengeGate?.challenge_gate || priorChallengeGate?.artifact?.challenge_gate || priorChallengeGate || {};
  const ledger = gate.operator_challenge_reinvestigation_ledger || {};
  return new Map((Array.isArray(ledger.entries) ? ledger.entries : []).map((row) => [row.challenge_candidate_id, row]));
}
function issue(candidate, semantic, disposition, reinvestigation = null) {
  return {
    challenge_candidate_id: candidate.challenge_candidate_id,
    disposition,
    challenge_type: candidate.challenge_type,
    affected_artifacts: unique(candidate.affected_artifacts),
    affected_field_paths: unique(candidate.affected_field_paths),
    affected_registry_row_keys: unique(candidate.affected_registry_row_keys),
    affected_activity_ids: unique(candidate.affected_activity_ids),
    affected_data_field_ids: unique(candidate.affected_data_field_ids),
    affected_obligation_ids: unique(candidate.affected_obligation_ids),
    deterministic_basis: unique(candidate.deterministic_basis),
    semantic_analysis: semantic.adversarial_analysis,
    materiality_analysis: semantic.materiality_analysis,
    limitation_if_unresolved: semantic.limitation_if_unresolved,
    reinvestigation
  };
}
function ownerPhase(value) {
  const text = String(value || "").toUpperCase();
  if (text.includes("PHASE_3")) return "PHASE_3_DOMAIN_DERIVATION";
  if (text.includes("PHASE_5")) return "PHASE_5_ACTIVITY_PROFILE";
  if (text.includes("PHASE_7")) return "PHASE_7_DATA_PROVENANCE";
  if (text.includes("PHASE_8")) return "PHASE_8_DOMAIN_CONTROL_OBLIGATION";
  if (text.includes("PHASE_10")) return "PHASE_10_EXPOSURE_PROFILE";
  if (text.includes("COMPILER")) return "COMPILER_PRESENTATION_ONLY";
  if (text.includes("PHASE_2G")) return "PHASE_2G_ROUTING";
  return "PHASE_11_OPERATOR_CHALLENGE_REVIEW";
}
function assertInputs(inventory, ledger) {
  if (!inventory || inventory.schema_version !== "operator_challenge_inventory.v1") throw new Error("PHASE11_LAYER3_INVENTORY_INVALID");
  if (!ledger || ledger.schema_version !== "operator_challenge_semantic_ledger.v1") throw new Error("PHASE11_LAYER3_SEMANTIC_LEDGER_INVALID");
  if (ledger.inventory_fingerprint !== inventory.inventory_fingerprint) throw new Error("PHASE11_LAYER3_FINGERPRINT_MISMATCH");
  if (!Array.isArray(ledger.challenge_reviews) || ledger.challenge_reviews.length !== inventory.challenge_candidates.length) throw new Error("PHASE11_LAYER3_COVERAGE_MISMATCH");
}
function unique(value) { return [...new Set(Array.isArray(value) ? value.filter(Boolean) : [])]; }
function sha(value) { return createHash("sha256").update(JSON.stringify(value)).digest("hex"); }
