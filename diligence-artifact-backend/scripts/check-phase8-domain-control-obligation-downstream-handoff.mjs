import assert from "node:assert/strict";
import { buildM12DomainControlObligationChallenge } from "../src/phases/11-operator-challenge/domain-control-obligation-profile.handoff.js";
import { buildDomainControlObligationCompilerHandoff } from "../src/phases/12-normalized-compiler/domain-control-obligation-profile.handoff.js";

const profile = {
  artifact_type: "domain_control_obligation_profile",
  artifact_version: "phase8_domain_control_obligation_profile.v1",
  run_id: "RUN-P8-DOWNSTREAM",
  target: "Example",
  target_url: "https://example.com",
  domain_package_context: {
    primary_domain_package: "ai-governance",
    ai_overlay_mounted: true,
    regulatory_overlay_ids: ["financial-services"],
    registry_files: ["AI_Registry_Key.yml", "FinTech_Registry_Key.yml"]
  },
  obligations: [
    {
      obligation_id: "DCO.001",
      candidate_id: "DCO.CAND.001",
      obligation_family: "AI_DISCLOSURE",
      obligation_status: "TRIGGERED",
      obligation_statement: "Public AI disclosure duty signal",
      trigger_basis: ["AI capability offered to customers"],
      evidence_basis: [{ route_id: "ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION", bucket_id: "2E_BUCKET_DOMAIN_CONTROL_OBLIGATION", index_artifact: "domain_control_obligation_navigation_index", source_artifact: "lossless_root__ai_safety_transparency", source_id: "ai-1", locator_path: "$.sources[0]", quote: "AI disclosure" }],
      missing_proof: [],
      limitation: [],
      applicability_status: "CANDIDATE_ONLY",
      regulatory_overlay_refs: [{ overlay_id: "financial-services", matched_frameworks: ["RBI"] }],
      registry_lineage: { package_id: "ai-governance", obligation_id: "AI.OBL.001", registry_file: "AI_Registry_Key.yml", registry_version: "3.0.0", source: "domain_control_obligations" },
      authority_dependency: [{ authority_id: "RBI", authority_group_id: "RBI", authority_layer: "DOMAIN_PRIMARY", validation_status: "PASS" }]
    },
    {
      obligation_id: "DCO.002",
      candidate_id: "DCO.CAND.002",
      obligation_family: "AI_GOVERNANCE",
      obligation_status: "LIMITED",
      obligation_statement: "AI governance control signal",
      trigger_basis: ["AI governance package active"],
      evidence_basis: [{ route_id: "ROUTE.PHASE8.DOMAIN_CONTROL_OBLIGATION", bucket_id: "2E_BUCKET_DOMAIN_CONTROL_OBLIGATION", index_artifact: "domain_control_obligation_navigation_index", source_artifact: "lossless_root__ai_safety_transparency", source_id: "ai-2", locator_path: "$.sources[1]", quote: "AI controls" }],
      missing_proof: ["Private policy not public"],
      limitation: ["Public evidence only"],
      applicability_status: "CANDIDATE_ONLY",
      regulatory_overlay_refs: [],
      registry_lineage: { package_id: "ai-governance", obligation_id: "AI.OBL.002", registry_file: "AI_Registry_Key.yml", registry_version: "3.0.0", source: "domain_control_obligations" },
      authority_dependency: []
    }
  ],
  material_obligation_ids: ["DCO.001", "DCO.002"],
  limitations: ["Public evidence only"],
  authority_validation: { status: "PASS", critical_failures: [], warnings: [], checked_authority_ids: ["RBI"] },
  validation: { status: "PASS_WITH_LIMITATIONS", critical_failures: [], warnings: ["Public evidence only"] }
};

const m12 = buildM12DomainControlObligationChallenge({ domainControlObligationProfile: profile, sourceLockStatus: "LOCKED_WITH_LIMITATIONS" }).phase8_domain_control_obligation_challenge;
assert.equal(m12.artifact_type, "phase8_domain_control_obligation_challenge");
assert.equal(m12.source_artifact, "domain_control_obligation_profile");
assert.equal(m12.source_lock_status, "LOCKED_WITH_LIMITATIONS");
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
assert.equal(overlayChallenge.status, "CONTROLLED_FAILURE");
assert.ok(overlayChallenge.critical_failures.some((failure) => failure.includes("framework not present in authority_dependency")));

const compiler = buildDomainControlObligationCompilerHandoff({
  domainControlObligationProfile: profile,
  sourceLockStatus: "LOCKED"
});
assert.equal(compiler.no_new_findings_created, true);
assert.equal(compiler.no_new_rendered_section_created, true);
assert.deepEqual(compiler.existing_section_ids_only, [
  "legal_document_control_review",
  "legal_governance_control_review",
  "data_privacy_provenance_review",
  "exposure_control_review"
]);
console.log("Phase 8 Domain Control Obligation downstream handoff: PASS");
