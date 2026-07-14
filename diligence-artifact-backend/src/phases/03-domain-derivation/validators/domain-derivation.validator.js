import { DOMAIN_DERIVATION_CONTRACT } from "../domain-derivation.contract.js";
import { loadDomainDerivationRegistryV0 } from "../../../runtime/domain-gate/domain-derivation-registry.loader.js";
import { buildPhase3BDomainDerivationManifestUpdate } from "../../../runtime/domain-gate/active-run-package-manifest.schema.js";
import { isMountableLifecycle } from "../../../runtime/domain-gate/package-lifecycle.loader.js";

const CONTROLLED_FAILURE_STATUS = "CONTROLLED_FAILURE";
const REINVESTIGATION_REQUIRED_STATUS = "REINVESTIGATION_REQUIRED";
const AI_MOUNT_ONLY_STATUS = "LOCKED_FOR_PACKAGE_MOUNT_ONLY";
const REGULATORY_CANDIDATE_STATUS = "CANDIDATE_ONLY";
const AI_MOUNT_VALUES = new Set(["AI_PRIMARY", "AI_OVERLAY_MOUNTED", "AI_CANDIDATE_ONLY", "AI_NOT_VISIBLE"]);
const FORBIDDEN_OUTPUT_MARKERS = Object.freeze([
  "business_context.lane", "\"lane\"", "legal_advice", "\"compliance_conclusion\"",
  "enforceability_assessment", "risk_conclusion", "exposure_registry", "ai_archetype",
  "surface_lock", "license_validity", "license_requirement", "applicable_regulator",
  "regulatory_compliance_status", "grievance_sufficiency", "grievance_compliance_status",
  "ombudsman_requirement", "statutory_complaint_obligation"
]);
const INDEX_ARTIFACT_NAMES = new Set([
  "cartography_index", "target_profile_source_index", "domain_derivation_source_index",
  "activity_profile_source_index", "legal_cartography_index", "legal_signal_derivation_profile",
  "data_privacy_navigation_index", "source_discovery_handoff", "phase_routing_manifest",
  "phase_route_runtime_packet"
]);

export async function compileDomainDerivationArtifacts({
  run = {},
  artifacts = {},
  modelOutput = {},
  registryPacket,
  reinvestigationExhausted = false
} = {}) {
  const packet = registryPacket || await loadDomainDerivationRegistryV0();
  const registry = packet.registry;
  assertDomainDerivationRuntimeArtifacts(artifacts);
  const rawProfile = modelOutput?.domain_derivation_profile || modelOutput || {};
  const normalized = normalizeProfile({ run, rawProfile, artifacts, registry });
  let validation = validateDomainDerivationProfile(normalized, { artifacts, registry });

  if (reinvestigationExhausted && validation.status === REINVESTIGATION_REQUIRED_STATUS) {
    validation = finalizeValidationAfterReinvestigation({ profile: normalized, validation });
  }

  normalized.primary_domain_derivation = applyPrimaryValidationStatus(normalized.primary_domain_derivation, validation);
  normalized.ai_mount_derivation = applyAiValidationStatus(normalized.ai_mount_derivation, validation);
  const manifest = compileActiveRunPackageManifest({ run, artifacts, profile: normalized, validation });
  normalized.manifest_update = manifest.manifest_update;
  normalized.validation_summary = validation;
  return {
    output: {
      domain_derivation_profile: normalized,
      active_run_package_manifest: manifest.active_run_package_manifest
    },
    phase_lock_status: validation.status,
    validation
  };
}

export function validateDomainDerivationProfile(profile = {}, { artifacts = {}, registry = {} } = {}) {
  const criticalFailures = [];
  const reinvestigationItems = [];
  const limitations = [];
  const warnings = [];

  if (!isPlainObject(profile)) criticalFailures.push("domain_derivation_profile must be object");
  for (const branch of DOMAIN_DERIVATION_CONTRACT.output_contract.required_top_level_branches) {
    if (!Object.prototype.hasOwnProperty.call(profile, branch)) criticalFailures.push(`domain_derivation_profile missing ${branch}`);
  }
  assertNoForbiddenMarkers(profile, criticalFailures);
  assertDomainDerivationRuntimeArtifacts(artifacts, criticalFailures);

  const rulesById = new Map((registry.rules || []).map((rule) => [rule.rule_id, rule]));
  const evaluatedRules = allEvaluatedRules(profile);
  for (const row of evaluatedRules) {
    validateEvaluatedRule(row, { rulesById, criticalFailures, reinvestigationItems, warnings });
  }

  const primary = profile.primary_domain_derivation || {};
  const aiMount = profile.ai_mount_derivation || {};
  const fusion = profile.fusion_candidate_derivation || {};
  const primaryAssessment = assessModelPrimary({ primary, registry, rulesById, criticalFailures, reinvestigationItems, limitations, warnings });
  const aiAssessment = assessModelAiMount({ aiMount, primary, registry, rulesById, criticalFailures, reinvestigationItems, limitations, warnings });

  validateRegulatoryOverlayDerivation(profile.regulatory_overlay_derivation || {}, {
    artifacts,
    criticalFailures,
    reinvestigationItems,
    limitations,
    warnings
  });

  if (primary.selected_package === "ai-governance" && aiMount.ai_package_mount === "AI_OVERLAY_MOUNTED") {
    reinvestigationItems.push("AI_PRIMARY_AND_AI_OVERLAY_CANNOT_BOTH_APPLY");
  }
  if ((fusion.candidates || []).length && aiMount.ai_package_mount !== "AI_OVERLAY_MOUNTED") {
    reinvestigationItems.push("FUSION_CANDIDATE_REQUIRES_AI_OVERLAY_MOUNTED");
  }
  for (const candidate of fusion.candidates || []) {
    if (candidate.fusion_owner && primary.selected_package && candidate.fusion_owner !== primary.selected_package) {
      reinvestigationItems.push(`FUSION_OWNER_MISMATCH:${candidate.fusion_owner}:${primary.selected_package}`);
    }
  }

  const status = criticalFailures.length
    ? CONTROLLED_FAILURE_STATUS
    : reinvestigationItems.length
      ? REINVESTIGATION_REQUIRED_STATUS
      : limitations.length
        ? "LOCKED_WITH_LIMITATIONS"
        : "LOCKED";

  return {
    status,
    validator: "domain-derivation.validator.v3_model_led_critical_only",
    derivation_authority: "MODEL_SEMANTIC_JUDGMENT",
    deterministic_role: "STRUCTURE_EVIDENCE_CONSISTENCY_AND_MOUNT_VALIDATION_ONLY",
    registry_conditions_support_model_reasoning: true,
    deterministic_selection_forbidden: true,
    blocking_is_exception: true,
    only_critical_failure_blocks: true,
    maximum_reinvestigation_attempts: 2,
    primary_domain_semantically_usable: primaryAssessment.semantic_usable,
    primary_package_mount_eligible: primaryAssessment.mount_eligible,
    ai_overlay_semantically_usable: aiAssessment.overlay_usable,
    ai_overlay_mount_eligible: aiAssessment.mount_eligible,
    gates_passed: criticalFailures.length ? [] : [
      "SCHEMA", "REGISTRY_SUPPORT", "MODEL_DERIVATION_AUTHORITY", "SCOPED_EVIDENCE",
      "P2G_ROUTE_PACKET", "P2B_DOMAIN_SOURCE_INDEX", "LEGAL_INPUTS_FORBIDDEN",
      "PRIMARY_DOMAIN_MODEL_JUDGMENT", "PACKAGE_LIFECYCLE_MOUNT_VALIDATION",
      "AI_OVERLAY_MODEL_JUDGMENT", "REGULATORY_OVERLAY_CANDIDATE_ONLY",
      "FUSION_DOMAIN_OWNED", "MANIFEST_COMPILABLE"
    ],
    failures: criticalFailures,
    critical_failures: criticalFailures,
    reinvestigation_items: unique(reinvestigationItems),
    limitations: unique(limitations),
    warnings: unique(warnings)
  };
}

export function assertDomainDerivationRuntimeArtifacts(artifacts = {}, failures = null) {
  const localFailures = failures || [];
  const allowed = new Set(DOMAIN_DERIVATION_CONTRACT.reads);
  for (const key of Object.keys(artifacts || {})) if (!allowed.has(key)) localFailures.push(`P3_DOMAIN_DERIVATION_FORBIDDEN_RUNTIME_ARTIFACT:${key}`);
  for (const required of ["phase_routing_manifest", "phase_route_runtime_packet", "domain_derivation_source_index", "target_profile", "domain_selection_profile", "active_run_package_manifest"]) {
    if (!Object.prototype.hasOwnProperty.call(artifacts || {}, required)) localFailures.push(`P3_DOMAIN_DERIVATION_MISSING_REQUIRED_INPUT:${required}`);
  }
  for (const root of DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads) {
    if (!Object.prototype.hasOwnProperty.call(artifacts || {}, root)) localFailures.push(`P3_DOMAIN_DERIVATION_MISSING_SCOPED_LOSSLESS_ROOT:${root}`);
  }
  for (const forbidden of DOMAIN_DERIVATION_CONTRACT.forbidden_reads) {
    if (Object.prototype.hasOwnProperty.call(artifacts || {}, forbidden)) localFailures.push(`P3_DOMAIN_DERIVATION_FORBIDDEN_INPUT_PRESENT:${forbidden}`);
  }
  const routePacket = artifacts?.phase_route_runtime_packet || {};
  if (routePacket.routing_authority !== "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY") localFailures.push("P3_DOMAIN_DERIVATION_PHASE2G_ROUTING_AUTHORITY_MISSING");
  if (routePacket.route_id !== DOMAIN_DERIVATION_CONTRACT.route_contract.route_id) localFailures.push(`P3_DOMAIN_DERIVATION_PHASE2G_ROUTE_ID_MISMATCH:${routePacket.route_id || "missing"}`);
  if (routePacket.bucket_id !== DOMAIN_DERIVATION_CONTRACT.route_contract.bucket_id) localFailures.push(`P3_DOMAIN_DERIVATION_PHASE2G_BUCKET_ID_MISMATCH:${routePacket.bucket_id || "missing"}`);
  if (routePacket.lossless_evidence_role !== "PRIMARY_EVIDENCE") localFailures.push("P3_DOMAIN_DERIVATION_LOSSLESS_PRIMARY_BOUNDARY_MISSING");
  if (routePacket.index_role !== "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE") localFailures.push("P3_DOMAIN_DERIVATION_INDEX_NAVIGATION_BOUNDARY_MISSING");
  if (routePacket.profile_forensics_inputs_allowed !== false) localFailures.push("P3_DOMAIN_DERIVATION_FORENSICS_INPUT_BOUNDARY_MISSING");
  if (!failures && localFailures.length) throw new Error(`P3_DOMAIN_DERIVATION_INPUT_CONTRACT_FAILED:${JSON.stringify(localFailures)}`);
}

function normalizeProfile({ run, rawProfile, artifacts, registry }) {
  const primaryRows = normalizeRows(rawProfile?.primary_domain_derivation?.evaluated_rules || rawProfile?.evaluated_rules || [], registry, "PRIMARY_DOMAIN");
  const aiRows = normalizeRows(rawProfile?.ai_mount_derivation?.evaluated_rules || [], registry, "AI_MOUNT");
  const fusionRows = normalizeRows(rawProfile?.fusion_candidate_derivation?.evaluated_rules || [], registry, "FUSION_CANDIDATE");
  const primary = selectPrimaryFromModel(primaryRows, registry, rawProfile?.primary_domain_derivation || {});
  const aiMount = selectAiMountFromModel(aiRows, primary, registry, rawProfile?.ai_mount_derivation || {});
  const regulatoryOverlay = selectRegulatoryOverlay(rawProfile?.regulatory_overlay_derivation || {}, artifacts);
  const fusion = selectFusionFromModel(fusionRows, primary, aiMount, rawProfile?.fusion_candidate_derivation || {});
  return {
    domain_derivation_metadata: {
      run_id: run.run_id || rawProfile?.domain_derivation_metadata?.run_id || "",
      internal_job_id: DOMAIN_DERIVATION_CONTRACT.internal_job_id,
      central_phase_id: DOMAIN_DERIVATION_CONTRACT.central_phase_id,
      registry_id: registry.registry_id || "DILIGENCE_DOMAIN_REGISTRY_v1",
      registry_version: registry.schema_version || "",
      generated_by: "P3_DOMAIN_DERIVATION_LAYER",
      derivation_authority: "MODEL_SEMANTIC_JUDGMENT",
      deterministic_role: "SUPPORT_VALIDATION_ONLY",
      prompt_package_status: DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_package_status
    },
    input_scope: {
      required_reads_present: DOMAIN_DERIVATION_CONTRACT.reads.filter((name) => Object.prototype.hasOwnProperty.call(artifacts, name)),
      routing_authority: artifacts?.phase_route_runtime_packet?.routing_authority || "",
      phase_2g_route_id: artifacts?.phase_route_runtime_packet?.route_id || "",
      phase_2g_bucket_id: artifacts?.phase_route_runtime_packet?.bucket_id || "",
      phase_2_navigation_artifacts_used: ["domain_derivation_source_index"],
      p2b_domain_derivation_source_index_required: true,
      activity_profile_source_index_forbidden_until_2c_phase5: true,
      scoped_lossless_evidence_artifacts_used: DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads,
      phase_2_indexes_are_navigation_only_not_evidence: true,
      target_profile_used_as_context_only: true,
      legal_inputs_forbidden: true,
      profile_forensics_inputs_used: false
    },
    source_evidence_ledger: buildSourceEvidenceLedger(artifacts, [...primaryRows, ...aiRows, ...fusionRows], regulatoryOverlay.candidates),
    primary_domain_derivation: primary,
    ai_mount_derivation: aiMount,
    regulatory_overlay_derivation: regulatoryOverlay,
    fusion_candidate_derivation: fusion,
    manifest_update: rawProfile?.manifest_update || {},
    limitation_ledger: Array.isArray(rawProfile?.limitation_ledger) ? rawProfile.limitation_ledger : [],
    contradiction_ledger: Array.isArray(rawProfile?.contradiction_ledger) ? rawProfile.contradiction_ledger : [],
    validation_summary: rawProfile?.validation_summary || {}
  };
}

function normalizeRows(rows, registry, expectedType) {
  const rulesById = new Map((registry.rules || []).map((rule) => [rule.rule_id, rule]));
  return (Array.isArray(rows) ? rows : []).map((row) => {
    const rule = rulesById.get(row?.rule_id) || {};
    const conditionBooleans = normalizeConditionBooleans(row?.condition_results || row?.conditions || {});
    const triggerClaimPresent = Object.prototype.hasOwnProperty.call(row || {}, "trigger_result") || Object.prototype.hasOwnProperty.call(row || {}, "trigger_claimed");
    const excludeClaimPresent = Object.prototype.hasOwnProperty.call(row || {}, "exclude_result") || Object.prototype.hasOwnProperty.call(row || {}, "exclude_claimed");
    const triggerClaim = triggerClaimPresent ? Boolean(row?.trigger_result ?? row?.trigger_claimed) : null;
    const excludeClaim = excludeClaimPresent ? Boolean(row?.exclude_result ?? row?.exclude_claimed) : null;
    const supportTrigger = rule.trigger_if ? evaluateBooleanExpressionWithCoverage(rule.trigger_if, conditionBooleans) : { result: null, complete: false };
    return {
      rule_id: row?.rule_id || "",
      rule_type: rule.rule_type || row?.rule_type || expectedType,
      package_id: row?.package_id || rule.package_id || null,
      package_lifecycle: rule.package_lifecycle || registry.package_lifecycle_by_id?.[rule.package_id]?.lifecycle || "",
      condition_results: row?.condition_results || row?.conditions || {},
      trigger_result_claimed: triggerClaim,
      trigger_result_claim_present: triggerClaimPresent,
      exclude_result_claimed: excludeClaim,
      exclude_result_claim_present: excludeClaimPresent,
      validator_trigger_result: triggerClaim === true,
      validator_exclude_result: excludeClaim === true,
      deterministic_support_trigger_result: supportTrigger.result,
      deterministic_support_trigger_complete: supportTrigger.complete,
      deterministic_support_trigger_consistent: triggerClaim === null || !supportTrigger.complete ? null : triggerClaim === supportTrigger.result,
      evidence_anchors: evidenceAnchorsForRow(row),
      limitation_notes: Array.isArray(row?.limitation_notes) ? row.limitation_notes : [],
      rule_priority: Number(rule.priority || 0),
      model_reasoning_basis: row?.reasoning_basis || row?.final_basis || "",
      deterministic_support_not_selection_authority: true
    };
  });
}

function selectPrimaryFromModel(rows, registry, modelPrimary) {
  const selectedPackage = cleanId(modelPrimary.selected_package || modelPrimary.primary_domain_package || modelPrimary.primary_domain);
  const inferredRow = selectedPackage
    ? rows.find((row) => row.package_id === selectedPackage && row.trigger_result_claimed === true && row.exclude_result_claimed !== true)
    : null;
  const selectedRuleId = cleanId(modelPrimary.selected_rule_id || inferredRow?.rule_id);
  const lifecycle = selectedPackage ? registry.package_lifecycle_by_id?.[selectedPackage] || null : null;
  return {
    selected_package: selectedPackage || null,
    status: selectedPackage ? (modelPrimary.status || "LOCKED") : "REVIEW_REQUIRED",
    selected_rule_id: selectedRuleId || null,
    package_lifecycle_state: lifecycle?.lifecycle || "",
    downstream_delivery_mode: lifecycle?.downstream_delivery_mode || "",
    package_mount_eligible: isMountableLifecycle(lifecycle),
    evidence_anchors: evidenceAnchorsForRow(modelPrimary).length ? evidenceAnchorsForRow(modelPrimary) : evidenceAnchorsForRow(inferredRow || {}),
    evaluated_rules: rows,
    conflict_resolution: modelPrimary.conflict_resolution || "MODEL_SEMANTIC_JUDGMENT",
    derivation_authority: "MODEL_SEMANTIC_JUDGMENT",
    deterministic_support_role: "REGISTRY_STRUCTURE_EVIDENCE_AND_MOUNT_VALIDATION",
    final_basis: modelPrimary.final_basis || "model_semantic_derivation_using_registry_conditions_trigger_and_exclude_support"
  };
}

function selectAiMountFromModel(rows, primary, registry, modelAi) {
  const aiPrimary = primary.selected_package === "ai-governance";
  const selectedRuleId = cleanId(modelAi.selected_rule_id);
  const selectedRow = rows.find((row) => row.rule_id === selectedRuleId)
    || rows.find((row) => row.trigger_result_claimed === true && row.exclude_result_claimed !== true)
    || null;
  let mount = aiPrimary ? "AI_PRIMARY" : cleanId(modelAi.ai_package_mount || modelAi.mount_status);
  if (!mount && selectedRuleId === "AI_OVERLAY_MOUNTED") mount = "AI_OVERLAY_MOUNTED";
  if (!mount && selectedRuleId === "AI_CANDIDATE_ONLY") mount = "AI_CANDIDATE_ONLY";
  if (!mount) mount = "AI_NOT_VISIBLE";
  const lifecycle = registry.package_lifecycle_by_id?.["ai-governance"] || null;
  const overlayMounted = mount === "AI_OVERLAY_MOUNTED";
  return {
    ai_package_mount: mount,
    status: aiPrimary
      ? "LOCKED"
      : overlayMounted
        ? AI_MOUNT_ONLY_STATUS
        : mount === "AI_CANDIDATE_ONLY"
          ? "CANDIDATE_ONLY"
          : "NOT_VISIBLE",
    selected_rule_id: aiPrimary ? "PRIMARY_DOMAIN_AI_GOVERNANCE" : (selectedRuleId || selectedRow?.rule_id || null),
    overlay_package_id: aiPrimary ? null : (modelAi.overlay_package_id || "ai-native"),
    package_lifecycle_state: lifecycle?.lifecycle || "",
    package_mount_eligible: aiPrimary || overlayMounted ? isMountableLifecycle(lifecycle) : false,
    evidence_anchors: evidenceAnchorsForRow(modelAi).length ? evidenceAnchorsForRow(modelAi) : evidenceAnchorsForRow(selectedRow || {}),
    package_mount_lock_status: overlayMounted ? AI_MOUNT_ONLY_STATUS : null,
    activity_lock_status: "DEFERRED_TO_PHASE_5",
    exposure_lock_status: "DEFERRED_TO_PHASE_9",
    archetype_lock_deferred_to_phase_5: true,
    surface_classification_deferred_to_phase_5: true,
    evaluated_rules: rows,
    derivation_authority: "MODEL_SEMANTIC_JUDGMENT",
    deterministic_support_role: "REGISTRY_STRUCTURE_EVIDENCE_AND_MOUNT_VALIDATION",
    final_basis: modelAi.final_basis || "model_semantic_ai_mount_derivation_using_registry_support"
  };
}

function selectRegulatoryOverlay(modelRegulatory = {}, artifacts = {}) {
  const rawCandidates = Array.isArray(modelRegulatory.candidates)
    ? modelRegulatory.candidates
    : (Array.isArray(modelRegulatory.regulatory_overlays) ? modelRegulatory.regulatory_overlays : []);
  const candidates = rawCandidates.map((candidate) => ({
    overlay_id: String(candidate?.overlay_id || candidate?.regulatory_overlay || candidate?.overlay || "").trim(),
    status: candidate?.status || REGULATORY_CANDIDATE_STATUS,
    evidence_anchors: evidenceAnchorsForRow(candidate),
    candidate_basis: candidate?.candidate_basis || "model_semantic_candidate_from_scoped_lossless_evidence",
    legal_applicability_status: "NOT_DETERMINED_IN_PHASE_3B",
    compliance_conclusion_forbidden: true
  })).filter((candidate) => candidate.overlay_id);
  return {
    status: candidates.length ? (modelRegulatory.status || REGULATORY_CANDIDATE_STATUS) : "NOT_VISIBLE",
    catalog_source: "package-catalog.v0.json:regulatory_overlays",
    candidates,
    legal_applicability_status: "NOT_DETERMINED_IN_PHASE_3B",
    compliance_conclusion_forbidden: true,
    derivation_authority: "MODEL_SEMANTIC_JUDGMENT",
    final_basis: modelRegulatory.final_basis || "model_semantic_regulatory_candidates_catalog_validated_and_deferred"
  };
}

function selectFusionFromModel(rows, primary, aiMount, modelFusion) {
  const allowed = Boolean(primary.selected_package && primary.selected_package !== "ai-governance" && aiMount.ai_package_mount === "AI_OVERLAY_MOUNTED");
  const modelCandidates = Array.isArray(modelFusion.candidates) ? modelFusion.candidates : [];
  const supportCandidates = rows
    .filter((row) => row.trigger_result_claimed === true && row.exclude_result_claimed !== true)
    .map((row) => ({ rule_id: row.rule_id }));
  const candidates = allowed ? (modelCandidates.length ? modelCandidates : supportCandidates).map((candidate) => ({
    ...candidate,
    fusion_owner: candidate.fusion_owner || primary.selected_package,
    candidate_basis: candidate.candidate_basis || "model_semantic_domain_owned_ai_fusion_candidate",
    deferred_to: "PHASE_5_ACTIVITY_PROFILE_AND_PHASE_9_EXPOSURE_PROFILE"
  })) : [];
  return {
    status: candidates.length ? "CANDIDATE_ONLY" : "NOT_VISIBLE",
    evaluated_rules: rows,
    candidates,
    derivation_authority: "MODEL_SEMANTIC_JUDGMENT",
    final_basis: modelFusion.final_basis || "model_semantic_fusion_candidates_deferred_downstream"
  };
}

function assessModelPrimary({ primary, registry, rulesById, criticalFailures, reinvestigationItems, limitations, warnings }) {
  const selectedPackage = cleanId(primary.selected_package);
  if (!selectedPackage) {
    reinvestigationItems.push("PRIMARY_DOMAIN_NOT_DERIVED");
    return { semantic_usable: false, mount_eligible: false };
  }
  const lifecycle = registry.package_lifecycle_by_id?.[selectedPackage] || null;
  if (!lifecycle || lifecycle.derivable_in_phase3b !== true) {
    reinvestigationItems.push(`PRIMARY_DOMAIN_NOT_IN_CATALOG:${selectedPackage}`);
    return { semantic_usable: false, mount_eligible: false };
  }

  const selectedRule = primary.selected_rule_id ? rulesById.get(primary.selected_rule_id) : null;
  const selectedRow = (primary.evaluated_rules || []).find((row) => row.rule_id === primary.selected_rule_id)
    || (primary.evaluated_rules || []).find((row) => row.package_id === selectedPackage && row.trigger_result_claimed === true && row.exclude_result_claimed !== true)
    || null;
  const installedKeyPresent = Boolean(registry.keys_by_package?.[selectedPackage]);

  if (installedKeyPresent) {
    if (!selectedRule || selectedRule.rule_type !== "PRIMARY_DOMAIN" || selectedRule.package_id !== selectedPackage) {
      reinvestigationItems.push(`PRIMARY_DOMAIN_SELECTED_RULE_MISMATCH:${selectedPackage}:${primary.selected_rule_id || "missing"}`);
    }
    if (!selectedRow) {
      reinvestigationItems.push(`PRIMARY_DOMAIN_SELECTED_RULE_EVALUATION_MISSING:${selectedPackage}`);
    } else {
      if (selectedRow.trigger_result_claimed !== true) reinvestigationItems.push(`PRIMARY_DOMAIN_TRIGGER_NOT_AFFIRMED:${selectedPackage}`);
      if (selectedRow.exclude_result_claimed === true) reinvestigationItems.push(`PRIMARY_DOMAIN_SELECTED_RULE_EXCLUDED:${selectedPackage}`);
      if (selectedRow.exclude_result_claim_present !== true) reinvestigationItems.push(`PRIMARY_DOMAIN_EXCLUSION_NOT_ADDRESSED:${selectedPackage}`);
      if (selectedRow.deterministic_support_trigger_consistent === false) reinvestigationItems.push(`PRIMARY_DOMAIN_CONDITION_TRIGGER_INCONSISTENT:${selectedPackage}`);
    }
  } else {
    limitations.push(`PRIMARY_DOMAIN_DERIVED_WITHOUT_INSTALLED_REGISTRY_KEY:${selectedPackage}`);
  }

  const anchors = primary.evidence_anchors || evidenceAnchorsForRow(selectedRow || {});
  if (!anchors.length) reinvestigationItems.push(`PRIMARY_DOMAIN_MISSING_EVIDENCE_ANCHOR:${selectedPackage}`);
  assertAnchorsAreScopedLossless(anchors, criticalFailures, `primary_domain:${selectedPackage}`);

  const positiveClaims = (primary.evaluated_rules || []).filter((row) => row.rule_type === "PRIMARY_DOMAIN" && row.trigger_result_claimed === true && row.exclude_result_claimed !== true);
  if (positiveClaims.length > 1) reinvestigationItems.push(`MULTIPLE_PRIMARY_DOMAIN_MODEL_CLAIMS:${positiveClaims.map((row) => row.rule_id).join(",")}`);
  if (!isMountableLifecycle(lifecycle)) limitations.push(`PRIMARY_DOMAIN_PACKAGE_NOT_INSTALLED:${selectedPackage}`);
  if (primary.conflict_resolution === "") warnings.push("PRIMARY_DOMAIN_CONFLICT_RESOLUTION_NOT_STATED");

  const semanticUsable = Boolean(
    lifecycle
    && anchors.length
    && (!installedKeyPresent || (selectedRule && selectedRow && selectedRow.trigger_result_claimed === true && selectedRow.exclude_result_claimed !== true))
  );
  return { semantic_usable: semanticUsable, mount_eligible: isMountableLifecycle(lifecycle) };
}

function assessModelAiMount({ aiMount, primary, registry, rulesById, criticalFailures, reinvestigationItems, limitations }) {
  const mount = cleanId(aiMount.ai_package_mount) || "AI_NOT_VISIBLE";
  if (!AI_MOUNT_VALUES.has(mount)) {
    reinvestigationItems.push(`AI_MOUNT_VALUE_INVALID:${mount}`);
    return { overlay_usable: false, mount_eligible: false };
  }
  if (primary.selected_package === "ai-governance" && mount !== "AI_PRIMARY") {
    reinvestigationItems.push("AI_PRIMARY_DOMAIN_REQUIRES_AI_PRIMARY_MOUNT");
  }
  if (mount !== "AI_OVERLAY_MOUNTED") return { overlay_usable: mount === "AI_PRIMARY", mount_eligible: mount === "AI_PRIMARY" };

  const lifecycle = registry.package_lifecycle_by_id?.["ai-governance"] || null;
  const selectedRule = aiMount.selected_rule_id ? rulesById.get(aiMount.selected_rule_id) : null;
  const selectedRow = (aiMount.evaluated_rules || []).find((row) => row.rule_id === aiMount.selected_rule_id)
    || (aiMount.evaluated_rules || []).find((row) => row.rule_id === "AI_OVERLAY_MOUNTED" && row.trigger_result_claimed === true && row.exclude_result_claimed !== true)
    || null;
  if (!selectedRule || selectedRule.rule_type !== "AI_MOUNT") reinvestigationItems.push(`AI_OVERLAY_SELECTED_RULE_MISSING:${aiMount.selected_rule_id || "missing"}`);
  if (!selectedRow) reinvestigationItems.push("AI_OVERLAY_RULE_EVALUATION_MISSING");
  else {
    if (selectedRow.trigger_result_claimed !== true) reinvestigationItems.push("AI_OVERLAY_TRIGGER_NOT_AFFIRMED");
    if (selectedRow.exclude_result_claimed === true) reinvestigationItems.push("AI_OVERLAY_SELECTED_RULE_EXCLUDED");
    if (selectedRow.exclude_result_claim_present !== true) reinvestigationItems.push("AI_OVERLAY_EXCLUSION_NOT_ADDRESSED");
    if (selectedRow.deterministic_support_trigger_consistent === false) reinvestigationItems.push("AI_OVERLAY_CONDITION_TRIGGER_INCONSISTENT");
  }
  const anchors = aiMount.evidence_anchors || evidenceAnchorsForRow(selectedRow || {});
  if (!anchors.length) reinvestigationItems.push("AI_OVERLAY_MISSING_EVIDENCE_ANCHOR");
  assertAnchorsAreScopedLossless(anchors, criticalFailures, "ai_overlay");
  if (!isMountableLifecycle(lifecycle)) criticalFailures.push("AI_OVERLAY_PACKAGE_ASSETS_UNAVAILABLE");
  if (aiMount.status !== AI_MOUNT_ONLY_STATUS) limitations.push(`AI_OVERLAY_STATUS_NORMALIZED_TO:${AI_MOUNT_ONLY_STATUS}`);
  const usable = Boolean(selectedRule && selectedRow && selectedRow.trigger_result_claimed === true && selectedRow.exclude_result_claimed !== true && anchors.length && isMountableLifecycle(lifecycle));
  return { overlay_usable: usable, mount_eligible: isMountableLifecycle(lifecycle) };
}

function validateEvaluatedRule(row, { rulesById, criticalFailures, reinvestigationItems, warnings }) {
  if (!row.rule_id || !rulesById.has(row.rule_id)) {
    reinvestigationItems.push(`UNKNOWN_EVALUATED_RULE_ID:${row.rule_id || "missing"}`);
    return;
  }
  const rule = rulesById.get(row.rule_id);
  if (row.rule_type !== rule.rule_type) reinvestigationItems.push(`${row.rule_id}:RULE_TYPE_MISMATCH`);
  const conditionRefs = [...new Set(String(rule.trigger_if || "").match(/\bC\d+\b/g) || [])];
  const conditionBooleans = normalizeConditionBooleans(row.condition_results || {});
  for (const ref of conditionRefs) if (!(ref in conditionBooleans)) reinvestigationItems.push(`${row.rule_id}:MISSING_CONDITION_RESULT:${ref}`);
  if (row.trigger_result_claim_present !== true) reinvestigationItems.push(`${row.rule_id}:TRIGGER_RESULT_NOT_STATED`);
  if (row.exclude_result_claim_present !== true) reinvestigationItems.push(`${row.rule_id}:EXCLUDE_RESULT_NOT_STATED`);
  if (row.deterministic_support_trigger_consistent === false) warnings.push(`${row.rule_id}:MODEL_TRIGGER_CLAIM_DIFFERS_FROM_MECHANICAL_CONDITION_CHECK`);
  if (row.trigger_result_claimed === true && row.exclude_result_claimed !== true) {
    const anchors = evidenceAnchorsForRow(row);
    if (!anchors.length) reinvestigationItems.push(`${row.rule_id}:MISSING_EVIDENCE_ANCHOR`);
    assertAnchorsAreScopedLossless(anchors, criticalFailures, row.rule_id);
  }
}

function validateRegulatoryOverlayDerivation(regulatory = {}, {
  artifacts = {},
  criticalFailures,
  reinvestigationItems,
  limitations,
  warnings
}) {
  if (!isPlainObject(regulatory)) {
    criticalFailures.push("regulatory_overlay_derivation must be object");
    return;
  }
  const allowedStatus = new Set(DOMAIN_DERIVATION_CONTRACT.output_contract.regulatory_overlay_status_values || ["NOT_VISIBLE", "CANDIDATE_ONLY", "REVIEW_REQUIRED"]);
  if (!allowedStatus.has(regulatory.status || "NOT_VISIBLE")) reinvestigationItems.push(`REGULATORY_OVERLAY_STATUS_INVALID:${regulatory.status || "missing"}`);
  const catalogOverlays = availableRegulatoryOverlayIds(artifacts);
  const candidates = Array.isArray(regulatory.candidates) ? regulatory.candidates : [];
  if (candidates.length && regulatory.status === "NOT_VISIBLE") reinvestigationItems.push("REGULATORY_CANDIDATES_CONFLICT_WITH_NOT_VISIBLE_STATUS");
  for (const [index, candidate] of candidates.entries()) {
    if (!candidate.overlay_id) reinvestigationItems.push(`REGULATORY_CANDIDATE_MISSING_ID:${index}`);
    if (catalogOverlays.size && candidate.overlay_id && !catalogOverlays.has(candidate.overlay_id)) reinvestigationItems.push(`REGULATORY_OVERLAY_NOT_IN_CATALOG:${candidate.overlay_id}`);
    if (candidate.status && !allowedStatus.has(candidate.status)) reinvestigationItems.push(`REGULATORY_OVERLAY_CANDIDATE_STATUS_INVALID:${candidate.overlay_id || index}:${candidate.status}`);
    if (candidate.legal_applicability_status !== "NOT_DETERMINED_IN_PHASE_3B") criticalFailures.push(`regulatory overlay candidate ${candidate.overlay_id || index} must not determine legal applicability`);
    if (candidate.compliance_conclusion_forbidden !== true) criticalFailures.push(`regulatory overlay candidate ${candidate.overlay_id || index} must forbid compliance conclusion`);
    const anchors = evidenceAnchorsForRow(candidate);
    if (!anchors.length) limitations.push(`REGULATORY_OVERLAY_WITHOUT_VISIBLE_ANCHOR:${candidate.overlay_id || index}`);
    assertAnchorsAreScopedLossless(anchors, criticalFailures, `regulatory_overlay:${candidate.overlay_id || index}`);
  }
  if (!catalogOverlays.size) warnings.push("active_run_package_manifest package catalog did not expose regulatory_overlays; catalog membership was not checked");
}

function finalizeValidationAfterReinvestigation({ profile, validation }) {
  const unresolved = [...(validation.reinvestigation_items || [])];
  const primary = profile.primary_domain_derivation || {};
  const ai = profile.ai_mount_derivation || {};
  const primaryUsable = validation.primary_domain_semantically_usable === true;
  const aiUsable = validation.ai_overlay_semantically_usable === true;

  if (!primaryUsable) {
    primary.selected_package = null;
    primary.selected_rule_id = null;
    primary.status = "UNRESOLVED_AFTER_REINVESTIGATION";
    primary.package_lifecycle_state = "FALLBACK_ONLY";
    primary.package_mount_eligible = false;
    primary.downstream_delivery_mode = aiUsable ? "AI_OVERLAY_FULL_REVIEW_READY" : "UNIVERSAL_REPORT_ONLY";
    primary.unresolved_after_reinvestigation = true;
  } else {
    primary.status = "LOCKED_WITH_LIMITATIONS";
  }

  if (ai.ai_package_mount === "AI_OVERLAY_MOUNTED" && !aiUsable) {
    ai.ai_package_mount = "AI_CANDIDATE_ONLY";
    ai.status = "CANDIDATE_ONLY";
    ai.package_mount_eligible = false;
    ai.package_mount_lock_status = null;
  }

  return {
    ...validation,
    status: validation.critical_failures?.length ? CONTROLLED_FAILURE_STATUS : "LOCKED_WITH_LIMITATIONS",
    reinvestigation_items: [],
    limitations: unique([
      ...(validation.limitations || []),
      ...unresolved.map((item) => `UNRESOLVED_AFTER_REINVESTIGATION:${item}`)
    ]),
    unresolved_primary_after_reinvestigation: !primaryUsable,
    ai_overlay_continuation_active: !primaryUsable && aiUsable,
    universal_report_only_continuation_active: !primaryUsable && !aiUsable,
    run_blocked: false
  };
}

function applyPrimaryValidationStatus(primary = {}, validation = {}) {
  if (validation.status === CONTROLLED_FAILURE_STATUS) return { ...primary, status: "CONTROLLED_FAILURE" };
  if (validation.status === REINVESTIGATION_REQUIRED_STATUS) return { ...primary, status: "REVIEW_REQUIRED" };
  if (primary.unresolved_after_reinvestigation) return primary;
  if (!primary.selected_package) return { ...primary, status: "UNRESOLVED_AFTER_REINVESTIGATION" };
  if (validation.status === "LOCKED_WITH_LIMITATIONS" || primary.package_mount_eligible !== true) return { ...primary, status: "LOCKED_WITH_LIMITATIONS" };
  return { ...primary, status: "LOCKED" };
}

function applyAiValidationStatus(ai = {}, validation = {}) {
  if (validation.status === CONTROLLED_FAILURE_STATUS) return ai;
  if (ai.ai_package_mount === "AI_OVERLAY_MOUNTED" && validation.ai_overlay_semantically_usable === true) {
    return { ...ai, status: AI_MOUNT_ONLY_STATUS, package_mount_eligible: true };
  }
  return ai;
}

function compileActiveRunPackageManifest({ run, artifacts, profile, validation }) {
  return buildPhase3BDomainDerivationManifestUpdate({
    run,
    before: isPlainObject(artifacts.active_run_package_manifest) ? artifacts.active_run_package_manifest : {},
    domain_derivation_profile: profile,
    validation
  });
}

function buildSourceEvidenceLedger(artifacts, rows, regulatoryCandidates = []) {
  return DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads.map((artifactName) => ({
    artifact_name: artifactName,
    present: Object.prototype.hasOwnProperty.call(artifacts || {}, artifactName),
    source_count: Array.isArray(artifacts?.[artifactName]?.sources) ? artifacts[artifactName].sources.length : 0,
    cited_by_rule_ids: rows.filter((row) => evidenceAnchorsForRow(row).some((anchor) => (anchor.source_artifact_name || anchor.artifact_name || anchor) === artifactName)).map((row) => row.rule_id),
    cited_by_regulatory_overlay_ids: regulatoryCandidates.filter((candidate) => evidenceAnchorsForRow(candidate).some((anchor) => (anchor.source_artifact_name || anchor.artifact_name || anchor) === artifactName)).map((candidate) => candidate.overlay_id).filter(Boolean)
  }));
}

function assertAnchorsAreScopedLossless(anchors, failures, label) {
  const allowedLossless = new Set(DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads);
  for (const anchor of anchors || []) {
    const artifactName = anchor?.source_artifact_name || anchor?.artifact_name || anchor;
    if (INDEX_ARTIFACT_NAMES.has(artifactName)) failures.push(`${label} cites navigation/index artifact as evidence: ${artifactName}`);
    if (artifactName && !allowedLossless.has(artifactName)) failures.push(`${label} cites artifact outside scoped 3B lossless evidence: ${artifactName}`);
  }
}

function availableRegulatoryOverlayIds(artifacts = {}) {
  const overlays = artifacts?.active_run_package_manifest?.package_catalog?.available_regulatory_overlays;
  return new Set(Array.isArray(overlays) ? overlays.filter(Boolean) : []);
}

function allEvaluatedRules(profile = {}) {
  return [
    ...(profile.primary_domain_derivation?.evaluated_rules || []),
    ...(profile.ai_mount_derivation?.evaluated_rules || []),
    ...(profile.fusion_candidate_derivation?.evaluated_rules || [])
  ];
}

function evidenceAnchorsForRow(row = {}) {
  const anchors = row?.evidence_anchors || row?.evidence_basis || row?.source_evidence || [];
  return Array.isArray(anchors) ? anchors : [];
}

function normalizeConditionBooleans(value = {}) {
  return Object.fromEntries(Object.entries(value || {}).map(([key, item]) => [
    key,
    Boolean(typeof item === "object" && item !== null ? (item.value ?? item.satisfied ?? item.present ?? item.result) : item)
  ]));
}

function evaluateBooleanExpressionWithCoverage(expr = "", vars = {}) {
  const refs = [...new Set(String(expr).match(/\bC\d+\b/g) || [])];
  if (!refs.length || refs.some((ref) => !Object.prototype.hasOwnProperty.call(vars, ref))) return { result: null, complete: false };
  const normalized = String(expr)
    .replace(/\bAND\b/g, "&&")
    .replace(/\bOR\b/g, "||")
    .replace(/\bNOT\b/g, "!")
    .replace(/\bC\d+\b/g, (name) => (vars[name] ? "true" : "false"));
  if (!/^[\s()!&|truefals]+$/.test(normalized)) return { result: null, complete: false };
  try { return { result: Boolean(Function(`"use strict"; return (${normalized});`)()), complete: true }; }
  catch { return { result: null, complete: false }; }
}

function assertNoForbiddenMarkers(value, failures) {
  const text = JSON.stringify(value || {});
  for (const marker of FORBIDDEN_OUTPUT_MARKERS) {
    const needle = marker.replace(/^"|"$/g, "");
    const re = new RegExp(`(?<![A-Za-z0-9_])${escapeForbiddenMarker(needle)}(?![A-Za-z0-9_])`);
    if (re.test(text)) failures.push(`forbidden domain derivation output marker present: ${marker}`);
  }
}

function cleanId(value) {
  const cleaned = String(value || "").trim();
  return cleaned || null;
}

function unique(values) {
  return [...new Set((values || []).filter(Boolean))];
}

function escapeForbiddenMarker(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function isPlainObject(value) {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}
