import assert from "node:assert/strict";
import { ACTIVITY_PROFILE_REVIEW_CONTRACT, runActivityProfileReviewPhase, activityProfileReviewPromptFiles, activityProfileReviewReadArtifacts, activityProfileReviewReferenceFiles, activityProfileReviewWriteArtifacts } from "../src/phases/05-activity-profile-review/index.js";

const contract = buildPhaseOwnedRuntimeContract();

await smokeLockedMaterialOutput();
await smokeLockedWithLimitationsOutput();
await smokeForbiddenRuntimeArtifactFails();
await smokeMissingInventoryFails();
await smokeInvalidProviderOutputFails();
await smokeContractReadMismatchFails();

console.log("Activity Profile Review runtime smoke: PASS");

async function smokeLockedMaterialOutput() {
  const calls = makeRuntimeCalls({ providerOutput: validMaterialOutput() });
  const result = await runActivityProfileReviewPhase({
    run: { run_id: "APR-RUNTIME-SMOKE" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE",
    contract,
    ...calls.callbacks
  });

  assert.equal(result.ok, true);
  assert.equal(result.phase_lock_status, "LOCKED");
  assert.deepEqual(result.saved_artifacts, ["target_feature_profile"]);
  assert.equal(result.model_usage, "MODEL_JSON_ONLY");
  assert.equal(result.activity_profile_review_phase_runner_used, true);
  assert.equal(result.validator, "validateM8TargetFeatureOutput");
  assert.equal(result.validator_phase, "M8_TARGET_FEATURE_PROFILE");
  assert.deepEqual(calls.readArgs[0].reads, contract.reads);
  assert.deepEqual(calls.promptArgs[0].prompt_files, contract.prompt_files);
  assert.deepEqual(calls.promptArgs[0].references, contract.references);
  assert.deepEqual(calls.promptArgs[0].writes, contract.writes);
  assert.equal(calls.providerArgs[0].phase, "ACTIVITY_PROFILE_REVIEW");
  assert.equal(calls.saved.length, 1);
  assert.equal(calls.saved[0].artifact_name, "target_feature_profile");
  assert.equal(calls.saved[0].lock_status, "LOCKED");

  const saved = calls.saved[0].artifact;
  assert.deepEqual(Object.keys(saved).sort(), ["activities", "commercial_availability_posture", "profile_level_limitations"].sort());
  assert.equal(saved.activities[0].activity_reference, "ACT.001");
  assert.deepEqual(saved.activities[0].archetype_codes, ["TRN"]);
  assert.deepEqual(saved.activities[0].surface_context_tokens, ["Content&IP"]);
  assert.equal(savedContainsForbiddenMaterialKey(saved), false);
}

async function smokeLockedWithLimitationsOutput() {
  const output = validMaterialOutput();
  output.target_feature_profile.profile_level_limitations = ["Evidence was thin for one candidate and requires reviewer confirmation."];
  const calls = makeRuntimeCalls({ providerOutput: output });
  const result = await runActivityProfileReviewPhase({
    run: { run_id: "APR-RUNTIME-SMOKE-LIMITED" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE",
    contract,
    ...calls.callbacks
  });
  assert.equal(result.phase_lock_status, "LOCKED_WITH_LIMITATIONS");
  assert.equal(calls.saved[0].lock_status, "LOCKED_WITH_LIMITATIONS");
}

async function smokeForbiddenRuntimeArtifactFails() {
  const calls = makeRuntimeCalls({
    providerOutput: validMaterialOutput(),
    extraRuntimeArtifact: { legal_cartography_index: { artifact_name: "legal_cartography_index" } }
  });
  await expectFailure(() => runActivityProfileReviewPhase({
    run: { run_id: "APR-RUNTIME-SMOKE-FORBIDDEN" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE",
    contract,
    ...calls.callbacks
  }), "ACTIVITY_PROFILE_REVIEW_FORBIDDEN_RUNTIME_ARTIFACT:legal_cartography_index");
  assert.equal(calls.saved.length, 0);
  assert.equal(calls.providerArgs.length, 0);
}

async function smokeMissingInventoryFails() {
  const calls = makeRuntimeCalls({ providerOutput: validMaterialOutput(), omitInventory: true });
  await expectFailure(() => runActivityProfileReviewPhase({
    run: { run_id: "APR-RUNTIME-SMOKE-MISSING-INVENTORY" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE",
    contract,
    ...calls.callbacks
  }), "ACTIVITY_PROFILE_REVIEW_MISSING_FEATURE_CANDIDATE_INVENTORY");
  assert.equal(calls.saved.length, 0);
  assert.equal(calls.providerArgs.length, 0);
}

async function smokeInvalidProviderOutputFails() {
  const calls = makeRuntimeCalls({ providerOutput: invalidMaterialOutputWithForensics() });
  await expectFailure(() => runActivityProfileReviewPhase({
    run: { run_id: "APR-RUNTIME-SMOKE-INVALID" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE",
    contract,
    ...calls.callbacks
  }), "M8_TARGET_FEATURE_PROFILE_VALIDATION_FAILED");
  assert.equal(calls.saved.length, 0);
}

async function smokeContractReadMismatchFails() {
  const calls = makeRuntimeCalls({ providerOutput: validMaterialOutput() });
  await expectFailure(() => runActivityProfileReviewPhase({
    run: { run_id: "APR-RUNTIME-SMOKE-READ-MISMATCH" },
    internalJobId: "M8_TARGET_FEATURE_PROFILE",
    contract: { ...contract, reads: [...contract.reads, "legal_cartography_index"] },
    ...calls.callbacks
  }), "ACTIVITY_PROFILE_REVIEW_READS_MISMATCH");
  assert.equal(calls.saved.length, 0);
  assert.equal(calls.providerArgs.length, 0);
}

function makeRuntimeCalls({ providerOutput, extraRuntimeArtifact = {}, omitInventory = false } = {}) {
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
        return { ...buildAllowedRuntimeArtifacts(reads, { omitInventory }), ...extraRuntimeArtifact };
      },
      buildPrompt: async (args) => {
        promptArgs.push(args);
        return { prompt_id: "APR_RUNTIME_SMOKE_PROMPT", args };
      },
      callProvider: async (args) => {
        providerArgs.push(args);
        return { json: providerOutput, metadata: { model: "mock-json-provider" } };
      },
      saveArtifact: async (args) => {
        saved.push(args);
      }
    }
  };
}

function buildAllowedRuntimeArtifacts(reads, { omitInventory = false } = {}) {
  const artifacts = {};
  for (const name of reads) {
    if (omitInventory && name === "feature_candidate_inventory") continue;
    artifacts[name] = buildArtifact(name);
  }
  return artifacts;
}

function buildArtifact(name) {
  if (name === "source_discovery_handoff") return { artifact_name: name, run_id: "APR-RUNTIME-SMOKE", status: "LOCKED" };
  if (name === "target_profile") return { artifact_name: name, target_identity: { brand_name: "Example AI" }, profile_level_limitations: [] };
  if (name === "target_profile_forensics") return { artifact_name: name, forensic_lock_gate_result: { status: "PASS" } };
  if (name === "feature_candidate_inventory") return {
    artifact_type: "feature_candidate_inventory",
    inventory_version: "m8_feature_candidate_inventory_index_v1",
    candidates: [
      {
        candidate_id: "FCI-001",
        canonical_feature_key: "api::speech-to-text::standalone-api",
        candidate_name: "Speech-to-text API",
        candidate_type: "STANDALONE_API",
        candidate_status: "CANONICAL",
        wrapper_or_surface: "Example API",
        capability_key: "speech-to-text",
        surface_key: "standalone-api",
        mandatory_profile_treatment: true,
        merged_raw_hit_ids: ["RAW-001"],
        source_pointers: [{ lossless_artifact_name: "lossless_family__P3_AI_CAPABILITY_TECHNICAL", source_family: "P3_AI_CAPABILITY_TECHNICAL", source_id: "P3.001", source_url: "https://example.test/apis/speech-to-text", route_type: "api_docs_or_api_family_root", locator_type: "url", locator_value: "https://example.test/apis/speech-to-text" }]
      }
    ]
  };
  if (name === "lossless_family__P1_PRODUCT") return family("P1_PRODUCT", [source("P1.001", "https://example.test/products/assistant", "product_slug")]);
  if (name === "lossless_family__P2_PLATFORM_FEATURE_SOLUTION") return family("P2_PLATFORM_FEATURE_SOLUTION", [source("P2.001", "https://example.test/features/workflows", "feature_route")]);
  if (name === "lossless_family__P3_AI_CAPABILITY_TECHNICAL") return family("P3_AI_CAPABILITY_TECHNICAL", [source("P3.001", "https://example.test/apis/speech-to-text", "api_docs_or_api_family_root")]);
  if (name === "lossless_family__P4_USE_CASE_INDUSTRY") return family("P4_USE_CASE_INDUSTRY", [source("P4.001", "https://example.test/use-cases/contact-center", "use_case")]);
  if (name === "lossless_family__P5_ENTERPRISE_PRICING") return family("P5_ENTERPRISE_PRICING", [source("P5.001", "https://example.test/pricing", "pricing_or_plans")]);
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
    type: "model",
    central_phase_id: ACTIVITY_PROFILE_REVIEW_CONTRACT.central_phase_id,
    public_label: ACTIVITY_PROFILE_REVIEW_CONTRACT.public_label,
    agent_id: "agent_3_target_feature",
    reads: activityProfileReviewReadArtifacts(),
    writes: activityProfileReviewWriteArtifacts(),
    prompt_files: activityProfileReviewPromptFiles(),
    references: activityProfileReviewReferenceFiles(),
    next: "M8_TARGET_FEATURE_PROFILE_FORENSICS"
  };
}

function validMaterialOutput() {
  return {
    target_feature_profile: {
      activities: [
        {
          activity_reference: "ACT.001",
          product_service_wrapper: "Example API",
          activity_feature_name: "Speech-to-text API",
          activity_candidate_summary: "Converts spoken audio into text for customer-facing developer use.",
          mechanics_proof: "Reviewed product/API material describes speech recognition capability for submitted audio.",
          autonomy_human_control_signal: "Automated API-mediated processing with customer invocation.",
          data_content_object_touched: "Speech/audio and generated text.",
          external_internal_action_signal: "Developer-facing and customer-facing API activity.",
          archetype_codes: ["TRN"],
          archetype_proof: "The activity transforms audio input into text output.",
          surface_context_tokens: ["Content&IP"],
          surface_proof_and_routing_limits: "Audio and generated transcript content are visible from reviewed product/API material."
        }
      ],
      commercial_availability_posture: {
        posture: "Paid production / enterprise availability visible from reviewed public material.",
        free_trial_freemium_signal: "No visible free/freemium signal in the reviewed material.",
        beta_pilot_early_access_signal: "No visible beta/pilot signal in the reviewed material.",
        paid_production_enterprise_plan_signal: "Public material references paid API or enterprise commercial access.",
        evidence_basis: ["Pricing or product material referenced paid API or enterprise access."],
        limitation: "No material commercial availability limitation identified from reviewed public material."
      },
      profile_level_limitations: []
    }
  };
}

function invalidMaterialOutputWithForensics() {
  const output = validMaterialOutput();
  output.target_feature_profile.runtime_trace = [];
  return output;
}

function savedContainsForbiddenMaterialKey(value) {
  if (!value || typeof value !== "object") return false;
  if (Array.isArray(value)) return value.some(savedContainsForbiddenMaterialKey);
  return Object.keys(value).some((key) => ["feature_candidate_inventory", "target_feature_profile_forensics", "candidate_id", "source_pointers", "source_urls", "source_ids", "runtime_trace", "forensic_contract", "forensic_boundary"].includes(key)) || Object.values(value).some(savedContainsForbiddenMaterialKey);
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
