import {
  displayBoolean,
  displayControlOutcome,
  displayLane,
  displayPainTier,
  displayStatus,
  displayVelocity,
  severityRank,
  urgencyRank
} from "./reportTerminologyMap.js";

const VALID_STATUSES = new Set(["TRIGGERED", "CONTROLLED", "NOT_TRIGGERED", "NOT_APPLICABLE", "INSUFFICIENT_EVIDENCE"]);

function asText(value, fallback = "") {
  const text = String(value ?? "").trim();
  return text || fallback;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function safeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value) ? value : {};
}

function threatId(entry) {
  return asText(entry?.threat_id || entry?.Threat_ID);
}

function registryThreatId(row, index) {
  return asText(row?.threat_id || row?.Threat_ID, `ROW_${index + 1}`);
}

function registryThreatName(row, fallback = "Untitled exposure") {
  return asText(row?.threat_name || row?.Threat_Name, fallback);
}

function surfaceTokens(row) {
  const surface = row?.surface || row?.Surface;
  if (Array.isArray(surface?.tokens)) return surface.tokens.map((token) => asText(token)).filter(Boolean);
  if (Array.isArray(surface)) return surface.map((token) => asText(token)).filter(Boolean);
  const raw = asText(surface?.raw || surface);
  return raw ? raw.split("|").map((token) => token.trim()).filter(Boolean) : [];
}

function authority(row) {
  const source = row?.authority || {};
  return {
    IN: asText(source.IN || row?.Authority_IN),
    EU: asText(source.EU || row?.Authority_EU),
    US: asText(source.US || row?.Authority_US)
  };
}

function pain(row, schema = {}) {
  const source = row?.pain || {};
  const tier = asText(source.tier || row?.Pain_Tier);
  const category = asText(source.category || row?.Pain_Category || schema?.pain_tier_to_category?.[tier], "UNKNOWN");
  const depth = asText(source.depth || row?.Pain_Depth, "Not specified in registry");
  return {
    tier,
    category,
    depth,
    label: displayPainTier(tier, category)
  };
}

function functionalProfile(row) {
  const archetype = row?.archetype || row?.Archetype;
  if (archetype && typeof archetype === "object") {
    return {
      code: asText(archetype.code || archetype.from_id),
      label: asText(archetype.label || archetype.code || archetype.from_id, "Functional profile not specified")
    };
  }
  const code = asText(archetype);
  return { code, label: code || "Functional profile not specified" };
}

function buildRegistryIndex(registryRuntime = {}) {
  const rows = asArray(registryRuntime?.threats);
  return new Map(rows.map((row, index) => [registryThreatId(row, index), { row, index }]));
}

function conditionOutcomes(entry) {
  return asArray(entry?.conditions).map((condition) => ({
    criterion_id: asText(condition?.condition_id || condition?.id),
    criterion_text: asText(condition?.condition_text || condition?.text),
    outcome: displayBoolean(condition?.result),
    result: condition?.result === true,
    evidentiary_basis: asText(condition?.basis || condition?.reasoning || condition?.evidence_basis, "No evidentiary basis supplied by evaluation layer.")
  }));
}

function conditionGroups(entry) {
  const outcomes = conditionOutcomes(entry);
  return {
    satisfied: outcomes.filter((item) => item.result),
    not_satisfied: outcomes.filter((item) => !item.result),
    all: outcomes
  };
}

function clientQuestionsFor(item) {
  const questions = [];
  const failed = item.applicability_test?.criteria?.not_satisfied || [];
  for (const criterion of failed.slice(0, 3)) {
    questions.push(`Please confirm whether the following applicability criterion is met in the matter evidence or internal controls: ${criterion.criterion_text || criterion.criterion_id}.`);
  }
  const controlTest = item.applicability_test?.control_exclusion_test;
  if (controlTest) {
    questions.push(`Please provide any policy, clause, workflow, log, approval record, or operational evidence relevant to the control position: ${controlTest}.`);
  }
  if (!questions.length) {
    questions.push(`Please provide the internal documents, customer terms, control evidence, or operational records needed to confirm the assessment for ${item.registry_reference}.`);
  }
  return [...new Set(questions)].slice(0, 4);
}

function exposureMechanism(row) {
  return asText(row?.fp_mechanism || row?.FP_Mechanism, "The reviewed evidence activated this registry item, but the registry mechanism text is not specified.");
}

function legalSignificance(row) {
  return asText(row?.legal_pain || row?.Legal_Pain, "Legal significance is not specified in the registry row.");
}

function commercialImpact(row) {
  return asText(row?.fp_impact || row?.FP_Impact, "Commercial or deal impact is not specified in the registry row.");
}

function remediationPath(row) {
  return asText(row?.fix_route || row?.Lex_Nova_Fix, "Suggested remediation path is not specified in the registry row.");
}

function applicabilityTest(row, entry) {
  const hunter = safeObject(row?.hunter_trigger || row?.Hunter_Trigger);
  const groups = conditionGroups(entry);
  return {
    criteria: groups,
    finding_threshold: asText(hunter.trigger_if || entry?.trigger_if || "Registry finding threshold not supplied."),
    finding_threshold_outcome: displayBoolean(entry?.trigger_if_result),
    control_exclusion_test: asText(hunter.exclude_if || entry?.exclude_if || "Registry control / exclusion test not supplied."),
    control_test_outcome: displayControlOutcome(entry?.exclude_if_result),
    raw_registry_test: asText(hunter.raw || row?.Hunter_Trigger)
  };
}

function buildHydratedRow({ entry, row, index, schema }) {
  const id = threatId(entry) || registryThreatId(row, index);
  const finalStatus = asText(entry?.final_status, "UNKNOWN");
  const registryPain = pain(row, schema);
  const profile = functionalProfile(row);
  const surfaces = surfaceTokens(row);
  const auth = authority(row);
  const item = {
    entry_number: Number.isInteger(entry?.entry_number) ? entry.entry_number : index + 1,
    registry_reference: id,
    exposure_title: registryThreatName(row, asText(entry?.threat_name, id)),
    assessment_outcome: displayStatus(finalStatus),
    assessment_status: finalStatus,
    use_context: displayLane(row?.lane || row?.Lane),
    functional_profile: profile,
    legal_risk_surfaces: surfaces,
    jurisdictional_references: auth,
    timing_urgency: {
      raw: asText(row?.velocity || row?.Velocity),
      label: displayVelocity(row?.velocity || row?.Velocity)
    },
    severity: registryPain,
    registry_status: asText(row?.status || row?.Status, "Not specified in registry"),
    effective_review_date: asText(row?.effective_date || row?.Effective_Date, "Not specified in registry"),
    legal_significance: legalSignificance(row),
    exposure_mechanism: exposureMechanism(row),
    commercial_deal_impact: commercialImpact(row),
    suggested_remediation_path: remediationPath(row),
    reviewed_evidence: {
      evidence_reference: asText(entry?.evidence_ref, "No evidence reference supplied by evaluation layer."),
      feature_references: asArray(entry?.feature_refs).map((ref) => asText(ref)).filter(Boolean),
      reasoning_summary: asText(entry?.reasoning_summary)
    },
    applicability_test: applicabilityTest(row, entry),
    control_position: displayControlOutcome(entry?.exclude_if_result),
    residual_exposure:
      finalStatus === "TRIGGERED"
        ? "The finding threshold was met, and the reviewed evidence did not establish a control sufficient to exclude the exposure."
        : finalStatus === "CONTROLLED"
          ? "The exposure was reviewed and a public or admitted control was evidenced for this registry item."
          : finalStatus === "INSUFFICIENT_EVIDENCE"
            ? "The reviewed evidence was not sufficient to determine this exposure item conclusively."
            : "No open exposure is recorded for this item on the reviewed evidence.",
    clarification_points: [],
    counsel_review_note: "Qualified counsel should verify jurisdiction-specific treatment and whether internal controls not visible in the reviewed evidence change this assessment.",
    registry_basis: asText(row?.provenance || row?.Provenance, "Registry basis not specified."),
    registry_payload_available: Boolean(row)
  };
  item.clarification_points = clientQuestionsFor(item);
  return item;
}

export function statusCounts(rows = []) {
  return rows.reduce((acc, row) => {
    const status = asText(row?.final_status || row?.assessment_status, "UNKNOWN");
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});
}

export function hydrateRegistryReportRows({ registryRuntime, postChallengeLedger }) {
  const schema = registryRuntime?.schema || {};
  const registryIndex = buildRegistryIndex(registryRuntime);
  const ledger = asArray(postChallengeLedger);
  const hydrated = ledger.map((entry, index) => {
    const id = threatId(entry);
    const matched = registryIndex.get(id);
    return buildHydratedRow({ entry, row: matched?.row || {}, index: matched?.index ?? index, schema });
  });

  const byStatus = {
    identified_exposures: hydrated.filter((item) => item.assessment_status === "TRIGGERED"),
    control_evidenced_items: hydrated.filter((item) => item.assessment_status === "CONTROLLED"),
    clarification_required_items: hydrated.filter((item) => item.assessment_status === "INSUFFICIENT_EVIDENCE"),
    no_finding_items: hydrated.filter((item) => item.assessment_status === "NOT_TRIGGERED"),
    outside_scope_items: hydrated.filter((item) => item.assessment_status === "NOT_APPLICABLE")
  };

  const sortedIdentified = [...byStatus.identified_exposures].sort((a, b) => {
    const severityDelta = severityRank(a.severity.tier) - severityRank(b.severity.tier);
    if (severityDelta) return severityDelta;
    const urgencyDelta = urgencyRank(a.timing_urgency.raw) - urgencyRank(b.timing_urgency.raw);
    if (urgencyDelta) return urgencyDelta;
    return a.entry_number - b.entry_number;
  });

  return {
    rows: hydrated,
    ...byStatus,
    sorted_identified_exposures: sortedIdentified,
    status_counts: statusCounts(ledger),
    registry_count: asArray(registryRuntime?.threats).length || ledger.length,
    valid_statuses: [...VALID_STATUSES]
  };
}
