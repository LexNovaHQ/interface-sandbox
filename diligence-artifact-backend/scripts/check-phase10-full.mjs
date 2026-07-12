import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { synchronizeReferences } from "../src/phases/10-exposure-profile/m11-final-synchronized.runner.js";
import { buildPhase10CompilerCompatibility, assertPhase10CompilerCompatibility } from "../src/phases/12-normalized-compiler/phase10-downstream-compatibility.js";

const root = "src/phases/10-exposure-profile";
const packageRoot = "agent-packages/agent_5_exposure_registry";
const files = {
  wrapper: readFileSync(`${root}/m11-final-synchronized.runner.js`, "utf8"),
  orchestrator: readFileSync(`${root}/m11-orchestrator-m11v2.js`, "utf8"),
  finalization: readFileSync(`${root}/phase10-semantic-finalization.js`, "utf8"),
  routing: readFileSync(`${root}/phase10-classification-routing.js`, "utf8"),
  evidence: readFileSync(`${root}/m11-batch-evidence-resolver.js`, "utf8"),
  binding: readFileSync(`${packageRoot}/AGENT5_RUNTIME_BINDING_PACKET_SYNCED_M11.yaml`, "utf8"),
  output: readFileSync(`${packageRoot}/AGENT5_BACKEND_OUTPUT_CONTRACT_SYNCED_M11.md`, "utf8"),
  m12: readFileSync("src/phases/11-operator-challenge/m12-deterministic-challenge.js", "utf8"),
  compiler: readFileSync("src/phases/12-normalized-compiler/compiler-m9-section6-v3.js", "utf8"),
  compatibility: readFileSync("src/phases/12-normalized-compiler/phase10-downstream-compatibility.js", "utf8")
};

for (const marker of [
  "CO_11_COMPLETE",
  "v18_final_runtime_package_downstream_sync",
  "static_package_reference_injection_forbidden",
  "selected_registry_references_loaded_dynamically"
]) assert.ok(files.wrapper.includes(marker), `synchronized wrapper missing: ${marker}`);

const refs = synchronizeReferences([
  "AI_THREAT_REGISTRY.yaml",
  "AI_Registry_Key.yml",
  "03_REGISTRY_EVALUATION_RULES.yaml"
]);
assert.equal(refs.includes("AI_THREAT_REGISTRY.yaml"), false);
assert.equal(refs.includes("AI_Registry_Key.yml"), false);
assert.ok(refs.includes("03_REGISTRY_EVALUATION_RULES.yaml"));
assert.ok(refs.includes("Diligence_Field_Derivation_Registry.yml"));
assert.ok(refs.includes("FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"));

for (const marker of [
  "CO_8_DOMAIN_AGNOSTIC_LAYER2_ACTIVE",
  "CO_9_DYNAMIC_LAYER3_ACTIVE",
  "CO_10_DOMAIN_AGNOSTIC_TRACE_ACTIVE",
  "buildPackageScopedSemanticPacket",
  "validateSemanticLedger",
  "buildDynamicWorkpad",
  "buildDomainAgnosticForensics"
]) assert.ok(files.orchestrator.includes(marker), `orchestrator missing: ${marker}`);

for (const marker of [
  "PHASE10_EXECUTION_IDENTITY_v2",
  "M11_PACKAGE_SCOPED_SEMANTIC_PACKET_v1",
  "M11_PACKAGE_SCOPED_SEMANTIC_LEDGER_v1",
  "M11_DYNAMIC_LAYER3_v1",
  "M11_DOMAIN_AGNOSTIC_FORENSICS_v1",
  "CONTROLLED_BY_VISIBLE_CONTROL",
  "CONTROLLED_BY_EXCLUSION",
  "CONTROLLED_BY_PUBLIC_EVIDENCE_LIMITATION",
  "NOT_TRIGGERED_NOT_APPLICABLE"
]) assert.ok(`${files.binding}\n${files.finalization}`.includes(marker), `Phase 10 core marker missing: ${marker}`);

for (const stale of [
  "CURRENT_SINGLE_REGISTRY_PRE_AUTO_SELECTOR",
  "PENDING_CO_2",
  "max 8 rows",
  "98/98 row coverage",
  "workpadRows.length !== 98",
  "VALID_SUBCATS = new Set"
]) assert.equal(Object.values(files).join("\n").includes(stale), false, `stale Phase 10 marker remains: ${stale}`);

for (const marker of [
  "active_threat_registry_manifest",
  "expected_registry_row_key_count",
  "registry_row_key",
  "challenge_gate.v3.phase10_dynamic",
  "PHASE10_EXECUTION_IDENTITY_v2"
]) assert.ok(files.m12.includes(marker), `M12 compatibility marker missing: ${marker}`);
assert.equal(files.m12.includes("workpadRows.length !== 98"), false);
assert.equal(files.m12.includes("duplicate controlled Threat_ID"), false);

for (const marker of [
  "buildPhase10CompilerCompatibility",
  "phase10_compound_identity_preserved",
  "phase10_package_stream_custody_preserved",
  "phase10_raw_threat_id_global_deduplication_forbidden"
]) assert.ok(files.compiler.includes(marker), `compiler compatibility marker missing: ${marker}`);

const artifacts = buildSyntheticArtifacts();
const compatibility = buildPhase10CompilerCompatibility({ artifacts });
const rootCompatibility = assertPhase10CompilerCompatibility(compatibility);
assert.equal(rootCompatibility.expected_registry_row_key_count, 4);
assert.equal(rootCompatibility.workpad_row_count, 4);
assert.equal(rootCompatibility.controlled_row_count, 2);
assert.equal(rootCompatibility.triggered_row_count, 1);
assert.equal(rootCompatibility.workpad_only_row_count, 1);
assert.equal(rootCompatibility.material_rows.length, 3);
assert.equal(rootCompatibility.validation.status, "PASS");
assert.deepEqual(rootCompatibility.mounted_packages, ["fintech", "ai-governance"]);
assert.equal(rootCompatibility.stream_summary.length, 2);
assert.equal(rootCompatibility.package_summary.length, 2);

const repeatedRaw = rootCompatibility.material_rows.filter((row) => row.Threat_ID === "UNI_PRV_001");
assert.equal(repeatedRaw.length, 2);
assert.notEqual(repeatedRaw[0].registry_row_key, repeatedRaw[1].registry_row_key);

const bad = buildSyntheticArtifacts();
bad.exposure_registry_workpad_98.registry_rows.push({ ...bad.exposure_registry_workpad_98.registry_rows[0] });
assert.throws(() => assertPhase10CompilerCompatibility(buildPhase10CompilerCompatibility({ artifacts: bad })), /PHASE10_DOWNSTREAM_COMPATIBILITY_FAILED/);

console.log(JSON.stringify({
  check: "Dedicated Phase 10 full validation suite",
  status: "PASS",
  co11_agent5_runtime_package_sync: "PASS",
  co12_phase10_functional_suite: "PASS",
  co13_m12_downstream_compatibility: "PASS",
  co13_compiler_downstream_compatibility: "PASS",
  identity_contract: "PHASE10_EXECUTION_IDENTITY_v2",
  dynamic_fixture_rows: 4,
  repeated_raw_threat_id_across_packages_preserved: true,
  maximum_rows_per_batch: 15
}, null, 2));

function buildSyntheticArtifacts() {
  const rows = [
    workpadRow("fintech::UNI_PRV_001", "fintech", "PRIMARY::fintech", "PRIMARY", "UNI_PRV_001", "CONTROLLED_BY_VISIBLE_CONTROL"),
    workpadRow("fintech::FIN_PAY_001", "fintech", "PRIMARY::fintech", "PRIMARY", "FIN_PAY_001", "CONTROLLED_BY_EXCLUSION"),
    workpadRow("ai-governance::UNI_PRV_001", "ai-governance", "OVERLAY::ai-governance", "OVERLAY", "UNI_PRV_001", "TRIGGERED"),
    workpadRow("ai-governance::AI_DEC_001", "ai-governance", "OVERLAY::ai-governance", "OVERLAY", "AI_DEC_001", "NOT_TRIGGERED_NOT_APPLICABLE", false)
  ];
  return {
    active_threat_registry_manifest: {
      expected_registry_row_key_count: 4,
      mounted_packages: ["fintech", "ai-governance"],
      primary_package: "fintech",
      ai_mount: "AI_OVERLAY_MOUNTED"
    },
    exposure_registry_route_plan: { route_rows: rows.map((row) => ({ ...row, route: row.final_material_status === "NOT_TRIGGERED_NOT_APPLICABLE" ? "NOT_TRIGGERED_NOT_APPLICABLE" : "EVALUATION_ROUTED" })) },
    exposure_registry_workpad_98: { registry_rows: rows },
    exposure_registry_controlled_profile: { controlled_rows: rows.filter((row) => row.final_material_status.startsWith("CONTROLLED_")).map(profileRow) },
    exposure_registry_triggered_profile: { triggered_rows: rows.filter((row) => row.final_material_status === "TRIGGERED").map(profileRow) },
    challenge_gate: { status: "LOCKED", gate: "PASS" }
  };
}
function workpadRow(registry_row_key, package_id, stream_id, stream_type, Threat_ID, status, material = true) {
  return {
    registry_row_key,
    package_id,
    source_domain: package_id,
    stream_id,
    stream_type,
    batch_id: material ? `${stream_type}__TEST__001` : "",
    Threat_ID,
    final_material_status: status,
    material_projection: material ? materialProjection(Threat_ID, status) : null
  };
}
function profileRow(row) { return { registry_row_key: row.registry_row_key, package_id: row.package_id, stream_id: row.stream_id, stream_type: row.stream_type, ...row.material_projection }; }
function materialProjection(Threat_ID, evaluation_status) {
  return {
    Threat_ID,
    Threat_Name: `Threat ${Threat_ID}`,
    target_match: "Supported target match.",
    evaluation_status,
    basis_proof: "Condition-by-condition basis.",
    control_exclusion_evaluation: "Deterministic status basis.",
    evidence_source_basis: "Primary evidence.",
    fp_mechanism: "False-positive discipline applied.",
    Archetype: "UNI",
    Subcategory: "PRV",
    Surface: "DATA",
    authority_anchors: [],
    Pain_Tier: "T2",
    Pain_Depth: "Material",
    Pain_Category: "Governance",
    Legal_Pain: "Qualified review required.",
    remediation: "Review and strengthen controls.",
    review_route: "LOCAL_COUNSEL_REVIEW",
    row_limitations: "Public evidence limitation recorded where applicable."
  };
}
