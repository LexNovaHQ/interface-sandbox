import { DOMAIN_DERIVATION_CONTRACT } from "../domain-derivation.contract.js";
import { loadDomainDerivationRegistryV0 } from "../../../runtime/domain-gate/domain-derivation-registry.loader.js";

const LOCKED_STATUSES = new Set(["LOCKED", "LOCKED_WITH_LIMITATIONS"]);
const CONTROLLED_FAILURE_STATUS = "CONTROLLED_FAILURE";
const FORBIDDEN_OUTPUT_MARKERS = Object.freeze(["business_context.lane", "\"lane\"", "legal_advice", "compliance_conclusion", "enforceability_assessment", "risk_conclusion", "exposure_registry", "ai_archetype", "surface_lock"]);
const INDEX_ARTIFACT_NAMES = new Set(["cartography_index", "target_profile_source_index", "activity_profile_source_index", "legal_cartography_index", "legal_signal_derivation_profile", "data_privacy_navigation_index", "source_discovery_handoff"]);

export async function compileDomainDerivationArtifacts({ run = {}, artifacts = {}, modelOutput = {}, registryPacket } = {}) {
  const packet = registryPacket || await loadDomainDerivationRegistryV0();
  const registry = packet.registry;
  assertDomainDerivationRuntimeArtifacts(artifacts);
  const rawProfile = modelOutput?.domain_derivation_profile || modelOutput || {};
  const normalized = normalizeProfile({ run, rawProfile, artifacts, registry });
  const validation = validateDomainDerivationProfile(normalized, { artifacts, registry });
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
  const failures = [];
  const warnings = [];
  if (!isPlainObject(profile)) failures.push("domain_derivation_profile must be object");
  for (const branch of DOMAIN_DERIVATION_CONTRACT.output_contract.required_top_level_branches) if (!Object.prototype.hasOwnProperty.call(profile, branch)) failures.push(`domain_derivation_profile missing ${branch}`);
  assertNoForbiddenMarkers(profile, failures);
  assertDomainDerivationRuntimeArtifacts(artifacts, failures);
  const rulesById = new Map((registry.rules || []).map((rule) => [rule.rule_id, rule]));
  const evaluatedRules = allEvaluatedRules(profile);
  for (const row of evaluatedRules) validateEvaluatedRule(row, { rulesById, failures, warnings });
  const primary = profile.primary_domain_derivation || {};
  const aiMount = profile.ai_mount_derivation || {};
  const fusion = profile.fusion_candidate_derivation || {};
  const lockedPrimaryRules = evaluatedRules.filter((row) => row.rule_type === "PRIMARY_DOMAIN" && row.validator_trigger_result === true && row.validator_exclude_result !== true);
  if (lockedPrimaryRules.length > 1) failures.push(`multiple primary domain rules fired: ${lockedPrimaryRules.map((row) => row.rule_id).join(",")}`);
  if (primary.selected_package && !String(primary.selected_package).match(/^[a-z0-9-]+$/)) failures.push("primary_domain_derivation.selected_package must be catalog-style package id");
  if (primary.selected_package === "ai-governance" && aiMount.ai_package_mount === "AI_OVERLAY_MOUNTED") failures.push("AI primary and AI overlay cannot both apply");
  if (aiMount.ai_package_mount === "AI_OVERLAY_MOUNTED" && primary.selected_package === "ai-governance") failures.push("AI overlay cannot mount when primary domain is ai-governance");
  if ((fusion.candidates || []).length && aiMount.ai_package_mount !== "AI_OVERLAY_MOUNTED") failures.push("fusion candidate requires AI_OVERLAY_MOUNTED");
  for (const candidate of fusion.candidates || []) if (candidate.fusion_owner && primary.selected_package && candidate.fusion_owner !== primary.selected_package) failures.push(`fusion owner ${candidate.fusion_owner} must equal primary package ${primary.selected_package}`);
  const status = failures.length ? CONTROLLED_FAILURE_STATUS : (primary.status === "REVIEW_REQUIRED" ? "LOCKED_WITH_LIMITATIONS" : "LOCKED");
  return {
    status,
    validator: "domain-derivation.validator",
    gates_passed: failures.length ? [] : ["SCHEMA", "REGISTRY_RULES", "SCOPED_EVIDENCE", "LEGAL_INPUTS_FORBIDDEN", "MANIFEST_COMPILABLE"],
    failures,
    warnings
  };
}

export function assertDomainDerivationRuntimeArtifacts(artifacts = {}, failures = null) {
  const localFailures = failures || [];
  const allowed = new Set(DOMAIN_DERIVATION_CONTRACT.reads);
  for (const key of Object.keys(artifacts || {})) if (!allowed.has(key)) localFailures.push(`P3_DOMAIN_DERIVATION_FORBIDDEN_RUNTIME_ARTIFACT:${key}`);
  for (const required of ["source_discovery_handoff", "cartography_index", "target_profile_source_index", "activity_profile_source_index", "target_profile", "domain_selection_profile", "active_run_package_manifest"]) if (!Object.prototype.hasOwnProperty.call(artifacts || {}, required)) localFailures.push(`P3_DOMAIN_DERIVATION_MISSING_REQUIRED_INPUT:${required}`);
  for (const root of DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads) if (!Object.prototype.hasOwnProperty.call(artifacts || {}, root)) localFailures.push(`P3_DOMAIN_DERIVATION_MISSING_SCOPED_LOSSLESS_ROOT:${root}`);
  for (const forbidden of DOMAIN_DERIVATION_CONTRACT.forbidden_reads) if (Object.prototype.hasOwnProperty.call(artifacts || {}, forbidden)) localFailures.push(`P3_DOMAIN_DERIVATION_FORBIDDEN_INPUT_PRESENT:${forbidden}`);
  if (!failures && localFailures.length) throw new Error(`P3_DOMAIN_DERIVATION_INPUT_CONTRACT_FAILED:${JSON.stringify(localFailures)}`);
}

function normalizeProfile({ run, rawProfile, artifacts, registry }) {
  const primaryRows = normalizeRows(rawProfile?.primary_domain_derivation?.evaluated_rules || rawProfile?.evaluated_rules || [], registry, "PRIMARY_DOMAIN");
  const aiRows = normalizeRows(rawProfile?.ai_mount_derivation?.evaluated_rules || [], registry, "AI_MOUNT");
  const fusionRows = normalizeRows(rawProfile?.fusion_candidate_derivation?.evaluated_rules || [], registry, "FUSION_CANDIDATE");
  const primary = selectPrimary(primaryRows, rawProfile?.primary_domain_derivation || {});
  const aiMount = selectAiMount(aiRows, primary, rawProfile?.ai_mount_derivation || {});
  const fusion = selectFusion(fusionRows, primary, aiMount, rawProfile?.fusion_candidate_derivation || {});
  return {
    domain_derivation_metadata: {
      run_id: run.run_id || rawProfile?.domain_derivation_metadata?.run_id || "",
      internal_job_id: DOMAIN_DERIVATION_CONTRACT.internal_job_id,
      central_phase_id: DOMAIN_DERIVATION_CONTRACT.central_phase_id,
      registry_id: registry.registry_id || "DOMAIN_DERIVATION_REGISTRY_v0",
      registry_version: registry.schema_version || "",
      generated_by: "P3_DOMAIN_DERIVATION_LAYER",
      prompt_package_status: DOMAIN_DERIVATION_CONTRACT.agent_package_binding.prompt_package_status
    },
    input_scope: {
      required_reads_present: DOMAIN_DERIVATION_CONTRACT.reads.filter((name) => Object.prototype.hasOwnProperty.call(artifacts, name)),
      phase_2_navigation_artifacts_used: ["cartography_index", "target_profile_source_index", "activity_profile_source_index"],
      scoped_lossless_evidence_artifacts_used: DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads,
      target_profile_used_as_context_only: true,
      legal_inputs_forbidden: true
    },
    source_evidence_ledger: buildSourceEvidenceLedger(artifacts, [...primaryRows, ...aiRows, ...fusionRows]),
    primary_domain_derivation: primary,
    ai_mount_derivation: aiMount,
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
    return {
      rule_id: row?.rule_id || "",
      rule_type: rule.rule_type || row?.rule_type || expectedType,
      package_id: row?.package_id || rule.package_id || null,
      condition_results: row?.condition_results || row?.conditions || {},
      trigger_result_claimed: Boolean(row?.trigger_result ?? row?.trigger_claimed),
      exclude_result_claimed: Boolean(row?.exclude_result ?? row?.exclude_claimed),
      validator_trigger_result: rule.trigger_if ? evaluateBooleanExpression(rule.trigger_if, conditionBooleans) : false,
      validator_exclude_result: Boolean(row?.exclude_result ?? row?.exclude_claimed),
      evidence_anchors: evidenceAnchorsForRow(row),
      limitation_notes: Array.isArray(row?.limitation_notes) ? row.limitation_notes : []
    };
  });
}

function selectPrimary(rows, modelPrimary) {
  const fired = rows.filter((row) => row.validator_trigger_result === true && row.validator_exclude_result !== true);
  const selected = fired.length === 1 ? fired[0] : null;
  return {
    selected_package: selected?.package_id || modelPrimary.selected_package || null,
    status: selected ? "LOCKED" : "REVIEW_REQUIRED",
    selected_rule_id: selected?.rule_id || modelPrimary.selected_rule_id || null,
    evaluated_rules: rows,
    conflict_resolution: fired.length > 1 ? "REVIEW_REQUIRED_MULTIPLE_PRIMARY_RULES_FIRED" : "REGISTRY_VALIDATED",
    final_basis: modelPrimary.final_basis || "semantic_derivation_subject_to_deterministic_registry_gate"
  };
}

function selectAiMount(rows, primary, modelAi) {
  const fired = rows.filter((row) => row.validator_trigger_result === true && row.validator_exclude_result !== true);
  const selected = fired[0] || null;
  const aiPrimary = primary.selected_package === "ai-governance";
  return {
    ai_package_mount: aiPrimary ? "AI_PRIMARY" : (selected?.rule_id === "AI_OVERLAY_MOUNTED" ? "AI_OVERLAY_MOUNTED" : (selected?.rule_id === "AI_CANDIDATE_ONLY" ? "AI_CANDIDATE_ONLY" : (modelAi.ai_package_mount || "AI_NOT_VISIBLE"))),
    status: selected ? "LOCKED" : (aiPrimary ? "LOCKED" : "NOT_VISIBLE"),
    selected_rule_id: aiPrimary ? "PRIMARY_DOMAIN_AI_GOVERNANCE" : (selected?.rule_id || modelAi.selected_rule_id || null),
    overlay_package_id: aiPrimary ? null : (selected?.package_id || null),
    evaluated_rules: rows,
    final_basis: modelAi.final_basis || "semantic_ai_mount_derivation_subject_to_registry_gate"
  };
}

function selectFusion(rows, primary, aiMount, modelFusion) {
  const fired = rows.filter((row) => row.validator_trigger_result === true && row.validator_exclude_result !== true);
  const allowed = primary.selected_package && primary.selected_package !== "ai-governance" && aiMount.ai_package_mount === "AI_OVERLAY_MOUNTED";
  return {
    status: allowed && fired.length ? "CANDIDATE_ONLY" : "NOT_VISIBLE",
    evaluated_rules: rows,
    candidates: allowed ? fired.map((row) => ({ fusion_owner: primary.selected_package, rule_id: row.rule_id, candidate_basis: "domain_owned_ai_fusion_candidate", deferred_to: "PHASE_5_ACTIVITY_PROFILE_AND_PHASE_9_EXPOSURE_PROFILE" })) : [],
    final_basis: modelFusion.final_basis || "fusion_candidates_deferred_downstream"
  };
}

function compileActiveRunPackageManifest({ run, artifacts, profile, validation }) {
  const before = isPlainObject(artifacts.active_run_package_manifest) ? artifacts.active_run_package_manifest : {};
  const runtimeFlags = { ...(before.runtime_flags || {}) };
  for (const key of ["dynamic_routing_enabled", "field_registry_compile_enabled", "qr_matrix_routing_enabled", "report_template_routing_enabled", "assembly_routing_enabled"]) runtimeFlags[key] = false;
  const after = {
    ...before,
    run_id: before.run_id || run.run_id || "",
    selection_stage: "PHASE_3B_DOMAIN_DERIVATION",
    manifest_status: validation.status === CONTROLLED_FAILURE_STATUS ? "REVIEW_REQUIRED" : "LOCKED_WITH_LIMITATIONS",
    primary_domain_package: profile.primary_domain_derivation.selected_package || null,
    primary_domain_status: profile.primary_domain_derivation.status || "REVIEW_REQUIRED",
    primary_domain_rule_id: profile.primary_domain_derivation.selected_rule_id || null,
    capability_overlays: profile.ai_mount_derivation.ai_package_mount === "AI_OVERLAY_MOUNTED" ? ["ai-native"] : [],
    capability_overlay_status: profile.ai_mount_derivation.status || "NOT_VISIBLE",
    ai_package_mount: profile.ai_mount_derivation.ai_package_mount || "AI_NOT_VISIBLE",
    ai_mount_rule_id: profile.ai_mount_derivation.selected_rule_id || null,
    fusion_bucket_candidates: profile.fusion_candidate_derivation.candidates || [],
    domain_derivation_profile_ref: "domain_derivation_profile",
    runtime_flags: runtimeFlags,
    package_selection_locked_by_phase_3b: validation.status !== CONTROLLED_FAILURE_STATUS
  };
  return {
    active_run_package_manifest: after,
    manifest_update: {
      before_selection_stage: before.selection_stage || "PRE_PHASE_1_DOMAIN_PREFLIGHT",
      after_selection_stage: after.selection_stage,
      changed_fields: ["selection_stage", "primary_domain_package", "primary_domain_status", "capability_overlays", "ai_package_mount", "fusion_bucket_candidates", "domain_derivation_profile_ref"],
      unchanged_runtime_flags: runtimeFlags
    }
  };
}

function validateEvaluatedRule(row, { rulesById, failures, warnings }) {
  if (!row.rule_id || !rulesById.has(row.rule_id)) { failures.push(`unknown evaluated rule_id: ${row.rule_id || "missing"}`); return; }
  const rule = rulesById.get(row.rule_id);
  if (row.rule_type !== rule.rule_type) failures.push(`${row.rule_id} rule_type mismatch`);
  const conditionRefs = [...new Set(String(rule.trigger_if || "").match(/\bC\d+\b/g) || [])];
  const conditionBooleans = normalizeConditionBooleans(row.condition_results || {});
  for (const ref of conditionRefs) if (!(ref in conditionBooleans)) warnings.push(`${row.rule_id} missing condition result ${ref}`);
  if (row.validator_trigger_result) {
    const anchors = evidenceAnchorsForRow(row);
    if (!anchors.length) failures.push(`${row.rule_id} fired without evidence anchors`);
    for (const anchor of anchors) if (INDEX_ARTIFACT_NAMES.has(anchor.source_artifact_name || anchor.artifact_name || anchor)) failures.push(`${row.rule_id} cites navigation/index artifact as evidence: ${anchor.source_artifact_name || anchor.artifact_name || anchor}`);
  }
}

function buildSourceEvidenceLedger(artifacts, rows) {
  return DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads.map((artifactName) => ({
    source_artifact_name: artifactName,
    present: Object.prototype.hasOwnProperty.call(artifacts, artifactName),
    used_by_rules: rows.filter((row) => evidenceAnchorsForRow(row).some((anchor) => (anchor.source_artifact_name || anchor.artifact_name || anchor) === artifactName)).map((row) => row.rule_id)
  }));
}

function allEvaluatedRules(profile = {}) {
  return [
    ...(profile.primary_domain_derivation?.evaluated_rules || []),
    ...(profile.ai_mount_derivation?.evaluated_rules || []),
    ...(profile.fusion_candidate_derivation?.evaluated_rules || [])
  ];
}

function normalizeConditionBooleans(results = {}) {
  return Object.fromEntries(Object.entries(results || {}).map(([key, value]) => [key, conditionValue(value)]));
}
function conditionValue(value) { if (typeof value === "boolean") return value; if (isPlainObject(value)) return Boolean(value.value ?? value.result ?? value.present ?? value.satisfied); if (typeof value === "string") return ["true", "yes", "present", "satisfied", "derived"].includes(value.trim().toLowerCase()); return Boolean(value); }
function evidenceAnchorsForRow(row = {}) { const anchors = row.evidence_anchors || row.evidence || []; if (Array.isArray(anchors)) return anchors; return []; }
function assertNoForbiddenMarkers(value, failures) { const text = JSON.stringify(value || {}); for (const marker of FORBIDDEN_OUTPUT_MARKERS) if (text.includes(marker)) failures.push(`domain_derivation_profile contains forbidden marker ${marker}`); }
function evaluateBooleanExpression(expression, values = {}) { const tokens = String(expression || "").match(/\bC\d+\b|AND|OR|NOT|\(|\)/g) || []; let index = 0; function parseOr() { let left = parseAnd(); while (tokens[index] === "OR") { index += 1; left = left || parseAnd(); } return left; } function parseAnd() { let left = parseNot(); while (tokens[index] === "AND") { index += 1; left = left && parseNot(); } return left; } function parseNot() { if (tokens[index] === "NOT") { index += 1; return !parseNot(); } return parseAtom(); } function parseAtom() { const token = tokens[index++]; if (token === "(") { const value = parseOr(); if (tokens[index] === ")") index += 1; return value; } return Boolean(values[token]); } return parseOr(); }
function isPlainObject(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
