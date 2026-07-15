import assert from "node:assert/strict";
import { getPipelineContract } from "../src/runtime/contracts/pipeline.contract.js";
const m7 = getPipelineContract("M7_TARGET_PROFILE");
const banned = ["03A_M8_FEATURE_CANDIDATE_INVENTORY_DETERMINISTIC.md","AGENT3_FEATURE_CANDIDATE_INVENTORY_OUTPUT_CONTRACT.md","00_VALIDATOR_RULES_M8_FEATURE_INVENTORY_INDEX_ADDENDUM.md","03B_M8_ACTIVITY_PROFILE_PACKAGE_AWARE_SYNC.md"];
for (const f of m7.prompt_files) for (const b of banned) assert.ok(!f.endsWith(b), `M7 bundle must not include M8/activity file: ${b}`);
assert.ok(m7.prompt_files.some((f) => f.endsWith("02_M7_TARGET_PROFILE_BACKEND_CURRENT.md")), "M7 bundle missing its backend prompt");
console.log(JSON.stringify({ check: "phase3a prompt bundle scope", status: "PASS" }, null, 2));
