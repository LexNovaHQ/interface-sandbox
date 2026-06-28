export async function onRequest(context) {
  const request = context.request;
  const env = context.env || {};
  const url = new URL(request.url);
  const backendBase = String(env.DILIGENCE_BACKEND_URL || "").trim().replace(/\/$/, "");

  if (request.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: securityHeaders()
    });
  }

  if (!backendBase) {
    return json({
      ok: false,
      error: "MISSING_DILIGENCE_BACKEND_URL",
      message: "Set DILIGENCE_BACKEND_URL in the Cloudflare Pages project environment."
    }, 500);
  }

  const forwardedPath = url.pathname.replace(/^\/api\/interface-diligence/, "") || "/";
  const target = new URL(`${forwardedPath}${url.search}`, backendBase);

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("content-length");
  headers.set("x-interface-proxy", "cloudflare-pages");

  const init = {
    method: request.method,
    headers,
    redirect: "manual"
  };

  if (!["GET", "HEAD"].includes(request.method.toUpperCase())) {
    init.body = request.body;
  }

  const upstream = await fetch(target.toString(), init);
  const responseHeaders = new Headers(upstream.headers);
  for (const [key, value] of securityHeaders()) {
    responseHeaders.set(key, value);
  }

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders
  });
}

function json(payload, status = 200) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      ...Object.fromEntries(securityHeaders())
    }
  });
}

function securityHeaders() {
  return new Map([
    ["cache-control", "no-store"],
    ["x-content-type-options", "nosniff"],
    ["referrer-policy", "no-referrer"]
  ]);
}
