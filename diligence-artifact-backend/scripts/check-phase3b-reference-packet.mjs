import assert from "node:assert/strict";
import fs from "node:fs";
import { getInternalJobContract } from "../src/runtime/contracts/internal-job.contract.js";
import { loadReferencePacket } from "../src/runtime/services/reference.service.js";

const p3 = getInternalJobContract("P3_DOMAIN_DERIVATION_LAYER");
const packet = await loadReferencePacket(p3.references || []);
for (const ref of p3.references) {
  assert.ok(packet.files[ref], `reference not loaded: ${ref}`);
  assert.ok(packet.files[ref].content.length > 0, `reference empty: ${ref}`);
}

const m7 = getInternalJobContract("M7_TARGET_PROFILE");
const m7packet = await loadReferencePacket(m7.references || []);
assert.ok(m7packet.files["M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml"].content.length > 0);
await assert.rejects(loadReferencePacket(["references/domain-packages/../registry/M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml"]));

const svc = fs.readFileSync(new URL("../src/runtime/services/prompts.service.js", import.meta.url), "utf8");
assert.ok(/from\s+["']\.\/reference\.service\.js["']/.test(svc), "prompts.service must import the central reference service");
assert.ok(!/function\s+assertSafeReferenceFile/.test(svc), "prompts.service must not redefine assertSafeReferenceFile");
const referenceService = fs.readFileSync(new URL("../src/runtime/services/reference.service.js", import.meta.url), "utf8");
assert.ok(referenceService.includes('source_of_truth: "src/runtime/services/reference.service.js"'));
assert.ok(referenceService.includes('references/domain-packages'));
assert.ok(referenceService.includes('references/registry'));

console.log(JSON.stringify({ check: "phase3b reference packet", status: "PASS" }, null, 2));