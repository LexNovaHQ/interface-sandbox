import assert from "node:assert/strict";
import fs from "node:fs";
import { getInternalJobContract } from "../src/runtime/contracts/internal-job.contract.js";
import { loadReferencePacket } from "../src/runtime/services/prompts.service.js";

// P3 references (references/domain-packages/*) must all load with real content.
const p3 = getInternalJobContract("P3_DOMAIN_DERIVATION_LAYER");
const packet = await loadReferencePacket(p3.references || []);
for (const ref of p3.references) {
  assert.ok(packet.files[ref], `reference not loaded: ${ref}`);
  assert.ok(packet.files[ref].content.length > 0, `reference empty: ${ref}`);
}
// M7 (bare-name, references/registry/*) references still load.
const m7 = getInternalJobContract("M7_TARGET_PROFILE");
const m7packet = await loadReferencePacket(m7.references || []);
assert.ok(m7packet.files["M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml"].content.length > 0);
// Directory traversal is still rejected.
await assert.rejects(loadReferencePacket(["references/domain-packages/../registry/M7_TARGET_PROFILE_DERIVATION_AUTHORITY.yaml"]));

// DEDUP GUARDRAIL: prompts.service must NOT define its own loader — it must delegate.
// Prevents anyone re-forking a second reference loader into the runtime.
const svc = fs.readFileSync(new URL("../src/runtime/services/prompts.service.js", import.meta.url), "utf8");
assert.ok(/from\s+["']\.\.\/\.\.\/reference-loader\.js["']/.test(svc), "prompts.service must import the canonical reference-loader");
assert.ok(!/function\s+assertSafeReferenceFile/.test(svc), "prompts.service must not redefine assertSafeReferenceFile (no forked loader)");
console.log(JSON.stringify({ check: "phase3b reference packet", status: "PASS" }, null, 2));
