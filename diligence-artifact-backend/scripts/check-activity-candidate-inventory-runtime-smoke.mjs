import assert from "node:assert/strict";
import { ACTIVITY_CANDIDATE_INVENTORY_CONTRACT, runActivityCandidateInventoryPhase, activityCandidateInventoryReadArtifacts, activityCandidateInventoryWriteArtifacts } from "../src/phases/05-activity-profile-review/index.js";

const contract = buildPhaseOwnedRuntimeContract();

await smokeLockedInventoryOutput();
await smokeForbiddenP4RuntimeArtifactFails();
await smokeContractReadMismatchFails();

console.log("Activity Candidate Inventory runtime smoke: PASS");

async function smokeLockedInventoryOutput() {
  const calls = makeRuntimeCalls();
  const result = await runActivityCandidateInventoryPhase({
    run: { run_id: "ACI-RUNTIME-SMOKE" },
    internalJobId: "M8_FEATURE_CANDIDATE_INVENTORY",
    contract,
    ...calls.callbacks
  });

  assert.equal(result.ok, true);
  assert.equal(result.phase_lock_status, "LOCKED");
  assert.deepEqual(result.saved_artifacts, ["feature_candidate_inventory"]);
  assert.equal(result.model_usage, "NONE_DETERMINISTIC");
  assert.equal(result.activity_candidate_inventory_phase_runner_used, true);
  assert.equal(result.source_helper, "buildFeatureCandidateInventoryIndex");
  assert.equal(result.validator, "validateFeatureCandidateInventoryIndex");
  assert.deepEqual(calls.readArgs[0].reads, contract.reads);
  assert.equal(calls.saved.length, 1);
  assert.equal(calls.saved[0].artifact_name, "feature_candidate_inventory");
  assert.equal(calls.saved[0].lock_status, "LOCKED");

  const inventory = calls.saved[0].artifact;
  assert.equal(inventory.artifact_type, "feature_candidate_inventory");
  assert.equal(inventory.inventory_version, "m8_feature_candidate_inventory_index_v1");
  assert.equal(inventory.derivation_mode, "DETERMINISTIC_INDEX_NO_MODEL_NO_EVIDENCE_COMPILATION");
  assert.equal(inventory.index_boundary.index_only, true);
  assert.equal(inventory.index_boundary.no_source_text_copy, true);
  assert.ok(inventory.raw_hit_count >= 5, `expected raw hits, got ${inventory.raw_hit_count}`);
  assert.ok(inventory.canonical_candidate_count >= 5, `expected canonical candidates, got ${inventory.canonical_candidate_count}`);
  assert.equal(inventory.source_families_indexed.includes("P4_USE_CASE_INDUSTRY"), false);
  assert.equal(inventoryContainsEvidenceCopy(inventory), false);

  const canonicalKeys = new Set(inventory.candidates.map((candidate) => candidate.canonical_feature_key));
  for (const expectedKey of [
    "assistant::assistant::product-wrapper",
    "sarvam-api::speech-to-text::standalone-api",
    "sarvam-api::text-to-speech::standalone-api",
    "integrations::integration-surface::integration-surface",
    "models::model-catalogue::model-catalogue"
  ]) assert.ok(canonicalKeys.has(expectedKey), `missing canonical key ${expectedKey}`);

  for (const candidate of inventory.candidates) {
    assert.equal(Array.isArray(candidate.source_pointers), true, `${candidate.candidate_id} source_pointers must be array`);
    assert.ok(candidate.source_pointers.length, `${candidate.candidate_id} must have source_pointers`);
    for (const pointer of candidate.source_pointers) {
      assert.notEqual(pointer.source_family, "P4_USE_CASE_INDUSTRY");
      assert.equal(pointer.excerpt, undefined);
      assert.equal(pointer.lossless_text, undefined);
      assert.equal(pointer.clean_text, undefined);
    }
  }
}

async function smokeForbiddenP4RuntimeArtifactFails() {
  const calls = makeRuntimeCalls({ extraRuntimeArtifact: { lossless_family__P4_USE_CASE_INDUSTRY: family("P4_USE_CASE_INDUSTRY", [source("P4.001", "https://example.test/use-cases/customer-support", "use_case")]) } });
  await expectFailure(() => runActivityCandidateInventoryPhase({
    run: { run_id: "ACI-RUNTIME-SMOKE-P4-FORBIDDEN" },
    internalJobId: "M8_FEATURE_CANDIDATE_INVENTORY",
    contract,
    ...calls.callbacks
  }), "ACTIVITY_CANDIDATE_INVENTORY_FORBIDDEN_RUNTIME_ARTIFACT:lossless_family__P4_USE_CASE_INDUSTRY");
  assert.equal(calls.saved.length, 0);
}

async function smokeContractReadMismatchFails() {
  const calls = makeRuntimeCalls();
  await expectFailure(() => runActivityCandidateInventoryPhase({
    run: { run_id: "ACI-RUNTIME-SMOKE-READ-MISMATCH" },
    internalJobId: "M8_FEATURE_CANDIDATE_INVENTORY",
    contract: { ...contract, reads: [...contract.reads, "lossless_family__P4_USE_CASE_INDUSTRY"] },
    ...calls.callbacks
  }), "ACTIVITY_CANDIDATE_INVENTORY_READS_MISMATCH");
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
      saveArtifact: async (args) => {
        saved.push(args);
      }
    }
  };
}

function buildAllowedRuntimeArtifacts(reads) {
  const artifacts = {};
  for (const name of reads) artifacts[name] = buildArtifact(name);
  return artifacts;
}

function buildArtifact(name) {
  if (name === "source_discovery_handoff") return { artifact_name: name, run_id: "ACI-RUNTIME-SMOKE", status: "LOCKED" };
  if (name === "target_profile") return { artifact_name: name, target_identity: { brand_name: "Example AI" }, target_profile_limitations: [] };
  if (name === "target_profile_forensics") return { artifact_name: name, forensic_lock_gate_result: { status: "PASS" } };
  if (name === "lossless_family__P1_PRODUCT") return family("P1_PRODUCT", [source("P1.001", "https://example.test/products/assistant", "product_slug")]);
  if (name === "lossless_family__P2_PLATFORM_FEATURE_SOLUTION") return family("P2_PLATFORM_FEATURE_SOLUTION", [source("P2.001", "https://example.test/features/workflow-automation", "feature_route")]);
  if (name === "lossless_family__P3_AI_CAPABILITY_TECHNICAL") return family("P3_AI_CAPABILITY_TECHNICAL", [
    source("P3.001", "https://example.test/apis/speech-to-text", "api_docs_or_api_family_root"),
    source("P3.002", "https://example.test/apis/text-to-speech", "api_docs_or_api_family_root"),
    source("P3.003", "https://example.test/models", "models_overview"),
    source("P3.004", "https://example.test/integrations", "integrations_root")
  ]);
  if (name === "lossless_family__P5_ENTERPRISE_PRICING") return family("P5_ENTERPRISE_PRICING", [{ ...source("P5.001", "https://example.test/pricing", "pricing_or_plans"), lossless_text: "Text to Speech: $1 Speech to Text: $1 Sarvam 105B: paid plan" }]);
  throw new Error(`SMOKE_UNKNOWN_ARTIFACT:${name}`);
}

function family(rootFamily, sources) {
  return { artifact_name: `lossless_family__${rootFamily}`, root_family: rootFamily, sources: sources.map((entry) => ({ ...entry, root_family: rootFamily })) };
}

function source(sourceId, url, routeType) {
  return { source_id: sourceId, canonical_url: url, url, route_type: routeType, lossless_text: `Lossless text for ${url}` };
}

function buildPhaseOwnedRuntimeContract() {
  return {
    central_phase_id: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_id,
    public_label: ACTIVITY_CANDIDATE_INVENTORY_CONTRACT.central_phase_label,
    agent_id: "agent_3_target_feature",
    actor_id: "agent_3_target_feature",
    reads: activityCandidateInventoryReadArtifacts(),
    writes: activityCandidateInventoryWriteArtifacts(),
    next: "M8_TARGET_FEATURE_PROFILE"
  };
}

function inventoryContainsEvidenceCopy(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(inventoryContainsEvidenceCopy);
  return Object.keys(value).some((key) => ["excerpt", "lossless_text", "clean_text", "text", "mechanics_proof", "activity_candidate_summary", "archetype_proof", "surface_proof_and_routing_limits"].includes(key)) || Object.values(value).some(inventoryContainsEvidenceCopy);
}

async function expectFailure(fn, fragment) {
  let failed = false;
  try {
    await fn();
  } catch (error) {
    failed = true;
    assert.ok(String(error.message).includes(fragment), `expected failure containing ${fragment}, got ${error.message}`);
  }
  assert.equal(failed, true, `expected failure containing ${fragment}`);
}
