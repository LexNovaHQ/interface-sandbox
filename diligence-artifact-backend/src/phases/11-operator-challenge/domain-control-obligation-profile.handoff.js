import {
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS,
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
  DOMAIN_CONTROL_OBLIGATION_M12_HANDOFF_FIELDS,
  assertAcceptedDomainControlObligationHandoffStatus
} from "../08-domain-control-obligation-profile/domain-control-obligation-downstream-handoff.contract.js";

const SOURCE_ARTIFACT = "domain_control_obligation_profile";
const ALLOWED_SOURCE_LAYERS = new Set(["PRIMARY", "CAPABILITY_OVERLAY"]);
const ALLOWED_MECHANISM = new Set(["VISIBLE", "NOT_VISIBLE", "UNCLEAR"]);
const ALLOWED_POSTURE = new Set(["VISIBLE", "PARTIAL", "NOT_VISIBLE", "UNRESOLVED"]);
const FORBIDDEN_CONCLUSION_PATTERNS = Object.freeze([
  /\b(?:is|are|was|were|remains?)\s+(?:fully\s+)?compliant\b/i,
  /\b(?:is|are|was|were|remains?)\s+non[- ]compliant\b/i,
  /\b(?:is|are|was|were)\s+in\s+breach\b/i,
  /\bregulator\s+has\s+jurisdiction\b/i,
  /\blicen[cs]e\s+(?:is|was)\s+(?:legally\s+)?(?:required|valid|invalid)\b/i,
  /\blegally\s+adequate\b/i,
  /\bliability\s+(?:is|was)\s+(?:established|confirmed)\b/i
]);

export const M12_DOMAIN_CONTROL_OBLIGATION_HANDOFF_STATUS = Object.freeze({
  handoff: "phase8-domain-control-obligation-to-m12",
  handoff_version: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
  consumer: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.operatorChallenge,
  challenge_only: true,
  rederivation_allowed: false,
  rewrite_allowed: false,
  model_usage: "NONE_DETERMINISTIC"
});

export function buildM12DomainControlObligationChallenge({
  domainControlObligationProfile,
  sourceLockStatus = "LOCKED"
} = {}) {
  const criticalFailures = [];
  const warnings = [];
  let lockStatus = "";

  try {
    lockStatus = assertAcceptedDomainControlObligationHandoffStatus(sourceLockStatus);
  } catch (error) {
    criticalFailures.push(error.message);
  }

  const profile = unwrapArtifact(domainControlObligationProfile, SOURCE_ARTIFACT);
  if (!isPlainObject(profile)) {
    criticalFailures.push("DOMAIN_CONTROL_OBLIGATION_PROFILE_MISSING");
    return receipt({ criticalFailures, warnings, lockStatus });
  }
  if (profile.artifact_type !== SOURCE_ARTIFACT) criticalFailures.push(`DOMAIN_CONTROL_OBLIGATION_ARTIFACT_TYPE_MISMATCH:${profile.artifact_type || "missing"}`);
  if (!Array.isArray(profile.obligations)) criticalFailures.push("DOMAIN_CONTROL_OBLIGATION_ROWS_MISSING");

  const rows = Array.isArray(profile.obligations) ? profile.obligations : [];
  if (Number(profile.obligation_count) !== rows.length) criticalFailures.push(`DOMAIN_CONTROL_OBLIGATION_COUNT_MISMATCH:${profile.obligation_count}:${rows.length}`);
  if (lockStatus === "LOCKED_WITH_LIMITATIONS") warnings.push("PHASE8_PROFILE_LOCKED_WITH_LIMITATIONS");
  for (const limitation of uniqueStrings(profile.profile_level_limitations || [])) warnings.push(`PHASE8_PROFILE_LIMITATION:${limitation}`);

  const seenCandidateIds = new Set();
  const seenScopedObligations = new Set();
  const challengedRows = [];

  rows.forEach((row, index) => {
    const path = `obligations[${index}]`;
    const rowFindings = challengeRow(row, path);
    criticalFailures.push(...rowFindings.critical_failures);
    warnings.push(...rowFindings.warnings);

    const candidateId = normalizeId(row?.candidate_id);
    const scopedId = `${normalizeId(row?.source_package_id)}:${normalizeId(row?.obligation_id)}`;
    if (!candidateId) criticalFailures.push(`${path}.candidate_id missing`);
    else if (seenCandidateIds.has(candidateId)) criticalFailures.push(`${path}.candidate_id duplicate:${candidateId}`);
    seenCandidateIds.add(candidateId);

    if (!normalizeId(row?.obligation_id) || !normalizeId(row?.source_package_id)) criticalFailures.push(`${path} obligation identity incomplete`);
    else if (seenScopedObligations.has(scopedId)) criticalFailures.push(`${path} duplicate package-scoped obligation:${scopedId}`);
    seenScopedObligations.add(scopedId);

    challengedRows.push({
      candidate_id: candidateId,
      obligation_id: normalizeId(row?.obligation_id),
      challenge_categories: rowFindings.challenge_categories,
      warning_count: rowFindings.warnings.length,
      critical_failure_count: rowFindings.critical_failures.length,
      profile_rederived: false,
      profile_rewritten: false
    });
  });

  return receipt({ criticalFailures, warnings, lockStatus, challengedRows, profile });
}

function challengeRow(row, path) {
  const criticalFailures = [];
  const warnings = [];
  const challengeCategories = [];

  if (!isPlainObject(row)) {
    criticalFailures.push(`${path} must be object`);
    return { critical_failures: criticalFailures, warnings, challenge_categories: ["MALFORMED_ROW"] };
  }

  for (const field of DOMAIN_CONTROL_OBLIGATION_M12_HANDOFF_FIELDS) {
    if (!Object.prototype.hasOwnProperty.call(row, field)) criticalFailures.push(`${path}.${field} missing`);
  }

  if (!ALLOWED_SOURCE_LAYERS.has(row.source_layer)) {
    criticalFailures.push(`${path}.source_layer forbidden:${row.source_layer || "missing"}`);
    challengeCategories.push("UNSUPPORTED_OBLIGATION_LINKAGE");
  }
  if (!(row.linked_activity_references || []).length || !(row.matched_behavior_codes || []).length || !(row.matched_surface_tokens || []).length) {
    warnings.push(`${path} obligation linkage is incomplete`);
    challengeCategories.push("UNSUPPORTED_OBLIGATION_LINKAGE");
  }

  if (!ALLOWED_MECHANISM.has(row.control_mechanism_present)) criticalFailures.push(`${path}.control_mechanism_present invalid`);
  if (!ALLOWED_POSTURE.has(row.control_posture_status)) criticalFailures.push(`${path}.control_posture_status invalid`);
  if (!posturePairAllowed(row.control_mechanism_present, row.control_posture_status)) {
    criticalFailures.push(`${path} control mechanism/posture contradiction`);
    challengeCategories.push("CONTROL_POSTURE_OVERSTATEMENT");
  }

  const missingProof = uniqueStrings(row.missing_proof || []);
  const limitations = uniqueStrings(row.limitation || []);
  if (["PARTIAL", "NOT_VISIBLE", "UNRESOLVED"].includes(row.control_posture_status) && !missingProof.length && !limitations.length) {
    warnings.push(`${path} non-visible or unresolved posture hides missing proof`);
    challengeCategories.push("HIDDEN_MISSING_PROOF");
  }
  if (["NOT_VISIBLE", "UNCLEAR"].includes(row.control_mechanism_present) && !missingProof.length && !limitations.length) {
    warnings.push(`${path} control mechanism status lacks missing-proof or limitation disclosure`);
    challengeCategories.push("CONTROL_POSTURE_OVERSTATEMENT");
  }
  if (row.control_mechanism_present === "VISIBLE" && row.control_posture_status === "VISIBLE" && !(row.evidence_basis || []).length) {
    warnings.push(`${path} visible control posture lacks evidence basis`);
    challengeCategories.push("CONTROL_POSTURE_OVERSTATEMENT");
  }

  const authority = new Set(uniqueStrings(row.authority_dependency || []));
  if (!authority.size && !limitations.length) {
    warnings.push(`${path} authority dependency is empty without limitation`);
    challengeCategories.push("AUTHORITY_DEPENDENCY_OVERSTATEMENT");
  }

  for (const [index, overlay] of normalizeArray(row.regulatory_overlay_refs).entries()) {
    const overlayPath = `${path}.regulatory_overlay_refs[${index}]`;
    if (!isPlainObject(overlay)) {
      criticalFailures.push(`${overlayPath} must be object`);
      challengeCategories.push("REGULATORY_OVERLAY_MISUSE");
      continue;
    }
    if (overlay.overlay_status !== "CANDIDATE_ONLY") {
      criticalFailures.push(`${overlayPath}.overlay_status must be CANDIDATE_ONLY`);
      challengeCategories.push("REGULATORY_OVERLAY_MISUSE");
    }
    for (const framework of uniqueStrings(overlay.matched_frameworks || [])) {
      if (!authority.has(framework)) {
        criticalFailures.push(`${overlayPath} framework not present in authority_dependency:${framework}`);
        challengeCategories.push("REGULATORY_OVERLAY_MISUSE");
      }
    }
  }

  if (containsForbiddenConclusion(pick(row, DOMAIN_CONTROL_OBLIGATION_M12_HANDOFF_FIELDS))) {
    criticalFailures.push(`${path} contains forbidden legal/compliance conclusion`);
    challengeCategories.push("AUTHORITY_DEPENDENCY_OVERSTATEMENT");
  }

  return {
    critical_failures: criticalFailures,
    warnings,
    challenge_categories: [...new Set(challengeCategories)]
  };
}

function receipt({ criticalFailures, warnings, lockStatus, challengedRows = [], profile = {} }) {
  const status = criticalFailures.length ? "REPAIR_REQUIRED" : warnings.length ? "LOCKED_WITH_LIMITATIONS" : "LOCKED";
  return deepFreeze({
    phase8_domain_control_obligation_challenge: {
      status,
      gate: criticalFailures.length ? "REPAIR_REQUIRED" : warnings.length ? "PASS_WITH_LIMITATIONS" : "PASS",
      handoff_version: DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_VERSION,
      source_artifact: SOURCE_ARTIFACT,
      source_lock_status: lockStatus || "UNACCEPTED",
      source_obligation_count: Array.isArray(profile.obligations) ? profile.obligations.length : 0,
      challenge_only: true,
      profile_rederived: false,
      profile_rewritten: false,
      challenged_rows: challengedRows,
      critical_failures: uniqueStrings(criticalFailures),
      warnings: uniqueStrings(warnings),
      challenge_scope: [
        "UNSUPPORTED_OBLIGATION_LINKAGE",
        "CONTROL_POSTURE_OVERSTATEMENT",
        "AUTHORITY_DEPENDENCY_OVERSTATEMENT",
        "HIDDEN_MISSING_PROOF",
        "REGULATORY_OVERLAY_MISUSE"
      ],
      model_usage: "NONE_DETERMINISTIC"
    }
  });
}

function posturePairAllowed(mechanism, posture) {
  const allowed = {
    VISIBLE: new Set(["VISIBLE", "PARTIAL", "UNRESOLVED"]),
    NOT_VISIBLE: new Set(["NOT_VISIBLE", "UNRESOLVED"]),
    UNCLEAR: new Set(["PARTIAL", "UNRESOLVED"])
  };
  return !allowed[mechanism] || allowed[mechanism].has(posture);
}

function containsForbiddenConclusion(value) {
  let found = false;
  visit(value, (item) => {
    if (!found && typeof item === "string" && FORBIDDEN_CONCLUSION_PATTERNS.some((pattern) => pattern.test(item))) found = true;
  });
  return found;
}

function visit(value, fn, seen = new Set()) {
  fn(value);
  if (!value || typeof value !== "object" || seen.has(value)) return;
  seen.add(value);
  if (Array.isArray(value)) value.forEach((item) => visit(item, fn, seen));
  else Object.values(value).forEach((item) => visit(item, fn, seen));
}

function pick(value, fields) {
  return Object.fromEntries(fields.map((field) => [field, value?.[field]]));
}

function unwrapArtifact(value, artifactName) {
  if (isPlainObject(value?.[artifactName])) return value[artifactName];
  if (value?.artifact_type === artifactName) return value;
  if (isPlainObject(value?.artifact)) return unwrapArtifact(value.artifact, artifactName);
  return value || {};
}

function normalizeArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function uniqueStrings(value) {
  return [...new Set(normalizeArray(value).flat(Infinity).map(normalizeId).filter(Boolean))];
}

function normalizeId(value) {
  return String(value ?? "").trim();
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function deepFreeze(value, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return value;
  seen.add(value);
  for (const child of Object.values(value)) deepFreeze(child, seen);
  return Object.freeze(value);
}
