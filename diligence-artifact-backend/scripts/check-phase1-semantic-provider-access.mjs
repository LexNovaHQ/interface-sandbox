import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { probeGeminiAccess, providerConfigStatus } from "../src/runtime/services/provider.service.js";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.resolve(HERE, "../phase1-provider-preflight-output");
await fs.rm(OUTPUT_DIR, { recursive: true, force: true });
await fs.mkdir(OUTPUT_DIR, { recursive: true });

const providerStatus = providerConfigStatus();
if (!providerStatus.gemini_api_keys_present || providerStatus.gemini_api_key_count < 1) {
  throw new Error("PHASE1_SEMANTIC_PROVIDER_PREFLIGHT_NO_PARSED_KEYS");
}

const report = await probeGeminiAccess({
  phase: "PHASE1_RB18B_SEMANTIC_FEATURE_ADJUDICATION",
  model: providerStatus.gemini_model
});

await fs.writeFile(
  path.join(OUTPUT_DIR, "provider-access-preflight.json"),
  `${JSON.stringify(report, null, 2)}\n`
);

console.log(JSON.stringify({
  check: "Phase 1 semantic provider access",
  status: report.status,
  provider: report.provider,
  model: report.model,
  parsed_key_count: report.parsed_key_count,
  keys_tested: report.keys_tested,
  keys_authorized: report.keys_authorized,
  keys_rejected: report.keys_rejected,
  keys_rate_limited: report.keys_rate_limited,
  model_confirmed: report.model_confirmed,
  phase1_semantic_access_confirmed: report.phase1_semantic_access_confirmed,
  all_configured_keys_authorized: report.all_configured_keys_authorized,
  results: report.results
}, null, 2));

if (report.status !== "PASS") process.exit(1);
