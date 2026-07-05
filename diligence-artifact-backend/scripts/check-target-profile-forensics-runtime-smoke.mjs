import assert from "node:assert/strict";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
import { runTargetProfileForensicsPhase, TARGET_PROFILE_FORENSICS_CONTRACT } from "../src/phases/04-target-profile-forensics/index.js";

const contract = getPipelineContract("M7_TARGET_PROFILE_FORENSICS");

await smokeForensicRunnerLockedOrLimited();
await smokeForbiddenRuntimeArtifactFails();
await smokeContractMismatchFails();

console.log("Target Profile Forensics runtime smoke: PASS");

async function smokeForensicRunnerLockedOrLimited() {
  const calls = makeRuntimeCalls();
  const result = await runTargetProfileForensicsPhase({
    run: { run_id: "TPF-RUNTIME-SMOKE" },
    internalJobId: "M7_TARGET_PROFILE_FORENSICS",
    contract,
    ...calls.callbacks
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.saved_artifacts, ["target_profile_forensics"]);
  assert.equal(["LOCKED", "LOCKED_WITH_LIMITATIONS", "REPAIR_REQUIRED"].includes(result.phase_lock_status), true);
  assert.equal(result.model_usage, "NONE_DETERMINISTIC");
  assert.equal(result.target_profile_forensics_phase_runner_used, true);
  assert.equal(result.source_helper, "buildM7DeterministicTargetForensics");
  assert.deepEqual(calls.readArgs[0].reads, contract.reads);
  assert.equal(calls.saved.length, 1);
  assert.equal(calls.saved[0].artifact_name, "target_profile_forensics");

  const artifact = calls.saved[0].artifact;
  assert.equal(artifact.forensic_contract.model_generated_forensics_allowed, false);
  assert.equal(artifact.forensic_boundary.material_profile_re_emitted, false);
  assert.equal(artifact.forensic_boundary.semantic_forensic_profile_retired, true);
  assert.equal(Array.isArray(artifact.material_profile_trace_index), true);
  assert.equal(Array.isArray(artifact.field_trace_index), true);
  assert.equal(Array.isArray(artifact.source_custody_trace_index), true);
  assert.equal(Array.isArray(artifact.limitation_ledger), true);
  assert.equal(artifact.runtime_trace_m7_only.phase, "M7_TARGET_PROFILE_FORENSICS");
}

async function smokeForbiddenRuntimeArtifactFails() {
  const calls = makeRuntimeCalls({ extraRuntimeArtifact: { legal_cartography_index: {} } });
  await expectFailure(() => runTargetProfileForensicsPhase({
    run: { run_id: "TPF-RUNTIME-SMOKE-FORBIDDEN" },
    internalJobId: "M7_TARGET_PROFILE_FORENSICS",
    contract,
    ...calls.callbacks
  }), "TARGET_PROFILE_FORENSICS_FORBIDDEN_RUNTIME_ARTIFACT:legal_cartography_index");
  assert.equal(calls.saved.length, 0);
}

async function smokeContractMismatchFails() {
  const calls = makeRuntimeCalls();
  await expectFailure(() => runTargetProfileForensicsPhase({
    run: { run_id: "TPF-RUNTIME-SMOKE-MISMATCH" },
    internalJobId: "M7_TARGET_PROFILE_FORENSICS",
    contract: { ...contract, reads: contract.reads.filter((name) => name !== "target_profile") },
    ...calls.callbacks
  }), "TARGET_PROFILE_FORENSICS_READS_MISMATCH");
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
  if (name === "source_discovery_handoff") return { run_id: "TPF-RUNTIME-SMOKE", target_url: "https://example.test", status: "LOCKED" };
  if (name === "legal_signal_derivation_profile") return { artifact_name: "legal_signal_derivation_profile", field_derivations: [{ field_id: "TP.JUR.003", derivation_status: "DERIVED", value: "India" }] };
  if (name === "target_profile") return { target_profile: validTargetProfile() };
  return { artifact_name: name, root_family: name.replace(/^lossless_family__/, ""), storage_mode: "SINGLE", sources: [{ source_id: `${name}.1`, lossless_text: "Brand: Example AI\nLegal entity: Example AI Private Limited\nEntity type: Company" }] };
}

function validTargetProfile() {
  return {
    target_identity: {
      brand_name: "Example AI",
      legal_entity_name: "Example AI Private Limited",
      entity_type: "Company",
      reviewed_website: "https://example.test",
      primary_domain: "example.test"
    },
    jurisdiction_notice: {
      registered_notice_location: "FIELD_LIMITED",
      governing_law: "India",
      courts_venue: "Bengaluru courts"
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
    target_profile_limitations: ["Registered notice location requires qualified review confirmation."]
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
