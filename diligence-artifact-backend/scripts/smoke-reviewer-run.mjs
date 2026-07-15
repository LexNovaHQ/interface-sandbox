const baseUrl = process.env.REVIEWER_BACKEND_URL || "http://localhost:8080";
const apiKey = process.env.GPT_ACTION_API_KEY || "";
const targetUrl = process.argv[2] || "https://sarvam.ai";

if (!apiKey) {
  console.error("Missing GPT_ACTION_API_KEY in environment.");
  process.exit(1);
}

const headers = {
  "content-type": "application/json",
  "x-ln-api-key": apiKey
};

const created = await request("/v1/reviewer/jobs", {
  method: "POST",
  body: JSON.stringify({ target_url: targetUrl, created_by: "smoke-reviewer-run" })
});

console.log("CREATED", created);

let status = created;
for (let i = 0; i < 20; i += 1) {
  const advanced = await request(`/v1/reviewer/jobs/${created.run_id}/advance`, {
    method: "POST",
    body: JSON.stringify({ max_steps: 1 })
  });
  console.log("ADVANCE", advanced.current_phase, advanced.status);
  status = advanced;
  if (advanced.current_phase === "COMPLETE" || advanced.status === "COMPLETE") break;
}

if (status.current_phase !== "COMPLETE" && status.status !== "COMPLETE") {
  console.error("Run did not complete.", status);
  process.exit(1);
}

const report = await request(`/v1/reviewer/report/${created.run_id}`, { method: "GET" });
const renderer = report.renderer_payload || {};
const reportArtifactRefs = Array.isArray(renderer.report_artifact_refs) ? renderer.report_artifact_refs : [];

if (Object.prototype.hasOwnProperty.call(renderer, "sections")) {
  throw new Error("SMOKE_REVIEWER_STALE_RENDERER_SHAPE:legacy_sections_property");
}
if (reportArtifactRefs.length !== 29) {
  throw new Error(`SMOKE_REVIEWER_REPORT_ARTIFACT_REF_COUNT:${reportArtifactRefs.length}:29`);
}
if (renderer.custody_artifact_rendering_forbidden !== true) {
  throw new Error("SMOKE_REVIEWER_CUSTODY_RENDERING_BOUNDARY_MISSING");
}

console.log("REPORT_READY", {
  run_id: report.run_id,
  renderer_source: renderer.renderer_source || "report_manifest_clean_profiles",
  report_artifact_refs: reportArtifactRefs.length,
  custody_artifact_rendering_forbidden: renderer.custody_artifact_rendering_forbidden === true
});

async function request(path, init) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { ...headers, ...(init.headers || {}) }
  });
  const json = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(`${response.status}:${JSON.stringify(json)}`);
  }
  return json;
}
