import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { PIPELINE_CONTRACTS, INTERNAL_PIPELINE_JOB_IDS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASES } from "../src/runtime/contracts/central-phase.contract.js";
import { ARTIFACT_NAMES, ARCHIVED_LEGACY_ARTIFACT_NAMES, DATA_PROVENANCE_FAMILY_ARTIFACT_NAMES, INTERNAL_JOB_WRITE_PERMISSIONS, LEGAL_GOVERNANCE_FAMILY_ARTIFACT_NAMES, PHASE7_DAP_BATCH_ARTIFACT_NAMES, PHASE7_DAP_LAYER4_ARTIFACT_NAMES, PHASE7_DAP_LAYER5_ARTIFACT_NAMES, PHASE8_DAP_FORENSICS_ARTIFACT_NAMES, READ_PERMISSIONS, WRITE_PERMISSIONS, artifactMatchesPermission } from "../src/runtime/contracts/artifact-permissions.contract.js";
import { PHASE7_DATA_PRIVACY_ARCHITECTURE_CONTRACT } from "../src/phases/07-data-provenance-profile/data-provenance-profile.contract.js";
import { ACTIVITY_PROFILE_REVIEW_CONTRACT } from "../src/phases/05-activity-profile-review/activity-profile-review.contract.js";

const root = process.cwd();
const phase1To8Jobs = Object.freeze(["AGENT_1A_URL_MANIFEST", "AGENT_1B_EXTRACT", "M6_BUCKET_INDEX", "M9", "M7_TARGET_PROFILE", "M7_TARGET_PROFILE_FORENSICS", "M8_FEATURE_CANDIDATE_INVENTORY", "M8_TARGET_FEATURE_PROFILE", "M8_TARGET_FEATURE_PROFILE_FORENSICS", "DATA_PROVENANCE_PROFILE_LAYER4", "DATA_PROVENANCE_PROFILE_LAYER5", "DATA_PROVENANCE_PROFILE_FORENSICS"]);
const expectedJobChain = Object.freeze([...phase1To8Jobs, "M11"]);
const expectedValidationNames = Object.freeze(Array.from({ length: 17 }, (_, index) => `dap_semantic_batch_validation__DAP-SEM-BATCH-${String(index + 1).padStart(2, "0")}`));
const expectedPhase7PromptFiles = Object.freeze(["agent-packages/agent_4_data_privacy/AGENT4_PHASE7_LAYER4_RUNTIME_BINDING_PACKET.yaml", "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_RUNNER.md"]);
const expectedPhase7RepairPromptFiles = Object.freeze([...expectedPhase7PromptFiles, "agent-packages/agent_4_data_privacy/PHASE7_LAYER4_DAP_SEMANTIC_BATCH_REPAIR.md"]);
const expectedActivityProfileReferences = Object.freeze(["AI_REGISTRY_KEY.md", "FIELD_DERIVATION_REGISTRY_v2_LOCKED.yaml", "FORENSIC_ANNEXURE_REGISTRY_v1_LOCKED.yaml"]);
const expectedActivityProfileArchetypes = Object.freeze(["UNI", "DOE", "JDG", "CMP", "CRT", "RDR", "ORC", "TRN", "SHD", "OPT", "MOV", "CUR", "MOD", "ORA"]);
const expectedActivityProfileSurfaces = Object.freeze(["Consumer-Public", "Enterprise-Private", "PII", "Employment", "Sensitive/Biometric", "Financial", "Content&IP", "Safety&Physical", "Infrastructure", "Minors"]);
const legacyActiveArtifacts = Object.freeze(["data_provenance_profile", "data_provenance_profile_forensics", "extended_dap_india_readiness_profile", "integrated_dap_report", "m10_selected_legal_support_packet", "m7_deterministic_legal_signal_overlay"]);
const forbiddenPhase1To8RootImports = Object.freeze(["../../m7-validator.js", "../../m8-validator.js", "../../m8-feature-candidate-inventory-index.js", "../../m8-feature-candidate-inventory.js", "../../m8-feature-candidate-index-boundary.js", "../../m9-validator.js", "../../m9-normalizer.js", "../../m9-hybrid-orchestrator.js", "../../m9-deterministic-map.js", "../../m9-semantic-profile-validator.js", "../../m9-hybrid-compiler.js", "../../m9-hybrid-compiler-v2.js", "../../deterministic-profile-forensics.js"]);
const allowedPostPhase8RootImports = Object.freeze(["../../m11-orchestrator.js", "../../m12-deterministic-challenge.js", "../../compiler.js", "../../report-renderer.js"]);
const activeEntrypointFiles = Object.freeze(["package.json", "server.js", "src/runtime/main.js", "src/runtime/app.js", "src/runtime/routes/operator.routes.js", "src/runtime/routes/public.routes.js", "src/runtime/services/async.service.js", "src/runtime/services/pipeline.service.js", "src/runtime/services/artifacts.service.js"]);

const files = await loadFilesForStaticChecks();
checkProductionEntrypointCutover(files);
checkLegacyReviewerStackInactive(files);
checkNoPhase1To8RootImports(files);
checkPostPhase8BridgeBoundary(files);
checkPhase1To8PipelineChain();
checkPhase1To8DispatchText(files);
checkActivityProfileV4DerivationContract(files);
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
    "PACKAGE_STARTS_CENTRAL_RUNTIME",
    "SERVER_JS_DELEGATES_TO_CENTRAL_RUNTIME",
    "NO_ACTIVE_LEGACY_REVIEWER_ADVANCE",
    "NO_AGENT3_M10_LOCK_ROUTE",
    "OLD_PHASE_CONTRACTS_NOT_RUNTIME_ACTIVE",
    "NO_PHASE1_8_ROOT_IMPORTS",
    "POST_PHASE8_ROOT_BRIDGES_EXPLICIT_ONLY",
    "NO_M10_4B_4C_ACTIVE_CHAIN",
    "ACTIVITY_PROFILE_AI_REGISTRY_KEY_V4_DIRECT_AUTHORITY",
    "ACTIVITY_PROFILE_NO_ACTIVE_CLASSIFICATION_MATRIX",
    "ACTIVITY_PROFILE_V4_ARCHETYPE_ENUM",
    "ACTIVITY_PROFILE_DERIVATION_BASIS_SCHEMA",
    "ACTIVITY_PROFILE_BASIS_COVERAGE_ENFORCED",
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
    "package.json",
    "server.js",
    "src/runtime/main.js",
    "src/runtime/app.js",
    "src/runtime/routes/operator.routes.js",
    "src/runtime/routes/public.routes.js",
    "src/runtime/services/async.service.js",
    "src/runtime/services/pipeline.service.js",
    "src/runtime/services/artifacts.service.js",
    "src/runtime/contracts/pipeline.contract.js",
    "src/runtime/contracts/central-phase.contract.js",
    "src/runtime/contracts/artifact-permissions.contract.js",
    "src/phases/01-source-discovery/source-discovery.runner.js",
    "src/phases/02-legal-cartography-index/legal-cartography-index.runner.js",
    "src/phases/02-legal-cartography-index/validators/legal-cartography-index.validator.js",
    "src/phases/05-activity-profile-review/activity-profile-review.contract.js",
    "src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js",
    "src/phases/07-data-provenance-profile/data-provenance-profile.contract.js",
    "src/report-normalization-map.js",
    "agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md",
    "agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md",
    "agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml",
    "references/registry/REFERENCE_MANIFEST.json",
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

function checkProductionEntrypointCutover(files) {
  const pkg = JSON.parse(files["package.json"]);
  assert.equal(pkg.scripts?.start, "node src/runtime/main.js", "package.json start must boot the central runtime entrypoint");

  const server = files["server.js"] || "";
  assert.ok(server.includes("./src/runtime/main.js"), "server.js must delegate to the central runtime main entrypoint");
  assert.ok(server.includes("startRuntimeServer"), "server.js must start the central runtime server only");

  for (const forbidden of ["./src/reviewer-routes.js", "./src/public-reviewer-routes.js", "./src/artifact-service.js", "reviewerRouter", "publicReviewerRouter", "agent3LockPhaseRoute", "saveArtifactHandler", "M10"]) {
    assert.ok(!server.includes(forbidden), `server.js must not expose retired legacy runtime marker ${forbidden}`);
  }

  assert.ok(files["src/runtime/main.js"].includes("createRuntimeApp"), "central runtime main must create runtime app");
  assert.ok(files["src/runtime/app.js"].includes("operatorRouter"), "central runtime app must mount operator router");
  assert.ok(files["src/runtime/app.js"].includes("publicRouter"), "central runtime app must mount public router");
}

function checkLegacyReviewerStackInactive(files) {
  const activeEntrypointText = activeEntrypointFiles.map((file) => files[file] || "").join("\n");
  for (const forbidden of ["reviewer-runner-normalized.js", "reviewer-async-runner.js", "reviewer-routes.js", "public-reviewer-routes.js", "./phase-contracts.js", "from \"./phase-contracts.js\"", "from '../phase-contracts.js'"]) {
    assert.ok(!activeEntrypointText.includes(forbidden), `active runtime entrypoint must not import retired reviewer/phase-contract stack marker ${forbidden}`);
  }
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

function checkActivityProfileV4DerivationContract(files) {
  const activity = ACTIVITY_PROFILE_REVIEW_CONTRACT;
  const pipelineActivity = PIPELINE_CONTRACTS.M8_TARGET_FEATURE_PROFILE;
  const prompt = files["agent-packages/agent_3_target_feature/03_M8_FEATURE_PROFILE_BACKEND_CURRENT.md"];
  const backendContract = files["agent-packages/agent_3_target_feature/AGENT3_BACKEND_OUTPUT_CONTRACT.md"];
  const binding = files["agent-packages/agent_3_target_feature/AGENT3_RUNTIME_BINDING_PACKET.yaml"];
  const validator = files["src/phases/05-activity-profile-review/validators/activity-profile-review.validator.js"];
  const reportMap = files["src/report-normalization-map.js"];
  const manifest = JSON.parse(files["references/registry/REFERENCE_MANIFEST.json"]);

  assert.deepEqual(activity.material_job.references, expectedActivityProfileReferences, "Activity Profile material references must use AI_REGISTRY_KEY.md directly and exclude classification matrix");
  assert.deepEqual(pipelineActivity.references, expectedActivityProfileReferences, "Pipeline Activity Profile references must exclude classification matrix");
  assert.equal(activity.source_authority.base_registry_key_reference, "AI_REGISTRY_KEY.md", "Activity Profile must use AI_REGISTRY_KEY.md as base registry key reference");
  assert.equal(activity.source_authority.archetype_derivation_authority, "AI_REGISTRY_KEY.md §4", "Activity Profile archetype authority must be AI_REGISTRY_KEY.md §4");
  assert.equal(activity.source_authority.surface_derivation_authority, "AI_REGISTRY_KEY.md §7", "Activity Profile surface authority must be AI_REGISTRY_KEY.md §7");
  assert.equal(activity.source_authority.classification_matrix_active_for_material_derivation, false, "Classification matrix must not be active for Activity Profile material derivation");

  assert.deepEqual(activity.output_contract.archetype_codes, expectedActivityProfileArchetypes, "Activity Profile must expose all 14 AI Registry Key v4 archetypes in order");
  assert.deepEqual(activity.output_contract.surface_context_tokens, expectedActivityProfileSurfaces, "Activity Profile surfaces must match AI Registry Key §7 tokens");
  for (const code of ["CUR", "MOD", "ORA"]) {
    assert.ok(validator.includes(`"${code}"`), `Activity Profile validator must allow v4 archetype ${code}`);
    assert.ok(prompt.includes(`${code} —`), `M8 prompt must describe v4 archetype ${code}`);
    assert.ok(reportMap.includes(`${code}:`), `report-normalization-map.js must label v4 archetype ${code}`);
  }

  assert.ok(activity.output_contract.activity_row_fields.includes("archetype_derivation_basis"), "Activity row schema must include archetype_derivation_basis");
  assert.ok(activity.output_contract.activity_row_fields.includes("surface_derivation_basis"), "Activity row schema must include surface_derivation_basis");
  assert.ok(!activity.output_contract.activity_row_fields.includes("archetype_proof"), "Activity row schema must not include retired archetype_proof");
  assert.ok(!activity.output_contract.activity_row_fields.includes("surface_proof_and_routing_limits"), "Activity row schema must not include retired surface_proof_and_routing_limits");
  assert.equal(activity.output_contract.multiple_archetypes_per_activity_allowed, true, "Activity Profile must allow multiple archetypes per activity");
  assert.equal(activity.output_contract.archetype_derivation_basis_must_match_selected_codes_one_to_one, true, "Activity Profile must require one basis per selected archetype");
  assert.equal(activity.output_contract.surface_derivation_basis_must_match_selected_tokens_one_to_one, true, "Activity Profile must require one basis per selected surface token");
  assert.equal(activity.output_contract.no_unselected_archetype_basis_entries, true, "Activity Profile must reject unselected archetype basis entries");
  assert.equal(activity.output_contract.no_unselected_surface_basis_entries, true, "Activity Profile must reject unselected surface basis entries");

  assert.ok(validator.includes("function validateBasisCoverage"), "Activity Profile validator must define basis coverage check");
  assert.ok(validator.includes("count !== 1"), "Activity Profile validator must require exactly one basis entry per selected item");
  assert.ok(validator.includes("contains basis entry for unselected"), "Activity Profile validator must reject unselected basis entries");
  assert.ok(validator.includes("validateUniqueSelections(archetypeCodes"), "Activity Profile validator must reject duplicate archetype selections");
  assert.ok(validator.includes("validateUniqueSelections(surfaceTokens"), "Activity Profile validator must reject duplicate surface selections");

  assert.ok(prompt.includes("AI_REGISTRY_KEY.md is the sole active authority"), "M8 prompt must name AI_REGISTRY_KEY.md as sole active authority");
  assert.ok(prompt.includes("M8 must derive archetypes directly from AI_REGISTRY_KEY.md §4"), "M8 prompt must derive archetypes from AI_REGISTRY_KEY.md §4");
  assert.ok(prompt.includes("M8 must derive surface tokens directly from AI_REGISTRY_KEY.md §7"), "M8 prompt must derive surfaces from AI_REGISTRY_KEY.md §7");
  assert.ok(prompt.includes("Multiple archetypes may be selected"), "M8 prompt must allow multiple archetypes per activity");
  assert.ok(prompt.includes("exactly one matching `archetype_derivation_basis[]`"), "M8 prompt must require archetype basis coverage");
  assert.ok(prompt.includes("No `surface_derivation_basis[]` entry may exist for a surface token that is not present"), "M8 prompt must reject unselected surface basis entries");
  assert.ok(prompt.includes("CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml is superseded"), "M8 prompt must mark classification matrix superseded, not active");

  assert.ok(backendContract.includes("may contain more than one archetype"), "Backend output contract must allow multiple archetypes");
  assert.ok(backendContract.includes("Every selected archetype code must have exactly one matching"), "Backend output contract must require archetype basis coverage");
  assert.ok(backendContract.includes("No `surface_derivation_basis[]` object may exist for an unselected surface token"), "Backend output contract must reject unselected surface basis entries");
  assert.ok(binding.includes("Activity Profile Review must use AI_REGISTRY_KEY.md directly"), "Agent 3 binding must require direct AI_REGISTRY_KEY.md activity derivation");
  assert.ok(binding.includes("CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml is superseded"), "Agent 3 binding must mark classification matrix superseded");
  assert.equal(manifest.validation?.AI_REGISTRY_KEY.md?.activity_profile_material_archetype_enum, "v4_14_codes", "Reference manifest must record Activity Profile v4 archetype enum");
  assert.equal(manifest.validation?.CLASSIFICATION_DERIVATION_MATRIX_v1_LOCKED.yaml?.active_activity_profile_material_reference, false, "Reference manifest must mark classification matrix inactive for Activity Profile material");
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
