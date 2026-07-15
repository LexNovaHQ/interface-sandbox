import assert from "node:assert/strict";
import fs from "node:fs";
import { DOMAIN_DERIVATION_CONTRACT } from "../src/phases/03-domain-derivation/domain-derivation.contract.js";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";

const md = fs.readFileSync(new URL("../agent-packages/agent_3_target_feature/00_VALIDATOR_RULES_INTEGRATED.md", import.meta.url), "utf8");
const gate = (header, next) => md.slice(md.indexOf(header), md.indexOf(next, md.indexOf(header)));

// No forbidden artifact may appear inside its phase's allowed-inputs block.
const tprBlock = gate("For Target Profile Review, allowed inputs are exactly:", "is navigation only");
for (const f of TARGET_PROFILE_REVIEW_CONTRACT.material_job.forbidden_reads) {
  if (f.includes("{") || f.startsWith("lossless_root__")) continue; // skip patterns / evidence-family entries
  assert.ok(!tprBlock.includes("`" + f + "`"), `3A allowed-inputs must not list forbidden read: ${f}`);
}
const ddBlock = gate("For `P3_DOMAIN_DERIVATION_LAYER`, allowed inputs are exactly:", "allowed references are exactly");
for (const f of ["source_discovery_handoff","cartography_index","target_profile_source_index"]) {
  assert.ok(!ddBlock.includes("`" + f + "`"), `3B allowed-inputs must not list forbidden read: ${f}`);
}
console.log(JSON.stringify({ check: "phase3 prompt input gates", status: "PASS" }, null, 2));
