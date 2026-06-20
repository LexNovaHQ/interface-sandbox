import {
  asArray,
  asText,
  compactRegistryLogicReference,
  compactSourceBundleForOperatorChallenge,
  countsByStatus,
  threatId
} from "./liveRunShared.js";

const RUN_REASONS = new Set(["UNI_ALWAYS_RUN", "STAGE5_INT_TRIGGERED", "CONDITIONAL_DOC_REVIEW"]);
const SKIP_REASONS = new Set(["INT_NOT_TRIGGERED"]);
const MODEL_CHALLENGE_CHUNK_SIZE = 12;
const THIN_EVIDENCE_RE = /^(|unknown|none|null|n\/a|evidence_not_pinpointed|row_reinvestigation_unresolved)$/i;
const LAZY_REASON_RE = /^(|not applicable|irrelevant|does not apply|no issue|no evidence|not found|n\/a)$/i;
const FORBIDDEN_EVIDENCE_RE = /\b(search snippet|press|investor|crunchbase|linkedin|wikipedia|prior knowledge|model memory|likely|probably|assume|internal policy|private msa)\b/i;
const ABSENT_RE = /\b(absent|missing|not visible|access_failed|access failed|insufficient|not found|unavailable)\b/i;

function upper(value) { return asText(value).toUpperCase(); }
function lower(value) { return asText(value).toLowerCase(); }
function words(value) { return asText(value).replace(/_/g, " "); }
function textBlob(value) { try { return JSON.stringify(value || {}); } catch { return String(value || ""); } }
function compactString(value, max = 500) { const text = asText(value); return text.length > max ? `${text.slice(0, max)}…` : text; }

function routeMapFromStage7Artifact(stage7Artifact = {}) {
  const map = new Map();
  for (const record of asArray(stage7Artifact.route_records)) {
    const id = asText(record?.threat_id || record?.Threat_ID);
    if (id) map.set(id, record);
  }
  return map;
}

function routeFor(entry = {}, routeMap = new Map()) {
  const id = threatId(entry);
  const route = routeMap.get(id) || entry?._stage7_route || entry?.stage7_route_contract || null;
  const reason = upper(route?.route_reason || (id.startsWith("UNI_") ? "UNI_ALWAYS_RUN" : ""));
  const routeType = upper(route?.route || (RUN_REASONS.has(reason) ? "RUN" : SKIP_REASONS.has(reason) ? "SKIP" : ""));
  return { ...(route || {}), route_reason: reason || route?.route_reason || null, route: routeType || route?.route || null };
}

function isRunRoute(route = {}) { return upper(route.route) === "RUN" || RUN_REASONS.has(upper(route.route_reason)); }
function isSkipRoute(route = {}) { return upper(route.route) === "SKIP" || SKIP_REASONS.has(upper(route.route_reason)); }

function expectedStatus(entry = {}, route = {}) {
  if (isSkipRoute(route)) return "NOT_APPLICABLE";
  if (!isRunRoute(route)) return null;
  if (entry.final_status === "INSUFFICIENT_EVIDENCE") return "INSUFFICIENT_EVIDENCE";
  if (entry.trigger_if_result === true && entry.exclude_if_result === true) return "CONTROLLED";
  if (entry.trigger_if_result === true && entry.exclude_if_result === false) return "TRIGGERED";
  if (entry.trigger_if_result === false) return "NOT_TRIGGERED";
  return "INSUFFICIENT_EVIDENCE";
}

function hasMeaningfulConditions(entry = {}) {
  const conditions = asArray(entry.conditions);
  if (!conditions.length) return false;
  return conditions.some((condition) => {
    const basis = asText(condition?.basis);
    return basis.length >= 20 && !LAZY_REASON_RE.test(lower(basis));
  });
}

function hasThinEvidence(entry = {}) {
  const ref = asText(entry.evidence_ref);
  if (THIN_EVIDENCE_RE.test(ref)) return true;
  if (/^(unknown|fallback|evidence_\d+)$/i.test(ref)) return true;
  return false;
}

function hasLazyReasoning(entry = {}) {
  const reason = asText(entry.reasoning_summary);
  return reason.length < 35 || LAZY_REASON_RE.test(lower(reason));
}

function compactFeature(feature = {}, index = 0) {
  return {
    feature_id: feature.feature_id || feature.id || `FEATURE_${index + 1}`,
    feature_label: feature.feature_label || feature.label || feature.name || null,
    archetype_codes: asArray(feature.archetype_codes).map(upper).filter(Boolean),
    surface_tokens: asArray(feature.surface_tokens).map(asText).filter(Boolean),
    evidence_refs: asArray(feature.evidence_refs || feature.source_refs).slice(0, 8),
    summary: compactString(feature.function_summary || feature.summary || feature.description || "", 350)
  };
}

function compactTargetProfile(profile = {}) {
  return {
    profile_version: profile.profile_version || profile.company_profile_version || null,
    target_name: profile.target_name || profile.company_name || profile.name || null,
    website: profile.website || profile.domain || profile.url || null,
    jurisdiction: profile.jurisdiction || profile.target_jurisdiction || null,
    business_model: profile.business_model || profile.market_model || null,
    customer_type: profile.customer_type || profile.market_exposure || null,
    summary: compactString(profile.company_summary || profile.summary || profile.description || "", 700)
  };
}

function compactTargetFeatureProfile(profile = {}) {
  const inventory = asArray(profile.feature_inventory).map(compactFeature);
  return {
    feature_profile_version: profile.feature_profile_version || null,
    feature_count: inventory.length,
    feature_inventory: inventory,
    active_archetypes: [...new Set(inventory.flatMap((feature) => feature.archetype_codes))].sort(),
    active_surfaces: [...new Set(inventory.flatMap((feature) => feature.surface_tokens))].sort(),
    limitations: asArray(profile.limitations).map((item) => compactString(item, 250)).slice(0, 20),
    commercial_outcomes_seen: asArray(profile.commercial_scan?.distinct_commercial_outcomes_seen).map((item) => compactString(item, 250)).slice(0, 30)
  };
}

function compactDocRecord(record = {}, index = 0) {
  return {
    document_id: record.document_id || record.doc_id || record.id || `DOC_${index + 1}`,
    document_type: record.document_type || record.doc_type || record.canonical_document || record.document_name || record.name || null,
    status: record.status || record.visibility_status || record.coverage_status || record.document_status || record.availability || null,
    control_status: record.control_status || record.control_coverage || record.governance_status || null,
    source_refs: asArray(record.source_refs || record.evidence_refs || record.source_ids).slice(0, 8),
    summary: compactString(record.summary || record.reasoning || record.notes || record.finding || "", 350)
  };
}

function compactControlSignal(record = {}, index = 0) {
  return {
    signal_id: record.signal_id || record.control_id || record.document_id || `CTRL_${index + 1}`,
    document_type: record.document_type || record.doc_type || record.canonical_document || record.name || null,
    signal: record.signal || record.control_signal || record.status || record.coverage_status || null,
    status: record.status || record.visibility_status || record.control_status || null,
    evidence_refs: asArray(record.evidence_refs || record.source_refs || record.source_ids).slice(0, 8),
    summary: compactString(record.summary || record.reasoning || record.notes || "", 350)
  };
}

function compactDataFlow(record = {}, index = 0) {
  return {
    data_flow_id: record.data_flow_id || record.flow_id || record.id || `FLOW_${index + 1}`,
    feature_ref: record.feature_ref || record.feature_id || null,
    data_categories: asArray(record.data_categories || record.data_types).map(asText).filter(Boolean).slice(0, 12),
    providers: asArray(record.providers || record.subprocessors || record.processors).map(asText).filter(Boolean).slice(0, 12),
    storage_or_transfer: record.storage_or_transfer || record.transfer_path || record.processing_location || null,
    summary: compactString(record.summary || record.reasoning || "", 300)
  };
}

function compactStage6Review(review = {}) {
  const cartography = review.legal_document_cartography || {};
  const provenance = review.data_provenance_profile || review.data_provenance || {};
  const legalInventory = asArray(cartography.legal_document_inventory).map(compactDocRecord).slice(0, 80);
  const controlSignals = asArray(cartography.document_control_signal_map).map(compactControlSignal).slice(0, 100);
  const legalIndex = asArray(cartography.legal_document_index).map(compactDocRecord).slice(0, 80);
  const dataFlows = asArray(provenance.data_flow_profile || provenance.data_flows || provenance.data_flow_map).map(compactDataFlow).slice(0, 80);
  return {
    summary_version: "stage8_compact_stage6_summary_v1",
    legal_document_inventory_count: legalInventory.length,
    document_control_signal_count: controlSignals.length,
    legal_document_index_count: legalIndex.length,
    data_flow_count: dataFlows.length,
    legal_document_inventory: legalInventory,
    document_control_signal_map: controlSignals,
    legal_document_index: legalIndex,
    data_flow_profile: dataFlows,
    stage6_limitations: asArray(review.stage6_limitations || review.limitations).map((item) => compactString(item, 250)).slice(0, 30)
  };
}

function docAbsent(stage6Summary = {}, docPatterns = []) {
  const inventory = [...asArray(stage6Summary.legal_document_inventory), ...asArray(stage6Summary.legal_document_index), ...asArray(stage6Summary.document_control_signal_map)];
  const matches = inventory.filter((record) => docPatterns.some((pattern) => pattern.test(words(record.document_type || record.document_id || record.signal_id || record.summary))));
  if (!matches.length) return true;
  return matches.every((record) => ABSENT_RE.test(words(`${record.status || ""} ${record.control_status || ""} ${record.signal || ""} ${record.summary || ""}`)));
}

function stage8HighRiskChecks({ mergedLedger = [], featureSummary = {}, stage6Summary = {}, targetSummary = {} } = {}) {
  const counts = countsByStatus(mergedLedger);
  const featureBlob = lower(textBlob(featureSummary));
  const targetBlob = lower(textBlob(targetSummary));
  const activeArchetypes = new Set(asArray(featureSummary.active_archetypes).map(upper));
  return {
    b2b_enterprise_ai: /\b(b2b|enterprise|api|developer|platform|workflow|business|customer support|sales|hr|security|legal|finance|operations)\b/i.test(`${featureBlob} ${targetBlob}`),
    autonomous_action: activeArchetypes.has("DOE") || /\b(agentic|autonomous|tool execution|api execution|workflow execution|transaction|system action)\b/i.test(featureBlob),
    cybersecurity_ai: activeArchetypes.has("SHD") || /\b(security|threat|soc|incident response|abuse|malware|phishing)\b/i.test(featureBlob),
    regulated_use: /\b(employment|finance|credit|insurance|healthcare|education|admission|biometric|minor|safety|critical infrastructure|legal service)\b/i.test(featureBlob),
    dpa_absent: docAbsent(stage6Summary, [/\bdpa\b/i, /data processing/i, /processor terms/i, /gdpr addendum/i]),
    aup_absent: docAbsent(stage6Summary, [/\baup\b/i, /acceptable use/i, /prohibited use/i, /usage restriction/i]),
    sla_absent: docAbsent(stage6Summary, [/\bsla\b/i, /service level/i, /uptime/i, /availability/i, /service credit/i]),
    ai_policy_absent: docAbsent(stage6Summary, [/ai policy/i, /ai terms/i, /ai safety/i, /output policy/i, /human review/i]),
    human_review_structure_absent: !/\b(human[- ]?in[- ]?the[- ]?loop|human review|approval|appeal|override|manual review|hitl)\b/i.test(textBlob(stage6Summary)),
    triggered_count: counts.TRIGGERED || 0,
    controlled_count: counts.CONTROLLED || 0,
    not_triggered_count: counts.NOT_TRIGGERED || 0,
    not_applicable_count: counts.NOT_APPLICABLE || 0,
    insufficient_evidence_count: counts.INSUFFICIENT_EVIDENCE || 0,
    high_risk_undercount_suspected: false
  };
}

function addSuspicion(list, entry, route, code, severity, reason) {
  list.push({
    threat_id: threatId(entry),
    previous_status: entry.final_status || null,
    route_reason: route.route_reason || null,
    route_family: route.route_family || null,
    code,
    severity,
    reason,
    required_action: "Model challenge only this row using compact prior-stage summaries. Do not browse or use NOT_APPLICABLE for runtime-applicable rows."
  });
}

export function buildStage8DeterministicScan({ mergedLedger = [], stage7Artifact = {}, stage6Cache = {} } = {}) {
  const routeMap = routeMapFromStage7Artifact(stage7Artifact);
  const targetSummary = compactTargetProfile(stage6Cache.company_profile);
  const featureSummary = compactTargetFeatureProfile(stage6Cache.target_feature_profile);
  const stage6Summary = compactStage6Review(stage6Cache.stage6_review);
  const suspiciousRows = [];
  const warnings = [];

  for (const entry of asArray(mergedLedger)) {
    const route = routeFor(entry, routeMap);
    const id = threatId(entry);
    if (!id) continue;
    const finalStatus = upper(entry.final_status);
    const expected = expectedStatus(entry, route);
    if (isRunRoute(route) && finalStatus === "NOT_APPLICABLE") addSuspicion(suspiciousRows, entry, route, "RUN_ROW_NOT_APPLICABLE", "HIGH", "Runtime-applicable row was marked NOT_APPLICABLE despite Stage 5/Stage 7 deterministic route authority.");
    if (isSkipRoute(route) && finalStatus !== "NOT_APPLICABLE") addSuspicion(suspiciousRows, entry, route, "SKIP_ROW_EVALUATED", "MEDIUM", "Deterministic skipped row was not marked NOT_APPLICABLE.");
    if (expected && finalStatus && expected !== finalStatus && !(finalStatus === "INSUFFICIENT_EVIDENCE" && isRunRoute(route))) addSuspicion(suspiciousRows, entry, route, "STATUS_FORMULA_MISMATCH", "HIGH", `Expected ${expected} from route/trigger/exclude booleans but received ${finalStatus}.`);
    if (isRunRoute(route) && ["CONTROLLED", "TRIGGERED", "NOT_TRIGGERED"].includes(finalStatus) && !hasMeaningfulConditions(entry)) addSuspicion(suspiciousRows, entry, route, "MISSING_CONDITION_LEVEL_INVESTIGATION", "MEDIUM", "Runtime-applicable row has evaluated status but lacks meaningful condition-level basis.");
    if (isRunRoute(route) && ["CONTROLLED", "TRIGGERED"].includes(finalStatus) && hasThinEvidence(entry)) addSuspicion(suspiciousRows, entry, route, "THIN_EVIDENCE_REF", "MEDIUM", "Triggered/controlled row has missing or generic evidence_ref.");
    if (finalStatus === "CONTROLLED" && (entry.exclude_if_result !== true || hasThinEvidence(entry) || FORBIDDEN_EVIDENCE_RE.test(`${entry.evidence_ref || ""} ${entry.reasoning_summary || ""}`))) addSuspicion(suspiciousRows, entry, route, "CONTROLLED_PROOF_WEAK", "HIGH", "CONTROLLED status lacks explicit first-party EXCLUDE_IF proof or appears to rely on forbidden/generic evidence.");
    if (["NOT_TRIGGERED", "INSUFFICIENT_EVIDENCE", "NOT_APPLICABLE"].includes(finalStatus) && hasLazyReasoning(entry)) addSuspicion(suspiciousRows, entry, route, "LAZY_REASONING", "LOW", "Row reasoning is too generic for operator challenge confidence.");
    if (FORBIDDEN_EVIDENCE_RE.test(`${entry.evidence_ref || ""} ${entry.reasoning_summary || ""} ${textBlob(entry.conditions)}`)) addSuspicion(suspiciousRows, entry, route, "FORBIDDEN_EVIDENCE_REFERENCE", "HIGH", "Row appears to reference forbidden prior knowledge, private controls, press/search snippets, or assumptions.");
  }

  const highRiskChecks = stage8HighRiskChecks({ mergedLedger, featureSummary, stage6Summary, targetSummary });
  if ((highRiskChecks.b2b_enterprise_ai || highRiskChecks.autonomous_action || highRiskChecks.regulated_use) && highRiskChecks.triggered_count === 0 && highRiskChecks.insufficient_evidence_count === 0) {
    highRiskChecks.high_risk_undercount_suspected = true;
    warnings.push("High-risk product/use signals exist but Stage 7 returned zero TRIGGERED and zero INSUFFICIENT_EVIDENCE rows; suspicious rows were selected for compact challenge where available.");
  }

  const unique = [];
  const seen = new Set();
  for (const item of suspiciousRows) {
    if (!item.threat_id || seen.has(item.threat_id)) continue;
    seen.add(item.threat_id);
    unique.push(item);
  }
  const challengeIds = new Set(unique.map((item) => item.threat_id));
  const challengeRows = asArray(mergedLedger).filter((entry) => challengeIds.has(threatId(entry))).map((entry) => ({ ...entry, stage8_suspicion: unique.find((item) => item.threat_id === threatId(entry)) || null, stage7_route_contract: routeFor(entry, routeMap) }));
  return {
    scan_version: "stage8_deterministic_scan_v1",
    scanned_row_count: asArray(mergedLedger).length,
    suspicious_row_count: unique.length,
    suspicious_rows: unique,
    challenge_rows: challengeRows,
    high_risk_checks: highRiskChecks,
    warnings,
    compact_summaries: { target_profile_summary: targetSummary, target_feature_profile_summary: featureSummary, stage6_review_summary: stage6Summary }
  };
}

export function chunkStage8ChallengeRows(rows = [], size = MODEL_CHALLENGE_CHUNK_SIZE) {
  const out = [];
  const chunkSize = Math.max(1, Number(size || MODEL_CHALLENGE_CHUNK_SIZE));
  for (let index = 0; index < rows.length; index += chunkSize) out.push(rows.slice(index, index + chunkSize));
  return out;
}

export function buildDeterministicStage8Output({ scanner, registryTotal, evaluatedCount }) {
  const notes = [
    `Deterministic Stage 8 scanner inspected ${scanner.scanned_row_count} ledger rows.`,
    scanner.suspicious_row_count ? `Scanner flagged ${scanner.suspicious_row_count} suspicious row(s), but model challenge was unavailable or skipped.` : "No suspicious rows required model challenge.",
    ...asArray(scanner.warnings)
  ];
  return {
    operator_challenge_gate: {
      completed: true,
      result: scanner.suspicious_row_count || scanner.warnings.length ? "PASS_WITH_WARNINGS" : "PASS",
      registry_count_loaded: registryTotal,
      registry_count_evaluated: evaluatedCount,
      reopened_rows: [],
      high_risk_checks: scanner.high_risk_checks || {},
      notes
    },
    corrected_ledger_entries: []
  };
}

export function buildStage8ChallengeInput({ runId, registryTotal, mergedLedger, challengeRows, chunkIndex, chunkCount, stage7Artifact, registryRows, stage6Cache, scanner }) {
  const challengeIds = new Set(asArray(challengeRows).map(threatId).filter(Boolean));
  return {
    run_id: runId,
    operator_challenge_scope: {
      mode: "suspicious_rows_only",
      chunk_number: chunkIndex + 1,
      chunk_count: chunkCount,
      full_ledger_row_count: asArray(mergedLedger).length,
      challenge_row_count: asArray(challengeRows).length,
      rule_text: "Stage 8 model challenge receives only deterministic-scanner suspicious rows, not the full pipeline state. Count integrity and full-ledger coverage are deterministic runtime responsibilities. Correct only supplied suspicious rows when safe; otherwise return PASS_WITH_WARNINGS with notes. Do not browse."
    },
    registry_count_loaded: registryTotal,
    registry_total_count: registryTotal,
    registry_count_evaluated: asArray(mergedLedger).length,
    registry_evaluation_ledger: challengeRows,
    registry_batch_meta: {
      run_id: stage7Artifact.run_id || runId,
      batch_id: `STAGE8_SUSPICIOUS_${chunkIndex + 1}_OF_${chunkCount}`,
      is_merged_ledger: true,
      challenge_subset_only: true,
      registry_count_loaded: registryTotal,
      registry_total_count: registryTotal,
      registry_count_evaluated: asArray(mergedLedger).length,
      challenge_row_count: asArray(challengeRows).length,
      stage7_artifact_type: stage7Artifact.artifact_type || null
    },
    stage8_deterministic_scan: {
      scan_version: scanner.scan_version,
      scanned_row_count: scanner.scanned_row_count,
      suspicious_row_count: scanner.suspicious_row_count,
      suspicious_rows: asArray(scanner.suspicious_rows).filter((item) => challengeIds.has(item.threat_id)),
      high_risk_checks: scanner.high_risk_checks,
      warnings: scanner.warnings
    },
    source_bundle: compactSourceBundleForOperatorChallenge(stage6Cache.source_bundle),
    ...scanner.compact_summaries,
    registry_logic_reference: compactRegistryLogicReference(asArray(registryRows)).filter((row) => challengeIds.has(row.threat_id)),
    prior_stage_summaries: {
      stage7_summary: stage7Artifact.summary || null,
      active_archetypes: stage7Artifact.active_archetypes || [],
      active_surfaces: stage7Artifact.active_surfaces || [],
      route_records: asArray(stage7Artifact.route_records).filter((record) => challengeIds.has(record.threat_id)),
      stage8_input_policy: "deterministic_scan_plus_compact_suspicious_row_challenge"
    },
    test_run: false
  };
}

export function combineStage8ChallengeOutputs({ scanner, outputs = [], registryTotal, evaluatedCount, modelWarnings = [] }) {
  const reopenedRows = [];
  const correctedEntries = [];
  const notes = [
    `Deterministic Stage 8 scanner inspected ${scanner.scanned_row_count} ledger rows and selected ${scanner.suspicious_row_count} suspicious row(s).`,
    ...asArray(scanner.warnings),
    ...asArray(modelWarnings)
  ];
  const seenCorrections = new Set();
  for (const output of asArray(outputs)) {
    const gate = output?.operator_challenge_gate || {};
    notes.push(...asArray(gate.notes));
    for (const row of asArray(gate.reopened_rows)) reopenedRows.push(row);
    for (const entry of asArray(output?.corrected_ledger_entries)) {
      const id = threatId(entry);
      if (!id || seenCorrections.has(id)) continue;
      seenCorrections.add(id);
      correctedEntries.push(entry);
    }
  }
  const result = correctedEntries.length ? "REOPENED" : notes.length || scanner.suspicious_row_count ? "PASS_WITH_WARNINGS" : "PASS";
  return {
    operator_challenge_gate: {
      completed: true,
      result,
      registry_count_loaded: registryTotal,
      registry_count_evaluated: evaluatedCount,
      reopened_rows: reopenedRows.filter((row, index, arr) => arr.findIndex((item) => item?.threat_id === row?.threat_id) === index),
      high_risk_checks: scanner.high_risk_checks || {},
      notes: notes.map((note) => compactString(note, 600)).filter(Boolean).slice(0, 80)
    },
    corrected_ledger_entries: correctedEntries
  };
}
