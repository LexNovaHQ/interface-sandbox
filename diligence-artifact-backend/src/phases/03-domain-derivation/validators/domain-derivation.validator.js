import { DOMAIN_DERIVATION_CONTRACT } from "../domain-derivation.contract.js";
import { loadDomainDerivationRegistryV0 } from "../../../runtime/domain-gate/domain-derivation-registry.loader.js";
import { buildPhase3BDomainDerivationManifestUpdate } from "../../../runtime/domain-gate/active-run-package-manifest.schema.js";

const CONTROLLED_FAILURE_STATUS = "CONTROLLED_FAILURE";
const AI_MOUNT_ONLY_STATUS = "LOCKED_FOR_PACKAGE_MOUNT_ONLY";
const REGULATORY_CANDIDATE_STATUS = "CANDIDATE_ONLY";
const FORBIDDEN_OUTPUT_MARKERS = Object.freeze([
  "business_context.lane",
  "\"lane\"",
  "legal_advice",
  "\"compliance_conclusion\"",
  "enforceability_assessment",
  "risk_conclusion",
  "exposure_registry",
  "ai_archetype",
  "surface_lock",
  "license_validity",
  "license_requirement",
  "applicable_regulator",
  "regulatory_compliance_status",
  "grievance_sufficiency",
  "grievance_compliance_status",
  "ombudsman_requirement",
  "statutory_complaint_obligation"
]);
const INDEX_ARTIFACT_NAMES = new Set([
  "cartography_index",
  "target_profile_source_index",
  "domain_derivation_source_index",
  "activity_profile_source_index",
  "legal_cartography_index",
  "legal_signal_derivation_profile",
  "data_privacy_navigation_index",
  "source_discovery_handoff",
  "phase_routing_manifest",
  "phase_route_runtime_packet"
]);

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
  validateRegulatoryOverlayDerivation(profile.regulatory_overlay_derivation || {}, { artifacts, failures, warnings });
  const primary = profile.primary_domain_derivation || {};
  const aiMount = profile.ai_mount_derivation || {};
  const fusion = profile.fusion_candidate_derivation || {};
  const lockedPrimaryRules = evaluatedRules.filter((row) => row.rule_type === "PRIMARY_DOMAIN" && row.validator_trigger_result === true && row.validator_exclude_result !== true);
  if (lockedPrimaryRules.length > 1) failures.push(`multiple primary domain rules fired: ${lockedPrimaryRules.map((row) => row.rule_id).join(",")}`);
  if (primary.selected_package && !String(primary.selected_package).match(/^[a-z0-9-]+$/)) failures.push("primary_domain_derivation.selected_package must be catalog-style package id");
  if (primary.selected_package === "ai-governance" && aiMount.ai_package_mount === "AI_OVERLAY_MOUNTED") failures.push("AI primary and AI overlay cannot both apply");
  if (aiMount.ai_package_mount === "AI_OVERLAY_MOUNTED" && primary.selected_package === "ai-governance") failures.push("AI overlay cannot mount when primary domain is ai-governance");
  if (aiMount.ai_package_mount === "AI_OVERLAY_MOUNTED" && aiMount.status !== AI_MOUNT_ONLY_STATUS) failures.push(`AI_OVERLAY_MOUNTED status must be ${AI_MOUNT_ONLY_STATUS}`);
  if ((fusion.candidates || []).length && aiMount.ai_package_mount !== "AI_OVERLAY_MOUNTED") failures.push("fusion candidate requires AI_OVERLAY_MOUNTED");
  for (const candidate of fusion.candidates || []) if (candidate.fusion_owner && primary.selected_package && candidate.fusion_owner !== primary.selected_package) failures.push(`fusion owner ${candidate.fusion_owner} must equal primary package ${primary.selected_package}`);
  const status = failures.length ? CONTROLLED_FAILURE_STATUS : (primary.status === "REVIEW_REQUIRED" ? "LOCKED_WITH_LIMITATIONS" : "LOCKED");
  return {
    status,
    validator: "domain-derivation.validator",
    gates_passed: failures.length ? [] : ["SCHEMA", "REGISTRY_RULES", "SCOPED_EVIDENCE", "P2G_ROUTE_PACKET", "P2B_DOMAIN_SOURCE_INDEX", "LEGAL_INPUTS_FORBIDDEN", "PRIMARY_DOMAIN_LOCK_ONLY", "AI_PACKAGE_MOUNT_ONLY", "REGULATORY_OVERLAY_CANDIDATE_ONLY", "FUSION_DOMAIN_OWNED", "MANIFEST_COMPILABLE"],
    failures,
    warnings
  };
}

export function assertDomainDerivationRuntimeArtifacts(artifacts = {}, failures = null) {
  const localFailures = failures || [];
  const allowed = new Set(DOMAIN_DERIVATION_CONTRACT.reads);
  for (const key of Object.keys(artifacts || {})) if (!allowed.has(key)) localFailures.push(`P3_DOMAIN_DERIVATION_FORBIDDEN_RUNTIME_ARTIFACT:${key}`);
  for (const required of ["phase_routing_manifest", "phase_route_runtime_packet", "domain_derivation_source_index", "target_profile", "domain_selection_profile", "active_run_package_manifest"]) if (!Object.prototype.hasOwnProperty.call(artifacts || {}, required)) localFailures.push(`P3_DOMAIN_DERIVATION_MISSING_REQUIRED_INPUT:${required}`);
  for (const root of DOMAIN_DERIVATION_CONTRACT.scoped_lossless_evidence_reads) if (!Object.prototype.hasOwnProperty.call(artifacts || {}, root)) localFailures.push(`P3_DOMAIN_DERIVATION_MISSING_SCOPED_LOSSLESS_ROOT:${root}`);
  for (const forbidden of DOMAIN_DERIVATION_CONTRACT.forbidden_reads) if (Object.prototype.hasOwnProperty.call(artifacts || {}, forbidden)) localFailures.push(`P3_DOMAIN_DERIVATION_FORBIDDEN_INPUT_PRESENT:${forbidden}`);
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
  const primary = selectPrimary(primaryRows, rawProfile?.primary_domain_derivation || {});
  const aiMount = selectAiMount(aiRows, primary, rawProfile?.ai_mount_derivation || {});
  const regulatoryOverlay = selectRegulatoryOverlay(rawProfile?.regulatory_overlay_derivation || {}, artifacts);
  const fusion = selectFusion(fusionRows, primary, aiMount, rawProfile?.fusion_candidate_derivation || {});
  return {
    domain_derivation_metadata: {
      run_id: run.run_id || rawProfile?.domain_derivation_metadata?.run_id || "",
      internal_job_id: DOMAIN_DERIVATION_CONTRACT.internal_job_id,
      central_phase_id: DOMAIN_DERIVATION_CONTRACT.central_phase_id,
      registry_id: registry.registry_id || "DILIGENCE_DOMAIN_REGISTRY_v1",
      registry_version: registry.schema_version || "",
      generated_by: "P3_DOMAIN_DERIVATION_LAYER",
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
  const aiPackageMount = aiPrimary ? "AI_PRIMARY" : (selected?.rule_id === "AI_OVERLAY_MOUNTED" ? "AI_OVERLAY_MOUNTED" : (selected?.rule_id === "AI_CANDIDATE_ONLY" ? "AI_CANDIDATE_ONLY" : (modelAi.ai_package_mount || "AI_NOT_VISIBLE")));
  return {
    ai_package_mount: aiPackageMount,
    status: aiPrimary ? "LOCKED" : (aiPackageMount === "AI_OVERLAY_MOUNTED" ? AI_MOUNT_ONLY_STATUS : (aiPackageMount === "AI_CANDIDATE_ONLY" ? "CANDIDATE_ONLY" : "NOT_VISIBLE")),
    selected_rule_id: aiPrimary ? "PRIMARY_DOMAIN_AI_GOVERNANCE" : (selected?.rule_id || modelAi.selected_rule_id || null),
    overlay_package_id: aiPrimary ? null : (selected?.package_id || null),
    package_mount_lock_status: aiPackageMount === "AI_OVERLAY_MOUNTED" ? AI_MOUNT_ONLY_STATUS : null,
    activity_lock_status: "DEFERRED_TO_PHASE_5",
    exposure_lock_status: "DEFERRED_TO_PHASE_9",
    archetype_lock_deferred_to_phase_5: true,
    surface_classification_deferred_to_phase_5: true,
    evaluated_rules: rows,
    final_basis: modelAi.final_basis || "semantic_ai_mount_derivation_subject_to_registry_gate"
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
    candidate_basis: candidate?.candidate_basis || "catalog_candidate_from_scoped_lossless_evidence",
    legal_applicability_status: "NOT_DETERMINED_IN_PHASE_3B",
    compliance_conclusion_forbidden: true
  })).filter((candidate) => candidate.overlay_id);
  return {
    status: candidates.length ? (modelRegulatory.status || REGULATORY_CANDIDATE_STATUS) : "NOT_VISIBLE",
    catalog_source: "package-catalog.v0.json:regulatory_overlays",
    candidates,
    legal_applicability_status: "NOT_DETERMINED_IN_PHASE_3B",
    compliance_conclusion_forbidden: true,
    final_basis: modelRegulatory.final_basis || "regulatory_overlay_candidates_are_catalog_gated_and_deferred_to_later_review"
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
  return buildPhase3BDomainDerivationManifestUpdate({
    run,
    before: isPlainObject(artifacts.active_run_package_manifest) ? artifacts.active_run_package_manifest : {},
    domain_derivation_profile: profile,
    validation
  });
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
    assertAnchorsAreScopedLossless(anchors, failures, `${row.rule_id}`);
  }
}

function validateRegulatoryOverlayDerivation(regulatory = {}, { artifacts = {}, failures, warnings }) {
  if (!isPlainObject(regulatory)) { failures.push("regulatory_overlay_derivation must be object"); return; }
  const allowedStatus = new Set(DOMAIN_DERIVATION_CONTRACT.output_contract.regulatory_overlay_status_values || ["NOT_VISIBLE", "CANDIDATE_ONLY", "REVIEW_REQUIRED"]);
  if (!allowedStatus.has(regulatory.status || "NOT_VISIBLE")) failures.push(`regulatory_overlay_derivation.status is not allowed: ${regulatory.status || "missing"}`);
  const catalogOverlays = availableRegulatoryOverlayIds(artifacts);
  const candidates = Array.isArray(regulatory.candidates) ? regulatory.candidates : [];
  if (candidates.length && regulatory.status === "NOT_VISIBLE") failures.push("regulatory overlay candidates require CANDIDATE_ONLY or REVIEW_REQUIRED status");
  for (const [index, candidate] of candidates.entries()) {
    if (!candidate.overlay_id) failures.push(`regulatory_overlay_derivation.candidates[${index}] missing overlay_id`);
    if (catalogOverlays.size && candidate.overlay_id && !catalogOverlays.has(candidate.overlay_id)) failures.push(`regulatory overlay ${candidate.overlay_id} not present in package catalog`);
    if (candidate.status && !allowedStatus.has(candidate.status)) failures.push(`regulatory overlay candidate ${candidate.overlay_id || index} has invalid status ${candidate.status}`);
    if (candidate.legal_applicability_status !== "NOT_DETERMINED_IN_PHASE_3B") failures.push(`regulatory overlay candidate ${candidate.overlay_id || index} must not determine legal applicability`);
    if (candidate.compliance_conclusion_forbidden !== true) failures.push(`regulatory overlay candidate ${candidate.overlay_id || index} must forbid compliance conclusion`);
    const anchors = evidenceAnchorsForRow(candidate);
    if (!anchors.length) failures.push(`regulatory overlay candidate ${candidate.overlay_id || index} missing scoped lossless evidence anchors`);
    assertAnchorsAreScopedLossless(anchors, failures, `regulatory_overlay:${candidate.overlay_id || index}`);
  }
  if (!catalogOverlays.size) warnings.push("active_run_package_manifest package catalog did not expose regulatory_overlays; catalog membership was not checked");
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
  for (const anchor of anchors) {
    const artifactName = anchor.source_artifact_name || anchor.artifact_name || anchor;
    if (INDEX_ARTIFACT_NAMES.has(artifactName)) failures.push(`${label} cites navigation/index artifact as evidence: ${artifactName}`);
    if (artifactName && !allowedLossless.has(artifactName)) failures.push(`${label} cites artifact outside scoped 3B lossless evidence: ${artifactName}`);
  }
}

function availableRegulatoryOverlayIds(artifacts = {}) {
  const overlays = artifacts?.active_run_package_manifest?.package_catalog?.available_regulatory_overlays;
  return new Set(Array.isArray(overlays) ? overlays.filter(Boolean) : []);
}

function allEvaluatedRules(profile = {}) { return [...(profile.primary_domain_derivation?.evaluated_rules || []), ...(profile.ai_mount_derivation?.evaluated_rules || []), ...(profile.fusion_candidate_derivation?.evaluated_rules || [])]; }
function evidenceAnchorsForRow(row = {}) { const anchors = row.evidence_anchors || row.evidence_basis || row.source_evidence || []; return Array.isArray(anchors) ? anchors : []; }
function normalizeConditionBooleans(value = {}) { return Object.fromEntries(Object.entries(value || {}).map(([key, item]) => [key, Boolean(typeof item === "object" && item !== null ? (item.value ?? item.satisfied ?? item.present ?? item.result) : item)])); }
function evaluateBooleanExpression(expr = "", vars = {}) { const normalized = String(expr).replace(/\bAND\b/g, "&&").replace(/\bOR\b/g, "||").replace(/\bNOT\b/g, "!").replace(/\bC\d+\b/g, (name) => (vars[name] ? "true" : "false")); if (!/^[\s()!&|truefals]+$/.test(normalized)) return false; try { return Boolean(Function(`"use strict"; return (${normalized});`)()); } catch { return false; } }
function assertNoForbiddenMarkers(value, failures) {
  const text = JSON.stringify(value || {});
  for (const marker of FORBIDDEN_OUTPUT_MARKERS) {
    const needle = marker.replace(/^"|"$/g, "");
    const re = new RegExp(`(?<![A-Za-z0-9_])${escapeForbiddenMarker(needle)}(?![A-Za-z0-9_])`);
    if (re.test(text)) failures.push(`forbidden domain derivation output marker present: ${marker}`);
  }
}
function escapeForbiddenMarker(v) { return String(v).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }
function isPlainObject(value) { return Boolean(value && typeof value === "object" && !Array.isArray(value)); }
