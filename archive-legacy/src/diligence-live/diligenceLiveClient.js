const RUNTIME_LIVE_RUN_URL = "https://lexnova-runtime-api-24qnalslaa-uc.a.run.app/v1/diligence/public-live-run";

export async function runLiveDiligence({ targetUrl = "", documentText = "", companyName = "" } = {}) {
  const response = await fetch(RUNTIME_LIVE_RUN_URL, {
    method: "POST",
    mode: "cors",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      input: {
        target_url: String(targetUrl || "").trim() || null,
        document_text: String(documentText || "").trim() || null,
        company_name: String(companyName || "").trim() || null
      },
      options: {
        render_html: true,
        run_handoff: true
      }
    })
  });

  const text = await response.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    json = { ok: false, error_type: "NON_JSON_RESPONSE", error: text.slice(0, 2000) };
  }

  if (!response.ok || json?.ok === false) {
    const error = new Error(json?.error || `Live diligence run failed with status ${response.status}`);
    error.status = response.status;
    error.payload = json;
    throw error;
  }

  return json;
}

export function downloadTextFile(filename, content, mimeType = "application/json") {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function prettyJson(value) {
  return JSON.stringify(value, null, 2);
}
