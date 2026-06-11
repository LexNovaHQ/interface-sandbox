export async function onRequestPost({ request, env }) {
  const runtimeBase = env.RUNTIME_API_BASE_URL || env.RUNTIME_URL || env.LEXNOVA_RUNTIME_URL;
  const token = env.RUNTIME_ACCESS_TOKEN;

  if (!runtimeBase || !token) {
    return new Response(JSON.stringify({
      ok: false,
      service: "interface-sandbox",
      phase: "live_diligence_proxy",
      error_type: "RUNTIME_PROXY_NOT_CONFIGURED",
      error: "Live diligence proxy is missing RUNTIME_API_BASE_URL or RUNTIME_ACCESS_TOKEN."
    }), { status: 503, headers: { "content-type": "application/json" } });
  }

  let body;
  try {
    body = await request.json();
  } catch (error) {
    return new Response(JSON.stringify({
      ok: false,
      service: "interface-sandbox",
      phase: "live_diligence_proxy",
      error_type: "BAD_REQUEST",
      error: "Request body must be JSON."
    }), { status: 400, headers: { "content-type": "application/json" } });
  }

  const response = await fetch(`${String(runtimeBase).replace(/\/+$/, "")}/v1/diligence/live-run`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-runtime-access-token": token
    },
    body: JSON.stringify(body)
  });

  const text = await response.text();
  return new Response(text, {
    status: response.status,
    headers: {
      "content-type": response.headers.get("content-type") || "application/json",
      "cache-control": "no-store"
    }
  });
}

export async function onRequest({ request, env }) {
  if (request.method === "POST") return onRequestPost({ request, env });
  return new Response(JSON.stringify({
    ok: false,
    service: "interface-sandbox",
    phase: "live_diligence_proxy",
    error_type: "METHOD_NOT_ALLOWED",
    error: "Use POST."
  }), { status: 405, headers: { "content-type": "application/json", "allow": "POST" } });
}
