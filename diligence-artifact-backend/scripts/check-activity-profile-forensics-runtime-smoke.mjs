import assert from "node:assert/strict";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { runActivityProfileForensicsPhase } from "../src/phases/06-activity-profile-forensics/index.js";

const contract = getPipelineContract("M8_TARGET_FEATURE_PROFILE_FORENSICS");

await smokeForensicRunnerLocked();
await smokeUnexpectedRuntimeArtifactFails();
await smokeContractMismatchFails();

console.log("Activity Profile Forensics runtime smoke: PASS");

async function smokeForensicRunnerLocked() {
  const calls = makeRuntimeCalls();
  const result = await runActivityProfileForensicsPhase({
    run: { run_id: "APF-RUNTIME-SMOKE" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE_FORENSICS",
    contract,
    ...calls.callbacks
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.saved_artifacts, ["target_feature_profile_forensics"]);
  assert.equal(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED"].includes(result.phase_lock_status), true);
  assert.equal(result.model_usage, "NONE_DETERMINISTIC");
  assert.equal(result.activity_profile_forensics_phase_runner_used, true);
  assert.equal(result.source_helper, "buildM8DeterministicFeatureForensics");
  assert.deepEqual(calls.readArgs[0].reads, contract.reads);
  assert.equal(calls.saved.length, 1);
  assert.equal(calls.saved[0].artifact_name, "target_feature_profile_forensics");

  const artifact = calls.saved[0].artifact;
  assert.equal(artifact.forensic_contract.model_generated_forensics_allowed, false);
  assert.equal(artifact.forensic_boundary.material_profile_re_emitted, false);
  assert.equal(artifact.forensic_boundary.semantic_forensic_profile_retired, true);
  assert.equal(artifact.forensic_boundary.feature_candidate_inventory_recompiled, false);
  assert.equal(artifact.forensic_boundary.lossless_evidence_recompiled, false);
  assert.equal(Array.isArray(artifact.candidate_to_activity_coverage_ledger), true);
  assert.equal(Array.isArray(artifact.activity_trace_index), true);
  assert.equal(Array.isArray(artifact.field_trace_index), true);
  assert.equal(Array.isArray(artifact.activity_limitations_ledger), true);
  assert.equal(artifact.runtime_trace_m8_only.phase, "M8_TARGET_FEATURE_PROFILE_FORENSICS");
}

async function smokeUnexpectedRuntimeArtifactFails() {
  const calls = makeRuntimeCalls({ extraRuntimeArtifact: { data_provenance_profile: {} } });
  await expectFailure(() => runActivityProfileForensicsPhase({
    run: { run_id: "APF-RUNTIME-SMOKE-UNEXPECTED" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE_FORENSICS",
    contract,
    ...calls.callbacks
  }), "ACTIVITY_PROFILE_FORENSICS_UNEXPECTED_RUNTIME_ARTIFACT:data_provenance_profile");
  assert.equal(calls.saved.length, 0);
}

async function smokeContractMismatchFails() {
  const calls = makeRuntimeCalls();
  await expectFailure(() => runActivityProfileForensicsPhase({
    run: { run_id: "APF-RUNTIME-SMOKE-MISMATCH" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE_FORENSICS",
    contract: { ...contract, reads: contract.reads.filter((name) => name !== "target_feature_profile") },
    ...calls.callbacks
  }), "ACTIVITY_PROFILE_FORENSICS_READS_MISMATCH");
  assert.equal(calls.saved.length, 0);
}

function makeRuntimeCalls({ extraRuntimeArtifact = {} } = {}) {
  const readArgs = [];
  const saved = [];
  return {
    readArgs,
    saved,
    callbacks: {
      readArtifacts: async ({ reads, agent_id }) => {
        readArgs.push({ reads, agent_id });
        return { ...buildAllowedRuntimeArtifacts(reads), ...extraRuntimeArtifact };
      },
      saveArtifact: async (args) => saved.push(args)
    }
  };
}

function buildAllowedRuntimeArtifacts(reads) {
  const artifacts = {};
  for (const name of reads) artifacts[name] = buildArtifact(name);
  return artifacts;
}

function buildArtifact(name) {
  if (name === "source_discovery_handoff") return { run_id: "APF-RUNTIME-SMOKE", target_url: "https://example.test", status: "LOCKED" };
  if (name === "target_profile") return { target_profile: { target_identity: { brand_name: "Example AI" } } };
  if (name === "target_profile_forensics") return { target_profile_forensics: { forensic_lock_gate_result: { status: "PASS" } } };
  if (name === "feature_candidate_inventory") return { feature_candidate_inventory: validInventory() };
  if (name === "target_feature_profile") return { target_feature_profile: validActivityProfile() };
  return { artifact_name: name, root_family: name.replace(/^lossless_family__/, ""), storage_mode: "SINGLE", sources: [{ source_id: `${name}.1`, lossless_text: "Example AI offers Chat Assistant for drafting and review." }] };
}

function validInventory() {
  return {
    artifact_type: "feature_candidate_inventory",
    inventory_version: "m8_feature_candidate_inventory_index_v1",
    derivation_mode: "DETERMINISTIC_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION",
    run_id: "APF-RUNTIME-SMOKE",
    raw_hit_count: 1,
    canonical_candidate_count: 1,
    raw_feature_hit_index: [{ raw_hit_id: "RAW.001", raw_type: "FEATURE", source_pointer: { source_id: "P1.1" }, confidence_basis: "fixture" }],
    candidates: [{ candidate_id: "FC.001", canonical_feature_key: "chat_assistant", candidate_name: "Chat Assistant", candidate_type: "PRODUCT_ACTIVITY", wrapper_or_surface: "Example AI", capability_key: "chat_assistant", source_pointers: [{ source_family: "P1_PRODUCT", source_id: "P1.1", locator_value: "chat assistant" }] }],
    canonicalization_index: [{ candidate_id: "FC.001", canonical_feature_key: "chat_assistant", merged_raw_hit_ids: ["RAW.001"] }],
    dedup_index: [],
    parent_child_overlap_index: [],
    index_limitations: []
  };
}

function validActivityProfile() {
  return {
    activities: [{
      activity_reference: "ACT.001",
      product_service_wrapper: "Example AI",
      activity_feature_name: "Chat Assistant",
      activity_candidate_summary: "Chat Assistant is a public product activity.",
      mechanics_proof: "The activity supports drafting and review workflows.",
      autonomy_human_control_signal: "Human user initiates and reviews output.",
      data_content_object_touched: "User-entered content.",
      external_internal_action_signal: "External user-facing software action.",
      archetype_codes: ["UNI"],
      archetype_proof: "General AI interface classification.",
      surface_context_tokens: ["Consumer-Public"],
      surface_proof_and_routing_limits: "Public product page evidence only.",
      source_candidate_ids: ["FC.001"]
    }],
    commercial_availability_posture: { posture: "PUBLICLY_AVAILABLE", evidence_basis: ["Public fixture"], limitation: "Fixture only" },
    profile_level_limitations: []
  };
}

async function expectFailure(fn, fragment) {
  let failed = false;
  try { await fn(); } catch (error) { failed = true; assert.ok(String(error.message).includes(fragment), `expected ${fragment}, got ${error.message}`); }
  assert.equal(failed, true, `expected failure containing ${fragment}`);
}
