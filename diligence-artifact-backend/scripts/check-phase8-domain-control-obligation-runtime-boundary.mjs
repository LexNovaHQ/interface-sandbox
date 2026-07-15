import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_RUNNER_STATUS,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID,
  PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID
} from "../src/phases/08-domain-control-obligation-profile/index.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, "..");
const phaseRoot = "src/phases/08-domain-control-obligation-profile";

assert.equal(
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_RUNNER_STATUS.production_entrypoint_switched,
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.production_entrypoint_switched,
  "Layer 1 runner and contract cutover status must remain synchronized"
);
assert.equal(
  DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS.production_entrypoint_switched,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.production_entrypoint_switched,
  "Layer 2 runner and contract cutover status must remain synchronized"
);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.production_entrypoint_switched, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.production_entrypoint_switched, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_RUNNER_STATUS.production_entrypoint_switched, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS.production_entrypoint_switched, true);
assert.ok(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT.implementation_status.includes("RUNTIME_CUTOVER_COMPLETE"));
assert.ok(DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT.implementation_status.includes("RUNTIME_CUTOVER_COMPLETE"));

assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_RUNNER_STATUS.phase2g_route_scoped_runtime_reader_required, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS.phase2g_route_scoped_runtime_reader_required, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_RUNNER_STATUS.phase2e_navigation_required, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS.phase2e_navigation_required, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_RUNNER_STATUS.provider_call_allowed, false);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS.material_fields_are_model_owned, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS.compiler_is_mechanical_only, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS.profile_forensics_inputs_forbidden, true);
assert.equal(DOMAIN_CONTROL_OBLIGATION_PROFILE_RUNNER_STATUS.dap_inputs_forbidden, true);

for (const contract of [
  DOMAIN_CONTROL_OBLIGATION_CANDIDATE_INVENTORY_CONTRACT,
  DOMAIN_CONTROL_OBLIGATION_PROFILE_CONTRACT
]) {
  assert.equal(contract.route_contract.route_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_ROUTE_ID);
  assert.equal(contract.route_contract.bucket_id, PHASE8_DOMAIN_CONTROL_OBLIGATION_BUCKET_ID);
  assert.equal(contract.route_contract.routing_authority, "P2G_CENTRALIZED_PHASE_ROUTING_AUTHORITY");
  assert.equal(contract.route_contract.lossless_evidence_role, "PRIMARY_EVIDENCE");
  assert.equal(contract.route_contract.index_role, "MANDATORY_NAVIGATION_MAP_INTO_PRIMARY_EVIDENCE");
  assert.equal(contract.route_contract.direct_contract_read_loading_forbidden, true);
  assert.equal(contract.route_contract.direct_lossless_fallback_framing_forbidden, true);
  assert.equal(contract.route_contract.free_corpus_read_forbidden, true);
  assert.equal(contract.route_contract.profile_forensics_inputs_forbidden, true);
  assert.equal(contract.route_contract.dap_inputs_forbidden, true);
}

const candidateRunner = read(`${phaseRoot}/domain-control-obligation-candidate-inventory.runner.js`);
const profileRunner = read(`${phaseRoot}/domain-control-obligation-profile.runner.js`);
const compiler = read(`${phaseRoot}/services/domain-control-obligation-profile.compiler.js`);
const resolver = read(`${phaseRoot}/services/domain-control-obligation-taxonomy.resolver.js`);
const pipelineService = read("src/runtime/services/pipeline.service.js");

for (const [label, source] of [
  ["candidate runner", candidateRunner],
  ["profile runner", profileRunner]
]) {
  assert.ok(source.includes("readPhaseRouteRuntimePacket"), `${label} must use P2G runtime reader`);
  assert.equal(source.includes("readArtifactPayload"), false, `${label} must not bypass P2G through readArtifactPayload`);
  assert.equal(source.includes("artifacts.service"), false, `${label} must not import artifact service directly`);
  assert.equal(source.includes("provider.service"), false, `${label} must not import provider service directly`);
  assert.equal(source.includes("callProviderJson"), false, `${label} must receive provider callback from central runtime`);
  assert.equal(/from\s+["'][^"']*\/07-[^"']*["']/.test(source), false, `${label} must not import Phase 7 implementation`);
  assert.equal(/from\s+["'][^"']*\/09-[^"']*["']/.test(source), false, `${label} must not import downstream Phase 9 implementation`);
}

assert.ok(pipelineService.includes("runDomainControlObligationCandidateInventoryPhase"), "Central runtime must import Phase 8 Layer 1 runner");
assert.ok(pipelineService.includes("runDomainControlObligationProfilePhase"), "Central runtime must import Phase 8 Layer 2 runner");
assert.ok(pipelineService.includes("internalJobId === JOB.domainControlObligationCandidateInventory"), "Central runtime must dispatch Phase 8 Layer 1");
assert.ok(pipelineService.includes("internalJobId === JOB.domainControlObligationProfile"), "Central runtime must dispatch Phase 8 Layer 2");

assert.ok(profileRunner.includes("assertNoForbiddenInputs"), "Layer 2 runner must enforce forbidden input gate");
assert.ok(profileRunner.includes("DAP_ARTIFACT_RE"), "Layer 2 runner must enforce DAP input rejection");
assert.ok(profileRunner.includes("assertDomainControlObligationCandidateInventory"), "Layer 2 runner must revalidate Layer 1 inventory");
assert.ok(profileRunner.includes("assertDomainControlObligationModelOutput"), "Layer 2 runner must validate model payload before compile");
assert.ok(profileRunner.includes("assertDomainControlObligationProfile"), "Layer 2 runner must validate compiled output");
assert.ok(profileRunner.includes("loadPhase8FdrRules"), "Layer 2 runner must load DCO FDR rules dynamically");

assert.equal(compiler.includes("backend_material_defaulting_allowed: false"), true);
assert.equal(compiler.includes("backend_material_rewrite_allowed: false"), true);
assert.equal(compiler.includes("expectedRegulatoryOverlayRefs"), true);
assert.equal(resolver.includes("hardcoded_domain_logic: false"), true);
assert.equal(resolver.includes("resolver_reads_runtime_artifacts: false"), true);
assert.equal(resolver.includes("resolver_expands_phase2g_reads: false"), true);

for (const source of [candidateRunner, profileRunner, compiler, resolver]) {
  for (const forbiddenMarker of [
    "AI_Registry_Key.yml\"",
    "FinTech_Registry_Key.yml\"",
    "AI-OBL-",
    "FIN-OBL-"
  ]) assert.equal(source.includes(forbiddenMarker), false, `Phase 8 implementation hardcodes package marker ${forbiddenMarker}`);
}

console.log("Phase 8 Domain Control Obligation runtime/read-authority boundary: PASS");

function read(relativePath) {
  return fs.readFileSync(path.join(backendRoot, relativePath), "utf8");
}
