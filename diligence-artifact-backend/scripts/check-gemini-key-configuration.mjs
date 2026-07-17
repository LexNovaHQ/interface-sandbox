import assert from "node:assert/strict";
import { parseGeminiApiKeys } from "../src/runtime/config.js";

assert.deepEqual(parseGeminiApiKeys("key-a,key-b"), ["key-a", "key-b"]);
assert.deepEqual(parseGeminiApiKeys("key-a\nkey-b\r\nkey-c"), ["key-a", "key-b", "key-c"]);
assert.deepEqual(parseGeminiApiKeys('["key-a", "key-b", "key-a"]'), ["key-a", "key-b"]);
assert.deepEqual(parseGeminiApiKeys(" key-a , key-b\nkey-a "), ["key-a", "key-b"]);
assert.deepEqual(parseGeminiApiKeys(""), []);
assert.throws(() => parseGeminiApiKeys('["key-a",'), /INVALID_GEMINI_API_KEYS_JSON_ARRAY/);

console.log(JSON.stringify({
  check: "Gemini API key configuration parser",
  status: "PASS",
  accepted_formats: ["comma_separated", "newline_separated", "json_array"],
  deduplication: true,
  secret_values_printed: false
}, null, 2));
