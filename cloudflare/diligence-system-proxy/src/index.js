const ALLOWED_PREFIXES = [
  "/interface-diligence/diligence-system",
  "/public/",
  "/vault",
  "/health"
];

export default {
  async fetch(request, env) {
    const incomingUrl = new URL(request.url);
    const path = incomingUrl.pathname;

    if (path === "/interface-diligence/diligence-system") {
      return Response.redirect(`${incomingUrl.origin}/interface-diligence/diligence-system/`, 301);
    }

    if (path === "/vault") {
      return Response.redirect(`${incomingUrl.origin}/vault/intake.html`, 301);
    }

    if (!isAllowedPath(path)) {
      return new Response("Not found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    const origin = normalizeOrigin(env.BACKEND_ORIGIN);
    if (!origin) {
      return new Response("Cloudflare proxy is missing BACKEND_ORIGIN.", {
        status: 502,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "cache-control": "no-store"
        }
      });
    }

    const originUrl = new URL(request.url);
    const backend = new URL(origin);
    originUrl.protocol = backend.protocol;
    originUrl.hostname = backend.hostname;
    originUrl.port = backend.port;

    const headers = new Headers(request.headers);
    headers.set("x-forwarded-host", incomingUrl.host);
    headers.set("x-forwarded-proto", "https");
    headers.set("x-interface-public-proxy", "diligence-system");

    const proxiedRequest = new Request(originUrl.toString(), {
      method: request.method,
      headers,
      body: bodyAllowed(request.method) ? request.body : undefined,
      redirect: "manual"
    });

    const response = await fetch(proxiedRequest);
    const responseHeaders = new Headers(response.headers);
    responseHeaders.set("x-interface-public-proxy", "diligence-system");

    if (path.startsWith("/public/") || path === "/health") {
      responseHeaders.set("cache-control", "no-store");
    }

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders
    });
  }
};

function isAllowedPath(path) {
  return ALLOWED_PREFIXES.some((prefix) => path === prefix || path.startsWith(prefix));
}

function normalizeOrigin(value) {
  const raw = String(value || "").trim().replace(/\/$/, "");
  if (!raw || raw.includes("REPLACE_WITH_CLOUD_RUN_ORIGIN")) return "";
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:") return "";
    return url.toString().replace(/\/$/, "");
  } catch (_error) {
    return "";
  }
}

function bodyAllowed(method) {
  return !["GET", "HEAD"].includes(String(method || "GET").toUpperCase());
}
