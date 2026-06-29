const params = new URLSearchParams(window.location.search);
const source = params.get("source") || "unknown";
const runId = params.get("run_id") || "";
const table = document.getElementById("handoffTable");
const back = document.getElementById("backToReport");

table.innerHTML = rows({
  source: source,
  run_id: runId || "missing",
  handoff_status: runId ? "received" : "missing run_id",
  current_layer: "vault placeholder",
  next_layer: "vault intake and assembly handoff"
});

if (runId) {
  back.href = `/interface-diligence/diligence-system/report.html?run_id=${encodeURIComponent(runId)}`;
} else {
  back.href = "/interface-diligence/diligence-system/";
  back.textContent = "Start Diligence Run";
}

function rows(object) {
  return Object.entries(object).map(([key, value]) => `<tr><th>${escapeHtml(titleCase(key))}</th><td>${escapeHtml(value)}</td></tr>`).join("");
}

function titleCase(value) {
  return String(value || "").replace(/[_-]+/g, " ").replace(/\b\w/g, (match) => match.toUpperCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
