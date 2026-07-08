import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PIPELINE_CONTRACTS, INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASES } from "../src/runtime/contracts/central-phase.contract.js";
import { ARTIFACT_NAMES, ARCHIVED_LEGACY_ARTIFACT_NAMES, DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, INTERNAL_JOB_WRITE_PERMISSIONS, LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES, PHASE7_DAP_BATCH_ARTIFACT_NAMES, PHASE7_DAP_LAYER4_ARTIFACT_NAMES, PHASE7_DAP_LAYER5_ARTIFACT_NAMES, PHASE8_DAP_FORENSICS_ARTIFACT_NAMES, READ_PERMISSIONS, WRITE_PERMISSIONS, artifactMatchesPermission } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT } from "../src/phases/07-data-provenance-profile/data-provenance-profile.contract.js";

const root = process.cwd();
const phase1To8Jobs = Object.freeze(["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX", "M9", "M7_TARGET_PROFILE", "M7_TARGET_PROFILE_FORENSICS", "M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS", "DATA_PROVENANCE_PROFILE_LAYER4", "DATA_PROVENANCE_PROFILE_LAYER5", "DATA_PROVENANCE_PROFILE_FORENSICS"]);
const expectedJobChain = Object.freeze([...phase1To8Jobs, "M11"]);
const expectedValidationNames = Object.freeze(Array.from({ length: 17 }, (_, index) => `dap_semantic_batch_validation__DAP-SEM-BATCH-${String(index + 1).padStart(2, "0")}`));
const expectedPhase7PromptFiles = Object.freeze(["agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml", "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md"]);
const expectedPhase7RepairPromptFiles = Object.freeze([...expectedPhase7PromptFiles, "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_REPAIR.md"]);
const legacyActiveArtifacts = Object.freeze(["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "m10_selected_legal_support_packet", "m7_deterministic_legal_signal_overlay"]);
const forbiddenPhase1To8RootImports = Object.freeze(["../../m7-validator.js", "../../m8-validator.js", "../../m8-feature-candidate-inventory-index.js", "../../m8-feature-candidate-inventory.js", "../../m8-feature-candidate-index-boundary.js", "../../m9-validator.js", "../../m9-normalizer.js", "../../m9-hybrid-orchestrator.js", "../../m9-deterministic-map.js", "../../m9-semantic-profile-validator.js", "../../m9-hybrid-compiler.js", "../../m9-hybrid-compiler-v2.js", "../../deterministic-profile-forensics.js"]);
const allowedPostPhase8RootImports = Object.freeze(["../../m11-orchestrator.js", "../../m12-deterministic-challenge.js", "../../compiler.js", "../../report-renderer.js"]);

const files = await loadFilesForStaticChecks();
checkNoPhase1To8RootImports(files);
checkPostPhase8BridgeBoundary(files);
checkPhase1To8PipelineChain();
checkPhase1To8DispatchText(files);
checkPhase7ContractSync();
checkPhase7AgentPackagePromptSync(files);
checkActiveLegacyRemoval(files);
checkArtifactPermissionSync();
checkArtifactGateSync(files);
checkBlockingIsExceptionPolicy(files);

console.log(JSON.stringify({
  check: "phase1-8 central runtime",
  status: "PASS",
  enforced_gates: [
    "NO_PHASE1_8_ROOT_IMPORTS",
    "POST_PHASE8_ROOT_BRIDGES_EXPLICIT_ONLY",
    "NO_M10_4B_4C_ACTIVE_CHAIN",
    "PHASE7_READ_CONTRACT_SYNC",
    "PHASE7_LAYER5_VALIDATION_READ_SYNC",
    "PHASE7_AGENT_PACKAGE_PROMPT_WIRING_SYNC",
    "PHASE1_8_DISPATCH_CONTRACT_ARTIFACT_SYNC",
    "PHASE7_DATA_PROVENANCE_PERMISSION_BOUNDARY",
    "BLOCKING_IS_EXCEPTION_LIMITATION_POLICY"
  ]
}, null, 2));

async function loadFilesForStaticChecks() {
  const paths = [
    "src/runtime/services/pipeline.service.js",
    "src/runtime/services/artifacts.service.js",
    "src/runtime/contracts/pipeline.contract.js",
    "src/runtime/contracts/central-phase.contract.js",
    "src/runtime/contracts/artifact-permissions.contract.js",
    "src/phases/01-source-discovery/source-discovery.runner.js",
    "src/phases/02-legal-cartography-index/legal-cartography-index.runner.js",
    "src/phases/02-legal-cartography-index/validators/legal-cartography-index.validator.js",
    "src/phases/07-data-provenance-profile/data-provenance-profile.contract.js",
    ...(await listFiles("src/phases", ".js"))
  ];
  const unique = [...new Set(paths.map(normalizeRepoPath))].sort();
  return Object.fromEntries(await Promise.all(unique.map(async (relativePath) => [relativePath, await readFile(resolveRepoPath(relativePath), "utf8")])));
}

async function listFiles(directory, extension) {
  const normalizedDirectory = normalizeRepoPath(directory);
  const entries = await readdir(resolveRepoPath(normalizedDirectory), { withFileTypes: true });
  const out = [];
  for (const entry of entries) {
    const relativePath = `${normalizedDirectory}/${entry.name}`;
    if (entry.isDirectory()) out.push(...(await listFiles(relativePath, extension)));
    else if (entry.isFile() && entry.name.endsWith(extension)) out.push(relativePath);
  }
  return out.map(normalizeRepoPath).sort();
}

function resolveRepoPath(relativePath) {
  return path.join(root, ...normalizeRepoPath(relativePath).split("/"));
}

function normalizeRepoPath(relativePath) {
  return String(relativePath || "").replaceAll("\\", "/");
}

function checkNoPhase1To8RootImports(files) {
  const scanned = Object.entries(files).filter(([file]) => file.startsWith("src/runtime/services/") || file.startsWith("src/phases/"));
  for (const [file, text] of scanned) for (const importPath of forbiddenPhase1To8RootImports) assert.ok(!text.includes(importPath), `${file} must not import Phase 1-8 root bridge ${importPath}`);
}

function checkPostPhase8BridgeBoundary(files) {
  const pipeline = files["src/runtime/services/pipeline.service.js"];
  for (const importPath of allowedPostPhase8RootImports) assert.ok(pipeline.includes(importPath), `pipeline.service.js must explicitly retain post-Phase-8 bridge ${importPath}`);
  const unexpectedRootImportRegex = /from "\.\.\/\.\.\/(?!m11-orchestrator\.js|m12-deterministic-challenge\.js|compiler\.js|report-renderer\.js|phases\/|runtime\/)[^"]+"/g;
  assert.equal([...pipeline.matchAll(unexpectedRootImportRegex)].length, 0, "pipeline.service.js has unexpected root import outside allowed post-Phase-8 bridges");
}

function checkPhase1To8PipelineChain() {
  assert.deepEqual(INTERNAL_PIPELINE_JOB_IDS.slice(0, expectedJobChain.length), expectedJobChain, "Phase 1-8 internal pipeline chain must lead into M11 exactly once");
  for (const jobId of phase1To8Jobs) assert.ok(PIPELINE_CONTRACTS[jobId], `missing pipeline contract for ${jobId}`);
  for (const jobId of phase1To8Jobs.slice(0, -1)) assert.equal(PIPELINE_CONTRACTS[jobId].next, expectedJobChain[expectedJobChain.indexOf(jobId) + 1], `${jobId} next mismatch`);
  assert.equal(PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_FORENSICS.next, "M11", "Phase 8 must hand off to M11");
  const centralJobs = CENTRAL_PHASES.filter((phase) => phase.sequence <= 8).flatMap((phase) => [...phase.internal_jobs]);
  assert.deepEqual(centralJobs, phase1To8Jobs, "Central phase contract jobs 1-8 must match pipeline chain");
}

function checkPhase1To8DispatchText(files) {
  const pipeline = files["src/runtime/services/pipeline.service.js"];
  const requiredDispatchMarkers = [
    "runSourceUrlManifestJob",
    "runSourceExtractionJob",
    "runSourceDiscoveryHandoffJob",
    "runLegalCartographyIndexJob",
    "runTargetProfileReviewRuntimeJob",
    "runTargetProfileForensicsRuntimeJob",
    "runActivityCandidateInventoryRuntimeJob",
    "runActivityProfileReviewRuntimeJob",
    "runActivityProfileForensicsRuntimeJob",
    "runDataProvenanceProfileRuntimeJob",
    "runDapForensicsRuntimeJob"
  ];
  for (const marker of requiredDispatchMarkers) assert.ok(pipeline.includes(marker), `pipeline.service.js missing dispatch marker ${marker}`);
}

function checkPhase7ContractSync() {
  const layer4Reads = PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4.reads;
  const approvedInputs = [...PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.approved_input_universe];
  assert.deepEqual(layer4Reads, approvedInputs, "Phase 7 Layer 4 reads must exactly match Phase 7 approved input universe");
  for (const legalFamily of LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES) assert.ok(!layer4Reads.includes(legalFamily), `Phase 7 Layer 4 must not free-read ${legalFamily}`);
  for (const dataFamily of DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES) assert.ok(layer4Reads.includes(dataFamily), `Phase 7 Layer 4 must read ${dataFamily}`);
  assert.ok(layer4Reads.includes("legal_cartography_index"), "Phase 7 Layer 4 must read legal_cartography_index as selective locator");
  assert.ok(layer4Reads.includes("legal_signal_derivation_profile"), "Phase 7 Layer 4 must read legal_signal_derivation_profile as selected legal support");
  const layer5Reads = PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER5.reads;
  assert.deepEqual(layer5Reads, ["dap_semantic_batch_route_manifest", ...PHASE7_DAP_BATCH_ARTIFACT_NAMES, ...expectedValidationNames], "Phase 7 Layer 5 reads must explicitly include route, 17 batches, and 17 validations");
  assert.equal(new Set(layer5Reads.filter((name) => name.startsWith("dap_semantic_batch_validation__"))).size, 17, "Phase 7 Layer 5 must declare exactly 17 validation reads");
}

function checkPhase7AgentPackagePromptSync(files) {
  const layer4 = PIPELINE_CONTRACTS.DATA_PROVENANCE_PROFILE_LAYER4;
  assert.deepEqual(layer4.prompt_files, expectedPhase7PromptFiles, "Phase 7 Layer 4 prompt files must be contract-owned and exact");
  assert.deepEqual(layer4.repair_prompt_files, expectedPhase7RepairPromptFiles, "Phase 7 Layer 4 repair prompt files must be contract-owned and exact");
  const runner = files["src/phases/07-data-provenance-profile/data-provenance-profile.runner.js"];
  assert.ok(typeof runner === "string", "Phase 7 runner must be loaded for prompt wiring validation");
  assert.ok(runner.includes("contract.prompt_files"), "Phase 7 runner must consume contract.prompt_files");
  assert.ok(runner.includes("contract.repair_prompt_files"), "Phase 7 runner must consume contract.repair_prompt_files");
  for (const promptFile of expectedPhase7RepairPromptFiles) assert.ok(!runner.includes(promptFile), `Phase 7 runner must not hardcode prompt file ${promptFile}`);
}

function checkActiveLegacyRemoval(files) {
  for (const legacy of legacyActiveArtifacts) assert.ok(!ARTIFACT_NAMES.includes(legacy), `${legacy} must not be in active ARTIFACT_NAMES`);
  for (const legacy of legacyActiveArtifacts) assert.ok(ARCHIVED_LEGACY_ARTIFACT_NAMES.includes(legacy), `${legacy} must remain archived, not active`);
  for (const [jobId, contract] of Object.entries(PIPELINE_CONTRACTS)) {
    for (const field of ["reads", "writes", "optional_writes", "dynamic_writes"]) for (const artifactName of contract[field] || []) assert.ok(!legacyActiveArtifacts.includes(artifactName), `${jobId}.${field} contains active legacy artifact ${artifactName}`);
  }
  const activeContractText = [files["src/runtime/contracts/pipeline.contract.js"], files["src/runtime/contracts/central-phase.contract.js"], files["src/runtime/services/artifacts.service.js"]].join("\n");
  for (const legacy of ["AGENT_4B_EXTENDED_DAP_INDIA_READINESS", "AGENT_4C_INTEGRATED_DAP_REPORT", "M10_FORENSICS", "M10_SELECTED_LEGAL_SUPPORT"]) assert.ok(!activeContractText.includes(legacy), `active runtime text contains retired job/token ${legacy}`);
}

function checkArtifactPermissionSync() {
  for (const jobId of phase1To8Jobs) {
    const contract = PIPELINE_CONTRACTS[jobId];
    const allowedWrites = INTERNAL_JOB_WRITE_PERMISSIONS[jobId] || [];
    for (const artifactName of contract.writes || []) assert.ok(allowedWrites.some((permission) => artifactMatchesPermission(artifactName, permission)), `${jobId} write ${artifactName} missing internal permission`);
    for (const artifactName of contract.dynamic_writes || []) assert.ok(allowedWrites.some((permission) => artifactMatchesPermission(artifactName.replace("{BATCH_ID}", "DAP-SEM-BATCH-01"), permission) || permission === artifactName), `${jobId} dynamic write ${artifactName} missing internal permission`);
  }
  for (const [agentId, permissions] of Object.entries(WRITE_PERMISSIONS)) if (agentId !== "operator") for (const legacy of legacyActiveArtifacts) assert.ok(!permissions.includes(legacy), `${agentId} write permissions include active legacy artifact ${legacy}`);
  for (const [agentId, permissions] of Object.entries(READ_PERMISSIONS)) if (agentId !== "operator") for (const legacy of legacyActiveArtifacts) assert.ok(!permissions.includes(legacy), `${agentId} read permissions include active legacy artifact ${legacy}`);

  const dataProvenancePermissions = READ_PERMISSIONS.agent_4_data_privacy || [];
  for (const legalFamily of LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES) assert.ok(!dataProvenancePermissions.includes(legalFamily), `agent_4_data_privacy must not have full legal-family read permission ${legalFamily}`);
  for (const dataFamily of DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES) assert.ok(dataProvenancePermissions.includes(dataFamily), `agent_4_data_privacy must keep D-family read permission ${dataFamily}`);
  assert.ok(dataProvenancePermissions.includes("legal_cartography_index"), "agent_4_data_privacy must keep legal_cartography_index locator permission");
  assert.ok(dataProvenancePermissions.includes("legal_signal_derivation_profile"), "agent_4_data_privacy must keep legal_signal_derivation_profile support permission");
}

function checkArtifactGateSync(files) {
  const artifactService = files["src/runtime/services/artifacts.service.js"];
  const requiredGateMarkers = [
    "dap_registry_requires_accepted_activity_forensics",
    "dap_route_requires_accepted_navigation_index",
    "dap_batch_requires_paired_validation",
    "dap_validation_manifest_requires_all_batches_and_validations",
    "dap_gate_requires_accepted_validation_manifest",
    "dap_forensics_requires_semantic_batch_gate",
    "exposure_route_plan_requires_accepted_dap_forensics"
  ];
  for (const marker of requiredGateMarkers) assert.ok(artifactService.includes(marker), `artifacts.service.js missing gate marker ${marker}`);
  for (const legacy of ["extended_dap_india_readiness_profile", "integrated_dap_report", "data_provenance_profile_forensics"]) assert.ok(!artifactService.includes(`ART.${legacy}`), `artifacts.service.js must not gate on ${legacy}`);
}

function checkBlockingIsExceptionPolicy(files) {
  assert.equal(PIPELINE_CONTRACT_STATUS.blocking_is_exception_noncritical_limitations_pass, true, "pipeline contract must record limitation-pass policy");
  assert.equal(PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT.blocking_is_exception_noncritical_limitations_pass, true, "Phase 7 contract must record limitation-pass policy");
  assert.ok(files["src/phases/01-source-discovery/source-discovery.runner.js"].includes("blocking_is_exception_noncritical_limitations_pass: true"), "Source Discovery runner must record limitation-pass policy");
  const m9Validator = files["src/phases/02-legal-cartography-index/validators/legal-cartography-index.validator.js"];
  assert.ok(m9Validator.includes("LOCKED_WITH_LIMITATIONS"), "M9 validator must support non-blocking limitation status");
  assert.ok(m9Validator.includes("throw error"), "M9 validator must still throw for structural failures");
}
