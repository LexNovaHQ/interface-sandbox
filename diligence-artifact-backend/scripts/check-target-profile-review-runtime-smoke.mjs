import assert from "node:assert/strict";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { runTargetProfileReviewPhase, TARGET_PROFILE_REVIEW_RUNNER_STATUS } from "../src/phases/03-target-profile-review/index.js";

const contract = getPipelineContract("M7_TARGET_PROFILE");

assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.phase_owned_runner, true);
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(TARGET_PROFILE_REVIEW_RUNNER_STATUS.global_production_deployment_switched, false);
assert.equal(contract.central_phase_id, "TARGET_PROFILE_REVIEW");
assert.deepEqual(contract.writes, ["target_profile"]);

await smokeLockedOutput();
await smokeLimitedOutput();
await smokeForbiddenRuntimeArtifactFails();
await smokeInvalidProviderOutputFails();

console.log("Target Profile Review runtime smoke: PASS");

async function smokeLockedOutput() {
  const calls = makeRuntimeCalls({ providerOutput: validTargetProfileOutput({ limitations: ["Registered notice location requires qualified review confirmation."] }) });
  const result = await runTargetProfileReviewPhase({
    run: { run_id: "TPR-RUNTIME-SMOKE-LOCKED" },
    internalJobId: "M7_TARGET_PROFILE",
    contract,
    ...calls.callbacks
  });

  assert.equal(result.ok, true);
  assert.equal(result.phase_lock_status, "LOCKED_WITH_LIMITATIONS");
  assert.equal(result.legal_signal_derivation_profile_supplied_directly, true);
  assert.equal(result.target_profile_review_phase_runner_used, true);
  assert.deepEqual(result.saved_artifacts, ["target_profile"]);
  assert.deepEqual(calls.saved.map((row) => row.artifact_name), ["target_profile"]);
  assert.equal(calls.saved[0].lock_status, "LOCKED_WITH_LIMITATIONS");
  assert.equal(calls.promptArgs.length, 1);
  assert.deepEqual(calls.promptArgs[0].writes, ["target_profile"]);
  assert.deepEqual(calls.readArgs[0].reads, contract.reads);
  assert.equal(calls.providerArgs[0].phase, "TARGET_PROFILE_REVIEW");
}

async function smokeLimitedOutput() {
  const calls = makeRuntimeCalls({ providerOutput: validTargetProfileOutput({ legalEntityName: "FIELD_NOT_PUBLIC", governingLaw: "FIELD_NOT_FOUND", courtsVenue: "FIELD_NOT_FOUND", limitations: ["Legal entity and jurisdiction signals require qualified review."] }) });
  const result = await runTargetProfileReviewPhase({
    run: { run_id: "TPR-RUNTIME-SMOKE-LIMITED" },
    internalJobId: "TARGET_PROFILE_REVIEW",
    contract,
    ...calls.callbacks
  });

  assert.equal(result.phase_lock_status, "LOCKED_WITH_LIMITATIONS");
  assert.equal(calls.saved.length, 1);
  assert.equal(calls.saved[0].lock_status, "LOCKED_WITH_LIMITATIONS");
  assert.equal(calls.saved[0].artifact.target_identity.legal_entity_name, "FIELD_NOT_PUBLIC");
}

async function smokeForbiddenRuntimeArtifactFails() {
  const calls = makeRuntimeCalls({ providerOutput: validTargetProfileOutput({}), extraRuntimeArtifact: { legal_cartography_index: {} } });
  await expectFailure(() => runTargetProfileReviewPhase({
    run: { run_id: "TPR-RUNTIME-SMOKE-FORBIDDEN" },
    internalJobId: "M7_TARGET_PROFILE",
    contract,
    ...calls.callbacks
  }), "TARGET_PROFILE_REVIEW_FORBIDDEN_RUNTIME_ARTIFACT:legal_cartography_index");
  assert.equal(calls.saved.length, 0);
}

async function smokeInvalidProviderOutputFails() {
  const calls = makeRuntimeCalls({ providerOutput: { target_profile: { ...validTargetProfileOutput({}).target_profile, legal_signal_derivation_profile: {} } } });
  await expectFailure(() => runTargetProfileReviewPhase({
    run: { run_id: "TPR-RUNTIME-SMOKE-BAD-OUTPUT" },
    internalJobId: "M7_TARGET_PROFILE",
    contract,
    ...calls.callbacks
  }), "legal_signal_derivation_profile");
  assert.equal(calls.saved.length, 0);
}

function makeRuntimeCalls({ providerOutput, extraRuntimeArtifact = {} } = {}) {
  const readArgs = [];
  const promptArgs = [];
  const providerArgs = [];
  const saved = [];
  return {
    readArgs,
    promptArgs,
    providerArgs,
    saved,
    callbacks: {
      readArtifacts: async ({ reads, agent_id }) => {
        readArgs.push({ reads, agent_id });
        return { ...buildAllowedRuntimeArtifacts(reads), ...extraRuntimeArtifact };
      },
      buildPrompt: async (args) => {
        promptArgs.push(args);
        return "TARGET PROFILE REVIEW RUNTIME SMOKE PROMPT";
      },
      callProvider: async (args) => {
        providerArgs.push(args);
        return { json: providerOutput, metadata: { provider: "mock", smoke: true } };
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
  if (name === "source_discovery_handoff") return { run_id: "TPR-RUNTIME-SMOKE", target_url: "https://example.test", status: "LOCKED" };
  if (name === "legal_signal_derivation_profile") return { artifact_name: "legal_signal_derivation_profile", field_derivations: [
    { field_id: "TP.JUR.003", derivation_status: "DERIVED", value: "India" },
    { field_id: "TP.JUR.005", derivation_status: "DERIVED", value: "Bengaluru courts" }
  ] };
  return { artifact_name: name, root_family: name.replace(/^lossless_family__/, ""), sources: [{ source_id: `${name}.1`, lossless_text: "Brand: Example AI\nLegal entity: Example AI Private Limited\nEntity type: Company\nBusiness category: AI software product" }] };
}

function validTargetProfileOutput({ legalEntityName = "Example AI Private Limited", governingLaw = "India", courtsVenue = "Bengaluru courts", limitations = [] } = {}) {
  return {
    target_profile: {
      target_identity: {
        brand_name: "Example AI",
        legal_entity_name: legalEntityName,
        entity_type: "Company",
        reviewed_website: "https://example.test",
        primary_domain: "example.test"
      },
      jurisdiction_notice: {
        registered_notice_location: "FIELD_LIMITED",
        governing_law: governingLaw,
        courts_venue: courtsVenue
      },
      business_context: {
        business_category: "AI software product",
        primary_customer_type: "Businesses",
        market_type_candidate: "B2B SaaS",
        industry_sector: "AI software",
        regulated_sector_hints: []
      },
      product_service_wrapper: {
        high_level_offering: "AI assistant platform",
        primary_public_claim: "Helps teams draft and review content",
        product_service_wrapper_names: ["Example AI"],
        delivery_model_signals: ["Web application"]
      },
      target_profile_limitations: limitations.length ? limitations : ["Registered notice location requires qualified review confirmation."]
    }
  };
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
