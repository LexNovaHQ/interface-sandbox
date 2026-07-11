import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const read = (file) => readFileSync(file, "utf8");
const m11 = read("src/phases/09-exposure-profile/m11-orchestrator-m11v2.js");
const rootM11 = read("src/m11-orchestrator-m11v2.js");
const prompts = read("src/runtime/services/prompts.service.js");
const rootReference = read("src/reference-loader.js");
const runtimeReference = read("src/runtime/services/reference.service.js");

const forbiddenM11Imports = ["./firestore.js", "./prompt-loader.js", "./reference-loader.js", "./gemini-client.js", "./artifact-service.js", "./sheets.js", "./drive.js"];
for (const marker of forbiddenM11Imports) assert.equal(m11.includes(marker), false, `M11 retains retired root infrastructure import: ${marker}`);
for (const marker of ["../../runtime/services/storage/firestore.service.js", "../../runtime/services/prompts.service.js", "../../runtime/services/reference.service.js", "../../runtime/services/provider.service.js", "../../runtime/services/artifacts.service.js"]) assert.ok(m11.includes(marker), `M11 missing central runtime dependency: ${marker}`);

assert.ok(m11.includes('infrastructure_authority: "CENTRAL_RUNTIME_SERVICES"'));
assert.ok(m11.includes('phase_owned_path: "src/phases/09-exposure-profile"'));
assert.ok(rootM11.includes("Compatibility bridge only"));
assert.equal(rootM11.includes("function "), false);
assert.ok(prompts.includes('from "./reference.service.js"'));
assert.equal(prompts.includes("../../reference-loader.js"), false);
assert.ok(prompts.includes('reference_loader_authority: "reference.service"'));

assert.ok(rootReference.includes('from "./runtime/services/reference.service.js"'));
assert.equal(rootReference.includes("readFile"), false, "root reference-loader must be compatibility re-export only");
assert.ok(runtimeReference.includes('source_of_truth: "src/runtime/services/reference.service.js"'));
assert.ok(runtimeReference.includes("references/domain-packages"));
assert.ok(runtimeReference.includes("references/registry"));
assert.ok(runtimeReference.includes('fileName.includes("..")'));

const runtimeModule = await import("../src/runtime/services/reference.service.js");
const compatibilityModule = await import("../src/reference-loader.js");
assert.equal(compatibilityModule.loadReferencePacket, runtimeModule.loadReferencePacket, "root compatibility export must resolve to central reference service");

console.log(JSON.stringify({ check: "M11 central runtime dependency cutover", status: "PASS", enforced_gates: ["M11_PHASE_OWNED", "M11_NO_ROOT_INFRASTRUCTURE_IMPORTS", "M11_CENTRAL_STORAGE_PROMPT_PROVIDER_ARTIFACT_SERVICES", "ONE_REFERENCE_LOADER_IMPLEMENTATION", "ROOT_REFERENCE_LOADER_COMPATIBILITY_REEXPORT_ONLY"] }, null, 2));
