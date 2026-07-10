import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { P2A_TARGET_PROFILE_ARTIFACTS, P2A_TARGET_PROFILE_SAVE_ORDER } from "../src/phases/02-cartography-index/target-profile-source-index.contract.js";
import { buildTargetProfileDeterministicMap } from "../src/phases/02-cartography-index/services/target-profile-deterministic-map.builder.js";
import { compileTargetProfileSourceIndex } from "../src/phases/02-cartography-index/services/target-profile-source-index.compiler.js";
import { validateTargetProfileSemanticProfile } from "../src/phases/02-cartography-index/validators/target-profile-semantic-profile.validator.js";
import { validateTargetProfileSourceIndex } from "../src/phases/02-cartography-index/validators/target-profile-source-index.validator.js";
import { runTargetProfileSourceIndexOrchestrator, P2A_TARGET_SOURCE_SAVE_ORDER } from "../src/phases/02-cartography-index/orchestrators/target-profile-source-index.orchestrator.js";

const ROOT = process.cwd();
const requiredFiles = [
  "src/phases/02-cartography-index/orchestrators/target-profile-source-index.orchestrator.js",
  "src/phases/02-cartography-index/services/target-profile-source-index.compiler.js",
  "src/phases/02-cartography-index/validators/target-profile-source-index.validator.js"
];
for (const file of requiredFiles) assert.equal(fs.existsSync(path.join(ROOT, file)), true, `${file} must exist`);
assert.deepEqual(P2A_TARGET_SOURCE_SAVE_ORDER, P2A_TARGET_PROFILE_SAVE_ORDER);

const fixture = buildTargetProfileDeterministicMap({
  run: { run_id: "CHECK-P2A-IMPL", target_url: "https://fixture.example/" },
  artifacts: {
    source_discovery_handoff: { target_url: "https://fixture.example/" },
    legal_doc_inventory: { documents_found: [] },
    lossless_root__homepage_landing: rootArtifact("homepage_landing", "/", "Fixture AI finance platform for regulated operating context."),
    lossless_root__company_identity: rootArtifact("company_identity", "/about", "Fixture Labs Private Limited company identity and partner institution context."),
    lossless_root__contact_notice: rootArtifact("contact_notice", "/contact", "Contact and notice route with grievance contact reference."),
    lossless_root__pricing_commercial_availability: rootArtifact("pricing_commercial_availability", "/pricing", "Enterprise pricing, fees, subscription and schedule of charges."),
    lossless_root__regulatory_licensing_status: rootArtifact("regulatory_licensing_status", "/regulatory", "Regulatory disclosure with sponsor bank, bank partner and consumer disclosure signal."),
    lossless_root__grievance_complaints: rootArtifact("grievance_complaints", "/grievance", "Grievance redressal route with nodal officer, complaint email and ombudsman escalation.")
  }
});
const map = fixture[P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap];
const requiredRows = (map.semantic_label_queue || []).filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority));
const semanticWrapper = {
  [P2A_TARGET_PROFILE_ARTIFACTS.semanticProfile]: {
    run_id: "CHECK-P2A-IMPL",
    schema_version: "P2A_TARGET_PROFILE_SEMANTIC_PROFILE_v2_PHASE1_V5",
    semantic_navigation_index: requiredRows.map((row) => ({
      queue_id: row.queue_id,
      unit_id: row.unit_id,
      target_subcats: row.target_subcat_candidates || [],
      target_signal_families: row.target_signal_family_candidates || [],
      confidence: "CLEAR"
    })),
    semantic_integrity: { required_queue_count: requiredRows.length, labeled_queue_count: requiredRows.length, coverage_ratio: 1, ready_for_compiler: true },
    lock_status: "LOCKED"
  }
};
assert.equal(validateTargetProfileSemanticProfile(semanticWrapper, fixture).ok, true);
const finalWrapper = compileTargetProfileSourceIndex({ deterministicMap: fixture, semanticProfile: semanticWrapper });
const finalValidation = validateTargetProfileSourceIndex(finalWrapper);
assert.equal(finalValidation.ok, true, finalValidation.errors.join("|"));
const final = finalWrapper[P2A_TARGET_PROFILE_ARTIFACTS.finalIndex];
assert.ok(final.material_target_field_locator.some((row) => row.field_id === "TP.BIZ.009"));
assert.ok(final.material_target_field_locator.some((row) => row.field_id === "TP.BIZ.010"));
assert.equal(final.downstream_rules.target_profile_review_derives_values_later, true);
assert.equal(final.downstream_rules.full_legal_cartography_reserved_for_2e, true);

const saved = [];
const orchestration = await runTargetProfileSourceIndexOrchestrator({
  run: { run_id: "CHECK-P2A-IMPL", target_url: "https://fixture.example/" },
  artifacts: {
    source_discovery_handoff: { target_url: "https://fixture.example/" },
    legal_doc_inventory: { documents_found: [] },
    lossless_root__homepage_landing: rootArtifact("homepage_landing", "/", "Fixture AI finance platform for regulated operating context."),
    lossless_root__company_identity: rootArtifact("company_identity", "/about", "Fixture Labs Private Limited company identity and partner institution context."),
    lossless_root__contact_notice: rootArtifact("contact_notice", "/contact", "Contact and notice route with grievance contact reference."),
    lossless_root__pricing_commercial_availability: rootArtifact("pricing_commercial_availability", "/pricing", "Enterprise pricing, fees, subscription and schedule of charges."),
    lossless_root__regulatory_licensing_status: rootArtifact("regulatory_licensing_status", "/regulatory", "Regulatory disclosure with sponsor bank, bank partner and consumer disclosure signal."),
    lossless_root__grievance_complaints: rootArtifact("grievance_complaints", "/grievance", "Grievance redressal route with nodal officer, complaint email and ombudsman escalation.")
  },
  runSemanticModel: async ({ artifacts }) => {
    const deterministic = artifacts[P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap];
    const queue = deterministic[P2A_TARGET_PROFILE_ARTIFACTS.deterministicMap].semantic_label_queue.filter((row) => row.semantic_label_required === true || ["P0", "P1"].includes(row.priority));
    return { [P2A_TARGET_PROFILE_ARTIFACTS.semanticProfile]: { run_id: "CHECK-P2A-IMPL", schema_version: "P2A_TARGET_PROFILE_SEMANTIC_PROFILE_v2_PHASE1_V5", semantic_navigation_index: queue.map((row) => ({ queue_id: row.queue_id, unit_id: row.unit_id, target_subcats: row.target_subcat_candidates || [], target_signal_families: row.target_signal_family_candidates || [], confidence: "CLEAR" })), semantic_integrity: { required_queue_count: queue.length, labeled_queue_count: queue.length, coverage_ratio: 1, ready_for_compiler: true }, lock_status: "LOCKED" } };
  },
  saveArtifact: async ({ artifactName }) => { saved.push(artifactName); }
});
assert.equal(orchestration.ok, true);
assert.deepEqual(saved, P2A_TARGET_PROFILE_SAVE_ORDER);
assert.equal(orchestration.required_save_order_respected, true);
console.log("Phase 2A target source orchestrator/compiler/final validator check: PASS");

function rootArtifact(commonRoot, pathName, text) {
  return { artifact_name: `lossless_root__${commonRoot}`, common_root: commonRoot, sources: [{ source_id: `${commonRoot}.SRC.001`, common_root: commonRoot, canonical_url: `https://fixture.example${pathName}`, final_url: `https://fixture.example${pathName}`, url: `https://fixture.example${pathName}`, phase_1_classification_effect: "SOURCE_ROUTING_ONLY_NOT_JOB_ROUTING", lossless_text: text }] };
}
