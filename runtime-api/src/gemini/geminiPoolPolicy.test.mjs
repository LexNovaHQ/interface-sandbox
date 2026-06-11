import assert from "node:assert/strict";
import { getPoolSnapshot } from "./geminiPool.js";

const nonSearchExpected = [
  "gemini-3.1-flash-lite",
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3-flash"
];

const searchExpected = [
  "gemini-2.5-flash-lite",
  "gemini-2.5-flash",
  "gemini-3.1-flash-lite",
  "gemini-3-flash"
];

assert.deepEqual(getPoolSnapshot("search", {}).models, searchExpected);
assert.deepEqual(getPoolSnapshot("json", {}).models, nonSearchExpected);
assert.deepEqual(getPoolSnapshot("registry", {}).models, nonSearchExpected);
assert.deepEqual(getPoolSnapshot("reasoning", {}).models, nonSearchExpected);
assert.deepEqual(getPoolSnapshot("final", {}).models, nonSearchExpected);

console.log(JSON.stringify({ ok: true, test: "gemini_pool_policy" }));
