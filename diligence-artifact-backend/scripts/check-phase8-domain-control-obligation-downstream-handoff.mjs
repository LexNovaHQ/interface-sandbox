import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS,
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_FORBIDDEN_ARTIFACTS,
  DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT,
  domainControlObligationDownstreamFields,
  domainControlObligationDownstreamReadArtifacts
} from "../src/phases/08-domain-control-obligation-profile/index.js";
import { buildM11DomainControlObligationHandoff } from "../src/phases/10-exposure-profile/domain-control-obligation-profile.handoff.js";
import { buildM12DomainControlObligationChallenge } from "../src/phases/11-operator-challenge/domain-control-obligation-profile.handoff.js";
import { buildDomainControlObligationCompilerHandoff } from "../src/phases/12-normalized-compiler/domain-control-obligation-profile.handoff.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");

assert.deepEqual(domainControlObligationDownstreamReadArtifacts(), ["domain_control_obligation_profile"]);
assert.ok(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_FORBIDDEN_ARTIFACTS.includes("domain_control_obligation_candidate_inventory"));
assert.equal(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT.persisted_intermediate_handoff_artifact_allowed, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT.candidate_inventory_propagation_allowed, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT.forensic_profile_propagation_allowed, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT.consumers.M11.context_only, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT.consumers.M12.challenge_only, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_HANDOFF_CONTRACT.consumers.NORMALIZED_COMPILER.may_create_new_rendered_section, false);
assert.ok(domainControlObligationDownstreamFields(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.exposure).includes("control_posture_status"));
assert.ok(domainControlObligationDownstreamFields(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.operatorChallenge).includes("derivation_basis"));
assert.equal(domainControlObligationDownstreamFields(DOMAIN_CONTROL_OBLIGATION_DOWNSTREAM_CONSUMERS.compiler).includes("derivation_basis"), false);

const profile = {
  artifact_type: "domain_control_obligation_profile",
  schema_version: "phase8_dco_material_profile_v1",
  run_id: "PHASE8-DOWNSTREAM-HANDOFF-CHECK",
  derivation_mode: "MODEL_DERIVED_MATERIAL_FIELDS_DETERMINISTIC_MECHANICAL_COMPILATION",
  mounted_taxonomy_ref: {
    primary_package_id: "fintech",
    primary_key_version: "test-fintech-v1",
    capability_overlays: [{ overlay_id: "ai-native", package_id: "ai-governance", key_version: "test-ai-v1" }],
    regulatory_overlays: [{ overlay_id: "privacy", package_id: "fintech", key_version: "test-fintech-v1", framework_links: ["GDPR"] }]
  },
  obligation_count: 2,
  obligations: [
    obligationRow({
      candidateId: "DCO-CAND-001",
      obligationId: "FIN-OBL-TEST-01",
      family: "payment_control",
      sourceLayer: "PRIMARY",
      sourcePackageId: "fintech",
      capabilityOverlayId: "",
      activityReference: "ACT-001",
      behavior: "PAY",
      surface: "Transaction-Data",
      authority: ["GDPR", "RBI"],
      role: "A",
      mechanism: "VISIBLE",
      posture: "VISIBLE",
      evidenceBasis: ["The reviewed payment workflow describes an operating control."],
      missingProof: [],
      limitation: [],
      regulatoryOverlayRefs: [{ overlay_id: "privacy", matched_frameworks: ["GDPR"], overlay_status: "CANDIDATE_ONLY" }]
    }),
    obligationRow({
      candidateId: "DCO-CAND-002",
      obligationId: "AI-OBL-TEST-01",
      family: "human_oversight",
      sourceLayer: "CAPABILITY_OVERLAY",
      sourcePackageId: "ai-governance",
      capabilityOverlayId: "ai-native",
      activityReference: "ACT-002",
      behavior: "JDG",
      surface: "Consumer-Public",
      authority: ["EU_AI_ACT"],
      role: "B",
      mechanism: "NOT_VISIBLE",
      posture: "NOT_VISIBLE",
      evidenceBasis: ["The public materials do not show a target-specific human-review mechanism."],
      missingProof: ["Human-review operating procedure and escalation evidence."],
      limitation: ["Public evidence does not establish whether the control exists privately."],
      regulatoryOverlayRefs: []
    })
  ],
  profile_level_limitations: []
};

const m11 = buildM11DomainControlObligationHandoff({
  domainControlObligationProfile: profile,
  sourceLockStatus: "LOCKED",
  activeThreatRows: [
    { Threat_ID: "TRT-PAY-001", Archetype: "PAY", Subcategory: "PAYMENT", Surface: "Transaction-Data", authority_anchors: ["GDPR"] },
    { Threat_ID: "TRT-AI-001", Archetype: "JDG", Subcategory: "DEC", Surface: "Consumer-Public", authority_anchors: ["EU_AI_ACT"] }
  ]
});
assert.equal(m11.context_role, "DERIVED_CONTEXT_ONLY_NOT_TRIGGER_OR_CONTROL_PROOF");
assert.equal(m11.usage_boundary.may_create_threat_rows, false);
assert.equal(m11.usage_boundary.may_change_route_plan, false);
assert.equal(m11.usage_boundary.may_treat_visible_phase8_control_as_automatic_exposure_control, false);
assert.deepEqual(m11.active_threat_context_links.map((row) => row.matched_obligation_ids), [
  ["FIN-OBL-TEST-01"],
  ["AI-OBL-TEST-01"]
]);
assert.equal(m11.active_threat_context_links.every((row) => row.route_or_status_changed === false), true);

const m12 = buildM12DomainControlObligationChallenge({
  domainControlObligationProfile: profile,
  sourceLockStatus: "LOCKED"
}).phase8_domain_control_obligation_challenge;
assert.equal(m12.status, "LOCKED", m12.critical_failures.join("\n"));
assert.equal(m12.profile_rederived, false);
assert.equal(m12.profile_rewritten, false);
assert.equal(m12.challenged_rows.length, 2);

const hiddenProof = structuredClone(profile);
hiddenProof.obligations[1].missing_proof = [];
hiddenProof.obligations[1].limitation = [];
const hiddenProofChallenge = buildM12DomainControlObligationChallenge({
  domainControlObligationProfile: hiddenProof,
  sourceLockStatus: "LOCKED"
}).phase8_domain_control_obligation_challenge;
assert.equal(hiddenProofChallenge.status, "LOCKED_WITH_LIMITATIONS");
assert.ok(hiddenProofChallenge.warnings.some((warning) => warning.includes("hides missing proof")));

const overlayMisuse = structuredClone(profile);
overlayMisuse.obligations[0].regulatory_overlay_refs[0].matched_frameworks = ["INVENTED_FRAMEWORK"];
const overlayChallenge = buildM12DomainControlObligationChallenge({
  domainControlObligationProfile: overlayMisuse,
  sourceLockStatus: "LOCKED"
}).phase8_domain_control_obligation_challenge;
assert.equal(overlayChallenge.status, "REPAIR_REQUIRED");
assert.ok(overlayChallenge.critical_failures.some((failure) => failure.includes("framework not present in authority_dependency")));

const compiler = buildDomainControlObligationCompilerHandoff({
  domainControlObligationProfile: profile,
  sourceLockStatus: "LOCKED"
});
assert.equal(compiler.no_new_findings_created, true);
assert.equal(compiler.no_new_rendered_section_created, true);
assert.deepEqual(compiler.existing_section_ids_only, [
  "legal_document_control_review",
  "exposure_control_discipline",
  "review_route_action_plan",
  "control_handoff_readiness",
  "exposure_clarification_queue",
  "methodology_limitations_review_notes"
]);
assert.deepEqual(Object.keys(compiler.existing_section_contributions), compiler.existing_section_ids_only);
assert.equal(compiler.existing_section_contributions.legal_document_control_review.rows.length, 2);
assert.equal(compiler.existing_section_contributions.exposure_control_discipline.rows.length, 2);
assert.equal(compiler.existing_section_contributions.review_route_action_plan.rows[1].review_route_signal, "REQUEST_CONTROL_EVIDENCE");
assert.equal(compiler.existing_section_contributions.control_handoff_readiness.rows[1].handoff_state, "BLOCKED_PENDING_SOURCE");
assert.equal(containsKey(compiler, new Set(["candidate_id", "derivation_basis", "registry_key_ref", "obligation_catalog_ref", "p2e_navigation_route_refs"])), false);
assert.equal(compiler.projection_boundaries.authority_dependency_is_not_legal_applicability, true);
assert.equal(compiler.projection_boundaries.visible_control_is_not_compliance_or_adequacy, true);

for (const relativePath of [
  "src/phases/08-domain-control-obligation-profile/domain-control-obligation-downstream-handoff.contract.js",
  "src/phases/10-exposure-profile/domain-control-obligation-profile.handoff.js",
  "src/phases/11-operator-challenge/domain-control-obligation-profile.handoff.js",
  "src/phases/12-normalized-compiler/domain-control-obligation-profile.handoff.js",
  "agent-packages/agent_5_exposure_registry/M11_DOMAIN_CONTROL_OBLIGATION_HANDOFF.md"
]) assert.ok(fs.existsSync(path.join(backendRoot, relativePath)), `Phase 8 downstream handoff file missing: ${relativePath}`);

console.log("Phase 8 Domain Control Obligation substantive downstream handoff: PASS");

function obligationRow({
  candidateId,
  obligationId,
  family,
  sourceLayer,
  sourcePackageId,
  capabilityOverlayId,
  activityReference,
  behavior,
  surface,
  authority,
  role,
  mechanism,
  posture,
  evidenceBasis,
  missingProof,
  limitation,
  regulatoryOverlayRefs
}) {
  return {
    candidate_id: candidateId,
    obligation_id: obligationId,
    obligation_family: family,
    source_layer: sourceLayer,
    source_package_id: sourcePackageId,
    catalog_package_id: capabilityOverlayId || sourcePackageId,
    capability_overlay_id: capabilityOverlayId,
    linked_activity_references: [activityReference],
    matched_behavior_codes: [behavior],
    matched_surface_tokens: [surface],
    registry_key_ref: { key_file: `${sourcePackageId}_Registry_Key.yml` },
    obligation_catalog_ref: { catalog_file: `${capabilityOverlayId || sourcePackageId}.obligation-catalog.json` },
    p2e_navigation_route_refs: [{ route_ref_id: `${capabilityOverlayId || sourcePackageId}:${family}` }],
    regulatory_overlay_refs: regulatoryOverlayRefs,
    normalized_name: `${family.replaceAll("_", " ")} review`,
    what_it_requires: `Maintain an operational ${family.replaceAll("_", " ")} control for the linked activity.`,
    target_specific_obligation_context: `The target exposes ${activityReference} with ${behavior} behavior on the ${surface} surface.`,
    authority_dependency: authority,
    exposure_role_context: role,
    obligation_locus: "product and operating workflow",
    obligation_trigger_timing: "ongoing",
    expected_control_signal: `A target-specific ${family.replaceAll("_", " ")} mechanism and operating evidence.`,
    control_mechanism_present: mechanism,
    control_posture_status: posture,
    evidence_basis: evidenceBasis,
    missing_proof: missingProof,
    diligence_question: `Can the target provide operating evidence for ${family.replaceAll("_", " ")}?`,
    derivation_basis: [],
    limitation
  };
}

function containsKey(value, forbidden, seen = new Set()) {
  if (!value || typeof value !== "object" || seen.has(value)) return false;
  seen.add(value);
  if (Array.isArray(value)) return value.some((item) => containsKey(item, forbidden, seen));
  for (const [key, child] of Object.entries(value)) {
    if (forbidden.has(key)) return true;
    if (containsKey(child, forbidden, seen)) return true;
  }
  return false;
}
