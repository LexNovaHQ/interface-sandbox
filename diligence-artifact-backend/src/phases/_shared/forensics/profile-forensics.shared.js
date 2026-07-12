const CONTRACTS = Object.freeze({
  target_profile_forensics: "M7_DETERMINISTIC_FORENSIC_TRACE_CONTRACT_V1",
  target_feature_profile_forensics: "M8_DETERMINISTIC_FORENSIC_TRACE_CONTRACT_V3_BEHAVIOR_CLASS"
});

const MATERIAL_ACTIVITY_FIELDS = Object.freeze([
  "activity_reference",
  "product_service_wrapper",
  "activity_feature_name",
  "activity_candidate_summary",
  "mechanics_proof",
  "autonomy_human_control_signal",
  "data_content_object_touched",
  "external_internal_action_signal"
]);

const CONTROLLED_VALUES = new Set([
  "FIELD_LIMITED",
  "FIELD_NOT_PUBLIC",
  "FIELD_CONFLICTED",
  "FIELD_NOT_FOUND",
  "REPAIR_REQUIRED",
  "CONTROLLED_FAILURE"
]);

const THIN_VALUES = new Set([
  "",
  "yes",
  "no",
  "partial",
  "true",
  "false",
  "unknown",
  "n/a",
  "na",
  "not applicable"
]);

export function validateFeatureCandidateCoverage(inventoryInput, profileInput, { coverageLedger = null } = {}) {
  const inventory = unwrap(inventoryInput, "feature_candidate_inventory");
  const profile = unwrap(profileInput, "target_feature_profile");
  const candidates = asArray(inventory.candidates);
  const activities = asArray(profile.activities);
  const ledger = coverageLedger || buildCandidateCoverageLedger({ inventory, activities });
  const uncovered = ledger.filter((row) => !row.activity_reference);

  return {
    coverage_result: uncovered.length ? "COVERAGE_LIMITED_TARGETED_REINVESTIGATION_REQUIRED" : "PASS",
    candidate_count: candidates.length,
    activity_count: activities.length,
    covered_candidate_count: candidates.length - uncovered.length,
    uncovered_candidate_count: uncovered.length,
    uncovered_candidates: uncovered.map((row) => row.candidate_id),
    failures: uncovered.map((row) => `UNCOVERED_FEATURE_CANDIDATE:${row.candidate_id}`),
    blocking: false,
    targeted_reinvestigation_required: uncovered.length > 0,
    coverage_ledger: ledger
  };
}

export function buildM8FeatureCoverageForensics(inventoryInput, profileInput, { coverageResult = null, coverageLedger = null } = {}) {
  const inventory = unwrap(inventoryInput, "feature_candidate_inventory");
  const profile = unwrap(profileInput, "target_feature_profile");
  const ledger = coverageLedger || buildCandidateCoverageLedger({ inventory, activities: asArray(profile.activities) });
  const coverage = coverageResult || validateFeatureCandidateCoverage(inventory, profile, { coverageLedger: ledger });

  return {
    feature_candidate_inventory_ref: {
      artifact_type: inventory.artifact_type || "feature_candidate_inventory",
      inventory_version: inventory.inventory_version || "",
      derivation_mode: inventory.derivation_mode || "",
      canonical_candidate_count: Number(inventory.canonical_candidate_count || asArray(inventory.candidates).length),
      source_index_artifact: inventory.source_index_artifact || "activity_profile_source_index",
      semantic_support_receipt_present: Boolean(inventory.semantic_support_receipt)
    },
    raw_feature_hit_derivation_ledger: asArray(inventory.raw_feature_hit_index).map((row, index) => ({
      raw_hit_index: index,
      raw_hit_id: row.raw_hit_id || row.hit_id || `raw_hit_${index + 1}`,
      source_root: row.source_root || "",
      route_class: row.route_class || "",
      evidence_grounded: row.evidence_grounded !== false,
      copied_evidence_text_present: hasEvidenceText(row)
    })),
    canonicalization_derivation_ledger: asArray(inventory.canonicalization_index).map((row, index) => ({
      canonicalization_index: index,
      candidate_id: row.candidate_id || "",
      canonical_feature_key: row.canonical_feature_key || "",
      merged_raw_hit_ids: asArray(row.merged_raw_hit_ids)
    })),
    dedup_decision_ledger: asArray(inventory.dedup_index),
    parent_child_overlap_ledger: asArray(inventory.parent_child_overlap_index),
    candidate_to_activity_coverage_ledger: ledger,
    coverage_summary: coverage
  };
}

export function buildM7DeterministicTargetForensics({ artifacts = {} } = {}) {
  const profile = unwrap(artifacts.target_profile, "target_profile");
  const fieldTrace = buildObjectFieldTrace({ rootName: "target_profile", value: profile });
  const limitationTrace = asArray(profile.target_profile_limitations).map((item, index) => traceValue({
    trace_id: `target_profile_limitations[${index}]`,
    field_path: `target_profile.target_profile_limitations[${index}]`,
    value: item
  }));
  const sourceFamilies = sourceFamilyManifest(artifacts);
  const lockGate = buildFieldLockGate({
    artifactName: "target_profile_forensics",
    expectedRoot: "target_profile",
    fieldTrace,
    limitationTrace
  });

  return {
    target_profile_forensics: {
      forensic_contract: contract("target_profile_forensics", "M7 target profile field-level deterministic trace"),
      material_profile_trace_index: [{
        artifact_name: "target_profile",
        present: isPlainObject(profile),
        field_trace_rows: fieldTrace.length,
        limitation_rows: limitationTrace.length,
        source_family_count: sourceFamilies.present_families.length
      }],
      field_trace_index: fieldTrace,
      source_custody_trace_index: sourceFamilies.rows,
      limitation_trace_index: limitationTrace,
      profile_reconciliation_ledger: buildProfileFieldReconciliation({
        profileName: "target_profile",
        fieldTrace,
        limitationTrace
      }),
      forensic_lock_gate_result: lockGate,
      source_ledger_used_for_m7: sourceFamilies.rows,
      target_source_extraction_capsule_summary: sourceFamilies.present_families.map((family) => ({ family, status: "FOUND" })),
      target_source_route_coverage_ledger: sourceFamilies.rows,
      field_derivation_ledger: fieldTrace,
      targeted_re_extraction_ledger: [],
      limitation_ledger: limitationTrace,
      cross_route_use_ledger: buildCrossRouteLedger(artifacts),
      validation_quality_control_result: lockGate,
      runtime_trace_m7_only: runtimeTrace("M7_TARGET_PROFILE_FORENSICS"),
      forensic_boundary: boundary("target_profile_forensics")
    }
  };
}

export function buildM8DeterministicFeatureForensics({ artifacts = {} } = {}) {
  const profile = unwrap(artifacts.target_feature_profile, "target_feature_profile");
  const inventory = unwrap(artifacts.feature_candidate_inventory, "feature_candidate_inventory");
  const activities = asArray(profile.activities);
  const sourceFamilies = sourceFamilyManifest(artifacts);
  const coverageTrace = buildM8FeatureCoverageForensics(inventory, profile);
  const coverage = coverageTrace.coverage_summary;
  const fieldTrace = activities.flatMap((activity, index) => buildObjectFieldTrace({
    rootName: `target_feature_profile.activities[${index}]`,
    value: activity
  }));
  const limitationTrace = asArray(profile.profile_level_limitations).map((item, index) => traceValue({
    trace_id: `profile_level_limitations[${index}]`,
    field_path: `target_feature_profile.profile_level_limitations[${index}]`,
    value: item
  }));
  const activityTrace = activities.map((activity, index) => {
    const primary = classificationTrace(activity.primary_classification);
    const overlays = asArray(activity.overlay_classifications).map((block) => ({
      overlay_id: block.overlay_id || "",
      ...classificationTrace(block)
    }));
    return {
      activity_index: index,
      activity_reference: activity.activity_reference || `activity_${index + 1}`,
      product_service_wrapper: activity.product_service_wrapper || "",
      activity_feature_name: activity.activity_feature_name || "",
      primary_classification: primary,
      overlay_classifications: overlays,
      package_scoped_behavior_class_codes: [
        ...packageScopedValues(primary.package_id, primary.behavior_class_codes),
        ...overlays.flatMap((block) => packageScopedValues(block.package_id, block.behavior_class_codes))
      ],
      package_scoped_surface_context_tokens: [
        ...packageScopedValues(primary.package_id, primary.surface_context_tokens),
        ...overlays.flatMap((block) => packageScopedValues(block.package_id, block.surface_context_tokens))
      ],
      material_fields_complete: MATERIAL_ACTIVITY_FIELDS.every((field) => hasMaterialValue(activity[field])),
      report_fields_human_readable: [
        activity.activity_candidate_summary,
        activity.mechanics_proof,
        activity.autonomy_human_control_signal,
        activity.data_content_object_touched,
        activity.external_internal_action_signal
      ].every(isReadable),
      forensic_trace_present: true
    };
  });
  const lockGate = buildActivityLockGate({ activityTrace, fieldTrace, limitationTrace, coverage });
  const unresolved = coverageTrace.candidate_to_activity_coverage_ledger.filter((row) => !row.activity_reference);

  return {
    target_feature_profile_forensics: {
      forensic_contract: contract("target_feature_profile_forensics", "M8 target feature inventory, behavior-class and activity-level deterministic trace"),
      ...coverageTrace,
      semantic_classification_ledger: activityTrace,
      material_profile_trace_index: activityTrace,
      activity_trace_index: activityTrace,
      field_trace_index: fieldTrace,
      source_custody_trace_index: sourceFamilies.rows,
      limitation_trace_index: limitationTrace,
      profile_reconciliation_ledger: buildProfileFieldReconciliation({
        profileName: "target_feature_profile",
        fieldTrace,
        limitationTrace,
        expectedRows: activities.length
      }),
      forensic_lock_gate_result: lockGate,
      product_activity_source_route_coverage_ledger: sourceFamilies.rows,
      product_activity_extraction_capsule_summary: sourceFamilies.present_families.map((family) => ({ family, status: "FOUND" })),
      candidate_admission_and_omission_ledger: coverageTrace.candidate_to_activity_coverage_ledger.map((row) => ({
        candidate_id: row.candidate_id,
        activity_reference: row.activity_reference || null,
        admitted: Boolean(row.activity_reference),
        omission: !row.activity_reference,
        coverage_disposition: row.coverage_disposition,
        reason: row.reason
      })),
      selected_pa_field_derivation_ledger: fieldTrace,
      activity_mechanics_derivation_ledger: fieldTrace.filter((row) => row.field_path.includes("mechanics")),
      behavior_class_derivation_ledger: activityTrace.map((row) => ({
        activity_reference: row.activity_reference,
        primary_classification: row.primary_classification,
        overlay_classifications: row.overlay_classifications,
        package_scoped_behavior_class_codes: row.package_scoped_behavior_class_codes,
        trace_present: true
      })),
      surface_token_derivation_ledger: activityTrace.map((row) => ({
        activity_reference: row.activity_reference,
        primary_classification: row.primary_classification,
        overlay_classifications: row.overlay_classifications,
        package_scoped_surface_context_tokens: row.package_scoped_surface_context_tokens,
        trace_present: true
      })),
      mounted_taxonomy_ref_trace: profile.mounted_taxonomy_ref || {},
      targeted_re_extraction_ledger: unresolved.map((row) => ({
        candidate_id: row.candidate_id,
        reason: row.reason,
        required_action: "TARGETED_REINVESTIGATION_REQUIRED",
        blocking: false
      })),
      activity_limitations_ledger: [
        ...limitationTrace,
        ...unresolved.map((row) => traceValue({
          trace_id: `candidate_coverage_limitation.${row.candidate_id}`,
          field_path: `feature_candidate_inventory.candidates.${row.candidate_id}`,
          value: row.reason
        }))
      ],
      cross_route_use_ledger: buildCrossRouteLedger(artifacts),
      validation_quality_control_result: {
        ...lockGate,
        candidate_coverage_result: coverage.coverage_result,
        candidate_coverage_failures: coverage.failures,
        uncovered_candidates: coverage.uncovered_candidates
      },
      runtime_trace_m8_only: runtimeTrace("M8_TARGET_FEATURE_PROFILE_FORENSICS"),
      forensic_boundary: {
        ...boundary("target_feature_profile_forensics"),
        feature_candidate_inventory_recompiled: false,
        lossless_evidence_recompiled: false,
        package_taxonomy_rederived: false,
        inventory_source_of_truth: "feature_candidate_inventory",
        material_profile_source_of_truth: "target_feature_profile"
      }
    }
  };
}

export function isStaleDeterministicForensics({ artifactName, artifact } = {}) {
  const root = unwrap(artifact, artifactName);
  return root.forensic_contract?.contract_name !== CONTRACTS[artifactName] ||
    root.forensic_contract?.model_generated_forensics_allowed !== false ||
    root.forensic_boundary?.semantic_forensic_profile_retired !== true ||
    !Array.isArray(root.material_profile_trace_index) ||
    !root.forensic_lock_gate_result;
}

function buildCandidateCoverageLedger({ inventory, activities }) {
  return asArray(inventory.candidates).map((candidate) => {
    const match = asArray(activities).find((activity) => activityMatchesCandidate(activity, candidate));
    return match
      ? {
          candidate_id: candidate.candidate_id,
          activity_reference: match.activity_reference,
          coverage_disposition: "DIRECT_ACTIVITY_ROW",
          coverage_path: "deterministic_exact_slug_or_alias_match",
          reason: `candidate resolved by ${match.__m8_match_basis || "exact material field match"}`
        }
      : {
          candidate_id: candidate.candidate_id,
          activity_reference: null,
          coverage_disposition: "TARGETED_REINVESTIGATION_REQUIRED",
          coverage_path: "deterministic_exact_slug_or_alias_match",
          reason: "No exact product wrapper, activity feature, route slug or evidence-backed alias match exists in emitted M8 activities; non-blocking targeted reinvestigation required."
        };
  });
}

function activityMatchesCandidate(activity, candidate) {
  const fields = normalizeMatchText([
    activity.activity_reference,
    activity.product_service_wrapper,
    activity.activity_feature_name
  ].join(" "));
  for (const phrase of candidateMatchPhrases(candidate)) {
    if (phrase.length >= 3 && phraseInFields(phrase, fields)) {
      activity.__m8_match_basis = `exact_phrase:${phrase}`;
      return true;
    }
  }
  return false;
}

function candidateMatchPhrases(candidate) {
  const raw = [
    candidate.candidate_name,
    candidate.capability_key,
    candidate.wrapper_or_surface,
    candidate.canonical_feature_key,
    ...asArray(candidate.source_pointers).flatMap((pointer) => [
      pointer.locator_value,
      pointer.route_code,
      pointer.unit_id,
      pointer.source_id
    ])
  ].filter(Boolean);
  const phrases = new Set(raw.map(normalizeMatchText).filter(Boolean));
  return [...phrases]
    .flatMap((phrase) => phrase.includes("::") ? phrase.split("::").map(normalizeMatchText) : [phrase])
    .filter((phrase) => phrase && ![
      "api",
      "apis",
      "model",
      "models",
      "product wrapper",
      "standalone api"
    ].includes(phrase));
}

function phraseInFields(phrase, fields) {
  if (!phrase || !fields) return false;
  const words = phrase.split(" ").filter(Boolean);
  if (words.length === 1) return new RegExp(`(^|\\s)${escapeRegExp(words[0])}(\\s|$)`).test(fields);
  return fields.includes(phrase);
}

function classificationTrace(block = {}) {
  return {
    package_id: block.package_id || "",
    behavior_class_codes: asArray(block.behavior_class_codes),
    behavior_class_derivation_basis: asArray(block.behavior_class_derivation_basis),
    surface_context_tokens: asArray(block.surface_context_tokens),
    surface_derivation_basis: asArray(block.surface_derivation_basis)
  };
}

function packageScopedValues(packageId, values) {
  return asArray(values).map((value) => `${packageId || "UNMOUNTED"}::${value}`);
}

function contract(artifactName, traceScope) {
  return {
    contract_name: CONTRACTS[artifactName],
    trace_scope: traceScope,
    source_of_truth: "saved_artifacts",
    model_generated_forensics_allowed: false,
    deterministic_forensic_profile: true
  };
}

function boundary(artifactName) {
  return {
    material_profile_re_emitted: false,
    semantic_forensic_profile_retired: true,
    artifact_name: artifactName,
    downstream_artifacts_emitted: false
  };
}

function runtimeTrace(phase) {
  return {
    generated_by: "phase_owned_deterministic_profile_forensics",
    phase,
    model_role: "none_for_forensics",
    semantic_model_output_copied_only_from_saved_material_profile: true
  };
}

function sourceFamilyManifest(artifacts) {
  const rows = Object.keys(artifacts || {})
    .filter((key) => key.startsWith("lossless_root__") || [
      "source_discovery_handoff",
      "legal_cartography_index",
      "legal_signal_derivation_profile",
      "target_profile",
      "target_profile_forensics",
      "feature_candidate_inventory",
      "target_feature_profile",
      "target_feature_profile_forensics",
      "data_privacy_navigation_index",
      "dap_semantic_batch_route_manifest",
      "data_provenance_profile_semantic_batch_gate",
      "dap_forensics_profile"
    ].includes(key))
    .map((artifactName) => sourceCustodyRow(artifactName, artifacts[artifactName]));
  return {
    rows,
    present_families: rows.filter((row) => row.present).map((row) => row.artifact_name)
  };
}

function sourceCustodyRow(artifactName, artifact) {
  const sourceCount = asArray(artifact?.sources).length;
  return {
    artifact_name: artifactName,
    present: Boolean(artifact),
    source_role: artifactName.startsWith("lossless_") ? "lossless_source_root" : "upstream_locked_artifact",
    source_corpus_status: artifact ? (sourceCount ? "PHYSICAL_OR_RESOLVED_SOURCE_PRESENT" : "INDEX_OR_PROFILE_PRESENT") : "MISSING",
    source_count: sourceCount,
    physical_artifact_names: artifact?.physical_artifact_names || []
  };
}

function buildCrossRouteLedger(artifacts) {
  return Object.keys(artifacts || {})
    .filter((name) => !name.startsWith("lossless_root__"))
    .map((artifact_name) => ({ artifact_name, consumed_as_upstream: true }));
}

function buildObjectFieldTrace({ rootName, value }) {
  return flatten(value).map(([path, fieldValue]) => traceValue({
    trace_id: `${rootName}.${path}`,
    field_path: `${rootName}.${path}`,
    value: fieldValue
  }));
}

function traceValue({ trace_id, field_path, value }) {
  const preview = previewValue(value);
  return {
    trace_id,
    field_path,
    value_type: Array.isArray(value) ? "array" : isPlainObject(value) ? "object" : typeof value,
    value_status: valueStatus(value),
    value_preview: preview,
    report_field_human_readable: isReadable(preview),
    forensic_trace_present: true
  };
}

function valueStatus(value) {
  if (Array.isArray(value)) return value.length ? "ARRAY_PRESENT" : "EMPTY";
  if (isPlainObject(value)) return Object.keys(value).length ? "OBJECT_PRESENT" : "EMPTY";
  const text = String(value ?? "").trim();
  if (!text) return "EMPTY";
  if (CONTROLLED_VALUES.has(text)) return "CONTROLLED_VALUE";
  return "VALUE_PRESENT";
}

function previewValue(value) {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.slice(0, 500);
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  try { return JSON.stringify(value).slice(0, 500); } catch { return String(value).slice(0, 500); }
}

function buildProfileFieldReconciliation({ profileName, fieldTrace, limitationTrace, expectedRows = null }) {
  const failures = [];
  if (!fieldTrace.length) failures.push(`${profileName}:FIELD_TRACE_EMPTY`);
  if (expectedRows !== null && expectedRows === 0 && !limitationTrace.length) failures.push(`${profileName}:EMPTY_PROFILE_WITHOUT_LIMITATION_TRACE`);
  return [{
    profile_name: profileName,
    traced_fields: fieldTrace.length,
    traced_limitations: limitationTrace.length,
    expected_rows: expectedRows,
    status: failures.length ? "FAIL" : "PASS",
    failures
  }];
}

function buildFieldLockGate({ artifactName, expectedRoot, fieldTrace, limitationTrace }) {
  const failures = [];
  const warnings = [];
  if (!fieldTrace.length) failures.push(`${expectedRoot}:NO_FIELD_TRACE_ROWS`);
  if (!limitationTrace.length) warnings.push(`${expectedRoot}:NO_LIMITATION_ROWS`);
  return gate({ artifactName, failures, warnings });
}

function buildActivityLockGate({ activityTrace, fieldTrace, limitationTrace, coverage }) {
  const failures = [];
  const warnings = [];
  if (!activityTrace.length && !limitationTrace.length) failures.push("M8:NO_ACTIVITY_TRACE_AND_NO_LIMITATION_TRACE");
  if (coverage?.coverage_result !== "PASS") warnings.push(...(coverage?.failures || ["M8:CANDIDATE_COVERAGE_LIMITATION"]));
  for (const row of activityTrace) {
    if (!row.material_fields_complete) warnings.push(`${row.activity_reference}:MATERIAL_ACTIVITY_FIELDS_INCOMPLETE`);
    if (!row.report_fields_human_readable) warnings.push(`${row.activity_reference}:REPORT_FIELDS_NOT_HUMAN_READABLE`);
  }
  if (!fieldTrace.length && activityTrace.length) failures.push("M8:FIELD_TRACE_EMPTY");
  return gate({ artifactName: "target_feature_profile_forensics", failures, warnings });
}

function gate({ artifactName, failures, warnings }) {
  return {
    status: failures.length ? "REPAIR_REQUIRED" : "PASS",
    artifact_name: artifactName,
    blocking_failures: failures,
    non_blocking_warnings: warnings,
    clean_pass_allowed: failures.length === 0
  };
}

function hasMaterialValue(value) {
  if (Array.isArray(value)) return value.length > 0;
  if (isPlainObject(value)) return Object.keys(value).length > 0;
  return String(value ?? "").trim().length > 0;
}

function isReadable(value) {
  const text = String(value || "").trim();
  return text.length >= 12 && !THIN_VALUES.has(text.toLowerCase());
}

function hasEvidenceText(value) {
  const text = JSON.stringify(value || {}).toLowerCase();
  return ["excerpt", "clean_text", "lossless_text", "quoted_text", "source_text"].some((needle) => text.includes(needle));
}

function unwrap(input, key) {
  if (!input) return {};
  return input[key] && isPlainObject(input[key]) ? input[key] : input;
}

function flatten(value, prefix = "") {
  if (!isPlainObject(value) && !Array.isArray(value)) return prefix ? [[prefix, value]] : [];
  const entries = [];
  for (const [key, item] of Object.entries(value || {})) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(item)) entries.push(...flatten(item, next));
    else if (Array.isArray(item)) {
      if (!item.length) entries.push([next, item]);
      item.forEach((child, index) => {
        if (isPlainObject(child)) entries.push(...flatten(child, `${next}[${index}]`));
        else entries.push([`${next}[${index}]`, child]);
      });
    } else entries.push([next, item]);
  }
  return entries;
}

function normalizeMatchText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[_/|:-]+/g, " ")
    .replace(/[^a-z0-9\s]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function asArray(value) {
  return Array.isArray(value) ? value : value == null ? [] : [value];
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
