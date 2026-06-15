const REPAIR_ACTION = "rerun_missing_stage5_candidate_or_source_accounting";
const ARCHETYPES = new Set(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV"]);
const SURFACES = new Set(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function nonEmpty(value) {
  return typeof value === "string" && value.trim().length > 0;
}

function issue(keyword, severity, instancePath, message, params = {}) {
  return {
    keyword,
    severity,
    instancePath,
    schemaPath: "#/targetFeatureProfileQualityGuardrails",
    message,
    params
  };
}

function writeLimitation(profile, item, label = "STAGE5_QUALITY_WARNING") {
  if (!profile || typeof profile !== "object") return;
  if (!Array.isArray(profile.limitations)) profile.limitations = [];
  const line = `${label} ${item.instancePath || "/"}: ${item.message} ${JSON.stringify(item.params || {})}`;
  if (!profile.limitations.includes(line)) profile.limitations.push(line);
}

function addWarning(profile, result, path, message, params = {}) {
  const item = issue("target_feature_profile_quality_warning", "WARNING", path, message, params);
  result.warnings.push(item);
  writeLimitation(profile, item);
  return item;
}

function addRepair(profile, result, path, message, params = {}) {
  const item = {
    ...issue("target_feature_profile_quality_repair", "REPAIRABLE", path, message, params),
    action: REPAIR_ACTION
  };
  result.repairs.push(item);
  writeLimitation(profile, item, "STAGE5_QUALITY_REPAIR");
  return item;
}

function refs(value) {
  return asArray(value).map((item) => String(item || "").trim()).filter(Boolean);
}

function allDeliveryUnknown(feature = {}) {
  const d = feature.delivery_channels || {};
  return [d.app, d.api, d.web].every((value) => !nonEmpty(value) || value === "unknown");
}

function deliveryShouldBeKnowable(feature = {}) {
  const text = [
    feature.feature_name,
    feature.business_label_or_product_area,
    feature.commercial_function,
    feature.feature_source_url,
    feature.system_action,
    feature.output_or_result
  ].filter(Boolean).join(" ").toLowerCase();
  return /\bapi\b|developer|sdk|endpoint|web|app|dashboard|studio|platform|product|integration/.test(text);
}

function hasMatchingArchetypeProvenance(feature = {}, code = "") {
  return asArray(feature.archetype_provenance).some((row) => row?.archetype_code === code && refs(row.evidence_refs).length);
}

function hasMatchingSurfaceProvenance(feature = {}, token = "") {
  return asArray(feature.surface_provenance).some((row) => row?.surface_token === token && refs(row.evidence_refs).length);
}

function featureQualityProblems(feature = {}, index = 0) {
  const path = `/feature_inventory/${index}`;
  const problems = [];
  const archetypeCodes = asArray(feature.archetype_codes).filter((code) => ARCHETYPES.has(code));
  const surfaceTokens = asArray(feature.surface_tokens).filter((token) => SURFACES.has(token));

  if (!archetypeCodes.length) {
    problems.push({ path: `${path}/archetype_codes`, code: "missing_archetype", message: "Final atomic feature has no archetype_codes. Final feature_inventory rows must have at least one controlled archetype.", severity: "atomic_feature_invalid" });
  }

  if (!surfaceTokens.length) {
    problems.push({ path: `${path}/surface_tokens`, code: "missing_surface", message: "Final atomic feature has no surface_tokens. Final feature_inventory rows must have at least one controlled surface.", severity: "atomic_feature_invalid" });
  }

  for (const code of archetypeCodes) {
    if (!hasMatchingArchetypeProvenance(feature, code)) {
      problems.push({ path: `${path}/archetype_provenance`, code: "missing_archetype_provenance", message: `Archetype ${code} has no matching archetype_provenance with evidence_refs.`, severity: "atomic_feature_invalid", archetype_code: code });
    }
  }

  for (const token of surfaceTokens) {
    if (!hasMatchingSurfaceProvenance(feature, token)) {
      problems.push({ path: `${path}/surface_provenance`, code: "missing_surface_provenance", message: `Surface ${token} has no matching surface_provenance with evidence_refs.`, severity: "atomic_feature_invalid", surface_token: token });
    }
  }

  if (!nonEmpty(feature.feature_source_url)) {
    problems.push({ path: `${path}/feature_source_url`, code: "missing_feature_source_url", message: "Final atomic feature is missing feature_source_url.", severity: "atomic_feature_invalid" });
  }

  if (!refs(feature.evidence_refs).length) {
    problems.push({ path: `${path}/evidence_refs`, code: "missing_feature_evidence_refs", message: "Final atomic feature is missing evidence_refs.", severity: "atomic_feature_invalid" });
  }

  if (allDeliveryUnknown(feature) && deliveryShouldBeKnowable(feature)) {
    problems.push({ path: `${path}/delivery_channels`, code: "unknown_delivery_channels", message: "Feature appears to have product/API/app/web evidence but delivery_channels are all unknown.", severity: "field_quality" });
  }

  return problems;
}

function unresolvedCandidateFromFeature(feature = {}, index = 0, problems = []) {
  return {
    candidate_id: `UNRESOLVED_FEATURE_${String(index + 1).padStart(3, "0")}`,
    candidate_name: feature.feature_name || feature.business_label_or_product_area || `Feature ${index + 1}`,
    previous_feature_id: feature.feature_id || null,
    reason: problems.map((problem) => problem.code).join(", ") || "unresolved_feature_classification",
    source_url: feature.feature_source_url || null,
    evidence_refs: refs(feature.evidence_refs),
    recommended_downstream_handling: "Do not treat as final atomic feature. Use as unresolved candidate context and trigger fallback routing if needed."
  };
}

function ensureQualityContainers(profile = {}) {
  if (!Array.isArray(profile.unresolved_feature_candidates)) profile.unresolved_feature_candidates = [];
  if (!profile.classification_quality || typeof profile.classification_quality !== "object" || Array.isArray(profile.classification_quality)) {
    profile.classification_quality = {};
  }
}

export function validateStage5FeatureQuality(profile, result, options = {}) {
  if (!profile || typeof profile !== "object" || Array.isArray(profile)) return result;

  result.warnings = asArray(result.warnings);
  result.repairs = asArray(result.repairs);
  result.errors = asArray(result.errors);

  const afterRepair = Boolean(options?.packageInput?.completion_repair_request);
  const features = asArray(profile.feature_inventory);
  const problemsByFeature = features.map((feature, index) => ({ feature, index, problems: featureQualityProblems(feature, index) }));
  const failedFeatureRows = problemsByFeature.filter((row) => row.problems.length);

  ensureQualityContainers(profile);

  if (!failedFeatureRows.length) {
    profile.classification_quality = {
      quality_version: "stage5_feature_classification_quality_v1",
      status: "PASS",
      reinvestigation_required: false,
      reinvestigation_attempted: afterRepair,
      reinvestigation_pass_count: afterRepair ? 1 : 0,
      unresolved_feature_count: asArray(profile.unresolved_feature_candidates).length,
      fallback_routing_required: asArray(profile.unresolved_feature_candidates).length > 0
    };
    return result;
  }

  if (!afterRepair) {
    for (const row of failedFeatureRows) {
      addRepair(profile, result, `/feature_inventory/${row.index}`, "Stage 5 final feature classification is incomplete; run one focused Stage5R reinvestigation for this feature before allowing it to feed Stage 7.", {
        feature_id: row.feature?.feature_id || null,
        feature_name: row.feature?.feature_name || null,
        failed_fields: row.problems.map((problem) => problem.code),
        reinvestigation_policy: "one_pass_only"
      });
    }
    profile.classification_quality = {
      quality_version: "stage5_feature_classification_quality_v1",
      status: "REINVESTIGATION_REQUIRED",
      reinvestigation_required: true,
      reinvestigation_attempted: false,
      reinvestigation_pass_count: 0,
      unresolved_feature_count: failedFeatureRows.length,
      fallback_routing_required: false
    };
    return result;
  }

  const failedIndexes = new Set(failedFeatureRows.map((row) => row.index));
  const unresolved = failedFeatureRows.map((row) => unresolvedCandidateFromFeature(row.feature, row.index, row.problems));
  profile.unresolved_feature_candidates.push(...unresolved);
  profile.feature_inventory = features.filter((_, index) => !failedIndexes.has(index));

  addWarning(profile, result, "/classification_quality", "Stage5R reinvestigation left unresolved feature classifications. Invalid final feature rows were moved to unresolved_feature_candidates and runtime may continue in degraded fallback mode.", {
    moved_feature_count: unresolved.length,
    unresolved_candidate_ids: unresolved.map((row) => row.candidate_id),
    fallback_routing_required: true
  });

  profile.classification_quality = {
    quality_version: "stage5_feature_classification_quality_v1",
    status: "DEGRADED",
    reinvestigation_required: false,
    reinvestigation_attempted: true,
    reinvestigation_pass_count: 1,
    unresolved_feature_count: asArray(profile.unresolved_feature_candidates).length,
    fallback_routing_required: true
  };

  return result;
}
