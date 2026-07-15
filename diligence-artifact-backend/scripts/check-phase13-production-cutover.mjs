import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT } from "../src/runtime/contracts/post-review-production-cutover.contract.js";
import { PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT } from "../src/runtime/contracts/phase13-runtime.contract.js";
import { PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT } from "../src/runtime/contracts/phase14-submission-runtime.contract.js";
import { PHASE15_DILIGENCE_QA_COMPLETE_RUNTIME_CONTRACT } from "../src/runtime/contracts/phase15-diligence-qa-runtime.contract.js";
import { PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT } from "../src/runtime/contracts/phase16-assembly-runtime.contract.js";
import { PIPELINE_CONTRACTS, PIPELINE_CONTRACT_STATUS } from "../src/runtime/contracts/pipeline.contract.js";
import { CENTRAL_PHASE_BY_ID } from "../src/runtime/contracts/central-phase.contract.js";
import { ARTIFACT_PERMISSION_STATUS } from "../src/runtime/contracts/artifact-permissions.contract.js";

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const expectedSequence = [
  "QUALIFIED_REVIEW",
  "AWAITING_QUALIFIED_REVIEW",
  "QUALIFIED_REVIEW_SUBMISSION",
  "DILIGENCE_QA_COMPLETE",
  "AWAITING_ASSEMBLY",
  "ASSEMBLY_ENGINE",
  "COMPLETE"
];

assert.equal(POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.active, true);
assert.deepEqual([...POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.runtime_sequence], expectedSequence);
assert.equal(POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.safeguards.confirmation_unit, "SECTION");
assert.equal(POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.safeguards.per_question_confirmation_forbidden, true);
assert.equal(POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.safeguards.explicit_assembly_authorization_required, true);
assert.equal(POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.safeguards.local_counsel_review_required, true);
assert.equal(POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.safeguards.legal_architect_not_law_firm, true);
assert.equal(POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.retired_authorities.normalized_section_qr_matrix, "REMOVED");
assert.equal(POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.retired_authorities.responses_endpoint, "HTTP_410_TOMBSTONE_ONLY");

assert.equal(PHASE13_QUALIFIED_REVIEW_RUNTIME_CONTRACT.next, "AWAITING_QUALIFIED_REVIEW");
assert.equal(PHASE14_QUALIFIED_REVIEW_SUBMISSION_RUNTIME_CONTRACT.next, "DILIGENCE_QA_COMPLETE");
assert.equal(PHASE15_DILIGENCE_QA_COMPLETE_RUNTIME_CONTRACT.next, "AWAITING_ASSEMBLY");
assert.equal(PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT.next, "COMPLETE");
assert.equal(PHASE16_ASSEMBLY_ENGINE_RUNTIME_CONTRACT.explicit_assembly_authorization_required, true);

assert.equal(PIPELINE_CONTRACTS.QUALIFIED_REVIEW.next, "AWAITING_QUALIFIED_REVIEW");
assert.equal(PIPELINE_CONTRACTS.QUALIFIED_REVIEW_SUBMISSION.next, "DILIGENCE_QA_COMPLETE");
assert.equal(PIPELINE_CONTRACTS.DILIGENCE_QA_COMPLETE.next, "AWAITING_ASSEMBLY");
assert.equal(PIPELINE_CONTRACTS.ASSEMBLY_ENGINE.next, "COMPLETE");
assert.equal(PIPELINE_CONTRACTS.COMPLETE.type, "terminal");

for (const phaseId of ["QUALIFIED_REVIEW", "QUALIFIED_REVIEW_SUBMISSION", "DILIGENCE_QA_COMPLETE", "ASSEMBLY_ENGINE"]) {
  assert(CENTRAL_PHASE_BY_ID[phaseId], `CENTRAL_PHASE_MISSING:${phaseId}`);
}

assert.equal(PIPELINE_CONTRACT_STATUS.phase13_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase14_submission_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase15_diligence_qa_canonical_pipeline_contract_synced, true);
assert.equal(PIPELINE_CONTRACT_STATUS.phase16_assembly_canonical_pipeline_contract_synced, true);
assert.equal(ARTIFACT_PERMISSION_STATUS.canonical_post_review_permissions_synced, true);
assert.equal(ARTIFACT_PERMISSION_STATUS.phase16_assembly_writes_synced, true);

const publicRoutes = read("src/runtime/routes/public.routes.js");
assert.match(publicRoutes, /authorize_assembly/);
assert.match(publicRoutes, /authorized_by/);
assert.match(publicRoutes, /qualified-review\/:run_id\/responses[\s\S]*status\(410\)/);

const schemas = read("src/runtime/contracts/schemas.contract.js");
assert.match(schemas, /action:\s*z\.enum\(\["AUTHORIZE_ASSEMBLY"\]\)/);
assert.match(schemas, /explicit_assembly_authorization_supported:\s*true/);

const asyncRuntime = read("src/runtime/services/async-phase13.service.js");
assert.match(asyncRuntime, /AWAITING_ASSEMBLY/);
assert.match(asyncRuntime, /ASSEMBLY_ENGINE/);
assert.match(asyncRuntime, /runAssemblyEngineRuntime/);
assert.match(asyncRuntime, /assemblyAuthorizationRequested/);
assert.match(asyncRuntime, /ASSEMBLY_AUTHORIZATION_DILIGENCE_QA_INCOMPLETE/);
assert.match(asyncRuntime, /ASSEMBLY_ENGINE_AUTHORIZED/);

const productionManifest = read("scripts/production-gate.manifest.mjs");
for (const requiredScript of [
  "check:phase13-authority",
  "check:phase13-domain-field-resolution",
  "check:phase13-qr-runtime-ui",
  "check:phase13-submission-qa",
  "check:phase13-legacy-retirement",
  "check:phase16-assembly",
  "check:phase13-production-cutover"
]) {
  assert(productionManifest.includes(`"${requiredScript}"`), `PRODUCTION_GATE_PHASE13_16_CHECK_MISSING:${requiredScript}`);
}

console.log("Phase 13-16 production cutover: PASS");
console.log(JSON.stringify({
  cutover_active: true,
  runtime_sequence: expectedSequence,
  legacy_authority_retired: true,
  section_attestation_active: true,
  immutable_submission_active: true,
  diligence_qa_active: true,
  explicit_assembly_authorization_active: true,
  authorization_action_owned_by_schema: true,
  qa_guard_owned_by_async_runtime: true,
  terminal_phase: "COMPLETE",
  source_certification_command: POST_REVIEW_PRODUCTION_CUTOVER_CONTRACT.source_certification_command,
  live_cloud_execution_separate: true
}, null, 2));

function read(path) {
  return readFileSync(resolve(backendRoot, path), "utf8");
}
