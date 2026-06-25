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
console.log("REPORT_READY", {
  run_id: report.run_id,
  sections: report.renderer_payload?.sections?.length || 0
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
