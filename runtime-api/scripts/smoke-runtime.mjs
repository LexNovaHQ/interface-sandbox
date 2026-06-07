#!/usr/bin/env node

const runtimeUrl = process.env.RUNTIME_URL || process.env.LEXNOVA_RUNTIME_URL;
const token = process.env.RUNTIME_ACCESS_TOKEN;

function fail(message, detail) {
  console.error(JSON.stringify({ ok: false, error: message, detail: detail || null }, null, 2));
  process.exit(1);
}

async function readJson(response) {
  const text = await response.text();
  try {
    return JSON.parse(text);
  } catch {
    return { non_json_body: text.slice(0, 1000) };
  }
}

if (!runtimeUrl) {
  fail("RUNTIME_URL or LEXNOVA_RUNTIME_URL is required for smoke:runtime");
}

if (!token) {
  fail("RUNTIME_ACCESS_TOKEN is required for smoke:runtime");
}

const base = runtimeUrl.replace(/\/+$/, "");
const headers = { "x-runtime-access-token": token };

const checks = [
  { name: "health", url: `${base}/health`, headers: {} },
  { name: "runtime_status", url: `${base}/v1/runtime-status`, headers }
];

const results = [];

for (const check of checks) {
  const response = await fetch(check.url, { method: "GET", headers: check.headers });
  const body = await readJson(response);
  results.push({ name: check.name, status: response.status, ok: response.ok, body });

  if (!response.ok || body?.service !== "lexnova-runtime-api") {
    fail(`Smoke check failed: ${check.name}`, { status: response.status, body });
  }
}

console.log(JSON.stringify({ ok: true, service: "lexnova-runtime-api", checks: results }, null, 2));
