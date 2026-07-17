import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as runtimeConfig } from "../src/runtime/config.js";
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

const shapeProbes = await probeRequestShape({
  key: runtimeConfig.geminiApiKeys[0],
  model: providerStatus.gemini_model
});
report.request_shape_probes = shapeProbes;
report.production_request_shape_confirmed = shapeProbes.every((item) => item.status === "PASS");
report.status = report.status === "PASS" && report.production_request_shape_confirmed ? "PASS" : "FAIL";

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
  model_confirmed: report.model_confirmed,
  phase1_semantic_access_confirmed: report.phase1_semantic_access_confirmed,
  all_configured_keys_authorized: report.all_configured_keys_authorized,
  production_request_shape_confirmed: report.production_request_shape_confirmed,
  request_shape_probes: report.request_shape_probes,
  results: report.results
}, null, 2));

if (report.status !== "PASS") process.exit(1);

async function probeRequestShape({ key, model }) {
  const compactPrompt = 'Return exactly this JSON object: {"decisions":[]}';
  const candidates = Array.from({ length: 20 }, (_, index) => ({
    candidate_id: `PROBE_${String(index + 1).padStart(2, "0")}`,
    url_path: `/product/example-capability/variant-${index + 1}`,
    deterministic_feature_key: "example_capability",
    route_family: "/product/example-capability/{variant}",
    route_parameterized: true,
    variant_family: "example_capability_variant",
    template_signature: "probe-template-signature",
    title: `Example capability variant ${index + 1}`,
    headings: ["Example capability", `Variant ${index + 1}`],
    excerpt: "This synthetic bounded semantic probe describes one controlled capability variant with repeated template language and a small amount of unique operational evidence. ".repeat(5)
  }));
  const productionPrompt = [
    "You are a bounded feature-relationship adjudicator. Return strict JSON only and one decision for every candidate_id.",
    '{"decisions":[{"candidate_id":"...","normalized_feature_key":"snake_case","relationship":"SAME_FEATURE_CANONICAL_CANDIDATE|SAME_FEATURE_TEMPLATE_VARIANT|SAME_FEATURE_UNIQUE_DELTA|RELATED_BUT_DISTINCT_FEATURE|DISTINCT_FEATURE|UNCERTAIN","related_candidate_ids":["..."],"confidence":0.0,"rationale":"brief"}]}',
    "Never decide extraction authority. Never cross entity, root, or evidence-lane boundaries.",
    "Boundary: PROBE_ENTITY|product_service|commercial_product",
    `Candidates: ${JSON.stringify(candidates)}`
  ].join("\n\n");

  return Promise.all([
    callShape({ label: "compact_prompt_small_output", key, model, prompt: compactPrompt, maxOutputTokens: 128 }),
    callShape({ label: "compact_prompt_production_output", key, model, prompt: compactPrompt, maxOutputTokens: 8192 }),
    callShape({ label: "production_prompt_small_output", key, model, prompt: productionPrompt, maxOutputTokens: 128 }),
    callShape({ label: "production_prompt_production_output", key, model, prompt: productionPrompt, maxOutputTokens: 8192 })
  ]);
}

async function callShape({ label, key, model, prompt, maxOutputTokens }) {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(key)}`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: "application/json", maxOutputTokens }
    })
  });
  const raw = await response.text();
  let payload = {};
  try { payload = JSON.parse(raw); } catch {}
  const message = String(payload?.error?.message || raw || `HTTP_${response.status}`).replace(/AIza[0-9A-Za-z_-]+/g, "[REDACTED]").slice(0, 800);
  return {
    label,
    status: response.ok ? "PASS" : "FAIL",
    http_status: response.status,
    prompt_characters: prompt.length,
    request_bytes: Buffer.byteLength(prompt, "utf8"),
    max_output_tokens: maxOutputTokens,
    google_status: payload?.error?.status || null,
    message,
    content_type: response.headers.get("content-type") || null
  };
}
