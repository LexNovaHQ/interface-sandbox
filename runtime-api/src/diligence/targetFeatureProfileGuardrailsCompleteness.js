import { validateTargetFeatureProfileGuardrails as validateBaseGuardrails } from "./targetFeatureProfileGuardrailsLocked.js";
import { canonicalCandidateCluster, evaluateCandidateFeatureCompatibility } from "./stage5TargetFeaturePackageBuilder.js";

const COVERAGE_TO_DISPOSITION = {
  mapped: "mapped_feature",
  supporting: "supporting_only",
  duplicate: "duplicate_of",
  insufficient_detail: "insufficient_detail",
  non_feature_context: "non_feature_context"
};
const FINAL_DISPOSITIONS = new Set(["mapped_feature", "duplicate_of", "supporting_only", "insufficient_detail", "non_feature_context"]);
const COMPLETE_STATUS = new Set(["COMPLETE", "PARTIAL", "THIN"]);
const REPAIR_ACTION = "rerun_missing_stage5_candidate_or_source_accounting";

function issue(keyword, severity, instancePath, message, params = {}) {
  return { keyword, severity, instancePath, schemaPath: "#/targetFeatureProfileCompletenessGuardrails", message, params };
}

function repair(instancePath, message, params = {}) {
  return { ...issue("target_feature_profile_completeness_repair", "REPAIRABLE", instancePath, message, params), action: REPAIR_ACTION };
}

function blocking(instancePath, message, params = {}) {
  return issue("target_feature_profile_completeness_blocking", "BLOCKING", instancePath, message, params);
}

function warning(instancePath, message, params = {}) {
  return issue("target_feature_profile_completeness_warning", "WARNING", instancePath, message, params);
}

function writeLimitation(profile, item, label = "COMPLETENESS_WARNING") {
  if (!profile || typeof profile !== "object") return;
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const line = `${label} ${item.instancePath || "/"}: ${item.message} ${JSON.stringify(item.params || {})}`;
  if (!profile.limitations.includes(line)) profile.limitations.push(line);
}

function addWarning(profile, warnings, instancePath, message, params = {}) {
  const item = warning(instancePath, message, params);
  warnings.push(item);
  writeLimitation(profile, item);
}

function addRepair(profile, repairs, instancePath, message, params = {}) {
  const item = repair(instancePath, message, params);
  repairs.push(item);
  writeLimitation(profile, item, "COMPLETENESS_REPAIR");
}

function addBlocking(errors, instancePath, message, params = {}) {
  errors.push(blocking(instancePath, message, params));
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function sourceId(row) {
  return String(row?.evidence_source_id || row?.source_id || "").trim();
}

function sourceUrl(row) {
  return row?.source_url || row?.final_url || row?.url || "";
}

function expectedStage5Sources(packageInput = {}) {
  const discovery = asArray(packageInput.product_family_discovery_sources);
  const primary = asArray(packageInput.product_family_primary_sources);
  const evidence = asArray(packageInput.source_bundle?.evidence_buffer);
  const inventory = asArray(packageInput.source_bundle?.artifact_inventory);
  const included = asArray(packageInput.input_budget?.included_sources);
  const rows = discovery.length ? discovery : (primary.length ? primary : (evidence.length ? evidence : (included.length ? included : inventory)));
  const out = [];
  const seen = new Set();
  for (const row of rows) {
    const id = sourceId(row);
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push({
      source_id: id,
      source_url: sourceUrl(row),
      source_family: row?.source_family || "unknown",
      source_role: row?.source_role || row?.stage5_source_role || "primary_function_source",
      candidate_cluster: row?.candidate_cluster || null,
      duplicate_cluster_id: row?.duplicate_cluster_id || row?.dedupe_group_id || null,
      duplicate_of: row?.duplicate_of || null
    });
  }
  return out;
}

function expectedStage5Candidates(packageInput = {}) {
  const rows = packageInput?.target_feature_candidate_index?.candidates;
  return Array.isArray(rows) ? rows.filter((row) => row && typeof row === "object" && nonEmptyString(row.candidate_id)) : [];
}

function featureMap(profile = {}) {
  return new Map(asArray(profile.feature_inventory).filter((feature) => nonEmptyString(feature?.feature_id)).map((feature) => [feature.feature_id, feature]));
}

function coverageBySource(scan = {}) {
  const out = new Map();
  for (const row of asArray(scan.source_coverage)) {
    const id = String(row?.source_id || "").trim();
    if (id && !out.has(id)) out.set(id, row);
  }
  return out;
}

function duplicateSourceMap(packageInput = {}) {
  const rows = [...asArray(packageInput.product_family_duplicate_sources), ...asArray(packageInput.stage5_audit_ledger?.duplicate_supporting_sources)];
  return new Map(rows.map((row) => [sourceId(row), row]).filter(([id]) => id));
}

function sourceMetaMap(packageInput = {}) {
  const rows = [
    ...asArray(packageInput.product_family_primary_sources),
    ...asArray(packageInput.product_family_discovery_sources),
    ...asArray(packageInput.product_family_supporting_sources),
    ...asArray(packageInput.product_family_duplicate_sources),
    ...asArray(packageInput.product_family_non_feature_context_sources)
  ];
  return new Map(rows.map((row) => [sourceId(row), row]).filter(([id]) => id));
}

function dispositionFromCoverage(candidate = {}, coverage = null, duplicateMap = new Map()) {
  if (coverage?.coverage_status) return COVERAGE_TO_DISPOSITION[coverage.coverage_status] || "missed";
  if (candidate.duplicate_of || duplicateMap.has(String(candidate.source_id || "").trim())) return "duplicate_of";
  return "missed";
}

function candidateDisposition({ candidate = {}, coverage = null, duplicateMap = new Map(), feature = null, compatibility = null, candidateCountForSource = 1 }) {
  const disposition = dispositionFromCoverage(candidate, coverage, duplicateMap);
  if (disposition !== "mapped_feature") return disposition;
  if (!feature || compatibility?.compatible !== false) return disposition;
  if (candidateCountForSource <= 1) return disposition;
  if (candidate.duplicate_of || duplicateMap.has(String(candidate.source_id || "").trim())) return "duplicate_of";
  return "supporting_only";
}

function mappedIds(row = {}) {
  return asArray(row.mapped_feature_ids).map((id) => String(id || "").trim()).filter(Boolean);
}

function hasReason(row = {}) {
  return nonEmptyString(row.unmapped_reason) || nonEmptyString(row.reason) || nonEmptyString(row.coverage_reason);
}

function evidenceRefs(row = {}) {
  return asArray(row.evidence_refs).map(String).filter(Boolean);
}

const DISCOVERY_ACCOUNTING_STOPWORDS = new Set([
  "data",
  "feature",
  "from",
  "input",
  "into",
  "output",
  "product",
  "signal",
  "source",
  "system",
  "text",
  "that",
  "this",
  "visible",
  "with"
]);

function textTokens(value = "") {
  return String(value || "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length >= 4 && !DISCOVERY_ACCOUNTING_STOPWORDS.has(token));
}

function featureAccountText(feature = {}) {
  return [
    feature.feature_id,
    feature.feature_name,
    feature.commercial_function,
    feature.business_label_or_product_area,
    feature.feature_description,
    feature.system_action,
    feature.output_or_result
  ].filter(Boolean).join(" ").toLowerCase();
}

function discoveryFeatures(packageInput = {}) {
  return asArray(packageInput.stage5_feature_discovery?.discovered_features)
    .filter((feature) => feature && typeof feature === "object" && (evidenceRefs(feature).length || asArray(feature.source_ids).length));
}

function discoveryFeatureAccounted(discovery = {}, profile = {}) {
  const refs = new Set(evidenceRefs(discovery));
  const sourceIds = new Set(asArray(discovery.source_ids).map(String).filter(Boolean));
  const tokens = textTokens([discovery.feature_label, discovery.function_summary, discovery.system_action, discovery.output_signal].filter(Boolean).join(" "));
  const features = asArray(profile.feature_inventory);
  for (const feature of features) {
    const featureRefs = new Set(evidenceRefs(feature));
    const refOverlap = [...refs].some((ref) => featureRefs.has(ref));
    const sourceOverlap = sourceIds.has(String(feature?.evidence_source_id || "").trim());
    const text = featureAccountText(feature);
    const textMatch = tokens.length ? tokens.some((token) => text.includes(token)) : true;
    if ((refOverlap || sourceOverlap || !refs.size) && textMatch) return true;
  }
  const scanText = JSON.stringify(profile.commercial_scan || {}).toLowerCase();
  return tokens.length ? tokens.some((token) => scanText.includes(token)) : false;
}

function validateSourceCoverageRows(profile = {}, packageInput = {}) {
  const scan = profile?.commercial_scan || {};
  const features = featureMap(profile);
  const duplicates = duplicateSourceMap(packageInput);
  const sourceMeta = sourceMetaMap(packageInput);
  const invalid = [];
  asArray(scan.source_coverage).forEach((row, index) => {
    const path = `/commercial_scan/source_coverage/${index}`;
    if (!row || typeof row !== "object" || Array.isArray(row)) {
      invalid.push({ path, reason: "source_coverage row is not an object" });
      return;
    }
    const status = row.coverage_status;
    const ids = mappedIds(row);
    const unknownFeatureIds = ids.filter((id) => !features.has(id));
    const source = sourceMeta.get(String(row.source_id || "").trim()) || {};
    if (!COVERAGE_TO_DISPOSITION[status]) invalid.push({ path: `${path}/coverage_status`, source_id: row.source_id || null, reason: "invalid coverage_status", coverage_status: status || null });
    if (status === "mapped" && !ids.length) invalid.push({ path: `${path}/mapped_feature_ids`, source_id: row.source_id || null, reason: "mapped source coverage requires mapped_feature_ids" });
    if (unknownFeatureIds.length) invalid.push({ path: `${path}/mapped_feature_ids`, source_id: row.source_id || null, reason: "mapped_feature_ids reference missing feature_inventory ids", unknown_feature_ids: unknownFeatureIds });
    if (status === "supporting" && !ids.length && !hasReason(row)) invalid.push({ path, source_id: row.source_id || null, reason: "supporting source coverage requires mapped_feature_ids or reason" });
    if (status === "duplicate" && !row.duplicate_of && !duplicates.has(String(row.source_id || "").trim())) invalid.push({ path, source_id: row.source_id || null, reason: "duplicate source coverage requires duplicate_of or duplicate metadata relation" });
    if (status === "insufficient_detail" && !hasReason(row)) invalid.push({ path, source_id: row.source_id || null, reason: "insufficient_detail source coverage requires reason" });
    if (status === "non_feature_context" && source.source_role === "primary_function_source" && !hasReason(row)) invalid.push({ path, source_id: row.source_id || null, reason: "primary source cannot be non_feature_context without reason" });
    if (status === "mapped" && ids.length) {
      const rowRefs = evidenceRefs(row);
      const featureHasRefs = ids.some((id) => evidenceRefs(features.get(id)).length);
      if (!rowRefs.length && !featureHasRefs) invalid.push({ path: `${path}/evidence_refs`, source_id: row.source_id || null, reason: "mapped source should cite evidence_refs or map to a feature with evidence_refs" });
    }
  });
  return invalid;
}

function buildAuditLedger(profile = {}, options = {}) {
  const packageInput = options.packageInput || {};
  const scan = profile?.commercial_scan || {};
  const coverageMap = coverageBySource(scan);
  const candidates = expectedStage5Candidates(packageInput);
  const expectedSources = expectedStage5Sources(packageInput);
  const features = featureMap(profile);
  const duplicates = duplicateSourceMap(packageInput);
  const candidateCountBySource = new Map();
  for (const candidate of candidates) {
    const id = String(candidate.source_id || "").trim();
    if (id) candidateCountBySource.set(id, (candidateCountBySource.get(id) || 0) + 1);
  }
  const candidateRows = candidates.map((candidate) => {
    const candidateSourceId = String(candidate.source_id || "").trim();
    const coverage = coverageMap.get(candidateSourceId) || null;
    const ids = mappedIds(coverage);
    const mappedFeatureId = ids.find((id) => features.has(id)) || ids[0] || null;
    const feature = mappedFeatureId ? features.get(mappedFeatureId) : null;
    const sourceDisposition = dispositionFromCoverage(candidate, coverage, duplicates);
    const compatibility = sourceDisposition === "mapped_feature" && feature
      ? evaluateCandidateFeatureCompatibility(candidate, feature)
      : { compatibility_status: sourceDisposition === "mapped_feature" ? "unknown" : "not_applicable", compatible: sourceDisposition !== "mapped_feature", candidate_cluster: canonicalCandidateCluster(candidate), matched_terms: [] };
    const disposition = candidateDisposition({ candidate, coverage, duplicateMap: duplicates, feature, compatibility, candidateCountForSource: candidateCountBySource.get(candidateSourceId) || 1 });
    const duplicateRow = duplicates.get(candidateSourceId);
    return {
      candidate_id: candidate.candidate_id,
      candidate_cluster: candidate.candidate_cluster || compatibility.candidate_cluster || canonicalCandidateCluster(candidate),
      source_id: candidate.source_id || null,
      source_url: candidate.source_url || null,
      raw_label: candidate.raw_label || candidate.candidate_label || null,
      normalized_label: candidate.normalized_label || null,
      disposition,
      mapped_feature_id: mappedFeatureId || null,
      compatibility_status: disposition === "mapped_feature" ? (compatibility.compatibility_status || "unknown") : (compatibility.compatibility_status === "incompatible" ? "not_applicable" : (compatibility.compatibility_status || "not_applicable")),
      reason: disposition !== sourceDisposition && compatibility.compatibility_status === "incompatible"
        ? "source coverage mapped the source, but this candidate is semantically distinct and accounted as supporting-only"
        : (coverage?.unmapped_reason || coverage?.coverage_status || duplicateRow?.disposition || (coverage ? "accounted by commercial_scan.source_coverage" : "missing candidate/source accounting")),
      evidence_refs: evidenceRefs(candidate).length ? evidenceRefs(candidate) : evidenceRefs(coverage),
      duplicate_of: candidate.duplicate_of || duplicateRow?.duplicate_of || coverage?.duplicate_of || null,
      matched_compatibility_terms: compatibility.matched_terms || []
    };
  });
  const sourceRows = expectedSources.map((source) => {
    const coverage = coverageMap.get(source.source_id) || null;
    return {
      source_id: source.source_id,
      source_url: source.source_url,
      source_family: source.source_family,
      source_role: source.source_role || "primary_function_source",
      candidate_cluster: source.candidate_cluster || null,
      duplicate_cluster_id: source.duplicate_cluster_id || null,
      duplicate_of: source.duplicate_of || coverage?.duplicate_of || null,
      disposition: dispositionFromCoverage(source, coverage, duplicates),
      mapped_feature_ids: mappedIds(coverage),
      reason: coverage?.unmapped_reason || coverage?.coverage_status || "missing source coverage"
    };
  });
  return {
    ledger_version: "stage5_target_feature_audit_ledger_v2",
    ledger_scope: "runtime_internal_not_canonical_schema",
    generated_at: new Date().toISOString(),
    candidate_index_version: packageInput?.target_feature_candidate_index?.index_version || null,
    expected_candidate_count: candidates.length,
    expected_primary_source_count: expectedSources.length,
    source_review: packageInput?.source_bundle?.source_review || null,
    candidate_clusters: asArray(packageInput.stage5_candidate_clusters || packageInput.target_feature_candidate_index?.candidate_clusters || packageInput.stage5_audit_ledger?.candidate_clusters),
    candidate_walk_ledger: candidateRows,
    source_walk_ledger: sourceRows,
    duplicate_supporting_sources: asArray(packageInput.product_family_duplicate_sources),
    canonical_schema_mutated: false
  };
}

export function buildTargetFeatureAuditLedger(profile = {}, packageInput = {}) {
  return buildAuditLedger(profile, { packageInput });
}

function unresolvedCompleteness(profile = {}, ledger = {}, options = {}) {
  const rawScan = profile?.commercial_scan;
  const scan = rawScan || {};
  const candidateRows = asArray(ledger.candidate_walk_ledger);
  const sourceRows = asArray(ledger.source_walk_ledger);
  const missingCandidateIds = candidateRows.filter((row) => !FINAL_DISPOSITIONS.has(row.disposition)).map((row) => row.candidate_id).filter(Boolean);
  const incompatibleCandidateMappings = candidateRows
    .filter((row) => row.disposition === "mapped_feature" && row.compatibility_status === "incompatible")
    .map((row) => ({ candidate_id: row.candidate_id, candidate_cluster: row.candidate_cluster, mapped_feature_id: row.mapped_feature_id }));
  const missingSourceIds = sourceRows.filter((row) => !FINAL_DISPOSITIONS.has(row.disposition)).map((row) => row.source_id).filter(Boolean);
  const invalidCoverageRows = validateSourceCoverageRows(profile, options.packageInput || {});
  const missedDiscoveryFeatures = discoveryFeatures(options.packageInput || {})
    .filter((feature) => !discoveryFeatureAccounted(feature, profile))
    .map((feature) => ({ discovery_id: feature.discovery_id || null, feature_label: feature.feature_label || null, source_ids: asArray(feature.source_ids), evidence_refs: evidenceRefs(feature) }));
  return {
    missingCandidateIds,
    incompatibleCandidateMappings,
    missingSourceIds,
    invalidCoverageRows,
    missedDiscoveryFeatures,
    missingCommercialScan: !rawScan || typeof rawScan !== "object" || Array.isArray(rawScan),
    missingCoverage: !asArray(scan.source_coverage).length,
    emptyOutcomes: !asArray(scan.distinct_commercial_outcomes_seen).length,
    missingIndex: !asArray(options.packageInput?.target_feature_candidate_index?.candidates).length
  };
}

function validateCompleteness(profile, result, options = {}) {
  const warnings = result.warnings || (result.warnings = []);
  const repairs = result.repairs || (result.repairs = []);
  const errors = result.errors || (result.errors = []);
  const afterRepair = Boolean(options.packageInput?.completion_repair_request);
  const ledger = buildAuditLedger(profile, options);
  result.target_feature_audit_ledger = ledger;
  result.stage5_audit_ledger = ledger;
  const unresolved = unresolvedCompleteness(profile, ledger, options);
  const features = asArray(profile.feature_inventory);
  const scan = profile?.commercial_scan || {};

  if (!features.length) addWarning(profile, warnings, "/feature_inventory", "feature_inventory is empty or thin; low feature count is advisory when candidate/source accounting is complete");
  if (!COMPLETE_STATUS.has(scan.completeness_status)) addWarning(profile, warnings, "/commercial_scan/completeness_status", "completeness_status missing or invalid; passed as advisory unless accounting is missing", { completeness_status: scan.completeness_status || null });
  else if (scan.completeness_status !== "COMPLETE") addWarning(profile, warnings, "/commercial_scan/completeness_status", "Stage 5 completeness is not complete", { completeness_status: scan.completeness_status });
  if (asArray(profile.commercial_scan?.unmapped_outcomes_due_to_insufficient_detail).length) addWarning(profile, warnings, "/commercial_scan/unmapped_outcomes_due_to_insufficient_detail", "Stage 5 has properly accounted unmapped commercial outcomes", { count: profile.commercial_scan.unmapped_outcomes_due_to_insufficient_detail.length });

  if (unresolved.missingIndex) {
    addBlocking(errors, "/target_feature_candidate_index", "deterministic target_feature_candidate_index missing or empty", { required: true });
    return;
  }

  const missing = {
    missing_candidate_ids: unresolved.missingCandidateIds,
    incompatible_candidate_mappings: unresolved.incompatibleCandidateMappings,
    invalid_source_coverage_rows: unresolved.invalidCoverageRows,
    missed_discovered_features: unresolved.missedDiscoveryFeatures,
    missing_primary_source_ids: unresolved.missingSourceIds,
    missing_commercial_scan: unresolved.missingCommercialScan,
    missing_source_coverage: unresolved.missingCoverage,
    empty_outcomes: unresolved.emptyOutcomes
  };
  const hasCriticalGap = missing.missing_candidate_ids.length || missing.incompatible_candidate_mappings.length || missing.invalid_source_coverage_rows.length || missing.missed_discovered_features.length || missing.missing_primary_source_ids.length || missing.missing_commercial_scan || missing.missing_source_coverage || missing.empty_outcomes;
  if (!hasCriticalGap) return;

  if (afterRepair) {
    addBlocking(errors, "/target_feature_audit_ledger", "Stage 5 candidate/source semantic accounting remains incomplete after repair rerun", missing);
    return;
  }
  addRepair(profile, repairs, "/target_feature_audit_ledger", "Stage 5 candidate/source semantic accounting is incomplete and should be repaired with one focused rerun", missing);
}

export function validateTargetFeatureProfileGuardrails(profile, options = {}) {
  const result = validateBaseGuardrails(profile, options);
  validateCompleteness(profile, result, options);
  result.ok = Array.isArray(result.errors) ? result.errors.length === 0 : result.ok;
  return result;
}
