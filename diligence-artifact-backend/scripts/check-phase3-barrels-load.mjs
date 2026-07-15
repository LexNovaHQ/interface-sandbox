import assert from "node:assert/strict";
// Both Phase 3 barrels must load without ESM instantiation errors,
// and every re-exported name must resolve to a defined value.
const tpr = await import("../src/phases/03-target-profile-review/index.js");
const dd  = await import("../src/phases/03-domain-derivation/index.js");

assert.ok(tpr.TARGET_PROFILE_REVIEW_CONTRACT, "3A barrel missing TARGET_PROFILE_REVIEW_CONTRACT");
assert.ok(dd.DOMAIN_DERIVATION_CONTRACT, "3B barrel missing DOMAIN_DERIVATION_CONTRACT");
for (const [name, val] of Object.entries(tpr)) assert.notEqual(val, undefined, `3A barrel exports undefined: ${name}`);
for (const [name, val] of Object.entries(dd))  assert.notEqual(val, undefined, `3B barrel exports undefined: ${name}`);

// The 3A validator must NOT depend on the barrel (keeps index.js off the runtime path).
const vsrc = await import("node:fs").then((fs) => fs.readFileSync(new URL("../src/phases/03-target-profile-review/validators/target-profile-review.validator.js", import.meta.url), "utf8"));
assert.ok(!/from\s+["']\.\.\/index\.js["']/.test(vsrc), "3A validator must import the contract directly, not ../index.js");
console.log(JSON.stringify({ check: "phase3 barrels load", status: "PASS" }, null, 2));
