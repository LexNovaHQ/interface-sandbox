import fs from "node:fs";
import crypto from "node:crypto";

const mustExist = [
  "server.js",
  "renderer.js",
  "vault-bridge.js",
  "prompts/diligence_runtime_MONOLITH_FINAL.md",
  "reference/REGISTRY_KEY_v3_0.md",
  "reference/AI_THREAT_REGISTRY.csv",
  "reference/REGISTRY_EVALUATION_RULES.csv",
  "reference/VAULT_JS_CANONICAL_MAP_v1.md",
  "public/index.html",
  "public/ui.js",
  "public/ui.css"
];

let ok = true;
for (const file of mustExist) {
  if (!fs.existsSync(file)) {
    console.error(`MISSING ${file}`);
    ok = false;
  }
}

const server = fs.readFileSync("server.js", "utf8");
const prompt = fs.readFileSync("prompts/diligence_runtime_MONOLITH_FINAL.md", "utf8");
const requiredServerTerms = [
  "GEMINI_API_KEYS",
  "MODEL_FIRST_KEY_SECOND_FLAT_POOL",
  "single_grounded_monolith_call_no_external_source_bridge",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "final_output_handoff"
];
for (const term of requiredServerTerms) {
  if (!server.includes(term)) {
    console.error(`SERVER_TERM_MISSING ${term}`);
    ok = false;
  }
}

const forbiddenServerTerms = [
  "S0_SEARCH_API_KEYS",
  "P7_OPERATION_KEY",
  "P6_REGISTRY_KEYS",
  "P3_PROFILE_KEYS",
  "P1_ROUTING_API_KEYS",
  "m6_url_fetch_manifest",
  "m6_fetch_fulfillment"
];
for (const term of forbiddenServerTerms) {
  if (server.includes(term)) {
    console.error(`FORBIDDEN_SERVER_TERM_PRESENT ${term}`);
    ok = false;
  }
}

console.log(JSON.stringify({
  ok,
  prompt_sha256: crypto.createHash("sha256").update(prompt).digest("hex"),
  server_chars: server.length,
  prompt_chars: prompt.length
}, null, 2));

if (!ok) process.exit(1);
