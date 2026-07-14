import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const asyncSource = source("src/runtime/services/async-phase13.service.js");
const assemblySource = source("src/runtime/services/assembly-engine.service.js");
const driveSource = source("src/runtime/services/storage/drive.service.js");
const schemaSource = source("src/runtime/contracts/schemas.contract.js");
const publicRoutes = source("src/runtime/routes/public.routes.js");
const permissionSource = source("src/runtime/contracts/artifact-permissions.contract.js");

assert.match(asyncSource, /const ASSEMBLY_JOB = "ASSEMBLY_ENGINE"/);
assert.match(asyncSource, /authorize_assembly/);
assert.match(asyncSource, /ASSEMBLY_ENGINE_AUTHORIZED/);
assert.match(asyncSource, /runAssemblyEngineRuntime/);
assert.match(asyncSource, /terminal: true/);

assert.match(assemblySource, /run\.assembly_authorized !== true/);
assert.match(assemblySource, /document-assembly/);
assert.match(assemblySource, /review-ready-drafts/);
assert.match(assemblySource, /saveBinaryFileToDriveIdempotent/);
assert.match(assemblySource, /current_phase: "COMPLETE"/);
assert.match(assemblySource, /generated_documents_git_forbidden: true/);

assert.match(driveSource, /ensureDriveFolder/);
assert.match(driveSource, /saveBinaryFileToDriveIdempotent/);
assert.match(driveSource, /DRIVE_IMMUTABLE_BINARY_CONFLICT/);
assert.match(driveSource, /DRIVE_FOLDER_DUPLICATE/);

assert.match(schemaSource, /authorize_assembly/);
assert.match(schemaSource, /AUTHORIZE_ASSEMBLY/);
assert.match(publicRoutes, /authorize_assembly: body\.authorize_assembly/);
assert.match(publicRoutes, /document_assembly_payload/);
assert.match(publicRoutes, /PRIVATE_REVIEWER_OR_DOCUMENT_STATE/);
assert.doesNotMatch(publicRoutes, /review-ready-drafts\/:/);

for (const artifact of ["document_assembly_payload", "review_ready_draft_manifest", "document_assembly_validation_manifest"]) {
  assert.match(permissionSource, new RegExp(artifact));
}
assert.match(permissionSource, /phase16_assembly_writes_synced: true/);
assert.match(permissionSource, /ASSEMBLY_ENGINE: ASSEMBLY_ENGINE_ARTIFACT_NAMES/);

console.log("Phase 16 runtime wiring: PASS");
console.log(JSON.stringify({
  explicit_authorization: true,
  idempotent_drive_custody: true,
  public_document_artifacts_fenced: true,
  terminal_phase: "COMPLETE",
  generated_documents_git_forbidden: true
}, null, 2));

function source(path) {
  return readFileSync(new URL(`../${path}`, import.meta.url), "utf8");
}
