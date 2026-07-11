import assert from "node:assert/strict";
import pkg from "../package.json" with { type: "json" };
assert.ok(pkg.dependencies["js-yaml"], "runtime must depend on js-yaml");
console.log(JSON.stringify({ check: "runtime yaml dep", status: "PASS" }, null, 2));
