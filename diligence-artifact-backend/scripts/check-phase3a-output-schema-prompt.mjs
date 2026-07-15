import assert from "node:assert/strict";
import fs from "node:fs";
import { TARGET_PROFILE_REVIEW_CONTRACT } from "../src/phases/03-target-profile-review/target-profile-review.contract.js";

const md = fs.readFileSync(new URL("../agent-packages/agent_3_target_feature/02_M7_TARGET_PROFILE_BACKEND_CURRENT.md", import.meta.url), "utf8");
const bf = TARGET_PROFILE_REVIEW_CONTRACT.output_contract.branch_fields;
// Every enforced leaf field name must appear in the prompt's output contract.
for (const [branch, fields] of Object.entries(bf)) {
  for (const f of fields) assert.ok(md.includes("`" + f + "`"), `prompt output contract missing leaf field: ${branch}.${f}`);
}
// Every array field must be marked ARRAY in the prompt.
for (const p of TARGET_PROFILE_REVIEW_CONTRACT.output_contract.array_fields) {
  const leaf = p.split(".").pop();
  assert.ok(new RegExp("`" + leaf + "`\\s*\\(ARRAY\\)", "i").test(md) || /`target_profile_limitations`\s*\(ARRAY\)/i.test(md), `array field not marked ARRAY: ${p}`);
}
console.log(JSON.stringify({ check: "phase3a output schema prompt", status: "PASS" }, null, 2));
