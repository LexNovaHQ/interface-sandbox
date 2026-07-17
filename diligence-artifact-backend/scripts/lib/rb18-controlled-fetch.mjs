const PROVIDER_PASSTHROUGH_HOSTS = new Set(["generativelanguage.googleapis.com"]);

export function createRb18ControlledFetch({ originalFetch, allowedHosts, budgets, timeoutMs }) {
  if (typeof originalFetch !== "function") throw new Error("RB18_ORIGINAL_FETCH_MISSING");
  const allowed = new Set((allowedHosts || []).map(normaliseHost));
  const cache = new Map();
  const lanes = Object.fromEntries(Object.entries(budgets || {}).map(([lane, budget]) => [lane, laneState(budget)]));
  if (!lanes.other) lanes.other = laneState(10);
  const passthrough = { requests: 0, responses_by_status: {}, failures: 0 };

  async function controlledFetch(input, init = {}) {
    const url = new URL(typeof input === "string" || input instanceof URL ? String(input) : input.url);

    if (PROVIDER_PASSTHROUGH_HOSTS.has(normaliseHost(url.hostname))) {
      passthrough.requests += 1;
      try {
        const response = await originalFetch(url, init);
        passthrough.responses_by_status[response.status] = (passthrough.responses_by_status[response.status] || 0) + 1;
        return response;
      } catch (error) {
        passthrough.failures += 1;
        throw error;
      }
    }

    const lane = requestLane(init);
    const stats = lanes[lane] || lanes.other;
    if (!hostAllowed(url.hostname, allowed)) {
      stats.blocked_hosts += 1;
      return new Response("", { status: 403, statusText: "RB18_HOST_BLOCKED" });
    }

    const key = `${String(init.method || "GET").toUpperCase()} ${url.toString()}`;
    if (cache.has(key)) {
      stats.cache_hits += 1;
      return responseFromSnapshot(cache.get(key));
    }
    if (stats.network_requests >= stats.budget) {
      stats.budget_rejections += 1;
      return new Response("", { status: 429, statusText: "RB18_LANE_BUDGET_EXHAUSTED" });
    }

    stats.network_requests += 1;
    const abort = new AbortController();
    const timer = setTimeout(() => abort.abort(), timeoutMs);
    const externalSignal = init.signal;
    const onAbort = () => abort.abort();
    externalSignal?.addEventListener?.("abort", onAbort, { once: true });
    try {
      const response = await originalFetch(url, { ...init, signal: abort.signal, redirect: "follow" });
      const body = Buffer.from(await response.arrayBuffer());
      const snapshot = {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries()),
        body: body.toString("base64")
      };
      cache.set(key, snapshot);
      stats.responses_by_status[response.status] = (stats.responses_by_status[response.status] || 0) + 1;
      return responseFromSnapshot(snapshot);
    } catch (error) {
      if (error?.name === "AbortError") stats.timeouts += 1;
      else stats.failures += 1;
      throw error;
    } finally {
      clearTimeout(timer);
      externalSignal?.removeEventListener?.("abort", onAbort);
    }
  }

  return {
    fetch: controlledFetch,
    snapshot: () => ({
      schema_version: "PHASE1_RB18_NETWORK_LANES_v2_PROVIDER_PASSTHROUGH",
      allowed_hosts: [...allowed],
      provider_passthrough_hosts: [...PROVIDER_PASSTHROUGH_HOSTS],
      provider_passthrough: { ...passthrough },
      timeout_ms: timeoutMs,
      cache_entries: cache.size,
      lanes: Object.fromEntries(Object.entries(lanes).map(([lane, stats]) => [lane, {
        ...stats,
        budget_exhausted: stats.budget_rejections > 0
      }])),
      total_network_requests: Object.values(lanes).reduce((sum, item) => sum + item.network_requests, 0),
      total_cache_hits: Object.values(lanes).reduce((sum, item) => sum + item.cache_hits, 0)
    })
  };
}

function requestLane(init) {
  const userAgent = String(readHeader(init?.headers, "user-agent") || "").toLowerCase();
  if (userAgent.includes("phase1-agnostic-source-discovery")) return "discovery";
  if (userAgent.includes("phase1-broad-discovery-inventory")) return "broad_discovery";
  if (userAgent.includes("phase1-lightweight-fingerprint")) return "fingerprint";
  if (userAgent.includes("phase1-agnostic-source-extraction")) return "extraction";
  return "other";
}

function readHeader(headers, name) {
  if (!headers) return "";
  if (typeof headers.get === "function") return headers.get(name) || "";
  return Object.entries(headers).find(([key]) => key.toLowerCase() === name.toLowerCase())?.[1] || "";
}

function laneState(budget) {
  return {
    budget: positiveInt(budget, 10),
    network_requests: 0,
    cache_hits: 0,
    blocked_hosts: 0,
    budget_rejections: 0,
    timeouts: 0,
    failures: 0,
    responses_by_status: {}
  };
}

function responseFromSnapshot(snapshot) {
  return new Response(Buffer.from(snapshot.body, "base64"), {
    status: snapshot.status,
    statusText: snapshot.statusText,
    headers: snapshot.headers
  });
}

function hostAllowed(hostname, allowed) {
  const host = normaliseHost(hostname);
  return [...allowed].some((base) => host === base || host.endsWith(`.${base}`));
}
function normaliseHost(value) { return String(value || "").replace(/^www\./i, "").toLowerCase(); }
function positiveInt(value, fallback) { const parsed = Number.parseInt(String(value || ""), 10); return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback; }
