const url = process.env.ARTIFACT_BACKEND_URL || "http://localhost:8080";

const response = await fetch(`${url.replace(/\/$/, "")}/health`);
const data = await response.json();

if (!response.ok || !data.ok) {
  console.error(JSON.stringify(data, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, service: data.service, mode: data.mode }, null, 2));
