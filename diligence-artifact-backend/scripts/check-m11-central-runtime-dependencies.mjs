import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";

const m11 = readFileSync("src/phases/10-exposure-profile/m11-orchestrator-m11v2.js", "utf8");
const prompts = readFileSync("src/runtime/services/prompts.service.js", "utf8");
const runtimeReference = readFileSync("src/runtime/services/reference.service.js", "utf8");

for (const marker of [
  "../../runtime/services/storage/firestore.service.js",
  "../../runtime/services/prompts.service.js",
  "../../runtime/services/reference.service.js",
  "../../runtime/services/provider.service.js",
  "../../runtime/services/artifacts.service.js"
]) assert.ok(m11.includes(marker), `M11 missing central runtime dependency: ${marker}`);

for (const retired of ["src/m11-orchestrator.js", "src/m11-orchestrator-m11v2.js", "src/reference-loader.js", "src/prompt-loader.js", "src/gemini-client.js", "src/artifact-service.js"]) assert.equal(existsSync(retired), false, `obsolete root file still exists: ${retired}`);

assert.ok(m11.includes('infrastructure_authority: "CENTRAL_RUNTIME_SERVICES"'));
assert.ok(m11.includes('phase_owned_path: "src/phases/10-exposure-profile"'));
assert.ok(prompts.includes('from "./reference.service.js"'));
assert.equal(prompts.includes("../../reference-loader.js"), false);
assert.ok(prompts.includes('reference_loader_authority: "reference.service"'));
assert.ok(runtimeReference.includes('source_of_truth: "src/runtime/services/reference.service.js"'));
assert.ok(runtimeReference.includes("references/domain-packages"));
assert.ok(runtimeReference.includes("references/registry"));
assert.ok(runtimeReference.includes('fileName.includes("..")'));

console.log(JSON.stringify({ check: "M11 central runtime dependency cutover", status: "PASS", enforced_gates: ["M11_PHASE_OWNED", "M11_CENTRAL_STORAGE_PROMPT_PROVIDER_ARTIFACT_SERVICES", "ONE_REFERENCE_LOADER_IMPLEMENTATION", "OBSOLETE_ROOT_M11_AND_REFERENCE_FILES_DELETED"] }, null, 2));