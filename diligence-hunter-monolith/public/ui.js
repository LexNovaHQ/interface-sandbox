const $ = (id) => document.getElementById(id);
const runBtn = $("runBtn");
const statusEl = $("status");
const jsonOut = $("jsonOut");
const frame = $("reportFrame");

runBtn.addEventListener("click", async () => {
  runBtn.disabled = true;
  statusEl.textContent = "Starting single-call monolith run. Keep this tab open...";
  jsonOut.textContent = "";
  frame.srcdoc = "";

  const body = {
    source_mode: $("sourceMode").value,
    target_url: $("targetUrl").value.trim(),
    target_name: $("targetName").value.trim(),
    pasted_public_material: $("pasted").value.trim() || null,
    debug_raw: $("debugRaw").checked
  };

  try {
    const started = Date.now();
    const tick = setInterval(() => {
      const seconds = Math.round((Date.now() - started) / 1000);
      statusEl.textContent = `Running... ${seconds}s elapsed. This is one live Gemini grounded monolith call.`;
    }, 1000);

    const res = await fetch("/api/diligence/run", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body)
    });
    clearInterval(tick);
    const data = await res.json().catch(() => ({ ok:false, error:"NON_JSON_RESPONSE" }));
    jsonOut.textContent = JSON.stringify(data, null, 2);

    if (!res.ok || !data.ok) {
      statusEl.textContent = `FAILED: ${data.error || res.status}`;
      return;
    }

    statusEl.textContent = `SUCCESS. Model=${data.model_used}; key=${data.key_index_used}; elapsed=${data.elapsed_ms}ms`;
    frame.srcdoc = data.html_report || "<p>No HTML report returned.</p>";
  } catch (err) {
    statusEl.textContent = `ERROR: ${err.message || String(err)}`;
  } finally {
    runBtn.disabled = false;
  }
});
