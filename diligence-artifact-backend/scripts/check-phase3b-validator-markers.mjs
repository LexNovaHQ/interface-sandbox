import assert from "node:assert/strict";
import { compileDomainDerivationArtifacts } from "../src/phases/03-domain-derivation/validators/domain-derivation.validator.js";

const roots = ["homepage_landing","company_identity","product_service","platform_feature_solution","technical_docs_api","docs_api_data_flow","pricing_commercial_availability","use_case_customer_industry","integrations_ecosystem","ai_safety_transparency","regulatory_licensing_status","grievance_complaints"];
function baseArtifacts() {
  const a = {
    phase_routing_manifest: {},
    phase_route_runtime_packet: { routing_authority: "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY", route_id: "ROUTE.PHASE3B.DOMAIN_DERIVATION", bucket_id: "2B_BUCKET_DOMAIN_DERIVATION", lossless_evidence_role: "PRIMARY_EVIDENCE", index_role: "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE", profile_forensics_inputs_allowed: false },
    domain_derivation_source_index: {}, target_profile: {}, domain_selection_profile: {},
    active_run_package_manifest: { package_catalog: { available_regulatory_overlays: [] } }
  };
  for (const r of roots) a["lossless_root__" + r] = { sources: [] };
  return a;
}

// POSITIVE: a clean profile must NOT trip the self-collision (regression guard for B3).
const clean = await compileDomainDerivationArtifacts({
  run: { run_id: "T" }, artifacts: baseArtifacts(),
  modelOutput: { domain_derivation_profile: { primary_domain_derivation: { evaluated_rules: [], selected_package: null }, ai_mount_derivation: {}, fusion_candidate_derivation: {}, regulatory_overlay_derivation: {} } }
});
assert.notEqual(clean.phase_lock_status, "CONTROLLED_FAILURE", `clean 3B run must not self-fail: ${JSON.stringify(clean.validation.failures)}`);
assert.equal(clean.validation.failures.length, 0, `unexpected failures: ${JSON.stringify(clean.validation.failures)}`);

// NEGATIVE: a genuine forbidden value must STILL be caught (scan not over-relaxed).
const dirty = await compileDomainDerivationArtifacts({
  run: { run_id: "T" }, artifacts: baseArtifacts(),
  modelOutput: { domain_derivation_profile: { primary_domain_derivation: { evaluated_rules: [], selected_package: null }, ai_mount_derivation: {}, fusion_candidate_derivation: {}, regulatory_overlay_derivation: {}, limitation_ledger: ["compliance_conclusion: applicable"] } }
});
assert.equal(dirty.phase_lock_status, "CONTROLLED_FAILURE", "genuine forbidden marker must be caught");
console.log(JSON.stringify({ check: "phase3b validator markers", status: "PASS" }, null, 2));
